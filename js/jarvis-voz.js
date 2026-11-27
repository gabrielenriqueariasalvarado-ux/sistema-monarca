/**
 * SISTEMA MONARCA · MÓDULO JARVIS VOZ + INTELIGENCIA ARTIFICIAL (v11.30)
 * Reconocimiento de voz nativo Android (MonarcaVoice) / Web Speech API,
 * síntesis de voz (TTS), comandos rápidos del sistema y conexión directa en tiempo real
 * con tu App IA (Google Gemini Interactions API + historial compartido en Firestore).
 */

var _JARVIS_ACTIVO = false;
var _JARVIS_ESCUCHANDO = false;
var _JARVIS_VOZ_HABILITADA = localStorage.getItem('monarca_jarvis_tts') !== 'false';
var _JARVIS_MODO = localStorage.getItem('monarca_jarvis_modo') === 'ia' ? 'ia' : 'hibrido';
var _JARVIS_RECOGNIZER = null;
var _JARVIS_AUTO_RESTART = false;
var _JARVIS_NATIVE_BOUND = false;
var _JARVIS_ESPERANDO_VOZ_NATIVA = false;
var _JARVIS_IA_GENERANDO = false;
var _JARVIS_IA_ABORT_CTRL = null;
var _JARVIS_ULTIMA_RESP_IA = null; // { texto, convId, msgId, modeloNombre }

document.addEventListener('DOMContentLoaded', function() {
    inicializarJarvisVoz();
});

function inicializarJarvisVoz() {
    actualizarBotonAudioJarvisUI();
    actualizarModoJarvisUI();
    actualizarEstadoIaEnJarvisUI();
}

function _escaparHtmlJarvis(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _obtenerPluginMonarcaVoiceJarvis() {
    try {
        if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
            var p = window.Capacitor.Plugins && window.Capacitor.Plugins.MonarcaVoice;
            if (p && typeof p.startListening === 'function') return p;
        }
    } catch (e) {}
    return null;
}

/**
 * Alterna el estado del sintetizador de voz (TTS)
 */
function toggleSilencioJarvis() {
    _JARVIS_VOZ_HABILITADA = !_JARVIS_VOZ_HABILITADA;
    try { localStorage.setItem('monarca_jarvis_tts', _JARVIS_VOZ_HABILITADA ? 'true' : 'false'); } catch (e) {}
    actualizarBotonAudioJarvisUI();

    if (!_JARVIS_VOZ_HABILITADA && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        if (!_JARVIS_IA_GENERANDO && !_JARVIS_ESCUCHANDO) {
            setJarvisEstado('listo', 'Voz silenciada · respuestas solo en texto');
        }
    } else if (_JARVIS_VOZ_HABILITADA) {
        hablarTextoJarvis('Voz activada. Estoy conectado con tu IA y listo para responder.');
    }
}

function actualizarBotonAudioJarvisUI() {
    var btn = document.getElementById('jarvis-btn-toggle-audio');
    if (!btn) return;
    if (_JARVIS_VOZ_HABILITADA) {
        btn.innerHTML = '🔊';
        btn.title = 'Respuestas por voz activadas (Clic para silenciar)';
        btn.style.color = '#e2e8f0';
    } else {
        btn.innerHTML = '🔇';
        btn.title = 'Respuestas por voz silenciadas (Clic para activar)';
        btn.style.color = '#64748b';
    }
}

function cambiarModoJarvis(modo) {
    _JARVIS_MODO = (modo === 'ia') ? 'ia' : 'hibrido';
    try { localStorage.setItem('monarca_jarvis_modo', _JARVIS_MODO); } catch (e) {}
    actualizarModoJarvisUI();
}

function actualizarModoJarvisUI() {
    var btnHib = document.getElementById('jarvis-mode-hibrido');
    var btnIa = document.getElementById('jarvis-mode-ia');
    var inTexto = document.getElementById('jarvis-input-manual');
    var live = document.getElementById('jarvis-live-transcript');

    if (btnHib) btnHib.classList.toggle('active', _JARVIS_MODO === 'hibrido');
    if (btnIa) btnIa.classList.toggle('active', _JARVIS_MODO === 'ia');

    if (inTexto) {
        inTexto.placeholder = _JARVIS_MODO === 'ia'
            ? 'Pregúntale lo que quieras a tu IA (Gemini)...'
            : 'Escribe un comando o pregúntale a tu IA...';
    }
    if (live && !live.dataset.hasTranscript) {
        live.innerHTML = _JARVIS_MODO === 'ia'
            ? '<span class="jarvis-placeholder-txt">Modo IA directo: haz cualquier pregunta a Gemini y se guardará en tu App IA</span>'
            : '<span class="jarvis-placeholder-txt">Di un comando ("¿Cuál es mi saldo?", "Anota...") o haz cualquier pregunta a tu IA</span>';
    }
}

function actualizarEstadoIaEnJarvisUI() {
    var pill = document.getElementById('jarvis-ia-status-pill');
    if (!pill) return;

    var info = (typeof window.obtenerResumenEstadoIA === 'function')
        ? window.obtenerResumenEstadoIA()
        : { conectada: false, modeloNombre: 'Gemini IA', totalChats: 0 };

    if (info.conectada) {
        pill.className = 'jarvis-ia-pill is-online';
        pill.innerHTML =
            '<span class="jarvis-ia-dot is-online"></span>' +
            '<span>✦ ' + _escaparHtmlJarvis(info.modeloNombre) + ' · App IA conectada</span>';
        pill.title = 'Abrir tu App IA (conversaciones sincronizadas)';
        pill.onclick = function() {
            var convId = (_JARVIS_ULTIMA_RESP_IA && _JARVIS_ULTIMA_RESP_IA.convId)
                || (window.IA_RUNTIME && window.IA_RUNTIME.jarvisConvId)
                || '';
            if (typeof window.abrirConversacionIAEnApp === 'function') {
                window.abrirConversacionIAEnApp(convId);
            } else {
                cerrarModalJarvisVoz();
                if (typeof cambiarVista === 'function') cambiarVista('vista-ia');
            }
        };
    } else {
        pill.className = 'jarvis-ia-pill is-offline';
        pill.innerHTML =
            '<span class="jarvis-ia-dot is-offline"></span>' +
            '<span>🔑 Conectar API Key de tu App IA</span>';
        pill.title = 'Configura tu clave gratuita de Google AI Studio';
        pill.onclick = function() {
            abrirConfigIaDesdeJarvis();
        };
    }
}

