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
    notificacionesAutoPC: [],
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
        notificacionesAutoPC: [],
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
        reproductorPlaylists: [],
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
    if (typeof renderizarVistaHome === 'function') renderizarVistaHome();

    // Historial inicial para soporte del botón atrás en móvil / PWA
    var vistaInicial = (omitirLecturaLocal && window.VISTA_ACTUAL) ? window.VISTA_ACTUAL : 'vista-home';
    try {
        if (!history.state || !history.state.vista) {
            history.replaceState({ vista: vistaInicial }, '', '#' + vistaInicial);
        }
    } catch(e) {}
    window.VISTA_ACTUAL = vistaInicial;
}

window.VISTA_ACTUAL = 'vista-home';

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

    var vistaAnterior = window.VISTA_ACTUAL || 'vista-home';
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
            if (vistaId === 'vista-home' && (dataHud === 'home' || oc.indexOf('abrirSeccionHome') !== -1 || oc.indexOf("'vista-home'") !== -1)) {
                item.classList.add('active');
            } else if (vistaId === 'vista-menu' && (dataHud === 'apps' || oc.indexOf("'vista-menu'") !== -1)) {
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

    if (vistaId !== 'vista-home' && typeof detenerRelojHome === 'function') {
        detenerRelojHome();
    }
    if (vistaId !== 'vista-perfil' && typeof detenerTimerMonitorAutoPCPerfil === 'function') {
        detenerTimerMonitorAutoPCPerfil();
    }

    switch(vistaId) {
        case 'vista-home':
            if (typeof renderizarVistaHome === 'function') renderizarVistaHome();
            break;
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
                history.pushState({ vista: window.VISTA_ACTUAL || 'vista-home' }, '', '#' + (window.VISTA_ACTUAL || 'vista-home'));
            } catch(e) {}
            return true;
        }
    }

    var vistaActual = window.VISTA_ACTUAL || 'vista-home';

    // 2. Si está en el detalle de la rutina dinámica, regresar al hub de ejercicios sin destruir la sesión
    if (vistaActual === 'vista-detalle-rutina-dinamica') {
        if (typeof guardarEstadoSesionActivaEnStorage === 'function') {
            try { guardarEstadoSesionActivaEnStorage(); } catch(e) {}
        }
        cambiarVista('vista-ejercicios');
        return true;
    }

    // 3. Si está en cualquier módulo, volver a Apps; si está en Apps, volver a Home
    if (vistaActual === 'vista-menu') {
        cambiarVista('vista-home');
        return true;
    }
    if (vistaActual !== 'vista-home') {
        cambiarVista('vista-menu');
        return true;
    }

    // 4. Si ya está en vista-home: prevenir cierre accidental mediante doble confirmación (2.2s)
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
            history.pushState({ vista: 'vista-home' }, '', '#vista-home');
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
                history.replaceState({ vista: 'vista-home' }, '', '#vista-home');
                history.pushState({ vista: window.VISTA_ACTUAL || 'vista-home' }, '', '#' + (window.VISTA_ACTUAL || 'vista-home'));
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

function actualizarVisibilidadOpcionAutoPC(cat, boxId, chkId) {
    var esEmily = Boolean(cat && String(cat).toLowerCase().indexOf('emily') !== -1);
    var boxAutoPC = document.getElementById(boxId);
    var chkAutoPC = document.getElementById(chkId);
    if (boxAutoPC) {
        boxAutoPC.style.display = esEmily ? 'block' : 'none';
    }
    if (!esEmily && chkAutoPC) {
        chkAutoPC.checked = false;
    }
    return esEmily;
}

function registrarIdeaEnMonarca(textoOriginal, cat, subcat, programarAhora, imagenAdjunta) {
    var promptLimpio = (typeof obtenerTextoPromptLimpio === 'function')
        ? obtenerTextoPromptLimpio(textoOriginal)
        : String(textoOriginal || '').trim().replace(/\s*\([0-9]+\/[0-9]+\)\s*$/, '').trim();
    var tieneImg = Boolean(imagenAdjunta && imagenAdjunta.dataUrl);
    if (!promptLimpio) {
        promptLimpio = tieneImg ? 'Revisar imagen / captura adjunta' : String(textoOriginal || '').trim();
    }

    var texto = String(textoOriginal || '').trim();
    if (!texto && tieneImg) {
        texto = '🖼️ Imagen / captura adjunta';
    }
    var esEmily = Boolean(cat && String(cat).toLowerCase().indexOf('emily') !== -1);
    var enviarPC = Boolean(esEmily && programarAhora);

    var ahora = new Date();
    var dd = String(ahora.getDate()).padStart(2, '0');
    var mm = String(ahora.getMonth() + 1).padStart(2, '0');
    var fechaCorta = dd + "/" + mm;

    if (!texto.endsWith(fechaCorta) && texto.indexOf('(' + fechaCorta + ')') === -1) {
        texto += " (" + fechaCorta + ")";
    }

    if (!APP_STATE.ideas) APP_STATE.ideas = [];
    var nuevaId = Date.now();
    var imagenId = tieneImg ? ('IMG-' + nuevaId) : null;

    var nuevaIdeaObj = {
        id: nuevaId,
        texto: texto,
        textoPrompt: promptLimpio,
        categoria: cat,
        subcategoria: subcat,
        fecha: fechaCorta,
        timestamp: nuevaId,
        fechaActualizacion: nuevaId,
        hecha: false,
        autopcStatus: enviarPC ? 'pending' : null,
        autopcPendienteSubida: enviarPC
    };

    if (tieneImg && imagenId) {
        nuevaIdeaObj.tieneImagen = true;
        nuevaIdeaObj.imagenId = imagenId;
        nuevaIdeaObj.imagenNombre = String(imagenAdjunta.fileName || 'captura.png');
        nuevaIdeaObj.imagenMime = String(imagenAdjunta.mimeType || 'image/jpeg');
        nuevaIdeaObj.imagenWidth = Number(imagenAdjunta.width) || 0;
        nuevaIdeaObj.imagenHeight = Number(imagenAdjunta.height) || 0;
        nuevaIdeaObj.imagenPendienteSubida = true;
    }

    APP_STATE.ideas.unshift(nuevaIdeaObj);

    if (tieneImg && imagenId && typeof guardarImagenIdeaAdjunta === 'function') {
        guardarImagenIdeaAdjunta(nuevaIdeaObj, imagenAdjunta, !enviarPC);
    }

    MonarcaDB.save(APP_STATE);
    sumarExp(10);

    if (enviarPC && typeof window.enviarIdeaAAutoPC === 'function') {
        window.enviarIdeaAAutoPC(nuevaId, true);
    }

    return { id: nuevaId, enviadaAutoPC: enviarPC, tieneImagen: tieneImg, imagenId: imagenId };
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

    actualizarVisibilidadOpcionAutoPC(cat, 'box-opcion-autopc-asistente', 'chk-asistente-idea-programar-ahora');
}

function inicializarFormularioAsistenteRecordatorio(forzarReset) {
    var inTit = document.getElementById('asistente-rec-titulo');
    var inFecha = document.getElementById('asistente-rec-fecha');
    var inHora = document.getElementById('asistente-rec-hora');
    var inPersona = document.getElementById('asistente-rec-persona');
    var inDesc = document.getElementById('asistente-rec-desc');

    var base = new Date(Date.now() + 15 * 60000);
    var fechaDefault = base.getFullYear() + '-' + String(base.getMonth() + 1).padStart(2, '0') + '-' + String(base.getDate()).padStart(2, '0');
    var horaDefault = String(base.getHours()).padStart(2, '0') + ':' + String(base.getMinutes()).padStart(2, '0');

    if (forzarReset) {
        if (inTit) inTit.value = '';
        if (inDesc) inDesc.value = '';
        if (inFecha) inFecha.value = fechaDefault;
        if (inHora) inHora.value = horaDefault;
        if (inPersona) inPersona.value = '';
    } else {
        if (inFecha && !inFecha.value) inFecha.value = fechaDefault;
        if (inHora && !inHora.value) inHora.value = horaDefault;
    }

    if (typeof refrescarSelectoresPersonasCalendario === 'function') {
        refrescarSelectoresPersonasCalendario();
    } else if (inPersona && !inPersona.options.length) {
        var optEmpty = document.createElement('option');
        optEmpty.value = '';
        optEmpty.textContent = '-- Sin persona vinculada --';
        inPersona.appendChild(optEmpty);
    }
}

