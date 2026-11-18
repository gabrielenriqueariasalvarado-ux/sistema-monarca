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

function alCambiarCategoriaEnModalGasto() {
    var inCat = document.getElementById('modal-gasto-categoria');
    var inPilar = document.getElementById('modal-gasto-pilar');
    if (!inCat || !inPilar) return;

    var cat = inCat.value.toLowerCase();
    if (cat.indexOf('invers') !== -1 || cat.indexOf('trabajo') !== -1 || cat.indexOf('negocio') !== -1) {
        inPilar.value = 'inversion';
    } else if (cat.indexOf('entretenimiento') !== -1 || cat.indexOf('ocio') !== -1 || cat.indexOf('capricho') !== -1 || cat.indexOf('juego') !== -1 || cat.indexOf('divers') !== -1) {
        inPilar.value = 'caprichos';
    } else {
        inPilar.value = 'gastos';
    }
}

function obtenerPilarGasto(gasto) {
    if (gasto.pilar && (gasto.pilar === 'inversion' || gasto.pilar === 'gastos' || gasto.pilar === 'caprichos')) {
        return gasto.pilar;
    }
    var cat = (gasto.categoria || "").toLowerCase();
    if (cat.indexOf('invers') !== -1 || cat.indexOf('trabajo') !== -1 || cat.indexOf('negocio') !== -1) {
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

    // 4. Almacén -> Exclusivamente ventas y créditos de inventario / mercancía
    if (item.ventaId || item.cuotaId || idStr.indexOf('almacen') !== -1 || idStr.indexOf('inv-') !== -1 || tipoRaw === 'almacen' || tipoRaw === 'credito' || desc.indexOf('almacén') !== -1 || desc.indexOf('almacen') !== -1 || desc.indexOf('producto') !== -1 || desc.indexOf('mercanc') !== -1) {
        var subTxt = item.ventaId ? (item.cuotaId ? 'Crédito Cuota' : 'Venta Contado') : 'Venta';
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

function renderizarFinanzas(fin) {
    var f = fin || APP_STATE.finanzas || DEFAULT_STATE.finanzas;

    // Asegurar estructura de categorías
    if (!f.categoriasGastos || !Array.isArray(f.categoriasGastos) || f.categoriasGastos.length === 0) {
        f.categoriasGastos = JSON.parse(JSON.stringify(DEFAULT_STATE.finanzas.categoriasGastos));
    }

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

    // Renderizar dinámicamente la barra de selector de período con las semanas exactas de este mes
    var barraSemanas = document.getElementById('quincena-selector-bar');
    if (barraSemanas) {
        var htmlBarra = '';
        semanasActivas.forEach(function(sem) {
            var esActivo = (vq === sem.clave);
            htmlBarra += `
                <button class="btn-quincena-tab ${esActivo ? 'active' : ''}" id="btn-vista-${sem.clave}" onclick="cambiarPeriodoFinanzas('${sem.clave}')">
                    <span>🗓️</span> ${sem.etiqueta}
                </button>`;
        });
        var esMesActivo = (vq === 'mes');
        htmlBarra += `
            <button class="btn-quincena-tab ${esMesActivo ? 'active' : ''}" id="btn-vista-mes" onclick="cambiarPeriodoFinanzas('mes')">
                <span>📅</span> Mes Completo
            </button>`;
        barraSemanas.innerHTML = htmlBarra;
    }

    var mesClaveVista = anioActivo + '-' + String(mesActivo + 1).padStart(2, '0');
    function coincideQuincena(dia, fechaStr, itemRef) {
        if (itemRef && itemRef.excepcionesMes && itemRef.excepcionesMes[mesClaveVista]) {
            fechaStr = itemRef.excepcionesMes[mesClaveVista];
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

        if (infoOrigen.tipoDestino === 'almacen') {
            totAlmacen += m;
            countAlmacen++;

            htmlAlmacen += `
            <div class="finanzas-tx-item">
                <div class="finanzas-tx-main">
                    <div class="finanzas-tx-icon" style="color: #f59e0b;">${infoOrigen.icono}</div>
                    <div class="finanzas-tx-details">
                        <div class="finanzas-tx-title">${tituloIngreso}</div>
                        <div class="finanzas-tx-meta" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                            ${infoOrigen.badgeHtml}
                            <span class="badge-cat" style="background: rgba(255, 255, 255, 0.05); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.1);">
                                📅 ${fechaStr}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="finanzas-tx-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                    ${displayMontoHtml}
                    ${badgeCobroHtml}
                    <button class="btn-delete-row" title="Eliminar entrada" onclick="eliminarRegistroFinanzasUI('${item.id}', 'ingreso')">✕</button>
                </div>
            </div>`;
        } else if (infoOrigen.tipoDestino === 'aleatoria') {
            totAleatorios += m;
            countAleatorios++;

            htmlAleatorios += `
            <div class="finanzas-tx-item">
                <div class="finanzas-tx-main">
                    <div class="finanzas-tx-icon" style="color: #38bdf8;">${infoOrigen.icono}</div>
                    <div class="finanzas-tx-details">
                        <div class="finanzas-tx-title">${tituloIngreso}</div>
                        <div class="finanzas-tx-meta" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                            ${infoOrigen.badgeHtml}
                            <span class="badge-cat" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
                                ⚡ ${fechaStr}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="finanzas-tx-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                    ${displayMontoHtml}
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
                    <div class="finanzas-tx-icon" style="color: #34d399;">${infoOrigen.icono}</div>
                    <div class="finanzas-tx-details">
                        <div class="finanzas-tx-title">${tituloIngreso}</div>
                        <div class="finanzas-tx-meta" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                            ${infoOrigen.badgeHtml}
                            <span class="badge-cat" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
                                📅 Cobro Día ${diaNum} de cada mes
                            </span>
                        </div>
                    </div>
                </div>
                <div class="finanzas-tx-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                    ${displayMontoHtml}
                    ${badgeCobroHtml}
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
                var gm = Number(gasto.monto) || 0;
                var gDia = gasto.dia || 16;
                var esOcasG = gasto.tipo === 'ocasional';
                var pilarG = obtenerPilarGasto(gasto);
                var estaPagadoG = !!gasto.pagado;

                var badgeTipoHtml = esOcasG
                    ? `<span class="badge-gasto-ocasional">⚡ ${gasto.fecha || 'Ocasional'}</span>`
                    : `<span class="badge-gasto-programado">📅 Día ${gDia} (Fijo)</span>`;

                var badgePilarHtml = '';
                if (pilarG === 'inversion') badgePilarHtml = `<span class="badge-pilar-inversion">🚀 50% Inversión</span>`;
                else if (pilarG === 'caprichos') badgePilarHtml = `<span class="badge-pilar-caprichos">🎉 10% Caprichos</span>`;
                else badgePilarHtml = `<span class="badge-pilar-gastos">🏠 40% Fijos</span>`;

                var badgePagoHtml = estaPagadoG
                    ? `<span class="badge-ingreso-cobrado">✅ PAGADO</span>
                       <button class="btn-cobrar-ingreso btn-deshacer-cobro" onclick="deshacerPagoGastoUI('${gasto.id}')" title="Desmarcar pago">↩</button>`
                    : `<button class="btn-pagar-deuda" onclick="pagarGastoUI('${gasto.id}')" title="Marcar como pagado / debitado">💳 Marcar Pagado</button>`;

                htmlGrupos += `
                    <div class="finanzas-tx-item" style="background: rgba(255, 255, 255, 0.02); margin-bottom: 6px; ${estaPagadoG ? 'opacity: 0.85;' : ''}">
                        <div class="finanzas-tx-main">
                            <div class="finanzas-tx-details">
                                <div class="finanzas-tx-title" style="${estaPagadoG ? 'color: #f8fafc;' : ''}">${gasto.concepto}</div>
                                <div class="finanzas-tx-meta" style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 3px;">
                                    ${badgeTipoHtml}
                                    ${badgePilarHtml}
                                </div>
                            </div>
                        </div>
                        <div class="finanzas-tx-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                            <div class="finanzas-tx-monto monto-negativo">-$${gm.toFixed(2)}</div>
                            ${badgePagoHtml}
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
    var resDeudas = renderizarDeudasYCronograma(f, vq);
    var totDeudasPendientes = resDeudas.totPendientes;
    var totDeudasPagadas = resDeudas.totPagadas;

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
        var titProy = vq === 'mes' ? 'Fin de Mes' : obtenerTituloPeriodo(vq);
        bProyeccion.innerHTML = `🔮 Proyección ${titProy}: Total Ingresos ($${totIngresosVista.toFixed(2)}) - Compromisos ($${(totGastos + cuotasAbonadasVista + totDeudasPendientes + totDeudasPagadas).toFixed(2)}) = <strong style="color: ${balanceProyectado >= 0 ? '#34d399' : '#f87171'};">${balanceProyectado >= 0 ? '+$' : '-$'}${Math.abs(balanceProyectado).toFixed(2)}</strong>`;
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

    // Sincronizar badge y vista del Calendario Cronológico de Cobros y Pagos
    if (typeof actualizarBadgeCalendarioFinanzas === 'function') {
        actualizarBadgeCalendarioFinanzas(f, anioActivo, mesActivo);
    }
    if (window.ESTADO_FINANZAS && window.ESTADO_FINANZAS.seccionActiva === 'calendario' && typeof renderizarCalendarioFinanzas === 'function') {
        renderizarCalendarioFinanzas();
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

function abrirModalIngreso(tipoPorDefecto, fechaOpcional) {
    var m = document.getElementById('modal-finanzas-ingreso') || document.getElementById('modal-finanza-ingreso');
    if (m) {
        if (fechaOpcional && typeof fechaOpcional === 'string' && fechaOpcional.length >= 10) {
            var inFecha = document.getElementById('modal-ingreso-fecha');
            var inDia = document.getElementById('modal-ingreso-dia');
            if (inFecha) inFecha.value = fechaOpcional.slice(0, 10);
            var diaP = parseInt(fechaOpcional.slice(8, 10), 10);
            if (inDia && !isNaN(diaP)) inDia.value = diaP;
        }
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
    var fecha = (tipo === 'fija') ? "" : (inFecha ? inFecha.value : "");
    if (tipo !== 'fija' && fecha && fecha.length >= 10) {
        var diaParsed = parseInt(fecha.slice(8, 10), 10);
        if (!isNaN(diaParsed)) d = diaParsed;
    }

    if (!f || m <= 0) {
        alert("Completa la fuente/concepto y un monto válido.");
        return;
    }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.ingresos) APP_STATE.finanzas.ingresos = [];

    var nowIng = Date.now();
    var nuevoIngreso = {
        id: "ING-" + nowIng,
        fuente: f,
        tipo: tipo,
        dia: d,
        fecha: fecha,
        monto: m,
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

    // Cambiar al tab correspondiente para ver el nuevo ingreso de inmediato
    if (nuevoIngreso.tipo === 'almacen') {
        cambiarTabIngresos('almacen');
    } else if (nuevoIngreso.tipo === 'aleatoria') {
        cambiarTabIngresos('aleatorios');
    } else {
        cambiarTabIngresos('fijos');
    }
}

function abrirModalGasto(tipoPorDefecto, fechaOpcional) {
    var m = document.getElementById('modal-finanzas-gasto') || document.getElementById('modal-finanza-gasto');
    if (m) {
        if (fechaOpcional && typeof fechaOpcional === 'string' && fechaOpcional.length >= 10) {
            var inFecha = document.getElementById('modal-gasto-fecha');
            var inDia = document.getElementById('modal-gasto-dia');
            if (inFecha) inFecha.value = fechaOpcional.slice(0, 10);
            var diaP = parseInt(fechaOpcional.slice(8, 10), 10);
            if (inDia && !isNaN(diaP)) inDia.value = diaP;
        }
        m.style.display = 'flex';
        poblarSelectCategoriasGastos();
        seleccionarTipoGastoModal(tipoPorDefecto || 'programado');
        alCambiarCategoriaEnModalGasto();
        var inM = document.getElementById('modal-gasto-monto');
        if (inM) alCambiarMontoGastoModal(inM.value);
    }
}

function cerrarModalGasto() {
    var m = document.getElementById('modal-finanzas-gasto') || document.getElementById('modal-finanza-gasto');
    if (m) m.style.display = 'none';
    var box = document.getElementById('contenedor-freno-impulso-modal-gasto');
    if (box) box.style.display = 'none';
}

function confirmarAgregarGasto() {
    var inC = document.getElementById('modal-gasto-categoria') || document.getElementById('modal-gasto-cat');
    var inCp = document.getElementById('modal-gasto-fuente') || document.getElementById('modal-gasto-concepto');
    var inD = document.getElementById('modal-gasto-dia');
    var inFecha = document.getElementById('modal-gasto-fecha');
    var inM = document.getElementById('modal-gasto-monto');
    var inTipo = document.getElementById('modal-gasto-tipo');
    var inPilar = document.getElementById('modal-gasto-pilar');

    var tipo = inTipo ? inTipo.value : 'programado';
    var c = inC ? inC.value : "Otros";
    var cp = inCp ? inCp.value.trim() : "";
    var d = inD ? (Number(inD.value) || 16) : 16;
    var fecha = (tipo === 'programado') ? "" : (inFecha ? inFecha.value : "");
    if (tipo !== 'programado' && fecha && fecha.length >= 10) {
        var diaParsedG = parseInt(fecha.slice(8, 10), 10);
        if (!isNaN(diaParsedG)) d = diaParsedG;
    }
    var m = inM ? (Number(inM.value) || 0) : 0;
    var pilar = inPilar ? inPilar.value : "gastos";

    if (!cp || m <= 0) {
        alert("Completa el concepto del gasto y un monto válido.");
        return;
    }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.gastos) APP_STATE.finanzas.gastos = [];

    var nowGas = Date.now();
    var nuevoGasto = {
        id: "GAS-" + nowGas,
        tipo: tipo,
        categoria: c,
        concepto: cp,
        dia: d,
        fecha: fecha,
        monto: m,
        pilar: pilar,
        pagado: false,
        timestamp: nowGas,
        fechaActualizacion: nowGas
    };

    APP_STATE.finanzas.gastos.push(nuevoGasto);

    if (inCp) inCp.value = "";
    if (inM) inM.value = "";

    MonarcaDB.save(APP_STATE);
    cerrarModalGasto();
    renderizarFinanzas(APP_STATE.finanzas);
}

function pagarGastoUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.gastos) return;
    for (var i = 0; i < APP_STATE.finanzas.gastos.length; i++) {
        if (APP_STATE.finanzas.gastos[i].id === id) {
            APP_STATE.finanzas.gastos[i].pagado = true;
            APP_STATE.finanzas.gastos[i].fechaPago = new Date().toISOString();
            APP_STATE.finanzas.gastos[i].fechaActualizacion = Date.now();
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function deshacerPagoGastoUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.gastos) return;
    for (var i = 0; i < APP_STATE.finanzas.gastos.length; i++) {
        if (APP_STATE.finanzas.gastos[i].id === id) {
            APP_STATE.finanzas.gastos[i].pagado = false;
            delete APP_STATE.finanzas.gastos[i].fechaPago;
            APP_STATE.finanzas.gastos[i].fechaActualizacion = Date.now();
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
    var inTotal = document.getElementById('modal-deuda-precio-total');
    var inIni = document.getElementById('modal-deuda-inicial');
    var inRest = document.getElementById('modal-deuda-restante');
    var inCuotas = document.getElementById('modal-deuda-cuotas');
    var inFrec = document.getElementById('modal-deuda-frecuencia');
    var inCustom = document.getElementById('modal-deuda-dias-custom');
    var inFecha = document.getElementById('modal-deuda-fecha-inicio');
    var labelValor = document.getElementById('label-valor-cada-cuota');
    var textDetalle = document.getElementById('texto-detalle-cronograma-deuda');

    var total = inTotal ? (parseFloat(inTotal.value) || 0) : 0;
    var inicial = inIni ? (parseFloat(inIni.value) || 0) : 0;
    if (inicial > total && total > 0) inicial = total;
    var restante = Math.max(0, total - inicial);

    if (inRest) inRest.value = '$' + restante.toFixed(2);

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

        if (inN) inN.value = '';
        if (inTotal) inTotal.value = '';
        if (inIni) inIni.value = '0.00';
        if (inCuotas) inCuotas.value = '6';
        if (inFrec) inFrec.value = 'quince_ultimo';
        if (grupoCustom) grupoCustom.style.display = 'none';
        if (inCustom) inCustom.value = '';

        var hoy = new Date();
        var y = hoy.getFullYear();
        var mMes = hoy.getMonth();
        var d = hoy.getDate();
        var ultDia = new Date(y, mMes + 1, 0).getDate();
        var sugerida = (d <= 15) ? new Date(y, mMes, 15, 12, 0, 0) : new Date(y, mMes, ultDia, 12, 0, 0);
        if (inFecha) inFecha.value = sugerida.toISOString().slice(0, 10);

        alCambiarValoresModalDeuda();
        setTimeout(function() { if (inN) inN.focus(); }, 120);
    }
}

function cerrarModalDeuda() {
    var m = document.getElementById('modal-finanzas-deuda') || document.getElementById('modal-finanza-deuda');
    if (m) m.style.display = 'none';
}

function confirmarAgregarDeuda() {
    var inN = document.getElementById('modal-deuda-nombre');
    var inCat = document.getElementById('modal-deuda-categoria');
    var inTotal = document.getElementById('modal-deuda-precio-total');
    var inIni = document.getElementById('modal-deuda-inicial');
    var inCuotas = document.getElementById('modal-deuda-cuotas');
    var inFrec = document.getElementById('modal-deuda-frecuencia');
    var inCustom = document.getElementById('modal-deuda-dias-custom');
    var inFecha = document.getElementById('modal-deuda-fecha-inicio');

    var nombre = inN ? inN.value.trim() : '';
    var categoria = inCat ? inCat.value : '📦 Otros Compromisos';
    var total = inTotal ? (parseFloat(inTotal.value) || 0) : 0;
    var inicial = inIni ? (parseFloat(inIni.value) || 0) : 0;
    var numCuotas = inCuotas ? (parseInt(inCuotas.value, 10) || 1) : 1;

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

    if (!nombre) {
        alert('Por favor escribe el nombre de la deuda o crédito (ej: Teléfono Xiaomi, Moto, Préstamo).');
        if (inN) inN.focus();
        return;
    }
    if (total <= 0) {
        alert('Ingresa un precio total válido mayor a 0.');
        if (inTotal) inTotal.focus();
        return;
    }
    if (numCuotas < 1) {
        alert('El número de cuotas debe ser al menos 1.');
        if (inCuotas) inCuotas.focus();
        return;
    }

    var restante = Math.max(0, total - inicial);
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

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.deudas) APP_STATE.finanzas.deudas = [];

    var baseDate = new Date(fechaInicio + 'T12:00:00');
    var nowDeu = Date.now();
    var nuevaDeuda = {
        id: 'DEU-' + nowDeu,
        nombre: nombre,
        categoria: categoria,
        iconoCategoria: categoria.slice(0, 2),
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
        montoTotal: restante,
        dia: isNaN(baseDate.getDate()) ? 15 : baseDate.getDate(),
        pagada: restante <= 0,
        timestamp: nowDeu,
        fechaActualizacion: nowDeu
    };

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

function cobrarIngresoUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.ingresos) return;
    var item = APP_STATE.finanzas.ingresos.find(function(x) { return x.id === id; });
    if (!item) return;

    // Abrir panel/modal para colocar lo que realmente se cobró hoy
    var modal = document.getElementById('modal-confirmar-cobro-ingreso');
    if (modal) {
        var inId = document.getElementById('modal-cobro-ingreso-id');
        var elTitulo = document.getElementById('modal-cobro-ingreso-titulo');
        var elProy = document.getElementById('modal-cobro-ingreso-proyectado');
        var inReal = document.getElementById('modal-cobro-ingreso-real');

        var tit = item.fuente || item.concepto || item.nombre || 'Entrada Fija';
        var mProy = Number(item.monto) || 0;
        var mDefecto = (item.montoCobrado !== undefined && item.montoCobrado !== null && item.montoCobrado !== "")
            ? Number(item.montoCobrado)
            : mProy;

        if (inId) inId.value = id;
        if (elTitulo) elTitulo.innerText = tit;
        if (elProy) elProy.innerText = '$' + mProy.toFixed(2);
        if (inReal) inReal.value = mDefecto.toFixed(2);

        modal.style.display = 'flex';
        setTimeout(function() {
            if (inReal) {
                inReal.focus();
                inReal.select();
            }
        }, 80);
        return;
    }

    // Fallback directo
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
    if (!inId || !inReal) return;

    var id = inId.value;
    var montoVal = parseFloat(inReal.value);
    if (isNaN(montoVal) || montoVal < 0) {
        alert("Por favor ingresa un monto válido mayor o igual a 0.");
        return;
    }
    montoVal = Math.round(montoVal * 100) / 100;

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

        if (existe) {
            existe.cobrado = true;
            existe.tipo = 'fija'; // Pagos programados
            existe.categoria = "Sueldos & Pagos Programados";
            existe.fuente = concepto;
            existe.monto = montoProy;
            existe.montoCobrado = montoVal;
            existe.dia = diaCobro;
            existe.fecha = fechaCobro;
            existe.fechaCobro = new Date().toISOString();
        } else {
            APP_STATE.finanzas.ingresos.push({
                id: idFinanza,
                fuente: concepto,
                tipo: 'fija', // Pagos programados en Finanzas
                categoria: "Sueldos & Pagos Programados",
                monto: montoProy,
                montoCobrado: montoVal,
                dia: diaCobro,
                fecha: fechaCobro,
                cobrado: true,
                fechaCobro: new Date().toISOString()
            });
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

    item.cobrado = true;
    item.montoCobrado = montoVal;
    item.fechaCobro = new Date().toISOString();

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
                item.cobrado = false;
                delete item.montoCobrado;
                delete item.fechaCobro;

                // Sincronizar cuota de venta en Inventario si proviene de una venta a crédito
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

                // Sincronizar con Boom Solutions si es un pago originado allí o vinculado a Boom
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
    if (!d.categoria) d.categoria = '📦 Otros Compromisos';
    if (!d.iconoCategoria) d.iconoCategoria = d.categoria.slice(0, 2);

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
                fechaPago: isPaid ? (d.fechaPago || new Date().toISOString()) : null
            });
        }
        d.cuotas = cuotas;
    }

    var numPagadas = (d.cuotas || []).filter(function(c) { return c.pagada; }).length;
    d.cuotasPagadas = numPagadas;
    var pagadoCuotas = numPagadas * Number(d.montoCuota);
    d.montoRestante = Math.max(0, Number(d.precioTotal) - Number(d.pagoInicial) - pagadoCuotas);
    d.montoTotal = d.montoRestante;
    if (d.cuotasPagadas >= d.cuotasTotal || d.montoRestante <= 0) {
        d.pagada = true;
    } else {
        d.pagada = false;
    }
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

    targetCuota.pagada = true;
    targetCuota.fechaPago = new Date().toISOString();

    normalizarDeuda(deuda);
    deuda.fechaActualizacion = Date.now();
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);

    if (deuda.pagada) {
        alert('🎉 ¡Felicidades! Has liquidado por completo la deuda de "' + deuda.nombre + '".');
    } else {
        alert('💳 Cuota ' + targetCuota.num + ' de ' + deuda.cuotasTotal + ' de "' + deuda.nombre + '" registrada como pagada ($' + Number(targetCuota.monto).toFixed(2) + ').');
    }
}

function pagarDeudaUI(id) {
    pagarCuotaDeudaUI(id, null);
}

function deshacerCuotaDeudaUI(deudaId) {
    solicitarReversionCobro("¿Estás seguro de que deseas revertir la última cuota pagada de esta deuda y devolverla a estado pendiente?", function() {
        if (!APP_STATE.finanzas || !APP_STATE.finanzas.deudas) return;
        var deuda = APP_STATE.finanzas.deudas.find(function(d) { return d.id === deudaId; });
        if (!deuda) return;
        normalizarDeuda(deuda);

        var pagadas = (deuda.cuotas || []).filter(function(c) { return c.pagada; });
        if (pagadas.length === 0) return;

        var ultimaPagada = pagadas[pagadas.length - 1];
        ultimaPagada.pagada = false;
        ultimaPagada.fechaPago = null;

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

    (deuda.cuotas || []).forEach(function(c) {
        c.pagada = true;
        if (!c.fechaPago) c.fechaPago = new Date().toISOString();
    });

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
    if (el.style.display === 'none' || !el.style.display) {
        el.style.display = 'block';
        if (btn) btn.innerHTML = '📅 Ocultar Cronograma ▴';
    } else {
        el.style.display = 'none';
        if (btn) btn.innerHTML = '📅 Ver Cronograma de Cuotas ▾';
    }
}

function renderizarDeudasYCronograma(f, vq) {
    var totPendientes = 0;
    var totPagadas = 0;
    var deudas = f.deudas || [];

    // Normalizar todas las deudas
    deudas.forEach(function(d) { normalizarDeuda(d); });

    // 1. Encontrar la próxima cuota a pagar más urgente
    var todasCuotasPendientes = [];
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    deudas.forEach(function(d) {
        if (d.pagada) return;
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
                    '<div style="font-weight: 700; color: #34d399; font-size: 13.5px;">¡Sin cuotas pendientes por pagar!</div>' +
                    '<div style="font-size: 11.5px; color: #94a3b8;">No tienes deudas activas ni pagos urgentes programados. Excelente control financiero.</div>' +
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

    // 2. Renderizar Tarjetas de Deudas y Cronogramas
    var contDeudas = document.getElementById('lista-deudas-tx');
    if (contDeudas) {
        if (deudas.length === 0) {
            contDeudas.innerHTML = '<div class="finanzas-empty-hint">' +
                'No hay deudas ni créditos registrados. Usa el botón "➕ Nueva Deuda" para registrar compras a crédito, teléfonos o préstamos.' +
            '</div>';
        } else {
            var html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

            deudas.forEach(function(item) {
                var estaPagada = !!item.pagada;
                var precioTot = Number(item.precioTotal) || 0;
                var ini = Number(item.pagoInicial) || 0;
                var rest = Number(item.montoRestante) || 0;
                var montoCuota = Number(item.montoCuota) || 0;
                var numCuotas = Number(item.cuotasTotal) || 1;
                var cuotasPagadas = Number(item.cuotasPagadas) || 0;

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
                    : '<span class="badge-deuda-activa">⏳ ' + cuotasPagadas + ' de ' + numCuotas + ' cuotas</span>';

                // Generar filas del cronograma
                var htmlCuotas = '';
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
                    if (!c.pagada) {
                        if (dDiff < 0) infoFecha += ' <span style="color:#ef4444; font-size:10.5px;">(hace ' + Math.abs(dDiff) + 'd)</span>';
                        else if (dDiff === 0) infoFecha += ' <span style="color:#f59e0b; font-size:10.5px;">(¡Hoy!)</span>';
                        else infoFecha += ' <span style="color:#94a3b8; font-size:10.5px;">(en ' + dDiff + 'd)</span>';
                    }

                    htmlCuotas += '<div class="cronograma-cuota-row ' + (c.pagada ? 'cuota-pagada' : (c.num === cuotasPagadas + 1 ? 'cuota-siguiente' : '')) + '">' +
                        '<div style="display: flex; align-items: center; gap: 8px;">' +
                            '<span style="font-weight: 800; font-size: 12px; color: #f8fafc;">#' + c.num + '</span>' +
                            '<span style="font-size: 12px; color: #cbd5e1;">' + infoFecha + '</span>' +
                        '</div>' +
                        '<div style="display: flex; align-items: center; gap: 8px;">' +
                            '<span style="font-weight: 800; font-size: 12px; color: #38bdf8;">$' + Number(c.monto).toFixed(2) + '</span>' +
                            estadoCuota +
                        '</div>' +
                    '</div>';
                });

                var textoFrecuenciaItem = 'Cada ' + (item.diasFrecuencia || 15) + ' días';
                if (item.tipoFrecuencia === 'quince_ultimo' || item.diasFrecuencia === 'quince_ultimo') {
                    textoFrecuenciaItem = '🗓️ 15 y Último';
                } else if (item.diasFrecuencia == 30) {
                    textoFrecuenciaItem = 'Mensual (30 días)';
                } else if (item.diasFrecuencia == 7) {
                    textoFrecuenciaItem = 'Semanal (7 días)';
                }

                html += '<div class="deuda-card-moderna ' + (estaPagada ? 'deuda-liquidada' : '') + '">' +
                    '<div class="deuda-card-top">' +
                        '<div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">' +
                            '<span style="font-size: 22px; flex-shrink: 0;">' + (item.iconoCategoria || '🛡️') + '</span>' +
                            '<div style="min-width: 0; flex: 1;">' +
                                '<div style="font-size: 14.5px; font-weight: 800; color: #f8fafc; word-break: break-word;">' + escaparHTML(item.nombre) + '</div>' +
                                '<div style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 6px; margin-top: 2px;">' +
                                    '<span>' + escaparHTML(item.categoria || 'Deuda') + '</span>' +
                                    '<span>•</span>' +
                                    '<span>' + textoFrecuenciaItem + '</span>' +
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
                            '<span class="dmb-lbl">Valor Cuota</span>' +
                            '<span class="dmb-val" style="color: #38bdf8;">$' + montoCuota.toFixed(2) + '</span>' +
                        '</div>' +
                        '<div class="deuda-metric-box">' +
                            '<span class="dmb-lbl">Pendiente</span>' +
                            '<span class="dmb-val" style="color: #f87171;">$' + rest.toFixed(2) + '</span>' +
                        '</div>' +
                    '</div>' +

                    // Botón y panel del cronograma
                    '<div style="margin-top: 10px;">' +
                        '<button type="button" id="btn-toggle-crono-' + item.id + '" class="btn-toggle-cronograma" onclick="toggleCronogramaDeudaUI(\'' + item.id + '\')">' +
                            '📅 Ver Cronograma de Cuotas (' + (item.cuotas ? item.cuotas.length : numCuotas) + ') ▾' +
                        '</button>' +
                        '<div id="cronograma-deuda-' + item.id + '" class="cronograma-cuotas-container" style="display: none;">' +
                            htmlCuotas +
                        '</div>' +
                    '</div>' +

                    // Acciones inferiores
                    '<div class="deuda-card-actions">' +
                        (!estaPagada
                            ? '<button type="button" class="btn-pagar-cuota-action" onclick="pagarCuotaDeudaUI(\'' + item.id + '\')">' +
                                '💳 Pagar Cuota ' + (cuotasPagadas + 1) + ' ($' + montoCuota.toFixed(2) + ')' +
                              '</button>'
                            : '<span style="font-size: 12px; color: #34d399; font-weight: 700;">Crédito completamente amortizado ✓</span>') +
                        (cuotasPagadas > 0
                            ? '<button type="button" class="btn-deshacer-cuota-action" onclick="deshacerCuotaDeudaUI(\'' + item.id + '\')" title="Deshacer última cuota pagada">↩ Deshacer Pago</button>'
                            : '') +
                        (!estaPagada && rest > 0
                            ? '<button type="button" class="btn-liquidar-action" onclick="liquidarDeudaCompletaUI(\'' + item.id + '\')" title="Liquidar todo el saldo restante">⚡ Liquidar Todo</button>'
                            : '') +
                    '</div>' +
                '</div>';
            });

            html += '</div>';
            contDeudas.innerHTML = html;
        }
    }

    var totalDeuEl = document.getElementById('label-total-deudas') || document.getElementById('total-deudas-display');
    if (totalDeuEl) totalDeuEl.innerText = '$' + totPendientes.toFixed(2);
    var resDeuEl = document.getElementById('resumen-total-deudas');
    if (resDeuEl) resDeuEl.innerText = '$' + totPendientes.toFixed(2);

    return { totPendientes: totPendientes, totPagadas: totPagadas };
}

function cambiarPeriodoFinanzas(periodo, omitirRender) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    window.ESTADO_FINANZAS.vistaQuincena = periodo || 'mes';

    var barra = document.getElementById('quincena-selector-bar');
    if (barra) {
        var tabs = barra.querySelectorAll('.btn-quincena-tab');
        tabs.forEach(function(b) {
            b.classList.remove('active');
        });
        var btnActivo = document.getElementById('btn-vista-' + periodo);
        if (btnActivo) {
            btnActivo.classList.add('active');
            try {
                btnActivo.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } catch (e) {}
        }
    }

    if (!omitirRender) {
        renderizarFinanzas(APP_STATE.finanzas);
    }
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
    actualizarComparadorFrenoGasto(val, 'contenedor-freno-impulso-modal-gasto');
}

/* ==========================================================================
   MÓDULO: CALENDARIO CRONOLÓGICO DE COBROS Y PAGOS (FINANZAS)
   ========================================================================== */

function cambiarSeccionFinanzas(seccion, omitirRender) {
    if (!window.ESTADO_FINANZAS) window.ESTADO_FINANZAS = {};
    var destino = seccion === 'calendario' ? 'calendario' : 'panel';
    window.ESTADO_FINANZAS.seccionActiva = destino;

    var tabPanel = document.getElementById('tab-finanzas-panel');
    var tabCal = document.getElementById('tab-finanzas-calendario');
    var vistaPanel = document.getElementById('vista-finanzas-panel');
    var vistaCal = document.getElementById('vista-finanzas-calendario');

    if (tabPanel) tabPanel.classList.toggle('active', destino === 'panel');
    if (tabCal) tabCal.classList.toggle('active', destino === 'calendario');
    if (vistaPanel) vistaPanel.style.display = destino === 'panel' ? 'block' : 'none';
    if (vistaCal) vistaCal.style.display = destino === 'calendario' ? 'block' : 'none';

    if (!omitirRender && destino === 'calendario') {
        renderizarCalendarioFinanzas();
    }
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
        var tieneFechaExacta = !!(item.fecha && typeof item.fecha === 'string' && item.fecha.length >= 10);
        var esRecurrente = (info.tipoDestino === 'fija' && !tieneFechaExacta);

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
        var tieneFechaExacta = !!(item.fecha && typeof item.fecha === 'string' && item.fecha.length >= 10);
        var esRecurrente = (item.tipo !== 'ocasional' && !tieneFechaExacta);

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

    // 3. Pagos de Cuotas de Deudas
    (f.deudas || []).forEach(function(deuda) {
        normalizarDeuda(deuda);
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

    var html = '<div class="fin-cal-summary-grid">' +
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

    var partes = nuevaFecha.split('-');
    var nuevoAnio = parseInt(partes[0], 10);
    var nuevoMes = parseInt(partes[1], 10) - 1;
    var nuevoDia = parseInt(partes[2], 10);
    var mesDestinoClave = nuevaFecha.slice(0, 7);
    var now = Date.now();
    var tituloMovido = 'Movimiento';

    if (!APP_STATE || !APP_STATE.finanzas) return;

    function aplicarCambioItemRecurrenteOFijo(item) {
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
                var totalDiasDest = new Date(nuevoAnio, nuevoMes + 1, 0).getDate();
                var diaOriginalClamped = Math.min(Math.max(1, parseInt(item.dia, 10) || 15), totalDiasDest);
                if (mesDestinoClave === mesClaveOrigen && nuevoDia === diaOriginalClamped) {
                    delete item.excepcionesMes[mesClaveOrigen];
                } else {
                    item.excepcionesMes[mesClaveOrigen] = nuevaFecha;
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
        if (!ing) return;
        tituloMovido = ing.fuente || ing.concepto || ing.nombre || 'Cobro';
        aplicarCambioItemRecurrenteOFijo(ing);

        // Si corresponde a cuota de venta a crédito en Inventario, sincronizar también allá
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
        if (!gas) return;
        tituloMovido = gas.concepto || 'Pago';
        aplicarCambioItemRecurrenteOFijo(gas);
    } else if (origen === 'deuda_cuota') {
        var deu = (APP_STATE.finanzas.deudas || []).find(function(x) { return x.id === id; });
        if (!deu) return;
        normalizarDeuda(deu);
        var cuotaTarget = (deu.cuotas || []).find(function(c) { return String(c.num) === String(cuotaNum); });
        if (!cuotaTarget) return;
        cuotaTarget.fecha = nuevaFecha;
        cuotaTarget.reprogramada = true;
        if (Number(deu.cuotasTotal) === 1 || Number(cuotaNum) === 1) {
            deu.dia = nuevoDia;
        }
        deu.fechaActualizacion = now;
        tituloMovido = deu.nombre + ' · Cuota #' + cuotaNum;
    } else {
        return;
    }

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


