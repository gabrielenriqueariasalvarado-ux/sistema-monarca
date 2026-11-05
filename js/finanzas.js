/**
 * SISTEMA MONARCA / EMILY OS · MÓDULO DE FINANZAS PERSONALES
 * Ingresos (Fijos vs Aleatorios), Gastos agrupados por Categorías Dinámicas,
 * Deudas, Metas de Ahorro Quincenales, Regla 50/40/10 y Gráfica Ejecutiva.
 */

var ESTADO_FINANZAS = window.ESTADO_FINANZAS || {
    mesOffset: 0,
    chartInstance: null,
    tabIngresosActivo: 'fijos'
};
window.ESTADO_FINANZAS = ESTADO_FINANZAS;

function cargarFinanzas() {
    renderizarFinanzas(APP_STATE.finanzas);
}

function cambiarTabIngresos(tab) {
    ESTADO_FINANZAS.tabIngresosActivo = tab;
    var btnF = document.getElementById('tab-ingresos-fijos');
    var btnA = document.getElementById('tab-ingresos-aleatorios');
    var visF = document.getElementById('vista-ingresos-fijos');
    var visA = document.getElementById('vista-ingresos-aleatorios');

    if (tab === 'fijos') {
        if (btnF) btnF.classList.add('active');
        if (btnA) btnA.classList.remove('active');
        if (visF) visF.style.display = 'block';
        if (visA) visA.style.display = 'none';
    } else {
        if (btnF) btnF.classList.remove('active');
        if (btnA) btnA.classList.add('active');
        if (visF) visF.style.display = 'none';
        if (visA) visA.style.display = 'block';
    }
}

function seleccionarTipoIngresoModal(tipo) {
    var inTipo = document.getElementById('modal-ingreso-tipo');
    if (inTipo) inTipo.value = tipo;

    var btnF = document.getElementById('btn-modal-tipo-fija');
    var btnA = document.getElementById('btn-modal-tipo-aleatoria');
    var grpDia = document.getElementById('grupo-ingreso-dia');
    var grpFecha = document.getElementById('grupo-ingreso-fecha');
    var inF = document.getElementById('modal-ingreso-fuente');

    if (tipo === 'fija') {
        if (btnF) {
            btnF.style.background = '#1e263c';
            btnF.style.borderColor = '#38bdf8';
            btnF.style.color = '#38bdf8';
        }
        if (btnA) {
            btnA.style.background = 'transparent';
            btnA.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            btnA.style.color = '#94a3b8';
        }
        if (grpDia) grpDia.style.display = 'block';
        if (grpFecha) grpFecha.style.display = 'none';
        if (inF) inF.placeholder = "Ej: Sueldo Principal, Renta, Nómina...";
    } else {
        if (btnF) {
            btnF.style.background = 'transparent';
            btnF.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            btnF.style.color = '#94a3b8';
        }
        if (btnA) {
            btnA.style.background = '#1e263c';
            btnA.style.borderColor = '#38bdf8';
            btnA.style.color = '#38bdf8';
        }
        if (grpDia) grpDia.style.display = 'none';
        if (grpFecha) grpFecha.style.display = 'block';
        if (inF) inF.placeholder = "Ej: Bono Freelance, Venta Ocasional, Comisión...";

        var inFecha = document.getElementById('modal-ingreso-fecha');
        if (inFecha && !inFecha.value) {
            var hoy = new Date();
            var y = hoy.getFullYear();
            var m = String(hoy.getMonth() + 1).padStart(2, '0');
            var d = String(hoy.getDate()).padStart(2, '0');
            inFecha.value = y + '-' + m + '-' + d;
        }
    }
}

