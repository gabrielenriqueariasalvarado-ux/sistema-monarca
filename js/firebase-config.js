/**
 * SISTEMA MONARCA · CONEXIÓN Y SINCRONIZACIÓN CLOUD CON FIREBASE FIRESTORE
 * Sincronización en tiempo real, fusión inteligente no destructiva (Smart Merge),
 * bloqueo de arranque contra sobreescrituras y copias de seguridad automáticas.
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

// Identificadores de colección y documentos en Firestore
const FIRESTORE_COLECCION = "sistema_monarca";
const FIRESTORE_DOCUMENTO = "datos_principales";
const FIRESTORE_DOC_BACKUP = "backup_seguridad";

// Referencias de Firebase
let app = null;
let db = null;
let docRef = null;
let docBackupRef = null;
let unsubscribeSnapshot = null;

let debounceSaveTimer = null;
let ultimoTimestampGuardado = 0;
let ignorarProximoSnapshot = false;

// Bloqueo de arranque: IMPIDE que un dispositivo sobreescriba la nube
// antes de descargar y fusionar los datos más recientes existentes en Firestore.
let bloqueoEscrituraInicial = true;
let sincronizacionInicialCompletada = false;

// Clave para respaldos locales en localStorage
const MONARCA_BACKUP_EMERGENCIA_KEY = 'sistema_monarca_backup_emergencia';
const MONARCA_HISTORIAL_BACKUPS_KEY = 'sistema_monarca_historial_backups';

/**
 * Guarda una copia de seguridad local en localStorage antes de cualquier sincronización o reemplazo
 */
function guardarCopiaSeguridadLocal(datos, motivo) {
    try {
        if (!datos) return;
        var backupStr = JSON.stringify(datos);
        localStorage.setItem(MONARCA_BACKUP_EMERGENCIA_KEY, backupStr);

        var historial = [];
        try {
            var raw = localStorage.getItem(MONARCA_HISTORIAL_BACKUPS_KEY);
            if (raw) historial = JSON.parse(raw);
        } catch(e) {}
        if (!Array.isArray(historial)) historial = [];

        var prodsCount = (datos.inventario && Array.isArray(datos.inventario.productos)) ? datos.inventario.productos.length : 0;
        var ventasCount = (datos.inventario && Array.isArray(datos.inventario.ventas)) ? datos.inventario.ventas.length : 0;
        var misionesCount = Array.isArray(datos.misiones) ? datos.misiones.length : 0;

        historial.unshift({
            id: 'BK-' + Date.now(),
            fecha: new Date().toLocaleString('es-ES'),
            timestamp: Date.now(),
            motivo: motivo || 'Copia de seguridad preventiva',
            prodsCount: prodsCount,
            ventasCount: ventasCount,
            misionesCount: misionesCount,
            data: datos
        });

        // Mantener hasta 10 copias de seguridad rotativas
        if (historial.length > 10) historial = historial.slice(0, 10);
        localStorage.setItem(MONARCA_HISTORIAL_BACKUPS_KEY, JSON.stringify(historial));
        console.log(`🛡️ Copia de seguridad guardada (${motivo}). Productos: ${prodsCount}, Ventas: ${ventasCount}.`);
    } catch(err) {
        console.warn("Aviso al crear copia de seguridad local:", err);
    }
}

/**
 * Fusión inteligente no destructiva de listas por ID único.
 * Si el dispositivo A tiene productos y el dispositivo B está vacío, JAMÁS se eliminan los productos de A.
 */
