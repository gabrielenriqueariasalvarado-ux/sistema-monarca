/**
 * SISTEMA MONARCA · MÓDULO DE DINÁMICAS SEMANALES, LABORES Y AGENDA DE PERSONAS
 * 1. Gestión y Categorización de Labores (Dev, Personal Trainer, Barbero, etc.)
 * 2. Directorio de Personas, Agenda de Conversaciones y Categorías de Ubicación
 * 3. Ruleta de Variabilidad Semanal (Comidas, Vestimenta y Selección de Música)
 */

// ==========================================================================
// 1. GESTIÓN Y CATEGORIZACIÓN DE LABORES (SUB-APPS OFICIALES Y ANALÍTICA)
// ==========================================================================

const LABORES_OFICIALES = [
    {
        id: "LAB-BOOM",
        nombre: "Boom Solutions",
        icono: "🚀",
        descripcion: "Desarrollo tecnológico, software a medida, automatizaciones y proyectos de innovación digital.",
        color: "#6366f1",
        tagline: "Sub-App Tecnológica"
    },
    {
        id: "LAB-BARBER",
        nombre: "Barbería",
        icono: "💈",
        descripcion: "Cortes, estilismo masculino, afeitado clásico, asesoría de imagen y atención a clientes.",
        color: "#38bdf8",
        tagline: "Sub-App Estilismo & Cortes"
    },
    {
        id: "LAB-TRAINER",
        nombre: "Personal Trainer",
        icono: "🏋️‍♂️",
        descripcion: "Entrenamientos personalizados, acondicionamiento físico, nutrición y asesorías deportivas.",
        color: "#10b981",
        tagline: "Sub-App Fitness & Salud"
    }
];

var MES_LABORES_ACTUAL = null; // "YYYY-MM"
var METRICA_LABORES_ACTIVA = 'horas'; // 'horas' | 'dinero' | 'jornada'
var FILTRO_HISTORIAL_LABOR = 'TODAS';
var _CHART_LABORES_INSTANCE = null;

function asegurarEstructuraLabores() {
    if (!APP_STATE) return;

    // Normalizar categorías a las 3 oficiales
    if (!Array.isArray(APP_STATE.categoriasLabores) || APP_STATE.categoriasLabores.length === 0) {
        APP_STATE.categoriasLabores = JSON.parse(JSON.stringify(LABORES_OFICIALES));
    } else {
        LABORES_OFICIALES.forEach(function(oficial) {
            var idx = APP_STATE.categoriasLabores.findIndex(function(c) { return c.id === oficial.id; });
            if (idx === -1) {
                APP_STATE.categoriasLabores.push(JSON.parse(JSON.stringify(oficial)));
            } else {
                APP_STATE.categoriasLabores[idx].nombre = oficial.nombre;
                APP_STATE.categoriasLabores[idx].icono = oficial.icono;
                APP_STATE.categoriasLabores[idx].color = oficial.color;
                APP_STATE.categoriasLabores[idx].tagline = oficial.tagline;
            }
        });
        var idsValidos = LABORES_OFICIALES.map(function(o) { return o.id; });
        APP_STATE.categoriasLabores = APP_STATE.categoriasLabores.filter(function(c) {
            return idsValidos.includes(c.id);
        });
    }

    if (!Array.isArray(APP_STATE.registrosLabores)) {
        APP_STATE.registrosLabores = [];
    }

    // Migración de registros antiguos (LAB-DEV o nombres previos a LAB-BOOM)
    APP_STATE.registrosLabores.forEach(function(r) {
        if (!r.laborId || r.laborId === 'LAB-DEV' || r.laborId.indexOf('DEV') !== -1) {
            r.laborId = 'LAB-BOOM';
        } else if (r.laborId.indexOf('BARBER') !== -1) {
            r.laborId = 'LAB-BARBER';
        } else if (r.laborId.indexOf('TRAIN') !== -1) {
            r.laborId = 'LAB-TRAINER';
        }
    });

    if (!MES_LABORES_ACTUAL) {
        var hoy = new Date();
        var y = hoy.getFullYear();
        var m = String(hoy.getMonth() + 1).padStart(2, '0');
        MES_LABORES_ACTUAL = y + '-' + m;
    }
}

function normalizarMesRegistroLabor(fechaStr) {
    if (!fechaStr) return '';
    fechaStr = String(fechaStr).trim();
    if (fechaStr.indexOf('-') !== -1) {
        var partes = fechaStr.split('-');
        if (partes.length >= 2 && partes[0].length === 4) {
            return partes[0] + '-' + partes[1].padStart(2, '0');
        }
    }
    if (fechaStr.indexOf('/') !== -1) {
        var partesD = fechaStr.split('/');
        if (partesD.length === 3) {
            var anio = partesD[2].length === 4 ? partesD[2] : ('20' + partesD[2]);
            var mes = partesD[1].padStart(2, '0');
            return anio + '-' + mes;
        }
    }
    return '';
}

function formatearNombreMesLabor(mesClave) {
    if (!mesClave || mesClave.indexOf('-') === -1) return mesClave || '';
    var partes = mesClave.split('-');
    var anio = partes[0];
    var mesNum = parseInt(partes[1], 10);
    var nombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    var nombreMes = nombres[mesNum - 1] || partes[1];
    return nombreMes + " " + anio;
}

function cambiarMesLabores(delta) {
    asegurarEstructuraLabores();
    var partes = MES_LABORES_ACTUAL.split('-');
    var anio = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10);

    mes += delta;
    if (mes > 12) {
        mes = 1;
        anio++;
    } else if (mes < 1) {
        mes = 12;
        anio--;
    }
    MES_LABORES_ACTUAL = anio + '-' + String(mes).padStart(2, '0');
    renderizarLabores();
}

function cambiarMetricaGraficaLabores(metrica) {
    METRICA_LABORES_ACTIVA = metrica;
    var btnH = document.getElementById('tab-lab-chart-horas');
    var btnD = document.getElementById('tab-lab-chart-dinero');
    var btnJ = document.getElementById('tab-lab-chart-jornada');
    if (btnH) btnH.classList.toggle('active', metrica === 'horas');
    if (btnD) btnD.classList.toggle('active', metrica === 'dinero');
    if (btnJ) btnJ.classList.toggle('active', metrica === 'jornada');

    renderizarGraficaLabores();
}

