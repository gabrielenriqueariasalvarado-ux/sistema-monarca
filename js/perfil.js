/**
 * SISTEMA MONARCA · MÓDULO DE PERFIL DE USUARIO & CENTRO DE SINCRONIZACIÓN
 * Estadísticas de Jugador, Sincronización Multi-Dispositivo (Laptop ↔ Teléfono) y Respaldos.
 */

var PERFIL_MONITOR_TIMER = null;

function cargarPerfil() {
    renderizarPerfil(APP_STATE.perfil);
}

function escapeHtmlPerfil(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatearTiempoMonitorPerfil(ms) {
    if (typeof window.formatearDuracionCortaAutoPC === 'function') {
        return window.formatearDuracionCortaAutoPC(ms);
    }
    var seg = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    if (seg < 60) return seg + 's';
    var min = Math.floor(seg / 60);
    var remS = seg % 60;
    if (min < 60) return min + 'm ' + (remS > 0 ? remS + 's' : '');
    var hrs = Math.floor(min / 60);
    return hrs + 'h ' + (min % 60) + 'm';
}

function detenerTimerMonitorAutoPCPerfil() {
    if (PERFIL_MONITOR_TIMER) {
        clearInterval(PERFIL_MONITOR_TIMER);
        PERFIL_MONITOR_TIMER = null;
    }
}

function iniciarTimerMonitorAutoPCPerfil() {
    detenerTimerMonitorAutoPCPerfil();
    PERFIL_MONITOR_TIMER = setInterval(function() {
        if (window.VISTA_ACTUAL === 'vista-perfil') {
            actualizarTarjetaMonitorAutoPCPerfil();
        } else {
            detenerTimerMonitorAutoPCPerfil();
        }
    }, 1500);
}

async function enviarComandoRemotoAutoPCPerfil(action) {
    if (!window.MonarcaMQTT || typeof window.MonarcaMQTT.enviarComandoPC !== 'function') {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Módulo MQTT no cargado todavía.', '⚠️');
        }
        return;
    }
    var st = window.MonarcaMQTT.getStatus();
    if (!st.connected) {
        if (typeof window.abrirModalConfigMQTT === 'function') {
            window.abrirModalConfigMQTT();
        }
        return;
    }
    var ok = await window.MonarcaMQTT.enviarComandoPC(action);
    var labels = {
        start: '▶ Orden Iniciar / Reanudar enviada a Auto-PC',
        pause: '⏸ Orden Pausar enviada a Auto-PC',
        stop: '⏹ Orden Detener enviada a Auto-PC',
        sync_now: '🔄 Orden Sincronizar enviada a Auto-PC'
    };
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca(
            ok ? (labels[action] || ('⚡ Comando ' + action + ' enviado')) : 'No se pudo enviar la orden por MQTT.',
            ok ? '⚡' : '⚠️'
        );
    }
}

function obtenerTextoEstadoFilaMonitor(st) {
    if (st === 'awaiting_plan') return { icon: '📋', label: 'Plan pendiente', cls: 'is-plan' };
    if (st === 'running') return { icon: '⚙️', label: 'En curso', cls: 'is-running' };
    if (st === 'pending') return { icon: '⏳', label: 'En cola', cls: 'is-pending' };
    if (st === 'offline') return { icon: '📶', label: 'Por subir', cls: 'is-offline' };
    return { icon: '✅', label: 'Lista', cls: 'is-done' };
}

function obtenerFaseIndiceAntigravity(phaseCode) {
    if (phaseCode === 'completed') return 4;
    if (phaseCode === 'deploying' || phaseCode === 'waiting_ci') return 3;
    if (phaseCode === 'testing') return 2;
    if (phaseCode === 'editing') return 1;
    return 0;
}

function toggleResumenRecienteMonitorPerfil(itemId) {
    var el = document.getElementById('perfil-autopc-resumen-' + itemId);
    var btn = document.getElementById('perfil-autopc-resumen-btn-' + itemId);
    if (!el) return;
    var abierto = el.style.display === 'block';
    el.style.display = abierto ? 'none' : 'block';
    if (btn) btn.classList.toggle('is-open', !abierto);
}

function enviarAprobacionPlanPerfil() {
    if (typeof window.enviarDecisionPlanDesdePerfil === 'function') {
        window.enviarDecisionPlanDesdePerfil('approve', '');
    }
}

function enviarRespuestaPlanPerfil() {
    var input = document.getElementById('perfil-autopc-plan-reply-input');
    var txt = input ? String(input.value || '').trim() : '';
    if (typeof window.enviarDecisionPlanDesdePerfil === 'function') {
        window.enviarDecisionPlanDesdePerfil('reply', txt).then(function(ok) {
            if (ok && input) input.value = '';
        });
    }
}

function reenviarDecisionPlanPerfil(modo) {
    if (typeof window.reintentarDecisionPlanDesdePerfil === 'function') {
        window.reintentarDecisionPlanDesdePerfil(modo || 'resend');
    }
}