function abrirConfigIaDesdeJarvis() {
    cerrarModalJarvisVoz();
    if (typeof cambiarVista === 'function') cambiarVista('vista-ia');
    setTimeout(function() {
        if (typeof window.abrirModalConfigIA === 'function') window.abrirModalConfigIA();
    }, 120);
}

/**
 * Abre el panel HUD de Jarvis e inicia la escucha
 */
function abrirModalJarvisVoz(autoStart) {
    var modal = document.getElementById('modal-jarvis-voz');
    if (!modal) return;

    modal.style.display = 'flex';
    _JARVIS_ACTIVO = true;

    actualizarBotonAudioJarvisUI();
    actualizarModoJarvisUI();
    actualizarEstadoIaEnJarvisUI();

    setJarvisEstado('listo', 'Toca el micrófono o pregúntale a tu IA');
    var inTexto = document.getElementById('jarvis-input-manual');
    if (inTexto) inTexto.value = '';

    if (autoStart !== false) {
        iniciarReconocimientoVoz();
    }
}

/**
 * Cierra el panel de Jarvis y apaga el micrófono / generación en curso
 */
function cerrarModalJarvisVoz() {
    var modal = document.getElementById('modal-jarvis-voz');
    if (modal) modal.style.display = 'none';

    _JARVIS_ACTIVO = false;
    _JARVIS_AUTO_RESTART = false;
    detenerGeneracionIAJarvis();
    detenerReconocimientoVoz();

    if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
    }
}

/**
 * Cambia el estado visual del Orbe de Jarvis
 */
function setJarvisEstado(estado, mensaje) {
    var orb = document.getElementById('jarvis-orb');
    var lblEstado = document.getElementById('jarvis-status-text');
    var btnFab = document.getElementById('btn-jarvis-voz-flotante');

    if (lblEstado && mensaje) lblEstado.textContent = mensaje;

    if (!orb) return;
    orb.className = 'jarvis-orb';

    if (estado === 'escuchando') {
        orb.classList.add('is-listening');
        if (btnFab) btnFab.classList.add('is-listening');
    } else if (estado === 'procesando') {
        orb.classList.add('is-thinking');
        if (btnFab) btnFab.classList.remove('is-listening');
    } else if (estado === 'hablando') {
        orb.classList.add('is-speaking');
        if (btnFab) btnFab.classList.remove('is-listening');
    } else {
        if (btnFab) btnFab.classList.remove('is-listening');
    }
}

/**
 * Inicia el reconocimiento de voz (nativo Android MonarcaVoice o Web Speech API)
 */
