/**
 * SISTEMA MONARCA · MÓDULO DE FINANZAS PERSONALES
 * Ingresos, Gastos, Deudas, Metas de Ahorro Quincenales, Regla 50/40/10 y Gráficas.
 */

function cargarFinanzas() {
    renderizarFinanzas(APP_STATE.finanzas);
}

function renderizarFinanzas(fin) {
    var f = fin || APP_STATE.finanzas || DEFAULT_STATE.finanzas;

    // 1. Cabecera
    if (f.cabecera) {
        var inNom = document.getElementById('finanzas-input-nombre');
        var inMes = document.getElementById('finanzas-input-mes');
        var inObj = document.getElementById('finanzas-input-objetivo');
        if (inNom) inNom.value = f.cabecera.nombre || "Gabriel Arias";
        if (inMes) inMes.value = f.cabecera.mes || "Septiembre 2026";
        if (inObj) inObj.value = f.cabecera.objetivo || "";
    }

    // 2. Ingresos
    var totIngresos = 0;
    var tbodyIng = document.getElementById('tbody-ingresos') || document.getElementById('tbody-finanzas-ingresos');
    if (tbodyIng) {
        var htmlIng = '';
        (f.ingresos || []).forEach(function(item) {
            var m = Number(item.monto) || 0;
            totIngresos += m;
            htmlIng += `<tr>
                <td><strong>${item.fuente}</strong></td>
                <td style="text-align: center;">Día ${item.dia || 15}</td>
                <td class="monto-positivo" style="text-align: right; font-weight: 700;">$${m.toFixed(2)}</td>
                <td style="text-align: center;">
                    <button class="btn-delete-row" title="Eliminar entrada" onclick="eliminarRegistroFinanzasUI('${item.id}', 'ingreso')">✕</button>
                </td>
            </tr>`;
        });
        if (!f.ingresos || f.ingresos.length === 0) {
            htmlIng = '<tr><td colspan="4" style="text-align:center; color:#9ca3af; padding: 18px;">Sin ingresos registrados. Agrega una nueva entrada con el botón superior.</td></tr>';
        }
        tbodyIng.innerHTML = htmlIng;
    }

    // Actualizar etiquetas de Total Ingresos
    var totalIngEl = document.getElementById('label-total-ingresos') || document.getElementById('total-ingresos-display');
    if (totalIngEl) totalIngEl.innerText = '$' + totIngresos.toFixed(2);
    var resIngEl = document.getElementById('resumen-total-ingresos');
    if (resIngEl) resIngEl.innerText = '$' + totIngresos.toFixed(2);

    // 3. Gastos
    var totGastos = 0;
    var gastosPorCategoria = {};
    var tbodyGas = document.getElementById('tbody-gastos') || document.getElementById('tbody-finanzas-gastos');
    if (tbodyGas) {
        var htmlGas = '';
        (f.gastos || []).forEach(function(item) {
            var m = Number(item.monto) || 0;
            totGastos += m;
            gastosPorCategoria[item.categoria] = (gastosPorCategoria[item.categoria] || 0) + m;

            var catClass = 'cat-otros';
            var catLower = (item.categoria || '').toLowerCase();
            if (catLower.includes('vivienda')) catClass = 'cat-vivienda';
            else if (catLower.includes('alimento') || catLower.includes('supermercado')) catClass = 'cat-alimentacion';
            else if (catLower.includes('moto') || catLower.includes('transporte')) catClass = 'cat-moto';
            else if (catLower.includes('servicio')) catClass = 'cat-servicios';
            else if (catLower.includes('salud')) catClass = 'cat-salud';
            else if (catLower.includes('entretenimiento')) catClass = 'cat-entretenimiento';

            htmlGas += `<tr>
                <td><strong>${item.concepto}</strong></td>
                <td><span class="badge-cat ${catClass}">${item.categoria}</span></td>
                <td style="text-align: center;">Día ${item.dia || 5}</td>
                <td class="monto-negativo" style="text-align: right; font-weight: 700;">-$${m.toFixed(2)}</td>
                <td style="text-align: center;">
                    <button class="btn-delete-row" title="Eliminar gasto" onclick="eliminarRegistroFinanzasUI('${item.id}', 'gasto')">✕</button>
                </td>
            </tr>`;
        });
        if (!f.gastos || f.gastos.length === 0) {
            htmlGas = '<tr><td colspan="5" style="text-align:center; color:#9ca3af; padding: 18px;">Sin gastos registrados. Agrega un nuevo gasto con el botón superior.</td></tr>';
        }
        tbodyGas.innerHTML = htmlGas;
    }

    // Actualizar etiquetas de Total Gastos
    var totalGasEl = document.getElementById('label-total-gastos') || document.getElementById('total-gastos-display');
    if (totalGasEl) totalGasEl.innerText = '$' + totGastos.toFixed(2);
    var resGasEl = document.getElementById('resumen-total-gastos');
    if (resGasEl) resGasEl.innerText = '$' + totGastos.toFixed(2);

    // 4. Regla 50 / 40 / 10
    var meta50 = totIngresos * 0.50;
    var meta40 = totIngresos * 0.40;
    var meta10 = totIngresos * 0.10;

    var el50Monto = document.getElementById('regla-monto-50') || document.getElementById('regla-50-monto');
    var el40Monto = document.getElementById('regla-monto-40') || document.getElementById('regla-40-monto');
    var el10Monto = document.getElementById('regla-monto-10') || document.getElementById('regla-10-monto');
    if (el50Monto) el50Monto.innerText = '$' + meta50.toFixed(2);
    if (el40Monto) el40Monto.innerText = '$' + meta40.toFixed(2);
    if (el10Monto) el10Monto.innerText = '$' + meta10.toFixed(2);

    // 5. Deudas
    var totDeudas = 0;
    var tbodyDeu = document.getElementById('tbody-deudas') || document.getElementById('tbody-finanzas-deudas');
    if (tbodyDeu) {
        var htmlDeu = '';
        (f.deudas || []).forEach(function(item) {
            var m = Number(item.montoTotal) || 0;
            totDeudas += m;
            htmlDeu += `<tr>
                <td><strong>${item.nombre}</strong></td>
                <td style="text-align: center;">Día ${item.dia || 20}</td>
                <td class="monto-deuda" style="text-align: right; font-weight: 700;">$${m.toFixed(2)}</td>
                <td style="text-align: center;">
                    <button class="btn-delete-row" title="Eliminar deuda" onclick="eliminarRegistroFinanzasUI('${item.id}', 'deuda')">✕</button>
                </td>
            </tr>`;
        });
        if (!f.deudas || f.deudas.length === 0) {
            htmlDeu = '<tr><td colspan="4" style="text-align:center; color:#9ca3af; padding: 18px;">No tienes deudas activas registradas.</td></tr>';
        }
        tbodyDeu.innerHTML = htmlDeu;
    }

    var totalDeuEl = document.getElementById('label-total-deudas') || document.getElementById('total-deudas-display');
    if (totalDeuEl) totalDeuEl.innerText = '$' + totDeudas.toFixed(2);
    var resDeuEl = document.getElementById('resumen-total-deudas');
    if (resDeuEl) resDeuEl.innerText = '$' + totDeudas.toFixed(2);

    // Resumen Flujo Neto y Ahorro / Inversión
    var flujoNeto = totIngresos - totGastos;
    var resFlujoEl = document.getElementById('resumen-flujo-neto');
    if (resFlujoEl) {
        resFlujoEl.innerText = (flujoNeto >= 0 ? '+$' : '-$') + Math.abs(flujoNeto).toFixed(2);
        resFlujoEl.style.color = flujoNeto >= 0 ? '#10b981' : '#ef4444';
    }
    var resAhorroEl = document.getElementById('resumen-total-ahorro-inversion');
    if (resAhorroEl) {
        resAhorroEl.innerText = '$' + (meta40 + meta10).toFixed(2);
    }

    // 6. Metas Quincenales
    var gridMetas = document.getElementById('contenedor-metas-cards') || document.getElementById('grid-finanzas-metas');
    if (gridMetas) {
        var htmlMetas = '';
        (f.metas || []).forEach(function(item) {
            var tot = Number(item.metaTotal) || 0;
            var ahorr = Number(item.ahorrado) || 0;
            var falt = Math.max(0, tot - ahorr);
            var pct = tot > 0 ? Math.min(100, Math.round((ahorr / tot) * 100)) : 0;
            var cuota = Number(item.cuotaQuincenal) || 0;

            htmlMetas += `
            <div class="meta-card">
                <div>
                    <div class="meta-card-header">
                        <h4 class="meta-card-title">🎯 ${item.nombre}</h4>
                        <button class="btn-delete-row" title="Eliminar meta" onclick="eliminarRegistroFinanzasUI('${item.id}', 'meta')">✕</button>
                    </div>
                    <div class="meta-numbers-row">
                        <span>Ahorrado: <strong>$${ahorr.toFixed(2)}</strong></span>
                        <span>Meta: <strong>$${tot.toFixed(2)}</strong></span>
                    </div>
                    <div class="meta-progress-track">
                        <div class="meta-progress-fill" style="width: ${pct}%;"></div>
                    </div>
                    <div class="meta-cuotas-info">
                        <div>📅 Faltante: <strong>$${falt.toFixed(2)}</strong> (${pct}%)</div>
                        <div>⚡ Cuota: <strong>$${cuota.toFixed(2)}</strong> (quince y último)</div>
                    </div>
                </div>
                <button class="btn-sumar-cuota" onclick="abonarCuotaMetaUI('${item.id}')">
                    +1 Cuota Quincenal ($${cuota.toFixed(2)})
                </button>
            </div>`;
        });
        if (!f.metas || f.metas.length === 0) {
            htmlMetas = '<p style="color:#6b7280; text-align:center; padding:20px; grid-column:1/-1;">No hay metas de ahorro registradas.</p>';
        }
        gridMetas.innerHTML = htmlMetas;
    }

    // 7. Gráfico de Distribución Financiera
    renderizarGraficoFinanzas(gastosPorCategoria, totIngresos, totGastos);
}
function renderizarGraficoFinanzas(gastosPorCat, totIng, totGas) {
    var ctx = document.getElementById('chart-finanzas-resumen');
    if (!ctx) return;

    if (ESTADO_FINANZAS.chartInstance) {
        ESTADO_FINANZAS.chartInstance.destroy();
    }

    var labels = Object.keys(gastosPorCat);
    var dataValues = Object.values(gastosPorCat);

    if (labels.length === 0) {
        labels = ["Sin gastos aún"];
        dataValues = [1];
    }

    try {
        ESTADO_FINANZAS.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: [
                        '#111827', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#10b981', '#3b82f6'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } } }
                },
                cutout: '68%'
            }
        });
    } catch (e) {
        console.warn("Chart.js no disponible para renderizar dona de finanzas:", e);
    }
}