function _renderizarBloquePlanPendientePerfil(plan) {
    if (!plan) return '';
    var fmtHtml = function(txt) {
        if (!txt) return '';
        if (typeof window.formatearResumenAntigravityHtml === 'function') {
            return window.formatearResumenAntigravityHtml(txt);
        }
        return '<p class="ag-md-p">' + escapeHtmlPerfil(txt).replace(/\n/g, '<br>') + '</p>';
    };

    var planTimeTxt = '';
    if (plan.planUpdatedAt) {
        try {
            var d = new Date(Number(plan.planUpdatedAt));
            planTimeTxt = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {}
    }

    var msgHtml = plan.planMessage
        ? `<div class="perfil-ag-plan-msg">
               <div class="perfil-ag-plan-section-lbl">💬 Mensaje de Antigravity</div>
               <div class="perfil-ag-plan-msg-body">${fmtHtml(plan.planMessage)}</div>
           </div>`
        : '';

    var mdHtml = plan.planMarkdown
        ? `<div class="perfil-ag-plan-md-wrap">
               <div class="perfil-ag-plan-section-lbl">📄 implementation_plan.md</div>
               <div id="perfil-autopc-plan-reader" class="perfil-ag-plan-reader">${fmtHtml(plan.planMarkdown)}</div>
           </div>`
        : `<div class="perfil-ag-plan-msg-body" style="color: #cbd5e1; font-size: 12px;">Antigravity solicitó revisión del Implementation Plan y Auto-PC detuvo la cola hasta recibir tu decisión.</div>`;

    var desyncWarnHtml = plan.mqttDesincronizado
        ? `<div class="perfil-ag-plan-warn-pill">⚠️ Canal MQTT local distinto al de Auto-PC · usando Nube Firestore / LAN</div>`
        : '';

    var accionesHtml = '';
    if (plan.decisionEnviada) {
        var canales = [];
        if (plan.decisionViaLan) canales.push('🏠 Wi-Fi LAN');
        if (plan.decisionViaMqtt) canales.push('⚡ MQTT');
        if (plan.decisionViaCloud) canales.push('☁️ Firestore');
        var canalStr = canales.length > 0 ? (' · ' + canales.join(' + ')) : '';

        if (plan.decisionConsumida) {
            accionesHtml = `
            <div class="perfil-ag-plan-sent-note is-confirmed">
                <strong>✅ Confirmado por Auto-PC${escapeHtmlPerfil(canalStr)}</strong>
                ${plan.decisionTexto ? `<div class="perfil-ag-plan-sent-quote">"${escapeHtmlPerfil(plan.decisionTexto)}"</div>` : ''}
                <span>Auto-PC ya inyectó tu respuesta en Antigravity y está retomando el trabajo.</span>
            </div>`;
        } else if (plan.decisionDemorada) {
            accionesHtml = `
            <div class="perfil-ag-plan-sent-note is-delayed">
                <strong>⏳ Auto-PC aún no confirma la recepción${escapeHtmlPerfil(canalStr)}</strong>
                ${plan.decisionTexto ? `<div class="perfil-ag-plan-sent-quote">"${escapeHtmlPerfil(plan.decisionTexto)}"</div>` : ''}
                <span>Verifica que Auto-PC esté abierto en la PC (sin ventana bloqueada o versión antigua) y reintenta si sigue detenido.</span>
                <div class="perfil-ag-plan-retry-row">
                    <button type="button" class="btn-perfil-plan-retry" onclick="reenviarDecisionPlanPerfil('resend')">
                        🔄 Reintentar envío
                    </button>
                    <button type="button" class="btn-perfil-plan-edit" onclick="reenviarDecisionPlanPerfil('edit')">
                        ✏️ Cambiar respuesta
                    </button>
                </div>
            </div>`;
        } else {
            var decLabel = plan.decisionAction === 'reply'
                ? '📨 Indicaciones enviadas a Auto-PC'
                : '✅ Aprobación enviada a Auto-PC';
            accionesHtml = `
            <div class="perfil-ag-plan-sent-note">
                <strong>${decLabel}${escapeHtmlPerfil(canalStr)}</strong>
                ${plan.decisionTexto ? `<div class="perfil-ag-plan-sent-quote">"${escapeHtmlPerfil(plan.decisionTexto)}"</div>` : ''}
                <span>Esperando confirmación de Auto-PC para reanudar Antigravity...</span>
                <div class="perfil-ag-plan-retry-row">
                    <button type="button" class="btn-perfil-plan-edit" onclick="reenviarDecisionPlanPerfil('edit')">
                        ✏️ Cambiar respuesta
                    </button>
                </div>
            </div>`;
        }
    } else {
        accionesHtml = `
        <div class="perfil-ag-plan-actions">
            <button type="button" class="btn-perfil-plan-approve" onclick="enviarAprobacionPlanPerfil()">
                ✅ Aprobar Plan (Proceed)
            </button>
            <div class="perfil-ag-plan-reply-box">
                <label for="perfil-autopc-plan-reply-input" class="perfil-ag-plan-reply-lbl">
                    ✏️ O escribe ajustes / indicaciones para Antigravity:
                </label>
                <textarea id="perfil-autopc-plan-reply-input" class="perfil-ag-plan-reply-input" rows="2" maxlength="1200"
                    placeholder="Ej: Sí, hazlo pero también cambia X, o descarta la parte Y..."></textarea>
                <button type="button" class="btn-perfil-plan-reply" onclick="enviarRespuestaPlanPerfil()">
                    📨 Enviar indicaciones a Antigravity
                </button>
            </div>
        </div>`;
    }

    return `
    <div id="perfil-autopc-plan-box" class="perfil-ag-plan-card">
        <div class="perfil-ag-plan-head">
            <div class="perfil-ag-plan-title-row">
                <span class="perfil-ag-plan-badge">📋 IMPLEMENTATION PLAN</span>
                <span class="perfil-ag-plan-hold-pill">⏸ Cola detenida hasta tu decisión</span>
            </div>
            ${planTimeTxt ? `<span class="perfil-ag-plan-time">🕒 ${escapeHtmlPerfil(planTimeTxt)}</span>` : ''}
        </div>
        <div class="perfil-ag-plan-req">
            <span class="perfil-ag-plan-req-lbl">Solicitud:</span>
            <span class="perfil-ag-plan-req-txt">${escapeHtmlPerfil(plan.requestText || 'Solicitud activa')}</span>
        </div>
        ${msgHtml}
        ${mdHtml}
        ${desyncWarnHtml}
        ${accionesHtml}
    </div>`;
}

function _renderizarBloqueUltimaRespuestaPerfil(ultima) {
    if (!ultima || !ultima.respuesta) return '';
    var fmtHtml = (typeof window.formatearResumenAntigravityHtml === 'function')
        ? window.formatearResumenAntigravityHtml(ultima.respuesta)
        : ('<p class="ag-md-p">' + escapeHtmlPerfil(ultima.respuesta).replace(/\n/g, '<br>') + '</p>');

    var ageTxt = (ultima.ageMs !== null && ultima.ageMs !== undefined)
        ? ('Hace ' + formatearTiempoMonitorPerfil(ultima.ageMs))
        : '';

    var filesHtml = '';
    if (Array.isArray(ultima.archivos) && ultima.archivos.length > 0) {
        filesHtml = `<div class="perfil-ag-files-row">` +
            ultima.archivos.slice(0, 8).map(function(f) {
                return `<span class="perfil-ag-file-chip">📄 ${escapeHtmlPerfil(f)}</span>`;
            }).join('') +
        `</div>`;
    }

    return `
    <div class="perfil-ag-last-response-card">
        <div class="perfil-ag-last-response-head">
            <div class="perfil-ag-last-response-title">
                <span>💬 Última Respuesta de Antigravity</span>
                ${ultima.version ? `<span class="perfil-autopc-chip is-version" style="padding: 2px 7px; font-size: 10.5px;">🏷️ ${escapeHtmlPerfil(ultima.version)}</span>` : ''}
            </div>
            ${ageTxt ? `<span class="perfil-ag-last-response-age">${escapeHtmlPerfil(ageTxt)}</span>` : ''}
        </div>
        ${ultima.requestText ? `<div class="perfil-ag-last-response-req">Solicitud: <strong>${escapeHtmlPerfil(ultima.requestText)}</strong></div>` : ''}
        <div id="perfil-autopc-last-response-body" class="perfil-ag-last-response-body">${fmtHtml}</div>
        ${filesHtml}
    </div>`;
}

function renderizarContenidoMonitorAutoPCPerfil() {
    var resumen = (typeof window.obtenerResumenMonitoreoAutoPC === 'function')
        ? window.obtenerResumenMonitoreoAutoPC()
        : {
            nivel: 'idle',
            badgeTexto: 'Sin datos de Auto-PC',
            resumenTexto: 'Conecta Auto-PC para monitorear solicitudes en tiempo real.',
            proyecto: '',
            antigravityVisible: null,
            heartbeatAgeMs: null,
            enCursoAgeMs: 0,
            antigravity: null,
            planPendiente: null,
            ultimaRespuesta: null,
            cola: { running: 0, pending: 0, offlinePending: 0, done: 0, totalActive: 0 },
            solicitudActual: null,
            recientes: [],
            alertaStuck: ''
        };

    var ag = resumen.antigravity || null;
    var hbParts = [];
    if (resumen.heartbeatAgeMs !== null && resumen.heartbeatAgeMs !== undefined) {
        hbParts.push('Latido PC hace ' + formatearTiempoMonitorPerfil(resumen.heartbeatAgeMs));
    } else {
        hbParts.push('Sin latido directo aún');
    }
    if (ag && ag.lastStepAgeMs !== null && ag.lastStepAgeMs !== undefined) {
        hbParts.push('Último paso AG hace ' + formatearTiempoMonitorPerfil(ag.lastStepAgeMs));
    }
    var hbTxt = hbParts.join(' · ');

    var mqttSt = resumen.mqtt || (window.MonarcaMQTT && typeof window.MonarcaMQTT.getStatus === 'function' ? window.MonarcaMQTT.getStatus() : null);
    var mqttChip = '';
    if (resumen.mqttDesincronizado) {
        mqttChip = `<button type="button" class="perfil-autopc-chip is-warn is-clickable" onclick="abrirModalConfigMQTT()" title="Tu teléfono está en otro canal MQTT que Auto-PC">⚠️ Canal MQTT desfasado</button>`;
    } else if (mqttSt && mqttSt.connected) {
        var mqttLabel = mqttSt.pcOnline === true
            ? ('⚡ MQTT en vivo' + (mqttSt.lastLatencyMs ? (' · ' + mqttSt.lastLatencyMs + 'ms') : (mqttSt.encrypted ? ' · E2E' : '')))
            : (mqttSt.pcOnline === false ? '⚡ MQTT · PC cerrada' : '⚡ MQTT conectado');
        var mqttCls = mqttSt.pcOnline === false ? 'is-warn' : 'is-mqtt-live';
        mqttChip = `<button type="button" class="perfil-autopc-chip ${mqttCls} is-clickable" onclick="abrirModalConfigMQTT()" title="Estado y ajustes del canal MQTT">${escapeHtmlPerfil(mqttLabel)}</button>`;
    } else if (mqttSt && mqttSt.connecting) {
        mqttChip = `<button type="button" class="perfil-autopc-chip is-warn is-clickable" onclick="abrirModalConfigMQTT()">🟡 MQTT conectando...</button>`;
    } else {
        mqttChip = `<button type="button" class="perfil-autopc-chip is-clickable" onclick="abrirModalConfigMQTT()">⚙️ Conectar MQTT</button>`;
    }

    var proyectoChip = resumen.proyecto
        ? `<span class="perfil-autopc-chip">💻 ${escapeHtmlPerfil(resumen.proyecto)}</span>`
        : '';

    var agChip = '';
    if (resumen.antigravityVisible === true) {
        agChip = `<span class="perfil-autopc-chip is-ok">● Antigravity conectado</span>`;
    } else if (resumen.antigravityVisible === false && resumen.antigravityMinimized && resumen.nivel !== 'offline') {
        agChip = `<span class="perfil-autopc-chip is-minimized">⏸ Antigravity minimizado</span>`;
    } else if (resumen.antigravityVisible === false && resumen.nivel !== 'offline') {
        agChip = `<span class="perfil-autopc-chip is-warn">⚠️ Sin ventana Antigravity</span>`;
    }

    var verChip = (ag && ag.versionDetected)
        ? `<span class="perfil-autopc-chip is-version">🏷️ ${escapeHtmlPerfil(ag.versionDetected)}</span>`
        : '';

    var alertaHtml = resumen.alertaStuck
        ? `<div class="perfil-autopc-alert"><span>⚠️</span><span>${escapeHtmlPerfil(resumen.alertaStuck)}</span></div>`
        : '';

    var planPendienteHtml = _renderizarBloquePlanPendientePerfil(resumen.planPendiente);
    var ultimaRespuestaHtml = _renderizarBloqueUltimaRespuestaPerfil(resumen.ultimaRespuesta);

    // Bloque detallado de actividad precisa en Antigravity (solo cuando realmente está trabajando o en curso)
    var agLivePanelHtml = '';
    var hayTrabajoActivoReal = Boolean(
        resumen.nivel === 'working' ||
        (resumen.solicitudActual && resumen.solicitudActual.status === 'running')
    );
    if (ag && !resumen.planPendiente && hayTrabajoActivoReal) {
        var faseIdx = obtenerFaseIndiceAntigravity(ag.phaseCode);
        var pct = Math.max(5, Math.min(100, Number(ag.progressPct) || 15));
        var hitos = [
            { idx: 0, lbl: 'Analizar' },
            { idx: 1, lbl: 'Programar' },
            { idx: 2, lbl: 'Probar' },
            { idx: 3, lbl: 'Publicar' }
        ];
        var hitosHtml = hitos.map(function(h) {
            var cls = faseIdx > h.idx ? 'is-done' : (faseIdx === h.idx ? 'is-active' : '');
            return `<span class="perfil-ag-step-pill ${cls}">${faseIdx > h.idx ? '✓ ' : ''}${h.lbl}</span>`;
        }).join('');

        var filesHtml = '';
        if (Array.isArray(ag.filesTouched) && ag.filesTouched.length > 0) {
            filesHtml = `<div class="perfil-ag-files-row">` +
                ag.filesTouched.map(function(f) {
                    return `<span class="perfil-ag-file-chip">📄 ${escapeHtmlPerfil(f)}</span>`;
                }).join('') +
            `</div>`;
        }

        var bitacoraHtml = '';
        if (Array.isArray(ag.recentSteps) && ag.recentSteps.length > 0) {
            bitacoraHtml = `
            <details class="perfil-ag-steps-details">
                <summary class="perfil-ag-steps-summary">
                    <span>📋 Bitácora en vivo de Antigravity (${ag.stepsCount || ag.recentSteps.length} pasos)</span>
                    <span class="perfil-ag-chev">▾</span>
                </summary>
                <div class="perfil-ag-steps-list">
                    ${ag.recentSteps.slice().reverse().map(function(stepTxt, idxR) {
                        return `<div class="perfil-ag-step-line ${idxR === 0 ? 'is-latest' : ''}">${escapeHtmlPerfil(stepTxt)}</div>`;
                    }).join('')}
                </div>
            </details>`;
        }

        agLivePanelHtml = `
        <div class="perfil-ag-live-panel">
            <div class="perfil-ag-phase-row">
                <span class="perfil-ag-phase-badge">${escapeHtmlPerfil(ag.phaseLabel || '⚙️ Trabajando en Antigravity')}</span>
                <span class="perfil-ag-pct">${pct}% · ${Number(ag.stepsCount) || 0} pasos</span>
            </div>
            <div class="perfil-ag-progress-track">
                <div class="perfil-ag-progress-fill ${ag.phaseCode === 'completed' ? 'is-done' : ''}" style="width: ${pct}%;"></div>
            </div>
            <div class="perfil-ag-milestones">${hitosHtml}</div>
            ${ag.currentAction ? `
                <div class="perfil-ag-action-now">
                    <span class="perfil-ag-action-dot"></span>
                    <span class="perfil-ag-action-txt">${escapeHtmlPerfil(ag.currentAction)}</span>
                </div>
            ` : ''}
            ${filesHtml}
            ${bitacoraHtml}
        </div>`;
    }

    var actualHtml = '';
    if (!resumen.planPendiente) {
        if (resumen.solicitudActual) {
            var tiempoAct = resumen.solicitudActual.elapsedMs > 0
                ? `<span class="perfil-autopc-timer">⏱️ ${formatearTiempoMonitorPerfil(resumen.solicitudActual.elapsedMs)}</span>`
                : '';
            var tagEstadoAct = resumen.solicitudActual.status === 'running' ? 'TRABAJANDO AHORA' : 'SIGUIENTE EN COLA';
            actualHtml = `
            <div class="perfil-autopc-current">
                <div class="perfil-autopc-current-top">
                    <span class="perfil-autopc-current-label">${tagEstadoAct}</span>
                    ${tiempoAct}
                </div>
                <div class="perfil-autopc-current-text">${escapeHtmlPerfil(resumen.solicitudActual.texto)}</div>
                ${agLivePanelHtml || `<div class="perfil-autopc-current-detail">${escapeHtmlPerfil(resumen.resumenTexto)}</div>`}
            </div>`;
        } else {
            actualHtml = `
            <div class="perfil-autopc-current is-empty">
                <div class="perfil-autopc-current-detail">${escapeHtmlPerfil(resumen.resumenTexto)}</div>
            </div>`;
        }
    }

    var remoteControlsHtml = '';
    if (mqttSt && mqttSt.connected && mqttSt.pcOnline !== false && resumen.nivel !== 'offline') {
        var engUp = String(resumen.engineState || '').toUpperCase();
        var isRunningPc = engUp === 'RUNNING';
        var isPausedPc = engUp === 'PAUSED';
        remoteControlsHtml = `
        <div class="perfil-mqtt-controls" aria-label="Control remoto Auto-PC por MQTT">
            ${isRunningPc
                ? `<button type="button" class="btn-perfil-mqtt-cmd is-amber" onclick="enviarComandoRemotoAutoPCPerfil('pause')">⏸ Pausar</button>`
                : `<button type="button" class="btn-perfil-mqtt-cmd is-emerald" onclick="enviarComandoRemotoAutoPCPerfil('start')">▶ ${isPausedPc ? 'Reanudar' : 'Iniciar'}</button>`}
            <button type="button" class="btn-perfil-mqtt-cmd is-rose" onclick="enviarComandoRemotoAutoPCPerfil('stop')">⏹ Detener</button>
            <button type="button" class="btn-perfil-mqtt-cmd is-cyan" onclick="enviarComandoRemotoAutoPCPerfil('sync_now')">🔄 Sync</button>
            <button type="button" class="btn-perfil-mqtt-cmd" onclick="abrirModalConfigMQTT()" title="Ajustes MQTT">⚙️ MQTT</button>
        </div>`;
    }

    var recientesHtml = '';
    if (resumen.recientes && resumen.recientes.length > 0) {
        recientesHtml = `<div class="perfil-autopc-list">` +
            resumen.recientes.map(function(item) {
                var meta = obtenerTextoEstadoFilaMonitor(item.status);
                var tiempoItem = item.ageMs !== null && item.ageMs !== undefined
                    ? formatearTiempoMonitorPerfil(item.ageMs)
                    : '';
                var safeId = String(item.id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
                var tieneResumen = item.status === 'done' && item.resumenAntigravity;
                var resumenBtn = tieneResumen
                    ? `<button type="button" id="perfil-autopc-resumen-btn-${safeId}" class="perfil-autopc-row-sum-btn" onclick="toggleResumenRecienteMonitorPerfil('${safeId}')">💬 Ver respuesta ▾</button>`
                    : '';
                var resumenBody = tieneResumen
                    ? `<div id="perfil-autopc-resumen-${safeId}" class="perfil-autopc-row-sum-body" style="display: none;">
                           ${typeof window.formatearResumenAntigravityHtml === 'function'
                               ? window.formatearResumenAntigravityHtml(item.resumenAntigravity)
                               : escapeHtmlPerfil(item.resumenAntigravity)}
                       </div>`
                    : '';
                return `
                <div class="perfil-autopc-row-wrap">
                    <div class="perfil-autopc-row">
                        <span class="perfil-autopc-row-badge ${meta.cls}">${meta.icon} ${meta.label}</span>
                        <span class="perfil-autopc-row-text">${escapeHtmlPerfil(item.texto)}</span>
                        ${resumenBtn}
                        ${tiempoItem ? `<span class="perfil-autopc-row-time">${tiempoItem}</span>` : ''}
                    </div>
                    ${resumenBody}
                </div>`;
            }).join('') +
        `</div>`;
    }

    var offlineNote = (resumen.cola && resumen.cola.offlinePending > 0)
        ? ` · ${resumen.cola.offlinePending} offline`
        : '';

    return `
        <div class="perfil-autopc-header">
            <div class="perfil-autopc-title-wrap">
                <div class="perfil-autopc-title-row">
                    <span class="perfil-autopc-dot nivel-${escapeHtmlPerfil(resumen.nivel)}"></span>
                    <h3 style="margin: 0; font-size: 15px; color: #f8fafc; font-weight: 800;">🤖 Monitoreo Antigravity · Auto-PC</h3>
                </div>
                <span class="perfil-autopc-hb">${escapeHtmlPerfil(hbTxt)}</span>
            </div>
            <span class="perfil-autopc-status-pill nivel-${escapeHtmlPerfil(resumen.nivel)}">${escapeHtmlPerfil(resumen.badgeTexto)}</span>
        </div>

        ${(mqttChip || proyectoChip || agChip || verChip) ? `<div class="perfil-autopc-chips">${mqttChip}${proyectoChip}${agChip}${verChip}</div>` : ''}
        ${remoteControlsHtml}
        ${alertaHtml}
        ${planPendienteHtml}
        ${actualHtml}
        ${ultimaRespuestaHtml}

        <div class="perfil-autopc-kpis">
            <div class="perfil-autopc-kpi is-running">
                <span class="perfil-autopc-kpi-val">${Number(resumen.cola.running) || 0}</span>
                <span class="perfil-autopc-kpi-lbl">⚙️ En curso</span>
            </div>
            <div class="perfil-autopc-kpi is-pending">
                <span class="perfil-autopc-kpi-val">${Number(resumen.cola.pending) || 0}</span>
                <span class="perfil-autopc-kpi-lbl">⏳ En cola${escapeHtmlPerfil(offlineNote)}</span>
            </div>
            <div class="perfil-autopc-kpi is-done">
                <span class="perfil-autopc-kpi-val">${Number(resumen.cola.done) || 0}</span>
                <span class="perfil-autopc-kpi-lbl">✅ Listas</span>
            </div>
        </div>

        ${recientesHtml}

        <div class="perfil-autopc-footer">
            <button type="button" class="btn-perfil-autopc-link" onclick="cambiarVista('vista-ideas'); if(typeof abrirDetalleCategoriaIdeas === 'function') abrirDetalleCategoriaIdeas('✨ Emily');">
                💡 Ver cola en Ideas
            </button>
            <button type="button" class="btn-perfil-autopc-link is-done-link" onclick="if(typeof verSolicitudAutoPCEnOperatividad === 'function') verSolicitudAutoPCEnOperatividad();">
                📋 Ver Hechas &amp; Resúmenes
            </button>
        </div>
    `;
}

function actualizarTarjetaMonitorAutoPCPerfil() {
    var card = document.getElementById('perfil-autopc-monitor-card');
    if (!card) return;

    // Preservar estado abierto de <details>, resúmenes expandidos, textarea de respuesta al plan y scroll
    var det = card.querySelector('.perfil-ag-steps-details');
    var detAbierto = !!(det && det.open);
    var abiertosIds = [];
    card.querySelectorAll('.perfil-autopc-row-sum-body').forEach(function(b) {
        if (b.style.display === 'block' && b.id) abiertosIds.push(b.id);
    });

    var replyInput = document.getElementById('perfil-autopc-plan-reply-input');
    var replyVal = replyInput ? replyInput.value : '';
    var replyFocused = Boolean(replyInput && document.activeElement === replyInput);
    var replySelStart = replyFocused && typeof replyInput.selectionStart === 'number' ? replyInput.selectionStart : null;
    var replySelEnd = replyFocused && typeof replyInput.selectionEnd === 'number' ? replyInput.selectionEnd : null;

    var planReader = document.getElementById('perfil-autopc-plan-reader');
    var planScrollTop = planReader ? planReader.scrollTop : 0;

    var lastRespBody = document.getElementById('perfil-autopc-last-response-body');
    var lastRespScrollTop = lastRespBody ? lastRespBody.scrollTop : 0;

    card.innerHTML = renderizarContenidoMonitorAutoPCPerfil();

    if (detAbierto) {
        var detNuevo = card.querySelector('.perfil-ag-steps-details');
        if (detNuevo) detNuevo.open = true;
    }
    abiertosIds.forEach(function(bid) {
        var bNew = document.getElementById(bid);
        if (bNew) bNew.style.display = 'block';
        var btnId = bid.replace('perfil-autopc-resumen-', 'perfil-autopc-resumen-btn-');
        var btnNew = document.getElementById(btnId);
        if (btnNew) btnNew.classList.add('is-open');
    });

    var newReplyInput = document.getElementById('perfil-autopc-plan-reply-input');
    if (newReplyInput && replyVal) {
        newReplyInput.value = replyVal;
    }
    if (newReplyInput && replyFocused) {
        try {
            newReplyInput.focus({ preventScroll: true });
            if (replySelStart !== null && replySelEnd !== null) {
                newReplyInput.setSelectionRange(replySelStart, replySelEnd);
            }
        } catch (e) {}
    }

    var newPlanReader = document.getElementById('perfil-autopc-plan-reader');
    if (newPlanReader && planScrollTop > 0) {
        newPlanReader.scrollTop = planScrollTop;
    }

    var newLastRespBody = document.getElementById('perfil-autopc-last-response-body');
    if (newLastRespBody && lastRespScrollTop > 0) {
        newLastRespBody.scrollTop = lastRespScrollTop;
    }
}

function renderizarPerfil(perfil) {
    var p = perfil || APP_STATE.perfil || { str: 10, int: 10, vit: 10, mp: 100 };
    var j = APP_STATE.jugador || { titulo: "Gabriel Arias", nivel: 1, exp: 0, expMax: 100 };

    var html = `
    <!-- 1. ATRIBUTOS DEL JUGADOR -->
    <div class="perfil-stats-card">
        <div class="perfil-stats-header">
            <h3 style="margin: 0; font-size: 15px; color: #f8fafc; font-weight: 800;">⚔️ Atributos Principales</h3>
            <span class="perfil-level-pill">Nivel ${j.nivel || 1}</span>
        </div>
        <table class="table-finanzas perfil-stats-table" style="margin-bottom: 0;">
            <tbody>
                <tr><td><strong>Fuerza (STR)</strong></td><td class="perfil-stat-num">${p.str || 10}</td></tr>
                <tr><td><strong>Inteligencia (INT)</strong></td><td class="perfil-stat-num">${p.int || 10}</td></tr>
                <tr><td><strong>Vitalidad (VIT)</strong></td><td class="perfil-stat-num">${p.vit || 10}</td></tr>
                <tr><td><strong>Maná / Energía (MP)</strong></td><td class="perfil-stat-num is-mp">${p.mp || 100}</td></tr>
            </tbody>
        </table>
    </div>

    <!-- 2. MONITOREO EN VIVO DE ANTIGRAVITY & AUTO-PC -->
    <div id="perfil-autopc-monitor-card" class="perfil-autopc-card">
        ${renderizarContenidoMonitorAutoPCPerfil()}
    </div>

    <!-- 2B. PERMISOS DEL DISPOSITIVO -->
    <div id="perfil-permisos-card" class="perfil-permisos-card">
        <div class="perfil-permisos-left">
            <div class="perfil-permisos-icon">🔐</div>
            <div style="min-width: 0; flex: 1;">
                <div class="perfil-permisos-title-row">
                    <h3 class="perfil-permisos-title">Permisos del Dispositivo</h3>
                    <span id="perfil-permisos-badge" class="perfil-permisos-badge is-pending">Verificando...</span>
                </div>
                <p id="perfil-permisos-desc" class="perfil-permisos-desc">
                    Notificaciones, música, cámara, ubicación y almacenamiento disponibles aquí.
                </p>
            </div>
        </div>
        <button type="button" class="btn-perfil-permisos-open" onclick="if(typeof abrirModalPermisosSistema==='function') abrirModalPermisosSistema(false);">
            Administrar ›
        </button>
    </div>
    
    <!-- 3. CENTRO DE SINCRONIZACIÓN MULTI-DISPOSITIVO -->
    <div class="sync-hub-card">
        <div class="sync-hub-header">
            <div>
                <span class="sync-badge-pill">MULTI-DISPOSITIVO</span>
                <h3 class="sync-hub-title">🔄 Sincronización (Laptop ↔ Teléfono)</h3>
                <p class="sync-hub-subtitle">
                    Pasa tus datos de un dispositivo a otro al instante usando el método que te resulte más cómodo.
                </p>
            </div>
        </div>

        <div class="sync-grid-methods">
            <!-- MÉTODO 1: COPIAR Y PEGAR CÓDIGO (EL MÁS RÁPIDO PARA WHATSAPP) -->
            <div class="sync-method-card sync-method-highlight">
                <div class="sync-method-icon">📋</div>
                <div class="sync-method-body">
                    <div class="sync-method-title-row">
                        <h4 class="sync-method-title">Sincronización Rápida por Código</h4>
                        <span class="sync-tag-recommended">Recomendado</span>
                    </div>
                    <p class="sync-method-desc">
                        Copia una clave con todos tus datos en 1 clic para enviártela a tu propio chat de WhatsApp o notas y pegarla en tu teléfono.
                    </p>
                    <div class="sync-method-actions">
                        <button type="button" class="btn-sync-action btn-sync-dark" onclick="copiarCodigoSincronizacion()">
                            📋 Copiar Código
                        </button>
                        <button type="button" class="btn-sync-action btn-sync-light" onclick="abrirModalSincronizarCodigo()">
                            📥 Pegar y Sincronizar
                        </button>
                    </div>
                </div>
            </div>

            <!-- MÉTODO 2: COMPARTIR DIRECTO (WEB SHARE API) -->
            <div class="sync-method-card">
                <div class="sync-method-icon">📤</div>
                <div class="sync-method-body">
                    <h4 class="sync-method-title">Compartir Directo (WhatsApp / Drive)</h4>
                    <p class="sync-method-desc">
                        Abre la hoja nativa de compartir de tu teléfono o laptop para mandar el respaldo directamente a WhatsApp, Telegram o Google Drive.
                    </p>
                    <div class="sync-method-actions">
                        <button type="button" class="btn-sync-action btn-sync-light" onclick="MonarcaDB.shareBackup()">
                            📤 Compartir Respaldo
                        </button>
                    </div>
                </div>
            </div>

            <!-- MÉTODO 3: ARCHIVO JSON TRADICIONAL -->
            <div class="sync-method-card">
                <div class="sync-method-icon">💾</div>
                <div class="sync-method-body">
                    <h4 class="sync-method-title">Archivo de Respaldo (.JSON)</h4>
                    <p class="sync-method-desc">
                        Descarga una copia completa en tu equipo o carga un archivo JSON que hayas transferido previamente.
                    </p>
                    <div class="sync-method-actions">
                        <button type="button" class="btn-sync-action btn-sync-light" onclick="MonarcaDB.exportBackup()">
                            💾 Descargar JSON
                        </button>
                        <label class="btn-sync-action btn-sync-light" style="cursor: pointer; margin-bottom: 0;">
                            📂 Cargar Archivo
                            <input type="file" accept=".json" style="display: none;" onchange="if(this.files[0]) MonarcaDB.importBackup(this.files[0])">
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- ZONA DE RESTABLECIMIENTO -->
        <div class="sync-danger-zone">
            <div style="min-width: 0; flex: 1;">
                <strong class="sync-danger-title">Limpieza y Restablecimiento de Fábrica</strong>
                <span class="sync-danger-sub">Elimina todos los datos de prueba y deja la app 100% limpia para que agregues tus propias cosas.</span>
            </div>
            <button type="button" class="btn-sync-danger" onclick="MonarcaDB.resetDefault()">
                🗑️ Restablecer de Fábrica
            </button>
        </div>
    </div>`;

    var cont = document.getElementById('contenedor-perfil');
    if (cont) cont.innerHTML = html;
    iniciarTimerMonitorAutoPCPerfil();
    if (window.MonarcaPermisos && typeof window.MonarcaPermisos.actualizarResumenPerfil === 'function') {
        window.MonarcaPermisos.actualizarResumenPerfil();
    }
}

// --- FUNCIONES DEL CENTRO DE SINCRONIZACIÓN ---

function copiarCodigoSincronizacion() {
    var codigo = MonarcaDB.generateSyncCode();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codigo).then(function() {
            alert("📋 ¡Código de sincronización copiado al portapapeles!\n\nAhora ve a tu WhatsApp o Telegram, envíatelo a ti mismo y en tu teléfono abre la app y selecciona '📥 Pegar y Sincronizar'.");
        }).catch(function() {
            mostrarPromptCodigo(codigo);
        });
    } else {
        mostrarPromptCodigo(codigo);
    }
}

