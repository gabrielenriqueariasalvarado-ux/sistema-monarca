import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { MediaSession } from '@jofr/capacitor-media-session';

if (typeof window !== 'undefined') {
    window.Capacitor = Capacitor;
    window.Capacitor.Plugins = window.Capacitor.Plugins || {};
    window.Capacitor.Plugins.LocalNotifications = LocalNotifications;
    window.Capacitor.Plugins.MediaSession = MediaSession;

    try {
        window.Capacitor.Plugins.MonarcaAlarm = registerPlugin('MonarcaAlarm');
        console.log("[Monarca Native] Plugin MonarcaAlarm registrado con éxito.");
    } catch (e) {
        console.warn("[Monarca Native] MonarcaAlarm register error:", e);
    }

    try {
        window.Capacitor.Plugins.MonarcaMedia = registerPlugin('MonarcaMedia');
        console.log("[Monarca Native] Plugin MonarcaMedia registrado con éxito.");
    } catch (e) {
        console.warn("[Monarca Native] MonarcaMedia register error:", e);
    }

    try {
        window.Capacitor.Plugins.MonarcaLocalBridge = registerPlugin('MonarcaLocalBridge');
        console.log("[Monarca Native] Plugin MonarcaLocalBridge registrado con éxito.");
    } catch (e) {
        console.warn("[Monarca Native] MonarcaLocalBridge register error:", e);
    }

    try {
        window.Capacitor.Plugins.MonarcaPermissions = registerPlugin('MonarcaPermissions');
        console.log("[Monarca Native] Plugin MonarcaPermissions registrado con éxito.");
    } catch (e) {
        console.warn("[Monarca Native] MonarcaPermissions register error:", e);
    }
}
