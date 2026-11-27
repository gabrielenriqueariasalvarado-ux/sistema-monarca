// ==========================================================================
// MÓDULO: CALENDARIO INTEGRAL · 4 APARTADOS CONECTADOS A PERSONAS
// 1. Recordatorios (con disparo exacto visual/sonoro y Centro de Notificaciones)
// 2. Eventos (duración -> hora fin automática, multi-personas/grupos, choques)
// 3. Días Destacados (todo el día 00:00–23:59, repetición anual, banners)
// 4. Cronograma Semanal (rutina base horaria + prioridad visual de Eventos)
// ==========================================================================

var CALENDARIO_ESTADO = {
    anio: new Date().getFullYear(),
    mes: new Date().getMonth(),
    diaSeleccionado: new Date().getDate(),
    seccionActiva: 'mes', // 'mes' | 'semana' | 'recordatorios' | 'eventos' | 'destacados' | 'cronograma'
    filtroCapa: 'todas', // 'todas' | 'personal' | 'labores' | 'finanzas' | 'quests'
    filtroRecordatorios: 'pendientes',
    filtroEventos: 'proximos',
    modalTipo: 'recordatorio',
    alertaCola: [],
    alertaActivaId: null,
    motorInterval: null,
    personaIdsSeleccionadosModal: [],
    grupoIdsSeleccionadosModal: []
};

var CAL_LABORES_META_FALLBACK = {
    'LAB-BOOM': { id: 'LAB-BOOM', nombre: 'Boom Solutions', icono: '🚀', color: '#6366f1' },
    'LAB-BARBER': { id: 'LAB-BARBER', nombre: 'Barbería', icono: '💈', color: '#10b981' },
    'LAB-TRAINER': { id: 'LAB-TRAINER', nombre: 'Personal Trainer', icono: '🏋️', color: '#f59e0b' }
};

function normalizarMetaLaborCalendario(laborId) {
    if (!laborId) return null;
    if (typeof LABORES_OFICIALES !== 'undefined' && Array.isArray(LABORES_OFICIALES)) {
        var found = LABORES_OFICIALES.find(function(l) { return l.id === laborId; });
        if (found) return { id: found.id, nombre: found.nombre, icono: found.icono || '💼', color: found.color || '#6366f1' };
    }
    return CAL_LABORES_META_FALLBACK[laborId] || null;
}

function capaCalendarioVisible(capa) {
    var activa = CALENDARIO_ESTADO.filtroCapa || 'todas';
    return activa === 'todas' || activa === capa;
}

function cambiarFiltroCapaCalendario(capa) {
    CALENDARIO_ESTADO.filtroCapa = capa || 'todas';
    renderizarCalendario();
}

var MESES_NOMBRES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

var DIAS_SEMANA_NOMBRES = [
    "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
];

var DIAS_SEMANA_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// ==========================================================================
// UTILIDADES DE FECHA, HORA Y SEGURIDAD HTML
// ==========================================================================

