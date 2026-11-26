/**
 * SISTEMA MONARCA · MÓDULO DE BANCO DE IDEAS
 * 5 Categorías, Subcategorías, Contextos, Checklist Operativo y Métricas Mensuales.
 */

var ESTRUCTURA_BANCO_IDEAS = {
    "✨ Emily": {
        icono: "✨",
        color: "#38bdf8",
        descripcion: "Ideas de programación, nuevas funciones y mejoras de la app",
        subcategorias: [
            "💻 Programación & Nuevas Funciones",
            "🎨 Diseño, Interfaz & Experiencia (UI/UX)",
            "🧠 Módulos IA & Automatizaciones",
            "⚡ Optimización & Rendimiento",
            "🐛 Correcciones de Errores & Bugs",
            "🚀 Roadmap & Próximas Versiones"
        ]
    },
    "💡 Ideas & Proyectos": {
        icono: "💡",
        color: "#fbbf24",
        descripcion: "Filosofía, emprendimiento, mentalidad y dinámicas",
        subcategorias: [
            "🧠 Filosofía, Mentalidad y Enfoque",
            "💬 Interacción Social y Dinámicas Personales",
            "🚀 Emprendimiento, Negocios y Nuevas Apps",
            "📜 Citas Célebres & Principios Rectores"
        ]
    },
    "🛒 Compras & Deseos": {
        icono: "🛒",
        color: "#f43f5e",
        descripcion: "Adquisiciones, tecnología, ropa, libros y hogar",
        subcategorias: [
            "👕 Ropa, Calzado y Accesorios",
            "🖥️ Tecnología, Hardware y Electrónica",
            "🏍️ Moto, Repuestos y Mantenimiento",
            "📚 Libros, Cursos y Material de Estudio",
            "🧴 Cuidado Personal y Barbería",
            "🏠 Hogar, Comida y Supermercado"
        ]
    },
    "📊 Planes & Metas": {
        icono: "📊",
        color: "#10b981",
        descripcion: "Metas de carrera, finanzas personales y hábitos",
        subcategorias: [
            "👤 Crecimiento Personal, Hábitos y Rutina",
            "💼 Trabajo, Programación y Carrera Profesional",
            "💰 Metas Financieras, Inversiones y Ahorro"
        ]
    },
    "📚 Base de Conocimientos": {
        icono: "📚",
        color: "#818cf8",
        descripcion: "Documentación, técnicas, psicología y aprendizajes",
        subcategorias: [
            "💈 Oficio, Barbería & Técnicas Manuales",
            "💻 Programación, Algoritmos y Arquitectura Web",
            "♟️ Psicología Oscura, Lenguaje No Verbal y Estrategia",
            "📖 Resúmenes de Lecturas y Aprendizajes Clave"
        ]
    },
    "✅ Tareas Operativas": {
        icono: "✅",
        color: "#34d399",
        descripcion: "Pendientes diarios en casa, calle y labores de flujo",
        subcategorias: [
            "🏠 En Casa (Organización y Espacio)",
            "🛣️ En la Calle (Trámites, Mandados y Compras)",
            "💼 En el Trabajo (Pendientes de Flujo Diario)"
        ]
    }
};

var ESTADO_IDEAS = {
    subvistaActual: "categorias", // 'categorias', 'detalle', 'operatividad'
    categoriaSeleccionada: null,
    mesOperatividadOffset: 0,
    graficoChartInstance: null,
    inicializado: false
};

var AUTOPC_SOLICITUDES_MAP = {};
var AUTOPC_TELEMETRIA_PC = null;
var AUTOPC_PLAN_DECISION_DOC = null;
var AUTOPC_PLAN_DECISION_LOCAL = {};
var AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID = '';
var AUTOPC_MQTT_QUEUE_SNAPSHOT = null;
var AUTOPC_MQTT_PRESENCE = null;
var AUTOPC_MQTT_PROCESSED_EVENTS = {};

function esCategoriaEmily(cat) {
    return Boolean(cat && String(cat).toLowerCase().includes('emily'));
}

function escapeHtmlIdea(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function obtenerTextoPromptLimpio(texto) {
    var raw = String(texto || '').trim();
    var limpio = raw.replace(/\s*\([0-9]+\/[0-9]+\)\s*$/, '').trim();
    return limpio || raw;
}

function obtenerPromptParaAutoPC(idea) {
    if (!idea) return '';
    var savedPrompt = String(idea.textoPrompt || '').trim();
    if (savedPrompt) return savedPrompt;
    return obtenerTextoPromptLimpio(idea.texto || '');
}

function obtenerEstadoAutoPCIdea(idea) {
    if (!idea) return null;
    var remoto = AUTOPC_SOLICITUDES_MAP[String(idea.id)];
    if (remoto && remoto.status) {
        return String(remoto.status).toLowerCase();
    }
    if (idea.autopcStatus) {
        return String(idea.autopcStatus).toLowerCase();
    }
    if (idea.autopcPendienteSubida) {
        return 'pending';
    }
    return null;
}

// ==========================================================================
// 🖼️ GESTIÓN DE IMÁGENES / CAPTURAS EN IDEAS (Cámara, Galería, Portapapeles)
// ==========================================================================

var IDEAS_IMG_DB_NAME = 'monarca_ideas_media_v1';
var IDEAS_IMG_STORE = 'imagenes';
var IDEAS_IMAGENES_MEM_CACHE = {};
var IDEAS_IMAGENES_RECORDS_MEM = {};
var IDEAS_IMAGENES_FETCHING = {};
var IDEAS_IMAGEN_BORRADORES = { principal: null, asistente: null };
var IDEAS_VISOR_ACTUAL = null;
var IDEAS_ADJUNTOS_VINCULADOS = { principal: false, asistente: false };

var IDEAS_CONTEXT_ELEMENT_MAP = {
    principal: {
        cameraInputId: 'idea-img-camera-input',
        galleryInputId: 'idea-img-gallery-input',
        previewWrapId: 'idea-img-preview-wrap',
        previewThumbId: 'idea-img-preview-thumb',
        previewNameId: 'idea-img-preview-name',
        previewMetaId: 'idea-img-preview-meta',
        textInputId: 'input-nueva-idea',
        dropBoxId: 'box-adjunto-imagen-idea'
    },
    asistente: {
        cameraInputId: 'asistente-idea-img-camera-input',
        galleryInputId: 'asistente-idea-img-gallery-input',
        previewWrapId: 'asistente-idea-img-preview-wrap',
        previewThumbId: 'asistente-idea-img-preview-thumb',
        previewNameId: 'asistente-idea-img-preview-name',
        previewMetaId: 'asistente-idea-img-preview-meta',
        textInputId: 'asistente-idea-nombre',
        dropBoxId: 'box-adjunto-imagen-asistente'
    }
};

function abrirIndexedDBIdeasMedia() {
    return new Promise(function(resolve) {
        if (typeof indexedDB === 'undefined') {
            resolve(null);
            return;
        }
        try {
            var req = indexedDB.open(IDEAS_IMG_DB_NAME, 1);
            req.onupgradeneeded = function(e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains(IDEAS_IMG_STORE)) {
                    db.createObjectStore(IDEAS_IMG_STORE, { keyPath: 'id' });
                }
            };
            req.onsuccess = function(e) { resolve(e.target.result); };
            req.onerror = function() { resolve(null); };
        } catch (err) {
            resolve(null);
        }
    });
}

async function guardarImagenIndexedDB(record) {
    if (!record || !record.id) return false;
    try {
        var db = await abrirIndexedDBIdeasMedia();
        if (!db) return false;
        return await new Promise(function(resolve) {
            try {
                var tx = db.transaction([IDEAS_IMG_STORE], 'readwrite');
                var store = tx.objectStore(IDEAS_IMG_STORE);
                store.put(record);
                tx.oncomplete = function() { resolve(true); };
                tx.onerror = function() { resolve(false); };
            } catch (e) {
                resolve(false);
            }
        });
    } catch (e) {
        return false;
    }
}

async function leerImagenIndexedDB(imagenId) {
    if (!imagenId) return null;
    try {
        var db = await abrirIndexedDBIdeasMedia();
        if (!db) return null;
        return await new Promise(function(resolve) {
            try {
                var tx = db.transaction([IDEAS_IMG_STORE], 'readonly');
                var req = tx.objectStore(IDEAS_IMG_STORE).get(String(imagenId));
                req.onsuccess = function(e) { resolve(e.target.result || null); };
                req.onerror = function() { resolve(null); };
            } catch (e) {
                resolve(null);
            }
        });
    } catch (e) {
        return null;
    }
}

async function eliminarImagenIndexedDB(imagenId) {
    if (!imagenId) return false;
    try {
        var db = await abrirIndexedDBIdeasMedia();
        if (!db) return false;
        return await new Promise(function(resolve) {
            try {
                var tx = db.transaction([IDEAS_IMG_STORE], 'readwrite');
                tx.objectStore(IDEAS_IMG_STORE).delete(String(imagenId));
                tx.oncomplete = function() { resolve(true); };
                tx.onerror = function() { resolve(false); };
            } catch (e) {
                resolve(false);
            }
        });
    } catch (e) {
        return false;
    }
}

function formatearTamanoImagen(bytes) {
    var n = Number(bytes) || 0;
    if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
    if (n >= 1024) return Math.round(n / 1024) + ' KB';
    return n + ' B';
}

function leerFileComoDataUrlFallback(blob) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(String((e && e.target && e.target.result) || '')); };
        reader.onerror = function() { reject(new Error('No se pudo leer el archivo de imagen.')); };
        reader.readAsDataURL(blob);
    });
}

function cargarElementoImagenDesdeBlob(blob) {
    return new Promise(function(resolve, reject) {
        var objectUrl = null;
        try {
            if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
                objectUrl = URL.createObjectURL(blob);
            }
        } catch (ig) {}

        var img = new Image();
        img.onload = function() {
            if (objectUrl) {
                try { URL.revokeObjectURL(objectUrl); } catch (ig) {}
            }
            resolve(img);
        };
        img.onerror = function() {
            if (objectUrl) {
                try { URL.revokeObjectURL(objectUrl); } catch (ig) {}
            }
            leerFileComoDataUrlFallback(blob).then(function(srcUrl) {
                var fallbackImg = new Image();
                fallbackImg.onload = function() { resolve(fallbackImg); };
                fallbackImg.onerror = function() { reject(new Error('Formato de imagen no compatible.')); };
                fallbackImg.src = srcUrl;
            }).catch(reject);
        };
        if (objectUrl) {
            img.src = objectUrl;
        } else {
            leerFileComoDataUrlFallback(blob).then(function(srcUrl) {
                img.src = srcUrl;
            }).catch(reject);
        }
    });
}

async function comprimirImagenParaIdea(fileOrBlob, fallbackName) {
    if (!fileOrBlob) throw new Error('Archivo vacío');
    var rawName = (fileOrBlob.name || fallbackName || ('captura_' + Date.now() + '.png')).trim();
    var srcMime = String(fileOrBlob.type || '').toLowerCase();
    var img = await cargarElementoImagenDesdeBlob(fileOrBlob);
    var origW = img.naturalWidth || img.width || 1024;
    var origH = img.naturalHeight || img.height || 1024;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible para procesar imagen');

    function renderToDataUrl(maxDim, mime, quality) {
        var scale = Math.min(1, maxDim / Math.max(origW, origH));
        var w = Math.max(1, Math.round(origW * scale));
        var h = Math.max(1, Math.round(origH * scale));
        canvas.width = w;
        canvas.height = h;
        if (mime === 'image/jpeg') {
            ctx.fillStyle = '#0b0f1a';
            ctx.fillRect(0, 0, w, h);
        } else {
            ctx.clearRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);
        var url = (typeof quality === 'number') ? canvas.toDataURL(mime, quality) : canvas.toDataURL(mime);
        return { dataUrl: url, width: w, height: h };
    }

    var MAX_SAFE_CHARS = 680000;
    var elegido = null;

    // Si es captura PNG limpia, intentar mantener nitidez PNG cuando sea liviana
    if (srcMime === 'image/png') {
        var pngTry = renderToDataUrl(1600, 'image/png');
        if (pngTry.dataUrl && pngTry.dataUrl.length <= 460000) {
            elegido = {
                dataUrl: pngTry.dataUrl,
                mimeType: 'image/png',
                width: pngTry.width,
                height: pngTry.height
            };
        }
    }

    if (!elegido) {
        var soportaWebp = false;
        try {
            var testCanvas = document.createElement('canvas');
            testCanvas.width = 2;
            testCanvas.height = 2;
            soportaWebp = testCanvas.toDataURL('image/webp', 0.8).indexOf('data:image/webp') === 0;
        } catch (ig) {}

        var mimePreferido = soportaWebp ? 'image/webp' : 'image/jpeg';
        var pasos = [
            { dim: 1600, q: 0.86 },
            { dim: 1440, q: 0.76 },
            { dim: 1200, q: 0.68 },
            { dim: 960, q: 0.58 },
            { dim: 760, q: 0.50 }
        ];
        for (var i = 0; i < pasos.length; i++) {
            var intento = renderToDataUrl(pasos[i].dim, mimePreferido, pasos[i].q);
            elegido = {
                dataUrl: intento.dataUrl,
                mimeType: (intento.dataUrl.indexOf('data:image/webp') === 0) ? 'image/webp' : 'image/jpeg',
                width: intento.width,
                height: intento.height
            };
            if (intento.dataUrl.length <= MAX_SAFE_CHARS) {
                break;
            }
        }
    }

    var ext = elegido.mimeType === 'image/png' ? 'png' : (elegido.mimeType === 'image/webp' ? 'webp' : 'jpg');
    var baseName = rawName.replace(/\.[a-zA-Z0-9]{1,5}$/, '') || ('captura_' + Date.now());
    var cleanFileName = baseName + '.' + ext;
    var approxBytes = Math.round((elegido.dataUrl.length - elegido.dataUrl.indexOf(',') - 1) * 0.75);

    return {
        dataUrl: elegido.dataUrl,
        mimeType: elegido.mimeType,
        fileName: cleanFileName,
        width: elegido.width,
        height: elegido.height,
        sizeBytes: Math.max(0, approxBytes)
    };
}

function renderizarPreviewBorradorIdea(ctxKey) {
    var map = IDEAS_CONTEXT_ELEMENT_MAP[ctxKey];
    if (!map) return;
    var wrap = document.getElementById(map.previewWrapId);
    var thumb = document.getElementById(map.previewThumbId);
    var nameEl = document.getElementById(map.previewNameId);
    var metaEl = document.getElementById(map.previewMetaId);
    if (!wrap) return;

    var borrador = IDEAS_IMAGEN_BORRADORES[ctxKey];
    if (!borrador || !borrador.dataUrl) {
        wrap.style.display = 'none';
        if (thumb) thumb.src = '';
        return;
    }

    if (thumb) thumb.src = borrador.dataUrl;
    if (nameEl) nameEl.innerText = borrador.fileName || 'imagen.jpg';
    if (metaEl) {
        metaEl.innerText = (borrador.width && borrador.height ? (borrador.width + '×' + borrador.height + ' · ') : '')
            + formatearTamanoImagen(borrador.sizeBytes);
    }
    wrap.style.display = 'flex';
}

function limpiarImagenBorradorIdea(ctxKey) {
    var clave = (ctxKey === 'asistente') ? 'asistente' : 'principal';
    IDEAS_IMAGEN_BORRADORES[clave] = null;
    var map = IDEAS_CONTEXT_ELEMENT_MAP[clave];
    if (map) {
        var cam = document.getElementById(map.cameraInputId);
        var gal = document.getElementById(map.galleryInputId);
        if (cam) cam.value = '';
        if (gal) gal.value = '';
    }
    renderizarPreviewBorradorIdea(clave);
}

function obtenerImagenBorradorIdea(ctxKey) {
    var clave = (ctxKey === 'asistente') ? 'asistente' : 'principal';
    return IDEAS_IMAGEN_BORRADORES[clave] || null;
}

function seleccionarImagenIdea(ctxKey, modo) {
    var clave = (ctxKey === 'asistente') ? 'asistente' : 'principal';
    var map = IDEAS_CONTEXT_ELEMENT_MAP[clave];
    if (!map) return;
    var inputId = (modo === 'camera') ? map.cameraInputId : map.galleryInputId;
    var inputEl = document.getElementById(inputId);
    if (!inputEl) return;
    inputEl.value = '';
    inputEl.click();
}

async function procesarArchivoImagenBorrador(ctxKey, fileOrBlob, origenEtiqueta) {
    var clave = (ctxKey === 'asistente') ? 'asistente' : 'principal';
    try {
        var procesada = await comprimirImagenParaIdea(fileOrBlob);
        IDEAS_IMAGEN_BORRADORES[clave] = procesada;
        renderizarPreviewBorradorIdea(clave);
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca(origenEtiqueta || 'Imagen lista para adjuntar', '🖼️');
        }
        return procesada;
    } catch (err) {
        console.warn('[Ideas Imagen] Error procesando imagen:', err);
        alert('No se pudo procesar la imagen seleccionada. Prueba con otra foto o captura.');
        return null;
    }
}

function manejarArchivoImagenIdea(ctxKey, inputEl) {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
    var archivo = inputEl.files[0];
    procesarArchivoImagenBorrador(ctxKey, archivo, 'Imagen adjunta lista').finally(function() {
        try { inputEl.value = ''; } catch (ig) {}
    });
}

async function pegarImagenDesdePortapapelesIdea(ctxKey) {
    var clave = (ctxKey === 'asistente') ? 'asistente' : 'principal';
    if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
        try {
            var clipItems = await navigator.clipboard.read();
            for (var i = 0; i < clipItems.length; i++) {
                var types = clipItems[i].types || [];
                var imgType = types.find(function(t) { return t.indexOf('image/') === 0; });
                if (imgType) {
                    var blob = await clipItems[i].getType(imgType);
                    if (blob) {
                        await procesarArchivoImagenBorrador(clave, blob, 'Captura pegada del portapapeles');
                        return true;
                    }
                }
            }
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca('No hay imagen en el portapapeles; elige Galería o Foto', '📋');
            }
            return false;
        } catch (err) {
            console.warn('[Ideas Portapapeles] Permiso o API no disponible:', err);
        }
    }
    var map = IDEAS_CONTEXT_ELEMENT_MAP[clave];
    var txtEl = map ? document.getElementById(map.textInputId) : null;
    if (txtEl) txtEl.focus();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Presiona Ctrl+V en el campo o usa Galería / Captura', '📋');
    }
    return false;
}

function vincularEventosAdjuntoImagen(ctxKey) {
    var clave = (ctxKey === 'asistente') ? 'asistente' : 'principal';
    if (IDEAS_ADJUNTOS_VINCULADOS[clave]) return;
    var map = IDEAS_CONTEXT_ELEMENT_MAP[clave];
    if (!map) return;

    var textEl = document.getElementById(map.textInputId);
    var dropBox = document.getElementById(map.dropBoxId);
    if (!textEl && !dropBox) return;
    IDEAS_ADJUNTOS_VINCULADOS[clave] = true;

    function onPasteHandler(e) {
        var cd = e && e.clipboardData;
        if (!cd || !cd.items) return;
        for (var i = 0; i < cd.items.length; i++) {
            var item = cd.items[i];
            if (item && item.type && item.type.indexOf('image/') === 0) {
                var blob = item.getAsFile();
                if (blob) {
                    e.preventDefault();
                    procesarArchivoImagenBorrador(clave, blob, 'Captura pegada con Ctrl+V');
                    return;
                }
            }
        }
    }

    if (textEl) textEl.addEventListener('paste', onPasteHandler);
    if (dropBox) {
        dropBox.addEventListener('paste', onPasteHandler);
        dropBox.addEventListener('dragover', function(e) {
            e.preventDefault();
            dropBox.classList.add('is-dragover');
        });
        dropBox.addEventListener('dragleave', function() {
            dropBox.classList.remove('is-dragover');
        });
        dropBox.addEventListener('drop', function(e) {
            e.preventDefault();
            dropBox.classList.remove('is-dragover');
            var files = e.dataTransfer && e.dataTransfer.files;
            if (files && files[0] && String(files[0].type || '').indexOf('image/') === 0) {
                procesarArchivoImagenBorrador(clave, files[0], 'Imagen adjunta al soltar');
            }
        });
    }
}

function guardarImagenIdeaAdjunta(ideaObj, imagenAdjunta, subirEnSegundoPlano) {
    if (!ideaObj || !ideaObj.imagenId || !imagenAdjunta || !imagenAdjunta.dataUrl) {
        return Promise.resolve(null);
    }
    var imagenId = String(ideaObj.imagenId);
    var record = {
        id: imagenId,
        ideaId: String(ideaObj.id),
        dataUrl: imagenAdjunta.dataUrl,
        mimeType: imagenAdjunta.mimeType || 'image/jpeg',
        fileName: imagenAdjunta.fileName || 'captura.png',
        width: Number(imagenAdjunta.width) || 0,
        height: Number(imagenAdjunta.height) || 0,
        sizeBytes: Number(imagenAdjunta.sizeBytes) || imagenAdjunta.dataUrl.length,
        updatedAt: Date.now(),
        synced: false
    };
    IDEAS_IMAGENES_MEM_CACHE[imagenId] = record.dataUrl;
    IDEAS_IMAGENES_RECORDS_MEM[imagenId] = record;

    var pLocal = guardarImagenIndexedDB(record);
    if (subirEnSegundoPlano && window.MonarcaCloud && typeof window.MonarcaCloud.subirImagenIdea === 'function') {
        pLocal.then(function() {
            return window.MonarcaCloud.subirImagenIdea(record);
        }).then(function() {
            record.synced = true;
            guardarImagenIndexedDB(record);
            if (ideaObj) {
                ideaObj.imagenPendienteSubida = false;
                if (typeof MonarcaDB !== 'undefined' && typeof APP_STATE !== 'undefined') {
                    MonarcaDB.save(APP_STATE, false);
                }
            }
        }).catch(function(err) {
            console.warn('[Ideas Imagen] Subida diferida en segundo plano:', err);
        });
    }
    return pLocal.then(function() { return record; });
}

async function asegurarImagenIdeaEnNube(idea) {
    if (!idea || !idea.tieneImagen || !idea.imagenId) return true;
    var imagenId = String(idea.imagenId);
    if (!window.MonarcaCloud || typeof window.MonarcaCloud.subirImagenIdea !== 'function') {
        throw new Error('Firebase Cloud no disponible');
    }

    var record = IDEAS_IMAGENES_RECORDS_MEM[imagenId] || null;
    if (!record || !record.dataUrl) {
        record = await leerImagenIndexedDB(imagenId);
        if (record && record.dataUrl) {
            IDEAS_IMAGENES_RECORDS_MEM[imagenId] = record;
            IDEAS_IMAGENES_MEM_CACHE[imagenId] = record.dataUrl;
        }
    }

    if (record && record.dataUrl) {
        await window.MonarcaCloud.subirImagenIdea(record);
        record.synced = true;
        await guardarImagenIndexedDB(record);
        idea.imagenPendienteSubida = false;
        return true;
    }

    // Si se programó desde otro dispositivo distinto al que la creó, validar que ya exista en la nube
    if (typeof window.MonarcaCloud.obtenerImagenIdea === 'function') {
        var remoto = await window.MonarcaCloud.obtenerImagenIdea(imagenId);
        if (remoto && remoto.dataUrl) {
            IDEAS_IMAGENES_RECORDS_MEM[imagenId] = Object.assign({ synced: true }, remoto);
            IDEAS_IMAGENES_MEM_CACHE[imagenId] = remoto.dataUrl;
            await guardarImagenIndexedDB(IDEAS_IMAGENES_RECORDS_MEM[imagenId]);
            idea.imagenPendienteSubida = false;
            return true;
        }
    }
    throw new Error('No se encontró la imagen local ni en la nube para ' + imagenId);
}

async function cargarImagenIdeaDataUrl(imagenId) {
    if (!imagenId) return null;
    var key = String(imagenId);
    if (IDEAS_IMAGENES_MEM_CACHE[key]) {
        return IDEAS_IMAGENES_MEM_CACHE[key];
    }
    if (IDEAS_IMAGENES_FETCHING[key]) {
        return IDEAS_IMAGENES_FETCHING[key];
    }

    IDEAS_IMAGENES_FETCHING[key] = (async function() {
        try {
            var localRec = await leerImagenIndexedDB(key);
            if (localRec && localRec.dataUrl) {
                IDEAS_IMAGENES_RECORDS_MEM[key] = localRec;
                IDEAS_IMAGENES_MEM_CACHE[key] = localRec.dataUrl;
                return localRec.dataUrl;
            }
            if (window.MonarcaCloud && typeof window.MonarcaCloud.obtenerImagenIdea === 'function') {
                var remoto = await window.MonarcaCloud.obtenerImagenIdea(key);
                if (remoto && remoto.dataUrl) {
                    var cacheRec = Object.assign({ synced: true }, remoto);
                    IDEAS_IMAGENES_RECORDS_MEM[key] = cacheRec;
                    IDEAS_IMAGENES_MEM_CACHE[key] = remoto.dataUrl;
                    guardarImagenIndexedDB(cacheRec);
                    return remoto.dataUrl;
                }
            }
            return null;
        } catch (err) {
            console.warn('[Ideas Imagen] Error cargando imagen ' + key + ':', err);
            return null;
        } finally {
            delete IDEAS_IMAGENES_FETCHING[key];
        }
    })();

    return IDEAS_IMAGENES_FETCHING[key];
}

function hidratarImagenesIdeasEnDOM() {
    var imgs = document.querySelectorAll('img[data-idea-img-id]');
    imgs.forEach(function(imgEl) {
        var imgId = imgEl.getAttribute('data-idea-img-id');
        if (!imgId) return;
        var cached = IDEAS_IMAGENES_MEM_CACHE[imgId];
        if (cached) {
            if (imgEl.getAttribute('src') !== cached) imgEl.src = cached;
            return;
        }
        cargarImagenIdeaDataUrl(imgId).then(function(url) {
            if (!url) return;
            var actual = document.querySelectorAll('img[data-idea-img-id="' + imgId.replace(/"/g, '\\"') + '"]');
            actual.forEach(function(el) {
                el.src = url;
            });
        });
    });
}

function renderizarMiniaturaImagenIdeaHtml(idea) {
    if (!idea || !idea.tieneImagen || !idea.imagenId) return '';
    var imgIdEsc = escapeHtmlIdea(String(idea.imagenId));
    var ideaIdEsc = escapeHtmlIdea(String(idea.id));
    var cached = IDEAS_IMAGENES_MEM_CACHE[String(idea.imagenId)] || '';
    var safeSrc = cached ? escapeHtmlIdea(cached) : '';
    return `
        <div class="idea-card-media-row">
            <button type="button" class="btn-idea-card-thumb" onclick="abrirVisorImagenIdea('${ideaIdEsc}', '${imgIdEsc}')" title="Ver imagen / captura adjunta">
                <img class="idea-card-thumb-img" data-idea-img-id="${imgIdEsc}" src="${safeSrc}" alt="Miniatura adjunta">
                <span>🖼️ Ver imagen adjunta</span>
            </button>
        </div>
    `;
}

async function abrirVisorImagenIdea(ideaId, imagenId) {
    var modal = document.getElementById('modal-visor-imagen-idea');
    var imgEl = document.getElementById('visor-imagen-idea-img');
    var titEl = document.getElementById('visor-imagen-idea-titulo');
    var metaEl = document.getElementById('visor-imagen-idea-meta');
    if (!modal || !imgEl) return;

    var idea = (APP_STATE && Array.isArray(APP_STATE.ideas))
        ? APP_STATE.ideas.find(function(i) { return String(i.id) === String(ideaId); })
        : null;

    var titulo = idea ? obtenerPromptParaAutoPC(idea) : 'Captura de Idea';
    if (titEl) titEl.innerText = titulo;
    if (metaEl) metaEl.innerText = 'Cargando imagen...';
    imgEl.src = IDEAS_IMAGENES_MEM_CACHE[String(imagenId)] || '';
    IDEAS_VISOR_ACTUAL = {
        imagenId: String(imagenId),
        fileName: (idea && idea.imagenNombre) ? idea.imagenNombre : 'captura-idea.png',
        dataUrl: imgEl.src || ''
    };
    modal.style.display = 'flex';

    var dataUrl = await cargarImagenIdeaDataUrl(imagenId);
    if (!IDEAS_VISOR_ACTUAL || IDEAS_VISOR_ACTUAL.imagenId !== String(imagenId)) return;
    if (dataUrl) {
        imgEl.src = dataUrl;
        IDEAS_VISOR_ACTUAL.dataUrl = dataUrl;
        var rec = IDEAS_IMAGENES_RECORDS_MEM[String(imagenId)];
        var dims = (idea && idea.imagenWidth && idea.imagenHeight)
            ? (idea.imagenWidth + '×' + idea.imagenHeight)
            : (rec && rec.width && rec.height ? (rec.width + '×' + rec.height) : '');
        var sz = rec && rec.sizeBytes ? formatearTamanoImagen(rec.sizeBytes) : formatearTamanoImagen(Math.round(dataUrl.length * 0.75));
        if (metaEl) metaEl.innerText = (IDEAS_VISOR_ACTUAL.fileName || 'imagen') + (dims ? (' · ' + dims) : '') + ' · ' + sz;
    } else if (metaEl) {
        metaEl.innerText = 'No se pudo cargar la imagen (sin conexión o eliminada).';
    }
}

function cerrarVisorImagenIdea() {
    var modal = document.getElementById('modal-visor-imagen-idea');
    var imgEl = document.getElementById('visor-imagen-idea-img');
    if (modal) modal.style.display = 'none';
    if (imgEl) imgEl.src = '';
    IDEAS_VISOR_ACTUAL = null;
}

function descargarImagenVisorIdea() {
    if (!IDEAS_VISOR_ACTUAL || !IDEAS_VISOR_ACTUAL.dataUrl) {
        alert('La imagen aún se está cargando.');
        return;
    }
    var a = document.createElement('a');
    a.href = IDEAS_VISOR_ACTUAL.dataUrl;
    a.download = IDEAS_VISOR_ACTUAL.fileName || 'captura-idea.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function eliminarImagenIdeaCompleta(imagenId) {
    if (!imagenId) return;
    var key = String(imagenId);
    delete IDEAS_IMAGENES_MEM_CACHE[key];
    delete IDEAS_IMAGENES_RECORDS_MEM[key];
    eliminarImagenIndexedDB(key);
    if (window.MonarcaCloud && typeof window.MonarcaCloud.eliminarImagenIdea === 'function') {
        window.MonarcaCloud.eliminarImagenIdea(key).catch(function(err) {
            console.warn('[Ideas Imagen] No se pudo borrar imagen remota:', err);
        });
    }
}

function inicializarBancoDeIdeas() {
    if (ESTADO_IDEAS.inicializado) return;

    var catSelect = document.getElementById('select-categoria-idea');
    if (catSelect) {
        catSelect.value = "✨ Emily";
        alCambiarCategoriaIdea();
    }

    var input = document.getElementById('input-nueva-idea');
    if (input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                guardarNuevaIdea();
            }
        });
    }

    vincularEventosAdjuntoImagen('principal');
    vincularEventosAdjuntoImagen('asistente');

    ESTADO_IDEAS.inicializado = true;
    renderizarBancoIdeas(APP_STATE.ideas);
}

