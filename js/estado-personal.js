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
        categoria: "Tren Superior",
        icono: "⚔️",
        subpartes: [
            {
                clave: "pectoral",
                nombre: "Pectoral Mayor / Menor",
                clavesFatiga: ["pect_mayor", "pect_menor"]
            },
            {
                clave: "dorsales",
                nombre: "Dorsales (Latissimus Dorsi)",
                clavesFatiga: ["dorsales"]
            }
        ]
    },
    {
        categoria: "Brazos y Hombros",
        icono: "🛡️",
        subpartes: [
            {
                clave: "hombros",
                nombre: "Hombros (Deltoides)",
                clavesFatiga: ["delt_ant", "delt_lat", "delt_post"]
            },
            {
                clave: "biceps",
                nombre: "Bíceps",
                clavesFatiga: ["biceps"]
            },
            {
                clave: "triceps",
                nombre: "Tríceps",
                clavesFatiga: ["triceps"]
            },
            {
                clave: "antebrazos",
                nombre: "Antebrazos",
                clavesFatiga: ["antebrazos"]
            }
        ]
    },
    {
        categoria: "Zona Media y Estabilidad",
        icono: "⚡",
        subpartes: [
            {
                clave: "core",
                nombre: "Core / Abdominales",
                clavesFatiga: ["core"]
            },
            {
                clave: "cadera",
                nombre: "Cadera y Movilidad",
                clavesFatiga: ["cadera"]
            },
            {
                clave: "trapecios",
                nombre: "Trapecios",
                clavesFatiga: ["trapecios"]
            },
            {
                clave: "lumbares",
                nombre: "Lumbares",
                clavesFatiga: ["lumbares"]
            }
        ]
    },
    {
        categoria: "Tren Inferior",
        icono: "🦵",
        subpartes: [
            {
                clave: "cuadriceps",
                nombre: "Cuádriceps",
                clavesFatiga: ["cuadriceps"]
            },
            {
                clave: "isquios",
                nombre: "Isquiotibiales (Femorales)",
                clavesFatiga: ["isquios"]
            },
            {
                clave: "gluteos",
                nombre: "Glúteos",
                clavesFatiga: ["gluteos"]
            },
            {
                clave: "pantorrillas",
                nombre: "Pantorrillas (Gemelos y Sóleo)",
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
                nombre: "Movilidad de Muñecas y Tobillos",
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
            fill: '#ffffff',
            stroke: '#d1d5db',
            label: '0-15% · Óptimo',
            levelText: 'Completamente fresco y listo para rendir',
            cardBg: '#ffffff',
            cardBorder: '#e5e7eb',
            cardText: '#111827',
            cardVal: '#6b7280',
            dot: '#d1d5db',
            color: '#6b7280',
            bg: '#ffffff',
            border: '#e5e7eb',
            texto: '#111827',
            clase: 'status-optimo'
        };
    }
    if (v <= 40) {
        return {
            fill: '#e5e7eb',
            stroke: '#9ca3af',
            label: '16-40% · Carga Leve',
            levelText: 'Carga ligera, óptimo para entrenar',
            cardBg: '#f3f4f6',
            cardBorder: '#d1d5db',
            cardText: '#111827',
            cardVal: '#374151',
            dot: '#9ca3af',
            color: '#4b5563',
            bg: '#f3f4f6',
            border: '#d1d5db',
            texto: '#111827',
            clase: 'status-activo'
        };
    }
    if (v <= 70) {
        return {
            fill: '#4b5563',
            stroke: '#374151',
            label: '41-70% · Fatiga Media',
            levelText: 'Fatiga media acumulada, técnica cuidada',
            cardBg: '#374151',
            cardBorder: '#4b5563',
            cardText: '#ffffff',
            cardVal: '#ffffff',
            dot: '#e5e7eb',
            color: '#ffffff',
            bg: '#374151',
            border: '#4b5563',
            texto: '#ffffff',
            clase: 'status-moderado'
        };
    }
    return {
        fill: '#111827',
        stroke: '#000000',
        label: '71-100% · Carga Alta',
        levelText: 'Sobrecarga elevada, se sugiere descanso',
        cardBg: '#111827',
        cardBorder: '#000000',
        cardText: '#ffffff',
        cardVal: '#ffffff',
        dot: '#ffffff',
        color: '#ffffff',
        bg: '#111827',
        border: '#000000',
        texto: '#ffffff',
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
                var mins = Number(q.tiempoMinutos) || 15;
                q.tiempoRestante = mins * 60;
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
    actualizarDesgasteDiarioAutomatico();
    renderizarGraficoGeneralAvatar();
    renderizarDesgloseCuerpoAnatomico();
    renderizarDesgloseMenteCognitiva();
    iniciarMonitorMedianocheDiaria();
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
    <div class="hud-muscle-card" style="border-left: 4px solid #111827; background: #ffffff; border-radius: 12px; padding: 14px; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
        <div class="hud-muscle-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="hud-muscle-region" style="font-size: 11px; font-weight: 800; color: #6b7280; letter-spacing: 0.5px; text-transform: uppercase;">${meta.region}</span>
            <span class="subpart-card-status" style="font-size: 11px; font-weight: 700; background: #f3f4f6; color: #111827; padding: 3px 8px; border-radius: 6px; border: 1px solid #e5e7eb;">${estiloInfo.label}</span>
        </div>
        <h3 class="hud-muscle-title" style="margin: 6px 0 8px 0; font-size: 18px; font-weight: 800; color: #111827;">${meta.icono} ${meta.nombre}</h3>
        <div class="hud-fatigue-big" style="font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 8px;">
            ${val}% <span style="font-size: 13px; font-weight: 600; color: #6b7280;">Nivel de Desgaste</span>
        </div>
        <div class="hud-progress-track" style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 9999px; overflow: hidden; margin-bottom: 12px;">
            <div class="hud-progress-fill" style="width: ${val}%; height: 100%; background: #111827; border-radius: 9999px; transition: width 0.3s ease;"></div>
        </div>
        <div class="hud-recovery-tip" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; font-size: 12px; color: #4b5563; line-height: 1.45;">
            <strong style="color: #111827;">Consejo de Recuperación:</strong> ${meta.descanso}
        </div>
    </div>
    <div style="margin-top: 14px;">
        <div class="hud-quick-chips-title" style="font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 6px;">Selección Rápida de Zona:</div>
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
        return `fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.4"`;
    }

    var html = `
    <!-- BANNER DE TIMER DE CIERRE DE JORNADA & RESETEO DIARIO -->
    <div class="daily-reset-timer-banner" style="margin-bottom: 16px; padding: 14px 18px; border-radius: 14px; background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: #111827; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
                    ⏳
                </div>
                <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 11px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 0.6px;">REINICIO DIARIO AUTOMÁTICO</span>
                        <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; background: #f3f4f6; color: #374151; padding: 2px 8px; border-radius: 9999px; border: 1px solid #e5e7eb;">
                            <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span> EN VIVO
                        </span>
                    </div>
                    <div style="font-size: 12.5px; color: #4b5563; margin-top: 3px;">
                        Cierre de jornada y archivado en calendario en: <strong class="reloj-cierre-jornada-tiempo" style="color: #111827; font-family: monospace; font-size: 13.5px; font-weight: 800; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; border: 1px solid #e5e7eb;">--h --m --s</strong>
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" class="btn-cerrar-jornada-accion" onclick="ejecutarMecanicaCierreDiarioManual()" title="Archivar los porcentajes actuales en el calendario y restablecer todo estrictamente a 0%">
                    <span>🌙</span> Cerrar Jornada Ahora (Nuevo Día 0%)
                </button>
            </div>
        </div>
        <div style="margin-top: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 4px;">
                <span>00:00 AM (Inicio 0%)</span>
                <span>Progreso de Jornada</span>
                <span>00:00 AM (Medianoche)</span>
            </div>
            <div style="height: 5px; width: 100%; background: #f3f4f6; border-radius: 9999px; overflow: hidden; border: 1px solid #e5e7eb;">
                <div class="barra-jornada-progreso" style="height: 100%; width: 50%; background: #111827; border-radius: 9999px; transition: width 1s linear;"></div>
            </div>
        </div>
    </div>

    <!-- 1. BARRA DE DESGASTE GENERAL DIARIO DEL AVATAR -->
    <div class="avatar-metrics-bar" style="margin-bottom: 18px; border-radius: 16px; background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.03);">
        <div class="general-wear-metric">
            <div class="general-wear-circle" style="border: 3px solid #111827; color: #111827; background: #ffffff;">
                ${metricas.general}%
            </div>
            <div class="general-wear-meta">
                <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #111827;">Desgaste General Diario del Avatar</h4>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280;">Porcentaje ponderado de carga física y fatiga neural acumulada.</p>
                <div style="font-size: 11px; font-weight: 700; color: #6b7280; margin-top: 3px;">
                    📅 ${hoyFechaStr} · <span style="color: #111827; font-weight: 800;">● Actualización automática diaria</span>
                </div>
            </div>
        </div>
        <div class="general-breakdown-chips">
            <div class="breakdown-chip" style="background: #f9fafb; border: 1px solid #e5e7eb; color: #111827;">
                <span>🦾 Cuerpo:</span> <strong>${metricas.cuerpo}% · ${estadoCuerpo.label}</strong>
            </div>
            <div class="breakdown-chip" style="background: #f9fafb; border: 1px solid #e5e7eb; color: #111827;">
                <span>🧠 Mente:</span> <strong>${metricas.mente}% · ${estadoMente.label}</strong>
            </div>
        </div>
    </div>

    <!-- 2. ESQUEMA ANATÓMICO CORPORAL EN TONALIDADES MINIMALISTAS DE BLANCO A GRIS OSCURO -->
    <div class="card heatmap-dashboard-card" style="margin-bottom: 22px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
            <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #111827;">📊 Carga & Fatiga Física Diaria</h3>
                <p style="margin: 3px 0 0 0; font-size: 12px; color: #6b7280;">Esquema de desgaste actual por grupos musculares y estado metabólico del avatar.</p>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 7px 14px; min-width: 130px;">
                    <div style="font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">CARGA PROMEDIO DE HOY</div>
                    <div style="font-size: 18px; font-weight: 800; color: #111827; margin-top: 2px;">${metricas.cuerpo}%</div>
                </div>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 7px 14px; min-width: 140px;">
                    <div style="font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">ÚLTIMO CIERRE DIARIO</div>
                    <div style="font-size: 13px; font-weight: 700; color: #374151; margin-top: 2px;">${(APP_STATE.desgasteDiario && APP_STATE.desgasteDiario.ultimoCierre) ? APP_STATE.desgasteDiario.ultimoCierre : 'Registro local activo'}</div>
                </div>
            </div>
        </div>

        <div class="heatmap-layout">
            <!-- COLUMNA 1: SILUETA ANATÓMICA CORPORAL (FRONTAL & DORSAL) -->
            <div class="body-diagram-box">
                <div style="display: flex; justify-content: space-around; margin-bottom: 8px;">
                    <span style="font-size: 11px; font-weight: 800; color: #111827; letter-spacing: 0.5px;">ANTERIOR (FRENTE)</span>
                    <span style="font-size: 11px; font-weight: 800; color: #111827; letter-spacing: 0.5px;">POSTERIOR (ESPALDA)</span>
                </div>

                <div class="body-diagram-svg-container">
                    <svg viewBox="0 0 440 330" class="body-silhouette-svg">
                        <defs>
                            <filter id="hud-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#111827" flood-opacity="0.35"/>
                            </filter>
                        </defs>

                        <!-- SILUETA FRONTAL (X: 110 centro) -->
                        <g id="silueta-frontal">
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

                        <!-- SILUETA DORSAL (X: 330 centro) -->
                        <g id="silueta-dorsal">
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

                <!-- LEYENDA DEL MAPA DE CALOR MINIMALISTA EN ESCALA DE GRISES -->
                <div class="heatmap-legend-box" style="margin-top: 12px; display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
                    <div class="legend-item" style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #4b5563;">
                        <span class="legend-swatch" style="width: 13px; height: 13px; border-radius: 3px; display: inline-block; background: #ffffff; border: 1.5px solid #d1d5db;"></span>
                        <span>0-15% Óptimo</span>
                    </div>
                    <div class="legend-item" style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #4b5563;">
                        <span class="legend-swatch" style="width: 13px; height: 13px; border-radius: 3px; display: inline-block; background: #e5e7eb; border: 1.5px solid #9ca3af;"></span>
                        <span>16-40% Leve</span>
                    </div>
                    <div class="legend-item" style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #4b5563;">
                        <span class="legend-swatch" style="width: 13px; height: 13px; border-radius: 3px; display: inline-block; background: #4b5563; border: 1.5px solid #374151;"></span>
                        <span>41-70% Media</span>
                    </div>
                    <div class="legend-item" style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #4b5563;">
                        <span class="legend-swatch" style="width: 13px; height: 13px; border-radius: 3px; display: inline-block; background: #111827; border: 1.5px solid #000000;"></span>
                        <span>71-100% Alta</span>
                    </div>
                </div>
            </div>

            <!-- COLUMNA 2: PANEL DE DETALLE HUD Y SELECTOR RÁPIDO -->
            <div class="heatmap-hud-panel" id="hud-panel-container">
                <!-- Se llena dinámicamente mediante actualizarHudMusculo -->
            </div>
        </div>
    </div>`;

    cont.innerHTML = html;
    actualizarHudMusculo(MUSCULO_ACTIVO_HEATMAP);
}

