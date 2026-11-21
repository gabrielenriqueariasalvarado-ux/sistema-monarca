/**
 * SISTEMA MONARCA · MÓDULO CENTRAL (CORE)
 * Base de datos LocalStorage, Sistema de Niveles/EXP y Enrutador de Navegación.
 */

/**
 * SISTEMA MONARCA · MOTOR DE APLICACIÓN PWA (OFFLINE & LOCALSTORAGE)
 * Aplicación Web Progresiva Independiente de Google Apps Script.
 * Almacenamiento 100% Local, Rápido y Reactivo.
 */

// ==========================================================================
// 1. CAPA DE PERSISTENCIA LOCAL (LOCALSTORAGE)
// ==========================================================================

const MONARCA_STORAGE_KEY = 'sistema_monarca_db_v1';

/**
 * Obtiene la clave de fecha en formato YYYY-MM-DD según la zona horaria local del usuario.
 * Evita desfasajes causados por UTC en toISOString().
 */
function obtenerClaveFechaLocal(fecha) {
    var d = fecha ? (fecha instanceof Date ? fecha : new Date(fecha)) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dia = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dia;
}

const DEFAULT_STATE = {
    jugador: {
        titulo: "Gabriel Arias",
        nivel: 1,
        exp: 0,
        expMax: 100
    },
    perfil: {
        str: 10,
        int: 10,
        vit: 10,
        mp: 100
    },
    misiones: [],
    questsDiarios: [],
    habilidades: [],
    fatiga: {
        promedioHoy: 0,
        ultimoCierre: "Inicio del sistema",
        mente: 0,
        delt_ant: 0, delt_lat: 0, delt_post: 0, manguito: 0,
        pect_mayor: 0, pect_menor: 0,
        biceps: 0, triceps: 0, antebrazos: 0,
        trapecios: 0, dorsales: 0, lumbares: 0,
        core: 0,
        gluteos: 0, cadera: 0,
        cuadriceps: 0, isquios: 0,
        pantorrillas: 0
    },
    registroDiarioCalendario: {},
    gym: [],
    rutinas: [],
    rutinaCalentamiento: [],
    rutinaPlaylistDefaultId: null,
    reproductorPlaylists: [],
    ejercicios: [],
    salud: [],
    menteAtributos: {
        memoria: 0,
        procesamiento: 0,
        conocimiento: 0,
        pensamiento_lateral: 0,
        diseno_expresion: 0,
        enfoque: 0,
        gratificacion: 0,
        resiliencia: 0,
        microexpresiones: 0,
        persuasion: 0,
        control_emocional: 0,
        inteligencia_social: 0
    },
    ejerciciosMentales: [],
    fatigaMentalDiaria: {
        nivel: 0,
        ultimoDia: obtenerClaveFechaLocal(),
        estado: "Mente Despejada",
        historial: []
    },
    musculosMentales: {
        enfoque: { nivel: 1, exp: 0, nombre: "Enfoque & Concentración", icono: "🎯", descripcion: "Lóbulo frontal, atención sostenida, Deep Work y bloqueo de distracciones." },
        inteligencia: { nivel: 1, exp: 0, nombre: "Lógica & Inteligencia", icono: "⚡", descripcion: "Razonamiento deductivo, modelado analítico y resolución algorítmica." },
        memoria: { nivel: 1, exp: 0, nombre: "Memoria & Retención", icono: "🧠", descripcion: "Memoria de trabajo, retención de datos, asimilación y mnemotecnia." },
        creatividad: { nivel: 1, exp: 0, nombre: "Creatividad & Divergencia", icono: "🎨", descripcion: "Pensamiento lateral, originalidad e invención de soluciones disruptivas." },
        disciplina: { nivel: 1, exp: 0, nombre: "Disciplina & Voluntad", icono: "🛡️", descripcion: "Veto de impulsos, persistencia, tolerancia a la fricción y estoicismo." },
        velocidad: { nivel: 1, exp: 0, nombre: "Velocidad de Procesamiento", icono: "🚀", descripcion: "Reflejos cognitivos, agilidad mental y toma de decisiones rápida." },
        calma: { nivel: 1, exp: 0, nombre: "Calma & Resiliencia", icono: "🌊", descripcion: "Regulación emocional, serenidad bajo presión y descompresión neural." },
        estrategia: { nivel: 1, exp: 0, nombre: "Estrategia & Claridad", icono: "♟️", descripcion: "Visión táctica, planificación de segundo orden y anticipación." },
        descanso: { nivel: 1, exp: 0, nombre: "Descanso & Regeneración", icono: "🌙", descripcion: "Recuperación neural profunda, desconexión y descompresión del sistema nervioso." },
        anulacion: { nivel: 1, exp: 0, nombre: "Anulación de Gratificación", icono: "🛑", descripcion: "Supresión de impulsos, control de gratificación inmediata y dominio propio." }
    },
    ejerciciosCerebrales: [],
    conocimientos: [],
    categoriasLabores: [
        { id: "LAB-BOOM", nombre: "Boom Solutions", icono: "🚀", descripcion: "Agencia de software, desarrollo web y soluciones digitales.", color: "#6366f1" },
        { id: "LAB-BARBER", nombre: "Barbería", icono: "💈", descripcion: "Corte de cabello masculino, degradados, afeitado y estética capilar.", color: "#38bdf8" },
        { id: "LAB-TRAINER", nombre: "Personal Trainer", icono: "🏋️‍♂️", descripcion: "Entrenamientos personalizados, asesoría física y técnica deportiva.", color: "#10b981" }
    ],
    registrosLabores: [],
    subappBoom: {
        config: {
            sueldoQuincena1: 0,
            sueldoQuincena2: 0,
            bonoDia3: 0,
            horarioInicio: "08:00",
            horarioFin: "16:30",
            breakMinutos: 30,
            horasJornadaNormal: 8.0,
            horasJornadaSabado: 8.0
        },
        planificaciones: {}
    },
    subappBarberia: {
        timerActivo: null,
        tiempoPromedioMetaMin: 30,
        clientes: [],
        cortes: [],
        tiposCorte: [
            { id: "ESTILO-1", nombre: "Fade Medio", precio: 10, tiempoMin: 30, descripcion: "Degradado medio clásico afeitado o con máquina rasuradora." },
            { id: "ESTILO-2", nombre: "Degradado + Barba", precio: 12, tiempoMin: 40, descripcion: "Corte degradado con perfilado y arreglo completo de barba." },
            { id: "ESTILO-3", nombre: "Corte Clásico a Tijera", precio: 10, tiempoMin: 30, descripcion: "Tijera en laterales y parte superior, peinado formal/ejecutivo." },
            { id: "ESTILO-4", nombre: "High Fade / Fade Alto", precio: 10, tiempoMin: 30, descripcion: "Degradado alto bien marcado desde la sien." },
            { id: "ESTILO-5", nombre: "Low Fade / Fade Bajo", precio: 10, tiempoMin: 35, descripcion: "Degradado bajo pegado a la oreja y nuca." },
            { id: "ESTILO-6", nombre: "Taper Fade", precio: 10, tiempoMin: 30, descripcion: "Desvanecido sutil únicamente en patillas y nuca." },
            { id: "ESTILO-7", nombre: "Perfilado & Barba", precio: 6, tiempoMin: 20, descripcion: "Delineado de contornos con navaja y perfilado de barba." }
        ]
    },
    subappTrainer: {
        timerActivo: null,
        tiempoPromedioMetaMin: 60,
        alumnos: [],
        sesiones: [],
        rutinasEnfoques: [
            { id: "ENF-1", nombre: "Pierna & Glúteos", tiempoMin: 60, descripcion: "Sentadilla, prensa, curl femoral, extensiones y pantorrilla." },
            { id: "ENF-2", nombre: "Pecho & Tríceps", tiempoMin: 60, descripcion: "Press banca plano/inclinado, aperturas y fondos." },
            { id: "ENF-3", nombre: "Espalda & Bíceps", tiempoMin: 60, descripcion: "Dominadas, jalones al pecho, remos y curls con barra." },
            { id: "ENF-4", nombre: "Hombro & Trapecio", tiempoMin: 50, descripcion: "Press militar, elevaciones laterales y pájaros." },
            { id: "ENF-5", nombre: "Full Body / Funcional", tiempoMin: 60, descripcion: "Circuito de alta intensidad, fuerza y resistencia metabólica." },
            { id: "ENF-6", nombre: "Cardio & Core", tiempoMin: 45, descripcion: "HIIT, planchas, elevación de piernas y rueda abdominal." }
        ]
    },
    agendaPersonas: [],
    gruposPersonas: [],
    ubicacionesAgenda: [
        "💈 Barbería",
        "🏋️ Gimnasio",
        "💼 Oficina / Coworking",
        "☕ Café / Restaurante",
        "🏠 Casa",
        "🛣️ En la Calle",
        "🌐 Virtual / Discord / Llamada"
    ],
    ruletaSemanal: {
        comidas: [],
        vestimenta: [],
        musica: [],
        seleccionActiva: {
            comida: "Sin opciones registradas",
            vestimenta: "Sin opciones registradas",
            musica: "Sin opciones registradas",
            fechaGiro: "Pendiente"
        },
        historialGiros: []
    },
    finanzas: {
        cabecera: {
            nombre: "Gabriel Arias",
            mes: "",
            objetivo: ""
        },
        categoriasGastos: [
            { id: "CAT-VIVIENDA", nombre: "Vivienda", icono: "🏠", color: "#3b82f6" },
            { id: "CAT-ALIMENTACION", nombre: "Alimentación", icono: "🛒", color: "#10b981" },
            { id: "CAT-MOTO", nombre: "Moto & Transporte", icono: "🏍️", color: "#f59e0b" },
            { id: "CAT-SERVICIOS", nombre: "Servicios", icono: "💡", color: "#06b6d4" },
            { id: "CAT-SALUD", nombre: "Salud", icono: "🏥", color: "#ec4899" },
            { id: "CAT-ENTRETENIMIENTO", nombre: "Entretenimiento & Ocio", icono: "🎮", color: "#8b5cf6" },
            { id: "CAT-INVERSION", nombre: "Inversión & Trabajo", icono: "💼", color: "#6366f1" },
            { id: "CAT-OTROS", nombre: "Otros", icono: "📦", color: "#64748b" }
        ],
        ingresos: [],
        gastos: [],
        deudas: [],
        metas: [],
        aportesMetas: [],
        comparacionesAhorro: [],
        tarjetas: [],
        planificacionCompras: []
    },
    ideas: [],
    calendario: [],
    cronogramaSemanal: [],
    inventario: {
        productos: [],
        categorias: [],
        ventas: []
    },
    _eliminados: {
        productos: [],
        categorias: [],
        ventas: [],
        questsDiarios: [],
        misiones: [],
        habilidades: [],
        ideas: [],
        agendaPersonas: [],
        gruposPersonas: [],
        ejercicios: [],
        rutinas: [],
        ejerciciosMentales: [],
        ejerciciosCerebrales: [],
        conocimientos: [],
        registrosLabores: [],
        calendario: [],
        cronogramaSemanal: [],
        finanzas_ingresos: [],
        finanzas_gastos: [],
        finanzas_categoriasGastos: [],
        finanzas_deudas: [],
        finanzas_metas: [],
        finanzas_comparacionesAhorro: [],
        finanzas_tarjetas: [],
        finanzas_planificacionCompras: []
    },
    v2_clean_defaults: true,
    v3_clean_rutinas: true
};