function filtrarHistorialLabores(laborId) {
    FILTRO_HISTORIAL_LABOR = laborId;
    renderizarHistorialLabores();
}

function cargarLabores() {
    asegurarEstructuraLabores();
    renderizarLabores();
}

function renderizarLabores() {
    asegurarEstructuraLabores();

    var contEstadisticas = document.getElementById('contenedor-estadisticas-labores');
    var contCategorias = document.getElementById('contenedor-categorias-labores');

    var registros = APP_STATE.registrosLabores || [];
    var registrosMes = registros.filter(function(r) {
        return normalizarMesRegistroLabor(r.fecha) === MES_LABORES_ACTUAL;
    });

    var totalHorasMes = 0;
    var totalDineroMes = 0;
    registrosMes.forEach(function(r) {
        totalHorasMes += (Number(r.horas) || 0);
        totalDineroMes += (Number(r.honorarios) || 0);
    });
    var totalSesionesMes = registrosMes.length;
    var promedioJornadaMes = totalSesionesMes > 0 ? (totalHorasMes / totalSesionesMes) : 0;

    // 1. Selector de Mes y Tarjetas de Métricas Mensuales
    if (contEstadisticas) {
        contEstadisticas.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
            <div class="mes-selector-pill">
                <button type="button" class="btn-mes-nav" onclick="cambiarMesLabores(-1)" title="Mes Anterior">◀</button>
                <span>📅 ${formatearNombreMesLabor(MES_LABORES_ACTUAL)}</span>
                <button type="button" class="btn-mes-nav" onclick="cambiarMesLabores(1)" title="Mes Siguiente">▶</button>
            </div>
            <div style="font-size: 11.5px; color: #94a3b8;">
                Mostrando métricas calculadas para este período
            </div>
        </div>

        <div class="operatividad-metrics-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
            <div class="metric-card-ideas" style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px 16px; border-radius: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 11px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.5px;">Horas del Mes</span>
                    <span style="font-size: 16px;">⏱️</span>
                </div>
                <div class="metric-num" style="color: #f8fafc; font-size: 24px; font-weight: 800;">${totalHorasMes.toFixed(1)} <span style="font-size: 13px; color: #94a3b8; font-weight: 600;">hrs</span></div>
                <div class="metric-title" style="color: #64748b; font-size: 11.5px; margin-top: 4px;">Dedicación acumulada</div>
            </div>

            <div class="metric-card-ideas" style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px 16px; border-radius: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 11px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.5px;">Dinero Generado</span>
                    <span style="font-size: 16px;">💵</span>
                </div>
                <div class="metric-num" style="color: #10b981; font-size: 24px; font-weight: 800;">$${totalDineroMes.toFixed(2)}</div>
                <div class="metric-title" style="color: #64748b; font-size: 11.5px; margin-top: 4px;">Honorarios de labores</div>
            </div>

            <div class="metric-card-ideas" style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px 16px; border-radius: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">Jornada Promedio</span>
                    <span style="font-size: 16px;">⏳</span>
                </div>
                <div class="metric-num" style="color: #38bdf8; font-size: 24px; font-weight: 800;">${promedioJornadaMes.toFixed(1)} <span style="font-size: 13px; color: #94a3b8; font-weight: 600;">hrs/ses</span></div>
                <div class="metric-title" style="color: #64748b; font-size: 11.5px; margin-top: 4px;">Duración media de sesión</div>
            </div>

            <div class="metric-card-ideas" style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px 16px; border-radius: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px;">Sesiones del Mes</span>
                    <span style="font-size: 16px;">🎯</span>
                </div>
                <div class="metric-num" style="color: #f8fafc; font-size: 24px; font-weight: 800;">${totalSesionesMes}</div>
                <div class="metric-title" style="color: #64748b; font-size: 11.5px; margin-top: 4px;">Registros de actividad</div>
            </div>
        </div>`;
    }

    // 2. Gráfica mensual
    renderizarGraficaLabores();

    // 3. Renderizar las 3 Sub-Apps de Labores Oficiales
    if (contCategorias) {
        var htmlCat = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">';

        LABORES_OFICIALES.forEach(function(lab) {
            var regsLabMes = registrosMes.filter(function(r) { return r.laborId === lab.id; });
            var hLab = 0;
            var dLab = 0;
            regsLabMes.forEach(function(r) {
                hLab += (Number(r.horas) || 0);
                dLab += (Number(r.honorarios) || 0);
            });
            var sesionesLab = regsLabMes.length;
            var jLab = sesionesLab > 0 ? (hLab / sesionesLab) : 0;
            var pctHoras = totalHorasMes > 0 ? Math.round((hLab / totalHorasMes) * 100) : 0;

            htmlCat += `
            <div class="subapp-labor-card" style="border-top: 3px solid ${lab.color};">
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; font-size: 22px; border: 1px solid rgba(255,255,255,0.06);">
                            ${lab.icono}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <strong style="font-size: 14.5px; color: #f8fafc;">${lab.nombre}</strong>
                            </div>
                            <span class="subapp-badge" style="color: ${lab.color}; border-color: ${lab.color}44;">${lab.tagline || 'Sub-App Oficial'}</span>
                        </div>
                    </div>
                    <span class="item-badge-pill" style="font-size: 11px; font-weight: 800; background: rgba(255, 255, 255, 0.05); color: #f8fafc; border: 1px solid rgba(255,255,255,0.08);">
                        ${hLab.toFixed(1)} hrs
                    </span>
                </div>

                <p style="margin: 0 0 14px 0; font-size: 12px; color: #94a3b8; line-height: 1.45;">${lab.descripcion}</p>

                <!-- Resumen Mensual de la Sub-App -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #0b0e15; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 6px; margin-bottom: 12px; text-align: center;">
                    <div>
                        <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Dedicación</div>
                        <div style="font-size: 13px; font-weight: 800; color: #f8fafc; margin-top: 1px;">${hLab.toFixed(1)}h</div>
                    </div>
                    <div>
                        <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Dinero</div>
                        <div style="font-size: 13px; font-weight: 800; color: #10b981; margin-top: 1px;">$${dLab.toFixed(0)}</div>
                    </div>
                    <div>
                        <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Jornada</div>
                        <div style="font-size: 13px; font-weight: 800; color: #38bdf8; margin-top: 1px;">${jLab.toFixed(1)}h</div>
                    </div>
                </div>

                <!-- Barra de cuota mensual -->
                <div style="margin-bottom: 14px;">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">
                        <span>Participación del Mes</span>
                        <span style="color: ${lab.color};">${pctHoras}%</span>
                    </div>
                    <div class="attr-progress-track" style="height: 6px; background: rgba(255,255,255,0.08); border-radius: 9999px;">
                        <div class="attr-progress-fill" style="width: ${pctHoras}%; background: ${lab.color}; border-radius: 9999px;"></div>
                    </div>
                </div>

                <button type="button" class="btn-system" onclick="abrirModalRegistroJornada('${lab.id}')" style="width: 100%; justify-content: center; padding: 9px; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #f8fafc; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                    ⚡ Registrar Sesión en ${lab.nombre}
                </button>
            </div>`;
        });

        htmlCat += '</div>';
        contCategorias.innerHTML = htmlCat;
    }

    // 4. Renderizar Historial de Sesiones con filtros
    renderizarHistorialLabores();
}

function renderizarGraficaLabores() {
    var canvas = document.getElementById('chart-analisis-labores');
    if (!canvas || typeof Chart === 'undefined') return;

    var registros = APP_STATE.registrosLabores || [];
    var registrosMes = registros.filter(function(r) {
        return normalizarMesRegistroLabor(r.fecha) === MES_LABORES_ACTUAL;
    });

    var labels = LABORES_OFICIALES.map(function(l) { return l.icono + ' ' + l.nombre; });
    var colores = LABORES_OFICIALES.map(function(l) { return l.color; });

    var dataValores = [];
    var datasetLabel = '';
    var tooltipUnit = '';

    if (METRICA_LABORES_ACTIVA === 'horas') {
        datasetLabel = 'Horas Dedicadas en el Mes';
        tooltipUnit = ' hrs';
        dataValores = LABORES_OFICIALES.map(function(l) {
            var sum = 0;
            registrosMes.forEach(function(r) {
                if (r.laborId === l.id) sum += (Number(r.horas) || 0);
            });
            return Number(sum.toFixed(1));
        });
    } else if (METRICA_LABORES_ACTIVA === 'dinero') {
        datasetLabel = 'Dinero / Honorarios Generados ($)';
        tooltipUnit = ' $';
        dataValores = LABORES_OFICIALES.map(function(l) {
            var sum = 0;
            registrosMes.forEach(function(r) {
                if (r.laborId === l.id) sum += (Number(r.honorarios) || 0);
            });
            return Number(sum.toFixed(2));
        });
    } else if (METRICA_LABORES_ACTIVA === 'jornada') {
        datasetLabel = 'Tiempo de Jornada Promedio (hrs/sesión)';
        tooltipUnit = ' hrs/ses';
        dataValores = LABORES_OFICIALES.map(function(l) {
            var sumH = 0;
            var cnt = 0;
            registrosMes.forEach(function(r) {
                if (r.laborId === l.id) {
                    sumH += (Number(r.horas) || 0);
                    cnt++;
                }
            });
            return cnt > 0 ? Number((sumH / cnt).toFixed(2)) : 0;
        });
    }

    if (_CHART_LABORES_INSTANCE) {
        _CHART_LABORES_INSTANCE.destroy();
        _CHART_LABORES_INSTANCE = null;
    }

    var ctx = canvas.getContext('2d');
    _CHART_LABORES_INSTANCE = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: datasetLabel,
                data: dataValores,
                backgroundColor: colores.map(function(c) { return c + 'CC'; }),
                borderColor: colores,
                borderWidth: 2,
                borderRadius: 8,
                barPercentage: 0.55
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return (context.dataset.label || '') + ': ' + (METRICA_LABORES_ACTIVA === 'dinero' ? '$' : '') + context.raw + (METRICA_LABORES_ACTIVA !== 'dinero' ? tooltipUnit : '');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.06)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#f8fafc',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            }
        }
    });
}

function renderizarHistorialLabores() {
    var contFiltros = document.getElementById('filtro-labores-historial');
    var contRegistros = document.getElementById('contenedor-registros-labores');
    if (!contRegistros) return;

    if (contFiltros) {
        var htmlFiltros = `
        <button type="button" class="btn-labor-filter ${FILTRO_HISTORIAL_LABOR === 'TODAS' ? 'active' : ''}" onclick="filtrarHistorialLabores('TODAS')">
            Todas
        </button>`;
        LABORES_OFICIALES.forEach(function(l) {
            htmlFiltros += `
            <button type="button" class="btn-labor-filter ${FILTRO_HISTORIAL_LABOR === l.id ? 'active' : ''}" onclick="filtrarHistorialLabores('${l.id}')">
                ${l.icono} ${l.nombre}
            </button>`;
        });
        contFiltros.innerHTML = htmlFiltros;
    }

    var registros = APP_STATE.registrosLabores || [];

    var filtrados = registros.filter(function(r) {
        var coincideMes = normalizarMesRegistroLabor(r.fecha) === MES_LABORES_ACTUAL;
        var coincideLabor = (FILTRO_HISTORIAL_LABOR === 'TODAS') || (r.laborId === FILTRO_HISTORIAL_LABOR);
        return coincideMes && coincideLabor;
    });

    if (filtrados.length === 0) {
        contRegistros.innerHTML = `
        <div style="color: #64748b; text-align: center; padding: 24px 16px; background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 12px;">
            <span style="font-size: 26px; display: block; margin-bottom: 8px;">📋</span>
            No hay sesiones registradas en <strong>${formatearNombreMesLabor(MES_LABORES_ACTUAL)}</strong> para este filtro.<br>
            <span style="font-size: 11.5px; color: #475569;">Pulsa "⚡ Registrar Sesión de Labor" para añadir tu jornada diaria.</span>
        </div>`;
        return;
    }

    var htmlReg = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    filtrados.forEach(function(r) {
        var catInfo = LABORES_OFICIALES.find(function(c) { return c.id === r.laborId; }) || { nombre: "Labor", icono: "💼", color: "#6366f1" };

        htmlReg += `
        <div style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); border-left: 4px solid ${catInfo.color}; border-radius: 12px; padding: 13px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 220px;">
                <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; font-size: 18px; border: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;">
                    ${catInfo.icono}
                </div>
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px; flex-wrap: wrap;">
                        <strong style="color: #f8fafc; font-size: 13.5px;">${catInfo.nombre}</strong>
                        <span class="item-badge-pill" style="font-size: 11px; background: rgba(255, 255, 255, 0.05); color: #38bdf8; font-weight: 700; border: 1px solid rgba(56, 189, 248, 0.2);">
                            ⏱️ ${Number(r.horas).toFixed(1)} hrs
                        </span>
                        ${Number(r.honorarios) > 0 ? `<span class="item-badge-pill" style="font-size: 11px; background: rgba(16, 185, 129, 0.1); color: #34d399; font-weight: 800; border: 1px solid rgba(16, 185, 129, 0.25);">+$${Number(r.honorarios).toFixed(2)}</span>` : ''}
                    </div>
                    <p style="margin: 0; font-size: 12.5px; color: #cbd5e1; line-height: 1.4;">${r.descripcion}</p>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-left: auto;">
                <span style="font-size: 12px; color: #64748b; font-weight: 600;">📅 ${r.fecha}</span>
                <button onclick="eliminarRegistroLabor('${r.id}')" title="Eliminar sesión" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; border-radius: 6px; cursor: pointer; padding: 5px 8px; font-size: 12px; transition: all 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'">
                    🗑️
                </button>
            </div>
        </div>`;
    });
    htmlReg += '</div>';
    contRegistros.innerHTML = htmlReg;
}

function abrirModalRegistroJornada(laborIdOpt) {
    var m = document.getElementById('modal-registro-jornada-labor');
    if (!m) return;
    actualizarSelectsLabores();

    if (laborIdOpt) {
        var sel = document.getElementById('select-reg-labor-id');
        if (sel) sel.value = laborIdOpt;
    }

    var inFecha = document.getElementById('input-reg-labor-fecha');
    if (inFecha) {
        inFecha.value = new Date().toISOString().split('T')[0];
    }

    var inHor = document.getElementById('input-reg-labor-horas');
    if (inHor) inHor.value = "2.0";

    var inHon = document.getElementById('input-reg-labor-honorarios');
    if (inHon) inHon.value = "0";

    var inDesc = document.getElementById('input-reg-labor-desc');
    if (inDesc) inDesc.value = "";

    document.body.classList.add('modal-open');
    m.style.display = 'flex';
}

function cerrarModalRegistroJornada() {
    var m = document.getElementById('modal-registro-jornada-labor');
    if (m) m.style.display = 'none';
    document.body.classList.remove('modal-open');
}

function actualizarSelectsLabores() {
    var sel = document.getElementById('select-reg-labor-id');
    if (!sel) return;
    sel.innerHTML = '';
    LABORES_OFICIALES.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.innerText = (c.icono || '💼') + ' ' + c.nombre;
        sel.appendChild(opt);
    });
}

function guardarRegistroJornada() {
    var inLab = document.getElementById('select-reg-labor-id');
    var inFecha = document.getElementById('input-reg-labor-fecha');
    var inHor = document.getElementById('input-reg-labor-horas');
    var inDesc = document.getElementById('input-reg-labor-desc');
    var inHon = document.getElementById('input-reg-labor-honorarios');

    var laborId = inLab ? inLab.value : '';
    var fechaVal = inFecha && inFecha.value ? inFecha.value : new Date().toISOString().split('T')[0];
    var horas = inHor ? (Number(inHor.value) || 0) : 0;
    var desc = inDesc ? inDesc.value.trim() : '';
    var hon = inHon ? (Number(inHon.value) || 0) : 0;

    if (!laborId) { alert("Selecciona una labor."); return; }
    if (horas <= 0) { alert("Ingresa las horas dedicadas (mínimo 0.25 hrs)."); if (inHor) inHor.focus(); return; }
    if (!desc) { alert("Ingresa una breve descripción de lo realizado en la jornada."); if (inDesc) inDesc.focus(); return; }

    if (!APP_STATE.registrosLabores) APP_STATE.registrosLabores = [];

    var nuevo = {
        id: "REG-LAB-" + Date.now(),
        laborId: laborId,
        fecha: fechaVal,
        horas: horas,
        descripcion: desc,
        honorarios: hon,
        timestamp: Date.now()
    };

    APP_STATE.registrosLabores.unshift(nuevo);
    if (typeof sumarExp === 'function') {
        sumarExp(Math.round(horas * 10));
    }

    if (hon > 0 && APP_STATE.finanzas) {
        if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];
        var catInfo = LABORES_OFICIALES.find(function(c) { return c.id === laborId; }) || { nombre: "Labor" };
        var diaNum = 1;
        try {
            diaNum = parseInt(fechaVal.split('-')[2], 10) || new Date().getDate();
        } catch(e) {
            diaNum = new Date().getDate();
        }

        APP_STATE.finanzas.ingresos.push({
            id: "ING-LAB-" + nuevo.id,
            fuente: "Labor: " + catInfo.nombre + (desc ? " - " + desc : ""),
            tipo: 'labor',
            categoria: "Labores & Servicios",
            monto: hon,
            fecha: fechaVal,
            dia: diaNum,
            cobrado: true,
            laborId: nuevo.id
        });
        if (typeof renderizarFinanzasSiActivo === 'function') renderizarFinanzasSiActivo();
    }

    MonarcaDB.save(APP_STATE);

    var mesReg = normalizarMesRegistroLabor(fechaVal);
    if (mesReg) MES_LABORES_ACTUAL = mesReg;

    cerrarModalRegistroJornada();
    renderizarLabores();
    alert("💼 Sesión laboral registrada exitosamente (+ " + Math.round(horas * 10) + " EXP" + (hon > 0 ? `, +$${hon.toFixed(2)} sincronizado en Finanzas` : '') + ").");
}

function eliminarRegistroLabor(id) {
    if (!confirm("¿Deseas eliminar este registro de sesión laboral?")) return;
    if (!APP_STATE.registrosLabores) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('registrosLabores', id);
    }
    APP_STATE.registrosLabores = APP_STATE.registrosLabores.filter(function(r) { return r.id !== id; });

    if (APP_STATE.finanzas && Array.isArray(APP_STATE.finanzas.ingresos)) {
        APP_STATE.finanzas.ingresos = APP_STATE.finanzas.ingresos.filter(function(ig) {
            return ig.laborId !== id && ig.id !== ('ING-LAB-' + id);
        });
    }

    MonarcaDB.save(APP_STATE);
    renderizarLabores();
    if (typeof renderizarFinanzasSiActivo === 'function') renderizarFinanzasSiActivo();
}


// ==========================================================================
// 2. DIRECTORIO DE PERSONAS & AGENDA DE CONVERSACIONES CON UBICACIONES
// ==========================================================================

var FILTRO_UBICACION_PERSONAS = "TODAS";

function cargarAgendaPersonas() {
    renderizarAgendaPersonas();
}

function filtrarPersonasPorUbicacion(ubicacion, btn) {
    FILTRO_UBICACION_PERSONAS = ubicacion;
    var btns = document.querySelectorAll('.btn-tab-ubi');
    btns.forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderizarAgendaPersonas();
}

function renderizarAgendaPersonas() {
    var cont = document.getElementById('contenedor-agenda-personas-grid');
    var bannerResumen = document.getElementById('contenedor-resumen-personas');
    if (!cont && !bannerResumen) return;

    if (!APP_STATE.agendaPersonas || !Array.isArray(APP_STATE.agendaPersonas)) {
        APP_STATE.agendaPersonas = [];
    }
    var personas = APP_STATE.agendaPersonas;

    // Métricas
    var totalTemas = 0;
    var temasResueltos = 0;
    personas.forEach(function(p) {
        (p.temasPendientes || []).forEach(function(t) {
            totalTemas++;
            if (t.hecho) temasResueltos++;
        });
    });

    if (bannerResumen) {
        bannerResumen.innerHTML = `
        <div class="weekly-review-banner">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
                <div>
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Gestión de Relaciones & Contactos</div>
                    <h3 style="margin: 2px 0 0 0; font-size: 16px; font-weight: 800; color: #f8fafc;">Directorio de Conversaciones Pendientes</h3>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="item-badge-pill" style="font-weight: 800; background: #111827; color: #ffffff;">${personas.length} Contactos</span>
                    <span class="item-badge-pill" style="font-weight: 800; background: rgba(255, 255, 255, 0.05); color: #f8fafc;">${temasResueltos}/${totalTemas} Temas Tratados</span>
                </div>
            </div>
            <p style="margin: 0; font-size: 12.5px; color: #94a3b8;">
                Ten claridad de los temas a tratar con cada persona y planifica el lugar proyectado donde las encontrarás (barbería, gimnasio, café o llamada).
            </p>
        </div>`;
    }

    if (!cont) return;

    var filtradas = personas;
    if (FILTRO_UBICACION_PERSONAS !== "TODAS") {
        filtradas = personas.filter(function(p) {
            return p.ubicacionCategoria === FILTRO_UBICACION_PERSONAS;
        });
    }

    if (filtradas.length === 0) {
        cont.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 28px 16px; background: #0b0e15; border: 1px dashed #d1d5db; border-radius: 12px;">
            <p style="margin: 0; color: #6b7280; font-size: 13.5px;">No hay personas registradas con esta ubicación proyectada.</p>
            <button class="btn-system" style="margin-top: 12px; font-size: 12.5px;" onclick="abrirModalNuevaPersona()">+ Agregar Contacto y Temas</button>
        </div>`;
        return;
    }

    var html = '';
    filtradas.forEach(function(p) {
        var temasHtml = (p.temasPendientes || []).map(function(t) {
            var checkState = t.hecho ? 'checked' : '';
            var textStyle = t.hecho ? 'text-decoration: line-through; color: #9ca3af;' : 'color: #f8fafc;';
            return `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 0; border-bottom: 1px dashed #f3f4f6;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12.5px; ${textStyle}">
                    <input type="checkbox" ${checkState} onchange="toggleTemaPersona('${p.id}', '${t.id}')" style="cursor: pointer; width: 15px; height: 15px; accent-color: #f8fafc;">
                    <span>${t.texto}</span>
                </label>
                <button onclick="eliminarTemaPersona('${p.id}', '${t.id}')" title="Quitar tema" style="background:none; border:none; color:#d1d5db; cursor:pointer; font-size:12px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#d1d5db'">✕</button>
            </div>`;
        }).join('');

        var estadoColor = p.estado === 'Conversado' ? '#059669' : (p.estado === 'Agendado' ? '#2563eb' : '#4b5563');
        var estadoBg = p.estado === 'Conversado' ? '#ecfdf5' : (p.estado === 'Agendado' ? '#eff6ff' : '#f3f4f6');

        html += `
        <div class="knowledge-card">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
                <div>
                    <span class="knowledge-area-tag" style="background: #111827; color: #ffffff;">${p.ubicacionCategoria || '📍 Ubicación'}</span>
                    <h4 class="knowledge-title">${p.nombre}</h4>
                    <span style="font-size: 11.5px; color: #6b7280; font-weight: 600;">${p.rol || 'Contacto'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button onclick="eliminarPersonaAgenda('${p.id}')" title="Eliminar persona" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 2px 6px; font-size: 13px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#9ca3af'">🗑️</button>
                </div>
            </div>

            <div style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 8px 10px; margin-bottom: 10px; font-size: 12px; color: #cbd5e1;">
                <strong>📍 Lugar Proyectado:</strong> ${p.lugarProyectado || 'Por definir'}
                ${p.fechaObjetivo ? ` · <span style="color: #6b7280;">📅 ${p.fechaObjetivo}</span>` : ''}
            </div>

            <div style="margin-bottom: 12px; flex-grow: 1;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6b7280; margin-bottom: 6px;">
                    Temas a Tratar (${(p.temasPendientes || []).filter(function(t){ return !t.hecho; }).length} pendientes):
                </div>
                <div style="display: flex; flex-direction: column; gap: 3px; max-height: 140px; overflow-y: auto;">
                    ${temasHtml || '<span style="font-size: 12px; color: #9ca3af;">Sin temas anotados.</span>'}
                </div>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <input type="text" id="input-nuevo-tema-${p.id}" placeholder="+ Agregar tema..." class="finanzas-input-clean" style="padding: 5px 10px; font-size: 12px; width: 100%; border-radius: 8px;" onkeydown="if(event.key==='Enter'){agregarTemaDirecto('${p.id}');}">
                    <button class="btn-sheet-action" style="padding: 4px 10px; font-size: 12px;" onclick="agregarTemaDirecto('${p.id}')">OK</button>
                </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f3f4f6; padding-top: 10px; flex-wrap: wrap; gap: 8px;">
                <span class="item-badge-pill" style="background: ${estadoBg}; color: ${estadoColor}; font-weight: 700; font-size: 11px;">
                    ${p.estado || 'Pendiente'}
                </span>
                <div style="display: flex; gap: 4px;">
                    <button class="btn-sheet-action" style="font-size: 11px; padding: 4px 8px;" onclick="cambiarEstadoPersona('${p.id}', 'Agendado')">📅 Agendar</button>
                    <button class="btn-sheet-action" style="font-size: 11px; padding: 4px 8px; background: #ecfdf5; color: #059669; border-color: #a7f3d0;" onclick="cambiarEstadoPersona('${p.id}', 'Conversado')">✓ Conversado</button>
                </div>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function toggleTemaPersona(personaId, temaId) {
    var p = (APP_STATE.agendaPersonas || []).find(function(item) { return item.id === personaId; });
    if (!p) return;
    var t = (p.temasPendientes || []).find(function(item) { return item.id === temaId; });
    if (!t) return;
    t.hecho = !t.hecho;
    if (t.hecho) sumarExp(5);
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
}

function agregarTemaDirecto(personaId) {
    var inTema = document.getElementById('input-nuevo-tema-' + personaId);
    if (!inTema) return;
    var texto = inTema.value.trim();
    if (!texto) return;

    var p = (APP_STATE.agendaPersonas || []).find(function(item) { return item.id === personaId; });
    if (!p) return;
    if (!p.temasPendientes) p.temasPendientes = [];
    p.temasPendientes.push({
        id: "T-" + Date.now(),
        texto: texto,
        hecho: false
    });
    MonarcaDB.save(APP_STATE);
    inTema.value = '';
    renderizarAgendaPersonas();
}

function eliminarTemaPersona(personaId, temaId) {
    var p = (APP_STATE.agendaPersonas || []).find(function(item) { return item.id === personaId; });
    if (!p || !p.temasPendientes) return;
    p.temasPendientes = p.temasPendientes.filter(function(t) { return t.id !== temaId; });
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
}

function cambiarEstadoPersona(personaId, nuevoEstado) {
    var p = (APP_STATE.agendaPersonas || []).find(function(item) { return item.id === personaId; });
    if (!p) return;
    p.estado = nuevoEstado;
    if (nuevoEstado === 'Conversado') sumarExp(20);
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
}

function eliminarPersonaAgenda(id) {
    if (!confirm("¿Deseas eliminar este contacto de la agenda?")) return;
    if (!APP_STATE.agendaPersonas) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('agendaPersonas', id);
    }
    APP_STATE.agendaPersonas = APP_STATE.agendaPersonas.filter(function(p) { return p.id !== id; });
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
}

function abrirModalNuevaPersona() {
    var m = document.getElementById('modal-nueva-persona');
    if (m) m.style.display = 'flex';
}
function cerrarModalNuevaPersona() {
    var m = document.getElementById('modal-nueva-persona');
    if (m) m.style.display = 'none';
}
function guardarNuevaPersona() {
    var inNom = document.getElementById('input-per-nombre');
    var inRol = document.getElementById('input-per-rol');
    var inUbi = document.getElementById('input-per-ubicacion');
    var inLug = document.getElementById('input-per-lugar');
    var inTem = document.getElementById('input-per-temas');
    var inFec = document.getElementById('input-per-fecha');

    var nom = inNom ? inNom.value.trim() : '';
    var rol = inRol ? inRol.value.trim() : 'Contacto';
    var ubi = inUbi ? inUbi.value : '💈 Barbería';
    var lug = inLug ? inLug.value.trim() : '';
    var rawTemas = inTem ? inTem.value.trim() : '';
    var fec = inFec ? inFec.value.trim() : 'Esta semana';

    if (!nom) { alert("Ingresa el nombre de la persona."); if (inNom) inNom.focus(); return; }

    var temasList = [];
    if (rawTemas) {
        rawTemas.split('\n').forEach(function(line) {
            var t = line.trim();
            if (t) temasList.push({ id: "T-" + Math.random().toString(36).substr(2, 9), texto: t, hecho: false });
        });
    }

    if (!APP_STATE.agendaPersonas) APP_STATE.agendaPersonas = [];
    var nuevo = {
        id: "PER-" + Date.now(),
        nombre: nom,
        rol: rol,
        ubicacionCategoria: ubi,
        lugarProyectado: lug || ubi,
        temasPendientes: temasList,
        fechaObjetivo: fec,
        estado: "Pendiente",
        timestamp: Date.now()
    };

    APP_STATE.agendaPersonas.unshift(nuevo);
    sumarExp(15);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevaPersona();
    renderizarAgendaPersonas();
    alert("👥 Contacto '" + nom + "' agregado a la agenda con sus temas pendientes.");
}


// ==========================================================================
// 3. RULETA DE VARIABILIDAD SEMANAL (COMIDAS, VESTIMENTA Y MÚSICA)
// ==========================================================================

var RULETA_EN_GIRO = false;
var CATEGORIA_RULETA_ACTIVA = "comidas";

function cargarRuletaSemanal() {
    renderizarRuletaSemanal();
}

function renderizarRuletaSemanal() {
    var contResultado = document.getElementById('contenedor-resultado-ruleta');
    var contOpciones = document.getElementById('contenedor-opciones-ruleta');
    if (!contResultado && !contOpciones) return;

    if (!APP_STATE.ruletaSemanal) {
        APP_STATE.ruletaSemanal = JSON.parse(JSON.stringify(DEFAULT_STATE.ruletaSemanal));
    }
    var rs = APP_STATE.ruletaSemanal;

    // 1. Banner de Selección Activa de Variabilidad
    if (contResultado) {
        var act = rs.seleccionActiva || {};
        var com = act.comida || "Sin girar aún";
        var ves = act.vestimenta || "Sin girar aún";
        var mus = act.musica || "Sin girar aún";
        var fec = act.fechaGiro || "Hoy";

        contResultado.innerHTML = `
        <div class="weekly-review-banner" style="border-left-color: #f8fafc;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                <div>
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Protocolo Anti-Monotonía</div>
                    <h3 style="margin: 2px 0 0 0; font-size: 17px; font-weight: 800; color: #f8fafc;">Selección Activa de Variabilidad</h3>
                </div>
                <button class="btn-system" onclick="girarRuletaCompleta()" style="font-size: 12.5px; padding: 7px 14px;">
                    🎲 Giro Completo Diario
                </button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 10px;">
                <div style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px;">
                    <div style="font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase;">🍲 Comida Elegida</div>
                    <div style="font-size: 13.5px; font-weight: 700; color: #f8fafc; margin: 4px 0;">${com}</div>
                    <button class="btn-sheet-action" style="font-size: 11px; padding: 3px 8px; margin-top: 4px;" onclick="girarRuletaIndividual('comidas')">🔄 Girar Comida</button>
                </div>
                <div style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px;">
                    <div style="font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase;">👔 Outfit del Día</div>
                    <div style="font-size: 13.5px; font-weight: 700; color: #f8fafc; margin: 4px 0;">${ves}</div>
                    <button class="btn-sheet-action" style="font-size: 11px; padding: 3px 8px; margin-top: 4px;" onclick="girarRuletaIndividual('vestimenta')">🔄 Girar Outfit</button>
                </div>
                <div style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px;">
                    <div style="font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase;">🎵 Música / Foco</div>
                    <div style="font-size: 13.5px; font-weight: 700; color: #f8fafc; margin: 4px 0;">${mus}</div>
                    <button class="btn-sheet-action" style="font-size: 11px; padding: 3px 8px; margin-top: 4px;" onclick="girarRuletaIndividual('musica')">🔄 Girar Música</button>
                </div>
            </div>
            <div style="font-size: 11px; color: #9ca3af; margin-top: 10px; text-align: right;">Último giro: ${fec}</div>
        </div>`;
    }

    // 2. Visualizador de la Ruleta (Canvas o Ruleta Animada)
    dibujarRuletaEnCanvas();

    // 3. Banco de Opciones por Categoría
    if (contOpciones) {
        var items = rs[CATEGORIA_RULETA_ACTIVA] || [];
        var htmlOps = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; gap: 6px;">
                <button class="btn-tab-con-area ${CATEGORIA_RULETA_ACTIVA === 'comidas' ? 'active' : ''}" onclick="cambiarTabBancoRuleta('comidas')">🍲 Comidas (${(rs.comidas||[]).length})</button>
                <button class="btn-tab-con-area ${CATEGORIA_RULETA_ACTIVA === 'vestimenta' ? 'active' : ''}" onclick="cambiarTabBancoRuleta('vestimenta')">👔 Vestimenta (${(rs.vestimenta||[]).length})</button>
                <button class="btn-tab-con-area ${CATEGORIA_RULETA_ACTIVA === 'musica' ? 'active' : ''}" onclick="cambiarTabBancoRuleta('musica')">🎵 Música (${(rs.musica||[]).length})</button>
            </div>
            <button class="btn-sheet-action" onclick="abrirModalNuevaOpcionRuleta()">+ Agregar Opción</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px;">`;

        if (items.length === 0) {
            htmlOps += `
            <div style="grid-column: 1 / -1; text-align: center; padding: 26px 16px; background: #0b0e15; border: 1px dashed #d1d5db; border-radius: 10px;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">No hay opciones registradas en esta categoría aún.</p>
                <button class="btn-sheet-action" onclick="abrirModalNuevaOpcionRuleta()">+ Agregar tu primera opción</button>
            </div>`;
        } else {
            items.forEach(function(item) {
                var subtag = item.tipo || item.estilo || item.genero || 'Variabilidad';
                htmlOps += `
                <div style="background: #121725; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                    <div>
                        <strong style="font-size: 13px; color: #f8fafc; display: block;">${item.nombre}</strong>
                        <span style="font-size: 11px; color: #6b7280;">${subtag}</span>
                    </div>
                    <button onclick="eliminarOpcionRuleta('${CATEGORIA_RULETA_ACTIVA}', '${item.id}')" title="Eliminar opción" style="background:none; border:none; color:#9ca3af; cursor:pointer; font-size:13px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#9ca3af'">✕</button>
                </div>`;
            });
        }

        htmlOps += `</div>`;
        contOpciones.innerHTML = htmlOps;
    }
}

