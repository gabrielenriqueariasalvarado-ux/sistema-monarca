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

// Referencias de Firebase
let app = null;
let db = null;
let storage = null;
let docRef = null;
let docBackupRef = null;
let unsubscribeSnapshot = null;

const CLIENT_INSTANCE_ID = 'CLI-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
let debounceSaveTimer = null;
let ultimoTimestampGuardado = 0;
let _cambiosPendientesNube = false;
let _guardadoEnCurso = false;
let _reintentarGuardadoAlTerminar = false;
let _ultimoBackupRemotoTs = 0;

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
    var tombSet = new Set(Array.isArray(tombstones) ? tombstones : []);
    var vistos = new Map();
    var resultado = [];

    quests.forEach(function(q) {
        if (!q || !q.id || tombSet.has(q.id)) return;
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
                if (tombSet) tombSet.add(existente.id);
            } else {
                if (tombSet) tombSet.add(q.id);
            }
        }
    });

    // Registrar los IDs de duplicados purgados en tombstones para que no vuelvan desde la nube
    if (Array.isArray(tombstones) && tombSet) {
        tombSet.forEach(function(id) {
            if (!tombstones.includes(id)) tombstones.push(id);
        });
    }

    return resultado;
}

/**
 * Extrae el timestamp numérico real de una entidad (soportando números, fechas string o el sello de su ID).
 */