/**
 * Registra una lápida de borrado (tombstone) para evitar que elementos eliminados
 * resuciten al sincronizar entre diferentes dispositivos.
 */
function registrarTombstone(coleccion, id) {
    if (!id) return;
    if (typeof APP_STATE === 'undefined' || !APP_STATE) return;
    if (!APP_STATE._eliminados) APP_STATE._eliminados = {};
    if (!Array.isArray(APP_STATE._eliminados[coleccion])) APP_STATE._eliminados[coleccion] = [];
    var strId = String(id);
    if (!APP_STATE._eliminados[coleccion].includes(strId)) {
        APP_STATE._eliminados[coleccion].push(strId);
    }
}

const MonarcaDB = {
    get: function() {
        try {
            var raw = localStorage.getItem(MONARCA_STORAGE_KEY);
            if (!raw) {
                this.save(DEFAULT_STATE, false);
                return JSON.parse(JSON.stringify(DEFAULT_STATE));
            }
            var data = JSON.parse(raw);
            // Asegurar que existan todas las estructuras esperadas
            if (!data.jugador) data.jugador = DEFAULT_STATE.jugador;
            if (!data.perfil) data.perfil = DEFAULT_STATE.perfil;
            if (!data._eliminados) {
                data._eliminados = JSON.parse(JSON.stringify(DEFAULT_STATE._eliminados));
            } else {
                Object.keys(DEFAULT_STATE._eliminados).forEach(function(col) {
                    if (!Array.isArray(data._eliminados[col])) data._eliminados[col] = [];
                });
            }
            // Purga automática de misiones y habilidades quemadas (estáticas) para modo dinámico
            if (!data.v2_clean_defaults) {
                if (!Array.isArray(data.misiones) || data.misiones.length === 0) data.misiones = [];
                if (!Array.isArray(data.habilidades) || data.habilidades.length === 0) data.habilidades = [];
                data.v2_clean_defaults = true;
                this.save(data, false);
            }
            if (!data.misiones) data.misiones = [];
            if (!data.habilidades) data.habilidades = [];
            // Limpieza y soporte de ejercicios y rutinas dinámicas
            if (!data.v3_clean_rutinas) {
                if (!Array.isArray(data.rutinas) || data.rutinas.length === 0) data.rutinas = [];
                if (!Array.isArray(data.ejercicios) || data.ejercicios.length === 0) data.ejercicios = [];
                data.v3_clean_rutinas = true;
                this.save(data, false);
            }
            if (!data.ejercicios || !Array.isArray(data.ejercicios)) data.ejercicios = [];
            if (!data.rutinas || !Array.isArray(data.rutinas)) data.rutinas = [];
            if (!data.rutinaCalentamiento || !Array.isArray(data.rutinaCalentamiento)) data.rutinaCalentamiento = [];
            if (typeof data.rutinaPlaylistDefaultId === 'undefined') data.rutinaPlaylistDefaultId = null;
            if (!data.questsDiarios || !Array.isArray(data.questsDiarios)) data.questsDiarios = [];
            if (!data.fatiga) data.fatiga = JSON.parse(JSON.stringify(DEFAULT_STATE.fatiga));
            if (!data.gym || !Array.isArray(data.gym)) data.gym = [];
            if (!data.salud) data.salud = [];
            if (!data.menteAtributos) {
                data.menteAtributos = JSON.parse(JSON.stringify(DEFAULT_STATE.menteAtributos));
            }
            if (!data.ejerciciosMentales || !Array.isArray(data.ejerciciosMentales)) {
                data.ejerciciosMentales = [];
            }
            if (!data.fatigaMentalDiaria) {
                data.fatigaMentalDiaria = JSON.parse(JSON.stringify(DEFAULT_STATE.fatigaMentalDiaria));
            }
            if (!data.musculosMentales) {
                data.musculosMentales = JSON.parse(JSON.stringify(DEFAULT_STATE.musculosMentales));
            }
            if (!data.ejerciciosCerebrales || !Array.isArray(data.ejerciciosCerebrales)) {
                data.ejerciciosCerebrales = [];
            }
            if (!data.conocimientos || !Array.isArray(data.conocimientos)) {
                data.conocimientos = [];
            }
            if (!data.categoriasLabores || !Array.isArray(data.categoriasLabores)) {
                data.categoriasLabores = JSON.parse(JSON.stringify(DEFAULT_STATE.categoriasLabores));
            }
            if (!data.registrosLabores || !Array.isArray(data.registrosLabores)) {
                data.registrosLabores = [];
            }
            if (!data.agendaPersonas || !Array.isArray(data.agendaPersonas)) {
                data.agendaPersonas = [];
            }
            if (!data.gruposPersonas || !Array.isArray(data.gruposPersonas)) {
                data.gruposPersonas = [];
            }
            if (!data.ubicacionesAgenda || !Array.isArray(data.ubicacionesAgenda)) {
                data.ubicacionesAgenda = JSON.parse(JSON.stringify(DEFAULT_STATE.ubicacionesAgenda));
            }
            if (!data.ruletaSemanal) {
                data.ruletaSemanal = JSON.parse(JSON.stringify(DEFAULT_STATE.ruletaSemanal));
            } else {
                if (!data.ruletaSemanal.comidas || !Array.isArray(data.ruletaSemanal.comidas)) data.ruletaSemanal.comidas = [];
                if (!data.ruletaSemanal.vestimenta || !Array.isArray(data.ruletaSemanal.vestimenta)) data.ruletaSemanal.vestimenta = [];
                if (!data.ruletaSemanal.musica || !Array.isArray(data.ruletaSemanal.musica)) data.ruletaSemanal.musica = [];
                if (!data.ruletaSemanal.seleccionActiva) data.ruletaSemanal.seleccionActiva = { comida: "Sin opciones registradas", vestimenta: "Sin opciones registradas", musica: "Sin opciones registradas", fechaGiro: "Pendiente" };
                if (!data.ruletaSemanal.historialGiros || !Array.isArray(data.ruletaSemanal.historialGiros)) data.ruletaSemanal.historialGiros = [];
            }
            if (!data.finanzas) {
                data.finanzas = JSON.parse(JSON.stringify(DEFAULT_STATE.finanzas));
            } else {
                if (!data.finanzas.cabecera) data.finanzas.cabecera = { nombre: data.jugador ? data.jugador.titulo : "Gabriel Arias", mes: "", objetivo: "" };
                if (!data.finanzas.ingresos || !Array.isArray(data.finanzas.ingresos)) data.finanzas.ingresos = [];
                if (!data.finanzas.gastos || !Array.isArray(data.finanzas.gastos)) data.finanzas.gastos = [];
                if (!data.finanzas.categoriasGastos || !Array.isArray(data.finanzas.categoriasGastos) || data.finanzas.categoriasGastos.length === 0) {
                    data.finanzas.categoriasGastos = JSON.parse(JSON.stringify(DEFAULT_STATE.finanzas.categoriasGastos));
                }
                if (!data.finanzas.deudas || !Array.isArray(data.finanzas.deudas)) data.finanzas.deudas = [];
                if (!data.finanzas.metas || !Array.isArray(data.finanzas.metas)) data.finanzas.metas = [];
                if (!data.finanzas.comparacionesAhorro || !Array.isArray(data.finanzas.comparacionesAhorro)) data.finanzas.comparacionesAhorro = [];
                if (!data.finanzas.tarjetas || !Array.isArray(data.finanzas.tarjetas)) data.finanzas.tarjetas = [];
                if (!data.finanzas.planificacionCompras || !Array.isArray(data.finanzas.planificacionCompras)) data.finanzas.planificacionCompras = [];
            }
            if (!data.calendario || !Array.isArray(data.calendario)) data.calendario = [];
            if (!data.cronogramaSemanal || !Array.isArray(data.cronogramaSemanal)) data.cronogramaSemanal = [];
            if (!data.registroDiarioCalendario) data.registroDiarioCalendario = {};
            if (!data.ideas || !Array.isArray(data.ideas)) {
                data.ideas = [];
            } else {
                // Reparar subcategorías huérfanas si existieran
                data.ideas.forEach(function(i) {
                    if (!i.categoria) i.categoria = "💡 Ideas & Proyectos";
                    if (i.categoria === "💭 Ideas y Pensamientos") i.categoria = "💡 Ideas & Proyectos";
                    if (i.categoria === "🛒 Compras") i.categoria = "🛒 Compras & Deseos";
                    if (i.categoria === "📊 Planes y Monitoreo de Ejecución") i.categoria = "📊 Planes & Metas";
                    if (i.categoria === "🧠 Cosas por Aprender") i.categoria = "📚 Base de Conocimientos";
                    if (i.categoria === "✅ Tareas Pendientes") i.categoria = "✅ Tareas Operativas";
                    if (i.subcategoria === "Sistemas & Apps") i.subcategoria = "💼 Trabajo, Programación y Proyectos Profesionales";
                    if (i.subcategoria === "Accesorios Moto") i.subcategoria = "👕 Ropa y Accesorios";
                    if (i.subcategoria === "Desarrollo Web") i.subcategoria = "💻 Programación y Tecnología";
                    if (!i.timestamp) i.timestamp = Date.now();
                });
            }
            if (!data.inventario) {
                data.inventario = {
                    productos: [],
                    categorias: [],
                    ventas: []
                };
            } else {
                if (!data.inventario.productos || !Array.isArray(data.inventario.productos)) data.inventario.productos = [];
                if (!data.inventario.categorias || !Array.isArray(data.inventario.categorias)) data.inventario.categorias = [];
                if (!data.inventario.ventas || !Array.isArray(data.inventario.ventas)) data.inventario.ventas = [];
            }
            if (!data.subappBoom) {
                data.subappBoom = JSON.parse(JSON.stringify(DEFAULT_STATE.subappBoom));
            }
            if (!data.subappBarberia) {
                data.subappBarberia = JSON.parse(JSON.stringify(DEFAULT_STATE.subappBarberia));
            } else {
                if (!Array.isArray(data.subappBarberia.clientes)) data.subappBarberia.clientes = [];
                if (!Array.isArray(data.subappBarberia.cortes)) data.subappBarberia.cortes = [];
                if (typeof data.subappBarberia.tiempoPromedioMetaMin !== 'number') data.subappBarberia.tiempoPromedioMetaMin = 30;
                if (!Array.isArray(data.subappBarberia.tiposCorte) || data.subappBarberia.tiposCorte.length === 0) {
                    data.subappBarberia.tiposCorte = JSON.parse(JSON.stringify(DEFAULT_STATE.subappBarberia.tiposCorte));
                }
            }
            if (!data.subappTrainer) {
                data.subappTrainer = JSON.parse(JSON.stringify(DEFAULT_STATE.subappTrainer));
            } else {
                if (!Array.isArray(data.subappTrainer.alumnos)) data.subappTrainer.alumnos = [];
                if (!Array.isArray(data.subappTrainer.sesiones)) data.subappTrainer.sesiones = [];
                if (typeof data.subappTrainer.tiempoPromedioMetaMin !== 'number') data.subappTrainer.tiempoPromedioMetaMin = 60;
                if (!Array.isArray(data.subappTrainer.rutinasEnfoques) || data.subappTrainer.rutinasEnfoques.length === 0) {
                    data.subappTrainer.rutinasEnfoques = JSON.parse(JSON.stringify(DEFAULT_STATE.subappTrainer.rutinasEnfoques));
                }
            }
            return data;
        } catch (e) {
            console.error("Error al leer de localStorage:", e);
            return JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    },
    safeSetRaw: function(key, rawValue) {
        try {
            localStorage.setItem(key, rawValue);
            return true;
        } catch (err) {
            console.warn("[MonarcaDB] Cuota localStorage alcanzada al guardar '" + key + "'. Liberando copias antiguas...", err);
            try {
                // 1. Intentar reducir el historial de backups manteniendo solo el más reciente (o vaciarlo si hace falta)
                var rawHist = localStorage.getItem('sistema_monarca_historial_backups');
                if (rawHist) {
                    try {
                        var arr = JSON.parse(rawHist);
                        if (Array.isArray(arr) && arr.length > 1) {
                            localStorage.setItem('sistema_monarca_historial_backups', JSON.stringify(arr.slice(0, 1)));
                        } else {
                            localStorage.removeItem('sistema_monarca_historial_backups');
                        }
                    } catch (parseErr) {
                        localStorage.removeItem('sistema_monarca_historial_backups');
                    }
                    try {
                        localStorage.setItem(key, rawValue);
                        return true;
                    } catch (eRetry1) {}
                }
                // 2. Si aún falta espacio, eliminar historial completo y backup de emergencia redundante
                localStorage.removeItem('sistema_monarca_historial_backups');
                localStorage.removeItem('sistema_monarca_backup_emergencia');
                localStorage.setItem(key, rawValue);
                return true;
            } catch (errFinal) {
                console.error("[MonarcaDB] Error crítico guardando en localStorage tras liberar backups:", errFinal);
                if (!window._MONARCA_QUOTA_ALERT_SHOWN || (Date.now() - window._MONARCA_QUOTA_ALERT_SHOWN > 30000)) {
                    window._MONARCA_QUOTA_ALERT_SHOWN = Date.now();
                    try {
                        var mb = ((rawValue ? rawValue.length : 0) * 2 / (1024 * 1024)).toFixed(2);
                        alert("⚠️ Aviso de Almacenamiento Local: no se pudo guardar en localStorage (" + mb + " MB). El cambio intentará respaldarse en Firebase Cloud.");
                    } catch (ignored) {}
                }
                return false;
            }
        }
    },
    save: function(state, esAccionUsuario) {
        try {
            if (!state) return;
            if (window._isSyncingFromRemote) {
                // Durante la recepción de un snapshot remoto, actualizar solo almacenamiento local sin disparar eco a nube
                this.safeSetRaw(MONARCA_STORAGE_KEY, JSON.stringify(state));
                return;
            }
            if (esAccionUsuario !== false) {
                state._ultimaActualizacion = Date.now();
                try {
                    localStorage.setItem('sistema_monarca_sync_pendiente', String(state._ultimaActualizacion));
                } catch (ignored) {}
            }
            this.safeSetRaw(MONARCA_STORAGE_KEY, JSON.stringify(state));

            // Sincronización en tiempo real hacia Firebase Firestore (solo para acciones del usuario)
            if (esAccionUsuario !== false && window.MonarcaCloud && typeof window.MonarcaCloud.guardarEnNube === 'function') {
                window.MonarcaCloud.guardarEnNube(state);
            }
        } catch (e) {
            console.error("Error al guardar en localStorage:", e);
        }
    },
    exportBackup: function() {
        var now = new Date();
        var fechaStr = now.getFullYear() + "-" + 
            String(now.getMonth() + 1).padStart(2, '0') + "-" + 
            String(now.getDate()).padStart(2, '0') + "_" + 
            String(now.getHours()).padStart(2, '0') + "h" + 
            String(now.getMinutes()).padStart(2, '0');
        var fileName = "sistema_monarca_backup_" + fechaStr + ".json";
        var jsonText = JSON.stringify(APP_STATE, null, 2);
        
        var blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", url);
        downloadAnchor.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    },

    shareBackup: async function() {
        var now = new Date();
        var fechaStr = now.getFullYear() + "-" + 
            String(now.getMonth() + 1).padStart(2, '0') + "-" + 
            String(now.getDate()).padStart(2, '0') + "_" + 
            String(now.getHours()).padStart(2, '0') + "h" + 
            String(now.getMinutes()).padStart(2, '0');
        var fileName = "sistema_monarca_backup_" + fechaStr + ".json";
        var jsonText = JSON.stringify(APP_STATE, null, 2);
        var blob = new Blob([jsonText], { type: "application/json" });
        var file = new File([blob], fileName, { type: "application/json" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: "Respaldo Sistema Monarca",
                    text: "Datos actualizados de Sistema Monarca (" + fechaStr + ")",
                    files: [file]
                });
                return true;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.warn("Share failed, falling back to download:", err);
                    MonarcaDB.exportBackup();
                }
                return false;
            }
        } else {
            // Fallback: descarga directa y sugerencia de envío
            MonarcaDB.exportBackup();
            alert("Descargando archivo JSON... Puedes enviártelo a tu teléfono por WhatsApp, Telegram o Google Drive.");
            return false;
        }
    },

    generateSyncCode: function() {
        try {
            var rawStr = JSON.stringify(APP_STATE);
            // Codificación UTF-8 segura en Base64
            var utf8Bytes = encodeURIComponent(rawStr).replace(/%([0-9A-F]{2})/g, function(match, p1) {
                return String.fromCharCode('0x' + p1);
            });
            var b64 = btoa(utf8Bytes);
            return "MONARCA_SYNC_" + b64;
        } catch (e) {
            console.error("Error generando código de sincronización:", e);
            return JSON.stringify(APP_STATE);
        }
    },

    decodeSyncCode: function(codigo) {
        if (!codigo || typeof codigo !== 'string') {
            throw new Error("El código de sincronización está vacío.");
        }
        var str = codigo.trim();
        if (str.startsWith("MONARCA_SYNC_")) {
            str = str.replace("MONARCA_SYNC_", "");
            var decodedBytes = atob(str);
            var jsonStr = decodeURIComponent(Array.prototype.map.call(decodedBytes, function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonStr);
        } else {
            return JSON.parse(str);
        }
    },

    applySyncData: function(data) {
        if (!data || typeof data !== 'object') {
            throw new Error("Estructura de datos inválida.");
        }
        // Validar que tenga al menos uno de los campos nucleares
        if (!data.jugador && !data.finanzas && !data.ideas && !data.misiones) {
            throw new Error("Los datos no corresponden a una copia válida de Sistema Monarca.");
        }

        APP_STATE = data;
        MonarcaDB.save(APP_STATE);
        alert("🎉 ¡Sincronización completada con éxito! Tus datos se han actualizado.");
        location.reload();
    },

    importBackup: function(file) {
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var imported = JSON.parse(e.target.result);
                if (imported && (imported.jugador || imported.finanzas || imported.ideas || imported.misiones)) {
                    var nJugador = imported.jugador ? (imported.jugador.titulo + " (Nivel " + imported.jugador.nivel + ")") : "Sin perfil";
                    var nFinanzas = (imported.finanzas && imported.finanzas.ingresos) ? imported.finanzas.ingresos.length : 0;
                    var nIdeas = imported.ideas ? imported.ideas.length : 0;
                    var nMis = imported.misiones ? imported.misiones.length : 0;

                    var msg = "¿Confirmas restaurar este respaldo?\n\n" +
                              "• Jugador: " + nJugador + "\n" +
                              "• Misiones: " + nMis + "\n" +
                              "• Finanzas: " + nFinanzas + " ingresos\n" +
                              "• Ideas: " + nIdeas + "\n\n" +
                              "Tus datos actuales en este dispositivo se reemplazarán con los de este archivo.";
                    
                    if (confirm(msg)) {
                        APP_STATE = imported;
                        MonarcaDB.save(APP_STATE);
                        alert("¡Copia de seguridad restaurada con éxito!");
                        location.reload();
                    }
                } else {
                    alert("El archivo seleccionado no tiene un formato válido de Sistema Monarca.");
                }
            } catch (err) {
                alert("Error al importar archivo: " + err.message);
            }
        };
        reader.readAsText(file);
    },

    resetDefault: function() {
        if (confirm("⚠️ ¿Estás seguro de que deseas restablecer de fábrica el sistema?\n\nEsta acción eliminará todos los datos de prueba y ejemplos por defecto (contactos, ruleta, ideas, finanzas, tareas y entrenamientos), dejando el sistema 100% limpio para que configures únicamente tus propias opciones.")) {
            localStorage.removeItem(MONARCA_STORAGE_KEY);
            APP_STATE = JSON.parse(JSON.stringify(DEFAULT_STATE));
            MonarcaDB.save(APP_STATE);
            alert("✓ Sistema restablecido de fábrica con éxito. Todas las áreas han quedado 100% limpias.");
            location.reload();
        }
    }
};