function abrirAsistenteRapido() {
    var m = document.getElementById('modal-asistente-rapido');
    if (m) {
        m.style.display = 'flex';
        poblarCategoriasAsistenteFinanza();
        alCambiarTipoAsistenteFinanza();
        alCambiarCategoriaAsistenteIdea();
        inicializarFormularioAsistenteRecordatorio(false);
        cambiarTabAsistenteRapido(TAB_ASISTENTE_ACTIVO);
        setTimeout(function() {
            if (TAB_ASISTENTE_ACTIVO === 'finanza') {
                var mon = document.getElementById('asistente-fin-monto');
                if (mon) mon.focus();
            } else if (TAB_ASISTENTE_ACTIVO === 'idea') {
                var nom = document.getElementById('asistente-idea-nombre');
                if (nom) nom.focus();
            } else if (TAB_ASISTENTE_ACTIVO === 'recordatorio') {
                var recTit = document.getElementById('asistente-rec-titulo');
                if (recTit) recTit.focus();
            }
        }, 100);
    }
}

function cerrarAsistenteRapido() {
    var m = document.getElementById('modal-asistente-rapido');
    if (m) m.style.display = 'none';
    var box = document.getElementById('contenedor-freno-impulso-asistente');
    if (box) box.style.display = 'none';
    var chkAutoPC = document.getElementById('chk-asistente-idea-programar-ahora');
    if (chkAutoPC) chkAutoPC.checked = false;
    if (typeof limpiarImagenBorradorIdea === 'function') {
        limpiarImagenBorradorIdea('asistente');
    }
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

    ['finanza', 'idea', 'recordatorio', 'quest', 'mente'].forEach(function(t) {
        var sec = document.getElementById('asistente-sec-' + t);
        if (sec) sec.style.display = (t === tab) ? 'block' : 'none';
    });

    if (tab === 'idea') {
        alCambiarCategoriaAsistenteIdea();
        var nom = document.getElementById('asistente-idea-nombre');
        if (nom) setTimeout(function() { nom.focus(); }, 60);
    } else if (tab === 'recordatorio') {
        inicializarFormularioAsistenteRecordatorio(false);
        var recTit = document.getElementById('asistente-rec-titulo');
        if (recTit) setTimeout(function() { recTit.focus(); }, 60);
    }
}

function guardarCapturaRapida() {
    var tab = TAB_ASISTENTE_ACTIVO;
    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (tab === 'idea') {
        var inNom = document.getElementById('asistente-idea-nombre');
        var inCat = document.getElementById('asistente-idea-cat');
        var inSub = document.getElementById('asistente-idea-subcat');
        var chkAutoPC = document.getElementById('chk-asistente-idea-programar-ahora');
        var texto = inNom ? inNom.value.trim() : "";
        var cat = inCat ? inCat.value : "✨ Emily";
        var subcat = inSub ? inSub.value : "General";
        var programarAhora = Boolean(chkAutoPC && chkAutoPC.checked);
        var imagenAdjunta = (typeof obtenerImagenBorradorIdea === 'function')
            ? obtenerImagenBorradorIdea('asistente')
            : null;

        if (!texto && !imagenAdjunta) { alert("Escribe el contenido de tu idea o adjunta una imagen."); if (inNom) inNom.focus(); return; }

        var resIdea = registrarIdeaEnMonarca(texto, cat, subcat, programarAhora, imagenAdjunta);

        if (inNom) inNom.value = "";
        if (chkAutoPC) chkAutoPC.checked = false;
        if (typeof limpiarImagenBorradorIdea === 'function') {
            limpiarImagenBorradorIdea('asistente');
        }
        cerrarAsistenteRapido();
        if (typeof renderizarBancoIdeas === 'function') renderizarBancoIdeas(APP_STATE.ideas);
        alert(
            "💡 Idea publicada en \"" + cat + "\" (+10 EXP)"
            + (resIdea.tieneImagen ? "\n🖼️ Imagen adjunta guardada." : "")
            + (resIdea.enviadaAutoPC ? "\n🤖 Enviada a la cola de Auto-PC." : ".")
        );

    } else if (tab === 'recordatorio') {
        var inRecTit = document.getElementById('asistente-rec-titulo');
        var inRecFecha = document.getElementById('asistente-rec-fecha');
        var inRecHora = document.getElementById('asistente-rec-hora');
        var inRecPersona = document.getElementById('asistente-rec-persona');
        var inRecDesc = document.getElementById('asistente-rec-desc');

        var recTit = inRecTit ? inRecTit.value.trim() : '';
        var recFecha = inRecFecha ? inRecFecha.value : '';
        var recHora = inRecHora ? inRecHora.value : '';
        var recPersonaId = inRecPersona ? inRecPersona.value : '';
        var recDesc = inRecDesc ? inRecDesc.value.trim() : '';

        if (!recTit) {
            alert('Ingresa el nombre del recordatorio.');
            if (inRecTit) inRecTit.focus();
            return;
        }
        if (!recFecha || !recHora) {
            alert('Selecciona fecha y hora exacta para el recordatorio.');
            if (!recFecha && inRecFecha) inRecFecha.focus();
            else if (inRecHora) inRecHora.focus();
            return;
        }

        var recGuardado = null;
        if (typeof window.crearGuardarRecordatorioCalendario === 'function') {
            recGuardado = window.crearGuardarRecordatorioCalendario({
                titulo: recTit,
                descripcion: recDesc,
                fecha: recFecha,
                hora: recHora,
                personaId: recPersonaId
            });
        } else {
            if (!APP_STATE.calendario) APP_STATE.calendario = [];
            var tsRec = Date.now();
            recGuardado = {
                id: 'REC-' + tsRec + '-' + Math.random().toString(36).substr(2, 4),
                tipo: 'recordatorio',
                titulo: recTit,
                descripcion: recDesc,
                fecha: recFecha,
                hora: recHora,
                personaId: recPersonaId || '',
                personaNombre: '',
                completado: false,
                fechaCompletada: null,
                pospuestoHasta: null,
                notificadoParaTs: null,
                notificadoEn: null,
                timestamp: tsRec,
                fechaActualizacion: tsRec
            };
            APP_STATE.calendario.push(recGuardado);
            if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
            if (typeof renderizarCalendario === 'function') renderizarCalendario();
            if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
            if (typeof programarAlarmasCalendarioNativas === 'function') programarAlarmasCalendarioNativas();
            if (typeof verificarDisparadoresCalendario === 'function') verificarDisparadoresCalendario();
        }

        inicializarFormularioAsistenteRecordatorio(true);
        cerrarAsistenteRapido();
        alert(
            '🔔 Recordatorio programado para ' + recFecha + ' a las ' + recHora
            + (recGuardado && recGuardado.personaNombre ? '\n👤 Persona vinculada: ' + recGuardado.personaNombre : '')
            + '\n📅 Guardado en tu Calendario.'
        );

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

var MONARCA_HOME_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
var MONARCA_HOME_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
var MONARCA_HOME_MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function obtenerNumeroSemanaISO(fecha) {
    var d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    var diaNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - diaNum);
    var inicioAnio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - inicioAnio) / 86400000) + 1) / 7);
}

var MONARCA_HOME_CLOCK_TIMER = null;
var MONARCA_HOME_ULTIMA_CLAVE_DIA = '';