function calEscHtml(str) {
    if (typeof window.monarcaEscHtml === 'function') return window.monarcaEscHtml(str);
    if (str === null || typeof str === 'undefined') return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatearClaveFecha(anio, mes, dia) {
    var mStr = (mes + 1 < 10) ? "0" + (mes + 1) : String(mes + 1);
    var dStr = (dia < 10) ? "0" + dia : String(dia);
    return anio + "-" + mStr + "-" + dStr;
}

function parsearClaveFechaLocal(fechaStr) {
    if (!fechaStr || typeof fechaStr !== 'string') return null;
    var p = fechaStr.split('-');
    if (p.length !== 3) return null;
    var y = parseInt(p[0], 10);
    var m = parseInt(p[1], 10) - 1;
    var d = parseInt(p[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d, 0, 0, 0, 0);
}

function sumarDiasAFechaStr(fechaStr, dias) {
    var f = parsearClaveFechaLocal(fechaStr);
    if (!f) return fechaStr;
    f.setDate(f.getDate() + dias);
    return formatearClaveFecha(f.getFullYear(), f.getMonth(), f.getDate());
}

function obtenerIndiceDiaSemana(fechaStr) {
    var f = parsearClaveFechaLocal(fechaStr);
    if (!f) return 0;
    return (f.getDay() + 6) % 7; // 0 = Lunes ... 6 = Domingo
}

function obtenerLunesDeFecha(fechaStr) {
    var idx = obtenerIndiceDiaSemana(fechaStr);
    return sumarDiasAFechaStr(fechaStr, -idx);
}

function parseHoraAMinutos(horaStr) {
    if (!horaStr || typeof horaStr !== 'string') return null;
    var parts = horaStr.trim().split(':');
    if (parts.length < 2) return null;
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
}

function formatearMinutosAHora(totalMin) {
    var norm = ((totalMin % 1440) + 1440) % 1440;
    var h = Math.floor(norm / 60);
    var m = norm % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

function obtenerFechaHoraMs(fechaStr, horaStr) {
    var f = parsearClaveFechaLocal(fechaStr);
    if (!f) return NaN;
    var mins = parseHoraAMinutos(horaStr);
    if (mins === null) return NaN;
    f.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    return f.getTime();
}

function calcularHoraFinDesdeDuracion(horaInicioStr, duracionValor, duracionUnidad) {
    var startMin = parseHoraAMinutos(horaInicioStr);
    if (startMin === null) return null;
    var val = Number(duracionValor);
    if (isNaN(val) || val <= 0) return null;
    var duracionMinutos = duracionUnidad === 'horas' ? Math.round(val * 60) : Math.round(val);
    if (duracionMinutos < 1) duracionMinutos = 1;
    var endMinRaw = startMin + duracionMinutos;
    return {
        startMin: startMin,
        endMinRaw: endMinRaw,
        duracionMinutos: duracionMinutos,
        horaFin: formatearMinutosAHora(endMinRaw),
        cruzaMedianoche: endMinRaw >= 1440
    };
}

function formatearDuracionLegible(mins) {
    var total = parseInt(mins, 10) || 0;
    if (total <= 0) return '';
    var h = Math.floor(total / 60);
    var m = total % 60;
    if (h > 0 && m > 0) return h + 'h ' + m + 'min';
    if (h > 0) return h + (h === 1 ? ' hora' : ' horas');
    return m + ' min';
}

function formatearFechaLegibleCorta(fechaStr) {
    var f = parsearClaveFechaLocal(fechaStr);
    if (!f) return fechaStr || '';
    var idx = (f.getDay() + 6) % 7;
    return DIAS_SEMANA_CORTOS[idx] + ' ' + f.getDate() + ' ' + MESES_NOMBRES[f.getMonth()].slice(0, 3) + ' ' + f.getFullYear();
}

function intervalosSolapan(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
}

function esAnioBisiesto(anio) {
    return (anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0);
}

var CAL_AVISO_PREVIO_DEFAULT_MIN = 30;

function obtenerMinutosAvisoPrevioEvento(item) {
    if (!item || typeof item !== 'object') return CAL_AVISO_PREVIO_DEFAULT_MIN;
    if (item.avisoPrevioMin === 0 || item.avisoPrevioMin === '0') return 0;
    var val = parseInt(item.avisoPrevioMin, 10);
    if (isNaN(val) || val < 0) return CAL_AVISO_PREVIO_DEFAULT_MIN;
    // Eventos antiguos guardados con el viejo predeterminado 15 sin personalización explícita pasan a 30 min (media hora)
    if (!item.avisoPersonalizado && val === 15) return CAL_AVISO_PREVIO_DEFAULT_MIN;
    return val;
}

function obtenerMinutosAvisoPrevioCronograma(bloque) {
    if (!bloque || typeof bloque !== 'object') return CAL_AVISO_PREVIO_DEFAULT_MIN;
    if (bloque.avisoPrevioMin === 0 || bloque.avisoPrevioMin === '0') return 0;
    var val = parseInt(bloque.avisoPrevioMin, 10);
    if (isNaN(val) || val < 0) return CAL_AVISO_PREVIO_DEFAULT_MIN;
    return val;
}

function formatearTextoAnticipacionMin(mins) {
    var m = parseInt(mins, 10) || 0;
    if (m === 30) return 'media hora';
    if (m === 60) return '1 hora';
    return m + ' min';
}

function formatearAvisoAnticipadoEvento(startMs, ahoraMs, esHorario) {
    var diffMs = startMs - ahoraMs;
    var faltanMin = Math.ceil(diffMs / 60000);
    var enCurso = diffMs <= 0;
    var prefijoTitulo = '';
    var badgeTiempo = '';

    if (enCurso) {
        var pasadosMin = Math.floor(Math.abs(diffMs) / 60000);
        prefijoTitulo = pasadosMin <= 3 ? '¡Inicia ahora!:' : 'En curso:';
        badgeTiempo = esHorario ? 'Horario · En curso' : 'Evento en Curso';
    } else if (faltanMin >= 28 && faltanMin <= 31) {
        prefijoTitulo = esHorario ? 'En media hora en tu horario:' : 'En media hora tienes:';
        badgeTiempo = esHorario ? 'Horario · En 30 min' : 'En 30 min';
    } else if (faltanMin >= 58 && faltanMin <= 61) {
        prefijoTitulo = esHorario ? 'En 1 hora en tu horario:' : 'En 1 hora tienes:';
        badgeTiempo = esHorario ? 'Horario · En 1 h' : 'En 1 hora';
    } else if (faltanMin <= 1) {
        prefijoTitulo = esHorario ? 'En 1 min en tu horario:' : 'En 1 min tienes:';
        badgeTiempo = esHorario ? 'Horario · Ya inicia' : 'Ya inicia';
    } else {
        prefijoTitulo = esHorario ? ('En ' + faltanMin + ' min en tu horario:') : ('En ' + faltanMin + ' min tienes:');
        badgeTiempo = (esHorario ? 'Horario · En ' : 'En ') + faltanMin + ' min';
    }

    return {
        enCurso: enCurso,
        faltanMin: Math.max(0, faltanMin),
        prefijoTitulo: prefijoTitulo,
        badgeTiempo: badgeTiempo
    };
}

function _obtenerClaveHoyCalendario() {
    if (typeof obtenerClaveFechaLocal === 'function') {
        return obtenerClaveFechaLocal();
    }
    var h = new Date();
    return formatearClaveFecha(h.getFullYear(), h.getMonth(), h.getDate());
}

function normalizarItemCalendario(item) {
    if (!item || typeof item !== 'object') return null;
    var copy = Object.assign({}, item);
    var tipo = copy.tipo;
    if (!tipo) {
        // Compatibilidad automática con registros previos del calendario
        tipo = 'evento';
        copy.tipo = 'evento';
        copy.horaInicio = copy.horaInicio || copy.hora || '';
        copy.descripcion = copy.descripcion || copy.notas || '';
        if (copy.horaInicio && !copy.duracionMinutos) {
            copy.duracionMinutos = 60;
        }
    }
    if (tipo === 'evento') {
        var hIni = copy.horaInicio || copy.hora || '';
        copy.horaInicio = hIni;
        var dur = parseInt(copy.duracionMinutos, 10) || (hIni ? 60 : 0);
        copy.duracionMinutos = dur;
        copy.avisoPrevioMin = obtenerMinutosAvisoPrevioEvento(copy);
        if (hIni && dur > 0) {
            var calc = calcularHoraFinDesdeDuracion(hIni, dur, 'min');
            if (calc) {
                copy.horaFin = calc.horaFin;
                copy.cruzaMedianoche = calc.cruzaMedianoche;
                copy._startMin = calc.startMin;
                copy._endMinRaw = calc.endMinRaw;
            }
        }
        copy.personaIds = Array.isArray(copy.personaIds) ? copy.personaIds : [];
        copy.grupoIds = Array.isArray(copy.grupoIds) ? copy.grupoIds : [];
    }
    copy.laborId = copy.laborId ? String(copy.laborId) : '';
    return copy;
}

// ==========================================================================
// CONEXIÓN EN VIVO CON PERSONAS Y GRUPOS
// ==========================================================================

function obtenerPersonasDisponibles() {
    if (!window.APP_STATE || !Array.isArray(APP_STATE.agendaPersonas)) return [];
    return APP_STATE.agendaPersonas;
}

function obtenerGruposPersonasDisponibles() {
    if (!window.APP_STATE || !Array.isArray(APP_STATE.gruposPersonas)) return [];
    return APP_STATE.gruposPersonas;
}

function resolverPersonaPorId(personaId, nombreRespaldo) {
    if (!personaId) return null;
    var encontrada = obtenerPersonasDisponibles().find(function(p) {
        return String(p.id) === String(personaId);
    });
    if (encontrada) {
        return { id: encontrada.id, nombre: encontrada.nombre, rol: encontrada.rol || '', ubicacion: encontrada.ubicacionCategoria || '' };
    }
    if (nombreRespaldo) {
        return { id: personaId, nombre: nombreRespaldo, rol: '', ubicacion: '' };
    }
    return null;
}

function resolverBadgesVinculadosEvento(personaIds, grupoIds) {
    var badges = [];
    var personas = obtenerPersonasDisponibles();
    var grupos = obtenerGruposPersonasDisponibles();

    (grupoIds || []).forEach(function(gid) {
        var g = grupos.find(function(gr) { return String(gr.id) === String(gid); });
        if (g) {
            var count = Array.isArray(g.personaIds) ? g.personaIds.filter(function(pid) {
                return personas.some(function(p) { return String(p.id) === String(pid); });
            }).length : 0;
            badges.push({
                tipo: 'grupo',
                icono: g.icono || '👥',
                nombre: g.nombre + ' (' + count + ')',
                color: g.color || '#6366f1'
            });
        }
    });

    (personaIds || []).forEach(function(pid) {
        var p = personas.find(function(per) { return String(per.id) === String(pid); });
        if (p) {
            badges.push({
                tipo: 'persona',
                icono: '👤',
                nombre: p.nombre,
                color: '#38bdf8'
            });
        }
    });

    return badges;
}

function renderizarHtmlBadgesPersonas(badges) {
    if (!badges || badges.length === 0) return '';
    return '<div class="cal-linked-people-row">' +
        badges.map(function(b) {
            return '<span class="cal-person-chip ' + (b.tipo === 'grupo' ? 'is-group' : '') + '" style="border-color: ' + (b.color || '#38bdf8') + '40;">' +
                calEscHtml(b.icono) + ' ' + calEscHtml(b.nombre) +
            '</span>';
        }).join('') +
    '</div>';
}

// ==========================================================================
// CONSULTAS Y DETECCIÓN DE CONFLICTOS / REPETICIONES ANUALES
// ==========================================================================

function obtenerItemsCalendarioNormalizados() {
    if (!window.APP_STATE || !Array.isArray(APP_STATE.calendario)) return [];
    return APP_STATE.calendario.map(normalizarItemCalendario).filter(Boolean);
}

function obtenerDestacadosParaFecha(fechaStr) {
    if (!fechaStr || fechaStr.length !== 10) return [];
    var anioVista = parseInt(fechaStr.slice(0, 4), 10);
    var mmddVista = fechaStr.slice(5, 10);

    return obtenerItemsCalendarioNormalizados().filter(function(item) {
        if (item.tipo !== 'destacado' || !item.fecha) return false;
        if (item.fecha === fechaStr) return true;
        if (!item.repetirAnualmente) return false;

        var anioOrigen = parseInt(item.fecha.slice(0, 4), 10);
        if (isNaN(anioOrigen) || anioVista < anioOrigen) return false;

        var mmddOrigen = item.fecha.slice(5, 10);
        if (mmddOrigen === mmddVista) return true;
        // Manejo de 29 de febrero en años no bisiestos
        if (mmddOrigen === '02-29' && !esAnioBisiesto(anioVista) && mmddVista === '02-28') return true;
        return false;
    }).map(function(item) {
        var anioOrigen = parseInt(item.fecha.slice(0, 4), 10);
        var copy = Object.assign({}, item);
        copy.aniosTranscurridos = (!isNaN(anioOrigen) && anioVista > anioOrigen) ? (anioVista - anioOrigen) : 0;
        return copy;
    });
}

function obtenerRecordatoriosParaFecha(fechaStr) {
    return obtenerItemsCalendarioNormalizados().filter(function(item) {
        return item.tipo === 'recordatorio' && item.fecha === fechaStr;
    }).sort(function(a, b) {
        return String(a.hora || '99:99').localeCompare(String(b.hora || '99:99'));
    });
}

function obtenerEventosParaFecha(fechaStr) {
    return obtenerItemsCalendarioNormalizados().filter(function(item) {
        return item.tipo === 'evento' && item.fecha === fechaStr;
    }).sort(function(a, b) {
        return String(a.horaInicio || '99:99').localeCompare(String(b.horaInicio || '99:99'));
    });
}

function obtenerCronogramaParaDiaSemana(diaIdx) {
    if (!window.APP_STATE || !Array.isArray(APP_STATE.cronogramaSemanal)) return [];
    return APP_STATE.cronogramaSemanal.filter(function(b) {
        return Number(b.diaSemana) === Number(diaIdx);
    }).sort(function(a, b) {
        return String(a.horaInicio || '').localeCompare(String(b.horaInicio || ''));
    });
}

function detectarChoquesEvento(fechaStr, horaInicioStr, duracionMinutos, excludeId) {
    var result = {
        eventosSolapados: [],
        rutinasDesplazadas: []
    };
    if (!fechaStr || !horaInicioStr) return result;

    var calc = calcularHoraFinDesdeDuracion(horaInicioStr, duracionMinutos, 'min');
    if (!calc) return result;
    var aStart = calc.startMin;
    var aEnd = calc.endMinRaw;

    // 1. Verificar choques contra otros Eventos en la misma fecha
    obtenerEventosParaFecha(fechaStr).forEach(function(ev) {
        if (excludeId && String(ev.id) === String(excludeId)) return;
        if (typeof ev._startMin !== 'number' || typeof ev._endMinRaw !== 'number') return;
        if (intervalosSolapan(aStart, aEnd, ev._startMin, ev._endMinRaw)) {
            result.eventosSolapados.push(ev);
        }
    });

    // 2. Verificar superposición informativa contra Cronograma Semanal de ese día
    var diaIdx = obtenerIndiceDiaSemana(fechaStr);
    obtenerCronogramaParaDiaSemana(diaIdx).forEach(function(b) {
        var rStart = parseHoraAMinutos(b.horaInicio);
        var rEnd = parseHoraAMinutos(b.horaFin);
        if (rStart === null || rEnd === null || rEnd <= rStart) return;
        if (intervalosSolapan(aStart, aEnd, rStart, rEnd)) {
            result.rutinasDesplazadas.push(b);
        }
    });

    return result;
}

// ==========================================================================
// NAVEGACIÓN PRINCIPAL DEL MÓDULO CALENDARIO
// ==========================================================================

function cambiarSeccionCalendario(seccion) {
    CALENDARIO_ESTADO.seccionActiva = seccion || 'mes';
    renderizarCalendario();
}

function seleccionarOtroMesDia(anioVal, mesVal, diaVal) {
    CALENDARIO_ESTADO.anio = anioVal;
    CALENDARIO_ESTADO.mes = mesVal;
    CALENDARIO_ESTADO.diaSeleccionado = diaVal;
    renderizarCalendario();
}

function seleccionarDiaCalendario(dia) {
    CALENDARIO_ESTADO.diaSeleccionado = dia;
    renderizarCalendario();
}

function cambiarMesCalendario(delta) {
    CALENDARIO_ESTADO.mes += delta;
    if (CALENDARIO_ESTADO.mes < 0) {
        CALENDARIO_ESTADO.mes = 11;
        CALENDARIO_ESTADO.anio--;
    } else if (CALENDARIO_ESTADO.mes > 11) {
        CALENDARIO_ESTADO.mes = 0;
        CALENDARIO_ESTADO.anio++;
    }
    var maxDias = new Date(CALENDARIO_ESTADO.anio, CALENDARIO_ESTADO.mes + 1, 0).getDate();
    if (CALENDARIO_ESTADO.diaSeleccionado > maxDias) {
        CALENDARIO_ESTADO.diaSeleccionado = maxDias;
    }
    renderizarCalendario();
}

function cambiarSemanaCalendario(deltaSemanas) {
    var claveActual = formatearClaveFecha(CALENDARIO_ESTADO.anio, CALENDARIO_ESTADO.mes, CALENDARIO_ESTADO.diaSeleccionado);
    var nuevaClave = sumarDiasAFechaStr(claveActual, deltaSemanas * 7);
    var f = parsearClaveFechaLocal(nuevaClave);
    if (f) {
        CALENDARIO_ESTADO.anio = f.getFullYear();
        CALENDARIO_ESTADO.mes = f.getMonth();
        CALENDARIO_ESTADO.diaSeleccionado = f.getDate();
    }
    renderizarCalendario();
}

function irAHoyCalendario() {
    var hoy = new Date();
    CALENDARIO_ESTADO.anio = hoy.getFullYear();
    CALENDARIO_ESTADO.mes = hoy.getMonth();
    CALENDARIO_ESTADO.diaSeleccionado = hoy.getDate();
    renderizarCalendario();
}

// ==========================================================================
// EXTRACTORES UNIFICADOS (LABORES, QUESTS DIARIOS, PERSONAS, FINANZAS)
// ==========================================================================

function obtenerInfoBoomParaDiaCal(fechaStr, mesCacheBoom) {
    if (!fechaStr || fechaStr.length < 10) return null;
    var mesClave = fechaStr.slice(0, 7);
    var estadoMes = (mesCacheBoom && mesCacheBoom[mesClave])
        ? mesCacheBoom[mesClave]
        : (typeof obtenerEstadoMesBoomParaCalendario === 'function' ? obtenerEstadoMesBoomParaCalendario(mesClave) : null);
    if (!estadoMes || !estadoMes.planMes) {
        var bm = window.APP_STATE && APP_STATE.subappBoom;
        if (bm && bm.planificaciones && bm.planificaciones[mesClave]) {
            estadoMes = { planMes: bm.planificaciones[mesClave], config: bm.config || {} };
        }
    }
    if (!estadoMes || !estadoMes.planMes) return null;
    if (mesCacheBoom) mesCacheBoom[mesClave] = estadoMes;

    var planMes = estadoMes.planMes;
    var cfg = estadoMes.config || {};
    var diaInfo = (planMes.dias && planMes.dias[fechaStr]) ? planMes.dias[fechaStr] : null;

    var diaNum = parseInt(fechaStr.slice(8, 10), 10);
    var totalDiasMes = new Date(parseInt(fechaStr.slice(0, 4), 10), parseInt(fechaStr.slice(5, 7), 10), 0).getDate();
    var diaPagoQ2 = Math.min(30, totalDiasMes);
    var pagoBoom = null;
    var cobrados = planMes.pagosCobrados || {};
    if (diaNum === 3) {
        pagoBoom = { tipo: 'bono3', titulo: 'Bono Mensual Boom', monto: Number(cfg.bonoDia3) || 40, cobrado: !!cobrados.bono3 };
    } else if (diaNum === 15) {
        pagoBoom = { tipo: 'quincena1', titulo: 'Sueldo Quincena 1 Boom', monto: Number(cfg.sueldoQuincena1) || 205, cobrado: !!cobrados.quincena1 };
    } else if (diaNum === diaPagoQ2) {
        pagoBoom = { tipo: 'quincena2', titulo: 'Sueldo Quincena 2 Boom', monto: Number(cfg.sueldoQuincena2) || 205, cobrado: !!cobrados.quincena2 };
    }

    return {
        mesClave: mesClave,
        diaInfo: diaInfo,
        pagoBoom: pagoBoom
    };
}

function obtenerCortesYSesionesDiaCal(fechaStr) {
    var cortes = [];
    var sesiones = [];
    var registrosExtra = [];
    var st = window.APP_STATE || {};

    if (st.subappBarberia && Array.isArray(st.subappBarberia.cortes)) {
        cortes = st.subappBarberia.cortes.filter(function(c) {
            return String(c.fecha || '').slice(0, 10) === fechaStr;
        });
    }
    if (st.subappTrainer && Array.isArray(st.subappTrainer.sesiones)) {
        sesiones = st.subappTrainer.sesiones.filter(function(s) {
            return String(s.fecha || '').slice(0, 10) === fechaStr;
        });
    }
    if (Array.isArray(st.registrosLabores)) {
        var idBoomDia = 'REG-BOOM-' + fechaStr;
        registrosExtra = st.registrosLabores.filter(function(r) {
            return String(r.fecha || '').slice(0, 10) === fechaStr && r.id !== idBoomDia;
        });
    }

    return {
        cortes: cortes,
        sesiones: sesiones,
        registrosExtra: registrosExtra
    };
}

function obtenerQuestsProgramadasParaFecha(fechaStr, hoyClave) {
    var quests = (window.APP_STATE && Array.isArray(APP_STATE.questsDiarios)) ? APP_STATE.questsDiarios : [];
    var esHoy = (fechaStr === hoyClave);
    var result = [];
    quests.forEach(function(q) {
        if (!q || q.tipoTiempo !== 'programada' || !q.horaActivacion) return;
        var mHora = String(q.horaActivacion).trim().slice(0, 5);
        if (!/^\d{2}:\d{2}$/.test(mHora)) return;
        var completadoEnFecha = false;
        if (q.estado === 'completada') {
            if (q.ultimaActivacionFecha === fechaStr) completadoEnFecha = true;
            else if (esHoy && (!q.ultimaActivacionFecha || q.ultimaActivacionFecha === hoyClave)) completadoEnFecha = true;
        }
        result.push({
            id: q.id,
            titulo: q.titulo || 'Quest Diaria',
            hora: mHora,
            atributo: q.atributo || 'FUE',
            xp: Number(q.xp) || 0,
            completado: completadoEnFecha,
            pendienteActiva: q.estado === 'pendiente'
        });
    });
    result.sort(function(a, b) {
        return a.hora.localeCompare(b.hora) || a.titulo.localeCompare(b.titulo);
    });
    return result;
}

function obtenerPersonasAgendadasParaFecha(fechaStr) {
    var personas = obtenerPersonasDisponibles();
    return personas.filter(function(p) {
        return String(p.fechaObjetivo || '').slice(0, 10) === fechaStr;
    });
}

function construirFinanzasMesCacheCal(anio, mes) {
    if (typeof resolverOcurrenciasFinanzasMes === 'function' && window.APP_STATE && APP_STATE.finanzas) {
        return resolverOcurrenciasFinanzasMes(APP_STATE.finanzas, anio, mes);
    }
    return null;
}

function obtenerFinanzasUnificadasParaDia(anio, mes, diaSel, fechaStr, cacheMesOpt) {
    var entradas = [];
    var fin = window.APP_STATE && APP_STATE.finanzas;
    var cache = cacheMesOpt || construirFinanzasMesCacheCal(anio, mes);

    if (cache && cache.diasMap && cache.diasMap[fechaStr]) {
        var bucket = cache.diasMap[fechaStr];
        (bucket.cobros || []).forEach(function(c) {
            entradas.push({
                clase: 'cobro',
                tipo: c.categoriaTxt || 'Cobro',
                titulo: c.titulo,
                monto: Number(c.monto) || 0,
                completado: !!c.completado,
                vencida: !!c.vencida,
                icon: c.icono || '💰'
            });
        });
        (bucket.pagos || []).forEach(function(p) {
            entradas.push({
                clase: 'pago',
                tipo: p.categoriaTxt || (p.origen === 'deuda_cuota' ? 'Cuota Deuda' : 'Pago'),
                titulo: p.titulo,
                monto: Number(p.monto) || 0,
                completado: !!p.completado,
                vencida: !!p.vencida,
                icon: p.icono || '💳'
            });
        });
    } else if (fin) {
        (fin.ingresos || []).forEach(function(i) {
            if (Number(i.dia) === diaSel) {
                entradas.push({ clase: 'cobro', tipo: 'Ingreso', titulo: i.fuente || i.descripcion || 'Ingreso', monto: Number(i.monto) || 0, completado: !!i.cobrado, icon: '💰' });
            }
        });
        (fin.gastos || []).forEach(function(g) {
            if (Number(g.dia) === diaSel) {
                entradas.push({ clase: 'pago', tipo: 'Gasto', titulo: g.concepto || 'Gasto', monto: Number(g.monto) || 0, completado: !!g.pagado, icon: '💸' });
            }
        });
        (fin.deudas || []).forEach(function(deu) {
            if (Number(deu.dia) === diaSel) {
                entradas.push({ clase: 'pago', tipo: 'Deuda', titulo: 'Vencimiento: ' + deu.nombre, monto: Number(deu.montoCuota || deu.montoTotal) || 0, completado: !!deu.pagada, icon: '💳' });
            }
        });
    }

    if (fin && Array.isArray(fin.planificacionCompras)) {
        fin.planificacionCompras.forEach(function(comp) {
            if (String(comp.fechaLimite || '').slice(0, 10) === fechaStr) {
                entradas.push({
                    clase: 'compra',
                    tipo: 'Meta Compra',
                    titulo: comp.titulo || 'Compra Planeada',
                    monto: Number(comp.montoTotal || comp.precioTotal || comp.montoEstimado) || 0,
                    completado: !!comp.comprado,
                    icon: comp.icono || '🛒'
                });
            }
        });
    }

    return entradas;
}

function irAFechaEnCalendario(fechaStr, seccionOpcional, capaOpcional) {
    var f = parsearClaveFechaLocal(fechaStr);
    if (f) {
        CALENDARIO_ESTADO.anio = f.getFullYear();
        CALENDARIO_ESTADO.mes = f.getMonth();
        CALENDARIO_ESTADO.diaSeleccionado = f.getDate();
    }
    if (capaOpcional) {
        CALENDARIO_ESTADO.filtroCapa = capaOpcional;
    }
    if (seccionOpcional) {
        CALENDARIO_ESTADO.seccionActiva = seccionOpcional;
    } else if (CALENDARIO_ESTADO.seccionActiva !== 'mes' && CALENDARIO_ESTADO.seccionActiva !== 'semana') {
        CALENDARIO_ESTADO.seccionActiva = 'mes';
    }
    if (window.VISTA_ACTUAL !== 'vista-calendario' && typeof cambiarVista === 'function') {
        cambiarVista('vista-calendario');
    } else {
        renderizarCalendario();
    }
}

// ==========================================================================
// RENDERIZADOR PRINCIPAL DEL CALENDARIO INTEGRAL
// ==========================================================================

function renderizarCalendario() {
    var cont = document.getElementById('contenedor-calendario');
    if (!cont) return;

    if (!window.APP_STATE) window.APP_STATE = {};
    if (!Array.isArray(APP_STATE.calendario)) APP_STATE.calendario = [];
    if (!Array.isArray(APP_STATE.cronogramaSemanal)) APP_STATE.cronogramaSemanal = [];
    if (!Array.isArray(APP_STATE.agendaPersonas)) APP_STATE.agendaPersonas = [];
    if (!Array.isArray(APP_STATE.gruposPersonas)) APP_STATE.gruposPersonas = [];

    var todosItems = obtenerItemsCalendarioNormalizados();
    var recPendCount = todosItems.filter(function(i) { return i.tipo === 'recordatorio' && !i.completado; }).length;
    var hoyClave = (typeof obtenerClaveFechaLocal === 'function')
        ? obtenerClaveFechaLocal()
        : formatearClaveFecha(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    var evProxCount = todosItems.filter(function(i) { return i.tipo === 'evento' && i.fecha >= hoyClave && !i.completado; }).length;
    var destCount = todosItems.filter(function(i) { return i.tipo === 'destacado'; }).length;
    var croCount = APP_STATE.cronogramaSemanal.length;

    var sec = CALENDARIO_ESTADO.seccionActiva || 'mes';
    var capa = CALENDARIO_ESTADO.filtroCapa || 'todas';
    var claveSel = formatearClaveFecha(CALENDARIO_ESTADO.anio, CALENDARIO_ESTADO.mes, CALENDARIO_ESTADO.diaSeleccionado);

    var html = '<div class="card cal-shell-card" style="margin-bottom: 18px;">' +
        '<div class="cal-module-header">' +
            '<div style="display:flex; align-items:center; gap:12px;">' +
                '<div class="cal-hero-icon">📅</div>' +
                '<div>' +
                    '<h2 style="margin:0; font-size:19px; font-weight:800; color:#f8fafc; letter-spacing:-0.3px;">Calendario & Agenda Unificada</h2>' +
                    '<p style="margin:2px 0 0 0; font-size:12px; color:#94a3b8;">Recordatorios, Eventos, Labores (Boom, Barbería, Trainer), Quests Diarios, Personas y Finanzas en un solo lugar.</p>' +
                '</div>' +
            '</div>' +
            '<button type="button" class="btn-system" style="padding: 9px 16px; margin: 0; font-size: 13px;" onclick="abrirModalNuevoEvento(\'' + claveSel + '\')">+ Programar en Calendario</button>' +
        '</div>' +

        '<div class="cal-section-tabs" role="tablist">' +
            '<button type="button" class="cal-section-tab ' + (sec === 'mes' ? 'active' : '') + '" onclick="cambiarSeccionCalendario(\'mes\')">📅 Mes</button>' +
            '<button type="button" class="cal-section-tab ' + (sec === 'semana' ? 'active' : '') + '" onclick="cambiarSeccionCalendario(\'semana\')">🗓️ Semana (Horarios)</button>' +
            '<button type="button" class="cal-section-tab ' + (sec === 'recordatorios' ? 'active' : '') + '" onclick="cambiarSeccionCalendario(\'recordatorios\')">🔔 Recordatorios' + (recPendCount > 0 ? '<span class="cal-tab-count">' + recPendCount + '</span>' : '') + '</button>' +
            '<button type="button" class="cal-section-tab ' + (sec === 'eventos' ? 'active' : '') + '" onclick="cambiarSeccionCalendario(\'eventos\')">📆 Eventos' + (evProxCount > 0 ? '<span class="cal-tab-count">' + evProxCount + '</span>' : '') + '</button>' +
            '<button type="button" class="cal-section-tab ' + (sec === 'destacados' ? 'active' : '') + '" onclick="cambiarSeccionCalendario(\'destacados\')">⭐ Días Destacados' + (destCount > 0 ? '<span class="cal-tab-count">' + destCount + '</span>' : '') + '</button>' +
            '<button type="button" class="cal-section-tab ' + (sec === 'cronograma' ? 'active' : '') + '" onclick="cambiarSeccionCalendario(\'cronograma\')">🕒 Cronograma' + (croCount > 0 ? '<span class="cal-tab-count">' + croCount + '</span>' : '') + '</button>' +
        '</div>' +

        ((sec === 'mes' || sec === 'semana') ? (
        '<div class="cal-layer-filters" role="group" aria-label="Filtrar capas del calendario">' +
            '<span class="cal-layer-label">Capas:</span>' +
            '<button type="button" class="cal-layer-pill ' + (capa === 'todas' ? 'active' : '') + '" onclick="cambiarFiltroCapaCalendario(\'todas\')">🌐 Todas</button>' +
            '<button type="button" class="cal-layer-pill ' + (capa === 'personal' ? 'active' : '') + '" onclick="cambiarFiltroCapaCalendario(\'personal\')">👤 Personal & Rutina</button>' +
            '<button type="button" class="cal-layer-pill ' + (capa === 'labores' ? 'active' : '') + '" onclick="cambiarFiltroCapaCalendario(\'labores\')">💼 Labores</button>' +
            '<button type="button" class="cal-layer-pill ' + (capa === 'quests' ? 'active' : '') + '" onclick="cambiarFiltroCapaCalendario(\'quests\')">⚔️ Quests</button>' +
            '<button type="button" class="cal-layer-pill ' + (capa === 'finanzas' ? 'active' : '') + '" onclick="cambiarFiltroCapaCalendario(\'finanzas\')">💰 Finanzas</button>' +
        '</div>'
        ) : '') +
    '</div>';

    if (sec === 'mes') {
        html += renderizarVistaMesCalendario(claveSel, hoyClave);
    } else if (sec === 'semana') {
        html += renderizarVistaSemanaCalendario(claveSel, hoyClave);
    } else if (sec === 'recordatorios') {
        html += renderizarApartadoRecordatorios(hoyClave);
    } else if (sec === 'eventos') {
        html += renderizarApartadoEventos(hoyClave);
    } else if (sec === 'destacados') {
        html += renderizarApartadoDestacados(hoyClave);
    } else if (sec === 'cronograma') {
        html += renderizarApartadoCronograma();
    }

    cont.innerHTML = html;

    // En la vista semanal horaria, enfocar el scroll cerca de las 06:00 si es la carga inicial
    if (sec === 'semana') {
        var wrap = document.getElementById('cal-weekly-scroll-area');
        if (wrap && !wrap.dataset.scrolled) {
            wrap.scrollTop = 6 * 56; // 06:00 AM (56px/hora)
            wrap.dataset.scrolled = '1';
        }
    }
}

// ==========================================================================
// VISTA 1: CALENDARIO MENSUAL + DETALLE DEL DÍA SELECCIONADO
// ==========================================================================

function renderizarVistaMesCalendario(claveFechaSel, hoyClave) {
    var anio = CALENDARIO_ESTADO.anio;
    var mes = CALENDARIO_ESTADO.mes;
    var diaSel = CALENDARIO_ESTADO.diaSeleccionado;
    var capa = CALENDARIO_ESTADO.filtroCapa || 'todas';
    var mostrarPersonal = capaCalendarioVisible('personal');
    var mostrarLabores = capaCalendarioVisible('labores');
    var mostrarQuests = capaCalendarioVisible('quests');
    var mostrarFinanzas = capaCalendarioVisible('finanzas');

    var finMesCache = construirFinanzasMesCacheCal(anio, mes);
    var boomMesCache = {};

    var primerDiaMes = new Date(anio, mes, 1);
    var totalDiasMes = new Date(anio, mes + 1, 0).getDate();
    var diaSemanaInicio = (primerDiaMes.getDay() + 6) % 7;

    var html = '<div class="card cal-month-card" style="margin-bottom: 18px;">' +
        '<div class="calendar-top-bar">' +
            '<div class="calendar-nav-controls">' +
                '<button type="button" class="calendar-nav-btn" onclick="cambiarMesCalendario(-1)" title="Mes anterior">&#10094;</button>' +
                '<div class="calendar-title-display">' + MESES_NOMBRES[mes] + ' ' + anio + '</div>' +
                '<button type="button" class="calendar-nav-btn" onclick="cambiarMesCalendario(1)" title="Mes siguiente">&#10095;</button>' +
                '<button type="button" class="calendar-btn-today" onclick="irAHoyCalendario()" style="margin-left: 6px;">Hoy</button>' +
            '</div>' +
            '<button type="button" class="btn-sync-action btn-sync-light" onclick="cambiarSeccionCalendario(\'semana\')" style="font-size: 12px;">🗓️ Ver Cuadrícula Horaria</button>' +
        '</div>' +
        '<div class="calendar-weekdays-row">' +
            '<div class="calendar-weekday-cell">Lun</div><div class="calendar-weekday-cell">Mar</div><div class="calendar-weekday-cell">Mié</div>' +
            '<div class="calendar-weekday-cell">Jue</div><div class="calendar-weekday-cell">Vie</div><div class="calendar-weekday-cell">Sáb</div><div class="calendar-weekday-cell">Dom</div>' +
        '</div>' +
        '<div class="calendar-grid-cells">';

    var diasMesAnterior = new Date(anio, mes, 0).getDate();
    for (var p = diaSemanaInicio - 1; p >= 0; p--) {
        var prevDia = diasMesAnterior - p;
        var prevMesIdx = mes === 0 ? 11 : mes - 1;
        var prevAnioVal = mes === 0 ? anio - 1 : anio;
        html += '<div class="calendar-day-cell other-month" onclick="seleccionarOtroMesDia(' + prevAnioVal + ', ' + prevMesIdx + ', ' + prevDia + ')">' +
            '<span class="calendar-day-num">' + prevDia + '</span>' +
        '</div>';
    }

    for (var d = 1; d <= totalDiasMes; d++) {
        var claveFecha = formatearClaveFecha(anio, mes, d);
        var esHoy = (claveFecha === hoyClave);
        var esSeleccionado = (d === diaSel);

        var destacadosDia = mostrarPersonal ? obtenerDestacadosParaFecha(claveFecha) : [];
        var rawRecDia = obtenerRecordatoriosParaFecha(claveFecha);
        var rawEvDia = obtenerEventosParaFecha(claveFecha);
        var recordatoriosDia = (capa === 'labores')
            ? rawRecDia.filter(function(r) { return !!r.laborId; })
            : (mostrarPersonal ? rawRecDia : []);
        var eventosDia = (capa === 'labores')
            ? rawEvDia.filter(function(e) { return !!e.laborId; })
            : (mostrarPersonal ? rawEvDia : []);

        var diaIdx = obtenerIndiceDiaSemana(claveFecha);
        var rutinaDiaCount = mostrarPersonal ? obtenerCronogramaParaDiaSemana(diaIdx).length : 0;

        var boomInfo = (mostrarLabores || mostrarFinanzas) ? obtenerInfoBoomParaDiaCal(claveFecha, boomMesCache) : null;
        var csDia = mostrarLabores ? obtenerCortesYSesionesDiaCal(claveFecha) : { cortes: [], sesiones: [], registrosExtra: [] };
        var questsDia = mostrarQuests ? obtenerQuestsProgramadasParaFecha(claveFecha, hoyClave) : [];
        var personasDia = mostrarPersonal ? obtenerPersonasAgendadasParaFecha(claveFecha) : [];
        var finanzasDia = mostrarFinanzas ? obtenerFinanzasUnificadasParaDia(anio, mes, d, claveFecha, finMesCache) : [];

        var hasLaborDot = mostrarLabores && (
            (boomInfo && boomInfo.diaInfo && boomInfo.diaInfo.tipo !== 'domingo_libre') ||
            csDia.cortes.length > 0 ||
            csDia.sesiones.length > 0 ||
            csDia.registrosExtra.length > 0 ||
            (capa === 'labores' && (eventosDia.length > 0 || recordatoriosDia.length > 0))
        );
        var hasFinanceDot = mostrarFinanzas && (finanzasDia.length > 0 || !!(boomInfo && boomInfo.pagoBoom));

        var regDia = (APP_STATE.registroDiarioCalendario && APP_STATE.registroDiarioCalendario[claveFecha]) ? APP_STATE.registroDiarioCalendario[claveFecha] : null;
        if (!regDia && esHoy && typeof calcularMetricasPurasSinActualizar === 'function') {
            regDia = calcularMetricasPurasSinActualizar();
        }
        var pctGeneral = regDia ? Math.round(Number(regDia.general) || 0) : 0;
        var badgeClass = 'badge-cero';
        if (pctGeneral >= 75) badgeClass = 'badge-alto';
        else if (pctGeneral >= 35) badgeClass = 'badge-medio';
        else if (pctGeneral > 0) badgeClass = 'badge-leve';

        var classes = 'calendar-day-cell';
        if (esHoy) classes += ' is-today';
        if (esSeleccionado) classes += ' is-selected';
        if (destacadosDia.length > 0) classes += ' is-destacado';

        var recPend = recordatoriosDia.filter(function(r) { return !r.completado; }).length;
        var destMini = destacadosDia.length > 0
            ? '<div class="cal-cell-dest-pill" title="' + calEscHtml(destacadosDia[0].titulo) + '">⭐ ' + calEscHtml(destacadosDia[0].titulo) + '</div>'
            : '';

        var laborMini = '';
        if (mostrarLabores) {
            if (boomInfo && boomInfo.diaInfo && boomInfo.diaInfo.tipo !== 'domingo_libre') {
                var bd = boomInfo.diaInfo;
                if (bd.cumplido) laborMini = '<div class="cal-cell-labor-tag is-done" title="Boom Solutions: Jornada 8h cumplida">✓ 8h</div>';
                else if (bd.tipo === 'sabado_libre') laborMini = '<div class="cal-cell-labor-tag is-free" title="Boom Solutions: Sábado libre">🏖️ Lib</div>';
                else if (bd.tipo === 'sabado_trabajo') laborMini = '<div class="cal-cell-labor-tag is-sab" title="Boom Solutions: Sábado de trabajo 8h">⚡ 8h</div>';
                else laborMini = '<div class="cal-cell-labor-tag is-work" title="Boom Solutions: Turno 8:00–16:30">💼 8h</div>';
            } else if (csDia.cortes.length > 0) {
                laborMini = '<div class="cal-cell-labor-tag is-barber" title="Barbería: ' + csDia.cortes.length + ' corte(s)">💈 ×' + csDia.cortes.length + '</div>';
            } else if (csDia.sesiones.length > 0) {
                laborMini = '<div class="cal-cell-labor-tag is-trainer" title="Trainer: ' + csDia.sesiones.length + ' sesión(es)">🏋️ ×' + csDia.sesiones.length + '</div>';
            }
        }

        html += '<div class="' + classes + '" onclick="seleccionarDiaCalendario(' + d + ')">' +
            '<span class="calendar-day-num">' + d + '</span>' +
            '<span class="calendar-wear-badge ' + badgeClass + '">' + pctGeneral + '%</span>' +
            destMini +
            laborMini +
            '<div class="calendar-dots-container">' +
                (eventosDia.length > 0 ? '<span class="calendar-dot dot-event" title="' + eventosDia.length + ' evento(s)"></span>' : '') +
                (recPend > 0 ? '<span class="calendar-dot dot-reminder" title="' + recPend + ' recordatorio(s) pendiente(s)"></span>' : '') +
                (destacadosDia.length > 0 ? '<span class="calendar-dot dot-destacado" title="Día destacado"></span>' : '') +
                (rutinaDiaCount > 0 ? '<span class="calendar-dot dot-routine" title="' + rutinaDiaCount + ' bloque(s) de rutina semanal"></span>' : '') +
                (hasLaborDot ? '<span class="calendar-dot dot-labor" title="Labores / Jornada"></span>' : '') +
                (questsDia.length > 0 ? '<span class="calendar-dot dot-quest" title="' + questsDia.length + ' Quest(s) programada(s)"></span>' : '') +
                (personasDia.length > 0 ? '<span class="calendar-dot dot-persona" title="' + personasDia.length + ' Persona(s) agendada(s)"></span>' : '') +
                (hasFinanceDot ? '<span class="calendar-dot dot-finance" title="Movimiento financiero"></span>' : '') +
            '</div>' +
        '</div>';
    }

    var celdasUsadas = diaSemanaInicio + totalDiasMes;
    var celdasRestantes = (7 - (celdasUsadas % 7)) % 7;
    for (var n = 1; n <= celdasRestantes; n++) {
        var nextMesIdx = mes === 11 ? 0 : mes + 1;
        var nextAnioVal = mes === 11 ? anio + 1 : anio;
        html += '<div class="calendar-day-cell other-month" onclick="seleccionarOtroMesDia(' + nextAnioVal + ', ' + nextMesIdx + ', ' + n + ')">' +
            '<span class="calendar-day-num">' + n + '</span>' +
        '</div>';
    }

    html += '</div>' +
        '<div class="calendar-legend-bar">' +
            '<div class="calendar-legend-item"><span class="calendar-dot dot-event"></span><span>Eventos</span></div>' +
            '<div class="calendar-legend-item"><span class="calendar-dot dot-reminder"></span><span>Recordatorios</span></div>' +
            '<div class="calendar-legend-item"><span class="calendar-dot dot-destacado"></span><span>Destacados</span></div>' +
            '<div class="calendar-legend-item"><span class="calendar-dot dot-routine"></span><span>Rutina</span></div>' +
            '<div class="calendar-legend-item"><span class="calendar-dot dot-labor"></span><span>Labores</span></div>' +
            '<div class="calendar-legend-item"><span class="calendar-dot dot-quest"></span><span>Quests</span></div>' +
            '<div class="calendar-legend-item"><span class="calendar-dot dot-persona"></span><span>Personas</span></div>' +
            '<div class="calendar-legend-item"><span class="calendar-dot dot-finance"></span><span>Finanzas</span></div>' +
        '</div>' +
    '</div>';

    html += renderizarPanelDetalleDia(claveFechaSel, hoyClave, finMesCache, boomMesCache);
    return html;
}

function renderizarPanelDetalleDia(claveFechaSel, hoyClave, finMesCacheOpt, boomMesCacheOpt) {
    var fechaObj = parsearClaveFechaLocal(claveFechaSel) || new Date();
    var diaSel = fechaObj.getDate();
    var anioSel = fechaObj.getFullYear();
    var mesSel = fechaObj.getMonth();
    var diaIdx = (fechaObj.getDay() + 6) % 7;
    var fechaTextoCompleto = DIAS_SEMANA_NOMBRES[diaIdx] + ", " + diaSel + " de " + MESES_NOMBRES[mesSel] + " de " + anioSel;
    var esHoySel = (claveFechaSel === hoyClave);

    var capa = CALENDARIO_ESTADO.filtroCapa || 'todas';
    var mostrarPersonal = capaCalendarioVisible('personal');
    var mostrarLabores = capaCalendarioVisible('labores');
    var mostrarQuests = capaCalendarioVisible('quests');
    var mostrarFinanzas = capaCalendarioVisible('finanzas');

    var destacadosDia = mostrarPersonal ? obtenerDestacadosParaFecha(claveFechaSel) : [];
    var rawRecDia = obtenerRecordatoriosParaFecha(claveFechaSel);
    var rawEvDia = obtenerEventosParaFecha(claveFechaSel);
    var recordatoriosDia = (capa === 'labores')
        ? rawRecDia.filter(function(r) { return !!r.laborId; })
        : (mostrarPersonal ? rawRecDia : []);
    var eventosDia = (capa === 'labores')
        ? rawEvDia.filter(function(e) { return !!e.laborId; })
        : (mostrarPersonal ? rawEvDia : []);
    var cronogramaDia = mostrarPersonal ? obtenerCronogramaParaDiaSemana(diaIdx) : [];

    // Detectar qué bloques de rutina semanal tienen superposición con Eventos en esta fecha exacta
    var cronogramaConEstado = cronogramaDia.map(function(b) {
        var rStart = parseHoraAMinutos(b.horaInicio);
        var rEnd = parseHoraAMinutos(b.horaFin);
        var desplazadoPor = [];
        if (rStart !== null && rEnd !== null) {
            eventosDia.forEach(function(ev) {
                if (typeof ev._startMin === 'number' && typeof ev._endMinRaw === 'number' && intervalosSolapan(rStart, rEnd, ev._startMin, ev._endMinRaw)) {
                    desplazadoPor.push(ev.titulo);
                }
            });
        }
        return { bloque: b, desplazadoPor: desplazadoPor };
    });

    var boomInfo = (mostrarLabores || mostrarFinanzas) ? obtenerInfoBoomParaDiaCal(claveFechaSel, boomMesCacheOpt) : null;
    var csDia = mostrarLabores ? obtenerCortesYSesionesDiaCal(claveFechaSel) : { cortes: [], sesiones: [], registrosExtra: [] };
    var questsDia = mostrarQuests ? obtenerQuestsProgramadasParaFecha(claveFechaSel, hoyClave) : [];
    var personasDia = mostrarPersonal ? obtenerPersonasAgendadasParaFecha(claveFechaSel) : [];
    var finanzasDia = mostrarFinanzas ? obtenerFinanzasUnificadasParaDia(anioSel, mesSel, diaSel, claveFechaSel, finMesCacheOpt) : [];

    var html = '<div class="card cal-detail-card">' +
        '<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">' +
            '<div>' +
                '<span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">DETALLE UNIFICADO DE JORNADA</span>' +
                '<h3 style="margin: 2px 0 0 0; font-size: 17.5px; color: #f8fafc;">' + calEscHtml(fechaTextoCompleto) + '</h3>' +
            '</div>' +
            '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
                '<button type="button" class="btn-sync-action btn-sync-light" style="font-size:11.5px;" onclick="abrirModalNuevoEvento(\'' + claveFechaSel + '\', \'recordatorio\')">🔔 + Recordatorio</button>' +
                '<button type="button" class="btn-sync-action btn-sync-light" style="font-size:11.5px;" onclick="abrirModalNuevoEvento(\'' + claveFechaSel + '\', \'evento\')">📆 + Evento</button>' +
                '<button type="button" class="btn-sync-action btn-sync-light" style="font-size:11.5px;" onclick="abrirModalNuevoEvento(\'' + claveFechaSel + '\', \'destacado\')">⭐ + Destacado</button>' +
            '</div>' +
        '</div>';

    // 1. BANNERS SUPERIORES DE DÍAS DESTACADOS
    if (destacadosDia.length > 0) {
        html += '<div class="cal-destacado-banners-stack">';
        destacadosDia.forEach(function(dest) {
            var per = resolverPersonaPorId(dest.personaId, dest.personaNombre);
            var col = dest.color || '#f59e0b';
            html += '<div class="cal-destacado-top-banner" style="border-left: 4px solid ' + col + '; background: linear-gradient(135deg, ' + col + '22, rgba(15, 23, 42, 0.92));">' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">' +
                        '<span class="cal-pill-badge" style="background:' + col + '33; color:#fde68a; border:1px solid ' + col + '66;">⭐ DÍA DESTACADO · TODO EL DÍA</span>' +
                        (dest.repetirAnualmente ? '<span class="cal-pill-badge" style="background:rgba(139,92,246,0.2); color:#ddd6fe;">🔁 Anual' + (dest.aniosTranscurridos > 0 ? ' · Año +' + dest.aniosTranscurridos : '') + '</span>' : '') +
                        (per ? '<span class="cal-person-chip">👤 ' + calEscHtml(per.nombre) + '</span>' : '') +
                    '</div>' +
                    '<div style="font-size:15px; font-weight:800; color:#f8fafc;">' + calEscHtml(dest.titulo) + '</div>' +
                    (dest.descripcion ? '<p style="margin:4px 0 0 0; font-size:12px; color:#cbd5e1;">' + calEscHtml(dest.descripcion) + '</p>' : '') +
                '</div>' +
                '<div style="display:flex; gap:4px;">' +
                    '<button type="button" class="cal-icon-btn" onclick="abrirModalNuevoEvento(\'' + claveFechaSel + '\', \'destacado\', \'' + calEscHtml(dest.id) + '\')" title="Editar">✏️</button>' +
                    '<button type="button" class="cal-icon-btn danger" onclick="eliminarEventoCalendario(\'' + calEscHtml(dest.id) + '\')" title="Eliminar">🗑️</button>' +
                '</div>' +
            '</div>';
        });
        html += '</div>';
    }

    // 2. RECORDATORIOS DEL DÍA
    if (mostrarPersonal || recordatoriosDia.length > 0) {
        html += '<div class="cal-day-section-block">' +
            '<div class="cal-day-section-title"><span>🔔 Recordatorios del Día (' + recordatoriosDia.length + ')</span></div>';
        if (recordatoriosDia.length > 0) {
            html += '<div class="calendar-events-container" style="margin-top:8px;">';
            recordatoriosDia.forEach(function(rec) {
                html += renderizarTarjetaRecordatorio(rec, true);
            });
            html += '</div>';
        } else {
            html += '<div class="cal-empty-mini">Sin recordatorios' + (capa === 'labores' ? ' vinculados a Labores' : '') + ' en esta fecha.</div>';
        }
        html += '</div>';
    }

    // 3. EVENTOS PROGRAMADOS DEL DÍA
    if (mostrarPersonal || eventosDia.length > 0) {
        html += '<div class="cal-day-section-block">' +
            '<div class="cal-day-section-title"><span>📆 Eventos Programados (' + eventosDia.length + ')</span></div>';
        if (eventosDia.length > 0) {
            html += '<div class="calendar-events-container" style="margin-top:8px;">';
            eventosDia.forEach(function(ev) {
                html += renderizarTarjetaEvento(ev, eventosDia);
            });
            html += '</div>';
        } else {
            html += '<div class="cal-empty-mini">Sin eventos programados' + (capa === 'labores' ? ' vinculados a Labores' : '') + ' en esta fecha.</div>';
        }
        html += '</div>';
    }

    // 4. CRONOGRAMA SEMANAL APLICADO A ESTE DÍA
    if (cronogramaConEstado.length > 0) {
        html += '<div class="cal-day-section-block">' +
            '<div class="cal-day-section-title"><span>🕒 Cronograma Base (' + DIAS_SEMANA_NOMBRES[diaIdx] + ')</span></div>' +
            '<div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">';
        cronogramaConEstado.forEach(function(entry) {
            var b = entry.bloque;
            var col = b.color || '#6366f1';
            var desplazado = entry.desplazadoPor.length > 0;
            html += '<div class="cal-routine-day-row ' + (desplazado ? 'is-overridden' : '') + '" style="border-left: 3px solid ' + col + ';">' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">' +
                        '<span style="font-size:12px; font-weight:700; color:#cbd5e1;">🕒 ' + calEscHtml(b.horaInicio) + ' – ' + calEscHtml(b.horaFin) + '</span>' +
                        '<span class="cal-pill-badge" style="background:' + col + '25; color:#e2e8f0;">' + calEscHtml(b.etiqueta || 'Rutina') + '</span>' +
                        (desplazado ? '<span class="cal-pill-badge" style="background:rgba(245,158,11,0.2); color:#fbbf24;">Prioridad Evento: ' + calEscHtml(entry.desplazadoPor.join(', ')) + '</span>' : '') +
                    '</div>' +
                    '<div style="font-size:13.5px; font-weight:700; color:#f8fafc; margin-top:3px;">' + calEscHtml(b.titulo) + '</div>' +
                '</div>' +
                '<button type="button" class="cal-icon-btn" onclick="abrirModalNuevoEvento(null, \'cronograma\', \'' + calEscHtml(b.id) + '\')" title="Editar bloque semanal">✏️</button>' +
            '</div>';
        });
        html += '</div></div>';
    }

    // 5. LABORES & JORNADAS DEL DÍA (BOOM SOLUTIONS, BARBERÍA, TRAINER)
    if (mostrarLabores) {
        var boomDia = boomInfo ? boomInfo.diaInfo : null;
        var mesClaveSel = claveFechaSel.slice(0, 7);
        html += '<div class="cal-day-section-block">' +
            '<div class="cal-day-section-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">' +
                '<span>💼 Labores & Jornadas</span>' +
                '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
                    '<button type="button" class="cal-mini-link-btn" onclick="abrirModalNuevoEvento(\'' + claveFechaSel + '\', \'evento\', null, \'09:00\', \'LAB-BARBER\')">+ Cita Barbería</button>' +
                    '<button type="button" class="cal-mini-link-btn" onclick="abrirModalNuevoEvento(\'' + claveFechaSel + '\', \'evento\', null, \'09:00\', \'LAB-TRAINER\')">+ Sesión Trainer</button>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">';

        if (boomDia) {
            var esDescansoBoom = (boomDia.tipo === 'domingo_libre' || boomDia.tipo === 'sabado_libre');
            var labelBoom = 'Jornada Laboral Boom Solutions · 8:00 AM – 4:30 PM (8.0 hrs)';
            var pillBoomTxt = '💼 8.0h Programada';
            var pillBoomBg = 'rgba(99,102,241,0.18)';
            var pillBoomCol = '#a5b4fc';
            if (boomDia.tipo === 'sabado_libre') {
                labelBoom = 'Sábado Libre Asignado (Boom Solutions)';
                pillBoomTxt = '🏖️ Sábado Libre';
                pillBoomBg = 'rgba(16,185,129,0.18)';
                pillBoomCol = '#6ee7b7';
            } else if (boomDia.tipo === 'domingo_libre') {
                labelBoom = 'Domingo de Descanso (Boom Solutions)';
                pillBoomTxt = '🌴 Descanso';
                pillBoomBg = 'rgba(100,116,139,0.18)';
                pillBoomCol = '#cbd5e1';
            } else if (boomDia.tipo === 'sabado_trabajo') {
                labelBoom = 'Sábado de Trabajo Boom Solutions · 8:00 AM – 4:30 PM (8.0 hrs)';
                pillBoomTxt = boomDia.cumplido ? '✓ Sábado 8.0h Cumplido' : '⚡ Sábado Laboral';
                pillBoomBg = boomDia.cumplido ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.18)';
                pillBoomCol = boomDia.cumplido ? '#34d399' : '#fcd34d';
            } else if (boomDia.cumplido) {
                pillBoomTxt = '✓ 8.0h Cumplida (+80 EXP)';
                pillBoomBg = 'rgba(16,185,129,0.22)';
                pillBoomCol = '#34d399';
            }

            html += '<div class="cal-labor-day-card" style="border-left: 3px solid ' + (boomDia.cumplido ? '#10b981' : (boomDia.tipo === 'sabado_trabajo' ? '#f59e0b' : '#6366f1')) + ';">' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:4px;">' +
                        '<span class="cal-pill-badge" style="background:' + pillBoomBg + '; color:' + pillBoomCol + ';">🚀 ' + pillBoomTxt + '</span>' +
                    '</div>' +
                    '<div style="font-size:13.5px; font-weight:700; color:#f8fafc;">' + labelBoom + '</div>' +
                '</div>' +
                '<div style="display:flex; gap:6px; flex-wrap:wrap; flex-shrink:0;">' +
                    (!esDescansoBoom ? '<button type="button" class="cal-btn-complete-mini" style="' + (boomDia.cumplido ? 'background:rgba(16,185,129,0.25); color:#6ee7b7;' : 'background:rgba(99,102,241,0.22); border-color:rgba(129,140,248,0.45); color:#c7d2fe;') + '" onclick="if(typeof toggleCumplidoDiaBoomDesdeCalendario===\'function\') toggleCumplidoDiaBoomDesdeCalendario(\'' + claveFechaSel + '\')">' + (boomDia.cumplido ? '✓ Cumplida (Revertir)' : '✓ Marcar 8.0h') + '</button>' : '') +
                    '<button type="button" class="cal-icon-btn" onclick="if(typeof abrirConfigSabadosBoomDesdeCalendario===\'function\') abrirConfigSabadosBoomDesdeCalendario(\'' + mesClaveSel + '\')" title="Ajustar Sábados Libres y Sueldos Boom">⚙️</button>' +
                '</div>' +
            '</div>';
        }

        if (csDia.cortes.length > 0) {
            csDia.cortes.forEach(function(c) {
                var durC = Number(c.duracionMinutos) || 0;
                var cobroC = Number(c.cobro) || 0;
                html += '<div class="cal-labor-day-card" style="border-left: 3px solid #10b981;">' +
                    '<div style="flex:1; min-width:0;">' +
                        '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:3px;">' +
                            '<span class="cal-pill-badge" style="background:rgba(16,185,129,0.18); color:#6ee7b7;">💈 Barbería</span>' +
                            (durC > 0 ? '<span class="cal-pill-badge" style="background:rgba(255,255,255,0.06); color:#cbd5e1;">⏱️ ' + durC + ' min</span>' : '') +
                            (cobroC > 0 ? '<span class="cal-pill-badge" style="background:rgba(16,185,129,0.14); color:#34d399;">$' + cobroC.toFixed(2) + '</span>' : '') +
                        '</div>' +
                        '<div style="font-size:13.5px; font-weight:700; color:#f8fafc;">' + calEscHtml(c.clienteNombre || 'Cliente') + (c.estiloNombre ? ' · ' + calEscHtml(c.estiloNombre) : '') + '</div>' +
                    '</div>' +
                    '<button type="button" class="cal-mini-link-btn" onclick="if(typeof abrirSubAppLabor===\'function\') abrirSubAppLabor(\'LAB-BARBER\')">Abrir 💈</button>' +
                '</div>';
            });
        }

        if (csDia.sesiones.length > 0) {
            csDia.sesiones.forEach(function(s) {
                var durS = Number(s.duracionMinutos) || 0;
                var cobroS = Number(s.cobro) || 0;
                html += '<div class="cal-labor-day-card" style="border-left: 3px solid #f59e0b;">' +
                    '<div style="flex:1; min-width:0;">' +
                        '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:3px;">' +
                            '<span class="cal-pill-badge" style="background:rgba(245,158,11,0.18); color:#fcd34d;">🏋️ Personal Trainer</span>' +
                            (durS > 0 ? '<span class="cal-pill-badge" style="background:rgba(255,255,255,0.06); color:#cbd5e1;">⏱️ ' + durS + ' min</span>' : '') +
                            (cobroS > 0 ? '<span class="cal-pill-badge" style="background:rgba(16,185,129,0.14); color:#34d399;">$' + cobroS.toFixed(2) + '</span>' : '') +
                        '</div>' +
                        '<div style="font-size:13.5px; font-weight:700; color:#f8fafc;">' + calEscHtml(s.alumnoNombre || 'Alumno') + (s.enfoqueNombre ? ' · ' + calEscHtml(s.enfoqueNombre) : '') + '</div>' +
                    '</div>' +
                    '<button type="button" class="cal-mini-link-btn" onclick="if(typeof abrirSubAppLabor===\'function\') abrirSubAppLabor(\'LAB-TRAINER\')">Abrir 🏋️</button>' +
                '</div>';
            });
        }

        if (csDia.registrosExtra.length > 0) {
            csDia.registrosExtra.forEach(function(regL) {
                var metaLab = normalizarMetaLaborCalendario(regL.laborId);
                html += '<div class="cal-labor-day-card" style="border-left: 3px solid ' + (metaLab ? metaLab.color : '#818cf8') + ';">' +
                    '<div style="flex:1; min-width:0;">' +
                        '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:3px;">' +
                            '<span class="cal-pill-badge" style="background:rgba(129,140,248,0.18); color:#c7d2fe;">' + (metaLab ? metaLab.icono + ' ' + calEscHtml(metaLab.nombre) : '💼 Registro Labor') + '</span>' +
                            (Number(regL.horas) > 0 ? '<span class="cal-pill-badge" style="background:rgba(255,255,255,0.06); color:#cbd5e1;">⏱️ ' + Number(regL.horas).toFixed(1) + 'h</span>' : '') +
                        '</div>' +
                        '<div style="font-size:13px; font-weight:600; color:#e2e8f0;">' + calEscHtml(regL.descripcion || regL.notas || 'Actividad laboral registrada') + '</div>' +
                    '</div>' +
                '</div>';
            });
        }

        html += '</div></div>';
    }

    // 6. QUESTS DIARIOS PROGRAMADAS POR HORA
    if (mostrarQuests && questsDia.length > 0) {
        html += '<div class="cal-day-section-block">' +
            '<div class="cal-day-section-title" style="display:flex; justify-content:space-between; align-items:center;">' +
                '<span>⚔️ Quests Diarios Programadas (' + questsDia.length + ')</span>' +
                '<button type="button" class="cal-mini-link-btn" onclick="if(typeof cambiarVista===\'function\') cambiarVista(\'vista-quests-diarios\')">Ir a Quests →</button>' +
            '</div>' +
            '<div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">';
        questsDia.forEach(function(q) {
            html += '<div class="cal-unified-row ' + (q.completado ? 'is-completed' : '') + '" style="border-left: 3px solid #2dd4bf;">' +
                '<div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">' +
                    '<span style="font-size:12px; font-weight:800; color:#5eead4; flex-shrink:0;">🕒 ' + calEscHtml(q.hora) + '</span>' +
                    '<span style="font-size:13px; font-weight:700; color:#f8fafc; overflow:hidden; text-overflow:ellipsis;">' + calEscHtml(q.titulo) + '</span>' +
                '</div>' +
                '<div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">' +
                    (q.xp > 0 ? '<span class="cal-pill-badge" style="background:rgba(45,212,191,0.16); color:#5eead4;">+' + q.xp + ' XP</span>' : '') +
                    '<span class="calendar-event-cat-badge">' + (q.completado ? '✓ Hecho' : 'Programada') + '</span>' +
                '</div>' +
            '</div>';
        });
        html += '</div></div>';
    }

    // 7. PERSONAS AGENDADAS EN ESTA FECHA
    if (mostrarPersonal && personasDia.length > 0) {
        html += '<div class="cal-day-section-block">' +
            '<div class="cal-day-section-title" style="display:flex; justify-content:space-between; align-items:center;">' +
                '<span>👥 Personas con Fecha Objetivo (' + personasDia.length + ')</span>' +
                '<button type="button" class="cal-mini-link-btn" onclick="if(typeof cambiarVista===\'function\') cambiarVista(\'vista-personas\')">Ver Personas →</button>' +
            '</div>' +
            '<div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">';
        personasDia.forEach(function(p) {
            html += '<div class="cal-unified-row" style="border-left: 3px solid #f472b6;">' +
                '<div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">' +
                    '<span>👤</span>' +
                    '<div style="min-width:0;">' +
                        '<div style="font-size:13px; font-weight:700; color:#f8fafc;">' + calEscHtml(p.nombre) + '</div>' +
                        '<div style="font-size:11px; color:#94a3b8;">' + calEscHtml(p.rol || 'Contacto') + (p.ubicacionCategoria ? ' · 📍 ' + calEscHtml(p.ubicacionCategoria) : '') + '</div>' +
                    '</div>' +
                '</div>' +
                '<span class="cal-pill-badge" style="background:rgba(244,114,182,0.18); color:#f9a8d4;">' + calEscHtml(p.estado || 'Agendado') + '</span>' +
            '</div>';
        });
        html += '</div></div>';
    }

    // 8. MÉTRICAS DEL AVATAR (DESGASTE Y RENDIMIENTO)
    if (mostrarPersonal) {
        var regSel = (APP_STATE.registroDiarioCalendario && APP_STATE.registroDiarioCalendario[claveFechaSel]) ? APP_STATE.registroDiarioCalendario[claveFechaSel] : null;
        if (!regSel && esHoySel && typeof calcularMetricasPurasSinActualizar === 'function') {
            regSel = calcularMetricasPurasSinActualizar();
        }
        var generalVal = regSel ? (Math.round(Number(regSel.general)) || 0) : 0;
        var cuerpoVal = regSel ? (Math.round(Number(regSel.cuerpo)) || 0) : 0;
        var menteVal = regSel ? (Math.round(Number(regSel.mente)) || 0) : 0;
        var estadoJornada = esHoySel ? "⚡ Jornada en curso (Hoy)" : (regSel ? "✓ Jornada archivada" : "Sin registro");

        html += '<div class="calendar-day-metrics-card" style="margin-top: 16px;">' +
            '<div class="metrics-card-header">' +
                '<div>' +
                    '<span class="metrics-card-label">BALANCE DEL AVATAR · DESGASTE Y RENDIMIENTO</span>' +
                    '<div style="font-size: 11.5px; color: #94a3b8; margin-top: 2px;">' +
                        (esHoySel ? 'Monitoreo dinámico del día de hoy. Se archiva a medianoche.' : 'Registro final alcanzado al término de esta jornada.') +
                    '</div>' +
                '</div>' +
                '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">' +
                    '<span class="metrics-card-status">' + estadoJornada + '</span>' +
                    (esHoySel ? '<button type="button" class="btn-sync-action btn-sync-light" onclick="reiniciarJornadaDiariaManual()" style="font-size: 11px; padding: 5px 10px;">🔄 Cerrar & Reiniciar (0%)</button>' : '') +
                '</div>' +
            '</div>' +
            '<div class="metrics-card-grid">' +
                '<div class="metric-box"><span class="metric-label">Desgaste General</span><span class="metric-val">' + generalVal + '%</span><div class="metric-bar-bg"><div class="metric-bar-fill" style="width: ' + generalVal + '%;"></div></div></div>' +
                '<div class="metric-box"><span class="metric-label">Carga Física</span><span class="metric-val">' + cuerpoVal + '%</span><div class="metric-bar-bg"><div class="metric-bar-fill" style="width: ' + cuerpoVal + '%;"></div></div></div>' +
                '<div class="metric-box"><span class="metric-label">Carga Neural</span><span class="metric-val">' + menteVal + '%</span><div class="metric-bar-bg"><div class="metric-bar-fill" style="width: ' + menteVal + '%;"></div></div></div>' +
            '</div>' +
        '</div>';
    }

    // 9. FINANZAS UNIFICADAS DEL DÍA + PAGOS DE BOOM
    var pagoBoomDia = (mostrarFinanzas || mostrarLabores) && boomInfo ? boomInfo.pagoBoom : null;
    if (mostrarFinanzas && (finanzasDia.length > 0 || pagoBoomDia)) {
        html += '<div style="margin-top: 16px;">' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
                '<span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">💰 SISTEMA FINANCIERO & COBROS · DÍA ' + diaSel + '</span>' +
                '<button type="button" class="cal-mini-link-btn" onclick="if(typeof cambiarVista===\'function\') cambiarVista(\'vista-finanzas\')">Ir a Finanzas →</button>' +
            '</div>' +
            '<div style="display: flex; flex-direction: column; gap: 6px;">';

        if (pagoBoomDia) {
            html += '<div class="calendar-system-activity-item" style="border-left: 3px solid ' + (pagoBoomDia.cobrado ? '#10b981' : '#f59e0b') + '; border-style: solid;">' +
                '<div style="display: flex; align-items: center; gap: 8px;"><span>🚀</span><span>' + calEscHtml(pagoBoomDia.titulo) + ' (+$' + pagoBoomDia.monto.toFixed(2) + ')</span></div>' +
                '<div style="display:flex; align-items:center; gap:6px;">' +
                    '<span class="cal-pill-badge" style="background:' + (pagoBoomDia.cobrado ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)') + '; color:' + (pagoBoomDia.cobrado ? '#34d399' : '#fbbf24') + ';">' + (pagoBoomDia.cobrado ? '✓ COBRADO' : '⏳ PENDIENTE') + '</span>' +
                    '<button type="button" class="cal-mini-link-btn" onclick="if(typeof abrirSubAppLabor===\'function\') abrirSubAppLabor(\'LAB-BOOM\')">Boom →</button>' +
                '</div>' +
            '</div>';
        }

        finanzasDia.forEach(function(item) {
            var sign = item.clase === 'cobro' ? '+$' : (item.clase === 'pago' ? '-$' : '$');
            var colFin = item.clase === 'cobro' ? '#34d399' : (item.clase === 'pago' ? '#f87171' : '#fbbf24');
            html += '<div class="calendar-system-activity-item">' +
                '<div style="display: flex; align-items: center; gap: 8px; min-width:0; flex:1;"><span>' + item.icon + '</span><span style="overflow:hidden; text-overflow:ellipsis;">' + calEscHtml(item.titulo) + ' (<strong style="color:' + colFin + ';">' + sign + item.monto.toFixed(2) + '</strong>)</span></div>' +
                '<div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">' +
                    (item.completado ? '<span class="cal-pill-badge" style="background:rgba(16,185,129,0.18); color:#34d399;">✓</span>' : (item.vencida ? '<span class="cal-pill-badge" style="background:rgba(239,68,68,0.2); color:#fca5a5;">Vencida</span>' : '')) +
                    '<span class="calendar-event-cat-badge">' + calEscHtml(item.tipo) + '</span>' +
                '</div>' +
            '</div>';
        });
        html += '</div></div>';
    }

    html += '</div>';
    return html;
}

// ==========================================================================
// TARJETAS REUTILIZABLES DE RECORDATORIO Y EVENTO
// ==========================================================================

function renderizarTarjetaRecordatorio(rec, compacto) {
    var per = resolverPersonaPorId(rec.personaId, rec.personaNombre);
    var labMetaR = normalizarMetaLaborCalendario(rec.laborId);
    var ahora = Date.now();
    var targetMs = obtenerFechaHoraMs(rec.fecha, rec.hora);
    var dueMs = (rec.pospuestoHasta && rec.pospuestoHasta > targetMs) ? rec.pospuestoHasta : targetMs;
    var vencido = !rec.completado && !isNaN(dueMs) && ahora >= dueMs;

    return '<div class="calendar-event-card cal-type-reminder ' + (rec.completado ? 'is-completed' : '') + ' ' + (vencido ? 'is-overdue' : '') + '">' +
        '<div style="display:flex; align-items:flex-start; gap:12px; flex:1; min-width:0;">' +
            '<input type="checkbox" ' + (rec.completado ? 'checked' : '') + ' style="margin-top:4px; cursor:pointer; width:17px; height:17px; accent-color:#10b981;" onchange="toggleCompletarEventoCalendario(\'' + calEscHtml(rec.id) + '\')" title="Marcar completado">' +
            '<div style="flex:1; min-width:0;">' +
                '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:4px;">' +
                    '<span class="cal-pill-badge" style="background:rgba(245,158,11,0.16); color:#fbbf24;">🔔 Recordatorio</span>' +
                    (labMetaR ? '<span class="cal-pill-badge" style="background:' + labMetaR.color + '22; color:#e2e8f0; border:1px solid ' + labMetaR.color + '44;">' + labMetaR.icono + ' ' + calEscHtml(labMetaR.nombre) + '</span>' : '') +
                    '<span style="font-size:12px; font-weight:700; color:#e2e8f0;">🕒 ' + calEscHtml(rec.hora || '--:--') + (compacto ? '' : ' · ' + formatearFechaLegibleCorta(rec.fecha)) + '</span>' +
                    (vencido ? '<span class="cal-pill-badge" style="background:rgba(239,68,68,0.22); color:#fca5a5;">EN HORA / ACTIVO</span>' : '') +
                    (rec.completado ? '<span class="cal-pill-badge" style="background:rgba(16,185,129,0.2); color:#34d399;">✓ Completado</span>' : '') +
                '</div>' +
                '<div class="calendar-event-title-text" style="font-size:14.5px; font-weight:700; color:#f8fafc;">' + calEscHtml(rec.titulo) + '</div>' +
                (per ? '<div style="margin-top:4px;"><span class="cal-person-chip">👤 ' + calEscHtml(per.nombre) + '</span></div>' : '') +
                (rec.descripcion ? '<p style="margin:5px 0 0 0; font-size:12px; color:#94a3b8; line-height:1.4;">' + calEscHtml(rec.descripcion) + '</p>' : '') +
            '</div>' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">' +
            (!rec.completado ? '<button type="button" class="cal-btn-complete-mini" onclick="toggleCompletarEventoCalendario(\'' + calEscHtml(rec.id) + '\')" title="Marcar Completado">✓ Completar</button>' : '') +
            '<button type="button" class="cal-icon-btn" onclick="abrirModalNuevoEvento(\'' + calEscHtml(rec.fecha) + '\', \'recordatorio\', \'' + calEscHtml(rec.id) + '\')" title="Editar">✏️</button>' +
            '<button type="button" class="cal-icon-btn danger" onclick="eliminarEventoCalendario(\'' + calEscHtml(rec.id) + '\')" title="Eliminar">🗑️</button>' +
        '</div>' +
    '</div>';
}

function renderizarTarjetaEvento(ev, eventosMismoDia) {
    var col = ev.color || '#38bdf8';
    var labMetaE = normalizarMetaLaborCalendario(ev.laborId);
    var horarioTexto = ev.horaInicio
        ? ('🕒 ' + calEscHtml(ev.horaInicio) + (ev.horaFin ? ' – ' + calEscHtml(ev.horaFin) + (ev.cruzaMedianoche ? ' (+1d)' : '') : ''))
        : '🕒 Todo el día';
    var durText = ev.duracionMinutos ? (' · ' + formatearDuracionLegible(ev.duracionMinutos)) : '';
    var badges = resolverBadgesVinculadosEvento(ev.personaIds, ev.grupoIds);

    var solapados = [];
    if (Array.isArray(eventosMismoDia) && typeof ev._startMin === 'number' && typeof ev._endMinRaw === 'number') {
        eventosMismoDia.forEach(function(otro) {
            if (String(otro.id) !== String(ev.id) && typeof otro._startMin === 'number' && typeof otro._endMinRaw === 'number') {
                if (intervalosSolapan(ev._startMin, ev._endMinRaw, otro._startMin, otro._endMinRaw)) {
                    solapados.push(otro.titulo);
                }
            }
        });
    }

    return '<div class="calendar-event-card cal-type-event ' + (ev.completado ? 'is-completed' : '') + '" style="border-left: 3px solid ' + col + ';">' +
        '<div style="display:flex; align-items:flex-start; gap:12px; flex:1; min-width:0;">' +
            '<input type="checkbox" ' + (ev.completado ? 'checked' : '') + ' style="margin-top:4px; cursor:pointer; width:17px; height:17px; accent-color:#38bdf8;" onchange="toggleCompletarEventoCalendario(\'' + calEscHtml(ev.id) + '\')" title="Marcar evento realizado">' +
            '<div style="flex:1; min-width:0;">' +
                '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:4px;">' +
                    '<span class="cal-pill-badge" style="background:' + col + '26; color:#e0f2fe;">📆 Evento</span>' +
                    (labMetaE ? '<span class="cal-pill-badge" style="background:' + labMetaE.color + '22; color:#e2e8f0; border:1px solid ' + labMetaE.color + '44;">' + labMetaE.icono + ' ' + calEscHtml(labMetaE.nombre) + '</span>' : '') +
                    '<span style="font-size:12px; font-weight:700; color:#e2e8f0;">' + horarioTexto + calEscHtml(durText) + '</span>' +
                    (ev.avisoPrevioMin > 0 ? '<span class="cal-pill-badge" style="background:rgba(255,255,255,0.06); color:#cbd5e1;">🔔 ' + ev.avisoPrevioMin + 'm antes</span>' : '') +
                    (solapados.length > 0 ? '<span class="cal-pill-badge" style="background:rgba(239,68,68,0.22); color:#fca5a5;">⚠️ Solapa con: ' + calEscHtml(solapados[0]) + '</span>' : '') +
                '</div>' +
                '<div class="calendar-event-title-text" style="font-size:14.5px; font-weight:700; color:#f8fafc;">' + calEscHtml(ev.titulo) + '</div>' +
                renderizarHtmlBadgesPersonas(badges) +
                (ev.descripcion ? '<p style="margin:5px 0 0 0; font-size:12px; color:#94a3b8; line-height:1.4;">' + calEscHtml(ev.descripcion) + '</p>' : '') +
            '</div>' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">' +
            '<button type="button" class="cal-icon-btn" onclick="abrirModalNuevoEvento(\'' + calEscHtml(ev.fecha) + '\', \'evento\', \'' + calEscHtml(ev.id) + '\')" title="Editar">✏️</button>' +
            '<button type="button" class="cal-icon-btn danger" onclick="eliminarEventoCalendario(\'' + calEscHtml(ev.id) + '\')" title="Eliminar">🗑️</button>' +
        '</div>' +
    '</div>';
}

// ==========================================================================
// VISTA 2: CUADRÍCULA SEMANAL POR HORAS (CRONOGRAMA BASE + PRIORIDAD DE EVENTOS)
// ==========================================================================

function renderizarVistaSemanaCalendario(claveFechaSel, hoyClave) {
    var lunesClave = obtenerLunesDeFecha(claveFechaSel);
    var domingoClave = sumarDiasAFechaStr(lunesClave, 6);
    var lunesObj = parsearClaveFechaLocal(lunesClave);
    var domObj = parsearClaveFechaLocal(domingoClave);
    var rangoTexto = (lunesObj ? lunesObj.getDate() + ' ' + MESES_NOMBRES[lunesObj.getMonth()].slice(0, 3) : lunesClave) +
        ' – ' +
        (domObj ? domObj.getDate() + ' ' + MESES_NOMBRES[domObj.getMonth()].slice(0, 3) + ' ' + domObj.getFullYear() : domingoClave);

    var capa = CALENDARIO_ESTADO.filtroCapa || 'todas';
    var mostrarPersonal = capaCalendarioVisible('personal');
    var mostrarLabores = capaCalendarioVisible('labores');
    var mostrarQuests = capaCalendarioVisible('quests');
    var boomMesCache = {};

    var HOUR_HEIGHT = 56; // px por hora -> 24 * 56 = 1344px total

    var html = '<div class="card cal-weekly-card">' +
        '<div class="calendar-top-bar">' +
            '<div class="calendar-nav-controls">' +
                '<button type="button" class="calendar-nav-btn" onclick="cambiarSemanaCalendario(-1)" title="Semana anterior">&#10094;</button>' +
                '<div class="calendar-title-display" style="min-width:210px;">Semana: ' + calEscHtml(rangoTexto) + '</div>' +
                '<button type="button" class="calendar-nav-btn" onclick="cambiarSemanaCalendario(1)" title="Semana siguiente">&#10095;</button>' +
                '<button type="button" class="calendar-btn-today" onclick="irAHoyCalendario()" style="margin-left: 6px;">Hoy</button>' +
            '</div>' +
            '<div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">' +
                '<span class="cal-pill-badge" style="background:rgba(56,189,248,0.16); color:#7dd3fc;">📆 Evento (Prioridad)</span>' +
                '<span class="cal-pill-badge" style="background:rgba(99,102,241,0.18); color:#c7d2fe;">💼 Turno / Rutina</span>' +
                '<span class="cal-pill-badge" style="background:rgba(45,212,191,0.16); color:#5eead4;">⚔️ Quests</span>' +
                '<button type="button" class="btn-sync-action btn-sync-light" onclick="abrirModalNuevoEvento(null, \'cronograma\')" style="font-size:12px;">+ Bloque Rutina</button>' +
            '</div>' +
        '</div>' +

        '<div class="cal-weekly-outer">' +
            '<div class="cal-weekly-header-row">' +
                '<div class="cal-weekly-corner">Hora</div>';

    var diasSemanaFechas = [];
    var weekDataByDay = [];
    for (var i = 0; i < 7; i++) {
        var fStr = sumarDiasAFechaStr(lunesClave, i);
        diasSemanaFechas.push(fStr);
        var fDate = parsearClaveFechaLocal(fStr);
        var esHoy = (fStr === hoyClave);
        var dests = mostrarPersonal ? obtenerDestacadosParaFecha(fStr) : [];
        var destBanner = dests.map(function(dt) {
            return '<div class="cal-week-dest-chip" style="border-color:' + (dt.color || '#f59e0b') + '; background:' + (dt.color || '#f59e0b') + '26;" onclick="irAFechaEnCalendario(\'' + fStr + '\', \'mes\')" title="' + calEscHtml(dt.titulo) + '">⭐ ' + calEscHtml(dt.titulo) + '</div>';
        }).join('');

        var boomDayData = mostrarLabores ? obtenerInfoBoomParaDiaCal(fStr, boomMesCache) : null;
        var csDayData = mostrarLabores ? obtenerCortesYSesionesDiaCal(fStr) : { cortes: [], sesiones: [], registrosExtra: [] };
        weekDataByDay.push({ boom: boomDayData, cs: csDayData });

        var laborChip = '';
        if (mostrarLabores) {
            var chips = [];
            if (boomDayData && boomDayData.diaInfo) {
                var bdi = boomDayData.diaInfo;
                if (bdi.tipo === 'sabado_libre') chips.push('🏖️ Sáb Libre');
                else if (bdi.tipo !== 'domingo_libre') chips.push(bdi.cumplido ? '✓ Boom 8h' : '💼 Boom 8h');
            }
            if (csDayData.cortes.length > 0) chips.push('💈 ×' + csDayData.cortes.length);
            if (csDayData.sesiones.length > 0) chips.push('🏋️ ×' + csDayData.sesiones.length);
            if (chips.length > 0) {
                laborChip = '<div class="cal-week-dest-chip" style="border-color:#6366f1; background:rgba(99,102,241,0.18); color:#c7d2fe;" onclick="irAFechaEnCalendario(\'' + fStr + '\', \'mes\', \'labores\')" title="Ver labores de este día">' + calEscHtml(chips.join(' · ')) + '</div>';
            }
        }

        html += '<div class="cal-weekly-day-head ' + (esHoy ? 'is-today' : '') + '">' +
            '<div class="cal-weekly-day-label" onclick="irAFechaEnCalendario(\'' + fStr + '\', \'mes\')" title="Ver detalle del día">' +
                '<span>' + DIAS_SEMANA_CORTOS[i] + '</span> ' +
                '<strong class="cal-weekly-day-num">' + (fDate ? fDate.getDate() : '') + '</strong>' +
            '</div>' +
            destBanner +
            laborChip +
        '</div>';
    }

    html += '</div>' +
        '<div id="cal-weekly-scroll-area" class="cal-weekly-scroll">' +
            '<div class="cal-weekly-body" style="height:' + (24 * HOUR_HEIGHT) + 'px;">' +
                '<div class="cal-weekly-hours-col">';

    for (var h = 0; h < 24; h++) {
        var hLbl = (h < 10 ? '0' : '') + h + ':00';
        html += '<div class="cal-weekly-hour-label" style="height:' + HOUR_HEIGHT + 'px;">' + hLbl + '</div>';
    }
    html += '</div>';

    // Columnas Lun-Dom con bloques horarios absolutos
    diasSemanaFechas.forEach(function(fStr, diaIdx) {
        var esHoyCol = (fStr === hoyClave);
        var rawEv = obtenerEventosParaFecha(fStr);
        var rawRec = obtenerRecordatoriosParaFecha(fStr);
        var eventosDia = (capa === 'labores')
            ? rawEv.filter(function(e) { return !!e.laborId; })
            : (mostrarPersonal ? rawEv : []);
        var recordatoriosDia = (capa === 'labores')
            ? rawRec.filter(function(r) { return !!r.laborId; })
            : (mostrarPersonal ? rawRec : []);
        var rutinasDia = mostrarPersonal ? obtenerCronogramaParaDiaSemana(diaIdx) : [];
        var questsDia = mostrarQuests ? obtenerQuestsProgramadasParaFecha(fStr, hoyClave) : [];
        var boomDiaInfo = weekDataByDay[diaIdx] && weekDataByDay[diaIdx].boom ? weekDataByDay[diaIdx].boom.diaInfo : null;

        html += '<div class="cal-weekly-day-col ' + (esHoyCol ? 'is-today' : '') + '" style="height:' + (24 * HOUR_HEIGHT) + 'px;">';

        // Líneas horarias interactivas (tocar una hora vacía abre modal para ese día y hora)
        for (var hr = 0; hr < 24; hr++) {
            var hrStr = (hr < 10 ? '0' : '') + hr + ':00';
            html += '<div class="cal-weekly-slot-line" style="top:' + (hr * HOUR_HEIGHT) + 'px; height:' + HOUR_HEIGHT + 'px;" onclick="abrirModalNuevoEvento(\'' + fStr + '\', \'evento\', null, \'' + hrStr + '\')" title="Tocar para programar a las ' + hrStr + '"></div>';
        }

        // 0. Bloque de turno laboral Boom Solutions (08:00 - 16:30 = 480..990 min)
        var tieneTurnoBoom = !!(mostrarLabores && boomDiaInfo && (boomDiaInfo.tipo === 'laborable' || boomDiaInfo.tipo === 'sabado_trabajo'));
        if (tieneTurnoBoom) {
            var bStart = 480;
            var bEnd = 990;
            var bTopPx = (bStart / 60) * HOUR_HEIGHT;
            var bHeightPx = ((bEnd - bStart) / 60) * HOUR_HEIGHT - 2;
            var evSobreBoom = eventosDia.some(function(ev) {
                return typeof ev._startMin === 'number' && typeof ev._endMinRaw === 'number' && intervalosSolapan(bStart, bEnd, ev._startMin, ev._endMinRaw);
            });
            var colBoom = boomDiaInfo.cumplido ? '#10b981' : (boomDiaInfo.tipo === 'sabado_trabajo' ? '#f59e0b' : '#6366f1');
            html += '<div class="cal-week-block is-labor ' + (evSobreBoom ? 'is-overridden' : '') + '" ' +
                'style="top:' + bTopPx + 'px; height:' + bHeightPx + 'px; border-left: 3px solid ' + colBoom + '; background:' + colBoom + '1c;" ' +
                'onclick="event.stopPropagation(); irAFechaEnCalendario(\'' + fStr + '\', \'mes\', \'labores\')" ' +
                'title="Boom Solutions 08:00–16:30 (' + (boomDiaInfo.cumplido ? 'Cumplida' : 'Pendiente') + ') · Toca para marcar o ver detalle">' +
                '<div class="cal-week-block-time">08:00–16:30</div>' +
                '<div class="cal-week-block-title">🚀 Boom Solutions ' + (boomDiaInfo.cumplido ? '(✓ 8h)' : '(8.0h)') + '</div>' +
            '</div>';
        }

        // 1. Pintar bloques del Cronograma Semanal Base
        rutinasDia.forEach(function(b) {
            var rStart = parseHoraAMinutos(b.horaInicio);
            var rEnd = parseHoraAMinutos(b.horaFin);
            if (rStart === null || rEnd === null || rEnd <= rStart) return;

            var topPx = (rStart / 60) * HOUR_HEIGHT;
            var heightPx = Math.max(22, ((rEnd - rStart) / 60) * HOUR_HEIGHT - 2);
            var col = b.color || '#6366f1';

            // Detectar si un evento concreto de ESTA fecha solapa con esta rutina
            var eventoPrioritario = eventosDia.find(function(ev) {
                return typeof ev._startMin === 'number' && typeof ev._endMinRaw === 'number' && intervalosSolapan(rStart, rEnd, ev._startMin, ev._endMinRaw);
            });

            html += '<div class="cal-week-block is-routine ' + (eventoPrioritario ? 'is-overridden' : '') + '" ' +
                'style="top:' + topPx + 'px; height:' + heightPx + 'px; border-left: 3px solid ' + col + '; background:' + col + (eventoPrioritario ? '18' : '30') + ';" ' +
                'onclick="event.stopPropagation(); abrirModalNuevoEvento(null, \'cronograma\', \'' + calEscHtml(b.id) + '\')" ' +
                'title="' + calEscHtml(b.titulo) + ' (' + calEscHtml(b.horaInicio) + '–' + calEscHtml(b.horaFin) + ')' + (eventoPrioritario ? ' · Desplazada este día por evento' : '') + '">' +
                '<div class="cal-week-block-time">' + calEscHtml(b.horaInicio) + '–' + calEscHtml(b.horaFin) + (eventoPrioritario ? ' · <span style="color:#fbbf24;">Desplazada</span>' : '') + '</div>' +
                '<div class="cal-week-block-title">' + calEscHtml(b.titulo) + '</div>' +
            '</div>';
        });

        // 2. Pintar Eventos con PRIORIDAD VISUAL en primer plano (y desplazamiento lateral si solapa con rutina/turno/evento)
        eventosDia.forEach(function(ev, idxEv) {
            if (typeof ev._startMin !== 'number' || typeof ev._endMinRaw !== 'number') return;
            var clampedEnd = Math.min(1440, ev._endMinRaw);
            var durVisible = Math.max(25, clampedEnd - ev._startMin);
            var topPx = (ev._startMin / 60) * HOUR_HEIGHT;
            var heightPx = Math.max(26, (durVisible / 60) * HOUR_HEIGHT - 2);
            var col = ev.color || '#38bdf8';

            var tocaRutina = rutinasDia.some(function(b) {
                var rStart = parseHoraAMinutos(b.horaInicio);
                var rEnd = parseHoraAMinutos(b.horaFin);
                return rStart !== null && rEnd !== null && intervalosSolapan(ev._startMin, clampedEnd, rStart, rEnd);
            });
            var tocaBoom = tieneTurnoBoom && intervalosSolapan(ev._startMin, clampedEnd, 480, 990);
            var chocaOtroEvento = eventosDia.some(function(o, oIdx) {
                return oIdx < idxEv && typeof o._startMin === 'number' && typeof o._endMinRaw === 'number' && intervalosSolapan(ev._startMin, clampedEnd, o._startMin, o._endMinRaw);
            });

            var leftPct = chocaOtroEvento ? '14%' : ((tocaRutina || tocaBoom) ? '8%' : '3%');
            var rightPct = '3%';

            html += '<div class="cal-week-block is-event ' + (tocaRutina ? 'has-priority' : '') + ' ' + (ev.completado ? 'is-completed' : '') + '" ' +
                'style="top:' + topPx + 'px; height:' + heightPx + 'px; left:' + leftPct + '; right:' + rightPct + '; border-left: 3px solid ' + col + '; background: linear-gradient(135deg, ' + col + '44, rgba(15,23,42,0.95));" ' +
                'onclick="event.stopPropagation(); abrirModalNuevoEvento(\'' + fStr + '\', \'evento\', \'' + calEscHtml(ev.id) + '\')" ' +
                'title="Evento: ' + calEscHtml(ev.titulo) + ' (' + calEscHtml(ev.horaInicio) + '–' + calEscHtml(ev.horaFin || '') + ')">' +
                '<div class="cal-week-block-time">' +
                    '📆 ' + calEscHtml(ev.horaInicio) + (ev.horaFin ? '–' + calEscHtml(ev.horaFin) : '') +
                    (tocaRutina ? ' <span class="cal-priority-mini-tag">PRIORIDAD</span>' : '') +
                '</div>' +
                '<div class="cal-week-block-title">' + calEscHtml(ev.titulo) + '</div>' +
            '</div>';
        });

        // 3. Pintar Recordatorios como pines exactos
        recordatoriosDia.forEach(function(rec) {
            var rMin = parseHoraAMinutos(rec.hora);
            if (rMin === null) return;
            var topPx = (rMin / 60) * HOUR_HEIGHT;
            html += '<div class="cal-week-reminder-pin ' + (rec.completado ? 'is-completed' : '') + '" ' +
                'style="top:' + topPx + 'px;" ' +
                'onclick="event.stopPropagation(); abrirModalNuevoEvento(\'' + fStr + '\', \'recordatorio\', \'' + calEscHtml(rec.id) + '\')" ' +
                'title="Recordatorio ' + calEscHtml(rec.hora) + ': ' + calEscHtml(rec.titulo) + '">' +
                '🔔 ' + calEscHtml(rec.hora) + ' · ' + calEscHtml(rec.titulo) +
            '</div>';
        });

        // 4. Pintar Quests Diarios Programadas como pines exactos
        questsDia.forEach(function(q) {
            var qMin = parseHoraAMinutos(q.hora);
            if (qMin === null) return;
            var topPx = (qMin / 60) * HOUR_HEIGHT;
            html += '<div class="cal-week-quest-pin ' + (q.completado ? 'is-completed' : '') + '" ' +
                'style="top:' + topPx + 'px;" ' +
                'onclick="event.stopPropagation(); if(typeof cambiarVista===\'function\') cambiarVista(\'vista-quests-diarios\')" ' +
                'title="Quest Programada ' + calEscHtml(q.hora) + ': ' + calEscHtml(q.titulo) + '">' +
                '⚔️ ' + calEscHtml(q.hora) + ' · ' + calEscHtml(q.titulo) +
            '</div>';
        });

        html += '</div>';
    });

    html += '</div></div></div></div>';
    return html;
}

// ==========================================================================
// APARTADO 1 DEDICADO: RECORDATORIOS
// ==========================================================================

function renderizarApartadoRecordatorios() {
    var items = obtenerItemsCalendarioNormalizados().filter(function(i) { return i.tipo === 'recordatorio'; });
    items.sort(function(a, b) {
        if (Boolean(a.completado) !== Boolean(b.completado)) return a.completado ? 1 : -1;
        return (a.fecha + ' ' + (a.hora || '')).localeCompare(b.fecha + ' ' + (b.hora || ''));
    });

    var filtro = CALENDARIO_ESTADO.filtroRecordatorios || 'pendientes';
    var filtrados = items.filter(function(r) {
        if (filtro === 'pendientes') return !r.completado;
        if (filtro === 'completados') return !!r.completado;
        return true;
    });

    var html = '<div class="card">' +
        '<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px;">' +
            '<div>' +
                '<h3 style="margin:0; font-size:17px; color:#f8fafc;">🔔 Recordatorios Programados</h3>' +
                '<p style="margin:3px 0 0 0; font-size:12px; color:#94a3b8;">Disparan alerta visual y sonora al llegar su hora exacta y alimentan la campana hasta completarlos.</p>' +
            '</div>' +
            '<button type="button" class="btn-system" style="margin:0; padding:8px 14px; font-size:12.5px;" onclick="abrirModalNuevoEvento(null, \'recordatorio\')">+ Nuevo Recordatorio</button>' +
        '</div>' +
        '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">' +
            '<button type="button" class="btn-tab-ubi ' + (filtro === 'pendientes' ? 'active' : '') + '" onclick="CALENDARIO_ESTADO.filtroRecordatorios=\'pendientes\'; renderizarCalendario();">Pendientes</button>' +
            '<button type="button" class="btn-tab-ubi ' + (filtro === 'completados' ? 'active' : '') + '" onclick="CALENDARIO_ESTADO.filtroRecordatorios=\'completados\'; renderizarCalendario();">Completados</button>' +
            '<button type="button" class="btn-tab-ubi ' + (filtro === 'todos' ? 'active' : '') + '" onclick="CALENDARIO_ESTADO.filtroRecordatorios=\'todos\'; renderizarCalendario();">Todos (' + items.length + ')</button>' +
        '</div>';

    if (filtrados.length === 0) {
        html += '<div class="cal-empty-state">' +
            '<div style="font-size:32px; margin-bottom:6px;">🔔</div>' +
            '<div style="font-weight:700; color:#f8fafc;">No hay recordatorios en esta vista</div>' +
            '<p style="color:#94a3b8; font-size:12.5px;">Crea recordatorios con fecha, hora exacta y persona opcional desde Personas.</p>' +
        '</div>';
    } else {
        html += '<div class="calendar-events-container">' +
            filtrados.map(function(r) { return renderizarTarjetaRecordatorio(r, false); }).join('') +
        '</div>';
    }
    html += '</div>';
    return html;
}

// ==========================================================================
// APARTADO 2 DEDICADO: EVENTOS
// ==========================================================================

function renderizarApartadoEventos(hoyClave) {
    var items = obtenerItemsCalendarioNormalizados().filter(function(i) { return i.tipo === 'evento'; });
    items.sort(function(a, b) {
        return (a.fecha + ' ' + (a.horaInicio || '')).localeCompare(b.fecha + ' ' + (b.horaInicio || ''));
    });

    var filtro = CALENDARIO_ESTADO.filtroEventos || 'proximos';
    var filtrados = items.filter(function(ev) {
        if (filtro === 'proximos') return (ev.fecha || '') >= hoyClave;
        if (filtro === 'pasados') return (ev.fecha || '') < hoyClave;
        return true;
    });

    var porFecha = {};
    items.forEach(function(e) {
        if (!porFecha[e.fecha]) porFecha[e.fecha] = [];
        porFecha[e.fecha].push(e);
    });

    var html = '<div class="card">' +
        '<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px;">' +
            '<div>' +
                '<h3 style="margin:0; font-size:17px; color:#f8fafc;">📆 Eventos & Bloques Agendados</h3>' +
                '<p style="margin:3px 0 0 0; font-size:12px; color:#94a3b8;">Cálculo automático de hora fin por duración, aviso previo, multi-selección de Personas/Grupos y control de choques horarios.</p>' +
            '</div>' +
            '<button type="button" class="btn-system" style="margin:0; padding:8px 14px; font-size:12.5px;" onclick="abrirModalNuevoEvento(null, \'evento\')">+ Nuevo Evento</button>' +
        '</div>' +
        '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">' +
            '<button type="button" class="btn-tab-ubi ' + (filtro === 'proximos' ? 'active' : '') + '" onclick="CALENDARIO_ESTADO.filtroEventos=\'proximos\'; renderizarCalendario();">Próximos y Hoy</button>' +
            '<button type="button" class="btn-tab-ubi ' + (filtro === 'pasados' ? 'active' : '') + '" onclick="CALENDARIO_ESTADO.filtroEventos=\'pasados\'; renderizarCalendario();">Anteriores</button>' +
            '<button type="button" class="btn-tab-ubi ' + (filtro === 'todos' ? 'active' : '') + '" onclick="CALENDARIO_ESTADO.filtroEventos=\'todos\'; renderizarCalendario();">Todos (' + items.length + ')</button>' +
        '</div>';

    if (filtrados.length === 0) {
        html += '<div class="cal-empty-state">' +
            '<div style="font-size:32px; margin-bottom:6px;">📆</div>' +
            '<div style="font-weight:700; color:#f8fafc;">Sin eventos en este filtro</div>' +
            '<p style="color:#94a3b8; font-size:12.5px;">Programa reuniones, sesiones o salidas vinculando contactos y grupos desde Personas.</p>' +
        '</div>';
    } else {
        html += '<div class="calendar-events-container">' +
            filtrados.map(function(ev) {
                return '<div style="margin-bottom:2px;">' +
                    '<div style="font-size:11px; font-weight:700; color:#64748b; margin-bottom:4px; cursor:pointer;" onclick="irAFechaEnCalendario(\'' + calEscHtml(ev.fecha) + '\', \'mes\')">📅 ' + formatearFechaLegibleCorta(ev.fecha) + ' →</div>' +
                    renderizarTarjetaEvento(ev, porFecha[ev.fecha] || []) +
                '</div>';
            }).join('') +
        '</div>';
    }
    html += '</div>';
    return html;
}

// ==========================================================================
// APARTADO 3 DEDICADO: DÍAS DESTACADOS
// ==========================================================================

function renderizarApartadoDestacados() {
    var items = obtenerItemsCalendarioNormalizados().filter(function(i) { return i.tipo === 'destacado'; });
    items.sort(function(a, b) {
        return String(a.fecha || '').slice(5).localeCompare(String(b.fecha || '').slice(5));
    });

    var html = '<div class="card">' +
        '<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px;">' +
            '<div>' +
                '<h3 style="margin:0; font-size:17px; color:#f8fafc;">⭐ Días Destacados & Fechas Especiales</h3>' +
                '<p style="margin:3px 0 0 0; font-size:12px; color:#94a3b8;">Abarcan todo el día (00:00–23:59) sin bloquear horas ni generar choques. Pueden repetirse automáticamente cada año.</p>' +
            '</div>' +
            '<button type="button" class="btn-system" style="margin:0; padding:8px 14px; font-size:12.5px;" onclick="abrirModalNuevoEvento(null, \'destacado\')">+ Nuevo Día Destacado</button>' +
        '</div>';

    if (items.length === 0) {
        html += '<div class="cal-empty-state">' +
            '<div style="font-size:32px; margin-bottom:6px;">⭐</div>' +
            '<div style="font-weight:700; color:#f8fafc;">Aún no tienes Días Destacados</div>' +
            '<p style="color:#94a3b8; font-size:12.5px;">Guarda cumpleaños, aniversarios o fechas memorables y vincúlalas a tus contactos de Personas.</p>' +
        '</div>';
    } else {
        html += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">';
        items.forEach(function(dest) {
            var col = dest.color || '#f59e0b';
            var per = resolverPersonaPorId(dest.personaId, dest.personaNombre);
            html += '<div class="cal-destacado-top-banner" style="border-left:4px solid ' + col + '; background: linear-gradient(135deg, ' + col + '1e, rgba(15,23,42,0.92)); flex-direction:column; align-items:stretch;">' +
                '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">' +
                    '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
                        '<span class="cal-pill-badge" style="background:' + col + '30; color:#fde68a;">📅 ' + formatearFechaLegibleCorta(dest.fecha) + '</span>' +
                        (dest.repetirAnualmente ? '<span class="cal-pill-badge" style="background:rgba(139,92,246,0.2); color:#ddd6fe;">🔁 Anual</span>' : '<span class="cal-pill-badge" style="background:rgba(255,255,255,0.06); color:#cbd5e1;">Fecha única</span>') +
                    '</div>' +
                    '<div style="display:flex; gap:4px;">' +
                        '<button type="button" class="cal-icon-btn" onclick="abrirModalNuevoEvento(\'' + calEscHtml(dest.fecha) + '\', \'destacado\', \'' + calEscHtml(dest.id) + '\')" title="Editar">✏️</button>' +
                        '<button type="button" class="cal-icon-btn danger" onclick="eliminarEventoCalendario(\'' + calEscHtml(dest.id) + '\')" title="Eliminar">🗑️</button>' +
                    '</div>' +
                '</div>' +
                '<div style="font-size:15px; font-weight:800; color:#f8fafc; margin-top:6px;">⭐ ' + calEscHtml(dest.titulo) + '</div>' +
                (per ? '<div style="margin-top:6px;"><span class="cal-person-chip">👤 ' + calEscHtml(per.nombre) + '</span></div>' : '') +
                (dest.descripcion ? '<p style="margin:6px 0 0 0; font-size:12px; color:#cbd5e1;">' + calEscHtml(dest.descripcion) + '</p>' : '') +
                '<div style="margin-top:10px; display:flex; justify-content:flex-end;">' +
                    '<button type="button" class="btn-sheet-action" style="font-size:11px; padding:4px 10px;" onclick="irAFechaEnCalendario(\'' + calEscHtml(dest.fecha) + '\', \'mes\')">Ver en Mes →</button>' +
                '</div>' +
            '</div>';
        });
        html += '</div>';
    }
    html += '</div>';
    return html;
}

// ==========================================================================
// APARTADO 4 DEDICADO: CRONOGRAMA SEMANAL (RUTINA BASE)
// ==========================================================================

function renderizarApartadoCronograma() {
    var bloques = Array.isArray(APP_STATE.cronogramaSemanal) ? APP_STATE.cronogramaSemanal : [];
    var html = '<div class="card">' +
        '<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:16px;">' +
            '<div>' +
                '<h3 style="margin:0; font-size:17px; color:#f8fafc;">🕒 Cronograma Semanal (Rutina Base)</h3>' +
                '<p style="margin:3px 0 0 0; font-size:12px; color:#94a3b8;">Plantilla recurrente de Lunes a Domingo. Si un Evento puntual coincide en una fecha, el Evento tiene prioridad visual sin borrar tu rutina futura.</p>' +
            '</div>' +
            '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
                '<button type="button" class="btn-sync-action btn-sync-light" onclick="cambiarSeccionCalendario(\'semana\')">🗓️ Ver en Cuadrícula Horaria</button>' +
                '<button type="button" class="btn-system" style="margin:0; padding:8px 14px; font-size:12.5px;" onclick="abrirModalNuevoEvento(null, \'cronograma\')">+ Agregar Bloque Base</button>' +
            '</div>' +
        '</div>' +
        '<div class="cal-cronograma-week-grid">';

    for (var d = 0; d < 7; d++) {
        var delDia = obtenerCronogramaParaDiaSemana(d);
        html += '<div class="cal-cronograma-day-col">' +
            '<div class="cal-cronograma-day-header">' +
                '<strong>' + DIAS_SEMANA_NOMBRES[d] + '</strong>' +
                '<span style="font-size:11px; color:#94a3b8;">' + delDia.length + ' bloque(s)</span>' +
            '</div>';
        if (delDia.length === 0) {
            html += '<div class="cal-empty-mini" style="margin:6px 0;">Sin bloques asignados</div>';
        } else {
            html += '<div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">';
            delDia.forEach(function(b) {
                var col = b.color || '#6366f1';
                var avMin = obtenerMinutosAvisoPrevioCronograma(b);
                var avTag = avMin > 0 ? (' · <span style="color:#7dd3fc;">🔔 ' + avMin + 'm antes</span>') : '';
                html += '<div class="cal-cronograma-block-card" style="border-left:3px solid ' + col + ';">' +
                    '<div style="flex:1; min-width:0;">' +
                        '<div style="font-size:11px; font-weight:700; color:#94a3b8;">' + calEscHtml(b.horaInicio) + ' – ' + calEscHtml(b.horaFin) + ' · <span style="color:' + col + ';">' + calEscHtml(b.etiqueta || 'Rutina') + '</span>' + avTag + '</div>' +
                        '<div style="font-size:13px; font-weight:700; color:#f8fafc; margin-top:2px;">' + calEscHtml(b.titulo) + '</div>' +
                    '</div>' +
                    '<div style="display:flex; gap:4px;">' +
                        '<button type="button" class="cal-icon-btn" onclick="abrirModalNuevoEvento(null, \'cronograma\', \'' + calEscHtml(b.id) + '\')" title="Editar">✏️</button>' +
                        '<button type="button" class="cal-icon-btn danger" onclick="eliminarBloqueCronograma(\'' + calEscHtml(b.id) + '\')" title="Eliminar">🗑️</button>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
        }
        html += '</div>';
    }

    html += '</div></div>';
    return html;
}

// ==========================================================================
// MODAL UNIFICADO DE CREACIÓN Y EDICIÓN (4 APARTADOS + PERSONAS + GRUPOS)
// ==========================================================================

function generarHtmlOpcionesPersonasCalendario() {
    var personas = obtenerPersonasDisponibles();
    return '<option value="">— Ninguna persona vinculada —</option>' +
        personas.map(function(p) {
            var meta = p.ubicacionCategoria ? ' (' + p.ubicacionCategoria + ')' : '';
            return '<option value="' + calEscHtml(p.id) + '">' + calEscHtml(p.nombre + meta) + '</option>';
        }).join('');
}

function refrescarSelectoresPersonasCalendario() {
    var opcionesBase = generarHtmlOpcionesPersonasCalendario();

    ['cal-rec-persona', 'cal-dest-persona', 'asistente-rec-persona'].forEach(function(selectId) {
        var sel = document.getElementById(selectId);
        if (sel) {
            var valPrev = sel.value;
            sel.innerHTML = opcionesBase;
            if (valPrev) sel.value = valPrev;
        }
    });

    renderizarMultiSelectorPersonasEvento();
}

function renderizarMultiSelectorPersonasEvento() {
    var cont = document.getElementById('cal-ev-personas-multiselect');
    if (!cont) return;

    var inFiltro = document.getElementById('cal-ev-personas-buscar');
    var term = inFiltro ? inFiltro.value.trim().toLowerCase() : '';

    var grupos = obtenerGruposPersonasDisponibles();
    var personas = obtenerPersonasDisponibles();
    var selGrupos = CALENDARIO_ESTADO.grupoIdsSeleccionadosModal.map(String);
    var selPersonas = CALENDARIO_ESTADO.personaIdsSeleccionadosModal.map(String);

    var html = '';

    var gruposFiltrados = grupos.filter(function(g) {
        return !term || String(g.nombre || '').toLowerCase().indexOf(term) !== -1;
    });
    var personasFiltradas = personas.filter(function(p) {
        if (!term) return true;
        return String(p.nombre || '').toLowerCase().indexOf(term) !== -1 ||
               String(p.rol || '').toLowerCase().indexOf(term) !== -1 ||
               String(p.ubicacionCategoria || '').toLowerCase().indexOf(term) !== -1;
    });

    if (grupos.length === 0 && personas.length === 0) {
        cont.innerHTML = '<div style="font-size:12px; color:#94a3b8; padding:10px; text-align:center;">No hay contactos ni grupos en <strong>Personas</strong> todavía.</div>';
        actualizarContadorVinculadosModal();
        return;
    }

    if (gruposFiltrados.length > 0) {
        html += '<div class="cal-multiselect-group-header">Grupos de Personas (' + gruposFiltrados.length + ')</div>';
        gruposFiltrados.forEach(function(g) {
            var checked = selGrupos.indexOf(String(g.id)) !== -1 ? 'checked' : '';
            var memCount = Array.isArray(g.personaIds) ? g.personaIds.length : 0;
            html += '<label class="grupo-miembro-check-row">' +
                '<input type="checkbox" class="cal-ev-check-grupo" value="' + calEscHtml(g.id) + '" ' + checked + ' onchange="toggleSeleccionGrupoModalEvento(this.value, this.checked)">' +
                '<span style="flex:1; min-width:0;">' +
                    '<strong style="color:#f8fafc; font-size:12.5px;">' + calEscHtml(g.icono || '👥') + ' ' + calEscHtml(g.nombre) + '</strong>' +
                    ' <span style="font-size:11px; color:#a5b4fc;">(' + memCount + ' personas)</span>' +
                '</span>' +
            '</label>';
        });
    }

    if (personasFiltradas.length > 0) {
        html += '<div class="cal-multiselect-group-header">Contactos Individuales (' + personasFiltradas.length + ')</div>';
        personasFiltradas.forEach(function(p) {
            var checked = selPersonas.indexOf(String(p.id)) !== -1 ? 'checked' : '';
            html += '<label class="grupo-miembro-check-row">' +
                '<input type="checkbox" class="cal-ev-check-persona" value="' + calEscHtml(p.id) + '" ' + checked + ' onchange="toggleSeleccionPersonaModalEvento(this.value, this.checked)">' +
                '<span style="flex:1; min-width:0;">' +
                    '<strong style="color:#f8fafc; font-size:12.5px;">👤 ' + calEscHtml(p.nombre) + '</strong>' +
                    (p.rol ? ' <span style="font-size:11px; color:#94a3b8;">· ' + calEscHtml(p.rol) + '</span>' : '') +
                '</span>' +
            '</label>';
        });
    }

    if (!html) {
        html = '<div style="font-size:12px; color:#94a3b8; padding:10px; text-align:center;">Sin coincidencias para "' + calEscHtml(term) + '".</div>';
    }

    cont.innerHTML = html;
    actualizarContadorVinculadosModal();
}

function toggleSeleccionPersonaModalEvento(personaId, checked) {
    var list = CALENDARIO_ESTADO.personaIdsSeleccionadosModal.map(String);
    var key = String(personaId);
    if (checked && list.indexOf(key) === -1) list.push(key);
    if (!checked) list = list.filter(function(id) { return id !== key; });
    CALENDARIO_ESTADO.personaIdsSeleccionadosModal = list;
    actualizarContadorVinculadosModal();
}

function toggleSeleccionGrupoModalEvento(grupoId, checked) {
    var list = CALENDARIO_ESTADO.grupoIdsSeleccionadosModal.map(String);
    var key = String(grupoId);
    if (checked && list.indexOf(key) === -1) list.push(key);
    if (!checked) list = list.filter(function(id) { return id !== key; });
    CALENDARIO_ESTADO.grupoIdsSeleccionadosModal = list;
    actualizarContadorVinculadosModal();
}

function actualizarContadorVinculadosModal() {
    var lbl = document.getElementById('cal-ev-vinculados-count');
    if (!lbl) return;
    var gLen = CALENDARIO_ESTADO.grupoIdsSeleccionadosModal.length;
    var pLen = CALENDARIO_ESTADO.personaIdsSeleccionadosModal.length;
    var parts = [];
    if (gLen > 0) parts.push(gLen + (gLen === 1 ? ' grupo' : ' grupos'));
    if (pLen > 0) parts.push(pLen + (pLen === 1 ? ' persona' : ' personas'));
    lbl.textContent = parts.length > 0 ? parts.join(' + ') : '0 seleccionados';
}

function filtrarOpcionesPersonasModalEvento() {
    renderizarMultiSelectorPersonasEvento();
}

function seleccionarTipoModalCalendario(tipo) {
    CALENDARIO_ESTADO.modalTipo = tipo || 'recordatorio';
    var tipos = ['recordatorio', 'evento', 'destacado', 'cronograma'];
    tipos.forEach(function(t) {
        var btn = document.getElementById('tab-cal-modal-' + t);
        var pane = document.getElementById('cal-pane-' + t);
        if (btn) btn.classList.toggle('active', t === CALENDARIO_ESTADO.modalTipo);
        if (pane) pane.style.display = (t === CALENDARIO_ESTADO.modalTipo) ? 'block' : 'none';
    });

    var editId = document.getElementById('cal-modal-edit-id');
    var esEdicion = editId && editId.value.trim() !== '';
    var icons = { recordatorio: '🔔', evento: '📆', destacado: '⭐', cronograma: '🕒' };
    var labels = {
        recordatorio: esEdicion ? 'EDITAR RECORDATORIO' : 'NUEVO RECORDATORIO',
        evento: esEdicion ? 'EDITAR EVENTO' : 'NUEVO EVENTO',
        destacado: esEdicion ? 'EDITAR DÍA DESTACADO' : 'NUEVO DÍA DESTACADO',
        cronograma: esEdicion ? 'EDITAR RUTINA SEMANAL' : 'NUEVO BLOQUE SEMANAL'
    };
    var icoEl = document.getElementById('cal-modal-header-icon');
    var titEl = document.getElementById('cal-modal-header-title');
    if (icoEl) icoEl.textContent = icons[CALENDARIO_ESTADO.modalTipo] || '📅';
    if (titEl) titEl.textContent = labels[CALENDARIO_ESTADO.modalTipo] || 'PROGRAMAR EN CALENDARIO';

    if (CALENDARIO_ESTADO.modalTipo === 'evento') {
        recalcularFinEventoYConflictos();
    }
}

function recalcularFinEventoYConflictos() {
    var inFecha = document.getElementById('cal-ev-fecha');
    var inInicio = document.getElementById('cal-ev-inicio');
    var inDurVal = document.getElementById('cal-ev-duracion-val');
    var inDurUnit = document.getElementById('cal-ev-duracion-unit');
    var preview = document.getElementById('cal-ev-hora-fin-preview');
    var alertaBox = document.getElementById('cal-ev-conflicto-alerta');
    var inEditId = document.getElementById('cal-modal-edit-id');

    var fechaStr = inFecha ? inFecha.value : '';
    var inicioStr = inInicio ? inInicio.value : '';
    var val = inDurVal ? inDurVal.value : '';
    var unit = inDurUnit ? inDurUnit.value : 'min';

    var calc = calcularHoraFinDesdeDuracion(inicioStr, val, unit);
    if (preview) {
        if (calc) {
            preview.textContent = '⏱️ Finaliza: ' + calc.horaFin + (calc.cruzaMedianoche ? ' (+1 día)' : '');
            preview.classList.add('is-valid');
        } else {
            preview.textContent = '⏱️ Hora inválida';
            preview.classList.remove('is-valid');
        }
    }

    if (alertaBox) {
        if (!calc || !fechaStr) {
            alertaBox.style.display = 'none';
            alertaBox.innerHTML = '';
            return;
        }
        var excludeId = inEditId ? inEditId.value.trim() : '';
        var choques = detectarChoquesEvento(fechaStr, inicioStr, calc.duracionMinutos, excludeId);
        var msgs = [];
        if (choques.eventosSolapados.length > 0) {
            var nombresEv = choques.eventosSolapados.map(function(e) {
                return '"' + calEscHtml(e.titulo) + '" (' + calEscHtml(e.horaInicio) + '–' + calEscHtml(e.horaFin || '') + ')';
            }).join(', ');
            msgs.push('<div class="cal-conflict-banner is-error">⚠️ <strong>Conflicto de horario:</strong> se solapa con ' + nombresEv + '.</div>');
        }
        if (choques.rutinasDesplazadas.length > 0) {
            var nombresRut = choques.rutinasDesplazadas.map(function(r) {
                return '"' + calEscHtml(r.titulo) + '" (' + calEscHtml(r.horaInicio) + '–' + calEscHtml(r.horaFin) + ')';
            }).join(', ');
            msgs.push('<div class="cal-conflict-banner is-info">ℹ️ <strong>Prioridad sobre Cronograma Base:</strong> coincide con ' + nombresRut + '. El Evento tendrá prioridad visual ese día sin alterar tu rutina de otras semanas.</div>');
        }
        if (msgs.length > 0) {
            alertaBox.innerHTML = msgs.join('');
            alertaBox.style.display = 'block';
        } else {
            alertaBox.style.display = 'none';
            alertaBox.innerHTML = '';
        }
    }
}

function abrirModalNuevoEvento(fechaPredefinida, tipoInicial, editId, horaPredefinida, laborPredefinida) {
    var modal = document.getElementById('modal-nuevo-evento');
    if (!modal) return;

    var fechaBase = fechaPredefinida || formatearClaveFecha(CALENDARIO_ESTADO.anio, CALENDARIO_ESTADO.mes, CALENDARIO_ESTADO.diaSeleccionado);
    var horaDefault = horaPredefinida || '09:00';
    var laborDefault = laborPredefinida ? String(laborPredefinida) : '';
    var editInput = document.getElementById('cal-modal-edit-id');
    if (editInput) editInput.value = editId ? String(editId) : '';

    var tabsBar = document.getElementById('cal-modal-tabs-bar');
    if (tabsBar) tabsBar.style.display = editId ? 'none' : 'flex';

    // Reset estados iniciales
    CALENDARIO_ESTADO.personaIdsSeleccionadosModal = [];
    CALENDARIO_ESTADO.grupoIdsSeleccionadosModal = [];
    var inBuscar = document.getElementById('cal-ev-personas-buscar');
    if (inBuscar) inBuscar.value = '';

    // Limpiar campos Recordatorio
    document.getElementById('cal-rec-titulo').value = '';
    document.getElementById('cal-rec-desc').value = '';
    document.getElementById('cal-rec-fecha').value = fechaBase;
    document.getElementById('cal-rec-hora').value = horaDefault;
    var elRecLab = document.getElementById('cal-rec-labor');
    if (elRecLab) elRecLab.value = laborDefault;

    // Limpiar campos Evento
    document.getElementById('cal-ev-titulo').value = '';
    document.getElementById('cal-ev-desc').value = '';
    document.getElementById('cal-ev-fecha').value = fechaBase;
    document.getElementById('cal-ev-inicio').value = horaDefault;
    document.getElementById('cal-ev-duracion-val').value = 60;
    document.getElementById('cal-ev-duracion-unit').value = 'min';
    document.getElementById('cal-ev-aviso').value = '30';
    document.getElementById('cal-ev-color').value = '#38bdf8';
    var elEvLab = document.getElementById('cal-ev-labor');
    if (elEvLab) elEvLab.value = laborDefault;

    // Limpiar campos Destacado
    document.getElementById('cal-dest-titulo').value = '';
    document.getElementById('cal-dest-desc').value = '';
    document.getElementById('cal-dest-fecha').value = fechaBase;
    document.getElementById('cal-dest-repetir').checked = true;
    document.getElementById('cal-dest-color').value = '#f59e0b';

    // Limpiar campos Cronograma
    document.getElementById('cal-cro-titulo').value = '';
    document.getElementById('cal-cro-inicio').value = horaDefault;
    document.getElementById('cal-cro-fin').value = formatearMinutosAHora((parseHoraAMinutos(horaDefault) || 540) + 60);
    document.getElementById('cal-cro-etiqueta').value = 'Rutina';
    document.getElementById('cal-cro-color').value = '#6366f1';
    var elCroAviso = document.getElementById('cal-cro-aviso');
    if (elCroAviso) elCroAviso.value = '30';

    var diaSelSemana = obtenerIndiceDiaSemana(fechaBase);
    var selCroDia = document.getElementById('cal-cro-dia');
    var wrapCroMulti = document.getElementById('cal-cro-dias-multi-wrap');
    var checksDia = document.querySelectorAll('.check-cal-cro-dia');
    checksDia.forEach(function(ch) {
        ch.checked = (Number(ch.value) === diaSelSemana);
    });
    if (selCroDia) {
        selCroDia.value = String(diaSelSemana);
        selCroDia.style.display = editId ? 'block' : 'none';
    }
    if (wrapCroMulti) {
        wrapCroMulti.style.display = editId ? 'none' : 'flex';
    }

    var tipoDestino = tipoInicial || (CALENDARIO_ESTADO.seccionActiva === 'eventos' ? 'evento' : (CALENDARIO_ESTADO.seccionActiva === 'destacados' ? 'destacado' : (CALENDARIO_ESTADO.seccionActiva === 'cronograma' ? 'cronograma' : 'recordatorio')));

    // Precargar datos si es edición
    if (editId) {
        if (tipoInicial === 'cronograma') {
            var bloque = (APP_STATE.cronogramaSemanal || []).find(function(b) { return String(b.id) === String(editId); });
            if (bloque) {
                tipoDestino = 'cronograma';
                document.getElementById('cal-cro-titulo').value = bloque.titulo || '';
                document.getElementById('cal-cro-inicio').value = bloque.horaInicio || '09:00';
                document.getElementById('cal-cro-fin').value = bloque.horaFin || '10:00';
                document.getElementById('cal-cro-etiqueta').value = bloque.etiqueta || 'Rutina';
                document.getElementById('cal-cro-color').value = bloque.color || '#6366f1';
                if (elCroAviso) elCroAviso.value = String(obtenerMinutosAvisoPrevioCronograma(bloque));
                if (selCroDia) selCroDia.value = String(bloque.diaSemana || 0);
            }
        } else {
            var rawItem = (APP_STATE.calendario || []).find(function(c) { return String(c.id) === String(editId); });
            var item = normalizarItemCalendario(rawItem);
            if (item) {
                tipoDestino = item.tipo;
                if (item.tipo === 'recordatorio') {
                    document.getElementById('cal-rec-titulo').value = item.titulo || '';
                    document.getElementById('cal-rec-desc').value = item.descripcion || '';
                    document.getElementById('cal-rec-fecha').value = item.fecha || fechaBase;
                    document.getElementById('cal-rec-hora').value = item.hora || horaDefault;
                    if (elRecLab) elRecLab.value = item.laborId || '';
                } else if (item.tipo === 'evento') {
                    document.getElementById('cal-ev-titulo').value = item.titulo || '';
                    document.getElementById('cal-ev-desc').value = item.descripcion || '';
                    document.getElementById('cal-ev-fecha').value = item.fecha || fechaBase;
                    document.getElementById('cal-ev-inicio').value = item.horaInicio || horaDefault;
                    var durMin = item.duracionMinutos || 60;
                    if (durMin >= 60 && durMin % 60 === 0) {
                        document.getElementById('cal-ev-duracion-val').value = durMin / 60;
                        document.getElementById('cal-ev-duracion-unit').value = 'horas';
                    } else {
                        document.getElementById('cal-ev-duracion-val').value = durMin;
                        document.getElementById('cal-ev-duracion-unit').value = 'min';
                    }
                    document.getElementById('cal-ev-aviso').value = String(obtenerMinutosAvisoPrevioEvento(item));
                    document.getElementById('cal-ev-color').value = item.color || '#38bdf8';
                    if (elEvLab) elEvLab.value = item.laborId || '';
                    CALENDARIO_ESTADO.personaIdsSeleccionadosModal = (item.personaIds || []).map(String);
                    CALENDARIO_ESTADO.grupoIdsSeleccionadosModal = (item.grupoIds || []).map(String);
                } else if (item.tipo === 'destacado') {
                    document.getElementById('cal-dest-titulo').value = item.titulo || '';
                    document.getElementById('cal-dest-desc').value = item.descripcion || '';
                    document.getElementById('cal-dest-fecha').value = item.fecha || fechaBase;
                    document.getElementById('cal-dest-repetir').checked = !!item.repetirAnualmente;
                    document.getElementById('cal-dest-color').value = item.color || '#f59e0b';
                }
            }
        }
    }

    refrescarSelectoresPersonasCalendario();

    // Asignar valores seleccionados de <select> de personas después de poblar opciones
    if (editId && tipoDestino !== 'cronograma') {
        var rawIt = (APP_STATE.calendario || []).find(function(c) { return String(c.id) === String(editId); });
        if (rawIt) {
            if (tipoDestino === 'recordatorio' && rawIt.personaId) {
                document.getElementById('cal-rec-persona').value = rawIt.personaId;
            } else if (tipoDestino === 'destacado' && rawIt.personaId) {
                document.getElementById('cal-dest-persona').value = rawIt.personaId;
            }
        }
    }

    seleccionarTipoModalCalendario(tipoDestino);
    modal.style.display = 'flex';
}

function cerrarModalNuevoEvento() {
    var modal = document.getElementById('modal-nuevo-evento');
    if (modal) modal.style.display = 'none';
}

/**
 * Crea o actualiza un recordatorio de Calendario desde cualquier flujo (modal de Calendario o Captura Rápida)
 * y sincroniza BD, vista, badges y alarmas nativas.
 */
function crearGuardarRecordatorioCalendario(opts) {
    if (!opts) return null;
    if (!APP_STATE.calendario) APP_STATE.calendario = [];

    var titulo = String(opts.titulo || '').trim();
    var desc = String(opts.descripcion || '').trim();
    var fecha = String(opts.fecha || '').trim();
    var hora = String(opts.hora || '').trim();
    var personaId = String(opts.personaId || '').trim();
    var laborId = String(opts.laborId || '').trim();
    var editId = opts.editId ? String(opts.editId).trim() : '';
    var ahora = Date.now();

    if (!titulo || !fecha || !hora) return null;

    var per = resolverPersonaPorId(personaId);
    var fechaDate = parsearClaveFechaLocal(fecha);
    if (fechaDate) {
        CALENDARIO_ESTADO.anio = fechaDate.getFullYear();
        CALENDARIO_ESTADO.mes = fechaDate.getMonth();
        CALENDARIO_ESTADO.diaSeleccionado = fechaDate.getDate();
    }

    var recordatorioGuardado = null;
    if (editId) {
        var idx = APP_STATE.calendario.findIndex(function(c) { return String(c.id) === editId; });
        if (idx !== -1) {
            var ex = APP_STATE.calendario[idx];
            var cambioHorario = (ex.fecha !== fecha || ex.hora !== hora);
            recordatorioGuardado = Object.assign({}, ex, {
                tipo: 'recordatorio',
                titulo: titulo,
                descripcion: desc,
                fecha: fecha,
                hora: hora,
                personaId: personaId || '',
                personaNombre: per ? per.nombre : '',
                laborId: laborId,
                pospuestoHasta: cambioHorario ? null : (ex.pospuestoHasta || null),
                notificadoParaTs: cambioHorario ? null : (ex.notificadoParaTs || null),
                fechaActualizacion: ahora
            });
            APP_STATE.calendario[idx] = recordatorioGuardado;
        }
    } else {
        recordatorioGuardado = {
            id: 'REC-' + ahora + '-' + Math.random().toString(36).substr(2, 4),
            tipo: 'recordatorio',
            titulo: titulo,
            descripcion: desc,
            fecha: fecha,
            hora: hora,
            personaId: personaId || '',
            personaNombre: per ? per.nombre : '',
            laborId: laborId,
            completado: false,
            fechaCompletada: null,
            pospuestoHasta: null,
            notificadoParaTs: null,
            notificadoEn: null,
            timestamp: ahora,
            fechaActualizacion: ahora
        };
        APP_STATE.calendario.push(recordatorioGuardado);
    }

    if (!opts.omitirSideEffects) {
        if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
        if (typeof renderizarCalendario === 'function') renderizarCalendario();
        if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
        if (typeof programarAlarmasCalendarioNativas === 'function') programarAlarmasCalendarioNativas();
        if (typeof verificarDisparadoresCalendario === 'function') verificarDisparadoresCalendario();
    }

    return recordatorioGuardado;
}

function guardarNuevoEvento() {
    if (!APP_STATE.calendario) APP_STATE.calendario = [];
    if (!APP_STATE.cronogramaSemanal) APP_STATE.cronogramaSemanal = [];

    var tipo = CALENDARIO_ESTADO.modalTipo || 'recordatorio';
    var editId = document.getElementById('cal-modal-edit-id').value.trim();
    var ahora = Date.now();

    if (tipo === 'recordatorio') {
        var titulo = document.getElementById('cal-rec-titulo').value.trim();
        var desc = document.getElementById('cal-rec-desc').value.trim();
        var fecha = document.getElementById('cal-rec-fecha').value;
        var hora = document.getElementById('cal-rec-hora').value;
        var personaId = document.getElementById('cal-rec-persona').value;
        var recLaborEl = document.getElementById('cal-rec-labor');
        var recLaborId = recLaborEl ? recLaborEl.value : '';

        if (!titulo) { alert('Ingresa el nombre del recordatorio.'); return; }
        if (!fecha || !hora) { alert('Selecciona fecha y hora exacta para el recordatorio.'); return; }

        crearGuardarRecordatorioCalendario({
            titulo: titulo,
            descripcion: desc,
            fecha: fecha,
            hora: hora,
            personaId: personaId,
            laborId: recLaborId,
            editId: editId,
            omitirSideEffects: true
        });
    } else if (tipo === 'evento') {
        var evTitulo = document.getElementById('cal-ev-titulo').value.trim();
        var evDesc = document.getElementById('cal-ev-desc').value.trim();
        var evFecha = document.getElementById('cal-ev-fecha').value;
        var evInicio = document.getElementById('cal-ev-inicio').value;
        var evDurVal = document.getElementById('cal-ev-duracion-val').value;
        var evDurUnit = document.getElementById('cal-ev-duracion-unit').value;
        var evAviso = parseInt(document.getElementById('cal-ev-aviso').value, 10) || 0;
        var evColor = document.getElementById('cal-ev-color').value || '#38bdf8';
        var evLaborEl = document.getElementById('cal-ev-labor');
        var evLaborId = evLaborEl ? evLaborEl.value : '';

        if (!evTitulo) { alert('Ingresa el nombre del evento.'); return; }
        if (!evFecha || !evInicio) { alert('Selecciona la fecha y hora de inicio del evento.'); return; }

        var calc = calcularHoraFinDesdeDuracion(evInicio, evDurVal, evDurUnit);
        if (!calc) { alert('Ingresa una duración válida mayor a 0.'); return; }

        // Alerta de confirmación si hay choque horario con otro Evento
        var choques = detectarChoquesEvento(evFecha, evInicio, calc.duracionMinutos, editId);
        if (choques.eventosSolapados.length > 0) {
            var nombresChoque = choques.eventosSolapados.map(function(e) {
                return '• ' + e.titulo + ' (' + e.horaInicio + '–' + (e.horaFin || '') + ')';
            }).join('\n');
            if (!confirm('⚠️ Este evento se solapa en horario con otro evento programado:\n\n' + nombresChoque + '\n\n¿Deseas agendarlo de todas formas?')) {
                return;
            }
        }

        var fEvDate = parsearClaveFechaLocal(evFecha);
        if (fEvDate) {
            CALENDARIO_ESTADO.anio = fEvDate.getFullYear();
            CALENDARIO_ESTADO.mes = fEvDate.getMonth();
            CALENDARIO_ESTADO.diaSeleccionado = fEvDate.getDate();
        }

        var personaIds = CALENDARIO_ESTADO.personaIdsSeleccionadosModal.slice();
        var grupoIds = CALENDARIO_ESTADO.grupoIdsSeleccionadosModal.slice();

        if (editId) {
            var idxEv = APP_STATE.calendario.findIndex(function(c) { return String(c.id) === String(editId); });
            if (idxEv !== -1) {
                var oldEv = APP_STATE.calendario[idxEv];
                APP_STATE.calendario[idxEv] = Object.assign({}, oldEv, {
                    tipo: 'evento',
                    titulo: evTitulo,
                    descripcion: evDesc,
                    fecha: evFecha,
                    horaInicio: evInicio,
                    hora: evInicio,
                    horaFin: calc.horaFin,
                    duracionMinutos: calc.duracionMinutos,
                    cruzaMedianoche: calc.cruzaMedianoche,
                    personaIds: personaIds,
                    grupoIds: grupoIds,
                    avisoPrevioMin: evAviso,
                    avisoPersonalizado: true,
                    avisoDisparadoParaTs: (oldEv.fecha !== evFecha || oldEv.horaInicio !== evInicio || obtenerMinutosAvisoPrevioEvento(oldEv) !== evAviso) ? null : oldEv.avisoDisparadoParaTs,
                    avisoDescartado: (oldEv.fecha !== evFecha || oldEv.horaInicio !== evInicio || obtenerMinutosAvisoPrevioEvento(oldEv) !== evAviso) ? false : !!oldEv.avisoDescartado,
                    color: evColor,
                    laborId: evLaborId,
                    fechaActualizacion: ahora
                });
            }
        } else {
            APP_STATE.calendario.push({
                id: 'EVE-' + ahora + '-' + Math.random().toString(36).substr(2, 4),
                tipo: 'evento',
                titulo: evTitulo,
                descripcion: evDesc,
                fecha: evFecha,
                horaInicio: evInicio,
                hora: evInicio,
                horaFin: calc.horaFin,
                duracionMinutos: calc.duracionMinutos,
                cruzaMedianoche: calc.cruzaMedianoche,
                personaIds: personaIds,
                grupoIds: grupoIds,
                avisoPrevioMin: evAviso,
                avisoPersonalizado: true,
                avisoDisparadoParaTs: null,
                avisoDisparadoEn: null,
                avisoDescartado: false,
                color: evColor,
                laborId: evLaborId,
                completado: false,
                timestamp: ahora,
                fechaActualizacion: ahora
            });
        }
    } else if (tipo === 'destacado') {
        var dTitulo = document.getElementById('cal-dest-titulo').value.trim();
        var dDesc = document.getElementById('cal-dest-desc').value.trim();
        var dFecha = document.getElementById('cal-dest-fecha').value;
        var dPersonaId = document.getElementById('cal-dest-persona').value;
        var dRepetir = !!document.getElementById('cal-dest-repetir').checked;
        var dColor = document.getElementById('cal-dest-color').value || '#f59e0b';

        if (!dTitulo) { alert('Ingresa el nombre del Día Destacado.'); return; }
        if (!dFecha) { alert('Selecciona la fecha del Día Destacado.'); return; }

        var dPer = resolverPersonaPorId(dPersonaId);
        var fDestDate = parsearClaveFechaLocal(dFecha);
        if (fDestDate) {
            CALENDARIO_ESTADO.anio = fDestDate.getFullYear();
            CALENDARIO_ESTADO.mes = fDestDate.getMonth();
            CALENDARIO_ESTADO.diaSeleccionado = fDestDate.getDate();
        }

        if (editId) {
            var idxD = APP_STATE.calendario.findIndex(function(c) { return String(c.id) === String(editId); });
            if (idxD !== -1) {
                APP_STATE.calendario[idxD] = Object.assign({}, APP_STATE.calendario[idxD], {
                    tipo: 'destacado',
                    titulo: dTitulo,
                    descripcion: dDesc,
                    fecha: dFecha,
                    mesDia: dFecha.slice(5, 10),
                    personaId: dPersonaId || '',
                    personaNombre: dPer ? dPer.nombre : '',
                    repetirAnualmente: dRepetir,
                    color: dColor,
                    fechaActualizacion: ahora
                });
            }
        } else {
            APP_STATE.calendario.push({
                id: 'DST-' + ahora + '-' + Math.random().toString(36).substr(2, 4),
                tipo: 'destacado',
                titulo: dTitulo,
                descripcion: dDesc,
                fecha: dFecha,
                mesDia: dFecha.slice(5, 10),
                personaId: dPersonaId || '',
                personaNombre: dPer ? dPer.nombre : '',
                repetirAnualmente: dRepetir,
                color: dColor,
                timestamp: ahora,
                fechaActualizacion: ahora
            });
        }
    } else if (tipo === 'cronograma') {
        var cTitulo = document.getElementById('cal-cro-titulo').value.trim();
        var cInicio = document.getElementById('cal-cro-inicio').value;
        var cFin = document.getElementById('cal-cro-fin').value;
        var cEtiqueta = document.getElementById('cal-cro-etiqueta').value || 'Rutina';
        var cColor = document.getElementById('cal-cro-color').value || '#6366f1';
        var cAvisoEl = document.getElementById('cal-cro-aviso');
        var cAvisoRaw = cAvisoEl ? parseInt(cAvisoEl.value, 10) : CAL_AVISO_PREVIO_DEFAULT_MIN;
        var cAviso = isNaN(cAvisoRaw) ? CAL_AVISO_PREVIO_DEFAULT_MIN : cAvisoRaw;

        if (!cTitulo) { alert('Ingresa el nombre de la actividad del cronograma.'); return; }
        var mIni = parseHoraAMinutos(cInicio);
        var mFin = parseHoraAMinutos(cFin);
        if (mIni === null || mFin === null || mFin <= mIni) {
            alert('Verifica el horario: la hora de finalización debe ser posterior a la hora de inicio.');
            return;
        }

        if (editId) {
            var diaUnico = parseInt(document.getElementById('cal-cro-dia').value, 10);
            var idxC = APP_STATE.cronogramaSemanal.findIndex(function(b) { return String(b.id) === String(editId); });
            if (idxC !== -1) {
                var oldCro = APP_STATE.cronogramaSemanal[idxC];
                var cambioHoraCro = (oldCro.horaInicio !== cInicio || Number(oldCro.diaSemana) !== (isNaN(diaUnico) ? 0 : diaUnico) || obtenerMinutosAvisoPrevioCronograma(oldCro) !== cAviso);
                APP_STATE.cronogramaSemanal[idxC] = Object.assign({}, oldCro, {
                    diaSemana: isNaN(diaUnico) ? 0 : diaUnico,
                    horaInicio: cInicio,
                    horaFin: cFin,
                    titulo: cTitulo,
                    etiqueta: cEtiqueta,
                    color: cColor,
                    avisoPrevioMin: cAviso,
                    avisoDisparadoFecha: cambioHoraCro ? null : (oldCro.avisoDisparadoFecha || null),
                    avisoOkeyFecha: cambioHoraCro ? null : (oldCro.avisoOkeyFecha || null),
                    fechaActualizacion: ahora
                });
            }
        } else {
            var diasSel = [];
            document.querySelectorAll('.check-cal-cro-dia:checked').forEach(function(ch) {
                var val = parseInt(ch.value, 10);
                if (!isNaN(val)) diasSel.push(val);
            });
            if (diasSel.length === 0) {
                alert('Selecciona al menos un día de la semana para el cronograma.');
                return;
            }
            diasSel.forEach(function(dNum, seq) {
                APP_STATE.cronogramaSemanal.push({
                    id: 'CRO-' + ahora + '-' + dNum + '-' + seq + '-' + Math.random().toString(36).substr(2, 3),
                    diaSemana: dNum,
                    horaInicio: cInicio,
                    horaFin: cFin,
                    titulo: cTitulo,
                    etiqueta: cEtiqueta,
                    color: cColor,
                    avisoPrevioMin: cAviso,
                    avisoDisparadoFecha: null,
                    avisoOkeyFecha: null,
                    timestamp: ahora,
                    fechaActualizacion: ahora
                });
            });
        }
    }

    if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
    cerrarModalNuevoEvento();
    renderizarCalendario();
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof programarAlarmasCalendarioNativas === 'function') programarAlarmasCalendarioNativas();
    verificarDisparadoresCalendario();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca(editId ? 'Calendario actualizado' : 'Guardado en Calendario', '📅');
    }
}

// ==========================================================================
// ACCIONES SOBRE ELEMENTOS DEL CALENDARIO
// ==========================================================================

function toggleCompletarEventoCalendario(id) {
    if (!APP_STATE.calendario) return;
    var item = APP_STATE.calendario.find(function(c) { return String(c.id) === String(id); });
    if (!item) return;

    item.completado = !item.completado;
    item.fechaCompletada = item.completado ? Date.now() : null;
    item.fechaActualizacion = Date.now();
    if (item.completado && typeof sumarExp === 'function') {
        sumarExp(15);
    }
    if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);

    if (CALENDARIO_ESTADO.alertaActivaId && String(CALENDARIO_ESTADO.alertaActivaId) === String(id)) {
        cerrarPopupRecordatorioActual(true);
    }

    if (item.completado && typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
        window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-rec-' + id);
        window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-ev-' + id);
    }

    renderizarCalendario();
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof programarAlarmasCalendarioNativas === 'function') programarAlarmasCalendarioNativas();
    var modalNotif = document.getElementById('modal-centro-notificaciones');
    if (modalNotif && modalNotif.style.display === 'flex' && typeof renderizarCentroNotificaciones === 'function') {
        renderizarCentroNotificaciones();
    }
}

function eliminarEventoCalendario(id) {
    if (!confirm('¿Deseas eliminar este elemento del calendario?')) return;
    if (!APP_STATE.calendario) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('calendario', id);
    }
    APP_STATE.calendario = APP_STATE.calendario.filter(function(item) {
        return String(item.id) !== String(id);
    });
    if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
        window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-rec-' + id);
        window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-ev-' + id);
    }
    if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
    renderizarCalendario();
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof programarAlarmasCalendarioNativas === 'function') programarAlarmasCalendarioNativas();
}