function renderizarFinanzas(fin) {
    var f = fin || APP_STATE.finanzas || DEFAULT_STATE.finanzas;

    // Asegurar estructura de categorías
    if (!f.categoriasGastos || !Array.isArray(f.categoriasGastos) || f.categoriasGastos.length === 0) {
        f.categoriasGastos = JSON.parse(JSON.stringify(DEFAULT_STATE.finanzas.categoriasGastos));
    }

    var vq = (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.vistaQuincena) || 'mes';

    function coincideQuincena(dia, fechaStr) {
        if (vq === 'mes') return true;
        var d = 15;
        if (dia !== undefined && dia !== null && dia !== "") {
            d = parseInt(dia, 10) || 15;
        } else if (fechaStr && typeof fechaStr === 'string' && fechaStr.indexOf('-') !== -1) {
            var partes = fechaStr.split('-');
            if (partes.length >= 3) {
                d = parseInt(partes[2], 10) || 15;
            }
        }
        if (vq === 'q1') return d <= 15;
        if (vq === 'q2') return d > 15;
        return true;
    }

    // 1. Cabecera
    if (f.cabecera) {
        var inNom = document.getElementById('finanzas-input-nombre');
        var inMes = document.getElementById('finanzas-input-mes');
        var inObj = document.getElementById('finanzas-input-objetivo');
        if (inNom) inNom.value = f.cabecera.nombre || "Gabriel Arias";
        if (inMes) inMes.value = f.cabecera.mes || "Septiembre 2026";
        if (inObj) inObj.value = f.cabecera.objetivo || "";
    }

    // 2. Ingresos (Separados en Fijos vs Aleatorios y Filtrados por Quincena)
    var totIngresosMes = 0;       // Proyección total del mes completo (para Regla 50/40/10)
    var totIngresosVista = 0;     // Total del período seleccionado (mes, q1 o q2)
    var ingresosCobradosVista = 0;   // Dinero real en cuenta (cobrado: true)
    var ingresosPendientesVista = 0; // Dinero por cobrar (cobrado: false)

    var totFijos = 0;
    var totAleatorios = 0;
    var countFijos = 0;
    var countAleatorios = 0;

    var htmlFijos = '';
    var htmlAleatorios = '';

    (f.ingresos || []).forEach(function(item) {
        var m = Number(item.monto) || 0;
        totIngresosMes += m;

        var aplicaVista = coincideQuincena(item.dia, item.fecha);
        if (!aplicaVista) return;

        totIngresosVista += m;
        var estaCobrado = !!item.cobrado;

        if (estaCobrado) {
            ingresosCobradosVista += m;
        } else {
            ingresosPendientesVista += m;
        }

        var esAleatoria = item.tipo === 'aleatoria';

        var badgeCobroHtml = estaCobrado
            ? `<span class="badge-ingreso-cobrado">✅ EN CUENTA</span>
               <button class="btn-cobrar-ingreso btn-deshacer-cobro" onclick="deshacerCobroIngresoUI('${item.id}')" title="Desmarcar dinero en cuenta">↩</button>`
            : `<span class="badge-ingreso-pendiente">⏳ Pendiente</span>
               <button class="btn-cobrar-ingreso" onclick="cobrarIngresoUI('${item.id}')" title="Sumar este dinero a mi cuenta real">💰 Sumar a Cuenta</button>`;

        if (esAleatoria) {
            totAleatorios += m;
            countAleatorios++;
            var fechaStr = item.fecha || 'Fecha no esp.';
            htmlAleatorios += `
            <div class="finanzas-tx-item">
                <div class="finanzas-tx-main">
                    <div class="finanzas-tx-icon" style="color: #38bdf8;">⚡</div>
                    <div class="finanzas-tx-details">
                        <div class="finanzas-tx-title">${item.fuente}</div>
                        <div class="finanzas-tx-meta">
                            <span class="badge-cat" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
                                ⚡ Variable · ${fechaStr}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="finanzas-tx-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                    <div class="finanzas-tx-monto monto-positivo">+$${m.toFixed(2)}</div>
                    ${badgeCobroHtml}
                    <button class="btn-delete-row" title="Eliminar entrada" onclick="eliminarRegistroFinanzasUI('${item.id}', 'ingreso')">✕</button>
                </div>
            </div>`;
        } else {
            totFijos += m;
            countFijos++;
            var diaNum = item.dia || 15;
            htmlFijos += `
            <div class="finanzas-tx-item">
                <div class="finanzas-tx-main">
                    <div class="finanzas-tx-icon" style="color: #34d399;">📅</div>
                    <div class="finanzas-tx-details">
                        <div class="finanzas-tx-title">${item.fuente}</div>
                        <div class="finanzas-tx-meta">
                            <span class="badge-cat" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
                                📅 Cobro Día ${diaNum} de cada mes
                            </span>
                        </div>
                    </div>
                </div>
                <div class="finanzas-tx-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                    <div class="finanzas-tx-monto monto-positivo">+$${m.toFixed(2)}</div>
                    ${badgeCobroHtml}
                    <button class="btn-delete-row" title="Eliminar entrada" onclick="eliminarRegistroFinanzasUI('${item.id}', 'ingreso')">✕</button>
                </div>
            </div>`;
        }
    });

    if (countFijos === 0) {
        htmlFijos = `<div class="finanzas-empty-hint">Sin entradas fijas programadas para ${vq === 'mes' ? 'este mes' : (vq === 'q1' ? 'la 1.ª quincena (1-15)' : 'la 2.ª quincena (16-31)')}.</div>`;
    }
    if (countAleatorios === 0) {
        htmlAleatorios = `<div class="finanzas-empty-hint">Sin entradas variables para ${vq === 'mes' ? 'este mes' : (vq === 'q1' ? 'la 1.ª quincena' : 'la 2.ª quincena')}.</div>`;
    }

    var elContFijos = document.getElementById('lista-ingresos-fijos');
    if (elContFijos) elContFijos.innerHTML = htmlFijos;

    var elContAleatorios = document.getElementById('lista-ingresos-aleatorios');
    if (elContAleatorios) elContAleatorios.innerHTML = htmlAleatorios;

    // Badges y Subtotales de Ingresos
    var bCountF = document.getElementById('badge-count-fijos');
    if (bCountF) bCountF.innerText = countFijos;
    var bCountA = document.getElementById('badge-count-aleatorios');
    if (bCountA) bCountA.innerText = countAleatorios;

    var subF = document.getElementById('subtotal-ingresos-fijos');
    if (subF) subF.innerText = '$' + totFijos.toFixed(2);
    var subA = document.getElementById('subtotal-ingresos-aleatorios');
    if (subA) subA.innerText = '$' + totAleatorios.toFixed(2);

    // Total General Ingresos
    var totalIngEl = document.getElementById('label-total-ingresos') || document.getElementById('total-ingresos-display');
    if (totalIngEl) totalIngEl.innerText = '$' + totIngresosVista.toFixed(2);

    // Dinero Real en Cuenta vs Por Cobrar
    var resDineroRealEl = document.getElementById('resumen-dinero-real');
    if (resDineroRealEl) resDineroRealEl.innerText = '$' + ingresosCobradosVista.toFixed(2);
    var resPorCobrarTxt = document.getElementById('resumen-por-cobrar-txt');
    if (resPorCobrarTxt) resPorCobrarTxt.innerText = 'Pendiente: $' + ingresosPendientesVista.toFixed(2);

    // 3. Gastos (Agrupados y Ordenados por Categorías, Filtrados por Quincena)
    var totGastos = 0;
    var gastosPorCategoria = {};
    var gastosAgrupados = {};

    f.categoriasGastos.forEach(function(cat) {
        gastosAgrupados[cat.nombre] = {
            id: cat.id,
            icono: cat.icono || "🏷️",
            color: cat.color || "#64748b",
            items: [],
            subtotal: 0
        };
    });

    (f.gastos || []).forEach(function(item) {
        if (!coincideQuincena(item.dia, item.fecha)) return;

        var m = Number(item.monto) || 0;
        totGastos += m;
        var catNombre = item.categoria || "Otros";

        gastosPorCategoria[catNombre] = (gastosPorCategoria[catNombre] || 0) + m;

        if (!gastosAgrupados[catNombre]) {
            gastosAgrupados[catNombre] = {
                id: "CAT-CUSTOM-" + catNombre.replace(/\s+/g, '-'),
                icono: "🏷️",
                color: "#64748b",
                items: [],
                subtotal: 0
            };
        }

        gastosAgrupados[catNombre].items.push(item);
        gastosAgrupados[catNombre].subtotal += m;
    });

    var contGastosCat = document.getElementById('contenedor-gastos-categorias');
    if (contGastosCat) {
        var htmlGrupos = '';
        var categoriasConGastos = 0;

        Object.keys(gastosAgrupados).forEach(function(catNombre) {
            var grupo = gastosAgrupados[catNombre];
            if (!grupo.items || grupo.items.length === 0) return;

            categoriasConGastos++;
            var subMonto = grupo.subtotal;
            var numItems = grupo.items.length;

            htmlGrupos += `
            <div class="categoria-gastos-group">
                <div class="categoria-gastos-header">
                    <div class="categoria-gastos-title">
                        <span style="font-size: 18px;">${grupo.icono}</span>
                        <span>${catNombre}</span>
                        <span class="badge-cat" style="background: rgba(255, 255, 255, 0.05); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.08);">
                            ${numItems} ${numItems === 1 ? 'salida' : 'salidas'}
                        </span>
                    </div>
                    <div class="categoria-gastos-subtotal">-$${subMonto.toFixed(2)}</div>
                </div>
                <div class="finanzas-tx-list">`;

            grupo.items.forEach(function(gasto) {
                var gm = Number(gasto.monto) || 0;
                var gDia = gasto.dia || 5;
                htmlGrupos += `
                    <div class="finanzas-tx-item" style="background: rgba(255, 255, 255, 0.02); margin-bottom: 6px;">
                        <div class="finanzas-tx-main">
                            <div class="finanzas-tx-details">
                                <div class="finanzas-tx-title">${gasto.concepto}</div>
                                <div class="finanzas-tx-meta">
                                    <span>📅 Pago programado: Día ${gDia}</span>
                                </div>
                            </div>
                        </div>
                        <div class="finanzas-tx-right">
                            <div class="finanzas-tx-monto monto-negativo">-$${gm.toFixed(2)}</div>
                            <button class="btn-delete-row" title="Eliminar gasto" onclick="eliminarRegistroFinanzasUI('${gasto.id}', 'gasto')">✕</button>
                        </div>
                    </div>`;
            });

            htmlGrupos += `
                </div>
            </div>`;
        });

        if (categoriasConGastos === 0) {
            htmlGrupos = `
            <div class="finanzas-empty-hint">
                <div style="font-size: 24px; margin-bottom: 6px;">💳</div>
                <div>Sin gastos registrados para ${vq === 'mes' ? 'este mes' : (vq === 'q1' ? 'la 1.ª quincena' : 'la 2.ª quincena')}.</div>
                <div style="font-size: 11.5px; margin-top: 4px; color: #64748b;">Usa el botón "+ Registrar Gasto" para clasificar tus salidas por categoría.</div>
            </div>`;
        }

        contGastosCat.innerHTML = htmlGrupos;
    }

    // Actualizar etiquetas de Total Gastos
    var totalGasEl = document.getElementById('label-total-gastos') || document.getElementById('total-gastos-display');
    if (totalGasEl) totalGasEl.innerText = '$' + totGastos.toFixed(2);
    var resGasEl = document.getElementById('resumen-total-gastos');
    if (resGasEl) resGasEl.innerText = '$' + totGastos.toFixed(2);

    // 4. Regla 50 / 40 / 10 (Calculada sobre el Total Proyectado Mensual)
    var baseCalculoRegla = totIngresosMes > 0 ? totIngresosMes : totIngresosVista;
    var meta50 = baseCalculoRegla * 0.50; // 50% Inversión y Multiplicación
    var meta40 = baseCalculoRegla * 0.40; // 40% Gastos Fijos y Necesidades
    var meta10 = baseCalculoRegla * 0.10; // 10% Caprichos y Ocio

    var el50Monto = document.getElementById('regla-monto-50') || document.getElementById('regla-50-monto');
    var el40Monto = document.getElementById('regla-monto-40') || document.getElementById('regla-40-monto');
    var el10Monto = document.getElementById('regla-monto-10') || document.getElementById('regla-10-monto');
    if (el50Monto) el50Monto.innerText = '$' + meta50.toFixed(2);
    if (el40Monto) el40Monto.innerText = '$' + meta40.toFixed(2);
    if (el10Monto) el10Monto.innerText = '$' + meta10.toFixed(2);

    // Actualizar tarjeta métrica superior: 50% Inversión y Multiplicación
    var resInversionEl = document.getElementById('resumen-total-inversion') || document.getElementById('resumen-total-ahorro-inversion');
    if (resInversionEl) resInversionEl.innerText = '$' + meta50.toFixed(2);

    // 5. Deudas (Separar Deudas Pendientes vs Deudas Pagadas)
    var totDeudasPendientes = 0;
    var totDeudasPagadas = 0;
    var contDeudas = document.getElementById('lista-deudas-tx');

    if (contDeudas) {
        var htmlDeu = '';
        var deudasEnVista = 0;

        (f.deudas || []).forEach(function(item) {
            if (!coincideQuincena(item.dia, item.fecha)) return;
            deudasEnVista++;

            var m = Number(item.montoTotal) || 0;
            var estaPagada = !!item.pagada;

            if (estaPagada) {
                totDeudasPagadas += m;
            } else {
                totDeudasPendientes += m;
            }

            var badgeDeudaHtml = estaPagada
                ? `<span class="badge-deuda-pagada">✅ PAGADA</span>
                   <button class="btn-pagar-deuda btn-deshacer-pago" onclick="deshacerPagoDeudaUI('${item.id}')" title="Desmarcar pago">↩</button>`
                : `<button class="btn-pagar-deuda" onclick="pagarDeudaUI('${item.id}')" title="Marcar como pagada">💳 Pagar Deuda</button>`;

            htmlDeu += `
            <div class="finanzas-tx-item" style="${estaPagada ? 'opacity: 0.75;' : ''}">
                <div class="finanzas-tx-main">
                    <div class="finanzas-tx-icon" style="color: ${estaPagada ? '#34d399' : '#fbbf24'};">🛡️</div>
                    <div class="finanzas-tx-details">
                        <div class="finanzas-tx-title" style="${estaPagada ? 'text-decoration: line-through; color: #94a3b8;' : ''}">${item.nombre}</div>
                        <div class="finanzas-tx-meta">
                            <span>📅 Día de pago: ${item.dia || 20}</span>
                        </div>
                    </div>
                </div>
                <div class="finanzas-tx-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                    <div class="finanzas-tx-monto ${estaPagada ? '' : 'monto-deuda'}" style="${estaPagada ? 'color: #94a3b8; text-decoration: line-through;' : ''}">$${m.toFixed(2)}</div>
                    ${badgeDeudaHtml}
                    <button class="btn-delete-row" title="Eliminar deuda" onclick="eliminarRegistroFinanzasUI('${item.id}', 'deuda')">✕</button>
                </div>
            </div>`;
        });

        if (deudasEnVista === 0) {
            htmlDeu = `<div class="finanzas-empty-hint">No hay deudas activas para ${vq === 'mes' ? 'este mes' : (vq === 'q1' ? 'la 1.ª quincena' : 'la 2.ª quincena')}. ¡Excelente!</div>`;
        }
        contDeudas.innerHTML = htmlDeu;
    }

    var totalDeuEl = document.getElementById('label-total-deudas') || document.getElementById('total-deudas-display');
    if (totalDeuEl) totalDeuEl.innerText = '$' + totDeudasPendientes.toFixed(2);
    var resDeuEl = document.getElementById('resumen-total-deudas');
    if (resDeuEl) resDeuEl.innerText = '$' + totDeudasPendientes.toFixed(2);

    // 6. Metas Quincenales y Cuotas Abonadas
    var cuotasAbonadasVista = 0;
    (f.aportesMetas || []).forEach(function(ap) {
        if (coincideQuincena(ap.dia, ap.fecha)) {
            cuotasAbonadasVista += (Number(ap.monto) || 0);
        }
    });

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
            htmlMetas = '<div class="finanzas-empty-hint" style="grid-column: 1/-1;">No hay metas de ahorro registradas. Agrega una nueva meta con el botón superior.</div>';
        }
        gridMetas.innerHTML = htmlMetas;
    }

    // 7. Fórmula de Liquidez Real (Balance Neto Libre)
    // Dinero Real en Mano = Ingresos Cobrados - Gastos Registrados - Cuotas Metas Abonadas - Deudas Pagadas
    var balanceRealEnMano = ingresosCobradosVista - totGastos - cuotasAbonadasVista - totDeudasPagadas;

    // Proyección Fin de Mes = Total Ingresos - Gastos - Metas - Deudas
    var balanceProyectado = totIngresosVista - totGastos - cuotasAbonadasVista - totDeudasPendientes - totDeudasPagadas;

    var resFlujoEl = document.getElementById('resumen-flujo-neto');
    if (resFlujoEl) {
        resFlujoEl.innerText = (balanceRealEnMano >= 0 ? '+$' : '-$') + Math.abs(balanceRealEnMano).toFixed(2);
        resFlujoEl.style.color = balanceRealEnMano >= 0 ? '#34d399' : '#f87171';
    }

    // Desglose interactivo
    var bCobrado = document.getElementById('breakdown-cobrado');
    var bGastos = document.getElementById('breakdown-gastos');
    var bCuotas = document.getElementById('breakdown-cuotas');
    var bDeudas = document.getElementById('breakdown-deudas');
    var bResultado = document.getElementById('breakdown-resultado');
    var bProyeccion = document.getElementById('breakdown-proyeccion');

    if (bCobrado) bCobrado.innerHTML = `Cobrado: <strong>$${ingresosCobradosVista.toFixed(2)}</strong>`;
    if (bGastos) bGastos.innerHTML = `Gastos: <strong>$${totGastos.toFixed(2)}</strong>`;
    if (bCuotas) bCuotas.innerHTML = `Cuotas Metas: <strong>$${cuotasAbonadasVista.toFixed(2)}</strong>`;
    if (bDeudas) bDeudas.innerHTML = `Deudas Pagadas: <strong>$${totDeudasPagadas.toFixed(2)}</strong>`;
    if (bResultado) {
        bResultado.innerText = (balanceRealEnMano >= 0 ? '+$' : '-$') + Math.abs(balanceRealEnMano).toFixed(2) + ' (En Mano)';
        bResultado.style.color = balanceRealEnMano >= 0 ? '#34d399' : '#f87171';
    }
    if (bProyeccion) {
        bProyeccion.innerHTML = `🔮 Proyección ${vq === 'mes' ? 'Fin de Mes' : (vq === 'q1' ? '1.ª Quincena' : '2.ª Quincena')}: Total Ingresos ($${totIngresosVista.toFixed(2)}) - Compromisos ($${(totGastos + cuotasAbonadasVista + totDeudasPendientes + totDeudasPagadas).toFixed(2)}) = <strong style="color: ${balanceProyectado >= 0 ? '#34d399' : '#f87171'};">${balanceProyectado >= 0 ? '+$' : '-$'}${Math.abs(balanceProyectado).toFixed(2)}</strong>`;
    }

    var badgeEstado = document.getElementById('badge-balance-estado');
    if (badgeEstado) {
        if (balanceRealEnMano >= 0) {
            badgeEstado.innerText = "FLUJO SALUDABLE (DISPONIBLE)";
            badgeEstado.style.background = "rgba(16, 185, 129, 0.15)";
            badgeEstado.style.color = "#34d399";
            badgeEstado.style.borderColor = "rgba(16, 185, 129, 0.3)";
        } else {
            badgeEstado.innerText = "DÉFICIT EN CUENTA";
            badgeEstado.style.background = "rgba(239, 68, 68, 0.15)";
            badgeEstado.style.color = "#f87171";
            badgeEstado.style.borderColor = "rgba(239, 68, 68, 0.3)";
        }
    }

    // 8. Gráfico de Distribución Financiera
    renderizarGraficoFinanzas(gastosPorCategoria, totIngresosVista, totGastos);

    // Actualizar selector dinámico de categorías para el modal de gastos
    poblarSelectCategoriasGastos();
}

