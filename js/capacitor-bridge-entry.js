import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

if (typeof window !== 'undefined') {
    window.Capacitor = Capacitor;
    window.Capacitor.Plugins = window.Capacitor.Plugins || {};
    window.Capacitor.Plugins.LocalNotifications = LocalNotifications;
    console.log("[Monarca Native] Capacitor Bridge & LocalNotifications inicializados con éxito.");
}