function actualizarRelojHome(fechaCustom) {
    var ahora = (fechaCustom instanceof Date && !isNaN(fechaCustom.getTime())) ? fechaCustom : new Date();
    var h24 = ahora.getHours();
    var min = ahora.getMinutes();
    var seg = ahora.getSeconds();
    var ampm = h24 >= 12 ? 'PM' : 'AM';
    var h12 = h24 % 12;
    if (h12 === 0) h12 = 12;

    var hmTxt = String(h12).padStart(2, '0') + ':' + String(min).padStart(2, '0');
    var segTxt = ':' + String(seg).padStart(2, '0');

    var elHm = document.getElementById('home-reloj-hm');
    var elSeg = document.getElementById('home-reloj-seg');
    var elAmPm = document.getElementById('home-reloj-ampm');
    var elTime = document.getElementById('home-reloj-tiempo');

    if (elHm) elHm.textContent = hmTxt;
    if (elSeg) elSeg.textContent = segTxt;
    if (elAmPm) elAmPm.textContent = ampm;
    if (elTime) {
        elTime.setAttribute('datetime', String(h24).padStart(2, '0') + ':' + String(min).padStart(2, '0') + ':' + String(seg).padStart(2, '0'));
    }

    // Si cruza la medianoche estando abierto en Home, refrescar automáticamente la fecha
    if (!(fechaCustom instanceof Date)) {
        var claveHoy = ahora.getFullYear() + '-' + (ahora.getMonth() + 1) + '-' + ahora.getDate();
        if (MONARCA_HOME_ULTIMA_CLAVE_DIA && MONARCA_HOME_ULTIMA_CLAVE_DIA !== claveHoy) {
            renderizarVistaHome(ahora);
        }
    }
}

function detenerRelojHome() {
    if (MONARCA_HOME_CLOCK_TIMER) {
        clearInterval(MONARCA_HOME_CLOCK_TIMER);
        MONARCA_HOME_CLOCK_TIMER = null;
    }
}

function iniciarRelojHome() {
    detenerRelojHome();
    actualizarRelojHome();
    MONARCA_HOME_CLOCK_TIMER = setInterval(function() {
        if (document.hidden || (window.VISTA_ACTUAL && window.VISTA_ACTUAL !== 'vista-home')) {
            detenerRelojHome();
            return;
        }
        actualizarRelojHome();
    }, 1000);
}

function renderizarVistaHome(fechaCustom) {
    var ahora = (fechaCustom instanceof Date && !isNaN(fechaCustom.getTime())) ? fechaCustom : new Date();
    var diaIdx = ahora.getDay();
    var diaNum = ahora.getDate();
    var mesIdx = ahora.getMonth();
    var anio = ahora.getFullYear();
    var hora = ahora.getHours();

    MONARCA_HOME_ULTIMA_CLAVE_DIA = anio + '-' + (mesIdx + 1) + '-' + diaNum;

    var diaNombre = MONARCA_HOME_DIAS[diaIdx] || 'Hoy';
    var mesNombre = MONARCA_HOME_MESES[mesIdx] || '';
    var mesCap = mesNombre ? (mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)) : '';
    var mesCorto = MONARCA_HOME_MESES_CORTOS[mesIdx] || '---';

    var saludoBase = hora < 12 ? 'Buenos días' : (hora < 19 ? 'Buenas tardes' : 'Buenas noches');
    var tituloJugador = (window.APP_STATE && APP_STATE.jugador && APP_STATE.jugador.titulo) ? String(APP_STATE.jugador.titulo).trim() : 'Gabriel';
    var primerNombre = tituloJugador.split(/\s+/)[0] || 'Gabriel';

    var semanaAnio = obtenerNumeroSemanaISO(ahora);
    var inicioAnioLocal = new Date(anio, 0, 1);
    var diaDelAnio = Math.floor((new Date(anio, mesIdx, diaNum) - inicioAnioLocal) / 86400000) + 1;

    var elSaludo = document.getElementById('home-saludo-contexto');
    var elMesCorto = document.getElementById('home-fecha-mes-corto');
    var elDiaNum = document.getElementById('home-fecha-dia-num');
    var elDiaSemana = document.getElementById('home-fecha-dia-semana');
    var elFechaComp = document.getElementById('home-fecha-completa');
    var elFechaMeta = document.getElementById('home-fecha-meta');

    if (elSaludo) elSaludo.textContent = saludoBase + ', ' + primerNombre;
    if (elMesCorto) elMesCorto.textContent = mesCorto;
    if (elDiaNum) elDiaNum.textContent = String(diaNum).padStart(2, '0');
    if (elDiaSemana) elDiaSemana.textContent = diaNombre;
    if (elFechaComp) elFechaComp.textContent = diaNum + ' de ' + mesCap + ' de ' + anio;
    if (elFechaMeta) elFechaMeta.textContent = 'Semana ' + semanaAnio + ' · Día ' + diaDelAnio + ' del año';

    if (fechaCustom instanceof Date) {
        actualizarRelojHome(ahora);
    } else if (!document.hidden && (!window.VISTA_ACTUAL || window.VISTA_ACTUAL === 'vista-home')) {
        iniciarRelojHome();
    } else {
        actualizarRelojHome(ahora);
    }

    if (!(fechaCustom instanceof Date)) {
        if (typeof window !== 'undefined' && window.MONARCA_ESTADO_ACTUALIZACION && window.MONARCA_ESTADO_ACTUALIZACION.ultimaComprobacionMs) {
            aplicarUIEstadoActualizacionHome();
        }
        verificarActualizacionAppHome(false);
    }
}

var MONARCA_APP_VERSION = '10.88';
var MONARCA_APP_VERSION_FECHA = '2026-11-22';
var MONARCA_GITHUB_RELEASE_API = 'https://api.github.com/repos/gabrielenriqueariasalvarado-ux/sistema-monarca/releases/tags/latest-apk';
var MONARCA_GITHUB_PAGES_VERSION_URL = 'https://gabrielenriqueariasalvarado-ux.github.io/sistema-monarca/version.json';
var MONARCA_APK_DOWNLOAD_URL = 'https://github.com/gabrielenriqueariasalvarado-ux/sistema-monarca/releases/download/latest-apk/Sistema-Monarca.apk';

if (typeof window !== 'undefined') {
    window.MONARCA_APP_VERSION = MONARCA_APP_VERSION;
    window.MONARCA_ESTADO_ACTUALIZACION = {
        comprobando: false,
        estado: 'checking',
        versionLocal: MONARCA_APP_VERSION,
        versionRemota: null,
        fechaRemota: '',
        resumenRemoto: '',
        fuente: '',
        apkUrl: MONARCA_APK_DOWNLOAD_URL,
        swPendiente: false,
        ultimaComprobacionMs: 0,
        entorno: null
    };
}

function parsearSegmentosVersion(v) {
    return String(v || '')
        .replace(/^[^0-9]*/, '')
        .split(/[^0-9]+/)
        .filter(function(p) { return p.length > 0; })
        .map(function(n) { return parseInt(n, 10) || 0; });
}

function compararVersionesSemver(vLocal, vRemota) {
    var a = parsearSegmentosVersion(vLocal);
    var b = parsearSegmentosVersion(vRemota);
    var len = Math.max(a.length, b.length);
    for (var i = 0; i < len; i++) {
        var na = a[i] || 0;
        var nb = b[i] || 0;
        if (na < nb) return -1;
        if (na > nb) return 1;
    }
    return 0;
}

function extraerVersionDeTexto(txt) {
    if (!txt) return null;
    var m = String(txt).match(/v?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
    return m ? m[1] : null;
}

function detectarEntornoAppMonarca() {
    try {
        if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
            var plat = (typeof window.Capacitor.getPlatform === 'function') ? window.Capacitor.getPlatform() : 'android';
            return {
                esNativo: true,
                esPwa: false,
                etiqueta: plat === 'ios' ? '📱 App iOS (Nativa)' : '📱 App Android (APK)'
            };
        }
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            return { esNativo: false, esPwa: true, etiqueta: '📲 PWA Instalada' };
        }
    } catch(e) {}
    return { esNativo: false, esPwa: false, etiqueta: '🌐 Web / Navegador' };
}