// Estado global de la aplicación en memoria
var APP_STATE = MonarcaDB.get();

// ==========================================================================
// 2. INICIALIZACIÓN Y NAVEGACIÓN
// ==========================================================================

window.addEventListener('DOMContentLoaded', function() {
    inicializarSistema();
});

function inicializarSistema(omitirLecturaLocal) {
    if (!omitirLecturaLocal || !window.APP_STATE) {
        APP_STATE = MonarcaDB.get();
    }
    if (typeof actualizarDesgasteDiarioAutomatico === 'function') {
        actualizarDesgasteDiarioAutomatico();
    } else {
        verificarRecuperacionMentalDiaria();
    }
    renderizarJugador(APP_STATE.jugador);
    if (typeof cargarEstadoPersonal === 'function') {
        cargarEstadoPersonal();
    } else if (typeof renderizarBarrasFatiga === 'function') {
        renderizarBarrasFatiga(APP_STATE.fatiga);
    }
    if (typeof renderizarDesgloseCuerpoAnatomico === 'function') renderizarDesgloseCuerpoAnatomico();
    if (typeof renderizarDesgloseMenteCognitiva === 'function') renderizarDesgloseMenteCognitiva();
    if (typeof inicializarBancoDeIdeas === 'function') inicializarBancoDeIdeas();
    if (typeof actualizarSelectoresPlaylistRutinas === 'function') actualizarSelectoresPlaylistRutinas();
    if (typeof iniciarMotorRecordatoriosCalendario === 'function') iniciarMotorRecordatoriosCalendario();
    if (typeof programarAlarmasCalendarioNativas === 'function') programarAlarmasCalendarioNativas();

    // Historial inicial para soporte del botón atrás en móvil / PWA
    try {
        if (!history.state || !history.state.vista) {
            history.replaceState({ vista: 'vista-menu' }, '', '#vista-menu');
        }
    } catch(e) {}
    window.VISTA_ACTUAL = 'vista-menu';
}

