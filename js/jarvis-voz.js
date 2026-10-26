/**
 * SISTEMA MONARCA · MÓDULO JARVIS VOZ (ASISTENTE POR COMANDOS DE VOZ)
 * Reconocimiento de voz continuo/interactivo, síntesis de voz (TTS) y ejecución
 * inteligente de acciones sobre Finanzas, Inventario, Notas e Ideas y Navegación.
 */

var _JARVIS_ACTIVO = false;
var _JARVIS_ESCUCHANDO = false;
var _JARVIS_VOZ_HABILITADA = localStorage.getItem('monarca_jarvis_tts') !== 'false';
var _JARVIS_RECOGNIZER = null;
var _JARVIS_AUTO_RESTART = false;

/**
 * Inicialización al cargar el sistema
 */
document.addEventListener('DOMContentLoaded', function() {
    inicializarJarvisVoz();
});

function inicializarJarvisVoz() {
    actualizarBotonAudioJarvisUI();
}

/**
 * Alterna el estado del sintetizador de voz (TTS)
 */
function toggleSilencioJarvis() {
    _JARVIS_VOZ_HABILITADA = !_JARVIS_VOZ_HABILITADA;
    localStorage.setItem('monarca_jarvis_tts', _JARVIS_VOZ_HABILITADA ? 'true' : 'false');
    actualizarBotonAudioJarvisUI();

    if (!_JARVIS_VOZ_HABILITADA && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    } else if (_JARVIS_VOZ_HABILITADA) {
        hablarTextoJarvis("Voz activada. Estoy listo para responder.");
    }
}

function actualizarBotonAudioJarvisUI() {
    var btn = document.getElementById('jarvis-btn-toggle-audio');
    if (!btn) return;
    if (_JARVIS_VOZ_HABILITADA) {
        btn.innerHTML = '🔊';
        btn.title = "Respuestas por voz activadas (Clic para silenciar)";
        btn.style.color = '#111827';
    } else {
        btn.innerHTML = '🔇';
        btn.title = "Respuestas por voz silenciadas (Clic para activar)";
        btn.style.color = '#9ca3af';
    }
}

/**
 * Abre el panel HUD de Jarvis e inicia la escucha
 */
function abrirModalJarvisVoz(autoStart) {
    var modal = document.getElementById('modal-jarvis-voz');
    if (!modal) return;

    modal.style.display = 'flex';
    _JARVIS_ACTIVO = true;

    // Reset UI
    setJarvisEstado('listo', 'Toca el micrófono o escribe un comando');
    var inTexto = document.getElementById('jarvis-input-manual');
    if (inTexto) inTexto.value = '';

    if (autoStart !== false) {
        iniciarReconocimientoVoz();
    }
}

/**
 * Cierra el panel de Jarvis y apaga el micrófono
 */
function cerrarModalJarvisVoz() {
    var modal = document.getElementById('modal-jarvis-voz');
    if (modal) modal.style.display = 'none';

    _JARVIS_ACTIVO = false;
    _JARVIS_AUTO_RESTART = false;
    detenerReconocimientoVoz();

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
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
 * Inicia el motor SpeechRecognition del navegador
 */
function iniciarReconocimientoVoz() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        setJarvisEstado('error', 'Tu navegador no soporta reconocimiento de voz nativo.');
        mostrarResultadoJarvis(
            '⚠️ Micrófono no soportado en este navegador',
            'Tu navegador no incluye la API Web Speech. Puedes escribir tus comandos en el campo de texto inferior.',
            null
        );
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
            setJarvisEstado('escuchando', '🔴 Escuchando... Di tu comando');
            var txtLive = document.getElementById('jarvis-live-transcript');
            if (txtLive) txtLive.innerHTML = '<span style="color: #9ca3af; font-style: italic;">Habla ahora...</span>';
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
                if (finalTranscript) {
                    txtLive.innerHTML = `<strong>"${finalTranscript}"</strong>`;
                } else if (interim) {
                    txtLive.innerHTML = `<span style="color: #374151;">"${interim}"...</span>`;
                }
            }

            if (finalTranscript && finalTranscript.trim().length > 0) {
                setJarvisEstado('procesando', '🧠 Analizando comando...');
                procesarComandoJarvis(finalTranscript.trim());
            }
        };

        _JARVIS_RECOGNIZER.onerror = function(event) {
            _JARVIS_ESCUCHANDO = false;
            var err = event.error;
            var msg = 'Error en el micrófono';

            if (err === 'not-allowed' || err === 'permission-denied') {
                msg = 'Permiso de micrófono denegado. Permite el acceso en tu navegador.';
            } else if (err === 'no-speech') {
                msg = 'No se detectó voz. Toca el micrófono para intentarlo de nuevo.';
            } else if (err === 'network') {
                msg = 'Error de red en el reconocimiento de voz.';
            }

            setJarvisEstado('listo', msg);
        };

        _JARVIS_RECOGNIZER.onend = function() {
            _JARVIS_ESCUCHANDO = false;
            if (_JARVIS_AUTO_RESTART && _JARVIS_ACTIVO) {
                setTimeout(function() {
                    if (_JARVIS_ACTIVO) iniciarReconocimientoVoz();
                }, 400);
            } else {
                setJarvisEstado('listo', 'Toca el micrófono para hablar');
            }
        };

        _JARVIS_RECOGNIZER.start();
    } catch (e) {
        console.warn("[Jarvis] Error al iniciar reconocimiento:", e);
        _JARVIS_ESCUCHANDO = false;
        setJarvisEstado('listo', 'Presiona el botón para hablar');
    }
}