// Modales Financieros
function abrirModalIngreso() {
    var m = document.getElementById('modal-finanzas-ingreso') || document.getElementById('modal-finanza-ingreso');
    if (m) m.style.display = 'flex';
}
function cerrarModalIngreso() {
    var m = document.getElementById('modal-finanzas-ingreso') || document.getElementById('modal-finanza-ingreso');
    if (m) m.style.display = 'none';
}
function confirmarAgregarIngreso() {
    var inF = document.getElementById('modal-ingreso-fuente');
    var inD = document.getElementById('modal-ingreso-dia');
    var inM = document.getElementById('modal-ingreso-monto');
    var f = inF ? inF.value.trim() : "";
    var d = inD ? (Number(inD.value) || 15) : 15;
    var m = inM ? (Number(inM.value) || 0) : 0;
    if (!f || m <= 0) { alert("Completa la fuente y un monto válido."); return; }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.ingresos) APP_STATE.finanzas.ingresos = [];

    APP_STATE.finanzas.ingresos.push({
        id: "ING-" + Date.now(),
        fuente: f,
        dia: d,
        monto: m
    });

    if (inF) inF.value = "";
    if (inM) inM.value = "";

    MonarcaDB.save(APP_STATE);
    cerrarModalIngreso();
    renderizarFinanzas(APP_STATE.finanzas);
}