window.VISTA_ACTUAL = 'vista-menu';

function cambiarVista(vistaId, noPushState) {
    if (!vistaId) return;

    // Redirecciones de conveniencia hacia pestañas internas
    if (vistaId === 'vista-misiones') {
        cambiarVista('vista-acciones-progresion', noPushState);
        if (typeof cambiarTabAccionesDesarrollo === 'function') cambiarTabAccionesDesarrollo('habitos');
        return;
    }
    if (vistaId === 'vista-quests-diarios') {
        cambiarVista('vista-acciones-progresion', noPushState);
        if (typeof cambiarTabAccionesDesarrollo === 'function') cambiarTabAccionesDesarrollo('quests');
        return;
    }
    if (vistaId === 'vista-habilidades') {
        cambiarVista('vista-acciones-progresion', noPushState);
        if (typeof cambiarTabAccionesDesarrollo === 'function') cambiarTabAccionesDesarrollo('skills');
        return;
    }
    if (vistaId === 'vista-mente' || vistaId === 'vista-gimnasio-mental') {
        cambiarVista('vista-estado-personal', noPushState);
        return;
    }
    if (vistaId === 'vista-banco-mental') {
        cambiarVista('vista-ejercicios', noPushState);
        if (typeof cambiarCategoriaEjercicios === 'function') cambiarCategoriaEjercicios('banco-mental');
        return;
    }
    if (vistaId === 'vista-gym') {
        cambiarVista('vista-ejercicios', noPushState);
        if (typeof cambiarCategoriaEjercicios === 'function') cambiarCategoriaEjercicios('rutinas');
        return;
    }

    var vistaAnterior = window.VISTA_ACTUAL || 'vista-menu';
    window.VISTA_ACTUAL = vistaId;

    // Manejo de historial para soporte nativo del botón de retroceso (Android / Gesture navigation)
    if (!noPushState && vistaId !== vistaAnterior) {
        try {
            history.pushState({ vista: vistaId }, '', '#' + vistaId);
        } catch(e) {}
    }

    var tabs = document.getElementsByClassName('tab-content');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    
    var vistaActiva = document.getElementById(vistaId);
    if (vistaActiva) {
        vistaActiva.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Sincronizar estado visual de la barra HUD inferior flotante
    try {
        var hudItems = document.querySelectorAll('.monarca-bottom-hud .bottom-hud-item');
        hudItems.forEach(function(item) {
            var dataHud = item.getAttribute('data-hud');
            var oc = item.getAttribute('onclick') || '';
            if (vistaId === 'vista-menu' && (dataHud === 'apps' || oc.indexOf("'vista-menu'") !== -1)) {
                item.classList.add('active');
            } else if (vistaId === 'vista-perfil' && (dataHud === 'perfil' || oc.indexOf("'vista-perfil'") !== -1)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        if (typeof actualizarBadgeNotificaciones === 'function') {
            actualizarBadgeNotificaciones();
        }
    } catch(e) {}

    switch(vistaId) {
        case 'vista-menu':
            renderizarJugador(APP_STATE.jugador);
            break;
        case 'vista-perfil':
            cargarPerfil();
            break;
        case 'vista-acciones-progresion':
            if (typeof cambiarTabAccionesDesarrollo === 'function') {
                var tabAD = (window.TAB_ACCIONES_DESARROLLO_ACTIVA && window.TAB_ACCIONES_DESARROLLO_ACTIVA !== 'conocimiento') ? window.TAB_ACCIONES_DESARROLLO_ACTIVA : 'quests';
                cambiarTabAccionesDesarrollo(tabAD);
            }
            break;
        case 'vista-ejercicios':
            cargarEjercicios();
            break;
        case 'vista-estado-personal':
            cargarEstadoPersonal();
            break;
        case 'vista-finanzas':
            cargarFinanzas();
            break;
        case 'vista-ideas':
            cargarIdeas();
            break;
        case 'vista-conocimiento':
            if (typeof cargarConocimientos === 'function') cargarConocimientos();
            break;
        case 'vista-labores':
            if (typeof cargarLabores === 'function') cargarLabores();
            break;
        case 'vista-subapp-boom':
            if (typeof cargarSubAppBoom === 'function') cargarSubAppBoom();
            break;
        case 'vista-subapp-barberia':
            if (typeof cargarSubAppBarberia === 'function') cargarSubAppBarberia();
            break;
        case 'vista-subapp-trainer':
            if (typeof cargarSubAppTrainer === 'function') cargarSubAppTrainer();
            break;
        case 'vista-personas':
            if (typeof cargarAgendaPersonas === 'function') cargarAgendaPersonas();
            break;
        case 'vista-ruleta':
            if (typeof cargarRuletaSemanal === 'function') cargarRuletaSemanal();
            break;
        case 'vista-calendario':
            renderizarCalendario();
            break;
        case 'vista-inventario':
            if (typeof cargarInventario === 'function') cargarInventario();
            break;
    }
}

// ==========================================================================
// GESTOR DE RETROCESO INTELIGENTE (GESTOS ANDROID, PWA Y CAPACITOR v10.28)
// ==========================================================================

var MONARCA_ULTIMO_BACK_TIMESTAMP = 0;

function mostrarToastRetrocesoSalir() {
    var toast = document.getElementById('monarca-toast-back-exit');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'monarca-toast-back-exit';
        toast.style.cssText = 'position:fixed;bottom:85px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.95);color:#f8fafc;padding:10px 18px;border-radius:24px;border:1px solid rgba(255,255,255,0.18);font-size:12.5px;font-weight:700;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.6);pointer-events:none;transition:opacity 0.25s ease;display:flex;align-items:center;gap:8px;';
        toast.innerHTML = '<span>🔙</span> <span>Toca atrás otra vez para salir</span>';
        document.body.appendChild(toast);
    }
    toast.style.opacity = '1';
    toast.style.display = 'flex';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function() {
        toast.style.opacity = '0';
        setTimeout(function() { toast.style.display = 'none'; }, 260);
    }, 2200);
}

function retrocederNavegacionMonarca() {
    // 1. Cerrar modales abiertos prioritariamente
    var modales = document.querySelectorAll('.modal-overlay, #modal-jarvis-voz, #modal-asistente-rapido, #modal-alerta-quest-activada, #modal-calentamiento-sesion');
    for (var i = 0; i < modales.length; i++) {
        var m = modales[i];
        if (m && m.style && m.style.display && m.style.display !== 'none') {
            m.style.display = 'none';
            if (typeof detenerEscuchaJarvis === 'function') {
                try { detenerEscuchaJarvis(); } catch(e) {}
            }
            try {
                history.pushState({ vista: window.VISTA_ACTUAL || 'vista-menu' }, '', '#' + (window.VISTA_ACTUAL || 'vista-menu'));
            } catch(e) {}
            return true;
        }
    }

    var vistaActual = window.VISTA_ACTUAL || 'vista-menu';

    // 2. Si está en el detalle de la rutina dinámica, regresar al hub de ejercicios sin destruir la sesión
    if (vistaActual === 'vista-detalle-rutina-dinamica') {
        if (typeof guardarEstadoSesionActivaEnStorage === 'function') {
            try { guardarEstadoSesionActivaEnStorage(); } catch(e) {}
        }
        cambiarVista('vista-ejercicios');
        return true;
    }

    // 3. Si está en cualquier subvista secundaria, volver al menú principal
    if (vistaActual !== 'vista-menu') {
        cambiarVista('vista-menu');
        return true;
    }

    // 4. Si ya está en vista-menu: prevenir cierre accidental mediante doble confirmación (2.2s)
    var ahora = Date.now();
    if (ahora - MONARCA_ULTIMO_BACK_TIMESTAMP < 2200) {
        // Segundo toque consecutivo: permitir salir de la app
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            try { window.Capacitor.Plugins.App.exitApp(); } catch(e) {}
        }
        return false;
    } else {
        MONARCA_ULTIMO_BACK_TIMESTAMP = ahora;
        mostrarToastRetrocesoSalir();
        try {
            history.pushState({ vista: 'vista-menu' }, '', '#vista-menu');
        } catch(e) {}
        return true;
    }
}

// Escuchador popstate de gestos del sistema y flecha atrás en navegador / PWA
window.addEventListener('popstate', function(event) {
    retrocederNavegacionMonarca();
});

// Soporte nativo para botón atrás de Android vía Capacitor
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        try {
            if (!history.state) {
                history.replaceState({ vista: 'vista-menu' }, '', '#vista-menu');
                history.pushState({ vista: window.VISTA_ACTUAL || 'vista-menu' }, '', '#' + (window.VISTA_ACTUAL || 'vista-menu'));
            }
        } catch(e) {}

        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            try {
                window.Capacitor.Plugins.App.addListener('backButton', function(canGoBack) {
                    retrocederNavegacionMonarca();
                });
            } catch(e) {
                console.warn("[Capacitor BackButton]", e);
            }
        }
    });
}


