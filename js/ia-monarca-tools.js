/**
 * SISTEMA MONARCA · CONECTOR IA 360° & HERRAMIENTAS DE AGENTE (v11.36)
 * Conecta a Emily IA y Monarca Voz (Jarvis) con todos los módulos de la aplicación:
 * 1) Contexto vivo omnisciente (Calendario, Horario, Alertas, Quests, Rutinas, Estado Físico/Mental,
 *    Finanzas/Tarjetas/Tasas, Boom/Barbería/Trainer, Ideas/Auto-PC, Conocimiento, Vocabulario,
 *    Habilidades, Personas, Inventario, Reproductor MP3 y Ruleta Semanal).
 * 2) Function Calling nativo (lectura profunda y ejecución de acciones reales sin bloqueos UI).
 */

(function(global) {
    'use strict';

    var DIAS_SEMANA_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    function _norm(str) {
        try {
            return String(str || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        } catch (e) {
            return String(str || '').toLowerCase().trim();
        }
    }

    function _hoyISO() {
        if (typeof global.obtenerClaveFechaLocal === 'function') {
            return global.obtenerClaveFechaLocal();
        }
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function _horaAhoraHHMM() {
        var d = new Date();
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function _sumarDiasISO(isoBase, deltaDias) {
        var p = String(isoBase || _hoyISO()).slice(0, 10).split('-');
        if (p.length !== 3) return _hoyISO();
        var dt = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
        dt.setDate(dt.getDate() + (Number(deltaDias) || 0));
        return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    }

    function _diaSemanaDeISO(iso) {
        var p = String(iso || _hoyISO()).slice(0, 10).split('-');
        if (p.length !== 3) return new Date().getDay();
        return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getDay();
    }

    function _recortar(txt, maxLen) {
        var s = String(txt || '').replace(/\s+/g, ' ').trim();
        if (!maxLen || s.length <= maxLen) return s;
        return s.slice(0, Math.max(0, maxLen - 1)) + '…';
    }

    function _buscarEnLista(arr, query, getCamposFn) {
        if (!Array.isArray(arr) || !query) return null;
        var qRaw = String(query).trim();
        var qNorm = _norm(qRaw);
        if (!qNorm) return null;

        // 1. Coincidencia exacta por id o nombre completo
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            if (!item) continue;
            if (item.id !== undefined && String(item.id) === qRaw) return item;
            var campos = getCamposFn ? (getCamposFn(item) || []) : [item.titulo || item.nombre || ''];
            for (var c = 0; c < campos.length; c++) {
                if (_norm(campos[c]) === qNorm) return item;
            }
        }
        // 2. Coincidencia parcial normalizada
        for (var j = 0; j < arr.length; j++) {
            var it = arr[j];
            if (!it) continue;
            var cols = getCamposFn ? (getCamposFn(it) || []) : [it.titulo || it.nombre || ''];
            for (var k = 0; k < cols.length; k++) {
                var val = _norm(cols[k]);
                if (val && (val.indexOf(qNorm) !== -1 || qNorm.indexOf(val) !== -1)) return it;
            }
        }
        return null;
    }

    function _limpiarTombstone(coleccion, id) {
        if (!global.APP_STATE || !APP_STATE._eliminados || !Array.isArray(APP_STATE._eliminados[coleccion])) return;
        var sId = String(id);
        APP_STATE._eliminados[coleccion] = APP_STATE._eliminados[coleccion].filter(function(x) {
            return String(x) !== sId;
        });
    }

    function _guardarYRefrescar(modulos) {
        if (typeof global.MonarcaDB !== 'undefined' && typeof global.MonarcaDB.save === 'function' && global.APP_STATE) {
            global.MonarcaDB.save(global.APP_STATE);
        }
        var mods = Array.isArray(modulos) ? modulos : [modulos];
        mods.forEach(function(m) {
            try {
                if (m === 'calendario') {
                    if (typeof global.renderizarCalendario === 'function') global.renderizarCalendario();
                    if (typeof global.programarAlarmasCalendarioNativas === 'function') global.programarAlarmasCalendarioNativas();
                    if (typeof global.verificarDisparadoresCalendario === 'function') global.verificarDisparadoresCalendario();
                } else if (m === 'finanzas') {
                    if (typeof global.renderizarFinanzas === 'function' && global.APP_STATE) global.renderizarFinanzas(global.APP_STATE.finanzas);
                } else if (m === 'quests') {
                    if (typeof global.renderizarQuestsDiarios === 'function') global.renderizarQuestsDiarios();
                    if (typeof global.programarAlarmasNativasQuests === 'function') global.programarAlarmasNativasQuests();
                } else if (m === 'habilidades') {
                    if (typeof global.renderizarHabilidades === 'function' && global.APP_STATE) global.renderizarHabilidades(global.APP_STATE.habilidades);
                } else if (m === 'ideas') {
                    if (typeof global.reRenderVistaIdeasActual === 'function') global.reRenderVistaIdeasActual();
                } else if (m === 'conocimientos') {
                    if (typeof global.renderizarConocimientos === 'function') global.renderizarConocimientos(global.FILTRO_AREA_CONOCIMIENTO || 'Todas');
                } else if (m === 'vocabulario') {
                    if (typeof global.renderizarVocabularioSemanal === 'function') global.renderizarVocabularioSemanal();
                } else if (m === 'inventario') {
                    if (typeof global.filtrarProductosInventario === 'function') global.filtrarProductosInventario();
                    if (typeof global.actualizarMetricasKpisInventario === 'function') global.actualizarMetricasKpisInventario();
                    if (typeof global.renderizarHistorialVentas === 'function') global.renderizarHistorialVentas();
                } else if (m === 'labores') {
                    if (typeof global.renderizarLabores === 'function') global.renderizarLabores();
                } else if (m === 'personas') {
                    if (typeof global.renderizarAgendaPersonas === 'function') global.renderizarAgendaPersonas();
                    if (typeof global.refrescarSelectoresPersonasCalendario === 'function') global.refrescarSelectoresPersonasCalendario();
                } else if (m === 'ruleta') {
                    if (typeof global.renderizarRuletaSemanal === 'function') global.renderizarRuletaSemanal();
                }
            } catch (eRender) {}
        });
        try {
            if (typeof global.actualizarBadgeNotificaciones === 'function') global.actualizarBadgeNotificaciones();
            if (typeof global.renderizarPulsoDiarioHome === 'function') global.renderizarPulsoDiarioHome();
        } catch (eGen) {}
    }

    function _notificarToast(msg, icono) {
        if (typeof global.mostrarToastMonarca === 'function') {
            global.mostrarToastMonarca(msg, icono || '✨');
        }
    }

    function _obtenerAgendaFecha(fechaISO) {
        var hoyISO = _hoyISO();
        var iso = String(fechaISO || hoyISO).slice(0, 10);
        var p = iso.split('-');
        var anio = parseInt(p[0], 10) || new Date().getFullYear();
        var mes0 = Math.max(0, (parseInt(p[1], 10) || 1) - 1);
        var diaNum = parseInt(p[2], 10) || 1;
        var dt = new Date(anio, mes0, diaNum);
        var calDiaIdx = (dt.getDay() + 6) % 7; // 0=Lunes .. 6=Domingo en calendario.js

        var st = global.APP_STATE || {};
        var cal = Array.isArray(st.calendario) ? st.calendario : [];
        var cro = Array.isArray(st.cronogramaSemanal) ? st.cronogramaSemanal : [];

        var destacados = (typeof global.obtenerDestacadosParaFecha === 'function')
            ? global.obtenerDestacadosParaFecha(iso)
            : cal.filter(function(x) { return x && x.tipo === 'destacado' && (x.fecha === iso || (x.repetirAnualmente && x.mesDia === iso.slice(5, 10))); });

        var eventos = (typeof global.obtenerEventosParaFecha === 'function')
            ? global.obtenerEventosParaFecha(iso)
            : cal.filter(function(x) { return x && x.tipo === 'evento' && x.fecha === iso; });

        var recordatorios = (typeof global.obtenerRecordatoriosParaFecha === 'function')
            ? global.obtenerRecordatoriosParaFecha(iso)
            : cal.filter(function(x) { return x && x.tipo === 'recordatorio' && x.fecha === iso; });

        var cronograma = (typeof global.obtenerCronogramaParaDiaSemana === 'function')
            ? global.obtenerCronogramaParaDiaSemana(calDiaIdx)
            : cro.filter(function(b) { return b && Number(b.diaSemana) === calDiaIdx; });

        var boomRaw = (typeof global.obtenerInfoBoomParaDiaCal === 'function')
            ? global.obtenerInfoBoomParaDiaCal(iso)
            : null;
        var boomDia = (boomRaw && boomRaw.diaInfo) ? boomRaw.diaInfo : null;

        var csList = [];
        if (typeof global.obtenerCortesYSesionesDiaCal === 'function') {
            var csRaw = global.obtenerCortesYSesionesDiaCal(iso) || {};
            (csRaw.cortes || []).forEach(function(c) {
                csList.push({ icono: '💈', tipo: 'Barbería', titulo: (c.clienteNombre || 'Cliente') + (c.estiloNombre ? (' · ' + c.estiloNombre) : ''), monto: Number(c.cobro || c.monto) || 0 });
            });
            (csRaw.sesiones || []).forEach(function(s) {
                csList.push({ icono: '🏋️', tipo: 'Trainer', titulo: (s.alumnoNombre || 'Alumno') + (s.enfoqueNombre ? (' · ' + s.enfoqueNombre) : ''), monto: Number(s.cobro || s.monto) || 0 });
            });
            (csRaw.registrosExtra || []).forEach(function(r) {
                csList.push({ icono: '💼', tipo: 'Labor', titulo: r.descripcion || r.laborId || 'Jornada laboral', monto: Number(r.honorarios) || 0 });
            });
        }

        var questsProg = (typeof global.obtenerQuestsProgramadasParaFecha === 'function')
            ? global.obtenerQuestsProgramadasParaFecha(iso, hoyISO)
            : [];

        var personasDia = (typeof global.obtenerPersonasAgendadasParaFecha === 'function')
            ? global.obtenerPersonasAgendadasParaFecha(iso)
            : [];

        var finanzasDia = (typeof global.obtenerFinanzasUnificadasParaDia === 'function')
            ? (global.obtenerFinanzasUnificadasParaDia(anio, mes0, diaNum, iso) || []).slice()
            : [];
        if (boomRaw && boomRaw.pagoBoom) {
            finanzasDia.push({
                icon: '🚀',
                tipo: 'Pago Boom',
                titulo: boomRaw.pagoBoom.titulo,
                monto: boomRaw.pagoBoom.monto,
                completado: !!boomRaw.pagoBoom.cobrado
            });
        }

        return {
            destacados: destacados || [],
            eventos: eventos || [],
            recordatorios: recordatorios || [],
            cronograma: cronograma || [],
            boom: boomDia,
            cortesYSesiones: csList,
            questsProgramadas: questsProg || [],
            personas: personasDia || [],
            finanzas: finanzasDia || []
        };
    }

    function _formatearAgendaDiaLineas(fechaISO, labelPrefijo) {
        var data = _obtenerAgendaFecha(fechaISO);
        var items = [];
        (data.destacados || []).forEach(function(d) {
            items.push('⭐ Destacado: ' + d.titulo + (d.personaNombre ? ' (' + d.personaNombre + ')' : ''));
        });
        (data.eventos || []).forEach(function(ev) {
            var rango = (ev.horaInicio || ev.hora || '--:--') + (ev.horaFin ? ('-' + ev.horaFin) : '');
            items.push('📅 Evento [' + rango + ']: ' + ev.titulo + (ev.completado ? ' [Completado]' : ''));
        });
        (data.recordatorios || []).forEach(function(r) {
            items.push('🔔 Recordatorio [' + (r.hora || '--:--') + ']: ' + r.titulo + (r.completado ? ' [Completado]' : ' [Pendiente]'));
        });
        (data.cronograma || []).forEach(function(b) {
            items.push('🕒 Horario [' + (b.horaInicio || '') + '-' + (b.horaFin || '') + ']: ' + b.titulo + (b.etiqueta ? ' (' + b.etiqueta + ')' : ''));
        });
        (data.questsProgramadas || []).forEach(function(q) {
            items.push('⚔️ Quest [' + (q.hora || '--:--') + ']: ' + q.titulo + (q.completado ? ' [Completada]' : ' [' + (q.pendienteActiva ? 'Activa' : 'Pendiente') + ']'));
        });
        if (data.boom && data.boom.tipo) {
            var turnoTxt = data.boom.tipo === 'domingo_libre' ? 'Domingo Libre'
                : (data.boom.tipo === 'sabado_libre' ? 'Sábado Libre'
                    : ('Turno Boom (' + (data.boom.horas || 8) + 'h)' + (data.boom.cumplido ? ' [Cumplido]' : ' [Pendiente]')));
            items.push('💼 Labor Boom: ' + turnoTxt);
        }
        (data.cortesYSesiones || []).forEach(function(cs) {
            items.push((cs.icono || '🛠️') + ' ' + (cs.titulo || cs.tipo || 'Servicio') + (cs.monto ? (' ($' + Number(cs.monto).toFixed(2) + ')') : ''));
        });
        (data.finanzas || []).forEach(function(f) {
            items.push((f.icon || '💵') + ' ' + (f.tipo || 'Finanza') + ': ' + f.titulo + ' ($' + (Number(f.monto) || 0).toFixed(2) + (f.completado ? ', Pagado/Cobrado' : ', Pendiente') + ')');
        });
        (data.personas || []).forEach(function(p) {
            items.push('👥 Persona objetivo hoy: ' + p.nombre);
        });

        var diaNombre = DIAS_SEMANA_ES[_diaSemanaDeISO(fechaISO)] || '';
        if (items.length === 0) {
            return labelPrefijo + ' (' + diaNombre + ' ' + fechaISO + '): Sin elementos programados.';
        }
        return labelPrefijo + ' (' + diaNombre + ' ' + fechaISO + ', ' + items.length + ' items): ' + items.join(' | ');
    }

    // ==========================================================================
    // 1. CONTEXTO VIVO 360° DE TODO SISTEMA MONARCA
    // ==========================================================================

    function construirContextoCompleto() {
        if (typeof global.APP_STATE !== 'object' || !global.APP_STATE) return '';
        try {
            var st = global.APP_STATE;
            var hoyISO = _hoyISO();
            var horaActual = _horaAhoraHHMM();
            var diaSemanaNom = DIAS_SEMANA_ES[_diaSemanaDeISO(hoyISO)] || '';
            var jug = st.jugador || {};
            var atr = st.atributos || {};

            var bloques = [];
            bloques.push('=== ESTADO VIVO GLOBAL DE SISTEMA MONARCA (' + diaSemanaNom + ' ' + hoyISO + ', ' + horaActual + ') ===');
            bloques.push(
                '• PERFIL: ' + (jug.titulo || 'Gabriel Arias') +
                ' · Nivel ' + (jug.nivel || 1) +
                (jug.rango ? (' · Rango ' + jug.rango) : '') +
                ' · ' + (jug.exp || 0) + '/' + (jug.expMax || 100) + ' EXP' +
                (Object.keys(atr).length ? (' · Atributos: ' + Object.keys(atr).map(function(k) { return k + ':' + atr[k]; }).join(', ')) : '')
            );

            // 1. Alertas activas (Campana)
            var alertas = [];
            if (typeof global.obtenerAlertasSistemaMonarca === 'function') {
                try { alertas = global.obtenerAlertasSistemaMonarca() || []; } catch (eAl) {}
            }
            if (alertas.length > 0) {
                bloques.push('• ALERTAS ACTIVAS EN CAMPANA (' + alertas.length + '): ' +
                    alertas.slice(0, 8).map(function(a) {
                        return '[' + (a.badge || a.tipo || 'Aviso') + '] ' + _recortar(a.titulo, 55);
                    }).join(' | '));
            } else {
                bloques.push('• ALERTAS ACTIVAS EN CAMPANA: 0 (Todo al día).');
            }

            // 2. Agenda de HOY y próximos 3 días
            bloques.push('• AGENDA ' + _formatearAgendaDiaLineas(hoyISO, 'HOY'));
            var proxLineas = [];
            for (var d = 1; d <= 3; d++) {
                var fProx = _sumarDiasISO(hoyISO, d);
                var agProx = _obtenerAgendaFecha(fProx);
                var cntProx = (agProx.eventos ? agProx.eventos.length : 0) +
                    (agProx.recordatorios ? agProx.recordatorios.length : 0) +
                    (agProx.destacados ? agProx.destacados.length : 0) +
                    (agProx.finanzas ? agProx.finanzas.length : 0);
                if (cntProx > 0) {
                    proxLineas.push(_formatearAgendaDiaLineas(fProx, '+' + d + 'd'));
                }
            }
            if (proxLineas.length > 0) {
                bloques.push('• PRÓXIMOS 3 DÍAS:\n  - ' + proxLineas.join('\n  - '));
            }

            // 3. Quests Diarios, Rutinas y Misiones
            var quests = Array.isArray(st.questsDiarios) ? st.questsDiarios : [];
            var qPend = quests.filter(function(q) { return q && q.estado !== 'completada'; });
            var qComp = quests.filter(function(q) { return q && q.estado === 'completada'; });
            bloques.push(
                '• QUESTS DIARIOS: ' + qComp.length + ' completadas hoy, ' + qPend.length + ' pendientes/penalizadas' +
                (qPend.length ? (' -> ' + qPend.slice(0, 12).map(function(q) {
                    var extra = [];
                    if (q.estado && q.estado !== 'pendiente') extra.push(q.estado);
                    if (q.tipoTiempo === 'programada' && q.horaActivacion) extra.push(q.horaActivacion);
                    else if (q.horaLimite && q.horaLimite !== '23:59') extra.push('límite ' + q.horaLimite);
                    if (q.rutinaNombre) extra.push('rutina:' + q.rutinaNombre);
                    return q.titulo + (extra.length ? ' (' + extra.join(', ') + ')' : '');
                }).join(' | ')) : '.')
            );

            var rutinas = Array.isArray(st.rutinas) ? st.rutinas : [];
            if (rutinas.length > 0) {
                bloques.push('• RUTINAS (' + rutinas.length + '): ' + rutinas.slice(0, 8).map(function(r) {
                    return r.nombre + ' [' + (Array.isArray(r.ejercicios) ? r.ejercicios.length : 0) + ' ejs]';
                }).join(', '));
            }
            var misiones = Array.isArray(st.misiones) ? st.misiones : [];
            var mAct = misiones.filter(function(m) { return m && !m.completada && m.estado !== 'completada'; });
            if (misiones.length > 0) {
                bloques.push('• MISIONES: ' + mAct.length + ' activas de ' + misiones.length + (mAct.length ? (' (' + mAct.slice(0, 6).map(function(m) { return m.titulo || m.nombre; }).join(', ') + ')') : ''));
            }

            // 4. Estado Personal (Físico y Mental)
            var met = (typeof global.calcularMetricasPurasSinActualizar === 'function')
                ? (global.calcularMetricasPurasSinActualizar() || {})
                : {};
            var cuerpoPct = Number(met.cuerpo) || (st.fatiga && typeof st.fatiga.promedioHoy === 'number' ? st.fatiga.promedioHoy : 0);
            var mentePct = Number(met.mente) || (st.fatigaMentalDiaria && typeof st.fatigaMentalDiaria.nivel === 'number' ? st.fatigaMentalDiaria.nivel : 0);
            var musculosCargados = [];
            if (st.fatiga && typeof st.fatiga === 'object') {
                Object.keys(st.fatiga).forEach(function(k) {
                    if (k === 'promedioHoy' || k === 'mente') return;
                    var v = Number(st.fatiga[k]);
                    if (v > 0) {
                        var nomM = (global.METADATOS_MUSCULOS && global.METADATOS_MUSCULOS[k] && global.METADATOS_MUSCULOS[k].nombre) || k;
                        musculosCargados.push({ k: nomM, v: Math.round(v) });
                    }
                });
                musculosCargados.sort(function(a, b) { return b.v - a.v; });
            }
            var menteCargada = [];
            if (st.desgasteMente && typeof st.desgasteMente === 'object') {
                Object.keys(st.desgasteMente).forEach(function(k) {
                    var v = Number(st.desgasteMente[k]);
                    if (v > 0) menteCargada.push({ k: k, v: Math.round(v) });
                });
                menteCargada.sort(function(a, b) { return b.v - a.v; });
            }
            var suenoRes = '';
            if (typeof global.calcularProximoDespertarYHoraDormir === 'function') {
                try {
                    var cs = global.calcularProximoDespertarYHoraDormir();
                    if (cs) {
                        if (st.sueno && st.sueno.sesionActiva) {
                            suenoRes = ' | 🌙 Durmiendo desde ' + (st.sueno.sesionActiva.horaDormir || 'noche');
                        } else if (cs.horaDormirTxt) {
                            suenoRes = ' | Sueño meta: acostarse ' + cs.horaDormirTxt;
                        }
                    }
                } catch (eSu) {}
            }
            bloques.push(
                '• ESTADO PERSONAL: Desgaste físico ' + cuerpoPct + '% | Desgaste mental ' + mentePct + '%' +
                suenoRes +
                (musculosCargados.length ? (' · Músculos cargados: ' + musculosCargados.slice(0, 5).map(function(m) { return m.k + ' ' + m.v + '%'; }).join(', ')) : '') +
                (menteCargada.length ? (' · Áreas mentales: ' + menteCargada.slice(0, 4).map(function(m) { return m.k + ' ' + m.v + '%'; }).join(', ')) : '')
            );

            // 5. Finanzas en vivo
            var fin = st.finanzas || {};
            var tasas = (typeof global.leerCacheTasasBCV === 'function') ? (global.leerCacheTasasBCV() || {}) : {};
            var tarjetas = Array.isArray(fin.tarjetas) ? fin.tarjetas : [];
            var resTrj = (typeof global.obtenerResumenGlobalTarjetas === 'function') ? global.obtenerResumenGlobalTarjetas(tasas) : null;
            var detalleTarjetas = tarjetas.slice(0, 8).map(function(t) {
                var est = (typeof global.calcularEstadoTarjetaEnVivo === 'function') ? global.calcularEstadoTarjetaEnVivo(t, tasas) : null;
                var nom = (typeof global.construirTituloTarjeta === 'function') ? global.construirTituloTarjeta(t) : (t.alias || t.banco || 'Cuenta');
                var conDatos = (typeof global.tieneDatosPagoConfiguradosTarjeta === 'function' && global.tieneDatosPagoConfiguradosTarjeta(t)) ? ' [✓ datos pago]' : '';
                if (!est) return nom + conDatos;
                return est.monedaBase === 'VES'
                    ? (nom + ': Bs. ' + (est.saldoBs || 0).toFixed(2) + ' (~$' + (est.valorActualUsd || 0).toFixed(2) + ')' + conDatos)
                    : (nom + ': $' + (est.valorActualUsd || 0).toFixed(2) + conDatos);
            });

            var mesActual = hoyISO.slice(0, 7);
            var ingMes = (fin.ingresos || []).filter(function(x) { return x && (!x.fecha || String(x.fecha).slice(0, 7) === mesActual || x.tipo === 'fija'); });
            var ingCobrado = 0, ingPend = 0;
            ingMes.forEach(function(i) { var val = Number(i.cobrado ? (i.montoCobrado || i.monto) : i.monto) || 0; if (i.cobrado) ingCobrado += val; else ingPend += val; });

            var gasMes = (fin.gastos || []).filter(function(x) { return x && (!x.fecha || String(x.fecha).slice(0, 7) === mesActual || x.tipo === 'programado'); });
            var gasPagado = 0, gasPend = 0;
            gasMes.forEach(function(g) { var val = Number(g.monto) || 0; if (g.pagado) gasPagado += val; else gasPend += val; });

            var deudasAct = (fin.deudas || []).filter(function(d) { return d && !d.pagada; });
            var metasFin = Array.isArray(fin.metas) ? fin.metas : [];
            var comprasPend = (fin.planificacionCompras || []).filter(function(c) { return c && !c.comprado; });
            var retrasos = (typeof global.obtenerRetrasosFinanzas === 'function') ? (global.obtenerRetrasosFinanzas(fin) || []) : [];

            var tasasStr = [];
            if (Number(tasas.usd) > 0) tasasStr.push('BCV:' + Number(tasas.usd).toFixed(2));
            if (Number(tasas.eur) > 0) tasasStr.push('EUR:' + Number(tasas.eur).toFixed(2));
            if (Number(tasas.paralelo) > 0) tasasStr.push('Par:' + Number(tasas.paralelo).toFixed(2));

            bloques.push(
                '• FINANZAS: Disponible total tarjetas ~$' + (resTrj ? Number(resTrj.totalUsdHoy || 0).toFixed(2) : '0.00') +
                (tasasStr.length ? (' · Tasas(' + tasasStr.join(', ') + ')') : '') +
                (detalleTarjetas.length ? (' · Cuentas[' + detalleTarjetas.join(' | ') + ']') : '') +
                ' · Mes ' + mesActual + ': Ingresos cobrados $' + ingCobrado.toFixed(2) + ' / por cobrar $' + ingPend.toFixed(2) +
                ' | Gastos pagados $' + gasPagado.toFixed(2) + ' / por pagar $' + gasPend.toFixed(2) +
                (retrasos.length ? (' | ⚠️ Retrasos vencidos: ' + retrasos.length) : '') +
                (deudasAct.length ? (' | Deudas activas: ' + deudasAct.length) : '') +
                (comprasPend.length ? (' | Compras planeadas: ' + comprasPend.length) : '') +
                (metasFin.length ? (' | Metas: ' + metasFin.slice(0, 5).map(function(m) {
                    return (m.nombre || 'Meta') + ' $' + (Number(m.ahorrado) || 0).toFixed(0) + '/$' + (Number(m.metaTotal || m.objetivo) || 0).toFixed(0);
                }).join(', ')) : '')
            );

            // 6. Labores (Boom, Barbería, Trainer)
            var subLabores = [];
            if (st.subappBoom) {
                var planBoom = (st.subappBoom.planificaciones && st.subappBoom.planificaciones[mesActual]) || null;
                if (planBoom && planBoom.dias) {
                    var diasVals = Object.keys(planBoom.dias).map(function(k) { return planBoom.dias[k]; });
                    var cum = diasVals.filter(function(d) { return d && d.cumplido; }).length;
                    var lab = diasVals.filter(function(d) { return d && d.tipo !== 'domingo_libre' && d.tipo !== 'sabado_libre'; }).length;
                    var pc = planBoom.pagosCobrados || {};
                    subLabores.push('Boom(' + mesActual + ': ' + cum + '/' + lab + ' días, pagos: B3=' + (pc.bono3 ? 'Sí' : 'No') + ', Q1=' + (pc.quincena1 ? 'Sí' : 'No') + ', Q2=' + (pc.quincena2 ? 'Sí' : 'No') + ')');
                }
            }
            if (st.subappBarberia) {
                var barb = st.subappBarberia;
                var cortesHoy = (barb.cortes || []).filter(function(c) { return c && String(c.fecha || '').slice(0, 10) === hoyISO; }).length;
                subLabores.push('Barbería(' + (barb.timerActivo ? ('⏱ Corte EN CURSO con ' + (barb.timerActivo.clienteNombre || 'cliente') + ', ') : '') + cortesHoy + ' cortes hoy, ' + (barb.clientes || []).length + ' clientes)');
            }
            if (st.subappTrainer) {
                var tr = st.subappTrainer;
                var actTr = Array.isArray(tr.sesionesActivas) ? tr.sesionesActivas : [];
                subLabores.push('Trainer(' + (actTr.length ? (actTr.length + ' sesión activa: ' + actTr.map(function(s) { return (s.alumnoNombre || 'Atleta') + '·' + (s.enfoque || ''); }).join(', ') + ', ') : '') + (tr.alumnos || []).length + ' alumnos, ' + (tr.rutinasEnfoques || []).length + ' enfoques)');
            }
            var regsLab = Array.isArray(st.registrosLabores) ? st.registrosLabores : [];
            if (regsLab.length > 0) {
                subLabores.push('Última jornada: ' + _recortar(regsLab[0].descripcion || regsLab[0].laborId, 45) + ' (' + regsLab[0].fecha + ')');
            }
            if (subLabores.length) bloques.push('• LABORES: ' + subLabores.join(' | '));

            // 7. Ideas, Auto-PC, Conocimiento, Vocabulario
            var ideasPend = (st.ideas || []).filter(function(i) { return i && !i.hecha; });
            var resAutoPC = (typeof global.obtenerResumenMonitoreoAutoPC === 'function') ? global.obtenerResumenMonitoreoAutoPC() : null;
            var apcCola = (resAutoPC && resAutoPC.cola) ? resAutoPC.cola : {};
            var apcPend = Number(apcCola.pending) || 0;
            var apcRun = Number(apcCola.running) || 0;
            var apcPlan = (resAutoPC && resAutoPC.planPendiente) ? 1 : 0;
            var autopcTxt = resAutoPC
                ? ('Auto-PC[estado:' + (resAutoPC.badgeTexto || resAutoPC.nivel || 'idle') + ', pend:' + apcPend + ', ejecutando:' + apcRun + (apcPlan ? ', PLAN ESPERANDO APROBACIÓN' : '') + ']')
                : '';
            bloques.push(
                '• IDEAS & AUTO-PC: ' + ideasPend.length + ' pendientes' +
                (autopcTxt ? (' · ' + autopcTxt) : '') +
                (ideasPend.length ? (' · Recientes: ' + ideasPend.slice(0, 5).map(function(i) { return '[' + (i.categoria || 'Idea') + '] ' + _recortar(i.textoPrompt || i.texto, 45); }).join(' | ')) : '')
            );

            var cons = Array.isArray(st.conocimientos) ? st.conocimientos : [];
            var consPend = cons.filter(function(c) { return c && !c.revisadoEstaSemana; });
            var voc = Array.isArray(st.vocabulario) ? st.vocabulario : [];
            var vocSem = voc.filter(function(v) { return v && !v.dominada && v.enSemanaActual !== false; });
            if (cons.length || voc.length) {
                bloques.push(
                    '• CONOCIMIENTO & VOCABULARIO: ' + cons.length + ' técnicas (' + consPend.length + ' por repasar esta semana)' +
                    (voc.length ? (' · Vocabulario en práctica (' + vocSem.length + '): ' + vocSem.slice(0, 8).map(function(v) { return v.palabra + '(' + (v.usosSemana || 0) + '/' + (v.metaSemanal || 3) + ')'; }).join(', ')) : '')
                );
            }

            // 8. Habilidades, Personas, Inventario, Reproductor MP3, Ruleta
            var habs = Array.isArray(st.habilidades) ? st.habilidades : [];
            if (habs.length) {
                bloques.push('• HABILIDADES (' + habs.length + '): ' + habs.slice(0, 8).map(function(h) {
                    var hrs = Number(h.horasTotales) || 0;
                    var r = (typeof global.calcularRangoYProgreso === 'function') ? global.calcularRangoYProgreso(hrs).rango : '';
                    return h.nombre + ' (' + hrs.toFixed(1) + 'h' + (r ? ' ' + r : '') + ')';
                }).join(', '));
            }

            var pers = Array.isArray(st.agendaPersonas) ? st.agendaPersonas : [];
            if (pers.length) {
                bloques.push('• PERSONAS (' + pers.length + ' contactos): ' + pers.slice(0, 6).map(function(p) {
                    var pendT = Array.isArray(p.temasPendientes) ? p.temasPendientes.filter(function(t) { return !t.hecho; }).length : 0;
                    return p.nombre + (p.rol ? ' (' + p.rol + ')' : '') + (pendT > 0 ? ' [' + pendT + ' temas]' : '');
                }).join(', '));
            }

            var inv = st.inventario || {};
            var prods = Array.isArray(inv.productos) ? inv.productos : [];
            var ventasInv = Array.isArray(inv.ventas) ? inv.ventas : [];
            var bajoStock = prods.filter(function(p) { return p && Number(p.stock) <= 3; });
            if (prods.length || ventasInv.length) {
                var muestraInv = (bajoStock.length ? bajoStock : prods).slice(0, 4).map(function(p) {
                    return p.nombre + ' (' + (Number(p.stock) || 0) + ' uds)';
                }).join(', ');
                bloques.push(
                    '• INVENTARIO: ' + prods.length + ' productos (' + bajoStock.length + ' con stock <=3' +
                    (bajoStock.length ? ': ' + muestraInv : (muestraInv ? ', ej: ' + muestraInv : '')) + '), ' +
                    ventasInv.length + ' ventas registradas.'
                );
            }

            if (global.MonarcaPlayer && typeof global.MonarcaPlayer.getState === 'function') {
                var pState = global.MonarcaPlayer.getState() || {};
                var songs = typeof global.MonarcaPlayer.getCanciones === 'function' ? (global.MonarcaPlayer.getCanciones() || []) : [];
                var playlists = typeof global.MonarcaPlayer.getPlaylists === 'function' ? (global.MonarcaPlayer.getPlaylists() || []) : [];
                var actual = pState.cancionActual;
                bloques.push(
                    '• REPRODUCTOR MP3: ' + (actual ? ((pState.reproduciendo ? '▶️ Sonando: ' : '⏸️ En pausa: ') + (actual.titulo || actual.nombre) + (actual.artista ? (' - ' + actual.artista) : '')) : 'Sin pista activa') +
                    ' · ' + songs.length + ' canciones · ' + playlists.length + ' playlists' +
                    (playlists.length ? (' (' + playlists.slice(0, 6).map(function(pl) { return pl.nombre; }).join(', ') + ')') : '')
                );
            }

            if (st.ruletaSemanal && st.ruletaSemanal.seleccionActiva) {
                var selR = st.ruletaSemanal.seleccionActiva;
                bloques.push('• RULETA SEMANAL ACTIVA: Comida="' + (selR.comida || '-') + '", Vestimenta="' + (selR.vestimenta || '-') + '", Música="' + (selR.musica || '-') + '"');
            }

            bloques.push('INSTRUCCIÓN DEL SISTEMA MONARCA: Ya cuentas con el pulso vivo completo arriba. Usa tus herramientas (function calling) siempre que necesites detalles profundos (listas completas, movimientos bancarios, canciones, personas, inventario, fechas futuras) O cuando el usuario pida crear, completar, registrar, reproducir, girar ruleta o abrir una pantalla del sistema. Reporta solo datos exactos obtenidos del contexto o herramientas.');
            return bloques.join('\n');
        } catch (e) {
            return '';
        }
    }

    // ==========================================================================
    // 2. DECLARACIONES DE HERRAMIENTAS PARA GEMINI INTERACTIONS API (v1beta)
    // ==========================================================================

    var HERRAMIENTAS_LECTURA = [
        {
            type: 'function',
            name: 'monarca_consultar_agenda',
            description: 'Consulta en detalle la agenda del Calendario unificado (eventos, recordatorios, destacados, horario semanal, turnos Boom, cortes/sesiones, pagos/cobros y alertas activas) para una fecha o rango de días.',
            parameters: {
                type: 'object',
                properties: {
                    fecha_inicio: { type: 'string', description: 'Fecha inicial YYYY-MM-DD (opcional, por defecto hoy).' },
                    dias: { type: 'integer', description: 'Cantidad de días a consultar desde fecha_inicio (1 a 14, por defecto 3).' },
                    incluir_cronograma_semanal: { type: 'boolean', description: 'Si true, incluye todos los bloques recurrentes del horario semanal (Domingo a Sábado).' },
                    incluir_alertas: { type: 'boolean', description: 'Si true, incluye detalle completo de las alertas activas en la campana.' }
                }
            }
        },
        {
            type: 'function',
            name: 'monarca_consultar_finanzas',
            description: 'Consulta información financiera detallada: saldos vivos e historial reciente de tarjetas/cuentas, tasas BCV/Euro/Paralelo, ingresos, gastos, deudas/préstamos, metas, planificación de compras y pagos/cobros retrasados.',
            parameters: {
                type: 'object',
                properties: {
                    seccion: {
                        type: 'string',
                        enum: ['resumen', 'tarjetas', 'ingresos', 'gastos', 'deudas', 'metas', 'compras', 'retrasos', 'todo'],
                        description: 'Qué bloque financiero inspeccionar (por defecto resumen).'
                    },
                    mes: { type: 'string', description: 'Mes YYYY-MM para filtrar movimientos (opcional, por defecto mes actual).' },
                    busqueda: { type: 'string', description: 'Texto para filtrar por concepto, tarjeta o categoría (opcional).' },
                    limite: { type: 'integer', description: 'Máximo de registros a devolver (por defecto 20).' }
                }
            }
        },
        {
            type: 'function',
            name: 'monarca_consultar_modulo',
            description: 'Inspecciona en profundidad cualquier módulo específico de Sistema Monarca (quests, rutinas, ejercicios, misiones, habilidades, estado_personal, labores, boom, barberia, trainer, ideas, autopc, conocimientos, vocabulario, personas, inventario, reproductor, ruleta).',
            parameters: {
                type: 'object',
                properties: {
                    modulo: {
                        type: 'string',
                        enum: ['quests', 'rutinas', 'ejercicios', 'misiones', 'habilidades', 'estado_personal', 'labores', 'boom', 'barberia', 'trainer', 'ideas', 'autopc', 'conocimientos', 'vocabulario', 'personas', 'inventario', 'reproductor', 'ruleta'],
                        description: 'Nombre del módulo a inspeccionar.'
                    },
                    busqueda: { type: 'string', description: 'Filtro de texto opcional por nombre/título/artista/cliente.' },
                    solo_pendientes: { type: 'boolean', description: 'Si true, devuelve solo pendientes/activos cuando aplique.' },
                    limite: { type: 'integer', description: 'Límite de elementos (por defecto 25).' }
                },
                required: ['modulo']
            }
        },
        {
            type: 'function',
            name: 'monarca_navegar_vista',
            description: 'Abre o navega en pantalla hacia una sección/app específica de Sistema Monarca.',
            parameters: {
                type: 'object',
                properties: {
                    vista: {
                        type: 'string',
                        description: 'Sección destino: home, calendario, finanzas, quests, habitos, habilidades, rutinas, ejercicios, estado_personal, ideas, operatividad, conocimiento, vocabulario, labores, boom, barberia, trainer, personas, inventario, reproductor, ruleta, perfil, ia.'
                    },
                    subtab: {
                        type: 'string',
                        description: 'Sub-pestaña opcional cuando aplique (ej. panel, movimientos, ingresos, tarjetas, planificacion, quests, habitos, skills, operatividad).'
                    }
                },
                required: ['vista']
            }
        }
    ];

    var HERRAMIENTAS_ESCRITURA = [
        {
            type: 'function',
            name: 'monarca_crear_calendario',
            description: 'Crea un recordatorio, evento o día destacado en el Calendario unificado (sincroniza alarmas y campana), o marca como completado un recordatorio/evento existente.',
            parameters: {
                type: 'object',
                properties: {
                    tipo: {
                        type: 'string',
                        enum: ['recordatorio', 'evento', 'destacado', 'completar_item'],
                        description: 'Tipo de acción en calendario.'
                    },
                    titulo: { type: 'string', description: 'Título del recordatorio, evento o destacado (o búsqueda para completar).' },
                    fecha: { type: 'string', description: 'Fecha YYYY-MM-DD (por defecto hoy).' },
                    hora: { type: 'string', description: 'Hora HH:MM en formato 24h (requerido para recordatorio/evento).' },
                    duracion_minutos: { type: 'integer', description: 'Duración del evento en minutos (por defecto 60).' },
                    descripcion: { type: 'string', description: 'Nota o descripción opcional.' },
                    persona_nombre: { type: 'string', description: 'Nombre de contacto de Personas para vincularlo (opcional).' },
                    aviso_previo_min: { type: 'integer', description: 'Minutos de aviso antes del evento (por defecto 15).' },
                    repetir_anualmente: { type: 'boolean', description: 'Solo para tipo destacado: repetir cada año (ej. cumpleaños).' }
                },
                required: ['tipo', 'titulo']
            }
        },
        {
            type: 'function',
            name: 'monarca_gestionar_quest',
            description: 'Crea una nueva quest/hábito diario, marca una quest como completada (otorgando EXP y progreso de atributos) o inicia una rutina vinculada.',
            parameters: {
                type: 'object',
                properties: {
                    accion: { type: 'string', enum: ['completar', 'crear', 'iniciar_rutina'], description: 'Operación a realizar.' },
                    quest_id_o_titulo: { type: 'string', description: 'ID o título aproximado de la quest a completar.' },
                    titulo: { type: 'string', description: 'Título para crear una quest nueva.' },
                    categoria: { type: 'string', description: 'Categoría opcional (ej. Salud, Trabajo, Disciplina).' },
                    tipo_tiempo: { type: 'string', enum: ['libre', 'temporizador', 'programada'], description: 'Modo de tiempo al crear (por defecto libre).' },
                    hora_activacion: { type: 'string', description: 'Hora inicio HH:MM si tipo_tiempo=programada.' },
                    hora_limite: { type: 'string', description: 'Hora límite HH:MM opcional (por defecto 23:59).' },
                    minutos: { type: 'integer', description: 'Minutos de duración estimada/temporizador (por defecto 20).' },
                    exp: { type: 'integer', description: 'Porcentaje EXP al completar (por defecto 35).' },
                    beneficio: { type: 'string', description: 'Beneficio o propósito breve.' },
                    rutina_nombre_o_id: { type: 'string', description: 'Nombre o ID de la rutina si accion=iniciar_rutina.' }
                },
                required: ['accion']
            }
        },
        {
            type: 'function',
            name: 'monarca_registrar_finanza',
            description: 'Registra gastos, ingresos o abonos a metas en Finanzas, configura datos bancarios/Pago Móvil/Binance afiliados de una tarjeta o prepara un mensaje de cobro/datos de pago para WhatsApp.',
            parameters: {
                type: 'object',
                properties: {
                    accion: { type: 'string', enum: ['gasto', 'ingreso', 'abonar_meta', 'configurar_tarjeta_pago', 'preparar_cobro_whatsapp'], description: 'Operación financiera o de tarjeta/cobro WhatsApp.' },
                    concepto: { type: 'string', description: 'Concepto del gasto, fuente del ingreso o concepto del cobro.' },
                    monto: { type: 'number', description: 'Monto positivo (requerido para gasto/ingreso/abonar_meta; opcional para preparar_cobro_whatsapp).' },
                    moneda: { type: 'string', enum: ['USD', 'VES'], description: 'Moneda del monto (por defecto USD).' },
                    tasa_tipo: { type: 'string', enum: ['bcv', 'euro', 'paralelo'], description: 'Tasa si moneda=VES (por defecto bcv).' },
                    categoria: { type: 'string', description: 'Categoría de gasto (Alimentación, Moto & Transporte, Servicios, Vivienda, Salud, Entretenimiento & Ocio, Inversión & Trabajo, Otros).' },
                    pilar: { type: 'string', enum: ['gastos', 'inversion', 'ahorro'], description: 'Pilar 50/40/10 del gasto (por defecto gastos).' },
                    fecha: { type: 'string', description: 'Fecha YYYY-MM-DD (por defecto hoy).' },
                    tarjeta_nombre_o_id: { type: 'string', description: 'Nombre, alias, banco o ID de la tarjeta/cuenta (o "efectivo").' },
                    aplicado_ahora: { type: 'boolean', description: 'Si true (defecto), marca el gasto como pagado o ingreso como cobrado inmediatamente; false lo deja pendiente/programado.' },
                    meta_nombre_o_id: { type: 'string', description: 'Nombre o ID de la meta si accion=abonar_meta.' },
                    numero_cuenta: { type: 'string', description: 'Número de cuenta bancaria o Binance Pay ID si accion=configurar_tarjeta_pago.' },
                    banco_pago: { type: 'string', description: 'Nombre del banco/red para pagos si accion=configurar_tarjeta_pago.' },
                    cedula: { type: 'string', description: 'Cédula o RIF afiliado si accion=configurar_tarjeta_pago.' },
                    telefono: { type: 'string', description: 'Teléfono Pago Móvil o WhatsApp del destinatario.' },
                    correo: { type: 'string', description: 'Correo electrónico / Binance Email si accion=configurar_tarjeta_pago.' },
                    titular: { type: 'string', description: 'Nombre del titular de la cuenta si accion=configurar_tarjeta_pago.' },
                    persona: { type: 'string', description: 'Nombre de la persona/cliente para preparar_cobro_whatsapp.' },
                    metodo_pago: { type: 'string', enum: ['pago_movil', 'transferencia', 'binance'], description: 'Método de pago a adjuntar si accion=preparar_cobro_whatsapp.' }
                },
                required: ['accion']
            }
        },
        {
            type: 'function',
            name: 'monarca_gestionar_idea_autopc',
            description: 'Guarda una nueva idea o tarea en Ideas & Proyectos (opcionalmente enviándola directo a Auto-PC para programarla en el PC), envía una idea existente a Auto-PC o marca una idea como hecha.',
            parameters: {
                type: 'object',
                properties: {
                    accion: { type: 'string', enum: ['crear', 'enviar_autopc', 'marcar_hecha'], description: 'Acción sobre Ideas / Auto-PC.' },
                    texto: { type: 'string', description: 'Contenido o instrucción de la idea (requerido para crear).' },
                    categoria: { type: 'string', description: 'Categoría (ej. "✨ Emily", "💡 Ideas & Proyectos", "🛒 Compras & Deseos", "✅ Tareas Operativas"). Si enviar_a_autopc=true usa "✨ Emily".' },
                    subcategoria: { type: 'string', description: 'Subcategoría opcional (por defecto General).' },
                    enviar_a_autopc: { type: 'boolean', description: 'Si true al crear en categoría Emily, envía la tarea automáticamente a la cola de Auto-PC.' },
                    idea_id_o_texto: { type: 'string', description: 'ID o fragmento de texto para enviar_autopc o marcar_hecha.' }
                },
                required: ['accion']
            }
        },
        {
            type: 'function',
            name: 'monarca_gestionar_conocimiento_vocabulario',
            description: 'Guarda una nota técnica en la Biblioteca de Conocimientos, marca un repaso semanal, agrega una palabra nueva al Vocabulario Semanal o registra un uso hablado de una palabra (+EXP).',
            parameters: {
                type: 'object',
                properties: {
                    accion: {
                        type: 'string',
                        enum: ['agregar_conocimiento', 'repasar_conocimiento', 'agregar_vocabulario', 'usar_vocabulario'],
                        description: 'Operación en Conocimiento o Vocabulario.'
                    },
                    titulo: { type: 'string', description: 'Título de la técnica/nota o búsqueda para repasar.' },
                    area: { type: 'string', description: 'Área de conocimiento (ej. Oficio & Barbería, Programación, Fitness, Finanzas, Personal).' },
                    puntos_clave: { type: 'string', description: 'Explicación o puntos clave de la nota.' },
                    origen: { type: 'string', description: 'Actividad de origen opcional.' },
                    palabra: { type: 'string', description: 'Palabra o expresión de vocabulario.' },
                    significado: { type: 'string', description: 'Definición breve para vocabulario.' },
                    ejemplo: { type: 'string', description: 'Oración de ejemplo opcional.' },
                    contexto: { type: 'string', description: 'Contexto (Conversación, Profesional, Lectura, etc.).' },
                    meta_semanal: { type: 'integer', description: 'Meta de usos semanal 1..10 (por defecto 3).' }
                },
                required: ['accion']
            }
        },
        {
            type: 'function',
            name: 'monarca_controlar_reproductor',
            description: 'Controla el Reproductor MP3 interno de Sistema Monarca: reproducir/pausar, siguiente, anterior, buscar y poner una canción o playlist por nombre, activar Top Canciones / Shuffle / Modo Inteligente o programar el temporizador nocturno (Sleep Timer).',
            parameters: {
                type: 'object',
                properties: {
                    accion: {
                        type: 'string',
                        enum: ['play', 'pause', 'toggle', 'siguiente', 'anterior', 'reproducir_cancion', 'reproducir_playlist', 'top_canciones', 'toggle_shuffle', 'toggle_inteligente', 'sleep_timer', 'cancelar_sleep_timer', 'estado'],
                        description: 'Comando de reproducción o temporizador.'
                    },
                    query: { type: 'string', description: 'Nombre/artista de la canción o nombre de la playlist cuando corresponda.' },
                    minutos: { type: 'integer', description: 'Minutos para sleep_timer (ej. 15, 30, 45, 60; usar 0 o omitir para pausar al terminar la pista actual).' }
                },
                required: ['accion']
            }
        },
        {
            type: 'function',
            name: 'monarca_registrar_labor_habilidad',
            description: 'Suma horas o minutos practicados a una Habilidad registrada (+EXP) o registra una jornada laboral (con honorarios opcionales a Finanzas).',
            parameters: {
                type: 'object',
                properties: {
                    accion: { type: 'string', enum: ['sumar_horas_habilidad', 'registrar_jornada_laboral'], description: 'Acción a registrar.' },
                    habilidad_nombre_o_id: { type: 'string', description: 'Nombre o ID de la habilidad.' },
                    horas: { type: 'number', description: 'Horas a sumar/trabajar (ej. 1.5).' },
                    minutos: { type: 'integer', description: 'Minutos alternativos si se dio en minutos (ej. 45).' },
                    labor_nombre_o_id: { type: 'string', description: 'Labor (Boom, Barbería, Personal Trainer, etc.) para registrar jornada.' },
                    descripcion: { type: 'string', description: 'Descripción de la jornada laboral.' },
                    honorarios_usd: { type: 'number', description: 'Honorarios opcionales ganados en USD.' },
                    fecha: { type: 'string', description: 'Fecha YYYY-MM-DD (por defecto hoy).' }
                },
                required: ['accion']
            }
        },
        {
            type: 'function',
            name: 'monarca_gestionar_inventario',
            description: 'Registra una venta al contado de un producto del Inventario o ajusta su stock (+ / -).',
            parameters: {
                type: 'object',
                properties: {
                    accion: { type: 'string', enum: ['registrar_venta', 'ajustar_stock'], description: 'Operación sobre Inventario.' },
                    producto_nombre_o_id: { type: 'string', description: 'Nombre o ID del producto.' },
                    variante: { type: 'string', description: 'Talla o color opcional si el producto maneja variantes.' },
                    cantidad: { type: 'integer', description: 'Cantidad vendida (mínimo 1).' },
                    delta_stock: { type: 'integer', description: 'Cambio de stock (+5, -2) para ajustar_stock.' },
                    precio_unitario_usd: { type: 'number', description: 'Precio unitario opcional (por defecto usa precioVenta del producto).' },
                    cliente: { type: 'string', description: 'Nombre del cliente opcional.' },
                    tarjeta_nombre_o_id: { type: 'string', description: 'Tarjeta/cuenta opcional donde entra el cobro.' },
                    registrar_en_finanzas: { type: 'boolean', description: 'Si true (defecto), registra también el ingreso en Finanzas.' }
                },
                required: ['accion', 'producto_nombre_o_id']
            }
        },
        {
            type: 'function',
            name: 'monarca_girar_ruleta',
            description: 'Gira la Ruleta Semanal de Sistema Monarca (Comidas, Vestimenta, Música o giro completo) y guarda la selección ganadora.',
            parameters: {
                type: 'object',
                properties: {
                    categoria: { type: 'string', enum: ['comidas', 'vestimenta', 'musica', 'completa'], description: 'Ruleta a girar.' }
                },
                required: ['categoria']
            }
        },
        {
            type: 'function',
            name: 'monarca_gestionar_personas',
            description: 'Agrega una persona nueva a tu agenda de Personas, actualiza su teléfono WhatsApp o añade un tema pendiente/nota a un contacto existente.',
            parameters: {
                type: 'object',
                properties: {
                    accion: { type: 'string', enum: ['crear_persona', 'agregar_tema_nota', 'actualizar_contacto'], description: 'Acción sobre agendaPersonas.' },
                    persona_nombre_o_id: { type: 'string', description: 'Nombre o ID del contacto existente.' },
                    nombre: { type: 'string', description: 'Nombre para contacto nuevo.' },
                    rol: { type: 'string', description: 'Rol o relación (Cliente, Amigo, Familia, Colega).' },
                    telefono: { type: 'string', description: 'Número WhatsApp o teléfono opcional (ej. +584121234567).' },
                    lugar: { type: 'string', description: 'Lugar donde sueles verlo o notas.' },
                    fecha_objetivo: { type: 'string', description: 'Fecha YYYY-MM-DD o texto corto.' },
                    tema_o_nota: { type: 'string', description: 'Tema pendiente o recordatorio sobre esta persona.' }
                },
                required: ['accion']
            }
        }
    ];

    function obtenerDeclaracionesHerramientas(opts) {
        opts = opts || {};
        var lista = HERRAMIENTAS_LECTURA.slice();
        if (!opts.soloLectura) {
            lista = lista.concat(HERRAMIENTAS_ESCRITURA);
        }
        return lista;
    }

    // ==========================================================================
    // 3. IMPLEMENTACIÓN DE EJECUTORES POR HERRAMIENTA (NO BLOQUEANTES)
    // ==========================================================================

    function _execConsultarAgenda(args) {
        var inicio = (args && args.fecha_inicio) ? String(args.fecha_inicio).slice(0, 10) : _hoyISO();
        var dias = Math.min(14, Math.max(1, parseInt(args && args.dias, 10) || 3));
        var resDias = [];
        for (var i = 0; i < dias; i++) {
            var iso = _sumarDiasISO(inicio, i);
            var data = _obtenerAgendaFecha(iso);
            resDias.push({
                fecha: iso,
                dia_semana: DIAS_SEMANA_ES[_diaSemanaDeISO(iso)] || '',
                destacados: (data.destacados || []).map(function(d) { return { id: d.id, titulo: d.titulo, descripcion: d.descripcion || '', persona: d.personaNombre || '' }; }),
                eventos: (data.eventos || []).map(function(e) { return { id: e.id, titulo: e.titulo, inicio: e.horaInicio || e.hora || '', fin: e.horaFin || '', completado: !!e.completado, descripcion: e.descripcion || '' }; }),
                recordatorios: (data.recordatorios || []).map(function(r) { return { id: r.id, titulo: r.titulo, hora: r.hora || '', completado: !!r.completado, persona: r.personaNombre || '' }; }),
                cronograma: (data.cronograma || []).map(function(b) { return { titulo: b.titulo, inicio: b.horaInicio || '', fin: b.horaFin || '', etiqueta: b.etiqueta || '' }; }),
                quests_programadas: data.questsProgramadas || [],
                labor_boom: data.boom || null,
                cortes_y_sesiones: data.cortesYSesiones || [],
                finanzas_dia: data.finanzas || [],
                personas: (data.personas || []).map(function(p) { return p.nombre; })
            });
        }
        var out = { ok: true, fecha_actual: _hoyISO(), rango: resDias };
        if (!args || args.incluir_alertas !== false) {
            out.alertas_activas = (typeof global.obtenerAlertasSistemaMonarca === 'function')
                ? (global.obtenerAlertasSistemaMonarca() || []).map(function(a) {
                    return { id: a.id, tipo: a.tipo, badge: a.badge, titulo: a.titulo, meta: a.metaLinea || '', descripcion: a.descripcion || '' };
                })
                : [];
        }
        if (args && args.incluir_cronograma_semanal && global.APP_STATE) {
            var diasCal = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            out.cronograma_semanal = (global.APP_STATE.cronogramaSemanal || []).map(function(b) {
                return { dia_semana: diasCal[Number(b.diaSemana)] || String(b.diaSemana), inicio: b.horaInicio, fin: b.horaFin, titulo: b.titulo, etiqueta: b.etiqueta || '' };
            });
        }
        return { data: out, vista: 'vista-calendario', label: 'Consultó Calendario (' + dias + 'd)' };
    }

    function _execConsultarFinanzas(args) {
        var st = global.APP_STATE || {};
        var fin = st.finanzas || {};
        var seccion = (args && args.seccion) ? String(args.seccion) : 'resumen';
        var mes = (args && args.mes) ? String(args.mes).slice(0, 7) : _hoyISO().slice(0, 7);
        var busq = _norm(args && args.busqueda);
        var lim = Math.min(60, Math.max(1, parseInt(args && args.limite, 10) || 20));
        var tasas = (typeof global.leerCacheTasasBCV === 'function') ? (global.leerCacheTasasBCV() || {}) : {};
        var resGlob = (typeof global.obtenerResumenGlobalTarjetas === 'function') ? global.obtenerResumenGlobalTarjetas(tasas) : null;

        var cards = (fin.tarjetas || []).map(function(t) {
            var est = (typeof global.calcularEstadoTarjetaEnVivo === 'function') ? global.calcularEstadoTarjetaEnVivo(t, tasas) : null;
            var dp = (typeof global.normalizarDatosPagoTarjeta === 'function') ? global.normalizarDatosPagoTarjeta(t) : (t.datosPago || {});
            var tieneDp = (typeof global.tieneDatosPagoConfiguradosTarjeta === 'function') ? global.tieneDatosPagoConfiguradosTarjeta(t) : Boolean(dp && (dp.numeroCuenta || dp.cedula || dp.telefono || dp.correo));
            return {
                id: t.id,
                nombre: (typeof global.construirTituloTarjeta === 'function') ? global.construirTituloTarjeta(t) : (t.alias || t.banco),
                banco: t.banco,
                moneda: est ? est.monedaBase : 'USD',
                saldo_bs: est ? Number((est.saldoBs || 0).toFixed(2)) : 0,
                saldo_usd: est ? Number((est.valorActualUsd || 0).toFixed(2)) : (Number(t.saldoUsd) || 0),
                tiene_datos_pago: tieneDp,
                datos_pago: dp,
                ultimos_movimientos: Array.isArray(t.historial) ? t.historial.slice(0, 5) : []
            };
        });

        var fitText = function(txt) { return !busq || _norm(txt).indexOf(busq) !== -1; };
        var fitMes = function(it) { return !args || !args.mes || !it.fecha || String(it.fecha).slice(0, 7) === mes; };

        var resp = {
            ok: true,
            mes_referencia: mes,
            tasas: tasas,
            disponible_total_tarjetas_usd: resGlob ? Number((resGlob.totalUsdHoy || 0).toFixed(2)) : 0
        };

        if (seccion === 'resumen' || seccion === 'tarjetas' || seccion === 'todo') resp.tarjetas = cards;
        if (seccion === 'resumen' || seccion === 'ingresos' || seccion === 'todo') {
            resp.ingresos = (fin.ingresos || []).filter(function(i) { return i && fitMes(i) && fitText((i.fuente || '') + ' ' + (i.categoria || '')); }).slice(-lim).reverse();
        }
        if (seccion === 'resumen' || seccion === 'gastos' || seccion === 'todo') {
            resp.gastos = (fin.gastos || []).filter(function(g) { return g && fitMes(g) && fitText((g.concepto || '') + ' ' + (g.categoria || '')); }).slice(-lim).reverse();
        }
        if (seccion === 'resumen' || seccion === 'deudas' || seccion === 'todo') resp.deudas = (fin.deudas || []).slice(0, lim);
        if (seccion === 'resumen' || seccion === 'metas' || seccion === 'todo') resp.metas = (fin.metas || []).slice(0, lim);
        if (seccion === 'resumen' || seccion === 'compras' || seccion === 'todo') resp.planificacion_compras = (fin.planificacionCompras || []).slice(0, lim);
        if (seccion === 'resumen' || seccion === 'retrasos' || seccion === 'todo') {
            resp.retrasos = (typeof global.obtenerRetrasosFinanzas === 'function') ? (global.obtenerRetrasosFinanzas(fin) || []) : [];
        }

        return { data: resp, vista: 'vista-finanzas', label: 'Consultó Finanzas (' + seccion + ')' };
    }

    function _execConsultarModulo(args) {
        var mod = String((args && args.modulo) || '').toLowerCase();
        var busq = _norm(args && args.busqueda);
        var soloPend = !!(args && args.solo_pendientes);
        var lim = Math.min(60, Math.max(1, parseInt(args && args.limite, 10) || 25));
        var st = global.APP_STATE || {};
        var filTxt = function(s) { return !busq || _norm(s).indexOf(busq) !== -1; };

        switch (mod) {
            case 'quests': {
                var qs = (st.questsDiarios || []).filter(function(q) {
                    if (!q) return false;
                    if (soloPend && q.estado === 'completada') return false;
                    return filTxt((q.titulo || '') + ' ' + (q.categoria || '') + ' ' + (q.beneficio || ''));
                });
                return { data: { ok: true, total: qs.length, quests: qs.slice(0, lim) }, vista: 'vista-acciones-progresion', subtab: 'quests', label: 'Consultó Quests' };
            }
            case 'rutinas': {
                var ruts = (st.rutinas || []).filter(function(r) { return r && filTxt(r.nombre); });
                return { data: { ok: true, total: ruts.length, rutinas: ruts.slice(0, lim) }, vista: 'vista-ejercicios', label: 'Consultó Rutinas' };
            }
            case 'ejercicios': {
                var ejs = (st.ejercicios || []).filter(function(e) { return e && filTxt((e.nombre || '') + ' ' + (e.categoria || '')); });
                return { data: { ok: true, total: ejs.length, ejercicios: ejs.slice(0, lim) }, vista: 'vista-ejercicios', label: 'Consultó Ejercicios' };
            }
            case 'misiones': {
                var mis = (st.misiones || []).filter(function(m) {
                    if (!m) return false;
                    if (soloPend && (m.completada || m.estado === 'completada')) return false;
                    return filTxt((m.titulo || m.nombre || '') + ' ' + (m.descripcion || ''));
                });
                return { data: { ok: true, total: mis.length, misiones: mis.slice(0, lim) }, vista: 'vista-acciones-progresion', subtab: 'habitos', label: 'Consultó Misiones' };
            }
            case 'habilidades': {
                var habs = (st.habilidades || []).filter(function(h) { return h && filTxt(h.nombre); }).map(function(h) {
                    var calc = (typeof global.calcularRangoYProgreso === 'function') ? global.calcularRangoYProgreso(h.horasTotales) : {};
                    return Object.assign({}, h, { rangoCalculado: calc.rango || '' });
                });
                return { data: { ok: true, total: habs.length, habilidades: habs.slice(0, lim) }, vista: 'vista-acciones-progresion', subtab: 'skills', label: 'Consultó Habilidades' };
            }
            case 'estado_personal': {
                var met = (typeof global.calcularMetricasPurasSinActualizar === 'function') ? global.calcularMetricasPurasSinActualizar() : null;
                var cicloSueno = (typeof global.calcularProximoDespertarYHoraDormir === 'function') ? global.calcularProximoDespertarYHoraDormir() : null;
                return {
                    data: {
                        ok: true,
                        metricas: met,
                        fatiga_fisica: st.fatiga || {},
                        desgaste_mente: st.desgasteMente || {},
                        fatiga_mental_diaria: st.fatigaMentalDiaria || {},
                        sueno: st.sueno || {},
                        ciclo_sueno: cicloSueno,
                        historial_reciente_dias: st.registroDiarioCalendario || {}
                    },
                    vista: 'vista-estado-personal',
                    label: 'Consultó Estado Personal y Sueño'
                };
            }
            case 'boom':
            case 'labores': {
                var mesB = _hoyISO().slice(0, 7);
                var boomObj = st.subappBoom || {};
                var plan = (boomObj.planificaciones && boomObj.planificaciones[mesB]) || null;
                return {
                    data: {
                        ok: true,
                        mes: mesB,
                        config_boom: boomObj.config || {},
                        plan_mes_boom: plan,
                        registros_labores_recientes: (st.registrosLabores || []).slice(0, lim),
                        categorias_labores: st.categoriasLabores || []
                    },
                    vista: mod === 'boom' ? 'vista-subapp-boom' : 'vista-labores',
                    label: mod === 'boom' ? 'Consultó Boom' : 'Consultó Labores'
                };
            }
            case 'barberia': {
                var barb = st.subappBarberia || {};
                return {
                    data: {
                        ok: true,
                        timer_activo: barb.timerActivo || null,
                        tipos_corte: barb.tiposCorte || [],
                        clientes: (barb.clientes || []).filter(function(c) { return c && filTxt(c.nombre); }).slice(0, lim),
                        ultimos_cortes: (barb.cortes || []).slice(0, lim)
                    },
                    vista: 'vista-subapp-barberia',
                    label: 'Consultó Barbería'
                };
            }
            case 'trainer': {
                var tr = st.subappTrainer || {};
                return {
                    data: {
                        ok: true,
                        sesiones_activas: tr.sesionesActivas || [],
                        alumnos: (tr.alumnos || []).filter(function(a) { return a && filTxt(a.nombre); }).slice(0, lim),
                        enfoques: (tr.rutinasEnfoques || []).slice(0, lim),
                        ultimas_sesiones: (tr.sesiones || []).slice(0, lim)
                    },
                    vista: 'vista-subapp-trainer',
                    label: 'Consultó Personal Trainer'
                };
            }
            case 'ideas':
            case 'autopc': {
                var resAPC = (typeof global.obtenerResumenMonitoreoAutoPC === 'function') ? global.obtenerResumenMonitoreoAutoPC() : null;
                var ids = (st.ideas || []).filter(function(it) {
                    if (!it) return false;
                    if (mod === 'autopc' && !it.autopcStatus && !(it.categoria && String(it.categoria).indexOf('Emily') !== -1)) return false;
                    if (soloPend && it.hecha) return false;
                    return filTxt((it.texto || '') + ' ' + (it.textoPrompt || '') + ' ' + (it.categoria || '') + ' ' + (it.subcategoria || ''));
                });
                return {
                    data: { ok: true, resumen_autopc: resAPC, total: ids.length, ideas: ids.slice(0, lim) },
                    vista: 'vista-ideas',
                    subtab: mod === 'autopc' ? 'operatividad' : '',
                    label: mod === 'autopc' ? 'Consultó Auto-PC' : 'Consultó Ideas'
                };
            }
            case 'conocimientos': {
                var cons = (st.conocimientos || []).filter(function(c) {
                    if (!c) return false;
                    if (soloPend && c.revisadoEstaSemana) return false;
                    return filTxt((c.titulo || '') + ' ' + (c.area || '') + ' ' + (c.resumenPuntosClave || c.contenido || ''));
                });
                return { data: { ok: true, total: cons.length, conocimientos: cons.slice(0, lim) }, vista: 'vista-conocimiento', label: 'Consultó Conocimiento' };
            }
            case 'vocabulario': {
                var vocs = (st.vocabulario || []).filter(function(v) {
                    if (!v) return false;
                    if (soloPend && v.dominada) return false;
                    return filTxt((v.palabra || '') + ' ' + (v.significado || ''));
                });
                return { data: { ok: true, total: vocs.length, vocabulario: vocs.slice(0, lim) }, vista: 'vista-conocimiento', label: 'Consultó Vocabulario' };
            }
            case 'personas': {
                var finIngPers = (st.finanzas && Array.isArray(st.finanzas.ingresos)) ? st.finanzas.ingresos : [];
                var pers = (st.agendaPersonas || []).filter(function(p) {
                    return p && filTxt((p.nombre || '') + ' ' + (p.rol || '') + ' ' + (p.lugarProyectado || ''));
                }).slice(0, lim).map(function(p) {
                    var nLow = _norm(p.nombre);
                    var saldoCobrar = 0;
                    finIngPers.forEach(function(ing) {
                        if (!ing || ing.cobrado) return;
                        var m1 = _norm(ing.personaCobro) === nLow || _norm(ing.personaPrestamo) === nLow || _norm(ing.cliente) === nLow;
                        var m2 = !m1 && nLow.length >= 3 && _norm(ing.fuente).indexOf(nLow) !== -1;
                        if (m1 || m2) saldoCobrar += (Number(ing.monto) || 0);
                    });
                    return Object.assign({}, p, { saldo_por_cobrar_usd: Math.round(saldoCobrar * 100) / 100 });
                });
                return { data: { ok: true, total: pers.length, personas: pers, grupos: st.gruposPersonas || [] }, vista: 'vista-personas', label: 'Consultó Personas' };
            }
            case 'inventario': {
                var inv = st.inventario || {};
                var prods = (inv.productos || []).filter(function(p) { return p && filTxt((p.nombre || '') + ' ' + (p.marca || '') + ' ' + (p.categoriaNombre || '')); });
                var vts = (inv.ventas || []).filter(function(v) { return v && filTxt((v.productoNombre || '') + ' ' + (v.cliente || '')); });
                return {
                    data: {
                        ok: true,
                        total_productos: prods.length,
                        productos: prods.slice(0, lim),
                        ultimas_ventas: vts.slice(0, Math.min(lim, 15)),
                        categorias: inv.categorias || []
                    },
                    vista: 'vista-inventario',
                    label: 'Consultó Inventario'
                };
            }
            case 'reproductor': {
                var mp = global.MonarcaPlayer;
                if (!mp) return { data: { ok: false, error: 'Reproductor MP3 no inicializado aún.' }, vista: 'vista-reproductor', label: 'Reproductor' };
                var stP = mp.getState ? (mp.getState() || {}) : {};
                var canciones = mp.getCanciones ? (mp.getCanciones() || []) : [];
                var filtradas = canciones.filter(function(c) { return c && filTxt((c.titulo || c.nombre || '') + ' ' + (c.artista || '') + ' ' + (c.album || '')); });
                var pls = mp.getPlaylists ? (mp.getPlaylists() || []) : [];
                return {
                    data: {
                        ok: true,
                        reproduciendo: !!stP.reproduciendo,
                        cancion_actual: stP.cancionActual ? { id: stP.cancionActual.id, titulo: stP.cancionActual.titulo || stP.cancionActual.nombre, artista: stP.cancionActual.artista || '' } : null,
                        shuffle: !!stP.shuffle,
                        modo_inteligente: !!stP.modoInteligente,
                        repeat: stP.repeat || 'none',
                        total_canciones: canciones.length,
                        canciones: filtradas.slice(0, lim).map(function(s) { return { id: s.id, titulo: s.titulo || s.nombre, artista: s.artista || '', duracion: s.duracion || 0 }; }),
                        playlists: pls.map(function(pl) { return { id: pl.id, nombre: pl.nombre, total: Array.isArray(pl.cancionIds) ? pl.cancionIds.length : 0 }; })
                    },
                    vista: 'vista-reproductor',
                    label: 'Consultó Música MP3'
                };
            }
            case 'ruleta': {
                var rul = st.ruletaSemanal || {};
                return {
                    data: {
                        ok: true,
                        seleccion_activa: rul.seleccionActiva || {},
                        comidas: rul.comidas || [],
                        vestimenta: rul.vestimenta || [],
                        historial: (rul.historialGiros || []).slice(0, 8)
                    },
                    vista: 'vista-ruleta',
                    label: 'Consultó Ruleta'
                };
            }
            default:
                return { data: { ok: false, error: 'Módulo no reconocido: ' + mod }, vista: 'vista-home', label: 'Módulo desconocido' };
        }
    }

    function _resolverVistaDestino(rawVista, rawSubtab) {
        var v = _norm(rawVista).replace(/^vista-/, '');
        var mapa = {
            'home': 'vista-home',
            'inicio': 'vista-home',
            'menu': 'vista-menu',
            'calendario': 'vista-calendario',
            'agenda': 'vista-calendario',
            'finanzas': 'vista-finanzas',
            'dinero': 'vista-finanzas',
            'tarjetas': 'vista-finanzas',
            'acciones-progresion': 'vista-acciones-progresion',
            'quests': 'vista-acciones-progresion',
            'quests-diarios': 'vista-acciones-progresion',
            'habitos': 'vista-acciones-progresion',
            'misiones': 'vista-acciones-progresion',
            'habilidades': 'vista-acciones-progresion',
            'skills': 'vista-acciones-progresion',
            'estado-personal': 'vista-estado-personal',
            'estado_personal': 'vista-estado-personal',
            'fatiga': 'vista-estado-personal',
            'mente': 'vista-estado-personal',
            'ejercicios': 'vista-ejercicios',
            'rutinas': 'vista-ejercicios',
            'gym': 'vista-ejercicios',
            'ideas': 'vista-ideas',
            'operatividad': 'vista-ideas',
            'autopc': 'vista-ideas',
            'conocimiento': 'vista-conocimiento',
            'conocimientos': 'vista-conocimiento',
            'vocabulario': 'vista-conocimiento',
            'labores': 'vista-labores',
            'boom': 'vista-subapp-boom',
            'subapp-boom': 'vista-subapp-boom',
            'barberia': 'vista-subapp-barberia',
            'subapp-barberia': 'vista-subapp-barberia',
            'trainer': 'vista-subapp-trainer',
            'subapp-trainer': 'vista-subapp-trainer',
            'personas': 'vista-personas',
            'contactos': 'vista-personas',
            'inventario': 'vista-inventario',
            'tienda': 'vista-inventario',
            'reproductor': 'vista-reproductor',
            'musica': 'vista-reproductor',
            'mp3': 'vista-reproductor',
            'ruleta': 'vista-ruleta',
            'perfil': 'vista-perfil',
            'ia': 'vista-ia'
        };
        var vistaId = mapa[v] || (rawVista && String(rawVista).indexOf('vista-') === 0 ? String(rawVista) : 'vista-home');
        var subtab = rawSubtab ? _norm(rawSubtab) : '';
        if (!subtab) {
            if (v === 'quests' || v === 'quests-diarios') subtab = 'quests';
            else if (v === 'misiones' || v === 'habitos') subtab = 'habitos';
            else if (v === 'habilidades' || v === 'skills') subtab = 'skills';
            else if (v === 'operatividad' || v === 'autopc') subtab = 'operatividad';
            else if (v === 'tarjetas') subtab = 'tarjetas';
        }
        return { vistaId: vistaId, subtab: subtab };
    }

    function _execNavegarVista(args, ctxEjec) {
        var dest = _resolverVistaDestino(args && args.vista, args && args.subtab);
        if (ctxEjec && ctxEjec.origen === 'jarvis' && typeof global.cerrarModalJarvisVoz === 'function' && dest.vistaId !== 'vista-ia') {
            try { global.cerrarModalJarvisVoz(); } catch (e0) {}
        }
        if (typeof global.cambiarVista === 'function') {
            global.cambiarVista(dest.vistaId);
        }
        try {
            if (dest.vistaId === 'vista-acciones-progresion' && dest.subtab && typeof global.cambiarTabAccionesDesarrollo === 'function') {
                global.cambiarTabAccionesDesarrollo(dest.subtab);
            } else if (dest.vistaId === 'vista-ideas' && dest.subtab === 'operatividad' && typeof global.alternarSubvistaIdeas === 'function') {
                global.alternarSubvistaIdeas('operatividad');
            } else if (dest.vistaId === 'vista-finanzas' && dest.subtab && typeof global.cambiarTabFinanzas === 'function') {
                global.cambiarTabFinanzas(dest.subtab);
            }
        } catch (eSub) {}
        return {
            data: { ok: true, vista: dest.vistaId, subtab: dest.subtab || null },
            vista: dest.vistaId,
            label: 'Abrió ' + dest.vistaId.replace(/^vista-/, '')
        };
    }

    function _execCrearCalendario(args) {
        args = args || {};
        if (!global.APP_STATE) return { data: { ok: false, error: 'APP_STATE no disponible' }, label: 'Error Calendario' };
        if (!Array.isArray(APP_STATE.calendario)) APP_STATE.calendario = [];

        var tipo = String(args.tipo || 'recordatorio');
        var titulo = String(args.titulo || '').trim();
        var fecha = String(args.fecha || _hoyISO()).slice(0, 10);
        var hora = String(args.hora || '').trim();
        var desc = String(args.descripcion || '').trim();
        var ahora = Date.now();

        if (!titulo) return { data: { ok: false, error: 'Falta el título del calendario.' }, label: 'Falta título' };

        if (tipo === 'completar_item') {
            var encontrado = _buscarEnLista(APP_STATE.calendario, titulo, function(c) { return [c.titulo]; });
            if (!encontrado) {
                return { data: { ok: false, error: 'No encontré en tu calendario ningún elemento llamado "' + titulo + '".' }, vista: 'vista-calendario', label: 'No encontrado' };
            }
            encontrado.completado = true;
            encontrado.fechaCompletada = ahora;
            encontrado.fechaActualizacion = ahora;
            _guardarYRefrescar(['calendario']);
            _notificarToast('✓ Completado en calendario: ' + encontrado.titulo, '📅');
            return {
                data: { ok: true, id: encontrado.id, titulo: encontrado.titulo, completado: true },
                vista: 'vista-calendario',
                esEscritura: true,
                label: 'Completó: ' + _recortar(encontrado.titulo, 26)
            };
        }

        var personaObj = args.persona_nombre ? _buscarEnLista(APP_STATE.agendaPersonas || [], args.persona_nombre, function(p) { return [p.nombre]; }) : null;
        var personaId = personaObj ? String(personaObj.id) : '';

        if (tipo === 'recordatorio') {
            if (!hora) hora = _horaAhoraHHMM();
            var recObj = (typeof global.crearGuardarRecordatorioCalendario === 'function')
                ? global.crearGuardarRecordatorioCalendario({
                    titulo: titulo,
                    descripcion: desc,
                    fecha: fecha,
                    hora: hora,
                    personaId: personaId
                })
                : null;
            if (!recObj) {
                recObj = {
                    id: 'REC-' + ahora + '-' + Math.random().toString(36).substr(2, 4),
                    tipo: 'recordatorio',
                    titulo: titulo,
                    descripcion: desc,
                    fecha: fecha,
                    hora: hora,
                    personaId: personaId,
                    personaNombre: personaObj ? personaObj.nombre : '',
                    completado: false,
                    timestamp: ahora,
                    fechaActualizacion: ahora
                };
                APP_STATE.calendario.push(recObj);
                _guardarYRefrescar(['calendario']);
            }
            _notificarToast('🔔 Recordatorio: ' + titulo + ' (' + fecha + ' ' + hora + ')', '📅');
            return {
                data: { ok: true, tipo: 'recordatorio', id: recObj.id, titulo: titulo, fecha: fecha, hora: hora },
                vista: 'vista-calendario',
                esEscritura: true,
                label: 'Recordatorio: ' + _recortar(titulo, 24)
            };
        }

        if (tipo === 'evento') {
            if (!hora) hora = '09:00';
            var durMin = Math.max(5, parseInt(args.duracion_minutos, 10) || 60);
            var avisoMin = (args.aviso_previo_min !== undefined) ? (parseInt(args.aviso_previo_min, 10) || 0) : 15;
            var horaFin = '';
            var cruzaMed = false;
            if (typeof global.calcularHoraFinDesdeDuracion === 'function') {
                var c = global.calcularHoraFinDesdeDuracion(hora, durMin, 'min');
                if (c) {
                    horaFin = c.horaFin;
                    cruzaMed = !!c.cruzaMedianoche;
                }
            } else {
                var hp = hora.split(':');
                var totMin = (parseInt(hp[0], 10) || 0) * 60 + (parseInt(hp[1], 10) || 0) + durMin;
                cruzaMed = totMin >= 1440;
                var mMod = totMin % 1440;
                horaFin = String(Math.floor(mMod / 60)).padStart(2, '0') + ':' + String(mMod % 60).padStart(2, '0');
            }

            var choques = (typeof global.detectarChoquesEvento === 'function')
                ? global.detectarChoquesEvento(fecha, hora, durMin, '')
                : { eventosSolapados: [] };

            var nuevoEv = {
                id: 'EVE-' + ahora + '-' + Math.random().toString(36).substr(2, 4),
                tipo: 'evento',
                titulo: titulo,
                descripcion: desc,
                fecha: fecha,
                horaInicio: hora,
                hora: hora,
                horaFin: horaFin,
                duracionMinutos: durMin,
                cruzaMedianoche: cruzaMed,
                personaIds: personaId ? [personaId] : [],
                grupoIds: [],
                avisoPrevioMin: avisoMin,
                avisoPersonalizado: true,
                avisoDisparadoParaTs: null,
                avisoDisparadoEn: null,
                avisoDescartado: false,
                color: '#38bdf8',
                laborId: '',
                completado: false,
                timestamp: ahora,
                fechaActualizacion: ahora
            };
            APP_STATE.calendario.push(nuevoEv);
            _guardarYRefrescar(['calendario']);
            _notificarToast('📅 Evento agendado: ' + titulo + ' (' + fecha + ' ' + hora + ')', '📅');
            return {
                data: {
                    ok: true,
                    tipo: 'evento',
                    id: nuevoEv.id,
                    titulo: titulo,
                    fecha: fecha,
                    hora_inicio: hora,
                    hora_fin: horaFin,
                    solapado_con: (choques.eventosSolapados || []).map(function(e) { return e.titulo + ' (' + e.horaInicio + ')'; })
                },
                vista: 'vista-calendario',
                esEscritura: true,
                label: 'Evento: ' + _recortar(titulo, 24)
            };
        }

        // Destacado
        var nuevoDest = {
            id: 'DST-' + ahora + '-' + Math.random().toString(36).substr(2, 4),
            tipo: 'destacado',
            titulo: titulo,
            descripcion: desc,
            fecha: fecha,
            mesDia: fecha.slice(5, 10),
            personaId: personaId,
            personaNombre: personaObj ? personaObj.nombre : '',
            repetirAnualmente: !!args.repetir_anualmente,
            color: '#f59e0b',
            timestamp: ahora,
            fechaActualizacion: ahora
        };
        APP_STATE.calendario.push(nuevoDest);
        _guardarYRefrescar(['calendario']);
        _notificarToast('⭐ Destacado guardado: ' + titulo + ' (' + fecha + ')', '⭐');
        return {
            data: { ok: true, tipo: 'destacado', id: nuevoDest.id, titulo: titulo, fecha: fecha },
            vista: 'vista-calendario',
            esEscritura: true,
            label: 'Destacado: ' + _recortar(titulo, 22)
        };
    }

    function _execGestionarQuest(args) {
        args = args || {};
        if (!global.APP_STATE) return { data: { ok: false, error: 'APP_STATE no disponible' }, label: 'Error Quest' };
        if (!Array.isArray(APP_STATE.questsDiarios)) APP_STATE.questsDiarios = [];
        var accion = String(args.accion || '');

        if (accion === 'iniciar_rutina') {
            var rutObj = _buscarEnLista(APP_STATE.rutinas || [], args.rutina_nombre_o_id || args.titulo || '', function(r) { return [r.nombre, r.codigo]; });
            if (!rutObj) return { data: { ok: false, error: 'No encontré esa rutina.' }, vista: 'vista-ejercicios', label: 'Rutina no encontrada' };
            if (typeof global.iniciarRutinaDesdeHabito === 'function') {
                global.iniciarRutinaDesdeHabito(rutObj.id);
                return { data: { ok: true, rutina_iniciada: rutObj.nombre }, vista: 'vista-detalle-rutina-dinamica', esEscritura: true, label: 'Inició rutina: ' + _recortar(rutObj.nombre, 20) };
            }
            return { data: { ok: false, error: 'No se pudo iniciar la rutina en este contexto.' }, label: 'Error rutina' };
        }

        if (accion === 'completar') {
            var q = _buscarEnLista(APP_STATE.questsDiarios, args.quest_id_o_titulo || args.titulo || '', function(x) { return [x.titulo]; });
            if (!q) return { data: { ok: false, error: 'No encontré una quest con ese nombre.' }, vista: 'vista-acciones-progresion', label: 'Quest no encontrada' };
            if (q.estado === 'penalizada') {
                return { data: { ok: false, error: 'La quest "' + q.titulo + '" está penalizada; debes cumplir su penitencia desde Quests Diarios.' }, vista: 'vista-acciones-progresion', label: 'Quest penalizada' };
            }
            if (q.estado === 'completada') {
                return { data: { ok: true, ya_completada: true, titulo: q.titulo }, vista: 'vista-acciones-progresion', label: 'Ya completada' };
            }

            var hoyISO = (typeof global.obtenerClaveHoyQuestLocal === 'function') ? global.obtenerClaveHoyQuestLocal() : _hoyISO();
            var ahoraMs = Date.now();
            q.estado = 'completada';
            q.temporizadorActivo = false;
            q.pospuestaHasta = null;
            q.ultimaActivacionFecha = hoyISO;
            q.fechaCompletadaDia = hoyISO;
            q.fechaCompletada = new Date(ahoraMs).toISOString();
            q.ultimaPenitenciaTs = null;
            q.fechaActualizacion = ahoraMs;

            var pct = Math.max(1, Number(q.exp) || 40);
            var expMaxActual = (APP_STATE.jugador && APP_STATE.jugador.expMax) ? APP_STATE.jugador.expMax : 100;
            var expGanada = Math.max(5, Math.round((pct / 100) * expMaxActual));
            if (typeof global.sumarExp === 'function') global.sumarExp(expGanada);

            if (q.atributos && q.atributos.length > 0 && typeof global.aplicarImpactoAtributos === 'function') {
                global.aplicarImpactoAtributos(q.atributos);
            } else if (typeof global.aplicarImpactoInteligenteQuest === 'function') {
                global.aplicarImpactoInteligenteQuest(q);
            }

            if (!Array.isArray(APP_STATE.historialQuests)) APP_STATE.historialQuests = [];
            APP_STATE.historialQuests.push({
                id: 'HQ-' + ahoraMs + '-' + Math.random().toString(36).substr(2, 4),
                questId: q.id,
                titulo: q.titulo,
                tipoTiempo: q.tipoTiempo,
                timestamp: ahoraMs
            });

            if (typeof global.cerrarAlertaQuestActivada === 'function') {
                try { global.cerrarAlertaQuestActivada(); } catch (eC) {}
            }
            if (typeof global.cancelarNotificacionTelefonoPorAlerta === 'function') {
                global.cancelarNotificacionTelefonoPorAlerta('alerta-quest-act-' + q.id);
                global.cancelarNotificacionTelefonoPorAlerta('alerta-quest-pen-' + q.id);
            }
            _guardarYRefrescar(['quests']);
            _notificarToast('⚔️ Quest completada: ' + q.titulo + ' (+' + expGanada + ' EXP)', '⚔️');
            return {
                data: { ok: true, id: q.id, titulo: q.titulo, exp_ganada: expGanada },
                vista: 'vista-acciones-progresion',
                esEscritura: true,
                label: 'Completó Quest: ' + _recortar(q.titulo, 20)
            };
        }

        // Crear nueva quest
        var titulo = String(args.titulo || '').trim();
        if (!titulo) return { data: { ok: false, error: 'Indica el título de la nueva quest o hábito.' }, label: 'Falta título' };

        var ya = APP_STATE.questsDiarios.find(function(x) { return x && _norm(x.titulo) === _norm(titulo); });
        if (ya) {
            return { data: { ok: true, ya_existia: true, id: ya.id, titulo: ya.titulo, estado: ya.estado }, vista: 'vista-acciones-progresion', label: 'Quest existente' };
        }

        var ahora = Date.now();
        var tipoTiempo = ['libre', 'temporizador', 'programada'].indexOf(args.tipo_tiempo) !== -1 ? args.tipo_tiempo : 'libre';
        var qObj = {
            id: 'QD-' + ahora + '-' + Math.random().toString(36).substr(2, 4),
            titulo: titulo,
            beneficio: String(args.beneficio || '').trim(),
            categoria: String(args.categoria || '⚡ Misión / Hábito'),
            tipoTiempo: tipoTiempo,
            horaActivacion: String(args.hora_activacion || '08:00'),
            minutos: Math.max(1, parseInt(args.minutos, 10) || 20),
            horaLimite: String(args.hora_limite || '23:59'),
            esOmitible: true,
            penitenciaId: 'sin_penitencia',
            penitenciaNombre: 'Sin penitencia obligatoria',
            penitenciaExp: 0,
            exp: Math.max(5, Math.min(100, parseInt(args.exp, 10) || 35)),
            estado: 'pendiente',
            temporizadorActivo: false,
            timestamp: ahora,
            fechaActualizacion: ahora
        };
        _limpiarTombstone('questsDiarios', 'QD-' + titulo.toLowerCase());
        APP_STATE.questsDiarios.push(qObj);
        _guardarYRefrescar(['quests']);
        _notificarToast('⚔️ Quest añadida: ' + titulo, '⚔️');
        return {
            data: { ok: true, id: qObj.id, titulo: qObj.titulo, tipo_tiempo: tipoTiempo },
            vista: 'vista-acciones-progresion',
            esEscritura: true,
            label: 'Creó Quest: ' + _recortar(titulo, 22)
        };
    }

    function _resolverTarjetaFinanzasPorNombre(nombreOId) {
        if (!nombreOId) return { tarjeta: null, esEfectivo: false };
        var q = _norm(nombreOId);
        if (q === 'efectivo' || q === 'caja' || q === 'cash' || q === '__efectivo__') {
            return { tarjeta: null, esEfectivo: true };
        }
        var tarjetas = (typeof global.asegurarArrayTarjetasFinanzas === 'function')
            ? global.asegurarArrayTarjetasFinanzas()
            : ((global.APP_STATE && APP_STATE.finanzas && APP_STATE.finanzas.tarjetas) || []);
        var encontrada = _buscarEnLista(tarjetas, nombreOId, function(t) {
            var tit = (typeof global.construirTituloTarjeta === 'function') ? global.construirTituloTarjeta(t) : '';
            return [t.alias || '', t.banco || '', tit];
        });
        return { tarjeta: encontrada, esEfectivo: false };
    }

    function _execRegistrarFinanza(args) {
        args = args || {};
        if (!global.APP_STATE) return { data: { ok: false, error: 'APP_STATE no disponible' }, label: 'Error Finanzas' };
        if (!APP_STATE.finanzas) APP_STATE.finanzas = {};
        if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];
        if (!Array.isArray(APP_STATE.finanzas.gastos)) APP_STATE.finanzas.gastos = [];
        if (!Array.isArray(APP_STATE.finanzas.metas)) APP_STATE.finanzas.metas = [];
        if (!Array.isArray(APP_STATE.finanzas.aportesMetas)) APP_STATE.finanzas.aportesMetas = [];

        var accion = String(args.accion || '');

        if (accion === 'configurar_tarjeta_pago') {
            var resCfgTrj = _resolverTarjetaFinanzasPorNombre(args.tarjeta_nombre_o_id || '');
            var tCfg = resCfgTrj.tarjeta;
            if (!tCfg) {
                return { data: { ok: false, error: 'Indica qué tarjeta deseas configurar (ej: Provincial, Venezuela, Binance o Todoticket).' }, vista: 'vista-finanzas', subtab: 'tarjetas', label: 'Tarjeta no encontrada' };
            }
            var dpPrev = (typeof global.normalizarDatosPagoTarjeta === 'function')
                ? global.normalizarDatosPagoTarjeta(tCfg)
                : Object.assign({}, tCfg.datosPago || {});
            if (args.numero_cuenta !== undefined) dpPrev.numeroCuenta = String(args.numero_cuenta || '').trim();
            if (args.banco_pago !== undefined) dpPrev.bancoPago = String(args.banco_pago || '').trim();
            if (args.cedula !== undefined) dpPrev.cedula = String(args.cedula || '').trim();
            if (args.telefono !== undefined) dpPrev.telefono = String(args.telefono || '').trim();
            if (args.correo !== undefined) dpPrev.correo = String(args.correo || '').trim();
            if (args.titular !== undefined) dpPrev.titular = String(args.titular || '').trim();
            tCfg.datosPago = dpPrev;
            tCfg.fechaActualizacion = Date.now();
            _guardarYRefrescar(['finanzas']);
            if (typeof global.renderizarTarjetasFinanzas === 'function') global.renderizarTarjetasFinanzas();
            var nomTCfg = (typeof global.construirTituloTarjeta === 'function') ? global.construirTituloTarjeta(tCfg) : tCfg.banco;
            _notificarToast('💳 Datos de pago guardados en ' + nomTCfg, '💳');
            return {
                data: { ok: true, tarjeta: nomTCfg, datos_pago: dpPrev },
                vista: 'vista-finanzas',
                subtab: 'tarjetas',
                esEscritura: true,
                label: 'Datos: ' + _recortar(nomTCfg, 16)
            };
        }

        if (accion === 'preparar_cobro_whatsapp') {
            var nomPersWA = String(args.persona || '').trim();
            var conceptoWA = String(args.concepto || '').trim();
            var resWaTrj = _resolverTarjetaFinanzasPorNombre(args.tarjeta_nombre_o_id || '');
            var trjWA = resWaTrj.tarjeta;
            var ingresoWA = null;
            if (nomPersWA || conceptoWA) {
                var pendientesIng = (APP_STATE.finanzas.ingresos || []).filter(function(i) { return i && !i.cobrado; });
                ingresoWA = _buscarEnLista(pendientesIng, nomPersWA || conceptoWA, function(i) {
                    return [i.personaCobro || '', i.personaPrestamo || '', i.cliente || '', i.fuente || ''];
                });
            }
            var metodoReq = ['pago_movil', 'transferencia', 'binance'].indexOf(args.metodo_pago) !== -1 ? args.metodo_pago : '';
            var payloadDirecto = ingresoWA
                ? ingresoWA.id
                : {
                    modo: 'directo',
                    tarjetaId: trjWA ? trjWA.id : '',
                    metodoPago: metodoReq,
                    persona: nomPersWA,
                    telefono: String(args.telefono || '').trim(),
                    concepto: conceptoWA,
                    monto: Number(args.monto) || 0,
                    fechaISO: String(args.fecha || '').slice(0, 10)
                };
            if (ingresoWA && trjWA) {
                ingresoWA.tarjetaCobroWaId = trjWA.id;
            }
            if (typeof global.abrirModalCobroWhatsAppFinanzas === 'function') {
                global.abrirModalCobroWhatsAppFinanzas(payloadDirecto);
                if (ingresoWA && metodoReq && typeof global.seleccionarMetodoPagoCobroWA === 'function') {
                    global.seleccionarMetodoPagoCobroWA(metodoReq);
                }
            }
            var msgListo = '';
            var taEl = (typeof document !== 'undefined') ? document.getElementById('modal-cobro-wa-textarea') : null;
            if (taEl && taEl.value) {
                msgListo = taEl.value;
            } else if (trjWA && typeof global.construirBloquePagoTarjetaWhatsApp === 'function') {
                msgListo = global.construirBloquePagoTarjetaWhatsApp(trjWA);
            }
            return {
                data: {
                    ok: true,
                    modo: ingresoWA ? 'ingreso_pendiente' : 'directo',
                    persona: nomPersWA || (ingresoWA && (ingresoWA.personaCobro || ingresoWA.cliente)) || '',
                    tarjeta: trjWA ? ((typeof global.construirTituloTarjeta === 'function') ? global.construirTituloTarjeta(trjWA) : trjWA.banco) : null,
                    metodo_pago: metodoReq || 'auto',
                    mensaje_listo: msgListo
                },
                vista: 'vista-finanzas',
                esEscritura: false,
                label: 'WhatsApp Cobro listo'
            };
        }

        var rawMonto = Number(args.monto) || 0;
        if (!(rawMonto > 0)) return { data: { ok: false, error: 'El monto debe ser mayor a 0.' }, label: 'Monto inválido' };

        var moneda = (args.moneda === 'VES') ? 'VES' : 'USD';
        var tasaModo = (args.tasa_tipo === 'euro') ? 'eur' : (args.tasa_tipo === 'paralelo' ? 'paralelo' : 'bcv');
        var conv = (typeof global.convertirMontoFinanzasAUsd === 'function')
            ? global.convertirMontoFinanzasAUsd(rawMonto, moneda, tasaModo)
            : { valido: moneda === 'USD', usd: Math.round(rawMonto * 100) / 100, bs: 0, tasaUsada: 0 };

        if (!conv.valido || !(conv.usd > 0)) {
            return { data: { ok: false, error: 'No hay tasa API en caché para convertir Bs. a USD. Abre Finanzas y actualiza las tasas primero.' }, vista: 'vista-finanzas', label: 'Sin tasa Bs.' };
        }

        var montoUsd = conv.usd;
        var fecha = String(args.fecha || _hoyISO()).slice(0, 10);
        var dia = parseInt(fecha.slice(8, 10), 10) || new Date().getDate();
        var ahora = Date.now();

        if (accion === 'abonar_meta') {
            var meta = _buscarEnLista(APP_STATE.finanzas.metas, args.meta_nombre_o_id || args.concepto || '', function(m) { return [m.nombre]; });
            if (!meta) return { data: { ok: false, error: 'No encontré la meta financiera indicada.' }, vista: 'vista-finanzas', label: 'Meta no encontrada' };
            var metaTotal = Number(meta.metaTotal || meta.objetivo) || 0;
            meta.ahorrado = metaTotal > 0 ? Math.min(metaTotal, Math.round(((Number(meta.ahorrado) || 0) + montoUsd) * 100) / 100) : Math.round(((Number(meta.ahorrado) || 0) + montoUsd) * 100) / 100;
            if (metaTotal > 0) meta.faltante = Math.max(0, Math.round((metaTotal - meta.ahorrado) * 100) / 100);
            meta.fechaActualizacion = ahora;
            APP_STATE.finanzas.aportesMetas.push({
                id: 'APO-' + ahora,
                metaId: meta.id,
                metaNombre: meta.nombre,
                monto: montoUsd,
                dia: dia,
                fecha: fecha
            });
            _guardarYRefrescar(['finanzas']);
            _notificarToast('🎯 Abono +$' + montoUsd.toFixed(2) + ' a meta "' + meta.nombre + '"', '🎯');
            return {
                data: { ok: true, meta: meta.nombre, abonado_usd: montoUsd, total_ahorrado: meta.ahorrado, meta_total: metaTotal },
                vista: 'vista-finanzas',
                esEscritura: true,
                label: 'Abonó $' + montoUsd.toFixed(2) + ' a ' + _recortar(meta.nombre, 16)
            };
        }

        var aplicado = args.aplicado_ahora !== false;
        var trjRes = _resolverTarjetaFinanzasPorNombre(args.tarjeta_nombre_o_id);
        var trj = trjRes.tarjeta;
        if (args.tarjeta_nombre_o_id && !trj && !trjRes.esEfectivo) {
            return { data: { ok: false, error: 'No encontré la tarjeta o cuenta "' + args.tarjeta_nombre_o_id + '". Consulta monarca_consultar_finanzas para ver tus tarjetas.' }, vista: 'vista-finanzas', label: 'Tarjeta no encontrada' };
        }

        if (accion === 'ingreso') {
            var fuente = String(args.concepto || 'Ingreso registrado por IA').trim();
            var ingObj = {
                id: 'ING-' + ahora,
                fuente: fuente,
                tipo: 'aleatoria',
                dia: dia,
                fecha: fecha,
                monto: montoUsd,
                monedaOrigen: moneda,
                montoOriginalBs: moneda === 'VES' ? conv.bs : 0,
                tasaTipo: tasaModo,
                tasaUsada: conv.tasaUsada || 0,
                tarjetaId: trj ? trj.id : null,
                tarjetasDistribucion: trj ? [{ tarjetaId: trj.id, montoUsd: montoUsd }] : [],
                cobrado: aplicado,
                montoCobrado: aplicado ? montoUsd : 0,
                timestamp: ahora,
                fechaActualizacion: ahora
            };
            var movIngOk = true;
            if (aplicado && trj && typeof global.aplicarTarjetasMovimientoFinanzas === 'function') {
                var mRes = global.aplicarTarjetasMovimientoFinanzas(ingObj, true, [{ tarjetaId: trj.id, montoUsd: montoUsd }], fuente);
                if (!mRes || mRes.length === 0) {
                    ingObj.cobrado = false;
                    ingObj.montoCobrado = 0;
                    movIngOk = false;
                }
            }
            APP_STATE.finanzas.ingresos.push(ingObj);
            _guardarYRefrescar(['finanzas']);
            _notificarToast('💰 Ingreso +$' + montoUsd.toFixed(2) + ': ' + fuente, '💰');
            return {
                data: {
                    ok: true,
                    id: ingObj.id,
                    concepto: fuente,
                    monto_usd: montoUsd,
                    tarjeta: trj ? ((typeof global.construirTituloTarjeta === 'function') ? global.construirTituloTarjeta(trj) : trj.banco) : null,
                    cobrado: ingObj.cobrado,
                    movimiento_tarjeta_aplicado: movIngOk
                },
                vista: 'vista-finanzas',
                esEscritura: true,
                label: 'Ingreso +$' + montoUsd.toFixed(2)
            };
        }

        // Gasto
        var concepto = String(args.concepto || 'Gasto registrado por IA').trim();
        var cats = Array.isArray(APP_STATE.finanzas.categoriasGastos) ? APP_STATE.finanzas.categoriasGastos : [];
        var catFound = args.categoria ? _buscarEnLista(cats, args.categoria, function(c) { return [c.nombre]; }) : null;
        var categoriaNom = catFound ? catFound.nombre : (args.categoria || 'Otros');
        var pilar = ['gastos', 'inversion', 'ahorro'].indexOf(args.pilar) !== -1 ? args.pilar : 'gastos';

        var gasObj = {
            id: 'GAS-' + ahora,
            tipo: 'ocasional',
            categoria: categoriaNom,
            concepto: concepto,
            dia: dia,
            fecha: fecha,
            monto: montoUsd,
            monedaOrigen: moneda,
            montoOriginalBs: moneda === 'VES' ? conv.bs : 0,
            tasaTipo: tasaModo,
            tasaUsada: conv.tasaUsada || 0,
            pilar: pilar,
            tarjetaId: trj ? trj.id : (trjRes.esEfectivo ? '__EFECTIVO__' : null),
            esPrestamo: false,
            pagado: aplicado,
            montoAbonado: aplicado ? montoUsd : 0,
            fechaPago: aplicado ? new Date().toISOString() : undefined,
            timestamp: ahora,
            fechaActualizacion: ahora
        };
        var movGasOk = true;
        if (aplicado && trj && typeof global.aplicarTarjetasMovimientoFinanzas === 'function') {
            var mGasRes = global.aplicarTarjetasMovimientoFinanzas(gasObj, false, [{ tarjetaId: trj.id, montoUsd: montoUsd }], 'Gasto: ' + concepto);
            if (!mGasRes || mGasRes.length === 0) {
                gasObj.pagado = false;
                gasObj.montoAbonado = 0;
                delete gasObj.fechaPago;
                movGasOk = false;
            }
        }
        APP_STATE.finanzas.gastos.push(gasObj);
        _guardarYRefrescar(['finanzas']);
        _notificarToast('💸 Gasto -$' + montoUsd.toFixed(2) + ': ' + concepto, '💸');
        return {
            data: {
                ok: true,
                id: gasObj.id,
                concepto: concepto,
                categoria: categoriaNom,
                monto_usd: montoUsd,
                tarjeta: trj ? ((typeof global.construirTituloTarjeta === 'function') ? global.construirTituloTarjeta(trj) : trj.banco) : (trjRes.esEfectivo ? 'Efectivo' : null),
                pagado: gasObj.pagado,
                movimiento_tarjeta_aplicado: movGasOk
            },
            vista: 'vista-finanzas',
            esEscritura: true,
            label: 'Gasto -$' + montoUsd.toFixed(2)
        };
    }

    function _execGestionarIdeaAutoPC(args) {
        args = args || {};
        if (!global.APP_STATE) return { data: { ok: false, error: 'APP_STATE no disponible' }, label: 'Error Ideas' };
        if (!Array.isArray(APP_STATE.ideas)) APP_STATE.ideas = [];
        var accion = String(args.accion || 'crear');

        if (accion === 'marcar_hecha') {
            var targetH = _buscarEnLista(APP_STATE.ideas, args.idea_id_o_texto || args.texto || '', function(i) { return [i.textoPrompt || '', i.texto || '']; });
            if (!targetH) return { data: { ok: false, error: 'No encontré esa idea.' }, vista: 'vista-ideas', label: 'Idea no encontrada' };
            if (!targetH.hecha) {
                targetH.hecha = true;
                targetH.timestampHecha = Date.now();
                targetH.fechaHecha = new Date().toLocaleDateString('es-ES');
                targetH.fechaActualizacion = Date.now();
                if (typeof global.sumarExp === 'function') global.sumarExp(15);
                _guardarYRefrescar(['ideas']);
            }
            _notificarToast('✓ Idea completada: ' + _recortar(targetH.textoPrompt || targetH.texto, 35), '💡');
            return { data: { ok: true, id: targetH.id, texto: targetH.textoPrompt || targetH.texto, hecha: true }, vista: 'vista-ideas', esEscritura: true, label: 'Completó idea' };
        }

        if (accion === 'enviar_autopc') {
            var targetAPC = _buscarEnLista(APP_STATE.ideas, args.idea_id_o_texto || args.texto || '', function(i) { return [i.textoPrompt || '', i.texto || '']; });
            if (!targetAPC) return { data: { ok: false, error: 'No encontré la idea indicada para enviar a Auto-PC.' }, vista: 'vista-ideas', label: 'Idea no encontrada' };
            if (typeof global.enviarIdeaAAutoPC === 'function') {
                global.enviarIdeaAAutoPC(targetAPC.id, false);
                return { data: { ok: true, id: targetAPC.id, texto: targetAPC.textoPrompt || targetAPC.texto, autopc_status: 'pending' }, vista: 'vista-ideas', esEscritura: true, label: 'Envió a Auto-PC 🚀' };
            }
            return { data: { ok: false, error: 'El puente de Auto-PC no está disponible.' }, label: 'Auto-PC no disponible' };
        }

        var texto = String(args.texto || '').trim();
        if (!texto) return { data: { ok: false, error: 'Escribe el contenido de la idea o tarea.' }, label: 'Falta texto' };
        var enviarAPC = !!args.enviar_a_autopc;
        var cat = enviarAPC ? '✨ Emily' : String(args.categoria || '💡 Ideas & Proyectos');
        var subcat = String(args.subcategoria || 'General');

        var reg = (typeof global.registrarIdeaEnMonarca === 'function')
            ? global.registrarIdeaEnMonarca(texto, cat, subcat, enviarAPC, null)
            : null;
        if (!reg) {
            var nid = Date.now();
            APP_STATE.ideas.unshift({
                id: nid,
                texto: texto,
                textoPrompt: texto,
                categoria: cat,
                subcategoria: subcat,
                fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
                timestamp: nid,
                fechaActualizacion: nid,
                hecha: false,
                autopcStatus: enviarAPC ? 'pending' : null,
                autopcPendienteSubida: enviarAPC
            });
            _guardarYRefrescar(['ideas']);
            reg = { id: nid, enviadaAutoPC: enviarAPC };
        } else {
            _guardarYRefrescar(['ideas']);
        }
        _notificarToast(enviarAPC ? '🚀 Idea guardada y enviada a Auto-PC' : '💡 Idea guardada en ' + cat, '💡');
        return {
            data: { ok: true, id: reg.id, categoria: cat, subcategoria: subcat, enviada_autopc: !!reg.enviadaAutoPC },
            vista: 'vista-ideas',
            esEscritura: true,
            label: enviarAPC ? 'Envió a Auto-PC 🚀' : 'Guardó Idea 💡'
        };
    }

    function _execGestionarConocimientoVocabulario(args) {
        args = args || {};
        if (!global.APP_STATE) return { data: { ok: false, error: 'APP_STATE no disponible' }, label: 'Error Conocimiento' };
        var accion = String(args.accion || '');
        var ahora = Date.now();

        if (accion === 'agregar_conocimiento') {
            var tit = String(args.titulo || '').trim();
            var pts = String(args.puntos_clave || '').trim();
            if (!tit || !pts) return { data: { ok: false, error: 'Necesito título y puntos_clave para guardar en Conocimiento.' }, label: 'Faltan campos' };
            if (!Array.isArray(APP_STATE.conocimientos)) APP_STATE.conocimientos = [];
            var nuevoCon = {
                id: 'CON-' + ahora,
                titulo: tit,
                area: String(args.area || 'Personal'),
                actividadOrigen: String(args.origen || 'Emily IA'),
                resumenPuntosClave: pts,
                nivelDominio: 'En Práctica',
                fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                timestamp: ahora,
                semanasRepasadas: 0,
                revisadoEstaSemana: true
            };
            APP_STATE.conocimientos.unshift(nuevoCon);
            if (typeof global.sumarExp === 'function') global.sumarExp(25);
            _guardarYRefrescar(['conocimientos']);
            _notificarToast('📚 Conocimiento guardado: ' + tit + ' (+25 EXP)', '📚');
            return { data: { ok: true, id: nuevoCon.id, titulo: tit, exp: 25 }, vista: 'vista-conocimiento', esEscritura: true, label: 'Guardó Conocimiento' };
        }

        if (accion === 'repasar_conocimiento') {
            var con = _buscarEnLista(APP_STATE.conocimientos || [], args.titulo || '', function(c) { return [c.titulo]; });
            if (!con) return { data: { ok: false, error: 'No encontré esa nota de conocimiento.' }, vista: 'vista-conocimiento', label: 'No encontrada' };
            if (!con.revisadoEstaSemana) {
                con.revisadoEstaSemana = true;
                con.semanasRepasadas = (Number(con.semanasRepasadas) || 0) + 1;
                if (typeof global.sumarExp === 'function') global.sumarExp(15);
                if (APP_STATE.menteAtributos && APP_STATE.menteAtributos.conocimiento !== undefined) {
                    APP_STATE.menteAtributos.conocimiento = Math.min(100, (APP_STATE.menteAtributos.conocimiento || 0) + 5);
                }
            }
            con.fechaActualizacion = ahora;
            _guardarYRefrescar(['conocimientos']);
            _notificarToast('🧠 Repaso afianzado: ' + con.titulo + ' (+15 EXP)', '🧠');
            return { data: { ok: true, id: con.id, titulo: con.titulo, semanas_repasadas: con.semanasRepasadas }, vista: 'vista-conocimiento', esEscritura: true, label: 'Repasó técnica 🧠' };
        }

        if (accion === 'agregar_vocabulario') {
            var pal = String(args.palabra || '').trim();
            var sig = String(args.significado || '').trim();
            if (!pal || !sig) return { data: { ok: false, error: 'Necesito palabra y significado para Vocabulario.' }, label: 'Faltan campos' };
            var listaV = (typeof global.asegurarVocabularioState === 'function') ? global.asegurarVocabularioState() : (APP_STATE.vocabulario = APP_STATE.vocabulario || []);
            var semClave = (typeof global.obtenerRangoSemanaActualVocab === 'function') ? global.obtenerRangoSemanaActualVocab().clave : '';
            var metaS = Math.min(10, Math.max(1, parseInt(args.meta_semanal, 10) || 3));
            var nuevoVoc = {
                id: 'VOC-' + ahora,
                palabra: pal,
                significado: sig,
                reemplazaA: String(args.reemplaza_a || ''),
                ejemplo: String(args.ejemplo || ''),
                contexto: String(args.contexto || 'Conversación'),
                enSemanaActual: true,
                usosSemana: 0,
                usosTotales: 0,
                metaSemanal: metaS,
                dominada: false,
                semanaClave: semClave,
                fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                timestamp: ahora,
                fechaActualizacion: ahora
            };
            listaV.unshift(nuevoVoc);
            if (typeof global.sumarExp === 'function') global.sumarExp(15);
            _guardarYRefrescar(['vocabulario']);
            _notificarToast('🗣️ Palabra añadida: "' + pal + '" (+15 EXP)', '🗣️');
            return { data: { ok: true, id: nuevoVoc.id, palabra: pal, meta_semanal: metaS }, vista: 'vista-conocimiento', esEscritura: true, label: 'Vocabulario: ' + pal };
        }

        if (accion === 'usar_vocabulario') {
            var vFound = _buscarEnLista(APP_STATE.vocabulario || [], args.palabra || args.titulo || '', function(w) { return [w.palabra]; });
            if (!vFound) return { data: { ok: false, error: 'No encontré esa palabra en tu vocabulario.' }, vista: 'vista-conocimiento', label: 'Palabra no encontrada' };
            if (typeof global.registrarUsoPalabraVocab === 'function') {
                global.registrarUsoPalabraVocab(vFound.id, 1);
            } else {
                vFound.usosSemana = (Number(vFound.usosSemana) || 0) + 1;
                vFound.usosTotales = (Number(vFound.usosTotales) || 0) + 1;
                if (vFound.usosSemana >= (vFound.metaSemanal || 3)) vFound.dominada = true;
                vFound.fechaActualizacion = ahora;
                if (typeof global.sumarExp === 'function') global.sumarExp(10);
                _guardarYRefrescar(['vocabulario']);
            }
            return {
                data: { ok: true, palabra: vFound.palabra, usos_semana: vFound.usosSemana, meta_semanal: vFound.metaSemanal || 3, dominada: !!vFound.dominada },
                vista: 'vista-conocimiento',
                esEscritura: true,
                label: 'Uso vocab: ' + vFound.palabra
            };
        }

        return { data: { ok: false, error: 'Acción desconocida: ' + accion }, label: 'Error' };
    }

    function _execControlarReproductor(args) {
        args = args || {};
        var mp = global.MonarcaPlayer;
        if (!mp) return { data: { ok: false, error: 'El reproductor MP3 no está disponible aún.' }, vista: 'vista-reproductor', label: 'Sin reproductor' };

        var accion = String(args.accion || 'estado');
        var q = String(args.query || '').trim();
        var stP = mp.getState ? mp.getState() : {};
        var canciones = mp.getCanciones ? (mp.getCanciones() || []) : [];
        var playlists = mp.getPlaylists ? (mp.getPlaylists() || []) : [];

        if (accion === 'play') {
            if (!stP.reproduciendo) {
                if (!stP.cancionActual && canciones.length > 0 && typeof mp.reproducirIndice === 'function') {
                    mp.reproducirIndice(0);
                } else if (typeof mp.togglePlayPausa === 'function') {
                    mp.togglePlayPausa();
                }
            }
        } else if (accion === 'pause') {
            if (stP.reproduciendo && typeof mp.togglePlayPausa === 'function') {
                mp.togglePlayPausa();
            }
        } else if (accion === 'toggle') {
            if (typeof mp.togglePlayPausa === 'function') mp.togglePlayPausa();
        } else if (accion === 'siguiente') {
            if (typeof mp.siguienteCancion === 'function') mp.siguienteCancion();
        } else if (accion === 'anterior') {
            if (typeof mp.anteriorCancion === 'function') mp.anteriorCancion();
        } else if (accion === 'top_canciones') {
            if (typeof mp.reproducirTopCanciones === 'function') mp.reproducirTopCanciones();
        } else if (accion === 'toggle_shuffle') {
            if (typeof mp.toggleShuffle === 'function') mp.toggleShuffle();
        } else if (accion === 'toggle_inteligente') {
            if (typeof mp.toggleModoInteligente === 'function') mp.toggleModoInteligente();
        } else if (accion === 'reproducir_cancion') {
            if (canciones.length === 0) return { data: { ok: false, error: 'No tienes canciones cargadas en el Reproductor MP3.' }, vista: 'vista-reproductor', label: 'Biblioteca vacía' };
            var song = _buscarEnLista(canciones, q, function(s) { return [s.titulo || s.nombre || '', s.artista || '', (s.titulo || '') + ' ' + (s.artista || '')]; });
            if (!song) return { data: { ok: false, error: 'No encontré ninguna canción que coincida con "' + q + '".' }, vista: 'vista-reproductor', label: 'Canción no encontrada' };
            if (typeof mp.reproducirPorId === 'function') mp.reproducirPorId(song.id);
            return {
                data: { ok: true, reproduciendo: true, cancion: song.titulo || song.nombre, artista: song.artista || '' },
                vista: 'vista-reproductor',
                esEscritura: true,
                label: '▶️ ' + _recortar(song.titulo || song.nombre, 24)
            };
        } else if (accion === 'reproducir_playlist') {
            var pl = _buscarEnLista(playlists, q, function(p) { return [p.nombre || '']; });
            if (!pl) return { data: { ok: false, error: 'No encontré la playlist "' + q + '".' }, vista: 'vista-reproductor', label: 'Playlist no encontrada' };
            if (typeof mp.reproducirPlaylistDirecto === 'function') mp.reproducirPlaylistDirecto(pl.id);
            return {
                data: { ok: true, playlist: pl.nombre, canciones: Array.isArray(pl.cancionIds) ? pl.cancionIds.length : 0 },
                vista: 'vista-reproductor',
                esEscritura: true,
                label: '🎶 Playlist: ' + _recortar(pl.nombre, 20)
            };
        } else if (accion === 'sleep_timer') {
            var mins = parseInt(args.minutos, 10);
            if (mins > 0 && typeof mp.setSleepTimerMinutos === 'function') {
                mp.setSleepTimerMinutos(mins, { noToggle: true });
            } else if (typeof mp.setSleepTimerFinPista === 'function') {
                mp.setSleepTimerFinPista({ noToggle: true });
            }
        } else if (accion === 'cancelar_sleep_timer') {
            if (typeof mp.cancelarSleepTimer === 'function') mp.cancelarSleepTimer();
        }

        var stAfter = mp.getState ? (mp.getState() || {}) : {};
        var cAct = stAfter.cancionActual;
        var stSleep = (typeof mp.obtenerEstadoSleepTimer === 'function') ? mp.obtenerEstadoSleepTimer() : null;
        return {
            data: {
                ok: true,
                accion: accion,
                reproduciendo: !!stAfter.reproduciendo,
                cancion_actual: cAct ? ((cAct.titulo || cAct.nombre) + (cAct.artista ? (' - ' + cAct.artista) : '')) : null,
                shuffle: !!stAfter.shuffle,
                modo_inteligente: !!stAfter.modoInteligente,
                sleep_timer: stSleep
            },
            vista: 'vista-reproductor',
            esEscritura: accion !== 'estado',
            label: accion === 'estado' ? 'Consultó Música' : (accion === 'sleep_timer' ? '🌙 Temporizador Audio' : ('🎵 Música: ' + accion))
        };
    }

    function _execRegistrarLaborHabilidad(args) {
        args = args || {};
        if (!global.APP_STATE) return { data: { ok: false, error: 'APP_STATE no disponible' }, label: 'Error' };
        var accion = String(args.accion || '');
        var horas = Number(args.horas) || 0;
        var mins = Number(args.minutos) || 0;
        if (!(horas > 0) && mins > 0) horas = Math.round((mins / 60) * 100) / 100;

        if (accion === 'sumar_horas_habilidad') {
            var hab = _buscarEnLista(APP_STATE.habilidades || [], args.habilidad_nombre_o_id || '', function(h) { return [h.nombre]; });
            if (!hab) return { data: { ok: false, error: 'No encontré la habilidad indicada.' }, vista: 'vista-acciones-progresion', subtab: 'skills', label: 'Habilidad no encontrada' };
            if (!(horas > 0)) horas = 1;
            if (typeof global.sumarHorasHabilidad === 'function') {
                global.sumarHorasHabilidad(hab.id, horas, { minutos: mins || Math.round(horas * 60), origen: 'emily_ia' });
            } else {
                hab.horasTotales = Math.round(((Number(hab.horasTotales) || 0) + horas) * 100) / 100;
                if (typeof global.sumarExp === 'function') global.sumarExp(Math.max(1, Math.round(horas * 10)));
                _guardarYRefrescar(['habilidades']);
            }
            return {
                data: { ok: true, habilidad: hab.nombre, horas_sumadas: horas, horas_totales: hab.horasTotales },
                vista: 'vista-acciones-progresion',
                subtab: 'skills',
                esEscritura: true,
                label: '+' + horas + 'h en ' + _recortar(hab.nombre, 18)
            };
        }

        // Registrar jornada laboral
        if (!Array.isArray(APP_STATE.registrosLabores)) APP_STATE.registrosLabores = [];
        var cats = Array.isArray(APP_STATE.categoriasLabores) ? APP_STATE.categoriasLabores : [];
        var labFound = args.labor_nombre_o_id ? _buscarEnLista(cats, args.labor_nombre_o_id, function(c) { return [c.nombre || c.id || '']; }) : null;
        var laborId = labFound ? labFound.id : String(args.labor_nombre_o_id || (cats[0] && cats[0].id) || 'boom');
        var laborNom = labFound ? (labFound.nombre || laborId) : laborId;
        var fechaVal = String(args.fecha || _hoyISO()).slice(0, 10);
        var hrsLab = horas > 0 ? horas : 4;
        var desc = String(args.descripcion || 'Jornada registrada por Emily IA').trim();
        var hon = Math.max(0, Number(args.honorarios_usd) || 0);
        var ahora = Date.now();

        var regLab = {
            id: 'REG-LAB-' + ahora,
            laborId: laborId,
            fecha: fechaVal,
            horas: hrsLab,
            descripcion: desc,
            honorarios: hon,
            timestamp: ahora
        };
        APP_STATE.registrosLabores.unshift(regLab);
        var expGan = Math.round(hrsLab * 10);
        if (typeof global.sumarExp === 'function') global.sumarExp(expGan);

        if (hon > 0 && APP_STATE.finanzas) {
            if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];
            APP_STATE.finanzas.ingresos.push({
                id: 'ING-LAB-' + regLab.id,
                fuente: 'Labor: ' + laborNom + ' - ' + desc,
                tipo: 'labor',
                categoria: 'Labores & Servicios',
                monto: hon,
                fecha: fechaVal,
                dia: parseInt(fechaVal.slice(8, 10), 10) || new Date().getDate(),
                cobrado: true,
                laborId: regLab.id,
                timestamp: ahora,
                fechaActualizacion: ahora
            });
        }
        _guardarYRefrescar(['labores', 'finanzas']);
        _notificarToast('💼 Jornada registrada en ' + laborNom + ' (' + hrsLab + 'h)', '💼');
        return {
            data: { ok: true, id: regLab.id, labor: laborNom, fecha: fechaVal, horas: hrsLab, honorarios_usd: hon, exp: expGan },
            vista: 'vista-labores',
            esEscritura: true,
            label: 'Jornada: ' + _recortar(laborNom, 18)
        };
    }

    function _execGestionarInventario(args) {
        args = args || {};
        if (!global.APP_STATE) return { data: { ok: false, error: 'APP_STATE no disponible' }, label: 'Error Inventario' };
        if (typeof global.asegurarEstructuraInventario === 'function') global.asegurarEstructuraInventario();
        if (!APP_STATE.inventario) APP_STATE.inventario = { productos: [], categorias: [], ventas: [] };

        var prod = _buscarEnLista(APP_STATE.inventario.productos || [], args.producto_nombre_o_id || '', function(p) {
            return [p.nombre || '', p.marca || '', p.categoriaNombre || ''];
        });
        if (!prod) return { data: { ok: false, error: 'No encontré el producto indicado en el inventario.' }, vista: 'vista-inventario', label: 'Producto no encontrado' };

        var accion = String(args.accion || 'registrar_venta');
        var tieneVar = !!(prod.tieneVariantes && Array.isArray(prod.variantes) && prod.variantes.length > 0);
        var varianteObj = null;
        if (tieneVar) {
            if (args.variante) {
                varianteObj = _buscarEnLista(prod.variantes, args.variante, function(v) {
                    return [(v.talla || '') + ' ' + (v.color || ''), v.talla || '', v.color || ''];
                });
            }
            if (!varianteObj) {
                varianteObj = prod.variantes.find(function(v) { return (Number(v.stock) || 0) > 0; }) || prod.variantes[0];
            }
        }

        if (accion === 'ajustar_stock') {
            var delta = parseInt(args.delta_stock, 10);
            if (isNaN(delta) || delta === 0) return { data: { ok: false, error: 'Indica delta_stock distinto de 0.' }, label: 'Delta inválido' };
            if (varianteObj) {
                varianteObj.stock = Math.max(0, (Number(varianteObj.stock) || 0) + delta);
                prod.stock = prod.variantes.reduce(function(acc, v) { return acc + Math.max(0, Number(v.stock) || 0); }, 0);
            } else {
                prod.stock = Math.max(0, (Number(prod.stock) || 0) + delta);
            }
            prod.fechaActualizacion = Date.now();
            _guardarYRefrescar(['inventario']);
            _notificarToast('📦 Stock actualizado: ' + prod.nombre + ' -> ' + prod.stock, '📦');
            return {
                data: { ok: true, producto: prod.nombre, stock_actual: prod.stock },
                vista: 'vista-inventario',
                esEscritura: true,
                label: 'Stock: ' + _recortar(prod.nombre, 16) + ' (' + prod.stock + ')'
            };
        }

        // Registrar venta al contado
        var cant = Math.max(1, parseInt(args.cantidad, 10) || 1);
        var disp = varianteObj ? Math.max(0, Number(varianteObj.stock) || 0) : Math.max(0, Number(prod.stock) || 0);
        if (cant > disp) {
            return { data: { ok: false, error: 'Stock insuficiente para "' + prod.nombre + '" (disponibles: ' + disp + ').' }, vista: 'vista-inventario', label: 'Sin stock suficiente' };
        }

        var precioU = (args.precio_unitario_usd !== undefined && Number(args.precio_unitario_usd) >= 0)
            ? Number(args.precio_unitario_usd)
            : Number(prod.precioVenta != null ? prod.precioVenta : (prod.costo || 0));
        var totalV = Math.round((cant * precioU) * 100) / 100;
        var varDet = varianteObj ? ((varianteObj.talla ? ('Talla ' + varianteObj.talla) : '') + (varianteObj.color ? (' · ' + varianteObj.color) : '')).trim() : '';

        if (varianteObj) {
            varianteObj.stock = Math.max(0, disp - cant);
            prod.stock = prod.variantes.reduce(function(acc, v) { return acc + Math.max(0, Number(v.stock) || 0); }, 0);
        } else {
            prod.stock = Math.max(0, disp - cant);
        }
        prod.totalVendidos = (Number(prod.totalVendidos) || 0) + cant;
        prod.fechaActualizacion = Date.now();

        var nowV = Date.now();
        var trjRes = _resolverTarjetaFinanzasPorNombre(args.tarjeta_nombre_o_id);
        var trjV = trjRes.tarjeta;
        var fechaHoy = _hoyISO();
        var nuevaV = {
            id: 'VENTA-' + nowV,
            productoId: prod.id,
            productoNombre: prod.nombre,
            esVentaUnica: prod.tipoProducto === 'venta_unica',
            tipoProducto: prod.tipoProducto || 'catalogo',
            estado: prod.estado || 'Nuevo',
            varianteId: varianteObj ? varianteObj.id : null,
            varianteDetalle: varDet || null,
            categoriaId: prod.categoriaId || '',
            categoriaNombre: prod.categoriaNombre || 'General',
            cantidad: cant,
            precioUnitario: precioU,
            totalVenta: totalV,
            modalidad: 'contado',
            cliente: String(args.cliente || '').trim(),
            tarjetaId: trjV ? trjV.id : '',
            cuotas: [],
            observacion: String(args.observacion || 'Registrada por Emily IA'),
            fecha: fechaHoy,
            hora: _horaAhoraHHMM(),
            timestamp: nowV
        };
        APP_STATE.inventario.ventas.unshift(nuevaV);

        if (args.registrar_en_finanzas !== false && APP_STATE.finanzas && totalV > 0) {
            if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];
            var ingAlmacen = {
                id: 'ING-V-' + nowV,
                fuente: 'Venta: ' + prod.nombre + (varDet ? (' (' + varDet + ')') : '') + ' (' + cant + ' unid.)' + (nuevaV.cliente ? (' - ' + nuevaV.cliente) : ''),
                tipo: 'almacen',
                categoria: 'Ventas / Almacén',
                monto: totalV,
                fecha: fechaHoy,
                dia: new Date().getDate(),
                cobrado: true,
                ventaId: nuevaV.id,
                tarjetaId: trjV ? trjV.id : null,
                timestamp: nowV,
                fechaActualizacion: nowV
            };
            if (trjV && typeof global.aplicarTarjetasMovimientoFinanzas === 'function') {
                global.aplicarTarjetasMovimientoFinanzas(ingAlmacen, true, [{ tarjetaId: trjV.id, montoUsd: totalV }], ingAlmacen.fuente);
            }
            APP_STATE.finanzas.ingresos.push(ingAlmacen);
        }

        _guardarYRefrescar(['inventario', 'finanzas']);
        _notificarToast('🏷️ Venta: ' + cant + 'x ' + prod.nombre + ' ($' + totalV.toFixed(2) + ')', '🏷️');
        return {
            data: { ok: true, venta_id: nuevaV.id, producto: prod.nombre, cantidad: cant, total_usd: totalV, stock_restante: prod.stock },
            vista: 'vista-inventario',
            esEscritura: true,
            label: 'Venta $' + totalV.toFixed(2)
        };
    }

    function _execGirarRuleta(args) {
        if (!global.APP_STATE) return { data: { ok: false, error: 'APP_STATE no disponible' }, label: 'Error Ruleta' };
        var cat = String((args && args.categoria) || 'comidas');
        if (!APP_STATE.ruletaSemanal) APP_STATE.ruletaSemanal = {};
        if (!APP_STATE.ruletaSemanal.seleccionActiva) APP_STATE.ruletaSemanal.seleccionActiva = {};

        var obtenerOpts = function(c) {
            if (typeof global.obtenerOpcionesRuletaCategoria === 'function') {
                try { return global.obtenerOpcionesRuletaCategoria(c) || []; } catch (e) {}
            }
            if (c === 'musica' && global.MonarcaPlayer && typeof global.MonarcaPlayer.getPlaylists === 'function') {
                return (global.MonarcaPlayer.getPlaylists() || []).map(function(pl) { return { id: pl.id, playlistId: pl.id, nombre: pl.nombre }; });
            }
            return (APP_STATE.ruletaSemanal[c] || []).map(function(o) { return typeof o === 'string' ? { nombre: o } : o; });
        };

        var fechaTxt = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (cat === 'completa') {
            var coms = obtenerOpts('comidas');
            var vess = obtenerOpts('vestimenta');
            var muss = obtenerOpts('musica');
            if (!coms.length && !vess.length && !muss.length) {
                return { data: { ok: false, error: 'No hay opciones registradas en la Ruleta Semanal.' }, vista: 'vista-ruleta', label: 'Ruleta vacía' };
            }
            var winC = coms.length ? coms[Math.floor(Math.random() * coms.length)] : null;
            var winV = vess.length ? vess[Math.floor(Math.random() * vess.length)] : null;
            var winM = muss.length ? muss[Math.floor(Math.random() * muss.length)] : null;
            if (winC) APP_STATE.ruletaSemanal.seleccionActiva.comida = winC.nombre;
            if (winV) APP_STATE.ruletaSemanal.seleccionActiva.vestimenta = winV.nombre;
            if (winM) {
                APP_STATE.ruletaSemanal.seleccionActiva.musica = winM.nombre;
                APP_STATE.ruletaSemanal.seleccionActiva.musicaPlaylistId = winM.playlistId || winM.id || null;
            }
            APP_STATE.ruletaSemanal.seleccionActiva.fechaGiro = fechaTxt;
            if (!Array.isArray(APP_STATE.ruletaSemanal.historialGiros)) APP_STATE.ruletaSemanal.historialGiros = [];
            APP_STATE.ruletaSemanal.historialGiros.unshift({
                fecha: fechaTxt,
                comida: winC ? winC.nombre : '',
                vestimenta: winV ? winV.nombre : '',
                musica: winM ? winM.nombre : '',
                musicaPlaylistId: winM ? (winM.playlistId || winM.id || null) : null
            });
            if (APP_STATE.ruletaSemanal.historialGiros.length > 10) APP_STATE.ruletaSemanal.historialGiros.pop();
            if (typeof global.sumarExp === 'function') global.sumarExp(25);
            _guardarYRefrescar(['ruleta']);
            _notificarToast('🎲 Ruleta completa lista (+25 EXP)', '🎲');
            return {
                data: { ok: true, categoria: 'completa', seleccion: APP_STATE.ruletaSemanal.seleccionActiva, exp: 25 },
                vista: 'vista-ruleta',
                esEscritura: true,
                label: 'Ruleta Completa 🎲'
            };
        }

        var items = obtenerOpts(cat);
        if (!items.length) {
            return { data: { ok: false, error: 'No hay opciones en la ruleta "' + cat + '".' }, vista: 'vista-ruleta', label: 'Sin opciones' };
        }
        var ganador = items[Math.floor(Math.random() * items.length)];
        if (cat === 'comidas') APP_STATE.ruletaSemanal.seleccionActiva.comida = ganador.nombre;
        else if (cat === 'vestimenta') APP_STATE.ruletaSemanal.seleccionActiva.vestimenta = ganador.nombre;
        else if (cat === 'musica') {
            APP_STATE.ruletaSemanal.seleccionActiva.musica = ganador.nombre;
            APP_STATE.ruletaSemanal.seleccionActiva.musicaPlaylistId = ganador.playlistId || ganador.id || null;
        }
        APP_STATE.ruletaSemanal.seleccionActiva.fechaGiro = fechaTxt;
        if (typeof global.sumarExp === 'function') global.sumarExp(10);
        _guardarYRefrescar(['ruleta']);
        _notificarToast('🎲 Ruleta ' + cat + ': ' + ganador.nombre + ' (+10 EXP)', '🎲');
        return {
            data: { ok: true, categoria: cat, ganador: ganador.nombre, exp: 10 },
            vista: 'vista-ruleta',
            esEscritura: true,
            label: 'Ruleta: ' + _recortar(ganador.nombre, 20)
        };
    }

    function _execGestionarPersonas(args) {
        args = args || {};
        if (!global.APP_STATE) return { data: { ok: false, error: 'APP_STATE no disponible' }, label: 'Error Personas' };
        if (!Array.isArray(APP_STATE.agendaPersonas)) APP_STATE.agendaPersonas = [];
        var accion = String(args.accion || 'crear_persona');
        var ahora = Date.now();
        var telArg = String(args.telefono || '').trim();

        if (accion === 'agregar_tema_nota' || accion === 'actualizar_contacto') {
            var pObj = _buscarEnLista(APP_STATE.agendaPersonas, args.persona_nombre_o_id || args.nombre || '', function(p) { return [p.nombre]; });
            if (!pObj) return { data: { ok: false, error: 'No encontré a esa persona en tu agenda.' }, vista: 'vista-personas', label: 'Persona no encontrada' };
            if (telArg) pObj.telefono = telArg;
            if (args.rol) pObj.rol = String(args.rol).trim();
            if (args.lugar) pObj.lugarProyectado = String(args.lugar).trim();
            if (args.fecha_objetivo) pObj.fechaObjetivo = String(args.fecha_objetivo).trim();

            var notaTxt = String(args.tema_o_nota || '').trim();
            if (notaTxt) {
                if (!Array.isArray(pObj.temasPendientes)) pObj.temasPendientes = [];
                pObj.temasPendientes.push({ id: 'T-' + Math.random().toString(36).substr(2, 9), texto: notaTxt, hecho: false });
            }
            pObj.fechaActualizacion = ahora;
            _guardarYRefrescar(['personas']);
            _notificarToast('👥 Contacto actualizado: ' + pObj.nombre, '👥');
            return {
                data: { ok: true, persona: pObj.nombre, telefono: pObj.telefono || '', tema: notaTxt || null },
                vista: 'vista-personas',
                esEscritura: true,
                label: 'Actualizó ' + _recortar(pObj.nombre, 16)
            };
        }

        var nombre = String(args.nombre || args.persona_nombre_o_id || '').trim();
        if (!nombre) return { data: { ok: false, error: 'Indica el nombre de la persona.' }, label: 'Falta nombre' };
        var temas = args.tema_o_nota ? [{ id: 'T-' + Math.random().toString(36).substr(2, 9), texto: String(args.tema_o_nota).trim(), hecho: false }] : [];
        var nuevo = {
            id: 'PER-' + ahora + '-' + Math.random().toString(36).substr(2, 4),
            nombre: nombre,
            rol: String(args.rol || 'Contacto'),
            telefono: telArg,
            ubicacionCategoria: String(args.ubicacion || '💬 Otro'),
            lugarProyectado: String(args.lugar || ''),
            temasPendientes: temas,
            fechaObjetivo: String(args.fecha_objetivo || 'Esta semana'),
            estado: 'Pendiente',
            timestamp: ahora
        };
        APP_STATE.agendaPersonas.unshift(nuevo);
        if (typeof global.sumarExp === 'function') global.sumarExp(15);
        _guardarYRefrescar(['personas']);
        _notificarToast('👥 Contacto agregado: ' + nombre + ' (+15 EXP)', '👥');
        return { data: { ok: true, id: nuevo.id, nombre: nombre, telefono: telArg }, vista: 'vista-personas', esEscritura: true, label: 'Contacto: ' + _recortar(nombre, 18) };
    }

    var EJECUTORES = {
        'monarca_consultar_agenda': { fn: _execConsultarAgenda, icono: '📅', escritura: false },
        'monarca_consultar_finanzas': { fn: _execConsultarFinanzas, icono: '💰', escritura: false },
        'monarca_consultar_modulo': { fn: _execConsultarModulo, icono: '🔍', escritura: false },
        'monarca_navegar_vista': { fn: _execNavegarVista, icono: '🧭', escritura: false },
        'monarca_crear_calendario': { fn: _execCrearCalendario, icono: '📅', escritura: true },
        'monarca_gestionar_quest': { fn: _execGestionarQuest, icono: '⚔️', escritura: true },
        'monarca_registrar_finanza': { fn: _execRegistrarFinanza, icono: '💳', escritura: true },
        'monarca_gestionar_idea_autopc': { fn: _execGestionarIdeaAutoPC, icono: '💡', escritura: true },
        'monarca_gestionar_conocimiento_vocabulario': { fn: _execGestionarConocimientoVocabulario, icono: '📚', escritura: true },
        'monarca_controlar_reproductor': { fn: _execControlarReproductor, icono: '🎵', escritura: true },
        'monarca_registrar_labor_habilidad': { fn: _execRegistrarLaborHabilidad, icono: '💼', escritura: true },
        'monarca_gestionar_inventario': { fn: _execGestionarInventario, icono: '📦', escritura: true },
        'monarca_girar_ruleta': { fn: _execGirarRuleta, icono: '🎲', escritura: true },
        'monarca_gestionar_personas': { fn: _execGestionarPersonas, icono: '👥', escritura: true }
    };

    function ejecutarHerramienta(nombre, argsRaw, ctx) {
        ctx = ctx || {};
        var spec = EJECUTORES[String(nombre || '')];
        if (!spec) {
            return {
                resultado: { ok: false, error: 'Herramienta no reconocida: ' + nombre },
                meta: { herramienta: nombre, ok: false, icono: '⚠️', label: 'Desconocida', esEscritura: false }
            };
        }
        if (ctx.soloLectura && spec.escritura) {
            return {
                resultado: { ok: false, error: 'Modo Solo Lectura activo: no se permiten acciones que modifiquen datos.' },
                meta: { herramienta: nombre, ok: false, icono: '🔒', label: 'Bloqueado (Solo Lectura)', esEscritura: true }
            };
        }

        var argsObj = argsRaw;
        if (typeof argsRaw === 'string') {
            try { argsObj = argsRaw.trim() ? JSON.parse(argsRaw) : {}; } catch (eJson) { argsObj = {}; }
        }
        if (!argsObj || typeof argsObj !== 'object') argsObj = {};

        try {
            var res = spec.fn(argsObj, ctx) || { data: { ok: true }, label: nombre };
            var ok = !(res.data && res.data.ok === false);
            return {
                resultado: res.data || { ok: ok },
                meta: {
                    herramienta: nombre,
                    ok: ok,
                    icono: ok ? spec.icono : '⚠️',
                    label: res.label || nombre,
                    vista: res.vista || '',
                    subtab: res.subtab || '',
                    esEscritura: !!(res.esEscritura || spec.escritura)
                }
            };
        } catch (err) {
            return {
                resultado: { ok: false, error: (err && err.message) ? err.message : 'Error interno ejecutando herramienta.' },
                meta: { herramienta: nombre, ok: false, icono: '⚠️', label: 'Error en ' + nombre, esEscritura: spec.escritura }
            };
        }
    }

    function describirHerramientaEnCurso(nombre) {
        var mapa = {
            'monarca_consultar_agenda': '📅 Consultando Calendario y Horario...',
            'monarca_consultar_finanzas': '💰 Consultando Finanzas y Tarjetas...',
            'monarca_consultar_modulo': '🔍 Leyendo módulo de Sistema Monarca...',
            'monarca_navegar_vista': '🧭 Abriendo sección en pantalla...',
            'monarca_crear_calendario': '📅 Actualizando tu Calendario...',
            'monarca_gestionar_quest': '⚔️ Actualizando Quests / Rutina...',
            'monarca_registrar_finanza': '💳 Registrando movimiento en Finanzas...',
            'monarca_gestionar_idea_autopc': '💡 Procesando Idea / Auto-PC...',
            'monarca_gestionar_conocimiento_vocabulario': '📚 Guardando en Conocimiento / Vocabulario...',
            'monarca_controlar_reproductor': '🎵 Controlando Reproductor MP3...',
            'monarca_registrar_labor_habilidad': '💼 Registrando Labor / Habilidad...',
            'monarca_gestionar_inventario': '📦 Actualizando Inventario / Ventas...',
            'monarca_girar_ruleta': '🎲 Girando Ruleta Semanal...',
            'monarca_gestionar_personas': '👥 Actualizando Agenda de Personas...'
        };
        return mapa[nombre] || ('⚡ Ejecutando ' + nombre + '...');
    }

    function abrirVistaDesdeChipIA(vistaId, subtab) {
        if (!vistaId) return;
        _execNavegarVista({ vista: vistaId, subtab: subtab || '' }, { origen: 'chip_ui' });
    }

    global.MonarcaIATools = {
        construirContextoCompleto: construirContextoCompleto,
        obtenerDeclaracionesHerramientas: obtenerDeclaracionesHerramientas,
        ejecutarHerramienta: ejecutarHerramienta,
        describirHerramientaEnCurso: describirHerramientaEnCurso,
        abrirVistaDesdeChipIA: abrirVistaDesdeChipIA
    };
    global.abrirVistaDesdeChipIA = abrirVistaDesdeChipIA;

})(typeof window !== 'undefined' ? window : this);