function eliminarBloqueCronograma(id) {
    if (!confirm('¿Eliminar este bloque de tu cronograma semanal base?')) return;
    if (!APP_STATE.cronogramaSemanal) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('cronogramaSemanal', id);
    }
    APP_STATE.cronogramaSemanal = APP_STATE.cronogramaSemanal.filter(function(b) {
        return String(b.id) !== String(id);
    });
    if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
        var hoyCl = _obtenerClaveHoyCalendario();
        var mananaCl = sumarDiasAFechaStr(hoyCl, 1);
        window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-cro-' + id + '-' + hoyCl);
        window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-cro-' + id + '-' + mananaCl);
    }
    if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
    renderizarCalendario();
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof programarAlarmasCalendarioNativas === 'function') programarAlarmasCalendarioNativas();
}

// ==========================================================================
// MOTOR EN VIVO DE RECORDATORIOS Y AVISOS DE EVENTOS + NOTIFICACIONES
// ==========================================================================

function iniciarMotorRecordatoriosCalendario() {
    if (CALENDARIO_ESTADO.motorInterval) {
        clearInterval(CALENDARIO_ESTADO.motorInterval);
    }
    verificarDisparadoresCalendario();
    CALENDARIO_ESTADO.motorInterval = setInterval(function() {
        verificarDisparadoresCalendario();
    }, 5000);
}