function cambiarTabBancoRuleta(cat) {
    CATEGORIA_RULETA_ACTIVA = cat;
    renderizarRuletaSemanal();
}

var ANGULO_ACTUAL_RULETA = 0;

function dibujarRuletaEnCanvas() {
    var canvas = document.getElementById('canvas-ruleta');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var rs = APP_STATE.ruletaSemanal || DEFAULT_STATE.ruletaSemanal;
    var items = rs[CATEGORIA_RULETA_ACTIVA] || [];

    var width = canvas.width;
    var height = canvas.height;
    var cx = width / 2;
    var cy = height / 2;
    var radio = Math.min(cx, cy) - 10;

    ctx.clearRect(0, 0, width, height);

    if (items.length === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radio, 0, 2 * Math.PI);
        ctx.fillStyle = '#f9fafb';
        ctx.fill();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Sin opciones aún', cx, cy);
        return;
    }
    var numSectores = items.length;
    var arc = (2 * Math.PI) / numSectores;

    ctx.clearRect(0, 0, width, height);

    var colores = ['#111827', '#1f2937', '#374151', '#4b5563', '#6b7280', '#0f172a', '#1e293b', '#334155'];

    for (var i = 0; i < numSectores; i++) {
        var anguloInicio = ANGULO_ACTUAL_RULETA + i * arc;
        var anguloFin = anguloInicio + arc;

        ctx.beginPath();
        ctx.fillStyle = colores[i % colores.length];
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radio, anguloInicio, anguloFin);
        ctx.lineTo(cx, cy);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(anguloInicio + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
        var textoCorto = items[i].nombre.length > 20 ? items[i].nombre.substr(0, 18) + '...' : items[i].nombre;
        ctx.fillText(textoCorto, radio - 16, 4);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#111827';
    ctx.fill();
}