function formatearHoraCorta(ms) {
    var d = new Date(ms || Date.now());
    var h24 = d.getHours();
    var m = String(d.getMinutes()).padStart(2, '0');
    var ampm = h24 >= 12 ? 'PM' : 'AM';
    var h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return String(h12).padStart(2, '0') + ':' + m + ' ' + ampm;
}

function formatearFechaReleaseCorta(isoStr) {
    if (!isoStr) return '';
    try {
        var soloFecha = String(isoStr).trim().match(/^([0-9]+)-([0-9]+)-([0-9]+)$/);
        if (soloFecha) {
            return soloFecha[3].padStart(2, '0') + '/' + soloFecha[2].padStart(2, '0') + '/' + soloFecha[1].slice(-2);
        }
        var d = new Date(isoStr);
        if (isNaN(d.getTime())) return String(isoStr).slice(0, 10);
        return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getFullYear()).slice(-2);
    } catch(e) {
        return '';
    }
}

function aplicarUIEstadoActualizacionHome() {
    var card = document.getElementById('home-update-card');
    if (!card || !window.MONARCA_ESTADO_ACTUALIZACION) return;

    var st = window.MONARCA_ESTADO_ACTUALIZACION;
    var verLocal = String((window.MONARCA_APP_VERSION || st.versionLocal || MONARCA_APP_VERSION)).replace(/^v/i, '');
    var verRemota = st.versionRemota ? String(st.versionRemota).replace(/^v/i, '') : '';
    var entorno = st.entorno || detectarEntornoAppMonarca();

    var iconEl = document.getElementById('home-update-status-icon');
    var tituloEl = document.getElementById('home-update-titulo');
    var btnCheck = document.getElementById('btn-home-check-update');
    var valLocalEl = document.getElementById('home-ver-local');
    var valRemotaEl = document.getElementById('home-ver-remota');
    var valEntornoEl = document.getElementById('home-ver-entorno');
    var detalleEl = document.getElementById('home-update-detalle-banner');
    var accionesEl = document.getElementById('home-update-acciones');

    if (valLocalEl) valLocalEl.textContent = 'v' + verLocal;
    if (valEntornoEl) valEntornoEl.textContent = entorno.etiqueta;
    if (btnCheck) {
        btnCheck.disabled = !!st.comprobando;
        btnCheck.innerHTML = st.comprobando
            ? '<span>⏳</span><span>Revisando...</span>'
            : '<span>🔄</span><span>Comprobar</span>';
    }

    card.classList.remove('is-checking', 'is-uptodate', 'is-outdated', 'is-offline');

    if (st.comprobando && !st.ultimaComprobacionMs) {
        card.classList.add('is-checking');
        if (iconEl) iconEl.textContent = '🔄';
        if (tituloEl) tituloEl.textContent = 'Comprobando versión...';
        if (valRemotaEl) valRemotaEl.textContent = 'Verificando...';
        if (detalleEl) detalleEl.textContent = 'Consultando si existen cambios nuevos publicados para tu dispositivo...';
        if (accionesEl) { accionesEl.style.display = 'none'; accionesEl.innerHTML = ''; }
        return;
    }

    if (st.estado === 'offline') {
        card.classList.add('is-offline');
        if (iconEl) iconEl.textContent = '📶';
        if (tituloEl) tituloEl.textContent = 'Sin conexión para comprobar';
        if (valRemotaEl) valRemotaEl.textContent = verRemota ? ('v' + verRemota) : 'Sin red';
        if (detalleEl) {
            detalleEl.textContent = 'No se pudo conectar al servidor para verificar si hay cambios nuevos. Sigues operando con la versión local v' + verLocal + '.';
        }
        if (accionesEl) { accionesEl.style.display = 'none'; accionesEl.innerHTML = ''; }
        return;
    }

    if (!verRemota) {
        card.classList.add('is-checking');
        if (iconEl) iconEl.textContent = '⚠️';
        if (tituloEl) tituloEl.textContent = 'No se pudo leer la versión remota';
        if (valRemotaEl) valRemotaEl.textContent = '--';
        if (detalleEl) detalleEl.textContent = 'Versión instalada: v' + verLocal + '. Pulsa Comprobar para reintentar.';
        if (accionesEl) { accionesEl.style.display = 'none'; accionesEl.innerHTML = ''; }
        return;
    }

    var fechaTxt = st.fechaRemota ? (' · ' + formatearFechaReleaseCorta(st.fechaRemota)) : '';
    if (valRemotaEl) valRemotaEl.textContent = 'v' + verRemota + fechaTxt;

    var cmp = compararVersionesSemver(verLocal, verRemota);
    var horaTxt = st.ultimaComprobacionMs ? (' (revisado ' + formatearHoraCorta(st.ultimaComprobacionMs) + ')') : '';

    if (cmp < 0 || st.swPendiente) {
        card.classList.add('is-outdated');
        if (iconEl) iconEl.textContent = '🚀';
        if (tituloEl) {
            tituloEl.textContent = st.swPendiente && cmp === 0
                ? 'Nueva versión lista para aplicar (v' + verRemota + ')'
                : 'Actualización pendiente (v' + verRemota + ')';
        }
        var desc = 'Tu dispositivo aún mantiene la versión anterior v' + verLocal + ' y no ha descargado los cambios de la v' + verRemota + '.';
        if (st.resumenRemoto) {
            desc += ' Novedades: ' + st.resumenRemoto;
        }
        if (detalleEl) detalleEl.textContent = desc;

        if (accionesEl) {
            var apkLink = monarcaEscHtml(st.apkUrl || MONARCA_APK_DOWNLOAD_URL);
            if (entorno.esNativo) {
                accionesEl.innerHTML =
                    '<a class="home-btn-descargar-update" href="' + apkLink + '" target="_blank" rel="noopener noreferrer">' +
                        '<span>⬇️</span><span>Descargar APK v' + monarcaEscHtml(verRemota) + '</span>' +
                    '</a>' +
                    '<button type="button" class="home-btn-secundaria-update" onclick="verificarActualizacionAppHome(true)">' +
                        '<span>🔄</span><span>Ya instalé · Revalidar</span>' +
                    '</button>';
            } else {
                accionesEl.innerHTML =
                    '<button type="button" class="home-btn-descargar-update" onclick="aplicarActualizacionWebHome()">' +
                        '<span>⚡</span><span>Actualizar Web a v' + monarcaEscHtml(verRemota) + '</span>' +
                    '</button>' +
                    '<a class="home-btn-secundaria-update" href="' + apkLink + '" target="_blank" rel="noopener noreferrer">' +
                        '<span>📱</span><span>Descargar APK</span>' +
                    '</a>';
            }
            accionesEl.style.display = 'flex';
        }
    } else if (cmp > 0) {
        card.classList.add('is-uptodate');
        if (iconEl) iconEl.textContent = '✨';
        if (tituloEl) tituloEl.textContent = 'Versión adelantada en este dispositivo';
        if (detalleEl) {
            detalleEl.textContent = 'Tu dispositivo ya tiene la v' + verLocal + ', mientras el servidor público muestra v' + verRemota + horaTxt + '.';
        }
        if (accionesEl) { accionesEl.style.display = 'none'; accionesEl.innerHTML = ''; }
    } else {
        card.classList.add('is-uptodate');
        if (iconEl) iconEl.textContent = '✅';
        if (tituloEl) tituloEl.textContent = 'App actualizada en tu teléfono';
        if (detalleEl) {
            detalleEl.textContent = 'Tu dispositivo ya tiene la última versión (v' + verLocal + ') con todos los cambios al día' + horaTxt + '.';
        }
        if (accionesEl) { accionesEl.style.display = 'none'; accionesEl.innerHTML = ''; }
    }
}