function _obtenerOcurrenciasHorarioParaFecha(fechaStr) {
    if (!window.APP_STATE || !fechaStr) return [];
    var diaIdx = obtenerIndiceDiaSemana(fechaStr);
    var eventosDia = obtenerEventosParaFecha(fechaStr).filter(function(ev) { return !ev.completado; });
    var bloques = obtenerCronogramaParaDiaSemana(diaIdx);
    var lista = [];
    var tieneBloqueBoom08 = false;

    bloques.forEach(function(b) {
        if (!b || !b.horaInicio || !b.horaFin) return;
        var rStart = parseHoraAMinutos(b.horaInicio);
        var rEnd = parseHoraAMinutos(b.horaFin);
        if (rStart === null || rEnd === null || rEnd <= rStart) return;
        if (/boom/i.test(String(b.titulo || '')) && rStart >= 450 && rStart <= 510) {
            tieneBloqueBoom08 = true;
        }
        var desplazado = eventosDia.some(function(ev) {
            return typeof ev._startMin === 'number' && typeof ev._endMinRaw === 'number' && intervalosSolapan(rStart, rEnd, ev._startMin, ev._endMinRaw);
        });
        if (desplazado) return;

        var avisoMin = obtenerMinutosAvisoPrevioCronograma(b);
        var startMs = obtenerFechaHoraMs(fechaStr, b.horaInicio);
        var endMs = obtenerFechaHoraMs(fechaStr, b.horaFin);
        var alertMs = avisoMin > 0 ? (startMs - (avisoMin * 60000)) : NaN;
        lista.push({
            esBoom: false,
            bloqueRef: b,
            id: String(b.id),
            fecha: fechaStr,
            diaIdx: diaIdx,
            titulo: b.titulo || 'Actividad de horario',
            etiqueta: b.etiqueta || 'Horario',
            horaInicio: b.horaInicio,
            horaFin: b.horaFin,
            color: b.color || '#6366f1',
            avisoMin: avisoMin,
            startMs: startMs,
            endMs: endMs,
            alertMs: alertMs,
            yaOkey: String(b.avisoOkeyFecha || '') === fechaStr,
            yaDisparado: String(b.avisoDisparadoFecha || '') === fechaStr
        });
    });

    // Turno laboral Boom Solutions (08:00-16:30) si corresponde ese día y no hay ya un bloque Boom en Cronograma
    if (!tieneBloqueBoom08) {
        var boomData = obtenerInfoBoomParaDiaCal(fechaStr);
        var bdi = boomData && boomData.diaInfo ? boomData.diaInfo : null;
        if (bdi && (bdi.tipo === 'laborable' || bdi.tipo === 'sabado_trabajo') && !bdi.cumplido) {
            var evCubreInicioBoom = eventosDia.some(function(ev) {
                return typeof ev._startMin === 'number' && typeof ev._endMinRaw === 'number' && ev._startMin <= 480 && ev._endMinRaw > 480;
            });
            if (!evCubreInicioBoom) {
                var regDia = (APP_STATE.registroDiarioCalendario && APP_STATE.registroDiarioCalendario[fechaStr])
                    ? APP_STATE.registroDiarioCalendario[fechaStr]
                    : null;
                var boomStartMs = obtenerFechaHoraMs(fechaStr, '08:00');
                var boomEndMs = obtenerFechaHoraMs(fechaStr, '16:30');
                var boomAvisoMin = CAL_AVISO_PREVIO_DEFAULT_MIN;
                lista.push({
                    esBoom: true,
                    bloqueRef: null,
                    id: 'BOOM',
                    fecha: fechaStr,
                    diaIdx: diaIdx,
                    titulo: 'Turno Boom Solutions',
                    etiqueta: 'Trabajo',
                    horaInicio: '08:00',
                    horaFin: '16:30',
                    color: '#6366f1',
                    avisoMin: boomAvisoMin,
                    startMs: boomStartMs,
                    endMs: boomEndMs,
                    alertMs: boomStartMs - (boomAvisoMin * 60000),
                    yaOkey: Boolean(regDia && regDia.boomAvisoOkey),
                    yaDisparado: Boolean(regDia && regDia.boomAvisoDisparado)
                });
            }
        }
    }

    return lista;
}

