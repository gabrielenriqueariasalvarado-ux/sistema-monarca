/**
 * SISTEMA MONARCA · CONEXIÓN Y SINCRONIZACIÓN CLOUD CON FIREBASE FIRESTORE
 * Sincronización en tiempo real, migración automática de datos y respaldo offline.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

// Configuración oficial proporcionada por el usuario
const firebaseConfig = {
    apiKey: "AIzaSyDh78Q-cImrS8E3UPry73T04J1LgYj_rfQ",
    authDomain: "sistema-ba326.firebaseapp.com",
    projectId: "sistema-ba326",
    storageBucket: "sistema-ba326.firebasestorage.app",
    messagingSenderId: "426236767151",
    appId: "1:426236767151:web:7e1060f800f500ca6f5d5a"
};

// Identificadores de colección y documento en Firestore
const FIRESTORE_COLECCION = "sistema_monarca";
const FIRESTORE_DOCUMENTO = "datos_principales";

// Referencias de Firebase
let app = null;
let db = null;
let docRef = null;
let unsubscribeSnapshot = null;

let debounceSaveTimer = null;
let ultimoTimestampGuardado = 0;
let ignorarProximoSnapshot = false;
let migradoInicialmente = false;

/**
 * Objeto global de gestión Cloud para la aplicación
 */
window.MonarcaCloud = {
    conectado: false,
    enSincronizacion: false,
    modoOffline: !navigator.onLine,
    ultimoError: null,

    /**
     * Actualiza el badge visual en la interfaz gráfica
     */
    actualizarBadgeUI: function(estado, mensajePersonalizado) {
        var badge = document.getElementById('cloud-sync-badge');
        if (!badge) return;

        var dot = badge.querySelector('.cloud-sync-dot');
        var text = badge.querySelector('.cloud-sync-text');

        badge.classList.remove('status-syncing', 'status-synced', 'status-offline', 'status-error');

        if (estado === 'syncing') {
            badge.classList.add('status-syncing');
            if (text) text.innerText = mensajePersonalizado || "Sincronizando...";
            badge.title = "Guardando cambios en la nube (Firestore)...";
        } else if (estado === 'synced') {
            badge.classList.add('status-synced');
            if (text) text.innerText = mensajePersonalizado || "Nube al día";
            badge.title = "Todos los datos están respaldados en tiempo real en Firebase Firestore.";
        } else if (estado === 'offline') {
            badge.classList.add('status-offline');
            if (text) text.innerText = mensajePersonalizado || "Modo Offline (Local)";
            badge.title = "Sin conexión a internet. Los datos se guardan de forma segura en este dispositivo (localStorage).";
        } else if (estado === 'error') {
            badge.classList.add('status-error');
            if (text) text.innerText = mensajePersonalizado || "Revisar Firestore";
            badge.title = this.ultimoError || "Error al conectar con la base de datos de Firebase.";
        }
    },

    /**
     * Limpia datos para garantizar compatibilidad estricta con Firestore (elimina undefined)
     */
    sanitizarParaFirestore: function(obj) {
        return JSON.parse(JSON.stringify(obj, function(key, value) {
            return typeof value === 'undefined' ? null : value;
        }));
    },

    /**
     * Envía el estado actual a Firestore (con debounce para evitar llamadas excesivas)
     */
    guardarEnNube: function(state) {
        if (!this.conectado || !db || !docRef) {
            return;
        }

        if (!navigator.onLine) {
            this.actualizarBadgeUI('offline');
            return;
        }

        this.actualizarBadgeUI('syncing');

        if (debounceSaveTimer) {
            clearTimeout(debounceSaveTimer);
        }

        debounceSaveTimer = setTimeout(async function() {
            try {
                var now = Date.now();
                ultimoTimestampGuardado = now;
                ignorarProximoSnapshot = true;

                var datosAGuardar = window.MonarcaCloud.sanitizarParaFirestore(state || window.APP_STATE);
                datosAGuardar._ultimaActualizacion = now;
                datosAGuardar._fechaActualizacion = new Date().toISOString();

                await setDoc(docRef, datosAGuardar, { merge: true });
                window.MonarcaCloud.actualizarBadgeUI('synced');
            } catch (err) {
                console.error("Error al guardar en Firestore:", err);
                window.MonarcaCloud.ultimoError = err.message || "Error al sincronizar";
                
                // Si el error es de permisos de Firestore, indicarlo amigablemente
                if (err.code === 'permission-denied') {
                    window.MonarcaCloud.actualizarBadgeUI('error', 'Firestore: Permisos');
                    console.warn("⚠️ Las reglas de Firestore están bloqueando el guardado. Verifica en Firebase Console > Firestore Database > Reglas que estén en modo lectura/escritura.");
                } else {
                    window.MonarcaCloud.actualizarBadgeUI('offline', 'Respaldo Local Activo');
                }
            }
        }, 350);
    },

    /**
     * Fuerza la sincronización inmediata del estado local hacia la nube
     */
    forzarSincronizacion: async function() {
        if (!navigator.onLine) {
            alert("No hay conexión a internet actualmente. Tus datos permanecen 100% seguros en el almacenamiento local de este dispositivo.");
            return;
        }
        if (!this.conectado) {
            await inicializarFirebase();
        }
        if (this.conectado && window.APP_STATE) {
            this.guardarEnNube(window.APP_STATE);
            alert("Sincronización con Firebase Firestore completada con éxito.");
        }
    }
};