function iniciarReconocimientoVoz() {
    if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e0) {}
    }

    // 1. Ruta nativa Android APK (evita bloqueo de WebView SpeechRecognition)
    var nativeVoice = _obtenerPluginMonarcaVoiceJarvis();
    if (nativeVoice) {
        if (_JARVIS_ESCUCHANDO) return;
        if (!_JARVIS_NATIVE_BOUND && typeof nativeVoice.addListener === 'function') {
            _JARVIS_NATIVE_BOUND = true;
            nativeVoice.addListener('voicePartial', function(ev) {
                if (!_JARVIS_ESPERANDO_VOZ_NATIVA) return;
                var txt = ev && ev.text ? String(ev.text).trim() : '';
                var txtLive = document.getElementById('jarvis-live-transcript');
                if (txtLive && txt) {
                    txtLive.dataset.hasTranscript = '1';
                    txtLive.innerHTML = '<span class="jarvis-interim-txt">"' + _escaparHtmlJarvis(txt) + '"...</span>';
                }
            });
            nativeVoice.addListener('voiceResult', function(ev) {
                if (!_JARVIS_ESPERANDO_VOZ_NATIVA) return;
                _JARVIS_ESPERANDO_VOZ_NATIVA = false;
                _JARVIS_ESCUCHANDO = false;
                var txt = ev && ev.text ? String(ev.text).trim() : '';
                var txtLive = document.getElementById('jarvis-live-transcript');
                if (txtLive && txt) {
                    txtLive.dataset.hasTranscript = '1';
                    txtLive.innerHTML = '<strong>"' + _escaparHtmlJarvis(txt) + '"</strong>';
                }
                if (txt) {
                    setJarvisEstado('procesando', '🧠 Analizando con Jarvis & IA...');
                    procesarComandoJarvis(txt);
                } else {
                    setJarvisEstado('listo', 'No se detectó voz. Toca el micrófono para reintentar.');
                }
            });
            nativeVoice.addListener('voiceError', function(ev) {
                if (!_JARVIS_ESPERANDO_VOZ_NATIVA) return;
                _JARVIS_ESPERANDO_VOZ_NATIVA = false;
                _JARVIS_ESCUCHANDO = false;
                var msg = (ev && ev.message) ? String(ev.message) : 'No se pudo escuchar el micrófono.';
                setJarvisEstado('listo', msg);
            });
            nativeVoice.addListener('voiceState', function(ev) {
                if (!_JARVIS_ESPERANDO_VOZ_NATIVA) return;
                if (ev && ev.listening === true) {
                    _JARVIS_ESCUCHANDO = true;
                    setJarvisEstado('escuchando', '🔴 Escuchando... Habla ahora');
                } else if (ev && ev.listening === false) {
                    _JARVIS_ESCUCHANDO = false;
                    if (!_JARVIS_IA_GENERANDO) {
                        setJarvisEstado('listo', 'Toca el micrófono para hablar');
                    }
                }
            });
        }

        _JARVIS_ESPERANDO_VOZ_NATIVA = true;
        _JARVIS_ESCUCHANDO = true;
        setJarvisEstado('escuchando', '🔴 Escuchando... Di tu comando o pregunta');
        var txtLiveN = document.getElementById('jarvis-live-transcript');
        if (txtLiveN) {
            txtLiveN.dataset.hasTranscript = '1';
            txtLiveN.innerHTML = '<span class="jarvis-placeholder-txt">Habla ahora...</span>';
        }
        Promise.resolve(nativeVoice.startListening({ lang: 'es-ES' })).catch(function(err) {
            _JARVIS_ESPERANDO_VOZ_NATIVA = false;
            _JARVIS_ESCUCHANDO = false;
            var msgErr = (err && err.message) ? String(err.message) : 'Permiso de micrófono requerido. Actívalo o escribe abajo.';
            setJarvisEstado('listo', msgErr);
        });
        return;
    }

    // 2. Ruta Web / Escritorio (Web Speech API)
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        setJarvisEstado('listo', 'Micrófono no disponible aquí · escribe tu pregunta abajo');
        return;
    }

    if (_JARVIS_ESCUCHANDO && _JARVIS_RECOGNIZER) {
        return;
    }

    try {
        if (_JARVIS_RECOGNIZER) {
            _JARVIS_RECOGNIZER.abort();
        }

        _JARVIS_RECOGNIZER = new SpeechRecognition();
        _JARVIS_RECOGNIZER.lang = 'es-ES';
        _JARVIS_RECOGNIZER.interimResults = true;
        _JARVIS_RECOGNIZER.maxAlternatives = 1;
        _JARVIS_RECOGNIZER.continuous = false;

        _JARVIS_RECOGNIZER.onstart = function() {
            _JARVIS_ESCUCHANDO = true;
            setJarvisEstado('escuchando', '🔴 Escuchando... Di tu comando o pregunta');
            var txtLive = document.getElementById('jarvis-live-transcript');
            if (txtLive) {
                txtLive.dataset.hasTranscript = '1';
                txtLive.innerHTML = '<span class="jarvis-placeholder-txt">Habla ahora...</span>';
            }
        };

        _JARVIS_RECOGNIZER.onresult = function(event) {
            var interim = '';
            var finalTranscript = '';

            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            var txtLive = document.getElementById('jarvis-live-transcript');
            if (txtLive) {
                txtLive.dataset.hasTranscript = '1';
                if (finalTranscript) {
                    txtLive.innerHTML = '<strong>"' + _escaparHtmlJarvis(finalTranscript) + '"</strong>';
                } else if (interim) {
                    txtLive.innerHTML = '<span class="jarvis-interim-txt">"' + _escaparHtmlJarvis(interim) + '"...</span>';
                }
            }

            if (finalTranscript && finalTranscript.trim().length > 0) {
                setJarvisEstado('procesando', '🧠 Procesando con Jarvis & IA...');
                procesarComandoJarvis(finalTranscript.trim());
            }
        };

        _JARVIS_RECOGNIZER.onerror = function(event) {
            _JARVIS_ESCUCHANDO = false;
            var err = event.error;
            var msg = 'Error en el micrófono · puedes escribir abajo';

            if (err === 'not-allowed' || err === 'permission-denied' || err === 'service-not-allowed') {
                msg = 'Permiso de micrófono denegado. Permite el acceso en tu navegador/app o escribe abajo para hablar con la IA.';
            } else if (err === 'no-speech') {
                msg = 'No se detectó voz. Toca el micrófono para intentarlo de nuevo.';
            } else if (err === 'network') {
                msg = 'Error de red en el reconocimiento de voz.';
            }

            setJarvisEstado('listo', msg);
        };

        _JARVIS_RECOGNIZER.onend = function() {
            _JARVIS_ESCUCHANDO = false;
            if (_JARVIS_AUTO_RESTART && _JARVIS_ACTIVO && !_JARVIS_IA_GENERANDO) {
                setTimeout(function() {
                    if (_JARVIS_ACTIVO) iniciarReconocimientoVoz();
                }, 400);
            } else if (!_JARVIS_IA_GENERANDO) {
                var lbl = document.getElementById('jarvis-status-text');
                if (lbl && lbl.textContent.indexOf('Escuchando') !== -1) {
                    setJarvisEstado('listo', 'Toca el micrófono para hablar');
                }
            }
        };

        _JARVIS_RECOGNIZER.start();
    } catch (e) {
        console.warn('[Jarvis] Error al iniciar reconocimiento:', e);
        _JARVIS_ESCUCHANDO = false;
        setJarvisEstado('listo', 'Presiona el micrófono o escribe tu pregunta abajo');
    }
}

/**
 * Detiene la escucha activa
 */
function detenerReconocimientoVoz() {
    var nativeVoice = _obtenerPluginMonarcaVoiceJarvis();
    if (nativeVoice && (_JARVIS_ESCUCHANDO || _JARVIS_ESPERANDO_VOZ_NATIVA)) {
        _JARVIS_ESPERANDO_VOZ_NATIVA = false;
        try { nativeVoice.stopListening(); } catch (e0) {}
    }
    if (_JARVIS_RECOGNIZER) {
        try { _JARVIS_RECOGNIZER.abort(); } catch (e) {}
    }
    _JARVIS_ESCUCHANDO = false;
    if (!_JARVIS_IA_GENERANDO) {
        setJarvisEstado('listo', 'Micrófono detenido');
    }
}

function toggleReconocimientoVoz() {
    if (_JARVIS_ESCUCHANDO) {
        detenerReconocimientoVoz();
    } else {
        iniciarReconocimientoVoz();
    }
}

function ejecutarTextoManualJarvis() {
    var inTexto = document.getElementById('jarvis-input-manual');
    if (!inTexto || !inTexto.value.trim()) return;

    var txt = inTexto.value.trim();
    inTexto.value = '';

    var txtLive = document.getElementById('jarvis-live-transcript');
    if (txtLive) {
        txtLive.dataset.hasTranscript = '1';
        txtLive.innerHTML = '<strong>"' + _escaparHtmlJarvis(txt) + '"</strong>';
    }

    setJarvisEstado('procesando', '🧠 Procesando...');
    procesarComandoJarvis(txt);
}

/**
 * Muestra el resultado de la acción en la tarjeta central Dark Glass de Jarvis
 */
