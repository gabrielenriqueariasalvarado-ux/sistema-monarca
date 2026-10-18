/**
 * SISTEMA MONARCA · MÓDULO DE CALENDARIO
 * Planificación mensual, navegación de fechas, integración de finanzas/rutinas y gestión de eventos locales.
 */

var CALENDARIO_ESTADO = {
    anio: new Date().getFullYear(),
    mes: new Date().getMonth(), // 0 - 11
    diaSeleccionado: new Date().getDate()
};

var MESES_NOMBRES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

var DIAS_SEMANA_NOMBRES = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

/**
 * Genera clave de fecha en formato YYYY-MM-DD
 */
function formatearClaveFecha(anio, mes, dia) {
    var m = (mes + 1).toString().padStart(2, '0');
    var d = dia.toString().padStart(2, '0');
    return anio + '-' + m + '-' + d;
}

/**
 * Renderizado Principal del Calendario del Sistema
 */
function renderizarCalendario() {
    var cont = document.getElementById('contenedor-calendario');
    if (!cont) return;

    if (!APP_STATE.calendario || !Array.isArray(APP_STATE.calendario)) {
        APP_STATE.calendario = [];
    }

    var hoy = new Date();
    var anio = CALENDARIO_ESTADO.anio;
    var mes = CALENDARIO_ESTADO.mes;
    var diaSel = CALENDARIO_ESTADO.diaSeleccionado;

    // Calcular días del mes y desplazamiento
    var primerDiaMes = new Date(anio, mes, 1);
    var diaSemanaInicio = (primerDiaMes.getDay() + 6) % 7; // Lunes = 0, Domingo = 6
    var totalDiasMes = new Date(anio, mes + 1, 0).getDate();
    var totalDiasMesAnterior = new Date(anio, mes, 0).getDate();

    // Asegurar que el día seleccionado exista en el mes actual
    if (diaSel > totalDiasMes) {
        diaSel = totalDiasMes;
        CALENDARIO_ESTADO.diaSeleccionado = diaSel;
    }

    // Encabezado superior con navegación
    var html = `
    <div class="card" style="margin-bottom: 20px;">
        <div class="calendar-top-bar">
            <div class="calendar-nav-controls">
                <button class="calendar-nav-btn" onclick="mesAnteriorCalendario()" title="Mes anterior">◀</button>
                <div class="calendar-title-display">
                    ${MESES_NOMBRES[mes]} ${anio}
                </div>
                <button class="calendar-nav-btn" onclick="mesSiguienteCalendario()" title="Mes siguiente">▶</button>
                <button class="calendar-btn-today" onclick="irAHoyCalendario()">Hoy</button>
            </div>
            <div>
                <button class="btn-system" style="padding: 9px 18px; margin: 0; font-size: 13px;" onclick="abrirModalNuevoEvento()">
                    + Agendar Evento
                </button>
            </div>
        </div>

        <!-- DÍAS DE LA SEMANA -->
        <div class="calendar-weekdays-row">
            <div class="calendar-weekday-cell">LUN</div>
            <div class="calendar-weekday-cell">MAR</div>
            <div class="calendar-weekday-cell">MIÉ</div>
            <div class="calendar-weekday-cell">JUE</div>
            <div class="calendar-weekday-cell">VIE</div>
            <div class="calendar-weekday-cell">SÁB</div>
            <div class="calendar-weekday-cell">DOM</div>
        </div>

        <!-- CUADRÍCULA DE CELDAS DE DÍAS -->
        <div class="calendar-grid-cells">
    `;

    // 1. Días del mes anterior (relleno visual)
    for (var p = diaSemanaInicio - 1; p >= 0; p--) {
        var numDiaPrev = totalDiasMesAnterior - p;
        var prevMesIdx = mes === 0 ? 11 : mes - 1;
        var prevAnioVal = mes === 0 ? anio - 1 : anio;
        html += `
            <div class="calendar-day-cell other-month" onclick="seleccionarOtroMesDia(${prevAnioVal}, ${prevMesIdx}, ${numDiaPrev})">
                <span class="calendar-day-num">${numDiaPrev}</span>
            </div>
        `;
    }

    // 2. Días del mes activo
    for (var d = 1; d <= totalDiasMes; d++) {
        var claveFecha = formatearClaveFecha(anio, mes, d);
        var esHoy = (hoy.getFullYear() === anio && hoy.getMonth() === mes && hoy.getDate() === d);
        var esSeleccionado = (d === diaSel);

        // Buscar eventos en este día
        var eventosDia = APP_STATE.calendario.filter(function(e) {
            return e.fecha === claveFecha;
        });

        // Buscar finanzas recurrentes programadas en este día
        var tieneFinanzas = false;
        if (APP_STATE.finanzas) {
            if (APP_STATE.finanzas.ingresos && APP_STATE.finanzas.ingresos.some(function(i) { return Number(i.dia) === d; })) tieneFinanzas = true;
            if (APP_STATE.finanzas.gastos && APP_STATE.finanzas.gastos.some(function(g) { return Number(g.dia) === d; })) tieneFinanzas = true;
            if (APP_STATE.finanzas.deudas && APP_STATE.finanzas.deudas.some(function(deu) { return Number(deu.dia) === d; })) tieneFinanzas = true;
        }

        // Clases dinámicas
        var clasesCelda = "calendar-day-cell";
        if (esHoy) clasesCelda += " is-today";
        if (esSeleccionado) clasesCelda += " is-selected";

        // Registro de desgaste / rendimiento del avatar para este día
        var regDia = APP_STATE.registroDiarioCalendario ? APP_STATE.registroDiarioCalendario[claveFecha] : null;
        var badgeHtml = "";
        if (regDia && typeof regDia.general === 'number') {
            var valG = Math.round(Number(regDia.general) || 0);
            var badgeCls = "badge-cero";
            if (valG > 0 && valG <= 25) badgeCls = "badge-leve";
            else if (valG > 25 && valG <= 65) badgeCls = "badge-medio";
            else if (valG > 65) badgeCls = "badge-alto";
            badgeHtml = `<span class="calendar-wear-badge ${badgeCls}" title="Desgaste/Carga diaria: ${valG}% (Cuerpo: ${regDia.cuerpo || 0}%, Mente: ${regDia.mente || 0}%)">${valG}%</span>`;
        } else if (esHoy) {
            var valHoy = 0;
            if (typeof calcularMetricasPurasSinActualizar === 'function') {
                valHoy = calcularMetricasPurasSinActualizar().general;
            }
            var bCls = valHoy > 0 ? (valHoy <= 40 ? 'badge-leve' : (valHoy <= 70 ? 'badge-medio' : 'badge-alto')) : 'badge-cero';
            badgeHtml = `<span class="calendar-wear-badge ${bCls}" title="Desgaste acumulado hoy: ${valHoy}%">${valHoy}%</span>`;
        }

        html += `
            <div class="${clasesCelda}" onclick="seleccionarDiaCalendario(${d})">
                <span class="calendar-day-num">${d}</span>
                ${badgeHtml}
                <div class="calendar-dots-container">
        `;

        if (eventosDia.length > 0) {
            html += `<span class="calendar-dot dot-event" title="${eventosDia.length} evento(s)"></span>`;
        }
        if (tieneFinanzas) {
            html += `<span class="calendar-dot dot-finance" title="Movimientos financieros programados"></span>`;
        }

        html += `
                </div>
            </div>
        `;
    }

    // 3. Días del mes siguiente para completar la cuadrícula (múltiplo de 7)
    var celdasUsadas = diaSemanaInicio + totalDiasMes;
    var celdasRestantes = (7 - (celdasUsadas % 7)) % 7;
    for (var n = 1; n <= celdasRestantes; n++) {
        var nextMesIdx = mes === 11 ? 0 : mes + 1;
        var nextAnioVal = mes === 11 ? anio + 1 : anio;
        html += `
            <div class="calendar-day-cell other-month" onclick="seleccionarOtroMesDia(${nextAnioVal}, ${nextMesIdx}, ${n})">
                <span class="calendar-day-num">${n}</span>
            </div>
        `;
    }

    html += `
        </div>

        <!-- BARRA DE LEYENDA -->
        <div class="calendar-legend-bar">
            <div class="calendar-legend-item">
                <span class="calendar-dot dot-event"></span>
                <span>Eventos Agendados</span>
            </div>
            <div class="calendar-legend-item">
                <span class="calendar-dot dot-finance"></span>
                <span>Obligación / Pago Financiero</span>
            </div>
            <div class="calendar-legend-item">
                <span class="calendar-wear-badge badge-medio" style="margin: 0; font-size: 9px; padding: 1px 5px;">45%</span>
                <span>Desgaste / Rendimiento Diario</span>
            </div>
            <div class="calendar-legend-item" style="color: #111827; font-weight: 600;">
                <span>● Día Actual (Hoy)</span>
            </div>
        </div>
    </div>
    `;

    // 4. Panel Inspector de Detalles del Día Seleccionado
    var fechaObj = new Date(anio, mes, diaSel);
    var diaSemanaNombre = DIAS_SEMANA_NOMBRES[(fechaObj.getDay() + 6) % 7];
    var fechaTextoCompleto = diaSemanaNombre + ", " + diaSel + " de " + MESES_NOMBRES[mes] + " de " + anio;
    var claveFechaSel = formatearClaveFecha(anio, mes, diaSel);
    var esHoySel = (hoy.getFullYear() === anio && hoy.getMonth() === mes && hoy.getDate() === diaSel);

    // Obtener métricas de desgaste archivadas o calculadas
    var regSel = (APP_STATE.registroDiarioCalendario && APP_STATE.registroDiarioCalendario[claveFechaSel]) ? APP_STATE.registroDiarioCalendario[claveFechaSel] : null;
    if (!regSel && esHoySel && typeof calcularMetricasPurasSinActualizar === 'function') {
        regSel = calcularMetricasPurasSinActualizar();
    }

    var generalVal = regSel ? (Math.round(Number(regSel.general)) || 0) : 0;
    var cuerpoVal = regSel ? (Math.round(Number(regSel.cuerpo)) || 0) : 0;
    var menteVal = regSel ? (Math.round(Number(regSel.mente)) || 0) : 0;
    var estadoJornada = esHoySel ? "⚡ Jornada en curso (Hoy)" : (regSel ? "✓ Jornada finalizada y archivada" : "Sin registro");

    var eventosDelDia = APP_STATE.calendario.filter(function(e) {
        return e.fecha === claveFechaSel;
    });

    html += `
    <div class="card">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
            <div>
                <span style="font-size: 11.5px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">DETALLE DE JORNADA</span>
                <h3 style="margin: 2px 0 0 0; font-size: 17px; color: #111827;">${fechaTextoCompleto}</h3>
            </div>
            <button class="btn-sync-action btn-sync-dark" onclick="abrirModalNuevoEvento('${claveFechaSel}')">
                + Añadir a este día
            </button>
        </div>

        <!-- TARJETA BALANCE DEL AVATAR (DESGASTE Y RENDIMIENTO DIARIO) -->
        <div class="calendar-day-metrics-card">
            <div class="metrics-card-header">
                <div>
                    <span class="metrics-card-label">BALANCE DEL AVATAR · DESGASTE Y RENDIMIENTO</span>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
                        ${esHoySel ? 'Monitoreo dinámico del día de hoy. Se reinicia a 0% automáticamente a medianoche.' : 'Registro final alcanzado al término de esta jornada.'}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span class="metrics-card-status">${estadoJornada}</span>
                    ${esHoySel ? `
                    <button class="btn-sync-action btn-sync-light" onclick="reiniciarJornadaDiariaManual()" style="font-size: 11px; padding: 5px 10px;" title="Cerrar la jornada actual, guardar porcentaje en el calendario y reiniciar todo a 0% para comenzar de nuevo">
                        🔄 Cerrar & Reiniciar Jornada (0%)
                    </button>
                    ` : ''}
                </div>
            </div>
            <div class="metrics-card-grid">
                <div class="metric-box">
                    <span class="metric-label">Desgaste General</span>
                    <span class="metric-val">${generalVal}%</span>
                    <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: ${generalVal}%;"></div></div>
                </div>
                <div class="metric-box">
                    <span class="metric-label">Carga Física (Cuerpo)</span>
                    <span class="metric-val">${cuerpoVal}%</span>
                    <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: ${cuerpoVal}%;"></div></div>
                </div>
                <div class="metric-box">
                    <span class="metric-label">Carga Neural (Mente)</span>
                    <span class="metric-val">${menteVal}%</span>
                    <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: ${menteVal}%;"></div></div>
                </div>
            </div>
        </div>
    `;

    // Renderizar eventos del usuario
    if (eventosDelDia.length > 0) {
        html += `<div class="calendar-events-container">`;
        eventosDelDia.forEach(function(ev) {
            var iconCat = "📌";
            if (ev.categoria === "Trabajo") iconCat = "💼";
            if (ev.categoria === "Finanzas") iconCat = "💰";
            if (ev.categoria === "Salud") iconCat = "⚡";
            if (ev.categoria === "Misión") iconCat = "⚔️";
            if (ev.categoria === "Personal") iconCat = "🏠";

            var horaStr = ev.hora ? `🕒 ${ev.hora}` : "🕒 Todo el día";
            var completadoClass = ev.completado ? "is-completed" : "";

            html += `
                <div class="calendar-event-card ${completadoClass}">
                    <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1;">
                        <input type="checkbox" ${ev.completado ? "checked" : ""} 
                            style="margin-top: 4px; cursor: pointer; width: 16px; height: 16px;" 
                            onchange="toggleCompletarEventoCalendario('${ev.id}')">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                                <span class="calendar-event-cat-badge">${iconCat} ${ev.categoria || 'General'}</span>
                                <span style="font-size: 12px; color: #6b7280; font-weight: 500;">${horaStr}</span>
                                ${ev.prioridad === 'Alta' ? '<span style="font-size: 10px; font-weight: 700; background: #fee2e2; color: #991b1b; padding: 2px 7px; border-radius: 9999px;">ALTA</span>' : ''}
                            </div>
                            <div class="calendar-event-title-text" style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 2px;">
                                ${ev.titulo}
                            </div>
                            ${ev.notas ? `<p style="margin: 0; font-size: 12.5px; color: #4b5563;">${ev.notas}</p>` : ''}
                        </div>
                    </div>
                    <button onclick="eliminarEventoCalendario('${ev.id}')" title="Eliminar evento" 
                        style="background: transparent; border: none; color: #9ca3af; font-size: 16px; padding: 4px 8px; border-radius: 8px; cursor: pointer;">
                        &times;
                    </button>
                </div>
            `;
        });
        html += `</div>`;
    } else {
        html += `
            <div style="text-align: center; padding: 24px 16px; background: #f9fafb; border-radius: 14px; border: 1px dashed #e5e7eb; margin-top: 10px;">
                <div style="font-size: 28px; margin-bottom: 6px;">📅</div>
                <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px;">Sin eventos agendados</div>
                <p style="margin: 0 0 12px 0; font-size: 12.5px; color: #6b7280;">No tienes compromisos manuales para esta fecha.</p>
                <button class="btn-sync-action btn-sync-light" onclick="abrirModalNuevoEvento('${claveFechaSel}')">
                    + Agendar Compromiso
                </button>
            </div>
        `;
    }

    // Actividades y Automatizaciones del Sistema vinculadas a este día del mes
    var finanzasDia = [];
    if (APP_STATE.finanzas) {
        if (APP_STATE.finanzas.ingresos) {
            APP_STATE.finanzas.ingresos.forEach(function(i) {
                if (Number(i.dia) === diaSel) {
                    finanzasDia.push({ tipo: 'Ingreso', texto: `${i.fuente} (+$${i.monto})`, icon: '💰' });
                }
            });
        }
        if (APP_STATE.finanzas.gastos) {
            APP_STATE.finanzas.gastos.forEach(function(g) {
                if (Number(g.dia) === diaSel) {
                    finanzasDia.push({ tipo: 'Gasto', texto: `${g.concepto} ($${g.monto}) · ${g.categoria}`, icon: '💸' });
                }
            });
        }
        if (APP_STATE.finanzas.deudas) {
            APP_STATE.finanzas.deudas.forEach(function(deu) {
                if (Number(deu.dia) === diaSel) {
                    finanzasDia.push({ tipo: 'Deuda', texto: `Vencimiento cuota: ${deu.nombre} ($${deu.montoTotal})`, icon: '💳' });
                }
            });
        }
    }

    if (finanzasDia.length > 0) {
        html += `
            <div style="margin-top: 20px;">
                <span style="font-size: 11.5px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    SISTEMA FINANCIERO · COMPROMISOS DEL DÍA ${diaSel}
                </span>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
        `;
        finanzasDia.forEach(function(item) {
            html += `
                <div class="calendar-system-activity-item">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>${item.icon}</span>
                        <span style="font-weight: 600;">${item.texto}</span>
                    </div>
                    <span style="font-size: 11px; font-weight: 700; color: #6b7280; background: #f3f4f6; padding: 2px 8px; border-radius: 9999px;">
                        ${item.tipo}
                    </span>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    html += `</div>`; // Fin Card Inspector

    cont.innerHTML = html;
}

/**
 * Navegación: Mes Anterior
 */
function mesAnteriorCalendario() {
    CALENDARIO_ESTADO.mes--;
    if (CALENDARIO_ESTADO.mes < 0) {
        CALENDARIO_ESTADO.mes = 11;
        CALENDARIO_ESTADO.anio--;
    }
    renderizarCalendario();
}

/**
 * Navegación: Mes Siguiente
 */
function mesSiguienteCalendario() {
    CALENDARIO_ESTADO.mes++;
    if (CALENDARIO_ESTADO.mes > 11) {
        CALENDARIO_ESTADO.mes = 0;
        CALENDARIO_ESTADO.anio++;
    }
    renderizarCalendario();
}

/**
 * Navegación: Volver al Día Actual
 */
function irAHoyCalendario() {
    var hoy = new Date();
    CALENDARIO_ESTADO.anio = hoy.getFullYear();
    CALENDARIO_ESTADO.mes = hoy.getMonth();
    CALENDARIO_ESTADO.diaSeleccionado = hoy.getDate();
    renderizarCalendario();
}

/**
 * Selección de día en la cuadrícula activa
 */
function seleccionarDiaCalendario(dia) {
    CALENDARIO_ESTADO.diaSeleccionado = dia;
    renderizarCalendario();
}

/**
 * Selección de día que pertenece al mes anterior o siguiente
 */
function seleccionarOtroMesDia(anio, mes, dia) {
    CALENDARIO_ESTADO.anio = anio;
    CALENDARIO_ESTADO.mes = mes;
    CALENDARIO_ESTADO.diaSeleccionado = dia;
    renderizarCalendario();
}

/**
 * Gestión de Modal de Nuevo Evento
 */
function abrirModalNuevoEvento(fechaPredefinida) {
    var modal = document.getElementById('modal-nuevo-evento');
    if (!modal) return;

    var inputTitulo = document.getElementById('modal-evento-titulo');
    var inputFecha = document.getElementById('modal-evento-fecha');
    var inputHora = document.getElementById('modal-evento-hora');
    var inputCat = document.getElementById('modal-evento-categoria');
    var inputPrio = document.getElementById('modal-evento-prioridad');
    var inputNotas = document.getElementById('modal-evento-notas');

    if (inputTitulo) inputTitulo.value = '';
    if (inputHora) inputHora.value = '';
    if (inputCat) inputCat.value = 'General';
    if (inputPrio) inputPrio.value = 'Normal';
    if (inputNotas) inputNotas.value = '';

    if (inputFecha) {
        if (fechaPredefinida) {
            inputFecha.value = fechaPredefinida;
        } else {
            inputFecha.value = formatearClaveFecha(
                CALENDARIO_ESTADO.anio,
                CALENDARIO_ESTADO.mes,
                CALENDARIO_ESTADO.diaSeleccionado
            );
        }
    }

    modal.style.display = 'flex';
    if (inputTitulo) setTimeout(function() { inputTitulo.focus(); }, 100);
}

function cerrarModalNuevoEvento() {
    var modal = document.getElementById('modal-nuevo-evento');
    if (modal) modal.style.display = 'none';
}

/**
 * Guardar Evento Nuevo en LocalStorage
 */
function guardarNuevoEvento() {
    var inputTitulo = document.getElementById('modal-evento-titulo');
    var inputFecha = document.getElementById('modal-evento-fecha');
    var inputHora = document.getElementById('modal-evento-hora');
    var inputCat = document.getElementById('modal-evento-categoria');
    var inputPrio = document.getElementById('modal-evento-prioridad');
    var inputNotas = document.getElementById('modal-evento-notas');

    var titulo = inputTitulo ? inputTitulo.value.trim() : '';
    var fecha = inputFecha ? inputFecha.value : '';
    var hora = inputHora ? inputHora.value : '';
    var categoria = inputCat ? inputCat.value : 'General';
    var prioridad = inputPrio ? inputPrio.value : 'Normal';
    var notas = inputNotas ? inputNotas.value.trim() : '';

    if (!titulo) {
        alert("Por favor ingresa un título para el evento.");
        if (inputTitulo) inputTitulo.focus();
        return;
    }

    if (!fecha) {
        alert("Por favor selecciona una fecha válida.");
        return;
    }

    if (!APP_STATE.calendario) {
        APP_STATE.calendario = [];
    }

    var nuevoEvento = {
        id: 'EVT-' + Date.now(),
        titulo: titulo,
        fecha: fecha,
        hora: hora || null,
        categoria: categoria,
        prioridad: prioridad,
        notas: notas,
        completado: false,
        timestamp: Date.now()
    };

    APP_STATE.calendario.push(nuevoEvento);
    MonarcaDB.save(APP_STATE);

    // Sincronizar vista del calendario con la fecha del nuevo evento
    var partes = fecha.split('-');
    if (partes.length === 3) {
        CALENDARIO_ESTADO.anio = parseInt(partes[0], 10);
        CALENDARIO_ESTADO.mes = parseInt(partes[1], 10) - 1;
        CALENDARIO_ESTADO.diaSeleccionado = parseInt(partes[2], 10);
    }

    cerrarModalNuevoEvento();
    renderizarCalendario();
}

/**
 * Alternar estado completado / pendiente de un evento
 */
function toggleCompletarEventoCalendario(id) {
    if (!APP_STATE.calendario) return;
    var ev = APP_STATE.calendario.find(function(item) {
        return item.id === id;
    });
    if (ev) {
        ev.completado = !ev.completado;
        MonarcaDB.save(APP_STATE);
        renderizarCalendario();
    }
}

/**
 * Eliminar un evento del calendario
 */
function eliminarEventoCalendario(id) {
    if (!confirm("¿Deseas eliminar este evento del calendario?")) return;
    if (!APP_STATE.calendario) return;

    APP_STATE.calendario = APP_STATE.calendario.filter(function(item) {
        return item.id !== id;
    });

    MonarcaDB.save(APP_STATE);
    renderizarCalendario();
}