function abrirModalGasto() {
    var m = document.getElementById('modal-finanzas-gasto') || document.getElementById('modal-finanza-gasto');
    if (m) m.style.display = 'flex';
}
function cerrarModalGasto() {
    var m = document.getElementById('modal-finanzas-gasto') || document.getElementById('modal-finanza-gasto');
    if (m) m.style.display = 'none';
}
function confirmarAgregarGasto() {
    var inC = document.getElementById('modal-gasto-categoria') || document.getElementById('modal-gasto-cat');
    var inCp = document.getElementById('modal-gasto-fuente') || document.getElementById('modal-gasto-concepto');
    var inD = document.getElementById('modal-gasto-dia');
    var inM = document.getElementById('modal-gasto-monto');

    var c = inC ? inC.value : "Otros";
    var cp = inCp ? inCp.value.trim() : "";
    var d = inD ? (Number(inD.value) || 5) : 5;
    var m = inM ? (Number(inM.value) || 0) : 0;

    if (!cp || m <= 0) { alert("Completa el concepto del gasto y un monto válido."); return; }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.gastos) APP_STATE.finanzas.gastos = [];

    APP_STATE.finanzas.gastos.push({
        id: "GAS-" + Date.now(),
        categoria: c,
        concepto: cp,
        dia: d,
        monto: m
    });

    if (inCp) inCp.value = "";
    if (inM) inM.value = "";

    MonarcaDB.save(APP_STATE);
    cerrarModalGasto();
    renderizarFinanzas(APP_STATE.finanzas);
}

