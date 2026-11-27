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
var SUBTAB_LABORES_ACTIVA = 'subapps'; // 'subapps' | 'analisis' | 'historial'
var _CHART_LABORES_INSTANCE = null;

function cambiarSubtabLabores(tab) {
    if (tab !== 'subapps' && tab !== 'analisis' && tab !== 'historial') {
        tab = 'subapps';
    }
    SUBTAB_LABORES_ACTIVA = tab;

    var tabs = ['subapps', 'analisis', 'historial'];
    tabs.forEach(function(t) {
        var btn = document.getElementById('tab-btn-lab-' + t);
        var panel = document.getElementById('labores-panel-' + t);
        var activo = (t === tab);
        if (btn) {
            btn.classList.toggle('active', activo);
            btn.setAttribute('aria-selected', activo ? 'true' : 'false');
        }
        if (panel) {
            panel.style.display = activo ? 'block' : 'none';
        }
    });

    if (tab === 'analisis') {
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(function() {
                renderizarGraficaLabores();
            });
        } else {
            renderizarGraficaLabores();
        }
    }
}

if (typeof window !== 'undefined') {
    window.cambiarSubtabLabores = cambiarSubtabLabores;
}

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
    var badgeHist = document.getElementById('badge-lab-historial-count');

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

    if (badgeHist) {
        badgeHist.textContent = String(totalSesionesMes);
    }

    // 1. Selector de Mes y Tarjetas 2x2 de Métricas Mensuales
    if (contEstadisticas) {
        contEstadisticas.innerHTML = `
        <div class="labores-month-bar">
            <div class="mes-selector-pill">
                <button type="button" class="btn-mes-nav" onclick="cambiarMesLabores(-1)" title="Mes Anterior">◀</button>
                <span>📅 ${formatearNombreMesLabor(MES_LABORES_ACTUAL)}</span>
                <button type="button" class="btn-mes-nav" onclick="cambiarMesLabores(1)" title="Mes Siguiente">▶</button>
            </div>
            <button type="button" class="btn-sync-action btn-sync-light" style="font-size: 11.5px; padding: 6px 12px;" onclick="if(typeof irAFechaEnCalendario==='function') irAFechaEnCalendario(MES_LABORES_ACTUAL + '-01', 'mes', 'labores')">
                📅 Agenda en Calendario →
            </button>
        </div>

        <div class="labores-metrics-grid">
            <div class="labores-kpi-card">
                <div class="labores-kpi-top">
                    <span class="labores-kpi-label" style="color: #818cf8;">Horas Mes</span>
                    <span>⏱️</span>
                </div>
                <div class="labores-kpi-value">${totalHorasMes.toFixed(1)} <span class="labores-kpi-unit">hrs</span></div>
            </div>

            <div class="labores-kpi-card">
                <div class="labores-kpi-top">
                    <span class="labores-kpi-label" style="color: #34d399;">Generado</span>
                    <span>💵</span>
                </div>
                <div class="labores-kpi-value" style="color: #10b981;">$${totalDineroMes.toFixed(2)}</div>
            </div>

            <div class="labores-kpi-card">
                <div class="labores-kpi-top">
                    <span class="labores-kpi-label" style="color: #38bdf8;">Promedio</span>
                    <span>⏳</span>
                </div>
                <div class="labores-kpi-value" style="color: #38bdf8;">${promedioJornadaMes.toFixed(1)} <span class="labores-kpi-unit">h/ses</span></div>
            </div>

            <div class="labores-kpi-card">
                <div class="labores-kpi-top">
                    <span class="labores-kpi-label" style="color: #f59e0b;">Sesiones</span>
                    <span>🎯</span>
                </div>
                <div class="labores-kpi-value">${totalSesionesMes} <span class="labores-kpi-unit">reg.</span></div>
            </div>
        </div>`;
    }

    // 2. Renderizar las 3 Sub-Apps de Labores Oficiales con resumen del mes
    if (contCategorias) {
        var htmlCat = '<div class="labores-subapps-grid">';

        LABORES_OFICIALES.forEach(function(lab) {
            var regsLabMes = registrosMes.filter(function(r) { return r.laborId === lab.id; });
            var hLab = 0;
            var dLab = 0;
            regsLabMes.forEach(function(r) {
                hLab += (Number(r.horas) || 0);
                dLab += (Number(r.honorarios) || 0);
            });
            var sesionesLab = regsLabMes.length;

            htmlCat += `
            <div class="subapp-labor-card-clean" onclick="abrirSubAppLabor('${lab.id}')" style="border-top: 3px solid ${lab.color}; cursor: pointer;">
                <div class="labores-subapp-row">
                    <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
                        <div class="labores-subapp-icon">${lab.icono}</div>
                        <div style="min-width: 0;">
                            <strong style="font-size: 15px; color: #f8fafc; display: block; letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${lab.nombre}</strong>
                            <div class="labores-subapp-meta">
                                <span class="subapp-badge" style="color: ${lab.color}; border-color: ${lab.color}44;">${lab.tagline || 'Sub-App'}</span>
                                <span class="labores-subapp-stat-pill">${hLab.toFixed(1)}h · ${sesionesLab} ses${dLab > 0 ? ' · $' + dLab.toFixed(0) : ''}</span>
                            </div>
                        </div>
                    </div>
                    <span style="font-size: 17px; color: #64748b; flex-shrink: 0;" class="subapp-arrow">➔</span>
                </div>
            </div>`;
        });

        htmlCat += '</div>';
        contCategorias.innerHTML = htmlCat;
    }

    // 3. Desglose rápido para la pestaña Análisis
    var contDesglose = document.getElementById('contenedor-desglose-labores');
    if (contDesglose) {
        var htmlDes = '';
        LABORES_OFICIALES.forEach(function(lab) {
            var regsLab = registrosMes.filter(function(r) { return r.laborId === lab.id; });
            var hL = 0;
            var dL = 0;
            regsLab.forEach(function(r) {
                hL += (Number(r.horas) || 0);
                dL += (Number(r.honorarios) || 0);
            });
            var pct = totalHorasMes > 0 ? Math.round((hL / totalHorasMes) * 100) : 0;
            htmlDes += `
            <div class="labores-breakdown-chip" style="border-left: 3px solid ${lab.color};">
                <span style="color: #e2e8f0; font-weight: 700;">${lab.icono} ${lab.nombre}</span>
                <span style="color: #94a3b8; font-weight: 700;">${hL.toFixed(1)}h (${pct}%)${dL > 0 ? ' · $' + dL.toFixed(0) : ''}</span>
            </div>`;
        });
        contDesglose.innerHTML = htmlDes;
    }

    // 4. Sincronizar pestaña activa, gráfica e historial
    cambiarSubtabLabores(SUBTAB_LABORES_ACTIVA);
    renderizarGraficaLabores();
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
                        font: { size: 11.5, weight: 'bold' }
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
        <div style="color: #94a3b8; text-align: center; padding: 24px 16px; background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 12px;">
            <span style="font-size: 24px; display: block; margin-bottom: 6px;">📋</span>
            No hay sesiones registradas en <strong>${formatearNombreMesLabor(MES_LABORES_ACTUAL)}</strong> para este filtro.<br>
            <span style="font-size: 11.5px; color: #64748b;">Pulsa "⚡ Registrar Sesión" para añadir tu jornada.</span>
        </div>`;
        return;
    }

    var htmlReg = '<div class="labores-history-list">';
    filtrados.forEach(function(r) {
        var catInfo = LABORES_OFICIALES.find(function(c) { return c.id === r.laborId; }) || { nombre: "Labor", icono: "💼", color: "#6366f1" };

        var numHoras = Number(r.horas !== undefined ? r.horas : (r.horasTrabajadas || 0));
        var txtHoras = isNaN(numHoras) ? '0.0' : numHoras.toFixed(1);
        var txtDesc = r.descripcion || r.notas || 'Sesión de labor registrada';
        var montoHonorarios = Number(r.honorarios !== undefined ? r.honorarios : (r.ingresoCalculado || 0));

        htmlReg += `
        <div class="labores-history-row" style="border-left: 4px solid ${catInfo.color};">
            <div style="display: flex; align-items: flex-start; gap: 10px; flex: 1; min-width: 0;">
                <div class="labores-history-icon">${catInfo.icono}</div>
                <div style="min-width: 0; flex: 1;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <strong style="color: #f8fafc; font-size: 13.5px;">${catInfo.nombre}</strong>
                        <span class="item-badge-pill" style="font-size: 10.5px; background: rgba(56, 189, 248, 0.1); color: #38bdf8; font-weight: 700; border: 1px solid rgba(56, 189, 248, 0.25);">⏱️ ${txtHoras}h</span>
                        ${montoHonorarios > 0 ? `<span class="item-badge-pill" style="font-size: 10.5px; background: rgba(16, 185, 129, 0.12); color: #34d399; font-weight: 800; border: 1px solid rgba(16, 185, 129, 0.28);">+$${montoHonorarios.toFixed(2)}</span>` : ''}
                    </div>
                    <p class="labores-history-desc">${txtDesc}</p>
                </div>
            </div>
            <div class="labores-history-right">
                <span style="font-size: 11.5px; color: #94a3b8; font-weight: 600;">📅 ${r.fecha}</span>
                <button onclick="eliminarRegistroLabor('${r.id}')" title="Eliminar sesión" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.22); color: #f87171; border-radius: 7px; cursor: pointer; padding: 4px 8px; font-size: 12px;">
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

function sincronizarBoomConFinanzas() {
    asegurarEstructuraBoom();
    var planMes = APP_STATE.subappBoom.planificaciones[MES_BOOM_ACTUAL];
    if (!planMes) return;
    if (!planMes.pagosCobrados) planMes.pagosCobrados = {};
    if (!planMes.montosRealesCobrados) planMes.montosRealesCobrados = {};

    if (!APP_STATE.finanzas || !Array.isArray(APP_STATE.finanzas.ingresos)) return;

    APP_STATE.finanzas.ingresos.forEach(function(ig) {
        var desc = ((ig.fuente || ig.concepto || ig.descripcion || ig.nombre || '') + ' ' + (ig.categoria || '')).toLowerCase();
        var idStr = String(ig.id || '').toLowerCase();
        var esBoom = idStr.indexOf('boom') !== -1 || desc.indexOf('boom') !== -1 || ig.origenLabor === 'LAB-BOOM';
        if (!esBoom) return;

        var tipoPago = null;
        var dia = Number(ig.dia);
        if (isNaN(dia) && ig.fecha) {
            var parts = ig.fecha.split('-');
            if (parts.length === 3) dia = Number(parts[2]);
        }

        if (idStr.indexOf('bono') !== -1 || idStr.indexOf('cesta') !== -1 || desc.indexOf('bono') !== -1 || desc.indexOf('cesta') !== -1 || dia <= 5) {
            tipoPago = 'bono3';
        } else if (idStr.indexOf('quincena1') !== -1 || idStr.indexOf('q1') !== -1 || desc.indexOf('quincena 1') !== -1 || desc.indexOf('primer corte') !== -1 || (dia > 5 && dia <= 15)) {
            tipoPago = 'quincena1';
        } else if (idStr.indexOf('quincena2') !== -1 || idStr.indexOf('q2') !== -1 || desc.indexOf('quincena 2') !== -1 || desc.indexOf('segundo corte') !== -1 || dia > 15) {
            tipoPago = 'quincena2';
        }

        if (!tipoPago) return;

        if (ig.cobrado) {
            planMes.pagosCobrados[tipoPago] = true;
            var realVal = (ig.montoCobrado !== undefined && ig.montoCobrado !== null && ig.montoCobrado !== '')
                ? Number(ig.montoCobrado)
                : Number(ig.monto);
            planMes.montosRealesCobrados[tipoPago] = realVal;
        }
    });
}

function cargarSubAppBoom() {
    asegurarEstructuraBoom();
    sincronizarBoomConFinanzas();
    renderizarSubAppBoom();
}

