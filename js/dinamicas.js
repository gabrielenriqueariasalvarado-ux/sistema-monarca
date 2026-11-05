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
            <div class="subapp-labor-card-clean" onclick="abrirSubAppLabor('${lab.id}')" style="border-top: 3px solid ${lab.color}; cursor: pointer;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; font-size: 26px; border: 1px solid rgba(255,255,255,0.07);">
                            ${lab.icono}
                        </div>
                        <div>
                            <strong style="font-size: 16px; color: #f8fafc; display: block; letter-spacing: -0.2px;">${lab.nombre}</strong>
                            <span class="subapp-badge" style="color: ${lab.color}; border-color: ${lab.color}44;">${lab.tagline || 'Sub-App Oficial'}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 18px; color: #64748b;" class="subapp-arrow">➔</span>
                    </div>
                </div>
            </div>`;
        });

        htmlCat += '</div>';
        contCategorias.innerHTML = htmlCat;
    }

    // 4. Renderizar Historial de Sesiones con filtros
    renderizarHistorialLabores();
}

function abrirSubAppLabor(laborId) {
    if (laborId === 'LAB-BOOM') {
        cambiarVista('vista-subapp-boom');
    } else if (laborId === 'LAB-BARBER') {
        cambiarVista('vista-subapp-barberia');
    } else if (laborId === 'LAB-TRAINER') {
        cambiarVista('vista-subapp-trainer');
    }
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
}


// ==========================================================================
// 1.1 SUB-APP OFICIAL: BOOM SOLUTIONS (PLANIFICACIÓN, HORARIO Y SUELDO)
// ==========================================================================

var MES_BOOM_ACTUAL = null;

function asegurarEstructuraBoom() {
    if (!APP_STATE) return;
    if (!APP_STATE.subappBoom || typeof APP_STATE.subappBoom !== 'object') {
        APP_STATE.subappBoom = {
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
        };
    }
    if (!APP_STATE.subappBoom.config) {
        APP_STATE.subappBoom.config = {
            sueldoQuincena1: 0,
            sueldoQuincena2: 0,
            bonoDia3: 0,
            horarioInicio: "08:00",
            horarioFin: "16:30",
            breakMinutos: 30,
            horasJornadaNormal: 8.0,
            horasJornadaSabado: 8.0
        };
    }
    if (!APP_STATE.subappBoom.planificaciones) {
        APP_STATE.subappBoom.planificaciones = {};
    }

    if (!MES_BOOM_ACTUAL) {
        var hoy = new Date();
        var y = hoy.getFullYear();
        var m = String(hoy.getMonth() + 1).padStart(2, '0');
        MES_BOOM_ACTUAL = y + '-' + m;
    }

    generarPlanificacionMesBoomSiNoExiste(MES_BOOM_ACTUAL);
}

function generarPlanificacionMesBoomSiNoExiste(mesClave) {
    if (!APP_STATE.subappBoom.planificaciones[mesClave]) {
        APP_STATE.subappBoom.planificaciones[mesClave] = {
            dias: {},
            pagosCobrados: { quincena1: false, quincena2: false, bono3: false }
        };
    }

    var planMes = APP_STATE.subappBoom.planificaciones[mesClave];
    if (!planMes.dias) planMes.dias = {};
    if (!planMes.pagosCobrados) planMes.pagosCobrados = { quincena1: false, quincena2: false, bono3: false };

    var partes = mesClave.split('-');
    var anio = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10);

    var diasEnMes = new Date(anio, mes, 0).getDate();
    var sabadosDelMes = [];

    for (var d = 1; d <= diasEnMes; d++) {
        var dt = new Date(anio, mes - 1, d);
        var diaSemana = dt.getDay();
        if (diaSemana === 6) {
            sabadosDelMes.push(d);
        }
    }

    var sabadosLibresDefault = [];
    if (sabadosDelMes.length >= 4) {
        sabadosLibresDefault = [sabadosDelMes[1], sabadosDelMes[3]];
    } else if (sabadosDelMes.length >= 2) {
        sabadosLibresDefault = [sabadosDelMes[0], sabadosDelMes[1]];
    } else {
        sabadosLibresDefault = sabadosDelMes.slice(0, 2);
    }

    var config = APP_STATE.subappBoom.config;
    var horasNormal = Number(config.horasJornadaNormal) || 8.0;
    var horasSabado = Number(config.horasJornadaSabado) || 8.0;

    for (var diaNum = 1; diaNum <= diasEnMes; diaNum++) {
        var diaStr = mesClave + '-' + String(diaNum).padStart(2, '0');
        if (!planMes.dias[diaStr]) {
            var dtObj = new Date(anio, mes - 1, diaNum);
            var ds = dtObj.getDay();

            if (ds === 0) {
                planMes.dias[diaStr] = {
                    tipo: 'domingo_libre',
                    horas: 0,
                    cumplido: false
                };
            } else if (ds === 6) {
                var esLibre = sabadosLibresDefault.includes(diaNum);
                planMes.dias[diaStr] = {
                    tipo: esLibre ? 'sabado_libre' : 'sabado_trabajo',
                    horas: esLibre ? 0 : horasSabado,
                    cumplido: false
                };
            } else {
                planMes.dias[diaStr] = {
                    tipo: 'laborable',
                    horas: horasNormal,
                    cumplido: false
                };
            }
        }
    }
}

function cambiarMesBoom(delta) {
    asegurarEstructuraBoom();
    var partes = MES_BOOM_ACTUAL.split('-');
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
    MES_BOOM_ACTUAL = anio + '-' + String(mes).padStart(2, '0');
    generarPlanificacionMesBoomSiNoExiste(MES_BOOM_ACTUAL);
    renderizarSubAppBoom();
}

function cargarSubAppBoom() {
    asegurarEstructuraBoom();
    renderizarSubAppBoom();
}

function renderizarSubAppBoom() {
    asegurarEstructuraBoom();
    var cont = document.getElementById('subapp-boom-content');
    if (!cont) return;

    var planMes = APP_STATE.subappBoom.planificaciones[MES_BOOM_ACTUAL];
    var config = APP_STATE.subappBoom.config;

    var partes = MES_BOOM_ACTUAL.split('-');
    var anio = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10);
    var diasEnMes = new Date(anio, mes, 0).getDate();

    var totalSabadosLibres = 0;
    var totalSabadosTrabajados = 0;
    var totalHorasPlanificadas = 0;
    var totalHorasCumplidas = 0;
    var totalDiasLaborales = 0;
    var totalDiasCumplidos = 0;

    for (var d = 1; d <= diasEnMes; d++) {
        var fechaStr = MES_BOOM_ACTUAL + '-' + String(d).padStart(2, '0');
        var info = planMes.dias[fechaStr] || { tipo: 'laborable', horas: 8.0, cumplido: false };

        if (info.tipo === 'sabado_libre') {
            totalSabadosLibres++;
        } else if (info.tipo === 'sabado_trabajo') {
            totalSabadosTrabajados++;
            totalDiasLaborales++;
            totalHorasPlanificadas += (Number(info.horas) || 0);
            if (info.cumplido) {
                totalDiasCumplidos++;
                totalHorasCumplidas += (Number(info.horas) || 0);
            }
        } else if (info.tipo === 'laborable') {
            totalDiasLaborales++;
            totalHorasPlanificadas += (Number(info.horas) || 0);
            if (info.cumplido) {
                totalDiasCumplidos++;
                totalHorasCumplidas += (Number(info.horas) || 0);
            }
        }
    }

    var sueldoQ1 = Number(config.sueldoQuincena1) || 0;
    var sueldoQ2 = Number(config.sueldoQuincena2) || 0;
    var bono3 = Number(config.bonoDia3) || 0;
    var totalRecaudadoMes = sueldoQ1 + sueldoQ2 + bono3;

    var cobradoQ1 = !!(planMes.pagosCobrados && planMes.pagosCobrados.quincena1);
    var cobradoQ2 = !!(planMes.pagosCobrados && planMes.pagosCobrados.quincena2);
    var cobradoB3 = !!(planMes.pagosCobrados && planMes.pagosCobrados.bono3);

    var totalDineroCobrado = (cobradoQ1 ? sueldoQ1 : 0) + (cobradoQ2 ? sueldoQ2 : 0) + (cobradoB3 ? bono3 : 0);
    var totalDineroPendiente = totalRecaudadoMes - totalDineroCobrado;

    var pctHoras = totalHorasPlanificadas > 0 ? Math.round((totalHorasCumplidas / totalHorasPlanificadas) * 100) : 0;
    var sabadosOk = (totalSabadosLibres === 2);

    var html = `
    <!-- BARRA SELECTORA DE MES & ALERTA SÁBADOS -->
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
        <div class="mes-selector-pill">
            <button type="button" class="btn-mes-nav" onclick="cambiarMesBoom(-1)" title="Mes Anterior">◀</button>
            <span>📅 ${formatearNombreMesLabor(MES_BOOM_ACTUAL)}</span>
            <button type="button" class="btn-mes-nav" onclick="cambiarMesBoom(1)" title="Mes Siguiente">▶</button>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
            <div class="boom-sabados-pill ${sabadosOk ? 'ok' : 'alerta'}">
                <span>${sabadosOk ? '✅' : '⚠️'}</span>
                <span>Sábados Libres: <strong>${totalSabadosLibres} / 2</strong></span>
            </div>
            ${!sabadosOk ? `<span style="font-size: 11px; color: #fbbf24; font-weight: 700;">(Debes definir exactamente 2 sábados libres)</span>` : ''}
        </div>
    </div>

    <!-- TARJETAS KPIS DE LA SUB-APP BOOM -->
    <div class="operatividad-metrics-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
        <div class="metric-card-ideas" style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px 16px; border-radius: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;">Recaudación Mensual</span>
                <span style="font-size: 16px;">💵</span>
            </div>
            <div class="metric-num" style="color: #10b981; font-size: 24px; font-weight: 800;">$${totalRecaudadoMes.toFixed(2)}</div>
            <div class="metric-title" style="color: #64748b; font-size: 11px; margin-top: 4px;">
                Cobrado: <strong style="color: #34d399;">$${totalDineroCobrado.toFixed(0)}</strong> · Pendiente: <strong style="color: #fbbf24;">$${totalDineroPendiente.toFixed(0)}</strong>
            </div>
        </div>

        <div class="metric-card-ideas" style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px 16px; border-radius: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.5px;">Tiempo al Mes</span>
                <span style="font-size: 16px;">⏱️</span>
            </div>
            <div class="metric-num" style="color: #f8fafc; font-size: 24px; font-weight: 800;">${totalHorasCumplidas.toFixed(1)} <span style="font-size: 12.5px; color: #94a3b8;">/ ${totalHorasPlanificadas.toFixed(1)}h</span></div>
            <div style="margin-top: 6px;">
                <div class="attr-progress-track" style="height: 5px; background: rgba(255,255,255,0.08); border-radius: 9999px;">
                    <div class="attr-progress-fill" style="width: ${pctHoras}%; background: #6366f1; border-radius: 9999px;"></div>
                </div>
                <div style="font-size: 10.5px; color: #818cf8; font-weight: 700; margin-top: 3px;">${pctHoras}% cumplido</div>
            </div>
        </div>

        <div class="metric-card-ideas" style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px 16px; border-radius: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">Días Laborables</span>
                <span style="font-size: 16px;">💼</span>
            </div>
            <div class="metric-num" style="color: #38bdf8; font-size: 24px; font-weight: 800;">${totalDiasCumplidos} <span style="font-size: 12.5px; color: #94a3b8;">/ ${totalDiasLaborales} días</span></div>
            <div class="metric-title" style="color: #64748b; font-size: 11px; margin-top: 4px;">Jornadas de 8:00am - 4:30pm</div>
        </div>

        <div class="metric-card-ideas" style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px 16px; border-radius: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px;">Sábados de Trabajo</span>
                <span style="font-size: 16px;">⚡</span>
            </div>
            <div class="metric-num" style="color: #f8fafc; font-size: 24px; font-weight: 800;">${totalSabadosTrabajados} <span style="font-size: 12.5px; color: #94a3b8;">sábados</span></div>
            <div class="metric-title" style="color: #64748b; font-size: 11px; margin-top: 4px;">+ ${totalSabadosLibres} sábados libres</div>
        </div>
    </div>

    <!-- REMUNERACIÓN PROPORCIONADA & PAGOS FIJOS (15, 30 Y 3) -->
    <div style="margin-bottom: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div>
                <h3 style="font-size: 15px; font-weight: 800; color: #f8fafc; margin: 0 0 2px 0;">💰 Pagos y Sueldo Proporcionado del Mes</h3>
                <span style="font-size: 11.5px; color: #6b7280;">Sueldo quincenal (15 y 30) junto con bono mensual (día 3). Pulsa para marcar cobrado.</span>
            </div>
            <button type="button" onclick="abrirModalConfigBoom()" style="background: none; border: none; color: #818cf8; font-size: 11.5px; font-weight: 700; cursor: pointer; text-decoration: underline;">
                ✏️ Editar Montos
            </button>
        </div>

        <div class="boom-pay-grid">
            <!-- PAGO 1: BONO DÍA 3 -->
            <div class="boom-pay-card ${cobradoB3 ? 'cobrado' : 'pendiente'}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                        <span style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase;">🎁 Bono Mensual</span>
                        <h4 style="margin: 2px 0 0 0; font-size: 14px; color: #f8fafc;">Día 3 de Cada Mes</h4>
                    </div>
                    <span class="boom-pay-badge ${cobradoB3 ? 'cobrado' : 'pendiente'}">${cobradoB3 ? 'COBRADO' : 'PENDIENTE'}</span>
                </div>
                <div style="margin: 8px 0 12px 0;">
                    <div style="font-size: 22px; font-weight: 800; color: #f8fafc;">$${bono3.toFixed(2)}</div>
                    <span style="font-size: 11px; color: #64748b;">Incentivo mensual fijo</span>
                </div>
                <button type="button" class="btn-system" onclick="toggleCobroBoom('bono3')" style="width: 100%; justify-content: center; padding: 7px; font-size: 11.5px; font-weight: 700; background: ${cobradoB3 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)'}; color: ${cobradoB3 ? '#34d399' : '#f8fafc'}; border: 1px solid ${cobradoB3 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'};">
                    ${cobradoB3 ? '✓ Cobrado (Sincronizado)' : 'Marcar como Cobrado'}
                </button>
            </div>

            <!-- PAGO 2: QUINCENA DÍA 15 -->
            <div class="boom-pay-card ${cobradoQ1 ? 'cobrado' : 'pendiente'}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                        <span style="font-size: 11px; font-weight: 800; color: #818cf8; text-transform: uppercase;">💵 Sueldo Quincena 1</span>
                        <h4 style="margin: 2px 0 0 0; font-size: 14px; color: #f8fafc;">Día 15 del Mes</h4>
                    </div>
                    <span class="boom-pay-badge ${cobradoQ1 ? 'cobrado' : 'pendiente'}">${cobradoQ1 ? 'COBRADO' : 'PENDIENTE'}</span>
                </div>
                <div style="margin: 8px 0 12px 0;">
                    <div style="font-size: 22px; font-weight: 800; color: #f8fafc;">$${sueldoQ1.toFixed(2)}</div>
                    <span style="font-size: 11px; color: #64748b;">Primer corte quincenal</span>
                </div>
                <button type="button" class="btn-system" onclick="toggleCobroBoom('quincena1')" style="width: 100%; justify-content: center; padding: 7px; font-size: 11.5px; font-weight: 700; background: ${cobradoQ1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)'}; color: ${cobradoQ1 ? '#34d399' : '#f8fafc'}; border: 1px solid ${cobradoQ1 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'};">
                    ${cobradoQ1 ? '✓ Cobrado (Sincronizado)' : 'Marcar como Cobrado'}
                </button>
            </div>

            <!-- PAGO 3: QUINCENA DÍA 30 -->
            <div class="boom-pay-card ${cobradoQ2 ? 'cobrado' : 'pendiente'}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                        <span style="font-size: 11px; font-weight: 800; color: #818cf8; text-transform: uppercase;">💵 Sueldo Quincena 2</span>
                        <h4 style="margin: 2px 0 0 0; font-size: 14px; color: #f8fafc;">Día 30 del Mes</h4>
                    </div>
                    <span class="boom-pay-badge ${cobradoQ2 ? 'cobrado' : 'pendiente'}">${cobradoQ2 ? 'COBRADO' : 'PENDIENTE'}</span>
                </div>
                <div style="margin: 8px 0 12px 0;">
                    <div style="font-size: 22px; font-weight: 800; color: #f8fafc;">$${sueldoQ2.toFixed(2)}</div>
                    <span style="font-size: 11px; color: #64748b;">Segundo corte quincenal</span>
                </div>
                <button type="button" class="btn-system" onclick="toggleCobroBoom('quincena2')" style="width: 100%; justify-content: center; padding: 7px; font-size: 11.5px; font-weight: 700; background: ${cobradoQ2 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)'}; color: ${cobradoQ2 ? '#34d399' : '#f8fafc'}; border: 1px solid ${cobradoQ2 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'};">
                    ${cobradoQ2 ? '✓ Cobrado (Sincronizado)' : 'Marcar como Cobrado'}
                </button>
            </div>
        </div>
    </div>

    <!-- CALENDARIO DE PLANIFICACIÓN MENSUAL (SEMANAS Y SÁBADOS) -->
    <div class="boom-calendar-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
            <div>
                <h3 style="font-size: 15px; font-weight: 800; color: #f8fafc; margin: 0 0 2px 0;">📅 Planificación de Semanas Laborales</h3>
                <span style="font-size: 11.5px; color: #6b7280;">Toca cualquier día laborable para marcar tu jornada de <strong>8.0 horas cumplida</strong> (se suma automáticamente a tu cuenta).</span>
            </div>
            <div style="display: flex; gap: 8px; font-size: 11px; color: #94a3b8; align-items: center; flex-wrap: wrap;">
                <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: #6366f1;"></span> Laborable (8h)</span>
                <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: #10b981;"></span> Sábado Libre (Ajustes)</span>
                <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: #f59e0b;"></span> Sábado Trabajo</span>
            </div>
        </div>

        <div class="boom-weekdays-row">
            <div class="boom-weekday-label">Lun</div>
            <div class="boom-weekday-label">Mar</div>
            <div class="boom-weekday-label">Mié</div>
            <div class="boom-weekday-label">Jue</div>
            <div class="boom-weekday-label">Vie</div>
            <div class="boom-weekday-label" style="color: #fbbf24;">Sáb</div>
            <div class="boom-weekday-label" style="color: #94a3b8;">Dom</div>
        </div>

        <div class="boom-days-grid">
    `;

    var primerDiaObj = new Date(anio, mes - 1, 1);
    var diaSemanaPrimerDia = primerDiaObj.getDay();
    var paddingInicio = (diaSemanaPrimerDia === 0) ? 6 : (diaSemanaPrimerDia - 1);

    for (var p = 0; p < paddingInicio; p++) {
        html += `<div class="boom-day-cell day-fuera-mes"></div>`;
    }

    for (var diaI = 1; diaI <= diasEnMes; diaI++) {
        var fechaDia = MES_BOOM_ACTUAL + '-' + String(diaI).padStart(2, '0');
        var dInfo = planMes.dias[fechaDia] || { tipo: 'laborable', horas: 8.0, cumplido: false };

        var cellClass = 'day-laborable';
        var badgeText = '8.0h';
        var badgeClass = 'badge-dia-labor';
        var onclickHandler = `toggleCumplidoDiaBoom('${fechaDia}')`;
        var titleAttr = 'Toca para marcar o desmarcar tu jornada de 8.0 horas';

        if (dInfo.tipo === 'domingo_libre') {
            cellClass = 'day-domingo';
            badgeText = 'Libre';
            badgeClass = 'badge-dom-libre';
            onclickHandler = '';
            titleAttr = 'Domingo de descanso';
        } else if (dInfo.tipo === 'sabado_libre') {
            cellClass = 'day-sabado-libre';
            badgeText = '🏖️ Libre';
            badgeClass = 'badge-sab-libre';
            onclickHandler = '';
            titleAttr = 'Sábado libre de descanso (configurado en ajustes de la app)';
        } else if (dInfo.tipo === 'sabado_trabajo') {
            cellClass = 'day-sabado-trabajo';
            badgeText = '8.0h';
            badgeClass = 'badge-sab-trabajo';
            onclickHandler = `toggleCumplidoDiaBoom('${fechaDia}')`;
            titleAttr = 'Sábado de trabajo: toca para registrar tu jornada de 8.0 horas cumplida';
        }

        if (dInfo.cumplido) {
            cellClass += ' day-cumplido';
        }

        html += `
        <div class="boom-day-cell ${cellClass}" onclick="${onclickHandler}" title="${titleAttr}">
            <div class="boom-day-header">
                <span class="boom-day-number">${diaI}</span>
                <span class="boom-day-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="boom-day-footer">
                <span>${dInfo.tipo === 'sabado_libre' ? 'Descanso' : (dInfo.tipo === 'domingo_libre' ? 'Descanso' : '8am-4:30pm')}</span>
                ${(dInfo.tipo !== 'domingo_libre' && dInfo.tipo !== 'sabado_libre') ? `
                    <span class="badge-cumplido-check">${dInfo.cumplido ? '✓' : '○'}</span>
                ` : ''}
            </div>
        </div>`;
    }

    html += `
        </div>
    </div>
    `;

    cont.innerHTML = html;
}

function toggleCumplidoDiaBoom(fechaStr) {
    asegurarEstructuraBoom();
    var planMes = APP_STATE.subappBoom.planificaciones[MES_BOOM_ACTUAL];
    if (!planMes || !planMes.dias || !planMes.dias[fechaStr]) return;

    var actual = planMes.dias[fechaStr];
    // No permitir registrar en domingos ni sábados libres asignados
    if (actual.tipo === 'domingo_libre' || actual.tipo === 'sabado_libre') return;

    actual.cumplido = !actual.cumplido;

    var idReg = "REG-BOOM-" + fechaStr;
    if (!Array.isArray(APP_STATE.registrosLabores)) APP_STATE.registrosLabores = [];

    if (actual.cumplido) {
        // Al marcar como cumplido, registrar automáticamente la jornada de 8.0 horas
        var yaExiste = APP_STATE.registrosLabores.find(function(r) {
            return r.id === idReg || (r.laborId === 'LAB-BOOM' && r.fecha === fechaStr);
        });

        if (!yaExiste) {
            APP_STATE.registrosLabores.unshift({
                id: idReg,
                laborId: 'LAB-BOOM',
                fecha: fechaStr,
                horas: 8.0,
                descripcion: "Jornada laboral cumplida en Boom Solutions (8:00 AM - 4:30 PM)",
                honorarios: 0,
                timestamp: Date.now()
            });
            if (typeof sumarExp === 'function') sumarExp(80);
        }
    } else {
        // Al desmarcar, restar automáticamente la jornada de 8.0 horas de la cuenta
        APP_STATE.registrosLabores = APP_STATE.registrosLabores.filter(function(r) {
            return r.id !== idReg && !(r.laborId === 'LAB-BOOM' && r.fecha === fechaStr);
        });
    }

    MonarcaDB.save(APP_STATE);
    renderizarSubAppBoom();
    if (typeof renderizarLabores === 'function') renderizarLabores();
}

function toggleCobroBoom(tipoPago) {
    asegurarEstructuraBoom();
    var planMes = APP_STATE.subappBoom.planificaciones[MES_BOOM_ACTUAL];
    if (!planMes || !planMes.pagosCobrados) return;

    var config = APP_STATE.subappBoom.config;
    var nuevoEstado = !planMes.pagosCobrados[tipoPago];
    planMes.pagosCobrados[tipoPago] = nuevoEstado;

    var monto = 0;
    var concepto = '';
    var diaCobro = 1;

    if (tipoPago === 'bono3') {
        monto = Number(config.bonoDia3) || 0;
        concepto = "Bono Boom Solutions (Día 3)";
        diaCobro = 3;
    } else if (tipoPago === 'quincena1') {
        monto = Number(config.sueldoQuincena1) || 0;
        concepto = "Sueldo Quincena 1 Boom Solutions (Día 15)";
        diaCobro = 15;
    } else if (tipoPago === 'quincena2') {
        monto = Number(config.sueldoQuincena2) || 0;
        concepto = "Sueldo Quincena 2 Boom Solutions (Día 30)";
        diaCobro = 30;
    }

    var idFinanza = "ING-BOOM-" + MES_BOOM_ACTUAL + "-" + tipoPago;

    if (APP_STATE.finanzas) {
        if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];

        if (nuevoEstado && monto > 0) {
            var existe = APP_STATE.finanzas.ingresos.find(function(ig) { return ig.id === idFinanza; });
            var fechaCobro = MES_BOOM_ACTUAL + '-' + String(diaCobro).padStart(2, '0');
            if (existe) {
                existe.cobrado = true;
                existe.monto = monto;
            } else {
                APP_STATE.finanzas.ingresos.push({
                    id: idFinanza,
                    fuente: concepto,
                    tipo: 'labor',
                    categoria: "Labores & Servicios",
                    monto: monto,
                    fecha: fechaCobro,
                    dia: diaCobro,
                    cobrado: true
                });
            }
        } else {
            APP_STATE.finanzas.ingresos = APP_STATE.finanzas.ingresos.filter(function(ig) {
                return ig.id !== idFinanza;
            });
        }
        if (typeof renderizarFinanzasSiActivo === 'function') renderizarFinanzasSiActivo();
    }

    MonarcaDB.save(APP_STATE);
    renderizarSubAppBoom();
}

var MODAL_SABADOS_CONFIG = {};

function abrirModalConfigBoom() {
    asegurarEstructuraBoom();
    var m = document.getElementById('modal-config-sueldo-boom');
    if (!m) return;

    var config = APP_STATE.subappBoom.config;
    var inQ1 = document.getElementById('input-boom-sueldo-q1');
    var inQ2 = document.getElementById('input-boom-sueldo-q2');
    var inB3 = document.getElementById('input-boom-bono-dia3');

    if (inQ1) inQ1.value = config.sueldoQuincena1 || '';
    if (inQ2) inQ2.value = config.sueldoQuincena2 || '';
    if (inB3) inB3.value = config.bonoDia3 || '';

    // Inicializar sábados del mes seleccionado en MODAL_SABADOS_CONFIG
    MODAL_SABADOS_CONFIG = {};
    var planMes = APP_STATE.subappBoom.planificaciones[MES_BOOM_ACTUAL];
    var partes = MES_BOOM_ACTUAL.split('-');
    var anio = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10);
    var diasEnMes = new Date(anio, mes, 0).getDate();

    for (var d = 1; d <= diasEnMes; d++) {
        var dt = new Date(anio, mes - 1, d);
        if (dt.getDay() === 6) {
            var fStr = MES_BOOM_ACTUAL + '-' + String(d).padStart(2, '0');
            var dInfo = (planMes && planMes.dias) ? planMes.dias[fStr] : null;
            MODAL_SABADOS_CONFIG[fStr] = dInfo ? (dInfo.tipo === 'sabado_libre') : false;
        }
    }

    renderizarSelectorSabadosModal();

    document.body.classList.add('modal-open');
    m.style.display = 'flex';
}

function renderizarSelectorSabadosModal() {
    var cont = document.getElementById('contenedor-config-sabados-mes');
    var labelMes = document.getElementById('config-boom-mes-nombre');
    var badgeCount = document.getElementById('config-boom-sabados-count');
    if (!cont) return;

    if (labelMes) labelMes.innerText = formatearNombreMesLabor(MES_BOOM_ACTUAL);

    var html = '';
    var libresCount = 0;

    var fechasSabados = Object.keys(MODAL_SABADOS_CONFIG).sort();

    fechasSabados.forEach(function(fStr) {
        var esLibre = !!MODAL_SABADOS_CONFIG[fStr];
        if (esLibre) libresCount++;
        var diaNum = parseInt(fStr.split('-')[2], 10);

        html += `
        <div class="sabado-toggle-card ${esLibre ? 'libre' : 'trabajo'}" onclick="toggleSabadoModal('${fStr}')" style="display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; border-radius: 10px; cursor: pointer; user-select: none;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">${esLibre ? '🏖️' : '💼'}</span>
                <div>
                    <strong style="font-size: 13.5px; color: #f8fafc; display: block;">Sábado ${diaNum} de ${formatearNombreMesSolo(MES_BOOM_ACTUAL)}</strong>
                    <span style="font-size: 11px; color: ${esLibre ? '#34d399' : '#94a3b8'};">
                        ${esLibre ? 'Día de descanso asignado (Libre)' : 'Día laborable programado (8.0 hrs)'}
                    </span>
                </div>
            </div>
            <div>
                <span class="boom-pay-badge ${esLibre ? 'cobrado' : 'pendiente'}" style="font-size: 10.5px; font-weight: 800;">
                    ${esLibre ? '🏖️ LIBRE' : '💼 TRABAJO'}
                </span>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
    if (badgeCount) {
        badgeCount.innerText = libresCount + ' / 2 Libres';
        badgeCount.style.color = (libresCount === 2) ? '#34d399' : '#fbbf24';
    }
}

