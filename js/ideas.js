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
        if (!esEmily && chkAutoPC) {
            chkAutoPC.checked = false;
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
                <span class="category-card-explore">Explorar ›</span>
            </div>
        </div>`;
    });

    contenedor.innerHTML = html;
    actualizarBadgesIdeas();
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
    var esEmily = catNombre.toLowerCase().includes('emily');

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
                    if (autopcEstado === 'running') {
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
        chkAutoPC.checked = false;
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
    for (var i = 0; i < APP_STATE.ideas.length; i++) {
        if (String(APP_STATE.ideas[i].id) === String(id)) {
            encontrada = APP_STATE.ideas[i];
            encontrada.hecha = !encontrada.hecha;
            if (encontrada.hecha) {
                encontrada.timestampHecha = Date.now();
                encontrada.fechaHecha = new Date().toLocaleDateString('es-ES');
                if (encontrada.autopcStatus === 'pending' || encontrada.autopcPendienteSubida) {
                    encontrada.autopcPendienteSubida = false;
                    encontrada.autopcStatus = null;
                    cancelarColaRemotaSiExiste(encontrada.id);
                }
                sumarExp(15);
            } else if (encontrada.autopcStatus || encontrada.completadaPorAutoPC) {
                encontrada.autopcStatus = null;
                encontrada.autopcPendienteSubida = false;
                encontrada.completadaPorAutoPC = false;
                cancelarColaRemotaSiExiste(encontrada.id);
            }
            break;
        }
    }

    MonarcaDB.save(APP_STATE);

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
    if (encontrada && encontrada.imagenId) {
        eliminarImagenIdeaCompleta(encontrada.imagenId);
    }

    APP_STATE.ideas = APP_STATE.ideas.filter(function(i) { return String(i.id) !== String(id); });
    MonarcaDB.save(APP_STATE);

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

async function enviarIdeaAAutoPC(id, desdeCreacion) {
    if (!APP_STATE.ideas) return false;
    var idea = APP_STATE.ideas.find(function(i) { return String(i.id) === String(id); });
    if (!idea || idea.hecha) return false;

    var promptLimpio = obtenerPromptParaAutoPC(idea);
    idea.textoPrompt = promptLimpio;
    idea.autopcStatus = 'pending';
    idea.autopcPendienteSubida = true;
    var payloadSolicitud = construirPayloadSolicitudAutoPC(idea, promptLimpio);
    AUTOPC_SOLICITUDES_MAP[String(idea.id)] = Object.assign({
        status: 'pending',
        updatedAt: Date.now()
    }, payloadSolicitud);

    MonarcaDB.save(APP_STATE);
    if (!desdeCreacion) {
        reRenderVistaIdeasActual();
    }

    if (window.MonarcaCloud && typeof window.MonarcaCloud.enviarSolicitudAutoPC === 'function') {
        try {
            if (idea.tieneImagen && idea.imagenId) {
                await asegurarImagenIdeaEnNube(idea);
            }
            await window.MonarcaCloud.enviarSolicitudAutoPC(payloadSolicitud);
            idea.autopcPendienteSubida = false;
            idea.imagenPendienteSubida = false;
            MonarcaDB.save(APP_STATE);
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca(
                    idea.tieneImagen
                        ? 'Solicitud + imagen enviadas a Auto-PC'
                        : 'Solicitud enviada a la cola de Auto-PC',
                    '🤖'
                );
            }
            reRenderSiVistaIdeasActiva();
            return true;
        } catch (err) {
            console.warn('[Auto-PC] Subida diferida (sin conexión o iniciando nube):', err);
            idea.autopcPendienteSubida = true;
            MonarcaDB.save(APP_STATE);
            if (typeof mostrarToastMonarca === 'function') {
                mostrarToastMonarca('Guardada · se enviará a Auto-PC al conectar', '⏳');
            }
            return false;
        }
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
        }
    }

    // Subir también imágenes pendientes de otras categorías que se hubieran creado sin conexión
    var imagenesPendientes = APP_STATE.ideas.filter(function(i) {
        return i && i.tieneImagen && i.imagenId && i.imagenPendienteSubida === true && !i.autopcPendienteSubida;
    });
    var imgsSubidas = 0;
    for (var m = 0; m < imagenesPendientes.length; m++) {
        try {
            await asegurarImagenIdeaEnNube(imagenesPendientes[m]);
            imgsSubidas++;
        } catch (errImg) {
            console.warn('[Ideas Imagen] Reintento diferido fallido:', errImg);
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

function registrarNotificacionSolicitudAutoPC(docRemoto, ideaAsociada) {
    if (!APP_STATE) return false;
    var solicitudId = String((docRemoto && (docRemoto.ideaId || docRemoto.id)) || (ideaAsociada && ideaAsociada.id) || '').trim();
    if (!solicitudId) return false;

    if (!Array.isArray(APP_STATE.notificacionesAutoPC)) APP_STATE.notificacionesAutoPC = [];
    if (!APP_STATE._eliminados) APP_STATE._eliminados = {};
    if (!Array.isArray(APP_STATE._eliminados.notificacionesAutoPC)) APP_STATE._eliminados.notificacionesAutoPC = [];

    var tsKeyPart = Number(docRemoto && docRemoto.updatedAt) || Number(docRemoto && docRemoto.createdAt) || 'done';
    var notifKey = String(solicitudId + '@' + tsKeyPart).replace(/[^a-zA-Z0-9_@.-]/g, '_');

    var yaActiva = APP_STATE.notificacionesAutoPC.some(function(n) { return n && String(n.id) === notifKey; });
    var yaDescartada = APP_STATE._eliminados.notificacionesAutoPC.some(function(eid) { return String(eid) === notifKey; });
    if (yaActiva || yaDescartada) return false;

    var rawTexto = (docRemoto && docRemoto.text) || (ideaAsociada && (ideaAsociada.textoPrompt || ideaAsociada.texto)) || ('Solicitud #' + solicitudId);
    var textoLimpio = obtenerTextoPromptLimpio(rawTexto);
    var cat = String((docRemoto && docRemoto.categoria) || (ideaAsociada && ideaAsociada.categoria) || '🤖 Auto-PC Local');
    var subcat = String((docRemoto && docRemoto.subcategoria) || (ideaAsociada && ideaAsociada.subcategoria) || 'Lista');
    var tsNotif = Number(docRemoto && docRemoto.updatedAt) || Number(docRemoto && docRemoto.createdAt) || Date.now();

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
    if (typeof APP_STATE === 'undefined' || !APP_STATE || !Array.isArray(APP_STATE.notificacionesAutoPC)) {
        return [];
    }
    var eliminadas = (APP_STATE._eliminados && Array.isArray(APP_STATE._eliminados.notificacionesAutoPC))
        ? APP_STATE._eliminados.notificacionesAutoPC.map(String)
        : [];

    return APP_STATE.notificacionesAutoPC
        .filter(function(n) { return n && n.id && eliminadas.indexOf(String(n.id)) === -1; })
        .map(function(n) {
            var ts = Number(n.timestamp) || Date.now();
            var d = new Date(ts);
            var horaTxt = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            var fechaTxt = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            var texto = String(n.texto || '').trim() || ('Solicitud #' + (n.solicitudId || ''));
            var resumen = texto.length > 68 ? (texto.slice(0, 65) + '...') : texto;
            var safeId = String(n.id).replace(/[^a-zA-Z0-9_@.-]/g, '_');

            var acciones = [
                {
                    tipo: 'primary',
                    texto: '✓ Entendido',
                    fn: "descartarNotificacionAutoPC('" + safeId + "')"
                }
            ];
            if (n.esDeEmily) {
                acciones.push({
                    tipo: 'secondary',
                    texto: '📈 Ver Hecha',
                    fn: "cerrarCentroNotificaciones(); verSolicitudAutoPCEnOperatividad()"
                });
            }

            return {
                id: 'alerta-autopc-' + safeId,
                autopcNotifId: String(n.id),
                tipo: 'autopc',
                icono: '🤖',
                badge: 'Auto-PC · Lista',
                color: '#10b981',
                titulo: 'Solicitud ya fue añadida: "' + resumen + '"',
                metaLinea: '🕒 ' + horaTxt + ' · ' + fechaTxt + ' · ' + (n.esDeEmily ? '✨ Emily → Hecha' : '💻 Cola local Auto-PC'),
                descripcion: 'La solicitud "' + texto + '" terminó en tu Auto-PC y ya fue añadida correctamente.',
                acciones: acciones,
                _sortTs: ts
            };
        })
        .sort(function(a, b) { return (b._sortTs || 0) - (a._sortTs || 0); });
}

function descartarNotificacionAutoPC(notifId) {
    if (!APP_STATE) return;
    var key = String(notifId || '').trim();
    if (!key) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('notificacionesAutoPC', key);
    } else {
        if (!APP_STATE._eliminados) APP_STATE._eliminados = {};
        if (!Array.isArray(APP_STATE._eliminados.notificacionesAutoPC)) APP_STATE._eliminados.notificacionesAutoPC = [];
        if (APP_STATE._eliminados.notificacionesAutoPC.indexOf(key) === -1) {
            APP_STATE._eliminados.notificacionesAutoPC.push(key);
        }
    }
    if (Array.isArray(APP_STATE.notificacionesAutoPC)) {
        APP_STATE.notificacionesAutoPC = APP_STATE.notificacionesAutoPC.filter(function(n) {
            return n && String(n.id) !== key;
        });
    }
    MonarcaDB.save(APP_STATE);
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof renderizarCentroNotificaciones === 'function') renderizarCentroNotificaciones();
}

function descartarTodasNotificacionesAutoPC() {
    if (!APP_STATE || !Array.isArray(APP_STATE.notificacionesAutoPC) || APP_STATE.notificacionesAutoPC.length === 0) return;
    APP_STATE.notificacionesAutoPC.forEach(function(n) {
        if (n && n.id && typeof registrarTombstone === 'function') {
            registrarTombstone('notificacionesAutoPC', String(n.id));
        }
    });
    APP_STATE.notificacionesAutoPC = [];
    MonarcaDB.save(APP_STATE);
    if (typeof actualizarBadgeNotificaciones === 'function') actualizarBadgeNotificaciones();
    if (typeof renderizarCentroNotificaciones === 'function') renderizarCentroNotificaciones();
    if (typeof mostrarToastMonarca === 'function') {
        mostrarToastMonarca('Alertas de Auto-PC limpiadas', '✅');
    }
}

function verSolicitudAutoPCEnOperatividad() {
    if (typeof cambiarVista === 'function') {
        cambiarVista('vista-ideas');
    }
    if (typeof alternarSubvistaIdeas === 'function') {
        alternarSubvistaIdeas('operatividad');
    }
}

function procesarSnapshotAutoPCIdeas(lista) {
    var nuevoMapa = {};
    var docsDone = [];
    var nuevaTelemetria = null;
    if (Array.isArray(lista)) {
        lista.forEach(function(item) {
            if (!item) return;
            var key = String(item.ideaId || item.id || '').trim();
            var docType = String(item.docType || '').toLowerCase();
            if (docType === 'telemetry' || key === '_estado_pc' || key.indexOf('_') === 0) {
                nuevaTelemetria = Object.assign({}, item);
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
    AUTOPC_SOLICITUDES_MAP = nuevoMapa;
    if (nuevaTelemetria) {
        AUTOPC_TELEMETRIA_PC = nuevaTelemetria;
    }

    if (!APP_STATE) {
        return { completadasAhora: 0, huboCambioEstado: false, nuevasNotificaciones: 0 };
    }
    if (!Array.isArray(APP_STATE.ideas)) APP_STATE.ideas = [];

    var completadasAhora = 0;
    var huboCambioEstado = false;
    var nuevasNotificaciones = 0;

    APP_STATE.ideas.forEach(function(idea) {
        if (!idea) return;
        var docRemoto = AUTOPC_SOLICITUDES_MAP[String(idea.id)];
        if (docRemoto) {
            var statusRemoto = String(docRemoto.status || 'pending').toLowerCase();
            if (statusRemoto === 'done') {
                if (idea.autopcStatus !== 'done' || idea.autopcPendienteSubida) {
                    huboCambioEstado = true;
                }
                idea.autopcStatus = 'done';
                idea.autopcPendienteSubida = false;
                if (!idea.hecha) {
                    idea.hecha = true;
                    idea.timestampHecha = Number(docRemoto.updatedAt) || Date.now();
                    idea.fechaHecha = new Date(idea.timestampHecha).toLocaleDateString('es-ES');
                    idea.completadaPorAutoPC = true;
                    completadasAhora++;
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
        var ideaAsociada = APP_STATE.ideas.find(function(i) { return i && String(i.id) === solId; }) || null;
        if (registrarNotificacionSolicitudAutoPC(docRemoto, ideaAsociada)) {
            nuevasNotificaciones++;
        }
    });

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
    } else if (nuevasNotificaciones > 0 || huboCambioEstado) {
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

    if (nuevasNotificaciones > 0) {
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
        nuevasNotificaciones: nuevasNotificaciones
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
        var itemObj = {
            id: key,
            texto: texto,
            status: st,
            updatedAt: tsUpdated,
            createdAt: tsCreated,
            ageMs: tsUpdated > 0 ? Math.max(0, now - tsUpdated) : null
        };
        vistos[key] = true;
        if (st === 'running') runningItems.push(itemObj);
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
            ageMs: ts > 0 ? Math.max(0, now - ts) : null
        };
        if (stLocal === 'running') runningItems.push(obj);
        else if (stLocal === 'pending' || stLocal === 'offline') {
            if (stLocal === 'offline') offlinePending++;
            pendingItems.push(obj);
        } else if (stLocal === 'done') {
            doneItems.push(obj);
        }
    });

    runningItems.sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    pendingItems.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
    doneItems.sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });

    var heartbeatAt = (tel && Number(tel.heartbeatAt) > 0) ? Number(tel.heartbeatAt) : 0;
    var heartbeatAgeMs = heartbeatAt > 0 ? Math.max(0, now - heartbeatAt) : null;
    var proyecto = (tel && tel.projectTitle) ? String(tel.projectTitle).trim() : '';
    var detailTel = (tel && tel.detail) ? String(tel.detail).trim() : '';
    var busyTel = (tel && tel.busyReason) ? String(tel.busyReason).trim() : '';
    var agVisible = (tel && typeof tel.antigravityVisible === 'boolean') ? tel.antigravityVisible : null;
    var engState = (tel && tel.engineState) ? String(tel.engineState).toUpperCase() : '';
    var phaseTel = (tel && tel.phase) ? String(tel.phase).toUpperCase() : '';

    var countRunning = runningItems.length;
    var countPending = pendingItems.length;
    var countDone = doneItems.length;
    if (tel && heartbeatAgeMs !== null && heartbeatAgeMs <= 45000) {
        countRunning = Math.max(countRunning, Number(tel.runningCount) || 0);
        countPending = Math.max(countPending, Number(tel.pendingCount) || 0);
        countDone = Math.max(countDone, Number(tel.doneCount) || 0);
    }

    var primaryRunning = runningItems[0] || null;
    if (!primaryRunning && tel && (Number(tel.runningCount) || 0) > 0 && tel.activeText && heartbeatAgeMs !== null && heartbeatAgeMs <= 60000) {
        var phTs = Number(tel.phaseChangedAt || tel.heartbeatAt) || now;
        primaryRunning = {
            id: String(tel.activeSourceId || 'pc-active'),
            texto: String(tel.activeText),
            status: 'running',
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

    if (tel && engState === 'OFFLINE') {
        nivel = countPending > 0 || countRunning > 0 ? 'warning' : 'offline';
        badgeTexto = 'Auto-PC cerrado';
        resumenTexto = (countPending > 0 || countRunning > 0)
            ? ('Auto-PC se cerró con ' + (countPending + countRunning) + ' solicitud(es) pendiente(s).')
            : 'Auto-PC se cerró correctamente en tu computadora.';
        if (countPending > 0 || countRunning > 0) {
            alertaStuck = 'El programa Auto-PC fue cerrado en la PC; ábrelo para continuar la cola.';
        }
    } else if (tel && heartbeatAgeMs !== null && heartbeatAgeMs <= 35000) {
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
            } else if (agVisible === false && (countRunning > 0 || countPending > 0)) {
                nivel = 'warning';
                badgeTexto = 'Sin Antigravity';
                resumenTexto = detailTel || 'Auto-PC no detecta la ventana de Antigravity.';
                alertaStuck = 'Abre o deja visible Antigravity con el proyecto en tu PC.';
            } else if ((countRunning > 0 || phaseTel === 'WAITING_RESPONSE' || phaseTel === 'WAIT_CURRENT') && enCursoAgeMs > 600000) {
                nivel = 'stalled';
                badgeTexto = 'Posible traba (>10m)';
                resumenTexto = detailTel || ('Lleva ' + formatearDuracionCortaAutoPC(enCursoAgeMs) + ' en la misma solicitud.');
                alertaStuck = 'La solicitud supera 10 minutos activa; verifica si Antigravity terminó o se quedó esperando.';
            } else if (countRunning > 0 || busyTel || phaseTel === 'WAITING_RESPONSE' || phaseTel === 'WAIT_CURRENT' || phaseTel === 'READY_TO_SEND') {
                nivel = 'working';
                badgeTexto = 'Trabajando en proyecto';
                resumenTexto = detailTel || (busyTel ? ('Antigravity activo (' + busyTel + ')') : 'Ejecutando solicitud actual en Antigravity...');
            } else {
                nivel = 'idle';
                badgeTexto = 'Activo y vigilando';
                resumenTexto = detailTel || 'Vigilando botón Submit y escuchando nuevas ideas desde Emily.';
            }
        }
    } else if (tel && heartbeatAgeMs !== null && heartbeatAgeMs > 35000) {
        if (countRunning > 0 || countPending > 0) {
            nivel = 'stalled';
            badgeTexto = 'Posible traba · Sin latido';
            resumenTexto = 'Sin señal de Auto-PC desde hace ' + formatearDuracionCortaAutoPC(heartbeatAgeMs) + '.';
            alertaStuck = 'No llega latido reciente desde tu PC; revisa si Auto-PC se congeló, la PC se suspendió o perdió internet.';
        } else {
            nivel = 'offline';
            badgeTexto = 'Sin señal reciente';
            resumenTexto = 'Última conexión de Auto-PC hace ' + formatearDuracionCortaAutoPC(heartbeatAgeMs) + '.';
        }
    } else {
        if (countRunning > 0) {
            if (enCursoAgeMs > 600000) {
                nivel = 'stalled';
                badgeTexto = 'Posible traba (>10m)';
                resumenTexto = 'Lleva ' + formatearDuracionCortaAutoPC(enCursoAgeMs) + ' en estado Programando en PC.';
                alertaStuck = 'Más de 10 minutos sin pasar a Lista; verifica Auto-PC en tu computadora.';
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
    } else if (tel && tel.activeText && (nivel === 'working' || nivel === 'stalled' || nivel === 'warning')) {
        solicitudActual = {
            id: String(tel.activeSourceId || 'pc'),
            texto: String(tel.activeText),
            status: countRunning > 0 ? 'running' : 'pending',
            elapsedMs: enCursoAgeMs
        };
    }

    var recientes = [];
    runningItems.slice(0, 1).forEach(function(it) { recientes.push(it); });
    pendingItems.slice(0, 2).forEach(function(it) {
        if (recientes.length < 3) recientes.push(it);
    });
    doneItems.slice(0, 2).forEach(function(it) {
        if (recientes.length < 3) recientes.push(it);
    });

    return {
        nivel: nivel,
        badgeTexto: badgeTexto,
        resumenTexto: resumenTexto,
        proyecto: proyecto,
        antigravityVisible: agVisible,
        heartbeatAgeMs: heartbeatAgeMs,
        enCursoAgeMs: enCursoAgeMs,
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

if (typeof window !== 'undefined') {
    window.enviarIdeaAAutoPC = enviarIdeaAAutoPC;
    window.cancelarIdeaAutoPC = cancelarIdeaAutoPC;
    window.procesarPendientesOfflineAutoPC = procesarPendientesOfflineAutoPC;
    window.procesarSnapshotAutoPCIdeas = procesarSnapshotAutoPCIdeas;
    window.obtenerEstadoTelemetryAutoPC = obtenerEstadoTelemetryAutoPC;
    window.obtenerResumenMonitoreoAutoPC = obtenerResumenMonitoreoAutoPC;
    window.formatearDuracionCortaAutoPC = formatearDuracionCortaAutoPC;
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
        ESTADO_IDEAS.graficoChartInstance.destroy();
    }

    var labels = Object.keys(conteoPorCat).map(function(c) {
        return c.replace(/^[^\w\s]+\s*/, '');
    });
    var dataValues = Object.values(conteoPorCat);

    try {
        var ctx = canvas.getContext('2d');
        ESTADO_IDEAS.graficoChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ideas Ejecutadas',
                    data: dataValues,
                    backgroundColor: '#111827',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0, font: { family: 'Plus Jakarta Sans' } } },
                    x: { ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } catch (e) {
        console.warn("Chart.js para operatividad no disponible:", e);
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
        cont.innerHTML = '<p style="color:#6b7280; font-size:13px; text-align:center; padding:16px;">Sin ideas completadas en este mes.</p>';
        return;
    }

    var html = '';
    ejecutadas.forEach(function(i) {
        var idAttr = escapeHtmlIdea(String(i.id));
        var catLimpia = (i.categoria || 'Idea').replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}✨✦🤖💡🛒📊📚✅\s]+/u, '').trim();
        var imgOpHtml = renderizarMiniaturaImagenIdeaHtml(i);
        html += `
        <div class="idea-clean-item is-done">
            <div class="idea-item-left">
                <span class="idea-dash" style="color: #10b981 !important;">✓</span>
                <div class="idea-item-content">
                    <span class="idea-text-line" style="text-decoration: line-through; color: #64748b;">${escapeHtmlIdea(i.texto)}</span>
                    ${imgOpHtml}
                    <div class="idea-meta-badges">
                        <span class="idea-category-badge">${escapeHtmlIdea(catLimpia)}</span>
                        ${i.subcategoria ? `<span style="font-size: 11px; color: #94a3b8; font-weight: 500;">• ${escapeHtmlIdea(i.subcategoria)}</span>` : ''}
                        <span style="font-size: 10.5px; color: #10b981; font-weight: 700; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); padding: 2px 8px; border-radius: 9999px;">✓ Ejecutada</span>
                        ${i.completadaPorAutoPC ? '<span class="idea-autopc-badge is-done">🤖 Auto-PC</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="idea-actions-group">
                <button class="idea-btn-check checked" onclick="marcarIdeaHechaUI('${idAttr}')" title="Desmarcar y devolver a pendientes">
                    Desmarcar ↩
                </button>
                <button class="btn-delete-row" onclick="eliminarIdea('${idAttr}')">✕</button>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
    hidratarImagenesIdeasEnDOM();
}

function inicializarHojaIdeasDesdeUI() {
    MonarcaDB.exportBackup();
}

// ==========================================================================
// 📚 BASE DE CONOCIMIENTOS & REVISIÓN SEMANAL DE APRENDIZAJES
// ==========================================================================

var FILTRO_AREA_CONOCIMIENTO = "TODAS";

function cargarConocimientos(filtro) {
    if (filtro) FILTRO_AREA_CONOCIMIENTO = filtro;
    renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
}

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
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Ciclo de Repaso Activo</div>
                    <h3 style="margin: 2px 0 0 0; font-size: 17px; font-weight: 800; color: #f8fafc;">Revisión Semanal de Conocimientos</h3>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
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
        <div style="grid-column: 1 / -1; text-align: center; padding: 32px 16px; background: #0b0e15; border: 1px dashed #d1d5db; border-radius: 12px;">
            <p style="margin: 0; color: #6b7280; font-size: 13.5px;">No hay conocimientos registrados en esta área.</p>
            <button class="btn-system" style="margin-top: 12px; font-size: 12.5px;" onclick="abrirModalNuevoConocimiento()">+ Registrar Nuevo Conocimiento</button>
        </div>`;
        return;
    }

    var html = '';
    filtrados.forEach(function(c) {
        var estadoBadge = c.revisadoEstaSemana ? 
            `<span style="font-size: 11px; font-weight: 700; background: #ecfdf5; color: #059669; padding: 3px 8px; border-radius: 9999px; border: 1px solid #a7f3d0;">✓ Repasado esta semana</span>` :
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
                    <button onclick="eliminarConocimiento('${c.id}')" title="Eliminar técnica" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 2px 6px; font-size: 13px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#9ca3af'">🗑️</button>
                </div>
            </div>

            <div style="font-size: 11.5px; color: #6b7280; margin-bottom: 10px;">
                <strong>Origen:</strong> ${c.actividadOrigen || 'Actividad práctica'} · <span style="font-weight: 600; color: #cbd5e1;">${c.nivelDominio || 'En Práctica'}</span>
            </div>

            <div class="knowledge-keypoints-box">
                <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #6b7280; margin-bottom: 4px;">Puntos Clave & Técnica:</div>
                <p style="margin: 0; font-size: 12.5px; color: #f8fafc; line-height: 1.45; white-space: pre-wrap;">${c.resumenPuntosClave}</p>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid #f3f4f6; flex-wrap: wrap; gap: 8px;">
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
// 12. CALENDARIO
// ==========================================================================