function renderizarSubAppBoom() {
    asegurarEstructuraBoom();
    sincronizarBoomConFinanzas();
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

    var realB3 = (cobradoB3 && planMes.montosRealesCobrados && planMes.montosRealesCobrados.bono3 !== undefined) ? Number(planMes.montosRealesCobrados.bono3) : bono3;
    var realQ1 = (cobradoQ1 && planMes.montosRealesCobrados && planMes.montosRealesCobrados.quincena1 !== undefined) ? Number(planMes.montosRealesCobrados.quincena1) : sueldoQ1;
    var realQ2 = (cobradoQ2 && planMes.montosRealesCobrados && planMes.montosRealesCobrados.quincena2 !== undefined) ? Number(planMes.montosRealesCobrados.quincena2) : sueldoQ2;

    var totalDineroCobrado = (cobradoQ1 ? realQ1 : 0) + (cobradoQ2 ? realQ2 : 0) + (cobradoB3 ? realB3 : 0);
    var totalDineroPendiente = Math.max(0, totalRecaudadoMes - totalDineroCobrado);

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
                    <div style="font-size: 22px; font-weight: 800; color: ${cobradoB3 ? '#34d399' : '#f8fafc'};">$${(cobradoB3 ? realB3 : bono3).toFixed(2)}</div>
                    <span style="font-size: 11px; color: #64748b;">${cobradoB3 && realB3 !== bono3 ? 'Cobrado real (Plan: $' + bono3.toFixed(2) + ')' : 'Incentivo mensual fijo'}</span>
                </div>
                <button type="button" class="btn-system" onclick="toggleCobroBoom('bono3')" style="width: 100%; justify-content: center; padding: 7px; font-size: 11.5px; font-weight: 700; background: ${cobradoB3 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)'}; color: ${cobradoB3 ? '#34d399' : '#f8fafc'}; border: 1px solid ${cobradoB3 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'};" title="${cobradoB3 ? 'Toca para revertir cobro a pendiente' : 'Marcar y registrar monto cobrado'}">
                    ${cobradoB3 ? '✓ Cobrado (Revertir ↩)' : 'Marcar como Cobrado'}
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
                    <div style="font-size: 22px; font-weight: 800; color: ${cobradoQ1 ? '#34d399' : '#f8fafc'};">$${(cobradoQ1 ? realQ1 : sueldoQ1).toFixed(2)}</div>
                    <span style="font-size: 11px; color: #64748b;">${cobradoQ1 && realQ1 !== sueldoQ1 ? 'Cobrado real (Plan: $' + sueldoQ1.toFixed(2) + ')' : 'Primer corte quincenal'}</span>
                </div>
                <button type="button" class="btn-system" onclick="toggleCobroBoom('quincena1')" style="width: 100%; justify-content: center; padding: 7px; font-size: 11.5px; font-weight: 700; background: ${cobradoQ1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)'}; color: ${cobradoQ1 ? '#34d399' : '#f8fafc'}; border: 1px solid ${cobradoQ1 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'};" title="${cobradoQ1 ? 'Toca para revertir cobro a pendiente' : 'Marcar y registrar monto cobrado'}">
                    ${cobradoQ1 ? '✓ Cobrado (Revertir ↩)' : 'Marcar como Cobrado'}
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
                    <div style="font-size: 22px; font-weight: 800; color: ${cobradoQ2 ? '#34d399' : '#f8fafc'};">$${(cobradoQ2 ? realQ2 : sueldoQ2).toFixed(2)}</div>
                    <span style="font-size: 11px; color: #64748b;">${cobradoQ2 && realQ2 !== sueldoQ2 ? 'Cobrado real (Plan: $' + sueldoQ2.toFixed(2) + ')' : 'Segundo corte quincenal'}</span>
                </div>
                <button type="button" class="btn-system" onclick="toggleCobroBoom('quincena2')" style="width: 100%; justify-content: center; padding: 7px; font-size: 11.5px; font-weight: 700; background: ${cobradoQ2 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)'}; color: ${cobradoQ2 ? '#34d399' : '#f8fafc'}; border: 1px solid ${cobradoQ2 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'};" title="${cobradoQ2 ? 'Toca para revertir cobro a pendiente' : 'Marcar y registrar monto cobrado'}">
                    ${cobradoQ2 ? '✓ Cobrado (Revertir ↩)' : 'Marcar como Cobrado'}
                </button>
            </div>
        </div>
    </div>

    <!-- PLANIFICACIÓN UNIFICADA EN CALENDARIO PRINCIPAL -->
    `;

    var hoyBoomDt = new Date();
    var hoyBoomStr = hoyBoomDt.getFullYear() + '-' + String(hoyBoomDt.getMonth() + 1).padStart(2, '0') + '-' + String(hoyBoomDt.getDate()).padStart(2, '0');
    var infoHoyBoom = (hoyBoomStr.slice(0, 7) === MES_BOOM_ACTUAL && planMes.dias) ? planMes.dias[hoyBoomStr] : null;
    var puedeMarcarHoyBoom = !!(infoHoyBoom && infoHoyBoom.tipo !== 'domingo_libre' && infoHoyBoom.tipo !== 'sabado_libre');

    html += `
    <div class="boom-unified-cal-bridge">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
            <div style="min-width: 220px; max-width: 100%; flex: 1 1 240px;">
                <h3 style="font-size: 15px; font-weight: 800; color: #f8fafc; margin: 0 0 4px 0;">📅 Jornadas & Sábados en Calendario Unificado</h3>
                <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.45;">
                    Para mantener todos tus horarios en un solo lugar, tu calendario de Boom (<strong>${totalDiasCumplidos}/${totalDiasLaborales}</strong> jornadas cumplidas, <strong>${totalSabadosLibres}</strong> sábados libres) ahora vive dentro de <strong>Mi Calendario</strong>.
                </p>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; max-width: 100%;">
                ${puedeMarcarHoyBoom ? `
                <button type="button" class="btn-system" onclick="toggleCumplidoDiaBoom('${hoyBoomStr}')" style="margin: 0; padding: 8px 14px; font-size: 12px; background: ${infoHoyBoom.cumplido ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, #4f46e5, #6366f1)'}; color: ${infoHoyBoom.cumplido ? '#34d399' : '#ffffff'}; border: 1px solid ${infoHoyBoom.cumplido ? 'rgba(16, 185, 129, 0.4)' : 'rgba(129, 140, 248, 0.5)'};">
                    ${infoHoyBoom.cumplido ? '✓ Hoy Cumplida 8.0h (Revertir)' : '✓ Marcar Hoy 8.0h'}
                </button>` : ''}
                <button type="button" class="btn-sync-action btn-sync-light" onclick="if(typeof irAFechaEnCalendario==='function') irAFechaEnCalendario('${MES_BOOM_ACTUAL}-01', 'mes', 'labores')" style="font-size: 12px; padding: 8px 14px; white-space: normal; text-align: center;">
                    📅 Ver / Marcar Días en Mi Calendario →
                </button>
            </div>
        </div>
    </div>
    `;

    cont.innerHTML = html;
}

function asegurarBaseBoomParaCalendario() {
    if (!window.APP_STATE) window.APP_STATE = {};
    if (!APP_STATE.subappBoom) {
        APP_STATE.subappBoom = {
            config: {
                bonoDia3: 40,
                sueldoQuincena1: 205,
                sueldoQuincena2: 205,
                horasJornadaNormal: 8.0,
                horasJornadaSabado: 8.0
            },
            planificaciones: {}
        };
    }
    if (!APP_STATE.subappBoom.config) {
        APP_STATE.subappBoom.config = {
            bonoDia3: 40,
            sueldoQuincena1: 205,
            sueldoQuincena2: 205,
            horasJornadaNormal: 8.0,
            horasJornadaSabado: 8.0
        };
    }
    if (!APP_STATE.subappBoom.planificaciones) APP_STATE.subappBoom.planificaciones = {};
}

function obtenerEstadoMesBoomParaCalendario(mesClave) {
    asegurarBaseBoomParaCalendario();
    generarPlanificacionMesBoomSiNoExiste(mesClave);
    return {
        planMes: APP_STATE.subappBoom.planificaciones[mesClave],
        config: APP_STATE.subappBoom.config
    };
}

function abrirConfigSabadosBoomDesdeCalendario(mesClave) {
    if (mesClave && /^\d{4}-\d{2}$/.test(mesClave)) {
        MES_BOOM_ACTUAL = mesClave;
    }
    asegurarEstructuraBoom();
    abrirModalConfigBoom();
}

function abrirCobroBoomDesdeCalendario(mesClave, tipoPago) {
    if (mesClave && /^\d{4}-\d{2}$/.test(mesClave)) {
        MES_BOOM_ACTUAL = mesClave;
    }
    asegurarEstructuraBoom();
    abrirModalCobroBoom(tipoPago);
}

function toggleCumplidoDiaBoomDesdeCalendario(fechaStr) {
    if (!fechaStr || fechaStr.length < 7) return;
    var mesClave = fechaStr.slice(0, 7);
    var estadoMes = obtenerEstadoMesBoomParaCalendario(mesClave);
    var planMes = estadoMes.planMes;
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
    if (document.getElementById('subapp-boom-content')) renderizarSubAppBoom();
    if (typeof renderizarLabores === 'function') renderizarLabores();
    if (typeof renderizarCalendario === 'function') renderizarCalendario();
}

function toggleCumplidoDiaBoom(fechaStr) {
    toggleCumplidoDiaBoomDesdeCalendario(fechaStr);
}

function abrirModalCobroBoom(tipoPago) {
    asegurarEstructuraBoom();
    var planMes = APP_STATE.subappBoom.planificaciones[MES_BOOM_ACTUAL];
    if (!planMes) return;
    var config = APP_STATE.subappBoom.config;
    var monto = 0;
    var concepto = '';

    if (tipoPago === 'bono3') {
        monto = Number(config.bonoDia3) || 40;
        concepto = "Bono Boom Solutions (Día 3)";
    } else if (tipoPago === 'quincena1') {
        monto = Number(config.sueldoQuincena1) || 205;
        concepto = "Sueldo Quincena 1 Boom Solutions (Día 15)";
    } else if (tipoPago === 'quincena2') {
        monto = Number(config.sueldoQuincena2) || 205;
        concepto = "Sueldo Quincena 2 Boom Solutions (Día 30)";
    }

    var idFinanza = "ING-BOOM-" + MES_BOOM_ACTUAL + "-" + tipoPago;
    var ingresoExistente = null;

    // Si ya existe un ingreso de Boom Solutions en Finanzas para este día/pago, reusar su ID para sincronizarlo
    if (APP_STATE.finanzas && Array.isArray(APP_STATE.finanzas.ingresos)) {
        ingresoExistente = APP_STATE.finanzas.ingresos.find(function(ig) {
            if (ig.id === idFinanza) return true;
            var d = ((ig.fuente || ig.concepto || ig.descripcion || '') + ' ' + (ig.categoria || '')).toLowerCase();
            var esB = String(ig.id || '').toLowerCase().indexOf('boom') !== -1 || d.indexOf('boom') !== -1;
            if (!esB) return false;
            var dia = Number(ig.dia);
            if (isNaN(dia) && ig.fecha) {
                var p = ig.fecha.split('-');
                if (p.length === 3) dia = Number(p[2]);
            }
            if (tipoPago === 'bono3' && (d.indexOf('bono') !== -1 || d.indexOf('cesta') !== -1 || dia <= 5)) return true;
            if (tipoPago === 'quincena1' && (d.indexOf('quincena 1') !== -1 || (dia > 5 && dia <= 15))) return true;
            if (tipoPago === 'quincena2' && (d.indexOf('quincena 2') !== -1 || dia > 15)) return true;
            return false;
        });
        if (ingresoExistente) {
            idFinanza = ingresoExistente.id;
        }
    }

    var compoundId = "BOOM:" + tipoPago + ":" + idFinanza;

    var modal = document.getElementById('modal-confirmar-cobro-ingreso');
    var inId = document.getElementById('modal-cobro-ingreso-id');
    var elTitulo = document.getElementById('modal-cobro-ingreso-titulo');
    var elProy = document.getElementById('modal-cobro-ingreso-proyectado');
    var inReal = document.getElementById('modal-cobro-ingreso-real');
    var selTarj = document.getElementById('modal-cobro-ingreso-tarjeta');

    if (!modal || !inId || !elTitulo || !elProy || !inReal) {
        if (!planMes.pagosCobrados) planMes.pagosCobrados = {};
        planMes.pagosCobrados[tipoPago] = true;
        MonarcaDB.save(APP_STATE);
        renderizarSubAppBoom();
        return;
    }

    if (typeof poblarSelectsTarjetasFinanzas === 'function') poblarSelectsTarjetasFinanzas();

    var mCobradoExistente = (planMes.montosRealesCobrados && planMes.montosRealesCobrados[tipoPago] !== undefined)
        ? planMes.montosRealesCobrados[tipoPago]
        : monto;

    inId.value = compoundId;
    elTitulo.innerText = concepto;
    elProy.innerText = '$' + monto.toFixed(2);
    inReal.value = mCobradoExistente > 0 ? Number(mCobradoExistente).toFixed(2) : '';

    var distBoom = null;
    if (ingresoExistente) {
        if (Array.isArray(ingresoExistente.tarjetasMovs) && ingresoExistente.tarjetasMovs.length > 0) {
            distBoom = ingresoExistente.tarjetasMovs.map(function(r) { return { tarjetaId: r.tarjetaId, montoUsd: r.montoUsd || r.deltaUsdRef || 0 }; });
        } else if (Array.isArray(ingresoExistente.tarjetasDistribucion) && ingresoExistente.tarjetasDistribucion.length > 0) {
            distBoom = ingresoExistente.tarjetasDistribucion;
        }
    }
    if (typeof establecerModoSplitTarjetasModal === 'function') {
        if (distBoom && distBoom.length > 1) {
            establecerModoSplitTarjetasModal('cobro', true, distBoom);
        } else {
            establecerModoSplitTarjetasModal('cobro', false);
            if (selTarj) {
                var idPreB = (distBoom && distBoom.length === 1) ? distBoom[0].tarjetaId : (ingresoExistente ? (ingresoExistente.tarjetaId || '') : '');
                selTarj.value = idPreB || '';
            }
        }
    } else if (selTarj) {
        selTarj.value = '';
    }
    if (typeof actualizarPreviewCobroTarjeta === 'function') actualizarPreviewCobroTarjeta();

    modal.style.display = 'flex';
    setTimeout(function() {
        inReal.focus();
        inReal.select();
    }, 80);
}

function revertirCobroBoom(tipoPago) {
    asegurarEstructuraBoom();
    var planMes = APP_STATE.subappBoom.planificaciones[MES_BOOM_ACTUAL];
    if (!planMes || !planMes.pagosCobrados) return;

    var label = tipoPago === 'bono3' ? 'Bono Mensual (Día 3)' : (tipoPago === 'quincena1' ? 'Sueldo Quincena 1 (Día 15)' : 'Sueldo Quincena 2 (Día 30)');

    var accion = function() {
        planMes.pagosCobrados[tipoPago] = false;
        if (planMes.montosRealesCobrados) {
            delete planMes.montosRealesCobrados[tipoPago];
        }

        var idFinanza = "ING-BOOM-" + MES_BOOM_ACTUAL + "-" + tipoPago;
        if (APP_STATE.finanzas && Array.isArray(APP_STATE.finanzas.ingresos)) {
            APP_STATE.finanzas.ingresos.forEach(function(ig) {
                var d = ((ig.fuente || ig.concepto || ig.descripcion || '') + ' ' + (ig.categoria || '')).toLowerCase();
                var esB = ig.id === idFinanza || String(ig.id || '').toLowerCase().indexOf('boom') !== -1 || d.indexOf('boom') !== -1;
                if (!esB) return;
                var dia = Number(ig.dia);
                if (isNaN(dia) && ig.fecha) {
                    var p = ig.fecha.split('-');
                    if (p.length === 3) dia = Number(p[2]);
                }
                var coincide = (tipoPago === 'bono3' && (d.indexOf('bono') !== -1 || d.indexOf('cesta') !== -1 || dia <= 5)) ||
                               (tipoPago === 'quincena1' && (d.indexOf('quincena 1') !== -1 || (dia > 5 && dia <= 15))) ||
                               (tipoPago === 'quincena2' && (d.indexOf('quincena 2') !== -1 || dia > 15));
                if (coincide) {
                    if (ig.cobrado && typeof revertirTarjetasMovimientoFinanzas === 'function') {
                        revertirTarjetasMovimientoFinanzas(ig, true);
                    }
                    ig.cobrado = false;
                    delete ig.montoCobrado;
                    delete ig.fechaCobro;
                }
            });
        }

        MonarcaDB.save(APP_STATE);
        renderizarSubAppBoom();
        if (typeof renderizarFinanzasSiActivo === 'function') renderizarFinanzasSiActivo();
        if (typeof renderizarFinanzas === 'function' && document.getElementById('vista-finanzas') && document.getElementById('vista-finanzas').classList.contains('active')) {
            renderizarFinanzas(APP_STATE.finanzas);
        }
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion("↩ Cobro revertido a pendiente exitosamente.", "info");
        }
    };

    if (typeof solicitarReversionCobro === 'function') {
        solicitarReversionCobro("¿Estás seguro de que deseas revertir el cobro de " + label + "? Se devolverá a estado pendiente y se actualizará el saldo de tu cuenta.", accion);
    } else if (confirm("¿Estás seguro de que deseas revertir este cobro y devolverlo a estado pendiente?")) {
        accion();
    }
}

function toggleCobroBoom(tipoPago) {
    asegurarEstructuraBoom();
    var planMes = APP_STATE.subappBoom.planificaciones[MES_BOOM_ACTUAL];
    if (!planMes || !planMes.pagosCobrados) return;

    if (planMes.pagosCobrados[tipoPago]) {
        revertirCobroBoom(tipoPago);
    } else {
        abrirModalCobroBoom(tipoPago);
    }
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
    if (typeof renderizarCalendario === 'function') renderizarCalendario();
    alert("🚀 Sueldos y sábados libres de Boom Solutions guardados exitosamente.");
}


// ==========================================================================
// 2. DIRECTORIO DE PERSONAS & AGENDA DE CONVERSACIONES CON UBICACIONES
// ==========================================================================

var FILTRO_UBICACION_PERSONAS = "TODAS";
var FILTRO_GRUPO_PERSONAS = "TODOS";
var FILTRO_ESTADO_PERSONAS = "TODOS";
var BUSQUEDA_PERSONAS_QUERY = "";

function escHtmlPersona(str) {
    if (typeof window.monarcaEscHtml === 'function') return window.monarcaEscHtml(str);
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function cargarAgendaPersonas() {
    renderizarAgendaPersonas();
}

function filtrarPersonasPorUbicacion(ubicacion, btn) {
    FILTRO_UBICACION_PERSONAS = ubicacion || "TODAS";
    var btns = document.querySelectorAll('.btn-tab-ubi');
    btns.forEach(function(b) { b.classList.remove('active'); });
    if (btn) {
        btn.classList.add('active');
    } else if (btns.length > 0 && FILTRO_UBICACION_PERSONAS === 'TODAS') {
        btns[0].classList.add('active');
    }
    renderizarAgendaPersonas();
}

function filtrarPersonasPorGrupo(grupoId) {
    FILTRO_GRUPO_PERSONAS = (FILTRO_GRUPO_PERSONAS === grupoId) ? "TODOS" : grupoId;
    renderizarAgendaPersonas();
}

function filtrarPersonasPorEstado(estado) {
    FILTRO_ESTADO_PERSONAS = estado || "TODOS";
    renderizarAgendaPersonas();
}

function alBuscarPersonas(valor) {
    BUSQUEDA_PERSONAS_QUERY = String(valor || '');
    var btnClear = document.getElementById('btn-limpiar-busqueda-personas');
    if (btnClear) btnClear.style.display = BUSQUEDA_PERSONAS_QUERY.trim() ? 'inline-flex' : 'none';
    renderizarAgendaPersonas();
}

function limpiarBusquedaPersonas() {
    BUSQUEDA_PERSONAS_QUERY = '';
    var input = document.getElementById('input-buscar-personas');
    if (input) {
        input.value = '';
        input.focus();
    }
    var btnClear = document.getElementById('btn-limpiar-busqueda-personas');
    if (btnClear) btnClear.style.display = 'none';
    renderizarAgendaPersonas();
}

function limpiarTodosFiltrosPersonas() {
    FILTRO_UBICACION_PERSONAS = "TODAS";
    FILTRO_GRUPO_PERSONAS = "TODOS";
    FILTRO_ESTADO_PERSONAS = "TODOS";
    BUSQUEDA_PERSONAS_QUERY = "";
    var input = document.getElementById('input-buscar-personas');
    if (input) input.value = '';
    var btnClear = document.getElementById('btn-limpiar-busqueda-personas');
    if (btnClear) btnClear.style.display = 'none';
    var btns = document.querySelectorAll('.btn-tab-ubi');
    btns.forEach(function(b, idx) { b.classList.toggle('active', idx === 0); });
    renderizarAgendaPersonas();
}

function obtenerEventosCalendarioDePersona(personaObj) {
    if (!personaObj || !APP_STATE || !Array.isArray(APP_STATE.calendario)) {
        return { total: 0, pendientesCount: 0, proximo: null };
    }
    var pid = String(personaObj.id || '');
    if (!pid) return { total: 0, pendientesCount: 0, proximo: null };

    var gruposIds = (APP_STATE.gruposPersonas || []).filter(function(g) {
        return g && Array.isArray(g.personaIds) && g.personaIds.map(String).indexOf(pid) !== -1;
    }).map(function(g) { return String(g.id); });

    var dNow = new Date();
    var hoyClave = (typeof obtenerClaveFechaLocal === 'function')
        ? obtenerClaveFechaLocal()
        : (dNow.getFullYear() + '-' + String(dNow.getMonth() + 1).padStart(2, '0') + '-' + String(dNow.getDate()).padStart(2, '0'));

    var vinculados = APP_STATE.calendario.filter(function(it) {
        if (!it) return false;
        if (String(it.personaId || '') === pid) return true;
        if (Array.isArray(it.personaIds) && it.personaIds.map(String).indexOf(pid) !== -1) return true;
        if (Array.isArray(it.grupoIds) && gruposIds.length > 0) {
            return it.grupoIds.some(function(gid) { return gruposIds.indexOf(String(gid)) !== -1; });
        }
        return false;
    });

    var pendientes = vinculados.filter(function(it) {
        return !it.completado && (!it.fecha || String(it.fecha) >= hoyClave);
    }).sort(function(a, b) {
        var fa = String(a.fecha || '9999-99-99') + ' ' + String(a.hora || a.horaInicio || '99:99');
        var fb = String(b.fecha || '9999-99-99') + ' ' + String(b.hora || b.horaInicio || '99:99');
        return fa.localeCompare(fb);
    });

    return {
        total: vinculados.length,
        pendientesCount: pendientes.length,
        proximo: pendientes[0] || vinculados[0] || null
    };
}

function renderizarFiltrosEstadoPersonas(personas) {
    var contFiltros = document.getElementById('personas-estado-filters');
    if (!contFiltros) return;

    var lista = Array.isArray(personas) ? personas : [];
    var cntPend = 0;
    var cntAgen = 0;
    var cntConv = 0;
    var cntCobrar = 0;

    lista.forEach(function(p) {
        if (!p) return;
        var st = String(p.estado || 'Pendiente');
        if (st === 'Conversado') cntConv++;
        else if (st === 'Agendado') cntAgen++;
        else cntPend++;
        if (typeof obtenerIngresosPendientesDePersonaAgenda === 'function') {
            var cob = obtenerIngresosPendientesDePersonaAgenda(p);
            if (cob && cob.totalUsd > 0) cntCobrar++;
        }
    });

    var pills = [
        { key: 'TODOS', label: 'Todos', count: lista.length },
        { key: 'Pendiente', label: '⏳ Pendientes', count: cntPend },
        { key: 'Agendado', label: '📅 Agendado', count: cntAgen },
        { key: 'Conversado', label: '✅ Conversado', count: cntConv },
        { key: 'POR_COBRAR', label: '💵 Por cobrar', count: cntCobrar }
    ];

    contFiltros.innerHTML = pills.map(function(pill) {
        var activo = FILTRO_ESTADO_PERSONAS === pill.key ? ' active' : '';
        return '<button type="button" class="persona-estado-pill' + activo + '" onclick="filtrarPersonasPorEstado(\'' + pill.key + '\')">' +
            '<span>' + pill.label + '</span>' +
            '<span class="persona-estado-cnt">' + pill.count + '</span>' +
        '</button>';
    }).join('');
}

function renderizarGruposPersonas() {
    var contGrupos = document.getElementById('contenedor-grupos-personas');
    if (!contGrupos) return;
    if (!Array.isArray(APP_STATE.gruposPersonas)) APP_STATE.gruposPersonas = [];
    if (!Array.isArray(APP_STATE.agendaPersonas)) APP_STATE.agendaPersonas = [];

    var grupos = APP_STATE.gruposPersonas;
    var personasMap = {};
    APP_STATE.agendaPersonas.forEach(function(p) { personasMap[String(p.id)] = p; });

    var html = '<div class="personas-grupos-box">' +
        '<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:10px;">' +
            '<div>' +
                '<div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#94a3b8; letter-spacing:0.5px;">Grupos de Contactos · Vinculables en Calendario</div>' +
                '<div style="font-size:12px; color:#64748b;">Agrupa personas (Socios, Familia, Gimnasio, Equipo) para vincularlos de un toque en tus Eventos.</div>' +
            '</div>' +
            '<div style="display:flex; gap:6px; align-items:center;">' +
                (FILTRO_GRUPO_PERSONAS !== 'TODOS'
                    ? '<button type="button" class="btn-tab-ubi" onclick="filtrarPersonasPorGrupo(\'TODOS\')">✕ Ver todos los grupos</button>'
                    : '') +
                '<button type="button" class="btn-system" style="font-size:12px; padding:6px 12px; margin:0;" onclick="abrirModalGrupoPersonas()">+ Nuevo Grupo</button>' +
            '</div>' +
        '</div>';

    if (grupos.length === 0) {
        html += '<div style="font-size:12px; color:#94a3b8; padding:10px 12px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.12); border-radius:10px;">' +
            'Aún no tienes grupos creados. Crea uno con <strong>+ Nuevo Grupo</strong> para vincular varios contactos en el Calendario.' +
        '</div>';
    } else {
        html += '<div class="personas-grupos-grid">';
        grupos.forEach(function(g) {
            var miembrosValidos = (g.personaIds || []).map(function(id) { return personasMap[String(id)]; }).filter(Boolean);
            var activo = (FILTRO_GRUPO_PERSONAS === String(g.id));
            var color = g.color || '#6366f1';
            var previewNombres = miembrosValidos.slice(0, 3).map(function(m) { return escHtmlPersona(m.nombre); }).join(', ');
            if (miembrosValidos.length > 3) previewNombres += ' +' + (miembrosValidos.length - 3);
            if (!previewNombres) previewNombres = 'Sin miembros asignados';

            html += '<div class="persona-grupo-pill ' + (activo ? 'is-active' : '') + '" style="border-left: 3px solid ' + color + ';">' +
                '<div style="flex:1; min-width:0; cursor:pointer;" onclick="filtrarPersonasPorGrupo(\'' + escHtmlPersona(g.id) + '\')" title="Toca para filtrar contactos de este grupo">' +
                    '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">' +
                        '<span style="font-size:15px;">' + escHtmlPersona(g.icono || '👥') + '</span>' +
                        '<strong style="font-size:13px; color:#f8fafc;">' + escHtmlPersona(g.nombre) + '</strong>' +
                        '<span style="font-size:10.5px; font-weight:700; padding:1px 7px; border-radius:9999px; background:rgba(255,255,255,0.08); color:#cbd5e1;">' + miembrosValidos.length + '</span>' +
                    '</div>' +
                    '<div style="font-size:11px; color:#94a3b8; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + previewNombres + '</div>' +
                '</div>' +
                '<div style="display:flex; align-items:center; gap:4px;">' +
                    '<button type="button" class="btn-sheet-action" style="padding:4px 7px; font-size:11px;" onclick="abrirModalGrupoPersonas(\'' + escHtmlPersona(g.id) + '\')" title="Editar grupo">✏️</button>' +
                    '<button type="button" class="btn-sheet-action" style="padding:4px 7px; font-size:11px; color:#f87171;" onclick="eliminarGrupoPersonas(\'' + escHtmlPersona(g.id) + '\')" title="Eliminar grupo">🗑️</button>' +
                '</div>' +
            '</div>';
        });
        html += '</div>';
    }

    html += '</div>';
    contGrupos.innerHTML = html;
}

function renderizarAgendaPersonas() {
    var cont = document.getElementById('contenedor-agenda-personas-grid');
    var bannerResumen = document.getElementById('contenedor-resumen-personas');
    if (!cont && !bannerResumen) return;

    if (!APP_STATE.agendaPersonas || !Array.isArray(APP_STATE.agendaPersonas)) {
        APP_STATE.agendaPersonas = [];
    }
    if (!APP_STATE.gruposPersonas || !Array.isArray(APP_STATE.gruposPersonas)) {
        APP_STATE.gruposPersonas = [];
    }
    var personas = APP_STATE.agendaPersonas;
    var grupos = APP_STATE.gruposPersonas;

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
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">Gestión de Relaciones &amp; Contactos</div>
                    <h3 style="margin: 2px 0 0 0; font-size: 16px; font-weight: 800; color: #f8fafc;">Directorio de Conversaciones Pendientes</h3>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span class="item-badge-pill" style="font-weight: 800; background: rgba(56, 189, 248, 0.14); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.28);">${personas.length} Contactos</span>
                    <span class="item-badge-pill" style="font-weight: 800; background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border: 1px solid rgba(129, 140, 248, 0.3);">${grupos.length} Grupos</span>
                    <span class="item-badge-pill" style="font-weight: 800; background: rgba(255, 255, 255, 0.06); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.1);">${temasResueltos}/${totalTemas} Temas Tratados</span>
                </div>
            </div>
            <p style="margin: 0; font-size: 12.5px; color: #94a3b8;">
                Busca, edita notas, organiza temas pendientes y agenda citas reales directo a tu Calendario o WhatsApp en 1 toque.
            </p>
        </div>`;
    }

    renderizarGruposPersonas();
    renderizarFiltrosEstadoPersonas(personas);

    if (!cont) return;

    var filtradas = personas;
    if (FILTRO_UBICACION_PERSONAS !== "TODAS") {
        filtradas = filtradas.filter(function(p) {
            return p.ubicacionCategoria === FILTRO_UBICACION_PERSONAS;
        });
    }
    if (FILTRO_GRUPO_PERSONAS !== "TODOS") {
        var grupoSel = grupos.find(function(g) { return String(g.id) === String(FILTRO_GRUPO_PERSONAS); });
        if (grupoSel) {
            var setIds = (grupoSel.personaIds || []).map(String);
            filtradas = filtradas.filter(function(p) { return setIds.indexOf(String(p.id)) !== -1; });
        } else {
            FILTRO_GRUPO_PERSONAS = "TODOS";
        }
    }
    if (FILTRO_ESTADO_PERSONAS !== "TODOS") {
        filtradas = filtradas.filter(function(p) {
            if (FILTRO_ESTADO_PERSONAS === 'POR_COBRAR') {
                var cobP = (typeof obtenerIngresosPendientesDePersonaAgenda === 'function')
                    ? obtenerIngresosPendientesDePersonaAgenda(p)
                    : { totalUsd: 0 };
                return cobP.totalUsd > 0;
            }
            var stPer = p.estado || 'Pendiente';
            return stPer === FILTRO_ESTADO_PERSONAS;
        });
    }

    var queryNorm = String(BUSQUEDA_PERSONAS_QUERY || '').trim().toLowerCase();
    if (queryNorm) {
        filtradas = filtradas.filter(function(p) {
            var temasTxt = (p.temasPendientes || []).map(function(t) { return t.texto || ''; }).join(' ');
            var haystack = [
                p.nombre || '',
                p.rol || '',
                p.ubicacionCategoria || '',
                p.lugarProyectado || '',
                p.fechaObjetivo || '',
                p.telefono || p.whatsapp || '',
                p.notas || '',
                temasTxt
            ].join(' ').toLowerCase();
            return haystack.indexOf(queryNorm) !== -1;
        });
    }

    var hayFiltrosActivos = (FILTRO_UBICACION_PERSONAS !== "TODAS" || FILTRO_GRUPO_PERSONAS !== "TODOS" || FILTRO_ESTADO_PERSONAS !== "TODOS" || !!queryNorm);

    if (filtradas.length === 0) {
        cont.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 28px 16px; background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.14); border-radius: 12px;">
            <p style="margin: 0; color: #94a3b8; font-size: 13.5px;">${hayFiltrosActivos ? 'No se encontraron contactos que coincidan con los filtros o búsqueda actual.' : 'Aún no has agregado contactos a tu Directorio de Personas.'}</p>
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
                ${hayFiltrosActivos ? '<button type="button" class="btn-back-system" style="margin-bottom: 0; font-size: 12.5px;" onclick="limpiarTodosFiltrosPersonas()">↺ Limpiar Filtros</button>' : ''}
                <button type="button" class="btn-system" style="margin-top: 0; font-size: 12.5px;" onclick="abrirModalNuevaPersona()">+ Agregar Contacto y Temas</button>
            </div>
        </div>`;
        return;
    }

    var html = '';
    filtradas.forEach(function(p) {
        var temasHtml = (p.temasPendientes || []).map(function(t) {
            var checkState = t.hecho ? 'checked' : '';
            var textStyle = t.hecho ? 'text-decoration: line-through; color: #64748b;' : 'color: #f8fafc;';
            return `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 0; border-bottom: 1px dashed rgba(255, 255, 255, 0.08);">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12.5px; ${textStyle}">
                    <input type="checkbox" ${checkState} onchange="toggleTemaPersona('${p.id}', '${t.id}')" style="cursor: pointer; width: 15px; height: 15px; accent-color: #6366f1;">
                    <span>${escHtmlPersona(t.texto)}</span>
                </label>
                <button onclick="eliminarTemaPersona('${p.id}', '${t.id}')" title="Quitar tema" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:12px;" onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='#94a3b8'">✕</button>
            </div>`;
        }).join('');

        var gruposDePersona = grupos.filter(function(g) {
            return Array.isArray(g.personaIds) && g.personaIds.map(String).indexOf(String(p.id)) !== -1;
        });
        var gruposBadges = gruposDePersona.map(function(g) {
            return '<span style="font-size:10px; font-weight:700; padding:2px 7px; border-radius:9999px; background:rgba(255,255,255,0.06); border:1px solid ' + (g.color || '#6366f1') + '; color:#e2e8f0;">' + escHtmlPersona(g.icono || '👥') + ' ' + escHtmlPersona(g.nombre) + '</span>';
        }).join(' ');

        var telPer = String(p.telefono || p.whatsapp || '').trim();
        var pendPer = (typeof obtenerIngresosPendientesDePersonaAgenda === 'function')
            ? obtenerIngresosPendientesDePersonaAgenda(p)
            : { items: [], totalUsd: 0 };
        var telBadgeHtml = telPer
            ? '<button type="button" onclick="editarTelefonoPersonaRapido(\'' + p.id + '\')" title="Editar número WhatsApp" style="font-size:10px; font-weight:700; padding:2px 7px; border-radius:9999px; background:rgba(16,185,129,0.12); border:1px solid rgba(52,211,153,0.32); color:#6ee7b7; cursor:pointer;">📱 ' + escHtmlPersona(telPer) + '</button>'
            : '<button type="button" onclick="editarTelefonoPersonaRapido(\'' + p.id + '\')" title="Agregar número WhatsApp" style="font-size:10px; font-weight:700; padding:2px 7px; border-radius:9999px; background:rgba(255,255,255,0.04); border:1px dashed rgba(148,163,184,0.3); color:#94a3b8; cursor:pointer;">+ 📱 Teléfono</button>';
        var cobroBadgeHtml = pendPer.totalUsd > 0
            ? '<span style="font-size:10px; font-weight:800; padding:2px 7px; border-radius:9999px; background:rgba(245,158,11,0.14); border:1px solid rgba(251,191,36,0.38); color:#fcd34d;">💵 Por cobrar: $' + pendPer.totalUsd.toFixed(2) + '</span>'
            : '';

        var calInfo = obtenerEventosCalendarioDePersona(p);
        var calChipHtml = '';
        if (calInfo.proximo && calInfo.proximo.fecha) {
            var prox = calInfo.proximo;
            var secCal = prox.tipo === 'evento' ? 'eventos' : (prox.tipo === 'destacado' ? 'destacados' : 'recordatorios');
            var horaTag = prox.horaInicio || prox.hora ? (' · ' + (prox.horaInicio || prox.hora)) : '';
            calChipHtml = '<button type="button" class="persona-cal-chip" onclick="if(typeof irAFechaEnCalendario===\'function\'){irAFechaEnCalendario(\'' + escHtmlPersona(prox.fecha) + '\',\'' + secCal + '\');}else{cambiarVista(\'vista-calendario\');}" title="Ver evento/recordatorio en Calendario">' +
                '📅 ' + escHtmlPersona(prox.titulo || 'Cita') + ' (' + escHtmlPersona(prox.fecha + horaTag) + ')' +
                (calInfo.pendientesCount > 1 ? ' +' + (calInfo.pendientesCount - 1) : '') +
            '</button>';
        }

        var notasTxt = String(p.notas || '').trim();
        var notasHtml = notasTxt
            ? '<div class="persona-notas-box"><strong>📝 Notas:</strong> ' + escHtmlPersona(notasTxt) + '</div>'
            : '';

        var estadoActual = p.estado || 'Pendiente';
        var estadoColor = estadoActual === 'Conversado' ? '#34d399' : (estadoActual === 'Agendado' ? '#7dd3fc' : '#cbd5e1');
        var estadoBg = estadoActual === 'Conversado' ? 'rgba(16, 185, 129, 0.14)' : (estadoActual === 'Agendado' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(148, 163, 184, 0.14)');
        var estadoBorder = estadoActual === 'Conversado' ? 'rgba(16, 185, 129, 0.35)' : (estadoActual === 'Agendado' ? 'rgba(56, 189, 248, 0.32)' : 'rgba(148, 163, 184, 0.28)');

        var btnEstadoToggleHtml = estadoActual === 'Conversado'
            ? '<button type="button" class="btn-sheet-action" style="font-size: 11px; padding: 5px 10px;" onclick="cambiarEstadoPersona(\'' + p.id + '\', \'Pendiente\')" title="Volver a marcar como Pendiente">↺ Reabrir</button>'
            : '<button type="button" class="btn-sheet-action" style="font-size: 11px; padding: 5px 10px; background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.38);" onclick="cambiarEstadoPersona(\'' + p.id + '\', \'Conversado\')">✓ Conversado</button>';

        html += `
        <div class="knowledge-card">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
                <div style="min-width: 0; flex: 1;">
                    <span class="knowledge-area-tag" style="background: rgba(56, 189, 248, 0.14); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.3);">${escHtmlPersona(p.ubicacionCategoria || '📍 Ubicación')}</span>
                    <h4 class="knowledge-title">${escHtmlPersona(p.nombre)}</h4>
                    <span style="font-size: 11.5px; color: #94a3b8; font-weight: 600;">${escHtmlPersona(p.rol || 'Contacto')}</span>
                    <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:5px;">${telBadgeHtml}${cobroBadgeHtml}${calChipHtml}${gruposBadges}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                    <button type="button" class="persona-card-icon-btn" onclick="abrirModalNuevaPersona('${p.id}')" title="Editar contacto" aria-label="Editar ${escHtmlPersona(p.nombre)}">✏️</button>
                    <button type="button" class="persona-card-icon-btn is-danger" onclick="eliminarPersonaAgenda('${p.id}')" title="Eliminar persona" aria-label="Eliminar ${escHtmlPersona(p.nombre)}">🗑️</button>
                </div>
            </div>

            <div style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 8px 10px; margin-bottom: 8px; font-size: 12px; color: #cbd5e1;">
                <strong>📍 Lugar Proyectado:</strong> ${escHtmlPersona(p.lugarProyectado || 'Por definir')}
                ${p.fechaObjetivo ? ` · <span style="color: #94a3b8;">🕒 ${escHtmlPersona(p.fechaObjetivo)}</span>` : ''}
            </div>

            ${notasHtml}

            <div style="margin-bottom: 12px; flex-grow: 1;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px;">
                    Temas a Tratar (${(p.temasPendientes || []).filter(function(t){ return !t.hecho; }).length} pendientes):
                </div>
                <div style="display: flex; flex-direction: column; gap: 3px; max-height: 140px; overflow-y: auto;">
                    ${temasHtml || '<span style="font-size: 12px; color: #64748b;">Sin temas anotados.</span>'}
                </div>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <input type="text" id="input-nuevo-tema-${p.id}" placeholder="+ Agregar tema..." class="finanzas-input-clean" style="padding: 6px 10px; font-size: 12px; width: 100%; border-radius: 8px; background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.12); color: #f8fafc;" onkeydown="if(event.key==='Enter'){agregarTemaDirecto('${p.id}');}">
                    <button class="btn-sheet-action" style="padding: 4px 12px; font-size: 12px;" onclick="agregarTemaDirecto('${p.id}')">OK</button>
                </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 10px; flex-wrap: wrap; gap: 8px;">
                <span class="item-badge-pill" style="background: ${estadoBg}; color: ${estadoColor}; border: 1px solid ${estadoBorder}; font-weight: 700; font-size: 11px;">
                    ${escHtmlPersona(estadoActual)}
                </span>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    <button type="button" class="btn-cobro-wa-fin ${pendPer.totalUsd > 0 ? '' : 'is-scheduled'}" style="padding: 4px 9px; font-size: 11px;" onclick="abrirCobroWhatsAppParaPersona('${p.id}')" title="${pendPer.totalUsd > 0 ? 'Cobrar saldo pendiente con tus tarjetas por WhatsApp' : 'Enviar tus datos de pago por WhatsApp'}">${pendPer.totalUsd > 0 ? '💬 Cobrar WA' : '💬 WA Datos'}</button>
                    <button type="button" class="btn-sheet-action" style="font-size: 11px; padding: 5px 10px;" onclick="agendarPersonaEnCalendario('${p.id}')" title="Programar cita o recordatorio real en Calendario con este contacto">📅 Agendar</button>
                    ${btnEstadoToggleHtml}
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
    p.fechaActualizacion = Date.now();
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
        id: "T-" + Date.now() + "-" + Math.random().toString(36).substr(2, 3),
        texto: texto,
        hecho: false
    });
    p.fechaActualizacion = Date.now();
    MonarcaDB.save(APP_STATE);
    inTema.value = '';
    renderizarAgendaPersonas();
}

function eliminarTemaPersona(personaId, temaId) {
    var p = (APP_STATE.agendaPersonas || []).find(function(item) { return item.id === personaId; });
    if (!p || !p.temasPendientes) return;
    p.temasPendientes = p.temasPendientes.filter(function(t) { return t.id !== temaId; });
    p.fechaActualizacion = Date.now();
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
}

function cambiarEstadoPersona(personaId, nuevoEstado) {
    var p = (APP_STATE.agendaPersonas || []).find(function(item) { return item.id === personaId; });
    if (!p) return;
    var estadoPrev = String(p.estado || 'Pendiente');
    p.estado = nuevoEstado;
    p.fechaActualizacion = Date.now();
    if (estadoPrev !== 'Conversado' && nuevoEstado === 'Conversado') {
        sumarExp(20);
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Conversación completada (+20 EXP)', '✅');
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
}

function agendarPersonaEnCalendario(personaId) {
    var p = (APP_STATE.agendaPersonas || []).find(function(item) { return String(item.id) === String(personaId); });
    if (!p) return;
    var temasSinMarcar = (p.temasPendientes || []).filter(function(t) { return !t.hecho && t.texto; }).map(function(t) { return '• ' + t.texto; });
    var descSug = temasSinMarcar.length > 0
        ? ('Temas a tratar:\n' + temasSinMarcar.join('\n'))
        : (p.notas ? String(p.notas).trim() : '');

    if (typeof cambiarVista === 'function') cambiarVista('vista-calendario');
    if (typeof abrirModalNuevoEvento === 'function') {
        abrirModalNuevoEvento(null, 'evento', null, '09:00', '', {
            personaId: p.id,
            titulo: 'Conversar con ' + p.nombre,
            descripcion: descSug
        });
    } else {
        cambiarEstadoPersona(p.id, 'Agendado');
    }
}

function eliminarPersonaAgenda(id) {
    if (!confirm("¿Deseas eliminar este contacto de la agenda?")) return;
    if (!APP_STATE.agendaPersonas) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('agendaPersonas', id);
    }
    APP_STATE.agendaPersonas = APP_STATE.agendaPersonas.filter(function(p) { return p.id !== id; });
    if (Array.isArray(APP_STATE.gruposPersonas)) {
        APP_STATE.gruposPersonas.forEach(function(g) {
            if (Array.isArray(g.personaIds)) {
                g.personaIds = g.personaIds.filter(function(pid) { return String(pid) !== String(id); });
                g.fechaActualizacion = Date.now();
            }
        });
    }
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
    if (typeof renderizarCalendario === 'function') renderizarCalendario();
    if (typeof refrescarSelectoresPersonasCalendario === 'function') refrescarSelectoresPersonasCalendario();
}

function abrirModalNuevaPersona(editId) {
    var m = document.getElementById('modal-nueva-persona');
    if (!m) return;

    var inEdit = document.getElementById('input-per-edit-id');
    var inNom = document.getElementById('input-per-nombre');
    var inRol = document.getElementById('input-per-rol');
    var inUbi = document.getElementById('input-per-ubicacion');
    var inLug = document.getElementById('input-per-lugar');
    var inTem = document.getElementById('input-per-temas');
    var inFec = document.getElementById('input-per-fecha');
    var inTel = document.getElementById('input-per-telefono');
    var inEst = document.getElementById('input-per-estado');
    var inNot = document.getElementById('input-per-notas');
    var tituloModal = document.getElementById('titulo-modal-persona');
    var subModal = document.getElementById('subtitulo-modal-persona');
    var btnGuardar = document.getElementById('btn-guardar-persona');

    var p = editId ? (APP_STATE.agendaPersonas || []).find(function(item) { return String(item.id) === String(editId); }) : null;

    if (p) {
        if (inEdit) inEdit.value = String(p.id);
        if (inNom) inNom.value = p.nombre || '';
        if (inRol) inRol.value = p.rol || '';
        if (inUbi) {
            var optVal = p.ubicacionCategoria || '💈 Barbería';
            var hasOpt = Array.from(inUbi.options || []).some(function(o) { return o.value === optVal; });
            inUbi.value = hasOpt ? optVal : '💬 Otro';
        }
        if (inLug) inLug.value = p.lugarProyectado || '';
        if (inTem) {
            inTem.value = (p.temasPendientes || []).map(function(t) { return t.texto || ''; }).filter(Boolean).join('\n');
        }
        if (inFec) inFec.value = p.fechaObjetivo || '';
        if (inTel) inTel.value = p.telefono || p.whatsapp || '';
        if (inEst) inEst.value = p.estado || 'Pendiente';
        if (inNot) inNot.value = p.notas || '';
        if (tituloModal) tituloModal.textContent = 'EDITAR CONTACTO & CONVERSACIÓN';
        if (subModal) subModal.textContent = 'Actualiza sus datos, temas a tratar o notas (se conserva el avance de los temas ya marcados).';
        if (btnGuardar) btnGuardar.textContent = '💾 Guardar Cambios';
    } else {
        if (inEdit) inEdit.value = '';
        if (inNom) inNom.value = '';
        if (inRol) inRol.value = '';
        if (inUbi) inUbi.value = '💈 Barbería';
        if (inLug) inLug.value = '';
        if (inTem) inTem.value = '';
        if (inFec) inFec.value = '';
        if (inTel) inTel.value = '';
        if (inEst) inEst.value = 'Pendiente';
        if (inNot) inNot.value = '';
        if (tituloModal) tituloModal.textContent = 'AGREGAR CONTACTO & CONVERSACIÓN';
        if (subModal) subModal.textContent = 'Registra una persona de interés, temas que debes conversar y la ubicación donde proyectas encontrarla.';
        if (btnGuardar) btnGuardar.textContent = '👥 Guardar Contacto';
    }

    m.style.display = 'flex';
    if (inNom) setTimeout(function() { inNom.focus(); }, 60);
}

function cerrarModalNuevaPersona() {
    var m = document.getElementById('modal-nueva-persona');
    if (m) m.style.display = 'none';
}