function verificarRecuperacionMentalDiaria() {
    if (typeof actualizarDesgasteDiarioAutomatico === 'function') {
        actualizarDesgasteDiarioAutomatico();
        return;
    }

    if (!APP_STATE.fatigaMentalDiaria) {
        APP_STATE.fatigaMentalDiaria = JSON.parse(JSON.stringify(DEFAULT_STATE.fatigaMentalDiaria));
    }
    var fMental = APP_STATE.fatigaMentalDiaria;
    var hoyStr = obtenerClaveFechaLocal();
    if (fMental.ultimoDia !== hoyStr) {
        if (!fMental.historial) fMental.historial = [];
        fMental.historial.unshift({
            fecha: fMental.ultimoDia || "Ayer",
            nivelCierre: fMental.nivel || 0,
            estadoCierre: fMental.estado || "Mente Despejada"
        });
        if (fMental.historial.length > 14) fMental.historial.pop();

        // Amanece en 0% como requiere la mecánica de nuevo día
        fMental.nivel = 0;
        fMental.ultimoDia = hoyStr;
        fMental.estado = "Mente Despejada (0% Desgaste)";
        MonarcaDB.save(APP_STATE);
    }
}

// ==========================================================================
// 3. JUGADOR, EXP Y NIVEL
// ==========================================================================