function mostrarResultadoJarvis(titulo, descripcionHtml, accionBtnHtml, esIa) {
    var cont = document.getElementById('jarvis-response-container');
    if (!cont) return;

    cont.style.display = 'block';
    cont.innerHTML =
        '<div class="jarvis-result-card' + (esIa ? ' is-ia' : '') + '">' +
            '<div class="jarvis-result-title">' + titulo + '</div>' +
            '<div class="jarvis-result-body' + (esIa ? ' ia-md-body' : '') + '" id="jarvis-result-body">' +
                descripcionHtml +
            '</div>' +
            (accionBtnHtml ? ('<div class="jarvis-result-actions">' + accionBtnHtml + '</div>') : '') +
        '</div>';
}

function _limpiarTextoParaVozJarvis(textoMd) {
    return String(textoMd || '')
        .replace(/```[\s\S]*?```/g, ' bloque de código ')
        .replace(/\|[-:\s|]+\|/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[#*_`~>|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 900);
}

/**
 * Emite respuesta mediante síntesis de voz (TTS)
 */
function hablarTextoJarvis(texto, callback) {
    if (!_JARVIS_VOZ_HABILITADA || !('speechSynthesis' in window)) {
        if (callback) callback();
        return;
    }

    var limpio = _limpiarTextoParaVozJarvis(texto);
    if (!limpio) {
        if (callback) callback();
        return;
    }

    try {
        window.speechSynthesis.cancel();

        var utterance = new SpeechSynthesisUtterance(limpio);
        utterance.lang = 'es-ES';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        utterance.onstart = function() {
            setJarvisEstado('hablando', '🗣️ Jarvis respondiendo...');
        };

        utterance.onend = function() {
            if (!_JARVIS_IA_GENERANDO) {
                setJarvisEstado('listo', 'Toca el micrófono o pregunta algo más');
            }
            if (callback) callback();
        };

        utterance.onerror = function() {
            if (!_JARVIS_IA_GENERANDO) {
                setJarvisEstado('listo', 'Toca el micrófono para hablar');
            }
            if (callback) callback();
        };

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.warn('[Jarvis TTS] Error:', e);
        if (callback) callback();
    }
}

// ==========================================================================
// CONEXIÓN DIRECTA DE JARVIS CON TU APP IA (GEMINI INTERACTIONS API)
// ==========================================================================

function detenerGeneracionIAJarvis() {
    if (_JARVIS_IA_ABORT_CTRL) {
        try { _JARVIS_IA_ABORT_CTRL.abort(); } catch (e) {}
        _JARVIS_IA_ABORT_CTRL = null;
    }
    _JARVIS_IA_GENERANDO = false;
}

function iniciarNuevoChatJarvisIA() {
    if (typeof window.obtenerOCrearConversacionJarvisIA === 'function') {
        var conv = window.obtenerOCrearConversacionJarvisIA(true);
        _JARVIS_ULTIMA_RESP_IA = { texto: '', convId: conv.id, msgId: '', modeloNombre: '' };
    }
    mostrarResultadoJarvis(
        '✦ Nuevo chat IA listo',
        'Tu próxima pregunta iniciará una nueva conversación limpia guardada automáticamente en tu <strong>App IA</strong>.',
        '<button type="button" class="jarvis-act-btn is-ia" onclick="abrirConversacionIAEnApp(window.IA_RUNTIME && window.IA_RUNTIME.jarvisConvId)">✦ Abrir App IA</button>',
        true
    );
    setJarvisEstado('listo', 'Nuevo chat IA listo · pregunta lo que quieras');
    hablarTextoJarvis('Nuevo chat con tu IA iniciado.');
}

function copiarUltimaRespuestaJarvisIA() {
    if (!_JARVIS_ULTIMA_RESP_IA || !_JARVIS_ULTIMA_RESP_IA.texto) return;
    var txt = _JARVIS_ULTIMA_RESP_IA.texto;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(txt).then(function() {
            if (typeof mostrarToastMonarca === 'function') mostrarToastMonarca('Respuesta copiada', '📋');
        }).catch(function() {});
    }
}

function guardarUltimaRespuestaJarvisEnConocimiento() {
    if (!_JARVIS_ULTIMA_RESP_IA || !_JARVIS_ULTIMA_RESP_IA.texto) return;
    if (typeof window.APP_STATE !== 'object' || !window.APP_STATE) return;
    if (!Array.isArray(APP_STATE.conocimientos)) APP_STATE.conocimientos = [];
    var ahora = Date.now();
    APP_STATE.conocimientos.unshift({
        id: 'CON-JIA-' + ahora + '-' + Math.random().toString(36).slice(2, 5),
        titulo: '🎙️ Jarvis IA · Consulta',
        categoria: 'Inteligencia Artificial',
        contenido: _JARVIS_ULTIMA_RESP_IA.texto,
        fecha: new Date(ahora).toLocaleDateString('es-ES'),
        fechaActualizacion: ahora
    });
    if (typeof MonarcaDB !== 'undefined' && MonarcaDB.save) MonarcaDB.save(APP_STATE);
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Guardado en tu biblioteca de Conocimiento', '📚');
    }
}