function guardarNuevaPersona() {
    var inEdit = document.getElementById('input-per-edit-id');
    var inNom = document.getElementById('input-per-nombre');
    var inRol = document.getElementById('input-per-rol');
    var inUbi = document.getElementById('input-per-ubicacion');
    var inLug = document.getElementById('input-per-lugar');
    var inTem = document.getElementById('input-per-temas');
    var inFec = document.getElementById('input-per-fecha');
    var inTel = document.getElementById('input-per-telefono');
    var inEst = document.getElementById('input-per-estado');
    var inNot = document.getElementById('input-per-notas');

    var editId = inEdit ? inEdit.value.trim() : '';
    var nom = inNom ? inNom.value.trim() : '';
    var rol = inRol ? (inRol.value.trim() || 'Contacto') : 'Contacto';
    var ubi = inUbi ? inUbi.value : '💈 Barbería';
    var lug = inLug ? inLug.value.trim() : '';
    var rawTemas = inTem ? inTem.value.trim() : '';
    var fec = inFec ? (inFec.value.trim() || 'Esta semana') : 'Esta semana';
    var tel = inTel ? inTel.value.trim() : '';
    var est = inEst ? (inEst.value || 'Pendiente') : 'Pendiente';
    var notas = inNot ? inNot.value.trim() : '';

    if (!nom) { alert("Ingresa el nombre de la persona."); if (inNom) inNom.focus(); return; }

    if (!APP_STATE.agendaPersonas) APP_STATE.agendaPersonas = [];
    var ahora = Date.now();

    if (editId) {
        var existente = APP_STATE.agendaPersonas.find(function(item) { return String(item.id) === String(editId); });
        if (existente) {
            var temasPrevios = Array.isArray(existente.temasPendientes) ? existente.temasPendientes : [];
            var mapaPrevios = {};
            temasPrevios.forEach(function(tp) {
                var k = String(tp.texto || '').trim().toLowerCase();
                if (k && !mapaPrevios[k]) mapaPrevios[k] = tp;
            });

            var nuevosTemas = [];
            if (rawTemas) {
                rawTemas.split('\n').forEach(function(line, seq) {
                    var t = line.trim();
                    if (!t) return;
                    var prevT = mapaPrevios[t.toLowerCase()];
                    if (prevT) {
                        nuevosTemas.push({ id: prevT.id, texto: t, hecho: !!prevT.hecho });
                    } else {
                        nuevosTemas.push({ id: "T-" + ahora + "-" + seq + "-" + Math.random().toString(36).substr(2, 5), texto: t, hecho: false });
                    }
                });
            }

            var estadoAnterior = String(existente.estado || 'Pendiente');
            existente.nombre = nom;
            existente.rol = rol;
            existente.telefono = tel;
            existente.ubicacionCategoria = ubi;
            existente.lugarProyectado = lug || ubi;
            existente.temasPendientes = nuevosTemas;
            existente.fechaObjetivo = fec;
            existente.estado = est;
            existente.notas = notas;
            existente.fechaActualizacion = ahora;

            if (estadoAnterior !== 'Conversado' && est === 'Conversado') {
                sumarExp(20);
            }
            MonarcaDB.save(APP_STATE);
            cerrarModalNuevaPersona();
            renderizarAgendaPersonas();
            if (typeof refrescarSelectoresPersonasCalendario === 'function') refrescarSelectoresPersonasCalendario();
            if (typeof renderizarCalendario === 'function') renderizarCalendario();
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca("Contacto '" + nom + "' actualizado", '✏️');
            }
            return;
        }
    }

    var temasList = [];
    if (rawTemas) {
        rawTemas.split('\n').forEach(function(line) {
            var t = line.trim();
            if (t) temasList.push({ id: "T-" + Math.random().toString(36).substr(2, 9), texto: t, hecho: false });
        });
    }

    var nuevo = {
        id: "PER-" + ahora + "-" + Math.random().toString(36).substr(2, 4),
        nombre: nom,
        rol: rol,
        telefono: tel,
        ubicacionCategoria: ubi,
        lugarProyectado: lug || ubi,
        temasPendientes: temasList,
        fechaObjetivo: fec,
        estado: est,
        notas: notas,
        timestamp: ahora,
        fechaActualizacion: ahora
    };

    APP_STATE.agendaPersonas.unshift(nuevo);
    sumarExp(15);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevaPersona();
    renderizarAgendaPersonas();
    if (typeof refrescarSelectoresPersonasCalendario === 'function') refrescarSelectoresPersonasCalendario();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca("Contacto '" + nom + "' agregado a Personas", '👥');
    } else {
        alert("👥 Contacto '" + nom + "' agregado a la agenda con sus temas pendientes.");
    }
}

if (typeof window !== 'undefined') {
    window.alBuscarPersonas = alBuscarPersonas;
    window.limpiarBusquedaPersonas = limpiarBusquedaPersonas;
    window.filtrarPersonasPorEstado = filtrarPersonasPorEstado;
    window.limpiarTodosFiltrosPersonas = limpiarTodosFiltrosPersonas;
    window.obtenerEventosCalendarioDePersona = obtenerEventosCalendarioDePersona;
    window.agendarPersonaEnCalendario = agendarPersonaEnCalendario;
}

function obtenerIngresosPendientesDePersonaAgenda(personaObj) {
    if (!personaObj || !personaObj.nombre || !APP_STATE || !APP_STATE.finanzas || !Array.isArray(APP_STATE.finanzas.ingresos)) {
        return { items: [], totalUsd: 0 };
    }
    var nomNorm = String(personaObj.nombre).trim().toLowerCase();
    if (!nomNorm) return { items: [], totalUsd: 0 };

    var items = [];
    var totalUsd = 0;
    APP_STATE.finanzas.ingresos.forEach(function(ing) {
        if (!ing || ing.cobrado) return;
        var cands = [ing.personaCobro, ing.personaPrestamo, ing.cliente].map(function(x) {
            return String(x || '').trim().toLowerCase();
        });
        var fuenteLow = String(ing.fuente || '').toLowerCase();
        var matchExact = cands.some(function(c) { return c && c === nomNorm; });
        var matchFuente = !matchExact && nomNorm.length >= 3 && fuenteLow.indexOf(nomNorm) !== -1;
        if (matchExact || matchFuente) {
            items.push(ing);
            totalUsd += (Number(ing.monto) || 0);
        }
    });
    items.sort(function(a, b) {
        return String(a.fecha || '').localeCompare(String(b.fecha || ''));
    });
    return { items: items, totalUsd: Math.round(totalUsd * 100) / 100 };
}

function editarTelefonoPersonaRapido(personaId) {
    if (!APP_STATE || !Array.isArray(APP_STATE.agendaPersonas)) return;
    var p = APP_STATE.agendaPersonas.find(function(x) { return x && x.id === personaId; });
    if (!p) return;
    var actual = String(p.telefono || p.whatsapp || '').trim();
    var nuevoTel = prompt('WhatsApp / Teléfono para ' + (p.nombre || 'contacto') + ' (ej: +584121234567):', actual);
    if (nuevoTel === null) return;
    p.telefono = String(nuevoTel).trim();
    p.fechaActualizacion = Date.now();
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca(p.telefono ? ('Teléfono guardado en ' + p.nombre) : 'Teléfono borrado', '📱');
    }
}

function abrirCobroWhatsAppParaPersona(personaId) {
    if (!APP_STATE || !Array.isArray(APP_STATE.agendaPersonas)) return;
    var p = APP_STATE.agendaPersonas.find(function(x) { return x && x.id === personaId; });
    if (!p || typeof window.abrirModalCobroWhatsAppFinanzas !== 'function') return;

    var resPend = obtenerIngresosPendientesDePersonaAgenda(p);
    if (resPend.items.length > 0) {
        window.abrirModalCobroWhatsAppFinanzas(resPend.items[0].id);
        return;
    }

    var totalSug = resPend.totalUsd > 0 ? resPend.totalUsd : 0;
    window.abrirModalCobroWhatsAppFinanzas({
        modo: 'directo',
        persona: p.nombre || '',
        telefono: p.telefono || p.whatsapp || '',
        concepto: totalSug > 0 ? 'saldo pendiente' : '',
        monto: totalSug
    });
}

if (typeof window !== 'undefined') {
    window.editarTelefonoPersonaRapido = editarTelefonoPersonaRapido;
    window.abrirCobroWhatsAppParaPersona = abrirCobroWhatsAppParaPersona;
}

function abrirModalGrupoPersonas(grupoId) {
    var modal = document.getElementById('modal-grupo-personas');
    if (!modal) return;
    if (!Array.isArray(APP_STATE.gruposPersonas)) APP_STATE.gruposPersonas = [];
    if (!Array.isArray(APP_STATE.agendaPersonas)) APP_STATE.agendaPersonas = [];

    var inId = document.getElementById('input-grupo-id');
    var inNom = document.getElementById('input-grupo-nombre');
    var inIco = document.getElementById('input-grupo-icono');
    var inCol = document.getElementById('input-grupo-color');
    var tituloModal = document.getElementById('titulo-modal-grupo-personas');
    var contMiembros = document.getElementById('contenedor-miembros-grupo-personas');

    var grupo = grupoId ? APP_STATE.gruposPersonas.find(function(g) { return String(g.id) === String(grupoId); }) : null;
    if (inId) inId.value = grupo ? grupo.id : '';
    if (inNom) inNom.value = grupo ? (grupo.nombre || '') : '';
    if (inIco) inIco.value = grupo ? (grupo.icono || '👥') : '👥';
    if (inCol) inCol.value = grupo ? (grupo.color || '#6366f1') : '#6366f1';
    if (tituloModal) tituloModal.textContent = grupo ? 'EDITAR GRUPO DE PERSONAS' : 'NUEVO GRUPO DE PERSONAS';

    var selIds = grupo && Array.isArray(grupo.personaIds) ? grupo.personaIds.map(String) : [];
    if (contMiembros) {
        if (APP_STATE.agendaPersonas.length === 0) {
            contMiembros.innerHTML = '<div style="font-size:12px; color:#94a3b8; padding:10px; text-align:center;">Aún no tienes contactos en Personas. Agrega contactos primero para asignarlos al grupo.</div>';
        } else {
            contMiembros.innerHTML = APP_STATE.agendaPersonas.map(function(p) {
                var checked = selIds.indexOf(String(p.id)) !== -1 ? 'checked' : '';
                return '<label class="grupo-miembro-check-row">' +
                    '<input type="checkbox" class="check-miembro-grupo-persona" value="' + escHtmlPersona(p.id) + '" ' + checked + '>' +
                    '<span style="flex:1; min-width:0;">' +
                        '<strong style="color:#f8fafc; font-size:12.5px;">' + escHtmlPersona(p.nombre) + '</strong>' +
                        (p.rol ? ' <span style="color:#94a3b8; font-size:11px;">· ' + escHtmlPersona(p.rol) + '</span>' : '') +
                    '</span>' +
                '</label>';
            }).join('');
        }
    }

    modal.style.display = 'flex';
    if (inNom) setTimeout(function() { inNom.focus(); }, 60);
}

function cerrarModalGrupoPersonas() {
    var modal = document.getElementById('modal-grupo-personas');
    if (modal) modal.style.display = 'none';
}

function guardarGrupoPersonas() {
    var inId = document.getElementById('input-grupo-id');
    var inNom = document.getElementById('input-grupo-nombre');
    var inIco = document.getElementById('input-grupo-icono');
    var inCol = document.getElementById('input-grupo-color');

    var nombre = inNom ? inNom.value.trim() : '';
    if (!nombre) {
        alert('Ingresa el nombre del grupo.');
        if (inNom) inNom.focus();
        return;
    }

    var checks = document.querySelectorAll('.check-miembro-grupo-persona:checked');
    var personaIds = [];
    checks.forEach(function(ch) {
        if (ch.value) personaIds.push(ch.value);
    });

    if (!Array.isArray(APP_STATE.gruposPersonas)) APP_STATE.gruposPersonas = [];
    var editId = inId ? inId.value.trim() : '';
    var ahora = Date.now();

    if (editId) {
        var existente = APP_STATE.gruposPersonas.find(function(g) { return String(g.id) === String(editId); });
        if (existente) {
            existente.nombre = nombre;
            existente.icono = inIco ? inIco.value : '👥';
            existente.color = inCol ? inCol.value : '#6366f1';
            existente.personaIds = personaIds;
            existente.fechaActualizacion = ahora;
        }
    } else {
        APP_STATE.gruposPersonas.push({
            id: 'GRP-' + ahora + '-' + Math.random().toString(36).substr(2, 4),
            nombre: nombre,
            icono: inIco ? inIco.value : '👥',
            color: inCol ? inCol.value : '#6366f1',
            personaIds: personaIds,
            timestamp: ahora,
            fechaActualizacion: ahora
        });
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalGrupoPersonas();
    renderizarAgendaPersonas();
    if (typeof refrescarSelectoresPersonasCalendario === 'function') refrescarSelectoresPersonasCalendario();
    if (typeof renderizarCalendario === 'function') renderizarCalendario();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca("Grupo '" + nombre + "' guardado", '👥');
    }
}

function eliminarGrupoPersonas(grupoId) {
    if (!confirm('¿Eliminar este grupo de personas? (Los contactos individuales no se borrarán)')) return;
    if (!Array.isArray(APP_STATE.gruposPersonas)) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('gruposPersonas', grupoId);
    }
    APP_STATE.gruposPersonas = APP_STATE.gruposPersonas.filter(function(g) { return String(g.id) !== String(grupoId); });
    if (String(FILTRO_GRUPO_PERSONAS) === String(grupoId)) FILTRO_GRUPO_PERSONAS = 'TODOS';
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
    if (typeof refrescarSelectoresPersonasCalendario === 'function') refrescarSelectoresPersonasCalendario();
    if (typeof renderizarCalendario === 'function') renderizarCalendario();
}


// ==========================================================================
// 3. RULETA DE VARIABILIDAD SEMANAL (COMIDAS, VESTIMENTA Y MÚSICA)
// ==========================================================================

var RULETA_EN_GIRO = false;
var CATEGORIA_RULETA_ACTIVA = "musica";

function _ruletaEscapar(txt) {
    if (typeof escaparHTML === 'function') return escaparHTML(txt == null ? '' : String(txt));
    return String(txt == null ? '' : txt)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function obtenerPlaylistsReproductorParaRuleta() {
    var mapa = {};
    var elimSet = {};
    if (APP_STATE && APP_STATE._eliminados && Array.isArray(APP_STATE._eliminados.reproductorPlaylists)) {
        APP_STATE._eliminados.reproductorPlaylists.forEach(function(tid) { elimSet[String(tid)] = true; });
    }

    var agregar = function(lista) {
        if (!Array.isArray(lista)) return;
        lista.forEach(function(pl) {
            if (!pl || !pl.id) return;
            var idStr = String(pl.id);
            if (elimSet[idStr]) return;
            if (!mapa[idStr]) {
                mapa[idStr] = pl;
            } else {
                var prevC = Array.isArray(mapa[idStr].cancionIds) ? mapa[idStr].cancionIds.length : 0;
                var nextC = Array.isArray(pl.cancionIds) ? pl.cancionIds.length : 0;
                if (nextC > prevC) mapa[idStr] = pl;
            }
        });
    };

    try {
        if (window.MonarcaPlayer && typeof window.MonarcaPlayer.getPlaylists === 'function') {
            agregar(window.MonarcaPlayer.getPlaylists());
        }
    } catch (e) {}

    try {
        var raw = localStorage.getItem('monarca_musica_playlists');
        if (raw) agregar(JSON.parse(raw));
    } catch (e) {}

    if (APP_STATE && Array.isArray(APP_STATE.reproductorPlaylists)) {
        agregar(APP_STATE.reproductorPlaylists);
    }

    var rs = (APP_STATE && APP_STATE.ruletaSemanal) ? APP_STATE.ruletaSemanal : {};
    var excluidasArr = Array.isArray(rs.playlistsExcluidas) ? rs.playlistsExcluidas : [];
    var excluidasMap = {};
    excluidasArr.forEach(function(id) { excluidasMap[String(id)] = true; });

    return Object.keys(mapa).map(function(k) {
        var pl = mapa[k];
        var count = Array.isArray(pl.cancionIds) ? pl.cancionIds.length : 0;
        var idStr = String(pl.id);
        return {
            id: idStr,
            playlistId: idStr,
            nombre: (pl.nombre && String(pl.nombre).trim()) ? String(pl.nombre).trim() : 'Lista sin nombre',
            cancionesCount: count,
            incluidaEnRuleta: !excluidasMap[idStr],
            esPlaylistReproductor: true,
            genero: count + (count === 1 ? ' canción' : ' canciones') + ' · Lista del Reproductor'
        };
    });
}

function obtenerOpcionesRuletaCategoria(categoria) {
    if (categoria === 'musica') {
        return obtenerPlaylistsReproductorParaRuleta().filter(function(pl) {
            return pl.incluidaEnRuleta;
        });
    }
    var rs = (APP_STATE && APP_STATE.ruletaSemanal) || DEFAULT_STATE.ruletaSemanal;
    return Array.isArray(rs[categoria]) ? rs[categoria] : [];
}

function togglePlaylistEnRuleta(playlistId) {
    if (!APP_STATE.ruletaSemanal) {
        APP_STATE.ruletaSemanal = JSON.parse(JSON.stringify(DEFAULT_STATE.ruletaSemanal));
    }
    if (!Array.isArray(APP_STATE.ruletaSemanal.playlistsExcluidas)) {
        APP_STATE.ruletaSemanal.playlistsExcluidas = [];
    }
    var idStr = String(playlistId || '');
    var idx = APP_STATE.ruletaSemanal.playlistsExcluidas.indexOf(idStr);
    var incluidaAhora = false;
    if (idx !== -1) {
        APP_STATE.ruletaSemanal.playlistsExcluidas.splice(idx, 1);
        incluidaAhora = true;
    } else {
        APP_STATE.ruletaSemanal.playlistsExcluidas.push(idStr);
        incluidaAhora = false;
    }
    MonarcaDB.save(APP_STATE);
    renderizarRuletaSemanal();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca(incluidaAhora ? 'Lista activada en la ruleta' : 'Lista omitida de la ruleta', incluidaAhora ? '🎲' : '⏸️');
    }
}

function reproducirPlaylistDesdeRuleta(playlistId) {
    var idStr = String(playlistId || '');
    if (!idStr) return;
    var todas = obtenerPlaylistsReproductorParaRuleta();
    var pl = todas.find(function(p) { return p.id === idStr; });
    if (!pl) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Esa lista ya no existe en el Reproductor', '⚠️');
        }
        renderizarRuletaSemanal();
        return;
    }
    if (pl.cancionesCount === 0) {
        if (typeof cambiarVista === 'function') cambiarVista('vista-reproductor');
        if (window.MonarcaPlayer && typeof window.MonarcaPlayer.cambiarSubtab === 'function') {
            window.MonarcaPlayer.cambiarSubtab('playlists');
        }
        if (window.MonarcaPlayer && typeof window.MonarcaPlayer.reproducirPlaylistDirecto === 'function') {
            window.MonarcaPlayer.reproducirPlaylistDirecto(idStr);
        }
        return;
    }
    if (window.MonarcaPlayer && typeof window.MonarcaPlayer.reproducirPlaylistDirecto === 'function') {
        window.MonarcaPlayer.reproducirPlaylistDirecto(idStr);
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Reproduciendo: ' + pl.nombre, '🎧');
        }
    } else {
        if (typeof cambiarVista === 'function') cambiarVista('vista-reproductor');
    }
}

function irACrearPlaylistDesdeRuleta(abrirModal) {
    if (typeof cambiarVista === 'function') cambiarVista('vista-reproductor');
    if (window.MonarcaPlayer && typeof window.MonarcaPlayer.cambiarSubtab === 'function') {
        window.MonarcaPlayer.cambiarSubtab('playlists');
    }
    if (abrirModal && window.MonarcaPlayer && typeof window.MonarcaPlayer.abrirModalCrearPlaylist === 'function') {
        setTimeout(function() {
            window.MonarcaPlayer.abrirModalCrearPlaylist();
        }, 120);
    }
}

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
    var todasPlaylists = obtenerPlaylistsReproductorParaRuleta();
    var playlistsActivas = todasPlaylists.filter(function(p) { return p.incluidaEnRuleta; });

    // Resolver si la selección activa de música apunta a una playlist real del reproductor
    var act = rs.seleccionActiva || {};
    var playlistElegida = null;
    if (act.musicaPlaylistId) {
        playlistElegida = todasPlaylists.find(function(p) { return p.id === String(act.musicaPlaylistId); }) || null;
    }
    if (!playlistElegida && act.musica) {
        playlistElegida = todasPlaylists.find(function(p) { return p.nombre.toLowerCase() === String(act.musica).trim().toLowerCase(); }) || null;
    }

    // 1. Banner de Selección Activa de Variabilidad
    if (contResultado) {
        var com = _ruletaEscapar(act.comida || "Sin girar aún");
        var ves = _ruletaEscapar(act.vestimenta || "Sin girar aún");
        var fec = _ruletaEscapar(act.fechaGiro || "Hoy");

        var musTituloHtml = '';
        var musSubHtml = '';
        var musAccionesHtml = '';

        if (playlistElegida) {
            musTituloHtml = _ruletaEscapar(playlistElegida.nombre);
            musSubHtml = `<div class="ruleta-pl-meta-line">🎶 ${playlistElegida.cancionesCount} ${playlistElegida.cancionesCount === 1 ? 'canción' : 'canciones'} · Lista del Reproductor</div>`;
            musAccionesHtml = `
                <div class="ruleta-result-actions">
                    <button type="button" class="btn-sheet-action" style="font-size: 11px; padding: 5px 10px;" onclick="girarRuletaIndividual('musica')">🔄 Girar Lista</button>
                    <button type="button" class="ruleta-pl-play-pill" onclick="reproducirPlaylistDesdeRuleta('${_ruletaEscapar(playlistElegida.id)}')">▶️ Escuchar</button>
                </div>`;
        } else if (todasPlaylists.length > 0) {
            musTituloHtml = 'Sin girar lista aún';
            musSubHtml = `<div class="ruleta-pl-meta-line">🎧 ${playlistsActivas.length} ${playlistsActivas.length === 1 ? 'lista activa' : 'listas activas'} desde tu Reproductor</div>`;
            musAccionesHtml = `
                <div class="ruleta-result-actions">
                    <button type="button" class="btn-sheet-action" style="font-size: 11px; padding: 5px 10px;" onclick="girarRuletaIndividual('musica')">🔄 Girar Lista</button>
                </div>`;
        } else {
            musTituloHtml = 'Sin listas en tu Reproductor';
            musSubHtml = `<div class="ruleta-pl-meta-line">Crea listas en Música para sortearlas aquí</div>`;
            musAccionesHtml = `
                <div class="ruleta-result-actions">
                    <button type="button" class="ruleta-pl-play-pill" onclick="irACrearPlaylistDesdeRuleta(true)">➕ Crear Lista</button>
                </div>`;
        }

        contResultado.innerHTML = `
        <div class="weekly-review-banner" style="border-left-color: #818cf8;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                <div>
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">Protocolo Anti-Monotonía</div>
                    <h3 style="margin: 2px 0 0 0; font-size: 17px; font-weight: 800; color: #f8fafc;">Selección Activa de Variabilidad</h3>
                </div>
                <span class="ruleta-sync-chip">🎧 Conectada a tus Playlists</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 10px;">
                <div class="ruleta-sel-card">
                    <div class="ruleta-sel-label">🍲 Comida Elegida</div>
                    <div class="ruleta-sel-value">${com}</div>
                    <div class="ruleta-result-actions">
                        <button type="button" class="btn-sheet-action" style="font-size: 11px; padding: 5px 10px;" onclick="girarRuletaIndividual('comidas')">🔄 Girar Comida</button>
                    </div>
                </div>
                <div class="ruleta-sel-card">
                    <div class="ruleta-sel-label">👔 Outfit del Día</div>
                    <div class="ruleta-sel-value">${ves}</div>
                    <div class="ruleta-result-actions">
                        <button type="button" class="btn-sheet-action" style="font-size: 11px; padding: 5px 10px;" onclick="girarRuletaIndividual('vestimenta')">🔄 Girar Outfit</button>
                    </div>
                </div>
                <div class="ruleta-sel-card ruleta-sel-card-musica">
                    <div class="ruleta-sel-label">🎵 Lista de Reproducción</div>
                    <div class="ruleta-sel-value">${musTituloHtml}</div>
                    ${musSubHtml}
                    ${musAccionesHtml}
                </div>
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 10px; text-align: right;">Último giro: ${fec}</div>
        </div>`;
    }

    // 2. Visualizador de la Ruleta (Canvas + indicador de categoría cargada en el disco)
    dibujarRuletaEnCanvas();
    var indDisco = document.getElementById('ruleta-disco-cat-pill');
    if (indDisco) {
        if (CATEGORIA_RULETA_ACTIVA === 'musica') {
            indDisco.textContent = '🎵 En ruleta: Tus Playlists (' + playlistsActivas.length + ')';
        } else if (CATEGORIA_RULETA_ACTIVA === 'vestimenta') {
            indDisco.textContent = '👔 En ruleta: Vestimenta (' + ((rs.vestimenta || []).length) + ')';
        } else {
            indDisco.textContent = '🍲 En ruleta: Comidas (' + ((rs.comidas || []).length) + ')';
        }
    }

    // 3. Banco de Opciones por Categoría
    if (contOpciones) {
        var esMusica = CATEGORIA_RULETA_ACTIVA === 'musica';
        var countMusicaLabel = playlistsActivas.length === todasPlaylists.length
            ? String(todasPlaylists.length)
            : (playlistsActivas.length + '/' + todasPlaylists.length);

        var botonDerechaHtml = esMusica
            ? `<div style="display: flex; gap: 6px; flex-wrap: wrap;">
                   <button type="button" class="btn-sheet-action" onclick="irACrearPlaylistDesdeRuleta(true)">➕ Nueva Lista</button>
                   <button type="button" class="btn-sheet-action" onclick="irACrearPlaylistDesdeRuleta(false)">🎧 Reproductor</button>
               </div>`
            : `<button type="button" class="btn-sheet-action" onclick="abrirModalNuevaOpcionRuleta()">+ Agregar Opción</button>`;

        var htmlOps = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button type="button" class="btn-tab-con-area ${CATEGORIA_RULETA_ACTIVA === 'comidas' ? 'active' : ''}" onclick="cambiarTabBancoRuleta('comidas')">🍲 Comidas (${(rs.comidas||[]).length})</button>
                <button type="button" class="btn-tab-con-area ${CATEGORIA_RULETA_ACTIVA === 'vestimenta' ? 'active' : ''}" onclick="cambiarTabBancoRuleta('vestimenta')">👔 Vestimenta (${(rs.vestimenta||[]).length})</button>
                <button type="button" class="btn-tab-con-area ${esMusica ? 'active' : ''}" onclick="cambiarTabBancoRuleta('musica')">🎵 Playlists (${countMusicaLabel})</button>
            </div>
            ${botonDerechaHtml}
        </div>`;

        if (esMusica) {
            htmlOps += `
            <div class="ruleta-playlist-sync-bar">
                <span>🎧 Sincronizado en vivo con las <strong>Listas de Reproducción</strong> de tu Reproductor de Música.</span>
                <span style="color: #7dd3fc; font-weight: 700;">${playlistsActivas.length} de ${todasPlaylists.length} en ruleta</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 8px;">`;

            if (todasPlaylists.length === 0) {
                htmlOps += `
                <div style="grid-column: 1 / -1; text-align: center; padding: 26px 16px; background: #0b0e15; border: 1px dashed rgba(129, 140, 248, 0.35); border-radius: 12px;">
                    <div style="font-size: 26px; margin-bottom: 6px;">🎶</div>
                    <p style="margin: 0 0 6px 0; color: #f8fafc; font-size: 13.5px; font-weight: 700;">Aún no tienes listas de reproducción</p>
                    <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 12px;">Crea tus playlists en el Reproductor MP3 (ej: Entrenamiento, Salsa, Llaneras, Focus) y aparecerán automáticamente aquí para girarlas.</p>
                    <button type="button" class="ruleta-pl-play-pill" onclick="irACrearPlaylistDesdeRuleta(true)">➕ Crear mi primera Playlist</button>
                </div>`;
            } else {
                todasPlaylists.forEach(function(pl) {
                    var esElegida = playlistElegida && playlistElegida.id === pl.id;
                    var clsEstado = pl.incluidaEnRuleta ? 'is-included' : 'is-excluded';
                    htmlOps += `
                    <div class="ruleta-option-item ruleta-playlist-card ${clsEstado} ${esElegida ? 'is-winner' : ''}">
                        <div style="min-width: 0; flex: 1;">
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                <strong style="font-size: 13px; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${_ruletaEscapar(pl.nombre)}</strong>
                                ${esElegida ? '<span class="ruleta-pl-winner-tag">★ Elegida</span>' : ''}
                            </div>
                            <span style="font-size: 11px; color: #94a3b8;">🎶 ${pl.cancionesCount} ${pl.cancionesCount === 1 ? 'canción' : 'canciones'}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                            <button type="button" class="ruleta-pl-play-btn" onclick="reproducirPlaylistDesdeRuleta('${_ruletaEscapar(pl.id)}')" title="Reproducir esta lista ahora">▶️</button>
                            <button type="button" class="ruleta-pl-toggle-btn ${pl.incluidaEnRuleta ? 'active' : ''}" onclick="togglePlaylistEnRuleta('${_ruletaEscapar(pl.id)}')" title="${pl.incluidaEnRuleta ? 'Omitir de la ruleta (no borra tu playlist)' : 'Incluir nuevamente en la ruleta'}">
                                ${pl.incluidaEnRuleta ? '✓ Activa' : 'Omitida'}
                            </button>
                        </div>
                    </div>`;
                });
            }
            htmlOps += `</div>`;
        } else {
            var items = rs[CATEGORIA_RULETA_ACTIVA] || [];
            htmlOps += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px;">`;
            if (items.length === 0) {
                htmlOps += `
                <div style="grid-column: 1 / -1; text-align: center; padding: 26px 16px; background: #0b0e15; border: 1px dashed rgba(255, 255, 255, 0.16); border-radius: 10px;">
                    <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 13px;">No hay opciones registradas en esta categoría aún.</p>
                    <button type="button" class="btn-sheet-action" onclick="abrirModalNuevaOpcionRuleta()">+ Agregar tu primera opción</button>
                </div>`;
            } else {
                items.forEach(function(item) {
                    var subtag = _ruletaEscapar(item.tipo || item.estilo || item.genero || 'Variabilidad');
                    htmlOps += `
                    <div class="ruleta-option-item" style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <div style="min-width: 0;">
                            <strong style="font-size: 13px; color: #f8fafc; display: block;">${_ruletaEscapar(item.nombre)}</strong>
                            <span style="font-size: 11px; color: #94a3b8;">${subtag}</span>
                        </div>
                        <button type="button" onclick="eliminarOpcionRuleta('${CATEGORIA_RULETA_ACTIVA}', '${_ruletaEscapar(item.id)}')" title="Eliminar opción" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 13px; flex-shrink: 0;" onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='#94a3b8'">✕</button>
                    </div>`;
                });
            }
            htmlOps += `</div>`;
        }

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

    var items = obtenerOpcionesRuletaCategoria(CATEGORIA_RULETA_ACTIVA);

    var width = canvas.width;
    var height = canvas.height;
    var cx = width / 2;
    var cy = height / 2;
    var radio = Math.min(cx, cy) - 10;

    ctx.clearRect(0, 0, width, height);

    if (items.length === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radio, 0, 2 * Math.PI);
        ctx.fillStyle = '#121725';
        ctx.fill();
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(CATEGORIA_RULETA_ACTIVA === 'musica' ? 'Crea o activa playlists' : 'Sin opciones aún', cx, cy);
        return;
    }

    var numSectores = items.length;
    var arc = (2 * Math.PI) / numSectores;

    var colores = ['#312e81', '#0e7490', '#1e3a5f', '#4c1d95', '#065f46', '#1e293b', '#3730a3', '#155e75'];

    for (var i = 0; i < numSectores; i++) {
        var anguloInicio = ANGULO_ACTUAL_RULETA + i * arc;
        var anguloFin = anguloInicio + arc;

        ctx.beginPath();
        ctx.fillStyle = colores[i % colores.length];
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radio, anguloInicio, anguloFin);
        ctx.lineTo(cx, cy);
        ctx.fill();
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.24)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(anguloInicio + arc / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10.5px Plus Jakarta Sans, sans-serif';
        var nombreRaw = String(items[i].nombre || '');
        var textoCorto = nombreRaw.length > 17 ? nombreRaw.substr(0, 15) + '…' : nombreRaw;
        ctx.fillText(textoCorto, radio - 14, 0, Math.max(60, radio - 38));
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f131d';
    ctx.fill();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#e2e8f0';
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

    var duracion = 3000;
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
    var items = obtenerOpcionesRuletaCategoria(categoria);
    if (items.length === 0) {
        renderizarRuletaSemanal();
        if (categoria === 'musica') {
            var todas = obtenerPlaylistsReproductorParaRuleta();
            if (todas.length === 0) {
                if (typeof mostrarToastMonarca === 'function') {
                    mostrarToastMonarca('Crea al menos una lista de reproducción en tu Reproductor MP3 primero', '🎧');
                }
                irACrearPlaylistDesdeRuleta(true);
            } else if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca('Activa al menos una playlist en la ruleta para poder girar', '🎵');
            }
        } else if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Agrega opciones en ' + categoria + ' para girar', '🎲');
        }
        return;
    }

    renderizarRuletaSemanal();
    animarGiroRuleta(items, function(ganador) {
        if (!APP_STATE.ruletaSemanal) APP_STATE.ruletaSemanal = JSON.parse(JSON.stringify(DEFAULT_STATE.ruletaSemanal));
        if (!APP_STATE.ruletaSemanal.seleccionActiva) APP_STATE.ruletaSemanal.seleccionActiva = {};
        if (categoria === 'comidas') APP_STATE.ruletaSemanal.seleccionActiva.comida = ganador.nombre;
        if (categoria === 'vestimenta') APP_STATE.ruletaSemanal.seleccionActiva.vestimenta = ganador.nombre;
        if (categoria === 'musica') {
            APP_STATE.ruletaSemanal.seleccionActiva.musica = ganador.nombre;
            APP_STATE.ruletaSemanal.seleccionActiva.musicaPlaylistId = ganador.playlistId || ganador.id || null;
        }

        APP_STATE.ruletaSemanal.seleccionActiva.fechaGiro = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        sumarExp(10);
        MonarcaDB.save(APP_STATE);
        renderizarRuletaSemanal();
        if (typeof mostrarToastMonarca === 'function') {
            var prefijo = categoria === 'musica' ? '🎵 Playlist elegida: ' : '🎲 Elegido: ';
            mostrarToastMonarca(prefijo + ganador.nombre + ' (+10 EXP)', categoria === 'musica' ? '🎧' : '🎲');
        }
    });
}