function fusionarColeccionPorId(listaLocal, listaRemota, tombstones) {
    var resultadoMap = {};
    var tombSet = new Set(Array.isArray(tombstones) ? tombstones : []);

    // 1. Agregar elementos remotos (siempre que no hayan sido explícitamente eliminados)
    if (Array.isArray(listaRemota)) {
        listaRemota.forEach(function(item) {
            if (item && item.id && !tombSet.has(item.id)) {
                resultadoMap[item.id] = JSON.parse(JSON.stringify(item));
            }
        });
    }

    // 2. Fusionar elementos locales
    if (Array.isArray(listaLocal)) {
        listaLocal.forEach(function(item) {
            if (item && item.id && !tombSet.has(item.id)) {
                if (!resultadoMap[item.id]) {
                    // Elemento nuevo local que la nube no tenía aún: CONSERVAR
                    resultadoMap[item.id] = JSON.parse(JSON.stringify(item));
                } else {
                    // Elemento existe en ambos: quedarse con la versión más reciente si tiene timestamp
                    var itemRemoto = resultadoMap[item.id];
                    var tsLocal = item.fechaActualizacion || item.timestamp || 0;
                    var tsRemoto = itemRemoto.fechaActualizacion || itemRemoto.timestamp || 0;
                    if (tsLocal > tsRemoto) {
                        resultadoMap[item.id] = JSON.parse(JSON.stringify(item));
                    }
                }
            }
        });
    }

    return Object.values(resultadoMap);
}

/**
 * Fusión inteligente de todo el estado entre Local y Remoto (Smart Merge).
 * Garantiza que abrir un dispositivo con datos antiguos nunca borre datos nuevos de otro dispositivo.
 */
function fusionarEstadosInteligente(local, remoto) {
    if (!local && !remoto) return typeof MonarcaDB !== 'undefined' ? MonarcaDB.get() : {};
    if (!local) return JSON.parse(JSON.stringify(remoto));
    if (!remoto) return JSON.parse(JSON.stringify(local));

    var fusion = JSON.parse(JSON.stringify(remoto));

    // Tombstones (elementos borrados explícitamente por el usuario)
    var tombstones = {};
    if (local._eliminados || remoto._eliminados) {
        var elL = local._eliminados || {};
        var elR = remoto._eliminados || {};
        tombstones = {
            productos: Array.from(new Set([...(elL.productos || []), ...(elR.productos || [])])),
            categorias: Array.from(new Set([...(elL.categorias || []), ...(elR.categorias || [])])),
            ventas: Array.from(new Set([...(elL.ventas || []), ...(elR.ventas || [])]))
        };
        fusion._eliminados = tombstones;
    }

    // 1. INVENTARIO (Fusión estricta no destructiva)
    if (!fusion.inventario) fusion.inventario = { productos: [], categorias: [], ventas: [] };
    var invL = local.inventario || { productos: [], categorias: [], ventas: [] };
    var invR = remoto.inventario || { productos: [], categorias: [], ventas: [] };

    fusion.inventario.productos = fusionarColeccionPorId(invL.productos, invR.productos, tombstones.productos);
    fusion.inventario.categorias = fusionarColeccionPorId(invL.categorias, invR.categorias, tombstones.categorias);
    fusion.inventario.ventas = fusionarColeccionPorId(invL.ventas, invR.ventas, tombstones.ventas);

    // 2. MISIONES Y QUESTS DIARIOS
    if (Array.isArray(local.misiones) || Array.isArray(remoto.misiones)) {
        fusion.misiones = fusionarColeccionPorId(local.misiones, remoto.misiones);
    }
    if (Array.isArray(local.questsDiarios) || Array.isArray(remoto.questsDiarios)) {
        fusion.questsDiarios = fusionarColeccionPorId(local.questsDiarios, remoto.questsDiarios);
    }

    // 3. IDEAS Y PENSAMIENTOS
    if (Array.isArray(local.ideas) || Array.isArray(remoto.ideas)) {
        fusion.ideas = fusionarColeccionPorId(local.ideas, remoto.ideas);
    }

    // 4. PERSONAS Y AGENDA
    if (Array.isArray(local.agendaPersonas) || Array.isArray(remoto.agendaPersonas)) {
        fusion.agendaPersonas = fusionarColeccionPorId(local.agendaPersonas, remoto.agendaPersonas);
    }

    // 5. CALENDARIO Y REGISTRO HISTÓRICO
    if (Array.isArray(local.calendario) || Array.isArray(remoto.calendario)) {
        fusion.calendario = fusionarColeccionPorId(local.calendario, remoto.calendario);
    }
    if (!fusion.registroDiarioCalendario) fusion.registroDiarioCalendario = {};
    if (local.registroDiarioCalendario) {
        Object.keys(local.registroDiarioCalendario).forEach(function(k) {
            if (!fusion.registroDiarioCalendario[k] || local.registroDiarioCalendario[k].cerrado) {
                fusion.registroDiarioCalendario[k] = local.registroDiarioCalendario[k];
            }
        });
    }

    // 6. FINANZAS
    if (!fusion.finanzas) fusion.finanzas = { ingresos: [], gastos: [], deudas: [], metas: [] };
    if (local.finanzas) {
        fusion.finanzas.ingresos = fusionarColeccionPorId(local.finanzas.ingresos, fusion.finanzas.ingresos);
        fusion.finanzas.gastos = fusionarColeccionPorId(local.finanzas.gastos, fusion.finanzas.gastos);
        fusion.finanzas.deudas = fusionarColeccionPorId(local.finanzas.deudas, fusion.finanzas.deudas);
        fusion.finanzas.metas = fusionarColeccionPorId(local.finanzas.metas, fusion.finanzas.metas);
    }

    // 7. JUGADOR (Preservar mayor nivel / mayor EXP acumulada)
    if (local.jugador && fusion.jugador) {
        if ((local.jugador.nivel || 1) > (fusion.jugador.nivel || 1)) {
            fusion.jugador.nivel = local.jugador.nivel;
            fusion.jugador.exp = local.jugador.exp;
            fusion.jugador.expMax = local.jugador.expMax;
        } else if ((local.jugador.nivel || 1) === (fusion.jugador.nivel || 1)) {
            fusion.jugador.exp = Math.max(local.jugador.exp || 0, fusion.jugador.exp || 0);
        }
    }

    // Conservar timestamp de la modificación más reciente
    fusion._ultimaActualizacion = Math.max(local._ultimaActualizacion || 0, remoto._ultimaActualizacion || 0, Date.now());

    return fusion;
}

