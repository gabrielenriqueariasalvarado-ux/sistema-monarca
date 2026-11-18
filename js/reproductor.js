// ==========================================================================
// SISTEMA MONARCA - MOTOR DE REPRODUCTOR DE MÚSICA MP3 OFFLINE (v10.50)
// Almacenamiento binario en IndexedDB, Carpetas, Playlists y Transferencia PC
// ==========================================================================

(function(window) {
    'use strict';

    var DB_NAME = 'MonarcaMusicaDB';
    var DB_VERSION = 1;
    var STORE_NAME = 'canciones';

    var state = {
        db: null,
        canciones: [],        // Metadatos { id, nombre, carpeta, tamano, tipo, fecha }
        playlists: [],        // { id, nombre, cancionIds: [] }
        subtabActual: 'todas',// 'todas' | 'carpetas' | 'playlists'
        carpetaSeleccionada: null,
        playlistSeleccionada: null,
        transferenciasPendientes: [],
        indiceActual: -1,
        cancionActual: null,
        audio: new Audio(),
        blobUrlActual: null,
        reproduciendo: false,
        shuffle: false,
        repeat: 'all',        // 'off' | 'all' | 'one'
        volumen: 1.0,
        busqueda: '',
        miniPlayerVisible: true
    };

    // ----------------------------------------------------------------------
    // 1. INICIALIZACIÓN DE INDEXEDDB
    // ----------------------------------------------------------------------
    function abrirDB() {
        return new Promise(function(resolve, reject) {
            if (state.db) return resolve(state.db);
            var req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function(e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    var store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('nombre', 'nombre', { unique: false });
                    store.createIndex('carpeta', 'carpeta', { unique: false });
                    store.createIndex('fecha', 'fecha', { unique: false });
                }
            };
            req.onsuccess = function(e) {
                state.db = e.target.result;
                resolve(state.db);
            };
            req.onerror = function(e) {
                console.error('[ReproductorDB] Error abriendo IndexedDB:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    // ----------------------------------------------------------------------
    // 2. OPERACIONES DE BIBLIOTECA EN INDEXEDDB (OPTIMIZADO PARA ALTO VOLUMEN)
    // ----------------------------------------------------------------------
    function cargarMetadatosCanciones() {
        return abrirDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction([STORE_NAME], 'readonly');
                var store = tx.objectStore(STORE_NAME);
                var req = store.openCursor();
                var lista = [];

                req.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        var val = cursor.value;
                        lista.push({
                            id: val.id,
                            nombre: val.nombre,
                            carpeta: val.carpeta || 'Principal',
                            tamano: val.tamano,
                            tipo: val.tipo,
                            fecha: val.fecha
                        });
                        cursor.continue();
                    } else {
                        lista.sort(function(a, b) { return (b.fecha || 0) - (a.fecha || 0); });
                        state.canciones = lista;
                        cargarPlaylistsStorage();
                        resolve(lista);
                    }
                };
                req.onerror = function(e) {
                    reject(e.target.error);
                };
            });
        });
    }

    function obtenerCancionCompleta(id) {
        return abrirDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction([STORE_NAME], 'readonly');
                var store = tx.objectStore(STORE_NAME);
                var req = store.get(id);
                req.onsuccess = function() {
                    resolve(req.result);
                };
                req.onerror = function(e) {
                    reject(e.target.error);
                };
            });
        });
    }

    function guardarCancionesFiles(fileList, carpetaForzada) {
        if (!fileList || fileList.length === 0) return Promise.resolve();

        return abrirDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction([STORE_NAME], 'readwrite');
                var store = tx.objectStore(STORE_NAME);

                for (var i = 0; i < fileList.length; i++) {
                    var file = fileList[i];
                    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|m4a|wav|ogg|aac|flac)$/i)) {
                        continue;
                    }
                    var dotIdx = file.name.lastIndexOf('.');
                    var cleanName = (dotIdx > 0) ? file.name.substring(0, dotIdx) : file.name;
                    var folder = carpetaForzada || 'Principal';
                    if (file.webkitRelativePath) {
                        var parts = file.webkitRelativePath.split('/');
                        if (parts.length > 1) {
                            folder = parts[parts.length - 2] || 'Principal';
                        }
                    }

                    var cancionObj = {
                        id: 'song_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 5),
                        nombre: cleanName,
                        carpeta: folder,
                        tamano: file.size,
                        tipo: file.type || 'audio/mpeg',
                        fecha: Date.now() + i,
                        blob: file
                    };
                    store.add(cancionObj);
                }

                tx.oncomplete = function() {
                    resolve();
                };
                tx.onerror = function(err) {
                    reject(err);
                };
            }).then(function() {
                return cargarMetadatosCanciones();
            });
        });
    }

    function guardarBlobDirecto(nombre, blob, carpeta) {
        return abrirDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction([STORE_NAME], 'readwrite');
                var store = tx.objectStore(STORE_NAME);
                var cancionObj = {
                    id: 'song_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    nombre: nombre,
                    carpeta: carpeta || 'Descargas PC',
                    tamano: blob.size,
                    tipo: blob.type || 'audio/mpeg',
                    fecha: Date.now(),
                    blob: blob
                };
                var req = store.add(cancionObj);
                req.onsuccess = function() { resolve(); };
                req.onerror = function(e) { reject(e); };
            }).then(function() {
                return cargarMetadatosCanciones();
            });
        });
    }

    function eliminarCancion(id) {
        if (!confirm('¿Eliminar esta canción de tu biblioteca?')) return Promise.resolve();

        return abrirDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction([STORE_NAME], 'readwrite');
                var store = tx.objectStore(STORE_NAME);
                var delReq = store.delete(id);
                delReq.onsuccess = function() {
                    if (state.cancionActual && state.cancionActual.id === id) {
                        detenerReproductor();
                    }
                    resolve();
                };
                delReq.onerror = function(e) { reject(e.target.error); };
            });
        }).then(function() {
            // Eliminar también de cualquier playlist
            state.playlists.forEach(function(pl) {
                pl.cancionIds = (pl.cancionIds || []).filter(function(cid) { return cid !== id; });
            });
            guardarPlaylistsStorage();
            return cargarMetadatosCanciones();
        }).then(function() {
            renderizarContenidoSegunSubtab();
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
        });
    }

    function vaciarBiblioteca() {
        if (!confirm('¿Estás seguro de que deseas vaciar toda la biblioteca de música? Esta acción no se puede deshacer.')) return;

        detenerReproductor();
        abrirDB().then(function(db) {
            var tx = db.transaction([STORE_NAME], 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = function() {
                state.canciones = [];
                state.playlists = [];
                guardarPlaylistsStorage();
                state.indiceActual = -1;
                state.cancionActual = null;
                renderizarContenidoSegunSubtab();
                actualizarUIPlayerCompleto();
                actualizarMiniPlayer();
            };
        });
    }

    // ----------------------------------------------------------------------
    // 3. PLAYLISTS (LISTAS DE REPRODUCCIÓN)
    // ----------------------------------------------------------------------
    function cargarPlaylistsStorage() {
        try {
            var raw = localStorage.getItem('monarca_musica_playlists');
            state.playlists = raw ? JSON.parse(raw) : [];
        } catch(e) {
            state.playlists = [];
        }
    }

    function guardarPlaylistsStorage() {
        try {
            localStorage.setItem('monarca_musica_playlists', JSON.stringify(state.playlists));
        } catch(e) {}
    }

    function crearPlaylistPrompt() {
        var nombre = prompt('Ingresa el nombre de la nueva Lista de Reproducción (ej: Gym Motivación, Enfoque Profundo):');
        if (!nombre || !nombre.trim()) return;
        var nueva = {
            id: 'pl_' + Date.now(),
            nombre: nombre.trim(),
            fecha: Date.now(),
            cancionIds: []
        };
        state.playlists.push(nueva);
        guardarPlaylistsStorage();
        renderizarContenidoSegunSubtab();
    }

    function agregarCancionAPlaylist(plId, songId) {
        var pl = state.playlists.find(function(p) { return p.id === plId; });
        if (!pl) return;
        if (!pl.cancionIds) pl.cancionIds = [];
        if (pl.cancionIds.indexOf(songId) === -1) {
            pl.cancionIds.push(songId);
            guardarPlaylistsStorage();
            alert('✓ Canción agregada a la lista "' + pl.nombre + '"');
        } else {
            alert('Esta canción ya está en la lista "' + pl.nombre + '"');
        }
    }

    function eliminarPlaylist(plId) {
        if (!confirm('¿Eliminar esta lista de reproducción? Las canciones se mantendrán en tu biblioteca.')) return;
        state.playlists = state.playlists.filter(function(p) { return p.id !== plId; });
        guardarPlaylistsStorage();
        if (state.playlistSeleccionada === plId) state.playlistSeleccionada = null;
        renderizarContenidoSegunSubtab();
    }

    // ----------------------------------------------------------------------
    // 4. MOTOR DE AUDIO Y CONTROL DE REPRODUCCIÓN
    // ----------------------------------------------------------------------
    function solicitarPermisoNotifReproductorSiFalta() {
        try {
            if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
                var ln = window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
                if (ln && !state._notifPermAsked) {
                    state._notifPermAsked = true;
                    ln.checkPermissions().then(function(res) {
                        if (res && res.display !== 'granted') {
                            return ln.requestPermissions();
                        }
                    }).catch(function() {});
                }
                return;
            }
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().catch(function() {});
            }
        } catch(e) {}
    }

    function reproducirIndice(idx) {
        solicitarPermisoNotifReproductorSiFalta();

        var listaActual = obtenerListaReproducibleActual();
        if (idx < 0 || idx >= listaActual.length) return;
        var meta = listaActual[idx];
        state.indiceActual = idx;

        obtenerCancionCompleta(meta.id).then(function(itemCompleto) {
            if (!itemCompleto || !itemCompleto.blob) {
                alert('No se pudo cargar el archivo de audio.');
                return;
            }

            if (state.blobUrlActual) {
                URL.revokeObjectURL(state.blobUrlActual);
            }

            state.blobUrlActual = URL.createObjectURL(itemCompleto.blob);
            state.audio.src = state.blobUrlActual;
            state.audio.volume = state.volumen;
            state.cancionActual = meta;

            var playPromise = state.audio.play();
            if (playPromise !== undefined) {
                playPromise.then(function() {
                    state.reproduciendo = true;
                    actualizarUIPlayerCompleto();
                    actualizarMiniPlayer();
                    renderizarContenidoSegunSubtab();
                    actualizarMediaSession();
                }).catch(function(err) {
                    console.warn('[Reproductor] Autoplay prevenido o error:', err);
                    state.reproduciendo = false;
                    actualizarUIPlayerCompleto();
                    actualizarMiniPlayer();
                    actualizarMediaSession();
                });
            }
        });
    }

    function obtenerListaReproducibleActual() {
        if (state.playlistSeleccionada) {
            var pl = state.playlists.find(function(p) { return p.id === state.playlistSeleccionada; });
            if (pl && pl.cancionIds) {
                return state.canciones.filter(function(c) { return pl.cancionIds.indexOf(c.id) !== -1; });
            }
        }
        if (state.carpetaSeleccionada) {
            return state.canciones.filter(function(c) { return c.carpeta === state.carpetaSeleccionada; });
        }
        return state.canciones;
    }

    function reproducirActual() {
        var lista = obtenerListaReproducibleActual();
        if (!state.cancionActual) {
            if (lista.length > 0) {
                reproducirIndice(0);
            }
            return;
        }

        if (state.audio.paused) {
            state.audio.play().then(function() {
                state.reproduciendo = true;
                actualizarUIPlayerCompleto();
                actualizarMiniPlayer();
                renderizarContenidoSegunSubtab();
                actualizarMediaSession();
            }).catch(function(e) {
                console.error('[Reproductor] Error al reproducir:', e);
            });
        }
    }

    function pausarActual() {
        if (!state.cancionActual) return;
        if (!state.audio.paused) {
            state.audio.pause();
        }
        state.reproduciendo = false;
        actualizarUIPlayerCompleto();
        actualizarMiniPlayer();
        renderizarContenidoSegunSubtab();
        actualizarMediaSession();
    }

    function togglePlayPausa() {
        if (!state.cancionActual || state.audio.paused) {
            reproducirActual();
        } else {
            pausarActual();
        }
    }

    function detenerReproductor() {
        state.audio.pause();
        state.audio.currentTime = 0;
        state.reproduciendo = false;
        if (state.blobUrlActual) {
            URL.revokeObjectURL(state.blobUrlActual);
            state.blobUrlActual = null;
        }
        state.cancionActual = null;
        state.indiceActual = -1;
        actualizarUIPlayerCompleto();
        actualizarMiniPlayer();
        renderizarContenidoSegunSubtab();
        actualizarMediaSession();
    }

    function siguienteCancion(esManual) {
        var lista = obtenerListaReproducibleActual();
        if (lista.length === 0) return;

        if (!esManual && state.repeat === 'one') {
            state.audio.currentTime = 0;
            state.audio.play().then(function() {
                actualizarPositionStateMediaSession();
            }).catch(function() {});
            return;
        }

        var siguienteIdx;
        if (state.shuffle && lista.length > 1) {
            do {
                siguienteIdx = Math.floor(Math.random() * lista.length);
            } while (siguienteIdx === state.indiceActual);
        } else {
            siguienteIdx = state.indiceActual + 1;
            if (siguienteIdx >= lista.length) {
                if (state.repeat === 'off' && !esManual) {
                    detenerReproductor();
                    return;
                }
                siguienteIdx = 0;
            }
        }

        reproducirIndice(siguienteIdx);
    }

    function anteriorCancion() {
        var lista = obtenerListaReproducibleActual();
        if (lista.length === 0) return;

        if (state.audio.currentTime > 3) {
            state.audio.currentTime = 0;
            return;
        }

        var anteriorIdx = state.indiceActual - 1;
        if (anteriorIdx < 0) {
            anteriorIdx = lista.length - 1;
        }
        reproducirIndice(anteriorIdx);
    }

    function cambiarSeek(porcentaje) {
        if (!state.audio.duration || isNaN(state.audio.duration)) return;
        state.audio.currentTime = (porcentaje / 100) * state.audio.duration;
    }

    function cambiarVolumen(val) {
        var num = parseFloat(val);
        if (isNaN(num)) num = 1;
        if (num < 0) num = 0;
        if (num > 1) num = 1;
        state.volumen = num;
        state.audio.volume = num;
        var elVolTxt = document.getElementById('player-vol-text');
        if (elVolTxt) elVolTxt.textContent = Math.round(num * 100) + '%';
    }

    function toggleShuffle() {
        state.shuffle = !state.shuffle;
        actualizarControlesModo();
    }

    function toggleRepeat() {
        if (state.repeat === 'all') {
            state.repeat = 'one';
        } else if (state.repeat === 'one') {
            state.repeat = 'off';
        } else {
            state.repeat = 'all';
        }
        actualizarControlesModo();
    }

    function actualizarControlesModo() {
        var btnShuf = document.getElementById('player-btn-shuffle');
        if (btnShuf) {
            if (state.shuffle) {
                btnShuf.classList.add('active');
                btnShuf.title = 'Aleatorio: ACTIVADO';
            } else {
                btnShuf.classList.remove('active');
                btnShuf.title = 'Aleatorio: DESACTIVADO';
            }
        }

        var btnRep = document.getElementById('player-btn-repeat');
        if (btnRep) {
            btnRep.classList.remove('repeat-all', 'repeat-one', 'repeat-off');
            if (state.repeat === 'all') {
                btnRep.classList.add('repeat-all');
                btnRep.innerHTML = '🔁 <span style="font-size: 10px;">Todas</span>';
                btnRep.title = 'Repetir: Toda la lista';
            } else if (state.repeat === 'one') {
                btnRep.classList.add('repeat-one');
                btnRep.innerHTML = '🔂 <span style="font-size: 10px;">1</span>';
                btnRep.title = 'Repetir: Canción actual';
            } else {
                btnRep.classList.add('repeat-off');
                btnRep.innerHTML = '➡️ <span style="font-size: 10px;">Off</span>';
                btnRep.title = 'Repetir: Desactivado';
            }
        }
    }

    // ----------------------------------------------------------------------
    // 5. MEDIA SESSION API & AUDIO LISTENERS (APK NATIVO + WEB/PWA FALLBACK)
    // ----------------------------------------------------------------------
    var cachedArtworkDataUrl = null;
    var artworkLoadPromise = null;
    var TINY_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    function esCapacitorNativo() {
        try {
            return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
        } catch(e) {
            return !!(window.Capacitor && window.Capacitor.isNative);
        }
    }

    function obtenerPluginMediaSession() {
        if (esCapacitorNativo() && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.MediaSession) {
            return window.Capacitor.Plugins.MediaSession;
        }
        return null;
    }

    function obtenerArtworkDataUrl() {
        if (cachedArtworkDataUrl) return Promise.resolve(cachedArtworkDataUrl);
        if (artworkLoadPromise) return artworkLoadPromise;

        artworkLoadPromise = fetch('icons/icon-192.png')
            .then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.blob();
            })
            .catch(function() {
                return fetch('icons/icon-512.png').then(function(res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.blob();
                });
            })
            .then(function(blob) {
                return new Promise(function(resolve, reject) {
                    var reader = new FileReader();
                    reader.onloadend = function() {
                        if (reader.result && typeof reader.result === 'string' && reader.result.indexOf('data:') === 0) {
                            cachedArtworkDataUrl = reader.result;
                            resolve(cachedArtworkDataUrl);
                        } else {
                            reject(new Error('Invalid DataURL'));
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            })
            .catch(function() {
                return TINY_PNG_DATA_URL;
            });

        return artworkLoadPromise;
    }

    function parsearTituloYArtista(nombreArchivo) {
        if (!nombreArchivo) return { titulo: 'Canción Offline', artista: 'Emily OS' };
        var limpio = String(nombreArchivo);
        var lastDot = limpio.lastIndexOf('.');
        if (lastDot > 0) limpio = limpio.substring(0, lastDot);

        // Limpiar coletillas típicas de YouTube o descargadores
        limpio = limpio.replace(/\s*(\(|\[)(oficial|official|video|versión|version|audio|remix|letra|lyrics|mp3|160k|320k|128k|hd|4k|hq).*?(\)|\])/gi, '').trim();

        // Separar "Artista - Título"
        var partes = limpio.split(/\s*[-–—]\s*/);
        if (partes.length >= 2) {
            var art = partes[0].replace(/_/g, ' ').trim();
            var tit = partes.slice(1).join(' - ').replace(/_/g, ' ').trim();
            return {
                titulo: tit || limpio.replace(/_/g, ' '),
                artista: art || 'Emily OS'
            };
        }

        return {
            titulo: limpio.replace(/_/g, ' '),
            artista: 'Emily OS'
        };
    }

    function obtenerUrlIcono(relPath) {
        var href = window.location.href.split('#')[0].split('?')[0];
        if (!href.endsWith('/')) {
            if (href.split('/').pop().indexOf('.') !== -1) {
                var lastSlash = href.lastIndexOf('/');
                href = href.substring(0, lastSlash + 1);
            } else {
                href = href + '/';
            }
        }
        return new URL(relPath, href).href;
    }

    function enviarMetadataNativa(nativeMS, metaInfo, albumName, dataUrl) {
        try {
            var p = nativeMS.setMetadata({
                title: metaInfo.titulo,
                artist: metaInfo.artista,
                album: albumName,
                artwork: [
                    { src: dataUrl || TINY_PNG_DATA_URL, sizes: '192x192', type: 'image/png' }
                ]
            });
            if (p && typeof p.catch === 'function') p.catch(function() {});
        } catch(e) {}
    }

    function actualizarMediaSession() {
        var nativeMS = obtenerPluginMediaSession();

        if (nativeMS) {
            if (state.cancionActual) {
                var cancionRef = state.cancionActual;
                var metaInfo = parsearTituloYArtista(cancionRef.nombre);
                var albumName = cancionRef.carpeta ? ('Carpeta: ' + cancionRef.carpeta) : 'Emily OS · Bóveda Offline';

                try {
                    var psProm = nativeMS.setPlaybackState({
                        playbackState: state.reproduciendo ? 'playing' : 'paused'
                    });
                    if (psProm && typeof psProm.catch === 'function') psProm.catch(function() {});
                } catch(e) {}

                if (cachedArtworkDataUrl) {
                    enviarMetadataNativa(nativeMS, metaInfo, albumName, cachedArtworkDataUrl);
                } else {
                    enviarMetadataNativa(nativeMS, metaInfo, albumName, TINY_PNG_DATA_URL);
                    obtenerArtworkDataUrl().then(function(dataUrl) {
                        if (state.cancionActual && state.cancionActual.id === cancionRef.id) {
                            enviarMetadataNativa(nativeMS, metaInfo, albumName, dataUrl);
                        }
                    }).catch(function() {});
                }

                actualizarPositionStateMediaSession();
            } else {
                try {
                    var stopProm = nativeMS.setPlaybackState({ playbackState: 'none' });
                    if (stopProm && typeof stopProm.catch === 'function') stopProm.catch(function() {});
                } catch(e) {}
            }
            return;
        }

        if (!('mediaSession' in navigator)) return;
        if (state.cancionActual) {
            var metaWeb = parsearTituloYArtista(state.cancionActual.nombre);
            var art192 = obtenerUrlIcono('icons/icon-192.png');
            var art512 = obtenerUrlIcono('icons/icon-512.png');

            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: metaWeb.titulo,
                    artist: metaWeb.artista,
                    album: state.cancionActual.carpeta ? ('Carpeta: ' + state.cancionActual.carpeta) : 'Emily OS · Bóveda Offline',
                    artwork: [
                        { src: art192, sizes: '192x192', type: 'image/png' },
                        { src: art512, sizes: '512x512', type: 'image/png' }
                    ]
                });
            } catch(e) {
                console.warn('[MediaSession Metadata]', e);
            }

            try {
                navigator.mediaSession.playbackState = state.reproduciendo ? 'playing' : 'paused';
            } catch(e) {}

            actualizarPositionStateMediaSession();
        } else {
            try {
                navigator.mediaSession.playbackState = 'none';
            } catch(e) {}
        }
    }

    function actualizarPositionStateMediaSession() {
        var dur = state.audio.duration;
        var pos = state.audio.currentTime;
        if (!dur || isNaN(dur) || !isFinite(dur) || dur <= 0) return;

        var payload = {
            duration: Math.max(dur, 0),
            playbackRate: state.audio.playbackRate || 1.0,
            position: Math.min(Math.max(pos || 0, 0), dur)
        };

        var nativeMS = obtenerPluginMediaSession();
        if (nativeMS) {
            try {
                var p = nativeMS.setPositionState(payload);
                if (p && typeof p.catch === 'function') p.catch(function() {});
            } catch(e) {}
            return;
        }

        if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
        try {
            navigator.mediaSession.setPositionState(payload);
        } catch(e) {}
    }

    function initMediaSession() {
        var handlers = [
            ['play', function() { reproducirActual(); }],
            ['pause', function() { pausarActual(); }],
            ['previoustrack', function() { anteriorCancion(); }],
            ['nexttrack', function() { siguienteCancion(true); }],
            ['stop', function() { detenerReproductor(); }],
            ['seekto', function(details) {
                if (details && details.seekTime !== undefined && details.seekTime !== null && state.audio.duration) {
                    state.audio.currentTime = Math.max(0, Math.min(details.seekTime, state.audio.duration));
                    actualizarPositionStateMediaSession();
                }
            }],
            ['seekbackward', function(details) {
                var skip = (details && details.seekOffset) || 10;
                state.audio.currentTime = Math.max((state.audio.currentTime || 0) - skip, 0);
                actualizarPositionStateMediaSession();
            }],
            ['seekforward', function(details) {
                var skip = (details && details.seekOffset) || 10;
                state.audio.currentTime = Math.min((state.audio.currentTime || 0) + skip, state.audio.duration || 0);
                actualizarPositionStateMediaSession();
            }]
        ];

        var nativeMS = obtenerPluginMediaSession();
        if (nativeMS) {
            handlers.forEach(function(pair) {
                try {
                    var p = nativeMS.setActionHandler({ action: pair[0] }, pair[1]);
                    if (p && typeof p.catch === 'function') p.catch(function() {});
                } catch(e) {}
            });
            return;
        }

        if (!('mediaSession' in navigator)) return;
        handlers.forEach(function(pair) {
            try {
                navigator.mediaSession.setActionHandler(pair[0], pair[1]);
            } catch(e) {}
        });
    }

    function initAudioListeners() {
        var lastMediaSessionUpdate = 0;

        state.audio.addEventListener('timeupdate', function() {
            var cur = state.audio.currentTime || 0;
            var dur = state.audio.duration || 0;
            var pct = dur > 0 ? (cur / dur) * 100 : 0;

            var slider = document.getElementById('player-seek-slider');
            if (slider && !slider.matches(':active')) {
                slider.value = pct;
            }
            var elCur = document.getElementById('player-time-current');
            if (elCur) elCur.textContent = formatearTiempo(cur);
            var elDur = document.getElementById('player-time-duration');
            if (elDur) elDur.textContent = formatearTiempo(dur);

            var miniBar = document.getElementById('mini-player-fill');
            if (miniBar) miniBar.style.width = pct + '%';

            var now = Date.now();
            var intervalMs = obtenerPluginMediaSession() ? 10000 : 4000;
            if (now - lastMediaSessionUpdate > intervalMs) {
                lastMediaSessionUpdate = now;
                actualizarPositionStateMediaSession();
            }
        });

        state.audio.addEventListener('loadedmetadata', function() {
            actualizarPositionStateMediaSession();
        });

        state.audio.addEventListener('durationchange', function() {
            actualizarPositionStateMediaSession();
        });

        state.audio.addEventListener('seeked', function() {
            actualizarPositionStateMediaSession();
        });

        state.audio.addEventListener('ended', function() {
            siguienteCancion(false);
        });

        state.audio.addEventListener('play', function() {
            state.reproduciendo = true;
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            actualizarMediaSession();
        });

        state.audio.addEventListener('pause', function() {
            state.reproduciendo = false;
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            actualizarMediaSession();
        });

        state.audio.addEventListener('error', function(err) {
            console.error('[Audio] Error al reproducir archivo:', err);
            state.reproduciendo = false;
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
        });
    }

    function formatearTiempo(segundos) {
        if (isNaN(segundos) || segundos < 0) return '00:00';
        var m = Math.floor(segundos / 60);
        var s = Math.floor(segundos % 60);
        return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
    }

    function formatearTamano(bytes) {
        if (!bytes || isNaN(bytes)) return '0 MB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ----------------------------------------------------------------------
    // 6. TRANSFERENCIAS SELECTIVAS A PC (VÍA FIREBASE STORAGE)
    // ----------------------------------------------------------------------
    function enviarCancionAPC(id) {
        var meta = state.canciones.find(function(c) { return c.id === id; });
        if (!meta) return;

        if (!window.MonarcaCloud || typeof window.MonarcaCloud.subirCancionTransferencia !== 'function') {
            alert('El servicio de nube aún se está inicializando o no está disponible.');
            return;
        }

        var btn = document.getElementById('btn-transfer-' + id);
        if (btn) btn.innerHTML = '⏳ Subiendo...';

        obtenerCancionCompleta(id).then(function(itemCompleto) {
            if (!itemCompleto || !itemCompleto.blob) {
                throw new Error("No se pudo leer el archivo local.");
            }
            return window.MonarcaCloud.subirCancionTransferencia(meta, itemCompleto.blob);
        }).then(function(res) {
            alert('✓ Canción "' + meta.nombre + '" enviada a la nube.\nÁbrela en tu PC para descargarla localmente.');
            if (btn) btn.innerHTML = '✓ Enviada';
        }).catch(function(err) {
            alert('Error al enviar canción a PC: ' + (err.message || err));
            if (btn) btn.innerHTML = '☁️ Enviar a PC';
        });
    }

    function descargarCancionTransferidaEnPC(transferId, urlDescarga, rutaStorage, nombre) {
        var btn = document.getElementById('btn-descargar-transfer-' + transferId);
        if (btn) btn.innerHTML = '⏳ Descargando...';

        fetch(urlDescarga)
            .then(function(res) {
                if (!res.ok) throw new Error("Error en la descarga: " + res.statusText);
                return res.blob();
            })
            .then(function(blob) {
                return guardarBlobDirecto(nombre, blob, 'Recibidas de Móvil');
            })
            .then(function() {
                // Eliminar de Firebase Storage para no gastar espacio
                if (window.MonarcaCloud && typeof window.MonarcaCloud.eliminarCancionTransferencia === 'function') {
                    window.MonarcaCloud.eliminarCancionTransferencia(transferId, rutaStorage);
                }
                alert('✓ Canción "' + nombre + '" descargada y guardada con éxito en tu PC.');
                renderizarContenidoSegunSubtab();
            })
            .catch(function(err) {
                alert('Error al descargar canción: ' + err.message);
                if (btn) btn.innerHTML = '📥 Descargar en esta PC';
            });
    }

    function alRecibirTransferenciasNube(transferencias) {
        state.transferenciasPendientes = transferencias || [];
        renderizarBannerTransferenciasPC();
    }

    function renderizarBannerTransferenciasPC() {
        var banner = document.getElementById('banner-transferencias-pc');
        if (!banner) return;

        if (!state.transferenciasPendientes || state.transferenciasPendientes.length === 0) {
            banner.style.display = 'none';
            return;
        }

        banner.style.display = 'block';
        var html = '<div style="font-size: 13px; font-weight: 800; color: #38bdf8; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">' +
            '<span>📥 Canciones enviadas a tu PC (' + state.transferenciasPendientes.length + ')</span>' +
        '</div>';

        state.transferenciasPendientes.forEach(function(t) {
            html += '<div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">' +
                '<div style="min-width: 0; flex: 1;">' +
                    '<div style="font-size: 13.5px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + escaparHTML(t.nombre) + '</div>' +
                    '<div style="font-size: 11px; color: #94a3b8;">' + formatearTamano(t.tamano) + ' · Desde ' + (t.origenDispositivo || 'Móvil') + '</div>' +
                '</div>' +
                '<div style="display: flex; gap: 6px;">' +
                    '<button type="button" id="btn-descargar-transfer-' + t.id + '" class="btn-cargar-mp3-action" style="padding: 6px 12px; font-size: 11.5px;" onclick="window.MonarcaPlayer.descargarCancionTransferidaEnPC(\'' + t.id + '\', \'' + t.urlDescarga + '\', \'' + t.rutaStorage + '\', \'' + escaparHTML(t.nombre) + '\')">' +
                        '📥 Descargar en esta PC' +
                    '</button>' +
                    '<button type="button" class="btn-song-delete" title="Descartar de la nube" onclick="window.MonarcaCloud.eliminarCancionTransferencia(\'' + t.id + '\', \'' + t.rutaStorage + '\')">✕</button>' +
                '</div>' +
            '</div>';
        });

        banner.innerHTML = html;
    }

    function descargarCancionArchivoLocal(id) {
        var meta = state.canciones.find(function(c) { return c.id === id; });
        if (!meta) return;

        obtenerCancionCompleta(id).then(function(itemCompleto) {
            if (!itemCompleto || !itemCompleto.blob) return;
            var url = URL.createObjectURL(itemCompleto.blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = (meta.nombre || 'cancion') + '.mp3';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
        });
    }

    // ----------------------------------------------------------------------
    // 7. RENDERIZADO DE INTERFAZ Y NAVEGACIÓN POR SUBPESTAÑAS
    // ----------------------------------------------------------------------
    function cambiarSubtab(tab) {
        state.subtabActual = tab || 'todas';
        if (tab === 'todas') {
            state.carpetaSeleccionada = null;
            state.playlistSeleccionada = null;
        }

        var tabs = document.querySelectorAll('.player-subtab-btn');
        tabs.forEach(function(b) {
            if (b.getAttribute('data-subtab') === tab) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        renderizarContenidoSegunSubtab();
    }

    function seleccionarCarpeta(nombreCarpeta) {
        state.carpetaSeleccionada = nombreCarpeta;
        state.subtabActual = 'todas';
        var tabs = document.querySelectorAll('.player-subtab-btn');
        tabs.forEach(function(b) {
            b.classList.toggle('active', b.getAttribute('data-subtab') === 'todas');
        });
        renderizarContenidoSegunSubtab();
    }

    function seleccionarPlaylist(plId) {
        state.playlistSeleccionada = plId;
        state.subtabActual = 'todas';
        var tabs = document.querySelectorAll('.player-subtab-btn');
        tabs.forEach(function(b) {
            b.classList.toggle('active', b.getAttribute('data-subtab') === 'todas');
        });
        renderizarContenidoSegunSubtab();
    }

    function renderizarContenidoSegunSubtab() {
        var cont = document.getElementById('reproductor-lista-canciones');
        if (!cont) return;

        var countBadge = document.getElementById('player-total-songs-badge');
        var sizeBadge = document.getElementById('player-total-size-badge');
        var totalBytes = 0;
        state.canciones.forEach(function(c) { totalBytes += (c.tamano || 0); });
        if (countBadge) countBadge.textContent = state.canciones.length + ' ' + (state.canciones.length === 1 ? 'canción' : 'canciones');
        if (sizeBadge) sizeBadge.textContent = formatearTamano(totalBytes);

        if (state.subtabActual === 'carpetas') {
            renderizarCarpetasView(cont);
        } else if (state.subtabActual === 'playlists') {
            renderizarPlaylistsView(cont);
        } else {
            renderizarTodasCancionesView(cont);
        }
    }

    function renderizarCarpetasView(cont) {
        var carpetasMap = {};
        state.canciones.forEach(function(c) {
            var f = c.carpeta || 'Principal';
            if (!carpetasMap[f]) carpetasMap[f] = { count: 0, tamano: 0, canciones: [] };
            carpetasMap[f].count++;
            carpetasMap[f].tamano += (c.tamano || 0);
            carpetasMap[f].canciones.push(c);
        });

        var nombres = Object.keys(carpetasMap);
        if (nombres.length === 0) {
            cont.innerHTML = '<div style="text-align: center; padding: 28px 16px; color: #94a3b8;">' +
                '<h4>No hay carpetas organizadas</h4>' +
                '<p style="font-size: 12px; color: #64748b;">Usa el botón "+ Cargar Carpeta" para leer tus directorios de música automáticamente.</p>' +
            '</div>';
            return;
        }

        var html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">';
        nombres.forEach(function(nom) {
            var obj = carpetasMap[nom];
            html += '<div class="player-folder-card" onclick="window.MonarcaPlayer.seleccionarCarpeta(\'' + escaparHTML(nom) + '\')">' +
                '<div style="display: flex; align-items: center; gap: 10px;">' +
                    '<span style="font-size: 26px;">📁</span>' +
                    '<div style="min-width: 0; flex: 1;">' +
                        '<div style="font-size: 14px; font-weight: 800; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escaparHTML(nom) + '</div>' +
                        '<div style="font-size: 11px; color: #94a3b8;">' + obj.count + ' canciones · ' + formatearTamano(obj.tamano) + '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="margin-top: 10px; display: flex; justify-content: flex-end;">' +
                    '<span style="font-size: 11px; color: #38bdf8; font-weight: 700;">Ver canciones →</span>' +
                '</div>' +
            '</div>';
        });
        html += '</div>';
        cont.innerHTML = html;
    }

    function renderizarPlaylistsView(cont) {
        var html = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
            '<span style="font-size: 13px; font-weight: 700; color: #f8fafc;">Tus Listas Personalizadas</span>' +
            '<button type="button" class="btn-system-secondary" style="font-size: 11.5px; padding: 5px 12px;" onclick="window.MonarcaPlayer.crearPlaylistPrompt()">+ Nueva Lista</button>' +
        '</div>';

        if (state.playlists.length === 0) {
            html += '<div style="text-align: center; padding: 28px 16px; color: #94a3b8;">' +
                '<h4>No tienes listas de reproducción creadas</h4>' +
                '<p style="font-size: 12px; color: #64748b;">Pulsa "+ Nueva Lista" para crear colecciones como "Gym", "Enfoque" o "Alarma Matutina".</p>' +
            '</div>';
            cont.innerHTML = html;
            return;
        }

        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">';
        state.playlists.forEach(function(pl) {
            var count = (pl.cancionIds || []).length;
            html += '<div class="player-folder-card" onclick="window.MonarcaPlayer.seleccionarPlaylist(\'' + pl.id + '\')">' +
                '<div style="display: flex; align-items: center; justify-content: space-between;">' +
                    '<div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">' +
                        '<span style="font-size: 24px;">📑</span>' +
                        '<div style="min-width: 0; flex: 1;">' +
                            '<div style="font-size: 14px; font-weight: 800; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escaparHTML(pl.nombre) + '</div>' +
                            '<div style="font-size: 11px; color: #94a3b8;">' + count + ' canciones</div>' +
                        '</div>' +
                    '</div>' +
                    '<button type="button" class="btn-song-delete" onclick="event.stopPropagation(); window.MonarcaPlayer.eliminarPlaylist(\'' + pl.id + '\')" title="Eliminar lista">✕</button>' +
                '</div>' +
                '<div style="margin-top: 10px; display: flex; justify-content: flex-end;">' +
                    '<span style="font-size: 11px; color: #38bdf8; font-weight: 700;">Reproducir Lista ▶</span>' +
                '</div>' +
            '</div>';
        });
        html += '</div>';
        cont.innerHTML = html;
    }

    function renderizarTodasCancionesView(cont) {
        var lista = obtenerListaReproducibleActual();
        var q = (state.busqueda || '').toLowerCase().trim();

        var listaFiltrada = lista.filter(function(c) {
            if (!q) return true;
            return (c.nombre || '').toLowerCase().indexOf(q) !== -1;
        });

        var encabezadoFiltro = '';
        if (state.carpetaSeleccionada) {
            encabezadoFiltro = '<div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 8px 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">' +
                '<span style="font-size: 12px; color: #38bdf8;">📁 Carpeta: <strong>' + escaparHTML(state.carpetaSeleccionada) + '</strong> (' + listaFiltrada.length + ')</span>' +
                '<button type="button" class="btn-song-delete" style="font-size: 11px; color: #94a3b8;" onclick="window.MonarcaPlayer.seleccionarCarpeta(null)">Mostrar todas</button>' +
            '</div>';
        } else if (state.playlistSeleccionada) {
            var plObj = state.playlists.find(function(p) { return p.id === state.playlistSeleccionada; });
            encabezadoFiltro = '<div style="background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 10px; padding: 8px 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">' +
                '<span style="font-size: 12px; color: #818cf8;">📑 Playlist: <strong>' + escaparHTML(plObj ? plObj.nombre : 'Lista') + '</strong> (' + listaFiltrada.length + ')</span>' +
                '<button type="button" class="btn-song-delete" style="font-size: 11px; color: #94a3b8;" onclick="window.MonarcaPlayer.seleccionarPlaylist(null)">Mostrar todas</button>' +
            '</div>';
        }

        if (state.canciones.length === 0) {
            cont.innerHTML = encabezadoFiltro + '<div style="text-align: center; padding: 32px 16px; color: #94a3b8;">' +
                '<div style="font-size: 38px; margin-bottom: 8px;">🎵</div>' +
                '<h4 style="color: #f8fafc; margin: 0 0 6px 0; font-size: 15px;">Tu biblioteca de música está vacía</h4>' +
                '<p style="font-size: 12.5px; margin: 0 0 16px 0; color: #64748b;">Puedes cargar canciones individuales o carpetas completas desde tu dispositivo.</p>' +
                '<div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">' +
                    '<button type="button" class="btn-cargar-mp3-action" onclick="document.getElementById(\'input-file-mp3-monarca\').click()">' +
                        '📁 Cargar Archivos MP3' +
                    '</button>' +
                    '<button type="button" class="btn-cargar-mp3-action" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);" onclick="document.getElementById(\'input-folder-mp3-monarca\').click()">' +
                        '📂 Cargar Carpeta Completa' +
                    '</button>' +
                '</div>' +
            '</div>';
            return;
        }

        if (listaFiltrada.length === 0) {
            cont.innerHTML = encabezadoFiltro + '<div style="text-align: center; padding: 24px 16px; color: #94a3b8; font-size: 13px;">' +
                'No se encontraron canciones que coincidan con la búsqueda.' +
            '</div>';
            return;
        }

        var html = encabezadoFiltro;
        listaFiltrada.forEach(function(c, listIndex) {
            var esActual = (state.cancionActual && state.cancionActual.id === c.id);
            var sonando = esActual && state.reproduciendo;

            html += '<div class="song-list-item ' + (esActual ? 'active-song' : '') + '" onclick="window.MonarcaPlayer.reproducirIndice(' + listIndex + ')">' +
                '<div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; overflow: hidden;">' +
                    '<div class="song-item-icon">' +
                        (sonando
                            ? '<span class="mini-equalizer-bars"><span></span><span></span><span></span></span>'
                            : (esActual ? '▶' : (listIndex + 1))) +
                    '</div>' +
                    '<div style="min-width: 0; flex: 1; overflow: hidden;">' +
                        '<div class="song-item-title ' + (esActual ? 'text-glow-cyan' : '') + '">' + escaparHTML(c.nombre) + '</div>' +
                        '<div class="song-item-meta" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' +
                            '<span style="color: #38bdf8;">📁 ' + escaparHTML(c.carpeta || 'Principal') + '</span>' +
                            '<span>•</span>' +
                            '<span>' + formatearTamano(c.tamano) + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="display: flex; align-items: center; gap: 5px; flex-shrink: 0;" onclick="event.stopPropagation();">' +
                    '<button type="button" id="btn-transfer-' + c.id + '" class="btn-song-option-pill" title="Enviar únicamente esta canción a la PC" onclick="window.MonarcaPlayer.enviarCancionAPC(\'' + c.id + '\')">' +
                        '☁️ PC' +
                    '</button>' +
                    '<button type="button" class="btn-song-option-pill" title="Añadir a lista de reproducción" onclick="window.MonarcaPlayer.abrirModalAgregarPlaylist(\'' + c.id + '\')">' +
                        '➕' +
                    '</button>' +
                    '<button type="button" class="btn-song-option-pill" title="Descargar archivo local" onclick="window.MonarcaPlayer.descargarCancionArchivoLocal(\'' + c.id + '\')">' +
                        '⬇️' +
                    '</button>' +
                    '<button type="button" class="btn-song-delete" title="Eliminar de la biblioteca" onclick="window.MonarcaPlayer.eliminarCancion(\'' + c.id + '\')">' +
                        '✕' +
                    '</button>' +
                '</div>' +
            '</div>';
        });

        cont.innerHTML = html;
    }

    function abrirModalAgregarPlaylist(songId) {
        if (state.playlists.length === 0) {
            var crear = confirm('Aún no tienes listas de reproducción creadas. ¿Deseas crear una ahora?');
            if (crear) {
                crearPlaylistPrompt();
            }
            return;
        }

        var opciones = state.playlists.map(function(pl, i) {
            return (i + 1) + '. ' + pl.nombre;
        }).join('\n');

        var numStr = prompt('Selecciona el número de la Lista de Reproducción:\n\n' + opciones);
        var num = parseInt(numStr, 10);
        if (!isNaN(num) && num >= 1 && num <= state.playlists.length) {
            var pl = state.playlists[num - 1];
            agregarCancionAPlaylist(pl.id, songId);
        }
    }

    // ----------------------------------------------------------------------
    // 8. RENDERIZADO DEL PLAYER HERO & MINI-REPRODUCTOR FLOTANTE
    // ----------------------------------------------------------------------
    function actualizarUIPlayerCompleto() {
        var elTitulo = document.getElementById('player-current-title');
        var elSub = document.getElementById('player-current-subtitle');
        var elDisc = document.getElementById('player-vinyl-disc');
        var btnPlay = document.getElementById('player-btn-play-main');
        var waveContainer = document.getElementById('player-sound-waves');

        var tieneCancion = !!state.cancionActual;

        if (elTitulo) {
            elTitulo.textContent = tieneCancion ? state.cancionActual.nombre : 'Ninguna canción seleccionada';
        }
        if (elSub) {
            if (tieneCancion) {
                elSub.textContent = (state.cancionActual.carpeta ? ('📁 ' + state.cancionActual.carpeta + ' · ') : '') + formatearTamano(state.cancionActual.tamano);
            } else {
                elSub.textContent = state.canciones.length > 0 ? (state.canciones.length + ' canciones listas en la biblioteca') : 'Sube tus archivos MP3 para comenzar';
            }
        }

        if (elDisc) {
            elDisc.classList.toggle('spinning', state.reproduciendo);
        }
        if (waveContainer) {
            waveContainer.classList.toggle('playing', state.reproduciendo);
        }

        if (btnPlay) {
            if (state.reproduciendo) {
                btnPlay.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
                btnPlay.title = 'Pausar';
            } else {
                btnPlay.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                btnPlay.title = 'Reproducir';
            }
        }
    }

    function actualizarMiniPlayer() {
        var elMini = document.getElementById('monarca-mini-player');
        if (!elMini) return;

        if (!state.cancionActual || window.VISTA_ACTUAL === 'vista-reproductor') {
            elMini.style.display = 'none';
            return;
        }

        elMini.style.display = 'flex';

        var elTit = document.getElementById('mini-player-title');
        if (elTit) {
            elTit.textContent = state.cancionActual.nombre || 'Reproduciendo...';
        }

        var btnPlay = document.getElementById('mini-player-btn-play');
        if (btnPlay) {
            if (state.reproduciendo) {
                btnPlay.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
                btnPlay.title = 'Pausar';
            } else {
                btnPlay.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                btnPlay.title = 'Reproducir';
            }
        }

        var iconDisc = document.getElementById('mini-player-disc-icon');
        if (iconDisc) {
            iconDisc.classList.toggle('spinning', state.reproduciendo);
        }
    }

    function cerrarMiniPlayer() {
        var elMini = document.getElementById('monarca-mini-player');
        if (elMini) elMini.style.display = 'none';
    }

    function expandirReproductorCompleto() {
        if (typeof window.cambiarVista === 'function') {
            window.cambiarVista('vista-reproductor');
        }
    }

    function filtrarCanciones(val) {
        state.busqueda = val || '';
        renderizarContenidoSegunSubtab();
    }

    function escaparHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ----------------------------------------------------------------------
    // 9. API PÚBLICA PARA EL MOTOR DE ALARMAS
    // ----------------------------------------------------------------------
    function obtenerAudioBlob(songId) {
        return obtenerCancionCompleta(songId).then(function(item) {
            return (item && item.blob) ? item.blob : null;
        });
    }

    function getCancionesMeta() {
        return state.canciones || [];
    }

    // ----------------------------------------------------------------------
    // 10. INICIALIZADOR GLOBAL
    // ----------------------------------------------------------------------
    function init() {
        var elAudio = document.getElementById('monarca-player-audio');
        if (elAudio) {
            state.audio = elAudio;
        }

        initAudioListeners();
        initMediaSession();
        if (obtenerPluginMediaSession()) {
            obtenerArtworkDataUrl();
        }

        cargarMetadatosCanciones().then(function() {
            renderizarContenidoSegunSubtab();
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            actualizarControlesModo();
        }).catch(function(e) {
            console.error('[Reproductor] Error cargando canciones iniciales:', e);
        });

        // Enganchar input de archivos individuales
        var fileIn = document.getElementById('input-file-mp3-monarca');
        if (fileIn) {
            fileIn.addEventListener('change', function(e) {
                var files = e.target.files;
                if (files && files.length > 0) {
                    var loader = document.getElementById('reproductor-cargando-aviso');
                    if (loader) loader.style.display = 'block';

                    guardarCancionesFiles(files).then(function() {
                        renderizarContenidoSegunSubtab();
                        actualizarUIPlayerCompleto();
                        fileIn.value = '';
                        if (loader) loader.style.display = 'none';
                        if (!state.cancionActual && state.canciones.length > 0) {
                            reproducirIndice(0);
                        }
                    }).catch(function(err) {
                        alert('Error guardando archivos: ' + (err.message || err));
                        if (loader) loader.style.display = 'none';
                    });
                }
            });
        }

        // Enganchar input de carpetas completas
        var folderIn = document.getElementById('input-folder-mp3-monarca');
        if (folderIn) {
            folderIn.addEventListener('change', function(e) {
                var files = e.target.files;
                if (files && files.length > 0) {
                    var loader = document.getElementById('reproductor-cargando-aviso');
                    if (loader) loader.style.display = 'block';

                    guardarCancionesFiles(files).then(function() {
                        renderizarContenidoSegunSubtab();
                        actualizarUIPlayerCompleto();
                        folderIn.value = '';
                        if (loader) loader.style.display = 'none';
                        alert('✓ Se cargaron ' + files.length + ' pistas organizadas por carpetas.');
                    }).catch(function(err) {
                        alert('Error cargando carpeta: ' + (err.message || err));
                        if (loader) loader.style.display = 'none';
                    });
                }
            });
        }

        // Conectar escucha de transferencias de nube si MonarcaCloud está listo
        if (window.MonarcaCloud && typeof window.MonarcaCloud.escucharTransferencias === 'function') {
            window.MonarcaCloud.escucharTransferencias(alRecibirTransferenciasNube);
        }

        // Hook en cambiarVista para sincronizar visibilidad del mini-reproductor
        var origCambiarVista = window.cambiarVista;
        if (typeof origCambiarVista === 'function') {
            window.cambiarVista = function(vistaId, noPushState) {
                origCambiarVista(vistaId, noPushState);
                actualizarMiniPlayer();
            };
        }
    }

    // Exponer API global
    window.MonarcaPlayer = {
        init: init,
        reproducirIndice: reproducirIndice,
        togglePlayPausa: togglePlayPausa,
        siguienteCancion: function() { siguienteCancion(true); },
        anteriorCancion: anteriorCancion,
        cambiarSeek: cambiarSeek,
        cambiarVolumen: cambiarVolumen,
        toggleShuffle: toggleShuffle,
        toggleRepeat: toggleRepeat,
        eliminarCancion: eliminarCancion,
        vaciarBiblioteca: vaciarBiblioteca,
        filtrarCanciones: filtrarCanciones,
        cerrarMiniPlayer: cerrarMiniPlayer,
        expandirReproductorCompleto: expandirReproductorCompleto,
        actualizarMiniPlayer: actualizarMiniPlayer,
        cambiarSubtab: cambiarSubtab,
        seleccionarCarpeta: seleccionarCarpeta,
        seleccionarPlaylist: seleccionarPlaylist,
        crearPlaylistPrompt: crearPlaylistPrompt,
        eliminarPlaylist: eliminarPlaylist,
        abrirModalAgregarPlaylist: abrirModalAgregarPlaylist,
        enviarCancionAPC: enviarCancionAPC,
        descargarCancionTransferidaEnPC: descargarCancionTransferidaEnPC,
        descargarCancionArchivoLocal: descargarCancionArchivoLocal,
        alRecibirTransferenciasNube: alRecibirTransferenciasNube,
        obtenerAudioBlob: obtenerAudioBlob,
        getCanciones: getCancionesMeta,
        getState: function() { return state; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

})(window);