function girarRuletaCompleta() {
    if (RULETA_EN_GIRO) return;
    var coms = obtenerOpcionesRuletaCategoria('comidas');
    var vess = obtenerOpcionesRuletaCategoria('vestimenta');
    var muss = obtenerOpcionesRuletaCategoria('musica');

    if (coms.length === 0 || vess.length === 0) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Agrega al menos una opción en Comidas y Vestimenta para el giro completo', '🎲');
        }
        return;
    }

    var winCom = coms[Math.floor(Math.random() * coms.length)];
    var winVes = vess[Math.floor(Math.random() * vess.length)];
    var winMus = muss.length > 0 ? muss[Math.floor(Math.random() * muss.length)] : null;

    var itemsAnimar = (CATEGORIA_RULETA_ACTIVA === 'musica' && muss.length > 0)
        ? muss
        : (CATEGORIA_RULETA_ACTIVA === 'vestimenta' ? vess : coms);
    if (CATEGORIA_RULETA_ACTIVA === 'musica' && muss.length === 0) {
        CATEGORIA_RULETA_ACTIVA = 'comidas';
    }
    renderizarRuletaSemanal();

    animarGiroRuleta(itemsAnimar, function(ganadorDisco) {
        if (CATEGORIA_RULETA_ACTIVA === 'musica' && ganadorDisco) winMus = ganadorDisco;
        else if (CATEGORIA_RULETA_ACTIVA === 'vestimenta' && ganadorDisco) winVes = ganadorDisco;
        else if (CATEGORIA_RULETA_ACTIVA === 'comidas' && ganadorDisco) winCom = ganadorDisco;

        if (!APP_STATE.ruletaSemanal) APP_STATE.ruletaSemanal = JSON.parse(JSON.stringify(DEFAULT_STATE.ruletaSemanal));
        if (!APP_STATE.ruletaSemanal.seleccionActiva) APP_STATE.ruletaSemanal.seleccionActiva = {};
        APP_STATE.ruletaSemanal.seleccionActiva.comida = winCom.nombre;
        APP_STATE.ruletaSemanal.seleccionActiva.vestimenta = winVes.nombre;
        if (winMus) {
            APP_STATE.ruletaSemanal.seleccionActiva.musica = winMus.nombre;
            APP_STATE.ruletaSemanal.seleccionActiva.musicaPlaylistId = winMus.playlistId || winMus.id || null;
        }
        APP_STATE.ruletaSemanal.seleccionActiva.fechaGiro = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        if (!APP_STATE.ruletaSemanal.historialGiros) APP_STATE.ruletaSemanal.historialGiros = [];
        APP_STATE.ruletaSemanal.historialGiros.unshift({
            fecha: APP_STATE.ruletaSemanal.seleccionActiva.fechaGiro,
            comida: winCom.nombre,
            vestimenta: winVes.nombre,
            musica: winMus ? winMus.nombre : '',
            musicaPlaylistId: winMus ? (winMus.playlistId || winMus.id || null) : null
        });
        if (APP_STATE.ruletaSemanal.historialGiros.length > 10) APP_STATE.ruletaSemanal.historialGiros.pop();

        sumarExp(25);
        MonarcaDB.save(APP_STATE);
        renderizarRuletaSemanal();

        if (typeof mostrarToastMonarca === 'function') {
            var msgMus = winMus ? (' · 🎵 ' + winMus.nombre) : '';
            mostrarToastMonarca('Giro completo listo (+25 EXP)' + msgMus, '🎲');
        }
    });
}

function abrirModalNuevaOpcionRuleta() {
    if (CATEGORIA_RULETA_ACTIVA === 'musica') {
        irACrearPlaylistDesdeRuleta(true);
        return;
    }
    var m = document.getElementById('modal-nueva-opcion-ruleta');
    if (!m) return;
    var lbl = document.getElementById('label-opcion-ruleta-tipo');
    if (lbl) {
        var nomCat = CATEGORIA_RULETA_ACTIVA === 'comidas' ? 'Comida' : 'Outfit';
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
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Opción agregada a la ruleta', '🎲');
    }
}