function toggleSabadoModal(fechaStr) {
    if (MODAL_SABADOS_CONFIG[fechaStr] !== undefined) {
        MODAL_SABADOS_CONFIG[fechaStr] = !MODAL_SABADOS_CONFIG[fechaStr];
        renderizarSelectorSabadosModal();
    }
}

function formatearNombreMesSolo(mesClave) {
    if (!mesClave || mesClave.indexOf('-') === -1) return '';
    var partes = mesClave.split('-');
    var mesNum = parseInt(partes[1], 10);
    var nombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return nombres[mesNum - 1] || partes[1];
}

function cerrarModalConfigBoom() {
    var m = document.getElementById('modal-config-sueldo-boom');
    if (m) m.style.display = 'none';
    document.body.classList.remove('modal-open');
}

function guardarConfigBoom() {
    asegurarEstructuraBoom();
    var inQ1 = document.getElementById('input-boom-sueldo-q1');
    var inQ2 = document.getElementById('input-boom-sueldo-q2');
    var inB3 = document.getElementById('input-boom-bono-dia3');

    var q1 = inQ1 ? (Number(inQ1.value) || 0) : 0;
    var q2 = inQ2 ? (Number(inQ2.value) || 0) : 0;
    var b3 = inB3 ? (Number(inB3.value) || 0) : 0;

    APP_STATE.subappBoom.config.sueldoQuincena1 = q1;
    APP_STATE.subappBoom.config.sueldoQuincena2 = q2;
    APP_STATE.subappBoom.config.bonoDia3 = b3;

    // Aplicar configuración de sábados libres al mes
    var planMes = APP_STATE.subappBoom.planificaciones[MES_BOOM_ACTUAL];
    if (planMes && planMes.dias) {
        var sabadosLibresArray = [];
        Object.keys(MODAL_SABADOS_CONFIG).forEach(function(fStr) {
            var esLibre = !!MODAL_SABADOS_CONFIG[fStr];
            var diaNum = parseInt(fStr.split('-')[2], 10);
            if (esLibre) {
                sabadosLibresArray.push(diaNum);
                planMes.dias[fStr] = {
                    tipo: 'sabado_libre',
                    horas: 0,
                    cumplido: false
                };
                // Si estaba marcado como cumplido en registrosLabores, removerlo
                if (Array.isArray(APP_STATE.registrosLabores)) {
                    APP_STATE.registrosLabores = APP_STATE.registrosLabores.filter(function(r) {
                        return !(r.laborId === 'LAB-BOOM' && r.fecha === fStr);
                    });
                }
            } else {
                var prev = planMes.dias[fStr];
                planMes.dias[fStr] = {
                    tipo: 'sabado_trabajo',
                    horas: 8.0,
                    cumplido: prev ? !!prev.cumplido : false
                };
            }
        });
        planMes.sabadosLibres = sabadosLibresArray;
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalConfigBoom();
    renderizarSubAppBoom();
    if (typeof renderizarLabores === 'function') renderizarLabores();
    alert("🚀 Sueldos y sábados libres de Boom Solutions guardados exitosamente.");
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

// ==========================================================================
// SUB-APP 2: BARBERÍA (ESTILISMO PROFESIONAL & CORTES A DOMICILIO)
// ==========================================================================

var MES_BARBERIA_ACTUAL = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
var TAB_BARBERIA_ACTIVA = 'calendario'; // 'calendario' | 'clientes' | 'historial' | 'tipos-corte'
var INTERVALO_TIMER_BARBERIA = null;
var CORTE_TEMPORAL_FINALIZANDO = null;
var BUSQUEDA_CLIENTE_BARBERIA = '';
var BUSQUEDA_TIPO_CORTE_BARBERIA = '';

function escapeHtmlBarber(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(new RegExp('"', 'g'), '&quot;')
        .replace(new RegExp("'", "g"), '&#39;');
}

function asegurarEstructuraBarberia() {
    if (!APP_STATE.subappBarberia || typeof APP_STATE.subappBarberia !== 'object') {
        APP_STATE.subappBarberia = {};
    }
    if (!Array.isArray(APP_STATE.subappBarberia.clientes)) {
        APP_STATE.subappBarberia.clientes = [];
    }
    if (!Array.isArray(APP_STATE.subappBarberia.cortes)) {
        APP_STATE.subappBarberia.cortes = [];
    }
    if (typeof APP_STATE.subappBarberia.tiempoPromedioMetaMin !== 'number') {
        APP_STATE.subappBarberia.tiempoPromedioMetaMin = 30;
    }
    if (APP_STATE.subappBarberia.timerActivo === undefined) {
        APP_STATE.subappBarberia.timerActivo = null;
    }
    if (!Array.isArray(APP_STATE.subappBarberia.tiposCorte) || APP_STATE.subappBarberia.tiposCorte.length === 0) {
        APP_STATE.subappBarberia.tiposCorte = [
            { id: "ESTILO-1", nombre: "Fade Medio", precio: 10, tiempoMin: 30, descripcion: "Degradado medio clásico afeitado o con máquina rasuradora." },
            { id: "ESTILO-2", nombre: "Degradado + Barba", precio: 12, tiempoMin: 40, descripcion: "Corte degradado con perfilado y arreglo completo de barba." },
            { id: "ESTILO-3", nombre: "Corte Clásico a Tijera", precio: 10, tiempoMin: 30, descripcion: "Tijera en laterales y parte superior, peinado formal/ejecutivo." },
            { id: "ESTILO-4", nombre: "High Fade / Fade Alto", precio: 10, tiempoMin: 30, descripcion: "Degradado alto bien marcado desde la sien." },
            { id: "ESTILO-5", nombre: "Low Fade / Fade Bajo", precio: 10, tiempoMin: 35, descripcion: "Degradado bajo pegado a la oreja y nuca." },
            { id: "ESTILO-6", nombre: "Taper Fade", precio: 10, tiempoMin: 30, descripcion: "Desvanecido sutil únicamente en patillas y nuca." },
            { id: "ESTILO-7", nombre: "Perfilado & Barba", precio: 6, tiempoMin: 20, descripcion: "Delineado de contornos con navaja y perfilado de barba." }
        ];
    }
}

function cargarSubAppBarberia() {
    asegurarEstructuraBarberia();
    iniciarIntervaloTimerBarberia();
    renderizarSubAppBarberia();
}

function setTabBarberia(tab) {
    TAB_BARBERIA_ACTIVA = tab;
    renderizarSubAppBarberia();
}

function cambiarMesBarberia(delta) {
    var partes = MES_BARBERIA_ACTUAL.split('-');
    var anio = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10) - 1;
    var nuevaFecha = new Date(anio, mes + delta, 1);
    var mNum = nuevaFecha.getMonth() + 1;
    MES_BARBERIA_ACTUAL = nuevaFecha.getFullYear() + '-' + (mNum < 10 ? '0' + mNum : mNum);
    renderizarSubAppBarberia();
}

function formatearSegundosBarber(segundosTotales) {
    var hrs = Math.floor(segundosTotales / 3600);
    var mins = Math.floor((segundosTotales % 3600) / 60);
    var segs = segundosTotales % 60;
    var segsStr = segs < 10 ? '0' + segs : String(segs);
    if (hrs > 0) {
        var minsStr = mins < 10 ? '0' + mins : String(mins);
        return hrs + ':' + minsStr + ':' + segsStr;
    }
    var minsTotal = Math.floor(segundosTotales / 60);
    var minsTotalStr = minsTotal < 10 ? '0' + minsTotal : String(minsTotal);
    return minsTotalStr + ':' + segsStr;
}

function iniciarIntervaloTimerBarberia() {
    if (INTERVALO_TIMER_BARBERIA) {
        clearInterval(INTERVALO_TIMER_BARBERIA);
        INTERVALO_TIMER_BARBERIA = null;
    }
    if (APP_STATE.subappBarberia && APP_STATE.subappBarberia.timerActivo) {
        INTERVALO_TIMER_BARBERIA = setInterval(function() {
            actualizarDisplayTimerBarberiaVivo();
        }, 1000);
    }
}

function actualizarDisplayTimerBarberiaVivo() {
    var timer = APP_STATE.subappBarberia ? APP_STATE.subappBarberia.timerActivo : null;
    if (!timer) return;

    var elDisplay = document.getElementById('barber-timer-clock-display');
    var elBarra = document.getElementById('barber-timer-progress-fill');
    var elPorc = document.getElementById('barber-timer-percent-text');

    var ahora = Date.now();
    var segsTranscurridos = Math.max(0, Math.floor((ahora - timer.inicioTimestamp) / 1000));
    var textoReloj = formatearSegundosBarber(segsTranscurridos);

    if (elDisplay) elDisplay.textContent = textoReloj;

    var metaSegs = (APP_STATE.subappBarberia.tiempoPromedioMetaMin || 30) * 60;
    var porc = Math.min(100, Math.round((segsTranscurridos / metaSegs) * 100));

    if (elBarra) {
        elBarra.style.width = porc + '%';
        if (porc >= 100) {
            elBarra.style.background = 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)';
        }
    }
    if (elPorc) {
        elPorc.textContent = Math.round(segsTranscurridos / 60) + ' / 30 min (' + porc + '%)';
    }
}