async function verificarActualizacionAppHome(forzarManual) {
    if (typeof window === 'undefined') return null;
    var st = window.MONARCA_ESTADO_ACTUALIZACION;
    if (!st) return null;

    var entorno = detectarEntornoAppMonarca();
    st.entorno = entorno;
    st.versionLocal = String(window.MONARCA_APP_VERSION || MONARCA_APP_VERSION).replace(/^v/i, '');

    if (!forzarManual && st.ultimaComprobacionMs && (Date.now() - st.ultimaComprobacionMs) < 90000) {
        aplicarUIEstadoActualizacionHome();
        return st;
    }
    if (st.comprobando) return st;

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        st.estado = 'offline';
        st.comprobando = false;
        st.ultimaComprobacionMs = Date.now();
        aplicarUIEstadoActualizacionHome();
        return st;
    }

    st.comprobando = true;
    aplicarUIEstadoActualizacionHome();

    var swPendiente = false;
    try {
        if (!entorno.esNativo && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
            var reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                try { await reg.update(); } catch(igSw) {}
                if (reg.waiting) swPendiente = true;
            }
        }
    } catch(eSw) {}

    var encontrado = null;

    async function intentarReleaseGitHub() {
        var r = await fetch(MONARCA_GITHUB_RELEASE_API, { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var rel = await r.json();
        var ver = extraerVersionDeTexto(rel && rel.name) || extraerVersionDeTexto(rel && rel.body);
        if (!ver) throw new Error('Version no encontrada en release');
        var asset = (rel && Array.isArray(rel.assets) && rel.assets[0]) ? rel.assets[0] : null;
        return {
            version: ver,
            fecha: (asset && asset.updated_at) || (rel && rel.published_at) || '',
            resumen: '',
            apkUrl: (asset && asset.browser_download_url) || MONARCA_APK_DOWNLOAD_URL,
            fuente: 'Release APK GitHub'
        };
    }

    async function intentarVersionJson(baseUrl, fuenteLbl) {
        var sep = baseUrl.indexOf('?') !== -1 ? '&' : '?';
        var r = await fetch(baseUrl + sep + 't=' + Date.now(), { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var data = await r.json();
        var ver = extraerVersionDeTexto(data && data.version);
        if (!ver) throw new Error('Version invalida en version.json');
        return {
            version: ver,
            fecha: (data && data.fecha) || '',
            resumen: (data && data.resumen) || '',
            apkUrl: (data && data.apkUrl) || MONARCA_APK_DOWNLOAD_URL,
            fuente: fuenteLbl
        };
    }

    try {
        if (entorno.esNativo) {
            try {
                encontrado = await intentarReleaseGitHub();
            } catch(eRel) {
                encontrado = await intentarVersionJson(MONARCA_GITHUB_PAGES_VERSION_URL, 'Servidor Web GitHub Pages');
            }
        } else {
            var puedeLocalHttp = (typeof location !== 'undefined' && location.protocol && location.protocol.indexOf('http') === 0);
            if (puedeLocalHttp) {
                try {
                    encontrado = await intentarVersionJson('./version.json', 'Servidor Web');
                } catch(eLoc) {}
            }
            if (!encontrado) {
                try {
                    encontrado = await intentarVersionJson(MONARCA_GITHUB_PAGES_VERSION_URL, 'GitHub Pages');
                } catch(ePages) {}
            }
            if (!encontrado) {
                encontrado = await intentarReleaseGitHub();
            }
        }
    } catch(errNet) {
        encontrado = null;
    }

    st.comprobando = false;
    st.swPendiente = swPendiente;
    st.ultimaComprobacionMs = Date.now();

    if (encontrado) {
        st.versionRemota = encontrado.version;
        st.fechaRemota = encontrado.fecha;
        st.resumenRemoto = encontrado.resumen;
        st.apkUrl = encontrado.apkUrl || MONARCA_APK_DOWNLOAD_URL;
        st.fuente = encontrado.fuente;
        var cmpRes = compararVersionesSemver(st.versionLocal, st.versionRemota);
        st.estado = (cmpRes < 0 || swPendiente) ? 'outdated' : 'uptodate';
    } else {
        st.estado = 'offline';
    }

    aplicarUIEstadoActualizacionHome();
    return st;
}

async function aplicarActualizacionWebHome() {
    try {
        if (typeof caches !== 'undefined' && typeof caches.keys === 'function') {
            var keys = await caches.keys();
            await Promise.all(keys.map(function(k) { return caches.delete(k); }));
        }
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
            var regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(function(r) { return r.update().catch(function() {}); }));
        }
    } catch(e) {}
    location.reload();
}

function abrirSeccionHome() {
    if (typeof cambiarVista === 'function') {
        cambiarVista('vista-home');
    }
}

if (typeof window !== 'undefined') {
    window.renderizarVistaHome = renderizarVistaHome;
    window.actualizarRelojHome = actualizarRelojHome;
    window.iniciarRelojHome = iniciarRelojHome;
    window.detenerRelojHome = detenerRelojHome;
    window.abrirSeccionHome = abrirSeccionHome;
    window.compararVersionesSemver = compararVersionesSemver;
    window.verificarActualizacionAppHome = verificarActualizacionAppHome;
    window.aplicarActualizacionWebHome = aplicarActualizacionWebHome;
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            detenerRelojHome();
        } else if (window.VISTA_ACTUAL === 'vista-home') {
            renderizarVistaHome();
        }
    });
    window.addEventListener('focus', function() {
        if (window.VISTA_ACTUAL === 'vista-home') {
            renderizarVistaHome();
        }
    });
}

function abrirSeccionPerfil() {
    mostrarToastMonarca('Perfil Monarca · Próximamente disponible. En preparación.', '👤');
}

var MONARCA_NOTIFS_DISPATCH_KEY = 'monarca_notifs_telefono_despachadas_v1';
var MONARCA_ALERTAS_GENERALES = [];
var _MONARCA_PUENTE_NOTIFS_INICIADO = false;
var _MONARCA_CANAL_PROMESA = null;
var _MONARCA_CANAL_LISTO = false;
var _MONARCA_DISPATCH_CACHE = null;

function _cargarRegistroNotifsTelefono() {
    if (_MONARCA_DISPATCH_CACHE) return _MONARCA_DISPATCH_CACHE;
    var base = { keys: {}, activeAlertIds: {} };
    try {
        var raw = localStorage.getItem(MONARCA_NOTIFS_DISPATCH_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                if (parsed.keys && typeof parsed.keys === 'object') base.keys = parsed.keys;
                if (parsed.activeAlertIds && typeof parsed.activeAlertIds === 'object') base.activeAlertIds = parsed.activeAlertIds;
            }
        }
    } catch(e) {}
    _MONARCA_DISPATCH_CACHE = base;
    return base;
}

function _guardarRegistroNotifsTelefono(reg) {
    _MONARCA_DISPATCH_CACHE = reg;
    try {
        var kList = Object.keys(reg.keys || {});
        if (kList.length > 150) {
            kList.sort(function(a, b) {
                return ((reg.keys[a] && reg.keys[a].ts) || 0) - ((reg.keys[b] && reg.keys[b].ts) || 0);
            });
            kList.slice(0, kList.length - 150).forEach(function(oldK) {
                delete reg.keys[oldK];
            });
        }
        localStorage.setItem(MONARCA_NOTIFS_DISPATCH_KEY, JSON.stringify(reg));
    } catch(e) {}
}