function animarGiroRuleta(items, callback) {
    if (RULETA_EN_GIRO) return;
    RULETA_EN_GIRO = true;

    var numSectores = items.length;
    var indexGanador = Math.floor(Math.random() * numSectores);
    var arc = (2 * Math.PI) / numSectores;

    var vueltasExtra = 5 + Math.floor(Math.random() * 3);
    var anguloObjetivo = vueltasExtra * 2 * Math.PI + (2 * Math.PI - (indexGanador * arc + arc / 2));

    var duracion = 3200;
    var tiempoInicio = performance.now();
    var anguloInicial = ANGULO_ACTUAL_RULETA;

    function step(ahora) {
        var elapsed = ahora - tiempoInicio;
        var t = Math.min(1, elapsed / duracion);
        var easeOut = 1 - Math.pow(1 - t, 3);
        ANGULO_ACTUAL_RULETA = anguloInicial + (anguloObjetivo - anguloInicial) * easeOut;

        dibujarRuletaEnCanvas();

        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            RULETA_EN_GIRO = false;
            ANGULO_ACTUAL_RULETA = ANGULO_ACTUAL_RULETA % (2 * Math.PI);
            dibujarRuletaEnCanvas();
            callback(items[indexGanador]);
        }
    }

    requestAnimationFrame(step);
}