function renderizarSubAppBarberia() {
    asegurarEstructuraBarberia();
    var cont = document.getElementById('subapp-barberia-content');
    if (!cont) return;

    var clientes = APP_STATE.subappBarberia.clientes || [];
    var cortes = APP_STATE.subappBarberia.cortes || [];
    var tiposCorte = APP_STATE.subappBarberia.tiposCorte || [];
    var timerActivo = APP_STATE.subappBarberia.timerActivo;

    // Actualizar botón superior si hay corte activo
    var btnTop = document.getElementById('btn-iniciar-corte-top');
    if (btnTop) {
        if (timerActivo) {
            btnTop.innerHTML = '<span>🛑</span> Finalizar Corte';
            btnTop.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            btnTop.onclick = function() { pararTimerCorteBarberia(); };
        } else {
            btnTop.innerHTML = '<span>✂️</span> Iniciar Corte';
            btnTop.style.background = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
            btnTop.onclick = function() { abrirModalIniciarCorte(); };
        }
    }

    // Filtrar cortes del mes seleccionado
    var cortesMes = cortes.filter(function(c) {
        return c.fecha && c.fecha.startsWith(MES_BARBERIA_ACTUAL);
    });

    var totalGananciasMes = cortesMes.reduce(function(acc, c) { return acc + (parseFloat(c.cobro) || 0); }, 0);
    var totalMinutosMes = cortesMes.reduce(function(acc, c) { return acc + (parseInt(c.duracionMinutos, 10) || 0); }, 0);
    var totalHorasMes = (totalMinutosMes / 60).toFixed(1);

    var clientesUnicosSet = {};
    cortesMes.forEach(function(c) {
        if (c.clienteNombre) clientesUnicosSet[c.clienteNombre.trim().toLowerCase()] = true;
    });
    var clientesUnicosCount = Object.keys(clientesUnicosSet).length;

    var partes = MES_BARBERIA_ACTUAL.split('-');
    var anio = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10) - 1;
    var nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    var nombreMesStr = (nombresMeses[mes] || '') + ' ' + anio;

    var html = '';

    // 1. BANNER TIMER ACTIVO
    if (timerActivo) {
        var segsAhora = Math.max(0, Math.floor((Date.now() - timerActivo.inicioTimestamp) / 1000));
        var relojInit = formatearSegundosBarber(segsAhora);
        var metaSegs = 30 * 60;
        var porcInit = Math.min(100, Math.round((segsAhora / metaSegs) * 100));

        html += `
        <div class="barber-timer-banner-active">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                        💈
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 13.5px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">Corte en Proceso (Tiempo Real)</span>
                            <span class="subapp-badge" style="color: #10b981; border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.1);">ACTIVO</span>
                        </div>
                        <div style="font-size: 13px; color: #f8fafc; font-weight: 700; margin-top: 2px;">
                            Cliente: <strong>${escapeHtmlBarber(timerActivo.clienteNombre || 'Cliente Express')}</strong> · Estilo: <em>${escapeHtmlBarber(timerActivo.tipoCorte || 'Corte Personalizado')}</em>
                        </div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 10px;">
                    <button type="button" class="btn-back-system" onclick="descartarTimerCorteBarberia()" style="margin-bottom: 0; padding: 8px 14px; font-size: 11.5px; border-color: rgba(239, 68, 68, 0.4); color: #f87171;" title="Descartar este timer">
                        ✕ Descartar
                    </button>
                    <button type="button" class="btn-system" onclick="pararTimerCorteBarberia()" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; font-size: 12.5px; font-weight: 800; padding: 10px 18px; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                        🛑 FINALIZAR CORTE
                    </button>
                </div>
            </div>

            <div style="background: #07090e; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 12px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                        <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8;">Cronómetro:</span>
                        <span id="barber-timer-clock-display" style="font-size: 26px; font-weight: 800; color: #38bdf8; font-family: monospace; letter-spacing: 1px;">${relojInit}</span>
                    </div>
                    <span id="barber-timer-percent-text" style="font-size: 12px; font-weight: 700; color: #94a3b8;">${Math.round(segsAhora / 60)} / 30 min (${porcInit}%)</span>
                </div>
                <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.08); border-radius: 999px; overflow: hidden;">
                    <div id="barber-timer-progress-fill" style="width: ${porcInit}%; height: 100%; background: linear-gradient(90deg, #38bdf8 0%, #0284c7 100%); transition: width 0.5s ease;"></div>
                </div>
            </div>
        </div>
        `;
    }

    // 2. SELECTOR DE MES Y MÉTRICAS CLAVE
    html += `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 10px 14px;">
        <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="btn-subapp-mes-nav" onclick="cambiarMesBarberia(-1)" title="Mes Anterior">◀</button>
            <span style="font-size: 14px; font-weight: 800; color: #f8fafc; min-width: 150px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">${nombreMesStr}</span>
            <button type="button" class="btn-subapp-mes-nav" onclick="cambiarMesBarberia(1)" title="Mes Siguiente">▶</button>
        </div>
        <div style="font-size: 11.5px; color: #94a3b8;">
            Atención a domicilio · Total histórico: <strong style="color: #38bdf8;">${cortes.length} cortes</strong>
        </div>
    </div>

    <!-- TARJETAS DE MÉTRICAS DEL MES -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 20px;">
        <div style="background: #0b0e15; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #10b981; margin-bottom: 4px;">💵 Recaudado</div>
            <div style="font-size: 20px; font-weight: 800; color: #10b981;">$${totalGananciasMes.toFixed(2)}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">en cortes del mes</div>
        </div>

        <div style="background: #0b0e15; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #38bdf8; margin-bottom: 4px;">✂️ Cortes</div>
            <div style="font-size: 20px; font-weight: 800; color: #38bdf8;">${cortesMes.length}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">servicios realizados</div>
        </div>

        <div style="background: #0b0e15; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #f59e0b; margin-bottom: 4px;">⏱️ Tiempo</div>
            <div style="font-size: 20px; font-weight: 800; color: #f59e0b;">${totalHorasMes}h</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${totalMinutosMes} min dedicados</div>
        </div>

        <div style="background: #0b0e15; border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #c084fc; margin-bottom: 4px;">👥 Clientes</div>
            <div style="font-size: 20px; font-weight: 800; color: #c084fc;">${clientesUnicosCount}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">personas atendidas</div>
        </div>
    </div>

    <!-- TABS DE NAVEGACIÓN INTERNA -->
    <div style="display: flex; border-bottom: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 18px; gap: 4px; overflow-x: auto;">
        <button type="button" class="barber-subtab-btn ${TAB_BARBERIA_ACTIVA === 'calendario' ? 'active' : ''}" onclick="setTabBarberia('calendario')">
            <span>📅</span> Calendario de Jornadas
        </button>
        <button type="button" class="barber-subtab-btn ${TAB_BARBERIA_ACTIVA === 'clientes' ? 'active' : ''}" onclick="setTabBarberia('clientes')">
            <span>👥</span> Catálogo de Clientes (${clientes.length})
        </button>
        <button type="button" class="barber-subtab-btn ${TAB_BARBERIA_ACTIVA === 'tipos-corte' ? 'active' : ''}" onclick="setTabBarberia('tipos-corte')">
            <span>✂️</span> Catálogo de Cortes (${tiposCorte.length})
        </button>
        <button type="button" class="barber-subtab-btn ${TAB_BARBERIA_ACTIVA === 'historial' ? 'active' : ''}" onclick="setTabBarberia('historial')">
            <span>📜</span> Historial de Cortes (${cortes.length})
        </button>
    </div>
    `;

    // 3. RENDERIZADO DEL CONTENIDO DE LA TAB ACTIVA
    if (TAB_BARBERIA_ACTIVA === 'calendario') {
        html += renderizarHtmlCalendarioBarberia(MES_BARBERIA_ACTUAL, cortes);
    } else if (TAB_BARBERIA_ACTIVA === 'clientes') {
        html += renderizarHtmlCatalogoClientesBarberia(clientes, cortes);
    } else if (TAB_BARBERIA_ACTIVA === 'tipos-corte') {
        html += renderizarHtmlCatalogoTiposCorteBarberia(tiposCorte, cortes);
    } else if (TAB_BARBERIA_ACTIVA === 'historial') {
        html += renderizarHtmlHistorialCortesBarberia(cortes);
    }

    cont.innerHTML = html;
}

function renderizarHtmlCalendarioBarberia(mesClave, cortes) {
    var partes = mesClave.split('-');
    var anio = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10);
    var diasEnMes = new Date(anio, mes, 0).getDate();

    var primerDiaSemana = new Date(anio, mes - 1, 1).getDay();
    // Ajustar para que Lunes = 0, Domingo = 6
    var offset = (primerDiaSemana === 0) ? 6 : primerDiaSemana - 1;

    var hoyStr = new Date().toISOString().slice(0, 10);

    var diasSemana = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    var html = `
    <div>
        <p style="font-size: 12px; color: #94a3b8; margin: 0 0 12px 0;">
            Sin días libres obligatorios: toca cualquier día para ver los cortes realizados o registrar servicios puntuales.
        </p>

        <!-- Cabecera de días de la semana -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 6px; text-align: center;">
    `;

    diasSemana.forEach(function(d) {
        html += `<div style="font-size: 11px; font-weight: 800; color: #64748b; padding: 4px 0;">${d}</div>`;
    });

    html += `</div>
        <!-- Grid de días del mes -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;">
    `;

    // Celdas vacías de compensación previa
    for (var o = 0; o < offset; o++) {
        html += `<div style="min-height: 84px; background: transparent; border: 1px dashed rgba(255, 255, 255, 0.03); border-radius: 12px; opacity: 0.3;"></div>`;
    }

    // Celdas de cada día del mes
    for (var d = 1; d <= diasEnMes; d++) {
        var fechaStr = mesClave + '-' + (d < 10 ? '0' + d : d);
        var esHoy = (fechaStr === hoyStr);

        var cortesDia = cortes.filter(function(c) { return c.fecha === fechaStr; });
        var totalCortesDia = cortesDia.length;
        var dineroDia = cortesDia.reduce(function(acc, c) { return acc + (parseFloat(c.cobro) || 0); }, 0);
        var minutosDia = cortesDia.reduce(function(acc, c) { return acc + (parseInt(c.duracionMinutos, 10) || 0); }, 0);

        var clasesDia = 'barber-dia-card' + (totalCortesDia > 0 ? ' con-cortes' : '') + (esHoy ? ' hoy' : '');

        html += `
        <div class="${clasesDia}" onclick="verDetalleDiaBarber('${fechaStr}')" title="Ver detalles del ${fechaStr}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; font-weight: 800; color: ${esHoy ? '#38bdf8' : '#f8fafc'};">${d}</span>
                ${totalCortesDia > 0 ? `<span style="font-size: 9px; font-weight: 800; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 4px; padding: 1px 4px;">✂️ ${totalCortesDia}</span>` : ''}
            </div>

            <div style="margin-top: 4px;">
                ${totalCortesDia > 0 ? `
                    <div style="font-size: 11px; font-weight: 800; color: #10b981;">+$${dineroDia.toFixed(0)}</div>
                    <div style="font-size: 9.5px; color: #94a3b8;">${minutosDia} min</div>
                ` : `
                    <div style="font-size: 9.5px; color: #475569; margin-top: 8px;">Disponible</div>
                `}
            </div>
        </div>
        `;
    }

    html += `
        </div>
    </div>
    `;

    return html;
}

