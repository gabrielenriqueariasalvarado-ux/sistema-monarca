import os
import textwrap

# 1. Modificar AndroidManifest.xml
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

    if 'android:showWhenLocked="true"' not in content:
        content = content.replace(
            '<activity',
            '<activity\n            android:showWhenLocked="true"\n            android:turnScreenOn="true"'
        )

    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Permisos y atributos inyectados en AndroidManifest.xml exitosamente")

# 2. Modificar MainActivity.java
main_activity = 'android/app/src/main/java/com/monarca/app/MainActivity.java'
if os.path.exists(main_activity):
    java_code = textwrap.dedent("""package com.monarca.app;

    import android.os.Build;
    import android.os.Bundle;
    import android.view.WindowManager;
    import com.getcapacitor.BridgeActivity;

    public class MainActivity extends BridgeActivity {
        @Override
        public void onCreate(Bundle savedInstanceState) {
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
    """)
    with open(main_activity, 'w', encoding='utf-8') as f:
        f.write(java_code)
    print("MainActivity.java configurada con soporte para pantalla bloqueada exitosamente")
