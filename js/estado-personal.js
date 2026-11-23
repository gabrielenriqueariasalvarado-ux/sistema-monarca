/**
 * SISTEMA MONARCA · MÓDULO DE ESTADO PERSONAL
 * Monitoreo Milimétrico: Esquema Anatómico SVG en escala de grises, Desglose de Cuerpo y Mente.
 */

var METADATOS_MUSCULOS = {
    "mente": { nombre: "Mente & Concentración", icono: "🧠", region: "Sistema Neural · Cabeza", descanso: "Descanso mental, desconexión profunda y sueño reparador." },
    "delt_ant": { nombre: "Deltoides Anterior (Frontal)", icono: "🛡️", region: "Hombros · Tren Superior", descanso: "Reducir empujes y movimientos verticales." },
    "delt_lat": { nombre: "Deltoides Lateral (Anchura)", icono: "🛡️", region: "Hombros · Tren Superior", descanso: "Limitar elevaciones laterales y presses." },
    "delt_post": { nombre: "Deltoides Posterior (Dorsal)", icono: "🛡️", region: "Hombros · Tren Superior", descanso: "Descansar jalones traseros y aperturas invertidas." },
    "manguito": { nombre: "Manguito Rotador", icono: "🔄", region: "Hombros · Estabilizadores", descanso: "Evitar sobrecargas articulares pesadas." },
    "pect_mayor": { nombre: "Pectoral Mayor", icono: "⚔️", region: "Pecho · Tren Superior", descanso: "Óptimo descansar 48 hrs tras press pesado." },
    "pect_menor": { nombre: "Pectoral Menor", icono: "⚔️", region: "Pecho · Tren Superior", descanso: "Realizar estiramientos suaves de apertura torácica." },
    "biceps": { nombre: "Bíceps Braquial", icono: "💪", region: "Brazos · Flexores", descanso: "Descansar curls y flexiones de codo intensas." },
    "triceps": { nombre: "Tríceps Braquial", icono: "💪", region: "Brazos · Extensores", descanso: "Reducir fondos y extensiones de tríceps." },
    "antebrazos": { nombre: "Antebrazos & Agarre", icono: "✊", region: "Brazos · Agarre y Muñecas", descanso: "Masajear flexores y estirar dedos y muñecas." },
    "trapecios": { nombre: "Trapecios y Romboides", icono: "🦅", region: "Espalda Superior · Cuello", descanso: "Liberar tensión cervical y postura de hombros." },
    "dorsales": { nombre: "Dorsales & Redondos", icono: "🦅", region: "Espalda Media · Anchura V", descanso: "Descansar dominadas y jalones pesados." },
    "lumbares": { nombre: "Erectores Espinales (Lumbar)", icono: "🏛️", region: "Espalda Baja · Núcleo", descanso: "Evitar cargas axiales de peso muerto y sentadilla." },
    "core": { nombre: "Core (Abdomen & Oblicuos)", icono: "⚡", region: "Centro de Estabilidad", descanso: "Descansar flexiones de tronco e isométricos." },
    "gluteos": { nombre: "Glúteos (Mayor & Medio)", icono: "🍑", region: "Cadera & Tren Inferior", descanso: "Estirar flexores de cadera y movilidad." },
    "cadera": { nombre: "Cadera / Aductores", icono: "🥋", region: "Pelvis · Estabilidad", descanso: "Movilidad articular profunda y estiramiento." },
    "cuadriceps": { nombre: "Cuádriceps", icono: "🦵", region: "Muslos · Tren Inferior", descanso: "Hidratar cuádriceps tras sesiones de sentadilla." },
    "isquios": { nombre: "Isquiotibiales", icono: "🦵", region: "Cadena Posterior · Piernas", descanso: "Estiramiento suave de cadena posterior y descanso." },
    "pantorrillas": { nombre: "Pantorrillas (Gemelos & Sóleo)", icono: "🦶", region: "Piernas Bajas & Tobillos", descanso: "Movilidad de tobillos y elevaciones suaves." },
    "cuello": { nombre: "Cuello & Zona Cervical", icono: "🧘", region: "Salud Articular · Columna", descanso: "Estiramientos cervicales suaves y corrección postural." },
    "articulaciones": { nombre: "Muñecas & Tobillos", icono: "🔄", region: "Salud Articular & Movilidad", descanso: "Rotaciones articulares y descompresión de tendones." }
};

var MUSCULO_ACTIVO_HEATMAP = "pect_mayor";

// ==========================================================================
// MODELOS DE DATOS: 🟢 1. CUERPO Y 🔵 2. MENTE
// ==========================================================================

var DESGLOSE_ANATOMICO_CUERPO = [
    {
        categoria: "Tren Superior · Pecho",
        icono: "⚔️",
        subpartes: [
            {
                clave: "pect_superior",
                nombre: "Pectoral Superior (Haz Clavicular)",
                clavesFatiga: ["pect_mayor"]
            },
            {
                clave: "pect_medio",
                nombre: "Pectoral Medio (Haz Esternal)",
                clavesFatiga: ["pect_mayor"]
            },
            {
                clave: "pect_inferior",
                nombre: "Pectoral Inferior (Haz Abdominal)",
                clavesFatiga: ["pect_menor"]
            },
            {
                clave: "dorsales",
                nombre: "Dorsales (Latissimus Dorsi)",
                clavesFatiga: ["dorsales"]
            }
        ]
    },
    {
        categoria: "Hombros & Deltoides",
        icono: "🛡️",
        subpartes: [
            {
                clave: "delt_ant",
                nombre: "Deltoides Anterior (Cabeza Frontal)",
                clavesFatiga: ["delt_ant"]
            },
            {
                clave: "delt_lat",
                nombre: "Deltoides Lateral (Cabeza Media)",
                clavesFatiga: ["delt_lat"]
            },
            {
                clave: "delt_post",
                nombre: "Deltoides Posterior (Cabeza Dorsal)",
                clavesFatiga: ["delt_post"]
            },
            {
                clave: "manguito",
                nombre: "Manguito Rotador (Estabilizadores)",
                clavesFatiga: ["manguito"]
            }
        ]
    },
    {
        categoria: "Brazos (Flexores y Extensores)",
        icono: "💪",
        subpartes: [
            {
                clave: "biceps",
                nombre: "Bíceps Braquial (Cabeza Corta & Larga)",
                clavesFatiga: ["biceps"]
            },
            {
                clave: "triceps",
                nombre: "Tríceps Braquial (3 Cabezas)",
                clavesFatiga: ["triceps"]
            },
            {
                clave: "antebrazos",
                nombre: "Antebrazos y Fuerza de Agarre",
                clavesFatiga: ["antebrazos"]
            }
        ]
    },
    {
        categoria: "Zona Media y Espalda",
        icono: "⚡",
        subpartes: [
            {
                clave: "core",
                nombre: "Recto Abdominal & Oblicuos",
                clavesFatiga: ["core"]
            },
            {
                clave: "cadera",
                nombre: "Cadera, Aductores y Flexores",
                clavesFatiga: ["cadera"]
            },
            {
                clave: "trapecios",
                nombre: "Trapecios y Romboides (Densidad Espalda Alta)",
                clavesFatiga: ["trapecios"]
            },
            {
                clave: "lumbares",
                nombre: "Erectores Espinales (Lumbares)",
                clavesFatiga: ["lumbares"]
            }
        ]
    },
    {
        categoria: "Tren Inferior (Piernas)",
        icono: "🦵",
        subpartes: [
            {
                clave: "cuadriceps",
                nombre: "Cuádriceps (Recto Femoral & Vastos)",
                clavesFatiga: ["cuadriceps"]
            },
            {
                clave: "isquios",
                nombre: "Isquiotibiales / Femorales",
                clavesFatiga: ["isquios"]
            },
            {
                clave: "gluteos",
                nombre: "Glúteos (Mayor & Medio)",
                clavesFatiga: ["gluteos"]
            },
            {
                clave: "pantorrillas",
                nombre: "Pantorrillas (Gemelos & Sóleo)",
                clavesFatiga: ["pantorrillas"]
            }
        ]
    },
    {
        categoria: "Salud Articular y Postural",
        icono: "🧘",
        subpartes: [
            {
                clave: "cuello",
                nombre: "Cuello y Estabilidad Cervical",
                clavesFatiga: ["cuello"]
            },
            {
                clave: "articulaciones",
                nombre: "Movilidad de Muñecas, Codos y Tobillos",
                clavesFatiga: ["articulaciones"]
            }
        ]
    }
];

var DESGLOSE_COGNITIVO_MENTE = [
    {
        categoria: "Inteligencia y Cognición",
        area: "Inteligencia y Cognición",
        icono: "🧠",
        subpartes: [
            { clave: "memoria", nombre: "Memoria y Retención" },
            { clave: "procesamiento", nombre: "Velocidad de Procesamiento y Análisis" },
            { clave: "conocimiento", nombre: "Adquisición de Conocimiento" }
        ]
    },
    {
        categoria: "Creatividad e Innovación",
        area: "Creatividad e Innovación",
        icono: "💡",
        subpartes: [
            { clave: "pensamiento_lateral", nombre: "Pensamiento Lateral y Originalidad" },
            { clave: "diseno_expresion", nombre: "Diseño y Expresión" }
        ]
    },
    {
        categoria: "Voluntad y Disciplina (Fuerza Mental)",
        area: "Voluntad y Disciplina (Fuerza Mental)",
        icono: "🛡️",
        subpartes: [
            { clave: "enfoque", nombre: "Enfoque y Atención Sostenida" },
            { clave: "gratificacion", nombre: "Resistencia a la Gratificación Instantánea" },
            { clave: "resiliencia", nombre: "Resiliencia" }
        ]
    },
    {
        categoria: "Psicología e Influencia",
        area: "Psicología e Influencia",
        icono: "♟️",
        subpartes: [
            { clave: "microexpresiones", nombre: "Lectura No Verbal y Microexpresiones" },
            { clave: "persuasion", nombre: "Persuasión y Negociación Estratégica" },
            { clave: "control_emocional", nombre: "Dominio y Control Emocional" },
            { clave: "inteligencia_social", nombre: "Inteligencia Social y Dinámica de Poder" }
        ]
    },
    {
        categoria: "Recuperación y Claridad Mental",
        area: "Recuperación y Claridad Mental",
        icono: "🌙",
        subpartes: [
            { clave: "estres_desconexion", nombre: "Gestión de Estrés y Desconexión Profunda" },
            { clave: "claridad_decision", nombre: "Claridad en Toma de Decisiones y Cero Parálisis" }
        ]
    }
];

// Compatibilidad para módulos que leen atributos
DESGLOSE_COGNITIVO_MENTE.forEach(function(b) {
    b.atributos = b.subpartes;
});

// ==========================================================================
// ESTILOS EN ESCALA DE GRISES MINIMALISTA (Blanco -> Gris -> Oscuro)
// ==========================================================================

function obtenerEstiloFatigaGris(val) {
    var v = Math.min(100, Math.max(0, Number(val) || 0));
    if (v <= 15) {
        return {
            fill: '#151b2a',
            stroke: '#2d3748',
            label: '0-15% · Óptimo',
            levelText: 'Completamente fresco y listo para rendir',
            cardBg: '#0b0e15',
            cardBorder: 'rgba(255, 255, 255, 0.08)',
            cardText: '#f8fafc',
            cardVal: '#10b981',
            dot: '#10b981',
            color: '#10b981',
            bg: '#0b0e15',
            border: 'rgba(16, 185, 129, 0.3)',
            texto: '#10b981',
            clase: 'status-optimo'
        };
    }
    if (v <= 40) {
        return {
            fill: '#0369a1',
            stroke: '#38bdf8',
            label: '16-40% · Carga Leve',
            levelText: 'Carga ligera, óptimo para entrenar',
            cardBg: '#0b0e15',
            cardBorder: 'rgba(56, 189, 248, 0.25)',
            cardText: '#f8fafc',
            cardVal: '#38bdf8',
            dot: '#38bdf8',
            color: '#38bdf8',
            bg: '#0b0e15',
            border: 'rgba(56, 189, 248, 0.3)',
            texto: '#38bdf8',
            clase: 'status-activo'
        };
    }
    if (v <= 70) {
        return {
            fill: '#b45309',
            stroke: '#f59e0b',
            label: '41-70% · Fatiga Media',
            levelText: 'Fatiga media acumulada, técnica cuidada',
            cardBg: '#0b0e15',
            cardBorder: 'rgba(245, 158, 11, 0.25)',
            cardText: '#f8fafc',
            cardVal: '#f59e0b',
            dot: '#f59e0b',
            color: '#f59e0b',
            bg: '#0b0e15',
            border: 'rgba(245, 158, 11, 0.3)',
            texto: '#f59e0b',
            clase: 'status-moderado'
        };
    }
    return {
        fill: '#b91c1c',
        stroke: '#ef4444',
        label: '71-100% · Carga Alta',
        levelText: 'Sobrecarga elevada, se sugiere descanso',
        cardBg: '#0b0e15',
        cardBorder: 'rgba(239, 68, 68, 0.3)',
        cardText: '#f8fafc',
        cardVal: '#ef4444',
        dot: '#ef4444',
        color: '#ef4444',
        bg: '#0b0e15',
        border: 'rgba(239, 68, 68, 0.35)',
        texto: '#ef4444',
        clase: 'status-sobrecarga'
    };
}

function obtenerEstadoZona(valor) {
    return obtenerEstiloFatigaGris(valor);
}

// ==========================================================================
// CONTROL DE ESTADO Y RECUPERACIÓN DIARIA AUTOMÁTICA
// ==========================================================================

function asegurarDesgasteMente() {
    if (!APP_STATE.desgasteMente) APP_STATE.desgasteMente = {};

    var clavesMente = [
        "memoria", "procesamiento", "conocimiento",
        "pensamiento_lateral", "diseno_expresion",
        "enfoque", "gratificacion", "resiliencia",
        "microexpresiones", "persuasion", "control_emocional", "inteligencia_social",
        "estres_desconexion", "claridad_decision"
    ];

    clavesMente.forEach(function(k) {
        if (typeof APP_STATE.desgasteMente[k] === 'undefined' || APP_STATE.desgasteMente[k] === null) {
            APP_STATE.desgasteMente[k] = 0;
        }
    });
}

function calcularMetricasPurasSinActualizar() {
    var fatiga = APP_STATE.fatiga || {};

    // 1. Promedio Físico (Cuerpo)
    var sumaCuerpo = 0;
    var countCuerpo = 0;
    if (typeof DESGLOSE_ANATOMICO_CUERPO !== 'undefined') {
        DESGLOSE_ANATOMICO_CUERPO.forEach(function(cat) {
            cat.subpartes.forEach(function(sub) {
                var sumSub = 0;
                sub.clavesFatiga.forEach(function(k) {
                    sumSub += (Number(fatiga[k]) || 0);
                });
                var valSub = Math.round(sumSub / sub.clavesFatiga.length);
                sumaCuerpo += valSub;
                countCuerpo++;
            });
        });
    }
    var pctCuerpo = countCuerpo > 0 ? Math.round(sumaCuerpo / countCuerpo) : 0;

    // 2. Promedio Mental (Mente)
    asegurarDesgasteMente();
    var sumaMente = 0;
    var countMente = 0;
    if (typeof DESGLOSE_COGNITIVO_MENTE !== 'undefined') {
        DESGLOSE_COGNITIVO_MENTE.forEach(function(cat) {
            cat.subpartes.forEach(function(sub) {
                var valSub = (Number(APP_STATE.desgasteMente[sub.clave]) || 0);
                sumaMente += valSub;
                countMente++;
            });
        });
    }
    var pctMente = countMente > 0 ? Math.round(sumaMente / countMente) : (APP_STATE.fatigaMentalDiaria ? (APP_STATE.fatigaMentalDiaria.nivel || 0) : 0);

    // 3. Desgaste General Diario
    var pctGeneral = Math.round((pctCuerpo + pctMente) / 2);

    return {
        cuerpo: pctCuerpo,
        mente: pctMente,
        general: pctGeneral
    };
}

function actualizarDesgasteDiarioAutomatico(forzarReinicio) {
    var hoyStr = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : (function() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    })();

    if (!APP_STATE.desgasteDiario) {
        APP_STATE.desgasteDiario = {
            fecha: hoyStr,
            ultimoCierre: new Date().toLocaleDateString('es-ES')
        };
    }
    if (!APP_STATE.registroDiarioCalendario) {
        APP_STATE.registroDiarioCalendario = {};
    }

    asegurarDesgasteMente();

    var fechaRegistrada = APP_STATE.desgasteDiario.fecha;
    var cambioDeDia = fechaRegistrada !== hoyStr;

    // Si cambió de fecha respecto a la última registrada o se fuerza el reinicio manual
    if (cambioDeDia || forzarReinicio) {
        var fechaAnterior = fechaRegistrada || hoyStr;

        // 1. Guardar y archivar el porcentaje final alcanzado en la jornada saliente en el calendario
        var metricasPrevias = calcularMetricasPurasSinActualizar();
        
        APP_STATE.registroDiarioCalendario[fechaAnterior] = {
            general: metricasPrevias.general,
            cuerpo: metricasPrevias.cuerpo,
            mente: metricasPrevias.mente,
            fecha: fechaAnterior,
            cerrado: true,
            horaCierre: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };

        APP_STATE.desgasteDiario.ultimoCierre = fechaAnterior;
        APP_STATE.desgasteDiario.fecha = hoyStr;

        // 2. Reiniciar todo el desgaste físico (Cuerpo) estrictamente a 0%
        if (APP_STATE.fatiga) {
            Object.keys(APP_STATE.fatiga).forEach(function(k) {
                if (typeof APP_STATE.fatiga[k] === 'number') {
                    APP_STATE.fatiga[k] = 0;
                }
            });
            APP_STATE.fatiga.promedioHoy = 0;
            APP_STATE.fatiga.mente = 0;
        }

        // 3. Reiniciar todo el desgaste neural (Mente) estrictamente a 0%
        if (APP_STATE.desgasteMente) {
            Object.keys(APP_STATE.desgasteMente).forEach(function(k) {
                APP_STATE.desgasteMente[k] = 0;
            });
        }
        if (APP_STATE.fatigaMentalDiaria) {
            APP_STATE.fatigaMentalDiaria.nivel = 0;
            APP_STATE.fatigaMentalDiaria.estado = "Mente Despejada (0% Desgaste)";
            APP_STATE.fatigaMentalDiaria.ultimoDia = hoyStr;
        }

        // 4. Reiniciar Hábitos y Misiones Diarias a estado "Pendiente"
        if (APP_STATE.misiones && Array.isArray(APP_STATE.misiones)) {
            APP_STATE.misiones.forEach(function(m) {
                var freq = (m.frecuencia || 'Diaria').toString().toLowerCase();
                if (freq.indexOf('diari') !== -1 || freq === 'diaria') {
                    m.estado = 'Pendiente';
                }
            });
        }

        // 5. Reiniciar Quests Diarios (restituir tiempo y estado pendiente)
        if (APP_STATE.questsDiarios && Array.isArray(APP_STATE.questsDiarios)) {
            APP_STATE.questsDiarios.forEach(function(q) {
                q.estado = 'pendiente';
                q.temporizadorActivo = false;
                q.pospuestaHasta = null;
                q.ultimaActivacionFecha = null;
                var mins = Number(q.tiempoMinutos) || 15;
                q.tiempoRestante = (q.tipoTiempo === 'libre') ? 0 : mins * 60;
                q.fechaActualizacion = Date.now();
            });
        }

        // 6. Inicializar registro del nuevo día estrictamente en 0% en el calendario
        APP_STATE.registroDiarioCalendario[hoyStr] = {
            general: 0,
            cuerpo: 0,
            mente: 0,
            fecha: hoyStr,
            iniciado: true
        };

        MonarcaDB.save(APP_STATE, false);
        if (typeof programarAlarmasNativasQuests === 'function') {
            setTimeout(function() { programarAlarmasNativasQuests(); }, 150);
        }

        return {
            reiniciado: true,
            fechaAnterior: fechaAnterior,
            hoyStr: hoyStr,
            metricasCerradas: metricasPrevias,
            esManual: !!forzarReinicio
        };
    }

    return { reiniciado: false };
}

function calcularMetricasGeneralesDesgaste() {
    actualizarDesgasteDiarioAutomatico();
    var metricas = calcularMetricasPurasSinActualizar();

    // Guardar en tiempo real el porcentaje alcanzado hoy en el registro del calendario
    var hoyStr = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : (function() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    })();

    if (!APP_STATE.registroDiarioCalendario) APP_STATE.registroDiarioCalendario = {};
    
    var regExistente = APP_STATE.registroDiarioCalendario[hoyStr];
    // Solo actualizar si no fue sellado con un cierre previo en el mismo slot o si la métrica actual es válida
    if (!regExistente || !regExistente.cerrado || metricas.general >= (regExistente.general || 0)) {
        APP_STATE.registroDiarioCalendario[hoyStr] = {
            general: metricas.general,
            cuerpo: metricas.cuerpo,
            mente: metricas.mente,
            fecha: hoyStr,
            actualizado: new Date().toLocaleTimeString('es-ES')
        };
    }

    return metricas;
}

// ==========================================================================
// TIMER CONTINUO A MEDIANOCHE & MECÁNICA DE TRANSICIÓN DE JORNADA
// ==========================================================================

var _intervaloMonitorMedianoche = null;

function iniciarMonitorMedianocheDiaria() {
    if (_intervaloMonitorMedianoche) {
        clearInterval(_intervaloMonitorMedianoche);
    }

    function tickTimer() {
        var ahora = new Date();
        var hoyStr = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal(ahora) : (function() {
            return ahora.getFullYear() + '-' + String(ahora.getMonth() + 1).padStart(2, '0') + '-' + String(ahora.getDate()).padStart(2, '0');
        })();

        // 1. Detección inmediata de cruce de medianoche por fecha local
        if (APP_STATE && APP_STATE.desgasteDiario && APP_STATE.desgasteDiario.fecha && APP_STATE.desgasteDiario.fecha !== hoyStr) {
            ejecutarMecanicaTransicionMedianoche(false);
            return;
        }

        // 2. Cálculo milimétrico de tiempo restante hasta las 00:00:00 de mañana
        var medianoche = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 0, 0);
        var diffMs = medianoche.getTime() - ahora.getTime();

        if (diffMs <= 1000) {
            ejecutarMecanicaTransicionMedianoche(false);
            return;
        }

        var totalSeg = Math.floor(diffMs / 1000);
        var h = Math.floor(totalSeg / 3600);
        var m = Math.floor((totalSeg % 3600) / 60);
        var s = totalSeg % 60;

        var strTimer = String(h).padStart(2, '0') + "h " +
                       String(m).padStart(2, '0') + "m " +
                       String(s).padStart(2, '0') + "s";

        // Actualizar elementos en el DOM con la clase .reloj-cierre-jornada-tiempo
        var relojElems = document.querySelectorAll('.reloj-cierre-jornada-tiempo');
        for (var i = 0; i < relojElems.length; i++) {
            relojElems[i].textContent = strTimer;
        }

        // Actualizar barra de progreso de la jornada (0% a medianoche anterior, 100% a la siguiente)
        var segTranscurridos = (ahora.getHours() * 3600) + (ahora.getMinutes() * 60) + ahora.getSeconds();
        var pctJornada = Math.min(100, Math.max(0, Math.round((segTranscurridos / 86400) * 100)));
        var progressBars = document.querySelectorAll('.barra-jornada-progreso');
        for (var j = 0; j < progressBars.length; j++) {
            progressBars[j].style.width = pctJornada + '%';
        }
    }

    tickTimer();
    _intervaloMonitorMedianoche = setInterval(tickTimer, 1000);
}

// Escuchas automáticas de reactivación tras suspensión o cambio de pestaña
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
            if (APP_STATE && APP_STATE.desgasteDiario && APP_STATE.desgasteDiario.fecha !== hoy) {
                ejecutarMecanicaTransicionMedianoche(false);
            }
        }
    });
}
if (typeof window !== 'undefined') {
    window.addEventListener('focus', function() {
        var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
        if (APP_STATE && APP_STATE.desgasteDiario && APP_STATE.desgasteDiario.fecha !== hoy) {
            ejecutarMecanicaTransicionMedianoche(false);
        }
    });
}

function ejecutarMecanicaTransicionMedianoche(esManual) {
    var resultado = actualizarDesgasteDiarioAutomatico(esManual ? true : false);
    
    // Si no hubo cambio de día ni forzado manual, omitir
    if (!resultado || !resultado.reiniciado) return;

    // Refrescar todas las vistas de la aplicación
    if (typeof cargarEstadoPersonal === 'function') cargarEstadoPersonal();
    if (typeof renderizarCalendario === 'function') renderizarCalendario();
    if (typeof renderizarMisiones === 'function') renderizarMisiones(APP_STATE.misiones);
    if (typeof renderizarQuestsDiarios === 'function') renderizarQuestsDiarios();
    if (typeof renderizarJugador === 'function' && APP_STATE.jugador) renderizarJugador(APP_STATE.jugador);

    // Desplegar modal visual minimalista con el balance de la jornada cerrada
    abrirModalMecanicaNuevoDia(resultado);
}

function ejecutarMecanicaCierreDiarioManual() {
    var metricas = typeof calcularMetricasPurasSinActualizar === 'function' ? calcularMetricasPurasSinActualizar() : { general: 0, cuerpo: 0, mente: 0 };
    var textoConfirm = "¿Deseas cerrar la jornada actual ahora y comenzar un nuevo día?\n\n" +
        "• Porcentaje a archivar en el calendario: " + metricas.general + "% (Cuerpo: " + metricas.cuerpo + "%, Mente: " + metricas.mente + "%)\n" +
        "• Se restablecerá todo el desgaste del avatar estrictamente a 0%\n" +
        "• Los hábitos y misiones diarias volverán a iniciar en Pendiente para hoy.\n\n" +
        "¿Confirmar cierre de jornada?";

    if (confirm(textoConfirm)) {
        ejecutarMecanicaTransicionMedianoche(true);
    }
}

function reiniciarJornadaDiariaManual() {
    ejecutarMecanicaCierreDiarioManual();
}

function abrirModalMecanicaNuevoDia(datos) {
    var modal = document.getElementById('modal-mecanica-nuevo-dia');
    if (!modal) return;

    var tituloEl = document.getElementById('nuevo-dia-titulo-modal');
    var subtituloEl = document.getElementById('nuevo-dia-subtitulo-modal');
    var iconoEl = document.getElementById('nuevo-dia-icono-modal');
    var fechaEl = document.getElementById('nuevo-dia-fecha-archivada');
    var valGenEl = document.getElementById('nuevo-dia-val-general');
    var valCueEl = document.getElementById('nuevo-dia-val-cuerpo');
    var valMenEl = document.getElementById('nuevo-dia-val-mente');

    var esManual = datos && datos.esManual;
    var met = (datos && datos.metricasCerradas) || { general: 0, cuerpo: 0, mente: 0 };
    var fArchivada = (datos && datos.fechaAnterior) || 'Jornada anterior';

    if (tituloEl) tituloEl.textContent = esManual ? "JORNADA CERRADA ANTICIPADA" : "NUEVA JORNADA INICIADA";
    if (subtituloEl) subtituloEl.textContent = esManual ? "Cierre manual aplicado · Avatar listo en 0%" : "Reinicio automático a medianoche ejecutado";
    if (iconoEl) iconoEl.textContent = esManual ? "🌙" : "⏳";
    if (fechaEl) fechaEl.textContent = fArchivada;
    if (valGenEl) valGenEl.textContent = met.general + "%";
    if (valCueEl) valCueEl.textContent = met.cuerpo + "%";
    if (valMenEl) valMenEl.textContent = met.mente + "%";

    modal.style.display = 'flex';
}

function cerrarModalMecanicaNuevoDia() {
    var modal = document.getElementById('modal-mecanica-nuevo-dia');
    if (modal) modal.style.display = 'none';
}

// ==========================================================================
// CARGA PRINCIPAL DEL MÓDULO (PUNTO DE ENTRADA)
// ==========================================================================

function cargarEstadoPersonal() {
    if (!window.SECCION_EP_ACTIVA) {
        window.SECCION_EP_ACTIVA = 'desgaste';
    }

    actualizarDesgasteDiarioAutomatico();
    renderizarGraficoGeneralAvatar();
    renderizarDesgloseCuerpoAnatomico();
    renderizarDesgloseMenteCognitiva();
    iniciarMonitorMedianocheDiaria();

    // Nutrición & Descanso (renderizan sus tarjetas sin sobrescribir la silueta si no están activas)
    if (typeof inicializarNutricionYDescanso === 'function') inicializarNutricionYDescanso();
    if (typeof renderizarModuloNutricion === 'function') renderizarModuloNutricion();
    if (typeof renderizarModuloDescanso === 'function') renderizarModuloDescanso();

    if (typeof actualizarLlenadoSiluetaAvatar === 'function') {
        actualizarLlenadoSiluetaAvatar(window.SECCION_EP_ACTIVA);
    }

    actualizarGraficosRadarEstadoPersonal();
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(function() {
            actualizarGraficosRadarEstadoPersonal();
        });
    }
}

function renderizarBarrasFatiga(f) {
    cargarEstadoPersonal();
}

// ==========================================================================
// INTERACTIVIDAD HUD & MAPA DE CALOR SVG
// ==========================================================================

function actualizarHudMusculo(key, subclave) {
    var k = key || MUSCULO_ACTIVO_HEATMAP || 'pect_mayor';
    var metricas = calcularMetricasGeneralesDesgaste();
    var val = 0;
    var meta = null;

    if (k === 'mente') {
        var nombreMente = "Mente & Concentración";
        var valMente = metricas.mente;
        var regionMente = "SISTEMA NEURAL · COGNICIÓN";
        var descansoMente = "Descanso mental, desconexión profunda, meditación y sueño reparador.";

        if (subclave && APP_STATE.desgasteMente) {
            DESGLOSE_COGNITIVO_MENTE.forEach(function(bloque) {
                bloque.subpartes.forEach(function(sub) {
                    if (sub.clave === subclave) {
                        nombreMente = sub.nombre;
                        valMente = Number(APP_STATE.desgasteMente[subclave]) || 0;
                        regionMente = "MENTE · " + bloque.categoria.toUpperCase();
                    }
                });
            });
        }
        val = valMente;
        meta = {
            nombre: nombreMente,
            icono: "🧠",
            region: regionMente,
            descanso: descansoMente
        };
    } else {
        meta = METADATOS_MUSCULOS[k] || {
            nombre: k,
            icono: "💪",
            region: "ZONA CORPORAL",
            descanso: "Descanso muscular y recuperación adecuada."
        };
        val = Math.min(100, Math.max(0, Number(APP_STATE.fatiga && APP_STATE.fatiga[k]) || 0));
    }

    var estiloInfo = obtenerEstiloFatigaGris(val);
    var hudCont = document.getElementById('hud-panel-container');
    if (!hudCont) return;

    var gruposPrincipales = [
        { key: "pect_mayor", label: "Pecho" },
        { key: "dorsales", label: "Dorsales" },
        { key: "delt_ant", label: "Hombros" },
        { key: "biceps", label: "Bíceps" },
        { key: "triceps", label: "Tríceps" },
        { key: "antebrazos", label: "Antebrazos" },
        { key: "trapecios", label: "Trapecios" },
        { key: "lumbares", label: "Lumbares" },
        { key: "core", label: "Core" },
        { key: "cadera", label: "Cadera" },
        { key: "cuadriceps", label: "Cuádriceps" },
        { key: "isquios", label: "Isquios" },
        { key: "gluteos", label: "Glúteos" },
        { key: "pantorrillas", label: "Pantorrillas" },
        { key: "mente", label: "Mente" }
    ];

    var chipsHtml = '';
    gruposPrincipales.forEach(function(g) {
        var activo = (g.key === k) ? 'active' : '';
        chipsHtml += `<button class="hud-chip ${activo}" onclick="seleccionarMusculoHeatmap('${g.key}')">${g.label}</button>`;
    });

    hudCont.innerHTML = `
    <div class="hud-muscle-card" style="border-left: 4px solid ${estiloInfo.stroke || '#38bdf8'}; background: #121725; border-radius: 12px; padding: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08); border-right: 1px solid rgba(255, 255, 255, 0.08); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
        <div class="hud-muscle-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
            <span class="hud-muscle-region" style="font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px; text-transform: uppercase;">${meta.region}</span>
            <span class="subpart-card-status" style="font-size: 11px; font-weight: 700; white-space: nowrap; flex-shrink: 0; background: ${estiloInfo.bg || '#0b0e15'}; color: ${estiloInfo.color || '#38bdf8'}; padding: 3px 8px; border-radius: 6px; border: 1px solid ${estiloInfo.border || 'rgba(56, 189, 248, 0.3)'};">${estiloInfo.label}</span>
        </div>
        <h3 class="hud-muscle-title" style="margin: 6px 0 8px 0; font-size: 18px; font-weight: 800; color: #f8fafc;">${meta.icono} ${meta.nombre}</h3>
        <div class="hud-fatigue-big" style="font-size: 28px; font-weight: 800; color: #f8fafc; margin-bottom: 8px;">
            ${val}% <span style="font-size: 13px; font-weight: 600; color: #94a3b8;">Nivel de Desgaste</span>
        </div>
        <div class="hud-progress-track" style="width: 100%; height: 8px; background: #0b0e15; border-radius: 9999px; overflow: hidden; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.06);">
            <div class="hud-progress-fill" style="width: ${val}%; height: 100%; background: ${estiloInfo.stroke || '#38bdf8'}; border-radius: 9999px; transition: width 0.3s ease;"></div>
        </div>
        <div class="hud-recovery-tip" style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px; font-size: 12px; color: #cbd5e1; line-height: 1.45;">
            <strong style="color: #f8fafc;">Consejo de Recuperación:</strong> ${meta.descanso}
        </div>
    </div>
    <div style="margin-top: 14px;">
        <div class="hud-quick-chips-title" style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">Selección Rápida de Zona:</div>
        <div class="hud-quick-chips-grid">${chipsHtml}</div>
    </div>`;
}

function seleccionarMusculoHeatmap(key, subclave) {
    if (!key) return;
    MUSCULO_ACTIVO_HEATMAP = key;

    // Resaltar en SVG
    var allPaths = document.querySelectorAll('.muscle-zone-path');
    allPaths.forEach(function(p) {
        if (p.getAttribute('data-muscle') === key) {
            p.classList.add('selected-muscle');
        } else {
            p.classList.remove('selected-muscle');
        }
    });

    actualizarHudMusculo(key, subclave);

    // Resaltar tarjeta correspondiente
    var todasTarjetas = document.querySelectorAll('.subpart-compact-card');
    todasTarjetas.forEach(function(c) { c.classList.remove('selected-card'); });

    if (subclave) {
        var card = document.getElementById('card-subpart-' + subclave);
        if (card) card.classList.add('selected-card');
    } else {
        var cardDirecta = document.getElementById('card-subpart-' + key);
        if (cardDirecta) {
            cardDirecta.classList.add('selected-card');
        } else {
            var cardByData = document.querySelector(`.subpart-compact-card[data-target-muscle="${key}"]`);
            if (cardByData) cardByData.classList.add('selected-card');
        }
    }
}

// ==========================================================================
// RENDERIZADO DEL GRÁFICO GENERAL Y SILUETA ANATÓMICA
// ==========================================================================

function renderizarGraficoGeneralAvatar() {
    var cont = document.getElementById('hud-avatar-overview');
    if (!cont) return;

    var metricas = calcularMetricasGeneralesDesgaste();
    var estadoCuerpo = obtenerEstadoZona(metricas.cuerpo);
    var estadoMente = obtenerEstadoZona(metricas.mente);
    var fatiga = APP_STATE.fatiga || {};

    var hoyFechaStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
    hoyFechaStr = hoyFechaStr.charAt(0).toUpperCase() + hoyFechaStr.slice(1);

    function estilo(k) {
        var val = (k === 'mente') ? metricas.mente : (Number(fatiga[k]) || 0);
        var s = obtenerEstiloFatigaGris(val);
        return `fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.3"`;
    }

    var html = `
    <!-- 1. BARRA DE DESGASTE GENERAL DIARIO DEL AVATAR -->
    <div class="avatar-metrics-bar" style="margin-bottom: 16px; border-radius: 16px; background: #121725; border: 1px solid rgba(255, 255, 255, 0.09); box-shadow: 0 1px 4px rgba(0,0,0,0.03);">
        <div class="general-wear-metric">
            <div class="general-wear-circle" id="circle-general-wear" style="border: 3px solid #6366f1; color: #f8fafc; background: #0b0e15; box-shadow: 0 0 16px rgba(99, 102, 241, 0.3);">
                ${metricas.general}%
            </div>
            <div class="general-wear-meta">
                <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #f8fafc;">Desgaste General Diario del Avatar</h4>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8;">Diagnóstico biológico unificado: fatiga física, combustible e índice neural.</p>
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; margin-top: 3px;">
                    📅 ${hoyFechaStr} · <span style="color: #10b981; font-weight: 800;">● Sincronizado en tiempo real</span>
                </div>
            </div>
        </div>
        <div class="general-breakdown-chips">
            <div class="breakdown-chip" style="background: #0b0e15; border: 1px solid rgba(16, 185, 129, 0.3); color: #f8fafc;">
                <span style="color: #10b981;">🦾 Cuerpo:</span> <strong style="color: #10b981;">${metricas.cuerpo}%</strong> <span class="ep-breakdown-sub" style="font-size: 10.5px; color: #94a3b8;"><span class="ep-chip-sep">· </span>${estadoCuerpo.label}</span>
            </div>
            <div class="breakdown-chip" style="background: #0b0e15; border: 1px solid rgba(56, 189, 248, 0.3); color: #f8fafc;">
                <span style="color: #38bdf8;">🧠 Mente:</span> <strong style="color: #38bdf8;">${metricas.mente}%</strong> <span class="ep-breakdown-sub" style="font-size: 10.5px; color: #94a3b8;"><span class="ep-chip-sep">· </span>${estadoMente.label}</span>
            </div>
        </div>
    </div>

    <!-- ==========================================================================
         VISTA A: SILUETA DUAL COMPLETA PARA DESGASTE (ANTERIOR FRENTE & POSTERIOR ESPALDA)
         ========================================================================== -->
    <div id="avatar-vista-desgaste" class="card heatmap-dashboard-card" style="margin-bottom: 22px;">
        <div class="heatmap-header-row" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;">
            <div style="flex: 1 1 200px; min-width: 0;">
                <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #f8fafc;">📊 Carga &amp; Fatiga Física Diaria</h3>
                <p style="margin: 3px 0 0 0; font-size: 12px; color: #94a3b8;">Esquema frontal y dorsal por grupos musculares; toca cualquier zona para ver su detalle.</p>
            </div>
            <div class="heatmap-stat-cards" style="display: flex; gap: 10px; flex-wrap: wrap;">
                <div class="heatmap-stat-box">
                    <div style="font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">CARGA DE HOY</div>
                    <div style="font-size: 18px; font-weight: 800; color: #f8fafc; margin-top: 2px;">${metricas.cuerpo}%</div>
                </div>
                <div class="heatmap-stat-box">
                    <div style="font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">ÚLTIMO CIERRE</div>
                    <div style="font-size: 13px; font-weight: 700; color: #cbd5e1; margin-top: 2px;">${(APP_STATE.desgasteDiario && APP_STATE.desgasteDiario.ultimoCierre) ? APP_STATE.desgasteDiario.ultimoCierre : 'Registro activo'}</div>
                </div>
            </div>
        </div>

        <div class="heatmap-layout heatmap-layout--dual">
            <!-- COLUMNA 1: SILUETA ANATÓMICA DUAL (FRENTE Y ESPALDA) -->
            <div class="body-diagram-box">
                <div class="body-dual-labels">
                    <span class="body-side-pill"><span class="ep-side-full">ANTERIOR · FRENTE</span><span class="ep-side-compact">FRENTE</span></span>
                    <span class="body-side-pill"><span class="ep-side-full">POSTERIOR · ESPALDA</span><span class="ep-side-compact">ESPALDA</span></span>
                </div>

                <div class="body-diagram-svg-container">
                    <svg viewBox="52 10 336 306" class="body-silhouette-svg" aria-label="Silueta anatómica frontal y dorsal">
                        <defs>
                            <filter id="hud-glow-dual" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#111827" flood-opacity="0.35"/>
                            </filter>
                        </defs>

                        <!-- Separador sutil entre vista frontal y posterior -->
                        <line x1="220" y1="16" x2="220" y2="306" stroke="rgba(148, 163, 184, 0.16)" stroke-width="1" stroke-dasharray="3,4" />

                        <!-- SILUETA FRONTAL (X: 110 + 24 = 134 centro) -->
                        <g id="silueta-frontal" transform="translate(24, 0)">
                            <!-- Base anatómica de soporte (cuello y rodillas no interactivas) -->
                            <path d="M102 58 L118 58 L121 74 L99 74 Z" fill="#0e1422" stroke="#1e293b" stroke-width="1" style="pointer-events: none;" />
                            <ellipse cx="97" cy="247" rx="6" ry="5" fill="#0e1422" stroke="#1e293b" stroke-width="1" style="pointer-events: none;" />
                            <ellipse cx="123" cy="247" rx="6" ry="5" fill="#0e1422" stroke="#1e293b" stroke-width="1" style="pointer-events: none;" />
                            <!-- Cabeza / Mente -->
                            <ellipse cx="110" cy="38" rx="18" ry="22" ${estilo('mente')} class="muscle-zone-path" data-muscle="mente" onclick="seleccionarMusculoHeatmap('mente')"></ellipse>
                            
                            <!-- Hombros Deltoides Anterior -->
                            <path d="M84 66 C76 72 70 82 72 94 C76 96 86 94 90 82 C90 74 88 68 84 66 Z" ${estilo('delt_ant')} class="muscle-zone-path" data-muscle="delt_ant" onclick="seleccionarMusculoHeatmap('delt_ant')"></path>
                            <path d="M136 66 C144 72 150 82 148 94 C144 96 134 94 130 82 C130 74 132 68 136 66 Z" ${estilo('delt_ant')} class="muscle-zone-path" data-muscle="delt_ant" onclick="seleccionarMusculoHeatmap('delt_ant')"></path>
                            
                            <!-- Pectoral Mayor -->
                            <path d="M90 75 C96 73 108 73 109 76 L109 102 C100 104 88 98 86 90 C86 82 88 77 90 75 Z" ${estilo('pect_mayor')} class="muscle-zone-path" data-muscle="pect_mayor" onclick="seleccionarMusculoHeatmap('pect_mayor')"></path>
                            <path d="M130 75 C124 73 112 73 111 76 L111 102 C120 104 132 98 134 90 C134 82 132 77 130 75 Z" ${estilo('pect_mayor')} class="muscle-zone-path" data-muscle="pect_mayor" onclick="seleccionarMusculoHeatmap('pect_mayor')"></path>

                            <!-- Pectoral Menor / Inferior -->
                            <path d="M91 103 L108 103 L106 111 C98 113 93 109 91 103 Z" ${estilo('pect_menor')} class="muscle-zone-path" data-muscle="pect_menor" onclick="seleccionarMusculoHeatmap('pect_menor')"></path>
                            <path d="M129 103 L112 103 L114 111 C122 113 127 109 129 103 Z" ${estilo('pect_menor')} class="muscle-zone-path" data-muscle="pect_menor" onclick="seleccionarMusculoHeatmap('pect_menor')"></path>

                            <!-- Bíceps -->
                            <path d="M72 96 C68 108 68 120 72 132 C78 132 84 124 84 114 C84 104 80 97 72 96 Z" ${estilo('biceps')} class="muscle-zone-path" data-muscle="biceps" onclick="seleccionarMusculoHeatmap('biceps')"></path>
                            <path d="M148 96 C152 108 152 120 148 132 C142 132 136 124 136 114 C136 104 140 97 148 96 Z" ${estilo('biceps')} class="muscle-zone-path" data-muscle="biceps" onclick="seleccionarMusculoHeatmap('biceps')"></path>

                            <!-- Antebrazos Frontales -->
                            <path d="M72 134 C64 146 58 162 58 178 C64 182 72 176 74 164 C76 152 76 142 72 134 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                            <path d="M148 134 C156 146 162 162 162 178 C156 182 148 176 146 164 C144 152 144 142 148 134 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>

                            <!-- Core / Abdomen -->
                            <path d="M96 114 C104 112 116 112 124 114 C126 128 124 146 120 158 C114 162 106 162 100 158 C96 146 94 128 96 114 Z" ${estilo('core')} class="muscle-zone-path" data-muscle="core" onclick="seleccionarMusculoHeatmap('core')"></path>

                            <!-- Cadera / Aductores -->
                            <path d="M96 160 C104 164 116 164 124 160 C128 168 126 178 122 184 C116 186 104 186 98 184 C94 178 92 168 96 160 Z" ${estilo('cadera')} class="muscle-zone-path" data-muscle="cadera" onclick="seleccionarMusculoHeatmap('cadera')"></path>

                            <!-- Cuádriceps -->
                            <path d="M93 186 C98 186 106 186 107 194 L105 244 C98 244 90 236 88 220 C86 206 88 194 93 186 Z" ${estilo('cuadriceps')} class="muscle-zone-path" data-muscle="cuadriceps" onclick="seleccionarMusculoHeatmap('cuadriceps')"></path>
                            <path d="M127 186 C122 186 114 186 113 194 L115 244 C122 244 130 236 132 220 C134 206 132 194 127 186 Z" ${estilo('cuadriceps')} class="muscle-zone-path" data-muscle="cuadriceps" onclick="seleccionarMusculoHeatmap('cuadriceps')"></path>

                            <!-- Pantorrillas Frontales -->
                            <path d="M90 250 C96 250 102 250 103 260 L101 306 C96 308 92 306 90 298 C88 286 86 270 90 250 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                            <path d="M130 250 C124 250 118 250 117 260 L119 306 C124 308 128 306 130 298 C132 286 134 270 130 250 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                        </g>

                        <!-- SILUETA DORSAL (X: 330 - 24 = 306 centro) -->
                        <g id="silueta-dorsal" transform="translate(-24, 0)">
                            <!-- Base anatómica de soporte dorsal (cuello, rodillas y eje espinal no interactivos) -->
                            <path d="M322 56 L338 56 L341 64 L319 64 Z" fill="#0e1422" stroke="#1e293b" stroke-width="1" style="pointer-events: none;" />
                            <line x1="330" y1="74" x2="330" y2="164" stroke="rgba(148, 163, 184, 0.2)" stroke-width="1.2" stroke-dasharray="2,2" style="pointer-events: none;" />
                            <!-- Cabeza / Mente (Dorsal) -->
                            <ellipse cx="330" cy="38" rx="18" ry="22" ${estilo('mente')} class="muscle-zone-path" data-muscle="mente" onclick="seleccionarMusculoHeatmap('mente')"></ellipse>

                            <!-- Trapecios -->
                            <path d="M322 58 L338 58 L354 75 C344 86 336 94 330 96 C324 94 316 86 306 75 Z" ${estilo('trapecios')} class="muscle-zone-path" data-muscle="trapecios" onclick="seleccionarMusculoHeatmap('trapecios')"></path>

                            <!-- Deltoides Posterior -->
                            <path d="M304 68 C296 74 290 84 292 94 C298 96 306 92 310 82 Z" ${estilo('delt_post')} class="muscle-zone-path" data-muscle="delt_post" onclick="seleccionarMusculoHeatmap('delt_post')"></path>
                            <path d="M356 68 C364 74 370 84 368 94 C362 96 354 92 350 82 Z" ${estilo('delt_post')} class="muscle-zone-path" data-muscle="delt_post" onclick="seleccionarMusculoHeatmap('delt_post')"></path>

                            <!-- Tríceps -->
                            <path d="M292 96 C288 108 288 122 292 134 C298 134 304 126 304 116 C304 106 300 98 292 96 Z" ${estilo('triceps')} class="muscle-zone-path" data-muscle="triceps" onclick="seleccionarMusculoHeatmap('triceps')"></path>
                            <path d="M368 96 C372 108 372 122 368 134 C362 134 356 126 356 116 C356 106 360 98 368 96 Z" ${estilo('triceps')} class="muscle-zone-path" data-muscle="triceps" onclick="seleccionarMusculoHeatmap('triceps')"></path>

                            <!-- Dorsales (Lats) -->
                            <path d="M312 96 C320 94 340 94 348 96 C352 110 348 128 342 138 C334 140 326 140 318 138 C312 128 308 110 312 96 Z" ${estilo('dorsales')} class="muscle-zone-path" data-muscle="dorsales" onclick="seleccionarMusculoHeatmap('dorsales')"></path>

                            <!-- Lumbares -->
                            <path d="M320 138 C326 138 334 138 340 138 C342 148 340 158 338 164 C334 166 326 166 322 164 C320 158 318 148 320 138 Z" ${estilo('lumbares')} class="muscle-zone-path" data-muscle="lumbares" onclick="seleccionarMusculoHeatmap('lumbares')"></path>

                            <!-- Glúteos -->
                            <path d="M312 164 C322 164 329 166 329 178 C328 190 322 198 314 196 C306 192 304 180 312 164 Z" ${estilo('gluteos')} class="muscle-zone-path" data-muscle="gluteos" onclick="seleccionarMusculoHeatmap('gluteos')"></path>
                            <path d="M348 164 C338 164 331 166 331 178 C332 190 338 198 346 196 C354 192 356 180 348 164 Z" ${estilo('gluteos')} class="muscle-zone-path" data-muscle="gluteos" onclick="seleccionarMusculoHeatmap('gluteos')"></path>

                            <!-- Isquiotibiales -->
                            <path d="M312 198 C318 198 326 198 327 206 L325 246 C318 246 310 238 308 222 C306 210 308 202 312 198 Z" ${estilo('isquios')} class="muscle-zone-path" data-muscle="isquios" onclick="seleccionarMusculoHeatmap('isquios')"></path>
                            <path d="M348 198 C342 198 334 198 333 206 L335 246 C342 246 350 238 352 222 C354 210 352 202 348 198 Z" ${estilo('isquios')} class="muscle-zone-path" data-muscle="isquios" onclick="seleccionarMusculoHeatmap('isquios')"></path>

                            <!-- Pantorrillas Dorsales -->
                            <path d="M310 252 C318 252 322 254 323 264 L321 306 C316 308 312 306 310 298 C306 286 304 270 310 252 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                            <path d="M350 252 C342 252 338 254 337 264 L339 306 C344 308 348 306 350 298 C354 286 356 270 350 252 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>

                            <!-- Antebrazos Dorsales -->
                            <path d="M292 136 C284 148 278 164 278 180 C284 184 292 178 294 166 C296 154 296 144 292 136 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                            <path d="M368 136 C376 148 382 164 382 180 C376 184 368 178 366 166 C364 154 364 144 368 136 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                        </g>
                    </svg>
                </div>

                <!-- LEYENDA DEL MAPA DE CALOR MINIMALISTA -->
                <div class="heatmap-legend-box" style="margin-top: 10px; display: flex; justify-content: center; gap: 8px 12px; flex-wrap: wrap;">
                    <div class="legend-item" style="display: flex; align-items: center; gap: 5px; font-size: 11px; color: #94a3b8;">
                        <span class="legend-swatch" style="width: 12px; height: 12px; border-radius: 3px; display: inline-block; background: #151b2a; border: 1.5px solid #2d3748;"></span>
                        <span>0-15% Óptimo</span>
                    </div>
                    <div class="legend-item" style="display: flex; align-items: center; gap: 5px; font-size: 11px; color: #94a3b8;">
                        <span class="legend-swatch" style="width: 12px; height: 12px; border-radius: 3px; display: inline-block; background: #0369a1; border: 1.5px solid #38bdf8;"></span>
                        <span>16-40% Leve</span>
                    </div>
                    <div class="legend-item" style="display: flex; align-items: center; gap: 5px; font-size: 11px; color: #94a3b8;">
                        <span class="legend-swatch" style="width: 12px; height: 12px; border-radius: 3px; display: inline-block; background: #b45309; border: 1.5px solid #f59e0b;"></span>
                        <span>41-70% Media</span>
                    </div>
                    <div class="legend-item" style="display: flex; align-items: center; gap: 5px; font-size: 11px; color: #94a3b8;">
                        <span class="legend-swatch" style="width: 12px; height: 12px; border-radius: 3px; display: inline-block; background: #b91c1c; border: 1.5px solid #ef4444;"></span>
                        <span>71-100% Alta</span>
                    </div>
                </div>
            </div>

            <!-- COLUMNA 2: PANEL DE DETALLE HUD Y SELECTOR RÁPIDO DE MÚSCULOS -->
            <div class="heatmap-hud-panel" id="hud-panel-container">
                <!-- Se llena dinámicamente mediante actualizarHudMusculo -->
            </div>
        </div>
    </div>

    <!-- ==========================================================================
         VISTA B: SILUETA FRONTAL CON LLENADO VERTICAL DE PIES A CABEZA (AGUA & SUEÑO)
         ========================================================================== -->
    <div id="avatar-vista-fluid" class="card heatmap-dashboard-card" style="display: none; margin-bottom: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;">
            <div style="flex: 1 1 200px; min-width: 0;">
                <h3 id="avatar-tank-title" style="margin: 0; font-size: 16px; font-weight: 800; color: #f8fafc;">🦾 Bio-Monitor del Avatar · Cuerpo Completo</h3>
                <p id="avatar-tank-desc" style="margin: 3px 0 0 0; font-size: 12px; color: #94a3b8;">Silueta frontal interactiva: indicador vertical de nivel biológico de pies a cabeza.</p>
            </div>
            <div>
                <div id="avatar-tank-pill" style="display: inline-flex; align-items: center; gap: 8px; background: #0b0e15; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 6px 14px; box-shadow: 0 0 14px rgba(56, 189, 248, 0.2); transition: all 0.4s ease;">
                    <span id="avatar-tank-mode-icon" style="font-size: 16px;">⚡</span>
                    <div>
                        <div id="avatar-tank-label" style="font-size: 13px; font-weight: 800; color: #f8fafc; line-height: 1.1;">--% Nivel</div>
                        <div id="avatar-tank-sub" style="font-size: 10px; font-weight: 600; color: #94a3b8;">Métrica activa</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="heatmap-layout">
            <!-- COLUMNA 1: SILUETA FRONTAL CON ESCALA MÉTRICA Y LLENADO VERTICAL -->
            <div class="body-diagram-box" style="display: flex; flex-direction: column; align-items: center; padding: 14px 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; width: 100%; margin-bottom: 8px; padding: 0 4px;">
                    <span style="font-size: 11px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px;">ANTERIOR (FRENTE)</span>
                    <span id="avatar-tank-mode-badge" style="font-size: 10px; font-weight: 800; color: #38bdf8; background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.3); padding: 1px 7px; border-radius: 6px; white-space: nowrap;">TELEMETRÍA EN VIVO</span>
                </div>

                <div class="body-diagram-svg-container" style="width: 100%; max-width: 240px; position: relative;">
                    <svg viewBox="0 0 220 330" class="body-silhouette-svg" style="width: 100%; height: auto; display: block;">
                        <defs>
                            <filter id="hud-glow-fluid" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#111827" flood-opacity="0.35"/>
                            </filter>
                            <filter id="fluid-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2.5" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>

                            <!-- Gradiente Agua (Cian -> Azul Neón) -->
                            <linearGradient id="grad-avatar-agua" x1="0%" y1="100%" x2="0%" y2="0%">
                                <stop offset="0%" stop-color="#0284c7" stop-opacity="0.9" />
                                <stop offset="55%" stop-color="#06b6d4" stop-opacity="0.95" />
                                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.95" />
                            </linearGradient>

                            <!-- Gradiente Sueño (Índigo -> Púrpura Astral) -->
                            <linearGradient id="grad-avatar-sueno" x1="0%" y1="100%" x2="0%" y2="0%">
                                <stop offset="0%" stop-color="#4338ca" stop-opacity="0.9" />
                                <stop offset="55%" stop-color="#6366f1" stop-opacity="0.95" />
                                <stop offset="100%" stop-color="#a855f7" stop-opacity="0.95" />
                            </linearGradient>

                            <!-- ClipPath dinámico para el llenado vertical de pies a cabeza (Y=308 a Y=16) -->
                            <clipPath id="avatar-clip-fill">
                                <rect id="avatar-fill-rect" x="35" y="310" width="165" height="0" rx="3" style="transition: y 0.75s cubic-bezier(0.4, 0, 0.2, 1), height 0.75s cubic-bezier(0.4, 0, 0.2, 1);" />
                            </clipPath>
                        </defs>

                        <!-- ESCALA MÉTRICA LATERAL GRADUADA (0% a 100%) -->
                        <g id="avatar-escala-metrica" opacity="0.65">
                            <text x="26" y="20" font-size="7.5" fill="#64748b" text-anchor="end" font-family="monospace">100%</text>
                            <line x1="29" y1="18" x2="35" y2="18" stroke="#334155" stroke-width="1" />

                            <text x="26" y="93" font-size="7.5" fill="#64748b" text-anchor="end" font-family="monospace">75%</text>
                            <line x1="29" y1="91" x2="35" y2="91" stroke="#334155" stroke-width="1" />

                            <text x="26" y="166" font-size="7.5" fill="#64748b" text-anchor="end" font-family="monospace">50%</text>
                            <line x1="29" y1="164" x2="35" y2="164" stroke="#334155" stroke-width="1" />

                            <text x="26" y="239" font-size="7.5" fill="#64748b" text-anchor="end" font-family="monospace">25%</text>
                            <line x1="29" y1="237" x2="35" y2="237" stroke="#334155" stroke-width="1" />

                            <text x="26" y="310" font-size="7.5" fill="#64748b" text-anchor="end" font-family="monospace">0%</text>
                            <line x1="29" y1="308" x2="35" y2="308" stroke="#334155" stroke-width="1" />

                            <line x1="35" y1="18" x2="35" y2="308" stroke="#1e293b" stroke-width="1" stroke-dasharray="2,3" />
                        </g>

                        <!-- 1. CAPA BASE: SILUETA ANATÓMICA FRONTAL -->
                        <g id="silueta-frontal-base">
                            <ellipse cx="110" cy="38" rx="18" ry="22" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="mente" onclick="seleccionarMusculoHeatmap('mente')"></ellipse>
                            <path d="M84 66 C76 72 70 82 72 94 C76 96 86 94 90 82 C90 74 88 68 84 66 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="delt_ant" onclick="seleccionarMusculoHeatmap('delt_ant')"></path>
                            <path d="M136 66 C144 72 150 82 148 94 C144 96 134 94 130 82 C130 74 132 68 136 66 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="delt_ant" onclick="seleccionarMusculoHeatmap('delt_ant')"></path>
                            <path d="M90 75 C96 73 108 73 109 76 L109 102 C100 104 88 98 86 90 C86 82 88 77 90 75 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="pect_mayor" onclick="seleccionarMusculoHeatmap('pect_mayor')"></path>
                            <path d="M130 75 C124 73 112 73 111 76 L111 102 C120 104 132 98 134 90 C134 82 132 77 130 75 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="pect_mayor" onclick="seleccionarMusculoHeatmap('pect_mayor')"></path>
                            <path d="M91 103 L108 103 L106 111 C98 113 93 109 91 103 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="pect_menor" onclick="seleccionarMusculoHeatmap('pect_menor')"></path>
                            <path d="M129 103 L112 103 L114 111 C122 113 127 109 129 103 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="pect_menor" onclick="seleccionarMusculoHeatmap('pect_menor')"></path>
                            <path d="M72 96 C68 108 68 120 72 132 C78 132 84 124 84 114 C84 104 80 97 72 96 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="biceps" onclick="seleccionarMusculoHeatmap('biceps')"></path>
                            <path d="M148 96 C152 108 152 120 148 132 C142 132 136 124 136 114 C136 104 140 97 148 96 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="biceps" onclick="seleccionarMusculoHeatmap('biceps')"></path>
                            <path d="M72 134 C64 146 58 162 58 178 C64 182 72 176 74 164 C76 152 76 142 72 134 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                            <path d="M148 134 C156 146 162 162 162 178 C156 182 148 176 146 164 C144 152 144 142 148 134 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                            <path d="M96 114 C104 112 116 112 124 114 C126 128 124 146 120 158 C114 162 106 162 100 158 C96 146 94 128 96 114 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="core" onclick="seleccionarMusculoHeatmap('core')"></path>
                            <path d="M96 160 C104 164 116 164 124 160 C128 168 126 178 122 184 C116 186 104 186 98 184 C94 178 92 168 96 160 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="cadera" onclick="seleccionarMusculoHeatmap('cadera')"></path>
                            <path d="M93 186 C98 186 106 186 107 194 L105 244 C98 244 90 236 88 220 C86 206 88 194 93 186 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="cuadriceps" onclick="seleccionarMusculoHeatmap('cuadriceps')"></path>
                            <path d="M127 186 C122 186 114 186 113 194 L115 244 C122 244 130 236 132 220 C134 206 132 194 127 186 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="cuadriceps" onclick="seleccionarMusculoHeatmap('cuadriceps')"></path>
                            <path d="M90 250 C96 250 102 250 103 260 L101 306 C96 308 92 306 90 298 C88 286 86 270 90 250 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                            <path d="M130 250 C124 250 118 250 117 260 L119 306 C124 308 128 306 130 298 C132 286 134 270 130 250 Z" fill="#111827" stroke="#374151" stroke-width="1.2" class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                        </g>

                        <!-- 2. CAPA FLUIDA: LLENADO VERTICAL DESDE LOS PIES HACIA ARRIBA CON clip-path -->
                        <g id="avatar-fluid-layer" clip-path="url(#avatar-clip-fill)">
                            <ellipse cx="110" cy="38" rx="18" ry="22" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="mente" onclick="seleccionarMusculoHeatmap('mente')"></ellipse>
                            <path d="M84 66 C76 72 70 82 72 94 C76 96 86 94 90 82 C90 74 88 68 84 66 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="delt_ant" onclick="seleccionarMusculoHeatmap('delt_ant')"></path>
                            <path d="M136 66 C144 72 150 82 148 94 C144 96 134 94 130 82 C130 74 132 68 136 66 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="delt_ant" onclick="seleccionarMusculoHeatmap('delt_ant')"></path>
                            <path d="M90 75 C96 73 108 73 109 76 L109 102 C100 104 88 98 86 90 C86 82 88 77 90 75 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="pect_mayor" onclick="seleccionarMusculoHeatmap('pect_mayor')"></path>
                            <path d="M130 75 C124 73 112 73 111 76 L111 102 C120 104 132 98 134 90 C134 82 132 77 130 75 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="pect_mayor" onclick="seleccionarMusculoHeatmap('pect_mayor')"></path>
                            <path d="M91 103 L108 103 L106 111 C98 113 93 109 91 103 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="pect_menor" onclick="seleccionarMusculoHeatmap('pect_menor')"></path>
                            <path d="M129 103 L112 103 L114 111 C122 113 127 109 129 103 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="pect_menor" onclick="seleccionarMusculoHeatmap('pect_menor')"></path>
                            <path d="M72 96 C68 108 68 120 72 132 C78 132 84 124 84 114 C84 104 80 97 72 96 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="biceps" onclick="seleccionarMusculoHeatmap('biceps')"></path>
                            <path d="M148 96 C152 108 152 120 148 132 C142 132 136 124 136 114 C136 104 140 97 148 96 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="biceps" onclick="seleccionarMusculoHeatmap('biceps')"></path>
                            <path d="M72 134 C64 146 58 162 58 178 C64 182 72 176 74 164 C76 152 76 142 72 134 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                            <path d="M148 134 C156 146 162 162 162 178 C156 182 148 176 146 164 C144 152 144 142 148 134 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                            <path d="M96 114 C104 112 116 112 124 114 C126 128 124 146 120 158 C114 162 106 162 100 158 C96 146 94 128 96 114 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="core" onclick="seleccionarMusculoHeatmap('core')"></path>
                            <path d="M96 160 C104 164 116 164 124 160 C128 168 126 178 122 184 C116 186 104 186 98 184 C94 178 92 168 96 160 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="cadera" onclick="seleccionarMusculoHeatmap('cadera')"></path>
                            <path d="M93 186 C98 186 106 186 107 194 L105 244 C98 244 90 236 88 220 C86 206 88 194 93 186 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="cuadriceps" onclick="seleccionarMusculoHeatmap('cuadriceps')"></path>
                            <path d="M127 186 C122 186 114 186 113 194 L115 244 C122 244 130 236 132 220 C134 206 132 194 127 186 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="cuadriceps" onclick="seleccionarMusculoHeatmap('cuadriceps')"></path>
                            <path d="M90 250 C96 250 102 250 103 260 L101 306 C96 308 92 306 90 298 C88 286 86 270 90 250 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                            <path d="M130 250 C124 250 118 250 117 260 L119 306 C124 308 128 306 130 298 C132 286 134 270 130 250 Z" fill="url(#grad-avatar-agua)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                        </g>

                        <!-- 3. LÍNEA DE NIVEL BIOLUMINISCENTE EN LA SUPERFICIE -->
                        <line id="avatar-fluid-surface" x1="45" x2="175" y1="310" y2="310" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" opacity="0" filter="url(#fluid-glow)" style="transition: y1 0.75s cubic-bezier(0.4, 0, 0.2, 1), y2 0.75s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease;" />
                    </svg>
                </div>

                <!-- CHIPS DE ACCESO RÁPIDO A ZONAS MUSCULARES CLAVE -->
                <div style="margin-top: 14px; width: 100%;">
                    <div style="font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; text-align: center;">Zonas Anatómicas Clave:</div>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px;">
                        <button type="button" class="btn-zone-chip" onclick="seleccionarMusculoHeatmap('mente')" style="font-size: 10.5px; background: #0c1018; border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; padding: 3px 8px; border-radius: 6px; cursor: pointer;">🧠 Mente</button>
                        <button type="button" class="btn-zone-chip" onclick="seleccionarMusculoHeatmap('pect_mayor')" style="font-size: 10.5px; background: #0c1018; border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; padding: 3px 8px; border-radius: 6px; cursor: pointer;">Pectoral</button>
                        <button type="button" class="btn-zone-chip" onclick="seleccionarMusculoHeatmap('biceps')" style="font-size: 10.5px; background: #0c1018; border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; padding: 3px 8px; border-radius: 6px; cursor: pointer;">Bíceps</button>
                        <button type="button" class="btn-zone-chip" onclick="seleccionarMusculoHeatmap('core')" style="font-size: 10.5px; background: #0c1018; border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; padding: 3px 8px; border-radius: 6px; cursor: pointer;">Core</button>
                        <button type="button" class="btn-zone-chip" onclick="seleccionarMusculoHeatmap('cuadriceps')" style="font-size: 10.5px; background: #0c1018; border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; padding: 3px 8px; border-radius: 6px; cursor: pointer;">Cuádriceps</button>
                        <button type="button" class="btn-zone-chip" onclick="seleccionarMusculoHeatmap('dorsales')" style="font-size: 10.5px; background: #0c1018; border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; padding: 3px 8px; border-radius: 6px; cursor: pointer;">Espalda</button>
                        <button type="button" class="btn-zone-chip" onclick="seleccionarMusculoHeatmap('gluteos')" style="font-size: 10.5px; background: #0c1018; border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; padding: 3px 8px; border-radius: 6px; cursor: pointer;">Glúteos</button>
                    </div>
                </div>
            </div>

            <!-- COLUMNA 2: PANEL DE DETALLE HUD Y ACCIONES CONTEXTUALES FLUIDAS -->
            <div class="heatmap-hud-panel" id="hud-panel-container-fluid">
                <!-- Se llena dinámicamente con Ingesta Rápida o Descanso Rápido -->
            </div>
        </div>
    </div>`;

    cont.innerHTML = html;
    actualizarLlenadoSiluetaAvatar(window.SECCION_EP_ACTIVA || 'desgaste');
}

// ==========================================================================
// CONTROL DE VISTAS Y LLENADO DINÁMICO POR APARTADO (v10.43)
// ==========================================================================

function actualizarLlenadoSiluetaAvatar(seccion) {
    seccion = seccion || window.SECCION_EP_ACTIVA || 'desgaste';

    var vistaDesgaste = document.getElementById('avatar-vista-desgaste');
    var vistaFluid = document.getElementById('avatar-vista-fluid');

    // MODO 1: EN DESGASTE -> SILUETA DUAL COMPLETA (FRENTE Y ESPALDA)
    if (seccion === 'desgaste') {
        if (vistaDesgaste) vistaDesgaste.style.display = 'block';
        if (vistaFluid) vistaFluid.style.display = 'none';

        // Actualizar el inspector muscular de desgaste
        if (typeof actualizarHudMusculo === 'function') {
            actualizarHudMusculo(window.MUSCULO_ACTIVO_HEATMAP || 'pect_mayor');
        }
        return;
    }

    // MODO 2: EN NUTRICIÓN O DESCANSO -> SILUETA FRONTAL BIO-TANQUE CON LLENADO VERTICAL
    if (vistaDesgaste) vistaDesgaste.style.display = 'none';
    if (vistaFluid) vistaFluid.style.display = 'block';

    var pct = 0;
    var gradienteId = 'grad-avatar-agua';
    var strokeColor = '#06b6d4';
    var textoBadge = '';
    var subtextoBadge = '';
    var iconoModo = '💧';
    var tituloBox = '🥗 Hidratación & Nutrición · Combustible';
    var descBox = 'Nivel biológico de agua y aporte nutricional que nutre el cuerpo del avatar de abajo hacia arriba.';
    var badgeLabel = 'HIDRATACIÓN DIARIA';

    if (seccion === 'nutricion') {
        if (typeof inicializarNutricionYDescanso === 'function') inicializarNutricionYDescanso();
        var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
        var nut = APP_STATE.nutricion || {};
        var consumo = Number((nut.registrosAgua && nut.registrosAgua[hoy]) || 0);
        var metaAgua = Number(nut.metaAguaMl) || 2500;
        pct = Math.min(100, Math.max(0, Math.round((consumo / metaAgua) * 100)));
        gradienteId = 'grad-avatar-agua';
        strokeColor = '#06b6d4';
        iconoModo = '💧';
        textoBadge = pct + '% Hidratado';
        subtextoBadge = consumo.toLocaleString('es-ES') + ' ml / ' + metaAgua.toLocaleString('es-ES') + ' ml';
        tituloBox = '🥗 Hidratación & Nutrición · Combustible';
        descBox = 'Nivel biológico de agua y aporte nutricional que nutre el cuerpo del avatar de abajo hacia arriba.';
        badgeLabel = 'HIDRATACIÓN DIARIA';
    } else if (seccion === 'descanso') {
        if (typeof inicializarNutricionYDescanso === 'function') inicializarNutricionYDescanso();
        var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
        var sueno = APP_STATE.sueno || {};
        var regHoy = (sueno.registros || []).find(function(r) { return r.fecha === hoy; });
        var horas = regHoy ? Number(regHoy.horasDormidas) || 0 : 0;
        var metaSueno = Number(sueno.metaHoras) || 8;
        pct = Math.min(100, Math.max(0, Math.round((horas / metaSueno) * 100)));
        gradienteId = 'grad-avatar-sueno';
        strokeColor = '#818cf8';
        iconoModo = '🌙';
        textoBadge = pct + '% Regenerado';
        subtextoBadge = horas + 'h / ' + metaSueno + 'h meta diaria';
        tituloBox = '🌙 Descanso & Sueño · Regeneración Neural';
        descBox = 'Recuperación del sistema nervioso y reconstrucción de tejidos llenando el cuerpo en reposo.';
        badgeLabel = 'REGENERACIÓN NEURAL';
    }

    // Calcular posición Y en el SVG (Pies Y=308, Cabeza Y=16, Altura útil = 292)
    var pctClamped = Math.min(100, Math.max(0, pct));
    var yPies = 308;
    var alturaTotal = 292;
    var alturaLleno = (pctClamped / 100) * alturaTotal;
    var yLleno = yPies - alturaLleno;

    var rect = document.getElementById('avatar-fill-rect');
    if (rect) {
        rect.setAttribute('y', yLleno);
        rect.setAttribute('height', alturaLleno + 14);
    }

    var surf = document.getElementById('avatar-fluid-surface');
    if (surf) {
        if (pctClamped <= 0) {
            surf.setAttribute('opacity', '0');
        } else {
            surf.setAttribute('opacity', '0.9');
            surf.setAttribute('y1', yLleno);
            surf.setAttribute('y2', yLleno);
            surf.setAttribute('stroke', strokeColor);
        }
    }

    // Aplicar el gradiente activo a los paths de la capa fluida
    var capaFluida = document.getElementById('avatar-fluid-layer');
    if (capaFluida) {
        var paths = capaFluida.querySelectorAll('path, ellipse');
        for (var i = 0; i < paths.length; i++) {
            paths[i].setAttribute('fill', 'url(#' + gradienteId + ')');
        }
    }

    // Actualizar badges e indicadores
    var badgeIcono = document.getElementById('avatar-tank-mode-icon');
    var badgeTexto = document.getElementById('avatar-tank-label');
    var badgeSub = document.getElementById('avatar-tank-sub');
    var tankBadgePill = document.getElementById('avatar-tank-pill');
    var tankTitle = document.getElementById('avatar-tank-title');
    var tankDesc = document.getElementById('avatar-tank-desc');
    var modeBadge = document.getElementById('avatar-tank-mode-badge');

    if (badgeIcono) badgeIcono.textContent = iconoModo;
    if (badgeTexto) badgeTexto.textContent = textoBadge;
    if (badgeSub) badgeSub.textContent = subtextoBadge;
    if (tankTitle) tankTitle.textContent = tituloBox;
    if (tankDesc) tankDesc.textContent = descBox;
    if (modeBadge) {
        modeBadge.textContent = badgeLabel;
        modeBadge.style.color = strokeColor;
        modeBadge.style.borderColor = strokeColor + '55';
        modeBadge.style.background = strokeColor + '18';
    }
    if (tankBadgePill) {
        tankBadgePill.style.borderColor = strokeColor;
        tankBadgePill.style.boxShadow = '0 0 16px ' + strokeColor + '33';
    }

    // Actualizar el panel derecho contextual de Agua y Sueño
    actualizarPanelLateralAvatar(seccion);
}

function actualizarPanelLateralAvatar(seccion) {
    var contHud = document.getElementById('hud-panel-container-fluid');
    if (!contHud) return;

    if (seccion === 'nutricion') {
        if (typeof inicializarNutricionYDescanso === 'function') inicializarNutricionYDescanso();
        var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
        var nut = APP_STATE.nutricion || {};
        var consumo = Number((nut.registrosAgua && nut.registrosAgua[hoy]) || 0);
        var metaAgua = Number(nut.metaAguaMl) || 2500;
        var pctAgua = Math.min(100, Math.max(0, Math.round((consumo / metaAgua) * 100)));
        var comidasHoy = (nut.comidas || []).filter(function(c) { return c.fecha === hoy; });

        var htmlNut = `
        <div class="hud-muscle-card" style="border-left-color: #06b6d4; background: #0f1422;">
            <div class="hud-muscle-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-size: 10px; font-weight: 800; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.6px;">APARTADO ACTIVO · COMBUSTIBLE BIOLÓGICO</span>
                    <h3 class="hud-muscle-title" style="margin: 3px 0 0 0; color: #f8fafc; font-size: 16px;">💧 Hidratación & Nutrición del Avatar</h3>
                </div>
                <div style="font-size: 20px; font-weight: 800; color: #22d3ee; background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3); padding: 4px 10px; border-radius: 8px;">
                    ${pctAgua}%
                </div>
            </div>

            <div style="margin: 14px 0 16px 0; padding: 12px 14px; border-radius: 10px; background: #07090e; border: 1px solid rgba(255,255,255,0.06);">
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                    <span style="color: #94a3b8;">Nivel actual en el cuerpo:</span>
                    <strong style="color: #38bdf8;">${consumo.toLocaleString('es-ES')} / ${metaAgua.toLocaleString('es-ES')} ml</strong>
                </div>
                <div style="height: 8px; width: 100%; background: #151b2a; border-radius: 9999px; overflow: hidden;">
                    <div style="height: 100%; width: ${pctAgua}%; background: linear-gradient(90deg, #0284c7, #06b6d4, #38bdf8); border-radius: 9999px; transition: width 0.6s ease;"></div>
                </div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">
                    🍽️ Comidas hoy: <strong style="color: #f8fafc;">${comidasHoy.length}</strong> registradas
                </div>
            </div>

            <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Ingesta Rápida de Agua:</label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                    <button type="button" class="btn-quick-water" onclick="agregarAgua(250)" style="background: rgba(6,182,212,0.12); border: 1px solid rgba(6,182,212,0.3); color: #38bdf8; font-weight: 700; font-size: 11.5px; padding: 8px 4px; border-radius: 8px; cursor: pointer;">+250 ml</button>
                    <button type="button" class="btn-quick-water" onclick="agregarAgua(500)" style="background: rgba(6,182,212,0.18); border: 1px solid rgba(6,182,212,0.4); color: #38bdf8; font-weight: 700; font-size: 11.5px; padding: 8px 4px; border-radius: 8px; cursor: pointer;">+500 ml</button>
                    <button type="button" class="btn-quick-water" onclick="agregarAgua(1000)" style="background: rgba(6,182,212,0.25); border: 1px solid rgba(6,182,212,0.5); color: #22d3ee; font-weight: 700; font-size: 11.5px; padding: 8px 4px; border-radius: 8px; cursor: pointer;">+1,000 ml</button>
                </div>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 10px;">
                <button type="button" onclick="abrirModalRegistroComida()" style="flex: 1; background: #06b6d4; color: #08121f; font-weight: 800; font-size: 12px; padding: 9px 12px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <span>🥗</span> Registrar Comida
                </button>
                <button type="button" onclick="agregarAgua(-250)" title="Restar 250ml si te equivocaste" style="background: #0b0e15; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 12px; padding: 9px 12px; border-radius: 8px; cursor: pointer;">
                    -250 ml
                </button>
            </div>
        </div>`;
        contHud.innerHTML = htmlNut;
    } else if (seccion === 'descanso') {
        if (typeof inicializarNutricionYDescanso === 'function') inicializarNutricionYDescanso();
        var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
        var sueno = APP_STATE.sueno || {};
        var regHoy = (sueno.registros || []).find(function(r) { return r.fecha === hoy; });
        var horas = regHoy ? Number(regHoy.horasDormidas) || 0 : 0;
        var metaSueno = Number(sueno.metaHoras) || 8;
        var pctSueno = Math.min(100, Math.max(0, Math.round((horas / metaSueno) * 100)));
        var calidadStr = regHoy ? (regHoy.calidad === 'excelente' ? 'Óptima' : (regHoy.calidad === 'buena' ? 'Buena' : 'Ligera')) : 'Sin registrar';
        var bonoStr = regHoy ? (regHoy.calidad === 'excelente' ? '-15% Fatiga' : (regHoy.calidad === 'buena' ? '-10% Fatiga' : '-5% Fatiga')) : '0%';

        var htmlSue = `
        <div class="hud-muscle-card" style="border-left-color: #818cf8; background: #0f1422;">
            <div class="hud-muscle-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-size: 10px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.6px;">APARTADO ACTIVO · REGENERACIÓN NEURAL</span>
                    <h3 class="hud-muscle-title" style="margin: 3px 0 0 0; color: #f8fafc; font-size: 16px;">🌙 Descanso & Sueño del Avatar</h3>
                </div>
                <div style="font-size: 20px; font-weight: 800; color: #a5b4fc; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); padding: 4px 10px; border-radius: 8px;">
                    ${pctSueno}%
                </div>
            </div>

            <div style="margin: 14px 0 16px 0; padding: 12px 14px; border-radius: 10px; background: #07090e; border: 1px solid rgba(255,255,255,0.06);">
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                    <span style="color: #94a3b8;">Horas registradas anoche:</span>
                    <strong style="color: #a5b4fc;">${horas}h / ${metaSueno}h meta</strong>
                </div>
                <div style="height: 8px; width: 100%; background: #151b2a; border-radius: 9999px; overflow: hidden;">
                    <div style="height: 100%; width: ${pctSueno}%; background: linear-gradient(90deg, #4338ca, #6366f1, #a855f7); border-radius: 9999px; transition: width 0.6s ease;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-top: 8px;">
                    <span>Calidad: <strong style="color: #f8fafc;">${calidadStr}</strong></span>
                    <span>Bono Avatar: <strong style="color: #10b981;">${bonoStr}</strong></span>
                </div>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 10px;">
                <button type="button" onclick="abrirModalRegistroSueno()" style="flex: 1; background: #6366f1; color: #ffffff; font-weight: 800; font-size: 12px; padding: 9px 12px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <span>🌙</span> Registrar Descanso
                </button>
                <button type="button" onclick="cambiarSeccionEstadoPersonal('descanso')" style="background: #0b0e15; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 12px; padding: 9px 12px; border-radius: 8px; cursor: pointer;">
                    Ver Historial
                </button>
            </div>
        </div>`;
        contHud.innerHTML = htmlSue;
    }
}

// ==========================================================================
// TELEMETRÍA GRÁFICA INTERACTIVA CON CHART.JS & NAVEGACIÓN DE PESTAÑAS (v9.3)
// ==========================================================================

var CHART_RADAR_CUERPO = null;
var CHART_RADAR_MENTE = null;
var TAB_TELEMETRIA_ACTIVA = 'graficas';

function cambiarTabTelemetriaEstadoPersonal(tab) {
    TAB_TELEMETRIA_ACTIVA = tab || 'graficas';
    ['graficas', 'cuerpo', 'mente'].forEach(function(t) {
        var btn = document.getElementById('tab-btn-telemetria-' + t);
        var panel = document.getElementById('vista-telemetria-tab-' + t);
        if (btn) {
            if (t === tab) btn.classList.add('active');
            else btn.classList.remove('active');
        }
        if (panel) {
            panel.style.display = (t === tab) ? 'block' : 'none';
        }
    });

    if (tab === 'graficas') {
        setTimeout(function() {
            actualizarGraficosRadarEstadoPersonal();
        }, 60);
    }
}

function calcularDatosRadarCuerpo() {
    var f = APP_STATE.fatiga || {};
    function avg(claves) {
        var sum = 0;
        claves.forEach(function(k) { sum += (Number(f[k]) || 0); });
        return Math.round(sum / claves.length);
    }
    return {
        pecho: avg(['pect_mayor', 'pect_menor']),
        espalda: avg(['dorsales', 'trapecios', 'lumbares']),
        hombrosBrazos: avg(['delt_ant', 'delt_lat', 'delt_post', 'biceps', 'triceps', 'antebrazos']),
        core: avg(['core', 'cadera']),
        piernas: avg(['cuadriceps', 'isquios', 'gluteos', 'pantorrillas']),
        articular: avg(['cuello', 'articulaciones'])
    };
}

function calcularDatosRadarMente() {
    asegurarDesgasteMente();
    var dm = APP_STATE.desgasteMente || {};
    function avg(claves) {
        var sum = 0;
        claves.forEach(function(k) { sum += (Number(dm[k]) || 0); });
        return Math.round(sum / claves.length);
    }
    return {
        cognicion: avg(['memoria', 'procesamiento', 'conocimiento']),
        creatividad: avg(['pensamiento_lateral', 'diseno_expresion']),
        disciplina: avg(['enfoque', 'gratificacion', 'resiliencia']),
        psicologia: avg(['microexpresiones', 'persuasion', 'control_emocional', 'inteligencia_social']),
        recuperacion: avg(['estres_desconexion', 'claridad_decision'])
    };
}

function dibujarFallbackRadarEstadoPersonal(canvas, labels, valores, accentHex, fillRgba) {
    if (!canvas || !canvas.getContext) return;
    var parent = canvas.parentElement;
    if (!parent || parent.clientWidth <= 40 || canvas.offsetParent === null) return;

    var cssW = Math.max(220, Math.floor(parent.clientWidth));
    var cssH = Math.max(180, Math.floor(parent.clientHeight || 235));
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var n = labels.length;
    if (!n) return;

    var compact = cssW < 330;
    var fontSize = compact ? 10 : 11;
    var lineHeight = compact ? 12 : 13.5;
    var labelPad = compact ? 9 : 12;
    var radius = Math.max(44, Math.min(cssW * 0.28, cssH * 0.325));
    var cx = cssW / 2;
    var cy = (n === 5) ? (cssH * 0.515) : (cssH * 0.475);
    var startAngle = -Math.PI / 2;

    // Anillos concéntricos (25%, 50%, 75%, 100%)
    [0.25, 0.5, 0.75, 1].forEach(function(step, idx) {
        ctx.beginPath();
        for (var i = 0; i < n; i++) {
            var ang = startAngle + (Math.PI * 2 * i) / n;
            var px = cx + Math.cos(ang) * radius * step;
            var py = cy + Math.sin(ang) * radius * step;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = (idx === 3) ? 'rgba(148, 163, 184, 0.26)' : 'rgba(148, 163, 184, 0.13)';
        ctx.lineWidth = (idx === 3) ? 1.2 : 1;
        ctx.stroke();
    });

    // Radios axiales desde el centro
    for (var i = 0; i < n; i++) {
        var ang = startAngle + (Math.PI * 2 * i) / n;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Marcas discretas de escala en eje superior
    ctx.save();
    ctx.font = '600 9px monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('50', cx + 10, cy - radius * 0.5);
    ctx.fillText('100', cx + 12, cy - radius + 6);
    ctx.restore();

    // Polígono de datos
    var pts = [];
    var hasNonZero = false;
    for (var j = 0; j < n; j++) {
        var val = Math.min(100, Math.max(0, Number(valores[j]) || 0));
        if (val > 0) hasNonZero = true;
        var r = (val / 100) * radius;
        var a = startAngle + (Math.PI * 2 * j) / n;
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }

    if (hasNonZero) {
        ctx.beginPath();
        pts.forEach(function(p, idx) {
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fillStyle = fillRgba;
        ctx.fill();
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        pts.forEach(function(p) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
            ctx.fillStyle = accentHex;
            ctx.fill();
            ctx.lineWidth = 1.4;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
        });
    } else {
        // Indicador central limpio cuando todos los ejes están en 0%
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = fillRgba;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = accentHex;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.fill();
        ctx.stroke();
    }

    // Etiquetas multilínea seguras sin recorte en bordes
    ctx.font = '700 ' + fontSize + 'px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.fillStyle = '#cbd5e1';

    for (var k = 0; k < n; k++) {
        var angL = startAngle + (Math.PI * 2 * k) / n;
        var cosA = Math.cos(angL);
        var sinA = Math.sin(angL);
        var lines = Array.isArray(labels[k]) ? labels[k] : [String(labels[k])];
        var lx = cx + cosA * (radius + labelPad);
        var ly = cy + sinA * (radius + labelPad);

        var align = 'center';
        if (cosA > 0.25) align = 'left';
        else if (cosA < -0.25) align = 'right';
        ctx.textAlign = align;

        var maxLineW = 0;
        lines.forEach(function(line) {
            var w = ctx.measureText(line).width;
            if (w > maxLineW) maxLineW = w;
        });

        // Evitar desbordamiento horizontal dentro del canvas
        if (align === 'left' && lx + maxLineW > cssW - 6) lx = cssW - 6 - maxLineW;
        if (align === 'right' && lx - maxLineW < 6) lx = 6 + maxLineW;
        if (align === 'center') {
            lx = Math.max(6 + maxLineW / 2, Math.min(cssW - 6 - maxLineW / 2, lx));
        }

        var blockH = lines.length * lineHeight;
        var startY = ly;
        if (sinA < -0.5) startY = ly - blockH + lineHeight * 0.5;
        else if (sinA > 0.5) startY = ly + lineHeight * 0.35;
        else startY = ly - (blockH - lineHeight) / 2;

        startY = Math.max(10, Math.min(cssH - blockH + 4, startY));
        ctx.textBaseline = 'middle';
        lines.forEach(function(line, lIdx) {
            ctx.fillText(line, lx, startY + lIdx * lineHeight);
        });
    }
}

function actualizarGraficosRadarEstadoPersonal() {
    var canvasCuerpo = document.getElementById('chart-radar-cuerpo');
    var canvasMente = document.getElementById('chart-radar-mente');
    if (!canvasCuerpo || !canvasMente) return;

    var metricas = calcularMetricasPurasSinActualizar();
    var datosCuerpo = calcularDatosRadarCuerpo();
    var datosMente = calcularDatosRadarMente();

    // Actualizar Badges siempre (incluso sin CDN de Chart.js)
    var badgeCuerpo = document.getElementById('badge-radar-cuerpo');
    if (badgeCuerpo) badgeCuerpo.textContent = metricas.cuerpo + '% Promedio';
    var badgeMente = document.getElementById('badge-radar-mente');
    if (badgeMente) badgeMente.textContent = metricas.mente + '% Promedio';

    // Rellenar Chips de ejes en el footer
    var footerCuerpo = document.getElementById('resumen-ejes-cuerpo');
    if (footerCuerpo) {
        footerCuerpo.innerHTML = `
            <span class="telemetry-chip-axis" onclick="seleccionarMusculoHeatmap('pect_mayor')">⚔️ Pecho: <strong>${datosCuerpo.pecho}%</strong></span>
            <span class="telemetry-chip-axis" onclick="seleccionarMusculoHeatmap('dorsales')">🦅 Espalda: <strong>${datosCuerpo.espalda}%</strong></span>
            <span class="telemetry-chip-axis" onclick="seleccionarMusculoHeatmap('delt_ant')">🛡️ Hombros/Brazos: <strong>${datosCuerpo.hombrosBrazos}%</strong></span>
            <span class="telemetry-chip-axis" onclick="seleccionarMusculoHeatmap('core')">⚡ Núcleo: <strong>${datosCuerpo.core}%</strong></span>
            <span class="telemetry-chip-axis" onclick="seleccionarMusculoHeatmap('cuadriceps')">🦵 Piernas: <strong>${datosCuerpo.piernas}%</strong></span>
            <span class="telemetry-chip-axis" onclick="seleccionarMusculoHeatmap('cuello')">🔄 Articular: <strong>${datosCuerpo.articular}%</strong></span>
        `;
    }

    var footerMente = document.getElementById('resumen-ejes-mente');
    if (footerMente) {
        footerMente.innerHTML = `
            <span class="telemetry-chip-axis" onclick="seleccionarMusculoHeatmap('mente', 'memoria')">🧠 Cognición: <strong>${datosMente.cognicion}%</strong></span>
            <span class="telemetry-chip-axis" onclick="seleccionarMusculoHeatmap('mente', 'pensamiento_lateral')">💡 Creatividad: <strong>${datosMente.creatividad}%</strong></span>
            <span class="telemetry-chip-axis" onclick="seleccionarMusculoHeatmap('mente', 'enfoque')">🛡️ Disciplina: <strong>${datosMente.disciplina}%</strong></span>
            <span class="telemetry-chip-axis" onclick="seleccionarMusculoHeatmap('mente', 'inteligencia_social')">♟️ Psicología: <strong>${datosMente.psicologia}%</strong></span>
            <span class="telemetry-chip-axis" onclick="seleccionarMusculoHeatmap('mente', 'claridad_decision')">🌙 Recuperación: <strong>${datosMente.recuperacion}%</strong></span>
        `;
    }

    var labelsCuerpo = ['Pecho', 'Espalda', ['Brazos y', 'Hombros'], ['Core /', 'Núcleo'], 'Piernas', 'Articular'];
    var valoresCuerpo = [
        datosCuerpo.pecho,
        datosCuerpo.espalda,
        datosCuerpo.hombrosBrazos,
        datosCuerpo.core,
        datosCuerpo.piernas,
        datosCuerpo.articular
    ];

    var labelsMente = ['Cognición', 'Creatividad', 'Disciplina', 'Psicología', ['Recuperación', 'SNC']];
    var valoresMente = [
        datosMente.cognicion,
        datosMente.creatividad,
        datosMente.disciplina,
        datosMente.psicologia,
        datosMente.recuperacion
    ];

    if (!window._epRadarResizeBound && typeof window !== 'undefined' && window.addEventListener) {
        window._epRadarResizeBound = true;
        var epResizeTimer = null;
        window.addEventListener('resize', function() {
            clearTimeout(epResizeTimer);
            epResizeTimer = setTimeout(function() {
                var vistaEp = document.getElementById('vista-estado-personal');
                if (vistaEp && vistaEp.offsetParent !== null) {
                    actualizarGraficosRadarEstadoPersonal();
                }
            }, 140);
        });
    }

    // Fallback Canvas 2D nítido cuando Chart.js no está disponible (modo offline)
    if (typeof Chart === 'undefined') {
        dibujarFallbackRadarEstadoPersonal(canvasCuerpo, labelsCuerpo, valoresCuerpo, '#10b981', 'rgba(16, 185, 129, 0.24)');
        dibujarFallbackRadarEstadoPersonal(canvasMente, labelsMente, valoresMente, '#38bdf8', 'rgba(56, 189, 248, 0.24)');
        return;
    }

    // Evitar inicializar Chart.js sobre un lienzo oculto (0x0) antes de abrir Estado Personal
    if (canvasCuerpo.offsetParent === null || !canvasCuerpo.parentElement || canvasCuerpo.parentElement.clientWidth <= 40) {
        return;
    }

    var containerW = canvasCuerpo.parentElement.clientWidth;
    var isCompact = containerW < 340;

    // Configuración base para Radar Dark equilibrada en móvil y escritorio
    var radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: isCompact
                ? { top: 4, right: 6, bottom: 4, left: 6 }
                : { top: 8, right: 12, bottom: 8, left: 12 }
        },
        scales: {
            r: {
                min: 0,
                max: 100,
                beginAtZero: true,
                angleLines: { color: 'rgba(148, 163, 184, 0.16)', lineWidth: 1 },
                grid: { color: 'rgba(148, 163, 184, 0.14)', lineWidth: 1 },
                pointLabels: {
                    color: '#cbd5e1',
                    padding: isCompact ? 6 : 10,
                    font: { size: isCompact ? 10 : 11, weight: '700', family: "'Plus Jakarta Sans', sans-serif" }
                },
                ticks: {
                    display: false,
                    stepSize: 25,
                    backdropColor: 'transparent'
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0b0e15',
                titleColor: '#f8fafc',
                bodyColor: '#38bdf8',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    title: function(items) {
                        if (!items || !items.length) return '';
                        var lbl = items[0].label;
                        return Array.isArray(lbl) ? lbl.join(' ') : lbl;
                    },
                    label: function(ctx) {
                        return ' ' + ctx.dataset.label + ': ' + ctx.raw + '%';
                    }
                }
            }
        }
    };

    // 1. Radar Cuerpo
    if (CHART_RADAR_CUERPO && CHART_RADAR_CUERPO.width < 80) {
        CHART_RADAR_CUERPO.destroy();
        CHART_RADAR_CUERPO = null;
    }
    if (CHART_RADAR_CUERPO) {
        CHART_RADAR_CUERPO.data.labels = labelsCuerpo;
        CHART_RADAR_CUERPO.data.datasets[0].data = valoresCuerpo;
        CHART_RADAR_CUERPO.options = radarOptions;
        CHART_RADAR_CUERPO.resize();
        CHART_RADAR_CUERPO.update('none');
    } else {
        CHART_RADAR_CUERPO = new Chart(canvasCuerpo, {
            type: 'radar',
            data: {
                labels: labelsCuerpo,
                datasets: [{
                    label: 'Carga Muscular',
                    data: valoresCuerpo,
                    backgroundColor: 'rgba(16, 185, 129, 0.22)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#10b981',
                    pointRadius: 4
                }]
            },
            options: radarOptions
        });
    }

    // 2. Radar Mente
    if (CHART_RADAR_MENTE && CHART_RADAR_MENTE.width < 80) {
        CHART_RADAR_MENTE.destroy();
        CHART_RADAR_MENTE = null;
    }
    if (CHART_RADAR_MENTE) {
        CHART_RADAR_MENTE.data.labels = labelsMente;
        CHART_RADAR_MENTE.data.datasets[0].data = valoresMente;
        CHART_RADAR_MENTE.options = radarOptions;
        CHART_RADAR_MENTE.resize();
        CHART_RADAR_MENTE.update('none');
    } else {
        CHART_RADAR_MENTE = new Chart(canvasMente, {
            type: 'radar',
            data: {
                labels: labelsMente,
                datasets: [{
                    label: 'Carga Cognitiva',
                    data: valoresMente,
                    backgroundColor: 'rgba(56, 189, 248, 0.22)',
                    borderColor: '#38bdf8',
                    borderWidth: 2,
                    pointBackgroundColor: '#38bdf8',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#38bdf8',
                    pointRadius: 4
                }]
            },
            options: radarOptions
        });
    }
}

// ==========================================================================
// RENDERIZADO LINEAL COMPACTO: 🟢 1. CUERPO
// ==========================================================================

function renderizarDesgloseCuerpoAnatomico() {
    var cont = document.getElementById('contenedor-desglose-cuerpo');
    var badgeResumen = document.getElementById('badge-resumen-cuerpo');
    if (!cont) return;

    var fatiga = APP_STATE.fatiga || {};
    var html = '';
    var sumaTotalCuerpo = 0;
    var countTotalCuerpo = 0;

    DESGLOSE_ANATOMICO_CUERPO.forEach(function(bloque) {
        var filasHtml = '';

        bloque.subpartes.forEach(function(sub) {
            var sumSub = 0;
            sub.clavesFatiga.forEach(function(k) {
                sumSub += (Number(fatiga[k]) || 0);
            });
            var valSub = Math.round(sumSub / sub.clavesFatiga.length);
            sumaTotalCuerpo += valSub;
            countTotalCuerpo++;

            var estado = obtenerEstadoZona(valSub);
            var targetMuscle = (sub.clavesFatiga && sub.clavesFatiga[0]) ? sub.clavesFatiga[0] : sub.clave;

            filasHtml += `
            <div class="telemetry-row-item" onclick="seleccionarMusculoHeatmap('${targetMuscle}', '${sub.clave}')" title="Click para inspeccionar ${sub.nombre} en el HUD">
                <div class="telemetry-row-info">
                    <span class="telemetry-row-dot" style="background: ${estado.color};"></span>
                    <span class="telemetry-row-name">${sub.nombre}</span>
                </div>
                <div class="telemetry-row-track">
                    <div class="telemetry-row-fill" style="width: ${valSub}%; background: ${estado.color};"></div>
                </div>
                <div class="telemetry-row-meta">
                    <span class="telemetry-row-val" style="color: ${estado.color};">${valSub}%</span>
                    <span class="telemetry-row-badge" style="background: ${estado.bg}; color: ${estado.color}; border: 1px solid ${estado.border};">${estado.label}</span>
                </div>
            </div>`;
        });

        html += `
        <div class="telemetry-linear-group">
            <div class="telemetry-linear-title">
                <span>${bloque.icono} ${bloque.categoria}</span>
                <span style="color: #64748b; font-size: 10.5px; font-weight: 600;">· ${bloque.subpartes.length} subpartes</span>
            </div>
            ${filasHtml}
        </div>`;
    });

    cont.innerHTML = html;

    if (badgeResumen) {
        var promCuerpo = countTotalCuerpo > 0 ? Math.round(sumaTotalCuerpo / countTotalCuerpo) : 0;
        var estCuerpo = obtenerEstadoZona(promCuerpo);
        badgeResumen.innerHTML = `
            <span class="item-badge-pill" style="border: 1px solid rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.12); color: #10b981; font-weight: 700; padding: 4px 10px; border-radius: 9999px; font-size: 12px;">
                Desgaste Total: ${promCuerpo}% · ${estCuerpo.label}
            </span>`;
    }
}

// ==========================================================================
// RENDERIZADO LINEAL COMPACTO: 🔵 2. MENTE
// ==========================================================================

function renderizarDesgloseMenteCognitiva() {
    var cont = document.getElementById('contenedor-desglose-mente');
    var badgeResumen = document.getElementById('badge-resumen-mente');
    if (!cont) return;

    asegurarDesgasteMente();
    var desgasteMente = APP_STATE.desgasteMente || {};
    var html = '';
    var sumaTotalMente = 0;
    var countTotalMente = 0;

    DESGLOSE_COGNITIVO_MENTE.forEach(function(bloque) {
        var filasHtml = '';

        bloque.subpartes.forEach(function(sub) {
            var valSub = Math.min(100, Math.max(0, Number(desgasteMente[sub.clave]) || 0));
            sumaTotalMente += valSub;
            countTotalMente++;

            var estado = obtenerEstadoZona(valSub);

            filasHtml += `
            <div class="telemetry-row-item" onclick="seleccionarMusculoHeatmap('mente', '${sub.clave}')" title="Click para inspeccionar ${sub.nombre} en el HUD">
                <div class="telemetry-row-info">
                    <span class="telemetry-row-dot" style="background: ${estado.color};"></span>
                    <span class="telemetry-row-name">${sub.nombre}</span>
                </div>
                <div class="telemetry-row-track">
                    <div class="telemetry-row-fill" style="width: ${valSub}%; background: ${estado.color};"></div>
                </div>
                <div class="telemetry-row-meta">
                    <span class="telemetry-row-val" style="color: ${estado.color};">${valSub}%</span>
                    <span class="telemetry-row-badge" style="background: ${estado.bg}; color: ${estado.color}; border: 1px solid ${estado.border};">${estado.label}</span>
                </div>
            </div>`;
        });

        html += `
        <div class="telemetry-linear-group">
            <div class="telemetry-linear-title">
                <span>${bloque.icono} ${bloque.categoria}</span>
                <span style="color: #64748b; font-size: 10.5px; font-weight: 600;">· ${bloque.subpartes.length} facultades</span>
            </div>
            ${filasHtml}
        </div>`;
    });

    cont.innerHTML = html;

    if (badgeResumen) {
        var promMente = countTotalMente > 0 ? Math.round(sumaTotalMente / countTotalMente) : 0;
        var estMente = obtenerEstadoZona(promMente);
        badgeResumen.innerHTML = `
            <span class="item-badge-pill" style="border: 1px solid rgba(56, 189, 248, 0.3); background: rgba(56, 189, 248, 0.12); color: #38bdf8; font-weight: 700; padding: 4px 10px; border-radius: 9999px; font-size: 12px;">
                Carga Mental: ${promMente}% · ${estMente.label}
            </span>`;
    }
}

var RUTINA_PALETA = [
    { icono: '🌅', rankLabel: 'DIARIA · ACTIVACIÓN' },
    { icono: '🔥', rankLabel: 'FUERZA · INTENSIDAD' },
    { icono: '🦵', rankLabel: 'POTENCIA · RESISTENCIA' },
    { icono: '🛡️', rankLabel: 'TRACCIÓN · TÉCNICA' }
];

var RUTINA_ACTIVA = null;

// ==========================================================================
// 7. EJERCICIOS, RUTINAS DINÁMICAS Y CONDICIÓN FÍSICA (GYM)
// ==========================================================================

var CHIPS_SELECCIONADOS_MUSCULOS = [];

var MAPA_CATEGORIAS_A_MUSCULOS = {
    "Mente": ["mente"],
    // Pecho
    "Pectoral_Superior": ["pect_mayor", "delt_ant"],
    "Pectoral_Medio": ["pect_mayor"],
    "Pectoral_Inferior": ["pect_menor", "pect_mayor"],
    "Pectoral_Aperturas": ["pect_mayor", "pect_menor"],
    "Pecho": ["pect_mayor", "pect_menor"],
    "Pectorales": ["pect_mayor", "pect_menor"],
    "Pectoral": ["pect_mayor", "pect_menor"],
    // Hombros
    "Deltoides_Anterior": ["delt_ant"],
    "Deltoides_Lateral": ["delt_lat"],
    "Deltoides_Posterior": ["delt_post"],
    "Manguito_Rotador": ["manguito"],
    "Hombros": ["delt_ant", "delt_lat", "delt_post"],
    "Deltoides": ["delt_ant", "delt_lat", "delt_post"],
    // Brazos
    "Biceps": ["biceps"],
    "Bíceps": ["biceps"],
    "Braquial": ["biceps", "antebrazos"],
    "Triceps_Larga": ["triceps"],
    "Triceps_Lateral": ["triceps"],
    "Tríceps": ["triceps"],
    "Triceps": ["triceps"],
    "Antebrazos": ["antebrazos"],
    // Espalda
    "Dorsal_Ancho": ["dorsales"],
    "Dorsales": ["dorsales"],
    "Espalda_Alta": ["trapecios", "dorsales"],
    "Trapecios": ["trapecios"],
    "Lumbares": ["lumbares"],
    "Espalda": ["dorsales", "trapecios"],
    "Espalda Baja": ["lumbares"],
    // Piernas
    "Cuadriceps": ["cuadriceps"],
    "Cuádriceps": ["cuadriceps"],
    "Isquios": ["isquios"],
    "Isquiotibiales": ["isquios"],
    "Femorales": ["isquios"],
    "Gluteo_Mayor": ["gluteos"],
    "Gluteo_Medio": ["gluteos", "cadera"],
    "Glúteos": ["gluteos"],
    "Gluteos": ["gluteos"],
    "Cadera": ["cadera"],
    "Pantorrillas": ["pantorrillas"],
    "Gemelos": ["pantorrillas"],
    "Soleo": ["pantorrillas"],
    "Tibial": ["pantorrillas"],
    "Piernas": ["cuadriceps", "isquios", "gluteos", "pantorrillas"],
    "Pierna": ["cuadriceps", "isquios", "gluteos", "pantorrillas"],
    // Core
    "Abdomen_Superior": ["core"],
    "Abdomen_Inferior": ["core"],
    "Oblicuos": ["core"],
    "Transverso": ["core"],
    "Core": ["core"],
    "Abdomen": ["core"],
    // Movilidad
    "Cuello": ["cuello"],
    "Articulaciones": ["articulaciones"],
    "Movilidad": ["articulaciones"]
};

/**
 * Normaliza y mapea texto o listas de categorías a claves anatómicas exactas de fatiga
 */
function mapearTextoAMusculos(entrada) {
    if (!entrada) return [];
    if (Array.isArray(entrada)) {
        var unicos = [];
        entrada.forEach(function(item) {
            var res = mapearTextoAMusculos(item);
            res.forEach(function(k) {
                if (!unicos.includes(k)) unicos.push(k);
            });
        });
        return unicos;
    }

    var rawKey = String(entrada).trim();
    if (MAPA_CATEGORIAS_A_MUSCULOS[rawKey]) {
        return MAPA_CATEGORIAS_A_MUSCULOS[rawKey].slice();
    }

    var str = rawKey.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    var claves = [];

    // Priorizar coincidencias anatómicas específicas
    if (/pect.*sup|clavicul|inclinad/.test(str)) {
        claves.push('pect_mayor', 'delt_ant');
    } else if (/pect.*inf|declinad|fondo.*paralela/.test(str)) {
        claves.push('pect_menor', 'pect_mayor');
    } else if (/pect|pecho/.test(str)) {
        claves.push('pect_mayor', 'pect_menor');
    }

    if (/delt.*ant|hombro.*front|militar|elevacion.*front/.test(str)) claves.push('delt_ant');
    if (/delt.*lat|vuelo|elevacion.*lat/.test(str)) claves.push('delt_lat');
    if (/delt.*post|pajaro|face.*pull|reverse.*peck/.test(str)) claves.push('delt_post');
    if (/manguito|rotador/.test(str)) claves.push('manguito');
    if (/hombro|deltoid/.test(str) && !claves.some(function(k) { return k.startsWith('delt_'); })) {
        claves.push('delt_ant', 'delt_lat', 'delt_post');
    }

    if (/braquial|martillo/.test(str)) claves.push('biceps', 'antebrazos');
    else if (/bicep|curl/.test(str)) claves.push('biceps');

    if (/tricep.*larg|frances|copa/.test(str)) claves.push('triceps');
    else if (/tricep|fondo/.test(str)) claves.push('triceps');

    if (/antebrazo|agarre|muneca/.test(str)) claves.push('antebrazos');
    if (/dorsal|amplitud|jalon|pull|lats|dominada/.test(str)) claves.push('dorsales');
    if (/espalda.*alt|trapecio|romboide|remo|shrug/.test(str)) claves.push('trapecios');
    if (/lumbar|espinal|erector|hiperextension/.test(str)) claves.push('lumbares');
    if (/espalda/.test(str) && !claves.includes('dorsales') && !claves.includes('trapecios') && !claves.includes('lumbares')) {
        claves.push('dorsales', 'trapecios');
    }

    if (/abdom.*sup|crunch/.test(str)) claves.push('core');
    if (/abdom.*inf|elevacion.*pierna/.test(str)) claves.push('core');
    if (/oblicuo|rotacion|russian/.test(str)) claves.push('core');
    if (/transverso|plancha|vacio|core|abdom/.test(str)) claves.push('core');

    if (/gluteo.*may|hip.*thrust/.test(str)) claves.push('gluteos');
    if (/gluteo.*med|abduc/.test(str)) claves.push('gluteos', 'cadera');
    if (/gluteo|puente/.test(str) && !claves.includes('gluteos')) claves.push('gluteos');

    if (/cadera|aductor/.test(str)) claves.push('cadera');
    if (/cuadricep|muslo|sentadilla|squat|prensa|zancada/.test(str)) claves.push('cuadriceps');
    if (/isquio|femoral|rumano/.test(str)) claves.push('isquios');
    if (/pantorrilla|gemelo|soleo|tibial/.test(str)) claves.push('pantorrillas');
    if (/mente|cognit|cerebr|snc|neural/.test(str)) claves.push('mente');
    if (/cuello|cervical/.test(str)) claves.push('cuello');
    if (/articulacion|movilidad/.test(str)) claves.push('articulaciones');

    // Mapeo directo en MAPA_CATEGORIAS_A_MUSCULOS si no hubo coincidencia por regex
    if (claves.length === 0 && MAPA_CATEGORIAS_A_MUSCULOS[entrada]) {
        claves = MAPA_CATEGORIAS_A_MUSCULOS[entrada].slice();
    }

    return claves.filter(function(item, pos, self) {
        return self.indexOf(item) === pos;
    });
}

/**
 * Aplica o revierte el desgaste de un ejercicio individual en tiempo real en Estado Personal
 */
function aplicarDesgasteEjercicioIndividual(ej, sumar, fraccion) {
    if (!ej) return;
    if (!APP_STATE.fatiga) APP_STATE.fatiga = JSON.parse(JSON.stringify(DEFAULT_STATE.fatiga || {}));
    asegurarDesgasteMente();

    var frac = (typeof fraccion === 'number' && fraccion > 0) ? fraccion : 1;
    var factor = ((sumar === false) ? -1 : 1) * frac;

    if (ej.esMental) {
        var delta = (Number(ej.fatigaEstimada) || 15) * factor;
        var subclave = ej.musculoPrincipal || 'enfoque';
        if (APP_STATE.desgasteMente) {
            var actM = Number(APP_STATE.desgasteMente[subclave]) || 0;
            APP_STATE.desgasteMente[subclave] = Math.min(100, Math.max(0, actM + delta));
        }
        if (APP_STATE.fatigaMentalDiaria) {
            var actSNC = Number(APP_STATE.fatigaMentalDiaria.nivel) || 0;
            APP_STATE.fatigaMentalDiaria.nivel = Math.min(100, Math.max(0, actSNC + Math.round(delta * 0.7)));
        }
    } else {
        var fatigaVal = (Number(ej.fatigaPorcentaje) || 20) * factor;
        var mKeys = [];

        // Si el ejercicio tiene desglose multi-zona con porcentajes ponderados
        if (ej.zonas && Array.isArray(ej.zonas) && ej.zonas.length > 0) {
            ej.zonas.forEach(function(z) {
                var zKeys = mapearTextoAMusculos(z.clave || z.nombre || z.zona);
                var zPct = (Number(z.porcentaje) || 25) * factor;
                zKeys.forEach(function(k) {
                    var actF = Number(APP_STATE.fatiga[k]) || 0;
                    APP_STATE.fatiga[k] = Math.min(100, Math.max(0, actF + zPct));
                    if (!mKeys.includes(k)) mKeys.push(k);
                });
            });
        } else {
            if (ej.categorias && ej.categorias.length > 0) {
                mKeys = mapearTextoAMusculos(ej.categorias);
            }
            if (ej.musculoPrincipal) {
                var extra = mapearTextoAMusculos(ej.musculoPrincipal);
                extra.forEach(function(k) { if (!mKeys.includes(k)) mKeys.push(k); });
            }
            if (mKeys.length === 0 && ej.nombre) {
                mKeys = mapearTextoAMusculos(ej.nombre);
            }
            if (mKeys.length === 0) {
                mKeys = ['core', 'pect_mayor'];
            }

            mKeys.forEach(function(k) {
                var actF = Number(APP_STATE.fatiga[k]) || 0;
                APP_STATE.fatiga[k] = Math.min(100, Math.max(0, actF + fatigaVal));
            });
        }

        // Recalcular promedio de fatiga del cuerpo hoy
        var keysFatiga = Object.keys(METADATOS_MUSCULOS);
        var sumaTotal = 0;
        keysFatiga.forEach(function(k) {
            sumaTotal += (Number(APP_STATE.fatiga[k]) || 0);
        });
        APP_STATE.fatiga.promedioHoy = Math.round(sumaTotal / keysFatiga.length);
    }

    calcularMetricasGeneralesDesgaste();
    MonarcaDB.save(APP_STATE, false);

    // Actualizar gráficos en tiempo real si el contenedor está en DOM
    var contAv = document.getElementById('hud-avatar-overview');
    if (contAv) {
        renderizarGraficoGeneralAvatar();
        renderizarDesgloseCuerpoAnatomico();
        renderizarDesgloseMenteCognitiva();
    }
}

var RUTINA_ACTIVA = null;

// --- GESTIÓN DE EJERCICIOS Y RUTINAS (2 CATEGORÍAS) ---

var CATEGORIA_EJERCICIOS_ACTIVA = 'rutinas'; // 'rutinas' o 'banco'
var SUBFILTRO_BANCO_ACTIVO = 'todos'; // 'todos', 'gym', 'calistenia'

const DEFAULT_BANCO_EJERCICIOS = [
    {
        id: "EJ-1",
        nombre: "Press de Banca Plano",
        descripcion: "Empuje horizontal con barra para fuerza pectoral y tríceps",
        series: 4,
        repeticiones: "8-10 reps",
        tipo: "gym",
        categorias: ["Pectorales", "Tríceps", "Hombros"],
        fatigaPorcentaje: 25
    },
    {
        id: "EJ-2",
        nombre: "Sentadilla con Barra",
        descripcion: "Sentadilla profunda con barra olímpica para piernas y glúteos",
        series: 4,
        repeticiones: "10-12 reps",
        tipo: "gym",
        categorias: ["Cuádriceps", "Glúteos", "Core"],
        fatigaPorcentaje: 30
    },
    {
        id: "EJ-3",
        nombre: "Jalón al Pecho en Polea",
        descripcion: "Tracción vertical en polea alta para dorsales y bíceps",
        series: 3,
        repeticiones: "10-12 reps",
        tipo: "gym",
        categorias: ["Dorsales", "Bíceps", "Espalda Alta"],
        fatigaPorcentaje: 20
    },
    {
        id: "EJ-4",
        nombre: "Flexiones de Pecho (Push-ups)",
        descripcion: "Empuje con peso corporal manteniendo core y glúteos firmes",
        series: 4,
        repeticiones: "25 reps",
        tipo: "calistenia",
        categorias: ["Pectorales", "Tríceps", "Core"],
        fatigaPorcentaje: 15
    },
    {
        id: "EJ-5",
        nombre: "Dominadas en Barra (Pull-ups)",
        descripcion: "Tracción con peso corporal agarre prono al ancho de hombros",
        series: 4,
        repeticiones: "8-10 reps",
        tipo: "calistenia",
        categorias: ["Dorsales", "Bíceps", "Espalda Alta"],
        fatigaPorcentaje: 25
    },
    {
        id: "EJ-6",
        nombre: "Plancha Abdominal Estricta",
        descripcion: "Isométrico para estabilización del core y cadena anterior",
        series: 3,
        repeticiones: "60 seg",
        tipo: "calistenia",
        categorias: ["Core", "Hombros"],
        fatigaPorcentaje: 15
    }
];

function cargarEjercicios() {
    if (!APP_STATE.ejercicios || !Array.isArray(APP_STATE.ejercicios)) {
        APP_STATE.ejercicios = [];
    }
    if (!APP_STATE.rutinas || !Array.isArray(APP_STATE.rutinas)) {
        APP_STATE.rutinas = [];
    }

    cambiarCategoriaEjercicios(CATEGORIA_EJERCICIOS_ACTIVA);
}

var FILTRO_RUTINAS_ACTIVO = 'todas';

function filtrarTipoRutinas(tipo) {
    FILTRO_RUTINAS_ACTIVO = tipo || 'todas';
    if (typeof cerrarPanelRutinaAleatoriaPersonal === 'function') {
        cerrarPanelRutinaAleatoriaPersonal(true);
    }
    var bTodas = document.getElementById('filtro-rutina-todas');
    var bFis = document.getElementById('filtro-rutina-fisicas');
    var bMen = document.getElementById('filtro-rutina-mentales');
    if (bTodas) bTodas.classList.toggle('active', FILTRO_RUTINAS_ACTIVO === 'todas');
    if (bFis) bFis.classList.toggle('active', FILTRO_RUTINAS_ACTIVO === 'fisicas');
    if (bMen) bMen.classList.toggle('active', FILTRO_RUTINAS_ACTIVO === 'mentales');
    renderizarPortalesRutinasEjercicios();
}

function cambiarCategoriaEjercicios(cat) {
    if (cat === 'banco') cat = 'banco-fisico';
    if (cat === 'gimnasio-mental' || cat === 'gimnasio') cat = 'banco-mental';
    CATEGORIA_EJERCICIOS_ACTIVA = cat || 'rutinas';

    var btnRut = document.getElementById('btn-cat-rutinas');
    var btnBancoFis = document.getElementById('btn-cat-banco-fisico');
    var btnBancoMen = document.getElementById('btn-cat-banco-mental');
    var btnHist = document.getElementById('btn-cat-historial');

    var secRut = document.getElementById('seccion-categoria-rutinas');
    var secBancoFis = document.getElementById('seccion-categoria-banco-fisico');
    var secBancoMen = document.getElementById('seccion-categoria-banco-mental');
    var secHist = document.getElementById('seccion-categoria-historial');

    if (btnRut) btnRut.classList.remove('active');
    if (btnBancoFis) btnBancoFis.classList.remove('active');
    if (btnBancoMen) btnBancoMen.classList.remove('active');
    if (btnHist) btnHist.classList.remove('active');

    if (secRut) secRut.style.display = 'none';
    if (secBancoFis) secBancoFis.style.display = 'none';
    if (secBancoMen) secBancoMen.style.display = 'none';
    if (secHist) secHist.style.display = 'none';

    if (CATEGORIA_EJERCICIOS_ACTIVA === 'rutinas') {
        if (btnRut) btnRut.classList.add('active');
        if (secRut) secRut.style.display = 'block';
        if (typeof actualizarSelectoresPlaylistRutinas === 'function') {
            actualizarSelectoresPlaylistRutinas();
        }
        if (typeof PANEL_ALEATORIA_PERSONAL_ABIERTO !== 'undefined' && PANEL_ALEATORIA_PERSONAL_ABIERTO && typeof renderizarModuloRutinaAleatoriaPersonal === 'function') {
            renderizarModuloRutinaAleatoriaPersonal();
        } else {
            renderizarPortalesRutinasEjercicios();
        }
    } else if (CATEGORIA_EJERCICIOS_ACTIVA === 'banco-fisico') {
        if (btnBancoFis) btnBancoFis.classList.add('active');
        if (secBancoFis) secBancoFis.style.display = 'block';
        renderizarEjercicios(APP_STATE.ejercicios);
    } else if (CATEGORIA_EJERCICIOS_ACTIVA === 'banco-mental') {
        if (btnBancoMen) btnBancoMen.classList.add('active');
        if (secBancoMen) secBancoMen.style.display = 'block';
        renderizarBancoEjerciciosCerebrales();
    } else if (CATEGORIA_EJERCICIOS_ACTIVA === 'historial') {
        if (btnHist) btnHist.classList.add('active');
        if (secHist) secHist.style.display = 'block';
        renderizarGym(APP_STATE.gym);
    }
}

function accionBotonCrearEjercicios() {
    if (CATEGORIA_EJERCICIOS_ACTIVA === 'banco-mental') {
        abrirModalNuevoEjercicioCerebral();
    } else if (CATEGORIA_EJERCICIOS_ACTIVA === 'banco-fisico') {
        abrirModalNuevoEjercicio();
    } else {
        abrirModalNuevaRutina();
    }
}

var SVG_RUTINA_CLIPBOARD = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M9 12h6"></path><path d="M9 16h4"></path></svg>';
var SVG_RUTINA_EDIT = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>';
var SVG_RUTINA_DELETE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>';
var SVG_RUTINA_MUSIC = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
var SVG_RUTINA_CHEVRON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';

function limpiarBadgeRutina(txt, fallbackTxt) {
    var raw = String(txt || fallbackTxt || 'SESIÓN').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s·\-]/gi, '').trim();
    return raw || String(fallbackTxt || 'SESIÓN');
}

function construirMapaCancionesPlaylist(canciones) {
    var map = {};
    (canciones || []).forEach(function(c) {
        if (c && c.id) map[c.id] = true;
    });
    return map;
}

function contarCancionesValidasPlaylist(pl, canciones, cancionesMap) {
    if (!pl || !Array.isArray(pl.cancionIds)) return 0;
    if (!canciones || canciones.length === 0) return pl.cancionIds.length;
    return pl.cancionIds.filter(function(cid) { return !!cancionesMap[cid]; }).length;
}

function construirOpcionesPlaylistsLimpio(playlists, canciones, cancionesMap) {
    return (playlists || []).map(function(pl) {
        var n = contarCancionesValidasPlaylist(pl, canciones, cancionesMap);
        return '<option value="' + escaparHtmlRutina(pl.id) + '">' + escaparHtmlRutina(pl.nombre) + ' (' + n + ')</option>';
    }).join('');
}

function construirOpcionesSelectorRutinaIndividual(selectedVal, defaultPlId, playlists, canciones, cancionesMap) {
    var plDef = defaultPlId ? (playlists || []).find(function(p) { return p && p.id === defaultPlId; }) : null;
    var defLabel = plDef ? ('Por defecto (' + escaparHtmlRutina(plDef.nombre) + ')') : 'Playlist por defecto';
    var selTarget = (selectedVal === '__none__' || (selectedVal && (playlists || []).some(function(p) { return p && p.id === selectedVal; })))
        ? selectedVal
        : '';

    var opts = [
        '<option value=""' + (selTarget === '' ? ' selected' : '') + '>' + defLabel + '</option>',
        '<option value="__none__"' + (selTarget === '__none__' ? ' selected' : '') + '>Sin música</option>'
    ];
    (playlists || []).forEach(function(pl) {
        var n = contarCancionesValidasPlaylist(pl, canciones, cancionesMap);
        var selAttr = (selTarget === pl.id) ? ' selected' : '';
        opts.push('<option value="' + escaparHtmlRutina(pl.id) + '"' + selAttr + '>' + escaparHtmlRutina(pl.nombre) + ' (' + n + ')</option>');
    });
    return {
        html: opts.join(''),
        estadoClase: (selTarget === '__none__') ? 'is-muted' : (selTarget ? 'is-custom' : '')
    };
}

function buscarRutinaPorIdentificador(rutinaIdOIdx) {
    if (!APP_STATE.rutinas || !Array.isArray(APP_STATE.rutinas)) return { rutina: null, idx: -1 };
    var idx = -1;
    if (typeof rutinaIdOIdx === 'string') {
        idx = APP_STATE.rutinas.findIndex(function(r) {
            return r && (String(r.id) === rutinaIdOIdx || String(r.codigo) === rutinaIdOIdx);
        });
        if (idx === -1 && !isNaN(parseInt(rutinaIdOIdx, 10))) {
            idx = parseInt(rutinaIdOIdx, 10);
        }
    } else if (typeof rutinaIdOIdx === 'number') {
        idx = rutinaIdOIdx;
    }
    if (idx < 0 || idx >= APP_STATE.rutinas.length) return { rutina: null, idx: -1 };
    return { rutina: APP_STATE.rutinas[idx], idx: idx };
}

function cambiarPlaylistDeRutina(rutinaIdOIdx, playlistId, event) {
    if (event && event.stopPropagation) event.stopPropagation();
    var match = buscarRutinaPorIdentificador(rutinaIdOIdx);
    if (!match.rutina) return;

    var cleanPlId = (playlistId && String(playlistId).trim()) ? String(playlistId).trim() : null;
    match.rutina.playlistId = cleanPlId;
    match.rutina.fechaActualizacion = Date.now();
    MonarcaDB.save(APP_STATE);

    var bar = document.getElementById('rutina-pl-bar-' + String(match.rutina.id || match.idx));
    if (bar) {
        bar.classList.toggle('is-muted', cleanPlId === '__none__');
        bar.classList.toggle('is-custom', !!(cleanPlId && cleanPlId !== '__none__'));
    }

    var inEditId = document.getElementById('modal-rutina-edit-id');
    var selModal = document.getElementById('modal-rutina-playlist');
    if (selModal && inEditId && inEditId.value && (inEditId.value === String(match.rutina.id) || inEditId.value === ('RUT_IDX_' + match.idx))) {
        selModal.value = cleanPlId || '';
    }
}

if (typeof window !== 'undefined') {
    window.cambiarPlaylistDeRutina = cambiarPlaylistDeRutina;
}

function construirTarjetaRutinaNoirHtml(rut, idx, ctx) {
    var esMental = (rut.tipo === 'mental' || rut.tipo === 'cerebral');
    var esHibrida = (rut.tipo === 'hibrida');
    var numEj = (rut.ejercicios && rut.ejercicios.length) ? rut.ejercicios.length : 0;
    var badgeEj = numEj > 0 ? (numEj + (numEj === 1 ? ' ejercicio' : ' ejercicios')) : 'Sin ejercicios';
    var rutCodigo = rut.codigo || (esMental ? ('COG-' + (idx + 1)) : (esHibrida ? ('HIB-' + (idx + 1)) : ('RUT-' + (idx + 1))));
    var cleanRank = limpiarBadgeRutina(
        rut.rankLabel,
        esMental ? 'MENTAL · ENFOQUE' : (esHibrida ? 'HÍBRIDA · INTEGRAL' : 'SESIÓN · FUERZA')
    );

    var tipoTexto = esMental ? 'Mental' : (esHibrida ? 'Híbrida' : 'Física');
    var tipoClase = esMental ? 'mental' : (esHibrida ? 'hibrida' : '');
    var borderAccent = esMental ? '#38bdf8' : (esHibrida ? '#f59e0b' : '#cbd5e1');
    var penPorSerie = (typeof obtenerPenitenciaExpPorSerieRutina === 'function')
        ? obtenerPenitenciaExpPorSerieRutina(rut)
        : 20;
    var ident = String(rut.id || idx);
    var safeId = escaparHtmlRutina(ident);
    var safeNombre = escaparHtmlRutina(rut.nombre || 'Rutina');
    var safeDesc = escaparHtmlRutina(rut.descripcion || '');

    var plUI = construirOpcionesSelectorRutinaIndividual(
        rut.playlistId || '',
        ctx.defaultPlId,
        ctx.playlists,
        ctx.canciones,
        ctx.cancionesMap
    );

    return `
        <div class="rutina-card-noir" onclick="abrirDetalleRutina('${safeId}')" style="border-left-color: ${borderAccent};">
            <div class="rutina-card-top">
                <div class="rutina-card-meta">
                    <span class="rutina-code-chip">${escaparHtmlRutina(rutCodigo)}</span>
                    <span class="rutina-rank-chip">${escaparHtmlRutina(cleanRank)}</span>
                    <span class="rutina-type-chip ${tipoClase}">${tipoTexto}</span>
                    ${penPorSerie > 0 ? `<span class="rutina-penalty-chip" title="Penitencia en EXP por cada serie no realizada">💀 -${penPorSerie} EXP/serie</span>` : ''}
                </div>
                <div class="rutina-card-icon-actions" onclick="event.stopPropagation();">
                    <button type="button" class="rutina-icon-btn edit" title="Editar rutina" aria-label="Editar ${safeNombre}" onclick="event.stopPropagation(); event.stopImmediatePropagation(); abrirModalEditarRutina('${safeId}', event)">
                        ${SVG_RUTINA_EDIT}
                    </button>
                    <button type="button" class="rutina-icon-btn delete" title="Eliminar rutina" aria-label="Eliminar ${safeNombre}" onclick="event.stopPropagation(); event.stopImmediatePropagation(); eliminarRutina('${safeId}', event)">
                        ${SVG_RUTINA_DELETE}
                    </button>
                </div>
            </div>

            <h3 class="rutina-card-title">${safeNombre}</h3>
            ${safeDesc ? `<p class="rutina-card-desc">${safeDesc}</p>` : ''}

            <div id="rutina-pl-bar-${safeId}" class="rutina-card-playlist-bar ${plUI.estadoClase}" onclick="event.stopPropagation();" onmousedown="event.stopPropagation();" ontouchstart="event.stopPropagation();">
                <span class="rutina-card-playlist-label" title="Playlist de esta rutina">${SVG_RUTINA_MUSIC}</span>
                <select class="rutina-card-playlist-select" data-rutina-playlist-id="${safeId}" aria-label="Playlist de ${safeNombre}" onchange="cambiarPlaylistDeRutina('${safeId}', this.value, event)" onclick="event.stopPropagation();">
                    ${plUI.html}
                </select>
            </div>

            <div class="rutina-card-footer">
                <span class="rutina-card-ej-count">${badgeEj}</span>
                <span class="btn-rutina-enter-cta">
                    <span>Iniciar sesión</span>
                    ${SVG_RUTINA_CHEVRON}
                </span>
            </div>
        </div>`;
}

function renderizarPortalesRutinasEjercicios() {
    var cont = document.getElementById('contenedor-portales-rutinas-ejercicios');
    if (!cont) return;

    var rList = APP_STATE.rutinas || [];
    if (!rList || rList.length === 0) {
        cont.innerHTML = `
        <div class="skills-empty-card">
            <div class="skills-empty-icon">${SVG_RUTINA_CLIPBOARD}</div>
            <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 16px;">No tienes rutinas creadas</h4>
            <p style="color: #94a3b8; font-size: 13px; max-width: 380px; margin: 0 auto 16px auto; line-height: 1.45;">
                Arma tus sesiones de entrenamiento físico, cognitivo o híbrido y asígnales su propia playlist.
            </p>
            <button type="button" class="btn-add-finanza" onclick="abrirModalNuevaRutina()" style="justify-content: center;">
                + Crear Primera Rutina
            </button>
        </div>`;
        return;
    }

    var filtradas = rList.map(function(r, i) { return { r: r, idx: i }; }).filter(function(item) {
        var rut = item.r;
        var tipo = rut.tipo || 'fisica';
        if (FILTRO_RUTINAS_ACTIVO === 'fisicas') return (tipo === 'fisica' || tipo === 'gym');
        if (FILTRO_RUTINAS_ACTIVO === 'mentales') return (tipo === 'mental' || tipo === 'cerebral');
        return true;
    });

    if (filtradas.length === 0) {
        cont.innerHTML = `
        <div class="skills-empty-card" style="padding: 28px 18px;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 12px 0;">No tienes rutinas en la categoría seleccionada.</p>
            <button type="button" class="btn-subfiltro-ej" onclick="abrirModalNuevaRutina()">+ Crear Rutina</button>
        </div>`;
        return;
    }

    var playlists = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getPlaylists === 'function')
        ? window.MonarcaPlayer.getPlaylists()
        : [];
    var defaultPlId = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getPlaylistDefaultRutinaId === 'function')
        ? window.MonarcaPlayer.getPlaylistDefaultRutinaId()
        : null;
    var canciones = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getCanciones === 'function')
        ? window.MonarcaPlayer.getCanciones()
        : [];
    var ctx = {
        playlists: playlists,
        defaultPlId: defaultPlId,
        canciones: canciones,
        cancionesMap: construirMapaCancionesPlaylist(canciones)
    };

    cont.innerHTML = filtradas.map(function(item) {
        return construirTarjetaRutinaNoirHtml(item.r, item.idx, ctx);
    }).join('');
}

var BUSQUEDA_BANCO_FISICO_TEXTO = "";

function normalizarTextoBusqueda(str) {
    if (!str) return "";
    return String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function ejercicioCoincideBusquedaTexto(ej, term) {
    if (!term) return true;
    var q = normalizarTextoBusqueda(term);
    if (!q) return true;

    var nom = normalizarTextoBusqueda(ej.nombre);
    if (nom.includes(q)) return true;

    var desc = normalizarTextoBusqueda(ej.descripcion || ej.especificaciones);
    if (desc.includes(q)) return true;

    var musc = normalizarTextoBusqueda(ej.musculoPrincipal);
    if (musc.includes(q)) return true;

    var imp = normalizarTextoBusqueda(ej.implemento || ej.equipamiento);
    if (imp.includes(q)) return true;

    var tipo = normalizarTextoBusqueda(ej.tipo);
    if (tipo.includes(q)) return true;

    if (ej.categorias && Array.isArray(ej.categorias)) {
        if (ej.categorias.some(function(c) { return normalizarTextoBusqueda(c).includes(q); })) return true;
    }

    if (ej.zonas && Array.isArray(ej.zonas)) {
        if (ej.zonas.some(function(z) {
            return normalizarTextoBusqueda(z.clave).includes(q) || normalizarTextoBusqueda(z.nombre).includes(q);
        })) return true;
    }

    return false;
}

function alBuscarEjercicioBancoFisico(texto) {
    BUSQUEDA_BANCO_FISICO_TEXTO = (texto || "").trim();
    var btnLimpiar = document.getElementById('btn-limpiar-busqueda-ejercicios');
    if (btnLimpiar) {
        btnLimpiar.style.display = BUSQUEDA_BANCO_FISICO_TEXTO ? 'block' : 'none';
    }
    renderizarEjercicios(APP_STATE.ejercicios);
}

function limpiarBuscadorBancoFisico() {
    BUSQUEDA_BANCO_FISICO_TEXTO = "";
    var inBusq = document.getElementById('buscador-ejercicios-banco');
    var btnLimpiar = document.getElementById('btn-limpiar-busqueda-ejercicios');
    if (inBusq) {
        inBusq.value = "";
        inBusq.focus();
    }
    if (btnLimpiar) btnLimpiar.style.display = 'none';
    renderizarEjercicios(APP_STATE.ejercicios);
}

function filtrarSubcategoriaEjercicios(subfiltro) {
    SUBFILTRO_BANCO_ACTIVO = subfiltro || 'todos';
    var btns = document.querySelectorAll('#seccion-categoria-banco-fisico .btn-subfiltro-ej');
    btns.forEach(function(b) {
        if (b.getAttribute('data-subfiltro') === SUBFILTRO_BANCO_ACTIVO) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    renderizarEjercicios(APP_STATE.ejercicios);
}

var CATALOGO_ZONAS_FISICAS = [
    // ⚔️ Pecho / Pectorales
    { clave: "Pectoral_Superior", nombre: "Pectoral Superior (Haz Clavicular)", icono: "⚔️", grupo: "⚔️ Pecho / Pectorales", tipo: "cuerpo", defaultPct: 35 },
    { clave: "Pectoral_Medio", nombre: "Pectoral Medio (Haz Esternal)", icono: "⚔️", grupo: "⚔️ Pecho / Pectorales", tipo: "cuerpo", defaultPct: 35 },
    { clave: "Pectoral_Inferior", nombre: "Pectoral Inferior (Haz Abdominal)", icono: "⚔️", grupo: "⚔️ Pecho / Pectorales", tipo: "cuerpo", defaultPct: 30 },
    { clave: "Pectoral_Aperturas", nombre: "Pectoral Interior (Fibras Mediales)", icono: "⚔️", grupo: "⚔️ Pecho / Pectorales", tipo: "cuerpo", defaultPct: 25 },
    { clave: "Pecho", nombre: "Pecho Completo (Pectorales)", icono: "⚔️", grupo: "⚔️ Pecho / Pectorales", tipo: "cuerpo", defaultPct: 35 },

    // 🛡️ Hombros / Deltoides (3 Cabezas + Manguito)
    { clave: "Deltoides_Anterior", nombre: "Deltoides Anterior (Cabeza Frontal)", icono: "🛡️", grupo: "🛡️ Hombros / Deltoides", tipo: "cuerpo", defaultPct: 25 },
    { clave: "Deltoides_Lateral", nombre: "Deltoides Lateral (Cabeza Media)", icono: "🛡️", grupo: "🛡️ Hombros / Deltoides", tipo: "cuerpo", defaultPct: 25 },
    { clave: "Deltoides_Posterior", nombre: "Deltoides Posterior (Cabeza Dorsal)", icono: "🛡️", grupo: "🛡️ Hombros / Deltoides", tipo: "cuerpo", defaultPct: 25 },
    { clave: "Manguito_Rotador", nombre: "Manguito Rotador (Estabilizadores)", icono: "🔄", grupo: "🛡️ Hombros / Deltoides", tipo: "cuerpo", defaultPct: 15 },
    { clave: "Hombros", nombre: "Hombros Globales (Deltoides Completo)", icono: "🛡️", grupo: "🛡️ Hombros / Deltoides", tipo: "cuerpo", defaultPct: 25 },

    // 🦅 Espalda & Dorso
    { clave: "Dorsal_Ancho", nombre: "Dorsal Ancho (Latissimus Dorsi)", icono: "🦅", grupo: "🦅 Espalda & Dorsales", tipo: "cuerpo", defaultPct: 35 },
    { clave: "Espalda_Alta", nombre: "Espalda Alta & Romboides", icono: "🦅", grupo: "🦅 Espalda & Dorsales", tipo: "cuerpo", defaultPct: 30 },
    { clave: "Trapecios", nombre: "Trapecios (Porción Superior y Media)", icono: "🦅", grupo: "🦅 Espalda & Dorsales", tipo: "cuerpo", defaultPct: 25 },
    { clave: "Lumbares", nombre: "Lumbares (Erectores Espinales)", icono: "🏛️", grupo: "🦅 Espalda & Dorsales", tipo: "cuerpo", defaultPct: 25 },
    { clave: "Espalda", nombre: "Espalda Completa", icono: "🦅", grupo: "🦅 Espalda & Dorsales", tipo: "cuerpo", defaultPct: 35 },

    // 💪 Brazos (Bíceps, Tríceps & Antebrazos)
    { clave: "Biceps", nombre: "Bíceps Braquial (Cabeza Corta & Larga)", icono: "💪", grupo: "💪 Brazos (Bíceps, Tríceps & Antebrazos)", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Braquial", nombre: "Braquial Anterior & Braquiorradial", icono: "💪", grupo: "💪 Brazos (Bíceps, Tríceps & Antebrazos)", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Triceps_Larga", nombre: "Tríceps (Cabeza Larga)", icono: "🦾", grupo: "💪 Brazos (Bíceps, Tríceps & Antebrazos)", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Triceps_Lateral", nombre: "Tríceps (Cabeza Lateral & Medial)", icono: "🦾", grupo: "💪 Brazos (Bíceps, Tríceps & Antebrazos)", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Tríceps", nombre: "Tríceps Completo", icono: "🦾", grupo: "💪 Brazos (Bíceps, Tríceps & Antebrazos)", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Antebrazos", nombre: "Antebrazos (Flexores y Extensores)", icono: "✊", grupo: "💪 Brazos (Bíceps, Tríceps & Antebrazos)", tipo: "cuerpo", defaultPct: 15 },

    // 🦵 Piernas & Tren Inferior
    { clave: "Cuadriceps", nombre: "Cuádriceps (Recto Femoral & Vastos)", icono: "🦵", grupo: "🦵 Piernas & Tren Inferior", tipo: "cuerpo", defaultPct: 35 },
    { clave: "Isquios", nombre: "Isquiosurales / Femorales (Bíceps Femoral)", icono: "🦵", grupo: "🦵 Piernas & Tren Inferior", tipo: "cuerpo", defaultPct: 30 },
    { clave: "Gluteo_Mayor", nombre: "Glúteo Mayor", icono: "🍑", grupo: "🦵 Piernas & Tren Inferior", tipo: "cuerpo", defaultPct: 25 },
    { clave: "Gluteo_Medio", nombre: "Glúteo Medio & Menor", icono: "🍑", grupo: "🦵 Piernas & Tren Inferior", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Glúteos", nombre: "Glúteos Completos", icono: "🍑", grupo: "🦵 Piernas & Tren Inferior", tipo: "cuerpo", defaultPct: 25 },
    { clave: "Cadera", nombre: "Aductores & Flexores de Cadera", icono: "🥋", grupo: "🦵 Piernas & Tren Inferior", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Pantorrillas", nombre: "Pantorrillas / Gemelos (Gastrocnemio)", icono: "🧦", grupo: "🦵 Piernas & Tren Inferior", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Soleo", nombre: "Sóleo", icono: "🧦", grupo: "🦵 Piernas & Tren Inferior", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Tibial", nombre: "Tibial Anterior", icono: "🧦", grupo: "🦵 Piernas & Tren Inferior", tipo: "cuerpo", defaultPct: 15 },

    // ⚡ Core & Abdomen
    { clave: "Abdomen_Superior", nombre: "Recto Abdominal (Porción Superior)", icono: "⚡", grupo: "⚡ Core & Abdomen", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Abdomen_Inferior", nombre: "Recto Abdominal (Porción Inferior)", icono: "⚡", grupo: "⚡ Core & Abdomen", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Oblicuos", nombre: "Oblicuos (Internos & Externos)", icono: "⚡", grupo: "⚡ Core & Abdomen", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Transverso", nombre: "Transverso Abdominal (Core Profundo)", icono: "⚡", grupo: "⚡ Core & Abdomen", tipo: "cuerpo", defaultPct: 20 },
    { clave: "Core", nombre: "Core Completo & Estabilidad Troncal", icono: "⚡", grupo: "⚡ Core & Abdomen", tipo: "cuerpo", defaultPct: 20 },

    // 🧘 Salud Articular & Movilidad
    { clave: "Cuello", nombre: "Cuello & Zona Cervical", icono: "🧘", grupo: "🧘 Salud Articular & Movilidad", tipo: "cuerpo", defaultPct: 15 },
    { clave: "Articulaciones", nombre: "Muñecas, Codos y Tobillos", icono: "🔄", grupo: "🧘 Salud Articular & Movilidad", tipo: "cuerpo", defaultPct: 15 },
    { clave: "Movilidad", nombre: "Movilidad Articular Global", icono: "🥋", grupo: "🧘 Salud Articular & Movilidad", tipo: "cuerpo", defaultPct: 15 }
];

var ZONAS_EJERCICIO_FISICO_TEMP = [];

function poblarSelectZonasFisicas() {
    var sel = document.getElementById('select-zona-ejercicio-fisico');
    if (!sel) return;

    // Agrupar items por grupo para evitar saturación visual
    var grupos = {};
    CATALOGO_ZONAS_FISICAS.forEach(function(item) {
        var g = item.grupo || "Otras Zonas";
        if (!grupos[g]) grupos[g] = [];
        grupos[g].push(item);
    });

    var html = '<option value="">-- Seleccionar zona muscular para añadir --</option>';
    Object.keys(grupos).forEach(function(nombreGrupo) {
        html += `<optgroup label="${nombreGrupo}">`;
        grupos[nombreGrupo].forEach(function(item) {
            html += `<option value="${item.clave}">${item.icono} ${item.nombre}</option>`;
        });
        html += `</optgroup>`;
    });

    sel.innerHTML = html;
    sel.value = "";
}

function renderizarFilasZonasFisicas() {
    var cont = document.getElementById('lista-zonas-ejercicio-fisico');
    if (!cont) return;

    if (!ZONAS_EJERCICIO_FISICO_TEMP || ZONAS_EJERCICIO_FISICO_TEMP.length === 0) {
        cont.innerHTML = `
            <div style="font-size: 12px; color: #9ca3af; padding: 6px 4px; font-style: italic;">
                Ninguna zona muscular seleccionada. Elige una abajo y pulsa + Añadir para asociarla.
            </div>`;
        return;
    }

    var html = '';
    ZONAS_EJERCICIO_FISICO_TEMP.forEach(function(item) {
        html += `
        <div class="fila-atributo-item">
            <div class="fila-atributo-info">
                <span>${item.icono || '⚔️'}</span>
                <span>${item.nombre || item.clave}</span>
                <span class="fila-atributo-tipo-badge tipo-badge-cuerpo">Cuerpo</span>
            </div>
            <div class="fila-atributo-pct-box">
                <input type="number" class="input-atributo-pct" min="1" max="100" value="${item.porcentaje || 25}" onchange="actualizarPorcentajeZonaFisica('${item.clave}', this.value)" title="Porcentaje de impacto / fatiga">
                <span style="font-size: 12px; font-weight: 800; color: #94a3b8;">%</span>
                <button type="button" class="btn-quitar-atributo" onclick="quitarZonaFisicaModal('${item.clave}')" title="Quitar zona">✕</button>
            </div>
        </div>`;
    });
    cont.innerHTML = html;
}

function agregarZonaFisicaDesdeSelect(clave) {
    if (!clave) return;
    var zonaInfo = CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === clave; });
    if (!zonaInfo) return;

    if (!ZONAS_EJERCICIO_FISICO_TEMP) ZONAS_EJERCICIO_FISICO_TEMP = [];
    var yaExiste = ZONAS_EJERCICIO_FISICO_TEMP.some(function(z) { return z.clave === clave; });
    if (yaExiste) {
        alert("La zona '" + (zonaInfo.nombre || clave) + "' ya está en la lista.");
        var sel = document.getElementById('select-zona-ejercicio-fisico');
        if (sel) sel.value = "";
        return;
    }

    ZONAS_EJERCICIO_FISICO_TEMP.push({
        clave: zonaInfo.clave,
        nombre: zonaInfo.nombre,
        icono: zonaInfo.icono,
        porcentaje: zonaInfo.defaultPct || 25
    });

    renderizarFilasZonasFisicas();
    var selElem = document.getElementById('select-zona-ejercicio-fisico');
    if (selElem) selElem.value = "";
}

function agregarZonaFisicaDesdeBoton() {
    var sel = document.getElementById('select-zona-ejercicio-fisico');
    if (sel && sel.value) {
        agregarZonaFisicaDesdeSelect(sel.value);
    } else {
        alert("Por favor selecciona una zona muscular de la lista antes de pulsar + Añadir.");
    }
}

function actualizarPorcentajeZonaFisica(clave, valor) {
    var v = parseInt(valor, 10);
    if (isNaN(v) || v <= 0) v = 5;
    if (v > 100) v = 100;
    var item = ZONAS_EJERCICIO_FISICO_TEMP.find(function(z) { return z.clave === clave; });
    if (item) item.porcentaje = v;
}

function quitarZonaFisicaModal(clave) {
    ZONAS_EJERCICIO_FISICO_TEMP = ZONAS_EJERCICIO_FISICO_TEMP.filter(function(z) { return z.clave !== clave; });
    renderizarFilasZonasFisicas();
}

function formatearTiempoMMSS(totalSegundos) {
    var seg = Math.max(0, Math.round(totalSegundos || 0));
    var m = Math.floor(seg / 60);
    var s = seg % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

function cambiarModalidadEsfuerzoModal(modalidad) {
    var inMod = document.getElementById('modal-ejercicio-modalidad');
    var btnReps = document.getElementById('btn-modalidad-reps');
    var btnTiempo = document.getElementById('btn-modalidad-tiempo');
    var grpReps = document.getElementById('grupo-modal-reps-promedio');
    var grpTiempo = document.getElementById('grupo-modal-tiempo-segundos');
    var grpRangoReps = document.getElementById('grupo-modal-rango-reps');
    var grpHelpersTiempo = document.getElementById('grupo-modal-helpers-tiempo');

    if (inMod) inMod.value = modalidad;

    if (modalidad === 'tiempo') {
        if (btnReps) btnReps.classList.remove('active');
        if (btnTiempo) btnTiempo.classList.add('active');
        if (grpReps) grpReps.style.display = 'none';
        if (grpRangoReps) grpRangoReps.style.display = 'none';
        if (grpTiempo) grpTiempo.style.display = 'block';
        if (grpHelpersTiempo) grpHelpersTiempo.style.display = 'block';

        var inReps = document.getElementById('modal-ejercicio-reps');
        var inTSeg = document.getElementById('modal-ejercicio-tiempo-segundos');
        var tSeg = inTSeg ? (parseInt(inTSeg.value) || 60) : 60;
        if (inReps && (!inReps.value || inReps.value.includes('reps'))) {
            inReps.value = tSeg + 's isométrico (' + formatearTiempoMMSS(tSeg) + ')';
        }
        actualizarTiempoModal();
    } else {
        if (btnReps) btnReps.classList.add('active');
        if (btnTiempo) btnTiempo.classList.remove('active');
        if (grpReps) grpReps.style.display = 'block';
        if (grpRangoReps) grpRangoReps.style.display = 'block';
        if (grpTiempo) grpTiempo.style.display = 'none';
        if (grpHelpersTiempo) grpHelpersTiempo.style.display = 'none';

        var inReps2 = document.getElementById('modal-ejercicio-reps');
        if (inReps2 && (!inReps2.value || inReps2.value.includes('isométrico') || inReps2.value.includes('seg') || inReps2.value.includes('01:'))) {
            inReps2.value = '8-12 reps';
        }
        actualizarPromedioRepsModal();
    }
}

function asignarTiempoRapidoModal(segundos) {
    var inTSeg = document.getElementById('modal-ejercicio-tiempo-segundos');
    if (inTSeg) {
        inTSeg.value = segundos;
        actualizarTiempoModal();
    }
}

function actualizarTiempoModal() {
    var inTSeg = document.getElementById('modal-ejercicio-tiempo-segundos');
    var fmtEl = document.getElementById('modal-ejercicio-tiempo-formateado');
    var inReps = document.getElementById('modal-ejercicio-reps');
    var inPeso = document.getElementById('modal-ejercicio-peso');
    var inUnidad = document.getElementById('modal-ejercicio-unidad-peso');
    var txtRes = document.getElementById('modal-ejercicio-resumen-promedio-txt');

    var seg = inTSeg ? (parseInt(inTSeg.value) || 60) : 60;
    if (fmtEl) fmtEl.innerText = formatearTiempoMMSS(seg);
    if (inReps) inReps.value = seg + 's isométrico (' + formatearTiempoMMSS(seg) + ')';

    var unidad = inUnidad ? inUnidad.value : 'kg';
    var peso = inPeso ? (parseFloat(inPeso.value) || 0) : 0;
    var pesoTxt = peso > 0 ? (peso + ' ' + unidad + ' de lastre · ') : '';

    if (txtRes) {
        txtRes.innerHTML = '<strong style="color: #34d399;">Base 100% Fatiga (Tiempo Isométrico):</strong> ' + pesoTxt + seg + 's (' + formatearTiempoMMSS(seg) + '). En la rutina un temporizador medirá tu aguante en vivo; si superas este tiempo (ej: 1:30 min) se registrará tu nuevo récord personal y se actualizará tu tiempo promedio.';
    }
}

function actualizarPromedioRepsModal(manual) {
    var inMod = document.getElementById('modal-ejercicio-modalidad');
    if (inMod && inMod.value === 'tiempo') {
        actualizarTiempoModal();
        return;
    }

    var inReps = document.getElementById('modal-ejercicio-reps');
    var inProm = document.getElementById('modal-ejercicio-reps-promedio');
    var inPeso = document.getElementById('modal-ejercicio-peso');
    var inUnidad = document.getElementById('modal-ejercicio-unidad-peso');
    var txtRes = document.getElementById('modal-ejercicio-resumen-promedio-txt');
    if (!inReps || !inProm) return;

    var unidad = inUnidad ? inUnidad.value : 'kg';
    var prom = parseFloat(inProm.value) || 10;
    if (!manual) {
        var str = inReps.value || '';
        var nums = str.match(/\d+(\.\d+)?/g);
        if (nums && nums.length > 0) {
            if (nums.length === 1) {
                prom = parseFloat(nums[0]) || 10;
            } else {
                var n1 = parseFloat(nums[0]);
                var n2 = parseFloat(nums[1]);
                prom = Math.round(((n1 + n2) / 2) * 10) / 10;
            }
            inProm.value = prom;
        }
    }

    var peso = inPeso ? (parseFloat(inPeso.value) || 0) : 0;
    if (txtRes) {
        var pesoTxt = peso > 0 ? (peso + ' ' + unidad + ' × ') : '';
        txtRes.innerHTML = '<strong style="color: #38bdf8;">Base 100% Fatiga:</strong> ' + pesoTxt + prom + ' reps promedio. Si en tu rutina haces 8 o 12 reps, el sistema escalará la fatiga de cada serie proporcionalmente.';
    }
}

// ==========================================================================
// IMPORTACIÓN INTELIGENTE DE EJERCICIOS VÍA IA / TEXTO (v10.16)
// ==========================================================================

const PROMPT_MAESTRO_EJERCICIOS_IA = `Actúa como un Entrenador Biomecánico de Élite y Especialista en Ciencia del Ejercicio para la aplicación Sistema Monarca (Emily OS).

Genera uno o varios ejercicios físicos estructurados con precisión milimétrica en formato JSON válido siguiendo esta estructura estricta:

[
  {
    "nombre": "Press Militar con Mancuernas",
    "tipo": "gym",
    "implemento": "mancuerna",
    "unidadPeso": "kg",
    "pesoReferencia": 24,
    "modalidadEsfuerzo": "repeticiones",
    "repeticiones": "8-12 reps",
    "repeticionesPromedio": 10,
    "descripcion": "Espalda apoyada a 75-80°, codos a 45° en plano escapular. Empujar verticalmente sin chocar mancuernas, descenso excéntrico de 3s sintiendo estiramiento del deltoides.",
    "zonas": [
      { "clave": "Deltoides_Anterior", "porcentaje": 50 },
      { "clave": "Triceps_Lateral", "porcentaje": 30 },
      { "clave": "Pectoral_Superior", "porcentaje": 20 }
    ]
  },
  {
    "nombre": "Plancha Abdominal Isométrica",
    "tipo": "calistenia",
    "implemento": "peso_corporal",
    "unidadPeso": "kg",
    "pesoReferencia": 0,
    "modalidadEsfuerzo": "tiempo",
    "tiempoSegundos": 60,
    "repeticiones": "60s isométrico (01:00)",
    "repeticionesPromedio": 60,
    "descripcion": "Antebrazos paralelos, retroversión pélvica activa, glúteos y cuádriceps contraídos al 100% sin permitir que caiga la cadera.",
    "zonas": [
      { "clave": "Core", "porcentaje": 50 },
      { "clave": "Transverso", "porcentaje": 30 },
      { "clave": "Abdomen_Superior", "porcentaje": 20 }
    ]
  }
]

REGLAS DE ZONAS MUSCULARES:
1. En el array "zonas", usa EXCLUSIVAMENTE estas claves del catálogo oficial:
   - Pecho: "Pectoral_Superior", "Pectoral_Medio", "Pectoral_Inferior", "Pectoral_Aperturas", "Pecho"
   - Hombros: "Deltoides_Anterior", "Deltoides_Lateral", "Deltoides_Posterior", "Manguito_Rotador", "Hombros"
   - Espalda: "Dorsal_Ancho", "Espalda_Alta", "Trapecios", "Lumbares", "Espalda"
   - Brazos: "Biceps", "Braquial", "Triceps_Larga", "Triceps_Lateral", "Tríceps", "Antebrazos"
   - Piernas: "Cuadriceps", "Isquios", "Gluteo_Mayor", "Gluteo_Medio", "Glúteos", "Cadera", "Pantorrillas", "Soleo", "Tibial"
   - Core: "Abdomen_Superior", "Abdomen_Inferior", "Oblicuos", "Transverso", "Core"
   - Movilidad: "Cuello", "Articulaciones", "Movilidad"
2. Opciones de "implemento": "barra", "mancuerna", "maquina", "polea", "discos", "peso_corporal".
3. Opciones de "tipo": "gym", "calistenia", "movilidad".
4. Opciones de "modalidadEsfuerzo": "repeticiones" o "tiempo" (para planchas, wall-sit, L-sit, colgado en barra o estiramientos).
5. Si es por tiempo, especifica "tiempoSegundos": (ej: 60) y en repeticiones "60s isométrico".
6. Opciones de "unidadPeso": "kg" o "lb".
7. La suma de los porcentajes de las zonas debe totalizar entre 90% y 100%. La zona con mayor porcentaje será el estímulo principal.
8. Devuelve ÚNICAMENTE el bloque JSON sin explicaciones adicionales.`;

function abrirModalImportarEjercicioIA() {
    var m = document.getElementById('modal-importar-ejercicio-ia');
    if (m) m.style.display = 'flex';
    var prev = document.getElementById('preview-importar-ejercicio-ia');
    if (prev) { prev.style.display = 'none'; prev.innerHTML = ''; }
    var txt = document.getElementById('textarea-importar-ejercicio-ia');
    if (txt) {
        setTimeout(function() { txt.focus(); }, 100);
        if (!txt.dataset.previewBound) {
            txt.dataset.previewBound = "true";
            txt.addEventListener('input', function() {
                actualizarPreviewImportarEjercicioIA();
            });
            txt.addEventListener('paste', function() {
                setTimeout(actualizarPreviewImportarEjercicioIA, 50);
            });
        }
    }
}

function actualizarPreviewImportarEjercicioIA() {
    var txt = document.getElementById('textarea-importar-ejercicio-ia');
    var prev = document.getElementById('preview-importar-ejercicio-ia');
    if (!txt || !prev) return;
    var val = txt.value.trim();
    if (!val || val.length < 8) {
        prev.style.display = 'none';
        prev.innerHTML = '';
        return;
    }
    var lista = parsearEjercicioTextoOJson(val);
    if (!lista || lista.length === 0) {
        prev.style.display = 'none';
        prev.innerHTML = '';
        return;
    }

    var html = '<div style="font-size:11px; font-weight:700; color:#38bdf8; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:6px;"><span>👁️</span> Previsualización del Ejercicio Interpretado (' + lista.length + ')</div>';

    lista.forEach(function(ej, idx) {
        var impIcon = '🏋️';
        if (ej.implemento === 'mancuerna') impIcon = '🦾';
        else if (ej.implemento === 'maquina') impIcon = '⚙️';
        else if (ej.implemento === 'polea') impIcon = '🪢';
        else if (ej.implemento === 'discos') impIcon = '💿';
        else if (ej.implemento === 'peso_corporal') impIcon = '🤸';

        html += '<div style="background:rgba(15,23,42,0.7); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:10px; margin-bottom:' + (idx < lista.length - 1 ? '8px' : '0') + ';">';
        html += '<div style="font-weight:700; color:#f8fafc; font-size:13px; margin-bottom:4px;">' + ej.nombre + '</div>';
        html += '<div style="font-size:11.5px; color:#94a3b8; display:flex; flex-wrap:wrap; gap:8px; margin-bottom:6px;">';
        html += '<span>' + impIcon + ' ' + ej.implemento.toUpperCase() + '</span>';
        html += '<span>⚖️ ' + ej.pesoReferencia + ' ' + ej.unidadPeso + '</span>';
        html += '<span>🔢 ' + ej.repeticiones + '</span>';
        html += '</div>';

        html += '<div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:4px;">';
        ej.zonas.forEach(function(z) {
            html += '<span style="background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); border-radius:4px; padding:2px 6px; font-size:11px; font-weight:600;">' + (z.icono || '🎯') + ' ' + z.porcentaje + '% ' + (z.nombre || z.clave) + '</span>';
        });
        html += '</div>';
        html += '</div>';
    });

    prev.innerHTML = html;
    prev.style.display = 'block';
}

function cerrarModalImportarEjercicioIA() {
    var m = document.getElementById('modal-importar-ejercicio-ia');
    if (m) m.style.display = 'none';
}

function copiarPromptMaestroIA(btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(PROMPT_MAESTRO_EJERCICIOS_IA).then(function() {
            var orig = btn ? btn.innerHTML : '';
            if (btn) btn.innerHTML = '<span>✅</span> ¡Prompt Copiado!';
            setTimeout(function() { if (btn) btn.innerHTML = orig; }, 2500);
        }).catch(function() {
            prompt("Copia manualmente este prompt para dárselo a tu IA:", PROMPT_MAESTRO_EJERCICIOS_IA);
        });
    } else {
        prompt("Copia manualmente este prompt para dárselo a tu IA:", PROMPT_MAESTRO_EJERCICIOS_IA);
    }
}

function insertarEjemploTextoIA() {
    var txt = document.getElementById('textarea-importar-ejercicio-ia');
    if (!txt) return;
    txt.value = JSON.stringify([
        {
            "nombre": "Press Inclinado con Mancuernas",
            "tipo": "gym",
            "implemento": "mancuerna",
            "unidadPeso": "kg",
            "pesoReferencia": 28,
            "repeticiones": "8-12 reps",
            "repeticionesPromedio": 10,
            "descripcion": "Banco a 30°, retracción escapular activa, trayectoria en arco natural y pausa isométrica de 1s en la contracción superior.",
            "zonas": [
                { "clave": "Pectoral_Superior", "porcentaje": 55 },
                { "clave": "Deltoides_Anterior", "porcentaje": 25 },
                { "clave": "Triceps_Lateral", "porcentaje": 20 }
            ]
        }
    ], null, 2);
    actualizarPreviewImportarEjercicioIA();
}

function normalizarClaveZonaMuscular(raw) {
    if (!raw) return null;
    var str = String(raw).trim();
    // 1. Coincidencia exacta por clave de catálogo
    var exacto = CATALOGO_ZONAS_FISICAS.find(function(z) {
        return z.clave.toLowerCase() === str.toLowerCase();
    });
    if (exacto) return exacto;

    // 2. Coincidencia por nombre de catálogo
    var porNombre = CATALOGO_ZONAS_FISICAS.find(function(z) {
        return z.nombre.toLowerCase().includes(str.toLowerCase()) || str.toLowerCase().includes(z.clave.toLowerCase());
    });
    if (porNombre) return porNombre;

    // 3. Coincidencia heurística biomecánica
    var s = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (/pect.*sup|inclinad/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Pectoral_Superior'; });
    if (/pect.*inf|declinad/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Pectoral_Inferior'; });
    if (/pect.*med|plano/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Pectoral_Medio'; });
    if (/pecho|pect/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Pecho'; });

    if (/delt.*ant|front/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Deltoides_Anterior'; });
    if (/delt.*lat|vuelo|lateral/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Deltoides_Lateral'; });
    if (/delt.*post|pajaro|face.*pull/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Deltoides_Posterior'; });
    if (/manguito|rotador/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Manguito_Rotador'; });
    if (/hombro|deltoid/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Hombros'; });

    if (/dorsal|latiss|jalon|amplitud/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Dorsal_Ancho'; });
    if (/espalda.*alt|romboide|remo/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Espalda_Alta'; });
    if (/trapecio|shrug/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Trapecios'; });
    if (/lumbar|espinal/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Lumbares'; });
    if (/espalda/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Espalda'; });

    if (/braquial|martillo/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Braquial'; });
    if (/bicep|curl/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Biceps'; });
    if (/tricep.*larg|frances/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Triceps_Larga'; });
    if (/tricep.*lat|polea/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Triceps_Lateral'; });
    if (/tricep/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Tríceps'; });
    if (/antebrazo|agarre/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Antebrazos'; });

    if (/cuadricep|squat|sentadilla|prensa/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Cuadriceps'; });
    if (/isquio|femoral|rumano/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Isquios'; });
    if (/gluteo.*may|hip.*thrust/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Gluteo_Mayor'; });
    if (/gluteo.*med|abduc/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Gluteo_Medio'; });
    if (/gluteo/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Glúteos'; });
    if (/cadera|aductor/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Cadera'; });
    if (/soleo/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Soleo'; });
    if (/tibial/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Tibial'; });
    if (/pantorrilla|gemelo/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Pantorrillas'; });

    if (/abdom.*sup/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Abdomen_Superior'; });
    if (/abdom.*inf/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Abdomen_Inferior'; });
    if (/oblicuo/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Oblicuos'; });
    if (/transverso|vacio/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Transverso'; });
    if (/core|abdom/.test(s)) return CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === 'Core'; });

    return CATALOGO_ZONAS_FISICAS[0];
}

function extraerZonasDeTextoResiliente(textoBloque) {
    var zonas = [];
    if (!textoBloque || typeof textoBloque !== 'string') return zonas;

    // 1. Aislar bloque de zonas si existe delimitador 'zonas: [' o 'zonas:'
    var mBloque = textoBloque.match(/zonas?\s*:\s*\[([\s\S]*?)\]/i) || 
                  textoBloque.match(/zonas?\s*:\s*([\s\S]*?)(?=(?:\n\s*["']?[a-zA-Z_]+["']?\s*:|\n\s*\}|$))/i);
    var fuenteZonas = mBloque ? mBloque[1] : textoBloque;

    // Patrón A: { clave: Pectoral_Medio porcentaje: 8 } o { clave: "X", porcentaje: 8 } o clave: X, porcentaje: 8
    var regPares = /(?:\{|\b)(?:clave|zona|musculo|target|nombre)?\s*[:=]?\s*["']?([A-Za-z0-9_ÁÉÍÓÚáéíóúñÑ-]+?)["']?[\s,;]+(?:porcentaje|pct|puntos|ratio|valor|estimulo)?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%?\s*(?:\}|\b)/gi;
    var m;
    while ((m = regPares.exec(fuenteZonas)) !== null) {
        var cr = m[1].trim();
        if (/^(nombre|tipo|implemento|unidadpeso|pesoreferencia|repeticiones|repeticionespromedio|descripcion|zonas)$/i.test(cr)) continue;
        var pNum = parseFloat(m[2]);
        var zInfo = normalizarClaveZonaMuscular(cr);
        if (zInfo && !isNaN(pNum) && pNum > 0 && !zonas.some(function(z) { return z.clave === zInfo.clave; })) {
            zonas.push({
                clave: zInfo.clave,
                nombre: zInfo.nombre,
                icono: zInfo.icono,
                rawPct: pNum
            });
        }
    }

    // Patrón B: Lista con viñetas o líneas sueltas tipo "- Pectoral_Medio: 50%" o "Pectoral_Medio: 8"
    if (zonas.length === 0) {
        var lineasZ = fuenteZonas.split('\n');
        lineasZ.forEach(function(lz) {
            var lzTrim = lz.trim();
            if (!lzTrim) return;
            var numMatch = lzTrim.match(/(\d+(?:\.\d+)?)\s*%?/);
            if (numMatch) {
                var cr2 = lzTrim.replace(numMatch[0], '').replace(/[-*•{}:,"'\[\]]/g, '').trim();
                if (/^(nombre|tipo|implemento|unidadpeso|pesoreferencia|repeticiones|repeticionespromedio|descripcion|zonas)$/i.test(cr2)) return;
                var zInfo2 = normalizarClaveZonaMuscular(cr2);
                if (zInfo2 && !zonas.some(function(z) { return z.clave === zInfo2.clave; })) {
                    zonas.push({
                        clave: zInfo2.clave,
                        nombre: zInfo2.nombre,
                        icono: zInfo2.icono,
                        rawPct: parseFloat(numMatch[1])
                    });
                }
            }
        });
    }

    // Respetar el valor literal exacto colocado por el usuario (sin multiplicaciones forzadas)
    if (zonas.length > 0) {
        zonas.forEach(function(z) {
            z.porcentaje = Math.round(z.rawPct);
        });
        zonas.sort(function(a, b) { return (b.porcentaje || 0) - (a.porcentaje || 0); });
    }

    return zonas;
}

function parsearEjercicioTextoOJson(raw) {
    if (!raw || typeof raw !== 'string') return [];
    var str = raw.trim();

    // 1. Extraer si viene envuelto en markdown ```json ... ``` o ``` ... ```
    var jsonMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    var candidateJson = jsonMatch ? jsonMatch[1].trim() : str;

    // 2. Intentar parsear como JSON estricto
    try {
        var parsed = JSON.parse(candidateJson);
        var arrayJson = Array.isArray(parsed) ? parsed : [parsed];
        var res = [];
        arrayJson.forEach(function(item) {
            if (!item || typeof item !== 'object') return;
            var nom = item.nombre || item.name || item.titulo || "Ejercicio Biomecánico";
            var desc = item.descripcion || item.description || item.tecnica || item.especificaciones || "Técnica controlada.";
            var tipo = (item.tipo || item.type || "gym").toLowerCase();
            if (!['gym', 'calistenia', 'movilidad'].includes(tipo)) tipo = 'gym';

            var imp = (item.implemento || item.equipamiento || item.equipment || "mancuerna").toLowerCase();
            if (/mancuerna|dumbbell/.test(imp)) imp = 'mancuerna';
            else if (/barra|barbell/.test(imp)) imp = 'barra';
            else if (/maquina|machine/.test(imp)) imp = 'maquina';
            else if (/polea|cable/.test(imp)) imp = 'polea';
            else if (/disco|plate/.test(imp)) imp = 'discos';
            else if (/corporal|calistenia|peso corporal|bodyweight/.test(imp)) imp = 'peso_corporal';
            else imp = 'mancuerna';

            var unidad = (item.unidadPeso || item.unidad || item.unit || "kg").toLowerCase();
            if (/lb|libra/.test(unidad)) unidad = 'lb'; else unidad = 'kg';

            var peso = parseFloat(item.pesoReferencia || item.peso || item.weight) || 0;
            var reps = String(item.repeticiones || item.reps || "8-12 reps");
            var repsProm = parseFloat(item.repeticionesPromedio || item.promedio || item.repsPromedio) || 10;

            // Procesar zonas
            var rawZonas = item.zonas || item.musculos || item.muscles || [];
            var zonasFinales = [];
            if (Array.isArray(rawZonas)) {
                rawZonas.forEach(function(z) {
                    var claveRaw = (typeof z === 'string') ? z : (z.clave || z.nombre || z.zona || z.musculo);
                    var pct = (typeof z === 'object' && (z.porcentaje || z.pct || z.puntos)) ? parseFloat(z.porcentaje || z.pct || z.puntos) : 25;
                    var zInfo = normalizarClaveZonaMuscular(claveRaw);
                    if (zInfo && !zonasFinales.some(function(zf) { return zf.clave === zInfo.clave; })) {
                        zonasFinales.push({
                            clave: zInfo.clave,
                            nombre: zInfo.nombre,
                            icono: zInfo.icono,
                            porcentaje: Math.round(isNaN(pct) || pct <= 0 ? (zInfo.defaultPct || 25) : pct)
                        });
                    }
                });
            }

            if (zonasFinales.length === 0) {
                var zDef = CATALOGO_ZONAS_FISICAS[0];
                zonasFinales.push({
                    clave: zDef.clave,
                    nombre: zDef.nombre,
                    icono: zDef.icono,
                    porcentaje: 40
                });
            }

            zonasFinales.sort(function(a, b) { return (b.porcentaje || 0) - (a.porcentaje || 0); });

            var modExplicit = (item.modalidadEsfuerzo || item.modalidad || '').toLowerCase().trim();
            var esTiempo = false;
            if (modExplicit === 'tiempo' || modExplicit === 'isometrico' || modExplicit === 'isométrico') {
                esTiempo = true;
            } else if (modExplicit === 'repeticiones' || modExplicit === 'reps') {
                esTiempo = false;
            } else if ((item.tiempo != null && item.tiempo > 0) || (item.tiempoSegundos != null && item.tiempoSegundos > 0)) {
                esTiempo = true;
            } else {
                var esRepsTiempo = /\b\d+\s*(?:s|seg|segundos|min|minutos)\b/i.test(reps) && !/\breps?\b/i.test(reps);
                var esNombreTiempo = /\b(?:plank|plancha|wall\s*sit|dead\s*hang|colgado\s+en\s+barra|l-sit)\b/i.test(nom);
                esTiempo = esRepsTiempo || esNombreTiempo;
            }

            var tiempoSeg = parseFloat(item.tiempoSegundos || item.tiempo) || 0;
            if (!tiempoSeg && esTiempo) {
                var mSeg = reps.match(/(\d+)\s*(?:s|seg|segundos)/i);
                var mMin = reps.match(/(\d+(?:\.\d+)?)\s*(?:m|min|minutos)/i);
                if (mSeg) tiempoSeg = parseFloat(mSeg[1]);
                else if (mMin) tiempoSeg = Math.round(parseFloat(mMin[1]) * 60);
                else tiempoSeg = repsProm > 0 ? repsProm : 60;
            }

            res.push({
                nombre: nom,
                descripcion: desc,
                tipo: tipo,
                implemento: imp,
                unidadPeso: unidad,
                pesoReferencia: peso,
                modalidadEsfuerzo: esTiempo ? 'tiempo' : 'repeticiones',
                tiempoSegundos: esTiempo ? (tiempoSeg || 60) : 0,
                repeticiones: esTiempo ? ((tiempoSeg || 60) + 's isométrico (' + formatearTiempoMMSS(tiempoSeg || 60) + ')') : reps,
                repeticionesPromedio: esTiempo ? (tiempoSeg || 60) : repsProm,
                zonas: zonasFinales
            });
        });
        if (res.length > 0) return res;
    } catch (e) {
        // Fallback a parser ultra-permisivo de pseudo-JSON / texto
    }

    // 3. Parser Ultra-Permisivo de Pseudo-JSON / Objeto JS Relajado / Texto Estructurado
    // Extraer bloques de objetos { ... } de nivel raíz usando balance de llaves
    var bloques = [];
    var strLimpio = candidateJson.trim();
    if (strLimpio.startsWith('[') && strLimpio.endsWith(']')) {
        strLimpio = strLimpio.substring(1, strLimpio.length - 1).trim();
    }

    var depth = 0;
    var inicioBloque = -1;
    for (var bi = 0; bi < strLimpio.length; bi++) {
        var charB = strLimpio[bi];
        if (charB === '{') {
            if (depth === 0) {
                inicioBloque = bi;
            }
            depth++;
        } else if (charB === '}') {
            depth--;
            if (depth === 0 && inicioBloque !== -1) {
                var blk = strLimpio.substring(inicioBloque, bi + 1).trim();
                if (/(?:nombre|tipo|implemento|peso|repeticion|zona)/i.test(blk)) {
                    bloques.push(blk);
                }
                inicioBloque = -1;
            }
        }
    }

    if (bloques.length === 0) {
        bloques = [candidateJson];
    }

    var resultados = [];

    bloques.forEach(function(bloque) {
        // Extraer campos principales con Regex tolerante
        var mNom = bloque.match(/(?:^|\n)\s*["']?nombre["']?\s*:\s*["']?([^,\n\}]+)/i);
        var nomTxt = mNom ? mNom[1].replace(/["']/g, '').trim() : "";

        var mTipo = bloque.match(/(?:^|\n)\s*["']?tipo["']?\s*:\s*["']?([^,\n\}]+)/i);
        var tipoTxt = (mTipo ? mTipo[1].replace(/["']/g, '').trim() : "gym").toLowerCase();
        if (/calistenia/.test(tipoTxt)) tipoTxt = 'calistenia';
        else if (/movilidad/.test(tipoTxt)) tipoTxt = 'movilidad';
        else tipoTxt = 'gym';

        var mImp = bloque.match(/(?:^|\n)\s*["']?(?:implemento|equipamiento|equipo|material)["']?\s*:\s*["']?([^,\n\}]+)/i);
        var impTxt = (mImp ? mImp[1].replace(/["']/g, '').trim() : "barra").toLowerCase();
        if (/mancuerna|dumbbell/.test(impTxt)) impTxt = 'mancuerna';
        else if (/barra|barbell/.test(impTxt)) impTxt = 'barra';
        else if (/maquina|machine/.test(impTxt)) impTxt = 'maquina';
        else if (/polea|cable/.test(impTxt)) impTxt = 'polea';
        else if (/disco|plate/.test(impTxt)) impTxt = 'discos';
        else if (/corporal|calistenia|bodyweight/.test(impTxt)) impTxt = 'peso_corporal';
        else impTxt = 'barra';

        var mUni = bloque.match(/(?:^|\n)\s*["']?unidad(?:peso)?["']?\s*:\s*["']?([^,\n\}]+)/i);
        var unidadTxt = (mUni && /lb|libra/.test(mUni[1].toLowerCase())) ? 'lb' : 'kg';

        var mPeso = bloque.match(/(?:^|\n)\s*["']?peso(?:referencia)?["']?\s*:\s*["']?(\d+(?:\.\d+)?)/i);
        var pesoTxt = mPeso ? parseFloat(mPeso[1]) : 0;
        if (/lb|libra/.test(bloque.toLowerCase()) && !mUni) {
            if (/pesoReferencia:\s*\d+\s*lb/i.test(bloque) || /peso:\s*\d+\s*lb/i.test(bloque)) unidadTxt = 'lb';
        }

        var mReps = bloque.match(/(?:^|\n)\s*["']?repeticiones["']?\s*:\s*["']?([^,\n\}]+)/i);
        var repsTxt = mReps ? mReps[1].replace(/["']/g, '').trim() : "8-12 reps";

        var mProm = bloque.match(/(?:^|\n)\s*["']?repeticionespromedio["']?\s*:\s*["']?(\d+(?:\.\d+)?)/i);
        var repsPromTxt = mProm ? parseFloat(mProm[1]) : 10;
        if (!mProm && repsTxt) {
            var rDigits = repsTxt.match(/\d+/g);
            if (rDigits && rDigits.length > 0) {
                repsPromTxt = parseFloat(rDigits[0]);
                if (rDigits.length > 1) repsPromTxt = (parseFloat(rDigits[0]) + parseFloat(rDigits[1])) / 2;
            }
        }

        // Descripción: capturar hasta la siguiente propiedad o bloque de zonas
        var mDesc = bloque.match(/(?:^|\n)\s*["']?descripci[oó]n["']?\s*:\s*["']?([\s\S]*?)(?=(?:\n\s*["']?[a-zA-Z_]+["']?\s*:|\n\s*zonas:|\n\s*[a-z?¿]+\s*\?|\n\s*\}|$))/i);
        var descTxt = mDesc ? mDesc[1].replace(/["']/g, '').trim() : "";

        // Modalidad y tiempo
        var mMod = bloque.match(/(?:^|\n)\s*["']?modalidad(?:esfuerzo)?["']?\s*:\s*["']?([^,\n\}]+)/i);
        var modTxt = mMod ? mMod[1].replace(/["']/g, '').trim().toLowerCase() : "";
        var mTiempo = bloque.match(/(?:^|\n)\s*["']?tiempo(?:segundos)?["']?\s*:\s*["']?(\d+(?:\.\d+)?)/i);
        var tiempoTxt = mTiempo ? parseFloat(mTiempo[1]) : 0;

        var esTiempoTxt = false;
        if (modTxt === 'tiempo' || modTxt === 'isometrico' || modTxt === 'isométrico') {
            esTiempoTxt = true;
        } else if (modTxt === 'repeticiones' || modTxt === 'reps') {
            esTiempoTxt = false;
        } else if (tiempoTxt > 0) {
            esTiempoTxt = true;
        } else {
            var esRepsT = /\b\d+\s*(?:s|seg|segundos|min|minutos)\b/i.test(repsTxt) && !/\breps?\b/i.test(repsTxt);
            var esNomT = /\b(?:plank|plancha|wall\s*sit|dead\s*hang|colgado\s+en\s+barra|l-sit)\b/i.test(nomTxt);
            esTiempoTxt = esRepsT || esNomT;
        }
        if (!tiempoTxt && esTiempoTxt) {
            var mS = repsTxt.match(/(\d+)\s*(?:s|seg|segundos)/i);
            var mM = repsTxt.match(/(\d+(?:\.\d+)?)\s*(?:m|min|minutos)/i);
            if (mS) tiempoTxt = parseFloat(mS[1]);
            else if (mM) tiempoTxt = Math.round(parseFloat(mM[1]) * 60);
            else tiempoTxt = repsPromTxt > 0 ? repsPromTxt : 60;
        }

        // Extraer zonas con el motor tolerante
        var zonasTxt = extraerZonasDeTextoResiliente(bloque);

        // Fallback para campos faltantes
        if (!nomTxt) {
            var lineasLimpias = bloque.split('\n').map(function(l) { return l.replace(/^[-*•#{}\[\]]/g, '').trim(); }).filter(Boolean);
            if (lineasLimpias.length > 0) nomTxt = lineasLimpias[0];
        }
        if (!descTxt) {
            descTxt = "Técnica biomecánica controlada según especificaciones del ejercicio.";
        }
        if (zonasTxt.length === 0) {
            var defZ = CATALOGO_ZONAS_FISICAS[0];
            zonasTxt.push({ clave: defZ.clave, nombre: defZ.nombre, icono: defZ.icono, porcentaje: 40 });
        }

        resultados.push({
            nombre: nomTxt || "Ejercicio Personalizado IA",
            descripcion: descTxt,
            tipo: tipoTxt,
            implemento: impTxt,
            unidadPeso: unidadTxt,
            pesoReferencia: pesoTxt,
            modalidadEsfuerzo: esTiempoTxt ? 'tiempo' : 'repeticiones',
            tiempoSegundos: esTiempoTxt ? (tiempoTxt || 60) : 0,
            repeticiones: esTiempoTxt ? ((tiempoTxt || 60) + 's isométrico (' + formatearTiempoMMSS(tiempoTxt || 60) + ')') : repsTxt,
            repeticionesPromedio: esTiempoTxt ? (tiempoTxt || 60) : repsPromTxt,
            zonas: zonasTxt
        });
    });

    return resultados;
}

function procesarTextoEjercicioIA(guardarDirecto) {
    var txt = document.getElementById('textarea-importar-ejercicio-ia');
    if (!txt || !txt.value.trim()) {
        alert("Por favor pega el texto o JSON del ejercicio generado por la IA.");
        if (txt) txt.focus();
        return;
    }

    var lista = parsearEjercicioTextoOJson(txt.value);
    if (!lista || lista.length === 0) {
        alert("No se pudo interpretar el ejercicio. Asegúrate de pegar el formato JSON o texto estructurado.");
        return;
    }

    if (guardarDirecto) {
        if (!APP_STATE.ejercicios) APP_STATE.ejercicios = [];
        var creados = 0;

        lista.forEach(function(item) {
            var muscPrincipal = item.zonas[0].clave;
            var fatigaEstimada = item.zonas[0].porcentaje || 25;
            var categorias = item.zonas.map(function(z) { return z.clave; });

            var nuevo = {
                id: "EJ-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
                nombre: item.nombre,
                tipo: item.tipo,
                implemento: item.implemento,
                equipamiento: item.implemento,
                unidadPeso: item.unidadPeso,
                compuesto: true,
                especificaciones: item.descripcion,
                descripcion: item.descripcion,
                musculoPrincipal: muscPrincipal,
                series: 1,
                peso: item.pesoReferencia,
                pesoReferencia: item.pesoReferencia,
                modalidadEsfuerzo: item.modalidadEsfuerzo || 'repeticiones',
                tiempoSegundos: item.tiempoSegundos || (item.modalidadEsfuerzo === 'tiempo' ? 60 : 0),
                tiempoReferencia: item.tiempoSegundos || (item.modalidadEsfuerzo === 'tiempo' ? 60 : 0),
                repeticiones: item.repeticiones,
                repeticionesPromedio: item.repeticionesPromedio,
                zonas: item.zonas,
                categorias: categorias,
                fatigaPorcentaje: fatigaEstimada,
                timestamp: Date.now(),
                fechaActualizacion: Date.now()
            };

            APP_STATE.ejercicios.push(nuevo);
            creados++;
        });

        if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
            MonarcaDB.save(APP_STATE);
        }

        cerrarModalImportarEjercicioIA();
        renderizarEjercicios(APP_STATE.ejercicios);
        txt.value = "";

        alert("⚡ " + creados + (creados === 1 ? " ejercicio importado" : " ejercicios importados") + " y guardado(s) exitosamente en tu Arsenal Físico.");
    } else {
        // Cargar en el formulario modal para previsualizar/editar
        var primero = lista[0];
        cerrarModalImportarEjercicioIA();
        abrirModalNuevoEjercicio();

        var inNom = document.getElementById('modal-ejercicio-nombre');
        var inDesc = document.getElementById('modal-ejercicio-desc');
        var inTipo = document.getElementById('modal-ejercicio-tipo');
        var inImp = document.getElementById('modal-ejercicio-implemento');
        var inPeso = document.getElementById('modal-ejercicio-peso');
        var inUni = document.getElementById('modal-ejercicio-unidad-peso');
        var inReps = document.getElementById('modal-ejercicio-reps');
        var inProm = document.getElementById('modal-ejercicio-reps-promedio');
        var inTSeg = document.getElementById('modal-ejercicio-tiempo-segundos');

        if (inNom) inNom.value = primero.nombre;
        if (inDesc) inDesc.value = primero.descripcion;
        if (inTipo) inTipo.value = primero.tipo;
        if (inImp) inImp.value = primero.implemento;
        if (inPeso) inPeso.value = primero.pesoReferencia;
        if (inUni) inUni.value = primero.unidadPeso;
        if (inReps) inReps.value = primero.repeticiones;
        if (inProm) inProm.value = primero.repeticionesPromedio;

        if (primero.modalidadEsfuerzo === 'tiempo') {
            cambiarModalidadEsfuerzoModal('tiempo');
            if (inTSeg) inTSeg.value = primero.tiempoSegundos || 60;
            actualizarTiempoModal();
        } else {
            cambiarModalidadEsfuerzoModal('repeticiones');
        }

        ZONAS_EJERCICIO_FISICO_TEMP = JSON.parse(JSON.stringify(primero.zonas));
        renderizarFilasZonasFisicas();

        alert("📝 Ejercicio precargado en el formulario.\nRevisa los campos y pulsa 'Guardar Ejercicio Físico' cuando estés listo.");
    }
}

var ID_EJERCICIO_EN_EDICION = null;

function abrirModalEditarEjercicio(id) {
    if (!id || !APP_STATE.ejercicios) return;
    var ej = APP_STATE.ejercicios.find(function(e) { return String(e.id) === String(id); });
    if (!ej) return;

    ID_EJERCICIO_EN_EDICION = id;

    // Actualizar títulos del modal a modo Edición
    var tituloModal = document.getElementById('modal-nuevo-ejercicio-titulo');
    var iconoModal = document.getElementById('modal-nuevo-ejercicio-icono');
    var btnGuardar = document.getElementById('btn-guardar-ejercicio-modal');

    if (tituloModal) tituloModal.innerText = "EDITAR EJERCICIO FÍSICO";
    if (iconoModal) iconoModal.innerText = "✏️";
    if (btnGuardar) btnGuardar.innerText = "💾 Guardar Cambios";

    // Cargar campos existentes
    var inNom = document.getElementById('modal-ejercicio-nombre');
    var inDesc = document.getElementById('modal-ejercicio-desc');
    var inPeso = document.getElementById('modal-ejercicio-peso');
    var inReps = document.getElementById('modal-ejercicio-reps');
    var inProm = document.getElementById('modal-ejercicio-reps-promedio');
    var inImp = document.getElementById('modal-ejercicio-implemento');
    var inTipo = document.getElementById('modal-ejercicio-tipo');
    var inUni = document.getElementById('modal-ejercicio-unidad-peso');

    if (inNom) inNom.value = ej.nombre || "";
    if (inDesc) inDesc.value = ej.especificaciones || ej.descripcion || "";
    if (inPeso) inPeso.value = (ej.peso != null && !isNaN(ej.peso)) ? ej.peso : (ej.pesoReferencia || 80);
    if (inReps) inReps.value = ej.repeticiones || "8-12 reps";
    if (inProm) inProm.value = ej.repeticionesPromedio || 10;
    if (inImp) inImp.value = ej.implemento || ej.equipamiento || "barra";
    if (inTipo) inTipo.value = ej.tipo || "gym";
    if (inUni) inUni.value = ej.unidadPeso || "kg";

    // Cargar modalidad de esfuerzo (repeticiones vs tiempo isométrico)
    var inTSeg = document.getElementById('modal-ejercicio-tiempo-segundos');
    if (ej.modalidadEsfuerzo === 'tiempo' || (ej.tiempoSegundos != null && ej.tiempoSegundos > 0)) {
        cambiarModalidadEsfuerzoModal('tiempo');
        if (inTSeg) inTSeg.value = ej.tiempoSegundos || ej.repeticionesPromedio || 60;
        actualizarTiempoModal();
    } else {
        cambiarModalidadEsfuerzoModal('repeticiones');
        actualizarPromedioRepsModal(true);
    }

    // Cargar desglose de zonas
    ZONAS_EJERCICIO_FISICO_TEMP = [];
    if (ej.zonas && Array.isArray(ej.zonas) && ej.zonas.length > 0) {
        ZONAS_EJERCICIO_FISICO_TEMP = JSON.parse(JSON.stringify(ej.zonas));
    } else {
        var preClave = ej.musculoPrincipal || (ej.categorias && ej.categorias[0]) || "Pectoral_Medio";
        var zInfo = normalizarClaveZonaMuscular(preClave) || CATALOGO_ZONAS_FISICAS[0];
        ZONAS_EJERCICIO_FISICO_TEMP.push({
            clave: zInfo.clave,
            nombre: zInfo.nombre,
            icono: zInfo.icono,
            porcentaje: ej.fatigaPorcentaje || 25
        });
    }

    poblarSelectZonasFisicas();
    renderizarFilasZonasFisicas();

    var m = document.getElementById('modal-nuevo-ejercicio');
    if (m) m.style.display = 'flex';
}

function abrirModalNuevoEjercicio(grupoPreseleccionado) {
    ID_EJERCICIO_EN_EDICION = null;

    var tituloModal = document.getElementById('modal-nuevo-ejercicio-titulo');
    var iconoModal = document.getElementById('modal-nuevo-ejercicio-icono');
    var btnGuardar = document.getElementById('btn-guardar-ejercicio-modal');

    if (tituloModal) tituloModal.innerText = "CREAR NUEVO EJERCICIO FÍSICO";
    if (iconoModal) iconoModal.innerText = "🏋️‍♂️";
    if (btnGuardar) btnGuardar.innerText = "✓ Guardar Ejercicio Físico";

    var inNom = document.getElementById('modal-ejercicio-nombre');
    var inDesc = document.getElementById('modal-ejercicio-desc');
    var inPeso = document.getElementById('modal-ejercicio-peso');
    var inReps = document.getElementById('modal-ejercicio-reps');
    var inProm = document.getElementById('modal-ejercicio-reps-promedio');
    var inImp = document.getElementById('modal-ejercicio-implemento');
    var inTipo = document.getElementById('modal-ejercicio-tipo');
    var inUni = document.getElementById('modal-ejercicio-unidad-peso');
    var inTSeg = document.getElementById('modal-ejercicio-tiempo-segundos');

    if (inNom) inNom.value = "";
    if (inDesc) inDesc.value = "";
    if (inPeso) inPeso.value = "80";
    if (inReps) inReps.value = "8-12 reps";
    if (inProm) inProm.value = "10";
    if (inTSeg) inTSeg.value = "60";
    if (inTipo) inTipo.value = (grupoPreseleccionado === 'calistenia' ? 'calistenia' : (grupoPreseleccionado === 'movilidad' ? 'movilidad' : 'gym'));
    if (inImp) inImp.value = (grupoPreseleccionado === 'calistenia' ? 'peso_corporal' : 'barra');
    if (inUni) inUni.value = "kg";

    cambiarModalidadEsfuerzoModal('repeticiones');
    actualizarPromedioRepsModal();

    ZONAS_EJERCICIO_FISICO_TEMP = [];
    var preZona = grupoPreseleccionado || "Pecho";
    var infoPre = CATALOGO_ZONAS_FISICAS.find(function(z) { return z.clave === preZona; }) || CATALOGO_ZONAS_FISICAS[0];
    ZONAS_EJERCICIO_FISICO_TEMP.push({
        clave: infoPre.clave,
        nombre: infoPre.nombre,
        icono: infoPre.icono,
        porcentaje: 25
    });

    poblarSelectZonasFisicas();
    renderizarFilasZonasFisicas();

    var m = document.getElementById('modal-nuevo-ejercicio');
    if (m) m.style.display = 'flex';
}

function cerrarModalNuevoEjercicio() {
    ID_EJERCICIO_EN_EDICION = null;
    var m = document.getElementById('modal-nuevo-ejercicio');
    if (m) m.style.display = 'none';
}

function confirmarAgregarEjercicio() {
    var inNom = document.getElementById('modal-ejercicio-nombre');
    var inTipo = document.getElementById('modal-ejercicio-tipo');
    var inImp = document.getElementById('modal-ejercicio-implemento');
    var inUni = document.getElementById('modal-ejercicio-unidad-peso');
    var inDesc = document.getElementById('modal-ejercicio-desc');
    var inPeso = document.getElementById('modal-ejercicio-peso');
    var inReps = document.getElementById('modal-ejercicio-reps');
    var inProm = document.getElementById('modal-ejercicio-reps-promedio');
    var inMod = document.getElementById('modal-ejercicio-modalidad');
    var inTSeg = document.getElementById('modal-ejercicio-tiempo-segundos');

    var nom = inNom ? inNom.value.trim() : "";
    var tipoEj = inTipo ? inTipo.value : "gym";
    var implemento = inImp ? inImp.value : (tipoEj === 'calistenia' ? 'peso_corporal' : 'barra');
    var unidadPeso = inUni ? inUni.value : "kg";
    var esCompuesto = true;
    var desc = inDesc ? inDesc.value.trim() : "";
    var pesoBase = inPeso ? (parseFloat(inPeso.value) || 0) : 0;
    var modalidad = inMod ? inMod.value : "repeticiones";
    var tiempoSeg = inTSeg ? (parseFloat(inTSeg.value) || 60) : 60;
    var esTiempo = (modalidad === 'tiempo');

    var reps = esTiempo 
        ? (tiempoSeg + 's isométrico (' + formatearTiempoMMSS(tiempoSeg) + ')') 
        : (inReps ? inReps.value.trim() : "8-12 reps");
    var repsProm = esTiempo 
        ? tiempoSeg 
        : (inProm ? (parseFloat(inProm.value) || 10) : 10);
    var series = 1;

    if (!nom) {
        alert("Por favor ingresa el nombre del ejercicio.");
        if (inNom) inNom.focus();
        return;
    }

    if (!ZONAS_EJERCICIO_FISICO_TEMP || ZONAS_EJERCICIO_FISICO_TEMP.length === 0) {
        alert("Por favor añade al menos una zona muscular trabajada con su porcentaje de estímulo.");
        return;
    }

    if (!APP_STATE.ejercicios) APP_STATE.ejercicios = [];

    // Ordenar zonas por mayor porcentaje para determinar la principal
    var zonasCopia = JSON.parse(JSON.stringify(ZONAS_EJERCICIO_FISICO_TEMP));
    zonasCopia.sort(function(a, b) { return (b.porcentaje || 0) - (a.porcentaje || 0); });

    var muscPrincipal = zonasCopia[0].clave;
    var fatigaEstimada = zonasCopia[0].porcentaje || 25;
    var categorias = zonasCopia.map(function(z) { return z.clave; });

    // MODO EDICIÓN
    if (ID_EJERCICIO_EN_EDICION) {
        var idxExistente = APP_STATE.ejercicios.findIndex(function(e) { return String(e.id) === String(ID_EJERCICIO_EN_EDICION); });
        if (idxExistente !== -1) {
            APP_STATE.ejercicios[idxExistente].nombre = nom;
            APP_STATE.ejercicios[idxExistente].tipo = tipoEj;
            APP_STATE.ejercicios[idxExistente].implemento = implemento;
            APP_STATE.ejercicios[idxExistente].equipamiento = implemento;
            APP_STATE.ejercicios[idxExistente].unidadPeso = unidadPeso;
            APP_STATE.ejercicios[idxExistente].especificaciones = desc || "Técnica biomecánica controlada.";
            APP_STATE.ejercicios[idxExistente].descripcion = desc || "Técnica biomecánica controlada.";
            APP_STATE.ejercicios[idxExistente].musculoPrincipal = muscPrincipal;
            APP_STATE.ejercicios[idxExistente].peso = pesoBase;
            APP_STATE.ejercicios[idxExistente].pesoReferencia = pesoBase;
            APP_STATE.ejercicios[idxExistente].modalidadEsfuerzo = modalidad;
            APP_STATE.ejercicios[idxExistente].tiempoSegundos = esTiempo ? tiempoSeg : 0;
            APP_STATE.ejercicios[idxExistente].tiempoReferencia = esTiempo ? tiempoSeg : 0;
            APP_STATE.ejercicios[idxExistente].repeticiones = reps;
            APP_STATE.ejercicios[idxExistente].repeticionesPromedio = repsProm;
            APP_STATE.ejercicios[idxExistente].zonas = zonasCopia;
            APP_STATE.ejercicios[idxExistente].categorias = categorias;
            APP_STATE.ejercicios[idxExistente].fatigaPorcentaje = fatigaEstimada;
            APP_STATE.ejercicios[idxExistente].fechaActualizacion = Date.now();

            if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
                MonarcaDB.save(APP_STATE);
            }

            ID_EJERCICIO_EN_EDICION = null;
            cerrarModalNuevoEjercicio();
            renderizarEjercicios(APP_STATE.ejercicios);
            alert("💾 Ejercicio '" + nom + "' actualizado con éxito.");
            return;
        }
    }

    // MODO CREACIÓN
    // Prevenir duplicados de ejercicios
    var yaExisteEj = APP_STATE.ejercicios.some(function(e) {
        return e && e.nombre && e.nombre.trim().toLowerCase() === nom.trim().toLowerCase();
    });
    var permitirDuplicadoEj = false;
    if (yaExisteEj) {
        if (!confirm("Ya existe un ejercicio llamado \"" + nom + "\".\n¿Deseas agregar otro con el mismo nombre?")) {
            return;
        }
        permitirDuplicadoEj = true;
    }

    var nowEj = Date.now();
    var nuevoEjercicio = {
        id: "EJ-" + nowEj,
        nombre: nom,
        tipo: tipoEj,
        implemento: implemento,
        equipamiento: implemento,
        unidadPeso: unidadPeso,
        compuesto: esCompuesto,
        especificaciones: desc || "Técnica biomecánica controlada.",
        descripcion: desc || "Técnica biomecánica controlada.",
        musculoPrincipal: muscPrincipal,
        series: series,
        peso: pesoBase,
        pesoReferencia: pesoBase,
        modalidadEsfuerzo: modalidad,
        tiempoSegundos: esTiempo ? tiempoSeg : 0,
        tiempoReferencia: esTiempo ? tiempoSeg : 0,
        repeticiones: reps,
        repeticionesPromedio: repsProm,
        zonas: zonasCopia,
        categorias: categorias,
        fatigaPorcentaje: fatigaEstimada,
        permitirDuplicadoNombre: permitirDuplicadoEj,
        timestamp: nowEj,
        fechaActualizacion: nowEj
    };

    APP_STATE.ejercicios.push(nuevoEjercicio);
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
        MonarcaDB.save(APP_STATE);
    }

    cerrarModalNuevoEjercicio();
    renderizarEjercicios(APP_STATE.ejercicios);
    if (typeof TAB_TRAINER_ACTIVA !== 'undefined' && TAB_TRAINER_ACTIVA === 'aleatoria' && typeof renderizarSubAppTrainer === 'function') {
        renderizarSubAppTrainer();
    }
    alert("⚡ Ejercicio '" + nom + "' guardado con éxito.\nReferencia Base: " + (pesoBase ? pesoBase + " " + unidadPeso + " × " : "") + repsProm + " reps promedio (" + fatigaEstimada + "% a " + muscPrincipal + ").");
}

function perteneceAGrupoAnatomico(clave, subfiltro) {
    if (!clave) return false;
    var c = String(clave).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var sub = String(subfiltro).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (sub === 'pecho') return /pecho|pect/.test(c);
    if (sub === 'espalda') return /espalda|dorsal|trapec|lumbar|romboide/.test(c);
    if (sub === 'hombros') return /hombro|deltoid|manguito/.test(c);
    if (sub === 'biceps') return /bicep|braquial|antebrazo|martillo|curl/.test(c);
    if (sub === 'triceps') return /tricep/.test(c);
    if (sub === 'cuadriceps') return /cuadricep|squat|sentadilla|prensa/.test(c);
    if (sub === 'isquios') return /isquio|femoral|rumano/.test(c);
    if (sub === 'gluteos') return /gluteo|cadera|aductor|hip.*thrust|abduc/.test(c);
    if (sub === 'pantorrillas') return /pantorrilla|gemelo|soleo|tibial/.test(c);
    if (sub === 'core') return /core|abdom|oblicuo|transverso/.test(c);
    if (sub === 'calistenia') return c === 'calistenia';
    if (sub === 'movilidad') return /movil|articul|cuello/.test(c);
    return c.includes(sub);
}

function ejercicioCoincideSubfiltroFisico(ej, subfiltro) {
    if (!subfiltro || subfiltro === 'todos') return true;
    var sub = String(subfiltro).toLowerCase();

    // Filtros de modalidad global
    if (sub === 'calistenia') {
        return (ej.tipo === 'calistenia') || (ej.implemento === 'peso_corporal');
    }
    if (sub === 'movilidad') {
        if (ej.tipo === 'movilidad') return true;
    }

    var mp = ej.musculoPrincipal || (ej.categorias && ej.categorias.length ? ej.categorias[0] : '');

    // 1. Si el ejercicio tiene desglose de zonas con porcentajes:
    if (ej.zonas && Array.isArray(ej.zonas) && ej.zonas.length > 0) {
        var totalPctGrupo = 0;
        var esPrincipal = false;

        ej.zonas.forEach(function(z, idx) {
            var zClave = z.clave || z.nombre || z.zona || '';
            if (perteneceAGrupoAnatomico(zClave, sub)) {
                totalPctGrupo += (parseFloat(z.porcentaje) || 0);
                // Si la zona es la principal (posición 0 o coincide con musculoPrincipal)
                if (idx === 0 || (mp && zClave.toLowerCase() === mp.toLowerCase())) {
                    esPrincipal = true;
                }
            }
        });

        // REGLA SOLICITADA: Coincide si este grupo es el músculo principal O si el estímulo supera el 5% (> 5%)
        return esPrincipal || totalPctGrupo > 5;
    }

    // 2. Fallback para ejercicios legados sin array zonas:
    if (perteneceAGrupoAnatomico(mp, sub)) return true;
    var tieneCat = (ej.categorias || []).some(function(cat) { return perteneceAGrupoAnatomico(cat, sub); });
    return tieneCat;
}

function toggleDesplegarEjercicio(id, evt) {
    if (evt) evt.stopPropagation();
    var details = document.getElementById('detalles-ejercicio-' + id);
    var flecha = document.getElementById('flecha-ejercicio-' + id);
    var card = document.getElementById('card-ejercicio-' + id);
    if (!details) return;

    var estaOculto = (details.style.display === 'none' || !details.style.display);
    if (estaOculto) {
        details.style.display = 'block';
        if (flecha) flecha.style.transform = 'rotate(180deg)';
        if (card) {
            card.classList.add('exercise-card-expanded');
            card.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        }
    } else {
        details.style.display = 'none';
        if (flecha) flecha.style.transform = 'rotate(0deg)';
        if (card) {
            card.classList.remove('exercise-card-expanded');
            card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }
    }
}

function generarCardEjercicioFisicoHtml(ej) {
    var ejId = ej.id || ('EJ-' + Math.random().toString(36).substr(2, 9));
    var safeId = String(ejId).replace(/[^\w-]/g, '_');
    var muscTarget = ej.musculoPrincipal || (ej.categorias && ej.categorias.length ? ej.categorias[0] : 'Cuerpo');
    
    // Si el ejercicio tiene desglose multi-zona con porcentajes específicos:
    var badgesZonasHtml = '';
    if (ej.zonas && Array.isArray(ej.zonas) && ej.zonas.length > 0) {
        badgesZonasHtml = ej.zonas.map(function(z, idx) {
            var zClave = z.clave || z.zona || 'Cuerpo';
            var zPct = z.porcentaje || 25;
            if (idx === 0) {
                return `<span class="badge-exercise-fatiga">🎯 ${zPct}% ${zClave}</span>`;
            } else {
                return `<span class="badge-exercise-muscle">${zPct}% ${zClave}</span>`;
            }
        }).join('');
    } else {
        var fatigaImpactBadge = `<span class="badge-exercise-fatiga">🎯 +${ej.fatigaPorcentaje || 20}% a ${muscTarget}</span>`;
        var muscleBadges = (ej.categorias || []).filter(function(c) { return c !== muscTarget; }).map(function(cat) {
            return `<span class="badge-exercise-muscle">${cat}</span>`;
        }).join('');
        badgesZonasHtml = fatigaImpactBadge + muscleBadges;
    }

    var tipoBadge = (ej.tipo === 'calistenia')
        ? '<span class="muscle-tag arsenal-type-chip arsenal-type-chip--cal">🤸 Calistenia</span>'
        : (ej.tipo === 'movilidad'
            ? '<span class="muscle-tag arsenal-type-chip arsenal-type-chip--mov">🥋 Movilidad</span>'
            : '<span class="muscle-tag arsenal-type-chip arsenal-type-chip--gym">🏋️ Gym</span>');

    var specsTexto = ej.especificaciones || ej.descripcion || 'Técnica de ejecución biomecánica controlada.';
    var esTiempo = (ej.modalidadEsfuerzo === 'tiempo') || (ej.tiempoSegundos != null && ej.tiempoSegundos > 0);
    var esSerieCeroCard = !!(ej.series === 0 || ej.esSerieCero);
    var repsDisplay = '';
    var repsShort = '';
    if (esTiempo) {
        var tSeg = ej.tiempoSegundos || 60;
        repsDisplay = (ej.series && ej.series > 1)
            ? `${ej.series} Series × ⏱️ ${tSeg}s (${formatearTiempoMMSS(tSeg)}) isométrico`
            : `1 Serie · ⏱️ ${tSeg}s (${formatearTiempoMMSS(tSeg)}) isométrico`;
        repsShort = (ej.series && ej.series > 1) ? `${ej.series}×⏱️${tSeg}s` : `⏱️ ${tSeg}s`;
    } else if (esSerieCeroCard) {
        var recCard = ej.recordSerieCero || ej.ultimaSerieCeroReps || obtenerRepsPromedioEjercicio(ej);
        repsDisplay = `🏆 Serie 0 · Modo Récord (${recCard} reps)`;
        repsShort = `🏆 Serie 0 · ${recCard} reps`;
    } else {
        var repTxt = ej.repeticiones || '8-10 reps';
        repsDisplay = (ej.series && ej.series > 1)
            ? `${ej.series} Series × ${repTxt}`
            : `1 Serie · ${repTxt}`;
        repsShort = `${ej.series || 1}×${repTxt}`;
    }

    // Obtener peso base del ejercicio (o pesoReferencia)
    var pesoNum = (ej.peso != null && ej.peso !== '' && !isNaN(parseFloat(ej.peso)))
        ? parseFloat(ej.peso)
        : ((ej.pesoReferencia != null && ej.pesoReferencia !== '' && !isNaN(parseFloat(ej.pesoReferencia)))
            ? parseFloat(ej.pesoReferencia)
            : ((ej.tipo === 'calistenia' || ej.tipo === 'movilidad') ? null : 80));
    var unidadPeso = ej.unidadPeso || 'kg';
    var pesoBadgeHtml = (pesoNum != null && pesoNum > 0)
        ? `<span class="badge-exercise-peso">⚡ Base: ${pesoNum} ${unidadPeso}</span>`
        : '';
    var pesoShortHtml = (pesoNum != null && pesoNum > 0)
        ? `<span class="arsenal-meta-pill arsenal-meta-pill--peso">⚖️ ${pesoNum} ${unidadPeso}</span>`
        : '';

    var mapaImplementos = {
        'barra': { icon: '🏋️', label: 'Barra' },
        'mancuerna': { icon: '💪', label: 'Mancuerna' },
        'maquina': { icon: '⚙️', label: 'Máquina' },
        'polea': { icon: '⛓️', label: 'Polea' },
        'discos': { icon: '💿', label: 'Discos' },
        'peso_corporal': { icon: '🤸', label: 'Corporal' }
    };
    var impKey = ej.implemento || ej.equipamiento || (ej.tipo === 'calistenia' ? 'peso_corporal' : null);
    var impObj = mapaImplementos[impKey];
    var implementoBadgeHtml = impObj
        ? `<span class="badge-exercise-implemento">${impObj.icon} ${impObj.label}</span>`
        : '';
    var implementoShortHtml = impObj
        ? `<span class="arsenal-meta-pill">${impObj.icon} ${impObj.label}</span>`
        : '';

    return `
    <div class="exercise-card exercise-card-collapsible" id="card-ejercicio-${safeId}">
        <div class="exercise-card-header arsenal-card-header" onclick="toggleDesplegarEjercicio('${safeId}')">
            <div class="arsenal-card-main">
                <h3 class="exercise-card-name arsenal-card-title">${ej.nombre}</h3>
                <div class="arsenal-card-chips">
                    ${tipoBadge}
                    <span class="arsenal-meta-pill">${repsShort}</span>
                    ${pesoShortHtml}
                    ${implementoShortHtml}
                </div>
            </div>
            <div class="arsenal-card-actions">
                <button type="button" class="btn-toggle-acordeon arsenal-action-btn" title="Desplegar detalles" aria-label="Ver detalles de ${ej.nombre}">
                    <span id="flecha-ejercicio-${safeId}" class="arsenal-chevron">▼</span>
                </button>
                <button type="button" class="btn-edit-exercise-row arsenal-action-btn" title="Editar ejercicio" aria-label="Editar ${ej.nombre}" onclick="abrirModalEditarEjercicio('${ej.id}'); event.stopPropagation();">✏️</button>
                <button type="button" class="btn-delete-row arsenal-action-btn arsenal-action-btn--delete" title="Eliminar ejercicio" aria-label="Eliminar ${ej.nombre}" onclick="eliminarEjercicio('${ej.id}'); event.stopPropagation();">✕</button>
            </div>
        </div>

        <!-- PANEL DESPLEGABLE: DESCRIPCIÓN Y DATOS COMPLETOS -->
        <div id="detalles-ejercicio-${safeId}" class="exercise-card-details" style="display: none;">
            <p class="exercise-card-desc">${specsTexto}</p>
            <div class="exercise-badges-row">
                ${badgesZonasHtml}
                ${implementoBadgeHtml}
                ${pesoBadgeHtml}
                <span class="badge-exercise-reps">${repsDisplay}</span>
            </div>
        </div>
    </div>`;
}

function renderizarEjercicios(ejercicios) {
    var eList = ejercicios || APP_STATE.ejercicios || [];
    var cont = document.getElementById('contenedor-ejercicios');
    if (!cont) return;

    if (!eList || eList.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: #121725; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">⚡</span>
            <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 16px;">Tu Arsenal Físico está vacío</h4>
            <p style="color: #94a3b8; font-size: 13px; max-width: 440px; margin: 0 auto 16px auto;">
                Crea tus ejercicios especificando series, repeticiones y grupos musculares trabajados, o importa el arsenal maestro recomendado.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button class="btn-add-finanza" onclick="abrirModalNuevoEjercicio()">
                    ➕ Crear Nuevo Ejercicio
                </button>
                <button type="button" class="btn-subfiltro-ej active" onclick="importarBancoRecomendadoAlBancoFisico()" style="padding: 9px 16px; font-size: 13px;">
                    📥 Cargar Arsenal Recomendado
                </button>
            </div>
        </div>`;
        return;
    }

    var subfiltro = SUBFILTRO_BANCO_ACTIVO || 'todos';
    var tieneBusqueda = !!(BUSQUEDA_BANCO_FISICO_TEXTO && BUSQUEDA_BANCO_FISICO_TEXTO.trim());

    // 1. Filtrar primero por texto de búsqueda si el usuario ingresó algo
    var listaFiltradaPorTexto = eList;
    if (tieneBusqueda) {
        listaFiltradaPorTexto = eList.filter(function(e) {
            return ejercicioCoincideBusquedaTexto(e, BUSQUEDA_BANCO_FISICO_TEXTO);
        });
    }

    // 2. Si no hubo resultados en la búsqueda por texto en todo el catálogo
    if (tieneBusqueda && listaFiltradaPorTexto.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 35px 20px; background: #121725; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 14px; color: #94a3b8; font-size: 13px;">
            <span style="font-size: 28px; display: block; margin-bottom: 8px;">🔍</span>
            No se encontraron ejercicios con "<strong>${BUSQUEDA_BANCO_FISICO_TEXTO}</strong>"${subfiltro !== 'todos' ? (' en ' + subfiltro) : ''}.<br>
            <button class="btn-subfiltro-ej" onclick="limpiarBuscadorBancoFisico()" style="margin-top: 12px; padding: 7px 14px; font-size: 12px;">✕ Limpiar Búsqueda</button>
        </div>`;
        return;
    }

    // 3. Si hay un subfiltro de categoría específico
    if (subfiltro !== 'todos') {
        var filtrados = listaFiltradaPorTexto.filter(function(e) {
            return ejercicioCoincideSubfiltroFisico(e, subfiltro);
        });

        if (filtrados.length === 0) {
            cont.innerHTML = `
            <div style="text-align: center; padding: 35px 20px; background: #121725; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 14px; color: #94a3b8; font-size: 13px;">
                ${tieneBusqueda 
                    ? `No hay coincidencias para "<strong>${BUSQUEDA_BANCO_FISICO_TEXTO}</strong>" en <strong>${subfiltro}</strong>.<br><button class="btn-subfiltro-ej" onclick="limpiarBuscadorBancoFisico()" style="margin-top: 12px; padding: 7px 14px;">✕ Ver todos en ${subfiltro}</button>` 
                    : `No hay ejercicios en la categoría <strong>${subfiltro}</strong>.<br><button class="btn-subfiltro-ej" onclick="abrirModalNuevoEjercicio('${subfiltro}')" style="margin-top: 12px;">➕ Crear Ejercicio en ${subfiltro}</button>`
                }
            </div>`;
            return;
        }

        var headerBusqueda = tieneBusqueda 
            ? `<div style="margin-bottom: 10px; font-size: 12.5px; color: #38bdf8; font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
                <span>🔍 Resultados para "${BUSQUEDA_BANCO_FISICO_TEXTO}" en ${subfiltro} (${filtrados.length}):</span>
                <button type="button" class="btn-subfiltro-ej" onclick="limpiarBuscadorBancoFisico()" style="font-size: 11px; padding: 3px 8px;">✕ Limpiar</button>
               </div>`
            : '';

        var html = headerBusqueda + '<div style="display: flex; flex-direction: column; gap: 8px;">';
        filtrados.forEach(function(ej) {
            html += generarCardEjercicioFisicoHtml(ej);
        });
        html += '</div>';
        cont.innerHTML = html;
        return;
    }

    // 4. Si 'todos' está activo:
    // Si hay búsqueda por texto, mostramos directamente los resultados coincidentes
    if (tieneBusqueda) {
        var html = `<div style="margin-bottom: 10px; font-size: 12.5px; color: #38bdf8; font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
            <span>🔍 Coincidencias encontradas (${listaFiltradaPorTexto.length}):</span>
            <button type="button" class="btn-subfiltro-ej" onclick="limpiarBuscadorBancoFisico()" style="font-size: 11px; padding: 3px 8px;">✕ Limpiar</button>
        </div>`;
        html += '<div style="display: flex; flex-direction: column; gap: 8px;">';
        listaFiltradaPorTexto.forEach(function(ej) {
            html += generarCardEjercicioFisicoHtml(ej);
        });
        html += '</div>';
        cont.innerHTML = html;
        return;
    }

    // Si 'todos' está activo y NO hay texto de búsqueda, agrupar de manera ordenada por categorías
    var grupos = [
        { key: 'Pecho', label: '⚔️ Pecho & Pectorales' },
        { key: 'Espalda', label: '🦅 Espalda & Dorsales' },
        { key: 'Hombros', label: '🛡️ Hombros & Deltoides' },
        { key: 'Biceps', label: '💪 Bíceps & Antebrazos' },
        { key: 'Triceps', label: '🦾 Tríceps' },
        { key: 'Cuadriceps', label: '🦵 Cuádriceps (Pierna Frontal)' },
        { key: 'Isquios', label: '🍗 Isquiosurales / Femorales' },
        { key: 'Gluteos', label: '🍑 Glúteos & Cadera' },
        { key: 'Pantorrillas', label: '🧦 Pantorrillas & Gemelos' },
        { key: 'Core', label: '⚡ Core & Abdomen' },
        { key: 'calistenia', label: '🤸 Calistenia & Peso Corporal' },
        { key: 'movilidad', label: '🥋 Movilidad & Flexibilidad' }
    ];

    var asignados = new Set();
    var htmlAgrupado = '';

    grupos.forEach(function(g) {
        var itemsDelGrupo = eList.filter(function(ej) {
            if (asignados.has(ej.id || ej.nombre)) return false;
            return ejercicioCoincideSubfiltroFisico(ej, g.key);
        });

        if (itemsDelGrupo.length > 0) {
            itemsDelGrupo.forEach(function(ej) { asignados.add(ej.id || ej.nombre); });
            htmlAgrupado += `<div class="exercise-group-title">${g.label} <span style="font-size:11px; color:#94a3b8; font-weight:600; margin-left:4px;">(${itemsDelGrupo.length})</span></div>`;
            htmlAgrupado += '<div style="display: flex; flex-direction: column; gap: 8px;">';
            itemsDelGrupo.forEach(function(ej) {
                htmlAgrupado += generarCardEjercicioFisicoHtml(ej);
            });
            htmlAgrupado += '</div>';
        }
    });

    // Cualquier ejercicio no clasificado en los grupos anteriores
    var restantes = eList.filter(function(ej) {
        return !asignados.has(ej.id || ej.nombre);
    });
    if (restantes.length > 0) {
        htmlAgrupado += `<div class="exercise-group-title">🔮 Otros Ejercicios <span style="font-size:11px; color:#94a3b8; font-weight:600; margin-left:4px;">(${restantes.length})</span></div>`;
        htmlAgrupado += '<div style="display: flex; flex-direction: column; gap: 8px;">';
        restantes.forEach(function(ej) {
            htmlAgrupado += generarCardEjercicioFisicoHtml(ej);
        });
        htmlAgrupado += '</div>';
    }

    cont.innerHTML = htmlAgrupado;
}

function eliminarEjercicio(id) {
    if (!confirm("¿Deseas eliminar este ejercicio?")) return;
    if (!APP_STATE.ejercicios) return;

    var ejBorrado = APP_STATE.ejercicios.find(function(e) { return String(e.id) === String(id); });
    var nomBorrado = ejBorrado ? (ejBorrado.nombre || '').trim().toLowerCase() : '';

    if (typeof registrarTombstone === 'function') {
        registrarTombstone('ejercicios', id);
    }
    APP_STATE.ejercicios = APP_STATE.ejercicios.filter(function(e) {
        return String(e.id) !== String(id);
    });

    // Desvincular automáticamente el ejercicio eliminado de todas las rutinas guardadas
    if (APP_STATE.rutinas && Array.isArray(APP_STATE.rutinas)) {
        APP_STATE.rutinas.forEach(function(r) {
            if (r && r.ejercicios && Array.isArray(r.ejercicios)) {
                r.ejercicios = r.ejercicios.filter(function(ej) {
                    var coincideId = ej && ej.id && String(ej.id) === String(id);
                    var coincideNom = ej && ej.nombre && nomBorrado && ej.nombre.trim().toLowerCase() === nomBorrado;
                    return !(coincideId || coincideNom);
                });
            }
        });
    }

    MonarcaDB.save(APP_STATE);
    renderizarEjercicios(APP_STATE.ejercicios);
    if (typeof renderizarPortalesRutinas === 'function') {
        renderizarPortalesRutinas(APP_STATE.rutinas);
    }
}

// --- GESTIÓN DE RUTINAS DINÁMICAS ---

function cargarGym() {
    renderizarPortalesRutinas(APP_STATE.rutinas);
    renderizarGym(APP_STATE.gym);
}

// ==========================================================================
// CÁLCULO BIOMECÁNICO DE DROIPSET AL FALLO EN 4 ETAPAS (v10.5)
// ==========================================================================
function calcularEtapasDropset(pesoTotal) {
    var p = parseFloat(pesoTotal);
    if (isNaN(p) || p <= 0) p = 80;

    var esBarra = p >= 30;
    var pesoBaseMinimo = esBarra ? 20 : 0;
    var deltaTotal = p - pesoBaseMinimo;

    var p1 = p;
    var p2, p3, p4;

    if (esBarra) {
        p4 = 20; // Barra olímpica sola (20 kg)
        var paso1 = Math.round((deltaTotal * 0.33) / 2.5) * 2.5;
        var paso2 = Math.round((deltaTotal * 0.33) / 2.5) * 2.5;
        if (p === 80) { paso1 = 20; paso2 = 20; }
        else if (p === 60) { paso1 = 15; paso2 = 15; }
        else if (p === 50) { paso1 = 10; paso2 = 10; }
        else if (p === 100) { paso1 = 25; paso2 = 25; }

        p2 = Math.max(p4, p1 - paso1);
        p3 = Math.max(p4, p2 - paso2);
    } else {
        var paso = Math.max(1, Math.round((p / 4) * 2) / 2);
        p2 = Math.max(0, Math.round((p1 - paso) * 10) / 10);
        p3 = Math.max(0, Math.round((p2 - paso) * 10) / 10);
        p4 = Math.max(0, Math.round((p3 - paso) * 10) / 10);
    }

    function detalleDiscosLado(bajTotal) {
        if (!esBarra) {
            return bajTotal > 0 ? ("Bajar " + bajTotal + " kg de peso") : "Carga inicial";
        }
        var porLado = Math.round((bajTotal / 2) * 100) / 100;
        if (porLado <= 0) return "Carga completa de inicio";
        if (porLado === 10) return "Quitar 1 disco de 10 kg por lado (-" + bajTotal + " kg total)";
        if (porLado === 20) return "Quitar 1 disco de 20 kg (o dos de 10 kg) por lado (-" + bajTotal + " kg total)";
        if (porLado === 15) return "Quitar 1 disco de 15 kg por lado (-" + bajTotal + " kg total)";
        if (porLado === 5) return "Quitar 1 disco de 5 kg por lado (-" + bajTotal + " kg total)";
        if (porLado === 7.5) return "Quitar 7.5 kg por lado (1 de 5 kg + 1 de 2.5 kg) (-" + bajTotal + " kg total)";
        if (porLado === 12.5) return "Quitar 12.5 kg por lado (1 de 10 kg + 1 de 2.5 kg) (-" + bajTotal + " kg total)";
        return "Quitar " + porLado + " kg en discos por lado (-" + bajTotal + " kg total)";
    }

    var bajada1 = Math.round((p1 - p2) * 10) / 10;
    var bajada2 = Math.round((p2 - p3) * 10) / 10;
    var bajada3 = Math.round((p3 - p4) * 10) / 10;

    var arr = [
        {
            num: 1,
            titulo: "Serie Base (100% Carga)",
            peso: p1,
            repsInfo: "Reps objetivo completas",
            discos: esBarra ? ("Carga completa (" + Math.round((p1 - 20) / 2) + " kg en discos por lado)") : "Carga inicial total",
            detalle: esBarra ? ("Carga completa (" + Math.round((p1 - 20) / 2) + " kg en discos por lado)") : "Carga inicial total"
        },
        {
            num: 2,
            titulo: "Bajada 1 · Al Fallo",
            peso: p2,
            repsInfo: "Reps al fallo muscular",
            discos: detalleDiscosLado(bajada1),
            detalle: detalleDiscosLado(bajada1)
        },
        {
            num: 3,
            titulo: "Bajada 2 · Al Fallo",
            peso: p3,
            repsInfo: "Reps al fallo muscular",
            discos: detalleDiscosLado(bajada2),
            detalle: detalleDiscosLado(bajada2)
        },
        {
            num: 4,
            titulo: "Bajada 3 · Agotamiento Total",
            peso: p4,
            repsInfo: "Reps al fallo extremo (vaciamiento)",
            discos: (p4 === 20 && esBarra) ? "Retirar todos los discos restantes (Barra sola 20 kg)" : (bajada3 > 0 ? detalleDiscosLado(bajada3) : "Sin carga adicional"),
            detalle: (p4 === 20 && esBarra) ? "Retirar todos los discos restantes (Barra sola 20 kg)" : (bajada3 > 0 ? detalleDiscosLado(bajada3) : "Sin carga adicional")
        }
    ];

    arr.etapa1 = arr[0];
    arr.etapa2 = arr[1];
    arr.etapa3 = arr[2];
    arr.etapa4 = arr[3];

    return arr;
}

var SUBFILTRO_RUTINA_MODAL_ACTIVO = 'todos';

function alCambiarCheckEjercicioRutina(ejId) {
    var card = document.getElementById('card_ej_rutina_' + ejId);
    var chk = document.getElementById('chk_rutina_' + ejId);
    if (!card || !chk) return;
    if (chk.checked) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }
    actualizarContadorEjerciciosSeleccionadosRutina();
}

function actualizarContadorEjerciciosSeleccionadosRutina() {
    var checkFisicos = document.querySelectorAll('input[name="ejercicios_rutina_check"]:checked').length;
    var checkMentales = document.querySelectorAll('input[name="ejercicios_mentales_rutina_check"]:checked').length;
    var total = checkFisicos + checkMentales;
    var badge = document.getElementById('contador-ejercicios-rutina-sel');
    if (badge) {
        badge.innerHTML = total + (total === 1 ? ' agregado 👁️' : ' agregados 👁️');
        if (total > 0) {
            badge.style.background = 'rgba(56, 189, 248, 0.22)';
            badge.style.borderColor = '#38bdf8';
            badge.style.color = '#38bdf8';
        } else {
            badge.style.background = 'rgba(56, 189, 248, 0.12)';
            badge.style.borderColor = 'rgba(56, 189, 248, 0.3)';
            badge.style.color = '#94a3b8';
        }
    }
    var countPill = document.getElementById('count-pill-sel');
    if (countPill) countPill.innerText = total;

    // Si estamos en la pestaña 'seleccionados', actualizar la lista inmediatamente
    if (SUBFILTRO_RUTINA_MODAL_ACTIVO === 'seleccionados') {
        filtrarEjerciciosModalRutina();
    }
}

function seleccionarCategoriaModalRutina(cat, btnElem) {
    SUBFILTRO_RUTINA_MODAL_ACTIVO = cat || 'todos';
    var pills = document.querySelectorAll('.rutina-cat-pill');
    pills.forEach(function(p) { p.classList.remove('active'); });
    if (btnElem) {
        btnElem.classList.add('active');
    } else {
        var targetPill = document.querySelector('.rutina-cat-pill[data-cat="' + SUBFILTRO_RUTINA_MODAL_ACTIVO + '"]');
        if (targetPill) targetPill.classList.add('active');
    }
    filtrarEjerciciosModalRutina();
}

function limpiarBuscadorEjerciciosRutina() {
    var inBusq = document.getElementById('buscador-ejercicios-modal-rutina');
    if (inBusq) inBusq.value = '';
    filtrarEjerciciosModalRutina();
}

function filtrarEjerciciosModalRutina() {
    var queryInput = document.getElementById('buscador-ejercicios-modal-rutina');
    var rawQuery = queryInput ? queryInput.value.trim() : '';
    var btnClear = document.getElementById('btn-clear-search-rutina');
    if (btnClear) btnClear.style.display = rawQuery ? 'flex' : 'none';

    var sub = SUBFILTRO_RUTINA_MODAL_ACTIVO || 'todos';
    var normQuery = rawQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    var eFisicos = APP_STATE.ejercicios || [];
    var visibles = 0;

    eFisicos.forEach(function(ej) {
        var card = document.getElementById('card_ej_rutina_' + ej.id);
        if (!card) return;

        var coincideCat = false;
        if (sub === 'seleccionados') {
            var chk = document.getElementById('chk_rutina_' + ej.id);
            coincideCat = !!(chk && chk.checked);
        } else {
            // Categoría anatómica con umbral biomecánico (> 5% o músculo principal)
            coincideCat = ejercicioCoincideSubfiltroFisico(ej, sub);
        }

        // Búsqueda por texto (nombre, implemento, zonas, categorías)
        var coincideQuery = true;
        if (normQuery) {
            var nom = String(ej.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var desc = String(ej.descripcion || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var imp = String(ej.implemento || ej.equipamiento || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var cats = (ej.categorias || []).join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var zonas = (ej.zonas || []).map(function(z) { return z.clave || z.nombre || ''; }).join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            coincideQuery = nom.includes(normQuery) || desc.includes(normQuery) || imp.includes(normQuery) || cats.includes(normQuery) || zonas.includes(normQuery);
        }

        if (coincideCat && coincideQuery) {
            card.style.display = '';
            visibles++;
        } else {
            card.style.display = 'none';
        }
    });

    var eMentales = APP_STATE.ejerciciosCerebrales || [];
    eMentales.forEach(function(ec) {
        var cardM = document.getElementById('card_ej_mental_' + ec.id);
        if (!cardM) return;
        
        var coincideCatM = false;
        if (sub === 'seleccionados') {
            var chkM = document.querySelector('input[name="ejercicios_mentales_rutina_check"][value="' + ec.id + '"]');
            coincideCatM = !!(chkM && chkM.checked);
        } else if (sub === 'todos') {
            coincideCatM = true;
        } else {
            coincideCatM = false;
        }

        if (!coincideCatM) {
            cardM.style.display = 'none';
            return;
        }

        var coincideQuery = true;
        if (normQuery) {
            var nom = String(ec.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var desc = String(ec.descripcion || ec.protocolo || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var musc = String(ec.musculoPrincipal || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            coincideQuery = nom.includes(normQuery) || desc.includes(normQuery) || musc.includes(normQuery);
        }
        if (coincideQuery) {
            cardM.style.display = '';
            visibles++;
        } else {
            cardM.style.display = 'none';
        }
    });

    var noRes = document.getElementById('modal-rutina-sin-resultados');
    if (!noRes) {
        var contCheck = document.getElementById('modal-rutina-checklist-ejercicios');
        if (contCheck) {
            noRes = document.createElement('div');
            noRes.id = 'modal-rutina-sin-resultados';
            noRes.style.cssText = 'color: #94a3b8; font-size: 12.5px; text-align: center; padding: 25px 10px; display: none;';
            contCheck.appendChild(noRes);
        }
    }
    if (noRes) {
        if (visibles === 0) {
            noRes.style.display = 'block';
            if (sub === 'seleccionados') {
                noRes.innerHTML = '📋 <strong>No tienes ejercicios agregados aún.</strong><br><span style="font-size:11.5px; color:#64748b; margin-top:4px; display:inline-block;">Selecciona la pestaña <em>"Todos"</em> o una categoría muscular y marca las casillas para incluir ejercicios en esta rutina.</span>';
            } else {
                noRes.innerHTML = '🔍 No se encontraron ejercicios que coincidan con este filtro.';
            }
        } else {
            noRes.style.display = 'none';
        }
    }
}

function toggleAlFalloEjercicio(ejId) {
    var btnFallo = document.getElementById('btn_fallo_rutina_' + ejId);
    var boxFallo = document.getElementById('dropset_preview_' + ejId);
    var btnCero = document.getElementById('btn_serie_cero_' + ejId);
    var bannerCero = document.getElementById('banner_serie_cero_' + ejId);
    var inS = document.getElementById('series_rutina_custom_' + ejId);
    var inP = document.getElementById('peso_rutina_custom_' + ejId);
    var card = document.getElementById('card_ej_rutina_' + ejId);
    if (!btnFallo || !boxFallo) return;

    var estabaActivo = btnFallo.classList.contains('active');
    if (estabaActivo) {
        btnFallo.classList.remove('active');
        boxFallo.style.display = 'none';
        if (card) card.classList.remove('mode-fallo-active');
    } else {
        // 1. Activar Al Fallo
        btnFallo.classList.add('active');
        boxFallo.style.display = 'block';
        if (card) {
            card.classList.add('mode-fallo-active');
            card.classList.remove('mode-serie-cero-active');
        }

        // 2. DESACTIVAR FORZOSAMENTE SERIE 0 (Son mutuamente excluyentes)
        if (btnCero) btnCero.classList.remove('active');
        if (bannerCero) bannerCero.style.display = 'none';

        // Restaurar series a mínimo 1 o 3 si estaban en 0
        var ejCat = (APP_STATE.ejercicios || []).find(function(e) { return e && String(e.id) === String(ejId); });
        if (inS && parseInt(inS.value) === 0) {
            inS.value = (ejCat && ejCat.series && ejCat.series > 0) ? ejCat.series : 3;
        }
        if (inP && (parseFloat(inP.value) === 0 || isNaN(parseFloat(inP.value)))) {
            inP.value = (ejCat && ejCat.peso != null && ejCat.peso > 0) ? ejCat.peso : 80;
        }

        recalcularDropsetEjercicio(ejId);
    }
}

function recalcularDropsetEjercicio(ejId) {
    var inPeso = document.getElementById('peso_rutina_custom_' + ejId);
    var box = document.getElementById('dropset_preview_' + ejId);
    if (!box) return;

    var peso = inPeso ? (parseFloat(inPeso.value) || 80) : 80;
    var etapas = calcularEtapasDropset(peso);

    var html = `
        <div class="dropset-preview-header">
            <span>🔥 ÚLTIMA SERIE: DROIPSET DE 4 ETAPAS AL FALLO</span>
            <span style="color:#fbbf24; font-weight:800;">${peso} kg Base</span>
        </div>
        <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 6px;">
            Al agotar las reps con ${peso} kg, desciende peso de inmediato en 4 etapas sin descanso:
        </div>`;

    etapas.forEach(function(et) {
        html += `
        <div class="dropset-stage-row">
            <span class="dropset-stage-num">Etapa ${et.num}:</span>
            <span class="dropset-stage-peso">${et.peso} kg</span>
            <span class="dropset-stage-disc">➔ ${et.discos} (${et.repsInfo})</span>
        </div>`;
    });

    box.innerHTML = html;
}

function actualizarChecklistRutinaSegunTipo(tipo) {
    var contCheck = document.getElementById('modal-rutina-checklist-ejercicios');
    if (!contCheck) return;

    var tipoSel = tipo || (document.getElementById('modal-rutina-tipo') ? document.getElementById('modal-rutina-tipo').value : 'fisica');
    var eFisicos = APP_STATE.ejercicios || [];
    var eMentales = APP_STATE.ejerciciosCerebrales || [];

    var wrapperCats = document.getElementById('rutina-categorias-scroll-wrapper');
    if (wrapperCats) {
        wrapperCats.style.display = (tipoSel === 'mental') ? 'none' : 'flex';
    }

    var html = '';

    if (tipoSel === 'fisica' || tipoSel === 'hibrida') {
        if (tipoSel === 'hibrida') {
            html += '<div style="font-weight: 800; font-size: 11.5px; text-transform: uppercase; color: #f8fafc; margin: 4px 0 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 4px;">🏋️ Ejercicios Físicos:</div>';
        }
        if (eFisicos.length === 0) {
            html += '<div style="color: #9ca3af; font-size: 12px; padding: 12px; text-align: center;">No tienes ejercicios físicos creados en tu Arsenal.</div>';
        } else {
            eFisicos.forEach(function(ej) {
                var esTiempoEj = (ej.modalidadEsfuerzo === 'tiempo') || (ej.tiempoSegundos != null && ej.tiempoSegundos > 0);
                var repsBase = esTiempoEj 
                    ? (`⏱️ ${ej.tiempoSegundos || 60}s (${formatearTiempoMMSS(ej.tiempoSegundos || 60)}) isométrico`) 
                    : (ej.repeticiones || '8-10 reps');
                var repsDefault = esTiempoEj ? (ej.tiempoSegundos || 60) : obtenerRepsPromedioEjercicio(ej);
                var labelReps = esTiempoEj ? "⏱️ Segs:" : "Reps:";
                var pesoDefault = (ej.peso != null && !isNaN(ej.peso)) ? ej.peso : (ej.pesoReferencia || ((ej.tipo === 'calistenia' || ej.tipo === 'movilidad') ? 0 : 80));
                var seriesDefault = (ej.series && ej.series > 1) ? ej.series : 3;
                var uPeso = ej.unidadPeso || 'kg';
                var mapaImp = { 'barra': '🏋️ Barra', 'mancuerna': '💪 Mancuerna', 'maquina': '⚙️ Máquina', 'polea': '⛓️ Polea', 'discos': '💿 Discos', 'peso_corporal': '🤸 Corporal' };
                var impTxt = mapaImp[ej.implemento || ej.equipamiento] || '';

                // Badges estéticos para el desglose muscular
                var badgesHtml = '';
                badgesHtml += `<span class="badge-reps-target">🎯 ${repsBase}</span>`;

                if (ej.zonas && Array.isArray(ej.zonas) && ej.zonas.length > 0) {
                    ej.zonas.slice(0, 3).forEach(function(z) {
                        var nomZ = String(z.clave || z.nombre || '').replace(/_/g, ' ');
                        var pctZ = (z.porcentaje != null && z.porcentaje !== '') ? ` (${z.porcentaje}%)` : '';
                        badgesHtml += `<span class="badge-musculo-mini">${nomZ}${pctZ}</span>`;
                    });
                } else if (ej.categorias && ej.categorias.length > 0) {
                    ej.categorias.slice(0, 3).forEach(function(cat) {
                        badgesHtml += `<span class="badge-musculo-mini">${String(cat).replace(/_/g, ' ')}</span>`;
                    });
                }

                if (impTxt) {
                    badgesHtml += `<span class="badge-implement-target">${impTxt}</span>`;
                }

                if (ej.recordSerieCero) {
                    badgesHtml += `<span class="badge-record-target" style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(192, 132, 252, 0.35); color: #d8b4fe; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 5px;">🏆 Récord: ${ej.recordSerieCero} reps</span>`;
                }

                html += `
                <div class="routine-checklist-card" id="card_ej_rutina_${ej.id}">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
                        <label style="display: flex; align-items: flex-start; gap: 10px; flex: 1; cursor: pointer; margin: 0;">
                            <input type="checkbox" name="ejercicios_rutina_check" value="${ej.id}" id="chk_rutina_${ej.id}" onchange="alCambiarCheckEjercicioRutina('${ej.id}')" style="margin-top: 3px; width: 18px; height: 18px; accent-color: #38bdf8; cursor: pointer;">
                            <div style="flex: 1; min-width: 0;">
                                <strong class="routine-checklist-title">${ej.nombre}</strong>
                                <div class="routine-checklist-badges-row">
                                    ${badgesHtml}
                                </div>
                            </div>
                        </label>
                    </div>

                    <!-- PANEL DE PARÁMETROS Y MODALIDADES -->
                    <div class="routine-controls-container">
                        <!-- 1. PARÁMETROS NUMÉRICOS (SERIES, REPS O SEGS, PESO) -->
                        <div class="routine-stats-grid">
                            <div class="stat-pill-box stat-pill-series">
                                <span class="stat-pill-label stat-pill-label-series">SERIES</span>
                                <input type="number" id="series_rutina_custom_${ej.id}" min="0" max="50" value="${seriesDefault}" class="input-routine-stat input-routine-stat-series" oninput="alCambiarInputSeriesRutina('${ej.id}')">
                            </div>

                            <div class="stat-pill-box stat-pill-reps">
                                <span class="stat-pill-label stat-pill-label-reps">${labelReps.replace(':', '')}</span>
                                <input type="number" id="reps_rutina_custom_${ej.id}" min="1" max="${esTiempoEj ? 3600 : 999}" value="${repsDefault}" class="input-routine-stat input-routine-stat-reps">
                            </div>

                            <div class="stat-pill-box stat-pill-peso">
                                <span class="stat-pill-label stat-pill-label-peso">PESO (${uPeso.toUpperCase()})</span>
                                <input type="number" id="peso_rutina_custom_${ej.id}" min="0" max="999" step="2.5" value="${pesoDefault}" class="input-routine-stat input-routine-stat-peso" oninput="recalcularDropsetEjercicio('${ej.id}')">
                            </div>
                        </div>

                        <!-- 2. SELECTOR DE MODALIDAD EXCLUYENTE (SERIE 0 vs AL FALLO) -->
                        <div class="routine-modes-row">
                            <span class="routine-mode-title">MODALIDAD:</span>
                            <div class="routine-mode-btn-wrap">
                                <button type="button" id="btn_serie_cero_${ej.id}" class="btn-mode-toggle btn-mode-serie-cero" onclick="toggleSerieCeroRutina('${ej.id}')" title="Modo Récord: 1 serie abierta sin peso fijado para romper tu récord personal de repeticiones">
                                    🏆 Serie 0 (Récord)
                                </button>
                                <button type="button" id="btn_fallo_rutina_${ej.id}" class="btn-mode-toggle btn-mode-fallo" onclick="toggleAlFalloEjercicio('${ej.id}')" title="Dropset al Fallo: Agotar las series y rematar con dropset de 4 etapas al vaciamiento muscular">
                                    🔥 Al Fallo (Dropset)
                                </button>
                            </div>
                        </div>

                        <!-- BANNER DE SERIE 0 CUANDO ESTÁ ACTIVO -->
                        <div id="banner_serie_cero_${ej.id}" class="serie-cero-info-banner" style="display: none;">
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                                <span style="font-weight: 800; font-size: 11px; color: #c084fc;">🏆 MODO RÉCORD: 1 SERIE AL MÁXIMO</span>
                                <span style="font-size: 10.5px; color: #e9d5ff; font-weight: 700;">Base: Autocarga / 0 kg</span>
                            </div>
                            <div style="font-size: 11px; color: #d8b4fe; margin-top: 3px;">
                                Serie única abierta para superar tu marca histórica. Al finalizar la sesión se guardará tu nuevo récord.
                            </div>
                        </div>

                        <!-- DESGLOSE DROIPSET AL FALLO EN 4 ETAPAS -->
                        <div id="dropset_preview_${ej.id}" class="dropset-preview-box" style="display: none;"></div>
                    </div>
                </div>`;
            });
        }
    }

    if (tipoSel === 'mental' || tipoSel === 'hibrida') {
        if (tipoSel === 'hibrida') {
            html += '<div style="font-weight: 800; font-size: 11.5px; text-transform: uppercase; color: #c084fc; margin: 14px 0 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 4px;">🧠 Ejercicios Mentales / Cognitivos:</div>';
        }
        if (eMentales.length === 0) {
            html += '<div style="color: #9ca3af; font-size: 12px; padding: 12px; text-align: center;">No tienes protocolos mentales creados.</div>';
        } else {
            eMentales.forEach(function(ec) {
                var muscP = APP_STATE.musculosMentales && APP_STATE.musculosMentales[ec.musculoPrincipal] ?
                    (APP_STATE.musculosMentales[ec.musculoPrincipal].icono + ' ' + APP_STATE.musculosMentales[ec.musculoPrincipal].nombre) : (ec.musculoPrincipal || 'Foco');
                html += `
                <div class="routine-checklist-card" id="card_ej_mental_${ec.id}">
                    <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; margin: 0;">
                        <input type="checkbox" name="ejercicios_mentales_rutina_check" value="${ec.id}" onchange="actualizarContadorEjerciciosSeleccionadosRutina()" style="margin-top: 3px; width: 18px; height: 18px; accent-color: #c084fc; cursor: pointer;">
                        <div style="flex: 1;">
                            <strong style="color: #c084fc; font-size: 13.5px; display: block; margin-bottom: 2px;">🧠 ${ec.nombre}</strong>
                            <div style="font-size: 11.5px; color: #94a3b8;">⏱️ ${ec.duracionMinutos || 15} min · ${muscP} (+${ec.fatigaEstimada || 15}% fatiga SNC · +${ec.expRecompensa || 25} EXP)</div>
                        </div>
                    </label>
                </div>`;
            });
        }
    }

    contCheck.innerHTML = html;
    filtrarEjerciciosModalRutina();
    actualizarContadorEjerciciosSeleccionadosRutina();
}

function toggleSerieCeroRutina(ejId, forzarEstado) {
    var inS = document.getElementById('series_rutina_custom_' + ejId);
    var inR = document.getElementById('reps_rutina_custom_' + ejId);
    var inP = document.getElementById('peso_rutina_custom_' + ejId);
    var btnCero = document.getElementById('btn_serie_cero_' + ejId);
    var btnFallo = document.getElementById('btn_fallo_rutina_' + ejId);
    var boxFallo = document.getElementById('dropset_preview_' + ejId);
    var bannerCero = document.getElementById('banner_serie_cero_' + ejId);
    var card = document.getElementById('card_ej_rutina_' + ejId);
    if (!btnCero) return;

    var nuevoEstado = (forzarEstado != null) ? !!forzarEstado : !btnCero.classList.contains('active');
    var ejCat = (APP_STATE.ejercicios || []).find(function(e) { return e && String(e.id) === String(ejId); });

    if (nuevoEstado) {
        // 1. Activar Serie 0
        btnCero.classList.add('active');
        if (bannerCero) bannerCero.style.display = 'block';
        if (card) {
            card.classList.add('serie-cero-card-active');
            card.classList.remove('mode-fallo-active');
        }

        // 2. DESACTIVAR FORZOSAMENTE AL FALLO (Mutuamente excluyentes)
        if (btnFallo) btnFallo.classList.remove('active');
        if (boxFallo) boxFallo.style.display = 'none';

        // 3. Fijar series en 0 y peso en 0 (autocarga)
        if (inS) inS.value = 0;
        if (inP) inP.value = (ejCat && ejCat.ultimoPesoSerieCero != null) ? ejCat.ultimoPesoSerieCero : 0;
        if (inR) {
            var repsGuardadas = (ejCat && (ejCat.ultimaSerieCeroReps || ejCat.recordSerieCero)) ? (ejCat.ultimaSerieCeroReps || ejCat.recordSerieCero) : (ejCat ? obtenerRepsPromedioEjercicio(ejCat) : 10);
            inR.value = repsGuardadas;
        }
    } else {
        // Desactivar Serie 0
        btnCero.classList.remove('active');
        if (bannerCero) bannerCero.style.display = 'none';
        if (card) card.classList.remove('serie-cero-card-active');

        if (inS && parseInt(inS.value) === 0) {
            inS.value = (ejCat && ejCat.series && ejCat.series > 0) ? ejCat.series : 3;
        }
        if (inP && parseFloat(inP.value) === 0) {
            inP.value = (ejCat && ejCat.peso != null) ? ejCat.peso : ((ejCat && ejCat.tipo === 'calistenia') ? 0 : 80);
        }
        if (inR) {
            inR.value = ejCat ? obtenerRepsPromedioEjercicio(ejCat) : 10;
        }
    }
}

function alCambiarInputSeriesRutina(ejId) {
    var inS = document.getElementById('series_rutina_custom_' + ejId);
    var btnCero = document.getElementById('btn_serie_cero_' + ejId);
    if (!inS) return;
    var val = parseInt(inS.value);
    if (val === 0) {
        toggleSerieCeroRutina(ejId, true);
    } else if (val > 0 && btnCero && btnCero.classList.contains('active')) {
        toggleSerieCeroRutina(ejId, false);
    }
}

function abrirModalNuevaRutina() {
    var inEditId = document.getElementById('modal-rutina-edit-id');
    if (inEditId) inEditId.value = "";
    var titleTxt = document.getElementById('modal-rutina-titulo-texto');
    var btnConfirm = document.getElementById('modal-rutina-btn-confirmar');
    var iconEl = document.getElementById('modal-rutina-header-icon');
    if (titleTxt) titleTxt.innerText = "CREAR NUEVA RUTINA";
    if (btnConfirm) btnConfirm.innerText = "✓ Crear Rutina";
    if (iconEl) iconEl.innerText = "🏋️‍♂️";

    var inNom = document.getElementById('modal-rutina-nombre');
    var inDesc = document.getElementById('modal-rutina-desc');
    var inTipo = document.getElementById('modal-rutina-tipo');
    var inBusq = document.getElementById('buscador-ejercicios-modal-rutina');
    var selPl = document.getElementById('modal-rutina-playlist');
    var inPen = document.getElementById('modal-rutina-penitencia-exp');
    if (inNom) inNom.value = "";
    if (inDesc) inDesc.value = "";
    if (inBusq) inBusq.value = "";
    if (inTipo) inTipo.value = (CATEGORIA_EJERCICIOS_ACTIVA === 'gimnasio-mental' || SUBFILTRO_BANCO_ACTIVO === 'mental' || FILTRO_RUTINAS_ACTIVO === 'mentales') ? 'mental' : 'fisica';
    if (inPen) inPen.value = MONARCA_RUTINA_PENITENCIA_EXP_DEFAULT;
    if (typeof actualizarSelectoresPlaylistRutinas === 'function') actualizarSelectoresPlaylistRutinas();
    if (selPl) selPl.value = "";

    SUBFILTRO_RUTINA_MODAL_ACTIVO = 'todos';
    var pills = document.querySelectorAll('.rutina-cat-pill');
    pills.forEach(function(p) { p.classList.remove('active'); });
    var pTodos = document.querySelector('.rutina-cat-pill[data-cat="todos"]');
    if (pTodos) pTodos.classList.add('active');

    actualizarChecklistRutinaSegunTipo(inTipo ? inTipo.value : 'fisica');
    actualizarContadorEjerciciosSeleccionadosRutina();

    var m = document.getElementById('modal-nueva-rutina');
    if (m) m.style.display = 'flex';
}

function abrirModalEditarRutina(rutinaIdOIdx, event) {
    if (event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        if (event.preventDefault) event.preventDefault();
    }
    if (!APP_STATE.rutinas) APP_STATE.rutinas = [];
    var rutina = null;
    var targetIdx = -1;

    if (typeof rutinaIdOIdx === 'string') {
        targetIdx = APP_STATE.rutinas.findIndex(function(r) {
            return r && (r.id === rutinaIdOIdx || r.codigo === rutinaIdOIdx);
        });
        if (targetIdx !== -1) {
            rutina = APP_STATE.rutinas[targetIdx];
        } else if (!isNaN(parseInt(rutinaIdOIdx))) {
            targetIdx = parseInt(rutinaIdOIdx);
            rutina = APP_STATE.rutinas[targetIdx];
        }
    } else if (typeof rutinaIdOIdx === 'number') {
        targetIdx = rutinaIdOIdx;
        rutina = APP_STATE.rutinas[targetIdx];
    }

    if (!rutina) {
        alert("No se encontró la rutina para editar.");
        return;
    }

    var inEditId = document.getElementById('modal-rutina-edit-id');
    if (inEditId) inEditId.value = rutina.id || ('RUT_IDX_' + targetIdx);

    var titleTxt = document.getElementById('modal-rutina-titulo-texto');
    var btnConfirm = document.getElementById('modal-rutina-btn-confirmar');
    var iconEl = document.getElementById('modal-rutina-header-icon');
    if (titleTxt) titleTxt.innerText = "✏️ EDITAR RUTINA";
    if (btnConfirm) btnConfirm.innerText = "💾 Guardar Cambios";
    if (iconEl) iconEl.innerText = "✏️";

    var inNom = document.getElementById('modal-rutina-nombre');
    var inDesc = document.getElementById('modal-rutina-desc');
    var inTipo = document.getElementById('modal-rutina-tipo');
    var inBusq = document.getElementById('buscador-ejercicios-modal-rutina');
    var selPl = document.getElementById('modal-rutina-playlist');
    var inPen = document.getElementById('modal-rutina-penitencia-exp');

    if (inNom) inNom.value = rutina.nombre || "";
    if (inDesc) inDesc.value = rutina.descripcion || "";
    if (inBusq) inBusq.value = "";
    if (inTipo) inTipo.value = rutina.tipo || "fisica";
    if (inPen) inPen.value = obtenerPenitenciaExpPorSerieRutina(rutina);
    if (typeof actualizarSelectoresPlaylistRutinas === 'function') actualizarSelectoresPlaylistRutinas();
    if (selPl) {
        var targetVal = rutina.playlistId || "";
        var optExists = Array.from(selPl.options).some(function(o) { return o.value === targetVal; });
        selPl.value = optExists ? targetVal : "";
    }

    SUBFILTRO_RUTINA_MODAL_ACTIVO = 'todos';
    var pills = document.querySelectorAll('.rutina-cat-pill');
    pills.forEach(function(p) { p.classList.remove('active'); });
    var pTodos = document.querySelector('.rutina-cat-pill[data-cat="todos"]');
    if (pTodos) pTodos.classList.add('active');

    actualizarChecklistRutinaSegunTipo(inTipo ? inTipo.value : 'fisica');

    // Marcar ejercicios seleccionados y precargar sus valores configurados
    if (rutina.ejercicios && Array.isArray(rutina.ejercicios)) {
        rutina.ejercicios.forEach(function(ejRut) {
            if (ejRut.esMental) {
                var chkM = document.querySelector('input[name="ejercicios_mentales_rutina_check"][value="' + ejRut.id + '"]');
                if (chkM) chkM.checked = true;
            } else {
                var chkF = document.getElementById('chk_rutina_' + ejRut.id);
                if (!chkF) {
                    chkF = document.querySelector('input[name="ejercicios_rutina_check"][value="' + ejRut.id + '"]');
                }
                if (chkF) {
                    chkF.checked = true;
                    alCambiarCheckEjercicioRutina(ejRut.id);

                    var inS = document.getElementById('series_rutina_custom_' + ejRut.id);
                    var inR = document.getElementById('reps_rutina_custom_' + ejRut.id);
                    var inP = document.getElementById('peso_rutina_custom_' + ejRut.id);
                    var btnF = document.getElementById('btn_fallo_rutina_' + ejRut.id);
                    var btnCero = document.getElementById('btn_serie_cero_' + ejRut.id);

                    var esCero = (ejRut.series === 0 || ejRut.esSerieCero);
                    if (inS) inS.value = esCero ? 0 : (ejRut.series || 3);
                    if (inR) {
                        var repsV = (ejRut.modalidadEsfuerzo === 'tiempo') ? (ejRut.tiempoSegundos || ejRut.repeticionesPromedio || 60) : (ejRut.repeticionesPromedio || obtenerRepsPromedioEjercicio(ejRut));
                        inR.value = repsV;
                    }
                    if (inP) inP.value = (ejRut.peso != null) ? ejRut.peso : 0;
                    if (esCero) {
                        if (btnCero) {
                            btnCero.classList.add('active');
                            var card = document.getElementById('card_ej_rutina_' + ejRut.id);
                            if (card) {
                                card.classList.add('serie-cero-card-active');
                                card.classList.remove('mode-fallo-active');
                            }
                            var bannerCero = document.getElementById('banner_serie_cero_' + ejRut.id);
                            if (bannerCero) bannerCero.style.display = 'block';
                        }
                        if (btnF) btnF.classList.remove('active');
                    } else if (btnF && ejRut.alFallo) {
                        btnF.classList.add('active');
                        var cardF = document.getElementById('card_ej_rutina_' + ejRut.id);
                        if (cardF) cardF.classList.add('mode-fallo-active');
                        recalcularDropsetEjercicio(ejRut.id);
                        var boxF = document.getElementById('dropset_preview_' + ejRut.id);
                        if (boxF) boxF.style.display = 'block';
                    }
                }
            }
        });
    }

    actualizarContadorEjerciciosSeleccionadosRutina();

    var m = document.getElementById('modal-nueva-rutina');
    if (m) m.style.display = 'flex';
}

function cerrarModalNuevaRutina() {
    var m = document.getElementById('modal-nueva-rutina');
    if (m) m.style.display = 'none';
}

function confirmarAgregarRutina() {
    var inNom = document.getElementById('modal-rutina-nombre');
    var inDesc = document.getElementById('modal-rutina-desc');
    var inTipo = document.getElementById('modal-rutina-tipo');
    var inEditId = document.getElementById('modal-rutina-edit-id');
    var editId = inEditId ? inEditId.value.trim() : "";

    var nom = inNom ? inNom.value.trim() : "";
    var desc = inDesc ? inDesc.value.trim() : "";
    var tipo = inTipo ? inTipo.value : "fisica";
    var tag = (tipo === 'mental' ? 'MENTAL · ENFOQUE' : (tipo === 'hibrida' ? 'HÍBRIDA · INTEGRAL' : 'SESIÓN · FUERZA'));

    if (!nom) {
        alert("Por favor ingresa un nombre para la rutina.");
        return;
    }

    var checkFisicos = document.querySelectorAll('input[name="ejercicios_rutina_check"]:checked');
    var checkMentales = document.querySelectorAll('input[name="ejercicios_mentales_rutina_check"]:checked');

    if (checkFisicos.length === 0 && checkMentales.length === 0) {
        alert("Selecciona al menos un ejercicio físico o mental para esta rutina.");
        return;
    }

    var selectedEjercicios = [];

    var idsFisicos = Array.from(checkFisicos).map(function(c) { return c.value; });
    (APP_STATE.ejercicios || []).forEach(function(e) {
        if (idsFisicos.includes(String(e.id))) {
            var item = JSON.parse(JSON.stringify(e));
            item.esMental = false;

            var inCustomSeries = document.getElementById('series_rutina_custom_' + e.id);
            var inCustomReps = document.getElementById('reps_rutina_custom_' + e.id);
            var inCustomPeso = document.getElementById('peso_rutina_custom_' + e.id);
            var btnFallo = document.getElementById('btn_fallo_rutina_' + e.id);
            var btnSerieCero = document.getElementById('btn_serie_cero_' + e.id);

            var esTiempoEj = (e.modalidadEsfuerzo === 'tiempo') || (e.tiempoSegundos != null && e.tiempoSegundos > 0);
            var repsDefault = esTiempoEj ? (e.tiempoSegundos || 60) : obtenerRepsPromedioEjercicio(e);
            
            var parsedSeries = inCustomSeries ? parseInt(inCustomSeries.value) : (e.series != null ? e.series : 1);
            if (isNaN(parsedSeries) || parsedSeries < 0) parsedSeries = 0;
            var esSerieCero = (parsedSeries === 0) || (btnSerieCero ? btnSerieCero.classList.contains('active') : false);
            var customSeries = esSerieCero ? 0 : Math.max(1, parsedSeries);

            var customReps = inCustomReps ? (parseFloat(inCustomReps.value) || repsDefault) : repsDefault;
            var customPeso = inCustomPeso ? (parseFloat(inCustomPeso.value) || 0) : (e.peso || 0);
            if (esSerieCero && customPeso === 80) customPeso = 0;
            var esAlFallo = (!esSerieCero && btnFallo) ? btnFallo.classList.contains('active') : false;

            item.modalidadEsfuerzo = esTiempoEj ? 'tiempo' : 'repeticiones';
            item.tiempoSegundos = esTiempoEj ? customReps : 0;
            item.tiempoReferencia = esTiempoEj ? customReps : 0;
            item.series = customSeries;
            item.esSerieCero = esSerieCero;
            item.recordSerieCero = e.recordSerieCero || item.recordSerieCero || (esSerieCero ? customReps : 0);
            item.ultimaSerieCeroReps = e.ultimaSerieCeroReps || item.ultimaSerieCeroReps || (esSerieCero ? customReps : 0);
            item.ultimoPesoSerieCero = e.ultimoPesoSerieCero || item.ultimoPesoSerieCero || customPeso;
            item.repeticionesPromedio = customReps;
            item.repeticiones = esTiempoEj ? (customReps + 's isométrico (' + formatearTiempoMMSS(customReps) + ')') : (customReps + ' reps');
            item.peso = esSerieCero ? 0 : customPeso;
            item.alFallo = esAlFallo;
            if (esAlFallo && !esSerieCero) {
                item.dropset = {
                    activo: true,
                    pesoInicial: customPeso,
                    etapas: calcularEtapasDropset(customPeso)
                };
            } else {
                item.dropset = null;
            }

            selectedEjercicios.push(item);
        }
    });

    var idsMentales = Array.from(checkMentales).map(function(c) { return c.value; });
    (APP_STATE.ejerciciosCerebrales || []).forEach(function(ec) {
        if (idsMentales.includes(String(ec.id))) {
            selectedEjercicios.push({
                id: ec.id,
                nombre: ec.nombre,
                esMental: true,
                tipo: 'mental',
                series: 1,
                peso: 0,
                alFallo: false,
                dropset: null,
                repeticiones: (ec.duracionMinutos || 15) + ' min',
                duracionMinutos: ec.duracionMinutos || 15,
                categorias: ['Mente', ec.musculoPrincipal || 'Foco'],
                musculoPrincipal: ec.musculoPrincipal,
                musculoSecundario: ec.musculoSecundario,
                fatigaEstimada: ec.fatigaEstimada || 15,
                fatigaPorcentaje: ec.fatigaEstimada || 15,
                expRecompensa: ec.expRecompensa || 25,
                protocolo: ec.protocolo || ec.descripcion || 'Foco estructurado'
            });
        }
    });

    if (!APP_STATE.rutinas) APP_STATE.rutinas = [];

    // MODO EDICIÓN SI editId ESTÁ PRESENTE
    if (editId) {
        var idxExistente = APP_STATE.rutinas.findIndex(function(r) {
            return r && (r.id === editId || r.codigo === editId);
        });

        if (idxExistente === -1 && editId.startsWith('RUT_IDX_')) {
            var rawIdx = parseInt(editId.replace('RUT_IDX_', ''));
            if (!isNaN(rawIdx) && rawIdx >= 0 && rawIdx < APP_STATE.rutinas.length) {
                idxExistente = rawIdx;
            }
        }

        if (idxExistente !== -1 && APP_STATE.rutinas[idxExistente]) {
            var rutAEditar = APP_STATE.rutinas[idxExistente];
            var selPlEdit = document.getElementById('modal-rutina-playlist');
            var plIdEdit = selPlEdit ? selPlEdit.value.trim() : '';
            var inPenEdit = document.getElementById('modal-rutina-penitencia-exp');
            var parsedPenEdit = inPenEdit ? parseInt(inPenEdit.value, 10) : MONARCA_RUTINA_PENITENCIA_EXP_DEFAULT;
            var penExpEdit = isNaN(parsedPenEdit) ? MONARCA_RUTINA_PENITENCIA_EXP_DEFAULT : Math.max(0, Math.min(500, parsedPenEdit));
            rutAEditar.nombre = nom;
            rutAEditar.descripcion = desc || (tipo === 'mental' ? "Entrenamiento cognitivo y foco" : "Entrenamiento programado");
            rutAEditar.tipo = tipo;
            rutAEditar.rankLabel = tag;
            rutAEditar.ejercicios = selectedEjercicios;
            rutAEditar.playlistId = plIdEdit || null;
            rutAEditar.penitenciaExpPorSerie = penExpEdit;
            rutAEditar.fechaActualizacion = Date.now();

            MonarcaDB.save(APP_STATE);
            cerrarModalNuevaRutina();
            renderizarPortalesRutinasEjercicios();
            if (typeof renderizarPortalesRutinas === 'function') renderizarPortalesRutinas(APP_STATE.rutinas);

            // Si esta rutina es la que está abierta en la vista detalle, refrescar la vista en vivo
            if (RUTINA_ACTIVA && (RUTINA_ACTIVA.idx === idxExistente || (RUTINA_ACTIVA.rutina && RUTINA_ACTIVA.rutina.id === rutAEditar.id))) {
                RUTINA_ACTIVA.rutina = rutAEditar;
                RUTINA_ACTIVA.idx = idxExistente;
                abrirDetalleRutina(idxExistente, true);
            }

            alert("✓ Rutina '" + nom + "' actualizada con éxito.");
            return;
        }
    }

    var yaExisteRut = APP_STATE.rutinas.some(function(r) {
        return r && r.nombre && r.nombre.trim().toLowerCase() === nom.trim().toLowerCase();
    });
    var permitirDuplicadoRut = false;
    if (yaExisteRut) {
        if (!confirm("Ya existe una rutina llamada \"" + nom + "\".\n¿Deseas agregar otra con el mismo nombre?")) {
            return;
        }
        permitirDuplicadoRut = true;
    }

    var nowRut = Date.now();
    var prefix = tipo === 'mental' ? 'COG-' : (tipo === 'hibrida' ? 'HIB-' : 'RUT-');
    var selPlNew = document.getElementById('modal-rutina-playlist');
    var plIdNew = selPlNew ? selPlNew.value.trim() : '';
    var inPenNew = document.getElementById('modal-rutina-penitencia-exp');
    var parsedPenNew = inPenNew ? parseInt(inPenNew.value, 10) : MONARCA_RUTINA_PENITENCIA_EXP_DEFAULT;
    var penExpNew = isNaN(parsedPenNew) ? MONARCA_RUTINA_PENITENCIA_EXP_DEFAULT : Math.max(0, Math.min(500, parsedPenNew));
    var nuevaRutina = {
        id: "RUT-" + nowRut,
        codigo: prefix + (APP_STATE.rutinas.length + 1),
        tipo: tipo,
        nombre: nom,
        descripcion: desc || (tipo === 'mental' ? "Entrenamiento cognitivo y foco" : "Entrenamiento programado"),
        rankLabel: tag,
        ejercicios: selectedEjercicios,
        playlistId: plIdNew || null,
        penitenciaExpPorSerie: penExpNew,
        permitirDuplicadoNombre: permitirDuplicadoRut,
        timestamp: nowRut,
        fechaActualizacion: nowRut
    };

    APP_STATE.rutinas.push(nuevaRutina);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevaRutina();
    renderizarPortalesRutinasEjercicios();
    if (typeof renderizarPortalesRutinas === 'function') renderizarPortalesRutinas(APP_STATE.rutinas);
    alert("✓ Rutina '" + nom + "' guardada con éxito con " + selectedEjercicios.length + " ejercicios.");
}

function eliminarRutina(rutinaIdOIdx, event) {
    if (event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        if (event.preventDefault) event.preventDefault();
    }
    if (!confirm("¿Deseas eliminar esta rutina programada?")) return;
    if (!APP_STATE.rutinas) return;

    var targetIdx = -1;
    if (typeof rutinaIdOIdx === 'string') {
        targetIdx = APP_STATE.rutinas.findIndex(function(r) { return r && (r.id === rutinaIdOIdx || r.codigo === rutinaIdOIdx); });
        if (targetIdx === -1 && !isNaN(parseInt(rutinaIdOIdx))) {
            targetIdx = parseInt(rutinaIdOIdx);
        }
    } else {
        targetIdx = rutinaIdOIdx;
    }

    if (targetIdx < 0 || targetIdx >= APP_STATE.rutinas.length) {
        console.warn("No se encontró rutina a eliminar:", rutinaIdOIdx);
        return;
    }

    var r = APP_STATE.rutinas[targetIdx];
    if (r && r.id && typeof registrarTombstone === 'function') {
        registrarTombstone('rutinas', r.id);
    }
    APP_STATE.rutinas.splice(targetIdx, 1);
    MonarcaDB.save(APP_STATE);

    // Re-renderizar ambas vistas para actualizar la pantalla al instante
    renderizarPortalesRutinasEjercicios();
    if (typeof renderizarPortalesRutinas === 'function') {
        renderizarPortalesRutinas(APP_STATE.rutinas);
    }
}

function renderizarPortalesRutinas(rutinas) {
    var cont = document.getElementById('contenedor-portales-rutinas');
    if (!cont) return;

    var rList = rutinas || APP_STATE.rutinas || [];

    if (!rList || rList.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 35px 20px; background: #121725; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🏋️‍♂️</span>
            <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 16px;">No tienes rutinas creadas</h4>
            <p style="color: #94a3b8; font-size: 13px; max-width: 420px; margin: 0 auto 16px auto;">
                Arma tus sesiones de entrenamiento personalizadas seleccionando los ejercicios que has creado.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevaRutina()">
                ➕ Crear Primera Rutina
            </button>
        </div>`;
        return;
    }

    var playlists = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getPlaylists === 'function')
        ? window.MonarcaPlayer.getPlaylists()
        : [];
    var defaultPlId = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getPlaylistDefaultRutinaId === 'function')
        ? window.MonarcaPlayer.getPlaylistDefaultRutinaId()
        : null;
    var canciones = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getCanciones === 'function')
        ? window.MonarcaPlayer.getCanciones()
        : [];
    var ctx = {
        playlists: playlists,
        defaultPlId: defaultPlId,
        canciones: canciones,
        cancionesMap: construirMapaCancionesPlaylist(canciones)
    };

    cont.innerHTML = rList.map(function(rut, idx) {
        return construirTarjetaRutinaNoirHtml(rut, idx, ctx);
    }).join('');
}

// ==========================================================================
// 8. TEMPORIZADORES, CALENTAMIENTO GUIADO Y GESTOR INDEPENDIENTE
// ==========================================================================

function emitirTonoAudio(frecuencia, duracion, tipo) {
    try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        var ctx = new AudioCtx();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = tipo || 'sine';
        osc.frequency.setValueAtTime(frecuencia || 880, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duracion || 0.2));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + (duracion || 0.2));
    } catch(e) {}
}

var CALENTAMIENTO_ESTADO = {
    activo: false,
    pausado: false,
    indicePaso: 0,
    tiempoRestante: 0,
    tiempoTotalPaso: 0,
    intervaloId: null,
    lista: [],
    callbackAlFinalizar: null
};

function iniciarCalentamientoAutomatico(callbackFin) {
    var lista = APP_STATE.rutinaCalentamiento || DEFAULT_STATE.rutinaCalentamiento || [];
    if (!lista || lista.length === 0) {
        if (callbackFin) callbackFin();
        return;
    }

    CALENTAMIENTO_ESTADO.activo = true;
    CALENTAMIENTO_ESTADO.pausado = false;
    CALENTAMIENTO_ESTADO.indicePaso = 0;
    CALENTAMIENTO_ESTADO.lista = lista;
    CALENTAMIENTO_ESTADO.callbackAlFinalizar = callbackFin;

    var modal = document.getElementById('modal-estiramientos');
    var modalBody = document.getElementById('modal-stretching-body');
    var modalComp = document.getElementById('modal-stretching-complete');

    if (modal) modal.style.display = 'flex';
    if (modalBody) modalBody.style.display = 'block';
    if (modalComp) modalComp.style.display = 'none';

    renderizarPasoCalentamiento();
}

function renderizarPasoCalentamiento() {
    if (CALENTAMIENTO_ESTADO.intervaloId) {
        clearInterval(CALENTAMIENTO_ESTADO.intervaloId);
        CALENTAMIENTO_ESTADO.intervaloId = null;
    }

    var paso = CALENTAMIENTO_ESTADO.lista[CALENTAMIENTO_ESTADO.indicePaso];
    if (!paso) {
        finalizarTodosLosCalentamientos();
        return;
    }

    CALENTAMIENTO_ESTADO.tiempoTotalPaso = Number(paso.duracionSegundos) || 30;
    CALENTAMIENTO_ESTADO.tiempoRestante = CALENTAMIENTO_ESTADO.tiempoTotalPaso;
    CALENTAMIENTO_ESTADO.pausado = false;

    var stepsCont = document.getElementById('stretch-steps-indicator');
    if (stepsCont) {
        var stepsHtml = '';
        CALENTAMIENTO_ESTADO.lista.forEach(function(p, i) {
            var cls = i === CALENTAMIENTO_ESTADO.indicePaso ? 'step-dot active' : (i < CALENTAMIENTO_ESTADO.indicePaso ? 'step-dot done' : 'step-dot');
            stepsHtml += `<span class="${cls}"></span>`;
        });
        stepsCont.innerHTML = stepsHtml;
    }

    var targetTitle = document.getElementById('stretch-routine-target');
    if (targetTitle) {
        targetTitle.innerText = `FASE PREVIA: CALENTAMIENTO (${CALENTAMIENTO_ESTADO.indicePaso + 1} DE ${CALENTAMIENTO_ESTADO.lista.length})`;
    }

    var stretchTitle = document.getElementById('stretch-title');
    var stretchDesc = document.getElementById('stretch-desc');
    if (stretchTitle) stretchTitle.innerText = paso.nombre;
    if (stretchDesc) stretchDesc.innerText = paso.descripcion || "Realiza este movimiento con fluidez y control articular.";

    actualizarDisplayTemporizadorCalentamiento();

    var btnToggle = document.getElementById('btn-timer-toggle');
    if (btnToggle) btnToggle.innerText = '⏸ Pausar';

    CALENTAMIENTO_ESTADO.intervaloId = setInterval(function() {
        if (CALENTAMIENTO_ESTADO.pausado) return;

        CALENTAMIENTO_ESTADO.tiempoRestante--;
        actualizarDisplayTemporizadorCalentamiento();

        if (CALENTAMIENTO_ESTADO.tiempoRestante <= 3 && CALENTAMIENTO_ESTADO.tiempoRestante > 0) {
            emitirTonoAudio(650, 0.08);
        }

        if (CALENTAMIENTO_ESTADO.tiempoRestante <= 0) {
            clearInterval(CALENTAMIENTO_ESTADO.intervaloId);
            CALENTAMIENTO_ESTADO.intervaloId = null;
            emitirTonoAudio(950, 0.35, 'triangle');
            if (navigator.vibrate) navigator.vibrate([100, 60, 150]);
            siguienteCalentamiento();
        }
    }, 1000);
}

function actualizarDisplayTemporizadorCalentamiento() {
    var cdEl = document.getElementById('timer-countdown');
    var barEl = document.getElementById('timer-bar-fill');
    if (cdEl) cdEl.innerText = Math.max(0, CALENTAMIENTO_ESTADO.tiempoRestante);
    if (barEl) {
        var pct = CALENTAMIENTO_ESTADO.tiempoTotalPaso > 0 
            ? Math.round((CALENTAMIENTO_ESTADO.tiempoRestante / CALENTAMIENTO_ESTADO.tiempoTotalPaso) * 100)
            : 0;
        barEl.style.width = pct + '%';
    }
}

function toggleTemporizadorCalentamiento() {
    CALENTAMIENTO_ESTADO.pausado = !CALENTAMIENTO_ESTADO.pausado;
    var btnToggle = document.getElementById('btn-timer-toggle');
    if (btnToggle) {
        btnToggle.innerText = CALENTAMIENTO_ESTADO.pausado ? '▶ Reanudar' : '⏸ Pausar';
    }
}
function toggleTemporizadorEstiramiento() { toggleTemporizadorCalentamiento(); }

function siguienteCalentamiento() {
    if (CALENTAMIENTO_ESTADO.intervaloId) {
        clearInterval(CALENTAMIENTO_ESTADO.intervaloId);
        CALENTAMIENTO_ESTADO.intervaloId = null;
    }
    CALENTAMIENTO_ESTADO.indicePaso++;
    if (CALENTAMIENTO_ESTADO.indicePaso < CALENTAMIENTO_ESTADO.lista.length) {
        renderizarPasoCalentamiento();
    } else {
        finalizarTodosLosCalentamientos();
    }
}
function siguienteEstiramiento() { siguienteCalentamiento(); }

function omitirCalentamiento() {
    if (CALENTAMIENTO_ESTADO.intervaloId) {
        clearInterval(CALENTAMIENTO_ESTADO.intervaloId);
        CALENTAMIENTO_ESTADO.intervaloId = null;
    }
    cerrarModalCalentamiento();
    if (CALENTAMIENTO_ESTADO.callbackAlFinalizar) {
        CALENTAMIENTO_ESTADO.callbackAlFinalizar();
    }
}
function omitirEstiramientos() { omitirCalentamiento(); }

function finalizarTodosLosCalentamientos() {
    if (CALENTAMIENTO_ESTADO.intervaloId) {
        clearInterval(CALENTAMIENTO_ESTADO.intervaloId);
        CALENTAMIENTO_ESTADO.intervaloId = null;
    }
    var modalBody = document.getElementById('modal-stretching-body');
    var modalComp = document.getElementById('modal-stretching-complete');
    if (modalBody) modalBody.style.display = 'none';
    if (modalComp) modalComp.style.display = 'block';
}

function irARutinaDesbloqueada() {
    cerrarModalCalentamiento();
    if (CALENTAMIENTO_ESTADO.callbackAlFinalizar) {
        CALENTAMIENTO_ESTADO.callbackAlFinalizar();
    }
}

function cerrarModalCalentamiento() {
    if (CALENTAMIENTO_ESTADO.intervaloId) {
        clearInterval(CALENTAMIENTO_ESTADO.intervaloId);
        CALENTAMIENTO_ESTADO.intervaloId = null;
    }
    CALENTAMIENTO_ESTADO.activo = false;
    var modal = document.getElementById('modal-estiramientos');
    if (modal) modal.style.display = 'none';
}
function cerrarModalEstiramientos() { cerrarModalCalentamiento(); }

// --- EDITOR INDEPENDIENTE DE CALENTAMIENTO Y MOVILIDAD ---

function abrirGestorCalentamiento() {
    if (!APP_STATE.rutinaCalentamiento) {
        APP_STATE.rutinaCalentamiento = JSON.parse(JSON.stringify(DEFAULT_STATE.rutinaCalentamiento));
    }
    renderizarListaEditorCalentamiento();
    var m = document.getElementById('modal-gestor-calentamiento');
    if (m) m.style.display = 'flex';
}

function cerrarGestorCalentamiento() {
    var m = document.getElementById('modal-gestor-calentamiento');
    if (m) m.style.display = 'none';
}

function renderizarListaEditorCalentamiento() {
    var cont = document.getElementById('contenedor-editor-calentamiento');
    if (!cont) return;

    var lista = APP_STATE.rutinaCalentamiento || [];
    var html = '';

    lista.forEach(function(item, idx) {
        html += `
        <div class="editor-cal-item" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:12px 14px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:800; color:#111827;">PASO ${idx + 1}</span>
                <button type="button" onclick="eliminarPasoCalentamiento(${idx})" style="background:none; border:none; color:#ef4444; font-size:12px; font-weight:700; cursor:pointer;">
                    Eliminar
                </button>
            </div>
            <div style="margin-bottom:6px;">
                <label style="font-size:11px; color:#6b7280; font-weight:700; text-transform:uppercase;">Nombre del Calentamiento:</label>
                <input type="text" class="finanzas-input-clean input-cal-nombre" value="${item.nombre}" style="background:#ffffff; border:1px solid #d1d5db; border-radius:8px; padding:6px 10px; width:100%; box-sizing:border-box; font-size:13px; font-weight:600; margin-top:2px;">
            </div>
            <div style="display:flex; gap:10px; margin-bottom:6px;">
                <div style="flex:1;">
                    <label style="font-size:11px; color:#6b7280; font-weight:700; text-transform:uppercase;">Duración (Segundos):</label>
                    <input type="number" class="finanzas-input-clean input-cal-seg" value="${item.duracionSegundos || 30}" min="10" max="180" style="background:#ffffff; border:1px solid #d1d5db; border-radius:8px; padding:6px 10px; width:100%; box-sizing:border-box; font-size:13px; font-weight:700; margin-top:2px;">
                </div>
            </div>
            <div>
                <label style="font-size:11px; color:#6b7280; font-weight:700; text-transform:uppercase;">Instrucciones de Movilidad:</label>
                <input type="text" class="finanzas-input-clean input-cal-desc" value="${item.descripcion || ''}" placeholder="Ej: Rotaciones continuas de articulaciones..." style="background:#ffffff; border:1px solid #d1d5db; border-radius:8px; padding:6px 10px; width:100%; box-sizing:border-box; font-size:12px; margin-top:2px;">
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function agregarPasoCalentamiento() {
    if (!APP_STATE.rutinaCalentamiento) APP_STATE.rutinaCalentamiento = [];
    APP_STATE.rutinaCalentamiento.push({
        id: "CAL-" + Date.now(),
        nombre: "Nuevo Ejercicio de Movilidad",
        duracionSegundos: 30,
        descripcion: "Movimiento preparatorio y lubricación articular."
    });
    renderizarListaEditorCalentamiento();
}

function eliminarPasoCalentamiento(idx) {
    if (!APP_STATE.rutinaCalentamiento) return;
    APP_STATE.rutinaCalentamiento.splice(idx, 1);
    renderizarListaEditorCalentamiento();
}

function guardarCalentamientoPersonalizado() {
    var cont = document.getElementById('contenedor-editor-calentamiento');
    if (!cont) return;

    var items = cont.querySelectorAll('.editor-cal-item');
    var nuevaLista = [];

    items.forEach(function(el, i) {
        var nom = el.querySelector('.input-cal-nombre').value.trim() || ("Calentamiento " + (i + 1));
        var seg = Number(el.querySelector('.input-cal-seg').value) || 30;
        var desc = el.querySelector('.input-cal-desc').value.trim() || "Acondicionamiento previo";

        nuevaLista.push({
            id: "CAL-" + (i + 1),
            nombre: nom,
            duracionSegundos: Math.max(5, seg),
            descripcion: desc
        });
    });

    if (nuevaLista.length === 0) {
        alert("Debe haber al menos un paso de calentamiento.");
        return;
    }

    APP_STATE.rutinaCalentamiento = nuevaLista;
    MonarcaDB.save(APP_STATE);
    cerrarGestorCalentamiento();
    alert("Configuración de calentamiento actualizada con éxito.");
}

// --- VISTA DETALLADA DEL EJERCICIO ---

var EJERCICIO_MODAL_ACTIVO = null;

function abrirModalDetalleEjercicio(ej) {
    EJERCICIO_MODAL_ACTIVO = ej;
    var modal = document.getElementById('modal-detalle-ejercicio');
    if (!modal) return;

    var titEl = document.getElementById('det-ej-nombre');
    var catEl = document.getElementById('det-ej-tipo');
    var repsEl = document.getElementById('det-ej-series-reps');
    var fatEl = document.getElementById('det-ej-fatiga');
    var muscEl = document.getElementById('det-ej-musculos');
    var descEl = document.getElementById('det-ej-desc');
    var tecEl = document.getElementById('det-ej-tecnica');

    if (titEl) titEl.innerText = ej.nombre || 'Detalle del Ejercicio';
    if (catEl) catEl.innerText = (ej.tipo === 'calistenia') ? 'CALISTENIA · PESO CORPORAL' : 'GIMNASIO · CARGA CONCENTRADA';
    var repsStr = (ej.series || 1) + ' Series × ' + (ej.repeticiones || '8-10 reps') + (ej.peso ? (' @ ' + ej.peso + ' kg') : '');
    if (repsEl) repsEl.innerText = repsStr;
    if (fatEl) fatEl.innerText = '+' + (ej.fatigaPorcentaje || 20) + '% Carga';
    
    var cats = (ej.categorias || []).join(' · ') || 'Grupos Principales';
    if (muscEl) muscEl.innerText = cats;
    if (descEl) descEl.innerText = ej.descripcion || 'Sin descripción técnica registrada.';

    var dropBox = document.getElementById('det-ej-dropset-box');
    if (dropBox) {
        if (ej.alFallo && ej.dropset && ej.dropset.etapas) {
            var dropHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 11.5px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px;">🔥 PROTOCOLO ÚLTIMA SERIE AL FALLO (DROIPSET 4 ETAPAS)</span>
                    <span style="font-size: 11.5px; font-weight: 800; color: #38bdf8;">${ej.peso || 80} kg Base</span>
                </div>
                <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
                    En la última serie, alcanza las repeticiones con ${ej.peso || 80} kg y desciende peso de inmediato en 4 etapas:
                </div>`;
            ej.dropset.etapas.forEach(function(et) {
                dropHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; padding: 5px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                    <span style="color: #f8fafc; font-weight: 700; width: 65px;">Etapa ${et.num}:</span>
                    <span style="color: #38bdf8; font-weight: 800; width: 60px;">${et.peso} kg</span>
                    <span style="color: #94a3b8; font-size: 11px; flex: 1; text-align: right;">➔ ${et.discos} (${et.repsInfo})</span>
                </div>`;
            });
            dropBox.innerHTML = dropHtml;
            dropBox.style.display = 'block';
        } else {
            dropBox.style.display = 'none';
        }
    }
    
    var consejos = "Mantén la respiración acompasada (inhala en fase excéntrica, exhala con fuerza en fase concéntrica). Controla la cadencia y evita balanceos para aislar el grupo muscular objetivo.";
    if (/press|banca|pecho/i.test(ej.nombre)) {
        consejos = "Retrae y deprime escápulas contra el respaldo. Mantén los codos a unos 45° con respecto al torso para proteger los manguitos rotadores y focalizar la tensión en el pectoral.";
    } else if (/sentadilla|pierna/i.test(ej.nombre)) {
        consejos = "Pies a la anchura de hombros o ligeramente superior. Mantén la columna neutra y el pecho erguido. Empuja el suelo a través de los talones y el mediopié sin colapsar rodillas hacia adentro.";
    } else if (/dominada|jalon|espalda|remo/i.test(ej.nombre)) {
        consejos = "Inicia el movimiento con una depresión escapular antes de flexionar los brazos. Lleva los codos hacia la cadera para maximizar el reclutamiento dorsal y no tirar solo con bíceps.";
    }
    if (tecEl) tecEl.innerText = consejos;

    modal.style.display = 'flex';
}

function registrarEjercicioDesdeModal() {
    if (!EJERCICIO_MODAL_ACTIVO) return;
    aplicarDesgasteEjercicioIndividual(EJERCICIO_MODAL_ACTIVO, true);
    cerrarModalDetalleEjercicio();
    alert("⚡ ¡Ejercicio registrado! Se ha cargado el porcentaje de fatiga muscular en tu Estado Personal.");
}

function cerrarModalDetalleEjercicio() {
    var modal = document.getElementById('modal-detalle-ejercicio');
    if (modal) modal.style.display = 'none';
}

// --- ASISTENTE DE GIMNASIO: DESCANSO ENTRE SERIES (REST TIMER + PANTALLA APAGADA v11.07) ---

var TIEMPO_DESCANSO_SELECCIONADO = 60;
var MONARCA_REST_NOTIF_ID = 77790;
var MONARCA_REST_CHANNEL_ID = 'monarca_rest_timer_channel_v1';
var _MONARCA_REST_BRIDGE_INIT = false;
var _MONARCA_REST_LN_CANAL_OK = false;

var ASISTENTE_GYM = {
    descansoRestante: 0,
    descansoTotal: 0,
    finTimestamp: 0,
    finalizado: false,
    ultimoSegundoPitido: -1,
    intervaloId: null
};

function _obtenerPluginsNativosDescansoGym() {
    if (typeof window === 'undefined' || !window.Capacitor || !window.Capacitor.Plugins) {
        return { alarm: null, ln: null };
    }
    return {
        alarm: window.Capacitor.Plugins.MonarcaAlarm || null,
        ln: window.Capacitor.Plugins.LocalNotifications || null
    };
}

function inicializarPuenteDescansoGymNativo() {
    if (_MONARCA_REST_BRIDGE_INIT || typeof window === 'undefined') return;

    var p = _obtenerPluginsNativosDescansoGym();
    if (p.alarm && typeof p.alarm.addListener === 'function') {
        _MONARCA_REST_BRIDGE_INIT = true;
        try {
            p.alarm.addListener('restTimerFinished', function() {
                if (ASISTENTE_GYM.finTimestamp > 0 && !ASISTENTE_GYM.finalizado) {
                    finalizarDescansoGym({ desdeNativo: true });
                }
            });
        } catch (e) {}
        try {
            p.alarm.addListener('restTimerOpened', function() {
                sincronizarDescansoGymAlVolver();
                if (typeof cambiarVista === 'function' && window.RUTINA_ACTIVA && window.RUTINA_ACTIVA.rutina) {
                    cambiarVista('vista-detalle-rutina-dinamica');
                }
            });
        } catch (e) {}
    }
}

function _asegurarPermisoNotifDescansoGym() {
    var p = _obtenerPluginsNativosDescansoGym();
    if (p.ln && typeof p.ln.checkPermissions === 'function') {
        try {
            p.ln.checkPermissions().then(function(res) {
                if (res && res.display !== 'granted' && typeof p.ln.requestPermissions === 'function') {
                    p.ln.requestPermissions().catch(function() {});
                }
            }).catch(function() {});
        } catch (e) {}
        return;
    }
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        try {
            Notification.requestPermission().catch(function() {});
        } catch (e) {}
    }
}

function programarNotificacionDescansoGym(finTimestampMs, duracionSegs) {
    inicializarPuenteDescansoGymNativo();
    _asegurarPermisoNotifDescansoGym();

    var segs = Math.max(1, parseInt(duracionSegs, 10) || 60);
    var rutinaNombre = (window.RUTINA_ACTIVA && window.RUTINA_ACTIVA.rutina && window.RUTINA_ACTIVA.rutina.nombre)
        ? String(window.RUTINA_ACTIVA.rutina.nombre).trim()
        : '';
    var titulo = '⏱️ ¡Descanso terminado! ¡A entrenar!';
    var cuerpo = 'Finalizó tu descanso de ' + segs + 's' + (rutinaNombre ? (' · ' + rutinaNombre) : '') + ' — ¡Siguiente serie lista!';

    var p = _obtenerPluginsNativosDescansoGym();

    // 1. Motor Nativo Principal (AlarmManager.setAlarmClock + WakeLock + Vibración + Audífonos BT)
    if (p.alarm && typeof p.alarm.programarDescanso === 'function') {
        try {
            p.alarm.programarDescanso({
                timestamp: finTimestampMs,
                segundos: segs,
                titulo: titulo,
                cuerpo: cuerpo
            }).catch(function(err) {
                console.warn('[RestTimer Native Schedule]', err);
            });
            return;
        } catch (e) {
            console.warn('[RestTimer Native Error]', e);
        }
    }

    // 2. Respaldo Capacitor LocalNotifications si el plugin nativo no expone programarDescanso
    if (p.ln && typeof p.ln.schedule === 'function') {
        var programarLN = function() {
            var payload = {
                notifications: [{
                    id: MONARCA_REST_NOTIF_ID,
                    title: titulo,
                    body: cuerpo,
                    schedule: { at: new Date(finTimestampMs), allowWhileIdle: true },
                    channelId: MONARCA_REST_CHANNEL_ID,
                    autoCancel: true,
                    extra: {
                        monarcaAlertTipo: 'rest-timer',
                        openView: 'vista-detalle-rutina-dinamica'
                    }
                }]
            };
            try {
                if (typeof p.ln.cancel === 'function') {
                    p.ln.cancel({ notifications: [{ id: MONARCA_REST_NOTIF_ID }] })
                        .catch(function() {})
                        .finally(function() {
                            p.ln.schedule(payload).catch(function() {});
                        });
                } else {
                    p.ln.schedule(payload).catch(function() {});
                }
            } catch (e) {}
        };

        if (!_MONARCA_REST_LN_CANAL_OK && typeof p.ln.createChannel === 'function') {
            p.ln.createChannel({
                id: MONARCA_REST_CHANNEL_ID,
                name: 'Descanso Entre Series (Rutinas)',
                description: 'Aviso inmediato cuando termina tu descanso entre series',
                importance: 4,
                visibility: 1,
                vibration: true,
                lights: true,
                lightColor: '#38bdf8'
            }).then(function() {
                _MONARCA_REST_LN_CANAL_OK = true;
                programarLN();
            }).catch(function() {
                programarLN();
            });
        } else {
            programarLN();
        }
    }
}

function cancelarNotificacionDescansoGym(limpiarEntregada) {
    var clearFlag = (limpiarEntregada !== false);
    var p = _obtenerPluginsNativosDescansoGym();

    if (p.alarm && typeof p.alarm.cancelarDescanso === 'function') {
        try {
            p.alarm.cancelarDescanso({ clearNotification: clearFlag }).catch(function() {});
        } catch (e) {}
    }

    if (p.ln) {
        try {
            if (typeof p.ln.cancel === 'function') {
                p.ln.cancel({ notifications: [{ id: MONARCA_REST_NOTIF_ID }] }).catch(function() {});
            }
            if (clearFlag && typeof p.ln.removeDeliveredNotifications === 'function') {
                p.ln.removeDeliveredNotifications({ notifications: [{ id: MONARCA_REST_NOTIF_ID }] }).catch(function() {});
            }
        } catch (e) {}
    }

    if (clearFlag && typeof navigator !== 'undefined' && navigator.serviceWorker && navigator.serviceWorker.controller && typeof navigator.serviceWorker.ready === 'object') {
        try {
            navigator.serviceWorker.ready.then(function(swReg) {
                if (swReg && typeof swReg.getNotifications === 'function') {
                    return swReg.getNotifications({ tag: 'monarca-rest-timer' }).then(function(lista) {
                        (lista || []).forEach(function(n) { try { n.close(); } catch (e) {} });
                    });
                }
            }).catch(function() {});
        } catch (e) {}
    }
}

function _notificarWebFinDescansoGym(duracionSegs) {
    var p = _obtenerPluginsNativosDescansoGym();
    // Si estamos en APK nativa con plugin nativo/LN, no disparar duplicado web
    if (p.alarm || p.ln) return;
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

    var rutinaNombre = (window.RUTINA_ACTIVA && window.RUTINA_ACTIVA.rutina && window.RUTINA_ACTIVA.rutina.nombre)
        ? String(window.RUTINA_ACTIVA.rutina.nombre).trim()
        : '';
    var titulo = '⏱️ ¡Descanso terminado! ¡A entrenar!';
    var cuerpo = 'Finalizó tu descanso de ' + (duracionSegs || 60) + 's' + (rutinaNombre ? (' · ' + rutinaNombre) : '') + ' — ¡Siguiente serie lista!';

    try {
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(function(swReg) {
                return swReg.showNotification(titulo, {
                    body: cuerpo,
                    icon: 'icons/icon-192.png',
                    badge: 'icons/icon-192.png',
                    tag: 'monarca-rest-timer',
                    renotify: true,
                    vibrate: [260, 110, 260, 110, 420],
                    data: { monarcaAlertTipo: 'rest-timer', openView: 'vista-detalle-rutina-dinamica' }
                });
            }).catch(function() {
                try { new Notification(titulo, { body: cuerpo, icon: 'icons/icon-192.png', tag: 'monarca-rest-timer' }); } catch (e) {}
            });
        } else {
            new Notification(titulo, { body: cuerpo, icon: 'icons/icon-192.png', tag: 'monarca-rest-timer' });
        }
    } catch (e) {}
}

function seleccionarTiempoDescanso(segundos) {
    TIEMPO_DESCANSO_SELECCIONADO = segundos || 60;
    var botones = [30, 60, 90, 120];
    botones.forEach(function(s) {
        var b = document.getElementById('btn-rest-' + s);
        if (b) {
            if (s === TIEMPO_DESCANSO_SELECCIONADO) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        }
    });
    // Iniciar cronómetro de descanso con el tiempo seleccionado
    iniciarDescansoGym(TIEMPO_DESCANSO_SELECCIONADO);
}

function _aplicarEstiloCajaRestTimer(completado) {
    var boxEl = document.getElementById('gym-rest-timer-box');
    var numEl = document.getElementById('rest-timer-num');
    var statusEl = document.getElementById('rest-timer-status-txt');
    var barEl = document.getElementById('rest-timer-bar-fill');
    var btnEl = document.getElementById('btn-rest-detener');

    if (completado) {
        if (boxEl) {
            boxEl.style.background = 'rgba(16, 185, 129, 0.12)';
            boxEl.style.borderColor = 'rgba(16, 185, 129, 0.45)';
        }
        if (numEl) {
            numEl.innerText = '¡A entrenar!';
            numEl.style.color = '#34d399';
        }
        if (statusEl) {
            statusEl.innerText = '¡Descanso terminado!';
            statusEl.style.color = '#6ee7b7';
        }
        if (barEl) {
            barEl.style.width = '100%';
            barEl.style.background = '#10b981';
        }
        if (btnEl) {
            btnEl.innerText = '✓ Listo';
            btnEl.style.background = 'rgba(16, 185, 129, 0.2)';
            btnEl.style.borderColor = 'rgba(16, 185, 129, 0.45)';
            btnEl.style.color = '#6ee7b7';
        }
    } else {
        if (boxEl) {
            boxEl.style.background = 'rgba(56, 189, 248, 0.08)';
            boxEl.style.borderColor = 'rgba(56, 189, 248, 0.25)';
        }
        if (numEl) {
            numEl.style.color = '#38bdf8';
        }
        if (statusEl) {
            statusEl.innerText = 'Descanso en curso · 🔔 Aviso activo';
            statusEl.style.color = '#94a3b8';
        }
        if (barEl) {
            barEl.style.background = '#38bdf8';
        }
        if (btnEl) {
            btnEl.innerText = '✕ Detener';
            btnEl.style.background = 'rgba(239, 68, 68, 0.2)';
            btnEl.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            btnEl.style.color = '#fca5a5';
        }
    }
}

function finalizarDescansoGym(opts) {
    if (ASISTENTE_GYM.finalizado) return;
    opts = opts || {};

    ASISTENTE_GYM.finalizado = true;
    if (ASISTENTE_GYM.intervaloId) {
        clearInterval(ASISTENTE_GYM.intervaloId);
        ASISTENTE_GYM.intervaloId = null;
    }

    var duracionUsada = ASISTENTE_GYM.descansoTotal || TIEMPO_DESCANSO_SELECCIONADO || 60;
    ASISTENTE_GYM.descansoRestante = 0;
    ASISTENTE_GYM.finTimestamp = 0;

    var boxEl = document.getElementById('gym-rest-timer-box');
    if (boxEl) boxEl.style.display = 'flex';
    _aplicarEstiloCajaRestTimer(true);

    var esVisible = (typeof document === 'undefined' || document.visibilityState === 'visible');

    if (!opts.desdeNativo && !opts.desdeFondo && esVisible) {
        // Usuario mirando la pantalla: cancelar la alarma nativa pendiente para no duplicar notificación
        cancelarNotificacionDescansoGym(true);
        emitirTonoAudio(1050, 0.35, 'triangle');
        if (navigator.vibrate) navigator.vibrate([150, 80, 200]);
    } else if (opts.desdeFondo && esVisible) {
        // Volvió justo después de que la notificación nativa sonó en pantalla apagada: limpiar notificación entregada
        cancelarNotificacionDescansoGym(true);
    }

    // Respaldo Web/PWA cuando no existe puente nativo Android
    if (!opts.desdeNativo) {
        _notificarWebFinDescansoGym(duracionUsada);
    }

    if (typeof guardarEstadoSesionActivaEnStorage === 'function') guardarEstadoSesionActivaEnStorage();
}

function _tickDescansoGym() {
    if (!ASISTENTE_GYM.finTimestamp || ASISTENTE_GYM.finalizado) return;

    var restanteMs = ASISTENTE_GYM.finTimestamp - Date.now();
    var restanteSeg = Math.max(0, Math.ceil(restanteMs / 1000));

    if (restanteSeg !== ASISTENTE_GYM.descansoRestante) {
        ASISTENTE_GYM.descansoRestante = restanteSeg;
        actualizarDisplayRestTimer();

        if (restanteSeg <= 3 && restanteSeg > 0 && restanteSeg !== ASISTENTE_GYM.ultimoSegundoPitido) {
            ASISTENTE_GYM.ultimoSegundoPitido = restanteSeg;
            if (typeof document === 'undefined' || document.visibilityState === 'visible') {
                emitirTonoAudio(700, 0.08);
            }
        }
    }

    if (restanteMs <= 0) {
        var estabaOculto = (typeof document !== 'undefined' && document.visibilityState !== 'visible');
        finalizarDescansoGym({ desdeFondo: estabaOculto });
    }
}

function iniciarDescansoGym(segundos, finTimestampExistente) {
    if (ASISTENTE_GYM.intervaloId) {
        clearInterval(ASISTENTE_GYM.intervaloId);
        ASISTENTE_GYM.intervaloId = null;
    }

    var duracion = Math.max(1, parseInt(segundos || TIEMPO_DESCANSO_SELECCIONADO || 60, 10) || 60);
    var ahora = Date.now();
    var finTs = (finTimestampExistente && Number(finTimestampExistente) > ahora + 300)
        ? Number(finTimestampExistente)
        : (ahora + (duracion * 1000));
    var restanteInicial = Math.max(1, Math.ceil((finTs - ahora) / 1000));

    ASISTENTE_GYM.descansoTotal = Math.max(duracion, restanteInicial);
    ASISTENTE_GYM.descansoRestante = restanteInicial;
    ASISTENTE_GYM.finTimestamp = finTs;
    ASISTENTE_GYM.finalizado = false;
    ASISTENTE_GYM.ultimoSegundoPitido = -1;

    var boxEl = document.getElementById('gym-rest-timer-box');
    if (boxEl) boxEl.style.display = 'flex';
    _aplicarEstiloCajaRestTimer(false);

    actualizarDisplayRestTimer();
    programarNotificacionDescansoGym(finTs, restanteInicial);
    if (typeof guardarEstadoSesionActivaEnStorage === 'function') guardarEstadoSesionActivaEnStorage();

    ASISTENTE_GYM.intervaloId = setInterval(_tickDescansoGym, 250);
}

function sincronizarDescansoGymAlVolver() {
    if (!ASISTENTE_GYM.finTimestamp || ASISTENTE_GYM.finalizado) return;

    var restanteMs = ASISTENTE_GYM.finTimestamp - Date.now();
    if (restanteMs <= 0) {
        finalizarDescansoGym({ desdeFondo: true });
        return;
    }

    ASISTENTE_GYM.descansoRestante = Math.max(1, Math.ceil(restanteMs / 1000));
    var boxEl = document.getElementById('gym-rest-timer-box');
    if (boxEl) boxEl.style.display = 'flex';
    _aplicarEstiloCajaRestTimer(false);
    actualizarDisplayRestTimer();

    if (!ASISTENTE_GYM.intervaloId) {
        ASISTENTE_GYM.intervaloId = setInterval(_tickDescansoGym, 250);
    }
}

function detenerDescansoGym() {
    if (ASISTENTE_GYM.intervaloId) {
        clearInterval(ASISTENTE_GYM.intervaloId);
        ASISTENTE_GYM.intervaloId = null;
    }
    ASISTENTE_GYM.descansoRestante = 0;
    ASISTENTE_GYM.finTimestamp = 0;
    ASISTENTE_GYM.finalizado = false;
    ASISTENTE_GYM.ultimoSegundoPitido = -1;

    cancelarNotificacionDescansoGym(true);

    var boxEl = document.getElementById('gym-rest-timer-box');
    if (boxEl) boxEl.style.display = 'none';
    if (typeof guardarEstadoSesionActivaEnStorage === 'function') guardarEstadoSesionActivaEnStorage();
}

function actualizarDisplayRestTimer() {
    var numEl = document.getElementById('rest-timer-num');
    var barEl = document.getElementById('rest-timer-bar-fill');
    if (numEl && !ASISTENTE_GYM.finalizado) {
        var m = Math.floor(ASISTENTE_GYM.descansoRestante / 60);
        var s = ASISTENTE_GYM.descansoRestante % 60;
        numEl.innerText = (m > 0 ? (m + ':' + (s < 10 ? '0' : '') + s) : (s + 's'));
    }
    if (barEl && ASISTENTE_GYM.descansoTotal > 0 && !ASISTENTE_GYM.finalizado) {
        var pct = Math.round((ASISTENTE_GYM.descansoRestante / ASISTENTE_GYM.descansoTotal) * 100);
        barEl.style.width = Math.max(0, Math.min(100, pct)) + '%';
    }
}

if (typeof window !== 'undefined') {
    window.sincronizarDescansoGymAlVolver = sincronizarDescansoGymAlVolver;
    window.programarNotificacionDescansoGym = programarNotificacionDescansoGym;
    window.cancelarNotificacionDescansoGym = cancelarNotificacionDescansoGym;
    window.addEventListener('focus', sincronizarDescansoGymAlVolver);
    inicializarPuenteDescansoGymNativo();
}

// --- INTERACCIÓN DE FILAS Y SERIES DE RUTINA (v10.6) ---

function alClickFilaEjercicio(e, ejJson, idx) {
    if (e.target.closest('.clean-row-checkbox-box') || e.target.closest('.btn-clean-detail') || e.target.closest('.series-check-row')) return;
    try {
        var ej = JSON.parse(decodeURIComponent(ejJson));
        abrirModalDetalleEjercicio(ej);
    } catch(err) {
        console.error(err);
    }
}

function alVerDetalleEjercicio(e, ejJson) {
    if (e) {
        e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
    }
    try {
        var ej = JSON.parse(decodeURIComponent(ejJson));
        abrirModalDetalleEjercicio(ej);
    } catch(err) {
        console.error(err);
    }
}

var HISTORIAL_FACTOR_SERIES = {};
var CHART_FATIGA_RUTINA_SESION = null;

function obtenerPesoBaseEjercicio(ej) {
    if (!ej) return 80;
    if (ej.esSerieCero || ej.series === 0 || ej.implemento === 'peso_corporal' || ej.tipo === 'calistenia') {
        if (typeof ej.peso === 'number' && ej.peso > 0) return ej.peso;
        if (typeof ej.pesoReferencia === 'number' && ej.pesoReferencia > 0) return ej.pesoReferencia;
        return 0;
    }
    if (typeof ej.pesoReferencia === 'number' && ej.pesoReferencia > 0) return ej.pesoReferencia;
    if (typeof ej.peso === 'number' && ej.peso > 0) return ej.peso;
    var p = parseFloat(ej.pesoReferencia || ej.peso);
    return (p && !isNaN(p) && p > 0) ? p : 80;
}

function obtenerRepsPromedioEjercicio(ej) {
    if (!ej) return 10;
    if (typeof ej.repeticionesPromedio === 'number' && ej.repeticionesPromedio > 0) {
        return ej.repeticionesPromedio;
    }
    var str = String(ej.repeticiones || '');
    var nums = str.match(/\d+(\.\d+)?/g);
    if (!nums || nums.length === 0) return 10;
    if (nums.length === 1) return parseFloat(nums[0]) || 10;
    var n1 = parseFloat(nums[0]);
    var n2 = parseFloat(nums[1]);
    return Math.round(((n1 + n2) / 2) * 10) / 10;
}

function calcularFactorSerie(ejIdx, serieNum) {
    if (!RUTINA_ACTIVA || !RUTINA_ACTIVA.rutina || !RUTINA_ACTIVA.rutina.ejercicios || !RUTINA_ACTIVA.rutina.ejercicios[ejIdx]) {
        return { factorTotal: 1, factorPeso: 1, factorReps: 1, pesoReal: 0, pesoBase: 0, repsHechas: 10, repsProm: 10, esTiempo: false, esSerieCero: false };
    }
    var ej = RUTINA_ACTIVA.rutina.ejercicios[ejIdx];
    var esSerieCero = (ej.series === 0 || ej.esSerieCero);
    var esTiempo = (ej.modalidadEsfuerzo === 'tiempo') || (ej.tiempoSegundos != null && ej.tiempoSegundos > 0);
    var pesoBase = obtenerPesoBaseEjercicio(ej);
    var repsProm = esTiempo ? (ej.tiempoSegundos || obtenerRepsPromedioEjercicio(ej) || 60) : (ej.ultimaSerieCeroReps || ej.recordSerieCero || obtenerRepsPromedioEjercicio(ej));

    var inPeso = document.getElementById('input-peso-ej-' + ejIdx + '-s-' + serieNum);
    var inReps = document.getElementById('input-reps-ej-' + ejIdx + '-s-' + serieNum);

    var pesoReal = inPeso ? (parseFloat(inPeso.value) || 0) : pesoBase;
    var repsHechas = inReps ? (parseFloat(inReps.value) || repsProm) : repsProm;

    var factorPeso = (pesoBase > 0) ? (pesoReal / pesoBase) : (pesoReal > 0 ? (1 + (pesoReal / 20)) : 1);
    var factorReps = (repsProm > 0) ? (repsHechas / repsProm) : 1;
    var factorTotal = Math.round((factorPeso * factorReps) * 1000) / 1000;

    return {
        factorTotal: factorTotal,
        factorPeso: factorPeso,
        factorReps: factorReps,
        pesoReal: pesoReal,
        pesoBase: pesoBase,
        repsHechas: repsHechas,
        repsProm: repsProm,
        esTiempo: esTiempo,
        esSerieCero: esSerieCero
    };
}

function cambiarPesoSerie(ejIdx, serieNum, delta, event) {
    if (event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
    }
    var inPeso = document.getElementById('input-peso-ej-' + ejIdx + '-s-' + serieNum);
    if (!inPeso) return;
    var val = Math.round(((parseFloat(inPeso.value) || 80) + delta) * 10) / 10;
    if (val < 0) val = 0;
    inPeso.value = val;
    alCambiarCargaSerie(ejIdx, serieNum);
}

function cambiarRepsSerie(ejIdx, serieNum, delta, event) {
    if (event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
    }
    var inReps = document.getElementById('input-reps-ej-' + ejIdx + '-s-' + serieNum);
    if (!inReps) return;
    var val = (parseFloat(inReps.value) || 10) + delta;
    if (val < 1) val = 1;
    inReps.value = val;

    var ejActual = (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina && RUTINA_ACTIVA.rutina.ejercicios) ? RUTINA_ACTIVA.rutina.ejercicios[ejIdx] : null;
    var esTiempo = (ejActual && (ejActual.modalidadEsfuerzo === 'tiempo' || (ejActual.tiempoSegundos != null && ejActual.tiempoSegundos > 0)));
    if (esTiempo) {
        cambiarTiempoSerieManual(ejIdx, serieNum);
    } else {
        alCambiarCargaSerie(ejIdx, serieNum);
    }
}

// ==========================================================================
// MOTOR DE CRONÓMETRO INTERACTIVO POR SERIE (ISOMÉTRICOS / TIEMPO) (v10.23)
// ==========================================================================

var TIMERS_SERIES_ACTIVAS = {};

function limpiarTodosLosTimersSeries() {
    Object.keys(TIMERS_SERIES_ACTIVAS).forEach(function(k) {
        var t = TIMERS_SERIES_ACTIVAS[k];
        if (t && t.intervalId) {
            clearInterval(t.intervalId);
        }
    });
    TIMERS_SERIES_ACTIVAS = {};
}

function toggleTimerSerie(ejIdx, serieNum, event) {
    if (event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
    }
    var key = ejIdx + '_' + serieNum;
    var timer = TIMERS_SERIES_ACTIVAS[key];
    if (timer && timer.corriendo) {
        detenerTimerSerie(ejIdx, serieNum, event);
    } else {
        iniciarTimerSerie(ejIdx, serieNum, event);
    }
}

function iniciarTimerSerie(ejIdx, serieNum, event) {
    if (event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
    }
    var key = ejIdx + '_' + serieNum;
    var timer = TIMERS_SERIES_ACTIVAS[key] || {
        ejIdx: ejIdx,
        serieNum: serieNum,
        intervalId: null,
        inicioTimestamp: null,
        segundosAcumulados: 0,
        corriendo: false
    };
    TIMERS_SERIES_ACTIVAS[key] = timer;

    if (timer.corriendo) return;

    timer.corriendo = true;
    timer.inicioTimestamp = Date.now();

    var panel = document.getElementById('timer-panel-ej-' + ejIdx + '-s-' + serieNum);
    var btnPlay = document.getElementById('btn-timer-play-ej-' + ejIdx + '-s-' + serieNum);
    if (panel) panel.classList.add('running');
    if (btnPlay) {
        btnPlay.classList.add('btn-timer-pause');
        btnPlay.classList.remove('btn-timer-play');
        btnPlay.innerHTML = '<span>⏸️</span> Pausar';
    }

    var ejActual = (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina && RUTINA_ACTIVA.rutina.ejercicios) ? RUTINA_ACTIVA.rutina.ejercicios[ejIdx] : null;
    var tBase = ejActual ? (ejActual.tiempoSegundos || obtenerRepsPromedioEjercicio(ejActual) || 60) : 60;

    timer.intervalId = setInterval(function() {
        var segPasados = Math.floor((Date.now() - timer.inicioTimestamp) / 1000);
        var totalSeg = timer.segundosAcumulados + segPasados;

        var display = document.getElementById('timer-display-ej-' + ejIdx + '-s-' + serieNum);
        var inReps = document.getElementById('input-reps-ej-' + ejIdx + '-s-' + serieNum);
        var meta = document.getElementById('timer-meta-ej-' + ejIdx + '-s-' + serieNum);

        if (display) display.innerText = formatearTiempoMMSS(totalSeg);
        if (inReps) inReps.value = totalSeg;

        if (totalSeg > tBase) {
            if (panel) panel.classList.add('overtime');
            if (meta) {
                var extra = totalSeg - tBase;
                meta.innerHTML = '<span style="color: #ef4444; font-weight: 800;">🔥 ¡SUPERASTE LA MARCA! +' + extra + 's EXTRA</span>';
            }
        }

        alCambiarCargaSerie(ejIdx, serieNum);
    }, 500);
}

function detenerTimerSerie(ejIdx, serieNum, event) {
    if (event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
    }
    var key = ejIdx + '_' + serieNum;
    var timer = TIMERS_SERIES_ACTIVAS[key];
    if (!timer || !timer.corriendo) return;

    if (timer.intervalId) {
        clearInterval(timer.intervalId);
        timer.intervalId = null;
    }
    var segPasados = Math.floor((Date.now() - timer.inicioTimestamp) / 1000);
    timer.segundosAcumulados += segPasados;
    timer.corriendo = false;

    var panel = document.getElementById('timer-panel-ej-' + ejIdx + '-s-' + serieNum);
    var btnPlay = document.getElementById('btn-timer-play-ej-' + ejIdx + '-s-' + serieNum);
    if (panel) panel.classList.remove('running');
    if (btnPlay) {
        btnPlay.classList.remove('btn-timer-pause');
        btnPlay.classList.add('btn-timer-play');
        btnPlay.innerHTML = '<span>▶️</span> Reanudar';
    }

    var inReps = document.getElementById('input-reps-ej-' + ejIdx + '-s-' + serieNum);
    if (inReps) inReps.value = timer.segundosAcumulados;

    alCambiarCargaSerie(ejIdx, serieNum);
}

function reiniciarTimerSerie(ejIdx, serieNum, event) {
    if (event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
    }
    var key = ejIdx + '_' + serieNum;
    var timer = TIMERS_SERIES_ACTIVAS[key];
    if (timer && timer.intervalId) {
        clearInterval(timer.intervalId);
    }
    var ejActual = (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina && RUTINA_ACTIVA.rutina.ejercicios) ? RUTINA_ACTIVA.rutina.ejercicios[ejIdx] : null;
    var tBase = ejActual ? (ejActual.tiempoSegundos || obtenerRepsPromedioEjercicio(ejActual) || 60) : 60;

    TIMERS_SERIES_ACTIVAS[key] = {
        ejIdx: ejIdx,
        serieNum: serieNum,
        intervalId: null,
        inicioTimestamp: null,
        segundosAcumulados: 0,
        corriendo: false
    };

    var panel = document.getElementById('timer-panel-ej-' + ejIdx + '-s-' + serieNum);
    var btnPlay = document.getElementById('btn-timer-play-ej-' + ejIdx + '-s-' + serieNum);
    var display = document.getElementById('timer-display-ej-' + ejIdx + '-s-' + serieNum);
    var meta = document.getElementById('timer-meta-ej-' + ejIdx + '-s-' + serieNum);
    var inReps = document.getElementById('input-reps-ej-' + ejIdx + '-s-' + serieNum);

    if (panel) {
        panel.classList.remove('running');
        panel.classList.remove('overtime');
    }
    if (btnPlay) {
        btnPlay.classList.remove('btn-timer-pause');
        btnPlay.classList.add('btn-timer-play');
        btnPlay.innerHTML = '<span>▶️</span> Iniciar';
    }
    if (display) display.innerText = '00:00';
    if (meta) meta.innerHTML = '🎯 Meta: ' + tBase + 's (' + formatearTiempoMMSS(tBase) + ')';
    if (inReps) inReps.value = tBase;

    alCambiarCargaSerie(ejIdx, serieNum);
}

function cambiarTiempoSerieManual(ejIdx, serieNum) {
    var inReps = document.getElementById('input-reps-ej-' + ejIdx + '-s-' + serieNum);
    if (!inReps) return;
    var val = parseFloat(inReps.value) || 0;
    if (val < 1) val = 1;

    var display = document.getElementById('timer-display-ej-' + ejIdx + '-s-' + serieNum);
    var meta = document.getElementById('timer-meta-ej-' + ejIdx + '-s-' + serieNum);
    var panel = document.getElementById('timer-panel-ej-' + ejIdx + '-s-' + serieNum);

    if (display) display.innerText = formatearTiempoMMSS(val);

    var ejActual = (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina && RUTINA_ACTIVA.rutina.ejercicios) ? RUTINA_ACTIVA.rutina.ejercicios[ejIdx] : null;
    var tBase = ejActual ? (ejActual.tiempoSegundos || obtenerRepsPromedioEjercicio(ejActual) || 60) : 60;

    var key = ejIdx + '_' + serieNum;
    var timer = TIMERS_SERIES_ACTIVAS[key];
    if (timer) {
        timer.segundosAcumulados = val;
    }

    if (val > tBase) {
        if (panel) panel.classList.add('overtime');
        if (meta) {
            var extra = Math.round(val - tBase);
            meta.innerHTML = '<span style="color: #ef4444; font-weight: 800;">🔥 ¡SUPERASTE LA MARCA! +' + extra + 's EXTRA</span>';
        }
    } else {
        if (panel) panel.classList.remove('overtime');
        if (meta) meta.innerHTML = '🎯 Meta: ' + tBase + 's (' + formatearTiempoMMSS(tBase) + ')';
    }

    alCambiarCargaSerie(ejIdx, serieNum);
}

function alCambiarCargaSerie(ejIdx, serieNum) {
    if (!RUTINA_ACTIVA || !RUTINA_ACTIVA.rutina || !RUTINA_ACTIVA.rutina.ejercicios || !RUTINA_ACTIVA.rutina.ejercicios[ejIdx]) return;
    var ej = RUTINA_ACTIVA.rutina.ejercicios[ejIdx];
    var numSeries = ej.esMental ? 1 : Math.max(1, parseInt(ej.series) || 3);
    var data = calcularFactorSerie(ejIdx, serieNum);
    var key = ejIdx + '_' + serieNum;

    var chk = document.getElementById('check-ej-' + ejIdx + '-s-' + serieNum);
    if (chk && chk.checked) {
        var factorViejo = HISTORIAL_FACTOR_SERIES[key] || 1;
        // Revertir desgaste con factor anterior y aplicar con nuevo factor
        aplicarDesgasteEjercicioIndividual(ej, false, (1 / numSeries) * factorViejo);
        aplicarDesgasteEjercicioIndividual(ej, true, (1 / numSeries) * data.factorTotal);
        HISTORIAL_FACTOR_SERIES[key] = data.factorTotal;
    }

    actualizarBadgeFatigaSerie(ejIdx, serieNum, data);
    actualizarGraficaFatigaSesion();
    if (typeof guardarEstadoSesionActivaEnStorage === 'function') guardarEstadoSesionActivaEnStorage();
}

function actualizarBadgeFatigaSerie(ejIdx, serieNum, data) {
    var badge = document.getElementById('badge-fatiga-ej-' + ejIdx + '-s-' + serieNum);
    if (!badge) return;
    if (!data) data = calcularFactorSerie(ejIdx, serieNum);

    var ejActual = (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina && RUTINA_ACTIVA.rutina.ejercicios) ? RUTINA_ACTIVA.rutina.ejercicios[ejIdx] : null;
    var uPeso = (ejActual && ejActual.unidadPeso) ? ejActual.unidadPeso : 'kg';
    var esTiempo = data.esTiempo || (ejActual && (ejActual.modalidadEsfuerzo === 'tiempo' || (ejActual.tiempoSegundos != null && ejActual.tiempoSegundos > 0)));

    var pct = Math.round(data.factorTotal * 100);

    if (esTiempo) {
        var diffT = Math.round((data.repsHechas - data.repsProm) * 10) / 10;
        var diffLastre = Math.round((data.pesoReal - data.pesoBase) * 10) / 10;
        var partesT = [];
        if (diffT > 0) partesT.push('+' + diffT + 's aguante extra · ¡Nuevo Récord!');
        else if (diffT < 0) partesT.push(diffT + 's');
        else partesT.push('Meta cumplida');

        if (diffLastre > 0) partesT.push('+' + diffLastre + ' ' + uPeso + ' lastre');

        badge.innerText = pct + '% fatiga (' + data.repsHechas + 's / base ' + data.repsProm + 's · ' + partesT.join(' · ') + ')';
    } else {
        var diffReps = Math.round((data.repsHechas - data.repsProm) * 10) / 10;
        var diffPeso = Math.round((data.pesoReal - data.pesoBase) * 10) / 10;

        var partes = [];
        if (diffPeso > 0) partes.push('+' + diffPeso + ' ' + uPeso + ' sobrecarga');
        else if (diffPeso < 0) partes.push(diffPeso + ' ' + uPeso + ' descarga');

        if (diffReps > 0) partes.push('+' + diffReps + ' reps límite');
        else if (diffReps < 0) partes.push(diffReps + ' reps');

        var textoDetalle = '';
        if (partes.length > 0) {
            textoDetalle = ' · ' + partes.join(' · ');
        } else if (data.esSerieCero || data.pesoBase === 0) {
            textoDetalle = ' · Base corporal: ' + data.repsProm + ' reps';
        } else {
            textoDetalle = ' · Base: ' + data.pesoBase + ' ' + uPeso + ' × ' + data.repsProm + ' reps';
        }

        badge.innerText = pct + '% fatiga' + textoDetalle;
    }

    if (pct >= 120) {
        badge.style.color = '#ef4444';
        badge.style.background = 'rgba(239, 68, 68, 0.15)';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    } else if (pct > 100) {
        badge.style.color = '#fbbf24';
        badge.style.background = 'rgba(245, 158, 11, 0.15)';
        badge.style.borderColor = 'rgba(245, 158, 11, 0.35)';
    } else if (pct === 100) {
        badge.style.color = '#10b981';
        badge.style.background = 'rgba(16, 185, 129, 0.12)';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    } else {
        badge.style.color = '#38bdf8';
        badge.style.background = 'rgba(56, 189, 248, 0.12)';
        badge.style.borderColor = 'rgba(56, 189, 248, 0.3)';
    }
}

function editarSerieYaHecha(event, ejIdx, serieNum) {
    if (event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
    }
    var panelReps = document.getElementById('panel-reps-ej-' + ejIdx + '-s-' + serieNum);
    var panelTimer = document.getElementById('timer-panel-ej-' + ejIdx + '-s-' + serieNum);
    var panel = panelTimer || panelReps;
    if (!panel) return;
    if (panel.style.display === 'none' || !panel.style.display) {
        panel.style.display = panelTimer ? 'block' : 'flex';
    } else {
        panel.style.display = 'none';
    }
}

function toggleCheckSerie(e, ejIdx, serieNum) {
    if (e) {
        e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
    }
    var chk = document.getElementById('check-ej-' + ejIdx + '-s-' + serieNum);
    var wrapper = document.getElementById('wrapper-ej-' + ejIdx + '-s-' + serieNum);
    var row = document.getElementById('row-ej-' + ejIdx + '-s-' + serieNum);
    var ind = document.getElementById('ind-ej-' + ejIdx + '-s-' + serieNum);
    var btnAction = document.getElementById('btn-check-action-ej-' + ejIdx + '-s-' + serieNum);
    var panelReps = document.getElementById('panel-reps-ej-' + ejIdx + '-s-' + serieNum);
    var panelTimer = document.getElementById('timer-panel-ej-' + ejIdx + '-s-' + serieNum);
    var targetEl = document.getElementById('target-ej-' + ejIdx + '-s-' + serieNum);
    if (!chk) return;

    var key = ejIdx + '_' + serieNum;
    if (TIMERS_SERIES_ACTIVAS[key] && TIMERS_SERIES_ACTIVAS[key].corriendo) {
        detenerTimerSerie(ejIdx, serieNum, e);
    }

    chk.checked = !chk.checked;
    var data = calcularFactorSerie(ejIdx, serieNum);
    var ejActual = (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina && RUTINA_ACTIVA.rutina.ejercicios) ? RUTINA_ACTIVA.rutina.ejercicios[ejIdx] : null;
    var uPeso = (ejActual && ejActual.unidadPeso) ? ejActual.unidadPeso : 'kg';
    var esSerieCeroEj = !!(ejActual && !ejActual.esMental && (ejActual.series === 0 || ejActual.esSerieCero));

    if (chk.checked) {
        if (wrapper) wrapper.classList.add('checked-active');
        if (row) row.classList.add('checked-active');
        if (ind) ind.classList.add('checked');
        if (panelReps) panelReps.style.display = 'none';
        if (panelTimer) panelTimer.style.display = 'none';
        if (btnAction) {
            btnAction.classList.add('active');
            btnAction.innerHTML = '<span>✓</span> Completada <span style="font-size: 10px; margin-left: 5px; opacity: 0.8; text-decoration: underline;" onclick="editarSerieYaHecha(event, ' + ejIdx + ', ' + serieNum + ')">Editar</span>';
        }
        if (targetEl) {
            if (data.esTiempo) {
                var lastreTxt = data.pesoReal > 0 ? (' · Lastre: ' + data.pesoReal + ' ' + uPeso) : '';
                targetEl.innerHTML = '<strong style="color: #10b981;">✓ ' + data.repsHechas + 's (' + formatearTiempoMMSS(data.repsHechas) + ')' + lastreTxt + '</strong> <span style="font-size: 11px; opacity: 0.85; color: #94a3b8;">(' + Math.round(data.factorTotal * 100) + '% fatiga)</span>';
            } else {
                var cargaHechaTxt = data.pesoReal > 0 ? (data.pesoReal + ' ' + uPeso) : 'Corporal';
                targetEl.innerHTML = '<strong style="color: #10b981;">✓ ' + cargaHechaTxt + ' × ' + data.repsHechas + ' reps</strong> <span style="font-size: 11px; opacity: 0.85; color: #94a3b8;">(' + Math.round(data.factorTotal * 100) + '% fatiga)</span>';
            }
        }
        emitirTonoAudio(880, 0.12, 'sine');
        if (navigator.vibrate) navigator.vibrate(60);
        // Iniciar cronómetro de descanso automáticamente
        iniciarDescansoGym(TIEMPO_DESCANSO_SELECCIONADO || 60);
    } else {
        if (wrapper) wrapper.classList.remove('checked-active');
        if (row) row.classList.remove('checked-active');
        if (ind) ind.classList.remove('checked');
        if (panelReps) panelReps.style.display = 'flex';
        if (panelTimer) panelTimer.style.display = 'block';
        if (btnAction) {
            btnAction.classList.remove('active');
            btnAction.innerHTML = '<span>✓</span> Marcar Hecha';
        }
        if (targetEl && ejActual) {
            var esTiempoEj = (ejActual.modalidadEsfuerzo === 'tiempo') || (ejActual.tiempoSegundos != null && ejActual.tiempoSegundos > 0);
            var pesoVal = (!ejActual.esMental && ejActual.peso) ? parseFloat(ejActual.peso) : null;
            if (esSerieCeroEj) {
                var baseCero = ejActual.ultimaSerieCeroReps || ejActual.recordSerieCero || obtenerRepsPromedioEjercicio(ejActual);
                targetEl.innerText = 'Objetivo: superar ' + baseCero + ' reps' + (pesoVal ? (' · ' + pesoVal + ' ' + uPeso) : '');
            } else if (esTiempoEj) {
                var segsBase = ejActual.tiempoSegundos || 60;
                targetEl.innerText = '⏱️ Objetivo: ' + segsBase + 's (' + formatearTiempoMMSS(segsBase) + ')';
            } else {
                var repsStr = ejActual.repeticiones || '8-10 reps';
                targetEl.innerText = repsStr + (pesoVal ? (' · Base: ' + pesoVal + ' ' + uPeso) : '');
            }
        }
    }

    actualizarProgresoRutinaDinamica();

    // Actualización de fatiga proporcional por serie con factor combinado de peso y repeticiones
    if (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina && RUTINA_ACTIVA.rutina.ejercicios && RUTINA_ACTIVA.rutina.ejercicios[ejIdx]) {
        var ej = RUTINA_ACTIVA.rutina.ejercicios[ejIdx];
        var numSeries = ej.esMental ? 1 : Math.max(1, parseInt(ej.series) || 3);

        if (chk.checked) {
            HISTORIAL_FACTOR_SERIES[key] = data.factorTotal;
            aplicarDesgasteEjercicioIndividual(ej, true, (1 / numSeries) * data.factorTotal);
        } else {
            var factorViejo = HISTORIAL_FACTOR_SERIES[key] || data.factorTotal || 1;
            aplicarDesgasteEjercicioIndividual(ej, false, (1 / numSeries) * factorViejo);
            delete HISTORIAL_FACTOR_SERIES[key];
        }

        actualizarBadgeFatigaSerie(ejIdx, serieNum, data);
        actualizarGraficaFatigaSesion();
    }
    if (typeof guardarEstadoSesionActivaEnStorage === 'function') guardarEstadoSesionActivaEnStorage();
}

function actualizarGraficaFatigaSesion() {
    var canvas = document.getElementById('grafica-fatiga-rutina-sesion');
    if (!canvas) return;
    if (!RUTINA_ACTIVA || !RUTINA_ACTIVA.rutina || !RUTINA_ACTIVA.rutina.ejercicios) return;

    var ejercicios = RUTINA_ACTIVA.rutina.ejercicios;
    var musculosInvolucrados = {};
    var volumenTotalKg = 0;
    var seriesCompletadasTotal = 0;
    var totalSeriesRutina = 0;
    var sumaFactoresHechos = 0;

    ejercicios.forEach(function(ej, ejIdx) {
        var esM = !!ej.esMental;
        var existe = false;
        if (esM) {
            existe = (APP_STATE.ejerciciosCerebrales || []).some(function(ec) {
                return ec && ((ej.id && ec.id === ej.id) || (ec.nombre && ej.nombre && ec.nombre.trim().toLowerCase() === ej.nombre.trim().toLowerCase()));
            });
        } else {
            existe = (APP_STATE.ejercicios || []).some(function(ef) {
                return ef && ((ej.id && ef.id === ej.id) || (ef.nombre && ej.nombre && ef.nombre.trim().toLowerCase() === ef.nombre.trim().toLowerCase()));
            });
        }
        if (!existe) return; // Omitir ejercicios eliminados

        var numSeries = esM ? 1 : ((ej.series === 0 || ej.esSerieCero) ? 1 : Math.max(1, parseInt(ej.series) || 3));
        totalSeriesRutina += numSeries;
        var fatigaNominal = Number(ej.fatigaPorcentaje || ej.fatigaEstimada) || 20;

        var mKeys = [];
        if (ej.categorias && ej.categorias.length > 0) mKeys = mapearTextoAMusculos(ej.categorias);
        if (ej.musculoPrincipal) {
            var extra = mapearTextoAMusculos(ej.musculoPrincipal);
            extra.forEach(function(k) { if (!mKeys.includes(k)) mKeys.push(k); });
        }
        if (mKeys.length === 0 && ej.nombre) mKeys = mapearTextoAMusculos(ej.nombre);
        if (mKeys.length === 0) mKeys = [esM ? 'mente' : 'pect_mayor'];

        mKeys.forEach(function(mk) {
            if (!musculosInvolucrados[mk]) {
                var meta = METADATOS_MUSCULOS[mk] || { nombre: mk, icono: esM ? '🧠' : '💪' };
                musculosInvolucrados[mk] = {
                    key: mk,
                    nombre: (meta.nombre || mk).split('(')[0].trim(),
                    icono: meta.icono || '💪',
                    fatigaSesion: 0,
                    fatigaBaseEsperada: 0
                };
            }
            musculosInvolucrados[mk].fatigaBaseEsperada += fatigaNominal;
        });

        for (var s = 1; s <= numSeries; s++) {
            var chk = document.getElementById('check-ej-' + ejIdx + '-s-' + s);
            var isChecked = chk && chk.checked;
            var data = calcularFactorSerie(ejIdx, s);

            if (isChecked) {
                seriesCompletadasTotal++;
                sumaFactoresHechos += data.factorTotal;
                if (!esM) {
                    volumenTotalKg += Math.round(data.pesoReal * data.repsHechas);
                }
                var fatigaSerie = (fatigaNominal / numSeries) * data.factorTotal;
                mKeys.forEach(function(mk) {
                    musculosInvolucrados[mk].fatigaSesion += fatigaSerie;
                });
            }
        }
    });

    // Actualizar HUD badges
    var elVol = document.getElementById('hud-rutina-volumen');
    var elCnt = document.getElementById('hud-rutina-series-count');
    var elFat = document.getElementById('hud-rutina-fatiga-media');

    if (elVol) elVol.innerText = 'Volumen: ' + volumenTotalKg.toLocaleString() + ' kg';
    if (elCnt) elCnt.innerText = 'Series: ' + seriesCompletadasTotal + '/' + totalSeriesRutina;
    var fatMediaPct = seriesCompletadasTotal > 0 ? Math.round((sumaFactoresHechos / seriesCompletadasTotal) * 100) : 0;
    if (elFat) elFat.innerText = 'Fatiga: ' + fatMediaPct + '%';

    // Preparar datos para Chart.js
    var keys = Object.keys(musculosInvolucrados);
    if (keys.length === 0) return;

    var labels = keys.map(function(k) {
        var m = musculosInvolucrados[k];
        return m.icono + ' ' + m.nombre;
    });

    var valores = keys.map(function(k) {
        return Math.round(musculosInvolucrados[k].fatigaSesion * 10) / 10;
    });

    var colores = keys.map(function(k) {
        var m = musculosInvolucrados[k];
        var ratio = m.fatigaBaseEsperada > 0 ? (m.fatigaSesion / m.fatigaBaseEsperada) : (m.fatigaSesion / 20);
        if (ratio >= 1.2) return 'rgba(239, 68, 68, 0.85)';
        if (ratio >= 1.0) return 'rgba(251, 191, 36, 0.85)';
        if (ratio >= 0.5) return 'rgba(16, 185, 129, 0.85)';
        return 'rgba(56, 189, 248, 0.75)';
    });

    if (typeof Chart === 'undefined') {
        return;
    }

    if (CHART_FATIGA_RUTINA_SESION) {
        CHART_FATIGA_RUTINA_SESION.data.labels = labels;
        CHART_FATIGA_RUTINA_SESION.data.datasets[0].data = valores;
        CHART_FATIGA_RUTINA_SESION.data.datasets[0].backgroundColor = colores;
        CHART_FATIGA_RUTINA_SESION.update();
    } else {
        var ctx = canvas.getContext('2d');
        CHART_FATIGA_RUTINA_SESION = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Fatiga Muscular Añadida (%)',
                    data: valores,
                    backgroundColor: colores,
                    borderRadius: 6,
                    borderWidth: 0,
                    barThickness: Math.min(22, Math.max(10, Math.floor(130 / keys.length)))
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 250 },
                scales: {
                    x: {
                        beginAtZero: true,
                        suggestedMax: 30,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 10 },
                            callback: function(v) { return v + '%'; }
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            color: '#f8fafc',
                            font: { size: 11, weight: '700' }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(item) {
                                return ' +' + item.raw + '% de fatiga muscular generada';
                            }
                        }
                    }
                }
            }
        });
    }
}

function toggleCheckEjercicio(e, idx) {
    if (e) {
        e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
    }
    var chk = document.getElementById('check-ej-' + idx);
    var row = document.getElementById('row-ej-' + idx);
    if (!chk) return;
    chk.checked = !chk.checked;
    if (chk.checked) {
        if (row) row.classList.add('checked-active');
        iniciarDescansoGym(TIEMPO_DESCANSO_SELECCIONADO || 60);
    } else {
        if (row) row.classList.remove('checked-active');
    }
    actualizarProgresoRutinaDinamica();

    if (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina && RUTINA_ACTIVA.rutina.ejercicios && RUTINA_ACTIVA.rutina.ejercicios[idx]) {
        var ej = RUTINA_ACTIVA.rutina.ejercicios[idx];
        aplicarDesgasteEjercicioIndividual(ej, chk.checked);
    }
}

// ==========================================================================
// 9. DETALLE Y PROGRESO DE RUTINAS (SERIES INDIVIDUALES & REST TIMER v10.6)
// ==========================================================================

function calcularTotalSeriesRutina(ejercicios) {
    var total = 0;
    if (ejercicios && ejercicios.length > 0) {
        ejercicios.forEach(function(ej) {
            var esM = !!ej.esMental;
            var existe = false;
            if (esM) {
                existe = (APP_STATE.ejerciciosCerebrales || []).some(function(ec) {
                    return ec && ((ej.id && ec.id === ej.id) || (ec.nombre && ej.nombre && ec.nombre.trim().toLowerCase() === ej.nombre.trim().toLowerCase()));
                });
            } else {
                existe = (APP_STATE.ejercicios || []).some(function(ef) {
                    return ef && ((ej.id && ef.id === ej.id) || (ef.nombre && ej.nombre && ef.nombre.trim().toLowerCase() === ej.nombre.trim().toLowerCase()));
                });
            }
            if (!existe) return; // No contar series de ejercicios que ya fueron eliminados del Arsenal
            total += esM ? 1 : ((ej.series === 0 || ej.esSerieCero) ? 1 : Math.max(1, parseInt(ej.series) || 3));
        });
    }
    return total;
}

function quitarEjercicioDeRutinaActiva(ejIdx) {
    if (!RUTINA_ACTIVA || !RUTINA_ACTIVA.rutina || !RUTINA_ACTIVA.rutina.ejercicios) return;
    var ej = RUTINA_ACTIVA.rutina.ejercicios[ejIdx];
    var nombreEj = ej ? ej.nombre : 'este ejercicio';
    if (!confirm('¿Deseas quitar "' + nombreEj + '" de esta rutina?')) return;

    RUTINA_ACTIVA.rutina.ejercicios.splice(ejIdx, 1);

    if (RUTINA_ACTIVA.idx >= 0 && APP_STATE.rutinas && APP_STATE.rutinas[RUTINA_ACTIVA.idx]) {
        APP_STATE.rutinas[RUTINA_ACTIVA.idx].ejercicios = RUTINA_ACTIVA.rutina.ejercicios;
    }
    MonarcaDB.save(APP_STATE);
    abrirDetalleRutina(RUTINA_ACTIVA.idx, true);
}

function purgarEjerciciosEliminadosDeRutinaActiva() {
    if (!RUTINA_ACTIVA || !RUTINA_ACTIVA.rutina || !RUTINA_ACTIVA.rutina.ejercicios) return;
    if (!confirm('¿Deseas quitar todos los ejercicios eliminados de esta rutina?')) return;

    RUTINA_ACTIVA.rutina.ejercicios = RUTINA_ACTIVA.rutina.ejercicios.filter(function(ej) {
        if (ej.esMental) {
            return (APP_STATE.ejerciciosCerebrales || []).some(function(ec) {
                return ec && ((ej.id && ec.id === ej.id) || (ec.nombre && ej.nombre && ec.nombre.trim().toLowerCase() === ej.nombre.trim().toLowerCase()));
            });
        } else {
            return (APP_STATE.ejercicios || []).some(function(ef) {
                return ef && ((ej.id && ef.id === ef.id) || (ef.nombre && ej.nombre && ef.nombre.trim().toLowerCase() === ej.nombre.trim().toLowerCase()));
            });
        }
    });

    if (RUTINA_ACTIVA.idx >= 0 && APP_STATE.rutinas && APP_STATE.rutinas[RUTINA_ACTIVA.idx]) {
        APP_STATE.rutinas[RUTINA_ACTIVA.idx].ejercicios = RUTINA_ACTIVA.rutina.ejercicios;
    }
    MonarcaDB.save(APP_STATE);
    abrirDetalleRutina(RUTINA_ACTIVA.idx, true);
}

function renderizarTarjetasEjerciciosSesion(ejercicios) {
    if (!ejercicios || ejercicios.length === 0) {
        return '<p style="color: #64748b; text-align: center; padding: 25px;">Esta rutina no tiene ejercicios asignados aún.</p>';
    }

    var eliminados = [];
    var validos = [];

    ejercicios.forEach(function(ej, idx) {
        var esM = !!ej.esMental;
        var existe = false;
        if (esM) {
            existe = (APP_STATE.ejerciciosCerebrales || []).some(function(ec) {
                return ec && ((ej.id && ec.id === ej.id) || (ec.nombre && ej.nombre && ec.nombre.trim().toLowerCase() === ej.nombre.trim().toLowerCase()));
            });
        } else {
            existe = (APP_STATE.ejercicios || []).some(function(ef) {
                return ef && ((ej.id && ef.id === ej.id) || (ef.nombre && ej.nombre && ef.nombre.trim().toLowerCase() === ef.nombre.trim().toLowerCase()));
            });
        }
        if (existe) {
            validos.push({ ej: ej, idx: idx });
        } else {
            eliminados.push({ ej: ej, idx: idx });
        }
    });

    // Caso 1: Todos los ejercicios de esta rutina fueron eliminados del Arsenal
    if (validos.length === 0 && eliminados.length > 0) {
        return `
        <div class="routine-empty-arsenal-box">
            <div class="routine-empty-icon-box">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </div>
            <span class="badge-status-deleted" style="margin-bottom: 8px;">🚫 EJERCICIOS ELIMINADOS DEL ARSENAL</span>
            <h3 style="color: #f8fafc; margin: 8px 0 6px 0; font-size: 16.5px; font-weight: 800;">Esta rutina contenía ${eliminados.length} ejercicio(s) que ya no existen</h3>
            <p style="color: #94a3b8; font-size: 12.5px; max-width: 440px; margin: 0 auto 16px auto; line-height: 1.5;">
                Los ejercicios originales de esta sesión fueron borrados de tu Arsenal Físico. Puedes recargar el arsenal recomendado o crear nuevos ejercicios.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button type="button" class="btn-subfiltro-ej active" onclick="importarBancoRecomendadoAlBancoFisico(); abrirDetalleRutina(RUTINA_ACTIVA.idx, true);" style="padding: 9px 16px; font-size: 13px;">
                    📥 Cargar Arsenal Recomendado
                </button>
                <button type="button" class="btn-add-finanza" onclick="abrirModalNuevoEjercicio()" style="padding: 9px 16px; font-size: 13px;">
                    ➕ Crear Nuevo Ejercicio
                </button>
                <button type="button" class="btn-delete-from-routine" onclick="purgarEjerciciosEliminadosDeRutinaActiva()" style="padding: 9px 16px; font-size: 13px;">
                    🗑️ Vaciar Ejercicios Eliminados
                </button>
            </div>
        </div>`;
    }

    var html = '';

    // Si hay algunos ejercicios eliminados junto a otros válidos, banner de advertencia con limpieza de 1 clic
    if (eliminados.length > 0) {
        html += `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px dashed rgba(239, 68, 68, 0.35); border-radius: 12px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #fca5a5;">
                <span style="font-size: 16px;">⚠️</span>
                <span>Se detectaron <strong>${eliminados.length} ejercicio(s) eliminados</strong> del Arsenal en esta rutina.</span>
            </div>
            <button type="button" class="btn-delete-from-routine" onclick="purgarEjerciciosEliminadosDeRutinaActiva()" style="font-size: 11px; padding: 5px 10px;">
                🗑️ Limpiar Ejercicios Eliminados (${eliminados.length})
            </button>
        </div>`;
    }

    if (validos.length > 0) {
        html += `
        <div class="routine-series-toolbar">
            <div class="routine-series-toolbar-copy">
                <span class="routine-series-toolbar-title">Ejercicios de la sesión (${validos.length})</span>
                <span class="routine-series-toolbar-hint">Toca la flecha de cada ejercicio para desplegar o contraer sus series</span>
            </div>
            <button type="button" class="btn-toggle-all-series" id="btn-toggle-todas-series-rutina" onclick="toggleTodasSeriesEjercicios()">
                ▾ Desplegar todas
            </button>
        </div>`;
    }

    var visualIndex = 1;
    ejercicios.forEach(function(ej, ejIdx) {
        var esM = !!ej.esMental;
        var existe = false;
        if (esM) {
            existe = (APP_STATE.ejerciciosCerebrales || []).some(function(ec) {
                return ec && ((ej.id && ec.id === ej.id) || (ec.nombre && ej.nombre && ec.nombre.trim().toLowerCase() === ej.nombre.trim().toLowerCase()));
            });
        } else {
            existe = (APP_STATE.ejercicios || []).some(function(ef) {
                return ef && ((ej.id && ef.id === ej.id) || (ef.nombre && ej.nombre && ef.nombre.trim().toLowerCase() === ej.nombre.trim().toLowerCase()));
            });
        }

        // Si el ejercicio NO existe en el catálogo, mostrar la tarjeta visual "EJERCICIO ELIMINADO"
        if (!existe) {
            html += `
            <div class="routine-exercise-session-card routine-exercise-deleted-card" id="card-ej-${ejIdx}">
                <div class="exercise-deleted-content">
                    <div class="exercise-deleted-visual">
                        <div class="exercise-deleted-icon-badge">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <span class="badge-status-deleted">🚫 EJERCICIO ELIMINADO</span>
                                <span style="font-size: 14.5px; font-weight: 800; color: #f87171; text-decoration: line-through;">${ej.nombre}</span>
                            </div>
                            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 3px;">
                                Este ejercicio fue eliminado de tu Arsenal y ya no existe en la base de datos.
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn-delete-from-routine" onclick="quitarEjercicioDeRutinaActiva(${ejIdx})" title="Quitar de la rutina">
                        ✕ Quitar de Rutina
                    </button>
                </div>
            </div>`;
            return;
        }

        var esSerieCero = (!esM && (ej.series === 0 || ej.esSerieCero));
        var numSeries = esM ? 1 : (esSerieCero ? 1 : Math.max(1, parseInt(ej.series) || 3));
        var muscleList = (ej.categorias || []).join(' · ');
        var ejJson = encodeURIComponent(JSON.stringify(ej));
        var icono = esM ? '🧠' : '🏋️';
        var uPeso = ej.unidadPeso || 'kg';
        var pesoVal = (!esM && ej.peso) ? parseFloat(ej.peso) : null;
        var mapaImp = {
            'barra': { icon: '🏋️', label: 'Barra' },
            'mancuerna': { icon: '💪', label: 'Mancuerna' },
            'maquina': { icon: '⚙️', label: 'Máquina' },
            'polea': { icon: '⛓️', label: 'Polea' },
            'discos': { icon: '💿', label: 'Discos' },
            'peso_corporal': { icon: '🤸', label: 'Corporal' }
        };
        var impKey = ej.implemento || ej.equipamiento || (ej.tipo === 'calistenia' ? 'peso_corporal' : null);
        var impObj = mapaImp[impKey];
        var impLabel = impObj ? (' · ' + impObj.icon + ' ' + impObj.label) : '';
        var esTiempoEj = (ej.modalidadEsfuerzo === 'tiempo') || (ej.tiempoSegundos != null && ej.tiempoSegundos > 0);
        var repsProm = obtenerRepsPromedioEjercicio(ej);
        var tiempoBase = esTiempoEj ? (ej.tiempoSegundos || repsProm || 60) : 0;
        var repsStr = esTiempoEj 
            ? ('⏱️ ' + tiempoBase + 's (' + formatearTiempoMMSS(tiempoBase) + ') isométrico') 
            : (ej.repeticiones || (esM ? (ej.duracionMinutos ? ej.duracionMinutos + ' min' : '1 sesión') : '8-10 reps'));

        var progressChipHtml = '<span class="exercise-meta-chip exercise-meta-chip--progress" id="prog-chip-ej-' + ejIdx + '">0/' + numSeries + (esM ? ' sesión' : (numSeries === 1 ? ' hecha' : ' series')) + '</span>';

        var headerChips = '';
        if (esM) {
            headerChips = progressChipHtml + '<span class="exercise-meta-chip">🧠 Enfoque</span><span>1 sesión × ' + repsStr + '</span>';
        } else if (esSerieCero) {
            var recReps = ej.recordSerieCero || repsProm || 0;
            var ultReps = ej.ultimaSerieCeroReps || repsProm || 0;
            headerChips =
                progressChipHtml +
                '<span class="exercise-meta-chip exercise-meta-chip--cero">Serie 0 · Modo Récord</span>' +
                '<span class="exercise-meta-chip exercise-meta-chip--record">🏆 Récord: ' + recReps + ' reps</span>' +
                '<span>' + (pesoVal ? (pesoVal + ' ' + uPeso) : '🤸 Corporal') + ' · Meta: ' + ultReps + ' reps</span>';
        } else {
            var impTxt = impObj ? (impObj.icon + ' ' + impObj.label) : '';
            headerChips =
                progressChipHtml +
                '<span class="exercise-meta-chip">' + numSeries + ' ' + (numSeries === 1 ? 'serie' : 'series') + ' × ' + (esTiempoEj ? (tiempoBase + 's') : repsStr) + '</span>' +
                (pesoVal ? '<span class="exercise-meta-chip">⚖️ ' + pesoVal + ' ' + uPeso + '</span>' : '') +
                (impTxt ? '<span>' + impTxt + '</span>' : '') +
                (muscleList ? '<span>· ' + muscleList + '</span>' : '');
        }

        html += `
        <div class="routine-exercise-session-card is-collapsed${esM ? ' is-mental' : (esSerieCero ? ' is-serie-cero' : '')}" id="card-ej-${ejIdx}" data-ej-idx="${ejIdx}">
            <div class="exercise-session-header">
                <div class="exercise-session-header-main" onclick="toggleSeriesEjercicio(${ejIdx}, event)" title="Toca para ver u ocultar las series">
                    <span class="exercise-session-number${esSerieCero ? ' is-cero' : ''}">${esSerieCero ? '0' : (visualIndex++)}</span>
                    <div style="min-width: 0; flex: 1;">
                        <div class="exercise-session-title">
                            ${esM ? '🧠 ' : ''}${ej.nombre}
                        </div>
                        <div class="exercise-session-sub">
                            ${headerChips}
                        </div>
                    </div>
                </div>
                <div class="exercise-header-actions">
                    <button type="button" class="btn-clean-detail" onclick="alVerDetalleEjercicio(event, '${ejJson}')" title="Ver especificaciones técnicas">
                        Detalle
                    </button>
                    <button type="button" class="btn-toggle-series-ej" id="btn-toggle-series-ej-${ejIdx}" aria-expanded="false" aria-controls="series-wrap-ej-${ejIdx}" onclick="toggleSeriesEjercicio(${ejIdx}, event)" title="Desplegar o retraer series">
                        <svg class="chevron-series-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="exercise-series-collapse-wrap" id="series-wrap-ej-${ejIdx}">
                <div class="exercise-series-collapse-inner" id="series-inner-ej-${ejIdx}" inert>
                    <div class="exercise-series-list" id="series-list-ej-${ejIdx}">`;

        for (var s = 1; s <= numSeries; s++) {
            var esFallo = (!esM && ej.alFallo && s === numSeries && !esSerieCero);
            var dropsetHtml = '';

            var pesoInicialSerie = esSerieCero ? (ej.ultimoPesoSerieCero || 0) : (pesoVal != null ? pesoVal : ((ej.tipo === 'calistenia' || ej.implemento === 'peso_corporal') ? 0 : (uPeso === 'lb' ? 175 : 80)));
            var repsInicialesSerie = esSerieCero ? (ej.ultimaSerieCeroReps || ej.recordSerieCero || repsProm) : repsProm;

            if (esFallo) {
                var etapas = [];
                try {
                    etapas = calcularEtapasDropset(ej.peso || 80);
                } catch(err) {
                    console.error("Error calculando dropset:", err);
                }
                var e1 = (Array.isArray(etapas) ? etapas[0] : (etapas ? etapas.etapa1 : null)) || {};
                var e2 = (Array.isArray(etapas) ? etapas[1] : (etapas ? etapas.etapa2 : null)) || {};
                var e3 = (Array.isArray(etapas) ? etapas[2] : (etapas ? etapas.etapa3 : null)) || {};
                var e4 = (Array.isArray(etapas) ? etapas[3] : (etapas ? etapas.etapa4 : null)) || {};

                var p1 = e1.peso != null ? e1.peso : (ej.peso || 80);
                var p2 = e2.peso != null ? e2.peso : Math.max(0, p1 - 20);
                var p3 = e3.peso != null ? e3.peso : Math.max(0, p2 - 20);
                var p4 = e4.peso != null ? e4.peso : (p1 >= 30 ? 20 : 0);

                var d1 = e1.discos || e1.detalle || 'Carga inicial completa';
                var d2 = e2.discos || e2.detalle || 'Bajar peso';
                var d3 = e3.discos || e3.detalle || 'Bajar peso';
                var d4 = e4.discos || e4.detalle || 'Barra sola / sin carga';

                dropsetHtml = `
                <div class="series-dropset-mini-strip">
                    <div style="font-weight: 800; color: #fbbf24; margin-bottom: 5px; font-size: 11px; display: flex; align-items: center; gap: 5px;">
                        <span>⚡</span>
                        <span>Plan Dropset al Fallo (4 etapas):</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 6px; font-size: 11px;">
                        <div style="background: rgba(255,255,255,0.03); padding: 5px 8px; border-radius: 6px; border-left: 2px solid #38bdf8;">
                            <strong style="color:#38bdf8;">1ª:</strong> ${p1} ${uPeso} <div style="color:#94a3b8; font-size:10px;">${d1}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); padding: 5px 8px; border-radius: 6px; border-left: 2px solid #818cf8;">
                            <strong style="color:#818cf8;">2ª:</strong> ${p2} ${uPeso} <div style="color:#94a3b8; font-size:10px;">${d2}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); padding: 5px 8px; border-radius: 6px; border-left: 2px solid #f59e0b;">
                            <strong style="color:#f59e0b;">3ª:</strong> ${p3} ${uPeso} <div style="color:#94a3b8; font-size:10px;">${d3}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); padding: 5px 8px; border-radius: 6px; border-left: 2px solid #ef4444;">
                            <strong style="color:#ef4444;">4ª:</strong> ${p4} ${uPeso} <div style="color:#94a3b8; font-size:10px;">${d4}</div>
                        </div>
                    </div>
                </div>`;
            }

            var badgeFatigaTxt = '';
            if (esSerieCero || pesoInicialSerie === 0) {
                badgeFatigaTxt = '100% fatiga · Base corporal: ' + repsInicialesSerie + ' reps';
            } else {
                badgeFatigaTxt = '100% fatiga · Base: ' + pesoInicialSerie + ' ' + uPeso + ' × ' + repsProm + ' reps';
            }

            var tieneControlPeso = (!esSerieCero && pesoInicialSerie > 0) || (esSerieCero && pesoInicialSerie > 0);
            var labelSerie = esM ? 'SESIÓN COMPLETA' : (esSerieCero ? 'SERIE 0 · SUPERAR RÉCORD' : (esFallo ? ('SERIE ' + s + ' · FINAL AL FALLO') : ('SERIE ' + s)));
            var targetSerie = esSerieCero
                ? ('Objetivo: superar ' + repsInicialesSerie + ' reps' + (pesoInicialSerie > 0 ? (' · ' + pesoInicialSerie + ' ' + uPeso) : ''))
                : (esTiempoEj ? ('⏱️ Meta: ' + tiempoBase + 's (' + formatearTiempoMMSS(tiempoBase) + ')') : (repsStr + (pesoVal ? (' · Base: ' + pesoVal + ' ' + uPeso) : '')));
            var metaAccionSerie = esFallo ? '<span class="series-badge-dropset">🔥 Dropset</span>' : (!esSerieCero && !esM ? '<span class="series-tag-muted">+Descanso</span>' : '');

            html += `
            <div class="series-item-wrapper${esSerieCero ? ' series-item-wrapper--cero' : ''}${esFallo ? ' series-item-wrapper--fallo' : ''}" id="wrapper-ej-${ejIdx}-s-${s}">
                <div class="series-check-row${esFallo ? ' series-al-fallo' : ''}${esSerieCero ? ' series-serie-cero' : ''}" id="row-ej-${ejIdx}-s-${s}" onclick="toggleCheckSerie(event, ${ejIdx}, ${s})">
                    <div class="series-row-left">
                        <div class="series-checkbox-indicator" id="ind-ej-${ejIdx}-s-${s}">✓</div>
                        <input type="checkbox" class="check-rutina-din" id="check-ej-${ejIdx}-s-${s}" style="display:none;" onchange="actualizarProgresoRutinaDinamica()">
                        <div class="series-row-copy">
                            <span class="series-label${esSerieCero ? ' series-label-cero' : ''}">${labelSerie}</span>
                            <span class="series-target" id="target-ej-${ejIdx}-s-${s}">${targetSerie}</span>
                        </div>
                    </div>
                    <div class="series-row-actions">
                        ${metaAccionSerie}
                        <button type="button" class="btn-check-serie-hecha" id="btn-check-action-ej-${ejIdx}-s-${s}" onclick="toggleCheckSerie(event, ${ejIdx}, ${s})">
                            <span>✓</span> Marcar Hecha
                        </button>
                    </div>
                </div>

                ${!esM ? (esTiempoEj ? `
                <div class="series-timer-card-panel" id="timer-panel-ej-${ejIdx}-s-${s}" onclick="event.stopPropagation()">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; width: 100%;">
                        <div style="display: flex; align-items: baseline; gap: 10px;">
                            <span class="series-timer-digital" id="timer-display-ej-${ejIdx}-s-${s}">00:00</span>
                            <span class="series-timer-meta" id="timer-meta-ej-${ejIdx}-s-${s}">🎯 Meta: ${tiempoBase}s (${formatearTiempoMMSS(tiempoBase)})</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <button type="button" class="btn-timer-action btn-timer-play" id="btn-timer-play-ej-${ejIdx}-s-${s}" onclick="toggleTimerSerie(${ejIdx}, ${s}, event)">
                                ▶️ Iniciar
                            </button>
                            <button type="button" class="btn-timer-action btn-timer-reset" onclick="reiniciarTimerSerie(${ejIdx}, ${s}, event)">
                                ↺ Reset
                            </button>
                        </div>
                    </div>

                    <!-- AJUSTE DE SEGUNDOS REALIZADOS O LASTRE -->
                    <div class="series-dual-controls-wrap" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.08);">
                        <div class="series-control-item${!pesoVal ? ' series-control-item--full' : ''}">
                            <span class="series-control-label" style="color: #38bdf8;">⏱️ Segundos</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <div class="stepper-pill-box">
                                    <button type="button" class="btn-rep-step" onclick="cambiarRepsSerie(${ejIdx}, ${s}, -5, event)">−5s</button>
                                    <input type="number" class="input-reps-realizadas" id="input-reps-ej-${ejIdx}-s-${s}" value="${tiempoBase}" min="1" max="3600" oninput="cambiarTiempoSerieManual(${ejIdx}, ${s})" onclick="event.stopPropagation()">
                                    <button type="button" class="btn-rep-step" onclick="cambiarRepsSerie(${ejIdx}, ${s}, 5, event)">+5s</button>
                                </div>
                                <span style="font-size: 11px; color: #94a3b8; font-weight: 700;">seg</span>
                            </div>
                        </div>

                        ${pesoVal ? `
                        <div class="series-control-item">
                            <span class="series-control-label" style="color: #fbbf24;">⚡ Lastre</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <div class="stepper-pill-box">
                                    <button type="button" class="btn-kg-step" onclick="cambiarPesoSerie(${ejIdx}, ${s}, -2.5, event)">−</button>
                                    <input type="number" class="input-peso-realizado" id="input-peso-ej-${ejIdx}-s-${s}" value="${pesoVal}" step="2.5" min="0" max="1000" oninput="alCambiarCargaSerie(${ejIdx}, ${s})" onclick="event.stopPropagation()">
                                    <button type="button" class="btn-kg-step" onclick="cambiarPesoSerie(${ejIdx}, ${s}, 2.5, event)">+</button>
                                </div>
                                <span style="font-size: 11px; color: #94a3b8; font-weight: 700;">${uPeso}</span>
                            </div>
                        </div>` : `<input type="hidden" id="input-peso-ej-${ejIdx}-s-${s}" value="0">`}
                    </div>

                    <div id="badge-fatiga-ej-${ejIdx}-s-${s}" class="badge-fatiga-reps" style="margin-top: 6px; font-size: 11px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3);">
                        100% fatiga · Meta base: ${tiempoBase}s
                    </div>
                </div>` : `
                <div class="series-reps-control-panel" id="panel-reps-ej-${ejIdx}-s-${s}" onclick="event.stopPropagation()">
                    <div class="series-dual-controls-wrap">
                        ${tieneControlPeso ? `
                        <!-- AJUSTE DE PESO REAL (KG O LB) -->
                        <div class="series-control-item">
                            <span class="series-control-label" style="color: #fbbf24;">⚖️ Carga</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <div class="stepper-pill-box">
                                    <button type="button" class="btn-kg-step" onclick="cambiarPesoSerie(${ejIdx}, ${s}, -2.5, event)">−</button>
                                    <input type="number" class="input-peso-realizado" id="input-peso-ej-${ejIdx}-s-${s}" value="${pesoInicialSerie}" step="2.5" min="0" max="1000" oninput="alCambiarCargaSerie(${ejIdx}, ${s})" onclick="event.stopPropagation()">
                                    <button type="button" class="btn-kg-step" onclick="cambiarPesoSerie(${ejIdx}, ${s}, 2.5, event)">+</button>
                                </div>
                                <span style="font-size: 11px; color: #94a3b8; font-weight: 700;">${uPeso}</span>
                            </div>
                        </div>` : `<input type="hidden" id="input-peso-ej-${ejIdx}-s-${s}" value="0">`}

                        <!-- AJUSTE DE REPETICIONES -->
                        <div class="series-control-item${!tieneControlPeso ? ' series-control-item--full' : ''}">
                            <span class="series-control-label" style="color: #38bdf8;">${esSerieCero ? '🏆 Reps' : '🎯 Reps'}</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <div class="stepper-pill-box">
                                    <button type="button" class="btn-rep-step" onclick="cambiarRepsSerie(${ejIdx}, ${s}, -1, event)">−</button>
                                    <input type="number" class="input-reps-realizadas" id="input-reps-ej-${ejIdx}-s-${s}" value="${repsInicialesSerie}" min="1" max="999" oninput="alCambiarCargaSerie(${ejIdx}, ${s})" onclick="event.stopPropagation()">
                                    <button type="button" class="btn-rep-step" onclick="cambiarRepsSerie(${ejIdx}, ${s}, 1, event)">+</button>
                                </div>
                                <span style="font-size: 11px; color: #94a3b8; font-weight: 700;">reps</span>
                            </div>
                        </div>
                    </div>

                    <div id="badge-fatiga-ej-${ejIdx}-s-${s}" class="badge-fatiga-reps" style="font-size: 11px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3);">
                        ${badgeFatigaTxt}
                    </div>
                </div>`) : ''}

                ${dropsetHtml}
            </div>`;
        }

        html += `
                    </div>
                </div>
            </div>
        </div>`;
    });

    return html;
}

function setSeriesCardExpandedState(ejIdx, expanded) {
    var card = document.getElementById('card-ej-' + ejIdx);
    var btn = document.getElementById('btn-toggle-series-ej-' + ejIdx);
    var inner = document.getElementById('series-inner-ej-' + ejIdx);
    if (!card || card.classList.contains('routine-exercise-deleted-card')) return;

    if (expanded) {
        card.classList.remove('is-collapsed');
        if (btn) btn.setAttribute('aria-expanded', 'true');
        if (inner) inner.removeAttribute('inert');
    } else {
        card.classList.add('is-collapsed');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        if (inner) inner.setAttribute('inert', '');
    }
}

function actualizarBotonToggleTodasSeriesRutina() {
    var btnAll = document.getElementById('btn-toggle-todas-series-rutina');
    if (!btnAll) return;
    var cards = document.querySelectorAll('#contenedor-detalle-rutina-dinamica .routine-exercise-session-card[data-ej-idx]');
    if (!cards.length) return;
    var collapsedCount = 0;
    cards.forEach(function(c) {
        if (c.classList.contains('is-collapsed')) collapsedCount++;
    });
    if (collapsedCount > 0) {
        btnAll.innerHTML = '▾ Desplegar todas';
    } else {
        btnAll.innerHTML = '▴ Contraer todas';
    }
}

function toggleSeriesEjercicio(ejIdx, e) {
    if (e) {
        e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
    }
    var card = document.getElementById('card-ej-' + ejIdx);
    if (!card || card.classList.contains('routine-exercise-deleted-card')) return;

    var expandir = card.classList.contains('is-collapsed');
    setSeriesCardExpandedState(ejIdx, expandir);
    actualizarBotonToggleTodasSeriesRutina();
    if (typeof guardarEstadoSesionActivaEnStorage === 'function') {
        guardarEstadoSesionActivaEnStorage();
    }
}

function toggleTodasSeriesEjercicios() {
    var cards = document.querySelectorAll('#contenedor-detalle-rutina-dinamica .routine-exercise-session-card[data-ej-idx]');
    if (!cards.length) return;
    var hayColapsada = false;
    cards.forEach(function(c) {
        if (c.classList.contains('is-collapsed')) hayColapsada = true;
    });
    cards.forEach(function(c) {
        var idx = parseInt(c.getAttribute('data-ej-idx'), 10);
        if (!isNaN(idx)) {
            setSeriesCardExpandedState(idx, hayColapsada);
        }
    });
    actualizarBotonToggleTodasSeriesRutina();
    if (typeof guardarEstadoSesionActivaEnStorage === 'function') {
        guardarEstadoSesionActivaEnStorage();
    }
}

if (typeof window !== 'undefined') {
    window.toggleSeriesEjercicio = toggleSeriesEjercicio;
    window.toggleTodasSeriesEjercicios = toggleTodasSeriesEjercicios;
}

// ==========================================================================
// MOTOR DE PERSISTENCIA INDESTRUCTIBLE DE SESIÓN DE ENTRENAMIENTO (v10.28)
// ==========================================================================

const MONARCA_SESION_ENTRENAMIENTO_KEY = 'monarca_sesion_entrenamiento_activa';

function guardarEstadoSesionActivaEnStorage() {
    if (!RUTINA_ACTIVA || !RUTINA_ACTIVA.rutina) return;
    try {
        var rutina = RUTINA_ACTIVA.rutina;
        var rId = rutina.id || rutina.codigo || String(RUTINA_ACTIVA.idx);
        var seriesData = [];
        var expandedEjIndices = [];

        if (rutina.ejercicios && Array.isArray(rutina.ejercicios)) {
            rutina.ejercicios.forEach(function(ej, ejIdx) {
                var cardEl = document.getElementById('card-ej-' + ejIdx);
                if (cardEl && !cardEl.classList.contains('is-collapsed') && !cardEl.classList.contains('routine-exercise-deleted-card')) {
                    expandedEjIndices.push(ejIdx);
                }
                var esM = !!ej.esMental;
                var esSerieCero = (ej.series === 0 || ej.esSerieCero);
                var numSeries = esM ? 1 : (esSerieCero ? 1 : Math.max(1, parseInt(ej.series) || 3));
                for (var s = 1; s <= numSeries; s++) {
                    var chk = document.getElementById('check-ej-' + ejIdx + '-s-' + s);
                    var inPeso = document.getElementById('input-peso-ej-' + ejIdx + '-s-' + s);
                    var inReps = document.getElementById('input-reps-ej-' + ejIdx + '-s-' + s);
                    var keyTimer = ejIdx + '_' + s;
                    var timer = TIMERS_SERIES_ACTIVAS[keyTimer];
                    seriesData.push({
                        ejIdx: ejIdx,
                        s: s,
                        checked: chk ? !!chk.checked : false,
                        peso: inPeso ? (parseFloat(inPeso.value) || 0) : null,
                        reps: inReps ? (parseFloat(inReps.value) || 0) : null,
                        timerSegs: timer ? timer.segundosAcumulados : null
                    });
                }
            });
        }

        var descansoData = null;
        if (ASISTENTE_GYM && ASISTENTE_GYM.finTimestamp > 0 && !ASISTENTE_GYM.finalizado) {
            descansoData = {
                total: ASISTENTE_GYM.descansoTotal || 60,
                restante: Math.max(0, Math.ceil((ASISTENTE_GYM.finTimestamp - Date.now()) / 1000)),
                activo: true,
                timestampFin: ASISTENTE_GYM.finTimestamp
            };
        }

        var sesionObj = {
            rutinaId: rId,
            rutinaNombre: rutina.nombre,
            rutinaIdx: RUTINA_ACTIVA.idx,
            timestampGuardado: Date.now(),
            seriesData: seriesData,
            expandedEjIndices: expandedEjIndices,
            historialFactores: HISTORIAL_FACTOR_SERIES || {},
            descanso: descansoData
        };

        localStorage.setItem(MONARCA_SESION_ENTRENAMIENTO_KEY, JSON.stringify(sesionObj));
    } catch(e) {
        console.warn("[Sesion Storage Error]", e);
    }
}

function restaurarEstadoSesionActivaDeStorage(rutinaIdOIdx) {
    try {
        var raw = localStorage.getItem(MONARCA_SESION_ENTRENAMIENTO_KEY);
        if (!raw) return false;
        var sesion = JSON.parse(raw);
        if (!sesion || !sesion.rutinaId) return false;

        var coincide = (String(sesion.rutinaId) === String(rutinaIdOIdx) || String(sesion.rutinaIdx) === String(rutinaIdOIdx));
        if (!coincide && RUTINA_ACTIVA && RUTINA_ACTIVA.rutina) {
            var curId = RUTINA_ACTIVA.rutina.id || RUTINA_ACTIVA.rutina.codigo || String(RUTINA_ACTIVA.idx);
            if (String(curId) === String(sesion.rutinaId)) coincide = true;
        }
        if (!coincide) return false;

        if (sesion.historialFactores) {
            HISTORIAL_FACTOR_SERIES = sesion.historialFactores;
        }

        if (Array.isArray(sesion.seriesData)) {
            sesion.seriesData.forEach(function(item) {
                var ejIdx = item.ejIdx;
                var s = item.s;
                var chk = document.getElementById('check-ej-' + ejIdx + '-s-' + s);
                var wrapper = document.getElementById('wrapper-ej-' + ejIdx + '-s-' + s);
                var row = document.getElementById('row-ej-' + ejIdx + '-s-' + s);
                var ind = document.getElementById('ind-ej-' + ejIdx + '-s-' + s);
                var btnAction = document.getElementById('btn-check-action-ej-' + ejIdx + '-s-' + s);
                var inPeso = document.getElementById('input-peso-ej-' + ejIdx + '-s-' + s);
                var inReps = document.getElementById('input-reps-ej-' + ejIdx + '-s-' + s);
                var targetEl = document.getElementById('target-ej-' + ejIdx + '-s-' + s);
                var panelReps = document.getElementById('panel-reps-ej-' + ejIdx + '-s-' + s);
                var panelTimer = document.getElementById('timer-panel-ej-' + ejIdx + '-s-' + s);

                if (inPeso && item.peso != null) inPeso.value = item.peso;
                if (inReps && item.reps != null) inReps.value = item.reps;

                if (chk && item.checked) {
                    chk.checked = true;
                    if (wrapper) wrapper.classList.add('checked-active');
                    if (row) row.classList.add('checked-active');
                    if (ind) ind.classList.add('checked');
                    if (panelReps) panelReps.style.display = 'none';
                    if (panelTimer) panelTimer.style.display = 'none';
                    if (btnAction) {
                        btnAction.classList.add('active');
                        btnAction.innerHTML = '<span>✓</span> Completada <span style="font-size: 10px; margin-left: 5px; opacity: 0.8; text-decoration: underline;" onclick="editarSerieYaHecha(event, ' + ejIdx + ', ' + s + ')">Editar</span>';
                    }
                    var data = calcularFactorSerie(ejIdx, s);
                    var ejActual = (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina && RUTINA_ACTIVA.rutina.ejercicios) ? RUTINA_ACTIVA.rutina.ejercicios[ejIdx] : null;
                    var uPeso = (ejActual && ejActual.unidadPeso) ? ejActual.unidadPeso : 'kg';
                    if (targetEl) {
                        if (data.esTiempo) {
                            var lastreTxt = data.pesoReal > 0 ? (' · Lastre: ' + data.pesoReal + ' ' + uPeso) : '';
                            targetEl.innerHTML = '<strong style="color: #10b981;">✓ ' + data.repsHechas + 's (' + formatearTiempoMMSS(data.repsHechas) + ')' + lastreTxt + '</strong> <span style="font-size: 11px; opacity: 0.85; color: #94a3b8;">(' + Math.round(data.factorTotal * 100) + '% fatiga)</span>';
                        } else {
                            var cargaHechaTxt = data.pesoReal > 0 ? (data.pesoReal + ' ' + uPeso) : 'Corporal';
                            targetEl.innerHTML = '<strong style="color: #10b981;">✓ ' + cargaHechaTxt + ' × ' + data.repsHechas + ' reps</strong> <span style="font-size: 11px; opacity: 0.85; color: #94a3b8;">(' + Math.round(data.factorTotal * 100) + '% fatiga)</span>';
                        }
                    }
                }
            });
        }

        if (Array.isArray(sesion.expandedEjIndices)) {
            sesion.expandedEjIndices.forEach(function(ejIdx) {
                setSeriesCardExpandedState(ejIdx, true);
            });
            actualizarBotonToggleTodasSeriesRutina();
        }

        // Restaurar descanso si aún tiene tiempo corriendo (respetando reloj exacto)
        if (sesion.descanso && sesion.descanso.timestampFin) {
            var segsRestantes = Math.ceil((sesion.descanso.timestampFin - Date.now()) / 1000);
            if (segsRestantes > 0) {
                iniciarDescansoGym(sesion.descanso.total || segsRestantes, sesion.descanso.timestampFin);
            } else if (sesion.descanso.activo) {
                ASISTENTE_GYM.descansoTotal = sesion.descanso.total || 60;
                ASISTENTE_GYM.finTimestamp = sesion.descanso.timestampFin;
                ASISTENTE_GYM.finalizado = false;
                finalizarDescansoGym({ desdeFondo: true });
            }
        }

        actualizarProgresoRutinaDinamica();
        actualizarGraficaFatigaSesion();
        return true;
    } catch(e) {
        console.warn("[Restaurar Sesion Error]", e);
        return false;
    }
}

function limpiarSesionActivaStorage() {
    try {
        localStorage.removeItem(MONARCA_SESION_ENTRENAMIENTO_KEY);
    } catch(e) {}
}

function toggleTelemetriaRutinaSesion() {
    var cont = document.getElementById('contenedor-canvas-fatiga-rutina');
    var btn = document.getElementById('btn-toggle-telemetria-rutina');
    if (!cont) return;
    if (cont.style.display === 'none') {
        cont.style.display = 'block';
        if (btn) btn.innerHTML = '▲ Ocultar';
        actualizarGraficaFatigaSesion();
    } else {
        cont.style.display = 'none';
        if (btn) btn.innerHTML = '▼ Ver Gráfica';
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', guardarEstadoSesionActivaEnStorage);
    window.addEventListener('pagehide', guardarEstadoSesionActivaEnStorage);
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            guardarEstadoSesionActivaEnStorage();
        } else if (document.visibilityState === 'visible') {
            sincronizarDescansoGymAlVolver();
        }
    });
}

function escaparHtmlRutina(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function actualizarSelectoresPlaylistRutinas() {
    var playlists = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getPlaylists === 'function')
        ? window.MonarcaPlayer.getPlaylists()
        : [];
    var defaultPlId = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getPlaylistDefaultRutinaId === 'function')
        ? window.MonarcaPlayer.getPlaylistDefaultRutinaId()
        : null;
    var canciones = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getCanciones === 'function')
        ? window.MonarcaPlayer.getCanciones()
        : [];

    var cancionesMap = construirMapaCancionesPlaylist(canciones);
    var existePl = function(id) {
        return !!(id && playlists.some(function(p) { return p && p.id === id; }));
    };

    var selDef = document.getElementById('select-playlist-rutina-default');
    if (selDef) {
        selDef.innerHTML = '<option value="">Desactivado (Sin música)</option>' +
            construirOpcionesPlaylistsLimpio(playlists, canciones, cancionesMap);
        selDef.value = existePl(defaultPlId) ? defaultPlId : '';
    }

    var elStatusDef = document.getElementById('rutina-musica-default-status');
    if (elStatusDef) {
        var plDefObj = defaultPlId ? playlists.find(function(p) { return p && p.id === defaultPlId; }) : null;
        if (playlists.length === 0) {
            elStatusDef.textContent = 'Crea una lista en Reproductor → Listas para asignarla a tus rutinas';
        } else if (plDefObj) {
            elStatusDef.textContent = 'Activa: "' + plDefObj.nombre + '" (' + contarCancionesValidasPlaylist(plDefObj, canciones, cancionesMap) + ' pistas) · Aleatorio continuo';
        } else {
            elStatusDef.textContent = 'Se usa cuando una rutina no tiene lista propia asignada';
        }
    }

    var selAct = document.getElementById('select-playlist-rutina-activa');
    if (selAct) {
        var valActPrev = selAct.value;
        selAct.innerHTML = '<option value="">🔇 Sin música</option>' +
            construirOpcionesPlaylistsLimpio(playlists, canciones, cancionesMap);
        var pState = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getState === 'function')
            ? window.MonarcaPlayer.getState()
            : null;
        var targetAct = (pState && pState.rutinaModoActivo && pState.rutinaPlaylistActivaId)
            ? pState.rutinaPlaylistActivaId
            : (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina ? resolverPlaylistIdParaRutina(RUTINA_ACTIVA.rutina) : (defaultPlId || valActPrev || ''));
        selAct.value = existePl(targetAct) ? targetAct : '';
    }

    var selModal = document.getElementById('modal-rutina-playlist');
    if (selModal) {
        var prevModalVal = selModal.value;
        var plDObj = defaultPlId ? playlists.find(function(p) { return p && p.id === defaultPlId; }) : null;
        var plDefNombre = plDObj ? (' (' + escaparHtmlRutina(plDObj.nombre) + ')') : '';
        selModal.innerHTML = '<option value="">Usar playlist por defecto' + plDefNombre + '</option>' +
            '<option value="__none__">Sin música en esta rutina</option>' +
            construirOpcionesPlaylistsLimpio(playlists, canciones, cancionesMap);
        if (prevModalVal && Array.from(selModal.options).some(function(o) { return o.value === prevModalVal; })) {
            selModal.value = prevModalVal;
        }
    }

    // Actualizar todos los selectores individuales visibles en cada tarjeta de rutina
    var cardSelects = document.querySelectorAll('.rutina-card-playlist-select[data-rutina-playlist-id]');
    cardSelects.forEach(function(sel) {
        var rId = sel.getAttribute('data-rutina-playlist-id');
        var match = buscarRutinaPorIdentificador(rId);
        var curVal = (match && match.rutina && match.rutina.playlistId) ? match.rutina.playlistId : '';
        var ui = construirOpcionesSelectorRutinaIndividual(curVal, defaultPlId, playlists, canciones, cancionesMap);
        sel.innerHTML = ui.html;
        sel.value = (curVal === '__none__' || existePl(curVal)) ? curVal : '';
        var bar = document.getElementById('rutina-pl-bar-' + String(rId));
        if (bar) {
            bar.classList.toggle('is-muted', ui.estadoClase === 'is-muted');
            bar.classList.toggle('is-custom', ui.estadoClase === 'is-custom');
        }
    });

    if (window.MonarcaPlayer && typeof window.MonarcaPlayer.actualizarBarraAudioRutina === 'function') {
        window.MonarcaPlayer.actualizarBarraAudioRutina();
    }
}

function resolverPlaylistIdParaRutina(rutina) {
    var playlists = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getPlaylists === 'function')
        ? window.MonarcaPlayer.getPlaylists()
        : [];
    if (rutina && rutina.playlistId) {
        if (rutina.playlistId === '__none__') return null;
        if (playlists.some(function(p) { return p && p.id === rutina.playlistId; })) {
            return rutina.playlistId;
        }
    }
    if (window.MonarcaPlayer && typeof window.MonarcaPlayer.getPlaylistDefaultRutinaId === 'function') {
        return window.MonarcaPlayer.getPlaylistDefaultRutinaId();
    }
    return null;
}

function iniciarAudioAutomaticoParaRutina(rutina, omitirReinicio) {
    actualizarSelectoresPlaylistRutinas();
    if (!window.MonarcaPlayer) return;

    var targetPlId = resolverPlaylistIdParaRutina(rutina);
    var selAct = document.getElementById('select-playlist-rutina-activa');
    if (selAct) selAct.value = targetPlId || '';

    var pSt = (typeof window.MonarcaPlayer.getState === 'function') ? window.MonarcaPlayer.getState() : null;

    if (!omitirReinicio) {
        window._rutinaAudioDetenidoManual = false;
    } else if (window._rutinaAudioDetenidoManual && pSt && !pSt.rutinaModoActivo) {
        if (typeof window.MonarcaPlayer.actualizarBarraAudioRutina === 'function') {
            window.MonarcaPlayer.actualizarBarraAudioRutina();
        }
        return;
    }

    if (!targetPlId) {
        if (pSt && pSt.rutinaModoActivo && typeof window.MonarcaPlayer.detenerMusicaDeRutina === 'function') {
            window.MonarcaPlayer.detenerMusicaDeRutina(true);
        } else if (typeof window.MonarcaPlayer.actualizarBarraAudioRutina === 'function') {
            window.MonarcaPlayer.actualizarBarraAudioRutina();
        }
        return;
    }

    if (pSt && pSt.rutinaModoActivo && pSt.rutinaPlaylistActivaId === targetPlId && (pSt.reproduciendo || pSt.cancionActual)) {
        if (typeof window.MonarcaPlayer.actualizarBarraAudioRutina === 'function') {
            window.MonarcaPlayer.actualizarBarraAudioRutina();
        }
        return;
    }

    if (typeof window.MonarcaPlayer.iniciarMusicaDeRutina === 'function') {
        window.MonarcaPlayer.iniciarMusicaDeRutina(targetPlId, rutina ? rutina.nombre : '');
    }
}

function alCambiarPlaylistDefaultRutina(plId) {
    if (!window.MonarcaPlayer || typeof window.MonarcaPlayer.setPlaylistDefaultRutina !== 'function') return;
    window.MonarcaPlayer.setPlaylistDefaultRutina(plId || null);
}

function alCambiarPlaylistEnRutinaActiva(plId) {
    if (!window.MonarcaPlayer) return;
    var rutinaObj = (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina) ? RUTINA_ACTIVA.rutina : null;
    var nombreRut = rutinaObj ? rutinaObj.nombre : '';

    if (rutinaObj && rutinaObj.playlistId) {
        rutinaObj.playlistId = '';
        if (typeof MonarcaDB !== 'undefined' && typeof APP_STATE !== 'undefined' && APP_STATE) {
            MonarcaDB.save(APP_STATE);
        }
    }

    if (typeof window.MonarcaPlayer.setPlaylistDefaultRutina === 'function') {
        window.MonarcaPlayer.setPlaylistDefaultRutina(plId || null);
    }

    if (!plId) {
        window._rutinaAudioDetenidoManual = true;
        if (typeof window.MonarcaPlayer.detenerMusicaDeRutina === 'function') {
            window.MonarcaPlayer.detenerMusicaDeRutina(true, { restaurarPrevia: false, fadeOutMs: 1200 });
        }
        return;
    }

    window._rutinaAudioDetenidoManual = false;
    if (typeof window.MonarcaPlayer.iniciarMusicaDeRutina === 'function') {
        window.MonarcaPlayer.iniciarMusicaDeRutina(plId, nombreRut);
    }
}

function togglePlayMusicaRutina() {
    if (!window.MonarcaPlayer) return;
    window._rutinaAudioDetenidoManual = false;
    var pSt = (typeof window.MonarcaPlayer.getState === 'function') ? window.MonarcaPlayer.getState() : null;
    if (pSt && !pSt.cancionActual) {
        var selAct = document.getElementById('select-playlist-rutina-activa');
        var plId = (selAct && selAct.value) ? selAct.value : (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina ? resolverPlaylistIdParaRutina(RUTINA_ACTIVA.rutina) : null);
        if (plId && typeof window.MonarcaPlayer.iniciarMusicaDeRutina === 'function') {
            window.MonarcaPlayer.iniciarMusicaDeRutina(plId, (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina) ? RUTINA_ACTIVA.rutina.nombre : '');
            return;
        }
    }
    if (typeof window.MonarcaPlayer.togglePlayPausa === 'function') {
        window.MonarcaPlayer.togglePlayPausa();
    }
}

function siguienteCancionMusicaRutina() {
    if (window.MonarcaPlayer && typeof window.MonarcaPlayer.siguienteCancion === 'function') {
        window.MonarcaPlayer.siguienteCancion();
    }
}

function detenerMusicaManualDesdeRutina() {
    window._rutinaAudioDetenidoManual = true;
    if (window.MonarcaPlayer && typeof window.MonarcaPlayer.detenerMusicaDeRutina === 'function') {
        window.MonarcaPlayer.detenerMusicaDeRutina();
    }
}

function mostrarModalResumenFinalizacionRutina(titulo, mensaje, opts) {
    opts = opts || {};
    var esPen = !!opts.esPenitencia;
    var modal = document.getElementById('modal-rutina-finalizada');
    var elIcon = document.getElementById('modal-rutina-finalizada-icono');
    var elTit = document.getElementById('modal-rutina-finalizada-titulo');
    var elMsg = document.getElementById('modal-rutina-finalizada-mensaje');
    var win = modal ? modal.querySelector('.modal-system-window') : null;
    if (modal && elMsg) {
        if (elIcon) elIcon.textContent = esPen ? '💀' : '🏆';
        if (elTit) {
            elTit.textContent = titulo || (esPen ? 'PENITENCIA APLICADA' : 'SESIÓN COMPLETADA');
            elTit.style.color = esPen ? '#fca5a5' : '';
        }
        if (win) win.style.borderColor = esPen ? 'rgba(239, 68, 68, 0.45)' : '';
        elMsg.style.borderColor = esPen ? 'rgba(239, 68, 68, 0.32)' : 'rgba(56, 189, 248, 0.16)';
        elMsg.textContent = mensaje || 'Has completado tu rutina.';
        modal.style.display = 'flex';
        return;
    }
    alert(mensaje);
}

function cerrarModalResumenFinalizacionRutina() {
    var modal = document.getElementById('modal-rutina-finalizada');
    if (modal) {
        modal.style.display = 'none';
    }
}

var MONARCA_RUTINA_PENITENCIA_EXP_DEFAULT = 20;

function obtenerPenitenciaExpPorSerieRutina(rutina) {
    if (rutina && rutina.penitenciaExpPorSerie !== undefined && rutina.penitenciaExpPorSerie !== null && rutina.penitenciaExpPorSerie !== '') {
        var parsed = parseInt(rutina.penitenciaExpPorSerie, 10);
        if (!isNaN(parsed)) {
            return Math.max(0, Math.min(500, parsed));
        }
    }
    return MONARCA_RUTINA_PENITENCIA_EXP_DEFAULT;
}

function evaluarProgresoSeriesRutinaActiva() {
    var rutina = (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina) ? RUTINA_ACTIVA.rutina : null;
    var penitenciaPorSerie = obtenerPenitenciaExpPorSerieRutina(rutina);
    var cards = document.querySelectorAll('#contenedor-detalle-rutina-dinamica .routine-exercise-session-card[data-ej-idx]');
    var totalSeries = 0;
    var seriesCompletadas = 0;
    var faltantesPorEjercicio = [];

    if (cards && cards.length > 0) {
        cards.forEach(function(card) {
            var idx = parseInt(card.getAttribute('data-ej-idx'), 10);
            var ejChecks = card.querySelectorAll('.check-rutina-din');
            var ejTotal = ejChecks.length;
            var ejDone = 0;
            ejChecks.forEach(function(c) { if (c.checked) ejDone++; });
            totalSeries += ejTotal;
            seriesCompletadas += ejDone;
            var ejFalt = Math.max(0, ejTotal - ejDone);
            if (ejFalt > 0) {
                var ejObj = (rutina && Array.isArray(rutina.ejercicios) && !isNaN(idx)) ? rutina.ejercicios[idx] : null;
                var titleEl = card.querySelector('.routine-exercise-session-name, .clean-row-title, h4');
                var nombreEj = (ejObj && ejObj.nombre) ? ejObj.nombre : (titleEl ? titleEl.textContent.trim() : ('Ejercicio #' + (idx + 1)));
                faltantesPorEjercicio.push({
                    ejIdx: idx,
                    nombre: nombreEj,
                    hechas: ejDone,
                    totales: ejTotal,
                    faltantes: ejFalt,
                    expPenitencia: ejFalt * penitenciaPorSerie
                });
            }
        });
    } else {
        var checks = document.querySelectorAll('.check-rutina-din');
        totalSeries = checks.length;
        checks.forEach(function(c) { if (c.checked) seriesCompletadas++; });
        if (totalSeries > seriesCompletadas) {
            var fTot = totalSeries - seriesCompletadas;
            faltantesPorEjercicio.push({
                ejIdx: 0,
                nombre: (rutina && rutina.nombre) ? rutina.nombre : 'Series pendientes',
                hechas: seriesCompletadas,
                totales: totalSeries,
                faltantes: fTot,
                expPenitencia: fTot * penitenciaPorSerie
            });
        }
    }

    var seriesFaltantes = Math.max(0, totalSeries - seriesCompletadas);
    var pct = totalSeries > 0 ? Math.round((seriesCompletadas / totalSeries) * 100) : 0;
    var penitenciaTotal = seriesFaltantes * penitenciaPorSerie;

    return {
        totalSeries: totalSeries,
        seriesCompletadas: seriesCompletadas,
        seriesFaltantes: seriesFaltantes,
        pct: pct,
        penitenciaPorSerie: penitenciaPorSerie,
        penitenciaTotal: penitenciaTotal,
        faltantesPorEjercicio: faltantesPorEjercicio
    };
}

function actualizarPanelPenitenciaRutinaIncompleta(evalData) {
    var panel = document.getElementById('panel-penitencia-rutina-incompleta');
    if (!panel) return;
    var ev = evalData || evaluarProgresoSeriesRutinaActiva();

    if (ev.totalSeries <= 0 || ev.seriesFaltantes <= 0 || (ev.penitenciaPorSerie === 0 && ev.seriesCompletadas === 0)) {
        panel.style.display = 'none';
        return;
    }

    var badgeEl = document.getElementById('penitencia-rutina-badge-live');
    var totalEl = document.getElementById('penitencia-rutina-total-live');
    var detEl = document.getElementById('penitencia-rutina-detalle-live');
    var btnEl = document.getElementById('btn-terminar-rutina-incompleta');

    panel.style.display = 'flex';
    var esSinPen = ev.penitenciaPorSerie === 0;
    panel.classList.toggle('is-sin-penitencia', esSinPen);

    var sufSeries = ev.seriesFaltantes === 1 ? 'serie' : 'series';
    var resumenEjs = ev.faltantesPorEjercicio.slice(0, 3).map(function(f) {
        return f.nombre + ' (' + f.faltantes + ')';
    }).join(', ');
    if (ev.faltantesPorEjercicio.length > 3) {
        resumenEjs += ' y ' + (ev.faltantesPorEjercicio.length - 3) + ' más';
    }

    if (esSinPen) {
        if (badgeEl) badgeEl.textContent = '⚙️ SESIÓN PARCIAL · SIN PENITENCIA';
        if (totalEl) totalEl.textContent = '0 EXP';
        if (detEl) detEl.textContent = 'Faltan ' + ev.seriesFaltantes + ' ' + sufSeries + (resumenEjs ? (': ' + resumenEjs) : '') + '. Esta rutina tiene la penitencia desactivada.';
        if (btnEl) btnEl.textContent = 'Finalizar Sesión Parcial (+0 EXP)';
    } else {
        if (badgeEl) badgeEl.textContent = '💀 PENITENCIA · -' + ev.penitenciaPorSerie + ' EXP / SERIE';
        if (totalEl) totalEl.textContent = '-' + ev.penitenciaTotal + ' EXP (' + ev.seriesFaltantes + ' × -' + ev.penitenciaPorSerie + ')';
        if (detEl) detEl.textContent = 'Faltan ' + ev.seriesFaltantes + ' ' + sufSeries + (resumenEjs ? (': ' + resumenEjs) : '') + '. Si cierras incompleta perderás -' + ev.penitenciaTotal + ' EXP.';
        if (btnEl) btnEl.textContent = '💀 Terminar Incompleta (-' + ev.penitenciaTotal + ' EXP)';
    }
}

var MONARCA_RUTINA_SALIDA_PENDIENTE = null;

function limpiarErrorMotivoPenitenciaRutina() {
    var input = document.getElementById('modal-pen-rutina-motivo');
    var err = document.getElementById('modal-pen-rutina-motivo-error');
    if (input) input.classList.remove('is-error');
    if (err) err.style.display = 'none';
}

function seleccionarMotivoRapidoPenitencia(texto, btnEl) {
    var input = document.getElementById('modal-pen-rutina-motivo');
    var chips = document.querySelectorAll('#modal-confirmar-penitencia-rutina .penitencia-motivo-chip');
    chips.forEach(function(c) { c.classList.remove('active'); });
    if (btnEl) btnEl.classList.add('active');
    if (input) {
        input.value = texto || '';
        input.focus();
    }
    limpiarErrorMotivoPenitenciaRutina();
}

function abrirModalConfirmarPenitenciaRutina(opts) {
    opts = opts || {};
    if (!RUTINA_ACTIVA || !RUTINA_ACTIVA.rutina) return;
    var ev = evaluarProgresoSeriesRutinaActiva();
    if (ev.seriesFaltantes <= 0) {
        ejecutarRutinaDinamica();
        return;
    }

    var modal = document.getElementById('modal-confirmar-penitencia-rutina');
    if (!modal) {
        ejecutarRutinaDinamica({ permitirIncompleta: true });
        return;
    }

    if (opts.desdeSalida) {
        MONARCA_RUTINA_SALIDA_PENDIENTE = {
            vistaDestino: opts.vistaDestino || 'vista-ejercicios'
        };
    } else {
        MONARCA_RUTINA_SALIDA_PENDIENTE = null;
    }

    var jug = APP_STATE.jugador || { nivel: 1, exp: 0, expMax: 100 };
    var expAntes = Number(jug.exp) || 0;
    var expDespues = Math.max(0, expAntes - ev.penitenciaTotal);
    var rutNom = RUTINA_ACTIVA.rutina.nombre || 'esta rutina';
    var sufFalt = ev.seriesFaltantes === 1 ? 'serie sin realizar' : 'series sin realizar';

    var introEl = document.getElementById('modal-pen-rutina-intro');
    var kpiHechas = document.getElementById('modal-pen-kpi-hechas');
    var kpiFalt = document.getElementById('modal-pen-kpi-faltantes');
    var kpiExp = document.getElementById('modal-pen-kpi-exp');
    var desgloseEl = document.getElementById('modal-pen-rutina-desglose');
    var expPrevEl = document.getElementById('modal-pen-rutina-exp-preview');
    var btnConfirm = document.getElementById('btn-confirmar-penitencia-rutina');
    var btnPausar = document.getElementById('btn-pausar-rutina-sin-cerrar');
    var inMotivo = document.getElementById('modal-pen-rutina-motivo');
    var chips = document.querySelectorAll('#modal-confirmar-penitencia-rutina .penitencia-motivo-chip');

    if (introEl) {
        var prefijoSalida = opts.desdeSalida ? 'Vas a salir sin terminar todos los ejercicios. ' : '';
        introEl.innerHTML = prefijoSalida +
            'Llevas el <strong style="color:#38bdf8;">' + ev.pct + '% (' + ev.seriesCompletadas + '/' + ev.totalSeries + ' series)</strong> de <strong>' + escaparHtmlRutina(rutNom) + '</strong> y te ' +
            (ev.seriesFaltantes === 1 ? 'falta' : 'faltan') + ' <strong style="color:#fca5a5;">' + ev.seriesFaltantes + ' ' + sufFalt + '</strong>.' +
            (ev.penitenciaTotal > 0 ? (' Penitencia: <strong style="color:#f87171;">-' + ev.penitenciaPorSerie + ' EXP × ' + ev.seriesFaltantes + ' = -' + ev.penitenciaTotal + ' EXP</strong>.') : ' Penitencia EXP desactivada (0 EXP).');
    }
    if (kpiHechas) kpiHechas.textContent = ev.pct + '% (' + ev.seriesCompletadas + '/' + ev.totalSeries + ')';
    if (kpiFalt) kpiFalt.textContent = String(ev.seriesFaltantes);
    if (kpiExp) kpiExp.textContent = ev.penitenciaTotal > 0 ? ('-' + ev.penitenciaTotal + ' EXP') : '0 EXP';

    if (desgloseEl) {
        desgloseEl.innerHTML = ev.faltantesPorEjercicio.map(function(item) {
            var suf = item.faltantes === 1 ? 'serie faltante' : 'series faltantes';
            var lossTxt = item.expPenitencia > 0 ? ('-' + item.expPenitencia + ' EXP') : '0 EXP';
            return '<div class="modal-penitencia-ej-row">' +
                '<div><strong>' + escaparHtmlRutina(item.nombre) + '</strong> <span style="color:#94a3b8; font-size:11px;">(' + item.hechas + '/' + item.totales + ' · ' + item.faltantes + ' ' + suf + ')</span></div>' +
                '<span class="modal-penitencia-ej-loss">' + lossTxt + '</span>' +
            '</div>';
        }).join('');
    }

    if (expPrevEl) {
        expPrevEl.innerHTML = '<span>📉 <strong>EXP del Monarca</strong> (Nivel ' + (jug.nivel || 1) + ')</span>' +
            '<span style="font-family:monospace; font-weight:800; color:' + (ev.penitenciaTotal > 0 ? '#fca5a5' : '#94a3b8') + ';">' +
            expAntes + ' → ' + expDespues + ' / ' + (jug.expMax || 100) + ' EXP</span>';
    }

    if (inMotivo) inMotivo.value = '';
    chips.forEach(function(c) { c.classList.remove('active'); });
    limpiarErrorMotivoPenitenciaRutina();

    if (btnConfirm) {
        btnConfirm.textContent = ev.penitenciaTotal > 0
            ? ('💀 Aceptar Penitencia (-' + ev.penitenciaTotal + ' EXP)')
            : '✓ Cerrar Sesión Parcial';
    }

    if (btnPausar) {
        btnPausar.style.display = opts.desdeSalida ? 'block' : 'none';
    }

    modal.style.display = 'flex';
}

function cerrarModalConfirmarPenitenciaRutina() {
    var modal = document.getElementById('modal-confirmar-penitencia-rutina');
    if (modal) modal.style.display = 'none';
    MONARCA_RUTINA_SALIDA_PENDIENTE = null;
}

function confirmarFinalizarRutinaIncompleta() {
    var inMotivo = document.getElementById('modal-pen-rutina-motivo');
    var errEl = document.getElementById('modal-pen-rutina-motivo-error');
    var motivo = inMotivo ? inMotivo.value.trim() : '';
    if (!motivo) {
        if (inMotivo) {
            inMotivo.classList.add('is-error');
            inMotivo.focus();
        }
        if (errEl) errEl.style.display = 'block';
        return;
    }

    var destino = (MONARCA_RUTINA_SALIDA_PENDIENTE && MONARCA_RUTINA_SALIDA_PENDIENTE.vistaDestino)
        ? MONARCA_RUTINA_SALIDA_PENDIENTE.vistaDestino
        : 'vista-ejercicios';
    cerrarModalConfirmarPenitenciaRutina();
    ejecutarRutinaDinamica({
        permitirIncompleta: true,
        motivoIncompleta: motivo,
        vistaDestino: destino
    });
}

function interceptarSalidaRutinaIncompleta(vistaDestino, desdePopState) {
    if (typeof window !== 'undefined' && window._MONARCA_OMITIR_GUARDIA_SALIDA_RUTINA) {
        window._MONARCA_OMITIR_GUARDIA_SALIDA_RUTINA = false;
        return false;
    }
    if (!RUTINA_ACTIVA || !RUTINA_ACTIVA.rutina) return false;
    var ev = evaluarProgresoSeriesRutinaActiva();
    // Solo interceptar si ya empezó la rutina (>0 series hechas) y aún le faltan series
    if (ev.totalSeries > 0 && ev.seriesCompletadas > 0 && ev.seriesFaltantes > 0) {
        if (desdePopState) {
            try {
                history.pushState({ vista: 'vista-detalle-rutina-dinamica' }, '', '#vista-detalle-rutina-dinamica');
            } catch (e) {}
        }
        abrirModalConfirmarPenitenciaRutina({
            desdeSalida: true,
            vistaDestino: vistaDestino || 'vista-ejercicios'
        });
        return true;
    }
    return false;
}

function intentarSalirDeRutinaActiva(vistaDestino) {
    var destino = vistaDestino || 'vista-ejercicios';
    if (interceptarSalidaRutinaIncompleta(destino, false)) {
        return;
    }
    if (typeof limpiarTodosLosTimersSeries === 'function') limpiarTodosLosTimersSeries();
    if (typeof window !== 'undefined') window._MONARCA_OMITIR_GUARDIA_SALIDA_RUTINA = true;
    try {
        cambiarVista(destino, false, { forzarSalidaRutina: true });
    } finally {
        if (typeof window !== 'undefined') window._MONARCA_OMITIR_GUARDIA_SALIDA_RUTINA = false;
    }
}

function pausarYSalirDeRutinaActiva() {
    var destino = (MONARCA_RUTINA_SALIDA_PENDIENTE && MONARCA_RUTINA_SALIDA_PENDIENTE.vistaDestino)
        ? MONARCA_RUTINA_SALIDA_PENDIENTE.vistaDestino
        : 'vista-ejercicios';
    if (typeof guardarEstadoSesionActivaEnStorage === 'function') guardarEstadoSesionActivaEnStorage();
    if (typeof limpiarTodosLosTimersSeries === 'function') limpiarTodosLosTimersSeries();
    cerrarModalConfirmarPenitenciaRutina();
    if (typeof window !== 'undefined') window._MONARCA_OMITIR_GUARDIA_SALIDA_RUTINA = true;
    try {
        cambiarVista(destino, false, { forzarSalidaRutina: true });
    } finally {
        if (typeof window !== 'undefined') window._MONARCA_OMITIR_GUARDIA_SALIDA_RUTINA = false;
    }
}

if (typeof window !== 'undefined') {
    window.actualizarSelectoresPlaylistRutinas = actualizarSelectoresPlaylistRutinas;
    window.alCambiarPlaylistDefaultRutina = alCambiarPlaylistDefaultRutina;
    window.alCambiarPlaylistEnRutinaActiva = alCambiarPlaylistEnRutinaActiva;
    window.togglePlayMusicaRutina = togglePlayMusicaRutina;
    window.siguienteCancionMusicaRutina = siguienteCancionMusicaRutina;
    window.detenerMusicaManualDesdeRutina = detenerMusicaManualDesdeRutina;
    window.mostrarModalResumenFinalizacionRutina = mostrarModalResumenFinalizacionRutina;
    window.cerrarModalResumenFinalizacionRutina = cerrarModalResumenFinalizacionRutina;
    window.obtenerPenitenciaExpPorSerieRutina = obtenerPenitenciaExpPorSerieRutina;
    window.evaluarProgresoSeriesRutinaActiva = evaluarProgresoSeriesRutinaActiva;
    window.abrirModalConfirmarPenitenciaRutina = abrirModalConfirmarPenitenciaRutina;
    window.cerrarModalConfirmarPenitenciaRutina = cerrarModalConfirmarPenitenciaRutina;
    window.confirmarFinalizarRutinaIncompleta = confirmarFinalizarRutinaIncompleta;
    window.seleccionarMotivoRapidoPenitencia = seleccionarMotivoRapidoPenitencia;
    window.limpiarErrorMotivoPenitenciaRutina = limpiarErrorMotivoPenitenciaRutina;
    window.interceptarSalidaRutinaIncompleta = interceptarSalidaRutinaIncompleta;
    window.intentarSalirDeRutinaActiva = intentarSalirDeRutinaActiva;
    window.pausarYSalirDeRutinaActiva = pausarYSalirDeRutinaActiva;
}

function abrirDetalleRutina(idxOrId, omitirAutoCalentamiento) {
    limpiarTodosLosTimersSeries();
    if (!APP_STATE.rutinas) APP_STATE.rutinas = [];
    var prevRutinaKey = (RUTINA_ACTIVA && RUTINA_ACTIVA.rutina)
        ? (RUTINA_ACTIVA.rutina.id || RUTINA_ACTIVA.rutina.nombre || String(RUTINA_ACTIVA.idx))
        : null;
    var rutina = null;
    var idx = -1;

    if (typeof idxOrId === 'string') {
        idx = APP_STATE.rutinas.findIndex(function(r) { return r && (r.id === idxOrId || r.codigo === idxOrId); });
        if (idx !== -1) {
            rutina = APP_STATE.rutinas[idx];
        } else if (!isNaN(parseInt(idxOrId))) {
            idx = parseInt(idxOrId);
            rutina = APP_STATE.rutinas[idx];
        }
    } else if (typeof idxOrId === 'number') {
        idx = idxOrId;
        rutina = APP_STATE.rutinas[idx];
    }

    if (!rutina) {
        console.warn("Rutina no encontrada para:", idxOrId);
        return;
    }

    var nuevaRutinaKey = rutina.id || rutina.nombre || String(idx);
    if (prevRutinaKey && prevRutinaKey !== nuevaRutinaKey && (ASISTENTE_GYM.intervaloId || ASISTENTE_GYM.finTimestamp > 0 || ASISTENTE_GYM.finalizado)) {
        detenerDescansoGym();
    }

    RUTINA_ACTIVA = { rutina: rutina, idx: idx };
    HISTORIAL_FACTOR_SERIES = {};

    cambiarVista('vista-detalle-rutina-dinamica');
    iniciarAudioAutomaticoParaRutina(rutina, !!omitirAutoCalentamiento);

    var tituloEl = document.getElementById('detalle-rutina-titulo');
    var badgeEl = document.getElementById('detalle-rutina-badge');
    if (tituloEl) tituloEl.innerText = rutina.nombre;
    if (badgeEl) badgeEl.innerText = limpiarBadgeRutina(rutina.rankLabel, 'SESIÓN DE ENTRENAMIENTO');

    var cont = document.getElementById('contenedor-detalle-rutina-dinamica');
    if (!cont) return;

    var totalSeries = calcularTotalSeriesRutina(rutina.ejercicios);
    var progrCont = document.getElementById('progreso-rutina-dinamica-cont');
    var progrBarra = document.getElementById('progreso-barra-rutina-dinamica');
    var progrTexto = document.getElementById('progreso-texto-rutina-dinamica');
    var btnReg = document.getElementById('btn-registrar-rutina-dinamica');

    if (progrCont) progrCont.style.display = 'block';
    if (progrBarra) progrBarra.style.width = '0%';
    if (progrTexto) progrTexto.innerText = '0 / ' + totalSeries + ' series (0%)';
    if (btnReg) {
        btnReg.style.display = 'block';
        btnReg.disabled = true;
    }

    try {
        cont.innerHTML = renderizarTarjetasEjerciciosSesion(rutina.ejercicios);
    } catch(err) {
        console.error("Error al renderizar tarjetas de ejercicios de sesión:", err);
        cont.innerHTML = '<p style="color: #ef4444; padding: 20px; text-align: center;">Error al cargar ejercicios: ' + err.message + '</p>';
    }

    var sesionRestaurada = restaurarEstadoSesionActivaDeStorage(idxOrId);
    if (!sesionRestaurada) {
        actualizarProgresoRutinaDinamica();
    }

    if (CHART_FATIGA_RUTINA_SESION) {
        CHART_FATIGA_RUTINA_SESION.destroy();
        CHART_FATIGA_RUTINA_SESION = null;
    }
    actualizarGraficaFatigaSesion();

    if (!omitirAutoCalentamiento && !sesionRestaurada) {
        setTimeout(function() {
            iniciarCalentamientoAutomatico();
        }, 120);
    }
}


function actualizarProgresoRutinaDinamica() {
    var checks = document.querySelectorAll('.check-rutina-din');
    var total = checks.length;
    var completados = 0;

    checks.forEach(function(c, i) {
        var row = c.closest('.series-check-row') || c.closest('.routine-exercise-clean-row') || document.getElementById('row-ej-' + i);
        var ind = row ? row.querySelector('.series-checkbox-indicator') : null;
        var btnAction = row ? row.querySelector('.btn-check-serie-hecha') : null;
        if (c.checked) {
            completados++;
            if (row) row.classList.add('checked-active');
            if (ind) ind.classList.add('checked');
            if (btnAction) {
                btnAction.classList.add('active');
                btnAction.innerHTML = '<span>✓</span> Completada';
            }
        } else {
            if (row) row.classList.remove('checked-active');
            if (ind) ind.classList.remove('checked');
            if (btnAction) {
                btnAction.classList.remove('active');
                btnAction.innerHTML = '<span>✓</span> Marcar Hecha';
            }
        }
    });

    var pct = total > 0 ? Math.round((completados / total) * 100) : 0;
    var faltantes = Math.max(0, total - completados);
    var progrBarra = document.getElementById('progreso-barra-rutina-dinamica');
    var progrTexto = document.getElementById('progreso-texto-rutina-dinamica');
    var btnReg = document.getElementById('btn-registrar-rutina-dinamica');

    if (progrBarra) progrBarra.style.width = pct + '%';
    if (progrTexto) progrTexto.innerText = completados + ' / ' + total + ' series (' + pct + '%)';

    if (btnReg) {
        btnReg.disabled = (total === 0 || completados < total);
        if (completados === total && total > 0) {
            btnReg.classList.add('btn-ready-pulse');
            btnReg.innerText = '✓ Completar y Registrar Rutina (+60 EXP)';
        } else {
            btnReg.classList.remove('btn-ready-pulse');
            btnReg.innerText = total > 0
                ? ('Completar y Registrar Rutina (faltan ' + faltantes + ' ' + (faltantes === 1 ? 'serie' : 'series') + ')')
                : 'Completar y Registrar Rutina';
        }
    }

    var cards = document.querySelectorAll('#contenedor-detalle-rutina-dinamica .routine-exercise-session-card[data-ej-idx]');
    cards.forEach(function(card) {
        var idx = card.getAttribute('data-ej-idx');
        var ejChecks = card.querySelectorAll('.check-rutina-din');
        var ejTotal = ejChecks.length;
        var ejDone = 0;
        ejChecks.forEach(function(c) { if (c.checked) ejDone++; });
        var allDone = ejTotal > 0 && ejDone === ejTotal;
        card.classList.toggle('is-all-done', allDone);
        var chip = document.getElementById('prog-chip-ej-' + idx);
        if (chip) {
            chip.classList.toggle('is-done', allDone);
            var suf = card.classList.contains('is-mental')
                ? ' sesión'
                : (ejTotal === 1 ? (allDone ? ' hecha' : ' serie') : (allDone ? ' listas' : ' series'));
            chip.textContent = (allDone ? '✓ ' : '') + ejDone + '/' + ejTotal + suf;
        }
    });

    actualizarPanelPenitenciaRutinaIncompleta();
}

function actualizarProgresoRutina(checkClass, barraId, textoId, btnId) {
    var checks = document.querySelectorAll('.' + checkClass);
    var total = checks.length;
    var completados = 0;

    checks.forEach(function(c) {
        var parentLabel = c.closest('.exercise-item-rpg');
        var badgeStatus = parentLabel ? parentLabel.querySelector('.badge-status-item') : null;

        if (c.checked) {
            completados++;
            if (parentLabel) parentLabel.classList.add('checked-active');
            if (badgeStatus) {
                badgeStatus.innerText = 'LISTO';
                badgeStatus.style.background = '#10b981';
                badgeStatus.style.color = '#ffffff';
            }
        } else {
            if (parentLabel) parentLabel.classList.remove('checked-active');
            if (badgeStatus) {
                badgeStatus.innerText = 'PENDIENTE';
                badgeStatus.style.background = '#f3f4f6';
                badgeStatus.style.color = '#6b7280';
            }
        }
    });

    var pct = total > 0 ? Math.round((completados / total) * 100) : 0;
    var progrBarra = document.getElementById(barraId);
    var progrTexto = document.getElementById(textoId);
    var btnReg = document.getElementById(btnId);

    if (progrBarra) progrBarra.style.width = pct + '%';
    if (progrTexto) progrTexto.innerText = completados + ' / ' + total + ' (' + pct + '%)';

    if (btnReg) {
        btnReg.disabled = (completados < total);
        if (completados === total && total > 0) {
            btnReg.classList.add('btn-ready-pulse');
        } else {
            btnReg.classList.remove('btn-ready-pulse');
        }
    }
}

function ejecutarRutina(tipo) {
    var mapaNombres = {
        'mananera': 'Rutina Mañanera',
        'empuje': 'Rutina de Empuje',
        'pierna': 'Rutina de Pierna',
        'arrastre': 'Rutina de Arrastre'
    };
    var nombre = mapaNombres[tipo] || ('Rutina ' + tipo);

    if (!APP_STATE.fatiga) APP_STATE.fatiga = JSON.parse(JSON.stringify(DEFAULT_STATE.fatiga));

    if (tipo === 'mananera') {
        APP_STATE.fatiga.pect_mayor = Math.min(100, (APP_STATE.fatiga.pect_mayor || 0) + 15);
        APP_STATE.fatiga.triceps = Math.min(100, (APP_STATE.fatiga.triceps || 0) + 15);
        APP_STATE.fatiga.delt_ant = Math.min(100, (APP_STATE.fatiga.delt_ant || 0) + 10);
        APP_STATE.fatiga.core = Math.min(100, (APP_STATE.fatiga.core || 0) + 25);
        APP_STATE.fatiga.cuadriceps = Math.min(100, (APP_STATE.fatiga.cuadriceps || 0) + 20);
        APP_STATE.fatiga.gluteos = Math.min(100, (APP_STATE.fatiga.gluteos || 0) + 15);
    } else if (tipo === 'empuje') {
        APP_STATE.fatiga.pect_mayor = Math.min(100, (APP_STATE.fatiga.pect_mayor || 0) + 30);
        APP_STATE.fatiga.triceps = Math.min(100, (APP_STATE.fatiga.triceps || 0) + 25);
        APP_STATE.fatiga.delt_ant = Math.min(100, (APP_STATE.fatiga.delt_ant || 0) + 25);
        APP_STATE.fatiga.delt_lat = Math.min(100, (APP_STATE.fatiga.delt_lat || 0) + 15);
    } else if (tipo === 'pierna') {
        APP_STATE.fatiga.cuadriceps = Math.min(100, (APP_STATE.fatiga.cuadriceps || 0) + 35);
        APP_STATE.fatiga.gluteos = Math.min(100, (APP_STATE.fatiga.gluteos || 0) + 25);
        APP_STATE.fatiga.antebrazos = Math.min(100, (APP_STATE.fatiga.antebrazos || 0) + 25);
    } else if (tipo === 'arrastre') {
        APP_STATE.fatiga.dorsales = Math.min(100, (APP_STATE.fatiga.dorsales || 0) + 30);
        APP_STATE.fatiga.trapecios = Math.min(100, (APP_STATE.fatiga.trapecios || 0) + 25);
        APP_STATE.fatiga.biceps = Math.min(100, (APP_STATE.fatiga.biceps || 0) + 30);
    }

    var keysFatiga = Object.keys(METADATOS_MUSCULOS);
    var sumaTotal = 0;
    keysFatiga.forEach(function(k) {
        sumaTotal += (Number(APP_STATE.fatiga[k]) || 0);
    });
    APP_STATE.fatiga.promedioHoy = Math.round(sumaTotal / keysFatiga.length);
    APP_STATE.fatiga.ultimoCierre = "Entrenamiento: " + nombre;

    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!APP_STATE.gym) APP_STATE.gym = [];
    APP_STATE.gym.unshift({
        fecha: fechaHoy,
        detalle: "Sesión completada al 100%: " + nombre + " (+Fatiga muscular registrada)"
    });

    sumarExp(50);
    MonarcaDB.save(APP_STATE);
    if (window.MonarcaPlayer && typeof window.MonarcaPlayer.detenerMusicaDeRutina === 'function') {
        window.MonarcaPlayer.detenerMusicaDeRutina(true);
    }

    cambiarVista('vista-ejercicios');
    mostrarModalResumenFinalizacionRutina('RUTINA COMPLETADA', "¡Excelente trabajo! Has completado la " + nombre + " al 100% (+50 EXP y fatiga registrada).");
}

function ejecutarRutinaDinamica(opts) {
    if (!RUTINA_ACTIVA) return;
    opts = opts || {};
    var rutina = RUTINA_ACTIVA.rutina;
    var evalProg = evaluarProgresoSeriesRutinaActiva();
    var esIncompleta = evalProg.totalSeries > 0 && evalProg.seriesFaltantes > 0;

    if (esIncompleta && !opts.permitirIncompleta) {
        abrirModalConfirmarPenitenciaRutina();
        return;
    }

    if (!APP_STATE.fatiga) APP_STATE.fatiga = DEFAULT_STATE.fatiga;

    var tieneMentales = false;
    var tieneFisicos = false;
    var yaSeAplicoDesgasteEnVivo = Object.keys(HISTORIAL_FACTOR_SERIES || {}).length > 0;

    if (rutina.ejercicios) {
        rutina.ejercicios.forEach(function(ej, ejIdx) {
            var esSerieCeroEj = (ej.series === 0 || ej.esSerieCero);
            var numSeriesEj = ej.esMental ? 1 : (esSerieCeroEj ? 1 : Math.max(1, parseInt(ej.series, 10) || 3));
            var hechasEj = 0;
            for (var sIdx = 1; sIdx <= numSeriesEj; sIdx++) {
                var chkEj = document.getElementById('check-ej-' + ejIdx + '-s-' + sIdx);
                if (chkEj && chkEj.checked) hechasEj++;
            }
            var ratioHechas = numSeriesEj > 0 ? (hechasEj / numSeriesEj) : 0;

            if (ej.esMental) {
                tieneMentales = true;
                if (!yaSeAplicoDesgasteEnVivo && (!esIncompleta || hechasEj > 0)) {
                    if (typeof sumarExpMusculoMental === 'function' && ej.musculoPrincipal) {
                        sumarExpMusculoMental(ej.musculoPrincipal, ej.expRecompensa || 25);
                    }
                    var fm = APP_STATE.fatigaMentalDiaria || { nivel: 20 };
                    var delta = Number(ej.fatigaEstimada) || 15;
                    fm.nivel = Math.min(100, Math.max(0, (fm.nivel || 0) + delta));
                    fm.estado = fm.nivel <= 25 ? "Mente Despejada" : (fm.nivel <= 60 ? "Carga Moderada" : (fm.nivel <= 85 ? "Fatiga Elevada" : "Saturación Neural"));
                    APP_STATE.fatigaMentalDiaria = fm;
                }
            } else {
                tieneFisicos = true;
                if (!yaSeAplicoDesgasteEnVivo && (!esIncompleta || hechasEj > 0)) {
                    var fatigaVal = (Number(ej.fatigaPorcentaje) || 20) * (esIncompleta ? ratioHechas : 1);
                    var mKeys = mapearTextoAMusculos(ej.categorias || []);
                    if (mKeys.length === 0 && ej.nombre) {
                        mKeys = mapearTextoAMusculos(ej.nombre);
                    }
                    mKeys.forEach(function(mKey) {
                        var actual = Number(APP_STATE.fatiga[mKey]) || 0;
                        APP_STATE.fatiga[mKey] = Math.min(100, Math.round(actual + fatigaVal));
                    });
                }
            }
        });
    }

    // Detección y actualización de Sobrecarga Progresiva o Récords en Serie 0 (solo sobre series realizadas)
    var sobrecargas = [];
    var recordsSerieCero = [];
    if (rutina.ejercicios && Array.isArray(rutina.ejercicios)) {
        rutina.ejercicios.forEach(function(ej, ejIdx) {
            if (ej.esMental) return;
            var esSerieCero = (ej.series === 0 || ej.esSerieCero);
            var numSeries = esSerieCero ? 1 : Math.max(1, parseInt(ej.series) || 3);
            var esTiempoEj = (ej.modalidadEsfuerzo === 'tiempo') || (ej.tiempoSegundos != null && ej.tiempoSegundos > 0);
            var pesoBaseAnterior = obtenerPesoBaseEjercicio(ej);
            var tiempoBaseAnterior = ej.tiempoSegundos || ej.tiempoReferencia || obtenerRepsPromedioEjercicio(ej) || 60;
            var maxPesoLevantado = 0;
            var maxTiempoLogrado = 0;
            var seriesCompletadas = 0;

            for (var s = 1; s <= numSeries; s++) {
                var chk = document.getElementById('check-ej-' + ejIdx + '-s-' + s);
                if (chk && chk.checked) {
                    seriesCompletadas++;
                    var inPeso = document.getElementById('input-peso-ej-' + ejIdx + '-s-' + s);
                    var inReps = document.getElementById('input-reps-ej-' + ejIdx + '-s-' + s);
                    var p = inPeso ? (parseFloat(inPeso.value) || 0) : 0;
                    var r = inReps ? (parseFloat(inReps.value) || 0) : 0;
                    if (p > maxPesoLevantado) maxPesoLevantado = p;
                    if (r > maxTiempoLogrado) maxTiempoLogrado = r;
                }
            }

            if (esSerieCero) {
                if (seriesCompletadas > 0) {
                    var inRepsCero = document.getElementById('input-reps-ej-' + ejIdx + '-s-1');
                    var inPesoCero = document.getElementById('input-peso-ej-' + ejIdx + '-s-1');
                    var repsLogradas = inRepsCero ? (parseFloat(inRepsCero.value) || 0) : 0;
                    var pesoLogrado = inPesoCero ? (parseFloat(inPesoCero.value) || 0) : 0;

                    var recPrevio = ej.recordSerieCero || 0;
                    var nuevoRecord = Math.max(recPrevio, repsLogradas);
                    var esNuevoRecord = (repsLogradas > recPrevio && recPrevio > 0);

                    ej.recordSerieCero = nuevoRecord;
                    ej.ultimaSerieCeroReps = repsLogradas;
                    ej.ultimoPesoSerieCero = pesoLogrado;
                    ej.repeticionesPromedio = repsLogradas;
                    ej.repeticiones = repsLogradas + ' reps';
                    ej.peso = pesoLogrado;
                    ej.series = 0;
                    ej.esSerieCero = true;

                    // Actualizar en catálogo general
                    if (APP_STATE.ejercicios && Array.isArray(APP_STATE.ejercicios)) {
                        var ejCat = APP_STATE.ejercicios.find(function(item) {
                            return item && ((ej.id && item.id === ej.id) || (item.nombre && item.nombre.trim().toLowerCase() === ej.nombre.trim().toLowerCase()));
                        });
                        if (ejCat) {
                            ejCat.recordSerieCero = nuevoRecord;
                            ejCat.ultimaSerieCeroReps = repsLogradas;
                            ejCat.ultimoPesoSerieCero = pesoLogrado;
                            ejCat.repeticionesPromedio = repsLogradas;
                            ejCat.repeticiones = repsLogradas + ' reps';
                            ejCat.peso = pesoLogrado;
                            ejCat.series = 0;
                            ejCat.esSerieCero = true;
                        }
                    }

                    // Actualizar en la rutina guardada
                    if (RUTINA_ACTIVA.idx >= 0 && APP_STATE.rutinas && APP_STATE.rutinas[RUTINA_ACTIVA.idx]) {
                        var rutGuardada = APP_STATE.rutinas[RUTINA_ACTIVA.idx];
                        if (rutGuardada.ejercicios && rutGuardada.ejercicios[ejIdx]) {
                            rutGuardada.ejercicios[ejIdx].recordSerieCero = nuevoRecord;
                            rutGuardada.ejercicios[ejIdx].ultimaSerieCeroReps = repsLogradas;
                            rutGuardada.ejercicios[ejIdx].ultimoPesoSerieCero = pesoLogrado;
                            rutGuardada.ejercicios[ejIdx].repeticionesPromedio = repsLogradas;
                            rutGuardada.ejercicios[ejIdx].repeticiones = repsLogradas + ' reps';
                            rutGuardada.ejercicios[ejIdx].peso = pesoLogrado;
                            rutGuardada.ejercicios[ejIdx].series = 0;
                            rutGuardada.ejercicios[ejIdx].esSerieCero = true;
                        }
                    }

                    recordsSerieCero.push({
                        nombre: ej.nombre,
                        reps: repsLogradas,
                        anterior: recPrevio,
                        esNuevoRecord: esNuevoRecord,
                        record: nuevoRecord,
                        peso: pesoLogrado
                    });
                }
            } else if (esTiempoEj) {
                if (seriesCompletadas > 0 && maxTiempoLogrado > tiempoBaseAnterior) {
                    var diffT = Math.round(maxTiempoLogrado - tiempoBaseAnterior);
                    ej.tiempoSegundos = maxTiempoLogrado;
                    ej.tiempoReferencia = maxTiempoLogrado;
                    ej.repeticionesPromedio = maxTiempoLogrado;
                    ej.repeticiones = maxTiempoLogrado + 's isométrico (' + formatearTiempoMMSS(maxTiempoLogrado) + ')';

                    // Actualizar en el catálogo general de ejercicios
                    if (APP_STATE.ejercicios && Array.isArray(APP_STATE.ejercicios)) {
                        var ejCatT = APP_STATE.ejercicios.find(function(item) {
                            return item && ((ej.id && item.id === ej.id) || (item.nombre && item.nombre.trim().toLowerCase() === ej.nombre.trim().toLowerCase()));
                        });
                        if (ejCatT) {
                            ejCatT.tiempoSegundos = maxTiempoLogrado;
                            ejCatT.tiempoReferencia = maxTiempoLogrado;
                            ejCatT.repeticionesPromedio = maxTiempoLogrado;
                            ejCatT.repeticiones = maxTiempoLogrado + 's isométrico (' + formatearTiempoMMSS(maxTiempoLogrado) + ')';
                        }
                    }

                    // Actualizar en la rutina guardada
                    if (RUTINA_ACTIVA.idx >= 0 && APP_STATE.rutinas && APP_STATE.rutinas[RUTINA_ACTIVA.idx]) {
                        var rutGuardadaT = APP_STATE.rutinas[RUTINA_ACTIVA.idx];
                        if (rutGuardadaT.ejercicios && rutGuardadaT.ejercicios[ejIdx]) {
                            rutGuardadaT.ejercicios[ejIdx].tiempoSegundos = maxTiempoLogrado;
                            rutGuardadaT.ejercicios[ejIdx].tiempoReferencia = maxTiempoLogrado;
                            rutGuardadaT.ejercicios[ejIdx].repeticionesPromedio = maxTiempoLogrado;
                            rutGuardadaT.ejercicios[ejIdx].repeticiones = maxTiempoLogrado + 's isométrico (' + formatearTiempoMMSS(maxTiempoLogrado) + ')';
                        }
                    }

                    sobrecargas.push({
                        nombre: ej.nombre,
                        anterior: tiempoBaseAnterior,
                        nuevo: maxTiempoLogrado,
                        diff: diffT,
                        esTiempo: true,
                        unidad: 'seg'
                    });
                }
            } else {
                if (seriesCompletadas > 0 && maxPesoLevantado > pesoBaseAnterior) {
                    var diff = Math.round((maxPesoLevantado - pesoBaseAnterior) * 10) / 10;
                    ej.peso = maxPesoLevantado;
                    ej.pesoReferencia = maxPesoLevantado;

                    // Actualizar en el catálogo general de ejercicios
                    if (APP_STATE.ejercicios && Array.isArray(APP_STATE.ejercicios)) {
                        var ejCatP = APP_STATE.ejercicios.find(function(item) {
                            return item && ((ej.id && item.id === ej.id) || (item.nombre && item.nombre.trim().toLowerCase() === ej.nombre.trim().toLowerCase()));
                        });
                        if (ejCatP) {
                            ejCatP.peso = maxPesoLevantado;
                            ejCatP.pesoReferencia = maxPesoLevantado;
                        }
                    }

                    // Actualizar en la rutina guardada
                    if (RUTINA_ACTIVA.idx >= 0 && APP_STATE.rutinas && APP_STATE.rutinas[RUTINA_ACTIVA.idx]) {
                        var rutGuardadaP = APP_STATE.rutinas[RUTINA_ACTIVA.idx];
                        if (rutGuardadaP.ejercicios && rutGuardadaP.ejercicios[ejIdx]) {
                            rutGuardadaP.ejercicios[ejIdx].peso = maxPesoLevantado;
                            rutGuardadaP.ejercicios[ejIdx].pesoReferencia = maxPesoLevantado;
                        }
                    }

                    sobrecargas.push({
                        nombre: ej.nombre,
                        anterior: pesoBaseAnterior,
                        nuevo: maxPesoLevantado,
                        diff: diff,
                        esTiempo: false,
                        unidad: ej.unidadPeso || 'kg'
                    });
                }
            }
        });
    }

    if (tieneFisicos && (!esIncompleta || evalProg.seriesCompletadas > 0)) {
        var keysFatiga = Object.keys(METADATOS_MUSCULOS);
        var sumaTotal = 0;
        keysFatiga.forEach(function(k) {
            sumaTotal += (Number(APP_STATE.fatiga[k]) || 0);
        });
        APP_STATE.fatiga.promedioHoy = Math.round(sumaTotal / keysFatiga.length);
        APP_STATE.fatiga.ultimoCierre = (esIncompleta ? "Entrenamiento incompleto: " : "Entrenamiento: ") + rutina.nombre;
    }

    calcularMetricasGeneralesDesgaste();

    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!APP_STATE.gym) APP_STATE.gym = [];
    var tagTipoHist = tieneMentales && tieneFisicos ? " [HÍBRIDA]" : (tieneMentales ? " [MENTAL]" : " [FÍSICA]");

    // Registrar primero los sub-logs (Serie 0 / sobrecarga) para que el resumen principal quede arriba del todo
    recordsSerieCero.forEach(function(rc) {
        if (rc.esNuevoRecord) {
            APP_STATE.gym.unshift({
                fecha: fechaHoy,
                detalle: "🏆 ¡NUEVO RÉCORD SERIE 0!: " + rc.nombre + " superó su marca previa de " + rc.anterior + " reps alcanzando " + rc.reps + " reps. Próxima sesión calibrada en " + rc.reps + " reps."
            });
        } else {
            APP_STATE.gym.unshift({
                fecha: fechaHoy,
                detalle: "⚡ SERIE 0 COMPLETADA: " + rc.nombre + " - " + rc.reps + " reps registradas. Marca calibrada para la próxima sesión."
            });
        }
    });

    sobrecargas.forEach(function(sc) {
        if (sc.esTiempo) {
            APP_STATE.gym.unshift({
                fecha: fechaHoy,
                detalle: "⏱️ RÉCORD ISOMÉTRICO: " + sc.nombre + " subió de " + sc.anterior + "s a " + sc.nuevo + "s (+" + sc.diff + "s extra). Nuevo tiempo promedio calibrado."
            });
        } else {
            var u = sc.unidad || 'kg';
            APP_STATE.gym.unshift({
                fecha: fechaHoy,
                detalle: "🔥 SOBRECARGA PROGRESIVA: " + sc.nombre + " subió de " + sc.anterior + " " + u + " a " + sc.nuevo + " " + u + " (+" + sc.diff + " " + u + "). Nuevo peso base calibrado."
            });
        }
    });

    if (esIncompleta) {
        var motivoLimpio = (opts.motivoIncompleta && String(opts.motivoIncompleta).trim())
            ? String(opts.motivoIncompleta).trim()
            : '';
        var resumenFaltLog = evalProg.faltantesPorEjercicio.map(function(f) {
            return f.nombre + ' (' + f.faltantes + ')';
        }).join(', ');
        var txtPenLog = evalProg.penitenciaTotal > 0
            ? (' → Penitencia -' + evalProg.penitenciaTotal + ' EXP (' + evalProg.seriesFaltantes + ' × -' + evalProg.penitenciaPorSerie + ')')
            : ' · Sin penitencia';
        APP_STATE.gym.unshift({
            fecha: fechaHoy,
            hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            detalle: "Rutina INCOMPLETA" + tagTipoHist + ": " + rutina.nombre + " (" + evalProg.pct + "% · " + evalProg.seriesCompletadas + "/" + evalProg.totalSeries + " series · Faltaron " + evalProg.seriesFaltantes + txtPenLog + ")" + (resumenFaltLog ? (" · Faltantes: " + resumenFaltLog) : ""),
            esIncompleta: true,
            porcentajeCompletado: evalProg.pct,
            seriesHechas: evalProg.seriesCompletadas,
            seriesTotales: evalProg.totalSeries,
            seriesFaltantes: evalProg.seriesFaltantes,
            penitenciaPorSerie: evalProg.penitenciaPorSerie,
            penitenciaExp: evalProg.penitenciaTotal,
            motivoIncompleta: motivoLimpio,
            detalleFaltantes: evalProg.faltantesPorEjercicio
        });
    } else {
        APP_STATE.gym.unshift({
            fecha: fechaHoy,
            detalle: "Rutina completada" + tagTipoHist + ": " + rutina.nombre + " (" + (rutina.ejercicios ? rutina.ejercicios.length : 0) + " ejercicios)"
        });
    }

    // Auto-completar Hábitos y Misiones Diarias vinculadas SOLO si la rutina se terminó al 100%
    var habitosCompletadosAuto = 0;
    if (!esIncompleta && APP_STATE.questsDiarios && Array.isArray(APP_STATE.questsDiarios)) {
        APP_STATE.questsDiarios.forEach(function(q) {
            if (!q) return;
            var coincideId = q.rutinaId && (
                q.rutinaId === rutina.id ||
                q.rutinaId === rutina.codigo ||
                String(q.rutinaId) === String(RUTINA_ACTIVA.idx)
            );
            var coincideNombre = q.rutinaNombre && rutina.nombre && (
                q.rutinaNombre.trim().toLowerCase() === rutina.nombre.trim().toLowerCase()
            );
            var coincideTitulo = q.titulo && rutina.nombre && (
                q.titulo.trim().toLowerCase().includes(rutina.nombre.trim().toLowerCase())
            );
            if (coincideId || coincideNombre || (q.rutinaId && coincideTitulo)) {
                if (q.estado !== 'completada' && q.estado !== 'penalizada' && q.estado !== 'penitencia_cumplida') {
                    q.estado = 'completada';
                    q.temporizadorActivo = false;
                    q.fechaCompletada = new Date().toISOString();
                    habitosCompletadosAuto++;
                }
            }
        });
        if (habitosCompletadosAuto > 0 && typeof renderizarQuestsDiarios === 'function') {
            renderizarQuestsDiarios();
        }
    }

    var expPenRes = null;
    if (esIncompleta) {
        if (evalProg.penitenciaTotal > 0 && typeof restarExp === 'function') {
            expPenRes = restarExp(evalProg.penitenciaTotal);
            emitirTonoAudio(220, 0.28, 'sawtooth');
            if (navigator.vibrate) navigator.vibrate([180, 90, 240]);
        }
    } else {
        sumarExp(60);
    }

    detenerDescansoGym();
    limpiarTodosLosTimersSeries();
    limpiarSesionActivaStorage();
    MonarcaDB.save(APP_STATE);
    if (window.MonarcaPlayer && typeof window.MonarcaPlayer.detenerMusicaDeRutina === 'function') {
        window.MonarcaPlayer.detenerMusicaDeRutina(true);
    }

    var msgAviso = "";
    if (esIncompleta) {
        var jugAct = APP_STATE.jugador || { nivel: 1, exp: 0, expMax: 100 };
        var motivoTxt = (opts.motivoIncompleta && String(opts.motivoIncompleta).trim())
            ? String(opts.motivoIncompleta).trim()
            : '';
        msgAviso = "⚠️ Has cerrado '" + rutina.nombre + "' de forma incompleta.\n" +
            "Porcentaje alcanzado: " + evalProg.pct + "% (" + evalProg.seriesCompletadas + " / " + evalProg.totalSeries + " series).\n" +
            "Series no realizadas: " + evalProg.seriesFaltantes + ".\n";

        if (motivoTxt) {
            msgAviso += "📝 Motivo registrado: " + motivoTxt + "\n";
        }

        if (evalProg.penitenciaTotal > 0) {
            msgAviso += "\n💀 PENITENCIA APLICADA: -" + evalProg.penitenciaTotal + " EXP (" + evalProg.seriesFaltantes + " series × -" + evalProg.penitenciaPorSerie + " EXP)";
            if (expPenRes) {
                msgAviso += "\n📉 EXP del Monarca: " + expPenRes.antes + " → " + expPenRes.despues + " / " + (jugAct.expMax || 100) + " (Nivel " + (jugAct.nivel || 1) + ")";
            }
        } else {
            msgAviso += "\n⚙️ Esta rutina tiene la penitencia EXP desactivada (0 EXP deducidos).";
        }

        if (evalProg.faltantesPorEjercicio.length > 0) {
            msgAviso += "\n\n📋 Series faltantes por ejercicio:";
            evalProg.faltantesPorEjercicio.forEach(function(item) {
                var sufS = item.faltantes === 1 ? 'serie faltante' : 'series faltantes';
                var expTag = item.expPenitencia > 0 ? (' (-' + item.expPenitencia + ' EXP)') : '';
                msgAviso += "\n• " + item.nombre + ": " + item.faltantes + " " + sufS + expTag;
            });
        }
    } else {
        msgAviso = "🏆 ¡Sesión completada con éxito!\nHas finalizado '" + rutina.nombre + "'.\n+60 EXP recibidos.\n";
        if (tieneMentales && tieneFisicos) {
            msgAviso += "Se han actualizado tu mapa muscular corporal y tus músculos cognitivos en el sistema.";
        } else if (tieneMentales) {
            msgAviso += "El desarrollo de tus músculos mentales y la fatiga cognitiva del SNC han sido actualizados.";
        } else {
            msgAviso += "La fatiga muscular de tu cuerpo ha sido actualizada en el mapa anatómico.";
        }
    }

    if (recordsSerieCero.length > 0) {
        msgAviso += "\n\n🏆 ¡PROGRESIÓN SERIE 0 REGISTRADA!";
        recordsSerieCero.forEach(function(rc) {
            if (rc.esNuevoRecord) {
                msgAviso += "\n• " + rc.nombre + ": ¡NUEVO RÉCORD HISTÓRICO! Superaste tu marca con " + rc.reps + " reps (anterior: " + rc.anterior + " reps). En tu próxima rutina arrancarás desde " + rc.reps + " reps.";
            } else {
                msgAviso += "\n• " + rc.nombre + ": " + rc.reps + " reps completadas. Guardado para tu próxima sesión (Récord: " + rc.record + " reps).";
            }
        });
    }

    if (sobrecargas.length > 0) {
        msgAviso += "\n\n🚀 ¡SOBRECARGA / RÉCORD REGISTRADO!";
        sobrecargas.forEach(function(sc) {
            if (sc.esTiempo) {
                msgAviso += "\n• " + sc.nombre + ": Récord isométrico superado de " + sc.anterior + "s a " + sc.nuevo + "s (+" + sc.diff + "s extra). Tu nuevo tiempo promedio ha sido actualizado.";
            } else {
                msgAviso += "\n• " + sc.nombre + ": Nuevo récord de base " + sc.nuevo + " " + sc.unidad + " (+" + sc.diff + " " + sc.unidad + " sobre el anterior de " + sc.anterior + " " + sc.unidad + "). En tu próxima sesión, tu 100% de fatiga base se medirá sobre " + sc.nuevo + " " + sc.unidad + ".";
            }
        });
    }

    if (habitosCompletadosAuto > 0) {
        msgAviso += "\n\n⚡ ¡Se ha marcado como completado tu Hábito/Misión diaria vinculada a esta rutina!";
    }

    if (typeof renderizarEjercicios === 'function' && APP_STATE.ejercicios) {
        renderizarEjercicios(APP_STATE.ejercicios);
    }
    if (typeof renderizarGym === 'function') {
        renderizarGym(APP_STATE.gym);
    }

    var destinoFinal = opts.vistaDestino || 'vista-ejercicios';
    RUTINA_ACTIVA = null;
    cambiarVista(destinoFinal, false, { forzarSalidaRutina: true });
    if (destinoFinal === 'vista-ejercicios' && typeof cambiarCategoriaEjercicios === 'function') {
        cambiarCategoriaEjercicios('rutinas');
    }
    if (esIncompleta) {
        mostrarModalResumenFinalizacionRutina(
            evalProg.penitenciaTotal > 0 ? 'PENITENCIA APLICADA · RUTINA INCOMPLETA' : 'SESIÓN PARCIAL REGISTRADA',
            msgAviso,
            { esPenitencia: evalProg.penitenciaTotal > 0 }
        );
    } else {
        mostrarModalResumenFinalizacionRutina('SESIÓN COMPLETADA', msgAviso, { esPenitencia: false });
    }
}

function renderizarGym(registros) {
    var cont = document.getElementById('contenedor-gym');
    if (!cont) return;

    var rList = registros || APP_STATE.gym || [];

    var hoyStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    var hoyIso = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];

    var hechasHoy = [];
    var anteriores = [];

    rList.forEach(function(reg) {
        var esHoy = false;
        if (reg.fecha === hoyStr || reg.fecha === hoyIso) {
            esHoy = true;
        } else if (reg.fecha) {
            var p = hoyStr.split('/');
            if (p.length === 3 && reg.fecha.includes(p[0]) && reg.fecha.includes(p[1])) {
                esHoy = true;
            }
        }
        if (esHoy) {
            hechasHoy.push(reg);
        } else {
            anteriores.push(reg);
        }
    });

    var html = '';

    // 1. BLOQUE DESTACADO: RUTINAS HECHAS HOY
    html += `
    <div style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 14px 16px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">🏆</span>
                <strong style="color: #f8fafc; font-size: 14px;">Rutinas Realizadas Hoy</strong>
            </div>
            <span class="quest-badge-rank" style="background: ${hechasHoy.length > 0 ? '#10b981' : 'rgba(255,255,255,0.08)'}; color: ${hechasHoy.length > 0 ? '#ffffff' : '#94a3b8'}; font-weight: 800;">
                ${hechasHoy.length} ${hechasHoy.length === 1 ? 'Sesión' : 'Sesiones'}
            </span>
        </div>`;

    if (hechasHoy.length > 0) {
        html += '<div style="display: flex; flex-direction: column; gap: 8px;">';
        hechasHoy.forEach(function(reg) {
            var esIncomp = !!(reg.esIncompleta || (reg.detalle && reg.detalle.includes('INCOMPLETA')));
            var esMen = reg.detalle && reg.detalle.includes('[MENTAL]');
            var esHib = reg.detalle && reg.detalle.includes('[HÍBRIDA]');
            var badgeBg = esIncomp ? 'rgba(239, 68, 68, 0.2)' : (esMen ? 'rgba(37, 99, 235, 0.2)' : (esHib ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'));
            var badgeColor = esIncomp ? '#fca5a5' : (esMen ? '#93c5fd' : (esHib ? '#fcd34d' : '#6ee7b7'));
            var badgeBorder = esIncomp ? 'rgba(239, 68, 68, 0.45)' : (esMen ? 'rgba(59, 130, 246, 0.4)' : (esHib ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'));
            var cardBorder = esIncomp ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)';
            var pctTag = (esIncomp && typeof reg.porcentajeCompletado === 'number') ? (' ' + reg.porcentajeCompletado + '%') : '';
            var badgeLabel = esIncomp
                ? ('💀 INCOMPLETA' + pctTag + (reg.penitenciaExp > 0 ? (' · -' + reg.penitenciaExp + ' EXP') : ''))
                : '✓ HECHA HOY';
            var motivoHtml = reg.motivoIncompleta
                ? '<div class="gym-log-motivo-box"><strong>📝 Motivo:</strong> ' + escaparHtmlRutina(reg.motivoIncompleta) + '</div>'
                : '';

            html += `
            <div style="background: #0b0e15; border: 1px solid ${cardBorder}; border-radius: 10px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px;">${esIncomp ? '💀' : (esMen ? '🧠' : (esHib ? '⚡' : '🏋️'))}</span>
                        <span style="font-weight: 700; color: #f8fafc; font-size: 13.5px;">${reg.detalle}</span>
                    </div>
                    <span style="font-size: 11px; font-weight: 700; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; padding: 3px 8px; border-radius: 9999px;">
                        ${badgeLabel}
                    </span>
                </div>
                ${motivoHtml}
            </div>`;
        });
        html += '</div>';
    } else {
        html += `
        <p style="color: #94a3b8; font-size: 12.5px; margin: 4px 0 0 0;">
            Aún no has completado ninguna rutina hoy. ¡Ve al apartado de <strong>"Sesiones &amp; Rutinas"</strong> o <strong>"Rutina Aleatoria"</strong> para iniciar tu entrenamiento!
        </p>`;
    }
    html += '</div>';

    // 2. BLOQUE: HISTORIAL DE DÍAS ANTERIORES
    html += `
    <div style="margin-top: 10px;">
        <h4 style="margin: 0 0 10px 0; color: #cbd5e1; font-size: 13.5px; font-weight: 700;">Historial de Sesiones Anteriores:</h4>`;

    if (anteriores.length > 0) {
        anteriores.forEach(function(reg) {
            var esIncompAnt = !!(reg.esIncompleta || (reg.detalle && reg.detalle.includes('INCOMPLETA')));
            var antBorder = esIncompAnt ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)';
            var motivoAntHtml = reg.motivoIncompleta
                ? '<div class="gym-log-motivo-box"><strong>📝 Motivo:</strong> ' + escaparHtmlRutina(reg.motivoIncompleta) + '</div>'
                : '';
            html += `
            <div style="background: #0b0e15; border: 1px solid ${antBorder}; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span style="font-weight: 600; color: ${esIncompAnt ? '#fecaca' : '#f8fafc'}; font-size: 13px;">${reg.detalle}</span>
                    <span style="color: #64748b; font-size: 11.5px; white-space: nowrap;">${reg.fecha}</span>
                </div>
                ${motivoAntHtml}
            </div>`;
        });
    } else if (hechasHoy.length === 0) {
        html += '<p style="color: #94a3b8; text-align: center; padding: 15px;">No hay entrenamientos registrados aún.</p>';
    } else {
        html += '<p style="color: #64748b; font-size: 12px; font-style: italic;">No hay registros de sesiones anteriores.</p>';
    }
    html += '</div>';

    cont.innerHTML = html;
}


// --- MÓDULO DE MENTE Y SUEÑO ---

function cargarMente() {
    if (typeof renderizarBarraFatigaMentalDiaria === 'function') renderizarBarraFatigaMentalDiaria();
    if (typeof renderizarGimnasioMental === 'function') renderizarGimnasioMental();
    renderizarMente(APP_STATE.salud);
    renderizarDesgloseMenteCognitiva();
}

function renderizarMente(registros) {
    var cont = document.getElementById('contenedor-mente');
    if (!cont) return;
    var html = '';
    var list = registros || APP_STATE.salud || [];
    if (list && list.length > 0) {
        list.forEach(function(r) {
            html += `<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;color:#111827;font-size:13.5px;">${r.valor}</span>
                <span style="color:#6b7280;font-size:12px;">${r.fecha}</span>
            </div>`;
        });
    } else {
        html = '<p style="color:#6b7280;text-align:center;padding:15px;">No hay registros de descanso mental.</p>';
    }
    cont.innerHTML = html;
}

function guardarMente() {
    var inM = document.getElementById('input-nueva-mente');
    var val = inM ? inM.value.trim() : "";
    if (!val) { alert("Ingresa tu registro de descanso mental o horas de sueño."); return; }
    if (!APP_STATE.salud) APP_STATE.salud = [];
    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    APP_STATE.salud.unshift({ fecha: fechaHoy, valor: val });
    if (APP_STATE.fatiga) {
        APP_STATE.fatiga.mente = Math.max(0, (APP_STATE.fatiga.mente || 0) - 30);
    }
    if (inM) inM.value = "";
    sumarExp(20);
    MonarcaDB.save(APP_STATE);
    renderizarMente(APP_STATE.salud);
    renderizarDesgloseMenteCognitiva();
    alert("🧠 Registro de descanso guardado (+20 EXP). Fatiga mental aliviada.");
}


// (Modelos y renderizadores de Cuerpo y Mente definidos arriba)

function inicializarChipsAtributosMentales() {
    var cont = document.getElementById('contenedor-chips-atributos-mentales');
    if (!cont) return;

    var html = '';
    DESGLOSE_COGNITIVO_MENTE.forEach(function(area) {
        var buttons = area.atributos.map(function(attr) {
            var sel = ATRIBUTOS_MENTALES_SELECCIONADOS.indexOf(attr.clave) !== -1 ? 'selected' : '';
            return `<button type="button" class="chip-mente-btn ${sel}" data-clave="${attr.clave}" data-nombre="${attr.nombre}" onclick="toggleChipAtributoMental(this, '${attr.clave}')">
                <span class="chip-check">${sel ? '✓' : '+'}</span>
                <span>${attr.nombre}</span>
            </button>`;
        }).join('');

        html += `
        <div class="chip-area-group">
            <div class="chip-area-label">${area.icono} ${area.area}</div>
            <div class="chip-group-buttons">
                ${buttons}
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function abrirModalNuevoEjercicioMental() {
    var modal = document.getElementById('modal-nuevo-ejercicio-mental');
    if (!modal) return;

    var inTit = document.getElementById('input-em-titulo');
    var inDesc = document.getElementById('input-em-desc');
    if (inTit) inTit.value = '';
    if (inDesc) inDesc.value = '';

    BOOST_MENTAL_ACTUAL = 15;
    var display = document.getElementById('em-boost-display');
    if (display) display.innerText = '+15%';

    var btns = document.querySelectorAll('.btn-em-boost');
    btns.forEach(function(b) {
        b.classList.remove('active');
        if (b.innerText.indexOf('15%') !== -1) b.classList.add('active');
    });

    ATRIBUTOS_MENTALES_SELECCIONADOS = [];
    inicializarChipsAtributosMentales();

    modal.style.display = 'flex';
}

function cerrarModalNuevoEjercicioMental() {
    var modal = document.getElementById('modal-nuevo-ejercicio-mental');
    if (modal) modal.style.display = 'none';
}

function seleccionarBoostMental(val, btn) {
    BOOST_MENTAL_ACTUAL = Number(val) || 15;
    var display = document.getElementById('em-boost-display');
    if (display) display.innerText = '+' + BOOST_MENTAL_ACTUAL + '%';

    var btns = document.querySelectorAll('.btn-em-boost');
    btns.forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
}

function toggleChipAtributoMental(btn, clave) {
    var idx = ATRIBUTOS_MENTALES_SELECCIONADOS.indexOf(clave);
    if (idx === -1) {
        ATRIBUTOS_MENTALES_SELECCIONADOS.push(clave);
        btn.classList.add('selected');
        var chk = btn.querySelector('.chip-check');
        if (chk) chk.innerText = '✓';
    } else {
        ATRIBUTOS_MENTALES_SELECCIONADOS.splice(idx, 1);
        btn.classList.remove('selected');
        var chk = btn.querySelector('.chip-check');
        if (chk) chk.innerText = '+';
    }
}

function confirmarAgregarEjercicioMental() {
    var inTit = document.getElementById('input-em-titulo');
    var inDesc = document.getElementById('input-em-desc');
    var titulo = inTit ? inTit.value.trim() : '';
    var desc = inDesc ? inDesc.value.trim() : '';

    if (!titulo) {
        alert("Por favor ingresa el título o actividad mental realizada.");
        if (inTit) inTit.focus();
        return;
    }

    if (ATRIBUTOS_MENTALES_SELECCIONADOS.length === 0) {
        alert("Por favor selecciona al menos un atributo mental que suba de nivel.");
        return;
    }

    if (!APP_STATE.menteAtributos) {
        APP_STATE.menteAtributos = JSON.parse(JSON.stringify(DEFAULT_STATE.menteAtributos));
    }
    if (!APP_STATE.ejerciciosMentales) {
        APP_STATE.ejerciciosMentales = [];
    }

    // Obtener nombres para el historial
    var nombresAfectados = [];
    ATRIBUTOS_MENTALES_SELECCIONADOS.forEach(function(clave) {
        var anterior = Number(APP_STATE.menteAtributos[clave]) || 0;
        APP_STATE.menteAtributos[clave] = Math.min(100, anterior + BOOST_MENTAL_ACTUAL);

        // Buscar nombre amigable
        DESGLOSE_COGNITIVO_MENTE.forEach(function(area) {
            area.atributos.forEach(function(at) {
                if (at.clave === clave) nombresAfectados.push(at.nombre);
            });
        });
    });

    // Aliviar fatiga mental si existe
    if (APP_STATE.fatiga) {
        APP_STATE.fatiga.mente = Math.max(0, (APP_STATE.fatiga.mente || 0) - 15);
    }

    // Fecha actual
    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    APP_STATE.ejerciciosMentales.unshift({
        id: "EM-" + Date.now(),
        fecha: fechaHoy,
        titulo: titulo,
        descripcion: desc,
        atributosAfectados: nombresAfectados,
        incremento: BOOST_MENTAL_ACTUAL
    });

    sumarExp(40);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevoEjercicioMental();
    renderizarDesgloseMenteCognitiva();
    renderizarBarrasFatiga(APP_STATE.fatiga);

    alert("🧠 ¡Entrenamiento mental registrado con éxito!\nHas potenciado " + nombresAfectados.length + " atributos con +" + BOOST_MENTAL_ACTUAL + "% cada uno.\n+40 EXP recibidos.");
}

function eliminarEjercicioMental(id) {
    if (!confirm("¿Deseas eliminar este registro de entrenamiento mental del historial?")) return;
    if (!APP_STATE.ejerciciosMentales) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('ejerciciosMentales', id);
    }
    APP_STATE.ejerciciosMentales = APP_STATE.ejerciciosMentales.filter(function(e) {
        return e.id !== id;
    });
    MonarcaDB.save(APP_STATE);
    renderizarDesgloseMenteCognitiva();
}

// ==========================================================================
// 🧠 ENTRENAMIENTO CEREBRAL, FATIGA MENTAL DIARIA Y MÚSCULOS DE LA MENTE
// Entrena la mente como un músculo: Creatividad, Descanso, Anulación, Percepción, Inteligencia
// ==========================================================================

function renderizarBarraFatigaMentalDiaria() {
    var cont1 = document.getElementById('contenedor-fatiga-mental-diaria-estado');
    var cont2 = document.getElementById('contenedor-fatiga-mental-diaria-mente');
    if (!cont1 && !cont2) return;

    if (!APP_STATE.fatigaMentalDiaria) {
        APP_STATE.fatigaMentalDiaria = JSON.parse(JSON.stringify(DEFAULT_STATE.fatigaMentalDiaria || {}));
    }
    var fm = APP_STATE.fatigaMentalDiaria;
    var nivel = Math.min(100, Math.max(0, Number(fm.nivel) || 0));

    var estadoTexto = "Mente Despejada";
    var colorBarra = "#111827";
    var recomendacion = "Nivel óptimo para trabajo cognitivo de alta intensidad.";

    if (nivel <= 25) {
        estadoTexto = "Mente Despejada (Óptima)";
        recomendacion = "Capacidad analítica plena. Excelente momento para Deep Work o estudio complejo.";
    } else if (nivel <= 55) {
        estadoTexto = "Carga Cognitiva Moderada";
        recomendacion = "Buen rendimiento general. Mantén pausas breves de 5 minutos entre tareas.";
    } else if (nivel <= 80) {
        estadoTexto = "Fatiga Mental Elevada";
        colorBarra = "#374151";
        recomendacion = "Saturación de memoria de trabajo. Evita sobrecarga de pantallas y programa descanso.";
    } else {
        estadoTexto = "Saturación Neural Crítica";
        colorBarra = "#111827";
        recomendacion = "Agotamiento cognitivo. Se recomienda descompresión neural o descanso profundo.";
    }

    var baseHtml = `
    <div class="card" style="margin-bottom: 20px; border-left: 4px solid #111827;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🧠</span>
                <div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #f8fafc;">Barra de Fatiga Mental Diaria</h3>
                    <span style="font-size: 12px; color: #6b7280;">Saturación cognitiva acumulada en el Sistema Nervioso Central (SNC)</span>
                </div>
            </div>
            <div style="text-align: right;">
                <span class="item-badge-pill" style="font-size: 13px; font-weight: 800; background: #111827; color: #ffffff;">${nivel}% Fatiga</span>
                <div style="font-size: 11px; color: #6b7280; margin-top: 3px;">${estadoTexto}</div>
            </div>
        </div>

        <div class="attr-progress-track" style="height: 10px; margin-bottom: 10px; background: #e5e7eb;">
            <div class="attr-progress-fill" style="width: ${nivel}%; background: ${colorBarra};"></div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #94a3b8;">
            <span>ℹ️ ${recomendacion}</span>
            <span style="font-size: 11px; color: #9ca3af;">Actualizado: ${fm.ultimoDia || 'Hoy'}</span>
        </div>`;

    var htmlPasivo = baseHtml + `</div>`;

    var htmlActivo = baseHtml + `
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; border-top: 1px solid #f3f4f6; padding-top: 12px; margin-top: 12px;">
            <button class="btn-sheet-action" onclick="aliviarFatigaMental(20)" title="Pausa breve y respiración para aliviar saturación">
                🧘 Descompresión Rápida (-20%)
            </button>
            <button class="btn-sheet-action" onclick="ejecutarRecuperacionNocturna()" title="Simular descanso reparador nocturno">
                🌙 Cierre Diario / Sueño (-50%)
            </button>
        </div>
    </div>`;

    if (cont1) cont1.innerHTML = htmlPasivo;
    if (cont2) cont2.innerHTML = htmlActivo;
}

function aliviarFatigaMental(cantidad) {
    if (!APP_STATE.fatigaMentalDiaria) return;
    var nivelAnterior = APP_STATE.fatigaMentalDiaria.nivel || 0;
    APP_STATE.fatigaMentalDiaria.nivel = Math.max(0, nivelAnterior - cantidad);
    APP_STATE.fatigaMentalDiaria.estado = APP_STATE.fatigaMentalDiaria.nivel <= 25 ? "Mente Despejada" : "Carga Moderada";
    
    if (APP_STATE.musculosMentales && APP_STATE.musculosMentales.descanso) {
        sumarExpMusculoMental("descanso", 15);
    }
    
    MonarcaDB.save(APP_STATE);
    renderizarBarraFatigaMentalDiaria();
    if (typeof renderizarGimnasioMental === 'function') renderizarGimnasioMental();
    alert("🧘 Descompresión completada. Fatiga mental reducida en -" + cantidad + "% y +15 EXP para Músculo de Descanso.");
}

function ejecutarRecuperacionNocturna() {
    if (!confirm("¿Deseas registrar la recuperación neural nocturna? Se reducirá la fatiga mental a la mitad simulando horas de sueño reparador.")) return;
    if (!APP_STATE.fatigaMentalDiaria) return;

    var anterior = APP_STATE.fatigaMentalDiaria.nivel || 0;
    var nuevo = Math.max(10, Math.round(anterior * 0.45));
    APP_STATE.fatigaMentalDiaria.nivel = nuevo;
    APP_STATE.fatigaMentalDiaria.ultimoDia = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : (function() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    })();
    APP_STATE.fatigaMentalDiaria.estado = nuevo <= 25 ? "Mente Despejada" : "Carga Moderada";

    if (APP_STATE.musculosMentales && APP_STATE.musculosMentales.descanso) {
        sumarExpMusculoMental("descanso", 30);
    }
    sumarExp(25);
    MonarcaDB.save(APP_STATE);
    renderizarBarraFatigaMentalDiaria();
    if (typeof renderizarGimnasioMental === 'function') renderizarGimnasioMental();
    alert("🌙 ¡Recuperación neural exitosa! Fatiga bajó de " + anterior + "% a " + nuevo + "%. (+25 EXP jugador y +30 EXP Descanso).");
}

function renderizarGimnasioMental() {
    renderizarMusculosMentales();
    renderizarBancoEjerciciosCerebrales();
}

function renderizarMusculosMentales() {
    var cont = document.getElementById('contenedor-musculos-mentales');
    if (!cont) return;

    if (!APP_STATE.musculosMentales) {
        APP_STATE.musculosMentales = JSON.parse(JSON.stringify(DEFAULT_STATE.musculosMentales));
    } else {
        // Garantizar que cualquier músculo mental nuevo en DEFAULT_STATE se incorpore sin sobreescribir niveles
        Object.keys(DEFAULT_STATE.musculosMentales).forEach(function(k) {
            if (!APP_STATE.musculosMentales[k]) {
                APP_STATE.musculosMentales[k] = JSON.parse(JSON.stringify(DEFAULT_STATE.musculosMentales[k]));
            }
        });
    }
    var mm = APP_STATE.musculosMentales;

    var html = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 24px;">`;

    Object.keys(mm).forEach(function(clave) {
        var m = mm[clave];
        var nivel = m.nivel || 1;
        var exp = m.exp || 0;
        var expMax = nivel * 100;
        var pct = Math.min(100, Math.round((exp / expMax) * 100));

        html += `
        <div class="mental-muscle-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 22px;">${m.icono}</span>
                    <strong style="font-size: 14px; color: #f8fafc;">${m.nombre}</strong>
                </div>
                <span class="item-badge-pill" style="font-weight: 800; background: #111827; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.1);">Nv. ${nivel}</span>
            </div>
            <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #94a3b8; line-height: 1.4;">${m.descripcion}</p>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; font-weight: 700; margin-bottom: 3px;">
                <span>EXP</span>
                <span>${exp} / ${expMax} (${pct}%)</span>
            </div>
            <div class="attr-progress-track" style="height: 6px;">
                <div class="attr-progress-fill" style="width: ${pct}%;"></div>
            </div>
        </div>`;
    });

    html += `</div>`;
    cont.innerHTML = html;
}

function sumarExpMusculoMental(clave, cantidad) {
    if (!APP_STATE.musculosMentales) {
        APP_STATE.musculosMentales = JSON.parse(JSON.stringify(DEFAULT_STATE.musculosMentales));
    }
    if (!APP_STATE.musculosMentales[clave]) {
        if (DEFAULT_STATE.musculosMentales && DEFAULT_STATE.musculosMentales[clave]) {
            APP_STATE.musculosMentales[clave] = JSON.parse(JSON.stringify(DEFAULT_STATE.musculosMentales[clave]));
        } else {
            return;
        }
    }
    var m = APP_STATE.musculosMentales[clave];
    m.exp = (m.exp || 0) + cantidad;
    var expMax = (m.nivel || 1) * 100;
    while (m.exp >= expMax) {
        m.exp -= expMax;
        m.nivel = (m.nivel || 1) + 1;
        expMax = m.nivel * 100;
        alert("✨ ¡SUBIÓ DE NIVEL LA FACULTAD COGNITIVA! " + (m.icono || '🧠') + " " + m.nombre + " ha alcanzado el Nivel " + m.nivel + "!");
    }
}

var SUBFILTRO_MENTAL_ACTIVO = 'todas';
var CHIPS_SELECCIONADOS_MUSCULOS_MENTALES = [];

function filtrarSubcategoriaMental(subfiltro) {
    SUBFILTRO_MENTAL_ACTIVO = subfiltro || 'todas';
    var btns = document.querySelectorAll('#seccion-categoria-banco-mental .btn-subfiltro-ej');
    btns.forEach(function(b) {
        if (b.getAttribute('data-subfiltro') === SUBFILTRO_MENTAL_ACTIVO) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    renderizarBancoEjerciciosCerebrales();
}

var CATALOGO_ZONAS_MENTALES = [
    { clave: "enfoque", nombre: "Enfoque & Concentración (Deep Work)", icono: "🎯", defaultPct: 40 },
    { clave: "inteligencia", nombre: "Lógica & Razonamiento Analítico", icono: "⚡", defaultPct: 35 },
    { clave: "memoria", nombre: "Memoria & Retención Mnemotécnica", icono: "🧠", defaultPct: 30 },
    { clave: "creatividad", nombre: "Creatividad & Pensamiento Lateral", icono: "🎨", defaultPct: 30 },
    { clave: "disciplina", nombre: "Disciplina & Fuerza de Voluntad", icono: "🛡️", defaultPct: 30 },
    { clave: "velocidad", nombre: "Velocidad & Reflejos Mentales", icono: "🚀", defaultPct: 25 },
    { clave: "calma", nombre: "Calma & Regulación Neural", icono: "🌊", defaultPct: 25 },
    { clave: "estrategia", nombre: "Estrategia & Prospectiva", icono: "♟️", defaultPct: 30 },
    { clave: "descanso", nombre: "Descanso & Regeneración Neural", icono: "💤", defaultPct: 20 },
    { clave: "anulacion", nombre: "Anulación de Gratificación / Impulsos", icono: "🛑", defaultPct: 25 }
];

var ZONAS_EJERCICIO_MENTAL_TEMP = [];

function poblarSelectZonasMentales() {
    var sel = document.getElementById('select-zona-ejercicio-mental');
    if (!sel) return;
    var html = '<option value="">-- Seleccionar facultad cognitiva para añadir --</option>';
    CATALOGO_ZONAS_MENTALES.forEach(function(item) {
        html += `<option value="${item.clave}">${item.icono} ${item.nombre}</option>`;
    });
    sel.innerHTML = html;
    sel.value = "";
}

function renderizarFilasZonasMentales() {
    var cont = document.getElementById('lista-zonas-ejercicio-mental');
    if (!cont) return;

    if (!ZONAS_EJERCICIO_MENTAL_TEMP || ZONAS_EJERCICIO_MENTAL_TEMP.length === 0) {
        cont.innerHTML = `
            <div style="font-size: 12px; color: #9ca3af; padding: 6px 4px; font-style: italic;">
                Ninguna facultad cognitiva seleccionada. Elige una abajo y pulsa + Añadir para asociarla.
            </div>`;
        return;
    }

    var html = '';
    ZONAS_EJERCICIO_MENTAL_TEMP.forEach(function(item) {
        html += `
        <div class="fila-atributo-item">
            <div class="fila-atributo-info">
                <span>${item.icono || '🧠'}</span>
                <span>${item.nombre || item.clave}</span>
                <span class="fila-atributo-tipo-badge tipo-badge-mente">Mente</span>
            </div>
            <div class="fila-atributo-pct-box">
                <input type="number" class="input-atributo-pct" min="1" max="100" value="${item.porcentaje || 25}" onchange="actualizarPorcentajeZonaMental('${item.clave}', this.value)" title="Porcentaje de desarrollo / impacto">
                <span style="font-size: 12px; font-weight: 800; color: #94a3b8;">%</span>
                <button type="button" class="btn-quitar-atributo" onclick="quitarZonaMentalModal('${item.clave}')" title="Quitar facultad">✕</button>
            </div>
        </div>`;
    });
    cont.innerHTML = html;
}

function agregarZonaMentalDesdeSelect(clave) {
    if (!clave) return;
    var facInfo = CATALOGO_ZONAS_MENTALES.find(function(f) { return f.clave === clave; });
    if (!facInfo) return;

    if (!ZONAS_EJERCICIO_MENTAL_TEMP) ZONAS_EJERCICIO_MENTAL_TEMP = [];
    var yaExiste = ZONAS_EJERCICIO_MENTAL_TEMP.some(function(f) { return f.clave === clave; });
    if (yaExiste) {
        alert("La facultad '" + (facInfo.nombre || clave) + "' ya está en la lista.");
        var sel = document.getElementById('select-zona-ejercicio-mental');
        if (sel) sel.value = "";
        return;
    }

    ZONAS_EJERCICIO_MENTAL_TEMP.push({
        clave: facInfo.clave,
        nombre: facInfo.nombre,
        icono: facInfo.icono,
        porcentaje: facInfo.defaultPct || 25
    });

    renderizarFilasZonasMentales();
    var selElem = document.getElementById('select-zona-ejercicio-mental');
    if (selElem) selElem.value = "";
}

function agregarZonaMentalDesdeBoton() {
    var sel = document.getElementById('select-zona-ejercicio-mental');
    if (sel && sel.value) {
        agregarZonaMentalDesdeSelect(sel.value);
    } else {
        alert("Por favor selecciona una facultad cognitiva de la lista antes de pulsar + Añadir.");
    }
}

function actualizarPorcentajeZonaMental(clave, valor) {
    var v = parseInt(valor, 10);
    if (isNaN(v) || v <= 0) v = 5;
    if (v > 100) v = 100;
    var item = ZONAS_EJERCICIO_MENTAL_TEMP.find(function(f) { return f.clave === clave; });
    if (item) item.porcentaje = v;
}

function quitarZonaMentalModal(clave) {
    ZONAS_EJERCICIO_MENTAL_TEMP = ZONAS_EJERCICIO_MENTAL_TEMP.filter(function(f) { return f.clave !== clave; });
    renderizarFilasZonasMentales();
}

var PROTOCOLOS_MENTALES_RECOMENDADOS = [
    {
        id: "EC-REC-1",
        nombre: "Deep Work & Foco Monotarea",
        musculoPrincipal: "enfoque",
        musculoSecundario: "disciplina",
        musculosSecundarios: ["disciplina"],
        duracionMinutos: 45,
        descripcion: "Inmersión cognitiva profunda en una sola tarea crítica sin distracciones, notificaciones ni interrupciones.",
        protocolo: "1. Eliminar pantallas secundarias y silenciar móviles.\n2. Definir un objetivo único y medible para el bloque.\n3. Ejecutar foco sostenido durante 45 minutos continuos.\n4. Registrar entregable o avance técnico al sonar la alarma.",
        fatigaEstimada: 20,
        expRecompensa: 40
    },
    {
        id: "EC-REC-2",
        nombre: "Primeros Principios & Desglose Lógico",
        musculoPrincipal: "inteligencia",
        musculoSecundario: "estrategia",
        musculosSecundarios: ["estrategia"],
        duracionMinutos: 30,
        descripcion: "Desarticular un problema complejo hasta sus verdades fundamentales más básicas y reconstruir la solución desde cero.",
        protocolo: "1. Escribir la premisa del problema en papel.\n2. Cuestionar cada supuesto: ¿Es un hecho biológico/físico o una convención?\n3. Desprenderse de analogías y crear la solución desde los axiomas base.",
        fatigaEstimada: 25,
        expRecompensa: 45
    },
    {
        id: "EC-REC-3",
        nombre: "Palacio de la Memoria & Active Recall",
        musculoPrincipal: "memoria",
        musculoSecundario: "enfoque",
        musculosSecundarios: ["enfoque"],
        duracionMinutos: 20,
        descripcion: "Entrenamiento mnemotécnico espacial y evocación activa de conceptos sin recurrir a notas.",
        protocolo: "1. Visualizar una ruta espacial conocida (tu casa o vecindario).\n2. Anclar 5-10 conceptos clave a hitos visuales vívidos y exagerados.\n3. Recorrer la ruta mentalmente en reversa y recitar los conceptos.",
        fatigaEstimada: 15,
        expRecompensa: 35
    },
    {
        id: "EC-REC-4",
        nombre: "Lluvia Divergente & Conexiones Laterales",
        musculoPrincipal: "creatividad",
        musculoSecundario: "velocidad",
        musculosSecundarios: ["velocidad"],
        duracionMinutos: 25,
        descripcion: "Generación acelerada de ideas no convencionales cruzando dos industrias o conceptos aparentemente opuestos.",
        protocolo: "1. Elegir dos conceptos al azar (ej: Biología marina + Finanzas).\n2. Cronometrar 10 minutos y forzar al menos 15 ideas o analogías híbridas.\n3. Seleccionar las 2 más viables e iterar un prototipo conceptual.",
        fatigaEstimada: 15,
        expRecompensa: 35
    },
    {
        id: "EC-REC-5",
        nombre: "Veto de Impulsos & Resistencia a Gratificación",
        musculoPrincipal: "disciplina",
        musculoSecundario: "anulacion",
        musculosSecundarios: ["anulacion"],
        duracionMinutos: 15,
        descripcion: "Entrenamiento de corteza prefrontal: identificar y vetar impulsos reactivos de procrastinación o dopamina barata.",
        protocolo: "1. Cada vez que sientas el impulso de abrir redes, comer por ansiedad o posponer, aplica la regla de los 10 minutos.\n2. Respira profundamente y observa la urgencia sin actuar sobre ella.\n3. Registra la victoria cognitiva en tu bitácora.",
        fatigaEstimada: 10,
        expRecompensa: 30
    },
    {
        id: "EC-REC-6",
        nombre: "Cálculo Aritmético Veloz & Agilidad Mental",
        musculoPrincipal: "velocidad",
        musculoSecundario: "inteligencia",
        musculosSecundarios: ["inteligencia"],
        duracionMinutos: 15,
        descripcion: "Sprint de operaciones matemáticas mentales y toma de decisiones a alta velocidad bajo presión controlada.",
        protocolo: "1. Resolver 20 operaciones matemáticas consecutivas de 2 dígitos sin papel ni calculadora.\n2. Medir tiempo total y penalizar errores.\n3. Intentar batir el récord personal cada sesión.",
        fatigaEstimada: 15,
        expRecompensa: 30
    },
    {
        id: "EC-REC-7",
        nombre: "Meditación Vipassana & Regulación Neural",
        musculoPrincipal: "calma",
        musculoSecundario: "descanso",
        musculosSecundarios: ["descanso"],
        duracionMinutos: 20,
        descripcion: "Desactivación del sistema nervioso simpático, observación no reactiva y recuperación activa de la fatiga mental.",
        protocolo: "1. Postura erguida, ojos cerrados o mirada suave al suelo.\n2. Ciclo de respiración en caja: 4s inhalar, 4s sostener, 4s exhalar, 4s pausa.\n3. Observar sensaciones corporales sin juzgar ni engancharse con pensamientos.",
        fatigaEstimada: -25,
        expRecompensa: 30
    },
    {
        id: "EC-REC-8",
        nombre: "Simulación de Escenarios & Estrategia",
        musculoPrincipal: "estrategia",
        musculoSecundario: "inteligencia",
        musculosSecundarios: ["inteligencia"],
        duracionMinutos: 30,
        descripcion: "Modelado prospectivo de decisiones críticas calculando ramificaciones a segundo y tercer orden.",
        protocolo: "1. Plantear una decisión compleja: 'Si tomo el camino A, ¿qué pasa a 1 mes, 6 meses y 2 años?'.\n2. Realizar un pre-mortem: 'Imaginemos que este proyecto fracasó estrepitosamente. ¿Qué lo causó?'.\n3. Diseñar salvaguardas y planes de contingencia anticipados.",
        fatigaEstimada: 20,
        expRecompensa: 40
    }
];

function importarProtocolosMentalesRecomendados() {
    if (!APP_STATE.ejerciciosCerebrales) APP_STATE.ejerciciosCerebrales = [];
    var agregados = 0;
    PROTOCOLOS_MENTALES_RECOMENDADOS.forEach(function(rec) {
        var yaExiste = APP_STATE.ejerciciosCerebrales.some(function(e) {
            return (e.nombre && e.nombre.toLowerCase().trim() === rec.nombre.toLowerCase().trim()) || e.id === rec.id;
        });
        if (!yaExiste) {
            APP_STATE.ejerciciosCerebrales.push(JSON.parse(JSON.stringify(rec)));
            agregados++;
        }
    });

    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
        MonarcaDB.save(APP_STATE);
    }
    renderizarBancoEjerciciosCerebrales();
    alert("🧠 " + (agregados > 0 ? "Se han importado " + agregados + " protocolos cognitivos recomendados a tu Arsenal Mental." : "Todos los protocolos recomendados ya estaban en tu Arsenal Mental."));
}

function generarCardEjercicioCerebralHtml(ec) {
    var fatigaLabel = ec.fatigaEstimada > 0 ? `+${ec.fatigaEstimada}% Fatiga` : `${ec.fatigaEstimada}% Alivio`;
    var fatigaBg = ec.fatigaEstimada > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";
    var fatigaBorder = ec.fatigaEstimada > 0 ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)";
    var fatigaColor = ec.fatigaEstimada > 0 ? "#fca5a5" : "#6ee7b7";

    var mm = APP_STATE.musculosMentales || (DEFAULT_STATE && DEFAULT_STATE.musculosMentales) || {};

    var badgesFacultadesHtml = '';
    if (ec.facultades && Array.isArray(ec.facultades) && ec.facultades.length > 0) {
        badgesFacultadesHtml = ec.facultades.map(function(f, idx) {
            var fClave = f.clave || f.facultad;
            var mInfo = mm[fClave] || { icono: f.icono || '🧠', nombre: f.nombre || fClave };
            var fPct = f.porcentaje || 25;
            if (idx === 0) {
                return `<span style="display:inline-flex; align-items:center; gap:4px; background:rgba(192, 132, 252, 0.15); color:#e9d5ff; border:1px solid rgba(192, 132, 252, 0.3); padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:700;">${mInfo.icono} ${mInfo.nombre} ${fPct}%</span>`;
            } else {
                return `<span style="display:inline-flex; align-items:center; gap:4px; background:rgba(56, 189, 248, 0.1); color:#38bdf8; border:1px solid rgba(56, 189, 248, 0.25); padding:2px 7px; border-radius:9999px; font-size:10.5px; font-weight:600;">${mInfo.icono} ${mInfo.nombre} ${fPct}%</span>`;
            }
        }).join(' ');
    } else {
        var pInfo = mm[ec.musculoPrincipal] || { icono: '🧠', nombre: ec.musculoPrincipal };
        var muscP = `<span style="display:inline-flex; align-items:center; gap:4px; background:rgba(192, 132, 252, 0.15); color:#e9d5ff; border:1px solid rgba(192, 132, 252, 0.3); padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:700;">${pInfo.icono} ${pInfo.nombre}</span>`;

        var secList = ec.musculosSecundarios || (ec.musculoSecundario ? [ec.musculoSecundario] : []);
        var muscSecHtml = secList.map(function(sClave) {
            var sInfo = mm[sClave] || { icono: '⚡', nombre: sClave };
            return `<span style="display:inline-flex; align-items:center; gap:4px; background:rgba(56, 189, 248, 0.1); color:#38bdf8; border:1px solid rgba(56, 189, 248, 0.25); padding:2px 7px; border-radius:9999px; font-size:10.5px; font-weight:600;">${sInfo.icono} ${sInfo.nombre}</span>`;
        }).join(' ');
        badgesFacultadesHtml = muscP + (muscSecHtml ? ' ' + muscSecHtml : '');
    }

    return `
    <div class="cerebral-exercise-card">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
            <div>
                <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 800; color: #f8fafc;">${ec.nombre}</h4>
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <span style="font-size: 11.5px; color: #94a3b8; font-weight: 600;">⏱️ ${ec.duracionMinutos || 25} min</span>
                    ${badgesFacultadesHtml}
                </div>
            </div>
            <button onclick="eliminarEjercicioCerebral('${ec.id}')" title="Eliminar protocolo" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px 6px; font-size: 14px;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#9ca3af'">🗑️</button>
        </div>

        <p style="margin: 0 0 10px 0; font-size: 12.5px; color: #94a3b8; line-height: 1.45;">${ec.descripcion || 'Entrenamiento cognitivo estructurado.'}</p>

        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px; margin-bottom: 12px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #c084fc; margin-bottom: 4px;">📜 Protocolo de Ejecución:</div>
            <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.5; white-space: pre-line;">${ec.protocolo || '1. Concentración plena. 2. Ejecutar bloque de foco. 3. Documentar resultados.'}</div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 10px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 11px; font-weight: 700; background: ${fatigaBg}; color: ${fatigaColor}; border: 1px solid ${fatigaBorder}; padding: 3px 8px; border-radius: 6px;">${fatigaLabel}</span>
                <span style="font-size: 11px; font-weight: 700; background: rgba(168, 85, 247, 0.15); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.3); padding: 3px 8px; border-radius: 6px;">+${ec.expRecompensa || 30} EXP</span>
            </div>
            <button class="btn-subfiltro-ej active" style="padding: 6px 14px; font-size: 12px;" onclick="ejecutarEjercicioCerebral('${ec.id}')">
                ⚡ Ejecutar Protocolo
            </button>
        </div>
    </div>`;
}

function renderizarBancoEjerciciosCerebrales() {
    var cont = document.getElementById('contenedor-ejercicios-cerebrales');
    if (!cont) return;

    if (!APP_STATE.ejerciciosCerebrales || !Array.isArray(APP_STATE.ejerciciosCerebrales)) {
        APP_STATE.ejerciciosCerebrales = JSON.parse(JSON.stringify(DEFAULT_STATE.ejerciciosCerebrales || []));
    }
    var list = APP_STATE.ejerciciosCerebrales;

    if (list.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: #121725; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🧠</span>
            <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 16px;">Tu Arsenal Mental está listo para ser forjado</h4>
            <p style="color: #94a3b8; font-size: 13px; max-width: 440px; margin: 0 auto 16px auto;">
                Registra tus protocolos cognitivos personalizados o importa los 8 protocolos fundamentales recomendados.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button class="btn-add-finanza" onclick="abrirModalNuevoEjercicioCerebral()">
                    ➕ Registrar Protocolo
                </button>
                <button type="button" class="btn-subfiltro-ej active" onclick="importarProtocolosMentalesRecomendados()" style="padding: 9px 16px; font-size: 13px;">
                    📥 Cargar Protocolos Recomendados
                </button>
            </div>
        </div>`;
        return;
    }

    var subfiltro = SUBFILTRO_MENTAL_ACTIVO || 'todas';

    // Si es una facultad cognitiva específica
    if (subfiltro !== 'todas') {
        var filtrados = list.filter(function(ec) {
            var mp = (ec.musculoPrincipal || '').toLowerCase();
            var secs = (ec.musculosSecundarios || (ec.musculoSecundario ? [ec.musculoSecundario] : [])).map(function(s) { return (s || '').toLowerCase(); });
            var target = subfiltro.toLowerCase();
            return mp === target || secs.includes(target);
        });

        if (filtrados.length === 0) {
            cont.innerHTML = `
            <div style="text-align: center; padding: 35px 20px; background: #121725; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 14px; color: #94a3b8; font-size: 13px;">
                No hay protocolos para la facultad cognitiva <strong>${subfiltro}</strong>.<br>
                <button class="btn-subfiltro-ej" onclick="abrirModalNuevoEjercicioCerebral()" style="margin-top: 12px;">➕ Crear Protocolo</button>
            </div>`;
            return;
        }

        var html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 14px;">';
        filtrados.forEach(function(ec) {
            html += generarCardEjercicioCerebralHtml(ec);
        });
        html += '</div>';
        cont.innerHTML = html;
        return;
    }

    // Si 'todas' está activo, agrupar ordenadamente por facultades cognitivas
    var facultades = [
        { key: 'enfoque', label: '🎯 Enfoque & Deep Work' },
        { key: 'inteligencia', label: '⚡ Lógica & Análisis' },
        { key: 'memoria', label: '🧠 Memoria & Retención' },
        { key: 'creatividad', label: '🎨 Creatividad & Síntesis' },
        { key: 'disciplina', label: '🛡️ Disciplina & Autocontrol' },
        { key: 'velocidad', label: '🚀 Agilidad Mental & Velocidad' },
        { key: 'calma', label: '🌊 Calma & Regulación Neural' },
        { key: 'estrategia', label: '♟️ Pensamiento Estratégico' },
        { key: 'descanso', label: '💤 Recuperación Neural' },
        { key: 'anulacion', label: '🛑 Inhibición de Impulsos' }
    ];

    var asignados = new Set();
    var htmlAgrupado = '';

    facultades.forEach(function(f) {
        var itemsDeFacultad = list.filter(function(ec) {
            if (asignados.has(ec.id || ec.nombre)) return false;
            var mp = (ec.musculoPrincipal || '').toLowerCase();
            return mp === f.key;
        });

        if (itemsDeFacultad.length > 0) {
            itemsDeFacultad.forEach(function(ec) { asignados.add(ec.id || ec.nombre); });
            htmlAgrupado += `<div class="mental-group-title">${f.label} <span style="font-size:11px; color:#94a3b8; font-weight:600; margin-left:4px;">(${itemsDeFacultad.length})</span></div>`;
            htmlAgrupado += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 14px; margin-bottom: 14px;">';
            itemsDeFacultad.forEach(function(ec) {
                htmlAgrupado += generarCardEjercicioCerebralHtml(ec);
            });
            htmlAgrupado += '</div>';
        }
    });

    var restantes = list.filter(function(ec) {
        return !asignados.has(ec.id || ec.nombre);
    });
    if (restantes.length > 0) {
        htmlAgrupado += `<div class="mental-group-title">🔮 Otros Protocolos Cognitivos <span style="font-size:11px; color:#94a3b8; font-weight:600; margin-left:4px;">(${restantes.length})</span></div>`;
        htmlAgrupado += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 14px;">';
        restantes.forEach(function(ec) {
            htmlAgrupado += generarCardEjercicioCerebralHtml(ec);
        });
        htmlAgrupado += '</div>';
    }

    cont.innerHTML = htmlAgrupado;
}

function ejecutarEjercicioCerebral(id) {
    if (!APP_STATE.ejerciciosCerebrales) return;
    var ec = APP_STATE.ejerciciosCerebrales.find(function(item) { return item.id === id; });
    if (!ec) return;

    var fm = APP_STATE.fatigaMentalDiaria || { nivel: 20 };
    if (ec.fatigaEstimada > 0 && fm.nivel >= 85) {
        if (!confirm("⚠️ Tu fatiga mental actual es del " + fm.nivel + "%. Realizar este entrenamiento cognitivo aumentará tu fatiga. ¿Deseas continuar?")) {
            return;
        }
    }

    var nuevoNivelFatiga = Math.min(100, Math.max(0, (fm.nivel || 0) + (ec.fatigaEstimada || 0)));
    fm.nivel = nuevoNivelFatiga;
    fm.estado = nuevoNivelFatiga <= 25 ? "Mente Despejada" : (nuevoNivelFatiga <= 60 ? "Carga Moderada" : (nuevoNivelFatiga <= 85 ? "Fatiga Elevada" : "Saturación Neural"));
    APP_STATE.fatigaMentalDiaria = fm;

    var expTotal = ec.expRecompensa || 30;

    // Distribuir EXP proporcionalmente si hay desglose de facultades:
    if (ec.facultades && Array.isArray(ec.facultades) && ec.facultades.length > 0) {
        ec.facultades.forEach(function(f) {
            var fClave = f.clave || f.facultad;
            var fPct = f.porcentaje || 25;
            var fExp = Math.max(5, Math.round(expTotal * (fPct / 100)));
            sumarExpMusculoMental(fClave, fExp);
        });
    } else {
        sumarExpMusculoMental(ec.musculoPrincipal, expTotal);
        var secList = ec.musculosSecundarios || (ec.musculoSecundario ? [ec.musculoSecundario] : []);
        secList.forEach(function(sec) {
            sumarExpMusculoMental(sec, Math.round(expTotal * 0.5));
        });
    }

    sumarExp(expTotal);

    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
        MonarcaDB.save(APP_STATE);
    }
    renderizarBarraFatigaMentalDiaria();
    renderizarGimnasioMental();

    var msgFatiga = (ec.fatigaEstimada <= 0)
        ? "Fatiga mental reducida a: " + nuevoNivelFatiga + "% (Alivio activo)."
        : "Fatiga mental actual: " + nuevoNivelFatiga + "%.";

    alert("🧠 ¡Protocolo cognitivo completado!\n• " + ec.nombre + " ejecutado con éxito.\n• +" + expTotal + " EXP general y facultades cognitivas asignados.\n• " + msgFatiga);
}

function abrirModalNuevoEjercicioCerebral() {
    var modal = document.getElementById('modal-nuevo-ejercicio-cerebral');
    if (!modal) return;
    var inNom = document.getElementById('input-ec-nombre');
    var inDesc = document.getElementById('input-ec-desc');
    var inProt = document.getElementById('input-ec-prot');
    var inDur = document.getElementById('input-ec-dur');
    var inFat = document.getElementById('input-ec-fatiga');
    var inExp = document.getElementById('input-ec-exp');

    if (inNom) inNom.value = '';
    if (inDesc) inDesc.value = '';
    if (inProt) inProt.value = '';
    if (inDur) inDur.value = '30';
    if (inFat) inFat.value = '20';
    if (inExp) inExp.value = '35';

    ZONAS_EJERCICIO_MENTAL_TEMP = [
        { clave: 'enfoque', nombre: 'Enfoque & Concentración (Deep Work)', icono: '🎯', porcentaje: 50 }
    ];

    poblarSelectZonasMentales();
    renderizarFilasZonasMentales();

    modal.style.display = 'flex';
}

function cerrarModalNuevoEjercicioCerebral() {
    var modal = document.getElementById('modal-nuevo-ejercicio-cerebral');
    if (modal) modal.style.display = 'none';
}

function guardarNuevoEjercicioCerebral() {
    var inNom = document.getElementById('input-ec-nombre');
    var inDur = document.getElementById('input-ec-dur');
    var inDesc = document.getElementById('input-ec-desc');
    var inProt = document.getElementById('input-ec-prot');
    var inFat = document.getElementById('input-ec-fatiga');
    var inExp = document.getElementById('input-ec-exp');

    var nom = inNom ? inNom.value.trim() : '';
    var dur = inDur ? (Number(inDur.value) || 25) : 25;
    var desc = inDesc ? inDesc.value.trim() : '';
    var prot = inProt ? inProt.value.trim() : '';
    var fat = inFat ? (Number(inFat.value) || 15) : 15;
    var exp = inExp ? (Number(inExp.value) || 30) : 30;

    if (!nom) {
        alert("Ingresa el nombre del ejercicio cerebral.");
        if (inNom) inNom.focus();
        return;
    }

    if (!ZONAS_EJERCICIO_MENTAL_TEMP || ZONAS_EJERCICIO_MENTAL_TEMP.length === 0) {
        alert("Por favor añade al menos una facultad cognitiva con su porcentaje de estímulo.");
        return;
    }

    if (!APP_STATE.ejerciciosCerebrales) APP_STATE.ejerciciosCerebrales = [];

    var yaExisteCer = APP_STATE.ejerciciosCerebrales.some(function(e) {
        return e && e.nombre && e.nombre.trim().toLowerCase() === nom.trim().toLowerCase();
    });
    if (yaExisteCer) {
        if (!confirm("Ya existe un ejercicio cerebral llamado \"" + nom + "\".\n¿Deseas agregar otro con el mismo nombre?")) {
            return;
        }
    }

    // Ordenar facultades por porcentaje descendente para determinar la principal
    var facCopia = JSON.parse(JSON.stringify(ZONAS_EJERCICIO_MENTAL_TEMP));
    facCopia.sort(function(a, b) { return (b.porcentaje || 0) - (a.porcentaje || 0); });

    var musP = facCopia[0].clave;
    var musculosSecundarios = facCopia.slice(1).map(function(f) { return f.clave; });

    var nuevo = {
        id: "EC-" + Date.now(),
        nombre: nom,
        musculoPrincipal: musP,
        musculoSecundario: musculosSecundarios.length ? musculosSecundarios[0] : null,
        musculosSecundarios: musculosSecundarios,
        facultades: facCopia,
        duracionMinutos: dur,
        descripcion: desc || "Entrenamiento cognitivo estructurado.",
        protocolo: prot || "1. Concentración plena. 2. Ejecutar bloque de foco. 3. Documentar resultados.",
        fatigaEstimada: fat,
        expRecompensa: exp,
        timestamp: Date.now(),
        fechaActualizacion: Date.now()
    };

    APP_STATE.ejerciciosCerebrales.push(nuevo);
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
        MonarcaDB.save(APP_STATE);
    }

    cerrarModalNuevoEjercicioCerebral();
    renderizarBancoEjerciciosCerebrales();
    alert("⚡ Protocolo cognitivo '" + nom + "' agregado exitosamente (" + facCopia.length + " facultad(es) asociada(s)).");
}

function eliminarEjercicioCerebral(id) {
    if (!confirm("¿Deseas eliminar este ejercicio cerebral del banco?")) return;
    if (!APP_STATE.ejerciciosCerebrales) return;

    var ecBorrado = APP_STATE.ejerciciosCerebrales.find(function(e) { return String(e.id) === String(id); });
    var nomBorrado = ecBorrado ? (ecBorrado.nombre || '').trim().toLowerCase() : '';

    if (typeof registrarTombstone === 'function') {
        registrarTombstone('ejerciciosCerebrales', id);
    }
    APP_STATE.ejerciciosCerebrales = APP_STATE.ejerciciosCerebrales.filter(function(e) { return e.id !== id; });

    // Desvincular automáticamente de las rutinas
    if (APP_STATE.rutinas && Array.isArray(APP_STATE.rutinas)) {
        APP_STATE.rutinas.forEach(function(r) {
            if (r && r.ejercicios && Array.isArray(r.ejercicios)) {
                r.ejercicios = r.ejercicios.filter(function(ej) {
                    var matchId = ej && ej.id && String(ej.id) === String(id);
                    var matchNom = ej && ej.nombre && nomBorrado && ej.nombre.trim().toLowerCase() === nomBorrado;
                    return !(matchId || matchNom);
                });
            }
        });
    }

    MonarcaDB.save(APP_STATE);
    renderizarBancoEjerciciosCerebrales();
    if (typeof renderizarPortalesRutinas === 'function') {
        renderizarPortalesRutinas(APP_STATE.rutinas);
    }
}

// ==========================================================================
// MÓDULO: GENERADOR DE RUTINA ALEATORIA & SPLIT SEMANAL INTELIGENTE (v9.4)
// ==========================================================================

var GRUPOS_MUSCULARES_SPLIT = [
    'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
    'Cuádriceps', 'Isquios', 'Glúteos', 'Pantorrillas', 'Core'
];

var DIAS_SEMANA_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

var SPLIT_SEMANAL_DEFAULT = {
    hombre: [
        { dia: 'Lunes', descanso: false, grupos: ['Pecho', 'Tríceps', 'Hombros'] },
        { dia: 'Martes', descanso: false, grupos: ['Espalda', 'Bíceps'] },
        { dia: 'Miércoles', descanso: false, grupos: ['Cuádriceps', 'Isquios', 'Glúteos', 'Pantorrillas'] },
        { dia: 'Jueves', descanso: false, grupos: ['Pecho', 'Espalda'] },
        { dia: 'Viernes', descanso: false, grupos: ['Hombros', 'Bíceps', 'Tríceps', 'Core'] },
        { dia: 'Sábado', descanso: false, grupos: ['Cuádriceps', 'Glúteos', 'Core'] },
        { dia: 'Domingo', descanso: true, grupos: [] }
    ],
    mujer: [
        { dia: 'Lunes', descanso: false, grupos: ['Glúteos', 'Isquios', 'Pantorrillas'] },
        { dia: 'Martes', descanso: false, grupos: ['Espalda', 'Hombros', 'Core'] },
        { dia: 'Miércoles', descanso: false, grupos: ['Cuádriceps', 'Glúteos'] },
        { dia: 'Jueves', descanso: true, grupos: [] },
        { dia: 'Viernes', descanso: false, grupos: ['Glúteos', 'Isquios', 'Core'] },
        { dia: 'Sábado', descanso: false, grupos: ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps'] },
        { dia: 'Domingo', descanso: true, grupos: [] }
    ]
};

var BANCO_MAESTRO_EJERCICIOS = [
    // --- PECHO ---
    { nombre: 'Press de Banca Plano con Barra', series: 4, repeticiones: '8-10 reps', fatigaPorcentaje: 25, compuesto: true, musculoPrincipal: 'Pecho', categorias: ['Pecho', 'Tríceps', 'Hombros'] },
    { nombre: 'Press Inclinado con Mancuernas', series: 4, repeticiones: '10-12 reps', fatigaPorcentaje: 22, compuesto: true, musculoPrincipal: 'Pecho', categorias: ['Pecho', 'Hombros'] },
    { nombre: 'Aperturas en Polea / Cruces', series: 3, repeticiones: '12-15 reps', fatigaPorcentaje: 15, compuesto: false, musculoPrincipal: 'Pecho', categorias: ['Pecho'] },
    { nombre: 'Fondos en Paralelas (Dips)', series: 3, repeticiones: '10-12 reps', fatigaPorcentaje: 22, compuesto: true, musculoPrincipal: 'Pecho', categorias: ['Pecho', 'Tríceps'] },
    { nombre: 'Press Declinado con Mancuernas', series: 3, repeticiones: '10-12 reps', fatigaPorcentaje: 20, compuesto: true, musculoPrincipal: 'Pecho', categorias: ['Pecho', 'Tríceps'] },
    { nombre: 'Flexiones de Pecho (Push-ups)', series: 3, repeticiones: '15-20 reps', fatigaPorcentaje: 16, compuesto: false, musculoPrincipal: 'Pecho', categorias: ['Pecho', 'Core'] },

    // --- ESPALDA ---
    { nombre: 'Dominadas Pronas / Pull-ups', series: 4, repeticiones: '8-10 reps', fatigaPorcentaje: 26, compuesto: true, musculoPrincipal: 'Espalda', categorias: ['Espalda', 'Bíceps'] },
    { nombre: 'Remo con Barra Pendlay', series: 4, repeticiones: '8-10 reps', fatigaPorcentaje: 25, compuesto: true, musculoPrincipal: 'Espalda', categorias: ['Espalda', 'Bíceps'] },
    { nombre: 'Jalón al Pecho en Polea', series: 4, repeticiones: '10-12 reps', fatigaPorcentaje: 20, compuesto: true, musculoPrincipal: 'Espalda', categorias: ['Espalda', 'Bíceps'] },
    { nombre: 'Remo Unilateral con Mancuerna', series: 3, repeticiones: '10-12 reps', fatigaPorcentaje: 18, compuesto: false, musculoPrincipal: 'Espalda', categorias: ['Espalda'] },
    { nombre: 'Pullover en Polea Alta', series: 3, repeticiones: '12-15 reps', fatigaPorcentaje: 15, compuesto: false, musculoPrincipal: 'Espalda', categorias: ['Espalda'] },
    { nombre: 'Remo en Polea Baja (Gironda)', series: 3, repeticiones: '10-12 reps', fatigaPorcentaje: 18, compuesto: true, musculoPrincipal: 'Espalda', categorias: ['Espalda', 'Bíceps'] },

    // --- HOMBROS ---
    { nombre: 'Press Militar con Barra / Mancuernas', series: 4, repeticiones: '8-10 reps', fatigaPorcentaje: 22, compuesto: true, musculoPrincipal: 'Hombros', categorias: ['Hombros', 'Tríceps'] },
    { nombre: 'Elevaciones Laterales con Mancuernas', series: 4, repeticiones: '12-15 reps', fatigaPorcentaje: 15, compuesto: false, musculoPrincipal: 'Hombros', categorias: ['Hombros'] },
    { nombre: 'Pájaros / Deltoides Posterior en Polea', series: 3, repeticiones: '12-15 reps', fatigaPorcentaje: 15, compuesto: false, musculoPrincipal: 'Hombros', categorias: ['Hombros'] },
    { nombre: 'Press Arnold con Mancuernas', series: 3, repeticiones: '10-12 reps', fatigaPorcentaje: 20, compuesto: true, musculoPrincipal: 'Hombros', categorias: ['Hombros', 'Tríceps'] },
    { nombre: 'Face Pulls en Polea', series: 3, repeticiones: '15 reps', fatigaPorcentaje: 14, compuesto: false, musculoPrincipal: 'Hombros', categorias: ['Hombros', 'Espalda'] },

    // --- BÍCEPS ---
    { nombre: 'Curl con Barra Z', series: 3, repeticiones: '10-12 reps', fatigaPorcentaje: 18, compuesto: false, musculoPrincipal: 'Bíceps', categorias: ['Bíceps'] },
    { nombre: 'Curl Martillo con Mancuernas', series: 3, repeticiones: '10-12 reps', fatigaPorcentaje: 18, compuesto: false, musculoPrincipal: 'Bíceps', categorias: ['Bíceps'] },
    { nombre: 'Curl en Banco Scott / Predicador', series: 3, repeticiones: '12 reps', fatigaPorcentaje: 16, compuesto: false, musculoPrincipal: 'Bíceps', categorias: ['Bíceps'] },
    { nombre: 'Curl Concentrado Unilateral', series: 3, repeticiones: '12 reps/lado', fatigaPorcentaje: 15, compuesto: false, musculoPrincipal: 'Bíceps', categorias: ['Bíceps'] },

    // --- TRÍCEPS ---
    { nombre: 'Press Francés con Mancuernas / Barra Z', series: 3, repeticiones: '10-12 reps', fatigaPorcentaje: 18, compuesto: false, musculoPrincipal: 'Tríceps', categorias: ['Tríceps'] },
    { nombre: 'Extensiones de Tríceps en Polea Alta', series: 4, repeticiones: '12-15 reps', fatigaPorcentaje: 16, compuesto: false, musculoPrincipal: 'Tríceps', categorias: ['Tríceps'] },
    { nombre: 'Extensiones Sobre Cabeza (Copa)', series: 3, repeticiones: '12-15 reps', fatigaPorcentaje: 16, compuesto: false, musculoPrincipal: 'Tríceps', categorias: ['Tríceps'] },
    { nombre: 'Fondos en Banco para Tríceps', series: 3, repeticiones: '12-15 reps', fatigaPorcentaje: 15, compuesto: false, musculoPrincipal: 'Tríceps', categorias: ['Tríceps'] },

    // --- CUÁDRICEPS ---
    { nombre: 'Sentadilla Libre con Barra (Squat)', series: 4, repeticiones: '8-10 reps', fatigaPorcentaje: 30, compuesto: true, musculoPrincipal: 'Cuádriceps', categorias: ['Cuádriceps', 'Glúteos'] },
    { nombre: 'Prensa Inclinada de Piernas', series: 4, repeticiones: '10-12 reps', fatigaPorcentaje: 25, compuesto: true, musculoPrincipal: 'Cuádriceps', categorias: ['Cuádriceps', 'Glúteos'] },
    { nombre: 'Extensiones de Cuádriceps en Máquina', series: 3, repeticiones: '12-15 reps', fatigaPorcentaje: 18, compuesto: false, musculoPrincipal: 'Cuádriceps', categorias: ['Cuádriceps'] },
    { nombre: 'Zancadas / Desplantes Caminando', series: 3, repeticiones: '12 reps/lado', fatigaPorcentaje: 22, compuesto: true, musculoPrincipal: 'Cuádriceps', categorias: ['Cuádriceps', 'Glúteos'] },
    { nombre: 'Sentadilla Hack en Máquina', series: 3, repeticiones: '10-12 reps', fatigaPorcentaje: 24, compuesto: true, musculoPrincipal: 'Cuádriceps', categorias: ['Cuádriceps', 'Glúteos'] },

    // --- ISQUIOS ---
    { nombre: 'Peso Muerto Rumano con Barra', series: 4, repeticiones: '8-10 reps', fatigaPorcentaje: 28, compuesto: true, musculoPrincipal: 'Isquios', categorias: ['Isquios', 'Glúteos'] },
    { nombre: 'Curl Femoral Tumbado en Máquina', series: 4, repeticiones: '10-12 reps', fatigaPorcentaje: 18, compuesto: false, musculoPrincipal: 'Isquios', categorias: ['Isquios'] },
    { nombre: 'Curl Femoral Sentado', series: 3, repeticiones: '12-15 reps', fatigaPorcentaje: 16, compuesto: false, musculoPrincipal: 'Isquios', categorias: ['Isquios'] },
    { nombre: 'Buenos Días con Barra Ligera', series: 3, repeticiones: '10-12 reps', fatigaPorcentaje: 20, compuesto: true, musculoPrincipal: 'Isquios', categorias: ['Isquios', 'Glúteos'] },

    // --- GLÚTEOS ---
    { nombre: 'Hip Thrust con Barra', series: 4, repeticiones: '10-12 reps', fatigaPorcentaje: 28, compuesto: true, musculoPrincipal: 'Glúteos', categorias: ['Glúteos', 'Isquios'] },
    { nombre: 'Sentadilla Búlgara con Mancuernas', series: 3, repeticiones: '10-12 reps/lado', fatigaPorcentaje: 25, compuesto: true, musculoPrincipal: 'Glúteos', categorias: ['Glúteos', 'Cuádriceps'] },
    { nombre: 'Abducciones de Cadera en Polea / Máquina', series: 3, repeticiones: '15-20 reps', fatigaPorcentaje: 15, compuesto: false, musculoPrincipal: 'Glúteos', categorias: ['Glúteos'] },
    { nombre: 'Patada de Glúteo en Polea', series: 3, repeticiones: '12-15 reps/lado', fatigaPorcentaje: 15, compuesto: false, musculoPrincipal: 'Glúteos', categorias: ['Glúteos'] },
    { nombre: 'Puente de Glúteos Unilateral', series: 3, repeticiones: '15 reps/lado', fatigaPorcentaje: 16, compuesto: false, musculoPrincipal: 'Glúteos', categorias: ['Glúteos'] },

    // --- PANTORRILLAS ---
    { nombre: 'Elevaciones de Talones de Pie', series: 4, repeticiones: '15-20 reps', fatigaPorcentaje: 15, compuesto: false, musculoPrincipal: 'Pantorrillas', categorias: ['Pantorrillas'] },
    { nombre: 'Elevación de Talones Sentado en Máquina', series: 3, repeticiones: '15 reps', fatigaPorcentaje: 15, compuesto: false, musculoPrincipal: 'Pantorrillas', categorias: ['Pantorrillas'] },

    // --- CORE ---
    { nombre: 'Plancha Abdominal Isométrica', series: 3, repeticiones: '45-60 seg', fatigaPorcentaje: 18, compuesto: false, musculoPrincipal: 'Core', categorias: ['Core'] },
    { nombre: 'Elevación de Piernas Colgado', series: 3, repeticiones: '12-15 reps', fatigaPorcentaje: 20, compuesto: false, musculoPrincipal: 'Core', categorias: ['Core'] },
    { nombre: 'Rueda Abdominal (Ab Wheel)', series: 3, repeticiones: '10-12 reps', fatigaPorcentaje: 22, compuesto: false, musculoPrincipal: 'Core', categorias: ['Core'] },
    { nombre: 'Russian Twists con Disco', series: 3, repeticiones: '20 giros', fatigaPorcentaje: 16, compuesto: false, musculoPrincipal: 'Core', categorias: ['Core'] }
];

var PERFIL_RUTINA_ALEATORIA_ACTIVO = 'hombre';
var PERFIL_SETTINGS_SPLIT_ACTIVO = 'hombre';
var RUTINA_ALEATORIA_GENERADA = null;

function obtenerSplitSemanalActual(perfil) {
    var p = perfil || PERFIL_RUTINA_ALEATORIA_ACTIVO || 'hombre';
    if (!APP_STATE.splitSemanal) {
        APP_STATE.splitSemanal = JSON.parse(JSON.stringify(SPLIT_SEMANAL_DEFAULT));
    }
    if (!APP_STATE.splitSemanal[p] || !Array.isArray(APP_STATE.splitSemanal[p]) || APP_STATE.splitSemanal[p].length !== 7) {
        APP_STATE.splitSemanal[p] = JSON.parse(JSON.stringify(SPLIT_SEMANAL_DEFAULT[p] || SPLIT_SEMANAL_DEFAULT.hombre));
    }
    return APP_STATE.splitSemanal[p];
}

function guardarSplitSemanalActual(perfil, split) {
    var p = perfil || PERFIL_SETTINGS_SPLIT_ACTIVO || 'hombre';
    if (!APP_STATE.splitSemanal) APP_STATE.splitSemanal = {};
    APP_STATE.splitSemanal[p] = split;
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
        MonarcaDB.save(APP_STATE);
    }
}

function obtenerDiaSemanaActualIdx() {
    var jsDay = new Date().getDay(); // 0: Dom, 1: Lun, ..., 6: Sab
    return (jsDay + 6) % 7; // 0: Lun, 1: Mar, ..., 6: Dom
}

function renderizarModuloRutinaAleatoria() {
    var btnH = document.getElementById('btn-perfil-hombre');
    var btnM = document.getElementById('btn-perfil-mujer');
    if (btnH) btnH.classList.toggle('active', PERFIL_RUTINA_ALEATORIA_ACTIVO === 'hombre');
    if (btnM) btnM.classList.toggle('active', PERFIL_RUTINA_ALEATORIA_ACTIVO === 'mujer');

    var split = obtenerSplitSemanalActual(PERFIL_RUTINA_ALEATORIA_ACTIVO);
    var diaIdx = obtenerDiaSemanaActualIdx();
    var diaConfig = split[diaIdx] || { dia: DIAS_SEMANA_NOMBRES[diaIdx], descanso: false, grupos: [] };

    // Renderizar Banner de Hoy
    var banner = document.getElementById('banner-deteccion-dia-hoy');
    if (banner) {
        var nombreDia = DIAS_SEMANA_NOMBRES[diaIdx];
        var esDescanso = !!diaConfig.descanso;
        var grupos = diaConfig.grupos || [];
        var perfilEtiqueta = PERFIL_RUTINA_ALEATORIA_ACTIVO === 'mujer' ? '👩 Perfil Mujer' : '👨 Perfil Hombre';

        var gruposHtml = '';
        if (esDescanso) {
            gruposHtml = `<span style="display: inline-block; padding: 4px 12px; background: rgba(148, 163, 184, 0.15); border: 1px solid rgba(148, 163, 184, 0.3); color: #cbd5e1; border-radius: 9999px; font-size: 12px; font-weight: 700;">🏖️ Día de Descanso Programado</span>`;
        } else if (grupos.length > 0) {
            gruposHtml = grupos.map(function(g) {
                return `<span style="display: inline-block; padding: 4px 10px; background: rgba(37, 99, 235, 0.2); border: 1px solid rgba(37, 99, 235, 0.4); color: #93c5fd; border-radius: 9999px; font-size: 11.5px; font-weight: 700; margin-right: 6px; margin-top: 4px;">⚡ ${g}</span>`;
            }).join('');
        } else {
            gruposHtml = `<span style="color: #94a3b8; font-size: 12px;">Sin grupos asignados para hoy en el split.</span>`;
        }

        banner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #38bdf8; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); padding: 2px 8px; border-radius: 6px;">${perfilEtiqueta}</span>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">· Detección en Tiempo Real</span>
                </div>
                <h3 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 18px; font-weight: 800;">
                    📅 Hoy es <span style="color: #38bdf8;">${nombreDia}</span>
                </h3>
                <div style="display: flex; align-items: flex-wrap; gap: 4px;">
                    ${gruposHtml}
                </div>
            </div>
            <div style="text-align: right;">
                <button type="button" class="btn-subfiltro-ej" onclick="mostrarSubvistaRutinaAleatoria('settings')" style="font-size: 11.5px; padding: 6px 12px;">
                    ⚙️ Cambiar Split
                </button>
            </div>
        </div>`;
    }

    // Renderizar Contenedor de Rutina Generada
    var contRutina = document.getElementById('contenedor-rutina-aleatoria-generada');
    if (!contRutina) return;

    if (!RUTINA_ALEATORIA_GENERADA || RUTINA_ALEATORIA_GENERADA.length === 0) {
        var ejerciciosBanco = obtenerBancoUsuarioEjercicios();
        if (!ejerciciosBanco || ejerciciosBanco.length === 0) {
            contRutina.innerHTML = `
            <div style="text-align: center; padding: 36px 20px; background: #121725; border: 1px dashed rgba(245, 158, 11, 0.4); border-radius: 16px;">
                <span style="font-size: 34px; display: block; margin-bottom: 8px;">🏋️‍♂️</span>
                <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 16px;">Tu Banco Físico está vacío</h4>
                <p style="color: #94a3b8; font-size: 13px; max-width: 440px; margin: 0 auto 16px auto;">
                    El generador seleccionará únicamente los ejercicios registrados en tu propio Banco Físico. Puedes crear tus ejercicios o importar el banco base recomendado.
                </p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button type="button" class="btn-system" onclick="abrirModalNuevoEjercicio('${(grupos && grupos[0]) || 'Pecho'}')" style="padding: 10px 18px; font-size: 13px;">
                        ➕ Crear Ejercicio en Banco Físico
                    </button>
                    <button type="button" class="btn-subfiltro-ej" onclick="importarBancoRecomendadoAlBancoFisico()" style="padding: 10px 18px; font-size: 13px;">
                        📥 Cargar Recomendados
                    </button>
                </div>
            </div>`;
        } else {
            contRutina.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; background: #121725; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 16px;">
                <span style="font-size: 34px; display: block; margin-bottom: 8px;">🎲</span>
                <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 16px;">Generador de Rutinas Inteligente</h4>
                <p style="color: #94a3b8; font-size: 13px; max-width: 440px; margin: 0 auto;">
                    Pulsa el botón superior para estructurar tu sesión de hoy: se seleccionan entre 4 y 6 ejercicios únicos de tu Banco Físico para los grupos musculares programados, priorizando ejercicios multiarticulares principales primero y accesorios después.
                </p>
            </div>`;
        }
        return;
    }

    var html = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
        <div>
            <h4 style="margin: 0; color: #f8fafc; font-size: 15px; font-weight: 800;">
                🔥 Sesión Estructurada para Hoy (${RUTINA_ALEATORIA_GENERADA.length} Ejercicios)
            </h4>
            <span style="font-size: 12px; color: #94a3b8;">Revisa tus ejercicios. Puedes re-rollear individualmente cualquiera que no te convenza.</span>
        </div>
        <button type="button" class="btn-subfiltro-ej" onclick="generarRutinaAleatoriaHoy()" style="font-size: 11.5px;">
            🔄 Regenerar Todo
        </button>
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">`;

    RUTINA_ALEATORIA_GENERADA.forEach(function(ej, idx) {
        var esComp = !!ej.compuesto;
        var badgeComp = esComp 
            ? `<span style="font-size: 10px; font-weight: 800; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); color: #c7d2fe; padding: 2px 7px; border-radius: 6px;">⭐ PRINCIPAL / COMPUESTO</span>`
            : `<span style="font-size: 10px; font-weight: 700; background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.2); color: #94a3b8; padding: 2px 7px; border-radius: 6px;">ACCESORIO</span>`;
        var muscleBadges = (ej.categorias || [ej.musculoPrincipal]).map(function(c) {
            return `<span style="font-size: 10.5px; background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); color: #cbd5e1; padding: 2px 6px; border-radius: 4px;">${c}</span>`;
        }).join(' ');

        html += `
        <div class="random-exercise-card">
            <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: #38bdf8; flex-shrink: 0;">
                    ${idx + 1}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 3px;">
                        <h4 style="margin: 0; font-size: 14.5px; font-weight: 700; color: #f8fafc;">${ej.nombre}</h4>
                        ${badgeComp}
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                        <span style="font-size: 12px; font-weight: 700; color: #38bdf8;">${ej.series || 4} series × ${ej.repeticiones || '10-12 reps'}</span>
                        <span style="color: #64748b; font-size: 12px;">·</span>
                        ${muscleBadges}
                    </div>
                </div>
            </div>
            <div>
                <button type="button" class="btn-reroll-item" onclick="reRollearEjercicioAleatorio(${idx})" title="Cambiar por otro ejercicio del mismo grupo">
                    <span>🔄</span> Re-roll
                </button>
            </div>
        </div>`;
    });

    html += `
    </div>
    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
        <button type="button" class="btn-system" onclick="iniciarRutinaAleatoriaGenerada()" style="flex: 1; min-width: 200px; padding: 14px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-weight: 800; font-size: 14px; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
            <span>▶️</span> Iniciar Esta Sesión
        </button>
        <button type="button" class="btn-subfiltro-ej" onclick="guardarRutinaAleatoriaEnMisRutinas()" style="padding: 14px 20px; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <span>💾</span> Guardar como Rutina
        </button>
    </div>`;

    contRutina.innerHTML = html;
}

function mostrarSubvistaRutinaAleatoria(subvista) {
    var vGen = document.getElementById('subvista-generador-principal');
    var vSet = document.getElementById('subvista-settings-split');
    if (subvista === 'settings') {
        if (vGen) vGen.style.display = 'none';
        if (vSet) vSet.style.display = 'block';
        PERFIL_SETTINGS_SPLIT_ACTIVO = PERFIL_RUTINA_ALEATORIA_ACTIVO;
        renderizarSettingsSplitSemanal();
    } else {
        if (vSet) vSet.style.display = 'none';
        if (vGen) vGen.style.display = 'block';
        renderizarModuloRutinaAleatoria();
    }
}

function cambiarPerfilRutinaAleatoria(perfil) {
    PERFIL_RUTINA_ALEATORIA_ACTIVO = perfil || 'hombre';
    RUTINA_ALEATORIA_GENERADA = null;
    renderizarModuloRutinaAleatoria();
}

function cambiarPerfilSettingsSplit(perfil) {
    PERFIL_SETTINGS_SPLIT_ACTIVO = perfil || 'hombre';
    renderizarSettingsSplitSemanal();
}

function renderizarSettingsSplitSemanal() {
    var btnH = document.getElementById('btn-settings-perfil-hombre');
    var btnM = document.getElementById('btn-settings-perfil-mujer');
    if (btnH) btnH.classList.toggle('active', PERFIL_SETTINGS_SPLIT_ACTIVO === 'hombre');
    if (btnM) btnM.classList.toggle('active', PERFIL_SETTINGS_SPLIT_ACTIVO === 'mujer');

    var cont = document.getElementById('contenedor-split-semanal-editor');
    if (!cont) return;

    var split = obtenerSplitSemanalActual(PERFIL_SETTINGS_SPLIT_ACTIVO);
    var diaActualIdx = obtenerDiaSemanaActualIdx();

    var html = '';
    split.forEach(function(item, idx) {
        var esHoy = (idx === diaActualIdx);
        var esDescanso = !!item.descanso;
        var grupos = item.grupos || [];

        var chipsHtml = GRUPOS_MUSCULARES_SPLIT.map(function(m) {
            var activo = grupos.includes(m);
            return `<span class="split-muscle-chip ${activo ? 'active' : ''}" onclick="toggleMusculoDiaSplit(${idx}, '${m}')">${m}</span>`;
        }).join('');

        html += `
        <div class="split-day-card ${esHoy ? 'today' : ''} ${esDescanso ? 'is-rest' : ''}">
            <div class="split-day-header">
                <div>
                    <strong style="color: #f8fafc; font-size: 14px;">${item.dia}</strong>
                    ${esHoy ? '<span style="font-size: 10px; font-weight: 800; background: #38bdf8; color: #080a0f; padding: 1px 6px; border-radius: 4px; margin-left: 6px;">HOY</span>' : ''}
                </div>
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 11.5px; color: #94a3b8; user-select: none;">
                    <input type="checkbox" ${esDescanso ? 'checked' : ''} onchange="toggleDescansoDiaSplit(${idx})" style="cursor: pointer;">
                    <span>Descanso</span>
                </label>
            </div>
            <div>
                <span style="font-size: 11px; color: ${esDescanso ? '#fcd34d' : '#7dd3fc'}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; display: block; margin-bottom: 6px;">
                    ${esDescanso ? '🏖️ Descanso (Toca un músculo para activar o sortea al generar):' : '💪 Grupos Musculares:'}
                </span>
                <div class="split-chips-container">
                    ${chipsHtml}
                </div>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function toggleDescansoDiaSplit(diaIdx) {
    var split = obtenerSplitSemanalActual(PERFIL_SETTINGS_SPLIT_ACTIVO);
    if (!split[diaIdx]) return;
    split[diaIdx].descanso = !split[diaIdx].descanso;
    guardarSplitSemanalActual(PERFIL_SETTINGS_SPLIT_ACTIVO, split);
    renderizarSettingsSplitSemanal();
}

function toggleMusculoDiaSplit(diaIdx, musculo) {
    var split = obtenerSplitSemanalActual(PERFIL_SETTINGS_SPLIT_ACTIVO);
    if (!split[diaIdx]) return;
    if (split[diaIdx].descanso) {
        split[diaIdx].descanso = false;
    }
    if (!Array.isArray(split[diaIdx].grupos)) split[diaIdx].grupos = [];
    var pos = split[diaIdx].grupos.indexOf(musculo);
    if (pos >= 0) {
        split[diaIdx].grupos.splice(pos, 1);
    } else {
        split[diaIdx].grupos.push(musculo);
    }
    guardarSplitSemanalActual(PERFIL_SETTINGS_SPLIT_ACTIVO, split);
    renderizarSettingsSplitSemanal();
}

function restablecerSplitDefault() {
    if (!confirm("¿Deseas restablecer el Split Semanal por defecto para el perfil " + (PERFIL_SETTINGS_SPLIT_ACTIVO === 'mujer' ? 'Mujer' : 'Hombre') + "?")) {
        return;
    }
    var def = JSON.parse(JSON.stringify(SPLIT_SEMANAL_DEFAULT[PERFIL_SETTINGS_SPLIT_ACTIVO] || SPLIT_SEMANAL_DEFAULT.hombre));
    guardarSplitSemanalActual(PERFIL_SETTINGS_SPLIT_ACTIVO, def);
    renderizarSettingsSplitSemanal();
}

function importarBancoRecomendadoAlBancoFisico() {
    if (!confirm("¿Deseas importar los ejercicios base recomendados (30+ ejercicios de fuerza organizados por grupos musculares) a tu Banco Físico?\n\nPodrás verlos, editarlos y utilizarlos en la generación de rutinas.")) {
        return;
    }
    if (!APP_STATE.ejercicios) APP_STATE.ejercicios = [];
    var agregados = 0;
    BANCO_MAESTRO_EJERCICIOS.forEach(function(baseEj) {
        var yaExiste = APP_STATE.ejercicios.some(function(e) {
            return e && e.nombre && e.nombre.trim().toLowerCase() === baseEj.nombre.trim().toLowerCase();
        });
        if (!yaExiste) {
            APP_STATE.ejercicios.push({
                id: "EJ-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
                nombre: baseEj.nombre,
                tipo: "gym",
                compuesto: !!baseEj.compuesto,
                especificaciones: "Técnica biomecánica controlada.",
                descripcion: "Técnica biomecánica controlada.",
                musculoPrincipal: baseEj.musculoPrincipal,
                series: baseEj.series || 4,
                repeticiones: baseEj.repeticiones || "8-10 reps",
                categorias: baseEj.categorias || [baseEj.musculoPrincipal],
                fatigaPorcentaje: baseEj.fatigaPorcentaje || 20,
                timestamp: Date.now(),
                fechaActualizacion: Date.now()
            });
            agregados++;
        }
    });

    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
        MonarcaDB.save(APP_STATE);
    }
    renderizarEjercicios(APP_STATE.ejercicios);
    if (typeof TAB_TRAINER_ACTIVA !== 'undefined' && TAB_TRAINER_ACTIVA === 'aleatoria' && typeof renderizarSubAppTrainer === 'function') {
        renderizarSubAppTrainer();
    }
    alert("✓ Se han importado " + agregados + " ejercicios a tu Banco Físico.");
}

function obtenerBancoUsuarioEjercicios() {
    return (APP_STATE.ejercicios || []).filter(function(e) {
        return e && e.nombre && (e.tipo === 'gym' || e.tipo === 'calistenia' || e.tipo === 'movilidad' || !e.tipo);
    });
}

function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = a[i];
        a[i] = a[j];
        a[j] = temp;
    }
    return a;
}

var RUTINA_ALEATORIA_META = null;

function obtenerCatalogoEjerciciosParaAleatoria() {
    var usuarioEj = obtenerBancoUsuarioEjercicios();
    var lista = usuarioEj.map(function(e) {
        return Object.assign({}, e, { _fuenteCatalogo: 'usuario' });
    });
    var nombresSet = {};
    lista.forEach(function(e) {
        nombresSet[(e.nombre || '').toLowerCase().trim()] = true;
    });

    var maestro = (typeof BANCO_MAESTRO_EJERCICIOS !== 'undefined' && Array.isArray(BANCO_MAESTRO_EJERCICIOS))
        ? BANCO_MAESTRO_EJERCICIOS
        : [];
    var usoMaestro = false;

    maestro.forEach(function(m) {
        var key = (m.nombre || '').toLowerCase().trim();
        if (!nombresSet[key]) {
            nombresSet[key] = true;
            lista.push(Object.assign({}, m, { _fuenteCatalogo: 'maestro' }));
            if (usuarioEj.length === 0) usoMaestro = true;
        }
    });

    return {
        ejercicios: lista,
        usuarioCount: usuarioEj.length,
        usandoRespaldoMaestro: usoMaestro
    };
}

function resolverGruposObjetivoParaDiaAleatoria(split, diaIdx) {
    var listaSplit = Array.isArray(split) ? split : [];
    var diaConfig = listaSplit[diaIdx] || { dia: DIAS_SEMANA_NOMBRES[diaIdx] || 'Hoy', descanso: false, grupos: [] };
    var esDescanso = !!diaConfig.descanso;
    var gruposDia = Array.isArray(diaConfig.grupos) ? diaConfig.grupos.filter(Boolean) : [];

    // Pool de grupos musculares configurados por el usuario en todo su Split Semanal
    var poolConfigurado = [];
    var vistos = {};
    listaSplit.forEach(function(d) {
        if (!d || d.descanso || !Array.isArray(d.grupos)) return;
        d.grupos.forEach(function(g) {
            if (g && !vistos[g]) {
                vistos[g] = true;
                poolConfigurado.push(g);
            }
        });
    });

    var poolFallback = (poolConfigurado.length > 0)
        ? poolConfigurado
        : (Array.isArray(GRUPOS_MUSCULARES_SPLIT) ? GRUPOS_MUSCULARES_SPLIT.slice() : ['Pecho', 'Espalda', 'Hombros', 'Core']);

    if (esDescanso || gruposDia.length === 0) {
        // En día de descanso (o sin grupos asignados), elegir 2-3 grupos aleatorios del pool configurado
        var mezclados = shuffleArray(poolFallback);
        var cantidad = mezclados.length <= 2 ? mezclados.length : (Math.random() < 0.45 ? 2 : 3);
        return {
            grupos: mezclados.slice(0, cantidad),
            esDescanso: esDescanso,
            fueSorteoDescanso: true,
            diaNombre: diaConfig.dia || DIAS_SEMANA_NOMBRES[diaIdx] || 'Hoy'
        };
    }

    return {
        grupos: gruposDia,
        esDescanso: false,
        fueSorteoDescanso: false,
        diaNombre: diaConfig.dia || DIAS_SEMANA_NOMBRES[diaIdx] || 'Hoy'
    };
}

function coincideEjercicioConGruposSplit(ej, grupos) {
    if (!ej || !Array.isArray(grupos) || grupos.length === 0) return false;
    var categorias = (ej.categorias || []).concat([ej.musculoPrincipal || '']).map(function(c) {
        return (c || '').toLowerCase().trim();
    }).filter(Boolean);
    return grupos.some(function(g) {
        var gLow = (g || '').toLowerCase().trim();
        return categorias.some(function(c) {
            return c.includes(gLow) || gLow.includes(c);
        });
    });
}

function construirRutinaAleatoriaPorGrupos(gruposObjetivo, maxEjercicios) {
    var catalogo = obtenerCatalogoEjerciciosParaAleatoria();
    var metaMax = maxEjercicios || 6;

    // Priorizar ejercicios propios del usuario sobre el catálogo maestro cuando existan ambos
    var candidatosUsuario = catalogo.ejercicios.filter(function(ej) {
        return ej._fuenteCatalogo === 'usuario' && coincideEjercicioConGruposSplit(ej, gruposObjetivo);
    });
    var candidatosMaestro = catalogo.ejercicios.filter(function(ej) {
        return ej._fuenteCatalogo !== 'usuario' && coincideEjercicioConGruposSplit(ej, gruposObjetivo);
    });
    var candidatos = (candidatosUsuario.length >= 4)
        ? candidatosUsuario
        : candidatosUsuario.concat(candidatosMaestro);

    if (!candidatos || candidatos.length === 0) {
        return { seleccionados: [], candidatosCount: 0, catalogo: catalogo };
    }

    var compuestos = shuffleArray(candidatos.filter(function(e) { return !!e.compuesto; }));
    var accesorios = shuffleArray(candidatos.filter(function(e) { return !e.compuesto; }));
    var todosMezclados = compuestos.concat(accesorios);

    var seleccionados = [];
    var nombresUsados = {};

    function agregar(ej) {
        if (!ej || seleccionados.length >= metaMax) return false;
        var key = (ej.nombre || '').toLowerCase().trim();
        if (!key || nombresUsados[key]) return false;
        nombresUsados[key] = true;
        seleccionados.push(JSON.parse(JSON.stringify(ej)));
        return true;
    }

    // Paso 1: Garantizar al menos 1 ejercicio aleatorio de CADA grupo muscular elegido
    var gruposMezclados = shuffleArray(gruposObjetivo);
    gruposMezclados.forEach(function(g) {
        var porGrupoComp = compuestos.filter(function(e) { return coincideEjercicioConGruposSplit(e, [g]); });
        var porGrupoAcc = accesorios.filter(function(e) { return coincideEjercicioConGruposSplit(e, [g]); });
        var poolGrupo = porGrupoComp.length > 0 ? porGrupoComp.concat(porGrupoAcc) : porGrupoAcc;
        for (var i = 0; i < poolGrupo.length; i++) {
            if (agregar(poolGrupo[i])) break;
        }
    });

    // Paso 2: Completar hasta 5-6 ejercicios priorizando compuestos y variedad de accesorios
    var objetivoTotal = Math.min(metaMax, candidatos.length, (gruposObjetivo.length <= 1 ? 5 : 6));
    var metaComp = Math.min(compuestos.length, Math.max(2, Math.min(3, objetivosMinComp(objetivoTotal))));
    function objetivosMinComp(tot) { return tot >= 5 ? 3 : 2; }

    var compActuales = seleccionados.filter(function(e) { return !!e.compuesto; }).length;
    for (var i = 0; i < compuestos.length && seleccionados.length < objetivoTotal && compActuales < metaComp; i++) {
        if (agregar(compuestos[i])) compActuales++;
    }
    for (var j = 0; j < accesorios.length && seleccionados.length < objetivoTotal; j++) {
        agregar(accesorios[j]);
    }
    for (var k = 0; k < todosMezclados.length && seleccionados.length < objetivoTotal; k++) {
        agregar(todosMezclados[k]);
    }

    return {
        seleccionados: seleccionados,
        candidatosCount: candidatos.length,
        catalogo: catalogo
    };
}

function generarRutinaAleatoriaHoy() {
    var split = obtenerSplitSemanalActual(PERFIL_RUTINA_ALEATORIA_ACTIVO);
    var diaIdx = obtenerDiaSemanaActualIdx();
    var resolucion = resolverGruposObjetivoParaDiaAleatoria(split, diaIdx);
    var gruposObjetivo = resolucion.grupos;

    var res = construirRutinaAleatoriaPorGrupos(gruposObjetivo, 6);
    var contRutina = document.getElementById('contenedor-rutina-aleatoria-generada');

    if (!res.seleccionados || res.seleccionados.length === 0) {
        RUTINA_ALEATORIA_GENERADA = null;
        RUTINA_ALEATORIA_META = null;
        if (contRutina) {
            contRutina.innerHTML = `
            <div style="background: #121725; border: 1px dashed rgba(245, 158, 11, 0.4); border-radius: 16px; padding: 36px 20px; text-align: center;">
                <span style="font-size: 36px; display: block; margin-bottom: 8px;">🏋️‍♂️</span>
                <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 16px;">No hay ejercicios disponibles</h4>
                <p style="color: #94a3b8; font-size: 13px; max-width: 440px; margin: 0 auto 16px auto;">
                    Agrega ejercicios para <strong style="color: #38bdf8;">${gruposObjetivo.join(', ')}</strong> en tu Banco Físico.
                </p>
            </div>`;
        }
        return;
    }

    RUTINA_ALEATORIA_META = {
        diaIdx: diaIdx,
        diaNombre: resolucion.diaNombre,
        gruposUsados: gruposObjetivo,
        fueSorteoDescanso: resolucion.fueSorteoDescanso
    };
    RUTINA_ALEATORIA_GENERADA = res.seleccionados;
    renderizarModuloRutinaAleatoria();
}

function elegirSustitutoEjercicioAleatorio(rutinaActual, idx, gruposObjetivo) {
    if (!Array.isArray(rutinaActual) || !rutinaActual[idx]) return null;
    var actual = rutinaActual[idx];
    var objetivos = (Array.isArray(gruposObjetivo) && gruposObjetivo.length > 0) ? gruposObjetivo : GRUPOS_MUSCULARES_SPLIT;
    var catalogo = obtenerCatalogoEjerciciosParaAleatoria();
    var todos = shuffleArray(catalogo.ejercicios);
    var nombresActuales = rutinaActual.map(function(e) { return (e.nombre || '').toLowerCase().trim(); });

    // Priorizar el grupo objetivo del split que representa el ejercicio actual (evita salirse del split configurado)
    var grupoActualEnSplit = objetivos.find(function(g) {
        return coincideEjercicioConGruposSplit(actual, [g]);
    }) || '';

    var sustituto = (grupoActualEnSplit ? todos.find(function(e) {
        var nKey = (e.nombre || '').toLowerCase().trim();
        if (nombresActuales.includes(nKey)) return false;
        return coincideEjercicioConGruposSplit(e, [grupoActualEnSplit]) && coincideEjercicioConGruposSplit(e, objetivos);
    }) : null) || todos.find(function(e) {
        var nKey = (e.nombre || '').toLowerCase().trim();
        if (nombresActuales.includes(nKey)) return false;
        return coincideEjercicioConGruposSplit(e, objetivos);
    });

    return sustituto ? JSON.parse(JSON.stringify(sustituto)) : null;
}

function reRollearEjercicioAleatorio(idx) {
    if (!RUTINA_ALEATORIA_GENERADA || !RUTINA_ALEATORIA_GENERADA[idx]) return;

    var split = obtenerSplitSemanalActual(PERFIL_RUTINA_ALEATORIA_ACTIVO);
    var diaIdx = (RUTINA_ALEATORIA_META && typeof RUTINA_ALEATORIA_META.diaIdx === 'number') ? RUTINA_ALEATORIA_META.diaIdx : obtenerDiaSemanaActualIdx();
    var gruposObjetivo = (RUTINA_ALEATORIA_META && Array.isArray(RUTINA_ALEATORIA_META.gruposUsados) && RUTINA_ALEATORIA_META.gruposUsados.length > 0)
        ? RUTINA_ALEATORIA_META.gruposUsados
        : resolverGruposObjetivoParaDiaAleatoria(split, diaIdx).grupos;

    var sustituto = elegirSustitutoEjercicioAleatorio(RUTINA_ALEATORIA_GENERADA, idx, gruposObjetivo);
    if (sustituto) {
        RUTINA_ALEATORIA_GENERADA[idx] = sustituto;
        renderizarModuloRutinaAleatoria();
    } else {
        alert("No hay más variantes distintas para este grupo muscular en el catálogo.");
    }
}

function iniciarRutinaAleatoriaGenerada() {
    if (!RUTINA_ALEATORIA_GENERADA || RUTINA_ALEATORIA_GENERADA.length === 0) {
        generarRutinaAleatoriaHoy();
    }
    if (!RUTINA_ALEATORIA_GENERADA || RUTINA_ALEATORIA_GENERADA.length === 0) return;

    var hoyNombre = DIAS_SEMANA_NOMBRES[obtenerDiaSemanaActualIdx()];
    var rutina = {
        nombre: "Rutina Aleatoria - " + hoyNombre + " (" + (PERFIL_RUTINA_ALEATORIA_ACTIVO === 'mujer' ? 'Mujer' : 'Hombre') + ")",
        tipo: "fisica",
        rankLabel: "SESIÓN ALEATORIA · " + hoyNombre.toUpperCase(),
        ejercicios: JSON.parse(JSON.stringify(RUTINA_ALEATORIA_GENERADA))
    };

    abrirDetalleRutinaDinamicaGenerada(rutina);
}

function abrirDetalleRutinaDinamicaGenerada(rutina) {
    if (typeof detenerDescansoGym === 'function') detenerDescansoGym();
    if (typeof limpiarTodosLosTimersSeries === 'function') limpiarTodosLosTimersSeries();
    RUTINA_ACTIVA = { rutina: rutina, idx: -1 };
    HISTORIAL_FACTOR_SERIES = {};

    cambiarVista('vista-detalle-rutina-dinamica');
    iniciarAudioAutomaticoParaRutina(rutina, false);

    var tituloEl = document.getElementById('detalle-rutina-titulo');
    var badgeEl = document.getElementById('detalle-rutina-badge');
    if (tituloEl) tituloEl.innerText = rutina.nombre;
    if (badgeEl) badgeEl.innerText = limpiarBadgeRutina(rutina.rankLabel, 'SESIÓN ALEATORIA');

    var cont = document.getElementById('contenedor-detalle-rutina-dinamica');
    if (!cont) return;

    var totalSeries = calcularTotalSeriesRutina(rutina.ejercicios);
    var progrCont = document.getElementById('progreso-rutina-dinamica-cont');
    var progrBarra = document.getElementById('progreso-barra-rutina-dinamica');
    var progrTexto = document.getElementById('progreso-texto-rutina-dinamica');
    var btnReg = document.getElementById('btn-registrar-rutina-dinamica');

    if (progrCont) progrCont.style.display = 'block';
    if (progrBarra) progrBarra.style.width = '0%';
    if (progrTexto) progrTexto.innerText = '0 / ' + totalSeries + ' series (0%)';
    if (btnReg) {
        btnReg.style.display = 'block';
        btnReg.disabled = true;
    }

    cont.innerHTML = renderizarTarjetasEjerciciosSesion(rutina.ejercicios);
    actualizarProgresoRutinaDinamica();
    if (CHART_FATIGA_RUTINA_SESION) {
        CHART_FATIGA_RUTINA_SESION.destroy();
        CHART_FATIGA_RUTINA_SESION = null;
    }
    actualizarGraficaFatigaSesion();

    if (typeof iniciarCalentamientoAutomatico === 'function') {
        setTimeout(function() {
            iniciarCalentamientoAutomatico();
        }, 120);
    }
}

function guardarRutinaAleatoriaEnMisRutinas() {
    if (!RUTINA_ALEATORIA_GENERADA || RUTINA_ALEATORIA_GENERADA.length === 0) {
        alert("Primero genera una rutina aleatoria.");
        return;
    }

    var hoyNombre = DIAS_SEMANA_NOMBRES[obtenerDiaSemanaActualIdx()];
    var nombreDefecto = "Rutina " + hoyNombre + " (" + (PERFIL_RUTINA_ALEATORIA_ACTIVO === 'mujer' ? 'Mujer' : 'Hombre') + ") - " + new Date().toLocaleDateString('es-ES');
    var nombre = prompt("Ingresa el nombre para guardar esta rutina en tu catálogo:", nombreDefecto);
    if (!nombre || !nombre.trim()) return;

    if (!APP_STATE.rutinas) APP_STATE.rutinas = [];

    var nowRand = Date.now();
    var nueva = {
        id: "RUT-" + nowRand,
        codigo: "RUT-" + (APP_STATE.rutinas.length + 1),
        nombre: nombre.trim(),
        tipo: "fisica",
        rankLabel: "SESIÓN · " + hoyNombre.toUpperCase(),
        descripcion: "Rutina generada inteligentemente según el Split Semanal.",
        ejercicios: JSON.parse(JSON.stringify(RUTINA_ALEATORIA_GENERADA)),
        permitirDuplicadoNombre: true,
        fechaCreacion: nowRand,
        timestamp: nowRand,
        fechaActualizacion: nowRand
    };

    APP_STATE.rutinas.push(nueva);
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
        MonarcaDB.save(APP_STATE);
    }

    alert("✓ Rutina '" + nueva.nombre + "' guardada exitosamente en 'Rutinas & Sesiones'.");
}

// ==========================================================================
// MÓDULO PERSONAL INDEPENDIENTE: RUTINA ALEATORIA + MIS DÍAS + MÚSICA
// ==========================================================================

var PANEL_ALEATORIA_PERSONAL_ABIERTO = false;
var SUBVISTA_ALEATORIA_PERSONAL = 'generador'; // 'generador' | 'settings'
var DIA_ALEATORIA_PERSONAL_IDX = null;
var RUTINA_ALEATORIA_PERSONAL_GENERADA = null;
var RUTINA_ALEATORIA_PERSONAL_META = null;
var PLAYLIST_ALEATORIA_PERSONAL_SELECCIONADA = '';
var NOMBRE_ALEATORIA_PERSONAL_DRAFT = '';

var SPLIT_PERSONAL_SEMANAL_DEFAULT = [
    { dia: 'Lunes', descanso: false, grupos: ['Pecho', 'Tríceps', 'Hombros'] },
    { dia: 'Martes', descanso: false, grupos: ['Espalda', 'Bíceps'] },
    { dia: 'Miércoles', descanso: false, grupos: ['Cuádriceps', 'Glúteos', 'Core'] },
    { dia: 'Jueves', descanso: true, grupos: [] },
    { dia: 'Viernes', descanso: false, grupos: ['Pecho', 'Espalda', 'Hombros'] },
    { dia: 'Sábado', descanso: false, grupos: ['Isquios', 'Glúteos', 'Pantorrillas'] },
    { dia: 'Domingo', descanso: true, grupos: [] }
];

function obtenerSplitPersonalSemanal() {
    if (!APP_STATE.splitPersonal || !Array.isArray(APP_STATE.splitPersonal.dias) || APP_STATE.splitPersonal.dias.length !== 7) {
        APP_STATE.splitPersonal = {
            dias: JSON.parse(JSON.stringify(SPLIT_PERSONAL_SEMANAL_DEFAULT)),
            updatedAt: Date.now()
        };
    }
    return APP_STATE.splitPersonal.dias;
}

function guardarSplitPersonalSemanal(diasArr) {
    APP_STATE.splitPersonal = {
        dias: Array.isArray(diasArr) ? diasArr : JSON.parse(JSON.stringify(SPLIT_PERSONAL_SEMANAL_DEFAULT)),
        updatedAt: Date.now()
    };
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
        MonarcaDB.save(APP_STATE);
    }
}

function obtenerDiaAleatoriaPersonalActivoIdx() {
    if (typeof DIA_ALEATORIA_PERSONAL_IDX === 'number' && DIA_ALEATORIA_PERSONAL_IDX >= 0 && DIA_ALEATORIA_PERSONAL_IDX <= 6) {
        return DIA_ALEATORIA_PERSONAL_IDX;
    }
    DIA_ALEATORIA_PERSONAL_IDX = obtenerDiaSemanaActualIdx();
    return DIA_ALEATORIA_PERSONAL_IDX;
}

function normalizarEjercicioPersonalParaRutina(rawEj) {
    if (!rawEj) return null;
    var nomLow = (rawEj.nombre || '').toLowerCase().trim();
    var matchUsuario = (APP_STATE.ejercicios || []).find(function(e) {
        if (!e || e.esMental) return false;
        if (rawEj.id && e.id === rawEj.id) return true;
        return e.nombre && e.nombre.toLowerCase().trim() === nomLow;
    });
    var base = matchUsuario ? JSON.parse(JSON.stringify(matchUsuario)) : JSON.parse(JSON.stringify(rawEj));

    if (!base.id) {
        var slug = nomLow.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'ej';
        base.id = 'EJ-PERS-' + slug;
    }
    base.esMental = false;
    base.tipo = base.tipo || 'gym';

    var esTiempo = (base.modalidadEsfuerzo === 'tiempo') || (base.tiempoSegundos != null && base.tiempoSegundos > 0);
    base.modalidadEsfuerzo = esTiempo ? 'tiempo' : 'repeticiones';
    base.series = (base.series != null && !isNaN(parseInt(base.series, 10))) ? Math.max(1, parseInt(base.series, 10)) : 4;

    if (!esTiempo) {
        var repsAvg = base.repeticionesPromedio || obtenerRepsPromedioEjercicio(base) || 10;
        base.repeticionesPromedio = repsAvg;
        base.repeticiones = base.repeticiones || (repsAvg + ' reps');
        base.tiempoSegundos = 0;
    } else {
        var segs = base.tiempoSegundos || base.repeticionesPromedio || 45;
        base.tiempoSegundos = segs;
        base.tiempoReferencia = segs;
        base.repeticionesPromedio = segs;
        base.repeticiones = base.repeticiones || (segs + 's isométrico (' + formatearTiempoMMSS(segs) + ')');
    }

    base.peso = (base.peso != null && !isNaN(parseFloat(base.peso))) ? parseFloat(base.peso) : 0;
    base.alFallo = !!base.alFallo;
    base.dropset = base.dropset || null;
    base.fatigaPorcentaje = Number(base.fatigaPorcentaje) || 20;
    base.categorias = Array.isArray(base.categorias) && base.categorias.length > 0
        ? base.categorias
        : (base.musculoPrincipal ? [base.musculoPrincipal] : ['General']);
    return base;
}

function abrirPanelRutinaAleatoriaPersonal() {
    PANEL_ALEATORIA_PERSONAL_ABIERTO = true;
    SUBVISTA_ALEATORIA_PERSONAL = 'generador';
    if (DIA_ALEATORIA_PERSONAL_IDX === null) {
        DIA_ALEATORIA_PERSONAL_IDX = obtenerDiaSemanaActualIdx();
    }
    var catWrap = document.getElementById('rutinas-personales-catalogo-wrap');
    var randWrap = document.getElementById('rutinas-personales-aleatoria-wrap');
    var btnToggle = document.getElementById('btn-abrir-rutina-aleatoria-personal');
    if (catWrap) catWrap.style.display = 'none';
    if (randWrap) randWrap.style.display = 'block';
    if (btnToggle) btnToggle.classList.add('is-open');
    renderizarModuloRutinaAleatoriaPersonal();
}

function cerrarPanelRutinaAleatoriaPersonal(omitirRender) {
    PANEL_ALEATORIA_PERSONAL_ABIERTO = false;
    var catWrap = document.getElementById('rutinas-personales-catalogo-wrap');
    var randWrap = document.getElementById('rutinas-personales-aleatoria-wrap');
    var btnToggle = document.getElementById('btn-abrir-rutina-aleatoria-personal');
    if (randWrap) randWrap.style.display = 'none';
    if (catWrap) catWrap.style.display = 'block';
    if (btnToggle) btnToggle.classList.remove('is-open');
    if (!omitirRender && typeof renderizarPortalesRutinasEjercicios === 'function') {
        if (typeof actualizarSelectoresPlaylistRutinas === 'function') actualizarSelectoresPlaylistRutinas();
        renderizarPortalesRutinasEjercicios();
    }
}

function mostrarSubvistaAleatoriaPersonal(sub) {
    SUBVISTA_ALEATORIA_PERSONAL = (sub === 'settings') ? 'settings' : 'generador';
    renderizarModuloRutinaAleatoriaPersonal();
}

function cambiarDiaRutinaAleatoriaPersonal(diaIdx) {
    DIA_ALEATORIA_PERSONAL_IDX = (typeof diaIdx === 'number' && diaIdx >= 0 && diaIdx <= 6) ? diaIdx : obtenerDiaSemanaActualIdx();
    RUTINA_ALEATORIA_PERSONAL_GENERADA = null;
    RUTINA_ALEATORIA_PERSONAL_META = null;
    NOMBRE_ALEATORIA_PERSONAL_DRAFT = '';
    renderizarModuloRutinaAleatoriaPersonal();
}

function alCambiarPlaylistAleatoriaPersonal(plId) {
    PLAYLIST_ALEATORIA_PERSONAL_SELECCIONADA = plId || '';
}

function alCambiarNombreAleatoriaPersonal(nom) {
    NOMBRE_ALEATORIA_PERSONAL_DRAFT = nom || '';
}

function generarRutinaAleatoriaPersonal() {
    var split = obtenerSplitPersonalSemanal();
    var diaIdx = obtenerDiaAleatoriaPersonalActivoIdx();
    var resolucion = resolverGruposObjetivoParaDiaAleatoria(split, diaIdx);
    var gruposObjetivo = resolucion.grupos;

    var res = construirRutinaAleatoriaPorGrupos(gruposObjetivo, 6);
    if (!res.seleccionados || res.seleccionados.length === 0) {
        RUTINA_ALEATORIA_PERSONAL_GENERADA = null;
        RUTINA_ALEATORIA_PERSONAL_META = null;
        alert("No se encontraron ejercicios disponibles para los grupos (" + gruposObjetivo.join(', ') + "). Agrega ejercicios en Arsenal Físico o ajusta tus grupos en Settings.");
        renderizarModuloRutinaAleatoriaPersonal();
        return;
    }

    RUTINA_ALEATORIA_PERSONAL_GENERADA = res.seleccionados.map(normalizarEjercicioPersonalParaRutina).filter(Boolean);
    RUTINA_ALEATORIA_PERSONAL_META = {
        diaIdx: diaIdx,
        diaNombre: resolucion.diaNombre,
        gruposUsados: gruposObjetivo,
        fueSorteoDescanso: resolucion.fueSorteoDescanso
    };
    NOMBRE_ALEATORIA_PERSONAL_DRAFT = 'Rutina ' + resolucion.diaNombre + ' · ' + gruposObjetivo.join(', ');
    renderizarModuloRutinaAleatoriaPersonal();
}

function reRollearEjercicioAleatorioPersonal(idx) {
    if (!RUTINA_ALEATORIA_PERSONAL_GENERADA || !RUTINA_ALEATORIA_PERSONAL_GENERADA[idx]) return;
    var split = obtenerSplitPersonalSemanal();
    var diaIdx = (RUTINA_ALEATORIA_PERSONAL_META && typeof RUTINA_ALEATORIA_PERSONAL_META.diaIdx === 'number')
        ? RUTINA_ALEATORIA_PERSONAL_META.diaIdx
        : obtenerDiaAleatoriaPersonalActivoIdx();
    var gruposObjetivo = (RUTINA_ALEATORIA_PERSONAL_META && Array.isArray(RUTINA_ALEATORIA_PERSONAL_META.gruposUsados) && RUTINA_ALEATORIA_PERSONAL_META.gruposUsados.length > 0)
        ? RUTINA_ALEATORIA_PERSONAL_META.gruposUsados
        : resolverGruposObjetivoParaDiaAleatoria(split, diaIdx).grupos;

    var sust = elegirSustitutoEjercicioAleatorio(RUTINA_ALEATORIA_PERSONAL_GENERADA, idx, gruposObjetivo);
    if (!sust) {
        alert("No hay más variantes distintas para este grupo muscular en el catálogo.");
        return;
    }
    RUTINA_ALEATORIA_PERSONAL_GENERADA[idx] = normalizarEjercicioPersonalParaRutina(sust);
    renderizarModuloRutinaAleatoriaPersonal();
}

function construirObjetoRutinaPersonalDesdeAleatoria(nombreOverride) {
    var ejercicios = Array.isArray(RUTINA_ALEATORIA_PERSONAL_GENERADA) ? RUTINA_ALEATORIA_PERSONAL_GENERADA : [];
    var split = obtenerSplitPersonalSemanal();
    var diaIdx = obtenerDiaAleatoriaPersonalActivoIdx();
    var diaNombre = (RUTINA_ALEATORIA_PERSONAL_META && RUTINA_ALEATORIA_PERSONAL_META.diaNombre)
        ? RUTINA_ALEATORIA_PERSONAL_META.diaNombre
        : (split[diaIdx] ? split[diaIdx].dia : DIAS_SEMANA_NOMBRES[diaIdx]);
    var grupos = (RUTINA_ALEATORIA_PERSONAL_META && Array.isArray(RUTINA_ALEATORIA_PERSONAL_META.gruposUsados))
        ? RUTINA_ALEATORIA_PERSONAL_META.gruposUsados
        : [];

    var inNom = document.getElementById('input-nombre-rutina-aleatoria-personal');
    var selPl = document.getElementById('select-playlist-rutina-aleatoria-personal');
    var nombreFinal = (nombreOverride || (inNom ? inNom.value : '') || NOMBRE_ALEATORIA_PERSONAL_DRAFT || ('Rutina Aleatoria · ' + diaNombre)).trim();
    var plVal = selPl ? String(selPl.value || '').trim() : String(PLAYLIST_ALEATORIA_PERSONAL_SELECCIONADA || '').trim();
    PLAYLIST_ALEATORIA_PERSONAL_SELECCIONADA = plVal;
    NOMBRE_ALEATORIA_PERSONAL_DRAFT = nombreFinal;

    var now = Date.now();
    return {
        id: 'RUT-' + now,
        codigo: 'RUT-' + ((APP_STATE.rutinas ? APP_STATE.rutinas.length : 0) + 1),
        tipo: 'fisica',
        nombre: nombreFinal,
        descripcion: grupos.length > 0 ? ('Rutina personal: ' + grupos.join(', ')) : 'Rutina aleatoria personalizada',
        rankLabel: 'ALEATORIA · ' + diaNombre.toUpperCase(),
        ejercicios: JSON.parse(JSON.stringify(ejercicios)),
        playlistId: plVal || null,
        origenAleatoriaPersonal: true,
        permitirDuplicadoNombre: true,
        fechaCreacion: now,
        timestamp: now,
        fechaActualizacion: now
    };
}

function asegurarEjerciciosEnArsenalPersonal(ejercicios) {
    if (!Array.isArray(ejercicios) || ejercicios.length === 0) return false;
    if (!APP_STATE.ejercicios) APP_STATE.ejercicios = [];
    var ahora = Date.now();
    var agregados = 0;

    ejercicios.forEach(function(ej) {
        if (!ej || ej.esMental) return;
        var nomLow = (ej.nombre || '').trim().toLowerCase();
        var existente = APP_STATE.ejercicios.find(function(e) {
            if (!e) return false;
            if (ej.id && e.id === ej.id) return true;
            return e.nombre && nomLow && e.nombre.trim().toLowerCase() === nomLow;
        });
        if (existente) {
            if (existente.id) ej.id = existente.id;
            return;
        }
        var nuevo = {
            id: ej.id || ('EJ-' + ahora + '-' + Math.floor(Math.random() * 10000)),
            nombre: ej.nombre || 'Ejercicio Personal',
            tipo: ej.tipo || 'gym',
            compuesto: !!ej.compuesto,
            especificaciones: ej.especificaciones || 'Técnica biomecánica controlada.',
            descripcion: ej.descripcion || ej.especificaciones || 'Técnica biomecánica controlada.',
            musculoPrincipal: ej.musculoPrincipal || (Array.isArray(ej.categorias) && ej.categorias[0]) || 'General',
            series: ej.series || 4,
            peso: Number(ej.peso) || 0,
            pesoReferencia: Number(ej.pesoReferencia || ej.peso) || 0,
            modalidadEsfuerzo: ej.modalidadEsfuerzo || 'repeticiones',
            tiempoSegundos: Number(ej.tiempoSegundos) || 0,
            tiempoReferencia: Number(ej.tiempoReferencia || ej.tiempoSegundos) || 0,
            repeticiones: ej.repeticiones || '8-12 reps',
            repeticionesPromedio: Number(ej.repeticionesPromedio) || 10,
            zonas: Array.isArray(ej.zonas) ? ej.zonas.slice() : [],
            categorias: Array.isArray(ej.categorias) && ej.categorias.length > 0
                ? ej.categorias.slice()
                : [ej.musculoPrincipal || 'General'],
            fatigaPorcentaje: Number(ej.fatigaPorcentaje) || 20,
            timestamp: ahora,
            fechaActualizacion: ahora
        };
        ej.id = nuevo.id;
        APP_STATE.ejercicios.push(nuevo);
        agregados++;
    });

    if (agregados > 0 && typeof renderizarEjercicios === 'function') {
        renderizarEjercicios(APP_STATE.ejercicios);
    }
    return agregados > 0;
}

function guardarRutinaAleatoriaPersonalEnMisRutinas() {
    if (!RUTINA_ALEATORIA_PERSONAL_GENERADA || RUTINA_ALEATORIA_PERSONAL_GENERADA.length === 0) {
        alert("Primero genera tu rutina aleatoria.");
        return;
    }
    if (!APP_STATE.rutinas) APP_STATE.rutinas = [];
    asegurarEjerciciosEnArsenalPersonal(RUTINA_ALEATORIA_PERSONAL_GENERADA);
    var nueva = construirObjetoRutinaPersonalDesdeAleatoria();
    APP_STATE.rutinas.push(nueva);
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
        MonarcaDB.save(APP_STATE);
    }
    cerrarPanelRutinaAleatoriaPersonal();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca("Rutina '" + nueva.nombre + "' guardada en Mis Rutinas", '💾');
    }
}

function iniciarRutinaAleatoriaPersonalAhora() {
    if (!RUTINA_ALEATORIA_PERSONAL_GENERADA || RUTINA_ALEATORIA_PERSONAL_GENERADA.length === 0) {
        generarRutinaAleatoriaPersonal();
    }
    if (!RUTINA_ALEATORIA_PERSONAL_GENERADA || RUTINA_ALEATORIA_PERSONAL_GENERADA.length === 0) return;

    var huboNuevosEj = asegurarEjerciciosEnArsenalPersonal(RUTINA_ALEATORIA_PERSONAL_GENERADA);
    if (huboNuevosEj && typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
        MonarcaDB.save(APP_STATE);
    }
    var rutinaObj = construirObjetoRutinaPersonalDesdeAleatoria();
    abrirDetalleRutinaDinamicaGenerada(rutinaObj);
}

function toggleDescansoDiaSplitPersonal(diaIdx) {
    var split = obtenerSplitPersonalSemanal();
    if (!split[diaIdx]) return;
    split[diaIdx].descanso = !split[diaIdx].descanso;
    guardarSplitPersonalSemanal(split);
    RUTINA_ALEATORIA_PERSONAL_GENERADA = null;
    RUTINA_ALEATORIA_PERSONAL_META = null;
    renderizarModuloRutinaAleatoriaPersonal();
}

function toggleMusculoDiaSplitPersonal(diaIdx, musculo) {
    var split = obtenerSplitPersonalSemanal();
    if (!split[diaIdx]) return;
    if (split[diaIdx].descanso) split[diaIdx].descanso = false;
    if (!Array.isArray(split[diaIdx].grupos)) split[diaIdx].grupos = [];
    var pos = split[diaIdx].grupos.indexOf(musculo);
    if (pos >= 0) {
        split[diaIdx].grupos.splice(pos, 1);
    } else {
        split[diaIdx].grupos.push(musculo);
    }
    guardarSplitPersonalSemanal(split);
    RUTINA_ALEATORIA_PERSONAL_GENERADA = null;
    RUTINA_ALEATORIA_PERSONAL_META = null;
    renderizarModuloRutinaAleatoriaPersonal();
}

function restablecerSplitPersonalDefault() {
    if (!confirm("¿Restablecer tus días de entrenamiento y grupos musculares personales por defecto?")) return;
    guardarSplitPersonalSemanal(JSON.parse(JSON.stringify(SPLIT_PERSONAL_SEMANAL_DEFAULT)));
    RUTINA_ALEATORIA_PERSONAL_GENERADA = null;
    RUTINA_ALEATORIA_PERSONAL_META = null;
    renderizarModuloRutinaAleatoriaPersonal();
}

function renderizarSettingsSplitPersonal() {
    var split = obtenerSplitPersonalSemanal();
    var diaHoyIdx = obtenerDiaSemanaActualIdx();

    var html = `
    <div class="personal-rand-box">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
            <button type="button" class="btn-subfiltro-ej" onclick="mostrarSubvistaAleatoriaPersonal('generador')">
                ◀ Volver a Generar
            </button>
            <button type="button" class="btn-subfiltro-ej" onclick="restablecerSplitPersonalDefault()">
                🔄 Restablecer
            </button>
        </div>

        <div style="background: #0d1322; border: 1px solid rgba(56, 189, 248, 0.28); border-radius: 12px; padding: 11px 13px; margin-bottom: 12px;">
            <h4 style="margin: 0 0 4px 0; font-size: 14.5px; color: #f8fafc; font-weight: 800;">⚙️ Settings · Mis Días y Grupos Musculares</h4>
            <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.4;">
                Configura <strong>tu propia semana</strong> (totalmente aparte de Personal Trainer). Toca los músculos que entrenas cada día o marca <strong>Descanso</strong>.
            </p>
        </div>

        <div class="training-split-grid">
    `;

    split.forEach(function(item, idx) {
        var esHoy = (idx === diaHoyIdx);
        var esDescanso = !!item.descanso;
        var grupos = item.grupos || [];

        var chipsHtml = GRUPOS_MUSCULARES_SPLIT.map(function(m) {
            var activo = !esDescanso && grupos.indexOf(m) !== -1;
            return `<span class="split-muscle-chip ${activo ? 'active' : ''}" onclick="toggleMusculoDiaSplitPersonal(${idx}, '${m}')">${m}</span>`;
        }).join('');

        html += `
        <div class="split-day-card ${esHoy ? 'today' : ''} ${esDescanso ? 'is-rest' : ''}">
            <div class="split-day-header">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <strong style="color: #ffffff; font-size: 14px;">${item.dia}</strong>
                    ${esHoy ? '<span style="font-size: 10px; font-weight: 800; background: #38bdf8; color: #080a0f; padding: 1px 6px; border-radius: 5px;">HOY</span>' : ''}
                    ${!esDescanso ? `<span style="font-size: 10px; font-weight: 800; background: rgba(16, 185, 129, 0.16); color: #6ee7b7; padding: 1px 6px; border-radius: 5px;">${grupos.length} grp</span>` : ''}
                </div>
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 700; color: ${esDescanso ? '#fcd34d' : '#cbd5e1'}; user-select: none;">
                    <input type="checkbox" ${esDescanso ? 'checked' : ''} onchange="toggleDescansoDiaSplitPersonal(${idx})" style="cursor: pointer; accent-color: #f59e0b; width: 15px; height: 15px;">
                    <span>Descanso</span>
                </label>
            </div>
            <div>
                <span style="font-size: 11px; color: ${esDescanso ? '#fcd34d' : '#7dd3fc'}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; display: block; margin-bottom: 7px;">
                    ${esDescanso ? '🏖️ Día de Descanso (Toca un músculo para activarlo):' : '💪 Tus Grupos Musculares:'}
                </span>
                <div class="split-chips-container">${chipsHtml}</div>
            </div>
        </div>`;
    });

    html += `</div></div>`;
    return html;
}

function renderizarModuloRutinaAleatoriaPersonal() {
    var cont = document.getElementById('rutinas-personales-aleatoria-wrap');
    if (!cont) return;

    if (SUBVISTA_ALEATORIA_PERSONAL === 'settings') {
        cont.innerHTML = renderizarSettingsSplitPersonal();
        return;
    }

    var split = obtenerSplitPersonalSemanal();
    var diaHoyIdx = obtenerDiaSemanaActualIdx();
    var diaIdx = obtenerDiaAleatoriaPersonalActivoIdx();
    var diaConfig = split[diaIdx] || { dia: DIAS_SEMANA_NOMBRES[diaIdx], descanso: false, grupos: [] };
    var nombreDia = diaConfig.dia || DIAS_SEMANA_NOMBRES[diaIdx];
    var esHoy = (diaIdx === diaHoyIdx);
    var esDescanso = !!diaConfig.descanso;
    var gruposDia = diaConfig.grupos || [];

    var metaCoincide = RUTINA_ALEATORIA_PERSONAL_META && RUTINA_ALEATORIA_PERSONAL_META.diaIdx === diaIdx;
    var gruposMostrados = (metaCoincide && Array.isArray(RUTINA_ALEATORIA_PERSONAL_META.gruposUsados) && RUTINA_ALEATORIA_PERSONAL_META.gruposUsados.length > 0)
        ? RUTINA_ALEATORIA_PERSONAL_META.gruposUsados
        : gruposDia;
    var fueSorteoDescanso = !!(metaCoincide && RUTINA_ALEATORIA_PERSONAL_META.fueSorteoDescanso);

    var dayChipsHtml = split.map(function(dItem, idx) {
        var corto = (dItem.dia || DIAS_SEMANA_NOMBRES[idx] || '').slice(0, 3);
        var sel = idx === diaIdx;
        var rest = !!dItem.descanso;
        var cnt = Array.isArray(dItem.grupos) ? dItem.grupos.length : 0;
        return `<button type="button" class="trainer-day-chip ${sel ? 'is-selected' : ''} ${rest ? 'is-rest-chip' : ''}" onclick="cambiarDiaRutinaAleatoriaPersonal(${idx})">
            <span>${corto}${idx === diaHoyIdx ? ' ★' : ''}</span>
            <span class="trainer-day-chip-dot">${rest ? '🏖️' : (cnt + ' grp')}</span>
        </button>`;
    }).join('');

    var html = `
    <div class="personal-rand-box">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
            <button type="button" class="btn-subfiltro-ej" onclick="cerrarPanelRutinaAleatoriaPersonal()">
                ◀ Mis Rutinas
            </button>
            <button type="button" id="btn-settings-rutina-aleatoria-personal" class="trainer-btn-settings" onclick="mostrarSubvistaAleatoriaPersonal('settings')">
                <span>⚙️</span> Settings (Mis Días)
            </button>
        </div>

        <div style="background: #0d1322; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 13px; padding: 12px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
                <div>
                    <div style="font-size: 10.5px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.4px;">MI RUTINA PERSONAL · SPLIT PROPIO</div>
                    <h4 style="margin: 2px 0 0 0; font-size: 15.5px; font-weight: 800; color: #ffffff;">
                        📅 ${nombreDia}${esHoy ? ' <span style="color:#34d399; font-size:12px;">(Hoy)</span>' : ''}
                    </h4>
                </div>
                <span style="font-size: 11px; font-weight: 700; color: ${esDescanso ? '#fcd34d' : '#6ee7b7'}; background: ${esDescanso ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; border: 1px solid ${esDescanso ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}; padding: 3px 9px; border-radius: 9999px;">
                    ${esDescanso ? '🏖️ Descanso · Sorteo Activo' : '💪 Día de Entrenamiento'}
                </span>
            </div>

            <div class="trainer-day-pills-bar">${dayChipsHtml}</div>

            <div style="margin-top: 10px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                ${fueSorteoDescanso ? '<span style="font-size: 11px; font-weight: 800; color: #fcd34d;">🎲 Grupos sorteados:</span>' : ''}
                ${(gruposMostrados && gruposMostrados.length > 0 && (!esDescanso || fueSorteoDescanso))
                    ? gruposMostrados.map(function(g) {
                        return `<span style="display: inline-flex; align-items: center; padding: 3px 9px; background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.4); color: #e0f2fe; border-radius: 9999px; font-size: 11px; font-weight: 700;">⚡ ${escaparHtmlRutina(g)}</span>`;
                    }).join('')
                    : `<span style="font-size: 11.5px; color: #cbd5e1;">${esDescanso ? 'Día de descanso: si pides rutina se sortearán músculos de tus días activos.' : 'Sin grupos configurados aún: pulsa ⚙️ Settings o genera aleatorio.'}</span>`}
            </div>
        </div>

        <button type="button" id="btn-generar-rutina-aleatoria-personal" class="btn-system" onclick="generarRutinaAleatoriaPersonal()" style="width: 100%; margin-bottom: 14px; background: linear-gradient(135deg, #2563eb 0%, #38bdf8 100%); color: #ffffff; font-weight: 800; font-size: 14px; padding: 12px 16px; border-radius: 12px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 5px 18px rgba(37, 99, 235, 0.35);">
            <span>🎲</span> ${esDescanso ? 'Generar Mi Rutina Aleatoria (Elegir al Azar)' : 'Generar Mi Rutina de ' + nombreDia}
        </button>
    `;

    if (!RUTINA_ALEATORIA_PERSONAL_GENERADA || RUTINA_ALEATORIA_PERSONAL_GENERADA.length === 0) {
        html += `
        <div style="text-align: center; padding: 24px 14px; background: #0d1322; border: 1px dashed rgba(148, 163, 184, 0.25); border-radius: 13px;">
            <div style="font-size: 28px; margin-bottom: 6px;">🏋️‍♂️</div>
            <div style="font-size: 14px; font-weight: 800; color: #f8fafc; margin-bottom: 4px;">Listo para armar tu rutina</div>
            <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.45;">
                Genera tu sesión según <strong>Settings (Mis Días)</strong>, elige tu música, guárdala en tus rutinas o iníciala al instante con tu calentamiento y seguimiento de series.
            </p>
        </div></div>`;
        cont.innerHTML = html;
        return;
    }

    var playlists = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getPlaylists === 'function')
        ? window.MonarcaPlayer.getPlaylists()
        : (APP_STATE.reproductorPlaylists || []);
    var defaultPlId = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getPlaylistDefaultRutinaId === 'function')
        ? window.MonarcaPlayer.getPlaylistDefaultRutinaId()
        : (APP_STATE.rutinaPlaylistDefaultId || null);
    var canciones = (window.MonarcaPlayer && typeof window.MonarcaPlayer.getCanciones === 'function')
        ? window.MonarcaPlayer.getCanciones()
        : [];
    var plUI = construirOpcionesSelectorRutinaIndividual(
        PLAYLIST_ALEATORIA_PERSONAL_SELECCIONADA || '',
        defaultPlId,
        playlists,
        canciones,
        construirMapaCancionesPlaylist(canciones)
    );

    html += `
        <div class="personal-rand-music-card">
            <div style="margin-bottom: 10px;">
                <label for="input-nombre-rutina-aleatoria-personal" style="display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px;">
                    📝 Nombre de tu Rutina
                </label>
                <input type="text" id="input-nombre-rutina-aleatoria-personal" class="finanzas-input-clean" value="${escaparHtmlRutina(NOMBRE_ALEATORIA_PERSONAL_DRAFT || ('Rutina ' + nombreDia))}" oninput="alCambiarNombreAleatoriaPersonal(this.value)" style="width: 100%; box-sizing: border-box; background: #141b2d; border: 1px solid rgba(148, 163, 184, 0.25); color: #ffffff; border-radius: 9px; padding: 8px 11px; font-size: 13px; font-weight: 700;">
            </div>

            <div>
                <label for="select-playlist-rutina-aleatoria-personal" style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px;">
                    <span>🎵</span> Música para reproducir con esta rutina
                </label>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <select id="select-playlist-rutina-aleatoria-personal" class="finanzas-input-clean" onchange="alCambiarPlaylistAleatoriaPersonal(this.value)" style="flex: 1; min-width: 0; background: #141b2d; border: 1px solid rgba(16, 185, 129, 0.35); color: #f8fafc; border-radius: 9px; padding: 8px 11px; font-size: 12.5px; font-weight: 700;">
                        ${plUI.html}
                    </select>
                    <button type="button" class="btn-subfiltro-ej" onclick="cambiarVista('vista-reproductor'); if(window.MonarcaPlayer) window.MonarcaPlayer.cambiarSubtab('playlists');" style="padding: 8px 10px; font-size: 11.5px; white-space: nowrap;">
                        🎵 Listas
                    </button>
                </div>
            </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 8px;">
            <span style="font-size: 13px; font-weight: 800; color: #f8fafc;">🔥 Ejercicios (${RUTINA_ALEATORIA_PERSONAL_GENERADA.length})</span>
            <button type="button" class="btn-subfiltro-ej" onclick="generarRutinaAleatoriaPersonal()" style="font-size: 11.5px; padding: 5px 10px;">
                🔄 Regenerar Todo
            </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px;">
    `;

    RUTINA_ALEATORIA_PERSONAL_GENERADA.forEach(function(ej, idx) {
        var esComp = !!ej.compuesto;
        var badgeComp = esComp
            ? '<span style="font-size: 10px; font-weight: 800; background: rgba(99, 102, 241, 0.24); border: 1px solid rgba(129, 140, 248, 0.45); color: #e0e7ff; padding: 2px 7px; border-radius: 6px;">⭐ PRINCIPAL</span>'
            : '<span style="font-size: 10px; font-weight: 700; background: rgba(56, 189, 248, 0.14); border: 1px solid rgba(56, 189, 248, 0.3); color: #bae6fd; padding: 2px 7px; border-radius: 6px;">ACCESORIO</span>';
        var muscleBadges = (ej.categorias || [ej.musculoPrincipal]).filter(Boolean).map(function(c) {
            return `<span style="font-size: 10.5px; background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.1); color: #cbd5e1; padding: 2px 6px; border-radius: 5px;">${escaparHtmlRutina(c)}</span>`;
        }).join(' ');
        var pesoTag = ej.peso > 0 ? (' · ' + ej.peso + ' ' + (ej.unidadPeso || 'kg')) : '';

        html += `
        <div class="random-exercise-card">
            <div style="display: flex; align-items: flex-start; gap: 10px; flex: 1; min-width: 0;">
                <div style="width: 28px; height: 28px; border-radius: 8px; background: #0b0e15; border: 1px solid rgba(56, 189, 248, 0.35); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12.5px; color: #38bdf8; flex-shrink: 0;">
                    ${idx + 1}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 3px;">
                        <h4 style="margin: 0; font-size: 13.5px; font-weight: 800; color: #ffffff;">${escaparHtmlRutina(ej.nombre)}</h4>
                        ${badgeComp}
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-top: 3px;">
                        <span style="font-size: 11.5px; font-weight: 700; color: #38bdf8;">${ej.series || 4} series × ${escaparHtmlRutina(ej.repeticiones || '10 reps')}${escaparHtmlRutina(pesoTag)}</span>
                        ${muscleBadges}
                    </div>
                </div>
            </div>
            <div style="flex-shrink: 0;">
                <button type="button" class="btn-reroll-item" onclick="reRollearEjercicioAleatorioPersonal(${idx})" title="Cambiar ejercicio">
                    <span>🔄</span> Re-roll
                </button>
            </div>
        </div>`;
    });

    html += `
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" id="btn-guardar-rutina-aleatoria-personal" class="btn-subfiltro-ej" onclick="guardarRutinaAleatoriaPersonalEnMisRutinas()" style="flex: 1; min-width: 150px; padding: 12px 14px; font-weight: 800; font-size: 13px; justify-content: center; display: flex; align-items: center; gap: 6px; border-color: rgba(56, 189, 248, 0.45); color: #e0f2fe;">
                <span>💾</span> Guardar en Mis Rutinas
            </button>
            <button type="button" id="btn-iniciar-rutina-aleatoria-personal" class="btn-system" onclick="iniciarRutinaAleatoriaPersonalAhora()" style="flex: 1.3; min-width: 170px; margin: 0; padding: 12px 16px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-weight: 800; font-size: 13.5px; border: none; border-radius: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.32);">
                <span>▶️</span> Iniciar Sesión Ahora
            </button>
        </div>
    </div>`;

    cont.innerHTML = html;
}

if (typeof window !== 'undefined') {
    window.abrirModalEditarRutina = abrirModalEditarRutina;
    window.toggleSerieCeroRutina = toggleSerieCeroRutina;
    window.alCambiarInputSeriesRutina = alCambiarInputSeriesRutina;
    window.abrirPanelRutinaAleatoriaPersonal = abrirPanelRutinaAleatoriaPersonal;
    window.cerrarPanelRutinaAleatoriaPersonal = cerrarPanelRutinaAleatoriaPersonal;
    window.mostrarSubvistaAleatoriaPersonal = mostrarSubvistaAleatoriaPersonal;
    window.cambiarDiaRutinaAleatoriaPersonal = cambiarDiaRutinaAleatoriaPersonal;
    window.alCambiarPlaylistAleatoriaPersonal = alCambiarPlaylistAleatoriaPersonal;
    window.alCambiarNombreAleatoriaPersonal = alCambiarNombreAleatoriaPersonal;
    window.generarRutinaAleatoriaPersonal = generarRutinaAleatoriaPersonal;
    window.reRollearEjercicioAleatorioPersonal = reRollearEjercicioAleatorioPersonal;
    window.guardarRutinaAleatoriaPersonalEnMisRutinas = guardarRutinaAleatoriaPersonalEnMisRutinas;
    window.iniciarRutinaAleatoriaPersonalAhora = iniciarRutinaAleatoriaPersonalAhora;
    window.toggleDescansoDiaSplitPersonal = toggleDescansoDiaSplitPersonal;
    window.toggleMusculoDiaSplitPersonal = toggleMusculoDiaSplitPersonal;
    window.restablecerSplitPersonalDefault = restablecerSplitPersonalDefault;
}

/* ==========================================================================
   ESTADO PERSONAL · APARTADOS 2 (NUTRICIÓN & AGUA) Y 3 (DESCANSO & SUEÑO)
   ========================================================================== */

function inicializarNutricionYDescanso() {
    if (typeof APP_STATE === 'undefined' || !APP_STATE) return;
    if (!APP_STATE.nutricion) {
        APP_STATE.nutricion = {
            metaAguaMl: 2500,
            registrosAgua: {},
            comidas: []
        };
    }
    if (!APP_STATE.nutricion.registrosAgua) APP_STATE.nutricion.registrosAgua = {};
    if (!APP_STATE.nutricion.comidas) APP_STATE.nutricion.comidas = [];
    if (!APP_STATE.nutricion.metaAguaMl) APP_STATE.nutricion.metaAguaMl = 2500;

    if (!APP_STATE.sueno) {
        APP_STATE.sueno = {
            metaHoras: 8,
            registros: [],
            siestas: {}
        };
    }
    if (!APP_STATE.sueno.registros) APP_STATE.sueno.registros = [];
    if (!APP_STATE.sueno.siestas) APP_STATE.sueno.siestas = {};
    if (!APP_STATE.sueno.metaHoras) APP_STATE.sueno.metaHoras = 8;
}

function cambiarSeccionEstadoPersonal(seccion) {
    window.SECCION_EP_ACTIVA = seccion || 'desgaste';

    // Pestañas maestras
    var tabs = document.querySelectorAll('.ep-master-tab');
    tabs.forEach(function(t) {
        t.classList.remove('active');
    });
    var btnActivo = document.getElementById('tab-ep-btn-' + window.SECCION_EP_ACTIVA);
    if (btnActivo) btnActivo.classList.add('active');

    // Paneles
    var paneles = document.querySelectorAll('.ep-seccion-panel');
    paneles.forEach(function(p) {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    var panelActivo = document.getElementById('seccion-ep-' + window.SECCION_EP_ACTIVA);
    if (panelActivo) {
        panelActivo.style.display = 'block';
        panelActivo.classList.add('active');
    }

    // Actualizar encabezado
    var tit = document.getElementById('titulo-estado-personal-header');
    var sub = document.getElementById('subtitulo-estado-personal-header');

    if (window.SECCION_EP_ACTIVA === 'desgaste') {
        if (tit) tit.textContent = "Estado Personal · Diagnóstico del Avatar";
        if (sub) sub.textContent = "Monitoreo analítico milimétrico: balance en tiempo real entre el desgaste físico y la carga mental.";
        actualizarGraficosRadarEstadoPersonal();
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function() {
                actualizarGraficosRadarEstadoPersonal();
            });
        }
    } else if (window.SECCION_EP_ACTIVA === 'nutricion') {
        if (tit) tit.textContent = "Nutrición & Hidratación · Combustible Biológico";
        if (sub) sub.textContent = "Control diario de ingesta de agua, registro de comidas y balance nutricional para el avatar.";
        renderizarModuloNutricion();
    } else if (window.SECCION_EP_ACTIVA === 'descanso') {
        if (tit) tit.textContent = "Descanso & Sueño · Regeneración Neural";
        if (sub) sub.textContent = "Monitoreo de horas de sueño, siestas diurnas y bono de recuperación del avatar.";
        renderizarModuloDescanso();
    }

    // Animar inmediatamente el llenado vertical de pies a cabeza en el maniquí
    if (typeof actualizarLlenadoSiluetaAvatar === 'function') {
        actualizarLlenadoSiluetaAvatar(window.SECCION_EP_ACTIVA);
    }
}

// --------------------------------------------------------------------------
// MÓDULO 2: NUTRICIÓN & HIDRATACIÓN
// --------------------------------------------------------------------------

function renderizarModuloNutricion() {
    inicializarNutricionYDescanso();
    var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
    var nut = APP_STATE.nutricion;

    // 1. Agua
    var consumo = Number(nut.registrosAgua[hoy]) || 0;
    var meta = Number(nut.metaAguaMl) || 2500;
    var pct = Math.min(100, Math.round((consumo / meta) * 100));

    var elConsumo = document.getElementById('txt-consumo-agua-hoy');
    var elMeta = document.getElementById('txt-meta-agua');
    var elMetaDisp = document.getElementById('txt-meta-agua-display');
    var elBadgePct = document.getElementById('badge-porcentaje-agua');
    var elBarra = document.getElementById('barra-progreso-agua');

    if (elConsumo) elConsumo.textContent = consumo.toLocaleString('es-ES');
    if (elMeta) elMeta.textContent = meta.toLocaleString('es-ES');
    if (elMetaDisp) elMetaDisp.textContent = meta.toLocaleString('es-ES');
    if (elBadgePct) elBadgePct.textContent = pct + '%';
    if (elBarra) elBarra.style.width = pct + '%';

    // Actualizar el maniquí frontal solo si Nutrición es la pestaña activa
    if (window.SECCION_EP_ACTIVA === 'nutricion' && typeof actualizarLlenadoSiluetaAvatar === 'function') {
        actualizarLlenadoSiluetaAvatar('nutricion');
    }

    // 2. Comidas del día
    var comidasHoy = nut.comidas.filter(function(c) {
        return c.fecha === hoy;
    });

    var totalComidas = comidasHoy.length;
    var caloriasTotal = 0;
    var saludablesCount = 0;

    comidasHoy.forEach(function(c) {
        if (c.calorias) caloriasTotal += Number(c.calorias) || 0;
        if (c.calidad === 'saludable' || c.calidad === 'proteina' || c.calidad === 'balanceado') {
            saludablesCount++;
        }
    });

    var balancePct = totalComidas > 0 ? Math.round((saludablesCount / totalComidas) * 100) : 100;

    var elTotCom = document.getElementById('txt-total-comidas-hoy');
    var elCalidad = document.getElementById('txt-calidad-nutricion-hoy');
    var elCalorias = document.getElementById('txt-calorias-aprox-hoy');

    if (elTotCom) elTotCom.textContent = totalComidas;
    if (elCalidad) elCalidad.textContent = balancePct + '%';
    if (elCalorias) elCalorias.textContent = caloriasTotal + ' kcal';

    var contLista = document.getElementById('contenedor-lista-comidas-hoy');
    if (!contLista) return;

    if (comidasHoy.length === 0) {
        contLista.innerHTML = '<div style="text-align: center; padding: 24px 14px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; color: #94a3b8;">' +
            '<div style="font-size: 24px; margin-bottom: 6px;">🍽️</div>' +
            '<div style="font-weight: 700; color: #f8fafc; font-size: 13px;">No has registrado comidas hoy</div>' +
            '<div style="font-size: 11.5px; margin-top: 2px;">Toca "+ Registrar Comida" para llevar el control nutricional de tu jornada.</div>' +
            '</div>';
        return;
    }

    var momentosIcons = {
        'desayuno': '🌅 Desayuno',
        'almuerzo': '☀️ Almuerzo',
        'merienda': '🥪 Merienda / Snack',
        'cena': '🌙 Cena',
        'pre_post': '⚡ Pre/Post Entreno',
        'extra': '🍎 Extra'
    };

    var calidadBadges = {
        'saludable': { label: 'Saludable', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
        'balanceado': { label: 'Balanceado', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
        'proteina': { label: 'Alto en Proteína', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
        'cheat': { label: 'Cheat / Libre', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
    };

    var html = '';
    comidasHoy.forEach(function(c) {
        var mLabel = momentosIcons[c.tipo] || c.tipo;
        var qMeta = calidadBadges[c.calidad] || calidadBadges['saludable'];

        html += '<div class="comida-item-row">' +
            '<div style="display: flex; align-items: center; gap: 10px;">' +
                '<div style="font-size: 18px;">🥗</div>' +
                '<div>' +
                    '<div style="display: flex; align-items: center; gap: 8px;">' +
                        '<span style="font-size: 13px; font-weight: 700; color: #f8fafc;">' + (c.nombre || 'Comida sin nombre') + '</span>' +
                        '<span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px; color: ' + qMeta.color + '; background: ' + qMeta.bg + ';">' + qMeta.label + '</span>' +
                    '</div>' +
                    '<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">' +
                        '<span>' + mLabel + '</span> · <span>' + (c.hora || '--:--') + '</span>' +
                        (c.calorias ? ' · <span style="color: #f59e0b; font-weight: 600;">' + c.calorias + ' kcal</span>' : '') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button type="button" onclick="eliminarComidaNutricion(\'' + c.id + '\')" title="Eliminar registro" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;">✕</button>' +
        '</div>';
    });

    contLista.innerHTML = html;
}

function agregarAgua(ml) {
    inicializarNutricionYDescanso();
    var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
    var actual = Number(APP_STATE.nutricion.registrosAgua[hoy]) || 0;
    var nuevo = Math.max(0, actual + ml);
    APP_STATE.nutricion.registrosAgua[hoy] = nuevo;

    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) {
        MonarcaDB.save(APP_STATE);
    }
    renderizarModuloNutricion();

    if (typeof mostrarToastMonarca === 'function') {
        if (ml > 0) {
            mostrarToastMonarca('+' + ml + ' ml de agua registrados (' + nuevo + ' ml hoy)', '💧');
        } else {
            mostrarToastMonarca('Consumo corregido a ' + nuevo + ' ml', '💧');
        }
    }
}

function reiniciarAguaHoy() {
    if (!confirm('¿Deseas reiniciar a 0 ml el contador de agua de hoy?')) return;
    inicializarNutricionYDescanso();
    var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
    APP_STATE.nutricion.registrosAgua[hoy] = 0;
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    renderizarModuloNutricion();
}

function editarMetaAgua() {
    inicializarNutricionYDescanso();
    var m = document.getElementById('modal-meta-agua');
    var inp = document.getElementById('input-nueva-meta-agua');
    if (inp) inp.value = APP_STATE.nutricion.metaAguaMl || 2500;
    if (m) m.style.display = 'flex';
}

function guardarMetaAgua() {
    var inp = document.getElementById('input-nueva-meta-agua');
    if (!inp) return;
    var v = parseInt(inp.value, 10);
    if (!v || v <= 0) {
        alert('Ingresa una meta válida en mililitros.');
        return;
    }
    inicializarNutricionYDescanso();
    APP_STATE.nutricion.metaAguaMl = v;
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    var m = document.getElementById('modal-meta-agua');
    if (m) m.style.display = 'none';
    renderizarModuloNutricion();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Meta de agua actualizada a ' + v.toLocaleString('es-ES') + ' ml', '🎯');
    }
}

function abrirModalNuevaComida() {
    var m = document.getElementById('modal-registro-comida');
    if (!m) return;
    var inHora = document.getElementById('input-comida-hora');
    var inNom = document.getElementById('input-comida-nombre');
    var inCal = document.getElementById('input-comida-calorias');

    if (inNom) inNom.value = '';
    if (inCal) inCal.value = '';
    if (inHora) {
        var d = new Date();
        var h = String(d.getHours()).padStart(2, '0');
        var min = String(d.getMinutes()).padStart(2, '0');
        inHora.value = h + ':' + min;
    }
    m.style.display = 'flex';
    setTimeout(function() { if (inNom) inNom.focus(); }, 100);
}

function cerrarModalNuevaComida() {
    var m = document.getElementById('modal-registro-comida');
    if (m) m.style.display = 'none';
}

function guardarComidaNutricion() {
    var inTipo = document.getElementById('input-comida-tipo');
    var inNom = document.getElementById('input-comida-nombre');
    var inHora = document.getElementById('input-comida-hora');
    var inCal = document.getElementById('input-comida-calorias');
    var inQ = document.getElementById('input-comida-calidad');

    if (!inNom || !inNom.value.trim()) {
        alert('Por favor ingresa los alimentos o nombre del plato.');
        return;
    }

    inicializarNutricionYDescanso();
    var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];

    var nuevaComida = {
        id: 'COM-' + Date.now(),
        fecha: hoy,
        tipo: inTipo ? inTipo.value : 'almuerzo',
        nombre: inNom.value.trim(),
        hora: inHora ? inHora.value : '12:00',
        calorias: inCal && inCal.value ? parseInt(inCal.value, 10) : 0,
        calidad: inQ ? inQ.value : 'saludable'
    };

    APP_STATE.nutricion.comidas.unshift(nuevaComida);

    if (typeof sumarExp === 'function') sumarExp(10);
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);

    cerrarModalNuevaComida();
    renderizarModuloNutricion();

    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Comida registrada exitosamente (+10 EXP Disciplina)', '🥗');
    }
}

function eliminarComidaNutricion(id) {
    if (!confirm('¿Deseas eliminar este registro de comida?')) return;
    inicializarNutricionYDescanso();
    APP_STATE.nutricion.comidas = APP_STATE.nutricion.comidas.filter(function(c) {
        return c.id !== id;
    });
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    renderizarModuloNutricion();
}

// --------------------------------------------------------------------------
// MÓDULO 3: DESCANSO & SUEÑO
// --------------------------------------------------------------------------

function renderizarModuloDescanso() {
    inicializarNutricionYDescanso();
    var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
    var sueno = APP_STATE.sueno;

    var registroHoy = sueno.registros.find(function(r) {
        return r.fecha === hoy;
    });

    var elHoras = document.getElementById('txt-horas-sueno-hoy');
    var elMetaH = document.getElementById('txt-meta-sueno-horas');
    var elHorario = document.getElementById('txt-horario-sueno-hoy');
    var elBadgeQ = document.getElementById('badge-calidad-sueno-hoy');
    var elTxtBono = document.getElementById('txt-efecto-recuperacion-sueno');
    var elBadgeBono = document.getElementById('badge-bono-aplicado-sueno');

    if (elMetaH) elMetaH.textContent = Number(sueno.metaHoras || 8).toFixed(1);

    if (registroHoy) {
        var h = Number(registroHoy.horasDormidas) || 0;
        if (elHoras) elHoras.textContent = h.toFixed(1);
        if (elHorario) {
            elHorario.textContent = 'Acostarse: ' + (registroHoy.horaDormir || '--:--') + ' · Despertar: ' + (registroHoy.horaDespertar || '--:--') + (registroHoy.notas ? ' · "' + registroHoy.notas + '"' : '');
        }

        var calidadConfig = {
            'reparador': { text: '🌟 Reparador / Óptimo', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
            'bueno': { text: '😊 Bueno / Normal', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
            'regular': { text: '😐 Regular', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
            'insuficiente': { text: '😫 Insuficiente', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
        };
        var qc = calidadConfig[registroHoy.calidad] || calidadConfig['bueno'];
        if (elBadgeQ) {
            elBadgeQ.textContent = qc.text;
            elBadgeQ.style.color = qc.color;
            elBadgeQ.style.background = qc.bg;
            elBadgeQ.style.borderColor = qc.color;
        }

        if (h >= 7.5 && (registroHoy.calidad === 'reparador' || registroHoy.calidad === 'bueno')) {
            if (elTxtBono) elTxtBono.textContent = '¡Sueño óptimo registrado! Se ha acelerado la regeneración muscular y neural del avatar (-15% fatiga).';
            if (elBadgeBono) {
                elBadgeBono.textContent = '-15% Fatiga Avatar';
                elBadgeBono.style.color = '#34d399';
            }
        } else if (h >= 6.5) {
            if (elTxtBono) elTxtBono.textContent = 'Descanso adecuado. El avatar mantiene un nivel de recuperación estable (-10% fatiga).';
            if (elBadgeBono) {
                elBadgeBono.textContent = '-10% Fatiga';
                elBadgeBono.style.color = '#38bdf8';
            }
        } else {
            if (elTxtBono) elTxtBono.textContent = 'Sueño insuficiente (<6.5h). Se recomienda una siesta diurna de 20-30 min para regenerar foco.';
            if (elBadgeBono) {
                elBadgeBono.textContent = 'Alerta Fatiga';
                elBadgeBono.style.color = '#f87171';
            }
        }
    } else {
        if (elHoras) elHoras.textContent = '0.0';
        if (elHorario) elHorario.textContent = 'No hay registro de sueño para hoy. Toca "+ Registrar Sueño".';
        if (elBadgeQ) {
            elBadgeQ.textContent = 'Pendiente';
            elBadgeQ.style.color = '#818cf8';
            elBadgeQ.style.background = 'rgba(99,102,241,0.12)';
            elBadgeQ.style.borderColor = 'rgba(99,102,241,0.3)';
        }
        if (elTxtBono) elTxtBono.textContent = 'Registra tus horas de descanso para aplicar el bono de recuperación a la fatiga del avatar.';
        if (elBadgeBono) {
            elBadgeBono.textContent = '+0% Recuperación';
            elBadgeBono.style.color = '#94a3b8';
        }
    }

    // Historial semanal de sueño (últimos 7 registros)
    var contHistorial = document.getElementById('contenedor-historial-sueno-semanal');
    if (!contHistorial) return;

    var ultimos = (sueno.registros || []).slice(0, 7);
    if (ultimos.length === 0) {
        contHistorial.innerHTML = '<div style="text-align: center; padding: 18px; color: #64748b; font-size: 12px; background: rgba(255,255,255,0.02); border-radius: 10px;">Aún no tienes noches registradas en el historial.</div>';
        return;
    }

    var hHtml = '';
    ultimos.forEach(function(r) {
        var calText = r.calidad === 'reparador' ? '🌟 Reparador' : (r.calidad === 'bueno' ? '😊 Bueno' : (r.calidad === 'regular' ? '😐 Regular' : '😫 Insuficiente'));
        hHtml += '<div class="sueno-item-row">' +
            '<div style="display: flex; align-items: center; gap: 10px;">' +
                '<span style="font-size: 16px;">🌙</span>' +
                '<div>' +
                    '<div style="font-size: 12.5px; font-weight: 700; color: #f8fafc;">' + r.fecha + ' · <span style="color: #a5b4fc;">' + Number(r.horasDormidas).toFixed(1) + ' horas</span></div>' +
                    '<div style="font-size: 11px; color: #94a3b8;">' + (r.horaDormir || '--:--') + ' a ' + (r.horaDespertar || '--:--') + ' · ' + calText + '</div>' +
                '</div>' +
            '</div>' +
            '<button type="button" onclick="eliminarRegistroSueno(\'' + r.id + '\')" title="Eliminar registro" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px;">✕</button>' +
        '</div>';
    });
    contHistorial.innerHTML = hHtml;

    if (window.SECCION_EP_ACTIVA === 'descanso' && typeof actualizarLlenadoSiluetaAvatar === 'function') {
        actualizarLlenadoSiluetaAvatar('descanso');
    }
}

function abrirModalRegistroSueno() {
    inicializarNutricionYDescanso();
    var m = document.getElementById('modal-registro-sueno');
    if (!m) return;
    var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
    var reg = APP_STATE.sueno.registros.find(function(r) { return r.fecha === hoy; });

    var inH = document.getElementById('input-sueno-horas');
    var inA = document.getElementById('input-sueno-acostarse');
    var inD = document.getElementById('input-sueno-despertar');
    var inQ = document.getElementById('input-sueno-calidad');
    var inN = document.getElementById('input-sueno-notas');

    if (reg) {
        if (inH) inH.value = reg.horasDormidas;
        if (inA) inA.value = reg.horaDormir || '23:30';
        if (inD) inD.value = reg.horaDespertar || '07:00';
        if (inQ) inQ.value = reg.calidad || 'reparador';
        if (inN) inN.value = reg.notas || '';
    } else {
        if (inH) inH.value = '7.5';
        if (inA) inA.value = '23:30';
        if (inD) inD.value = '07:00';
        if (inQ) inQ.value = 'reparador';
        if (inN) inN.value = '';
    }
    m.style.display = 'flex';
}

function cerrarModalRegistroSueno() {
    var m = document.getElementById('modal-registro-sueno');
    if (m) m.style.display = 'none';
}

function guardarRegistroSueno() {
    var inH = document.getElementById('input-sueno-horas');
    var inA = document.getElementById('input-sueno-acostarse');
    var inD = document.getElementById('input-sueno-despertar');
    var inQ = document.getElementById('input-sueno-calidad');
    var inN = document.getElementById('input-sueno-notas');

    var horas = parseFloat(inH ? inH.value : 0);
    if (isNaN(horas) || horas <= 0) {
        alert('Por favor ingresa un número válido de horas dormidas.');
        return;
    }

    inicializarNutricionYDescanso();
    var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];

    // Eliminar si ya existía para hoy
    APP_STATE.sueno.registros = APP_STATE.sueno.registros.filter(function(r) {
        return r.fecha !== hoy;
    });

    var nuevoRegistro = {
        id: 'SUE-' + Date.now(),
        fecha: hoy,
        horasDormidas: horas,
        horaDormir: inA ? inA.value : '23:30',
        horaDespertar: inD ? inD.value : '07:00',
        calidad: inQ ? inQ.value : 'reparador',
        notas: inN ? inN.value.trim() : ''
    };

    APP_STATE.sueno.registros.unshift(nuevoRegistro);

    // Bono de Recuperación del Avatar en la fatiga acumulada
    if (horas >= 7 && APP_STATE.fatiga) {
        var factorReduccion = (nuevoRegistro.calidad === 'reparador' || horas >= 8) ? 0.85 : 0.90;
        Object.keys(APP_STATE.fatiga).forEach(function(k) {
            if (typeof APP_STATE.fatiga[k] === 'number') {
                APP_STATE.fatiga[k] = Math.max(0, Math.round(APP_STATE.fatiga[k] * factorReduccion));
            }
        });
    }

    if (typeof sumarExp === 'function') sumarExp(25);
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);

    cerrarModalRegistroSueno();
    renderizarModuloDescanso();

    // Actualizar métricas del avatar si está en la vista
    if (typeof actualizarDesgasteDiarioAutomatico === 'function') actualizarDesgasteDiarioAutomatico();
    if (typeof renderizarGraficoGeneralAvatar === 'function') renderizarGraficoGeneralAvatar();

    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Descanso registrado exitosamente (+25 EXP Regeneración Avatar)', '🌙');
    }
}

function eliminarRegistroSueno(id) {
    if (!confirm('¿Deseas eliminar este registro de descanso?')) return;
    inicializarNutricionYDescanso();
    APP_STATE.sueno.registros = APP_STATE.sueno.registros.filter(function(r) {
        return r.id !== id;
    });
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    renderizarModuloDescanso();
}

function agregarSiestaHoy(minutos) {
    inicializarNutricionYDescanso();
    var hoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
    var actual = Number(APP_STATE.sueno.siestas[hoy]) || 0;
    APP_STATE.sueno.siestas[hoy] = actual + minutos;

    // Alivio de fatiga mental por siesta
    if (APP_STATE.fatiga && typeof APP_STATE.fatiga.mente === 'number') {
        APP_STATE.fatiga.mente = Math.max(0, APP_STATE.fatiga.mente - 5);
    }

    if (typeof sumarExp === 'function') sumarExp(10);
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);

    renderizarModuloDescanso();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Siesta de ' + minutos + ' min registrada (-5% fatiga mental, +10 EXP)', '💤');
    }
}

// Exportar funciones a window
if (typeof window !== 'undefined') {
    window.cambiarSeccionEstadoPersonal = cambiarSeccionEstadoPersonal;
    window.renderizarModuloNutricion = renderizarModuloNutricion;
    window.agregarAgua = agregarAgua;
    window.reiniciarAguaHoy = reiniciarAguaHoy;
    window.editarMetaAgua = editarMetaAgua;
    window.guardarMetaAgua = guardarMetaAgua;
    window.abrirModalNuevaComida = abrirModalNuevaComida;
    window.cerrarModalNuevaComida = cerrarModalNuevaComida;
    window.guardarComidaNutricion = guardarComidaNutricion;
    window.eliminarComidaNutricion = eliminarComidaNutricion;
    window.renderizarModuloDescanso = renderizarModuloDescanso;
    window.abrirModalRegistroSueno = abrirModalRegistroSueno;
    window.cerrarModalRegistroSueno = cerrarModalRegistroSueno;
    window.guardarRegistroSueno = guardarRegistroSueno;
    window.eliminarRegistroSueno = eliminarRegistroSueno;
    window.agregarSiestaHoy = agregarSiestaHoy;
}