/**
 * Detiene la escucha activa
 */
function detenerReconocimientoVoz() {
    if (_JARVIS_RECOGNIZER) {
        try {
            _JARVIS_RECOGNIZER.abort();
        } catch(e) {}
    }
    _JARVIS_ESCUCHANDO = false;
    setJarvisEstado('listo', 'Micrófono detenido');
}

/**
 * Alterna entre escuchar y detener
 */
function toggleReconocimientoVoz() {
    if (_JARVIS_ESCUCHANDO) {
        detenerReconocimientoVoz();
    } else {
        iniciarReconocimientoVoz();
    }
}

/**
 * Procesa la entrada escrita manualmente en la caja de texto de Jarvis
 */
function ejecutarTextoManualJarvis() {
    var inTexto = document.getElementById('jarvis-input-manual');
    if (!inTexto || !inTexto.value.trim()) return;

    var txt = inTexto.value.trim();
    inTexto.value = '';

    var txtLive = document.getElementById('jarvis-live-transcript');
    if (txtLive) txtLive.innerHTML = `<strong>"${txt}"</strong>`;

    setJarvisEstado('procesando', '🧠 Procesando comando...');
    procesarComandoJarvis(txt);
}

/**
 * Muestra el resultado de la acción en la tarjeta central de Jarvis
 */
function mostrarResultadoJarvis(titulo, descripcion, accionBtnHtml) {
    var cont = document.getElementById('jarvis-response-container');
    if (!cont) return;

    cont.style.display = 'block';
    cont.innerHTML = `
        <div style="background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; margin-top: 10px; animation: fadeIn 0.25s ease;">
            <div style="font-size: 13px; font-weight: 800; color: #111827; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                ${titulo}
            </div>
            <div style="font-size: 12.5px; color: #4b5563; line-height: 1.45;">
                ${descripcion}
            </div>
            ${accionBtnHtml ? `<div style="margin-top: 10px;">${accionBtnHtml}</div>` : ''}
        </div>
    `;
}

/**
 * Emite respuesta mediante síntesis de voz (TTS)
 */
function hablarTextoJarvis(texto, callback) {
    if (!_JARVIS_VOZ_HABILITADA || !('speechSynthesis' in window)) {
        if (callback) callback();
        return;
    }

    try {
        window.speechSynthesis.cancel();

        var utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        utterance.onstart = function() {
            setJarvisEstado('hablando', '🗣️ Monarca respondiendo...');
        };

        utterance.onend = function() {
            setJarvisEstado('listo', 'Toca el micrófono para otro comando');
            if (callback) callback();
        };

        utterance.onerror = function() {
            setJarvisEstado('listo', 'Toca el micrófono para hablar');
            if (callback) callback();
        };

        window.speechSynthesis.speak(utterance);
    } catch(e) {
        console.warn("[Jarvis TTS] Error:", e);
        if (callback) callback();
    }
}

// ==========================================================================
// PARSER INTELIGENTE DE COMANDOS EN LENGUAJE NATURAL
// ==========================================================================