function renderizarGraficoFinanzas(gastosPorCat, totIng, totGas) {
    var ctx = document.getElementById('graficoFinanzas') || document.getElementById('chart-finanzas-resumen');
    if (!ctx) return;

    if (ESTADO_FINANZAS.chartInstance) {
        ESTADO_FINANZAS.chartInstance.destroy();
        ESTADO_FINANZAS.chartInstance = null;
    }

    var labels = Object.keys(gastosPorCat);
    var dataValues = Object.values(gastosPorCat);

    var tieneGastosReales = labels.length > 0 && totGas > 0;

    if (!tieneGastosReales) {
        labels = ["Sin gastos registrados"];
        dataValues = [1];
    }

    var cyberPalette = [
        '#6366f1', '#38bdf8', '#10b981', '#f59e0b',
        '#ec4899', '#8b5cf6', '#f43f5e', '#06b6d4',
        '#14b8a6', '#a855f7'
    ];

    try {
        if (typeof Chart === 'undefined') return;

        ESTADO_FINANZAS.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: tieneGastosReales ? cyberPalette : ['rgba(255, 255, 255, 0.08)'],
                    borderWidth: 2,
                    borderColor: '#0f131d',
                    hoverOffset: tieneGastosReales ? 6 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            boxWidth: 12,
                            padding: 12,
                            font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }
                        }
                    },
                    tooltip: {
                        enabled: tieneGastosReales,
                        callbacks: {
                            label: function(context) {
                                var val = context.raw || 0;
                                return ' ' + context.label + ': $' + Number(val).toFixed(2);
                            }
                        }
                    }
                },
                cutout: '72%'
            }
        });
    } catch (e) {
        console.warn("Chart.js no disponible para renderizar dona de finanzas:", e);
    }
}

