import os
import textwrap

# ==============================================================================
# CONFIGURACIÓN NATIVA ANDROID · SISTEMA MONARCA
# Implementación de Alarma Despertador a Pantalla Completa (Opción B)
# ==============================================================================

java_dir = 'android/app/src/main/java/com/monarca/app'
os.makedirs(java_dir, exist_ok=True)

# 1. Escribir AlarmAlertActivity.java (Pantalla Completa Nativa y Sonido Despertador)
alert_activity_path = os.path.join(java_dir, 'AlarmAlertActivity.java')
with open(alert_activity_path, 'w', encoding='utf-8') as f:
    f.write(textwrap.dedent('''package com.monarca.app;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class AlarmAlertActivity extends Activity {
    private static Ringtone ringtone;
    private static Vibrator vibrator;

    public static synchronized void stopAlarmSound() {
        try {
            if (ringtone != null && ringtone.isPlaying()) {
                ringtone.stop();
                ringtone = null;
            }
            if (vibrator != null) {
                vibrator.cancel();
                vibrator = null;
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Forzar encendido de pantalla y mostrar sobre el bloqueo
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        );

        String titulo = getIntent().getStringExtra("titulo");
        if (titulo == null || titulo.isEmpty()) titulo = "Quest Diaria Activada";

        String penitencia = getIntent().getStringExtra("penitencia");
        if (penitencia == null || penitencia.isEmpty()) penitencia = "30 Flexiones inmediatas";

        boolean esOmitible = getIntent().getBooleanExtra("esOmitible", true);
        String questId = getIntent().getStringExtra("questId");
        int notifId = getIntent().getIntExtra("id", 1001);

        // Iniciar sonido y vibración tipo alarma
        startAlarmSound();

        // Crear Interfaz de Usuario Nativa a Pantalla Completa
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#090d16"));
        root.setGravity(Gravity.CENTER);
        root.setPadding(48, 64, 48, 64);

        // Ícono de alarma
        TextView iconView = new TextView(this);
        iconView.setText("⏰");
        iconView.setTextSize(64);
        iconView.setGravity(Gravity.CENTER);
        root.addView(iconView);

        // Badge superior
        TextView badgeView = new TextView(this);
        badgeView.setText(esOmitible ? "¡QUEST DIARIA ACTIVADA!" : "🚨 ¡QUEST OBLIGATORIA (NO OMITIBLE)!");
        badgeView.setTextSize(14);
        badgeView.setTypeface(null, Typeface.BOLD);
        badgeView.setTextColor(esOmitible ? Color.parseColor("#38bdf8") : Color.parseColor("#ef4444"));
        badgeView.setGravity(Gravity.CENTER);
        badgeView.setPadding(0, 24, 0, 16);
        root.addView(badgeView);

        // Título de la quest
        TextView titleView = new TextView(this);
        titleView.setText(titulo);
        titleView.setTextSize(26);
        titleView.setTypeface(null, Typeface.BOLD);
        titleView.setTextColor(Color.WHITE);
        titleView.setGravity(Gravity.CENTER);
        titleView.setPadding(0, 0, 0, 24);
        root.addView(titleView);

        // Caja de penitencia
        LinearLayout penBox = new LinearLayout(this);
        penBox.setOrientation(LinearLayout.VERTICAL);
        penBox.setBackgroundColor(Color.parseColor("#1e1b4b"));
        penBox.setPadding(32, 24, 32, 24);
        penBox.setGravity(Gravity.CENTER);

        TextView penLabel = new TextView(this);
        penLabel.setText("💀 PENITENCIA SI NO LA CUMPLES:");
        penLabel.setTextSize(12);
        penLabel.setTypeface(null, Typeface.BOLD);
        penLabel.setTextColor(Color.parseColor("#f87171"));
        penBox.addView(penLabel);

        TextView penText = new TextView(this);
        penText.setText(penitencia);
        penText.setTextSize(16);
        penText.setTypeface(null, Typeface.BOLD);
        penText.setTextColor(Color.WHITE);
        penText.setPadding(0, 8, 0, 0);
        penBox.addView(penText);

        root.addView(penBox);

        // Espaciador flexible
        View spacer = new View(this);
        LinearLayout.LayoutParams spParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1.0f);
        root.addView(spacer, spParams);

        // Botón Principal: Abrir Sistema Monarca
        Button btnOpen = new Button(this);
        btnOpen.setText("⚔️ ¡ABRIR MONARCA Y EMPEZAR!");
        btnOpen.setTextSize(16);
        btnOpen.setTypeface(null, Typeface.BOLD);
        btnOpen.setTextColor(Color.WHITE);
        btnOpen.setBackgroundColor(Color.parseColor("#e11d48"));
        btnOpen.setPadding(32, 32, 32, 32);

        btnOpen.setOnClickListener(v -> {
            stopAlarmSound();
            Intent mainIntent = new Intent(AlarmAlertActivity.this, MainActivity.class);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            mainIntent.putExtra("questId", questId);
            startActivity(mainIntent);
            finish();
        });
        root.addView(btnOpen);

        // Botón Secundario: Posponer 1 hora (solo si es omitible)
        if (esOmitible) {
            Button btnSnooze = new Button(this);
            btnSnooze.setText("⏸️ POSPONER 1 HORA");
            btnSnooze.setTextSize(14);
            btnSnooze.setTextColor(Color.parseColor("#cbd5e1"));
            btnSnooze.setBackgroundColor(Color.parseColor("#1e293b"));
            LinearLayout.LayoutParams snooParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            snooParams.setMargins(0, 16, 0, 0);
            btnSnooze.setLayoutParams(snooParams);

            btnSnooze.setOnClickListener(v -> {
                stopAlarmSound();
                long nextTime = System.currentTimeMillis() + (60 * 60 * 1000);
                Intent receiverIntent = new Intent(AlarmAlertActivity.this, MonarcaAlarmReceiver.class);
                if (getIntent().getExtras() != null) {
                    receiverIntent.putExtras(getIntent().getExtras());
                }
                receiverIntent.putExtra("esOmitible", false);

                PendingIntent pi = PendingIntent.getBroadcast(
                    AlarmAlertActivity.this,
                    notifId + 500,
                    receiverIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
                if (am != null) {
                    AlarmManager.AlarmClockInfo info = new AlarmManager.AlarmClockInfo(nextTime, pi);
                    am.setAlarmClock(info, pi);
                }
                finish();
            });
            root.addView(btnSnooze);
        }

        setContentView(root);
    }

    private void startAlarmSound() {
        try {
            stopAlarmSound();
            Uri alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alertUri == null) {
                alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            ringtone = RingtoneManager.getRingtone(getApplicationContext(), alertUri);
            if (ringtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    AudioAttributes aa = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    ringtone.setAudioAttributes(aa);
                }
                ringtone.play();
            }

            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 600, 300, 600, 300, 1000};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopAlarmSound();
    }
}
'''))
print("AlarmAlertActivity.java creada exitosamente")