function verificarDisparadoresCalendario() {
    if (!window.APP_STATE) return;
    if (!Array.isArray(APP_STATE.calendario)) APP_STATE.calendario = [];
    var ahora = Date.now();
    var huboCambios = false;
    var nuevosRecordatoriosDisparados = [];

    APP_STATE.calendario.forEach(function(item) {
        if (!item) return;

        // 1. Disparo exacto de Recordatorios
        if (item.tipo === 'recordatorio' && !item.completado && item.fecha && item.hora) {
            var targetMs = obtenerFechaHoraMs(item.fecha, item.hora);
            if (!isNaN(targetMs)) {
                var dueMs = (item.pospuestoHasta && item.pospuestoHasta > targetMs) ? item.pospuestoHasta : targetMs;
                var yaOkey = item.avisoOkeyDueMs && Number(item.avisoOkeyDueMs) >= dueMs;
                if (ahora >= dueMs && !yaOkey && (!item.notificadoParaTs || item.notificadoParaTs < dueMs)) {
                    item.notificadoParaTs = dueMs;
                    item.notificadoEn = ahora;
                    item.fechaActualizacion = ahora;
                    huboCambios = true;
                    nuevosRecordatoriosDisparados.push(item);
                }
            }
        }

        // 2. Aviso previo de Eventos (predeterminado 30 min antes)
        var avisoEvMin = (item.tipo === 'evento') ? obtenerMinutosAvisoPrevioEvento(item) : 0;
        if (item.tipo === 'evento' && !item.completado && !item.avisoDescartado && avisoEvMin > 0 && item.fecha && (item.horaInicio || item.hora)) {
            var hIni = item.horaInicio || item.hora;
            var startMs = obtenerFechaHoraMs(item.fecha, hIni);
            var durMs = (parseInt(item.duracionMinutos, 10) || 60) * 60000;
            var endMs = startMs + durMs;
            var alertMs = startMs - (avisoEvMin * 60000);
            if (!isNaN(startMs) && ahora >= alertMs && ahora <= endMs && (!item.avisoDisparadoParaTs || item.avisoDisparadoParaTs < alertMs)) {
                item.avisoDisparadoParaTs = alertMs;
                item.avisoDisparadoEn = ahora;
                item.fechaActualizacion = ahora;
                huboCambios = true;
                reproducirSonidoCalendario('tono_zen');
                if (typeof mostrarToastMonarca === 'function') {
                    var infoEv = formatearAvisoAnticipadoEvento(startMs, ahora, false);
                    mostrarToastMonarca(infoEv.prefijoTitulo + ' ' + item.titulo + ' (' + hIni + ')', '📆');
                }
            }
        }
    });

    // 3. Aviso previo de Bloques del Horario Semanal y Turno Boom (media hora antes por defecto)
    var hoyClave = _obtenerClaveHoyCalendario();
    var mananaClave = sumarDiasAFechaStr(hoyClave, 1);
    [hoyClave, mananaClave].forEach(function(fStr) {
        _obtenerOcurrenciasHorarioParaFecha(fStr).forEach(function(oc) {
            if (!oc || oc.yaOkey || oc.yaDisparado || oc.avisoMin <= 0) return;
            if (isNaN(oc.startMs) || isNaN(oc.alertMs)) return;
            if (ahora >= oc.alertMs && ahora <= oc.endMs) {
                if (oc.esBoom) {
                    if (!APP_STATE.registroDiarioCalendario) APP_STATE.registroDiarioCalendario = {};
                    if (!APP_STATE.registroDiarioCalendario[fStr]) APP_STATE.registroDiarioCalendario[fStr] = {};
                    APP_STATE.registroDiarioCalendario[fStr].boomAvisoDisparado = true;
                } else if (oc.bloqueRef) {
                    oc.bloqueRef.avisoDisparadoFecha = fStr;
                    oc.bloqueRef.fechaActualizacion = ahora;
                }
                huboCambios = true;
                reproducirSonidoCalendario('tono_zen');
                if (typeof mostrarToastMonarca === 'function') {
                    var infoHor = formatearAvisoAnticipadoEvento(oc.startMs, ahora, true);
                    mostrarToastMonarca(infoHor.prefijoTitulo + ' ' + oc.titulo + ' (' + oc.horaInicio + ')', oc.esBoom ? '🚀' : '🗓️');
                }
            }
        });
    });

    if (huboCambios) {
        if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
        if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
        var modalNotif = document.getElementById('modal-centro-notificaciones');
        if (modalNotif && modalNotif.style.display === 'flex' && typeof renderizarCentroNotificaciones === 'function') {
            renderizarCentroNotificaciones();
        }
        if (window.VISTA_ACTUAL === 'vista-calendario') {
            renderizarCalendario();
        }
    }

    if (nuevosRecordatoriosDisparados.length > 0) {
        nuevosRecordatoriosDisparados.forEach(function(rec) {
            if (CALENDARIO_ESTADO.alertaCola.indexOf(String(rec.id)) === -1 && String(CALENDARIO_ESTADO.alertaActivaId) !== String(rec.id)) {
                CALENDARIO_ESTADO.alertaCola.push(String(rec.id));
            }
        });
        mostrarSiguientePopupRecordatorio();
    }

    if (typeof window.verificarCicloSuenoEnVivo === 'function') {
        try { window.verificarCicloSuenoEnVivo(); } catch (eSuenoCal) {}
    }
}