function girarRuletaIndividual(categoria) {
    if (RULETA_EN_GIRO) return;
    CATEGORIA_RULETA_ACTIVA = categoria;
    var rs = APP_STATE.ruletaSemanal || DEFAULT_STATE.ruletaSemanal;
    var items = rs[categoria] || [];
    if (items.length === 0) {
        alert("No hay opciones registradas en " + categoria + " para girar.");
        return;
    }

    animarGiroRuleta(items, function(ganador) {
        if (!APP_STATE.ruletaSemanal.seleccionActiva) APP_STATE.ruletaSemanal.seleccionActiva = {};
        if (categoria === 'comidas') APP_STATE.ruletaSemanal.seleccionActiva.comida = ganador.nombre;
        if (categoria === 'vestimenta') APP_STATE.ruletaSemanal.seleccionActiva.vestimenta = ganador.nombre;
        if (categoria === 'musica') APP_STATE.ruletaSemanal.seleccionActiva.musica = ganador.nombre;

        APP_STATE.ruletaSemanal.seleccionActiva.fechaGiro = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        sumarExp(10);
        MonarcaDB.save(APP_STATE);
        renderizarRuletaSemanal();
        alert("🎲 ¡Giro completado!\nHas seleccionado: " + ganador.nombre + " (+10 EXP por variabilidad).");
    });
}