function renderizarJugador(datos) {
    if (!datos) datos = APP_STATE.jugador || DEFAULT_STATE.jugador;
    var tituloElem = document.getElementById('player-title');
    var nivelElem = document.getElementById('player-level');
    var titulo = datos.titulo || "Gabriel Arias";
    if (tituloElem) tituloElem.innerText = titulo;
    if (nivelElem) nivelElem.innerText = "Nivel: " + (datos.nivel || 1) + " · Progreso EXP: " + (datos.exp || 0) + " / " + (datos.expMax || 100);
}

function sumarExp(cantidad) {
    if (!APP_STATE.jugador) APP_STATE.jugador = { titulo: "Gabriel Arias", nivel: 1, exp: 0, expMax: 100 };
    APP_STATE.jugador.exp = (APP_STATE.jugador.exp || 0) + cantidad;
    var subioNivel = false;
    while (APP_STATE.jugador.exp >= APP_STATE.jugador.expMax) {
        APP_STATE.jugador.exp -= APP_STATE.jugador.expMax;
        APP_STATE.jugador.nivel = (APP_STATE.jugador.nivel || 1) + 1;
        APP_STATE.jugador.expMax = Math.round(APP_STATE.jugador.expMax * 1.25);
        if (!APP_STATE.perfil) APP_STATE.perfil = { str: 10, int: 10, vit: 10, mp: 100 };
        APP_STATE.perfil.str = (APP_STATE.perfil.str || 10) + 1;
        APP_STATE.perfil.int = (APP_STATE.perfil.int || 10) + 1;
        APP_STATE.perfil.vit = (APP_STATE.perfil.vit || 10) + 1;
        APP_STATE.perfil.mp = (APP_STATE.perfil.mp || 100) + 10;
        subioNivel = true;
    }
    MonarcaDB.save(APP_STATE);
    renderizarJugador(APP_STATE.jugador);
    if (subioNivel) {
        setTimeout(function() {
            alert("🎉 ¡SUBISTE DE NIVEL! Ahora eres Nivel " + APP_STATE.jugador.nivel + ". ¡Tus atributos han aumentado!");
        }, 150);
    }
}

function restarExp(cantidad) {
    if (!APP_STATE.jugador) APP_STATE.jugador = { titulo: "Gabriel Arias", nivel: 1, exp: 0, expMax: 100 };
    var expActual = APP_STATE.jugador.exp || 0;
    APP_STATE.jugador.exp = Math.max(0, expActual - (cantidad || 0));
    MonarcaDB.save(APP_STATE);
    renderizarJugador(APP_STATE.jugador);
}

// ==========================================================================
// 4. ASISTENTE FLOTANTE DE CAPTURA RÁPIDA (ACCESO GLOBAL)
// ==========================================================================

var TAB_ASISTENTE_ACTIVO = 'finanza';

function poblarCategoriasAsistenteFinanza() {
    var select = document.getElementById('asistente-fin-categoria');
    if (!select) return;

    var fin = APP_STATE.finanzas || DEFAULT_STATE.finanzas;
    var cats = (fin && fin.categoriasGastos && fin.categoriasGastos.length > 0)
        ? fin.categoriasGastos
        : DEFAULT_STATE.finanzas.categoriasGastos;

    var actual = select.value;
    var html = '';

    cats.forEach(function(cat) {
        var icon = cat.icono || "🏷️";
        html += '<option value="' + cat.nombre + '">' + icon + ' ' + cat.nombre + '</option>';
    });

    select.innerHTML = html;
    if (actual) {
        select.value = actual;
    } else {
        alCambiarCategoriaAsistenteFinanza();
    }
}

function alCambiarTipoAsistenteFinanza() {
    var inTipo = document.getElementById('asistente-fin-tipo');
    var extraGasto = document.getElementById('asistente-fin-extra-gasto');
    if (!inTipo || !extraGasto) return;

    if (inTipo.value === 'gasto') {
        extraGasto.style.display = 'block';
        var mon = document.getElementById('asistente-fin-monto');
        alCambiarMontoAsistenteFinanza(mon ? mon.value : '');
    } else {
        extraGasto.style.display = 'none';
        var box = document.getElementById('contenedor-freno-impulso-asistente');
        if (box) box.style.display = 'none';
    }
}

function alCambiarMontoAsistenteFinanza(val) {
    var inTipo = document.getElementById('asistente-fin-tipo');
    if (!inTipo || inTipo.value !== 'gasto') {
        var box = document.getElementById('contenedor-freno-impulso-asistente');
        if (box) box.style.display = 'none';
        return;
    }
    if (typeof actualizarComparadorFrenoGasto === 'function') {
        actualizarComparadorFrenoGasto(val, 'contenedor-freno-impulso-asistente');
    }
}

function alCambiarCategoriaAsistenteFinanza() {
    var inCat = document.getElementById('asistente-fin-categoria');
    var inPilar = document.getElementById('asistente-fin-pilar');
    if (!inCat || !inPilar) return;

    var cat = inCat.value.toLowerCase();
    if (cat.indexOf('invers') !== -1 || cat.indexOf('trabajo') !== -1 || cat.indexOf('negocio') !== -1) {
        inPilar.value = 'inversion';
    } else if (cat.indexOf('entretenimiento') !== -1 || cat.indexOf('ocio') !== -1 || cat.indexOf('capricho') !== -1 || cat.indexOf('juego') !== -1 || cat.indexOf('divers') !== -1 || cat.indexOf('salida') !== -1) {
        inPilar.value = 'caprichos';
    } else {
        inPilar.value = 'gastos';
    }
}