function obtenerIdNumericoNotifMonarca(rawKey) {
    var s = String(rawKey || 'monarca');
    var hash = 2166136261;
    for (var i = 0; i < s.length; i++) {
        hash ^= s.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    var positivo = hash >>> 0;
    return 800000 + (positivo % 990000000);
}

function asegurarCanalYAccionesNotifMonarca() {
    var plugins = (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins : null;
    var ln = plugins ? plugins.LocalNotifications : null;
    if (!ln) return Promise.resolve(false);
    if (_MONARCA_CANAL_PROMESA) return _MONARCA_CANAL_PROMESA;

    var tareas = [];
    if (typeof ln.createChannel === 'function') {
        tareas.push(
            Promise.resolve().then(function() {
                return ln.createChannel({
                    id: 'monarca_alerts_channel',
                    name: 'Alertas Sistema Monarca',
                    description: 'Notificaciones unificadas del Sistema Monarca con confirmación ✓ Okey',
                    importance: 4,
                    visibility: 1,
                    vibration: true,
                    lights: true,
                    lightColor: '#6366f1'
                });
            }).catch(function() {})
        );
    }
    if (typeof ln.registerActionTypes === 'function') {
        tareas.push(
            Promise.resolve().then(function() {
                return ln.registerActionTypes({
                    types: [{
                        id: 'MONARCA_ALERT_OKEY',
                        actions: [{
                            id: 'okey',
                            title: '✓ Okey',
                            foreground: true
                        }]
                    }]
                });
            }).catch(function() {})
        );
    }

    _MONARCA_CANAL_PROMESA = Promise.all(tareas).then(function() {
        _MONARCA_CANAL_LISTO = true;
        return true;
    }).catch(function() {
        _MONARCA_CANAL_PROMESA = null;
        return false;
    });
    return _MONARCA_CANAL_PROMESA;
}

function registrarNotifProgramadaTelefono(dispatchKey, idNum, futureAtMs) {
    if (!dispatchKey) return;
    var reg = _cargarRegistroNotifsTelefono();
    reg.keys[String(dispatchKey)] = {
        idNum: Number(idNum) || obtenerIdNumericoNotifMonarca(dispatchKey),
        ts: Date.now(),
        futureAt: Number(futureAtMs) || 0
    };
    _guardarRegistroNotifsTelefono(reg);
}

function cancelarNotificacionTelefonoPorAlerta(alertId, idNumOpcional) {
    var keyId = String(alertId || '').trim();
    if (!keyId && !idNumOpcional) return;
    var idNum = Number(idNumOpcional) || obtenerIdNumericoNotifMonarca(keyId);

    var reg = _cargarRegistroNotifsTelefono();
    if (keyId && reg.activeAlertIds) {
        delete reg.activeAlertIds[keyId];
    }
    if (keyId && reg.keys) {
        Object.keys(reg.keys).forEach(function(k) {
            if (k === keyId || k.indexOf(keyId + '@') === 0) {
                delete reg.keys[k];
            }
        });
    }
    _guardarRegistroNotifsTelefono(reg);

    var plugins = (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins : null;
    var ln = plugins ? plugins.LocalNotifications : null;
    if (ln) {
        try {
            if (typeof ln.cancel === 'function') {
                ln.cancel({ notifications: [{ id: idNum }] }).catch(function() {});
            }
        } catch(e) {}
        try {
            if (typeof ln.removeDeliveredNotifications === 'function') {
                ln.removeDeliveredNotifications({ notifications: [{ id: idNum }] }).catch(function() {});
            }
        } catch(e) {}
    }

    if (typeof navigator !== 'undefined' && navigator.serviceWorker && navigator.serviceWorker.controller && typeof navigator.serviceWorker.ready === 'object') {
        try {
            navigator.serviceWorker.ready.then(function(swReg) {
                if (swReg && typeof swReg.getNotifications === 'function') {
                    return swReg.getNotifications({ tag: keyId }).then(function(lista) {
                        (lista || []).forEach(function(n) { try { n.close(); } catch(e) {} });
                    });
                }
            }).catch(function() {});
        } catch(e) {}
    }
}

function _cargarGeneralesAckSession() {
    try {
        var raw = sessionStorage.getItem('monarca_general_alerts_ack');
        return raw ? JSON.parse(raw) : {};
    } catch(e) { return {}; }
}

function _marcarGeneralAckSession(id) {
    if (!id) return;
    try {
        var m = _cargarGeneralesAckSession();
        m[String(id)] = Date.now();
        sessionStorage.setItem('monarca_general_alerts_ack', JSON.stringify(m));
    } catch(e) {}
}

function registrarAlertaGeneralMonarca(opts) {
    if (!opts || !opts.titulo) return null;
    var baseId = String(opts.id || ('alerta-gen-' + (opts.tag || Date.now()))).replace(/[^a-zA-Z0-9_@.-]/g, '_');
    var ackMap = _cargarGeneralesAckSession();
    if (ackMap[baseId] && !opts.forzarReapertura) {
        return null;
    }
    var safeId = baseId.replace(/'/g, "\\'");
    var ts = Number(opts.timestamp) || Date.now();
    var nueva = {
        id: baseId,
        tipo: opts.tipo || 'general',
        icono: opts.icono || '🔔',
        badge: opts.badge || 'Sistema Monarca',
        color: opts.color || '#818cf8',
        titulo: String(opts.titulo),
        metaLinea: opts.metaLinea || ('🕒 ' + new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })),
        descripcion: String(opts.descripcion || ''),
        acciones: Array.isArray(opts.acciones) ? opts.acciones : [
            { tipo: 'primary', texto: '✓ Okey', fn: "descartarAlertaGeneralMonarca('" + safeId + "')" }
        ],
        _sortTs: ts,
        _dispatchKey: baseId + '@' + ts,
        _phoneMeta: {
            monarcaAlertId: baseId,
            monarcaAlertTipo: opts.phoneTipo || 'general',
            tag: opts.tag || baseId
        }
    };
    MONARCA_ALERTAS_GENERALES = MONARCA_ALERTAS_GENERALES.filter(function(a) { return a && a.id !== baseId; });
    MONARCA_ALERTAS_GENERALES.unshift(nueva);
    if (MONARCA_ALERTAS_GENERALES.length > 25) {
        MONARCA_ALERTAS_GENERALES = MONARCA_ALERTAS_GENERALES.slice(0, 25);
    }
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    var modal = document.getElementById('modal-centro-notificaciones');
    if (modal && modal.style.display === 'flex' && typeof renderizarCentroNotificaciones === 'function') {
        renderizarCentroNotificaciones();
    }
    return nueva;
}

function descartarAlertaGeneralMonarca(alertaId) {
    var key = String(alertaId || '').trim();
    if (!key) return;
    _marcarGeneralAckSession(key);
    MONARCA_ALERTAS_GENERALES = MONARCA_ALERTAS_GENERALES.filter(function(a) { return a && a.id !== key; });
    cancelarNotificacionTelefonoPorAlerta(key);
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof renderizarCentroNotificaciones === 'function') renderizarCentroNotificaciones();
}

function obtenerAlertasGeneralesActivas() {
    var ackMap = _cargarGeneralesAckSession();
    return Array.isArray(MONARCA_ALERTAS_GENERALES)
        ? MONARCA_ALERTAS_GENERALES.filter(function(a) { return a && a.id && !ackMap[String(a.id)]; })
        : [];
}

function confirmarAlertaOkeySistema(metaOrId) {
    var extra = (metaOrId && typeof metaOrId === 'object') ? metaOrId : null;
    var alertId = extra ? String(extra.monarcaAlertId || extra.id || '') : String(metaOrId || '');
    var tipo = extra ? String(extra.monarcaAlertTipo || extra.tipo || '') : '';
    var notifNumId = extra && extra.notifId ? Number(extra.notifId) : (alertId ? obtenerIdNumericoNotifMonarca(alertId) : 0);

    if ((!tipo || !extra) && alertId) {
        var encontradas = obtenerAlertasSistemaMonarca();
        var match = encontradas.find(function(a) { return a && String(a.id) === alertId; });
        if (match) {
            extra = Object.assign({}, match._phoneMeta || {}, {
                monarcaAlertId: match.id,
                monarcaAlertTipo: (match._phoneMeta && match._phoneMeta.monarcaAlertTipo) || match.tipo,
                autopcNotifId: match.autopcNotifId || (match._phoneMeta && match._phoneMeta.autopcNotifId),
                calId: match.calId || (match._phoneMeta && match._phoneMeta.calId),
                questId: match.questId || (match._phoneMeta && match._phoneMeta.questId),
                dueMs: match._sortTs
            });
            tipo = String(extra.monarcaAlertTipo || '');
        }
    }

    if (tipo === 'autopc' || (alertId.indexOf('alerta-autopc-') === 0 && extra && extra.autopcNotifId)) {
        var autopcId = (extra && extra.autopcNotifId) ? extra.autopcNotifId : alertId.replace('alerta-autopc-', '');
        if (typeof window.descartarNotificacionAutoPC === 'function') {
            window.descartarNotificacionAutoPC(autopcId);
        }
    } else if (tipo === 'cal-rec' || tipo === 'urgente' || alertId.indexOf('alerta-cal-rec-') === 0) {
        var calRecId = (extra && extra.calId) ? extra.calId : alertId.replace('alerta-cal-rec-', '');
        var dueMs = extra && extra.dueMs ? Number(extra.dueMs) : Date.now();
        if (typeof window.confirmarOkeyRecordatorioCalendario === 'function') {
            window.confirmarOkeyRecordatorioCalendario(calRecId, dueMs);
        }
    } else if (tipo === 'cal-ev' || tipo === 'info' || alertId.indexOf('alerta-cal-ev-') === 0) {
        var calEvId = (extra && extra.calId) ? extra.calId : alertId.replace('alerta-cal-ev-', '');
        if (typeof window.descartarAvisoEventoCalendario === 'function') {
            window.descartarAvisoEventoCalendario(calEvId);
        }
    } else if (tipo === 'quest' || alertId.indexOf('alerta-quest-act-') === 0) {
        var qId = (extra && extra.questId) ? extra.questId : alertId.replace('alerta-quest-act-', '');
        if (typeof window.confirmarAlertaOkeyQuest === 'function') {
            window.confirmarAlertaOkeyQuest(qId);
        }
    } else if (tipo === 'quest-pen' || tipo === 'quest-penitencia' || alertId.indexOf('alerta-quest-pen-') === 0) {
        var qPenId = (extra && extra.questId) ? extra.questId : alertId.replace('alerta-quest-pen-', '');
        if (typeof window.confirmarAlertaOkeyPenitenciaQuest === 'function') {
            window.confirmarAlertaOkeyPenitenciaQuest(qPenId);
        }
    } else if (alertId) {
        descartarAlertaGeneralMonarca(alertId);
    }

    if (alertId || notifNumId) {
        cancelarNotificacionTelefonoPorAlerta(alertId, notifNumId);
    }
}

function confirmarTodasAlertasOkeySistema() {
    var alertas = obtenerAlertasSistemaMonarca().slice();
    if (alertas.length === 0) return;
    var hayAutoPC = alertas.some(function(a) { return a && a.tipo === 'autopc'; });
    if (hayAutoPC && typeof window.descartarTodasNotificacionesAutoPC === 'function') {
        window.descartarTodasNotificacionesAutoPC();
    }
    alertas.forEach(function(a) {
        if (!a || (hayAutoPC && a.tipo === 'autopc')) return;
        confirmarAlertaOkeySistema(Object.assign({
            monarcaAlertId: a.id,
            monarcaAlertTipo: (a._phoneMeta && a._phoneMeta.monarcaAlertTipo) || a.tipo,
            autopcNotifId: a.autopcNotifId,
            calId: a.calId,
            questId: a.questId,
            dueMs: a._sortTs
        }, a._phoneMeta || {}));
    });
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Todas las alertas confirmadas con ✓ Okey', '✅');
    }
}