async function consultarIAConJarvis(pregunta, opts) {
    opts = opts || {};
    var txt = String(pregunta || '').trim();
    if (!txt) return;

    detenerGeneracionIAJarvis();
    if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e0) {}
    }

    if (typeof window.enviarPreguntaDesdeJarvisIA !== 'function') {
        mostrarResultadoJarvis(
            '⚠️ Módulo IA no cargado',
            'Recarga la aplicación para activar la integración con Gemini IA.',
            null,
            false
        );
        setJarvisEstado('listo', 'Módulo IA no disponible');
        return;
    }

    var estadoIA = (typeof window.obtenerResumenEstadoIA === 'function')
        ? window.obtenerResumenEstadoIA()
        : { conectada: false, modeloNombre: 'Gemini IA' };

    if (!estadoIA.conectada) {
        mostrarResultadoJarvis(
            '🔑 Conecta tu App IA primero',
            'Para que Jarvis responda cualquier pregunta con inteligencia artificial, conecta tu llave gratuita de <strong>Google AI Studio</strong> (<code>AQ...</code> o <code>AIza...</code>) en tu App IA.',
            '<button type="button" class="jarvis-act-btn is-ia" onclick="abrirConfigIaDesdeJarvis()">🔑 Conectar API Key de Gemini</button>',
            true
        );
        setJarvisEstado('listo', 'Conecta tu API Key de Gemini para activar IA');
        hablarTextoJarvis('Conecta tu llave gratuita de Gemini en la app de IA para responderte.');
        return;
    }

    _JARVIS_IA_GENERANDO = true;
    _JARVIS_IA_ABORT_CTRL = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    setJarvisEstado('procesando', '✦ ' + estadoIA.modeloNombre + ' pensando...');

    mostrarResultadoJarvis(
        '✦ ' + _escaparHtmlJarvis(estadoIA.modeloNombre) + ' <span class="jarvis-ia-tag">App IA</span>',
        '<div class="ia-typing-dots"><span></span><span></span><span></span></div>',
        '<button type="button" class="jarvis-act-btn is-danger" onclick="detenerGeneracionIAJarvis()">⏹ Detener</button>',
        true
    );

    try {
        var res = await window.enviarPreguntaDesdeJarvisIA(txt, {
            nuevaConversacion: !!opts.nuevaConversacion,
            usarContextoMonarca: true,
            abortSignal: _JARVIS_IA_ABORT_CTRL ? _JARVIS_IA_ABORT_CTRL.signal : undefined,
            onToolStatus: function(estadoTxt) {
                if (estadoTxt) {
                    setJarvisEstado('procesando', estadoTxt);
                } else {
                    setJarvisEstado('procesando', '✦ ' + estadoIA.modeloNombre + ' respondiendo...');
                }
            },
            onDelta: function(acumulado) {
                var bodyEl = document.getElementById('jarvis-result-body');
                if (bodyEl) {
                    bodyEl.innerHTML = (typeof window.renderizarMarkdownSeguroIA === 'function')
                        ? window.renderizarMarkdownSeguroIA(acumulado) + '<span class="ia-stream-caret"></span>'
                        : _escaparHtmlJarvis(acumulado).replace(/\n/g, '<br>');
                }
            }
        });

        _JARVIS_IA_GENERANDO = false;
        _JARVIS_IA_ABORT_CTRL = null;
        _JARVIS_ULTIMA_RESP_IA = res;
        actualizarEstadoIaEnJarvisUI();

        var htmlFinal = (typeof window.renderizarMarkdownSeguroIA === 'function')
            ? window.renderizarMarkdownSeguroIA(res.texto)
            : _escaparHtmlJarvis(res.texto).replace(/\n/g, '<br>');
        if (res && Array.isArray(res.herramientasUsadas) && res.herramientasUsadas.length > 0 && typeof window.renderizarChipsHerramientasIA === 'function') {
            htmlFinal = window.renderizarChipsHerramientasIA(res.herramientasUsadas) + htmlFinal;
        }
        var cidEsc = _escaparHtmlJarvis(res.convId || '');

        mostrarResultadoJarvis(
            '✦ ' + _escaparHtmlJarvis(res.modeloNombre || estadoIA.modeloNombre) + ' <span class="jarvis-ia-tag">Guardado en App IA</span>',
            htmlFinal,
            '<button type="button" class="jarvis-act-btn is-ia" onclick="abrirConversacionIAEnApp(\'' + cidEsc + '\')">✦ Ver en App IA</button>' +
            '<button type="button" class="jarvis-act-btn" onclick="copiarUltimaRespuestaJarvisIA()">📋 Copiar</button>' +
            '<button type="button" class="jarvis-act-btn" onclick="guardarUltimaRespuestaJarvisEnConocimiento()">📚 Guardar</button>' +
            '<button type="button" class="jarvis-act-btn" onclick="iniciarNuevoChatJarvisIA()">＋ Nuevo</button>',
            true
        );

        setJarvisEstado('listo', 'Respuesta guardada en tu App IA');
        hablarTextoJarvis(res.texto);
    } catch (err) {
        _JARVIS_IA_GENERANDO = false;
        _JARVIS_IA_ABORT_CTRL = null;
        if (err && err.name === 'AbortError') {
            setJarvisEstado('listo', 'Respuesta detenida');
            return;
        }
        var msgErr = (err && err.message) ? String(err.message) : 'No se pudo conectar con Gemini IA.';
        mostrarResultadoJarvis(
            '⚠️ Error al consultar tu App IA',
            _escaparHtmlJarvis(msgErr),
            '<button type="button" class="jarvis-act-btn is-ia" onclick="abrirConfigIaDesdeJarvis()">⚙️ Revisar API Key</button>',
            true
        );
        setJarvisEstado('listo', 'Error de conexión con Gemini');
    }
}

// ==========================================================================
// PARSER INTELIGENTE DE COMANDOS EN LENGUAJE NATURAL + ENRUTADOR IA
// ==========================================================================