function alCambiarCategoriaAsistenteIdea() {
    var catSelect = document.getElementById('asistente-idea-cat');
    var subcatSelect = document.getElementById('asistente-idea-subcat');
    if (!catSelect || !subcatSelect) return;

    var cat = catSelect.value || "✨ Emily";
    var estructura = (typeof ESTRUCTURA_BANCO_IDEAS !== 'undefined') ? ESTRUCTURA_BANCO_IDEAS : null;
    var info = estructura ? estructura[cat] : null;
    if (!info && estructura && cat.indexOf('Emily') !== -1) {
        info = estructura["✨ Emily"];
    }

    var actualSub = subcatSelect.value;
    subcatSelect.innerHTML = '';
    var subs = (info && Array.isArray(info.subcategorias) && info.subcategorias.length > 0)
        ? info.subcategorias
        : ["General"];

    subs.forEach(function(sub) {
        var opt = document.createElement('option');
        opt.value = sub;
        opt.innerText = sub;
        subcatSelect.appendChild(opt);
    });

    if (actualSub && subs.indexOf(actualSub) !== -1) {
        subcatSelect.value = actualSub;
    }
}

function abrirAsistenteRapido() {
    var m = document.getElementById('modal-asistente-rapido');
    if (m) {
        m.style.display = 'flex';
        poblarCategoriasAsistenteFinanza();
        alCambiarTipoAsistenteFinanza();
        alCambiarCategoriaAsistenteIdea();
        cambiarTabAsistenteRapido(TAB_ASISTENTE_ACTIVO);
        setTimeout(function() {
            if (TAB_ASISTENTE_ACTIVO === 'finanza') {
                var mon = document.getElementById('asistente-fin-monto');
                if (mon) mon.focus();
            } else if (TAB_ASISTENTE_ACTIVO === 'idea') {
                var nom = document.getElementById('asistente-idea-nombre');
                if (nom) nom.focus();
            }
        }, 100);
    }
}

function cerrarAsistenteRapido() {
    var m = document.getElementById('modal-asistente-rapido');
    if (m) m.style.display = 'none';
    var box = document.getElementById('contenedor-freno-impulso-asistente');
    if (box) box.style.display = 'none';
}

function cambiarTabAsistenteRapido(tab) {
    TAB_ASISTENTE_ACTIVO = tab;
    var btns = document.querySelectorAll('.btn-tab-asistente');
    btns.forEach(function(b) {
        if (b.getAttribute('data-tab') === tab) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    ['finanza', 'idea', 'quest', 'mente'].forEach(function(t) {
        var sec = document.getElementById('asistente-sec-' + t);
        if (sec) sec.style.display = (t === tab) ? 'block' : 'none';
    });

    if (tab === 'idea') {
        alCambiarCategoriaAsistenteIdea();
        var nom = document.getElementById('asistente-idea-nombre');
        if (nom) setTimeout(function() { nom.focus(); }, 60);
    }
}

function guardarCapturaRapida() {
    var tab = TAB_ASISTENTE_ACTIVO;
    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (tab === 'idea') {
        var inNom = document.getElementById('asistente-idea-nombre');
        var inCat = document.getElementById('asistente-idea-cat');
        var inSub = document.getElementById('asistente-idea-subcat');
        var texto = inNom ? inNom.value.trim() : "";
        var cat = inCat ? inCat.value : "✨ Emily";
        var subcat = inSub ? inSub.value : "General";

        if (!texto) { alert("Escribe el contenido de tu idea."); if (inNom) inNom.focus(); return; }

        var ahora = new Date();
        var dd = String(ahora.getDate()).padStart(2, '0');
        var mm = String(ahora.getMonth() + 1).padStart(2, '0');
        var fechaCorta = dd + "/" + mm;
        if (!texto.endsWith(fechaCorta) && texto.indexOf('(' + fechaCorta + ')') === -1) {
            texto += " (" + fechaCorta + ")";
        }

        if (!APP_STATE.ideas) APP_STATE.ideas = [];
        var nowIdea = Date.now();
        APP_STATE.ideas.unshift({
            id: nowIdea,
            texto: texto,
            categoria: cat,
            subcategoria: subcat,
            fecha: fechaCorta,
            timestamp: nowIdea,
            fechaActualizacion: nowIdea,
            hecha: false
        });
        sumarExp(10);
        MonarcaDB.save(APP_STATE);
        if (inNom) inNom.value = "";
        cerrarAsistenteRapido();
        if (typeof renderizarBancoIdeas === 'function') renderizarBancoIdeas(APP_STATE.ideas);
        alert("💡 Idea publicada en \"" + cat + "\" (+10 EXP).");

    } else if (tab === 'quest') {
        var inTit = document.getElementById('asistente-quest-titulo');
        var inMin = document.getElementById('asistente-quest-minutos');
        var tit = inTit ? inTit.value.trim() : "";
        var min = inMin ? (Number(inMin.value) || 20) : 20;

        if (!tit) { alert("Ingresa el título del quest o tarea."); if (inTit) inTit.focus(); return; }

        if (!APP_STATE.questsDiarios) APP_STATE.questsDiarios = [];
        var durMs = min * 60 * 1000;
        var nuevaQuest = {
            id: "QD-" + Date.now(),
            titulo: tit,
            categoria: "Acción Rápida",
            descripcion: "Tarea añadida desde Asistente Rápido",
            duracionMinutos: min,
            duracionSegundos: min * 60,
            tiempoInicio: Date.now(),
            tiempoFinEstimado: Date.now() + durMs,
            estado: "en_progreso",
            expRecompensa: 25,
            penitencia: { expDeduccion: 10, mensaje: "Exceso de tiempo en tarea" }
        };
        APP_STATE.questsDiarios.push(nuevaQuest);
        MonarcaDB.save(APP_STATE);
        if (inTit) inTit.value = "";
        cerrarAsistenteRapido();
        if (typeof renderizarQuestsDiarios === 'function') renderizarQuestsDiarios();
        alert("⏳ Quest rápido activado (" + min + " min). ¡En marcha!");

    } else if (tab === 'mente') {
        var inMente = document.getElementById('asistente-mente-desc');
        var txt = inMente ? inMente.value.trim() : "";
        if (!txt) { alert("Ingresa el registro o reflexión mental."); if (inMente) inMente.focus(); return; }

        if (!APP_STATE.salud) APP_STATE.salud = [];
        APP_STATE.salud.unshift({ fecha: fechaHoy, valor: txt });
        if (APP_STATE.fatiga) {
            APP_STATE.fatiga.mente = Math.max(0, (APP_STATE.fatiga.mente || 0) - 20);
        }
        sumarExp(15);
        MonarcaDB.save(APP_STATE);
        if (inMente) inMente.value = "";
        cerrarAsistenteRapido();
        if (typeof renderizarMente === 'function') renderizarMente();
        alert("🧠 Registro mental guardado (+15 EXP).");

    } else if (tab === 'finanza') {
        var inCon = document.getElementById('asistente-fin-concepto');
        var inMon = document.getElementById('asistente-fin-monto');
        var inTipo = document.getElementById('asistente-fin-tipo');
        var inCat = document.getElementById('asistente-fin-categoria');
        var inPilar = document.getElementById('asistente-fin-pilar');

        var con = inCon ? inCon.value.trim() : "";
        var mon = inMon ? (Number(inMon.value) || 0) : 0;
        var esGasto = inTipo ? inTipo.value === 'gasto' : true;
        var cat = (inCat && inCat.value) ? inCat.value : "Otros";
        var pilar = (inPilar && inPilar.value) ? inPilar.value : "gastos";

        if (!con || mon <= 0) { alert("Ingresa un concepto y un monto válido."); return; }

        if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
        var ahora = new Date();
        var diaHoy = ahora.getDate();
        var mesStr = String(ahora.getMonth() + 1).padStart(2, '0');
        var diaStr = String(diaHoy).padStart(2, '0');
        var fechaISO = ahora.getFullYear() + '-' + mesStr + '-' + diaStr;

        if (esGasto) {
            if (!APP_STATE.finanzas.gastos) APP_STATE.finanzas.gastos = [];
            APP_STATE.finanzas.gastos.unshift({
                id: "GAS-" + Date.now(),
                tipo: 'ocasional',
                categoria: cat,
                concepto: con,
                dia: diaHoy,
                fecha: fechaISO,
                monto: mon,
                pilar: pilar,
                pagado: true,
                presupuestoEstimado: mon
            });
        } else {
            if (!APP_STATE.finanzas.ingresos) APP_STATE.finanzas.ingresos = [];
            APP_STATE.finanzas.ingresos.unshift({
                id: "ING-" + Date.now(),
                fuente: con,
                tipo: 'aleatoria',
                dia: diaHoy,
                fecha: fechaISO,
                monto: mon,
                cobrado: true
            });
        }

        sumarExp(10);
        MonarcaDB.save(APP_STATE);
        if (inCon) inCon.value = "";
        if (inMon) inMon.value = "";
        cerrarAsistenteRapido();
        if (typeof renderizarFinanzas === 'function') renderizarFinanzas(APP_STATE.finanzas);
        if (typeof cargarFinanzas === 'function') cargarFinanzas();
        alert(esGasto ? "🔴 Gasto registrado exitosamente (+10 EXP)." : "🟢 Ingreso registrado exitosamente (+10 EXP).");
    }
}

/* ==========================================================================
   SISTEMA DE HUD EXECUTIVE Y CENTRO DE NOTIFICACIONES & ALERTAS
   ========================================================================== */

function mostrarToastMonarca(mensaje, icono) {
    try {
        var toast = document.getElementById('monarca-toast-global');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'monarca-toast-global';
            toast.style.cssText = 'position:fixed;bottom:88px;left:50%;transform:translateX(-50%);background:rgba(15,20,30,0.96);color:#f8fafc;padding:10px 18px;border-radius:24px;border:1px solid rgba(255,255,255,0.18);font-size:12.5px;font-weight:600;z-index:99999;box-shadow:0 12px 32px rgba(0,0,0,0.75);pointer-events:none;transition:all 0.25s cubic-bezier(0.16,1,0.3,1);display:flex;align-items:center;gap:8px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);white-space:nowrap;';
            document.body.appendChild(toast);
        }
        toast.innerHTML = '<span>' + (icono || '✨') + '</span> <span>' + mensaje + '</span>';
        toast.style.opacity = '1';
        toast.style.display = 'flex';
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { if (toast) toast.style.display = 'none'; }, 260);
        }, 2800);
    } catch(e) {}
}