function renderizarHtmlCatalogoClientesBarberia(clientes, cortes) {
    var filtro = (BUSQUEDA_CLIENTE_BARBERIA || '').trim().toLowerCase();
    var clientesFiltrados = clientes.filter(function(cl) {
        if (!filtro) return true;
        var nom = (cl.nombre || '').toLowerCase();
        var cor = (cl.corteHabitual || '').toLowerCase();
        var dir = (cl.direccion || '').toLowerCase();
        return nom.includes(filtro) || cor.includes(filtro) || dir.includes(filtro);
    });

    var hoyMs = Date.now();

    var html = `
    <div>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
            <div style="flex: 1; min-width: 200px;">
                <input type="text" value="${escapeHtmlBarber(BUSQUEDA_CLIENTE_BARBERIA)}" placeholder="🔍 Buscar cliente por nombre, corte o dirección..." oninput="filtrarClientesBarberia(this.value)" class="finanzas-input-clean" style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.1); color: #f8fafc; border-radius: 10px; padding: 10px 14px; width: 100%; box-sizing: border-box; font-size: 13px;">
            </div>
            <button type="button" class="btn-system" onclick="abrirModalClienteBarberia()" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border: none; font-weight: 800; font-size: 12px; padding: 10px 16px; border-radius: 10px; cursor: pointer;">
                <span>➕</span> Crear Nuevo Cliente
            </button>
        </div>
    `;

    if (clientesFiltrados.length === 0) {
        html += `
        <div style="background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 30px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">👥</div>
            <div style="font-size: 14px; font-weight: 700; color: #f8fafc; margin-bottom: 4px;">No hay clientes registrados</div>
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 14px 0;">
                Registra a las personas que atiendes a domicilio para recordar su cobro acordado, corte habitual y fecha de su último afeitado.
            </p>
            <button type="button" class="btn-system" onclick="abrirModalClienteBarberia()" style="background: #0284c7; color: #ffffff; border: none; font-weight: 800; font-size: 12px; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
                + Registrar Primer Cliente
            </button>
        </div>
        `;
    } else {
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">`;

        clientesFiltrados.forEach(function(cl) {
            // Calcular iniciales
            var partesNom = (cl.nombre || 'Cliente').trim().split(/\s+/);
            var iniciales = (partesNom[0] ? partesNom[0][0] : '') + (partesNom[1] ? partesNom[1][0] : '');
            iniciales = iniciales.toUpperCase() || 'CL';

            // Cortes de este cliente
            var cortesDeEste = cortes.filter(function(c) {
                return (c.clienteId && c.clienteId === cl.id) || (c.clienteNombre && c.clienteNombre.trim().toLowerCase() === cl.nombre.trim().toLowerCase());
            });

            // Última vez atendido
            var ultimaVezTexto = 'Nunca atendido';
            if (cl.ultimaVez) {
                var partesF = cl.ultimaVez.split('-');
                if (partesF.length === 3) {
                    var fechaUlt = new Date(parseInt(partesF[0], 10), parseInt(partesF[1], 10) - 1, parseInt(partesF[2], 10));
                    var difDias = Math.floor((hoyMs - fechaUlt.getTime()) / (1000 * 60 * 60 * 24));
                    if (difDias === 0) {
                        ultimaVezTexto = 'Hoy';
                    } else if (difDias === 1) {
                        ultimaVezTexto = 'Ayer';
                    } else if (difDias > 1) {
                        ultimaVezTexto = 'Hace ' + difDias + ' días (' + cl.ultimaVez + ')';
                    } else {
                        ultimaVezTexto = cl.ultimaVez;
                    }
                } else {
                    ultimaVezTexto = cl.ultimaVez;
                }
            }

            html += `
            <div class="barber-cliente-card">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="barber-avatar-initials">${escapeHtmlBarber(iniciales)}</div>
                        <div>
                            <div style="font-size: 14px; font-weight: 800; color: #f8fafc;">${escapeHtmlBarber(cl.nombre)}</div>
                            <div style="font-size: 11px; color: #94a3b8;">${cl.telefono ? '📞 ' + escapeHtmlBarber(cl.telefono) : 'Sin teléfono'}</div>
                        </div>
                    </div>
                    <span style="font-size: 13px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 3px 8px;">
                        $${parseFloat(cl.cobroHabitual || 0).toFixed(0)}
                    </span>
                </div>

                <div style="background: #0b0e15; border-radius: 8px; padding: 8px 10px; margin-bottom: 10px; font-size: 11.5px;">
                    <div style="color: #cbd5e1; margin-bottom: 3px;">
                        ✂️ <strong>Corte:</strong> ${escapeHtmlBarber(cl.corteHabitual || 'Sin estilo registrado')}
                    </div>
                    <div style="color: #94a3b8;">
                        🕒 <strong>Última vez:</strong> <span style="color: #38bdf8; font-weight: 700;">${escapeHtmlBarber(ultimaVezTexto)}</span>
                    </div>
                    ${cl.direccion ? `<div style="color: #64748b; margin-top: 3px;">📍 ${escapeHtmlBarber(cl.direccion)}</div>` : ''}
                </div>

                <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn-system" onclick="abrirModalIniciarCorte('${cl.id}')" style="flex: 2; justify-content: center; font-size: 11.5px; font-weight: 800; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border: none; padding: 7px 10px; border-radius: 8px; cursor: pointer;">
                        ✂️ Iniciar Corte
                    </button>
                    <button type="button" class="btn-system" onclick="verFichaClienteBarberia('${cl.id}')" style="flex: 1; justify-content: center; font-size: 11.5px; font-weight: 700; background: rgba(255, 255, 255, 0.05); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1); padding: 7px 8px; border-radius: 8px; cursor: pointer;">
                        📋 Ficha
                    </button>
                    <button type="button" class="btn-system" onclick="abrirModalClienteBarberia('${cl.id}')" style="font-size: 11.5px; background: rgba(255, 255, 255, 0.05); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.1); padding: 7px 10px; border-radius: 8px; cursor: pointer;" title="Editar Cliente">
                        ✏️
                    </button>
                </div>
            </div>
            `;
        });

        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

function filtrarClientesBarberia(query) {
    BUSQUEDA_CLIENTE_BARBERIA = query;
    renderizarSubAppBarberia();
}

function renderizarHtmlHistorialCortesBarberia(cortes) {
    if (!cortes || cortes.length === 0) {
        return `
        <div style="background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 30px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">📜</div>
            <div style="font-size: 14px; font-weight: 700; color: #f8fafc; margin-bottom: 4px;">No hay cortes registrados en el historial</div>
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 14px 0;">
                Cada vez que inicies un corte con el timer y lo finalices, se acumulará automáticamente aquí.
            </p>
            <button type="button" class="btn-system" onclick="abrirModalIniciarCorte()" style="background: #0284c7; color: #ffffff; border: none; font-weight: 800; font-size: 12px; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
                ✂️ Iniciar Primer Corte
            </button>
        </div>
        `;
    }

    var cortesOrdenados = cortes.slice().sort(function(a, b) {
        return (b.fecha + ' ' + (b.hora || '00:00')).localeCompare(a.fecha + ' ' + (a.hora || '00:00'));
    });

    var html = `
    <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    cortesOrdenados.forEach(function(c) {
        html += `
        <div style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">
                    ✂️
                </div>
                <div>
                    <div style="font-size: 13.5px; font-weight: 800; color: #f8fafc;">
                        ${escapeHtmlBarber(c.clienteNombre || 'Cliente')} 
                        <span style="font-size: 11px; font-weight: 600; color: #38bdf8; margin-left: 6px;">${escapeHtmlBarber(c.tipoCorte || 'Corte')}</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                        📅 ${c.fecha} ${c.hora ? '· 🕒 ' + c.hora : ''} · ⏱️ ${c.duracionMinutos || 0} min
                    </div>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 15px; font-weight: 800; color: #10b981;">+$${parseFloat(c.cobro || 0).toFixed(2)}</span>
                <button type="button" onclick="eliminarCorteBarberia('${c.id}')" style="background: none; border: none; color: #ef4444; font-size: 14px; cursor: pointer; padding: 4px;" title="Eliminar registro de corte">
                    🗑️
                </button>
            </div>
        </div>
        `;
    });

    html += `</div>`;
    return html;
}

// --------------------------------------------------------------------------
// LÓGICA DE TIMER Y REGISTRO DE CORTES
// --------------------------------------------------------------------------

function abrirModalIniciarCorte(clienteIdPreseleccionado, estiloPreseleccionado) {
    asegurarEstructuraBarberia();
    var modal = document.getElementById('modal-iniciar-corte-barber');
    if (!modal) return;

    var sel = document.getElementById('select-iniciar-corte-cliente');
    var inTipo = document.getElementById('input-iniciar-corte-tipo');
    var inNuevo = document.getElementById('input-iniciar-cliente-nuevo-nombre');
    var contNuevo = document.getElementById('contenedor-cliente-nuevo-express');

    if (sel) {
        var clientes = APP_STATE.subappBarberia.clientes || [];
        var opts = '<option value="">-- Cliente Rápido / Escribir Nombre --</option>';
        clientes.forEach(function(cl) {
            var selected = (clienteIdPreseleccionado && cl.id === clienteIdPreseleccionado) ? 'selected' : '';
            opts += `<option value="${cl.id}" ${selected}>${escapeHtmlBarber(cl.nombre)} ($${cl.cobroHabitual || 0})</option>`;
        });
        sel.innerHTML = opts;
    }

    if (clienteIdPreseleccionado) {
        var clFound = (APP_STATE.subappBarberia.clientes || []).find(function(c) { return c.id === clienteIdPreseleccionado; });
        if (clFound && inTipo) {
            inTipo.value = clFound.corteHabitual || '';
        }
        if (contNuevo) contNuevo.style.display = 'none';
    } else {
        if (contNuevo) contNuevo.style.display = 'block';
        if (inNuevo) inNuevo.value = '';
        if (inTipo) inTipo.value = '';
    }

    if (estiloPreseleccionado && inTipo) {
        inTipo.value = estiloPreseleccionado;
    }

    renderizarChipsTiposCorte('chips-tipos-corte-iniciar', 'input-iniciar-corte-tipo');

    modal.style.display = 'flex';
}

function cerrarModalIniciarCorte() {
    var modal = document.getElementById('modal-iniciar-corte-barber');
    if (modal) modal.style.display = 'none';
}

function alCambiarClienteEnIniciarCorte() {
    var sel = document.getElementById('select-iniciar-corte-cliente');
    var contNuevo = document.getElementById('contenedor-cliente-nuevo-express');
    var inTipo = document.getElementById('input-iniciar-corte-tipo');
    if (!sel) return;

    if (!sel.value) {
        if (contNuevo) contNuevo.style.display = 'block';
    } else {
        if (contNuevo) contNuevo.style.display = 'none';
        var cl = (APP_STATE.subappBarberia.clientes || []).find(function(c) { return c.id === sel.value; });
        if (cl && inTipo && !inTipo.value) {
            inTipo.value = cl.corteHabitual || '';
        }
    }
}

function confirmarIniciarCorteBarberia() {
    asegurarEstructuraBarberia();
    var sel = document.getElementById('select-iniciar-corte-cliente');
    var inNuevo = document.getElementById('input-iniciar-cliente-nuevo-nombre');
    var inTipo = document.getElementById('input-iniciar-corte-tipo');

    var clienteId = sel ? sel.value : '';
    var clienteNombre = '';

    if (clienteId) {
        var cl = (APP_STATE.subappBarberia.clientes || []).find(function(c) { return c.id === clienteId; });
        if (cl) clienteNombre = cl.nombre;
    } else {
        clienteNombre = inNuevo ? inNuevo.value.trim() : '';
        if (!clienteNombre) clienteNombre = 'Cliente Express';
    }

    var tipoCorte = inTipo ? inTipo.value.trim() : '';
    if (!tipoCorte) tipoCorte = 'Corte Estándar';

    APP_STATE.subappBarberia.timerActivo = {
        inicioTimestamp: Date.now(),
        clienteId: clienteId || null,
        clienteNombre: clienteNombre,
        tipoCorte: tipoCorte
    };

    MonarcaDB.save(APP_STATE);
    cerrarModalIniciarCorte();
    iniciarIntervaloTimerBarberia();
    renderizarSubAppBarberia();
}

function descartarTimerCorteBarberia() {
    if (!confirm("¿Deseas descartar el timer del corte en curso? No se guardará ningún registro.")) return;
    asegurarEstructuraBarberia();
    APP_STATE.subappBarberia.timerActivo = null;
    if (INTERVALO_TIMER_BARBERIA) {
        clearInterval(INTERVALO_TIMER_BARBERIA);
        INTERVALO_TIMER_BARBERIA = null;
    }
    MonarcaDB.save(APP_STATE);
    renderizarSubAppBarberia();
}

function pararTimerCorteBarberia() {
    asegurarEstructuraBarberia();
    var timer = APP_STATE.subappBarberia.timerActivo;
    if (!timer) return;

    var ahora = Date.now();
    var segs = Math.max(0, Math.floor((ahora - timer.inicioTimestamp) / 1000));
    var mins = Math.max(1, Math.round(segs / 60));

    CORTE_TEMPORAL_FINALIZANDO = {
        inicioTimestamp: timer.inicioTimestamp,
        finTimestamp: ahora,
        duracionSegundos: segs,
        duracionMinutos: mins,
        clienteId: timer.clienteId,
        clienteNombre: timer.clienteNombre,
        tipoCorte: timer.tipoCorte
    };

    // Pre-cargar modal de finalización
    var modal = document.getElementById('modal-finalizar-corte-barber');
    if (!modal) return;

    var elDisplay = document.getElementById('fin-corte-display-tiempo');
    var elMins = document.getElementById('fin-corte-display-minutos');
    var inCliente = document.getElementById('fin-corte-input-cliente');
    var inTipo = document.getElementById('fin-corte-input-tipo');
    var inCobro = document.getElementById('fin-corte-input-cobro');

    if (elDisplay) elDisplay.textContent = formatearSegundosBarber(segs);
    if (elMins) elMins.textContent = '(' + mins + ' min de servicio)';
    if (inCliente) inCliente.value = timer.clienteNombre || '';
    if (inTipo) inTipo.value = timer.tipoCorte || '';

    // Buscar si el cliente tiene cobro habitual
    var cobroSugerido = 10;
    if (timer.clienteId) {
        var cl = (APP_STATE.subappBarberia.clientes || []).find(function(c) { return c.id === timer.clienteId; });
        if (cl && cl.cobroHabitual) cobroSugerido = parseFloat(cl.cobroHabitual);
    }
    if (inCobro) inCobro.value = cobroSugerido;

    renderizarChipsTiposCorte('chips-tipos-corte-finalizar', 'fin-corte-input-tipo', 'fin-corte-input-cobro');

    modal.style.display = 'flex';
}

function cerrarModalFinalizarCorte() {
    var modal = document.getElementById('modal-finalizar-corte-barber');
    if (modal) modal.style.display = 'none';
}

function guardarCorteFinalizado() {
    asegurarEstructuraBarberia();
    if (!CORTE_TEMPORAL_FINALIZANDO) {
        cerrarModalFinalizarCorte();
        return;
    }

    var inCliente = document.getElementById('fin-corte-input-cliente');
    var inTipo = document.getElementById('fin-corte-input-tipo');
    var inCobro = document.getElementById('fin-corte-input-cobro');
    var checkFinanzas = document.getElementById('fin-corte-check-finanzas');

    var clienteNom = inCliente ? inCliente.value.trim() : '';
    if (!clienteNom) clienteNom = CORTE_TEMPORAL_FINALIZANDO.clienteNombre || 'Cliente';

    var tipoCorte = inTipo ? inTipo.value.trim() : '';
    if (!tipoCorte) tipoCorte = CORTE_TEMPORAL_FINALIZANDO.tipoCorte || 'Corte Personalizado';

    var cobro = inCobro ? parseFloat(inCobro.value) || 0 : 0;
    var duracionMinutos = CORTE_TEMPORAL_FINALIZANDO.duracionMinutos || 1;

    var hoy = new Date();
    var hoyFechaStr = hoy.toISOString().slice(0, 10);
    var horaStr = hoy.toTimeString().slice(0, 5);

    // 1. Vincular o actualizar cliente en el catálogo
    var clienteId = CORTE_TEMPORAL_FINALIZANDO.clienteId;
    var clExistente = null;

    if (clienteId) {
        clExistente = (APP_STATE.subappBarberia.clientes || []).find(function(c) { return c.id === clienteId; });
    }
    if (!clExistente) {
        clExistente = (APP_STATE.subappBarberia.clientes || []).find(function(c) {
            return c.nombre.trim().toLowerCase() === clienteNom.trim().toLowerCase();
        });
    }

    if (clExistente) {
        clExistente.ultimaVez = hoyFechaStr;
        if (!clExistente.cobroHabitual && cobro > 0) clExistente.cobroHabitual = cobro;
        if (!clExistente.corteHabitual && tipoCorte) clExistente.corteHabitual = tipoCorte;
        clienteId = clExistente.id;
    } else {
        // Crear cliente automático si no existe
        clienteId = 'CLI-' + Date.now();
        var nuevoCl = {
            id: clienteId,
            nombre: clienteNom,
            cobroHabitual: cobro,
            corteHabitual: tipoCorte,
            telefono: '',
            direccion: '',
            ultimaVez: hoyFechaStr,
            notas: 'Creado automáticamente tras finalizar corte'
        };
        APP_STATE.subappBarberia.clientes.push(nuevoCl);
    }

    // 2. Crear registro de Corte
    var nuevoCorte = {
        id: 'CORTE-' + Date.now(),
        fecha: hoyFechaStr,
        hora: horaStr,
        clienteId: clienteId,
        clienteNombre: clienteNom,
        tipoCorte: tipoCorte,
        duracionMinutos: duracionMinutos,
        cobro: cobro,
        registradoEnFinanzas: checkFinanzas ? checkFinanzas.checked : true
    };
    APP_STATE.subappBarberia.cortes.unshift(nuevoCorte);

    // 3. Acumular el tiempo a la sesión del día en registrosLabores (LAB-BARBER)
    if (!Array.isArray(APP_STATE.registrosLabores)) APP_STATE.registrosLabores = [];
    var horasCorte = +(duracionMinutos / 60).toFixed(2);

    // Buscar si ya existe una sesión de Barbería hoy
    var sesionHoy = APP_STATE.registrosLabores.find(function(r) {
        return r.laborId === 'LAB-BARBER' && r.fecha === hoyFechaStr;
    });

    if (sesionHoy) {
        sesionHoy.horas = +(parseFloat(sesionHoy.horas || 0) + horasCorte).toFixed(2);
        sesionHoy.descripcion = 'Cortes del día (' + duracionMinutos + ' min corte a ' + clienteNom + ')';
    } else {
        APP_STATE.registrosLabores.unshift({
            id: 'SES-BARBER-' + Date.now(),
            laborId: 'LAB-BARBER',
            fecha: hoyFechaStr,
            horas: horasCorte,
            descripcion: 'Corte: ' + tipoCorte + ' a ' + clienteNom + ' (' + duracionMinutos + ' min)',
            notas: 'Registrado desde Sub-App Barbería',
            timestamp: Date.now()
        });
    }

    // Sumar EXP al jugador
    if (typeof sumarExpJugador === 'function') {
        var expGained = Math.max(10, Math.round(horasCorte * 10));
        sumarExpJugador(expGained, "Corte de Barbería a " + clienteNom);
    }

    // 4. Si el checkbox está activo, registrar ingreso en Finanzas
    if (checkFinanzas && checkFinanzas.checked && cobro > 0) {
        if (!APP_STATE.finanzas) APP_STATE.finanzas = {};
        if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];
        APP_STATE.finanzas.ingresos.unshift({
            id: 'ING-' + Date.now(),
            fecha: hoyFechaStr,
            categoria: '💼 Labores & Servicios',
            descripcion: 'Barbería: Corte a ' + clienteNom + ' (' + tipoCorte + ')',
            monto: cobro,
            tipo: 'Laboral',
            recurrencia: 'Puntual'
        });
    }

    // 5. Limpiar timer activo
    APP_STATE.subappBarberia.timerActivo = null;
    CORTE_TEMPORAL_FINALIZANDO = null;
    if (INTERVALO_TIMER_BARBERIA) {
        clearInterval(INTERVALO_TIMER_BARBERIA);
        INTERVALO_TIMER_BARBERIA = null;
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalFinalizarCorte();
    renderizarSubAppBarberia();

    alert("💈 ¡Corte registrado con éxito!\n- Duración: " + duracionMinutos + " min (" + horasCorte + " hrs sumadas a la labor)\n- Cobro: $" + cobro.toFixed(2) + "\n- Cliente: " + clienteNom);
}

function eliminarCorteBarberia(corteId) {
    if (!confirm("¿Deseas eliminar este registro de corte del historial?")) return;
    asegurarEstructuraBarberia();
    registrarTombstone('subappBarberia_cortes', corteId);
    APP_STATE.subappBarberia.cortes = APP_STATE.subappBarberia.cortes.filter(function(c) { return c.id !== corteId; });
    MonarcaDB.save(APP_STATE);
    renderizarSubAppBarberia();
}

// --------------------------------------------------------------------------
// GESTIÓN DEL CATÁLOGO DE CLIENTES
// --------------------------------------------------------------------------

function abrirModalClienteBarberia(clienteId) {
    asegurarEstructuraBarberia();
    var modal = document.getElementById('modal-cliente-barber');
    if (!modal) return;

    var inId = document.getElementById('input-cliente-barber-id');
    var inNom = document.getElementById('input-cliente-barber-nombre');
    var inCob = document.getElementById('input-cliente-barber-cobro');
    var inTel = document.getElementById('input-cliente-barber-telefono');
    var inCor = document.getElementById('input-cliente-barber-corte');
    var inDir = document.getElementById('input-cliente-barber-direccion');
    var inNot = document.getElementById('input-cliente-barber-notas');
    var tit = document.getElementById('titulo-modal-cliente-barber');

    if (clienteId) {
        var cl = (APP_STATE.subappBarberia.clientes || []).find(function(c) { return c.id === clienteId; });
        if (cl) {
            if (tit) tit.textContent = 'EDITAR CLIENTE';
            if (inId) inId.value = cl.id;
            if (inNom) inNom.value = cl.nombre || '';
            if (inCob) inCob.value = cl.cobroHabitual || '';
            if (inTel) inTel.value = cl.telefono || '';
            if (inCor) inCor.value = cl.corteHabitual || '';
            if (inDir) inDir.value = cl.direccion || '';
            if (inNot) inNot.value = cl.notas || '';
        }
    } else {
        if (tit) tit.textContent = 'CREAR NUEVO CLIENTE';
        if (inId) inId.value = '';
        if (inNom) inNom.value = '';
        if (inCob) inCob.value = '10.00';
        if (inTel) inTel.value = '';
        if (inCor) inCor.value = '';
        if (inDir) inDir.value = '';
        if (inNot) inNot.value = '';
    }

    renderizarChipsTiposCorte('chips-tipos-corte-cliente', 'input-cliente-barber-corte', 'input-cliente-barber-cobro');

    modal.style.display = 'flex';
}

function cerrarModalClienteBarberia() {
    var modal = document.getElementById('modal-cliente-barber');
    if (modal) modal.style.display = 'none';
}

function guardarClienteBarberia() {
    asegurarEstructuraBarberia();
    var inId = document.getElementById('input-cliente-barber-id');
    var inNom = document.getElementById('input-cliente-barber-nombre');
    var inCob = document.getElementById('input-cliente-barber-cobro');
    var inTel = document.getElementById('input-cliente-barber-telefono');
    var inCor = document.getElementById('input-cliente-barber-corte');
    var inDir = document.getElementById('input-cliente-barber-direccion');
    var inNot = document.getElementById('input-cliente-barber-notas');

    var nom = inNom ? inNom.value.trim() : '';
    if (!nom) {
        alert("Por favor ingresa el nombre del cliente.");
        return;
    }

    var id = inId ? inId.value : '';
    var cobro = inCob ? parseFloat(inCob.value) || 0 : 0;
    var tel = inTel ? inTel.value.trim() : '';
    var cor = inCor ? inCor.value.trim() : '';
    var dir = inDir ? inDir.value.trim() : '';
    var not = inNot ? inNot.value.trim() : '';

    if (id) {
        var cl = (APP_STATE.subappBarberia.clientes || []).find(function(c) { return c.id === id; });
        if (cl) {
            cl.nombre = nom;
            cl.cobroHabitual = cobro;
            cl.telefono = tel;
            cl.corteHabitual = cor;
            cl.direccion = dir;
            cl.notas = not;
        }
    } else {
        var nuevo = {
            id: 'CLI-' + Date.now(),
            nombre: nom,
            cobroHabitual: cobro,
            telefono: tel,
            corteHabitual: cor,
            direccion: dir,
            notas: not,
            ultimaVez: ''
        };
        APP_STATE.subappBarberia.clientes.push(nuevo);
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalClienteBarberia();
    renderizarSubAppBarberia();
    alert("💾 Cliente guardado correctamente en el catálogo.");
}

function verFichaClienteBarberia(clienteId) {
    asegurarEstructuraBarberia();
    var cl = (APP_STATE.subappBarberia.clientes || []).find(function(c) { return c.id === clienteId; });
    if (!cl) return;

    var modal = document.getElementById('modal-ficha-cliente-barber');
    var cont = document.getElementById('contenido-ficha-cliente-barber');
    if (!modal || !cont) return;

    var cortes = (APP_STATE.subappBarberia.cortes || []).filter(function(c) {
        return (c.clienteId && c.clienteId === cl.id) || (c.clienteNombre && c.clienteNombre.trim().toLowerCase() === cl.nombre.trim().toLowerCase());
    });

    var totalGastado = cortes.reduce(function(acc, c) { return acc + (parseFloat(c.cobro) || 0); }, 0);
    var totalMinutos = cortes.reduce(function(acc, c) { return acc + (parseInt(c.duracionMinutos, 10) || 0); }, 0);

    // Calcular días desde última vez
    var ultimaVezTexto = 'Nunca atendido';
    if (cl.ultimaVez) {
        var partesF = cl.ultimaVez.split('-');
        if (partesF.length === 3) {
            var fechaUlt = new Date(parseInt(partesF[0], 10), parseInt(partesF[1], 10) - 1, parseInt(partesF[2], 10));
            var difDias = Math.floor((Date.now() - fechaUlt.getTime()) / (1000 * 60 * 60 * 24));
            if (difDias === 0) ultimaVezTexto = 'Hoy (' + cl.ultimaVez + ')';
            else if (difDias === 1) ultimaVezTexto = 'Ayer (' + cl.ultimaVez + ')';
            else ultimaVezTexto = 'Hace ' + difDias + ' días (' + cl.ultimaVez + ')';
        } else {
            ultimaVezTexto = cl.ultimaVez;
        }
    }

    var html = `
    <div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="barber-avatar-initials" style="width: 48px; height: 48px; font-size: 18px;">
                    ${escapeHtmlBarber(cl.nombre.slice(0, 2).toUpperCase())}
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #f8fafc;">${escapeHtmlBarber(cl.nombre)}</h3>
                    <div style="font-size: 12px; color: #94a3b8;">${cl.telefono ? '📞 ' + escapeHtmlBarber(cl.telefono) : 'Sin teléfono registrado'}</div>
                </div>
            </div>
            <button type="button" class="btn-system" onclick="cerrarModalFichaClienteBarberia(); abrirModalClienteBarberia('${cl.id}')" style="background: rgba(255, 255, 255, 0.05); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1); font-size: 11.5px; padding: 6px 12px; border-radius: 8px;">
                ✏️ Editar
            </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
            <div style="background: #0b0e15; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 10px 12px;">
                <span style="font-size: 10.5px; text-transform: uppercase; font-weight: 700; color: #10b981; display: block; margin-bottom: 2px;">Cobro Acordado</span>
                <span style="font-size: 18px; font-weight: 800; color: #10b981;">$${parseFloat(cl.cobroHabitual || 0).toFixed(2)}</span>
            </div>
            <div style="background: #0b0e15; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 10px 12px;">
                <span style="font-size: 10.5px; text-transform: uppercase; font-weight: 700; color: #38bdf8; display: block; margin-bottom: 2px;">Cortes Recibidos</span>
                <span style="font-size: 18px; font-weight: 800; color: #38bdf8;">${cortes.length}</span>
            </div>
        </div>

        <div style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px; margin-bottom: 16px; font-size: 12.5px; line-height: 1.5;">
            <div style="color: #cbd5e1; margin-bottom: 6px;">
                ✂️ <strong>Corte Preferido:</strong> <span style="color: #38bdf8;">${escapeHtmlBarber(cl.corteHabitual || 'Sin estilo registrado')}</span>
            </div>
            <div style="color: #cbd5e1; margin-bottom: 6px;">
                🕒 <strong>Última vez afeitado:</strong> <strong style="color: #f59e0b;">${escapeHtmlBarber(ultimaVezTexto)}</strong>
            </div>
            ${cl.direccion ? `<div style="color: #cbd5e1; margin-bottom: 6px;">📍 <strong>Domicilio:</strong> ${escapeHtmlBarber(cl.direccion)}</div>` : ''}
            ${cl.notas ? `<div style="color: #94a3b8; font-size: 11.5px; margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(255, 255, 255, 0.08);">📝 <em>${escapeHtmlBarber(cl.notas)}</em></div>` : ''}
        </div>

        <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; font-weight: 800; color: #f8fafc; text-transform: uppercase; margin-bottom: 8px;">
                📜 Historial de Cortes de este Cliente (${cortes.length})
            </div>
            <div style="max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
    `;

    if (cortes.length === 0) {
        html += `<div style="font-size: 12px; color: #64748b; padding: 10px; text-align: center;">Aún no hay cortes registrados con este cliente.</div>`;
    } else {
        cortes.forEach(function(c) {
            html += `
            <div style="background: #07090e; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
                <div>
                    <span style="font-weight: 700; color: #f8fafc;">${escapeHtmlBarber(c.tipoCorte)}</span>
                    <span style="color: #64748b; margin-left: 6px;">${c.fecha}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #94a3b8;">${c.duracionMinutos || 0} min</span>
                    <span style="font-weight: 800; color: #10b981;">+$${parseFloat(c.cobro || 0).toFixed(0)}</span>
                </div>
            </div>
            `;
        });
    }

    html += `
            </div>
        </div>

        <div style="display: flex; gap: 8px;">
            <button type="button" class="btn-back-system" style="flex: 1; justify-content: center; margin-bottom: 0;" onclick="cerrarModalFichaClienteBarberia()">Cerrar</button>
            <button type="button" class="btn-system" style="flex: 2; justify-content: center; margin-bottom: 0; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border: none; font-weight: 800;" onclick="cerrarModalFichaClienteBarberia(); abrirModalIniciarCorte('${cl.id}')">✂️ Iniciar Corte con este Cliente</button>
        </div>
    </div>
    `;

    cont.innerHTML = html;
    modal.style.display = 'flex';
}

function cerrarModalFichaClienteBarberia() {
    var modal = document.getElementById('modal-ficha-cliente-barber');
    if (modal) modal.style.display = 'none';
}

function verDetalleDiaBarber(fechaStr) {
    asegurarEstructuraBarberia();
    var modal = document.getElementById('modal-detalle-dia-barber');
    var cont = document.getElementById('contenido-modal-detalle-dia-barber');
    var tit = document.getElementById('titulo-modal-detalle-dia-barber');
    if (!modal || !cont) return;

    if (tit) tit.textContent = 'JORNADA: ' + fechaStr;

    var cortes = (APP_STATE.subappBarberia.cortes || []).filter(function(c) {
        return c.fecha === fechaStr;
    });

    var totalDinero = cortes.reduce(function(acc, c) { return acc + (parseFloat(c.cobro) || 0); }, 0);
    var totalMinutos = cortes.reduce(function(acc, c) { return acc + (parseInt(c.duracionMinutos, 10) || 0); }, 0);

    var html = `
    <div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px;">
            <div style="background: #0b0e15; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 10px; text-align: center;">
                <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #10b981; display: block;">Recaudado</span>
                <span style="font-size: 16px; font-weight: 800; color: #10b981;">+$${totalDinero.toFixed(2)}</span>
            </div>
            <div style="background: #0b0e15; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 10px; text-align: center;">
                <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #38bdf8; display: block;">Cortes</span>
                <span style="font-size: 16px; font-weight: 800; color: #38bdf8;">${cortes.length}</span>
            </div>
            <div style="background: #0b0e15; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 10px; padding: 10px; text-align: center;">
                <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #f59e0b; display: block;">Tiempo</span>
                <span style="font-size: 16px; font-weight: 800; color: #f59e0b;">${totalMinutos} min</span>
            </div>
        </div>

        <div style="font-size: 12px; font-weight: 800; color: #f8fafc; text-transform: uppercase; margin-bottom: 8px;">
            ✂️ Cortes del Día
        </div>
        <div style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
    `;

    if (cortes.length === 0) {
        html += `
        <div style="background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            No hubo servicios de barbería registrados en este día.
        </div>
        `;
    } else {
        cortes.forEach(function(c) {
            html += `
            <div style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 13px; font-weight: 800; color: #f8fafc;">
                        ${escapeHtmlBarber(c.clienteNombre || 'Cliente')} 
                        <span style="font-size: 11px; color: #38bdf8; font-weight: 600;">(${escapeHtmlBarber(c.tipoCorte)})</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8;">
                        🕒 ${c.hora || 'Sin hora'} · ⏱️ ${c.duracionMinutos || 0} min
                    </div>
                </div>
                <div style="font-size: 14px; font-weight: 800; color: #10b981;">
                    +$${parseFloat(c.cobro || 0).toFixed(2)}
                </div>
            </div>
            `;
        });
    }

    html += `
        </div>

        <div style="display: flex; gap: 8px;">
            <button type="button" class="btn-back-system" style="flex: 1; justify-content: center; margin-bottom: 0;" onclick="cerrarModalDetalleDiaBarber()">Listo / Cerrar</button>
            <button type="button" class="btn-system" style="flex: 2; justify-content: center; margin-bottom: 0; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border: none; font-weight: 800;" onclick="cerrarModalDetalleDiaBarber(); abrirModalIniciarCorte()">✂️ Iniciar Nuevo Corte</button>
        </div>
    </div>
    `;

    cont.innerHTML = html;
    modal.style.display = 'flex';
}

function cerrarModalDetalleDiaBarber() {
    var modal = document.getElementById('modal-detalle-dia-barber');
    if (modal) modal.style.display = 'none';
}

// --------------------------------------------------------------------------
// GESTIÓN DEL CATÁLOGO DE CORTES / ESTILOS
// --------------------------------------------------------------------------

function renderizarChipsTiposCorte(containerId, inputNombreId, inputPrecioId) {
    var cont = document.getElementById(containerId);
    if (!cont) return;

    asegurarEstructuraBarberia();
    var tipos = APP_STATE.subappBarberia.tiposCorte || [];
    if (tipos.length === 0) {
        cont.innerHTML = '<span style="font-size: 11px; color: #64748b;">(Sin tipos de corte en catálogo)</span>';
        return;
    }

    var html = '';
    tipos.forEach(function(t) {
        var nomEsc = escapeHtmlBarber(t.nombre);
        var preNum = parseFloat(t.precio || 0);
        html += `
        <button type="button" class="chip-tipo-corte-select" onclick="seleccionarChipTipoCorte('${inputNombreId}', '${inputPrecioId || ''}', '${nomEsc}', ${preNum})">
            <span>✂️</span> ${nomEsc} <strong style="color: #10b981;">($${preNum.toFixed(0)})</strong>
        </button>
        `;
    });
    cont.innerHTML = html;
}

function seleccionarChipTipoCorte(inputNombreId, inputPrecioId, nombre, precio) {
    var inNom = document.getElementById(inputNombreId);
    if (inNom) inNom.value = nombre;

    if (inputPrecioId) {
        var inPre = document.getElementById(inputPrecioId);
        if (inPre && precio > 0) inPre.value = precio;
    }
}

function renderizarHtmlCatalogoTiposCorteBarberia(tiposCorte, cortes) {
    var filtro = (BUSQUEDA_TIPO_CORTE_BARBERIA || '').trim().toLowerCase();
    var tiposFiltrados = tiposCorte.filter(function(t) {
        if (!filtro) return true;
        var nom = (t.nombre || '').toLowerCase();
        var des = (t.descripcion || '').toLowerCase();
        return nom.includes(filtro) || des.includes(filtro);
    });

    var html = `
    <div>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
            <div style="flex: 1; min-width: 200px;">
                <input type="text" value="${escapeHtmlBarber(BUSQUEDA_TIPO_CORTE_BARBERIA)}" placeholder="🔍 Buscar corte por nombre o técnica..." oninput="filtrarTiposCorteBarberia(this.value)" class="finanzas-input-clean" style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.1); color: #f8fafc; border-radius: 10px; padding: 10px 14px; width: 100%; box-sizing: border-box; font-size: 13px;">
            </div>
            <button type="button" class="btn-system" onclick="abrirModalTipoCorteBarberia()" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border: none; font-weight: 800; font-size: 12px; padding: 10px 16px; border-radius: 10px; cursor: pointer;">
                <span>➕</span> Nuevo Tipo de Corte
            </button>
        </div>
    `;

    if (tiposFiltrados.length === 0) {
        html += `
        <div style="background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 30px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">✂️</div>
            <div style="font-size: 14px; font-weight: 700; color: #f8fafc; margin-bottom: 4px;">No se encontraron tipos de corte</div>
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 14px 0;">
                Registra los estilos y servicios que ofreces para auto-completar los cobros y tiempos en tus sesiones.
            </p>
            <button type="button" class="btn-system" onclick="abrirModalTipoCorteBarberia()" style="background: #0284c7; color: #ffffff; border: none; font-weight: 800; font-size: 12px; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
                + Crear Estilo de Corte
            </button>
        </div>
        `;
    } else {
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">`;

        tiposFiltrados.forEach(function(t) {
            var vecesRealizado = cortes.filter(function(c) {
                var cNom = (c.tipoCorte || '').toLowerCase();
                var tNom = (t.nombre || '').toLowerCase();
                return cNom.includes(tNom) || tNom.includes(cNom);
            }).length;

            html += `
            <div class="barber-tipo-corte-card">
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 20px;">✂️</span>
                            <div style="font-size: 14.5px; font-weight: 800; color: #f8fafc;">${escapeHtmlBarber(t.nombre)}</div>
                        </div>
                        <span style="font-size: 13.5px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 3px 8px;">
                            $${parseFloat(t.precio || 0).toFixed(2)}
                        </span>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                        <span style="font-size: 11px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 2px 7px;">
                            ⏱️ ${t.tiempoMin || 30} min estimados
                        </span>
                        <span style="font-size: 11px; color: #94a3b8;">
                            💈 Realizado: <strong style="color: #cbd5e1;">${vecesRealizado} veces</strong>
                        </span>
                    </div>

                    <div style="background: #0b0e15; border-radius: 8px; padding: 9px 11px; margin-bottom: 12px; font-size: 12px; color: #cbd5e1; line-height: 1.4; min-height: 38px;">
                        ${escapeHtmlBarber(t.descripcion || 'Sin descripción técnica registrada.')}
                    </div>
                </div>

                <div style="display: flex; gap: 6px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
                    <button type="button" class="btn-system" onclick="abrirModalIniciarCorte(null, '${escapeHtmlBarber(t.nombre)}')" style="flex: 2; justify-content: center; font-size: 11.5px; font-weight: 800; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border: none; padding: 7px 10px; border-radius: 8px; cursor: pointer;">
                        ✂️ Iniciar este Corte
                    </button>
                    <button type="button" class="btn-system" onclick="abrirModalTipoCorteBarberia('${t.id}')" style="flex: 1; justify-content: center; font-size: 11.5px; font-weight: 700; background: rgba(255, 255, 255, 0.05); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1); padding: 7px 8px; border-radius: 8px; cursor: pointer;" title="Editar Estilo">
                        ✏️ Editar
                    </button>
                    <button type="button" onclick="eliminarTipoCorteBarberia('${t.id}')" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: #ef4444; font-size: 13px; border-radius: 8px; padding: 7px 10px; cursor: pointer;" title="Eliminar este Estilo">
                        🗑️
                    </button>
                </div>
            </div>
            `;
        });

        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

function abrirModalTipoCorteBarberia(tipoId) {
    asegurarEstructuraBarberia();
    var modal = document.getElementById('modal-tipo-corte-barber');
    if (!modal) return;

    var inId = document.getElementById('input-tipo-corte-id');
    var inNom = document.getElementById('input-tipo-corte-nombre');
    var inPre = document.getElementById('input-tipo-corte-precio');
    var inTie = document.getElementById('input-tipo-corte-tiempo');
    var inDes = document.getElementById('input-tipo-corte-descripcion');
    var tit = document.getElementById('titulo-modal-tipo-corte-barber');

    if (tipoId) {
        var t = (APP_STATE.subappBarberia.tiposCorte || []).find(function(item) { return item.id === tipoId; });
        if (t) {
            if (tit) tit.textContent = 'EDITAR TIPO DE CORTE';
            if (inId) inId.value = t.id;
            if (inNom) inNom.value = t.nombre || '';
            if (inPre) inPre.value = t.precio || '';
            if (inTie) inTie.value = t.tiempoMin || 30;
            if (inDes) inDes.value = t.descripcion || '';
        }
    } else {
        if (tit) tit.textContent = 'CREAR TIPO DE CORTE';
        if (inId) inId.value = '';
        if (inNom) inNom.value = '';
        if (inPre) inPre.value = '10.00';
        if (inTie) inTie.value = '30';
        if (inDes) inDes.value = '';
    }

    modal.style.display = 'flex';
}

function cerrarModalTipoCorteBarberia() {
    var modal = document.getElementById('modal-tipo-corte-barber');
    if (modal) modal.style.display = 'none';
}

function guardarTipoCorteBarberia() {
    asegurarEstructuraBarberia();
    var inId = document.getElementById('input-tipo-corte-id');
    var inNom = document.getElementById('input-tipo-corte-nombre');
    var inPre = document.getElementById('input-tipo-corte-precio');
    var inTie = document.getElementById('input-tipo-corte-tiempo');
    var inDes = document.getElementById('input-tipo-corte-descripcion');

    var nom = inNom ? inNom.value.trim() : '';
    if (!nom) {
        alert("Por favor ingresa el nombre del tipo de corte.");
        return;
    }

    var id = inId ? inId.value : '';
    var pre = inPre ? parseFloat(inPre.value) || 0 : 0;
    var tie = inTie ? parseInt(inTie.value, 10) || 30 : 30;
    var des = inDes ? inDes.value.trim() : '';

    if (id) {
        var t = (APP_STATE.subappBarberia.tiposCorte || []).find(function(item) { return item.id === id; });
        if (t) {
            t.nombre = nom;
            t.precio = pre;
            t.tiempoMin = tie;
            t.descripcion = des;
        }
    } else {
        var nuevo = {
            id: 'ESTILO-' + Date.now(),
            nombre: nom,
            precio: pre,
            tiempoMin: tie,
            descripcion: des
        };
        APP_STATE.subappBarberia.tiposCorte.push(nuevo);
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalTipoCorteBarberia();
    renderizarSubAppBarberia();
    alert("✂️ Tipo de corte guardado exitosamente en el catálogo.");
}

function eliminarTipoCorteBarberia(tipoId) {
    if (!confirm("¿Deseas eliminar este tipo de corte del catálogo?")) return;
    asegurarEstructuraBarberia();
    registrarTombstone('subappBarberia_tiposCorte', tipoId);
    APP_STATE.subappBarberia.tiposCorte = APP_STATE.subappBarberia.tiposCorte.filter(function(t) { return t.id !== tipoId; });
    MonarcaDB.save(APP_STATE);
    renderizarSubAppBarberia();
}

function filtrarTiposCorteBarberia(query) {
    BUSQUEDA_TIPO_CORTE_BARBERIA = query;
    renderizarSubAppBarberia();
}

/* ==========================================================================
   SUB-APP OFICIAL: PERSONAL TRAINER (COACHING FÍSICO, ALUMNOS & ENTRENAMIENTOS)
   ========================================================================== */

var TAB_TRAINER_ACTIVA = 'calendario'; // 'calendario' | 'alumnos' | 'enfoques' | 'historial'
var INTERVALO_TIMER_TRAINER = null;
var ENTRENAMIENTO_TEMPORAL_FINALIZANDO = null;
var BUSQUEDA_ALUMNO_TRAINER = '';
var BUSQUEDA_ENFOQUE_TRAINER = '';
var FILTRO_HISTORIAL_TRAINER_ALUMNO = '';
var MES_TRAINER_ACTUAL = (function() {
    var d = new Date();
    var m = d.getMonth() + 1;
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m);
})();

function escapeHtmlTrainer(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(new RegExp('"', 'g'), '&quot;')
        .replace(new RegExp("'", "g"), '&#39;');
}

function asegurarEstructuraTrainer() {
    if (!APP_STATE.subappTrainer || typeof APP_STATE.subappTrainer !== 'object') {
        APP_STATE.subappTrainer = {};
    }
    if (!Array.isArray(APP_STATE.subappTrainer.alumnos)) {
        APP_STATE.subappTrainer.alumnos = [];
    }
    if (!Array.isArray(APP_STATE.subappTrainer.sesiones)) {
        APP_STATE.subappTrainer.sesiones = [];
    }
    if (typeof APP_STATE.subappTrainer.tiempoPromedioMetaMin !== 'number') {
        APP_STATE.subappTrainer.tiempoPromedioMetaMin = 60;
    }
    if (APP_STATE.subappTrainer.timerActivo === undefined) {
        APP_STATE.subappTrainer.timerActivo = null;
    }
    if (!Array.isArray(APP_STATE.subappTrainer.rutinasEnfoques) || APP_STATE.subappTrainer.rutinasEnfoques.length === 0) {
        APP_STATE.subappTrainer.rutinasEnfoques = [
            { id: "ENF-1", nombre: "Pierna & Glúteos (Hipertrofia)", precio: 15, tiempoMin: 60, descripcion: "Sentadilla, peso muerto rumano, prensa 45° y accesorios de glúteo/isquios." },
            { id: "ENF-2", nombre: "Pecho, Hombro & Tríceps (Push)", precio: 15, tiempoMin: 60, descripcion: "Press banca plano/inclinado, press militar y aperturas con extensiones de tríceps." },
            { id: "ENF-3", nombre: "Espalda & Bíceps (Pull)", precio: 15, tiempoMin: 60, descripcion: "Dominadas / jalón al pecho, remo con barra, facepulls y curls aislados de bíceps." },
            { id: "ENF-4", nombre: "Fullbody Funcional & MetCon", precio: 15, tiempoMin: 50, descripcion: "Circuitos metabólicos continuos de alta intensidad y fuerza global." },
            { id: "ENF-5", nombre: "Fuerza Máxima / Powerlifting", precio: 18, tiempoMin: 75, descripcion: "Series de aproximación y cargas pesadas en los 3 básicos con descansos completos." },
            { id: "ENF-6", nombre: "Core, Abdomen & HIIT", precio: 12, tiempoMin: 45, descripcion: "Estabilidad del core, planchas dinámicas y remate cardiovascular metabólico." }
        ];
    }
}

function cargarSubAppTrainer() {
    asegurarEstructuraTrainer();
    iniciarIntervaloTimerTrainer();
    renderizarSubAppTrainer();
}

function setTabTrainer(tab) {
    TAB_TRAINER_ACTIVA = tab;
    renderizarSubAppTrainer();
}

function cambiarMesTrainer(delta) {
    var partes = MES_TRAINER_ACTUAL.split('-');
    var anio = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10) - 1;
    var nuevaFecha = new Date(anio, mes + delta, 1);
    var mNum = nuevaFecha.getMonth() + 1;
    MES_TRAINER_ACTUAL = nuevaFecha.getFullYear() + '-' + (mNum < 10 ? '0' + mNum : mNum);
    renderizarSubAppTrainer();
}

function formatearSegundosTrainer(segundosTotales) {
    var hrs = Math.floor(segundosTotales / 3600);
    var mins = Math.floor((segundosTotales % 3600) / 60);
    var segs = segundosTotales % 60;
    var segsStr = segs < 10 ? '0' + segs : String(segs);
    var minsStr = mins < 10 ? '0' + mins : String(mins);
    if (hrs > 0) {
        var hrsStr = hrs < 10 ? '0' + hrs : String(hrs);
        return hrsStr + ':' + minsStr + ':' + segsStr;
    }
    return minsStr + ':' + segsStr;
}

function calcularAntiguedadAlumno(fechaIngreso) {
    if (!fechaIngreso) return 'Sin fecha registrada';
    var ingreso = new Date(fechaIngreso + 'T00:00:00');
    var hoy = new Date();
    if (isNaN(ingreso.getTime())) return fechaIngreso;

    var diffMs = hoy.getTime() - ingreso.getTime();
    if (diffMs < 0) return 'Ingreso futuro programado';

    var diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDias === 0) return 'Ingresó hoy';
    if (diffDias === 1) return 'Ingresó ayer (1 día)';
    if (diffDias < 7) return diffDias + ' días en el gym';

    var semanas = Math.floor(diffDias / 7);
    if (diffDias < 30) return semanas + (semanas === 1 ? ' semana' : ' semanas') + ' en el gym';

    var meses = Math.floor(diffDias / 30.4375);
    if (meses < 12) return meses + (meses === 1 ? ' mes' : ' meses') + ' en el gym';

    var anios = Math.floor(meses / 12);
    var mesesRest = meses % 12;
    var texto = anios + (anios === 1 ? ' año' : ' años');
    if (mesesRest > 0) texto += ' y ' + mesesRest + (mesesRest === 1 ? ' mes' : ' meses');
    return texto + ' en el gym';
}

