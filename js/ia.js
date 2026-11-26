/**
 * SISTEMA MONARCA · MÓDULO IA CONVERSACIONAL (v11.27)
 * Asistente conversacional conectado a la API oficial Google Gemini Interactions API
 * (streaming SSE en tiempo real, historial multi-conversación sincronizado en Firestore,
 * soporte multimodal de imágenes, dictado/lectura por voz y Contexto Monarca opcional).
 */

var MONARCA_IA_API_KEY_STORAGE = 'monarca_ia_gemini_api_key';
var MONARCA_IA_ACTIVE_CONV_STORAGE = 'monarca_ia_conv_activa_id';
var MONARCA_IA_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
// Nota CORS (v11.29): NO enviar encabezado 'Api-Revision' desde navegador (Google responde 403 al preflight OPTIONS);
// el esquema moderno 'steps' ya es el predeterminado en /v1beta/interactions.
var MONARCA_IA_MAX_HISTORY_TURNS = 24;

var MONARCA_IA_MODELOS = [
    {
        id: 'gemini-3.8-flash',
        nombre: 'Gemini 3.8 Flash',
        etiqueta: 'Recomendado · Gratis',
        descripcion: 'Rápido, inteligente y multimodal (texto + imágenes). Gratis en Free Tier.',
        freeTier: true
    },
    {
        id: 'gemini-3.5-flash-lite',
        nombre: 'Gemini 3.5 Flash-Lite',
        etiqueta: 'Ultra rápido · Gratis',
        descripcion: 'Respuestas instantáneas y ligero para consultas rápidas. Gratis en Free Tier.',
        freeTier: true
    },
    {
        id: 'gemini-4-argon',
        nombre: 'Gemini 4 Argon',
        etiqueta: 'Máxima potencia · Paid Tier',
        descripcion: 'Máximo razonamiento, programación e investigación (requiere facturación en AI Studio).',
        freeTier: false
    }
];

var MONARCA_IA_PROMPTS_RAPIDOS = [
    {
        icono: '💡',
        titulo: 'Explícame algo claro',
        texto: 'Explícame un concepto complejo de forma sencilla, con un ejemplo real y pasos prácticos:'
    },
    {
        icono: '🎯',
        titulo: 'Planificar mi día',
        texto: 'Ayúdame a organizar mis prioridades de hoy en bloques claros de tiempo para ser más productivo.'
    },
    {
        icono: '✍️',
        titulo: 'Mejorar un mensaje',
        texto: 'Mejora el tono y la claridad de este mensaje para que suene profesional, directo y persuasivo:'
    },
    {
        icono: '🛠️',
        titulo: 'Resolver una duda técnica',
        texto: 'Tengo una duda técnica y necesito una solución directa paso a paso:'
    }
];

var IA_RUNTIME = {
    convActivaId: null,
    busqueda: '',
    drawerAbierto: false,
    generando: false,
    abortController: null,
    imagenPendiente: null, // { dataBase64, mimeType, dataUrlFull, thumbDataUrl, nombre }
    dictando: false,
    recognizer: null,
    hablandoMsgId: null
};

// ==========================================================================
// 1. ESTADO, CONFIGURACIÓN Y API KEY
// ==========================================================================

function asegurarEstadoIA() {
    if (typeof window.APP_STATE !== 'object' || !window.APP_STATE) return;
    if (!Array.isArray(APP_STATE.iaConversaciones)) {
        APP_STATE.iaConversaciones = [];
    }
    if (!APP_STATE.iaConfig || typeof APP_STATE.iaConfig !== 'object') {
        APP_STATE.iaConfig = {};
    }
    var cfg = APP_STATE.iaConfig;
    var modelosValidos = MONARCA_IA_MODELOS.map(function(m) { return m.id; });
    if (!cfg.modelo || modelosValidos.indexOf(cfg.modelo) === -1) {
        cfg.modelo = 'gemini-3.8-flash';
    }
    if (typeof cfg.instruccionesSistema !== 'string') {
        cfg.instruccionesSistema = '';
    }
    if (typeof cfg.contextoMonarcaDefault !== 'boolean') {
        cfg.contextoMonarcaDefault = false;
    }
    if (typeof cfg.googleSearch !== 'boolean') {
        cfg.googleSearch = false;
    }
    if (typeof cfg.sincronizarApiKeyNube !== 'boolean') {
        cfg.sincronizarApiKeyNube = false;
    }
    if (typeof cfg.apiKeyCloud !== 'string') {
        cfg.apiKeyCloud = '';
    }
    if (!APP_STATE._eliminados) APP_STATE._eliminados = {};
    if (!Array.isArray(APP_STATE._eliminados.iaConversaciones)) {
        APP_STATE._eliminados.iaConversaciones = [];
    }
}

function obtenerApiKeyGeminiIA() {
    asegurarEstadoIA();
    var localKey = '';
    try {
        localKey = String(localStorage.getItem(MONARCA_IA_API_KEY_STORAGE) || '').trim();
    } catch (e) {}
    if (localKey) return localKey;
    if (APP_STATE.iaConfig && APP_STATE.iaConfig.sincronizarApiKeyNube && APP_STATE.iaConfig.apiKeyCloud) {
        var cloudKey = String(APP_STATE.iaConfig.apiKeyCloud || '').trim();
        if (cloudKey) {
            try { localStorage.setItem(MONARCA_IA_API_KEY_STORAGE, cloudKey); } catch (e2) {}
            return cloudKey;
        }
    }
    return '';
}

function guardarApiKeyGeminiIA(key, sincronizarNube) {
    asegurarEstadoIA();
    var limpia = String(key || '').trim();
    try {
        if (limpia) {
            localStorage.setItem(MONARCA_IA_API_KEY_STORAGE, limpia);
        } else {
            localStorage.removeItem(MONARCA_IA_API_KEY_STORAGE);
        }
    } catch (e) {}
    APP_STATE.iaConfig.sincronizarApiKeyNube = !!sincronizarNube;
    APP_STATE.iaConfig.apiKeyCloud = sincronizarNube ? limpia : '';
    APP_STATE.iaConfig.fechaActualizacion = Date.now();
}

function obtenerInfoModeloIA(modeloId) {
    for (var i = 0; i < MONARCA_IA_MODELOS.length; i++) {
        if (MONARCA_IA_MODELOS[i].id === modeloId) return MONARCA_IA_MODELOS[i];
    }
    return MONARCA_IA_MODELOS[0];
}