# 2. Escribir MonarcaAlarmReceiver.java (Despierta el dispositivo y dispara la alarma)
receiver_path = os.path.join(java_dir, 'MonarcaAlarmReceiver.java')
with open(receiver_path, 'w', encoding='utf-8') as f:
    f.write(textwrap.dedent('''package com.monarca.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

public class MonarcaAlarmReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "monarca_alarm_clock_channel";

    @Override
    public void onReceive(Context context, Intent intent) {
        // 1. WakeLock para encender la pantalla físicamente
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                PowerManager.ACQUIRE_CAUSES_WAKEUP |
                PowerManager.ON_AFTER_RELEASE,
                "Monarca:AlarmWakeLock"
            );
            wakeLock.acquire(15000);
        }

        String titulo = intent.getStringExtra("titulo");
        if (titulo == null) titulo = "¡Quest Diaria Activada!";
        String penitencia = intent.getStringExtra("penitencia");
        if (penitencia == null) penitencia = "30 Flexiones";
        int notifId = intent.getIntExtra("id", 1001);

        // 2. Intent a pantalla completa hacia AlarmAlertActivity
        Intent fullScreenIntent = new Intent(context, AlarmAlertActivity.class);
        if (intent.getExtras() != null) {
            fullScreenIntent.putExtras(intent.getExtras());
        }
        fullScreenIntent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        );

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            notifId,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 3. Crear Canal de Alarma Crítica en NotificationManager
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Alarmas de Quests Diarias",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Alarmas críticas y pantalla completa del Sistema Monarca");
                channel.enableVibration(true);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                channel.setBypassDnd(true);
                nm.createNotificationChannel(channel);
            }

            Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(titulo)
                .setContentText("💀 Castigo: " + penitencia)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setContentIntent(fullScreenPendingIntent)
                .setAutoCancel(true)
                .build();

            nm.notify(notifId, notification);
        }

        // 4. Iniciar la actividad de alarma a pantalla completa
        try {
            context.startActivity(fullScreenIntent);
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }
}
'''))
print("MonarcaAlarmReceiver.java creada exitosamente")

