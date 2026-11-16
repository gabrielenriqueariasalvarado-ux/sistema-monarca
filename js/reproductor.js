// ==========================================================================
// SISTEMA MONARCA - MOTOR DE REPRODUCTOR DE MÚSICA MP3 OFFLINE (v10.49)
// Almacenamiento binario en IndexedDB (MonarcaMusicaDB) & Controles Flotantes
// ==========================================================================

(function(window) {
    'use strict';

    var DB_NAME = 'MonarcaMusicaDB';
    var DB_VERSION = 1;
    var STORE_NAME = 'canciones';

    var state = {
        db: null,
        canciones: [],        // Metadatos { id, nombre, tamano, tipo, fecha }
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
    // 2. OPERACIONES DE BIBLIOTECA EN INDEXEDDB
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
                            tamano: val.tamano,
                            tipo: val.tipo,
                            fecha: val.fecha
                        });
                        cursor.continue();
                    } else {
                        // Ordenar por fecha o nombre
                        lista.sort(function(a, b) { return (b.fecha || 0) - (a.fecha || 0); });
                        state.canciones = lista;
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

    function guardarCancionesFiles(fileList) {
        if (!fileList || fileList.length === 0) return Promise.resolve();

        return abrirDB().then(function(db) {
            var promesas = [];
            for (var i = 0; i < fileList.length; i++) {
                var file = fileList[i];
                if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|m4a|wav|ogg|aac|flac)$/i)) {
                    continue;
                }
                var dotIdx = file.name.lastIndexOf('.');
                var cleanName = (dotIdx > 0) ? file.name.substring(0, dotIdx) : file.name;
                var cancionObj = {
                    id: 'song_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    nombre: cleanName,
                    tamano: file.size,
                    tipo: file.type || 'audio/mpeg',
                    fecha: Date.now(),
                    blob: file
                };

                promesas.push(new Promise(function(res, rej) {
                    var tx = db.transaction([STORE_NAME], 'readwrite');
                    var store = tx.objectStore(STORE_NAME);
                    var addReq = store.add(cancionObj);
                    addReq.onsuccess = function() { res(); };
                    addReq.onerror = function(err) { rej(err); };
                }));
            }

            return Promise.all(promesas).then(function() {
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
            return cargarMetadatosCanciones();
        }).then(function() {
            renderizarListaCanciones();
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
                state.indiceActual = -1;
                state.cancionActual = null;
                renderizarListaCanciones();
                actualizarUIPlayerCompleto();
                actualizarMiniPlayer();
            };
        });
    }

    // ----------------------------------------------------------------------
    // 3. MOTOR DE AUDIO Y CONTROL DE REPRODUCCIÓN
    // ----------------------------------------------------------------------
    function reproducirIndice(idx) {
        if (idx < 0 || idx >= state.canciones.length) return;
        var meta = state.canciones[idx];
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
                    renderizarListaCanciones();
                    actualizarMediaSession();
                }).catch(function(err) {
                    console.warn('[Reproductor] Autoplay prevenido o error:', err);
                    state.reproduciendo = false;
                    actualizarUIPlayerCompleto();
                    actualizarMiniPlayer();
                });
            }
        });
    }

    function togglePlayPausa() {
        if (!state.cancionActual) {
            if (state.canciones.length > 0) {
                reproducirIndice(0);
            }
            return;
        }

        if (state.audio.paused) {
            state.audio.play().then(function() {
                state.reproduciendo = true;
                actualizarUIPlayerCompleto();
                actualizarMiniPlayer();
                renderizarListaCanciones();
                actualizarMediaSession();
            }).catch(function(e) {
                console.error('[Reproductor] Error al reproducir:', e);
            });
        } else {
            state.audio.pause();
            state.reproduciendo = false;
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            renderizarListaCanciones();
            actualizarMediaSession();
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
        renderizarListaCanciones();
    }

    function siguienteCancion(esManual) {
        if (state.canciones.length === 0) return;

        if (!esManual && state.repeat === 'one') {
            state.audio.currentTime = 0;
            state.audio.play();
            return;
        }

        var siguienteIdx;
        if (state.shuffle && state.canciones.length > 1) {
            do {
                siguienteIdx = Math.floor(Math.random() * state.canciones.length);
            } while (siguienteIdx === state.indiceActual);
        } else {
            siguienteIdx = state.indiceActual + 1;
            if (siguienteIdx >= state.canciones.length) {
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
        if (state.canciones.length === 0) return;

        // Si ya han pasado más de 3 segundos, reiniciar la pista actual
        if (state.audio.currentTime > 3) {
            state.audio.currentTime = 0;
            return;
        }

        var anteriorIdx = state.indiceActual - 1;
        if (anteriorIdx < 0) {
            anteriorIdx = state.canciones.length - 1;
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
    // 4. INTEGRACIÓN MEDIA SESSION (PANTALLA DE BLOQUEO / NOTIFICACIONES)
    // ----------------------------------------------------------------------
    function actualizarMediaSession() {
        if (!('mediaSession' in navigator)) return;

        if (state.cancionActual) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: state.cancionActual.nombre || 'Canción',
                artist: 'Sistema Monarca',
                album: 'Bóveda Offline de Audio',
                artwork: [
                    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
                ]
            });
            navigator.mediaSession.playbackState = state.reproduciendo ? 'playing' : 'paused';
        } else {
            navigator.mediaSession.playbackState = 'none';
        }
    }

    function initMediaSession() {
        if (!('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.setActionHandler('play', function() { togglePlayPausa(); });
            navigator.mediaSession.setActionHandler('pause', function() { togglePlayPausa(); });
            navigator.mediaSession.setActionHandler('previoustrack', function() { anteriorCancion(); });
            navigator.mediaSession.setActionHandler('nexttrack', function() { siguienteCancion(true); });
            navigator.mediaSession.setActionHandler('seekto', function(details) {
                if (details.seekTime && state.audio.duration) {
                    state.audio.currentTime = details.seekTime;
                }
            });
        } catch(e) {
            console.warn('[Reproductor] MediaSession action handlers error:', e);
        }
    }

    // ----------------------------------------------------------------------
    // 5. EVENTOS DEL OBJETO AUDIO
    // ----------------------------------------------------------------------
    function initAudioListeners() {
        state.audio.addEventListener('timeupdate', function() {
            var cur = state.audio.currentTime || 0;
            var dur = state.audio.duration || 0;
            var pct = dur > 0 ? (cur / dur) * 100 : 0;

            // Slider y tiempos vista completa
            var slider = document.getElementById('player-seek-slider');
            if (slider && !slider.matches(':active')) {
                slider.value = pct;
            }
            var elCur = document.getElementById('player-time-current');
            if (elCur) elCur.textContent = formatearTiempo(cur);
            var elDur = document.getElementById('player-time-duration');
            if (elDur) elDur.textContent = formatearTiempo(dur);

            // Barra mini player
            var miniBar = document.getElementById('mini-player-fill');
            if (miniBar) miniBar.style.width = pct + '%';
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
    // 6. RENDERIZADO DE INTERFAZ (VISTA COMPLETA)
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
                elSub.textContent = 'Pista #' + (state.indiceActual + 1) + ' · ' + formatearTamano(state.cancionActual.tamano);
            } else {
                elSub.textContent = state.canciones.length > 0 ? (state.canciones.length + ' canciones listas en la biblioteca') : 'Sube tus archivos MP3 para comenzar';
            }
        }

        if (elDisc) {
            if (state.reproduciendo) {
                elDisc.classList.add('spinning');
            } else {
                elDisc.classList.remove('spinning');
            }
        }

        if (waveContainer) {
            if (state.reproduciendo) {
                waveContainer.classList.add('playing');
            } else {
                waveContainer.classList.remove('playing');
            }
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

    function renderizarListaCanciones() {
        var cont = document.getElementById('reproductor-lista-canciones');
        var countBadge = document.getElementById('player-total-songs-badge');
        var sizeBadge = document.getElementById('player-total-size-badge');

        var totalBytes = 0;
        state.canciones.forEach(function(c) { totalBytes += (c.tamano || 0); });

        if (countBadge) countBadge.textContent = state.canciones.length + ' ' + (state.canciones.length === 1 ? 'canción' : 'canciones');
        if (sizeBadge) sizeBadge.textContent = formatearTamano(totalBytes);

        if (!cont) return;

        var q = (state.busqueda || '').toLowerCase().trim();
        var listaFiltrada = state.canciones.filter(function(c) {
            if (!q) return true;
            return (c.nombre || '').toLowerCase().indexOf(q) !== -1;
        });

        if (state.canciones.length === 0) {
            cont.innerHTML = '<div style="text-align: center; padding: 32px 16px; color: #94a3b8;">' +
                '<div style="font-size: 38px; margin-bottom: 8px;">🎵</div>' +
                '<h4 style="color: #f8fafc; margin: 0 0 6px 0; font-size: 15px;">Tu biblioteca de música está vacía</h4>' +
                '<p style="font-size: 12.5px; margin: 0 0 16px 0; color: #64748b;">Pulsa "+ Cargar MP3s" para agregar canciones desde tu teléfono o computadora. Se guardarán en tu almacenamiento sin consumir internet.</p>' +
                '<button type="button" class="btn-cargar-mp3-action" onclick="document.getElementById(\'input-file-mp3-monarca\').click()">' +
                    '📁 Cargar Canciones Ahora' +
                '</button>' +
            '</div>';
            return;
        }

        if (listaFiltrada.length === 0) {
            cont.innerHTML = '<div style="text-align: center; padding: 24px 16px; color: #94a3b8; font-size: 13px;">' +
                'No se encontraron canciones que coincidan con "<strong>' + escaparHTML(q) + '</strong>".' +
            '</div>';
            return;
        }

        var html = '';
        listaFiltrada.forEach(function(c) {
            var realIdx = state.canciones.indexOf(c);
            var esActual = (state.cancionActual && state.cancionActual.id === c.id);
            var sonando = esActual && state.reproduciendo;

            html += '<div class="song-list-item ' + (esActual ? 'active-song' : '') + '" onclick="window.MonarcaPlayer.reproducirIndice(' + realIdx + ')">' +
                '<div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">' +
                    '<div class="song-item-icon">' +
                        (sonando
                            ? '<span class="mini-equalizer-bars"><span></span><span></span><span></span></span>'
                            : (esActual ? '▶' : (realIdx + 1))) +
                    '</div>' +
                    '<div style="min-width: 0; flex: 1;">' +
                        '<div class="song-item-title ' + (esActual ? 'text-glow-cyan' : '') + '">' + escaparHTML(c.nombre) + '</div>' +
                        '<div class="song-item-meta">' +
                            '<span>' + formatearTamano(c.tamano) + '</span>' +
                            '<span>•</span>' +
                            '<span>' + (new Date(c.fecha || Date.now()).toLocaleDateString()) + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;" onclick="event.stopPropagation();">' +
                    '<button type="button" class="btn-song-action" title="' + (sonando ? 'Pausar' : 'Reproducir') + '" onclick="window.MonarcaPlayer.reproducirIndice(' + realIdx + ')">' +
                        (sonando ? '⏸' : '▶') +
                    '</button>' +
                    '<button type="button" class="btn-song-delete" title="Eliminar canción" onclick="window.MonarcaPlayer.eliminarCancion(\'' + c.id + '\')">' +
                        '✕' +
                    '</button>' +
                '</div>' +
            '</div>';
        });

        cont.innerHTML = html;
    }

    // ----------------------------------------------------------------------
    // 7. RENDERIZADO DEL MINI-REPRODUCTOR FLOTANTE
    // ----------------------------------------------------------------------
    function actualizarMiniPlayer() {
        var elMini = document.getElementById('monarca-mini-player');
        if (!elMini) return;

        // Si no hay canción seleccionada o si el usuario lo cerró explícitamente y no está reproduciendo
        if (!state.cancionActual) {
            elMini.style.display = 'none';
            return;
        }

        // Si la vista actual es el reproductor completo, ocultar el mini para no duplicar controles
        if (window.VISTA_ACTUAL === 'vista-reproductor') {
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
            if (state.reproduciendo) {
                iconDisc.classList.add('spinning');
            } else {
                iconDisc.classList.remove('spinning');
            }
        }
    }

    function cerrarMiniPlayer() {
        var elMini = document.getElementById('monarca-mini-player');
        if (elMini) {
            elMini.style.display = 'none';
        }
    }

    function expandirReproductorCompleto() {
        if (typeof window.cambiarVista === 'function') {
            window.cambiarVista('vista-reproductor');
        }
    }

    function filtrarCanciones(val) {
        state.busqueda = val || '';
        renderizarListaCanciones();
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
    // 8. INICIALIZADOR GLOBAL
    // ----------------------------------------------------------------------
    function init() {
        initAudioListeners();
        initMediaSession();

        cargarMetadatosCanciones().then(function() {
            renderizarListaCanciones();
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            actualizarControlesModo();
        }).catch(function(e) {
            console.error('[Reproductor] Error cargando canciones iniciales:', e);
        });

        // Enganchar input file nativo oculto
        var fileIn = document.getElementById('input-file-mp3-monarca');
        if (fileIn) {
            fileIn.addEventListener('change', function(e) {
                var files = e.target.files;
                if (files && files.length > 0) {
                    var loader = document.getElementById('reproductor-cargando-aviso');
                    if (loader) loader.style.display = 'block';

                    guardarCancionesFiles(files).then(function() {
                        renderizarListaCanciones();
                        actualizarUIPlayerCompleto();
                        fileIn.value = '';
                        if (loader) loader.style.display = 'none';
                        // Si no había nada sonando, empezar a reproducir la primera subida
                        if (!state.cancionActual && state.canciones.length > 0) {
                            reproducirIndice(0);
                        }
                    }).catch(function(err) {
                        alert('Error guardando archivos: ' + err.message);
                        if (loader) loader.style.display = 'none';
                    });
                }
            });
        }

        // Enganchar cambio de vista para actualizar mini player
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
        getState: function() { return state; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

})(window);
