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
    updateDoc,
    onSnapshot,
    collection,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-storage.js";

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
const FIRESTORE_COL_TRANSFERENCIAS = "transferencias_musica";
const FIRESTORE_COL_AUTOPC = "solicitudes_autopc";
const FIRESTORE_COL_IDEAS_IMAGENES = "ideas_imagenes";

// Referencias de Firebase
let app = null;
let db = null;
let storage = null;
let docRef = null;
let docBackupRef = null;
let unsubscribeSnapshot = null;
let unsubscribeAutoPCSnapshot = null;

const CLIENT_INSTANCE_ID = 'CLI-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
let debounceSaveTimer = null;
let ultimoTimestampGuardado = 0;
let _ultimoSnapshotFirma = '';
let _ultimoSnapshotRemotoMs = 0;
let _cambiosPendientesNube = false;
let _guardadoEnCurso = false;
let _reintentarGuardadoAlTerminar = false;
let _ultimoBackupRemotoTs = 0;
let _reintentoCloudTimer = null;
let _reintentoCloudIntento = 0;
let _ultimoWakeRefreshMs = 0;
let _cuotaAgotadaHastaMs = 0;

function _esErrorCuotaFirestore(err) {
    if (!err) return false;
    var code = String(err.code || '').toLowerCase();
    var msg = String(err.message || err || '').toLowerCase();
    return code.indexOf('resource-exhausted') !== -1 || msg.indexOf('quota') !== -1 || msg.indexOf('429') !== -1;
}

function _limpiarReintentoGuardadoNube() {
    if (_reintentoCloudTimer) {
        clearTimeout(_reintentoCloudTimer);
        _reintentoCloudTimer = null;
    }
}

function _programarReintentoGuardadoNube(delayOverrideMs) {
    _limpiarReintentoGuardadoNube();
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    var delays = [5000, 15000, 45000, 120000];
    var waitMs = typeof delayOverrideMs === 'number' && delayOverrideMs > 0
        ? delayOverrideMs
        : delays[Math.min(_reintentoCloudIntento, delays.length - 1)];
    _reintentoCloudIntento++;
    _reintentoCloudTimer = setTimeout(function() {
        _reintentoCloudTimer = null;
        if (_cambiosPendientesNube && window.MonarcaCloud && window.MonarcaCloud.conectado && !bloqueoEscrituraInicial) {
            window.MonarcaCloud._ejecutarGuardadoNube();
        }
    }, waitMs);
}

function _limpiarMapaAutoPCPorTombstones(estado) {
    if (!estado || !estado._eliminados || typeof window.AUTOPC_SOLICITUDES_MAP !== 'object' || !window.AUTOPC_SOLICITUDES_MAP) {
        return;
    }
    var elim = Array.isArray(estado._eliminados.ideas) ? estado._eliminados.ideas : [];
    for (var idx = 0; idx < elim.length; idx++) {
        delete window.AUTOPC_SOLICITUDES_MAP[String(elim[idx])];
    }
}

function _extraerContenidoComparableFirestore(obj) {
    if (!obj || typeof obj !== 'object') return '';
    try {
        var copia = Object.assign({}, obj);
        delete copia._ultimaActualizacion;
        delete copia._fechaActualizacion;
        delete copia._ultimoEditorClientId;
        delete copia._migradoDesde;
        delete copia._backupTimestamp;
        delete copia._backupVersion;
        return JSON.stringify(copia);
    } catch (e) {
        return '';
    }
}

function _tocarSenalAutoPC(accion) {
    try {
        if (!db) return Promise.resolve(false);
        var refSig = doc(db, FIRESTORE_COL_AUTOPC, '_signal');
        var ahoraMs = Date.now();
        return setDoc(refSig, {
            docType: 'signal',
            rev: ahoraMs,
            action: String(accion || 'update'),
            updatedAt: ahoraMs
        }, { merge: true }).catch(function() { return false; });
    } catch (e) {
        return Promise.resolve(false);
    }
}

// Bloqueo de arranque: IMPIDE que un dispositivo sobreescriba la nube
// antes de descargar y fusionar los datos más recientes existentes en Firestore.
let bloqueoEscrituraInicial = true;
let sincronizacionInicialCompletada = false;

// Clave para respaldos locales en localStorage
const MONARCA_BACKUP_EMERGENCIA_KEY = 'sistema_monarca_backup_emergencia';
const MONARCA_HISTORIAL_BACKUPS_KEY = 'sistema_monarca_historial_backups';

/**
 * Guarda una copia de seguridad local en localStorage antes de cualquier sincronización o reemplazo,
 * limitando su peso para no agotar la cuota del almacenamiento principal (sistema_monarca_db_v1).
 */
function guardarCopiaSeguridadLocal(datos, motivo) {
    try {
        if (!datos) return;
        var backupStr = JSON.stringify(datos);

        // Si el estado supera ~1.2 MB en caracteres (~2.4 MB UTF-16), evitar duplicarlo 2+ veces en localStorage
        if (backupStr.length > 1200000) {
            try { localStorage.removeItem(MONARCA_HISTORIAL_BACKUPS_KEY); } catch (e) {}
            try { localStorage.setItem(MONARCA_BACKUP_EMERGENCIA_KEY, backupStr); } catch (e) {
                try { localStorage.removeItem(MONARCA_BACKUP_EMERGENCIA_KEY); } catch (ig) {}
            }
            return;
        }

        try {
            localStorage.setItem(MONARCA_BACKUP_EMERGENCIA_KEY, backupStr);
        } catch (eEmerg) {
            // Liberar historial para priorizar la emergencia y no saturar cuota principal
            try { localStorage.removeItem(MONARCA_HISTORIAL_BACKUPS_KEY); } catch (ig) {}
            return;
        }

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

        // Máximo 2 copias rotativas (1 si el estado supera ~500k chars) para proteger la cuota de localStorage (~5 MB)
        var maxCopias = backupStr.length > 500000 ? 1 : 2;
        if (historial.length > maxCopias) historial = historial.slice(0, maxCopias);

        try {
            localStorage.setItem(MONARCA_HISTORIAL_BACKUPS_KEY, JSON.stringify(historial));
            console.log(`🛡️ Copia de seguridad guardada (${motivo}). Productos: ${prodsCount}, Ventas: ${ventasCount}.`);
        } catch (eHist) {
            // Reintentar con 1 sola copia o limpiar historial si excede cuota
            try {
                localStorage.setItem(MONARCA_HISTORIAL_BACKUPS_KEY, JSON.stringify(historial.slice(0, 1)));
            } catch (eHistSingle) {
                try { localStorage.removeItem(MONARCA_HISTORIAL_BACKUPS_KEY); } catch (ig) {}
            }
        }
    } catch(err) {
        console.warn("Aviso al crear copia de seguridad local:", err);
    }
}

/**
 * Deduplica una lista de quests por identidad semántica (mismo título normalizado y configuración de tiempo)
 * asegurando que no se multipliquen al sincronizar entre móvil y PC.
 */
function deduplicarColeccionQuests(quests, tombstones) {
    if (!Array.isArray(quests)) return [];
    var tombSet = new Set(Array.isArray(tombstones) ? tombstones.map(String) : []);
    var vistos = new Map();
    var resultado = [];

    quests.forEach(function(q) {
        if (!q || !q.id || tombSet.has(String(q.id))) return;
        var clave = (q.titulo || '').trim().toLowerCase();
        if (!clave) {
            resultado.push(q);
            return;
        }

        if (!vistos.has(clave)) {
            vistos.set(clave, q);
            resultado.push(q);
        } else {
            // Duplicado encontrado: conservar la versión con mayor progreso o datos
            var existente = vistos.get(clave);
            if (q.estado === 'completada' && existente.estado !== 'completada') {
                var idx = resultado.indexOf(existente);
                if (idx !== -1) resultado[idx] = q;
                vistos.set(clave, q);
                if (tombSet && existente.id) tombSet.add(String(existente.id));
            } else {
                if (tombSet && q.id) tombSet.add(String(q.id));
            }
        }
    });

    // Registrar los IDs de duplicados purgados en tombstones para que no vuelvan desde la nube
    if (Array.isArray(tombstones) && tombSet) {
        var existingTombStr = new Set(tombstones.map(String));
        tombSet.forEach(function(id) {
            var idStr = String(id);
            if (!existingTombStr.has(idStr)) {
                tombstones.push(idStr);
                existingTombStr.add(idStr);
            }
        });
    }

    return resultado;
}

/**
 * Extrae el timestamp numérico real de una entidad (soportando números, fechas string o el sello de su ID).
 */
function obtenerTimestampNumerico(item) {
    if (!item || typeof item !== 'object') return 0;
    var candidates = [item.fechaActualizacion, item.updatedAt, item.timestampHecha, item.timestamp, item.fechaCreacion];
    // 1. Priorizar valores numéricos válidos (ej. Date.now())
    for (var i = 0; i < candidates.length; i++) {
        var val = candidates[i];
        if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
        if (typeof val === 'string' && /^\d{10,15}$/.test(val.trim())) {
            var asNum = Number(val.trim());
            if (!isNaN(asNum) && asNum > 0) return asNum;
        }
    }
    // 2. Fallback: extraer timestamp incrustado en el ID (ej: PROD-1763..., RUT-1763..., DEU-1763...)
    if (typeof item.id === 'string') {
        var m = item.id.match(/-(\d{10,15})(?:-\d+)?$/);
        if (m && m[1]) {
            var idTs = Number(m[1]);
            if (!isNaN(idTs) && idTs > 0) return idTs;
        }
    }
    // 3. Fallback: parsear fechas string ISO / YYYY-MM-DD
    for (var j = 0; j < candidates.length; j++) {
        var s = candidates[j];
        if (typeof s === 'string' && s.trim()) {
            var parsed = Date.parse(s.trim());
            if (!isNaN(parsed) && parsed > 0) return parsed;
        }
    }
    return 0;
}

/**
 * Deduplica cualquier lista de entidades por nombre o título normalizado,
 * garantizando que productos, ejercicios, rutinas o finanzas no se dupliquen al sincronizar,
 * pero respetando explícitamente los ítems creados con confirmación de nombre duplicado.
 */
