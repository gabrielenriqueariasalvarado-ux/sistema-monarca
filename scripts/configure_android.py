import os
import textwrap

# ==============================================================================
# CONFIGURACIÓN NATIVA ANDROID · SISTEMA MONARCA (v10.53)
# Motor de Alarma Despertador con Foreground Service, BootReceiver,
# Tono MP3 personalizado, Diagnóstico de Permisos y Soporte HyperOS/Xiaomi
# ==============================================================================

java_dir = 'android/app/src/main/java/com/monarca/app'
os.makedirs(java_dir, exist_ok=True)


def write_java(filename, code):
    path = os.path.join(java_dir, filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(textwrap.dedent(code).lstrip())
    print(f"{filename} creada exitosamente")


# ------------------------------------------------------------------------------
# 1. AlarmStore.java: Persistencia JSON en SharedPreferences, programación exacta
#    con AlarmManager.setAlarmClock, repetición diaria y cola de acciones nativas
# ------------------------------------------------------------------------------
write_java('AlarmStore.java', '''
package com.monarca.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public class AlarmStore {
    private static final String PREFS_NAME = "monarca_alarms_prefs";
    private static final String KEY_ALARMS = "scheduled_alarms_json";
    private static final String KEY_PENDING_ACTIONS = "pending_actions_json";
    public static final int TEST_ALARM_ID = 999999;

    public static class AlarmEntry {
        public String key;
        public int intId;
        public String questId;
        public String titulo;
        public String penitencia;
        public boolean esOmitible;
        public long timestamp;
        public int hora;
        public int minutos;
        public boolean repetirDiario;
        public String tono;

        public JSONObject toJson() {
            JSONObject obj = new JSONObject();
            try {
                obj.put("key", key != null ? key : "");
                obj.put("intId", intId);
                obj.put("questId", questId != null ? questId : "");
                obj.put("titulo", titulo != null ? titulo : "Quest Diaria");
                obj.put("penitencia", penitencia != null ? penitencia : "30 Flexiones inmediatas");
                obj.put("esOmitible", esOmitible);
                obj.put("timestamp", timestamp);
                obj.put("hora", hora);
                obj.put("minutos", minutos);
                obj.put("repetirDiario", repetirDiario);
                obj.put("tono", tono != null ? tono : "default");
            } catch (Exception ignored) {}
            return obj;
        }

        public static AlarmEntry fromJson(JSONObject obj) {
            AlarmEntry e = new AlarmEntry();
            e.key = obj.optString("key", "");
            e.intId = obj.optInt("intId", computeId(e.key));
            e.questId = obj.optString("questId", "");
            e.titulo = obj.optString("titulo", "Quest Diaria");
            e.penitencia = obj.optString("penitencia", "30 Flexiones inmediatas");
            e.esOmitible = obj.optBoolean("esOmitible", true);
            e.timestamp = obj.optLong("timestamp", 0L);
            e.hora = obj.optInt("hora", 8);
            e.minutos = obj.optInt("minutos", 0);
            e.repetirDiario = obj.optBoolean("repetirDiario", false);
            e.tono = obj.optString("tono", "default");
            return e;
        }
    }

    public static int computeId(String rawId) {
        if (rawId == null || rawId.isEmpty()) return 1001;
        try {
            int parsed = Math.abs(Integer.parseInt(rawId));
            if (parsed == TEST_ALARM_ID) return 999998;
            return parsed > 0 ? parsed : 1001;
        } catch (Exception ignored) {
            int h = Math.abs(rawId.hashCode());
            return 1000 + (h % 890000);
        }
    }

    private static SharedPreferences getPrefs(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static synchronized List<AlarmEntry> loadAlarms(Context ctx) {
        List<AlarmEntry> list = new ArrayList<>();
        try {
            String raw = getPrefs(ctx).getString(KEY_ALARMS, "[]");
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.optJSONObject(i);
                if (obj != null) {
                    list.add(AlarmEntry.fromJson(obj));
                }
            }
        } catch (Exception ignored) {}
        return list;
    }

    private static synchronized void saveAlarms(Context ctx, List<AlarmEntry> list) {
        try {
            JSONArray arr = new JSONArray();
            for (AlarmEntry e : list) {
                arr.put(e.toJson());
            }
            getPrefs(ctx).edit().putString(KEY_ALARMS, arr.toString()).commit();
        } catch (Exception ignored) {}
    }

    public static synchronized void syncAlarms(Context ctx, List<AlarmEntry> newList) {
        List<AlarmEntry> prevList = loadAlarms(ctx);
        for (AlarmEntry old : prevList) {
            cancelSystemAlarm(ctx, old.intId);
        }

        List<AlarmEntry> savedList = new ArrayList<>();
        long now = System.currentTimeMillis();
        for (AlarmEntry entry : newList) {
            if (entry == null) continue;
            if (entry.key == null || entry.key.isEmpty()) {
                entry.key = "alarm_" + entry.intId;
            }
            if (entry.intId <= 0) {
                entry.intId = computeId(entry.key);
            }
            if (entry.timestamp > now) {
                savedList.add(entry);
                scheduleSystemAlarm(ctx, entry);
            }
        }
        saveAlarms(ctx, savedList);
    }

    public static synchronized void upsertAndSchedule(Context ctx, AlarmEntry entry) {
        if (entry == null) return;
        if (entry.key == null || entry.key.isEmpty()) {
            entry.key = "alarm_" + entry.intId;
        }
        if (entry.intId <= 0) {
            entry.intId = computeId(entry.key);
        }

        List<AlarmEntry> list = loadAlarms(ctx);
        List<AlarmEntry> updated = new ArrayList<>();
        for (AlarmEntry item : list) {
            if (entry.key.equals(item.key) || item.intId == entry.intId) {
                cancelSystemAlarm(ctx, item.intId);
            } else {
                updated.add(item);
            }
        }
        if (entry.timestamp > System.currentTimeMillis()) {
            updated.add(entry);
            scheduleSystemAlarm(ctx, entry);
        }
        saveAlarms(ctx, updated);
    }

    public static synchronized void removeAndCancel(Context ctx, String keyOrId) {
        int targetIntId = computeId(keyOrId);
        cancelSystemAlarm(ctx, targetIntId);

        List<AlarmEntry> list = loadAlarms(ctx);
        List<AlarmEntry> updated = new ArrayList<>();
        for (AlarmEntry item : list) {
            if ((keyOrId != null && (keyOrId.equals(item.key) || keyOrId.equals(item.questId)))
                || item.intId == targetIntId) {
                cancelSystemAlarm(ctx, item.intId);
            } else {
                updated.add(item);
            }
        }
        saveAlarms(ctx, updated);
    }

    public static synchronized void scheduleNextDayIfRecurring(Context ctx, int intId) {
        if (intId == TEST_ALARM_ID) return;

        List<AlarmEntry> list = loadAlarms(ctx);
        boolean modified = false;
        List<AlarmEntry> updated = new ArrayList<>();
        long now = System.currentTimeMillis();

        for (AlarmEntry item : list) {
            if (item.intId == intId) {
                modified = true;
                if (item.repetirDiario) {
                    Calendar cal = Calendar.getInstance();
                    cal.set(Calendar.HOUR_OF_DAY, item.hora);
                    cal.set(Calendar.MINUTE, item.minutos);
                    cal.set(Calendar.SECOND, 0);
                    cal.set(Calendar.MILLISECOND, 0);
                    cal.add(Calendar.DAY_OF_YEAR, 1);
                    while (cal.getTimeInMillis() <= now + 5000L) {
                        cal.add(Calendar.DAY_OF_YEAR, 1);
                    }
                    item.timestamp = cal.getTimeInMillis();
                    updated.add(item);
                    scheduleSystemAlarm(ctx, item);
                }
            } else {
                updated.add(item);
            }
        }

        if (modified) {
            saveAlarms(ctx, updated);
        }
    }

    public static synchronized void scheduleSnooze(Context ctx, String questId, String titulo, String penitencia, String tono) {
        if ("__test__".equals(questId)) {
            recordPendingAction(ctx, "test_snooze", questId, System.currentTimeMillis(), 0L);
            return;
        }
        long now = System.currentTimeMillis();
        long nextTime = now + (60L * 60L * 1000L);

        AlarmEntry snoozeEntry = new AlarmEntry();
        String safeQid = (questId != null && !questId.isEmpty()) ? questId : String.valueOf(now);
        snoozeEntry.key = "snooze_" + safeQid;
        snoozeEntry.intId = computeId(snoozeEntry.key);
        snoozeEntry.questId = safeQid;
        String cleanTitle = (titulo != null && !titulo.isEmpty()) ? titulo : "Quest Diaria";
        if (!cleanTitle.startsWith("⏰")) {
            cleanTitle = "⏰ Gracia terminada: " + cleanTitle;
        }
        snoozeEntry.titulo = cleanTitle;
        snoozeEntry.penitencia = (penitencia != null && !penitencia.isEmpty()) ? penitencia : "30 Flexiones inmediatas";
        snoozeEntry.esOmitible = false;
        snoozeEntry.timestamp = nextTime;
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(nextTime);
        snoozeEntry.hora = cal.get(Calendar.HOUR_OF_DAY);
        snoozeEntry.minutos = cal.get(Calendar.MINUTE);
        snoozeEntry.repetirDiario = false;
        snoozeEntry.tono = (tono != null && !tono.isEmpty()) ? tono : "default";

        upsertAndSchedule(ctx, snoozeEntry);
        recordPendingAction(ctx, "snooze", safeQid, now, nextTime);
    }

    public static synchronized void rescheduleAll(Context ctx) {
        List<AlarmEntry> list = loadAlarms(ctx);
        List<AlarmEntry> updated = new ArrayList<>();
        long now = System.currentTimeMillis();

        for (AlarmEntry item : list) {
            if (item.repetirDiario) {
                if (item.timestamp <= now) {
                    Calendar cal = Calendar.getInstance();
                    cal.set(Calendar.HOUR_OF_DAY, item.hora);
                    cal.set(Calendar.MINUTE, item.minutos);
                    cal.set(Calendar.SECOND, 0);
                    cal.set(Calendar.MILLISECOND, 0);
                    while (cal.getTimeInMillis() <= now + 5000L) {
                        cal.add(Calendar.DAY_OF_YEAR, 1);
                    }
                    item.timestamp = cal.getTimeInMillis();
                }
                updated.add(item);
                scheduleSystemAlarm(ctx, item);
            } else {
                if (item.timestamp > now - 60000L) {
                    if (item.timestamp <= now) {
                        item.timestamp = now + 3000L;
                    }
                    updated.add(item);
                    scheduleSystemAlarm(ctx, item);
                }
            }
        }
        saveAlarms(ctx, updated);
    }

    public static void scheduleTestAlarm(Context ctx, int seconds, String tono) {
        long targetMillis = System.currentTimeMillis() + (seconds * 1000L);
        AlarmEntry testEntry = new AlarmEntry();
        testEntry.key = "__test_alarm__";
        testEntry.intId = TEST_ALARM_ID;
        testEntry.questId = "__test__";
        testEntry.titulo = "Prueba de Alarma Emily";
        testEntry.penitencia = "Verificación de pantalla de bloqueo y audio despertador";
        testEntry.esOmitible = true;
        testEntry.timestamp = targetMillis;
        testEntry.repetirDiario = false;
        testEntry.tono = (tono != null && !tono.isEmpty()) ? tono : "default";
        scheduleSystemAlarm(ctx, testEntry);
    }

    public static void scheduleSystemAlarm(Context ctx, AlarmEntry entry) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(ctx, MonarcaAlarmReceiver.class);
        intent.setAction("com.monarca.app.ALARM_" + entry.intId);
        intent.putExtra("id", entry.intId);
        intent.putExtra("questId", entry.questId);
        intent.putExtra("titulo", entry.titulo);
        intent.putExtra("penitencia", entry.penitencia);
        intent.putExtra("esOmitible", entry.esOmitible);
        intent.putExtra("repetirDiario", entry.repetirDiario);
        intent.putExtra("hora", entry.hora);
        intent.putExtra("minutos", entry.minutos);
        intent.putExtra("tono", entry.tono);
        intent.putExtra("timestamp", entry.timestamp);

        PendingIntent broadcastPi = PendingIntent.getBroadcast(
            ctx,
            entry.intId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        try {
            Intent showIntent = new Intent(ctx, MainActivity.class);
            showIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            showIntent.putExtra("questId", entry.questId);
            PendingIntent showPi = PendingIntent.getActivity(
                ctx,
                entry.intId + 2000000,
                showIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, entry.timestamp, broadcastPi);
            } else {
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(entry.timestamp, showPi), broadcastPi);
            }
        } catch (SecurityException se) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, entry.timestamp, broadcastPi);
                } else {
                    am.set(AlarmManager.RTC_WAKEUP, entry.timestamp, broadcastPi);
                }
            } catch (Exception ignored) {}
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void cancelSystemAlarm(Context ctx, int intId) {
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            Intent intent = new Intent(ctx, MonarcaAlarmReceiver.class);
            intent.setAction("com.monarca.app.ALARM_" + intId);
            PendingIntent pi = PendingIntent.getBroadcast(
                ctx,
                intId,
                intent,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );
            if (pi != null) {
                am.cancel(pi);
                pi.cancel();
            }
        } catch (Exception ignored) {}
    }

    public static synchronized void recordPendingAction(Context ctx, String tipo, String questId, long timestamp, long snoozeUntil) {
        try {
            String raw = getPrefs(ctx).getString(KEY_PENDING_ACTIONS, "[]");
            JSONArray arr = new JSONArray(raw);
            JSONArray next = new JSONArray();
            int start = Math.max(0, arr.length() - 24);
            for (int i = start; i < arr.length(); i++) {
                next.put(arr.get(i));
            }
            JSONObject act = new JSONObject();
            act.put("tipo", tipo != null ? tipo : "start");
            act.put("questId", questId != null ? questId : "");
            act.put("timestamp", timestamp > 0 ? timestamp : System.currentTimeMillis());
            if (snoozeUntil > 0) {
                act.put("snoozeUntil", snoozeUntil);
            }
            next.put(act);
            getPrefs(ctx).edit().putString(KEY_PENDING_ACTIONS, next.toString()).commit();
        } catch (Exception ignored) {}
    }

    public static synchronized JSONArray consumePendingActions(Context ctx) {
        JSONArray result = new JSONArray();
        try {
            String raw = getPrefs(ctx).getString(KEY_PENDING_ACTIONS, "[]");
            result = new JSONArray(raw);
            if (result.length() > 0) {
                getPrefs(ctx).edit().putString(KEY_PENDING_ACTIONS, "[]").commit();
            }
        } catch (Exception ignored) {}
        return result;
    }
}
''')


# ------------------------------------------------------------------------------
# 2. MonarcaAlarmService.java: Foreground Service en canal de Alarma (USAGE_ALARM)
#    Mantiene sonido + vibración aunque HyperOS bloquee ventanas emergentes.
# ------------------------------------------------------------------------------
write_java('MonarcaAlarmService.java', '''
package com.monarca.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;
import java.io.File;

public class MonarcaAlarmService extends Service {
    public static final String CHANNEL_ID = "monarca_alarm_service_channel_v2";
    public static final int NOTIF_ID = 77701;
    public static final String ACTION_START = "com.monarca.app.ACTION_ALARM_START";
    public static final String ACTION_STOP = "com.monarca.app.ACTION_ALARM_STOP";
    public static final String ACTION_SNOOZE = "com.monarca.app.ACTION_ALARM_SNOOZE";

    private static volatile MonarcaAlarmService activeInstance = null;

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private ToneGenerator fallbackToneGen;
    private PowerManager.WakeLock partialWakeLock;
    private PowerManager.WakeLock screenWakeLock;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable autoSilenceRunnable;
    private Runnable fallbackBeepRunnable;

    private String currentQuestId = "";
    private String currentTitulo = "Quest Diaria Activada";
    private String currentPenitencia = "30 Flexiones inmediatas";
    private boolean currentEsOmitible = true;
    private String currentTono = "default";

    public static void stopAlarm(Context ctx) {
        MonarcaAlarmService inst = activeInstance;
        if (inst != null) {
            inst.cleanupMediaAndLocks();
        }
        try {
            ctx.stopService(new Intent(ctx, MonarcaAlarmService.class));
        } catch (Exception ignored) {}
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        activeInstance = this;
        String action = intent != null ? intent.getAction() : ACTION_START;

        if (ACTION_STOP.equals(action)) {
            cleanupMediaAndLocks();
            stopForegroundCompat();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_SNOOZE.equals(action)) {
            String qId = (intent != null && intent.hasExtra("questId")) ? intent.getStringExtra("questId") : currentQuestId;
            String tit = (intent != null && intent.hasExtra("titulo")) ? intent.getStringExtra("titulo") : currentTitulo;
            String pen = (intent != null && intent.hasExtra("penitencia")) ? intent.getStringExtra("penitencia") : currentPenitencia;
            String ton = (intent != null && intent.hasExtra("tono")) ? intent.getStringExtra("tono") : currentTono;

            AlarmStore.scheduleSnooze(this, qId, tit, pen, ton);
            AlarmAlertActivity.closeIfOpen();
            MonarcaAlarmPlugin.emitAlarmAction("snooze", qId);

            cleanupMediaAndLocks();
            stopForegroundCompat();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (intent != null) {
            String qId = intent.getStringExtra("questId");
            String tit = intent.getStringExtra("titulo");
            String pen = intent.getStringExtra("penitencia");
            String ton = intent.getStringExtra("tono");
            currentQuestId = qId != null ? qId : "";
            currentTitulo = (tit != null && !tit.isEmpty()) ? tit : "Quest Diaria Activada";
            currentPenitencia = (pen != null && !pen.isEmpty()) ? pen : "30 Flexiones inmediatas";
            currentEsOmitible = intent.getBooleanExtra("esOmitible", true);
            currentTono = (ton != null && !ton.isEmpty()) ? ton : "default";
        }

        ensureAlarmChannel(this);

        Intent alertIntent = new Intent(this, AlarmAlertActivity.class);
        alertIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        alertIntent.putExtra("questId", currentQuestId);
        alertIntent.putExtra("titulo", currentTitulo);
        alertIntent.putExtra("penitencia", currentPenitencia);
        alertIntent.putExtra("esOmitible", currentEsOmitible);
        alertIntent.putExtra("tono", currentTono);

        PendingIntent fullScreenPi = PendingIntent.getActivity(
            this,
            77702,
            alertIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent startMainIntent = new Intent(this, MainActivity.class);
        startMainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startMainIntent.putExtra("questId", currentQuestId);
        startMainIntent.putExtra("alarmAction", "start");
        startMainIntent.putExtra("fromAlarm", true);
        PendingIntent startMainPi = PendingIntent.getActivity(
            this,
            77703,
            startMainIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String titlePrefix = currentEsOmitible ? "⏰ " : "🚨 ";
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(titlePrefix + currentTitulo)
            .setContentText("💀 Castigo: " + currentPenitencia)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(fullScreenPi, true)
            .setContentIntent(fullScreenPi)
            .addAction(android.R.drawable.ic_media_play, "⚔️ Empezar", startMainPi);

        if (currentEsOmitible) {
            Intent snoozeSvcIntent = new Intent(this, MonarcaAlarmService.class);
            snoozeSvcIntent.setAction(ACTION_SNOOZE);
            snoozeSvcIntent.putExtra("questId", currentQuestId);
            snoozeSvcIntent.putExtra("titulo", currentTitulo);
            snoozeSvcIntent.putExtra("penitencia", currentPenitencia);
            snoozeSvcIntent.putExtra("tono", currentTono);
            PendingIntent snoozePi = PendingIntent.getService(
                this,
                77704,
                snoozeSvcIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            builder.addAction(android.R.drawable.ic_popup_reminder, "⏸️ Posponer 1h", snoozePi);
        }

        Notification notification = builder.build();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIF_ID, notification);
        }

        acquireWakeLocks();
        startAlarmAudio(currentTono);
        startAlarmVibration();
        scheduleAutoSilence();

        // Intentar abrir la pantalla nativa (funciona también con pantalla desbloqueada si el sistema/HyperOS lo permite)
        try {
            startActivity(alertIntent);
        } catch (Exception ignored) {}

        return START_NOT_STICKY;
    }

    public static void ensureAlarmChannel(Context ctx) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && ctx != null) {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Alarmas Despertadoras Monarca",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Alarmas críticas a pantalla completa y sonido continuo");
                channel.setSound(null, null);
                channel.enableVibration(false);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                channel.setBypassDnd(true);
                nm.createNotificationChannel(channel);
            }
        }
    }

    @SuppressWarnings("deprecation")
    private void acquireWakeLocks() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm == null) return;

            if (partialWakeLock == null) {
                partialWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Monarca:AlarmServiceCpu");
            }
            if (!partialWakeLock.isHeld()) {
                partialWakeLock.acquire(16 * 60 * 1000L);
            }

            if (screenWakeLock == null) {
                screenWakeLock = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                    "Monarca:AlarmServiceScreen"
                );
            }
            if (!screenWakeLock.isHeld()) {
                screenWakeLock.acquire(10000L);
            }
        } catch (Exception ignored) {}
    }

    private void startAlarmAudio(String tono) {
        stopAudioOnly();
        AudioAttributes alarmAttrs = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();

        boolean started = false;
        if (tono != null && !tono.isEmpty() && !"default".equals(tono) && !tono.startsWith("tono_")) {
            try {
                File tonesDir = new File(getFilesDir(), "alarm_tones");
                String safeName = new File(tono).getName();
                File customFile = new File(tonesDir, safeName);
                if (customFile.exists() && customFile.length() > 0) {
                    mediaPlayer = new MediaPlayer();
                    mediaPlayer.setAudioAttributes(alarmAttrs);
                    mediaPlayer.setDataSource(customFile.getAbsolutePath());
                    mediaPlayer.setLooping(true);
                    mediaPlayer.prepare();
                    mediaPlayer.start();
                    started = true;
                }
            } catch (Exception e) {
                stopAudioOnly();
            }
        }

        if (!started) {
            try {
                Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (alarmUri == null) alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                if (alarmUri == null) alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                if (alarmUri != null) {
                    mediaPlayer = new MediaPlayer();
                    mediaPlayer.setAudioAttributes(alarmAttrs);
                    mediaPlayer.setDataSource(getApplicationContext(), alarmUri);
                    mediaPlayer.setLooping(true);
                    mediaPlayer.prepare();
                    mediaPlayer.start();
                    started = true;
                }
            } catch (Exception e) {
                stopAudioOnly();
            }
        }

        if (!started) {
            startFallbackToneGenerator();
        }
    }

    private void startFallbackToneGenerator() {
        try {
            fallbackToneGen = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
            fallbackBeepRunnable = new Runnable() {
                @Override
                public void run() {
                    if (fallbackToneGen != null) {
                        try {
                            fallbackToneGen.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 600);
                        } catch (Exception ignored) {}
                        mainHandler.postDelayed(this, 1100L);
                    }
                }
            };
            mainHandler.post(fallbackBeepRunnable);
        } catch (Exception ignored) {}
    }

    @SuppressWarnings("deprecation")
    private void startAlarmVibration() {
        try {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 600, 300, 600, 300, 1000};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    VibrationAttributes attrs = new VibrationAttributes.Builder()
                        .setUsage(VibrationAttributes.USAGE_ALARM)
                        .build();
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0), attrs);
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    AudioAttributes aa = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0), aa);
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception ignored) {}
    }

    private void scheduleAutoSilence() {
        if (autoSilenceRunnable != null) {
            mainHandler.removeCallbacks(autoSilenceRunnable);
        }
        autoSilenceRunnable = new Runnable() {
            @Override
            public void run() {
                cleanupMediaAndLocks();
                stopForegroundCompat();
                stopSelf();
            }
        };
        mainHandler.postDelayed(autoSilenceRunnable, 15 * 60 * 1000L);
    }

    private void stopAudioOnly() {
        if (fallbackBeepRunnable != null) {
            mainHandler.removeCallbacks(fallbackBeepRunnable);
            fallbackBeepRunnable = null;
        }
        if (fallbackToneGen != null) {
            try { fallbackToneGen.release(); } catch (Exception ignored) {}
            fallbackToneGen = null;
        }
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }

    public synchronized void cleanupMediaAndLocks() {
        if (autoSilenceRunnable != null) {
            mainHandler.removeCallbacks(autoSilenceRunnable);
            autoSilenceRunnable = null;
        }
        stopAudioOnly();
        if (vibrator != null) {
            try { vibrator.cancel(); } catch (Exception ignored) {}
            vibrator = null;
        }
        if (screenWakeLock != null && screenWakeLock.isHeld()) {
            try { screenWakeLock.release(); } catch (Exception ignored) {}
        }
        if (partialWakeLock != null && partialWakeLock.isHeld()) {
            try { partialWakeLock.release(); } catch (Exception ignored) {}
        }
    }

    @SuppressWarnings("deprecation")
    private void stopForegroundCompat() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onDestroy() {
        cleanupMediaAndLocks();
        if (activeInstance == this) {
            activeInstance = null;
        }
        super.onDestroy();
    }
}
''')


# ------------------------------------------------------------------------------
# 3. AlarmAlertActivity.java: Pantalla nativa de alarma (Emily OS Dark Glass UI)
# ------------------------------------------------------------------------------
write_java('AlarmAlertActivity.java', '''
package com.monarca.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AlarmAlertActivity extends Activity {
    private static volatile AlarmAlertActivity activeInstance = null;
    private final Handler clockHandler = new Handler(Looper.getMainLooper());
    private Runnable clockRunnable = null;
    private TextView liveClockView = null;
    private TextView liveSecAmPmView = null;

    public static void closeIfOpen() {
        AlarmAlertActivity inst = activeInstance;
        if (inst != null && !inst.isFinishing()) {
            inst.runOnUiThread(() -> {
                try {
                    if (!inst.isFinishing()) inst.finish();
                } catch (Exception ignored) {}
            });
        }
    }

    public static synchronized void stopAlarmSound() {
        AlarmAlertActivity inst = activeInstance;
        if (inst != null) {
            MonarcaAlarmService.stopAlarm(inst);
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        activeInstance = this;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(Color.parseColor("#040711"));
            getWindow().setNavigationBarColor(Color.parseColor("#0b1024"));
        }

        renderFromIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        renderFromIntent(intent);
    }

    private int dp(int value) {
        float d = getResources().getDisplayMetrics().density;
        return Math.round(value * d);
    }

    private void stopClockUpdates() {
        if (clockRunnable != null) {
            clockHandler.removeCallbacks(clockRunnable);
            clockRunnable = null;
        }
    }

    private void startClockUpdates() {
        stopClockUpdates();
        clockRunnable = new Runnable() {
            @Override
            public void run() {
                if (liveClockView != null && liveSecAmPmView != null) {
                    Date now = new Date();
                    String hm = new SimpleDateFormat("hh:mm", Locale.getDefault()).format(now);
                    String secAm = new SimpleDateFormat("ss a", Locale.US).format(now).toUpperCase(Locale.US);
                    liveClockView.setText(hm);
                    liveSecAmPmView.setText(secAm);
                }
                clockHandler.postDelayed(this, 1000L);
            }
        };
        clockHandler.post(clockRunnable);
    }

    private void renderFromIntent(Intent intent) {
        String titulo = intent != null ? intent.getStringExtra("titulo") : null;
        if (titulo == null || titulo.isEmpty()) titulo = "Quest Diaria Activada";

        String penitencia = intent != null ? intent.getStringExtra("penitencia") : null;
        if (penitencia == null || penitencia.isEmpty()) penitencia = "30 Flexiones inmediatas";

        boolean esOmitible = intent == null || intent.getBooleanExtra("esOmitible", true);
        String questId = intent != null ? intent.getStringExtra("questId") : "";
        if (questId == null) questId = "";
        String tono = intent != null ? intent.getStringExtra("tono") : "default";
        if (tono == null) tono = "default";

        final String finalQuestId = questId;
        final String finalTitulo = titulo;
        final String finalPenitencia = penitencia;
        final String finalTono = tono;

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        GradientDrawable bgGrad = new GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            esOmitible
                ? new int[] { Color.parseColor("#040711"), Color.parseColor("#0d152e"), Color.parseColor("#18193d") }
                : new int[] { Color.parseColor("#0a050b"), Color.parseColor("#1f0b18"), Color.parseColor("#291020") }
        );
        scroll.setBackground(bgGrad);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setPadding(dp(24), dp(36), dp(24), dp(28));

        // 1. Pill superior EMILY OS
        TextView appPill = new TextView(this);
        appPill.setText("✦ EMILY OS · ALARMA");
        appPill.setTextSize(11.5f);
        appPill.setTypeface(Typeface.DEFAULT_BOLD);
        appPill.setTextColor(Color.parseColor(esOmitible ? "#7dd3fc" : "#fda4af"));
        appPill.setLetterSpacing(0.14f);
        appPill.setPadding(dp(14), dp(6), dp(14), dp(6));
        GradientDrawable appPillBg = new GradientDrawable();
        appPillBg.setColor(Color.parseColor(esOmitible ? "#182449" : "#3a1322"));
        appPillBg.setCornerRadius(dp(50));
        appPillBg.setStroke(dp(1), Color.parseColor(esOmitible ? "#38bdf8" : "#f43f5e"));
        appPill.setBackground(appPillBg);
        root.addView(appPill);

        // 2. Reloj digital en vivo (HH:MM + SS AM/PM)
        LinearLayout clockRow = new LinearLayout(this);
        clockRow.setOrientation(LinearLayout.HORIZONTAL);
        clockRow.setGravity(Gravity.CENTER_HORIZONTAL | Gravity.BOTTOM);
        clockRow.setPadding(0, dp(22), 0, dp(8));

        liveClockView = new TextView(this);
        liveClockView.setText("00:00");
        liveClockView.setTextSize(58f);
        liveClockView.setTypeface(Typeface.DEFAULT_BOLD);
        liveClockView.setTextColor(Color.parseColor("#f8fafc"));
        clockRow.addView(liveClockView);

        liveSecAmPmView = new TextView(this);
        liveSecAmPmView.setText("00 AM");
        liveSecAmPmView.setTextSize(16f);
        liveSecAmPmView.setTypeface(Typeface.DEFAULT_BOLD);
        liveSecAmPmView.setTextColor(Color.parseColor(esOmitible ? "#38bdf8" : "#fb7185"));
        liveSecAmPmView.setPadding(dp(8), 0, 0, dp(10));
        clockRow.addView(liveSecAmPmView);

        root.addView(clockRow);

        // 3. Emblema circular luminoso
        TextView emblemView = new TextView(this);
        emblemView.setText(esOmitible ? "✦" : "⚡");
        emblemView.setTextSize(32f);
        emblemView.setTypeface(Typeface.DEFAULT_BOLD);
        emblemView.setTextColor(Color.WHITE);
        emblemView.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams embParams = new LinearLayout.LayoutParams(dp(74), dp(74));
        embParams.setMargins(0, dp(10), 0, dp(16));
        emblemView.setLayoutParams(embParams);
        GradientDrawable embBg = new GradientDrawable(
            GradientDrawable.Orientation.TL_BR,
            esOmitible
                ? new int[] { Color.parseColor("#38bdf8"), Color.parseColor("#6366f1") }
                : new int[] { Color.parseColor("#f43f5e"), Color.parseColor("#f97316") }
        );
        embBg.setShape(GradientDrawable.OVAL);
        embBg.setStroke(dp(2), Color.parseColor(esOmitible ? "#bae6fd" : "#fecdd3"));
        emblemView.setBackground(embBg);
        root.addView(emblemView);

        // 4. Etiqueta de tipo y Título de la Misión
        TextView badgeView = new TextView(this);
        badgeView.setText(esOmitible ? "MISIÓN PROGRAMADA ACTIVA" : "MISIÓN OBLIGATORIA · NO OMITIBLE");
        badgeView.setTextSize(12f);
        badgeView.setTypeface(Typeface.DEFAULT_BOLD);
        badgeView.setLetterSpacing(0.08f);
        badgeView.setTextColor(Color.parseColor(esOmitible ? "#38bdf8" : "#fbbf24"));
        badgeView.setGravity(Gravity.CENTER);
        badgeView.setPadding(0, 0, 0, dp(8));
        root.addView(badgeView);

        TextView titleView = new TextView(this);
        titleView.setText(finalTitulo);
        titleView.setTextSize(26f);
        titleView.setTypeface(Typeface.DEFAULT_BOLD);
        titleView.setTextColor(Color.WHITE);
        titleView.setGravity(Gravity.CENTER);
        titleView.setPadding(dp(8), 0, dp(8), dp(22));
        root.addView(titleView);

        // 5. Tarjeta tipo cristal oscuro con consecuencia / recordatorio
        LinearLayout penBox = new LinearLayout(this);
        penBox.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable penBg = new GradientDrawable();
        penBg.setColor(Color.parseColor(esOmitible ? "#131c36" : "#26101c"));
        penBg.setCornerRadius(dp(18));
        penBg.setStroke(dp(1), Color.parseColor(esOmitible ? "#334b85" : "#881337"));
        penBox.setBackground(penBg);
        penBox.setPadding(dp(18), dp(16), dp(18), dp(16));
        penBox.setGravity(Gravity.CENTER);

        TextView penLabel = new TextView(this);
        penLabel.setText(esOmitible ? "⚡ PENITENCIA EN JUEGO SI EXPIRA EL TIEMPO" : "🚨 PENITENCIA OBLIGATORIA SI FALLAS");
        penLabel.setTextSize(10.5f);
        penLabel.setTypeface(Typeface.DEFAULT_BOLD);
        penLabel.setLetterSpacing(0.07f);
        penLabel.setTextColor(Color.parseColor(esOmitible ? "#93c5fd" : "#fda4af"));
        penLabel.setGravity(Gravity.CENTER);
        penBox.addView(penLabel);

        TextView penText = new TextView(this);
        penText.setText(finalPenitencia);
        penText.setTextSize(15.5f);
        penText.setTypeface(Typeface.DEFAULT_BOLD);
        penText.setTextColor(Color.parseColor("#f8fafc"));
        penText.setGravity(Gravity.CENTER);
        penText.setPadding(0, dp(8), 0, 0);
        penBox.addView(penText);

        LinearLayout.LayoutParams penParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        penParams.setMargins(0, 0, 0, dp(18));
        penBox.setLayoutParams(penParams);
        root.addView(penBox);

        View spacer = new View(this);
        LinearLayout.LayoutParams spParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1.0f);
        root.addView(spacer, spParams);

        // 6. Botón principal moderno con gradiente Cian/Índigo (o Carmesí/Ámbar)
        Button btnOpen = new Button(this);
        btnOpen.setText("⚔️  EMPEZAR MISIÓN");
        btnOpen.setTextSize(16.5f);
        btnOpen.setTypeface(Typeface.DEFAULT_BOLD);
        btnOpen.setTextColor(Color.WHITE);
        btnOpen.setAllCaps(false);
        GradientDrawable startBg = new GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            esOmitible
                ? new int[] { Color.parseColor("#0284c7"), Color.parseColor("#6366f1") }
                : new int[] { Color.parseColor("#e11d48"), Color.parseColor("#f97316") }
        );
        startBg.setCornerRadius(dp(28));
        btnOpen.setBackground(startBg);
        btnOpen.setPadding(dp(20), dp(16), dp(20), dp(16));
        LinearLayout.LayoutParams startParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        btnOpen.setLayoutParams(startParams);

        btnOpen.setOnClickListener(v -> {
            stopClockUpdates();
            MonarcaAlarmService.stopAlarm(AlarmAlertActivity.this);
            AlarmStore.recordPendingAction(AlarmAlertActivity.this, "start", finalQuestId, System.currentTimeMillis(), 0L);

            Intent mainIntent = new Intent(AlarmAlertActivity.this, MainActivity.class);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            mainIntent.putExtra("questId", finalQuestId);
            mainIntent.putExtra("alarmAction", "start");
            mainIntent.putExtra("fromAlarm", true);
            mainIntent.putExtra("recordedAlready", true);

            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && km != null && km.isKeyguardLocked()) {
                try {
                    km.requestDismissKeyguard(AlarmAlertActivity.this, new KeyguardManager.KeyguardDismissCallback() {
                        @Override
                        public void onDismissSucceeded() {
                            startActivity(mainIntent);
                            finish();
                        }
                        @Override
                        public void onDismissCancelled() {
                            startActivity(mainIntent);
                            finish();
                        }
                        @Override
                        public void onDismissError() {
                            startActivity(mainIntent);
                            finish();
                        }
                    });
                    return;
                } catch (Exception ignored) {}
            }
            startActivity(mainIntent);
            finish();
        });
        root.addView(btnOpen);

        if (esOmitible) {
            Button btnSnooze = new Button(this);
            btnSnooze.setText("⏸️  Posponer 1 hora");
            btnSnooze.setTextSize(14.5f);
            btnSnooze.setTypeface(Typeface.DEFAULT_BOLD);
            btnSnooze.setTextColor(Color.parseColor("#cbd5e1"));
            btnSnooze.setAllCaps(false);
            GradientDrawable snoozeBg = new GradientDrawable();
            snoozeBg.setColor(Color.parseColor("#121a30"));
            snoozeBg.setCornerRadius(dp(26));
            snoozeBg.setStroke(dp(1), Color.parseColor("#334155"));
            btnSnooze.setBackground(snoozeBg);
            btnSnooze.setPadding(dp(20), dp(14), dp(20), dp(14));
            LinearLayout.LayoutParams snooParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            snooParams.setMargins(0, dp(12), 0, 0);
            btnSnooze.setLayoutParams(snooParams);

            btnSnooze.setOnClickListener(v -> {
                stopClockUpdates();
                AlarmStore.scheduleSnooze(AlarmAlertActivity.this, finalQuestId, finalTitulo, finalPenitencia, finalTono);
                MonarcaAlarmPlugin.emitAlarmAction("snooze", finalQuestId);
                MonarcaAlarmService.stopAlarm(AlarmAlertActivity.this);
                finish();
            });
            root.addView(btnSnooze);
        }

        scroll.addView(root);
        setContentView(scroll);
        startClockUpdates();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // Bloquear botón atrás mientras la alarma está activa
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        stopClockUpdates();
        if (activeInstance == this) {
            activeInstance = null;
        }
        super.onDestroy();
    }
}
''')


# ------------------------------------------------------------------------------
# 4. MonarcaAlarmReceiver.java: Despierta CPU con WakeLock y arranca ForegroundService
# ------------------------------------------------------------------------------
write_java('MonarcaAlarmReceiver.java', '''
package com.monarca.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import androidx.core.content.ContextCompat;

public class MonarcaAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        PowerManager.WakeLock receiverWl = null;
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                receiverWl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Monarca:AlarmReceiverWake");
                receiverWl.acquire(8000L);
            }
        } catch (Exception ignored) {}

        try {
            int id = intent.getIntExtra("id", 1001);
            String questId = intent.getStringExtra("questId");
            String titulo = intent.getStringExtra("titulo");
            String penitencia = intent.getStringExtra("penitencia");
            boolean esOmitible = intent.getBooleanExtra("esOmitible", true);
            String tono = intent.getStringExtra("tono");

            if (id != AlarmStore.TEST_ALARM_ID && questId != null && !questId.isEmpty()) {
                AlarmStore.recordPendingAction(context, "fired", questId, System.currentTimeMillis(), 0L);
            }

            // Reprogramar automáticamente para mañana si es diaria, o limpiar si era one-shot
            AlarmStore.scheduleNextDayIfRecurring(context, id);

            Intent serviceIntent = new Intent(context, MonarcaAlarmService.class);
            serviceIntent.setAction(MonarcaAlarmService.ACTION_START);
            serviceIntent.putExtra("id", id);
            serviceIntent.putExtra("questId", questId != null ? questId : "");
            serviceIntent.putExtra("titulo", titulo != null ? titulo : "¡Quest Diaria Activada!");
            serviceIntent.putExtra("penitencia", penitencia != null ? penitencia : "30 Flexiones inmediatas");
            serviceIntent.putExtra("esOmitible", esOmitible);
            serviceIntent.putExtra("tono", tono != null ? tono : "default");

            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (receiverWl != null && receiverWl.isHeld()) {
                try { receiverWl.release(); } catch (Exception ignored) {}
            }
        }
    }
}
''')


# ------------------------------------------------------------------------------
# 5. BootReceiver.java: Reprograma alarmas tras reiniciar el móvil o actualizar APK
# ------------------------------------------------------------------------------
write_java('BootReceiver.java', '''
package com.monarca.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
            || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
            || "android.intent.action.QUICKBOOT_POWERON".equals(action)
            || "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)) {
            AlarmStore.rescheduleAll(context);
        }
    }
}
''')


# ------------------------------------------------------------------------------
# 5B. MonarcaRestTimerReceiver.java: Alarma exacta de Descanso Entre Series
#     Despierta pantalla y notifica con vibración + sonido incluso en HyperOS/Doze
# ------------------------------------------------------------------------------
write_java('MonarcaRestTimerReceiver.java', '''
package com.monarca.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.media.RingtoneManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;

public class MonarcaRestTimerReceiver extends BroadcastReceiver {
    public static final String CHANNEL_ID = "monarca_rest_timer_channel_v1";
    public static final int NOTIF_ID = 77790;
    public static final int REQUEST_CODE = 77790;
    public static final String ACTION_REST_DONE = "com.monarca.app.ACTION_REST_TIMER_DONE";
    private static final long[] VIBRATION_PATTERN = new long[] { 0, 260, 110, 260, 110, 420 };

    public static void ensureRestChannel(Context ctx) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && ctx != null) {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Descanso Entre Series (Rutinas)",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Aviso inmediato al terminar tu contador de descanso entre series con pantalla apagada");
                Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                if (soundUri != null) {
                    AudioAttributes aa = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    channel.setSound(soundUri, aa);
                }
                channel.enableVibration(true);
                channel.setVibrationPattern(VIBRATION_PATTERN);
                channel.enableLights(true);
                channel.setLightColor(0xFF38BDF8);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                channel.setBypassDnd(true);
                nm.createNotificationChannel(channel);
            }
        }
    }

    public static boolean scheduleRestTimer(Context ctx, long targetMillis, int segundos, String titulo, String cuerpo) {
        if (ctx == null) return false;
        ensureRestChannel(ctx);
        cancelRestTimer(ctx, true);

        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return false;

        long now = System.currentTimeMillis();
        long fireAt = targetMillis > now + 500L ? targetMillis : (now + Math.max(1, segundos) * 1000L);

        Intent intent = new Intent(ctx, MonarcaRestTimerReceiver.class);
        intent.setAction(ACTION_REST_DONE);
        intent.putExtra("segundos", Math.max(1, segundos));
        intent.putExtra("titulo", (titulo != null && !titulo.isEmpty()) ? titulo : "⏱️ ¡Descanso terminado! ¡A entrenar!");
        intent.putExtra("cuerpo", (cuerpo != null && !cuerpo.isEmpty()) ? cuerpo : ("Finalizó tu descanso de " + Math.max(1, segundos) + "s. ¡Vamos con la siguiente serie!"));
        intent.putExtra("timestamp", fireAt);

        PendingIntent broadcastPi = PendingIntent.getBroadcast(
            ctx,
            REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent showIntent = new Intent(ctx, MainActivity.class);
        showIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        showIntent.putExtra("fromRestTimer", true);
        showIntent.putExtra("openView", "vista-detalle-rutina-dinamica");
        PendingIntent showPi = PendingIntent.getActivity(
            ctx,
            REQUEST_CODE + 1,
            showIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fireAt, broadcastPi);
                return false;
            } else {
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(fireAt, showPi), broadcastPi);
                return true;
            }
        } catch (SecurityException se) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fireAt, broadcastPi);
                } else {
                    am.set(AlarmManager.RTC_WAKEUP, fireAt, broadcastPi);
                }
            } catch (Exception ignored) {}
            return false;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static void cancelRestTimer(Context ctx, boolean clearNotification) {
        if (ctx == null) return;
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                Intent intent = new Intent(ctx, MonarcaRestTimerReceiver.class);
                intent.setAction(ACTION_REST_DONE);
                PendingIntent pi = PendingIntent.getBroadcast(
                    ctx,
                    REQUEST_CODE,
                    intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                );
                if (pi != null) {
                    am.cancel(pi);
                    pi.cancel();
                }
            }
        } catch (Exception ignored) {}

        if (clearNotification) {
            clearRestNotificationOnly(ctx);
        }
    }

    public static void clearRestNotificationOnly(Context ctx) {
        if (ctx == null) return;
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(NOTIF_ID);
            }
        } catch (Exception ignored) {}
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onReceive(Context context, Intent intent) {
        final PendingResult pendingResult = goAsync();
        PowerManager.WakeLock cpuLock = null;
        PowerManager.WakeLock screenLock = null;
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                cpuLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Monarca:RestTimerCpu");
                cpuLock.acquire(5000L);
                screenLock = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                    "Monarca:RestTimerScreen"
                );
                screenLock.acquire(4000L);
            }
        } catch (Exception ignored) {}

        int segundos = intent != null ? intent.getIntExtra("segundos", 60) : 60;
        String titulo = intent != null ? intent.getStringExtra("titulo") : null;
        String cuerpo = intent != null ? intent.getStringExtra("cuerpo") : null;
        if (titulo == null || titulo.isEmpty()) titulo = "⏱️ ¡Descanso terminado! ¡A entrenar!";
        if (cuerpo == null || cuerpo.isEmpty()) cuerpo = "Finalizó tu descanso de " + segundos + "s. ¡Siguiente serie lista!";

        try {
            ensureRestChannel(context);

            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            openIntent.putExtra("fromRestTimer", true);
            openIntent.putExtra("openView", "vista-detalle-rutina-dinamica");
            PendingIntent openPi = PendingIntent.getActivity(
                context,
                REQUEST_CODE + 2,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(titulo)
                .setContentText(cuerpo)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(cuerpo))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setOnlyAlertOnce(false)
                .setContentIntent(openPi)
                .setVibrate(VIBRATION_PATTERN);

            Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            if (soundUri != null) {
                builder.setSound(soundUri);
            }

            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify(NOTIF_ID, builder.build());
            }
        } catch (SecurityException ignored) {
        } catch (Exception e) {
            e.printStackTrace();
        }

        triggerRestVibration(context);
        playHeadsetChimeIfMuted(context);
        MonarcaAlarmPlugin.emitRestTimerFinished(segundos);

        final PowerManager.WakeLock finalCpu = cpuLock;
        final PowerManager.WakeLock finalScreen = screenLock;
        boolean scheduled = new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try { if (finalScreen != null && finalScreen.isHeld()) finalScreen.release(); } catch (Exception ignored) {}
            try { if (finalCpu != null && finalCpu.isHeld()) finalCpu.release(); } catch (Exception ignored) {}
            try { if (pendingResult != null) pendingResult.finish(); } catch (Exception ignored) {}
        }, 4200L);
        if (!scheduled) {
            try { if (finalScreen != null && finalScreen.isHeld()) finalScreen.release(); } catch (Exception ignored) {}
            try { if (finalCpu != null && finalCpu.isHeld()) finalCpu.release(); } catch (Exception ignored) {}
            try { if (pendingResult != null) pendingResult.finish(); } catch (Exception ignored) {}
        }
    }

    @SuppressWarnings("deprecation")
    private void triggerRestVibration(Context context) {
        try {
            Vibrator vib = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vib != null && vib.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    VibrationAttributes attrs = new VibrationAttributes.Builder()
                        .setUsage(VibrationAttributes.USAGE_ALARM)
                        .build();
                    vib.vibrate(VibrationEffect.createWaveform(VIBRATION_PATTERN, -1), attrs);
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    AudioAttributes aa = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    vib.vibrate(VibrationEffect.createWaveform(VIBRATION_PATTERN, -1), aa);
                } else {
                    vib.vibrate(VIBRATION_PATTERN, -1);
                }
            }
        } catch (Exception ignored) {}
    }

    private boolean hasExternalHeadsetOutput(AudioManager am) {
        if (am == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                AudioDeviceInfo[] devices = am.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
                if (devices != null) {
                    for (AudioDeviceInfo dev : devices) {
                        int type = dev.getType();
                        if (type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP
                            || type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO
                            || type == AudioDeviceInfo.TYPE_WIRED_HEADSET
                            || type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES) {
                            return true;
                        }
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && type == AudioDeviceInfo.TYPE_USB_HEADSET) {
                            return true;
                        }
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                            && (type == AudioDeviceInfo.TYPE_BLE_HEADSET || type == AudioDeviceInfo.TYPE_BLE_SPEAKER)) {
                            return true;
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return false;
    }

    private void playHeadsetChimeIfMuted(Context context) {
        try {
            AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (am == null) return;
            // Si el teléfono está en silencio/vibración pero tiene audífonos Bluetooth/cableados puestos,
            // reproduce un pitido corto y claro directo en los audífonos sin sonar por altavoz.
            if (am.getRingerMode() != AudioManager.RINGER_MODE_NORMAL && hasExternalHeadsetOutput(am)) {
                final ToneGenerator tg = new ToneGenerator(AudioManager.STREAM_MUSIC, 88);
                tg.startTone(ToneGenerator.TONE_PROP_BEEP2, 340);
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    try { tg.release(); } catch (Exception ignored) {}
                }, 950L);
            }
        } catch (Exception ignored) {}
    }
}
''')


# ------------------------------------------------------------------------------
# 6. MonarcaAlarmPlugin.java: API completa para JS (sincronización, tonos MP3,
#    diagnóstico de permisos Android/HyperOS, accesos a ajustes, descanso y pruebas)
# ------------------------------------------------------------------------------
write_java('MonarcaAlarmPlugin.java', '''
package com.monarca.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.AppOpsManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Base64;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "MonarcaAlarm")
public class MonarcaAlarmPlugin extends Plugin {
    private static volatile MonarcaAlarmPlugin activePlugin = null;

    @Override
    public void load() {
        super.load();
        activePlugin = this;
        MonarcaAlarmService.ensureAlarmChannel(getContext());
        MonarcaRestTimerReceiver.ensureRestChannel(getContext());
    }

    public static void emitAlarmAction(String tipo, String questId) {
        MonarcaAlarmPlugin plugin = activePlugin;
        if (plugin != null) {
            plugin.dispatchAlarmAction(tipo, questId);
        }
    }

    private void dispatchAlarmAction(String tipo, String questId) {
        try {
            JSObject data = new JSObject();
            data.put("tipo", tipo != null ? tipo : "start");
            data.put("questId", questId != null ? questId : "");
            notifyListeners("alarmAction", data);
        } catch (Exception ignored) {}
    }

    public static void emitRestTimerFinished(int segundos) {
        MonarcaAlarmPlugin plugin = activePlugin;
        if (plugin != null) {
            try {
                JSObject data = new JSObject();
                data.put("segundos", segundos);
                data.put("timestamp", System.currentTimeMillis());
                plugin.notifyListeners("restTimerFinished", data);
            } catch (Exception ignored) {}
        }
    }

    public static void emitRestTimerOpened() {
        MonarcaAlarmPlugin plugin = activePlugin;
        if (plugin != null) {
            try {
                JSObject data = new JSObject();
                data.put("openView", "vista-detalle-rutina-dinamica");
                data.put("timestamp", System.currentTimeMillis());
                plugin.notifyListeners("restTimerOpened", data);
            } catch (Exception ignored) {}
        }
    }

    @PluginMethod
    public void sincronizarAlarmas(PluginCall call) {
        try {
            JSArray arr = call.getArray("alarmas");
            List<AlarmStore.AlarmEntry> list = new ArrayList<>();
            if (arr != null) {
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.optJSONObject(i);
                    if (obj == null) continue;
                    AlarmStore.AlarmEntry e = new AlarmStore.AlarmEntry();
                    String idStr = obj.optString("id", "");
                    e.questId = obj.optString("questId", "");
                    e.key = !idStr.isEmpty() ? idStr : ("daily_" + e.questId);
                    e.intId = AlarmStore.computeId(e.key);
                    e.titulo = obj.optString("titulo", "Quest Diaria");
                    e.penitencia = obj.optString("penitencia", "30 Flexiones inmediatas");
                    e.esOmitible = obj.optBoolean("esOmitible", true);
                    e.hora = obj.optInt("hora", 8);
                    e.minutos = obj.optInt("minutos", 0);
                    e.repetirDiario = obj.optBoolean("repetirDiario", true);
                    e.tono = obj.optString("tono", "default");
                    long ts = obj.optLong("timestamp", 0L);
                    if (ts <= System.currentTimeMillis()) {
                        java.util.Calendar cal = java.util.Calendar.getInstance();
                        cal.set(java.util.Calendar.HOUR_OF_DAY, e.hora);
                        cal.set(java.util.Calendar.MINUTE, e.minutos);
                        cal.set(java.util.Calendar.SECOND, 0);
                        cal.set(java.util.Calendar.MILLISECOND, 0);
                        if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
                            cal.add(java.util.Calendar.DAY_OF_YEAR, 1);
                        }
                        ts = cal.getTimeInMillis();
                    }
                    e.timestamp = ts;
                    list.add(e);
                }
            }
            AlarmStore.syncAlarms(getContext(), list);
            JSObject ret = new JSObject();
            ret.put("count", list.size());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error sincronizando alarmas: " + e.getMessage());
        }
    }

    @PluginMethod
    public void programarAlarma(PluginCall call) {
        try {
            String idStr = call.getString("id", "1001");
            String titulo = call.getString("titulo", "Quest Diaria");
            String penitencia = call.getString("penitencia", "30 Flexiones");
            boolean esOmitible = call.getBoolean("esOmitible", true);
            String questId = call.getString("questId", "");
            boolean repetirDiario = call.getBoolean("repetirDiario", false);
            String tono = call.getString("tono", "default");
            Long timestamp = call.getLong("timestamp");

            long targetMillis;
            int hora = call.getInt("hora", 8);
            int minutos = call.getInt("minutos", 0);
            if (timestamp != null && timestamp > System.currentTimeMillis()) {
                targetMillis = timestamp;
            } else {
                java.util.Calendar cal = java.util.Calendar.getInstance();
                cal.set(java.util.Calendar.HOUR_OF_DAY, hora);
                cal.set(java.util.Calendar.MINUTE, minutos);
                cal.set(java.util.Calendar.SECOND, 0);
                cal.set(java.util.Calendar.MILLISECOND, 0);
                if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
                    cal.add(java.util.Calendar.DAY_OF_YEAR, 1);
                }
                targetMillis = cal.getTimeInMillis();
            }

            AlarmStore.AlarmEntry entry = new AlarmStore.AlarmEntry();
            entry.key = idStr;
            entry.intId = AlarmStore.computeId(idStr);
            entry.questId = questId;
            entry.titulo = titulo;
            entry.penitencia = penitencia;
            entry.esOmitible = esOmitible;
            entry.timestamp = targetMillis;
            entry.hora = hora;
            entry.minutos = minutos;
            entry.repetirDiario = repetirDiario;
            entry.tono = tono;

            AlarmStore.upsertAndSchedule(getContext(), entry);
            call.resolve();
        } catch (Exception e) {
            call.reject("Error programando alarma: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelarAlarma(PluginCall call) {
        String idStr = call.getString("id", "");
        if (idStr != null && !idStr.isEmpty()) {
            AlarmStore.removeAndCancel(getContext(), idStr);
        }
        call.resolve();
    }

    @PluginMethod
    public void pararSonido(PluginCall call) {
        MonarcaAlarmService.stopAlarm(getContext());
        AlarmAlertActivity.closeIfOpen();
        call.resolve();
    }

    @PluginMethod
    public void programarDescanso(PluginCall call) {
        try {
            int segundos = call.getInt("segundos", 60);
            if (segundos < 1) segundos = 1;
            Long timestamp = call.getLong("timestamp");
            String titulo = call.getString("titulo", "⏱️ ¡Descanso terminado! ¡A entrenar!");
            String cuerpo = call.getString("cuerpo", "Finalizó tu descanso de " + segundos + "s. ¡Siguiente serie lista!");

            long now = System.currentTimeMillis();
            long fireAt = (timestamp != null && timestamp > now + 500L) ? timestamp : (now + (segundos * 1000L));
            boolean exacto = MonarcaRestTimerReceiver.scheduleRestTimer(getContext(), fireAt, segundos, titulo, cuerpo);

            JSObject res = new JSObject();
            res.put("ok", true);
            res.put("exacto", exacto);
            res.put("timestamp", fireAt);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Error programando descanso: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelarDescanso(PluginCall call) {
        boolean clearNotif = Boolean.TRUE.equals(call.getBoolean("clearNotification", true));
        MonarcaRestTimerReceiver.cancelRestTimer(getContext(), clearNotif);
        JSObject res = new JSObject();
        res.put("ok", true);
        call.resolve(res);
    }

    @PluginMethod
    public void guardarTonoAlarma(PluginCall call) {
        try {
            String nombre = call.getString("nombre", "");
            String base64 = call.getString("base64", "");
            if (nombre == null || nombre.isEmpty() || base64 == null || base64.isEmpty()) {
                call.reject("Nombre o datos base64 faltantes");
                return;
            }
            int commaIdx = base64.indexOf(',');
            if (commaIdx != -1) {
                base64 = base64.substring(commaIdx + 1);
            }
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            File tonesDir = new File(getContext().getFilesDir(), "alarm_tones");
            if (!tonesDir.exists()) tonesDir.mkdirs();

            String safeName = new File(nombre).getName().replaceAll("[^a-zA-Z0-9._-]", "_");
            if (safeName.isEmpty()) safeName = "custom_tone.mp3";

            File outFile = new File(tonesDir, safeName);
            try (FileOutputStream fos = new FileOutputStream(outFile)) {
                fos.write(bytes);
                fos.flush();
            }

            JSObject res = new JSObject();
            res.put("nombre", safeName);
            res.put("size", bytes.length);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Error guardando tono: " + e.getMessage());
        }
    }

    @PluginMethod
    public void estadoPermisos(PluginCall call) {
        Context ctx = getContext();
        JSObject res = new JSObject();

        boolean notifEnabled = NotificationManagerCompat.from(ctx).areNotificationsEnabled();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notifEnabled = notifEnabled && (ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED);
        }
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
            NotificationChannel ch = nm.getNotificationChannel(MonarcaAlarmService.CHANNEL_ID);
            if (ch != null && ch.getImportance() == NotificationManager.IMPORTANCE_NONE) {
                notifEnabled = false;
            }
        }
        res.put("notifications", notifEnabled);

        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        boolean exactAlarms = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && am != null) {
            exactAlarms = am.canScheduleExactAlarms();
        }
        res.put("exactAlarms", exactAlarms);

        boolean fullScreenIntent = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE && nm != null) {
            try {
                fullScreenIntent = nm.canUseFullScreenIntent();
            } catch (Exception ignored) {}
        }
        res.put("fullScreenIntent", fullScreenIntent);

        boolean batteryOptIgnored = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                batteryOptIgnored = pm.isIgnoringBatteryOptimizations(ctx.getPackageName());
            }
        }
        res.put("batteryOptimization", batteryOptIgnored);

        boolean overlay = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            overlay = Settings.canDrawOverlays(ctx);
        }
        res.put("overlay", overlay);

        AudioManager audioMgr = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
        int vol = audioMgr != null ? audioMgr.getStreamVolume(AudioManager.STREAM_ALARM) : 0;
        int volMax = audioMgr != null ? audioMgr.getStreamMaxVolume(AudioManager.STREAM_ALARM) : 7;
        res.put("alarmVolume", vol);
        res.put("alarmVolumeMax", volMax);

        String mfg = Build.MANUFACTURER != null ? Build.MANUFACTURER.toLowerCase() : "";
        boolean esXiaomi = mfg.contains("xiaomi") || mfg.contains("redmi") || mfg.contains("poco") || hasMiuiSystem();
        res.put("esXiaomi", esXiaomi);
        res.put("sdk", Build.VERSION.SDK_INT);

        if (esXiaomi) {
            Boolean bgPopup = checkMiuiOp(ctx, 10021);
            Boolean showLock = checkMiuiOp(ctx, 10020);
            res.put("miuiBackgroundPopup", bgPopup != null ? bgPopup : JSONObject.NULL);
            res.put("miuiShowOnLockScreen", showLock != null ? showLock : JSONObject.NULL);
        } else {
            res.put("miuiBackgroundPopup", JSONObject.NULL);
            res.put("miuiShowOnLockScreen", JSONObject.NULL);
        }

        call.resolve(res);
    }

    private boolean hasMiuiSystem() {
        try {
            PackageManager pm = getContext().getPackageManager();
            pm.getPackageInfo("com.miui.securitycenter", 0);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private Boolean checkMiuiOp(Context ctx, int opCode) {
        try {
            AppOpsManager ops = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
            if (ops == null) return null;
            Method m = AppOpsManager.class.getMethod("checkOpNoThrow", int.class, int.class, String.class);
            Object r = m.invoke(ops, opCode, android.os.Process.myUid(), ctx.getPackageName());
            if (r instanceof Integer) {
                return ((Integer) r) == AppOpsManager.MODE_ALLOWED;
            }
        } catch (Exception ignored) {}
        return null;
    }

    @PluginMethod
    public void abrirAjuste(PluginCall call) {
        String tipo = call.getString("tipo", "appDetails");
        Context ctx = getContext();
        String pkg = ctx.getPackageName();

        boolean launched = false;
        if ("notifications".equals(tipo)) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                i.putExtra(Settings.EXTRA_APP_PACKAGE, pkg);
                launched = tryLaunchIntent(ctx, i);
            }
        } else if ("exactAlarms".equals(tipo)) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Intent i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                i.setData(Uri.parse("package:" + pkg));
                launched = tryLaunchIntent(ctx, i);
            }
        } else if ("fullScreenIntent".equals(tipo)) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                Intent i = new Intent("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT");
                i.setData(Uri.parse("package:" + pkg));
                launched = tryLaunchIntent(ctx, i);
            }
            if (!launched && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                i.putExtra(Settings.EXTRA_APP_PACKAGE, pkg);
                launched = tryLaunchIntent(ctx, i);
            }
        } else if ("battery".equals(tipo)) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                i.setData(Uri.parse("package:" + pkg));
                launched = tryLaunchIntent(ctx, i);
                if (!launched) {
                    launched = tryLaunchIntent(ctx, new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
                }
            }
        } else if ("overlay".equals(tipo)) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                i.setData(Uri.parse("package:" + pkg));
                launched = tryLaunchIntent(ctx, i);
            }
        } else if ("xiaomiPerms".equals(tipo)) {
            Intent i1 = new Intent("miui.intent.action.APP_PERM_EDITOR");
            i1.setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity");
            i1.putExtra("extra_pkgname", pkg);
            launched = tryLaunchIntent(ctx, i1);
            if (!launched) {
                Intent i2 = new Intent("miui.intent.action.APP_PERM_EDITOR");
                i2.setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.AppPermissionsEditorActivity");
                i2.putExtra("extra_pkgname", pkg);
                launched = tryLaunchIntent(ctx, i2);
            }
            if (!launched) {
                Intent i3 = new Intent("miui.intent.action.APP_PERM_EDITOR");
                i3.putExtra("extra_pkgname", pkg);
                launched = tryLaunchIntent(ctx, i3);
            }
        } else if ("xiaomiAutostart".equals(tipo)) {
            Intent i1 = new Intent();
            i1.setComponent(new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
            launched = tryLaunchIntent(ctx, i1);
            if (!launched) {
                Intent i2 = new Intent();
                i2.setComponent(new ComponentName("com.miui.powerkeeper", "com.miui.powerkeeper.ui.HiddenAppsConfigActivity"));
                i2.putExtra("package_name", pkg);
                i2.putExtra("package_label", "Emily");
                launched = tryLaunchIntent(ctx, i2);
            }
        }

        if (!launched) {
            Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            fallback.setData(Uri.parse("package:" + pkg));
            tryLaunchIntent(ctx, fallback);
        }
        call.resolve();
    }

    private boolean tryLaunchIntent(Context ctx, Intent intent) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    @PluginMethod
    public void probarAlarma(PluginCall call) {
        int segs = call.getInt("segundos", 10);
        if (segs < 3) segs = 3;
        if (segs > 120) segs = 120;
        String tono = call.getString("tono", "default");
        AlarmStore.scheduleTestAlarm(getContext(), segs, tono);

        JSObject res = new JSObject();
        res.put("segundos", segs);
        res.put("timestamp", System.currentTimeMillis() + (segs * 1000L));
        call.resolve(res);
    }

    @PluginMethod
    public void obtenerAccionesPendientes(PluginCall call) {
        try {
            JSONArray raw = AlarmStore.consumePendingActions(getContext());
            JSArray acciones = new JSArray();
            for (int i = 0; i < raw.length(); i++) {
                JSONObject o = raw.optJSONObject(i);
                if (o != null) acciones.put(o);
            }
            JSObject res = new JSObject();
            res.put("acciones", acciones);
            call.resolve(res);
        } catch (Exception e) {
            JSObject res = new JSObject();
            res.put("acciones", new JSArray());
            call.resolve(res);
        }
    }
}
''')


# ------------------------------------------------------------------------------
# 6B. MonarcaMediaPlugin.java: Escáner automático MediaStore + Carátulas + Stream
# ------------------------------------------------------------------------------
write_java('MonarcaMediaPlugin.java', '''
package com.monarca.app;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioDeviceCallback;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.media.MediaMetadataRetriever;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.util.Size;
import android.webkit.WebView;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "MonarcaMedia",
    permissions = {
        @Permission(
            alias = "mediaAudio",
            strings = { "android.permission.READ_MEDIA_AUDIO" }
        ),
        @Permission(
            alias = "legacyStorage",
            strings = { "android.permission.READ_EXTERNAL_STORAGE" }
        )
    }
)
public class MonarcaMediaPlugin extends Plugin {
    private static final ConcurrentHashMap<String, Boolean> noArtCache = new ConcurrentHashMap<>();
    private Context registeredAudioCtx = null;
    private BroadcastReceiver noisyAudioReceiver = null;
    private AudioDeviceCallback audioDeviceCallback = null;
    private long lastNoisyEmitMs = 0L;

    @Override
    public void load() {
        super.load();
        registrarMonitorSalidaAudio();
    }

    @Override
    protected void handleOnDestroy() {
        desregistrarMonitorSalidaAudio();
        super.handleOnDestroy();
    }

    private boolean isExternalMediaOutputDevice(AudioDeviceInfo dev) {
        if (dev == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return false;
        if (!dev.isSink()) return false;
        int type = dev.getType();
        if (type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP
            || type == AudioDeviceInfo.TYPE_WIRED_HEADSET
            || type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES
            || type == AudioDeviceInfo.TYPE_USB_DEVICE) {
            return true;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && type == AudioDeviceInfo.TYPE_USB_HEADSET) {
            return true;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && type == AudioDeviceInfo.TYPE_HEARING_AID) {
            return true;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
            && (type == AudioDeviceInfo.TYPE_BLE_HEADSET || type == AudioDeviceInfo.TYPE_BLE_SPEAKER)) {
            return true;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && type == AudioDeviceInfo.TYPE_BLE_BROADCAST) {
            return true;
        }
        return false;
    }

    private boolean hasExternalMediaOutput(AudioManager am) {
        if (am == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return false;
        try {
            AudioDeviceInfo[] devices = am.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
            if (devices != null) {
                for (AudioDeviceInfo dev : devices) {
                    if (isExternalMediaOutputDevice(dev)) {
                        return true;
                    }
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    private String getFirstExternalMediaOutputName(AudioManager am) {
        if (am == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return "";
        try {
            AudioDeviceInfo[] devices = am.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
            if (devices != null) {
                for (AudioDeviceInfo dev : devices) {
                    if (isExternalMediaOutputDevice(dev)) {
                        CharSequence pname = dev.getProductName();
                        if (pname != null && pname.length() > 0) {
                            return pname.toString().trim();
                        }
                        return "Audifonos";
                    }
                }
            }
        } catch (Exception ignored) {}
        return "";
    }

    private void registrarMonitorSalidaAudio() {
        desregistrarMonitorSalidaAudio();
        try {
            Context baseCtx = getContext();
            if (baseCtx == null) return;
            Context appCtx = baseCtx.getApplicationContext();
            if (appCtx == null) appCtx = baseCtx;
            registeredAudioCtx = appCtx;

            final AudioManager am = (AudioManager) appCtx.getSystemService(Context.AUDIO_SERVICE);

            noisyAudioReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if (intent == null) return;
                    String action = intent.getAction();
                    if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(action)) {
                        emitAudioBecomingNoisy("becoming_noisy", "");
                    } else if (AudioManager.ACTION_HEADSET_PLUG.equals(action)) {
                        int plugState = intent.getIntExtra("state", -1);
                        if (plugState == 0 && !hasExternalMediaOutput(am)) {
                            String devName = intent.getStringExtra("name");
                            emitAudioBecomingNoisy("headset_unplugged", devName != null ? devName : "");
                        }
                    }
                }
            };

            IntentFilter filter = new IntentFilter();
            filter.addAction(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
            filter.addAction(AudioManager.ACTION_HEADSET_PLUG);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                appCtx.registerReceiver(noisyAudioReceiver, filter, Context.RECEIVER_EXPORTED);
            } else {
                appCtx.registerReceiver(noisyAudioReceiver, filter);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && am != null) {
                audioDeviceCallback = new AudioDeviceCallback() {
                    @Override
                    public void onAudioDevicesRemoved(AudioDeviceInfo[] removedDevices) {
                        if (removedDevices == null || removedDevices.length == 0) return;
                        boolean removedExternal = false;
                        String removedName = "";
                        for (AudioDeviceInfo dev : removedDevices) {
                            if (isExternalMediaOutputDevice(dev)) {
                                removedExternal = true;
                                try {
                                    CharSequence pname = dev.getProductName();
                                    if (pname != null && pname.length() > 0 && removedName.isEmpty()) {
                                        removedName = pname.toString().trim();
                                    }
                                } catch (Exception ignored) {}
                            }
                        }
                        if (removedExternal && !hasExternalMediaOutput(am)) {
                            emitAudioBecomingNoisy("audio_device_removed", removedName);
                        }
                    }
                };
                am.registerAudioDeviceCallback(audioDeviceCallback, new Handler(Looper.getMainLooper()));
            }
        } catch (Exception ignored) {}
    }

    private void desregistrarMonitorSalidaAudio() {
        try {
            if (registeredAudioCtx != null && noisyAudioReceiver != null) {
                registeredAudioCtx.unregisterReceiver(noisyAudioReceiver);
            }
        } catch (Exception ignored) {}
        noisyAudioReceiver = null;

        try {
            if (registeredAudioCtx != null && audioDeviceCallback != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                AudioManager am = (AudioManager) registeredAudioCtx.getSystemService(Context.AUDIO_SERVICE);
                if (am != null) {
                    am.unregisterAudioDeviceCallback(audioDeviceCallback);
                }
            }
        } catch (Exception ignored) {}
        audioDeviceCallback = null;
        registeredAudioCtx = null;
    }

    private void emitAudioBecomingNoisy(final String reason, final String deviceName) {
        long now = System.currentTimeMillis();
        synchronized (this) {
            if (now - lastNoisyEmitMs < 450L) {
                return;
            }
            lastNoisyEmitMs = now;
        }

        final String safeReason = reason != null ? reason : "becoming_noisy";
        final String safeName = deviceName != null ? deviceName.trim() : "";

        try {
            JSObject payload = new JSObject();
            payload.put("reason", safeReason);
            payload.put("deviceName", safeName);
            payload.put("timestamp", now);
            notifyListeners("audioBecomingNoisy", payload);
        } catch (Exception ignored) {}

        // Respaldo inmediato directo al WebView para pausar sin demora incluso en segundo plano o pantalla apagada
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                final WebView wv = getBridge().getWebView();
                final String js = "try{if(window.MonarcaPlayer&&typeof window.MonarcaPlayer.pausarPorDesconexionAudio==='function'){window.MonarcaPlayer.pausarPorDesconexionAudio("
                    + JSONObject.quote(safeReason) + "," + JSONObject.quote(safeName) + ");}}catch(e){}";
                wv.post(() -> {
                    try {
                        wv.evaluateJavascript(js, null);
                    } catch (Exception ignored) {}
                });
            }
        } catch (Exception ignored) {}
    }

    @PluginMethod
    public void estadoSalidaAudio(PluginCall call) {
        boolean hasExt = false;
        String devName = "";
        try {
            Context ctx = getContext();
            if (ctx != null) {
                AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
                hasExt = hasExternalMediaOutput(am);
                devName = hasExt ? getFirstExternalMediaOutputName(am) : "";
            }
        } catch (Exception ignored) {}
        JSObject res = new JSObject();
        res.put("hasExternalOutput", hasExt);
        res.put("deviceName", devName);
        call.resolve(res);
    }

    private String getActiveAlias() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ? "mediaAudio" : "legacyStorage";
    }

    private String getActivePermString() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            ? Manifest.permission.READ_MEDIA_AUDIO
            : Manifest.permission.READ_EXTERNAL_STORAGE;
    }

    private boolean isAudioPermissionGranted() {
        Context ctx = getContext();
        if (ctx == null) return false;
        return ContextCompat.checkSelfPermission(ctx, getActivePermString()) == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void estadoPermisoAudio(PluginCall call) {
        boolean granted = isAudioPermissionGranted();
        PermissionState pState = getPermissionState(getActiveAlias());
        JSObject res = new JSObject();
        res.put("granted", granted);
        res.put("state", granted ? "granted" : (pState != null ? pState.toString().toLowerCase(Locale.US) : "prompt"));
        res.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(res);
    }

    @PluginMethod
    public void solicitarPermisoAudio(PluginCall call) {
        if (isAudioPermissionGranted()) {
            JSObject res = new JSObject();
            res.put("granted", true);
            res.put("state", "granted");
            call.resolve(res);
            return;
        }
        requestPermissionForAlias(getActiveAlias(), call, "audioPermsCallback");
    }

    @PermissionCallback
    private void audioPermsCallback(PluginCall call) {
        boolean granted = isAudioPermissionGranted();
        JSObject res = new JSObject();
        res.put("granted", granted);
        res.put("state", granted ? "granted" : "denied");
        call.resolve(res);
    }

    @PluginMethod
    public void abrirAjustesPermiso(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + ctx.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Exception ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void escanearMusica(PluginCall call) {
        if (!isAudioPermissionGranted()) {
            JSObject err = new JSObject();
            err.put("granted", false);
            err.put("canciones", new JSArray());
            call.resolve(err);
            return;
        }

        getBridge().execute(() -> {
            ContentResolver cr = getContext().getContentResolver();
            Uri collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
            try {
                Set<String> indexedPaths = new HashSet<>();
                JSArray tracks = readTracksFromMediaStore(cr, collection, indexedPaths);

                int newlyScanned = scanUnindexedAudioFilesIfAny(getContext(), indexedPaths);
                if (newlyScanned > 0) {
                    tracks = readTracksFromMediaStore(cr, collection, new HashSet<String>());
                }

                JSObject res = new JSObject();
                res.put("granted", true);
                res.put("canciones", tracks);
                res.put("count", tracks.length());
                call.resolve(res);
            } catch (Exception e) {
                call.reject("Error escaneando música MediaStore: " + e.getMessage());
            }
        });
    }

    private JSArray readTracksFromMediaStore(ContentResolver cr, Uri collection, Set<String> indexedPaths) throws Exception {
        JSArray tracks = new JSArray();
        boolean hasRelPath = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q;
        String[] projection = hasRelPath
            ? new String[] {
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM,
                MediaStore.Audio.Media.ALBUM_ID,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.SIZE,
                MediaStore.Audio.Media.DISPLAY_NAME,
                MediaStore.Audio.Media.MIME_TYPE,
                MediaStore.Audio.Media.DATE_ADDED,
                MediaStore.Audio.Media.RELATIVE_PATH,
                MediaStore.Audio.Media.DATA
            }
            : new String[] {
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM,
                MediaStore.Audio.Media.ALBUM_ID,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.SIZE,
                MediaStore.Audio.Media.DISPLAY_NAME,
                MediaStore.Audio.Media.MIME_TYPE,
                MediaStore.Audio.Media.DATE_ADDED,
                MediaStore.Audio.Media.DATA
            };

        String selection = MediaStore.Audio.Media.SIZE + " > 20000 AND (" +
            MediaStore.Audio.Media.IS_MUSIC + " != 0 OR " +
            MediaStore.Audio.Media.MIME_TYPE + " LIKE 'audio/%')";
        String sortOrder = MediaStore.Audio.Media.DATE_ADDED + " DESC";

        Cursor cursor = null;
        try {
            cursor = cr.query(collection, projection, selection, null, sortOrder);
            if (cursor != null) {
                int colId = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
                int colTitle = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
                int colArtist = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
                int colAlbum = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
                int colAlbumId = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID);
                int colDur = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
                int colSize = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE);
                int colName = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME);
                int colMime = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE);
                int colDate = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_ADDED);
                int colData = cursor.getColumnIndex(MediaStore.Audio.Media.DATA);
                int colRel = hasRelPath ? cursor.getColumnIndex(MediaStore.Audio.Media.RELATIVE_PATH) : -1;

                while (cursor.moveToNext()) {
                    long mediaId = cursor.getLong(colId);
                    long size = cursor.getLong(colSize);
                    long dur = cursor.getLong(colDur);
                    String displayName = safeStr(cursor.getString(colName));
                    String mime = safeStr(cursor.getString(colMime));
                    String dataPath = colData >= 0 ? safeStr(cursor.getString(colData)) : "";
                    String relPath = colRel >= 0 ? safeStr(cursor.getString(colRel)) : "";

                    if (!dataPath.isEmpty() && indexedPaths != null) {
                        indexedPaths.add(dataPath);
                    }

                    // Excluir clips muy cortos (< 10 seg si trae duración), notas de voz, WhatsApp/Telegram y grabadoras
                    if (dur > 0 && dur < 10000L) continue;
                    String checkPathLower = (relPath + " " + dataPath + " " + displayName).toLowerCase(Locale.US);
                    if (checkPathLower.contains("whatsapp") ||
                        checkPathLower.contains("soundrecorder") ||
                        checkPathLower.contains("sound_recorder") ||
                        checkPathLower.contains("audiorecorder") ||
                        checkPathLower.contains("voice_recorder") ||
                        checkPathLower.contains("voicerecorder") ||
                        checkPathLower.contains("/recordings/") ||
                        checkPathLower.contains("/recorder/") ||
                        checkPathLower.contains("telegram") ||
                        checkPathLower.contains("/ringtones/") ||
                        checkPathLower.contains("/notifications/") ||
                        checkPathLower.contains("/alarms/") ||
                        checkPathLower.contains("callrecording")) {
                        continue;
                    }

                    if (!isAudioFileSupported(displayName, mime)) continue;

                    String rawTitle = safeStr(cursor.getString(colTitle));
                    String rawArtist = safeStr(cursor.getString(colArtist));
                    String rawAlbum = safeStr(cursor.getString(colAlbum));
                    long albumId = cursor.getLong(colAlbumId);
                    long dateAddedSec = cursor.getLong(colDate);

                    String baseNoExt = stripExtension(displayName);
                    if (rawTitle.isEmpty() || "<unknown>".equalsIgnoreCase(rawTitle)) {
                        rawTitle = baseNoExt;
                    }
                    if ("<unknown>".equalsIgnoreCase(rawArtist) || "unknown".equalsIgnoreCase(rawArtist)) {
                        rawArtist = "";
                    }
                    if ("<unknown>".equalsIgnoreCase(rawAlbum) || "unknown".equalsIgnoreCase(rawAlbum)) {
                        rawAlbum = "";
                    }

                    String carpeta = extractFolderName(relPath, dataPath);
                    Uri itemUri = ContentUris.withAppendedId(collection, mediaId);

                    JSObject obj = new JSObject();
                    obj.put("id", "ms_" + mediaId);
                    obj.put("mediaId", mediaId);
                    obj.put("sig", buildStableSig(baseNoExt, size));
                    obj.put("nombre", rawTitle);
                    obj.put("artista", rawArtist);
                    obj.put("album", rawAlbum);
                    obj.put("albumId", albumId);
                    obj.put("carpeta", carpeta);
                    obj.put("tamano", size);
                    obj.put("duracionMs", dur);
                    obj.put("tipo", !mime.isEmpty() ? mime : "audio/mpeg");
                    obj.put("archivo", displayName);
                    obj.put("ruta", dataPath);
                    obj.put("contentUri", itemUri.toString());
                    obj.put("fecha", dateAddedSec > 0 ? dateAddedSec * 1000L : System.currentTimeMillis());
                    tracks.put(obj);
                }
            }
        } finally {
            if (cursor != null) {
                try { cursor.close(); } catch (Exception ignored) {}
            }
        }
        return tracks;
    }

    private int scanUnindexedAudioFilesIfAny(Context ctx, Set<String> indexedPaths) {
        if (ctx == null) return 0;
        try {
            List<File> roots = new ArrayList<>();
            @SuppressWarnings("deprecation")
            File ext = Environment.getExternalStorageDirectory();
            if (ext != null) {
                roots.add(new File(ext, "SnapTube Audio"));
                roots.add(new File(ext, "snaptube/download/SnapTube Audio"));
                roots.add(new File(ext, "snaptube/download"));
                roots.add(new File(ext, "SnapTube"));
            }
            File dirMusic = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC);
            if (dirMusic != null) roots.add(dirMusic);
            File dirDownloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (dirDownloads != null) roots.add(dirDownloads);

            List<String> toScan = new ArrayList<>();
            for (File root : roots) {
                if (toScan.size() >= 40) break;
                collectUnindexedAudioRecursive(root, 0, indexedPaths, toScan);
            }
            if (toScan.isEmpty()) return 0;

            final CountDownLatch latch = new CountDownLatch(toScan.size());
            MediaScannerConnection.scanFile(
                ctx.getApplicationContext(),
                toScan.toArray(new String[0]),
                null,
                (path, uri) -> latch.countDown()
            );
            latch.await(1500, TimeUnit.MILLISECONDS);
            return toScan.size();
        } catch (Exception ignored) {
            return 0;
        }
    }

    private void collectUnindexedAudioRecursive(File dir, int depth, Set<String> indexedPaths, List<String> out) {
        if (dir == null || depth > 2 || out.size() >= 40) return;
        if (!dir.exists() || !dir.isDirectory() || dir.getName().startsWith(".")) return;
        String lowerDir = dir.getName().toLowerCase(Locale.US);
        if (lowerDir.contains("whatsapp") || lowerDir.contains("telegram") ||
            lowerDir.contains("ringtones") || lowerDir.contains("notifications") ||
            lowerDir.contains("alarms") || lowerDir.contains("recorder")) {
            return;
        }
        File[] children = dir.listFiles();
        if (children == null) return;
        for (File child : children) {
            if (out.size() >= 40) break;
            if (child.isDirectory()) {
                collectUnindexedAudioRecursive(child, depth + 1, indexedPaths, out);
            } else if (child.isFile() && child.length() > 20000L) {
                if (isAudioFileSupported(child.getName(), "")) {
                    String abs = child.getAbsolutePath();
                    if (indexedPaths == null || !indexedPaths.contains(abs)) {
                        out.add(abs);
                        if (indexedPaths != null) indexedPaths.add(abs);
                    }
                }
            }
        }
    }

    @PluginMethod
    public void obtenerCaratula(PluginCall call) {
        String sig = safeStr(call.getString("sig", ""));
        String mediaIdStr = safeStr(call.getString("mediaId", ""));
        String contentUriStr = safeStr(call.getString("contentUri", ""));
        String ruta = safeStr(call.getString("ruta", ""));
        long albumId = call.getData() != null ? call.getData().optLong("albumId", 0L) : 0L;
        boolean includeDataUrl = Boolean.TRUE.equals(call.getBoolean("includeDataUrl", false));

        String cacheKey = sanitizeKey(!sig.isEmpty() ? sig : ("m_" + mediaIdStr));
        if (cacheKey.isEmpty()) cacheKey = "art_" + System.currentTimeMillis();

        final String finalKey = cacheKey;
        getBridge().execute(() -> {
            try {
                File coverDir = new File(getContext().getCacheDir(), "cover_cache");
                if (!coverDir.exists()) coverDir.mkdirs();
                File cacheFile = new File(coverDir, finalKey + ".jpg");

                if (cacheFile.exists() && cacheFile.length() > 0) {
                    JSObject ok = new JSObject();
                    ok.put("hasArt", true);
                    ok.put("filePath", cacheFile.getAbsolutePath());
                    if (includeDataUrl) {
                        ok.put("dataUrl", fileToJpegDataUrl(cacheFile));
                    }
                    call.resolve(ok);
                    return;
                }

                if (Boolean.TRUE.equals(noArtCache.get(finalKey))) {
                    JSObject none = new JSObject();
                    none.put("hasArt", false);
                    call.resolve(none);
                    return;
                }

                Bitmap bmp = extractArtworkBitmap(contentUriStr, ruta, albumId);
                if (bmp != null) {
                    saveScaledJpeg(bmp, cacheFile, 360);
                    bmp.recycle();
                    if (cacheFile.exists() && cacheFile.length() > 0) {
                        JSObject ok = new JSObject();
                        ok.put("hasArt", true);
                        ok.put("filePath", cacheFile.getAbsolutePath());
                        if (includeDataUrl) {
                            ok.put("dataUrl", fileToJpegDataUrl(cacheFile));
                        }
                        call.resolve(ok);
                        return;
                    }
                }

                noArtCache.put(finalKey, Boolean.TRUE);
                JSObject none = new JSObject();
                none.put("hasArt", false);
                call.resolve(none);
            } catch (Exception e) {
                JSObject none = new JSObject();
                none.put("hasArt", false);
                call.resolve(none);
            }
        });
    }

    @PluginMethod
    public void prepararAudioReproduccion(PluginCall call) {
        String ruta = safeStr(call.getString("ruta", ""));
        String contentUriStr = safeStr(call.getString("contentUri", ""));
        String archivo = safeStr(call.getString("archivo", "track.mp3"));

        getBridge().execute(() -> {
            try {
                if (!ruta.isEmpty()) {
                    File direct = new File(ruta);
                    if (direct.exists() && direct.canRead() && direct.length() > 0) {
                        JSObject res = new JSObject();
                        res.put("filePath", direct.getAbsolutePath());
                        res.put("isTemp", false);
                        call.resolve(res);
                        return;
                    }
                }

                if (contentUriStr.isEmpty()) {
                    call.reject("Ruta o URI de audio faltante");
                    return;
                }

                String ext = getExtensionOrDefault(archivo, "mp3");
                File outFile = new File(getContext().getCacheDir(), "current_playback_track." + ext);
                copyContentUriToFile(Uri.parse(contentUriStr), outFile);

                if (outFile.exists() && outFile.length() > 0) {
                    JSObject res = new JSObject();
                    res.put("filePath", outFile.getAbsolutePath());
                    res.put("isTemp", true);
                    call.resolve(res);
                } else {
                    call.reject("No se pudo leer el flujo de audio");
                }
            } catch (Exception e) {
                call.reject("Error preparando audio: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void copiarATonoAlarma(PluginCall call) {
        String ruta = safeStr(call.getString("ruta", ""));
        String contentUriStr = safeStr(call.getString("contentUri", ""));
        String nombre = safeStr(call.getString("nombre", "custom_tone.mp3"));

        getBridge().execute(() -> {
            try {
                File tonesDir = new File(getContext().getFilesDir(), "alarm_tones");
                if (!tonesDir.exists()) tonesDir.mkdirs();
                String safeName = new File(nombre).getName().replaceAll("[^a-zA-Z0-9._-]", "_");
                if (safeName.isEmpty()) safeName = "custom_tone.mp3";
                File dest = new File(tonesDir, safeName);

                boolean copied = false;
                if (!ruta.isEmpty()) {
                    File src = new File(ruta);
                    if (src.exists() && src.canRead() && src.length() > 0) {
                        try (FileInputStream fis = new FileInputStream(src);
                             FileOutputStream fos = new FileOutputStream(dest)) {
                            byte[] buf = new byte[16384];
                            int len;
                            while ((len = fis.read(buf)) > 0) {
                                fos.write(buf, 0, len);
                            }
                            fos.flush();
                            copied = true;
                        } catch (Exception ignored) {}
                    }
                }

                if (!copied && !contentUriStr.isEmpty()) {
                    copyContentUriToFile(Uri.parse(contentUriStr), dest);
                    copied = dest.exists() && dest.length() > 0;
                }

                if (copied) {
                    JSObject res = new JSObject();
                    res.put("nombre", safeName);
                    res.put("size", dest.length());
                    call.resolve(res);
                } else {
                    call.reject("No se pudo copiar tono al almacenamiento de alarmas");
                }
            } catch (Exception e) {
                call.reject("Error copiando tono: " + e.getMessage());
            }
        });
    }

    private Bitmap extractArtworkBitmap(String contentUriStr, String ruta, long albumId) {
        MediaMetadataRetriever mmr = new MediaMetadataRetriever();
        try {
            boolean loaded = false;
            if (!contentUriStr.isEmpty()) {
                try {
                    mmr.setDataSource(getContext(), Uri.parse(contentUriStr));
                    loaded = true;
                } catch (Exception ignored) {}
            }
            if (!loaded && !ruta.isEmpty()) {
                try {
                    mmr.setDataSource(ruta);
                    loaded = true;
                } catch (Exception ignored) {}
            }
            if (loaded) {
                byte[] art = mmr.getEmbeddedPicture();
                if (art != null && art.length > 0) {
                    return decodeSampledBitmapFromBytes(art, 360, 360);
                }
            }
        } catch (Exception ignored) {
        } finally {
            try { mmr.release(); } catch (Exception ignored) {}
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && !contentUriStr.isEmpty()) {
            try {
                return getContext().getContentResolver().loadThumbnail(Uri.parse(contentUriStr), new Size(360, 360), null);
            } catch (Exception ignored) {}
        }

        if (albumId > 0) {
            try {
                Uri artUri = ContentUris.withAppendedId(Uri.parse("content://media/external/audio/albumart"), albumId);
                try (InputStream is = getContext().getContentResolver().openInputStream(artUri)) {
                    if (is != null) {
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        byte[] buf = new byte[8192];
                        int n;
                        while ((n = is.read(buf)) > 0) baos.write(buf, 0, n);
                        byte[] data = baos.toByteArray();
                        if (data.length > 0) {
                            return decodeSampledBitmapFromBytes(data, 360, 360);
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private Bitmap decodeSampledBitmapFromBytes(byte[] data, int reqW, int reqH) {
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(data, 0, data.length, opts);
        int inSample = 1;
        if (opts.outHeight > reqH || opts.outWidth > reqW) {
            int halfH = opts.outHeight / 2;
            int halfW = opts.outWidth / 2;
            while ((halfH / inSample) >= reqH && (halfW / inSample) >= reqW) {
                inSample *= 2;
            }
        }
        opts.inJustDecodeBounds = false;
        opts.inSampleSize = inSample;
        return BitmapFactory.decodeByteArray(data, 0, data.length, opts);
    }

    private void saveScaledJpeg(Bitmap src, File outFile, int maxDim) throws Exception {
        int w = src.getWidth();
        int h = src.getHeight();
        Bitmap toSave = src;
        if (w > maxDim || h > maxDim) {
            float ratio = Math.min((float) maxDim / (float) w, (float) maxDim / (float) h);
            int nw = Math.max(1, Math.round(w * ratio));
            int nh = Math.max(1, Math.round(h * ratio));
            toSave = Bitmap.createScaledBitmap(src, nw, nh, true);
        }
        try (FileOutputStream fos = new FileOutputStream(outFile)) {
            toSave.compress(Bitmap.CompressFormat.JPEG, 86, fos);
            fos.flush();
        } finally {
            if (toSave != src) {
                toSave.recycle();
            }
        }
    }

    private String fileToJpegDataUrl(File file) {
        try (FileInputStream fis = new FileInputStream(file);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = fis.read(buf)) > 0) baos.write(buf, 0, n);
            return "data:image/jpeg;base64," + Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP);
        } catch (Exception e) {
            return "";
        }
    }

    private void copyContentUriToFile(Uri uri, File dest) throws Exception {
        try (InputStream is = getContext().getContentResolver().openInputStream(uri);
             FileOutputStream fos = new FileOutputStream(dest)) {
            if (is == null) throw new Exception("InputStream null");
            byte[] buf = new byte[16384];
            int n;
            while ((n = is.read(buf)) > 0) {
                fos.write(buf, 0, n);
            }
            fos.flush();
        }
    }

    private String safeStr(String s) {
        return s == null ? "" : s.trim();
    }

    private String stripExtension(String name) {
        if (name == null) return "";
        int dot = name.lastIndexOf('.');
        return dot > 0 ? name.substring(0, dot) : name;
    }

    private String getExtensionOrDefault(String name, String defExt) {
        if (name != null) {
            int dot = name.lastIndexOf('.');
            if (dot > 0 && dot < name.length() - 1) {
                String clean = name.substring(dot + 1).toLowerCase(Locale.US).replaceAll("[^a-z0-9]", "");
                if (!clean.isEmpty() && clean.length() <= 5) return clean;
            }
        }
        return defExt;
    }

    private boolean isAudioFileSupported(String name, String mime) {
        String lowerName = name.toLowerCase(Locale.US);
        if (lowerName.endsWith(".mp3") || lowerName.endsWith(".m4a") || lowerName.endsWith(".wav") ||
            lowerName.endsWith(".ogg") || lowerName.endsWith(".aac") || lowerName.endsWith(".flac") ||
            lowerName.endsWith(".opus")) {
            return true;
        }
        return mime.startsWith("audio/");
    }

    private String extractFolderName(String relPath, String dataPath) {
        if (relPath != null && !relPath.isEmpty()) {
            String cleaned = relPath.replace('\\\\', '/');
            while (cleaned.endsWith("/")) cleaned = cleaned.substring(0, cleaned.length() - 1);
            int idx = cleaned.lastIndexOf('/');
            String seg = idx >= 0 ? cleaned.substring(idx + 1) : cleaned;
            if (!seg.isEmpty()) return seg;
        }
        if (dataPath != null && !dataPath.isEmpty()) {
            File parent = new File(dataPath).getParentFile();
            if (parent != null && parent.getName() != null && !parent.getName().isEmpty()) {
                return parent.getName();
            }
        }
        return "Principal";
    }

    private String buildStableSig(String baseName, long size) {
        String clean = baseName.toLowerCase(Locale.US).replaceAll("\\\\s+", " ").trim();
        return clean + "__" + size;
    }

    private String sanitizeKey(String raw) {
        if (raw == null) return "";
        return raw.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
''')


# ------------------------------------------------------------------------------
# 6C. MonarcaLocalBridgePlugin.java: Autodescubrimiento UDP + POST HTTP LAN nativo
# ------------------------------------------------------------------------------
write_java('MonarcaLocalBridgePlugin.java', '''
package com.monarca.app;

import android.content.Context;
import android.net.wifi.WifiManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "MonarcaLocalBridge")
public class MonarcaLocalBridgePlugin extends Plugin {
    private static final String DISCOVERY_TOKEN = "MONARCA_AUTOPC_DISCOVER_V1";
    private final ExecutorService executor = Executors.newCachedThreadPool();

    private String readStreamUtf8(InputStream is) {
        if (is == null) return "";
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private boolean checkStatusEndpoint(String baseUrl, int timeoutMs) {
        HttpURLConnection conn = null;
        try {
            String clean = baseUrl.replaceAll("/+$", "");
            URL url = new URL(clean + "/status");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setUseCaches(false);
            int code = conn.getResponseCode();
            if (code >= 200 && code < 300) {
                String body = readStreamUtf8(conn.getInputStream());
                JSONObject json = new JSONObject(body);
                return json.optBoolean("ok", false) && "Auto-PC".equals(json.optString("app", ""));
            }
        } catch (Exception ignored) {
        } finally {
            if (conn != null) conn.disconnect();
        }
        return false;
    }

    private List<InetAddress> collectBroadcastAddresses() {
        Set<String> seen = new LinkedHashSet<>();
        List<InetAddress> targets = new ArrayList<>();
        try {
            List<NetworkInterface> ifaces = Collections.list(NetworkInterface.getNetworkInterfaces());
            for (NetworkInterface ni : ifaces) {
                if (ni == null || !ni.isUp() || ni.isLoopback()) continue;
                for (InterfaceAddress ia : ni.getInterfaceAddresses()) {
                    if (ia == null) continue;
                    InetAddress bcast = ia.getBroadcast();
                    if (bcast instanceof Inet4Address) {
                        String host = bcast.getHostAddress();
                        if (host != null && seen.add(host)) {
                            targets.add(bcast);
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        try {
            if (seen.add("255.255.255.255")) {
                targets.add(InetAddress.getByName("255.255.255.255"));
            }
        } catch (Exception ignored) {}
        return targets;
    }

    @PluginMethod
    public void discoverAutoPC(PluginCall call) {
        int udpPort = call.getInt("port", 47622);
        int timeoutMs = call.getInt("timeoutMs", 1400);
        JSArray candidates = call.getArray("candidateUrls");

        executor.execute(() -> {
            Set<String> foundUrls = new LinkedHashSet<>();
            String primaryUrl = "";
            String source = "none";

            if (candidates != null) {
                for (int i = 0; i < candidates.length(); i++) {
                    String cand = candidates.optString(i, "").trim().replaceAll("/+$", "");
                    if (cand.isEmpty()) continue;
                    if (checkStatusEndpoint(cand, Math.min(750, Math.max(400, timeoutMs / 2)))) {
                        foundUrls.add(cand);
                        if (primaryUrl.isEmpty()) primaryUrl = cand;
                        source = "candidate";
                        break;
                    }
                }
            }

            if (primaryUrl.isEmpty()) {
                WifiManager.MulticastLock mLock = null;
                DatagramSocket socket = null;
                try {
                    WifiManager wm = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                    if (wm != null) {
                        mLock = wm.createMulticastLock("MonarcaAutoPCDiscovery");
                        mLock.setReferenceCounted(false);
                        mLock.acquire();
                    }
                    socket = new DatagramSocket();
                    socket.setBroadcast(true);
                    byte[] probe = DISCOVERY_TOKEN.getBytes(StandardCharsets.UTF_8);
                    for (InetAddress bcast : collectBroadcastAddresses()) {
                        try {
                            socket.send(new DatagramPacket(probe, probe.length, bcast, udpPort));
                        } catch (Exception ignored) {}
                    }
                    long deadline = System.currentTimeMillis() + Math.max(500, timeoutMs);
                    byte[] buf = new byte[4096];
                    while (System.currentTimeMillis() < deadline) {
                        int rem = (int) Math.max(80, deadline - System.currentTimeMillis());
                        socket.setSoTimeout(rem);
                        DatagramPacket pkt = new DatagramPacket(buf, buf.length);
                        socket.receive(pkt);
                        String raw = new String(pkt.getData(), 0, pkt.getLength(), StandardCharsets.UTF_8).trim();
                        JSONObject reply = new JSONObject(raw);
                        if (reply.optBoolean("ok", false) && "Auto-PC".equals(reply.optString("app", ""))) {
                            int httpPort = reply.optInt("port", 47621);
                            String replyPrimary = reply.optString("primaryUrl", "").trim().replaceAll("/+$", "");
                            JSONArray arr = reply.optJSONArray("lanUrls");
                            if (arr != null) {
                                for (int j = 0; j < arr.length(); j++) {
                                    String u = arr.optString(j, "").trim().replaceAll("/+$", "");
                                    if (!u.isEmpty()) foundUrls.add(u);
                                }
                            }
                            if (pkt.getAddress() != null && httpPort > 0) {
                                String senderUrl = "http://" + pkt.getAddress().getHostAddress() + ":" + httpPort;
                                foundUrls.add(senderUrl);
                                if (replyPrimary.isEmpty()) replyPrimary = senderUrl;
                            }
                            if (!replyPrimary.isEmpty()) {
                                primaryUrl = replyPrimary;
                            } else if (!foundUrls.isEmpty()) {
                                primaryUrl = foundUrls.iterator().next();
                            }
                            if (!primaryUrl.isEmpty()) {
                                source = "udp";
                                break;
                            }
                        }
                    }
                } catch (Exception ignored) {
                } finally {
                    if (socket != null) {
                        try { socket.close(); } catch (Exception ignored) {}
                    }
                    if (mLock != null && mLock.isHeld()) {
                        try { mLock.release(); } catch (Exception ignored) {}
                    }
                }
            }

            JSObject res = new JSObject();
            res.put("found", !primaryUrl.isEmpty());
            res.put("primaryUrl", primaryUrl);
            res.put("source", source);
            JSArray outArr = new JSArray();
            for (String u : foundUrls) outArr.put(u);
            res.put("urls", outArr);
            call.resolve(res);
        });
    }

    @PluginMethod
    public void postToAutoPC(PluginCall call) {
        String rawUrl = String.valueOf(call.getString("url", "")).trim();
        String payload = call.getString("payload", "");
        int timeoutMs = call.getInt("timeoutMs", 5000);

        if (rawUrl.isEmpty() || payload == null || payload.isEmpty()) {
            JSObject invalid = new JSObject();
            invalid.put("ok", false);
            invalid.put("status", 0);
            invalid.put("error", "URL o payload vacío");
            call.resolve(invalid);
            return;
        }

        executor.execute(() -> {
            HttpURLConnection conn = null;
            String cleanBase = rawUrl.replaceAll("/+$", "");
            String endpoint = cleanBase.endsWith("/emily-batch") ? cleanBase : (cleanBase + "/emily-batch");
            try {
                URL url = new URL(endpoint);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setDoOutput(true);
                conn.setConnectTimeout(Math.min(timeoutMs, 2500));
                conn.setReadTimeout(timeoutMs);
                conn.setUseCaches(false);
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");

                byte[] bytes = payload.getBytes(StandardCharsets.UTF_8);
                conn.setFixedLengthStreamingMode(bytes.length);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(bytes);
                    os.flush();
                }

                int status = conn.getResponseCode();
                InputStream stream = (status >= 200 && status < 400) ? conn.getInputStream() : conn.getErrorStream();
                String body = readStreamUtf8(stream);
                boolean parsedOk = status >= 200 && status < 300;
                if (parsedOk && !body.isEmpty()) {
                    try {
                        JSONObject json = new JSONObject(body);
                        parsedOk = json.optBoolean("ok", true);
                    } catch (Exception ignored) {}
                }

                JSObject res = new JSObject();
                res.put("ok", parsedOk);
                res.put("status", status);
                res.put("body", body);
                res.put("url", cleanBase);
                call.resolve(res);
            } catch (Exception e) {
                JSObject errRes = new JSObject();
                errRes.put("ok", false);
                errRes.put("status", 0);
                errRes.put("error", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
                errRes.put("url", cleanBase);
                call.resolve(errRes);
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }
}
''')


# ------------------------------------------------------------------------------
# 6B. MonarcaVoicePlugin.java: Reconocimiento de voz nativo Android (RECORD_AUDIO)
#     para Jarvis Voz IA y dictado de voz en la App IA sin bloqueos de WebView
# ------------------------------------------------------------------------------
write_java('MonarcaVoicePlugin.java', '''
package com.monarca.app;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

@CapacitorPlugin(
    name = "MonarcaVoice",
    permissions = {
        @Permission(
            alias = "microphone",
            strings = { Manifest.permission.RECORD_AUDIO }
        )
    }
)
public class MonarcaVoicePlugin extends Plugin {
    private SpeechRecognizer speechRecognizer;
    private boolean isListening = false;

    private boolean isMicGranted() {
        Context ctx = getContext();
        return ctx != null && ContextCompat.checkSelfPermission(ctx, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private void destroyRecognizerOnUi() {
        if (speechRecognizer != null) {
            try { speechRecognizer.stopListening(); } catch (Exception ignored) {}
            try { speechRecognizer.cancel(); } catch (Exception ignored) {}
            try { speechRecognizer.destroy(); } catch (Exception ignored) {}
            speechRecognizer = null;
        }
        isListening = false;
    }

    private String mapSpeechError(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                return "Permiso de micrófono denegado. Actívalo en Ajustes > Aplicaciones > Emily > Permisos.";
            case SpeechRecognizer.ERROR_NO_MATCH:
                return "No se entendió voz clara. Toca el micrófono e intenta de nuevo.";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                return "No se detectó voz. Toca el micrófono para intentarlo de nuevo.";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                return "Error de red en el reconocimiento de voz.";
            case SpeechRecognizer.ERROR_AUDIO:
                return "Error al capturar el audio del micrófono.";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                return "El micrófono está ocupado. Espera un segundo e intenta de nuevo.";
            default:
                return "No se pudo escuchar el micrófono (código " + error + ").";
        }
    }

    private void beginListeningInternal(PluginCall call) {
        Activity act = getActivity();
        Context ctx = getContext();
        if (act == null || ctx == null) {
            call.reject("Actividad no disponible.");
            return;
        }
        final String lang = call.getString("lang", "es-ES");

        act.runOnUiThread(() -> {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(ctx)) {
                    JSObject err = new JSObject();
                    err.put("code", -1);
                    err.put("message", "Servicio de reconocimiento de voz no disponible en este teléfono. Puedes escribir tu pregunta abajo.");
                    notifyListeners("voiceError", err);
                    JSObject res = new JSObject();
                    res.put("started", false);
                    call.resolve(res);
                    return;
                }

                destroyRecognizerOnUi();
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(ctx);
                speechRecognizer.setRecognitionListener(new RecognitionListener() {
                    @Override
                    public void onReadyForSpeech(Bundle params) {
                        isListening = true;
                        JSObject st = new JSObject();
                        st.put("listening", true);
                        st.put("state", "ready");
                        notifyListeners("voiceState", st);
                    }

                    @Override public void onBeginningOfSpeech() {}
                    @Override public void onRmsChanged(float rmsdB) {}
                    @Override public void onBufferReceived(byte[] buffer) {}

                    @Override
                    public void onEndOfSpeech() {
                        isListening = false;
                    }

                    @Override
                    public void onError(int error) {
                        isListening = false;
                        JSObject err = new JSObject();
                        err.put("code", error);
                        err.put("message", mapSpeechError(error));
                        notifyListeners("voiceError", err);

                        JSObject st = new JSObject();
                        st.put("listening", false);
                        st.put("state", "error");
                        notifyListeners("voiceState", st);
                    }

                    @Override
                    public void onResults(Bundle results) {
                        isListening = false;
                        String text = "";
                        if (results != null) {
                            ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                            if (matches != null && !matches.isEmpty() && matches.get(0) != null) {
                                text = matches.get(0).trim();
                            }
                        }
                        JSObject resObj = new JSObject();
                        resObj.put("text", text);
                        notifyListeners("voiceResult", resObj);

                        JSObject st = new JSObject();
                        st.put("listening", false);
                        st.put("state", "done");
                        notifyListeners("voiceState", st);
                    }

                    @Override
                    public void onPartialResults(Bundle partialResults) {
                        if (partialResults == null) return;
                        ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        if (matches != null && !matches.isEmpty() && matches.get(0) != null) {
                            String txt = matches.get(0).trim();
                            if (!txt.isEmpty()) {
                                JSObject part = new JSObject();
                                part.put("text", txt);
                                notifyListeners("voicePartial", part);
                            }
                        }
                    }

                    @Override public void onEvent(int eventType, Bundle params) {}
                });

                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang);
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);

                isListening = true;
                speechRecognizer.startListening(intent);

                JSObject res = new JSObject();
                res.put("started", true);
                call.resolve(res);
            } catch (Exception e) {
                isListening = false;
                JSObject err = new JSObject();
                err.put("code", -2);
                err.put("message", e.getMessage() != null ? e.getMessage() : "Error al iniciar el micrófono.");
                notifyListeners("voiceError", err);
                call.reject(e.getMessage() != null ? e.getMessage() : "Error al iniciar reconocimiento");
            }
        });
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (!isMicGranted()) {
            requestPermissionForAlias("microphone", call, "micPermsCallback");
            return;
        }
        beginListeningInternal(call);
    }

    @PermissionCallback
    private void micPermsCallback(PluginCall call) {
        if (!isMicGranted()) {
            JSObject err = new JSObject();
            err.put("code", SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS);
            err.put("message", "Permiso de micrófono denegado. Permite el micrófono a Emily en Ajustes para hablar con Jarvis IA.");
            notifyListeners("voiceError", err);
            call.reject("Permiso de micrófono denegado.");
            return;
        }
        beginListeningInternal(call);
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        Activity act = getActivity();
        if (act != null) {
            act.runOnUiThread(() -> {
                destroyRecognizerOnUi();
                JSObject st = new JSObject();
                st.put("listening", false);
                st.put("state", "stopped");
                notifyListeners("voiceState", st);
            });
        }
        JSObject res = new JSObject();
        res.put("stopped", true);
        call.resolve(res);
    }

    @Override
    protected void handleOnDestroy() {
        Activity act = getActivity();
        if (act != null) {
            act.runOnUiThread(this::destroyRecognizerOnUi);
        }
        super.handleOnDestroy();
    }
}
''')


# ------------------------------------------------------------------------------
# 6D. MonarcaPermissionsPlugin.java: Centro unificado de permisos en tiempo real
#     (Notificaciones, Música/Audio, Almacenamiento/Galería, Cámara, Micrófono, Ubicación)
# ------------------------------------------------------------------------------
write_java('MonarcaPermissionsPlugin.java', '''
package com.monarca.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "MonarcaPermissions",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { "android.permission.POST_NOTIFICATIONS" }
        ),
        @Permission(
            alias = "music",
            strings = { "android.permission.READ_MEDIA_AUDIO" }
        ),
        @Permission(
            alias = "storage",
            strings = { "android.permission.READ_MEDIA_IMAGES" }
        ),
        @Permission(
            alias = "legacyStorage",
            strings = { Manifest.permission.READ_EXTERNAL_STORAGE }
        ),
        @Permission(
            alias = "camera",
            strings = { Manifest.permission.CAMERA }
        ),
        @Permission(
            alias = "microphone",
            strings = { Manifest.permission.RECORD_AUDIO }
        ),
        @Permission(
            alias = "location",
            strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }
        )
    }
)
public class MonarcaPermissionsPlugin extends Plugin {
    private static final String PREFS_ASKED = "monarca_perms_asked_prefs";

    private SharedPreferences getAskedPrefs() {
        return getContext().getApplicationContext().getSharedPreferences(PREFS_ASKED, Context.MODE_PRIVATE);
    }

    private boolean wasAskedBefore(String key) {
        try {
            return getAskedPrefs().getBoolean("asked_" + key, false);
        } catch (Exception ignored) {
            return false;
        }
    }

    private void markAsked(String key) {
        try {
            getAskedPrefs().edit().putBoolean("asked_" + key, true).apply();
        } catch (Exception ignored) {}
    }

    private boolean isPermGranted(String perm) {
        Context ctx = getContext();
        return ctx != null && ContextCompat.checkSelfPermission(ctx, perm) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean shouldShowRationaleForAny(String[] perms) {
        Activity act = getActivity();
        if (act == null || perms == null) return false;
        for (String p : perms) {
            if (ActivityCompat.shouldShowRequestPermissionRationale(act, p)) {
                return true;
            }
        }
        return false;
    }

    private JSObject buildPermEntry(String key, boolean granted, String[] permsToCheck, boolean canPromptRuntime) {
        JSObject item = new JSObject();
        item.put("granted", granted);
        String state;
        if (granted) {
            state = "granted";
        } else if (!canPromptRuntime) {
            state = "denied";
        } else if (!wasAskedBefore(key)) {
            state = "prompt";
        } else if (shouldShowRationaleForAny(permsToCheck)) {
            state = "prompt-with-rationale";
        } else {
            state = "denied";
        }
        item.put("state", state);
        item.put("canPrompt", canPromptRuntime);
        return item;
    }

    private JSObject buildSnapshotPayload() {
        Context ctx = getContext();
        int sdk = Build.VERSION.SDK_INT;
        boolean isTiramisuPlus = sdk >= Build.VERSION_CODES.TIRAMISU;

        boolean notifEnabled = NotificationManagerCompat.from(ctx).areNotificationsEnabled();
        boolean notifGranted = isTiramisuPlus
            ? (notifEnabled && isPermGranted("android.permission.POST_NOTIFICATIONS"))
            : notifEnabled;
        boolean notifCanPrompt = isTiramisuPlus;

        boolean musicGranted = isTiramisuPlus
            ? isPermGranted("android.permission.READ_MEDIA_AUDIO")
            : isPermGranted(Manifest.permission.READ_EXTERNAL_STORAGE);

        boolean storageGranted;
        if (isTiramisuPlus) {
            boolean fullImages = isPermGranted("android.permission.READ_MEDIA_IMAGES");
            boolean partialVisual = sdk >= 34 && isPermGranted("android.permission.READ_MEDIA_VISUAL_USER_SELECTED");
            storageGranted = fullImages || partialVisual;
        } else {
            storageGranted = isPermGranted(Manifest.permission.READ_EXTERNAL_STORAGE);
        }

        boolean cameraGranted = isPermGranted(Manifest.permission.CAMERA);
        boolean micGranted = isPermGranted(Manifest.permission.RECORD_AUDIO);
        boolean locGranted = isPermGranted(Manifest.permission.ACCESS_FINE_LOCATION)
            || isPermGranted(Manifest.permission.ACCESS_COARSE_LOCATION);

        JSObject perms = new JSObject();
        perms.put("notifications", buildPermEntry(
            "notifications",
            notifGranted,
            isTiramisuPlus ? new String[] { "android.permission.POST_NOTIFICATIONS" } : new String[0],
            notifCanPrompt
        ));
        perms.put("music", buildPermEntry(
            "music",
            musicGranted,
            new String[] { isTiramisuPlus ? "android.permission.READ_MEDIA_AUDIO" : Manifest.permission.READ_EXTERNAL_STORAGE },
            true
        ));
        perms.put("storage", buildPermEntry(
            "storage",
            storageGranted,
            new String[] { isTiramisuPlus ? "android.permission.READ_MEDIA_IMAGES" : Manifest.permission.READ_EXTERNAL_STORAGE },
            true
        ));
        perms.put("camera", buildPermEntry(
            "camera",
            cameraGranted,
            new String[] { Manifest.permission.CAMERA },
            true
        ));
        perms.put("microphone", buildPermEntry(
            "microphone",
            micGranted,
            new String[] { Manifest.permission.RECORD_AUDIO },
            true
        ));
        perms.put("location", buildPermEntry(
            "location",
            locGranted,
            new String[] { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION },
            true
        ));

        int grantedCount = 0;
        if (notifGranted) grantedCount++;
        if (musicGranted) grantedCount++;
        if (storageGranted) grantedCount++;
        if (cameraGranted) grantedCount++;
        if (micGranted) grantedCount++;
        if (locGranted) grantedCount++;

        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        boolean exactAlarms = sdk < Build.VERSION_CODES.S || (am != null && am.canScheduleExactAlarms());
        boolean fullScreenIntent = true;
        if (sdk >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE && nm != null) {
            try { fullScreenIntent = nm.canUseFullScreenIntent(); } catch (Exception ignored) {}
        }
        boolean batteryOpt = true;
        if (sdk >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            if (pm != null) batteryOpt = pm.isIgnoringBatteryOptimizations(ctx.getPackageName());
        }

        JSObject special = new JSObject();
        special.put("exactAlarms", exactAlarms);
        special.put("fullScreenIntent", fullScreenIntent);
        special.put("batteryOptimization", batteryOpt);

        JSObject summary = new JSObject();
        summary.put("grantedCount", grantedCount);
        summary.put("totalCount", 6);
        summary.put("allGranted", grantedCount == 6);
        summary.put("sdk", sdk);

        JSObject out = new JSObject();
        out.put("sdk", sdk);
        out.put("permissions", perms);
        out.put("special", special);
        out.put("summary", summary);
        return out;
    }

    private String resolveAliasForTipo(String tipo) {
        boolean isTiramisuPlus = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU;
        if ("notifications".equals(tipo)) return isTiramisuPlus ? "notifications" : null;
        if ("music".equals(tipo)) return isTiramisuPlus ? "music" : "legacyStorage";
        if ("storage".equals(tipo)) return isTiramisuPlus ? "storage" : "legacyStorage";
        if ("camera".equals(tipo)) return "camera";
        if ("microphone".equals(tipo)) return "microphone";
        if ("location".equals(tipo)) return "location";
        return null;
    }

    @PluginMethod
    public void estadoPermisos(PluginCall call) {
        call.resolve(buildSnapshotPayload());
    }

    @PluginMethod
    public void solicitarPermiso(PluginCall call) {
        String tipo = call.getString("tipo", "");
        if (tipo == null || tipo.isEmpty()) {
            call.reject("Tipo de permiso requerido");
            return;
        }

        JSObject cur = buildSnapshotPayload();
        JSONObject curPerms = cur.optJSONObject("permissions");
        JSONObject item = curPerms != null ? curPerms.optJSONObject(tipo) : null;
        if (item != null && item.optBoolean("granted", false)) {
            cur.put("justRequested", tipo);
            cur.put("needsSettings", false);
            call.resolve(cur);
            return;
        }

        String alias = resolveAliasForTipo(tipo);
        if (alias == null) {
            cur.put("justRequested", tipo);
            cur.put("needsSettings", true);
            call.resolve(cur);
            return;
        }

        String currentState = item != null ? item.optString("state", "prompt") : "prompt";
        if ("denied".equals(currentState)) {
            cur.put("justRequested", tipo);
            cur.put("needsSettings", true);
            call.resolve(cur);
            return;
        }

        markAsked(tipo);
        if (!isTiramisuPlus() && ("music".equals(tipo) || "storage".equals(tipo))) {
            markAsked("music");
            markAsked("storage");
        }
        requestPermissionForAlias(alias, call, "singlePermCallback");
    }

    private boolean isTiramisuPlus() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU;
    }

    @PermissionCallback
    private void singlePermCallback(PluginCall call) {
        String tipo = call.getString("tipo", "");
        JSObject out = buildSnapshotPayload();
        JSONObject perms = out.optJSONObject("permissions");
        JSONObject item = (perms != null && !tipo.isEmpty()) ? perms.optJSONObject(tipo) : null;
        boolean grantedNow = item != null && item.optBoolean("granted", false);
        String stNow = item != null ? item.optString("state", "prompt") : "prompt";
        out.put("justRequested", tipo);
        out.put("needsSettings", !grantedNow && "denied".equals(stNow));
        call.resolve(out);
    }

    @PluginMethod
    public void solicitarTodosLosPermisos(PluginCall call) {
        boolean tPlus = isTiramisuPlus();
        JSObject cur = buildSnapshotPayload();
        JSONObject perms = cur.optJSONObject("permissions");

        Set<String> aliasSet = new LinkedHashSet<>();
        List<String> keysOrder = new ArrayList<>();
        keysOrder.add("notifications");
        keysOrder.add("music");
        keysOrder.add("storage");
        keysOrder.add("camera");
        keysOrder.add("microphone");
        keysOrder.add("location");

        for (String key : keysOrder) {
            JSONObject entry = perms != null ? perms.optJSONObject(key) : null;
            boolean granted = entry != null && entry.optBoolean("granted", false);
            if (granted) continue;
            String st = entry != null ? entry.optString("state", "prompt") : "prompt";
            if ("denied".equals(st)) continue;
            String alias = resolveAliasForTipo(key);
            if (alias != null) {
                aliasSet.add(alias);
                markAsked(key);
                if (!tPlus && ("music".equals(key) || "storage".equals(key))) {
                    markAsked("music");
                    markAsked("storage");
                }
            }
        }

        if (aliasSet.isEmpty()) {
            cur.put("promptedAliases", 0);
            call.resolve(cur);
            return;
        }

        String[] aliases = aliasSet.toArray(new String[0]);
        requestPermissionForAliases(aliases, call, "allPermsCallback");
    }

    @PermissionCallback
    private void allPermsCallback(PluginCall call) {
        JSObject out = buildSnapshotPayload();
        call.resolve(out);
    }

    @PluginMethod
    public void abrirAjustesApp(PluginCall call) {
        String tipo = call.getString("tipo", "app");
        Context ctx = getContext();
        String pkg = ctx.getPackageName();
        boolean launched = false;
        try {
            if ("notifications".equals(tipo) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                i.putExtra(Settings.EXTRA_APP_PACKAGE, pkg);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(i);
                launched = true;
            }
        } catch (Exception ignored) {}

        if (!launched) {
            try {
                Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                i.setData(Uri.parse("package:" + pkg));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(i);
            } catch (Exception ignored) {}
        }
        call.resolve();
    }
}
''')


# ------------------------------------------------------------------------------
# 7. MainActivity.java: Registra MonarcaAlarm, MonarcaMedia, MonarcaLocalBridge,
#    MonarcaVoice y MonarcaPermissions
# ------------------------------------------------------------------------------
write_java('MainActivity.java', '''
package com.monarca.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MonarcaAlarmPlugin.class);
        registerPlugin(MonarcaMediaPlugin.class);
        registerPlugin(MonarcaLocalBridgePlugin.class);
        registerPlugin(MonarcaVoicePlugin.class);
        registerPlugin(MonarcaPermissionsPlugin.class);
        super.onCreate(savedInstanceState);
        handleAlarmIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleAlarmIntent(intent);
    }

    @SuppressWarnings("deprecation")
    private void handleAlarmIntent(Intent intent) {
        if (intent == null) return;
        if (intent.getBooleanExtra("fromRestTimer", false)) {
            MonarcaRestTimerReceiver.clearRestNotificationOnly(this);
            intent.removeExtra("fromRestTimer");
            MonarcaAlarmPlugin.emitRestTimerOpened();
        }

        String alarmAction = intent.getStringExtra("alarmAction");
        String questId = intent.getStringExtra("questId");
        boolean fromAlarm = intent.getBooleanExtra("fromAlarm", false);

        if ("start".equals(alarmAction) || (fromAlarm && questId != null && !questId.isEmpty())) {
            if (intent.getBooleanExtra("wakeLockScreen", false)) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                    setShowWhenLocked(true);
                    setTurnScreenOn(true);
                } else {
                    getWindow().addFlags(
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    );
                }
            }

            MonarcaAlarmService.stopAlarm(this);
            AlarmAlertActivity.closeIfOpen();

            boolean recordedAlready = intent.getBooleanExtra("recordedAlready", false);
            if (!recordedAlready) {
                AlarmStore.recordPendingAction(this, "start", questId != null ? questId : "", System.currentTimeMillis(), 0L);
            }
            intent.removeExtra("alarmAction");
            intent.removeExtra("fromAlarm");

            MonarcaAlarmPlugin.emitAlarmAction("start", questId != null ? questId : "");
        }
    }
}
''')


# ------------------------------------------------------------------------------
# 8. AndroidManifest.xml: Permisos (incl. Audio MediaStore, Micrófono, Ubicación, Wi-Fi LAN, Alarma)
# ------------------------------------------------------------------------------
manifest_path = 'android/app/src/main/AndroidManifest.xml'
if os.path.exists(manifest_path):
    with open(manifest_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'android:usesCleartextTraffic=' not in content:
        content = content.replace('<application', '<application android:usesCleartextTraffic="true"', 1)

    required_permissions = [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.ACCESS_WIFI_STATE',
        'android.permission.CHANGE_WIFI_MULTICAST_STATE',
        'android.permission.SCHEDULE_EXACT_ALARM',
        'android.permission.USE_EXACT_ALARM',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.VIBRATE',
        'android.permission.WAKE_LOCK',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.USE_FULL_SCREEN_INTENT',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
        'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
        'android.permission.READ_MEDIA_AUDIO',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
    ]

    perms_to_add = []
    for perm in required_permissions:
        if f'android:name="{perm}"' not in content:
            perms_to_add.append(f'    <uses-permission android:name="{perm}" />')

    if 'android.permission.READ_EXTERNAL_STORAGE' not in content:
        perms_to_add.append('    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />')

    if 'android.hardware.camera' not in content:
        perms_to_add.append('    <uses-feature android:name="android.hardware.camera" android:required="false" />')

    if 'android.hardware.microphone' not in content:
        perms_to_add.append('    <uses-feature android:name="android.hardware.microphone" android:required="false" />')

    if 'android.hardware.location.gps' not in content:
        perms_to_add.append('    <uses-feature android:name="android.hardware.location.gps" android:required="false" />')

    if 'android.speech.RecognitionService' not in content:
        perms_to_add.append(textwrap.dedent('''
    <queries>
        <intent>
            <action android:name="android.speech.RecognitionService" />
        </intent>
        <intent>
            <action android:name="android.speech.action.RECOGNIZE_SPEECH" />
        </intent>
    </queries>''').strip('\n'))

    if perms_to_add:
        content = content.replace('</manifest>', '\n'.join(perms_to_add) + '\n</manifest>')

    components_to_add = []

    if 'android:name=".MonarcaAlarmService"' not in content:
        components_to_add.append(textwrap.dedent('''
        <service
            android:name=".MonarcaAlarmService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback" />''').strip('\n'))

    if 'android:name=".MonarcaAlarmReceiver"' not in content:
        components_to_add.append('        <receiver android:name=".MonarcaAlarmReceiver" android:enabled="true" android:exported="false" />')

    if 'android:name=".MonarcaRestTimerReceiver"' not in content:
        components_to_add.append('        <receiver android:name=".MonarcaRestTimerReceiver" android:enabled="true" android:exported="false" />')

    if 'android:name=".BootReceiver"' not in content:
        components_to_add.append(textwrap.dedent('''
        <receiver
            android:name=".BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="com.htc.intent.action.QUICKBOOT_POWERON" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
            </intent-filter>
        </receiver>''').strip('\n'))

    if 'android:name=".AlarmAlertActivity"' not in content:
        components_to_add.append(textwrap.dedent('''
        <activity
            android:name=".AlarmAlertActivity"
            android:exported="false"
            android:showWhenLocked="true"
            android:turnScreenOn="true"
            android:excludeFromRecents="true"
            android:launchMode="singleInstance"
            android:taskAffinity=""
            android:theme="@android:style/Theme.DeviceDefault.NoActionBar" />''').strip('\n'))

    if components_to_add:
        content = content.replace('</application>', '\n' + '\n'.join(components_to_add) + '\n    </application>')

    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("AndroidManifest.xml actualizado con Service, Receivers, Permisos, Red LAN y AlarmAlertActivity")


# ------------------------------------------------------------------------------
# 9. Iconos Nativos de Launcher (Adaptativo v26 + Mipmaps) y Splash Screen Emily
# ------------------------------------------------------------------------------
import glob
import re as _re_icons
import shutil as _shutil_icons

res_dir = 'android/app/src/main/res'
src_android_icons = 'icons/android'
if os.path.exists(res_dir) and os.path.exists(src_android_icons):
    # 9.1 Eliminar posibles definiciones previas de ic_launcher_background para evitar duplicados Gradle
    for xml_file in glob.glob(os.path.join(res_dir, 'values*', '*.xml')):
        try:
            with open(xml_file, 'r', encoding='utf-8') as xf:
                xtxt = xf.read()
            if 'ic_launcher_background' in xtxt:
                xtxt_clean = _re_icons.sub(r'\s*<color\s+name="ic_launcher_background"[^>]*>.*?</color>\s*', '\n', xtxt)
                with open(xml_file, 'w', encoding='utf-8') as xf:
                    xf.write(xtxt_clean)
        except Exception:
            pass

    values_dir = os.path.join(res_dir, 'values')
    os.makedirs(values_dir, exist_ok=True)
    with open(os.path.join(values_dir, 'ic_launcher_background.xml'), 'w', encoding='utf-8') as bgf:
        bgf.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0B1020</color>\n</resources>\n')

    # 9.2 Limpiar iconos anteriores (png, webp, xml) para evitar duplicados de recurso
    for old_pat in ('ic_launcher*.png', 'ic_launcher*.webp', 'ic_launcher*.xml'):
        for fpath in glob.glob(os.path.join(res_dir, 'mipmap-*', old_pat)) + glob.glob(os.path.join(res_dir, 'drawable*', old_pat)):
            try:
                os.remove(fpath)
            except Exception:
                pass

    # 9.3 Copiar mipmaps por densidad (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
    for density in ('mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'):
        m_dir = os.path.join(res_dir, f'mipmap-{density}')
        os.makedirs(m_dir, exist_ok=True)
        for src_name, dst_name in (
            (f'ic_launcher_{density}.png', 'ic_launcher.png'),
            (f'ic_launcher_round_{density}.png', 'ic_launcher_round.png'),
            (f'ic_launcher_foreground_{density}.png', 'ic_launcher_foreground.png'),
        ):
            s_path = os.path.join(src_android_icons, src_name)
            if os.path.exists(s_path):
                _shutil_icons.copy2(s_path, os.path.join(m_dir, dst_name))

    # 9.4 Configurar iconos adaptativos Android 8+ (mipmap-anydpi-v26)
    anydpi_dir = os.path.join(res_dir, 'mipmap-anydpi-v26')
    os.makedirs(anydpi_dir, exist_ok=True)
    adaptive_xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
        '</adaptive-icon>\n'
    )
    for xml_name in ('ic_launcher.xml', 'ic_launcher_round.xml'):
        with open(os.path.join(anydpi_dir, xml_name), 'w', encoding='utf-8') as af:
            af.write(adaptive_xml)

    # 9.5 Reemplazar pantallas de carga (splash.png) manteniendo proporción vertical/horizontal
    splash_port = os.path.join(src_android_icons, 'splash.png')
    splash_land = os.path.join(src_android_icons, 'splash_land.png')
    if os.path.exists(splash_port):
        for s_target in glob.glob(os.path.join(res_dir, 'drawable*', 'splash.png')):
            folder_name = os.path.basename(os.path.dirname(s_target)).lower()
            src_sp = splash_land if ('-land' in folder_name and os.path.exists(splash_land)) else splash_port
            _shutil_icons.copy2(src_sp, s_target)

    print("Iconos nativos Emily (mipmap-* + adaptativos v26 + splash) aplicados exitosamente en Android")