function iniciarIntervaloTimerTrainer() {
    if (INTERVALO_TIMER_TRAINER) {
        clearInterval(INTERVALO_TIMER_TRAINER);
        INTERVALO_TIMER_TRAINER = null;
    }
    if (APP_STATE.subappTrainer && APP_STATE.subappTrainer.timerActivo) {
        INTERVALO_TIMER_TRAINER = setInterval(function() {
            actualizarDisplayTimerTrainerVivo();
        }, 1000);
    }
}

function actualizarDisplayTimerTrainerVivo() {
    var timer = APP_STATE.subappTrainer ? APP_STATE.subappTrainer.timerActivo : null;
    if (!timer) return;

    var elDisplay = document.getElementById('trainer-timer-clock-display');
    var elBarra = document.getElementById('trainer-timer-progress-fill');
    var elPorc = document.getElementById('trainer-timer-percent-text');

    var ahora = Date.now();
    var segsTranscurridos = Math.max(0, Math.floor((ahora - timer.inicioTimestamp) / 1000));
    var textoReloj = formatearSegundosTrainer(segsTranscurridos);

    if (elDisplay) elDisplay.textContent = textoReloj;

    var metaSegs = (APP_STATE.subappTrainer.tiempoPromedioMetaMin || 60) * 60;
    var porc = Math.min(100, Math.round((segsTranscurridos / metaSegs) * 100));

    if (elBarra) {
        elBarra.style.width = porc + '%';
        if (porc >= 100) {
            elBarra.style.background = 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)';
        }
    }
    if (elPorc) {
        elPorc.textContent = Math.round(segsTranscurridos / 60) + ' / 60 min (' + porc + '%)';
    }
}