/**
 * Inicialización principal del servicio Firebase y Firestore
 */
async function inicializarFirebase() {
    try {
        window.MonarcaCloud.actualizarBadgeUI('syncing', 'Conectando nube...');

        if (!app) {
            app = initializeApp(firebaseConfig);
        }
        if (!db) {
            db = getFirestore(app);
        }

        docRef = doc(db, FIRESTORE_COLECCION, FIRESTORE_DOCUMENTO);
        window.MonarcaCloud.conectado = true;

        // 1. Comprobar datos en la nube y realizar migración si es necesario
        var snapInicial = null;
        try {
            snapInicial = await getDoc(docRef);
        } catch (fetchErr) {
            console.warn("Aviso al consultar documento inicial en Firestore:", fetchErr);
            if (fetchErr.code === 'permission-denied') {
                window.MonarcaCloud.ultimoError = "Permiso denegado en Firestore. Revisa las Reglas en Firebase Console.";
                window.MonarcaCloud.actualizarBadgeUI('error', 'Reglas Firestore');
                return;
            }
        }

        var datosLocales = window.APP_STATE || (typeof MonarcaDB !== 'undefined' ? MonarcaDB.get() : null);

        if (!snapInicial || !snapInicial.exists()) {
            // Nube vacía: Migrar datos locales existentes hacia Firestore
            console.log("☁️ Firestore está vacío. Iniciando migración de datos locales hacia la nube...");
            window.MonarcaCloud.actualizarBadgeUI('syncing', 'Migrando a la nube...');

            if (datosLocales) {
                var datosMigracion = window.MonarcaCloud.sanitizarParaFirestore(datosLocales);
                datosMigracion._ultimaActualizacion = Date.now();
                datosMigracion._fechaActualizacion = new Date().toISOString();
                datosMigracion._migradoDesde = "localStorage";

                await setDoc(docRef, datosMigracion);
                migradoInicialmente = true;
                console.log("✓ Migración completada exitosamente a Firestore.");
            }
        } else {
            // Nube tiene datos existentes: cotejar y fusionar
            var datosRemotos = snapInicial.data();
            console.log("☁️ Datos existentes encontrados en Firestore.");

            // Si los datos remotos son válidos, integrarlos
            if (datosRemotos && (datosRemotos.jugador || datosRemotos.misiones || datosRemotos.ideas)) {
                var localTimestamp = (datosLocales && datosLocales._ultimaActualizacion) ? datosLocales._ultimaActualizacion : 0;
                var remotoTimestamp = datosRemotos._ultimaActualizacion || 0;

                // Si la nube tiene datos más recientes o es la primera sincronización
                if (remotoTimestamp >= localTimestamp) {
                    delete datosRemotos._ultimaActualizacion;
                    delete datosRemotos._fechaActualizacion;
                    delete datosRemotos._migradoDesde;

                    // Preservar estructura íntegra mediante MonarcaDB
                    if (typeof MonarcaDB !== 'undefined') {
                        localStorage.setItem('sistema_monarca_db_v1', JSON.stringify(datosRemotos));
                        window.APP_STATE = MonarcaDB.get();
                        
                        // Refrescar vistas visibles de la UI
                        if (typeof inicializarSistema === 'function') {
                            inicializarSistema();
                        }
                    }
                } else if (datosLocales) {
                    // El dispositivo local tiene datos más frescos: actualizar la nube
                    window.MonarcaCloud.guardarEnNube(datosLocales);
                }
            }
        }

        window.MonarcaCloud.actualizarBadgeUI('synced');

        // 2. Escuchar cambios en tiempo real desde Firestore (Multi-dispositivo)
        if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
        }

        unsubscribeSnapshot = onSnapshot(docRef, function(docSnap) {
            if (ignorarProximoSnapshot) {
                ignorarProximoSnapshot = false;
                return;
            }

            if (docSnap.exists()) {
                var data = docSnap.data();
                var remotoTs = data._ultimaActualizacion || 0;

                if (remotoTs > ultimoTimestampGuardado) {
                    console.log("🔄 Actualización en tiempo real recibida desde Firestore.");
                    delete data._ultimaActualizacion;
                    delete data._fechaActualizacion;
                    delete data._migradoDesde;

                    if (typeof MonarcaDB !== 'undefined') {
                        localStorage.setItem('sistema_monarca_db_v1', JSON.stringify(data));
                        window.APP_STATE = MonarcaDB.get();

                        // Refrescar UI suavemente
                        if (typeof renderizarJugador === 'function' && window.APP_STATE.jugador) {
                            renderizarJugador(window.APP_STATE.jugador);
                        }
                        if (typeof cargarEstadoPersonal === 'function') {
                            cargarEstadoPersonal();
                        }
                        if (typeof renderizarCalendario === 'function') {
                            renderizarCalendario();
                        }
                        if (typeof renderizarMisiones === 'function' && window.APP_STATE.misiones) {
                            renderizarMisiones(window.APP_STATE.misiones);
                        }
                        if (typeof renderizarQuestsDiarios === 'function') {
                            renderizarQuestsDiarios();
                        }
                    }
                    window.MonarcaCloud.actualizarBadgeUI('synced');
                }
            }
        }, function(errorSnap) {
            console.warn("Aviso en el flujo en vivo de Firestore:", errorSnap);
            if (errorSnap.code === 'permission-denied') {
                window.MonarcaCloud.actualizarBadgeUI('error', 'Permisos Firestore');
            } else {
                window.MonarcaCloud.actualizarBadgeUI('offline');
            }
        });

    } catch (errGeneral) {
        console.error("Error al inicializar Firebase Firestore:", errGeneral);
        window.MonarcaCloud.conectado = false;
        window.MonarcaCloud.ultimoError = errGeneral.message;
        window.MonarcaCloud.actualizarBadgeUI('offline', 'Modo Offline (Local)');
    }
}

// Escuchadores de conectividad de red
window.addEventListener('online', function() {
    console.log("🌐 Conexión de red restablecida. Reconectando Firestore...");
    window.MonarcaCloud.modoOffline = false;
    window.MonarcaCloud.actualizarBadgeUI('syncing', 'Reconectando nube...');
    if (window.MonarcaCloud.conectado && window.APP_STATE) {
        window.MonarcaCloud.guardarEnNube(window.APP_STATE);
    } else {
        inicializarFirebase();
    }
});

window.addEventListener('offline', function() {
    console.log("⚡ Sin red. Cambiando a almacenamiento local offline.");
    window.MonarcaCloud.modoOffline = true;
    window.MonarcaCloud.actualizarBadgeUI('offline');
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        inicializarFirebase();
    });
} else {
    inicializarFirebase();
}