function escaparHtmlIA(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatearFechaRelativaIA(ts) {
    var n = Number(ts) || 0;
    if (!n) return '';
    var diffSeg = Math.max(0, Math.floor((Date.now() - n) / 1000));
    if (diffSeg < 60) return 'Ahora';
    var mins = Math.floor(diffSeg / 60);
    if (mins < 60) return 'Hace ' + mins + 'm';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return 'Hace ' + hrs + 'h';
    var dias = Math.floor(hrs / 24);
    if (dias === 1) return 'Ayer';
    if (dias < 7) return 'Hace ' + dias + 'd';
    try {
        return new Date(n).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch (e) {
        return '';
    }
}

function formatearHoraMensajeIA(ts) {
    var d = new Date(Number(ts) || Date.now());
    try {
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
}

// ==========================================================================
// 2. RENDERIZADOR MARKDOWN SEGURO (ANTI-XSS)
// ==========================================================================

function _formatearInlineMarkdownIA(textoEscapado) {
    var s = textoEscapado;
    // Código en línea `...`
    s = s.replace(/`([^`\n]+)`/g, '<code class="ia-inline-code">$1</code>');
    // Enlaces seguros [texto](https://...)
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="ia-md-link">$1</a>');
    // Tachado ~~...~~
    s = s.replace(/~~([^~\n]+)~~/g, '<del class="ia-md-del">$1</del>');
    // Negrita **...**
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    // Cursiva *...*
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    return s;
}

function _parsearFilaTablaMarkdownIA(linea) {
    var t = String(linea || '').trim();
    if (t.indexOf('|') === -1) return null;
    if (t.charAt(0) === '|') t = t.slice(1);
    if (t.charAt(t.length - 1) === '|') t = t.slice(0, -1);
    var celdas = t.split('|').map(function(c) { return c.trim(); });
    return celdas.length > 0 ? celdas : null;
}

function _parsearSeparadorTablaMarkdownIA(linea) {
    var celdas = _parsearFilaTablaMarkdownIA(linea);
    if (!celdas || celdas.length === 0) return null;
    var alineaciones = [];
    for (var i = 0; i < celdas.length; i++) {
        var c = celdas[i];
        if (!/^:?-{3,}:?$/.test(c)) return null;
        var izq = c.charAt(0) === ':';
        var der = c.charAt(c.length - 1) === ':';
        if (izq && der) alineaciones.push('center');
        else if (der) alineaciones.push('right');
        else alineaciones.push('left');
    }
    return alineaciones;
}

function renderizarMarkdownSeguroIA(md) {
    if (!md) return '';
    var raw = String(md).replace(/\r\n/g, '\n');

    // Extraer bloques de código primero para proteger su contenido
    var codeBlocks = [];
    var withTokens = raw.replace(/```([a-zA-Z0-9_+#.-]*)\n?([\s\S]*?)```/g, function(_, lang, code) {
        var idx = codeBlocks.length;
        codeBlocks.push({
            lang: (lang || 'código').trim(),
            code: String(code || '').replace(/\n$/, '')
        });
        return '\n@@IA_CODE_BLOCK_' + idx + '@@\n';
    });

    var lines = withTokens.split('\n');
    var html = [];
    var inUl = false;
    var inOl = false;

    function cerrarListas() {
        if (inUl) { html.push('</ul>'); inUl = false; }
        if (inOl) { html.push('</ol>'); inOl = false; }
    }

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var trim = line.trim();

        var codeMatch = trim.match(/^@@IA_CODE_BLOCK_(\d+)@@$/);
        if (codeMatch) {
            cerrarListas();
            var cb = codeBlocks[parseInt(codeMatch[1], 10)];
            if (cb) {
                html.push(
                    '<div class="ia-code-block">' +
                        '<div class="ia-code-head">' +
                            '<span class="ia-code-lang">' + escaparHtmlIA(cb.lang) + '</span>' +
                            '<button type="button" class="ia-code-copy-btn" onclick="copiarBloqueCodigoIA(this)">📋 Copiar</button>' +
                        '</div>' +
                        '<pre><code>' + escaparHtmlIA(cb.code) + '</code></pre>' +
                    '</div>'
                );
            }
            continue;
        }

        if (!trim) {
            cerrarListas();
            continue;
        }

        // Tablas Markdown GFM (cabecera + fila separadora |---|---|)
        if (trim.indexOf('|') !== -1 && (i + 1) < lines.length) {
            var aligns = _parsearSeparadorTablaMarkdownIA(lines[i + 1]);
            var headCells = aligns ? _parsearFilaTablaMarkdownIA(trim) : null;
            if (aligns && headCells && headCells.length > 0) {
                cerrarListas();
                var colCount = Math.max(headCells.length, aligns.length);
                var thHtml = [];
                for (var hIdx = 0; hIdx < colCount; hIdx++) {
                    var hAlign = aligns[hIdx] || 'left';
                    var hText = headCells[hIdx] !== undefined ? headCells[hIdx] : '';
                    thHtml.push('<th style="text-align:' + hAlign + ';">' + _formatearInlineMarkdownIA(escaparHtmlIA(hText)) + '</th>');
                }
                var bodyRowsHtml = [];
                var rIdx = i + 2;
                while (rIdx < lines.length) {
                    var rTrim = lines[rIdx].trim();
                    if (!rTrim || rTrim.indexOf('|') === -1 || /^@@IA_CODE_BLOCK_\d+@@$/.test(rTrim)) break;
                    var rowCells = _parsearFilaTablaMarkdownIA(rTrim);
                    if (!rowCells) break;
                    var tdHtml = [];
                    for (var cIdx = 0; cIdx < colCount; cIdx++) {
                        var cAlign = aligns[cIdx] || 'left';
                        var cText = rowCells[cIdx] !== undefined ? rowCells[cIdx] : '';
                        tdHtml.push('<td style="text-align:' + cAlign + ';">' + _formatearInlineMarkdownIA(escaparHtmlIA(cText)) + '</td>');
                    }
                    bodyRowsHtml.push('<tr>' + tdHtml.join('') + '</tr>');
                    rIdx++;
                }
                html.push(
                    '<div class="ia-table-wrap">' +
                        '<table class="ia-md-table">' +
                            '<thead><tr>' + thHtml.join('') + '</tr></thead>' +
                            (bodyRowsHtml.length ? ('<tbody>' + bodyRowsHtml.join('') + '</tbody>') : '') +
                        '</table>' +
                    '</div>'
                );
                i = rIdx - 1;
                continue;
            }
        }

        // Separador horizontal
        if (/^(-{3,}|\*{3,})$/.test(trim)) {
            cerrarListas();
            html.push('<hr class="ia-md-hr">');
            continue;
        }

        // Encabezados
        var hMatch = trim.match(/^(#{1,4})\s+(.+)$/);
        if (hMatch) {
            cerrarListas();
            var lvl = Math.min(4, Math.max(2, hMatch[1].length + 1));
            html.push('<h' + lvl + ' class="ia-md-h">' + _formatearInlineMarkdownIA(escaparHtmlIA(hMatch[2])) + '</h' + lvl + '>');
            continue;
        }

        // Citas >
        var qMatch = trim.match(/^>\s?(.*)$/);
        if (qMatch) {
            cerrarListas();
            html.push('<blockquote class="ia-md-quote">' + _formatearInlineMarkdownIA(escaparHtmlIA(qMatch[1])) + '</blockquote>');
            continue;
        }

        // Lista con viñetas (incluyendo checklists - [x] / - [ ])
        var ulMatch = trim.match(/^[-*•]\s+(.+)$/);
        if (ulMatch) {
            if (inOl) { html.push('</ol>'); inOl = false; }
            if (!inUl) { html.push('<ul class="ia-md-list">'); inUl = true; }
            var taskMatch = ulMatch[1].match(/^\[( |x|X)\]\s+(.+)$/);
            if (taskMatch) {
                var hecha = taskMatch[1].toLowerCase() === 'x';
                html.push(
                    '<li class="ia-md-task' + (hecha ? ' is-done' : '') + '">' +
                        '<span class="ia-md-task-box" aria-hidden="true">' + (hecha ? '☑' : '☐') + '</span>' +
                        '<span>' + _formatearInlineMarkdownIA(escaparHtmlIA(taskMatch[2])) + '</span>' +
                    '</li>'
                );
            } else {
                html.push('<li>' + _formatearInlineMarkdownIA(escaparHtmlIA(ulMatch[1])) + '</li>');
            }
            continue;
        }

        // Lista numerada
        var olMatch = trim.match(/^\d+[.)]\s+(.+)$/);
        if (olMatch) {
            if (inUl) { html.push('</ul>'); inUl = false; }
            if (!inOl) { html.push('<ol class="ia-md-list is-ordered">'); inOl = true; }
            html.push('<li>' + _formatearInlineMarkdownIA(escaparHtmlIA(olMatch[1])) + '</li>');
            continue;
        }

        cerrarListas();
        html.push('<p class="ia-md-p">' + _formatearInlineMarkdownIA(escaparHtmlIA(trim)) + '</p>');
    }
    cerrarListas();
    return html.join('');
}

function copiarBloqueCodigoIA(btn) {
    if (!btn) return;
    var block = btn.closest('.ia-code-block');
    var codeEl = block ? block.querySelector('pre code') : null;
    var text = codeEl ? codeEl.textContent : '';
    if (!text) return;
    _copiarTextoPortapapelesIA(text).then(function() {
        var orig = btn.textContent;
        btn.textContent = '✓ Copiado';
        btn.classList.add('is-copied');
        setTimeout(function() {
            btn.textContent = orig;
            btn.classList.remove('is-copied');
        }, 1600);
    });
}

function _copiarTextoPortapapelesIA(texto) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(texto).catch(function() {
            return _copiarFallbackIA(texto);
        });
    }
    return Promise.resolve(_copiarFallbackIA(texto));
}

function _copiarFallbackIA(texto) {
    try {
        var ta = document.createElement('textarea');
        ta.value = texto;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
    } catch (e) {
        return false;
    }
}

// ==========================================================================
// 3. GESTIÓN DE CONVERSACIONES (CRUD + BÚSQUEDA + DRAWER)
// ==========================================================================

function obtenerConversacionActivaIA() {
    asegurarEstadoIA();
    if (!IA_RUNTIME.convActivaId) return null;
    return APP_STATE.iaConversaciones.find(function(c) {
        return c && String(c.id) === String(IA_RUNTIME.convActivaId);
    }) || null;
}

function _generarTituloAutomaticoIA(texto) {
    var limpio = String(texto || '').replace(/\s+/g, ' ').trim();
    if (!limpio) return 'Nueva conversación';
    if (limpio.length <= 44) return limpio;
    var corte = limpio.slice(0, 44);
    var ultEsp = corte.lastIndexOf(' ');
    if (ultEsp > 20) corte = corte.slice(0, ultEsp);
    return corte + '…';
}

function crearNuevaConversacionIA(opts) {
    opts = opts || {};
    asegurarEstadoIA();
    if (IA_RUNTIME.generando && !opts.forzar) {
        detenerGeneracionIA();
    }

    // Si la conversación actual ya está vacía, simplemente enfocamos esa en lugar de duplicar chats vacíos
    var act = obtenerConversacionActivaIA();
    if (!opts.forzarNueva && act && Array.isArray(act.mensajes) && act.mensajes.length === 0) {
        toggleDrawerConversacionesIA(false);
        renderizarVistaIA();
        _enfocarComposerIA();
        return act;
    }

    var ahora = Date.now();
    var nueva = {
        id: 'IA-CONV-' + ahora + '-' + Math.random().toString(36).slice(2, 6),
        titulo: opts.titulo || 'Nueva conversación',
        fijada: false,
        modelo: APP_STATE.iaConfig.modelo || 'gemini-3.8-flash',
        usarContextoMonarca: !!APP_STATE.iaConfig.contextoMonarcaDefault,
        creadaEn: ahora,
        fechaActualizacion: ahora,
        mensajes: []
    };
    APP_STATE.iaConversaciones.unshift(nueva);
    IA_RUNTIME.convActivaId = nueva.id;
    try { localStorage.setItem(MONARCA_IA_ACTIVE_CONV_STORAGE, nueva.id); } catch (e) {}

    if (!opts.sinGuardar && typeof MonarcaDB !== 'undefined' && typeof MonarcaDB.save === 'function') {
        MonarcaDB.save(APP_STATE);
    }
    toggleDrawerConversacionesIA(false);
    renderizarVistaIA();
    if (!opts.sinFocus) _enfocarComposerIA();
    return nueva;
}

function seleccionarConversacionIA(convId) {
    asegurarEstadoIA();
    if (IA_RUNTIME.generando) detenerGeneracionIA();
    var conv = APP_STATE.iaConversaciones.find(function(c) { return c && String(c.id) === String(convId); });
    if (!conv) return;
    IA_RUNTIME.convActivaId = conv.id;
    try { localStorage.setItem(MONARCA_IA_ACTIVE_CONV_STORAGE, conv.id); } catch (e) {}
    toggleDrawerConversacionesIA(false);
    renderizarVistaIA();
    _scrollChatAlFinalIA(true);
}