function renderizarSubAppTrainer() {
    asegurarEstructuraTrainer();
    var cont = document.getElementById('subapp-trainer-content');
    if (!cont) return;

    var alumnos = APP_STATE.subappTrainer.alumnos || [];
    var sesiones = APP_STATE.subappTrainer.sesiones || [];
    var rutinas = APP_STATE.subappTrainer.rutinasEnfoques || [];
    var timerActivo = APP_STATE.subappTrainer.timerActivo;

    // Actualizar botón superior si hay sesión activa
    var btnTop = document.getElementById('btn-iniciar-entrenamiento-top');
    if (btnTop) {
        if (timerActivo) {
            btnTop.innerHTML = '<span>🛑</span> Finalizar Sesión';
            btnTop.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            btnTop.onclick = function() { pararTimerEntrenamiento(); };
        } else {
            btnTop.innerHTML = '<span>🏋️‍♂️</span> Iniciar Entrenamiento';
            btnTop.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            btnTop.onclick = function() { abrirModalIniciarEntrenamiento(); };
        }
    }

    // Filtrar sesiones del mes seleccionado
    var sesionesMes = sesiones.filter(function(s) {
        return s.fecha && s.fecha.startsWith(MES_TRAINER_ACTUAL);
    });

    var totalGananciasMes = sesionesMes.reduce(function(acc, s) { return acc + (parseFloat(s.cobro) || 0); }, 0);
    var totalMinutosMes = sesionesMes.reduce(function(acc, s) { return acc + (parseInt(s.duracionMinutos, 10) || 0); }, 0);
    var totalHorasMes = (totalMinutosMes / 60).toFixed(1);

    var alumnosUnicosSet = {};
    sesionesMes.forEach(function(s) {
        if (s.alumnoNombre) alumnosUnicosSet[s.alumnoNombre.trim().toLowerCase()] = true;
    });
    var alumnosUnicosCount = Object.keys(alumnosUnicosSet).length;

    var partes = MES_TRAINER_ACTUAL.split('-');
    var anio = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10) - 1;
    var nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    var nombreMesStr = (nombresMeses[mes] || '') + ' ' + anio;

    var html = '';

    // 1. BANNER TIMER ACTIVO
    if (timerActivo) {
        var segsAhora = Math.max(0, Math.floor((Date.now() - timerActivo.inicioTimestamp) / 1000));
        var relojInit = formatearSegundosTrainer(segsAhora);
        var metaSegs = 60 * 60;
        var porcInit = Math.min(100, Math.round((segsAhora / metaSegs) * 100));

        html += `
        <div class="trainer-timer-banner-active">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                        🏋️‍♂️
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 13.5px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;">Entrenamiento en Curso (En Vivo)</span>
                            <span class="subapp-badge" style="color: #10b981; border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.1);">ACTIVO</span>
                        </div>
                        <div style="font-size: 13px; color: #f8fafc; font-weight: 700; margin-top: 2px;">
                            Alumno: <strong>${escapeHtmlTrainer(timerActivo.alumnoNombre || 'Alumno Express')}</strong> · Enfoque: <em>${escapeHtmlTrainer(timerActivo.enfoque || 'Rutina Personalizada')}</em>
                        </div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 10px;">
                    <button type="button" class="btn-back-system" onclick="descartarTimerEntrenamiento()" style="margin-bottom: 0; padding: 8px 14px; font-size: 11.5px; border-color: rgba(239, 68, 68, 0.4); color: #f87171;" title="Descartar este timer">
                        ✕ Descartar
                    </button>
                    <button type="button" class="btn-system" onclick="pararTimerEntrenamiento()" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; font-size: 12.5px; font-weight: 800; padding: 10px 18px; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                        🛑 FINALIZAR SESIÓN
                    </button>
                </div>
            </div>

            <div style="background: #07090e; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 12px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                        <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8;">Cronómetro:</span>
                        <span id="trainer-timer-clock-display" style="font-size: 26px; font-weight: 800; color: #10b981; font-family: monospace; letter-spacing: 1px;">${relojInit}</span>
                    </div>
                    <span id="trainer-timer-percent-text" style="font-size: 12px; font-weight: 700; color: #94a3b8;">${Math.round(segsAhora / 60)} / 60 min (${porcInit}%)</span>
                </div>
                <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.08); border-radius: 999px; overflow: hidden;">
                    <div id="trainer-timer-progress-fill" style="width: ${porcInit}%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); transition: width 0.5s ease;"></div>
                </div>
            </div>
        </div>
        `;
    }

    // 2. SELECTOR DE MES Y MÉTRICAS CLAVE
    html += `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 10px 14px;">
        <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="btn-subapp-mes-nav" onclick="cambiarMesTrainer(-1)" title="Mes Anterior">◀</button>
            <span style="font-size: 14px; font-weight: 800; color: #f8fafc; min-width: 150px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">${nombreMesStr}</span>
            <button type="button" class="btn-subapp-mes-nav" onclick="cambiarMesTrainer(1)" title="Mes Siguiente">▶</button>
        </div>
        <div style="font-size: 11.5px; color: #94a3b8;">
            Gimnasio & Coaching · Total histórico: <strong style="color: #10b981;">${sesiones.length} sesiones</strong>
        </div>
    </div>

    <!-- TARJETAS DE MÉTRICAS DEL MES -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 20px;">
        <div style="background: #0b0e15; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #10b981; margin-bottom: 4px;">💵 Recaudado</div>
            <div style="font-size: 20px; font-weight: 800; color: #10b981;">$${totalGananciasMes.toFixed(2)}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">en sesiones del mes</div>
        </div>

        <div style="background: #0b0e15; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #38bdf8; margin-bottom: 4px;">🏋️‍♂️ Entrenamientos</div>
            <div style="font-size: 20px; font-weight: 800; color: #38bdf8;">${sesionesMes.length}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">sesiones guiadas</div>
        </div>

        <div style="background: #0b0e15; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #f59e0b; margin-bottom: 4px;">⏱️ Tiempo</div>
            <div style="font-size: 20px; font-weight: 800; color: #f59e0b;">${totalHorasMes}h</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${totalMinutosMes} min en piso</div>
        </div>

        <div style="background: #0b0e15; border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #c084fc; margin-bottom: 4px;">👥 Alumnos</div>
            <div style="font-size: 20px; font-weight: 800; color: #c084fc;">${alumnosUnicosCount}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">activos este mes</div>
        </div>
    </div>
    `;

    // 3. BARRA DE SUB-TABS (CALENDARIO / ALUMNOS / ENFOQUES / HISTORIAL)
    html += `
    <div style="display: flex; gap: 4px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 20px; overflow-x: auto;">
        <button type="button" class="trainer-subtab-btn ${TAB_TRAINER_ACTIVA === 'calendario' ? 'active' : ''}" onclick="setTabTrainer('calendario')">
            <span>📅</span> Calendario Mensual
        </button>
        <button type="button" class="trainer-subtab-btn ${TAB_TRAINER_ACTIVA === 'alumnos' ? 'active' : ''}" onclick="setTabTrainer('alumnos')">
            <span>👥</span> Catálogo de Alumnos (${alumnos.length})
        </button>
        <button type="button" class="trainer-subtab-btn ${TAB_TRAINER_ACTIVA === 'enfoques' ? 'active' : ''}" onclick="setTabTrainer('enfoques')">
            <span>🎯</span> Rutinas & Enfoques (${rutinas.length})
        </button>
        <button type="button" class="trainer-subtab-btn ${TAB_TRAINER_ACTIVA === 'historial' ? 'active' : ''}" onclick="setTabTrainer('historial')">
            <span>📋</span> Historial (${sesiones.length})
        </button>
    </div>
    `;

    // 4. CONTENIDO DEL TAB SELECCIONADO
    if (TAB_TRAINER_ACTIVA === 'calendario') {
        html += renderizarHtmlCalendarioTrainer(anio, mes, sesiones);
    } else if (TAB_TRAINER_ACTIVA === 'alumnos') {
        html += renderizarHtmlCatalogoAlumnosTrainer(alumnos, sesiones);
    } else if (TAB_TRAINER_ACTIVA === 'enfoques') {
        html += renderizarHtmlCatalogoEnfoquesTrainer(rutinas);
    } else if (TAB_TRAINER_ACTIVA === 'historial') {
        html += renderizarHtmlHistorialEntrenamientosTrainer(sesiones, alumnos);
    }

    cont.innerHTML = html;
}

function renderizarHtmlCalendarioTrainer(anio, mes, todasLasSesiones) {
    var primerDiaMes = new Date(anio, mes, 1);
    var ultimoDiaMes = new Date(anio, mes + 1, 0);
    var diasEnMes = ultimoDiaMes.getDate();
    var primerDiaSemana = primerDiaMes.getDay(); // 0 = Domingo, 1 = Lunes

    var mNum = mes + 1;
    var mesPrefix = anio + '-' + (mNum < 10 ? '0' + mNum : mNum);

    // Agrupar sesiones por día
    var sesionesPorDia = {};
    todasLasSesiones.forEach(function(s) {
        if (s.fecha && s.fecha.startsWith(mesPrefix)) {
            var diaNum = parseInt(s.fecha.split('-')[2], 10);
            if (!sesionesPorDia[diaNum]) {
                sesionesPorDia[diaNum] = [];
            }
            sesionesPorDia[diaNum].push(s);
        }
    });

    var hoy = new Date();
    var hoyDia = (hoy.getFullYear() === anio && hoy.getMonth() === mes) ? hoy.getDate() : -1;

    var html = `
    <div style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
            <div>
                <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #f8fafc;">Jornadas de Entrenamiento por Demanda</h3>
                <span style="font-size: 12px; color: #94a3b8;">Toca cualquier día para ver las sesiones realizadas o registrar entrenamientos.</span>
            </div>
            <button type="button" class="btn-system" onclick="abrirModalIniciarEntrenamiento()" style="font-size: 11.5px; font-weight: 700; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 6px 12px; border-radius: 8px; cursor: pointer;">
                + Iniciar Sesión Hoy
            </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 8px; text-align: center;">
            <div style="font-size: 11px; font-weight: 800; color: #64748b;">DOM</div>
            <div style="font-size: 11px; font-weight: 800; color: #64748b;">LUN</div>
            <div style="font-size: 11px; font-weight: 800; color: #64748b;">MAR</div>
            <div style="font-size: 11px; font-weight: 800; color: #64748b;">MIÉ</div>
            <div style="font-size: 11px; font-weight: 800; color: #64748b;">JUE</div>
            <div style="font-size: 11px; font-weight: 800; color: #64748b;">VIE</div>
            <div style="font-size: 11px; font-weight: 800; color: #64748b;">SÁB</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;">
    `;

    // Celdas vacías antes del primer día
    for (var i = 0; i < primerDiaSemana; i++) {
        html += '<div style="min-height: 84px; background: rgba(255, 255, 255, 0.02); border-radius: 12px; opacity: 0.3;"></div>';
    }

    // Celdas de cada día del mes
    for (var dia = 1; dia <= diasEnMes; dia++) {
        var sesDia = sesionesPorDia[dia] || [];
        var cantSes = sesDia.length;
        var gananciaDia = sesDia.reduce(function(acc, s) { return acc + (parseFloat(s.cobro) || 0); }, 0);
        var minutosDia = sesDia.reduce(function(acc, s) { return acc + (parseInt(s.duracionMinutos, 10) || 0); }, 0);
        var horasDia = (minutosDia / 60).toFixed(1);

        var diaStr = (dia < 10 ? '0' + dia : dia);
        var fechaCompleta = mesPrefix + '-' + diaStr;

        var clases = 'trainer-dia-card';
        if (cantSes > 0) clases += ' con-sesiones';
        if (dia === hoyDia) clases += ' hoy';

        html += `
        <div class="${clases}" onclick="verDetalleDiaTrainer('${fechaCompleta}')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; font-weight: 800; color: ${dia === hoyDia ? '#10b981' : '#f8fafc'};">${dia}</span>
                ${dia === hoyDia ? '<span style="font-size: 9px; font-weight: 800; background: #10b981; color: #000; padding: 1px 4px; border-radius: 4px;">HOY</span>' : ''}
            </div>

            <div>
                ${cantSes > 0 ? `
                    <div style="font-size: 10px; font-weight: 800; color: #10b981; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        🏋️‍♂️ ${cantSes} ${cantSes === 1 ? 'ses.' : 'ses.'}
                    </div>
                    <div style="font-size: 10px; font-weight: 800; color: #38bdf8;">
                        +$${gananciaDia.toFixed(0)}
                    </div>
                    <div style="font-size: 9px; color: #94a3b8;">
                        ${horasDia}h
                    </div>
                ` : `
                    <div style="font-size: 10px; color: #475569; margin-top: 6px;">—</div>
                `}
            </div>
        </div>
        `;
    }

    html += `
        </div>
    </div>
    `;

    return html;
}

function renderizarHtmlCatalogoAlumnosTrainer(alumnos, sesiones) {
    var query = (BUSQUEDA_ALUMNO_TRAINER || '').toLowerCase().trim();
    var filtrados = alumnos.filter(function(a) {
        if (!query) return true;
        var nom = (a.nombre || '').toLowerCase();
        var tel = (a.telefono || '').toLowerCase();
        var obj = (a.objetivo || '').toLowerCase();
        var gen = (a.genero || '').toLowerCase();
        return nom.indexOf(query) !== -1 || tel.indexOf(query) !== -1 || obj.indexOf(query) !== -1 || gen.indexOf(query) !== -1;
    });

    var html = `
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="flex: 1; min-width: 250px;">
            <input type="text" value="${escapeHtmlTrainer(BUSQUEDA_ALUMNO_TRAINER)}" placeholder="🔍 Buscar alumno por nombre, objetivo, género o teléfono..." oninput="filtrarAlumnosTrainer(this.value)" class="finanzas-input-clean" style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.1); color: #f8fafc; border-radius: 10px; padding: 10px 14px; width: 100%; box-sizing: border-box; font-size: 13px;">
        </div>
        <button type="button" class="btn-system" onclick="abrirModalAlumnoTrainer()" style="font-size: 12.5px; font-weight: 800; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            <span>➕</span> + Registrar Alumno
        </button>
    </div>
    `;

    if (filtrados.length === 0) {
        html += `
        <div style="background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 40px 20px; text-align: center; color: #94a3b8;">
            <div style="font-size: 36px; margin-bottom: 10px;">🏋️‍♂️</div>
            <div style="font-size: 15px; font-weight: 700; color: #f8fafc; margin-bottom: 4px;">No se encontraron alumnos</div>
            <div style="font-size: 12.5px;">Registra un alumno para gestionar su ficha biométrica (edad, género, altura, peso, fecha de ingreso) e historial de entrenamientos.</div>
            <button type="button" class="btn-system" onclick="abrirModalAlumnoTrainer()" style="margin-top: 14px; font-size: 12px; background: #10b981; color: #000; border: none; padding: 8px 16px; font-weight: 800; border-radius: 8px; cursor: pointer;">
                + Agregar Primer Alumno
            </button>
        </div>
        `;
        return html;
    }

    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px;">';

    filtrados.forEach(function(al) {
        var sesAlumno = sesiones.filter(function(s) {
            return (s.alumnoId && s.alumnoId === al.id) || (s.alumnoNombre && s.alumnoNombre.toLowerCase() === al.nombre.toLowerCase());
        });

        var totalRecaudado = sesAlumno.reduce(function(acc, s) { return acc + (parseFloat(s.cobro) || 0); }, 0);
        var iniciales = al.nombre ? al.nombre.slice(0, 2).toUpperCase() : 'AL';
        var antiguedadTexto = calcularAntiguedadAlumno(al.fechaIngreso);

        var badgeGenero = al.genero === 'Femenino' ? '♀️ Fem' : (al.genero === 'Masculino' ? '♂️ Masc' : '⚧️');

        html += `
        <div class="trainer-alumno-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="trainer-avatar-initials">${escapeHtmlTrainer(iniciales)}</div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="font-size: 14px; font-weight: 800; color: #f8fafc;">${escapeHtmlTrainer(al.nombre)}</div>
                            <span style="font-size: 10px; font-weight: 700; background: rgba(255, 255, 255, 0.07); color: #94a3b8; padding: 2px 5px; border-radius: 4px;">${badgeGenero}</span>
                        </div>
                        <div style="font-size: 11px; color: #94a3b8;">${al.telefono ? '📞 ' + escapeHtmlTrainer(al.telefono) : 'Sin teléfono'}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 14px; font-weight: 800; color: #10b981;">$${(parseFloat(al.tarifaHabitual) || 0).toFixed(2)}</div>
                    <div style="font-size: 9.5px; color: #64748b;">tarifa / sesión</div>
                </div>
            </div>

            <!-- FICHA BIOMÉTRICA RESUMIDA -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; background: #07090e; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 8px; margin-bottom: 10px; text-align: center;">
                <div>
                    <div style="font-size: 9.5px; color: #64748b; text-transform: uppercase;">Edad</div>
                    <div style="font-size: 12px; font-weight: 800; color: #f8fafc;">${al.edad ? al.edad + ' años' : '—'}</div>
                </div>
                <div>
                    <div style="font-size: 9.5px; color: #64748b; text-transform: uppercase;">Altura</div>
                    <div style="font-size: 12px; font-weight: 800; color: #f8fafc;">${al.altura ? al.altura + ' cm' : '—'}</div>
                </div>
                <div>
                    <div style="font-size: 9.5px; color: #64748b; text-transform: uppercase;">Peso</div>
                    <div style="font-size: 12px; font-weight: 800; color: #10b981;">${al.peso ? al.peso + ' kg' : '—'}</div>
                </div>
            </div>

            <div style="font-size: 11.5px; color: #cbd5e1; margin-bottom: 12px; line-height: 1.4;">
                <div>🎯 <strong>Objetivo:</strong> <span style="color: #38bdf8;">${escapeHtmlTrainer(al.objetivo || 'Salud & Acondicionamiento')}</span></div>
                <div style="margin-top: 2px;">📅 <strong>Antigüedad:</strong> <span style="color: #f59e0b; font-weight: 700;">${escapeHtmlTrainer(antiguedadTexto)}</span></div>
                <div style="margin-top: 2px; color: #94a3b8; font-size: 11px;">🏋️‍♂️ <strong>Entrenamientos:</strong> ${sesAlumno.length} sesiones · Total: $${totalRecaudado.toFixed(0)}</div>
            </div>

            <div style="display: flex; gap: 6px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 10px;">
                <button type="button" class="btn-system" onclick="abrirModalIniciarEntrenamiento('${al.id}')" style="flex: 2; justify-content: center; font-size: 11.5px; font-weight: 800; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; padding: 7px 10px; border-radius: 8px; cursor: pointer;">
                    🏋️‍♂️ Iniciar Sesión
                </button>
                <button type="button" class="btn-back-system" onclick="verFichaAlumnoTrainer('${al.id}')" style="flex: 1; justify-content: center; font-size: 11.5px; margin-bottom: 0; padding: 7px 10px; border-radius: 8px; cursor: pointer;" title="Ver ficha biométrica e historial">
                    📋 Ficha
                </button>
                <button type="button" class="btn-back-system" onclick="abrirModalAlumnoTrainer('${al.id}')" style="font-size: 11.5px; margin-bottom: 0; padding: 7px 10px; border-radius: 8px; cursor: pointer;" title="Editar alumno">
                    ✏️
                </button>
                <button type="button" class="btn-back-system" onclick="eliminarAlumnoTrainer('${al.id}')" style="font-size: 11.5px; margin-bottom: 0; padding: 7px 10px; border-radius: 8px; cursor: pointer; color: #f87171; border-color: rgba(239, 68, 68, 0.3);" title="Eliminar alumno">
                    🗑️
                </button>
            </div>
        </div>
        `;
    });

    html += '</div>';
    return html;
}

function renderizarHtmlCatalogoEnfoquesTrainer(rutinas) {
    var query = (BUSQUEDA_ENFOQUE_TRAINER || '').toLowerCase().trim();
    var filtrados = rutinas.filter(function(r) {
        if (!query) return true;
        var nom = (r.nombre || '').toLowerCase();
        var des = (r.descripcion || '').toLowerCase();
        return nom.indexOf(query) !== -1 || des.indexOf(query) !== -1;
    });

    var html = `
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="flex: 1; min-width: 250px;">
            <input type="text" value="${escapeHtmlTrainer(BUSQUEDA_ENFOQUE_TRAINER)}" placeholder="🔍 Buscar enfoque o rutina por nombre o ejercicios..." oninput="filtrarEnfoquesTrainer(this.value)" class="finanzas-input-clean" style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.1); color: #f8fafc; border-radius: 10px; padding: 10px 14px; width: 100%; box-sizing: border-box; font-size: 13px;">
        </div>
        <button type="button" class="btn-system" onclick="abrirModalEnfoqueTrainer()" style="font-size: 12.5px; font-weight: 800; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            <span>➕</span> + Nuevo Enfoque / Rutina
        </button>
    </div>
    `;

    if (filtrados.length === 0) {
        html += `
        <div style="background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 40px 20px; text-align: center; color: #94a3b8;">
            <div style="font-size: 36px; margin-bottom: 10px;">🎯</div>
            <div style="font-size: 15px; font-weight: 700; color: #f8fafc; margin-bottom: 4px;">No se encontraron rutinas</div>
            <div style="font-size: 12.5px;">Agrega enfoques musculares (Pierna, Push, Pull, Fullbody) para auto-completar los entrenamientos.</div>
            <button type="button" class="btn-system" onclick="abrirModalEnfoqueTrainer()" style="margin-top: 14px; font-size: 12px; background: #10b981; color: #000; border: none; padding: 8px 16px; font-weight: 800; border-radius: 8px; cursor: pointer;">
                + Crear Primer Enfoque
            </button>
        </div>
        `;
        return html;
    }

    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">';

    filtrados.forEach(function(r) {
        html += `
        <div class="trainer-enfoque-card">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                        <div style="font-size: 14.5px; font-weight: 800; color: #f8fafc;">${escapeHtmlTrainer(r.nombre)}</div>
                        <span style="font-size: 11px; color: #10b981; font-weight: 700;">⏱️ ${r.tiempoMin || 60} min estimados</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 16px; font-weight: 800; color: #10b981;">$${(parseFloat(r.precio) || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin-bottom: 14px; background: #07090e; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 8px 10px;">
                    ${escapeHtmlTrainer(r.descripcion || 'Sin descripción técnica registrada.')}
                </div>
            </div>

            <div style="display: flex; gap: 6px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 10px;">
                <button type="button" class="btn-system" onclick="abrirModalIniciarEntrenamiento(null, '${escapeHtmlTrainer(r.nombre)}')" style="flex: 2; justify-content: center; font-size: 11.5px; font-weight: 800; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; padding: 7px 10px; border-radius: 8px; cursor: pointer;">
                    🏋️‍♂️ Iniciar Rutina
                </button>
                <button type="button" class="btn-back-system" onclick="abrirModalEnfoqueTrainer('${r.id}')" style="font-size: 11.5px; margin-bottom: 0; padding: 7px 10px; border-radius: 8px; cursor: pointer;" title="Editar enfoque">
                    ✏️
                </button>
                <button type="button" class="btn-back-system" onclick="eliminarEnfoqueTrainer('${r.id}')" style="font-size: 11.5px; margin-bottom: 0; padding: 7px 10px; border-radius: 8px; cursor: pointer; color: #f87171; border-color: rgba(239, 68, 68, 0.3);" title="Eliminar enfoque">
                    🗑️
                </button>
            </div>
        </div>
        `;
    });

    html += '</div>';
    return html;
}