function normalizarTextoComando(txt) {
    return (txt || '')
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita tildes
        .replace(/[.,/#!$%^&*;:{}=\-_`~()¿?¡!]/g, "")
        .trim();
}

/**
 * Interpreta la intención del usuario y ejecuta la acción correspondiente
 */
function procesarComandoJarvis(comandoOriginal) {
    var raw = comandoOriginal.trim();
    var cmd = normalizarTextoComando(raw);

    if (!cmd) {
        setJarvisEstado('listo', 'Comando vacío. Di algo.');
        return;
    }

    // 1. FINANZAS / SALDO
    if (cmd.includes('saldo') || cmd.includes('dinero tengo') || cmd.includes('finanzas') || 
        cmd.includes('balance') || cmd.includes('ingresos') || cmd.includes('gastos') || cmd.includes('cuanto tengo')) {
        consultarSaldoVoz();
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
        hablarTextoJarvis("Abriendo formulario para registrar un nuevo producto.");
        return;
    }

    // 3. INVENTARIO: REGISTRAR VENTA
    if (cmd.includes('vender') || cmd.includes('registrar venta') || cmd.includes('hacer venta') || cmd.includes('realizar venta')) {
        cerrarModalJarvisVoz();
        if (typeof cambiarVista === 'function') cambiarVista('vista-inventario');
        if (typeof cambiarTabInventario === 'function') cambiarTabInventario('productos');
        hablarTextoJarvis("Abriendo tu catálogo de productos. Selecciona cuál vendiste.");
        return;
    }

    // 4. INVENTARIO: HISTORIAL DE VENTAS
    if (cmd.includes('ventas') || cmd.includes('vendidos') || cmd.includes('cuanto he vendido') || cmd.includes('historial de venta')) {
        cerrarModalJarvisVoz();
        if (typeof cambiarVista === 'function') cambiarVista('vista-inventario');
        if (typeof cambiarTabInventario === 'function') cambiarTabInventario('vendidos');
        hablarTextoJarvis("Mostrando el historial de productos vendidos.");
        return;
    }

    // 5. INVENTARIO: CONSULTA DE STOCK DE UN PRODUCTO ESPECÍFICO
    if (cmd.includes('stock de') || cmd.includes('cuantas') || cmd.includes('cuantos') || cmd.includes('tengo de')) {
        var matchStock = raw.match(/(?:stock de|cuantas|cuantos|tengo de|existencias de)\s+(.+)/i);
        var busqueda = matchStock ? matchStock[1].trim() : '';
        consultarStockProductoVoz(busqueda);
        return;
    }

    // 6. INVENTARIO: ABRIR MÓDULO GENERAL
    if (cmd.includes('inventario') || cmd.includes('productos') || cmd.includes('catalogo')) {
        cerrarModalJarvisVoz();
        if (typeof cambiarVista === 'function') cambiarVista('vista-inventario');
        hablarTextoJarvis("Abriendo el módulo de inventario.");
        return;
    }

    // 7. DICTAR / GUARDAR NOTA O IDEA
    var esNota = cmd.startsWith('anota') || cmd.startsWith('anotar') || cmd.startsWith('apunta') || 
                 cmd.startsWith('recuerdame') || cmd.startsWith('nota') || cmd.startsWith('idea') ||
                 cmd.startsWith('guardar nota') || cmd.startsWith('guardar idea');
    if (esNota) {
        var matchNota = raw.match(/(?:anota|anotar|apunta|recuerdame|nota|idea|guardar nota|guardar idea)(?:\s+que|\s*:)?\s*(.+)/i);
        var contenidoNota = matchNota ? matchNota[1].trim() : '';
        if (contenidoNota) {
            guardarNotaPorVoz(contenidoNota);
            return;
        }
    }

    // 8. NAVEGACIÓN GENERAL DEL SISTEMA
    if (cmd.includes('inicio') || cmd.includes('menu principal') || cmd.includes('pantalla principal')) {
        navegarPorVoz('vista-menu', 'el menú principal');
        return;
    }
    if (cmd.includes('perfil') || cmd.includes('mi nivel') || cmd.includes('atributos')) {
        navegarPorVoz('vista-perfil', 'tu perfil de jugador');
        return;
    }
    if (cmd.includes('progresion') || cmd.includes('habitos') || cmd.includes('quests') || cmd.includes('misiones')) {
        navegarPorVoz('vista-acciones-progresion', 'tus hábitos y misiones');
        return;
    }
    if (cmd.includes('gym') || cmd.includes('ejercicios') || cmd.includes('rutina') || cmd.includes('entrenamiento')) {
        navegarPorVoz('vista-ejercicios', 'tu módulo de ejercicios y rutinas');
        return;
    }
    if (cmd.includes('ideas') || cmd.includes('notas')) {
        navegarPorVoz('vista-ideas', 'tu banco de ideas');
        return;
    }
    if (cmd.includes('calendario') || cmd.includes('agenda')) {
        navegarPorVoz('vista-calendario', 'el calendario');
        return;
    }
    if (cmd.includes('estado personal') || cmd.includes('fatiga') || cmd.includes('recuperacion')) {
        navegarPorVoz('vista-estado-personal', 'tu estado personal y fatiga');
        return;
    }

    // 9. AYUDA / QUÉ PUEDES HACER
    if (cmd.includes('ayuda') || cmd.includes('que puedes hacer') || cmd.includes('comandos') || cmd.includes('que sabes hacer')) {
        var ayudaTxt = "Puedes pedirme: '¿Cuál es mi saldo?', 'Ver inventario', 'Nuevo producto', 'Anota [tu idea]' o pedirme ir a cualquier sección del sistema.";
        mostrarResultadoJarvis(
            '🤖 Comandos Disponibles',
            '• <strong>Finanzas:</strong> "¿Cuál es mi saldo?", "Ver mis ingresos"<br>' +
            '• <strong>Inventario:</strong> "Ver inventario", "Nuevo producto", "Stock de [artículo]"<br>' +
            '• <strong>Notas:</strong> "Anota comprar repuestos", "Idea nueva estrategia"<br>' +
            '• <strong>Navegación:</strong> "Ir a inicio", "Ir a ejercicios", "Ver perfil"',
            null
        );
        hablarTextoJarvis(ayudaTxt);
        return;
    }

    // 10. FALLBACK: NO RECONOCIDO
    var respNoEntendido = `No reconocí el comando "${raw}". Puedes probar preguntando por tu saldo, tu inventario o dictar una nota diciendo "Anota...".`;
    mostrarResultadoJarvis(
        '❓ Comando no identificado',
        `No estoy seguro de qué acción realizar con: <em>"${raw}"</em>.<br>Intenta decir <strong>"¿Cuál es mi saldo?"</strong> o <strong>"Anota [tu idea]"</strong>.`,
        `<button class="btn-system" onclick="procesarComandoJarvis('ayuda')" style="font-size: 11.5px; padding: 6px 12px; background: #111827; color: #ffffff;">❓ Ver Ayuda y Comandos</button>`
    );
    hablarTextoJarvis(respNoEntendido);
}

// ==========================================================================
// ACCIONES ESPECÍFICAS DE MONARCA
// ==========================================================================

/**
 * Consulta y reporta el saldo y flujo neto de finanzas
 */
function consultarSaldoVoz() {
    if (!window.APP_STATE || !APP_STATE.finanzas) {
        mostrarResultadoJarvis("💰 Finanzas", "No hay datos de finanzas disponibles en este momento.", null);
        hablarTextoJarvis("No encontré información financiera registrada.");
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

    var descripcionTexto = `
        <strong>Saldo Disponible:</strong> <span style="font-size: 16px; font-weight: 800; color: ${saldoNeto >= 0 ? '#065f46' : '#991b1b'};">$${saldoNeto.toFixed(2)}</span><br>
        • Total Ingresos: <strong>$${totIngresos.toFixed(2)}</strong><br>
        • Total Gastos: <strong>$${totGastos.toFixed(2)}</strong>
    `;

    mostrarResultadoJarvis(
        '💰 Resumen de Finanzas',
        descripcionTexto,
        `<button class="btn-system" onclick="cerrarModalJarvisVoz(); cambiarVista('vista-finanzas');" style="font-size: 12px; padding: 7px 14px; background: #111827; color: #ffffff;">📊 Ir al Módulo de Finanzas</button>`
    );

    var locucion = `Tu saldo neto actual es de ${signo === '-' ? 'menos ' : ''}${saldoAbs} dólares. Has registrado ${totIngresos.toFixed(0)} en ingresos y ${totGastos.toFixed(0)} en gastos.`;
    hablarTextoJarvis(locucion);
}

/**
 * Consulta el stock de un producto específico por voz
 */
function consultarStockProductoVoz(busqueda) {
    if (!window.APP_STATE || !APP_STATE.inventario || !Array.isArray(APP_STATE.inventario.productos)) {
        hablarTextoJarvis("Tu catálogo de inventario está vacío.");
        return;
    }

    var prods = APP_STATE.inventario.productos;
    var q = normalizarTextoComando(busqueda);

    if (!q) {
        cerrarModalJarvisVoz();
        cambiarVista('vista-inventario');
        hablarTextoJarvis("Mostrando tu catálogo de inventario.");
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
            `No encontré productos que coincidan con <strong>"${busqueda}"</strong>.`,
            `<button class="btn-system" onclick="cerrarModalJarvisVoz(); cambiarVista('vista-inventario');" style="font-size: 12px; padding: 6px 12px; background: #111827; color: #ffffff;">📦 Ver Catálogo Completo</button>`
        );
        hablarTextoJarvis(`No encontré ningún producto que coincida con "${busqueda}".`);
        return;
    }

    var p = encontrados[0];
    var stock = Number(p.stock) || 0;
    var pVenta = Number(p.precioVenta != null ? p.precioVenta : (p.costo || 0));

    var detalleHtml = `
        <strong>${p.nombre}</strong><br>
        Existencias: <strong style="color: ${stock > 0 ? '#111827' : '#991b1b'};">${stock} unidades</strong> · Precio: <strong>$${pVenta.toFixed(2)}</strong>
    `;

    if (p.tieneVariantes && Array.isArray(p.variantes)) {
        detalleHtml += '<div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">';
        p.variantes.forEach(function(v) {
            detalleHtml += `<span class="variant-pill">${v.talla ? 'T: ' + v.talla : ''} ${v.color ? '· ' + v.color : ''}: ${v.stock}</span>`;
        });
        detalleHtml += '</div>';
    }

    mostrarResultadoJarvis(
        '📦 Consulta de Inventario',
        detalleHtml,
        `<button class="btn-system" onclick="cerrarModalJarvisVoz(); abrirModalRegistrarVenta('${p.id}');" style="font-size: 12px; padding: 6px 12px; background: #111827; color: #ffffff;">💵 Registrar Venta de este Producto</button>`
    );

    hablarTextoJarvis(`Tienes ${stock} unidades de ${p.nombre} en stock.`);
}

/**
 * Guarda una nota/idea dictada por voz en el banco de ideas
 */
function guardarNotaPorVoz(contenido) {
    if (!window.APP_STATE) window.APP_STATE = MonarcaDB.get();
    if (!APP_STATE.ideas) APP_STATE.ideas = [];

    var ahora = new Date();
    var dd = String(ahora.getDate()).padStart(2, '0');
    var mm = String(ahora.getMonth() + 1).padStart(2, '0');
    var fechaCorta = dd + "/" + mm;

    var nuevaIdea = {
        id: "IDEA-VOZ-" + Date.now(),
        texto: contenido + " (" + fechaCorta + ")",
        categoria: "💡 Ideas & Proyectos",
        subcategoria: "🎙️ Dictadas por Voz",
        contexto: "⚡ Jarvis Voz",
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
        `"${nuevaIdea.texto}"<br><span style="font-size: 11px; color: #6b7280;">Archivada en Ideas & Proyectos · Dictadas por Voz</span>`,
        `<button class="btn-system" onclick="cerrarModalJarvisVoz(); cambiarVista('vista-ideas');" style="font-size: 12px; padding: 6px 12px; background: #111827; color: #ffffff;">💡 Ir a Banco de Ideas</button>`
    );

    hablarTextoJarvis(`Anotado: "${contenido}". Guardada en tu banco de ideas.`);
}

/**
 * Navega a una vista por voz
 */
function navegarPorVoz(vistaId, nombreVista) {
    cerrarModalJarvisVoz();
    if (typeof cambiarVista === 'function') {
        cambiarVista(vistaId);
    }
    hablarTextoJarvis(`Abriendo ${nombreVista}.`);
}