function renombrarConversacionIA(convId, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    asegurarEstadoIA();
    var conv = APP_STATE.iaConversaciones.find(function(c) { return c && String(c.id) === String(convId || IA_RUNTIME.convActivaId); });
    if (!conv) return;
    var nuevoTitulo = prompt('Nuevo nombre para esta conversación:', conv.titulo || 'Nueva conversación');
    if (nuevoTitulo === null) return;
    nuevoTitulo = String(nuevoTitulo).trim();
    if (!nuevoTitulo) return;
    conv.titulo = nuevoTitulo.slice(0, 80);
    conv.fechaActualizacion = Date.now();
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    renderizarVistaIA();
}

function toggleFijarConversacionIA(convId, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    asegurarEstadoIA();
    var conv = APP_STATE.iaConversaciones.find(function(c) { return c && String(c.id) === String(convId); });
    if (!conv) return;
    conv.fijada = !conv.fijada;
    conv.fechaActualizacion = Date.now();
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    renderizarListaConversacionesIA();
}

function eliminarConversacionIA(convId, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    asegurarEstadoIA();
    var conv = APP_STATE.iaConversaciones.find(function(c) { return c && String(c.id) === String(convId); });
    if (!conv) return;
    if (!confirm('¿Eliminar la conversación "' + (conv.titulo || 'Sin título') + '"?')) return;

    if (String(IA_RUNTIME.convActivaId) === String(convId) && IA_RUNTIME.generando) {
        detenerGeneracionIA();
    }

    APP_STATE.iaConversaciones = APP_STATE.iaConversaciones.filter(function(c) {
        return c && String(c.id) !== String(convId);
    });
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('iaConversaciones', convId);
    }
    if (String(IA_RUNTIME.convActivaId) === String(convId)) {
        IA_RUNTIME.convActivaId = APP_STATE.iaConversaciones.length > 0 ? APP_STATE.iaConversaciones[0].id : null;
        try {
            if (IA_RUNTIME.convActivaId) localStorage.setItem(MONARCA_IA_ACTIVE_CONV_STORAGE, IA_RUNTIME.convActivaId);
            else localStorage.removeItem(MONARCA_IA_ACTIVE_CONV_STORAGE);
        } catch (e) {}
    }
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    renderizarVistaIA();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Conversación eliminada', '🗑️');
    }
}

function filtrarConversacionesIA(val) {
    IA_RUNTIME.busqueda = String(val || '').trim().toLowerCase();
    renderizarListaConversacionesIA();
}

function toggleDrawerConversacionesIA(forzarEstado) {
    var shell = document.getElementById('ia-workspace-shell');
    var backdrop = document.getElementById('ia-drawer-backdrop');
    var abrir = (typeof forzarEstado === 'boolean') ? forzarEstado : !IA_RUNTIME.drawerAbierto;
    IA_RUNTIME.drawerAbierto = abrir;
    if (shell) shell.classList.toggle('is-drawer-open', abrir);
    if (backdrop) backdrop.style.display = abrir ? 'block' : 'none';
}

function toggleContextoMonarcaChatIA() {
    asegurarEstadoIA();
    var conv = obtenerConversacionActivaIA();
    if (!conv) {
        APP_STATE.iaConfig.contextoMonarcaDefault = !APP_STATE.iaConfig.contextoMonarcaDefault;
        APP_STATE.iaConfig.fechaActualizacion = Date.now();
    } else {
        conv.usarContextoMonarca = !conv.usarContextoMonarca;
        conv.fechaActualizacion = Date.now();
    }
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    renderizarCabeceraChatIA();
    var activo = conv ? !!conv.usarContextoMonarca : !!APP_STATE.iaConfig.contextoMonarcaDefault;
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca(
            activo
                ? 'Contexto Monarca ON: la IA puede consultar tus quests, rutinas y metas'
                : 'Contexto Monarca OFF: modo chat general libre',
            activo ? '👑' : '💬'
        );
    }
}

// ==========================================================================
// 4. CONTEXTO MONARCA OPCIONAL & CLIENTE GEMINI INTERACTIONS API (SSE)
// ==========================================================================

function construirContextoMonarcaParaIA() {
    if (typeof window.APP_STATE !== 'object' || !window.APP_STATE) return '';
    try {
        var jug = APP_STATE.jugador || {};
        var hoyISO = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().slice(0, 10);
        var quests = Array.isArray(APP_STATE.questsDiarios) ? APP_STATE.questsDiarios : [];
        var qPend = quests.filter(function(q) { return q && q.estado !== 'completada'; }).slice(0, 8);
        var qComp = quests.filter(function(q) { return q && q.estado === 'completada'; }).length;
        var rutinas = Array.isArray(APP_STATE.rutinas) ? APP_STATE.rutinas.slice(0, 6).map(function(r) { return r && r.nombre; }).filter(Boolean) : [];
        var fatProm = (APP_STATE.fatiga && typeof APP_STATE.fatiga.promedioHoy === 'number') ? APP_STATE.fatiga.promedioHoy : 0;
        var fatMente = (APP_STATE.fatigaMentalDiaria && typeof APP_STATE.fatigaMentalDiaria.nivel === 'number') ? APP_STATE.fatigaMentalDiaria.nivel : 0;
        var metas = (APP_STATE.finanzas && Array.isArray(APP_STATE.finanzas.metas))
            ? APP_STATE.finanzas.metas.slice(0, 4).map(function(m) {
                return (m.nombre || 'Meta') + ' ($' + (Number(m.ahorrado) || 0) + '/$' + (Number(m.objetivo) || 0) + ')';
            })
            : [];
        var vocab = Array.isArray(APP_STATE.vocabulario)
            ? APP_STATE.vocabulario.filter(function(v) { return v && !v.dominada; }).slice(0, 5).map(function(v) { return v.palabra; })
            : [];

        var lineas = [
            'Contexto actual del usuario en Sistema Monarca (fecha local ' + hoyISO + '):',
            '- Usuario: ' + (jug.titulo || 'Usuario') + ' · Nivel ' + (jug.nivel || 1) + ' (' + (jug.exp || 0) + '/' + (jug.expMax || 100) + ' EXP).',
            '- Fatiga física promedio: ' + fatProm + '% · Fatiga mental: ' + fatMente + '%.',
            '- Quests diarios: ' + qComp + ' completadas hoy, ' + qPend.length + ' pendientes' + (qPend.length ? (' (' + qPend.map(function(q) { return q.titulo + ' [' + q.estado + ']'; }).join(', ') + ')') : '') + '.'
        ];
        if (rutinas.length) lineas.push('- Rutinas registradas: ' + rutinas.join(', ') + '.');
        if (metas.length) lineas.push('- Metas financieras: ' + metas.join(', ') + '.');
        if (vocab.length) lineas.push('- Vocabulario semanal en práctica: ' + vocab.join(', ') + '.');
        lineas.push('Usa este contexto solo cuando sea relevante para responder mejor y de forma personalizada.');
        return lineas.join('\n');
    } catch (e) {
        return '';
    }
}

function construirSystemInstructionIA(conv) {
    asegurarEstadoIA();
    var partes = [
        'Eres el asistente de IA integrado dentro de Sistema Monarca (Emily). Responde siempre en español claro, directo, útil y bien estructurado usando Markdown cuando ayude a la lectura.'
    ];
    var custom = String(APP_STATE.iaConfig.instruccionesSistema || '').trim();
    if (custom) {
        partes.push('Instrucciones personalizadas del usuario:\n' + custom);
    }
    if (conv && conv.usarContextoMonarca) {
        var ctx = construirContextoMonarcaParaIA();
        if (ctx) partes.push(ctx);
    }
    return partes.join('\n\n');
}

function construirStepsHistorialParaGemini(mensajes, imagenActual) {
    var rec = Array.isArray(mensajes) ? mensajes.slice(-MONARCA_IA_MAX_HISTORY_TURNS) : [];
    var steps = [];
    for (var i = 0; i < rec.length; i++) {
        var m = rec[i];
        if (!m) continue;
        var esUltimo = (i === rec.length - 1);
        if (m.rol === 'user') {
            var contentParts = [];
            if (m.texto) {
                contentParts.push({ type: 'text', text: String(m.texto) });
            }
            if (esUltimo && imagenActual && imagenActual.dataBase64) {
                contentParts.push({
                    type: 'image',
                    data: imagenActual.dataBase64,
                    mime_type: imagenActual.mimeType || 'image/jpeg'
                });
            }
            if (contentParts.length === 0) {
                contentParts.push({ type: 'text', text: 'Analiza la imagen adjunta.' });
            }
            steps.push({ type: 'user_input', content: contentParts });
        } else if (m.rol === 'model' && m.texto) {
            steps.push({
                type: 'model_output',
                content: [{ type: 'text', text: String(m.texto) }]
            });
        }
    }
    return steps;
}

function extraerTextoDeInteractionJson(data) {
    if (!data || typeof data !== 'object') return '';
    if (typeof data.output_text === 'string' && data.output_text) return data.output_text;
    var root = data.interaction && typeof data.interaction === 'object' ? data.interaction : data;
    if (typeof root.output_text === 'string' && root.output_text) return root.output_text;

    var chunks = [];
    var steps = Array.isArray(root.steps) ? root.steps : [];
    for (var i = 0; i < steps.length; i++) {
        var st = steps[i];
        if (!st || st.type !== 'model_output' || !Array.isArray(st.content)) continue;
        for (var j = 0; j < st.content.length; j++) {
            var part = st.content[j];
            if (part && part.type === 'text' && typeof part.text === 'string') {
                chunks.push(part.text);
            }
        }
    }
    if (chunks.length > 0) return chunks.join('');

    // Respaldo defensivo si la respuesta incluyera arreglo outputs
    var outputs = Array.isArray(root.outputs) ? root.outputs : [];
    for (var k = 0; k < outputs.length; k++) {
        var outItem = outputs[k];
        if (outItem && outItem.type === 'text' && typeof outItem.text === 'string') {
            chunks.push(outItem.text);
        }
    }
    return chunks.join('');
}

