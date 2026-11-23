/**
 * SISTEMA MONARCA / EMILY OS · MÓDULO DE FINANZAS PERSONALES
 * Ingresos (Fijos vs Aleatorios), Gastos agrupados por Categorías Dinámicas,
 * Deudas, Metas de Ahorro Quincenales, Regla 50/40/10 y Gráfica Ejecutiva.
 */

function obtenerFechaMesFinanzas() {
    var offset = (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.mesOffset) || 0;
    var d = new Date();
    d.setDate(1); // Fijar día 1 para evitar desbordes al cambiar meses
    d.setMonth(d.getMonth() + offset);
    return d;
}

function calcularSemanasDelMes(anio, mes) {
    var primerDia = new Date(anio, mes, 1);
    var ultimoDia = new Date(anio, mes + 1, 0);

    // En JS getDay(): Domingo = 0, Lunes = 1, ..., Sábado = 6
    // Desplazamiento para que la semana siempre inicie en LUNES:
    var diaSemanaPrimer = (primerDia.getDay() + 6) % 7; 
    var actualLunes = new Date(anio, mes, 1 - diaSemanaPrimer);

    var semanas = [];
    while (actualLunes <= ultimoDia) {
        var domingoFin = new Date(actualLunes.getFullYear(), actualLunes.getMonth(), actualLunes.getDate() + 6);
        var num = semanas.length + 1;

        var diaIni = actualLunes.getDate();
        var diaFin = domingoFin.getDate();

        var yIni = actualLunes.getFullYear();
        var mIni = String(actualLunes.getMonth() + 1).padStart(2, '0');
        var dIni = String(diaIni).padStart(2, '0');
        var claveIni = yIni + '-' + mIni + '-' + dIni;

        var yFin = domingoFin.getFullYear();
        var mFin = String(domingoFin.getMonth() + 1).padStart(2, '0');
        var dFin = String(diaFin).padStart(2, '0');
        var claveFin = yFin + '-' + mFin + '-' + dFin;

        var diasSemana = [];
        for (var step = 0; step < 7; step++) {
            var diaPaso = new Date(actualLunes.getFullYear(), actualLunes.getMonth(), actualLunes.getDate() + step);
            diasSemana.push(diaPaso.getDate());
        }

        semanas.push({
            num: num,
            clave: 'sem' + num,
            inicioDia: diaIni,
            finDia: diaFin,
            claveIni: claveIni,
            claveFin: claveFin,
            dias: diasSemana,
            etiqueta: 'Sem ' + num + ' (' + diaIni + '-' + diaFin + ')'
        });

        actualLunes = new Date(actualLunes.getFullYear(), actualLunes.getMonth(), actualLunes.getDate() + 7);
    }
    return semanas;
}

function obtenerSemanaActualParaMes(anio, mes) {
    var hoy = new Date();
    var y = hoy.getFullYear();
    var m = String(hoy.getMonth() + 1).padStart(2, '0');
    var d = String(hoy.getDate()).padStart(2, '0');
    var hoyStr = y + '-' + m + '-' + d;

    var semanas = calcularSemanasDelMes(anio, mes);
    for (var i = 0; i < semanas.length; i++) {
        if (hoyStr >= semanas[i].claveIni && hoyStr <= semanas[i].claveFin) {
            return semanas[i].clave;
        }
    }
    return semanas.length > 0 ? semanas[0].clave : 'sem1';
}

function obtenerSemanasMesActivo() {
    var f = obtenerFechaMesFinanzas();
    return calcularSemanasDelMes(f.getFullYear(), f.getMonth());
}

function obtenerTituloPeriodo(vq) {
    if (vq === 'mes') return 'Mes Completo';
    var semanas = obtenerSemanasMesActivo();
    var s = semanas.find(function(x) { return x.clave === vq; });
    if (s) return s.etiqueta;
    if (vq === 'q1') return '1.ª Quincena (1-15)';
    if (vq === 'q2') return '2.ª Quincena (16-31)';
    return 'Período Activo';
}

function obtenerNombrePeriodo(vq) {
    if (vq === 'mes') return 'este mes';
    var semanas = obtenerSemanasMesActivo();
    var s = semanas.find(function(x) { return x.clave === vq; });
    if (s) return 'la ' + s.etiqueta;
    if (vq === 'q1') return 'la 1.ª Quincena';
    if (vq === 'q2') return 'la 2.ª Quincena';
    return 'este período';
}

var ESTADO_FINANZAS = window.ESTADO_FINANZAS || {
    mesOffset: 0,
    chartInstance: null,
    tabIngresosActivo: 'fijos',
    vistaQuincena: 'sem1',
    modoGrafico: 'comparativa',
    filtroGastos: 'todos',
    seccionActiva: 'panel',
    calDiaSeleccionado: null,
    calFiltroTipo: 'todos',
    calUltimoMovimiento: null
};
window.ESTADO_FINANZAS = ESTADO_FINANZAS;

function cargarFinanzas() {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.mesOffset = 0; // Al entrar, siempre al mes actual
    if (!window.ESTADO_FINANZAS.seccionActiva) window.ESTADO_FINANZAS.seccionActiva = 'panel';
    if (!window.ESTADO_FINANZAS.calFiltroTipo) window.ESTADO_FINANZAS.calFiltroTipo = 'todos';
    var fechaMes = obtenerFechaMesFinanzas();
    var semActual = obtenerSemanaActualParaMes(fechaMes.getFullYear(), fechaMes.getMonth());
    cambiarPeriodoFinanzas(semActual, true);
    inicializarComparacionesAhorroPorDefecto();
    if (typeof cambiarSeccionFinanzas === 'function') {
        cambiarSeccionFinanzas(window.ESTADO_FINANZAS.seccionActiva, true);
    }
    renderizarFinanzas(APP_STATE.finanzas);
    notificarToastSiHayRetrasosFinanzas();
    if (typeof actualizarTasasBCV === 'function') {
        actualizarTasasBCV(false);
    }
}

function cambiarModoGrafico(modo) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.modoGrafico = modo;
    var b50 = document.getElementById('btn-chart-504010');
    var bDona = document.getElementById('btn-chart-dona');
    if (b50) b50.classList.toggle('active', modo === 'comparativa');
    if (bDona) bDona.classList.toggle('active', modo === 'dona');
    renderizarFinanzas(APP_STATE.finanzas);
}

function cambiarFiltroGastosUI(filtro) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.filtroGastos = filtro;
    var bT = document.getElementById('tab-gastos-todos');
    var bP = document.getElementById('tab-gastos-programados');
    var bO = document.getElementById('tab-gastos-ocasionales');
    if (bT) bT.classList.toggle('active', filtro === 'todos');
    if (bP) bP.classList.toggle('active', filtro === 'programados');
    if (bO) bO.classList.toggle('active', filtro === 'ocasionales');
    renderizarFinanzas(APP_STATE.finanzas);
}

function seleccionarTipoGastoModal(tipo) {
    var inTipo = document.getElementById('modal-gasto-tipo');
    if (inTipo) inTipo.value = tipo;

    var btnP = document.getElementById('btn-modal-gasto-tipo-prog');
    var btnO = document.getElementById('btn-modal-gasto-tipo-ocas');
    var grpDia = document.getElementById('grupo-gasto-dia');
    var grpFecha = document.getElementById('grupo-gasto-fecha');
    var inF = document.getElementById('modal-gasto-fuente');

    if (tipo === 'programado') {
        if (btnP) {
            btnP.style.background = '#1e263c';
            btnP.style.borderColor = '#f59e0b';
            btnP.style.color = '#fbbf24';
        }
        if (btnO) {
            btnO.style.background = 'transparent';
            btnO.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            btnO.style.color = '#94a3b8';
        }
        if (grpDia) grpDia.style.display = 'block';
        if (grpFecha) grpFecha.style.display = 'none';
        if (inF) inF.placeholder = "Ej: Gasolina (todos los 16), Alquiler, Internet...";
    } else {
        if (btnP) {
            btnP.style.background = 'transparent';
            btnP.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            btnP.style.color = '#94a3b8';
        }
        if (btnO) {
            btnO.style.background = '#1e263c';
            btnO.style.borderColor = '#ef4444';
            btnO.style.color = '#f87171';
        }
        if (grpDia) grpDia.style.display = 'none';
        if (grpFecha) grpFecha.style.display = 'block';
        if (inF) inF.placeholder = "Ej: Salida fin de semana, Repuesto urgente...";

        var inFecha = document.getElementById('modal-gasto-fecha');
        if (inFecha && !inFecha.value) {
            var hoy = new Date();
            var y = hoy.getFullYear();
            var m = String(hoy.getMonth() + 1).padStart(2, '0');
            var d = String(hoy.getDate()).padStart(2, '0');
            inFecha.value = y + '-' + m + '-' + d;
        }
    }
}

function obtenerTasaConversionFinanzas(tasaModo) {
    var modo = (tasaModo === 'paralelo') ? 'paralelo' : 'bcv';
    if (typeof obtenerTasaParaTarjeta === 'function') {
        var res = obtenerTasaParaTarjeta(modo);
        if (res && res.valor > 0) return res;
    }
    var cache = (typeof leerCacheTasasBCV === 'function') ? (leerCacheTasasBCV() || {}) : {};
    var usdBcv = Number(cache.usd) || 0;
    var par = Number(cache.paralelo) || 0;
    if (modo === 'paralelo' && par > 0) return { valor: par, label: 'Paralelo', fallback: false };
    if (usdBcv > 0) return { valor: usdBcv, label: 'BCV USD', fallback: modo !== 'bcv' };
    if (par > 0) return { valor: par, label: 'Paralelo', fallback: true };
    return { valor: 0, label: 'Sin tasa', fallback: true };
}

function convertirMontoFinanzasAUsd(montoInput, moneda, tasaModo) {
    var val = Math.max(0, Number(montoInput) || 0);
    var mon = (moneda === 'VES') ? 'VES' : 'USD';
    var tasaInfo = obtenerTasaConversionFinanzas(tasaModo);
    if (mon === 'VES') {
        if (!tasaInfo.valor || tasaInfo.valor <= 0) {
            return { valido: false, usd: 0, bs: val, tasaUsada: 0, tasaLabel: tasaInfo.label, monedaOrigen: 'VES' };
        }
        var usdConv = Math.round((val / tasaInfo.valor) * 100) / 100;
        return { valido: true, usd: usdConv, bs: Math.round(val * 100) / 100, tasaUsada: tasaInfo.valor, tasaLabel: tasaInfo.label, monedaOrigen: 'VES' };
    }
    var bsEq = tasaInfo.valor > 0 ? Math.round((val * tasaInfo.valor) * 100) / 100 : 0;
    return { valido: true, usd: Math.round(val * 100) / 100, bs: bsEq, tasaUsada: tasaInfo.valor || 0, tasaLabel: tasaInfo.label, monedaOrigen: 'USD' };
}

function esItemRecurrenteMensualReal(item, esGasto) {
    if (!item) return false;
    if (esGasto) {
        if (item.tipo === 'ocasional' || item.esPrestamo || item.fechaManualFija) return false;
        if (item.tipo !== 'programado' && !item.dia) return false;
        if (item.fecha && typeof item.fecha === 'string' && item.fecha.length >= 10) {
            if (!item.dia) return false;
            var diaF = parseInt(item.fecha.slice(8, 10), 10);
            var diaObj = parseInt(item.dia, 10);
            if (!isNaN(diaF) && !isNaN(diaObj) && diaF !== diaObj) {
                return true;
            }
            return false;
        }
        return true;
    }

    var info = clasificarOrigenIngreso(item);
    if (info.tipoDestino !== 'fija') return false;
    if (item.ventaId || item.cuotaId || item.prestamoGastoId || item.esCobroPrestamo || item.fechaManualFija) return false;
    var esBoomMesFijo = /^ING-BOOM-\d{4}-\d{2}/.test(String(item.id || ''));
    if (esBoomMesFijo) return false;
    if (item.fecha && typeof item.fecha === 'string' && item.fecha.length >= 10) {
        if (!item.dia) return false;
        var diaFI = parseInt(item.fecha.slice(8, 10), 10);
        var diaOI = parseInt(item.dia, 10);
        if (!isNaN(diaFI) && !isNaN(diaOI) && diaFI !== diaOI) {
            return true;
        }
        return false;
    }
    return true;
}

function sanearDatosFinanzasRecurrentesYCategorias(f) {
    if (!f) return;
    if (!Array.isArray(f.categoriasGastos) || f.categoriasGastos.length === 0) {
        f.categoriasGastos = JSON.parse(JSON.stringify(DEFAULT_STATE.finanzas.categoriasGastos));
    } else {
        var elimCats = (typeof APP_STATE !== 'undefined' && APP_STATE && APP_STATE._eliminados && Array.isArray(APP_STATE._eliminados.finanzas_categoriasGastos))
            ? APP_STATE._eliminados.finanzas_categoriasGastos
            : [];
        var tienePrestamosCat = f.categoriasGastos.some(function(c) {
            return c && (c.id === 'CAT-PRESTAMOS' || String(c.nombre || '').toLowerCase().indexOf('prestam') !== -1 || String(c.nombre || '').toLowerCase().indexOf('préstam') !== -1);
        });
        if (!tienePrestamosCat && elimCats.indexOf('CAT-PRESTAMOS') === -1) {
            var idxOtros = f.categoriasGastos.findIndex(function(c) { return c && c.id === 'CAT-OTROS'; });
            var catPres = { id: 'CAT-PRESTAMOS', nombre: 'Préstamos', icono: '🤝', color: '#38bdf8' };
            if (idxOtros >= 0) f.categoriasGastos.splice(idxOtros, 0, catPres);
            else f.categoriasGastos.push(catPres);
        }
    }

    (f.ingresos || []).forEach(function(item) {
        if (!item) return;
        if (esItemRecurrenteMensualReal(item, false) && item.fecha && typeof item.fecha === 'string' && item.fecha.length >= 10) {
            var dFecha = parseInt(item.fecha.slice(8, 10), 10);
            var dReg = parseInt(item.dia, 10);
            if (!isNaN(dFecha) && !isNaN(dReg) && dFecha !== dReg) {
                item.fecha = '';
            }
        } else if (!item.cobrado && /^ING-BOOM-\d{4}-\d{2}/.test(String(item.id || '')) && item.dia && item.fecha && typeof item.fecha === 'string' && item.fecha.length >= 10) {
            var dFechaB = parseInt(item.fecha.slice(8, 10), 10);
            var dRegB = parseInt(item.dia, 10);
            if (!isNaN(dFechaB) && !isNaN(dRegB) && dFechaB !== dRegB) {
                var ymB = String(item.id).slice(9, 16);
                item.fecha = ymB + '-' + String(Math.min(31, Math.max(1, dRegB))).padStart(2, '0');
            }
        }
    });

    (f.gastos || []).forEach(function(item) {
        if (!item) return;
        if (esItemRecurrenteMensualReal(item, true) && item.fecha && typeof item.fecha === 'string' && item.fecha.length >= 10) {
            var dFechaG = parseInt(item.fecha.slice(8, 10), 10);
            var dRegG = parseInt(item.dia, 10);
            if (!isNaN(dFechaG) && !isNaN(dRegG) && dFechaG !== dRegG) {
                item.fecha = '';
            }
        }
    });
}

function esCategoriaPrestamoNombre(nombreCat) {
    var c = String(nombreCat || '').toLowerCase().trim();
    return c.indexOf('prestam') !== -1 || c.indexOf('préstam') !== -1;
}

function alCambiarCategoriaEnModalGasto() {
    var inCat = document.getElementById('modal-gasto-categoria');
    var inPilar = document.getElementById('modal-gasto-pilar');
    var inFu = document.getElementById('modal-gasto-fuente');
    var lblFu = document.getElementById('label-modal-gasto-fuente');
    var lblFecha = document.getElementById('label-modal-gasto-fecha');
    var panelPres = document.getElementById('grupo-gasto-prestamo-panel');
    var inEditId = document.getElementById('modal-gasto-edit-id');
    var inTipo = document.getElementById('modal-gasto-tipo');
    if (!inCat) return;

    var esPres = esCategoriaPrestamoNombre(inCat.value);
    if (panelPres) {
        panelPres.style.display = esPres ? 'block' : 'none';
    }
    if (lblFu) {
        lblFu.textContent = esPres ? 'Concepto / Motivo del Préstamo (Opcional si pones persona):' : 'Nombre del Gasto / Concepto:';
    }
    if (lblFecha) {
        lblFecha.textContent = esPres ? 'Fecha en que entregas el préstamo:' : 'Fecha del Gasto:';
    }
    if (inFu) {
        inFu.placeholder = esPres ? 'Ej: Préstamo personal, Ayuda emergencia...' : 'Ej: Gasolina (todos los 16), Alquiler, Repuesto Moto...';
    }

    if (esPres) {
        if (typeof poblarDatalistPersonasFinanzas === 'function') poblarDatalistPersonasFinanzas();
        if (inPilar) inPilar.value = 'inversion';
        if (inTipo && inTipo.value !== 'ocasional' && !(inEditId && inEditId.value)) {
            seleccionarTipoGastoModal('ocasional');
        }
        var chkDesc = document.getElementById('modal-gasto-descontar-ahora');
        if (chkDesc && !(inEditId && inEditId.value)) chkDesc.checked = true;
        var inFechaUnica = document.getElementById('modal-gasto-prestamo-fecha-unica');
        if (inFechaUnica && !inFechaUnica.value) {
            var prox = new Date();
            prox.setDate(prox.getDate() + 15);
            inFechaUnica.value = prox.toISOString().slice(0, 10);
        }
        if (typeof actualizarResumenPartesPrestamoUI === 'function') actualizarResumenPartesPrestamoUI();
    } else if (inPilar) {
        var cat = inCat.value.toLowerCase();
        if (cat.indexOf('invers') !== -1 || cat.indexOf('trabajo') !== -1 || cat.indexOf('negocio') !== -1) {
            inPilar.value = 'inversion';
        } else if (cat.indexOf('entretenimiento') !== -1 || cat.indexOf('ocio') !== -1 || cat.indexOf('capricho') !== -1 || cat.indexOf('juego') !== -1 || cat.indexOf('divers') !== -1) {
            inPilar.value = 'caprichos';
        } else {
            inPilar.value = 'gastos';
        }
    }
    var boxFreno = document.getElementById('contenedor-freno-impulso-modal-gasto');
    if (boxFreno && esPres) {
        boxFreno.style.display = 'none';
    } else if (typeof alCambiarMontoGastoModal === 'function') {
        var inMontoG = document.getElementById('modal-gasto-monto');
        if (inMontoG && inMontoG.value) alCambiarMontoGastoModal(inMontoG.value);
    }
}

function obtenerPilarGasto(gasto) {
    if (gasto.pilar && (gasto.pilar === 'inversion' || gasto.pilar === 'gastos' || gasto.pilar === 'caprichos')) {
        return gasto.pilar;
    }
    var cat = (gasto.categoria || "").toLowerCase();
    if (cat.indexOf('invers') !== -1 || cat.indexOf('trabajo') !== -1 || cat.indexOf('negocio') !== -1 || cat.indexOf('prestam') !== -1 || cat.indexOf('préstam') !== -1) {
        return 'inversion';
    }
    if (cat.indexOf('entretenimiento') !== -1 || cat.indexOf('ocio') !== -1 || cat.indexOf('capricho') !== -1 || cat.indexOf('juego') !== -1 || cat.indexOf('divers') !== -1 || cat.indexOf('salida') !== -1) {
        return 'caprichos';
    }
    return 'gastos';
}

function clasificarOrigenIngreso(item) {
    if (!item) return { tipoDestino: 'fija', origen: 'general', origenId: 'FIJA', nombreOrigen: 'Finanza Personal', icono: '📅', badgeHtml: '' };

    var desc = ((item.fuente || item.concepto || item.descripcion || item.nombre || '') + ' ' + (item.categoria || '')).toLowerCase();
    var idStr = String(item.id || '').toLowerCase();
    var tipoRaw = String(item.tipo || '').toLowerCase();

    // 0. Cobro de Préstamo otorgado desde Salidas -> Entrada Aleatoria programada por fecha exacta
    if (item.esCobroPrestamo || item.prestamoGastoId || idStr.indexOf('ing-prest-') === 0) {
        var nomPer = item.personaPrestamo ? (' · ' + escaparHTML(item.personaPrestamo)) : '';
        return {
            tipoDestino: 'aleatoria',
            origen: 'prestamo',
            origenId: 'PRESTAMO',
            nombreOrigen: 'Préstamo',
            icono: '🤝',
            badgeHtml: '<span class="badge-prestamo-fin">🤝 Cobro Préstamo' + nomPer + '</span>'
        };
    }

    // 1. Boom Solutions -> Entrada Fija Mensual (Sueldo)
    if (item.origenLabor === 'LAB-BOOM' || item.laborId === 'LAB-BOOM' || idStr.indexOf('boom') !== -1 || desc.indexOf('boom') !== -1) {
        return {
            tipoDestino: 'fija',
            origen: 'labor',
            origenId: 'LAB-BOOM',
            nombreOrigen: 'Boom Solutions',
            icono: '🚀',
            badgeHtml: '<span class="badge-cat" style="background: rgba(99, 102, 241, 0.18); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.35); font-weight: 700;">🚀 Labor: Boom Solutions</span>'
        };
    }

    // 2. Personal Trainer -> Entrada Fija Mensual
    if (item.origenLabor === 'LAB-TRAINER' || item.laborId === 'LAB-TRAINER' || idStr.indexOf('trainer') !== -1 || desc.indexOf('trainer') !== -1 || desc.indexOf('entrenamiento') !== -1 || desc.indexOf('coaching') !== -1) {
        return {
            tipoDestino: 'fija',
            origen: 'labor',
            origenId: 'LAB-TRAINER',
            nombreOrigen: 'Personal Trainer',
            icono: '🏋️',
            badgeHtml: '<span class="badge-cat" style="background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); font-weight: 700;">🏋️ Labor: Personal Trainer</span>'
        };
    }

    // 3. Barbería -> Entrada Aleatoria (Variable por cortes)
    if (item.origenLabor === 'LAB-BARBER' || item.laborId === 'LAB-BARBER' || idStr.indexOf('barber') !== -1 || desc.indexOf('barber') !== -1 || desc.indexOf('corte') !== -1 || desc.indexOf('degradado') !== -1) {
        return {
            tipoDestino: 'aleatoria',
            origen: 'labor',
            origenId: 'LAB-BARBER',
            nombreOrigen: 'Barbería',
            icono: '💈',
            badgeHtml: '<span class="badge-cat" style="background: rgba(56, 189, 248, 0.18); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); font-weight: 700;">💈 Labor: Barbería</span>'
        };
    }

    // 4. Almacén -> Ventas y créditos de inventario / ventas únicas personales
    if (item.ventaId || item.cuotaId || idStr.indexOf('almacen') !== -1 || idStr.indexOf('inv-') !== -1 || tipoRaw === 'almacen' || tipoRaw === 'credito' || desc.indexOf('almacén') !== -1 || desc.indexOf('almacen') !== -1 || desc.indexOf('producto') !== -1 || desc.indexOf('mercanc') !== -1) {
        var subTxt = item.ventaId ? (item.cuotaId ? 'Crédito Cuota' : 'Venta Contado') : 'Venta';
        if (item.esVentaUnica) {
            var subVU = item.cuotaId ? 'Cuota' : 'Contado';
            return {
                tipoDestino: 'almacen',
                origen: 'almacen',
                origenId: 'ALMACEN',
                nombreOrigen: 'Venta Única',
                icono: '✨',
                badgeHtml: '<span class="badge-cat" style="background: rgba(56, 189, 248, 0.16); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.35); font-weight: 700;">✨ Venta Única · ' + subVU + '</span>'
            };
        }
        return {
            tipoDestino: 'almacen',
            origen: 'almacen',
            origenId: 'ALMACEN',
            nombreOrigen: 'Almacén',
            icono: '📦',
            badgeHtml: '<span class="badge-cat" style="background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35); font-weight: 700;">📦 Almacén: ' + subTxt + '</span>'
        };
    }

    // 5. Entrada Fija General
    if (tipoRaw === 'fija' || item.dia !== undefined) {
        return {
            tipoDestino: 'fija',
            origen: 'general',
            origenId: 'FIJA',
            nombreOrigen: 'Finanza Personal',
            icono: '📅',
            badgeHtml: '<span class="badge-cat" style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.25);">📅 Finanza Personal</span>'
        };
    }

    // 6. Entrada Aleatoria General
    return {
        tipoDestino: 'aleatoria',
        origen: 'general',
        origenId: 'ALEATORIA',
        nombreOrigen: 'Entrada Aleatoria',
        icono: '⚡',
        badgeHtml: '<span class="badge-cat" style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.25);">⚡ Ingreso Variable</span>'
    };
}

function cambiarTabIngresos(tab) {
    ESTADO_FINANZAS.tabIngresosActivo = tab;
    var btnF = document.getElementById('tab-ingresos-fijos');
    var btnA = document.getElementById('tab-ingresos-aleatorios');
    var btnAlm = document.getElementById('tab-ingresos-almacen');
    var visF = document.getElementById('vista-ingresos-fijos');
    var visA = document.getElementById('vista-ingresos-aleatorios');
    var visAlm = document.getElementById('vista-ingresos-almacen');

    if (btnF) btnF.classList.remove('active');
    if (btnA) btnA.classList.remove('active');
    if (btnAlm) btnAlm.classList.remove('active');
    if (visF) visF.style.display = 'none';
    if (visA) visA.style.display = 'none';
    if (visAlm) visAlm.style.display = 'none';

    if (tab === 'fijos') {
        if (btnF) btnF.classList.add('active');
        if (visF) visF.style.display = 'block';
    } else if (tab === 'aleatorios') {
        if (btnA) btnA.classList.add('active');
        if (visA) visA.style.display = 'block';
    } else if (tab === 'almacen' || tab === 'almacen_labores') {
        if (btnAlm) btnAlm.classList.add('active');
        if (visAlm) visAlm.style.display = 'block';
    }
}

function seleccionarTipoIngresoModal(tipo) {
    var inTipo = document.getElementById('modal-ingreso-tipo');
    if (inTipo) inTipo.value = tipo;

    var btnF = document.getElementById('btn-modal-tipo-fija');
    var btnA = document.getElementById('btn-modal-tipo-aleatoria');
    var btnAlm = document.getElementById('btn-modal-tipo-almacen');
    var grpDia = document.getElementById('grupo-ingreso-dia');
    var grpFecha = document.getElementById('grupo-ingreso-fecha');
    var inF = document.getElementById('modal-ingreso-fuente');

    // Reset general de estilos
    [btnF, btnA, btnAlm].forEach(function(b) {
        if (b) {
            b.style.background = 'transparent';
            b.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            b.style.color = '#94a3b8';
        }
    });

    if (tipo === 'fija') {
        if (btnF) {
            btnF.style.background = '#1e263c';
            btnF.style.borderColor = '#38bdf8';
            btnF.style.color = '#38bdf8';
        }
        if (grpDia) grpDia.style.display = 'block';
        if (grpFecha) grpFecha.style.display = 'none';
        if (inF) inF.placeholder = "Ej: Sueldo Principal, Renta, Nómina...";
    } else if (tipo === 'almacen') {
        if (btnAlm) {
            btnAlm.style.background = '#1e263c';
            btnAlm.style.borderColor = '#c084fc';
            btnAlm.style.color = '#c084fc';
        }
        if (grpDia) grpDia.style.display = 'none';
        if (grpFecha) grpFecha.style.display = 'block';
        if (inF) inF.placeholder = "Ej: Venta de mercancía, Honorarios de diseño, Asesoría técnica...";

        var inFecha = document.getElementById('modal-ingreso-fecha');
        if (inFecha && !inFecha.value) {
            var hoy = new Date();
            var y = hoy.getFullYear();
            var m = String(hoy.getMonth() + 1).padStart(2, '0');
            var d = String(hoy.getDate()).padStart(2, '0');
            inFecha.value = y + '-' + m + '-' + d;
        }
    } else {
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

function construirBadgesTarjetasMovHTML(item) {
    if (!item || typeof asegurarArrayTarjetasFinanzas !== 'function') return '';
    var tarjetas = asegurarArrayTarjetasFinanzas();
    var dist = Array.isArray(item.tarjetasMovs) && item.tarjetasMovs.length > 0
        ? item.tarjetasMovs
        : (Array.isArray(item.tarjetasDistribucion) && item.tarjetasDistribucion.length > 0 ? item.tarjetasDistribucion : null);

    if (dist && dist.length > 0) {
        return dist.map(function(row) {
            if (!row || !row.tarjetaId) return '';
            var tObj = tarjetas.find(function(x) { return x.id === row.tarjetaId; });
            var nomT = tObj ? construirTituloTarjeta(tObj) : 'Tarjeta';
            var mU = Number(row.montoUsd || row.deltaUsdRef) || 0;
            var txtM = mU > 0 ? (' ($' + mU.toFixed(2) + ')') : '';
            return '<span class="badge-tarjeta-mov">💳 ' + escaparHTML(nomT) + txtM + '</span>';
        }).join('');
    }
    if (item.tarjetaId && item.tarjetaId !== '__EFECTIVO__') {
        var tSingle = tarjetas.find(function(x) { return x.id === item.tarjetaId; });
        var nomS = tSingle ? construirTituloTarjeta(tSingle) : 'Tarjeta';
        return '<span class="badge-tarjeta-mov">💳 ' + escaparHTML(nomS) + '</span>';
    }
    if (item.tarjetaId === '__EFECTIVO__') {
        return '<span class="badge-cat" style="background: rgba(148, 163, 184, 0.14); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.25);">💵 Efectivo</span>';
    }
    return '';
}

function renderizarFinanzas(fin) {
    var f = fin || APP_STATE.finanzas || DEFAULT_STATE.finanzas;

    // Sanear categorías base (incl. Préstamos) y fechas residuales en fijos/programados
    sanearDatosFinanzasRecurrentesYCategorias(f);

    var fechaMes = obtenerFechaMesFinanzas();
    var anioActivo = fechaMes.getFullYear();
    var mesActivo = fechaMes.getMonth();
    var semanasActivas = calcularSemanasDelMes(anioActivo, mesActivo);

    var vq = (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.vistaQuincena) || 'mes';
    if (vq !== 'mes') {
        var existeSem = semanasActivas.some(function(s) { return s.clave === vq; });
        if (!existeSem) {
            vq = semanasActivas.length > 0 ? semanasActivas[0].clave : 'mes';
            if (window.ESTADO_FINANZAS) window.ESTADO_FINANZAS.vistaQuincena = vq;
        }
    }
    var semanaActivaObj = semanasActivas.find(function(s) { return s.clave === vq; });

    // Renderizar barra compacta de una sola fila: stepper de semana con flechas (◀ Semana X ▶) + botón Mes Completo
    var barraSemanas = document.getElementById('quincena-selector-bar');
    if (barraSemanas) {
        var esMesActivo = (vq === 'mes');
        if (!esMesActivo && semanaActivaObj && window.ESTADO_FINANZAS) {
            window.ESTADO_FINANZAS.ultimaSemanaSeleccionada = semanaActivaObj.clave;
        }
        var claveFallback = (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.ultimaSemanaSeleccionada) || obtenerSemanaActualParaMes(anioActivo, mesActivo);
        var semMostrar = semanaActivaObj || semanasActivas.find(function(s) { return s.clave === claveFallback; }) || semanasActivas[0];
        var semIdx = semMostrar ? semanasActivas.indexOf(semMostrar) : 0;
        var semLabel = semMostrar ? semMostrar.etiqueta : 'Sem 1';
        var semTotalTxt = semanasActivas.length ? ((semIdx + 1) + '/' + semanasActivas.length) : '';
        var semClaveClick = semMostrar ? semMostrar.clave : 'sem1';

        barraSemanas.innerHTML = `
            <div class="fin-semana-stepper ${!esMesActivo ? 'is-active' : ''}" role="group" aria-label="Navegación semanal">
                <button type="button" class="fin-semana-arrow" onclick="navegarSemanaFinanzas(-1)" aria-label="Semana anterior" title="Semana anterior">◀</button>
                <button type="button" class="fin-semana-pill-btn ${!esMesActivo ? 'active' : ''}" id="btn-vista-semana-actual" onclick="cambiarPeriodoFinanzas('${semClaveClick}')" title="Ver solo ${semLabel}">
                    <span>🗓️</span>
                    <span class="fin-semana-label">${semLabel}</span>
                    ${semTotalTxt ? `<span class="fin-semana-counter">${semTotalTxt}</span>` : ''}
                </button>
                <button type="button" class="fin-semana-arrow" onclick="navegarSemanaFinanzas(1)" aria-label="Semana siguiente" title="Semana siguiente">▶</button>
            </div>
            <button type="button" class="btn-quincena-tab btn-mes-completo-toggle ${esMesActivo ? 'active' : ''}" id="btn-vista-mes" onclick="toggleMesCompletoFinanzas()" title="Alternar entre Mes Completo y la semana activa">
                <span>📅</span> Mes Completo
            </button>`;
    }

    var mesClaveVista = anioActivo + '-' + String(mesActivo + 1).padStart(2, '0');
    function coincideQuincena(dia, fechaStr, itemRef) {
        if (itemRef && itemRef.excepcionesMes && itemRef.excepcionesMes[mesClaveVista]) {
            fechaStr = itemRef.excepcionesMes[mesClaveVista];
        } else if (itemRef && esItemRecurrenteMensualReal(itemRef, itemRef.tipo === 'programado' || !!itemRef.categoria)) {
            fechaStr = '';
        }
        if (vq === 'mes') return true;
        if (semanaActivaObj) {
            // 1. Si viene con fecha ISO (YYYY-MM-DD), comparar con el rango exacto de la semana
            if (fechaStr && typeof fechaStr === 'string' && fechaStr.length >= 10) {
                return fechaStr >= semanaActivaObj.claveIni && fechaStr <= semanaActivaObj.claveFin;
            }
            // 2. Si solo tiene día numérico (ej: 5, 15, 30), evaluar si ese día está en los 7 días de la semana
            var d = parseInt(dia, 10);
            if (!isNaN(d) && semanaActivaObj.dias) {
                return semanaActivaObj.dias.indexOf(d) !== -1;
            }
            if (fechaStr && typeof fechaStr === 'string' && fechaStr.indexOf('-') !== -1) {
                var partes = fechaStr.split('-');
                if (partes.length >= 3) {
                    var dPart = parseInt(partes[2], 10);
                    if (!isNaN(dPart) && semanaActivaObj.dias) {
                        return semanaActivaObj.dias.indexOf(dPart) !== -1;
                    }
                }
            }
        }
        return true;
    }

    // 1. Cabecera
    var inNom = document.getElementById('finanzas-input-nombre');
    var inMes = document.getElementById('finanzas-input-mes');
    var inObj = document.getElementById('finanzas-input-objetivo');
    if (inNom) inNom.value = "Gabriel Arias";
    if (inMes) {
        var nombreMesDisplay = fechaMes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        nombreMesDisplay = nombreMesDisplay.charAt(0).toUpperCase() + nombreMesDisplay.slice(1);
        inMes.value = nombreMesDisplay;
    }
    if (inObj && f && f.cabecera) {
        inObj.value = f.cabecera.objetivo || "";
    }

    var retrasosResumen = (typeof obtenerRetrasosFinanzas === 'function')
        ? obtenerRetrasosFinanzas(f)
        : { todos: [], cobros: [], pagos: [], totalCount: 0, countCobros: 0, countPagos: 0, totalCobrosUsd: 0, totalPagosUsd: 0 };
    var retrasoMap = {};
    (retrasosResumen.todos || []).forEach(function(r) {
        if (r && r.uid) retrasoMap[r.uid] = r;
    });

    // 2. Ingresos (Separados en Fijos vs Aleatorios vs Almacén & Labores y Filtrados por Quincena)
    var totIngresosMes = 0;       // Proyección total del mes completo (para Regla 50/40/10)
    var totIngresosVista = 0;     // Total del período seleccionado (mes, q1 o q2)
    var ingresosCobradosVista = 0;   // Dinero real en cuenta (cobrado: true)
    var ingresosPendientesVista = 0; // Dinero por cobrar (cobrado: false)

    var totFijos = 0;
    var totAleatorios = 0;
    var totAlmacen = 0;
    var countFijos = 0;
    var countAleatorios = 0;
    var countAlmacen = 0;

    var htmlFijos = '';
    var htmlAleatorios = '';
    var htmlAlmacen = '';

    (f.ingresos || []).forEach(function(item) {
        var m = Number(item.monto) || 0;
        totIngresosMes += m;

        var aplicaVista = coincideQuincena(item.dia, item.fecha, item);
        if (!aplicaVista) return;

        totIngresosVista += m;
        var estaCobrado = !!item.cobrado;
        var montoRealCobrado = (estaCobrado && item.montoCobrado !== undefined && item.montoCobrado !== null && item.montoCobrado !== "")
            ? Number(item.montoCobrado)
            : m;

        if (estaCobrado) {
            ingresosCobradosVista += montoRealCobrado;
        } else {
            ingresosPendientesVista += m;
        }

        var badgeCobroHtml = estaCobrado
            ? `<span class="badge-ingreso-cobrado" title="Cobro registrado">✅ EN CUENTA ($${montoRealCobrado.toFixed(2)})</span>
               <button class="btn-cobrar-ingreso btn-deshacer-cobro" onclick="deshacerCobroIngresoUI('${item.id}')" title="Desmarcar dinero en cuenta">↩</button>`
            : `<span class="badge-ingreso-pendiente">⏳ Pendiente</span>
               <button class="btn-cobrar-ingreso" onclick="cobrarIngresoUI('${item.id}')" title="Sumar este dinero a mi cuenta real">💰 Sumar a Cuenta</button>`;

        var infoOrigen = clasificarOrigenIngreso(item);
        item.tipo = infoOrigen.tipoDestino;

        var tituloIngreso = item.fuente || item.concepto || item.nombre || item.titulo || item.descripcion || (infoOrigen.tipoDestino === 'almacen' ? 'Venta Almacén' : 'Entrada de Ingreso');
        
        var displayMontoHtml = estaCobrado && Math.abs(montoRealCobrado - m) > 0.001
            ? `<div style="text-align: right;">
                   <div class="finanzas-tx-monto monto-positivo">+$${montoRealCobrado.toFixed(2)}</div>
                   <div style="font-size: 11px; color: #64748b;">(Plan: $${m.toFixed(2)})</div>
               </div>`
            : `<div class="finanzas-tx-monto monto-positivo">+$${(estaCobrado ? montoRealCobrado : m).toFixed(2)}</div>`;

        var fechaStr = item.fecha || ('Día ' + (item.dia || 15));
        var esRecIng = esItemRecurrenteMensualReal(item, false);
        var fechaEffIng = resolverFechaEfectivaMovFinanzas(item, esRecIng, anioActivo, mesActivo);
        var excMesIng = (esRecIng && item.excepcionesMes && typeof item.excepcionesMes[mesClaveVista] === 'string') ? item.excepcionesMes[mesClaveVista] : '';
        var retIng = !estaCobrado ? retrasoMap['ingreso:' + item.id] : null;
        var clsOverdueIng = retIng ? ' is-overdue' : '';
        var badgeRetrasoIngHtml = retIng
            ? `<span class="cuota-badge-vencida">🚨 Retrasado · ${retIng.diasRetraso}d</span>`
            : '';
        var tarjetasIngHtml = construirBadgesTarjetasMovHTML(item);
        var badgeConvIngHtml = (item.monedaOrigen === 'VES' && item.montoOriginalBs > 0)
            ? `<span class="badge-cat" style="background: rgba(56, 189, 248, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2);">Bs. ${Number(item.montoOriginalBs).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`
            : '';
        var btnReprogIngHtml = !estaCobrado
            ? `<button type="button" class="btn-mover-fecha-fin" onclick="abrirModalMoverFechaFinanza('ingreso', '${item.id}', '', '${retIng ? retIng.mesOrigenRegla : mesClaveVista}', '${retIng ? retIng.fechaISO : fechaEffIng}', ${esRecIng ? 'true' : 'false'})" title="Reprogramar fecha">📅 Reprogramar</button>`
            : '';
        var btnEditIngHtml = `<button type="button" class="btn-edit-mov-fin" onclick="editarIngresoFinanzasUI('${item.id}')" title="Editar / asignar tarjetas">✏️</button>`;

        if (infoOrigen.tipoDestino === 'almacen') {
            totAlmacen += m;
            countAlmacen++;

            htmlAlmacen += `
            <div class="finanzas-tx-item${clsOverdueIng}">
                <div class="finanzas-tx-main">
                    <div class="finanzas-tx-icon" style="color: #f59e0b;">${infoOrigen.icono}</div>
                    <div class="finanzas-tx-details">
                        <div class="finanzas-tx-title">${tituloIngreso}</div>
                        <div class="finanzas-tx-meta" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                            ${infoOrigen.badgeHtml}
                            ${badgeRetrasoIngHtml}
                            ${tarjetasIngHtml}
                            <span class="badge-cat" style="background: rgba(255, 255, 255, 0.05); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.1);">
                                📅 ${fechaStr}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="finanzas-tx-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                    ${displayMontoHtml}
                    ${badgeCobroHtml}
                    ${btnReprogIngHtml}
                    ${btnEditIngHtml}
                    <button class="btn-delete-row" title="Eliminar entrada" onclick="eliminarRegistroFinanzasUI('${item.id}', 'ingreso')">✕</button>
                </div>
            </div>`;
        } else if (infoOrigen.tipoDestino === 'aleatoria') {
            totAleatorios += m;
            countAleatorios++;

            htmlAleatorios += `
            <div class="finanzas-tx-item${clsOverdueIng}">
                <div class="finanzas-tx-main">
                    <div class="finanzas-tx-icon" style="color: #38bdf8;">${infoOrigen.icono}</div>
                    <div class="finanzas-tx-details">
                        <div class="finanzas-tx-title">${tituloIngreso}</div>
                        <div class="finanzas-tx-meta" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                            ${infoOrigen.badgeHtml}
                            ${badgeRetrasoIngHtml}
                            ${tarjetasIngHtml}
                            ${badgeConvIngHtml}
                            <span class="badge-cat" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
                                ⚡ ${fechaStr}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="finanzas-tx-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                    ${displayMontoHtml}
                    ${badgeCobroHtml}
                    ${btnReprogIngHtml}
                    ${btnEditIngHtml}
                    <button class="btn-delete-row" title="Eliminar entrada" onclick="eliminarRegistroFinanzasUI('${item.id}', 'ingreso')">✕</button>
                </div>
            </div>`;
        } else {
            totFijos += m;
            countFijos++;
            var diaNum = item.dia || 15;
            var badgeFechaFijaHtml = excMesIng
                ? `<span class="badge-cat" style="background: rgba(245, 158, 11, 0.16); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.32);">📅 Este mes: ${formatearFechaCorta(excMesIng)} (Base Día ${diaNum})</span>`
                : `<span class="badge-cat" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">📅 Cobro Día ${diaNum} de cada mes</span>`;

            htmlFijos += `
            <div class="finanzas-tx-item${clsOverdueIng}">
                <div class="finanzas-tx-main">
                    <div class="finanzas-tx-icon" style="color: #34d399;">${infoOrigen.icono}</div>
                    <div class="finanzas-tx-details">
                        <div class="finanzas-tx-title">${tituloIngreso}</div>
                        <div class="finanzas-tx-meta" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                            ${infoOrigen.badgeHtml}
                            ${badgeRetrasoIngHtml}
                            ${tarjetasIngHtml}
                            ${badgeConvIngHtml}
                            ${badgeFechaFijaHtml}
                        </div>
                    </div>
                </div>
                <div class="finanzas-tx-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                    ${displayMontoHtml}
                    ${badgeCobroHtml}
                    ${btnReprogIngHtml}
                    ${btnEditIngHtml}
                    <button class="btn-delete-row" title="Eliminar entrada" onclick="eliminarRegistroFinanzasUI('${item.id}', 'ingreso')">✕</button>
                </div>
            </div>`;
        }
    });

    if (countFijos === 0) {
        htmlFijos = `<div class="finanzas-empty-hint">Sin entradas fijas programadas para ${obtenerNombrePeriodo(vq)}.</div>`;
    }
    if (countAleatorios === 0) {
        htmlAleatorios = `<div class="finanzas-empty-hint">Sin entradas variables para ${obtenerNombrePeriodo(vq)}.</div>`;
    }
    if (countAlmacen === 0) {
        htmlAlmacen = `<div class="finanzas-empty-hint">Sin ventas o entradas de almacén para ${obtenerNombrePeriodo(vq)}.</div>`;
    }

    var elContFijos = document.getElementById('lista-ingresos-fijos');
    if (elContFijos) elContFijos.innerHTML = htmlFijos;

    var elContAleatorios = document.getElementById('lista-ingresos-aleatorios');
    if (elContAleatorios) elContAleatorios.innerHTML = htmlAleatorios;

    var elContAlmacen = document.getElementById('lista-ingresos-almacen');
    if (elContAlmacen) elContAlmacen.innerHTML = htmlAlmacen;

    // Badges y Subtotales de Ingresos
    var bCountF = document.getElementById('badge-count-fijos');
    if (bCountF) bCountF.innerText = countFijos;
    var bCountA = document.getElementById('badge-count-aleatorios');
    if (bCountA) bCountA.innerText = countAleatorios;
    var bCountAlm = document.getElementById('badge-count-almacen');
    if (bCountAlm) bCountAlm.innerText = countAlmacen;

    var subF = document.getElementById('subtotal-ingresos-fijos');
    if (subF) subF.innerText = '$' + totFijos.toFixed(2);
    var subA = document.getElementById('subtotal-ingresos-aleatorios');
    if (subA) subA.innerText = '$' + totAleatorios.toFixed(2);
    var subAlm = document.getElementById('subtotal-ingresos-almacen');
    if (subAlm) subAlm.innerText = '$' + totAlmacen.toFixed(2);

    // Total General Ingresos
    var totalIngEl = document.getElementById('label-total-ingresos') || document.getElementById('total-ingresos-display');
    if (totalIngEl) totalIngEl.innerText = '$' + totIngresosVista.toFixed(2);

    // Dinero Real en Cuenta vs Por Cobrar
    var resDineroRealEl = document.getElementById('resumen-dinero-real');
    if (resDineroRealEl) resDineroRealEl.innerText = '$' + ingresosCobradosVista.toFixed(2);
    var resPorCobrarTxt = document.getElementById('resumen-por-cobrar-txt');
    if (resPorCobrarTxt) resPorCobrarTxt.innerText = 'Pendiente: $' + ingresosPendientesVista.toFixed(2);

    // 3. Gastos (Programados vs Ocasionales, Pilares 50/40/10 y Categorías)
    var totGastos = 0;
    var totGastosPagados = 0;
    var countProg = 0;
    var countOcas = 0;

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

    // Cuotas Abonadas a Metas en la Quincena / Mes (Cuentan como Inversión Real)
    var cuotasAbonadasVista = 0;
    (f.aportesMetas || []).forEach(function(ap) {
        if (coincideQuincena(ap.dia, ap.fecha)) {
            cuotasAbonadasVista += (Number(ap.monto) || 0);
        }
    });

    var realInversionVista = cuotasAbonadasVista; // Inversión real arranca con cuotas a metas de ahorro
    var realGastosVista = 0;
    var realCaprichosVista = 0;

    var filtroG = (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.filtroGastos) || 'todos';

    (f.gastos || []).forEach(function(item) {
        if (!coincideQuincena(item.dia, item.fecha, item)) return;

        var m = Number(item.monto) || 0;
        totGastos += m;
        if (item.pagado) totGastosPagados += m;

        var esOcas = item.tipo === 'ocasional';
        if (esOcas) {
            countOcas++;
        } else {
            countProg++;
        }

        var pilar = obtenerPilarGasto(item);
        if (pilar === 'inversion') {
            realInversionVista += m;
        } else if (pilar === 'caprichos') {
            realCaprichosVista += m;
        } else {
            realGastosVista += m;
        }

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

        // Respetar filtro de gastos si está activo
        var incluirEnLista = true;
        if (filtroG === 'programados' && esOcas) incluirEnLista = false;
        if (filtroG === 'ocasionales' && !esOcas) incluirEnLista = false;

        if (incluirEnLista) {
            gastosAgrupados[catNombre].items.push(item);
            gastosAgrupados[catNombre].subtotal += m;
        }
    });

    // Actualizar badges en tabs de gastos
    var bGProg = document.getElementById('badge-count-gastos-prog');
    var bGOcas = document.getElementById('badge-count-gastos-ocas');
    if (bGProg) bGProg.innerText = countProg;
    if (bGOcas) bGOcas.innerText = countOcas;

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
                var estAbG = (typeof normalizarAbonosGasto === 'function')
                    ? normalizarAbonosGasto(gasto)
                    : { total: Number(gasto.monto) || 0, abonado: Number(gasto.montoAbonado) || 0 };
                var gm = Number(gasto.monto) || 0;
                var gDia = gasto.dia || 16;
                var esOcasG = gasto.tipo === 'ocasional';
                var pilarG = obtenerPilarGasto(gasto);
                var estaPagadoG = !!gasto.pagado;
                var esRecG = esItemRecurrenteMensualReal(gasto, true);
                var fechaEffG = resolverFechaEfectivaMovFinanzas(gasto, esRecG, anioActivo, mesActivo);
                var excMesG = (esRecG && gasto.excepcionesMes && typeof gasto.excepcionesMes[mesClaveVista] === 'string') ? gasto.excepcionesMes[mesClaveVista] : '';
                var retG = !estaPagadoG ? retrasoMap['gasto:' + gasto.id] : null;
                var clsOverdueG = retG ? ' is-overdue' : '';

                var badgeTipoHtml = esOcasG
                    ? `<span class="badge-gasto-ocasional">⚡ ${gasto.fecha || 'Ocasional'}</span>`
                    : (excMesG
                        ? `<span class="badge-gasto-programado">📅 Este mes: ${formatearFechaCorta(excMesG)} (Base Día ${gDia})</span>`
                        : `<span class="badge-gasto-programado">📅 Día ${gDia} (Fijo)</span>`);

                var badgeRetrasoGHtml = retG
                    ? `<span class="cuota-badge-vencida">🚨 Retrasado · ${retG.diasRetraso}d</span>`
                    : '';

                var badgePilarHtml = '';
                if (pilarG === 'inversion') badgePilarHtml = `<span class="badge-pilar-inversion">🚀 50% Inversión</span>`;
                else if (pilarG === 'caprichos') badgePilarHtml = `<span class="badge-pilar-caprichos">🎉 10% Caprichos</span>`;
                else badgePilarHtml = `<span class="badge-pilar-gastos">🏠 40% Fijos</span>`;

                var tarjetasGasHtml = construirBadgesTarjetasMovHTML(gasto);
                var badgeConvGasHtml = (gasto.monedaOrigen === 'VES' && gasto.montoOriginalBs > 0)
                    ? `<span class="badge-cat" style="background: rgba(56, 189, 248, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2);">Bs. ${Number(gasto.montoOriginalBs).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`
                    : '';
                var badgePrestamoGasHtml = '';
                if (gasto.esPrestamo || esCategoriaPrestamoNombre(gasto.categoria)) {
                    var ingresosPrestLinked = (f.ingresos || []).filter(function(ig) { return ig && ig.prestamoGastoId === gasto.id; });
                    var cobradosP = ingresosPrestLinked.filter(function(ig) { return !!ig.cobrado; }).length;
                    var totalP = ingresosPrestLinked.length || (Array.isArray(gasto.cuotasPrestamo) ? gasto.cuotasPrestamo.length : 1);
                    var perNom = gasto.personaPrestamo ? ('A: ' + escaparHTML(gasto.personaPrestamo)) : 'Préstamo';
                    badgePrestamoGasHtml = `<span class="badge-prestamo-fin">🤝 ${perNom} · ${cobradosP}/${totalP} cobrado${totalP === 1 ? '' : 's'}</span>`;
                }

                var badgeAbonoHtml = (!estaPagadoG && estAbG.abonado > 0.009)
                    ? `<span class="badge-pilar-inversion" style="background: rgba(56, 189, 248, 0.14); color: #38bdf8;">💸 Abonado: $${estAbG.abonado.toFixed(2)} / $${gm.toFixed(2)}</span>`
                    : '';

                var badgePagoHtml = estaPagadoG
                    ? `<span class="badge-ingreso-cobrado">✅ PAGADO</span>
                       <button class="btn-cobrar-ingreso btn-deshacer-cobro" onclick="deshacerPagoGastoUI('${gasto.id}')" title="Desmarcar pago">↩</button>`
                    : `<button class="btn-pagar-deuda" onclick="pagarGastoUI('${gasto.id}')" title="Marcar como pagado / debitado">💳 Marcar Pagado</button>
                       <button type="button" class="btn-mover-fecha-fin" onclick="abrirModalMoverFechaFinanza('gasto', '${gasto.id}', '', '${retG ? retG.mesOrigenRegla : mesClaveVista}', '${retG ? retG.fechaISO : fechaEffG}', ${esRecG ? 'true' : 'false'})" title="Reprogramar fecha">📅 Reprogramar</button>`;

                htmlGrupos += `
                    <div class="finanzas-tx-item${clsOverdueG}" style="background: rgba(255, 255, 255, 0.02); margin-bottom: 6px; ${estaPagadoG ? 'opacity: 0.85;' : ''}">
                        <div class="finanzas-tx-main">
                            <div class="finanzas-tx-details">
                                <div class="finanzas-tx-title" style="${estaPagadoG ? 'color: #f8fafc;' : ''}">${gasto.concepto}</div>
                                <div class="finanzas-tx-meta" style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 3px;">
                                    ${badgeTipoHtml}
                                    ${badgeRetrasoGHtml}
                                    ${badgePrestamoGasHtml}
                                    ${tarjetasGasHtml}
                                    ${badgeConvGasHtml}
                                    ${badgePilarHtml}
                                    ${badgeAbonoHtml}
                                </div>
                            </div>
                        </div>
                        <div class="finanzas-tx-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                            <div class="finanzas-tx-monto monto-negativo">-$${gm.toFixed(2)}</div>
                            ${badgePagoHtml}
                            <button type="button" class="btn-edit-mov-fin" onclick="editarGastoFinanzasUI('${gasto.id}')" title="Editar salida / tarjeta">✏️</button>
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
                <div>Sin gastos registrados para ${filtroG === 'programados' ? 'la sección de Programados' : (filtroG === 'ocasionales' ? 'la sección de Ocasionales' : obtenerNombrePeriodo(vq))}.</div>
                <div style="font-size: 11.5px; margin-top: 4px; color: #64748b;">Usa el botón "+ Gasto Programado" o "+ Gasto Ocasional" para clasificar tus salidas.</div>
            </div>`;
        }

        contGastosCat.innerHTML = htmlGrupos;
    }

    // Actualizar etiquetas de Total Gastos
    var totalGasEl = document.getElementById('label-total-gastos') || document.getElementById('total-gastos-display');
    if (totalGasEl) totalGasEl.innerText = '$' + totGastos.toFixed(2);
    var resGasEl = document.getElementById('resumen-total-gastos');
    if (resGasEl) resGasEl.innerText = '$' + totGastos.toFixed(2);

    // 4. Regla 50 / 40 / 10 (Estimado vs Real para el Período Activo)
    var baseCalculoRegla = totIngresosVista > 0 ? totIngresosVista : totIngresosMes;
    var meta50 = baseCalculoRegla * 0.50; // 50% Inversión y Multiplicación
    var meta40 = baseCalculoRegla * 0.40; // 40% Gastos Fijos y Necesidades
    var meta10 = baseCalculoRegla * 0.10; // 10% Caprichos y Ocio

    // Actualizar subtítulo del período en la regla
    var reglaSub = document.getElementById('regla-subtitulo-periodo');
    if (reglaSub) {
        reglaSub.innerText = `${obtenerTituloPeriodo(vq)} · Base: $${baseCalculoRegla.toFixed(2)}`;
    }

    // Tarjeta 50% Inversión
    var el50Monto = document.getElementById('regla-monto-50') || document.getElementById('regla-50-monto');
    var el50Real = document.getElementById('regla-real-50');
    var el50Fill = document.getElementById('regla-bar-fill-50');
    var el50PctLbl = document.getElementById('regla-pct-label-50');
    var el50Tag = document.getElementById('regla-tag-50');
    if (el50Monto) el50Monto.innerText = '$' + meta50.toFixed(2);
    if (el50Real) el50Real.innerText = '$' + realInversionVista.toFixed(2);
    var pct50 = meta50 > 0 ? Math.round((realInversionVista / meta50) * 100) : 0;
    if (el50Fill) {
        el50Fill.style.width = Math.min(100, pct50) + '%';
        el50Fill.style.background = pct50 >= 100 ? '#10b981' : '#06b6d4';
    }
    if (el50PctLbl) el50PctLbl.innerText = pct50 + '% de meta';
    if (el50Tag) {
        if (pct50 >= 100) {
            el50Tag.innerText = "⭐ Meta Cumplida";
            el50Tag.style.background = "rgba(16, 185, 129, 0.15)";
            el50Tag.style.color = "#34d399";
        } else {
            el50Tag.innerText = "En curso";
            el50Tag.style.background = "rgba(6, 182, 212, 0.15)";
            el50Tag.style.color = "#22d3ee";
        }
    }

    // Tarjeta 40% Gastos Fijos
    var el40Monto = document.getElementById('regla-monto-40') || document.getElementById('regla-40-monto');
    var el40Real = document.getElementById('regla-real-40');
    var el40Fill = document.getElementById('regla-bar-fill-40');
    var el40PctLbl = document.getElementById('regla-pct-label-40');
    var el40Tag = document.getElementById('regla-tag-40');
    if (el40Monto) el40Monto.innerText = '$' + meta40.toFixed(2);
    if (el40Real) el40Real.innerText = '$' + realGastosVista.toFixed(2);
    var pct40 = meta40 > 0 ? Math.round((realGastosVista / meta40) * 100) : 0;
    if (el40Fill) {
        el40Fill.style.width = Math.min(100, pct40) + '%';
        el40Fill.style.background = pct40 > 100 ? '#ef4444' : '#f59e0b';
    }
    if (el40PctLbl) el40PctLbl.innerText = pct40 + '% de límite';
    if (el40Tag) {
        if (pct40 > 100) {
            el40Tag.innerText = `⚠️ Excedido (+$${(realGastosVista - meta40).toFixed(2)})`;
            el40Tag.style.background = "rgba(239, 68, 68, 0.15)";
            el40Tag.style.color = "#f87171";
        } else {
            el40Tag.innerText = "Dentro de límite";
            el40Tag.style.background = "rgba(245, 158, 11, 0.15)";
            el40Tag.style.color = "#fbbf24";
        }
    }

    // Tarjeta 10% Caprichos
    var el10Monto = document.getElementById('regla-monto-10') || document.getElementById('regla-10-monto');
    var el10Real = document.getElementById('regla-real-10');
    var el10Fill = document.getElementById('regla-bar-fill-10');
    var el10PctLbl = document.getElementById('regla-pct-label-10');
    var el10Tag = document.getElementById('regla-tag-10');
    if (el10Monto) el10Monto.innerText = '$' + meta10.toFixed(2);
    if (el10Real) el10Real.innerText = '$' + realCaprichosVista.toFixed(2);
    var pct10 = meta10 > 0 ? Math.round((realCaprichosVista / meta10) * 100) : 0;
    if (el10Fill) {
        el10Fill.style.width = Math.min(100, pct10) + '%';
        el10Fill.style.background = pct10 > 100 ? '#f43f5e' : '#ec4899';
    }
    if (el10PctLbl) el10PctLbl.innerText = pct10 + '% de límite';
    if (el10Tag) {
        if (pct10 > 100) {
            el10Tag.innerText = `⚠️ Excedido (+$${(realCaprichosVista - meta10).toFixed(2)})`;
            el10Tag.style.background = "rgba(244, 63, 94, 0.15)";
            el10Tag.style.color = "#f43f5e";
        } else {
            el10Tag.innerText = "Dentro de límite";
            el10Tag.style.background = "rgba(236, 72, 153, 0.15)";
            el10Tag.style.color = "#f472b6";
        }
    }

    // Actualizar tarjeta métrica superior: 50% Inversión y Multiplicación
    var resInversionEl = document.getElementById('resumen-total-inversion') || document.getElementById('resumen-total-ahorro-inversion');
    if (resInversionEl) resInversionEl.innerText = '$' + meta50.toFixed(2);

    // 5. Deudas y Cronograma de Pagos (Créditos en Cuotas)
    var resDeudas = renderizarDeudasYCronograma(f, vq, coincideQuincena);
    var totDeudasPendientes = resDeudas.totPendientes;
    var totDeudasPagadas = resDeudas.totPagadas;
    var deudasPagadasPeriodo = Number(resDeudas.pagadasPeriodo) || 0;
    var deudasPendientesPeriodo = Number(resDeudas.pendientesPeriodo) || 0;

    var badgePlanDeu = document.getElementById('badge-plan-deudas-count');
    if (badgePlanDeu) {
        if (resDeudas.activasCount > 0) {
            badgePlanDeu.textContent = String(resDeudas.activasCount);
            badgePlanDeu.style.display = 'inline-flex';
        } else {
            badgePlanDeu.style.display = 'none';
        }
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
            htmlMetas = '<div class="finanzas-empty-hint" style="grid-column: 1/-1;">No hay metas de ahorro registradas. Agrega una nueva meta con el botón superior.</div>';
        }
        gridMetas.innerHTML = htmlMetas;
    }

    var badgePlanMet = document.getElementById('badge-plan-metas-count');
    if (badgePlanMet) {
        var metasActivas = (f.metas || []).filter(function(m) { return (Number(m.ahorrado) || 0) < (Number(m.metaTotal) || 0) - 0.009; }).length;
        if (metasActivas > 0) {
            badgePlanMet.textContent = String(metasActivas);
            badgePlanMet.style.display = 'inline-flex';
        } else {
            badgePlanMet.style.display = 'none';
        }
    }

    var resDeuSub = document.getElementById('resumen-deudas-sub-txt');
    if (resDeuSub) {
        resDeuSub.textContent = 'Cuotas período: $' + (deudasPagadasPeriodo + deudasPendientesPeriodo).toFixed(2);
    }

    var badgeMov = document.getElementById('badge-finanzas-mov-count');
    if (badgeMov) {
        var movTotCount = (countFijos + countAleatorios + countAlmacen) + (countProg + countOcas);
        if (movTotCount > 0) {
            badgeMov.textContent = String(movTotCount);
            badgeMov.style.display = 'inline-flex';
        } else {
            badgeMov.style.display = 'none';
        }
    }
    var movPerLbl = document.getElementById('movimientos-periodo-label');
    if (movPerLbl) {
        movPerLbl.textContent = obtenerTituloPeriodo(vq);
    }

    // 7. Fórmula de Liquidez Real (Balance Neto Libre del Período)
    var balanceRealEnMano = ingresosCobradosVista - totGastos - cuotasAbonadasVista - deudasPagadasPeriodo;
    var compromisosPeriodo = totGastos + cuotasAbonadasVista + deudasPendientesPeriodo + deudasPagadasPeriodo;
    var balanceProyectado = totIngresosVista - compromisosPeriodo;

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
    if (bDeudas) bDeudas.innerHTML = `Cuotas Deuda: <strong>$${deudasPagadasPeriodo.toFixed(2)}</strong>`;
    if (bResultado) {
        bResultado.innerText = (balanceRealEnMano >= 0 ? '+$' : '-$') + Math.abs(balanceRealEnMano).toFixed(2) + ' (Período)';
        bResultado.style.color = balanceRealEnMano >= 0 ? '#34d399' : '#f87171';
    }
    if (bProyeccion) {
        var titProy = vq === 'mes' ? 'Fin de Mes' : obtenerTituloPeriodo(vq);
        bProyeccion.innerHTML = `🔮 Proyección ${titProy}: Ingresos ($${totIngresosVista.toFixed(2)}) - Compromisos período ($${compromisosPeriodo.toFixed(2)}) = <strong style="color: ${balanceProyectado >= 0 ? '#34d399' : '#f87171'};">${balanceProyectado >= 0 ? '+$' : '-$'}${Math.abs(balanceProyectado).toFixed(2)}</strong>`;
    }

    var badgeEstado = document.getElementById('badge-balance-estado');
    if (badgeEstado) {
        if (balanceRealEnMano >= 0) {
            badgeEstado.innerText = "FLUJO SALUDABLE (DISPONIBLE)";
            badgeEstado.style.background = "rgba(16, 185, 129, 0.15)";
            badgeEstado.style.color = "#34d399";
            badgeEstado.style.borderColor = "rgba(16, 185, 129, 0.3)";
        } else {
            badgeEstado.innerText = "DÉFICIT EN PERÍODO";
            badgeEstado.style.background = "rgba(239, 68, 68, 0.15)";
            badgeEstado.style.color = "#f87171";
            badgeEstado.style.borderColor = "rgba(239, 68, 68, 0.3)";
        }
    }

    // 8. Gráfico de Métricas (Comparativa 50/40/10 vs Dona)
    renderizarGraficoFinanzas({
        gastosPorCat: gastosPorCategoria,
        totIng: totIngresosVista,
        totGas: totGastos,
        estimadoInversion: meta50,
        realInversion: realInversionVista,
        estimadoGastos: meta40,
        realGastos: realGastosVista,
        estimadoCaprichos: meta10,
        realCaprichos: realCaprichosVista,
        vq: vq
    });

    // Actualizar selector dinámico de categorías para el modal de gastos
    poblarSelectCategoriasGastos();

    // Sincronizar badge y selects de Tarjetas & Billeteras
    if (typeof poblarSelectsTarjetasFinanzas === 'function') {
        poblarSelectsTarjetasFinanzas();
    }

    // Sincronizar badge de Planificación de Pagos
    if (typeof actualizarBadgePlanificacionFinanzas === 'function') {
        actualizarBadgePlanificacionFinanzas(f);
    }

    // Sincronizar badge y vista del Calendario Cronológico de Cobros y Pagos
    if (typeof actualizarBadgeCalendarioFinanzas === 'function') {
        actualizarBadgeCalendarioFinanzas(f, anioActivo, mesActivo);
    }
    if (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.seccionActiva === 'calendario' && typeof renderizarCalendarioFinanzas === 'function') {
        renderizarCalendarioFinanzas();
    } else if (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.seccionActiva === 'tarjetas' && typeof renderizarTarjetasFinanzas === 'function') {
        renderizarTarjetasFinanzas();
    } else if (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.seccionActiva === 'planificacion' && typeof renderizarPlanificacionFinanzas === 'function') {
        renderizarPlanificacionFinanzas();
    }

    if (typeof renderizarBannerAlertaRetrasosFinanzas === 'function') {
        renderizarBannerAlertaRetrasosFinanzas(f, retrasosResumen);
    }
    if (typeof refrescarModalReprogramarSiAbiertoFinanzas === 'function') {
        refrescarModalReprogramarSiAbiertoFinanzas();
    }
    if (typeof actualizarBadgeNotificaciones === 'function') {
        actualizarBadgeNotificaciones();
    }
}

function renderizarGraficoFinanzas(opts) {
    var ctx = document.getElementById('graficoFinanzas') || document.getElementById('chart-finanzas-resumen');
    if (!ctx) return;

    if (ESTADO_FINANZAS.chartInstance) {
        ESTADO_FINANZAS.chartInstance.destroy();
        ESTADO_FINANZAS.chartInstance = null;
    }

    try {
        if (typeof Chart === 'undefined') return;

        var modo = (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.modoGrafico) || 'comparativa';

        if (modo === 'comparativa') {
            // GRÁFICO COMPARATIVO: ESTIMADO VS REAL (REGLA 50 / 40 / 10)
            var labels = ['Inversión (50%)', 'Gastos Fijos (40%)', 'Caprichos (10%)'];
            var dataEstimado = [
                opts.estimadoInversion || 0,
                opts.estimadoGastos || 0,
                opts.estimadoCaprichos || 0
            ];
            var dataReal = [
                opts.realInversion || 0,
                opts.realGastos || 0,
                opts.realCaprichos || 0
            ];

            var colorRealInversion = '#10b981';
            var colorRealGastos = (opts.realGastos || 0) > (opts.estimadoGastos || 0) ? '#ef4444' : '#38bdf8';
            var colorRealCaprichos = (opts.realCaprichos || 0) > (opts.estimadoCaprichos || 0) ? '#f43f5e' : '#a855f7';

            ESTADO_FINANZAS.chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Presupuesto Estimado ($)',
                            data: dataEstimado,
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderColor: ['#06b6d4', '#f59e0b', '#ec4899'],
                            borderWidth: 2,
                            borderRadius: 6
                        },
                        {
                            label: 'Ejecución Real ($)',
                            data: dataReal,
                            backgroundColor: [colorRealInversion, colorRealGastos, colorRealCaprichos],
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: {
                                color: '#94a3b8',
                                font: { family: 'Plus Jakarta Sans', size: 11, weight: '700' }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: {
                                color: '#94a3b8',
                                callback: function(val) { return '$' + val; },
                                font: { family: 'Plus Jakarta Sans', size: 10 }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#cbd5e1',
                                boxWidth: 12,
                                padding: 12,
                                font: { family: 'Plus Jakarta Sans', size: 11, weight: '700' }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var val = context.raw || 0;
                                    return ' ' + context.dataset.label + ': $' + Number(val).toFixed(2);
                                },
                                afterBody: function(items) {
                                    if (!items || items.length === 0) return '';
                                    var idx = items[0].dataIndex;
                                    var est = dataEstimado[idx];
                                    var real = dataReal[idx];
                                    var pct = est > 0 ? Math.round((real / est) * 100) : 0;
                                    var dif = real - est;
                                    var txtDif = dif >= 0 ? '+$' + dif.toFixed(2) : '-$' + Math.abs(dif).toFixed(2);
                                    return `Ejecución: ${pct}% | Diferencia: ${txtDif}`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            // GRÁFICO DE DONA: DISTRIBUCIÓN POR CATEGORÍAS
            var gastosPorCat = opts.gastosPorCat || {};
            var catLabels = Object.keys(gastosPorCat);
            var catData = Object.values(gastosPorCat);
            var tieneGastosReales = catLabels.length > 0 && (opts.totGas || 0) > 0;

            if (!tieneGastosReales) {
                catLabels = ["Sin gastos registrados"];
                catData = [1];
            }

            var cyberPalette = [
                '#6366f1', '#38bdf8', '#10b981', '#f59e0b',
                '#ec4899', '#8b5cf6', '#f43f5e', '#06b6d4',
                '#14b8a6', '#a855f7'
            ];

            ESTADO_FINANZAS.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: catLabels,
                    datasets: [{
                        data: catData,
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
        }
    } catch (e) {
        console.warn("Chart.js no disponible para renderizar gráfico de finanzas:", e);
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
    var fin = APP_STATE.finanzas || DEFAULT_STATE.finanzas;
    var cats = fin.categoriasGastos || DEFAULT_STATE.finanzas.categoriasGastos;

    if (select) {
        var actual = select.value;
        var html = '';

        cats.forEach(function(cat) {
            var icon = cat.icono || "🏷️";
            html += `<option value="${cat.nombre}">${icon} ${cat.nombre}</option>`;
        });

        select.innerHTML = html;
        if (actual) select.value = actual;
    }

    if (typeof poblarCategoriasAsistenteFinanza === 'function') {
        poblarCategoriasAsistenteFinanza();
    }
}

function renderizarListaCategorias() {
    var cont = document.getElementById('lista-categorias-activas');
    if (!cont) return;

    var fin = APP_STATE.finanzas || DEFAULT_STATE.finanzas;
    var cats = fin.categoriasGastos || DEFAULT_STATE.finanzas.categoriasGastos;

    var html = '';
    cats.forEach(function(cat) {
        var esDefault = ['CAT-VIVIENDA', 'CAT-ALIMENTACION', 'CAT-MOTO', 'CAT-SERVICIOS', 'CAT-SALUD', 'CAT-ENTRETENIMIENTO', 'CAT-INVERSION', 'CAT-PRESTAMOS', 'CAT-OTROS'].includes(cat.id);
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
// HELPERS DE DISTRIBUCIÓN MULTI-TARJETA, MONEDA Y PRÉSTAMOS
// ==========================================================================

function construirOpcionesTarjetasHTML(selectedId) {
    var tarjetas = (typeof asegurarArrayTarjetasFinanzas === 'function') ? asegurarArrayTarjetasFinanzas() : [];
    var cache = (typeof leerCacheTasasBCV === 'function') ? leerCacheTasasBCV() : {};
    var html = '<option value="">-- Selecciona Tarjeta --</option>';
    tarjetas.forEach(function(t) {
        var est = calcularEstadoTarjetaEnVivo(t, cache);
        var saldoTxt = est.monedaBase === 'USD'
            ? (formatearUsdTarjeta(est.saldoUsd) + ' USDT')
            : (formatearTasaBsDisplay(est.saldoBs, 2) + ' ≈ ' + formatearUsdTarjeta(est.valorActualUsd));
        var sel = (selectedId && selectedId === t.id) ? ' selected' : '';
        html += '<option value="' + escaparHTML(t.id) + '"' + sel + '>' + escaparHTML(construirTituloTarjeta(t)) + ' (' + saldoTxt + ')</option>';
    });
    return html;
}

function obtenerMontoObjetivoSplitModal(ctx) {
    if (ctx === 'cobro') {
        var inR = document.getElementById('modal-cobro-ingreso-real');
        return Math.max(0, parseFloat(inR ? inR.value : '0') || 0);
    }
    var inM = document.getElementById('modal-ingreso-monto');
    var selMon = document.getElementById('modal-ingreso-moneda');
    var selTasa = document.getElementById('modal-ingreso-tasa-tipo');
    var conv = convertirMontoFinanzasAUsd(inM ? inM.value : 0, selMon ? selMon.value : 'USD', selTasa ? selTasa.value : 'bcv');
    return conv.valido ? conv.usd : 0;
}

function esModoSplitTarjetasActivo(ctx) {
    var grpSplit = document.getElementById('grupo-' + ctx + '-tarjetas-split');
    return !!(grpSplit && grpSplit.style.display !== 'none');
}

function establecerModoSplitTarjetasModal(ctx, activo, rowsOpt) {
    var grpUnica = document.getElementById('grupo-' + ctx + '-tarjeta-unica');
    var grpSplit = document.getElementById('grupo-' + ctx + '-tarjetas-split');
    var btn = document.getElementById('btn-toggle-split-' + ctx);
    if (grpUnica) grpUnica.style.display = activo ? 'none' : 'block';
    if (grpSplit) grpSplit.style.display = activo ? 'block' : 'none';
    if (btn) {
        btn.classList.toggle('is-active', !!activo);
        btn.textContent = activo ? '💳 Usar 1 sola tarjeta' : '✂️ Dividir en 2+ tarjetas';
    }
    if (activo) {
        var rows = Array.isArray(rowsOpt) && rowsOpt.length > 0 ? rowsOpt : null;
        if (!rows) {
            var tarjetas = asegurarArrayTarjetasFinanzas();
            var totObj = obtenerMontoObjetivoSplitModal(ctx);
            var m1 = totObj > 0 ? Math.round((totObj / 2) * 100) / 100 : '';
            var m2 = totObj > 0 ? Math.round((totObj - Number(m1 || 0)) * 100) / 100 : '';
            rows = [
                { tarjetaId: tarjetas[0] ? tarjetas[0].id : '', montoUsd: m1 },
                { tarjetaId: tarjetas[1] ? tarjetas[1].id : (tarjetas[0] ? tarjetas[0].id : ''), montoUsd: m2 }
            ];
        }
        renderizarListaSplitTarjetasModal(ctx, rows);
    }
    if (ctx === 'cobro' && typeof actualizarPreviewCobroTarjeta === 'function') {
        actualizarPreviewCobroTarjeta();
    }
}

function toggleModoSplitTarjetasModal(ctx) {
    establecerModoSplitTarjetasModal(ctx, !esModoSplitTarjetasActivo(ctx));
}

function renderizarListaSplitTarjetasModal(ctx, rows) {
    var cont = document.getElementById('lista-' + ctx + '-tarjetas-split');
    if (!cont) return;
    cont.innerHTML = '';
    (rows || []).forEach(function(r) {
        agregarFilaSplitTarjetaModal(ctx, r.tarjetaId || '', r.montoUsd != null && r.montoUsd !== '' ? Number(r.montoUsd) : '');
    });
    alCambiarSplitTarjetasUI(ctx);
}

function agregarFilaSplitTarjetaModal(ctx, tarjetaIdOpt, montoOpt) {
    var cont = document.getElementById('lista-' + ctx + '-tarjetas-split');
    if (!cont) return;
    var row = document.createElement('div');
    row.className = 'fin-split-card-row';

    var tarjetas = asegurarArrayTarjetasFinanzas();
    var chosenId = tarjetaIdOpt || (tarjetas[cont.children.length] ? tarjetas[cont.children.length].id : (tarjetas[0] ? tarjetas[0].id : ''));
    var valMonto = (montoOpt !== undefined && montoOpt !== null && montoOpt !== '') ? Number(montoOpt).toFixed(2) : '';

    row.innerHTML =
        '<select class="ideas-select fin-split-trj-select" style="flex: 1.6; min-width: 130px; padding: 7px 8px; font-size: 12px;" onchange="alCambiarSplitTarjetasUI(\'' + ctx + '\')">' +
            construirOpcionesTarjetasHTML(chosenId) +
        '</select>' +
        '<input type="number" step="0.01" min="0" class="modal-input fin-split-trj-monto" placeholder="$ USD" value="' + escaparHTML(valMonto) + '" style="flex: 0.9; min-width: 80px; padding: 7px 8px; font-size: 12px; font-weight: 800; color: #34d399;" oninput="alCambiarSplitTarjetasUI(\'' + ctx + '\')">' +
        '<button type="button" class="fin-split-del-btn" title="Quitar tarjeta" onclick="eliminarFilaSplitTarjetaModal(\'' + ctx + '\', this)">✕</button>';

    cont.appendChild(row);
    alCambiarSplitTarjetasUI(ctx);
}

function eliminarFilaSplitTarjetaModal(ctx, btnEl) {
    var cont = document.getElementById('lista-' + ctx + '-tarjetas-split');
    if (!cont) return;
    var row = btnEl ? btnEl.closest('.fin-split-card-row') : null;
    if (row && cont.children.length > 1) {
        row.remove();
        alCambiarSplitTarjetasUI(ctx);
    } else if (cont.children.length <= 1) {
        establecerModoSplitTarjetasModal(ctx, false);
    }
}

function leerFilasSplitTarjetasModal(ctx) {
    var cont = document.getElementById('lista-' + ctx + '-tarjetas-split');
    if (!cont) return [];
    var filas = [];
    Array.from(cont.querySelectorAll('.fin-split-card-row')).forEach(function(rowEl) {
        var sel = rowEl.querySelector('.fin-split-trj-select');
        var inp = rowEl.querySelector('.fin-split-trj-monto');
        var trjId = sel ? sel.value : '';
        var m = Math.round(Math.max(0, parseFloat(inp ? inp.value : '0') || 0) * 100) / 100;
        if (trjId && m > 0) {
            filas.push({ tarjetaId: trjId, montoUsd: m });
        }
    });
    return filas;
}

function actualizarResumenSplitTarjetasUI(ctx) {
    var sumEl = document.getElementById('resumen-' + ctx + '-tarjetas-split');
    if (!sumEl) return;
    var filas = leerFilasSplitTarjetasModal(ctx);
    var sum = Math.round(filas.reduce(function(acc, r) { return acc + r.montoUsd; }, 0) * 100) / 100;
    var obj = obtenerMontoObjetivoSplitModal(ctx);
    if (obj > 0) {
        var diff = Math.round((obj - sum) * 100) / 100;
        if (Math.abs(diff) <= 0.02) {
            sumEl.style.color = '#34d399';
            sumEl.textContent = '✓ Repartido: $' + sum.toFixed(2) + ' / $' + obj.toFixed(2);
        } else {
            sumEl.style.color = '#fbbf24';
            sumEl.textContent = 'Asignado: $' + sum.toFixed(2) + ' · ' + (diff > 0 ? ('Faltan $' + diff.toFixed(2)) : ('Excede por $' + Math.abs(diff).toFixed(2)));
        }
    } else {
        sumEl.style.color = '#38bdf8';
        sumEl.textContent = 'Asignado: $' + sum.toFixed(2);
    }
}

function alCambiarSplitTarjetasUI(ctx) {
    actualizarResumenSplitTarjetasUI(ctx);
    if (ctx === 'cobro' && typeof actualizarPreviewCobroTarjeta === 'function') {
        actualizarPreviewCobroTarjeta();
    }
}

function actualizarPreviewMonedaIngreso() {
    var inM = document.getElementById('modal-ingreso-monto');
    var selMon = document.getElementById('modal-ingreso-moneda');
    var selTasa = document.getElementById('modal-ingreso-tasa-tipo');
    var prev = document.getElementById('modal-ingreso-conv-preview');
    var mon = selMon ? selMon.value : 'USD';
    if (selTasa) selTasa.style.display = (mon === 'VES') ? 'block' : 'none';
    if (prev) {
        var val = parseFloat(inM ? inM.value : '0') || 0;
        var conv = convertirMontoFinanzasAUsd(val, mon, selTasa ? selTasa.value : 'bcv');
        if (val > 0 && mon === 'VES') {
            prev.style.display = 'block';
            prev.innerHTML = conv.valido
                ? ('Equivale a <strong style="color:#34d399;">$' + conv.usd.toFixed(2) + ' USD</strong> (Tasa ' + escaparHTML(conv.tasaLabel) + ': ' + Number(conv.tasaUsada).toFixed(2) + ')')
                : '⚠️ No hay tasa cargada en caché para convertir Bs. a $.';
        } else if (val > 0 && mon === 'USD' && conv.tasaUsada > 0) {
            prev.style.display = 'block';
            prev.innerHTML = 'Se mantiene en <strong style="color:#34d399;">$' + conv.usd.toFixed(2) + ' USD</strong> · Ref. ' + formatearTasaBsDisplay(conv.bs, 2) + ' (' + escaparHTML(conv.tasaLabel) + ').';
        } else {
            prev.style.display = 'none';
        }
    }
    if (esModoSplitTarjetasActivo('ingreso')) alCambiarSplitTarjetasUI('ingreso');
}

function poblarDatalistPersonasFinanzas() {
    var dl = document.getElementById('datalist-personas-finanzas');
    if (!dl) return;
    var personas = (typeof APP_STATE !== 'undefined' && APP_STATE && Array.isArray(APP_STATE.agendaPersonas))
        ? APP_STATE.agendaPersonas
        : [];
    var vistos = {};
    var opts = [];
    personas.forEach(function(p) {
        if (!p || !p.nombre) return;
        var n = String(p.nombre).trim();
        var low = n.toLowerCase();
        if (!n || vistos[low]) return;
        vistos[low] = true;
        opts.push('<option value="' + escaparHTML(n) + '"></option>');
    });
    dl.innerHTML = opts.join('');
}

function seleccionarModalidadPrestamoGasto(mod) {
    var m = (mod === 'partes') ? 'partes' : 'unico';
    var inMod = document.getElementById('modal-gasto-prestamo-devolucion');
    var btnU = document.getElementById('btn-prestamo-dev-unico');
    var btnP = document.getElementById('btn-prestamo-dev-partes');
    var grpU = document.getElementById('grupo-prestamo-fecha-unica');
    var grpP = document.getElementById('grupo-prestamo-partes');
    if (inMod) inMod.value = m;
    if (btnU) btnU.classList.toggle('is-active', m === 'unico');
    if (btnP) btnP.classList.toggle('is-active', m === 'partes');
    if (grpU) grpU.style.display = (m === 'unico') ? 'block' : 'none';
    if (grpP) grpP.style.display = (m === 'partes') ? 'block' : 'none';

    if (m === 'partes') {
        var lista = document.getElementById('lista-partes-prestamo');
        if (lista && lista.children.length === 0) {
            var d1 = new Date(); d1.setDate(d1.getDate() + 15);
            var d2 = new Date(); d2.setDate(d2.getDate() + 30);
            agregarPartePrestamoUI(d1.toISOString().slice(0, 10), '');
            agregarPartePrestamoUI(d2.toISOString().slice(0, 10), '');
            repartirEquitativoPartesPrestamo();
        } else {
            actualizarResumenPartesPrestamoUI();
        }
    }
}

function agregarPartePrestamoUI(fechaOpt, montoOpt, monedaOpt) {
    var cont = document.getElementById('lista-partes-prestamo');
    if (!cont) return;
    var row = document.createElement('div');
    row.className = 'fin-split-card-row';

    var fDef = fechaOpt;
    if (!fDef) {
        var base = new Date();
        base.setDate(base.getDate() + 15 * (cont.children.length + 1));
        fDef = base.toISOString().slice(0, 10);
    }
    var mVal = (montoOpt !== undefined && montoOpt !== null && montoOpt !== '') ? Number(montoOpt).toFixed(2) : '';
    var mon = (monedaOpt === 'VES') ? 'VES' : 'USD';

    row.innerHTML =
        '<input type="date" class="modal-input fin-prest-parte-fecha" value="' + escaparHTML(fDef) + '" style="flex: 1.35; min-width: 108px; padding: 6px 5px; font-size: 11.5px;" onchange="actualizarResumenPartesPrestamoUI()">' +
        '<input type="number" step="0.01" min="0" class="modal-input fin-prest-parte-monto" placeholder="Monto" value="' + escaparHTML(mVal) + '" style="flex: 0.85; min-width: 58px; padding: 6px 6px; font-size: 12px; font-weight: 800; color: #34d399;" oninput="actualizarResumenPartesPrestamoUI()">' +
        '<select class="ideas-select fin-prest-parte-mon" style="flex: 0.5; min-width: 46px; padding: 6px 4px; font-size: 11.5px;" onchange="actualizarResumenPartesPrestamoUI()">' +
            '<option value="USD"' + (mon === 'USD' ? ' selected' : '') + '>$</option>' +
            '<option value="VES"' + (mon === 'VES' ? ' selected' : '') + '>Bs</option>' +
        '</select>' +
        '<button type="button" class="fin-split-del-btn" title="Quitar parte" onclick="eliminarPartePrestamoUI(this)">✕</button>';

    cont.appendChild(row);
    actualizarResumenPartesPrestamoUI();
}

function eliminarPartePrestamoUI(btnEl) {
    var cont = document.getElementById('lista-partes-prestamo');
    if (!cont) return;
    var row = btnEl ? btnEl.closest('.fin-split-card-row') : null;
    if (row && cont.children.length > 1) {
        row.remove();
        actualizarResumenPartesPrestamoUI();
    }
}

function repartirEquitativoPartesPrestamo() {
    var cont = document.getElementById('lista-partes-prestamo');
    if (!cont || cont.children.length === 0) return;
    var inM = document.getElementById('modal-gasto-monto');
    var selMon = document.getElementById('modal-gasto-moneda');
    var selTasa = document.getElementById('modal-gasto-tasa-tipo');
    var convTotal = convertirMontoFinanzasAUsd(inM ? inM.value : 0, selMon ? selMon.value : 'USD', selTasa ? selTasa.value : 'bcv');
    var totUsd = convTotal.valido ? convTotal.usd : 0;
    var rows = Array.from(cont.querySelectorAll('.fin-split-card-row'));
    if (totUsd <= 0 || rows.length === 0) return;

    var baseParte = Math.floor((totUsd / rows.length) * 100) / 100;
    var acum = 0;
    rows.forEach(function(r, idx) {
        var selM = r.querySelector('.fin-prest-parte-mon');
        var inp = r.querySelector('.fin-prest-parte-monto');
        if (selM) selM.value = 'USD';
        var val = (idx === rows.length - 1) ? Math.round((totUsd - acum) * 100) / 100 : baseParte;
        acum += val;
        if (inp) inp.value = val.toFixed(2);
    });
    actualizarResumenPartesPrestamoUI();
}

function leerPartesPrestamoDesdeDOM(tasaModo) {
    var cont = document.getElementById('lista-partes-prestamo');
    if (!cont) return [];
    var out = [];
    Array.from(cont.querySelectorAll('.fin-split-card-row')).forEach(function(row) {
        var fIn = row.querySelector('.fin-prest-parte-fecha');
        var mIn = row.querySelector('.fin-prest-parte-monto');
        var monIn = row.querySelector('.fin-prest-parte-mon');
        var fecha = fIn ? String(fIn.value || '').slice(0, 10) : '';
        var mon = monIn ? monIn.value : 'USD';
        var rawM = Math.max(0, parseFloat(mIn ? mIn.value : '0') || 0);
        var conv = convertirMontoFinanzasAUsd(rawM, mon, tasaModo || 'bcv');
        if (fecha && rawM > 0 && conv.valido) {
            out.push({
                fecha: fecha,
                montoUsd: conv.usd,
                monedaOrigen: mon,
                montoOriginal: rawM
            });
        }
    });
    return out;
}

function actualizarResumenPartesPrestamoUI() {
    var el = document.getElementById('resumen-partes-prestamo');
    if (!el) return;
    var inM = document.getElementById('modal-gasto-monto');
    var selMon = document.getElementById('modal-gasto-moneda');
    var selTasa = document.getElementById('modal-gasto-tasa-tipo');
    var tasaModo = selTasa ? selTasa.value : 'bcv';
    var convTot = convertirMontoFinanzasAUsd(inM ? inM.value : 0, selMon ? selMon.value : 'USD', tasaModo);
    var partes = leerPartesPrestamoDesdeDOM(tasaModo);
    var sum = Math.round(partes.reduce(function(a, p) { return a + p.montoUsd; }, 0) * 100) / 100;
    if (convTot.valido && convTot.usd > 0) {
        var diff = Math.round((convTot.usd - sum) * 100) / 100;
        if (Math.abs(diff) <= 0.05) {
            el.style.color = '#34d399';
            el.textContent = '✓ Suma exacta: $' + sum.toFixed(2) + ' (' + partes.length + ' cobros)';
        } else {
            el.style.color = '#fbbf24';
            el.textContent = 'Suma partes: $' + sum.toFixed(2) + ' / $' + convTot.usd.toFixed(2);
        }
    } else {
        el.style.color = '#38bdf8';
        el.textContent = 'Suma partes: $' + sum.toFixed(2);
    }
}

// ==========================================================================
// MODALES Y OPERACIONES FINANCIERAS
// ==========================================================================

function abrirModalIngreso(tipoPorDefecto, fechaOpcional) {
    var m = document.getElementById('modal-finanzas-ingreso') || document.getElementById('modal-finanza-ingreso');
    if (!m) return;
    if (typeof poblarSelectsTarjetasFinanzas === 'function') poblarSelectsTarjetasFinanzas();

    var inEdit = document.getElementById('modal-ingreso-edit-id');
    var titEl = document.getElementById('modal-ingreso-modal-titulo');
    var inF = document.getElementById('modal-ingreso-fuente');
    var inDia = document.getElementById('modal-ingreso-dia');
    var inFecha = document.getElementById('modal-ingreso-fecha');
    var inM = document.getElementById('modal-ingreso-monto');
    var selMon = document.getElementById('modal-ingreso-moneda');
    var selTasa = document.getElementById('modal-ingreso-tasa-tipo');
    var selTrj = document.getElementById('modal-ingreso-tarjeta');
    var btnSave = document.getElementById('btn-guardar-modal-ingreso');

    if (inEdit) inEdit.value = '';
    if (titEl) titEl.textContent = 'AGREGAR NUEVA ENTRADA DE INGRESO';
    if (btnSave) btnSave.textContent = '✓ Guardar Entrada';
    if (inF) inF.value = '';
    if (inDia) inDia.value = '15';
    if (inFecha) inFecha.value = '';
    if (inM) inM.value = '';
    if (selMon) selMon.value = 'USD';
    if (selTasa) selTasa.value = 'bcv';
    if (selTrj) selTrj.value = '';
    establecerModoSplitTarjetasModal('ingreso', false);

    if (fechaOpcional && typeof fechaOpcional === 'string' && fechaOpcional.length >= 10) {
        if (inFecha) inFecha.value = fechaOpcional.slice(0, 10);
        var diaP = parseInt(fechaOpcional.slice(8, 10), 10);
        if (inDia && !isNaN(diaP)) inDia.value = diaP;
    }
    m.style.display = 'flex';
    seleccionarTipoIngresoModal(tipoPorDefecto || 'fija');
    actualizarPreviewMonedaIngreso();
}

function editarIngresoFinanzasUI(id) {
    if (!APP_STATE || !APP_STATE.finanzas || !Array.isArray(APP_STATE.finanzas.ingresos)) return;
    var item = APP_STATE.finanzas.ingresos.find(function(x) { return x && x.id === id; });
    if (!item) return;

    var m = document.getElementById('modal-finanzas-ingreso');
    if (!m) return;
    if (typeof poblarSelectsTarjetasFinanzas === 'function') poblarSelectsTarjetasFinanzas();

    var inEdit = document.getElementById('modal-ingreso-edit-id');
    var titEl = document.getElementById('modal-ingreso-modal-titulo');
    var inF = document.getElementById('modal-ingreso-fuente');
    var inDia = document.getElementById('modal-ingreso-dia');
    var inFecha = document.getElementById('modal-ingreso-fecha');
    var inM = document.getElementById('modal-ingreso-monto');
    var selMon = document.getElementById('modal-ingreso-moneda');
    var selTasa = document.getElementById('modal-ingreso-tasa-tipo');
    var selTrj = document.getElementById('modal-ingreso-tarjeta');
    var btnSave = document.getElementById('btn-guardar-modal-ingreso');

    var infoOrig = clasificarOrigenIngreso(item);
    var tipoDest = infoOrig.tipoDestino || item.tipo || 'fija';

    if (inEdit) inEdit.value = item.id;
    if (titEl) titEl.textContent = 'EDITAR ENTRADA Y TARJETAS';
    if (btnSave) btnSave.textContent = '✓ Guardar Cambios';
    if (inF) inF.value = item.fuente || item.concepto || item.nombre || '';
    if (inDia) inDia.value = item.dia || 15;
    if (inFecha) inFecha.value = (item.fecha && String(item.fecha).length >= 10) ? String(item.fecha).slice(0, 10) : '';
    if (selMon) selMon.value = 'USD';
    if (selTasa) selTasa.value = item.tasaTipo || 'bcv';
    if (inM) inM.value = Number(item.monto || 0).toFixed(2);

    seleccionarTipoIngresoModal(tipoDest);

    var distRows = Array.isArray(item.tarjetasMovs) && item.tarjetasMovs.length > 0
        ? item.tarjetasMovs.map(function(r) { return { tarjetaId: r.tarjetaId, montoUsd: r.montoUsd || r.deltaUsdRef || 0 }; })
        : (Array.isArray(item.tarjetasDistribucion) && item.tarjetasDistribucion.length > 0 ? item.tarjetasDistribucion : null);

    if (distRows && distRows.length > 1) {
        establecerModoSplitTarjetasModal('ingreso', true, distRows);
    } else {
        establecerModoSplitTarjetasModal('ingreso', false);
        var trjUni = (distRows && distRows.length === 1) ? distRows[0].tarjetaId : (item.tarjetaId || '');
        if (selTrj) selTrj.value = trjUni || '';
    }

    actualizarPreviewMonedaIngreso();
    m.style.display = 'flex';
}

function cerrarModalIngreso() {
    var m = document.getElementById('modal-finanzas-ingreso') || document.getElementById('modal-finanza-ingreso');
    if (m) m.style.display = 'none';
}

function confirmarAgregarIngreso() {
    var inEdit = document.getElementById('modal-ingreso-edit-id');
    var editId = inEdit ? inEdit.value.trim() : '';
    var inF = document.getElementById('modal-ingreso-fuente');
    var inD = document.getElementById('modal-ingreso-dia');
    var inFecha = document.getElementById('modal-ingreso-fecha');
    var inM = document.getElementById('modal-ingreso-monto');
    var selMon = document.getElementById('modal-ingreso-moneda');
    var selTasa = document.getElementById('modal-ingreso-tasa-tipo');
    var inTipo = document.getElementById('modal-ingreso-tipo');
    var selTrj = document.getElementById('modal-ingreso-tarjeta');

    var tipo = inTipo ? inTipo.value : 'fija';
    var f = inF ? inF.value.trim() : "";
    var monIn = selMon ? selMon.value : 'USD';
    var tasaModo = selTasa ? selTasa.value : 'bcv';
    var rawMonto = inM ? (parseFloat(inM.value) || 0) : 0;
    var conv = convertirMontoFinanzasAUsd(rawMonto, monIn, tasaModo);

    if (!f || rawMonto <= 0) {
        alert("Completa la fuente/concepto y un monto válido.");
        return;
    }
    if (!conv.valido || conv.usd <= 0) {
        alert("No hay tasa cargada en caché para convertir Bolívares a $ USD.");
        return;
    }
    var m = conv.usd;
    var d = inD ? (Number(inD.value) || 15) : 15;
    var fecha = (tipo === 'fija') ? "" : (inFecha ? inFecha.value : "");
    if (tipo !== 'fija' && fecha && fecha.length >= 10) {
        var diaParsed = parseInt(fecha.slice(8, 10), 10);
        if (!isNaN(diaParsed)) d = diaParsed;
    }

    // Tarjeta(s) destino
    var tarjetasDistribucion = [];
    var tarjetaIdUnica = null;
    if (esModoSplitTarjetasActivo('ingreso')) {
        tarjetasDistribucion = leerFilasSplitTarjetasModal('ingreso');
        if (tarjetasDistribucion.length === 0) {
            alert("Agrega al menos 1 tarjeta con monto válido en la división o vuelve a 1 sola tarjeta.");
            return;
        }
        var sumSplit = Math.round(tarjetasDistribucion.reduce(function(a, x) { return a + x.montoUsd; }, 0) * 100) / 100;
        if (Math.abs(sumSplit - m) > 0.05) {
            alert("La suma asignada a las tarjetas ($" + sumSplit.toFixed(2) + ") debe coincidir con el monto del ingreso ($" + m.toFixed(2) + ").");
            return;
        }
        if (tarjetasDistribucion.length === 1) {
            tarjetaIdUnica = tarjetasDistribucion[0].tarjetaId;
        }
    } else {
        var vTrj = selTrj ? selTrj.value : '';
        if (vTrj) {
            tarjetaIdUnica = vTrj;
            tarjetasDistribucion = [{ tarjetaId: vTrj, montoUsd: m }];
        }
    }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.ingresos) APP_STATE.finanzas.ingresos = [];

    var nowIng = Date.now();

    if (editId) {
        var exist = APP_STATE.finanzas.ingresos.find(function(x) { return x && x.id === editId; });
        if (!exist) return;

        // Si ya estaba cobrado, revertir movimientos previos en tarjetas antes de actualizar distribución
        if (exist.cobrado) {
            revertirTarjetasMovimientoFinanzas(exist, true);
        }

        exist.fuente = f;
        exist.dia = d;
        exist.fecha = fecha;
        exist.monto = m;
        exist.monedaOrigen = monIn;
        exist.montoOriginalBs = (monIn === 'VES') ? conv.bs : 0;
        exist.tasaTipo = tasaModo;
        exist.tasaUsada = conv.tasaUsada || 0;
        exist.tarjetaId = tarjetaIdUnica;
        exist.tarjetasDistribucion = tarjetasDistribucion.slice();
        var infoEdit = clasificarOrigenIngreso(exist);
        exist.tipo = infoEdit.tipoDestino;
        if (infoEdit.origen === 'labor') exist.origenLabor = infoEdit.origenId;

        if (exist.cobrado) {
            exist.montoCobrado = m;
            var distAplicar = tarjetasDistribucion.length > 0 ? tarjetasDistribucion : (tarjetaIdUnica ? [{ tarjetaId: tarjetaIdUnica, montoUsd: m }] : []);
            aplicarTarjetasMovimientoFinanzas(exist, true, distAplicar, f);
        }
        exist.fechaActualizacion = nowIng;

        MonarcaDB.save(APP_STATE);
        cerrarModalIngreso();
        renderizarFinanzas(APP_STATE.finanzas);
        return;
    }

    var nuevoIngreso = {
        id: "ING-" + nowIng,
        fuente: f,
        tipo: tipo,
        dia: d,
        fecha: fecha,
        monto: m,
        monedaOrigen: monIn,
        montoOriginalBs: (monIn === 'VES') ? conv.bs : 0,
        tasaTipo: tasaModo,
        tasaUsada: conv.tasaUsada || 0,
        tarjetaId: tarjetaIdUnica,
        tarjetasDistribucion: tarjetasDistribucion,
        cobrado: false,
        timestamp: nowIng,
        fechaActualizacion: nowIng
    };

    var infoOrig = clasificarOrigenIngreso(nuevoIngreso);
    nuevoIngreso.tipo = infoOrig.tipoDestino;
    if (infoOrig.origen === 'labor') {
        nuevoIngreso.origenLabor = infoOrig.origenId;
    }

    APP_STATE.finanzas.ingresos.push(nuevoIngreso);

    if (inF) inF.value = "";
    if (inM) inM.value = "";

    MonarcaDB.save(APP_STATE);
    cerrarModalIngreso();
    renderizarFinanzas(APP_STATE.finanzas);

    if (nuevoIngreso.tipo === 'almacen') {
        cambiarTabIngresos('almacen');
    } else if (nuevoIngreso.tipo === 'aleatoria') {
        cambiarTabIngresos('aleatorios');
    } else {
        cambiarTabIngresos('fijos');
    }
}

function aplicarTarjetasMovimientoFinanzas(item, esIngreso, listaDistribucion, conceptoNota) {
    if (!item || !Array.isArray(listaDistribucion) || listaDistribucion.length === 0 || typeof aplicarMovimientoEnTarjeta !== 'function') return [];
    var modo = esIngreso ? 'ingreso' : 'retiro';
    var movsAplicados = [];
    listaDistribucion.forEach(function(row, idx) {
        if (!row || !row.tarjetaId || row.tarjetaId === '__EFECTIVO__') return;
        var montoPart = Math.round((Number(row.montoUsd) || 0) * 100) / 100;
        if (montoPart <= 0) return;
        var refMov = item.id + (listaDistribucion.length > 1 ? (':TRJ:' + idx) : '');
        var resMov = aplicarMovimientoEnTarjeta(row.tarjetaId, modo, montoPart, 'USD', conceptoNota || 'Movimiento Finanzas', refMov);
        if (resMov) {
            movsAplicados.push({
                tarjetaId: row.tarjetaId,
                montoUsd: montoPart,
                deltaNativo: resMov.deltaNativo,
                deltaUsdRef: resMov.deltaUsdRef,
                refMovimientoId: refMov
            });
        }
    });
    item.tarjetasMovs = movsAplicados;
    if (movsAplicados.length === 1) {
        item.tarjetaId = movsAplicados[0].tarjetaId;
        item.tarjetaDeltaNativo = movsAplicados[0].deltaNativo;
        item.tarjetaDeltaUsdRef = movsAplicados[0].deltaUsdRef;
    } else if (movsAplicados.length > 1) {
        delete item.tarjetaId;
        delete item.tarjetaDeltaNativo;
        delete item.tarjetaDeltaUsdRef;
    }
    return movsAplicados;
}

function revertirTarjetasMovimientoFinanzas(item, fueIngreso) {
    if (!item || typeof revertirMovimientoEnTarjeta !== 'function') return;
    if (Array.isArray(item.tarjetasMovs) && item.tarjetasMovs.length > 0) {
        item.tarjetasMovs.forEach(function(mv) {
            if (mv && mv.tarjetaId && mv.deltaNativo) {
                revertirMovimientoEnTarjeta(mv.tarjetaId, fueIngreso, mv.deltaNativo, mv.deltaUsdRef, mv.refMovimientoId || item.id);
            }
        });
        item.tarjetasMovs = [];
        delete item.tarjetaDeltaNativo;
        delete item.tarjetaDeltaUsdRef;
        return;
    }
    if (item.tarjetaId && item.tarjetaDeltaNativo) {
        revertirMovimientoEnTarjeta(item.tarjetaId, fueIngreso, item.tarjetaDeltaNativo, item.tarjetaDeltaUsdRef, item.id);
        delete item.tarjetaDeltaNativo;
        delete item.tarjetaDeltaUsdRef;
    }
}

function abrirModalPrestamoGasto() {
    abrirModalGasto('ocasional', null, 'Préstamos');
}

function abrirModalGasto(tipoPorDefecto, fechaOpcional, categoriaInicialOpt) {
    var m = document.getElementById('modal-finanzas-gasto') || document.getElementById('modal-finanza-gasto');
    if (!m) return;

    sanearDatosFinanzasRecurrentesYCategorias(APP_STATE.finanzas || DEFAULT_STATE.finanzas);
    poblarSelectCategoriasGastos();
    if (typeof poblarSelectsTarjetasFinanzas === 'function') poblarSelectsTarjetasFinanzas();
    poblarDatalistPersonasFinanzas();

    var inEdit = document.getElementById('modal-gasto-edit-id');
    var titEl = document.getElementById('modal-gasto-modal-titulo');
    var btnSave = document.getElementById('btn-guardar-modal-gasto');
    var inCp = document.getElementById('modal-gasto-fuente');
    var inDia = document.getElementById('modal-gasto-dia');
    var inFecha = document.getElementById('modal-gasto-fecha');
    var inM = document.getElementById('modal-gasto-monto');
    var selMon = document.getElementById('modal-gasto-moneda');
    var selTasa = document.getElementById('modal-gasto-tasa-tipo');
    var selCat = document.getElementById('modal-gasto-categoria');
    var selTrjG = document.getElementById('modal-gasto-tarjeta');
    var chkDesc = document.getElementById('modal-gasto-descontar-ahora');
    var inPers = document.getElementById('modal-gasto-prestamo-persona');
    var inFechaU = document.getElementById('modal-gasto-prestamo-fecha-unica');
    var listaPartes = document.getElementById('lista-partes-prestamo');

    if (inEdit) inEdit.value = '';
    if (titEl) titEl.textContent = categoriaInicialOpt ? 'REGISTRAR PRÉSTAMO (SALIDA → INGRESO)' : 'AGREGAR NUEVA SALIDA O GASTO';
    if (btnSave) btnSave.textContent = categoriaInicialOpt ? '✓ Guardar Préstamo' : '✓ Guardar Salida';
    if (inCp) inCp.value = '';
    if (inM) inM.value = '';
    if (selMon) selMon.value = 'USD';
    if (selTasa) selTasa.value = 'bcv';
    if (inDia) inDia.value = '16';
    if (inFecha) inFecha.value = '';
    if (inPers) inPers.value = '';
    if (inFechaU) inFechaU.value = '';
    if (listaPartes) listaPartes.innerHTML = '';

    var tarjetas = (typeof asegurarArrayTarjetasFinanzas === 'function') ? asegurarArrayTarjetasFinanzas() : [];
    if (selTrjG) {
        selTrjG.value = (tarjetas.length === 1) ? tarjetas[0].id : '';
    }
    if (chkDesc) chkDesc.checked = true;

    if (fechaOpcional && typeof fechaOpcional === 'string' && fechaOpcional.length >= 10) {
        if (inFecha) inFecha.value = fechaOpcional.slice(0, 10);
        var diaP = parseInt(fechaOpcional.slice(8, 10), 10);
        if (inDia && !isNaN(diaP)) inDia.value = diaP;
    }

    if (selCat && categoriaInicialOpt) {
        var catMatch = Array.from(selCat.options).find(function(o) {
            return o.value.toLowerCase() === categoriaInicialOpt.toLowerCase() || esCategoriaPrestamoNombre(o.value);
        });
        if (catMatch) selCat.value = catMatch.value;
    } else if (selCat && selCat.options.length > 0) {
        var nonPresOpt = Array.from(selCat.options).find(function(o) { return !esCategoriaPrestamoNombre(o.value); });
        selCat.value = nonPresOpt ? nonPresOpt.value : selCat.options[0].value;
    }

    seleccionarModalidadPrestamoGasto('unico');
    seleccionarTipoGastoModal(tipoPorDefecto || 'programado');
    alCambiarCategoriaEnModalGasto();
    alCambiarMontoGastoModal(inM ? inM.value : '');
    m.style.display = 'flex';
}

function editarGastoFinanzasUI(id) {
    if (!APP_STATE || !APP_STATE.finanzas || !Array.isArray(APP_STATE.finanzas.gastos)) return;
    var g = APP_STATE.finanzas.gastos.find(function(x) { return x && x.id === id; });
    if (!g) return;

    var m = document.getElementById('modal-finanzas-gasto');
    if (!m) return;

    sanearDatosFinanzasRecurrentesYCategorias(APP_STATE.finanzas);
    poblarSelectCategoriasGastos();
    if (typeof poblarSelectsTarjetasFinanzas === 'function') poblarSelectsTarjetasFinanzas();
    poblarDatalistPersonasFinanzas();

    var inEdit = document.getElementById('modal-gasto-edit-id');
    var titEl = document.getElementById('modal-gasto-modal-titulo');
    var btnSave = document.getElementById('btn-guardar-modal-gasto');
    var inCp = document.getElementById('modal-gasto-fuente');
    var inDia = document.getElementById('modal-gasto-dia');
    var inFecha = document.getElementById('modal-gasto-fecha');
    var inM = document.getElementById('modal-gasto-monto');
    var selMon = document.getElementById('modal-gasto-moneda');
    var selTasa = document.getElementById('modal-gasto-tasa-tipo');
    var selCat = document.getElementById('modal-gasto-categoria');
    var selPilar = document.getElementById('modal-gasto-pilar');
    var selTrjG = document.getElementById('modal-gasto-tarjeta');
    var chkDesc = document.getElementById('modal-gasto-descontar-ahora');
    var inPers = document.getElementById('modal-gasto-prestamo-persona');
    var inFechaU = document.getElementById('modal-gasto-prestamo-fecha-unica');
    var listaPartes = document.getElementById('lista-partes-prestamo');

    if (inEdit) inEdit.value = g.id;
    if (titEl) titEl.textContent = g.esPrestamo ? 'EDITAR PRÉSTAMO Y TARJETA' : 'EDITAR SALIDA O GASTO';
    if (btnSave) btnSave.textContent = '✓ Guardar Cambios';
    if (inCp) inCp.value = g.concepto || '';
    if (selCat && g.categoria) selCat.value = g.categoria;
    if (selPilar) selPilar.value = obtenerPilarGasto(g);
    if (inDia) inDia.value = g.dia || 16;
    if (inFecha) inFecha.value = (g.fecha && String(g.fecha).length >= 10) ? String(g.fecha).slice(0, 10) : '';
    if (selMon) selMon.value = 'USD';
    if (selTasa) selTasa.value = g.tasaTipo || 'bcv';
    if (inM) inM.value = Number(g.monto || 0).toFixed(2);
    if (selTrjG) selTrjG.value = g.tarjetaId || '';
    if (chkDesc) chkDesc.checked = !!g.pagado;

    seleccionarTipoGastoModal(g.tipo === 'ocasional' ? 'ocasional' : 'programado');
    alCambiarCategoriaEnModalGasto();

    if (g.esPrestamo || esCategoriaPrestamoNombre(g.categoria)) {
        if (inPers) inPers.value = g.personaPrestamo || '';
        if (listaPartes) listaPartes.innerHTML = '';
        var modDev = (g.tipoDevolucionPrestamo === 'partes' || (Array.isArray(g.cuotasPrestamo) && g.cuotasPrestamo.length > 1)) ? 'partes' : 'unico';
        seleccionarModalidadPrestamoGasto(modDev);
        if (modDev === 'partes' && Array.isArray(g.cuotasPrestamo)) {
            if (listaPartes) listaPartes.innerHTML = '';
            g.cuotasPrestamo.forEach(function(p) {
                agregarPartePrestamoUI(p.fecha, p.montoUsd, 'USD');
            });
        } else if (inFechaU && Array.isArray(g.cuotasPrestamo) && g.cuotasPrestamo[0]) {
            inFechaU.value = g.cuotasPrestamo[0].fecha || '';
        }
    }

    alCambiarMontoGastoModal(inM ? inM.value : '');
    m.style.display = 'flex';
}

function cerrarModalGasto() {
    var m = document.getElementById('modal-finanzas-gasto') || document.getElementById('modal-finanza-gasto');
    if (m) m.style.display = 'none';
    var box = document.getElementById('contenedor-freno-impulso-modal-gasto');
    if (box) box.style.display = 'none';
}

function confirmarAgregarGasto() {
    var inEdit = document.getElementById('modal-gasto-edit-id');
    var editId = inEdit ? inEdit.value.trim() : '';
    var inC = document.getElementById('modal-gasto-categoria') || document.getElementById('modal-gasto-cat');
    var inCp = document.getElementById('modal-gasto-fuente') || document.getElementById('modal-gasto-concepto');
    var inD = document.getElementById('modal-gasto-dia');
    var inFecha = document.getElementById('modal-gasto-fecha');
    var inM = document.getElementById('modal-gasto-monto');
    var selMon = document.getElementById('modal-gasto-moneda');
    var selTasa = document.getElementById('modal-gasto-tasa-tipo');
    var inTipo = document.getElementById('modal-gasto-tipo');
    var inPilar = document.getElementById('modal-gasto-pilar');
    var selTrjG = document.getElementById('modal-gasto-tarjeta');
    var chkDesc = document.getElementById('modal-gasto-descontar-ahora');

    var tipo = inTipo ? inTipo.value : 'programado';
    var c = inC ? inC.value : "Otros";
    var esPres = esCategoriaPrestamoNombre(c);
    var cp = inCp ? inCp.value.trim() : "";
    var monIn = selMon ? selMon.value : 'USD';
    var tasaModo = selTasa ? selTasa.value : 'bcv';
    var rawMonto = inM ? (parseFloat(inM.value) || 0) : 0;
    var conv = convertirMontoFinanzasAUsd(rawMonto, monIn, tasaModo);

    if (rawMonto <= 0) {
        alert("Ingresa un monto válido mayor a 0.");
        return;
    }
    if (!conv.valido || conv.usd <= 0) {
        alert("No hay tasa API en caché para convertir Bolívares a $ USD.");
        return;
    }
    var m = conv.usd;
    var pilar = inPilar ? inPilar.value : "gastos";
    var trjGId = selTrjG ? selTrjG.value : '';
    var tarjetasDisponibles = (typeof asegurarArrayTarjetasFinanzas === 'function') ? asegurarArrayTarjetasFinanzas() : [];
    if (tarjetasDisponibles.length > 0 && !trjGId) {
        alert("Selecciona la tarjeta o cuenta de donde sale este dinero.");
        if (selTrjG) selTrjG.focus();
        return;
    }

    var personaPres = '';
    var modDev = 'unico';
    var partesPrestamo = [];
    if (esPres) {
        var inPers = document.getElementById('modal-gasto-prestamo-persona');
        personaPres = inPers ? inPers.value.trim() : '';
        if (!personaPres) {
            alert("Indica el nombre de la persona a quien le haces el préstamo.");
            if (inPers) inPers.focus();
            return;
        }
        if (!cp) cp = 'Préstamo a ' + personaPres;

        var inMod = document.getElementById('modal-gasto-prestamo-devolucion');
        modDev = (inMod && inMod.value === 'partes') ? 'partes' : 'unico';
        if (modDev === 'partes') {
            partesPrestamo = leerPartesPrestamoDesdeDOM(tasaModo);
            if (partesPrestamo.length === 0) {
                alert("Agrega al menos 1 fecha y monto válido para la devolución por partes.");
                return;
            }
            var sumP = Math.round(partesPrestamo.reduce(function(a, p) { return a + p.montoUsd; }, 0) * 100) / 100;
            if (Math.abs(sumP - m) > 0.05) {
                alert("Las partes a cobrar ($" + sumP.toFixed(2) + ") deben sumar el monto total prestado ($" + m.toFixed(2) + ").");
                return;
            }
        } else {
            var inFU = document.getElementById('modal-gasto-prestamo-fecha-unica');
            var fU = inFU ? String(inFU.value || '').slice(0, 10) : '';
            if (!fU) {
                alert("Selecciona la fecha programada en que " + personaPres + " te pagará el préstamo.");
                if (inFU) inFU.focus();
                return;
            }
            partesPrestamo = [{ fecha: fU, montoUsd: m, monedaOrigen: 'USD', montoOriginal: m }];
        }
    } else if (!cp) {
        alert("Completa el concepto del gasto.");
        return;
    }

    var d = inD ? (Number(inD.value) || 16) : 16;
    var fecha = (tipo === 'programado') ? "" : (inFecha ? inFecha.value : "");
    if (tipo !== 'programado' && !fecha) {
        fecha = (typeof obtenerHoyISOFinanzas === 'function') ? obtenerHoyISOFinanzas() : new Date().toISOString().slice(0, 10);
    }
    if (tipo !== 'programado' && fecha && fecha.length >= 10) {
        var diaParsedG = parseInt(fecha.slice(8, 10), 10);
        if (!isNaN(diaParsedG)) d = diaParsedG;
    }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.gastos) APP_STATE.finanzas.gastos = [];
    if (!APP_STATE.finanzas.ingresos) APP_STATE.finanzas.ingresos = [];

    var descontarAhora = chkDesc ? !!chkDesc.checked : true;
    var nowGas = Date.now();
    var targetGasto = null;

    if (editId) {
        targetGasto = APP_STATE.finanzas.gastos.find(function(x) { return x && x.id === editId; });
        if (!targetGasto) return;
        if (targetGasto.pagado) {
            if (Array.isArray(targetGasto.abonos) && targetGasto.abonos.length > 0) {
                targetGasto.abonos.forEach(function(ab) {
                    if (ab.tarjetaId && ab.deltaNativo && typeof revertirMovimientoEnTarjeta === 'function') {
                        revertirMovimientoEnTarjeta(ab.tarjetaId, false, ab.deltaNativo, ab.deltaUsdRef, ab.id);
                    }
                });
                targetGasto.abonos = [];
            }
            revertirTarjetasMovimientoFinanzas(targetGasto, false);
        }
        targetGasto.tipo = tipo;
        targetGasto.categoria = c;
        targetGasto.concepto = cp;
        targetGasto.dia = d;
        targetGasto.fecha = fecha;
        targetGasto.monto = m;
        targetGasto.monedaOrigen = monIn;
        targetGasto.montoOriginalBs = (monIn === 'VES') ? conv.bs : 0;
        targetGasto.tasaTipo = tasaModo;
        targetGasto.tasaUsada = conv.tasaUsada || 0;
        targetGasto.pilar = pilar;
        targetGasto.tarjetaId = trjGId || null;
        targetGasto.esPrestamo = esPres;
        targetGasto.personaPrestamo = personaPres;
        targetGasto.tipoDevolucionPrestamo = modDev;
        targetGasto.cuotasPrestamo = partesPrestamo;
        targetGasto.pagado = descontarAhora;
        targetGasto.montoAbonado = descontarAhora ? m : 0;
        if (descontarAhora) {
            targetGasto.fechaPago = targetGasto.fechaPago || new Date().toISOString();
            if (trjGId && trjGId !== '__EFECTIVO__') {
                var movEdit = aplicarTarjetasMovimientoFinanzas(targetGasto, false, [{ tarjetaId: trjGId, montoUsd: m }], (esPres ? 'Préstamo: ' : 'Gasto: ') + cp);
                if (!movEdit || movEdit.length === 0) {
                    targetGasto.pagado = false;
                    targetGasto.montoAbonado = 0;
                    delete targetGasto.fechaPago;
                    alert("Guardado pendiente: no hay tasa API cargada para convertir y descontar de esa tarjeta en Bs.");
                }
            }
        } else {
            delete targetGasto.fechaPago;
        }
        targetGasto.fechaActualizacion = nowGas;

        if (esPres) {
            // Reemplazar los cobros pendientes anteriores vinculados a este préstamo y conservar los ya cobrados
            var cobradosPrev = APP_STATE.finanzas.ingresos.filter(function(ig) { return ig && ig.prestamoGastoId === targetGasto.id && ig.cobrado; });
            if (cobradosPrev.length === 0) {
                APP_STATE.finanzas.ingresos = APP_STATE.finanzas.ingresos.filter(function(ig) {
                    if (ig && ig.prestamoGastoId === targetGasto.id) {
                        if (typeof registrarTombstone === 'function') registrarTombstone('finanzas_ingresos', ig.id);
                        return false;
                    }
                    return true;
                });
                partesPrestamo.forEach(function(pt, idxP) {
                    APP_STATE.finanzas.ingresos.push({
                        id: 'ING-PREST-' + nowGas + '-' + (idxP + 1),
                        fuente: partesPrestamo.length > 1 ? ('Cobro Préstamo ' + personaPres + ' (Parte ' + (idxP + 1) + '/' + partesPrestamo.length + ')') : ('Cobro Préstamo ' + personaPres),
                        tipo: 'aleatoria',
                        esCobroPrestamo: true,
                        prestamoGastoId: targetGasto.id,
                        cuotaPrestamoIdx: idxP + 1,
                        personaPrestamo: personaPres,
                        dia: parseInt(pt.fecha.slice(8, 10), 10) || 15,
                        fecha: pt.fecha,
                        monto: pt.montoUsd,
                        monedaOrigen: pt.monedaOrigen || 'USD',
                        montoOriginalBs: pt.monedaOrigen === 'VES' ? pt.montoOriginal : 0,
                        tarjetaId: (trjGId && trjGId !== '__EFECTIVO__') ? trjGId : null,
                        cobrado: false,
                        timestamp: nowGas + idxP,
                        fechaActualizacion: nowGas
                    });
                });
            }
        }
    } else {
        targetGasto = {
            id: "GAS-" + nowGas,
            tipo: tipo,
            categoria: c,
            concepto: cp,
            dia: d,
            fecha: fecha,
            monto: m,
            monedaOrigen: monIn,
            montoOriginalBs: (monIn === 'VES') ? conv.bs : 0,
            tasaTipo: tasaModo,
            tasaUsada: conv.tasaUsada || 0,
            pilar: pilar,
            tarjetaId: trjGId || null,
            esPrestamo: esPres,
            personaPrestamo: personaPres,
            tipoDevolucionPrestamo: modDev,
            cuotasPrestamo: partesPrestamo,
            pagado: descontarAhora,
            montoAbonado: descontarAhora ? m : 0,
            fechaPago: descontarAhora ? new Date().toISOString() : undefined,
            timestamp: nowGas,
            fechaActualizacion: nowGas
        };

        if (descontarAhora && trjGId && trjGId !== '__EFECTIVO__') {
            var movNew = aplicarTarjetasMovimientoFinanzas(targetGasto, false, [{ tarjetaId: trjGId, montoUsd: m }], (esPres ? 'Préstamo a ' + personaPres : ('Gasto: ' + cp)));
            if (!movNew || movNew.length === 0) {
                targetGasto.pagado = false;
                targetGasto.montoAbonado = 0;
                delete targetGasto.fechaPago;
                alert("Guardado pendiente: no hay tasa API cargada para convertir y descontar de esa tarjeta en Bs.");
            }
        }

        APP_STATE.finanzas.gastos.push(targetGasto);

        if (esPres && partesPrestamo.length > 0) {
            partesPrestamo.forEach(function(pt, idxP) {
                APP_STATE.finanzas.ingresos.push({
                    id: 'ING-PREST-' + nowGas + '-' + (idxP + 1),
                    fuente: partesPrestamo.length > 1 ? ('Cobro Préstamo ' + personaPres + ' (Parte ' + (idxP + 1) + '/' + partesPrestamo.length + ')') : ('Cobro Préstamo ' + personaPres),
                    tipo: 'aleatoria',
                    esCobroPrestamo: true,
                    prestamoGastoId: targetGasto.id,
                    cuotaPrestamoIdx: idxP + 1,
                    personaPrestamo: personaPres,
                    dia: parseInt(pt.fecha.slice(8, 10), 10) || 15,
                    fecha: pt.fecha,
                    monto: pt.montoUsd,
                    monedaOrigen: pt.monedaOrigen || 'USD',
                    montoOriginalBs: pt.monedaOrigen === 'VES' ? pt.montoOriginal : 0,
                    tarjetaId: (trjGId && trjGId !== '__EFECTIVO__') ? trjGId : null,
                    cobrado: false,
                    timestamp: nowGas + idxP,
                    fechaActualizacion: nowGas
                });
            });
        }
    }

    if (inCp) inCp.value = "";
    if (inM) inM.value = "";
    if (selTrjG) selTrjG.value = "";

    MonarcaDB.save(APP_STATE);
    cerrarModalGasto();
    renderizarFinanzas(APP_STATE.finanzas);
}

function pagarGastoUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.gastos) return;
    var tarjetas = (typeof asegurarArrayTarjetasFinanzas === 'function') ? asegurarArrayTarjetasFinanzas() : [];
    for (var i = 0; i < APP_STATE.finanzas.gastos.length; i++) {
        var g = APP_STATE.finanzas.gastos[i];
        if (g.id === id) {
            if (!g.pagado && (!g.tarjetaId || g.tarjetaId === '') && tarjetas.length > 0) {
                if (typeof abrirModalAbonoPlanificacion === 'function') {
                    var existeEnPlan = (typeof buscarItemPlanificacionPorClave === 'function') ? buscarItemPlanificacionPorClave('gasto', g.id) : null;
                    if (existeEnPlan) {
                        abrirModalAbonoPlanificacion('gasto', g.id, 'completo');
                        return;
                    }
                }
                if (typeof editarGastoFinanzasUI === 'function') {
                    editarGastoFinanzasUI(g.id);
                    var selEdT = document.getElementById('modal-gasto-tarjeta');
                    var chkEdD = document.getElementById('modal-gasto-descontar-ahora');
                    if (chkEdD) chkEdD.checked = true;
                    if (selEdT) selEdT.focus();
                    return;
                }
            }
            var estG = (typeof normalizarAbonosGasto === 'function')
                ? normalizarAbonosGasto(g)
                : { restante: Number(g.monto) || 0, abonado: 0 };
            if (!g.pagado) {
                var montoRest = estG.restante;
                if (Array.isArray(g.abonos) && g.abonos.length > 0 && montoRest > 0.009) {
                    var abId = 'PLA-' + Date.now();
                    var movPart = (g.tarjetaId && g.tarjetaId !== '__EFECTIVO__' && typeof aplicarMovimientoEnTarjeta === 'function')
                        ? aplicarMovimientoEnTarjeta(g.tarjetaId, 'retiro', montoRest, 'USD', 'Liquidación gasto: ' + (g.concepto || g.categoria || 'Pago'), abId)
                        : null;
                    g.abonos.push({
                        id: abId,
                        montoUsd: montoRest,
                        montoBs: movPart ? (movPart.tasaUsada * montoRest) : 0,
                        tasaUsada: movPart ? movPart.tasaUsada : 0,
                        tarjetaId: (g.tarjetaId && g.tarjetaId !== '__EFECTIVO__') ? g.tarjetaId : null,
                        deltaNativo: movPart ? movPart.deltaNativo : 0,
                        deltaUsdRef: movPart ? movPart.deltaUsdRef : 0,
                        nota: 'Liquidación gasto',
                        fecha: new Date().toISOString()
                    });
                    normalizarAbonosGasto(g);
                } else {
                    g.pagado = true;
                    g.montoAbonado = Number(g.monto) || 0;
                    g.fechaPago = new Date().toISOString();
                    if (g.tarjetaId && g.tarjetaId !== '__EFECTIVO__' && Number(g.monto) > 0 && typeof aplicarMovimientoEnTarjeta === 'function') {
                        aplicarTarjetasMovimientoFinanzas(g, false, [{ tarjetaId: g.tarjetaId, montoUsd: Number(g.monto) }], 'Gasto: ' + (g.concepto || g.categoria || 'Pago'));
                    }
                }
                g.fechaActualizacion = Date.now();
            }
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function deshacerPagoGastoUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.gastos) return;
    for (var i = 0; i < APP_STATE.finanzas.gastos.length; i++) {
        var g = APP_STATE.finanzas.gastos[i];
        if (g.id === id) {
            if (Array.isArray(g.abonos) && g.abonos.length > 0) {
                g.abonos.forEach(function(ab) {
                    if (ab.tarjetaId && ab.deltaNativo && typeof revertirMovimientoEnTarjeta === 'function') {
                        revertirMovimientoEnTarjeta(ab.tarjetaId, false, ab.deltaNativo, ab.deltaUsdRef, ab.id);
                    }
                });
                g.abonos = [];
            }
            revertirTarjetasMovimientoFinanzas(g, false);
            g.pagado = false;
            g.montoAbonado = 0;
            delete g.fechaPago;
            g.fechaActualizacion = Date.now();
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function calcularSiguienteFechaQuinceUltimo(fechaActual) {
    var y = fechaActual.getFullYear();
    var m = fechaActual.getMonth();
    var d = fechaActual.getDate();
    var ultimoDiaMes = new Date(y, m + 1, 0).getDate();

    if (d < 15) {
        return new Date(y, m, 15, 12, 0, 0);
    } else if (d < ultimoDiaMes) {
        return new Date(y, m, ultimoDiaMes, 12, 0, 0);
    } else {
        return new Date(y, m + 1, 15, 12, 0, 0);
    }
}

function generarArrayFechasCuotas(fechaInicioStr, numCuotas, tipoFrecuencia, diasFrec) {
    var fechas = [];
    var currDate = fechaInicioStr ? new Date(fechaInicioStr + 'T12:00:00') : new Date();
    if (isNaN(currDate.getTime())) currDate = new Date();

    for (var i = 0; i < numCuotas; i++) {
        if (i === 0) {
            fechas.push(currDate.toISOString().slice(0, 10));
        } else {
            if (tipoFrecuencia === 'quince_ultimo') {
                currDate = calcularSiguienteFechaQuinceUltimo(currDate);
            } else {
                var df = parseInt(diasFrec, 10) || 15;
                currDate = new Date(currDate.getTime() + df * 24 * 60 * 60 * 1000);
            }
            fechas.push(currDate.toISOString().slice(0, 10));
        }
    }
    return fechas;
}

function seleccionarModalidadDeudaModal(modalidad) {
    var esLibre = (modalidad === 'libre');
    var inMod = document.getElementById('modal-deuda-modalidad');
    var btnC = document.getElementById('btn-deuda-mod-cuotas');
    var btnL = document.getElementById('btn-deuda-mod-libre');
    var grpCuotasWrap = document.getElementById('grupo-deuda-cuotas-wrap');
    var grpCrono = document.getElementById('grupo-deuda-cronograma-campos');
    var btnSave = document.getElementById('btn-confirmar-guardar-deuda');

    if (inMod) inMod.value = esLibre ? 'libre' : 'cuotas_fijas';
    if (btnC) btnC.classList.toggle('is-active', !esLibre);
    if (btnL) btnL.classList.toggle('is-active', esLibre);
    if (grpCuotasWrap) grpCuotasWrap.style.display = esLibre ? 'none' : 'block';
    if (grpCrono) grpCrono.style.display = esLibre ? 'none' : 'grid';
    if (btnSave) btnSave.textContent = esLibre ? '✓ Guardar Deuda Flexible' : '✓ Guardar & Crear Cronograma';

    alCambiarValoresModalDeuda();
}

function alCambiarFrecuenciaModalDeuda() {
    var sel = document.getElementById('modal-deuda-frecuencia');
    var grupoCustom = document.getElementById('grupo-deuda-dias-custom');
    var inFecha = document.getElementById('modal-deuda-fecha-inicio');
    if (!sel) return;
    if (sel.value === 'custom') {
        if (grupoCustom) grupoCustom.style.display = 'block';
        var inCustom = document.getElementById('modal-deuda-dias-custom');
        if (inCustom && !inCustom.value) inCustom.value = '15';
    } else {
        if (grupoCustom) grupoCustom.style.display = 'none';
    }

    if (sel.value === 'quince_ultimo' && inFecha) {
        var hoy = new Date();
        var y = hoy.getFullYear();
        var m = hoy.getMonth();
        var d = hoy.getDate();
        var ultDia = new Date(y, m + 1, 0).getDate();
        var sugerida = (d <= 15) ? new Date(y, m, 15, 12, 0, 0) : new Date(y, m, ultDia, 12, 0, 0);
        inFecha.value = sugerida.toISOString().slice(0, 10);
    }

    alCambiarValoresModalDeuda();
}

function alCambiarValoresModalDeuda() {
    var inMod = document.getElementById('modal-deuda-modalidad');
    var esLibre = !!(inMod && inMod.value === 'libre');
    var inTotal = document.getElementById('modal-deuda-precio-total');
    var inIni = document.getElementById('modal-deuda-inicial');
    var inRest = document.getElementById('modal-deuda-restante');
    var inCuotas = document.getElementById('modal-deuda-cuotas');
    var inFrec = document.getElementById('modal-deuda-frecuencia');
    var inCustom = document.getElementById('modal-deuda-dias-custom');
    var inFecha = document.getElementById('modal-deuda-fecha-inicio');
    var selMon = document.getElementById('modal-deuda-moneda');
    var selTasa = document.getElementById('modal-deuda-tasa-tipo');
    var convPrev = document.getElementById('modal-deuda-conv-preview');
    var labelValor = document.getElementById('label-valor-cada-cuota');
    var textDetalle = document.getElementById('texto-detalle-cronograma-deuda');

    var monIn = selMon ? selMon.value : 'USD';
    var tasaModo = selTasa ? selTasa.value : 'bcv';
    if (selTasa) selTasa.style.display = (monIn === 'VES') ? 'block' : 'none';

    var rawTotal = inTotal ? (parseFloat(inTotal.value) || 0) : 0;
    var rawIni = inIni ? (parseFloat(inIni.value) || 0) : 0;
    var convTot = convertirMontoFinanzasAUsd(rawTotal, monIn, tasaModo);
    var convIni = convertirMontoFinanzasAUsd(rawIni, monIn, tasaModo);

    var total = convTot.valido ? convTot.usd : 0;
    var inicial = convIni.valido ? convIni.usd : 0;
    if (inicial > total && total > 0) inicial = total;
    var restante = Math.max(0, Math.round((total - inicial) * 100) / 100);

    if (convPrev) {
        if (monIn === 'VES' && rawTotal > 0) {
            convPrev.style.display = 'block';
            convPrev.innerHTML = convTot.valido
                ? ('Total: <strong style="color:#fbbf24;">$' + total.toFixed(2) + ' USD</strong> · Inicial: <strong style="color:#34d399;">$' + inicial.toFixed(2) + '</strong> (Tasa ' + escaparHTML(convTot.tasaLabel) + ': ' + Number(convTot.tasaUsada).toFixed(2) + ')')
                : '⚠️ Sin tasa API cargada en caché para convertir Bs. a $.';
        } else {
            convPrev.style.display = 'none';
        }
    }

    if (inRest) inRest.value = '$' + restante.toFixed(2);

    if (esLibre) {
        if (labelValor) labelValor.textContent = 'A tu ritmo · Sin cuotas fijas';
        if (textDetalle) {
            textDetalle.innerHTML = total <= 0
                ? 'Ingresa el monto total de la deuda. Podrás abonar cuando quieras sin alertas de vencimiento.'
                : 'Restante flexible: <strong style="color:#67e8f9;">$' + restante.toFixed(2) + '</strong>. Abona en $ o Bs. poco a poco desde el botón <strong>💵 Abonar</strong> (sin fechas fijas ni cobros obligatorios 15 y último).';
        }
        return;
    }

    var numCuotas = inCuotas ? (parseInt(inCuotas.value, 10) || 1) : 1;
    if (numCuotas < 1) numCuotas = 1;

    var montoPorCuota = numCuotas > 0 ? (restante / numCuotas) : 0;
    if (labelValor) labelValor.textContent = '$' + montoPorCuota.toFixed(2) + ' / cuota';

    var tipoFrec = inFrec ? inFrec.value : 'quince_ultimo';
    var diasFrec = 15;
    var textoFrecuencia = '15 y Último de cada mes';

    if (tipoFrec === 'quince_ultimo') {
        diasFrec = 15;
        textoFrecuencia = '🗓️ 15 y Último de cada mes (15 y 30/31)';
    } else if (tipoFrec === 'custom') {
        diasFrec = inCustom ? (parseInt(inCustom.value, 10) || 15) : 15;
        textoFrecuencia = 'cada ' + diasFrec + ' días';
    } else {
        diasFrec = parseInt(tipoFrec, 10) || 15;
        textoFrecuencia = 'cada ' + diasFrec + ' días';
    }

    var fechaIniStr = inFecha ? inFecha.value : '';
    if (!fechaIniStr) {
        if (tipoFrec === 'quince_ultimo') {
            var hoy = new Date();
            var y = hoy.getFullYear();
            var m = hoy.getMonth();
            var d = hoy.getDate();
            var ultDia = new Date(y, m + 1, 0).getDate();
            var sugerida = (d <= 15) ? new Date(y, m, 15, 12, 0, 0) : new Date(y, m, ultDia, 12, 0, 0);
            fechaIniStr = sugerida.toISOString().slice(0, 10);
        } else {
            var dNext = new Date();
            dNext.setDate(dNext.getDate() + diasFrec);
            fechaIniStr = dNext.toISOString().slice(0, 10);
        }
        if (inFecha) inFecha.value = fechaIniStr;
    }

    if (textDetalle) {
        if (total <= 0) {
            textDetalle.textContent = 'Ingresa el precio total y las cuotas para calcular el cronograma.';
        } else {
            textDetalle.innerHTML = 'Plan: <strong>' + numCuotas + ' cuotas de $' + montoPorCuota.toFixed(2) + '</strong> ' +
                '(' + textoFrecuencia + '). Primera cuota: <strong>' + formatearFechaCorta(fechaIniStr) + '</strong>. ' +
                (inicial > 0 ? '<span style="color:#10b981;">(Inicial pagada: $' + inicial.toFixed(2) + ')</span>' : '');
        }
    }
}

function abrirModalDeuda() {
    var m = document.getElementById('modal-finanzas-deuda') || document.getElementById('modal-finanza-deuda');
    if (m) {
        m.style.display = 'flex';
        var inN = document.getElementById('modal-deuda-nombre');
        var inTotal = document.getElementById('modal-deuda-precio-total');
        var inIni = document.getElementById('modal-deuda-inicial');
        var inCuotas = document.getElementById('modal-deuda-cuotas');
        var inFrec = document.getElementById('modal-deuda-frecuencia');
        var inCustom = document.getElementById('modal-deuda-dias-custom');
        var grupoCustom = document.getElementById('grupo-deuda-dias-custom');
        var inFecha = document.getElementById('modal-deuda-fecha-inicio');
        var selMon = document.getElementById('modal-deuda-moneda');
        var selTasa = document.getElementById('modal-deuda-tasa-tipo');

        if (inN) inN.value = '';
        if (inTotal) inTotal.value = '';
        if (inIni) inIni.value = '0.00';
        if (inCuotas) inCuotas.value = '6';
        if (inFrec) inFrec.value = 'quince_ultimo';
        if (grupoCustom) grupoCustom.style.display = 'none';
        if (inCustom) inCustom.value = '';
        if (selMon) selMon.value = 'USD';
        if (selTasa) selTasa.value = 'bcv';

        var hoy = new Date();
        var y = hoy.getFullYear();
        var mMes = hoy.getMonth();
        var d = hoy.getDate();
        var ultDia = new Date(y, mMes + 1, 0).getDate();
        var sugerida = (d <= 15) ? new Date(y, mMes, 15, 12, 0, 0) : new Date(y, mMes, ultDia, 12, 0, 0);
        if (inFecha) inFecha.value = sugerida.toISOString().slice(0, 10);

        seleccionarModalidadDeudaModal('cuotas_fijas');
        setTimeout(function() { if (inN) inN.focus(); }, 120);
    }
}

function cerrarModalDeuda() {
    var m = document.getElementById('modal-finanzas-deuda') || document.getElementById('modal-finanza-deuda');
    if (m) m.style.display = 'none';
}

function confirmarAgregarDeuda() {
    var inMod = document.getElementById('modal-deuda-modalidad');
    var esLibre = !!(inMod && inMod.value === 'libre');
    var inN = document.getElementById('modal-deuda-nombre');
    var inCat = document.getElementById('modal-deuda-categoria');
    var inTotal = document.getElementById('modal-deuda-precio-total');
    var inIni = document.getElementById('modal-deuda-inicial');
    var inCuotas = document.getElementById('modal-deuda-cuotas');
    var inFrec = document.getElementById('modal-deuda-frecuencia');
    var inCustom = document.getElementById('modal-deuda-dias-custom');
    var inFecha = document.getElementById('modal-deuda-fecha-inicio');
    var selMon = document.getElementById('modal-deuda-moneda');
    var selTasa = document.getElementById('modal-deuda-tasa-tipo');

    var nombre = inN ? inN.value.trim() : '';
    var categoria = inCat ? inCat.value : '📦 Otros Compromisos';
    var monIn = selMon ? selMon.value : 'USD';
    var tasaModo = selTasa ? selTasa.value : 'bcv';
    var rawTotal = inTotal ? (parseFloat(inTotal.value) || 0) : 0;
    var rawIni = inIni ? (parseFloat(inIni.value) || 0) : 0;

    if (!nombre) {
        alert('Por favor escribe el nombre de la deuda o crédito.');
        if (inN) inN.focus();
        return;
    }
    if (rawTotal <= 0) {
        alert('Ingresa un monto total válido mayor a 0.');
        if (inTotal) inTotal.focus();
        return;
    }

    var convTot = convertirMontoFinanzasAUsd(rawTotal, monIn, tasaModo);
    var convIni = convertirMontoFinanzasAUsd(rawIni, monIn, tasaModo);
    if (!convTot.valido || convTot.usd <= 0) {
        alert('No hay tasa API en caché para convertir Bolívares a $ USD.');
        return;
    }

    var total = convTot.usd;
    var inicial = Math.min(total, convIni.valido ? convIni.usd : 0);
    var restante = Math.max(0, Math.round((total - inicial) * 100) / 100);

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.deudas) APP_STATE.finanzas.deudas = [];

    var nowDeu = Date.now();
    var nuevaDeuda;

    if (esLibre) {
        nuevaDeuda = {
            id: 'DEU-' + nowDeu,
            nombre: nombre,
            categoria: categoria,
            iconoCategoria: categoria.slice(0, 2),
            esFlexible: true,
            tipoFrecuencia: 'libre',
            diasFrecuencia: 0,
            precioTotal: total,
            pagoInicial: inicial,
            montoRestante: restante,
            cuotasTotal: 0,
            cuotasPagadas: 0,
            montoCuota: 0,
            fechaInicio: '',
            cuotas: [],
            abonosLibres: [],
            monedaOrigen: monIn,
            montoOriginalBs: monIn === 'VES' ? convTot.bs : 0,
            montoTotal: restante,
            dia: 0,
            pagada: restante <= 0,
            timestamp: nowDeu,
            fechaActualizacion: nowDeu
        };
    } else {
        var numCuotas = inCuotas ? (parseInt(inCuotas.value, 10) || 1) : 1;
        if (numCuotas < 1) {
            alert('El número de cuotas debe ser al menos 1.');
            if (inCuotas) inCuotas.focus();
            return;
        }
        var tipoFrec = inFrec ? inFrec.value : 'quince_ultimo';
        var diasFrec = 15;
        if (tipoFrec === 'custom') {
            diasFrec = inCustom ? (parseInt(inCustom.value, 10) || 15) : 15;
        } else if (tipoFrec === 'quince_ultimo') {
            diasFrec = 15;
        } else {
            diasFrec = parseInt(tipoFrec, 10) || 15;
        }
        var fechaInicio = inFecha ? inFecha.value : new Date().toISOString().slice(0, 10);
        var montoPorCuota = Math.round((restante / numCuotas) * 100) / 100;
        var fechasCuotas = generarArrayFechasCuotas(fechaInicio, numCuotas, tipoFrec, diasFrec);
        var cuotas = [];
        for (var i = 1; i <= numCuotas; i++) {
            cuotas.push({
                num: i,
                fecha: fechasCuotas[i - 1] || fechaInicio,
                monto: montoPorCuota,
                pagada: false,
                fechaPago: null
            });
        }
        var baseDate = new Date(fechaInicio + 'T12:00:00');
        nuevaDeuda = {
            id: 'DEU-' + nowDeu,
            nombre: nombre,
            categoria: categoria,
            iconoCategoria: categoria.slice(0, 2),
            esFlexible: false,
            precioTotal: total,
            pagoInicial: inicial,
            montoRestante: restante,
            cuotasTotal: numCuotas,
            cuotasPagadas: 0,
            montoCuota: montoPorCuota,
            tipoFrecuencia: tipoFrec,
            diasFrecuencia: diasFrec,
            fechaInicio: fechaInicio,
            cuotas: cuotas,
            abonosLibres: [],
            monedaOrigen: monIn,
            montoOriginalBs: monIn === 'VES' ? convTot.bs : 0,
            montoTotal: restante,
            dia: isNaN(baseDate.getDate()) ? 15 : baseDate.getDate(),
            pagada: restante <= 0,
            timestamp: nowDeu,
            fechaActualizacion: nowDeu
        };
    }

    APP_STATE.finanzas.deudas.unshift(nuevaDeuda);
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

    var nowMet = Date.now();
    APP_STATE.finanzas.metas.push({
        id: "MET-" + nowMet,
        nombre: n,
        metaTotal: t,
        ahorrado: a,
        faltante: falt,
        meses: m,
        cuotaQuincenal: Math.round(cuotaVal * 100) / 100,
        timestamp: nowMet,
        fechaActualizacion: nowMet
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
    meta.fechaActualizacion = Date.now();

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

function actualizarPreviewCobroTarjeta() {
    var prev = document.getElementById('modal-cobro-tarjeta-preview');
    var selTarj = document.getElementById('modal-cobro-ingreso-tarjeta');
    var inReal = document.getElementById('modal-cobro-ingreso-real');
    if (esModoSplitTarjetasActivo('cobro')) {
        actualizarResumenSplitTarjetasUI('cobro');
    }
    if (!prev) return;

    if (esModoSplitTarjetasActivo('cobro')) {
        var filas = leerFilasSplitTarjetasModal('cobro');
        if (filas.length === 0) {
            prev.style.display = 'none';
            return;
        }
        var tarjetas = asegurarArrayTarjetasFinanzas();
        var partesHtml = filas.map(function(r) {
            var tObj = tarjetas.find(function(x) { return x.id === r.tarjetaId; });
            if (!tObj) return '';
            var est = calcularEstadoTarjetaEnVivo(tObj);
            if (est.monedaBase === 'USD') {
                return '• <strong style="color:#fbbf24;">+' + formatearUsdTarjeta(r.montoUsd) + ' USDT</strong> a ' + escaparHTML(construirTituloTarjeta(tObj));
            }
            if (est.tasaActual > 0) {
                return '• <strong style="color:#7dd3fc;">+' + formatearTasaBsDisplay(r.montoUsd * est.tasaActual, 2) + '</strong> (' + formatearUsdTarjeta(r.montoUsd) + ') a ' + escaparHTML(construirTituloTarjeta(tObj));
            }
            return '• +$' + r.montoUsd.toFixed(2) + ' a ' + escaparHTML(construirTituloTarjeta(tObj));
        }).filter(Boolean);
        if (partesHtml.length === 0) {
            prev.style.display = 'none';
            return;
        }
        prev.style.display = 'block';
        prev.innerHTML = partesHtml.join('<br>');
        return;
    }

    if (!selTarj) return;
    var trjId = selTarj.value;
    if (!trjId) {
        prev.style.display = 'none';
        return;
    }

    var t = asegurarArrayTarjetasFinanzas().find(function(x) { return x.id === trjId; });
    if (!t) {
        prev.style.display = 'none';
        return;
    }
    var est = calcularEstadoTarjetaEnVivo(t);
    var montoUsd = Math.max(0, parseFloat(inReal ? inReal.value : '0') || 0);

    prev.style.display = 'block';
    if (est.monedaBase === 'USD') {
        prev.innerHTML = 'Entrarán <strong style="color:#fbbf24;">+' + formatearUsdTarjeta(montoUsd) + ' USDT</strong> directo a ' + escaparHTML(construirTituloTarjeta(t)) + '.';
    } else if (est.tasaActual > 0) {
        var bsAdd = montoUsd * est.tasaActual;
        prev.innerHTML = 'Entrarán <strong style="color:#7dd3fc;">+' + formatearTasaBsDisplay(bsAdd, 2) + '</strong> a tasa ' + escaparHTML(est.tasaLabel) + ' (<strong>' + Number(est.tasaActual).toFixed(2) + '</strong>) en ' + escaparHTML(construirTituloTarjeta(t)) + '.';
    } else {
        prev.innerHTML = '⚠️ No hay tasa API cargada para convertir $ a Bs. Actualiza las tasas primero.';
    }
}

function cobrarIngresoUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.ingresos) return;
    var item = APP_STATE.finanzas.ingresos.find(function(x) { return x.id === id; });
    if (!item) return;

    var modal = document.getElementById('modal-confirmar-cobro-ingreso');
    if (modal) {
        if (typeof poblarSelectsTarjetasFinanzas === 'function') poblarSelectsTarjetasFinanzas();

        var inId = document.getElementById('modal-cobro-ingreso-id');
        var elTitulo = document.getElementById('modal-cobro-ingreso-titulo');
        var elProy = document.getElementById('modal-cobro-ingreso-proyectado');
        var inReal = document.getElementById('modal-cobro-ingreso-real');
        var selTarj = document.getElementById('modal-cobro-ingreso-tarjeta');

        var tit = item.fuente || item.concepto || item.nombre || 'Entrada Fija';
        var mProy = Number(item.monto) || 0;
        var mDefecto = (item.montoCobrado !== undefined && item.montoCobrado !== null && item.montoCobrado !== "")
            ? Number(item.montoCobrado)
            : mProy;

        if (inId) inId.value = id;
        if (elTitulo) elTitulo.innerText = tit;
        if (elProy) elProy.innerText = '$' + mProy.toFixed(2);
        if (inReal) inReal.value = mDefecto.toFixed(2);

        var tarjetas = asegurarArrayTarjetasFinanzas();
        var distPre = Array.isArray(item.tarjetasMovs) && item.tarjetasMovs.length > 0
            ? item.tarjetasMovs.map(function(r) { return { tarjetaId: r.tarjetaId, montoUsd: r.montoUsd || r.deltaUsdRef || 0 }; })
            : (Array.isArray(item.tarjetasDistribucion) && item.tarjetasDistribucion.length > 0 ? item.tarjetasDistribucion : null);

        if (distPre && distPre.length > 1) {
            establecerModoSplitTarjetasModal('cobro', true, distPre);
        } else {
            establecerModoSplitTarjetasModal('cobro', false);
            var idPre = (distPre && distPre.length === 1) ? distPre[0].tarjetaId : (item.tarjetaId || '');
            if (selTarj) {
                var existeTarj = idPre && tarjetas.some(function(x) { return x.id === idPre; });
                selTarj.value = existeTarj ? idPre : '';
            }
        }
        actualizarPreviewCobroTarjeta();

        modal.style.display = 'flex';
        setTimeout(function() {
            if (inReal) {
                inReal.focus();
                inReal.select();
            }
        }, 80);
        return;
    }

    item.cobrado = true;
    item.fechaCobro = new Date().toISOString();
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

var _reversionCobroCallback = null;

function solicitarReversionCobro(mensaje, onConfirmar) {
    _reversionCobroCallback = onConfirmar;
    var m = document.getElementById('modal-confirmar-reversion-cobro');
    if (m) {
        var elTxt = document.getElementById('modal-reversion-cobro-texto');
        if (elTxt && mensaje) elTxt.innerText = mensaje;
        m.style.display = 'flex';
        return;
    }
    if (confirm(mensaje || "¿Estás seguro de que deseas revertir este cobro y devolverlo a estado pendiente?")) {
        if (typeof onConfirmar === 'function') onConfirmar();
    }
}

function cerrarModalReversionCobro() {
    var m = document.getElementById('modal-confirmar-reversion-cobro');
    if (m) m.style.display = 'none';
    _reversionCobroCallback = null;
}

function ejecutarReversionCobroConfirmada() {
    var cb = _reversionCobroCallback;
    cerrarModalReversionCobro();
    if (typeof cb === 'function') {
        cb();
    }
}

function cerrarModalConfirmarCobro() {
    var modal = document.getElementById('modal-confirmar-cobro-ingreso');
    if (modal) modal.style.display = 'none';
}

function ejecutarCobroIngresoReal() {
    var inId = document.getElementById('modal-cobro-ingreso-id');
    var inReal = document.getElementById('modal-cobro-ingreso-real');
    var selTarj = document.getElementById('modal-cobro-ingreso-tarjeta');
    if (!inId || !inReal) return;

    var id = inId.value;
    var montoVal = parseFloat(inReal.value);
    if (isNaN(montoVal) || montoVal < 0) {
        alert("Por favor ingresa un monto válido mayor o igual a 0.");
        return;
    }
    montoVal = Math.round(montoVal * 100) / 100;

    var distCobro = [];
    var esSplit = esModoSplitTarjetasActivo('cobro');
    if (esSplit) {
        distCobro = leerFilasSplitTarjetasModal('cobro');
        if (distCobro.length === 0) {
            alert("Agrega al menos 1 tarjeta con monto en la división o vuelve a 1 sola tarjeta.");
            return;
        }
        var sumSplitC = Math.round(distCobro.reduce(function(acc, r) { return acc + r.montoUsd; }, 0) * 100) / 100;
        if (Math.abs(sumSplitC - montoVal) > 0.05) {
            alert("La suma asignada a las tarjetas ($" + sumSplitC.toFixed(2) + ") debe coincidir con lo cobrado ($" + montoVal.toFixed(2) + ").");
            return;
        }
    } else {
        var trjId = selTarj ? selTarj.value : '';
        if (trjId && montoVal > 0) {
            distCobro = [{ tarjetaId: trjId, montoUsd: montoVal }];
        }
    }

    // Caso especial: Pago de Sueldo / Bono de Boom Solutions
    if (id.indexOf('BOOM:') === 0) {
        var partes = id.split(':');
        var tipoPago = partes[1];
        var idFinanza = partes[2];

        if (typeof asegurarEstructuraBoom === 'function') asegurarEstructuraBoom();
        if (APP_STATE.subappBoom && APP_STATE.subappBoom.planificaciones) {
            var mesKey = (typeof MES_BOOM_ACTUAL !== 'undefined') ? MES_BOOM_ACTUAL : new Date().toISOString().slice(0, 7);
            var planMes = APP_STATE.subappBoom.planificaciones[mesKey];
            if (planMes) {
                if (!planMes.pagosCobrados) planMes.pagosCobrados = {};
                planMes.pagosCobrados[tipoPago] = true;
                if (!planMes.montosRealesCobrados) planMes.montosRealesCobrados = {};
                planMes.montosRealesCobrados[tipoPago] = montoVal;
            }
        }

        var config = (APP_STATE.subappBoom && APP_STATE.subappBoom.config) || {};
        var montoProy = 0;
        var concepto = '';
        var diaCobro = 1;
        if (tipoPago === 'bono3') {
            montoProy = Number(config.bonoDia3) || 40;
            concepto = "Bono Boom Solutions (Día 3)";
            diaCobro = 3;
        } else if (tipoPago === 'quincena1') {
            montoProy = Number(config.sueldoQuincena1) || 205;
            concepto = "Sueldo Quincena 1 Boom Solutions (Día 15)";
            diaCobro = 15;
        } else if (tipoPago === 'quincena2') {
            montoProy = Number(config.sueldoQuincena2) || 205;
            concepto = "Sueldo Quincena 2 Boom Solutions (Día 30)";
            diaCobro = 30;
        }

        if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
        if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];

        var existe = APP_STATE.finanzas.ingresos.find(function(x) { return x.id === idFinanza; });
        var mesActualStr = (typeof MES_BOOM_ACTUAL !== 'undefined') ? MES_BOOM_ACTUAL : new Date().toISOString().slice(0, 7);
        var fechaCobro = mesActualStr + '-' + String(diaCobro).padStart(2, '0');
        var targetBoomItem = existe;

        if (targetBoomItem) {
            revertirTarjetasMovimientoFinanzas(targetBoomItem, true);
            targetBoomItem.cobrado = true;
            targetBoomItem.tipo = 'fija';
            targetBoomItem.categoria = "Sueldos & Pagos Programados";
            targetBoomItem.fuente = concepto;
            targetBoomItem.monto = montoProy;
            targetBoomItem.montoCobrado = montoVal;
            targetBoomItem.dia = diaCobro;
            targetBoomItem.fecha = fechaCobro;
            targetBoomItem.fechaCobro = new Date().toISOString();
        } else {
            targetBoomItem = {
                id: idFinanza,
                fuente: concepto,
                tipo: 'fija',
                categoria: "Sueldos & Pagos Programados",
                monto: montoProy,
                montoCobrado: montoVal,
                dia: diaCobro,
                fecha: fechaCobro,
                cobrado: true,
                fechaCobro: new Date().toISOString()
            };
            APP_STATE.finanzas.ingresos.push(targetBoomItem);
        }

        targetBoomItem.tarjetasDistribucion = distCobro.slice();
        if (distCobro.length > 0 && montoVal > 0) {
            aplicarTarjetasMovimientoFinanzas(targetBoomItem, true, distCobro, concepto);
        } else {
            delete targetBoomItem.tarjetaId;
            targetBoomItem.tarjetasMovs = [];
        }

        MonarcaDB.save(APP_STATE);
        cerrarModalConfirmarCobro();
        renderizarFinanzas(APP_STATE.finanzas);
        if (typeof renderizarSubAppBoom === 'function') renderizarSubAppBoom();
        return;
    }

    // Caso estándar: Ingreso existente en Finanzas
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.ingresos) return;
    var item = APP_STATE.finanzas.ingresos.find(function(x) { return x.id === id; });
    if (!item) return;

    revertirTarjetasMovimientoFinanzas(item, true);

    item.cobrado = true;
    item.montoCobrado = montoVal;
    item.fechaCobro = new Date().toISOString();
    item.tarjetasDistribucion = distCobro.slice();

    if (distCobro.length > 0 && montoVal > 0) {
        var titMov = item.fuente || item.concepto || item.nombre || 'Cobro Finanzas';
        aplicarTarjetasMovimientoFinanzas(item, true, distCobro, titMov);
    } else {
        delete item.tarjetaId;
        item.tarjetasMovs = [];
    }

    // Sincronizar con Boom Solutions si este ingreso corresponde a Boom
    var descBoom = ((item.fuente || item.concepto || item.descripcion || '') + ' ' + (item.categoria || '')).toLowerCase();
    var idStrB = String(item.id || '').toLowerCase();
    if ((idStrB.indexOf('boom') !== -1 || descBoom.indexOf('boom') !== -1 || item.origenLabor === 'LAB-BOOM') && typeof asegurarEstructuraBoom === 'function') {
        asegurarEstructuraBoom();
        if (APP_STATE.subappBoom && APP_STATE.subappBoom.planificaciones) {
            var mesKey = (typeof MES_BOOM_ACTUAL !== 'undefined') ? MES_BOOM_ACTUAL : new Date().toISOString().slice(0, 7);
            var planMes = APP_STATE.subappBoom.planificaciones[mesKey];
            if (planMes) {
                if (!planMes.pagosCobrados) planMes.pagosCobrados = {};
                if (!planMes.montosRealesCobrados) planMes.montosRealesCobrados = {};

                var tipoPago = 'quincena1';
                var dNum = Number(item.dia);
                if (isNaN(dNum) && item.fecha) {
                    var sp = item.fecha.split('-');
                    if (sp.length === 3) dNum = Number(sp[2]);
                }
                if (descBoom.indexOf('bono') !== -1 || descBoom.indexOf('cesta') !== -1 || dNum <= 5) {
                    tipoPago = 'bono3';
                } else if (dNum > 15 || descBoom.indexOf('quincena 2') !== -1 || descBoom.indexOf('quincena2') !== -1) {
                    tipoPago = 'quincena2';
                } else {
                    tipoPago = 'quincena1';
                }

                planMes.pagosCobrados[tipoPago] = true;
                planMes.montosRealesCobrados[tipoPago] = montoVal;
            }
        }
    }

    // Sincronizar cuota de venta en Inventario si proviene de una venta a crédito
    if (item.ventaId && item.cuotaId && APP_STATE.inventario && Array.isArray(APP_STATE.inventario.ventas)) {
        var vObj = APP_STATE.inventario.ventas.find(function(v) { return v.id === item.ventaId; });
        if (vObj && Array.isArray(vObj.cuotas)) {
            var cObj = vObj.cuotas.find(function(c) { return c.id === item.cuotaId; });
            if (cObj) {
                cObj.cobrado = true;
                cObj.fechaCobrado = new Date().toISOString();
            }
        }
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalConfirmarCobro();
    renderizarFinanzas(APP_STATE.finanzas);
    if (typeof renderizarVendidosInventario === 'function') renderizarVendidosInventario();
    if (typeof renderizarSubAppBoom === 'function') renderizarSubAppBoom();
}

function deshacerCobroIngresoUI(id) {
    solicitarReversionCobro("¿Estás seguro de que deseas revertir este cobro y devolverlo a estado pendiente?", function() {
        if (!APP_STATE.finanzas || !APP_STATE.finanzas.ingresos) return;
        for (var i = 0; i < APP_STATE.finanzas.ingresos.length; i++) {
            if (APP_STATE.finanzas.ingresos[i].id === id) {
                var item = APP_STATE.finanzas.ingresos[i];
                revertirTarjetasMovimientoFinanzas(item, true);
                item.cobrado = false;
                delete item.montoCobrado;
                delete item.fechaCobro;

                if (item.ventaId && item.cuotaId && APP_STATE.inventario && Array.isArray(APP_STATE.inventario.ventas)) {
                    var vObj = APP_STATE.inventario.ventas.find(function(v) { return v.id === item.ventaId; });
                    if (vObj && Array.isArray(vObj.cuotas)) {
                        var cObj = vObj.cuotas.find(function(c) { return c.id === item.cuotaId; });
                        if (cObj) {
                            cObj.cobrado = false;
                            delete cObj.fechaCobrado;
                        }
                    }
                }

                var descB = ((item.fuente || item.concepto || item.descripcion || '') + ' ' + (item.categoria || '')).toLowerCase();
                var idStrB = String(item.id || '').toLowerCase();
                if ((idStrB.indexOf('boom') !== -1 || descB.indexOf('boom') !== -1 || item.origenLabor === 'LAB-BOOM') && APP_STATE.subappBoom && APP_STATE.subappBoom.planificaciones) {
                    var mesKey = (typeof MES_BOOM_ACTUAL !== 'undefined') ? MES_BOOM_ACTUAL : new Date().toISOString().slice(0, 7);
                    var planMes = APP_STATE.subappBoom.planificaciones[mesKey];
                    if (planMes) {
                        var tipoPago = 'quincena1';
                        var dNum = Number(item.dia);
                        if (isNaN(dNum) && item.fecha) {
                            var sp = item.fecha.split('-');
                            if (sp.length === 3) dNum = Number(sp[2]);
                        }
                        if (descB.indexOf('bono') !== -1 || descB.indexOf('cesta') !== -1 || dNum <= 5) {
                            tipoPago = 'bono3';
                        } else if (dNum > 15 || descB.indexOf('quincena 2') !== -1 || descB.indexOf('quincena2') !== -1) {
                            tipoPago = 'quincena2';
                        } else {
                            tipoPago = 'quincena1';
                        }
                        if (planMes.pagosCobrados) planMes.pagosCobrados[tipoPago] = false;
                        if (planMes.montosRealesCobrados) delete planMes.montosRealesCobrados[tipoPago];
                    }
                }
                break;
            }
        }
        MonarcaDB.save(APP_STATE);
        renderizarFinanzas(APP_STATE.finanzas);
        if (typeof renderizarVendidosInventario === 'function') renderizarVendidosInventario();
        if (typeof renderizarSubAppBoom === 'function') renderizarSubAppBoom();
    });
}

function normalizarDeuda(d) {
    if (!d) return;
    if (d.precioTotal == null) d.precioTotal = Number(d.montoTotal) || 0;
    if (d.pagoInicial == null) d.pagoInicial = 0;
    if (!d.categoria) d.categoria = '📦 Otros Compromisos';
    if (!d.iconoCategoria) d.iconoCategoria = d.categoria.slice(0, 2);
    if (!Array.isArray(d.abonosLibres)) d.abonosLibres = [];

    var totalAbonosLibres = 0;
    d.abonosLibres.forEach(function(ab) {
        totalAbonosLibres += (Number(ab.montoUsd) || 0);
    });
    totalAbonosLibres = Math.round(totalAbonosLibres * 100) / 100;

    var esFlex = !!(d.esFlexible || d.tipoFrecuencia === 'libre');
    if (esFlex) {
        d.esFlexible = true;
        d.tipoFrecuencia = 'libre';
        d.diasFrecuencia = 0;
        d.cuotasTotal = 0;
        d.cuotasPagadas = d.abonosLibres.length;
        d.montoCuota = 0;
        d.cuotas = [];
        d.montoRestante = Math.max(0, Math.round((Number(d.precioTotal) - Number(d.pagoInicial) - totalAbonosLibres) * 100) / 100);
        if (d.montoRestante <= 0.009) d.montoRestante = 0;
        d.montoTotal = d.montoRestante;
        d.pagada = (d.montoRestante <= 0);
        return;
    }

    if (d.cuotasTotal == null) d.cuotasTotal = (d.cuotas && d.cuotas.length) ? d.cuotas.length : 1;
    if (d.cuotasPagadas == null) {
        if (d.cuotas && Array.isArray(d.cuotas)) {
            d.cuotasPagadas = d.cuotas.filter(function(c) { return c.pagada; }).length;
        } else {
            d.cuotasPagadas = d.pagada ? d.cuotasTotal : 0;
        }
    }
    if (d.montoCuota == null) {
        var baseRest = Math.max(0, Number(d.precioTotal) - Number(d.pagoInicial));
        d.montoCuota = d.cuotasTotal > 0 ? Math.round((baseRest / d.cuotasTotal) * 100) / 100 : baseRest;
    }
    if (d.tipoFrecuencia == null) {
        if (d.diasFrecuencia === 'quince_ultimo') {
            d.tipoFrecuencia = 'quince_ultimo';
            d.diasFrecuencia = 15;
        } else {
            d.tipoFrecuencia = (d.diasFrecuencia == 15 ? '15' : (d.diasFrecuencia == 30 ? '30' : (d.diasFrecuencia == 7 ? '7' : 'custom')));
        }
    }
    if (d.diasFrecuencia == null) d.diasFrecuencia = 15;

    if (!Array.isArray(d.cuotas) || d.cuotas.length === 0) {
        var cuotas = [];
        var fechasCuotas = generarArrayFechasCuotas(d.fechaInicio || new Date().toISOString().slice(0, 10), d.cuotasTotal, d.tipoFrecuencia, d.diasFrecuencia);
        for (var i = 1; i <= d.cuotasTotal; i++) {
            var fCuotaStr = fechasCuotas[i - 1];
            var isPaid = i <= d.cuotasPagadas || !!d.pagada;
            cuotas.push({
                num: i,
                fecha: fCuotaStr,
                monto: Number(d.montoCuota),
                pagada: isPaid,
                pagadoDirecto: isPaid,
                cubiertaPorAbono: false,
                montoAbonado: isPaid ? Number(d.montoCuota) : 0,
                fechaPago: isPaid ? (d.fechaPago || new Date().toISOString()) : null
            });
        }
        d.cuotas = cuotas;
    }

    var sumDirecto = 0;
    (d.cuotas || []).forEach(function(c) {
        if (c.pagada && !c.cubiertaPorAbono) {
            c.pagadoDirecto = true;
            sumDirecto += (Number(c.monto) || Number(d.montoCuota) || 0);
        } else {
            c.pagadoDirecto = false;
        }
    });

    var pool = totalAbonosLibres;
    (d.cuotas || []).forEach(function(c) {
        var montoC = Number(c.monto) || Number(d.montoCuota) || 0;
        if (c.pagadoDirecto) {
            c.montoAbonado = montoC;
            return;
        }
        if (pool >= montoC - 0.009) {
            c.pagada = true;
            c.cubiertaPorAbono = true;
            c.montoAbonado = montoC;
            if (!c.fechaPago && d.abonosLibres.length > 0) {
                c.fechaPago = d.abonosLibres[d.abonosLibres.length - 1].fecha || new Date().toISOString();
            }
            pool = Math.max(0, Math.round((pool - montoC) * 100) / 100);
        } else {
            c.pagada = false;
            c.cubiertaPorAbono = false;
            c.fechaPago = null;
            c.montoAbonado = Math.round(pool * 100) / 100;
            pool = 0;
        }
    });

    var numPagadas = (d.cuotas || []).filter(function(c) { return c.pagada; }).length;
    d.cuotasPagadas = numPagadas;
    d.montoRestante = Math.max(0, Math.round((Number(d.precioTotal) - Number(d.pagoInicial) - sumDirecto - totalAbonosLibres) * 100) / 100);
    if (d.montoRestante <= 0.009) d.montoRestante = 0;
    d.montoTotal = d.montoRestante;
    d.pagada = (d.cuotasPagadas >= d.cuotasTotal || d.montoRestante <= 0);
}

function formatearFechaCorta(fechaStr) {
    if (!fechaStr) return '';
    try {
        var partes = fechaStr.split('-');
        if (partes.length === 3) {
            return partes[2] + '/' + partes[1] + '/' + partes[0];
        }
    } catch(e) {}
    return fechaStr;
}

function pagarCuotaDeudaUI(deudaId, cuotaNum) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.deudas) return;
    var deuda = APP_STATE.finanzas.deudas.find(function(d) { return d.id === deudaId; });
    if (!deuda) return;
    normalizarDeuda(deuda);

    var targetCuota = null;
    if (cuotaNum != null) {
        targetCuota = (deuda.cuotas || []).find(function(c) { return c.num === cuotaNum; });
    } else {
        targetCuota = (deuda.cuotas || []).find(function(c) { return !c.pagada; });
    }

    if (!targetCuota || targetCuota.pagada) return;

    var montoC = Number(targetCuota.monto) || Number(deuda.montoCuota) || 0;
    var yaAbonado = Number(targetCuota.montoAbonado) || 0;
    if (yaAbonado > 0.009 && !targetCuota.pagadoDirecto) {
        var faltanteC = Math.max(0.01, Math.round((montoC - yaAbonado) * 100) / 100);
        if (!Array.isArray(deuda.abonosLibres)) deuda.abonosLibres = [];
        deuda.abonosLibres.push({
            id: 'PLA-' + Date.now(),
            montoUsd: faltanteC,
            montoBs: 0,
            tasaUsada: 0,
            tarjetaId: null,
            deltaNativo: 0,
            deltaUsdRef: 0,
            nota: 'Cuota #' + targetCuota.num + ' completada',
            fecha: new Date().toISOString()
        });
    } else {
        targetCuota.pagada = true;
        targetCuota.cubiertaPorAbono = false;
        targetCuota.pagadoDirecto = true;
        targetCuota.fechaPago = new Date().toISOString();
    }

    normalizarDeuda(deuda);
    deuda.fechaActualizacion = Date.now();
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);

    if (deuda.pagada) {
        alert('🎉 ¡Felicidades! Has liquidado por completo la deuda de "' + deuda.nombre + '".');
    } else {
        alert('💳 Cuota ' + targetCuota.num + ' de ' + deuda.cuotasTotal + ' de "' + deuda.nombre + '" registrada como pagada ($' + montoC.toFixed(2) + ').');
    }
}

function pagarDeudaUI(id) {
    pagarCuotaDeudaUI(id, null);
}

function deshacerCuotaDeudaUI(deudaId) {
    solicitarReversionCobro("¿Estás seguro de que deseas revertir el último pago/abono de esta deuda y devolverlo a estado pendiente?", function() {
        if (!APP_STATE.finanzas || !APP_STATE.finanzas.deudas) return;
        var deuda = APP_STATE.finanzas.deudas.find(function(d) { return d.id === deudaId; });
        if (!deuda) return;
        normalizarDeuda(deuda);

        var pagadas = (deuda.cuotas || []).filter(function(c) { return c.pagada; });
        var ultimaPagada = pagadas.length > 0 ? pagadas[pagadas.length - 1] : null;

        if ((!ultimaPagada || ultimaPagada.cubiertaPorAbono) && Array.isArray(deuda.abonosLibres) && deuda.abonosLibres.length > 0) {
            var ultAb = deuda.abonosLibres.pop();
            if (ultAb && ultAb.tarjetaId && ultAb.deltaNativo && typeof revertirMovimientoEnTarjeta === 'function') {
                revertirMovimientoEnTarjeta(ultAb.tarjetaId, false, ultAb.deltaNativo, ultAb.deltaUsdRef, ultAb.id);
            }
        } else if (ultimaPagada) {
            ultimaPagada.pagada = false;
            ultimaPagada.pagadoDirecto = false;
            ultimaPagada.cubiertaPorAbono = false;
            ultimaPagada.montoAbonado = 0;
            ultimaPagada.fechaPago = null;
        }

        normalizarDeuda(deuda);
        deuda.fechaActualizacion = Date.now();
        MonarcaDB.save(APP_STATE);
        renderizarFinanzas(APP_STATE.finanzas);
    });
}

function deshacerPagoDeudaUI(id) {
    deshacerCuotaDeudaUI(id);
}

function liquidarDeudaCompletaUI(deudaId) {
    if (!confirm('¿Deseas marcar todas las cuotas pendientes de esta deuda como pagadas?')) return;
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.deudas) return;
    var deuda = APP_STATE.finanzas.deudas.find(function(d) { return d.id === deudaId; });
    if (!deuda) return;
    normalizarDeuda(deuda);

    var tieneAbonosParciales = (Array.isArray(deuda.abonosLibres) && deuda.abonosLibres.length > 0)
        || (deuda.cuotas || []).some(function(c) { return !c.pagada && Number(c.montoAbonado) > 0.009; });

    if (tieneAbonosParciales && deuda.montoRestante > 0.009) {
        if (!Array.isArray(deuda.abonosLibres)) deuda.abonosLibres = [];
        deuda.abonosLibres.push({
            id: 'PLA-' + Date.now(),
            montoUsd: deuda.montoRestante,
            montoBs: 0,
            tasaUsada: 0,
            tarjetaId: null,
            deltaNativo: 0,
            deltaUsdRef: 0,
            nota: 'Liquidación completa',
            fecha: new Date().toISOString()
        });
    } else {
        (deuda.cuotas || []).forEach(function(c) {
            c.pagada = true;
            c.cubiertaPorAbono = false;
            c.pagadoDirecto = true;
            if (!c.fechaPago) c.fechaPago = new Date().toISOString();
        });
    }

    normalizarDeuda(deuda);
    deuda.fechaActualizacion = Date.now();
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
    alert('🎉 Deuda "' + deuda.nombre + '" marcada como 100% liquidada.');
}

function toggleCronogramaDeudaUI(deudaId) {
    var el = document.getElementById('cronograma-deuda-' + deudaId);
    var btn = document.getElementById('btn-toggle-crono-' + deudaId);
    if (!el) return;
    var showLbl = (btn && btn.getAttribute('data-show-lbl')) || '📅 Ver Cronograma de Cuotas ▾';
    var hideLbl = (btn && btn.getAttribute('data-hide-lbl')) || '📅 Ocultar Cronograma ▴';
    if (el.style.display === 'none' || !el.style.display) {
        el.style.display = 'block';
        if (btn) btn.innerHTML = hideLbl;
    } else {
        el.style.display = 'none';
        if (btn) btn.innerHTML = showLbl;
    }
}

function renderizarDeudasYCronograma(f, vq, coincideFn) {
    var totPendientes = 0;
    var totPagadas = 0;
    var deudas = f.deudas || [];
    var tarjetasFin = (typeof asegurarArrayTarjetasFinanzas === 'function') ? asegurarArrayTarjetasFinanzas() : [];

    // Normalizar todas las deudas
    deudas.forEach(function(d) { normalizarDeuda(d); });

    // 1. Encontrar la próxima cuota a pagar más urgente (excluyendo deudas flexibles sin fecha fija)
    var todasCuotasPendientes = [];
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    deudas.forEach(function(d) {
        if (d.pagada || d.esFlexible || d.tipoFrecuencia === 'libre') return;
        (d.cuotas || []).forEach(function(c) {
            if (!c.pagada) {
                todasCuotasPendientes.push({
                    deudaId: d.id,
                    deudaNombre: d.nombre,
                    categoria: d.categoria || 'Compromiso',
                    icono: d.iconoCategoria || '🛡️',
                    cuotaNum: c.num,
                    totalCuotas: d.cuotasTotal,
                    monto: Number(c.monto) || Number(d.montoCuota) || 0,
                    fecha: c.fecha
                });
            }
        });
    });

    todasCuotasPendientes.sort(function(a, b) {
        return new Date(a.fecha + 'T00:00:00').getTime() - new Date(b.fecha + 'T00:00:00').getTime();
    });

    var proximaCuota = todasCuotasPendientes.length > 0 ? todasCuotasPendientes[0] : null;

    // Renderizar Banner Próxima Deuda
    var bannerEl = document.getElementById('banner-proxima-deuda');
    if (bannerEl) {
        if (!proximaCuota) {
            bannerEl.innerHTML = '<div class="banner-proxima-deuda-empty">' +
                '<span style="font-size: 20px;">🛡️</span>' +
                '<div>' +
                    '<div style="font-weight: 700; color: #34d399; font-size: 13.5px;">¡Sin cuotas programadas pendientes!</div>' +
                    '<div style="font-size: 11.5px; color: #94a3b8;">No tienes cuotas fijas por vencer. Tus deudas flexibles se manejan a tu propio ritmo.</div>' +
                '</div>' +
            '</div>';
        } else {
            var fCuota = new Date(proximaCuota.fecha + 'T00:00:00');
            var diffDias = Math.round((fCuota.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
            var badgeTiempo = '';
            var estiloBorde = '';

            if (diffDias < 0) {
                badgeTiempo = '<span class="cuota-badge-vencida">⚠️ Vencida hace ' + Math.abs(diffDias) + (Math.abs(diffDias) === 1 ? ' día' : ' días') + '</span>';
                estiloBorde = 'border-color: rgba(239, 68, 68, 0.5); background: linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%);';
            } else if (diffDias === 0) {
                badgeTiempo = '<span class="cuota-badge-hoy">🔔 ¡Vence Hoy!</span>';
                estiloBorde = 'border-color: rgba(245, 158, 11, 0.5); background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%);';
            } else if (diffDias === 1) {
                badgeTiempo = '<span class="cuota-badge-pronto">⏳ Vence mañana</span>';
                estiloBorde = 'border-color: rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(15, 23, 42, 0.95) 100%);';
            } else {
                badgeTiempo = '<span class="cuota-badge-normal">📅 Vence en ' + diffDias + ' días (' + formatearFechaCorta(proximaCuota.fecha) + ')</span>';
                estiloBorde = 'border-color: rgba(56, 189, 248, 0.4); background: linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%);';
            }

            bannerEl.innerHTML = '<div class="banner-proxima-deuda-card" style="' + estiloBorde + '">' +
                '<div class="bpd-header">' +
                    '<div style="display: flex; align-items: center; gap: 8px;">' +
                        '<span style="font-size: 18px;">🚨</span>' +
                        '<span class="bpd-title">PRÓXIMA CUOTA A PAGAR</span>' +
                    '</div>' +
                    badgeTiempo +
                '</div>' +
                '<div class="bpd-body">' +
                    '<div class="bpd-info">' +
                        '<div class="bpd-nombre">' + escaparHTML(proximaCuota.deudaNombre) + '</div>' +
                        '<div class="bpd-sub">' +
                            '<span>' + escaparHTML(proximaCuota.categoria) + '</span> · ' +
                            '<strong style="color: #fbbf24;">Cuota ' + proximaCuota.cuotaNum + ' de ' + proximaCuota.totalCuotas + '</strong>' +
                        '</div>' +
                    '</div>' +
                    '<div class="bpd-action">' +
                        '<div class="bpd-monto">$' + proximaCuota.monto.toFixed(2) + '</div>' +
                        '<button type="button" class="btn-pagar-cuota-urgente" onclick="pagarCuotaDeudaUI(\'' + proximaCuota.deudaId + '\', ' + proximaCuota.cuotaNum + ')">' +
                            '💳 Pagar Cuota' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }
    }

    // 2. Renderizar Tarjetas de Deudas y Cronogramas / Historial Flexible
    var contDeudas = document.getElementById('lista-deudas-tx');
    if (contDeudas) {
        if (deudas.length === 0) {
            contDeudas.innerHTML = '<div class="finanzas-empty-hint">' +
                'No hay deudas ni créditos registrados. Usa el botón "➕ Nueva Deuda" para registrar compras a crédito, préstamos o deudas flexibles a tu ritmo.' +
            '</div>';
        } else {
            var html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

            deudas.forEach(function(item) {
                var estaPagada = !!item.pagada;
                var esFlexible = !!(item.esFlexible || item.tipoFrecuencia === 'libre');
                var precioTot = Number(item.precioTotal) || 0;
                var ini = Number(item.pagoInicial) || 0;
                var rest = Number(item.montoRestante) || 0;
                var montoCuota = Number(item.montoCuota) || 0;
                var numCuotas = Number(item.cuotasTotal) || 1;
                var cuotasPagadas = Number(item.cuotasPagadas) || 0;
                var abonosLib = Array.isArray(item.abonosLibres) ? item.abonosLibres : [];
                var totalAbonosLibSum = Math.round(abonosLib.reduce(function(acc, ab) { return acc + (Number(ab.montoUsd) || 0); }, 0) * 100) / 100;

                if (estaPagada) {
                    totPagadas += precioTot;
                } else {
                    totPendientes += rest;
                    totPagadas += (precioTot - rest);
                }

                var pagadoTotal = Math.max(0, precioTot - rest);
                var pct = precioTot > 0 ? Math.min(100, Math.round((pagadoTotal / precioTot) * 100)) : (estaPagada ? 100 : 0);

                var badgeEstado = estaPagada
                    ? '<span class="badge-deuda-liquidada">✅ 100% LIQUIDADA</span>'
                    : (esFlexible
                        ? '<span class="badge-deuda-flexible">🌊 A tu ritmo · ' + abonosLib.length + (abonosLib.length === 1 ? ' abono' : ' abonos') + '</span>'
                        : '<span class="badge-deuda-activa">⏳ ' + cuotasPagadas + ' de ' + numCuotas + ' cuotas</span>');

                var htmlCuotas = '';
                var cuotasVencidasDeuda = 0;

                if (esFlexible) {
                    if (abonosLib.length === 0) {
                        htmlCuotas = '<div style="font-size: 11.5px; color: #94a3b8; padding: 8px 4px;">Aún no registras abonos en esta deuda flexible. Usa el botón <strong>💵 Abonar</strong> para ir pagando a tu ritmo.</div>';
                    } else {
                        htmlCuotas = abonosLib.slice().reverse().map(function(ab) {
                            var fechaAbStr = (ab.fecha && typeof ab.fecha === 'string') ? formatearFechaCorta(ab.fecha.slice(0, 10)) : 'Hoy';
                            var tObjAb = ab.tarjetaId ? tarjetasFin.find(function(x) { return x.id === ab.tarjetaId; }) : null;
                            var trjBadge = tObjAb
                                ? '<span class="badge-tarjeta-mov">💳 ' + escaparHTML(construirTituloTarjeta(tObjAb)) + '</span>'
                                : '<span class="badge-cat" style="background:rgba(148,163,184,0.14); color:#cbd5e1; border:1px solid rgba(148,163,184,0.22);">💵 Caja</span>';
                            var bsInfoAb = (ab.montoBs > 0 && ab.tasaUsada > 0)
                                ? ' <span style="font-size:10.5px; color:#94a3b8;">(Bs. ' + Number(ab.montoBs).toFixed(2) + ')</span>'
                                : '';
                            return '<div class="cronograma-cuota-row cuota-pagada">' +
                                '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">' +
                                    '<span style="font-size: 12px; font-weight: 700; color: #cbd5e1;">' + escaparHTML(fechaAbStr) + '</span>' +
                                    '<span style="font-size: 11.5px; color: #94a3b8;">' + escaparHTML(ab.nota || 'Abono') + '</span>' +
                                    trjBadge +
                                '</div>' +
                                '<div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">' +
                                    '<span style="font-weight: 800; font-size: 12px; color: #34d399;">$' + Number(ab.montoUsd || 0).toFixed(2) + bsInfoAb + '</span>' +
                                    '<button type="button" class="btn-mover-fecha-fin" style="padding:3px 7px; font-size:10.5px;" onclick="revertirAbonoPlanificacion(\'deuda\', \'' + item.id + '\', \'' + ab.id + '\')" title="Revertir este abono">↩</button>' +
                                '</div>' +
                            '</div>';
                        }).join('');
                    }
                } else {
                    // Generar filas del cronograma fijo
                    (item.cuotas || []).forEach(function(c) {
                        var fC = new Date(c.fecha + 'T00:00:00');
                        var dDiff = Math.round((fC.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                        var estadoCuota = '';

                        if (c.pagada) {
                            estadoCuota = '<span class="badge-cuota-pagada">✅ Pagada</span>';
                        } else if (c.num === cuotasPagadas + 1) {
                            estadoCuota = '<button type="button" class="btn-pagar-cuota-mini" onclick="pagarCuotaDeudaUI(\'' + item.id + '\', ' + c.num + ')">💳 Pagar Ahora</button>';
                        } else {
                            estadoCuota = '<span class="badge-cuota-pendiente">⏳ Pendiente</span>';
                        }

                        var infoFecha = formatearFechaCorta(c.fecha);
                        var btnMoverCuota = '';
                        if (!c.pagada) {
                            if (dDiff < 0) {
                                cuotasVencidasDeuda++;
                                infoFecha += ' <span style="color:#ef4444; font-size:10.5px; font-weight:700;">(hace ' + Math.abs(dDiff) + 'd)</span>';
                            } else if (dDiff === 0) {
                                infoFecha += ' <span style="color:#f59e0b; font-size:10.5px;">(¡Hoy!)</span>';
                            } else {
                                infoFecha += ' <span style="color:#94a3b8; font-size:10.5px;">(en ' + dDiff + 'd)</span>';
                            }
                            var fechaCStr = (c.fecha || '').slice(0, 10);
                            btnMoverCuota = '<button type="button" class="btn-mover-fecha-fin" style="padding:3px 7px; font-size:10.5px;" onclick="abrirModalMoverFechaFinanza(\'deuda_cuota\', \'' + item.id + '\', \'' + c.num + '\', \'' + fechaCStr.slice(0, 7) + '\', \'' + fechaCStr + '\', false)" title="Reprogramar fecha de cuota">📅 Mover</button>';
                        }

                        htmlCuotas += '<div class="cronograma-cuota-row ' + (c.pagada ? 'cuota-pagada' : (c.num === cuotasPagadas + 1 ? 'cuota-siguiente' : '')) + '">' +
                            '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">' +
                                '<span style="font-weight: 800; font-size: 12px; color: #f8fafc;">#' + c.num + '</span>' +
                                '<span style="font-size: 12px; color: #cbd5e1;">' + infoFecha + '</span>' +
                            '</div>' +
                            '<div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">' +
                                '<span style="font-weight: 800; font-size: 12px; color: #38bdf8;">$' + Number(c.monto).toFixed(2) + '</span>' +
                                estadoCuota +
                                btnMoverCuota +
                            '</div>' +
                        '</div>';
                    });
                }

                var badgeVencidaDeuda = (!estaPagada && !esFlexible && cuotasVencidasDeuda > 0)
                    ? '<span class="cuota-badge-vencida">🚨 ' + cuotasVencidasDeuda + ' retrasada' + (cuotasVencidasDeuda === 1 ? '' : 's') + '</span>'
                    : '';

                var textoFrecuenciaItem = 'Cada ' + (item.diasFrecuencia || 15) + ' días';
                if (esFlexible) {
                    textoFrecuenciaItem = '🌊 Sin fecha fija (a tu ritmo)';
                } else if (item.tipoFrecuencia === 'quince_ultimo' || item.diasFrecuencia === 'quince_ultimo') {
                    textoFrecuenciaItem = '🗓️ 15 y Último';
                } else if (item.diasFrecuencia == 30) {
                    textoFrecuenciaItem = 'Mensual (30 días)';
                } else if (item.diasFrecuencia == 7) {
                    textoFrecuenciaItem = 'Semanal (7 días)';
                }

                var lblToggleShow = esFlexible
                    ? ('📜 Ver Historial de Abonos (' + abonosLib.length + ') ▾')
                    : ('📅 Ver Cronograma de Cuotas (' + (item.cuotas ? item.cuotas.length : numCuotas) + ') ▾');
                var lblToggleHide = esFlexible
                    ? '📜 Ocultar Historial de Abonos ▴'
                    : '📅 Ocultar Cronograma ▴';

                var badgeMonedaOrigDeu = (item.monedaOrigen === 'VES' && item.montoOriginalBs > 0)
                    ? '<span class="badge-cat" style="background: rgba(56, 189, 248, 0.14); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.28);">💱 Bs. ' + Number(item.montoOriginalBs).toFixed(2) + '</span>'
                    : '';

                var actionsDeudaHtml = '';
                if (esFlexible) {
                    actionsDeudaHtml =
                        (!estaPagada
                            ? '<button type="button" class="btn-pagar-cuota-action" onclick="abrirModalAbonoPlanificacion(\'deuda\', \'' + item.id + '\', \'abono\')">' +
                                '💵 Abonar ($' + rest.toFixed(2) + ' pend.)' +
                              '</button>'
                            : '<span style="font-size: 12px; color: #34d399; font-weight: 700;">Deuda flexible completamente saldada ✓</span>') +
                        (abonosLib.length > 0
                            ? '<button type="button" class="btn-deshacer-cuota-action" onclick="deshacerCuotaDeudaUI(\'' + item.id + '\')" title="Deshacer último abono registrado">↩ Deshacer Abono</button>'
                            : '') +
                        (!estaPagada && rest > 0
                            ? '<button type="button" class="btn-liquidar-action" onclick="abrirModalAbonoPlanificacion(\'deuda\', \'' + item.id + '\', \'completo\')" title="Liquidar todo el saldo restante">⚡ Liquidar Restante</button>'
                            : '');
                } else {
                    actionsDeudaHtml =
                        (!estaPagada
                            ? '<button type="button" class="btn-pagar-cuota-action" onclick="pagarCuotaDeudaUI(\'' + item.id + '\')">' +
                                '💳 Pagar Cuota ' + (cuotasPagadas + 1) + ' ($' + montoCuota.toFixed(2) + ')' +
                              '</button>'
                            : '<span style="font-size: 12px; color: #34d399; font-weight: 700;">Crédito completamente amortizado ✓</span>') +
                        ((cuotasPagadas > 0 || abonosLib.length > 0)
                            ? '<button type="button" class="btn-deshacer-cuota-action" onclick="deshacerCuotaDeudaUI(\'' + item.id + '\')" title="Deshacer última cuota o abono pagado">↩ Deshacer Pago</button>'
                            : '') +
                        (!estaPagada && rest > 0
                            ? '<button type="button" class="btn-liquidar-action" onclick="liquidarDeudaCompletaUI(\'' + item.id + '\')" title="Liquidar todo el saldo restante">⚡ Liquidar Todo</button>'
                            : '');
                }

                html += '<div class="deuda-card-moderna ' + (estaPagada ? 'deuda-liquidada' : '') + '">' +
                    '<div class="deuda-card-top">' +
                        '<div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">' +
                            '<span style="font-size: 22px; flex-shrink: 0;">' + (item.iconoCategoria || '🛡️') + '</span>' +
                            '<div style="min-width: 0; flex: 1;">' +
                                '<div style="font-size: 14.5px; font-weight: 800; color: #f8fafc; word-break: break-word;">' + escaparHTML(item.nombre) + '</div>' +
                                '<div style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 2px;">' +
                                    '<span>' + escaparHTML(item.categoria || 'Deuda') + '</span>' +
                                    '<span>•</span>' +
                                    '<span>' + textoFrecuenciaItem + '</span>' +
                                    badgeMonedaOrigDeu +
                                    badgeVencidaDeuda +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">' +
                            badgeEstado +
                            '<button type="button" class="btn-delete-row" title="Eliminar deuda" onclick="eliminarRegistroFinanzasUI(\'' + item.id + '\', \'deuda\')">✕</button>' +
                        '</div>' +
                    '</div>' +

                    // Barra de amortización
                    '<div style="margin: 10px 0 12px 0;">' +
                        '<div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">' +
                            '<span style="color: #94a3b8;">Amortizado: <strong style="color: #34d399;">$' + pagadoTotal.toFixed(2) + '</strong> (' + pct + '%)</span>' +
                            '<span style="color: #f87171; font-weight: 700;">Resta: $' + rest.toFixed(2) + '</span>' +
                        '</div>' +
                        '<div class="deuda-amort-bar">' +
                            '<div class="deuda-amort-fill" style="width: ' + pct + '%;"></div>' +
                        '</div>' +
                    '</div>' +

                    // Grid de métricas
                    '<div class="deuda-metrics-grid">' +
                        '<div class="deuda-metric-box">' +
                            '<span class="dmb-lbl">Precio Total</span>' +
                            '<span class="dmb-val">$' + precioTot.toFixed(2) + '</span>' +
                        '</div>' +
                        '<div class="deuda-metric-box">' +
                            '<span class="dmb-lbl">Inicial Dada</span>' +
                            '<span class="dmb-val" style="color: #34d399;">$' + ini.toFixed(2) + '</span>' +
                        '</div>' +
                        '<div class="deuda-metric-box">' +
                            '<span class="dmb-lbl">' + (esFlexible ? 'Abonado Libre' : 'Valor Cuota') + '</span>' +
                            '<span class="dmb-val" style="color: #38bdf8;">$' + (esFlexible ? totalAbonosLibSum : montoCuota).toFixed(2) + '</span>' +
                        '</div>' +
                        '<div class="deuda-metric-box">' +
                            '<span class="dmb-lbl">Pendiente</span>' +
                            '<span class="dmb-val" style="color: #f87171;">$' + rest.toFixed(2) + '</span>' +
                        '</div>' +
                    '</div>' +

                    // Botón y panel del cronograma / historial de abonos
                    '<div style="margin-top: 10px;">' +
                        '<button type="button" id="btn-toggle-crono-' + item.id + '" class="btn-toggle-cronograma" data-show-lbl="' + escaparHTML(lblToggleShow) + '" data-hide-lbl="' + escaparHTML(lblToggleHide) + '" onclick="toggleCronogramaDeudaUI(\'' + item.id + '\')">' +
                            lblToggleShow +
                        '</button>' +
                        '<div id="cronograma-deuda-' + item.id + '" class="cronograma-cuotas-container" style="display: none;">' +
                            htmlCuotas +
                        '</div>' +
                    '</div>' +

                    // Acciones inferiores
                    '<div class="deuda-card-actions">' +
                        actionsDeudaHtml +
                    '</div>' +
                '</div>';
            });

            html += '</div>';
            contDeudas.innerHTML = html;
        }
    }

    var pagadasPeriodo = 0;
    var pendientesPeriodo = 0;
    var activasCount = 0;
    deudas.forEach(function(d) {
        if (!d.pagada) activasCount++;
        (d.cuotas || []).forEach(function(c) {
            var montoC = Number(c.monto) || Number(d.montoCuota) || 0;
            if (c.pagada && !c.cubiertaPorAbono) {
                var fPagC = (c.fechaPago && typeof c.fechaPago === 'string') ? c.fechaPago.slice(0, 10) : (c.fecha || '');
                if (!coincideFn || coincideFn(null, fPagC)) {
                    pagadasPeriodo += montoC;
                }
            } else if (!c.pagada) {
                var falC = Math.max(0, montoC - (Number(c.montoAbonado) || 0));
                if (!coincideFn || coincideFn(null, c.fecha)) {
                    pendientesPeriodo += falC;
                }
            }
        });
        (d.abonosLibres || []).forEach(function(ab) {
            var fAb = (ab.fecha && typeof ab.fecha === 'string') ? ab.fecha.slice(0, 10) : '';
            if (!coincideFn || coincideFn(null, fAb)) {
                pagadasPeriodo += (Number(ab.montoUsd) || 0);
            }
        });
    });

    var totalDeuEl = document.getElementById('label-total-deudas') || document.getElementById('total-deudas-display');
    if (totalDeuEl) totalDeuEl.innerText = '$' + totPendientes.toFixed(2);
    var resDeuEl = document.getElementById('resumen-total-deudas');
    if (resDeuEl) resDeuEl.innerText = '$' + totPendientes.toFixed(2);

    return {
        totPendientes: totPendientes,
        totPagadas: totPagadas,
        pagadasPeriodo: Math.round(pagadasPeriodo * 100) / 100,
        pendientesPeriodo: Math.round(pendientesPeriodo * 100) / 100,
        activasCount: activasCount
    };
}

function cambiarPeriodoFinanzas(periodo, omitirRender) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    var p = periodo || 'mes';
    window.ESTADO_FINANZAS.vistaQuincena = p;
    if (p !== 'mes') {
        window.ESTADO_FINANZAS.ultimaSemanaSeleccionada = p;
    }

    var btnMes = document.getElementById('btn-vista-mes');
    var btnSem = document.getElementById('btn-vista-semana-actual');
    if (btnMes) btnMes.classList.toggle('active', p === 'mes');
    if (btnSem) btnSem.classList.toggle('active', p !== 'mes');

    if (!omitirRender) {
        renderizarFinanzas(APP_STATE.finanzas);
    }
}

function navegarSemanaFinanzas(delta) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    var f = obtenerFechaMesFinanzas();
    var anio = f.getFullYear();
    var mes = f.getMonth();
    var semanas = calcularSemanasDelMes(anio, mes);
    if (!semanas.length) return;

    var vq = window.ESTADO_FINANZAS.vistaQuincena || 'mes';
    if (vq === 'mes') {
        var semDest = window.ESTADO_FINANZAS.ultimaSemanaSeleccionada || obtenerSemanaActualParaMes(anio, mes);
        if (!semanas.some(function(s) { return s.clave === semDest; })) {
            semDest = semanas[0].clave;
        }
        cambiarPeriodoFinanzas(semDest);
        return;
    }

    var idx = semanas.findIndex(function(s) { return s.clave === vq; });
    if (idx === -1) idx = 0;
    var nextIdx = idx + (Number(delta) || 0);

    if (nextIdx < 0) {
        window.ESTADO_FINANZAS.mesOffset = (window.ESTADO_FINANZAS.mesOffset || 0) - 1;
        var fPrev = obtenerFechaMesFinanzas();
        var semPrev = calcularSemanasDelMes(fPrev.getFullYear(), fPrev.getMonth());
        var ult = semPrev.length ? semPrev[semPrev.length - 1].clave : 'sem1';
        cambiarPeriodoFinanzas(ult);
        return;
    }

    if (nextIdx >= semanas.length) {
        window.ESTADO_FINANZAS.mesOffset = (window.ESTADO_FINANZAS.mesOffset || 0) + 1;
        var fNext = obtenerFechaMesFinanzas();
        var semNext = calcularSemanasDelMes(fNext.getFullYear(), fNext.getMonth());
        var pri = semNext.length ? semNext[0].clave : 'sem1';
        cambiarPeriodoFinanzas(pri);
        return;
    }

    cambiarPeriodoFinanzas(semanas[nextIdx].clave);
}

function toggleMesCompletoFinanzas() {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    var vq = window.ESTADO_FINANZAS.vistaQuincena || 'mes';
    if (vq === 'mes') {
        var f = obtenerFechaMesFinanzas();
        var semDest = window.ESTADO_FINANZAS.ultimaSemanaSeleccionada || obtenerSemanaActualParaMes(f.getFullYear(), f.getMonth());
        cambiarPeriodoFinanzas(semDest);
    } else {
        cambiarPeriodoFinanzas('mes');
    }
}

if (typeof window !== 'undefined') {
    window.navegarSemanaFinanzas = navegarSemanaFinanzas;
    window.toggleMesCompletoFinanzas = toggleMesCompletoFinanzas;
}

function eliminarRegistroFinanzasUI(id, tipo) {
    if (!confirm("¿Eliminar este registro financiero?")) return;
    if (!APP_STATE.finanzas) return;

    var coleccionTombstone = "finanzas_" + (tipo === 'ingreso' ? 'ingresos' : (tipo === 'gasto' ? 'gastos' : (tipo === 'deuda' ? 'deudas' : 'metas')));
    if (typeof registrarTombstone === 'function') {
        registrarTombstone(coleccionTombstone, id);
    }

    if (tipo === 'ingreso' && APP_STATE.finanzas.ingresos) {
        var ingObj = APP_STATE.finanzas.ingresos.find(function(x) { return x && x.id === id; });
        if (ingObj && ingObj.cobrado) {
            revertirTarjetasMovimientoFinanzas(ingObj, true);
        }
        APP_STATE.finanzas.ingresos = APP_STATE.finanzas.ingresos.filter(function(x) { return x.id !== id; });
    } else if (tipo === 'gasto' && APP_STATE.finanzas.gastos) {
        var gasObj = APP_STATE.finanzas.gastos.find(function(x) { return x && x.id === id; });
        if (gasObj) {
            if (Array.isArray(gasObj.abonos) && gasObj.abonos.length > 0) {
                gasObj.abonos.forEach(function(ab) {
                    if (ab && ab.tarjetaId && ab.deltaNativo && typeof revertirMovimientoEnTarjeta === 'function') {
                        revertirMovimientoEnTarjeta(ab.tarjetaId, false, ab.deltaNativo, ab.deltaUsdRef, ab.id);
                    }
                });
            }
            if (gasObj.pagado) {
                revertirTarjetasMovimientoFinanzas(gasObj, false);
            }
            if (gasObj.esPrestamo && Array.isArray(APP_STATE.finanzas.ingresos)) {
                APP_STATE.finanzas.ingresos = APP_STATE.finanzas.ingresos.filter(function(ig) {
                    if (ig && ig.prestamoGastoId === gasObj.id && !ig.cobrado) {
                        if (typeof registrarTombstone === 'function') registrarTombstone('finanzas_ingresos', ig.id);
                        return false;
                    }
                    return true;
                });
            }
        }
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
    window.ESTADO_FINANZAS.calDiaSeleccionado = null;
    window.ESTADO_FINANZAS.calUltimoMovimiento = null;

    var fechaMes = obtenerFechaMesFinanzas();
    var anio = fechaMes.getFullYear();
    var mes = fechaMes.getMonth();
    var hoy = new Date();

    if (hoy.getFullYear() === anio && hoy.getMonth() === mes) {
        window.ESTADO_FINANZAS.vistaQuincena = obtenerSemanaActualParaMes(anio, mes);
    } else {
        var semanas = calcularSemanasDelMes(anio, mes);
        var existeSemana = semanas.some(function(s) { return s.clave === window.ESTADO_FINANZAS.vistaQuincena; });
        if (window.ESTADO_FINANZAS.vistaQuincena !== 'mes' && !existeSemana) {
            window.ESTADO_FINANZAS.vistaQuincena = 'sem1';
        }
    }

    renderizarFinanzas(APP_STATE.finanzas);
}

/* ==========================================================================
   MÓDULO: COMPARADOR DE AHORRO Y FRENO DE COMPRAS IMPULSIVAS
   ========================================================================== */

function escaparHTML(texto) {
    if (!texto) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function obtenerComparacionesAhorro() {
    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.comparacionesAhorro || !Array.isArray(APP_STATE.finanzas.comparacionesAhorro)) {
        APP_STATE.finanzas.comparacionesAhorro = [];
    }
    return APP_STATE.finanzas.comparacionesAhorro;
}

function inicializarComparacionesAhorroPorDefecto() {
    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.comparacionesAhorro || !Array.isArray(APP_STATE.finanzas.comparacionesAhorro)) {
        APP_STATE.finanzas.comparacionesAhorro = [];
    }
    // Si la lista está vacía y nunca se ha inicializado, sugerir artículos de alto valor iniciales
    if (APP_STATE.finanzas.comparacionesAhorro.length === 0 && !localStorage.getItem('monarca_comparaciones_init')) {
        APP_STATE.finanzas.comparacionesAhorro = [
            { id: 'COMP-1', nombre: '1 Libro de Crecimiento Personal', precio: 15, fecha: new Date().toISOString() },
            { id: 'COMP-2', nombre: '1 Mes de Gimnasio / Salud', precio: 25, fecha: new Date().toISOString() },
            { id: 'COMP-3', nombre: 'Curso o Certificación Profesional', precio: 45, fecha: new Date().toISOString() },
            { id: 'COMP-4', nombre: 'Zapatos o Ropa de Alta Calidad', precio: 70, fecha: new Date().toISOString() }
        ];
        localStorage.setItem('monarca_comparaciones_init', 'true');
        MonarcaDB.save(APP_STATE);
    }
}

function abrirModalComparadorAhorro() {
    inicializarComparacionesAhorroPorDefecto();
    var modal = document.getElementById('modal-comparador-ahorro');
    if (!modal) return;
    modal.style.display = 'flex';
    renderizarListaComparadorAhorro();
    var inNom = document.getElementById('input-comparador-nombre');
    if (inNom) {
        inNom.value = '';
        setTimeout(function() { inNom.focus(); }, 120);
    }
    var inPre = document.getElementById('input-comparador-precio');
    if (inPre) inPre.value = '';
}

function cerrarModalComparadorAhorro() {
    var modal = document.getElementById('modal-comparador-ahorro');
    if (modal) modal.style.display = 'none';
}

function renderizarListaComparadorAhorro() {
    var lista = obtenerComparacionesAhorro();
    var contenedor = document.getElementById('lista-items-comparador-ahorro');
    var badgeTotal = document.getElementById('badge-total-comparador-ahorro');
    if (badgeTotal) badgeTotal.textContent = lista.length + (lista.length === 1 ? ' artículo' : ' artículos');
    if (!contenedor) return;

    if (lista.length === 0) {
        contenedor.innerHTML = '<div style="text-align: center; padding: 26px 14px; color: #94a3b8; background: #0c101a; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 12px;">' +
            '<div style="font-size: 26px; margin-bottom: 6px;">⚖️</div>' +
            '<div style="font-weight: 700; color: #f8fafc; font-size: 13.5px; margin-bottom: 4px;">Tu lista de comparaciones está vacía</div>' +
            '<div style="font-size: 12px; line-height: 1.4; max-width: 340px; margin: 0 auto; color: #94a3b8;">' +
            'Agrega cosas deseadas con sus precios. Cada vez que vayas a registrar un gasto, el sistema te recordará qué podrías comprar con ese mismo dinero para frenar el impulso.' +
            '</div>' +
        '</div>';
        return;
    }

    var html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    var ordenados = lista.slice().sort(function(a, b) { return Number(b.precio) - Number(a.precio); });

    ordenados.forEach(function(item) {
        var precioNum = Number(item.precio) || 0;
        html += '<div class="comparacion-item-card">' +
            '<div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">' +
                '<span style="font-size: 18px; flex-shrink: 0;">🎯</span>' +
                '<div style="min-width: 0; flex: 1;">' +
                    '<div style="font-weight: 700; font-size: 13px; color: #f8fafc; word-break: break-word;">' + escaparHTML(item.nombre) + '</div>' +
                    '<div style="font-size: 11px; color: #94a3b8;">Meta / Alternativa de valor</div>' +
                '</div>' +
            '</div>' +
            '<div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">' +
                '<span class="freno-impulso-precio-tag">$' + precioNum.toFixed(2) + '</span>' +
                '<button type="button" class="btn-eliminar-item-comp" onclick="eliminarItemComparacionAhorro(\'' + item.id + '\')" title="Eliminar de la lista">✕</button>' +
            '</div>' +
        '</div>';
    });

    html += '</div>';
    contenedor.innerHTML = html;
}

function agregarItemComparacionAhorro() {
    var inNom = document.getElementById('input-comparador-nombre');
    var inPre = document.getElementById('input-comparador-precio');
    var nom = inNom ? inNom.value.trim() : '';
    var pre = inPre ? parseFloat(inPre.value) : 0;

    if (!nom) {
        alert('Ingresa el nombre del artículo o deseo de valor (ej: "Libro de hábitos", "Curso online", "Zapatillas").');
        if (inNom) inNom.focus();
        return;
    }
    if (isNaN(pre) || pre <= 0) {
        alert('Ingresa un precio válido mayor a 0 (ej: 25.00).');
        if (inPre) inPre.focus();
        return;
    }

    var nuevo = {
        id: 'COMP-' + Date.now(),
        nombre: nom,
        precio: Math.round(pre * 100) / 100,
        fecha: new Date().toISOString()
    };

    var lista = obtenerComparacionesAhorro();
    lista.push(nuevo);
    MonarcaDB.save(APP_STATE);

    if (inNom) inNom.value = '';
    if (inPre) inPre.value = '';
    renderizarListaComparadorAhorro();

    // Actualizar previsualización en caso de que algún modal esté abierto con monto
    var inMontoGasto = document.getElementById('modal-gasto-monto');
    if (inMontoGasto && inMontoGasto.value) alCambiarMontoGastoModal(inMontoGasto.value);
    var inMontoAsist = document.getElementById('asistente-fin-monto');
    if (inMontoAsist && inMontoAsist.value && typeof alCambiarMontoAsistenteFinanza === 'function') {
        alCambiarMontoAsistenteFinanza(inMontoAsist.value);
    }
}

function eliminarItemComparacionAhorro(id) {
    if (!confirm('¿Deseas eliminar este artículo de la lista de comparaciones?')) return;
    var lista = obtenerComparacionesAhorro();
    var idx = lista.findIndex(function(it) { return it.id === id; });
    if (idx !== -1) {
        lista.splice(idx, 1);
        if (typeof registrarTombstone === 'function') registrarTombstone('finanzas_comparacionesAhorro', id);
        MonarcaDB.save(APP_STATE);
        renderizarListaComparadorAhorro();

        var inMontoGasto = document.getElementById('modal-gasto-monto');
        if (inMontoGasto && inMontoGasto.value) alCambiarMontoGastoModal(inMontoGasto.value);
        var inMontoAsist = document.getElementById('asistente-fin-monto');
        if (inMontoAsist && inMontoAsist.value && typeof alCambiarMontoAsistenteFinanza === 'function') {
            alCambiarMontoAsistenteFinanza(inMontoAsist.value);
        }
    }
}

/**
 * Analiza el monto del gasto contra las comparaciones de ahorro del usuario
 * y genera una respuesta reflexiva anti-impulso.
 */
function calcularComparacionFrenoImpulso(monto) {
    var lista = obtenerComparacionesAhorro();
    if (lista.length === 0) {
        return {
            tipo: 'vacio',
            html: '<div class="freno-impulso-box">' +
                '<div class="freno-impulso-hdr">' +
                    '<span class="freno-impulso-tag">💡 FRENO DE IMPULSO</span>' +
                    '<button type="button" class="btn-link-freno-config" onclick="abrirModalComparadorAhorro()">+ Configurar Comparador</button>' +
                '</div>' +
                '<div class="freno-impulso-body">' +
                    '¿Vale la pena gastar <strong>$' + monto.toFixed(2) + '</strong>? ' +
                    '<span style="color: #94a3b8;">Agrega deseos o metas en el <strong>Comparador de Ahorro</strong> para que veas qué podrías comprar en su lugar por este mismo valor.</span>' +
                '</div>' +
            '</div>'
        };
    }

    // 1. Buscar coincidencia exacta
    var exacto = lista.find(function(it) { return Math.abs(Number(it.precio) - monto) < 0.01; });
    if (exacto) {
        return {
            tipo: 'exacto',
            html: '<div class="freno-impulso-box freno-alerta">' +
                '<div class="freno-impulso-hdr">' +
                    '<span class="freno-impulso-tag">🛑 FRENO DE IMPULSO · ¿VALE LA PENA?</span>' +
                    '<button type="button" class="btn-link-freno-config" onclick="abrirModalComparadorAhorro()">Ver Lista</button>' +
                '</div>' +
                '<div class="freno-impulso-body">' +
                    'Por este mismo valor de <strong class="freno-resaltado-monto">$' + monto.toFixed(2) + '</strong> podrías comprar en su lugar:' +
                    '<div class="freno-impulso-destacado">' +
                        '<span class="freno-destacado-icono">🎯</span>' +
                        '<span class="freno-destacado-nombre">' + escaparHTML(exacto.nombre) + '</span>' +
                        '<span class="freno-destacado-precio">$' + Number(exacto.precio).toFixed(2) + '</span>' +
                    '</div>' +
                    '<div class="freno-impulso-consejo">¿Prefieres este gasto pasajero o avanzar en tu adquisición real?</div>' +
                '</div>' +
            '</div>'
        };
    }

    // 2. Si el monto es mayor o igual al precio de algún artículo
    var alcanzables = lista.filter(function(it) { return Number(it.precio) <= monto; })
                           .sort(function(a, b) { return Number(b.precio) - Number(a.precio); });

    if (alcanzables.length > 0) {
        var mejor = alcanzables[0]; // El de mayor valor que puede comprar
        var precioMejor = Number(mejor.precio);
        var cantidad = Math.floor(monto / precioMejor);
        var sobrante = monto - (cantidad * precioMejor);

        var textoCantidad = cantidad === 1 ? '1x ' + escaparHTML(mejor.nombre) : cantidad + 'x ' + escaparHTML(mejor.nombre);
        var detalle = cantidad === 1 
            ? ('$' + precioMejor.toFixed(2) + (sobrante >= 0.5 ? ' <span style="color:#10b981;">(¡y aún te sobrarían $' + sobrante.toFixed(2) + '!)</span>' : ''))
            : ('$' + precioMejor.toFixed(2) + ' c/u' + (sobrante >= 0.5 ? ' <span style="color:#10b981;">(¡y te sobran $' + sobrante.toFixed(2) + '!)</span>' : ''));

        var otroTexto = '';
        if (alcanzables.length > 1 && alcanzables[1].id !== mejor.id) {
            var otro = alcanzables[1];
            var cantOtro = Math.floor(monto / Number(otro.precio));
            otroTexto = '<div class="freno-impulso-alt">O también equivale a: <strong>' + cantOtro + 'x ' + escaparHTML(otro.nombre) + '</strong> ($' + Number(otro.precio).toFixed(2) + ' c/u)</div>';
        }

        return {
            tipo: 'alcanzable',
            html: '<div class="freno-impulso-box freno-alerta">' +
                '<div class="freno-impulso-hdr">' +
                    '<span class="freno-impulso-tag">🛑 FRENO DE IMPULSO · ¿VALE LA PENA?</span>' +
                    '<button type="button" class="btn-link-freno-config" onclick="abrirModalComparadorAhorro()">Ver Lista</button>' +
                '</div>' +
                '<div class="freno-impulso-body">' +
                    'Con estos <strong class="freno-resaltado-monto">$' + monto.toFixed(2) + '</strong> podrías comprar en su lugar:' +
                    '<div class="freno-impulso-destacado">' +
                        '<span class="freno-destacado-icono">🎯</span>' +
                        '<span class="freno-destacado-nombre">' + textoCantidad + '</span>' +
                        '<span class="freno-destacado-precio">' + detalle + '</span>' +
                    '</div>' +
                    otroTexto +
                    '<div class="freno-impulso-consejo">¿Es indispensable este gasto o prefieres guardar el dinero para tus metas?</div>' +
                '</div>' +
            '</div>'
        };
    }

    // 3. Si el monto es menor que todos los artículos de la lista
    var menor = lista.slice().sort(function(a, b) { return Number(a.precio) - Number(b.precio); })[0];
    var precioMenor = Number(menor.precio);
    var pct = Math.min(99, Math.round((monto / precioMenor) * 100));

    return {
        tipo: 'meta-parcial',
        html: '<div class="freno-impulso-box freno-alerta">' +
            '<div class="freno-impulso-hdr">' +
                '<span class="freno-impulso-tag">🛑 FRENO DE IMPULSO · ¿VALE LA PENA?</span>' +
                '<button type="button" class="btn-link-freno-config" onclick="abrirModalComparadorAhorro()">Ver Lista</button>' +
            '</div>' +
            '<div class="freno-impulso-body">' +
                'Con estos <strong class="freno-resaltado-monto">$' + monto.toFixed(2) + '</strong> ya cubrirías el <strong style="color: #38bdf8;">' + pct + '%</strong> de:' +
                '<div class="freno-impulso-destacado">' +
                    '<span class="freno-destacado-icono">🎯</span>' +
                    '<span class="freno-destacado-nombre">' + escaparHTML(menor.nombre) + '</span>' +
                    '<span class="freno-destacado-precio">$' + precioMenor.toFixed(2) + '</span>' +
                '</div>' +
                '<div class="freno-impulso-progreso-bar"><div class="freno-impulso-progreso-fill" style="width: ' + pct + '%;"></div></div>' +
                '<div class="freno-impulso-consejo">Si evitas este gasto menor, ¡estarás mucho más cerca de comprarlo!</div>' +
            '</div>' +
        '</div>'
    };
}

function actualizarComparadorFrenoGasto(val, contenedorId) {
    var contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    var monto = parseFloat(val);
    if (isNaN(monto) || monto <= 0) {
        contenedor.style.display = 'none';
        contenedor.innerHTML = '';
        return;
    }

    var res = calcularComparacionFrenoImpulso(monto);
    contenedor.innerHTML = res.html;
    contenedor.style.display = 'block';
}

function alCambiarMontoGastoModal(val) {
    var inM = document.getElementById('modal-gasto-monto');
    var selMon = document.getElementById('modal-gasto-moneda');
    var selTasa = document.getElementById('modal-gasto-tasa-tipo');
    var prev = document.getElementById('modal-gasto-conv-preview');

    var rawVal = (val !== undefined && val !== null && val !== '') ? parseFloat(val) : (inM ? parseFloat(inM.value) : 0);
    if (isNaN(rawVal)) rawVal = 0;
    var mon = selMon ? selMon.value : 'USD';
    var tasaModo = selTasa ? selTasa.value : 'bcv';
    if (selTasa) selTasa.style.display = (mon === 'VES') ? 'block' : 'none';

    var conv = convertirMontoFinanzasAUsd(rawVal, mon, tasaModo);
    if (prev) {
        if (rawVal > 0 && mon === 'VES') {
            prev.style.display = 'block';
            prev.innerHTML = conv.valido
                ? ('Equivale a <strong style="color:#f87171;">$' + conv.usd.toFixed(2) + ' USD</strong> (Tasa ' + escaparHTML(conv.tasaLabel) + ': ' + Number(conv.tasaUsada).toFixed(2) + ')')
                : '⚠️ No hay tasa cargada en caché para convertir Bs. a $.';
        } else if (rawVal > 0 && mon === 'USD' && conv.tasaUsada > 0) {
            prev.style.display = 'block';
            prev.innerHTML = 'Se mantiene en <strong style="color:#f87171;">$' + conv.usd.toFixed(2) + ' USD</strong> · Ref. ' + formatearTasaBsDisplay(conv.bs, 2) + ' (' + escaparHTML(conv.tasaLabel) + ').';
        } else {
            prev.style.display = 'none';
        }
    }

    var selCatG = document.getElementById('modal-gasto-categoria');
    var esPresG = selCatG && esCategoriaPrestamoNombre(selCatG.value);
    var usdParaFreno = (!esPresG && conv.valido) ? conv.usd : 0;
    actualizarComparadorFrenoGasto(usdParaFreno, 'contenedor-freno-impulso-modal-gasto');
    if (typeof actualizarResumenPartesPrestamoUI === 'function') {
        actualizarResumenPartesPrestamoUI();
    }
}

/* ==========================================================================
   MÓDULO: CALENDARIO CRONOLÓGICO DE COBROS Y PAGOS (FINANZAS)
   ========================================================================== */

function cambiarSeccionFinanzas(seccion, omitirRender) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    var validos = ['panel', 'movimientos', 'planificacion', 'tarjetas', 'calendario'];
    var destino = validos.indexOf(seccion) !== -1 ? seccion : 'panel';
    window.ESTADO_FINANZAS.seccionActiva = destino;

    var tabPanel = document.getElementById('tab-finanzas-panel');
    var tabMov = document.getElementById('tab-finanzas-movimientos');
    var tabPlan = document.getElementById('tab-finanzas-planificacion');
    var tabTarj = document.getElementById('tab-finanzas-tarjetas');
    var tabCal = document.getElementById('tab-finanzas-calendario');

    var vistaPanel = document.getElementById('vista-finanzas-panel');
    var vistaMov = document.getElementById('vista-finanzas-movimientos');
    var vistaPlan = document.getElementById('vista-finanzas-planificacion');
    var vistaTarj = document.getElementById('vista-finanzas-tarjetas');
    var vistaCal = document.getElementById('vista-finanzas-calendario');
    var barraPeriodo = document.getElementById('quincena-selector-bar');

    if (tabPanel) tabPanel.classList.toggle('active', destino === 'panel');
    if (tabMov) tabMov.classList.toggle('active', destino === 'movimientos');
    if (tabPlan) tabPlan.classList.toggle('active', destino === 'planificacion');
    if (tabTarj) tabTarj.classList.toggle('active', destino === 'tarjetas');
    if (tabCal) tabCal.classList.toggle('active', destino === 'calendario');

    if (vistaPanel) vistaPanel.style.display = destino === 'panel' ? 'block' : 'none';
    if (vistaMov) vistaMov.style.display = destino === 'movimientos' ? 'block' : 'none';
    if (vistaPlan) vistaPlan.style.display = destino === 'planificacion' ? 'block' : 'none';
    if (vistaTarj) vistaTarj.style.display = destino === 'tarjetas' ? 'block' : 'none';
    if (vistaCal) vistaCal.style.display = destino === 'calendario' ? 'block' : 'none';

    if (barraPeriodo) {
        barraPeriodo.style.display = (destino === 'panel' || destino === 'movimientos') ? 'flex' : 'none';
    }

    if (!omitirRender && destino === 'calendario') {
        renderizarCalendarioFinanzas();
    } else if (!omitirRender && destino === 'tarjetas' && typeof renderizarTarjetasFinanzas === 'function') {
        renderizarTarjetasFinanzas();
    } else if (!omitirRender && destino === 'planificacion' && typeof renderizarPlanificacionFinanzas === 'function') {
        renderizarPlanificacionFinanzas();
    } else if (!omitirRender && destino === 'panel' && typeof renderizarFinanzas === 'function') {
        renderizarFinanzas(APP_STATE.finanzas);
    }
}

function cambiarSubtabPlanificacionFin(subtab) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    var sub = (subtab === 'deudas' || subtab === 'metas') ? subtab : 'cola';
    window.ESTADO_FINANZAS.subtabPlanificacion = sub;

    var btnCola = document.getElementById('subtab-plan-cola');
    var btnDeu = document.getElementById('subtab-plan-deudas');
    var btnMet = document.getElementById('subtab-plan-metas');
    var vCola = document.getElementById('plan-subvista-cola');
    var vDeu = document.getElementById('plan-subvista-deudas');
    var vMet = document.getElementById('plan-subvista-metas');

    if (btnCola) btnCola.classList.toggle('active', sub === 'cola');
    if (btnDeu) btnDeu.classList.toggle('active', sub === 'deudas');
    if (btnMet) btnMet.classList.toggle('active', sub === 'metas');
    if (vCola) vCola.style.display = sub === 'cola' ? 'block' : 'none';
    if (vDeu) vDeu.style.display = sub === 'deudas' ? 'block' : 'none';
    if (vMet) vMet.style.display = sub === 'metas' ? 'block' : 'none';

    if (sub === 'cola' && typeof renderizarPlanificacionFinanzas === 'function') {
        renderizarPlanificacionFinanzas();
    }
}
if (typeof window !== 'undefined') {
    window.cambiarSeccionFinanzas = cambiarSeccionFinanzas;
    window.cambiarSubtabPlanificacionFin = cambiarSubtabPlanificacionFin;
}

function obtenerClaveFechaISOFinanzas(anio, mes, dia) {
    return anio + '-' + String(mes + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
}

function obtenerHoyISOFinanzas() {
    var d = new Date();
    return obtenerClaveFechaISOFinanzas(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Recolecta todos los cobros (ingresos) y pagos (gastos + cuotas de deudas) aplicables al mes dado.
 */
function resolverOcurrenciasFinanzasMes(fin, anio, mes) {
    var f = fin || (APP_STATE && APP_STATE.finanzas) || DEFAULT_STATE.finanzas;
    sanearDatosFinanzasRecurrentesYCategorias(f);
    var mesClave = anio + '-' + String(mes + 1).padStart(2, '0');
    var totalDiasMes = new Date(anio, mes + 1, 0).getDate();
    var hoyISO = obtenerHoyISOFinanzas();

    var diasMap = {};
    for (var d = 1; d <= totalDiasMes; d++) {
        diasMap[obtenerClaveFechaISOFinanzas(anio, mes, d)] = {
            fecha: obtenerClaveFechaISOFinanzas(anio, mes, d),
            dia: d,
            cobros: [],
            pagos: [],
            totCobros: 0,
            totPagos: 0,
            pendCobros: 0,
            pendPagos: 0
        };
    }

    function agregarEnDia(fechaISO, entrada) {
        if (!fechaISO || !diasMap[fechaISO]) return;
        var bucket = diasMap[fechaISO];
        if (entrada.clase === 'cobro') {
            bucket.cobros.push(entrada);
            bucket.totCobros += entrada.monto;
            if (!entrada.completado) bucket.pendCobros += entrada.monto;
        } else {
            bucket.pagos.push(entrada);
            bucket.totPagos += entrada.monto;
            if (!entrada.completado) bucket.pendPagos += entrada.monto;
        }
    }

    function expandirItemRecurrenteOFijo(item, esRecurrente, construirEntrada) {
        if (esRecurrente) {
            var excMap = (item.excepcionesMes && typeof item.excepcionesMes === 'object') ? item.excepcionesMes : null;
            if (excMap) {
                Object.keys(excMap).forEach(function(mesOrigKey) {
                    var fechaDest = excMap[mesOrigKey];
                    if (typeof fechaDest === 'string' && fechaDest.slice(0, 7) === mesClave) {
                        var diaDest = parseInt(fechaDest.slice(8, 10), 10) || 1;
                        agregarEnDia(fechaDest.slice(0, 10), construirEntrada(fechaDest.slice(0, 10), diaDest, true, mesOrigKey));
                    }
                });
            }
            if (!excMap || !excMap[mesClave]) {
                var diaBase = Math.min(Math.max(1, parseInt(item.dia, 10) || 15), totalDiasMes);
                var fechaBase = obtenerClaveFechaISOFinanzas(anio, mes, diaBase);
                agregarEnDia(fechaBase, construirEntrada(fechaBase, diaBase, false, mesClave));
            }
        } else if (item.fecha && typeof item.fecha === 'string' && item.fecha.length >= 10) {
            if (item.fecha.slice(0, 7) === mesClave) {
                var fExact = item.fecha.slice(0, 10);
                var diaExact = parseInt(fExact.slice(8, 10), 10) || 1;
                agregarEnDia(fExact, construirEntrada(fExact, diaExact, false, mesClave));
            }
        } else if (item.dia) {
            var diaSolo = Math.min(Math.max(1, parseInt(item.dia, 10) || 15), totalDiasMes);
            var fechaFallback = obtenerClaveFechaISOFinanzas(anio, mes, diaSolo);
            agregarEnDia(fechaFallback, construirEntrada(fechaFallback, diaSolo, false, mesClave));
        }
    }

    // 1. Cobros (Ingresos)
    (f.ingresos || []).forEach(function(item) {
        var info = clasificarOrigenIngreso(item);
        var monto = Number(item.monto) || 0;
        var cobrado = !!item.cobrado;
        var montoMostrar = (cobrado && item.montoCobrado !== undefined && item.montoCobrado !== null && item.montoCobrado !== "")
            ? Number(item.montoCobrado)
            : monto;
        var esRecurrente = esItemRecurrenteMensualReal(item, false);

        expandirItemRecurrenteOFijo(item, esRecurrente, function(fechaDest, diaDest, esExcepcion, mesOrigKey) {
            return {
                clase: 'cobro',
                origen: 'ingreso',
                id: item.id,
                cuotaNum: null,
                titulo: item.fuente || item.concepto || item.nombre || item.descripcion || 'Entrada de Ingreso',
                icono: info.icono || '💵',
                categoriaTxt: item.ventaId ? (item.cuotaId ? 'Crédito Almacén' : 'Venta Almacén') : info.nombreOrigen,
                monto: montoMostrar,
                completado: cobrado,
                vencida: !cobrado && fechaDest < hoyISO,
                fecha: fechaDest,
                dia: diaDest,
                diaRegla: Number(item.dia) || diaDest,
                esRecurrente: esRecurrente,
                esExcepcion: esExcepcion,
                mesOrigenRegla: mesOrigKey,
                esCreditoAlmacen: !!(item.ventaId && item.cuotaId)
            };
        });
    });

    // 2. Pagos (Gastos Programados y Ocasionales)
    (f.gastos || []).forEach(function(item) {
        var monto = Number(item.monto) || 0;
        var pagado = !!item.pagado;
        var esRecurrente = esItemRecurrenteMensualReal(item, true);

        expandirItemRecurrenteOFijo(item, esRecurrente, function(fechaDest, diaDest, esExcepcion, mesOrigKey) {
            return {
                clase: 'pago',
                origen: 'gasto',
                id: item.id,
                cuotaNum: null,
                titulo: item.concepto || 'Gasto',
                icono: item.tipo === 'ocasional' ? '⚡' : '💳',
                categoriaTxt: item.categoria || 'Gasto',
                monto: monto,
                completado: pagado,
                vencida: !pagado && fechaDest < hoyISO,
                fecha: fechaDest,
                dia: diaDest,
                diaRegla: Number(item.dia) || diaDest,
                esRecurrente: esRecurrente,
                esExcepcion: esExcepcion,
                mesOrigenRegla: mesOrigKey
            };
        });
    });

    // 3. Pagos de Cuotas de Deudas (omitiendo flexibles a tu ritmo)
    (f.deudas || []).forEach(function(deuda) {
        normalizarDeuda(deuda);
        if (deuda.esFlexible || deuda.tipoFrecuencia === 'libre') return;
        (deuda.cuotas || []).forEach(function(c) {
            if (!c.fecha || typeof c.fecha !== 'string' || c.fecha.slice(0, 7) !== mesClave) return;
            var fechaC = c.fecha.slice(0, 10);
            var diaC = parseInt(fechaC.slice(8, 10), 10) || 1;
            var montoC = Number(c.monto) || Number(deuda.montoCuota) || 0;
            agregarEnDia(fechaC, {
                clase: 'pago',
                origen: 'deuda_cuota',
                id: deuda.id,
                cuotaNum: c.num,
                totalCuotas: deuda.cuotasTotal,
                titulo: deuda.nombre + ' · Cuota #' + c.num + '/' + deuda.cuotasTotal,
                icono: deuda.iconoCategoria || '🛡️',
                categoriaTxt: deuda.categoria || 'Deuda',
                monto: montoC,
                completado: !!c.pagada,
                vencida: !c.pagada && fechaC < hoyISO,
                fecha: fechaC,
                dia: diaC,
                diaRegla: diaC,
                esRecurrente: false,
                esExcepcion: !!c.reprogramada,
                mesOrigenRegla: mesClave
            });
        });
    });

    // Calcular totales y días pico del mes
    var totalCobrosMes = 0;
    var totalPagosMes = 0;
    var countCobrosMes = 0;
    var countPagosMes = 0;
    var totalCobrosPendMes = 0;
    var totalPagosPendMes = 0;
    var countPendientesMes = 0;
    var diasConActividad = [];

    var maxCobroMonto = 0;
    var maxPagoMonto = 0;

    Object.keys(diasMap).sort().forEach(function(key) {
        var b = diasMap[key];
        totalCobrosMes += b.totCobros;
        totalPagosMes += b.totPagos;
        countCobrosMes += b.cobros.length;
        countPagosMes += b.pagos.length;
        totalCobrosPendMes += b.pendCobros;
        totalPagosPendMes += b.pendPagos;

        b.cobros.forEach(function(c) { if (!c.completado) countPendientesMes++; });
        b.pagos.forEach(function(p) { if (!p.completado) countPendientesMes++; });

        if (b.totCobros > maxCobroMonto) maxCobroMonto = b.totCobros;
        if (b.totPagos > maxPagoMonto) maxPagoMonto = b.totPagos;

        if (b.cobros.length > 0 || b.pagos.length > 0) {
            diasConActividad.push(b);
        }
    });

    var peakCobroDia = null;
    if (maxCobroMonto > 0) {
        var ordenCobros = diasConActividad.filter(function(b) { return b.cobros.length > 0; }).slice().sort(function(a, b) {
            return (b.totCobros - a.totCobros) || (b.cobros.length - a.cobros.length) || (a.dia - b.dia);
        });
        if (ordenCobros.length > 0) peakCobroDia = ordenCobros[0];
    }

    var peakPagoDia = null;
    if (maxPagoMonto > 0) {
        var ordenPagos = diasConActividad.filter(function(b) { return b.pagos.length > 0; }).slice().sort(function(a, b) {
            return (b.totPagos - a.totPagos) || (b.pagos.length - a.pagos.length) || (a.dia - b.dia);
        });
        if (ordenPagos.length > 0) peakPagoDia = ordenPagos[0];
    }

    return {
        mesClave: mesClave,
        totalDiasMes: totalDiasMes,
        diasMap: diasMap,
        diasConActividad: diasConActividad,
        totalCobrosMes: totalCobrosMes,
        totalPagosMes: totalPagosMes,
        countCobrosMes: countCobrosMes,
        countPagosMes: countPagosMes,
        totalCobrosPendMes: totalCobrosPendMes,
        totalPagosPendMes: totalPagosPendMes,
        countPendientesMes: countPendientesMes,
        maxCobroMonto: maxCobroMonto,
        maxPagoMonto: maxPagoMonto,
        peakCobroDia: peakCobroDia,
        peakPagoDia: peakPagoDia
    };
}

function actualizarBadgeCalendarioFinanzas(fin, anio, mes) {
    var badge = document.getElementById('badge-cal-fin-pendientes');
    if (!badge) return;
    var resumen = resolverOcurrenciasFinanzasMes(fin, anio, mes);
    if (resumen.countPendientesMes > 0) {
        badge.innerText = resumen.countPendientesMes;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function filtrarMovimientosBucketFin(bucket, filtro) {
    if (!bucket) return { cobros: [], pagos: [] };
    var cList = bucket.cobros.slice();
    var pList = bucket.pagos.slice();
    if (filtro === 'cobros') pList = [];
    else if (filtro === 'pagos') cList = [];
    else if (filtro === 'pendientes') {
        cList = cList.filter(function(x) { return !x.completado; });
        pList = pList.filter(function(x) { return !x.completado; });
    }
    // Pendientes primero, completados al final
    cList.sort(function(a, b) { return (a.completado === b.completado) ? 0 : (a.completado ? 1 : -1); });
    pList.sort(function(a, b) { return (a.completado === b.completado) ? 0 : (a.completado ? 1 : -1); });
    return { cobros: cList, pagos: pList };
}

function seleccionarDiaCalFinanzas(fechaISO) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.calDiaSeleccionado = fechaISO;
    renderizarCalendarioFinanzas();
}

function cambiarFiltroCalFinanzas(filtro) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.calFiltroTipo = filtro || 'todos';
    renderizarCalendarioFinanzas();
}

function irADiaCalFinanzas(fechaISO) {
    if (!fechaISO || fechaISO.length < 10) return;
    var partes = fechaISO.split('-');
    var anioDest = parseInt(partes[0], 10);
    var mesDest = parseInt(partes[1], 10) - 1;
    var hoy = new Date();
    var diffMeses = (anioDest - hoy.getFullYear()) * 12 + (mesDest - hoy.getMonth());

    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.mesOffset = diffMeses;
    window.ESTADO_FINANZAS.calDiaSeleccionado = fechaISO;
    window.ESTADO_FINANZAS.calUltimoMovimiento = null;
    window.ESTADO_FINANZAS.seccionActiva = 'calendario';
    cambiarSeccionFinanzas('calendario', true);
    renderizarFinanzas(APP_STATE.finanzas);
}

function renderizarCalendarioFinanzas() {
    var cont = document.getElementById('contenedor-calendario-finanzas');
    if (!cont) return;

    var fin = (APP_STATE && APP_STATE.finanzas) || DEFAULT_STATE.finanzas;
    var fechaMes = obtenerFechaMesFinanzas();
    var anio = fechaMes.getFullYear();
    var mes = fechaMes.getMonth();
    var hoyISO = obtenerHoyISOFinanzas();
    var filtro = (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.calFiltroTipo) || 'todos';

    var data = resolverOcurrenciasFinanzasMes(fin, anio, mes);

    // Determinar día seleccionado válido dentro del mes activo
    var selISO = window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.calDiaSeleccionado;
    if (!selISO || !data.diasMap[selISO]) {
        if (data.diasMap[hoyISO]) {
            selISO = hoyISO;
        } else if (data.diasConActividad.length > 0) {
            selISO = data.diasConActividad[0].fecha;
        } else {
            selISO = obtenerClaveFechaISOFinanzas(anio, mes, 1);
        }
        if (window.ESTADO_FINANZAS) window.ESTADO_FINANZAS.calDiaSeleccionado = selISO;
    }

    var nombreMesCap = fechaMes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    nombreMesCap = nombreMesCap.charAt(0).toUpperCase() + nombreMesCap.slice(1);

    // 1. Resumen KPI del Mes + Días Pico clicables
    var picoCobroHtml = data.peakCobroDia
        ? '<button type="button" class="fin-cal-kpi-card is-clickable" style="border-top: 2px solid #10b981;" onclick="seleccionarDiaCalFinanzas(\'' + data.peakCobroDia.fecha + '\')">' +
              '<span class="fin-cal-kpi-label">📈 Día con Más Cobros</span>' +
              '<span class="fin-cal-kpi-val" style="color: #34d399;">Día ' + data.peakCobroDia.dia + ' · +$' + data.peakCobroDia.totCobros.toFixed(0) + '</span>' +
              '<span class="fin-cal-kpi-sub">' + data.peakCobroDia.cobros.length + (data.peakCobroDia.cobros.length === 1 ? ' cobro' : ' cobros') + ' · Toca para ver</span>' +
          '</button>'
        : '<div class="fin-cal-kpi-card" style="border-top: 2px solid #10b981;">' +
              '<span class="fin-cal-kpi-label">📈 Día con Más Cobros</span>' +
              '<span class="fin-cal-kpi-val" style="color: #64748b;">Sin datos</span>' +
              '<span class="fin-cal-kpi-sub">Sin cobros este mes</span>' +
          '</div>';

    var picoPagoHtml = data.peakPagoDia
        ? '<button type="button" class="fin-cal-kpi-card is-clickable" style="border-top: 2px solid #ef4444;" onclick="seleccionarDiaCalFinanzas(\'' + data.peakPagoDia.fecha + '\')">' +
              '<span class="fin-cal-kpi-label">📉 Día con Más Pagos</span>' +
              '<span class="fin-cal-kpi-val" style="color: #f87171;">Día ' + data.peakPagoDia.dia + ' · -$' + data.peakPagoDia.totPagos.toFixed(0) + '</span>' +
              '<span class="fin-cal-kpi-sub">' + data.peakPagoDia.pagos.length + (data.peakPagoDia.pagos.length === 1 ? ' pago' : ' pagos') + ' · Toca para ver</span>' +
          '</button>'
        : '<div class="fin-cal-kpi-card" style="border-top: 2px solid #ef4444;">' +
              '<span class="fin-cal-kpi-label">📉 Día con Más Pagos</span>' +
              '<span class="fin-cal-kpi-val" style="color: #64748b;">Sin datos</span>' +
              '<span class="fin-cal-kpi-sub">Sin pagos este mes</span>' +
          '</div>';

    var html = '<div class="fin-cal-unified-banner">' +
        '<span>📅 Tus movimientos de Finanzas también aparecen sincronizados en tu <strong>Calendario Principal</strong>.</span>' +
        '<button type="button" class="btn-sync-action btn-sync-light" style="font-size: 11.5px; padding: 6px 12px; flex-shrink: 0;" onclick="if(typeof irAFechaEnCalendario===\'function\') irAFechaEnCalendario(\'' + selISO + '\', \'mes\', \'finanzas\')">Abrir en Calendario Unificado →</button>' +
    '</div>' +
    '<div class="fin-cal-summary-grid">' +
        '<div class="fin-cal-kpi-card" style="border-top: 2px solid #34d399;">' +
            '<span class="fin-cal-kpi-label">💰 Cobros de ' + escaparHTML(nombreMesCap.split(' ')[0]) + '</span>' +
            '<span class="fin-cal-kpi-val" style="color: #34d399;">+$' + data.totalCobrosMes.toFixed(2) + '</span>' +
            '<span class="fin-cal-kpi-sub">' + data.countCobrosMes + ' pautados · Pend: $' + data.totalCobrosPendMes.toFixed(2) + '</span>' +
        '</div>' +
        '<div class="fin-cal-kpi-card" style="border-top: 2px solid #f87171;">' +
            '<span class="fin-cal-kpi-label">💳 Pagos y Cuotas</span>' +
            '<span class="fin-cal-kpi-val" style="color: #f87171;">-$' + data.totalPagosMes.toFixed(2) + '</span>' +
            '<span class="fin-cal-kpi-sub">' + data.countPagosMes + ' pautados · Pend: $' + data.totalPagosPendMes.toFixed(2) + '</span>' +
        '</div>' +
        picoCobroHtml +
        picoPagoHtml +
    '</div>';

    // 2. Filtros y Leyenda + Cuadrícula del Calendario (Lunes a Domingo)
    var filtrosArr = [
        { id: 'todos', lbl: 'Todos' },
        { id: 'cobros', lbl: '💰 Solo Cobros' },
        { id: 'pagos', lbl: '💳 Solo Pagos' },
        { id: 'pendientes', lbl: '⏳ Pendientes (' + data.countPendientesMes + ')' }
    ];

    html += '<div class="fin-cal-board">' +
        '<div class="fin-cal-toolbar">' +
            '<div class="fin-cal-filters">';
    filtrosArr.forEach(function(flt) {
        html += '<button type="button" class="fin-cal-filter-btn ' + (filtro === flt.id ? 'active' : '') + '" onclick="cambiarFiltroCalFinanzas(\'' + flt.id + '\')">' + flt.lbl + '</button>';
    });
    html += '</div>' +
            '<div class="fin-cal-legend">' +
                '<span class="fin-cal-legend-item"><span class="fin-cal-legend-dot" style="background:#34d399;"></span> Cobros</span>' +
                '<span class="fin-cal-legend-item"><span class="fin-cal-legend-dot" style="background:#f87171;"></span> Pagos / Cuotas</span>' +
                '<span class="fin-cal-legend-item">⭐ Pico del mes</span>' +
            '</div>' +
        '</div>' +
        '<div class="fin-cal-weekdays">' +
            '<div class="fin-cal-weekday">LUN</div>' +
            '<div class="fin-cal-weekday">MAR</div>' +
            '<div class="fin-cal-weekday">MIÉ</div>' +
            '<div class="fin-cal-weekday">JUE</div>' +
            '<div class="fin-cal-weekday">VIE</div>' +
            '<div class="fin-cal-weekday">SÁB</div>' +
            '<div class="fin-cal-weekday">DOM</div>' +
        '</div>' +
        '<div class="fin-cal-grid">';

    var primerDia = new Date(anio, mes, 1);
    var offsetInicio = (primerDia.getDay() + 6) % 7;
    var totalDiasMesAnterior = new Date(anio, mes, 0).getDate();

    for (var p = offsetInicio - 1; p >= 0; p--) {
        var diaPrev = totalDiasMesAnterior - p;
        html += '<div class="fin-cal-cell is-outside"><div class="fin-cal-cell-top"><span class="fin-cal-day-num">' + diaPrev + '</span></div></div>';
    }

    for (var d = 1; d <= data.totalDiasMes; d++) {
        var fechaCell = obtenerClaveFechaISOFinanzas(anio, mes, d);
        var bucket = data.diasMap[fechaCell];
        var filtrado = filtrarMovimientosBucketFin(bucket, filtro);

        var totC = filtrado.cobros.reduce(function(acc, x) { return acc + x.monto; }, 0);
        var totP = filtrado.pagos.reduce(function(acc, x) { return acc + x.monto; }, 0);

        var esHoy = (fechaCell === hoyISO);
        var esSel = (fechaCell === selISO);
        var esPeakCobro = (filtro !== 'pagos' && data.maxCobroMonto > 0 && Math.abs(bucket.totCobros - data.maxCobroMonto) < 0.01 && bucket.cobros.length > 0);
        var esPeakPago = (filtro !== 'cobros' && data.maxPagoMonto > 0 && Math.abs(bucket.totPagos - data.maxPagoMonto) < 0.01 && bucket.pagos.length > 0);

        var clases = 'fin-cal-cell';
        if (esHoy) clases += ' is-today';
        if (esPeakCobro) clases += ' is-peak-cobro';
        if (esPeakPago) clases += ' is-peak-pago';
        if (esSel) clases += ' is-selected';

        var estrella = '';
        if (esPeakCobro && esPeakPago) estrella = '<span class="fin-cal-peak-star" title="Pico de cobros y pagos">⭐</span>';
        else if (esPeakCobro) estrella = '<span class="fin-cal-peak-star" title="Día con más cobros del mes">💚</span>';
        else if (esPeakPago) estrella = '<span class="fin-cal-peak-star" title="Día con más pagos del mes">🔥</span>';

        var pillsHtml = '';
        if (filtrado.cobros.length > 0) {
            var heavyC = (filtrado.cobros.length >= 2 || esPeakCobro) ? ' is-heavy' : '';
            pillsHtml += '<div class="fin-cal-pill is-cobro' + heavyC + '" title="' + filtrado.cobros.length + ' cobro(s): +$' + totC.toFixed(2) + '">' +
                '<span>+$' + (totC >= 100 ? Math.round(totC) : totC.toFixed(0)) + '</span>' +
                (filtrado.cobros.length > 1 ? '<span class="fin-cal-count-tag">×' + filtrado.cobros.length + '</span>' : '') +
            '</div>';
        }
        if (filtrado.pagos.length > 0) {
            var heavyP = (filtrado.pagos.length >= 2 || esPeakPago) ? ' is-heavy' : '';
            pillsHtml += '<div class="fin-cal-pill is-pago' + heavyP + '" title="' + filtrado.pagos.length + ' pago(s): -$' + totP.toFixed(2) + '">' +
                '<span>-$' + (totP >= 100 ? Math.round(totP) : totP.toFixed(0)) + '</span>' +
                (filtrado.pagos.length > 1 ? '<span class="fin-cal-count-tag">×' + filtrado.pagos.length + '</span>' : '') +
            '</div>';
        }

        html += '<button type="button" class="' + clases + '" onclick="seleccionarDiaCalFinanzas(\'' + fechaCell + '\')">' +
            '<div class="fin-cal-cell-top"><span class="fin-cal-day-num">' + d + '</span>' + estrella + '</div>' +
            '<div class="fin-cal-pills-wrap">' + pillsHtml + '</div>' +
        '</button>';
    }

    var totalCeldas = offsetInicio + data.totalDiasMes;
    var restoCeldas = (7 - (totalCeldas % 7)) % 7;
    for (var s = 1; s <= restoCeldas; s++) {
        html += '<div class="fin-cal-cell is-outside"><div class="fin-cal-cell-top"><span class="fin-cal-day-num">' + s + '</span></div></div>';
    }

    html += '</div></div>';

    // 3. Banner de confirmación de último movimiento reprogramado (permite saltar o seguir moviendo en el día actual)
    var ultMov = window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.calUltimoMovimiento;
    if (ultMov && ultMov.destinoFecha) {
        html += '<div class="fin-cal-move-banner">' +
            '<span>✓ <strong>' + escaparHTML(ultMov.titulo) + '</strong> movido al <strong>' + formatearFechaCorta(ultMov.destinoFecha) + '</strong>.</span>' +
            '<div style="display: flex; gap: 6px; align-items: center;">' +
                '<button type="button" class="btn-mover-fecha-fin" onclick="irADiaCalFinanzas(\'' + ultMov.destinoFecha + '\')">Ir al ' + formatearFechaCorta(ultMov.destinoFecha) + ' →</button>' +
                '<button type="button" class="btn-delete-row" style="width: 24px; height: 24px;" onclick="window.ESTADO_FINANZAS.calUltimoMovimiento=null; renderizarCalendarioFinanzas();" title="Cerrar aviso">✕</button>' +
            '</div>' +
        '</div>';
    }

    // 4. Panel de Detalle del Día Seleccionado
    var bucketSel = data.diasMap[selISO];
    var filtradoSel = filtrarMovimientosBucketFin(bucketSel, filtro);
    var totDiaC = bucketSel ? bucketSel.totCobros : 0;
    var totDiaP = bucketSel ? bucketSel.totPagos : 0;
    var netoDia = totDiaC - totDiaP;

    var fechaObjSel = new Date(selISO + 'T12:00:00');
    var tituloDiaSel = !isNaN(fechaObjSel.getTime())
        ? fechaObjSel.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : selISO;
    tituloDiaSel = tituloDiaSel.charAt(0).toUpperCase() + tituloDiaSel.slice(1);

    html += '<div class="fin-cal-detail-card" id="fin-cal-dia-detalle">' +
        '<div class="fin-cal-detail-hdr">' +
            '<div>' +
                '<div style="font-size: 11px; color: #38bdf8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">📆 DETALLE DEL DÍA SELECCIONADO</div>' +
                '<h4 style="margin: 3px 0 0 0; font-size: 16px; font-weight: 800; color: #f8fafc;">' + escaparHTML(tituloDiaSel) + '</h4>' +
            '</div>' +
            '<div style="display: flex; gap: 6px; flex-wrap: wrap;">' +
                '<button type="button" class="btn-add-finanza" onclick="abrirModalIngreso(\'aleatoria\', \'' + selISO + '\')" style="padding: 6px 12px; font-size: 11.5px; border-color: #10b981; color: #34d399; background: rgba(16, 185, 129, 0.12);">+ Cobro este día</button>' +
                '<button type="button" class="btn-add-finanza" onclick="abrirModalGasto(\'ocasional\', \'' + selISO + '\')" style="padding: 6px 12px; font-size: 11.5px; border-color: #ef4444; color: #f87171; background: rgba(239, 68, 68, 0.12);">+ Pago este día</button>' +
            '</div>' +
        '</div>' +
        '<div class="fin-cal-day-metrics">' +
            '<span class="fin-cal-day-chip" style="color: #34d399; border-color: rgba(16, 185, 129, 0.28);">💰 Cobros: <strong>+$' + totDiaC.toFixed(2) + '</strong> (' + (bucketSel ? bucketSel.cobros.length : 0) + ')</span>' +
            '<span class="fin-cal-day-chip" style="color: #f87171; border-color: rgba(239, 68, 68, 0.28);">💳 Pagos: <strong>-$' + totDiaP.toFixed(2) + '</strong> (' + (bucketSel ? bucketSel.pagos.length : 0) + ')</span>' +
            '<span class="fin-cal-day-chip" style="color: ' + (netoDia >= 0 ? '#38bdf8' : '#fbbf24') + ';">⚖️ Neto del día: <strong>' + (netoDia >= 0 ? '+$' : '-$') + Math.abs(netoDia).toFixed(2) + '</strong></span>' +
        '</div>';

    if (filtradoSel.cobros.length === 0 && filtradoSel.pagos.length === 0) {
        html += '<div class="finanzas-empty-hint" style="margin-bottom: 0;">Sin ' + (filtro === 'todos' ? 'cobros ni pagos' : (filtro === 'cobros' ? 'cobros' : (filtro === 'pagos' ? 'pagos' : 'movimientos pendientes'))) + ' pautados para este día.</div>';
    } else {
        if (filtradoSel.cobros.length > 0) {
            html += '<div class="fin-cal-subhead" style="color: #34d399;"><span>💰 Cobros del Día (' + filtradoSel.cobros.length + ')</span></div>' +
                    '<div class="fin-cal-tx-list">';
            filtradoSel.cobros.forEach(function(item) {
                var estadoHtml = item.completado
                    ? '<span class="badge-ingreso-cobrado">✅ Cobrado</span><button type="button" class="btn-cobrar-ingreso btn-deshacer-cobro" onclick="deshacerCobroIngresoUI(\'' + item.id + '\')" title="Revertir cobro">↩</button>'
                    : '<button type="button" class="btn-cobrar-ingreso" onclick="cobrarIngresoUI(\'' + item.id + '\')">💰 Cobrar</button>';
                var notaRec = item.esRecurrente
                    ? (item.esExcepcion ? '📌 Reprogramado (habitual día ' + item.diaRegla + ')' : '🔄 Fijo mensual (día ' + item.diaRegla + ')')
                    : (item.esCreditoAlmacen ? '📦 Sincroniza cuota en Almacén' : '📆 Fecha puntual');

                html += '<div class="finanzas-tx-item" style="background: rgba(16, 185, 129, 0.04); border-color: rgba(16, 185, 129, 0.2);">' +
                    '<div class="finanzas-tx-main">' +
                        '<div class="finanzas-tx-icon" style="color: #34d399;">' + item.icono + '</div>' +
                        '<div class="finanzas-tx-details">' +
                            '<div class="finanzas-tx-title">' + escaparHTML(item.titulo) + '</div>' +
                            '<div class="finanzas-tx-meta" style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">' +
                                '<span class="badge-cat" style="background: rgba(255,255,255,0.06); color:#cbd5e1;">' + escaparHTML(item.categoriaTxt) + '</span>' +
                                '<span style="font-size:11px; color:#94a3b8;">' + notaRec + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="finanzas-tx-right" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end;">' +
                        '<div class="finanzas-tx-monto monto-positivo">+$' + item.monto.toFixed(2) + '</div>' +
                        estadoHtml +
                        '<button type="button" class="btn-mover-fecha-fin" onclick="abrirModalMoverFechaFinanza(\'ingreso\', \'' + item.id + '\', \'\', \'' + item.mesOrigenRegla + '\', \'' + item.fecha + '\', ' + (item.esRecurrente ? 'true' : 'false') + ')">📅 Mover Día</button>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
        }

        if (filtradoSel.pagos.length > 0) {
            html += '<div class="fin-cal-subhead" style="color: #f87171;"><span>💳 Pagos y Cuotas del Día (' + filtradoSel.pagos.length + ')</span></div>' +
                    '<div class="fin-cal-tx-list">';
            filtradoSel.pagos.forEach(function(item) {
                var estadoPagoHtml = '';
                if (item.origen === 'deuda_cuota') {
                    estadoPagoHtml = item.completado
                        ? '<span class="badge-ingreso-cobrado">✅ Pagada</span><button type="button" class="btn-cobrar-ingreso btn-deshacer-cobro" onclick="deshacerCuotaDeudaUI(\'' + item.id + '\')" title="Deshacer última cuota pagada">↩</button>'
                        : '<button type="button" class="btn-pagar-deuda" onclick="pagarCuotaDeudaUI(\'' + item.id + '\', ' + item.cuotaNum + ')">💳 Pagar</button>';
                } else {
                    estadoPagoHtml = item.completado
                        ? '<span class="badge-ingreso-cobrado">✅ Pagado</span><button type="button" class="btn-cobrar-ingreso btn-deshacer-cobro" onclick="deshacerPagoGastoUI(\'' + item.id + '\')" title="Desmarcar pago">↩</button>'
                        : '<button type="button" class="btn-pagar-deuda" onclick="pagarGastoUI(\'' + item.id + '\')">💳 Pagar</button>';
                }

                var notaPago = item.origen === 'deuda_cuota'
                    ? (item.esExcepcion ? '📌 Cuota movida manualmente' : '🛡️ Cronograma de deuda')
                    : (item.esRecurrente
                        ? (item.esExcepcion ? '📌 Reprogramado (habitual día ' + item.diaRegla + ')' : '🔄 Fijo mensual (día ' + item.diaRegla + ')')
                        : '⚡ Pago puntual');
                var vencidoTag = item.vencida ? '<span class="cuota-badge-vencida">⚠️ Vencido</span>' : '';

                html += '<div class="finanzas-tx-item" style="background: rgba(239, 68, 68, 0.04); border-color: rgba(239, 68, 68, 0.2);">' +
                    '<div class="finanzas-tx-main">' +
                        '<div class="finanzas-tx-icon" style="color: #f87171;">' + item.icono + '</div>' +
                        '<div class="finanzas-tx-details">' +
                            '<div class="finanzas-tx-title">' + escaparHTML(item.titulo) + '</div>' +
                            '<div class="finanzas-tx-meta" style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">' +
                                '<span class="badge-cat" style="background: rgba(255,255,255,0.06); color:#cbd5e1;">' + escaparHTML(item.categoriaTxt) + '</span>' +
                                vencidoTag +
                                '<span style="font-size:11px; color:#94a3b8;">' + notaPago + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="finanzas-tx-right" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end;">' +
                        '<div class="finanzas-tx-monto monto-negativo">-$' + item.monto.toFixed(2) + '</div>' +
                        estadoPagoHtml +
                        '<button type="button" class="btn-mover-fecha-fin" onclick="abrirModalMoverFechaFinanza(\'' + item.origen + '\', \'' + item.id + '\', \'' + (item.cuotaNum != null ? item.cuotaNum : '') + '\', \'' + item.mesOrigenRegla + '\', \'' + item.fecha + '\', ' + (item.esRecurrente ? 'true' : 'false') + ')">📅 Mover Día</button>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
        }
    }
    html += '</div>';

    // 5. Orden Cronológico Completo del Mes (solo días con actividad filtrada)
    html += '<div class="fin-cal-detail-card" style="border-color: rgba(255, 255, 255, 0.08);">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">' +
            '<div>' +
                '<div style="font-size: 11px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">📋 ORDEN CRONOLÓGICO DEL MES</div>' +
                '<div style="font-size: 12.5px; color: #cbd5e1; margin-top: 2px;">Toca cualquier día con actividad para inspeccionar o mover sus cobros/pagos</div>' +
            '</div>' +
        '</div>' +
        '<div class="fin-cal-chrono-list">';

    var filasCrono = 0;
    data.diasConActividad.forEach(function(b) {
        var fltB = filtrarMovimientosBucketFin(b, filtro);
        if (fltB.cobros.length === 0 && fltB.pagos.length === 0) return;
        filasCrono++;

        var fObj = new Date(b.fecha + 'T12:00:00');
        var diaSemanaCorto = !isNaN(fObj.getTime()) ? fObj.toLocaleDateString('es-ES', { weekday: 'short' }) : '';
        diaSemanaCorto = diaSemanaCorto ? (diaSemanaCorto.charAt(0).toUpperCase() + diaSemanaCorto.slice(1)) : '';

        var sumC = fltB.cobros.reduce(function(acc, x) { return acc + x.monto; }, 0);
        var sumP = fltB.pagos.reduce(function(acc, x) { return acc + x.monto; }, 0);
        var nombresResumen = fltB.cobros.concat(fltB.pagos).slice(0, 3).map(function(it) { return it.titulo; }).join(' · ');
        if (fltB.cobros.length + fltB.pagos.length > 3) nombresResumen += ' ...';

        html += '<button type="button" class="fin-cal-chrono-row ' + (b.fecha === selISO ? 'is-selected' : '') + '" onclick="seleccionarDiaCalFinanzas(\'' + b.fecha + '\')">' +
            '<div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">' +
                '<div style="min-width: 48px; text-align:center; background:#0b0e17; border:1px solid rgba(255,255,255,0.08); border-radius:9px; padding:5px 6px;">' +
                    '<div style="font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase;">' + escaparHTML(diaSemanaCorto) + '</div>' +
                    '<div style="font-size:15px; color:#f8fafc; font-weight:800;">' + b.dia + '</div>' +
                '</div>' +
                '<div style="min-width:0; flex:1;">' +
                    '<div style="font-size:12.5px; font-weight:700; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + escaparHTML(nombresResumen) + '</div>' +
                    '<div style="font-size:11px; color:#94a3b8; margin-top:2px;">' +
                        (fltB.cobros.length > 0 ? '<span style="color:#34d399; font-weight:700;">' + fltB.cobros.length + ' cobro' + (fltB.cobros.length === 1 ? '' : 's') + '</span> ' : '') +
                        (fltB.cobros.length > 0 && fltB.pagos.length > 0 ? ' · ' : '') +
                        (fltB.pagos.length > 0 ? '<span style="color:#f87171; font-weight:700;">' + fltB.pagos.length + ' pago' + (fltB.pagos.length === 1 ? '' : 's') + '</span>' : '') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px; flex-shrink:0;">' +
                (sumC > 0 ? '<span style="font-size:12.5px; font-weight:800; color:#34d399;">+$' + sumC.toFixed(2) + '</span>' : '') +
                (sumP > 0 ? '<span style="font-size:12.5px; font-weight:800; color:#f87171;">-$' + sumP.toFixed(2) + '</span>' : '') +
            '</div>' +
        '</button>';
    });

    if (filasCrono === 0) {
        html += '<div class="finanzas-empty-hint" style="margin:0;">No hay movimientos registrados para este mes con el filtro actual.</div>';
    }

    html += '</div></div>';

    cont.innerHTML = html;
}

function abrirModalMoverFechaFinanza(origen, id, cuotaNum, mesClaveOrigen, fechaActualISO, esRecurrente) {
    var fin = (APP_STATE && APP_STATE.finanzas) || DEFAULT_STATE.finanzas;
    var titulo = '';
    var monto = 0;
    var clase = 'pago';

    if (origen === 'ingreso') {
        var ing = (fin.ingresos || []).find(function(x) { return x.id === id; });
        if (!ing) return;
        titulo = ing.fuente || ing.concepto || ing.nombre || ing.descripcion || 'Cobro';
        monto = Number(ing.monto) || 0;
        clase = 'cobro';
    } else if (origen === 'gasto') {
        var gas = (fin.gastos || []).find(function(x) { return x.id === id; });
        if (!gas) return;
        titulo = gas.concepto || 'Pago';
        monto = Number(gas.monto) || 0;
        clase = 'pago';
    } else if (origen === 'deuda_cuota') {
        var deu = (fin.deudas || []).find(function(x) { return x.id === id; });
        if (!deu) return;
        normalizarDeuda(deu);
        var cuotaObj = (deu.cuotas || []).find(function(c) { return String(c.num) === String(cuotaNum); });
        titulo = deu.nombre + ' · Cuota #' + cuotaNum + '/' + deu.cuotasTotal;
        monto = cuotaObj ? (Number(cuotaObj.monto) || Number(deu.montoCuota) || 0) : (Number(deu.montoCuota) || 0);
        clase = 'pago';
    } else {
        return;
    }

    var modal = document.getElementById('modal-mover-fecha-finanza');
    if (!modal) return;

    document.getElementById('mover-fin-origen').value = origen;
    document.getElementById('mover-fin-id').value = id;
    document.getElementById('mover-fin-cuota-num').value = cuotaNum != null ? String(cuotaNum) : '';
    document.getElementById('mover-fin-mes-clave').value = mesClaveOrigen || '';
    document.getElementById('mover-fin-es-recurrente').value = esRecurrente ? '1' : '0';

    var badgeEl = document.getElementById('mover-fin-badge-tipo');
    var montoEl = document.getElementById('mover-fin-monto');
    var titEl = document.getElementById('mover-fin-titulo');
    var fechaActEl = document.getElementById('mover-fin-fecha-actual');
    var inNueva = document.getElementById('mover-fin-nueva-fecha');
    var grpAlcance = document.getElementById('mover-fin-grupo-alcance');
    var contAtajos = document.getElementById('mover-fin-atajos');

    if (badgeEl) {
        if (clase === 'cobro') {
            badgeEl.innerText = '💰 Cobro / Ingreso';
            badgeEl.style.background = 'rgba(16, 185, 129, 0.18)';
            badgeEl.style.color = '#34d399';
        } else {
            badgeEl.innerText = origen === 'deuda_cuota' ? '🛡️ Cuota de Deuda' : '💳 Pago / Gasto';
            badgeEl.style.background = 'rgba(239, 68, 68, 0.18)';
            badgeEl.style.color = '#f87171';
        }
    }
    if (montoEl) {
        montoEl.innerText = (clase === 'cobro' ? '+$' : '-$') + monto.toFixed(2);
        montoEl.style.color = clase === 'cobro' ? '#34d399' : '#f87171';
    }
    if (titEl) titEl.innerText = titulo;
    if (fechaActEl) fechaActEl.innerText = formatearFechaCorta(fechaActualISO);

    var baseISO = (fechaActualISO && fechaActualISO.length >= 10) ? fechaActualISO.slice(0, 10) : obtenerHoyISOFinanzas();
    if (inNueva) inNueva.value = baseISO;

    if (grpAlcance) {
        grpAlcance.style.display = esRecurrente ? 'block' : 'none';
        var radioSoloMes = grpAlcance.querySelector('input[value="solo_mes"]');
        if (radioSoloMes) radioSoloMes.checked = true;
    }

    // Generar atajos rápidos desde la fecha base del movimiento
    if (contAtajos) {
        var dBase = new Date(baseISO + 'T12:00:00');
        var sumarDias = function(n) {
            var c = new Date(dBase.getTime());
            c.setDate(c.getDate() + n);
            return obtenerClaveFechaISOFinanzas(c.getFullYear(), c.getMonth(), c.getDate());
        };
        var anioB = dBase.getFullYear();
        var mesB = dBase.getMonth();
        var ultDiaB = new Date(anioB, mesB + 1, 0).getDate();
        var proxMes = new Date(anioB, mesB + 1, 1);
        var atajos = [
            { lbl: '+1 día', iso: sumarDias(1) },
            { lbl: '+3 días', iso: sumarDias(3) },
            { lbl: '+7 días', iso: sumarDias(7) },
            { lbl: 'Día 15', iso: obtenerClaveFechaISOFinanzas(anioB, mesB, 15) },
            { lbl: 'Último (' + ultDiaB + ')', iso: obtenerClaveFechaISOFinanzas(anioB, mesB, ultDiaB) },
            { lbl: 'Día 1 próx. mes', iso: obtenerClaveFechaISOFinanzas(proxMes.getFullYear(), proxMes.getMonth(), 1) }
        ];
        var htmlAt = '';
        atajos.forEach(function(a) {
            htmlAt += '<button type="button" class="btn-atajo-fecha-fin" onclick="seleccionarAtajoFechaMoverFin(\'' + a.iso + '\')">' + a.lbl + '</button>';
        });
        contAtajos.innerHTML = htmlAt;
    }

    modal.style.display = 'flex';
}

function seleccionarAtajoFechaMoverFin(fechaISO) {
    var inNueva = document.getElementById('mover-fin-nueva-fecha');
    if (inNueva && fechaISO) inNueva.value = fechaISO;
}

function cerrarModalMoverFechaFinanza() {
    var modal = document.getElementById('modal-mover-fecha-finanza');
    if (modal) modal.style.display = 'none';
}

function calcularDiasDiferenciaISOFinanzas(fechaA, fechaB) {
    if (!fechaA || !fechaB || fechaA.length < 10 || fechaB.length < 10) return 0;
    var a = new Date(fechaA.slice(0, 10) + 'T00:00:00');
    var b = new Date(fechaB.slice(0, 10) + 'T00:00:00');
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
    return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function resolverFechaEfectivaMovFinanzas(item, esRecurrente, anio, mes) {
    if (!item) return obtenerHoyISOFinanzas();
    var mesClave = anio + '-' + String(mes + 1).padStart(2, '0');
    var totalDiasMes = new Date(anio, mes + 1, 0).getDate();
    if (esRecurrente) {
        var excMap = (item.excepcionesMes && typeof item.excepcionesMes === 'object') ? item.excepcionesMes : null;
        if (excMap && typeof excMap[mesClave] === 'string' && excMap[mesClave].length >= 10) {
            return excMap[mesClave].slice(0, 10);
        }
        var diaRec = Math.min(Math.max(1, parseInt(item.dia, 10) || 15), totalDiasMes);
        return obtenerClaveFechaISOFinanzas(anio, mes, diaRec);
    }
    if (item.fecha && typeof item.fecha === 'string' && item.fecha.length >= 10) {
        return item.fecha.slice(0, 10);
    }
    var diaFallback = Math.min(Math.max(1, parseInt(item.dia, 10) || 15), totalDiasMes);
    return obtenerClaveFechaISOFinanzas(anio, mes, diaFallback);
}

function obtenerRetrasosFinanzas(fin) {
    var f = fin || (APP_STATE && APP_STATE.finanzas) || DEFAULT_STATE.finanzas;
    sanearDatosFinanzasRecurrentesYCategorias(f);
    var hoyISO = obtenerHoyISOFinanzas();
    var hoyAnio = parseInt(hoyISO.slice(0, 4), 10);
    var hoyMes = parseInt(hoyISO.slice(5, 7), 10) - 1;
    var hoyMesClave = hoyISO.slice(0, 7);

    var cobros = [];
    var pagos = [];

    // 1. Cobros retrasados (Ingresos fijos del mes vigente, variables o créditos Almacén vencidos sin cobrar)
    (f.ingresos || []).forEach(function(item) {
        if (!item || !item.id || item.cobrado) return;
        var info = clasificarOrigenIngreso(item);
        var esRecurrente = esItemRecurrenteMensualReal(item, false);
        var fechaEff = resolverFechaEfectivaMovFinanzas(item, esRecurrente, hoyAnio, hoyMes);
        if (!fechaEff || fechaEff >= hoyISO) return;

        var dias = Math.max(1, calcularDiasDiferenciaISOFinanzas(hoyISO, fechaEff));
        cobros.push({
            uid: 'ingreso:' + item.id,
            clase: 'cobro',
            origen: 'ingreso',
            id: item.id,
            cuotaNum: '',
            titulo: item.fuente || item.concepto || item.nombre || item.descripcion || 'Cobro pendiente',
            categoriaTxt: item.ventaId ? (item.cuotaId ? 'Crédito Almacén' : 'Venta Almacén') : (info.nombreOrigen || 'Ingreso'),
            icono: info.icono || '💵',
            monto: Number(item.monto) || 0,
            fechaISO: fechaEff,
            diasRetraso: dias,
            esRecurrente: esRecurrente,
            mesOrigenRegla: fechaEff.slice(0, 7),
            esCreditoAlmacen: !!(item.ventaId && item.cuotaId)
        });
    });

    // 2. Pagos retrasados (Gastos programados u ocasionales vencidos sin pagar)
    (f.gastos || []).forEach(function(item) {
        if (!item || !item.id || item.pagado) return;
        var esRecurrente = esItemRecurrenteMensualReal(item, true);
        var fechaEff = resolverFechaEfectivaMovFinanzas(item, esRecurrente, hoyAnio, hoyMes);
        if (!fechaEff || fechaEff >= hoyISO) return;

        var dias = Math.max(1, calcularDiasDiferenciaISOFinanzas(hoyISO, fechaEff));
        pagos.push({
            uid: 'gasto:' + item.id,
            clase: 'pago',
            origen: 'gasto',
            id: item.id,
            cuotaNum: '',
            titulo: item.concepto || 'Pago pendiente',
            categoriaTxt: item.categoria || (item.tipo === 'ocasional' ? 'Ocasional' : 'Programado'),
            icono: item.tipo === 'ocasional' ? '⚡' : '💳',
            monto: Number(item.monto) || 0,
            fechaISO: fechaEff,
            diasRetraso: dias,
            esRecurrente: esRecurrente,
            mesOrigenRegla: fechaEff.slice(0, 7)
        });
    });

    // 3. Cuotas de deudas retrasadas (omitiendo deudas flexibles a tu ritmo)
    (f.deudas || []).forEach(function(deuda) {
        if (!deuda || !deuda.id || deuda.pagada) return;
        normalizarDeuda(deuda);
        if (deuda.esFlexible || deuda.tipoFrecuencia === 'libre') return;
        (deuda.cuotas || []).forEach(function(c) {
            if (!c || c.pagada || !c.fecha || typeof c.fecha !== 'string') return;
            var fechaC = c.fecha.slice(0, 10);
            if (fechaC >= hoyISO) return;
            var dias = Math.max(1, calcularDiasDiferenciaISOFinanzas(hoyISO, fechaC));
            pagos.push({
                uid: 'deuda_cuota:' + deuda.id + ':' + c.num,
                clase: 'pago',
                origen: 'deuda_cuota',
                id: deuda.id,
                cuotaNum: String(c.num),
                titulo: deuda.nombre + ' · Cuota #' + c.num + '/' + (deuda.cuotasTotal || 1),
                categoriaTxt: deuda.categoria || 'Cuota de Deuda',
                icono: deuda.iconoCategoria || '🛡️',
                monto: Number(c.monto) || Number(deuda.montoCuota) || 0,
                fechaISO: fechaC,
                diasRetraso: dias,
                esRecurrente: false,
                mesOrigenRegla: fechaC.slice(0, 7)
            });
        });
    });

    var ordenarRetrasos = function(a, b) {
        if (b.diasRetraso !== a.diasRetraso) return b.diasRetraso - a.diasRetraso;
        return b.monto - a.monto;
    };
    cobros.sort(ordenarRetrasos);
    pagos.sort(ordenarRetrasos);
    var todos = pagos.concat(cobros).sort(ordenarRetrasos);

    var totalCobrosUsd = cobros.reduce(function(acc, r) { return acc + r.monto; }, 0);
    var totalPagosUsd = pagos.reduce(function(acc, r) { return acc + r.monto; }, 0);

    return {
        hoyISO: hoyISO,
        cobros: cobros,
        pagos: pagos,
        todos: todos,
        countCobros: cobros.length,
        countPagos: pagos.length,
        totalCount: todos.length,
        totalCobrosUsd: totalCobrosUsd,
        totalPagosUsd: totalPagosUsd
    };
}

function aplicarCambioFechaItemFinanzaCore(params) {
    if (!APP_STATE || !APP_STATE.finanzas || !params) return null;
    var origen = params.origen;
    var id = params.id;
    var cuotaNum = params.cuotaNum;
    var mesClaveOrigen = params.mesClaveOrigen || '';
    var esRecurrente = !!params.esRecurrente;
    var nuevaFecha = params.nuevaFecha;
    var alcance = params.alcance || 'solo_mes';

    if (!nuevaFecha || !/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) return null;

    var partes = nuevaFecha.split('-');
    var nuevoAnio = parseInt(partes[0], 10);
    var nuevoMes = parseInt(partes[1], 10) - 1;
    var nuevoDia = parseInt(partes[2], 10);
    var mesDestinoClave = nuevaFecha.slice(0, 7);
    var now = Date.now();
    var tituloMovido = 'Movimiento';

    function mutarRecurrenteOFijo(item) {
        if (esRecurrente) {
            if (alcance === 'siempre') {
                item.dia = nuevoDia;
                if (item.excepcionesMes && mesClaveOrigen) {
                    delete item.excepcionesMes[mesClaveOrigen];
                }
            } else {
                if (!item.excepcionesMes || typeof item.excepcionesMes !== 'object') {
                    item.excepcionesMes = {};
                }
                var claveRef = mesClaveOrigen || mesDestinoClave;
                var totalDiasDest = new Date(nuevoAnio, nuevoMes + 1, 0).getDate();
                var diaOriginalClamped = Math.min(Math.max(1, parseInt(item.dia, 10) || 15), totalDiasDest);
                if (mesDestinoClave === claveRef && nuevoDia === diaOriginalClamped) {
                    delete item.excepcionesMes[claveRef];
                } else {
                    item.excepcionesMes[claveRef] = nuevaFecha;
                }
            }
        } else {
            item.fecha = nuevaFecha;
            item.dia = nuevoDia;
        }
        item.fechaActualizacion = now;
    }

    if (origen === 'ingreso') {
        var ing = (APP_STATE.finanzas.ingresos || []).find(function(x) { return x.id === id; });
        if (!ing) return null;
        tituloMovido = ing.fuente || ing.concepto || ing.nombre || 'Cobro';
        mutarRecurrenteOFijo(ing);

        if (ing.ventaId && ing.cuotaId && APP_STATE.inventario && Array.isArray(APP_STATE.inventario.ventas)) {
            var vObj = APP_STATE.inventario.ventas.find(function(v) { return v.id === ing.ventaId; });
            if (vObj && Array.isArray(vObj.cuotas)) {
                var cObj = vObj.cuotas.find(function(c) { return c.id === ing.cuotaId; });
                if (cObj) {
                    cObj.fecha = nuevaFecha;
                    cObj.dia = nuevoDia;
                }
            }
        }
    } else if (origen === 'gasto') {
        var gas = (APP_STATE.finanzas.gastos || []).find(function(x) { return x.id === id; });
        if (!gas) return null;
        tituloMovido = gas.concepto || 'Pago';
        mutarRecurrenteOFijo(gas);
    } else if (origen === 'deuda_cuota') {
        var deu = (APP_STATE.finanzas.deudas || []).find(function(x) { return x.id === id; });
        if (!deu) return null;
        normalizarDeuda(deu);
        var cuotaTarget = (deu.cuotas || []).find(function(c) { return String(c.num) === String(cuotaNum); });
        if (!cuotaTarget) return null;
        cuotaTarget.fecha = nuevaFecha;
        cuotaTarget.reprogramada = true;
        if (Number(deu.cuotasTotal) === 1 || Number(cuotaNum) === 1) {
            deu.dia = nuevoDia;
        }
        deu.fechaActualizacion = now;
        tituloMovido = deu.nombre + ' · Cuota #' + cuotaNum;
    } else {
        return null;
    }

    return tituloMovido;
}

function ejecutarMoverFechaFinanza() {
    var origen = document.getElementById('mover-fin-origen').value;
    var id = document.getElementById('mover-fin-id').value;
    var cuotaNum = document.getElementById('mover-fin-cuota-num').value;
    var mesClaveOrigen = document.getElementById('mover-fin-mes-clave').value;
    var esRecurrente = document.getElementById('mover-fin-es-recurrente').value === '1';
    var nuevaFecha = document.getElementById('mover-fin-nueva-fecha').value;

    if (!nuevaFecha || !/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) {
        alert("Selecciona una nueva fecha válida.");
        return;
    }

    var radioAlc = document.querySelector('input[name="mover-fin-alcance"]:checked');
    var alcance = radioAlc ? radioAlc.value : 'solo_mes';

    var tituloMovido = aplicarCambioFechaItemFinanzaCore({
        origen: origen,
        id: id,
        cuotaNum: cuotaNum,
        mesClaveOrigen: mesClaveOrigen,
        esRecurrente: esRecurrente,
        nuevaFecha: nuevaFecha,
        alcance: alcance
    });
    if (!tituloMovido) return;

    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.calUltimoMovimiento = {
        titulo: tituloMovido,
        destinoFecha: nuevaFecha
    };

    MonarcaDB.save(APP_STATE);
    cerrarModalMoverFechaFinanza();
    renderizarFinanzas(APP_STATE.finanzas);
    if (typeof renderizarVendidosInventario === 'function') renderizarVendidosInventario();
}

function renderizarBannerAlertaRetrasosFinanzas(fin, infoPrecalc) {
    var cont = document.getElementById('finanzas-alerta-retrasados-banner');
    if (!cont) return;

    var info = infoPrecalc || obtenerRetrasosFinanzas(fin);
    if (!info || info.totalCount === 0) {
        cont.style.display = 'none';
        cont.innerHTML = '';
        return;
    }

    var partesResumen = [];
    if (info.countPagos > 0) {
        partesResumen.push('<strong>' + info.countPagos + ' ' + (info.countPagos === 1 ? 'pago' : 'pagos') + '</strong> (-$' + info.totalPagosUsd.toFixed(2) + ')');
    }
    if (info.countCobros > 0) {
        partesResumen.push('<strong>' + info.countCobros + ' ' + (info.countCobros === 1 ? 'cobro' : 'cobros') + '</strong> (+$' + info.totalCobrosUsd.toFixed(2) + ')');
    }

    var previewLista = info.todos.slice(0, 3).map(function(r) {
        return escaparHTML(r.titulo) + ' (' + r.diasRetraso + 'd)';
    }).join(' · ');
    if (info.totalCount > 3) {
        previewLista += ' y ' + (info.totalCount - 3) + ' más';
    }

    cont.style.display = 'block';
    cont.innerHTML = `
        <div class="fin-retrasos-banner">
            <div class="fin-retrasos-banner-top">
                <div style="min-width: 0; flex: 1;">
                    <div style="font-size: 13px; font-weight: 800; color: #fecaca; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span>🚨 ALERTA DE RETRASOS (${info.totalCount})</span>
                        <span style="font-size: 11px; font-weight: 700; color: #fca5a5;">· ${partesResumen.join(' y ')}</span>
                    </div>
                    <div style="font-size: 11.5px; color: #e2e8f0; margin-top: 3px; line-height: 1.4;">
                        ${previewLista}
                    </div>
                </div>
                <div class="fin-retrasos-actions">
                    <button type="button" id="btn-abrir-reprogramar-retrasados" class="fin-retrasos-btn-main" onclick="abrirModalReprogramarRetrasadosFinanzas('todos')">
                        📅 Reprogramar Todos y c/u (${info.totalCount})
                    </button>
                    ${info.countPagos > 0 && info.countCobros > 0 ? `
                        <button type="button" class="fin-retrasos-btn-pill" onclick="abrirModalReprogramarRetrasadosFinanzas('pagos')">💳 Pagos (${info.countPagos})</button>
                        <button type="button" class="fin-retrasos-btn-pill" onclick="abrirModalReprogramarRetrasadosFinanzas('cobros')">💰 Cobros (${info.countCobros})</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function notificarToastSiHayRetrasosFinanzas() {
    var info = obtenerRetrasosFinanzas();
    if (!info || info.totalCount === 0) {
        window._ULTIMO_AVISO_RETRASOS_FIN_SIG = '';
        return;
    }
    var sig = info.todos.map(function(r) { return r.uid + '@' + r.fechaISO; }).join('|');
    if (window._ULTIMO_AVISO_RETRASOS_FIN_SIG === sig) return;
    window._ULTIMO_AVISO_RETRASOS_FIN_SIG = sig;

    var partes = [];
    if (info.countPagos > 0) partes.push(info.countPagos + ' pago(s)');
    if (info.countCobros > 0) partes.push(info.countCobros + ' cobro(s)');
    var msg = partes.join(' y ') + ' retrasados · Toca para reprogramar';

    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca(msg, '🚨');
    }
}

var REPROG_RETRASOS_FILTRO = 'todos';
var REPROG_RETRASOS_SELECCIONADOS = {};
var REPROG_RETRASOS_FECHAS_DRAFT = {};
var REPROG_RETRASOS_FECHAS_EDITADAS = {};

function sumarDiasFechaISOFinanzas(baseISO, diasDelta) {
    var d = new Date((baseISO || obtenerHoyISOFinanzas()).slice(0, 10) + 'T12:00:00');
    d.setDate(d.getDate() + diasDelta);
    return obtenerClaveFechaISOFinanzas(d.getFullYear(), d.getMonth(), d.getDate());
}

function abrirModalReprogramarRetrasadosFinanzas(filtroInicial) {
    var modal = document.getElementById('modal-reprogramar-retrasados-finanzas');
    if (!modal) return;

    var info = obtenerRetrasosFinanzas();
    REPROG_RETRASOS_FILTRO = (filtroInicial === 'pagos' || filtroInicial === 'cobros') ? filtroInicial : 'todos';
    REPROG_RETRASOS_SELECCIONADOS = {};
    REPROG_RETRASOS_FECHAS_DRAFT = {};
    REPROG_RETRASOS_FECHAS_EDITADAS = {};

    var hoyISO = info.hoyISO || obtenerHoyISOFinanzas();
    (info.todos || []).forEach(function(item) {
        REPROG_RETRASOS_SELECCIONADOS[item.uid] = true;
        REPROG_RETRASOS_FECHAS_DRAFT[item.uid] = hoyISO;
    });

    var inLote = document.getElementById('reprog-lote-fecha');
    if (inLote) inLote.value = hoyISO;

    var contAtajos = document.getElementById('reprog-lote-atajos');
    if (contAtajos) {
        var hoyDate = new Date(hoyISO + 'T12:00:00');
        var ultDiaMes = new Date(hoyDate.getFullYear(), hoyDate.getMonth() + 1, 0).getDate();
        var proxMes = new Date(hoyDate.getFullYear(), hoyDate.getMonth() + 1, 1);
        var atajos = [
            { lbl: 'Hoy', iso: hoyISO },
            { lbl: 'Mañana (+1d)', iso: sumarDiasFechaISOFinanzas(hoyISO, 1) },
            { lbl: '+3 días', iso: sumarDiasFechaISOFinanzas(hoyISO, 3) },
            { lbl: '+7 días', iso: sumarDiasFechaISOFinanzas(hoyISO, 7) },
            { lbl: 'Último (' + ultDiaMes + ')', iso: obtenerClaveFechaISOFinanzas(hoyDate.getFullYear(), hoyDate.getMonth(), ultDiaMes) },
            { lbl: 'Día 1 próx. mes', iso: obtenerClaveFechaISOFinanzas(proxMes.getFullYear(), proxMes.getMonth(), 1) }
        ];
        contAtajos.innerHTML = atajos.map(function(a) {
            return '<button type="button" class="btn-atajo-fecha-fin" onclick="seleccionarAtajoLoteRetrasosFin(\'' + a.iso + '\')">' + a.lbl + '</button>';
        }).join('');
    }

    renderizarContenidoModalReprogramarRetrasosFinanzas();
    modal.style.display = 'flex';
}

function cerrarModalReprogramarRetrasadosFinanzas() {
    var modal = document.getElementById('modal-reprogramar-retrasados-finanzas');
    if (modal) modal.style.display = 'none';
}

function refrescarModalReprogramarSiAbiertoFinanzas() {
    var modal = document.getElementById('modal-reprogramar-retrasados-finanzas');
    if (modal && modal.style.display === 'flex') {
        renderizarContenidoModalReprogramarRetrasosFinanzas();
    }
}

function cambiarFiltroModalRetrasosFinanzas(filtro) {
    REPROG_RETRASOS_FILTRO = filtro || 'todos';
    renderizarContenidoModalReprogramarRetrasosFinanzas();
}

function seleccionarAtajoLoteRetrasosFin(fechaISO) {
    var inLote = document.getElementById('reprog-lote-fecha');
    if (inLote && fechaISO) inLote.value = fechaISO;
}

function toggleSeleccionTodosRetrasadosFinanzas(checked) {
    var info = obtenerRetrasosFinanzas();
    var lista = obtenerListaFiltradaRetrasosFinanzas(info);
    lista.forEach(function(item) {
        REPROG_RETRASOS_SELECCIONADOS[item.uid] = !!checked;
    });
    renderizarContenidoModalReprogramarRetrasosFinanzas();
}

function alCambiarCheckItemRetrasoFinanzas(uid, checked) {
    REPROG_RETRASOS_SELECCIONADOS[uid] = !!checked;
    actualizarEstadoBotonLoteRetrasosFinanzas();
}

function alCambiarFechaItemRetrasoFinanzas(uid, valor) {
    if (valor) {
        REPROG_RETRASOS_FECHAS_DRAFT[uid] = valor;
        REPROG_RETRASOS_FECHAS_EDITADAS[uid] = true;
    }
    actualizarEstadoBotonLoteRetrasosFinanzas();
}

function obtenerListaFiltradaRetrasosFinanzas(info) {
    if (!info) return [];
    if (REPROG_RETRASOS_FILTRO === 'pagos') return info.pagos || [];
    if (REPROG_RETRASOS_FILTRO === 'cobros') return info.cobros || [];
    return info.todos || [];
}

function actualizarEstadoBotonLoteRetrasosFinanzas() {
    var info = obtenerRetrasosFinanzas();
    var lista = obtenerListaFiltradaRetrasosFinanzas(info);
    var seleccionados = lista.filter(function(x) { return REPROG_RETRASOS_SELECCIONADOS[x.uid] !== false; }).length;
    var editadasCount = lista.filter(function(x) { return !!REPROG_RETRASOS_FECHAS_EDITADAS[x.uid]; }).length;
    var chkAll = document.getElementById('reprog-lote-select-all');
    var lblAll = document.getElementById('reprog-lote-select-label');
    var btnLote = document.getElementById('btn-reprog-aplicar-todos');
    var btnInd = document.getElementById('btn-reprog-guardar-individuales');

    if (chkAll) chkAll.checked = (lista.length > 0 && seleccionados === lista.length);
    if (lblAll) lblAll.textContent = 'Seleccionar todos (' + seleccionados + '/' + lista.length + ')';
    if (btnLote) {
        btnLote.textContent = '🚀 Reprogramar Marcados (' + seleccionados + ')';
        btnLote.disabled = seleccionados === 0;
    }
    if (btnInd) {
        btnInd.textContent = editadasCount > 0
            ? ('💾 Guardar ' + editadasCount + ' Fecha' + (editadasCount === 1 ? '' : 's') + ' Editada' + (editadasCount === 1 ? '' : 's') + ' (c/u)')
            : '💾 Guardar Fechas Editadas (c/u)';
    }
}

function renderizarContenidoModalReprogramarRetrasosFinanzas() {
    var info = obtenerRetrasosFinanzas();
    var hoyISO = info.hoyISO || obtenerHoyISOFinanzas();
    var resEl = document.getElementById('reprog-ret-resumen');
    var fltEl = document.getElementById('reprog-ret-filtros');
    var listEl = document.getElementById('reprog-ret-lista');
    var loteBox = document.getElementById('reprog-lote-box');
    var btnGuardarInd = document.getElementById('btn-reprog-guardar-individuales');
    if (!listEl) return;

    if (resEl) {
        if (info.totalCount === 0) {
            resEl.style.background = 'rgba(16, 185, 129, 0.12)';
            resEl.style.borderColor = 'rgba(52, 211, 153, 0.35)';
            resEl.style.color = '#a7f3d0';
            resEl.innerHTML = '✅ <strong>¡Todo al día!</strong> Todos tus pagos y cobros están reprogramados o liquidados.';
        } else {
            resEl.style.background = 'rgba(239, 68, 68, 0.1)';
            resEl.style.borderColor = 'rgba(239, 68, 68, 0.28)';
            resEl.style.color = '#fecaca';
            resEl.innerHTML = 'Tienes <strong>' + info.countPagos + ' pago' + (info.countPagos === 1 ? '' : 's') + ' retrasado' + (info.countPagos === 1 ? '' : 's') +
                '</strong> (-$' + info.totalPagosUsd.toFixed(2) + ') y <strong>' + info.countCobros + ' cobro' + (info.countCobros === 1 ? '' : 's') +
                ' retrasado' + (info.countCobros === 1 ? '' : 's') + '</strong> (+$' + info.totalCobrosUsd.toFixed(2) + '). Reprogramalos todos juntos o pon una fecha distinta a cada uno.';
        }
    }

    if (fltEl) {
        var filtros = [
            { id: 'todos', lbl: '📋 Todos (' + info.totalCount + ')' },
            { id: 'pagos', lbl: '💳 Pagos (' + info.countPagos + ')' },
            { id: 'cobros', lbl: '💰 Cobros (' + info.countCobros + ')' }
        ];
        fltEl.innerHTML = filtros.map(function(fl) {
            return '<button type="button" class="trainer-filter-pill ' + (REPROG_RETRASOS_FILTRO === fl.id ? 'active' : '') +
                '" onclick="cambiarFiltroModalRetrasosFinanzas(\'' + fl.id + '\')">' + fl.lbl + '</button>';
        }).join('');
    }

    var lista = obtenerListaFiltradaRetrasosFinanzas(info);
    if (loteBox) loteBox.style.display = lista.length > 0 ? 'block' : 'none';
    if (btnGuardarInd) btnGuardarInd.style.display = lista.length > 0 ? 'inline-flex' : 'none';

    if (lista.length === 0) {
        listEl.innerHTML = '<div class="finanzas-empty-hint" style="margin: 0; padding: 26px 14px;">✅ Sin retrasos en esta categoría.</div>';
        actualizarEstadoBotonLoteRetrasosFinanzas();
        return;
    }

    var html = '';
    lista.forEach(function(item) {
        if (REPROG_RETRASOS_SELECCIONADOS[item.uid] === undefined) {
            REPROG_RETRASOS_SELECCIONADOS[item.uid] = true;
        }
        if (!REPROG_RETRASOS_FECHAS_DRAFT[item.uid]) {
            REPROG_RETRASOS_FECHAS_DRAFT[item.uid] = hoyISO;
        }
        var checked = REPROG_RETRASOS_SELECCIONADOS[item.uid] !== false;
        var draftFecha = REPROG_RETRASOS_FECHAS_DRAFT[item.uid];
        var safeUidAttr = String(item.uid).replace(/'/g, "\\'");
        var safeDomId = String(item.uid).replace(/[^a-zA-Z0-9_-]/g, '_');
        var esCobro = item.clase === 'cobro';
        var tipoBadge = esCobro
            ? '<span style="font-size:10px; font-weight:800; padding:2px 7px; border-radius:999px; background:rgba(245,158,11,0.18); color:#fbbf24; border:1px solid rgba(245,158,11,0.35);">💰 COBRO</span>'
            : '<span style="font-size:10px; font-weight:800; padding:2px 7px; border-radius:999px; background:rgba(239,68,68,0.18); color:#f87171; border:1px solid rgba(239,68,68,0.35);">💳 PAGO</span>';
        var btnLiquidar = '<button type="button" class="fin-reprog-btn-settle" onclick="liquidarDesdeRetrasosFinanzas(\'' + safeUidAttr + '\')">' +
            (esCobro ? '💰 Cobrar' : '💳 Pagar') + '</button>';

        html += `
        <div class="fin-reprog-item-card ${esCobro ? 'is-cobro' : ''}">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                <label style="display: flex; align-items: flex-start; gap: 8px; flex: 1; min-width: 0; cursor: pointer;">
                    <input type="checkbox" ${checked ? 'checked' : ''} onchange="alCambiarCheckItemRetrasoFinanzas('${safeUidAttr}', this.checked)" style="width: 16px; height: 16px; margin-top: 2px; flex-shrink: 0; accent-color: #38bdf8;">
                    <div style="min-width: 0; flex: 1;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 3px;">
                            ${tipoBadge}
                            <span class="cuota-badge-vencida">🚨 Hace ${item.diasRetraso}d · ${formatearFechaCorta(item.fechaISO)}</span>
                        </div>
                        <div style="font-size: 13px; font-weight: 800; color: #f8fafc; word-break: break-word;">${escaparHTML(item.titulo)}</div>
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 1px;">${escaparHTML(item.categoriaTxt)}</div>
                    </div>
                </label>
                <div style="font-size: 14px; font-weight: 800; color: ${esCobro ? '#34d399' : '#f87171'}; flex-shrink: 0;">
                    ${esCobro ? '+$' : '-$'}${item.monto.toFixed(2)}
                </div>
            </div>
            <div class="fin-reprog-controls-row">
                <input type="date" id="reprog-fecha-${safeDomId}" data-reprog-uid="${escaparHTML(item.uid)}" class="fin-reprog-date-input" value="${draftFecha}" oninput="alCambiarFechaItemRetrasoFinanzas('${safeUidAttr}', this.value)" onchange="alCambiarFechaItemRetrasoFinanzas('${safeUidAttr}', this.value)">
                <button type="button" class="fin-reprog-btn-single" onclick="reprogramarItemIndividualRetrasosFinanzas('${safeUidAttr}')">📅 Mover</button>
                ${btnLiquidar}
            </div>
        </div>
        `;
    });

    listEl.innerHTML = html;
    actualizarEstadoBotonLoteRetrasosFinanzas();
}

function ejecutarReprogramacionMasivaFinanzas() {
    var inLote = document.getElementById('reprog-lote-fecha');
    var nuevaFecha = inLote ? inLote.value : '';
    if (!nuevaFecha || !/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) {
        alert("Selecciona una fecha válida para reprogramar en lote.");
        return;
    }

    var info = obtenerRetrasosFinanzas();
    var lista = obtenerListaFiltradaRetrasosFinanzas(info).filter(function(item) {
        return REPROG_RETRASOS_SELECCIONADOS[item.uid] !== false;
    });
    if (lista.length === 0) return;

    var movidos = 0;
    lista.forEach(function(item) {
        var res = aplicarCambioFechaItemFinanzaCore({
            origen: item.origen,
            id: item.id,
            cuotaNum: item.cuotaNum,
            mesClaveOrigen: item.mesOrigenRegla,
            esRecurrente: item.esRecurrente,
            nuevaFecha: nuevaFecha,
            alcance: 'solo_mes'
        });
        if (res) {
            movidos++;
            REPROG_RETRASOS_FECHAS_DRAFT[item.uid] = nuevaFecha;
            delete REPROG_RETRASOS_FECHAS_EDITADAS[item.uid];
        }
    });

    if (movidos > 0) {
        MonarcaDB.save(APP_STATE);
        renderizarFinanzas(APP_STATE.finanzas);
        if (typeof renderizarVendidosInventario === 'function') renderizarVendidosInventario();
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca(movidos + ' movimientos reprogramados al ' + formatearFechaCorta(nuevaFecha), '📅');
        }
        var postInfo = obtenerRetrasosFinanzas();
        if (postInfo.totalCount === 0) {
            cerrarModalReprogramarRetrasadosFinanzas();
        }
    }
}

function reprogramarItemIndividualRetrasosFinanzas(uid) {
    var info = obtenerRetrasosFinanzas();
    var item = (info.todos || []).find(function(x) { return x.uid === uid; });
    if (!item) return;

    var safeDomId = String(uid).replace(/[^a-zA-Z0-9_-]/g, '_');
    var inFecha = document.getElementById('reprog-fecha-' + safeDomId);
    var nuevaFecha = inFecha ? inFecha.value : (REPROG_RETRASOS_FECHAS_DRAFT[uid] || '');
    if (!nuevaFecha || !/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) {
        alert("Selecciona una fecha válida para este movimiento.");
        return;
    }

    var titulo = aplicarCambioFechaItemFinanzaCore({
        origen: item.origen,
        id: item.id,
        cuotaNum: item.cuotaNum,
        mesClaveOrigen: item.mesOrigenRegla,
        esRecurrente: item.esRecurrente,
        nuevaFecha: nuevaFecha,
        alcance: 'solo_mes'
    });
    if (!titulo) return;

    delete REPROG_RETRASOS_FECHAS_EDITADAS[uid];
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.calUltimoMovimiento = { titulo: titulo, destinoFecha: nuevaFecha };

    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
    if (typeof renderizarVendidosInventario === 'function') renderizarVendidosInventario();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('"' + titulo + '" movido al ' + formatearFechaCorta(nuevaFecha), '📅');
    }
}

function guardarFechasIndividualesRetrasosFinanzas() {
    var info = obtenerRetrasosFinanzas();
    var hoyISO = info.hoyISO || obtenerHoyISOFinanzas();
    var lista = obtenerListaFiltradaRetrasosFinanzas(info);
    if (lista.length === 0) return;

    var movidos = 0;
    lista.forEach(function(item) {
        var safeDomId = String(item.uid).replace(/[^a-zA-Z0-9_-]/g, '_');
        var inFecha = document.getElementById('reprog-fecha-' + safeDomId);
        var nuevaFecha = inFecha ? inFecha.value : (REPROG_RETRASOS_FECHAS_DRAFT[item.uid] || '');
        if (!nuevaFecha || !/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) return;

        var fueEditado = !!REPROG_RETRASOS_FECHAS_EDITADAS[item.uid] || (nuevaFecha !== hoyISO && nuevaFecha !== item.fechaISO);
        if (!fueEditado) return;

        var res = aplicarCambioFechaItemFinanzaCore({
            origen: item.origen,
            id: item.id,
            cuotaNum: item.cuotaNum,
            mesClaveOrigen: item.mesOrigenRegla,
            esRecurrente: item.esRecurrente,
            nuevaFecha: nuevaFecha,
            alcance: 'solo_mes'
        });
        if (res) {
            movidos++;
            delete REPROG_RETRASOS_FECHAS_EDITADAS[item.uid];
        }
    });

    if (movidos === 0) {
        alert("Cambia al menos una fecha en las tarjetas de abajo (o usa '📅 Mover' en la fila / '🚀 Reprogramar Marcados' arriba).");
        return;
    }

    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
    if (typeof renderizarVendidosInventario === 'function') renderizarVendidosInventario();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca(movidos + ' fecha(s) individual(es) guardada(s)', '💾');
    }
    var postInfo = obtenerRetrasosFinanzas();
    if (postInfo.totalCount === 0) {
        cerrarModalReprogramarRetrasadosFinanzas();
    }
}

function liquidarDesdeRetrasosFinanzas(uid) {
    var info = obtenerRetrasosFinanzas();
    var item = (info.todos || []).find(function(x) { return x.uid === uid; });
    if (!item) return;

    if (item.origen === 'ingreso' && typeof cobrarIngresoUI === 'function') {
        cobrarIngresoUI(item.id);
    } else if (item.origen === 'gasto' && typeof pagarGastoUI === 'function') {
        pagarGastoUI(item.id);
    } else if (item.origen === 'deuda_cuota' && typeof pagarCuotaDeudaUI === 'function') {
        pagarCuotaDeudaUI(item.id, parseInt(item.cuotaNum, 10) || 1);
    }
}

function obtenerAlertasFinanzasRetrasadasActivas() {
    if (!window.APP_STATE || !APP_STATE.finanzas) return [];
    var info = obtenerRetrasosFinanzas(APP_STATE.finanzas);
    if (!info || info.totalCount === 0) return [];

    var alertas = [];
    if (info.countPagos > 0) {
        var listaP = info.pagos.slice(0, 3).map(function(p) {
            return p.titulo + ' (-$' + p.monto.toFixed(2) + ', ' + p.diasRetraso + 'd)';
        }).join(' · ');
        alertas.push({
            id: 'alerta-fin-retrasos-pagos',
            tipo: 'urgente',
            icono: '🚨',
            badge: 'Pagos Retrasados (' + info.countPagos + ')',
            color: '#ef4444',
            titulo: info.countPagos + ' ' + (info.countPagos === 1 ? 'Pago Retrasado' : 'Pagos Retrasados') + ' (-$' + info.totalPagosUsd.toFixed(2) + ')',
            metaLinea: '📅 Más antiguo: ' + info.pagos[0].fechaISO + ' (' + info.pagos[0].diasRetraso + 'd de atraso)',
            descripcion: listaP + (info.countPagos > 3 ? ' y ' + (info.countPagos - 3) + ' más' : ''),
            acciones: [
                {
                    tipo: 'primary',
                    texto: '📅 Reprogramar Pagos',
                    fn: "cerrarCentroNotificaciones(); if(typeof cambiarVista==='function') cambiarVista('vista-finanzas'); setTimeout(function(){ if(typeof abrirModalReprogramarRetrasadosFinanzas==='function') abrirModalReprogramarRetrasadosFinanzas('pagos'); }, 60);"
                }
            ]
        });
    }

    if (info.countCobros > 0) {
        var listaC = info.cobros.slice(0, 3).map(function(c) {
            return c.titulo + ' (+$' + c.monto.toFixed(2) + ', ' + c.diasRetraso + 'd)';
        }).join(' · ');
        alertas.push({
            id: 'alerta-fin-retrasos-cobros',
            tipo: 'urgente',
            icono: '⚠️',
            badge: 'Cobros Retrasados (' + info.countCobros + ')',
            color: '#f59e0b',
            titulo: info.countCobros + ' ' + (info.countCobros === 1 ? 'Cobro Retrasado' : 'Cobros Retrasados') + ' (+$' + info.totalCobrosUsd.toFixed(2) + ')',
            metaLinea: '📅 Más antiguo: ' + info.cobros[0].fechaISO + ' (' + info.cobros[0].diasRetraso + 'd de atraso)',
            descripcion: listaC + (info.countCobros > 3 ? ' y ' + (info.countCobros - 3) + ' más' : ''),
            acciones: [
                {
                    tipo: 'primary',
                    texto: '📅 Reprogramar Cobros',
                    fn: "cerrarCentroNotificaciones(); if(typeof cambiarVista==='function') cambiarVista('vista-finanzas'); setTimeout(function(){ if(typeof abrirModalReprogramarRetrasadosFinanzas==='function') abrirModalReprogramarRetrasadosFinanzas('cobros'); }, 60);"
                }
            ]
        });
    }

    return alertas;
}

if (typeof window !== 'undefined') {
    window.obtenerRetrasosFinanzas = obtenerRetrasosFinanzas;
    window.obtenerAlertasFinanzasRetrasadasActivas = obtenerAlertasFinanzasRetrasadasActivas;
    window.abrirModalReprogramarRetrasadosFinanzas = abrirModalReprogramarRetrasadosFinanzas;
    window.cerrarModalReprogramarRetrasadosFinanzas = cerrarModalReprogramarRetrasadosFinanzas;
    window.cambiarFiltroModalRetrasosFinanzas = cambiarFiltroModalRetrasosFinanzas;
    window.seleccionarAtajoLoteRetrasosFin = seleccionarAtajoLoteRetrasosFin;
    window.toggleSeleccionTodosRetrasadosFinanzas = toggleSeleccionTodosRetrasadosFinanzas;
    window.alCambiarCheckItemRetrasoFinanzas = alCambiarCheckItemRetrasoFinanzas;
    window.alCambiarFechaItemRetrasoFinanzas = alCambiarFechaItemRetrasoFinanzas;
    window.ejecutarReprogramacionMasivaFinanzas = ejecutarReprogramacionMasivaFinanzas;
    window.reprogramarItemIndividualRetrasosFinanzas = reprogramarItemIndividualRetrasosFinanzas;
    window.guardarFechasIndividualesRetrasosFinanzas = guardarFechasIndividualesRetrasosFinanzas;
    window.liquidarDesdeRetrasosFinanzas = liquidarDesdeRetrasosFinanzas;
}

// ==========================================================================
// TASAS OFICIALES DEL DÍA (BCV USD & EURO) · DolarAPI VE CON ACTUALIZACIÓN DIARIA
// ==========================================================================

var MONARCA_TASAS_BCV_API_URL = 'https://ve.dolarapi.com/v1/cotizaciones';
var MONARCA_TASAS_DOLARES_API_URL = 'https://ve.dolarapi.com/v1/dolares';
var MONARCA_TASAS_BCV_STORAGE_KEY = 'MONARCA_TASAS_BCV_V1';
var MONARCA_TASAS_REFRESH_MAX_AGE_MS = 4 * 60 * 60 * 1000;
var _monarcaTasasTimerId = null;

function obtenerFechaClaveHoyTasas() {
    if (typeof obtenerClaveFechaLocal === 'function') {
        return obtenerClaveFechaLocal();
    }
    var h = new Date();
    return h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
}

function leerCacheTasasBCV() {
    try {
        var raw = localStorage.getItem(MONARCA_TASAS_BCV_STORAGE_KEY);
        if (!raw) return null;
        var obj = JSON.parse(raw);
        if (obj && typeof obj === 'object') return obj;
    } catch (e) {}
    return null;
}

function guardarCacheTasasBCV(payload) {
    try {
        localStorage.setItem(MONARCA_TASAS_BCV_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
}

function extraerTasasDeCotizaciones(data, dolaresData) {
    var cotArr = Array.isArray(data) ? data : [];
    var dolArr = Array.isArray(dolaresData) ? dolaresData : [];

    var usdItem = cotArr.find(function(x) {
        return x && String(x.moneda).toUpperCase() === 'USD' && String(x.fuente).toLowerCase() === 'oficial';
    }) || dolArr.find(function(x) {
        return x && String(x.moneda).toUpperCase() === 'USD' && String(x.fuente).toLowerCase() === 'oficial';
    }) || cotArr.find(function(x) {
        return x && String(x.moneda).toUpperCase() === 'USD';
    });

    var eurItem = cotArr.find(function(x) {
        return x && String(x.moneda).toUpperCase() === 'EUR' && String(x.fuente).toLowerCase() === 'oficial';
    }) || cotArr.find(function(x) {
        return x && String(x.moneda).toUpperCase() === 'EUR';
    });

    var parItem = dolArr.find(function(x) {
        return x && String(x.fuente).toLowerCase() === 'paralelo';
    }) || cotArr.find(function(x) {
        return x && String(x.fuente).toLowerCase() === 'paralelo';
    });

    var usdVal = usdItem ? Number(usdItem.promedio || usdItem.venta || usdItem.compra) : NaN;
    var eurVal = eurItem ? Number(eurItem.promedio || eurItem.venta || eurItem.compra) : NaN;
    var parVal = parItem ? Number(parItem.promedio || parItem.venta || parItem.compra) : NaN;

    if ((isNaN(usdVal) || usdVal <= 0) && (isNaN(eurVal) || eurVal <= 0) && (isNaN(parVal) || parVal <= 0)) {
        return null;
    }

    return {
        usd: (!isNaN(usdVal) && usdVal > 0) ? usdVal : null,
        eur: (!isNaN(eurVal) && eurVal > 0) ? eurVal : null,
        paralelo: (!isNaN(parVal) && parVal > 0) ? parVal : null,
        fechaApiUsd: usdItem ? (usdItem.fechaActualizacion || '') : '',
        fechaApiEur: eurItem ? (eurItem.fechaActualizacion || '') : '',
        fechaApiParalelo: parItem ? (parItem.fechaActualizacion || '') : ''
    };
}

function formatearTasaBsDisplay(valor, decimales) {
    var num = Number(valor);
    if (isNaN(num) || num <= 0) return 'Bs. --';
    var dec = typeof decimales === 'number' ? decimales : 2;
    try {
        return 'Bs. ' + num.toLocaleString('es-VE', {
            minimumFractionDigits: dec,
            maximumFractionDigits: dec
        });
    } catch (e) {
        return 'Bs. ' + num.toFixed(dec);
    }
}

function formatearFechaApiCorta(isoStr) {
    if (!isoStr || typeof isoStr !== 'string') return '';
    var ymd = isoStr.slice(0, 10);
    var p = ymd.split('-');
    if (p.length === 3) {
        return p[2] + '/' + p[1] + '/' + p[0];
    }
    return ymd;
}

function convertirMontoConTasas() {
    var inMonto = document.getElementById('finanzas-tasa-calc-monto');
    var selOrigen = document.getElementById('finanzas-tasa-calc-origen');
    var outEl = document.getElementById('finanzas-tasa-calc-resultado');
    if (!outEl) return;

    var cache = leerCacheTasasBCV();
    var usd = cache && Number(cache.usd) > 0 ? Number(cache.usd) : 0;
    var eur = cache && Number(cache.eur) > 0 ? Number(cache.eur) : 0;
    var par = cache && Number(cache.paralelo) > 0 ? Number(cache.paralelo) : 0;

    if (!usd && !eur && !par) {
        outEl.textContent = 'Esperando tasas de DolarAPI...';
        return;
    }

    var monto = inMonto ? parseFloat(inMonto.value) : 0;
    if (isNaN(monto) || monto < 0) monto = 0;
    var origen = selOrigen ? selOrigen.value : 'USD';

    if (origen === 'USD') {
        if (!usd) {
            outEl.textContent = 'Tasa BCV USD no disponible';
            return;
        }
        var bsDesdeUsd = monto * usd;
        var equivEur = eur ? (' · ≈ €' + (bsDesdeUsd / eur).toFixed(2) + ' EUR') : '';
        outEl.innerHTML = 'BCV: <strong style="color:#34d399;">' + formatearTasaBsDisplay(bsDesdeUsd, 2) + '</strong>' + equivEur;
    } else if (origen === 'PARALELO') {
        if (!par) {
            outEl.textContent = 'Tasa Paralelo no disponible';
            return;
        }
        var bsDesdePar = monto * par;
        var equivBcv = usd ? (' · ≈ $' + (bsDesdePar / usd).toFixed(2) + ' BCV') : '';
        outEl.innerHTML = 'Paralelo: <strong style="color:#fbbf24;">' + formatearTasaBsDisplay(bsDesdePar, 2) + '</strong>' + equivBcv;
    } else if (origen === 'EUR') {
        if (!eur) {
            outEl.textContent = 'Tasa Euro no disponible';
            return;
        }
        var bsDesdeEur = monto * eur;
        var equivUsd = usd ? (' · ≈ $' + (bsDesdeEur / usd).toFixed(2) + ' USD') : '';
        outEl.innerHTML = 'Equivale a <strong style="color:#7dd3fc;">' + formatearTasaBsDisplay(bsDesdeEur, 2) + '</strong>' + equivUsd;
    } else {
        var partes = [];
        if (usd) partes.push('<strong style="color:#34d399;">$' + (monto / usd).toFixed(2) + ' BCV</strong>');
        if (par) partes.push('<strong style="color:#fbbf24;">$' + (monto / par).toFixed(2) + ' Par.</strong>');
        if (eur) partes.push('<strong style="color:#7dd3fc;">€' + (monto / eur).toFixed(2) + ' EUR</strong>');
        outEl.innerHTML = 'Equivale a ' + partes.join(' · ');
    }
}

function togglePanelTasasFinanzas(forzarAbrir) {
    var card = document.getElementById('finanzas-tasas-card');
    var btn = document.getElementById('btn-toggle-panel-tasas');
    if (!card) return;
    var abrir = (forzarAbrir === true) ? true : (card.style.display === 'none' || getComputedStyle(card).display === 'none');
    card.style.display = abrir ? 'block' : 'none';
    if (btn) btn.classList.toggle('is-open', abrir);
    if (abrir) {
        try { card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    }
}
if (typeof window !== 'undefined') {
    window.togglePanelTasasFinanzas = togglePanelTasasFinanzas;
}

function renderizarTasasBCV(estadoFetch, errorMsg) {
    var valBcv = document.getElementById('finanzas-valor-tasa-bcv');
    var subBcv = document.getElementById('finanzas-sub-tasa-bcv');
    var valEur = document.getElementById('finanzas-valor-tasa-euro');
    var subEur = document.getElementById('finanzas-sub-tasa-euro');
    var valPar = document.getElementById('finanzas-valor-tasa-paralelo');
    var subPar = document.getElementById('finanzas-sub-tasa-paralelo');
    var badge = document.getElementById('finanzas-tasas-estado-badge');
    var fechaEl = document.getElementById('finanzas-tasas-fecha-actualizacion');
    var btnAct = document.getElementById('btn-actualizar-tasas-bcv');
    var miniTicker = document.getElementById('tasas-mini-ticker');
    var btnMini = document.getElementById('btn-actualizar-tasas-bcv-mini');

    var cache = leerCacheTasasBCV();
    var hoyClave = obtenerFechaClaveHoyTasas();

    if (miniTicker) {
        var bcvShort = (cache && cache.usd) ? Number(cache.usd).toFixed(2) : '--';
        var parShort = (cache && cache.paralelo) ? Number(cache.paralelo).toFixed(2) : '--';
        miniTicker.textContent = estadoFetch === 'loading'
            ? '⏳ Actualizando tasas...'
            : ('🏦 BCV ' + bcvShort + ' · ⚡ ' + parShort);
    }
    if (btnMini) {
        btnMini.disabled = (estadoFetch === 'loading');
        btnMini.textContent = (estadoFetch === 'loading') ? '⏳' : '🔄';
    }

    if (!valBcv && !valEur && !valPar && !badge) return;

    if (cache && cache.usd) {
        if (valBcv) valBcv.textContent = formatearTasaBsDisplay(cache.usd, 2);
        if (subBcv) subBcv.textContent = 'Exacta: ' + Number(cache.usd).toFixed(4) + ' Bs/$ · Oficial BCV';
    } else {
        if (valBcv) valBcv.textContent = 'Bs. --';
        if (subBcv) subBcv.textContent = estadoFetch === 'loading' ? 'Consultando ve.dolarapi.com...' : 'Sin datos disponibles';
    }

    if (cache && cache.eur) {
        if (valEur) valEur.textContent = formatearTasaBsDisplay(cache.eur, 2);
        if (subEur) subEur.textContent = 'Exacta: ' + Number(cache.eur).toFixed(4) + ' Bs/€ · Oficial BCV';
    } else {
        if (valEur) valEur.textContent = 'Bs. --';
        if (subEur) subEur.textContent = estadoFetch === 'loading' ? 'Consultando ve.dolarapi.com...' : 'Sin datos disponibles';
    }

    if (cache && cache.paralelo) {
        if (valPar) valPar.textContent = formatearTasaBsDisplay(cache.paralelo, 2);
        if (subPar) subPar.textContent = 'Exacta: ' + Number(cache.paralelo).toFixed(2) + ' Bs/$ · Mercado/USDT';
    } else {
        if (valPar) valPar.textContent = 'Bs. --';
        if (subPar) subPar.textContent = estadoFetch === 'loading' ? 'Consultando ve.dolarapi.com...' : 'Sin datos disponibles';
    }

    if (badge) {
        badge.classList.remove('is-ok', 'is-warn');
        if (estadoFetch === 'loading') {
            badge.textContent = '⏳ Actualizando...';
        } else if (cache && errorMsg) {
            badge.textContent = '⚠️ Offline · Caché guardado';
            badge.classList.add('is-warn');
        } else if (cache && cache.fechaConsultaLocal === hoyClave) {
            badge.textContent = '✓ Actualizado hoy';
            badge.classList.add('is-ok');
        } else if (cache) {
            badge.textContent = '✓ Caché (' + (cache.fechaConsultaLocal || '') + ')';
        } else if (errorMsg) {
            badge.textContent = '⚠️ Error al conectar';
            badge.classList.add('is-warn');
        } else {
            badge.textContent = 'Pendiente';
        }
    }

    if (fechaEl) {
        if (cache) {
            var fechaApi = formatearFechaApiCorta(cache.fechaApiUsd || cache.fechaApiEur);
            var horaSync = '';
            if (cache.consultadoEn) {
                var dSync = new Date(cache.consultadoEn);
                horaSync = String(dSync.getHours()).padStart(2, '0') + ':' + String(dSync.getMinutes()).padStart(2, '0');
            }
            fechaEl.textContent = (fechaApi ? 'BCV: ' + fechaApi : 'BCV') + (horaSync ? ' · Sync ' + horaSync : '');
        } else if (errorMsg) {
            fechaEl.textContent = 'Sin conexión a ve.dolarapi.com';
        }
    }

    if (btnAct) {
        btnAct.disabled = (estadoFetch === 'loading');
        btnAct.textContent = (estadoFetch === 'loading') ? '⏳...' : '🔄 Actualizar';
    }

    convertirMontoConTasas();
    if (typeof renderizarTarjetasFinanzas === 'function') {
        renderizarTarjetasFinanzas();
    }
    if (typeof actualizarResumenTarjetasUI === 'function') {
        actualizarResumenTarjetasUI();
    }
    if (typeof renderizarPlanificacionFinanzas === 'function') {
        renderizarPlanificacionFinanzas();
    }
}

function necesitaActualizarTasasDiarias(cache, hoyClave) {
    if (!cache || (!cache.usd && !cache.eur) || !cache.paralelo) return true;
    if (cache.fechaConsultaLocal !== hoyClave) return true;
    if (!cache.consultadoEn || (Date.now() - cache.consultadoEn) > MONARCA_TASAS_REFRESH_MAX_AGE_MS) return true;
    return false;
}

function actualizarTasasBCV(forzar) {
    var hoyClave = obtenerFechaClaveHoyTasas();
    var cache = leerCacheTasasBCV();

    if (!forzar && !necesitaActualizarTasasDiarias(cache, hoyClave)) {
        renderizarTasasBCV('idle');
        return Promise.resolve(cache);
    }

    if (window._monarcaTasasFetchPromise) {
        return window._monarcaTasasFetchPromise;
    }

    renderizarTasasBCV('loading');

    var pCot = fetch(MONARCA_TASAS_BCV_API_URL, { cache: 'no-store' })
        .then(function(r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); });
    var pDol = fetch(MONARCA_TASAS_DOLARES_API_URL, { cache: 'no-store' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .catch(function() { return null; });

    window._monarcaTasasFetchPromise = Promise.all([
        pCot.catch(function(err) { return { __err: err }; }),
        pDol
    ])
        .then(function(res) {
            var cotData = res[0];
            var dolData = res[1];
            if (cotData && cotData.__err && !Array.isArray(dolData)) {
                throw cotData.__err;
            }
            var parsed = extraerTasasDeCotizaciones(
                (cotData && !cotData.__err) ? cotData : [],
                dolData
            );
            if (!parsed) throw new Error('Respuesta sin tasas BCV/Euro válidas');
            var nuevoCache = {
                usd: parsed.usd || (cache && cache.usd) || null,
                eur: parsed.eur || (cache && cache.eur) || null,
                paralelo: parsed.paralelo || (cache && cache.paralelo) || null,
                fechaApiUsd: parsed.fechaApiUsd || (cache && cache.fechaApiUsd) || '',
                fechaApiEur: parsed.fechaApiEur || (cache && cache.fechaApiEur) || '',
                fechaApiParalelo: parsed.fechaApiParalelo || (cache && cache.fechaApiParalelo) || '',
                fechaConsultaLocal: obtenerFechaClaveHoyTasas(),
                consultadoEn: Date.now(),
                fuenteUrl: MONARCA_TASAS_BCV_API_URL
            };
            guardarCacheTasasBCV(nuevoCache);
            renderizarTasasBCV('idle');
            if (forzar && typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca('Tasas BCV, Euro y Paralelo actualizadas', '🏦');
            }
            return nuevoCache;
        })
        .catch(function(err) {
            console.warn('[Tasas BCV DolarAPI]', err && err.message ? err.message : err);
            renderizarTasasBCV('error', (err && err.message) ? err.message : 'Error de red');
            return leerCacheTasasBCV();
        })
        .finally(function() {
            window._monarcaTasasFetchPromise = null;
        });

    return window._monarcaTasasFetchPromise;
}

function iniciarAutoActualizacionTasasBCV() {
    if (_monarcaTasasTimerId) clearInterval(_monarcaTasasTimerId);
    // Sincronización diaria automática en arranque y chequeo cada 30 min ante cambio de día
    setTimeout(function() {
        actualizarTasasBCV(false);
    }, 1500);
    _monarcaTasasTimerId = setInterval(function() {
        actualizarTasasBCV(false);
    }, 30 * 60 * 1000);
}

// ==========================================================================
// MÓDULO: TARJETAS Y CONTROL CAMBIARIO (PROVINCIAL, VENEZUELA, BINANCE, TODOTICKET)
// ==========================================================================

var MONARCA_BANCOS_TARJETAS = {
    provincial: {
        id: 'provincial',
        nombre: 'Provincial',
        subtitulo: 'BBVA Provincial · Bolívares (Bs.)',
        monedaBase: 'VES',
        tasaPorDefecto: 'bcv',
        accent: '#3b82f6',
        siglas: 'PRV'
    },
    venezuela: {
        id: 'venezuela',
        nombre: 'Venezuela',
        subtitulo: 'Banco de Venezuela · Bolívares (Bs.)',
        monedaBase: 'VES',
        tasaPorDefecto: 'bcv',
        accent: '#ef4444',
        siglas: 'BDV'
    },
    binance: {
        id: 'binance',
        nombre: 'Binance',
        subtitulo: 'Binance · Dólares / USDT',
        monedaBase: 'USD',
        tasaPorDefecto: 'paralelo',
        accent: '#f59e0b',
        siglas: 'BNB'
    },
    todoticket: {
        id: 'todoticket',
        nombre: 'Todoticket',
        subtitulo: 'Todoticket · Bolívares (Bs.)',
        monedaBase: 'VES',
        tasaPorDefecto: 'bcv',
        accent: '#10b981',
        siglas: 'TDT'
    }
};

function asegurarArrayTarjetasFinanzas() {
    if (!APP_STATE.finanzas) {
        APP_STATE.finanzas = JSON.parse(JSON.stringify(DEFAULT_STATE.finanzas));
    }
    if (!Array.isArray(APP_STATE.finanzas.tarjetas)) {
        APP_STATE.finanzas.tarjetas = [];
    }
    return APP_STATE.finanzas.tarjetas;
}

function obtenerInfoBancoTarjeta(bancoKey) {
    return MONARCA_BANCOS_TARJETAS[String(bancoKey || '').toLowerCase()] || MONARCA_BANCOS_TARJETAS.provincial;
}

function obtenerTasaParaTarjeta(tasaTipo, cacheOpt) {
    var cache = cacheOpt || leerCacheTasasBCV() || {};
    var tipo = tasaTipo || 'bcv';
    var tasaUsdBcv = (Number(cache.usd) > 0) ? Number(cache.usd) : 0;
    var tasaEur = (Number(cache.eur) > 0) ? Number(cache.eur) : 0;
    var tasaPar = (Number(cache.paralelo) > 0) ? Number(cache.paralelo) : 0;

    if (tipo === 'paralelo') {
        if (tasaPar > 0) return { valor: tasaPar, label: 'Paralelo', fallback: false };
        if (tasaUsdBcv > 0) return { valor: tasaUsdBcv, label: 'BCV (resp.)', fallback: true };
        return { valor: 0, label: 'Sin tasa', fallback: true };
    }
    if (tipo === 'eur') {
        if (tasaEur > 0) return { valor: tasaEur, label: 'Euro BCV', fallback: false };
        if (tasaUsdBcv > 0) return { valor: tasaUsdBcv, label: 'BCV (resp.)', fallback: true };
        return { valor: 0, label: 'Sin tasa', fallback: true };
    }
    if (tasaUsdBcv > 0) return { valor: tasaUsdBcv, label: 'BCV USD', fallback: false };
    if (tasaPar > 0) return { valor: tasaPar, label: 'Paralelo (resp.)', fallback: true };
    return { valor: 0, label: 'Sin tasa', fallback: true };
}

function calcularEstadoTarjetaEnVivo(tarjeta, cacheOpt) {
    var info = obtenerInfoBancoTarjeta(tarjeta && tarjeta.banco);
    var monedaBase = info.monedaBase;
    var tasaTipo = (tarjeta && tarjeta.tasaTipo) ? tarjeta.tasaTipo : info.tasaPorDefecto;
    var tasaInfo = obtenerTasaParaTarjeta(tasaTipo, cacheOpt);
    var tasaActual = tasaInfo.valor;

    if (monedaBase === 'USD') {
        var saldoUsd = Math.max(0, Number(tarjeta && tarjeta.saldoUsd) || 0);
        var equivBs = tasaActual > 0 ? (saldoUsd * tasaActual) : 0;
        return {
            bancoInfo: info,
            monedaBase: 'USD',
            tasaTipo: tasaTipo,
            tasaLabel: tasaInfo.label,
            tasaActual: tasaActual,
            saldoBs: 0,
            saldoUsd: saldoUsd,
            valorActualUsd: saldoUsd,
            valorActualBs: equivBs,
            usdReferenciaBase: saldoUsd,
            devaluacionUsd: 0,
            devaluacionPct: 0
        };
    }

    var saldoBs = Math.max(0, Number(tarjeta && tarjeta.saldoBs) || 0);
    var refUsd = (tarjeta && tarjeta.usdReferenciaBase != null) ? Math.max(0, Number(tarjeta.usdReferenciaBase) || 0) : 0;
    var valorActualUsd = (tasaActual > 0) ? (saldoBs / tasaActual) : refUsd;
    var devaluacionUsd = (tasaActual > 0 && saldoBs > 0 && refUsd > 0) ? (valorActualUsd - refUsd) : 0;
    var devaluacionPct = (tasaActual > 0 && saldoBs > 0 && refUsd > 0.0001) ? ((valorActualUsd - refUsd) / refUsd) * 100 : 0;

    return {
        bancoInfo: info,
        monedaBase: 'VES',
        tasaTipo: tasaTipo,
        tasaLabel: tasaInfo.label,
        tasaActual: tasaActual,
        saldoBs: saldoBs,
        saldoUsd: valorActualUsd,
        valorActualUsd: valorActualUsd,
        valorActualBs: saldoBs,
        usdReferenciaBase: refUsd,
        devaluacionUsd: devaluacionUsd,
        devaluacionPct: devaluacionPct
    };
}

function formatearUsdTarjeta(val) {
    var num = Number(val) || 0;
    return '$' + num.toFixed(2);
}

function construirTituloTarjeta(tarjeta) {
    var info = obtenerInfoBancoTarjeta(tarjeta && tarjeta.banco);
    var alias = (tarjeta && tarjeta.alias) ? String(tarjeta.alias).trim() : '';
    return alias ? (info.nombre + ' · ' + alias) : info.nombre;
}

function obtenerResumenGlobalTarjetas(cacheOpt) {
    var tarjetas = asegurarArrayTarjetasFinanzas();
    var cache = cacheOpt || leerCacheTasasBCV();
    var totalUsdHoy = 0;
    var totalBsBancos = 0;
    var totalUsdtBinance = 0;
    var totalDevalUsd = 0;

    tarjetas.forEach(function(t) {
        var est = calcularEstadoTarjetaEnVivo(t, cache);
        totalUsdHoy += est.valorActualUsd;
        if (est.monedaBase === 'VES') {
            totalBsBancos += est.saldoBs;
            totalDevalUsd += est.devaluacionUsd;
        } else {
            totalUsdtBinance += est.saldoUsd;
        }
    });

    return {
        cantidad: tarjetas.length,
        totalUsdHoy: Math.round(totalUsdHoy * 100) / 100,
        totalBsBancos: Math.round(totalBsBancos * 100) / 100,
        totalUsdtBinance: Math.round(totalUsdtBinance * 100) / 100,
        totalDevalUsd: Math.round(totalDevalUsd * 100) / 100
    };
}

function actualizarResumenTarjetasUI() {
    var res = obtenerResumenGlobalTarjetas();
    var tabBadge = document.getElementById('badge-finanzas-tarjetas-total');
    if (tabBadge) {
        if (res.cantidad > 0) {
            tabBadge.textContent = formatearUsdTarjeta(res.totalUsdHoy);
            tabBadge.style.display = 'inline-flex';
        } else {
            tabBadge.style.display = 'none';
        }
    }

    var chipResumen = document.getElementById('resumen-tarjetas-vinculadas-chip');
    if (chipResumen) {
        if (res.cantidad > 0) {
            var devStr = res.totalDevalUsd < -0.005 ? (' · Dev: -$' + Math.abs(res.totalDevalUsd).toFixed(2)) : '';
            chipResumen.textContent = '💳 Tarjetas hoy: ' + formatearUsdTarjeta(res.totalUsdHoy) + devStr;
            chipResumen.style.display = 'inline-flex';
        } else {
            chipResumen.style.display = 'none';
        }
    }
}

function poblarSelectsTarjetasFinanzas() {
    var tarjetas = asegurarArrayTarjetasFinanzas();
    var cache = leerCacheTasasBCV();

    function rellenarSelect(selId, etiquetaNula, incluirEfectivo) {
        var sel = document.getElementById(selId);
        if (!sel) return;
        var prev = sel.value;
        var html = '<option value="">' + escaparHTML(etiquetaNula) + '</option>';
        if (incluirEfectivo && tarjetas.length > 0) {
            html += '<option value="__EFECTIVO__">💵 Efectivo / Sin tarjeta</option>';
        }
        tarjetas.forEach(function(t) {
            var est = calcularEstadoTarjetaEnVivo(t, cache);
            var saldoTxt = est.monedaBase === 'USD'
                ? (formatearUsdTarjeta(est.saldoUsd) + ' USDT')
                : (formatearTasaBsDisplay(est.saldoBs, 2) + ' ≈ ' + formatearUsdTarjeta(est.valorActualUsd));
            html += '<option value="' + escaparHTML(t.id) + '">' + escaparHTML(construirTituloTarjeta(t)) + ' (' + saldoTxt + ')</option>';
        });
        sel.innerHTML = html;
        if (prev && ((incluirEfectivo && prev === '__EFECTIVO__') || tarjetas.some(function(t) { return t.id === prev; }))) {
            sel.value = prev;
        }
    }

    rellenarSelect('modal-ingreso-tarjeta', 'Sin tarjeta predeterminada (elegir al cobrar)', false);
    rellenarSelect('modal-cobro-ingreso-tarjeta', 'No asociar a tarjeta (solo registro)', false);
    rellenarSelect('modal-gasto-tarjeta', tarjetas.length > 0 ? '-- Selecciona tarjeta de salida --' : '💵 Efectivo / Sin tarjetas registradas', true);
    rellenarSelect('modal-plan-abono-tarjeta', 'Caja / Dinero cobrado (sin descontar tarjeta)', false);

    if (typeof document !== 'undefined' && typeof construirOpcionesTarjetasHTML === 'function') {
        ['lista-ingreso-tarjetas-split', 'lista-cobro-tarjetas-split'].forEach(function(contId) {
            var contEl = document.getElementById(contId);
            if (!contEl) return;
            Array.from(contEl.querySelectorAll('.fin-split-trj-select')).forEach(function(selRow) {
                var valPrev = selRow.value;
                selRow.innerHTML = construirOpcionesTarjetasHTML(valPrev);
            });
        });
    }

    actualizarResumenTarjetasUI();
}

function renderizarTarjetasFinanzas() {
    var cont = document.getElementById('contenedor-tarjetas-finanzas-root');
    poblarSelectsTarjetasFinanzas();
    if (!cont) return;

    var tarjetas = asegurarArrayTarjetasFinanzas();
    var cache = leerCacheTasasBCV();
    var res = obtenerResumenGlobalTarjetas(cache);

    var devalColor = res.totalDevalUsd < -0.01 ? '#f87171' : (res.totalDevalUsd > 0.01 ? '#38bdf8' : '#34d399');
    var devalTexto = (res.totalDevalUsd < 0 ? '-$' : (res.totalDevalUsd > 0 ? '+$' : '$')) + Math.abs(res.totalDevalUsd).toFixed(2);

    var kpiHtml = `
        <div class="tarjetas-kpi-grid">
            <div class="tarjeta-kpi-box" style="border-top: 2px solid #10b981;">
                <div class="tarjeta-kpi-label">Total Hoy en $</div>
                <div class="tarjeta-kpi-value" style="color: #34d399;">${formatearUsdTarjeta(res.totalUsdHoy)}</div>
                <div class="tarjeta-kpi-sub">${res.cantidad} ${res.cantidad === 1 ? 'tarjeta activa' : 'tarjetas activas'}</div>
            </div>
            <div class="tarjeta-kpi-box" style="border-top: 2px solid #38bdf8;">
                <div class="tarjeta-kpi-label">En Bolívares</div>
                <div class="tarjeta-kpi-value" style="color: #7dd3fc;">${formatearTasaBsDisplay(res.totalBsBancos, 2)}</div>
                <div class="tarjeta-kpi-sub">Provincial / Venezuela / Todoticket</div>
            </div>
            <div class="tarjeta-kpi-box" style="border-top: 2px solid #f59e0b;">
                <div class="tarjeta-kpi-label">Binance USDT</div>
                <div class="tarjeta-kpi-value" style="color: #fbbf24;">${formatearUsdTarjeta(res.totalUsdtBinance)}</div>
                <div class="tarjeta-kpi-sub">Saldo protegido en $</div>
            </div>
            <div class="tarjeta-kpi-box" style="border-top: 2px solid ${devalColor};">
                <div class="tarjeta-kpi-label">Devaluación Bs.</div>
                <div class="tarjeta-kpi-value" style="color: ${devalColor};">${devalTexto}</div>
                <div class="tarjeta-kpi-sub">Vs. tasa al ingresar</div>
            </div>
        </div>`;

    if (tarjetas.length === 0) {
        cont.innerHTML = kpiHtml + `
            <div class="finanzas-empty-hint" style="padding: 32px 18px; border-radius: 16px;">
                <div style="font-size: 28px; margin-bottom: 8px;">💳</div>
                <div style="font-size: 15px; font-weight: 800; color: #f8fafc; margin-bottom: 6px;">Sin tarjetas o billeteras registradas</div>
                <div style="font-size: 12.5px; color: #94a3b8; max-width: 400px; margin: 0 auto 14px auto; line-height: 1.45;">
                    Registra tus saldos en <strong>Provincial</strong>, <strong>Venezuela</strong>, <strong>Todoticket</strong> o <strong>Binance</strong>. Los montos en Bolívares se recalculan cada día con la tasa del API para mostrar cuánto valen hoy en dólares.
                </div>
                <button type="button" class="btn-add-finanza" onclick="abrirModalTarjeta()">
                    ➕ Agregar Primera Tarjeta
                </button>
            </div>`;
        return;
    }

    var cardsHtml = tarjetas.map(function(t) {
        var est = calcularEstadoTarjetaEnVivo(t, cache);
        var info = est.bancoInfo;
        var titulo = escaparHTML(construirTituloTarjeta(t));

        var saldoNativoTexto = (est.monedaBase === 'USD')
            ? (formatearUsdTarjeta(est.saldoUsd) + ' USDT')
            : formatearTasaBsDisplay(est.saldoBs, 2);

        var equivPrincipalTexto = (est.monedaBase === 'USD')
            ? (est.tasaActual > 0 ? ('≈ ' + formatearTasaBsDisplay(est.valorActualBs, 2)) : 'Esperando tasa API...')
            : (est.tasaActual > 0 ? ('≈ ' + formatearUsdTarjeta(est.valorActualUsd) + ' USD hoy') : 'Esperando tasa API...');

        var tasaTag = est.tasaActual > 0
            ? (est.tasaLabel + ': ' + Number(est.tasaActual).toFixed(2) + ' Bs/$')
            : 'Sin conexión API';

        var devalPillHtml = '';
        if (est.monedaBase === 'USD') {
            devalPillHtml = '<div class="tarjeta-deval-pill is-stable">🛡️ Protegido en USDT (0% devaluación en $)</div>';
        } else if (est.saldoBs <= 0) {
            devalPillHtml = '<div class="tarjeta-deval-pill is-stable">Saldo en Bs. 0,00</div>';
        } else if (Math.abs(est.devaluacionUsd) < 0.01) {
            devalPillHtml = '<div class="tarjeta-deval-pill is-stable">✓ A tasa de referencia (Base: ' + formatearUsdTarjeta(est.usdReferenciaBase) + ')</div>';
        } else if (est.devaluacionUsd < 0) {
            devalPillHtml = '<div class="tarjeta-deval-pill is-loss">📉 Devaluación: -$' + Math.abs(est.devaluacionUsd).toFixed(2) + ' (' + est.devaluacionPct.toFixed(1) + '% vs ' + formatearUsdTarjeta(est.usdReferenciaBase) + ')</div>';
        } else {
            devalPillHtml = '<div class="tarjeta-deval-pill is-gain">📈 Diferencia: +$' + est.devaluacionUsd.toFixed(2) + ' (Base: ' + formatearUsdTarjeta(est.usdReferenciaBase) + ')</div>';
        }

        var histItems = Array.isArray(t.historial) ? t.historial.slice(0, 3) : [];
        var histHtml = '';
        if (histItems.length > 0) {
            histHtml = '<div class="tarjeta-historial-mini">' + histItems.map(function(h) {
                var sign = h.tipo === 'retiro' ? '-' : (h.tipo === 'ingreso' ? '+' : '⇄ ');
                var col = h.tipo === 'retiro' ? '#f87171' : (h.tipo === 'ingreso' ? '#34d399' : '#7dd3fc');
                var mDisp = (est.monedaBase === 'USD')
                    ? (sign + formatearUsdTarjeta(Math.abs(Number(h.montoUsd) || 0)))
                    : (sign + formatearTasaBsDisplay(Math.abs(Number(h.montoBs) || 0), 2));
                return '<div class="tarjeta-hist-row"><span class="tarjeta-hist-nota">' + escaparHTML(h.nota || 'Movimiento') + '</span><span class="tarjeta-hist-monto" style="color:' + col + ';">' + mDisp + '</span></div>';
            }).join('') + '</div>';
        }

        return `
        <div class="tarjeta-banco-card" style="--banco-accent: ${info.accent};" data-tarjeta-id="${escaparHTML(t.id)}">
            <div class="tarjeta-banco-top">
                <div class="tarjeta-banco-ident">
                    <div class="tarjeta-banco-badge">${info.siglas}</div>
                    <div style="min-width: 0;">
                        <h4 class="tarjeta-banco-nombre">${titulo}</h4>
                        <div class="tarjeta-banco-sub">${escaparHTML(info.subtitulo)}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 5px; flex-shrink: 0;">
                    <button type="button" class="rutina-icon-btn edit" title="Editar tarjeta" onclick="abrirModalTarjeta('${escaparHTML(t.id)}')">✎</button>
                    <button type="button" class="rutina-icon-btn delete" title="Eliminar tarjeta" onclick="eliminarTarjetaFinanzas('${escaparHTML(t.id)}')">✕</button>
                </div>
            </div>

            <div class="tarjeta-saldos-box">
                <div class="tarjeta-saldo-nativo-label">${est.monedaBase === 'USD' ? 'Saldo Disponible (USDT / $)' : 'Saldo Guardado en Banco (Bolívares)'}</div>
                <div class="tarjeta-saldo-nativo">${saldoNativoTexto}</div>
                <div class="tarjeta-equiv-row">
                    <span class="tarjeta-equiv-principal">${equivPrincipalTexto}</span>
                    <span class="tarjeta-tasa-aplicada">${escaparHTML(tasaTag)}</span>
                </div>
            </div>

            ${devalPillHtml}

            <div class="tarjeta-actions-grid">
                <button type="button" class="btn-tarjeta-op ingreso" onclick="abrirModalMovimientoTarjeta('${escaparHTML(t.id)}', 'ingreso')">+ Ingresar</button>
                <button type="button" class="btn-tarjeta-op retiro" onclick="abrirModalMovimientoTarjeta('${escaparHTML(t.id)}', 'retiro')">- Retirar</button>
                <button type="button" class="btn-tarjeta-op ajuste" onclick="abrirModalMovimientoTarjeta('${escaparHTML(t.id)}', 'ajuste')">⇄ Ajustar</button>
            </div>

            ${histHtml}
        </div>`;
    }).join('');

    cont.innerHTML = kpiHtml + '<div class="tarjetas-cards-grid">' + cardsHtml + '</div>';
}

function abrirModalTarjeta(idOpcional) {
    var modal = document.getElementById('modal-finanzas-tarjeta');
    if (!modal) return;

    var inId = document.getElementById('modal-tarjeta-id');
    var selBanco = document.getElementById('modal-tarjeta-banco');
    var inAlias = document.getElementById('modal-tarjeta-alias');
    var selTasa = document.getElementById('modal-tarjeta-tasa');
    var inSaldo = document.getElementById('modal-tarjeta-saldo');
    var selMonedaIn = document.getElementById('modal-tarjeta-moneda-input');
    var wrapSaldoIni = document.getElementById('grupo-modal-tarjeta-saldo-inicial');
    var titEl = document.getElementById('modal-tarjeta-titulo');

    if (selBanco) {
        selBanco.innerHTML = ['provincial', 'venezuela', 'binance', 'todoticket'].map(function(k) {
            var b = MONARCA_BANCOS_TARJETAS[k];
            return '<option value="' + b.id + '">' + b.nombre + (b.monedaBase === 'USD' ? ' ($ USDT)' : ' (Bs.)') + '</option>';
        }).join('');
    }

    var existente = idOpcional ? asegurarArrayTarjetasFinanzas().find(function(t) { return t.id === idOpcional; }) : null;

    if (existente) {
        if (titEl) titEl.textContent = 'EDITAR TARJETA';
        if (inId) inId.value = existente.id;
        if (selBanco) selBanco.value = MONARCA_BANCOS_TARJETAS[existente.banco] ? existente.banco : 'provincial';
        if (inAlias) inAlias.value = existente.alias || '';
        if (selTasa) selTasa.value = existente.tasaTipo || obtenerInfoBancoTarjeta(existente.banco).tasaPorDefecto;
        if (wrapSaldoIni) wrapSaldoIni.style.display = 'none';
    } else {
        if (titEl) titEl.textContent = 'AGREGAR TARJETA O BILLETERA';
        if (inId) inId.value = '';
        if (selBanco) selBanco.value = 'provincial';
        if (inAlias) inAlias.value = '';
        if (selTasa) selTasa.value = 'bcv';
        if (inSaldo) inSaldo.value = '';
        if (selMonedaIn) selMonedaIn.value = 'VES';
        if (wrapSaldoIni) wrapSaldoIni.style.display = 'block';
    }

    alCambiarBancoTarjetaModal(!!existente);
    modal.style.display = 'flex';
}

function cerrarModalTarjeta() {
    var m = document.getElementById('modal-finanzas-tarjeta');
    if (m) m.style.display = 'none';
}

function alCambiarBancoTarjetaModal(mantenerTasa) {
    var selBanco = document.getElementById('modal-tarjeta-banco');
    var selTasa = document.getElementById('modal-tarjeta-tasa');
    var selMonedaIn = document.getElementById('modal-tarjeta-moneda-input');
    var lblSaldo = document.getElementById('label-modal-tarjeta-saldo');
    var info = obtenerInfoBancoTarjeta(selBanco ? selBanco.value : 'provincial');

    if (!mantenerTasa && selTasa) {
        selTasa.value = info.tasaPorDefecto;
    }
    if (selMonedaIn) {
        selMonedaIn.value = info.monedaBase;
    }
    if (lblSaldo) {
        lblSaldo.textContent = info.monedaBase === 'USD'
            ? 'Saldo Inicial en Binance ($ USDT):'
            : 'Saldo Actual en ' + info.nombre + ':';
    }
    alCambiarInputPreviewModalTarjeta();
}

function alCambiarInputPreviewModalTarjeta() {
    var prev = document.getElementById('preview-modal-tarjeta-tasa');
    if (!prev) return;
    var selBanco = document.getElementById('modal-tarjeta-banco');
    var selTasa = document.getElementById('modal-tarjeta-tasa');
    var inSaldo = document.getElementById('modal-tarjeta-saldo');
    var selMonedaIn = document.getElementById('modal-tarjeta-moneda-input');

    var info = obtenerInfoBancoTarjeta(selBanco ? selBanco.value : 'provincial');
    var tasaInfo = obtenerTasaParaTarjeta(selTasa ? selTasa.value : info.tasaPorDefecto);
    var monto = Math.max(0, parseFloat(inSaldo ? inSaldo.value : '0') || 0);
    var monedaIn = selMonedaIn ? selMonedaIn.value : info.monedaBase;

    if (!tasaInfo.valor) {
        prev.textContent = 'Sin tasa cargada aún. Conecta internet o presiona Actualizar en Tasas.';
        return;
    }
    if (info.monedaBase === 'USD') {
        var bsEquiv = monedaIn === 'USD' ? (monto * tasaInfo.valor) : monto;
        var usdFinal = monedaIn === 'USD' ? monto : (monto / tasaInfo.valor);
        prev.innerHTML = 'Tasa ' + tasaInfo.label + ': <strong>' + Number(tasaInfo.valor).toFixed(2) + ' Bs/$</strong> · Guardará <strong style="color:#fbbf24;">' + formatearUsdTarjeta(usdFinal) + ' USDT</strong> (≈ ' + formatearTasaBsDisplay(bsEquiv, 2) + ')';
    } else {
        var bsFinal = monedaIn === 'USD' ? (monto * tasaInfo.valor) : monto;
        var usdHoy = bsFinal / tasaInfo.valor;
        prev.innerHTML = 'Tasa ' + tasaInfo.label + ': <strong>' + Number(tasaInfo.valor).toFixed(2) + ' Bs/$</strong> · Guardará <strong style="color:#7dd3fc;">' + formatearTasaBsDisplay(bsFinal, 2) + '</strong> (equivale hoy a <strong style="color:#34d399;">' + formatearUsdTarjeta(usdHoy) + '</strong>)';
    }
}

function confirmarGuardarTarjeta() {
    var inId = document.getElementById('modal-tarjeta-id');
    var selBanco = document.getElementById('modal-tarjeta-banco');
    var inAlias = document.getElementById('modal-tarjeta-alias');
    var selTasa = document.getElementById('modal-tarjeta-tasa');
    var inSaldo = document.getElementById('modal-tarjeta-saldo');
    var selMonedaIn = document.getElementById('modal-tarjeta-moneda-input');

    var bancoKey = selBanco ? String(selBanco.value).toLowerCase() : '';
    if (!MONARCA_BANCOS_TARJETAS[bancoKey]) {
        alert('Solo puedes seleccionar Provincial, Venezuela, Binance o Todoticket.');
        return;
    }

    var info = MONARCA_BANCOS_TARJETAS[bancoKey];
    var alias = inAlias ? inAlias.value.trim() : '';
    var tasaTipo = selTasa ? selTasa.value : info.tasaPorDefecto;
    var tarjetas = asegurarArrayTarjetasFinanzas();
    var editId = inId ? inId.value.trim() : '';
    var now = Date.now();

    if (editId) {
        var existing = tarjetas.find(function(t) { return t.id === editId; });
        if (!existing) return;
        existing.banco = bancoKey;
        existing.monedaBase = info.monedaBase;
        existing.alias = alias;
        existing.tasaTipo = tasaTipo;
        existing.fechaActualizacion = now;
        MonarcaDB.save(APP_STATE);
        cerrarModalTarjeta();
        renderizarTarjetasFinanzas();
        return;
    }

    var montoInput = Math.max(0, parseFloat(inSaldo ? inSaldo.value : '0') || 0);
    var monedaIn = selMonedaIn ? selMonedaIn.value : info.monedaBase;
    var tasaInfo = obtenerTasaParaTarjeta(tasaTipo);
    var tasaVal = tasaInfo.valor;

    if (montoInput > 0 && ((info.monedaBase === 'VES' && monedaIn === 'USD') || (info.monedaBase === 'USD' && monedaIn === 'VES')) && !tasaVal) {
        alert('Se requiere una tasa vigente del API para convertir el monto inicial.');
        return;
    }

    var saldoBs = 0;
    var saldoUsd = 0;
    var usdRef = 0;
    if (info.monedaBase === 'USD') {
        saldoUsd = (monedaIn === 'VES' && tasaVal > 0) ? (montoInput / tasaVal) : montoInput;
        saldoUsd = Math.round(saldoUsd * 100) / 100;
        usdRef = saldoUsd;
    } else {
        saldoBs = (monedaIn === 'USD' && tasaVal > 0) ? (montoInput * tasaVal) : montoInput;
        saldoBs = Math.round(saldoBs * 100) / 100;
        usdRef = tasaVal > 0 ? Math.round((saldoBs / tasaVal) * 100) / 100 : 0;
    }

    var nuevaTarjeta = {
        id: 'TRJ-' + now,
        banco: bancoKey,
        alias: alias,
        monedaBase: info.monedaBase,
        tasaTipo: tasaTipo,
        saldoBs: saldoBs,
        saldoUsd: saldoUsd,
        usdReferenciaBase: usdRef,
        tasaRegistroInicial: tasaVal || 0,
        fechaCreacion: now,
        fechaActualizacion: now,
        historial: (montoInput > 0) ? [{
            id: 'TMV-' + now,
            tipo: 'ingreso',
            montoBs: saldoBs,
            montoUsd: usdRef,
            tasaUsada: tasaVal || 0,
            nota: 'Saldo inicial registrado',
            fecha: new Date().toISOString()
        }] : []
    };

    tarjetas.push(nuevaTarjeta);
    MonarcaDB.save(APP_STATE);
    cerrarModalTarjeta();
    renderizarTarjetasFinanzas();
}

function eliminarTarjetaFinanzas(id) {
    if (!confirm('¿Eliminar esta tarjeta? Los movimientos de ingresos y gastos existentes no se borrarán.')) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('finanzas_tarjetas', id);
    }
    var tarjetas = asegurarArrayTarjetasFinanzas();
    APP_STATE.finanzas.tarjetas = tarjetas.filter(function(t) { return t.id !== id; });
    MonarcaDB.save(APP_STATE);
    renderizarTarjetasFinanzas();
}

function abrirModalMovimientoTarjeta(id, modo) {
    var tarjetas = asegurarArrayTarjetasFinanzas();
    var t = tarjetas.find(function(x) { return x.id === id; });
    if (!t) return;

    var m = document.getElementById('modal-movimiento-tarjeta');
    if (!m) return;

    var info = obtenerInfoBancoTarjeta(t.banco);
    var inId = document.getElementById('modal-mov-tarjeta-id');
    var inModo = document.getElementById('modal-mov-tarjeta-modo');
    var tit = document.getElementById('modal-mov-tarjeta-titulo');
    var sub = document.getElementById('modal-mov-tarjeta-sub');
    var selMon = document.getElementById('modal-mov-tarjeta-moneda');
    var inMonto = document.getElementById('modal-mov-tarjeta-monto');
    var inNota = document.getElementById('modal-mov-tarjeta-nota');

    if (inId) inId.value = id;
    if (inModo) inModo.value = modo || 'ingreso';
    if (tit) {
        tit.textContent = modo === 'retiro'
            ? ('RETIRAR / GASTAR DE ' + info.nombre.toUpperCase())
            : (modo === 'ajuste' ? ('AJUSTAR SALDO EN ' + info.nombre.toUpperCase()) : ('INGRESAR DINERO A ' + info.nombre.toUpperCase()));
    }
    var est = calcularEstadoTarjetaEnVivo(t);
    if (sub) {
        var sTxt = est.monedaBase === 'USD' ? (formatearUsdTarjeta(est.saldoUsd) + ' USDT') : (formatearTasaBsDisplay(est.saldoBs, 2) + ' (' + formatearUsdTarjeta(est.valorActualUsd) + ')');
        sub.textContent = construirTituloTarjeta(t) + ' · Saldo actual: ' + sTxt;
    }
    if (selMon) selMon.value = info.monedaBase;
    if (inMonto) {
        inMonto.value = (modo === 'ajuste') ? (est.monedaBase === 'USD' ? est.saldoUsd : est.saldoBs) : '';
    }
    if (inNota) inNota.value = '';

    alCambiarMontoMovimientoTarjeta();
    m.style.display = 'flex';
}

function cerrarModalMovimientoTarjeta() {
    var m = document.getElementById('modal-movimiento-tarjeta');
    if (m) m.style.display = 'none';
}

function alCambiarMontoMovimientoTarjeta() {
    var prev = document.getElementById('preview-mov-tarjeta-calc');
    if (!prev) return;
    var inId = document.getElementById('modal-mov-tarjeta-id');
    var inModo = document.getElementById('modal-mov-tarjeta-modo');
    var selMon = document.getElementById('modal-mov-tarjeta-moneda');
    var inMonto = document.getElementById('modal-mov-tarjeta-monto');

    var t = asegurarArrayTarjetasFinanzas().find(function(x) { return x.id === (inId ? inId.value : ''); });
    if (!t) return;
    var est = calcularEstadoTarjetaEnVivo(t);
    var monto = Math.max(0, parseFloat(inMonto ? inMonto.value : '0') || 0);
    var mon = selMon ? selMon.value : est.monedaBase;
    var modo = inModo ? inModo.value : 'ingreso';

    if (!est.tasaActual) {
        prev.textContent = 'Sin tasa del API en caché. Presiona Actualizar en Tasas para convertir automáticamente.';
        return;
    }
    var convTxt = (mon === 'USD')
        ? ('Equivale a ' + formatearTasaBsDisplay(monto * est.tasaActual, 2) + ' (Tasa ' + est.tasaLabel + ': ' + Number(est.tasaActual).toFixed(2) + ')')
        : ('Equivale a ' + formatearUsdTarjeta(monto / est.tasaActual) + ' hoy (Tasa ' + est.tasaLabel + ': ' + Number(est.tasaActual).toFixed(2) + ')');

    if (modo === 'ajuste') {
        prev.innerHTML = 'Al ajustar, este saldo quedará como nueva línea base al día de hoy.<br><strong>' + convTxt + '</strong>';
    } else {
        prev.innerHTML = '<strong>' + convTxt + '</strong>';
    }
}

function aplicarMovimientoEnTarjeta(tarjetaId, modo, montoInput, monedaInput, nota, refId) {
    var tarjetas = asegurarArrayTarjetasFinanzas();
    var t = tarjetas.find(function(x) { return x.id === tarjetaId; });
    if (!t) return null;

    var est = calcularEstadoTarjetaEnVivo(t);
    var tasaVal = est.tasaActual;
    var monto = Math.max(0, Number(montoInput) || 0);
    if (isNaN(monto) || (modo !== 'ajuste' && monto <= 0)) return null;

    var moneda = monedaInput || est.monedaBase;
    if (((est.monedaBase === 'VES' && moneda === 'USD') || (est.monedaBase === 'USD' && moneda === 'VES')) && !tasaVal) {
        return null;
    }

    var now = Date.now();
    var deltaNativo = 0;
    var deltaUsdRef = 0;
    var movBs = 0;
    var movUsd = 0;

    if (est.monedaBase === 'USD') {
        movUsd = (moneda === 'VES' && tasaVal > 0) ? (monto / tasaVal) : monto;
        movUsd = Math.round(movUsd * 100) / 100;
        movBs = tasaVal > 0 ? Math.round((movUsd * tasaVal) * 100) / 100 : 0;
        var prevUsd = Number(t.saldoUsd) || 0;
        if (modo === 'retiro') {
            deltaNativo = Math.min(prevUsd, movUsd);
            t.saldoUsd = Math.max(0, Math.round((prevUsd - deltaNativo) * 100) / 100);
        } else if (modo === 'ajuste') {
            deltaNativo = movUsd - prevUsd;
            t.saldoUsd = movUsd;
        } else {
            deltaNativo = movUsd;
            t.saldoUsd = Math.round((prevUsd + movUsd) * 100) / 100;
        }
        t.usdReferenciaBase = t.saldoUsd;
        deltaUsdRef = deltaNativo;
    } else {
        movBs = (moneda === 'USD' && tasaVal > 0) ? (monto * tasaVal) : monto;
        movBs = Math.round(movBs * 100) / 100;
        movUsd = tasaVal > 0 ? Math.round((movBs / tasaVal) * 100) / 100 : 0;
        var prevBs = Number(t.saldoBs) || 0;
        var prevRefUsd = (t.usdReferenciaBase != null) ? Number(t.usdReferenciaBase) : (tasaVal > 0 ? (prevBs / tasaVal) : 0);

        if (modo === 'retiro') {
            deltaNativo = Math.min(prevBs, movBs);
            var ratio = prevBs > 0 ? Math.min(1, deltaNativo / prevBs) : 0;
            deltaUsdRef = Math.round((prevRefUsd * ratio) * 100) / 100;
            t.saldoBs = Math.max(0, Math.round((prevBs - deltaNativo) * 100) / 100);
            t.usdReferenciaBase = (t.saldoBs <= 0.001) ? 0 : Math.max(0, Math.round((prevRefUsd - deltaUsdRef) * 100) / 100);
        } else if (modo === 'ajuste') {
            deltaNativo = movBs - prevBs;
            deltaUsdRef = movUsd - prevRefUsd;
            t.saldoBs = movBs;
            t.usdReferenciaBase = movUsd;
        } else {
            deltaNativo = movBs;
            deltaUsdRef = movUsd;
            t.saldoBs = Math.round((prevBs + movBs) * 100) / 100;
            t.usdReferenciaBase = Math.round((prevRefUsd + movUsd) * 100) / 100;
        }
    }

    if (!Array.isArray(t.historial)) t.historial = [];
    t.historial.unshift({
        id: 'TMV-' + now,
        refMovimientoId: refId || null,
        tipo: modo,
        montoBs: movBs,
        montoUsd: movUsd,
        tasaUsada: tasaVal || 0,
        nota: nota || (modo === 'retiro' ? 'Retiro / Gasto' : (modo === 'ajuste' ? 'Ajuste manual' : 'Ingreso a tarjeta')),
        fecha: new Date().toISOString()
    });
    if (t.historial.length > 25) t.historial = t.historial.slice(0, 25);
    t.fechaActualizacion = now;

    return {
        tarjetaId: t.id,
        monedaBase: est.monedaBase,
        deltaNativo: deltaNativo,
        deltaUsdRef: deltaUsdRef,
        tasaUsada: tasaVal || 0
    };
}

function revertirMovimientoEnTarjeta(tarjetaId, fueIngreso, deltaNativo, deltaUsdRef, refMovimientoId) {
    if (!tarjetaId || !deltaNativo) return;
    var tarjetas = asegurarArrayTarjetasFinanzas();
    var t = tarjetas.find(function(x) { return x.id === tarjetaId; });
    if (!t) return;

    var info = obtenerInfoBancoTarjeta(t.banco);
    var dNat = Number(deltaNativo) || 0;
    var dRef = Number(deltaUsdRef) || 0;

    if (info.monedaBase === 'USD') {
        var curU = Number(t.saldoUsd) || 0;
        t.saldoUsd = Math.max(0, Math.round((fueIngreso ? (curU - dNat) : (curU + dNat)) * 100) / 100);
        t.usdReferenciaBase = t.saldoUsd;
    } else {
        var curB = Number(t.saldoBs) || 0;
        var curRef = Number(t.usdReferenciaBase) || 0;
        t.saldoBs = Math.max(0, Math.round((fueIngreso ? (curB - dNat) : (curB + dNat)) * 100) / 100);
        t.usdReferenciaBase = (t.saldoBs <= 0.001) ? 0 : Math.max(0, Math.round((fueIngreso ? (curRef - dRef) : (curRef + dRef)) * 100) / 100);
    }

    if (refMovimientoId && Array.isArray(t.historial)) {
        t.historial = t.historial.filter(function(h) { return h.refMovimientoId !== refMovimientoId; });
    }
    t.fechaActualizacion = Date.now();
}

function confirmarMovimientoTarjeta() {
    var inId = document.getElementById('modal-mov-tarjeta-id');
    var inModo = document.getElementById('modal-mov-tarjeta-modo');
    var selMon = document.getElementById('modal-mov-tarjeta-moneda');
    var inMonto = document.getElementById('modal-mov-tarjeta-monto');
    var inNota = document.getElementById('modal-mov-tarjeta-nota');

    var id = inId ? inId.value : '';
    var modo = inModo ? inModo.value : 'ingreso';
    var mon = selMon ? selMon.value : 'VES';
    var monto = parseFloat(inMonto ? inMonto.value : '0');
    var nota = inNota ? inNota.value.trim() : '';

    if (isNaN(monto) || (modo !== 'ajuste' && monto <= 0) || monto < 0) {
        alert('Ingresa un monto válido.');
        return;
    }

    var res = aplicarMovimientoEnTarjeta(id, modo, monto, mon, nota);
    if (!res) {
        alert('No se pudo aplicar el movimiento (verifica la tasa o el monto).');
        return;
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalMovimientoTarjeta();
    renderizarTarjetasFinanzas();
}

if (typeof window !== 'undefined') {
    window.MONARCA_BANCOS_TARJETAS = MONARCA_BANCOS_TARJETAS;
    window.abrirModalTarjeta = abrirModalTarjeta;
    window.cerrarModalTarjeta = cerrarModalTarjeta;
    window.alCambiarBancoTarjetaModal = alCambiarBancoTarjetaModal;
    window.alCambiarInputPreviewModalTarjeta = alCambiarInputPreviewModalTarjeta;
    window.confirmarGuardarTarjeta = confirmarGuardarTarjeta;
    window.eliminarTarjetaFinanzas = eliminarTarjetaFinanzas;
    window.abrirModalMovimientoTarjeta = abrirModalMovimientoTarjeta;
    window.cerrarModalMovimientoTarjeta = cerrarModalMovimientoTarjeta;
    window.alCambiarMontoMovimientoTarjeta = alCambiarMontoMovimientoTarjeta;
    window.confirmarMovimientoTarjeta = confirmarMovimientoTarjeta;
    window.renderizarTarjetasFinanzas = renderizarTarjetasFinanzas;
    window.obtenerResumenGlobalTarjetas = obtenerResumenGlobalTarjetas;
    window.addEventListener('DOMContentLoaded', function() {
        iniciarAutoActualizacionTasasBCV();
    });
}

// ============================================================================
// PLANIFICACIÓN DE PAGOS & COMPRAS (COBRADO VS GASTOS PROG., DEUDAS, COMPRAS)
// ============================================================================

function asegurarArrayComprasPlanificacion() {
    if (typeof APP_STATE === 'undefined' || !APP_STATE) return [];
    if (!APP_STATE.finanzas) APP_STATE.finanzas = JSON.parse(JSON.stringify(DEFAULT_STATE.finanzas));
    if (!Array.isArray(APP_STATE.finanzas.planificacionCompras)) APP_STATE.finanzas.planificacionCompras = [];
    return APP_STATE.finanzas.planificacionCompras;
}

function normalizarAbonosGasto(g) {
    if (!g) return { total: 0, abonado: 0, restante: 0 };
    var total = Math.max(0, Number(g.monto) || 0);
    if (!Array.isArray(g.abonos)) g.abonos = [];

    if (g.abonos.length > 0) {
        var sumAb = 0;
        g.abonos.forEach(function(ab) {
            sumAb += (Number(ab.montoUsd) || 0);
        });
        g.montoAbonado = Math.min(total, Math.round(sumAb * 100) / 100);
        if (g.montoAbonado >= total - 0.009 && total > 0) {
            g.pagado = true;
            if (!g.fechaPago) g.fechaPago = new Date().toISOString();
        } else {
            g.pagado = false;
            delete g.fechaPago;
        }
    } else {
        g.montoAbonado = g.pagado ? total : 0;
    }

    var restante = Math.max(0, Math.round((total - g.montoAbonado) * 100) / 100);
    return {
        total: Math.round(total * 100) / 100,
        abonado: g.montoAbonado,
        restante: restante
    };
}

function normalizarCompraPlanificada(c) {
    if (!c) return { total: 0, abonado: 0, restante: 0 };
    var total = Math.max(0, Number(c.precioTotal) || 0);
    if (!Array.isArray(c.abonos)) c.abonos = [];

    if (c.abonos.length > 0) {
        var sumAb = 0;
        c.abonos.forEach(function(ab) {
            sumAb += (Number(ab.montoUsd) || 0);
        });
        c.montoAbonado = Math.min(total, Math.round(sumAb * 100) / 100);
        c.comprado = (c.montoAbonado >= total - 0.009 && total > 0);
        if (c.comprado && !c.fechaComprado) {
            c.fechaComprado = new Date().toISOString();
        } else if (!c.comprado) {
            c.fechaComprado = null;
        }
    } else {
        c.montoAbonado = c.comprado ? total : 0;
    }

    var restante = Math.max(0, Math.round((total - c.montoAbonado) * 100) / 100);
    return {
        total: Math.round(total * 100) / 100,
        abonado: c.montoAbonado,
        restante: restante
    };
}

function itemPerteneceAMesActivoPlan(fechaStr, esRecurrente, anioActivo, mesActivo) {
    var mesClave = anioActivo + '-' + String(mesActivo + 1).padStart(2, '0');
    if (fechaStr && typeof fechaStr === 'string' && fechaStr.length >= 7) {
        return fechaStr.slice(0, 7) === mesClave;
    }
    return !!esRecurrente;
}

function obtenerDisponibleParaPlanificacion(fin, cacheOpt) {
    var f = fin || (APP_STATE && APP_STATE.finanzas) || DEFAULT_STATE.finanzas;
    var cache = cacheOpt || leerCacheTasasBCV();
    var fechaMes = (typeof obtenerFechaMesFinanzas === 'function') ? obtenerFechaMesFinanzas() : new Date();
    var anioActivo = fechaMes.getFullYear();
    var mesActivo = fechaMes.getMonth();
    var mesClave = anioActivo + '-' + String(mesActivo + 1).padStart(2, '0');

    var resTarjetas = obtenerResumenGlobalTarjetas(cache);
    var enTarjetasUsd = Number(resTarjetas.totalUsdHoy) || 0;

    var cobradoMesTotalUsd = 0;
    var cobradoSinTarjetaUsd = 0;
    var pendientePorCobrarMesUsd = 0;

    (f.ingresos || []).forEach(function(item) {
        var esRec = esItemRecurrenteMensualReal(item, false);
        if (!itemPerteneceAMesActivoPlan(item.fecha, esRec, anioActivo, mesActivo)) return;
        var m = Number(item.monto) || 0;
        if (item.cobrado) {
            var realM = (item.montoCobrado !== undefined && item.montoCobrado !== null && item.montoCobrado !== '')
                ? Number(item.montoCobrado)
                : m;
            cobradoMesTotalUsd += realM;
            var credTarj = 0;
            if (Array.isArray(item.tarjetasMovs) && item.tarjetasMovs.length > 0) {
                item.tarjetasMovs.forEach(function(mv) {
                    credTarj += (Number(mv && (mv.montoUsd || mv.deltaUsdRef)) || 0);
                });
            } else if (item.tarjetaId && item.tarjetaId !== '__EFECTIVO__') {
                credTarj = realM;
            }
            var remSinTarj = Math.max(0, Math.round((realM - credTarj) * 100) / 100);
            cobradoSinTarjetaUsd += remSinTarj;
        } else {
            pendientePorCobrarMesUsd += m;
        }
    });

    var ejecutadoSinTarjetaUsd = 0;
    (f.gastos || []).forEach(function(g) {
        if (Array.isArray(g.abonos) && g.abonos.length > 0) {
            g.abonos.forEach(function(ab) {
                if ((!ab.tarjetaId || ab.tarjetaId === '__EFECTIVO__') && (!ab.fecha || String(ab.fecha).slice(0, 7) === mesClave)) {
                    ejecutadoSinTarjetaUsd += (Number(ab.montoUsd) || 0);
                }
            });
        } else if (g.pagado) {
            var debTarj = 0;
            if (Array.isArray(g.tarjetasMovs) && g.tarjetasMovs.length > 0) {
                g.tarjetasMovs.forEach(function(mv) {
                    debTarj += (Number(mv && (mv.montoUsd || mv.deltaUsdRef)) || 0);
                });
            } else if (g.tarjetaId && g.tarjetaId !== '__EFECTIVO__') {
                debTarj = Number(g.monto) || 0;
            }
            var remGasSinTarj = Math.max(0, Math.round(((Number(g.monto) || 0) - debTarj) * 100) / 100);
            var fP = g.fechaPago || g.fecha || '';
            if (remGasSinTarj > 0 && (!fP || String(fP).slice(0, 7) === mesClave)) {
                ejecutadoSinTarjetaUsd += remGasSinTarj;
            }
        }
    });

    (f.deudas || []).forEach(function(d) {
        (d.abonosLibres || []).forEach(function(ab) {
            if (!ab.tarjetaId && (!ab.fecha || String(ab.fecha).slice(0, 7) === mesClave)) {
                ejecutadoSinTarjetaUsd += (Number(ab.montoUsd) || 0);
            }
        });
    });

    (f.planificacionCompras || []).forEach(function(c) {
        (c.abonos || []).forEach(function(ab) {
            if (!ab.tarjetaId && (!ab.fecha || String(ab.fecha).slice(0, 7) === mesClave)) {
                ejecutadoSinTarjetaUsd += (Number(ab.montoUsd) || 0);
            }
        });
    });

    var cajaSinTarjetaUsd = Math.round((cobradoSinTarjetaUsd - ejecutadoSinTarjetaUsd) * 100) / 100;
    var disponibleHoyUsd = Math.max(0, Math.round((enTarjetasUsd + cajaSinTarjetaUsd) * 100) / 100);

    return {
        enTarjetasUsd: Math.round(enTarjetasUsd * 100) / 100,
        cantidadTarjetas: resTarjetas.cantidad || 0,
        cobradoMesTotalUsd: Math.round(cobradoMesTotalUsd * 100) / 100,
        pendientePorCobrarMesUsd: Math.round(pendientePorCobrarMesUsd * 100) / 100,
        cobradoSinTarjetaUsd: Math.round(cobradoSinTarjetaUsd * 100) / 100,
        ejecutadoSinTarjetaUsd: Math.round(ejecutadoSinTarjetaUsd * 100) / 100,
        cajaSinTarjetaUsd: cajaSinTarjetaUsd,
        disponibleHoyUsd: disponibleHoyUsd
    };
}

function obtenerPesoPrioridadPlan(prio) {
    if (prio === 'alta') return 1;
    if (prio === 'baja') return 3;
    return 2;
}

function construirEtiquetaPrioridadPlan(prio) {
    if (prio === 'alta') return { texto: '🔴 Alta', color: '#f87171', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.3)' };
    if (prio === 'baja') return { texto: '🟢 Baja', color: '#34d399', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.28)' };
    return { texto: '🟡 Media', color: '#fbbf24', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.28)' };
}

function construirItemsPlanificacion(fin) {
    var f = fin || (APP_STATE && APP_STATE.finanzas) || DEFAULT_STATE.finanzas;
    var items = [];

    // 1. Gastos Programados
    (f.gastos || []).forEach(function(g, idx) {
        if (g.tipo === 'ocasional') return;
        var est = normalizarAbonosGasto(g);
        var prio = g.planPrioridad || 'alta';
        var orden = (g.planOrden != null) ? Number(g.planOrden) : (100 + idx);
        items.push({
            uid: 'gasto:' + g.id,
            tipo: 'gasto',
            id: g.id,
            titulo: g.concepto || 'Gasto Programado',
            categoria: g.categoria || 'Gasto Programado',
            icono: '📅',
            subDetalle: g.fecha ? ('Fecha: ' + formatearFechaCorta(g.fecha)) : ('Día ' + (g.dia || 15) + ' de cada mes'),
            nota: '',
            prioridad: prio,
            orden: orden,
            totalUsd: est.total,
            abonadoUsd: est.abonado,
            restanteUsd: est.restante,
            completo: !!g.pagado,
            abonos: Array.isArray(g.abonos) ? g.abonos : []
        });
    });

    // 2. Deudas
    (f.deudas || []).forEach(function(d, idx) {
        normalizarDeuda(d);
        var esFlex = !!(d.esFlexible || d.tipoFrecuencia === 'libre');
        var precioTot = Number(d.precioTotal) || 0;
        var rest = Number(d.montoRestante) || 0;
        var abonado = Math.max(0, Math.round((precioTot - rest) * 100) / 100);
        var prio = d.planPrioridad || (esFlex ? 'media' : 'alta');
        var orden = (d.planOrden != null) ? Number(d.planOrden) : (200 + idx);
        var proxCuota = esFlex ? null : (d.cuotas || []).find(function(c) { return !c.pagada; });
        var subD = '';
        if (esFlex) {
            var numAbF = Array.isArray(d.abonosLibres) ? d.abonosLibres.length : 0;
            subD = d.pagada
                ? ('Deuda flexible 100% liquidada (' + numAbF + ' abono' + (numAbF === 1 ? '' : 's') + ')')
                : ('🌊 Deuda flexible a tu ritmo · ' + numAbF + ' abono' + (numAbF === 1 ? '' : 's') + ' registrado' + (numAbF === 1 ? '' : 's'));
        } else {
            subD = d.pagada
                ? ('Crédito 100% liquidado (' + d.cuotasTotal + '/' + d.cuotasTotal + ' cuotas)')
                : ('Cuotas: ' + d.cuotasPagadas + '/' + d.cuotasTotal + (proxCuota ? (' · Próx #' + proxCuota.num + ': $' + Number(proxCuota.monto).toFixed(2) + (proxCuota.fecha ? (' (' + formatearFechaCorta(proxCuota.fecha) + ')') : '')) : ''));
        }

        items.push({
            uid: 'deuda:' + d.id,
            tipo: 'deuda',
            id: d.id,
            titulo: d.nombre || 'Deuda',
            categoria: d.categoria || 'Deuda',
            icono: d.iconoCategoria || '🛡️',
            subDetalle: subD,
            nota: '',
            prioridad: prio,
            orden: orden,
            totalUsd: Math.round(precioTot * 100) / 100,
            abonadoUsd: abonado,
            restanteUsd: Math.round(rest * 100) / 100,
            completo: !!d.pagada,
            abonos: Array.isArray(d.abonosLibres) ? d.abonosLibres : [],
            proxCuotaMonto: proxCuota ? Math.max(0, Math.round((Number(proxCuota.monto) - (Number(proxCuota.montoAbonado) || 0)) * 100) / 100) : 0
        });
    });

    // 3. Compras / Ítems Planeados
    (f.planificacionCompras || []).forEach(function(c, idx) {
        var est = normalizarCompraPlanificada(c);
        var prio = c.prioridad || 'media';
        var orden = (c.orden != null) ? Number(c.orden) : (300 + idx);
        var subC = c.fechaLimite ? ('Meta: ' + formatearFechaCorta(c.fechaLimite)) : 'Compra / meta en planificación';
        items.push({
            uid: 'compra:' + c.id,
            tipo: 'compra',
            id: c.id,
            titulo: c.titulo || 'Compra Planeada',
            categoria: c.categoria || 'Compras',
            icono: c.icono || '🛒',
            subDetalle: subC,
            nota: c.nota || '',
            prioridad: prio,
            orden: orden,
            totalUsd: est.total,
            abonadoUsd: est.abonado,
            restanteUsd: est.restante,
            completo: !!c.comprado,
            abonos: Array.isArray(c.abonos) ? c.abonos : []
        });
    });

    // Ordenar pendientes primero por prioridad y luego orden explícito
    items.sort(function(a, b) {
        if (a.completo !== b.completo) return a.completo ? 1 : -1;
        var pa = obtenerPesoPrioridadPlan(a.prioridad);
        var pb = obtenerPesoPrioridadPlan(b.prioridad);
        if (pa !== pb) return pa - pb;
        return (a.orden || 0) - (b.orden || 0);
    });

    return items;
}

function actualizarBadgePlanificacionFinanzas(fin) {
    var badge = document.getElementById('badge-finanzas-planificacion-pend');
    if (!badge) return;
    var items = construirItemsPlanificacion(fin);
    var pend = items.filter(function(it) { return !it.completo; }).length;
    if (pend > 0) {
        badge.textContent = String(pend);
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

function cambiarFiltroPlanificacionUI(filtro) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.filtroPlanificacion = filtro || 'todos';
    renderizarPlanificacionFinanzas();
}

function moverPrioridadItemPlanificacion(tipo, id, delta) {
    var fin = APP_STATE && APP_STATE.finanzas;
    if (!fin) return;
    var pendientes = construirItemsPlanificacion(fin).filter(function(x) { return !x.completo; });
    var idx = pendientes.findIndex(function(x) { return x.tipo === tipo && x.id === id; });
    if (idx === -1) return;
    var targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= pendientes.length) return;

    var actual = pendientes[idx];
    var vecino = pendientes[targetIdx];

    // Alinear prioridad con el vecino y asignar orden secuencial claro a todos los pendientes
    var nuevoPrio = vecino.prioridad;
    var temp = pendientes[idx];
    pendientes[idx] = pendientes[targetIdx];
    pendientes[targetIdx] = temp;

    pendientes.forEach(function(item, i) {
        var nuevoOrden = (i + 1) * 10;
        if (item.tipo === 'gasto') {
            var g = (fin.gastos || []).find(function(x) { return x.id === item.id; });
            if (g) {
                g.planOrden = nuevoOrden;
                if (item.id === id && delta !== 0) g.planPrioridad = nuevoPrio;
                g.fechaActualizacion = Date.now();
            }
        } else if (item.tipo === 'deuda') {
            var d = (fin.deudas || []).find(function(x) { return x.id === item.id; });
            if (d) {
                d.planOrden = nuevoOrden;
                if (item.id === id && delta !== 0) d.planPrioridad = nuevoPrio;
                d.fechaActualizacion = Date.now();
            }
        } else if (item.tipo === 'compra') {
            var c = (fin.planificacionCompras || []).find(function(x) { return x.id === item.id; });
            if (c) {
                c.orden = nuevoOrden;
                if (item.id === id && delta !== 0) c.prioridad = nuevoPrio;
                c.fechaActualizacion = Date.now();
            }
        }
    });

    MonarcaDB.save(APP_STATE);
    renderizarPlanificacionFinanzas();
}

function renderizarPlanificacionFinanzas() {
    var cont = document.getElementById('contenedor-planificacion-finanzas-root');
    var fin = (APP_STATE && APP_STATE.finanzas) || DEFAULT_STATE.finanzas;
    actualizarBadgePlanificacionFinanzas(fin);
    if (!cont) return;

    var cache = leerCacheTasasBCV();
    var tasaBcv = Number(cache && cache.usd) || 0;
    var disp = obtenerDisponibleParaPlanificacion(fin, cache);
    var todosItems = construirItemsPlanificacion(fin);

    var totalPlanUsd = 0;
    var totalAbonadoUsd = 0;
    var totalFaltaUsd = 0;
    var poolSim = disp.disponibleHoyUsd;
    var countCubribles = 0;

    todosItems.forEach(function(it) {
        totalPlanUsd += it.totalUsd;
        totalAbonadoUsd += it.abonadoUsd;
        totalFaltaUsd += it.restanteUsd;

        if (it.completo) {
            it.alcance = { estado: 'completo', montoCubrible: 0, restanteDespues: poolSim };
        } else if (poolSim >= it.restanteUsd - 0.009 && it.restanteUsd > 0) {
            var sobraDespues = Math.max(0, Math.round((poolSim - it.restanteUsd) * 100) / 100);
            it.alcance = { estado: 'completo_disponible', montoCubrible: it.restanteUsd, restanteDespues: sobraDespues };
            poolSim = sobraDespues;
            countCubribles++;
        } else if (poolSim > 0.009) {
            it.alcance = { estado: 'parcial', montoCubrible: Math.round(poolSim * 100) / 100, falta: Math.round((it.restanteUsd - poolSim) * 100) / 100 };
            poolSim = 0;
            countCubribles++;
        } else {
            it.alcance = { estado: 'espera', montoCubrible: 0, falta: it.restanteUsd };
        }
    });

    totalPlanUsd = Math.round(totalPlanUsd * 100) / 100;
    totalAbonadoUsd = Math.round(totalAbonadoUsd * 100) / 100;
    totalFaltaUsd = Math.round(totalFaltaUsd * 100) / 100;
    var pctGlobal = totalPlanUsd > 0 ? Math.min(100, Math.round((totalAbonadoUsd / totalPlanUsd) * 100)) : 0;

    var diffPlan = Math.round((disp.disponibleHoyUsd - totalFaltaUsd) * 100) / 100;
    var diffColor = diffPlan >= 0 ? '#34d399' : '#fbbf24';
    var diffLabel = diffPlan >= 0 ? 'Sobrante tras Plan' : 'Falta por Cobrar';
    var diffValorTxt = diffPlan >= 0 ? ('+$' + diffPlan.toFixed(2)) : ('-$' + Math.abs(diffPlan).toFixed(2));
    var diffSubTxt = diffPlan >= 0
        ? '¡Cubres el 100% de tu plan!'
        : (disp.pendientePorCobrarMesUsd > 0 ? ('Por cobrar este mes: $' + disp.pendientePorCobrarMesUsd.toFixed(2)) : 'Pendiente de próximos ingresos');

    var dispSubParts = [];
    if (disp.cantidadTarjetas > 0) dispSubParts.push('Tarjetas: ' + formatearUsdTarjeta(disp.enTarjetasUsd));
    if (Math.abs(disp.cajaSinTarjetaUsd) > 0.005) dispSubParts.push('Caja: ' + (disp.cajaSinTarjetaUsd >= 0 ? '$' : '-$') + Math.abs(disp.cajaSinTarjetaUsd).toFixed(2));
    if (dispSubParts.length === 0) dispSubParts.push('Marca cobros o agrega saldo en Tarjetas');

    var kpiHtml = `
        <div class="plan-kpi-grid">
            <div class="plan-kpi-box" style="border-top: 2px solid #10b981;">
                <div class="plan-kpi-label">Disponible Hoy</div>
                <div class="plan-kpi-value" style="color: #34d399;">$${disp.disponibleHoyUsd.toFixed(2)}</div>
                <div class="plan-kpi-sub">${dispSubParts.join(' · ')}</div>
            </div>
            <div class="plan-kpi-box" style="border-top: 2px solid #a855f7;">
                <div class="plan-kpi-label">Plan Total</div>
                <div class="plan-kpi-value" style="color: #e9d5ff;">$${totalPlanUsd.toFixed(2)}</div>
                <div class="plan-kpi-sub">Abonado: $${totalAbonadoUsd.toFixed(2)}</div>
            </div>
            <div class="plan-kpi-box" style="border-top: 2px solid #f59e0b;">
                <div class="plan-kpi-label">Por Pagar / Comprar</div>
                <div class="plan-kpi-value" style="color: #fbbf24;">$${totalFaltaUsd.toFixed(2)}</div>
                <div class="plan-kpi-sub">${tasaBcv > 0 ? ('≈ ' + formatearTasaBsDisplay(totalFaltaUsd * tasaBcv, 2) + ' BCV') : 'Sin tasa BCV en caché'}</div>
            </div>
            <div class="plan-kpi-box" style="border-top: 2px solid #38bdf8;">
                <div class="plan-kpi-label">${diffLabel}</div>
                <div class="plan-kpi-value" style="color: ${diffColor};">${diffValorTxt}</div>
                <div class="plan-kpi-sub">${diffSubTxt}</div>
            </div>
        </div>
        <div class="plan-global-progress-card">
            <div class="plan-global-progress-top">
                <span><strong>Progreso del Plan:</strong> ${pctGlobal}% cubierto ($${totalAbonadoUsd.toFixed(2)} de $${totalPlanUsd.toFixed(2)})</span>
                <span style="color: #34d399; font-weight: 700;">${countCubribles} ${countCubribles === 1 ? 'ítem cubrible hoy' : 'ítems cubribles hoy'}</span>
            </div>
            <div class="plan-progress-track">
                <div class="plan-progress-fill" style="width: ${pctGlobal}%; background: linear-gradient(90deg, #a855f7, #10b981);"></div>
            </div>
        </div>`;

    var filtroAct = (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.filtroPlanificacion) || 'todos';
    var filtrosDef = [
        { k: 'todos', lbl: '📋 Pendientes (' + todosItems.filter(function(x) { return !x.completo; }).length + ')' },
        { k: 'cubribles', lbl: '🟢 Alcanza Hoy (' + countCubribles + ')' },
        { k: 'gasto', lbl: '📅 Gastos Prog.' },
        { k: 'deuda', lbl: '🛡️ Deudas' },
        { k: 'compra', lbl: '🛒 Compras' },
        { k: 'completados', lbl: '✅ Completados (' + todosItems.filter(function(x) { return x.completo; }).length + ')' }
    ];

    var filtrosHtml = '<div class="plan-filtros-bar">' + filtrosDef.map(function(fDef) {
        return '<button type="button" class="plan-filtro-pill ' + (filtroAct === fDef.k ? 'active' : '') + '" onclick="cambiarFiltroPlanificacionUI(\'' + fDef.k + '\')">' + fDef.lbl + '</button>';
    }).join('') + '</div>';

    var listaFiltrada = todosItems.filter(function(it) {
        if (filtroAct === 'completados') return it.completo;
        if (filtroAct === 'todos') return !it.completo;
        if (filtroAct === 'cubribles') return !it.completo && (it.alcance.estado === 'completo_disponible' || it.alcance.estado === 'parcial');
        return !it.completo && it.tipo === filtroAct;
    });

    if (listaFiltrada.length === 0) {
        var emptyHtml = `
            <div class="finanzas-empty-hint" style="margin-top: 8px;">
                <div style="font-size: 28px; margin-bottom: 8px;">📋</div>
                <div style="font-weight: 700; color: #f8fafc; font-size: 14px;">${filtroAct === 'completados' ? 'Aún no has completado pagos o compras en tu planificación' : 'Sin ítems pendientes en este filtro'}</div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 6px; line-height: 1.45;">
                    Agrega una <strong>🛒 Compra / Plan</strong>, un <strong>📅 Gasto Programado</strong> o una <strong>🛡️ Deuda</strong> con los botones superiores para planificar tus pagos con lo que vayas cobrando.
                </div>
            </div>`;
        cont.innerHTML = kpiHtml + filtrosHtml + emptyHtml;
        return;
    }

    var cardsHtml = listaFiltrada.map(function(it) {
        var pct = it.totalUsd > 0 ? Math.min(100, Math.round((it.abonadoUsd / it.totalUsd) * 100)) : (it.completo ? 100 : 0);
        var tipoBadge = it.tipo === 'gasto'
            ? '<span class="plan-tipo-pill tipo-gasto">📅 Gasto Prog.</span>'
            : (it.tipo === 'deuda'
                ? '<span class="plan-tipo-pill tipo-deuda">🛡️ Deuda</span>'
                : '<span class="plan-tipo-pill tipo-compra">🛒 Compra Planeada</span>');
        var prioBadge = construirEtiquetaPrioridadPlan(it.prioridad);
        var prioHtml = `<span style="padding:3px 8px;border-radius:9999px;font-size:10.5px;font-weight:700;background:${prioBadge.bg};color:${prioBadge.color};border:1px solid ${prioBadge.border};">${prioBadge.texto}</span>`;

        var cardCls = 'plan-item-card' + (it.completo ? ' plan-completo' : (it.alcance.estado === 'completo_disponible' ? ' plan-cubrible' : ''));

        var alcanceHtml = '';
        if (it.completo) {
            alcanceHtml = `<div class="plan-alcance-banner alc-completo"><span>✅ ${it.tipo === 'compra' ? '¡Comprado al 100%!' : '¡Pagado / Liquidado al 100%!'}</span><span>$0.00 restante</span></div>`;
        } else if (it.alcance.estado === 'completo_disponible') {
            alcanceHtml = `<div class="plan-alcance-banner alc-completo"><span>🟢 Te alcanza completo hoy ($${it.restanteUsd.toFixed(2)})</span><span>Quedaría $${it.alcance.restanteDespues.toFixed(2)}</span></div>`;
        } else if (it.alcance.estado === 'parcial') {
            alcanceHtml = `<div class="plan-alcance-banner alc-parcial"><span>🟡 Puedes abonar $${it.alcance.montoCubrible.toFixed(2)} ahora</span><span>Faltaría $${it.alcance.falta.toFixed(2)}</span></div>`;
        } else {
            alcanceHtml = `<div class="plan-alcance-banner alc-espera"><span>⏳ Esperando próximo cobro</span><span>Falta $${it.restanteUsd.toFixed(2)}</span></div>`;
        }

        var bsRestTxt = tasaBcv > 0 ? ('<div style="font-size:10px;color:#64748b;">≈ ' + formatearTasaBsDisplay(it.restanteUsd * tasaBcv, 2) + '</div>') : '';

        var controlsPrio = '';
        if (!it.completo) {
            controlsPrio += `<button type="button" class="plan-mini-btn" title="Subir prioridad" onclick="moverPrioridadItemPlanificacion('${it.tipo}','${it.id}',-1)">▲</button>`;
            controlsPrio += `<button type="button" class="plan-mini-btn" title="Bajar prioridad" onclick="moverPrioridadItemPlanificacion('${it.tipo}','${it.id}',1)">▼</button>`;
        }
        if (it.tipo === 'compra') {
            controlsPrio += `<button type="button" class="plan-mini-btn" title="Editar compra" onclick="abrirModalCompraPlanificada('${it.id}')">✎</button>`;
            controlsPrio += `<button type="button" class="plan-mini-btn" style="color:#f87171;border-color:rgba(248,113,113,0.3);" title="Eliminar" onclick="eliminarCompraPlanificada('${it.id}')">✕</button>`;
        }

        var btnsHtml = '';
        if (!it.completo) {
            var lblFull = it.tipo === 'compra'
                ? ('🛒 Comprar ($' + it.restanteUsd.toFixed(2) + ')')
                : ('✅ Pagar Todo ($' + it.restanteUsd.toFixed(2) + ')');
            btnsHtml = `
                <div class="plan-actions-row">
                    <button type="button" class="plan-action-btn btn-abonar" onclick="abrirModalAbonoPlanificacion('${it.tipo}','${it.id}','abono')">💵 Abonar</button>
                    <button type="button" class="plan-action-btn btn-pagar-todo" onclick="abrirModalAbonoPlanificacion('${it.tipo}','${it.id}','completo')">${lblFull}</button>
                </div>`;
        }

        var histHtml = '';
        if (Array.isArray(it.abonos) && it.abonos.length > 0) {
            var ultAbonos = it.abonos.slice().reverse().slice(0, 4);
            histHtml = '<div class="plan-abonos-hist">' + ultAbonos.map(function(ab) {
                var trjObj = ab.tarjetaId ? asegurarArrayTarjetasFinanzas().find(function(x) { return x.id === ab.tarjetaId; }) : null;
                var srcTxt = trjObj ? (' · ' + escaparHTML(obtenerInfoBancoTarjeta(trjObj.banco).nombre)) : ' · Caja';
                var fTxt = ab.fecha ? formatearFechaCorta(String(ab.fecha).slice(0, 10)) : '';
                return `<div class="plan-abono-row">
                    <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escaparHTML(ab.nota || 'Abono')}${srcTxt} (${fTxt})</span>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <strong style="color:#34d399;white-space:nowrap;">$${(Number(ab.montoUsd) || 0).toFixed(2)}</strong>
                        <button type="button" class="plan-undo-mini-btn" title="Deshacer este abono" onclick="revertirAbonoPlanificacion('${it.tipo}','${it.id}','${ab.id}')">↩</button>
                    </div>
                </div>`;
            }).join('') + '</div>';
        }

        return `
        <div class="${cardCls}">
            <div class="plan-item-header">
                <div class="plan-item-title-wrap">
                    <div class="plan-item-title">${it.icono} ${escaparHTML(it.titulo)}</div>
                    <div class="plan-item-badges">
                        ${tipoBadge}
                        ${prioHtml}
                        <span style="font-size:11px;color:#94a3b8;">${escaparHTML(it.subDetalle)}</span>
                    </div>
                    ${it.nota ? ('<div style="font-size:11px;color:#64748b;margin-top:4px;">📝 ' + escaparHTML(it.nota) + '</div>') : ''}
                </div>
                <div class="plan-prio-controls">${controlsPrio}</div>
            </div>

            <div class="plan-amounts-row">
                <div class="plan-amt-cell">
                    <div class="plan-amt-lbl">Total</div>
                    <div class="plan-amt-val" style="color:#f8fafc;">$${it.totalUsd.toFixed(2)}</div>
                </div>
                <div class="plan-amt-cell">
                    <div class="plan-amt-lbl">Abonado</div>
                    <div class="plan-amt-val" style="color:#34d399;">$${it.abonadoUsd.toFixed(2)}</div>
                </div>
                <div class="plan-amt-cell">
                    <div class="plan-amt-lbl">Falta</div>
                    <div class="plan-amt-val" style="color:${it.restanteUsd > 0 ? '#fbbf24' : '#34d399'};">$${it.restanteUsd.toFixed(2)}</div>
                    ${bsRestTxt}
                </div>
            </div>

            <div class="plan-progress-track">
                <div class="plan-progress-fill" style="width:${pct}%;background:${it.completo ? '#10b981' : 'linear-gradient(90deg,#38bdf8,#a855f7)'};"></div>
            </div>

            ${alcanceHtml}
            ${btnsHtml}
            ${histHtml}
        </div>`;
    }).join('');

    cont.innerHTML = kpiHtml + filtrosHtml + '<div class="plan-items-list">' + cardsHtml + '</div>';
}

function poblarSelectCategoriasCompraPlan() {
    var sel = document.getElementById('modal-plan-compra-categoria');
    if (!sel) return;
    var base = ['Compras', 'Moto & Transporte', 'Inversión & Trabajo', 'Vivienda', 'Servicios', 'Salud', 'Otros'];
    var cats = (APP_STATE && APP_STATE.finanzas && Array.isArray(APP_STATE.finanzas.categoriasGastos))
        ? APP_STATE.finanzas.categoriasGastos.map(function(c) { return c.nombre; })
        : [];
    var unicas = Array.from(new Set(base.concat(cats)));
    sel.innerHTML = unicas.map(function(nombre) {
        return '<option value="' + escaparHTML(nombre) + '">' + escaparHTML(nombre) + '</option>';
    }).join('');
}

var _planSugerenciasCache = [];

function abrirModalCompraPlanificada(idOpcional) {
    var modal = document.getElementById('modal-planificacion-compra');
    if (!modal) return;
    poblarSelectCategoriasCompraPlan();

    var inId = document.getElementById('modal-plan-compra-id');
    var titEl = document.getElementById('modal-plan-compra-titulo-el');
    var inNom = document.getElementById('modal-plan-compra-nombre');
    var inMon = document.getElementById('modal-plan-compra-monto');
    var selPrio = document.getElementById('modal-plan-compra-prioridad');
    var selCat = document.getElementById('modal-plan-compra-categoria');
    var inFec = document.getElementById('modal-plan-compra-fecha');
    var inNot = document.getElementById('modal-plan-compra-nota');
    var impWrap = document.getElementById('modal-plan-compra-import-wrap');
    var impChips = document.getElementById('modal-plan-compra-import-chips');

    var lista = asegurarArrayComprasPlanificacion();
    var ex = idOpcional ? lista.find(function(x) { return x.id === idOpcional; }) : null;

    if (ex) {
        if (titEl) titEl.textContent = 'EDITAR COMPRA / ÍTEM PLANEADO';
        if (inId) inId.value = ex.id;
        if (inNom) inNom.value = ex.titulo || '';
        if (inMon) inMon.value = Number(ex.precioTotal || 0).toFixed(2);
        if (selPrio) selPrio.value = ex.prioridad || 'media';
        if (selCat) selCat.value = ex.categoria || 'Compras';
        if (inFec) inFec.value = ex.fechaLimite || '';
        if (inNot) inNot.value = ex.nota || '';
        if (impWrap) impWrap.style.display = 'none';
    } else {
        if (titEl) titEl.textContent = 'NUEVA COMPRA / ÍTEM PLANEADO';
        if (inId) inId.value = '';
        if (inNom) inNom.value = '';
        if (inMon) inMon.value = '';
        if (selPrio) selPrio.value = 'media';
        if (selCat) selCat.value = 'Compras';
        if (inFec) inFec.value = '';
        if (inNot) inNot.value = '';

        _planSugerenciasCache = [];
        var f = (APP_STATE && APP_STATE.finanzas) || {};
        (f.comparacionesAhorro || []).forEach(function(item) {
            if (item && item.nombre && Number(item.precio) > 0) {
                _planSugerenciasCache.push({ nombre: item.nombre, monto: Number(item.precio), cat: 'Compras' });
            }
        });
        (f.metas || []).forEach(function(m) {
            var falt = Math.max(0, (Number(m.metaTotal) || 0) - (Number(m.ahorrado) || 0));
            if (m && m.nombre && falt > 0) {
                _planSugerenciasCache.push({ nombre: m.nombre, monto: Math.round(falt * 100) / 100, cat: 'Inversión & Trabajo' });
            }
        });
        if (impWrap && impChips) {
            if (_planSugerenciasCache.length > 0) {
                impWrap.style.display = 'block';
                impChips.innerHTML = _planSugerenciasCache.slice(0, 6).map(function(s, i) {
                    return '<button type="button" class="plan-filtro-pill" style="padding:4px 9px;font-size:11px;" onclick="rellenarCompraDesdeSugerencia(' + i + ')">+ ' + escaparHTML(s.nombre) + ' ($' + s.monto.toFixed(2) + ')</button>';
                }).join('');
            } else {
                impWrap.style.display = 'none';
            }
        }
    }

    modal.style.display = 'flex';
}

function rellenarCompraDesdeSugerencia(idx) {
    var s = _planSugerenciasCache[idx];
    if (!s) return;
    var inNom = document.getElementById('modal-plan-compra-nombre');
    var inMon = document.getElementById('modal-plan-compra-monto');
    var selCat = document.getElementById('modal-plan-compra-categoria');
    if (inNom) inNom.value = s.nombre;
    if (inMon) inMon.value = Number(s.monto).toFixed(2);
    if (selCat && s.cat) selCat.value = s.cat;
}

function cerrarModalCompraPlanificada() {
    var m = document.getElementById('modal-planificacion-compra');
    if (m) m.style.display = 'none';
}

function confirmarGuardarCompraPlanificada() {
    var inId = document.getElementById('modal-plan-compra-id');
    var inNom = document.getElementById('modal-plan-compra-nombre');
    var inMon = document.getElementById('modal-plan-compra-monto');
    var selPrio = document.getElementById('modal-plan-compra-prioridad');
    var selCat = document.getElementById('modal-plan-compra-categoria');
    var inFec = document.getElementById('modal-plan-compra-fecha');
    var inNot = document.getElementById('modal-plan-compra-nota');

    var titulo = inNom ? inNom.value.trim() : '';
    var precio = parseFloat(inMon ? inMon.value : '0');
    if (!titulo || isNaN(precio) || precio <= 0) {
        alert('Ingresa el nombre y un precio o monto objetivo mayor a 0.');
        return;
    }
    precio = Math.round(precio * 100) / 100;

    var lista = asegurarArrayComprasPlanificacion();
    var editId = inId ? inId.value.trim() : '';
    var now = Date.now();

    if (editId) {
        var ex = lista.find(function(x) { return x.id === editId; });
        if (!ex) return;
        ex.titulo = titulo;
        ex.precioTotal = precio;
        ex.prioridad = selPrio ? selPrio.value : 'media';
        ex.categoria = selCat ? selCat.value : 'Compras';
        ex.fechaLimite = inFec ? inFec.value : '';
        ex.nota = inNot ? inNot.value.trim() : '';
        normalizarCompraPlanificada(ex);
        ex.fechaActualizacion = now;
    } else {
        lista.push({
            id: 'PLC-' + now,
            titulo: titulo,
            categoria: selCat ? selCat.value : 'Compras',
            icono: '🛒',
            precioTotal: precio,
            prioridad: selPrio ? selPrio.value : 'media',
            orden: (lista.length + 1) * 10 + 300,
            fechaLimite: inFec ? inFec.value : '',
            nota: inNot ? inNot.value.trim() : '',
            abonos: [],
            montoAbonado: 0,
            comprado: false,
            fechaComprado: null,
            timestamp: now,
            fechaActualizacion: now
        });
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalCompraPlanificada();
    renderizarPlanificacionFinanzas();
}

function eliminarCompraPlanificada(id) {
    if (!confirm('¿Eliminar esta compra de tu planificación?')) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('finanzas_planificacionCompras', id);
    }
    var lista = asegurarArrayComprasPlanificacion();
    APP_STATE.finanzas.planificacionCompras = lista.filter(function(c) { return c.id !== id; });
    MonarcaDB.save(APP_STATE);
    renderizarPlanificacionFinanzas();
}

function buscarItemPlanificacionPorClave(tipo, id) {
    var fin = (APP_STATE && APP_STATE.finanzas) || DEFAULT_STATE.finanzas;
    return construirItemsPlanificacion(fin).find(function(x) { return x.tipo === tipo && x.id === id; }) || null;
}

function abrirModalAbonoPlanificacion(tipo, id, modo) {
    var item = buscarItemPlanificacionPorClave(tipo, id);
    if (!item || item.restanteUsd <= 0) return;

    var modal = document.getElementById('modal-planificacion-abono');
    if (!modal) return;
    if (typeof poblarSelectsTarjetasFinanzas === 'function') poblarSelectsTarjetasFinanzas();

    var inTipo = document.getElementById('modal-plan-abono-tipo');
    var inId = document.getElementById('modal-plan-abono-id');
    var inModo = document.getElementById('modal-plan-abono-modo');
    var tit = document.getElementById('modal-plan-abono-titulo-modal');
    var resEl = document.getElementById('modal-plan-abono-resumen');
    var inMonto = document.getElementById('modal-plan-abono-monto');
    var selMon = document.getElementById('modal-plan-abono-moneda');
    var selTarj = document.getElementById('modal-plan-abono-tarjeta');
    var inNota = document.getElementById('modal-plan-abono-nota');
    var btnConf = document.getElementById('btn-confirmar-plan-abono');

    if (inTipo) inTipo.value = tipo;
    if (inId) inId.value = id;
    if (inModo) inModo.value = modo || 'abono';
    if (tit) {
        tit.textContent = modo === 'completo'
            ? (tipo === 'compra' ? 'COMPRAR ÍTEM PLANEADO' : 'PAGAR TOTAL PENDIENTE')
            : 'ABONAR A PLANIFICACIÓN';
    }
    if (btnConf) {
        btnConf.textContent = modo === 'completo'
            ? (tipo === 'compra' ? '✓ Confirmar Compra ($' + item.restanteUsd.toFixed(2) + ')' : '✓ Pagar Completo ($' + item.restanteUsd.toFixed(2) + ')')
            : '✓ Registrar Abono';
    }
    if (resEl) {
        resEl.innerHTML = '<strong>' + item.icono + ' ' + escaparHTML(item.titulo) + '</strong><br>' +
            'Total: <strong>$' + item.totalUsd.toFixed(2) + '</strong> · Abonado: <strong style="color:#34d399;">$' + item.abonadoUsd.toFixed(2) + '</strong> · Restante: <strong style="color:#fbbf24;">$' + item.restanteUsd.toFixed(2) + '</strong>';
    }
    if (selMon) selMon.value = 'USD';
    if (inMonto) {
        var sugerido = (modo === 'completo') ? item.restanteUsd : ((item.tipo === 'deuda' && item.proxCuotaMonto > 0) ? Math.min(item.restanteUsd, item.proxCuotaMonto) : item.restanteUsd);
        inMonto.value = Number(sugerido).toFixed(2);
    }
    if (selTarj) {
        var tarjetas = asegurarArrayTarjetasFinanzas();
        selTarj.value = (tipo === 'gasto' && (APP_STATE.finanzas.gastos || []).some(function(g) { return g.id === id && g.tarjetaId && tarjetas.some(function(t) { return t.id === g.tarjetaId; }); }))
            ? (APP_STATE.finanzas.gastos.find(function(g) { return g.id === id; }).tarjetaId)
            : '';
    }
    if (inNota) inNota.value = '';

    alCambiarInputAbonoPlanificacion();
    modal.style.display = 'flex';
}

function cerrarModalAbonoPlanificacion() {
    var m = document.getElementById('modal-planificacion-abono');
    if (m) m.style.display = 'none';
}

function autocompletarMontoAbonoPlan(factor) {
    var inTipo = document.getElementById('modal-plan-abono-tipo');
    var inId = document.getElementById('modal-plan-abono-id');
    var selMon = document.getElementById('modal-plan-abono-moneda');
    var inMonto = document.getElementById('modal-plan-abono-monto');
    var selTarj = document.getElementById('modal-plan-abono-tarjeta');
    var item = buscarItemPlanificacionPorClave(inTipo ? inTipo.value : '', inId ? inId.value : '');
    if (!item || !inMonto) return;

    var usdCalc = Math.max(0.01, Math.round((item.restanteUsd * (Number(factor) || 1)) * 100) / 100);
    var mon = selMon ? selMon.value : 'USD';
    if (mon === 'VES') {
        var trjId = selTarj ? selTarj.value : '';
        var tasa = obtenerTasaReferenciaAbonoPlan(trjId).valor;
        if (tasa > 0) {
            inMonto.value = (usdCalc * tasa).toFixed(2);
        } else {
            inMonto.value = usdCalc.toFixed(2);
            if (selMon) selMon.value = 'USD';
        }
    } else {
        inMonto.value = usdCalc.toFixed(2);
    }
    alCambiarInputAbonoPlanificacion();
}

function obtenerTasaReferenciaAbonoPlan(tarjetaId) {
    var cache = leerCacheTasasBCV();
    if (tarjetaId) {
        var t = asegurarArrayTarjetasFinanzas().find(function(x) { return x.id === tarjetaId; });
        if (t) return obtenerTasaParaTarjeta(t.tasaTipo, cache);
    }
    return obtenerTasaParaTarjeta('bcv', cache);
}

function alCambiarInputAbonoPlanificacion() {
    var prev = document.getElementById('preview-modal-plan-abono');
    if (!prev) return;

    var inTipo = document.getElementById('modal-plan-abono-tipo');
    var inId = document.getElementById('modal-plan-abono-id');
    var inMonto = document.getElementById('modal-plan-abono-monto');
    var selMon = document.getElementById('modal-plan-abono-moneda');
    var selTarj = document.getElementById('modal-plan-abono-tarjeta');

    var item = buscarItemPlanificacionPorClave(inTipo ? inTipo.value : '', inId ? inId.value : '');
    if (!item) return;

    var montoIn = Math.max(0, parseFloat(inMonto ? inMonto.value : '0') || 0);
    var mon = selMon ? selMon.value : 'USD';
    var trjId = selTarj ? selTarj.value : '';
    var tasaInfo = obtenerTasaReferenciaAbonoPlan(trjId);

    var usdEq = (mon === 'VES' && tasaInfo.valor > 0) ? (montoIn / tasaInfo.valor) : montoIn;
    usdEq = Math.round(usdEq * 100) / 100;

    if (mon === 'VES' && !tasaInfo.valor) {
        prev.textContent = '⚠️ Sin tasa API en caché para convertir Bs. a $. Cambia a $ USD o actualiza las tasas.';
        return;
    }

    var usdAplicado = Math.min(item.restanteUsd, usdEq);
    var nuevoRest = Math.max(0, Math.round((item.restanteUsd - usdAplicado) * 100) / 100);
    var msgTasa = tasaInfo.valor > 0
        ? (' (' + formatearTasaBsDisplay(usdAplicado * tasaInfo.valor, 2) + ' a ' + escaparHTML(tasaInfo.label) + ' ' + Number(tasaInfo.valor).toFixed(2) + ')')
        : '';

    var trjMsg = '';
    if (trjId) {
        var t = asegurarArrayTarjetasFinanzas().find(function(x) { return x.id === trjId; });
        if (t) {
            var est = calcularEstadoTarjetaEnVivo(t);
            if (est.monedaBase === 'USD') {
                trjMsg = '<br>Saldrán <strong style="color:#fbbf24;">-$' + usdAplicado.toFixed(2) + ' USDT</strong> de ' + escaparHTML(construirTituloTarjeta(t)) + '.';
            } else {
                trjMsg = '<br>Saldrán <strong style="color:#7dd3fc;">-' + formatearTasaBsDisplay(usdAplicado * est.tasaActual, 2) + '</strong> de ' + escaparHTML(construirTituloTarjeta(t)) + '.';
            }
        }
    }

    prev.innerHTML = 'Abono: <strong style="color:#34d399;">$' + usdAplicado.toFixed(2) + '</strong>' + msgTasa +
        ' · Quedará pendiente: <strong>$' + nuevoRest.toFixed(2) + '</strong>' + trjMsg;
}

function confirmarAbonoPlanificacion() {
    var inTipo = document.getElementById('modal-plan-abono-tipo');
    var inId = document.getElementById('modal-plan-abono-id');
    var inMonto = document.getElementById('modal-plan-abono-monto');
    var selMon = document.getElementById('modal-plan-abono-moneda');
    var selTarj = document.getElementById('modal-plan-abono-tarjeta');
    var inNota = document.getElementById('modal-plan-abono-nota');

    var tipo = inTipo ? inTipo.value : '';
    var id = inId ? inId.value : '';
    var mon = selMon ? selMon.value : 'USD';
    var trjId = selTarj ? selTarj.value : '';
    var montoIn = parseFloat(inMonto ? inMonto.value : '0');
    var nota = inNota ? inNota.value.trim() : '';

    var item = buscarItemPlanificacionPorClave(tipo, id);
    if (!item) return;

    if (isNaN(montoIn) || montoIn <= 0) {
        alert('Ingresa un monto mayor a 0.');
        return;
    }

    var tasaInfo = obtenerTasaReferenciaAbonoPlan(trjId);
    if (mon === 'VES' && !tasaInfo.valor) {
        alert('Se requiere una tasa vigente del API para registrar pagos en Bolívares.');
        return;
    }

    var usdEq = (mon === 'VES') ? (montoIn / tasaInfo.valor) : montoIn;
    var usdAplicado = Math.min(item.restanteUsd, Math.round(usdEq * 100) / 100);
    if (usdAplicado <= 0) {
        alert('Este ítem ya está cubierto en su totalidad.');
        return;
    }

    var now = Date.now();
    var abonoId = 'PLA-' + now;
    var movCard = null;
    if (trjId && typeof aplicarMovimientoEnTarjeta === 'function') {
        movCard = aplicarMovimientoEnTarjeta(trjId, 'retiro', usdAplicado, 'USD', (tipo === 'compra' ? 'Compra: ' : 'Abono: ') + item.titulo, abonoId);
        if (!movCard) {
            alert('No se pudo descontar de la tarjeta seleccionada.');
            return;
        }
    }

    var tasaUsada = movCard ? movCard.tasaUsada : (tasaInfo.valor || 0);
    var abonoObj = {
        id: abonoId,
        montoUsd: usdAplicado,
        montoBs: tasaUsada > 0 ? Math.round((usdAplicado * tasaUsada) * 100) / 100 : 0,
        tasaUsada: tasaUsada,
        tasaLabel: tasaInfo.label || 'BCV USD',
        tarjetaId: trjId || null,
        deltaNativo: movCard ? movCard.deltaNativo : 0,
        deltaUsdRef: movCard ? movCard.deltaUsdRef : 0,
        nota: nota || (usdAplicado >= item.restanteUsd - 0.009 ? (tipo === 'compra' ? 'Compra realizada' : 'Pago total') : 'Abono parcial'),
        fecha: new Date().toISOString()
    };

    var fin = APP_STATE.finanzas;
    if (tipo === 'gasto') {
        var g = (fin.gastos || []).find(function(x) { return x.id === id; });
        if (!g) return;
        if (!Array.isArray(g.abonos)) g.abonos = [];
        g.abonos.push(abonoObj);
        normalizarAbonosGasto(g);
        g.fechaActualizacion = now;
    } else if (tipo === 'deuda') {
        var d = (fin.deudas || []).find(function(x) { return x.id === id; });
        if (!d) return;
        if (!Array.isArray(d.abonosLibres)) d.abonosLibres = [];
        d.abonosLibres.push(abonoObj);
        normalizarDeuda(d);
        d.fechaActualizacion = now;
    } else if (tipo === 'compra') {
        var c = (fin.planificacionCompras || []).find(function(x) { return x.id === id; });
        if (!c) return;
        if (!Array.isArray(c.abonos)) c.abonos = [];
        c.abonos.push(abonoObj);
        normalizarCompraPlanificada(c);
        c.fechaActualizacion = now;
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalAbonoPlanificacion();
    renderizarFinanzas(APP_STATE.finanzas);
}

function revertirAbonoPlanificacion(tipo, id, abonoId) {
    if (!APP_STATE || !APP_STATE.finanzas) return;
    var fin = APP_STATE.finanzas;
    var obj = null;
    var arr = null;

    if (tipo === 'gasto') {
        obj = (fin.gastos || []).find(function(x) { return x.id === id; });
        arr = obj && obj.abonos;
    } else if (tipo === 'deuda') {
        obj = (fin.deudas || []).find(function(x) { return x.id === id; });
        arr = obj && obj.abonosLibres;
    } else if (tipo === 'compra') {
        obj = (fin.planificacionCompras || []).find(function(x) { return x.id === id; });
        arr = obj && obj.abonos;
    }
    if (!obj || !Array.isArray(arr)) return;

    var ab = arr.find(function(x) { return x.id === abonoId; });
    if (!ab) return;

    if (ab.tarjetaId && ab.deltaNativo && typeof revertirMovimientoEnTarjeta === 'function') {
        revertirMovimientoEnTarjeta(ab.tarjetaId, false, ab.deltaNativo, ab.deltaUsdRef, ab.id);
    }

    var filtrado = arr.filter(function(x) { return x.id !== abonoId; });
    if (tipo === 'gasto') {
        obj.abonos = filtrado;
        normalizarAbonosGasto(obj);
    } else if (tipo === 'deuda') {
        obj.abonosLibres = filtrado;
        normalizarDeuda(obj);
    } else if (tipo === 'compra') {
        obj.abonos = filtrado;
        normalizarCompraPlanificada(obj);
    }
    obj.fechaActualizacion = Date.now();

    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

if (typeof window !== 'undefined') {
    window.renderizarPlanificacionFinanzas = renderizarPlanificacionFinanzas;
    window.cambiarFiltroPlanificacionUI = cambiarFiltroPlanificacionUI;
    window.moverPrioridadItemPlanificacion = moverPrioridadItemPlanificacion;
    window.abrirModalCompraPlanificada = abrirModalCompraPlanificada;
    window.rellenarCompraDesdeSugerencia = rellenarCompraDesdeSugerencia;
    window.cerrarModalCompraPlanificada = cerrarModalCompraPlanificada;
    window.confirmarGuardarCompraPlanificada = confirmarGuardarCompraPlanificada;
    window.eliminarCompraPlanificada = eliminarCompraPlanificada;
    window.abrirModalAbonoPlanificacion = abrirModalAbonoPlanificacion;
    window.cerrarModalAbonoPlanificacion = cerrarModalAbonoPlanificacion;
    window.autocompletarMontoAbonoPlan = autocompletarMontoAbonoPlan;
    window.alCambiarInputAbonoPlanificacion = alCambiarInputAbonoPlanificacion;
    window.confirmarAbonoPlanificacion = confirmarAbonoPlanificacion;
    window.revertirAbonoPlanificacion = revertirAbonoPlanificacion;
    window.abrirModalPrestamoGasto = abrirModalPrestamoGasto;
    window.editarIngresoFinanzasUI = editarIngresoFinanzasUI;
    window.editarGastoFinanzasUI = editarGastoFinanzasUI;
    window.establecerModoSplitTarjetasModal = establecerModoSplitTarjetasModal;
    window.toggleModoSplitTarjetasModal = toggleModoSplitTarjetasModal;
    window.agregarFilaSplitTarjetaModal = agregarFilaSplitTarjetaModal;
    window.eliminarFilaSplitTarjetaModal = eliminarFilaSplitTarjetaModal;
    window.alCambiarSplitTarjetasUI = alCambiarSplitTarjetasUI;
    window.actualizarResumenSplitTarjetasUI = actualizarResumenSplitTarjetasUI;
    window.actualizarPreviewMonedaIngreso = actualizarPreviewMonedaIngreso;
    window.actualizarPreviewCobroTarjeta = actualizarPreviewCobroTarjeta;
    window.seleccionarModalidadPrestamoGasto = seleccionarModalidadPrestamoGasto;
    window.agregarPartePrestamoUI = agregarPartePrestamoUI;
    window.eliminarPartePrestamoUI = eliminarPartePrestamoUI;
    window.repartirEquitativoPartesPrestamo = repartirEquitativoPartesPrestamo;
    window.actualizarResumenPartesPrestamoUI = actualizarResumenPartesPrestamoUI;
    window.seleccionarModalidadDeudaModal = seleccionarModalidadDeudaModal;
    window.alCambiarMontoGastoModal = alCambiarMontoGastoModal;
    window.alCambiarValoresModalDeuda = alCambiarValoresModalDeuda;
}
