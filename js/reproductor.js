// ==========================================================================
// SISTEMA MONARCA - MOTOR DE REPRODUCTOR DE MÚSICA MP3 OFFLINE (v10.50)
// Almacenamiento binario en IndexedDB, Carpetas, Playlists y Transferencia PC
// ==========================================================================

(function(window) {
    'use strict';

    var DB_NAME = 'MonarcaMusicaDB';
    var DB_VERSION = 1;
    var STORE_NAME = 'canciones';

    var DEFAULT_RUTINA_PL_KEY = 'monarca_musica_rutina_playlist_default';

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
        miniPlayerVisible: true,
        // Modo música continua para rutinas
        rutinaDefaultPlaylistId: null,
        rutinaModoActivo: false,
        rutinaPlaylistActivaId: null,
        rutinaNombreActiva: '',
        rutinaColaAleatoria: [],
        rutinaPrevConfig: null,
        rutinaConsecErrors: 0,
        _dbReady: false,
        _dbReadyPromise: null,
        _playSeqId: 0,
        _pendingSongForNewPlaylist: null,
        _modalAgregarModo: 'song',
        _modalAgregarSongId: null,
        _modalAgregarPlaylistId: null,
        _modalAgregarFiltro: '',
        _modalAgregarSeleccionIds: []
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
        var prom = abrirDB().then(function(db) {
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
                        state._dbReady = true;
                        cargarPlaylistsStorage();
                        notificarCambioPlaylistsYDefault();
                        resolve(lista);
                    }
                };
                req.onerror = function(e) {
                    reject(e.target.error);
                };
            });
        });
        state._dbReadyPromise = prom;
        return prom;
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

        detenerMusicaDeRutina(true);
        abrirDB().then(function(db) {
            var tx = db.transaction([STORE_NAME], 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = function() {
                state.canciones = [];
                state.playlists = [];
                guardarPlaylistsStorage();
                setPlaylistDefaultRutina(null, true);
                state.indiceActual = -1;
                state.cancionActual = null;
                notificarCambioPlaylistsYDefault();
                renderizarContenidoSegunSubtab();
                actualizarUIPlayerCompleto();
                actualizarMiniPlayer();
                actualizarBarraAudioRutina();
            };
        });
    }

    // ----------------------------------------------------------------------
    // 3. PLAYLISTS (LISTAS DE REPRODUCCIÓN) Y PLAYLIST POR DEFECTO EN RUTINAS
    // ----------------------------------------------------------------------
    function notificarCambioPlaylistsYDefault() {
        try {
            if (typeof window.actualizarSelectoresPlaylistRutinas === 'function') {
                window.actualizarSelectoresPlaylistRutinas();
            }
        } catch(e) {}
    }

    function cargarDefaultPlaylistRutinaStorage() {
        var val = null;
        try {
            var raw = localStorage.getItem(DEFAULT_RUTINA_PL_KEY);
            if (raw && raw.trim() && raw !== '__none__') {
                val = raw.trim();
            } else if (raw === '') {
                val = null;
            }
        } catch(e) {}

        if (!val && typeof window.APP_STATE !== 'undefined' && window.APP_STATE && window.APP_STATE.rutinaPlaylistDefaultId) {
            val = window.APP_STATE.rutinaPlaylistDefaultId;
        }

        if (val && state.playlists && state.playlists.length > 0) {
            var existe = state.playlists.some(function(p) { return p && p.id === val; });
            if (!existe) val = null;
        } else if (val && state.playlists && state.playlists.length === 0 && state._dbReady) {
            val = null;
        }

        state.rutinaDefaultPlaylistId = val || null;
        return state.rutinaDefaultPlaylistId;
    }

    function cargarPlaylistsStorage() {
        try {
            var raw = localStorage.getItem('monarca_musica_playlists');
            state.playlists = raw ? JSON.parse(raw) : [];
        } catch(e) {
            state.playlists = [];
        }
        cargarDefaultPlaylistRutinaStorage();
    }

    function guardarPlaylistsStorage() {
        try {
            localStorage.setItem('monarca_musica_playlists', JSON.stringify(state.playlists));
        } catch(e) {}
        notificarCambioPlaylistsYDefault();
    }

    function getPlaylistDefaultRutinaId() {
        if (state.playlists.length === 0) {
            cargarPlaylistsStorage();
        } else if (state.rutinaDefaultPlaylistId === null) {
            cargarDefaultPlaylistRutinaStorage();
        }
        if (state.rutinaDefaultPlaylistId) {
            var existe = state.playlists.some(function(p) { return p && p.id === state.rutinaDefaultPlaylistId; });
            if (!existe) {
                state.rutinaDefaultPlaylistId = null;
            }
        }
        return state.rutinaDefaultPlaylistId || null;
    }

    function setPlaylistDefaultRutina(plId, omitirGuardadoNube) {
        var cleanId = (plId && plId !== '__none__') ? String(plId).trim() : null;
        if (cleanId && state.playlists && state.playlists.length > 0) {
            var existe = state.playlists.some(function(p) { return p && p.id === cleanId; });
            if (!existe) cleanId = null;
        }

        state.rutinaDefaultPlaylistId = cleanId;
        try {
            if (cleanId) {
                localStorage.setItem(DEFAULT_RUTINA_PL_KEY, cleanId);
            } else {
                localStorage.setItem(DEFAULT_RUTINA_PL_KEY, '');
            }
        } catch(e) {}

        try {
            if (typeof window.APP_STATE !== 'undefined' && window.APP_STATE) {
                window.APP_STATE.rutinaPlaylistDefaultId = cleanId;
                if (!omitirGuardadoNube && typeof window.MonarcaDB !== 'undefined' && typeof window.MonarcaDB.save === 'function') {
                    window.MonarcaDB.save(window.APP_STATE);
                }
            }
        } catch(e) {}

        renderizarContenidoSegunSubtab();
        notificarCambioPlaylistsYDefault();
        actualizarBarraAudioRutina();
        return cleanId;
    }

    function togglePlaylistDefaultRutina(plId) {
        var actual = getPlaylistDefaultRutinaId();
        if (actual === plId) {
            setPlaylistDefaultRutina(null);
        } else {
            setPlaylistDefaultRutina(plId);
        }
    }

    function notificarPlayerToast(msg, icono) {
        if (typeof window.mostrarToastMonarca === 'function') {
            window.mostrarToastMonarca(msg, icono || '🎵');
        }
    }

    function crearPlaylistPrompt(pendingSongId) {
        abrirModalCrearPlaylist(pendingSongId);
    }

    function abrirModalCrearPlaylist(pendingSongId) {
        state._pendingSongForNewPlaylist = pendingSongId || null;
        var modal = document.getElementById('modal-reproductor-crear-playlist');
        var input = document.getElementById('input-nombre-nueva-playlist');
        var errBox = document.getElementById('playlist-crear-error');
        if (errBox) {
            errBox.textContent = '';
            errBox.style.display = 'none';
        }
        if (input) input.value = '';
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(function() {
                if (input) input.focus();
            }, 60);
        }
    }

    function cerrarModalCrearPlaylist() {
        var modal = document.getElementById('modal-reproductor-crear-playlist');
        if (modal) modal.style.display = 'none';
        state._pendingSongForNewPlaylist = null;
    }

    function usarSugerenciaPlaylist(nombre) {
        var input = document.getElementById('input-nombre-nueva-playlist');
        var errBox = document.getElementById('playlist-crear-error');
        if (errBox) errBox.style.display = 'none';
        if (input) {
            input.value = nombre || '';
            input.focus();
        }
    }

    function confirmarCrearPlaylistModal() {
        var input = document.getElementById('input-nombre-nueva-playlist');
        var errBox = document.getElementById('playlist-crear-error');
        var nombre = input ? input.value.trim() : '';
        if (!nombre) {
            if (errBox) {
                errBox.textContent = 'Escribe un nombre para la lista de reproducción.';
                errBox.style.display = 'block';
            }
            if (input) input.focus();
            return;
        }

        var duplicada = state.playlists.some(function(p) {
            return (p.nombre || '').trim().toLowerCase() === nombre.toLowerCase();
        });
        if (duplicada) {
            if (errBox) {
                errBox.textContent = 'Ya existe una lista llamada "' + nombre + '". Elige otro nombre.';
                errBox.style.display = 'block';
            }
            if (input) input.focus();
            return;
        }

        var pendingSong = state._pendingSongForNewPlaylist;
        var nueva = {
            id: 'pl_' + Date.now(),
            nombre: nombre,
            fecha: Date.now(),
            cancionIds: pendingSong ? [pendingSong] : []
        };
        state.playlists.push(nueva);
        guardarPlaylistsStorage();
        notificarCambioPlaylistsYDefault();
        cerrarModalCrearPlaylist();
        renderizarContenidoSegunSubtab();
        notificarPlayerToast('Lista "' + nombre + '" creada' + (pendingSong ? ' y canción agregada' : ''), '🎶');

        if (pendingSong) {
            var modalAgr = document.getElementById('modal-reproductor-agregar-playlist');
            if (modalAgr && modalAgr.style.display === 'flex') {
                abrirModalAgregarPlaylist(pendingSong);
            }
        }
    }

    function agregarCancionAPlaylist(plId, songId, silencioso) {
        var pl = state.playlists.find(function(p) { return p.id === plId; });
        if (!pl) return false;
        if (!pl.cancionIds) pl.cancionIds = [];
        if (pl.cancionIds.indexOf(songId) === -1) {
            pl.cancionIds.push(songId);
            guardarPlaylistsStorage();
            renderizarContenidoSegunSubtab();
            if (!silencioso) notificarPlayerToast('Canción agregada a "' + pl.nombre + '"', '✓');
            return true;
        } else {
            if (!silencioso) notificarPlayerToast('Ya estaba en "' + pl.nombre + '"', 'ℹ️');
            return false;
        }
    }

    function quitarCancionDePlaylist(plId, songId, silencioso) {
        var pl = state.playlists.find(function(p) { return p.id === plId; });
        if (!pl || !Array.isArray(pl.cancionIds)) return false;
        var prevLen = pl.cancionIds.length;
        pl.cancionIds = pl.cancionIds.filter(function(id) { return id !== songId; });
        if (pl.cancionIds.length !== prevLen) {
            guardarPlaylistsStorage();
            renderizarContenidoSegunSubtab();
            if (!silencioso) notificarPlayerToast('Quitada de "' + pl.nombre + '"', '➖');
            return true;
        }
        return false;
    }

    function reproducirPlaylistDirecto(plId) {
        var pl = state.playlists.find(function(p) { return p.id === plId; });
        if (!pl) return;
        if (!pl.cancionIds || pl.cancionIds.length === 0) {
            notificarPlayerToast('La lista "' + pl.nombre + '" está vacía. Añade canciones primero.', '🎶');
            abrirModalAgregarCancionesAPlaylist(plId);
            return;
        }
        seleccionarPlaylist(plId);
        var lista = obtenerListaReproducibleActual();
        if (lista.length > 0) {
            reproducirIndice(0);
        } else {
            notificarPlayerToast('Agrega archivos MP3 para reproducir esta lista', '🎵');
        }
    }

    function eliminarPlaylist(plId) {
        if (!confirm('¿Eliminar esta lista de reproducción? Las canciones se mantendrán en tu biblioteca.')) return;
        state.playlists = state.playlists.filter(function(p) { return p.id !== plId; });
        if (state.rutinaDefaultPlaylistId === plId) {
            setPlaylistDefaultRutina(null, false);
        }
        if (state.rutinaModoActivo && state.rutinaPlaylistActivaId === plId) {
            detenerMusicaDeRutina();
        }
        guardarPlaylistsStorage();
        notificarCambioPlaylistsYDefault();
        if (state.playlistSeleccionada === plId) state.playlistSeleccionada = null;
        renderizarContenidoSegunSubtab();
        notificarPlayerToast('Lista eliminada (canciones conservadas)', '🗑️');
    }

    // ----------------------------------------------------------------------
    // 4. MOTOR DE AUDIO Y CONTROL DE REPRODUCCIÓN (INCLUYE MODO RUTINA CONTINUO)
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

    function obtenerCancionesDePlaylist(plId) {
        if (!plId) return [];
        var pl = state.playlists.find(function(p) { return p && p.id === plId; });
        if (!pl || !Array.isArray(pl.cancionIds) || pl.cancionIds.length === 0) return [];
        var mapaCanciones = {};
        state.canciones.forEach(function(c) { mapaCanciones[c.id] = c; });
        var resultado = [];
        pl.cancionIds.forEach(function(cid) {
            if (mapaCanciones[cid]) resultado.push(mapaCanciones[cid]);
        });
        return resultado;
    }

    function construirColaAleatoriaRutina(tracks, evitarId) {
        var ids = tracks.map(function(t) { return t.id; });
        for (var i = ids.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = ids[i];
            ids[i] = ids[j];
            ids[j] = tmp;
        }
        if (ids.length > 1 && evitarId && ids[0] === evitarId) {
            var swapIdx = 1 + Math.floor(Math.random() * (ids.length - 1));
            var tSwap = ids[0];
            ids[0] = ids[swapIdx];
            ids[swapIdx] = tSwap;
        }
        return ids;
    }

    function siguienteIdEnColaRutina(tracks, evitarId) {
        if (!tracks || tracks.length === 0) return null;
        var idsValidos = {};
        tracks.forEach(function(t) { idsValidos[t.id] = true; });
        state.rutinaColaAleatoria = (state.rutinaColaAleatoria || []).filter(function(id) {
            return !!idsValidos[id];
        });
        if (state.rutinaColaAleatoria.length === 0) {
            state.rutinaColaAleatoria = construirColaAleatoriaRutina(tracks, evitarId);
        }
        return state.rutinaColaAleatoria.shift();
    }

    function obtenerListaParaReproduccionActiva() {
        if (state.rutinaModoActivo && state.rutinaPlaylistActivaId) {
            return obtenerCancionesDePlaylist(state.rutinaPlaylistActivaId);
        }
        return obtenerListaReproducibleActual();
    }

    function reproducirMetaCancion(meta, idxEnLista, opciones) {
        if (!meta) return Promise.resolve(false);
        solicitarPermisoNotifReproductorSiFalta();
        var playSeq = ++state._playSeqId;
        state.indiceActual = (typeof idxEnLista === 'number') ? idxEnLista : -1;

        return obtenerCancionCompleta(meta.id).then(function(itemCompleto) {
            if (playSeq !== state._playSeqId) return false;
            if (!itemCompleto || !itemCompleto.blob) {
                if (opciones && opciones.silencioso && state.rutinaModoActivo) {
                    var tracksFallback = obtenerCancionesDePlaylist(state.rutinaPlaylistActivaId);
                    state.rutinaConsecErrors++;
                    if (tracksFallback.length > 1 && state.rutinaConsecErrors < tracksFallback.length) {
                        siguienteCancion(false);
                    }
                    return false;
                }
                alert('No se pudo cargar el archivo de audio.');
                return false;
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
                return playPromise.then(function() {
                    if (playSeq !== state._playSeqId) return false;
                    state.reproduciendo = true;
                    state.rutinaConsecErrors = 0;
                    actualizarUIPlayerCompleto();
                    actualizarMiniPlayer();
                    actualizarBarraAudioRutina();
                    renderizarContenidoSegunSubtab();
                    actualizarMediaSession();
                    return true;
                }).catch(function(err) {
                    if (playSeq !== state._playSeqId) return false;
                    console.warn('[Reproductor] Autoplay prevenido o error:', err);
                    state.reproduciendo = false;
                    actualizarUIPlayerCompleto();
                    actualizarMiniPlayer();
                    actualizarBarraAudioRutina();
                    actualizarMediaSession();
                    if (err && err.name !== 'NotAllowedError' && state.rutinaModoActivo) {
                        var tracksErr = obtenerCancionesDePlaylist(state.rutinaPlaylistActivaId);
                        state.rutinaConsecErrors++;
                        if (tracksErr.length > 1 && state.rutinaConsecErrors < tracksErr.length) {
                            siguienteCancion(false);
                        }
                    }
                    return false;
                });
            }
            return true;
        });
    }

    function salirModoRutinaSilencioso(restaurarPreferencias) {
        if (!state.rutinaModoActivo && !state.rutinaPrevConfig) return;
        state.rutinaModoActivo = false;
        state.rutinaPlaylistActivaId = null;
        state.rutinaNombreActiva = '';
        state.rutinaColaAleatoria = [];
        state.rutinaConsecErrors = 0;
        if (restaurarPreferencias && state.rutinaPrevConfig) {
            state.shuffle = !!state.rutinaPrevConfig.shuffle;
            state.repeat = state.rutinaPrevConfig.repeat || 'all';
        }
        state.rutinaPrevConfig = null;
        actualizarControlesModo();
        actualizarBarraAudioRutina();
    }

    function reproducirIndice(idx) {
        salirModoRutinaSilencioso(false);
        var listaActual = obtenerListaReproducibleActual();
        if (idx < 0 || idx >= listaActual.length) return;
        reproducirMetaCancion(listaActual[idx], idx);
    }

    function obtenerListaReproducibleActual() {
        if (state.playlistSeleccionada) {
            return obtenerCancionesDePlaylist(state.playlistSeleccionada);
        }
        if (state.carpetaSeleccionada) {
            return state.canciones.filter(function(c) { return c.carpeta === state.carpetaSeleccionada; });
        }
        return state.canciones;
    }

    function iniciarMusicaDeRutina(playlistIdOverride, nombreRutina) {
        var reqSeq = ++state._playSeqId;

        function ejecutarInicio() {
            if (reqSeq !== state._playSeqId) return Promise.resolve(false);
            var targetId = playlistIdOverride || getPlaylistDefaultRutinaId();
            if (!targetId || targetId === '__none__') {
                actualizarBarraAudioRutina();
                return Promise.resolve(false);
            }

            var pl = state.playlists.find(function(p) { return p && p.id === targetId; });
            if (!pl) {
                actualizarBarraAudioRutina();
                return Promise.resolve(false);
            }

            var tracks = obtenerCancionesDePlaylist(targetId);
            if (tracks.length === 0) {
                state.rutinaModoActivo = true;
                state.rutinaPlaylistActivaId = targetId;
                state.rutinaNombreActiva = nombreRutina || '';
                actualizarBarraAudioRutina();
                return Promise.resolve(false);
            }

            if (!state.rutinaPrevConfig) {
                state.rutinaPrevConfig = {
                    shuffle: state.shuffle,
                    repeat: state.repeat
                };
            }

            state.rutinaModoActivo = true;
            state.rutinaPlaylistActivaId = targetId;
            state.rutinaNombreActiva = nombreRutina || '';
            state.rutinaConsecErrors = 0;
            state.shuffle = true;
            state.repeat = 'all';
            actualizarControlesModo();

            var evitarId = (state.cancionActual && tracks.length > 1) ? state.cancionActual.id : null;
            state.rutinaColaAleatoria = construirColaAleatoriaRutina(tracks, evitarId);
            var primerId = state.rutinaColaAleatoria.shift();
            var idx = tracks.findIndex(function(c) { return c.id === primerId; });
            if (idx === -1) idx = 0;

            return reproducirMetaCancion(tracks[idx], idx, { silencioso: true });
        }

        if (state._dbReady) {
            return ejecutarInicio();
        }

        var asegurarDB = state._dbReadyPromise || cargarMetadatosCanciones();
        return asegurarDB.then(ejecutarInicio).catch(function(err) {
            console.warn('[Reproductor] Error iniciando música de rutina:', err);
            return false;
        });
    }

    function detenerMusicaDeRutina(omitirStopSiNoEsRutina) {
        state._playSeqId++;
        var estabaEnRutina = !!state.rutinaModoActivo;
        salirModoRutinaSilencioso(true);
        if (estabaEnRutina || !omitirStopSiNoEsRutina) {
            if (estabaEnRutina || (state.cancionActual && !omitirStopSiNoEsRutina)) {
                detenerReproductor();
            } else {
                actualizarBarraAudioRutina();
            }
        }
    }

    function reproducirActual() {
        if (state.rutinaModoActivo && !state.cancionActual && state.rutinaPlaylistActivaId) {
            iniciarMusicaDeRutina(state.rutinaPlaylistActivaId, state.rutinaNombreActiva);
            return;
        }
        var lista = obtenerListaParaReproduccionActiva();
        if (!state.cancionActual) {
            if (lista.length > 0) {
                if (state.rutinaModoActivo) {
                    siguienteCancion(true);
                } else {
                    reproducirIndice(0);
                }
            }
            return;
        }

        if (state.audio.paused) {
            state.audio.play().then(function() {
                state.reproduciendo = true;
                actualizarUIPlayerCompleto();
                actualizarMiniPlayer();
                actualizarBarraAudioRutina();
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
        actualizarBarraAudioRutina();
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
        state._playSeqId++;
        state.audio.pause();
        state.audio.removeAttribute('src');
        state.audio.load();
        state.reproduciendo = false;
        if (state.blobUrlActual) {
            URL.revokeObjectURL(state.blobUrlActual);
            state.blobUrlActual = null;
        }
        state.cancionActual = null;
        state.indiceActual = -1;
        actualizarUIPlayerCompleto();
        actualizarMiniPlayer();
        actualizarBarraAudioRutina();
        renderizarContenidoSegunSubtab();
        actualizarMediaSession();
    }

    function siguienteCancion(esManual) {
        if (state.rutinaModoActivo && state.rutinaPlaylistActivaId) {
            var tracksRut = obtenerCancionesDePlaylist(state.rutinaPlaylistActivaId);
            if (tracksRut.length === 0) {
                detenerMusicaDeRutina();
                return;
            }
            var evitar = state.cancionActual ? state.cancionActual.id : null;
            var nextId = siguienteIdEnColaRutina(tracksRut, evitar);
            var nextIdx = tracksRut.findIndex(function(c) { return c.id === nextId; });
            if (nextIdx === -1) nextIdx = 0;
            reproducirMetaCancion(tracksRut[nextIdx], nextIdx, { silencioso: true });
            return;
        }

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

        reproducirMetaCancion(lista[siguienteIdx], siguienteIdx);
    }

    function anteriorCancion() {
        var lista = obtenerListaParaReproduccionActiva();
        if (lista.length === 0) return;

        if (state.audio.currentTime > 3) {
            state.audio.currentTime = 0;
            return;
        }

        if (state.rutinaModoActivo && state.rutinaPlaylistActivaId) {
            siguienteCancion(true);
            return;
        }

        var anteriorIdx = state.indiceActual - 1;
        if (anteriorIdx < 0) {
            anteriorIdx = lista.length - 1;
        }
        reproducirMetaCancion(lista[anteriorIdx], anteriorIdx);
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
            state.rutinaConsecErrors = 0;
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            actualizarBarraAudioRutina();
            actualizarMediaSession();
        });

        state.audio.addEventListener('pause', function() {
            state.reproduciendo = false;
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            actualizarBarraAudioRutina();
            actualizarMediaSession();
        });

        state.audio.addEventListener('error', function(err) {
            console.error('[Audio] Error al reproducir archivo:', err);
            state.reproduciendo = false;
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            actualizarBarraAudioRutina();
            if (state.rutinaModoActivo && state.rutinaPlaylistActivaId) {
                var tracks = obtenerCancionesDePlaylist(state.rutinaPlaylistActivaId);
                state.rutinaConsecErrors++;
                if (tracks.length > 1 && state.rutinaConsecErrors < tracks.length) {
                    setTimeout(function() {
                        if (state.rutinaModoActivo) siguienteCancion(false);
                    }, 200);
                }
            }
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
        state.playlistSeleccionada = null;
        state.subtabActual = 'todas';
        var tabs = document.querySelectorAll('.player-subtab-btn');
        tabs.forEach(function(b) {
            b.classList.toggle('active', b.getAttribute('data-subtab') === 'todas');
        });
        renderizarContenidoSegunSubtab();
    }

    function seleccionarPlaylist(plId) {
        state.playlistSeleccionada = plId;
        state.carpetaSeleccionada = null;
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

    function contarCancionesValidasPlaylist(pl) {
        if (!pl || !Array.isArray(pl.cancionIds)) return 0;
        var map = new Set(state.canciones.map(function(c) { return c.id; }));
        if (map.size === 0) return pl.cancionIds.length;
        return pl.cancionIds.filter(function(id) { return map.has(id); }).length;
    }

    function renderizarPlaylistsView(cont) {
        var defaultPlId = getPlaylistDefaultRutinaId();
        var html = '<div class="pl-view-toolbar">' +
            '<div class="pl-view-toolbar-left">' +
                '<span class="pl-view-title">📋 Listas de Reproducción</span>' +
                '<span class="pl-count-badge">' + state.playlists.length + '</span>' +
            '</div>' +
            '<button type="button" class="btn-pl-nueva-cta" onclick="window.MonarcaPlayer.abrirModalCrearPlaylist()">✨ + Nueva Lista</button>' +
        '</div>';

        if (state.playlists.length === 0) {
            html += '<div class="pl-empty-card">' +
                '<div class="pl-empty-icon">🎶</div>' +
                '<h4>Aún no tienes listas creadas</h4>' +
                '<p>Agrupa tus MP3 favoritos en listas personalizadas (ej: "Gym", "Enfoque", "Rutina Matutina") y añádelas con un toque.</p>' +
                '<button type="button" class="btn-pl-nueva-cta" onclick="window.MonarcaPlayer.abrirModalCrearPlaylist()">✨ Crear Mi Primera Lista</button>' +
            '</div>';
            cont.innerHTML = html;
            return;
        }

        html += '<div class="player-playlists-grid">';
        state.playlists.forEach(function(pl) {
            var count = contarCancionesValidasPlaylist(pl);
            var esDefaultRutina = (defaultPlId && defaultPlId === pl.id);
            html += '<div class="player-playlist-card' + (esDefaultRutina ? ' is-default-rutina' : '') + '">' +
                '<div class="pl-card-top" onclick="window.MonarcaPlayer.seleccionarPlaylist(\'' + pl.id + '\')">' +
                    '<div class="player-playlist-art' + (esDefaultRutina ? ' is-default' : '') + '">' + (esDefaultRutina ? '🏋️' : '🎶') + '</div>' +
                    '<div class="pl-card-info">' +
                        '<div class="pl-card-title">' + escaparHTML(pl.nombre) + '</div>' +
                        '<div class="pl-card-meta">' +
                            '<span>' + count + (count === 1 ? ' canción' : ' canciones') + '</span>' +
                            (esDefaultRutina ? '<span class="pl-default-chip">Activa en Rutinas</span>' : '') +
                        '</div>' +
                    '</div>' +
                    '<button type="button" class="btn-pl-delete" onclick="event.stopPropagation(); window.MonarcaPlayer.eliminarPlaylist(\'' + pl.id + '\')" title="Eliminar lista">✕</button>' +
                '</div>' +
                '<div class="player-playlist-actions">' +
                    '<button type="button" class="btn-pl-action-play" onclick="window.MonarcaPlayer.reproducirPlaylistDirecto(\'' + pl.id + '\')" title="Reproducir esta lista">' +
                        '▶ Reproducir' +
                    '</button>' +
                    '<button type="button" class="btn-pl-action-add" onclick="window.MonarcaPlayer.abrirModalAgregarCancionesAPlaylist(\'' + pl.id + '\')" title="Agregar o quitar canciones de esta lista">' +
                        '➕ Canciones' +
                    '</button>' +
                    '<button type="button" class="btn-playlist-default-rutina' + (esDefaultRutina ? ' active' : '') + '" onclick="window.MonarcaPlayer.togglePlaylistDefaultRutina(\'' + pl.id + '\')" title="Elegir como playlist automática al iniciar rutinas">' +
                        (esDefaultRutina ? '🏋️ Rutinas ✓' : '🏋️ Rutinas') +
                    '</button>' +
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
            encabezadoFiltro = '<div class="pl-detail-banner is-folder">' +
                '<span class="pl-detail-banner-title">📁 Carpeta: <strong>' + escaparHTML(state.carpetaSeleccionada) + '</strong> (' + listaFiltrada.length + ')</span>' +
                '<button type="button" class="btn-pl-back-pill" onclick="window.MonarcaPlayer.seleccionarCarpeta(null)">← Todas</button>' +
            '</div>';
        } else if (state.playlistSeleccionada) {
            var plObj = state.playlists.find(function(p) { return p.id === state.playlistSeleccionada; });
            var esDefSel = (getPlaylistDefaultRutinaId() === state.playlistSeleccionada);
            encabezadoFiltro = '<div class="pl-detail-banner">' +
                '<div class="pl-detail-banner-left">' +
                    '<div class="pl-detail-banner-title">📑 ' + escaparHTML(plObj ? plObj.nombre : 'Lista') + ' <span class="pl-count-badge">' + listaFiltrada.length + '</span></div>' +
                    '<div class="pl-detail-banner-sub">Puedes reproducir, añadir pistas de tu biblioteca o quitar sin borrar archivos MP3.</div>' +
                '</div>' +
                '<div class="pl-detail-banner-actions">' +
                    '<button type="button" class="btn-pl-action-add" onclick="window.MonarcaPlayer.abrirModalAgregarCancionesAPlaylist(\'' + state.playlistSeleccionada + '\')">➕ Agregar Canciones</button>' +
                    '<button type="button" class="btn-playlist-default-rutina' + (esDefSel ? ' active' : '') + '" onclick="window.MonarcaPlayer.togglePlaylistDefaultRutina(\'' + state.playlistSeleccionada + '\')" title="Elegir como playlist automática al iniciar rutinas">' +
                        (esDefSel ? '🏋️ Rutinas ✓' : '🏋️ Rutinas') +
                    '</button>' +
                    '<button type="button" class="btn-pl-back-pill" onclick="window.MonarcaPlayer.cambiarSubtab(\'playlists\')">← Listas</button>' +
                '</div>' +
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
            if (state.playlistSeleccionada && !q) {
                cont.innerHTML = encabezadoFiltro + '<div class="pl-empty-card">' +
                    '<div class="pl-empty-icon">🎵</div>' +
                    '<h4>Esta lista todavía no tiene canciones</h4>' +
                    '<p>Selecciona pistas desde tu biblioteca offline para añadirlas a esta lista de reproducción.</p>' +
                    '<button type="button" class="btn-pl-nueva-cta" onclick="window.MonarcaPlayer.abrirModalAgregarCancionesAPlaylist(\'' + state.playlistSeleccionada + '\')">➕ Agregar Canciones</button>' +
                '</div>';
            } else {
                cont.innerHTML = encabezadoFiltro + '<div style="text-align: center; padding: 24px 16px; color: #94a3b8; font-size: 13px;">' +
                    'No se encontraron canciones que coincidan con la búsqueda.' +
                '</div>';
            }
            return;
        }

        var enVistaPlaylist = !!state.playlistSeleccionada;
        var html = encabezadoFiltro;
        listaFiltrada.forEach(function(c, listIndex) {
            var esActual = (state.cancionActual && state.cancionActual.id === c.id);
            var sonando = esActual && state.reproduciendo;

            var accionDerecha = enVistaPlaylist
                ? '<button type="button" class="btn-pl-remove-track" title="Quitar de esta lista (mantiene el MP3 en tu biblioteca)" onclick="window.MonarcaPlayer.quitarCancionDePlaylist(\'' + state.playlistSeleccionada + '\', \'' + c.id + '\')">Quitar</button>'
                : ('<button type="button" id="btn-transfer-' + c.id + '" class="btn-song-option-pill" title="Enviar únicamente esta canción a la PC" onclick="window.MonarcaPlayer.enviarCancionAPC(\'' + c.id + '\')">☁️ PC</button>' +
                   '<button type="button" class="btn-song-option-pill" title="Añadir a lista de reproducción" onclick="window.MonarcaPlayer.abrirModalAgregarPlaylist(\'' + c.id + '\')">➕ Lista</button>' +
                   '<button type="button" class="btn-song-option-pill" title="Descargar archivo local" onclick="window.MonarcaPlayer.descargarCancionArchivoLocal(\'' + c.id + '\')">⬇️</button>' +
                   '<button type="button" class="btn-song-delete" title="Eliminar de la biblioteca" onclick="window.MonarcaPlayer.eliminarCancion(\'' + c.id + '\')">✕</button>');

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
                    accionDerecha +
                '</div>' +
            '</div>';
        });

        cont.innerHTML = html;
    }

    function abrirModalAgregarPlaylist(songId) {
        state._modalAgregarModo = 'song';
        state._modalAgregarSongId = songId;
        state._modalAgregarPlaylistId = null;

        var modal = document.getElementById('modal-reproductor-agregar-playlist');
        var tit = document.getElementById('modal-pl-agregar-titulo');
        var sub = document.getElementById('modal-pl-agregar-subtitulo');
        var song = state.canciones.find(function(c) { return c.id === songId; });

        if (tit) tit.textContent = 'Agregar Canción a Lista';
        if (sub) sub.textContent = song ? ('🎵 ' + song.nombre) : 'Selecciona una o más listas';

        renderizarCuerpoModalAgregarPlaylist();
        if (modal) modal.style.display = 'flex';
    }

    function abrirModalAgregarCancionesAPlaylist(plId) {
        var pl = state.playlists.find(function(p) { return p.id === plId; });
        if (!pl) return;

        state._modalAgregarModo = 'playlist';
        state._modalAgregarPlaylistId = plId;
        state._modalAgregarSongId = null;
        state._modalAgregarFiltro = '';
        state._modalAgregarSeleccionIds = Array.isArray(pl.cancionIds) ? pl.cancionIds.slice() : [];

        var modal = document.getElementById('modal-reproductor-agregar-playlist');
        var tit = document.getElementById('modal-pl-agregar-titulo');
        var sub = document.getElementById('modal-pl-agregar-subtitulo');

        if (tit) tit.textContent = 'Agregar Canciones a la Lista';
        if (sub) sub.textContent = '📑 ' + pl.nombre;

        renderizarCuerpoModalAgregarPlaylist();
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(function() {
                var sIn = document.getElementById('input-buscar-song-modal-playlist');
                if (sIn) sIn.focus();
            }, 60);
        }
    }

    function cerrarModalAgregarPlaylist() {
        var modal = document.getElementById('modal-reproductor-agregar-playlist');
        if (modal) modal.style.display = 'none';
        state._modalAgregarSongId = null;
        state._modalAgregarPlaylistId = null;
    }

    function renderizarCuerpoModalAgregarPlaylist() {
        var cuerpo = document.getElementById('modal-pl-agregar-cuerpo');
        var footer = document.getElementById('modal-pl-agregar-footer');
        if (!cuerpo || !footer) return;

        if (state._modalAgregarModo === 'song') {
            var songId = state._modalAgregarSongId;
            if (state.playlists.length === 0) {
                cuerpo.innerHTML = '<div class="pl-empty-card" style="margin: 4px 0;">' +
                    '<div class="pl-empty-icon">📋</div>' +
                    '<h4>No tienes listas de reproducción</h4>' +
                    '<p>Crea tu primera lista ahora y esta canción se añadirá automáticamente.</p>' +
                    '<button type="button" class="btn-pl-nueva-cta" onclick="window.MonarcaPlayer.abrirModalCrearPlaylist(\'' + songId + '\')">✨ Crear Lista y Agregar</button>' +
                '</div>';
                footer.innerHTML = '<button type="button" class="btn-back-system" style="margin-bottom: 0;" onclick="window.MonarcaPlayer.cerrarModalAgregarPlaylist()">Cerrar</button>';
                return;
            }

            var html = '<div class="pl-picker-list">';
            state.playlists.forEach(function(pl) {
                var ids = pl.cancionIds || [];
                var estaDentro = ids.indexOf(songId) !== -1;
                html += '<button type="button" class="pl-picker-playlist-row' + (estaDentro ? ' is-selected' : '') + '" onclick="window.MonarcaPlayer.toggleCancionEnPlaylistDesdeModal(\'' + pl.id + '\', \'' + songId + '\')">' +
                    '<div class="pl-picker-row-left">' +
                        '<span class="pl-picker-icon">' + (estaDentro ? '✓' : '🎶') + '</span>' +
                        '<div class="pl-picker-text">' +
                            '<div class="pl-picker-name">' + escaparHTML(pl.nombre) + '</div>' +
                            '<div class="pl-picker-sub">' + ids.length + (ids.length === 1 ? ' canción' : ' canciones') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<span class="pl-picker-status' + (estaDentro ? ' is-added' : '') + '">' + (estaDentro ? 'En lista ✓' : '+ Agregar') + '</span>' +
                '</button>';
            });
            html += '</div>';
            cuerpo.innerHTML = html;

            footer.innerHTML =
                '<button type="button" class="btn-pl-action-add" style="margin-right: auto;" onclick="window.MonarcaPlayer.abrirModalCrearPlaylist(\'' + songId + '\')">✨ + Nueva Lista</button>' +
                '<button type="button" class="btn-system pl-modal-btn-primary" style="margin-bottom: 0;" onclick="window.MonarcaPlayer.cerrarModalAgregarPlaylist()">✓ Listo</button>';
            return;
        }

        // Modo 'playlist': agregar múltiples canciones de la biblioteca a la playlist
        if (state.canciones.length === 0) {
            cuerpo.innerHTML = '<div class="pl-empty-card">' +
                '<div class="pl-empty-icon">🎧</div>' +
                '<h4>No hay MP3 en tu biblioteca</h4>' +
                '<p>Carga canciones desde tu dispositivo para poder añadirlas a esta lista.</p>' +
                '<button type="button" class="btn-cargar-mp3-action" onclick="window.MonarcaPlayer.cerrarModalAgregarPlaylist(); document.getElementById(\'input-file-mp3-monarca\').click();">📁 Cargar Archivos MP3</button>' +
            '</div>';
            footer.innerHTML = '<button type="button" class="btn-back-system" style="margin-bottom: 0;" onclick="window.MonarcaPlayer.cerrarModalAgregarPlaylist()">Cerrar</button>';
            return;
        }

        cuerpo.innerHTML =
            '<div class="pl-picker-toolbar">' +
                '<input type="text" id="input-buscar-song-modal-playlist" class="modal-input pl-picker-search" placeholder="🔍 Filtrar canciones de tu biblioteca..." value="' + escaparHTML(state._modalAgregarFiltro || '') + '" oninput="window.MonarcaPlayer.filtrarModalPlaylistCanciones(this.value)">' +
                '<button type="button" class="btn-pl-back-pill" onclick="window.MonarcaPlayer.toggleTodasVisibleModalPlaylist()">✓ Seleccionar visibles</button>' +
            '</div>' +
            '<div id="modal-pl-song-list-inner" class="pl-picker-song-list"></div>';

        renderizarListaCancionesModalInner();
    }

    function obtenerCancionesFiltradasModal() {
        var f = (state._modalAgregarFiltro || '').toLowerCase().trim();
        return state.canciones.filter(function(c) {
            if (!f) return true;
            return (c.nombre || '').toLowerCase().indexOf(f) !== -1 ||
                   (c.carpeta || '').toLowerCase().indexOf(f) !== -1;
        });
    }

    function renderizarListaCancionesModalInner() {
        var contInner = document.getElementById('modal-pl-song-list-inner');
        var footer = document.getElementById('modal-pl-agregar-footer');
        if (!contInner) return;

        var filtradas = obtenerCancionesFiltradasModal();
        var selSet = new Set(state._modalAgregarSeleccionIds || []);

        if (filtradas.length === 0) {
            contInner.innerHTML = '<div style="text-align: center; padding: 24px 12px; color: #64748b; font-size: 12.5px;">No hay canciones que coincidan con tu búsqueda.</div>';
        } else {
            var html = '';
            filtradas.forEach(function(c) {
                var marcado = selSet.has(c.id);
                html += '<button type="button" class="pl-picker-song-row' + (marcado ? ' is-selected' : '') + '" onclick="window.MonarcaPlayer.toggleSeleccionCancionEnModal(\'' + c.id + '\')">' +
                    '<div class="pl-picker-check">' + (marcado ? '✓' : '') + '</div>' +
                    '<div class="pl-picker-text">' +
                        '<div class="pl-picker-name">' + escaparHTML(c.nombre) + '</div>' +
                        '<div class="pl-picker-sub">📁 ' + escaparHTML(c.carpeta || 'Principal') + ' · ' + formatearTamano(c.tamano) + '</div>' +
                    '</div>' +
                    '<span class="pl-picker-status' + (marcado ? ' is-added' : '') + '">' + (marcado ? 'Seleccionada' : '+ Añadir') + '</span>' +
                '</button>';
            });
            contInner.innerHTML = html;
        }

        if (footer) {
            var totalSel = selSet.size;
            footer.innerHTML =
                '<span style="font-size: 12px; color: #94a3b8; font-weight: 700; margin-right: auto;">' + totalSel + (totalSel === 1 ? ' canción seleccionada' : ' canciones seleccionadas') + '</span>' +
                '<button type="button" class="btn-back-system" style="margin-bottom: 0;" onclick="window.MonarcaPlayer.cerrarModalAgregarPlaylist()">Cancelar</button>' +
                '<button type="button" id="btn-pl-guardar-canciones" class="btn-system pl-modal-btn-primary" style="margin-bottom: 0;" onclick="window.MonarcaPlayer.confirmarCancionesEnPlaylistModal()">✓ Guardar en Lista (' + totalSel + ')</button>';
        }
    }

    function toggleCancionEnPlaylistDesdeModal(plId, songId) {
        var pl = state.playlists.find(function(p) { return p.id === plId; });
        if (!pl) return;
        if (!pl.cancionIds) pl.cancionIds = [];
        if (pl.cancionIds.indexOf(songId) === -1) {
            agregarCancionAPlaylist(plId, songId, true);
            notificarPlayerToast('Añadida a "' + pl.nombre + '"', '✓');
        } else {
            quitarCancionDePlaylist(plId, songId, true);
            notificarPlayerToast('Quitada de "' + pl.nombre + '"', '➖');
        }
        renderizarCuerpoModalAgregarPlaylist();
    }

    function filtrarModalPlaylistCanciones(query) {
        state._modalAgregarFiltro = query || '';
        renderizarListaCancionesModalInner();
    }

    function toggleSeleccionCancionEnModal(songId) {
        var arr = state._modalAgregarSeleccionIds || [];
        var idx = arr.indexOf(songId);
        if (idx === -1) {
            arr.push(songId);
        } else {
            arr.splice(idx, 1);
        }
        state._modalAgregarSeleccionIds = arr;
        renderizarListaCancionesModalInner();
    }

    function toggleTodasVisibleModalPlaylist() {
        var filtradas = obtenerCancionesFiltradasModal();
        if (filtradas.length === 0) return;
        var selSet = new Set(state._modalAgregarSeleccionIds || []);
        var todasYaMarcadas = filtradas.every(function(c) { return selSet.has(c.id); });
        if (todasYaMarcadas) {
            filtradas.forEach(function(c) { selSet.delete(c.id); });
        } else {
            filtradas.forEach(function(c) { selSet.add(c.id); });
        }
        state._modalAgregarSeleccionIds = Array.from(selSet);
        renderizarListaCancionesModalInner();
    }

    function confirmarCancionesEnPlaylistModal() {
        var pl = state.playlists.find(function(p) { return p.id === state._modalAgregarPlaylistId; });
        if (!pl) {
            cerrarModalAgregarPlaylist();
            return;
        }
        pl.cancionIds = (state._modalAgregarSeleccionIds || []).slice();
        guardarPlaylistsStorage();
        notificarCambioPlaylistsYDefault();
        cerrarModalAgregarPlaylist();
        renderizarContenidoSegunSubtab();
        notificarPlayerToast('Lista "' + pl.nombre + '" actualizada (' + pl.cancionIds.length + ')', '🎶');
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

    function actualizarBarraAudioRutina() {
        var bar = document.getElementById('rutina-musica-live-bar');
        if (!bar) return;

        var elPl = document.getElementById('rutina-musica-live-playlist');
        var elPill = document.getElementById('rutina-musica-mode-pill');
        var elTrack = document.getElementById('rutina-musica-live-track');
        var elIcon = document.getElementById('rutina-musica-live-icon');
        var btnPlay = document.getElementById('btn-rutina-musica-play');
        var btnNext = document.getElementById('btn-rutina-musica-next');
        var btnStop = document.getElementById('btn-rutina-musica-stop');

        var plActivaId = state.rutinaModoActivo ? state.rutinaPlaylistActivaId : getPlaylistDefaultRutinaId();
        var plObj = plActivaId ? state.playlists.find(function(p) { return p && p.id === plActivaId; }) : null;
        var tracksPl = plObj ? obtenerCancionesDePlaylist(plObj.id) : [];

        if (elPl) {
            elPl.textContent = plObj ? ('Playlist: ' + plObj.nombre) : 'Música Automática de Rutina';
        }
        if (elPill) {
            elPill.style.display = (state.rutinaModoActivo && plObj && tracksPl.length > 0) ? 'inline-flex' : 'none';
        }

        if (elTrack) {
            if (state.rutinaModoActivo && state.cancionActual) {
                elTrack.textContent = (state.reproduciendo ? '▶ ' : '⏸ (Toca ▶ para sonar) ') + state.cancionActual.nombre;
            } else if (plObj && tracksPl.length === 0) {
                elTrack.textContent = '⚠️ La playlist "' + plObj.nombre + '" no tiene canciones aún';
            } else if (state.cancionActual) {
                elTrack.textContent = (state.reproduciendo ? '▶ ' : '⏸ ') + state.cancionActual.nombre;
            } else if (plObj) {
                elTrack.textContent = 'Lista "' + plObj.nombre + '" (' + tracksPl.length + ' canciones) lista';
            } else {
                elTrack.textContent = 'Sin playlist seleccionada para rutinas';
            }
        }

        if (elIcon) {
            elIcon.classList.toggle('playing', !!state.reproduciendo);
        }

        if (btnPlay) {
            btnPlay.textContent = state.reproduciendo ? '⏸' : '▶';
            btnPlay.title = state.reproduciendo ? 'Pausar música' : 'Reproducir música';
            btnPlay.disabled = (!state.cancionActual && tracksPl.length === 0);
            btnPlay.classList.toggle('needs-tap', !!(state.rutinaModoActivo && state.cancionActual && !state.reproduciendo));
        }
        if (btnNext) {
            btnNext.disabled = !(state.rutinaModoActivo && tracksPl.length > 0) && !state.cancionActual;
        }
        if (btnStop) {
            btnStop.disabled = !(state.rutinaModoActivo || state.cancionActual);
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

        var elSubTxt = document.getElementById('mini-player-subtitle-text');
        if (elSubTxt) {
            if (state.rutinaModoActivo && state.rutinaPlaylistActivaId) {
                var plAct = state.playlists.find(function(p) { return p && p.id === state.rutinaPlaylistActivaId; });
                elSubTxt.textContent = '🏋️ ' + (plAct ? plAct.nombre : 'Rutina') + ' · Aleatorio continuo';
            } else {
                elSubTxt.textContent = 'Monarca Audio Deck';
            }
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

    function getPlaylists() {
        if (state.playlists.length === 0) {
            cargarPlaylistsStorage();
        }
        return state.playlists || [];
    }

    // ----------------------------------------------------------------------
    // 10. INICIALIZADOR GLOBAL
    // ----------------------------------------------------------------------
    function init() {
        var elAudio = document.getElementById('monarca-player-audio');
        if (elAudio) {
            state.audio = elAudio;
        }

        cargarPlaylistsStorage();
        initAudioListeners();
        initMediaSession();
        if (obtenerPluginMediaSession()) {
            obtenerArtworkDataUrl();
        }

        cargarMetadatosCanciones().then(function() {
            renderizarContenidoSegunSubtab();
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            actualizarBarraAudioRutina();
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
                if (vistaId === 'vista-reproductor') {
                    renderizarContenidoSegunSubtab();
                }
                actualizarMiniPlayer();
                actualizarBarraAudioRutina();
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
        actualizarBarraAudioRutina: actualizarBarraAudioRutina,
        cambiarSubtab: cambiarSubtab,
        seleccionarCarpeta: seleccionarCarpeta,
        seleccionarPlaylist: seleccionarPlaylist,
        crearPlaylistPrompt: crearPlaylistPrompt,
        abrirModalCrearPlaylist: abrirModalCrearPlaylist,
        cerrarModalCrearPlaylist: cerrarModalCrearPlaylist,
        usarSugerenciaPlaylist: usarSugerenciaPlaylist,
        confirmarCrearPlaylistModal: confirmarCrearPlaylistModal,
        agregarCancionAPlaylist: agregarCancionAPlaylist,
        quitarCancionDePlaylist: quitarCancionDePlaylist,
        reproducirPlaylistDirecto: reproducirPlaylistDirecto,
        eliminarPlaylist: eliminarPlaylist,
        abrirModalAgregarPlaylist: abrirModalAgregarPlaylist,
        abrirModalAgregarCancionesAPlaylist: abrirModalAgregarCancionesAPlaylist,
        cerrarModalAgregarPlaylist: cerrarModalAgregarPlaylist,
        toggleCancionEnPlaylistDesdeModal: toggleCancionEnPlaylistDesdeModal,
        filtrarModalPlaylistCanciones: filtrarModalPlaylistCanciones,
        toggleSeleccionCancionEnModal: toggleSeleccionCancionEnModal,
        toggleTodasVisibleModalPlaylist: toggleTodasVisibleModalPlaylist,
        confirmarCancionesEnPlaylistModal: confirmarCancionesEnPlaylistModal,
        getPlaylists: getPlaylists,
        getPlaylistDefaultRutinaId: getPlaylistDefaultRutinaId,
        setPlaylistDefaultRutina: setPlaylistDefaultRutina,
        togglePlaylistDefaultRutina: togglePlaylistDefaultRutina,
        iniciarMusicaDeRutina: iniciarMusicaDeRutina,
        detenerMusicaDeRutina: detenerMusicaDeRutina,
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