function obtenerTimestampNumerico(item) {
    if (!item || typeof item !== 'object') return 0;
    var candidates = [item.fechaActualizacion, item.timestamp, item.fechaCreacion];
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
    var tombSet = new Set(Array.isArray(tombstones) ? tombstones : []);
    var campo = campoNombre || 'nombre';
    var vistos = new Map();
    var resultado = [];

    lista.forEach(function(item) {
        if (!item || !item.id || tombSet.has(item.id)) return;
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
                if (tombSet) tombSet.add(existente.id);
            } else {
                if (tombSet) tombSet.add(item.id);
            }
        }
    });

    if (Array.isArray(tombstones) && tombSet) {
        tombSet.forEach(function(id) {
            if (!tombstones.includes(id)) tombstones.push(id);
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
                    // Elemento existe en ambos: quedarse con la versión más reciente según timestamp real
                    var itemRemoto = resultadoMap[item.id];
                    var tsLocal = obtenerTimestampNumerico(item);
                    var tsRemoto = obtenerTimestampNumerico(itemRemoto);
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

    // Tombstones exhaustivos de todas las entidades del sistema
    var tombstones = {};
    var elL = (local && local._eliminados) ? local._eliminados : {};
    var elR = (remoto && remoto._eliminados) ? remoto._eliminados : {};

    var allKeys = [
        'productos', 'categorias', 'ventas', 'questsDiarios', 'misiones', 'habilidades',
        'ideas', 'agendaPersonas', 'gruposPersonas', 'ejercicios', 'rutinas', 'ejerciciosMentales',
        'ejerciciosCerebrales', 'conocimientos', 'registrosLabores', 'calendario', 'cronogramaSemanal',
        'reproductorPlaylists',
        'finanzas_ingresos', 'finanzas_gastos', 'finanzas_categoriasGastos', 'finanzas_deudas', 'finanzas_metas', 'finanzas_comparacionesAhorro',
        'subappBarberia_cortes', 'subappBarberia_clientes', 'subappBarberia_tiposCorte',
        'subappTrainer_alumnos', 'subappTrainer_sesiones', 'subappTrainer_enfoques'
    ];

    allKeys.forEach(function(k) {
        tombstones[k] = Array.from(new Set([...(elL[k] || []), ...(elR[k] || [])]));
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
        var questsCombinados = fusionarColeccionPorId(local.questsDiarios, remoto.questsDiarios, tombstones.questsDiarios);
        fusion.questsDiarios = deduplicarColeccionQuests(questsCombinados, tombstones.questsDiarios);
    }
    if (Array.isArray(local.habilidades) || Array.isArray(remoto.habilidades)) {
        var habsMerged = fusionarColeccionPorId(local.habilidades, remoto.habilidades, tombstones.habilidades);
        fusion.habilidades = deduplicarColeccionPorNombre(habsMerged, tombstones.habilidades, 'nombre');
    }

    // 3. IDEAS Y PENSAMIENTOS
    if (Array.isArray(local.ideas) || Array.isArray(remoto.ideas)) {
        fusion.ideas = fusionarColeccionPorId(local.ideas, remoto.ideas, tombstones.ideas);
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
    if (!fusion.finanzas) fusion.finanzas = { ingresos: [], gastos: [], categoriasGastos: [], deudas: [], metas: [], comparacionesAhorro: [] };
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
        var trainL = local.subappTrainer || { alumnos: [], sesiones: [], rutinasEnfoques: [] };
        var trainR = remoto.subappTrainer || { alumnos: [], sesiones: [], rutinasEnfoques: [] };
        fusion.subappTrainer = Object.assign({}, trainR, trainL);
        fusion.subappTrainer.alumnos = fusionarColeccionPorId(trainL.alumnos || [], trainR.alumnos || [], tombstones.subappTrainer_alumnos || []);
        fusion.subappTrainer.sesiones = fusionarColeccionPorId(trainL.sesiones || [], trainR.sesiones || [], tombstones.subappTrainer_sesiones || []);
        fusion.subappTrainer.rutinasEnfoques = fusionarColeccionPorId(trainL.rutinasEnfoques || [], trainR.rutinasEnfoques || [], tombstones.subappTrainer_enfoques || []);
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

            var now = Date.now();
            ultimoTimestampGuardado = Math.max(ultimoTimestampGuardado, now);
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
            } else {
                this.actualizarBadgeUI('offline', 'Respaldo Local Activo');
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
    }
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
        } catch (fetchErr) {
            console.warn("Aviso al consultar documento en Firestore:", fetchErr);
            if (fetchErr.code === 'permission-denied') {
                window.MonarcaCloud.ultimoError = "Permiso denegado en Firestore. Revisa las Reglas en Firebase Console.";
                window.MonarcaCloud.actualizarBadgeUI('error', 'Reglas Firestore');
                bloqueoEscrituraInicial = false;
                window.MonarcaCloud.bloqueoEscrituraInicial = false;
                return;
            }
            // Fallo temporal de red: no asumir que la nube está vacía; mantener pendiente y reintentar al reconectar
            window.MonarcaCloud.conectado = false;
            window.MonarcaCloud.actualizarBadgeUI('offline', 'Offline (pendiente nube)');
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

                    // Refrescar vistas en pantalla manteniendo en RAM el estado recién fusionado
                    if (typeof inicializarSistema === 'function') inicializarSistema(true);
                    if (typeof cargarInventario === 'function') cargarInventario();
                    if (typeof programarAlarmasNativasQuests === 'function') programarAlarmasNativasQuests();
                    refrescarVistasTrasSync();
                }
            } finally {
                window._isSyncingFromRemote = false;
            }

            // Sincronizar el estado fusionado en la nube para que ambos dispositivos queden 100% al día
            var tsGuardar = Math.max(estadoFusionado._ultimaActualizacion || 0, Date.now());
            ultimoTimestampGuardado = tsGuardar;
            estadoFusionado._ultimaActualizacion = tsGuardar;
            estadoFusionado._ultimoEditorClientId = CLIENT_INSTANCE_ID;

            var datosAGuardar = window.MonarcaCloud.sanitizarParaFirestore(estadoFusionado);
            datosAGuardar._ultimaActualizacion = tsGuardar;
            datosAGuardar._fechaActualizacion = new Date(tsGuardar).toISOString();
            datosAGuardar._ultimoEditorClientId = CLIENT_INSTANCE_ID;
            await setDoc(docRef, datosAGuardar, { merge: true });

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
        if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
        }

        unsubscribeSnapshot = onSnapshot(docRef, function(docSnap) {
            if (!docSnap.exists()) return;
            // Ignorar confirmaciones locales pendientes para evitar ecos falsos
            if (docSnap.metadata && docSnap.metadata.hasPendingWrites) {
                return;
            }

            var data = docSnap.data();
            var remotoTs = data._ultimaActualizacion || 0;

            // Ignorar eco proveniente de este mismo cliente si no hay cambios más nuevos
            if (data._ultimoEditorClientId === CLIENT_INSTANCE_ID && remotoTs <= ultimoTimestampGuardado) {
                return;
            }

            if (remotoTs > ultimoTimestampGuardado) {
                console.log("🔄 Actualización en tiempo real recibida desde Firestore.");
                var conservarPendiente = _cambiosPendientesNube;
                ultimoTimestampGuardado = remotoTs;
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
                        refrescarVistasTrasSync();
                    }
                } catch (e) {
                    console.error("Error aplicando snapshot remoto:", e);
                } finally {
                    window._isSyncingFromRemote = false;
                }

                if (conservarPendiente) {
                    _cambiosPendientesNube = true;
                    window.MonarcaCloud.guardarEnNube(window.APP_STATE, true);
                } else {
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
    window.MonarcaCloud.actualizarBadgeUI('syncing', 'Reconectando nube...');
    if (window.MonarcaCloud.conectado && window.APP_STATE) {
        if (!bloqueoEscrituraInicial) {
            window.MonarcaCloud.guardarEnNube(window.APP_STATE, true);
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
    if (document.visibilityState === 'hidden' && window.MonarcaCloud) {
        window.MonarcaCloud.flushGuardadoNube();
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