function formatearErrorGeminiIA(status, bodyText, modelo) {
    var msgRaw = '';
    try {
        var parsed = JSON.parse(bodyText || '{}');
        var obj = Array.isArray(parsed) ? (parsed[0] || {}) : (parsed || {});
        if (obj && obj.error && obj.error.message) {
            msgRaw = String(obj.error.message);
        } else if (obj && obj.message) {
            msgRaw = String(obj.message);
        }
    } catch (e) {
        msgRaw = String(bodyText || '').slice(0, 220);
    }
    var low = msgRaw.toLowerCase();

    if (status === 401 || (status === 400 && low.indexOf('api key') !== -1) || low.indexOf('api_key_invalid') !== -1) {
        return '🔑 Tu API Key de Gemini no es válida o fue revocada. Abre ⚙️ Configurar API y pega una llave válida de Google AI Studio (AQ... o AIza...).';
    }
    if (status === 403) {
        if (modelo === 'gemini-4-argon' || low.indexOf('free tier') !== -1 || low.indexOf('billing') !== -1) {
            return '💳 El modelo "' + modelo + '" requiere facturación (Paid Tier) en Google AI Studio. Cambia a **Gemini 3.8 Flash** (Gratis) en ⚙️ Configurar API.';
        }
        return '🚫 Acceso denegado por Gemini API (403): ' + (msgRaw || 'verifica permisos y restricciones de tu API Key.');
    }
    if (status === 429 || low.indexOf('quota') !== -1 || low.indexOf('rate limit') !== -1) {
        return '⏳ Límite temporal de solicitudes alcanzado (429). Espera unos segundos o cambia a **Gemini 3.5 Flash-Lite** en ⚙️ Configurar API.';
    }
    if (status === 404 || low.indexOf('not found') !== -1) {
        return '⚠️ Modelo "' + modelo + '" no disponible para esta cuenta. Prueba seleccionar **Gemini 3.8 Flash** en ⚙️ Configurar API.';
    }
    if (status === 400 && low.indexOf('google_search') !== -1) {
        return '🔎 La herramienta Búsqueda en Google requiere Paid Tier. Desactívala en ⚙️ Configurar API para usar el Free Tier gratuito.';
    }
    return '⚠️ Error de Gemini API (' + (status || 'red') + '): ' + (msgRaw || 'No se pudo completar la solicitud.');
}

async function llamarGeminiInteractionsStream(params, onDelta, abortSignal) {
    var apiKey = params.apiKey;
    var modelo = params.modelo || 'gemini-3.8-flash';
    var body = {
        model: modelo,
        input: params.steps,
        store: false,
        stream: true
    };
    if (params.systemInstruction) {
        body.system_instruction = params.systemInstruction;
    }
    if (params.googleSearch) {
        body.tools = [{ type: 'google_search' }];
    }

    var resp;
    try {
        resp = await fetch(MONARCA_IA_ENDPOINT + '?alt=sse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(body),
            signal: abortSignal
        });
    } catch (netErr) {
        if (netErr && netErr.name === 'AbortError') throw netErr;
        throw new Error('🌐 No se pudo conectar con los servidores de Google Gemini. Verifica tu conexión a internet o prueba de nuevo en unos segundos.');
    }

    if (!resp.ok) {
        var errTxt = '';
        try { errTxt = await resp.text(); } catch (e) {}
        throw new Error(formatearErrorGeminiIA(resp.status, errTxt, modelo));
    }

    var contentType = (resp.headers && resp.headers.get('content-type')) ? String(resp.headers.get('content-type')).toLowerCase() : '';
    // Fallback limpio si la respuesta no llegó en streaming SSE
    if (contentType.indexOf('application/json') !== -1 || !resp.body || typeof resp.body.getReader !== 'function') {
        var jsonData = await resp.json();
        var fullTxt = extraerTextoDeInteractionJson(jsonData);
        if (fullTxt && typeof onDelta === 'function') onDelta(fullTxt, fullTxt);
        return { texto: fullTxt, usage: (jsonData && jsonData.usage) || null };
    }

    var reader = resp.body.getReader();
    var decoder = new TextDecoder('utf-8');
    var buffer = '';
    var acumulado = '';
    var usage = null;
    var sseEventType = '';

    function procesarLineaSSE(linea) {
        var trimmed = linea.replace(/\r$/, '');
        if (!trimmed) {
            sseEventType = '';
            return;
        }
        if (trimmed.indexOf('event:') === 0) {
            sseEventType = trimmed.slice(6).trim();
            return;
        }
        if (trimmed.indexOf('data:') !== 0) return;
        var dataStr = trimmed.slice(5).trim();
        if (!dataStr || dataStr === '[DONE]') return;
        var payload = null;
        try {
            payload = JSON.parse(dataStr);
        } catch (e) {
            return;
        }
        var evType = (payload && payload.event_type) || sseEventType;
        if ((evType === 'step.delta' || evType === 'content.delta') && payload.delta && payload.delta.type === 'text' && typeof payload.delta.text === 'string') {
            acumulado += payload.delta.text;
            if (typeof onDelta === 'function') onDelta(payload.delta.text, acumulado);
        } else if (evType === 'interaction.completed' || evType === 'interaction.complete') {
            if (payload.interaction && payload.interaction.usage) {
                usage = payload.interaction.usage;
            }
            if (!acumulado && payload.interaction) {
                var fallbackTxt = extraerTextoDeInteractionJson(payload.interaction);
                if (fallbackTxt) {
                    acumulado = fallbackTxt;
                    if (typeof onDelta === 'function') onDelta(fallbackTxt, acumulado);
                }
            }
        } else if (evType === 'error' || (payload && payload.error)) {
            var eMsg = (payload.error && payload.error.message) ? payload.error.message : 'Error durante el streaming de Gemini.';
            throw new Error(eMsg);
        }
    }

    while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        var partes = buffer.split('\n');
        buffer = partes.pop();
        for (var i = 0; i < partes.length; i++) {
            procesarLineaSSE(partes[i]);
        }
    }
    if (buffer.trim()) {
        procesarLineaSSE(buffer);
    }

    return { texto: acumulado, usage: usage };
}

// ==========================================================================
// 5. ENVÍO DE MENSAJES, REGENERAR, DETENER Y ACCIONES POR MENSAJE
// ==========================================================================

async function enviarMensajeIA(textoDirecto) {
    asegurarEstadoIA();
    if (IA_RUNTIME.generando) return;

    var apiKey = obtenerApiKeyGeminiIA();
    var inputEl = document.getElementById('ia-composer-input');
    var texto = (typeof textoDirecto === 'string') ? textoDirecto.trim() : (inputEl ? String(inputEl.value || '').trim() : '');
    var imgPend = IA_RUNTIME.imagenPendiente;

    if (!texto && !imgPend) return;

    if (!apiKey) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Primero conecta tu API Key gratuita de Gemini', '🔑');
        }
        abrirModalConfigIA();
        return;
    }

    var conv = obtenerConversacionActivaIA();
    if (!conv) {
        conv = crearNuevaConversacionIA({ sinGuardar: true, sinFocus: true });
    }
    if (!Array.isArray(conv.mensajes)) conv.mensajes = [];

    var ahora = Date.now();
    var esPrimerMensaje = conv.mensajes.length === 0;
    var msgUser = {
        id: 'IAM-U-' + ahora + '-' + Math.random().toString(36).slice(2, 5),
        rol: 'user',
        texto: texto || 'Analiza esta imagen por favor.',
        imagenThumb: imgPend ? imgPend.thumbDataUrl : null,
        imagenNombre: imgPend ? imgPend.nombre : null,
        ts: ahora
    };
    conv.mensajes.push(msgUser);

    if (esPrimerMensaje || !conv.titulo || conv.titulo === 'Nueva conversación') {
        conv.titulo = _generarTituloAutomaticoIA(msgUser.texto);
    }
    conv.modelo = APP_STATE.iaConfig.modelo || conv.modelo || 'gemini-3.8-flash';
    conv.fechaActualizacion = ahora;

    if (inputEl && typeof textoDirecto !== 'string') {
        inputEl.value = '';
        autoAjustarAlturaComposerIA();
    }
    quitarImagenAdjuntaIA();

    // Crear mensaje placeholder de respuesta en streaming
    var msgBot = {
        id: 'IAM-M-' + (ahora + 1) + '-' + Math.random().toString(36).slice(2, 5),
        rol: 'model',
        texto: '',
        modelo: conv.modelo,
        ts: ahora + 1,
        streaming: true
    };
    conv.mensajes.push(msgBot);

    IA_RUNTIME.generando = true;
    IA_RUNTIME.abortController = (typeof AbortController !== 'undefined') ? new AbortController() : null;

    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    renderizarVistaIA();
    _scrollChatAlFinalIA(true);

    try {
        var steps = construirStepsHistorialParaGemini(conv.mensajes.slice(0, -1), imgPend);
        var sysInst = construirSystemInstructionIA(conv);
        var res = await llamarGeminiInteractionsStream(
            {
                apiKey: apiKey,
                modelo: conv.modelo,
                steps: steps,
                systemInstruction: sysInst,
                googleSearch: !!APP_STATE.iaConfig.googleSearch
            },
            function(_delta, acumulado) {
                msgBot.texto = acumulado;
                _actualizarBurbujaStreamingIA(msgBot.id, acumulado);
            },
            IA_RUNTIME.abortController ? IA_RUNTIME.abortController.signal : undefined
        );

        msgBot.texto = (res && res.texto) ? res.texto : (msgBot.texto || '(Sin respuesta de texto del modelo)');
        if (res && res.usage && res.usage.total_tokens) {
            msgBot.tokens = res.usage.total_tokens;
        }
        delete msgBot.streaming;
        delete msgBot.error;
        conv.fechaActualizacion = Date.now();
    } catch (err) {
        delete msgBot.streaming;
        if (err && err.name === 'AbortError') {
            if (!msgBot.texto) {
                msgBot.texto = '_Generación detenida._';
            } else {
                msgBot.texto += '\n\n_⏹ Generación detenida._';
            }
        } else {
            msgBot.error = true;
            msgBot.texto = (err && err.message) ? err.message : '⚠️ No se pudo conectar con Gemini. Verifica tu conexión a internet y tu API Key.';
        }
        conv.fechaActualizacion = Date.now();
    } finally {
        IA_RUNTIME.generando = false;
        IA_RUNTIME.abortController = null;
        if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
        renderizarVistaIA();
        _scrollChatAlFinalIA(false);
    }
}