function mostrarPromptCodigo(codigo) {
    prompt("Copia este código de sincronización para llevar tus datos a tu teléfono:", codigo);
}

function abrirModalSincronizarCodigo() {
    var inTexto = document.getElementById('modal-sync-input-codigo');
    if (inTexto) inTexto.value = "";
    var prev = document.getElementById('modal-sync-preview-box');
    if (prev) prev.innerHTML = '<span style="color:#9ca3af; font-size:12px;">Pega tu código arriba para ver los datos a restaurar.</span>';
    var btn = document.getElementById('btn-confirmar-sync-codigo');
    if (btn) btn.disabled = true;

    var m = document.getElementById('modal-sincronizar-codigo');
    if (m) m.style.display = 'flex';
}

function cerrarModalSincronizarCodigo() {
    var m = document.getElementById('modal-sincronizar-codigo');
    if (m) m.style.display = 'none';
}

async function pegarDesdePortapapelesSync() {
    var inTexto = document.getElementById('modal-sync-input-codigo');
    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            var clipText = await navigator.clipboard.readText();
            if (clipText && inTexto) {
                inTexto.value = clipText.trim();
                analizarCodigoSincronizacion(clipText.trim());
                return;
            }
        }
    } catch(err) {
        console.warn("Clipboard access denied:", err);
    }
    if (inTexto) inTexto.focus();
}