function abrirModalDeuda() {
    var m = document.getElementById('modal-finanzas-deuda') || document.getElementById('modal-finanza-deuda');
    if (m) m.style.display = 'flex';
}
function cerrarModalDeuda() {
    var m = document.getElementById('modal-finanzas-deuda') || document.getElementById('modal-finanza-deuda');
    if (m) m.style.display = 'none';
}
function confirmarAgregarDeuda() {
    var inN = document.getElementById('modal-deuda-nombre');
    var inD = document.getElementById('modal-deuda-dia');
    var inM = document.getElementById('modal-deuda-monto');

    var n = inN ? inN.value.trim() : "";
    var d = inD ? (Number(inD.value) || 20) : 20;
    var m = inM ? (Number(inM.value) || 0) : 0;

    if (!n || m <= 0) { alert("Completa el nombre y un monto válido."); return; }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.deudas) APP_STATE.finanzas.deudas = [];

    APP_STATE.finanzas.deudas.push({
        id: "DEU-" + Date.now(),
        nombre: n,
        dia: d,
        montoTotal: m
    });

    if (inN) inN.value = "";
    if (inM) inM.value = "";

    MonarcaDB.save(APP_STATE);
    cerrarModalDeuda();
    renderizarFinanzas(APP_STATE.finanzas);
}