function normalizarTextoComando(txt) {
    return (txt || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[.,\/#!$%^&*;:{}=\-_`~()¿?¡!]/g, '')
        .trim();
}

function _esComandoNavegacionDirecta(cmd, palabrasClave) {
    var prefijosNav = ['ir a ', 've a ', 'abre ', 'abrir ', 'ver ', 'mostrar ', 'muestra ', 'muestrame ', 'llevame a ', 'entra a ', 'entrar a '];
    for (var i = 0; i < palabrasClave.length; i++) {
        var kw = palabrasClave[i];
        if (cmd === kw || cmd === 'mi ' + kw || cmd === 'mis ' + kw || cmd === 'el ' + kw || cmd === 'la ' + kw) {
            return true;
        }
        for (var j = 0; j < prefijosNav.length; j++) {
            if (cmd.indexOf(prefijosNav[j] + kw) !== -1 ||
                cmd.indexOf(prefijosNav[j] + 'mi ' + kw) !== -1 ||
                cmd.indexOf(prefijosNav[j] + 'mis ' + kw) !== -1 ||
                cmd.indexOf(prefijosNav[j] + 'el ' + kw) !== -1 ||
                cmd.indexOf(prefijosNav[j] + 'la ' + kw) !== -1) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Interpreta la intención del usuario: ejecuta comandos rápidos del sistema
 * o responde directamente con tu App IA (Gemini).
 */
function procesarComandoJarvis(comandoOriginal) {
    var raw = String(comandoOriginal || '').trim();
    var cmd = normalizarTextoComando(raw);

    if (!cmd) {
        setJarvisEstado('listo', 'Comando vacío. Di algo o pregúntale a tu IA.');
        return;
    }

    // 0. CONTROL RÁPIDO DE SILENCIO / DETENER
    if (cmd === 'silencio' || cmd === 'callate' || cmd === 'detente' || cmd === 'parar' || cmd === 'stop') {
        detenerGeneracionIAJarvis();
        if ('speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch (e) {}
        }
        setJarvisEstado('listo', 'Detenido');
        return;
    }

    // 0B. COMANDOS EXPLÍCITOS PARA LA APP IA
    if (cmd === 'nuevo chat' || cmd === 'nuevo chat ia' || cmd === 'nueva conversacion' || cmd === 'nueva conversacion ia') {
        iniciarNuevoChatJarvisIA();
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['ia', 'app ia', 'app de ia', 'inteligencia artificial', 'gemini', 'chat ia'])) {
        var cid = (_JARVIS_ULTIMA_RESP_IA && _JARVIS_ULTIMA_RESP_IA.convId) || (window.IA_RUNTIME && window.IA_RUNTIME.jarvisConvId) || '';
        if (typeof window.abrirConversacionIAEnApp === 'function') {
            window.abrirConversacionIAEnApp(cid);
        } else {
            navegarPorVoz('vista-ia', 'tu app de Inteligencia Artificial');
        }
        hablarTextoJarvis('Abriendo tu app de inteligencia artificial.');
        return;
    }

    var matchExplicitIA = raw.match(/^(?:preg[uú]ntale a la ia|pregunta a la ia|dile a la ia|dile a gemini|preg[uú]ntale a gemini|consulta a la ia|oiga ia|oye ia|ia)\s*[:,]?\s+(.+)/i);
    if (matchExplicitIA && matchExplicitIA[1] && matchExplicitIA[1].trim()) {
        consultarIAConJarvis(matchExplicitIA[1].trim());
        return;
    }

    // SI ESTÁ EN MODO "SOLO IA", TODO VA DIRECTO A GEMINI
    if (_JARVIS_MODO === 'ia') {
        consultarIAConJarvis(raw);
        return;
    }

    // === MODO HÍBRIDO: COMANDOS DIRECTOS DEL SISTEMA + FALLBACK INTELIGENTE A GEMINI IA ===

    // 1. FINANZAS / SALDO (solo consultas directas de saldo o navegación)
    if (cmd.includes('cual es mi saldo') || cmd === 'saldo' || cmd === 'mi saldo' ||
        cmd.includes('cuanto dinero tengo') || cmd.includes('cuanto tengo') ||
        cmd === 'mi balance' || cmd === 'ver balance' || cmd === 'mis ingresos' || cmd === 'mis gastos' ||
        cmd === 'ver mis ingresos' || cmd === 'ver mis gastos') {
        consultarSaldoVoz();
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['finanzas', 'balance', 'cuentas'])) {
        navegarPorVoz('vista-finanzas', 'tu módulo de finanzas');
        return;
    }

    // 2. INVENTARIO: NUEVO PRODUCTO
    if (cmd.includes('nuevo producto') || cmd.includes('crear producto') || cmd.includes('agregar producto') || cmd.includes('anadir producto')) {
        cerrarModalJarvisVoz();
        if (typeof cambiarVista === 'function') cambiarVista('vista-inventario');
        if (typeof cambiarTabInventario === 'function') cambiarTabInventario('productos');
        if (typeof abrirModalNuevoProducto === 'function') {
            setTimeout(function() { abrirModalNuevoProducto(); }, 250);
        }
        hablarTextoJarvis('Abriendo formulario para registrar un nuevo producto.');
        return;
    }

    // 3. INVENTARIO: REGISTRAR VENTA
    if (cmd.includes('registrar venta') || cmd.includes('hacer venta') || cmd.includes('realizar venta') || cmd === 'vender') {
        cerrarModalJarvisVoz();
        if (typeof cambiarVista === 'function') cambiarVista('vista-inventario');
        if (typeof cambiarTabInventario === 'function') cambiarTabInventario('productos');
        hablarTextoJarvis('Abriendo tu catálogo de productos. Selecciona cuál vendiste.');
        return;
    }

    // 4. INVENTARIO: HISTORIAL DE VENTAS
    if (cmd.includes('historial de venta') || cmd.includes('cuanto he vendido') || _esComandoNavegacionDirecta(cmd, ['ventas', 'vendidos'])) {
        cerrarModalJarvisVoz();
        if (typeof cambiarVista === 'function') cambiarVista('vista-inventario');
        if (typeof cambiarTabInventario === 'function') cambiarTabInventario('vendidos');
        hablarTextoJarvis('Mostrando el historial de productos vendidos.');
        return;
    }

    // 5. INVENTARIO: CONSULTA DE STOCK DE UN PRODUCTO ESPECÍFICO
    if (cmd.includes('stock de ') || cmd.includes('existencias de ')) {
        var matchStock = raw.match(/(?:stock de|existencias de)\s+(.+)/i);
        var busqueda = matchStock ? matchStock[1].trim() : '';
        consultarStockProductoVoz(busqueda);
        return;
    }

    // 6. INVENTARIO: ABRIR MÓDULO GENERAL
    if (_esComandoNavegacionDirecta(cmd, ['inventario', 'productos', 'catalogo'])) {
        navegarPorVoz('vista-inventario', 'el módulo de inventario');
        return;
    }

    // 7. DICTAR / GUARDAR NOTA O IDEA
    var esNota = cmd.startsWith('anota ') || cmd.startsWith('anotar ') || cmd.startsWith('apunta ') ||
                 cmd.startsWith('recuerdame ') || cmd.startsWith('guardar nota ') || cmd.startsWith('guardar idea ');
    if (esNota) {
        var matchNota = raw.match(/(?:anota|anotar|apunta|recuerdame|guardar nota|guardar idea)(?:\s+que|\s*:)?\s*(.+)/i);
        var contenidoNota = matchNota ? matchNota[1].trim() : '';
        if (contenidoNota) {
            guardarNotaPorVoz(contenidoNota);
            return;
        }
    }

    // 8. NAVEGACIÓN DIRECTA DEL SISTEMA (solo intención explícita de abrir/ir a la sección)
    if (_esComandoNavegacionDirecta(cmd, ['menu principal', 'menu', 'aplicaciones', 'apps'])) {
        navegarPorVoz('vista-menu', 'el menú de aplicaciones');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['home', 'inicio', 'pantalla principal'])) {
        navegarPorVoz('vista-home', 'tu pantalla de inicio Home');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['perfil', 'mi nivel', 'atributos'])) {
        navegarPorVoz('vista-perfil', 'tu perfil de jugador');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['progresion', 'habitos', 'quests', 'misiones', 'acciones'])) {
        navegarPorVoz('vista-acciones-progresion', 'tus hábitos y misiones');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['gym', 'ejercicios', 'rutina', 'rutinas', 'entrenamiento'])) {
        navegarPorVoz('vista-ejercicios', 'tu módulo de ejercicios y rutinas');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['ideas', 'notas', 'banco de ideas'])) {
        navegarPorVoz('vista-ideas', 'tu banco de ideas');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['calendario', 'agenda'])) {
        navegarPorVoz('vista-calendario', 'el calendario');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['estado personal', 'fatiga', 'recuperacion'])) {
        navegarPorVoz('vista-estado-personal', 'tu estado personal y fatiga');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['musica', 'reproductor', 'mp3', 'canciones'])) {
        navegarPorVoz('vista-reproductor', 'tu reproductor de música MP3');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['conocimiento', 'estudio'])) {
        navegarPorVoz('vista-conocimiento', 'tu biblioteca de conocimiento');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['vocabulario', 'vocabulario semanal'])) {
        cerrarModalJarvisVoz();
        if (typeof window.abrirVocabularioDesdeHome === 'function') {
            window.abrirVocabularioDesdeHome();
        } else if (typeof cambiarVista === 'function') {
            cambiarVista('vista-conocimiento');
        }
        hablarTextoJarvis('Abriendo tu vocabulario semanal.');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['labores', 'trabajo', 'barberia', 'trainer'])) {
        navegarPorVoz('vista-labores', 'el módulo de labores');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['personas', 'contactos'])) {
        navegarPorVoz('vista-personas', 'tu red de personas');
        return;
    }
    if (_esComandoNavegacionDirecta(cmd, ['ruleta'])) {
        navegarPorVoz('vista-ruleta', 'la ruleta semanal');
        return;
    }

    // 9. AYUDA / COMANDOS
    if (cmd === 'ayuda' || cmd === 'comandos' || cmd === 'que puedes hacer' || cmd === 'que sabes hacer') {
        var ayudaTxt = 'Ahora estoy conectado con tu app de inteligencia artificial. Hazme cualquier pregunta libre o usa comandos como: ¿Cuál es mi saldo?, Ver inventario, Anota una idea o Ir a cualquier sección.';
        mostrarResultadoJarvis(
            '🤖 Comandos + Inteligencia Artificial',
            '• <strong>✦ IA Gemini:</strong> Pregunta cualquier cosa (ej. <em>"Explícame el interés compuesto"</em> o <em>"Planifica mi tarde"</em>) — se responde aquí y se guarda en tu App IA.<br>' +
            '• <strong>Finanzas:</strong> "¿Cuál es mi saldo?", "Ir a finanzas"<br>' +
            '• <strong>Inventario:</strong> "Ver inventario", "Nuevo producto", "Stock de [artículo]"<br>' +
            '• <strong>Notas:</strong> "Anota comprar repuestos"<br>' +
            '• <strong>Navegación:</strong> "Ir a IA", "Ir a música", "Ir a ejercicios", "Ir a calendario"',
            '<button type="button" class="jarvis-act-btn is-ia" onclick="abrirConversacionIAEnApp()">✦ Abrir App IA</button>',
            true
        );
        hablarTextoJarvis(ayudaTxt);
        return;
    }

    // 10. TODO LO DEMÁS -> RESPUESTA INTELIGENTE CON TU APP IA (GEMINI)
    consultarIAConJarvis(raw);
}