function abrirSeccionHome() {
    try {
        var hudItems = document.querySelectorAll('.monarca-bottom-hud .bottom-hud-item');
        hudItems.forEach(function(i) { i.classList.remove('active'); });
        var btnHome = document.querySelector('.monarca-bottom-hud .bottom-hud-item[data-hud="home"]');
        if (btnHome) btnHome.classList.add('active');
        mostrarToastMonarca('Apartado Home · Próximamente disponible. En preparación.', '🏠');
    } catch(e) {}
}

function abrirSeccionPerfil() {
    mostrarToastMonarca('Perfil Monarca · Próximamente disponible. En preparación.', '👤');
}

function abrirCentroNotificaciones() {
    var modal = document.getElementById('modal-centro-notificaciones');
    if (!modal) return;
    modal.style.display = 'flex';
    renderizarCentroNotificaciones();
}

function cerrarCentroNotificaciones() {
    var modal = document.getElementById('modal-centro-notificaciones');
    if (modal) modal.style.display = 'none';
}

function monarcaEscHtml(str) {
    if (str === null || typeof str === 'undefined') return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function obtenerAlertasSistemaMonarca() {
    if (typeof window.obtenerAlertasCalendarioActivas === 'function') {
        try {
            return window.obtenerAlertasCalendarioActivas() || [];
        } catch(e) {
            console.warn('[Notificaciones Calendario]', e);
        }
    }
    return [];
}

function renderizarCentroNotificaciones() {
    var cont = document.getElementById('contenedor-alertas-notificaciones');
    var txtResumen = document.getElementById('texto-resumen-alertas');
    if (!cont) return;

    var alertas = obtenerAlertasSistemaMonarca();
    if (txtResumen) {
        txtResumen.textContent = alertas.length + (alertas.length === 1 ? ' notificación activa' : ' notificaciones activas');
    }

    var html = '';
    if (alertas.length === 0) {
        html += '<div style="text-align: center; padding: 28px 16px; color: #94a3b8;">' +
            '<div style="font-size: 32px; margin-bottom: 8px;">✨</div>' +
            '<div style="font-weight: 700; font-size: 14px; color: #f8fafc; margin-bottom: 4px;">Todo al día</div>' +
            '<div style="font-size: 12px;">No tienes recordatorios pendientes ni avisos de eventos activos.</div>' +
            '</div>';
    } else {
        alertas.forEach(function(a) {
            var accionesHtml = '';
            if (Array.isArray(a.acciones) && a.acciones.length > 0) {
                a.acciones.forEach(function(ac) {
                    var esPrimaria = ac.tipo === 'primary';
                    var btnBg = esPrimaria ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.07)';
                    var btnBorder = esPrimaria ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255,255,255,0.12)';
                    var btnColor = esPrimaria ? '#34d399' : '#f8fafc';
                    accionesHtml += '<button onclick="' + ac.fn + '" style="background: ' + btnBg + '; border: 1px solid ' + btnBorder + '; color: ' + btnColor + '; padding: 6px 12px; border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer; transition: all 0.2s;">' +
                        monarcaEscHtml(ac.texto) +
                    '</button>';
                });
            } else if (a.accionTexto && a.accionFn) {
                accionesHtml = '<button onclick="' + a.accionFn + '" style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); color: #f8fafc; padding: 6px 12px; border-radius: 8px; font-size: 11.5px; font-weight: 600; cursor: pointer;">' +
                    monarcaEscHtml(a.accionTexto) + ' →' +
                '</button>';
            }

            html += '<div style="background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.09); border-left: 3px solid ' + (a.color || '#f59e0b') + '; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">' +
                '<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">' +
                    '<div style="display: flex; align-items: center; gap: 8px; min-width: 0;">' +
                        '<span style="font-size: 16px;">' + (a.icono || '🔔') + '</span>' +
                        '<span style="font-size: 13.5px; font-weight: 700; color: #f8fafc; word-break: break-word;">' + monarcaEscHtml(a.titulo) + '</span>' +
                    '</div>' +
                    '<span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: rgba(255,255,255,0.06); color: ' + (a.color || '#f59e0b') + '; white-space: nowrap;">' + monarcaEscHtml(a.badge || 'Aviso') + '</span>' +
                '</div>' +
                (a.metaLinea ? '<div style="font-size: 11.5px; color: #cbd5e1; font-weight: 600;">' + monarcaEscHtml(a.metaLinea) + '</div>' : '') +
                (a.descripcion ? '<p style="margin: 0; font-size: 11.5px; color: #94a3b8; line-height: 1.45;">' + monarcaEscHtml(a.descripcion) + '</p>' : '') +
                '<div style="display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; margin-top: 2px;">' + accionesHtml + '</div>' +
            '</div>';
        });
    }

    // Mostrar próximos recordatorios programados de hoy sin inflar la campana
    if (typeof window.obtenerProximosRecordatoriosHoy === 'function') {
        try {
            var proximos = window.obtenerProximosRecordatoriosHoy() || [];
            if (proximos.length > 0) {
                html += '<div style="margin-top: 8px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1);">' +
                    '<div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px;">Programados más tarde hoy</div>';
                proximos.forEach(function(p) {
                    html += '<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 6px;">' +
                        '<div style="min-width: 0;">' +
                            '<div style="font-size: 12px; font-weight: 600; color: #cbd5e1;">🔔 ' + monarcaEscHtml(p.hora || '--:--') + ' · ' + monarcaEscHtml(p.titulo) + '</div>' +
                            (p.personaNombre ? '<div style="font-size: 11px; color: #64748b;">👤 ' + monarcaEscHtml(p.personaNombre) + '</div>' : '') +
                        '</div>' +
                        '<span style="font-size: 10px; color: #64748b; white-space: nowrap;">Pendiente</span>' +
                    '</div>';
                });
                html += '</div>';
            }
        } catch(e) {}
    }

    cont.innerHTML = html;
}

function actualizarBadgeNotificaciones() {
    try {
        var badge = document.getElementById('hud-badge-notificaciones');
        if (!badge) return;
        var alertas = obtenerAlertasSistemaMonarca();
        if (alertas.length > 0) {
            badge.textContent = alertas.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch(e) {}
}

// Actualizar badge al cargar la ventana
if (typeof window !== 'undefined') {
    window.addEventListener('load', function() {
        setTimeout(function() {
            actualizarBadgeNotificaciones();
        }, 1200);
    });
}