function alCambiarCategoriaIdea() {
    var catSelect = document.getElementById('select-categoria-idea');
    var subcatSelect = document.getElementById('select-subcategoria-idea');
    if (!catSelect || !subcatSelect) return;

    var cat = catSelect.value;
    var esEmily = esCategoriaEmily(cat);
    var info = ESTRUCTURA_BANCO_IDEAS[cat];
    if (!info && esEmily) {
        info = ESTRUCTURA_BANCO_IDEAS["✨ Emily"];
    }

    subcatSelect.innerHTML = '';
    if (info && info.subcategorias) {
        info.subcategorias.forEach(function(sub) {
            var opt = document.createElement('option');
            opt.value = sub;
            opt.innerText = sub;
            subcatSelect.appendChild(opt);
        });
    }

    if (typeof actualizarVisibilidadOpcionAutoPC === 'function') {
        actualizarVisibilidadOpcionAutoPC(cat, 'box-opcion-autopc-idea', 'chk-idea-programar-ahora');
    } else {
        var boxAutoPC = document.getElementById('box-opcion-autopc-idea');
        var chkAutoPC = document.getElementById('chk-idea-programar-ahora');
        if (boxAutoPC) {
            boxAutoPC.style.display = esEmily ? 'block' : 'none';
        }
        if (chkAutoPC) {
            chkAutoPC.checked = esEmily;
        }
    }
}

function seleccionarContextoIdea(contexto) {
    // Deprecado: contexto eliminado a petición del usuario
}

function cargarIdeas() {
    renderizarBancoIdeas(APP_STATE.ideas);
}

function renderizarBancoIdeas(ideas) {
    actualizarBadgesIdeas();

    if (ESTADO_IDEAS.subvistaActual === 'categorias') {
        mostrarVistaCategoriasGrid();
    } else if (ESTADO_IDEAS.subvistaActual === 'detalle') {
        abrirDetalleCategoriaIdeas(ESTADO_IDEAS.categoriaSeleccionada);
    } else if (ESTADO_IDEAS.subvistaActual === 'operatividad') {
        mostrarVistaOperatividad();
    }
}

function obtenerFechaObjetivoMes() {
    var fecha = new Date();
    fecha.setMonth(fecha.getMonth() + (ESTADO_IDEAS.mesOperatividadOffset || 0));
    return fecha;
}

function esIdeaDelMes(idea, fechaObjetivo) {
    if (!idea || !idea.hecha) return false;
    var d = null;
    if (idea.timestampHecha) {
        d = new Date(idea.timestampHecha);
    } else if (idea.fechaHecha) {
        var cleanStr = String(idea.fechaHecha).trim();
        var parts = cleanStr.split(" ")[0].split("/");
        if (parts.length === 3) {
            d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
    }
    if (!d && idea.fecha && idea.fecha.includes('/')) {
        var p = idea.fecha.split('/');
        if (p.length >= 2) {
            var mNum = parseInt(p[1].trim(), 10) - 1;
            var dNum = parseInt(p[0].trim(), 10);
            d = new Date(fechaObjetivo.getFullYear(), mNum, dNum);
        }
    }
    if (!d || isNaN(d.getTime())) {
        d = new Date();
    }
    return (d.getMonth() === fechaObjetivo.getMonth() && d.getFullYear() === fechaObjetivo.getFullYear());
}

function actualizarBadgesIdeas() {
    var ideas = APP_STATE.ideas || [];
    var pendientes = ideas.filter(function(i) { return !i.hecha; }).length;

    var fechaActual = obtenerFechaObjetivoMes();
    var hechasMes = ideas.filter(function(i) {
        return i.hecha && esIdeaDelMes(i, fechaActual);
    }).length;

    var badgePen = document.getElementById('badge-total-pendientes');
    var badgeOpe = document.getElementById('badge-total-hechas-mes');
    if (badgePen) badgePen.innerText = pendientes;
    if (badgeOpe) badgeOpe.innerText = hechasMes;
}

function alternarSubvistaIdeas(vista) {
    ESTADO_IDEAS.subvistaActual = vista;
    var btnCat = document.getElementById('btn-tab-categorias');
    var btnOpe = document.getElementById('btn-tab-operatividad');

    if (vista === 'categorias') {
        if (btnCat) btnCat.classList.add('active');
        if (btnOpe) btnOpe.classList.remove('active');
        mostrarVistaCategoriasGrid();
    } else if (vista === 'operatividad') {
        if (btnOpe) btnOpe.classList.add('active');
        if (btnCat) btnCat.classList.remove('active');
        mostrarVistaOperatividad();
    }
}

function mostrarVistaCategoriasGrid() {
    ESTADO_IDEAS.subvistaActual = 'categorias';

    var gridCont = document.getElementById('vista-ideas-categorias-grid');
    var detalleCont = document.getElementById('vista-ideas-categoria-detalle');
    var opCont = document.getElementById('vista-ideas-operatividad');

    if (gridCont) gridCont.style.display = 'block';
    if (detalleCont) detalleCont.style.display = 'none';
    if (opCont) opCont.style.display = 'none';

    var btnCat = document.getElementById('btn-tab-categorias');
    var btnOpe = document.getElementById('btn-tab-operatividad');
    if (btnCat) btnCat.classList.add('active');
    if (btnOpe) btnOpe.classList.remove('active');

    var contenedor = document.getElementById('contenedor-grid-categorias');
    if (!contenedor) return;

    var ideas = APP_STATE.ideas || [];
    var html = '';

    Object.keys(ESTRUCTURA_BANCO_IDEAS).forEach(function(catNombre) {
        var info = ESTRUCTURA_BANCO_IDEAS[catNombre];
        var pendientesCat = ideas.filter(function(i) {
            return !i.hecha && (i.categoria === catNombre || (esCategoriaEmily(catNombre) && esCategoriaEmily(i.categoria)));
        }).length;

        var esEmily = esCategoriaEmily(catNombre);
        var enColaPC = esEmily ? ideas.filter(function(i) {
            if (!i || i.hecha || !esCategoriaEmily(i.categoria)) return false;
            var st = obtenerEstadoAutoPCIdea(i);
            return st === 'pending' || st === 'running';
        }).length : 0;

        var cardClass = esEmily ? 'category-card category-card-emily' : 'category-card';
        var tituloLimpio = catNombre.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}✨✦🤖💡🛒📊📚✅\s]+/u, '').trim();
        if (!tituloLimpio) tituloLimpio = catNombre;

        html += `
        <div class="${cardClass}" onclick="abrirDetalleCategoriaIdeas('${catNombre}')">
            <div class="category-card-header">
                <span class="category-card-icon ${esEmily ? 'icon-emily' : ''}">${info.icono || '💡'}</span>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="category-card-title">${tituloLimpio}</span>
                        ${esEmily ? '<span class="badge-emily-core">APP & CORE</span>' : ''}
                    </div>
                    ${info.descripcion ? `<div class="category-card-desc">${info.descripcion}</div>` : ''}
                </div>
            </div>
            <div class="category-card-footer">
                <span class="category-card-count"><strong>${pendientesCat}</strong> ${pendientesCat === 1 ? 'pendiente' : 'pendientes'}${enColaPC > 0 ? ` <span class="category-card-autopc-pill">🤖 ${enColaPC} Auto-PC</span>` : ''}</span>
                <div style="display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    ${esEmily && enColaPC > 0 ? `<button type="button" class="btn-emily-export-pc" onclick="event.stopPropagation(); enviarColaPendienteAAutoPCLocal();" title="Enviar cola directa a Auto-PC o copiar lote para Pegar lote">📤 Enviar a PC</button>` : ''}
                    <span class="category-card-explore">Explorar ›</span>
                </div>
            </div>
        </div>`;
    });

    contenedor.innerHTML = html;
    actualizarBadgesIdeas();
    if (typeof _precargarImagenesAutoPCEnRAM === 'function') {
        setTimeout(_precargarImagenesAutoPCEnRAM, 20);
    }
}