function reproducirSonidoCalendario(tipo) {
    try {
        if (typeof reproducirGolpeAlarmaSintetizada === 'function') {
            reproducirGolpeAlarmaSintetizada(tipo || 'tono_digital');
            setTimeout(function() {
                try { reproducirGolpeAlarmaSintetizada(tipo || 'tono_digital'); } catch(e) {}
            }, 420);
        }
    } catch(e) {}
}

function mostrarSiguientePopupRecordatorio() {
    var toast = document.getElementById('cal-floating-reminder-toast');
    if (!toast) return;
    if (toast.style.display === 'flex' && CALENDARIO_ESTADO.alertaActivaId) {
        var badgeCola = document.getElementById('cal-alerta-cola-badge');
        if (badgeCola && CALENDARIO_ESTADO.alertaCola.length > 0) {
            badgeCola.textContent = '+' + CALENDARIO_ESTADO.alertaCola.length + ' más';
            badgeCola.style.display = 'inline-block';
        }
        return;
    }

    while (CALENDARIO_ESTADO.alertaCola.length > 0) {
        var nextId = CALENDARIO_ESTADO.alertaCola.shift();
        var rec = (APP_STATE.calendario || []).find(function(c) {
            return String(c.id) === String(nextId) && c.tipo === 'recordatorio' && !c.completado;
        });
        if (!rec) continue;

        CALENDARIO_ESTADO.alertaActivaId = rec.id;
        var horaEl = document.getElementById('cal-alerta-hora-badge');
        var titEl = document.getElementById('cal-alerta-titulo');
        var perEl = document.getElementById('cal-alerta-persona');
        var descEl = document.getElementById('cal-alerta-desc');
        var colaEl = document.getElementById('cal-alerta-cola-badge');

        if (horaEl) horaEl.textContent = '🕒 ' + (rec.hora || '--:--') + ' · ' + formatearFechaLegibleCorta(rec.fecha);
        if (titEl) titEl.textContent = rec.titulo || 'Recordatorio';
        var per = resolverPersonaPorId(rec.personaId, rec.personaNombre);
        if (perEl) {
            if (per) {
                perEl.textContent = '👤 Persona vinculada: ' + per.nombre;
                perEl.style.display = 'block';
            } else {
                perEl.style.display = 'none';
            }
        }
        if (descEl) {
            if (rec.descripcion && rec.descripcion.trim()) {
                descEl.textContent = rec.descripcion.trim();
                descEl.style.display = 'block';
            } else {
                descEl.textContent = '';
                descEl.style.display = 'none';
            }
        }
        if (colaEl) {
            if (CALENDARIO_ESTADO.alertaCola.length > 0) {
                colaEl.textContent = '+' + CALENDARIO_ESTADO.alertaCola.length + ' en cola';
                colaEl.style.display = 'inline-block';
            } else {
                colaEl.style.display = 'none';
            }
        }

        reproducirSonidoCalendario('tono_digital');
        toast.style.display = 'flex';
        toast.classList.remove('is-hiding');
        toast.classList.add('is-visible');
        break;
    }
}