function analizarCodigoSincronizacion(codigo) {
    var prev = document.getElementById('modal-sync-preview-box');
    var btn = document.getElementById('btn-confirmar-sync-codigo');
    if (!prev) return;

    if (!codigo || codigo.trim() === '') {
        prev.innerHTML = '<span style="color:#9ca3af; font-size:12px;">Pega tu código arriba para ver los datos a restaurar.</span>';
        if (btn) btn.disabled = true;
        return;
    }

    try {
        var data = MonarcaDB.decodeSyncCode(codigo);
        if (data && typeof data === 'object') {
            var nNom = data.jugador ? data.jugador.titulo : "Gabriel Arias";
            var nNiv = data.jugador ? data.jugador.nivel : 1;
            var nMis = data.misiones ? data.misiones.length : 0;
            var nHab = data.habilidades ? data.habilidades.length : 0;
            var nIng = (data.finanzas && data.finanzas.ingresos) ? data.finanzas.ingresos.length : 0;
            var nGas = (data.finanzas && data.finanzas.gastos) ? data.finanzas.gastos.length : 0;
            var nIde = data.ideas ? data.ideas.length : 0;
            var nRut = data.rutinas ? data.rutinas.length : 0;
            var nEj = data.ejercicios ? data.ejercicios.length : 0;

            prev.innerHTML = `
            <div style="color: #a7f3d0; background: rgba(16, 185, 129, 0.14); border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 10px; padding: 10px 14px; font-size: 12.5px;">
                <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; color: #6ee7b7;">
                    <span>✓</span> Respaldo verificado con éxito
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; color: #d1fae5; margin-top: 6px;">
                    <div>• 👤 Jugador: <strong>${nNom} (Nivel ${nNiv})</strong></div>
                    <div>• ⚡ Misiones: <strong>${nMis} hábitos</strong></div>
                    <div>• 🔮 Habilidades: <strong>${nHab} activas</strong></div>
                    <div>• 💰 Finanzas: <strong>${nIng} ingresos / ${nGas} gastos</strong></div>
                    <div>• 💡 Ideas: <strong>${nIde} guardadas</strong></div>
                    <div>• 🏋️‍♂️ Condición: <strong>${nRut} rutinas, ${nEj} ejercicios</strong></div>
                </div>
            </div>`;

            if (btn) {
                btn.disabled = false;
                btn.onclick = function() {
                    MonarcaDB.applySyncData(data);
                };
            }
        }
    } catch(err) {
        prev.innerHTML = `
        <div style="color: #fecaca; background: rgba(239, 68, 68, 0.14); border: 1px solid rgba(248, 113, 113, 0.35); border-radius: 10px; padding: 10px 14px; font-size: 12px;">
            ⚠️ El código ingresado no tiene un formato válido o está incompleto.
        </div>`;
        if (btn) btn.disabled = true;
    }
}

if (typeof window !== 'undefined') {
    window.toggleResumenRecienteMonitorPerfil = toggleResumenRecienteMonitorPerfil;
    window.enviarAprobacionPlanPerfil = enviarAprobacionPlanPerfil;
    window.enviarRespuestaPlanPerfil = enviarRespuestaPlanPerfil;
    window.reenviarDecisionPlanPerfil = reenviarDecisionPlanPerfil;
}