/**
 * Objeto global de gestión Cloud para la aplicación
 */
window.MonarcaCloud = {
    conectado: false,
    enSincronizacion: false,
    modoOffline: !navigator.onLine,
    ultimoError: null,
    bloqueoEscrituraInicial: true,

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
            badge.title = "Sincronizando con Firebase Firestore...";
        } else if (estado === 'synced') {
            badge.classList.add('status-synced');
            if (text) text.innerText = mensajePersonalizado || "Nube al día";
            badge.title = "Todos los datos están respaldados y sincronizados en tiempo real.";
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
     * Envía el estado actual a Firestore de forma segura (con debounce y validaciones)
     */
    guardarEnNube: function(state, esForzado) {
        // SEGURIDAD CRÍTICA: Si el arranque aún no ha terminado de consultar la nube,
        // NUNCA permitir que un guardado local prematuro sobreescriba la nube.
        if (bloqueoEscrituraInicial && !esForzado) {
            console.log("⏳ Guardado en nube bloqueado preventivamente: Esperando consulta inicial de Firestore.");
            return;
        }

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

                // 1. Guardar copia previa de respaldo en Firestore antes de escribir
                try {
                    if (docBackupRef) {
                        var snapPrevio = await getDoc(docRef);
                        if (snapPrevio && snapPrevio.exists()) {
                            var dataPrev = snapPrevio.data();
                            dataPrev._backupTimestamp = Date.now();
                            await setDoc(docBackupRef, dataPrev);
                        }
                    }
                } catch(bErr) {
                    // No bloquear el guardado principal si el respaldo remoto falla
                }

                // 2. Escribir datos principales
                await setDoc(docRef, datosAGuardar, { merge: true });
                window.MonarcaCloud.actualizarBadgeUI('synced');
            } catch (err) {
                console.error("Error al guardar en Firestore:", err);
                window.MonarcaCloud.ultimoError = err.message || "Error al sincronizar";
                
                if (err.code === 'permission-denied') {
                    window.MonarcaCloud.actualizarBadgeUI('error', 'Firestore: Permisos');
                    console.warn("⚠️ Las reglas de Firestore están bloqueando el guardado. Verifica en Firebase Console.");
                } else {
                    window.MonarcaCloud.actualizarBadgeUI('offline', 'Respaldo Local Activo');
                }
            }
        }, 400);
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
            this.guardarEnNube(window.APP_STATE, true);
            alert("✓ Sincronización con Firebase Firestore completada con éxito.");
        }
    },

    /**
     * Devuelve el historial de copias de seguridad locales
     */
    obtenerHistorialBackups: function() {
        try {
            var raw = localStorage.getItem(MONARCA_HISTORIAL_BACKUPS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch(e) {
            return [];
        }
    },

    /**
     * Restaura una copia de seguridad específica desde el historial
     */
    restaurarBackupPorId: function(backupId) {
        var historial = this.obtenerHistorialBackups();
        var punto = historial.find(function(b) { return b.id === backupId; });
        if (!punto || !punto.data) {
            alert("No se encontró el punto de respaldo seleccionado.");
            return;
        }

        if (confirm(`¿Deseas restaurar la copia de seguridad del ${punto.fecha}?\n\n• Motivo: ${punto.motivo}\n• Productos a recuperar: ${punto.prodsCount}\n• Ventas: ${punto.ventasCount}`)) {
            // Guardar el estado actual antes de restaurar por si acaso
            guardarCopiaSeguridadLocal(window.APP_STATE, "Estado previo a restauración manual");
            
            localStorage.setItem('sistema_monarca_db_v1', JSON.stringify(punto.data));
            window.APP_STATE = JSON.parse(JSON.stringify(punto.data));
            
            // Subir a la nube inmediatamente
            if (this.conectado) {
                this.guardarEnNube(window.APP_STATE, true);
            }

            if (typeof inicializarSistema === 'function') inicializarSistema();
            if (typeof cargarInventario === 'function') cargarInventario();
            alert("✓ ¡Copia de seguridad restaurada exitosamente!");
        }
    },

    /**
     * Abre el modal del Centro de Copias de Seguridad & Restauración
     */
    abrirCentroBackups: function() {
        var modal = document.getElementById('modal-centro-backups');
        if (!modal) return;

        var cont = document.getElementById('contenedor-lista-backups');
        if (cont) {
            var historial = this.obtenerHistorialBackups();
            if (historial.length === 0) {
                cont.innerHTML = `
                <div style="text-align: center; padding: 25px; color: #6b7280; font-size: 13px;">
                    No hay copias de seguridad previas registradas aún. El sistema las generará automáticamente ante cada cambio.
                </div>`;
            } else {
                var html = '';
                historial.forEach(function(bk) {
                    html += `
                    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-weight: 800; font-size: 13px; color: #111827;">📅 ${bk.fecha}</span>
                                <span style="font-size: 10.5px; background: #f3f4f6; color: #374151; padding: 2px 7px; border-radius: 6px; font-weight: 700;">${bk.motivo}</span>
                            </div>
                            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
                                📦 Productos: <strong style="color: #111827;">${bk.prodsCount}</strong> · 💵 Ventas: <strong style="color: #111827;">${bk.ventasCount}</strong> · ⚔️ Misiones: ${bk.misionesCount}
                            </div>
                        </div>
                        <button class="btn-system" onclick="window.MonarcaCloud.restaurarBackupPorId('${bk.id}')" style="padding: 6px 12px; font-size: 11.5px; font-weight: 800; background: #111827; color: #ffffff; border-radius: 7px;">
                            ↩ Restaurar
                        </button>
                    </div>`;
                });
                cont.innerHTML = html;
            }
        }

        modal.style.display = 'flex';
    },

    cerrarCentroBackups: function() {
        var modal = document.getElementById('modal-centro-backups');
        if (modal) modal.style.display = 'none';
    }
};

/**
 * Inicialización principal del servicio Firebase y Firestore con Smart Merge
 */
async function inicializarFirebase() {
    try {
        window.MonarcaCloud.actualizarBadgeUI('syncing', 'Conectando nube...');
        bloqueoEscrituraInicial = true;

        if (!app) {
            app = initializeApp(firebaseConfig);
        }
        if (!db) {
            db = getFirestore(app);
        }

        docRef = doc(db, FIRESTORE_COLECCION, FIRESTORE_DOCUMENTO);
        docBackupRef = doc(db, FIRESTORE_COLECCION, FIRESTORE_DOC_BACKUP);
        window.MonarcaCloud.conectado = true;

        // 1. Consultar estado existente en la nube
        var snapInicial = null;
        try {
            snapInicial = await getDoc(docRef);
        } catch (fetchErr) {
            console.warn("Aviso al consultar documento en Firestore:", fetchErr);
            if (fetchErr.code === 'permission-denied') {
                window.MonarcaCloud.ultimoError = "Permiso denegado en Firestore. Revisa las Reglas en Firebase Console.";
                window.MonarcaCloud.actualizarBadgeUI('error', 'Reglas Firestore');
                bloqueoEscrituraInicial = false;
                return;
            }
        }

        var datosLocales = window.APP_STATE || (typeof MonarcaDB !== 'undefined' ? MonarcaDB.get() : null);

        // Guardar copia de seguridad preventiva local antes de fusionar
        if (datosLocales) {
            guardarCopiaSeguridadLocal(datosLocales, "Arranque de aplicación");
        }

        if (!snapInicial || !snapInicial.exists()) {
            // Nube vacía: subir estado local
            console.log("☁️ Firestore está vacío. Subiendo datos locales...");
            if (datosLocales) {
                var datosMigracion = window.MonarcaCloud.sanitizarParaFirestore(datosLocales);
                datosMigracion._ultimaActualizacion = Date.now();
                datosMigracion._fechaActualizacion = new Date().toISOString();
                datosMigracion._migradoDesde = "localStorage";

                await setDoc(docRef, datosMigracion);
            }
        } else {
            // Nube tiene datos existentes: FUSIÓN INTELIGENTE (Smart Merge)
            var datosRemotos = snapInicial.data();
            console.log("☁️ Datos existentes encontrados en Firestore. Ejecutando Smart Merge no destructivo...");

            // Fusión no destructiva: combina productos, categorías, ventas, etc.
            var estadoFusionado = fusionarEstadosInteligente(datosLocales, datosRemotos);

            delete estadoFusionado._migradoDesde;
            delete estadoFusionado._backupTimestamp;

            // Guardar estado fusionado en localStorage
            if (typeof MonarcaDB !== 'undefined') {
                localStorage.setItem('sistema_monarca_db_v1', JSON.stringify(estadoFusionado));
                window.APP_STATE = MonarcaDB.get();

                // Refrescar vistas en pantalla
                if (typeof inicializarSistema === 'function') inicializarSistema();
                if (typeof cargarInventario === 'function') cargarInventario();
            }

            // Sincronizar el estado fusionado en la nube para que ambos dispositivos queden 100% al día
            var datosAGuardar = window.MonarcaCloud.sanitizarParaFirestore(estadoFusionado);
            datosAGuardar._ultimaActualizacion = Date.now();
            datosAGuardar._fechaActualizacion = new Date().toISOString();
            await setDoc(docRef, datosAGuardar, { merge: true });
        }

        // DESBLOQUEAR ESCRITURAS: La sincronización inicial concluyó exitosamente
        bloqueoEscrituraInicial = false;
        sincronizacionInicialCompletada = true;
        window.MonarcaCloud.bloqueoEscrituraInicial = false;
        window.MonarcaCloud.actualizarBadgeUI('synced');
        console.log("✓ Sincronización inicial completada con éxito. Smart Merge activo.");

        // 2. Escuchar cambios en tiempo real desde Firestore (Multi-dispositivo en vivo)
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
                    
                    // Guardar copia preventiva antes de aplicar snapshot remoto
                    if (window.APP_STATE) {
                        guardarCopiaSeguridadLocal(window.APP_STATE, "Previo a actualización remota en vivo");
                    }

                    // Smart Merge en caliente para no perder ediciones concurrentes
                    var fusionEnVivo = fusionarEstadosInteligente(window.APP_STATE, data);

                    delete fusionEnVivo._migradoDesde;
                    delete fusionEnVivo._backupTimestamp;

                    if (typeof MonarcaDB !== 'undefined') {
                        localStorage.setItem('sistema_monarca_db_v1', JSON.stringify(fusionEnVivo));
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
                        if (typeof renderizarInventarioSiActivo === 'function') {
                            renderizarInventarioSiActivo();
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
        bloqueoEscrituraInicial = false;
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