// ==========================================================================
// ACCIONES ESPECÍFICAS DE MONARCA
// ==========================================================================

function consultarSaldoVoz() {
    if (!window.APP_STATE || !APP_STATE.finanzas) {
        mostrarResultadoJarvis('💰 Finanzas', 'No hay datos de finanzas disponibles en este momento.', null);
        hablarTextoJarvis('No encontré información financiera registrada.');
        return;
    }

    var f = APP_STATE.finanzas;
    var totIngresos = 0;
    var totGastos = 0;

    (f.ingresos || []).forEach(function(i) { totIngresos += (Number(i.monto) || 0); });
    (f.gastos || []).forEach(function(g) { totGastos += (Number(g.monto) || 0); });

    var saldoNeto = totIngresos - totGastos;
    var signo = saldoNeto >= 0 ? '+' : '-';
    var saldoAbs = Math.abs(saldoNeto).toFixed(2);

    var descripcionTexto =
        '<strong>Saldo Disponible:</strong> <span style="font-size: 16px; font-weight: 800; color: ' + (saldoNeto >= 0 ? '#34d399' : '#f87171') + ';">$' + saldoNeto.toFixed(2) + '</span><br>' +
        '• Total Ingresos: <strong>$' + totIngresos.toFixed(2) + '</strong><br>' +
        '• Total Gastos: <strong>$' + totGastos.toFixed(2) + '</strong>';

    mostrarResultadoJarvis(
        '💰 Resumen de Finanzas',
        descripcionTexto,
        '<button type="button" class="jarvis-act-btn" onclick="cerrarModalJarvisVoz(); cambiarVista(\'vista-finanzas\');">📊 Ir a Finanzas</button>'
    );

    var locucion = 'Tu saldo neto actual es de ' + (signo === '-' ? 'menos ' : '') + saldoAbs + ' dólares. Has registrado ' + totIngresos.toFixed(0) + ' en ingresos y ' + totGastos.toFixed(0) + ' en gastos.';
    hablarTextoJarvis(locucion);
}