function girarRuletaCompleta() {
    if (RULETA_EN_GIRO) return;
    var rs = APP_STATE.ruletaSemanal || DEFAULT_STATE.ruletaSemanal;
    var coms = rs.comidas || [];
    var vess = rs.vestimenta || [];
    var muss = rs.musica || [];

    if (coms.length === 0 || vess.length === 0 || muss.length === 0) {
        alert("Asegúrate de tener al menos una opción en Comidas, Vestimenta y Música.");
        return;
    }

    var winCom = coms[Math.floor(Math.random() * coms.length)];
    var winVes = vess[Math.floor(Math.random() * vess.length)];
    var winMus = muss[Math.floor(Math.random() * muss.length)];

    animarGiroRuleta(coms, function() {
        if (!APP_STATE.ruletaSemanal.seleccionActiva) APP_STATE.ruletaSemanal.seleccionActiva = {};
        APP_STATE.ruletaSemanal.seleccionActiva.comida = winCom.nombre;
        APP_STATE.ruletaSemanal.seleccionActiva.vestimenta = winVes.nombre;
        APP_STATE.ruletaSemanal.seleccionActiva.musica = winMus.nombre;
        APP_STATE.ruletaSemanal.seleccionActiva.fechaGiro = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        if (!APP_STATE.ruletaSemanal.historialGiros) APP_STATE.ruletaSemanal.historialGiros = [];
        APP_STATE.ruletaSemanal.historialGiros.unshift({
            fecha: APP_STATE.ruletaSemanal.seleccionActiva.fechaGiro,
            comida: winCom.nombre,
            vestimenta: winVes.nombre,
            musica: winMus.nombre
        });
        if (APP_STATE.ruletaSemanal.historialGiros.length > 10) APP_STATE.ruletaSemanal.historialGiros.pop();

        sumarExp(25);
        MonarcaDB.save(APP_STATE);
        renderizarRuletaSemanal();

        alert("🎲 ¡GIRO COMPLETO DE VARIABILIDAD SEMANAL!\n\n🍲 Comida: " + winCom.nombre + "\n👔 Outfit: " + winVes.nombre + "\n🎵 Música: " + winMus.nombre + "\n\n+25 EXP por romper la monotonía.");
    });
}