function renderizarHtmlHistorialEntrenamientosTrainer(sesiones, alumnos) {
    var alumnoFiltro = FILTRO_HISTORIAL_TRAINER_ALUMNO || '';
    var filtradas = sesiones.filter(function(s) {
        if (!alumnoFiltro) return true;
        return (s.alumnoId && s.alumnoId === alumnoFiltro) || (s.alumnoNombre && s.alumnoNombre.toLowerCase() === alumnoFiltro.toLowerCase());
    });

    var html = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px;">
            <label style="font-size: 12px; color: #94a3b8; font-weight: 700;">Filtrar por Alumno:</label>
            <select class="finanzas-input-clean" onchange="filtrarHistorialTrainerPorAlumno(this.value)" style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.1); color: #f8fafc; border-radius: 8px; padding: 6px 12px; font-size: 12.5px;">
                <option value="">Todos los Alumnos (${sesiones.length})</option>
    `;

    alumnos.forEach(function(al) {
        var sel = alumnoFiltro === al.id ? 'selected' : '';
        html += `<option value="${al.id}" ${sel}>${escapeHtmlTrainer(al.nombre)}</option>`;
    });

    html += `
            </select>
        </div>
        <div style="font-size: 12px; color: #94a3b8;">
            Mostrando: <strong style="color: #10b981;">${filtradas.length}</strong> de ${sesiones.length} sesiones
        </div>
    </div>
    `;

    if (filtradas.length === 0) {
        html += `
        <div style="background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 40px 20px; text-align: center; color: #94a3b8;">
            <div style="font-size: 32px; margin-bottom: 8px;">📋</div>
            <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">No hay entrenamientos en este historial</div>
            <div style="font-size: 12px; margin-top: 4px;">Usa el botón "Iniciar Entrenamiento" para registrar una sesión en vivo.</div>
        </div>
        `;
        return html;
    }

    html += '<div style="display: flex; flex-direction: column; gap: 8px;">';

    filtradas.forEach(function(s) {
        html += `
        <div style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                    🏋️‍♂️
                </div>
                <div>
                    <div style="font-size: 13.5px; font-weight: 800; color: #f8fafc;">
                        ${escapeHtmlTrainer(s.alumnoNombre || 'Alumno')} 
                        <span style="font-size: 11px; font-weight: 600; color: #10b981; margin-left: 6px;">${escapeHtmlTrainer(s.enfoque || 'Entrenamiento')}</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8;">
                        📅 ${s.fecha} · ⏱️ ${s.duracionMinutos || 60} min
                    </div>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="text-align: right;">
                    <div style="font-size: 15px; font-weight: 800; color: #10b981;">+$${(parseFloat(s.cobro) || 0).toFixed(2)}</div>
                    <div style="font-size: 9.5px; color: #64748b;">cobrado</div>
                </div>
                <button type="button" class="btn-back-system" onclick="eliminarEntrenamientoTrainer('${s.id}')" style="margin-bottom: 0; padding: 6px 10px; font-size: 11px; color: #f87171; border-color: rgba(239, 68, 68, 0.3);" title="Eliminar registro">
                    🗑️
                </button>
            </div>
        </div>
        `;
    });

    html += '</div>';
    return html;
}

function filtrarHistorialTrainerPorAlumno(alumnoId) {
    FILTRO_HISTORIAL_TRAINER_ALUMNO = alumnoId;
    renderizarSubAppTrainer();
}

function renderizarChipsEnfoquesTrainer() {
    asegurarEstructuraTrainer();
    var rutinas = APP_STATE.subappTrainer.rutinasEnfoques || [];

    var contIniciar = document.getElementById('chips-enfoques-iniciar');
    if (contIniciar) {
        var html = '';
        rutinas.forEach(function(r) {
            var nomEsc = escapeHtmlTrainer(r.nombre);
            html += `<span class="chip-enfoque-select" onclick="seleccionarChipEnfoqueTrainer('iniciar', '${nomEsc}', ${r.precio || 15})">${nomEsc}</span>`;
        });
        contIniciar.innerHTML = html;
    }

    var contFin = document.getElementById('chips-enfoques-finalizar');
    if (contFin) {
        var html2 = '';
        rutinas.forEach(function(r) {
            var nomEsc = escapeHtmlTrainer(r.nombre);
            html2 += `<span class="chip-enfoque-select" onclick="seleccionarChipEnfoqueTrainer('finalizar', '${nomEsc}', ${r.precio || 15})">${nomEsc}</span>`;
        });
        contFin.innerHTML = html2;
    }
}

function seleccionarChipEnfoqueTrainer(modalContext, nombreEnfoque, precio) {
    if (modalContext === 'iniciar') {
        var inEnf = document.getElementById('input-iniciar-entrenamiento-enfoque');
        if (inEnf) inEnf.value = nombreEnfoque;
    } else if (modalContext === 'finalizar') {
        var inEnfFin = document.getElementById('fin-entrenamiento-input-enfoque');
        var inCobro = document.getElementById('fin-entrenamiento-input-cobro');
        if (inEnfFin) inEnfFin.value = nombreEnfoque;
        if (inCobro && (!inCobro.value || parseFloat(inCobro.value) === 0)) {
            inCobro.value = precio.toFixed(2);
        }
    }
}

function abrirModalIniciarEntrenamiento(alumnoIdPreseleccionado, enfoquePreseleccionado) {
    asegurarEstructuraTrainer();
    var modal = document.getElementById('modal-iniciar-entrenamiento-trainer');
    if (!modal) return;

    var sel = document.getElementById('select-iniciar-entrenamiento-alumno');
    var inEnfoque = document.getElementById('input-iniciar-entrenamiento-enfoque');
    var contNuevo = document.getElementById('contenedor-alumno-nuevo-express');
    var inNuevo = document.getElementById('input-iniciar-alumno-nuevo-nombre');

    if (sel) {
        var alumnos = APP_STATE.subappTrainer.alumnos || [];
        var opts = '<option value="">-- Selecciona un Alumno del Catálogo --</option>';
        opts += '<option value="__NUEVO__">➕ + Registrar Alumno Nuevo Express</option>';

        alumnos.forEach(function(al) {
            var selected = (alumnoIdPreseleccionado && al.id === alumnoIdPreseleccionado) ? 'selected' : '';
            opts += `<option value="${al.id}" ${selected}>${escapeHtmlTrainer(al.nombre)} ($${al.tarifaHabitual || 0})</option>`;
        });
        sel.innerHTML = opts;

        if (alumnoIdPreseleccionado) {
            sel.value = alumnoIdPreseleccionado;
            if (contNuevo) contNuevo.style.display = 'none';
        } else {
            if (contNuevo) contNuevo.style.display = 'none';
        }
    }

    if (inNuevo) inNuevo.value = '';
    if (inEnfoque) {
        if (enfoquePreseleccionado) {
            inEnfoque.value = enfoquePreseleccionado;
        } else if (alumnoIdPreseleccionado) {
            var alFound = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === alumnoIdPreseleccionado; });
            inEnfoque.value = alFound ? (alFound.objetivo || 'Pierna & Glúteos') : '';
        } else {
            inEnfoque.value = 'Pierna & Glúteos (Hipertrofia)';
        }
    }

    renderizarChipsEnfoquesTrainer();
    modal.style.display = 'flex';
}

function cerrarModalIniciarEntrenamiento() {
    var modal = document.getElementById('modal-iniciar-entrenamiento-trainer');
    if (modal) modal.style.display = 'none';
}

function alCambiarAlumnoEnIniciarEntrenamiento() {
    var sel = document.getElementById('select-iniciar-entrenamiento-alumno');
    var contNuevo = document.getElementById('contenedor-alumno-nuevo-express');
    var inEnfoque = document.getElementById('input-iniciar-entrenamiento-enfoque');
    if (!sel) return;

    if (sel.value === '__NUEVO__') {
        if (contNuevo) contNuevo.style.display = 'block';
    } else {
        if (contNuevo) contNuevo.style.display = 'none';
        if (sel.value) {
            var al = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === sel.value; });
            if (al && inEnfoque && !inEnfoque.value) {
                inEnfoque.value = al.objetivo || 'Fuerza & Acondicionamiento';
            }
        }
    }
}

function confirmarIniciarEntrenamiento() {
    asegurarEstructuraTrainer();
    var sel = document.getElementById('select-iniciar-entrenamiento-alumno');
    var inNuevo = document.getElementById('input-iniciar-alumno-nuevo-nombre');
    var inEnfoque = document.getElementById('input-iniciar-entrenamiento-enfoque');

    var alumnoId = sel ? sel.value : '';
    var alumnoNombre = '';

    if (alumnoId === '__NUEVO__') {
        alumnoNombre = inNuevo ? inNuevo.value.trim() : '';
        if (!alumnoNombre) {
            alert("Por favor ingresa el nombre del nuevo alumno.");
            return;
        }
        alumnoId = null;
    } else if (alumnoId) {
        var al = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === alumnoId; });
        alumnoNombre = al ? al.nombre : 'Alumno';
    } else {
        alumnoNombre = 'Alumno General';
        alumnoId = null;
    }

    var enfoque = inEnfoque ? inEnfoque.value.trim() : 'Entrenamiento Personalizado';
    if (!enfoque) enfoque = 'Entrenamiento Personalizado';

    APP_STATE.subappTrainer.timerActivo = {
        inicioTimestamp: Date.now(),
        alumnoId: alumnoId,
        alumnoNombre: alumnoNombre,
        enfoque: enfoque
    };

    MonarcaDB.save(APP_STATE);
    cerrarModalIniciarEntrenamiento();
    iniciarIntervaloTimerTrainer();
    renderizarSubAppTrainer();
}

function descartarTimerEntrenamiento() {
    if (!confirm("¿Deseas descartar el cronómetro de la sesión en curso? Los datos no se guardarán.")) return;
    asegurarEstructuraTrainer();
    APP_STATE.subappTrainer.timerActivo = null;
    if (INTERVALO_TIMER_TRAINER) {
        clearInterval(INTERVALO_TIMER_TRAINER);
        INTERVALO_TIMER_TRAINER = null;
    }
    MonarcaDB.save(APP_STATE);
    renderizarSubAppTrainer();
}

function pararTimerEntrenamiento() {
    asegurarEstructuraTrainer();
    var timer = APP_STATE.subappTrainer.timerActivo;
    if (!timer) return;

    var ahora = Date.now();
    var segundosTotales = Math.max(1, Math.floor((ahora - timer.inicioTimestamp) / 1000));
    var minutosTotales = Math.max(1, Math.round(segundosTotales / 60));

    ENTRENAMIENTO_TEMPORAL_FINALIZANDO = {
        segundos: segundosTotales,
        minutos: minutosTotales,
        alumnoId: timer.alumnoId,
        alumnoNombre: timer.alumnoNombre,
        enfoque: timer.enfoque
    };

    var modal = document.getElementById('modal-finalizar-entrenamiento-trainer');
    if (!modal) return;

    var elDisplay = document.getElementById('fin-entrenamiento-display-tiempo');
    var elMinutos = document.getElementById('fin-entrenamiento-display-minutos');
    var inAlumno = document.getElementById('fin-entrenamiento-input-alumno');
    var inEnfoque = document.getElementById('fin-entrenamiento-input-enfoque');
    var inCobro = document.getElementById('fin-entrenamiento-input-cobro');

    if (elDisplay) elDisplay.textContent = formatearSegundosTrainer(segundosTotales);
    if (elMinutos) elMinutos.textContent = '(' + minutosTotales + ' min equivalentes)';
    if (inAlumno) inAlumno.value = timer.alumnoNombre || '';
    if (inEnfoque) inEnfoque.value = timer.enfoque || '';

    // Sugerir cobro habitual del alumno o enfoque
    var cobroSugerido = 15.00;
    if (timer.alumnoId) {
        var al = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === timer.alumnoId; });
        if (al && al.tarifaHabitual) cobroSugerido = parseFloat(al.tarifaHabitual);
    } else if (timer.enfoque) {
        var enf = (APP_STATE.subappTrainer.rutinasEnfoques || []).find(function(e) { return e.nombre.toLowerCase() === timer.enfoque.toLowerCase(); });
        if (enf && enf.precio) cobroSugerido = parseFloat(enf.precio);
    }
    if (inCobro) inCobro.value = cobroSugerido.toFixed(2);

    renderizarChipsEnfoquesTrainer();
    modal.style.display = 'flex';
}

function cerrarModalFinalizarEntrenamiento() {
    var modal = document.getElementById('modal-finalizar-entrenamiento-trainer');
    if (modal) modal.style.display = 'none';
}

function guardarEntrenamientoFinalizado() {
    if (!ENTRENAMIENTO_TEMPORAL_FINALIZANDO) {
        alert("No hay un entrenamiento activo para guardar.");
        return;
    }
    asegurarEstructuraTrainer();

    var inAlumno = document.getElementById('fin-entrenamiento-input-alumno');
    var inEnfoque = document.getElementById('fin-entrenamiento-input-enfoque');
    var inCobro = document.getElementById('fin-entrenamiento-input-cobro');
    var checkFin = document.getElementById('fin-entrenamiento-check-finanzas');

    var alumnoNombre = inAlumno ? inAlumno.value.trim() : '';
    if (!alumnoNombre) {
        alert("Por favor ingresa o confirma el nombre del alumno.");
        return;
    }

    var enfoque = inEnfoque ? inEnfoque.value.trim() : 'Entrenamiento Personalizado';
    var cobro = inCobro ? parseFloat(inCobro.value) || 0 : 0;
    var duracionMinutos = ENTRENAMIENTO_TEMPORAL_FINALIZANDO.minutos || 60;

    var hoy = new Date();
    var hoyMes = hoy.getMonth() + 1;
    var hoyDia = hoy.getDate();
    var fechaHoyStr = hoy.getFullYear() + '-' + (hoyMes < 10 ? '0' + hoyMes : hoyMes) + '-' + (hoyDia < 10 ? '0' + hoyDia : hoyDia);

    var alumnoId = ENTRENAMIENTO_TEMPORAL_FINALIZANDO.alumnoId;
    var alExistente = null;

    if (alumnoId) {
        alExistente = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === alumnoId; });
    }
    if (!alExistente && alumnoNombre) {
        alExistente = (APP_STATE.subappTrainer.alumnos || []).find(function(a) {
            return a.nombre.toLowerCase().trim() === alumnoNombre.toLowerCase().trim();
        });
        if (alExistente) alumnoId = alExistente.id;
    }

    // Si el alumno no existe en el catálogo, auto-registrarlo con los datos iniciales
    if (!alExistente) {
        alumnoId = 'ALU-' + Date.now();
        var nuevoAl = {
            id: alumnoId,
            nombre: alumnoNombre,
            genero: 'Masculino',
            edad: 25,
            altura: 175,
            peso: 75,
            fechaIngreso: fechaHoyStr,
            tarifaHabitual: cobro || 15.00,
            objetivo: enfoque,
            telefono: '',
            notas: 'Registrado automáticamente al finalizar sesión de entrenamiento.'
        };
        APP_STATE.subappTrainer.alumnos.push(nuevoAl);
    }

    var nuevoEntrenamiento = {
        id: 'ENT-' + Date.now(),
        fecha: fechaHoyStr,
        timestamp: Date.now(),
        alumnoId: alumnoId,
        alumnoNombre: alumnoNombre,
        enfoque: enfoque,
        duracionMinutos: duracionMinutos,
        cobro: cobro,
        registradoEnFinanzas: checkFin ? checkFin.checked : true
    };

    APP_STATE.subappTrainer.sesiones.unshift(nuevoEntrenamiento);

    // 1. Integración automática con Finanzas
    if (checkFin && checkFin.checked && cobro > 0) {
        if (!APP_STATE.finanzas) APP_STATE.finanzas = { ingresos: [], gastos: [] };
        if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];

        var nuevoIngreso = {
            id: 'ING-' + Date.now(),
            descripcion: 'Personal Trainer - ' + alumnoNombre + ' (' + enfoque + ')',
            monto: cobro,
            fecha: fechaHoyStr,
            categoria: 'Labores & Servicios'
        };
        APP_STATE.finanzas.ingresos.unshift(nuevoIngreso);
    }

    // 2. Acumular tiempo a la sesión del día en LAB-TRAINER
    var horasSesion = parseFloat((duracionMinutos / 60).toFixed(2));
    if (!Array.isArray(APP_STATE.registrosLabores)) APP_STATE.registrosLabores = [];

    var regHoy = APP_STATE.registrosLabores.find(function(r) {
        return r.laborId === 'LAB-TRAINER' && r.fecha === fechaHoyStr;
    });

    if (regHoy) {
        regHoy.horasTrabajadas = parseFloat(((parseFloat(regHoy.horasTrabajadas) || 0) + horasSesion).toFixed(2));
        regHoy.ingresoCalculado = parseFloat(((parseFloat(regHoy.ingresoCalculado) || 0) + cobro).toFixed(2));
        var notaEnt = alumnoNombre + ' (' + enfoque + ', ' + duracionMinutos + ' min)';
        regHoy.notas = regHoy.notas ? (regHoy.notas + ' | ' + notaEnt) : notaEnt;
    } else {
        var nuevoRegLabor = {
            id: 'REG-LAB-' + Date.now(),
            laborId: 'LAB-TRAINER',
            fecha: fechaHoyStr,
            horasTrabajadas: horasSesion,
            ingresoCalculado: cobro,
            notas: 'Entrenamiento con ' + alumnoNombre + ' (' + enfoque + ', ' + duracionMinutos + ' min)'
        };
        APP_STATE.registrosLabores.unshift(nuevoRegLabor);
    }

    // 3. Otorgar EXP de Jugador
    if (typeof otorgarExpJugador === 'function') {
        var expSesion = Math.min(60, Math.max(15, Math.round(duracionMinutos * 0.6)));
        otorgarExpJugador(expSesion, 'Sesión de Coaching Trainer: ' + alumnoNombre);
    }

    // Limpiar estado del timer
    APP_STATE.subappTrainer.timerActivo = null;
    ENTRENAMIENTO_TEMPORAL_FINALIZANDO = null;
    if (INTERVALO_TIMER_TRAINER) {
        clearInterval(INTERVALO_TIMER_TRAINER);
        INTERVALO_TIMER_TRAINER = null;
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalFinalizarEntrenamiento();
    renderizarSubAppTrainer();
    alert("🏋️‍♂️ ¡Entrenamiento guardado con éxito! Se sumaron " + duracionMinutos + " min a tu jornada de Personal Trainer.");
}

function eliminarEntrenamientoTrainer(entrenamientoId) {
    if (!confirm("¿Deseas eliminar este registro de entrenamiento del historial?")) return;
    asegurarEstructuraTrainer();
    registrarTombstone('subappTrainer_sesiones', entrenamientoId);
    APP_STATE.subappTrainer.sesiones = APP_STATE.subappTrainer.sesiones.filter(function(s) { return s.id !== entrenamientoId; });
    MonarcaDB.save(APP_STATE);
    renderizarSubAppTrainer();
}

function abrirModalAlumnoTrainer(alumnoId) {
    asegurarEstructuraTrainer();
    var modal = document.getElementById('modal-alumno-trainer');
    if (!modal) return;

    var tit = document.getElementById('titulo-modal-alumno-trainer');
    var inId = document.getElementById('input-alumno-trainer-id');
    var inNom = document.getElementById('input-alumno-trainer-nombre');
    var inGen = document.getElementById('input-alumno-trainer-genero');
    var inEdad = document.getElementById('input-alumno-trainer-edad');
    var inAlt = document.getElementById('input-alumno-trainer-altura');
    var inPeso = document.getElementById('input-alumno-trainer-peso');
    var inIng = document.getElementById('input-alumno-trainer-fecha-ingreso');
    var inTar = document.getElementById('input-alumno-trainer-tarifa');
    var inObj = document.getElementById('input-alumno-trainer-objetivo');
    var inTel = document.getElementById('input-alumno-trainer-telefono');
    var inNot = document.getElementById('input-alumno-trainer-notas');

    if (alumnoId) {
        var al = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === alumnoId; });
        if (al) {
            if (tit) tit.textContent = 'EDITAR FICHA DE ALUMNO';
            if (inId) inId.value = al.id;
            if (inNom) inNom.value = al.nombre || '';
            if (inGen) inGen.value = al.genero || 'Masculino';
            if (inEdad) inEdad.value = al.edad || 25;
            if (inAlt) inAlt.value = al.altura || 175;
            if (inPeso) inPeso.value = al.peso || '';
            if (inIng) inIng.value = al.fechaIngreso || '';
            if (inTar) inTar.value = al.tarifaHabitual || 15.00;
            if (inObj) inObj.value = al.objetivo || 'Hipertrofia';
            if (inTel) inTel.value = al.telefono || '';
            if (inNot) inNot.value = al.notas || '';
        }
    } else {
        if (tit) tit.textContent = 'CREAR NUEVO ALUMNO';
        if (inId) inId.value = '';
        if (inNom) inNom.value = '';
        if (inGen) inGen.value = 'Masculino';
        if (inEdad) inEdad.value = '25';
        if (inAlt) inAlt.value = '175';
        if (inPeso) inPeso.value = '75.0';

        var hoy = new Date();
        var hoyM = hoy.getMonth() + 1;
        var hoyD = hoy.getDate();
        var hoyStr = hoy.getFullYear() + '-' + (hoyM < 10 ? '0' + hoyM : hoyM) + '-' + (hoyD < 10 ? '0' + hoyD : hoyD);
        if (inIng) inIng.value = hoyStr;

        if (inTar) inTar.value = '15.00';
        if (inObj) inObj.value = 'Hipertrofia';
        if (inTel) inTel.value = '';
        if (inNot) inNot.value = '';
    }

    modal.style.display = 'flex';
}

function cerrarModalAlumnoTrainer() {
    var modal = document.getElementById('modal-alumno-trainer');
    if (modal) modal.style.display = 'none';
}

function guardarAlumnoTrainer() {
    asegurarEstructuraTrainer();
    var inId = document.getElementById('input-alumno-trainer-id');
    var inNom = document.getElementById('input-alumno-trainer-nombre');
    var inGen = document.getElementById('input-alumno-trainer-genero');
    var inEdad = document.getElementById('input-alumno-trainer-edad');
    var inAlt = document.getElementById('input-alumno-trainer-altura');
    var inPeso = document.getElementById('input-alumno-trainer-peso');
    var inIng = document.getElementById('input-alumno-trainer-fecha-ingreso');
    var inTar = document.getElementById('input-alumno-trainer-tarifa');
    var inObj = document.getElementById('input-alumno-trainer-objetivo');
    var inTel = document.getElementById('input-alumno-trainer-telefono');
    var inNot = document.getElementById('input-alumno-trainer-notas');

    var nom = inNom ? inNom.value.trim() : '';
    if (!nom) {
        alert("Por favor ingresa el nombre del alumno.");
        return;
    }

    var id = inId ? inId.value : '';
    var gen = inGen ? inGen.value : 'Masculino';
    var edad = inEdad ? parseInt(inEdad.value, 10) || 25 : 25;
    var alt = inAlt ? parseInt(inAlt.value, 10) || 175 : 175;
    var peso = inPeso ? parseFloat(inPeso.value) || 0 : 0;
    var fechaIng = inIng ? inIng.value : '';
    var tar = inTar ? parseFloat(inTar.value) || 0 : 0;
    var obj = inObj ? inObj.value : 'Hipertrofia';
    var tel = inTel ? inTel.value.trim() : '';
    var not = inNot ? inNot.value.trim() : '';

    if (!fechaIng) {
        var hoy = new Date();
        var hoyM = hoy.getMonth() + 1;
        var hoyD = hoy.getDate();
        fechaIng = hoy.getFullYear() + '-' + (hoyM < 10 ? '0' + hoyM : hoyM) + '-' + (hoyD < 10 ? '0' + hoyD : hoyD);
    }

    if (id) {
        var al = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === id; });
        if (al) {
            al.nombre = nom;
            al.genero = gen;
            al.edad = edad;
            al.altura = alt;
            al.peso = peso;
            al.fechaIngreso = fechaIng;
            al.tarifaHabitual = tar;
            al.objetivo = obj;
            al.telefono = tel;
            al.notas = not;
        }
    } else {
        var nuevo = {
            id: 'ALU-' + Date.now(),
            nombre: nom,
            genero: gen,
            edad: edad,
            altura: alt,
            peso: peso,
            fechaIngreso: fechaIng,
            tarifaHabitual: tar,
            objetivo: obj,
            telefono: tel,
            notas: not
        };
        APP_STATE.subappTrainer.alumnos.push(nuevo);
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalAlumnoTrainer();
    renderizarSubAppTrainer();
    alert("🏋️‍♂️ Alumno guardado con éxito.");
}

function eliminarAlumnoTrainer(alumnoId) {
    if (!confirm("¿Deseas eliminar este alumno del catálogo? (Sus sesiones históricas se conservarán)")) return;
    asegurarEstructuraTrainer();
    registrarTombstone('subappTrainer_alumnos', alumnoId);
    APP_STATE.subappTrainer.alumnos = APP_STATE.subappTrainer.alumnos.filter(function(a) { return a.id !== alumnoId; });
    MonarcaDB.save(APP_STATE);
    renderizarSubAppTrainer();
}

function filtrarAlumnosTrainer(query) {
    BUSQUEDA_ALUMNO_TRAINER = query;
    renderizarSubAppTrainer();
}

function verFichaAlumnoTrainer(alumnoId) {
    asegurarEstructuraTrainer();
    var al = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === alumnoId; });
    if (!al) return;

    var modal = document.getElementById('modal-ficha-alumno-trainer');
    var cont = document.getElementById('contenido-ficha-alumno-trainer');
    if (!modal || !cont) return;

    var sesiones = (APP_STATE.subappTrainer.sesiones || []).filter(function(s) {
        return (s.alumnoId && s.alumnoId === al.id) || (s.alumnoNombre && s.alumnoNombre.toLowerCase() === al.nombre.toLowerCase());
    });

    var totalRecaudado = sesiones.reduce(function(acc, s) { return acc + (parseFloat(s.cobro) || 0); }, 0);
    var totalMinutos = sesiones.reduce(function(acc, s) { return acc + (parseInt(s.duracionMinutos, 10) || 0); }, 0);
    var totalHoras = (totalMinutos / 60).toFixed(1);
    var antiguedad = calcularAntiguedadAlumno(al.fechaIngreso);

    // Cálculo IMC orientativo si hay altura y peso
    var imcHtml = '—';
    if (al.altura > 0 && al.peso > 0) {
        var altM = al.altura / 100;
        var imc = (al.peso / (altM * altM)).toFixed(1);
        var imcClasif = imc < 18.5 ? 'Bajo peso' : (imc < 25 ? 'Normal' : (imc < 30 ? 'Sobrepeso' : 'Obesidad'));
        imcHtml = `<strong>${imc}</strong> (${imcClasif})`;
    }

    var iniciales = al.nombre ? al.nombre.slice(0, 2).toUpperCase() : 'AL';

    var html = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; background: #07090e; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 14px; padding: 14px 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div class="trainer-avatar-initials" style="width: 48px; height: 48px; font-size: 18px;">
                ${escapeHtmlTrainer(iniciales)}
            </div>
            <div>
                <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #f8fafc;">${escapeHtmlTrainer(al.nombre)}</h3>
                <div style="font-size: 12px; color: #94a3b8;">${al.telefono ? '📞 ' + escapeHtmlTrainer(al.telefono) : 'Sin teléfono registrado'}</div>
            </div>
        </div>
        <div style="text-align: right;">
            <span class="subapp-badge" style="color: #10b981; border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.1); font-size: 11px;">${al.genero || 'Masculino'}</span>
        </div>
    </div>

    <!-- CUADRO BIOMÉTRICO EXHAUSTIVO -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; text-align: center;">
        <div style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 4px;">
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Edad</div>
            <div style="font-size: 14px; font-weight: 800; color: #f8fafc;">${al.edad ? al.edad + ' a' : '—'}</div>
        </div>
        <div style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 4px;">
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Altura</div>
            <div style="font-size: 14px; font-weight: 800; color: #f8fafc;">${al.altura ? al.altura + ' cm' : '—'}</div>
        </div>
        <div style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 4px;">
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Peso</div>
            <div style="font-size: 14px; font-weight: 800; color: #10b981;">${al.peso ? al.peso + ' kg' : '—'}</div>
        </div>
        <div style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 4px;">
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">IMC</div>
            <div style="font-size: 12px; font-weight: 800; color: #38bdf8;">${imcHtml}</div>
        </div>
    </div>

    <!-- DATOS DE COACHING Y ANTIGÜEDAD -->
    <div style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px; margin-bottom: 16px; font-size: 12.5px;">
        <div style="color: #cbd5e1; margin-bottom: 6px;">
            🎯 <strong>Objetivo Físico:</strong> <span style="color: #38bdf8; font-weight: 700;">${escapeHtmlTrainer(al.objetivo || 'Sin objetivo')}</span>
        </div>
        <div style="color: #cbd5e1; margin-bottom: 6px;">
            📅 <strong>Fecha de Ingreso:</strong> ${al.fechaIngreso || 'No registrada'} · <span style="color: #f59e0b; font-weight: 700;">${escapeHtmlTrainer(antiguedad)}</span>
        </div>
        <div style="color: #cbd5e1; margin-bottom: 6px;">
            💵 <strong>Tarifa Habitual:</strong> <span style="color: #10b981; font-weight: 800;">$${(parseFloat(al.tarifaHabitual) || 0).toFixed(2)}</span> por sesión
        </div>
        ${al.notas ? `
            <div style="color: #94a3b8; font-size: 11.5px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255, 255, 255, 0.08);">
                📝 <strong>Notas técnicas / Lesiones:</strong> <em>${escapeHtmlTrainer(al.notas)}</em>
            </div>
        ` : ''}
    </div>

    <!-- RESUMEN DE RENDIMIENTO ACUMULADO -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; text-align: center;">
        <div style="background: #07090e; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 10px;">
            <div style="font-size: 10px; color: #10b981; text-transform: uppercase; font-weight: 700;">Sesiones</div>
            <div style="font-size: 18px; font-weight: 800; color: #10b981;">${sesiones.length}</div>
        </div>
        <div style="background: #07090e; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; padding: 10px;">
            <div style="font-size: 10px; color: #38bdf8; text-transform: uppercase; font-weight: 700;">Horas Guía</div>
            <div style="font-size: 18px; font-weight: 800; color: #38bdf8;">${totalHoras}h</div>
        </div>
        <div style="background: #07090e; border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 10px; padding: 10px;">
            <div style="font-size: 10px; color: #f59e0b; text-transform: uppercase; font-weight: 700;">Total Pagado</div>
            <div style="font-size: 18px; font-weight: 800; color: #f59e0b;">$${totalRecaudado.toFixed(0)}</div>
        </div>
    </div>

    <!-- HISTORIAL RECIENTE CON EL ALUMNO -->
    <div style="margin-bottom: 18px;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 8px;">Historial de Entrenamientos</span>
        <div style="max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
    `;

    if (sesiones.length === 0) {
        html += '<div style="font-size: 12px; color: #64748b; padding: 10px; text-align: center;">Aún no hay entrenamientos registrados con este alumno.</div>';
    } else {
        sesiones.forEach(function(s) {
            html += `
            <div style="background: #07090e; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                <div>
                    <span style="font-weight: 700; color: #f8fafc;">${escapeHtmlTrainer(s.enfoque)}</span>
                    <span style="color: #64748b; margin-left: 6px;">(${s.fecha} · ${s.duracionMinutos} min)</span>
                </div>
                <span style="font-weight: 800; color: #10b981;">+$${(parseFloat(s.cobro) || 0).toFixed(2)}</span>
            </div>
            `;
        });
    }

    html += `
        </div>
    </div>

    <div style="display: flex; gap: 8px;">
        <button type="button" class="btn-back-system" style="flex: 1; justify-content: center; margin-bottom: 0;" onclick="cerrarModalFichaAlumnoTrainer()">Cerrar</button>
        <button type="button" class="btn-system" style="flex: 2; justify-content: center; margin-bottom: 0; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; font-weight: 800;" onclick="cerrarModalFichaAlumnoTrainer(); abrirModalIniciarEntrenamiento('${al.id}');">🏋️‍♂️ Iniciar Entrenamiento Ahora</button>
    </div>
    `;

    cont.innerHTML = html;
    modal.style.display = 'flex';
}