function consultarStockProductoVoz(busqueda) {
    if (!window.APP_STATE || !APP_STATE.inventario || !Array.isArray(APP_STATE.inventario.productos)) {
        hablarTextoJarvis('Tu catálogo de inventario está vacío.');
        return;
    }

    var prods = APP_STATE.inventario.productos;
    var q = normalizarTextoComando(busqueda);

    if (!q) {
        cerrarModalJarvisVoz();
        cambiarVista('vista-inventario');
        hablarTextoJarvis('Mostrando tu catálogo de inventario.');
        return;
    }

    var encontrados = prods.filter(function(p) {
        var n = normalizarTextoComando(p.nombre);
        var m = normalizarTextoComando(p.marca);
        return n.includes(q) || m.includes(q);
    });

    if (encontrados.length === 0) {
        mostrarResultadoJarvis(
            '📦 Producto no encontrado',
            'No encontré productos que coincidan con <strong>"' + _escaparHtmlJarvis(busqueda) + '"</strong>.',
            '<button type="button" class="jarvis-act-btn" onclick="cerrarModalJarvisVoz(); cambiarVista(\'vista-inventario\');">📦 Ver Catálogo</button>'
        );
        hablarTextoJarvis('No encontré ningún producto que coincida con ' + busqueda + '.');
        return;
    }

    var p = encontrados[0];
    var stock = Number(p.stock) || 0;
    var pVenta = Number(p.precioVenta != null ? p.precioVenta : (p.costo || 0));

    var detalleHtml =
        '<strong>' + _escaparHtmlJarvis(p.nombre) + '</strong><br>' +
        'Existencias: <strong style="color: ' + (stock > 0 ? '#34d399' : '#f87171') + ';">' + stock + ' unidades</strong> · Precio: <strong>$' + pVenta.toFixed(2) + '</strong>';

    if (p.tieneVariantes && Array.isArray(p.variantes)) {
        detalleHtml += '<div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">';
        p.variantes.forEach(function(v) {
            detalleHtml += '<span class="variant-pill">' + _escaparHtmlJarvis((v.talla ? 'T: ' + v.talla : '') + (v.color ? ' · ' + v.color : '') + ': ' + v.stock) + '</span>';
        });
        detalleHtml += '</div>';
    }

    mostrarResultadoJarvis(
        '📦 Consulta de Inventario',
        detalleHtml,
        '<button type="button" class="jarvis-act-btn" onclick="cerrarModalJarvisVoz(); abrirModalRegistrarVenta(\'' + _escaparHtmlJarvis(p.id) + '\');">💵 Registrar Venta</button>'
    );

    hablarTextoJarvis('Tienes ' + stock + ' unidades de ' + p.nombre + ' en stock.');
}

function guardarNotaPorVoz(contenido) {
    if (!window.APP_STATE) window.APP_STATE = MonarcaDB.get();
    if (!APP_STATE.ideas) APP_STATE.ideas = [];

    var ahora = new Date();
    var dd = String(ahora.getDate()).padStart(2, '0');
    var mm = String(ahora.getMonth() + 1).padStart(2, '0');
    var fechaCorta = dd + '/' + mm;

    var nuevaIdea = {
        id: 'IDEA-VOZ-' + Date.now(),
        texto: contenido + ' (' + fechaCorta + ')',
        categoria: '💡 Ideas & Proyectos',
        subcategoria: '🎙️ Dictadas por Voz',
        contexto: '⚡ Jarvis Voz',
        hecha: false,
        fecha: ahora.toISOString(),
        fechaFormato: fechaCorta
    };

    APP_STATE.ideas.unshift(nuevaIdea);
    MonarcaDB.save(APP_STATE);

    if (typeof cargarIdeas === 'function') {
        cargarIdeas();
    }

    mostrarResultadoJarvis(
        '📝 Nota Guardada en Ideas',
        '"' + _escaparHtmlJarvis(nuevaIdea.texto) + '"<br><span style="font-size: 11px; color: #94a3b8;">Archivada en Ideas &amp; Proyectos · Dictadas por Voz</span>',
        '<button type="button" class="jarvis-act-btn" onclick="cerrarModalJarvisVoz(); cambiarVista(\'vista-ideas\');">💡 Ir a Ideas</button>'
    );

    hablarTextoJarvis('Anotado: ' + contenido + '. Guardada en tu banco de ideas.');
}

function navegarPorVoz(vistaId, nombreVista) {
    cerrarModalJarvisVoz();
    if (typeof cambiarVista === 'function') {
        cambiarVista(vistaId);
    }
    hablarTextoJarvis('Abriendo ' + nombreVista + '.');
}

// EXPORTS & ALIAS GLOBALES
if (typeof window !== 'undefined') {
    window.abrirModalJarvisVoz = abrirModalJarvisVoz;
    window.cerrarModalJarvisVoz = cerrarModalJarvisVoz;
    window.toggleSilencioJarvis = toggleSilencioJarvis;
    window.toggleReconocimientoVoz = toggleReconocimientoVoz;
    window.iniciarReconocimientoVoz = iniciarReconocimientoVoz;
    window.detenerReconocimientoVoz = detenerReconocimientoVoz;
    window.ejecutarTextoManualJarvis = ejecutarTextoManualJarvis;
    window.procesarComandoJarvis = procesarComandoJarvis;
    window.cambiarModoJarvis = cambiarModoJarvis;
    window.consultarIAConJarvis = consultarIAConJarvis;
    window.detenerGeneracionIAJarvis = detenerGeneracionIAJarvis;
    window.iniciarNuevoChatJarvisIA = iniciarNuevoChatJarvisIA;
    window.copiarUltimaRespuestaJarvisIA = copiarUltimaRespuestaJarvisIA;
    window.guardarUltimaRespuestaJarvisEnConocimiento = guardarUltimaRespuestaJarvisEnConocimiento;
    window.abrirConfigIaDesdeJarvis = abrirConfigIaDesdeJarvis;
    window.actualizarEstadoIaEnJarvisUI = actualizarEstadoIaEnJarvisUI;
    window.abrirModalEmilyVoz = abrirModalJarvisVoz;
    window.iniciarReconocimientoEmily = iniciarReconocimientoVoz;
    window.detenerReconocimientoEmily = detenerReconocimientoVoz;
}