function detenerGeneracionIA() {
    if (IA_RUNTIME.abortController) {
        try { IA_RUNTIME.abortController.abort(); } catch (e) {}
    }
}

function regenerarUltimaRespuestaIA() {
    if (IA_RUNTIME.generando) return;
    var conv = obtenerConversacionActivaIA();
    if (!conv || !Array.isArray(conv.mensajes) || conv.mensajes.length === 0) return;

    // Quitar último mensaje del modelo si existe y reenviar el último mensaje del usuario
    if (conv.mensajes[conv.mensajes.length - 1].rol === 'model') {
        conv.mensajes.pop();
    }
    var ultimoUser = conv.mensajes.length > 0 ? conv.mensajes.pop() : null;
    if (!ultimoUser || ultimoUser.rol !== 'user') return;
    enviarMensajeIA(ultimoUser.texto);
}

function usarPromptSugeridoIA(idx) {
    var item = MONARCA_IA_PROMPTS_RAPIDOS[idx];
    if (!item) return;
    var inputEl = document.getElementById('ia-composer-input');
    if (!inputEl) return;
    inputEl.value = item.texto + (item.texto.slice(-1) === ':' ? ' ' : '');
    autoAjustarAlturaComposerIA();
    inputEl.focus();
}

function copiarMensajeIA(msgId) {
    var conv = obtenerConversacionActivaIA();
    if (!conv || !Array.isArray(conv.mensajes)) return;
    var msg = conv.mensajes.find(function(m) { return m && String(m.id) === String(msgId); });
    if (!msg || !msg.texto) return;
    _copiarTextoPortapapelesIA(msg.texto).then(function() {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Respuesta copiada al portapapeles', '📋');
        }
    });
}

function leerRespuestaIA(msgId) {
    if (!('speechSynthesis' in window)) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Tu navegador no soporta lectura en voz alta', '🔇');
        }
        return;
    }
    if (IA_RUNTIME.hablandoMsgId === String(msgId)) {
        window.speechSynthesis.cancel();
        IA_RUNTIME.hablandoMsgId = null;
        renderizarMensajesChatIA();
        return;
    }
    var conv = obtenerConversacionActivaIA();
    if (!conv || !Array.isArray(conv.mensajes)) return;
    var msg = conv.mensajes.find(function(m) { return m && String(m.id) === String(msgId); });
    if (!msg || !msg.texto) return;

    window.speechSynthesis.cancel();
    var limpio = String(msg.texto)
        .replace(/```[\s\S]*?```/g, ' bloque de código ')
        .replace(/[#*_`>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2500);
    var utt = new SpeechSynthesisUtterance(limpio);
    utt.lang = 'es-ES';
    utt.rate = 1.05;
    utt.onend = utt.onerror = function() {
        IA_RUNTIME.hablandoMsgId = null;
        renderizarMensajesChatIA();
    };
    IA_RUNTIME.hablandoMsgId = String(msgId);
    renderizarMensajesChatIA();
    window.speechSynthesis.speak(utt);
}

function guardarRespuestaEnConocimientoIA(msgId) {
    var conv = obtenerConversacionActivaIA();
    if (!conv || !Array.isArray(conv.mensajes)) return;
    var msg = conv.mensajes.find(function(m) { return m && String(m.id) === String(msgId); });
    if (!msg || !msg.texto) return;

    if (!Array.isArray(APP_STATE.conocimientos)) APP_STATE.conocimientos = [];
    var ahora = Date.now();
    APP_STATE.conocimientos.unshift({
        id: 'CON-IA-' + ahora + '-' + Math.random().toString(36).slice(2, 5),
        titulo: 'IA · ' + (conv.titulo || 'Consulta Gemini'),
        categoria: 'Inteligencia Artificial',
        contenido: msg.texto,
        fecha: new Date(ahora).toLocaleDateString('es-ES'),
        fechaActualizacion: ahora
    });
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Guardado en tu biblioteca de Conocimiento', '📚');
    }
}

// ==========================================================================
// 6. IMÁGENES MULTIMODALES Y DICTADO POR VOZ
// ==========================================================================

function _comprimirImagenArchivoIA(file, maxLado, calidad) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(ev) {
            var img = new Image();
            img.onload = function() {
                try {
                    var w = img.width;
                    var h = img.height;
                    var scale = Math.min(1, maxLado / Math.max(w, h));
                    var cw = Math.max(1, Math.round(w * scale));
                    var ch = Math.max(1, Math.round(h * scale));
                    var canvas = document.createElement('canvas');
                    canvas.width = cw;
                    canvas.height = ch;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, cw, ch);
                    var dataUrl = canvas.toDataURL('image/jpeg', calidad);

                    // Miniatura compacta para historial sin saturar localStorage/Firestore
                    var tScale = Math.min(1, 220 / Math.max(w, h));
                    var tc = document.createElement('canvas');
                    tc.width = Math.max(1, Math.round(w * tScale));
                    tc.height = Math.max(1, Math.round(h * tScale));
                    tc.getContext('2d').drawImage(img, 0, 0, tc.width, tc.height);
                    var thumbUrl = tc.toDataURL('image/jpeg', 0.65);

                    resolve({
                        dataBase64: dataUrl.split(',')[1] || '',
                        mimeType: 'image/jpeg',
                        dataUrlFull: dataUrl,
                        thumbDataUrl: thumbUrl,
                        nombre: file.name || 'Imagen adjunta'
                    });
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = function() { reject(new Error('No se pudo leer la imagen.')); };
            img.src = ev.target.result;
        };
        reader.onerror = function() { reject(new Error('Error leyendo el archivo.')); };
        reader.readAsDataURL(file);
    });
}

function manejarSeleccionImagenIA(inputEl) {
    var file = inputEl && inputEl.files && inputEl.files[0];
    if (!file) return;
    if (file.type && file.type.indexOf('image/') !== 0) {
        if (typeof mostrarToastMonarca === 'function') mostrarToastMonarca('Selecciona un archivo de imagen válido', '⚠️');
        return;
    }
    _comprimirImagenArchivoIA(file, 1024, 0.82).then(function(imgObj) {
        IA_RUNTIME.imagenPendiente = imgObj;
        renderizarPreviewImagenAdjuntaIA();
        if (inputEl) inputEl.value = '';
    }).catch(function(err) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca((err && err.message) || 'No se pudo adjuntar la imagen', '⚠️');
        }
    });
}

function quitarImagenAdjuntaIA() {
    IA_RUNTIME.imagenPendiente = null;
    renderizarPreviewImagenAdjuntaIA();
}

function renderizarPreviewImagenAdjuntaIA() {
    var box = document.getElementById('ia-attachment-preview');
    if (!box) return;
    var img = IA_RUNTIME.imagenPendiente;
    if (!img) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }
    box.style.display = 'flex';
    box.innerHTML =
        '<img src="' + img.thumbDataUrl + '" alt="Adjunto" class="ia-attach-thumb">' +
        '<div class="ia-attach-meta">' +
            '<span class="ia-attach-name">' + escaparHtmlIA(img.nombre) + '</span>' +
            '<span class="ia-attach-sub">Lista para analizar con Gemini</span>' +
        '</div>' +
        '<button type="button" class="ia-attach-remove" onclick="quitarImagenAdjuntaIA()" title="Quitar imagen">&times;</button>';
}

function toggleDictadoVozIA() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Dictado por voz no disponible en este navegador', '🎤');
        }
        return;
    }
    if (IA_RUNTIME.dictando && IA_RUNTIME.recognizer) {
        try { IA_RUNTIME.recognizer.stop(); } catch (e) {}
        IA_RUNTIME.dictando = false;
        _actualizarBtnMicIA();
        return;
    }
    try {
        var rec = new SR();
        rec.lang = 'es-ES';
        rec.interimResults = false;
        rec.continuous = false;
        rec.onresult = function(ev) {
            var txt = '';
            for (var i = ev.resultIndex; i < ev.results.length; i++) {
                txt += ev.results[i][0].transcript;
            }
            var inputEl = document.getElementById('ia-composer-input');
            if (inputEl && txt.trim()) {
                inputEl.value = (inputEl.value ? (inputEl.value.trim() + ' ') : '') + txt.trim();
                autoAjustarAlturaComposerIA();
                inputEl.focus();
            }
        };
        rec.onend = rec.onerror = function() {
            IA_RUNTIME.dictando = false;
            _actualizarBtnMicIA();
        };
        IA_RUNTIME.recognizer = rec;
        IA_RUNTIME.dictando = true;
        _actualizarBtnMicIA();
        rec.start();
    } catch (e) {
        IA_RUNTIME.dictando = false;
        _actualizarBtnMicIA();
    }
}

function _actualizarBtnMicIA() {
    var btn = document.getElementById('ia-btn-mic');
    if (!btn) return;
    btn.classList.toggle('is-listening', !!IA_RUNTIME.dictando);
    btn.title = IA_RUNTIME.dictando ? 'Escuchando… toca para detener' : 'Dictar por voz';
}

// ==========================================================================
// 7. MODAL DE CONFIGURACIÓN & PRUEBA DE CONEXIÓN GEMINI
// ==========================================================================