# 3. Escribir MonarcaAlarmPlugin.java (Plugin de Capacitor para comunicarse con JavaScript)
plugin_path = os.path.join(java_dir, 'MonarcaAlarmPlugin.java')
with open(plugin_path, 'w', encoding='utf-8') as f:
    f.write(textwrap.dedent('''package com.monarca.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MonarcaAlarm")
public class MonarcaAlarmPlugin extends Plugin {

    @PluginMethod
    public void programarAlarma(PluginCall call) {
        String idStr = call.getString("id", "1001");
        int id = 1001;
        try { id = Integer.parseInt(idStr); } catch (Exception e) { id = Math.abs(idStr.hashCode() % 100000); }

        String titulo = call.getString("titulo", "Quest Diaria");
        String penitencia = call.getString("penitencia", "30 Flexiones");
        boolean esOmitible = call.getBoolean("esOmitible", true);
        String questId = call.getString("questId", "");
        Long timestamp = call.getLong("timestamp");

        long targetMillis;
        if (timestamp != null && timestamp > System.currentTimeMillis()) {
            targetMillis = timestamp;
        } else {
            int hora = call.getInt("hora", 8);
            int minutos = call.getInt("minutos", 0);
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

        Context context = getContext();
        Intent intent = new Intent(context, MonarcaAlarmReceiver.class);
        intent.putExtra("id", id);
        intent.putExtra("titulo", titulo);
        intent.putExtra("penitencia", penitencia);
        intent.putExtra("esOmitible", esOmitible);
        intent.putExtra("questId", questId);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) {
            Intent clockShowIntent = new Intent(context, AlarmAlertActivity.class);
            clockShowIntent.putExtras(intent.getExtras());
            PendingIntent showPendingIntent = PendingIntent.getActivity(
                context,
                id + 1,
                clockShowIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(targetMillis, showPendingIntent);
            am.setAlarmClock(clockInfo, pendingIntent);
            call.resolve();
        } else {
            call.reject("AlarmManager no disponible");
        }
    }

    @PluginMethod
    public void cancelarAlarma(PluginCall call) {
        String idStr = call.getString("id", "1001");
        int id = 1001;
        try { id = Integer.parseInt(idStr); } catch (Exception e) { id = Math.abs(idStr.hashCode() % 100000); }

        Context context = getContext();
        Intent intent = new Intent(context, MonarcaAlarmReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) {
            am.cancel(pendingIntent);
        }
        call.resolve();
    }

    @PluginMethod
    public void pararSonido(PluginCall call) {
        AlarmAlertActivity.stopAlarmSound();
        call.resolve();
    }
}
'''))
print("MonarcaAlarmPlugin.java creada exitosamente")

# 4. Escribir MainActivity.java (Registra el plugin MonarcaAlarm)
main_activity_path = os.path.join(java_dir, 'MainActivity.java')
with open(main_activity_path, 'w', encoding='utf-8') as f:
    f.write(textwrap.dedent('''package com.monarca.app;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MonarcaAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }
    }
}
'''))
print("MainActivity.java configurada con registro de plugin exitosamente")

# 5. Modificar AndroidManifest.xml (Permisos, Receiver y Activity de Alarma)
manifest_path = 'android/app/src/main/AndroidManifest.xml'
if os.path.exists(manifest_path):
    with open(manifest_path, 'r', encoding='utf-8') as f:
        content = f.read()

    permissions = """
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    """

    if '<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT"' not in content:
        content = content.replace('</manifest>', permissions + '\n</manifest>')

    # Inyectar Receiver y Activity en <application>
    components = """
        <receiver android:name=".MonarcaAlarmReceiver" android:exported="false" />
        <activity
            android:name=".AlarmAlertActivity"
            android:showWhenLocked="true"
            android:turnScreenOn="true"
            android:excludeFromRecents="true"
            android:launchMode="singleTask"
            android:theme="@android:style/Theme.DeviceDefault.NoActionBar" />
    """

    if 'android:name=".MonarcaAlarmReceiver"' not in content:
        content = content.replace('</application>', components + '\n    </application>')

    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("AndroidManifest.xml actualizado con Receiver y AlarmAlertActivity exitosamente")