function cerrarPopupRecordatorioActual(abrirSiguiente) {
    var toast = document.getElementById('cal-floating-reminder-toast');
    if (toast) {
        toast.classList.remove('is-visible');
        toast.style.display = 'none';
    }
    CALENDARIO_ESTADO.alertaActivaId = null;
    if (abrirSiguiente && CALENDARIO_ESTADO.alertaCola.length > 0) {
        setTimeout(mostrarSiguientePopupRecordatorio, 150);
    }
}

function descartarBannerRecordatorioActual() {
    // Oculta únicamente la tarjeta flotante visual: NO completa ni elimina el recordatorio,
    // de modo que sigue figurando en Notificaciones del Sistema y en la campana del HUD.
    cerrarPopupRecordatorioActual(true);
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Aviso minimizado · Pendiente en 🔔 Notificaciones', '🔔');
    }
}

function completarRecordatorioDesdePopup() {
    var id = CALENDARIO_ESTADO.alertaActivaId;
    if (!id) {
        cerrarPopupRecordatorioActual(true);
        return;
    }
    toggleCompletarEventoCalendario(id);
}

function posponerRecordatorioDesdePopup(minutos) {
    var id = CALENDARIO_ESTADO.alertaActivaId;
    var mins = parseInt(minutos, 10) || 10;
    if (id && Array.isArray(APP_STATE.calendario)) {
        var rec = APP_STATE.calendario.find(function(c) { return String(c.id) === String(id); });
        if (rec) {
            rec.pospuestoHasta = Date.now() + mins * 60000;
            rec.fechaActualizacion = Date.now();
            if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
                window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-rec-' + id);
            }
            if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca('Recordatorio pospuesto ' + mins + ' min', '⏰');
            }
        }
    }
    cerrarPopupRecordatorioActual(true);
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof programarAlarmasCalendarioNativas === 'function') programarAlarmasCalendarioNativas();
}

function verRecordatorioDesdePopup() {
    var id = CALENDARIO_ESTADO.alertaActivaId;
    var rec = id && Array.isArray(APP_STATE.calendario)
        ? APP_STATE.calendario.find(function(c) { return String(c.id) === String(id); })
        : null;
    cerrarPopupRecordatorioActual(false);
    if (rec && rec.fecha) {
        irAFechaEnCalendario(rec.fecha, 'mes');
    } else {
        cambiarVista('vista-calendario');
    }
}

// ==========================================================================
// INTEGRACIÓN DIRECTA CON CENTRO DE ALERTAS & NOTIFICACIONES (js/core.js)
// ==========================================================================