function abrirModalMeta() {
    var m = document.getElementById('modal-finanzas-meta') || document.getElementById('modal-finanza-meta');
    if (m) {
        m.style.display = 'flex';
        actualizarCalculoCuotaMeta();
    }
}
function cerrarModalMeta() {
    var m = document.getElementById('modal-finanzas-meta') || document.getElementById('modal-finanza-meta');
    if (m) m.style.display = 'none';
}
function actualizarCalculoCuotaMeta() {
    var inT = document.getElementById('modal-meta-total');
    var inA = document.getElementById('modal-meta-ahorrado');
    var inM = document.getElementById('modal-meta-meses');

    var t = inT ? (Number(inT.value) || 0) : 0;
    var a = inA ? (Number(inA.value) || 0) : 0;
    var m = inM ? (Number(inM.value) || 1) : 1;

    var falt = Math.max(0, t - a);
    var cuotas = m * 2;
    var cuotaVal = cuotas > 0 ? (falt / cuotas) : 0;

    var elF = document.getElementById('preview-meta-faltante');
    var elC = document.getElementById('preview-meta-cuotas');
    var elV = document.getElementById('preview-meta-cuotavalor');
    if (elF) elF.innerText = '$' + falt.toFixed(2);
    if (elC) elC.innerText = cuotas + ' cuotas (quince y último)';
    if (elV) elV.innerText = '$' + cuotaVal.toFixed(2);
}
function confirmarAgregarMeta() {
    var inN = document.getElementById('modal-meta-nombre');
    var inT = document.getElementById('modal-meta-total');
    var inA = document.getElementById('modal-meta-ahorrado');
    var inM = document.getElementById('modal-meta-meses');

    var n = inN ? inN.value.trim() : "";
    var t = inT ? (Number(inT.value) || 0) : 0;
    var a = inA ? (Number(inA.value) || 0) : 0;
    var m = inM ? (Number(inM.value) || 1) : 1;

    if (!n || t <= 0) { alert("Completa el nombre y una meta total válida."); return; }

    var falt = Math.max(0, t - a);
    var cuotas = m * 2;
    var cuotaVal = cuotas > 0 ? (falt / cuotas) : 0;

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.metas) APP_STATE.finanzas.metas = [];

    APP_STATE.finanzas.metas.push({
        id: "MET-" + Date.now(),
        nombre: n,
        metaTotal: t,
        ahorrado: a,
        faltante: falt,
        meses: m,
        cuotaQuincenal: Math.round(cuotaVal * 100) / 100
    });

    if (inN) inN.value = "";
    if (inT) inT.value = "";
    if (inA) inA.value = "0";

    MonarcaDB.save(APP_STATE);
    cerrarModalMeta();
    renderizarFinanzas(APP_STATE.finanzas);
}

function abonarCuotaMetaUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.metas) return;
    for (var i = 0; i < APP_STATE.finanzas.metas.length; i++) {
        if (APP_STATE.finanzas.metas[i].id === id) {
            var item = APP_STATE.finanzas.metas[i];
            item.ahorrado = Math.min(item.metaTotal, (item.ahorrado || 0) + (item.cuotaQuincenal || 0));
            item.faltante = Math.max(0, item.metaTotal - item.ahorrado);
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function eliminarRegistroFinanzasUI(id, tipo) {
    if (!confirm("¿Eliminar este registro financiero?")) return;
    if (!APP_STATE.finanzas) return;

    if (tipo === 'ingreso' && APP_STATE.finanzas.ingresos) {
        APP_STATE.finanzas.ingresos = APP_STATE.finanzas.ingresos.filter(function(x) { return x.id !== id; });
    } else if (tipo === 'gasto' && APP_STATE.finanzas.gastos) {
        APP_STATE.finanzas.gastos = APP_STATE.finanzas.gastos.filter(function(x) { return x.id !== id; });
    } else if (tipo === 'deuda' && APP_STATE.finanzas.deudas) {
        APP_STATE.finanzas.deudas = APP_STATE.finanzas.deudas.filter(function(x) { return x.id !== id; });
    } else if (tipo === 'meta' && APP_STATE.finanzas.metas) {
        APP_STATE.finanzas.metas = APP_STATE.finanzas.metas.filter(function(x) { return x.id !== id; });
    }

    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function alCambiarDatoGeneralFinanzas() {
    var n = document.getElementById('finanzas-input-nombre').value;
    var m = document.getElementById('finanzas-input-mes').value;
    var o = document.getElementById('finanzas-input-objetivo').value;
    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    APP_STATE.finanzas.cabecera = { nombre: n, mes: m, objetivo: o };
    MonarcaDB.save(APP_STATE);
}

function cambiarMesFinanzas(delta) {
    ESTADO_FINANZAS.mesOffset += delta;
    var fecha = new Date();
    fecha.setMonth(fecha.getMonth() + ESTADO_FINANZAS.mesOffset);
    var nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
    var inMes = document.getElementById('finanzas-input-mes');
    if (inMes) inMes.value = nombreMes;
    alCambiarDatoGeneralFinanzas();
}

function inicializarHojaFinanzasDesdeUI() {
    MonarcaDB.exportBackup();
}

// ==========================================================================
// 11. BANCO DE IDEAS MONARCA
// ==========================================================================