function abrirDetalleCategoriaIdeas(catNombre) {
    if (!catNombre) catNombre = Object.keys(ESTRUCTURA_BANCO_IDEAS)[0];
    ESTADO_IDEAS.categoriaSeleccionada = catNombre;
    ESTADO_IDEAS.subvistaActual = 'detalle';

    var gridCont = document.getElementById('vista-ideas-categorias-grid');
    var detalleCont = document.getElementById('vista-ideas-categoria-detalle');
    var opCont = document.getElementById('vista-ideas-operatividad');

    if (gridCont) gridCont.style.display = 'none';
    if (detalleCont) detalleCont.style.display = 'block';
    if (opCont) opCont.style.display = 'none';

    var btnCat = document.getElementById('btn-tab-categorias');
    var btnOpe = document.getElementById('btn-tab-operatividad');
    if (btnCat) btnCat.classList.add('active');
    if (btnOpe) btnOpe.classList.remove('active');

    var headerElem = document.getElementById('detalle-categoria-header');
    var info = ESTRUCTURA_BANCO_IDEAS[catNombre];
    if (!info && catNombre.includes('Emily')) {
        info = ESTRUCTURA_BANCO_IDEAS["✨ Emily"];
    }

    var tituloLimpio = catNombre.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}✨✦🤖💡🛒📊📚✅\s]+/u, '').trim();
    if (!tituloLimpio) tituloLimpio = catNombre;
    var esEmily = esCategoriaEmily(catNombre);
    var ideas = APP_STATE.ideas || [];
    var enColaPC = esEmily ? ideas.filter(function(i) {
        if (!i || i.hecha || !esCategoriaEmily(i.categoria)) return false;
        var st = obtenerEstadoAutoPCIdea(i);
        return st === 'pending' || st === 'running';
    }).length : 0;

    if (esEmily && enColaPC > 0 && typeof _precargarImagenesAutoPCEnRAM === 'function') {
        setTimeout(_precargarImagenesAutoPCEnRAM, 10);
    }

    if (headerElem) {
        headerElem.innerHTML = `
            <div style="background: #0f1423; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <span class="category-card-icon ${esEmily ? 'icon-emily' : ''}" style="width: 48px; height: 48px; font-size: 24px;">${info ? info.icono : '💡'}</span>
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <h3 style="margin: 0; color: #f8fafc; font-size: 18px; font-weight: 800;">
                                ${tituloLimpio}
                            </h3>
                            ${esEmily ? '<span class="badge-emily-core">APP & CORE</span>' : ''}
                        </div>
                        <p style="margin: 4px 0 0 0; font-size: 12.5px; color: #94a3b8;">
                            ${info && info.descripcion ? info.descripcion : 'Marca la casilla para completar la idea y enviarla a Operatividad.'}
                        </p>
                    </div>
                </div>
                ${esEmily && enColaPC > 0 ? `<button type="button" class="btn-emily-export-pc btn-emily-export-pc-lg" onclick="enviarColaPendienteAAutoPCLocal();" title="Enviar directo a Auto-PC o copiar lote para Pegar lote">📤 Enviar ${enColaPC} a Auto-PC</button>` : ''}
            </div>`;
    }

    var listCont = document.getElementById('contenedor-subcategorias-lista');
    if (!listCont) return;

    var ideas = APP_STATE.ideas || [];
    var subcategorias = (info && info.subcategorias) ? info.subcategorias : ["General"];

    var html = '';

    subcategorias.forEach(function(subNombre) {
        // Filtrar SOLO ideas NO hechas (pendientes)
        var subIdeas = ideas.filter(function(i) {
            var coincideCat = (i.categoria === catNombre || (catNombre.includes('Emily') && i.categoria && i.categoria.includes('Emily')));
            var coincideSub = (i.subcategoria === subNombre || (!i.subcategoria && subNombre.includes("General")));
            var noHecha = !i.hecha;
            return coincideCat && coincideSub && noHecha;
        });

        html += `
        <div class="subcategory-section">
            <div class="subcategory-title">
                <span style="font-weight: 700; color: #f8fafc;">${subNombre}</span>
                <span style="font-size: 11.5px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); padding: 2px 10px; border-radius: 9999px;">
                    ${subIdeas.length} ${subIdeas.length === 1 ? 'pendiente' : 'pendientes'}
                </span>
            </div>
            <div class="idea-clean-list">`;

        if (subIdeas.length === 0) {
            html += `<p style="font-size: 12.5px; color: #64748b; padding: 10px 12px; font-style: italic; margin: 0;">- No hay ideas pendientes en esta subcategoría.</p>`;
        } else {
            subIdeas.forEach(function(idea) {
                var idAttr = escapeHtmlIdea(String(idea.id));
                var ideaEsEmily = esCategoriaEmily(idea.categoria || catNombre);
                var autopcEstado = ideaEsEmily ? obtenerEstadoAutoPCIdea(idea) : null;
                var autopcBadgeHtml = '';
                var autopcBtnHtml = '';

                if (ideaEsEmily) {
                    if (autopcEstado === 'awaiting_plan') {
                        autopcBadgeHtml = `<span class="idea-autopc-badge is-plan" style="background: rgba(168, 85, 247, 0.16); color: #d8b4fe; border-color: rgba(192, 132, 252, 0.4);">📋 Plan esperando</span>`;
                        autopcBtnHtml = `<button class="btn-idea-autopc" style="background: rgba(168, 85, 247, 0.22); border-color: rgba(192, 132, 252, 0.45); color: #e9d5ff;" onclick="cambiarVista('vista-perfil'); if(typeof cargarPerfil==='function') cargarPerfil();" title="Leer y aprobar Implementation Plan en Perfil">📖 Revisar Plan</button>`;
                    } else if (autopcEstado === 'running') {
                        autopcBadgeHtml = `<span class="idea-autopc-badge is-running">⚙️ Programando en PC</span>`;
                    } else if (autopcEstado === 'pending') {
                        autopcBadgeHtml = `<span class="idea-autopc-badge is-pending">⏳ En cola PC</span>`;
                        autopcBtnHtml = `<button class="btn-idea-autopc-cancel" onclick="cancelarIdeaAutoPC('${idAttr}')" title="Quitar de la cola de Auto-PC">✕ Quitar cola</button>`;
                    } else {
                        autopcBtnHtml = `<button class="btn-idea-autopc" onclick="enviarIdeaAAutoPC('${idAttr}')" title="Enviar a Auto-PC para programar en Antigravity">🚀 Programar</button>`;
                    }
                }

                var imgHtml = renderizarMiniaturaImagenIdeaHtml(idea);

                html += `
                <div class="idea-clean-item" id="idea-card-${idAttr}">
                    <div class="idea-item-left">
                        <span class="idea-dash">•</span>
                        <div class="idea-item-content">
                            <span class="idea-text-line">${escapeHtmlIdea(idea.texto)}</span>
                            ${imgHtml}
                            ${(idea.fecha || autopcBadgeHtml) ? `
                                <div class="idea-meta-badges">
                                    ${idea.fecha ? `<span style="font-size: 11px; color: #64748b; font-weight: 600;">🗓️ ${escapeHtmlIdea(idea.fecha)}</span>` : ''}
                                    ${autopcBadgeHtml}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="idea-actions-group">
                        ${autopcBtnHtml}
                        <button class="idea-btn-check" onclick="marcarIdeaHechaUI('${idAttr}')" title="Marcar como realizada y mover a Operatividad">
                            <span>✓</span> Hecha
                        </button>
                        <button class="btn-delete-row" onclick="eliminarIdea('${idAttr}')" title="Eliminar idea">✕</button>
                    </div>
                </div>`;
            });
        }

        html += `</div></div>`;
    });

    listCont.innerHTML = html;
    hidratarImagenesIdeasEnDOM();
    actualizarBadgesIdeas();
}

function volverACategoriasIdeas() {
    mostrarVistaCategoriasGrid();
}

function alFiltrarContextoDetalle() {
    // Deprecado
}

function guardarNuevaIdea() {
    var input = document.getElementById('input-nueva-idea');
    var catSelect = document.getElementById('select-categoria-idea');
    var subcatSelect = document.getElementById('select-subcategoria-idea');
    var imagenAdjunta = obtenerImagenBorradorIdea('principal');
    var textoOriginal = input ? input.value.trim() : "";

    if (!textoOriginal && !imagenAdjunta) {
        alert("Escribe el contenido de tu idea o adjunta una imagen.");
        if (input) input.focus();
        return;
    }

    var cat = catSelect ? catSelect.value : "✨ Emily";
    var subcat = subcatSelect ? subcatSelect.value : "General";

    var esEmily = esCategoriaEmily(cat);
    var chkAutoPC = document.getElementById('chk-idea-programar-ahora');
    var programarAhora = Boolean(esEmily && chkAutoPC && chkAutoPC.checked);

    registrarIdeaEnMonarca(textoOriginal, cat, subcat, programarAhora, imagenAdjunta);

    if (input) input.value = "";
    if (chkAutoPC) {
        chkAutoPC.checked = esEmily;
    }
    limpiarImagenBorradorIdea('principal');

    // Si estábamos en detalle de esa misma categoría, actualizarlo directamente; si no, mostrar cuadrícula
    if (ESTADO_IDEAS.subvistaActual === 'detalle' && (ESTADO_IDEAS.categoriaSeleccionada === cat || (esEmily && esCategoriaEmily(ESTADO_IDEAS.categoriaSeleccionada)))) {
        abrirDetalleCategoriaIdeas(ESTADO_IDEAS.categoriaSeleccionada);
    } else {
        mostrarVistaCategoriasGrid();
    }
}

function cancelarColaRemotaSiExiste(ideaId) {
    var key = String(ideaId);
    delete AUTOPC_SOLICITUDES_MAP[key];
    if (window.MonarcaCloud && typeof window.MonarcaCloud.cancelarSolicitudAutoPC === 'function') {
        window.MonarcaCloud.cancelarSolicitudAutoPC(key).catch(function(err) {
            console.warn('[Auto-PC] No se pudo cancelar solicitud remota:', err);
        });
    }
}

function marcarIdeaHechaUI(id) {
    if (!APP_STATE.ideas) return;
    var encontrada = null;
    var ahoraMs = Date.now();
    for (var i = 0; i < APP_STATE.ideas.length; i++) {
        if (String(APP_STATE.ideas[i].id) === String(id)) {
            encontrada = APP_STATE.ideas[i];
            encontrada.hecha = !encontrada.hecha;
            encontrada.fechaActualizacion = ahoraMs;
            if (encontrada.hecha) {
                encontrada.timestampHecha = ahoraMs;
                encontrada.fechaHecha = new Date().toLocaleDateString('es-ES');
                encontrada.autopcNotifConfirmada = true;
                if (encontrada.autopcStatus === 'pending' || encontrada.autopcPendienteSubida) {
                    encontrada.autopcPendienteSubida = false;
                    encontrada.autopcStatus = null;
                    cancelarColaRemotaSiExiste(encontrada.id);
                }
                if (typeof _silenciarNotifAutoPCPorSolicitud === 'function') {
                    _silenciarNotifAutoPCPorSolicitud(encontrada.id, { omitirSave: true });
                }
                sumarExp(15);
            } else if (encontrada.autopcStatus || encontrada.completadaPorAutoPC || encontrada.autopcNotifConfirmada) {
                encontrada.autopcStatus = null;
                encontrada.autopcPendienteSubida = false;
                encontrada.completadaPorAutoPC = false;
                encontrada.autopcNotifConfirmada = false;
                cancelarColaRemotaSiExiste(encontrada.id);
            }
            break;
        }
    }

    MonarcaDB.save(APP_STATE);
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    var modalNotif = document.getElementById('modal-centro-notificaciones');
    if (modalNotif && modalNotif.style.display === 'flex' && typeof renderizarCentroNotificaciones === 'function') {
        renderizarCentroNotificaciones();
    }

    // Re-renderizar la vista activa para que la idea completada se mueva de inmediato a Operatividad
    reRenderVistaIdeasActual();
}

function eliminarIdea(id) {
    if (!confirm("¿Eliminar esta idea?")) return;
    if (!APP_STATE.ideas) return;
    var encontrada = APP_STATE.ideas.find(function(i) { return String(i.id) === String(id); });
    var tombstoneId = encontrada ? encontrada.id : id;

    if (!APP_STATE._eliminados) APP_STATE._eliminados = {};
    if (!Array.isArray(APP_STATE._eliminados.ideas)) APP_STATE._eliminados.ideas = [];
    if (!APP_STATE._eliminados.ideas.some(function(eid) { return String(eid) === String(tombstoneId); })) {
        APP_STATE._eliminados.ideas.push(tombstoneId);
    }

    if (encontrada && (encontrada.autopcStatus === 'pending' || encontrada.autopcStatus === 'running' || encontrada.autopcPendienteSubida)) {
        cancelarColaRemotaSiExiste(encontrada.id);
    }
    if (typeof _silenciarNotifAutoPCPorSolicitud === 'function') {
        _silenciarNotifAutoPCPorSolicitud(tombstoneId, { omitirSave: true });
    }
    if (encontrada && encontrada.imagenId) {
        eliminarImagenIdeaCompleta(encontrada.imagenId);
    }

    APP_STATE.ideas = APP_STATE.ideas.filter(function(i) { return String(i.id) !== String(id); });
    MonarcaDB.save(APP_STATE);
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();

    reRenderVistaIdeasActual();
}

function reRenderVistaIdeasActual() {
    if (ESTADO_IDEAS.subvistaActual === 'detalle') {
        abrirDetalleCategoriaIdeas(ESTADO_IDEAS.categoriaSeleccionada);
    } else if (ESTADO_IDEAS.subvistaActual === 'operatividad') {
        mostrarVistaOperatividad();
    } else {
        mostrarVistaCategoriasGrid();
    }
}

function construirPayloadSolicitudAutoPC(idea, promptLimpio) {
    var payload = {
        ideaId: String(idea.id),
        text: promptLimpio,
        categoria: idea.categoria || '✨ Emily',
        subcategoria: idea.subcategoria || 'General',
        createdAt: Number(idea.timestamp) || Date.now()
    };
    if (idea.tieneImagen && idea.imagenId) {
        payload.hasImage = true;
        payload.imageDocId = String(idea.imagenId);
        payload.imageName = String(idea.imagenNombre || 'captura.png');
        payload.imageMime = String(idea.imagenMime || 'image/jpeg');
    }
    return payload;
}

function _esErrorCuotaFirebaseAutoPC(err) {
    if (!err) return false;
    var code = String(err.code || '').toLowerCase();
    var msg = String(err.message || err || '').toLowerCase();
    return (
        code.indexOf('resource-exhausted') !== -1 ||
        msg.indexOf('resource-exhausted') !== -1 ||
        msg.indexOf('quota exceeded') !== -1 ||
        msg.indexOf('429') !== -1
    );
}

function _copiarTextoSincronoExec(texto) {
    try {
        var ta = document.createElement('textarea');
        ta.value = texto;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.left = '-9999px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus({ preventScroll: true });
        ta.select();
        ta.setSelectionRange(0, texto.length);
        var ok = document.execCommand && document.execCommand('copy');
        document.body.removeChild(ta);
        return Boolean(ok);
    } catch (e) {
        return false;
    }
}

async function _copiarTextoPortapapelesAutoPC(texto) {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
            await navigator.clipboard.writeText(texto);
            return true;
        } catch (ig) {}
    }
    return _copiarTextoSincronoExec(texto);
}

function _obtenerIdeasEnColaAutoPCOrdenadas() {
    var ideas = (typeof APP_STATE !== 'undefined' && APP_STATE && Array.isArray(APP_STATE.ideas))
        ? APP_STATE.ideas
        : [];
    var enCola = ideas.filter(function(i) {
        if (!i || i.hecha || !esCategoriaEmily(i.categoria)) return false;
        var st = obtenerEstadoAutoPCIdea(i);
        return st === 'pending' || st === 'running';
    });
    enCola.sort(function(a, b) {
        return (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0);
    });
    return enCola;
}

function _construirLoteExportacionAutoPCSync() {
    var enCola = _obtenerIdeasEnColaAutoPCOrdenadas();
    var items = [];
    var faltantes = [];
    for (var idx = 0; idx < enCola.length; idx++) {
        var idea = enCola[idx];
        var imgDataUrl = '';
        if (idea.tieneImagen && idea.imagenId) {
            var imgKey = String(idea.imagenId);
            if (typeof IDEAS_IMAGENES_MEM_CACHE !== 'undefined' && IDEAS_IMAGENES_MEM_CACHE[imgKey]) {
                imgDataUrl = IDEAS_IMAGENES_MEM_CACHE[imgKey];
            } else {
                faltantes.push(imgKey);
            }
        }
        items.push({
            id: String(idea.id),
            text: obtenerPromptParaAutoPC(idea),
            subcategoria: String(idea.subcategoria || 'General'),
            createdAt: Number(idea.timestamp) || Date.now(),
            hasImage: Boolean(idea.tieneImagen && idea.imagenId),
            imageDocId: idea.imagenId ? String(idea.imagenId) : '',
            imageName: String(idea.imagenNombre || 'captura.png'),
            imageMime: String(idea.imagenMime || 'image/jpeg'),
            imageDataUrl: imgDataUrl
        });
    }
    return {
        batch: {
            format: 'MONARCA_AUTOPC_BATCH_V1',
            exportedAt: Date.now(),
            items: items
        },
        faltantes: faltantes
    };
}

async function _precargarImagenesAutoPCEnRAM() {
    var enCola = _obtenerIdeasEnColaAutoPCOrdenadas();
    for (var idx = 0; idx < enCola.length; idx++) {
        var idea = enCola[idx];
        if (!idea.tieneImagen || !idea.imagenId) continue;
        var imgKey = String(idea.imagenId);
        if (IDEAS_IMAGENES_MEM_CACHE[imgKey]) continue;
        try {
            var recLocal = await leerImagenIndexedDB(imgKey);
            if (recLocal && recLocal.dataUrl) {
                IDEAS_IMAGENES_RECORDS_MEM[imgKey] = recLocal;
                IDEAS_IMAGENES_MEM_CACHE[imgKey] = recLocal.dataUrl;
            }
        } catch (ig) {}
    }
}

async function construirLoteExportacionAutoPC() {
    await _precargarImagenesAutoPCEnRAM();
    return _construirLoteExportacionAutoPCSync().batch;
}

function _mostrarModalCopiaManualAutoPC(jsonStr, count) {
    var prev = document.getElementById('modal-copia-autopc-manual');
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);

    var overlay = document.createElement('div');
    overlay.id = 'modal-copia-autopc-manual';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10450;background:rgba(4,7,15,0.82);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;';

    var card = document.createElement('div');
    card.style.cssText = 'width:100%;max-width:520px;background:#0f1423;border:1px solid rgba(56,189,248,0.45);border-radius:16px;padding:18px;color:#f8fafc;box-shadow:0 24px 60px rgba(0,0,0,0.65);';

    var title = document.createElement('h4');
    title.style.cssText = 'margin:0 0 6px 0;font-size:16px;font-weight:800;color:#7dd3fc;';
    title.textContent = '🤖 Enviar ' + count + ' solicitud(es) a Auto-PC';

    var desc = document.createElement('p');
    desc.style.cssText = 'margin:0 0 10px 0;font-size:12.5px;color:#cbd5e1;line-height:1.45;';
    desc.textContent = 'Pulsa "Copiar lote" debajo y Auto-PC lo detectará automáticamente (o pégalo en Pegar lote).';

    var ta = document.createElement('textarea');
    ta.readOnly = true;
    ta.value = jsonStr;
    ta.style.cssText = 'width:100%;height:96px;background:#080c17;color:#94a3b8;border:1px solid rgba(148,163,184,0.28);border-radius:10px;padding:8px;font-size:11px;font-family:monospace;resize:none;box-sizing:border-box;';

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:12px;';

    var btnClose = document.createElement('button');
    btnClose.type = 'button';
    btnClose.textContent = 'Cerrar';
    btnClose.style.cssText = 'padding:8px 14px;border-radius:9px;border:1px solid rgba(148,163,184,0.3);background:#1e293b;color:#e2e8f0;font-weight:700;cursor:pointer;';
    btnClose.onclick = function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    var btnCopy = document.createElement('button');
    btnCopy.type = 'button';
    btnCopy.textContent = '📋 Copiar lote ahora';
    btnCopy.style.cssText = 'padding:8px 16px;border-radius:9px;border:1px solid rgba(56,189,248,0.6);background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;font-weight:800;cursor:pointer;';
    btnCopy.onclick = async function() {
        ta.focus();
        ta.select();
        var ok = _copiarTextoSincronoExec(jsonStr);
        if (!ok && navigator.clipboard && navigator.clipboard.writeText) {
            try { await navigator.clipboard.writeText(jsonStr); ok = true; } catch (ig) {}
        }
        if (ok) {
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca('✅ Lote copiado · Auto-PC lo cargará al instante', '🤖');
            }
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }
    };

    row.appendChild(btnClose);
    row.appendChild(btnCopy);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(ta);
    card.appendChild(row);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    setTimeout(function() { try { ta.focus(); ta.select(); } catch (ig) {} }, 20);
}

var MONARCA_AUTOPC_LAN_URL_KEY = 'monarca_autopc_lan_url';

function _esMovilOAPKAutoPC() {
    try {
        if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
            return true;
        }
    } catch (e) {}
    return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

function _obtenerPluginPuenteLocalAutoPC() {
    try {
        var p = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.MonarcaLocalBridge;
        if (p && typeof p.postToAutoPC === 'function' && typeof p.discoverAutoPC === 'function') {
            return p;
        }
    } catch (e) {}
    return null;
}

function _normalizarUrlPuenteAutoPC(raw) {
    var clean = String(raw || '').trim().replace(/\/+$/, '');
    if (!clean) return '';
    if (!/^https?:\/\//i.test(clean)) {
        clean = 'http://' + clean;
    }
    if (/^https?:\/\/[^:/]+$/i.test(clean)) {
        clean += ':47621';
    }
    return clean;
}

function _guardarUrlPuenteAutoPC(url) {
    var norm = _normalizarUrlPuenteAutoPC(url);
    if (!norm || norm.indexOf('127.0.0.1') !== -1 || norm.indexOf('localhost') !== -1) return;
    try { localStorage.setItem(MONARCA_AUTOPC_LAN_URL_KEY, norm); } catch (ig) {}
}

function _obtenerCandidatosPuenteAutoPC(bridgeBaseUrl) {
    var lista = [];
    var vistos = {};
    function agregar(val) {
        var norm = _normalizarUrlPuenteAutoPC(val);
        if (norm && !vistos[norm]) {
            vistos[norm] = true;
            lista.push(norm);
        }
    }
    if (bridgeBaseUrl) agregar(bridgeBaseUrl);
    if (window.MONARCA_AUTOPC_BRIDGE_URL) agregar(window.MONARCA_AUTOPC_BRIDGE_URL);
    try {
        var saved = localStorage.getItem(MONARCA_AUTOPC_LAN_URL_KEY);
        if (saved) agregar(saved);
    } catch (ig) {}
    if (AUTOPC_TELEMETRIA_PC && Array.isArray(AUTOPC_TELEMETRIA_PC.lanBridgeUrls)) {
        AUTOPC_TELEMETRIA_PC.lanBridgeUrls.forEach(agregar);
    }
    if (!_esMovilOAPKAutoPC()) {
        agregar('http://127.0.0.1:47621');
    }
    return lista;
}

async function _fetchBridgeHttpDirect(baseUrl, jsonStr, timeoutMs) {
    try {
        var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function() { ctrl.abort(); }, timeoutMs || 1500) : null;
        var resp = await fetch(baseUrl + '/emily-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: jsonStr,
            signal: ctrl ? ctrl.signal : undefined
        });
        if (timer) clearTimeout(timer);
        if (resp && resp.ok) {
            var resJson = await resp.json().catch(function() { return {}; });
            if (resJson && resJson.ok) return true;
        }
    } catch (e) {}
    return false;
}

async function _enviarViaPuenteDirectoAutoPC(jsonStr, bridgeBaseUrl) {
    var plugin = _obtenerPluginPuenteLocalAutoPC();
    var candidatos = _obtenerCandidatosPuenteAutoPC(bridgeBaseUrl);
    var esMovil = _esMovilOAPKAutoPC();

    if (plugin) {
        for (var i = 0; i < candidatos.length; i++) {
            try {
                var rCand = await plugin.postToAutoPC({
                    url: candidatos[i],
                    payload: jsonStr,
                    timeoutMs: 2200
                });
                if (rCand && rCand.ok) {
                    _guardarUrlPuenteAutoPC(rCand.url || candidatos[i]);
                    return { ok: true, mode: 'lan_native', url: rCand.url || candidatos[i] };
                }
            } catch (igCand) {}
        }

        try {
            var disc = await plugin.discoverAutoPC({
                port: 47622,
                timeoutMs: 1400,
                candidateUrls: candidatos
            });
            if (disc && disc.found) {
                var urlsDisc = [];
                if (disc.primaryUrl) urlsDisc.push(disc.primaryUrl);
                if (Array.isArray(disc.urls)) {
                    disc.urls.forEach(function(u) {
                        if (u && urlsDisc.indexOf(u) === -1) urlsDisc.push(u);
                    });
                }
                for (var j = 0; j < urlsDisc.length; j++) {
                    var rDisc = await plugin.postToAutoPC({
                        url: urlsDisc[j],
                        payload: jsonStr,
                        timeoutMs: 4500
                    });
                    if (rDisc && rDisc.ok) {
                        _guardarUrlPuenteAutoPC(rDisc.url || urlsDisc[j]);
                        return { ok: true, mode: 'lan_udp', url: rDisc.url || urlsDisc[j] };
                    }
                }
            }
        } catch (igDisc) {}

        return { ok: false, mode: 'none' };
    }

    var pageIsHttps = typeof location !== 'undefined' && location.protocol === 'https:';
    for (var k = 0; k < candidatos.length; k++) {
        var candUrl = candidatos[k];
        var esLoopback = candUrl.indexOf('127.0.0.1') !== -1 || candUrl.indexOf('localhost') !== -1;
        if (esMovil && esLoopback) continue;
        if (pageIsHttps && candUrl.indexOf('http://') === 0 && !esLoopback) {
            continue;
        }
        var okHttp = await _fetchBridgeHttpDirect(candUrl, jsonStr, esLoopback ? 950 : 2200);
        if (okHttp) {
            if (!esLoopback) _guardarUrlPuenteAutoPC(candUrl);
            return { ok: true, mode: esLoopback ? 'bridge' : 'bridge_remote', url: candUrl };
        }
    }

    return { ok: false, mode: 'none' };
}

async function _subirLotePendienteNubeAutoPC(batchItems) {
    var resumen = { uploaded: 0, alreadyInCloud: 0, quota429: false, failed: 0 };
    if (!Array.isArray(batchItems) || batchItems.length === 0) return resumen;
    if (!window.MonarcaCloud || typeof window.MonarcaCloud.enviarSolicitudAutoPC !== 'function') {
        resumen.failed = batchItems.length;
        return resumen;
    }

    var cambioLocal = false;
    for (var idx = 0; idx < batchItems.length; idx++) {
        var bItem = batchItems[idx];
        var idea = (APP_STATE && Array.isArray(APP_STATE.ideas))
            ? APP_STATE.ideas.find(function(i) { return i && String(i.id) === String(bItem.id); })
            : null;
        if (!idea || idea.hecha) continue;

        var docRemoto = AUTOPC_SOLICITUDES_MAP[String(idea.id)];
        if (!idea.autopcPendienteSubida && docRemoto && (docRemoto.status === 'pending' || docRemoto.status === 'running')) {
            resumen.alreadyInCloud++;
            continue;
        }

        try {
            var promptLimpio = obtenerPromptParaAutoPC(idea);
            if (idea.tieneImagen && idea.imagenId) {
                await asegurarImagenIdeaEnNube(idea);
            }
            var payload = construirPayloadSolicitudAutoPC(idea, promptLimpio);
            await window.MonarcaCloud.enviarSolicitudAutoPC(payload);
            AUTOPC_SOLICITUDES_MAP[String(idea.id)] = Object.assign({
                status: 'pending',
                notifConfirmada: false,
                updatedAt: Date.now()
            }, payload);
            idea.textoPrompt = promptLimpio;
            idea.autopcStatus = 'pending';
            idea.autopcPendienteSubida = false;
            idea.imagenPendienteSubida = false;
            cambioLocal = true;
            resumen.uploaded++;
        } catch (err) {
            resumen.failed++;
            if (_esErrorCuotaFirebaseAutoPC(err)) {
                resumen.quota429 = true;
                break;
            }
        }
    }

    if (cambioLocal) {
        MonarcaDB.save(APP_STATE);
        reRenderSiVistaIdeasActiva();
    }
    return resumen;
}

function _mostrarModalConfigIpYRespaldoAutoPC(jsonStr, cantidad, infoEstado) {
    var existing = document.getElementById('modal-autopc-manual-copy');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'modal-autopc-manual-copy';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.78);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';

    var card = document.createElement('div');
    card.style.cssText = 'background:#0f172a;border:1px solid rgba(56,189,248,0.35);border-radius:16px;padding:18px;max-width:440px;width:100%;color:#f8fafc;box-shadow:0 20px 50px rgba(0,0,0,0.6);';

    var h = document.createElement('h4');
    h.style.cssText = 'margin:0 0 8px 0;font-size:15px;font-weight:800;color:#7dd3fc;';
    h.textContent = '📡 Configurar conexión directa a Auto-PC (' + cantidad + ')';

    var p = document.createElement('p');
    p.style.cssText = 'margin:0 0 12px 0;font-size:12.5px;color:#cbd5e1;line-height:1.45;';
    p.textContent = (infoEstado && infoEstado.quota429)
        ? 'Firebase alcanzó su límite diario temporal (429) y no se detectó automáticamente tu PC en el Wi-Fi. Si estás en casa, escribe la IP LAN que muestra Auto-PC en Actividad/Logs (ej: 192.168.1.50) para enviar directo sin internet:'
        : 'No se encontró tu PC automáticamente. Asegúrate de que Auto-PC esté abierto en tu computadora y escribe su IP Wi-Fi (ej: 192.168.1.50:47621):';

    var savedVal = '';
    try { savedVal = localStorage.getItem(MONARCA_AUTOPC_LAN_URL_KEY) || ''; } catch (ig) {}
    if (!savedVal && AUTOPC_TELEMETRIA_PC && Array.isArray(AUTOPC_TELEMETRIA_PC.lanBridgeUrls) && AUTOPC_TELEMETRIA_PC.lanBridgeUrls[0]) {
        savedVal = AUTOPC_TELEMETRIA_PC.lanBridgeUrls[0];
    }

    var inpIp = document.createElement('input');
    inpIp.type = 'text';
    inpIp.placeholder = 'Ej: 192.168.1.50:47621';
    inpIp.value = savedVal;
    inpIp.style.cssText = 'width:100%;box-sizing:border-box;background:#020617;color:#e2e8f0;border:1px solid rgba(148,163,184,0.35);border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:10px;';

    var row1 = document.createElement('div');
    row1.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-bottom:10px;flex-wrap:wrap;';

    var btnProbar = document.createElement('button');
    btnProbar.type = 'button';
    btnProbar.textContent = '📡 Guardar y Reenviar a PC';
    btnProbar.style.cssText = 'background:#0284c7;color:#ffffff;border:none;border-radius:10px;padding:9px 14px;font-weight:800;font-size:12.5px;cursor:pointer;flex:1;';
    btnProbar.onclick = async function() {
        var cand = _normalizarUrlPuenteAutoPC(inpIp.value);
        if (!cand) return;
        _guardarUrlPuenteAutoPC(cand);
        overlay.remove();
        await enviarColaPendienteAAutoPCLocal(cand);
    };

    var btnCerrar = document.createElement('button');
    btnCerrar.type = 'button';
    btnCerrar.textContent = 'Cerrar';
    btnCerrar.style.cssText = 'background:#1e293b;color:#cbd5e1;border:none;border-radius:10px;padding:9px 14px;font-weight:700;font-size:12.5px;cursor:pointer;';
    btnCerrar.onclick = function() { overlay.remove(); };

    row1.appendChild(btnProbar);
    row1.appendChild(btnCerrar);
    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(inpIp);
    card.appendChild(row1);

    if (jsonStr && jsonStr.length < 400000) {
        var btnCopy = document.createElement('button');
        btnCopy.type = 'button';
        btnCopy.textContent = '📋 Copiar lote JSON manualmente';
        btnCopy.style.cssText = 'width:100%;background:rgba(30,41,59,0.85);color:#94a3b8;border:1px solid rgba(148,163,184,0.22);border-radius:10px;padding:8px 12px;font-weight:700;font-size:12px;cursor:pointer;';
        btnCopy.onclick = async function() {
            var ok = _copiarTextoSincronoExec(jsonStr);
            if (!ok && navigator.clipboard && navigator.clipboard.writeText) {
                try { await navigator.clipboard.writeText(jsonStr); ok = true; } catch (ig) {}
            }
            if (ok && typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca('Lote JSON copiado', '📋');
            }
        };
        card.appendChild(btnCopy);
    }

    overlay.appendChild(card);
    document.body.appendChild(overlay);
}

async function enviarColaPendienteAAutoPCLocal(bridgeBaseUrl) {
    var prep = _construirLoteExportacionAutoPCSync();
    if (!prep.batch.items || prep.batch.items.length === 0) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('No hay solicitudes pendientes en cola PC', '🤖');
        }
        return { mode: 'empty', count: 0 };
    }

    var esMovil = _esMovilOAPKAutoPC();
    var jsonStr = JSON.stringify(prep.batch);
    var asyncClipPromise = Promise.resolve(false);
    var syncExecOk = false;

    // En PC navegador copiamos en tick 0 para respaldo instantáneo con el portapapeles de Windows
    if (!esMovil) {
        asyncClipPromise = (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function')
            ? navigator.clipboard.writeText(jsonStr).then(function() { return true; }).catch(function() { return false; })
            : Promise.resolve(false);
        syncExecOk = _copiarTextoSincronoExec(jsonStr);
    }

    var btns = document.querySelectorAll('.btn-emily-export-pc');
    btns.forEach(function(b) {
        if (!b.dataset.origLabel) b.dataset.origLabel = b.textContent;
        b.textContent = '⏳ Enviando a Auto-PC...';
    });

    if (prep.faltantes && prep.faltantes.length > 0) {
        var fullBatch = await construirLoteExportacionAutoPC();
        var fullJson = JSON.stringify(fullBatch);
        if (fullJson !== jsonStr) {
            jsonStr = fullJson;
            if (!esMovil && typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                try { await navigator.clipboard.writeText(jsonStr); syncExecOk = true; } catch (ig) {}
            }
        }
        prep.batch = fullBatch;
    }

    var copied = esMovil ? false : (syncExecOk || (await asyncClipPromise));

    // 1. Intentar puente directo (127.0.0.1 en PC, o Wi-Fi LAN nativo UDP/HTTP en APK Android)
    var bridgeRes = await _enviarViaPuenteDirectoAutoPC(jsonStr, bridgeBaseUrl);
    if (bridgeRes.ok) {
        var huboLimpiezaLocal = false;
        if (APP_STATE && Array.isArray(APP_STATE.ideas)) {
            prep.batch.items.forEach(function(bi) {
                var idIdea = String(bi.id || '');
                var ideaRef = APP_STATE.ideas.find(function(x) { return x && String(x.id) === idIdea; });
                if (ideaRef && ideaRef.autopcPendienteSubida) {
                    ideaRef.autopcPendienteSubida = false;
                    huboLimpiezaLocal = true;
                }
            });
            if (huboLimpiezaLocal) {
                MonarcaDB.save(APP_STATE);
                reRenderSiVistaIdeasActiva();
            }
        }
        btns.forEach(function(b) {
            b.textContent = '✅ Enviadas a Auto-PC';
            setTimeout(function() {
                if (b && b.dataset.origLabel) b.textContent = b.dataset.origLabel;
            }, 2400);
        });
        if (typeof mostrarToastMonarca === 'function') {
            var sufijo = (bridgeRes.mode === 'lan_native' || bridgeRes.mode === 'lan_udp') ? ' por Wi-Fi 🚀' : ' 🚀';
            mostrarToastMonarca(
                prep.batch.items.length === 1
                    ? ('1 solicitud enviada directo a Auto-PC' + sufijo)
                    : (prep.batch.items.length + ' solicitudes enviadas directo a Auto-PC' + sufijo),
                '🤖'
            );
        }
        return { mode: bridgeRes.mode, count: prep.batch.items.length, json: jsonStr, url: bridgeRes.url };
    }

    // 2. Si está fuera de casa o en navegador móvil, enviar/reintentar activamente por Firebase Firestore
    var cloudRes = await _subirLotePendienteNubeAutoPC(prep.batch.items);
    if (cloudRes.uploaded > 0 || (cloudRes.alreadyInCloud > 0 && !cloudRes.quota429 && cloudRes.failed === 0)) {
        btns.forEach(function(b) {
            b.textContent = '☁️ Enviadas vía Nube';
            setTimeout(function() {
                if (b && b.dataset.origLabel) b.textContent = b.dataset.origLabel;
            }, 2400);
        });
        if (typeof mostrarToastMonarca === 'function') {
            var msgNube = cloudRes.uploaded > 0
                ? (cloudRes.uploaded + ' solicitud(es) enviada(s) a la cola nube de Auto-PC 🚀')
                : (cloudRes.alreadyInCloud + ' solicitud(es) ya sincronizadas en la cola nube de Auto-PC');
            mostrarToastMonarca(msgNube, '☁️');
        }
        return { mode: 'cloud', count: prep.batch.items.length, cloud: cloudRes };
    }

    // 3. Fallback honesto si ni LAN ni Nube pudieron entregar en este momento
    btns.forEach(function(b) {
        b.textContent = copied ? '✅ Copiadas en PC' : (b.dataset.origLabel || '📤 Enviar a PC');
        setTimeout(function() {
            if (b && b.dataset.origLabel) b.textContent = b.dataset.origLabel;
        }, 2400);
    });

    if (!esMovil && copied) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca(
                '✅ ' + prep.batch.items.length + ' solicitudes listas · Auto-PC las cargará en 1s (o usa "Pegar lote")',
                '🤖'
            );
        }
        return { mode: 'clipboard', count: prep.batch.items.length, json: jsonStr };
    }

    if (esMovil) {
        _mostrarModalConfigIpYRespaldoAutoPC(jsonStr, prep.batch.items.length, cloudRes);
        return { mode: 'mobile_config', count: prep.batch.items.length, cloud: cloudRes };
    }

    _mostrarModalCopiaManualAutoPC(jsonStr, prep.batch.items.length);
    return { mode: 'manual', count: prep.batch.items.length, json: jsonStr };
}

window.enviarColaPendienteAAutoPCLocal = enviarColaPendienteAAutoPCLocal;

async function enviarIdeaAAutoPC(id, desdeCreacion) {
    if (!APP_STATE.ideas) return false;
    var idea = APP_STATE.ideas.find(function(i) { return String(i.id) === String(id); });
    if (!idea || idea.hecha) return false;

    var promptLimpio = obtenerPromptParaAutoPC(idea);
    var ahoraMs = Date.now();
    idea.textoPrompt = promptLimpio;
    idea.autopcStatus = 'pending';
    idea.autopcPendienteSubida = true;
    idea.autopcNotifConfirmada = false;
    idea.completadaPorAutoPC = false;
    idea.fechaActualizacion = ahoraMs;

    // Permitir una nueva alerta solo cuando esta nueva ejecución termine
    if (APP_STATE._eliminados && Array.isArray(APP_STATE._eliminados.notificacionesAutoPC)) {
        var solStr = String(idea.id);
        APP_STATE._eliminados.notificacionesAutoPC = APP_STATE._eliminados.notificacionesAutoPC.filter(function(eid) {
            var s = String(eid || '');
            return s !== solStr && s.indexOf(solStr + '@') !== 0;
        });
    }

    var payloadSolicitud = construirPayloadSolicitudAutoPC(idea, promptLimpio);
    AUTOPC_SOLICITUDES_MAP[String(idea.id)] = Object.assign({
        status: 'pending',
        notifConfirmada: false,
        updatedAt: ahoraMs
    }, payloadSolicitud);

    MonarcaDB.save(APP_STATE);
    if (!desdeCreacion) {
        reRenderVistaIdeasActual();
    }

    var imgDataUrlLocal = '';
    if (idea.tieneImagen && idea.imagenId) {
        var imgKey = String(idea.imagenId);
        if (IDEAS_IMAGENES_MEM_CACHE[imgKey]) {
            imgDataUrlLocal = IDEAS_IMAGENES_MEM_CACHE[imgKey];
        } else {
            try {
                var recImg = await leerImagenIndexedDB(imgKey);
                if (recImg && recImg.dataUrl) {
                    IDEAS_IMAGENES_MEM_CACHE[imgKey] = recImg.dataUrl;
                    imgDataUrlLocal = recImg.dataUrl;
                }
            } catch (igImg) {}
        }
    }
    var loteIndividualJson = JSON.stringify({
        format: 'MONARCA_AUTOPC_BATCH_V1',
        exportedAt: ahoraMs,
        items: [{
            id: String(idea.id),
            text: promptLimpio,
            subcategoria: String(idea.subcategoria || 'General'),
            createdAt: Number(idea.timestamp) || ahoraMs,
            hasImage: Boolean(idea.tieneImagen && idea.imagenId),
            imageDocId: idea.imagenId ? String(idea.imagenId) : '',
            imageName: String(idea.imagenNombre || 'captura.png'),
            imageMime: String(idea.imagenMime || 'image/jpeg'),
            imageDataUrl: imgDataUrlLocal
        }]
    });

    // En segundo plano intentar entrega instantánea vía MQTT (<200ms desde cualquier red) y LAN Wi-Fi
    var mqttPayload = {
        ideaId: String(idea.id),
        text: promptLimpio,
        subcategoria: String(idea.subcategoria || 'General'),
        createdAt: Number(idea.timestamp) || ahoraMs,
        updatedAt: ahoraMs,
        hasImage: Boolean(idea.tieneImagen && idea.imagenId),
        imageDocId: idea.imagenId ? String(idea.imagenId) : '',
        imageName: String(idea.imagenNombre || 'captura.png'),
        imageMime: String(idea.imagenMime || 'image/jpeg'),
        imageDataUrl: (imgDataUrlLocal && imgDataUrlLocal.length <= 360000) ? imgDataUrlLocal : ''
    };
    var mqttPromise = (window.MonarcaMQTT && typeof window.MonarcaMQTT.enviarSolicitud === 'function')
        ? window.MonarcaMQTT.enviarSolicitud(mqttPayload).catch(function() { return false; })
        : Promise.resolve(false);

    var lanPromise = (_obtenerPluginPuenteLocalAutoPC() || !_esMovilOAPKAutoPC())
        ? _enviarViaPuenteDirectoAutoPC(loteIndividualJson).catch(function() { return { ok: false }; })
        : Promise.resolve({ ok: false });

    if (window.MonarcaCloud && typeof window.MonarcaCloud.enviarSolicitudAutoPC === 'function') {
        try {
            if (idea.tieneImagen && idea.imagenId) {
                await asegurarImagenIdeaEnNube(idea);
            }
            await window.MonarcaCloud.enviarSolicitudAutoPC(payloadSolicitud);
            var mqttOkNube = await mqttPromise;
            var lanOkNube = await lanPromise;
            idea.autopcPendienteSubida = false;
            idea.imagenPendienteSubida = false;
            MonarcaDB.save(APP_STATE);
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca(
                    mqttOkNube
                        ? 'Solicitud enviada a Auto-PC al instante (MQTT ⚡ + Nube)'
                        : ((lanOkNube && lanOkNube.ok)
                            ? 'Solicitud enviada a Auto-PC (Wi-Fi + Nube) 🚀'
                            : (idea.tieneImagen ? 'Solicitud + imagen enviadas a Auto-PC' : 'Solicitud enviada a la cola de Auto-PC')),
                    '🤖'
                );
            }
            reRenderSiVistaIdeasActiva();
            return true;
        } catch (err) {
            var mqttRes = await mqttPromise;
            var lanRes = await lanPromise;
            if (mqttRes) {
                idea.autopcPendienteSubida = false;
                MonarcaDB.save(APP_STATE);
                if (typeof mostrarToastMonarca === 'function') {
                    mostrarToastMonarca('Solicitud entregada a Auto-PC en tiempo real por MQTT ⚡', '🤖');
                }
                reRenderSiVistaIdeasActiva();
                return true;
            }
            if (lanRes && lanRes.ok) {
                idea.autopcPendienteSubida = false;
                MonarcaDB.save(APP_STATE);
                if (typeof mostrarToastMonarca === 'function') {
                    mostrarToastMonarca('Solicitud enviada directo a Auto-PC por Wi-Fi 🚀', '🤖');
                }
                reRenderSiVistaIdeasActiva();
                return true;
            }
            console.warn('[Auto-PC] Subida diferida (sin conexión, iniciando nube o cuota 429):', err);
            idea.autopcPendienteSubida = true;
            MonarcaDB.save(APP_STATE);
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca(
                    _esErrorCuotaFirebaseAutoPC(err)
                        ? 'Cuota nube 429 · Guardada local (pulsa "📤 Enviar a PC" en Wi-Fi)'
                        : 'Guardada · se enviará a Auto-PC al conectar',
                    _esErrorCuotaFirebaseAutoPC(err) ? '⚠️' : '⏳'
                );
            }
            return false;
        }
    }

    var mqttFallback = await mqttPromise;
    if (mqttFallback) {
        idea.autopcPendienteSubida = false;
        MonarcaDB.save(APP_STATE);
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Solicitud entregada a Auto-PC por MQTT ⚡', '🤖');
        }
        reRenderSiVistaIdeasActiva();
        return true;
    }

    var lanFallback = await lanPromise;
    if (lanFallback && lanFallback.ok) {
        idea.autopcPendienteSubida = false;
        MonarcaDB.save(APP_STATE);
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Solicitud enviada directo a Auto-PC por Wi-Fi 🚀', '🤖');
        }
        reRenderSiVistaIdeasActiva();
        return true;
    }

    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Guardada · se enviará a Auto-PC al conectar', '⏳');
    }
    return false;
}

async function cancelarIdeaAutoPC(id) {
    if (!APP_STATE.ideas) return false;
    var idea = APP_STATE.ideas.find(function(i) { return String(i.id) === String(id); });
    if (idea) {
        idea.autopcStatus = null;
        idea.autopcPendienteSubida = false;
    }
    delete AUTOPC_SOLICITUDES_MAP[String(id)];
    MonarcaDB.save(APP_STATE);
    reRenderVistaIdeasActual();

    if (window.MonarcaMQTT && typeof window.MonarcaMQTT.cancelarSolicitud === 'function') {
        window.MonarcaMQTT.cancelarSolicitud(String(id)).catch(function() {});
    }
    if (window.MonarcaCloud && typeof window.MonarcaCloud.cancelarSolicitudAutoPC === 'function') {
        try {
            await window.MonarcaCloud.cancelarSolicitudAutoPC(String(id));
        } catch (err) {
            console.warn('[Auto-PC] Error al quitar de Firestore:', err);
        }
    }
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Solicitud quitada de la cola de Auto-PC', '🛑');
    }
    return true;
}

async function procesarPendientesOfflineAutoPC() {
    if (!APP_STATE || !Array.isArray(APP_STATE.ideas)) return 0;
    if (!window.MonarcaCloud || typeof window.MonarcaCloud.enviarSolicitudAutoPC !== 'function') return 0;

    var pendientes = APP_STATE.ideas.filter(function(i) {
        return i && !i.hecha && i.autopcPendienteSubida === true;
    });

    var enviadas = 0;
    var cuotaAgotada = false;
    for (var k = 0; k < pendientes.length; k++) {
        var idea = pendientes[k];
        var promptLimpio = obtenerPromptParaAutoPC(idea);
        try {
            if (idea.tieneImagen && idea.imagenId) {
                await asegurarImagenIdeaEnNube(idea);
            }
            await window.MonarcaCloud.enviarSolicitudAutoPC(construirPayloadSolicitudAutoPC(idea, promptLimpio));
            idea.textoPrompt = promptLimpio;
            idea.autopcStatus = 'pending';
            idea.autopcPendienteSubida = false;
            idea.imagenPendienteSubida = false;
            enviadas++;
        } catch (err) {
            console.warn('[Auto-PC] Reintento pendiente fallido para idea ' + idea.id + ':', err);
            if (_esErrorCuotaFirebaseAutoPC(err)) {
                cuotaAgotada = true;
                break;
            }
        }
    }

    // Subir también imágenes pendientes de otras categorías que se hubieran creado sin conexión
    var imagenesPendientes = cuotaAgotada ? [] : APP_STATE.ideas.filter(function(i) {
        return i && i.tieneImagen && i.imagenId && i.imagenPendienteSubida === true && !i.autopcPendienteSubida;
    });
    var imgsSubidas = 0;
    for (var m = 0; m < imagenesPendientes.length; m++) {
        try {
            await asegurarImagenIdeaEnNube(imagenesPendientes[m]);
            imgsSubidas++;
        } catch (errImg) {
            console.warn('[Ideas Imagen] Reintento diferido fallido:', errImg);
            if (_esErrorCuotaFirebaseAutoPC(errImg)) break;
        }
    }

    if (enviadas > 0 || imgsSubidas > 0) {
        MonarcaDB.save(APP_STATE);
        if (enviadas > 0 && typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca(enviadas === 1 ? '1 idea pendiente enviada a Auto-PC' : (enviadas + ' ideas pendientes enviadas a Auto-PC'), '🤖');
        }
        reRenderSiVistaIdeasActiva();
    }
    return enviadas;
}

function reRenderSiVistaIdeasActiva() {
    var vistaIdeasEl = document.getElementById('vista-ideas');
    if (vistaIdeasEl && vistaIdeasEl.classList.contains('active') && ESTADO_IDEAS.inicializado) {
        renderizarBancoIdeas(APP_STATE.ideas);
    } else {
        actualizarBadgesIdeas();
    }
}

function _extraerSolicitudIdAutoPC(notifIdOrObj) {
    if (!notifIdOrObj) return '';
    if (typeof notifIdOrObj === 'object') {
        if (notifIdOrObj.solicitudId) return String(notifIdOrObj.solicitudId).trim();
        if (notifIdOrObj.id) return String(notifIdOrObj.id).split('@')[0].trim();
        return '';
    }
    var raw = String(notifIdOrObj).trim();
    if (raw.indexOf('alerta-autopc-') === 0) raw = raw.slice('alerta-autopc-'.length);
    return raw.split('@')[0].trim();
}

function _esNotificacionAutoPCDescartada(notifKey, solicitudId, docRemoto, ideaAsociada) {
    var solStr = String(solicitudId || _extraerSolicitudIdAutoPC(notifKey) || '').trim();
    var keyStr = String(notifKey || solStr || '').trim();
    var safeKey = keyStr.replace(/[^a-zA-Z0-9_@.-]/g, '_');

    if (docRemoto && (docRemoto.notifConfirmada === true || docRemoto.dismissed === true)) {
        return true;
    }
    if (ideaAsociada) {
        if (ideaAsociada.autopcNotifConfirmada === true) return true;
        // Si la idea ya fue marcada hecha manualmente (no completada automáticamente por Auto-PC), no volver a notificar
        if (ideaAsociada.hecha === true && !ideaAsociada.completadaPorAutoPC) return true;
    }
    if (typeof APP_STATE !== 'undefined' && APP_STATE && APP_STATE._eliminados) {
        var elimIdeas = Array.isArray(APP_STATE._eliminados.ideas) ? APP_STATE._eliminados.ideas : [];
        if (solStr && elimIdeas.some(function(eid) { return String(eid) === solStr; })) {
            return true;
        }
        var elimNotifs = Array.isArray(APP_STATE._eliminados.notificacionesAutoPC) ? APP_STATE._eliminados.notificacionesAutoPC : [];
        var yaTomb = elimNotifs.some(function(eid) {
            var eStr = String(eid || '').trim();
            if (!eStr) return false;
            var eSafe = eStr.replace(/[^a-zA-Z0-9_@.-]/g, '_');
            if (eStr === keyStr || eStr === safeKey || eSafe === safeKey) return true;
            if (solStr && (eStr === solStr || eSafe === solStr || eStr.indexOf(solStr + '@') === 0 || eSafe.indexOf(solStr + '@') === 0)) {
                return true;
            }
            return false;
        });
        if (yaTomb) return true;
    }
    return false;
}

function _firmaContenidoNotifAutoPC(n) {
    if (!n || typeof n !== 'object') return '';
    var txt = String(n.texto || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 96);
    if (!txt) return '';
    var ts = Number(n.timestamp) || 0;
    var bucket = ts > 0 ? Math.floor(ts / 300000) : 0; // ventana de 5 min
    return txt + '@' + bucket;
}

function _silenciarNotifAutoPCPorSolicitud(idOrNotifKey, opts) {
    if (!APP_STATE || !idOrNotifKey) return [];
    var opciones = opts || {};
    var keyRaw = String(idOrNotifKey).trim();
    if (!keyRaw) return [];
    var safeKey = keyRaw.replace(/[^a-zA-Z0-9_@.-]/g, '_');
    var solId = _extraerSolicitudIdAutoPC(keyRaw);
    var safeSolId = solId ? solId.replace(/[^a-zA-Z0-9_@.-]/g, '_') : '';

    var keysACancelar = [keyRaw, safeKey];
    var solsAConfirmar = [];
    if (solId) {
        keysACancelar.push(solId);
        solsAConfirmar.push(solId);
    }
    if (safeSolId) keysACancelar.push(safeSolId);

    if (!APP_STATE._eliminados) APP_STATE._eliminados = {};
    if (!Array.isArray(APP_STATE._eliminados.notificacionesAutoPC)) APP_STATE._eliminados.notificacionesAutoPC = [];

    // Detectar firma de contenido del ítem seleccionado para silenciar también posibles duplicados hermanos
    var firmaObjetivo = '';
    if (Array.isArray(APP_STATE.notificacionesAutoPC)) {
        var matchTarget = APP_STATE.notificacionesAutoPC.find(function(n) {
            if (!n) return false;
            var nId = String(n.id || '');
            var nSafe = nId.replace(/[^a-zA-Z0-9_@.-]/g, '_');
            var nSol = _extraerSolicitudIdAutoPC(n);
            return nId === keyRaw || nSafe === safeKey || (solId && nSol === solId);
        });
        if (matchTarget) firmaObjetivo = _firmaContenidoNotifAutoPC(matchTarget);

        APP_STATE.notificacionesAutoPC = APP_STATE.notificacionesAutoPC.filter(function(n) {
            if (!n) return false;
            var nId = String(n.id || '');
            var nSafe = nId.replace(/[^a-zA-Z0-9_@.-]/g, '_');
            var nSol = _extraerSolicitudIdAutoPC(n);
            var nFirma = firmaObjetivo ? _firmaContenidoNotifAutoPC(n) : '';
            var coincide = (
                nId === keyRaw ||
                nSafe === safeKey ||
                (solId && nSol === solId) ||
                (firmaObjetivo && nFirma && nFirma === firmaObjetivo)
            );
            if (coincide) {
                keysACancelar.push(nId);
                keysACancelar.push(nSafe);
                if (nSol) {
                    keysACancelar.push(nSol);
                    if (solsAConfirmar.indexOf(nSol) === -1) solsAConfirmar.push(nSol);
                }
            }
            return !coincide;
        });
    }

    keysACancelar.forEach(function(k) {
        if (!k) return;
        if (typeof registrarTombstone === 'function') {
            registrarTombstone('notificacionesAutoPC', k);
        } else if (APP_STATE._eliminados.notificacionesAutoPC.indexOf(k) === -1) {
            APP_STATE._eliminados.notificacionesAutoPC.push(k);
        }
    });

    var ahoraMs = Date.now();
    if (solsAConfirmar.length > 0 && Array.isArray(APP_STATE.ideas)) {
        APP_STATE.ideas.forEach(function(ideaItem) {
            if (ideaItem && solsAConfirmar.indexOf(String(ideaItem.id)) !== -1) {
                ideaItem.autopcNotifConfirmada = true;
                ideaItem.fechaActualizacion = ahoraMs;
            }
        });
    }
    solsAConfirmar.forEach(function(sid) {
        if (AUTOPC_SOLICITUDES_MAP[sid]) {
            AUTOPC_SOLICITUDES_MAP[sid].notifConfirmada = true;
        }
    });

    if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
        Array.from(new Set(keysACancelar)).forEach(function(k) {
            window.cancelarNotificacionTelefonoPorAlerta('alerta-autopc-' + k);
        });
    }

    if (!opciones.omitirNube && solsAConfirmar.length > 0 && window.MonarcaCloud && typeof window.MonarcaCloud.confirmarNotificacionesAutoPCNube === 'function') {
        window.MonarcaCloud.confirmarNotificacionesAutoPCNube(solsAConfirmar).catch(function() {});
    }

    if (!opciones.omitirSave) {
        MonarcaDB.save(APP_STATE);
    }
    return solsAConfirmar;
}

function registrarNotificacionSolicitudAutoPC(docRemoto, ideaAsociada) {
    if (!APP_STATE) return false;
    var solicitudId = String((docRemoto && (docRemoto.ideaId || docRemoto.id)) || (ideaAsociada && ideaAsociada.id) || '').trim();
    if (!solicitudId) return false;

    if (!Array.isArray(APP_STATE.notificacionesAutoPC)) APP_STATE.notificacionesAutoPC = [];
    if (!APP_STATE._eliminados) APP_STATE._eliminados = {};
    if (!Array.isArray(APP_STATE._eliminados.notificacionesAutoPC)) APP_STATE._eliminados.notificacionesAutoPC = [];

    var tsKeyPart = Number(docRemoto && docRemoto.updatedAt) || Number(docRemoto && docRemoto.createdAt) || 'done';
    var notifKey = String(solicitudId + '@' + tsKeyPart).replace(/[^a-zA-Z0-9_@.-]/g, '_');

    if (_esNotificacionAutoPCDescartada(notifKey, solicitudId, docRemoto, ideaAsociada)) {
        return false;
    }

    var rawTexto = (docRemoto && docRemoto.text) || (ideaAsociada && (ideaAsociada.textoPrompt || ideaAsociada.texto)) || ('Solicitud #' + solicitudId);
    var textoLimpio = obtenerTextoPromptLimpio(rawTexto);
    var tsNotif = Number(docRemoto && docRemoto.updatedAt) || Number(docRemoto && docRemoto.createdAt) || Date.now();
    var nuevaFirma = _firmaContenidoNotifAutoPC({ texto: textoLimpio, timestamp: tsNotif });

    var yaActiva = APP_STATE.notificacionesAutoPC.some(function(n) {
        if (!n) return false;
        if (String(n.id) === notifKey || _extraerSolicitudIdAutoPC(n) === solicitudId) return true;
        return Boolean(nuevaFirma && _firmaContenidoNotifAutoPC(n) === nuevaFirma);
    });
    if (yaActiva) return false;

    var cat = String((docRemoto && docRemoto.categoria) || (ideaAsociada && ideaAsociada.categoria) || '🤖 Auto-PC Local');
    var subcat = String((docRemoto && docRemoto.subcategoria) || (ideaAsociada && ideaAsociada.subcategoria) || 'Lista');

    APP_STATE.notificacionesAutoPC.unshift({
        id: notifKey,
        solicitudId: solicitudId,
        texto: textoLimpio,
        categoria: cat,
        subcategoria: subcat,
        esDeEmily: Boolean(ideaAsociada || esCategoriaEmily(cat)),
        timestamp: tsNotif,
        fechaActualizacion: tsNotif
    });
    return true;
}

function obtenerAlertasAutoPCActivas() {
    var alertasPlan = [];
    var planPend = (typeof obtenerPlanPendienteAutoPC === 'function') ? obtenerPlanPendienteAutoPC() : null;
    if (planPend && planPend.planId && !planPend.decisionEnviada) {
        var safePlanId = String(planPend.planId).replace(/[^a-zA-Z0-9_@.-]/g, '_');
        var tsPlan = Number(planPend.planUpdatedAt) || Date.now();
        var dPlan = new Date(tsPlan);
        var horaPlan = dPlan.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        var reqPreview = planPend.requestText
            ? (planPend.requestText.length > 62 ? (planPend.requestText.slice(0, 59) + '...') : planPend.requestText)
            : 'Solicitud actual';
        var rawPlanPreview = (planPend.planMessage || planPend.planMarkdown || '').replace(/[#*`_>]+/g, ' ').replace(/\s+/g, ' ').trim();
        var descPlan = rawPlanPreview
            ? (rawPlanPreview.length > 180 ? (rawPlanPreview.slice(0, 177) + '...') : rawPlanPreview)
            : 'Antigravity generó un Implementation Plan y detuvo toda la cola hasta que apruebes o envíes tus indicaciones desde tu Perfil.';

        alertasPlan.push({
            id: 'alerta-autopc-plan-' + safePlanId,
            tipo: 'autopc-plan',
            icono: '📋',
            badge: 'Implementation Plan · Esperando',
            color: '#a855f7',
            titulo: 'Antigravity pide aprobación de plan: "' + reqPreview + '"',
            metaLinea: '⏸ Cola detenida · 🕒 ' + horaPlan + ' · Toca para leer y aprobar en Perfil',
            descripcion: descPlan,
            acciones: [
                {
                    tipo: 'primary',
                    texto: '📖 Leer y Aprobar en Perfil',
                    fn: "cerrarCentroNotificaciones(); if(typeof cambiarVista==='function') cambiarVista('vista-perfil'); if(typeof cargarPerfil==='function') cargarPerfil(); setTimeout(function(){ var el = document.getElementById('perfil-autopc-plan-box'); if(el && el.scrollIntoView) el.scrollIntoView({behavior:'smooth', block:'center'}); }, 180);"
                }
            ],
            _sortTs: tsPlan + 1000000000,
            _dispatchKey: 'alerta-autopc-plan-' + safePlanId + '@' + tsPlan,
            _phoneMeta: {
                monarcaAlertId: 'alerta-autopc-plan-' + safePlanId,
                monarcaAlertTipo: 'autopc-plan',
                openView: 'vista-perfil',
                planId: String(planPend.planId)
            }
        });
    }

    if (typeof APP_STATE === 'undefined' || !APP_STATE || !Array.isArray(APP_STATE.notificacionesAutoPC)) {
        return alertasPlan;
    }
    var ideasPorId = {};
    if (Array.isArray(APP_STATE.ideas)) {
        APP_STATE.ideas.forEach(function(item) {
            if (item && item.id) ideasPorId[String(item.id)] = item;
        });
    }
    var vistosSol = {};
    var vistasFirma = {};

    var alertasDone = APP_STATE.notificacionesAutoPC
        .filter(function(n) {
            if (!n || !n.id) return false;
            var solId = _extraerSolicitudIdAutoPC(n);
            var docRemoto = solId ? AUTOPC_SOLICITUDES_MAP[solId] : null;
            var ideaAsoc = solId ? ideasPorId[solId] : null;
            if (_esNotificacionAutoPCDescartada(n.id, solId, docRemoto, ideaAsoc)) {
                return false;
            }
            var dedupKey = solId || String(n.id);
            if (vistosSol[dedupKey]) return false;
            var firma = _firmaContenidoNotifAutoPC(n);
            if (firma && vistasFirma[firma]) return false;
            vistosSol[dedupKey] = true;
            if (firma) vistasFirma[firma] = true;
            return true;
        })
        .map(function(n) {
            var ts = Number(n.timestamp) || Date.now();
            var d = new Date(ts);
            var horaTxt = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            var fechaTxt = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            var texto = String(n.texto || '').trim() || ('Solicitud #' + (n.solicitudId || ''));
            var resumen = texto.length > 68 ? (texto.slice(0, 65) + '...') : texto;
            var safeId = String(n.id).replace(/[^a-zA-Z0-9_@.-]/g, '_');

            var solId = _extraerSolicitudIdAutoPC(n);
            var docRemoto = solId ? AUTOPC_SOLICITUDES_MAP[solId] : null;
            var ideaAsoc = solId ? ideasPorId[solId] : null;
            var respAgRaw = String((docRemoto && docRemoto.resumenAntigravity) || (ideaAsoc && ideaAsoc.resumenAntigravity) || '').replace(/[#*`_>]+/g, ' ').replace(/\s+/g, ' ').trim();
            var descFinal = respAgRaw
                ? ('💬 Antigravity: ' + (respAgRaw.length > 160 ? (respAgRaw.slice(0, 157) + '...') : respAgRaw))
                : ('La solicitud "' + texto + '" terminó en tu Auto-PC y ya fue añadida correctamente.');

            var acciones = [
                {
                    tipo: 'primary',
                    texto: '✓ Okey',
                    fn: "descartarNotificacionAutoPC('" + safeId + "')"
                },
                {
                    tipo: 'secondary',
                    texto: '💬 Ver en Perfil',
                    fn: "cerrarCentroNotificaciones(); if(typeof cambiarVista==='function') cambiarVista('vista-perfil'); if(typeof cargarPerfil==='function') cargarPerfil();"
                }
            ];
            if (n.esDeEmily) {
                var safeSolId = String(n.solicitudId || '').replace(/[^a-zA-Z0-9_@.-]/g, '');
                acciones.push({
                    tipo: 'secondary',
                    texto: '📋 Operatividad',
                    fn: "cerrarCentroNotificaciones(); verSolicitudAutoPCEnOperatividad('" + safeSolId + "')"
                });
            }

            return {
                id: 'alerta-autopc-' + safeId,
                autopcNotifId: String(n.id),
                tipo: 'autopc',
                icono: '🤖',
                badge: 'Auto-PC · Lista',
                color: '#10b981',
                titulo: 'Solicitud completada: "' + resumen + '"',
                metaLinea: '🕒 ' + horaTxt + ' · ' + fechaTxt + ' · ' + (n.esDeEmily ? '✨ Emily → Hecha' : '💻 Cola local Auto-PC'),
                descripcion: descFinal,
                acciones: acciones,
                _sortTs: ts,
                _dispatchKey: 'alerta-autopc-' + safeId + '@' + ts,
                _phoneMeta: {
                    monarcaAlertId: 'alerta-autopc-' + safeId,
                    monarcaAlertTipo: 'autopc',
                    openView: 'vista-perfil',
                    autopcNotifId: String(n.id)
                }
            };
        })
        .sort(function(a, b) { return (b._sortTs || 0) - (a._sortTs || 0); });

    return alertasPlan.concat(alertasDone);
}

function descartarNotificacionAutoPC(notifId) {
    if (!APP_STATE) return;
    var key = String(notifId || '').trim();
    if (!key) return;
    _silenciarNotifAutoPCPorSolicitud(key);
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof renderizarCentroNotificaciones === 'function') renderizarCentroNotificaciones();
}

function descartarTodasNotificacionesAutoPC() {
    if (!APP_STATE) return;
    var activas = Array.isArray(APP_STATE.notificacionesAutoPC) ? APP_STATE.notificacionesAutoPC.slice() : [];
    var solIdsNube = [];

    activas.forEach(function(n) {
        if (!n || !n.id) return;
        var ids = _silenciarNotifAutoPCPorSolicitud(String(n.id), { omitirSave: true, omitirNube: true });
        ids.forEach(function(sid) {
            if (solIdsNube.indexOf(sid) === -1) solIdsNube.push(sid);
        });
    });

    APP_STATE.notificacionesAutoPC = [];
    if (solIdsNube.length > 0 && window.MonarcaCloud && typeof window.MonarcaCloud.confirmarNotificacionesAutoPCNube === 'function') {
        window.MonarcaCloud.confirmarNotificacionesAutoPCNube(solIdsNube).catch(function() {});
    }

    MonarcaDB.save(APP_STATE);
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof renderizarCentroNotificaciones === 'function') renderizarCentroNotificaciones();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Alertas de Auto-PC confirmadas con ✓ Okey', '✅');
    }
}