function abrirModalNuevaOpcionRuleta() {
    var m = document.getElementById('modal-nueva-opcion-ruleta');
    if (!m) return;
    var lbl = document.getElementById('label-opcion-ruleta-tipo');
    if (lbl) {
        var nomCat = CATEGORIA_RULETA_ACTIVA === 'comidas' ? 'Comida' : (CATEGORIA_RULETA_ACTIVA === 'vestimenta' ? 'Outfit' : 'Música');
        lbl.innerText = "Nueva Opción para " + nomCat + ":";
    }
    m.style.display = 'flex';
}
function cerrarModalNuevaOpcionRuleta() {
    var m = document.getElementById('modal-nueva-opcion-ruleta');
    if (m) m.style.display = 'none';
}
function guardarNuevaOpcionRuleta() {
    var inNom = document.getElementById('input-opcion-ruleta-nombre');
    var inSub = document.getElementById('input-opcion-ruleta-sub');
    var nom = inNom ? inNom.value.trim() : '';
    var sub = inSub ? inSub.value.trim() : '';

    if (!nom) { alert("Ingresa el nombre de la opción."); if (inNom) inNom.focus(); return; }

    var rs = APP_STATE.ruletaSemanal || DEFAULT_STATE.ruletaSemanal;
    if (!rs[CATEGORIA_RULETA_ACTIVA]) rs[CATEGORIA_RULETA_ACTIVA] = [];

    var nuevo = {
        id: "RUL-" + Date.now(),
        nombre: nom,
        tipo: sub,
        estilo: sub,
        genero: sub
    };
    rs[CATEGORIA_RULETA_ACTIVA].push(nuevo);
    MonarcaDB.save(APP_STATE);

    if (inNom) inNom.value = '';
    if (inSub) inSub.value = '';

    cerrarModalNuevaOpcionRuleta();
    renderizarRuletaSemanal();
    alert("🎲 Opción agregada a la ruleta exitosamente.");
}

function eliminarOpcionRuleta(categoria, id) {
    if (!confirm("¿Deseas eliminar esta opción de la ruleta?")) return;
    var rs = APP_STATE.ruletaSemanal;
    if (!rs || !rs[categoria]) return;
    rs[categoria] = rs[categoria].filter(function(item) { return item.id !== id; });
    MonarcaDB.save(APP_STATE);
    renderizarRuletaSemanal();
}