function cerrarModalFichaAlumnoTrainer() {
    var modal = document.getElementById('modal-ficha-alumno-trainer');
    if (modal) modal.style.display = 'none';
}

function verDetalleDiaTrainer(fechaStr) {
    asegurarEstructuraTrainer();
    var modal = document.getElementById('modal-detalle-dia-trainer');
    var tit = document.getElementById('titulo-modal-detalle-dia-trainer');
    var cont = document.getElementById('contenido-modal-detalle-dia-trainer');
    if (!modal || !cont) return;

    if (tit) tit.textContent = 'JORNADA DE TRAINER: ' + fechaStr;

    var sesiones = (APP_STATE.subappTrainer.sesiones || []).filter(function(s) {
        return s.fecha === fechaStr;
    });

    var totalCobro = sesiones.reduce(function(acc, s) { return acc + (parseFloat(s.cobro) || 0); }, 0);
    var totalMinutos = sesiones.reduce(function(acc, s) { return acc + (parseInt(s.duracionMinutos, 10) || 0); }, 0);
    var totalHoras = (totalMinutos / 60).toFixed(1);

    var html = `
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; text-align: center;">
        <div style="background: #07090e; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 10px;">
            <div style="font-size: 10px; color: #10b981; text-transform: uppercase; font-weight: 700;">Sesiones</div>
            <div style="font-size: 18px; font-weight: 800; color: #10b981;">${sesiones.length}</div>
        </div>
        <div style="background: #07090e; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; padding: 10px;">
            <div style="font-size: 10px; color: #38bdf8; text-transform: uppercase; font-weight: 700;">Horas Guía</div>
            <div style="font-size: 18px; font-weight: 800; color: #38bdf8;">${totalHoras}h</div>
        </div>
        <div style="background: #07090e; border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 10px; padding: 10px;">
            <div style="font-size: 10px; color: #f59e0b; text-transform: uppercase; font-weight: 700;">Recaudado</div>
            <div style="font-size: 18px; font-weight: 800; color: #f59e0b;">$${totalCobro.toFixed(0)}</div>
        </div>
    </div>
    `;

    if (sesiones.length === 0) {
        html += `
        <div style="background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 30px 16px; text-align: center; color: #94a3b8; margin-bottom: 16px;">
            <div style="font-size: 28px; margin-bottom: 6px;">📅</div>
            <div style="font-size: 13.5px; font-weight: 700; color: #f8fafc;">No se realizaron entrenamientos esta fecha</div>
            <div style="font-size: 11.5px; margin-top: 2px;">Puedes registrar una sesión en vivo o retroactiva.</div>
        </div>
        `;
    } else {
        html += '<div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; max-height: 220px; overflow-y: auto;">';
        sesiones.forEach(function(s) {
            html += `
            <div style="background: #07090e; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 13px; font-weight: 800; color: #f8fafc;">
                        ${escapeHtmlTrainer(s.alumnoNombre || 'Alumno')} 
                        <span style="font-size: 11px; color: #10b981; font-weight: 600;">(${escapeHtmlTrainer(s.enfoque)})</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8;">⏱️ ${s.duracionMinutos || 60} min</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 14px; font-weight: 800; color: #10b981;">+$${(parseFloat(s.cobro) || 0).toFixed(2)}</div>
                </div>
            </div>
            `;
        });
        html += '</div>';
    }

    html += `
    <div style="display: flex; gap: 8px;">
        <button type="button" class="btn-back-system" style="flex: 1; justify-content: center; margin-bottom: 0;" onclick="cerrarModalDetalleDiaTrainer()">Cerrar</button>
        <button type="button" class="btn-system" style="flex: 2; justify-content: center; margin-bottom: 0; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; font-weight: 800;" onclick="cerrarModalDetalleDiaTrainer(); abrirModalIniciarEntrenamiento();">🏋️‍♂️ Iniciar Entrenamiento</button>
    </div>
    `;

    cont.innerHTML = html;
    modal.style.display = 'flex';
}

function cerrarModalDetalleDiaTrainer() {
    var modal = document.getElementById('modal-detalle-dia-trainer');
    if (modal) modal.style.display = 'none';
}

function abrirModalEnfoqueTrainer(enfoqueId) {
    asegurarEstructuraTrainer();
    var modal = document.getElementById('modal-enfoque-trainer');
    if (!modal) return;

    var tit = document.getElementById('titulo-modal-enfoque-trainer');
    var inId = document.getElementById('input-enfoque-trainer-id');
    var inNom = document.getElementById('input-enfoque-trainer-nombre');
    var inPre = document.getElementById('input-enfoque-trainer-precio');
    var inTie = document.getElementById('input-enfoque-trainer-tiempo');
    var inDes = document.getElementById('input-enfoque-trainer-descripcion');

    if (enfoqueId) {
        var enf = (APP_STATE.subappTrainer.rutinasEnfoques || []).find(function(r) { return r.id === enfoqueId; });
        if (enf) {
            if (tit) tit.textContent = 'EDITAR ENFOQUE DE ENTRENAMIENTO';
            if (inId) inId.value = enf.id;
            if (inNom) inNom.value = enf.nombre || '';
            if (inPre) inPre.value = enf.precio || 15;
            if (inTie) inTie.value = enf.tiempoMin || 60;
            if (inDes) inDes.value = enf.descripcion || '';
        }
    } else {
        if (tit) tit.textContent = 'CREAR ENFOQUE DE ENTRENAMIENTO';
        if (inId) inId.value = '';
        if (inNom) inNom.value = '';
        if (inPre) inPre.value = '15.00';
        if (inTie) inTie.value = '60';
        if (inDes) inDes.value = '';
    }

    modal.style.display = 'flex';
}

function cerrarModalEnfoqueTrainer() {
    var modal = document.getElementById('modal-enfoque-trainer');
    if (modal) modal.style.display = 'none';
}

function guardarEnfoqueTrainer() {
    asegurarEstructuraTrainer();
    var inId = document.getElementById('input-enfoque-trainer-id');
    var inNom = document.getElementById('input-enfoque-trainer-nombre');
    var inPre = document.getElementById('input-enfoque-trainer-precio');
    var inTie = document.getElementById('input-enfoque-trainer-tiempo');
    var inDes = document.getElementById('input-enfoque-trainer-descripcion');

    var nom = inNom ? inNom.value.trim() : '';
    if (!nom) {
        alert("Por favor ingresa el nombre del enfoque o rutina.");
        return;
    }

    var id = inId ? inId.value : '';
    var pre = inPre ? parseFloat(inPre.value) || 0 : 0;
    var tie = inTie ? parseInt(inTie.value, 10) || 60 : 60;
    var des = inDes ? inDes.value.trim() : '';

    if (id) {
        var enf = (APP_STATE.subappTrainer.rutinasEnfoques || []).find(function(r) { return r.id === id; });
        if (enf) {
            enf.nombre = nom;
            enf.precio = pre;
            enf.tiempoMin = tie;
            enf.descripcion = des;
        }
    } else {
        var nuevo = {
            id: 'ENF-' + Date.now(),
            nombre: nom,
            precio: pre,
            tiempoMin: tie,
            descripcion: des
        };
        APP_STATE.subappTrainer.rutinasEnfoques.push(nuevo);
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalEnfoqueTrainer();
    renderizarSubAppTrainer();
    alert("🎯 Enfoque de entrenamiento guardado exitosamente en el catálogo.");
}

function eliminarEnfoqueTrainer(enfoqueId) {
    if (!confirm("¿Deseas eliminar este enfoque o rutina del catálogo?")) return;
    asegurarEstructuraTrainer();
    registrarTombstone('subappTrainer_enfoques', enfoqueId);
    APP_STATE.subappTrainer.rutinasEnfoques = APP_STATE.subappTrainer.rutinasEnfoques.filter(function(r) { return r.id !== enfoqueId; });
    MonarcaDB.save(APP_STATE);
    renderizarSubAppTrainer();
}

function filtrarEnfoquesTrainer(query) {
    BUSQUEDA_ENFOQUE_TRAINER = query;
    renderizarSubAppTrainer();
}