function obtenerAlertasCalendarioActivas() {
    if (!window.APP_STATE) return [];
    var ahora = Date.now();
    var alertas = [];
    var calLista = Array.isArray(APP_STATE.calendario) ? APP_STATE.calendario : [];

    calLista.forEach(function(raw) {
        var item = normalizarItemCalendario(raw);
        if (!item) return;

        // 1. Recordatorios cuya hora exacta ya llegó y no han sido confirmados ni completados
        if (item.tipo === 'recordatorio' && !item.completado && item.fecha && item.hora) {
            var targetMs = obtenerFechaHoraMs(item.fecha, item.hora);
            var dueMs = (item.pospuestoHasta && item.pospuestoHasta > targetMs) ? item.pospuestoHasta : targetMs;
            var yaOkey = item.avisoOkeyDueMs && Number(item.avisoOkeyDueMs) >= dueMs;
            if (!isNaN(dueMs) && ahora >= dueMs && !yaOkey) {
                var per = resolverPersonaPorId(item.personaId, item.personaNombre);
                var safeId = String(item.id).replace(/'/g, "\\'");
                var safeFecha = String(item.fecha).replace(/'/g, "\\'");
                alertas.push({
                    id: 'alerta-cal-rec-' + item.id,
                    calId: item.id,
                    tipo: 'urgente',
                    icono: '🔔',
                    badge: (item.pospuestoHasta && item.pospuestoHasta > targetMs) ? 'Recordatorio Pospuesto' : 'Recordatorio',
                    color: '#f59e0b',
                    titulo: item.titulo || 'Recordatorio',
                    metaLinea: '🕒 ' + item.hora + ' · ' + formatearFechaLegibleCorta(item.fecha) + (per ? ' · 👤 ' + per.nombre : ''),
                    descripcion: item.descripcion || '',
                    acciones: [
                        { tipo: 'primary', texto: '✓ Okey', fn: "confirmarOkeyRecordatorioCalendario('" + safeId + "', " + dueMs + ")" },
                        { tipo: 'secondary', texto: '✓ Completar', fn: "completarRecordatorioDesdeNotificacion('" + safeId + "')" },
                        { tipo: 'secondary', texto: '📅 Ver', fn: "cerrarCentroNotificaciones(); irAFechaEnCalendario('" + safeFecha + "', 'mes')" }
                    ],
                    _sortTs: dueMs,
                    _dispatchKey: 'alerta-cal-rec-' + item.id + '@' + dueMs,
                    _phoneMeta: {
                        monarcaAlertId: 'alerta-cal-rec-' + item.id,
                        monarcaAlertTipo: 'cal-rec',
                        calId: String(item.id),
                        dueMs: dueMs
                    }
                });
            }
        }

        // 2. Avisos previos de Eventos próximos o en curso (predeterminado 30 min antes)
        var avisoEvMin = (item.tipo === 'evento') ? obtenerMinutosAvisoPrevioEvento(item) : 0;
        if (item.tipo === 'evento' && !item.completado && !item.avisoDescartado && avisoEvMin > 0 && item.fecha && item.horaInicio) {
            var startMs = obtenerFechaHoraMs(item.fecha, item.horaInicio);
            var endMs = startMs + ((item.duracionMinutos || 60) * 60000);
            var alertMs = startMs - (avisoEvMin * 60000);
            if (!isNaN(startMs) && ahora >= alertMs && ahora <= endMs) {
                var badges = resolverBadgesVinculadosEvento(item.personaIds, item.grupoIds);
                var vincTexto = badges.length > 0 ? (' · ' + badges.map(function(b) { return b.icono + ' ' + b.nombre; }).join(', ')) : '';
                var safeEvId = String(item.id).replace(/'/g, "\\'");
                var safeEvFecha = String(item.fecha).replace(/'/g, "\\'");
                var tiempoInfo = formatearAvisoAnticipadoEvento(startMs, ahora, false);
                var descEv = item.descripcion
                    ? item.descripcion
                    : (tiempoInfo.enCurso
                        ? ('Tu evento programado está en curso (' + item.horaInicio + (item.horaFin ? '–' + item.horaFin : '') + ').')
                        : ('Prepárate: inicia a las ' + item.horaInicio + (item.horaFin ? ' hasta las ' + item.horaFin : '') + '.'));
                alertas.push({
                    id: 'alerta-cal-ev-' + item.id,
                    calId: item.id,
                    tipo: 'info',
                    icono: '📆',
                    badge: tiempoInfo.badgeTiempo,
                    color: item.color || '#38bdf8',
                    titulo: tiempoInfo.prefijoTitulo + ' ' + (item.titulo || 'Evento'),
                    metaLinea: '🕒 ' + item.horaInicio + (item.horaFin ? '–' + item.horaFin : '') + ' · ' + formatearFechaLegibleCorta(item.fecha) + vincTexto,
                    descripcion: descEv,
                    acciones: [
                        { tipo: 'primary', texto: '✓ Okey', fn: "descartarAvisoEventoCalendario('" + safeEvId + "')" },
                        { tipo: 'secondary', texto: '📅 Ver', fn: "cerrarCentroNotificaciones(); irAFechaEnCalendario('" + safeEvFecha + "', 'mes')" }
                    ],
                    _sortTs: startMs,
                    _dispatchKey: 'alerta-cal-ev-' + item.id + '@' + alertMs,
                    _phoneMeta: {
                        monarcaAlertId: 'alerta-cal-ev-' + item.id,
                        monarcaAlertTipo: 'cal-ev',
                        calId: String(item.id),
                        alertMs: alertMs
                    }
                });
            }
        }
    });

    // 3. Avisos previos (media hora antes) de tu Horario Semanal (Cronograma Base) y Turno Boom
    var hoyClave = _obtenerClaveHoyCalendario();
    var mananaClave = sumarDiasAFechaStr(hoyClave, 1);
    [hoyClave, mananaClave].forEach(function(fStr) {
        _obtenerOcurrenciasHorarioParaFecha(fStr).forEach(function(oc) {
            if (!oc || oc.yaOkey || oc.avisoMin <= 0) return;
            if (isNaN(oc.startMs) || isNaN(oc.alertMs)) return;
            if (ahora >= oc.alertMs && ahora <= oc.endMs) {
                var tiempoHor = formatearAvisoAnticipadoEvento(oc.startMs, ahora, true);
                var safeFStr = String(fStr).replace(/'/g, "\\'");
                if (oc.esBoom) {
                    var boomAlertId = 'alerta-cal-boom-' + fStr;
                    alertas.push({
                        id: boomAlertId,
                        calBoomFecha: fStr,
                        tipo: 'horario',
                        icono: '🚀',
                        badge: tiempoHor.badgeTiempo,
                        color: '#6366f1',
                        titulo: tiempoHor.prefijoTitulo + ' ' + oc.titulo,
                        metaLinea: '💼 Horario Laboral · 🕒 ' + oc.horaInicio + '–' + oc.horaFin + ' · ' + formatearFechaLegibleCorta(fStr),
                        descripcion: tiempoHor.enCurso
                            ? 'Tu turno laboral en Boom Solutions ya inició.'
                            : 'Tu jornada de 8.0h en Boom Solutions comienza a las ' + oc.horaInicio + '.',
                        acciones: [
                            { tipo: 'primary', texto: '✓ Okey', fn: "confirmarOkeyAvisoBoom('" + safeFStr + "')" },
                            { tipo: 'secondary', texto: '🗓️ Ver Horario', fn: "cerrarCentroNotificaciones(); irAFechaEnCalendario('" + safeFStr + "', 'semana')" }
                        ],
                        _sortTs: oc.startMs,
                        _dispatchKey: boomAlertId + '@' + oc.alertMs,
                        _phoneMeta: {
                            monarcaAlertId: boomAlertId,
                            monarcaAlertTipo: 'cal-boom',
                            fechaClave: fStr,
                            alertMs: oc.alertMs
                        }
                    });
                } else {
                    var croAlertId = 'alerta-cal-cro-' + oc.id + '-' + fStr;
                    var safeCroId = String(oc.id).replace(/'/g, "\\'");
                    alertas.push({
                        id: croAlertId,
                        calCroId: String(oc.id),
                        calCroFecha: fStr,
                        tipo: 'horario',
                        icono: '🗓️',
                        badge: tiempoHor.badgeTiempo,
                        color: oc.color || '#818cf8',
                        titulo: tiempoHor.prefijoTitulo + ' ' + oc.titulo,
                        metaLinea: '🕒 ' + oc.horaInicio + '–' + oc.horaFin + ' · ' + (oc.etiqueta || 'Horario') + ' · ' + DIAS_SEMANA_NOMBRES[oc.diaIdx],
                        descripcion: tiempoHor.enCurso
                            ? ('Bloque de tu horario en curso hasta las ' + oc.horaFin + '.')
                            : ('Tienes este evento de tu horario a las ' + oc.horaInicio + ' (hasta las ' + oc.horaFin + ').'),
                        acciones: [
                            { tipo: 'primary', texto: '✓ Okey', fn: "confirmarOkeyAvisoCronograma('" + safeCroId + "', '" + safeFStr + "')" },
                            { tipo: 'secondary', texto: '🗓️ Ver Horario', fn: "cerrarCentroNotificaciones(); irAFechaEnCalendario('" + safeFStr + "', 'semana')" }
                        ],
                        _sortTs: oc.startMs,
                        _dispatchKey: croAlertId + '@' + oc.alertMs,
                        _phoneMeta: {
                            monarcaAlertId: croAlertId,
                            monarcaAlertTipo: 'cal-cro',
                            calCroId: String(oc.id),
                            fechaClave: fStr,
                            alertMs: oc.alertMs
                        }
                    });
                }
            }
        });
    });

    alertas.sort(function(a, b) {
        return (a._sortTs || 0) - (b._sortTs || 0);
    });
    return alertas;
}

function obtenerProximosRecordatoriosHoy() {
    if (!window.APP_STATE) return [];
    var hoy = _obtenerClaveHoyCalendario();
    var ahora = Date.now();
    var lista = [];

    // 1. Recordatorios pendientes más tarde hoy
    obtenerRecordatoriosParaFecha(hoy).forEach(function(r) {
        if (r.completado) return;
        var targetMs = obtenerFechaHoraMs(r.fecha, r.hora);
        var dueMs = (r.pospuestoHasta && r.pospuestoHasta > targetMs) ? r.pospuestoHasta : targetMs;
        if (!isNaN(dueMs) && dueMs > ahora) {
            var per = resolverPersonaPorId(r.personaId, r.personaNombre);
            lista.push({
                id: r.id,
                tipo: 'recordatorio',
                icono: '🔔',
                hora: r.hora,
                titulo: r.titulo,
                personaNombre: per ? per.nombre : '',
                etiquetaAviso: 'Hora exacta',
                _sortTs: dueMs
            });
        }
    });

    // 2. Eventos de hoy cuyo aviso previo aún no se activa
    obtenerEventosParaFecha(hoy).forEach(function(ev) {
        if (ev.completado || ev.avisoDescartado || !ev.horaInicio) return;
        var startMs = obtenerFechaHoraMs(ev.fecha, ev.horaInicio);
        var avisoMin = obtenerMinutosAvisoPrevioEvento(ev);
        var alertMs = avisoMin > 0 ? (startMs - avisoMin * 60000) : startMs;
        if (!isNaN(startMs) && alertMs > ahora) {
            lista.push({
                id: ev.id,
                tipo: 'evento',
                icono: '📆',
                hora: ev.horaInicio + (ev.horaFin ? '–' + ev.horaFin : ''),
                titulo: ev.titulo,
                personaNombre: '',
                etiquetaAviso: avisoMin > 0 ? ('⏰ Aviso ' + avisoMin + 'm antes') : 'Sin aviso',
                _sortTs: startMs
            });
        }
    });

    // 3. Bloques de tu Horario Semanal y Boom que siguen más tarde hoy
    _obtenerOcurrenciasHorarioParaFecha(hoy).forEach(function(oc) {
        if (!oc || oc.yaOkey || isNaN(oc.startMs)) return;
        var umbral = (oc.avisoMin > 0 && !isNaN(oc.alertMs)) ? oc.alertMs : oc.startMs;
        if (umbral > ahora) {
            lista.push({
                id: oc.id,
                tipo: 'horario',
                icono: oc.esBoom ? '🚀' : '🗓️',
                hora: oc.horaInicio + '–' + oc.horaFin,
                titulo: oc.titulo,
                personaNombre: oc.etiqueta ? ('Tu horario · ' + oc.etiqueta) : 'Tu horario',
                etiquetaAviso: oc.avisoMin > 0 ? ('⏰ Aviso ' + oc.avisoMin + 'm antes') : 'Sin aviso',
                _sortTs: oc.startMs
            });
        }
    });

    lista.sort(function(a, b) {
        return (a._sortTs || 0) - (b._sortTs || 0);
    });
    return lista;
}

function confirmarOkeyRecordatorioCalendario(id, dueMsOpcional) {
    if (!window.APP_STATE || !Array.isArray(APP_STATE.calendario)) return;
    var rec = APP_STATE.calendario.find(function(c) { return c && String(c.id) === String(id); });
    if (rec) {
        var targetMs = obtenerFechaHoraMs(rec.fecha, rec.hora);
        var dueMs = (rec.pospuestoHasta && rec.pospuestoHasta > targetMs) ? rec.pospuestoHasta : targetMs;
        var ackMs = Number(dueMsOpcional) || dueMs || Date.now();
        rec.avisoOkeyDueMs = Math.max(Number(rec.avisoOkeyDueMs) || 0, ackMs);
        rec.fechaActualizacion = Date.now();
        if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
    }
    if (CALENDARIO_ESTADO.alertaActivaId && String(CALENDARIO_ESTADO.alertaActivaId) === String(id)) {
        cerrarPopupRecordatorioActual(true);
    }
    if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
        window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-rec-' + id);
    }
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof renderizarCentroNotificaciones === 'function') renderizarCentroNotificaciones();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Recordatorio confirmado con ✓ Okey', '✅');
    }
}

function completarRecordatorioDesdeNotificacion(id) {
    toggleCompletarEventoCalendario(id);
    if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
        window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-rec-' + id);
    }
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Recordatorio completado', '✅');
    }
}

function descartarAvisoEventoCalendario(id) {
    if (!Array.isArray(APP_STATE.calendario)) return;
    var ev = APP_STATE.calendario.find(function(c) { return String(c.id) === String(id); });
    if (ev) {
        ev.avisoDescartado = true;
        ev.fechaActualizacion = Date.now();
        if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
    }
    if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
        window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-ev-' + id);
    }
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof renderizarCentroNotificaciones === 'function') renderizarCentroNotificaciones();
}

function confirmarOkeyAvisoCronograma(bloqueId, fechaClave) {
    var fClave = String(fechaClave || _obtenerClaveHoyCalendario());
    if (window.APP_STATE && Array.isArray(APP_STATE.cronogramaSemanal)) {
        var b = APP_STATE.cronogramaSemanal.find(function(item) { return item && String(item.id) === String(bloqueId); });
        if (b) {
            b.avisoOkeyFecha = fClave;
            b.avisoDisparadoFecha = fClave;
            b.fechaActualizacion = Date.now();
            if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
        }
    }
    if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
        window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-cro-' + bloqueId + '-' + fClave);
    }
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof renderizarCentroNotificaciones === 'function') renderizarCentroNotificaciones();
}

function confirmarOkeyAvisoBoom(fechaClave) {
    var fClave = String(fechaClave || _obtenerClaveHoyCalendario());
    if (window.APP_STATE) {
        if (!APP_STATE.registroDiarioCalendario) APP_STATE.registroDiarioCalendario = {};
        if (!APP_STATE.registroDiarioCalendario[fClave]) APP_STATE.registroDiarioCalendario[fClave] = {};
        APP_STATE.registroDiarioCalendario[fClave].boomAvisoOkey = true;
        APP_STATE.registroDiarioCalendario[fClave].boomAvisoDisparado = true;
        if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
    }
    if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
        window.cancelarNotificacionTelefonoPorAlerta('alerta-cal-boom-' + fClave);
    }
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof renderizarCentroNotificaciones === 'function') renderizarCentroNotificaciones();
}

function programarAlarmasCalendarioNativas() {
    try {
        if (typeof window.verificarCicloSuenoEnVivo === 'function') {
            try { window.verificarCicloSuenoEnVivo(); } catch (eS1) {}
        }
        if (typeof window.programarAlarmaHoraDormirNativa === 'function') {
            try { window.programarAlarmaHoraDormirNativa(); } catch (eS2) {}
        }
        var plugins = (window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins : null;
        var ln = plugins ? plugins.LocalNotifications : null;
        if (!ln || typeof ln.schedule !== 'function' || !window.APP_STATE) return;

        var ahora = Date.now();
        var notifs = [];
        var futurasMeta = [];
        var calLista = Array.isArray(APP_STATE.calendario) ? APP_STATE.calendario : [];

        calLista.forEach(function(raw) {
            var item = normalizarItemCalendario(raw);
            if (!item || item.completado) return;

            if (item.tipo === 'recordatorio' && item.fecha && item.hora) {
                var targetMs = obtenerFechaHoraMs(item.fecha, item.hora);
                var dueMs = (item.pospuestoHasta && item.pospuestoHasta > targetMs) ? item.pospuestoHasta : targetMs;
                var yaOkey = item.avisoOkeyDueMs && Number(item.avisoOkeyDueMs) >= dueMs;
                if (!isNaN(dueMs) && dueMs > ahora + 3000 && !yaOkey) {
                    var per = resolverPersonaPorId(item.personaId, item.personaNombre);
                    var alertRecId = 'alerta-cal-rec-' + item.id;
                    var numRecId = (typeof window.obtenerIdNumericoNotifMonarca === 'function')
                        ? window.obtenerIdNumericoNotifMonarca(alertRecId)
                        : (70000 + Math.abs(String(item.id).split('').reduce(function(acc, ch) { return ((acc * 31) + ch.charCodeAt(0)) % 10000; }, 0)));
                    var dispatchRecKey = alertRecId + '@' + dueMs;

                    notifs.push({
                        id: numRecId,
                        title: '🔔 ' + (item.titulo || 'Recordatorio'),
                        body: ((item.hora || '') + (per ? ' · 👤 ' + per.nombre : '') + (item.descripcion ? ' — ' + item.descripcion : '')).trim() || 'Recordatorio Monarca · Pulsa ✓ Okey',
                        schedule: { at: new Date(dueMs), allowWhileIdle: true },
                        channelId: 'monarca_alerts_channel',
                        actionTypeId: 'MONARCA_ALERT_OKEY',
                        autoCancel: true,
                        extra: {
                            monarcaAlertId: alertRecId,
                            monarcaAlertTipo: 'cal-rec',
                            calId: String(item.id),
                            dueMs: dueMs,
                            dispatchKey: dispatchRecKey
                        }
                    });
                    futurasMeta.push({ dispatchKey: dispatchRecKey, idNum: numRecId, futureAt: dueMs });
                }
            } else if (item.tipo === 'evento' && !item.avisoDescartado && item.fecha && (item.horaInicio || item.hora)) {
                var avisoMin = obtenerMinutosAvisoPrevioEvento(item);
                if (avisoMin <= 0) return;
                var hIni = item.horaInicio || item.hora;
                var startMs = obtenerFechaHoraMs(item.fecha, hIni);
                var alertMs = startMs - (avisoMin * 60000);
                if (!isNaN(startMs) && !isNaN(alertMs) && alertMs > ahora + 3000) {
                    var alertEvId = 'alerta-cal-ev-' + item.id;
                    var numEvId = (typeof window.obtenerIdNumericoNotifMonarca === 'function')
                        ? window.obtenerIdNumericoNotifMonarca(alertEvId)
                        : (80000 + Math.abs(String(item.id).split('').reduce(function(acc, ch) { return ((acc * 31) + ch.charCodeAt(0)) % 10000; }, 0)));
                    var dispatchEvKey = alertEvId + '@' + alertMs;
                    var antTxt = formatearTextoAnticipacionMin(avisoMin);

                    notifs.push({
                        id: numEvId,
                        title: '⏰ En ' + antTxt + ': ' + (item.titulo || 'Evento'),
                        body: 'Tienes "' + (item.titulo || 'Evento') + '" a las ' + hIni + (item.horaFin ? '–' + item.horaFin : '') + (item.descripcion ? ' · ' + item.descripcion : ''),
                        schedule: { at: new Date(alertMs), allowWhileIdle: true },
                        channelId: 'monarca_alerts_channel',
                        actionTypeId: 'MONARCA_ALERT_OKEY',
                        autoCancel: true,
                        extra: {
                            monarcaAlertId: alertEvId,
                            monarcaAlertTipo: 'cal-ev',
                            calId: String(item.id),
                            alertMs: alertMs,
                            dispatchKey: dispatchEvKey
                        }
                    });
                    futurasMeta.push({ dispatchKey: dispatchEvKey, idNum: numEvId, futureAt: alertMs });
                }
            }
        });

        // Programar alarmas nativas (hoy y mañana) para los bloques del Horario Semanal y Boom Solutions
        var hoyClave = _obtenerClaveHoyCalendario();
        var mananaClave = sumarDiasAFechaStr(hoyClave, 1);
        [hoyClave, mananaClave].forEach(function(fStr) {
            _obtenerOcurrenciasHorarioParaFecha(fStr).forEach(function(oc) {
                if (!oc || oc.yaOkey || oc.avisoMin <= 0) return;
                if (isNaN(oc.alertMs) || oc.alertMs <= ahora + 3000) return;
                var antHorTxt = formatearTextoAnticipacionMin(oc.avisoMin);
                var alertHorId = oc.esBoom
                    ? ('alerta-cal-boom-' + fStr)
                    : ('alerta-cal-cro-' + oc.id + '-' + fStr);
                var numHorId = (typeof window.obtenerIdNumericoNotifMonarca === 'function')
                    ? window.obtenerIdNumericoNotifMonarca(alertHorId)
                    : (90000 + Math.abs(alertHorId.split('').reduce(function(acc, ch) { return ((acc * 31) + ch.charCodeAt(0)) % 9000; }, 0)));
                var dispatchHorKey = alertHorId + '@' + oc.alertMs;

                notifs.push({
                    id: numHorId,
                    title: (oc.esBoom ? '🚀 En ' : '🗓️ En ') + antHorTxt + ': ' + oc.titulo,
                    body: 'En tu horario (' + oc.horaInicio + '–' + oc.horaFin + ') · ' + (oc.etiqueta || 'Rutina'),
                    schedule: { at: new Date(oc.alertMs), allowWhileIdle: true },
                    channelId: 'monarca_alerts_channel',
                    actionTypeId: 'MONARCA_ALERT_OKEY',
                    autoCancel: true,
                    extra: {
                        monarcaAlertId: alertHorId,
                        monarcaAlertTipo: oc.esBoom ? 'cal-boom' : 'cal-cro',
                        calCroId: oc.esBoom ? null : String(oc.id),
                        fechaClave: fStr,
                        alertMs: oc.alertMs,
                        dispatchKey: dispatchHorKey
                    }
                });
                futurasMeta.push({ dispatchKey: dispatchHorKey, idNum: numHorId, futureAt: oc.alertMs });
            });
        });

        if (notifs.length > 0) {
            var prepProm = (typeof window.asegurarCanalYAccionesNotifMonarca === 'function')
                ? window.asegurarCanalYAccionesNotifMonarca()
                : Promise.resolve(true);
            prepProm.then(function() {
                return ln.schedule({ notifications: notifs });
            }).then(function() {
                if (typeof window.registrarNotifProgramadaTelefono === 'function') {
                    futurasMeta.forEach(function(m) {
                        window.registrarNotifProgramadaTelefono(m.dispatchKey, m.idNum, m.futureAt);
                    });
                }
            }).catch(function() {});
        }
    } catch(e) {}
}

window.crearGuardarRecordatorioCalendario = crearGuardarRecordatorioCalendario;
window.refrescarSelectoresPersonasCalendario = refrescarSelectoresPersonasCalendario;
window.confirmarOkeyRecordatorioCalendario = confirmarOkeyRecordatorioCalendario;
window.descartarAvisoEventoCalendario = descartarAvisoEventoCalendario;
window.confirmarOkeyAvisoCronograma = confirmarOkeyAvisoCronograma;
window.confirmarOkeyAvisoBoom = confirmarOkeyAvisoBoom;
window.obtenerAlertasCalendarioActivas = obtenerAlertasCalendarioActivas;
window.obtenerProximosRecordatoriosHoy = obtenerProximosRecordatoriosHoy;
window.verificarDisparadoresCalendario = verificarDisparadoresCalendario;
window.programarAlarmasCalendarioNativas = programarAlarmasCalendarioNativas;

/**
 * Devuelve los candidatos matutinos (03:00 a 13:00) de una fecha dada desde Recordatorios, Eventos y Horario Semanal/Boom.
 */
function obtenerCandidatosMatutinosCalendario(fechaStr) {
    var lista = [];
    if (!window.APP_STATE || !fechaStr) return lista;
    try {
        var normH = function(str) {
            if (!str) return null;
            var p = String(str).trim().split(':');
            if (p.length < 2) return null;
            var hh = parseInt(p[0], 10);
            var mm = parseInt(p[1], 10);
            if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
            var mins = hh * 60 + mm;
            if (mins < 180 || mins > 780) return null;
            return {
                hora: String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'),
                min: mins
            };
        };

        obtenerRecordatoriosParaFecha(fechaStr).forEach(function(r) {
            if (!r || r.completado || !r.hora) return;
            var hObj = normH(r.hora);
            if (!hObj) return;
            lista.push({
                origen: 'recordatorio',
                icono: '🔔',
                titulo: r.titulo || 'Recordatorio matutino',
                hora: hObj.hora,
                min: hObj.min
            });
        });

        obtenerEventosParaFecha(fechaStr).forEach(function(ev) {
            if (!ev || ev.completado) return;
            var hIni = ev.horaInicio || ev.hora;
            var hObj = normH(hIni);
            if (!hObj) return;
            lista.push({
                origen: 'evento',
                icono: '📆',
                titulo: ev.titulo || 'Evento matutino',
                hora: hObj.hora,
                min: hObj.min
            });
        });

        _obtenerOcurrenciasHorarioParaFecha(fechaStr).forEach(function(oc) {
            if (!oc || !oc.horaInicio) return;
            var hObj = normH(oc.horaInicio);
            if (!hObj) return;
            lista.push({
                origen: oc.esBoom ? 'boom' : 'horario',
                icono: oc.esBoom ? '🚀' : '🗓️',
                titulo: oc.titulo || 'Actividad matutina',
                hora: hObj.hora,
                min: hObj.min
            });
        });
    } catch (e) {}
    return lista;
}

window.obtenerCandidatosMatutinosCalendario = obtenerCandidatosMatutinosCalendario;