function deduplicarColeccionPorNombre(lista, tombstones, campoNombre) {
    if (!Array.isArray(lista)) return [];
    var tombSet = new Set(Array.isArray(tombstones) ? tombstones.map(String) : []);
    var campo = campoNombre || 'nombre';
    var vistos = new Map();
    var resultado = [];

    lista.forEach(function(item) {
        if (!item || !item.id || tombSet.has(String(item.id))) return;
        // Respetar ítems duplicados confirmados intencionalmente por el usuario
        if (item.permitirDuplicadoNombre === true) {
            resultado.push(item);
            return;
        }
        var valor = (item[campo] || item.titulo || item.nombre || '').trim().toLowerCase();
        if (!valor) {
            resultado.push(item);
            return;
        }

        if (!vistos.has(valor)) {
            vistos.set(valor, item);
            resultado.push(item);
        } else {
            // Duplicado encontrado: conservar el más reciente o con más datos
            var existente = vistos.get(valor);
            var tsActual = obtenerTimestampNumerico(item);
            var tsExistente = obtenerTimestampNumerico(existente);

            if (tsActual > tsExistente) {
                var idx = resultado.indexOf(existente);
                if (idx !== -1) resultado[idx] = item;
                vistos.set(valor, item);
                if (tombSet && existente.id) tombSet.add(String(existente.id));
            } else {
                if (tombSet && item.id) tombSet.add(String(item.id));
            }
        }
    });

    if (Array.isArray(tombstones) && tombSet) {
        var existingNameTomb = new Set(tombstones.map(String));
        tombSet.forEach(function(id) {
            var idStr = String(id);
            if (!existingNameTomb.has(idStr)) {
                tombstones.push(idStr);
                existingNameTomb.add(idStr);
            }
        });
    }

    return resultado;
}

/**
 * Fusión inteligente no destructiva de listas por ID único.
 * Si el dispositivo A tiene productos y el dispositivo B está vacío, JAMÁS se eliminan los productos de A.
 */
function fusionarColeccionPorId(listaLocal, listaRemota, tombstones) {
    var resultadoMap = {};
    var tombSet = new Set(Array.isArray(tombstones) ? tombstones.map(String) : []);

    // 1. Agregar elementos remotos (siempre que no hayan sido explícitamente eliminados)
    if (Array.isArray(listaRemota)) {
        listaRemota.forEach(function(item) {
            if (item && item.id) {
                var keyId = String(item.id);
                if (!tombSet.has(keyId)) {
                    resultadoMap[keyId] = JSON.parse(JSON.stringify(item));
                }
            }
        });
    }

    // 2. Fusionar elementos locales
    if (Array.isArray(listaLocal)) {
        listaLocal.forEach(function(item) {
            if (item && item.id) {
                var keyId = String(item.id);
                if (!tombSet.has(keyId)) {
                    if (!resultadoMap[keyId]) {
                        // Elemento nuevo local que la nube no tenía aún: CONSERVAR
                        resultadoMap[keyId] = JSON.parse(JSON.stringify(item));
                    } else {
                        // Elemento existe en ambos: quedarse con la versión más reciente según timestamp real
                        var itemRemoto = resultadoMap[keyId];
                        var tsLocal = obtenerTimestampNumerico(item);
                        var tsRemoto = obtenerTimestampNumerico(itemRemoto);
                        if (tsLocal > tsRemoto) {
                            resultadoMap[keyId] = JSON.parse(JSON.stringify(item));
                        }
                    }
                }
            }
        });
    }

    return Object.values(resultadoMap);
}

/**
 * Fusión inteligente específica para Quests Diarios (v11.23):
 * Si cualquiera de los dos dispositivos ya marcó la quest como 'completada' HOY,
 * ese estado SIEMPRE prevalece sobre 'pendiente', 'en_progreso', 'pospuesta' o 'penalizada'
 * del mismo día (evita que una PC inactiva cuya alarma venció más tarde sobrescriba
 * una rutina que ya culminaste en tu teléfono).
 */