function eliminarOpcionRuleta(categoria, id) {
    if (categoria === 'musica') {
        togglePlaylistEnRuleta(id);
        return;
    }
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
var TAB_BARBERIA_ACTIVA = 'clientes'; // 'clientes' | 'tipos-corte' | 'historial'
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
    <div class="subapp-cal-bridge-banner">
        <span>📅 Tus jornadas y citas de Barbería se muestran unificadas en <strong>Mi Calendario</strong>.</span>
        <button type="button" class="btn-sync-action btn-sync-light" style="font-size: 11.5px; padding: 6px 12px; flex-shrink: 0;" onclick="if(typeof irAFechaEnCalendario==='function') irAFechaEnCalendario('${MES_BARBERIA_ACTUAL}-01', 'mes', 'labores')">
            📅 Ver Jornadas en Calendario →
        </button>
    </div>

    <div style="display: flex; border-bottom: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 18px; gap: 4px; overflow-x: auto;">
        <button type="button" class="barber-subtab-btn ${(TAB_BARBERIA_ACTIVA !== 'tipos-corte' && TAB_BARBERIA_ACTIVA !== 'historial') ? 'active' : ''}" onclick="setTabBarberia('clientes')">
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
        TAB_BARBERIA_ACTIVA = 'clientes';
    }
    if (TAB_BARBERIA_ACTIVA === 'clientes') {
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

    // 4. Si el checkbox está activo, registrar ingreso en Finanzas (Entrada Aleatoria como solicitó el usuario)
    if (checkFinanzas && checkFinanzas.checked && cobro > 0) {
        if (!APP_STATE.finanzas) APP_STATE.finanzas = {};
        if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];
        APP_STATE.finanzas.ingresos.unshift({
            id: 'ING-BARBER-' + Date.now(),
            fecha: hoyFechaStr,
            fuente: 'Barbería: Corte a ' + clienteNom + ' (' + tipoCorte + ')',
            descripcion: 'Barbería: Corte a ' + clienteNom + ' (' + tipoCorte + ')',
            monto: cobro,
            tipo: 'aleatoria', // Entrada Aleatoria
            origen: 'labor',
            origenLabor: 'LAB-BARBER',
            categoria: '💼 Labores & Servicios',
            cobrado: true,
            montoCobrado: cobro,
            fechaCobro: new Date().toISOString()
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
    if (typeof renderizarCalendario === 'function') renderizarCalendario();

    alert("💈 ¡Corte registrado con éxito!\n- Duración: " + duracionMinutos + " min (" + horasCorte + " hrs sumadas a la labor)\n- Cobro: $" + cobro.toFixed(2) + "\n- Cliente: " + clienteNom);
}

function eliminarCorteBarberia(corteId) {
    if (!confirm("¿Deseas eliminar este registro de corte del historial?")) return;
    asegurarEstructuraBarberia();
    registrarTombstone('subappBarberia_cortes', corteId);
    APP_STATE.subappBarberia.cortes = APP_STATE.subappBarberia.cortes.filter(function(c) { return c.id !== corteId; });
    MonarcaDB.save(APP_STATE);
    renderizarSubAppBarberia();
    if (typeof renderizarCalendario === 'function') renderizarCalendario();
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

var TAB_TRAINER_ACTIVA = 'alumnos'; // 'alumnos' | 'enfoques' | 'aleatoria' | 'historial'
var SUBVISTA_TRAINER_ALEATORIA = 'generador'; // 'generador' | 'settings'
var ALUMNO_RUTINA_TRAINER_SELECCIONADO = '';
var PERFIL_TRAINER_ALEATORIA_ACTIVO = 'hombre'; // 'hombre' | 'mujer'
var RUTINA_TRAINER_GENERADA = null;
var RUTINA_TRAINER_META = null;
var DIA_TRAINER_ALEATORIA_SELECCIONADO = null; // null = hoy (0..6 = Lun..Dom)
var INTERVALO_TIMER_TRAINER = null;
var ENTRENAMIENTO_TEMPORAL_FINALIZANDO = null;
var BUSQUEDA_ALUMNO_TRAINER = '';
var BUSQUEDA_ENFOQUE_TRAINER = '';
var FILTRO_ENFOQUE_TRAINER = 'todas'; // 'todas' | 'asignadas' | 'activas' | 'plantillas'
var ENFOQUE_DETALLE_ABIERTO_ID = '';
var SESION_ACTIVA_DETALLE_ID = '';
var ENFOQUE_DETALLE_CERRADO_MANUAL = false;
var ENFOQUE_MODAL_INICIAR_ID = '';
var MOSTRAR_CATALOGO_COMPLETO_ENFOQUES = false;
var MOSTRAR_HECHOS_ENFOQUE = false;
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
        .replace(new RegExp("'", 'g'), '&#39;');
}

function obtenerFechaHoyISOTrainer() {
    var d = new Date();
    var m = d.getMonth() + 1;
    var dia = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (dia < 10 ? '0' + dia : dia);
}

function clonarEjerciciosConEstadoTrainer(lista, preservarChecks) {
    if (!Array.isArray(lista)) return [];
    return lista.map(function(ej) {
        if (!ej || !ej.nombre) return null;
        return {
            id: ej.id || null,
            nombre: String(ej.nombre),
            series: ej.series || 4,
            repeticiones: ej.repeticiones || '8-10 reps',
            compuesto: !!ej.compuesto,
            musculoPrincipal: ej.musculoPrincipal || (Array.isArray(ej.categorias) && ej.categorias[0]) || '',
            grupoAsignado: ej.grupoAsignado || '',
            categorias: Array.isArray(ej.categorias) ? ej.categorias.slice() : (ej.musculoPrincipal ? [ej.musculoPrincipal] : []),
            completado: preservarChecks ? !!ej.completado : false,
            completadoAt: (preservarChecks && ej.completado) ? (ej.completadoAt || Date.now()) : null
        };
    }).filter(Boolean);
}

function resolverEjerciciosDeEnfoqueTrainer(enfObj) {
    if (!enfObj) return [];
    if (Array.isArray(enfObj.ejercicios) && enfObj.ejercicios.length > 0) {
        return enfObj.ejercicios;
    }
    var desc = String(enfObj.descripcion || '');
    var match = desc.match(/ejercicios?\s*:\s*(.+)$/i);
    if (!match || !match[1]) return [];

    var catalogo = (typeof obtenerCatalogoEjerciciosParaAleatoria === 'function')
        ? (obtenerCatalogoEjerciciosParaAleatoria().ejercicios || [])
        : [];
    var partes = match[1].split(',').map(function(p) { return p.trim().replace(/\.+$/, ''); }).filter(Boolean);
    return partes.map(function(nom) {
        var norm = nom.toLowerCase();
        var encontrado = catalogo.find(function(c) {
            return c && c.nombre && c.nombre.trim().toLowerCase() === norm;
        }) || catalogo.find(function(c) {
            return c && c.nombre && (c.nombre.trim().toLowerCase().indexOf(norm) !== -1 || norm.indexOf(c.nombre.trim().toLowerCase()) !== -1);
        });
        if (encontrado) {
            return {
                nombre: encontrado.nombre,
                series: encontrado.series || 4,
                repeticiones: encontrado.repeticiones || '8-10 reps',
                compuesto: !!encontrado.compuesto,
                musculoPrincipal: encontrado.musculoPrincipal || '',
                categorias: Array.isArray(encontrado.categorias) ? encontrado.categorias.slice() : [],
                completado: false,
                completadoAt: null
            };
        }
        return {
            nombre: nom,
            series: 4,
            repeticiones: '10-12 reps',
            compuesto: false,
            musculoPrincipal: '',
            categorias: [],
            completado: false,
            completadoAt: null
        };
    });
}

function resolverGruposDeEjerciciosTrainer(ejercicios, textoFallback) {
    var vistos = {};
    var res = [];
    (ejercicios || []).forEach(function(ej) {
        if (!ej) return;
        var m = ej.musculoPrincipal;
        if (m && !vistos[m]) {
            vistos[m] = true;
            res.push(m);
        }
    });
    if (res.length === 0 && textoFallback) {
        var txt = String(textoFallback).toLowerCase();
        var mapa = [
            ['pecho', 'Pecho'], ['espalda', 'Espalda'], ['hombro', 'Hombros'],
            ['bíceps', 'Bíceps'], ['biceps', 'Bíceps'], ['tríceps', 'Tríceps'], ['triceps', 'Tríceps'],
            ['cuádriceps', 'Cuádriceps'], ['cuadriceps', 'Cuádriceps'], ['pierna', 'Cuádriceps'],
            ['isquio', 'Isquios'], ['glúteo', 'Glúteos'], ['gluteo', 'Glúteos'],
            ['pantorrilla', 'Pantorrillas'], ['core', 'Core'], ['abdomen', 'Core']
        ];
        mapa.forEach(function(par) {
            if (txt.indexOf(par[0]) !== -1 && !vistos[par[1]]) {
                vistos[par[1]] = true;
                res.push(par[1]);
            }
        });
    }
    return res;
}

function resolverGruposDeEnfoqueTrainer(enfObj) {
    if (!enfObj) return [];
    if (Array.isArray(enfObj.gruposUsados) && enfObj.gruposUsados.length > 0) {
        return enfObj.gruposUsados.slice();
    }
    var ejs = resolverEjerciciosDeEnfoqueTrainer(enfObj);
    return resolverGruposDeEjerciciosTrainer(ejs, (enfObj.nombre || '') + ' ' + (enfObj.descripcion || ''));
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
    if (!Array.isArray(APP_STATE.subappTrainer.sesionesActivas)) {
        APP_STATE.subappTrainer.sesionesActivas = [];
    }
    if (typeof APP_STATE.subappTrainer.tiempoPromedioMetaMin !== 'number') {
        APP_STATE.subappTrainer.tiempoPromedioMetaMin = 60;
    }
    if (APP_STATE.subappTrainer.timerActivo === undefined) {
        APP_STATE.subappTrainer.timerActivo = null;
    }
    if (!Array.isArray(APP_STATE.subappTrainer.rutinasEnfoques)) {
        APP_STATE.subappTrainer.rutinasEnfoques = [];
    }
    (APP_STATE.subappTrainer.alumnos || []).forEach(function(al) {
        if (!Array.isArray(al.rutinasAsignadas)) al.rutinasAsignadas = [];
    });

    // Migrar timerActivo legado (v10.99 o anterior) hacia sesionesActivas sin perder la sesión en curso
    if (APP_STATE.subappTrainer.sesionesActivas.length === 0 && APP_STATE.subappTrainer.timerActivo && APP_STATE.subappTrainer.timerActivo.inicioTimestamp) {
        var leg = APP_STATE.subappTrainer.timerActivo;
        var legId = leg.id || ('ACT-LEGACY-' + leg.inicioTimestamp);
        var tombs = (APP_STATE._eliminados && Array.isArray(APP_STATE._eliminados.subappTrainer_sesionesActivas))
            ? APP_STATE._eliminados.subappTrainer_sesionesActivas.map(String)
            : [];
        if (tombs.indexOf(String(legId)) === -1) {
            var enfMatch = null;
            if (leg.enfoqueId) {
                enfMatch = APP_STATE.subappTrainer.rutinasEnfoques.find(function(e) { return e.id === leg.enfoqueId; });
            }
            if (!enfMatch && leg.enfoque) {
                var eLow = leg.enfoque.toLowerCase().trim();
                enfMatch = APP_STATE.subappTrainer.rutinasEnfoques.find(function(e) { return (e.nombre || '').toLowerCase().trim() === eLow; });
            }
            var legEjs = Array.isArray(leg.ejercicios) && leg.ejercicios.length > 0
                ? clonarEjerciciosConEstadoTrainer(leg.ejercicios, true)
                : clonarEjerciciosConEstadoTrainer(resolverEjerciciosDeEnfoqueTrainer(enfMatch), true);
            var legGrupos = (Array.isArray(leg.gruposUsados) && leg.gruposUsados.length > 0)
                ? leg.gruposUsados.slice()
                : resolverGruposDeEnfoqueTrainer(enfMatch || { nombre: leg.enfoque, ejercicios: legEjs });
            APP_STATE.subappTrainer.sesionesActivas.push({
                id: legId,
                inicioTimestamp: leg.inicioTimestamp,
                updatedAt: leg.updatedAt || leg.inicioTimestamp,
                alumnoId: leg.alumnoId || null,
                alumnoNombre: leg.alumnoNombre || 'Alumno General',
                enfoqueId: enfMatch ? enfMatch.id : (leg.enfoqueId || null),
                enfoque: leg.enfoque || 'Entrenamiento Personalizado',
                rutinaAsignadaId: leg.rutinaAsignadaId || (enfMatch ? enfMatch.rutinaAsignadaId : null) || null,
                gruposUsados: legGrupos,
                ejercicios: legEjs
            });
        }
    }

    APP_STATE.subappTrainer.timerActivo = APP_STATE.subappTrainer.sesionesActivas[0] || null;
}

function crearSesionActivaTrainer(opts) {
    asegurarEstructuraTrainer();
    var lista = APP_STATE.subappTrainer.sesionesActivas;
    var alumnoId = opts.alumnoId || null;
    var alumnoNombre = opts.alumnoNombre || 'Atleta';
    var enfoqueId = opts.enfoqueId || null;
    var enfoqueNombre = opts.enfoqueNombre || 'Entrenamiento Personalizado';

    // Si el mismo atleta ya está rodando exactamente esta misma rutina, enfocamos esa sesión sin duplicar timer
    var alKey = String(alumnoId || alumnoNombre).toLowerCase().trim();
    var enfKey = String(enfoqueId || enfoqueNombre).toLowerCase().trim();
    var existente = lista.find(function(s) {
        var sAl = String(s.alumnoId || s.alumnoNombre || '').toLowerCase().trim();
        var sEnf = String(s.enfoqueId || s.enfoque || '').toLowerCase().trim();
        return sAl === alKey && sEnf === enfKey;
    });
    if (existente) {
        SESION_ACTIVA_DETALLE_ID = existente.id;
        ENFOQUE_DETALLE_ABIERTO_ID = existente.enfoqueId || '';
        ENFOQUE_DETALLE_CERRADO_MANUAL = false;
        return existente;
    }

    var baseEnf = enfoqueId ? APP_STATE.subappTrainer.rutinasEnfoques.find(function(r) { return r.id === enfoqueId; }) : null;
    var rawEjs = (Array.isArray(opts.ejercicios) && opts.ejercicios.length > 0)
        ? opts.ejercicios
        : resolverEjerciciosDeEnfoqueTrainer(baseEnf);
    var grupos = (Array.isArray(opts.gruposUsados) && opts.gruposUsados.length > 0)
        ? opts.gruposUsados.slice()
        : (baseEnf ? resolverGruposDeEnfoqueTrainer(baseEnf) : resolverGruposDeEjerciciosTrainer(rawEjs, enfoqueNombre));

    var nueva = {
        id: 'ACT-' + Date.now() + '-' + Math.floor(Math.random() * 900 + 100),
        inicioTimestamp: Date.now(),
        updatedAt: Date.now(),
        alumnoId: alumnoId,
        alumnoNombre: alumnoNombre,
        enfoqueId: enfoqueId,
        enfoque: enfoqueNombre,
        rutinaAsignadaId: opts.rutinaAsignadaId || (baseEnf ? baseEnf.rutinaAsignadaId : null) || null,
        gruposUsados: grupos,
        ejercicios: clonarEjerciciosConEstadoTrainer(rawEjs, false)
    };

    lista.unshift(nueva);
    APP_STATE.subappTrainer.timerActivo = lista[0] || null;
    SESION_ACTIVA_DETALLE_ID = nueva.id;
    ENFOQUE_DETALLE_ABIERTO_ID = nueva.enfoqueId || '';
    ENFOQUE_DETALLE_CERRADO_MANUAL = false;
    return nueva;
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
    asegurarEstructuraTrainer();
    if (APP_STATE.subappTrainer && Array.isArray(APP_STATE.subappTrainer.sesionesActivas) && APP_STATE.subappTrainer.sesionesActivas.length > 0) {
        INTERVALO_TIMER_TRAINER = setInterval(function() {
            actualizarDisplayTimerTrainerVivo();
        }, 1000);
    }
}

function actualizarDisplayTimerTrainerVivo() {
    var trainer = APP_STATE.subappTrainer;
    var activas = (trainer && Array.isArray(trainer.sesionesActivas)) ? trainer.sesionesActivas : [];
    if (activas.length === 0) return;

    var ahora = Date.now();
    var metaMin = (trainer && trainer.tiempoPromedioMetaMin) ? trainer.tiempoPromedioMetaMin : 60;
    var metaSegs = metaMin * 60;

    activas.forEach(function(s) {
        if (!s || !s.id) return;
        var segs = Math.max(0, Math.floor((ahora - s.inicioTimestamp) / 1000));
        var reloj = formatearSegundosTrainer(segs);
        var porc = Math.min(100, Math.round((segs / metaSegs) * 100));
        var pctTxt = Math.round(segs / 60) + ' / ' + metaMin + ' min (' + porc + '%)';

        document.querySelectorAll('[data-trainer-clock-id="' + s.id + '"]').forEach(function(el) {
            el.textContent = reloj;
        });
        document.querySelectorAll('[data-trainer-pct-id="' + s.id + '"]').forEach(function(el) {
            el.textContent = pctTxt;
        });
        document.querySelectorAll('[data-trainer-bar-id="' + s.id + '"]').forEach(function(el) {
            el.style.width = porc + '%';
            if (porc >= 100) {
                el.style.background = 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)';
            }
        });
    });
}

function renderizarSubAppTrainer() {
    asegurarEstructuraTrainer();
    var cont = document.getElementById('subapp-trainer-content');
    if (!cont) return;

    var alumnos = APP_STATE.subappTrainer.alumnos || [];
    var sesiones = APP_STATE.subappTrainer.sesiones || [];
    var rutinas = APP_STATE.subappTrainer.rutinasEnfoques || [];
    var activas = APP_STATE.subappTrainer.sesionesActivas || [];
    var metaMin = APP_STATE.subappTrainer.tiempoPromedioMetaMin || 60;
    var metaSegs = metaMin * 60;

    // Botón superior siempre disponible para abrir una nueva sesión (soporte multi-atleta)
    var btnTop = document.getElementById('btn-iniciar-entrenamiento-top');
    if (btnTop) {
        if (activas.length > 0) {
            btnTop.innerHTML = '<span>➕</span> + Sesión (' + activas.length + ')';
            btnTop.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            btnTop.onclick = function() { abrirModalIniciarEntrenamiento(); };
        } else {
            btnTop.innerHTML = '<span>🏋️‍♂️</span> Iniciar Sesión';
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

    // 1. BANNER DE RUTINAS RODANDO EN VIVO (solo fuera de Enfoques, pues Enfoques tiene su panel completo)
    if (TAB_TRAINER_ACTIVA !== 'enfoques' && activas.length === 1) {
        var s0 = activas[0];
        var segsAhora = Math.max(0, Math.floor((Date.now() - s0.inicioTimestamp) / 1000));
        var relojInit = formatearSegundosTrainer(segsAhora);
        var porcInit = Math.min(100, Math.round((segsAhora / metaSegs) * 100));
        var ejs0 = Array.isArray(s0.ejercicios) ? s0.ejercicios : [];
        var hechos0 = ejs0.filter(function(e) { return !!e.completado; }).length;

        html += `
        <div class="trainer-timer-banner-active">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(16, 185, 129, 0.2); border: 1px solid #34d399; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                        🏋️‍♂️
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <span style="font-size: 13px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.4px;">Entrenamiento en Curso</span>
                            <span class="subapp-badge" style="color: #34d399; border-color: rgba(52, 211, 153, 0.45); background: rgba(16, 185, 129, 0.14);">EN VIVO</span>
                            ${ejs0.length > 0 ? `<span class="subapp-badge" style="color: #7dd3fc; border-color: rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.12);">✅ ${hechos0}/${ejs0.length} ej.</span>` : ''}
                        </div>
                        <div style="font-size: 13px; color: #f8fafc; font-weight: 700; margin-top: 2px;">
                            👤 <strong>${escapeHtmlTrainer(s0.alumnoNombre || 'Atleta')}</strong> · <em>${escapeHtmlTrainer(s0.enfoque || 'Rutina Personalizada')}</em>
                        </div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <button type="button" class="trainer-btn-secondary" onclick="seleccionarSesionActivaEnfoqueTrainer('${s0.id}')" style="padding: 8px 12px; font-size: 11.5px; color: #7dd3fc; border-color: rgba(56, 189, 248, 0.4);">
                        👁️ Ver Rutina
                    </button>
                    <button type="button" class="btn-back-system" onclick="descartarTimerEntrenamiento('${s0.id}')" style="margin-bottom: 0; padding: 8px 12px; font-size: 11.5px; border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;" title="Descartar este timer">
                        ✕ Descartar
                    </button>
                    <button type="button" class="btn-system" onclick="pararTimerEntrenamiento('${s0.id}')" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; font-size: 12px; font-weight: 800; padding: 9px 14px; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                        🛑 FINALIZAR
                    </button>
                </div>
            </div>

            <div style="background: #0d1322; border: 1px solid rgba(52, 211, 153, 0.25); border-radius: 12px; padding: 10px 14px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                        <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8;">Cronómetro:</span>
                        <span id="trainer-timer-clock-display" data-trainer-clock-id="${s0.id}" style="font-size: 24px; font-weight: 800; color: #34d399; font-family: monospace; letter-spacing: 1px;">${relojInit}</span>
                    </div>
                    <span id="trainer-timer-percent-text" data-trainer-pct-id="${s0.id}" style="font-size: 12px; font-weight: 700; color: #cbd5e1;">${Math.round(segsAhora / 60)} / ${metaMin} min (${porcInit}%)</span>
                </div>
                <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.08); border-radius: 999px; overflow: hidden;">
                    <div id="trainer-timer-progress-fill" data-trainer-bar-id="${s0.id}" style="width: ${porcInit}%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); transition: width 0.5s ease;"></div>
                </div>
            </div>
        </div>
        `;
    } else if (TAB_TRAINER_ACTIVA !== 'enfoques' && activas.length > 1) {
        html += `
        <div class="trainer-timer-banner-active">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">🏋️‍♂️</span>
                    <span style="font-size: 13px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.4px;">
                        ${activas.length} Rutinas Rodando Simultáneamente
                    </span>
                </div>
                <button type="button" class="trainer-btn-secondary" onclick="setTabTrainer('enfoques')" style="padding: 6px 12px; font-size: 11.5px; color: #7dd3fc; border-color: rgba(56, 189, 248, 0.4);">
                    🎯 Gestionar en Enfoques →
                </button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${activas.map(function(s) {
                    var segs = Math.max(0, Math.floor((Date.now() - s.inicioTimestamp) / 1000));
                    var reloj = formatearSegundosTrainer(segs);
                    var ejsS = Array.isArray(s.ejercicios) ? s.ejercicios : [];
                    var hechosS = ejsS.filter(function(e) { return !!e.completado; }).length;
                    return `
                    <div style="background: #0d1322; border: 1px solid rgba(52, 211, 153, 0.28); border-radius: 11px; padding: 9px 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <div style="min-width: 0; flex: 1;">
                            <div style="font-size: 12.5px; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                <span>👤 ${escapeHtmlTrainer(s.alumnoNombre || 'Atleta')}</span>
                                <span style="font-size: 11.5px; font-family: monospace; color: #34d399; background: rgba(16, 185, 129, 0.14); padding: 2px 7px; border-radius: 6px;" data-trainer-clock-id="${s.id}">${reloj}</span>
                                ${ejsS.length > 0 ? `<span style="font-size: 11px; color: #7dd3fc;">✅ ${hechosS}/${ejsS.length}</span>` : ''}
                            </div>
                            <div style="font-size: 11.5px; color: #cbd5e1; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                🎯 ${escapeHtmlTrainer(s.enfoque || 'Rutina')}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                            <button type="button" class="trainer-btn-secondary" onclick="seleccionarSesionActivaEnfoqueTrainer('${s.id}')" style="padding: 6px 10px; font-size: 11px; color: #7dd3fc; border-color: rgba(56, 189, 248, 0.35);">
                                👁️ Ver
                            </button>
                            <button type="button" class="trainer-btn-secondary" onclick="descartarTimerEntrenamiento('${s.id}')" style="padding: 6px 8px; font-size: 11px; color: #fca5a5; border-color: rgba(239, 68, 68, 0.35);" title="Descartar">
                                ✕
                            </button>
                            <button type="button" class="trainer-btn-primary" onclick="pararTimerEntrenamiento('${s.id}')" style="padding: 6px 10px; font-size: 11px;">
                                🛑 Fin
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
        `;
    }

    // 2. SELECTOR DE MES + ACCESO CALENDARIO UNIFICADO + MÉTRICAS CLAVE
    html += `
    <div class="trainer-toolbar-strip">
        <div style="display: flex; align-items: center; gap: 4px; min-width: 0;">
            <button type="button" class="btn-subapp-mes-nav" onclick="cambiarMesTrainer(-1)" title="Mes Anterior">◀</button>
            <span style="font-size: 12px; font-weight: 800; color: #f8fafc; min-width: 108px; text-align: center; text-transform: uppercase; letter-spacing: 0.3px;">${nombreMesStr}</span>
            <button type="button" class="btn-subapp-mes-nav" onclick="cambiarMesTrainer(1)" title="Mes Siguiente">▶</button>
        </div>
        <button type="button" class="trainer-btn-secondary" style="font-size: 11px; padding: 6px 10px; white-space: nowrap; flex-shrink: 0;" onclick="if(typeof irAFechaEnCalendario==='function') irAFechaEnCalendario('${MES_TRAINER_ACTUAL}-01', 'mes', 'labores')" title="Las sesiones se muestran en Mi Calendario">
            📅 Cal (${sesiones.length}) →
        </button>
    </div>

    <!-- TARJETAS DE MÉTRICAS DEL MES -->
    <div class="trainer-kpi-grid">
        <div class="trainer-kpi-card" style="border-top: 2px solid #10b981;">
            <div class="trainer-kpi-label" style="color: #34d399;">💵 Recaudado</div>
            <div class="trainer-kpi-val" style="color: #34d399;">$${totalGananciasMes.toFixed(2)}</div>
            <div class="trainer-kpi-sub">este mes</div>
        </div>

        <div class="trainer-kpi-card" style="border-top: 2px solid #38bdf8;">
            <div class="trainer-kpi-label" style="color: #38bdf8;">🏋️‍♂️ Sesiones</div>
            <div class="trainer-kpi-val" style="color: #7dd3fc;">${sesionesMes.length}</div>
            <div class="trainer-kpi-sub">guiadas</div>
        </div>

        <div class="trainer-kpi-card" style="border-top: 2px solid #f59e0b;">
            <div class="trainer-kpi-label" style="color: #fbbf24;">⏱️ Tiempo</div>
            <div class="trainer-kpi-val" style="color: #fcd34d;">${totalHorasMes}h</div>
            <div class="trainer-kpi-sub">${totalMinutosMes} min</div>
        </div>

        <div class="trainer-kpi-card" style="border-top: 2px solid #c084fc;">
            <div class="trainer-kpi-label" style="color: #c084fc;">👥 Alumnos</div>
            <div class="trainer-kpi-val" style="color: #e9d5ff;">${alumnosUnicosCount}</div>
            <div class="trainer-kpi-sub">activos</div>
        </div>
    </div>
    `;

    // 3. BARRA DE SUB-TABS SEGMENTADA EN UNA SOLA LÍNEA
    html += `
    <div class="trainer-segmented-tabs">
        <button type="button" class="trainer-subtab-btn ${(TAB_TRAINER_ACTIVA !== 'enfoques' && TAB_TRAINER_ACTIVA !== 'aleatoria' && TAB_TRAINER_ACTIVA !== 'historial') ? 'active' : ''}" onclick="setTabTrainer('alumnos')">
            <span>👥</span> Alumnos (${alumnos.length})
        </button>
        <button type="button" class="trainer-subtab-btn ${TAB_TRAINER_ACTIVA === 'enfoques' ? 'active' : ''}" onclick="setTabTrainer('enfoques')">
            <span>🎯</span> Enfoques (${rutinas.length})
        </button>
        <button type="button" class="trainer-subtab-btn ${TAB_TRAINER_ACTIVA === 'aleatoria' ? 'active' : ''}" onclick="setTabTrainer('aleatoria')">
            <span>🎲</span> Rutina Aleatoria
        </button>
        <button type="button" class="trainer-subtab-btn ${TAB_TRAINER_ACTIVA === 'historial' ? 'active' : ''}" onclick="setTabTrainer('historial')">
            <span>📋</span> Historial (${sesiones.length})
        </button>
    </div>
    `;

    // 4. CONTENIDO DEL TAB SELECCIONADO
    if (TAB_TRAINER_ACTIVA === 'calendario') {
        TAB_TRAINER_ACTIVA = 'alumnos';
    }
    if (TAB_TRAINER_ACTIVA === 'alumnos') {
        html += renderizarHtmlCatalogoAlumnosTrainer(alumnos, sesiones);
    } else if (TAB_TRAINER_ACTIVA === 'enfoques') {
        html += renderizarHtmlCatalogoEnfoquesTrainer(rutinas);
    } else if (TAB_TRAINER_ACTIVA === 'aleatoria') {
        html += renderizarHtmlRutinaAleatoriaTrainer();
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
    <div style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="flex: 1; min-width: 210px;">
            <input type="text" value="${escapeHtmlTrainer(BUSQUEDA_ALUMNO_TRAINER)}" placeholder="🔍 Buscar alumno..." oninput="filtrarAlumnosTrainer(this.value)" class="finanzas-input-clean" style="background: #151e34; border: 1px solid rgba(148, 163, 184, 0.24); color: #f8fafc; border-radius: 10px; padding: 10px 13px; width: 100%; box-sizing: border-box; font-size: 13px;">
        </div>
        <button type="button" class="trainer-btn-primary" onclick="abrirModalAlumnoTrainer()">
            <span>➕</span> Registrar Alumno
        </button>
    </div>
    `;

    if (filtrados.length === 0) {
        html += `
        <div class="trainer-panel-clean" style="border-style: dashed; padding: 34px 18px; text-align: center; color: #cbd5e1;">
            <div style="font-size: 34px; margin-bottom: 8px;">🏋️‍♂️</div>
            <div style="font-size: 15px; font-weight: 800; color: #f8fafc; margin-bottom: 4px;">Aún no hay alumnos registrados</div>
            <div style="font-size: 12.5px; color: #cbd5e1; max-width: 380px; margin: 0 auto 14px auto;">Registra tus alumnos para llevar su ficha biométrica, rutinas asignadas y cobros por sesión.</div>
            <button type="button" class="trainer-btn-primary" onclick="abrirModalAlumnoTrainer()" style="margin: 0 auto;">
                + Agregar Primer Alumno
            </button>
        </div>
        `;
        return html;
    }

    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(275px, 1fr)); gap: 12px;">';

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
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <div style="font-size: 14.5px; font-weight: 800; color: #ffffff;">${escapeHtmlTrainer(al.nombre)}</div>
                            <span style="font-size: 10px; font-weight: 700; background: rgba(148, 163, 184, 0.16); color: #e2e8f0; padding: 2px 6px; border-radius: 5px;">${badgeGenero}</span>
                        </div>
                        <div style="font-size: 11.5px; color: #cbd5e1;">${al.telefono ? '📞 ' + escapeHtmlTrainer(al.telefono) : 'Sin teléfono'}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 14.5px; font-weight: 800; color: #34d399;">$${(parseFloat(al.tarifaHabitual) || 0).toFixed(2)}</div>
                    <div style="font-size: 10px; color: #94a3b8;">por sesión</div>
                </div>
            </div>

            <!-- FICHA BIOMÉTRICA RESUMIDA -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; background: #101728; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 10px; padding: 8px; margin-bottom: 10px; text-align: center;">
                <div>
                    <div style="font-size: 9.5px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Edad</div>
                    <div style="font-size: 12.5px; font-weight: 800; color: #f8fafc;">${al.edad ? al.edad + ' años' : '—'}</div>
                </div>
                <div>
                    <div style="font-size: 9.5px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Altura</div>
                    <div style="font-size: 12.5px; font-weight: 800; color: #f8fafc;">${al.altura ? al.altura + ' cm' : '—'}</div>
                </div>
                <div>
                    <div style="font-size: 9.5px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Peso</div>
                    <div style="font-size: 12.5px; font-weight: 800; color: #34d399;">${al.peso ? al.peso + ' kg' : '—'}</div>
                </div>
            </div>

            <div style="font-size: 12px; color: #e2e8f0; margin-bottom: 12px; line-height: 1.45;">
                <div>🎯 <strong>Objetivo:</strong> <span style="color: #7dd3fc; font-weight: 700;">${escapeHtmlTrainer(al.objetivo || 'Salud & Acondicionamiento')}</span></div>
                <div style="margin-top: 2px;">📅 <strong>Antigüedad:</strong> <span style="color: #fcd34d; font-weight: 700;">${escapeHtmlTrainer(antiguedadTexto)}</span></div>
                <div style="margin-top: 2px; color: #cbd5e1; font-size: 11.5px;">🏋️‍♂️ <strong>Sesiones:</strong> ${sesAlumno.length} · Total: <strong style="color:#34d399;">$${totalRecaudado.toFixed(0)}</strong></div>
            </div>

            <div style="display: flex; gap: 6px; border-top: 1px solid rgba(148, 163, 184, 0.14); padding-top: 10px;">
                <button type="button" class="trainer-btn-primary" onclick="abrirModalIniciarEntrenamiento('${al.id}')" style="flex: 2; justify-content: center; font-size: 11.5px; padding: 7px 10px;">
                    🏋️‍♂️ Iniciar Sesión
                </button>
                <button type="button" class="trainer-btn-secondary" onclick="verFichaAlumnoTrainer('${al.id}')" style="flex: 1; justify-content: center; font-size: 11.5px; padding: 7px 9px;" title="Ver ficha biométrica e historial">
                    📋 Ficha
                </button>
                <button type="button" class="trainer-btn-secondary" onclick="abrirModalAlumnoTrainer('${al.id}')" style="font-size: 11.5px; padding: 7px 9px;" title="Editar alumno">
                    ✏️
                </button>
                <button type="button" class="trainer-btn-secondary" onclick="eliminarAlumnoTrainer('${al.id}')" style="font-size: 11.5px; padding: 7px 9px; color: #fca5a5; border-color: rgba(239, 68, 68, 0.35);" title="Eliminar alumno">
                    🗑️
                </button>
            </div>
        </div>
        `;
    });

    html += '</div>';
    return html;
}

function cambiarFiltroEnfoqueTrainer(filtro) {
    FILTRO_ENFOQUE_TRAINER = filtro || 'todas';
    renderizarSubAppTrainer();
}

function seleccionarSesionActivaEnfoqueTrainer(sesionId) {
    asegurarEstructuraTrainer();
    var ses = (APP_STATE.subappTrainer.sesionesActivas || []).find(function(s) { return s.id === sesionId; });
    SESION_ACTIVA_DETALLE_ID = ses ? ses.id : '';
    ENFOQUE_DETALLE_ABIERTO_ID = (ses && ses.enfoqueId) ? ses.enfoqueId : '';
    ENFOQUE_DETALLE_CERRADO_MANUAL = false;
    TAB_TRAINER_ACTIVA = 'enfoques';
    renderizarSubAppTrainer();
}

function seleccionarEnfoqueDetalleTrainer(enfoqueId) {
    asegurarEstructuraTrainer();
    var yaActivo = (ENFOQUE_DETALLE_ABIERTO_ID === enfoqueId && !ENFOQUE_DETALLE_CERRADO_MANUAL);
    if (yaActivo) {
        cerrarDetalleEnfoqueTrainer();
        return;
    }
    ENFOQUE_DETALLE_ABIERTO_ID = enfoqueId || '';
    ENFOQUE_DETALLE_CERRADO_MANUAL = false;
    // Si este enfoque tiene una sesión rodando para su alumno asignado, enfocar también esa sesión
    var activas = APP_STATE.subappTrainer.sesionesActivas || [];
    var sesMatch = activas.find(function(s) { return s.enfoqueId && s.enfoqueId === enfoqueId; });
    SESION_ACTIVA_DETALLE_ID = sesMatch ? sesMatch.id : '';
    TAB_TRAINER_ACTIVA = 'enfoques';
    renderizarSubAppTrainer();
}

function cerrarDetalleEnfoqueTrainer() {
    SESION_ACTIVA_DETALLE_ID = '';
    ENFOQUE_DETALLE_ABIERTO_ID = '';
    ENFOQUE_DETALLE_CERRADO_MANUAL = true;
    renderizarSubAppTrainer();
}

function iniciarRutinaEnfoqueTrainer(enfoqueId) {
    asegurarEstructuraTrainer();
    var enf = (APP_STATE.subappTrainer.rutinasEnfoques || []).find(function(r) { return r.id === enfoqueId; });
    if (!enf) return;

    var nomAlumno = (enf.alumnoNombre || '').trim();
    var tienePersonaEspecifica = !!(enf.alumnoId || (nomAlumno && nomAlumno !== 'Atleta' && nomAlumno !== 'Plantilla General' && nomAlumno !== 'Alumno General'));

    if (!tienePersonaEspecifica) {
        abrirModalIniciarEntrenamiento(null, enf.nombre, enf.id);
        return;
    }

    var ejs = resolverEjerciciosDeEnfoqueTrainer(enf);
    var grupos = resolverGruposDeEnfoqueTrainer(enf);
    crearSesionActivaTrainer({
        alumnoId: enf.alumnoId || null,
        alumnoNombre: nomAlumno || 'Atleta',
        enfoqueId: enf.id,
        enfoqueNombre: enf.nombre,
        rutinaAsignadaId: enf.rutinaAsignadaId || null,
        gruposUsados: grupos,
        ejercicios: ejs
    });

    MonarcaDB.save(APP_STATE);
    iniciarIntervaloTimerTrainer();
    TAB_TRAINER_ACTIVA = 'enfoques';
    renderizarSubAppTrainer();
}

function iniciarTodasRutinasAsignadasTrainer() {
    asegurarEstructuraTrainer();
    var rutinas = APP_STATE.subappTrainer.rutinasEnfoques || [];
    var iniciadas = 0;
    rutinas.forEach(function(enf) {
        var nomAlumno = (enf.alumnoNombre || '').trim();
        var tienePersona = !!(enf.alumnoId || (nomAlumno && nomAlumno !== 'Atleta' && nomAlumno !== 'Plantilla General' && nomAlumno !== 'Alumno General'));
        var esAsignada = (enf.origen === 'aleatoria' || tienePersona || (Array.isArray(enf.ejercicios) && enf.ejercicios.length > 0));
        if (!esAsignada) return;
        var ejs = resolverEjerciciosDeEnfoqueTrainer(enf);
        var yaRodando = (APP_STATE.subappTrainer.sesionesActivas || []).some(function(s) {
            return s.enfoqueId === enf.id;
        });
        if (!yaRodando) {
            crearSesionActivaTrainer({
                alumnoId: enf.alumnoId || null,
                alumnoNombre: nomAlumno || 'Atleta',
                enfoqueId: enf.id,
                enfoqueNombre: enf.nombre,
                rutinaAsignadaId: enf.rutinaAsignadaId || null,
                gruposUsados: resolverGruposDeEnfoqueTrainer(enf),
                ejercicios: ejs
            });
            iniciadas++;
        }
    });
    if (iniciadas > 0) {
        MonarcaDB.save(APP_STATE);
        iniciarIntervaloTimerTrainer();
    }
    TAB_TRAINER_ACTIVA = 'enfoques';
    renderizarSubAppTrainer();
}

function sincronizarProgresoRutinaEnfoqueYAlumno(enfoqueId, rutinaAsignadaId, alumnoId, ejerciciosActualizados) {
    var ahora = Date.now();
    if (enfoqueId) {
        var enf = (APP_STATE.subappTrainer.rutinasEnfoques || []).find(function(r) { return r.id === enfoqueId; });
        if (enf) {
            enf.ejercicios = clonarEjerciciosConEstadoTrainer(ejerciciosActualizados, true);
            enf.updatedAt = ahora;
        }
    }
    if (alumnoId && rutinaAsignadaId) {
        var al = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === alumnoId; });
        if (al && Array.isArray(al.rutinasAsignadas)) {
            var rAsig = al.rutinasAsignadas.find(function(x) { return x.id === rutinaAsignadaId; });
            if (rAsig) {
                rAsig.ejercicios = clonarEjerciciosConEstadoTrainer(ejerciciosActualizados, true);
                rAsig.updatedAt = ahora;
            }
        }
    }
}

function toggleEjercicioEnRutinaEnfoqueTrainer(targetType, targetId, ejIdx) {
    asegurarEstructuraTrainer();
    var ahora = Date.now();
    if (targetType === 'sesion') {
        var ses = (APP_STATE.subappTrainer.sesionesActivas || []).find(function(s) { return s.id === targetId; });
        if (!ses) return;
        if (!Array.isArray(ses.ejercicios) || ses.ejercicios.length === 0) {
            var enfBase = ses.enfoqueId ? APP_STATE.subappTrainer.rutinasEnfoques.find(function(r) { return r.id === ses.enfoqueId; }) : null;
            ses.ejercicios = clonarEjerciciosConEstadoTrainer(resolverEjerciciosDeEnfoqueTrainer(enfBase), false);
        }
        if (!ses.ejercicios[ejIdx]) return;
        ses.ejercicios[ejIdx].completado = !ses.ejercicios[ejIdx].completado;
        ses.ejercicios[ejIdx].completadoAt = ses.ejercicios[ejIdx].completado ? ahora : null;
        ses.updatedAt = ahora;
        APP_STATE.subappTrainer.timerActivo = APP_STATE.subappTrainer.sesionesActivas[0] || null;
        // Sincronizar con el enfoque si comparte atleta o si solo hay una sesión activa sobre este enfoque
        if (ses.enfoqueId) {
            var enfMatch = APP_STATE.subappTrainer.rutinasEnfoques.find(function(r) { return r.id === ses.enfoqueId; });
            var mismasSesSobreEnf = (APP_STATE.subappTrainer.sesionesActivas || []).filter(function(x) { return x.enfoqueId === ses.enfoqueId; });
            if (enfMatch && (mismasSesSobreEnf.length <= 1 || enfMatch.alumnoId === ses.alumnoId)) {
                sincronizarProgresoRutinaEnfoqueYAlumno(ses.enfoqueId, ses.rutinaAsignadaId, ses.alumnoId, ses.ejercicios);
            }
        }
    } else if (targetType === 'enfoque') {
        var enf = (APP_STATE.subappTrainer.rutinasEnfoques || []).find(function(r) { return r.id === targetId; });
        if (!enf) return;
        if (!Array.isArray(enf.ejercicios) || enf.ejercicios.length === 0) {
            enf.ejercicios = clonarEjerciciosConEstadoTrainer(resolverEjerciciosDeEnfoqueTrainer(enf), false);
        }
        if (!enf.ejercicios[ejIdx]) return;
        enf.ejercicios[ejIdx].completado = !enf.ejercicios[ejIdx].completado;
        enf.ejercicios[ejIdx].completadoAt = enf.ejercicios[ejIdx].completado ? ahora : null;
        enf.updatedAt = ahora;
        sincronizarProgresoRutinaEnfoqueYAlumno(null, enf.rutinaAsignadaId, enf.alumnoId, enf.ejercicios);
        // Si hay sesión activa del mismo atleta sobre este enfoque, mantenerla alineada
        (APP_STATE.subappTrainer.sesionesActivas || []).forEach(function(s) {
            if (s.enfoqueId === enf.id && (!enf.alumnoId || s.alumnoId === enf.alumnoId)) {
                s.ejercicios = clonarEjerciciosConEstadoTrainer(enf.ejercicios, true);
                s.updatedAt = ahora;
            }
        });
    }
    MonarcaDB.save(APP_STATE);
    renderizarSubAppTrainer();
}

function reiniciarEjerciciosEnRutinaEnfoqueTrainer(targetType, targetId) {
    asegurarEstructuraTrainer();
    var ahora = Date.now();
    if (targetType === 'sesion') {
        var ses = (APP_STATE.subappTrainer.sesionesActivas || []).find(function(s) { return s.id === targetId; });
        if (!ses || !Array.isArray(ses.ejercicios)) return;
        ses.ejercicios.forEach(function(ej) { ej.completado = false; ej.completadoAt = null; });
        ses.updatedAt = ahora;
        sincronizarProgresoRutinaEnfoqueYAlumno(ses.enfoqueId, ses.rutinaAsignadaId, ses.alumnoId, ses.ejercicios);
    } else if (targetType === 'enfoque') {
        var enf = (APP_STATE.subappTrainer.rutinasEnfoques || []).find(function(r) { return r.id === targetId; });
        if (!enf) return;
        if (!Array.isArray(enf.ejercicios) || enf.ejercicios.length === 0) {
            enf.ejercicios = clonarEjerciciosConEstadoTrainer(resolverEjerciciosDeEnfoqueTrainer(enf), false);
        } else {
            enf.ejercicios.forEach(function(ej) { ej.completado = false; ej.completadoAt = null; });
        }
        enf.updatedAt = ahora;
        sincronizarProgresoRutinaEnfoqueYAlumno(null, enf.rutinaAsignadaId, enf.alumnoId, enf.ejercicios);
    }
    MonarcaDB.save(APP_STATE);
    renderizarSubAppTrainer();
}

function toggleCatalogoCompletoEnfoquesTrainer() {
    MOSTRAR_CATALOGO_COMPLETO_ENFOQUES = !MOSTRAR_CATALOGO_COMPLETO_ENFOQUES;
    renderizarSubAppTrainer();
}

function toggleMostrarHechosEnfoqueTrainer() {
    MOSTRAR_HECHOS_ENFOQUE = !MOSTRAR_HECHOS_ENFOQUE;
    renderizarSubAppTrainer();
}

function renderizarHtmlDetalleRutinaEnfoqueTrainer(activas, rutinas) {
    var ses = null;
    var enf = null;

    if (SESION_ACTIVA_DETALLE_ID) {
        ses = activas.find(function(s) { return s.id === SESION_ACTIVA_DETALLE_ID; }) || null;
    }
    if (!ses && ENFOQUE_DETALLE_ABIERTO_ID) {
        enf = rutinas.find(function(r) { return r.id === ENFOQUE_DETALLE_ABIERTO_ID; }) || null;
        if (enf) {
            ses = activas.find(function(s) { return s.enfoqueId === enf.id; }) || null;
        }
    }
    if (!ses && !enf && !ENFOQUE_DETALLE_CERRADO_MANUAL && activas.length > 0) {
        ses = activas[0];
        SESION_ACTIVA_DETALLE_ID = ses.id;
        ENFOQUE_DETALLE_ABIERTO_ID = ses.enfoqueId || '';
    }
    if (!ses && !enf) return '';

    var enfRef = enf || (ses && ses.enfoqueId ? rutinas.find(function(r) { return r.id === ses.enfoqueId; }) : null);
    var targetType = ses ? 'sesion' : 'enfoque';
    var targetId = ses ? ses.id : enf.id;
    var titulo = ses ? (ses.enfoque || (enfRef ? enfRef.nombre : 'Rutina en Curso')) : enf.nombre;
    var persona = ses ? (ses.alumnoNombre || 'Atleta') : (enf.alumnoNombre || 'Sin atleta asignado');
    var ejercicios = ses
        ? (Array.isArray(ses.ejercicios) && ses.ejercicios.length > 0 ? ses.ejercicios : resolverEjerciciosDeEnfoqueTrainer(enfRef))
        : resolverEjerciciosDeEnfoqueTrainer(enf);
    var grupos = ses
        ? ((Array.isArray(ses.gruposUsados) && ses.gruposUsados.length > 0) ? ses.gruposUsados : resolverGruposDeEjerciciosTrainer(ejercicios, titulo))
        : resolverGruposDeEnfoqueTrainer(enf);

    var pendientes = [];
    var completados = [];
    ejercicios.forEach(function(ej, idx) {
        var entry = { ej: ej, idx: idx };
        if (ej && ej.completado) completados.push(entry);
        else pendientes.push(entry);
    });
    var totalEjs = ejercicios.length;
    var pct = totalEjs > 0 ? Math.round((completados.length / totalEjs) * 100) : 0;

    var segsSes = ses ? Math.max(0, Math.floor((Date.now() - ses.inicioTimestamp) / 1000)) : 0;
    var relojSes = ses ? formatearSegundosTrainer(segsSes) : '';

    var html = `
    <div class="trainer-detalle-panel">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 10px;">
            <div style="min-width: 0; flex: 1;">
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 3px;">
                    ${ses ? `
                        <span class="subapp-badge" style="color: #34d399; border-color: rgba(52, 211, 153, 0.5); background: rgba(16, 185, 129, 0.18); padding: 2px 7px; font-size: 10px;">🟢 EN VIVO</span>
                        <span style="font-size: 12.5px; font-weight: 800; font-family: monospace; color: #34d399; background: #0d1322; border: 1px solid rgba(52, 211, 153, 0.35); padding: 1px 7px; border-radius: 6px;" data-trainer-clock-id="${ses.id}">${relojSes}</span>
                    ` : `
                        <span class="subapp-badge" style="color: #7dd3fc; border-color: rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.14); padding: 2px 7px; font-size: 10px;">📋 RUTINA</span>
                    `}
                    <span style="font-size: 12px; font-weight: 800; color: #38bdf8;">👤 ${escapeHtmlTrainer(persona)}</span>
                </div>
                <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #ffffff; line-height: 1.25;">${escapeHtmlTrainer(titulo)}</h4>
            </div>
            <div style="display: flex; gap: 5px; flex-shrink: 0;">
                ${enfRef ? `
                    <button type="button" class="trainer-btn-secondary" onclick="abrirModalEnfoqueTrainer('${enfRef.id}')" style="padding: 5px 8px; font-size: 11px;" title="Editar rutina">✏️</button>
                    <button type="button" class="trainer-btn-secondary" onclick="eliminarEnfoqueTrainer('${enfRef.id}')" style="padding: 5px 8px; font-size: 11px; color: #fca5a5; border-color: rgba(239, 68, 68, 0.35);" title="Eliminar rutina">🗑️</button>
                ` : ''}
                <button type="button" class="trainer-btn-secondary" onclick="cerrarDetalleEnfoqueTrainer()" style="padding: 5px 8px; font-size: 11px;" title="Ocultar detalle">✕</button>
            </div>
        </div>

        <div style="margin-bottom: 10px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #94a3b8; display: block; margin-bottom: 5px;">🧬 Grupos Musculares</span>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                ${grupos.length > 0
                    ? grupos.map(function(g) { return '<span class="trainer-muscle-pill">⚡ ' + escapeHtmlTrainer(g) + '</span>'; }).join('')
                    : '<span style="font-size: 11.5px; color: #94a3b8;">General / Funcional</span>'
                }
            </div>
        </div>
    `;

    if (totalEjs > 0) {
        html += `
        <div style="background: #101728; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 10px; padding: 8px 11px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 5px;">
                <span style="font-size: 11.5px; font-weight: 800; color: #f8fafc;">
                    <span style="color: #34d399;">${completados.length}/${totalEjs} hechos</span> ·
                    <span style="color: ${pendientes.length === 0 ? '#34d399' : '#fbbf24'};">${pendientes.length === 0 ? '🏆 ¡Culminada!' : 'Faltan ' + pendientes.length}</span>
                </span>
                <span style="font-size: 11.5px; font-weight: 800; color: #7dd3fc;">${pct}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 999px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #38bdf8 100%); transition: width 0.25s ease;"></div>
            </div>
        </div>

        <div style="margin-bottom: 10px;">
            <div style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px;">
                ⏳ Faltan para culminar (${pendientes.length})
            </div>
            ${pendientes.length === 0 ? `
                <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 10px; padding: 10px; text-align: center; color: #6ee7b7; font-size: 12px; font-weight: 800;">
                    🏆 ¡Rutina del día culminada con ${escapeHtmlTrainer(persona)}!
                </div>
            ` : `
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    ${pendientes.map(function(item) {
                        var ej = item.ej;
                        return `
                        <button type="button" class="trainer-ej-check-row" onclick="toggleEjercicioEnRutinaEnfoqueTrainer('${targetType}', '${targetId}', ${item.idx})">
                            <span class="trainer-ej-checkbox" aria-hidden="true"></span>
                            <span style="min-width: 0; flex: 1; text-align: left;">
                                <span style="display: block; font-size: 12.5px; font-weight: 800; color: #ffffff; line-height: 1.25;">${item.idx + 1}. ${escapeHtmlTrainer(ej.nombre)}</span>
                                <span style="display: block; font-size: 11px; font-weight: 700; color: #7dd3fc; margin-top: 2px;">${ej.series || 4} × ${escapeHtmlTrainer(ej.repeticiones || '8-10 reps')}${ej.musculoPrincipal ? ' · <span style="color:#94a3b8;">' + escapeHtmlTrainer(ej.musculoPrincipal) + '</span>' : ''}</span>
                            </span>
                            <span style="font-size: 11px; font-weight: 800; color: #34d399; flex-shrink: 0;">✓</span>
                        </button>`;
                    }).join('')}
                </div>
            `}
        </div>
        `;

        if (completados.length > 0) {
            var expandirHechos = (completados.length <= 2 || MOSTRAR_HECHOS_ENFOQUE);
            html += `
            <div style="margin-bottom: 10px;">
                <button type="button" onclick="toggleMostrarHechosEnfoqueTrainer()" style="width: 100%; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(52, 211, 153, 0.25); border-radius: 9px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; color: #34d399; font-size: 11px; font-weight: 800; cursor: pointer; text-transform: uppercase;">
                    <span>✅ Completados (${completados.length})</span>
                    <span>${expandirHechos ? '▲ Ocultar' : '▼ Ver hechos'}</span>
                </button>
                ${expandirHechos ? `
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px;">
                    ${completados.map(function(item) {
                        var ej = item.ej;
                        return `
                        <button type="button" class="trainer-ej-check-row is-done" onclick="toggleEjercicioEnRutinaEnfoqueTrainer('${targetType}', '${targetId}', ${item.idx})">
                            <span class="trainer-ej-checkbox is-checked" aria-hidden="true">✓</span>
                            <span style="min-width: 0; flex: 1; text-align: left;">
                                <span style="display: block; font-size: 12.5px; font-weight: 700; color: #a7f3d0; text-decoration: line-through;">${item.idx + 1}. ${escapeHtmlTrainer(ej.nombre)}</span>
                                <span style="font-size: 10.5px; color: #94a3b8;">${ej.series || 4} × ${escapeHtmlTrainer(ej.repeticiones || '8-10 reps')}${ej.musculoPrincipal ? ' · ' + escapeHtmlTrainer(ej.musculoPrincipal) : ''}</span>
                            </span>
                            <span style="font-size: 10px; font-weight: 700; color: #94a3b8; flex-shrink: 0;">Deshacer</span>
                        </button>`;
                    }).join('')}
                </div>` : ''}
            </div>
            `;
        }
    } else if (enfRef && enfRef.descripcion) {
        html += `
        <div style="font-size: 12px; color: #cbd5e1; line-height: 1.45; background: #101728; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 10px; padding: 8px 10px; margin-bottom: 10px;">
            ${escapeHtmlTrainer(enfRef.descripcion)}
        </div>
        `;
    }

    html += `
        <div style="display: flex; gap: 6px; flex-wrap: wrap; border-top: 1px solid rgba(148, 163, 184, 0.14); padding-top: 10px;">
            ${ses ? `
                <button type="button" class="trainer-btn-primary" onclick="pararTimerEntrenamiento('${ses.id}')" style="flex: 2; justify-content: center; font-size: 12px; padding: 8px 12px;">
                    🛑 Finalizar (${escapeHtmlTrainer(persona)})
                </button>
                <button type="button" class="trainer-btn-secondary" onclick="descartarTimerEntrenamiento('${ses.id}')" style="font-size: 11.5px; padding: 8px 10px; color: #fca5a5; border-color: rgba(239, 68, 68, 0.35);">
                    ✕ Descartar
                </button>
            ` : `
                <button type="button" class="trainer-btn-primary" onclick="iniciarRutinaEnfoqueTrainer('${enf.id}')" style="flex: 2; justify-content: center; font-size: 12px; padding: 8px 12px;">
                    🏋️‍♂️ Iniciar Rutina
                </button>
                <button type="button" class="trainer-btn-secondary" onclick="abrirModalIniciarEntrenamiento(null, '${escapeHtmlTrainer(enf.nombre)}', '${enf.id}')" style="font-size: 11.5px; padding: 8px 10px;" title="Iniciar con otro atleta">
                    👥+ Otro
                </button>
            `}
            ${totalEjs > 0 ? `
                <button type="button" class="trainer-btn-secondary" onclick="reiniciarEjerciciosEnRutinaEnfoqueTrainer('${targetType}', '${targetId}')" style="font-size: 11.5px; padding: 8px 10px;" title="Reiniciar ejercicios">
                    🔄
                </button>
            ` : ''}
        </div>
    </div>
    `;

    return html;
}

function renderizarHtmlCatalogoEnfoquesTrainer(rutinas) {
    var activas = APP_STATE.subappTrainer.sesionesActivas || [];
    var query = (BUSQUEDA_ENFOQUE_TRAINER || '').toLowerCase().trim();

    // Estado 100% limpio cuando no hay rutinas ni sesiones activas
    if (rutinas.length === 0 && activas.length === 0) {
        return `
        <div class="trainer-panel-clean" style="border-style: dashed; padding: 28px 16px; text-align: center; color: #cbd5e1;">
            <div style="font-size: 30px; margin-bottom: 6px;">🏖️</div>
            <div style="font-size: 14.5px; font-weight: 800; color: #f8fafc; margin-bottom: 4px;">Sin rutinas en tu horario</div>
            <div style="font-size: 12px; color: #94a3b8; max-width: 340px; margin: 0 auto 14px auto;">
                Cuando trabajes de Personal Trainer, genera rutinas aleatorias o crea una manual y aparecerán aquí.
            </div>
            <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                <button type="button" class="trainer-btn-primary" onclick="setTabTrainer('aleatoria')">
                    <span>🎲</span> Ir a Rutina Aleatoria
                </button>
                <button type="button" class="trainer-btn-secondary" onclick="abrirModalEnfoqueTrainer()">
                    <span>➕</span> Crear Manual
                </button>
            </div>
        </div>
        `;
    }

    var ordenadas = rutinas.slice().sort(function(a, b) {
        var aAct = activas.some(function(s) { return s.enfoqueId === a.id || (s.enfoque || '').toLowerCase() === (a.nombre || '').toLowerCase(); }) ? 1 : 0;
        var bAct = activas.some(function(s) { return s.enfoqueId === b.id || (s.enfoque || '').toLowerCase() === (b.nombre || '').toLowerCase(); }) ? 1 : 0;
        if (aAct !== bAct) return bAct - aAct;
        return (b.updatedAt || b.timestamp || 0) - (a.updatedAt || a.timestamp || 0);
    });

    var countAsignadas = ordenadas.filter(function(r) {
        return r.origen === 'aleatoria' || r.alumnoNombre || (Array.isArray(r.ejercicios) && r.ejercicios.length > 0);
    }).length;
    var countPlantillas = ordenadas.length - countAsignadas;

    var ocultasPorRodando = 0;
    var filtrados = ordenadas.filter(function(r) {
        var esPersonalizada = !!(r.origen === 'aleatoria' || r.alumnoNombre || (Array.isArray(r.ejercicios) && r.ejercicios.length > 0));
        var estaActiva = activas.some(function(s) { return s.enfoqueId === r.id || (!s.enfoqueId && (s.enfoque || '').toLowerCase() === (r.nombre || '').toLowerCase()); });

        if (FILTRO_ENFOQUE_TRAINER === 'asignadas' && !esPersonalizada) return false;
        if (FILTRO_ENFOQUE_TRAINER === 'activas' && !estaActiva) return false;
        if (FILTRO_ENFOQUE_TRAINER === 'plantillas' && esPersonalizada) return false;

        if (!query && FILTRO_ENFOQUE_TRAINER === 'todas' && activas.length > 0 && estaActiva && !MOSTRAR_CATALOGO_COMPLETO_ENFOQUES) {
            ocultasPorRodando++;
            return false;
        }

        if (!query) return true;
        var nom = (r.nombre || '').toLowerCase();
        var des = (r.descripcion || '').toLowerCase();
        var alN = (r.alumnoNombre || '').toLowerCase();
        var grps = resolverGruposDeEnfoqueTrainer(r).join(' ').toLowerCase();
        return nom.indexOf(query) !== -1 || des.indexOf(query) !== -1 || alN.indexOf(query) !== -1 || grps.indexOf(query) !== -1;
    });

    var html = '';

    // A) BARRA COMPACTA DE SESIONES RODANDO (1 pill por atleta, sin tarjetas enormes apiladas)
    if (activas.length > 0) {
        var detalleActivoId = SESION_ACTIVA_DETALLE_ID || (ENFOQUE_DETALLE_CERRADO_MANUAL ? '' : activas[0].id);
        html += `
        <div class="trainer-live-strip-box">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 8px;">
                <span style="font-size: 11.5px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.4px;">
                    🟢 Rodando Ahora (${activas.length})
                </span>
                <span style="font-size: 10.5px; color: #94a3b8;">Toca un atleta para ver su rutina</span>
            </div>
            <div class="trainer-live-pills-bar">
                ${activas.map(function(s) {
                    var segs = Math.max(0, Math.floor((Date.now() - s.inicioTimestamp) / 1000));
                    var reloj = formatearSegundosTrainer(segs);
                    var enfRef = s.enfoqueId ? rutinas.find(function(x) { return x.id === s.enfoqueId; }) : null;
                    var ejsS = (Array.isArray(s.ejercicios) && s.ejercicios.length > 0) ? s.ejercicios : resolverEjerciciosDeEnfoqueTrainer(enfRef);
                    var hechosS = ejsS.filter(function(e) { return !!e.completado; }).length;
                    var isSel = (detalleActivoId === s.id);
                    return `
                    <button type="button" class="trainer-live-pill-btn ${isSel ? 'is-selected' : ''}" onclick="seleccionarSesionActivaEnfoqueTrainer('${s.id}')">
                        <span style="font-weight: 800; color: #ffffff;">👤 ${escapeHtmlTrainer(s.alumnoNombre || 'Atleta')}</span>
                        <span style="font-family: monospace; font-weight: 800; color: #34d399; font-size: 11.5px;" data-trainer-clock-id="${s.id}">${reloj}</span>
                        ${ejsS.length > 0 ? `<span style="font-size: 10.5px; font-weight: 700; color: #7dd3fc;">${hechosS}/${ejsS.length}</span>` : ''}
                    </button>`;
                }).join('')}
            </div>
        </div>
        `;
    }

    // B) PANEL DETALLADO FOCALIZADO PARA LA RUTINA / ATLETA SELECCIONADO
    html += renderizarHtmlDetalleRutinaEnfoqueTrainer(activas, rutinas);

    // C) BARRA DE HORARIO / GUARDADAS (SIN DUPLICADOS) + BOTÓN VACIAR TODO
    var hayListasParaIniciar = ordenadas.some(function(r) {
        var nomA = (r.alumnoNombre || '').trim();
        var tieneP = !!(r.alumnoId || (nomA && nomA !== 'Atleta' && nomA !== 'Plantilla General' && nomA !== 'Alumno General'));
        var noRodando = !activas.some(function(s) { return s.enfoqueId === r.id; });
        return tieneP && noRodando;
    });

    html += `
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
        <span style="font-size: 12px; font-weight: 800; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.4px;">
            📋 En Tu Horario (${rutinas.length})
        </span>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${hayListasParaIniciar ? `
                <button type="button" class="trainer-btn-secondary" onclick="iniciarTodasRutinasAsignadasTrainer()" style="padding: 6px 10px; font-size: 11.5px; border-color: rgba(52, 211, 153, 0.45); color: #6ee7b7;" title="Inicia todas las rutinas asignadas a alumnos al mismo tiempo">
                    ⚡ Rodar Todas
                </button>
            ` : ''}
            <button type="button" class="trainer-btn-primary" onclick="abrirModalEnfoqueTrainer()" style="padding: 6px 11px; font-size: 11.5px;">
                ➕ Nueva
            </button>
            ${rutinas.length > 0 ? `
                <button type="button" class="trainer-btn-secondary" onclick="vaciarTodosEnfoquesTrainer()" style="padding: 6px 10px; font-size: 11.5px; color: #fca5a5; border-color: rgba(239, 68, 68, 0.35);" title="Eliminar todas las rutinas guardadas en Enfoques">
                    🧹 Vaciar
                </button>
            ` : ''}
        </div>
    </div>
    `;

    if (rutinas.length >= 3 || query) {
        html += `
        <div style="margin-bottom: 8px;">
            <input type="text" value="${escapeHtmlTrainer(BUSQUEDA_ENFOQUE_TRAINER)}" placeholder="🔍 Buscar rutina, atleta o músculo..." oninput="filtrarEnfoquesTrainer(this.value)" class="finanzas-input-clean" style="background: #151e34; border: 1px solid rgba(148, 163, 184, 0.24); color: #f8fafc; border-radius: 10px; padding: 8px 12px; width: 100%; box-sizing: border-box; font-size: 12.5px;">
        </div>
        `;
    }

    if (rutinas.length >= 3 && (countPlantillas > 0 || ocultasPorRodando > 0)) {
        html += `
        <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px;">
            <button type="button" class="trainer-filter-pill ${FILTRO_ENFOQUE_TRAINER === 'todas' ? 'active' : ''}" onclick="cambiarFiltroEnfoqueTrainer('todas')">En espera (${filtrados.length})</button>
            <button type="button" class="trainer-filter-pill ${FILTRO_ENFOQUE_TRAINER === 'asignadas' ? 'active' : ''}" onclick="cambiarFiltroEnfoqueTrainer('asignadas')">🔥 Aleatorias (${countAsignadas})</button>
            <button type="button" class="trainer-filter-pill ${FILTRO_ENFOQUE_TRAINER === 'activas' ? 'active' : ''}" onclick="cambiarFiltroEnfoqueTrainer('activas')">🟢 Rodando (${activas.length})</button>
            ${countPlantillas > 0 ? `<button type="button" class="trainer-filter-pill ${FILTRO_ENFOQUE_TRAINER === 'plantillas' ? 'active' : ''}" onclick="cambiarFiltroEnfoqueTrainer('plantillas')">🎯 Manuales (${countPlantillas})</button>` : ''}
        </div>
        `;
    }

    if (filtrados.length > 0) {
        html += '<div style="display: flex; flex-direction: column; gap: 7px;">';
        filtrados.forEach(function(r) {
            var ejsR = resolverEjerciciosDeEnfoqueTrainer(r);
            var gruposR = resolverGruposDeEnfoqueTrainer(r);
            var sesAsociadas = activas.filter(function(s) {
                return s.enfoqueId === r.id || (!s.enfoqueId && (s.enfoque || '').toLowerCase().trim() === (r.nombre || '').toLowerCase().trim());
            });
            var estaRodando = sesAsociadas.length > 0;
            var hechosR = ejsR.filter(function(e) { return !!e.completado; }).length;
            var seleccionado = (ENFOQUE_DETALLE_ABIERTO_ID === r.id && !ENFOQUE_DETALLE_CERRADO_MANUAL);
            var nomAlumno = (r.alumnoNombre || '').trim();
            var tienePersona = !!(r.alumnoId || (nomAlumno && nomAlumno !== 'Atleta' && nomAlumno !== 'Plantilla General' && nomAlumno !== 'Alumno General'));
            var yaRodandoMismoAtleta = estaRodando && (!tienePersona || sesAsociadas.some(function(s) {
                return (r.alumnoId && s.alumnoId === r.alumnoId) || ((s.alumnoNombre || '').toLowerCase() === nomAlumno.toLowerCase());
            }));

            html += `
            <div class="trainer-enfoque-row ${seleccionado ? 'is-selected' : ''} ${estaRodando ? 'is-running' : ''}" onclick="seleccionarEnfoqueDetalleTrainer('${r.id}')">
                <div style="min-width: 0; flex: 1;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        ${estaRodando ? '<span style="font-size: 10px; font-weight: 800; color: #34d399;">🟢</span>' : ''}
                        <span style="font-size: 13.5px; font-weight: 800; color: #ffffff;">${escapeHtmlTrainer(r.nombre)}</span>
                        ${r.alumnoNombre ? `<span style="font-size: 10.5px; font-weight: 700; color: #7dd3fc;">· 👤 ${escapeHtmlTrainer(r.alumnoNombre)}</span>` : ''}
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${gruposR.length > 0 ? escapeHtmlTrainer(gruposR.join(', ')) + ' · ' : ''}${ejsR.length > 0 ? hechosR + '/' + ejsR.length + ' ej.' : (r.tiempoMin || 60) + ' min'} · <span style="color:#34d399; font-weight:700;">$${(parseFloat(r.precio) || 0).toFixed(2)}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 5px; flex-shrink: 0;" onclick="event.stopPropagation()">
                    ${yaRodandoMismoAtleta ? `
                        <button type="button" class="trainer-btn-secondary" onclick="seleccionarSesionActivaEnfoqueTrainer('${sesAsociadas[0].id}')" style="padding: 5px 9px; font-size: 11px; color: #34d399; border-color: rgba(52, 211, 153, 0.4);">
                            👁️
                        </button>
                    ` : `
                        <button type="button" class="trainer-btn-primary" onclick="iniciarRutinaEnfoqueTrainer('${r.id}')" style="padding: 5px 10px; font-size: 11px;">
                            ▶ Iniciar
                        </button>
                    `}
                    <button type="button" class="trainer-btn-secondary" onclick="abrirModalEnfoqueTrainer('${r.id}')" style="padding: 5px 8px; font-size: 11px;" title="Editar">✏️</button>
                    <button type="button" class="trainer-btn-secondary" onclick="eliminarEnfoqueTrainer('${r.id}')" style="padding: 5px 8px; font-size: 11px; color: #fca5a5; border-color: rgba(239, 68, 68, 0.35);" title="Eliminar">🗑️</button>
                </div>
            </div>
            `;
        });
        html += '</div>';
    } else if (ocultasPorRodando === 0 && query) {
        html += `
        <div class="trainer-panel-clean" style="border-style: dashed; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            No se encontraron rutinas con "${escapeHtmlTrainer(query)}".
        </div>`;
    }

    if (ocultasPorRodando > 0) {
        html += `
        <div style="text-align: center; margin-top: 8px;">
            <button type="button" class="trainer-btn-secondary" onclick="toggleCatalogoCompletoEnfoquesTrainer()" style="font-size: 11px; padding: 5px 12px; color: #94a3b8;">
                📂 ${MOSTRAR_CATALOGO_COMPLETO_ENFOQUES ? 'Ocultar las ' + ocultasPorRodando + ' activas de esta lista ▲' : 'Mostrar también ' + ocultasPorRodando + ' ya activas arriba ▼'}
            </button>
        </div>`;
    } else if (MOSTRAR_CATALOGO_COMPLETO_ENFOQUES && activas.length > 0) {
        html += `
        <div style="text-align: center; margin-top: 8px;">
            <button type="button" class="trainer-btn-secondary" onclick="toggleCatalogoCompletoEnfoquesTrainer()" style="font-size: 11px; padding: 5px 12px; color: #94a3b8;">
                📂 Ocultar las activas repetidas ▲
            </button>
        </div>`;
    }

    return html;
}

function renderizarHtmlHistorialEntrenamientosTrainer(sesiones, alumnos) {
    var alumnoFiltro = FILTRO_HISTORIAL_TRAINER_ALUMNO || '';
    var filtradas = sesiones.filter(function(s) {
        if (!alumnoFiltro) return true;
        return (s.alumnoId && s.alumnoId === alumnoFiltro) || (s.alumnoNombre && s.alumnoNombre.toLowerCase() === alumnoFiltro.toLowerCase());
    });

    var html = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px;">
            <label style="font-size: 12px; color: #cbd5e1; font-weight: 700;">Alumno:</label>
            <select class="finanzas-input-clean" onchange="filtrarHistorialTrainerPorAlumno(this.value)" style="background: #151e34; border: 1px solid rgba(148, 163, 184, 0.24); color: #f8fafc; border-radius: 9px; padding: 7px 11px; font-size: 12.5px;">
                <option value="">Todos (${sesiones.length})</option>
    `;

    alumnos.forEach(function(al) {
        var sel = alumnoFiltro === al.id ? 'selected' : '';
        html += `<option value="${al.id}" ${sel}>${escapeHtmlTrainer(al.nombre)}</option>`;
    });

    html += `
            </select>
        </div>
        <div style="font-size: 12px; color: #cbd5e1;">
            Mostrando <strong style="color: #34d399;">${filtradas.length}</strong> de ${sesiones.length}
        </div>
    </div>
    `;

    if (filtradas.length === 0) {
        html += `
        <div class="trainer-panel-clean" style="border-style: dashed; padding: 34px 18px; text-align: center; color: #cbd5e1;">
            <div style="font-size: 32px; margin-bottom: 8px;">📋</div>
            <div style="font-size: 14.5px; font-weight: 800; color: #f8fafc;">Sin sesiones registradas</div>
            <div style="font-size: 12px; margin-top: 4px; color: #cbd5e1;">Usa "Iniciar Sesión" para cronometrar y registrar tu entrenamiento.</div>
        </div>
        `;
        return html;
    }

    html += '<div style="display: flex; flex-direction: column; gap: 8px;">';

    filtradas.forEach(function(s) {
        html += `
        <div style="background: #162036; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 13px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(52, 211, 153, 0.45); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                    🏋️‍♂️
                </div>
                <div>
                    <div style="font-size: 13.5px; font-weight: 800; color: #ffffff;">
                        ${escapeHtmlTrainer(s.alumnoNombre || 'Alumno')} 
                        <span style="font-size: 11px; font-weight: 700; color: #34d399; margin-left: 4px;">${escapeHtmlTrainer(s.enfoque || 'Entrenamiento')}</span>
                    </div>
                    <div style="font-size: 11.5px; color: #cbd5e1;">
                        📅 ${s.fecha} · ⏱️ ${s.duracionMinutos || 60} min${s.ejerciciosTotal > 0 ? ' · ✅ ' + (s.ejerciciosCompletados || 0) + '/' + s.ejerciciosTotal + ' ej.' : ''}
                    </div>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="text-align: right;">
                    <div style="font-size: 15px; font-weight: 800; color: #34d399;">+$${(parseFloat(s.cobro) || 0).toFixed(2)}</div>
                    <div style="font-size: 10px; color: #94a3b8;">cobrado</div>
                </div>
                <button type="button" class="trainer-btn-secondary" onclick="eliminarEntrenamientoTrainer('${s.id}')" style="padding: 6px 9px; font-size: 11px; color: #fca5a5; border-color: rgba(239, 68, 68, 0.35);" title="Eliminar registro">
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

// ==========================================================================
// SUB-APP TRAINER: GENERADOR DE RUTINA ALEATORIA & ASIGNADOR A ATLETAS
// ==========================================================================

function obtenerDiaRutinaTrainerActivoIdx() {
    if (typeof DIA_TRAINER_ALEATORIA_SELECCIONADO === 'number' && DIA_TRAINER_ALEATORIA_SELECCIONADO >= 0 && DIA_TRAINER_ALEATORIA_SELECCIONADO <= 6) {
        return DIA_TRAINER_ALEATORIA_SELECCIONADO;
    }
    return obtenerDiaSemanaActualIdx();
}

function cambiarDiaRutinaTrainer(diaIdx) {
    DIA_TRAINER_ALEATORIA_SELECCIONADO = diaIdx;
    RUTINA_TRAINER_GENERADA = null;
    RUTINA_TRAINER_META = null;
    renderizarSubAppTrainer();
}

function renderizarHtmlRutinaAleatoriaTrainer() {
    asegurarEstructuraTrainer();
    var alumnos = APP_STATE.subappTrainer.alumnos || [];

    if (SUBVISTA_TRAINER_ALEATORIA === 'settings') {
        return renderizarHtmlSettingsSplitTrainer();
    }

    var alumnoActivo = null;
    if (ALUMNO_RUTINA_TRAINER_SELECCIONADO) {
        alumnoActivo = alumnos.find(function(a) { return a.id === ALUMNO_RUTINA_TRAINER_SELECCIONADO; });
    }

    var perfil = PERFIL_TRAINER_ALEATORIA_ACTIVO || 'hombre';
    var split = obtenerSplitSemanalActual(perfil);
    var diaHoyIdx = obtenerDiaSemanaActualIdx();
    var diaIdx = obtenerDiaRutinaTrainerActivoIdx();
    var diaConfig = split[diaIdx] || { dia: DIAS_SEMANA_NOMBRES[diaIdx], descanso: false, grupos: [] };
    var nombreDia = DIAS_SEMANA_NOMBRES[diaIdx];
    var esHoyDia = (diaIdx === diaHoyIdx);
    var esDescanso = !!diaConfig.descanso;
    var grupos = diaConfig.grupos || [];

    var metaCoincideDia = RUTINA_TRAINER_META && RUTINA_TRAINER_META.diaIdx === diaIdx;
    var gruposMostrados = (metaCoincideDia && Array.isArray(RUTINA_TRAINER_META.gruposUsados) && RUTINA_TRAINER_META.gruposUsados.length > 0)
        ? RUTINA_TRAINER_META.gruposUsados
        : grupos;
    var fueSorteoDescanso = !!(metaCoincideDia && RUTINA_TRAINER_META.fueSorteoDescanso);

    var dayChipsHtml = split.map(function(dItem, idx) {
        var corto = (dItem.dia || DIAS_SEMANA_NOMBRES[idx] || '').slice(0, 3);
        var sel = idx === diaIdx;
        var rest = !!dItem.descanso;
        var cnt = Array.isArray(dItem.grupos) ? dItem.grupos.length : 0;
        return `<button type="button" class="trainer-day-chip ${sel ? 'is-selected' : ''} ${rest ? 'is-rest-chip' : ''}" onclick="cambiarDiaRutinaTrainer(${idx})" title="${dItem.dia}${idx === diaHoyIdx ? ' (Hoy)' : ''}">
            <span>${corto}${idx === diaHoyIdx ? ' ★' : ''}</span>
            <span class="trainer-day-chip-dot">${rest ? '🏖️' : (cnt + ' grp')}</span>
        </button>`;
    }).join('');

    var html = `
    <div class="trainer-panel-clean" style="margin-bottom: 16px;">
        <!-- CABECERA LIMPIA CON BOTÓN DE SETTINGS DESTACADO -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
            <div style="min-width: 180px; flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="font-size: 19px;">🎲</span>
                    <h3 style="margin: 0; font-size: 16.5px; font-weight: 800; color: #f8fafc;">Generador de Rutina Aleatoria</h3>
                </div>
                <p style="margin: 3px 0 0 0; font-size: 12px; color: #cbd5e1;">
                    Crea rutinas aleatorias según tus grupos musculares de cada día (incluso en descanso).
                </p>
            </div>
            <button type="button" id="btn-trainer-aleatoria-settings" class="trainer-btn-settings" onclick="mostrarSubvistaTrainerAleatoria('settings')">
                <span>⚙️</span> Settings
            </button>
        </div>

        <!-- SELECTOR DE ATLETA Y PERFIL -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 14px; background: #182238; border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 13px; padding: 12px 14px;">
            <div>
                <label style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #34d399; margin-bottom: 6px;">
                    👤 Atleta / Destinatario
                </label>
                <select id="trainer-rutina-alumno-select" class="finanzas-input-clean" onchange="alCambiarAlumnoRutinaTrainer(this.value)" style="width: 100%; box-sizing: border-box; background: #101728; border: 1px solid rgba(52, 211, 153, 0.38); color: #f8fafc; border-radius: 10px; padding: 9px 11px; font-size: 12.5px;">
                    <option value="">-- Plantilla General / Libre --</option>
                    ${alumnos.map(function(al) {
                        var sel = (ALUMNO_RUTINA_TRAINER_SELECCIONADO === al.id) ? 'selected' : '';
                        var gIcon = al.genero === 'Femenino' ? '👩' : '👨';
                        return `<option value="${al.id}" ${sel}>${gIcon} ${escapeHtmlTrainer(al.nombre)} · ${escapeHtmlTrainer(al.objetivo || 'Fitness')}</option>`;
                    }).join('')}
                </select>
            </div>

            <div>
                <label style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #cbd5e1; margin-bottom: 6px;">
                    🧬 Perfil / Split
                </label>
                <div class="toggle-perfil-split-box" style="width: 100%; justify-content: stretch;">
                    <button type="button" class="btn-toggle-perfil-split ${perfil === 'hombre' ? 'active' : ''}" style="flex: 1; justify-content: center;" onclick="cambiarPerfilRutinaTrainer('hombre')">
                        👨 Hombre
                    </button>
                    <button type="button" class="btn-toggle-perfil-split ${perfil === 'mujer' ? 'active' : ''}" style="flex: 1; justify-content: center;" onclick="cambiarPerfilRutinaTrainer('mujer')">
                        👩 Mujer
                    </button>
                </div>
            </div>
        </div>

        <!-- RESUMEN DE ALUMNO SELECCIONADO -->
        ${alumnoActivo ? `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 12px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="trainer-avatar-initials" style="width: 38px; height: 38px; font-size: 14px;">
                    ${escapeHtmlTrainer(alumnoActivo.nombre ? alumnoActivo.nombre.slice(0, 2).toUpperCase() : 'AL')}
                </div>
                <div>
                    <div style="font-size: 14px; font-weight: 800; color: #f8fafc;">${escapeHtmlTrainer(alumnoActivo.nombre)}</div>
                    <div style="font-size: 11.5px; color: #cbd5e1;">
                        🎯 <strong style="color: #7dd3fc;">${escapeHtmlTrainer(alumnoActivo.objetivo || 'Fitness')}</strong>
                        ${alumnoActivo.peso ? ` · ⚖️ ${alumnoActivo.peso} kg` : ''}
                    </div>
                </div>
            </div>
            <button type="button" class="trainer-btn-secondary" onclick="verFichaAlumnoTrainer('${alumnoActivo.id}')" style="padding: 6px 11px; font-size: 11.5px;">
                📋 Ver Ficha
            </button>
        </div>
        ` : ''}

        <!-- BANNER DEL DÍA Y SELECTOR RÁPIDO LUN-DOM -->
        <div class="generator-banner-today">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #7dd3fc; background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.35); padding: 2px 8px; border-radius: 6px;">
                        ${perfil === 'mujer' ? '👩 Mujer' : '👨 Hombre'}
                    </span>
                    <span style="font-size: 16.5px; font-weight: 800; color: #ffffff;">
                        📅 ${nombreDia}${esHoyDia ? ' <span style="color:#34d399; font-size:12.5px;">(Hoy)</span>' : ''}
                    </span>
                </div>
                <span style="font-size: 11px; font-weight: 700; color: ${esDescanso ? '#fcd34d' : '#6ee7b7'}; background: ${esDescanso ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; border: 1px solid ${esDescanso ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}; padding: 3px 9px; border-radius: 9999px;">
                    ${esDescanso ? '🏖️ Descanso · Sorteo Activo' : '💪 Día de Entrenamiento'}
                </span>
            </div>

            <div class="trainer-day-pills-bar">${dayChipsHtml}</div>

            <div style="margin-top: 12px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                ${esDescanso && !fueSorteoDescanso ? `
                    <span style="font-size: 12px; color: #e2e8f0; line-height: 1.4;">
                        Hoy es descanso programado, pero si pides rutina se elegirán <strong>grupos musculares al azar</strong> de tu configuración de Settings.
                    </span>
                ` : ''}
                ${fueSorteoDescanso ? `
                    <span style="font-size: 11.5px; font-weight: 800; color: #fcd34d; margin-right: 4px;">🎲 Grupos sorteados:</span>
                ` : ''}
                ${(gruposMostrados && gruposMostrados.length > 0 && (!esDescanso || fueSorteoDescanso))
                    ? gruposMostrados.map(function(g) {
                        return `<span style="display: inline-flex; align-items: center; padding: 4px 10px; background: rgba(16, 185, 129, 0.18); border: 1px solid rgba(52, 211, 153, 0.45); color: #ecfdf5; border-radius: 9999px; font-size: 11.5px; font-weight: 700;">⚡ ${g}</span>`;
                    }).join('')
                    : (!esDescanso ? `<span style="color: #fcd34d; font-size: 12px;">Sin grupos fijos este día: se sortearán al azar de Settings al generar.</span>` : '')}
            </div>
        </div>

        <!-- BOTÓN GENERAR -->
        <div style="margin-bottom: 18px;">
            <button type="button" id="btn-trainer-generar-rutina" class="btn-system" onclick="generarRutinaAleatoriaTrainer()" style="width: 100%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-weight: 800; font-size: 14.5px; padding: 13px 20px; border-radius: 12px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35); border: 1px solid rgba(52, 211, 153, 0.5); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>⚡</span> ${esDescanso ? 'Generar Rutina Aleatoria (Elegir Grupos al Azar)' : 'Generar Rutina de ' + nombreDia} ${alumnoActivo ? ('· ' + escapeHtmlTrainer(alumnoActivo.nombre)) : ''}
            </button>
        </div>

        <!-- CONTENEDOR DE LA RUTINA GENERADA -->
        <div id="trainer-rutina-generada-box">
            ${renderizarCuerpoRutinaTrainerGenerada(alumnoActivo, gruposMostrados)}
        </div>
    </div>
    `;

    return html;
}

function renderizarCuerpoRutinaTrainerGenerada(alumnoActivo, grupos) {
    if (!RUTINA_TRAINER_GENERADA || RUTINA_TRAINER_GENERADA.length === 0) {
        return `
        <div style="text-align: center; padding: 28px 18px; background: #182238; border: 1px dashed rgba(56, 189, 248, 0.35); border-radius: 14px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🎲</span>
            <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 15.5px; font-weight: 800;">Listo para generar tu rutina</h4>
            <p style="color: #cbd5e1; font-size: 12.5px; max-width: 440px; margin: 0 auto 14px auto; line-height: 1.5;">
                Pulsa el botón verde para elegir entre 4 y 6 ejercicios aleatorios balanceados según los grupos musculares configurados en <strong>⚙️ Settings</strong>.
            </p>
            <button type="button" class="trainer-btn-secondary" onclick="mostrarSubvistaTrainerAleatoria('settings')" style="margin: 0 auto;">
                ⚙️ Configurar Grupos por Día
            </button>
        </div>`;
    }

    var gruposMetaTrainer = (RUTINA_TRAINER_META && Array.isArray(RUTINA_TRAINER_META.gruposUsados) && RUTINA_TRAINER_META.gruposUsados.length > 0)
        ? RUTINA_TRAINER_META.gruposUsados
        : [];
    var seccionesTrainer = (typeof agruparEjerciciosPorGrupoMuscular === 'function')
        ? agruparEjerciciosPorGrupoMuscular(RUTINA_TRAINER_GENERADA, gruposMetaTrainer)
        : [{ grupo: 'General', color: '#34d399', items: RUTINA_TRAINER_GENERADA.map(function(e, i) { return { ej: e, idx: i }; }) }];

    var fmtMusc = (typeof formatearEtiquetaMusculoLimpia === 'function')
        ? formatearEtiquetaMusculoLimpia
        : function(t) { return String(t || '').replace(/[_-]+/g, ' ').trim(); };

    var resumenGruposPillsHtml = seccionesTrainer.map(function(sec) {
        return `<span class="rutina-grupo-resumen-pill" style="--grp-color: ${sec.color};">
            <span class="rutina-grupo-dot"></span>
            <span>${escapeHtmlTrainer(sec.grupo)}</span>
            <strong class="rutina-grupo-resumen-num">${sec.items.length}</strong>
        </span>`;
    }).join('');

    var html = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
        <div>
            <h4 style="margin: 0; color: #f8fafc; font-size: 15px; font-weight: 800;">
                🔥 Sesión Generada (${RUTINA_TRAINER_GENERADA.length} Ejercicios · ${seccionesTrainer.length} ${seccionesTrainer.length === 1 ? 'Grupo' : 'Grupos'})
            </h4>
            <span style="font-size: 12px; color: #cbd5e1;">Detallada por grupo muscular. 🔄 Re-roll siempre cambia por otro ejercicio del mismo grupo.</span>
        </div>
        <button type="button" class="trainer-btn-secondary" onclick="generarRutinaAleatoriaTrainer()" style="font-size: 12px; padding: 6px 12px;">
            🔄 Regenerar
        </button>
    </div>

    <div class="rutina-grupos-resumen-bar">${resumenGruposPillsHtml}</div>

    <div class="rutina-grupos-stack" style="margin-bottom: 16px;">
    `;

    var numGlobalTrainer = 0;
    seccionesTrainer.forEach(function(sec) {
        html += `
        <div class="rutina-grupo-bloque" style="--grp-color: ${sec.color};" data-grupo-muscular="${escapeHtmlTrainer(sec.grupo)}">
            <div class="rutina-grupo-header">
                <div class="rutina-grupo-titulo">
                    <span class="rutina-grupo-dot"></span>
                    <span>💪 ${escapeHtmlTrainer(sec.grupo)}</span>
                </div>
                <span class="rutina-grupo-count">${sec.items.length} ${sec.items.length === 1 ? 'ejercicio' : 'ejercicios'}</span>
            </div>
            <div class="rutina-grupo-lista">
        `;

        sec.items.forEach(function(par) {
            numGlobalTrainer++;
            var ej = par.ej;
            var idx = par.idx;
            var esComp = !!ej.compuesto;
            var badgeComp = esComp
                ? `<span style="font-size: 10px; font-weight: 800; background: rgba(99, 102, 241, 0.25); border: 1px solid rgba(129, 140, 248, 0.5); color: #e0e7ff; padding: 2px 7px; border-radius: 6px;">⭐ PRINCIPAL</span>`
                : `<span style="font-size: 10px; font-weight: 700; background: rgba(56, 189, 248, 0.14); border: 1px solid rgba(56, 189, 248, 0.32); color: #bae6fd; padding: 2px 7px; border-radius: 6px;">ACCESORIO</span>`;
            var muscleBadges = (ej.categorias || [ej.musculoPrincipal]).filter(Boolean).map(function(c) {
                return `<span style="font-size: 10.5px; font-weight: 700; background: #101728; border: 1px solid rgba(148, 163, 184, 0.22); color: #e2e8f0; padding: 2px 7px; border-radius: 5px;">${escapeHtmlTrainer(fmtMusc(c))}</span>`;
            }).join(' ');

            html += `
            <div class="random-exercise-card" data-grupo-asignado="${escapeHtmlTrainer(sec.grupo)}">
                <div style="display: flex; align-items: flex-start; gap: 11px; flex: 1; min-width: 0;">
                    <div style="width: 30px; height: 30px; border-radius: 8px; background: rgba(15, 23, 42, 0.85); border: 1px solid ${sec.color}66; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: ${sec.color}; flex-shrink: 0;">
                        ${numGlobalTrainer}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 3px;">
                            <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #ffffff;">${escapeHtmlTrainer(ej.nombre)}</h4>
                            ${badgeComp}
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                            <span style="font-size: 12px; font-weight: 700; color: #38bdf8;">${ej.series || 4} series × ${escapeHtmlTrainer(ej.repeticiones || '10-12 reps')}</span>
                            ${muscleBadges}
                        </div>
                    </div>
                </div>
                <div style="flex-shrink: 0;">
                    <button type="button" class="btn-reroll-item" onclick="reRollearEjercicioTrainer(${idx})" title="Cambiar por otro ejercicio de ${escapeHtmlTrainer(sec.grupo)}">
                        <span>🔄</span> Re-roll
                    </button>
                </div>
            </div>
            `;
        });

        html += `
            </div>
        </div>
        `;
    });

    html += `
    </div>

    <!-- BOTONES DE ACCIÓN PARA EL ATLETA -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
        <button type="button" id="btn-trainer-enviar-rutina" class="btn-system" onclick="abrirModalEnviarRutinaTrainer()" style="flex: 2; min-width: 190px; padding: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-weight: 800; font-size: 13.5px; border: none; border-radius: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
            <span>📤</span> Enviar Rutina
        </button>
        <button type="button" class="btn-system" onclick="iniciarEntrenamientoConRutinaTrainer()" style="flex: 1.5; min-width: 170px; padding: 12px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; font-weight: 800; font-size: 13.5px; border: none; border-radius: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">
            <span>🏋️‍♂️</span> Iniciar Sesión
        </button>
        <button type="button" class="trainer-btn-secondary" onclick="guardarRutinaTrainerComoEnfoque()" style="padding: 12px 16px; font-weight: 700; font-size: 13px;">
            <span>💾</span> Guardar Enfoque
        </button>
    </div>
    `;

    return html;
}

function formatearListaGruposNaturalTrainer(grupos) {
    var limpios = (grupos || []).map(function(g) { return String(g || '').trim().toLowerCase(); }).filter(Boolean);
    var unicos = [];
    limpios.forEach(function(g) {
        if (unicos.indexOf(g) === -1) unicos.push(g);
    });
    if (unicos.length === 0) return 'entrenamiento completo';
    if (unicos.length === 1) return unicos[0];
    if (unicos.length === 2) return unicos[0] + ' y ' + unicos[1];
    return unicos.slice(0, -1).join(', ') + ' y ' + unicos[unicos.length - 1];
}

function formatearEjercicioWhatsAppTrainer(ej) {
    if (!ej) return '';
    var nombre = String(ej.nombre || 'Ejercicio').trim();
    var seriesNum = Number(ej.series) || 4;
    var etiquetaSeries = seriesNum === 1 ? 'serie' : 'series';
    var rawReps = String(ej.repeticiones || '10-12 reps').trim();
    var repsWa = rawReps.replace(/\breps?\b/gi, 'repes');
    var notaCue = String(ej.nota || ej.notas || ej.tip || '').trim();
    var linea = nombre + ': ' + seriesNum + ' ' + etiquetaSeries + ' × ' + repsWa;
    if (notaCue) {
        linea += ' (' + notaCue + ')';
    }
    return linea;
}

function construirMensajesWhatsAppRutinaTrainer() {
    var ejercicios = Array.isArray(RUTINA_TRAINER_GENERADA) ? RUTINA_TRAINER_GENERADA : [];
    var diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var diaHoyDefault = diasSemana[(new Date()).getDay()];
    var diaNombre = (RUTINA_TRAINER_META && RUTINA_TRAINER_META.diaNombre)
        ? String(RUTINA_TRAINER_META.diaNombre).trim().toLowerCase()
        : diaHoyDefault;

    var grupos = (RUTINA_TRAINER_META && Array.isArray(RUTINA_TRAINER_META.gruposUsados) && RUTINA_TRAINER_META.gruposUsados.length > 0)
        ? RUTINA_TRAINER_META.gruposUsados
        : ejercicios.map(function(e) { return e.grupoAsignado || e.musculoPrincipal || ''; }).filter(Boolean);
    var gruposTexto = formatearListaGruposNaturalTrainer(grupos);

    var atleta = null;
    if (typeof ALUMNO_RUTINA_TRAINER_SELECCIONADO !== 'undefined' && ALUMNO_RUTINA_TRAINER_SELECCIONADO) {
        atleta = (APP_STATE.subappTrainer && Array.isArray(APP_STATE.subappTrainer.alumnos))
            ? APP_STATE.subappTrainer.alumnos.find(function(a) { return a.id === ALUMNO_RUTINA_TRAINER_SELECCIONADO; })
            : null;
    }

    var introLinea = (atleta && atleta.nombre)
        ? ('Para ' + atleta.nombre + ' (' + diaNombre + '): hoy toca ' + gruposTexto + ' con buen bombeo 💪')
        : ('Hoy toca ' + gruposTexto + ' con buen bombeo 💪');

    var secciones = (typeof agruparEjerciciosPorGrupoMuscular === 'function')
        ? agruparEjerciciosPorGrupoMuscular(ejercicios, grupos)
        : [{ grupo: 'Rutina', items: ejercicios.map(function(e, i) { return { ej: e, idx: i }; }) }];

    var mensajes = [];
    secciones.forEach(function(sec, secIdx) {
        var ejsSec = sec.items.map(function(p) { return p.ej; }).filter(Boolean);
        var chunkSize = 3;
        for (var c = 0; c < ejsSec.length; c += chunkSize) {
            var slice = ejsSec.slice(c, c + chunkSize);
            var lineas = slice.map(function(e) { return '• ' + formatearEjercicioWhatsAppTrainer(e); }).filter(Boolean);
            var cabeceraGrupo = '💪 *' + sec.grupo + '*';
            lineas.unshift(cabeceraGrupo);
            if (secIdx === 0 && c === 0) {
                lineas.unshift(introLinea);
            }
            mensajes.push({
                index: mensajes.length,
                numero: mensajes.length + 1,
                titulo: 'Mensaje ' + (mensajes.length + 1) + ' · ' + sec.grupo,
                cantidadEjercicios: slice.length,
                texto: lineas.join('\n')
            });
        }
    });

    return {
        diaNombre: diaNombre,
        gruposTexto: gruposTexto,
        atletaNombre: atleta ? atleta.nombre : '',
        mensajes: mensajes
    };
}

function copiarTextoPortapapelesTrainer(texto, onOk) {
    var yaNotificado = false;
    var notificarOk = function() {
        if (yaNotificado) return;
        yaNotificado = true;
        if (typeof onOk === 'function') onOk();
    };

    var intentarExecSync = function() {
        var ok = false;
        try {
            var activeEl = document.activeElement;
            var ta = document.createElement('textarea');
            ta.value = texto;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.top = '0';
            ta.style.left = '0';
            ta.style.width = '2px';
            ta.style.height = '2px';
            ta.style.opacity = '0';
            ta.style.pointerEvents = 'none';
            document.body.appendChild(ta);
            try { ta.focus({ preventScroll: true }); } catch (eTaFocus) { ta.focus(); }
            ta.select();
            ta.setSelectionRange(0, texto.length);
            ok = !!document.execCommand('copy');
            document.body.removeChild(ta);
            if (activeEl && typeof activeEl.focus === 'function') {
                try { activeEl.focus({ preventScroll: true }); } catch (eFocus) {}
            }
        } catch (err) {
            ok = false;
        }
        return ok;
    };

    var syncOk = intentarExecSync();
    if (syncOk) {
        notificarOk();
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && window.isSecureContext) {
        navigator.clipboard.writeText(texto).then(function() {
            notificarOk();
        }).catch(function() {
            if (!syncOk && typeof mostrarToast === 'function') {
                mostrarToast('⚠️ No se pudo copiar automáticamente; selecciona el texto manual', 'warning');
            }
        });
    } else if (!syncOk && typeof mostrarToast === 'function') {
        mostrarToast('⚠️ No se pudo copiar automáticamente; selecciona el texto manual', 'warning');
    }
}

function abrirModalEnviarRutinaTrainer() {
    if (!RUTINA_TRAINER_GENERADA || RUTINA_TRAINER_GENERADA.length === 0) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('⚠️ Primero genera una rutina aleatoria arriba', 'warning');
        }
        return;
    }

    var paquete = construirMensajesWhatsAppRutinaTrainer();
    var modal = document.getElementById('modal-enviar-rutina-whatsapp-trainer');
    var subEl = document.getElementById('enviar-rutina-wa-subtitle');
    var cont = document.getElementById('enviar-rutina-wa-mensajes');
    var btnTodo = document.getElementById('btn-wa-copiar-todo');

    if (!modal || !subEl || !cont) return;

    var etiquetaAtleta = paquete.atletaNombre
        ? (' para <strong>' + escapeHtmlTrainer(paquete.atletaNombre) + '</strong>')
        : '';

    subEl.innerHTML = 'Aquí tienes esta rutina de <strong>' + escapeHtmlTrainer(paquete.diaNombre) + '</strong>' + etiquetaAtleta +
        ' (' + escapeHtmlTrainer(paquete.gruposTexto) + ') adaptada al estilo natural de WhatsApp, dividida en <strong>' +
        paquete.mensajes.length + ' mensajitos</strong> para que los copies y pegues de volada:';

    var cardsHtml = '';
    paquete.mensajes.forEach(function(m) {
        var lineCount = m.texto.split('\n').length;
        var rows = Math.max(3, Math.min(7, lineCount + 1));
        cardsHtml += `
        <div class="trainer-wa-msg-card" id="wa-msg-card-${m.index}">
            <div class="trainer-wa-msg-head">
                <span class="trainer-wa-msg-badge">
                    <span>💬</span> ${escapeHtmlTrainer(m.titulo)}
                    <span style="font-size: 10.5px; font-weight: 600; color: #94a3b8;">(${m.cantidadEjercicios} ${m.cantidadEjercicios === 1 ? 'ej.' : 'ejs.'})</span>
                </span>
                <button type="button" class="trainer-wa-copy-btn" id="wa-copy-btn-${m.index}" onclick="copiarMensajeWhatsAppTrainer(${m.index})">
                    📋 Copiar
                </button>
            </div>
            <textarea class="trainer-wa-msg-textarea" id="wa-msg-textarea-${m.index}" rows="${rows}" aria-label="${escapeHtmlTrainer(m.titulo)}">${escapeHtmlTrainer(m.texto)}</textarea>
        </div>
        `;
    });

    cont.innerHTML = cardsHtml;
    if (btnTodo) {
        btnTodo.innerHTML = '📋 Copiar Todo';
    }
    modal.style.display = 'flex';

    // Ajustar altura exacta de cada bloque de texto tras pintar para evitar texto cortado en móvil
    document.querySelectorAll('#enviar-rutina-wa-mensajes .trainer-wa-msg-textarea').forEach(function(ta) {
        ta.style.height = 'auto';
        ta.style.height = (ta.scrollHeight + 4) + 'px';
    });
}

function cerrarModalEnviarRutinaTrainer() {
    var modal = document.getElementById('modal-enviar-rutina-whatsapp-trainer');
    if (modal) modal.style.display = 'none';
}

function obtenerMensajesWhatsAppActualesTrainer() {
    var textareas = document.querySelectorAll('#enviar-rutina-wa-mensajes .trainer-wa-msg-textarea');
    var resultados = [];
    textareas.forEach(function(ta) {
        var val = String(ta.value || '').trim();
        if (val) resultados.push(val);
    });
    return resultados;
}

function copiarMensajeWhatsAppTrainer(idx) {
    var ta = document.getElementById('wa-msg-textarea-' + idx);
    var card = document.getElementById('wa-msg-card-' + idx);
    var btn = document.getElementById('wa-copy-btn-' + idx);
    if (!ta) return;

    var texto = String(ta.value || '').trim();
    copiarTextoPortapapelesTrainer(texto, function() {
        if (card) card.classList.add('is-copied');
        if (btn) {
            btn.classList.add('is-copied');
            btn.innerHTML = '✓ Copiado';
        }
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Mensaje ' + (idx + 1) + ' copiado para WhatsApp', '📋');
        }
    });
}

function copiarTodosMensajesWhatsAppTrainer() {
    var lista = obtenerMensajesWhatsAppActualesTrainer();
    if (lista.length === 0) return;

    var textoCompleto = lista.join('\n\n');
    copiarTextoPortapapelesTrainer(textoCompleto, function() {
        var btnTodo = document.getElementById('btn-wa-copiar-todo');
        if (btnTodo) {
            btnTodo.innerHTML = '✓ ¡Todo Copiado!';
        }
        document.querySelectorAll('#enviar-rutina-wa-mensajes .trainer-wa-msg-card').forEach(function(c) {
            c.classList.add('is-copied');
        });
        document.querySelectorAll('#enviar-rutina-wa-mensajes .trainer-wa-copy-btn').forEach(function(b) {
            b.classList.add('is-copied');
            b.innerHTML = '✓ Copiado';
        });
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Toda la rutina (' + lista.length + ' mensajes) copiada', '📋');
        }
    });
}

function abrirRutinaEnWhatsAppApp() {
    var lista = obtenerMensajesWhatsAppActualesTrainer();
    if (lista.length === 0) return;
    var texto = lista.join('\n\n');
    var url = 'https://wa.me/?text=' + encodeURIComponent(texto);
    window.open(url, '_blank', 'noopener,noreferrer');
}


function alCambiarAlumnoRutinaTrainer(alumnoId) {
    ALUMNO_RUTINA_TRAINER_SELECCIONADO = alumnoId || '';
    if (alumnoId) {
        var al = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === alumnoId; });
        if (al && al.genero) {
            PERFIL_TRAINER_ALEATORIA_ACTIVO = (al.genero === 'Femenino' ? 'mujer' : 'hombre');
            PERFIL_SETTINGS_SPLIT_ACTIVO = PERFIL_TRAINER_ALEATORIA_ACTIVO;
        }
    }
    RUTINA_TRAINER_GENERADA = null;
    RUTINA_TRAINER_META = null;
    renderizarSubAppTrainer();
}

function cambiarPerfilRutinaTrainer(perfil) {
    PERFIL_TRAINER_ALEATORIA_ACTIVO = perfil || 'hombre';
    PERFIL_SETTINGS_SPLIT_ACTIVO = PERFIL_TRAINER_ALEATORIA_ACTIVO;
    RUTINA_TRAINER_GENERADA = null;
    RUTINA_TRAINER_META = null;
    renderizarSubAppTrainer();
}

function mostrarSubvistaTrainerAleatoria(sub) {
    SUBVISTA_TRAINER_ALEATORIA = sub;
    renderizarSubAppTrainer();
}

function generarRutinaAleatoriaTrainer() {
    var perfil = PERFIL_TRAINER_ALEATORIA_ACTIVO || 'hombre';
    var split = obtenerSplitSemanalActual(perfil);
    var diaIdx = obtenerDiaRutinaTrainerActivoIdx();
    var resolucion = resolverGruposObjetivoParaDiaAleatoria(split, diaIdx);
    var gruposObjetivo = resolucion.grupos;

    var resultado = construirRutinaAleatoriaPorGrupos(gruposObjetivo, 6);
    if (!resultado.seleccionados || resultado.seleccionados.length === 0) {
        RUTINA_TRAINER_GENERADA = null;
        RUTINA_TRAINER_META = null;
        alert("No se encontraron ejercicios disponibles para los grupos (" + gruposObjetivo.join(', ') + ").");
        renderizarSubAppTrainer();
        return;
    }

    RUTINA_TRAINER_META = {
        diaIdx: diaIdx,
        diaNombre: resolucion.diaNombre,
        gruposUsados: gruposObjetivo,
        fueSorteoDescanso: resolucion.fueSorteoDescanso
    };
    RUTINA_TRAINER_GENERADA = resultado.seleccionados;
    renderizarSubAppTrainer();
}

function reRollearEjercicioTrainer(idx) {
    if (!RUTINA_TRAINER_GENERADA || !RUTINA_TRAINER_GENERADA[idx]) return;

    var perfil = PERFIL_TRAINER_ALEATORIA_ACTIVO || 'hombre';
    var split = obtenerSplitSemanalActual(perfil);
    var diaIdx = (RUTINA_TRAINER_META && typeof RUTINA_TRAINER_META.diaIdx === 'number') ? RUTINA_TRAINER_META.diaIdx : obtenerDiaRutinaTrainerActivoIdx();
    var gruposObjetivo = (RUTINA_TRAINER_META && Array.isArray(RUTINA_TRAINER_META.gruposUsados) && RUTINA_TRAINER_META.gruposUsados.length > 0)
        ? RUTINA_TRAINER_META.gruposUsados
        : resolverGruposObjetivoParaDiaAleatoria(split, diaIdx).grupos;

    var grupoActual = (typeof resolverGrupoAsignadoEjercicio === 'function')
        ? resolverGrupoAsignadoEjercicio(RUTINA_TRAINER_GENERADA[idx], gruposObjetivo)
        : (RUTINA_TRAINER_GENERADA[idx].grupoAsignado || RUTINA_TRAINER_GENERADA[idx].musculoPrincipal || 'este grupo muscular');
    var sustituto = elegirSustitutoEjercicioAleatorio(RUTINA_TRAINER_GENERADA, idx, gruposObjetivo);
    if (sustituto) {
        RUTINA_TRAINER_GENERADA[idx] = sustituto;
        renderizarSubAppTrainer();
    } else {
        alert("No hay más ejercicios distintos de " + grupoActual + " disponibles en el catálogo.");
    }
}

function registrarEnfoqueEstructuradoTrainer(opts) {
    asegurarEstructuraTrainer();
    var nombre = (opts.nombre || 'Rutina Personalizada').trim();
    var ejs = clonarEjerciciosConEstadoTrainer(opts.ejercicios || [], !!opts.preservarChecks);
    var grupos = (Array.isArray(opts.gruposUsados) && opts.gruposUsados.length > 0)
        ? opts.gruposUsados.slice()
        : resolverGruposDeEjerciciosTrainer(ejs, nombre);
    var ahora = Date.now();
    var fechaISO = opts.fechaISO || obtenerFechaHoyISOTrainer();
    var fechaStr = opts.fechaAsignacion || new Date().toLocaleDateString('es-ES');
    var diaSemana = opts.diaSemana || DIAS_SEMANA_NOMBRES[obtenerDiaSemanaActualIdx()];
    var descAuto = "Rutina estructurada de " + ejs.length + " ejercicios: " + ejs.map(function(e) { return e.nombre; }).join(', ');

    var lista = APP_STATE.subappTrainer.rutinasEnfoques || [];
    var existente = null;
    if (opts.rutinaAsignadaId) {
        existente = lista.find(function(e) { return e.rutinaAsignadaId && e.rutinaAsignadaId === opts.rutinaAsignadaId; });
    }
    if (!existente && opts.enfoqueId) {
        existente = lista.find(function(e) { return e.id === opts.enfoqueId; });
    }
    if (!existente && opts.dedupeByNameAndAthlete) {
        existente = lista.find(function(e) {
            return (e.nombre || '').toLowerCase().trim() === nombre.toLowerCase() &&
                String(e.alumnoId || '') === String(opts.alumnoId || '');
        });
    }

    if (existente) {
        existente.nombre = nombre;
        existente.precio = opts.precio !== undefined ? opts.precio : (existente.precio || 15);
        existente.tiempoMin = opts.tiempoMin || existente.tiempoMin || 60;
        existente.descripcion = opts.descripcion || descAuto;
        existente.origen = opts.origen || existente.origen || 'aleatoria';
        existente.alumnoId = opts.alumnoId !== undefined ? opts.alumnoId : (existente.alumnoId || null);
        existente.alumnoNombre = opts.alumnoNombre || existente.alumnoNombre || '';
        existente.fechaAsignacion = fechaStr;
        existente.fechaISO = fechaISO;
        existente.diaSemana = diaSemana;
        existente.gruposUsados = grupos;
        if (opts.rutinaAsignadaId) existente.rutinaAsignadaId = opts.rutinaAsignadaId;
        if (ejs.length > 0) existente.ejercicios = ejs;
        existente.updatedAt = ahora;
        return existente;
    }

    var nuevoEnfoque = {
        id: "ENF-" + ahora + "-" + Math.floor(Math.random() * 900 + 100),
        nombre: nombre,
        precio: opts.precio !== undefined ? opts.precio : 15,
        tiempoMin: opts.tiempoMin || 60,
        descripcion: opts.descripcion || descAuto,
        origen: opts.origen || 'aleatoria',
        alumnoId: opts.alumnoId || null,
        alumnoNombre: opts.alumnoNombre || '',
        fechaAsignacion: fechaStr,
        fechaISO: fechaISO,
        diaSemana: diaSemana,
        gruposUsados: grupos,
        rutinaAsignadaId: opts.rutinaAsignadaId || null,
        ejercicios: ejs,
        timestamp: ahora,
        updatedAt: ahora
    };
    APP_STATE.subappTrainer.rutinasEnfoques.unshift(nuevoEnfoque);
    return nuevoEnfoque;
}

function asignarRutinaGeneradaAAlumnoTrainer() {
    if (!RUTINA_TRAINER_GENERADA || RUTINA_TRAINER_GENERADA.length === 0) {
        alert("Primero genera una rutina de entrenamiento.");
        return;
    }
    asegurarEstructuraTrainer();
    var alumnos = APP_STATE.subappTrainer.alumnos || [];

    var alumnoId = ALUMNO_RUTINA_TRAINER_SELECCIONADO;
    var alumno = null;
    if (alumnoId) {
        alumno = alumnos.find(function(a) { return a.id === alumnoId; });
    }

    if (!alumno) {
        if (alumnos.length === 0) {
            alert("No tienes alumnos registrados aún. Crea un alumno desde el Catálogo de Alumnos para asignarle rutinas.");
            return;
        }
        var nombresLista = alumnos.map(function(a, i) { return (i + 1) + ". " + a.nombre; }).join("\n");
        var selIdx = prompt("Selecciona el número del alumno al que deseas asignar esta rutina:\n\n" + nombresLista);
        if (!selIdx) return;
        var idxNum = parseInt(selIdx, 10) - 1;
        if (isNaN(idxNum) || !alumnos[idxNum]) {
            alert("Selección inválida.");
            return;
        }
        alumno = alumnos[idxNum];
        ALUMNO_RUTINA_TRAINER_SELECCIONADO = alumno.id;
    }

    var hoyNombre = (RUTINA_TRAINER_META && RUTINA_TRAINER_META.diaNombre)
        ? RUTINA_TRAINER_META.diaNombre
        : DIAS_SEMANA_NOMBRES[obtenerDiaRutinaTrainerActivoIdx()];
    var d = new Date();
    var fechaStr = d.toLocaleDateString('es-ES');
    var nombreDefecto = "Rutina " + hoyNombre + " - " + alumno.nombre + " (" + fechaStr + ")";
    var nombreFinal = prompt("Nombre de la rutina asignada para " + alumno.nombre + ":", nombreDefecto);
    if (!nombreFinal || !nombreFinal.trim()) return;

    if (!Array.isArray(alumno.rutinasAsignadas)) alumno.rutinasAsignadas = [];

    var grupos = (RUTINA_TRAINER_META && Array.isArray(RUTINA_TRAINER_META.gruposUsados) && RUTINA_TRAINER_META.gruposUsados.length > 0)
        ? RUTINA_TRAINER_META.gruposUsados.slice()
        : resolverGruposDeEjerciciosTrainer(RUTINA_TRAINER_GENERADA, hoyNombre);

    var nuevaRutinaAsignada = {
        id: "RUT-ASIG-" + Date.now(),
        nombre: nombreFinal.trim(),
        fechaAsignacion: fechaStr,
        fechaISO: obtenerFechaHoyISOTrainer(),
        timestamp: Date.now(),
        updatedAt: Date.now(),
        diaSemana: hoyNombre,
        gruposUsados: grupos,
        ejercicios: clonarEjerciciosConEstadoTrainer(RUTINA_TRAINER_GENERADA, false)
    };

    alumno.rutinasAsignadas.unshift(nuevaRutinaAsignada);

    var enfCreado = registrarEnfoqueEstructuradoTrainer({
        nombre: nombreFinal.trim(),
        precio: parseFloat(alumno.tarifaHabitual) || 15,
        tiempoMin: 60,
        origen: 'aleatoria',
        alumnoId: alumno.id,
        alumnoNombre: alumno.nombre,
        fechaAsignacion: fechaStr,
        fechaISO: nuevaRutinaAsignada.fechaISO,
        diaSemana: hoyNombre,
        gruposUsados: grupos,
        rutinaAsignadaId: nuevaRutinaAsignada.id,
        ejercicios: nuevaRutinaAsignada.ejercicios,
        dedupeByNameAndAthlete: true
    });

    SESION_ACTIVA_DETALLE_ID = '';
    ENFOQUE_DETALLE_ABIERTO_ID = enfCreado.id;
    ENFOQUE_DETALLE_CERRADO_MANUAL = false;
    TAB_TRAINER_ACTIVA = 'enfoques';

    MonarcaDB.save(APP_STATE);
    renderizarSubAppTrainer();
    alert("✓ ¡Rutina '" + nuevaRutinaAsignada.nombre + "' asignada a " + alumno.nombre + " y agregada en Enfoques!\n\nPresiona '🏋️‍♂️ Iniciar Rutina' cuando desees ponerla a rodar.");
}

function iniciarEntrenamientoConRutinaTrainer() {
    if (!RUTINA_TRAINER_GENERADA || RUTINA_TRAINER_GENERADA.length === 0) {
        alert("Primero genera una rutina de entrenamiento.");
        return;
    }
    asegurarEstructuraTrainer();
    var alumnos = APP_STATE.subappTrainer.alumnos || [];

    var alumnoId = ALUMNO_RUTINA_TRAINER_SELECCIONADO;
    var alumno = null;
    if (alumnoId) {
        alumno = alumnos.find(function(a) { return a.id === alumnoId; });
    }

    var alumnoNombre = alumno ? alumno.nombre : 'Atleta';
    var hoyNombre = (RUTINA_TRAINER_META && RUTINA_TRAINER_META.diaNombre)
        ? RUTINA_TRAINER_META.diaNombre
        : DIAS_SEMANA_NOMBRES[obtenerDiaRutinaTrainerActivoIdx()];
    var fechaStr = new Date().toLocaleDateString('es-ES');
    var fechaISO = obtenerFechaHoyISOTrainer();
    var nombreRutina = alumno
        ? ("Rutina " + hoyNombre + " · " + alumno.nombre + " (" + fechaStr + ")")
        : ("Rutina " + hoyNombre + " (" + (RUTINA_TRAINER_GENERADA.length) + " ej.)");
    var grupos = (RUTINA_TRAINER_META && Array.isArray(RUTINA_TRAINER_META.gruposUsados) && RUTINA_TRAINER_META.gruposUsados.length > 0)
        ? RUTINA_TRAINER_META.gruposUsados.slice()
        : resolverGruposDeEjerciciosTrainer(RUTINA_TRAINER_GENERADA, hoyNombre);
    var ejs = clonarEjerciciosConEstadoTrainer(RUTINA_TRAINER_GENERADA, false);

    var rutinaAsigId = null;
    if (alumno) {
        if (!Array.isArray(alumno.rutinasAsignadas)) alumno.rutinasAsignadas = [];
        rutinaAsigId = "RUT-ASIG-" + Date.now();
        alumno.rutinasAsignadas.unshift({
            id: rutinaAsigId,
            nombre: nombreRutina,
            fechaAsignacion: fechaStr,
            fechaISO: fechaISO,
            timestamp: Date.now(),
            updatedAt: Date.now(),
            diaSemana: hoyNombre,
            gruposUsados: grupos,
            ejercicios: clonarEjerciciosConEstadoTrainer(ejs, false)
        });
    }

    var enfCreado = registrarEnfoqueEstructuradoTrainer({
        nombre: nombreRutina,
        precio: alumno && alumno.tarifaHabitual ? parseFloat(alumno.tarifaHabitual) : 15,
        tiempoMin: 60,
        origen: 'aleatoria',
        alumnoId: alumno ? alumno.id : null,
        alumnoNombre: alumnoNombre,
        fechaAsignacion: fechaStr,
        fechaISO: fechaISO,
        diaSemana: hoyNombre,
        gruposUsados: grupos,
        rutinaAsignadaId: rutinaAsigId,
        ejercicios: ejs,
        dedupeByNameAndAthlete: true
    });

    crearSesionActivaTrainer({
        alumnoId: alumno ? alumno.id : null,
        alumnoNombre: alumnoNombre,
        enfoqueId: enfCreado.id,
        enfoqueNombre: enfCreado.nombre,
        rutinaAsignadaId: rutinaAsigId,
        gruposUsados: grupos,
        ejercicios: ejs
    });

    MonarcaDB.save(APP_STATE);
    iniciarIntervaloTimerTrainer();
    setTabTrainer('enfoques');
    alert("🏋️‍♂️ ¡Rutina iniciada en vivo para " + alumnoNombre + "!\nYa aparece rodando dentro de Enfoques junto con sus grupos musculares y ejercicios.");
}

function guardarRutinaTrainerComoEnfoque() {
    if (!RUTINA_TRAINER_GENERADA || RUTINA_TRAINER_GENERADA.length === 0) {
        alert("Primero genera una rutina.");
        return;
    }
    asegurarEstructuraTrainer();
    var alumnos = APP_STATE.subappTrainer.alumnos || [];
    var alumno = ALUMNO_RUTINA_TRAINER_SELECCIONADO
        ? alumnos.find(function(a) { return a.id === ALUMNO_RUTINA_TRAINER_SELECCIONADO; })
        : null;

    var hoyNombre = (RUTINA_TRAINER_META && RUTINA_TRAINER_META.diaNombre)
        ? RUTINA_TRAINER_META.diaNombre
        : DIAS_SEMANA_NOMBRES[obtenerDiaRutinaTrainerActivoIdx()];
    var fechaStr = new Date().toLocaleDateString('es-ES');
    var nombreDef = alumno
        ? ("Rutina " + hoyNombre + " - " + alumno.nombre + " (" + fechaStr + ")")
        : ("Rutina " + hoyNombre + " (" + (PERFIL_TRAINER_ALEATORIA_ACTIVO === 'mujer' ? 'Mujer' : 'Hombre') + ") - " + fechaStr);
    var nombre = prompt("Nombre para guardar esta rutina en el catálogo de Enfoques del Trainer:", nombreDef);
    if (!nombre || !nombre.trim()) return;

    var grupos = (RUTINA_TRAINER_META && Array.isArray(RUTINA_TRAINER_META.gruposUsados) && RUTINA_TRAINER_META.gruposUsados.length > 0)
        ? RUTINA_TRAINER_META.gruposUsados.slice()
        : resolverGruposDeEjerciciosTrainer(RUTINA_TRAINER_GENERADA, hoyNombre);
    var ejs = clonarEjerciciosConEstadoTrainer(RUTINA_TRAINER_GENERADA, false);

    var rutinaAsigId = null;
    if (alumno) {
        if (!Array.isArray(alumno.rutinasAsignadas)) alumno.rutinasAsignadas = [];
        rutinaAsigId = "RUT-ASIG-" + Date.now();
        alumno.rutinasAsignadas.unshift({
            id: rutinaAsigId,
            nombre: nombre.trim(),
            fechaAsignacion: fechaStr,
            fechaISO: obtenerFechaHoyISOTrainer(),
            timestamp: Date.now(),
            updatedAt: Date.now(),
            diaSemana: hoyNombre,
            gruposUsados: grupos,
            ejercicios: clonarEjerciciosConEstadoTrainer(ejs, false)
        });
    }

    var nuevoEnfoque = registrarEnfoqueEstructuradoTrainer({
        nombre: nombre.trim(),
        precio: alumno && alumno.tarifaHabitual ? parseFloat(alumno.tarifaHabitual) : 15,
        tiempoMin: 60,
        origen: 'aleatoria',
        alumnoId: alumno ? alumno.id : null,
        alumnoNombre: alumno ? alumno.nombre : '',
        fechaAsignacion: fechaStr,
        fechaISO: obtenerFechaHoyISOTrainer(),
        diaSemana: hoyNombre,
        gruposUsados: grupos,
        rutinaAsignadaId: rutinaAsigId,
        ejercicios: ejs,
        dedupeByNameAndAthlete: true
    });

    SESION_ACTIVA_DETALLE_ID = '';
    ENFOQUE_DETALLE_ABIERTO_ID = nuevoEnfoque.id;
    ENFOQUE_DETALLE_CERRADO_MANUAL = false;
    TAB_TRAINER_ACTIVA = 'enfoques';

    MonarcaDB.save(APP_STATE);
    alert("✓ Rutina '" + nuevoEnfoque.nombre + "' agregada al apartado de Enfoques.");
    renderizarSubAppTrainer();
}

function iniciarEntrenamientoConRutinaAsignada(alumnoId, rIdx) {
    asegurarEstructuraTrainer();
    var al = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === alumnoId; });
    if (!al || !al.rutinasAsignadas || !al.rutinasAsignadas[rIdx]) return;

    var r = al.rutinasAsignadas[rIdx];
    cerrarModalFichaAlumnoTrainer();

    var ejs = Array.isArray(r.ejercicios) ? r.ejercicios : [];
    var grupos = (Array.isArray(r.gruposUsados) && r.gruposUsados.length > 0)
        ? r.gruposUsados.slice()
        : resolverGruposDeEjerciciosTrainer(ejs, r.nombre);

    var enf = registrarEnfoqueEstructuradoTrainer({
        nombre: r.nombre,
        precio: parseFloat(al.tarifaHabitual) || 15,
        tiempoMin: 60,
        origen: 'aleatoria',
        alumnoId: al.id,
        alumnoNombre: al.nombre,
        fechaAsignacion: r.fechaAsignacion || new Date().toLocaleDateString('es-ES'),
        fechaISO: r.fechaISO || obtenerFechaHoyISOTrainer(),
        diaSemana: r.diaSemana || DIAS_SEMANA_NOMBRES[obtenerDiaSemanaActualIdx()],
        gruposUsados: grupos,
        rutinaAsignadaId: r.id,
        ejercicios: ejs,
        preservarChecks: true,
        dedupeByNameAndAthlete: true
    });

    crearSesionActivaTrainer({
        alumnoId: al.id,
        alumnoNombre: al.nombre,
        enfoqueId: enf.id,
        enfoqueNombre: enf.nombre,
        rutinaAsignadaId: r.id,
        gruposUsados: grupos,
        ejercicios: ejs
    });

    MonarcaDB.save(APP_STATE);
    iniciarIntervaloTimerTrainer();
    setTabTrainer('enfoques');
    alert("🏋️‍♂️ Sesión de entrenamiento iniciada en vivo para " + al.nombre + " con la rutina '" + r.nombre + "'.");
}

function eliminarRutinaAsignadaTrainer(alumnoId, rIdx) {
    if (!confirm("¿Deseas eliminar esta rutina asignada?")) return;
    var al = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === alumnoId; });
    if (!al || !al.rutinasAsignadas) return;
    al.rutinasAsignadas.splice(rIdx, 1);
    MonarcaDB.save(APP_STATE);
    verFichaAlumnoTrainer(alumnoId);
}

function irAGeneradorParaAlumnoTrainer(alumnoId) {
    cerrarModalFichaAlumnoTrainer();
    ALUMNO_RUTINA_TRAINER_SELECCIONADO = alumnoId;
    var al = (APP_STATE.subappTrainer.alumnos || []).find(function(a) { return a.id === alumnoId; });
    if (al && al.genero) {
        PERFIL_TRAINER_ALEATORIA_ACTIVO = (al.genero === 'Femenino' ? 'mujer' : 'hombre');
        PERFIL_SETTINGS_SPLIT_ACTIVO = PERFIL_TRAINER_ALEATORIA_ACTIVO;
    }
    setTabTrainer('aleatoria');
}

function renderizarHtmlSettingsSplitTrainer() {
    var perfil = PERFIL_SETTINGS_SPLIT_ACTIVO || 'hombre';
    var split = obtenerSplitSemanalActual(perfil);
    var diaActualIdx = obtenerDiaSemanaActualIdx();

    var html = `
    <div class="trainer-panel-clean" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
            <button type="button" class="trainer-btn-secondary" onclick="mostrarSubvistaTrainerAleatoria('generador')">
                <span>◀</span> Volver a Rutina
            </button>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <div class="toggle-perfil-split-box">
                    <button type="button" class="btn-toggle-perfil-split ${perfil === 'hombre' ? 'active' : ''}" onclick="cambiarPerfilSettingsSplitTrainer('hombre')">
                        👨 Hombre
                    </button>
                    <button type="button" class="btn-toggle-perfil-split ${perfil === 'mujer' ? 'active' : ''}" onclick="cambiarPerfilSettingsSplitTrainer('mujer')">
                        👩 Mujer
                    </button>
                </div>
                <button type="button" class="trainer-btn-secondary" onclick="restablecerSplitDefaultTrainer()" title="Restablecer grupos predeterminados" style="padding: 7px 11px;">
                    🔄 Restablecer
                </button>
            </div>
        </div>

        <div style="background: #182238; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 14px; padding: 13px 16px; margin-bottom: 14px;">
            <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #f8fafc; font-weight: 800;">⚙️ Settings · Grupos Musculares por Día</h3>
            <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.45;">
                Selecciona los músculos que entrenas cada día. Si pides una rutina en un día marcado como <strong>Descanso</strong>, se elegirán grupos musculares al azar entre los configurados aquí.
            </p>
        </div>

        <!-- Grilla interactiva semanal Lunes-Domingo -->
        <div class="training-split-grid">
    `;

    split.forEach(function(item, idx) {
        var esHoy = (idx === diaActualIdx);
        var esDescanso = !!item.descanso;
        var grupos = item.grupos || [];

        var chipsHtml = GRUPOS_MUSCULARES_SPLIT.map(function(m) {
            var activo = !esDescanso && grupos.includes(m);
            return `<span class="split-muscle-chip ${activo ? 'active' : ''}" onclick="toggleMusculoDiaSplitTrainer(${idx}, '${m}')">${m}</span>`;
        }).join('');

        html += `
        <div class="split-day-card ${esHoy ? 'today' : ''} ${esDescanso ? 'is-rest' : ''}">
            <div class="split-day-header">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <strong style="color: #ffffff; font-size: 14.5px;">${item.dia}</strong>
                    ${esHoy ? '<span style="font-size: 10px; font-weight: 800; background: #38bdf8; color: #080a0f; padding: 1px 6px; border-radius: 5px;">HOY</span>' : ''}
                    ${!esDescanso ? `<span style="font-size: 10px; font-weight: 800; background: rgba(16, 185, 129, 0.16); color: #6ee7b7; padding: 1px 6px; border-radius: 5px;">${grupos.length} grp</span>` : ''}
                </div>
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 700; color: ${esDescanso ? '#fcd34d' : '#cbd5e1'}; user-select: none;">
                    <input type="checkbox" ${esDescanso ? 'checked' : ''} onchange="toggleDescansoDiaSplitTrainer(${idx})" style="cursor: pointer; accent-color: #f59e0b; width: 15px; height: 15px;">
                    <span>Descanso</span>
                </label>
            </div>
            <div>
                <span style="font-size: 11px; color: ${esDescanso ? '#fcd34d' : '#7dd3fc'}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; display: block; margin-bottom: 7px;">
                    ${esDescanso ? '🏖️ Día de Descanso (Toca un músculo para activarlo o sortea al generar):' : '💪 Grupos Musculares:'}
                </span>
                <div class="split-chips-container">
                    ${chipsHtml}
                </div>
            </div>
        </div>`;
    });

    html += `
        </div>
    </div>
    `;

    return html;
}

function cambiarPerfilSettingsSplitTrainer(perfil) {
    PERFIL_SETTINGS_SPLIT_ACTIVO = perfil || 'hombre';
    renderizarSubAppTrainer();
}

function toggleDescansoDiaSplitTrainer(diaIdx) {
    var perfil = PERFIL_SETTINGS_SPLIT_ACTIVO || 'hombre';
    var split = obtenerSplitSemanalActual(perfil);
    if (!split[diaIdx]) return;
    split[diaIdx].descanso = !split[diaIdx].descanso;
    guardarSplitSemanalActual(perfil, split);
    RUTINA_TRAINER_GENERADA = null;
    RUTINA_TRAINER_META = null;
    renderizarSubAppTrainer();
}

function toggleMusculoDiaSplitTrainer(diaIdx, musculo) {
    var perfil = PERFIL_SETTINGS_SPLIT_ACTIVO || 'hombre';
    var split = obtenerSplitSemanalActual(perfil);
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
    guardarSplitSemanalActual(perfil, split);
    RUTINA_TRAINER_GENERADA = null;
    RUTINA_TRAINER_META = null;
    renderizarSubAppTrainer();
}

function restablecerSplitDefaultTrainer() {
    var perfil = PERFIL_SETTINGS_SPLIT_ACTIVO || 'hombre';
    if (!confirm("¿Deseas restablecer el Split Semanal por defecto para el perfil " + (perfil === 'mujer' ? 'Mujer' : 'Hombre') + "?")) {
        return;
    }
    var def = JSON.parse(JSON.stringify(SPLIT_SEMANAL_DEFAULT[perfil] || SPLIT_SEMANAL_DEFAULT.hombre));
    guardarSplitSemanalActual(perfil, def);
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
            html += `<span class="chip-enfoque-select" onclick="seleccionarChipEnfoqueTrainer('iniciar', '${r.id}', ${r.precio || 15})">${nomEsc}</span>`;
        });
        contIniciar.innerHTML = html;
    }

    var contFin = document.getElementById('chips-enfoques-finalizar');
    if (contFin) {
        var html2 = '';
        rutinas.forEach(function(r) {
            var nomEsc = escapeHtmlTrainer(r.nombre);
            html2 += `<span class="chip-enfoque-select" onclick="seleccionarChipEnfoqueTrainer('finalizar', '${r.id}', ${r.precio || 15})">${nomEsc}</span>`;
        });
        contFin.innerHTML = html2;
    }
}

function seleccionarChipEnfoqueTrainer(modalContext, enfoqueIdONombre, precio) {
    var enfObj = (APP_STATE.subappTrainer.rutinasEnfoques || []).find(function(r) {
        return r.id === enfoqueIdONombre || r.nombre === enfoqueIdONombre;
    });
    var nombreReal = enfObj ? enfObj.nombre : enfoqueIdONombre;
    var precioReal = enfObj && enfObj.precio !== undefined ? (parseFloat(enfObj.precio) || 0) : (parseFloat(precio) || 15);

    if (modalContext === 'iniciar') {
        ENFOQUE_MODAL_INICIAR_ID = enfObj ? enfObj.id : '';
        var inEnf = document.getElementById('input-iniciar-entrenamiento-enfoque');
        if (inEnf) inEnf.value = nombreReal;
    } else if (modalContext === 'finalizar') {
        var inEnfFin = document.getElementById('fin-entrenamiento-input-enfoque');
        var inCobro = document.getElementById('fin-entrenamiento-input-cobro');
        if (inEnfFin) inEnfFin.value = nombreReal;
        if (inCobro && (!inCobro.value || parseFloat(inCobro.value) === 0)) {
            inCobro.value = precioReal.toFixed(2);
        }
    }
}

function abrirModalIniciarEntrenamiento(alumnoIdPreseleccionado, enfoquePreseleccionado, enfoqueIdPreseleccionado) {
    asegurarEstructuraTrainer();
    var modal = document.getElementById('modal-iniciar-entrenamiento-trainer');
    if (!modal) return;

    ENFOQUE_MODAL_INICIAR_ID = enfoqueIdPreseleccionado || '';
    if (!ENFOQUE_MODAL_INICIAR_ID && enfoquePreseleccionado) {
        var enfFound = (APP_STATE.subappTrainer.rutinasEnfoques || []).find(function(e) {
            return (e.nombre || '').toLowerCase().trim() === String(enfoquePreseleccionado).toLowerCase().trim();
        });
        if (enfFound) ENFOQUE_MODAL_INICIAR_ID = enfFound.id;
    }

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
    ENFOQUE_MODAL_INICIAR_ID = '';
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

    var rutinas = APP_STATE.subappTrainer.rutinasEnfoques || [];
    var enfMatched = ENFOQUE_MODAL_INICIAR_ID
        ? rutinas.find(function(r) { return r.id === ENFOQUE_MODAL_INICIAR_ID; })
        : null;
    if (!enfMatched) {
        var enfLow = enfoque.toLowerCase().trim();
        enfMatched = rutinas.find(function(r) { return (r.nombre || '').toLowerCase().trim() === enfLow; }) || null;
    }

    var ejs = enfMatched ? resolverEjerciciosDeEnfoqueTrainer(enfMatched) : [];
    var grupos = enfMatched ? resolverGruposDeEnfoqueTrainer(enfMatched) : resolverGruposDeEjerciciosTrainer([], enfoque);

    crearSesionActivaTrainer({
        alumnoId: alumnoId || null,
        alumnoNombre: alumnoNombre,
        enfoqueId: enfMatched ? enfMatched.id : null,
        enfoqueNombre: enfMatched ? enfMatched.nombre : enfoque,
        rutinaAsignadaId: enfMatched ? (enfMatched.rutinaAsignadaId || null) : null,
        gruposUsados: grupos,
        ejercicios: ejs
    });

    MonarcaDB.save(APP_STATE);
    cerrarModalIniciarEntrenamiento();
    iniciarIntervaloTimerTrainer();
    TAB_TRAINER_ACTIVA = 'enfoques';
    renderizarSubAppTrainer();
}

function descartarTimerEntrenamiento(sesionId) {
    if (!confirm("¿Deseas descartar el cronómetro de esta sesión en curso? Los datos no se guardarán.")) return;
    asegurarEstructuraTrainer();
    var activas = APP_STATE.subappTrainer.sesionesActivas || [];
    var target = sesionId
        ? activas.find(function(s) { return s.id === sesionId; })
        : activas[0];
    var targetId = target ? target.id : sesionId;

    if (targetId) {
        registrarTombstone('subappTrainer_sesionesActivas', targetId);
        APP_STATE.subappTrainer.sesionesActivas = activas.filter(function(s) { return s.id !== targetId; });
    }
    APP_STATE.subappTrainer.timerActivo = APP_STATE.subappTrainer.sesionesActivas[0] || null;
    if (SESION_ACTIVA_DETALLE_ID === targetId) {
        SESION_ACTIVA_DETALLE_ID = APP_STATE.subappTrainer.sesionesActivas[0] ? APP_STATE.subappTrainer.sesionesActivas[0].id : '';
    }
    if (APP_STATE.subappTrainer.sesionesActivas.length === 0 && INTERVALO_TIMER_TRAINER) {
        clearInterval(INTERVALO_TIMER_TRAINER);
        INTERVALO_TIMER_TRAINER = null;
    }
    MonarcaDB.save(APP_STATE);
    renderizarSubAppTrainer();
}

function pararTimerEntrenamiento(sesionId) {
    asegurarEstructuraTrainer();
    var activas = APP_STATE.subappTrainer.sesionesActivas || [];
    var timer = sesionId
        ? activas.find(function(s) { return s.id === sesionId; })
        : activas[0];
    if (!timer) return;

    var ahora = Date.now();
    var segundosTotales = Math.max(1, Math.floor((ahora - timer.inicioTimestamp) / 1000));
    var minutosTotales = Math.max(1, Math.round(segundosTotales / 60));

    ENTRENAMIENTO_TEMPORAL_FINALIZANDO = {
        sesionActivaId: timer.id,
        segundos: segundosTotales,
        minutos: minutosTotales,
        alumnoId: timer.alumnoId,
        alumnoNombre: timer.alumnoNombre,
        enfoqueId: timer.enfoqueId || null,
        enfoque: timer.enfoque,
        rutinaAsignadaId: timer.rutinaAsignadaId || null,
        ejercicios: Array.isArray(timer.ejercicios) ? clonarEjerciciosConEstadoTrainer(timer.ejercicios, true) : []
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
    } else if (timer.enfoqueId || timer.enfoque) {
        var enf = (APP_STATE.subappTrainer.rutinasEnfoques || []).find(function(e) {
            return (timer.enfoqueId && e.id === timer.enfoqueId) || (e.nombre || '').toLowerCase() === (timer.enfoque || '').toLowerCase();
        });
        if (enf && enf.precio !== undefined) cobroSugerido = parseFloat(enf.precio);
    }
    if (inCobro) inCobro.value = (isNaN(cobroSugerido) ? 15.00 : cobroSugerido).toFixed(2);

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

    var ejsFin = Array.isArray(ENTRENAMIENTO_TEMPORAL_FINALIZANDO.ejercicios)
        ? ENTRENAMIENTO_TEMPORAL_FINALIZANDO.ejercicios
        : [];
    var ejsHechosFin = ejsFin.filter(function(e) { return !!e.completado; }).length;

    var nuevoEntrenamiento = {
        id: 'ENT-' + Date.now(),
        fecha: fechaHoyStr,
        timestamp: Date.now(),
        alumnoId: alumnoId,
        alumnoNombre: alumnoNombre,
        enfoque: enfoque,
        enfoqueId: ENTRENAMIENTO_TEMPORAL_FINALIZANDO.enfoqueId || null,
        duracionMinutos: duracionMinutos,
        ejerciciosCompletados: ejsHechosFin,
        ejerciciosTotal: ejsFin.length,
        cobro: cobro,
        registradoEnFinanzas: checkFin ? checkFin.checked : true
    };

    APP_STATE.subappTrainer.sesiones.unshift(nuevoEntrenamiento);

    // 1. Integración automática con Finanzas (Entrada Fija Mensual como solicitó el usuario)
    if (checkFin && checkFin.checked && cobro > 0) {
        if (!APP_STATE.finanzas) APP_STATE.finanzas = { ingresos: [], gastos: [] };
        if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];

        var nuevoIngreso = {
            id: 'ING-TRAINER-' + Date.now(),
            fuente: 'Personal Trainer - ' + alumnoNombre + ' (' + enfoque + ')',
            descripcion: 'Personal Trainer - ' + alumnoNombre + ' (' + enfoque + ')',
            monto: cobro,
            fecha: fechaHoyStr,
            dia: new Date().getDate(),
            tipo: 'fija', // Entrada Fija Mensual
            origen: 'labor',
            origenLabor: 'LAB-TRAINER',
            categoria: '💼 Labores & Servicios',
            cobrado: true,
            montoCobrado: cobro,
            fechaCobro: new Date().toISOString()
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
        regHoy.horas = parseFloat(((parseFloat(regHoy.horas || regHoy.horasTrabajadas) || 0) + horasSesion).toFixed(2));
        regHoy.horasTrabajadas = regHoy.horas;
        regHoy.ingresoCalculado = parseFloat(((parseFloat(regHoy.ingresoCalculado || regHoy.honorarios) || 0) + cobro).toFixed(2));
        regHoy.honorarios = regHoy.ingresoCalculado;
        var notaEnt = alumnoNombre + ' (' + enfoque + ', ' + duracionMinutos + ' min)';
        regHoy.notas = regHoy.notas ? (regHoy.notas + ' | ' + notaEnt) : notaEnt;
        regHoy.descripcion = regHoy.notas;
    } else {
        var nuevoRegLabor = {
            id: 'REG-LAB-' + Date.now(),
            laborId: 'LAB-TRAINER',
            fecha: fechaHoyStr,
            horas: horasSesion,
            horasTrabajadas: horasSesion,
            honorarios: cobro,
            ingresoCalculado: cobro,
            notas: 'Entrenamiento con ' + alumnoNombre + ' (' + enfoque + ', ' + duracionMinutos + ' min)',
            descripcion: 'Entrenamiento con ' + alumnoNombre + ' (' + enfoque + ', ' + duracionMinutos + ' min)'
        };
        APP_STATE.registrosLabores.unshift(nuevoRegLabor);
    }

    // 3. Otorgar EXP de Jugador
    if (typeof otorgarExpJugador === 'function') {
        var expSesion = Math.min(60, Math.max(15, Math.round(duracionMinutos * 0.6)));
        otorgarExpJugador(expSesion, 'Sesión de Coaching Trainer: ' + alumnoNombre);
    }

    // Retirar únicamente la sesión finalizada (las demás sesiones simultáneas siguen rodando)
    var finId = ENTRENAMIENTO_TEMPORAL_FINALIZANDO.sesionActivaId;
    var activasRest = APP_STATE.subappTrainer.sesionesActivas || [];
    if (finId) {
        registrarTombstone('subappTrainer_sesionesActivas', finId);
        activasRest = activasRest.filter(function(s) { return s.id !== finId; });
    } else if (activasRest.length > 0) {
        var popped = activasRest.shift();
        if (popped && popped.id) registrarTombstone('subappTrainer_sesionesActivas', popped.id);
    }
    APP_STATE.subappTrainer.sesionesActivas = activasRest;
    APP_STATE.subappTrainer.timerActivo = activasRest[0] || null;
    if (SESION_ACTIVA_DETALLE_ID === finId) {
        SESION_ACTIVA_DETALLE_ID = activasRest[0] ? activasRest[0].id : '';
    }
    ENTRENAMIENTO_TEMPORAL_FINALIZANDO = null;
    if (activasRest.length === 0 && INTERVALO_TIMER_TRAINER) {
        clearInterval(INTERVALO_TIMER_TRAINER);
        INTERVALO_TIMER_TRAINER = null;
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalFinalizarEntrenamiento();
    renderizarSubAppTrainer();
    if (typeof renderizarCalendario === 'function') renderizarCalendario();
    alert("🏋️‍♂️ ¡Entrenamiento guardado con éxito! Se sumaron " + duracionMinutos + " min a tu jornada de Personal Trainer.");
}

function eliminarEntrenamientoTrainer(entrenamientoId) {
    if (!confirm("¿Deseas eliminar este registro de entrenamiento del historial?")) return;
    asegurarEstructuraTrainer();
    registrarTombstone('subappTrainer_sesiones', entrenamientoId);
    APP_STATE.subappTrainer.sesiones = APP_STATE.subappTrainer.sesiones.filter(function(s) { return s.id !== entrenamientoId; });
    MonarcaDB.save(APP_STATE);
    renderizarSubAppTrainer();
    if (typeof renderizarCalendario === 'function') renderizarCalendario();
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

    <!-- RUTINAS ASIGNADAS AL ALUMNO -->
    <div style="margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #10b981;">Rutinas Asignadas (${(al.rutinasAsignadas || []).length})</span>
            <button type="button" class="btn-subfiltro-ej" onclick="irAGeneradorParaAlumnoTrainer('${al.id}')" style="font-size: 11px; padding: 4px 8px;">
                🎲 + Generar Nueva
            </button>
        </div>
        <div style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
            ${(!al.rutinasAsignadas || al.rutinasAsignadas.length === 0)
                ? '<div style="font-size: 12px; color: #64748b; padding: 8px; text-align: center;">Sin rutinas asignadas aún.</div>'
                : al.rutinasAsignadas.map(function(r, rIdx) {
                    return `
                    <div style="background: #07090e; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                        <div>
                            <div style="font-weight: 700; color: #f8fafc;">${escapeHtmlTrainer(r.nombre)}</div>
                            <div style="color: #94a3b8; font-size: 11px;">${(r.ejercicios || []).length} ejercicios · ${r.fechaAsignacion || ''}</div>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <button type="button" class="btn-system" onclick="iniciarEntrenamientoConRutinaAsignada('${al.id}', ${rIdx})" style="font-size: 11px; padding: 4px 8px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; font-weight: 800; border: none; border-radius: 6px; cursor: pointer;">
                                🏋️ Iniciar
                            </button>
                            <button type="button" class="btn-back-system" onclick="eliminarRutinaAsignadaTrainer('${al.id}', ${rIdx})" style="font-size: 11px; padding: 4px 7px; margin-bottom: 0; color: #f87171; border-color: rgba(239, 68, 68, 0.3); border-radius: 6px; cursor: pointer;" title="Eliminar rutina">
                                🗑️
                            </button>
                        </div>
                    </div>`;
                }).join('')}
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
    if (!confirm("¿Deseas eliminar este enfoque o rutina de Enfoques?")) return;
    asegurarEstructuraTrainer();
    registrarTombstone('subappTrainer_enfoques', enfoqueId);
    APP_STATE.subappTrainer.rutinasEnfoques = (APP_STATE.subappTrainer.rutinasEnfoques || []).filter(function(r) { return r.id !== enfoqueId; });
    (APP_STATE.subappTrainer.sesionesActivas || []).forEach(function(s) {
        if (s.enfoqueId === enfoqueId) s.enfoqueId = null;
    });
    if (ENFOQUE_DETALLE_ABIERTO_ID === enfoqueId) ENFOQUE_DETALLE_ABIERTO_ID = '';
    MonarcaDB.save(APP_STATE);
    renderizarSubAppTrainer();
}

function vaciarTodosEnfoquesTrainer() {
    asegurarEstructuraTrainer();
    var lista = APP_STATE.subappTrainer.rutinasEnfoques || [];
    if (lista.length === 0) return;
    if (!confirm("¿Deseas vaciar todas las rutinas del apartado Enfoques? Solo volverán a aparecer las nuevas que asignes o inicies en tu horario.")) return;
    lista.forEach(function(r) {
        if (r && r.id) registrarTombstone('subappTrainer_enfoques', r.id);
    });
    APP_STATE.subappTrainer.rutinasEnfoques = [];
    (APP_STATE.subappTrainer.sesionesActivas || []).forEach(function(s) {
        s.enfoqueId = null;
    });
    ENFOQUE_DETALLE_ABIERTO_ID = '';
    FILTRO_ENFOQUE_TRAINER = 'todas';
    MOSTRAR_CATALOGO_COMPLETO_ENFOQUES = false;
    MonarcaDB.save(APP_STATE);
    renderizarSubAppTrainer();
}

function filtrarEnfoquesTrainer(query) {
    BUSQUEDA_ENFOQUE_TRAINER = query;
    renderizarSubAppTrainer();
}




