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
# 3. AlarmAlertActivity.java: Pantalla nativa de alarma (solo UI + acciones)
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
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AlarmAlertActivity extends Activity {
    private static volatile AlarmAlertActivity activeInstance = null;

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

        renderFromIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        renderFromIntent(intent);
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

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#090d16"));
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setPadding(56, 84, 56, 72);

        TextView appLabel = new TextView(this);
        appLabel.setText("EMILY · SISTEMA MONARCA");
        appLabel.setTextSize(12);
        appLabel.setTypeface(null, Typeface.BOLD);
        appLabel.setTextColor(Color.parseColor("#64748b"));
        appLabel.setGravity(Gravity.CENTER);
        appLabel.setLetterSpacing(0.15f);
        root.addView(appLabel);

        String currentHour = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());
        TextView clockView = new TextView(this);
        clockView.setText(currentHour);
        clockView.setTextSize(54);
        clockView.setTypeface(null, Typeface.BOLD);
        clockView.setTextColor(Color.WHITE);
        clockView.setGravity(Gravity.CENTER);
        clockView.setPadding(0, 18, 0, 8);
        root.addView(clockView);

        TextView iconView = new TextView(this);
        iconView.setText(esOmitible ? "⏰" : "🚨");
        iconView.setTextSize(46);
        iconView.setGravity(Gravity.CENTER);
        iconView.setPadding(0, 8, 0, 12);
        root.addView(iconView);

        TextView badgeView = new TextView(this);
        badgeView.setText(esOmitible ? "¡QUEST DIARIA ACTIVADA!" : "¡QUEST OBLIGATORIA · NO OMITIBLE!");
        badgeView.setTextSize(13);
        badgeView.setTypeface(null, Typeface.BOLD);
        badgeView.setTextColor(esOmitible ? Color.parseColor("#38bdf8") : Color.parseColor("#f87171"));
        badgeView.setGravity(Gravity.CENTER);
        badgeView.setPadding(0, 4, 0, 14);
        root.addView(badgeView);

        TextView titleView = new TextView(this);
        titleView.setText(finalTitulo);
        titleView.setTextSize(26);
        titleView.setTypeface(null, Typeface.BOLD);
        titleView.setTextColor(Color.WHITE);
        titleView.setGravity(Gravity.CENTER);
        titleView.setPadding(0, 0, 0, 28);
        root.addView(titleView);

        LinearLayout penBox = new LinearLayout(this);
        penBox.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable penBg = new GradientDrawable();
        penBg.setColor(Color.parseColor("#161b2e"));
        penBg.setCornerRadius(28f);
        penBg.setStroke(2, Color.parseColor(esOmitible ? "#334155" : "#991b1b"));
        penBox.setBackground(penBg);
        penBox.setPadding(36, 28, 36, 28);
        penBox.setGravity(Gravity.CENTER);

        TextView penLabel = new TextView(this);
        penLabel.setText("💀 PENITENCIA SI NO LA CUMPLES:");
        penLabel.setTextSize(11);
        penLabel.setTypeface(null, Typeface.BOLD);
        penLabel.setTextColor(Color.parseColor("#f87171"));
        penLabel.setGravity(Gravity.CENTER);
        penBox.addView(penLabel);

        TextView penText = new TextView(this);
        penText.setText(finalPenitencia);
        penText.setTextSize(16);
        penText.setTypeface(null, Typeface.BOLD);
        penText.setTextColor(Color.WHITE);
        penText.setGravity(Gravity.CENTER);
        penText.setPadding(0, 10, 0, 0);
        penBox.addView(penText);

        LinearLayout.LayoutParams penParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        penBox.setLayoutParams(penParams);
        root.addView(penBox);

        View spacer = new View(this);
        LinearLayout.LayoutParams spParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1.0f);
        root.addView(spacer, spParams);

        Button btnOpen = new Button(this);
        btnOpen.setText("⚔️ EMPEZAR MISIÓN");
        btnOpen.setTextSize(17);
        btnOpen.setTypeface(null, Typeface.BOLD);
        btnOpen.setTextColor(Color.WHITE);
        GradientDrawable startBg = new GradientDrawable();
        startBg.setColor(Color.parseColor("#e11d48"));
        startBg.setCornerRadius(28f);
        btnOpen.setBackground(startBg);
        btnOpen.setPadding(32, 36, 32, 36);
        LinearLayout.LayoutParams startParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        btnOpen.setLayoutParams(startParams);

        btnOpen.setOnClickListener(v -> {
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
            btnSnooze.setText("⏸️ POSPONER 1 HORA");
            btnSnooze.setTextSize(15);
            btnSnooze.setTypeface(null, Typeface.BOLD);
            btnSnooze.setTextColor(Color.parseColor("#e2e8f0"));
            GradientDrawable snoozeBg = new GradientDrawable();
            snoozeBg.setColor(Color.parseColor("#1e293b"));
            snoozeBg.setCornerRadius(24f);
            snoozeBg.setStroke(2, Color.parseColor("#334155"));
            btnSnooze.setBackground(snoozeBg);
            btnSnooze.setPadding(32, 30, 32, 30);
            LinearLayout.LayoutParams snooParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            snooParams.setMargins(0, 22, 0, 0);
            btnSnooze.setLayoutParams(snooParams);

            btnSnooze.setOnClickListener(v -> {
                AlarmStore.scheduleSnooze(AlarmAlertActivity.this, finalQuestId, finalTitulo, finalPenitencia, finalTono);
                MonarcaAlarmPlugin.emitAlarmAction("snooze", finalQuestId);
                MonarcaAlarmService.stopAlarm(AlarmAlertActivity.this);
                finish();
            });
            root.addView(btnSnooze);
        }

        setContentView(root);
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
        if (activeInstance == this) {
            activeInstance = null;
        }
        super.onDestroy();
    }
}
''')


# ------------------------------------------------------------------------------
# 4. MonarcaAlarmReceiver.java: Arranca MonarcaAlarmService en primer plano
#    y reprograma automáticamente las alarmas diarias para el día siguiente.
# ------------------------------------------------------------------------------
write_java('MonarcaAlarmReceiver.java', '''
package com.monarca.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;

public class MonarcaAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
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

        try {
            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (Exception e) {
            e.printStackTrace();
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
# 6. MonarcaAlarmPlugin.java: API completa para JS (sincronización, tonos MP3,
#    diagnóstico de permisos Android/HyperOS, accesos a ajustes y pruebas)
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
# 7. MainActivity.java: Registra MonarcaAlarm y procesa el intent "Empezar"
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
# 8. AndroidManifest.xml: Permisos (incl. FOREGROUND_SERVICE_MEDIA_PLAYBACK e
#    ignorar optimización batería), Service, Receivers y AlarmAlertActivity
# ------------------------------------------------------------------------------
manifest_path = 'android/app/src/main/AndroidManifest.xml'
if os.path.exists(manifest_path):
    with open(manifest_path, 'r', encoding='utf-8') as f:
        content = f.read()

    required_permissions = [
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
    ]

    perms_to_add = []
    for perm in required_permissions:
        if f'android:name="{perm}"' not in content:
            perms_to_add.append(f'    <uses-permission android:name="{perm}" />')

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
    print("AndroidManifest.xml actualizado con Service, Receivers, Permisos y AlarmAlertActivity")