function verSolicitudAutoPCEnOperatividad(focusIdeaId) {
    if (focusIdeaId && typeof ESTADO_IDEAS !== 'undefined') {
        if (!ESTADO_IDEAS.resumenesAbiertos) ESTADO_IDEAS.resumenesAbiertos = {};
        ESTADO_IDEAS.resumenesAbiertos[String(focusIdeaId)] = true;
    }
    if (typeof cambiarVista === 'function') {
        cambiarVista('vista-ideas');
    }
    if (typeof alternarSubvistaIdeas === 'function') {
        alternarSubvistaIdeas('operatividad');
    }
}

function formatearResumenAntigravityHtml(textoRaw) {
    var limpio = String(textoRaw || '').trim();
    if (!limpio) return '';
    var esc = escapeHtmlIdea(limpio);
    var lineas = esc.split(/\r?\n/);
    var out = [];
    var enLista = false;

    var formatInline = function(s) {
        return s
            .replace(/`([^`]+)`/g, '<code class="ag-md-code">$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong class="ag-md-strong">$1</strong>');
    };

    lineas.forEach(function(linea) {
        var t = linea.trim();
        if (!t) {
            if (enLista) {
                out.push('</ul>');
                enLista = false;
            }
            return;
        }
        if (t === '---' || t === '***') {
            if (enLista) {
                out.push('</ul>');
                enLista = false;
            }
            out.push('<hr class="ag-md-hr">');
            return;
        }
        var hMatch = t.match(/^#{1,4}\s+(.*)$/);
        if (hMatch) {
            if (enLista) {
                out.push('</ul>');
                enLista = false;
            }
            out.push('<div class="ag-md-heading">' + formatInline(hMatch[1]) + '</div>');
            return;
        }
        var liMatch = t.match(/^[-*•]\s+(.*)$/) || t.match(/^\d+\.\s+(.*)$/);
        if (liMatch) {
            if (!enLista) {
                out.push('<ul class="ag-md-list">');
                enLista = true;
            }
            out.push('<li>' + formatInline(liMatch[1]) + '</li>');
            return;
        }
        if (enLista) {
            out.push('</ul>');
            enLista = false;
        }
        out.push('<p class="ag-md-p">' + formatInline(t) + '</p>');
    });
    if (enLista) out.push('</ul>');
    return out.join('');
}

function _sincronizarCamposResumenAutoPCEnIdea(idea, docRemoto) {
    if (!idea || !docRemoto) return false;
    var cambio = false;
    var resTxt = typeof docRemoto.resumenAntigravity === 'string' ? docRemoto.resumenAntigravity.trim() : '';
    if (resTxt && idea.resumenAntigravity !== resTxt) {
        idea.resumenAntigravity = resTxt;
        cambio = true;
    }
    if (Array.isArray(docRemoto.resumenArchivos) && docRemoto.resumenArchivos.length > 0) {
        var prevArch = JSON.stringify(idea.resumenArchivos || []);
        var nextArch = JSON.stringify(docRemoto.resumenArchivos);
        if (prevArch !== nextArch) {
            idea.resumenArchivos = docRemoto.resumenArchivos.slice(0, 12);
            cambio = true;
        }
    }
    if (Number(docRemoto.resumenPasos) > 0 && idea.resumenPasos !== Number(docRemoto.resumenPasos)) {
        idea.resumenPasos = Number(docRemoto.resumenPasos);
        cambio = true;
    }
    if (Number(docRemoto.resumenDuracionMs) > 0 && idea.resumenDuracionMs !== Number(docRemoto.resumenDuracionMs)) {
        idea.resumenDuracionMs = Number(docRemoto.resumenDuracionMs);
        cambio = true;
    }
    if (docRemoto.resumenVersion && idea.resumenVersion !== String(docRemoto.resumenVersion)) {
        idea.resumenVersion = String(docRemoto.resumenVersion);
        cambio = true;
    }
    return cambio;
}

function _obtenerDecisionLocalOremotaParaPlan(planId, docRemoto) {
    if (!planId) return null;
    var pid = String(planId).trim();
    if (AUTOPC_PLAN_DECISION_LOCAL[pid]) {
        return AUTOPC_PLAN_DECISION_LOCAL[pid];
    }
    if (docRemoto && docRemoto.planDecision && String(docRemoto.planDecision).trim()) {
        return {
            action: String(docRemoto.planDecision).trim().toLowerCase(),
            mensaje: String(docRemoto.planDecisionText || '').trim(),
            ts: Number(docRemoto.planDecisionAt) || Date.now()
        };
    }
    if (
        AUTOPC_PLAN_DECISION_DOC &&
        String(AUTOPC_PLAN_DECISION_DOC.planId || '').trim() === pid &&
        String(AUTOPC_PLAN_DECISION_DOC.action || '').trim() &&
        String(AUTOPC_PLAN_DECISION_DOC.status || 'pending').toLowerCase() !== 'consumed'
    ) {
        return {
            action: String(AUTOPC_PLAN_DECISION_DOC.action || '').trim().toLowerCase(),
            mensaje: String(AUTOPC_PLAN_DECISION_DOC.mensaje || '').trim(),
            ts: Number(AUTOPC_PLAN_DECISION_DOC.updatedAt || AUTOPC_PLAN_DECISION_DOC.createdAt) || Date.now()
        };
    }
    return null;
}

function obtenerPlanPendienteAutoPC() {
    var tel = AUTOPC_TELEMETRIA_PC || null;
    var planDoc = null;
    var planDocTs = 0;

    Object.keys(AUTOPC_SOLICITUDES_MAP || {}).forEach(function(key) {
        var d = AUTOPC_SOLICITUDES_MAP[key];
        if (!d) return;
        if (String(d.status || '').toLowerCase() !== 'awaiting_plan') return;
        var ts = Number(d.planUpdatedAt || d.updatedAt || d.createdAt) || 0;
        if (!planDoc || ts >= planDocTs) {
            planDoc = d;
            planDocTs = ts;
        }
    });

    var telAwaiting = Boolean(
        tel && (
            tel.agAwaitingPlan === true ||
            String(tel.phase || '').toUpperCase() === 'WAITING_PLAN_APPROVAL'
        )
    );

    if (!planDoc && !telAwaiting) {
        return null;
    }

    var requestId = String(
        (planDoc && (planDoc.ideaId || planDoc.id)) ||
        (tel && tel.activeSourceId) ||
        ''
    ).trim();

    var planId = String(
        (planDoc && planDoc.planId) ||
        (tel && tel.agPlanId) ||
        (requestId ? ('plan-' + requestId) : '') ||
        ('plan-' + String((tel && tel.agPlanUpdatedAt) || (planDoc && planDoc.planUpdatedAt) || 'activo'))
    ).trim();

    var requestText = String(
        (planDoc && planDoc.text) ||
        (tel && tel.activeText) ||
        ''
    ).trim();

    var planMessage = String(
        (planDoc && planDoc.planMessage) ||
        (tel && tel.agPlanMessage) ||
        ''
    ).trim();

    var planMarkdown = String(
        (planDoc && planDoc.planMarkdown) ||
        (tel && tel.agPlanMarkdown) ||
        ''
    ).trim();

    var planUpdatedAt = Number(
        (planDoc && (planDoc.planUpdatedAt || planDoc.updatedAt)) ||
        (tel && (tel.agPlanUpdatedAt || tel.phaseChangedAt || tel.heartbeatAt)) ||
        Date.now()
    );

    var dec = _obtenerDecisionLocalOremotaParaPlan(planId, planDoc);

    return {
        planId: planId,
        requestId: requestId,
        requestText: requestText || 'Solicitud activa en Antigravity',
        planMessage: planMessage,
        planMarkdown: planMarkdown,
        planUpdatedAt: planUpdatedAt,
        decisionEnviada: Boolean(dec),
        decisionAction: dec ? dec.action : '',
        decisionTexto: dec ? dec.mensaje : ''
    };
}

function _marcarIdeaCompletadaPorAutoPC(idea, docDone, tsFallback) {
    if (!idea || !docDone) return { changed: false, completedNow: false };
    var changed = false;
    var completedNow = false;
    var tsDone = Number(docDone.updatedAt || docDone.ts || tsFallback) || Date.now();
    if (idea.autopcStatus !== 'done' || idea.autopcPendienteSubida) {
        idea.autopcStatus = 'done';
        idea.autopcPendienteSubida = false;
        changed = true;
    }
    if (_sincronizarCamposResumenAutoPCEnIdea(idea, docDone)) {
        changed = true;
    }
    if (docDone.notifConfirmada === true && !idea.autopcNotifConfirmada) {
        idea.autopcNotifConfirmada = true;
        changed = true;
    }
    if (!idea.hecha) {
        idea.hecha = true;
        idea.timestampHecha = tsDone;
        idea.fechaHecha = new Date(tsDone).toLocaleDateString('es-ES');
        idea.fechaActualizacion = Math.max(Number(idea.fechaActualizacion) || 0, tsDone);
        idea.completadaPorAutoPC = true;
        completedNow = true;
        changed = true;
    } else {
        if (!idea.completadaPorAutoPC) {
            idea.completadaPorAutoPC = true;
            changed = true;
        }
        if (changed) {
            idea.fechaActualizacion = Math.max(Number(idea.fechaActualizacion) || 0, tsDone);
        }
    }
    return { changed: changed, completedNow: completedNow };
}

function procesarPresenciaMqttAutoPC(data) {
    if (!data || typeof data !== 'object') return;
    AUTOPC_MQTT_PRESENCE = Object.assign({ receivedAt: Date.now() }, data);
    if (data.online === false) {
        var now = Date.now();
        AUTOPC_TELEMETRIA_PC = Object.assign({}, AUTOPC_TELEMETRIA_PC || {}, {
            engineState: 'OFFLINE',
            phase: 'OFFLINE',
            antigravityVisible: false,
            antigravityMinimized: false,
            mqttConnected: false,
            _transport: 'mqtt',
            heartbeatAt: Number(data.ts) || now,
            updatedAt: now
        });
    } else if (data.online === true && AUTOPC_TELEMETRIA_PC && String(AUTOPC_TELEMETRIA_PC.engineState || '').toUpperCase() === 'OFFLINE') {
        AUTOPC_TELEMETRIA_PC = Object.assign({}, AUTOPC_TELEMETRIA_PC, {
            engineState: 'IDLE',
            phase: 'IDLE',
            mqttConnected: true,
            _transport: 'mqtt',
            heartbeatAt: Number(data.ts) || Date.now()
        });
    }
    if (typeof window.actualizarTarjetaMonitorAutoPCPerfil === 'function') {
        window.actualizarTarjetaMonitorAutoPCPerfil();
    }
}

function procesarTelemetriaMqttAutoPC(data) {
    if (!data || typeof data !== 'object') return;
    var now = Date.now();
    AUTOPC_TELEMETRIA_PC = Object.assign({}, data, {
        _transport: 'mqtt',
        _receivedAt: now,
        heartbeatAt: Number(data.heartbeatAt) || now
    });

    // Propagar resumen final recibido en telemetría hacia el mapa e idea correspondiente
    var respReqId = String(
        data.agLastResponseRequestId ||
        ((data.agPhaseCode === 'completed' && Number(data.runningCount || 0) === 0) ? (data.activeSourceId || '') : '')
    ).trim();
    var respText = String(data.agLastResponse || '').trim();
    if (respReqId && respText) {
        var syntheticDoc = {
            ideaId: respReqId,
            resumenAntigravity: respText,
            resumenVersion: String(data.agVersionDetected || '').trim(),
            resumenArchivos: Array.isArray(data.agFilesTouched) ? data.agFilesTouched.slice(0, 12) : [],
            updatedAt: Number(data.agLastResponseAt || data.heartbeatAt) || now
        };
        if (AUTOPC_SOLICITUDES_MAP[respReqId]) {
            if (!AUTOPC_SOLICITUDES_MAP[respReqId].resumenAntigravity) {
                AUTOPC_SOLICITUDES_MAP[respReqId] = Object.assign({}, AUTOPC_SOLICITUDES_MAP[respReqId], syntheticDoc);
            }
        }
        if (APP_STATE && Array.isArray(APP_STATE.ideas)) {
            var ideaResp = APP_STATE.ideas.find(function(i) { return i && String(i.id) === respReqId; });
            if (ideaResp && _sincronizarCamposResumenAutoPCEnIdea(ideaResp, syntheticDoc)) {
                MonarcaDB.save(APP_STATE);
                reRenderSiVistaIdeasActiva();
            }
        }
    }

    // Verificar si llegó un Implementation Plan esperando aprobación al instante vía MQTT
    var planPend = obtenerPlanPendienteAutoPC();
    var cambioPlan = false;
    if (planPend && planPend.planId && !planPend.decisionEnviada) {
        if (AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID !== planPend.planId) {
            AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID = planPend.planId;
            cambioPlan = true;
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca('Antigravity espera tu aprobación del Implementation Plan · Ábrelo en Perfil', '📋');
            }
        }
    } else if (AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID && (!planPend || planPend.decisionEnviada)) {
        var prevSafe = String(AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID).replace(/[^a-zA-Z0-9_@.-]/g, '_');
        if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
            window.cancelarNotificacionTelefonoPorAlerta('alerta-autopc-plan-' + prevSafe);
        }
        AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID = '';
        cambioPlan = true;
    }

    if (cambioPlan && typeof actualizarBadgeNotificaciones === 'function') {
        actualizarBadgeNotificaciones();
    }
    if (typeof window.actualizarTarjetaMonitorAutoPCPerfil === 'function') {
        window.actualizarTarjetaMonitorAutoPCPerfil();
    }
}

function procesarColaMqttAutoPC(snap) {
    if (!snap || typeof snap !== 'object') return;
    var now = Date.now();
    var snapTs = Number(snap.updatedAt || snap.ts) || now;
    var itemsById = {};
    var runningIds = {};
    var docsDone = [];
    var tel = AUTOPC_TELEMETRIA_PC || null;
    var items = Array.isArray(snap.items) ? snap.items : [];
    items.forEach(function(it) {
        if (!it) return;
        var sid = String(it.sourceId || it.id || '').trim();
        if (!sid) return;
        var st = String(it.status || 'pending').toLowerCase();
        var itemTs = Number(it.updatedAt || it.startedAt || snapTs) || now;
        var mergedEntry = Object.assign({}, it, { status: st, updatedAt: itemTs });
        if (st === 'done' && !mergedEntry.resumenAntigravity && tel && String(tel.agLastResponseRequestId || '') === sid && tel.agLastResponse) {
            mergedEntry.resumenAntigravity = String(tel.agLastResponse);
            mergedEntry.resumenVersion = mergedEntry.resumenVersion || String(tel.agVersionDetected || '');
            mergedEntry.resumenArchivos = Array.isArray(tel.agFilesTouched) ? tel.agFilesTouched.slice(0, 12) : [];
        }
        itemsById[sid] = mergedEntry;
        if (st === 'running' || st === 'awaiting_plan') {
            runningIds[sid] = true;
        }
        // Sincronizar mapa local con la verdad autoritativa de Auto-PC
        if (AUTOPC_SOLICITUDES_MAP[sid]) {
            var mapDoc = AUTOPC_SOLICITUDES_MAP[sid];
            if (mapDoc.status !== st) {
                mapDoc.status = st;
                mapDoc.updatedAt = itemTs;
            }
            if (mergedEntry.resumenVersion && !mapDoc.resumenVersion) {
                mapDoc.resumenVersion = String(mergedEntry.resumenVersion);
            }
            if (mergedEntry.resumenAntigravity && !mapDoc.resumenAntigravity) {
                mapDoc.resumenAntigravity = String(mergedEntry.resumenAntigravity);
            }
            if (Array.isArray(mergedEntry.resumenArchivos) && mergedEntry.resumenArchivos.length > 0 && (!mapDoc.resumenArchivos || mapDoc.resumenArchivos.length === 0)) {
                mapDoc.resumenArchivos = mergedEntry.resumenArchivos.slice(0, 12);
            }
        } else {
            AUTOPC_SOLICITUDES_MAP[sid] = {
                ideaId: sid,
                text: String(it.text || 'Solicitud Auto-PC'),
                status: st,
                updatedAt: itemTs,
                createdAt: Number(it.startedAt || itemTs) || now,
                resumenVersion: String(mergedEntry.resumenVersion || ''),
                resumenAntigravity: String(mergedEntry.resumenAntigravity || ''),
                resumenArchivos: Array.isArray(mergedEntry.resumenArchivos) ? mergedEntry.resumenArchivos.slice(0, 12) : []
            };
        }
        if (st === 'done') {
            docsDone.push(AUTOPC_SOLICITUDES_MAP[sid]);
        }
    });

    // Purgar fantasmas 'running' / 'awaiting_plan' heredados de Firestore cuando la cola autoritativa de Auto-PC confirma que no están corriendo
    if (snap.authoritative) {
        Object.keys(AUTOPC_SOLICITUDES_MAP || {}).forEach(function(key) {
            var d = AUTOPC_SOLICITUDES_MAP[key];
            if (!d) return;
            var stOld = String(d.status || '').toLowerCase();
            if ((stOld === 'running' || stOld === 'awaiting_plan') && !runningIds[key]) {
                if (itemsById[key] && itemsById[key].status === 'done') {
                    d.status = 'done';
                    d.updatedAt = Number(itemsById[key].updatedAt) || snapTs;
                    docsDone.push(d);
                } else if (snap.counts && Number(snap.counts.running) === 0) {
                    d.status = 'done';
                    d.updatedAt = snapTs;
                    docsDone.push(d);
                }
            }
        });
    }

    AUTOPC_MQTT_QUEUE_SNAPSHOT = {
        ts: Number(snap.ts || snap.updatedAt) || now,
        receivedAt: now,
        authoritative: Boolean(snap.authoritative),
        counts: snap.counts || { pending: 0, running: 0, awaitingPlan: 0, done: 0, total: items.length },
        items: items,
        itemsById: itemsById
    };

    var completadasAhora = 0;
    var nuevasNotifs = 0;
    var changedIdea = false;
    var ideasPorId = {};

    if (APP_STATE && Array.isArray(APP_STATE.ideas)) {
        APP_STATE.ideas.forEach(function(idea) {
            if (!idea || !idea.id) return;
            var key = String(idea.id);
            ideasPorId[key] = idea;
            var entry = itemsById[key] || (AUTOPC_SOLICITUDES_MAP[key] && AUTOPC_SOLICITUDES_MAP[key].status === 'done' ? AUTOPC_SOLICITUDES_MAP[key] : null);
            if (!entry) return;
            var stEntry = String(entry.status || '').toLowerCase();
            if (!idea.hecha && (stEntry === 'running' || stEntry === 'awaiting_plan' || stEntry === 'pending')) {
                if (idea.autopcStatus !== stEntry || idea.autopcPendienteSubida) {
                    idea.autopcStatus = stEntry;
                    idea.autopcPendienteSubida = false;
                    changedIdea = true;
                }
            } else if (stEntry === 'done') {
                var resDone = _marcarIdeaCompletadaPorAutoPC(idea, AUTOPC_SOLICITUDES_MAP[key] || entry, Number(entry.updatedAt) || snapTs);
                if (resDone.changed) changedIdea = true;
                if (resDone.completedNow) completadasAhora++;
            }
        });
    }

    docsDone.forEach(function(docRem) {
        var solId = String((docRem && (docRem.ideaId || docRem.id)) || '').trim();
        if (!solId) return;
        var ideaAsoc = ideasPorId[solId] || null;
        if (registrarNotificacionSolicitudAutoPC(docRem, ideaAsoc)) {
            nuevasNotifs++;
        }
    });

    if (completadasAhora > 0 && typeof sumarExp === 'function') {
        sumarExp(15 * completadasAhora);
    }
    if (changedIdea || completadasAhora > 0 || nuevasNotifs > 0) {
        MonarcaDB.save(APP_STATE);
        if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
        var modalNotifQ = document.getElementById('modal-centro-notificaciones');
        if (modalNotifQ && modalNotifQ.style.display === 'flex' && typeof renderizarCentroNotificaciones === 'function') {
            renderizarCentroNotificaciones();
        }
        reRenderSiVistaIdeasActiva();
    }
    if (completadasAhora > 0 && typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca(
            completadasAhora === 1
                ? 'Auto-PC completó 1 solicitud (+15 EXP) ⚡'
                : ('Auto-PC completó ' + completadasAhora + ' solicitudes (+' + (15 * completadasAhora) + ' EXP) ⚡'),
            '✅'
        );
    }

    if (typeof window.actualizarTarjetaMonitorAutoPCPerfil === 'function') {
        window.actualizarTarjetaMonitorAutoPCPerfil();
    }
}

function procesarEventoMqttAutoPC(ev) {
    if (!ev || typeof ev !== 'object') return;
    var evId = String(ev.eventId || '').trim();
    if (evId) {
        if (AUTOPC_MQTT_PROCESSED_EVENTS[evId]) return;
        AUTOPC_MQTT_PROCESSED_EVENTS[evId] = Date.now();
        var keys = Object.keys(AUTOPC_MQTT_PROCESSED_EVENTS);
        if (keys.length > 150) {
            delete AUTOPC_MQTT_PROCESSED_EVENTS[keys[0]];
        }
    }

    var evType = String(ev.type || '').toLowerCase();
    var sid = String(ev.ideaId || ev.sourceId || '').trim();
    var now = Number(ev.updatedAt || ev.ts) || Date.now();
    var idea = (APP_STATE && Array.isArray(APP_STATE.ideas) && sid)
        ? APP_STATE.ideas.find(function(i) { return i && String(i.id) === sid; })
        : null;

    if (evType === 'request_started' && sid) {
        AUTOPC_SOLICITUDES_MAP[sid] = Object.assign({}, AUTOPC_SOLICITUDES_MAP[sid] || {}, {
            ideaId: sid,
            text: String(ev.text || (idea && (idea.textoPrompt || idea.texto)) || 'Solicitud Auto-PC'),
            status: 'running',
            updatedAt: now
        });
        if (idea && !idea.hecha) {
            idea.autopcStatus = 'running';
            idea.autopcPendienteSubida = false;
            MonarcaDB.save(APP_STATE);
        }
        if (typeof mostrarToastMonarca === 'function') {
            var prevStart = String(ev.text || '').trim();
            mostrarToastMonarca(
                'Auto-PC inició: "' + (prevStart.length > 48 ? (prevStart.slice(0, 45) + '...') : (prevStart || sid)) + '"',
                '⚙️'
            );
        }
        reRenderSiVistaIdeasActiva();
        if (typeof window.actualizarTarjetaMonitorAutoPCPerfil === 'function') {
            window.actualizarTarjetaMonitorAutoPCPerfil();
        }
        return;
    }

    if (evType === 'plan_required') {
        if (sid) {
            AUTOPC_SOLICITUDES_MAP[sid] = Object.assign({}, AUTOPC_SOLICITUDES_MAP[sid] || {}, {
                ideaId: sid,
                text: String(ev.text || ev.requestText || (idea && (idea.textoPrompt || idea.texto)) || 'Solicitud Auto-PC'),
                status: 'awaiting_plan',
                planId: String(ev.planId || ''),
                planMessage: String(ev.planMessage || ''),
                planMarkdown: String(ev.planMarkdown || ''),
                planUpdatedAt: Number(ev.planUpdatedAt) || now,
                updatedAt: now
            });
        }
        if (idea && !idea.hecha) {
            idea.autopcStatus = 'awaiting_plan';
            if (ev.planId) idea.autopcPlanId = String(ev.planId);
            MonarcaDB.save(APP_STATE);
        }
        AUTOPC_TELEMETRIA_PC = Object.assign({}, AUTOPC_TELEMETRIA_PC || {}, {
            _transport: 'mqtt',
            phase: 'WAITING_PLAN_APPROVAL',
            agAwaitingPlan: true,
            agPlanId: String(ev.planId || ''),
            agPlanMessage: String(ev.planMessage || ''),
            agPlanMarkdown: String(ev.planMarkdown || ''),
            agPlanUpdatedAt: Number(ev.planUpdatedAt) || now,
            activeSourceId: sid || (AUTOPC_TELEMETRIA_PC && AUTOPC_TELEMETRIA_PC.activeSourceId) || '',
            activeText: String(ev.text || ev.requestText || (AUTOPC_TELEMETRIA_PC && AUTOPC_TELEMETRIA_PC.activeText) || ''),
            heartbeatAt: now
        });
        var planIdKey = String(ev.planId || ('plan-' + sid));
        if (planIdKey && AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID !== planIdKey) {
            AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID = planIdKey;
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca('Antigravity pide aprobación del Implementation Plan · Ábrelo en Perfil', '📋');
            }
        }
        if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
        var modalNotifPlan = document.getElementById('modal-centro-notificaciones');
        if (modalNotifPlan && modalNotifPlan.style.display === 'flex' && typeof renderizarCentroNotificaciones === 'function') {
            renderizarCentroNotificaciones();
        }
        reRenderSiVistaIdeasActiva();
        if (typeof window.actualizarTarjetaMonitorAutoPCPerfil === 'function') {
            window.actualizarTarjetaMonitorAutoPCPerfil();
        }
        return;
    }

    if (evType === 'request_completed' && sid) {
        var docDone = Object.assign({}, AUTOPC_SOLICITUDES_MAP[sid] || {}, ev, {
            ideaId: sid,
            status: 'done',
            updatedAt: now
        });
        AUTOPC_SOLICITUDES_MAP[sid] = docDone;

        var resEventDone = _marcarIdeaCompletadaPorAutoPC(idea, docDone, now);
        var completadaAhora = resEventDone.completedNow;

        var nuevaNotif = registrarNotificacionSolicitudAutoPC(docDone, idea);
        if (completadaAhora && typeof sumarExp === 'function') {
            sumarExp(15);
        }
        if (resEventDone.changed || nuevaNotif || idea) {
            MonarcaDB.save(APP_STATE);
        }
        if (typeof mostrarToastMonarca === 'function') {
            var txtDone = String(docDone.text || (idea && (idea.textoPrompt || idea.texto)) || '').trim();
            var prevDone = txtDone.length > 48 ? (txtDone.slice(0, 45) + '...') : (txtDone || 'Solicitud');
            mostrarToastMonarca(
                completadaAhora
                    ? ('Auto-PC completó "' + prevDone + '" (+15 EXP) ⚡')
                    : ('Solicitud completada en Auto-PC: "' + prevDone + '" ⚡'),
                '✅'
            );
        }
        if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
        var modalNotifDone = document.getElementById('modal-centro-notificaciones');
        if (modalNotifDone && modalNotifDone.style.display === 'flex' && typeof renderizarCentroNotificaciones === 'function') {
            renderizarCentroNotificaciones();
        }
        reRenderSiVistaIdeasActiva();
        if (typeof window.actualizarTarjetaMonitorAutoPCPerfil === 'function') {
            window.actualizarTarjetaMonitorAutoPCPerfil();
        }
        return;
    }

    if (evType === 'queue_completed') {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Auto-PC completó toda la cola de solicitudes 🏁', '🏁');
        }
        if (typeof window.actualizarTarjetaMonitorAutoPCPerfil === 'function') {
            window.actualizarTarjetaMonitorAutoPCPerfil();
        }
    }
}

function procesarSnapshotAutoPCIdeas(lista) {
    var nuevoMapa = {};
    var docsDone = [];
    var nuevaTelemetria = null;
    var nuevaDecisionPlan = null;
    var nuevaConfigMqtt = null;
    if (Array.isArray(lista)) {
        lista.forEach(function(item) {
            if (!item) return;
            var key = String(item.ideaId || item.id || '').trim();
            var docType = String(item.docType || '').toLowerCase();
            // Ignorar explícitamente el documento _signal para que nunca sobrescriba _estado_pc
            if (docType === 'signal' || key === '_signal') {
                return;
            }
            if (docType === 'mqtt_config' || key === '_mqtt_config') {
                nuevaConfigMqtt = Object.assign({}, item);
                return;
            }
            if (docType === 'plan_decision' || key === '_plan_decision') {
                nuevaDecisionPlan = Object.assign({}, item);
                return;
            }
            if (docType === 'telemetry' || key === '_estado_pc') {
                nuevaTelemetria = Object.assign({}, item);
                return;
            }
            if (key && key.indexOf('_') === 0) {
                return;
            }
            if (key) {
                nuevoMapa[key] = item;
            }
            if (String(item.status || '').toLowerCase() === 'done') {
                docsDone.push(item);
            }
        });
    }
    if (nuevaConfigMqtt && window.MonarcaMQTT && typeof window.MonarcaMQTT.aplicarConfigPairingDesdeNube === 'function') {
        window.MonarcaMQTT.aplicarConfigPairingDesdeNube(nuevaConfigMqtt);
    }

    // Preservar estados más frescos si MQTT autoritativo ya marcó algún ítem como done/running
    if (AUTOPC_MQTT_QUEUE_SNAPSHOT && AUTOPC_MQTT_QUEUE_SNAPSHOT.authoritative) {
        var mqttItems = AUTOPC_MQTT_QUEUE_SNAPSHOT.itemsById || {};
        var mqttRunningZero = AUTOPC_MQTT_QUEUE_SNAPSHOT.counts && Number(AUTOPC_MQTT_QUEUE_SNAPSHOT.counts.running) === 0;
        Object.keys(nuevoMapa).forEach(function(k) {
            var d = nuevoMapa[k];
            if (!d) return;
            var stFs = String(d.status || '').toLowerCase();
            if (mqttItems[k] && mqttItems[k].status === 'done' && (stFs === 'running' || stFs === 'awaiting_plan')) {
                d.status = 'done';
                if (!d.resumenVersion && mqttItems[k].resumenVersion) d.resumenVersion = mqttItems[k].resumenVersion;
                if (!d.resumenAntigravity && mqttItems[k].resumenAntigravity) d.resumenAntigravity = mqttItems[k].resumenAntigravity;
                docsDone.push(d);
            } else if (mqttRunningZero && (stFs === 'running' || stFs === 'awaiting_plan') && (!mqttItems[k] || mqttItems[k].status !== 'running')) {
                d.status = 'done';
                docsDone.push(d);
            }
        });
    }

    AUTOPC_SOLICITUDES_MAP = nuevoMapa;
    if (nuevaTelemetria) {
        var curTs = (AUTOPC_TELEMETRIA_PC && Number(AUTOPC_TELEMETRIA_PC.heartbeatAt)) || 0;
        var fsTs = Number(nuevaTelemetria.heartbeatAt) || 0;
        var curIsFreshMqtt = Boolean(
            AUTOPC_TELEMETRIA_PC &&
            AUTOPC_TELEMETRIA_PC._transport === 'mqtt' &&
            curTs >= fsTs &&
            (Date.now() - (Number(AUTOPC_TELEMETRIA_PC._receivedAt) || curTs)) < 180000
        );
        if (!curIsFreshMqtt) {
            AUTOPC_TELEMETRIA_PC = nuevaTelemetria;
        }
    }
    if (nuevaDecisionPlan) {
        AUTOPC_PLAN_DECISION_DOC = nuevaDecisionPlan;
    }

    if (!APP_STATE) {
        return { completadasAhora: 0, huboCambioEstado: false, nuevasNotificaciones: 0 };
    }
    if (!Array.isArray(APP_STATE.ideas)) APP_STATE.ideas = [];

    var completadasAhora = 0;
    var huboCambioEstado = false;
    var nuevasNotificaciones = 0;
    var notificacionesPurgadas = 0;
    var ideasPorId = {};

    APP_STATE.ideas.forEach(function(idea) {
        if (!idea) return;
        ideasPorId[String(idea.id)] = idea;
        var docRemoto = AUTOPC_SOLICITUDES_MAP[String(idea.id)];
        if (docRemoto) {
            var statusRemoto = String(docRemoto.status || 'pending').toLowerCase();
            if (statusRemoto === 'done') {
                var resSnapDone = _marcarIdeaCompletadaPorAutoPC(idea, docRemoto, Number(docRemoto.updatedAt) || Date.now());
                if (resSnapDone.changed) huboCambioEstado = true;
                if (resSnapDone.completedNow) completadasAhora++;
            } else if (statusRemoto === 'awaiting_plan') {
                // v11.25: NUNCA marcar como hecha cuando Antigravity solo pide aprobación del Implementation Plan
                if (!idea.hecha) {
                    if (idea.autopcStatus !== 'awaiting_plan' || idea.autopcPendienteSubida) {
                        huboCambioEstado = true;
                    }
                    idea.autopcStatus = 'awaiting_plan';
                    idea.autopcPendienteSubida = false;
                    if (docRemoto.planId && idea.autopcPlanId !== String(docRemoto.planId)) {
                        idea.autopcPlanId = String(docRemoto.planId);
                    }
                }
            } else if (statusRemoto === 'running' || statusRemoto === 'pending') {
                if (!idea.hecha) {
                    if (idea.autopcStatus !== statusRemoto || idea.autopcPendienteSubida) {
                        huboCambioEstado = true;
                    }
                    idea.autopcStatus = statusRemoto;
                    idea.autopcPendienteSubida = false;
                }
            }
        } else if (!idea.hecha && !idea.autopcPendienteSubida && idea.autopcStatus && idea.autopcStatus !== 'done') {
            idea.autopcStatus = null;
            huboCambioEstado = true;
        }
    });

    docsDone.forEach(function(docRemoto) {
        var solId = String(docRemoto.ideaId || docRemoto.id || '').trim();
        var ideaAsociada = ideasPorId[solId] || null;
        if (registrarNotificacionSolicitudAutoPC(docRemoto, ideaAsociada)) {
            nuevasNotificaciones++;
        }
    });

    // Purgar proactivamente cualquier notificación ya confirmada, eliminada o marcada hecha
    if (Array.isArray(APP_STATE.notificacionesAutoPC) && APP_STATE.notificacionesAutoPC.length > 0) {
        var vistosActivas = {};
        var purgadas = [];
        APP_STATE.notificacionesAutoPC = APP_STATE.notificacionesAutoPC.filter(function(n) {
            if (!n || !n.id) return false;
            var solId = _extraerSolicitudIdAutoPC(n);
            var docRem = solId ? AUTOPC_SOLICITUDES_MAP[solId] : null;
            var ideaRef = solId ? ideasPorId[solId] : null;
            if (_esNotificacionAutoPCDescartada(n.id, solId, docRem, ideaRef)) {
                purgadas.push(String(n.id));
                return false;
            }
            var dedupKey = solId || String(n.id);
            if (vistosActivas[dedupKey]) {
                return false;
            }
            vistosActivas[dedupKey] = true;
            return true;
        });
        notificacionesPurgadas = purgadas.length;
        if (purgadas.length > 0 && typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
            purgadas.forEach(function(nid) {
                window.cancelarNotificacionTelefonoPorAlerta('alerta-autopc-' + nid);
            });
        }
    }

    // v11.25: Detectar nuevo Implementation Plan esperando aprobación y disparar alerta al teléfono
    var planPend = obtenerPlanPendienteAutoPC();
    var cambioPlanNotif = false;
    if (planPend && planPend.planId && !planPend.decisionEnviada) {
        if (AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID !== planPend.planId) {
            AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID = planPend.planId;
            cambioPlanNotif = true;
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca('Antigravity espera tu aprobación del Implementation Plan · Ábrelo en Perfil', '📋');
            }
        }
    } else if (AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID) {
        var prevSafePlanId = String(AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID).replace(/[^a-zA-Z0-9_@.-]/g, '_');
        if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
            window.cancelarNotificacionTelefonoPorAlerta('alerta-autopc-plan-' + prevSafePlanId);
        }
        AUTOPC_ULTIMO_PLAN_NOTIFICADO_ID = '';
        cambioPlanNotif = true;
    }

    if (completadasAhora > 0) {
        if (typeof sumarExp === 'function') {
            sumarExp(15 * completadasAhora);
        }
        MonarcaDB.save(APP_STATE);
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca(
                completadasAhora === 1
                    ? 'Auto-PC completó 1 idea (+15 EXP)'
                    : ('Auto-PC completó ' + completadasAhora + ' ideas (+' + (15 * completadasAhora) + ' EXP)'),
                '✅'
            );
        }
    } else if (nuevasNotificaciones > 0 || notificacionesPurgadas > 0 || huboCambioEstado) {
        MonarcaDB.save(APP_STATE);
        if (nuevasNotificaciones > 0 && typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca(
                nuevasNotificaciones === 1
                    ? 'Auto-PC añadió 1 solicitud · 🔔 Revisar alertas'
                    : ('Auto-PC añadió ' + nuevasNotificaciones + ' solicitudes · 🔔 Revisar alertas'),
                '🤖'
            );
        }
    }

    if (nuevasNotificaciones > 0 || notificacionesPurgadas > 0 || cambioPlanNotif) {
        if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
        var modalNotif = document.getElementById('modal-centro-notificaciones');
        if (modalNotif && modalNotif.style.display === 'flex' && typeof renderizarCentroNotificaciones === 'function') {
            renderizarCentroNotificaciones();
        }
    }

    reRenderSiVistaIdeasActiva();
    if (typeof window.actualizarTarjetaMonitorAutoPCPerfil === 'function') {
        window.actualizarTarjetaMonitorAutoPCPerfil();
    }
    return {
        completadasAhora: completadasAhora,
        huboCambioEstado: huboCambioEstado,
        nuevasNotificaciones: nuevasNotificaciones,
        notificacionesPurgadas: notificacionesPurgadas,
        planPendiente: Boolean(planPend)
    };
}

function formatearDuracionCortaAutoPC(ms) {
    var seg = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    if (seg < 60) return seg + 's';
    var min = Math.floor(seg / 60);
    var remS = seg % 60;
    if (min < 60) return min + 'm' + (remS > 0 ? (' ' + remS + 's') : '');
    var hrs = Math.floor(min / 60);
    return hrs + 'h ' + (min % 60) + 'm';
}

function obtenerEstadoTelemetryAutoPC() {
    return AUTOPC_TELEMETRIA_PC ? Object.assign({}, AUTOPC_TELEMETRIA_PC) : null;
}

function obtenerResumenMonitoreoAutoPC() {
    var now = Date.now();
    var tel = AUTOPC_TELEMETRIA_PC || null;
    var porId = {};
    var ideas = (typeof APP_STATE !== 'undefined' && APP_STATE && Array.isArray(APP_STATE.ideas))
        ? APP_STATE.ideas
        : [];

    ideas.forEach(function(idea) {
        if (!idea || !idea.id) return;
        porId[String(idea.id)] = idea;
    });

    var planItems = [];
    var runningItems = [];
    var pendingItems = [];
    var doneItems = [];
    var vistos = {};
    var offlinePending = 0;

    Object.keys(AUTOPC_SOLICITUDES_MAP || {}).forEach(function(key) {
        var docRemoto = AUTOPC_SOLICITUDES_MAP[key];
        if (!docRemoto) return;
        var st = String(docRemoto.status || 'pending').toLowerCase();
        var ideaLocal = porId[key] || null;
        var texto = String(docRemoto.text || (ideaLocal && (ideaLocal.textoPrompt || ideaLocal.texto)) || '').trim() || 'Solicitud Auto-PC';
        var tsUpdated = Number(docRemoto.updatedAt || docRemoto.createdAt) || 0;
        var tsCreated = Number(docRemoto.createdAt || docRemoto.updatedAt) || tsUpdated;
        var resumenAg = String(docRemoto.resumenAntigravity || (ideaLocal && ideaLocal.resumenAntigravity) || '').trim();
        var archivosAg = Array.isArray(docRemoto.resumenArchivos) && docRemoto.resumenArchivos.length > 0
            ? docRemoto.resumenArchivos
            : ((ideaLocal && Array.isArray(ideaLocal.resumenArchivos)) ? ideaLocal.resumenArchivos : []);
        var versionAg = String(docRemoto.resumenVersion || (ideaLocal && ideaLocal.resumenVersion) || '').trim();
        var itemObj = {
            id: key,
            texto: texto,
            status: st,
            updatedAt: tsUpdated,
            createdAt: tsCreated,
            ageMs: tsUpdated > 0 ? Math.max(0, now - tsUpdated) : null,
            resumenAntigravity: resumenAg,
            resumenArchivos: archivosAg,
            resumenVersion: versionAg
        };
        vistos[key] = true;
        if (st === 'awaiting_plan') planItems.push(itemObj);
        else if (st === 'running') runningItems.push(itemObj);
        else if (st === 'pending') pendingItems.push(itemObj);
        else if (st === 'done') doneItems.push(itemObj);
    });

    ideas.forEach(function(idea) {
        if (!idea || !idea.id) return;
        var key = String(idea.id);
        if (vistos[key]) return;
        var stLocal = (!idea.hecha && (idea.autopcPendienteSubida || idea.autopcStatus))
            ? (idea.autopcPendienteSubida ? 'offline' : String(idea.autopcStatus).toLowerCase())
            : (idea.completadaPorAutoPC ? 'done' : null);
        if (!stLocal) return;
        var textoLocal = String(idea.textoPrompt || idea.texto || '').trim() || 'Solicitud Auto-PC';
        var ts = Number(idea.timestampHecha || idea.timestamp) || 0;
        var obj = {
            id: key,
            texto: textoLocal,
            status: stLocal,
            updatedAt: ts,
            createdAt: Number(idea.timestamp) || ts,
            ageMs: ts > 0 ? Math.max(0, now - ts) : null,
            resumenAntigravity: String(idea.resumenAntigravity || '').trim(),
            resumenArchivos: Array.isArray(idea.resumenArchivos) ? idea.resumenArchivos : [],
            resumenVersion: String(idea.resumenVersion || '').trim()
        };
        if (stLocal === 'awaiting_plan') planItems.push(obj);
        else if (stLocal === 'running') runningItems.push(obj);
        else if (stLocal === 'pending' || stLocal === 'offline') {
            if (stLocal === 'offline') offlinePending++;
            pendingItems.push(obj);
        } else if (stLocal === 'done') {
            doneItems.push(obj);
        }
    });

    planItems.sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    runningItems.sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    pendingItems.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
    doneItems.sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });

    var heartbeatAt = (tel && Number(tel.heartbeatAt) > 0) ? Number(tel.heartbeatAt) : 0;
    var heartbeatAgeMs = heartbeatAt > 0 ? Math.max(0, now - heartbeatAt) : null;
    // Ventana tolerante (210s) alineada con el ritmo ahorro-cuota de Auto-PC (75s activo / 180s reposo)
    var HEARTBEAT_FRESH_MS = 210000;
    var proyecto = (tel && tel.projectTitle) ? String(tel.projectTitle).trim() : '';
    var detailTel = (tel && tel.detail) ? String(tel.detail).trim() : '';
    var busyTel = (tel && tel.busyReason) ? String(tel.busyReason).trim() : '';
    var agVisible = (tel && typeof tel.antigravityVisible === 'boolean') ? tel.antigravityVisible : null;
    var agMinimized = Boolean(tel && tel.antigravityMinimized);
    var engState = (tel && tel.engineState) ? String(tel.engineState).toUpperCase() : '';
    var phaseTel = (tel && tel.phase) ? String(tel.phase).toUpperCase() : '';

    var planPendiente = obtenerPlanPendienteAutoPC();

    var agLastStepAt = (tel && Number(tel.agLastStepAt) > 0) ? Number(tel.agLastStepAt) : 0;
    var agLastStepAgeMs = agLastStepAt > 0 ? Math.max(0, now - agLastStepAt) : null;
    var agLastResponse = String((tel && (tel.agLastResponse || tel.agFinalSummary)) || '').trim();
    var agLastResponseAt = Number((tel && (tel.agLastResponseAt || tel.agLastStepAt || tel.heartbeatAt)) || 0);
    var antigravityLive = (tel && (tel.agPhaseCode || tel.agCurrentAction || Number(tel.agStepsCount) > 0 || tel.agAwaitingPlan || agLastResponse))
        ? {
            phaseCode: String(tel.agPhaseCode || (tel.agAwaitingPlan ? 'awaiting_plan' : 'thinking')),
            phaseLabel: String(tel.agPhaseLabel || (tel.agAwaitingPlan ? '📋 Esperando aprobación de Plan' : '⚙️ Trabajando en Antigravity')),
            progressPct: Math.max(0, Math.min(100, Number(tel.agProgressPct) || 0)),
            currentAction: String(tel.agCurrentAction || '').trim(),
            stepsCount: Number(tel.agStepsCount) || 0,
            filesTouched: Array.isArray(tel.agFilesTouched) ? tel.agFilesTouched.slice(0, 8) : [],
            recentSteps: Array.isArray(tel.agRecentSteps) ? tel.agRecentSteps.slice(-6) : [],
            lastStepAt: agLastStepAt,
            lastStepAgeMs: agLastStepAgeMs,
            versionDetected: String(tel.agVersionDetected || '').trim(),
            conversationId: String(tel.agConversationId || '').trim(),
            awaitingPlan: Boolean(tel.agAwaitingPlan),
            lastResponse: agLastResponse
        }
        : null;

    var telFresh = Boolean(tel && heartbeatAgeMs !== null && heartbeatAgeMs <= HEARTBEAT_FRESH_MS);
    var mqttQueueFresh = Boolean(
        AUTOPC_MQTT_QUEUE_SNAPSHOT &&
        AUTOPC_MQTT_QUEUE_SNAPSHOT.authoritative &&
        (now - (Number(AUTOPC_MQTT_QUEUE_SNAPSHOT.receivedAt || AUTOPC_MQTT_QUEUE_SNAPSHOT.ts) || 0)) <= 120000
    );

    // Fix definitivo de solicitudes fantasma ('12h 53m · Detenido con cola'):
    // Si Auto-PC vivo (o su cola autoritativa por MQTT) confirma que NO hay nada ejecutándose,
    // no permitir que un documento viejo atascado en Firestore como 'running' falsifique TRABAJANDO AHORA.
    var pcConfirmsNoRunning = Boolean(
        (mqttQueueFresh && Number((AUTOPC_MQTT_QUEUE_SNAPSHOT.counts || {}).running) === 0) ||
        (telFresh && engState !== 'OFFLINE' && Number(tel.runningCount || 0) === 0 && !tel.agAwaitingPlan)
    );
    if (pcConfirmsNoRunning && runningItems.length > 0) {
        var mqttMap = (AUTOPC_MQTT_QUEUE_SNAPSHOT && AUTOPC_MQTT_QUEUE_SNAPSHOT.itemsById) || {};
        var keptRunning = [];
        runningItems.forEach(function(item) {
            var mEntry = mqttMap[item.id];
            if (mEntry && (mEntry.status === 'running' || mEntry.status === 'awaiting_plan')) {
                keptRunning.push(item);
            } else {
                // Tratar como ya completada en la vista para evitar falsos avisos de 'Detenido con cola'
                doneItems.push(Object.assign({}, item, { status: 'done' }));
            }
        });
        runningItems = keptRunning;
        doneItems.sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    }

    var countRunning = runningItems.length + planItems.length;
    var countPending = pendingItems.length;
    var countDone = doneItems.length;
    if (mqttQueueFresh && AUTOPC_MQTT_QUEUE_SNAPSHOT.counts) {
        countRunning = Number(AUTOPC_MQTT_QUEUE_SNAPSHOT.counts.running) || 0;
        countPending = (Number(AUTOPC_MQTT_QUEUE_SNAPSHOT.counts.pending) || 0) + offlinePending;
        countDone = Math.max(countDone, Number(AUTOPC_MQTT_QUEUE_SNAPSHOT.counts.done) || 0);
    } else if (telFresh) {
        countRunning = Math.max(countRunning, Number(tel.runningCount) || 0);
        countPending = Math.max(countPending, Number(tel.pendingCount) || 0);
        countDone = Math.max(countDone, Number(tel.doneCount) || 0);
    }

    var primaryRunning = planItems[0] || runningItems[0] || null;
    if (!primaryRunning && tel && (Number(tel.runningCount) || 0) > 0 && tel.activeText && telFresh) {
        var phTs = Number(tel.agStartedAt || tel.phaseChangedAt || tel.heartbeatAt) || now;
        primaryRunning = {
            id: String(tel.activeSourceId || 'pc-active'),
            texto: String(tel.activeText),
            status: planPendiente ? 'awaiting_plan' : 'running',
            updatedAt: phTs,
            createdAt: phTs,
            ageMs: Math.max(0, now - phTs)
        };
    }

    var primaryCandidate = primaryRunning || pendingItems[0] || null;
    var enCursoBaseTs = primaryRunning
        ? (Number(primaryRunning.updatedAt || primaryRunning.createdAt) || 0)
        : ((tel && Number(tel.phaseChangedAt)) ? Number(tel.phaseChangedAt) : 0);
    var enCursoAgeMs = enCursoBaseTs > 0 ? Math.max(0, now - enCursoBaseTs) : 0;

    var nivel = 'idle';
    var badgeTexto = 'Sin actividad reciente';
    var resumenTexto = 'No hay solicitudes en cola ni actividad pendiente en Auto-PC.';
    var alertaStuck = '';

    var agRecienActivo = agLastStepAgeMs !== null && agLastStepAgeMs <= 180000;

    if (tel && engState === 'OFFLINE') {
        nivel = (countPending > 0 || countRunning > 0 || planPendiente) ? 'warning' : 'offline';
        badgeTexto = 'Auto-PC cerrado';
        resumenTexto = (countPending > 0 || countRunning > 0)
            ? ('Auto-PC se cerró con ' + (countPending + countRunning) + ' solicitud(es) pendiente(s).')
            : 'Auto-PC se cerró correctamente en tu computadora.';
        if (countPending > 0 || countRunning > 0) {
            alertaStuck = 'El programa Auto-PC fue cerrado en la PC; ábrelo para continuar la cola.';
        }
    } else if (planPendiente) {
        nivel = 'plan';
        badgeTexto = planPendiente.decisionEnviada
            ? 'Enviando tu respuesta...'
            : 'Plan esperando aprobación';
        resumenTexto = planPendiente.decisionEnviada
            ? 'Decisión enviada a Auto-PC. Retomando Antigravity con tus indicaciones...'
            : 'Cola detenida automáticamente hasta que apruebes o indiques qué hacer con este Implementation Plan.';
    } else if (tel && heartbeatAgeMs !== null && heartbeatAgeMs <= HEARTBEAT_FRESH_MS) {
        if (engState === 'ERROR') {
            nivel = 'stalled';
            badgeTexto = 'Error en Auto-PC';
            resumenTexto = detailTel || 'El motor de Auto-PC reportó un error.';
            alertaStuck = 'Revisa la ventana de Auto-PC en tu computadora para ver el detalle del error.';
        } else if (engState === 'PAUSED') {
            nivel = 'paused';
            badgeTexto = 'En pausa';
            resumenTexto = countPending > 0
                ? ('Motor en pausa con ' + countPending + ' solicitud(es) en espera.')
                : 'Auto-PC está conectado pero en pausa.';
            if (countPending > 0) {
                alertaStuck = 'Auto-PC está en pausa; reanúdalo para procesar la cola pendiente.';
            }
        } else if (engState === 'IDLE' || engState === 'STOPPED') {
            if (countPending > 0 || countRunning > 0) {
                nivel = 'warning';
                badgeTexto = 'Detenido con cola';
                resumenTexto = 'Auto-PC está detenido aunque quedan solicitudes por procesar.';
                alertaStuck = 'Pulsa Iniciar en Auto-PC para retomar las solicitudes pendientes.';
            } else {
                nivel = 'idle';
                badgeTexto = 'Listo en PC';
                resumenTexto = detailTel || 'Auto-PC en espera; listo para iniciar al recibir nuevas ideas.';
            }
        } else if (engState === 'RUNNING') {
            if (detailTel.indexOf('cubriendo la ventana') !== -1 || detailTel.indexOf('Caja de texto cubierta') !== -1) {
                nivel = 'warning';
                badgeTexto = 'Ventana cubierta';
                resumenTexto = detailTel;
                alertaStuck = 'La ventana de Auto-PC tapa el chat objetivo; usa Mini HUD o muévela a un lado.';
            } else if (agVisible === false && agMinimized && countPending > 0 && countRunning === 0 && phaseTel === 'READY_TO_SEND') {
                nivel = 'warning';
                badgeTexto = 'Antigravity minimizado';
                resumenTexto = detailTel || 'La ventana de Antigravity está minimizada y espera restauración para enviar la siguiente solicitud.';
                alertaStuck = 'Restaura la ventana de Antigravity en tu PC para enviar la solicitud pendiente.';
            } else if (agVisible === false && !agMinimized && !agRecienActivo && (countRunning > 0 || countPending > 0)) {
                nivel = 'warning';
                badgeTexto = 'Sin Antigravity';
                resumenTexto = detailTel || 'Auto-PC no detecta la ventana de Antigravity.';
                alertaStuck = 'Abre o deja visible Antigravity con el proyecto en tu PC.';
            } else if ((countRunning > 0 || phaseTel === 'WAITING_RESPONSE' || phaseTel === 'WAIT_CURRENT') && enCursoAgeMs > 900000 && !agRecienActivo) {
                nivel = 'stalled';
                badgeTexto = 'Posible traba (>15m)';
                resumenTexto = detailTel || ('Lleva ' + formatearDuracionCortaAutoPC(enCursoAgeMs) + ' sin nuevos pasos.');
                alertaStuck = 'La solicitud supera 15 minutos sin nuevos pasos en Antigravity; verifica si terminó o espera confirmación.';
            } else if (countRunning > 0 || busyTel || phaseTel === 'WAITING_RESPONSE' || phaseTel === 'WAIT_CURRENT' || phaseTel === 'READY_TO_SEND') {
                nivel = 'working';
                badgeTexto = (antigravityLive && antigravityLive.phaseLabel) ? antigravityLive.phaseLabel : 'Trabajando en proyecto';
                resumenTexto = (antigravityLive && antigravityLive.currentAction)
                    ? antigravityLive.currentAction
                    : (detailTel || (busyTel ? ('Antigravity activo (' + busyTel + ')') : 'Ejecutando solicitud actual en Antigravity...'));
            } else {
                nivel = 'idle';
                badgeTexto = 'Activo y vigilando';
                resumenTexto = detailTel || 'Vigilando botón Submit y escuchando nuevas ideas desde Emily.';
            }
        }
    } else if (tel && heartbeatAgeMs !== null && heartbeatAgeMs > HEARTBEAT_FRESH_MS) {
        if (countRunning > 0 || countPending > 0) {
            nivel = 'stalled';
            badgeTexto = 'Sin latido reciente';
            resumenTexto = 'Sin señal de Auto-PC desde hace ' + formatearDuracionCortaAutoPC(heartbeatAgeMs) + '.';
            alertaStuck = 'No llega latido reciente desde tu PC; revisa si Auto-PC se cerró, la PC se suspendió o perdió internet.';
        } else {
            nivel = 'offline';
            badgeTexto = 'Sin señal reciente';
            resumenTexto = 'Última conexión de Auto-PC hace ' + formatearDuracionCortaAutoPC(heartbeatAgeMs) + '.';
        }
    } else {
        if (countRunning > 0) {
            if (enCursoAgeMs > 900000) {
                nivel = 'stalled';
                badgeTexto = 'Posible traba (>15m)';
                resumenTexto = 'Lleva ' + formatearDuracionCortaAutoPC(enCursoAgeMs) + ' en estado Programando en PC.';
                alertaStuck = 'Más de 15 minutos sin pasar a Lista; verifica Auto-PC en tu computadora.';
            } else {
                nivel = 'working';
                badgeTexto = 'Programando en PC';
                resumenTexto = 'Auto-PC tomó la solicitud y la está ejecutando en tu computadora.';
            }
        } else if (countPending > 0) {
            var waitBase = Number(pendingItems[0].createdAt || pendingItems[0].updatedAt) || now;
            var waitMs = Math.max(0, now - waitBase);
            if (offlinePending > 0 && offlinePending === countPending) {
                nivel = 'warning';
                badgeTexto = 'Pendiente de subir';
                resumenTexto = 'Guardado localmente; se enviará en cuanto regrese la conexión a la nube.';
            } else if (waitMs > 180000) {
                nivel = 'warning';
                badgeTexto = 'Pendiente sin tomar';
                resumenTexto = 'En cola hace ' + formatearDuracionCortaAutoPC(waitMs) + ' sin latido de Auto-PC.';
                alertaStuck = 'Auto-PC aún no toma la solicitud; revisa que el programa esté abierto y conectado.';
            } else {
                nivel = 'pending';
                badgeTexto = 'En cola para PC';
                resumenTexto = 'Esperando a que Auto-PC inicie la solicitud pendiente.';
            }
        } else if (countDone > 0) {
            nivel = 'idle';
            badgeTexto = 'Cola al día';
            resumenTexto = 'Todas las solicitudes recientes ya pasaron a Lista.';
        }
    }

    var solicitudActual = null;
    if (primaryCandidate) {
        solicitudActual = {
            id: primaryCandidate.id,
            texto: primaryCandidate.texto,
            status: primaryCandidate.status,
            elapsedMs: primaryRunning ? enCursoAgeMs : (primaryCandidate.ageMs || 0)
        };
    } else if (tel && tel.activeText && (nivel === 'working' || nivel === 'plan' || nivel === 'stalled' || nivel === 'warning')) {
        solicitudActual = {
            id: String(tel.activeSourceId || 'pc'),
            texto: String(tel.activeText),
            status: planPendiente ? 'awaiting_plan' : (countRunning > 0 ? 'running' : 'pending'),
            elapsedMs: enCursoAgeMs
        };
    }

    // Última respuesta completa de Antigravity (prioriza la más reciente entre solicitudes terminadas y telemetría directa)
    var ultimaRespuesta = null;
    var doneConRespuesta = doneItems.find(function(it) {
        return it && it.resumenAntigravity && it.resumenAntigravity.trim().length > 0;
    }) || null;
    var tsDoneResp = doneConRespuesta ? (Number(doneConRespuesta.updatedAt) || 0) : 0;

    if (doneConRespuesta && (!agLastResponse || tsDoneResp >= agLastResponseAt)) {
        ultimaRespuesta = {
            id: doneConRespuesta.id,
            requestText: doneConRespuesta.texto,
            respuesta: doneConRespuesta.resumenAntigravity,
            version: doneConRespuesta.resumenVersion || '',
            archivos: Array.isArray(doneConRespuesta.resumenArchivos) ? doneConRespuesta.resumenArchivos : [],
            updatedAt: tsDoneResp,
            ageMs: tsDoneResp > 0 ? Math.max(0, now - tsDoneResp) : null
        };
    } else if (agLastResponse) {
        ultimaRespuesta = {
            id: String((tel && tel.agLastResponseRequestId) || (tel && tel.activeSourceId) || 'ag-last'),
            requestText: String((tel && (tel.agLastResponseRequestText || tel.activeText)) || 'Última solicitud en Antigravity').trim(),
            respuesta: agLastResponse,
            version: String((tel && tel.agVersionDetected) || '').trim(),
            archivos: (tel && Array.isArray(tel.agFilesTouched)) ? tel.agFilesTouched.slice(0, 10) : [],
            updatedAt: agLastResponseAt,
            ageMs: agLastResponseAt > 0 ? Math.max(0, now - agLastResponseAt) : null
        };
    }

    var recientes = [];
    planItems.slice(0, 1).forEach(function(it) { recientes.push(it); });
    runningItems.slice(0, 1).forEach(function(it) {
        if (recientes.length < 4) recientes.push(it);
    });
    pendingItems.slice(0, 2).forEach(function(it) {
        if (recientes.length < 4) recientes.push(it);
    });
    doneItems.slice(0, 4).forEach(function(it) {
        if (recientes.length < 5) recientes.push(it);
    });

    var mqttStatus = (window.MonarcaMQTT && typeof window.MonarcaMQTT.getStatus === 'function')
        ? window.MonarcaMQTT.getStatus()
        : null;

    return {
        nivel: nivel,
        badgeTexto: badgeTexto,
        resumenTexto: resumenTexto,
        proyecto: proyecto,
        engineState: engState || '',
        transport: (tel && tel._transport === 'mqtt') ? 'mqtt' : 'cloud',
        mqtt: mqttStatus,
        antigravityVisible: agVisible,
        antigravityMinimized: agMinimized,
        heartbeatAgeMs: heartbeatAgeMs,
        enCursoAgeMs: enCursoAgeMs,
        antigravity: antigravityLive,
        planPendiente: planPendiente,
        ultimaRespuesta: ultimaRespuesta,
        cola: {
            running: countRunning,
            pending: countPending,
            offlinePending: offlinePending,
            done: countDone,
            totalActive: countRunning + countPending
        },
        solicitudActual: solicitudActual,
        recientes: recientes,
        alertaStuck: alertaStuck,
        detalleMotor: detailTel
    };
}

async function enviarDecisionPlanDesdePerfil(action, mensajePersonalizado) {
    var plan = obtenerPlanPendienteAutoPC();
    if (!plan || !plan.planId) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('No hay ningún Implementation Plan pendiente en este momento.', 'ℹ️');
        }
        return false;
    }

    var act = String(action || 'approve').toLowerCase() === 'reply' ? 'reply' : 'approve';
    var msg = String(mensajePersonalizado || '').trim();
    if (act === 'reply' && !msg) {
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Escribe tus indicaciones sobre el plan antes de enviar.', '⚠️');
        }
        var inp = document.getElementById('perfil-autopc-plan-reply-input');
        if (inp) inp.focus();
        return false;
    }
    if (act === 'approve' && !msg) {
        msg = 'Aprobado, procede con la implementación del plan.';
    }

    var payload = {
        planId: plan.planId,
        requestId: plan.requestId || '',
        action: act,
        mensaje: msg
    };

    AUTOPC_PLAN_DECISION_LOCAL[plan.planId] = {
        action: act,
        mensaje: msg,
        ts: Date.now()
    };

    // Cancelar alerta del teléfono inmediatamente para UX limpia
    var safePlanId = String(plan.planId).replace(/[^a-zA-Z0-9_@.-]/g, '_');
    if (typeof window.cancelarNotificacionTelefonoPorAlerta === 'function') {
        window.cancelarNotificacionTelefonoPorAlerta('alerta-autopc-plan-' + safePlanId);
    }
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof window.actualizarTarjetaMonitorAutoPCPerfil === 'function') {
        window.actualizarTarjetaMonitorAutoPCPerfil();
    }

    // Envío instantáneo por MQTT (<300ms) en paralelo con Firestore
    var enviadoMqtt = false;
    try {
        if (window.MonarcaMQTT && typeof window.MonarcaMQTT.enviarDecisionPlan === 'function') {
            enviadoMqtt = await window.MonarcaMQTT.enviarDecisionPlan(payload);
        }
    } catch (eMqtt) {}

    var enviadoCloud = false;
    try {
        if (window.MonarcaCloud && typeof window.MonarcaCloud.enviarDecisionPlanAntigravity === 'function') {
            enviadoCloud = await window.MonarcaCloud.enviarDecisionPlanAntigravity(payload);
        }
    } catch (err) {
        console.warn('[AutoPC Plan] Error enviando decisión a Firestore:', err);
    }

    // Best-effort por LAN Bridge si está en la misma Wi-Fi para respuesta instantánea (<1s)
    try {
        var urls = (typeof obtenerUrlsCandidatasAutoPCLAN === 'function') ? obtenerUrlsCandidatasAutoPCLAN() : [];
        if (Array.isArray(urls) && urls.length > 0 && urls[0]) {
            fetch(String(urls[0]).replace(/\/+$/, '') + '/api/plan-decision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(function() {});
        }
    } catch (eLan) {}

    var okFinal = Boolean(enviadoMqtt || enviadoCloud);
    if (typeof mostrarToastMonarca === 'function') {
        if (okFinal) {
            mostrarToastMonarca(
                act === 'approve'
                    ? (enviadoMqtt ? 'Aprobación enviada al instante vía MQTT ⚡ · Antigravity retomará ahora.' : 'Aprobación enviada a Auto-PC · Antigravity retomará la implementación.')
                    : (enviadoMqtt ? 'Indicaciones enviadas al instante vía MQTT ⚡ · Antigravity ajustará el plan.' : 'Indicaciones enviadas a Auto-PC · Antigravity ajustará el plan.'),
                act === 'approve' ? '✅' : '📨'
            );
        } else {
            mostrarToastMonarca('No se pudo confirmar envío en la nube ni MQTT; verifica tu conexión.', '⚠️');
        }
    }
    if (typeof window.actualizarTarjetaMonitorAutoPCPerfil === 'function') {
        window.actualizarTarjetaMonitorAutoPCPerfil();
    }
    return okFinal;
}

if (typeof window !== 'undefined') {
    window.reRenderSiVistaIdeasActiva = reRenderSiVistaIdeasActiva;
    window._silenciarNotifAutoPCPorSolicitud = _silenciarNotifAutoPCPorSolicitud;
    window.enviarIdeaAAutoPC = enviarIdeaAAutoPC;
    window.cancelarIdeaAutoPC = cancelarIdeaAutoPC;
    window.procesarPendientesOfflineAutoPC = procesarPendientesOfflineAutoPC;
    window.procesarSnapshotAutoPCIdeas = procesarSnapshotAutoPCIdeas;
    window.procesarPresenciaMqttAutoPC = procesarPresenciaMqttAutoPC;
    window.procesarTelemetriaMqttAutoPC = procesarTelemetriaMqttAutoPC;
    window.procesarColaMqttAutoPC = procesarColaMqttAutoPC;
    window.procesarEventoMqttAutoPC = procesarEventoMqttAutoPC;
    window.obtenerEstadoTelemetryAutoPC = obtenerEstadoTelemetryAutoPC;
    window.obtenerResumenMonitoreoAutoPC = obtenerResumenMonitoreoAutoPC;
    window.obtenerPlanPendienteAutoPC = obtenerPlanPendienteAutoPC;
    window.enviarDecisionPlanDesdePerfil = enviarDecisionPlanDesdePerfil;
    window.formatearDuracionCortaAutoPC = formatearDuracionCortaAutoPC;
    window.formatearResumenAntigravityHtml = formatearResumenAntigravityHtml;
    window.obtenerAlertasAutoPCActivas = obtenerAlertasAutoPCActivas;
    window.descartarNotificacionAutoPC = descartarNotificacionAutoPC;
    window.descartarTodasNotificacionesAutoPC = descartarTodasNotificacionesAutoPC;
    window.verSolicitudAutoPCEnOperatividad = verSolicitudAutoPCEnOperatividad;
    window.seleccionarImagenIdea = seleccionarImagenIdea;
    window.manejarArchivoImagenIdea = manejarArchivoImagenIdea;
    window.pegarImagenDesdePortapapelesIdea = pegarImagenDesdePortapapelesIdea;
    window.limpiarImagenBorradorIdea = limpiarImagenBorradorIdea;
    window.obtenerImagenBorradorIdea = obtenerImagenBorradorIdea;
    window.guardarImagenIdeaAdjunta = guardarImagenIdeaAdjunta;
    window.abrirVisorImagenIdea = abrirVisorImagenIdea;
    window.cerrarVisorImagenIdea = cerrarVisorImagenIdea;
    window.descargarImagenVisorIdea = descargarImagenVisorIdea;
    window.addEventListener('online', function() {
        procesarPendientesOfflineAutoPC();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && IDEAS_VISOR_ACTUAL) {
            cerrarVisorImagenIdea();
        }
    });
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            vincularEventosAdjuntoImagen('principal');
            vincularEventosAdjuntoImagen('asistente');
        });
    } else {
        vincularEventosAdjuntoImagen('principal');
        vincularEventosAdjuntoImagen('asistente');
    }
}

// --------------------------------------------------------------------------
// OPERATIVIDAD
// --------------------------------------------------------------------------

function mostrarVistaOperatividad() {
    ESTADO_IDEAS.subvistaActual = 'operatividad';

    var gridCont = document.getElementById('vista-ideas-categorias-grid');
    var detalleCont = document.getElementById('vista-ideas-categoria-detalle');
    var opCont = document.getElementById('vista-ideas-operatividad');

    if (gridCont) gridCont.style.display = 'none';
    if (detalleCont) detalleCont.style.display = 'none';
    if (opCont) opCont.style.display = 'block';

    var btnCat = document.getElementById('btn-tab-categorias');
    var btnOpe = document.getElementById('btn-tab-operatividad');
    if (btnCat) btnCat.classList.remove('active');
    if (btnOpe) btnOpe.classList.add('active');

    var fechaObjetivo = obtenerFechaObjetivoMes();
    var opciones = { month: 'long', year: 'numeric' };
    var nombreMes = fechaObjetivo.toLocaleDateString('es-ES', opciones);
    nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

    var labelMes = document.getElementById('label-mes-operatividad');
    if (labelMes) labelMes.innerText = nombreMes;

    var ideas = APP_STATE.ideas || [];

    // Ideas ejecutadas en este mes
    var ideasHechasMes = ideas.filter(function(i) {
        return i.hecha && esIdeaDelMes(i, fechaObjetivo);
    });

    // Conteo por categoría
    var conteoPorCat = {};
    Object.keys(ESTRUCTURA_BANCO_IDEAS).forEach(function(cat) {
        conteoPorCat[cat] = 0;
    });

    ideasHechasMes.forEach(function(i) {
        var cat = i.categoria || "💭 Ideas y Pensamientos";
        if (conteoPorCat[cat] === undefined) conteoPorCat[cat] = 0;
        conteoPorCat[cat]++;
    });

    var maxCat = "-";
    var maxVal = 0;
    Object.keys(conteoPorCat).forEach(function(k) {
        if (conteoPorCat[k] > maxVal) {
            maxVal = conteoPorCat[k];
            maxCat = k.replace(/^[^\w\s]+\s*/, '');
        }
    });

    var metricHechas = document.getElementById('metric-ideas-hechas-mes');
    var metricTop = document.getElementById('metric-ideas-categoria-top');
    var metricTasa = document.getElementById('metric-tasa-operatividad');

    if (metricHechas) metricHechas.innerText = ideasHechasMes.length;
    if (metricTop) metricTop.innerText = maxCat !== "-" ? maxCat + (maxVal > 0 ? ` (${maxVal})` : '') : "Sin registros";

    var totalIdeasMes = ideas.filter(function(i) {
        return esIdeaDelMes(i, fechaObjetivo);
    }).length;
    var tasa = totalIdeasMes > 0 ? Math.round((ideasHechasMes.length / totalIdeasMes) * 100) : (ideasHechasMes.length > 0 ? 100 : 0);
    if (metricTasa) metricTasa.innerText = tasa + "%";

    renderizarGraficoOperatividad(conteoPorCat);
    renderizarListaOperatividad(ideasHechasMes);
    actualizarBadgesIdeas();
}

function cambiarMesOperatividad(delta) {
    ESTADO_IDEAS.mesOperatividadOffset += delta;
    mostrarVistaOperatividad();
}

function renderizarGraficoOperatividad(conteoPorCat) {
    var canvas = document.getElementById('graficoOperatividad');
    if (!canvas) return;

    if (ESTADO_IDEAS.graficoChartInstance) {
        try { ESTADO_IDEAS.graficoChartInstance.destroy(); } catch (_) {}
        ESTADO_IDEAS.graficoChartInstance = null;
    }

    var labels = Object.keys(conteoPorCat).map(function(c) {
        return c.replace(/^[^\w\s]+\s*/, '');
    });
    var dataValues = Object.values(conteoPorCat);

    if (typeof Chart !== 'undefined') {
        try {
            var ctx = canvas.getContext('2d');
            ESTADO_IDEAS.graficoChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Ideas Ejecutadas',
                        data: dataValues,
                        backgroundColor: 'rgba(99, 102, 241, 0.82)',
                        borderColor: '#818cf8',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(148, 163, 184, 0.12)' },
                            ticks: { precision: 0, color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 10.5 } }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
            return;
        } catch (e) {
            console.warn("Chart.js para operatividad falló, usando respaldo Canvas 2D:", e);
        }
    }

    // Respaldo HiDPI Canvas 2D nativo (funciona 100% offline en APK/PWA)
    try {
        var wrap = canvas.parentElement;
        var w = Math.max(260, (wrap && wrap.clientWidth) ? wrap.clientWidth : 320);
        var h = Math.max(200, (wrap && wrap.clientHeight) ? wrap.clientHeight : 240);
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        var c2 = canvas.getContext('2d');
        c2.scale(dpr, dpr);
        c2.clearRect(0, 0, w, h);

        if (!labels.length) {
            c2.fillStyle = '#94a3b8';
            c2.font = '600 12.5px "Plus Jakarta Sans", system-ui, sans-serif';
            c2.textAlign = 'center';
            c2.fillText('Sin ideas ejecutadas este mes', w / 2, h / 2);
            return;
        }

        var slotWPreview = (w - 48) / Math.max(1, labels.length);
        var angledLabels = slotWPreview < 76;
        var padL = 32, padR = 16, padT = 22, padB = angledLabels ? 56 : 34;
        var plotW = w - padL - padR;
        var plotH = h - padT - padB;
        var maxV = Math.max.apply(null, dataValues.concat([1]));
        var stepsY = Math.min(4, maxV);

        c2.strokeStyle = 'rgba(148, 163, 184, 0.14)';
        c2.lineWidth = 1;
        c2.fillStyle = '#94a3b8';
        c2.font = '600 10.5px "Plus Jakarta Sans", system-ui, sans-serif';
        c2.textAlign = 'right';
        for (var s = 0; s <= stepsY; s++) {
            var valY = Math.round((maxV / stepsY) * s);
            var py = padT + plotH - (plotH * (valY / maxV));
            c2.beginPath();
            c2.moveTo(padL, py);
            c2.lineTo(w - padR, py);
            c2.stroke();
            c2.fillText(String(valY), padL - 8, py + 4);
        }

        var slotW = plotW / labels.length;
        var barW = Math.min(54, Math.max(18, slotW * 0.46));
        labels.forEach(function(lbl, idx) {
            var val = Number(dataValues[idx]) || 0;
            var bh = Math.max(4, (val / maxV) * plotH);
            var bx = padL + idx * slotW + (slotW - barW) / 2;
            var by = padT + plotH - bh;

            var grad = c2.createLinearGradient(0, by, 0, padT + plotH);
            grad.addColorStop(0, '#818cf8');
            grad.addColorStop(1, '#4f46e5');
            c2.fillStyle = grad;
            if (c2.roundRect) {
                c2.beginPath();
                c2.roundRect(bx, by, barW, bh, [7, 7, 2, 2]);
                c2.fill();
            } else {
                c2.fillRect(bx, by, barW, bh);
            }

            c2.fillStyle = '#e0e7ff';
            c2.font = '700 11.5px "Plus Jakarta Sans", system-ui, sans-serif';
            c2.textAlign = 'center';
            c2.fillText(String(val), bx + barW / 2, by - 6);

            c2.fillStyle = '#cbd5e1';
            c2.font = (angledLabels ? '600 9.5px' : '600 11px') + ' "Plus Jakarta Sans", system-ui, sans-serif';
            var maxChars = angledLabels ? 11 : 14;
            var shortLbl = lbl.length > maxChars ? (lbl.slice(0, maxChars - 1) + '…') : lbl;
            if (angledLabels) {
                c2.save();
                c2.translate(bx + barW / 2 + 2, padT + plotH + 10);
                c2.rotate(-Math.PI / 6);
                c2.textAlign = 'right';
                c2.fillText(shortLbl, 0, 0);
                c2.restore();
            } else {
                c2.fillText(shortLbl, bx + barW / 2, padT + plotH + 18);
            }
        });
    } catch (e2) {
        console.warn("Respaldo Canvas 2D operatividad no disponible:", e2);
    }
}

function _domSafeResumenIdeaId(id) {
    return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function toggleResumenAntigravityIdea(id) {
    var idStr = String(id || '');
    var safeId = _domSafeResumenIdeaId(idStr);
    var box = document.getElementById('idea-resumen-ag-box-' + safeId);
    if (!box) return;
    var abierto = box.classList.toggle('is-open');
    var btn = box.querySelector('.idea-resumen-ag-toggle');
    if (btn) btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    if (!ESTADO_IDEAS.resumenesAbiertos) ESTADO_IDEAS.resumenesAbiertos = {};
    ESTADO_IDEAS.resumenesAbiertos[idStr] = abierto;
}

function copiarResumenAntigravityIdea(id, btnEl) {
    var idStr = String(id || '');
    var idea = (APP_STATE && Array.isArray(APP_STATE.ideas))
        ? APP_STATE.ideas.find(function(it) { return String(it.id) === idStr; })
        : null;
    var docRem = AUTOPC_SOLICITUDES_MAP[idStr] || null;
    var texto = String((idea && idea.resumenAntigravity) || (docRem && docRem.resumenAntigravity) || '').trim();
    if (!texto) return;

    var marcarCopiado = function() {
        if (btnEl) {
            var orig = btnEl.getAttribute('data-orig-label') || btnEl.innerText;
            btnEl.setAttribute('data-orig-label', orig);
            btnEl.innerText = '✓ Copiado';
            setTimeout(function() { btnEl.innerText = orig; }, 1800);
        }
        if (typeof mostrarToastMonarca === 'function') {
            mostrarToastMonarca('Resumen de Antigravity copiado', '📋');
        }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(marcarCopiado).catch(function() {
            prompt('Copia el resumen de Antigravity:', texto);
        });
    } else {
        prompt('Copia el resumen de Antigravity:', texto);
    }
}

function renderizarListaOperatividad(ejecutadas) {
    var cont = document.getElementById('contenedor-lista-operatividad');
    var badgeContador = document.getElementById('badge-contador-hechas-lista');

    if (badgeContador) {
        badgeContador.innerText = ejecutadas.length + (ejecutadas.length === 1 ? ' idea' : ' ideas');
    }

    if (!cont) return;

    if (!ejecutadas || ejecutadas.length === 0) {
        cont.innerHTML = '<p style="color:#94a3b8; font-size:13px; text-align:center; padding:16px;">Sin ideas completadas en este mes.</p>';
        return;
    }

    var abiertosMap = ESTADO_IDEAS.resumenesAbiertos || {};
    var html = '';
    ejecutadas.forEach(function(i) {
        var idStr = String(i.id);
        var idAttr = escapeHtmlIdea(idStr);
        var safeDomId = _domSafeResumenIdeaId(idStr);
        var catLimpia = (i.categoria || 'Idea').replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}✨✦🤖💡🛒📊📚✅\s]+/u, '').trim();
        var imgOpHtml = renderizarMiniaturaImagenIdeaHtml(i);

        var docRem = AUTOPC_SOLICITUDES_MAP[idStr] || null;
        var resumenTxt = String(i.resumenAntigravity || (docRem && docRem.resumenAntigravity) || '').trim();
        var archivos = (Array.isArray(i.resumenArchivos) && i.resumenArchivos.length > 0)
            ? i.resumenArchivos
            : ((docRem && Array.isArray(docRem.resumenArchivos)) ? docRem.resumenArchivos : []);
        var pasos = Number(i.resumenPasos || (docRem && docRem.resumenPasos) || 0);
        var durMs = Number(i.resumenDuracionMs || (docRem && docRem.resumenDuracionMs) || 0);
        var ver = String(i.resumenVersion || (docRem && docRem.resumenVersion) || '').trim();
        var esAutoPC = Boolean(
            i.completadaPorAutoPC ||
            i.autopcStatus === 'done' ||
            (docRem && String(docRem.status || '').toLowerCase() === 'done') ||
            resumenTxt
        );

        var topRowInner = `
            <div class="idea-item-left">
                <span class="idea-dash" style="color: #10b981 !important;">✓</span>
                <div class="idea-item-content">
                    <span class="idea-text-line" style="text-decoration: line-through; color: #94a3b8;">${escapeHtmlIdea(i.texto)}</span>
                    ${imgOpHtml}
                    <div class="idea-meta-badges">
                        <span class="idea-category-badge">${escapeHtmlIdea(catLimpia)}</span>
                        ${i.subcategoria ? `<span style="font-size: 11px; color: #94a3b8; font-weight: 500;">• ${escapeHtmlIdea(i.subcategoria)}</span>` : ''}
                        <span style="font-size: 10.5px; color: #34d399; font-weight: 700; background: rgba(16, 185, 129, 0.14); border: 1px solid rgba(52, 211, 153, 0.3); padding: 2px 8px; border-radius: 9999px;">✓ Ejecutada</span>
                        ${esAutoPC ? '<span class="idea-autopc-badge is-done">🤖 Auto-PC</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="idea-actions-group">
                <button class="idea-btn-check checked" onclick="marcarIdeaHechaUI('${idAttr}')" title="Desmarcar y devolver a pendientes">
                    Desmarcar ↩
                </button>
                <button class="btn-delete-row" onclick="eliminarIdea('${idAttr}')">✕</button>
            </div>`;

        if (esAutoPC) {
            var estaAbierto = Boolean(abiertosMap[idStr]);
            var chipsHtml = '';
            if (ver) {
                chipsHtml += `<span class="idea-resumen-ag-chip is-ver">🏷️ ${escapeHtmlIdea(ver)}</span>`;
            }
            if (archivos.length > 0) {
                chipsHtml += `<span class="idea-resumen-ag-chip">📄 ${archivos.length} ${archivos.length === 1 ? 'archivo' : 'archivos'}</span>`;
            }
            if (pasos > 0) {
                chipsHtml += `<span class="idea-resumen-ag-chip">⚙️ ${pasos} pasos</span>`;
            }
            if (durMs > 0) {
                chipsHtml += `<span class="idea-resumen-ag-chip">⏱️ ${escapeHtmlIdea(formatearDuracionCortaAutoPC(durMs))}</span>`;
            }
            if (!resumenTxt) {
                chipsHtml += `<span class="idea-resumen-ag-chip">Registro previo a v11.17</span>`;
            }

            var bodyHtml = '';
            if (resumenTxt) {
                var archivosHtml = archivos.length > 0
                    ? `<div class="perfil-ag-files-row" style="margin-top: 10px;">` +
                        archivos.map(function(f) {
                            return `<span class="perfil-ag-file-chip">📄 ${escapeHtmlIdea(f)}</span>`;
                        }).join('') +
                      `</div>`
                    : '';
                var fechaPie = i.fechaHecha ? (' · ' + escapeHtmlIdea(i.fechaHecha)) : '';
                bodyHtml = `
                    <div class="idea-resumen-md">${formatearResumenAntigravityHtml(resumenTxt)}</div>
                    ${archivosHtml}
                    <div class="idea-resumen-ag-footer">
                        <span style="font-size: 11px; color: #94a3b8;">🤖 Resumen capturado al terminar en Antigravity${fechaPie}</span>
                        <button type="button" class="idea-resumen-copy-btn" onclick="copiarResumenAntigravityIdea('${idAttr}', this)">📋 Copiar resumen</button>
                    </div>`;
            } else {
                var fechaLeg = i.fechaHecha ? (' el ' + escapeHtmlIdea(i.fechaHecha)) : '';
                bodyHtml = `
                    <div class="idea-resumen-md">
                        <p class="ag-md-p">Esta solicitud fue completada automáticamente por Auto-PC${fechaLeg}, antes de activar la captura de resúmenes de Antigravity (<code class="ag-md-code">v11.17</code>).</p>
                        <p class="ag-md-p">A partir de ahora, cada nueva solicitud que termine en Antigravity guardará aquí su resumen completo con los cambios, archivos tocados y resultados.</p>
                    </div>`;
            }

            html += `
            <div class="idea-clean-item is-done has-ag-summary" data-idea-id="${idAttr}">
                <div class="idea-done-top-row">
                    ${topRowInner}
                </div>
                <div id="idea-resumen-ag-box-${safeDomId}" class="idea-resumen-ag-box${resumenTxt ? '' : ' is-pending-legacy'}${estaAbierto ? ' is-open' : ''}">
                    <button type="button" class="idea-resumen-ag-toggle" aria-expanded="${estaAbierto ? 'true' : 'false'}" onclick="toggleResumenAntigravityIdea('${idAttr}')">
                        <span class="idea-resumen-ag-toggle-left">
                            <span class="idea-resumen-ag-title">${resumenTxt ? '🤖 Resumen de Antigravity' : '🤖 Detalle Auto-PC'}</span>
                            ${chipsHtml}
                        </span>
                        <span class="idea-resumen-ag-chevron">▾</span>
                    </button>
                    <div class="idea-resumen-ag-body">
                        ${bodyHtml}
                    </div>
                </div>
            </div>`;
        } else {
            html += `
            <div class="idea-clean-item is-done" data-idea-id="${idAttr}">
                ${topRowInner}
            </div>`;
        }
    });

    cont.innerHTML = html;
    hidratarImagenesIdeasEnDOM();
}

if (typeof window !== 'undefined') {
    window.toggleResumenAntigravityIdea = toggleResumenAntigravityIdea;
    window.copiarResumenAntigravityIdea = copiarResumenAntigravityIdea;
}

function inicializarHojaIdeasDesdeUI() {
    MonarcaDB.exportBackup();
}

// ==========================================================================
// 📚 BASE DE CONOCIMIENTOS & VOCABULARIO SEMANAL (v11.22)
// ==========================================================================

var FILTRO_AREA_CONOCIMIENTO = "TODAS";
var TAB_CONOCIMIENTO_ACTIVO = "tecnicas";
var FILTRO_VOCABULARIO_ACTIVO = "semana";
var VOCAB_SUGERENCIA_IDX = 0;
var VOCAB_TOAST_TIMER = null;

var BANCO_SUGERENCIAS_VOCAB = [
    { palabra: "Pragmático", contexto: "Profesional", significado: "Que se enfoca en resultados concretos y soluciones prácticas por encima de la teoría.", reemplazaA: "práctico, directo, realista", ejemplo: "Tomemos una decisión pragmática para destrabar el proyecto hoy mismo." },
    { palabra: "Asertivo", contexto: "Conversación", significado: "Capaz de expresar ideas y límites con claridad, firmeza y respeto sin ser agresivo ni pasivo.", reemplazaA: "claro, seguro, firme", ejemplo: "Fue muy asertivo al explicar qué necesitaba para cumplir el plazo." },
    { palabra: "Elocuente", contexto: "Persuasión", significado: "Que se expresa con fluidez, claridad y poder de convencimiento.", reemplazaA: "habla bien, convincente", ejemplo: "Dio una explicación tan elocuente que todo el equipo entendió la estrategia." },
    { palabra: "Perspicaz", contexto: "Precisión", significado: "Que percibe detalles sutiles y comprende rápido situaciones complejas.", reemplazaA: "listo, atento, vivo", ejemplo: "Qué observación tan perspicaz; casi nadie habría notado ese detalle." },
    { palabra: "Matiz", contexto: "Conversación", significado: "Diferencia sutil o grado particular que cambia el sentido exacto de una idea.", reemplazaA: "detalle, cosita, diferencia", ejemplo: "Hay un matiz importante en esa propuesta que conviene revisar antes de aceptar." },
    { palabra: "Contundente", contexto: "Persuasión", significado: "Tan claro, firme y sólido que no deja lugar a dudas.", reemplazaA: "fuerte, claro, brutal", ejemplo: "Los resultados de esta semana fueron contundentes." },
    { palabra: "Idóneo", contexto: "Profesional", significado: "Que reúne exactamente las condiciones adecuadas para un propósito.", reemplazaA: "bueno para eso, perfecto", ejemplo: "Ese enfoque es el más idóneo para optimizar el tiempo del cliente." },
    { palabra: "Sucinto", contexto: "Escritura", significado: "Expresado de forma breve, precisa y sin rodeos innecesarios.", reemplazaA: "corto, resumido, breve", ejemplo: "Te dejo un resumen sucinto con los tres puntos clave de la reunión." },
    { palabra: "Ponderar", contexto: "Precisión", significado: "Evaluar con calma el peso, valor y consecuencias de cada opción antes de decidir.", reemplazaA: "pensar bien, analizar", ejemplo: "Prefiero ponderar ambas alternativas antes de comprometer el presupuesto." },
    { palabra: "Ecuanimidad", contexto: "Conversación", significado: "Serenidad y equilibrio mental para mantener la calma incluso bajo presión.", reemplazaA: "calma, tranquilidad", ejemplo: "Mantuvo la ecuanimidad pese al imprevisto y resolvió todo rápido." },
    { palabra: "Pertinente", contexto: "Profesional", significado: "Oportuno y directamente relacionado con el tema que se está tratando.", reemplazaA: "apropiado, útil ahora", ejemplo: "Tu pregunta es muy pertinente justo en esta fase del plan." },
    { palabra: "Tangible", contexto: "Persuasión", significado: "Que se puede medir, percibir o comprobar de manera real y concreta.", reemplazaA: "real, visible, concreto", ejemplo: "Buscamos un avance tangible al cerrar cada viernes." },
    { palabra: "Catalizador", contexto: "Profesional", significado: "Persona, acción o cambio que acelera drásticamente un resultado positivo.", reemplazaA: "impulsor, motor", ejemplo: "Ese nuevo hábito fue el catalizador de toda su disciplina actual." },
    { palabra: "Cohesión", contexto: "Escritura", significado: "Unión lógica y armonía entre las partes de un equipo, discurso o plan.", reemplazaA: "unión, orden, sentido", ejemplo: "Cuando hay cohesión en la rutina, todo fluye sin fricción." },
    { palabra: "Diligente", contexto: "Profesional", significado: "Cuidadoso, ágil y constante al ejecutar una responsabilidad.", reemplazaA: "aplicado, rápido, cumplido", ejemplo: "Es muy diligente con sus entregas; siempre se adelanta a los problemas." },
    { palabra: "Consenso", contexto: "Conversación", significado: "Acuerdo general alcanzado entre varias personas tras dialogar.", reemplazaA: "acuerdo, quedar igual", ejemplo: "Llegamos a un consenso rápido sobre los horarios de la semana." },
    { palabra: "Lucidez", contexto: "Precisión", significado: "Claridad mental extraordinaria para razonar y ver las cosas como son.", reemplazaA: "claridad, mente fresca", ejemplo: "Dormir bien me dio la lucidez necesaria para resolver ese bloqueo." },
    { palabra: "Versátil", contexto: "Conversación", significado: "Capaz de adaptarse con soltura y eficacia a distintas situaciones o funciones.", reemplazaA: "multiusos, adaptable", ejemplo: "Me gusta mantener una rutina versátil que funcione incluso en días ocupados." }
];

function escaparHTMLVocab(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function cargarConocimientos(filtro) {
    if (filtro) FILTRO_AREA_CONOCIMIENTO = filtro;
    renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
    actualizarBadgeVocabularioConocimiento();
    cambiarTabConocimiento(TAB_CONOCIMIENTO_ACTIVO || 'tecnicas', true);
    if (TAB_CONOCIMIENTO_ACTIVO === 'vocabulario') {
        renderizarVocabularioSemanal();
    }
}

function cambiarTabConocimiento(tab, omitirRender) {
    var dest = (tab === 'vocabulario') ? 'vocabulario' : 'tecnicas';
    TAB_CONOCIMIENTO_ACTIVO = dest;
    window.TAB_CONOCIMIENTO_ACTIVO = dest;

    var btnTec = document.getElementById('tab-conocimiento-tecnicas');
    var btnVoc = document.getElementById('tab-conocimiento-vocabulario');
    var subTec = document.getElementById('subvista-conocimiento-tecnicas');
    var subVoc = document.getElementById('subvista-conocimiento-vocabulario');

    if (btnTec) {
        btnTec.classList.toggle('active', dest === 'tecnicas');
        btnTec.setAttribute('aria-selected', dest === 'tecnicas' ? 'true' : 'false');
    }
    if (btnVoc) {
        btnVoc.classList.toggle('active', dest === 'vocabulario');
        btnVoc.setAttribute('aria-selected', dest === 'vocabulario' ? 'true' : 'false');
    }
    if (subTec) subTec.style.display = dest === 'tecnicas' ? 'block' : 'none';
    if (subVoc) subVoc.style.display = dest === 'vocabulario' ? 'block' : 'none';

    if (!omitirRender) {
        if (dest === 'vocabulario') {
            renderizarVocabularioSemanal();
        } else {
            renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
        }
    }
}
window.cambiarTabConocimiento = cambiarTabConocimiento;

function renderizarConocimientos(filtro) {
    var cont = document.getElementById('contenedor-conocimientos-grid');
    var bannerRevision = document.getElementById('contenedor-revision-semanal-conocimiento');
    if (!cont && !bannerRevision) return;

    if (!APP_STATE.conocimientos || !Array.isArray(APP_STATE.conocimientos)) {
        APP_STATE.conocimientos = [];
    }
    var conocimientos = APP_STATE.conocimientos;

    // Métricas de repaso semanal
    var totalConocimientos = conocimientos.length;
    var repasadosEstaSemana = conocimientos.filter(function(c) { return c.revisadoEstaSemana; }).length;
    var porcentajeSemana = totalConocimientos > 0 ? Math.round((repasadosEstaSemana / totalConocimientos) * 100) : 0;

    if (bannerRevision) {
        bannerRevision.innerHTML = `
        <div class="weekly-review-banner">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
                <div>
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;">Ciclo de Repaso Activo</div>
                    <h3 style="margin: 2px 0 0 0; font-size: 17px; font-weight: 800; color: #f8fafc;">Revisión Semanal de Conocimientos</h3>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span class="item-badge-pill" style="font-size: 12.5px; font-weight: 800; background: rgba(255, 255, 255, 0.05); color: #f8fafc;">${repasadosEstaSemana} / ${totalConocimientos} Repasados</span>
                    <button class="btn-sheet-action" onclick="reiniciarCicloSemanalConocimientos()" title="Reiniciar ciclo semanal para volver a estudiar">
                        🔄 Nuevo Ciclo Semanal
                    </button>
                </div>
            </div>
            <p style="margin: 0 0 10px 0; font-size: 12.5px; color: #94a3b8;">
                Estudio espaciado de técnicas operativas y teóricas aprendidas durante tus actividades. Repasa cada punto para afianzar retención neural y sumar +15 EXP.
            </p>
            <div class="attr-progress-track" style="height: 8px;">
                <div class="attr-progress-fill" style="width: ${porcentajeSemana}%;"></div>
            </div>
        </div>`;
    }

    if (!cont) return;

    var filtrados = conocimientos;
    if (filtro && filtro !== "TODAS") {
        filtrados = conocimientos.filter(function(c) { return c.area === filtro; });
    }

    if (filtrados.length === 0) {
        cont.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 32px 16px; background: #0b0e15; border: 1px dashed rgba(148, 163, 184, 0.25); border-radius: 12px;">
            <p style="margin: 0; color: #94a3b8; font-size: 13.5px;">No hay conocimientos registrados en esta área.</p>
            <button class="btn-system" style="margin-top: 12px; font-size: 12.5px;" onclick="abrirModalNuevoConocimiento()">+ Registrar Nuevo Conocimiento</button>
        </div>`;
        return;
    }

    var html = '';
    filtrados.forEach(function(c) {
        var estadoBadge = c.revisadoEstaSemana ? 
            `<span style="font-size: 11px; font-weight: 700; background: rgba(16, 185, 129, 0.14); color: #34d399; padding: 3px 8px; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.35);">✓ Repasado esta semana</span>` :
            `<span style="font-size: 11px; font-weight: 700; background: rgba(255, 255, 255, 0.05); color: #94a3b8; padding: 3px 8px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.08);">Pendiente de repaso</span>`;

        var btnRepaso = c.revisadoEstaSemana ?
            `<button class="btn-card-repaso repasado" onclick="marcarConocimientoRepasadoSemana('${c.id}')" title="Hacer clic para desmarcar">✓ Estudiado</button>` :
            `<button class="btn-card-repaso" onclick="marcarConocimientoRepasadoSemana('${c.id}')">📖 Estudiar y Marcar (+15 EXP)</button>`;

        html += `
        <div class="knowledge-card ${c.revisadoEstaSemana ? 'repasado' : ''}">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
                <div>
                    <span class="knowledge-area-tag">${c.area || 'Conocimiento'}</span>
                    <h4 class="knowledge-title">${c.titulo}</h4>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button onclick="eliminarConocimiento('${c.id}')" title="Eliminar técnica" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 2px 6px; font-size: 13px;" onmouseover="this.style.color='#f87171'" onmouseout="this.style.color='#94a3b8'">🗑️</button>
                </div>
            </div>

            <div style="font-size: 11.5px; color: #94a3b8; margin-bottom: 10px;">
                <strong>Origen:</strong> ${c.actividadOrigen || 'Actividad práctica'} · <span style="font-weight: 600; color: #cbd5e1;">${c.nivelDominio || 'En Práctica'}</span>
            </div>

            <div class="knowledge-keypoints-box">
                <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;">Puntos Clave & Técnica:</div>
                <p style="margin: 0; font-size: 12.5px; color: #f8fafc; line-height: 1.45; white-space: pre-wrap;">${c.resumenPuntosClave}</p>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08); flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    ${estadoBadge}
                    <span style="font-size: 11px; color: #6b7280;">${c.semanasRepasadas || 0} sem. activas</span>
                </div>
                <div>
                    ${btnRepaso}
                </div>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function abrirModalNuevoConocimiento() {
    var modal = document.getElementById('modal-nuevo-conocimiento');
    if (!modal) return;
    var inTit = document.getElementById('input-con-titulo');
    var inOrigen = document.getElementById('input-con-origen');
    var inPuntos = document.getElementById('input-con-puntos');

    if (inTit) inTit.value = '';
    if (inOrigen) inOrigen.value = '';
    if (inPuntos) inPuntos.value = '';

    modal.style.display = 'flex';
}

function cerrarModalNuevoConocimiento() {
    var modal = document.getElementById('modal-nuevo-conocimiento');
    if (modal) modal.style.display = 'none';
}

function guardarNuevoConocimiento() {
    var inTit = document.getElementById('input-con-titulo');
    var inArea = document.getElementById('input-con-area');
    var inOrigen = document.getElementById('input-con-origen');
    var inPuntos = document.getElementById('input-con-puntos');
    var inDominio = document.getElementById('input-con-dominio');

    var titulo = inTit ? inTit.value.trim() : '';
    var area = inArea ? inArea.value : 'Oficio & Barbería';
    var origen = inOrigen ? inOrigen.value.trim() : '';
    var puntos = inPuntos ? inPuntos.value.trim() : '';
    var dominio = inDominio ? inDominio.value : 'En Práctica';

    if (!titulo) {
        alert("Por favor ingresa el título de la técnica o conocimiento.");
        if (inTit) inTit.focus();
        return;
    }
    if (!puntos) {
        alert("Por favor ingresa los puntos clave o explicación de la técnica.");
        if (inPuntos) inPuntos.focus();
        return;
    }

    if (!APP_STATE.conocimientos) APP_STATE.conocimientos = [];
    var nuevo = {
        id: "CON-" + Date.now(),
        titulo: titulo,
        area: area,
        actividadOrigen: origen || "Actividad del día a día",
        resumenPuntosClave: puntos,
        nivelDominio: dominio,
        fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        timestamp: Date.now(),
        semanasRepasadas: 0,
        revisadoEstaSemana: true
    };

    APP_STATE.conocimientos.unshift(nuevo);
    sumarExp(25);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevoConocimiento();
    renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
    alert("📚 Conocimiento registrado exitosamente con repaso activo (+25 EXP).");
}

function marcarConocimientoRepasadoSemana(id) {
    if (!APP_STATE.conocimientos) return;
    var c = APP_STATE.conocimientos.find(function(item) { return item.id === id; });
    if (!c) return;

    if (c.revisadoEstaSemana) {
        c.revisadoEstaSemana = false;
        c.semanasRepasadas = Math.max(0, (c.semanasRepasadas || 1) - 1);
    } else {
        c.revisadoEstaSemana = true;
        c.semanasRepasadas = (c.semanasRepasadas || 0) + 1;
        sumarExp(15);
        if (APP_STATE.menteAtributos && APP_STATE.menteAtributos.conocimiento !== undefined) {
            APP_STATE.menteAtributos.conocimiento = Math.min(100, (APP_STATE.menteAtributos.conocimiento || 0) + 5);
        }
        alert("🧠 ¡Técnica estudiada y afianzada!\n+15 EXP recibidos.");
    }
    MonarcaDB.save(APP_STATE);
    renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
}

function reiniciarCicloSemanalConocimientos() {
    if (!APP_STATE.conocimientos || APP_STATE.conocimientos.length === 0) return;
    if (!confirm("¿Iniciar un nuevo ciclo semanal de estudio? Todas las técnicas volverán a estar pendientes para su repaso semanal.")) return;

    APP_STATE.conocimientos.forEach(function(c) {
        c.revisadoEstaSemana = false;
    });
    MonarcaDB.save(APP_STATE);
    renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
    alert("🔄 Ciclo semanal reiniciado. ¡Listo para repasar tus conocimientos!");
}

function eliminarConocimiento(id) {
    if (!confirm("¿Estás seguro de eliminar este registro de conocimiento?")) return;
    if (!APP_STATE.conocimientos) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('conocimientos', id);
    }
    APP_STATE.conocimientos = APP_STATE.conocimientos.filter(function(c) { return c.id !== id; });
    MonarcaDB.save(APP_STATE);
    renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
}

function filtrarConocimientosPorArea(area, btn) {
    FILTRO_AREA_CONOCIMIENTO = area;
    var btns = document.querySelectorAll('.btn-tab-con-area');
    btns.forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderizarConocimientos(area);
}

// ==========================================================================
// 🗣️ VOCABULARIO SEMANAL — REPERTORIO ACTIVO DE PALABRAS (v11.22)
// ==========================================================================

function obtenerRangoSemanaActualVocab() {
    var hoy = new Date();
    var offsetLunes = (hoy.getDay() + 6) % 7;
    var lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - offsetLunes);
    var domingo = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6);
    var mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    var clave = lunes.getFullYear() + '-' + String(lunes.getMonth() + 1).padStart(2, '0') + '-' + String(lunes.getDate()).padStart(2, '0');
    var etiqueta = (lunes.getMonth() === domingo.getMonth())
        ? (lunes.getDate() + '–' + domingo.getDate() + ' ' + mesesCortos[domingo.getMonth()] + ' ' + domingo.getFullYear())
        : (lunes.getDate() + ' ' + mesesCortos[lunes.getMonth()] + ' – ' + domingo.getDate() + ' ' + mesesCortos[domingo.getMonth()] + ' ' + domingo.getFullYear());
    return { clave: clave, etiqueta: etiqueta };
}

function asegurarVocabularioState() {
    if (!window.APP_STATE) return [];
    if (!Array.isArray(APP_STATE.vocabulario)) APP_STATE.vocabulario = [];
    return APP_STATE.vocabulario;
}

function actualizarBadgeVocabularioConocimiento() {
    var badge = document.getElementById('badge-conocimiento-vocab-count');
    if (!badge) return;
    var lista = asegurarVocabularioState();
    var activas = lista.filter(function(w) { return w && w.enSemanaActual !== false; }).length;
    if (activas > 0) {
        badge.textContent = String(activas);
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

function mostrarToastVocabulario(msg) {
    var el = document.getElementById('vocab-inline-toast');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    if (VOCAB_TOAST_TIMER) clearTimeout(VOCAB_TOAST_TIMER);
    VOCAB_TOAST_TIMER = setTimeout(function() {
        el.style.display = 'none';
    }, 3400);
}

function iconoContextoVocab(ctx) {
    var map = {
        'Conversación': '💬',
        'Profesional': '💼',
        'Persuasión': '🎯',
        'Escritura': '✍️',
        'Precisión': '🧠'
    };
    return map[ctx] || '💬';
}

function cambiarFiltroVocabulario(filtro) {
    FILTRO_VOCABULARIO_ACTIVO = (filtro === 'dominadas' || filtro === 'todas') ? filtro : 'semana';
    document.querySelectorAll('#vocab-filter-pills .vocab-filter-pill').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-vfilter') === FILTRO_VOCABULARIO_ACTIVO);
    });
    renderizarVocabularioSemanal();
}
window.cambiarFiltroVocabulario = cambiarFiltroVocabulario;

function renderizarVocabularioSemanal() {
    var heroEl = document.getElementById('contenedor-vocabulario-hero');
    var gridEl = document.getElementById('contenedor-vocabulario-grid');
    if (!heroEl && !gridEl) return;

    var lista = asegurarVocabularioState();
    actualizarBadgeVocabularioConocimiento();

    var semanaInfo = obtenerRangoSemanaActualVocab();
    var enSemana = lista.filter(function(w) { return w && w.enSemanaActual !== false; });
    var dominadas = lista.filter(function(w) { return w && w.dominada; });
    var dominadasSemana = enSemana.filter(function(w) { return w.dominada || (Number(w.usosSemana) || 0) >= (Number(w.metaSemanal) || 3); }).length;
    var usosSemanaTotal = enSemana.reduce(function(acc, w) { return acc + (Number(w.usosSemana) || 0); }, 0);
    var metasSemanaTotal = enSemana.reduce(function(acc, w) { return acc + Math.max(1, Number(w.metaSemanal) || 3); }, 0);
    var pctProgreso = metasSemanaTotal > 0
        ? Math.min(100, Math.round((enSemana.reduce(function(acc, w) {
            var m = Math.max(1, Number(w.metaSemanal) || 3);
            return acc + Math.min(m, Number(w.usosSemana) || 0);
        }, 0) / metasSemanaTotal) * 100))
        : 0;

    var cntSem = document.getElementById('vocab-cnt-semana');
    var cntDom = document.getElementById('vocab-cnt-dominadas');
    var cntTod = document.getElementById('vocab-cnt-todas');
    if (cntSem) cntSem.textContent = String(enSemana.length);
    if (cntDom) cntDom.textContent = String(dominadas.length);
    if (cntTod) cntTod.textContent = String(lista.length);

    if (heroEl) {
        heroEl.innerHTML =
            '<div class="vocab-hero-card">' +
                '<div class="vocab-hero-top">' +
                    '<div>' +
                        '<div class="vocab-hero-eyebrow">Reto Activo · ' + escaparHTMLVocab(semanaInfo.etiqueta) + '</div>' +
                        '<h3 class="vocab-hero-title">Repertorio Semanal en Práctica</h3>' +
                    '</div>' +
                    '<div class="vocab-hero-actions">' +
                        '<button type="button" class="vocab-action-pill" onclick="mostrarPalabraAlAzarVocab()" title="Sortear una palabra para usar ahora">🎲 Palabra al Azar</button>' +
                        '<button type="button" class="vocab-action-pill" onclick="iniciarNuevaSemanaVocabulario()" title="Graduar palabras dominadas y abrir una nueva semana">🔄 Nueva Semana</button>' +
                    '</div>' +
                '</div>' +
                '<div class="vocab-kpi-row">' +
                    '<div class="vocab-kpi-box">' +
                        '<div class="vocab-kpi-num" style="color:#38bdf8;">' + enSemana.length + '</div>' +
                        '<div class="vocab-kpi-lbl">Esta semana</div>' +
                    '</div>' +
                    '<div class="vocab-kpi-box">' +
                        '<div class="vocab-kpi-num" style="color:#a78bfa;">' + usosSemanaTotal + '</div>' +
                        '<div class="vocab-kpi-lbl">Usos reales</div>' +
                    '</div>' +
                    '<div class="vocab-kpi-box">' +
                        '<div class="vocab-kpi-num" style="color:#34d399;">' + dominadasSemana + '/' + enSemana.length + '</div>' +
                        '<div class="vocab-kpi-lbl">Meta cumplida</div>' +
                    '</div>' +
                '</div>' +
                '<div class="vocab-progress-track"><div class="vocab-progress-fill" style="width:' + pctProgreso + '%;"></div></div>' +
                '<div style="display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; margin-top:6px;">' +
                    '<span>Avance semanal: <strong style="color:#f8fafc;">' + pctProgreso + '%</strong></span>' +
                    '<span>Repertorio dominado total: <strong style="color:#6ee7b7;">' + dominadas.length + '</strong></span>' +
                '</div>' +
            '</div>';
    }

    if (!gridEl) return;

    var qEl = document.getElementById('input-buscar-vocabulario');
    var q = qEl ? qEl.value.trim().toLowerCase() : '';

    var visibles = lista.filter(function(w) {
        if (!w) return false;
        if (FILTRO_VOCABULARIO_ACTIVO === 'semana' && w.enSemanaActual === false) return false;
        if (FILTRO_VOCABULARIO_ACTIVO === 'dominadas' && !w.dominada) return false;
        if (q) {
            var blob = (String(w.palabra || '') + ' ' + String(w.significado || '') + ' ' + String(w.reemplazaA || '') + ' ' + String(w.ejemplo || '') + ' ' + String(w.contexto || '')).toLowerCase();
            if (blob.indexOf(q) === -1) return false;
        }
        return true;
    });

    if (visibles.length === 0) {
        var msgVacio = q
            ? 'No se encontraron palabras que coincidan con tu búsqueda.'
            : (FILTRO_VOCABULARIO_ACTIVO === 'dominadas'
                ? 'Aún no tienes palabras dominadas. Usa tus palabras de la semana hasta cumplir su meta.'
                : 'Aún no tienes palabras asignadas para esta semana. Agrega 3 a 5 palabras nuevas o pulsa "✨ Sugerir" dentro del formulario.');
        gridEl.innerHTML =
            '<div style="grid-column:1/-1; text-align:center; padding:32px 18px; background:#0b0e15; border:1px dashed rgba(148,163,184,0.28); border-radius:14px;">' +
                '<div style="font-size:28px; margin-bottom:8px;">🗣️</div>' +
                '<p style="margin:0 0 12px 0; color:#94a3b8; font-size:13px; line-height:1.45; max-width:440px; margin-inline:auto;">' + msgVacio + '</p>' +
                '<button type="button" class="btn-system" style="font-size:12.5px;" onclick="abrirModalVocabulario()">➕ Agregar Palabra para esta Semana</button>' +
            '</div>';
        return;
    }

    var html = '';
    visibles.forEach(function(w) {
        var meta = Math.max(1, Number(w.metaSemanal) || 3);
        var usos = Math.max(0, Number(w.usosSemana) || 0);
        var cumplida = !!w.dominada || usos >= meta;
        var ctx = w.contexto || 'Conversación';
        var dotsHtml = '';
        var totalDots = Math.min(10, meta);
        for (var i = 0; i < totalDots; i++) {
            dotsHtml += '<span class="vocab-dot ' + (i < usos ? 'filled' : '') + '"></span>';
        }
        var statusHtml = cumplida
            ? '<span class="vocab-status-pill dominada">⭐ Dominada</span>'
            : (w.enSemanaActual !== false
                ? '<span class="vocab-status-pill en-reto">🔥 En reto</span>'
                : '<span class="vocab-status-pill" style="background:rgba(148,163,184,0.12);color:#94a3b8;border:1px solid rgba(148,163,184,0.25);">📦 En banco</span>');

        var toggleSemLabel = (w.enSemanaActual !== false) ? '📦 Quitar' : '🔥 Activar';
        var toggleSemTitle = (w.enSemanaActual !== false) ? 'Sacar del reto de esta semana (guardar en banco)' : 'Activar para usar esta semana';

        html +=
            '<article class="vocab-card ' + (cumplida ? 'is-dominada' : '') + '" data-vocab-id="' + escaparHTMLVocab(w.id) + '">' +
                '<div class="vocab-card-head">' +
                    '<div style="min-width:0;">' +
                        '<div>' +
                            '<span class="vocab-ctx-badge">' + iconoContextoVocab(ctx) + ' ' + escaparHTMLVocab(ctx) + '</span>' +
                            statusHtml +
                        '</div>' +
                        '<h4 class="vocab-word-title">' + escaparHTMLVocab(w.palabra) + '</h4>' +
                    '</div>' +
                    '<div class="vocab-card-tools">' +
                        '<button type="button" class="vocab-icon-btn" onclick="abrirModalVocabulario(\'' + escaparHTMLVocab(w.id) + '\')" title="Editar palabra">✏️</button>' +
                        '<button type="button" class="vocab-icon-btn danger" onclick="eliminarPalabraVocab(\'' + escaparHTMLVocab(w.id) + '\')" title="Eliminar palabra">🗑️</button>' +
                    '</div>' +
                '</div>' +
                '<p class="vocab-meaning">' + escaparHTMLVocab(w.significado || '') + '</p>' +
                (w.reemplazaA ? '<div class="vocab-replace-row">En lugar de decir: <strong>' + escaparHTMLVocab(w.reemplazaA) + '</strong></div>' : '') +
                (w.ejemplo ? '<div class="vocab-example-box">“' + escaparHTMLVocab(w.ejemplo) + '”</div>' : '') +
                '<div class="vocab-usage-box">' +
                    '<div class="vocab-usage-meta">' +
                        '<span>Usos esta semana: <strong style="color:#f8fafc;">' + usos + ' / ' + meta + '</strong></span>' +
                        '<span>Total histórico: ' + (Number(w.usosTotales) || usos) + '</span>' +
                    '</div>' +
                    '<div class="vocab-usage-dots">' + dotsHtml + '</div>' +
                    '<div class="vocab-card-footer">' +
                        '<button type="button" class="vocab-use-btn" onclick="registrarUsoPalabraVocab(\'' + escaparHTMLVocab(w.id) + '\', 1)">🗣️ ¡La usé! (+1)</button>' +
                        (usos > 0 ? '<button type="button" class="vocab-sub-btn" onclick="registrarUsoPalabraVocab(\'' + escaparHTMLVocab(w.id) + '\', -1)" title="Restar 1 uso">−1</button>' : '') +
                        '<button type="button" class="vocab-sub-btn" onclick="toggleSemanaPalabraVocab(\'' + escaparHTMLVocab(w.id) + '\')" title="' + toggleSemTitle + '">' + toggleSemLabel + '</button>' +
                    '</div>' +
                '</div>' +
            '</article>';
    });

    gridEl.innerHTML = html;
}
window.renderizarVocabularioSemanal = renderizarVocabularioSemanal;

function abrirModalVocabulario(editId) {
    var modal = document.getElementById('modal-vocabulario-palabra');
    if (!modal) return;

    var titEl = document.getElementById('modal-vocab-titulo');
    var btnSave = document.getElementById('btn-guardar-vocab-modal');
    var inId = document.getElementById('input-vocab-edit-id');
    var inPal = document.getElementById('input-vocab-palabra');
    var inCtx = document.getElementById('input-vocab-contexto');
    var inMeta = document.getElementById('input-vocab-meta');
    var inSig = document.getElementById('input-vocab-significado');
    var inReemp = document.getElementById('input-vocab-reemplaza');
    var inEj = document.getElementById('input-vocab-ejemplo');
    var inSem = document.getElementById('input-vocab-en-semana');

    var lista = asegurarVocabularioState();
    var item = editId ? lista.find(function(w) { return w && w.id === editId; }) : null;

    if (item) {
        if (titEl) titEl.textContent = 'EDITAR PALABRA DE VOCABULARIO';
        if (btnSave) btnSave.textContent = '✓ Guardar Cambios';
        if (inId) inId.value = item.id;
        if (inPal) inPal.value = item.palabra || '';
        if (inCtx) inCtx.value = item.contexto || 'Conversación';
        if (inMeta) inMeta.value = String(item.metaSemanal || 3);
        if (inSig) inSig.value = item.significado || '';
        if (inReemp) inReemp.value = item.reemplazaA || '';
        if (inEj) inEj.value = item.ejemplo || '';
        if (inSem) inSem.checked = (item.enSemanaActual !== false);
    } else {
        if (titEl) titEl.textContent = 'AGREGAR PALABRA A LA SEMANA';
        if (btnSave) btnSave.textContent = '🗣️ Guardar Palabra (+15 EXP)';
        if (inId) inId.value = '';
        if (inPal) inPal.value = '';
        if (inCtx) inCtx.value = 'Conversación';
        if (inMeta) inMeta.value = '3';
        if (inSig) inSig.value = '';
        if (inReemp) inReemp.value = '';
        if (inEj) inEj.value = '';
        if (inSem) inSem.checked = true;
    }

    modal.style.display = 'flex';
    if (inPal) setTimeout(function() { inPal.focus(); }, 60);
}
window.abrirModalVocabulario = abrirModalVocabulario;

function cerrarModalVocabulario() {
    var modal = document.getElementById('modal-vocabulario-palabra');
    if (modal) modal.style.display = 'none';
}
window.cerrarModalVocabulario = cerrarModalVocabulario;

function sugerirPalabraVocabModal() {
    var existentes = asegurarVocabularioState().map(function(w) {
        return String(w && w.palabra || '').trim().toLowerCase();
    });
    var disponibles = BANCO_SUGERENCIAS_VOCAB.filter(function(s) {
        return existentes.indexOf(s.palabra.toLowerCase()) === -1;
    });
    var pool = disponibles.length > 0 ? disponibles : BANCO_SUGERENCIAS_VOCAB;
    var pick = pool[VOCAB_SUGERENCIA_IDX % pool.length];
    VOCAB_SUGERENCIA_IDX++;

    var inPal = document.getElementById('input-vocab-palabra');
    var inCtx = document.getElementById('input-vocab-contexto');
    var inSig = document.getElementById('input-vocab-significado');
    var inReemp = document.getElementById('input-vocab-reemplaza');
    var inEj = document.getElementById('input-vocab-ejemplo');
    if (inPal) inPal.value = pick.palabra;
    if (inCtx) inCtx.value = pick.contexto;
    if (inSig) inSig.value = pick.significado;
    if (inReemp) inReemp.value = pick.reemplazaA;
    if (inEj) inEj.value = pick.ejemplo;
}
window.sugerirPalabraVocabModal = sugerirPalabraVocabModal;

function guardarPalabraVocabulario() {
    var inId = document.getElementById('input-vocab-edit-id');
    var inPal = document.getElementById('input-vocab-palabra');
    var inCtx = document.getElementById('input-vocab-contexto');
    var inMeta = document.getElementById('input-vocab-meta');
    var inSig = document.getElementById('input-vocab-significado');
    var inReemp = document.getElementById('input-vocab-reemplaza');
    var inEj = document.getElementById('input-vocab-ejemplo');
    var inSem = document.getElementById('input-vocab-en-semana');

    var palabra = inPal ? inPal.value.trim() : '';
    var significado = inSig ? inSig.value.trim() : '';
    var contexto = inCtx ? inCtx.value : 'Conversación';
    var metaSemanal = Math.min(10, Math.max(1, parseInt(inMeta ? inMeta.value : '3', 10) || 3));
    var reemplazaA = inReemp ? inReemp.value.trim() : '';
    var ejemplo = inEj ? inEj.value.trim() : '';
    var enSemanaActual = inSem ? !!inSem.checked : true;
    var editId = inId ? inId.value.trim() : '';

    if (!palabra) {
        alert("Escribe la palabra o expresión que quieres incorporar.");
        if (inPal) inPal.focus();
        return;
    }
    if (!significado) {
        alert("Agrega un significado breve para recordar cómo usarla.");
        if (inSig) inSig.focus();
        return;
    }

    var lista = asegurarVocabularioState();
    var ahora = Date.now();
    var semClave = obtenerRangoSemanaActualVocab().clave;

    if (editId) {
        var existente = lista.find(function(w) { return w && w.id === editId; });
        if (existente) {
            existente.palabra = palabra;
            existente.significado = significado;
            existente.contexto = contexto;
            existente.metaSemanal = metaSemanal;
            existente.reemplazaA = reemplazaA;
            existente.ejemplo = ejemplo;
            existente.enSemanaActual = enSemanaActual;
            existente.dominada = existente.dominada || ((Number(existente.usosSemana) || 0) >= metaSemanal);
            existente.fechaActualizacion = ahora;
        }
        MonarcaDB.save(APP_STATE);
        cerrarModalVocabulario();
        renderizarVocabularioSemanal();
        mostrarToastVocabulario('✏️ "' + palabra + '" actualizada.');
        return;
    }

    var nueva = {
        id: 'VOC-' + ahora,
        palabra: palabra,
        significado: significado,
        reemplazaA: reemplazaA,
        ejemplo: ejemplo,
        contexto: contexto,
        enSemanaActual: enSemanaActual,
        usosSemana: 0,
        usosTotales: 0,
        metaSemanal: metaSemanal,
        dominada: false,
        semanaClave: semClave,
        fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        timestamp: ahora,
        fechaActualizacion: ahora
    };

    lista.unshift(nueva);
    if (typeof sumarExp === 'function') sumarExp(15);
    MonarcaDB.save(APP_STATE);

    cerrarModalVocabulario();
    if (enSemanaActual && FILTRO_VOCABULARIO_ACTIVO === 'dominadas') {
        FILTRO_VOCABULARIO_ACTIVO = 'semana';
        cambiarFiltroVocabulario('semana');
    } else {
        renderizarVocabularioSemanal();
    }
    mostrarToastVocabulario('🗣️ "' + palabra + '" agregada a tu vocabulario semanal (+15 EXP).');
}
window.guardarPalabraVocabulario = guardarPalabraVocabulario;

function registrarUsoPalabraVocab(id, delta) {
    var lista = asegurarVocabularioState();
    var w = lista.find(function(x) { return x && x.id === id; });
    if (!w) return;

    var d = Number(delta) || 1;
    var meta = Math.max(1, Number(w.metaSemanal) || 3);
    var antesDom = !!w.dominada;

    if (d > 0) {
        w.usosSemana = (Number(w.usosSemana) || 0) + 1;
        w.usosTotales = (Number(w.usosTotales) || 0) + 1;
        if (w.enSemanaActual === false) w.enSemanaActual = true;
        if (typeof sumarExp === 'function') sumarExp(10);
        if (APP_STATE.menteAtributos && APP_STATE.menteAtributos.conocimiento !== undefined) {
            APP_STATE.menteAtributos.conocimiento = Math.min(100, (APP_STATE.menteAtributos.conocimiento || 0) + 2);
        }
        if (w.usosSemana >= meta && !antesDom) {
            w.dominada = true;
            if (typeof sumarExp === 'function') sumarExp(20);
            mostrarToastVocabulario('⭐ ¡"' + w.palabra + '" dominada esta semana (' + w.usosSemana + '/' + meta + ')! +30 EXP.');
        } else {
            mostrarToastVocabulario('🗣️ Uso registrado para "' + w.palabra + '" (' + w.usosSemana + '/' + meta + ') · +10 EXP.');
        }
    } else {
        w.usosSemana = Math.max(0, (Number(w.usosSemana) || 0) - 1);
        w.usosTotales = Math.max(0, (Number(w.usosTotales) || 0) - 1);
        if (w.usosSemana < meta) w.dominada = false;
        mostrarToastVocabulario('↺ Ajuste en "' + w.palabra + '" (' + w.usosSemana + '/' + meta + ').');
    }

    w.fechaActualizacion = Date.now();
    MonarcaDB.save(APP_STATE);

    var flash = document.getElementById('contenedor-vocabulario-flash');
    if (flash && flash.getAttribute('data-flash-id') === id) {
        flash.style.display = 'none';
    }
    renderizarVocabularioSemanal();
}
window.registrarUsoPalabraVocab = registrarUsoPalabraVocab;

function toggleSemanaPalabraVocab(id) {
    var lista = asegurarVocabularioState();
    var w = lista.find(function(x) { return x && x.id === id; });
    if (!w) return;
    w.enSemanaActual = (w.enSemanaActual === false);
    if (w.enSemanaActual) {
        w.semanaClave = obtenerRangoSemanaActualVocab().clave;
    }
    w.fechaActualizacion = Date.now();
    MonarcaDB.save(APP_STATE);
    renderizarVocabularioSemanal();
    mostrarToastVocabulario(w.enSemanaActual
        ? ('🔥 "' + w.palabra + '" activada para esta semana.')
        : ('📦 "' + w.palabra + '" guardada en tu banco general.'));
}
window.toggleSemanaPalabraVocab = toggleSemanaPalabraVocab;

function mostrarPalabraAlAzarVocab() {
    var flash = document.getElementById('contenedor-vocabulario-flash');
    if (!flash) return;
    var lista = asegurarVocabularioState();
    var activas = lista.filter(function(w) { return w && w.enSemanaActual !== false; });
    if (activas.length === 0) {
        mostrarToastVocabulario('Agrega al menos una palabra a esta semana para sortear tu reto.');
        return;
    }
    var pendientes = activas.filter(function(w) { return (Number(w.usosSemana) || 0) < Math.max(1, Number(w.metaSemanal) || 3); });
    var pool = pendientes.length > 0 ? pendientes : activas;
    var pick = pool[Math.floor(Math.random() * pool.length)];

    flash.setAttribute('data-flash-id', pick.id);
    flash.innerHTML =
        '<div class="vocab-flash-card">' +
            '<div style="min-width:0; flex:1;">' +
                '<div style="font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.6px; color:#6ee7b7;">🎯 Reto rápido de conversación</div>' +
                '<div style="font-size:17px; font-weight:800; color:#f8fafc; margin-top:2px;">Usa “' + escaparHTMLVocab(pick.palabra) + '” hoy</div>' +
                '<div style="font-size:12px; color:#cbd5e1; margin-top:3px;">' + escaparHTMLVocab(pick.significado) + '</div>' +
            '</div>' +
            '<div style="display:flex; align-items:center; gap:6px;">' +
                '<button type="button" class="vocab-use-btn" style="padding:8px 12px;" onclick="registrarUsoPalabraVocab(\'' + escaparHTMLVocab(pick.id) + '\', 1)">🗣️ ¡La usé!</button>' +
                '<button type="button" class="vocab-icon-btn" onclick="document.getElementById(\'contenedor-vocabulario-flash\').style.display=\'none\'" title="Cerrar">✕</button>' +
            '</div>' +
        '</div>';
    flash.style.display = 'block';
}
window.mostrarPalabraAlAzarVocab = mostrarPalabraAlAzarVocab;

function iniciarNuevaSemanaVocabulario() {
    var lista = asegurarVocabularioState();
    var activas = lista.filter(function(w) { return w && w.enSemanaActual !== false; });
    if (activas.length === 0) {
        mostrarToastVocabulario('No hay palabras activas esta semana todavía.');
        return;
    }
    if (!confirm('¿Iniciar una nueva semana de vocabulario?\n\n• Las palabras que ya dominaste pasarán a tu banco de "⭐ Dominadas".\n• Las pendientes seguirán activas con su contador semanal en 0.')) return;

    var semClave = obtenerRangoSemanaActualVocab().clave;
    var graduadas = 0;
    activas.forEach(function(w) {
        var meta = Math.max(1, Number(w.metaSemanal) || 3);
        if (w.dominada || (Number(w.usosSemana) || 0) >= meta) {
            w.dominada = true;
            w.enSemanaActual = false;
            graduadas++;
        } else {
            w.usosSemana = 0;
            w.semanaClave = semClave;
        }
        w.fechaActualizacion = Date.now();
    });
    MonarcaDB.save(APP_STATE);
    renderizarVocabularioSemanal();
    mostrarToastVocabulario('🔄 Nueva semana iniciada (' + graduadas + ' palabra' + (graduadas === 1 ? '' : 's') + ' graduada' + (graduadas === 1 ? '' : 's') + ' a Dominadas).');
}
window.iniciarNuevaSemanaVocabulario = iniciarNuevaSemanaVocabulario;

function eliminarPalabraVocab(id) {
    if (!confirm('¿Eliminar esta palabra de tu vocabulario?')) return;
    var lista = asegurarVocabularioState();
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('vocabulario', id);
    }
    APP_STATE.vocabulario = lista.filter(function(w) { return w && w.id !== id; });
    MonarcaDB.save(APP_STATE);
    renderizarVocabularioSemanal();
}
window.eliminarPalabraVocab = eliminarPalabraVocab;


// ==========================================================================
// 12. CALENDARIO
// ==========================================================================