function abrirModalConfigIA() {
    asegurarEstadoIA();
    var modal = document.getElementById('modal-config-ia');
    if (!modal) return;

    var inKey = document.getElementById('ia-config-api-key');
    var selMod = document.getElementById('ia-config-modelo');
    var inInst = document.getElementById('ia-config-instrucciones');
    var chkCtx = document.getElementById('ia-config-contexto-default');
    var chkSearch = document.getElementById('ia-config-google-search');
    var chkSyncKey = document.getElementById('ia-config-sync-key');
    var elTestStatus = document.getElementById('ia-config-test-status');

    if (inKey) {
        inKey.type = 'password';
        inKey.value = obtenerApiKeyGeminiIA();
    }
    if (selMod) {
        selMod.innerHTML = MONARCA_IA_MODELOS.map(function(m) {
            return '<option value="' + m.id + '">' + escaparHtmlIA(m.nombre + ' — ' + m.etiqueta) + '</option>';
        }).join('');
        selMod.value = APP_STATE.iaConfig.modelo || 'gemini-3.8-flash';
    }
    if (inInst) inInst.value = APP_STATE.iaConfig.instruccionesSistema || '';
    if (chkCtx) chkCtx.checked = !!APP_STATE.iaConfig.contextoMonarcaDefault;
    if (chkSearch) chkSearch.checked = !!APP_STATE.iaConfig.googleSearch;
    if (chkSyncKey) chkSyncKey.checked = !!APP_STATE.iaConfig.sincronizarApiKeyNube;
    if (elTestStatus) {
        elTestStatus.style.display = 'none';
        elTestStatus.textContent = '';
        elTestStatus.className = 'ia-config-test-status';
    }

    modal.style.display = 'flex';
}

function cerrarModalConfigIA() {
    var modal = document.getElementById('modal-config-ia');
    if (modal) modal.style.display = 'none';
}

function toggleVisibilidadApiKeyIA() {
    var inKey = document.getElementById('ia-config-api-key');
    var btn = document.getElementById('ia-btn-toggle-key');
    if (!inKey) return;
    var mostrar = inKey.type === 'password';
    inKey.type = mostrar ? 'text' : 'password';
    if (btn) btn.textContent = mostrar ? '🙈' : '👁️';
}

function guardarConfigIA() {
    asegurarEstadoIA();
    var inKey = document.getElementById('ia-config-api-key');
    var selMod = document.getElementById('ia-config-modelo');
    var inInst = document.getElementById('ia-config-instrucciones');
    var chkCtx = document.getElementById('ia-config-contexto-default');
    var chkSearch = document.getElementById('ia-config-google-search');
    var chkSyncKey = document.getElementById('ia-config-sync-key');

    var key = inKey ? String(inKey.value || '').trim() : '';
    var syncCloud = !!(chkSyncKey && chkSyncKey.checked);
    guardarApiKeyGeminiIA(key, syncCloud);

    APP_STATE.iaConfig.modelo = (selMod && selMod.value) ? selMod.value : 'gemini-3.8-flash';
    APP_STATE.iaConfig.instruccionesSistema = inInst ? String(inInst.value || '').trim() : '';
    APP_STATE.iaConfig.contextoMonarcaDefault = !!(chkCtx && chkCtx.checked);
    APP_STATE.iaConfig.googleSearch = !!(chkSearch && chkSearch.checked);
    APP_STATE.iaConfig.fechaActualizacion = Date.now();

    var conv = obtenerConversacionActivaIA();
    if (conv) {
        conv.modelo = APP_STATE.iaConfig.modelo;
    }

    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    cerrarModalConfigIA();
    renderizarVistaIA();

    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca(
            key ? ('Conexión Gemini guardada (' + obtenerInfoModeloIA(APP_STATE.iaConfig.modelo).nombre + ')') : 'Configuración guardada (sin API Key)',
            key ? '✅' : '⚙️'
        );
    }
}

async function probarConexionGeminiIA() {
    var inKey = document.getElementById('ia-config-api-key');
    var selMod = document.getElementById('ia-config-modelo');
    var elStatus = document.getElementById('ia-config-test-status');
    var btnTest = document.getElementById('ia-btn-probar-conexion');

    var key = inKey ? String(inKey.value || '').trim() : obtenerApiKeyGeminiIA();
    var modelo = (selMod && selMod.value) ? selMod.value : (APP_STATE.iaConfig.modelo || 'gemini-3.8-flash');

    if (!elStatus) return;
    if (!key) {
        elStatus.style.display = 'block';
        elStatus.className = 'ia-config-test-status is-error';
        elStatus.textContent = '🔑 Pega primero tu API Key de Google AI Studio para probarla.';
        return;
    }

    elStatus.style.display = 'block';
    elStatus.className = 'ia-config-test-status is-loading';
    elStatus.textContent = '⏳ Probando conexión con ' + modelo + '...';
    if (btnTest) btnTest.disabled = true;

    try {
        var resp;
        try {
            resp = await fetch(MONARCA_IA_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': key
                },
                body: JSON.stringify({
                    model: modelo,
                    input: 'Responde únicamente con: OK',
                    store: false
                })
            });
        } catch (netErr) {
            throw new Error('🌐 No se pudo conectar con Google Gemini. Verifica tu conexión a internet o prueba de nuevo.');
        }

        if (!resp.ok) {
            var errBody = '';
            try { errBody = await resp.text(); } catch (e) {}
            throw new Error(formatearErrorGeminiIA(resp.status, errBody, modelo));
        }

        var json = await resp.json();
        var txt = extraerTextoDeInteractionJson(json).trim() || 'OK';
        elStatus.className = 'ia-config-test-status is-ok';
        elStatus.textContent = '✅ ¡Conexión exitosa con ' + obtenerInfoModeloIA(modelo).nombre + '! Respuesta: "' + txt.slice(0, 40) + '"';
    } catch (err) {
        elStatus.className = 'ia-config-test-status is-error';
        elStatus.textContent = (err && err.message) ? err.message : '⚠️ Error de conexión con Gemini API.';
    } finally {
        if (btnTest) btnTest.disabled = false;
    }
}

// ==========================================================================
// 8. RENDERIZADO DE UI (#vista-ia)
// ==========================================================================

function cargarVistaIA() {
    asegurarEstadoIA();
    if (!IA_RUNTIME.convActivaId) {
        var savedId = '';
        try { savedId = localStorage.getItem(MONARCA_IA_ACTIVE_CONV_STORAGE) || ''; } catch (e) {}
        if (savedId && APP_STATE.iaConversaciones.some(function(c) { return c && String(c.id) === String(savedId); })) {
            IA_RUNTIME.convActivaId = savedId;
        } else if (APP_STATE.iaConversaciones.length > 0) {
            IA_RUNTIME.convActivaId = APP_STATE.iaConversaciones[0].id;
        }
    } else if (!obtenerConversacionActivaIA()) {
        IA_RUNTIME.convActivaId = APP_STATE.iaConversaciones.length > 0 ? APP_STATE.iaConversaciones[0].id : null;
    }
    _vincularEventosComposerIA();
    renderizarVistaIA();
    _scrollChatAlFinalIA(true);
}

function renderizarVistaIA() {
    asegurarEstadoIA();
    renderizarListaConversacionesIA();
    renderizarCabeceraChatIA();
    renderizarMensajesChatIA();
    renderizarControlesComposerIA();
}