// ==========================================================================
// GESTIÓN DINÁMICA DE CATEGORÍAS DE GASTOS
// ==========================================================================

function abrirModalCategoriasGastos() {
    var m = document.getElementById('modal-gestion-categorias-gastos');
    if (m) {
        m.style.display = 'flex';
        renderizarListaCategorias();
    }
}

function cerrarModalCategoriasGastos() {
    var m = document.getElementById('modal-gestion-categorias-gastos');
    if (m) m.style.display = 'none';
    poblarSelectCategoriasGastos();
}

function poblarSelectCategoriasGastos() {
    var select = document.getElementById('modal-gasto-categoria');
    if (!select) return;

    var fin = APP_STATE.finanzas || DEFAULT_STATE.finanzas;
    var cats = fin.categoriasGastos || DEFAULT_STATE.finanzas.categoriasGastos;

    var actual = select.value;
    var html = '';

    cats.forEach(function(cat) {
        var icon = cat.icono || "🏷️";
        html += `<option value="${cat.nombre}">${icon} ${cat.nombre}</option>`;
    });

    select.innerHTML = html;
    if (actual) select.value = actual;
}

function renderizarListaCategorias() {
    var cont = document.getElementById('lista-categorias-activas');
    if (!cont) return;

    var fin = APP_STATE.finanzas || DEFAULT_STATE.finanzas;
    var cats = fin.categoriasGastos || DEFAULT_STATE.finanzas.categoriasGastos;

    var html = '';
    cats.forEach(function(cat) {
        var esDefault = ['CAT-VIVIENDA', 'CAT-ALIMENTACION', 'CAT-MOTO', 'CAT-SERVICIOS', 'CAT-SALUD', 'CAT-ENTRETENIMIENTO', 'CAT-INVERSION', 'CAT-OTROS'].includes(cat.id);
        var icon = cat.icono || "🏷️";

        html += `
        <div class="category-manager-item">
            <div class="category-manager-info">
                <span style="font-size: 20px;">${icon}</span>
                <span>${cat.nombre}</span>
            </div>
            <div>
                ${!esDefault ? `
                    <button class="btn-delete-row" title="Eliminar categoría" onclick="eliminarCategoriaGasto('${cat.id}')">✕</button>
                ` : `
                    <span style="font-size: 10.5px; color: #64748b; font-weight: 600;">Base</span>
                `}
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function guardarNuevaCategoriaGasto() {
    var inNom = document.getElementById('nueva-cat-nombre');
    var inIco = document.getElementById('nueva-cat-icono');

    var nom = inNom ? inNom.value.trim() : "";
    var ico = inIco ? inIco.value.trim() : "🏷️";

    if (!nom) {
        alert("Por favor escribe un nombre para la categoría.");
        return;
    }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.categoriasGastos) {
        APP_STATE.finanzas.categoriasGastos = JSON.parse(JSON.stringify(DEFAULT_STATE.finanzas.categoriasGastos));
    }

    // Verificar si ya existe una categoría con ese nombre
    var existe = APP_STATE.finanzas.categoriasGastos.some(function(c) {
        return c.nombre.toLowerCase() === nom.toLowerCase();
    });

    if (existe) {
        alert("Ya existe una categoría con este nombre.");
        return;
    }

    var nuevaCat = {
        id: "CAT-" + Date.now(),
        nombre: nom,
        icono: ico || "🏷️",
        color: "#6366f1"
    };

    APP_STATE.finanzas.categoriasGastos.push(nuevaCat);
    MonarcaDB.save(APP_STATE);

    if (inNom) inNom.value = "";
    if (inIco) inIco.value = "🏷️";

    renderizarListaCategorias();
    poblarSelectCategoriasGastos();
    renderizarFinanzas(APP_STATE.finanzas);
}

function eliminarCategoriaGasto(id) {
    if (!confirm("¿Deseas eliminar esta categoría personalizada?")) return;
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.categoriasGastos) return;

    if (typeof registrarTombstone === 'function') {
        registrarTombstone('finanzas_categoriasGastos', id);
    }

    APP_STATE.finanzas.categoriasGastos = APP_STATE.finanzas.categoriasGastos.filter(function(c) {
        return c.id !== id;
    });

    MonarcaDB.save(APP_STATE);
    renderizarListaCategorias();
    poblarSelectCategoriasGastos();
    renderizarFinanzas(APP_STATE.finanzas);
}

// ==========================================================================
// MODALES Y OPERACIONES FINANCIERAS
// ==========================================================================

function abrirModalIngreso(tipoPorDefecto) {
    var m = document.getElementById('modal-finanzas-ingreso') || document.getElementById('modal-finanza-ingreso');
    if (m) {
        m.style.display = 'flex';
        seleccionarTipoIngresoModal(tipoPorDefecto || 'fija');
    }
}

function cerrarModalIngreso() {
    var m = document.getElementById('modal-finanzas-ingreso') || document.getElementById('modal-finanza-ingreso');
    if (m) m.style.display = 'none';
}

function confirmarAgregarIngreso() {
    var inF = document.getElementById('modal-ingreso-fuente');
    var inD = document.getElementById('modal-ingreso-dia');
    var inFecha = document.getElementById('modal-ingreso-fecha');
    var inM = document.getElementById('modal-ingreso-monto');
    var inTipo = document.getElementById('modal-ingreso-tipo');

    var tipo = inTipo ? inTipo.value : 'fija';
    var f = inF ? inF.value.trim() : "";
    var m = inM ? (Number(inM.value) || 0) : 0;
    var d = inD ? (Number(inD.value) || 15) : 15;
    var fecha = inFecha ? inFecha.value : "";

    if (!f || m <= 0) {
        alert("Completa la fuente/concepto y un monto válido.");
        return;
    }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.ingresos) APP_STATE.finanzas.ingresos = [];

    var nuevoIngreso = {
        id: "ING-" + Date.now(),
        fuente: f,
        tipo: tipo,
        dia: d,
        fecha: fecha,
        monto: m,
        cobrado: false
    };

    APP_STATE.finanzas.ingresos.push(nuevoIngreso);

    if (inF) inF.value = "";
    if (inM) inM.value = "";

    MonarcaDB.save(APP_STATE);
    cerrarModalIngreso();
    renderizarFinanzas(APP_STATE.finanzas);

    // Cambiar al tab correspondiente para ver el nuevo ingreso de inmediato
    cambiarTabIngresos(tipo === 'aleatoria' ? 'aleatorios' : 'fijos');
}

function abrirModalGasto() {
    var m = document.getElementById('modal-finanzas-gasto') || document.getElementById('modal-finanza-gasto');
    if (m) {
        m.style.display = 'flex';
        poblarSelectCategoriasGastos();
    }
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

    if (!cp || m <= 0) {
        alert("Completa el concepto del gasto y un monto válido.");
        return;
    }

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

    if (!n || m <= 0) {
        alert("Completa el nombre del acreedor y un monto válido.");
        return;
    }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.deudas) APP_STATE.finanzas.deudas = [];

    APP_STATE.finanzas.deudas.push({
        id: "DEU-" + Date.now(),
        nombre: n,
        dia: d,
        montoTotal: m,
        pagada: false
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

    if (!n || t <= 0) {
        alert("Completa el nombre y una meta total válida.");
        return;
    }

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
    var meta = null;
    for (var i = 0; i < APP_STATE.finanzas.metas.length; i++) {
        if (APP_STATE.finanzas.metas[i].id === id) {
            meta = APP_STATE.finanzas.metas[i];
            break;
        }
    }
    if (!meta) return;

    var cuota = Number(meta.cuotaQuincenal) || 0;
    if (cuota <= 0) return;

    meta.ahorrado = Math.min(meta.metaTotal, (Number(meta.ahorrado) || 0) + cuota);
    meta.faltante = Math.max(0, meta.metaTotal - meta.ahorrado);

    if (!APP_STATE.finanzas.aportesMetas) APP_STATE.finanzas.aportesMetas = [];
    var hoy = new Date();
    APP_STATE.finanzas.aportesMetas.push({
        id: "APO-" + Date.now(),
        metaId: meta.id,
        metaNombre: meta.nombre,
        monto: cuota,
        dia: hoy.getDate(),
        fecha: hoy.toISOString().split('T')[0]
    });

    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function cobrarIngresoUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.ingresos) return;
    for (var i = 0; i < APP_STATE.finanzas.ingresos.length; i++) {
        if (APP_STATE.finanzas.ingresos[i].id === id) {
            APP_STATE.finanzas.ingresos[i].cobrado = true;
            APP_STATE.finanzas.ingresos[i].fechaCobro = new Date().toISOString();
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function deshacerCobroIngresoUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.ingresos) return;
    for (var i = 0; i < APP_STATE.finanzas.ingresos.length; i++) {
        if (APP_STATE.finanzas.ingresos[i].id === id) {
            APP_STATE.finanzas.ingresos[i].cobrado = false;
            delete APP_STATE.finanzas.ingresos[i].fechaCobro;
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function pagarDeudaUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.deudas) return;
    for (var i = 0; i < APP_STATE.finanzas.deudas.length; i++) {
        if (APP_STATE.finanzas.deudas[i].id === id) {
            APP_STATE.finanzas.deudas[i].pagada = true;
            APP_STATE.finanzas.deudas[i].fechaPago = new Date().toISOString();
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function deshacerPagoDeudaUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.deudas) return;
    for (var i = 0; i < APP_STATE.finanzas.deudas.length; i++) {
        if (APP_STATE.finanzas.deudas[i].id === id) {
            APP_STATE.finanzas.deudas[i].pagada = false;
            delete APP_STATE.finanzas.deudas[i].fechaPago;
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function cambiarPeriodoFinanzas(periodo) {
    if (periodo !== 'mes' && periodo !== 'q1' && periodo !== 'q2') periodo = 'mes';
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.vistaQuincena = periodo;

    var bMes = document.getElementById('btn-vista-mes');
    var bQ1 = document.getElementById('btn-vista-q1');
    var bQ2 = document.getElementById('btn-vista-q2');
    if (bMes) bMes.classList.toggle('active', periodo === 'mes');
    if (bQ1) bQ1.classList.toggle('active', periodo === 'q1');
    if (bQ2) bQ2.classList.toggle('active', periodo === 'q2');

    renderizarFinanzas(APP_STATE.finanzas);
}

function eliminarRegistroFinanzasUI(id, tipo) {
    if (!confirm("¿Eliminar este registro financiero?")) return;
    if (!APP_STATE.finanzas) return;

    var coleccionTombstone = "finanzas_" + (tipo === 'ingreso' ? 'ingresos' : (tipo === 'gasto' ? 'gastos' : (tipo === 'deuda' ? 'deudas' : 'metas')));
    if (typeof registrarTombstone === 'function') {
        registrarTombstone(coleccionTombstone, id);
    }

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
    var inNom = document.getElementById('finanzas-input-nombre');
    var inMes = document.getElementById('finanzas-input-mes');
    var inObj = document.getElementById('finanzas-input-objetivo');

    var n = inNom ? inNom.value : "Gabriel Arias";
    var m = inMes ? inMes.value : "";
    var o = inObj ? inObj.value : "";

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    APP_STATE.finanzas.cabecera = { nombre: n, mes: m, objetivo: o };
    MonarcaDB.save(APP_STATE);
}

function cambiarMesFinanzas(delta) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.mesOffset = (window.ESTADO_FINANZAS.mesOffset || 0) + delta;
    var fecha = new Date();
    fecha.setMonth(fecha.getMonth() + window.ESTADO_FINANZAS.mesOffset);
    var nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
    var inMes = document.getElementById('finanzas-input-mes');
    if (inMes) inMes.value = nombreMes;
    alCambiarDatoGeneralFinanzas();
}
