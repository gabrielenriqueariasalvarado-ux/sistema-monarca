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
    filtroRecordatorios: 'pendientes',
    filtroEventos: 'proximos',
    modalTipo: 'recordatorio',
    alertaCola: [],
    alertaActivaId: null,
    motorInterval: null,
    personaIdsSeleccionadosModal: [],
    grupoIdsSeleccionadosModal: []
};

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

function irAFechaEnCalendario(fechaStr, seccionOpcional) {
    var f = parsearClaveFechaLocal(fechaStr);
    if (f) {
        CALENDARIO_ESTADO.anio = f.getFullYear();
        CALENDARIO_ESTADO.mes = f.getMonth();
        CALENDARIO_ESTADO.diaSeleccionado = f.getDate();
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
    var claveSel = formatearClaveFecha(CALENDARIO_ESTADO.anio, CALENDARIO_ESTADO.mes, CALENDARIO_ESTADO.diaSeleccionado);

    var html = '<div class="card cal-shell-card" style="margin-bottom: 18px;">' +
        '<div class="cal-module-header">' +
            '<div style="display:flex; align-items:center; gap:12px;">' +
                '<div class="cal-hero-icon">📅</div>' +
                '<div>' +
                    '<h2 style="margin:0; font-size:19px; font-weight:800; color:#f8fafc; letter-spacing:-0.3px;">Calendario & Agenda Táctica</h2>' +
                    '<p style="margin:2px 0 0 0; font-size:12px; color:#94a3b8;">Recordatorios con alerta exacta, Eventos con Personas/Grupos, Días Destacados y Cronograma Semanal.</p>' +
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

        var destacadosDia = obtenerDestacadosParaFecha(claveFecha);
        var recordatoriosDia = obtenerRecordatoriosParaFecha(claveFecha);
        var eventosDia = obtenerEventosParaFecha(claveFecha);
        var diaIdx = obtenerIndiceDiaSemana(claveFecha);
        var rutinaDiaCount = obtenerCronogramaParaDiaSemana(diaIdx).length;

        var regDia = (APP_STATE.registroDiarioCalendario && APP_STATE.registroDiarioCalendario[claveFecha]) ? APP_STATE.registroDiarioCalendario[claveFecha] : null;
        if (!regDia && esHoy && typeof calcularMetricasPurasSinActualizar === 'function') {
            regDia = calcularMetricasPurasSinActualizar();
        }
        var pctGeneral = regDia ? Math.round(Number(regDia.general) || 0) : 0;
        var badgeClass = 'badge-cero';
        if (pctGeneral >= 75) badgeClass = 'badge-alto';
        else if (pctGeneral >= 35) badgeClass = 'badge-medio';
        else if (pctGeneral > 0) badgeClass = 'badge-leve';

        var tieneFinanzas = false;
        if (APP_STATE.finanzas) {
            if (APP_STATE.finanzas.ingresos && APP_STATE.finanzas.ingresos.some(function(i) { return Number(i.dia) === d; })) tieneFinanzas = true;
            if (APP_STATE.finanzas.gastos && APP_STATE.finanzas.gastos.some(function(g) { return Number(g.dia) === d; })) tieneFinanzas = true;
            if (APP_STATE.finanzas.deudas && APP_STATE.finanzas.deudas.some(function(deu) { return Number(deu.dia) === d; })) tieneFinanzas = true;
        }

        var classes = 'calendar-day-cell';
        if (esHoy) classes += ' is-today';
        if (esSeleccionado) classes += ' is-selected';
        if (destacadosDia.length > 0) classes += ' is-destacado';

        var recPend = recordatoriosDia.filter(function(r) { return !r.completado; }).length;
        var destMini = destacadosDia.length > 0
            ? '<div class="cal-cell-dest-pill" title="' + calEscHtml(destacadosDia[0].titulo) + '">⭐ ' + calEscHtml(destacadosDia[0].titulo) + '</div>'
            : '';

        html += '<div class="' + classes + '" onclick="seleccionarDiaCalendario(' + d + ')">' +
            '<span class="calendar-day-num">' + d + '</span>' +
            '<span class="calendar-wear-badge ' + badgeClass + '">' + pctGeneral + '%</span>' +
            destMini +
            '<div class="calendar-dots-container">' +
                (eventosDia.length > 0 ? '<span class="calendar-dot dot-event" title="' + eventosDia.length + ' evento(s)"></span>' : '') +
                (recPend > 0 ? '<span class="calendar-dot dot-reminder" title="' + recPend + ' recordatorio(s) pendiente(s)"></span>' : '') +
                (destacadosDia.length > 0 ? '<span class="calendar-dot dot-destacado" title="Día destacado"></span>' : '') +
                (rutinaDiaCount > 0 ? '<span class="calendar-dot dot-routine" title="' + rutinaDiaCount + ' bloque(s) de rutina semanal"></span>' : '') +
                (tieneFinanzas ? '<span class="calendar-dot dot-finance" title="Movimiento financiero"></span>' : '') +
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
            '<div class="calendar-legend-item"><span class="calendar-dot dot-destacado"></span><span>Día Destacado</span></div>' +
            '<div class="calendar-legend-item"><span class="calendar-dot dot-routine"></span><span>Rutina Semanal</span></div>' +
            '<div class="calendar-legend-item"><span class="calendar-dot dot-finance"></span><span>Finanzas</span></div>' +
        '</div>' +
    '</div>';

    html += renderizarPanelDetalleDia(claveFechaSel, hoyClave);
    return html;
}

function renderizarPanelDetalleDia(claveFechaSel, hoyClave) {
    var fechaObj = parsearClaveFechaLocal(claveFechaSel) || new Date();
    var diaSel = fechaObj.getDate();
    var diaIdx = (fechaObj.getDay() + 6) % 7;
    var fechaTextoCompleto = DIAS_SEMANA_NOMBRES[diaIdx] + ", " + diaSel + " de " + MESES_NOMBRES[fechaObj.getMonth()] + " de " + fechaObj.getFullYear();
    var esHoySel = (claveFechaSel === hoyClave);

    var destacadosDia = obtenerDestacadosParaFecha(claveFechaSel);
    var recordatoriosDia = obtenerRecordatoriosParaFecha(claveFechaSel);
    var eventosDia = obtenerEventosParaFecha(claveFechaSel);
    var cronogramaDia = obtenerCronogramaParaDiaSemana(diaIdx);

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

    var html = '<div class="card cal-detail-card">' +
        '<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">' +
            '<div>' +
                '<span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">DETALLE DE JORNADA</span>' +
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
    html += '<div class="cal-day-section-block">' +
        '<div class="cal-day-section-title"><span>🔔 Recordatorios del Día (' + recordatoriosDia.length + ')</span></div>';
    if (recordatoriosDia.length > 0) {
        html += '<div class="calendar-events-container" style="margin-top:8px;">';
        recordatoriosDia.forEach(function(rec) {
            html += renderizarTarjetaRecordatorio(rec, true);
        });
        html += '</div>';
    } else {
        html += '<div class="cal-empty-mini">Sin recordatorios en esta fecha.</div>';
    }
    html += '</div>';

    // 3. EVENTOS PROGRAMADOS DEL DÍA
    html += '<div class="cal-day-section-block">' +
        '<div class="cal-day-section-title"><span>📆 Eventos Programados (' + eventosDia.length + ')</span></div>';
    if (eventosDia.length > 0) {
        html += '<div class="calendar-events-container" style="margin-top:8px;">';
        eventosDia.forEach(function(ev) {
            html += renderizarTarjetaEvento(ev, eventosDia);
        });
        html += '</div>';
    } else {
        html += '<div class="cal-empty-mini">Sin eventos programados en esta fecha.</div>';
    }
    html += '</div>';

    // 4. CRONOGRAMA SEMANAL APLICADO A ESTE DÍA (CON PRIORIDAD VISUAL PARA EVENTOS)
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

    // 5. MÉTRICAS DEL AVATAR Y FINANZAS DEL DÍA (SISTEMA EXISTENTE PRESERVADO EN TEMA OSCURO)
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

    var finanzasDia = [];
    if (APP_STATE.finanzas) {
        (APP_STATE.finanzas.ingresos || []).forEach(function(i) {
            if (Number(i.dia) === diaSel) finanzasDia.push({ tipo: 'Ingreso', texto: i.fuente + ' (+$' + i.monto + ')', icon: '💰' });
        });
        (APP_STATE.finanzas.gastos || []).forEach(function(g) {
            if (Number(g.dia) === diaSel) finanzasDia.push({ tipo: 'Gasto', texto: g.concepto + ' ($' + g.monto + ') · ' + (g.categoria || ''), icon: '💸' });
        });
        (APP_STATE.finanzas.deudas || []).forEach(function(deu) {
            if (Number(deu.dia) === diaSel) finanzasDia.push({ tipo: 'Deuda', texto: 'Vencimiento: ' + deu.nombre + ' ($' + deu.montoTotal + ')', icon: '💳' });
        });
    }
    if (finanzasDia.length > 0) {
        html += '<div style="margin-top: 14px;">' +
            '<span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">SISTEMA FINANCIERO · DÍA ' + diaSel + '</span>' +
            '<div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">';
        finanzasDia.forEach(function(item) {
            html += '<div class="calendar-system-activity-item">' +
                '<div style="display: flex; align-items: center; gap: 8px;"><span>' + item.icon + '</span><span>' + calEscHtml(item.texto) + '</span></div>' +
                '<span class="calendar-event-cat-badge">' + calEscHtml(item.tipo) + '</span>' +
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
                '<span class="cal-pill-badge" style="background:rgba(99,102,241,0.18); color:#c7d2fe;">🕒 Rutina Semanal</span>' +
                '<button type="button" class="btn-sync-action btn-sync-light" onclick="abrirModalNuevoEvento(null, \'cronograma\')" style="font-size:12px;">+ Bloque Rutina</button>' +
            '</div>' +
        '</div>' +

        '<div class="cal-weekly-outer">' +
            '<div class="cal-weekly-header-row">' +
                '<div class="cal-weekly-corner">Hora</div>';

    var diasSemanaFechas = [];
    for (var i = 0; i < 7; i++) {
        var fStr = sumarDiasAFechaStr(lunesClave, i);
        diasSemanaFechas.push(fStr);
        var fDate = parsearClaveFechaLocal(fStr);
        var esHoy = (fStr === hoyClave);
        var dests = obtenerDestacadosParaFecha(fStr);
        var destBanner = dests.map(function(dt) {
            return '<div class="cal-week-dest-chip" style="border-color:' + (dt.color || '#f59e0b') + '; background:' + (dt.color || '#f59e0b') + '26;" onclick="irAFechaEnCalendario(\'' + fStr + '\', \'mes\')" title="' + calEscHtml(dt.titulo) + '">⭐ ' + calEscHtml(dt.titulo) + '</div>';
        }).join('');

        html += '<div class="cal-weekly-day-head ' + (esHoy ? 'is-today' : '') + '">' +
            '<div class="cal-weekly-day-label" onclick="irAFechaEnCalendario(\'' + fStr + '\', \'mes\')" title="Ver detalle del día">' +
                '<span>' + DIAS_SEMANA_CORTOS[i] + '</span> ' +
                '<strong class="cal-weekly-day-num">' + (fDate ? fDate.getDate() : '') + '</strong>' +
            '</div>' +
            destBanner +
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
        var eventosDia = obtenerEventosParaFecha(fStr);
        var rutinasDia = obtenerCronogramaParaDiaSemana(diaIdx);
        var recordatoriosDia = obtenerRecordatoriosParaFecha(fStr);

        html += '<div class="cal-weekly-day-col ' + (esHoyCol ? 'is-today' : '') + '" style="height:' + (24 * HOUR_HEIGHT) + 'px;">';

        // Líneas horarias interactivas (tocar una hora vacía abre modal para ese día y hora)
        for (var hr = 0; hr < 24; hr++) {
            var hrStr = (hr < 10 ? '0' : '') + hr + ':00';
            html += '<div class="cal-weekly-slot-line" style="top:' + (hr * HOUR_HEIGHT) + 'px; height:' + HOUR_HEIGHT + 'px;" onclick="abrirModalNuevoEvento(\'' + fStr + '\', \'evento\', null, \'' + hrStr + '\')" title="Tocar para programar a las ' + hrStr + '"></div>';
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

        // 2. Pintar Eventos con PRIORIDAD VISUAL en primer plano (y desplazamiento lateral si solapa con rutina u otro evento)
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
            var chocaOtroEvento = eventosDia.some(function(o, oIdx) {
                return oIdx < idxEv && typeof o._startMin === 'number' && typeof o._endMinRaw === 'number' && intervalosSolapan(ev._startMin, clampedEnd, o._startMin, o._endMinRaw);
            });

            var leftPct = chocaOtroEvento ? '14%' : (tocaRutina ? '8%' : '3%');
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
                html += '<div class="cal-cronograma-block-card" style="border-left:3px solid ' + col + ';">' +
                    '<div style="flex:1; min-width:0;">' +
                        '<div style="font-size:11px; font-weight:700; color:#94a3b8;">' + calEscHtml(b.horaInicio) + ' – ' + calEscHtml(b.horaFin) + ' · <span style="color:' + col + ';">' + calEscHtml(b.etiqueta || 'Rutina') + '</span></div>' +
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

function refrescarSelectoresPersonasCalendario() {
    var personas = obtenerPersonasDisponibles();
    var opcionesBase = '<option value="">— Ninguna persona vinculada —</option>' +
        personas.map(function(p) {
            var meta = p.ubicacionCategoria ? ' (' + p.ubicacionCategoria + ')' : '';
            return '<option value="' + calEscHtml(p.id) + '">' + calEscHtml(p.nombre + meta) + '</option>';
        }).join('');

    var selRec = document.getElementById('cal-rec-persona');
    if (selRec) {
        var valRec = selRec.value;
        selRec.innerHTML = opcionesBase;
        if (valRec) selRec.value = valRec;
    }

    var selDest = document.getElementById('cal-dest-persona');
    if (selDest) {
        var valDest = selDest.value;
        selDest.innerHTML = opcionesBase;
        if (valDest) selDest.value = valDest;
    }

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

function abrirModalNuevoEvento(fechaPredefinida, tipoInicial, editId, horaPredefinida) {
    var modal = document.getElementById('modal-nuevo-evento');
    if (!modal) return;

    var fechaBase = fechaPredefinida || formatearClaveFecha(CALENDARIO_ESTADO.anio, CALENDARIO_ESTADO.mes, CALENDARIO_ESTADO.diaSeleccionado);
    var horaDefault = horaPredefinida || '09:00';
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

    // Limpiar campos Evento
    document.getElementById('cal-ev-titulo').value = '';
    document.getElementById('cal-ev-desc').value = '';
    document.getElementById('cal-ev-fecha').value = fechaBase;
    document.getElementById('cal-ev-inicio').value = horaDefault;
    document.getElementById('cal-ev-duracion-val').value = 60;
    document.getElementById('cal-ev-duracion-unit').value = 'min';
    document.getElementById('cal-ev-aviso').value = '15';
    document.getElementById('cal-ev-color').value = '#38bdf8';

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
                    document.getElementById('cal-ev-aviso').value = String(typeof item.avisoPrevioMin === 'number' ? item.avisoPrevioMin : 15);
                    document.getElementById('cal-ev-color').value = item.color || '#38bdf8';
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

        if (!titulo) { alert('Ingresa el nombre del recordatorio.'); return; }
        if (!fecha || !hora) { alert('Selecciona fecha y hora exacta para el recordatorio.'); return; }

        var per = resolverPersonaPorId(personaId);
        var fechaDate = parsearClaveFechaLocal(fecha);
        if (fechaDate) {
            CALENDARIO_ESTADO.anio = fechaDate.getFullYear();
            CALENDARIO_ESTADO.mes = fechaDate.getMonth();
            CALENDARIO_ESTADO.diaSeleccionado = fechaDate.getDate();
        }

        if (editId) {
            var idx = APP_STATE.calendario.findIndex(function(c) { return String(c.id) === String(editId); });
            if (idx !== -1) {
                var ex = APP_STATE.calendario[idx];
                var cambioHorario = (ex.fecha !== fecha || ex.hora !== hora);
                APP_STATE.calendario[idx] = Object.assign({}, ex, {
                    tipo: 'recordatorio',
                    titulo: titulo,
                    descripcion: desc,
                    fecha: fecha,
                    hora: hora,
                    personaId: personaId || '',
                    personaNombre: per ? per.nombre : '',
                    pospuestoHasta: cambioHorario ? null : (ex.pospuestoHasta || null),
                    notificadoParaTs: cambioHorario ? null : (ex.notificadoParaTs || null),
                    fechaActualizacion: ahora
                });
            }
        } else {
            APP_STATE.calendario.push({
                id: 'REC-' + ahora + '-' + Math.random().toString(36).substr(2, 4),
                tipo: 'recordatorio',
                titulo: titulo,
                descripcion: desc,
                fecha: fecha,
                hora: hora,
                personaId: personaId || '',
                personaNombre: per ? per.nombre : '',
                completado: false,
                fechaCompletada: null,
                pospuestoHasta: null,
                notificadoParaTs: null,
                notificadoEn: null,
                timestamp: ahora,
                fechaActualizacion: ahora
            });
        }
    } else if (tipo === 'evento') {
        var evTitulo = document.getElementById('cal-ev-titulo').value.trim();
        var evDesc = document.getElementById('cal-ev-desc').value.trim();
        var evFecha = document.getElementById('cal-ev-fecha').value;
        var evInicio = document.getElementById('cal-ev-inicio').value;
        var evDurVal = document.getElementById('cal-ev-duracion-val').value;
        var evDurUnit = document.getElementById('cal-ev-duracion-unit').value;
        var evAviso = parseInt(document.getElementById('cal-ev-aviso').value, 10) || 0;
        var evColor = document.getElementById('cal-ev-color').value || '#38bdf8';

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
                    avisoDisparadoParaTs: (oldEv.fecha !== evFecha || oldEv.horaInicio !== evInicio || oldEv.avisoPrevioMin !== evAviso) ? null : oldEv.avisoDisparadoParaTs,
                    avisoDescartado: (oldEv.fecha !== evFecha || oldEv.horaInicio !== evInicio) ? false : !!oldEv.avisoDescartado,
                    color: evColor,
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
                avisoDisparadoParaTs: null,
                avisoDisparadoEn: null,
                avisoDescartado: false,
                color: evColor,
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
                APP_STATE.cronogramaSemanal[idxC] = Object.assign({}, APP_STATE.cronogramaSemanal[idxC], {
                    diaSemana: isNaN(diaUnico) ? 0 : diaUnico,
                    horaInicio: cInicio,
                    horaFin: cFin,
                    titulo: cTitulo,
                    etiqueta: cEtiqueta,
                    color: cColor,
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

    renderizarCalendario();
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
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
    if (typeof MonarcaDB !== 'undefined') MonarcaDB.save(APP_STATE);
    renderizarCalendario();
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

function verificarDisparadoresCalendario() {
    if (!window.APP_STATE || !Array.isArray(APP_STATE.calendario)) return;
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
                if (ahora >= dueMs && (!item.notificadoParaTs || item.notificadoParaTs < dueMs)) {
                    item.notificadoParaTs = dueMs;
                    item.notificadoEn = ahora;
                    item.fechaActualizacion = ahora;
                    huboCambios = true;
                    nuevosRecordatoriosDisparados.push(item);
                }
            }
        }

        // 2. Aviso previo de Eventos
        if (item.tipo === 'evento' && !item.completado && !item.avisoDescartado && item.avisoPrevioMin > 0 && item.fecha && (item.horaInicio || item.hora)) {
            var hIni = item.horaInicio || item.hora;
            var startMs = obtenerFechaHoraMs(item.fecha, hIni);
            var durMs = (parseInt(item.duracionMinutos, 10) || 60) * 60000;
            var endMs = startMs + durMs;
            var alertMs = startMs - (Number(item.avisoPrevioMin) * 60000);
            if (!isNaN(startMs) && ahora >= alertMs && ahora <= endMs && (!item.avisoDisparadoParaTs || item.avisoDisparadoParaTs < alertMs)) {
                item.avisoDisparadoParaTs = alertMs;
                item.avisoDisparadoEn = ahora;
                item.fechaActualizacion = ahora;
                huboCambios = true;
                reproducirSonidoCalendario('tono_zen');
                if (typeof emitirNotificacionQuest === 'function') {
                    emitirNotificacionQuest('📆 Próximo evento: ' + item.titulo, 'Inicia a las ' + hIni + (item.descripcion ? ' · ' + item.descripcion : ''), false, 'cal-ev-' + item.id);
                }
                if (typeof mostrarToastMonarca === 'function') {
                    mostrarToastMonarca('Evento próximo (' + hIni + '): ' + item.titulo, '📆');
                }
            }
        }
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
            var per = resolverPersonaPorId(rec.personaId, rec.personaNombre);
            var cuerpo = (rec.hora || '') + (per ? ' · 👤 ' + per.nombre : '') + (rec.descripcion ? ' — ' + rec.descripcion : '');
            if (typeof emitirNotificacionQuest === 'function') {
                emitirNotificacionQuest('🔔 Recordatorio: ' + rec.titulo, cuerpo || 'Recordatorio de Calendario', true, 'cal-rec-' + rec.id);
            }
        });
        mostrarSiguientePopupRecordatorio();
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
    var modal = document.getElementById('modal-alerta-recordatorio-cal');
    if (!modal) return;
    if (modal.style.display === 'flex' && CALENDARIO_ESTADO.alertaActivaId) {
        // Actualizar badge de cola si ya hay uno abierto
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
            descEl.textContent = rec.descripcion || 'Tienes este recordatorio programado para esta hora.';
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
        modal.style.display = 'flex';
        break;
    }
}

function cerrarPopupRecordatorioActual(abrirSiguiente) {
    var modal = document.getElementById('modal-alerta-recordatorio-cal');
    if (modal) modal.style.display = 'none';
    CALENDARIO_ESTADO.alertaActivaId = null;
    if (abrirSiguiente && CALENDARIO_ESTADO.alertaCola.length > 0) {
        setTimeout(mostrarSiguientePopupRecordatorio, 150);
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
    if (!window.APP_STATE || !Array.isArray(APP_STATE.calendario)) return [];
    var ahora = Date.now();
    var alertas = [];

    APP_STATE.calendario.forEach(function(raw) {
        var item = normalizarItemCalendario(raw);
        if (!item) return;

        // 1. Recordatorios cuya hora exacta ya llegó y no han sido completados
        if (item.tipo === 'recordatorio' && !item.completado && item.fecha && item.hora) {
            var targetMs = obtenerFechaHoraMs(item.fecha, item.hora);
            var dueMs = (item.pospuestoHasta && item.pospuestoHasta > targetMs) ? item.pospuestoHasta : targetMs;
            if (!isNaN(dueMs) && ahora >= dueMs) {
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
                        { tipo: 'primary', texto: '✓ Marcar Completado', fn: "completarRecordatorioDesdeNotificacion('" + safeId + "')" },
                        { tipo: 'secondary', texto: '📅 Ver', fn: "cerrarCentroNotificaciones(); irAFechaEnCalendario('" + safeFecha + "', 'mes')" }
                    ],
                    _sortTs: dueMs
                });
            }
        }

        // 2. Avisos previos de Eventos próximos o en curso
        if (item.tipo === 'evento' && !item.completado && !item.avisoDescartado && item.avisoPrevioMin > 0 && item.fecha && item.horaInicio) {
            var startMs = obtenerFechaHoraMs(item.fecha, item.horaInicio);
            var endMs = startMs + ((item.duracionMinutos || 60) * 60000);
            var alertMs = startMs - (Number(item.avisoPrevioMin) * 60000);
            if (!isNaN(startMs) && ahora >= alertMs && ahora <= endMs) {
                var badges = resolverBadgesVinculadosEvento(item.personaIds, item.grupoIds);
                var vincTexto = badges.length > 0 ? (' · ' + badges.map(function(b) { return b.icono + ' ' + b.nombre; }).join(', ')) : '';
                var safeEvId = String(item.id).replace(/'/g, "\\'");
                var safeEvFecha = String(item.fecha).replace(/'/g, "\\'");
                var enCurso = ahora >= startMs;
                alertas.push({
                    id: 'alerta-cal-ev-' + item.id,
                    calId: item.id,
                    tipo: 'info',
                    icono: '📆',
                    badge: enCurso ? 'Evento en Curso' : 'Evento Próximo',
                    color: '#38bdf8',
                    titulo: item.titulo || 'Evento',
                    metaLinea: '🕒 ' + item.horaInicio + (item.horaFin ? '–' + item.horaFin : '') + ' · ' + formatearFechaLegibleCorta(item.fecha) + vincTexto,
                    descripcion: item.descripcion || '',
                    acciones: [
                        { tipo: 'secondary', texto: '✓ Entendido', fn: "descartarAvisoEventoCalendario('" + safeEvId + "')" },
                        { tipo: 'secondary', texto: '📅 Ver', fn: "cerrarCentroNotificaciones(); irAFechaEnCalendario('" + safeEvFecha + "', 'mes')" }
                    ],
                    _sortTs: startMs
                });
            }
        }
    });

    alertas.sort(function(a, b) {
        return (a._sortTs || 0) - (b._sortTs || 0);
    });
    return alertas;
}

function obtenerProximosRecordatoriosHoy() {
    if (!window.APP_STATE || !Array.isArray(APP_STATE.calendario)) return [];
    var hoy = (typeof obtenerClaveFechaLocal === 'function')
        ? obtenerClaveFechaLocal()
        : formatearClaveFecha(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    var ahora = Date.now();
    return obtenerRecordatoriosParaFecha(hoy).filter(function(r) {
        if (r.completado) return false;
        var targetMs = obtenerFechaHoraMs(r.fecha, r.hora);
        var dueMs = (r.pospuestoHasta && r.pospuestoHasta > targetMs) ? r.pospuestoHasta : targetMs;
        return !isNaN(dueMs) && dueMs > ahora;
    }).map(function(r) {
        var per = resolverPersonaPorId(r.personaId, r.personaNombre);
        return {
            id: r.id,
            hora: r.hora,
            titulo: r.titulo,
            personaNombre: per ? per.nombre : ''
        };
    });
}

function completarRecordatorioDesdeNotificacion(id) {
    toggleCompletarEventoCalendario(id);
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
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof renderizarCentroNotificaciones === 'function') renderizarCentroNotificaciones();
}

function programarAlarmasCalendarioNativas() {
    try {
        var plugins = (window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins : null;
        var ln = plugins ? plugins.LocalNotifications : null;
        if (!ln || typeof ln.schedule !== 'function' || !window.APP_STATE || !Array.isArray(APP_STATE.calendario)) return;

        var ahora = Date.now();
        var notifs = [];
        APP_STATE.calendario.forEach(function(item, idx) {
            if (!item || item.tipo !== 'recordatorio' || item.completado || !item.fecha || !item.hora) return;
            var targetMs = obtenerFechaHoraMs(item.fecha, item.hora);
            var dueMs = (item.pospuestoHasta && item.pospuestoHasta > targetMs) ? item.pospuestoHasta : targetMs;
            if (!isNaN(dueMs) && dueMs > ahora + 3000) {
                var per = resolverPersonaPorId(item.personaId, item.personaNombre);
                notifs.push({
                    id: 70000 + (idx % 10000),
                    title: '🔔 ' + (item.titulo || 'Recordatorio'),
                    body: (item.hora || '') + (per ? ' · 👤 ' + per.nombre : '') + (item.descripcion ? ' — ' + item.descripcion : ''),
                    schedule: { at: new Date(dueMs), allowWhileIdle: true },
                    autoCancel: true
                });
            }
        });
        if (notifs.length > 0) {
            ln.schedule({ notifications: notifs }).catch(function() {});
        }
    } catch(e) {}
}