function renderizarListaConversacionesIA() {
    var cont = document.getElementById('ia-conv-list');
    var badgeCount = document.getElementById('ia-conv-count-badge');
    if (!cont) return;

    var lista = (APP_STATE.iaConversaciones || []).filter(function(c) { return c && c.id; });
    if (badgeCount) badgeCount.textContent = String(lista.length);

    if (IA_RUNTIME.busqueda) {
        var q = IA_RUNTIME.busqueda;
        lista = lista.filter(function(c) {
            if (String(c.titulo || '').toLowerCase().indexOf(q) !== -1) return true;
            if (Array.isArray(c.mensajes)) {
                return c.mensajes.some(function(m) {
                    return m && String(m.texto || '').toLowerCase().indexOf(q) !== -1;
                });
            }
            return false;
        });
    }

    lista.sort(function(a, b) {
        if (!!b.fijada !== !!a.fijada) return b.fijada ? 1 : -1;
        return (Number(b.fechaActualizacion) || Number(b.creadaEn) || 0) - (Number(a.fechaActualizacion) || Number(a.creadaEn) || 0);
    });

    if (lista.length === 0) {
        cont.innerHTML =
            '<div class="ia-conv-empty">' +
                '<div class="ia-conv-empty-ico">💬</div>' +
                '<div>' + (IA_RUNTIME.busqueda ? 'No hay conversaciones que coincidan.' : 'Aún no tienes conversaciones.<br>Crea tu primer chat para empezar.') + '</div>' +
            '</div>';
        return;
    }

    cont.innerHTML = lista.map(function(c) {
        var activa = String(c.id) === String(IA_RUNTIME.convActivaId);
        var msgs = Array.isArray(c.mensajes) ? c.mensajes : [];
        var ultimo = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        var preview = ultimo ? String(ultimo.texto || '').replace(/[#*`>\n]+/g, ' ').trim().slice(0, 58) : 'Sin mensajes aún';
        var fechaTxt = formatearFechaRelativaIA(c.fechaActualizacion || c.creadaEn);
        var cidEsc = escaparHtmlIA(c.id);

        return (
            '<div class="ia-conv-item' + (activa ? ' active' : '') + (c.fijada ? ' is-pinned' : '') + '" onclick="seleccionarConversacionIA(\'' + cidEsc + '\')">' +
                '<div class="ia-conv-item-top">' +
                    '<span class="ia-conv-item-title">' + (c.fijada ? '📌 ' : '') + escaparHtmlIA(c.titulo || 'Nueva conversación') + '</span>' +
                    '<span class="ia-conv-item-time">' + escaparHtmlIA(fechaTxt) + '</span>' +
                '</div>' +
                '<div class="ia-conv-item-preview">' + escaparHtmlIA(preview) + '</div>' +
                '<div class="ia-conv-item-foot">' +
                    '<span class="ia-conv-item-meta">' + msgs.length + (msgs.length === 1 ? ' msg' : ' msgs') + (c.usarContextoMonarca ? ' · 👑' : '') + '</span>' +
                    '<div class="ia-conv-item-actions">' +
                        '<button type="button" class="ia-conv-act-btn" onclick="toggleFijarConversacionIA(\'' + cidEsc + '\', event)" title="' + (c.fijada ? 'Desfijar' : 'Fijar arriba') + '">' + (c.fijada ? '★' : '☆') + '</button>' +
                        '<button type="button" class="ia-conv-act-btn" onclick="renombrarConversacionIA(\'' + cidEsc + '\', event)" title="Renombrar">✏️</button>' +
                        '<button type="button" class="ia-conv-act-btn is-del" onclick="eliminarConversacionIA(\'' + cidEsc + '\', event)" title="Eliminar">🗑️</button>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    }).join('');
}

function renderizarCabeceraChatIA() {
    var conv = obtenerConversacionActivaIA();
    var elTitulo = document.getElementById('ia-chat-active-title');
    var elModeloPill = document.getElementById('ia-chat-model-pill');
    var btnCtx = document.getElementById('ia-btn-contexto-monarca');
    var btnExport = document.getElementById('ia-btn-exportar-md');
    var elApiBanner = document.getElementById('ia-no-key-banner');

    var apiKey = obtenerApiKeyGeminiIA();
    var modInfo = obtenerInfoModeloIA((conv && conv.modelo) || APP_STATE.iaConfig.modelo);
    var ctxOn = conv ? !!conv.usarContextoMonarca : !!APP_STATE.iaConfig.contextoMonarcaDefault;
    var tieneMsgs = !!(conv && Array.isArray(conv.mensajes) && conv.mensajes.length > 0);

    if (elTitulo) {
        elTitulo.textContent = conv ? (conv.titulo || 'Nueva conversación') : 'Asistente IA · Gemini';
    }
    if (elModeloPill) {
        elModeloPill.innerHTML =
            '<span class="ia-status-dot ' + (apiKey ? 'is-online' : 'is-offline') + '"></span>' +
            '<span>' + escaparHtmlIA(apiKey ? modInfo.nombre : 'Sin API Key') + '</span>' +
            '<span class="ia-model-caret" aria-hidden="true">▾</span>';
    }
    if (btnCtx) {
        btnCtx.classList.toggle('active', ctxOn);
        btnCtx.title = ctxOn
            ? 'Contexto Monarca ACTIVO (clic para apagar y usar chat libre)'
            : 'Activar Contexto Monarca (quests, rutinas, metas)';
    }
    if (btnExport) {
        btnExport.disabled = !tieneMsgs;
        btnExport.style.opacity = tieneMsgs ? '1' : '0.45';
    }
    if (elApiBanner) {
        elApiBanner.style.display = apiKey ? 'none' : 'flex';
    }
}

var _IA_MODEL_MENU_BOUND = false;

function cerrarMenuRapidoModeloIA() {
    var menu = document.getElementById('ia-model-quick-menu');
    var pill = document.getElementById('ia-chat-model-pill');
    if (menu) menu.style.display = 'none';
    if (pill) pill.setAttribute('aria-expanded', 'false');
}

function toggleMenuRapidoModeloIA(ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    asegurarEstadoIA();
    var menu = document.getElementById('ia-model-quick-menu');
    var pill = document.getElementById('ia-chat-model-pill');
    if (!menu) {
        abrirModalConfigIA();
        return;
    }

    var estaAbierto = menu.style.display === 'block';
    if (estaAbierto) {
        cerrarMenuRapidoModeloIA();
        return;
    }

    var conv = obtenerConversacionActivaIA();
    var modActivo = (conv && conv.modelo) || APP_STATE.iaConfig.modelo || 'gemini-3.8-flash';
    var apiKey = obtenerApiKeyGeminiIA();

    var itemsHtml = MONARCA_IA_MODELOS.map(function(m) {
        var activo = m.id === modActivo;
        return (
            '<button type="button" class="ia-model-menu-item' + (activo ? ' is-active' : '') + '" role="menuitemradio" aria-checked="' + (activo ? 'true' : 'false') + '" onclick="seleccionarModeloRapidoIA(\'' + escaparHtmlIA(m.id) + '\')">' +
                '<div class="ia-model-menu-top">' +
                    '<span class="ia-model-menu-name">' + (activo ? '✓ ' : '') + escaparHtmlIA(m.nombre) + '</span>' +
                    '<span class="ia-model-menu-tag' + (m.freeTier ? ' is-free' : ' is-paid') + '">' + (m.freeTier ? 'Gratis' : 'Paid') + '</span>' +
                '</div>' +
                '<div class="ia-model-menu-desc">' + escaparHtmlIA(m.descripcion) + '</div>' +
            '</button>'
        );
    }).join('');

    menu.innerHTML =
        '<div class="ia-model-menu-header">Seleccionar modelo Gemini</div>' +
        itemsHtml +
        '<div class="ia-model-menu-divider"></div>' +
        '<button type="button" class="ia-model-menu-config" onclick="cerrarMenuRapidoModeloIA(); abrirModalConfigIA();">' +
            '<span>' + (apiKey ? '⚙️ Configurar API Key y ajustes' : '🔑 Conectar tu API Key (AQ... / AIza...)') + '</span>' +
        '</button>';

    menu.style.display = 'block';
    if (pill) pill.setAttribute('aria-expanded', 'true');

    if (!_IA_MODEL_MENU_BOUND && typeof document !== 'undefined') {
        _IA_MODEL_MENU_BOUND = true;
        document.addEventListener('click', function(e) {
            var wrap = e.target && e.target.closest ? e.target.closest('.ia-model-picker-wrap') : null;
            if (!wrap) cerrarMenuRapidoModeloIA();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') cerrarMenuRapidoModeloIA();
        });
    }
}

function seleccionarModeloRapidoIA(modeloId) {
    asegurarEstadoIA();
    var info = obtenerInfoModeloIA(modeloId);
    APP_STATE.iaConfig.modelo = info.id;
    APP_STATE.iaConfig.fechaActualizacion = Date.now();
    var conv = obtenerConversacionActivaIA();
    if (conv) {
        conv.modelo = info.id;
        conv.fechaActualizacion = Date.now();
    }
    cerrarMenuRapidoModeloIA();
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    renderizarVistaIA();
    if (typeof window.renderizarPulsoDiarioHome === 'function') window.renderizarPulsoDiarioHome();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Modelo activo: ' + info.nombre, '✦');
    }
}

function exportarConversacionActualIA() {
    asegurarEstadoIA();
    var conv = obtenerConversacionActivaIA();
    if (!conv || !Array.isArray(conv.mensajes) || conv.mensajes.length === 0) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Esta conversación aún no tiene mensajes para exportar', '💬');
        }
        return;
    }

    var titulo = conv.titulo || 'Conversación IA';
    var modInfo = obtenerInfoModeloIA(conv.modelo || APP_STATE.iaConfig.modelo);
    var fechaStr = new Date().toLocaleString('es-ES');
    var lineas = [
        '# ' + titulo,
        '',
        '> Exportado desde **Emily · Sistema Monarca**  ',
        '> Modelo: **' + modInfo.nombre + '** · Fecha: ' + fechaStr,
        '',
        '---',
        ''
    ];

    for (var i = 0; i < conv.mensajes.length; i++) {
        var m = conv.mensajes[i];
        if (!m) continue;
        var hora = formatearHoraMensajeIA(m.ts);
        if (m.rol === 'user') {
            lineas.push('## 👤 Tú' + (hora ? (' (' + hora + ')') : ''));
        } else {
            var mNom = obtenerInfoModeloIA(m.modelo || modInfo.id).nombre;
            lineas.push('## ✦ ' + mNom + (hora ? (' (' + hora + ')') : ''));
        }
        lineas.push('');
        lineas.push(String(m.texto || '').trim());
        lineas.push('');
    }

    var contenidoMd = lineas.join('\n');
    var slug = String(titulo)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'conversacion';
    var filename = 'emily-ia-' + slug + '.md';

    var descargado = false;
    try {
        var blob = new Blob([contenidoMd], { type: 'text/markdown;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            try { document.body.removeChild(a); } catch (e1) {}
            try { URL.revokeObjectURL(url); } catch (e2) {}
        }, 400);
        descargado = true;
    } catch (eDl) {}

    if (descargado) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Conversación exportada (' + filename + ')', '⬇️');
        }
    } else {
        _copiarTextoPortapapelesIA(contenidoMd).then(function() {
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca('Conversación copiada en formato Markdown', '📋');
            }
        });
    }
}

