import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

if (typeof window !== 'undefined') {
    window.Capacitor = Capacitor;
    window.Capacitor.Plugins = window.Capacitor.Plugins || {};
    window.Capacitor.Plugins.LocalNotifications = LocalNotifications;

    try {
        window.Capacitor.Plugins.MonarcaAlarm = registerPlugin('MonarcaAlarm');
        console.log("[Monarca Native] Plugin MonarcaAlarm registrado con éxito.");
    } catch (e) {
        console.warn("[Monarca Native] MonarcaAlarm register error:", e);
    }
}