function _obtenerClaveHoyLocalCloud() {
    if (typeof obtenerClaveFechaLocal === 'function') return obtenerClaveFechaLocal();
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function _esMismaFechaLocalDeTs(ts, hoyISO) {
    var n = Number(ts);
    if (!n || isNaN(n)) return false;
    var d = new Date(n);
    if (isNaN(d.getTime())) return false;
    var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return k === hoyISO;
}

function _esQuestCompletadaHoyMerge(q, hoyISO) {
    if (!q || q.estado !== 'completada') return false;
    if (q.fechaCompletadaDia && String(q.fechaCompletadaDia).slice(0, 10) === hoyISO) return true;
    if (q.ultimaActivacionFecha && String(q.ultimaActivacionFecha).slice(0, 10) === hoyISO) return true;
    if (q.fechaCompletada) {
        var parsed = Date.parse(q.fechaCompletada);
        if (!isNaN(parsed) && _esMismaFechaLocalDeTs(parsed, hoyISO)) return true;
    }
    var ts = obtenerTimestampNumerico(q);
    return _esMismaFechaLocalDeTs(ts, hoyISO);
}

function fusionarQuestsDiariosInteligente(listaLocal, listaRemota, tombstones) {
    var resultadoMap = {};
    var tombSet = new Set(Array.isArray(tombstones) ? tombstones.map(String) : []);
    var hoyISO = _obtenerClaveHoyLocalCloud();

    if (Array.isArray(listaRemota)) {
        listaRemota.forEach(function(item) {
            if (item && item.id) {
                var keyId = String(item.id);
                if (!tombSet.has(keyId)) {
                    resultadoMap[keyId] = JSON.parse(JSON.stringify(item));
                }
            }
        });
    }

    if (Array.isArray(listaLocal)) {
        listaLocal.forEach(function(item) {
            if (item && item.id) {
                var keyId = String(item.id);
                if (!tombSet.has(keyId)) {
                    if (!resultadoMap[keyId]) {
                        resultadoMap[keyId] = JSON.parse(JSON.stringify(item));
                    } else {
                        var itemRemoto = resultadoMap[keyId];
                        var localCompHoy = _esQuestCompletadaHoyMerge(item, hoyISO);
                        var remotoCompHoy = _esQuestCompletadaHoyMerge(itemRemoto, hoyISO);

                        if (localCompHoy && !remotoCompHoy) {
                            resultadoMap[keyId] = JSON.parse(JSON.stringify(item));
                            return;
                        }
                        if (remotoCompHoy && !localCompHoy) {
                            return; // Conservar remoto completada hoy
                        }
                        // Si uno saldó penitencia hoy y el otro sigue en penalizada hoy, gana saldada
                        var localSald = item.estado === 'penitencia_cumplida' && _esMismaFechaLocalDeTs(obtenerTimestampNumerico(item), hoyISO);
                        var remotoSald = itemRemoto.estado === 'penitencia_cumplida' && _esMismaFechaLocalDeTs(obtenerTimestampNumerico(itemRemoto), hoyISO);
                        if (localSald && itemRemoto.estado === 'penalizada') {
                            resultadoMap[keyId] = JSON.parse(JSON.stringify(item));
                            return;
                        }
                        if (remotoSald && item.estado === 'penalizada') {
                            return;
                        }

                        var tsLocal = obtenerTimestampNumerico(item);
                        var tsRemoto = obtenerTimestampNumerico(itemRemoto);
                        if (tsLocal > tsRemoto) {
                            resultadoMap[keyId] = JSON.parse(JSON.stringify(item));
                        }
                    }
                }
            }
        });
    }

    return Object.values(resultadoMap);
}

/**
 * Fusión inteligente específica para Banco de Ideas / Auto-PC (v11.33):
 * Si una idea ya fue completada por Auto-PC (`autopcStatus === 'done'` y `hecha === true`),
 * ese estado prevalece sobre copias en `'pending'`, `'running'` o `'awaiting_plan'`,
 * conservando además resúmenes, versión y confirmación de notificaciones sin regresiones.
 */
function fusionarIdeasInteligente(listaLocal, listaRemota, tombstones) {
    var resultadoMap = {};
    var tombSet = new Set(Array.isArray(tombstones) ? tombstones.map(String) : []);

    var mezclarCamposMonotonosIdea = function(prev, cand) {
        if (!prev) return JSON.parse(JSON.stringify(cand));
        if (!cand) return JSON.parse(JSON.stringify(prev));

        var tsPrev = obtenerTimestampNumerico(prev);
        var tsCand = obtenerTimestampNumerico(cand);
        var candHechaPorAutoPC = Boolean(cand.hecha === true && (cand.completadaPorAutoPC || cand.autopcStatus === 'done'));
        var prevHechaPorAutoPC = Boolean(prev.hecha === true && (prev.completadaPorAutoPC || prev.autopcStatus === 'done'));
        var prevUncheckNewer = Boolean(prev.hecha === false && Number(prev.timestampManualUncheck || 0) > Number(cand.timestampHecha || 0));
        var candUncheckNewer = Boolean(cand.hecha === false && Number(cand.timestampManualUncheck || 0) > Number(prev.timestampHecha || 0));

        var winner = null;
        var other = null;
        if (candHechaPorAutoPC && !prevHechaPorAutoPC && !prevUncheckNewer) {
            winner = JSON.parse(JSON.stringify(cand));
            other = prev;
        } else if (prevHechaPorAutoPC && !candHechaPorAutoPC && !candUncheckNewer) {
            winner = JSON.parse(JSON.stringify(prev));
            other = cand;
        } else if (cand.hecha === true && prev.hecha !== true && tsCand >= tsPrev - 5000 && !prevUncheckNewer) {
            winner = JSON.parse(JSON.stringify(cand));
            other = prev;
        } else if (prev.hecha === true && cand.hecha !== true && tsPrev >= tsCand - 5000 && !candUncheckNewer) {
            winner = JSON.parse(JSON.stringify(prev));
            other = cand;
        } else {
            winner = JSON.parse(JSON.stringify(tsCand >= tsPrev ? cand : prev));
            other = tsCand >= tsPrev ? prev : cand;
        }

        if (other) {
            if (!winner.resumenAntigravity && other.resumenAntigravity) {
                winner.resumenAntigravity = String(other.resumenAntigravity);
            }
            if (!winner.resumenVersion && other.resumenVersion) {
                winner.resumenVersion = String(other.resumenVersion);
            }
            if ((!Array.isArray(winner.resumenArchivos) || winner.resumenArchivos.length === 0) && Array.isArray(other.resumenArchivos) && other.resumenArchivos.length > 0) {
                winner.resumenArchivos = other.resumenArchivos.slice(0, 12);
            }
            if (!(Number(winner.resumenPasos) > 0) && Number(other.resumenPasos) > 0) {
                winner.resumenPasos = Number(other.resumenPasos);
            }
            if (!(Number(winner.resumenDuracionMs) > 0) && Number(other.resumenDuracionMs) > 0) {
                winner.resumenDuracionMs = Number(other.resumenDuracionMs);
            }
            if (other.autopcNotifConfirmada === true) {
                winner.autopcNotifConfirmada = true;
            }
            if (winner.autopcStatus === 'done') {
                winner.autopcPendienteSubida = false;
            }
        }
        return winner;
    };

    if (Array.isArray(listaRemota)) {
        listaRemota.forEach(function(item) {
            if (item && item.id) {
                var keyId = String(item.id);
                if (!tombSet.has(keyId)) {
                    resultadoMap[keyId] = JSON.parse(JSON.stringify(item));
                }
            }
        });
    }

    if (Array.isArray(listaLocal)) {
        listaLocal.forEach(function(item) {
            if (item && item.id) {
                var keyId = String(item.id);
                if (!tombSet.has(keyId)) {
                    resultadoMap[keyId] = resultadoMap[keyId]
                        ? mezclarCamposMonotonosIdea(resultadoMap[keyId], item)
                        : JSON.parse(JSON.stringify(item));
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

    // Tombstones exhaustivos de todas las entidades del sistema (con respaldo dinámico)
    var tombstones = {};
    var elL = (local && local._eliminados) ? local._eliminados : {};
    var elR = (remoto && remoto._eliminados) ? remoto._eliminados : {};

    var baseKeys = [
        'productos', 'categorias', 'ventas', 'questsDiarios', 'misiones', 'habilidades',
        'ideas', 'notificacionesAutoPC', 'agendaPersonas', 'gruposPersonas', 'ejercicios', 'rutinas', 'historialDuracionesRutinas', 'ejerciciosMentales',
        'ejerciciosCerebrales', 'conocimientos', 'vocabulario', 'registrosLabores', 'calendario', 'cronogramaSemanal',
        'reproductorPlaylists', 'iaConversaciones',
        'finanzas_ingresos', 'finanzas_gastos', 'finanzas_categoriasGastos', 'finanzas_deudas', 'finanzas_metas', 'finanzas_comparacionesAhorro', 'finanzas_tarjetas', 'finanzas_planificacionCompras',
        'subappBarberia_cortes', 'subappBarberia_clientes', 'subappBarberia_tiposCorte',
        'subappTrainer_alumnos', 'subappTrainer_sesiones', 'subappTrainer_enfoques', 'subappTrainer_sesionesActivas',
        'sueno_registros', 'relacionesIntimas'
    ];
    var allKeys = Array.from(new Set(baseKeys.concat(Object.keys(elL), Object.keys(elR))));

    allKeys.forEach(function(k) {
        var combined = [].concat(
            Array.isArray(elL[k]) ? elL[k] : [],
            Array.isArray(elR[k]) ? elR[k] : []
        ).map(String);
        tombstones[k] = Array.from(new Set(combined));
    });
    fusion._eliminados = tombstones;

    // 1. INVENTARIO (Fusión no destructiva y deduplicación por nombre de producto)
    if (!fusion.inventario) fusion.inventario = { productos: [], categorias: [], ventas: [] };
    var invL = local.inventario || { productos: [], categorias: [], ventas: [] };
    var invR = remoto.inventario || { productos: [], categorias: [], ventas: [] };

    var prodsMerged = fusionarColeccionPorId(invL.productos, invR.productos, tombstones.productos);
    fusion.inventario.productos = deduplicarColeccionPorNombre(prodsMerged, tombstones.productos, 'nombre');

    var catsMerged = fusionarColeccionPorId(invL.categorias, invR.categorias, tombstones.categorias);
    fusion.inventario.categorias = deduplicarColeccionPorNombre(catsMerged, tombstones.categorias, 'nombre');

    fusion.inventario.ventas = fusionarColeccionPorId(invL.ventas, invR.ventas, tombstones.ventas);

    // 2. MISIONES Y QUESTS DIARIOS (Con protección contra duplicación y tombstones)
    if (Array.isArray(local.misiones) || Array.isArray(remoto.misiones)) {
        var misMerged = fusionarColeccionPorId(local.misiones, remoto.misiones, tombstones.misiones);
        fusion.misiones = deduplicarColeccionPorNombre(misMerged, tombstones.misiones, 'titulo');
    }
    if (Array.isArray(local.questsDiarios) || Array.isArray(remoto.questsDiarios)) {
        var questsCombinados = fusionarQuestsDiariosInteligente(local.questsDiarios, remoto.questsDiarios, tombstones.questsDiarios);
        fusion.questsDiarios = deduplicarColeccionQuests(questsCombinados, tombstones.questsDiarios);
    }
    if (Array.isArray(local.habilidades) || Array.isArray(remoto.habilidades)) {
        var habsMerged = fusionarColeccionPorId(local.habilidades, remoto.habilidades, tombstones.habilidades);
        fusion.habilidades = deduplicarColeccionPorNombre(habsMerged, tombstones.habilidades, 'nombre');
    }

    // 3. IDEAS Y PENSAMIENTOS + NOTIFICACIONES AUTO-PC
    if (Array.isArray(local.ideas) || Array.isArray(remoto.ideas)) {
        fusion.ideas = fusionarIdeasInteligente(local.ideas, remoto.ideas, tombstones.ideas);
    }
    if (Array.isArray(local.notificacionesAutoPC) || Array.isArray(remoto.notificacionesAutoPC)) {
        var rawNotifs = fusionarColeccionPorId(
            local.notificacionesAutoPC || [],
            remoto.notificacionesAutoPC || [],
            tombstones.notificacionesAutoPC || []
        );
        var ideasPorId = {};
        if (Array.isArray(fusion.ideas)) {
            fusion.ideas.forEach(function(ideaItem) {
                if (ideaItem && ideaItem.id) ideasPorId[String(ideaItem.id)] = ideaItem;
            });
        }
        var tombNotifsList = tombstones.notificacionesAutoPC || [];
        var tombNotifsSet = new Set(tombNotifsList);
        var tombNotifSolIds = new Set();
        tombNotifsList.forEach(function(t) {
            var baseSol = String(t || '').split('@')[0];
            if (baseSol) tombNotifSolIds.add(baseSol);
        });
        var tombIdeasSet = new Set(tombstones.ideas || []);
        var vistasNotifSol = {};
        var vistasNotifFirma = {};
        fusion.notificacionesAutoPC = rawNotifs.filter(function(n) {
            if (!n || !n.id) return false;
            var nid = String(n.id);
            var solId = String(n.solicitudId || nid.split('@')[0] || '');
            if (tombNotifsSet.has(nid) || (solId && (tombNotifsSet.has(solId) || tombNotifSolIds.has(solId)))) {
                return false;
            }
            if (solId && tombIdeasSet.has(solId)) return false;
            var ideaRef = solId ? ideasPorId[solId] : null;
            if (ideaRef && (ideaRef.autopcNotifConfirmada === true || (ideaRef.hecha === true && !ideaRef.completadaPorAutoPC))) {
                return false;
            }
            if (solId) {
                if (vistasNotifSol[solId]) return false;
                vistasNotifSol[solId] = true;
            }
            var txtNorm = String(n.texto || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 96);
            if (txtNorm) {
                var fKey = txtNorm + '@' + Math.floor((Number(n.timestamp) || 0) / 300000);
                if (vistasNotifFirma[fKey]) return false;
                vistasNotifFirma[fKey] = true;
            }
            return true;
        });
    }

    // 4. PERSONAS, GRUPOS Y AGENDA
    if (Array.isArray(local.agendaPersonas) || Array.isArray(remoto.agendaPersonas)) {
        var perMerged = fusionarColeccionPorId(local.agendaPersonas, remoto.agendaPersonas, tombstones.agendaPersonas);
        fusion.agendaPersonas = deduplicarColeccionPorNombre(perMerged, tombstones.agendaPersonas, 'nombre');
    }
    if (Array.isArray(local.gruposPersonas) || Array.isArray(remoto.gruposPersonas)) {
        fusion.gruposPersonas = fusionarColeccionPorId(local.gruposPersonas, remoto.gruposPersonas, tombstones.gruposPersonas);
    }

    // 5. CALENDARIO, CRONOGRAMA SEMANAL Y REGISTRO HISTÓRICO
    if (Array.isArray(local.calendario) || Array.isArray(remoto.calendario)) {
        fusion.calendario = fusionarColeccionPorId(local.calendario, remoto.calendario, tombstones.calendario);
    }
    if (Array.isArray(local.cronogramaSemanal) || Array.isArray(remoto.cronogramaSemanal)) {
        fusion.cronogramaSemanal = fusionarColeccionPorId(local.cronogramaSemanal, remoto.cronogramaSemanal, tombstones.cronogramaSemanal);
    }
    if (!fusion.registroDiarioCalendario) fusion.registroDiarioCalendario = {};
    if (local.registroDiarioCalendario) {
        Object.keys(local.registroDiarioCalendario).forEach(function(k) {
            if (!fusion.registroDiarioCalendario[k] || local.registroDiarioCalendario[k].cerrado) {
                fusion.registroDiarioCalendario[k] = local.registroDiarioCalendario[k];
            }
        });
    }

    // 6. FINANZAS (Con protección de tombstones por cada categoría)
    if (!fusion.finanzas) fusion.finanzas = { ingresos: [], gastos: [], categoriasGastos: [], deudas: [], metas: [], comparacionesAhorro: [], tarjetas: [], planificacionCompras: [] };
    if (local.finanzas) {
        fusion.finanzas.ingresos = fusionarColeccionPorId(local.finanzas.ingresos, fusion.finanzas.ingresos, tombstones.finanzas_ingresos);
        fusion.finanzas.gastos = fusionarColeccionPorId(local.finanzas.gastos, fusion.finanzas.gastos, tombstones.finanzas_gastos);
        if (Array.isArray(local.finanzas.categoriasGastos) || Array.isArray(fusion.finanzas.categoriasGastos)) {
            var catMerged = fusionarColeccionPorId(local.finanzas.categoriasGastos || [], fusion.finanzas.categoriasGastos || [], tombstones.finanzas_categoriasGastos);
            fusion.finanzas.categoriasGastos = deduplicarColeccionPorNombre(catMerged, tombstones.finanzas_categoriasGastos, 'nombre');
        }
        fusion.finanzas.deudas = fusionarColeccionPorId(local.finanzas.deudas, fusion.finanzas.deudas, tombstones.finanzas_deudas);
        fusion.finanzas.metas = fusionarColeccionPorId(local.finanzas.metas, fusion.finanzas.metas, tombstones.finanzas_metas);
        fusion.finanzas.comparacionesAhorro = fusionarColeccionPorId(local.finanzas.comparacionesAhorro || [], fusion.finanzas.comparacionesAhorro || [], tombstones.finanzas_comparacionesAhorro);
        fusion.finanzas.tarjetas = fusionarColeccionPorId(local.finanzas.tarjetas || [], fusion.finanzas.tarjetas || [], tombstones.finanzas_tarjetas);
        fusion.finanzas.planificacionCompras = fusionarColeccionPorId(local.finanzas.planificacionCompras || [], fusion.finanzas.planificacionCompras || [], tombstones.finanzas_planificacionCompras);
    }

    // 7. EJERCICIOS, RUTINAS Y ENTRENAMIENTO MENTAL / CEREBRAL
    if (Array.isArray(local.ejercicios) || Array.isArray(remoto.ejercicios)) {
        var ejMerged = fusionarColeccionPorId(local.ejercicios, remoto.ejercicios, tombstones.ejercicios);
        fusion.ejercicios = deduplicarColeccionPorNombre(ejMerged, tombstones.ejercicios, 'nombre');
    }
    if (Array.isArray(local.rutinas) || Array.isArray(remoto.rutinas)) {
        var rutMerged = fusionarColeccionPorId(local.rutinas, remoto.rutinas, tombstones.rutinas);
        fusion.rutinas = deduplicarColeccionPorNombre(rutMerged, tombstones.rutinas, 'nombre');
    }
    if (Array.isArray(local.historialDuracionesRutinas) || Array.isArray(remoto.historialDuracionesRutinas)) {
        var durMerged = fusionarColeccionPorId(local.historialDuracionesRutinas || [], remoto.historialDuracionesRutinas || [], tombstones.historialDuracionesRutinas || []);
        durMerged.sort(function(a, b) {
            return (Number(b && (b.timestamp || b.finMs)) || 0) - (Number(a && (a.timestamp || a.finMs)) || 0);
        });
        fusion.historialDuracionesRutinas = durMerged.slice(0, 400);
    }
    if (Array.isArray(local.ejerciciosMentales) || Array.isArray(remoto.ejerciciosMentales)) {
        fusion.ejerciciosMentales = fusionarColeccionPorId(local.ejerciciosMentales, remoto.ejerciciosMentales, tombstones.ejerciciosMentales);
    }
    if (Array.isArray(local.ejerciciosCerebrales) || Array.isArray(remoto.ejerciciosCerebrales)) {
        var cerMerged = fusionarColeccionPorId(local.ejerciciosCerebrales, remoto.ejerciciosCerebrales, tombstones.ejerciciosCerebrales);
        fusion.ejerciciosCerebrales = deduplicarColeccionPorNombre(cerMerged, tombstones.ejerciciosCerebrales, 'nombre');
    }
    if (Array.isArray(local.conocimientos) || Array.isArray(remoto.conocimientos)) {
        var conMerged = fusionarColeccionPorId(local.conocimientos, remoto.conocimientos, tombstones.conocimientos);
        fusion.conocimientos = deduplicarColeccionPorNombre(conMerged, tombstones.conocimientos, 'titulo');
    }
    if (Array.isArray(local.vocabulario) || Array.isArray(remoto.vocabulario)) {
        var vocMerged = fusionarColeccionPorId(local.vocabulario, remoto.vocabulario, tombstones.vocabulario);
        fusion.vocabulario = deduplicarColeccionPorNombre(vocMerged, tombstones.vocabulario, 'palabra');
    }
    if (Array.isArray(local.registrosLabores) || Array.isArray(remoto.registrosLabores)) {
        fusion.registrosLabores = fusionarColeccionPorId(local.registrosLabores, remoto.registrosLabores, tombstones.registrosLabores);
    }

    // 6.5 SUB-APPS LABORALES (BOOM SOLUTIONS & BARBERÍA)
    if (local.subappBoom || remoto.subappBoom) {
        fusion.subappBoom = Object.assign({}, remoto.subappBoom || {}, local.subappBoom || {});
        if (local.subappBoom && local.subappBoom.planificaciones) {
            fusion.subappBoom.planificaciones = Object.assign({}, (remoto.subappBoom ? remoto.subappBoom.planificaciones : {}) || {}, local.subappBoom.planificaciones || {});
        }
    }
    if (local.subappBarberia || remoto.subappBarberia) {
        var barbL = local.subappBarberia || { clientes: [], cortes: [] };
        var barbR = remoto.subappBarberia || { clientes: [], cortes: [] };
        fusion.subappBarberia = Object.assign({}, barbR, barbL);
        fusion.subappBarberia.clientes = fusionarColeccionPorId(barbL.clientes || [], barbR.clientes || [], tombstones.subappBarberia_clientes || []);
        fusion.subappBarberia.cortes = fusionarColeccionPorId(barbL.cortes || [], barbR.cortes || [], tombstones.subappBarberia_cortes || []);
        fusion.subappBarberia.tiposCorte = fusionarColeccionPorId(barbL.tiposCorte || [], barbR.tiposCorte || [], tombstones.subappBarberia_tiposCorte || []);
    }
    if (local.subappTrainer || remoto.subappTrainer) {
        var trainL = local.subappTrainer || { alumnos: [], sesiones: [], rutinasEnfoques: [], sesionesActivas: [] };
        var trainR = remoto.subappTrainer || { alumnos: [], sesiones: [], rutinasEnfoques: [], sesionesActivas: [] };
        fusion.subappTrainer = Object.assign({}, trainR, trainL);
        fusion.subappTrainer.alumnos = fusionarColeccionPorId(trainL.alumnos || [], trainR.alumnos || [], tombstones.subappTrainer_alumnos || []);
        fusion.subappTrainer.sesiones = fusionarColeccionPorId(trainL.sesiones || [], trainR.sesiones || [], tombstones.subappTrainer_sesiones || []);
        fusion.subappTrainer.rutinasEnfoques = fusionarColeccionPorId(trainL.rutinasEnfoques || [], trainR.rutinasEnfoques || [], tombstones.subappTrainer_enfoques || []);
        fusion.subappTrainer.sesionesActivas = fusionarColeccionPorId(trainL.sesionesActivas || [], trainR.sesionesActivas || [], tombstones.subappTrainer_sesionesActivas || []);
        if (fusion.subappTrainer.sesionesActivas.length > 0) {
            fusion.subappTrainer.timerActivo = fusion.subappTrainer.sesionesActivas[0];
        } else if (fusion.subappTrainer.timerActivo && fusion.subappTrainer.timerActivo.inicioTimestamp) {
            var legId = fusion.subappTrainer.timerActivo.id || ('ACT-LEGACY-' + fusion.subappTrainer.timerActivo.inicioTimestamp);
            if ((tombstones.subappTrainer_sesionesActivas || []).map(String).indexOf(String(legId)) !== -1) {
                fusion.subappTrainer.timerActivo = null;
            }
        }
    }

    // 6.6 LISTAS DE REPRODUCCIÓN DE MÚSICA (SUPERVIVENCIA EN REINSTALACIÓN)
    if (Array.isArray(local.reproductorPlaylists) || Array.isArray(remoto.reproductorPlaylists)) {
        fusion.reproductorPlaylists = fusionarColeccionPorId(
            local.reproductorPlaylists || [],
            remoto.reproductorPlaylists || [],
            tombstones.reproductorPlaylists || []
        );
    }
    if (!fusion.rutinaPlaylistDefaultId && local.rutinaPlaylistDefaultId) {
        fusion.rutinaPlaylistDefaultId = local.rutinaPlaylistDefaultId;
    }
    if (local.splitPersonal && (!fusion.splitPersonal || (Number(local.splitPersonal.updatedAt) || 0) >= (Number(fusion.splitPersonal.updatedAt) || 0))) {
        fusion.splitPersonal = JSON.parse(JSON.stringify(local.splitPersonal));
    }
    var statsL = (local && local.reproductorPlayStats && typeof local.reproductorPlayStats === 'object') ? local.reproductorPlayStats : {};
    var statsR = (remoto && remoto.reproductorPlayStats && typeof remoto.reproductorPlayStats === 'object') ? remoto.reproductorPlayStats : {};
    var statsMerged = JSON.parse(JSON.stringify(statsR));
    Object.keys(statsL).forEach(function(k) {
        var sl = statsL[k];
        var sr = statsMerged[k];
        if (!sl || typeof sl !== 'object') return;
        if (!sr || typeof sr !== 'object') {
            statsMerged[k] = JSON.parse(JSON.stringify(sl));
            return;
        }
        statsMerged[k] = {
            key: sr.key || sl.key || k,
            sig: sr.sig || sl.sig || '',
            id: sr.id || sl.id || '',
            nombre: sr.nombre || sl.nombre || '',
            artista: sr.artista || sl.artista || '',
            count: Math.max(Number(sl.count) || 0, Number(sr.count) || 0),
            lastPlayedAt: Math.max(Number(sl.lastPlayedAt) || 0, Number(sr.lastPlayedAt) || 0),
            firstPlayedAt: (function() {
                var a = Number(sl.firstPlayedAt) || 0;
                var b = Number(sr.firstPlayedAt) || 0;
                if (a > 0 && b > 0) return Math.min(a, b);
                return a || b || 0;
            })()
        };
    });
    fusion.reproductorPlayStats = statsMerged;

    // 6.7 CONVERSACIONES Y CONFIGURACIÓN DE APP IA (v11.27)
    if (Array.isArray(local.iaConversaciones) || Array.isArray(remoto.iaConversaciones)) {
        fusion.iaConversaciones = fusionarColeccionPorId(
            local.iaConversaciones || [],
            remoto.iaConversaciones || [],
            tombstones.iaConversaciones || []
        );
    }
    if (local.iaConfig || remoto.iaConfig) {
        var iaCfgL = (local.iaConfig && typeof local.iaConfig === 'object') ? local.iaConfig : {};
        var iaCfgR = (remoto.iaConfig && typeof remoto.iaConfig === 'object') ? remoto.iaConfig : {};
        var tsIaL = Number(iaCfgL.fechaActualizacion) || 0;
        var tsIaR = Number(iaCfgR.fechaActualizacion) || 0;
        fusion.iaConfig = tsIaL >= tsIaR
            ? Object.assign({}, iaCfgR, iaCfgL)
            : Object.assign({}, iaCfgL, iaCfgR);
        if (!fusion.iaConfig.sincronizarApiKeyNube) {
            fusion.iaConfig.apiKeyCloud = '';
        }
    }

    // 7. JUGADOR (Respetar cambio de EXP más reciente para preservar penitencias; fallback mayor nivel/EXP)
    if (local.jugador && fusion.jugador) {
        var localExpTs = Number(local.jugador.expActualizadaEn) || 0;
        var remoteExpTs = Number(fusion.jugador.expActualizadaEn) || 0;
        if (localExpTs > 0 || remoteExpTs > 0) {
            if (localExpTs >= remoteExpTs) {
                fusion.jugador.nivel = local.jugador.nivel || 1;
                fusion.jugador.exp = local.jugador.exp || 0;
                fusion.jugador.expMax = local.jugador.expMax || 100;
                fusion.jugador.expActualizadaEn = localExpTs;
            }
        } else if ((local.jugador.nivel || 1) > (fusion.jugador.nivel || 1)) {
            fusion.jugador.nivel = local.jugador.nivel;
            fusion.jugador.exp = local.jugador.exp;
            fusion.jugador.expMax = local.jugador.expMax;
        } else if ((local.jugador.nivel || 1) === (fusion.jugador.nivel || 1)) {
            fusion.jugador.exp = Math.max(local.jugador.exp || 0, fusion.jugador.exp || 0);
        }
    }

    // 8. SUEÑO Y SESIÓN NOCTURNA ACTIVA
    if (local.sueno || remoto.sueno) {
        var sL = (local.sueno && typeof local.sueno === 'object') ? local.sueno : {};
        var sR = (remoto.sueno && typeof remoto.sueno === 'object') ? remoto.sueno : {};
        var tsSL = Number(sL.actualizadoTs) || 0;
        var tsSR = Number(sR.actualizadoTs) || 0;
        var baseSue = (tsSL >= tsSR) ? Object.assign({}, sR, sL) : Object.assign({}, sL, sR);

        baseSue.registros = fusionarColeccionPorId(sL.registros, sR.registros, tombstones.sueno_registros);
        baseSue.registros.sort(function(a, b) {
            return String((b && b.fecha) || '').localeCompare(String((a && a.fecha) || ''));
        });

        var siestasMerged = Object.assign({}, sR.siestas || {});
        Object.keys(sL.siestas || {}).forEach(function(fK) {
            siestasMerged[fK] = Math.max(Number(siestasMerged[fK]) || 0, Number(sL.siestas[fK]) || 0);
        });
        baseSue.siestas = siestasMerged;
        baseSue.metaHoras = Number(baseSue.metaHoras) || 8;
        fusion.sueno = baseSue;
    }

    // 9. REGISTRO DE RELACIONES ÍNTIMAS Y RECUPERACIÓN
    if (Array.isArray(local.relacionesIntimas) || Array.isArray(remoto.relacionesIntimas)) {
        fusion.relacionesIntimas = fusionarColeccionPorId(
            local.relacionesIntimas || [],
            remoto.relacionesIntimas || [],
            tombstones.relacionesIntimas || []
        );
        fusion.relacionesIntimas.sort(function(a, b) {
            var cmpF = String((b && b.fecha) || '').localeCompare(String((a && a.fecha) || ''));
            if (cmpF !== 0) return cmpF;
            return (Number(b && b.fechaActualizacion) || 0) - (Number(a && a.fechaActualizacion) || 0);
        });
    }

    // Conservar timestamp de la modificación más reciente y banderas de migración
    fusion._ultimaActualizacion = Math.max(local._ultimaActualizacion || 0, remoto._ultimaActualizacion || 0, Date.now());
    fusion.v2_clean_defaults = true;
    fusion.v3_clean_rutinas = true;

    return fusion;
}

/**
 * Helper para refrescar vistas activas tras sincronización o restauración
 */
function refrescarVistasTrasSync() {
    try {
        var vistaHome = document.getElementById('vista-home');
        if (vistaHome && vistaHome.classList.contains('active') && typeof renderizarVistaHome === 'function') {
            renderizarVistaHome();
        }
        var vistaEP = document.getElementById('vista-estado-personal');
        if (vistaEP && vistaEP.classList.contains('active')) {
            if (typeof renderizarGraficoGeneralAvatar === 'function') renderizarGraficoGeneralAvatar();
            if (typeof renderizarModuloDescanso === 'function') renderizarModuloDescanso();
        }
        if (typeof window.programarAlarmaHoraDormirNativa === 'function') {
            window.programarAlarmaHoraDormirNativa();
        }
        if (typeof renderizarInventarioSiActivo === 'function') renderizarInventarioSiActivo();
        var vistaFin = document.getElementById('vista-finanzas');
        if (vistaFin && vistaFin.classList.contains('active') && typeof renderizarFinanzas === 'function' && window.APP_STATE) {
            renderizarFinanzas(window.APP_STATE.finanzas);
        }
        var vistaEj = document.getElementById('vista-ejercicios');
        if (vistaEj && vistaEj.classList.contains('active')) {
            if (typeof renderizarEjercicios === 'function' && window.APP_STATE) renderizarEjercicios(window.APP_STATE.ejercicios);
            if (typeof renderizarPortalesRutinasEjercicios === 'function') renderizarPortalesRutinasEjercicios();
            if (typeof renderizarPortalesRutinas === 'function' && window.APP_STATE) renderizarPortalesRutinas(window.APP_STATE.rutinas);
        }
        if (typeof window.reRenderSiVistaIdeasActiva === 'function') {
            window.reRenderSiVistaIdeasActiva();
        }
        var vistaPer = document.getElementById('vista-personas');
        if (vistaPer && vistaPer.classList.contains('active') && typeof renderizarAgendaPersonas === 'function') {
            renderizarAgendaPersonas();
        }
        var vistaCal = document.getElementById('vista-calendario');
        if (vistaCal && vistaCal.classList.contains('active') && typeof renderizarCalendario === 'function') {
            renderizarCalendario();
        }
        if (typeof actualizarBadgeNotificaciones === 'function') {
            actualizarBadgeNotificaciones();
        }
        var modalNotif = document.getElementById('modal-centro-notificaciones');
        if (modalNotif && modalNotif.style.display === 'flex' && typeof renderizarCentroNotificaciones === 'function') {
            renderizarCentroNotificaciones();
        }
        if (window.MonarcaPlayer && typeof window.MonarcaPlayer.sincronizarPlaylistsDesdeAppState === 'function') {
            window.MonarcaPlayer.sincronizarPlaylistsDesdeAppState();
        }
    } catch (uiErr) {
        console.warn("[Sync UI] Aviso refrescando vistas:", uiErr);
    }
}

/**
 * Objeto global de gestión Cloud para la aplicación
 */
let _initRetryTimer = null;

window.MonarcaCloud = {
    conectado: false,
    enSincronizacion: false,
    modoOffline: !navigator.onLine,
    ultimoError: null,
    bloqueoEscrituraInicial: true,
    _internals: {
        fusionarColeccionPorId: fusionarColeccionPorId,
        fusionarEstadosInteligente: fusionarEstadosInteligente,
        deduplicarColeccionQuests: deduplicarColeccionQuests,
        deduplicarColeccionPorNombre: deduplicarColeccionPorNombre,
        getUltimoTimestampGuardado: function() { return ultimoTimestampGuardado; },
        setUltimoTimestampGuardado: function(v) { ultimoTimestampGuardado = Number(v) || 0; },
        setUltimoSnapshotFirma: function(v) { _ultimoSnapshotFirma = String(v || ''); }
    },

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
     * Ejecuta la escritura directa del estado vivo actual (window.APP_STATE) hacia Firestore.
     * Prioriza siempre el documento principal sin bloquearse esperando backups remotos previos.
     */
    _ejecutarGuardadoNube: async function(stateFallback) {
        if (window._isSyncingFromRemote || bloqueoEscrituraInicial || !this.conectado || !db || !docRef) {
            return false;
        }
        if (!navigator.onLine) {
            this.actualizarBadgeUI('offline', 'Offline (pendiente nube)');
            return false;
        }
        if (_guardadoEnCurso) {
            _reintentarGuardadoAlTerminar = true;
            return true;
        }

        _guardadoEnCurso = true;
        this.enSincronizacion = true;
        this.actualizarBadgeUI('syncing');

        var exito = false;
        try {
            var estadoVivo = window.APP_STATE || stateFallback;
            if (!estadoVivo) return false;

            var now = Math.max(Date.now(), ultimoTimestampGuardado + 1);
            ultimoTimestampGuardado = now;
            _ultimoSnapshotFirma = String(now) + '|' + CLIENT_INSTANCE_ID;
            estadoVivo._ultimaActualizacion = now;
            estadoVivo._ultimoEditorClientId = CLIENT_INSTANCE_ID;

            var datosAGuardar = this.sanitizarParaFirestore(estadoVivo);
            datosAGuardar._ultimaActualizacion = now;
            datosAGuardar._fechaActualizacion = new Date(now).toISOString();
            datosAGuardar._ultimoEditorClientId = CLIENT_INSTANCE_ID;

            var jsonBytes = 0;
            try {
                jsonBytes = new Blob([JSON.stringify(datosAGuardar)]).size;
            } catch (bErr) {}

            if (jsonBytes > 1020000) {
                console.warn("⚠️ Payload cercano/superior al límite de 1 MiB de Firestore:", jsonBytes, "bytes");
            }

            // Escribir datos principales primero para evitar ventana de pérdida al cerrar app
            await setDoc(docRef, datosAGuardar, { merge: true });
            exito = true;
            _reintentoCloudIntento = 0;
            _cuotaAgotadaHastaMs = 0;
            _limpiarReintentoGuardadoNube();

            if (!_reintentarGuardadoAlTerminar && !debounceSaveTimer) {
                _cambiosPendientesNube = false;
                try { localStorage.removeItem('sistema_monarca_sync_pendiente'); } catch (ig) {}
            }
            this.actualizarBadgeUI('synced');

            // Copia de respaldo remota secundaria (no bloqueante, cada 3 min como máximo)
            if (docBackupRef && !_reintentarGuardadoAlTerminar && jsonBytes < 950000 && (now - _ultimoBackupRemotoTs > 180000)) {
                _ultimoBackupRemotoTs = now;
                var dataBk = Object.assign({}, datosAGuardar, { _backupTimestamp: now });
                setDoc(docBackupRef, dataBk).catch(function() {});
            }
        } catch (err) {
            console.error("Error al guardar en Firestore:", err);
            this.ultimoError = err.message || "Error al sincronizar";

            if (err.code === 'permission-denied') {
                this.actualizarBadgeUI('error', 'Firestore: Permisos');
                console.warn("⚠️ Las reglas de Firestore están bloqueando el guardado. Verifica en Firebase Console.");
            } else if (err.code === 'invalid-argument' || (err.message && /size|bytes|exceeds|maximum/i.test(err.message))) {
                this.actualizarBadgeUI('error', 'Límite nube 1 MiB');
                console.error("⚠️ El documento supera el límite de 1 MiB permitido por Firestore.");
            } else if (_esErrorCuotaFirestore(err)) {
                _cuotaAgotadaHastaMs = Date.now() + 60000;
                this.actualizarBadgeUI('offline', 'Cuota nube · Local/Wi-Fi');
                _programarReintentoGuardadoNube(60000);
            } else {
                this.actualizarBadgeUI('offline', 'Respaldo Local Activo (reintentando)');
                _programarReintentoGuardadoNube();
            }
        } finally {
            _guardadoEnCurso = false;
            this.enSincronizacion = false;
            if (_reintentarGuardadoAlTerminar) {
                _reintentarGuardadoAlTerminar = false;
                setTimeout(function() {
                    if (window.MonarcaCloud) window.MonarcaCloud._ejecutarGuardadoNube();
                }, 30);
            }
        }
        return exito;
    },

    /**
     * Envía inmediatamente cualquier guardado debounced pendiente (ej. al pasar a segundo plano o cerrar)
     */
    flushGuardadoNube: function() {
        if (debounceSaveTimer) {
            clearTimeout(debounceSaveTimer);
            debounceSaveTimer = null;
            return this._ejecutarGuardadoNube();
        }
        if (_cambiosPendientesNube && !bloqueoEscrituraInicial && this.conectado && navigator.onLine) {
            return this._ejecutarGuardadoNube();
        }
        return Promise.resolve(false);
    },

    /**
     * Envía el estado actual a Firestore de forma segura (con cola pendiente, debounce breve y validaciones)
     */
    guardarEnNube: function(state, esForzado) {
        // Evitar eco si se está aplicando una actualización remota entrante
        if (window._isSyncingFromRemote) {
            return;
        }

        _cambiosPendientesNube = true;

        // Si el arranque aún no terminó de consultar la nube, dejar marcado como pendiente para subir tras Smart Merge
        if (bloqueoEscrituraInicial && !esForzado) {
            console.log("⏳ Guardado en nube en cola: esperando consulta inicial de Firestore.");
            this.actualizarBadgeUI('syncing', 'En cola (conectando...)');
            return;
        }

        if (!this.conectado || !db || !docRef) {
            this.actualizarBadgeUI('offline', 'Pendiente de red');
            return;
        }

        if (!navigator.onLine) {
            this.actualizarBadgeUI('offline', 'Offline (pendiente nube)');
            return;
        }

        this.actualizarBadgeUI('syncing');

        if (debounceSaveTimer) {
            clearTimeout(debounceSaveTimer);
            debounceSaveTimer = null;
        }

        if (esForzado) {
            this._ejecutarGuardadoNube(state);
            return;
        }

        debounceSaveTimer = setTimeout(function() {
            debounceSaveTimer = null;
            window.MonarcaCloud._ejecutarGuardadoNube();
        }, 200);
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
            if (debounceSaveTimer) {
                clearTimeout(debounceSaveTimer);
                debounceSaveTimer = null;
            }
            var ok = await this._ejecutarGuardadoNube(window.APP_STATE);
            if (ok) {
                alert("✓ Sincronización con Firebase Firestore completada con éxito.");
            } else {
                alert("⚠️ No se pudo completar la sincronización con Firebase (" + (this.ultimoError || "verifica tu conexión o tamaño del documento") + "). Tus datos siguen guardados localmente.");
            }
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

            var restaurado = JSON.parse(JSON.stringify(punto.data));
            restaurado._ultimaActualizacion = Date.now();
            restaurado.v2_clean_defaults = true;
            restaurado.v3_clean_rutinas = true;

            if (typeof MonarcaDB !== 'undefined' && typeof MonarcaDB.safeSetRaw === 'function') {
                MonarcaDB.safeSetRaw('sistema_monarca_db_v1', JSON.stringify(restaurado));
            } else {
                localStorage.setItem('sistema_monarca_db_v1', JSON.stringify(restaurado));
            }
            window.APP_STATE = restaurado;

            // Subir a la nube inmediatamente
            _cambiosPendientesNube = true;
            try { localStorage.setItem('sistema_monarca_sync_pendiente', String(restaurado._ultimaActualizacion)); } catch (ig) {}
            if (this.conectado) {
                this.guardarEnNube(window.APP_STATE, true);
            }

            if (typeof inicializarSistema === 'function') inicializarSistema(true);
            if (typeof cargarInventario === 'function') cargarInventario();
            refrescarVistasTrasSync();
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
            var escBk = function(s) {
                return String(s == null ? '' : s)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            };
            var historial = this.obtenerHistorialBackups();
            if (historial.length === 0) {
                cont.innerHTML = `
                <div style="text-align: center; padding: 25px; color: #94a3b8; font-size: 13px;">
                    No hay copias de seguridad previas registradas aún. El sistema las generará automáticamente ante cada cambio.
                </div>`;
            } else {
                var html = '';
                historial.forEach(function(bk) {
                    html += `
                    <div class="backup-history-card-dark" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                <span style="font-weight: 800; font-size: 13px; color: #f8fafc;">📅 ${escBk(bk.fecha)}</span>
                                <span style="font-size: 10.5px; background: rgba(99, 102, 241, 0.16); border: 1px solid rgba(129, 140, 248, 0.3); color: #c7d2fe; padding: 2px 7px; border-radius: 6px; font-weight: 700;">${escBk(bk.motivo)}</span>
                            </div>
                            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                                📦 Productos: <strong style="color: #e2e8f0;">${Number(bk.prodsCount) || 0}</strong> · 💵 Ventas: <strong style="color: #e2e8f0;">${Number(bk.ventasCount) || 0}</strong> · ⚔️ Misiones: <strong style="color: #e2e8f0;">${Number(bk.misionesCount) || 0}</strong>
                            </div>
                        </div>
                        <button type="button" class="btn-system" onclick="window.MonarcaCloud.restaurarBackupPorId('${escBk(bk.id)}')" style="padding: 7px 13px; font-size: 11.5px; font-weight: 800; background: linear-gradient(135deg, #4f46e5, #6366f1); color: #ffffff; border: 1px solid rgba(129, 140, 248, 0.45); border-radius: 8px; cursor: pointer;">
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
    },

    /**
     * Sube una canción específica a Firebase Storage y avisa a los otros dispositivos vía Firestore
     */
    subirCancionTransferencia: async function(cancionMeta, blob) {
        if (!storage || !db) {
            throw new Error("El servicio de nube aún no está conectado. Revisa tu conexión a internet.");
        }
        var fileId = cancionMeta.id || ('song_' + Date.now());
        var cleanName = cancionMeta.nombre || 'Cancion';
        var fileName = cleanName.replace(/[^a-zA-Z0-9_\-\. ]/g, '_') + '.mp3';
        var rutaStorage = 'transferencias_musica/' + fileId + '_' + fileName;
        var refArchivo = storageRef(storage, rutaStorage);

        var snap = await uploadBytes(refArchivo, blob);
        var urlDescarga = await getDownloadURL(snap.ref);

        var transferDocRef = doc(db, FIRESTORE_COL_TRANSFERENCIAS, fileId);
        await setDoc(transferDocRef, {
            id: fileId,
            nombre: cleanName,
            tamano: cancionMeta.tamano || blob.size || 0,
            urlDescarga: urlDescarga,
            rutaStorage: rutaStorage,
            origenDispositivo: /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ? 'móvil' : 'PC',
            fecha: Date.now()
        });

        return { id: fileId, url: urlDescarga };
    },

    /**
     * Elimina una canción de la nube tras ser descargada
     */
    eliminarCancionTransferencia: async function(transferId, rutaStorage) {
        if (!db) return;
        try {
            var transferDocRef = doc(db, FIRESTORE_COL_TRANSFERENCIAS, transferId);
            await deleteDoc(transferDocRef);
        } catch(e) {
            console.warn("[Transferencia] Error borrando doc:", e);
        }
        if (storage && rutaStorage) {
            try {
                var refArchivo = storageRef(storage, rutaStorage);
                await deleteObject(refArchivo);
            } catch(e) {
                console.warn("[Transferencia] Error borrando archivo de storage:", e);
            }
        }
    },

    /**
     * Escucha en tiempo real si hay canciones enviadas a este dispositivo
     */
    escucharTransferencias: function(callback) {
        if (!db) return function(){};
        var colRef = collection(db, FIRESTORE_COL_TRANSFERENCIAS);
        return onSnapshot(colRef, function(snap) {
            var lista = [];
            snap.forEach(function(d) {
                lista.push(d.data());
            });
            if (typeof callback === 'function') callback(lista);
        }, function(err) {
            console.warn("[Transferencias Snapshot]", err);
        });
    },

    /**
     * Sube o actualiza la imagen/captura comprimida de una idea en la colección dedicada `ideas_imagenes`
     */
    subirImagenIdea: async function(registro) {
        if (!db) throw new Error('Firebase Firestore no inicializado');
        if (!registro || !registro.id || !registro.dataUrl) {
            throw new Error('Datos de imagen incompletos');
        }
        var docId = String(registro.id);
        var dataUrl = String(registro.dataUrl);
        if (dataUrl.length > 920000) {
            throw new Error('La imagen comprimida excede el límite seguro por documento');
        }
        var ahoraMs = Date.now();
        var refImg = doc(db, FIRESTORE_COL_IDEAS_IMAGENES, docId);
        var payload = {
            id: docId,
            ideaId: String(registro.ideaId || ''),
            dataUrl: dataUrl,
            mimeType: String(registro.mimeType || 'image/jpeg'),
            fileName: String(registro.fileName || 'imagen.jpg'),
            width: Number(registro.width) || 0,
            height: Number(registro.height) || 0,
            sizeBytes: Number(registro.sizeBytes) || dataUrl.length,
            updatedAt: Number(registro.updatedAt) || ahoraMs
        };
        await setDoc(refImg, payload);
        return payload;
    },

    /**
     * Descarga bajo demanda la imagen/captura de una idea desde `ideas_imagenes`
     */
    obtenerImagenIdea: async function(imagenId) {
        if (!db || !imagenId) return null;
        var refImg = doc(db, FIRESTORE_COL_IDEAS_IMAGENES, String(imagenId));
        var snap = await getDoc(refImg);
        return snap.exists() ? snap.data() : null;
    },

    /**
     * Elimina el documento remoto de una imagen adjunta al borrar definitivamente su idea
     */
    eliminarImagenIdea: async function(imagenId) {
        if (!db || !imagenId) return false;
        var refImg = doc(db, FIRESTORE_COL_IDEAS_IMAGENES, String(imagenId));
        await deleteDoc(refImg);
        return true;
    },

    /**
     * Envia o actualiza una solicitud de programacion de ✨ Emily hacia Auto-PC
     */
    enviarSolicitudAutoPC: async function(solicitud) {
        if (!db) throw new Error('Firebase Firestore no inicializado');
        var ideaId = String((solicitud && solicitud.ideaId) || '');
        if (!ideaId) throw new Error('ideaId requerido para Auto-PC');

        var refSolicitud = doc(db, FIRESTORE_COL_AUTOPC, ideaId);
        var ahoraMs = Date.now();
        var payload = {
            ideaId: ideaId,
            text: String((solicitud && solicitud.text) || '').trim(),
            categoria: String((solicitud && solicitud.categoria) || '✨ Emily'),
            subcategoria: String((solicitud && solicitud.subcategoria) || 'General'),
            status: 'pending',
            notifConfirmada: false,
            createdAt: Number(solicitud && solicitud.createdAt) || ahoraMs,
            updatedAt: ahoraMs
        };
        if (solicitud && solicitud.hasImage && solicitud.imageDocId) {
            payload.hasImage = true;
            payload.imageDocId = String(solicitud.imageDocId);
            payload.imageName = String(solicitud.imageName || 'captura.png');
            payload.imageMime = String(solicitud.imageMime || 'image/jpeg');
        }

        await setDoc(refSolicitud, payload);
        _tocarSenalAutoPC('enqueue');
        return payload;
    },

    /**
     * Marca en Firestore `solicitudes_autopc` que las notificaciones ya fueron confirmadas / vistas
     * para evitar que resuciten en otros dispositivos o limpiezas de caché local.
     */
    confirmarNotificacionesAutoPCNube: async function(solicitudIds) {
        if (!db || !Array.isArray(solicitudIds) || solicitudIds.length === 0) return 0;
        var unicos = Array.from(new Set(solicitudIds.map(function(id) { return String(id || '').trim(); }).filter(Boolean)));
        if (unicos.length === 0) return 0;
        var ahoraMs = Date.now();
        var ok = 0;
        await Promise.all(unicos.map(async function(ideaId) {
            try {
                var refSolicitud = doc(db, FIRESTORE_COL_AUTOPC, ideaId);
                await updateDoc(refSolicitud, {
                    notifConfirmada: true,
                    notifConfirmadaAt: ahoraMs
                });
                ok++;
            } catch (err) {
                var msg = err ? String(err.message || '') : '';
                if (!err || (err.code !== 'not-found' && msg.indexOf('No document to update') === -1)) {
                    console.warn('[Auto-PC Notif Cloud Ack]', ideaId, err);
                }
            }
        }));
        return ok;
    },

    /**
     * Envía desde el APK/Web la decisión del usuario sobre un Implementation Plan de Antigravity
     * (`approve` = Proceed, `reply` = indicaciones personalizadas, `cancel` = cancelar sin ejecutar)
     */
    enviarDecisionPlanAntigravity: async function(decision) {
        if (!db) throw new Error('Firebase Firestore no inicializado');
        var d = decision || {};
        var ahoraMs = Date.now();
        var planId = String(d.planId || '').trim();
        var requestId = String(d.requestId || '').trim();
        var action = String(d.action || 'approve').trim().toLowerCase();
        var mensaje = String(d.mensaje || '').trim();
        if (action === 'approve' && !mensaje) {
            mensaje = 'Procede con el plan de implementación aprobado.';
        }

        var payload = {
            docType: 'plan_decision',
            ideaId: '_plan_decision',
            status: 'pending',
            planId: planId,
            requestId: requestId,
            action: action,
            mensaje: mensaje,
            createdAt: ahoraMs,
            updatedAt: ahoraMs,
            consumed: false
        };
        var refDecision = doc(db, FIRESTORE_COL_AUTOPC, '_plan_decision');
        await setDoc(refDecision, payload);

        if (requestId && requestId.indexOf('_') !== 0) {
            try {
                var refReq = doc(db, FIRESTORE_COL_AUTOPC, requestId);
                await updateDoc(refReq, {
                    planDecision: action,
                    planDecisionText: mensaje,
                    planDecisionAt: ahoraMs,
                    updatedAt: ahoraMs
                });
            } catch (e) {
                console.warn('[Auto-PC Plan Decision Req Update]', e);
            }
        }

        _tocarSenalAutoPC('plan_decision');
        return payload;
    },

    /**
     * Cancela y elimina de la cola remota de Auto-PC una idea pendiente
     */
    cancelarSolicitudAutoPC: async function(ideaId) {
        if (!db || !ideaId) return false;
        var refSolicitud = doc(db, FIRESTORE_COL_AUTOPC, String(ideaId));
        await deleteDoc(refSolicitud);
        _tocarSenalAutoPC('cancel');
        return true;
    },

    /**
     * Escucha en tiempo real los estados (pending/running/done) publicados por Auto-PC
     */
    escucharSolicitudesAutoPC: function(callback) {
        if (!db) return function(){};
        var colRef = collection(db, FIRESTORE_COL_AUTOPC);
        return onSnapshot(colRef, function(snap) {
            var lista = [];
            snap.forEach(function(d) {
                lista.push(d.data());
            });
            if (typeof callback === 'function') callback(lista);
        }, function(err) {
            console.warn("[Auto-PC Snapshot]", err);
        });
    }
};

window.iniciarListenerSolicitudesAutoPC = function() {
    if (unsubscribeAutoPCSnapshot) {
        try { unsubscribeAutoPCSnapshot(); } catch(ig) {}
        unsubscribeAutoPCSnapshot = null;
    }
    if (!window.MonarcaCloud || typeof window.MonarcaCloud.escucharSolicitudesAutoPC !== 'function') {
        return;
    }
    unsubscribeAutoPCSnapshot = window.MonarcaCloud.escucharSolicitudesAutoPC(function(lista) {
        if (typeof window.procesarSnapshotAutoPCIdeas === 'function') {
            window.procesarSnapshotAutoPCIdeas(lista);
        }
    });
};

/**
 * Inicialización principal del servicio Firebase y Firestore con Smart Merge
 */
async function inicializarFirebase() {
    try {
        window.MonarcaCloud.actualizarBadgeUI('syncing', 'Conectando nube...');
        bloqueoEscrituraInicial = true;
        window.MonarcaCloud.bloqueoEscrituraInicial = true;

        if (!app) {
            app = initializeApp(firebaseConfig);
        }
        if (!db) {
            db = getFirestore(app);
        }
        if (!storage) {
            try {
                storage = getStorage(app);
            } catch(stErr) {
                console.warn("[Firebase Storage] Init aviso:", stErr);
            }
        }

        docRef = doc(db, FIRESTORE_COLECCION, FIRESTORE_DOCUMENTO);
        docBackupRef = doc(db, FIRESTORE_COLECCION, FIRESTORE_DOC_BACKUP);
        window.MonarcaCloud.conectado = true;

        // 1. Consultar estado existente en la nube
        var snapInicial = null;
        try {
            snapInicial = await getDoc(docRef);
            if (_initRetryTimer) {
                clearTimeout(_initRetryTimer);
                _initRetryTimer = null;
            }
        } catch (fetchErr) {
            console.warn("Aviso al consultar documento en Firestore:", fetchErr);
            if (fetchErr.code === 'permission-denied') {
                window.MonarcaCloud.ultimoError = "Permiso denegado en Firestore. Revisa las Reglas en Firebase Console.";
                window.MonarcaCloud.actualizarBadgeUI('error', 'Reglas Firestore');
                bloqueoEscrituraInicial = false;
                window.MonarcaCloud.bloqueoEscrituraInicial = false;
                return;
            }
            // Fallo temporal o cuota 429: no asumir nube vacía; programar reconexión automática
            window.MonarcaCloud.conectado = false;
            var esCuotaBoot = _esErrorCuotaFirestore(fetchErr);
            window.MonarcaCloud.actualizarBadgeUI(
                'offline',
                esCuotaBoot ? 'Cuota nube 429 · Local/Wi-Fi' : 'Offline (reintentando nube)'
            );
            if (!_initRetryTimer && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
                var bootDelayMs = esCuotaBoot ? 60000 : 12000;
                _initRetryTimer = setTimeout(function() {
                    _initRetryTimer = null;
                    if (!sincronizacionInicialCompletada) inicializarFirebase();
                }, bootDelayMs);
            }
            return;
        }

        var habiaPendienteLocal = _cambiosPendientesNube;
        try {
            if (localStorage.getItem('sistema_monarca_sync_pendiente')) habiaPendienteLocal = true;
        } catch (ig) {}
        // Reiniciar la bandera ahora; cualquier edición hecha a partir de aquí la volverá a activar
        _cambiosPendientesNube = false;

        var datosLocales = window.APP_STATE || (typeof MonarcaDB !== 'undefined' ? MonarcaDB.get() : null);

        // Guardar copia de seguridad preventiva local antes de fusionar
        if (datosLocales) {
            guardarCopiaSeguridadLocal(datosLocales, "Arranque de aplicación");
        }

        if (!snapInicial || !snapInicial.exists()) {
            // Nube vacía: subir estado local
            console.log("☁️ Firestore está vacío. Subiendo datos locales...");
            if (datosLocales) {
                var nowEmpty = Date.now();
                var datosMigracion = window.MonarcaCloud.sanitizarParaFirestore(datosLocales);
                datosMigracion._ultimaActualizacion = nowEmpty;
                datosMigracion._fechaActualizacion = new Date(nowEmpty).toISOString();
                datosMigracion._ultimoEditorClientId = CLIENT_INSTANCE_ID;
                datosMigracion._migradoDesde = "localStorage";

                ultimoTimestampGuardado = nowEmpty;
                await setDoc(docRef, datosMigracion);
                if (!_cambiosPendientesNube) {
                    try { localStorage.removeItem('sistema_monarca_sync_pendiente'); } catch (ig) {}
                }
            }
        } else {
            // Nube tiene datos existentes: FUSIÓN INTELIGENTE (Smart Merge)
            var datosRemotos = snapInicial.data();
            console.log("☁️ Datos existentes encontrados en Firestore. Ejecutando Smart Merge no destructivo...");

            window._isSyncingFromRemote = true;
            var estadoFusionado = null;
            try {
                estadoFusionado = fusionarEstadosInteligente(datosLocales, datosRemotos);

                delete estadoFusionado._migradoDesde;
                delete estadoFusionado._backupTimestamp;
                estadoFusionado.v2_clean_defaults = true;
                estadoFusionado.v3_clean_rutinas = true;

                // Guardar estado fusionado en localStorage sin abortar por cuota y sin sobreescribir RAM
                if (typeof MonarcaDB !== 'undefined') {
                    var fusionStr = JSON.stringify(estadoFusionado);
                    if (typeof MonarcaDB.safeSetRaw === 'function') {
                        MonarcaDB.safeSetRaw('sistema_monarca_db_v1', fusionStr);
                    } else {
                        localStorage.setItem('sistema_monarca_db_v1', fusionStr);
                    }
                    window.APP_STATE = estadoFusionado;

                    if (typeof sanitizarQuestsDiarios === 'function') {
                        sanitizarQuestsDiarios();
                    }
                    if (typeof reconciliarQuestsConRutinasCompletadasHoy === 'function') {
                        reconciliarQuestsConRutinasCompletadasHoy(true);
                    }

                    // Refrescar vistas en pantalla manteniendo en RAM el estado recién fusionado
                    if (typeof inicializarSistema === 'function') inicializarSistema(true);
                    if (typeof cargarInventario === 'function') cargarInventario();
                    if (typeof programarAlarmasNativasQuests === 'function') programarAlarmasNativasQuests();
                    _limpiarMapaAutoPCPorTombstones(window.APP_STATE);
                    refrescarVistasTrasSync();
                }
            } finally {
                window._isSyncingFromRemote = false;
            }

            // Sincronizar el estado fusionado SOLO si hubo cambios locales reales o divergencia con remoto
            var datosAGuardar = window.MonarcaCloud.sanitizarParaFirestore(estadoFusionado);
            var sigRemotaInicial = (typeof datosRemotos !== 'undefined' && datosRemotos)
                ? _extraerContenidoComparableFirestore(window.MonarcaCloud.sanitizarParaFirestore(datosRemotos))
                : '';
            var sigLocalFusionada = _extraerContenidoComparableFirestore(datosAGuardar);
            var remotoTsIni = Number(datosRemotos && datosRemotos._ultimaActualizacion) || 0;
            var remotoEdIni = String((datosRemotos && datosRemotos._ultimoEditorClientId) || '');
            _ultimoSnapshotRemotoMs = Date.now();

            if (habiaPendienteLocal || _cambiosPendientesNube || !sigRemotaInicial || sigLocalFusionada !== sigRemotaInicial) {
                var tsGuardar = Math.max(remotoTsIni + 1, Date.now(), ultimoTimestampGuardado + 1);
                ultimoTimestampGuardado = tsGuardar;
                _ultimoSnapshotFirma = String(tsGuardar) + '|' + CLIENT_INSTANCE_ID;
                estadoFusionado._ultimaActualizacion = tsGuardar;
                estadoFusionado._ultimoEditorClientId = CLIENT_INSTANCE_ID;
                datosAGuardar._ultimaActualizacion = tsGuardar;
                datosAGuardar._fechaActualizacion = new Date(tsGuardar).toISOString();
                datosAGuardar._ultimoEditorClientId = CLIENT_INSTANCE_ID;
                await setDoc(docRef, datosAGuardar, { merge: true });
            } else {
                ultimoTimestampGuardado = Math.max(ultimoTimestampGuardado, remotoTsIni);
                _ultimoSnapshotFirma = String(remotoTsIni) + '|' + remotoEdIni;
                estadoFusionado._ultimaActualizacion = ultimoTimestampGuardado;
                estadoFusionado._ultimoEditorClientId = remotoEdIni;
            }

            if (!_cambiosPendientesNube) {
                try { localStorage.removeItem('sistema_monarca_sync_pendiente'); } catch (ig) {}
            }
        }

        // DESBLOQUEAR ESCRITURAS: La sincronización inicial concluyó exitosamente
        bloqueoEscrituraInicial = false;
        sincronizacionInicialCompletada = true;
        window.MonarcaCloud.bloqueoEscrituraInicial = false;
        window.MonarcaCloud.actualizarBadgeUI('synced');
        console.log("✓ Sincronización inicial completada con éxito. Smart Merge activo.");

        // Si el usuario creó/editó algún ítem mientras estaba terminando el arranque, subirlo de inmediato
        if (_cambiosPendientesNube) {
            console.log("🚀 Procesando cambios locales en cola generados durante el arranque...");
            setTimeout(function() {
                if (window.MonarcaCloud) window.MonarcaCloud.guardarEnNube(window.APP_STATE, true);
            }, 50);
        } else if (habiaPendienteLocal) {
            try { localStorage.removeItem('sistema_monarca_sync_pendiente'); } catch (ig) {}
        }

        // 2. Escuchar cambios en tiempo real desde Firestore (Multi-dispositivo en vivo)
        if (typeof window.iniciarListenerSolicitudesAutoPC === 'function') {
            window.iniciarListenerSolicitudesAutoPC();
        }
        if (typeof window.procesarPendientesOfflineAutoPC === 'function') {
            setTimeout(function() { window.procesarPendientesOfflineAutoPC(); }, 80);
        }

        if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
        }

        function _aplicarSnapshotRemotoEnVivo(data) {
            if (!data || typeof data !== 'object') return false;
            var remotoTs = Number(data._ultimaActualizacion) || 0;
            var editorId = String(data._ultimoEditorClientId || '');
            var firmaSnap = String(remotoTs) + '|' + editorId;

            // Ignorar eco proveniente de este mismo cliente si no hay cambios más nuevos
            if (editorId && editorId === CLIENT_INSTANCE_ID && remotoTs <= ultimoTimestampGuardado) {
                return false;
            }
            if (firmaSnap && firmaSnap === _ultimoSnapshotFirma) {
                return false;
            }
            // Aceptar cualquier actualización de otro cliente (aunque su reloj esté desfasado respecto al local)
            var esOtroCliente = Boolean(editorId && editorId !== CLIENT_INSTANCE_ID);
            if (!(remotoTs > ultimoTimestampGuardado || esOtroCliente || !_ultimoSnapshotFirma)) {
                return false;
            }

            console.log("🔄 Actualización en tiempo real recibida desde Firestore.");
            var conservarPendiente = _cambiosPendientesNube;
            ultimoTimestampGuardado = Math.max(ultimoTimestampGuardado, remotoTs);
            _ultimoSnapshotFirma = firmaSnap;
            _ultimoSnapshotRemotoMs = Date.now();
            window._isSyncingFromRemote = true;

            try {
                // Guardar copia preventiva antes de aplicar snapshot remoto
                if (window.APP_STATE) {
                    guardarCopiaSeguridadLocal(window.APP_STATE, "Previo a actualización remota en vivo");
                }

                // Smart Merge en caliente para no perder ediciones concurrentes locales
                var fusionEnVivo = fusionarEstadosInteligente(window.APP_STATE, data);

                delete fusionEnVivo._migradoDesde;
                delete fusionEnVivo._backupTimestamp;
                fusionEnVivo.v2_clean_defaults = true;
                fusionEnVivo.v3_clean_rutinas = true;

                if (typeof MonarcaDB !== 'undefined') {
                    var vivoStr = JSON.stringify(fusionEnVivo);
                    if (typeof MonarcaDB.safeSetRaw === 'function') {
                        MonarcaDB.safeSetRaw('sistema_monarca_db_v1', vivoStr);
                    } else {
                        localStorage.setItem('sistema_monarca_db_v1', vivoStr);
                    }
                    window.APP_STATE = fusionEnVivo;

                    if (typeof sanitizarQuestsDiarios === 'function') {
                        sanitizarQuestsDiarios();
                    }
                    if (typeof reconciliarQuestsConRutinasCompletadasHoy === 'function') {
                        reconciliarQuestsConRutinasCompletadasHoy(true);
                    }

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
                    if (typeof renderizarAgendaPersonas === 'function') {
                        renderizarAgendaPersonas();
                    }
                    if (typeof actualizarBadgeNotificaciones === 'function') {
                        actualizarBadgeNotificaciones();
                    }
                    if (typeof programarAlarmasCalendarioNativas === 'function') {
                        programarAlarmasCalendarioNativas();
                    }
                    if (typeof renderizarMisiones === 'function' && window.APP_STATE.misiones) {
                        renderizarMisiones(window.APP_STATE.misiones);
                    }
                    if (typeof renderizarQuestsDiarios === 'function') {
                        renderizarQuestsDiarios();
                    }
                    if (typeof programarAlarmasNativasQuests === 'function') {
                        programarAlarmasNativasQuests();
                    }
                    if (window.VISTA_ACTUAL === 'vista-ia' && typeof renderizarVistaIA === 'function' && (!window.IA_RUNTIME || !window.IA_RUNTIME.generando)) {
                        renderizarVistaIA();
                    }
                    _limpiarMapaAutoPCPorTombstones(window.APP_STATE);
                    refrescarVistasTrasSync();
                }
            } catch (e) {
                console.error("Error aplicando snapshot remoto:", e);
            } finally {
                window._isSyncingFromRemote = false;
            }

            if (conservarPendiente) {
                _cambiosPendientesNube = true;
                if (!_reintentoCloudTimer && Date.now() >= _cuotaAgotadaHastaMs) {
                    window.MonarcaCloud.guardarEnNube(window.APP_STATE);
                }
            } else {
                window.MonarcaCloud.actualizarBadgeUI('synced');
            }
            return true;
        }

        window.MonarcaCloud._aplicarSnapshotRemotoEnVivo = _aplicarSnapshotRemotoEnVivo;
        window.MonarcaCloud.refrescarEnPrimerPlano = async function(forzar) {
            if (!db || !docRef || !window.MonarcaCloud.conectado || bloqueoEscrituraInicial) return false;
            var ahora = Date.now();
            if (!forzar && (ahora - _ultimoWakeRefreshMs < 10000 || ahora - _ultimoSnapshotRemotoMs < 10000)) {
                return false;
            }
            if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
            _ultimoWakeRefreshMs = ahora;
            try {
                var snap = await getDoc(docRef);
                if (snap && snap.exists()) {
                    _aplicarSnapshotRemotoEnVivo(snap.data());
                }
                if (_cambiosPendientesNube && !_guardadoEnCurso) {
                    window.MonarcaCloud.guardarEnNube(window.APP_STATE, true);
                }
                if (typeof window.procesarPendientesOfflineAutoPC === 'function') {
                    window.procesarPendientesOfflineAutoPC();
                }
                return true;
            } catch (errWake) {
                return false;
            }
        };

        unsubscribeSnapshot = onSnapshot(docRef, function(docSnap) {
            if (!docSnap.exists()) return;
            // Ignorar confirmaciones locales pendientes para evitar ecos falsos
            if (docSnap.metadata && docSnap.metadata.hasPendingWrites) {
                return;
            }
            _aplicarSnapshotRemotoEnVivo(docSnap.data());
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
        window.MonarcaCloud.bloqueoEscrituraInicial = false;
        window.MonarcaCloud.conectado = false;
        window.MonarcaCloud.ultimoError = errGeneral.message;
        window.MonarcaCloud.actualizarBadgeUI('offline', 'Modo Offline (Local)');
    }
}

// Escuchadores de conectividad de red y ciclo de vida (flush inmediato al cerrar o cambiar de app)
window.addEventListener('online', function() {
    console.log("🌐 Conexión de red restablecida. Reconectando Firestore...");
    window.MonarcaCloud.modoOffline = false;
    _cuotaAgotadaHastaMs = 0;
    _reintentoCloudIntento = 0;
    window.MonarcaCloud.actualizarBadgeUI('syncing', 'Reconectando nube...');
    if (window.MonarcaCloud.conectado && window.APP_STATE) {
        if (!bloqueoEscrituraInicial) {
            if (_cambiosPendientesNube) {
                window.MonarcaCloud.guardarEnNube(window.APP_STATE, true);
            } else if (typeof window.MonarcaCloud.refrescarEnPrimerPlano === 'function') {
                window.MonarcaCloud.refrescarEnPrimerPlano(true);
            }
        }
        if (typeof window.procesarPendientesOfflineAutoPC === 'function') {
            setTimeout(function() { window.procesarPendientesOfflineAutoPC(); }, 150);
        }
    } else {
        inicializarFirebase();
    }
});

window.addEventListener('offline', function() {
    console.log("⚡ Sin red. Cambiando a almacenamiento local offline.");
    window.MonarcaCloud.modoOffline = true;
    window.MonarcaCloud.actualizarBadgeUI('offline');
});

document.addEventListener('visibilitychange', function() {
    if (!window.MonarcaCloud) return;
    if (document.visibilityState === 'hidden') {
        window.MonarcaCloud.flushGuardadoNube();
    } else if (document.visibilityState === 'visible') {
        if (!sincronizacionInicialCompletada && Date.now() - _ultimoWakeRefreshMs >= 10000) {
            _ultimoWakeRefreshMs = Date.now();
            inicializarFirebase();
        } else if (typeof window.MonarcaCloud.refrescarEnPrimerPlano === 'function') {
            window.MonarcaCloud.refrescarEnPrimerPlano(false);
        }
    }
});

window.addEventListener('focus', function() {
    if (!window.MonarcaCloud) return;
    if (!sincronizacionInicialCompletada && Date.now() - _ultimoWakeRefreshMs >= 10000) {
        _ultimoWakeRefreshMs = Date.now();
        inicializarFirebase();
    } else if (typeof window.MonarcaCloud.refrescarEnPrimerPlano === 'function') {
        window.MonarcaCloud.refrescarEnPrimerPlano(false);
    }
});

window.addEventListener('pagehide', function() {
    if (window.MonarcaCloud) {
        window.MonarcaCloud.flushGuardadoNube();
    }
});

window.addEventListener('beforeunload', function() {
    if (window.MonarcaCloud) {
        window.MonarcaCloud.flushGuardadoNube();
    }
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        inicializarFirebase();
    });
} else {
    inicializarFirebase();
}