function renderizarMensajesChatIA() {
    var feed = document.getElementById('ia-messages-feed');
    if (!feed) return;

    var conv = obtenerConversacionActivaIA();
    var msgs = (conv && Array.isArray(conv.mensajes)) ? conv.mensajes : [];
    var apiKey = obtenerApiKeyGeminiIA();

    if (msgs.length === 0) {
        var modInfo = obtenerInfoModeloIA(APP_STATE.iaConfig.modelo);
        var promptsHtml = MONARCA_IA_PROMPTS_RAPIDOS.map(function(p, idx) {
            return (
                '<button type="button" class="ia-prompt-card" onclick="usarPromptSugeridoIA(' + idx + ')">' +
                    '<span class="ia-prompt-ico">' + p.icono + '</span>' +
                    '<span class="ia-prompt-title">' + escaparHtmlIA(p.titulo) + '</span>' +
                    '<span class="ia-prompt-sub">' + escaparHtmlIA(p.texto) + '</span>' +
                '</button>'
            );
        }).join('');

        feed.innerHTML =
            '<div class="ia-welcome-screen">' +
                '<div class="ia-welcome-orb">✦</div>' +
                '<h3 class="ia-welcome-title">¿En qué te ayudo hoy?</h3>' +
                '<p class="ia-welcome-sub">' +
                    (apiKey
                        ? ('Conectado con <strong>' + escaparHtmlIA(modInfo.nombre) + '</strong>. Haz cualquier pregunta, adjunta una imagen o activa <strong>👑 Contexto Monarca</strong>.')
                        : 'Conecta tu llave gratuita de <strong>Google AI Studio (Gemini)</strong> en 30 segundos para empezar a conversar.') +
                '</p>' +
                (!apiKey
                    ? '<button type="button" class="ia-btn-connect-hero" onclick="abrirModalConfigIA()">🔑 Conectar API Key de Gemini</button>'
                    : '') +
                '<div class="ia-prompts-grid">' + promptsHtml + '</div>' +
            '</div>';
        return;
    }

    feed.innerHTML = msgs.map(function(m, idx) {
        var esUser = m.rol === 'user';
        var esUltimoBot = !esUser && (idx === msgs.length - 1);
        var midEsc = escaparHtmlIA(m.id);

        if (esUser) {
            return (
                '<div class="ia-msg-row is-user" data-msg-id="' + midEsc + '">' +
                    '<div class="ia-bubble is-user">' +
                        (m.imagenThumb ? '<img src="' + m.imagenThumb + '" alt="Imagen enviada" class="ia-msg-img">' : '') +
                        '<div class="ia-user-text">' + escaparHtmlIA(m.texto).replace(/\n/g, '<br>') + '</div>' +
                        '<div class="ia-msg-meta-row"><span>' + formatearHoraMensajeIA(m.ts) + '</span></div>' +
                    '</div>' +
                '</div>'
            );
        }

        var bodyHtml = m.streaming && !m.texto
            ? '<div class="ia-typing-dots"><span></span><span></span><span></span></div>'
            : renderizarMarkdownSeguroIA(m.texto) + (m.streaming ? '<span class="ia-stream-caret"></span>' : '');
        var hablando = IA_RUNTIME.hablandoMsgId === String(m.id);

        return (
            '<div class="ia-msg-row is-model" data-msg-id="' + midEsc + '">' +
                '<div class="ia-avatar-bot">✦</div>' +
                '<div class="ia-bubble is-model' + (m.error ? ' is-error' : '') + '">' +
                    '<div class="ia-bot-head">' +
                        '<span class="ia-bot-name">' + escaparHtmlIA(obtenerInfoModeloIA(m.modelo).nombre) + '</span>' +
                        '<span class="ia-bot-time">' + formatearHoraMensajeIA(m.ts) + (m.tokens ? (' · ' + m.tokens + ' tok') : '') + '</span>' +
                    '</div>' +
                    '<div class="ia-md-body" id="ia-msg-body-' + midEsc + '">' + bodyHtml + '</div>' +
                    (!m.streaming
                        ? ('<div class="ia-msg-actions">' +
                            '<button type="button" class="ia-msg-act-btn" onclick="copiarMensajeIA(\'' + midEsc + '\')" title="Copiar respuesta">📋 Copiar</button>' +
                            '<button type="button" class="ia-msg-act-btn' + (hablando ? ' active' : '') + '" onclick="leerRespuestaIA(\'' + midEsc + '\')" title="Leer en voz alta">' + (hablando ? '⏹ Parar' : '🔊 Leer') + '</button>' +
                            '<button type="button" class="ia-msg-act-btn" onclick="guardarRespuestaEnConocimientoIA(\'' + midEsc + '\')" title="Guardar en Conocimiento">📚 Guardar</button>' +
                            (esUltimoBot ? '<button type="button" class="ia-msg-act-btn" onclick="regenerarUltimaRespuestaIA()" title="Regenerar respuesta">🔄 Regenerar</button>' : '') +
                        '</div>')
                        : '') +
                '</div>' +
            '</div>'
        );
    }).join('');
}

function _actualizarBurbujaStreamingIA(msgId, textoAcumulado) {
    var el = document.getElementById('ia-msg-body-' + msgId);
    if (!el) return;
    el.innerHTML = renderizarMarkdownSeguroIA(textoAcumulado) + '<span class="ia-stream-caret"></span>';
    _scrollChatAlFinalIA(false);
}

function renderizarControlesComposerIA() {
    var btnSend = document.getElementById('ia-btn-send');
    var btnStop = document.getElementById('ia-btn-stop');
    var inputEl = document.getElementById('ia-composer-input');
    if (btnSend) btnSend.style.display = IA_RUNTIME.generando ? 'none' : 'inline-flex';
    if (btnStop) btnStop.style.display = IA_RUNTIME.generando ? 'inline-flex' : 'none';
    if (inputEl) inputEl.disabled = !!IA_RUNTIME.generando;
    _actualizarBtnMicIA();
    renderizarPreviewImagenAdjuntaIA();
}

function autoAjustarAlturaComposerIA() {
    var inputEl = document.getElementById('ia-composer-input');
    if (!inputEl) return;
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(135, Math.max(40, inputEl.scrollHeight)) + 'px';
}

function _scrollChatAlFinalIA(inmediato) {
    var feed = document.getElementById('ia-messages-feed');
    if (!feed) return;
    try {
        if (inmediato) {
            feed.scrollTop = feed.scrollHeight;
        } else {
            var cercaDelFinal = (feed.scrollHeight - feed.scrollTop - feed.clientHeight) < 160;
            if (cercaDelFinal) feed.scrollTop = feed.scrollHeight;
        }
    } catch (e) {}
}

function _enfocarComposerIA() {
    var inputEl = document.getElementById('ia-composer-input');
    if (inputEl && !inputEl.disabled) {
        try { inputEl.focus(); } catch (e) {}
    }
}

var _IA_COMPOSER_BOUND = false;
function _vincularEventosComposerIA() {
    if (_IA_COMPOSER_BOUND) return;
    var inputEl = document.getElementById('ia-composer-input');
    if (!inputEl) return;
    _IA_COMPOSER_BOUND = true;

    inputEl.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
            // En pantallas amplias Enter envía directo; Shift+Enter salta línea
            if (window.innerWidth >= 720) {
                ev.preventDefault();
                enviarMensajeIA();
            }
        }
    });

    inputEl.addEventListener('paste', function(ev) {
        var items = ev.clipboardData && ev.clipboardData.items;
        if (!items) return;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type && items[i].type.indexOf('image/') === 0) {
                var file = items[i].getAsFile();
                if (file) {
                    ev.preventDefault();
                    _comprimirImagenArchivoIA(file, 1024, 0.82).then(function(imgObj) {
                        IA_RUNTIME.imagenPendiente = imgObj;
                        renderizarPreviewImagenAdjuntaIA();
                    }).catch(function() {});
                }
                break;
            }
        }
    });
}

// Exponer funciones al ámbito global
if (typeof window !== 'undefined') {
    window.cargarVistaIA = cargarVistaIA;
    window.renderizarVistaIA = renderizarVistaIA;
    window.crearNuevaConversacionIA = crearNuevaConversacionIA;
    window.seleccionarConversacionIA = seleccionarConversacionIA;
    window.renombrarConversacionIA = renombrarConversacionIA;
    window.toggleFijarConversacionIA = toggleFijarConversacionIA;
    window.eliminarConversacionIA = eliminarConversacionIA;
    window.filtrarConversacionesIA = filtrarConversacionesIA;
    window.toggleDrawerConversacionesIA = toggleDrawerConversacionesIA;
    window.toggleContextoMonarcaChatIA = toggleContextoMonarcaChatIA;
    window.enviarMensajeIA = enviarMensajeIA;
    window.detenerGeneracionIA = detenerGeneracionIA;
    window.regenerarUltimaRespuestaIA = regenerarUltimaRespuestaIA;
    window.usarPromptSugeridoIA = usarPromptSugeridoIA;
    window.copiarMensajeIA = copiarMensajeIA;
    window.copiarBloqueCodigoIA = copiarBloqueCodigoIA;
    window.leerRespuestaIA = leerRespuestaIA;
    window.guardarRespuestaEnConocimientoIA = guardarRespuestaEnConocimientoIA;
    window.manejarSeleccionImagenIA = manejarSeleccionImagenIA;
    window.quitarImagenAdjuntaIA = quitarImagenAdjuntaIA;
    window.toggleDictadoVozIA = toggleDictadoVozIA;
    window.autoAjustarAlturaComposerIA = autoAjustarAlturaComposerIA;
    window.abrirModalConfigIA = abrirModalConfigIA;
    window.cerrarModalConfigIA = cerrarModalConfigIA;
    window.toggleVisibilidadApiKeyIA = toggleVisibilidadApiKeyIA;
    window.guardarConfigIA = guardarConfigIA;
    window.probarConexionGeminiIA = probarConexionGeminiIA;
    window.obtenerConversacionActivaIA = obtenerConversacionActivaIA;
    window.toggleMenuRapidoModeloIA = toggleMenuRapidoModeloIA;
    window.cerrarMenuRapidoModeloIA = cerrarMenuRapidoModeloIA;
    window.seleccionarModeloRapidoIA = seleccionarModeloRapidoIA;
    window.exportarConversacionActualIA = exportarConversacionActualIA;
    window.obtenerApiKeyGeminiIA = obtenerApiKeyGeminiIA;
    window.guardarApiKeyGeminiIA = guardarApiKeyGeminiIA;
    window.renderizarMarkdownSeguroIA = renderizarMarkdownSeguroIA;
    window.IA_RUNTIME = IA_RUNTIME;
}