// ==========================================================================
// RENDERIZADO DE LAS TARJETAS COMPACTAS: 🟢 1. CUERPO
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
        var tarjetasHtml = '';

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

            tarjetasHtml += `
            <div class="subpart-compact-card ${estado.clase}" id="card-subpart-${sub.clave}" data-target-muscle="${targetMuscle}" onclick="seleccionarMusculoHeatmap('${targetMuscle}', '${sub.clave}')" title="${sub.nombre}: ${valSub}% (${estado.label})" style="cursor: pointer;">
                <div class="subpart-card-top">
                    <span class="subpart-card-name">${sub.nombre}</span>
                    <span class="subpart-card-dot"></span>
                </div>
                <div class="subpart-card-bottom">
                    <span class="subpart-card-val">${valSub}%</span>
                    <span class="subpart-card-status">${estado.label}</span>
                </div>
            </div>`;
        });

        html += `
        <div class="area-category-block">
            <div class="area-category-title">
                <span>${bloque.icono} ${bloque.categoria}</span>
                <span class="count-tag">${bloque.subpartes.length} subpartes</span>
            </div>
            <div class="subparts-compact-grid">
                ${tarjetasHtml}
            </div>
        </div>`;
    });

    cont.innerHTML = html;

    if (badgeResumen) {
        var promCuerpo = countTotalCuerpo > 0 ? Math.round(sumaTotalCuerpo / countTotalCuerpo) : 0;
        var estCuerpo = obtenerEstadoZona(promCuerpo);
        badgeResumen.innerHTML = `
            <span class="item-badge-pill" style="border:1px solid #d1d5db; background:#f3f4f6; color:#111827; font-weight:700; padding:4px 10px; border-radius:9999px; font-size:12px;">
                Desgaste Total: ${promCuerpo}% · ${estCuerpo.label}
            </span>`;
    }
}