function manejarAccionNotificacionTelefono(event) {
    try {
        var actionId = (event && event.actionId) ? String(event.actionId) : 'tap';
        var notif = (event && event.notification) ? event.notification : event;
        var extra = (notif && notif.extra && typeof notif.extra === 'object')
            ? Object.assign({}, notif.extra)
            : {};
        if (notif && notif.id) {
            extra.notifId = notif.id;
        }

        if (actionId === 'okey') {
            confirmarAlertaOkeySistema(extra);
            return;
        }

        if ((extra.monarcaAlertTipo === 'quest' || (!extra.monarcaAlertTipo && extra.questId)) && extra.questId && typeof window.emitirAlertaQuestActivada === 'function' && window.APP_STATE) {
            var q = (APP_STATE.questsDiarios || []).find(function(item) { return item && String(item.id) === String(extra.questId); });
            if (q) {
                window.emitirAlertaQuestActivada(q, false);
                return;
            }
        }

        abrirCentroNotificaciones();
    } catch(e) {
        console.warn('[Notificaciones Monarca Acción]', e);
    }
}

function inicializarPuenteNotificacionesTelefono() {
    if (_MONARCA_PUENTE_NOTIFS_INICIADO || typeof window === 'undefined') return;
    _MONARCA_PUENTE_NOTIFS_INICIADO = true;

    asegurarCanalYAccionesNotifMonarca();

    var plugins = (window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins : null;
    var ln = plugins ? plugins.LocalNotifications : null;
    if (ln && typeof ln.addListener === 'function') {
        try {
            ln.addListener('localNotificationActionPerformed', function(event) {
                manejarAccionNotificacionTelefono(event);
            });
        } catch(e) {}
        try {
            ln.addListener('localNotificationReceived', function() {
                if (typeof window.verificarDisparadoresCalendario === 'function') {
                    window.verificarDisparadoresCalendario();
                } else if (typeof actualizarBadgeNotificaciones === 'function') {
                    actualizarBadgeNotificaciones();
                }
                var modal = document.getElementById('modal-centro-notificaciones');
                if (modal && modal.style.display === 'flex' && typeof renderizarCentroNotificaciones === 'function') {
                    renderizarCentroNotificaciones();
                }
            });
        } catch(e) {}
    }

    if (typeof navigator !== 'undefined' && navigator.serviceWorker && typeof navigator.serviceWorker.addEventListener === 'function') {
        try {
            navigator.serviceWorker.addEventListener('message', function(ev) {
                var data = ev && ev.data;
                if (data && data.type === 'MONARCA_NOTIF_ACTION') {
                    manejarAccionNotificacionTelefono({
                        actionId: data.actionId || 'tap',
                        notification: { extra: data.extra || {} }
                    });
                }
            });
        } catch(e) {}
    }
}

function despacharNotificacionesTelefonoSiNuevas(alertas) {
    try {
        inicializarPuenteNotificacionesTelefono();
        var lista = Array.isArray(alertas) ? alertas : [];
        var reg = _cargarRegistroNotifsTelefono();
        var plugins = (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins : null;
        var ln = plugins ? plugins.LocalNotifications : null;

        // 1. Limpiar de la barra del teléfono alertas que ya no están activas (ej. sincronizadas desde otro dispositivo)
        var activasAhoraMap = {};
        lista.forEach(function(a) {
            if (a && a.id) {
                activasAhoraMap[String(a.id)] = obtenerIdNumericoNotifMonarca(a.id);
            }
        });
        var idsParaLimpiar = [];
        Object.keys(reg.activeAlertIds || {}).forEach(function(prevAlertId) {
            if (!activasAhoraMap[prevAlertId]) {
                var prevNumId = Number(reg.activeAlertIds[prevAlertId]) || obtenerIdNumericoNotifMonarca(prevAlertId);
                idsParaLimpiar.push({ id: prevNumId });
                delete reg.activeAlertIds[prevAlertId];
                Object.keys(reg.keys || {}).forEach(function(k) {
                    if (k === prevAlertId || k.indexOf(prevAlertId + '@') === 0) {
                        delete reg.keys[k];
                    }
                });
            }
        });
        if (idsParaLimpiar.length > 0 && ln) {
            try {
                if (typeof ln.cancel === 'function') ln.cancel({ notifications: idsParaLimpiar }).catch(function() {});
                if (typeof ln.removeDeliveredNotifications === 'function') ln.removeDeliveredNotifications({ notifications: idsParaLimpiar }).catch(function() {});
            } catch(e) {}
        }

        // 2. Enviar al teléfono todas las alertas nuevas aún no despachadas
        var ahora = Date.now();
        var loteNativo = [];
        var loteWeb = [];

        lista.forEach(function(a) {
            if (!a || !a.id) return;
            var alertId = String(a.id);
            var idNum = obtenerIdNumericoNotifMonarca(alertId);
            var dKey = String(a._dispatchKey || (alertId + '@' + (a._sortTs || a.titulo || '')));

            reg.activeAlertIds[alertId] = idNum;
            var previa = reg.keys[dKey];
            if (previa) {
                // Si ya se despachó o si Capacitor ya la programó como alarma futura exacta, no duplicar
                if (!previa.futureAt || ln) {
                    return;
                }
            }

            reg.keys[dKey] = { idNum: idNum, ts: ahora };

            var titulo = (a.icono ? (a.icono + ' ') : '🔔 ') + (a.titulo || 'Notificación Monarca');
            var partesCuerpo = [];
            if (a.metaLinea) partesCuerpo.push(a.metaLinea);
            if (a.descripcion && a.descripcion !== a.metaLinea) partesCuerpo.push(a.descripcion);
            var cuerpo = partesCuerpo.join(' · ') || 'Pulsa ✓ Okey para confirmar.';

            var extraMeta = Object.assign({
                monarcaAlertId: alertId,
                monarcaAlertTipo: (a._phoneMeta && a._phoneMeta.monarcaAlertTipo) || a.tipo || 'general',
                autopcNotifId: a.autopcNotifId || null,
                calId: a.calId || null,
                questId: a.questId || null,
                dueMs: a._sortTs || ahora,
                dispatchKey: dKey
            }, a._phoneMeta || {});

            if (ln && typeof ln.schedule === 'function') {
                loteNativo.push({
                    id: idNum,
                    title: titulo,
                    body: cuerpo,
                    channelId: 'monarca_alerts_channel',
                    actionTypeId: 'MONARCA_ALERT_OKEY',
                    autoCancel: true,
                    extra: extraMeta
                });
            } else {
                loteWeb.push({ id: alertId, titulo: titulo, cuerpo: cuerpo, extra: extraMeta });
            }
        });

        _guardarRegistroNotifsTelefono(reg);

        if (loteNativo.length > 0 && ln && typeof ln.schedule === 'function') {
            if (_MONARCA_CANAL_LISTO) {
                ln.schedule({ notifications: loteNativo }).catch(function(err) {
                    console.warn('[LocalNotifications Schedule]', err);
                });
            } else {
                asegurarCanalYAccionesNotifMonarca().then(function() {
                    return ln.schedule({ notifications: loteNativo });
                }).catch(function(err) {
                    console.warn('[LocalNotifications Schedule]', err);
                });
            }
        } else if (loteWeb.length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            loteWeb.forEach(function(item) {
                try {
                    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
                        navigator.serviceWorker.ready.then(function(swReg) {
                            return swReg.showNotification(item.titulo, {
                                body: item.cuerpo,
                                icon: 'icons/icon-192.png',
                                badge: 'icons/icon-192.png',
                                tag: item.id,
                                renotify: true,
                                data: item.extra,
                                actions: [{ action: 'okey', title: '✓ Okey' }]
                            });
                        }).catch(function() {
                            try {
                                var nFallback = new Notification(item.titulo, {
                                    body: item.cuerpo,
                                    icon: 'icons/icon-192.png',
                                    tag: item.id
                                });
                                nFallback.onclick = function() {
                                    try { window.focus(); } catch(e) {}
                                    abrirCentroNotificaciones();
                                };
                            } catch(e2) {}
                        });
                    } else {
                        var nWeb = new Notification(item.titulo, {
                            body: item.cuerpo,
                            icon: 'icons/icon-192.png',
                            tag: item.id
                        });
                        nWeb.onclick = function() {
                            try { window.focus(); } catch(e) {}
                            abrirCentroNotificaciones();
                        };
                    }
                } catch(e) {}
            });
        }
    } catch(e) {
        console.warn('[Despacho Teléfono]', e);
    }
}

function abrirCentroNotificaciones() {
    var modal = document.getElementById('modal-centro-notificaciones');
    if (!modal) return;
    modal.style.display = 'flex';
    renderizarCentroNotificaciones();
    actualizarBadgeNotificaciones();
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
    var combinadas = [];
    var fuentes = [
        window.obtenerAlertasAutoPCActivas,
        window.obtenerAlertasCalendarioActivas,
        window.obtenerAlertasQuestsActivas,
        obtenerAlertasGeneralesActivas
    ];
    fuentes.forEach(function(fn) {
        if (typeof fn === 'function') {
            try {
                var res = fn() || [];
                if (Array.isArray(res) && res.length > 0) {
                    combinadas = combinadas.concat(res);
                }
            } catch(e) {
                console.warn('[Alertas Sistema Monarca]', e);
            }
        }
    });

    var vistos = {};
    return combinadas.filter(function(a) {
        if (!a || !a.id) return false;
        var k = String(a.id);
        if (vistos[k]) return false;
        vistos[k] = true;
        return true;
    });
}

function renderizarCentroNotificaciones() {
    var cont = document.getElementById('contenedor-alertas-notificaciones');
    var txtResumen = document.getElementById('texto-resumen-alertas');
    var btnLimpiarAutoPC = document.getElementById('btn-limpiar-notifs-autopc');
    var btnOkeyTodas = document.getElementById('btn-okey-todas-notifs');
    if (!cont) return;

    var alertas = obtenerAlertasSistemaMonarca();
    var countAutoPC = alertas.filter(function(a) { return a && a.tipo === 'autopc'; }).length;
    if (btnOkeyTodas) {
        btnOkeyTodas.style.display = alertas.length >= 2 ? 'inline-flex' : 'none';
        if (btnLimpiarAutoPC) {
            btnLimpiarAutoPC.style.display = (alertas.length < 2 && countAutoPC >= 2) ? 'inline-flex' : 'none';
        }
    } else if (btnLimpiarAutoPC) {
        btnLimpiarAutoPC.style.display = countAutoPC >= 2 ? 'inline-flex' : 'none';
    }

    if (txtResumen) {
        txtResumen.textContent = alertas.length + (alertas.length === 1 ? ' notificación activa' : ' notificaciones activas');
    }

    var html = '';
    if (alertas.length === 0) {
        html += '<div style="text-align: center; padding: 28px 16px; color: #94a3b8;">' +
            '<div style="font-size: 32px; margin-bottom: 8px;">✨</div>' +
            '<div style="font-weight: 700; font-size: 14px; color: #f8fafc; margin-bottom: 4px;">Todo al día</div>' +
            '<div style="font-size: 12px;">No tienes recordatorios pendientes ni avisos activos.</div>' +
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

            html += '<div data-alerta-id="' + monarcaEscHtml(a.id) + '" style="background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.09); border-left: 3px solid ' + (a.color || '#f59e0b') + '; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">' +
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
        var alertas = obtenerAlertasSistemaMonarca();
        despacharNotificacionesTelefonoSiNuevas(alertas);

        var badge = document.getElementById('hud-badge-notificaciones');
        if (!badge) return;
        if (alertas.length > 0) {
            badge.textContent = alertas.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch(e) {}
}

if (typeof window !== 'undefined') {
    window.obtenerIdNumericoNotifMonarca = obtenerIdNumericoNotifMonarca;
    window.asegurarCanalYAccionesNotifMonarca = asegurarCanalYAccionesNotifMonarca;
    window.registrarNotifProgramadaTelefono = registrarNotifProgramadaTelefono;
    window.cancelarNotificacionTelefonoPorAlerta = cancelarNotificacionTelefonoPorAlerta;
    window.registrarAlertaGeneralMonarca = registrarAlertaGeneralMonarca;
    window.descartarAlertaGeneralMonarca = descartarAlertaGeneralMonarca;
    window.confirmarAlertaOkeySistema = confirmarAlertaOkeySistema;
    window.confirmarTodasAlertasOkeySistema = confirmarTodasAlertasOkeySistema;
    window.manejarAccionNotificacionTelefono = manejarAccionNotificacionTelefono;

    window.addEventListener('DOMContentLoaded', function() {
        inicializarPuenteNotificacionesTelefono();
    });
    window.addEventListener('load', function() {
        inicializarPuenteNotificacionesTelefono();
        setTimeout(function() {
            actualizarBadgeNotificaciones();
        }, 1200);
    });
}