// ==========================================================================
// RENDERIZADO DE LAS TARJETAS COMPACTAS: 🔵 2. MENTE
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
        var tarjetasHtml = '';

        bloque.subpartes.forEach(function(sub) {
            var valSub = Math.min(100, Math.max(0, Number(desgasteMente[sub.clave]) || 0));
            sumaTotalMente += valSub;
            countTotalMente++;

            var estado = obtenerEstadoZona(valSub);

            tarjetasHtml += `
            <div class="subpart-compact-card ${estado.clase}" id="card-subpart-${sub.clave}" data-target-muscle="mente" onclick="seleccionarMusculoHeatmap('mente', '${sub.clave}')" title="${sub.nombre}: ${valSub}% (${estado.label})" style="cursor: pointer;">
                <div class="subpart-card-top">
                    <span class="subpart-card-name">${sub.nombre}</span>
                    <span class="subpart-card-dot"></span>
                </div>
                <div class="subpart-card-bottom">
                    <span class="subpart-card-val">${valSub}%</span>
                    <span class="subpart-card-status">${estado.label}</span>
                </div>
            </div>`;
        });

        html += `
        <div class="area-category-block">
            <div class="area-category-title">
                <span>${bloque.icono} ${bloque.categoria}</span>
                <span class="count-tag">${bloque.subpartes.length} subpartes</span>
            </div>
            <div class="subparts-compact-grid">
                ${tarjetasHtml}
            </div>
        </div>`;
    });

    cont.innerHTML = html;

    if (badgeResumen) {
        var promMente = countTotalMente > 0 ? Math.round(sumaTotalMente / countTotalMente) : 0;
        var estMente = obtenerEstadoZona(promMente);
        badgeResumen.innerHTML = `
            <span class="item-badge-pill" style="border:1px solid #d1d5db; background:#f3f4f6; color:#111827; font-weight:700; padding:4px 10px; border-radius:9999px; font-size:12px;">
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
    "Hombros": ["delt_ant", "delt_lat", "delt_post"],
    "Pecho": ["pect_mayor", "pect_menor"],
    "Bíceps": ["biceps"],
    "Tríceps": ["triceps"],
    "Antebrazos": ["antebrazos"],
    "Trapecios": ["trapecios"],
    "Dorsales": ["dorsales"],
    "Lumbares": ["lumbares"],
    "Core": ["core"],
    "Glúteos": ["gluteos"],
    "Cadera": ["cadera"],
    "Cuádriceps": ["cuadriceps"],
    "Isquios": ["isquios"],
    "Pantorrillas": ["pantorrillas"]
};

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
    var bTodas = document.getElementById('filtro-rutina-todas');
    var bFis = document.getElementById('filtro-rutina-fisicas');
    var bMen = document.getElementById('filtro-rutina-mentales');
    if (bTodas) bTodas.classList.toggle('active', FILTRO_RUTINAS_ACTIVO === 'todas');
    if (bFis) bFis.classList.toggle('active', FILTRO_RUTINAS_ACTIVO === 'fisicas');
    if (bMen) bMen.classList.toggle('active', FILTRO_RUTINAS_ACTIVO === 'mentales');
    renderizarPortalesRutinasEjercicios();
}

function cambiarCategoriaEjercicios(cat) {
    CATEGORIA_EJERCICIOS_ACTIVA = cat || 'rutinas';
    var btnRut = document.getElementById('btn-cat-rutinas');
    var btnBanco = document.getElementById('btn-cat-banco');
    var btnMental = document.getElementById('btn-cat-gimnasio-mental');
    var btnHist = document.getElementById('btn-cat-historial');

    var secRut = document.getElementById('seccion-categoria-rutinas');
    var secBanco = document.getElementById('seccion-categoria-banco');
    var secMental = document.getElementById('seccion-categoria-gimnasio-mental');
    var secHist = document.getElementById('seccion-categoria-historial');
    var labelCrear = document.getElementById('label-btn-crear-ej');

    if (btnRut) btnRut.classList.remove('active');
    if (btnBanco) btnBanco.classList.remove('active');
    if (btnMental) btnMental.classList.remove('active');
    if (btnHist) btnHist.classList.remove('active');

    if (secRut) secRut.style.display = 'none';
    if (secBanco) secBanco.style.display = 'none';
    if (secMental) secMental.style.display = 'none';
    if (secHist) secHist.style.display = 'none';

    if (CATEGORIA_EJERCICIOS_ACTIVA === 'rutinas') {
        if (btnRut) btnRut.classList.add('active');
        if (secRut) secRut.style.display = 'block';
        if (labelCrear) labelCrear.innerText = 'Nueva Rutina';
        renderizarPortalesRutinasEjercicios();
    } else if (CATEGORIA_EJERCICIOS_ACTIVA === 'banco') {
        if (btnBanco) btnBanco.classList.add('active');
        if (secBanco) secBanco.style.display = 'block';
        if (labelCrear) labelCrear.innerText = (SUBFILTRO_BANCO_ACTIVO === 'mental') ? 'Nuevo Ej. Mental' : 'Nuevo Ej. Físico';
        if (SUBFILTRO_BANCO_ACTIVO === 'mental') {
            var contFis = document.getElementById('contenedor-ejercicios');
            var contMen = document.getElementById('contenedor-ejercicios-cerebrales');
            if (contFis) contFis.style.display = 'none';
            if (contMen) contMen.style.display = 'block';
            renderizarBancoEjerciciosCerebrales();
        } else {
            var contFis = document.getElementById('contenedor-ejercicios');
            var contMen = document.getElementById('contenedor-ejercicios-cerebrales');
            if (contFis) contFis.style.display = 'block';
            if (contMen) contMen.style.display = 'none';
            renderizarEjercicios(APP_STATE.ejercicios);
        }
    } else if (CATEGORIA_EJERCICIOS_ACTIVA === 'gimnasio-mental' || CATEGORIA_EJERCICIOS_ACTIVA === 'gimnasio') {
        if (btnMental) btnMental.classList.add('active');
        if (secMental) secMental.style.display = 'block';
        if (labelCrear) labelCrear.innerText = 'Nuevo Ejercicio Mental';
        if (typeof renderizarBarraFatigaMentalDiaria === 'function') renderizarBarraFatigaMentalDiaria();
        if (typeof renderizarMusculosMentales === 'function') renderizarMusculosMentales();
        if (typeof renderizarProtocolosDeepWork === 'function') renderizarProtocolosDeepWork();
        if (typeof renderizarMente === 'function') renderizarMente(APP_STATE.salud);
    } else if (CATEGORIA_EJERCICIOS_ACTIVA === 'historial') {
        if (btnHist) btnHist.classList.add('active');
        if (secHist) secHist.style.display = 'block';
        if (labelCrear) labelCrear.innerText = 'Nueva Rutina';
        renderizarGym(APP_STATE.gym);
    }
}

function accionBotonCrearEjercicios() {
    if (CATEGORIA_EJERCICIOS_ACTIVA === 'banco') {
        if (SUBFILTRO_BANCO_ACTIVO === 'mental') {
            abrirModalNuevoEjercicioCerebral();
        } else {
            abrirModalNuevoEjercicio();
        }
    } else if (CATEGORIA_EJERCICIOS_ACTIVA === 'gimnasio-mental' || CATEGORIA_EJERCICIOS_ACTIVA === 'gimnasio') {
        abrirModalNuevoEjercicioCerebral();
    } else {
        abrirModalNuevaRutina();
    }
}

function renderizarPortalesRutinasEjercicios() {
    var cont = document.getElementById('contenedor-portales-rutinas-ejercicios');
    if (!cont) return;

    var rList = APP_STATE.rutinas || [];
    if (!rList || rList.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 35px 20px; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">📋</span>
            <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 16px;">No tienes rutinas creadas</h4>
            <p style="color: #6b7280; font-size: 13px; max-width: 420px; margin: 0 auto 16px auto;">
                Arma tus sesiones de entrenamiento físico, cognitivo o híbrido seleccionando ejercicios de tus bancos.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevaRutina()">
                ➕ Crear Primera Rutina
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
        <div style="text-align: center; padding: 30px 20px; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 14px; color: #6b7280; font-size: 13px;">
            No tienes rutinas en la categoría seleccionada.<br>
            <button class="btn-subfiltro-ej" onclick="abrirModalNuevaRutina()" style="margin-top: 10px;">➕ Crear Rutina</button>
        </div>`;
        return;
    }

    var html = '';
    filtradas.forEach(function(item) {
        var rut = item.r;
        var idx = item.idx;
        var esMental = (rut.tipo === 'mental' || rut.tipo === 'cerebral');
        var esHibrida = (rut.tipo === 'hibrida');
        var numEj = (rut.ejercicios && rut.ejercicios.length) ? rut.ejercicios.length : 0;
        var badgeEj = numEj + (numEj === 1 ? ' Ejercicio' : ' Ejercicios');
        var rutCodigo = rut.codigo || (esMental ? ('COG-' + (idx + 1)) : (esHibrida ? ('HIB-' + (idx + 1)) : ('RUT-' + (idx + 1))));
        var cleanRank = (rut.rankLabel || (esMental ? 'MENTAL · ENFOQUE' : (esHibrida ? 'HÍBRIDA · INTEGRAL' : 'SESIÓN DE FUERZA'))).replace(/[^\w\s·-]/gi, '').trim();

        var badgeTipo = esMental ? '<span class="muscle-tag" style="background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; font-weight:700;">🧠 Mental</span>' :
                        (esHibrida ? '<span class="muscle-tag" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a; font-weight:700;">⚡ Híbrida</span>' :
                        '<span class="muscle-tag" style="background:#f3f4f6; color:#111827; border:1px solid #e5e7eb; font-weight:700;">🏋️ Física</span>');

        var borderAccent = esMental ? '#2563eb' : (esHibrida ? '#f59e0b' : '#111827');

        html += `
        <div class="quest-card" onclick="abrirDetalleRutina(${idx})" style="position: relative; cursor: pointer; margin-bottom: 12px; border-radius: 14px; border-left: 4px solid ${borderAccent};">
            <div class="quest-icon-box" style="font-weight: 800; font-size: 11px; letter-spacing: 0.5px; color: #111827;">${rutCodigo}</div>
            <div style="flex:1; padding-left: 4px;">
              <span class="quest-badge-rank">${cleanRank}</span>
              <p class="quest-card-name" style="margin:4px 0 6px 0;color:#111827;font-size:15px;font-weight:700;">${rut.nombre}</p>
              <div class="muscle-tags-row">
                ${badgeTipo}
                <span class="muscle-tag">${badgeEj}</span>
                ${rut.descripcion ? `<span class="muscle-tag" style="background:none; border:none; color:#6b7280;">${rut.descripcion}</span>` : ''}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn-delete-row" title="Eliminar rutina" onclick="eliminarRutina(${idx}, event)" style="background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; padding: 6px; border-radius: 6px;">✕</button>
                <span class="quest-arrow" style="font-size: 13px; font-weight: 700; color: #111827;">Entrar ›</span>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function filtrarSubcategoriaEjercicios(subfiltro) {
    SUBFILTRO_BANCO_ACTIVO = subfiltro;
    var btns = document.querySelectorAll('#seccion-categoria-banco .btn-subfiltro-ej');
    btns.forEach(function(b) {
        if (b.getAttribute('data-subfiltro') === subfiltro) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    var contFisicos = document.getElementById('contenedor-ejercicios');
    var contMentales = document.getElementById('contenedor-ejercicios-cerebrales');
    var labelCrear = document.getElementById('label-btn-crear-ej');

    if (subfiltro === 'mental') {
        if (contFisicos) contFisicos.style.display = 'none';
        if (contMentales) contMentales.style.display = 'block';
        if (labelCrear) labelCrear.innerText = 'Nuevo Ej. Mental';
        renderizarBancoEjerciciosCerebrales();
    } else {
        if (contFisicos) contFisicos.style.display = 'block';
        if (contMentales) contMentales.style.display = 'none';
        if (labelCrear) labelCrear.innerText = 'Nuevo Ej. Físico';
        renderizarEjercicios(APP_STATE.ejercicios);
    }
}

function toggleChipMusculo(btn) {
    var cat = btn.getAttribute('data-cat');
    if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        CHIPS_SELECCIONADOS_MUSCULOS = CHIPS_SELECCIONADOS_MUSCULOS.filter(function(c) { return c !== cat; });
    } else {
        btn.classList.add('selected');
        if (!CHIPS_SELECCIONADOS_MUSCULOS.includes(cat)) {
            CHIPS_SELECCIONADOS_MUSCULOS.push(cat);
        }
    }
}

function abrirModalNuevoEjercicio() {
    CHIPS_SELECCIONADOS_MUSCULOS = [];
    var chips = document.querySelectorAll('.muscle-chip-btn');
    chips.forEach(function(c) { c.classList.remove('selected'); });
    var inNom = document.getElementById('modal-ejercicio-nombre');
    var inDesc = document.getElementById('modal-ejercicio-desc');
    var inFat = document.getElementById('modal-ejercicio-fatiga');
    if (inNom) inNom.value = "";
    if (inDesc) inDesc.value = "";
    if (inFat) inFat.value = "25";
    var m = document.getElementById('modal-nuevo-ejercicio');
    if (m) m.style.display = 'flex';
}

function cerrarModalNuevoEjercicio() {
    var m = document.getElementById('modal-nuevo-ejercicio');
    if (m) m.style.display = 'none';
}

function confirmarAgregarEjercicio() {
    var inNom = document.getElementById('modal-ejercicio-nombre');
    var inTipo = document.getElementById('modal-ejercicio-tipo');
    var inDesc = document.getElementById('modal-ejercicio-desc');
    var inMusc = document.getElementById('modal-ejercicio-musculo-principal');
    var inSeries = document.getElementById('modal-ejercicio-series');
    var inReps = document.getElementById('modal-ejercicio-reps');
    var inFat = document.getElementById('modal-ejercicio-fatiga');

    var nom = inNom ? inNom.value.trim() : "";
    var tipoEj = inTipo ? inTipo.value : "gym";
    var desc = inDesc ? inDesc.value.trim() : "";
    var muscPrincipal = inMusc ? inMusc.value : "Pectoral Mayor";
    var series = inSeries ? (Number(inSeries.value) || 4) : 4;
    var reps = inReps ? inReps.value.trim() : "8-10 reps";
    var fatigaPct = inFat ? (Number(inFat.value) || 25) : 25;

    if (!nom) {
        alert("Por favor ingresa el nombre del ejercicio.");
        if (inNom) inNom.focus();
        return;
    }

    if (!APP_STATE.ejercicios) APP_STATE.ejercicios = [];

    var categoriasFinales = [muscPrincipal];
    CHIPS_SELECCIONADOS_MUSCULOS.forEach(function(c) {
        if (!categoriasFinales.includes(c)) categoriasFinales.push(c);
    });

    var nuevoEjercicio = {
        id: "EJ-" + Date.now(),
        nombre: nom,
        tipo: tipoEj,
        especificaciones: desc || "Técnica biomecánica controlada.",
        descripcion: desc || "Técnica biomecánica controlada.",
        musculoPrincipal: muscPrincipal,
        series: series,
        repeticiones: reps,
        categorias: categoriasFinales,
        fatigaPorcentaje: fatigaPct
    };

    APP_STATE.ejercicios.push(nuevoEjercicio);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevoEjercicio();
    renderizarEjercicios(APP_STATE.ejercicios);
    alert("⚡ Ejercicio '" + nom + "' guardado con +" + fatigaPct + "% de impacto a " + muscPrincipal + ".");
}

function renderizarEjercicios(ejercicios) {
    var eList = ejercicios || APP_STATE.ejercicios || [];
    var cont = document.getElementById('contenedor-ejercicios');
    if (!cont) return;

    // Aplicar filtro si no es 'todos'
    var filtrados = eList;
    if (SUBFILTRO_BANCO_ACTIVO === 'gym') {
        filtrados = eList.filter(function(e) { return (e.tipo === 'gym' || !e.tipo); });
    } else if (SUBFILTRO_BANCO_ACTIVO === 'calistenia') {
        filtrados = eList.filter(function(e) { return e.tipo === 'calistenia'; });
    }

    if (!filtrados || filtrados.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">⚡</span>
            <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 16px;">No hay ejercicios en esta subcategoría</h4>
            <p style="color: #6b7280; font-size: 13px; max-width: 420px; margin: 0 auto 16px auto;">
                Crea tus ejercicios especificando series, repeticiones, zonas musculares trabajadas y nivel de fatiga.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevoEjercicio()">
                ➕ Crear Nuevo Ejercicio
            </button>
        </div>`;
        return;
    }

    var html = '';
    filtrados.forEach(function(ej) {
        var muscTarget = ej.musculoPrincipal || (ej.categorias && ej.categorias.length ? ej.categorias[0] : 'Cuerpo');
        var fatigaImpactBadge = `<span class="badge-exercise-fatiga" style="background:#111827; color:#ffffff; font-weight:800;">🎯 +${ej.fatigaPorcentaje || 20}% a ${muscTarget}</span>`;

        var muscleBadges = (ej.categorias || []).filter(function(c) { return c !== muscTarget; }).map(function(cat) {
            return `<span class="badge-exercise-muscle">${cat}</span>`;
        }).join('');

        var tipoBadge = (ej.tipo === 'calistenia')
            ? '<span class="muscle-tag" style="background: #e0f2fe; color: #0369a1; border-color: #bae6fd;">🤸 Calistenia</span>'
            : (ej.tipo === 'movilidad'
                ? '<span class="muscle-tag" style="background: #ecfdf5; color: #065f46; border-color: #a7f3d0;">🥋 Movilidad</span>'
                : '<span class="muscle-tag" style="background: #f3e8ff; color: #6b21a8; border-color: #e9d5ff;">🏋️ Gym</span>');

        var specsTexto = ej.especificaciones || ej.descripcion || 'Técnica de ejecución biomecánica controlada.';

        html += `
        <div class="exercise-card">
            <div class="exercise-card-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        ${tipoBadge}
                        <h3 class="exercise-card-name" style="margin: 0;">${ej.nombre}</h3>
                    </div>
                    <p class="exercise-card-desc">${specsTexto}</p>
                </div>
                <button class="btn-delete-row" title="Eliminar ejercicio" onclick="eliminarEjercicio('${ej.id}')" style="background:none; border:none; color:#9ca3af; font-size:16px; cursor:pointer; padding:4px 8px; border-radius:6px;">✕</button>
            </div>

            <div class="exercise-badges-row">
                ${fatigaImpactBadge}
                <span class="badge-exercise-reps">${ej.series} Series × ${ej.repeticiones}</span>
                ${muscleBadges}
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function eliminarEjercicio(id) {
    if (!confirm("¿Deseas eliminar este ejercicio?")) return;
    if (!APP_STATE.ejercicios) return;
    APP_STATE.ejercicios = APP_STATE.ejercicios.filter(function(e) {
        return String(e.id) !== String(id);
    });
    MonarcaDB.save(APP_STATE);
    renderizarEjercicios(APP_STATE.ejercicios);
}

// --- GESTIÓN DE RUTINAS DINÁMICAS ---

function cargarGym() {
    renderizarPortalesRutinas(APP_STATE.rutinas);
    renderizarGym(APP_STATE.gym);
}

function actualizarChecklistRutinaSegunTipo(tipo) {
    var contCheck = document.getElementById('modal-rutina-checklist-ejercicios');
    if (!contCheck) return;

    var tipoSel = tipo || (document.getElementById('modal-rutina-tipo') ? document.getElementById('modal-rutina-tipo').value : 'fisica');
    var eFisicos = APP_STATE.ejercicios || [];
    var eMentales = APP_STATE.ejerciciosCerebrales || [];

    var html = '';

    if (tipoSel === 'fisica' || tipoSel === 'hibrida') {
        if (tipoSel === 'hibrida') {
            html += '<div style="font-weight: 800; font-size: 11.5px; text-transform: uppercase; color: #111827; margin: 4px 0 6px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px;">🏋️ Ejercicios Físicos:</div>';
        }
        if (eFisicos.length === 0) {
            html += '<div style="color: #9ca3af; font-size: 12px; padding: 6px;">No tienes ejercicios físicos creados.</div>';
        } else {
            eFisicos.forEach(function(ej) {
                var cats = (ej.categorias || []).join(', ');
                html += `
                <label class="modal-checklist-item">
                    <input type="checkbox" name="ejercicios_rutina_check" value="${ej.id}">
                    <div style="flex: 1;">
                        <strong style="color: #111827;">${ej.nombre}</strong>
                        <div style="font-size: 11.5px; color: #6b7280;">${ej.series} series × ${ej.repeticiones} · [${cats}] (+${ej.fatigaPorcentaje || 20}% fatiga)</div>
                    </div>
                </label>`;
            });
        }
    }

    if (tipoSel === 'mental' || tipoSel === 'hibrida') {
        if (tipoSel === 'hibrida') {
            html += '<div style="font-weight: 800; font-size: 11.5px; text-transform: uppercase; color: #2563eb; margin: 12px 0 6px 0; border-bottom: 1px solid #bfdbfe; padding-bottom: 2px;">🧠 Ejercicios Mentales / Cognitivos:</div>';
        }
        if (eMentales.length === 0) {
            html += '<div style="color: #9ca3af; font-size: 12px; padding: 6px;">No tienes ejercicios mentales creados.</div>';
        } else {
            eMentales.forEach(function(ec) {
                var muscP = APP_STATE.musculosMentales && APP_STATE.musculosMentales[ec.musculoPrincipal] ?
                    (APP_STATE.musculosMentales[ec.musculoPrincipal].icono + ' ' + APP_STATE.musculosMentales[ec.musculoPrincipal].nombre) : (ec.musculoPrincipal || 'Foco');
                html += `
                <label class="modal-checklist-item">
                    <input type="checkbox" name="ejercicios_mentales_rutina_check" value="${ec.id}">
                    <div style="flex: 1;">
                        <strong style="color: #1e40af;">🧠 ${ec.nombre}</strong>
                        <div style="font-size: 11.5px; color: #6b7280;">⏱️ ${ec.duracionMinutos || 15} min · ${muscP} (+${ec.fatigaEstimada || 15}% fatiga SNC · +${ec.expRecompensa || 25} EXP)</div>
                    </div>
                </label>`;
            });
        }
    }

    contCheck.innerHTML = html;
}

function abrirModalNuevaRutina() {
    var inNom = document.getElementById('modal-rutina-nombre');
    var inDesc = document.getElementById('modal-rutina-desc');
    var inTipo = document.getElementById('modal-rutina-tipo');
    var inTag = document.getElementById('modal-rutina-tag');
    if (inNom) inNom.value = "";
    if (inDesc) inDesc.value = "";
    if (inTipo) inTipo.value = (CATEGORIA_EJERCICIOS_ACTIVA === 'gimnasio-mental' || SUBFILTRO_BANCO_ACTIVO === 'mental' || FILTRO_RUTINAS_ACTIVO === 'mentales') ? 'mental' : 'fisica';
    if (inTag) inTag.value = (inTipo && inTipo.value === 'mental') ? "MENTAL · ENFOQUE" : "DIARIA · FUERZA";

    actualizarChecklistRutinaSegunTipo(inTipo ? inTipo.value : 'fisica');

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
    var inTag = document.getElementById('modal-rutina-tag');
    var inTipo = document.getElementById('modal-rutina-tipo');

    var nom = inNom ? inNom.value.trim() : "";
    var desc = inDesc ? inDesc.value.trim() : "";
    var tag = inTag ? inTag.value.trim() : "DIARIA · SESIÓN";
    var tipo = inTipo ? inTipo.value : "fisica";

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

    var prefix = tipo === 'mental' ? 'COG-' : (tipo === 'hibrida' ? 'HIB-' : 'RUT-');
    var nuevaRutina = {
        id: "RUT-" + Date.now(),
        codigo: prefix + (APP_STATE.rutinas.length + 1),
        tipo: tipo,
        nombre: nom,
        descripcion: desc || (tipo === 'mental' ? "Entrenamiento cognitivo y foco" : "Entrenamiento programado"),
        rankLabel: tag || (tipo === 'mental' ? 'MENTAL · ENFOQUE' : 'DIARIA · SESIÓN'),
        ejercicios: selectedEjercicios
    };

    APP_STATE.rutinas.push(nuevaRutina);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevaRutina();
    renderizarPortalesRutinasEjercicios();
    if (typeof renderizarPortalesRutinas === 'function') renderizarPortalesRutinas(APP_STATE.rutinas);
    alert("✓ Rutina '" + nom + "' guardada con éxito con " + selectedEjercicios.length + " ejercicios.");
}

function eliminarRutina(idx, event) {
    if (event) event.stopPropagation();
    if (!confirm("¿Deseas eliminar esta rutina programada?")) return;
    if (!APP_STATE.rutinas) return;
    APP_STATE.rutinas.splice(idx, 1);
    MonarcaDB.save(APP_STATE);
    renderizarPortalesRutinas(APP_STATE.rutinas);
}

function renderizarPortalesRutinas(rutinas) {
    var cont = document.getElementById('contenedor-portales-rutinas');
    if (!cont) return;

    var rList = rutinas || APP_STATE.rutinas || [];

    if (!rList || rList.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 35px 20px; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🏋️‍♂️</span>
            <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 16px;">No tienes rutinas creadas</h4>
            <p style="color: #6b7280; font-size: 13px; max-width: 420px; margin: 0 auto 16px auto;">
                Arma tus sesiones de entrenamiento personalizadas seleccionando los ejercicios que has creado.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevaRutina()">
                ➕ Crear Primera Rutina
            </button>
        </div>`;
        return;
    }

    var html = '';
    rList.forEach(function(rut, idx) {
        var numEj = rut.ejercicios ? rut.ejercicios.length : 0;
        var badgeEj = numEj > 0 ? (numEj + (numEj === 1 ? ' Ejercicio' : ' Ejercicios')) : 'Sin Ejercicios';
        var rutCodigo = rut.codigo || ('RUT-' + (idx + 1));
        var cleanRank = (rut.rankLabel || 'SESIÓN').replace(/[^\w\s·-]/gi, '').trim();

        html += `
        <div class="quest-card" onclick="abrirDetalleRutina(${idx})" style="position: relative; cursor: pointer; border-radius: 14px;">
            <div class="quest-icon-box" style="font-weight: 800; font-size: 11px; letter-spacing: 0.5px; color: #111827;">${rutCodigo}</div>
            <div style="flex:1; padding-left: 4px;">
              <span class="quest-badge-rank">${cleanRank}</span>
              <p class="quest-card-name" style="margin:4px 0 6px 0;color:#111827;font-size:15px;font-weight:700;">${rut.nombre}</p>
              <div class="muscle-tags-row">
                <span class="muscle-tag">${badgeEj}</span>
                ${rut.descripcion ? `<span class="muscle-tag" style="background:none; border:none; color:#6b7280;">${rut.descripcion}</span>` : ''}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn-delete-row" title="Eliminar rutina" onclick="eliminarRutina(${idx}, event)" style="background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; padding: 6px; border-radius: 6px;">✕</button>
                <span class="quest-arrow" style="font-size: 13px; font-weight: 700; color: #111827;">Entrar ›</span>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
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

function abrirModalDetalleEjercicio(ej) {
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
    if (repsEl) repsEl.innerText = (ej.series || 4) + ' Series × ' + (ej.repeticiones || '10-12 reps');
    if (fatEl) fatEl.innerText = '+' + (ej.fatigaPorcentaje || 20) + '% Carga';
    
    var cats = (ej.categorias || []).join(' · ') || 'Grupos Principales';
    if (muscEl) muscEl.innerText = cats;
    if (descEl) descEl.innerText = ej.descripcion || 'Sin descripción técnica registrada.';
    
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

function cerrarModalDetalleEjercicio() {
    var modal = document.getElementById('modal-detalle-ejercicio');
    if (modal) modal.style.display = 'none';
}

// --- ASISTENTE DE GIMNASIO: DESCANSO ENTRE SERIES (REST TIMER) ---

var ASISTENTE_GYM = {
    descansoRestante: 0,
    descansoTotal: 0,
    intervaloId: null
};

function iniciarDescansoGym(segundos) {
    if (ASISTENTE_GYM.intervaloId) {
        clearInterval(ASISTENTE_GYM.intervaloId);
        ASISTENTE_GYM.intervaloId = null;
    }

    ASISTENTE_GYM.descansoTotal = segundos;
    ASISTENTE_GYM.descansoRestante = segundos;

    var boxEl = document.getElementById('gym-rest-timer-box');
    if (boxEl) boxEl.style.display = 'flex';

    actualizarDisplayRestTimer();

    ASISTENTE_GYM.intervaloId = setInterval(function() {
        ASISTENTE_GYM.descansoRestante--;
        actualizarDisplayRestTimer();

        if (ASISTENTE_GYM.descansoRestante <= 3 && ASISTENTE_GYM.descansoRestante > 0) {
            emitirTonoAudio(700, 0.08);
        }

        if (ASISTENTE_GYM.descansoRestante <= 0) {
            clearInterval(ASISTENTE_GYM.intervaloId);
            ASISTENTE_GYM.intervaloId = null;
            emitirTonoAudio(1050, 0.35, 'triangle');
            if (navigator.vibrate) navigator.vibrate([150, 80, 200]);
            var numEl = document.getElementById('rest-timer-num');
            if (numEl) numEl.innerText = "¡A entrenar!";
        }
    }, 1000);
}

function detenerDescansoGym() {
    if (ASISTENTE_GYM.intervaloId) {
        clearInterval(ASISTENTE_GYM.intervaloId);
        ASISTENTE_GYM.intervaloId = null;
    }
    var boxEl = document.getElementById('gym-rest-timer-box');
    if (boxEl) boxEl.style.display = 'none';
}

function actualizarDisplayRestTimer() {
    var numEl = document.getElementById('rest-timer-num');
    var barEl = document.getElementById('rest-timer-bar-fill');
    if (numEl) {
        var m = Math.floor(ASISTENTE_GYM.descansoRestante / 60);
        var s = ASISTENTE_GYM.descansoRestante % 60;
        numEl.innerText = (m > 0 ? (m + ':' + (s < 10 ? '0' : '') + s) : (s + 's'));
    }
    if (barEl && ASISTENTE_GYM.descansoTotal > 0) {
        var pct = Math.round((ASISTENTE_GYM.descansoRestante / ASISTENTE_GYM.descansoTotal) * 100);
        barEl.style.width = Math.max(0, pct) + '%';
    }
}

// --- INTERACCIÓN DE FILAS DE RUTINA ---

function alClickFilaEjercicio(e, ejJson, idx) {
    if (e.target.closest('.clean-row-checkbox-box') || e.target.closest('.btn-clean-detail')) return;
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
    } else {
        if (row) row.classList.remove('checked-active');
    }
    actualizarProgresoRutinaDinamica();
}

// ==========================================================================
// 9. DETALLE Y PROGRESO DE RUTINAS (DISEÑO MINIMALISTA & SERIO)
// ==========================================================================

function abrirDetalleRutina(idx, omitirAutoCalentamiento) {
    var rutina = APP_STATE.rutinas[idx];
    if (!rutina) return;
    RUTINA_ACTIVA = { rutina: rutina, idx: idx };

    cambiarVista('vista-detalle-rutina-dinamica');

    var tituloEl = document.getElementById('detalle-rutina-titulo');
    var badgeEl = document.getElementById('detalle-rutina-badge');
    if (tituloEl) tituloEl.innerText = rutina.nombre;
    if (badgeEl) badgeEl.innerText = (rutina.rankLabel || 'SESIÓN DE ENTRENAMIENTO').replace(/[^\w\s·-]/gi, '').trim();

    var cont = document.getElementById('contenedor-detalle-rutina-dinamica');
    if (!cont) return;

    var numEj = rutina.ejercicios ? rutina.ejercicios.length : 0;
    var progrCont = document.getElementById('progreso-rutina-dinamica-cont');
    var progrBarra = document.getElementById('progreso-barra-rutina-dinamica');
    var progrTexto = document.getElementById('progreso-texto-rutina-dinamica');
    var btnReg = document.getElementById('btn-registrar-rutina-dinamica');

    if (progrCont) progrCont.style.display = 'block';
    if (progrBarra) progrBarra.style.width = '0%';
    if (progrTexto) progrTexto.innerText = '0 / ' + numEj + ' (0%)';
    if (btnReg) {
        btnReg.style.display = 'block';
        btnReg.disabled = true;
    }

    var html = '';
    if (rutina.ejercicios && rutina.ejercicios.length > 0) {
        rutina.ejercicios.forEach(function(ej, ejIdx) {
            var esM = !!ej.esMental;
            var muscleList = (ej.categorias || []).join(' · ');
            var seriesReps = esM ? `1 bloque · ${ej.repeticiones || (ej.duracionMinutos + ' min')}` : `${ej.series || 4} series · ${ej.repeticiones || '10-12 reps'}`;
            var ejJson = encodeURIComponent(JSON.stringify(ej));
            var icono = esM ? '🧠' : '🏋️';

            html += `
            <div class="routine-exercise-clean-row" id="row-ej-${ejIdx}" onclick="alClickFilaEjercicio(event, '${ejJson}', ${ejIdx})" style="${esM ? 'border-left: 3px solid #2563eb;' : ''}">
                <div class="clean-row-checkbox-box" onclick="toggleCheckEjercicio(event, ${ejIdx})">
                    ✓
                </div>
                <input type="checkbox" class="check-rutina-din" id="check-ej-${ejIdx}" style="display:none;" onchange="actualizarProgresoRutinaDinamica()">
                <div class="clean-row-info">
                    <div class="clean-row-title">${ejIdx + 1}. ${icono} ${ej.nombre}</div>
                    <div class="clean-row-meta">${seriesReps} ${muscleList ? '· ' + muscleList : ''}</div>
                </div>
                <button type="button" class="btn-clean-detail" onclick="alVerDetalleEjercicio(event, '${ejJson}')" title="Ver especificaciones">
                    Detalle
                </button>
            </div>`;
        });
    } else {
        html = '<p style="color: #6b7280; text-align: center; padding: 25px;">Esta rutina no tiene ejercicios asignados aún.</p>';
    }

    cont.innerHTML = html;

    if (!omitirAutoCalentamiento) {
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
        var row = document.getElementById('row-ej-' + i) || c.closest('.routine-exercise-clean-row');
        if (c.checked) {
            completados++;
            if (row) row.classList.add('checked-active');
        } else {
            if (row) row.classList.remove('checked-active');
        }
    });

    var pct = total > 0 ? Math.round((completados / total) * 100) : 0;
    var progrBarra = document.getElementById('progreso-barra-rutina-dinamica');
    var progrTexto = document.getElementById('progreso-texto-rutina-dinamica');
    var btnReg = document.getElementById('btn-registrar-rutina-dinamica');

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

    alert("¡Excelente trabajo! Has completado la " + nombre + " al 100% (+50 EXP y fatiga registrada).");
    cambiarVista('vista-ejercicios');
}

function ejecutarRutinaDinamica() {
    if (!RUTINA_ACTIVA) return;
    var rutina = RUTINA_ACTIVA.rutina;

    if (!APP_STATE.fatiga) APP_STATE.fatiga = DEFAULT_STATE.fatiga;

    var tieneMentales = false;
    var tieneFisicos = false;

    if (rutina.ejercicios) {
        rutina.ejercicios.forEach(function(ej) {
            if (ej.esMental) {
                tieneMentales = true;
                if (typeof sumarExpMusculoMental === 'function' && ej.musculoPrincipal) {
                    sumarExpMusculoMental(ej.musculoPrincipal, ej.expRecompensa || 25);
                }
                var fm = APP_STATE.fatigaMentalDiaria || { nivel: 20 };
                var delta = Number(ej.fatigaEstimada) || 15;
                fm.nivel = Math.min(100, Math.max(0, (fm.nivel || 0) + delta));
                fm.estado = fm.nivel <= 25 ? "Mente Despejada" : (fm.nivel <= 60 ? "Carga Moderada" : (fm.nivel <= 85 ? "Fatiga Elevada" : "Saturación Neural"));
                APP_STATE.fatigaMentalDiaria = fm;
            } else {
                tieneFisicos = true;
                var fatigaVal = Number(ej.fatigaPorcentaje) || 20;
                (ej.categorias || []).forEach(function(cat) {
                    var mKeys = MAPA_CATEGORIAS_A_MUSCULOS[cat] || [];
                    mKeys.forEach(function(mKey) {
                        var actual = Number(APP_STATE.fatiga[mKey]) || 0;
                        APP_STATE.fatiga[mKey] = Math.min(100, actual + fatigaVal);
                    });
                });
            }
        });
    }

    if (tieneFisicos) {
        var keysFatiga = Object.keys(METADATOS_MUSCULOS);
        var sumaTotal = 0;
        keysFatiga.forEach(function(k) {
            sumaTotal += (Number(APP_STATE.fatiga[k]) || 0);
        });
        APP_STATE.fatiga.promedioHoy = Math.round(sumaTotal / keysFatiga.length);
        APP_STATE.fatiga.ultimoCierre = "Entrenamiento: " + rutina.nombre;
    }

    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!APP_STATE.gym) APP_STATE.gym = [];
    var tagTipoHist = tieneMentales && tieneFisicos ? " [HÍBRIDA]" : (tieneMentales ? " [MENTAL]" : " [FÍSICA]");
    APP_STATE.gym.unshift({
        fecha: fechaHoy,
        detalle: "Rutina completada" + tagTipoHist + ": " + rutina.nombre + " (" + (rutina.ejercicios ? rutina.ejercicios.length : 0) + " ejercicios)"
    });

    sumarExp(60);
    MonarcaDB.save(APP_STATE);

    var msgAviso = "🏆 ¡Sesión completada con éxito!\nHas finalizado '" + rutina.nombre + "'.\n+60 EXP recibidos.\n";
    if (tieneMentales && tieneFisicos) {
        msgAviso += "Se han actualizado tu mapa muscular corporal y tus músculos cognitivos en el sistema.";
    } else if (tieneMentales) {
        msgAviso += "El desarrollo de tus músculos mentales y la fatiga cognitiva del SNC han sido actualizados.";
    } else {
        msgAviso += "La fatiga muscular de tu cuerpo ha sido actualizada en el mapa anatómico.";
    }
    alert(msgAviso);

    cambiarVista('vista-ejercicios');
    if (typeof cambiarCategoriaEjercicios === 'function') {
        cambiarCategoriaEjercicios('rutinas');
    }
}

function renderizarGym(registros) {
    var cont = document.getElementById('contenedor-gym');
    if (!cont) return;
    var html = '';
    if (registros && registros.length > 0) {
        registros.forEach(function(reg) {
            html += `<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;color:#111827;font-size:13.5px;">${reg.detalle}</span>
                <span style="color:#6b7280;font-size:12px;">${reg.fecha}</span>
            </div>`;
        });
    } else {
        html = '<p style="color:#6b7280;text-align:center;padding:15px;">No hay entrenamientos registrados aún.</p>';
    }
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
                    <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #111827;">Barra de Fatiga Mental Diaria</h3>
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

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #4b5563;">
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
                    <strong style="font-size: 14px; color: #111827;">${m.nombre}</strong>
                </div>
                <span class="item-badge-pill" style="font-weight: 800; background: #111827; color: #ffffff;">Nv. ${nivel}</span>
            </div>
            <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #6b7280; line-height: 1.4;">${m.descripcion}</p>
            <div style="display: justify; display: flex; justify-content: space-between; font-size: 11px; color: #4b5563; font-weight: 700; margin-bottom: 3px;">
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
    if (!APP_STATE.musculosMentales || !APP_STATE.musculosMentales[clave]) return;
    var m = APP_STATE.musculosMentales[clave];
    m.exp = (m.exp || 0) + cantidad;
    var expMax = (m.nivel || 1) * 100;
    while (m.exp >= expMax) {
        m.exp -= expMax;
        m.nivel = (m.nivel || 1) + 1;
        expMax = m.nivel * 100;
        alert("✨ ¡SUBIÓ DE NIVEL EL MÚSCULO MENTAL! " + m.icono + " " + m.nombre + " ha alcanzado el Nivel " + m.nivel + "!");
    }
}

function renderizarBancoEjerciciosCerebrales() {
    var cont = document.getElementById('contenedor-ejercicios-cerebrales');
    if (!cont) return;

    if (!APP_STATE.ejerciciosCerebrales || !Array.isArray(APP_STATE.ejerciciosCerebrales)) {
        APP_STATE.ejerciciosCerebrales = JSON.parse(JSON.stringify(DEFAULT_STATE.ejerciciosCerebrales));
    }
    var list = APP_STATE.ejerciciosCerebrales;

    if (list.length === 0) {
        cont.innerHTML = '<p style="color:#6b7280; text-align:center; padding:16px;">No hay ejercicios cerebrales registrados.</p>';
        return;
    }

    var html = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">`;

    list.forEach(function(ec) {
        var fatigaLabel = ec.fatigaEstimada > 0 ? `+${ec.fatigaEstimada}% Fatiga` : `${ec.fatigaEstimada}% Fatiga (Alivio)`;
        var fatigaBg = ec.fatigaEstimada > 0 ? "#fef2f2" : "#ecfdf5";
        var fatigaColor = ec.fatigaEstimada > 0 ? "#991b1b" : "#065f46";

        var muscP = APP_STATE.musculosMentales && APP_STATE.musculosMentales[ec.musculoPrincipal] ?
            (APP_STATE.musculosMentales[ec.musculoPrincipal].icono + " " + APP_STATE.musculosMentales[ec.musculoPrincipal].nombre) : ec.musculoPrincipal;

        var muscS = ec.musculoSecundario && APP_STATE.musculosMentales && APP_STATE.musculosMentales[ec.musculoSecundario] ?
            (APP_STATE.musculosMentales[ec.musculoSecundario].icono + " " + APP_STATE.musculosMentales[ec.musculoSecundario].nombre) : "";

        html += `
        <div class="cerebral-exercise-card">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
                <div>
                    <h4 style="margin: 0 0 4px 0; font-size: 14.5px; font-weight: 800; color: #111827;">${ec.nombre}</h4>
                    <span style="font-size: 11.5px; color: #6b7280;">⏱️ ${ec.duracionMinutos} min · ${muscP}${muscS ? ' + ' + muscS : ''}</span>
                </div>
                <button onclick="eliminarEjercicioCerebral('${ec.id}')" title="Eliminar ejercicio" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 2px 6px; font-size: 13px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#9ca3af'">🗑️</button>
            </div>

            <p style="margin: 0 0 10px 0; font-size: 12.5px; color: #4b5563; line-height: 1.4;">${ec.descripcion}</p>

            <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 8px 10px; margin-bottom: 12px;">
                <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #6b7280; margin-bottom: 2px;">Protocolo:</div>
                <div style="font-size: 11.5px; color: #1f2937; line-height: 1.4;">${ec.protocolo}</div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f3f4f6; padding-top: 10px; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; font-weight: 700; background: ${fatigaBg}; color: ${fatigaColor}; padding: 2px 7px; border-radius: 9999px;">${fatigaLabel}</span>
                    <span style="font-size: 11px; font-weight: 700; background: #f3f4f6; color: #111827; padding: 2px 7px; border-radius: 9999px;">+${ec.expRecompensa} EXP</span>
                </div>
                <button class="btn-system" style="padding: 6px 12px; font-size: 12px; border-radius: 8px;" onclick="ejecutarEjercicioCerebral('${ec.id}')">
                    ⚡ Ejecutar Protocolo
                </button>
            </div>
        </div>`;
    });

    html += `</div>`;
    cont.innerHTML = html;
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

    sumarExpMusculoMental(ec.musculoPrincipal, ec.expRecompensa);
    if (ec.musculoSecundario) {
        sumarExpMusculoMental(ec.musculoSecundario, Math.round(ec.expRecompensa * 0.5));
    }

    sumarExp(ec.expRecompensa);

    MonarcaDB.save(APP_STATE);
    renderizarBarraFatigaMentalDiaria();
    renderizarGimnasioMental();

    alert("🧠 ¡Protocolo cerebral completado!\n• " + ec.nombre + " ejecutado con éxito.\n• +" + ec.expRecompensa + " EXP general y muscular asignados.\n• Fatiga mental actual: " + nuevoNivelFatiga + "%.");
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

    modal.style.display = 'flex';
}

function cerrarModalNuevoEjercicioCerebral() {
    var modal = document.getElementById('modal-nuevo-ejercicio-cerebral');
    if (modal) modal.style.display = 'none';
}

function guardarNuevoEjercicioCerebral() {
    var inNom = document.getElementById('input-ec-nombre');
    var inMusP = document.getElementById('input-ec-musculo-p');
    var inMusS = document.getElementById('input-ec-musculo-s');
    var inDur = document.getElementById('input-ec-dur');
    var inDesc = document.getElementById('input-ec-desc');
    var inProt = document.getElementById('input-ec-prot');
    var inFat = document.getElementById('input-ec-fatiga');
    var inExp = document.getElementById('input-ec-exp');

    var nom = inNom ? inNom.value.trim() : '';
    var musP = inMusP ? inMusP.value : 'inteligencia';
    var musS = inMusS ? inMusS.value : '';
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

    if (!APP_STATE.ejerciciosCerebrales) APP_STATE.ejerciciosCerebrales = [];
    var nuevo = {
        id: "EC-" + Date.now(),
        nombre: nom,
        musculoPrincipal: musP,
        musculoSecundario: musS || null,
        duracionMinutos: dur,
        descripcion: desc || "Entrenamiento cognitivo personalizado.",
        protocolo: prot || "1. Concentración plena. 2. Ejecutar bloque de foco. 3. Documentar resultados.",
        fatigaEstimada: fat,
        expRecompensa: exp
    };

    APP_STATE.ejerciciosCerebrales.push(nuevo);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevoEjercicioCerebral();
    renderizarBancoEjerciciosCerebrales();
    alert("⚡ Ejercicio cerebral '" + nom + "' agregado exitosamente.");
}

function eliminarEjercicioCerebral(id) {
    if (!confirm("¿Deseas eliminar este ejercicio cerebral del banco?")) return;
    if (!APP_STATE.ejerciciosCerebrales) return;
    APP_STATE.ejerciciosCerebrales = APP_STATE.ejerciciosCerebrales.filter(function(e) { return e.id !== id; });
    MonarcaDB.save(APP_STATE);
    renderizarBancoEjerciciosCerebrales();
}


