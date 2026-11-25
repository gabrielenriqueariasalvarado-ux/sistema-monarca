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
    var PLAYER_SCOPE_KEY = 'monarca_player_folder_scope';
    var PLAYER_KNOWN_SONGS_KEY = 'monarca_player_conocidas_v1';
    var PLAY_STATS_KEY = 'monarca_player_play_stats_v1';
    var PLAYER_MODES_KEY = 'monarca_player_modes_v1';

    var state = {
        db: null,
        canciones: [],        // Metadatos { id, sig, origen, nombre, artista, album, carpeta, tamano, tipo, fecha, ruta, contentUri, albumId }
        playlists: [],        // { id, nombre, fecha, fechaActualizacion, cancionIds: [], cancionSigs: [] }
        subtabActual: 'todas',// 'todas' | 'carpetas' | 'playlists' | 'top'
        soloSnapTube: (function() {
            try { return localStorage.getItem(PLAYER_SCOPE_KEY) !== 'all'; } catch (e) { return true; }
        })(),
        carpetaSeleccionada: null,
        playlistSeleccionada: null,
        transferenciasPendientes: [],
        indiceActual: -1,
        cancionActual: null,
        audio: new Audio(),
        blobUrlActual: null,
        reproduciendo: false,
        shuffle: false,
        modoInteligente: false,
        repeat: 'all',        // 'off' | 'all' | 'one'
        volumen: 1.0,
        busqueda: '',
        miniPlayerVisible: true,
        playStats: {},        // statKey -> { key, sig, id, nombre, artista, count, lastPlayedAt, firstPlayedAt }
        _playListenState: { seqId: 0, songId: null, lastTickTs: 0, elapsedSec: 0, counted: false, esPreview: false },
        _smartVisitedIds: {}, // contextKey -> { songId: true }
        // Modo música continua para rutinas
        rutinaDefaultPlaylistId: null,
        rutinaModoActivo: false,
        rutinaPlaylistActivaId: null,
        rutinaNombreActiva: '',
        rutinaColaAleatoria: [],
        rutinaPrevConfig: null,
        rutinaConsecErrors: 0,
        rutinaPreviaSnapshot: null,
        _rutinaTransicionandoSalida: false,
        _fadeIntervalId: null,
        _fadeToken: 0,
        _dbReady: false,
        _dbReadyPromise: null,
        _initialScanDone: false,
        _scanInFlight: null,
        _scanRescanQueued: false,
        _lastAutoScanTs: 0,
        _playSeqId: 0,
        _cargandoPlay: false,
        _cancelarCargaPorDesconexionSeq: -1,
        _lastNoisyPauseTs: 0,
        _noisyListenerRegistered: false,
        _knownWebAudioOutputs: null,
        _pendingSongForNewPlaylist: null,
        _modalAgregarModo: 'song',
        _modalAgregarSongId: null,
        _modalAgregarPlaylistId: null,
        _modalAgregarFiltro: '',
        _modalAgregarSeleccionIds: [],
        // Alerta de clasificación automática para canciones nuevas al entrar al MP3
        _triageCola: [],
        _triageTotalInicial: 0,
        _triageSeleccionPlIds: [],
        _triageSugerencias: {},
        _triageModalAbierto: false,
        _triageCrearPendiente: false,
        _triagePreviewStarted: false,
        // Soporte nativo MediaStore & portadas
        mediaPermiso: 'unknown', // 'granted' | 'denied' | 'prompt' | 'unknown'
        mediaPermisoChecked: false,
        nativoActivo: false,
        artworkCache: {},        // id -> url o 'none'
        artworkDataUrlCache: {}, // id -> dataUrl (solo para portada activa/MediaSession)
        _artQueue: [],
        _artInflight: 0,
        _artQueuedIds: {},
        _artObserver: null
    };

    function esCancionSnapTube(meta) {
        if (!meta) return false;
        var c = String(meta.carpeta || '').toLowerCase();
        var r = String(meta.ruta || '').toLowerCase();
        return c.indexOf('snaptube') !== -1 || r.indexOf('snaptube') !== -1;
    }

    function tienePistasSnapTube() {
        return (state.canciones || []).some(esCancionSnapTube);
    }

    function obtenerCancionesActivasScope() {
        var todas = state.canciones || [];
        if (state.soloSnapTube && tienePistasSnapTube()) {
            return todas.filter(function(c) {
                return esCancionSnapTube(c) || c.origen === 'idb';
            });
        }
        return todas;
    }

    function toggleSoloSnapTube(forzarVal) {
        var nuevo = (typeof forzarVal === 'boolean') ? forzarVal : !state.soloSnapTube;
        state.soloSnapTube = !!nuevo;
        try {
            localStorage.setItem(PLAYER_SCOPE_KEY, state.soloSnapTube ? 'snaptube' : 'all');
        } catch (e) {}
        state.carpetaSeleccionada = null;
        actualizarControlesFuenteBiblioteca();
        renderizarContenidoSegunSubtab();
        actualizarUIPlayerCompleto();
        notificarPlayerToast(
            state.soloSnapTube ? 'Mostrando solo canciones de SnapTube' : 'Mostrando todas tus carpetas de música',
            '🎧'
        );
    }

    function obtenerPluginMonarcaMedia() {
        try {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.MonarcaMedia) {
                return window.Capacitor.Plugins.MonarcaMedia;
            }
        } catch (e) {}
        return null;
    }

    function convertirArchivoAWebUrl(filePath) {
        if (!filePath) return '';
        try {
            if (window.Capacitor && typeof window.Capacitor.convertFileSrc === 'function') {
                return window.Capacitor.convertFileSrc(filePath);
            }
        } catch (e) {}
        return filePath.indexOf('file://') === 0 ? filePath : ('file://' + filePath);
    }

    function generarFirmaCancion(nombreBase, tamano) {
        var clean = String(nombreBase || '')
            .replace(/\.[a-z0-9]{2,5}$/i, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
        return clean + '__' + (Number(tamano) || 0);
    }

    function obtenerTituloLimpoYArtista(meta) {
        if (!meta) return { titulo: 'Canción Offline', artista: '' };
        var art = (meta.artista && String(meta.artista).trim() && !/^<unknown>$/i.test(meta.artista))
            ? String(meta.artista).trim()
            : '';
        var tit = meta.nombre ? String(meta.nombre).trim() : 'Sin título';
        if (!art) {
            var parsed = parsearTituloYArtista(tit);
            if (parsed && parsed.artista && parsed.artista !== 'Emily OS') {
                return { titulo: parsed.titulo || tit, artista: parsed.artista };
            }
        }
        return { titulo: tit, artista: art || 'Artista desconocido' };
    }

    // Lector ligero de ID3v2 (TIT2, TPE1, TALB, APIC) para archivos importados desde navegador/PC
    function leerTextoFrameID3(bytes, encByte) {
        if (!bytes || bytes.length === 0) return '';
        try {
            if (encByte === 1 || encByte === 2) {
                var offset = 0;
                var littleEndian = (encByte === 1);
                if (bytes.length >= 2) {
                    if (bytes[0] === 0xFF && bytes[1] === 0xFE) { littleEndian = true; offset = 2; }
                    else if (bytes[0] === 0xFE && bytes[1] === 0xFF) { littleEndian = false; offset = 2; }
                }
                var out = [];
                for (var i = offset; i + 1 < bytes.length; i += 2) {
                    var code = littleEndian ? (bytes[i] | (bytes[i + 1] << 8)) : ((bytes[i] << 8) | bytes[i + 1]);
                    if (code === 0) break;
                    out.push(String.fromCharCode(code));
                }
                return out.join('').trim();
            }
            var end = bytes.length;
            while (end > 0 && bytes[end - 1] === 0) end--;
            var slice = bytes.subarray(0, end);
            if (encByte === 3 && typeof TextDecoder !== 'undefined') {
                return new TextDecoder('utf-8').decode(slice).replace(/\0/g, '').trim();
            }
            if (typeof TextDecoder !== 'undefined') {
                return new TextDecoder('latin1').decode(slice).replace(/\0/g, '').trim();
            }
            var s = '';
            for (var k = 0; k < slice.length; k++) s += String.fromCharCode(slice[k]);
            return s.replace(/\0/g, '').trim();
        } catch (e) {
            return '';
        }
    }

    function extraerTagsID3v2File(file) {
        if (!file || typeof file.slice !== 'function' || file.size < 24) return Promise.resolve({});
        var maxRead = Math.min(file.size, 768 * 1024);
        return file.slice(0, maxRead).arrayBuffer().then(function(buf) {
            var u8 = new Uint8Array(buf);
            if (u8.length < 10 || u8[0] !== 0x49 || u8[1] !== 0x44 || u8[2] !== 0x33) {
                return {};
            }
            var ver = u8[3];
            if (ver < 2 || ver > 4) return {};
            var tagSize = ((u8[6] & 0x7F) << 21) | ((u8[7] & 0x7F) << 14) | ((u8[8] & 0x7F) << 7) | (u8[9] & 0x7F);
            var tagEnd = Math.min(u8.length, 10 + tagSize);
            var pos = 10;
            var result = {};

            // Saltar extended header si existe (bit 6 del byte de flags)
            if ((u8[5] & 0x40) !== 0 && pos + 4 <= tagEnd) {
                var extSz = (ver === 4)
                    ? (((u8[pos] & 0x7F) << 21) | ((u8[pos + 1] & 0x7F) << 14) | ((u8[pos + 2] & 0x7F) << 7) | (u8[pos + 3] & 0x7F))
                    : ((u8[pos] << 24) | (u8[pos + 1] << 16) | (u8[pos + 2] << 8) | u8[pos + 3]);
                pos += (ver === 4) ? extSz : (extSz + 4);
            }

            while (pos + (ver === 2 ? 6 : 10) <= tagEnd) {
                var fid = '';
                var fsize = 0;
                var hdrLen = (ver === 2) ? 6 : 10;
                if (ver === 2) {
                    fid = String.fromCharCode(u8[pos], u8[pos + 1], u8[pos + 2]);
                    fsize = (u8[pos + 3] << 16) | (u8[pos + 4] << 8) | u8[pos + 5];
                } else {
                    fid = String.fromCharCode(u8[pos], u8[pos + 1], u8[pos + 2], u8[pos + 3]);
                    if (ver === 4) {
                        fsize = ((u8[pos + 4] & 0x7F) << 21) | ((u8[pos + 5] & 0x7F) << 14) | ((u8[pos + 6] & 0x7F) << 7) | (u8[pos + 7] & 0x7F);
                    } else {
                        fsize = ((u8[pos + 4] << 24) >>> 0) + (u8[pos + 5] << 16) + (u8[pos + 6] << 8) + u8[pos + 7];
                    }
                }
                if (!/^[A-Z0-9]{3,4}$/.test(fid) || fsize <= 0 || pos + hdrLen + fsize > tagEnd) {
                    break;
                }
                var payload = u8.subarray(pos + hdrLen, pos + hdrLen + fsize);
                pos += hdrLen + fsize;

                if (fid === 'TIT2' || fid === 'TT2') {
                    var t = leerTextoFrameID3(payload.subarray(1), payload[0]);
                    if (t) result.titulo = t;
                } else if (fid === 'TPE1' || fid === 'TP1') {
                    var a = leerTextoFrameID3(payload.subarray(1), payload[0]);
                    if (a) result.artista = a;
                } else if (fid === 'TALB' || fid === 'TAL') {
                    var al = leerTextoFrameID3(payload.subarray(1), payload[0]);
                    if (al) result.album = al;
                } else if ((fid === 'APIC' || fid === 'PIC') && !result.artBlob && payload.length > 8) {
                    var enc = payload[0];
                    var p = 1;
                    var mime = 'image/jpeg';
                    if (fid === 'APIC') {
                        var mimeEnd = p;
                        while (mimeEnd < payload.length && payload[mimeEnd] !== 0) mimeEnd++;
                        var rawMime = '';
                        for (var m = p; m < mimeEnd; m++) rawMime += String.fromCharCode(payload[m]);
                        if (rawMime && rawMime.indexOf('/') !== -1) mime = rawMime;
                        p = mimeEnd + 1;
                    } else {
                        var fmt = String.fromCharCode(payload[p], payload[p + 1], payload[p + 2]).toUpperCase();
                        mime = (fmt === 'PNG') ? 'image/png' : 'image/jpeg';
                        p += 3;
                    }
                    p += 1; // picture type byte
                    if (enc === 1 || enc === 2) {
                        while (p + 1 < payload.length && !(payload[p] === 0 && payload[p + 1] === 0)) p += 2;
                        p += 2;
                    } else {
                        while (p < payload.length && payload[p] !== 0) p++;
                        p += 1;
                    }
                    if (p < payload.length) {
                        var imgSlice = payload.subarray(p);
                        if (imgSlice.length > 64) {
                            result.artBlob = new Blob([imgSlice], { type: mime });
                        }
                    }
                }
            }
            return result;
        }).catch(function() {
            return {};
        });
    }

    // ----------------------------------------------------------------------
    // 1. INICIALIZACIÓN DE INDEXEDDB (RESPALDO WEB/PC Y TRANSFERENCIAS)
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

    function cargarCancionesDesdeIDB() {
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
                        var archivoNom = val.archivo || val.nombre || '';
                        var sig = val.sig || generarFirmaCancion(archivoNom, val.tamano);
                        if (val.artBlob) {
                            try {
                                if (!state.artworkCache[val.id]) {
                                    state.artworkCache[val.id] = URL.createObjectURL(val.artBlob);
                                }
                            } catch (artErr) {}
                        }
                        lista.push({
                            id: val.id,
                            sig: sig,
                            origen: 'idb',
                            nombre: val.nombre,
                            artista: val.artista || '',
                            album: val.album || '',
                            carpeta: val.carpeta || 'Principal',
                            tamano: val.tamano,
                            tipo: val.tipo,
                            fecha: val.fecha,
                            archivo: archivoNom,
                            tienePortada: !!val.artBlob
                        });
                        cursor.continue();
                    } else {
                        lista.sort(function(a, b) { return (b.fecha || 0) - (a.fecha || 0); });
                        resolve(lista);
                    }
                };
                req.onerror = function(e) {
                    reject(e.target.error);
                };
            });
        }).catch(function() {
            return [];
        });
    }

    function cargarCancionesDesdeMediaStore() {
        var plugin = obtenerPluginMonarcaMedia();
        if (!plugin || typeof plugin.estadoPermisoAudio !== 'function' || typeof plugin.escanearMusica !== 'function') {
            return Promise.resolve({ nativoDisponible: false, granted: false, canciones: [] });
        }
        return plugin.estadoPermisoAudio().then(function(perm) {
            state.mediaPermisoChecked = true;
            state.mediaPermiso = perm && perm.granted ? 'granted' : ((perm && perm.state) || 'prompt');
            if (!perm || !perm.granted) {
                return { nativoDisponible: true, granted: false, state: state.mediaPermiso, canciones: [] };
            }
            return plugin.escanearMusica().then(function(scan) {
                var rawList = (scan && Array.isArray(scan.canciones)) ? scan.canciones : [];
                var canciones = rawList.map(function(m) {
                    return {
                        id: String(m.id || ('ms_' + m.mediaId)),
                        mediaId: m.mediaId,
                        sig: m.sig || generarFirmaCancion(m.archivo || m.nombre, m.tamano),
                        origen: 'mediastore',
                        nombre: m.nombre || 'Sin título',
                        artista: m.artista || '',
                        album: m.album || '',
                        albumId: m.albumId || 0,
                        carpeta: m.carpeta || 'Principal',
                        tamano: Number(m.tamano) || 0,
                        duracionMs: Number(m.duracionMs) || 0,
                        tipo: m.tipo || 'audio/mpeg',
                        archivo: m.archivo || '',
                        ruta: m.ruta || '',
                        contentUri: m.contentUri || '',
                        fecha: Number(m.fecha) || Date.now()
                    };
                });
                return { nativoDisponible: true, granted: true, state: 'granted', canciones: canciones };
            });
        }).catch(function(err) {
            console.warn('[Reproductor Nativo] Error escaneando MediaStore:', err);
            return { nativoDisponible: true, granted: false, state: state.mediaPermiso, canciones: [] };
        });
    }

    function actualizarControlesFuenteBiblioteca() {
        var bannerPerm = document.getElementById('player-permiso-banner');
        var btnAjustes = document.getElementById('btn-player-abrir-ajustes');
        var btnCargarCarpeta = document.getElementById('btn-player-cargar-carpeta');
        var btnVaciar = document.getElementById('btn-player-vaciar-idb');
        var btnScope = document.getElementById('btn-player-scope-snaptube');
        var descEl = document.getElementById('player-library-origin-desc');
        var plugin = obtenerPluginMonarcaMedia();

        var hasSnap = tienePistasSnapTube();
        var idbCount = (state.canciones || []).filter(function(c) { return c && c.origen === 'idb'; }).length;

        if (btnScope) {
            if (hasSnap) {
                btnScope.style.display = 'inline-flex';
                btnScope.classList.toggle('active', !!state.soloSnapTube);
                btnScope.textContent = state.soloSnapTube ? 'Solo SnapTube ✓' : 'Todas';
            } else {
                btnScope.style.display = 'none';
            }
        }

        if (btnVaciar) {
            btnVaciar.style.display = (idbCount > 0) ? 'inline-flex' : 'none';
        }

        if (plugin) {
            if (state.mediaPermiso === 'granted') {
                if (bannerPerm) bannerPerm.style.display = 'none';
                if (btnCargarCarpeta) btnCargarCarpeta.style.display = 'none';
                if (descEl) {
                    descEl.textContent = (state.soloSnapTube && hasSnap)
                        ? 'Sincronizado automáticamente al entrar (solo SnapTube).'
                        : 'Sincronizado automáticamente al entrar con tus carpetas de música del teléfono.';
                }
            } else {
                if (bannerPerm) bannerPerm.style.display = 'flex';
                if (btnCargarCarpeta) btnCargarCarpeta.style.display = 'inline-flex';
                if (btnAjustes) {
                    btnAjustes.style.display = (state.mediaPermiso === 'denied' || state.mediaPermiso === 'prompt-with-rationale') ? 'inline-flex' : 'none';
                }
                if (descEl) {
                    descEl.textContent = 'Concede permiso de audio para detectar tus canciones de SnapTube automáticamente.';
                }
            }
        } else {
            if (bannerPerm) bannerPerm.style.display = 'none';
            if (btnCargarCarpeta) btnCargarCarpeta.style.display = 'inline-flex';
        }
    }

    function sincronizarIndiceCancionActualEnLista() {
        if (!state.cancionActual) return;
        var lista = obtenerListaReproducibleActual();
        var curId = state.cancionActual.id;
        var curSig = state.cancionActual.sig;
        var foundIdx = -1;
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].id === curId || (curSig && lista[i].sig === curSig)) {
                foundIdx = i;
                break;
            }
        }
        state.indiceActual = foundIdx;
    }

    // ----------------------------------------------------------------------
    // 2. OPERACIONES DE BIBLIOTECA (MEDIASTORE + INDEXEDDB SIN DUPLICADOS)
    // ----------------------------------------------------------------------
    function cargarMetadatosCanciones() {
        var prom = Promise.all([cargarCancionesDesdeMediaStore(), cargarCancionesDesdeIDB()]).then(function(pair) {
            var nativo = pair[0] || { nativoDisponible: false, granted: false, canciones: [] };
            var idbList = Array.isArray(pair[1]) ? pair[1] : [];

            state.nativoActivo = !!(nativo.nativoDisponible && nativo.granted);
            var combinadas = [];
            var sigVistas = {};

            if (nativo.granted && Array.isArray(nativo.canciones)) {
                nativo.canciones.forEach(function(item) {
                    combinadas.push(item);
                    if (item.sig) sigVistas[item.sig] = true;
                });
            }

            idbList.forEach(function(item) {
                if (item.sig && sigVistas[item.sig]) return;
                combinadas.push(item);
            });

            state.canciones = combinadas;
            state._dbReady = true;
            state._lastAutoScanTs = Date.now();
            cargarPlaylistsStorage();
            reconciliarPlaylistsConCanciones();
            evaluarNuevasCancionesParaTriage();
            sincronizarIndiceCancionActualEnLista();
            notificarCambioPlaylistsYDefault();
            actualizarControlesFuenteBiblioteca();
            return combinadas;
        });
        state._dbReadyPromise = prom;
        return prom;
    }

    function solicitarPermisoYScanNativo() {
        var plugin = obtenerPluginMonarcaMedia();
        if (!plugin || typeof plugin.solicitarPermisoAudio !== 'function') return Promise.resolve(false);
        return plugin.solicitarPermisoAudio().then(function(res) {
            state.mediaPermisoChecked = true;
            state.mediaPermiso = (res && res.granted) ? 'granted' : 'denied';
            return cargarMetadatosCanciones().then(function() {
                state._initialScanDone = true;
                renderizarContenidoSegunSubtab();
                actualizarUIPlayerCompleto();
                if (res && res.granted) {
                    var visCount = obtenerCancionesActivasScope().length;
                    notificarPlayerToast('Se detectaron ' + visCount + ' canciones listas', '🎧');
                    if (window.VISTA_ACTUAL === 'vista-reproductor') {
                        intentarAbrirModalNuevaMusica();
                    }
                }
                return !!(res && res.granted);
            });
        }).catch(function(e) {
            console.warn('[Reproductor Permiso]', e);
            return false;
        });
    }

    function reescanearBibliotecaNativa(modoToast) {
        if (state._scanInFlight) {
            state._scanRescanQueued = true;
            return state._scanInFlight;
        }

        var prom = cargarMetadatosCanciones().then(function(list) {
            state._initialScanDone = true;
            renderizarContenidoSegunSubtab();
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            actualizarBarraAudioRutina();

            if (modoToast === 'nuevas' && window.VISTA_ACTUAL === 'vista-reproductor' && state._triageCola.length > 0) {
                intentarAbrirModalNuevaMusica();
            } else if (modoToast === true) {
                var visCount = obtenerCancionesActivasScope().length;
                notificarPlayerToast('Biblioteca actualizada: ' + visCount + ' pistas', '🎵');
                if (window.VISTA_ACTUAL === 'vista-reproductor' && state._triageCola.length > 0) {
                    intentarAbrirModalNuevaMusica();
                }
            }
            return list;
        }).finally(function() {
            state._scanInFlight = null;
            if (state._scanRescanQueued) {
                state._scanRescanQueued = false;
                reescanearBibliotecaNativa('nuevas');
            }
        });

        state._scanInFlight = prom;
        return prom;
    }

    function sincronizarBibliotecaAlEntrar() {
        renderizarContenidoSegunSubtab();
        actualizarUIPlayerCompleto();
        return reescanearBibliotecaNativa('nuevas').then(function(list) {
            if (window.VISTA_ACTUAL === 'vista-reproductor') {
                intentarAbrirModalNuevaMusica();
            }
            return list;
        });
    }

    function abrirAjustesAudioNativo() {
        var plugin = obtenerPluginMonarcaMedia();
        if (plugin && typeof plugin.abrirAjustesPermiso === 'function') {
            plugin.abrirAjustesPermiso().catch(function() {});
        }
    }

    function prepararUrlReproduccion(meta) {
        if (!meta) return Promise.reject(new Error('Sin pista'));
        if (meta.origen === 'mediastore') {
            var plugin = obtenerPluginMonarcaMedia();
            if (plugin && typeof plugin.prepararAudioReproduccion === 'function') {
                return plugin.prepararAudioReproduccion({
                    ruta: meta.ruta || '',
                    contentUri: meta.contentUri || '',
                    archivo: meta.archivo || 'track.mp3'
                }).then(function(res) {
                    var url = convertirArchivoAWebUrl(res && res.filePath ? res.filePath : meta.ruta);
                    if (!url) throw new Error('Ruta nativa vacía');
                    return { src: url, esBlobUrl: false, esNativo: true };
                });
            }
            if (meta.ruta) {
                return Promise.resolve({ src: convertirArchivoAWebUrl(meta.ruta), esBlobUrl: false, esNativo: true });
            }
            return Promise.reject(new Error('Plugin nativo no disponible'));
        }

        return abrirDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction([STORE_NAME], 'readonly');
                var store = tx.objectStore(STORE_NAME);
                var req = store.get(meta.id);
                req.onsuccess = function() { resolve(req.result); };
                req.onerror = function(e) { reject(e.target.error); };
            });
        }).then(function(item) {
            if (!item || !item.blob) throw new Error('Archivo no encontrado en IndexedDB');
            return { src: URL.createObjectURL(item.blob), esBlobUrl: true, esNativo: false, item: item };
        });
    }

    function obtenerCancionCompleta(id) {
        var meta = state.canciones.find(function(c) { return c.id === id; });
        if (meta && meta.origen === 'mediastore') {
            return prepararUrlReproduccion(meta).then(function(prep) {
                return fetch(prep.src).then(function(res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.blob();
                }).then(function(blob) {
                    return { id: meta.id, nombre: meta.nombre, artista: meta.artista, blob: blob };
                });
            });
        }
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

        var archivosAudio = [];
        for (var i = 0; i < fileList.length; i++) {
            var f = fileList[i];
            if (f && (f.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(f.name || ''))) {
                archivosAudio.push(f);
            }
        }
        if (archivosAudio.length === 0) return Promise.resolve();

        // Leer tags ID3v2 (título, artista, portada) antes de abrir transacción IDB
        return Promise.all(archivosAudio.map(function(file, idx) {
            return extraerTagsID3v2File(file).then(function(tags) {
                var dotIdx = file.name.lastIndexOf('.');
                var cleanName = (dotIdx > 0) ? file.name.substring(0, dotIdx) : file.name;
                var folder = carpetaForzada || 'Principal';
                if (file.webkitRelativePath) {
                    var parts = file.webkitRelativePath.split('/');
                    if (parts.length > 1) {
                        folder = parts[parts.length - 2] || 'Principal';
                    }
                }
                return {
                    id: 'song_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5),
                    sig: generarFirmaCancion(cleanName, file.size),
                    nombre: (tags && tags.titulo) ? tags.titulo : cleanName,
                    artista: (tags && tags.artista) ? tags.artista : '',
                    album: (tags && tags.album) ? tags.album : '',
                    archivo: file.name,
                    carpeta: folder,
                    tamano: file.size,
                    tipo: file.type || 'audio/mpeg',
                    fecha: Date.now() + idx,
                    blob: file,
                    artBlob: (tags && tags.artBlob) ? tags.artBlob : null
                };
            });
        })).then(function(registros) {
            return abrirDB().then(function(db) {
                return new Promise(function(resolve, reject) {
                    var tx = db.transaction([STORE_NAME], 'readwrite');
                    var store = tx.objectStore(STORE_NAME);
                    registros.forEach(function(r) { store.add(r); });
                    tx.oncomplete = function() { resolve(); };
                    tx.onerror = function(err) { reject(err); };
                });
            }).then(function() {
                return cargarMetadatosCanciones();
            });
        });
    }

    function guardarBlobDirecto(nombre, blob, carpeta) {
        return extraerTagsID3v2File(blob).then(function(tags) {
            return abrirDB().then(function(db) {
                return new Promise(function(resolve, reject) {
                    var tx = db.transaction([STORE_NAME], 'readwrite');
                    var store = tx.objectStore(STORE_NAME);
                    var cancionObj = {
                        id: 'song_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        sig: generarFirmaCancion(nombre, blob.size),
                        nombre: (tags && tags.titulo) ? tags.titulo : nombre,
                        artista: (tags && tags.artista) ? tags.artista : '',
                        album: (tags && tags.album) ? tags.album : '',
                        archivo: nombre + '.mp3',
                        carpeta: carpeta || 'Descargas PC',
                        tamano: blob.size,
                        tipo: blob.type || 'audio/mpeg',
                        fecha: Date.now(),
                        blob: blob,
                        artBlob: (tags && tags.artBlob) ? tags.artBlob : null
                    };
                    var req = store.add(cancionObj);
                    req.onsuccess = function() { resolve(); };
                    req.onerror = function(e) { reject(e); };
                }).then(function() {
                    return cargarMetadatosCanciones();
                });
            });
        });
    }

    function eliminarCancion(id) {
        var target = state.canciones.find(function(c) { return c.id === id; });
        if (target && target.origen === 'mediastore') {
            notificarPlayerToast('Las pistas de tu teléfono solo se leen sin modificarse', '🔒');
            return Promise.resolve();
        }
        if (!confirm('¿Eliminar esta canción de la biblioteca local?')) return Promise.resolve();

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
            state.playlists.forEach(function(pl) {
                pl.cancionIds = (pl.cancionIds || []).filter(function(cid) { return cid !== id; });
                if (Array.isArray(pl.cancionSigs)) {
                    pl.cancionSigs = pl.cancionSigs.filter(function(s) { return s && s.id !== id; });
                }
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
        var msg = state.nativoActivo
            ? '¿Vaciar únicamente los archivos importados manualmente a caché (tus MP3 reales del teléfono NO se borrarán)?'
            : '¿Estás seguro de que deseas vaciar toda la biblioteca de música cargada manualmente? Esta acción no se puede deshacer.';
        if (!confirm(msg)) return;

        detenerMusicaDeRutina(true, { inmediato: true, restaurarPrevia: false });
        abrirDB().then(function(db) {
            var tx = db.transaction([STORE_NAME], 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = function() {
                if (!state.nativoActivo) {
                    state.canciones = [];
                    state.playlists = [];
                    guardarPlaylistsStorage();
                    setPlaylistDefaultRutina(null, true);
                }
                state.indiceActual = -1;
                state.cancionActual = null;
                cargarMetadatosCanciones().then(function() {
                    notificarCambioPlaylistsYDefault();
                    renderizarContenidoSegunSubtab();
                    actualizarUIPlayerCompleto();
                    actualizarMiniPlayer();
                    actualizarBarraAudioRutina();
                });
            };
        });
    }

    // Motor perezoso (Lazy) de Portadas / Carátulas sin bloquear el hilo principal
    function resolverCaratulaCancion(meta, includeDataUrl) {
        if (!meta || !meta.id) return Promise.resolve(null);
        var cached = state.artworkCache[meta.id];
        if (cached === 'none' && !includeDataUrl) return Promise.resolve(null);
        if (cached && cached !== 'none' && (!includeDataUrl || state.artworkDataUrlCache[meta.id])) {
            return Promise.resolve({
                url: cached,
                dataUrl: state.artworkDataUrlCache[meta.id] || null
            });
        }

        if (meta.origen === 'idb') {
            return abrirDB().then(function(db) {
                return new Promise(function(resolve) {
                    var tx = db.transaction([STORE_NAME], 'readonly');
                    var req = tx.objectStore(STORE_NAME).get(meta.id);
                    req.onsuccess = function() {
                        var rec = req.result;
                        if (rec && rec.artBlob) {
                            var objUrl = state.artworkCache[meta.id] && state.artworkCache[meta.id] !== 'none'
                                ? state.artworkCache[meta.id]
                                : URL.createObjectURL(rec.artBlob);
                            state.artworkCache[meta.id] = objUrl;
                            if (!includeDataUrl) {
                                resolve({ url: objUrl, dataUrl: null });
                                return;
                            }
                            var fr = new FileReader();
                            fr.onloadend = function() {
                                state.artworkDataUrlCache[meta.id] = fr.result || '';
                                resolve({ url: objUrl, dataUrl: state.artworkDataUrlCache[meta.id] });
                            };
                            fr.onerror = function() { resolve({ url: objUrl, dataUrl: null }); };
                            fr.readAsDataURL(rec.artBlob);
                        } else {
                            state.artworkCache[meta.id] = 'none';
                            resolve(null);
                        }
                    };
                    req.onerror = function() { resolve(null); };
                });
            }).catch(function() { return null; });
        }

        var plugin = obtenerPluginMonarcaMedia();
        if (!plugin || typeof plugin.obtenerCaratula !== 'function') {
            state.artworkCache[meta.id] = 'none';
            return Promise.resolve(null);
        }

        return plugin.obtenerCaratula({
            sig: meta.sig || '',
            mediaId: String(meta.mediaId || meta.id || ''),
            contentUri: meta.contentUri || '',
            ruta: meta.ruta || '',
            albumId: Number(meta.albumId) || 0,
            includeDataUrl: !!includeDataUrl
        }).then(function(res) {
            if (res && res.hasArt && res.filePath) {
                var url = convertirArchivoAWebUrl(res.filePath);
                state.artworkCache[meta.id] = url;
                if (res.dataUrl) {
                    state.artworkDataUrlCache[meta.id] = res.dataUrl;
                }
                return { url: url, dataUrl: res.dataUrl || state.artworkDataUrlCache[meta.id] || null };
            }
            state.artworkCache[meta.id] = 'none';
            return null;
        }).catch(function() {
            return null;
        });
    }

    function aplicarCaratulaEnElementosDOM(songId, url) {
        if (!songId || !url) return;
        var imgs = document.querySelectorAll('img[data-art-song="' + songId + '"]');
        imgs.forEach(function(img) {
            if (img.getAttribute('src') !== url) {
                img.setAttribute('src', url);
            }
            img.style.display = 'block';
            var box = img.parentElement;
            if (box) {
                var ph = box.querySelector('.song-thumb-placeholder');
                if (ph) ph.style.display = 'none';
            }
        });
        if (state.cancionActual && state.cancionActual.id === songId) {
            actualizarHeroCaratula(url);
            actualizarMiniCaratula(url);
        }
    }

    function procesarColaCaratulas() {
        while (state._artInflight < 4 && state._artQueue.length > 0) {
            var meta = state._artQueue.shift();
            if (!meta || !meta.id) continue;
            state._artInflight++;
            (function(targetMeta) {
                resolverCaratulaCancion(targetMeta, false).then(function(res) {
                    if (res && res.url) {
                        aplicarCaratulaEnElementosDOM(targetMeta.id, res.url);
                    }
                }).finally(function() {
                    delete state._artQueuedIds[targetMeta.id];
                    state._artInflight = Math.max(0, state._artInflight - 1);
                    procesarColaCaratulas();
                });
            })(meta);
        }
    }

    function encolarCaratulaLazy(meta) {
        if (!meta || !meta.id) return;
        var cached = state.artworkCache[meta.id];
        if (cached === 'none') return;
        if (cached) {
            aplicarCaratulaEnElementosDOM(meta.id, cached);
            return;
        }
        if (state._artQueuedIds[meta.id]) return;
        state._artQueuedIds[meta.id] = true;
        state._artQueue.push(meta);
        procesarColaCaratulas();
    }

    function observarMiniaturasLista() {
        var cont = document.getElementById('reproductor-lista-canciones');
        if (!cont) return;
        var items = cont.querySelectorAll('.song-list-item[data-song-id]');
        if (items.length === 0) return;

        // Cargar inmediatas las primeras 12 visibles + IntersectionObserver para el resto
        if ('IntersectionObserver' in window) {
            if (state._artObserver) {
                try { state._artObserver.disconnect(); } catch (e) {}
            }
            state._artObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting) return;
                    var sid = entry.target.getAttribute('data-song-id');
                    var found = state.canciones.find(function(c) { return c.id === sid; });
                    if (found) encolarCaratulaLazy(found);
                    if (state._artObserver) state._artObserver.unobserve(entry.target);
                });
            }, { rootMargin: '120px 0px' });

            items.forEach(function(el, idx) {
                if (idx < 10) {
                    var sid = el.getAttribute('data-song-id');
                    var found = state.canciones.find(function(c) { return c.id === sid; });
                    if (found) encolarCaratulaLazy(found);
                } else {
                    state._artObserver.observe(el);
                }
            });
        } else {
            items.forEach(function(el, idx) {
                if (idx >= 24) return;
                var sid = el.getAttribute('data-song-id');
                var found = state.canciones.find(function(c) { return c.id === sid; });
                if (found) encolarCaratulaLazy(found);
            });
        }
    }

    function aplicarAmbientDesdeImagen() {
        var hero = document.getElementById('player-hero-card');
        if (!hero) return;
        hero.style.removeProperty('--player-accent-rgb');
    }

    function actualizarHeroCaratula(url) {
        var hero = document.getElementById('player-hero-card');
        var img = document.getElementById('player-artwork-img');
        var fallback = document.getElementById('player-vinyl-fallback');
        if (!img || !fallback) return;

        if (url) {
            img.onload = function() {
                aplicarAmbientDesdeImagen(img);
            };
            img.onerror = function() {
                img.style.display = 'none';
                fallback.style.display = 'block';
                if (hero) {
                    hero.classList.remove('has-cover-art');
                    hero.style.removeProperty('--player-accent-rgb');
                }
            };
            if (img.getAttribute('src') !== url) {
                img.setAttribute('src', url);
            }
            img.style.display = 'block';
            fallback.style.display = 'none';
            if (hero) hero.classList.add('has-cover-art');
        } else {
            img.style.display = 'none';
            img.removeAttribute('src');
            fallback.style.display = 'block';
            if (hero) {
                hero.classList.remove('has-cover-art');
                hero.style.removeProperty('--player-accent-rgb');
            }
        }
    }

    function actualizarMiniCaratula(url) {
        var img = document.getElementById('mini-player-thumb-img');
        var glyph = document.getElementById('mini-player-disc-glyph');
        var box = document.getElementById('mini-player-disc-icon');
        if (!img || !glyph) return;
        if (url) {
            img.setAttribute('src', url);
            img.style.display = 'block';
            glyph.style.display = 'none';
            if (box) box.classList.add('has-art');
        } else {
            img.style.display = 'none';
            img.removeAttribute('src');
            glyph.style.display = 'inline';
            if (box) box.classList.remove('has-art');
        }
    }

    // ----------------------------------------------------------------------
    // 3. PLAYLISTS (LISTAS DE REPRODUCCIÓN) Y PLAYLIST POR DEFECTO EN RUTINAS
    // ----------------------------------------------------------------------
    function notificarCambioPlaylistsYDefault() {
        try {
            if (typeof window.actualizarSelectoresPlaylistRutinas === 'function') {
                window.actualizarSelectoresPlaylistRutinas();
            }
            if (typeof window.renderizarRuletaSemanal === 'function') {
                window.renderizarRuletaSemanal();
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

    function construirFirmasParaIds(cancionIds) {
        var map = {};
        state.canciones.forEach(function(c) { map[c.id] = c; });
        var sigs = [];
        (cancionIds || []).forEach(function(id) {
            var c = map[id];
            if (c) {
                sigs.push({
                    id: c.id,
                    sig: c.sig || generarFirmaCancion(c.archivo || c.nombre, c.tamano),
                    nombre: c.nombre || '',
                    archivo: c.archivo || '',
                    tamano: Number(c.tamano) || 0
                });
            }
        });
        return sigs;
    }

    function reconciliarPlaylistsConCanciones() {
        if (!Array.isArray(state.playlists) || state.playlists.length === 0 || !Array.isArray(state.canciones) || state.canciones.length === 0) {
            return false;
        }
        var byId = {};
        var bySig = {};
        var byFile = {};
        state.canciones.forEach(function(c) {
            byId[c.id] = c;
            if (c.sig) bySig[c.sig] = c;
            if (c.archivo && c.tamano) {
                byFile[String(c.archivo).toLowerCase() + '__' + c.tamano] = c;
            }
        });

        var huboCambios = false;
        state.playlists.forEach(function(pl) {
            if (!pl) return;
            var ids = Array.isArray(pl.cancionIds) ? pl.cancionIds : [];
            var sigs = Array.isArray(pl.cancionSigs) ? pl.cancionSigs : [];
            var sigMap = {};
            sigs.forEach(function(s) {
                if (s && s.id) sigMap[s.id] = s;
            });

            var nuevosIds = [];
            var vistos = {};
            var listaOrden = sigs.length >= ids.length ? sigs.map(function(s) { return s.id; }) : ids;
            ids.forEach(function(id) { if (listaOrden.indexOf(id) === -1) listaOrden.push(id); });

            listaOrden.forEach(function(rawId) {
                var matched = byId[rawId] || null;
                var info = sigMap[rawId];
                if (!matched && info) {
                    if (info.sig && bySig[info.sig]) matched = bySig[info.sig];
                    else if (info.archivo && info.tamano && byFile[String(info.archivo).toLowerCase() + '__' + info.tamano]) {
                        matched = byFile[String(info.archivo).toLowerCase() + '__' + info.tamano];
                    } else if (info.nombre && info.tamano) {
                        var fbSig = generarFirmaCancion(info.nombre, info.tamano);
                        if (bySig[fbSig]) matched = bySig[fbSig];
                    }
                }
                if (matched) {
                    if (!vistos[matched.id]) {
                        vistos[matched.id] = true;
                        nuevosIds.push(matched.id);
                    }
                    if (matched.id !== rawId) huboCambios = true;
                } else {
                    // Conservar temporalmente para no perder referencias si el medio aún no cargó
                    if (!vistos[rawId]) {
                        vistos[rawId] = true;
                        nuevosIds.push(rawId);
                    }
                }
            });

            pl.cancionIds = nuevosIds;
            if (nuevosIds.length > 0 && state.canciones.length > 0) {
                var actSigs = construirFirmasParaIds(nuevosIds);
                if (actSigs.length > 0) {
                    // Conservar firmas antiguas que no estén aún montadas en esta sesión
                    var presentes = {};
                    actSigs.forEach(function(s) { presentes[s.id] = true; });
                    sigs.forEach(function(oldS) {
                        if (oldS && oldS.id && !presentes[oldS.id] && nuevosIds.indexOf(oldS.id) !== -1) {
                            actSigs.push(oldS);
                        }
                    });
                    pl.cancionSigs = actSigs;
                }
            }
        });

        if (huboCambios) {
            try { localStorage.setItem('monarca_musica_playlists', JSON.stringify(state.playlists)); } catch (e) {}
        }
        return huboCambios;
    }

    function cargarPlaylistsStorage() {
        var locales = [];
        try {
            var raw = localStorage.getItem('monarca_musica_playlists');
            locales = raw ? JSON.parse(raw) : [];
        } catch(e) {
            locales = [];
        }
        if (!Array.isArray(locales)) locales = [];

        var appPls = (typeof window.APP_STATE !== 'undefined' && window.APP_STATE && Array.isArray(window.APP_STATE.reproductorPlaylists))
            ? window.APP_STATE.reproductorPlaylists
            : [];
        var elimSet = {};
        if (typeof window.APP_STATE !== 'undefined' && window.APP_STATE && window.APP_STATE._eliminados && Array.isArray(window.APP_STATE._eliminados.reproductorPlaylists)) {
            window.APP_STATE._eliminados.reproductorPlaylists.forEach(function(tid) { elimSet[tid] = true; });
        }

        // Fusionar locales y APP_STATE conservando la versión más reciente
        var mapa = {};
        locales.concat(appPls).forEach(function(p) {
            if (!p || !p.id || elimSet[p.id]) return;
            var prev = mapa[p.id];
            var tsNew = Number(p.fechaActualizacion || p.fecha) || 0;
            var tsPrev = prev ? (Number(prev.fechaActualizacion || prev.fecha) || 0) : -1;
            if (!prev || tsNew >= tsPrev) {
                mapa[p.id] = JSON.parse(JSON.stringify(p));
            }
        });
        state.playlists = Object.keys(mapa).map(function(k) { return mapa[k]; });
        cargarDefaultPlaylistRutinaStorage();
    }

    function guardarPlaylistsStorage(omitirCloud) {
        state.playlists.forEach(function(pl) {
            if (!pl) return;
            if (!pl.fechaActualizacion) pl.fechaActualizacion = Date.now();
            var ids = Array.isArray(pl.cancionIds) ? pl.cancionIds : [];
            var sigsNuevas = construirFirmasParaIds(ids);
            var prevById = {};
            (pl.cancionSigs || []).forEach(function(s) { if (s && s.id) prevById[s.id] = s; });
            var mapPresent = {};
            sigsNuevas.forEach(function(s) { mapPresent[s.id] = true; });
            ids.forEach(function(id) {
                if (!mapPresent[id] && prevById[id]) sigsNuevas.push(prevById[id]);
            });
            pl.cancionSigs = sigsNuevas;
        });

        try {
            localStorage.setItem('monarca_musica_playlists', JSON.stringify(state.playlists));
        } catch(e) {}

        if (!omitirCloud && typeof window.APP_STATE !== 'undefined' && window.APP_STATE) {
            try {
                window.APP_STATE.reproductorPlaylists = JSON.parse(JSON.stringify(state.playlists));
                if (typeof window.MonarcaDB !== 'undefined' && typeof window.MonarcaDB.save === 'function') {
                    window.MonarcaDB.save(window.APP_STATE);
                }
            } catch (e) {}
        }
        notificarCambioPlaylistsYDefault();
    }

    function sincronizarPlaylistsDesdeAppState() {
        cargarPlaylistsStorage();
        cargarPlayStatsStorage();
        reconciliarPlaylistsConCanciones();
        notificarCambioPlaylistsYDefault();
        renderizarContenidoSegunSubtab();
        actualizarBarraAudioRutina();
    }

    // ----------------------------------------------------------------------
    // 3.5 HISTORIAL DE REPRODUCCIONES, TOP MÁS ESCUCHADAS Y MODO INTELIGENTE
    // ----------------------------------------------------------------------
    function _claveStatPrimaria(meta) {
        if (!meta) return '';
        if (meta.sig) return 'sig:' + String(meta.sig);
        if (meta.archivo && meta.tamano) {
            return 'file:' + String(meta.archivo).toLowerCase() + '__' + (Number(meta.tamano) || 0);
        }
        if (meta.id) return 'id:' + String(meta.id);
        return '';
    }

    function _clavesStatCandidatas(meta) {
        var keys = [];
        if (!meta) return keys;
        if (meta.sig) keys.push('sig:' + String(meta.sig));
        if (meta.archivo && meta.tamano) {
            keys.push('file:' + String(meta.archivo).toLowerCase() + '__' + (Number(meta.tamano) || 0));
        }
        if (meta.id) keys.push('id:' + String(meta.id));
        return keys;
    }

    function cargarPlayStatsStorage() {
        var merged = {};
        function mergeMap(src) {
            if (!src || typeof src !== 'object') return;
            Object.keys(src).forEach(function(k) {
                var s = src[k];
                if (!s || typeof s !== 'object') return;
                var prev = merged[k];
                if (!prev) {
                    merged[k] = {
                        key: s.key || k,
                        sig: s.sig || '',
                        id: s.id || '',
                        nombre: s.nombre || '',
                        artista: s.artista || '',
                        count: Number(s.count) || 0,
                        lastPlayedAt: Number(s.lastPlayedAt) || 0,
                        firstPlayedAt: Number(s.firstPlayedAt) || 0
                    };
                } else {
                    prev.count = Math.max(prev.count, Number(s.count) || 0);
                    prev.lastPlayedAt = Math.max(prev.lastPlayedAt, Number(s.lastPlayedAt) || 0);
                    if (s.firstPlayedAt && (!prev.firstPlayedAt || s.firstPlayedAt < prev.firstPlayedAt)) {
                        prev.firstPlayedAt = Number(s.firstPlayedAt);
                    }
                    if (!prev.nombre && s.nombre) prev.nombre = s.nombre;
                    if (!prev.artista && s.artista) prev.artista = s.artista;
                    if (!prev.sig && s.sig) prev.sig = s.sig;
                    if (!prev.id && s.id) prev.id = s.id;
                }
            });
        }
        try {
            var raw = localStorage.getItem(PLAY_STATS_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    mergeMap(parsed.tracks || parsed);
                }
            }
        } catch (e) {}
        if (typeof window.APP_STATE !== 'undefined' && window.APP_STATE && window.APP_STATE.reproductorPlayStats) {
            mergeMap(window.APP_STATE.reproductorPlayStats);
        }
        state.playStats = merged;
        return state.playStats;
    }

    function guardarPlayStatsStorage(omitirCloud) {
        try {
            localStorage.setItem(PLAY_STATS_KEY, JSON.stringify({
                updatedAt: Date.now(),
                tracks: state.playStats
            }));
        } catch (e) {}

        if (!omitirCloud && typeof window.APP_STATE !== 'undefined' && window.APP_STATE) {
            try {
                window.APP_STATE.reproductorPlayStats = JSON.parse(JSON.stringify(state.playStats));
                if (typeof window.MonarcaDB !== 'undefined' && typeof window.MonarcaDB.save === 'function') {
                    window.MonarcaDB.save(window.APP_STATE);
                }
            } catch (e) {}
        }
    }

    function obtenerStatCancion(meta) {
        if (!meta) return null;
        if (!state.playStats || typeof state.playStats !== 'object') state.playStats = {};
        var cand = _clavesStatCandidatas(meta);
        var encontrada = null;
        var keyHallada = '';
        for (var i = 0; i < cand.length; i++) {
            if (state.playStats[cand[i]]) {
                encontrada = state.playStats[cand[i]];
                keyHallada = cand[i];
                break;
            }
        }
        if (encontrada && cand[0] && keyHallada && keyHallada !== cand[0]) {
            state.playStats[cand[0]] = encontrada;
            encontrada.key = cand[0];
        }
        return encontrada;
    }

    function obtenerReproduccionesCancion(meta) {
        var st = obtenerStatCancion(meta);
        return st ? (Number(st.count) || 0) : 0;
    }

    function registrarReproduccionCancion(meta, omitirRender) {
        if (!meta) return 0;
        var primaryKey = _claveStatPrimaria(meta);
        if (!primaryKey) return 0;

        var prev = obtenerStatCancion(meta);
        var metaInfo = obtenerTituloLimpoYArtista(meta);
        var ahora = Date.now();
        var nuevoCount = (prev ? (Number(prev.count) || 0) : 0) + 1;

        state.playStats[primaryKey] = {
            key: primaryKey,
            sig: meta.sig || (prev && prev.sig) || '',
            id: meta.id || (prev && prev.id) || '',
            nombre: (metaInfo && metaInfo.titulo) || meta.nombre || '',
            artista: (metaInfo && metaInfo.artista && metaInfo.artista !== 'Artista desconocido') ? metaInfo.artista : (meta.artista || ''),
            count: nuevoCount,
            lastPlayedAt: ahora,
            firstPlayedAt: (prev && prev.firstPlayedAt) ? prev.firstPlayedAt : ahora
        };

        guardarPlayStatsStorage(false);
        sincronizarIndiceCancionActualEnLista();

        if (!omitirRender) {
            if (state.subtabActual === 'top' || (state.subtabActual === 'todas' && (state.playlistSeleccionada || state.modoInteligente))) {
                renderizarContenidoSegunSubtab();
            }
        }
        return nuevoCount;
    }

    function cargarModosReproductorStorage() {
        try {
            var raw = localStorage.getItem(PLAYER_MODES_KEY);
            if (!raw) return;
            var obj = JSON.parse(raw);
            if (!obj || typeof obj !== 'object') return;
            state.modoInteligente = !!obj.modoInteligente;
            state.shuffle = state.modoInteligente ? false : !!obj.shuffle;
            if (obj.repeat === 'all' || obj.repeat === 'one' || obj.repeat === 'off') {
                state.repeat = obj.repeat;
            }
        } catch (e) {}
    }

    function guardarModosReproductorStorage() {
        try {
            localStorage.setItem(PLAYER_MODES_KEY, JSON.stringify({
                shuffle: !!state.shuffle,
                modoInteligente: !!state.modoInteligente,
                repeat: state.repeat || 'all'
            }));
        } catch (e) {}
    }

    function _claveContextoActual() {
        if (state.playlistSeleccionada) return 'pl:' + state.playlistSeleccionada;
        if (state.subtabActual === 'top') return 'top';
        if (state.carpetaSeleccionada) return 'folder:' + state.carpetaSeleccionada;
        return 'all';
    }

    function compararCancionesPorTop(a, b, origIdxMap) {
        var stA = obtenerStatCancion(a);
        var stB = obtenerStatCancion(b);
        var cA = stA ? (Number(stA.count) || 0) : 0;
        var cB = stB ? (Number(stB.count) || 0) : 0;
        if (cB !== cA) return cB - cA;

        var lA = stA ? (Number(stA.lastPlayedAt) || 0) : 0;
        var lB = stB ? (Number(stB.lastPlayedAt) || 0) : 0;
        if (lB !== lA) return lB - lA;

        if (origIdxMap && a && b && a.id && b.id) {
            var iA = (typeof origIdxMap[a.id] === 'number') ? origIdxMap[a.id] : 999999;
            var iB = (typeof origIdxMap[b.id] === 'number') ? origIdxMap[b.id] : 999999;
            if (iA !== iB) return iA - iB;
        }
        return ((b && b.fecha) || 0) - ((a && a.fecha) || 0);
    }

    function ordenarListaPorTop(lista) {
        if (!Array.isArray(lista) || lista.length <= 1) return (lista || []).slice();
        var origIdxMap = {};
        lista.forEach(function(item, idx) {
            if (item && item.id) origIdxMap[item.id] = idx;
        });
        return lista.slice().sort(function(a, b) {
            return compararCancionesPorTop(a, b, origIdxMap);
        });
    }

    function obtenerTopCancionesLista(listaOpcional) {
        if (Array.isArray(listaOpcional)) {
            return ordenarListaPorTop(listaOpcional);
        }
        var activas = obtenerCancionesActivasScope();
        var escuchadas = activas.filter(function(c) {
            return obtenerReproduccionesCancion(c) > 0;
        });
        return ordenarListaPorTop(escuchadas);
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
        state._triageCrearPendiente = false;
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
        var vieneDeTriage = !!state._triageCrearPendiente;
        var ahora = Date.now();
        var initIds = pendingSong ? [pendingSong] : [];
        var nueva = {
            id: 'pl_' + ahora,
            nombre: nombre,
            fecha: ahora,
            fechaActualizacion: ahora,
            cancionIds: initIds,
            cancionSigs: construirFirmasParaIds(initIds)
        };
        state.playlists.push(nueva);
        guardarPlaylistsStorage();
        cerrarModalCrearPlaylist();
        renderizarContenidoSegunSubtab();
        notificarPlayerToast('Lista "' + nombre + '" creada' + (pendingSong ? ' y canción agregada' : ''), '🎶');

        if (vieneDeTriage && state._triageModalAbierto) {
            if (state._triageSeleccionPlIds.indexOf(nueva.id) === -1) {
                state._triageSeleccionPlIds.push(nueva.id);
            }
            renderizarModalNuevaMusica();
            return;
        }

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
            pl.fechaActualizacion = Date.now();
            guardarPlaylistsStorage();
            renderizarContenidoSegunSubtab();
            actualizarUIPlayerCompleto();
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
        if (Array.isArray(pl.cancionSigs)) {
            pl.cancionSigs = pl.cancionSigs.filter(function(s) { return s && s.id !== songId; });
        }
        if (pl.cancionIds.length !== prevLen) {
            pl.fechaActualizacion = Date.now();
            guardarPlaylistsStorage();
            renderizarContenidoSegunSubtab();
            actualizarUIPlayerCompleto();
            if (!silencioso) notificarPlayerToast('Quitada de "' + pl.nombre + '"', '➖');
            return true;
        }
        return false;
    }

    function agregarActualAPlaylist() {
        if (!state.cancionActual) return;
        abrirModalAgregarPlaylist(state.cancionActual.id);
    }

    function reproducirPlaylistDirecto(plId) {
        var pl = state.playlists.find(function(p) { return p.id === plId; });
        if (!pl) return;
        if (!pl.cancionIds || pl.cancionIds.length === 0) {
            notificarPlayerToast('La lista "' + pl.nombre + '" está vacía. Añade canciones primero.', '🎶');
            abrirModalAgregarCancionesAPlaylist(plId);
            return;
        }
        state._smartVisitedIds = state._smartVisitedIds || {};
        delete state._smartVisitedIds['pl:' + plId];
        seleccionarPlaylist(plId);
        var lista = obtenerListaReproducibleActual();
        if (lista.length > 0) {
            reproducirIndice(0);
        } else {
            notificarPlayerToast('No se encontraron pistas disponibles para esta lista', '🎵');
        }
    }

    function reproducirPlaylistInteligente(plId) {
        var pl = state.playlists.find(function(p) { return p.id === plId; });
        if (!pl) return;
        if (!pl.cancionIds || pl.cancionIds.length === 0) {
            notificarPlayerToast('La lista "' + pl.nombre + '" está vacía. Añade canciones primero.', '🎶');
            abrirModalAgregarCancionesAPlaylist(plId);
            return;
        }
        state.modoInteligente = true;
        state.shuffle = false;
        state._smartVisitedIds = state._smartVisitedIds || {};
        delete state._smartVisitedIds['pl:' + plId];
        guardarModosReproductorStorage();
        seleccionarPlaylist(plId);
        actualizarControlesModo();
        var lista = obtenerListaReproducibleActual();
        if (lista.length > 0) {
            reproducirIndice(0);
            notificarPlayerToast('Modo Inteligente: reproduciendo Top de "' + pl.nombre + '"', '✨');
        } else {
            notificarPlayerToast('No se encontraron pistas disponibles para esta lista', '🎵');
        }
    }

    function reproducirTopCanciones(songId) {
        var topLista = obtenerTopCancionesLista();
        if (topLista.length === 0) {
            notificarPlayerToast('Aún no hay canciones reproducidas para tu Top', '🏆');
            return;
        }
        if (state.subtabActual !== 'top') {
            cambiarSubtab('top');
        }
        if (songId) {
            reproducirPorId(songId);
            return;
        }
        reproducirIndice(0);
    }

    function eliminarPlaylist(plId) {
        if (!confirm('¿Eliminar esta lista de reproducción? Las canciones se mantendrán en tu dispositivo.')) return;
        state.playlists = state.playlists.filter(function(p) { return p.id !== plId; });
        if (typeof window.registrarTombstone === 'function') {
            window.registrarTombstone('reproductorPlaylists', plId);
        }
        if (state.rutinaDefaultPlaylistId === plId) {
            setPlaylistDefaultRutina(null, false);
        }
        if (state.rutinaModoActivo && state.rutinaPlaylistActivaId === plId) {
            detenerMusicaDeRutina();
        }
        guardarPlaylistsStorage();
        if (state.playlistSeleccionada === plId) state.playlistSeleccionada = null;
        renderizarContenidoSegunSubtab();
        actualizarUIPlayerCompleto();
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

    function clampVol01(v) {
        var num = Number(v);
        if (isNaN(num)) return 1;
        if (num < 0) return 0;
        if (num > 1) return 1;
        return num;
    }

    function cancelarFadeAudio() {
        state._fadeToken++;
        if (state._fadeIntervalId) {
            clearInterval(state._fadeIntervalId);
            state._fadeIntervalId = null;
        }
    }

    function hacerFadeVolumenAudio(desdeVol, hastaVol, duracionMs, onDone) {
        cancelarFadeAudio();
        var token = state._fadeToken;
        var start = clampVol01(desdeVol);
        var target = clampVol01(hastaVol);

        if (state.audio) {
            state.audio.volume = start;
        }

        if (!state.audio || !duracionMs || duracionMs <= 0 || Math.abs(target - start) < 0.004) {
            if (state.audio) state.audio.volume = target;
            if (typeof onDone === 'function') onDone(true);
            return;
        }

        var t0 = Date.now();
        state._fadeIntervalId = setInterval(function() {
            if (token !== state._fadeToken || !state.audio) {
                if (state._fadeIntervalId) {
                    clearInterval(state._fadeIntervalId);
                    state._fadeIntervalId = null;
                }
                return;
            }
            var elapsed = Date.now() - t0;
            var progreso = Math.min(1, elapsed / duracionMs);
            var actual = start + (target - start) * progreso;
            state.audio.volume = clampVol01(actual);

            if (progreso >= 1) {
                clearInterval(state._fadeIntervalId);
                state._fadeIntervalId = null;
                state.audio.volume = target;
                if (typeof onDone === 'function') onDone(true);
            }
        }, 40);
    }

    function aplicarSeekAlCargarAudio(targetSec, expectedSeq) {
        var sec = Number(targetSec) || 0;
        if (sec <= 0 || !state.audio) return;
        var aplicado = false;

        function limpiarListeners() {
            if (!state.audio) return;
            state.audio.removeEventListener('loadedmetadata', intentarSeek);
            state.audio.removeEventListener('canplay', intentarSeek);
            state.audio.removeEventListener('playing', intentarSeek);
        }

        function intentarSeek() {
            if (aplicado || expectedSeq !== state._playSeqId || !state.audio) {
                limpiarListeners();
                return;
            }
            if (state.audio.readyState < 1) return;
            try {
                var dur = state.audio.duration;
                var objetivo = (typeof dur === 'number' && isFinite(dur) && dur > 0.5)
                    ? Math.min(sec, Math.max(0, dur - 0.35))
                    : sec;
                if (Math.abs((state.audio.currentTime || 0) - objetivo) > 0.45) {
                    state.audio.currentTime = objetivo;
                }
                if (Math.abs((state.audio.currentTime || 0) - objetivo) <= 0.6 || state.audio.readyState >= 2) {
                    aplicado = true;
                    limpiarListeners();
                }
            } catch (e) {}
        }

        state.audio.addEventListener('loadedmetadata', intentarSeek);
        state.audio.addEventListener('canplay', intentarSeek);
        state.audio.addEventListener('playing', intentarSeek);
        intentarSeek();
    }

    function reproducirMetaCancion(meta, idxEnLista, opciones) {
        if (!meta) return Promise.resolve(false);
        solicitarPermisoNotifReproductorSiFalta();
        cancelarFadeAudio();
        var playSeq = ++state._playSeqId;
        state._cargandoPlay = true;
        state.indiceActual = (typeof idxEnLista === 'number') ? idxEnLista : -1;
        state._playListenState = {
            seqId: playSeq,
            songId: meta.id,
            lastTickTs: Date.now(),
            elapsedSec: 0,
            counted: false,
            esPreview: !!(opciones && opciones.esPreview)
        };
        if (state.modoInteligente && !state.rutinaModoActivo && meta.id && !(opciones && opciones.esPreview)) {
            var ctxKey = _claveContextoActual();
            if (!state._smartVisitedIds) state._smartVisitedIds = {};
            if (!state._smartVisitedIds[ctxKey]) state._smartVisitedIds[ctxKey] = {};
            state._smartVisitedIds[ctxKey][meta.id] = true;
        }
        var fadeInMs = (opciones && typeof opciones.fadeInMs === 'number' && opciones.fadeInMs > 0) ? opciones.fadeInMs : 0;
        var seekToSec = (opciones && typeof opciones.seekToSec === 'number' && opciones.seekToSec > 0) ? opciones.seekToSec : 0;

        return prepararUrlReproduccion(meta).then(function(prep) {
            if (playSeq !== state._playSeqId) {
                if (prep && prep.esBlobUrl && prep.src) {
                    try { URL.revokeObjectURL(prep.src); } catch (e) {}
                }
                return false;
            }
            if (!prep || !prep.src) {
                throw new Error('URL de audio vacía');
            }

            if (state.blobUrlActual) {
                try { URL.revokeObjectURL(state.blobUrlActual); } catch (e) {}
                state.blobUrlActual = null;
            }

            if (prep.esBlobUrl) {
                state.blobUrlActual = prep.src;
            }
            state.audio.src = prep.src;
            state.audio.volume = (fadeInMs > 0) ? 0 : clampVol01(state.volumen);
            state.cancionActual = meta;

            if (seekToSec > 0) {
                aplicarSeekAlCargarAudio(seekToSec, playSeq);
            }

            // Actualizar UI de inmediato y cargar carátula real en paralelo
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            resolverCaratulaCancion(meta, true).then(function(artRes) {
                if (playSeq !== state._playSeqId) return;
                if (artRes && artRes.url) {
                    aplicarCaratulaEnElementosDOM(meta.id, artRes.url);
                }
                actualizarMediaSession();
            }).catch(function() {});

            var playPromise = state.audio.play();
            if (playPromise !== undefined) {
                return playPromise.then(function() {
                    if (state._cancelarCargaPorDesconexionSeq === playSeq) {
                        state._cargandoPlay = false;
                        try { if (!state.audio.paused) state.audio.pause(); } catch (e) {}
                        state.reproduciendo = false;
                        if (state.audio.volume < 0.01 && state.volumen > 0.01) {
                            state.audio.volume = clampVol01(state.volumen);
                        }
                        actualizarUIPlayerCompleto();
                        actualizarMiniPlayer();
                        actualizarBarraAudioRutina();
                        actualizarMediaSession();
                        return false;
                    }
                    if (playSeq !== state._playSeqId) return false;
                    state._cargandoPlay = false;
                    state.reproduciendo = true;
                    state.rutinaConsecErrors = 0;

                    if (seekToSec > 0 && state.audio.readyState >= 1 && Math.abs((state.audio.currentTime || 0) - seekToSec) > 0.6) {
                        aplicarSeekAlCargarAudio(seekToSec, playSeq);
                    }
                    if (fadeInMs > 0) {
                        hacerFadeVolumenAudio(0, clampVol01(state.volumen), fadeInMs);
                    } else {
                        state.audio.volume = clampVol01(state.volumen);
                    }

                    actualizarUIPlayerCompleto();
                    actualizarMiniPlayer();
                    actualizarBarraAudioRutina();
                    renderizarContenidoSegunSubtab();
                    actualizarMediaSession();
                    return true;
                }).catch(function(err) {
                    if (playSeq !== state._playSeqId) return false;
                    state._cargandoPlay = false;
                    console.warn('[Reproductor] Autoplay prevenido o error:', err);
                    state.audio.volume = clampVol01(state.volumen);
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
            state._cargandoPlay = false;
            if (fadeInMs > 0) {
                hacerFadeVolumenAudio(0, clampVol01(state.volumen), fadeInMs);
            }
            return true;
        }).catch(function(err) {
            if (playSeq !== state._playSeqId) return false;
            state._cargandoPlay = false;
            console.warn('[Reproductor] Error abriendo audio:', err);
            if (opciones && opciones.silencioso && state.rutinaModoActivo) {
                var tracksFallback = obtenerCancionesDePlaylist(state.rutinaPlaylistActivaId);
                state.rutinaConsecErrors++;
                if (tracksFallback.length > 1 && state.rutinaConsecErrors < tracksFallback.length) {
                    siguienteCancion(false);
                }
                return false;
            }
            notificarPlayerToast('No se pudo cargar el archivo de audio', '⚠️');
            return false;
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
            state.modoInteligente = !!state.rutinaPrevConfig.modoInteligente;
            state.repeat = state.rutinaPrevConfig.repeat || 'all';
        }
        state.rutinaPrevConfig = null;
        actualizarControlesModo();
        actualizarBarraAudioRutina();
    }

    function reproducirIndice(idx) {
        state.rutinaPreviaSnapshot = null;
        state._rutinaTransicionandoSalida = false;
        cancelarFadeAudio();
        salirModoRutinaSilencioso(false);
        var listaActual = obtenerListaReproducibleActual();
        if (idx < 0 || idx >= listaActual.length) return;
        reproducirMetaCancion(listaActual[idx], idx);
    }

    function reproducirPorId(songId) {
        if (!songId) return;
        state.rutinaPreviaSnapshot = null;
        state._rutinaTransicionandoSalida = false;
        cancelarFadeAudio();
        salirModoRutinaSilencioso(false);
        var listaActual = obtenerListaReproducibleActual();
        var idx = listaActual.findIndex(function(c) { return c.id === songId; });
        if (idx !== -1) {
            reproducirMetaCancion(listaActual[idx], idx);
            return;
        }
        var enTodas = state.canciones.find(function(c) { return c.id === songId; });
        if (enTodas) {
            reproducirMetaCancion(enTodas, -1);
        }
    }

    function obtenerListaReproducibleActual() {
        if (state.playlistSeleccionada) {
            var plTracks = obtenerCancionesDePlaylist(state.playlistSeleccionada);
            return state.modoInteligente ? ordenarListaPorTop(plTracks) : plTracks;
        }
        if (state.subtabActual === 'top') {
            return obtenerTopCancionesLista();
        }
        var base = obtenerCancionesActivasScope();
        if (state.carpetaSeleccionada) {
            var folderTracks = base.filter(function(c) { return c.carpeta === state.carpetaSeleccionada; });
            return state.modoInteligente ? ordenarListaPorTop(folderTracks) : folderTracks;
        }
        return state.modoInteligente ? ordenarListaPorTop(base) : base;
    }

    function iniciarMusicaDeRutina(playlistIdOverride, nombreRutina) {
        state._rutinaTransicionandoSalida = false;
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

            // Capturar canción que estaba sonando antes de la rutina para reanudarla al finalizar
            if (!state.rutinaModoActivo && !state.rutinaPreviaSnapshot && state.cancionActual && state.reproduciendo && state.audio && !state.audio.paused) {
                state.rutinaPreviaSnapshot = {
                    cancion: state.cancionActual,
                    indiceActual: state.indiceActual,
                    currentTime: Number(state.audio.currentTime) || 0,
                    playlistSeleccionada: state.playlistSeleccionada,
                    carpetaSeleccionada: state.carpetaSeleccionada,
                    soloSnapTube: !!state.soloSnapTube,
                    shuffle: !!state.shuffle,
                    modoInteligente: !!state.modoInteligente,
                    repeat: state.repeat || 'all'
                };
            }

            var estabaSonandoAntes = !!(state.cancionActual && state.reproduciendo && state.audio && !state.audio.paused);

            if (!state.rutinaPrevConfig) {
                state.rutinaPrevConfig = {
                    shuffle: state.shuffle,
                    modoInteligente: state.modoInteligente,
                    repeat: state.repeat
                };
            }

            state.rutinaModoActivo = true;
            state.rutinaPlaylistActivaId = targetId;
            state.rutinaNombreActiva = nombreRutina || '';
            state.rutinaConsecErrors = 0;
            state.shuffle = true;
            state.modoInteligente = false;
            state.repeat = 'all';
            actualizarControlesModo();
            actualizarBarraAudioRutina();

            var evitarId = (state.cancionActual && tracks.length > 1) ? state.cancionActual.id : null;
            state.rutinaColaAleatoria = construirColaAleatoriaRutina(tracks, evitarId);
            var primerId = state.rutinaColaAleatoria.shift();
            var idx = tracks.findIndex(function(c) { return c.id === primerId; });
            if (idx === -1) idx = 0;

            function lanzarPrimeraPistaConFade() {
                if (reqSeq !== state._playSeqId) return Promise.resolve(false);
                return reproducirMetaCancion(tracks[idx], idx, { silencioso: true, fadeInMs: 2000 });
            }

            if (estabaSonandoAntes) {
                return new Promise(function(resolve) {
                    hacerFadeVolumenAudio(clampVol01(state.audio.volume), 0, 450, function(completado) {
                        if (!completado || reqSeq !== state._playSeqId) {
                            resolve(false);
                            return;
                        }
                        Promise.resolve(lanzarPrimeraPistaConFade()).then(resolve);
                    });
                });
            }

            return lanzarPrimeraPistaConFade();
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

    function detenerMusicaDeRutina(omitirStopSiNoEsRutina, opciones) {
        var opts = opciones || {};
        var inmediato = !!opts.inmediato;
        var restaurarPrevia = (opts.restaurarPrevia !== false);
        var fadeOutMs = (typeof opts.fadeOutMs === 'number') ? opts.fadeOutMs : 1500;
        var fadeInRestoreMs = (typeof opts.fadeInRestoreMs === 'number') ? opts.fadeInRestoreMs : 1800;

        var reqSeq = ++state._playSeqId;
        var estabaEnRutina = !!state.rutinaModoActivo;
        var snapshot = (restaurarPrevia && state.rutinaPreviaSnapshot) ? state.rutinaPreviaSnapshot : null;
        state.rutinaPreviaSnapshot = null;

        salirModoRutinaSilencioso(true);

        var debeDetenerORestaurar = estabaEnRutina || !omitirStopSiNoEsRutina || !!snapshot;
        if (!debeDetenerORestaurar) {
            actualizarBarraAudioRutina();
            return Promise.resolve(false);
        }

        function restaurarOSilenciarDespuesDeFade() {
            if (reqSeq !== state._playSeqId) {
                state._rutinaTransicionandoSalida = false;
                return false;
            }
            state._rutinaTransicionandoSalida = false;

            if (snapshot && snapshot.cancion) {
                var metaPrev = buscarCancionPorIdOSig(snapshot.cancion.id, snapshot.cancion.firma || generarFirmaCancion(snapshot.cancion)) || snapshot.cancion;
                state.playlistSeleccionada = snapshot.playlistSeleccionada;
                state.carpetaSeleccionada = snapshot.carpetaSeleccionada;
                state.soloSnapTube = !!snapshot.soloSnapTube;
                state.shuffle = !!snapshot.shuffle;
                state.modoInteligente = !!snapshot.modoInteligente;
                state.repeat = snapshot.repeat || 'all';
                actualizarControlesModo();

                var listaScope = obtenerListaReproducibleActual();
                var idxRestaurar = listaScope.findIndex(function(c) { return c.id === metaPrev.id; });
                return reproducirMetaCancion(metaPrev, idxRestaurar, {
                    silencioso: true,
                    fadeInMs: inmediato ? 0 : fadeInRestoreMs,
                    seekToSec: snapshot.currentTime || 0
                });
            }

            if (estabaEnRutina || (state.cancionActual && !omitirStopSiNoEsRutina)) {
                detenerReproductor();
            } else {
                actualizarBarraAudioRutina();
            }
            return true;
        }

        var audioSonando = !!(state.cancionActual && state.reproduciendo && state.audio && !state.audio.paused);
        if (inmediato || !audioSonando || fadeOutMs <= 0) {
            cancelarFadeAudio();
            return Promise.resolve(restaurarOSilenciarDespuesDeFade());
        }

        state._rutinaTransicionandoSalida = true;
        actualizarBarraAudioRutina();
        return new Promise(function(resolve) {
            hacerFadeVolumenAudio(clampVol01(state.audio.volume), 0, fadeOutMs, function(completado) {
                if (!completado || reqSeq !== state._playSeqId) {
                    state._rutinaTransicionandoSalida = false;
                    resolve(false);
                    return;
                }
                Promise.resolve(restaurarOSilenciarDespuesDeFade()).then(resolve);
            });
        });
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
            cancelarFadeAudio();
            if (state.audio.volume < 0.01 && state.volumen > 0.01) {
                state.audio.volume = clampVol01(state.volumen);
            }
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

    function pausarPorDesconexionAudio(motivo, nombreDispositivo) {
        var ahora = Date.now();
        var estabaCargando = !!state._cargandoPlay;
        var estabaReproduciendo = !!(state.reproduciendo || (state.audio && !state.audio.paused));

        if (!estabaReproduciendo && !estabaCargando) {
            return false;
        }

        cancelarFadeAudio();
        if (estabaCargando) {
            state._cancelarCargaPorDesconexionSeq = state._playSeqId;
            state._playSeqId++;
            state._cargandoPlay = false;
        }

        if (state.audio && !state.audio.paused) {
            try { state.audio.pause(); } catch (e) {}
        }
        if (state.audio && state.audio.volume < 0.01 && state.volumen > 0.01) {
            state.audio.volume = clampVol01(state.volumen);
        }
        state.reproduciendo = false;

        actualizarUIPlayerCompleto();
        actualizarMiniPlayer();
        actualizarBarraAudioRutina();
        renderizarContenidoSegunSubtab();
        actualizarMediaSession();

        if (ahora - (state._lastNoisyPauseTs || 0) > 1800) {
            state._lastNoisyPauseTs = ahora;
            var devTxt = (typeof nombreDispositivo === 'string' && nombreDispositivo.trim())
                ? (' (' + nombreDispositivo.trim() + ')')
                : '';
            notificarPlayerToast('Música pausada al desconectar audífonos' + devTxt, '🎧');
        }
        return true;
    }

    function initMonitorDesconexionAudifonos() {
        if (state._noisyListenerRegistered) return;
        state._noisyListenerRegistered = true;

        var plugin = obtenerPluginMonarcaMedia();
        if (plugin && typeof plugin.addListener === 'function') {
            try {
                var p = plugin.addListener('audioBecomingNoisy', function(ev) {
                    var reason = (ev && ev.reason) ? ev.reason : 'becoming_noisy';
                    var devName = (ev && ev.deviceName) ? ev.deviceName : '';
                    pausarPorDesconexionAudio(reason, devName);
                });
                if (p && typeof p.catch === 'function') p.catch(function() {});
            } catch (e) {}
            return;
        }

        // Respaldo Web / PWA / Escritorio usando MediaDevices devicechange
        if (typeof navigator !== 'undefined' && navigator.mediaDevices
            && typeof navigator.mediaDevices.enumerateDevices === 'function'
            && typeof navigator.mediaDevices.addEventListener === 'function') {
            var leerSalidasAudioWeb = function() {
                return navigator.mediaDevices.enumerateDevices().then(function(devs) {
                    var map = {};
                    (devs || []).forEach(function(d) {
                        if (d && d.kind === 'audiooutput' && d.deviceId) {
                            map[d.deviceId] = d.label || '';
                        }
                    });
                    return map;
                }).catch(function() { return null; });
            };

            leerSalidasAudioWeb().then(function(inicial) {
                if (inicial) state._knownWebAudioOutputs = inicial;
            });

            navigator.mediaDevices.addEventListener('devicechange', function() {
                leerSalidasAudioWeb().then(function(actual) {
                    if (!actual) return;
                    var previo = state._knownWebAudioOutputs;
                    state._knownWebAudioOutputs = actual;
                    if (!previo) return;

                    var prevIds = Object.keys(previo);
                    var actIds = Object.keys(actual);
                    var removedLabel = '';
                    var seDesconectoSalida = false;

                    for (var i = 0; i < prevIds.length; i++) {
                        var id = prevIds[i];
                        if (id === 'default' || id === 'communications') continue;
                        if (!Object.prototype.hasOwnProperty.call(actual, id)) {
                            seDesconectoSalida = true;
                            if (previo[id] && !removedLabel) removedLabel = previo[id];
                        }
                    }
                    if (!seDesconectoSalida && actIds.length < prevIds.length) {
                        seDesconectoSalida = true;
                    }
                    if (seDesconectoSalida) {
                        pausarPorDesconexionAudio('web_devicechange', removedLabel);
                    }
                });
            });
        }
    }

    function togglePlayPausa() {
        if (!state.cancionActual || state.audio.paused) {
            reproducirActual();
        } else {
            pausarActual();
        }
    }

    function detenerReproductor() {
        cancelarFadeAudio();
        state._rutinaTransicionandoSalida = false;
        state._playSeqId++;
        state.audio.pause();
        state.audio.removeAttribute('src');
        state.audio.load();
        state.audio.volume = clampVol01(state.volumen);
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
            reproducirMetaCancion(tracksRut[nextIdx], nextIdx, { silencioso: true, fadeInMs: esManual ? 0 : 900 });
            return;
        }

        var lista = obtenerListaReproducibleActual();
        if (lista.length === 0) return;

        if (!esManual && state.repeat === 'one') {
            if (state._playListenState) {
                state._playListenState.counted = false;
                state._playListenState.elapsedSec = 0;
                state._playListenState.lastTickTs = Date.now();
            }
            state.audio.currentTime = 0;
            state.audio.play().then(function() {
                actualizarPositionStateMediaSession();
            }).catch(function() {});
            return;
        }

        var siguienteIdx = -1;
        if (state.modoInteligente) {
            var ctxKey = _claveContextoActual();
            if (!state._smartVisitedIds) state._smartVisitedIds = {};
            var visitedMap = state._smartVisitedIds[ctxKey] || {};
            if (state.cancionActual && state.cancionActual.id) {
                visitedMap[state.cancionActual.id] = true;
            }
            state._smartVisitedIds[ctxKey] = visitedMap;

            for (var i = 0; i < lista.length; i++) {
                var cand = lista[i];
                if (!cand || !cand.id) continue;
                if (!visitedMap[cand.id] && (!state.cancionActual || cand.id !== state.cancionActual.id || lista.length === 1)) {
                    siguienteIdx = i;
                    break;
                }
            }

            if (siguienteIdx === -1) {
                if (state.repeat === 'off' && !esManual) {
                    state._smartVisitedIds[ctxKey] = {};
                    detenerReproductor();
                    return;
                }
                state._smartVisitedIds[ctxKey] = {};
                siguienteIdx = (lista.length > 1 && state.cancionActual && lista[0] && lista[0].id === state.cancionActual.id) ? 1 : 0;
            }
        } else if (state.shuffle && lista.length > 1) {
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

    function actualizarVisualSeek(porcentaje, previewSegundos) {
        var pct = Math.max(0, Math.min(100, Number(porcentaje) || 0));
        var slider = document.getElementById('player-seek-slider');
        if (slider) {
            slider.style.setProperty('--seek-pct', pct.toFixed(2) + '%');
            slider.setAttribute('aria-valuenow', String(Math.round(pct)));
            if (slider.tagName === 'INPUT') {
                slider.value = pct;
            }
        }
        var tooltip = document.getElementById('player-seek-tooltip');
        if (tooltip && typeof previewSegundos === 'number' && !isNaN(previewSegundos)) {
            tooltip.textContent = formatearTiempo(previewSegundos);
        }
        if (typeof previewSegundos === 'number' && !isNaN(previewSegundos)) {
            var elCur = document.getElementById('player-time-current');
            if (elCur) elCur.textContent = formatearTiempo(previewSegundos);
        }
    }

    function cambiarSeek(porcentaje) {
        var pct = Math.max(0, Math.min(100, Number(porcentaje) || 0));
        var dur = (state.audio && state.audio.duration && !isNaN(state.audio.duration)) ? state.audio.duration : 0;
        var targetSec = dur > 0 ? (pct / 100) * dur : 0;
        actualizarVisualSeek(pct, dur > 0 ? targetSec : undefined);
        if (dur <= 0) return;
        state.audio.currentTime = targetSec;
        actualizarPositionStateMediaSession();
    }

    function initScrubberAntiAccidente() {
        var slider = document.getElementById('player-seek-slider');
        if (!slider || slider.dataset.antiAccidenteBound === '1') return;
        slider.dataset.antiAccidenteBound = '1';

        var scrub = {
            activo: false,
            pendiente: false,
            pointerId: null,
            pointerType: '',
            startX: 0,
            startY: 0,
            startPct: 0,
            previewPct: 0,
            empezoEnThumb: false,
            longPressTimer: null
        };
        state._scrub = scrub;

        var limpiarTimer = function() {
            if (scrub.longPressTimer) {
                clearTimeout(scrub.longPressTimer);
                scrub.longPressTimer = null;
            }
        };

        var calcularPctDesdeX = function(clientX) {
            var rect = slider.getBoundingClientRect();
            if (!rect || rect.width <= 0) return scrub.startPct;
            var ratio = (clientX - rect.left) / rect.width;
            return Math.max(0, Math.min(100, ratio * 100));
        };

        var activarScrubbing = function(pctInicial) {
            limpiarTimer();
            if (scrub.activo) return;
            scrub.activo = true;
            scrub.previewPct = Math.max(0, Math.min(100, pctInicial));
            slider.classList.add('is-scrubbing');
            try {
                if (scrub.pointerId !== null && typeof slider.setPointerCapture === 'function') {
                    slider.setPointerCapture(scrub.pointerId);
                }
            } catch (e) {}
            try {
                if (scrub.pointerType === 'touch' && navigator.vibrate) {
                    navigator.vibrate(10);
                }
            } catch (e) {}
            var dur = (state.audio && state.audio.duration && !isNaN(state.audio.duration)) ? state.audio.duration : 0;
            actualizarVisualSeek(scrub.previewPct, dur > 0 ? (scrub.previewPct / 100) * dur : 0);
        };

        var cancelarScrubbing = function(restaurarVisual) {
            limpiarTimer();
            var estabaActivo = scrub.activo;
            scrub.activo = false;
            scrub.pendiente = false;
            try {
                if (scrub.pointerId !== null && typeof slider.releasePointerCapture === 'function') {
                    slider.releasePointerCapture(scrub.pointerId);
                }
            } catch (e) {}
            scrub.pointerId = null;
            slider.classList.remove('is-scrubbing');
            if (restaurarVisual && estabaActivo) {
                var dur = (state.audio && state.audio.duration && !isNaN(state.audio.duration)) ? state.audio.duration : 0;
                var cur = (state.audio && state.audio.currentTime) ? state.audio.currentTime : 0;
                var realPct = dur > 0 ? (cur / dur) * 100 : 0;
                actualizarVisualSeek(realPct, cur);
            }
        };

        slider.addEventListener('pointerdown', function(e) {
            if (e.button && e.button !== 0) return;
            var dur = (state.audio && state.audio.duration && !isNaN(state.audio.duration)) ? state.audio.duration : 0;
            if (dur <= 0) return;

            limpiarTimer();
            var cur = (state.audio && state.audio.currentTime) ? state.audio.currentTime : 0;
            var pctActual = (cur / dur) * 100;
            var rect = slider.getBoundingClientRect();
            var thumbX = rect.left + (pctActual / 100) * rect.width;

            scrub.pendiente = true;
            scrub.activo = false;
            scrub.pointerId = e.pointerId;
            scrub.pointerType = e.pointerType || 'touch';
            scrub.startX = e.clientX;
            scrub.startY = e.clientY;
            scrub.startPct = pctActual;
            scrub.previewPct = pctActual;
            scrub.empezoEnThumb = Math.abs(e.clientX - thumbX) <= 28;

            if (scrub.pointerType === 'mouse') {
                e.preventDefault();
                activarScrubbing(calcularPctDesdeX(e.clientX));
                return;
            }

            // En pantalla táctil: jamás salta con un toque accidental ni al deslizar verticalmente.
            // Solo activa el avance/retroceso al arrastrar horizontalmente de forma intencional
            // o al mantener presionado (~260ms) sobre el punto deseado.
            var startClientX = e.clientX;
            scrub.longPressTimer = setTimeout(function() {
                if (!scrub.pendiente || scrub.activo) return;
                activarScrubbing(scrub.empezoEnThumb ? scrub.startPct : calcularPctDesdeX(startClientX));
            }, 260);
        });

        slider.addEventListener('pointermove', function(e) {
            if (!scrub.pendiente || (scrub.pointerId !== null && e.pointerId !== scrub.pointerId)) return;
            var dur = (state.audio && state.audio.duration && !isNaN(state.audio.duration)) ? state.audio.duration : 0;
            if (dur <= 0) {
                cancelarScrubbing(false);
                return;
            }

            var dx = e.clientX - scrub.startX;
            var dy = e.clientY - scrub.startY;
            var absDx = Math.abs(dx);
            var absDy = Math.abs(dy);

            if (!scrub.activo) {
                // Si el usuario está haciendo scroll vertical hacia la biblioteca, cancelar de inmediato
                if (absDy > 8 && absDy >= absDx * 0.9) {
                    cancelarScrubbing(false);
                    return;
                }
                // Umbral horizontal anti-roce (10px desde el punto blanco, 16px desde cualquier punto de la barra)
                var umbralHorizontal = scrub.empezoEnThumb ? 10 : 16;
                if (absDx >= umbralHorizontal && absDx > absDy * 1.35) {
                    var rect0 = slider.getBoundingClientRect();
                    var pctIni = scrub.empezoEnThumb
                        ? (scrub.startPct + (dx / Math.max(1, rect0.width)) * 100)
                        : calcularPctDesdeX(e.clientX);
                    activarScrubbing(pctIni);
                } else {
                    return;
                }
            }

            if (scrub.activo) {
                if (e.cancelable) e.preventDefault();
                var rect = slider.getBoundingClientRect();
                var nuevoPct = scrub.empezoEnThumb
                    ? (scrub.startPct + (dx / Math.max(1, rect.width)) * 100)
                    : calcularPctDesdeX(e.clientX);
                scrub.previewPct = Math.max(0, Math.min(100, nuevoPct));
                actualizarVisualSeek(scrub.previewPct, (scrub.previewPct / 100) * dur);
            }
        });

        slider.addEventListener('pointerup', function(e) {
            if (!scrub.pendiente || (scrub.pointerId !== null && e.pointerId !== scrub.pointerId)) return;
            var confirmar = scrub.activo;
            var pctFinal = scrub.previewPct;
            cancelarScrubbing(false);
            if (confirmar) {
                cambiarSeek(pctFinal);
            }
        });

        slider.addEventListener('pointercancel', function(e) {
            if (scrub.pointerId !== null && e.pointerId !== scrub.pointerId) return;
            cancelarScrubbing(true);
        });

        slider.addEventListener('keydown', function(e) {
            var dur = (state.audio && state.audio.duration && !isNaN(state.audio.duration)) ? state.audio.duration : 0;
            if (dur <= 0) return;
            var cur = state.audio.currentTime || 0;
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                cambiarSeek(Math.min(100, ((cur + 5) / dur) * 100));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                cambiarSeek(Math.max(0, ((cur - 5) / dur) * 100));
            }
        });
    }

    function cambiarVolumen(val) {
        cancelarFadeAudio();
        var num = parseFloat(val);
        if (isNaN(num)) num = 1;
        if (num < 0) num = 0;
        if (num > 1) num = 1;
        state.volumen = num;
        state.audio.volume = num;
        var elVolTxt = document.getElementById('player-vol-text');
        if (elVolTxt) elVolTxt.textContent = Math.round(num * 100) + '%';
    }

    function toggleShuffle(forzarVal) {
        state.shuffle = (typeof forzarVal === 'boolean') ? forzarVal : !state.shuffle;
        if (state.shuffle) {
            state.modoInteligente = false;
        }
        state._smartVisitedIds = {};
        guardarModosReproductorStorage();
        sincronizarIndiceCancionActualEnLista();
        actualizarControlesModo();
        if (state.subtabActual === 'todas' && state.playlistSeleccionada) {
            renderizarContenidoSegunSubtab();
        }
    }

    function toggleModoInteligente(forzarVal) {
        var activar = (typeof forzarVal === 'boolean') ? forzarVal : !state.modoInteligente;
        state.modoInteligente = activar;
        if (activar) {
            state.shuffle = false;
            if (!state._smartVisitedIds) state._smartVisitedIds = {};
            delete state._smartVisitedIds[_claveContextoActual()];
        }
        guardarModosReproductorStorage();
        sincronizarIndiceCancionActualEnLista();
        actualizarControlesModo();
        if (state.subtabActual === 'todas' || state.subtabActual === 'top') {
            renderizarContenidoSegunSubtab();
        }
        notificarPlayerToast(
            activar ? 'Modo Inteligente ON: reproduciendo según tu Top más escuchadas' : 'Modo Inteligente desactivado',
            activar ? '✨' : '🎵'
        );
        return state.modoInteligente;
    }

    function toggleRepeat() {
        if (state.repeat === 'all') {
            state.repeat = 'one';
        } else if (state.repeat === 'one') {
            state.repeat = 'off';
        } else {
            state.repeat = 'all';
        }
        guardarModosReproductorStorage();
        actualizarControlesModo();
        if (state.subtabActual === 'todas' && state.playlistSeleccionada) {
            renderizarContenidoSegunSubtab();
        }
    }

    var SVG_REPEAT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>';

    function _textoEstadoRepeat(rep) {
        if (rep === 'one') return 'Repetir: 1';
        if (rep === 'off') return 'Repetir: Off';
        return 'Repetir: Todas';
    }

    function actualizarControlesModo() {
        var btnShuf = document.getElementById('player-btn-shuffle');
        if (btnShuf) {
            btnShuf.classList.toggle('active', !!state.shuffle);
            btnShuf.setAttribute('aria-pressed', state.shuffle ? 'true' : 'false');
            btnShuf.title = state.shuffle ? 'Aleatorio: ACTIVADO' : 'Aleatorio: DESACTIVADO';
        }

        var btnSmart = document.getElementById('player-btn-smart');
        if (btnSmart) {
            btnSmart.classList.toggle('active', !!state.modoInteligente);
            btnSmart.setAttribute('aria-pressed', state.modoInteligente ? 'true' : 'false');
            btnSmart.title = state.modoInteligente
                ? 'Modo Inteligente: ACTIVADO (reproduce según tu Top)'
                : 'Modo Inteligente: DESACTIVADO (reproduce según tu Top más escuchadas)';
        }

        var btnRep = document.getElementById('player-btn-repeat');
        if (btnRep) {
            btnRep.classList.remove('repeat-all', 'repeat-one', 'repeat-off');
            if (state.repeat === 'all') {
                btnRep.classList.add('repeat-all');
                btnRep.innerHTML = SVG_REPEAT + '<span class="repeat-mode-tag">Todas</span>';
                btnRep.title = 'Repetir: Toda la lista';
            } else if (state.repeat === 'one') {
                btnRep.classList.add('repeat-one');
                btnRep.innerHTML = SVG_REPEAT + '<span class="repeat-mode-tag">1</span>';
                btnRep.title = 'Repetir: Canción actual';
            } else {
                btnRep.classList.add('repeat-off');
                btnRep.innerHTML = SVG_REPEAT + '<span class="repeat-mode-tag">Off</span>';
                btnRep.title = 'Repetir: Desactivado';
            }
        }

        var plShuf = document.getElementById('pl-mode-btn-shuffle');
        if (plShuf) plShuf.classList.toggle('active', !!state.shuffle);
        var plSmart = document.getElementById('pl-mode-btn-smart');
        if (plSmart) plSmart.classList.toggle('active', !!state.modoInteligente);
        var plRep = document.getElementById('pl-mode-btn-repeat');
        if (plRep) {
            plRep.classList.toggle('active', state.repeat !== 'off');
            plRep.textContent = '🔁 ' + _textoEstadoRepeat(state.repeat);
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

    function enviarMetadataNativa(nativeMS, metaInfo, albumName, dataUrl, mimeType) {
        try {
            var p = nativeMS.setMetadata({
                title: metaInfo.titulo,
                artist: metaInfo.artista,
                album: albumName,
                artwork: [
                    { src: dataUrl || TINY_PNG_DATA_URL, sizes: '360x360', type: mimeType || 'image/jpeg' }
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
                var metaInfo = obtenerTituloLimpoYArtista(cancionRef);
                var albumName = cancionRef.album
                    ? cancionRef.album
                    : (cancionRef.carpeta ? ('Carpeta: ' + cancionRef.carpeta) : 'Emily OS · Música');

                try {
                    var psProm = nativeMS.setPlaybackState({
                        playbackState: state.reproduciendo ? 'playing' : 'paused'
                    });
                    if (psProm && typeof psProm.catch === 'function') psProm.catch(function() {});
                } catch(e) {}

                var trackDataUrl = state.artworkDataUrlCache[cancionRef.id];
                if (trackDataUrl) {
                    enviarMetadataNativa(nativeMS, metaInfo, albumName, trackDataUrl, 'image/jpeg');
                } else {
                    var fallbackArt = cachedArtworkDataUrl || TINY_PNG_DATA_URL;
                    enviarMetadataNativa(nativeMS, metaInfo, albumName, fallbackArt, 'image/png');
                    resolverCaratulaCancion(cancionRef, true).then(function(artRes) {
                        if (state.cancionActual && state.cancionActual.id === cancionRef.id) {
                            var imgData = (artRes && artRes.dataUrl) ? artRes.dataUrl : null;
                            if (imgData) {
                                enviarMetadataNativa(nativeMS, metaInfo, albumName, imgData, 'image/jpeg');
                            } else if (!cachedArtworkDataUrl) {
                                obtenerArtworkDataUrl().then(function(appLogo) {
                                    if (state.cancionActual && state.cancionActual.id === cancionRef.id) {
                                        enviarMetadataNativa(nativeMS, metaInfo, albumName, appLogo, 'image/png');
                                    }
                                }).catch(function() {});
                            }
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
            var metaWeb = obtenerTituloLimpoYArtista(state.cancionActual);
            var albumWeb = state.cancionActual.album
                ? state.cancionActual.album
                : (state.cancionActual.carpeta ? ('Carpeta: ' + state.cancionActual.carpeta) : 'Emily OS · Música');
            var trackArtUrl = state.artworkCache[state.cancionActual.id];
            var artList = (trackArtUrl && trackArtUrl !== 'none')
                ? [{ src: trackArtUrl, sizes: '360x360', type: 'image/jpeg' }]
                : [
                    { src: obtenerUrlIcono('icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
                    { src: obtenerUrlIcono('icons/icon-512.png'), sizes: '512x512', type: 'image/png' }
                ];

            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: metaWeb.titulo,
                    artist: metaWeb.artista,
                    album: albumWeb,
                    artwork: artList
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

            var estaArrastrandoSeek = !!(state._scrub && state._scrub.activo);
            if (!estaArrastrandoSeek) {
                actualizarVisualSeek(pct, cur);
            }
            var elDur = document.getElementById('player-time-duration');
            if (elDur) elDur.textContent = formatearTiempo(dur);

            var miniBar = document.getElementById('mini-player-fill');
            if (miniBar) miniBar.style.width = pct + '%';

            // Registrar reproducción real cuando el usuario escucha >= 8s (o >=45% de clips cortos)
            var ls = state._playListenState;
            if (ls && !ls.counted && !ls.esPreview && ls.seqId === state._playSeqId && state.cancionActual && state.cancionActual.id === ls.songId && !state.audio.paused) {
                var nowTs = Date.now();
                var deltaSec = (ls.lastTickTs > 0) ? Math.min(1.5, Math.max(0, (nowTs - ls.lastTickTs) / 1000)) : 0;
                ls.lastTickTs = nowTs;
                ls.elapsedSec = (ls.elapsedSec || 0) + deltaSec;
                var thresholdSec = (dur > 0 && dur < 16) ? Math.max(2.5, dur * 0.45) : 8;
                if (ls.elapsedSec >= thresholdSec || (cur >= thresholdSec && ls.elapsedSec >= 2.5)) {
                    ls.counted = true;
                    registrarReproduccionCancion(state.cancionActual);
                }
            }

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
            var lsEnd = state._playListenState;
            if (lsEnd && !lsEnd.counted && !lsEnd.esPreview && lsEnd.seqId === state._playSeqId && state.cancionActual && state.cancionActual.id === lsEnd.songId) {
                lsEnd.counted = true;
                registrarReproduccionCancion(state.cancionActual);
            }
            siguienteCancion(false);
        });

        state.audio.addEventListener('play', function() {
            state.reproduciendo = true;
            state.rutinaConsecErrors = 0;
            if (state._playListenState && state._playListenState.seqId === state._playSeqId) {
                state._playListenState.lastTickTs = Date.now();
            }
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
            notificarPlayerToast('El servicio de nube aún no está disponible', '☁️');
            return;
        }

        var btn = document.getElementById('btn-transfer-' + id);
        if (btn) btn.innerHTML = '⏳';

        obtenerCancionCompleta(id).then(function(itemCompleto) {
            if (!itemCompleto || !itemCompleto.blob) {
                throw new Error("No se pudo leer el archivo local.");
            }
            return window.MonarcaCloud.subirCancionTransferencia(meta, itemCompleto.blob);
        }).then(function() {
            notificarPlayerToast('"' + meta.nombre + '" enviada a tu PC', '✓');
            if (btn) btn.innerHTML = '✓';
        }).catch(function(err) {
            notificarPlayerToast('Error al enviar a PC: ' + (err.message || err), '⚠️');
            if (btn) btn.innerHTML = SVG_CLOUD_UP;
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
        if (tab === 'todas' || tab === 'top') {
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

        sincronizarIndiceCancionActualEnLista();
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

    var SVG_LIST_PLUS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
    var SVG_CLOUD_UP = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>';
    var SVG_DOWNLOAD = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
    var SVG_FOLDER_MINI = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';

    function renderizarContenidoSegunSubtab() {
        var cont = document.getElementById('reproductor-lista-canciones');
        if (!cont) return;

        var visibles = obtenerCancionesActivasScope();
        var countBadge = document.getElementById('player-total-songs-badge');
        var sizeBadge = document.getElementById('player-total-size-badge');
        var totalBytes = 0;
        visibles.forEach(function(c) { totalBytes += (c.tamano || 0); });
        if (countBadge) countBadge.textContent = visibles.length + ' ' + (visibles.length === 1 ? 'pista' : 'pistas');
        if (sizeBadge) sizeBadge.textContent = formatearTamano(totalBytes);

        if (state.subtabActual === 'carpetas') {
            renderizarCarpetasView(cont);
        } else if (state.subtabActual === 'playlists') {
            renderizarPlaylistsView(cont);
        } else if (state.subtabActual === 'top') {
            renderizarTopCancionesView(cont);
        } else {
            renderizarTodasCancionesView(cont);
        }
    }

    function renderizarCarpetasView(cont) {
        var visibles = obtenerCancionesActivasScope();
        var carpetasMap = {};
        visibles.forEach(function(c) {
            var f = c.carpeta || 'Principal';
            if (!carpetasMap[f]) carpetasMap[f] = { count: 0, tamano: 0, canciones: [] };
            carpetasMap[f].count++;
            carpetasMap[f].tamano += (c.tamano || 0);
            carpetasMap[f].canciones.push(c);
        });

        var nombres = Object.keys(carpetasMap);
        if (nombres.length === 0) {
            cont.innerHTML = '<div style="text-align: center; padding: 28px 16px; color: #94a3b8;">' +
                '<h4 style="color:#f8fafc; margin:0 0 6px 0;">No hay carpetas disponibles</h4>' +
                '<p style="font-size: 12px; color: #64748b; margin:0;">Descarga canciones en tu teléfono o importa una carpeta manualmente.</p>' +
            '</div>';
            return;
        }

        var html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">';
        nombres.forEach(function(nom) {
            var obj = carpetasMap[nom];
            html += '<div class="player-folder-card" data-folder-name="' + escaparHTML(nom) + '" onclick="window.MonarcaPlayer.seleccionarCarpeta(this.getAttribute(\'data-folder-name\'))">' +
                '<div style="display: flex; align-items: center; gap: 11px; flex: 1; min-width: 0;">' +
                    '<span class="player-folder-ico-box">' + SVG_FOLDER_MINI + '</span>' +
                    '<div style="min-width: 0; flex: 1;">' +
                        '<div style="font-size: 13.5px; font-weight: 700; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escaparHTML(nom) + '</div>' +
                        '<div style="font-size: 11.5px; color: #94a3b8;">' + obj.count + (obj.count === 1 ? ' pista · ' : ' pistas · ') + formatearTamano(obj.tamano) + '</div>' +
                    '</div>' +
                '</div>' +
                '<span style="font-size: 12px; color: #94a3b8; font-weight: 700; flex-shrink: 0;">→</span>' +
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

    function _etiquetaRankTop(pos) {
        if (pos === 1) return '🥇 #1';
        if (pos === 2) return '🥈 #2';
        if (pos === 3) return '🥉 #3';
        return '#' + pos;
    }

    function renderizarTopCancionesView(cont) {
        var topLista = obtenerTopCancionesLista();
        var q = (state.busqueda || '').toLowerCase().trim();
        var totalReproducciones = 0;
        topLista.forEach(function(c) { totalReproducciones += obtenerReproduccionesCancion(c); });
        var maxPlays = topLista.length > 0 ? Math.max(1, obtenerReproduccionesCancion(topLista[0])) : 1;

        var itemsConRank = topLista.map(function(c, idx) {
            return { song: c, rank: idx + 1, plays: obtenerReproduccionesCancion(c) };
        }).filter(function(entry) {
            if (!q) return true;
            var c = entry.song;
            return (c.nombre || '').toLowerCase().indexOf(q) !== -1 ||
                   (c.artista || '').toLowerCase().indexOf(q) !== -1 ||
                   (c.carpeta || '').toLowerCase().indexOf(q) !== -1;
        });

        var headerHtml = '<div class="top-tracks-hero">' +
            '<div class="top-tracks-hero-info">' +
                '<div class="top-tracks-hero-title">🏆 Top Canciones Más Escuchadas</div>' +
                '<div class="top-tracks-hero-sub">' +
                    '<span class="pl-count-badge">' + topLista.length + ' ' + (topLista.length === 1 ? 'pista' : 'pistas') + '</span>' +
                    '<span class="top-total-pill">🎧 ' + totalReproducciones + (totalReproducciones === 1 ? ' reproducción' : ' reproducciones') + '</span>' +
                '</div>' +
            '</div>' +
            (topLista.length > 0
                ? '<button type="button" id="btn-reproducir-top-canciones" class="btn-pl-action-smart is-hero" onclick="window.MonarcaPlayer.reproducirTopCanciones()">▶ Reproducir Top</button>'
                : '') +
        '</div>';

        if (topLista.length === 0) {
            cont.innerHTML = headerHtml + '<div class="pl-empty-card">' +
                '<div class="pl-empty-icon">🏆</div>' +
                '<h4>Tu Top canciones más escuchadas aún está vacío</h4>' +
                '<p>Reproduce cualquier canción unos segundos (o complétala) y aparecerá aquí automáticamente ordenada por veces escuchadas.</p>' +
                '<button type="button" class="btn-pl-nueva-cta" onclick="window.MonarcaPlayer.cambiarSubtab(\'todas\')">Explorar Pistas</button>' +
            '</div>';
            return;
        }

        if (itemsConRank.length === 0) {
            cont.innerHTML = headerHtml + '<div style="text-align: center; padding: 24px 16px; color: #94a3b8; font-size: 13px;">' +
                'No hay canciones en tu Top que coincidan con esa búsqueda.' +
            '</div>';
            return;
        }

        var html = headerHtml + '<div class="top-tracks-list">';
        itemsConRank.forEach(function(entry) {
            var c = entry.song;
            var rank = entry.rank;
            var plays = entry.plays;
            var pct = Math.max(8, Math.round((plays / maxPlays) * 100));
            var esActual = (state.cancionActual && state.cancionActual.id === c.id);
            var sonando = esActual && state.reproduciendo;
            var metaTrack = obtenerTituloLimpoYArtista(c);
            var cachedArt = state.artworkCache[c.id];
            var tieneArtLista = !!(cachedArt && cachedArt !== 'none');
            var rankClass = rank <= 3 ? (' is-rank-' + rank) : '';
            var subLine = (metaTrack.artista && metaTrack.artista !== 'Artista desconocido')
                ? metaTrack.artista
                : (c.carpeta || 'Principal');

            html += '<div class="song-list-item top-song-item' + (esActual ? ' active-song' : '') + '" data-song-id="' + escaparHTML(c.id) + '" data-top-rank="' + rank + '" onclick="window.MonarcaPlayer.reproducirTopCanciones(this.getAttribute(\'data-song-id\'))">' +
                '<div class="top-song-left">' +
                    '<div class="top-rank-badge' + rankClass + '">' + _etiquetaRankTop(rank) + '</div>' +
                    '<div class="song-thumb-box ' + (esActual ? 'is-playing-item' : '') + '">' +
                        '<img class="song-thumb-img" data-art-song="' + escaparHTML(c.id) + '" src="' + (tieneArtLista ? escaparHTML(cachedArt) : '') + '" alt="" style="display: ' + (tieneArtLista ? 'block' : 'none') + ';">' +
                        '<span class="song-thumb-placeholder" style="display: ' + (tieneArtLista ? 'none' : 'flex') + ';">' +
                            (sonando ? '<span class="mini-equalizer-bars"><span></span><span></span><span></span></span>' : (esActual ? '▶' : '🎵')) +
                        '</span>' +
                    '</div>' +
                    '<div class="top-song-meta-col">' +
                        '<div class="song-item-title ' + (esActual ? 'is-active-title' : '') + '">' + escaparHTML(metaTrack.titulo) + '</div>' +
                        '<div class="song-item-meta">' +
                            '<span class="song-meta-artist">' + escaparHTML(subLine) + '</span>' +
                            '<span class="song-meta-dot">·</span>' +
                            '<span class="top-plays-inline">🎧 ' + plays + (plays === 1 ? ' vez' : ' veces') + '</span>' +
                        '</div>' +
                        '<div class="top-progress-track"><div class="top-progress-fill' + rankClass + '" style="width: ' + pct + '%;"></div></div>' +
                    '</div>' +
                '</div>' +
                '<div class="song-row-actions top-song-actions" onclick="event.stopPropagation();">' +
                    '<span class="top-plays-pill' + rankClass + '">' + plays + '</span>' +
                    '<button type="button" class="btn-song-icon-ctrl" title="Añadir a lista de reproducción" onclick="window.MonarcaPlayer.abrirModalAgregarPlaylist(\'' + c.id + '\')">' + SVG_LIST_PLUS + '</button>' +
                '</div>' +
            '</div>';
        });
        html += '</div>';

        cont.innerHTML = html;
        observarMiniaturasLista();
    }

    function renderizarPlaylistsView(cont) {
        var defaultPlId = getPlaylistDefaultRutinaId();
        var html = '<div class="pl-view-toolbar">' +
            '<div class="pl-view-toolbar-left">' +
                '<span class="pl-view-title">Listas de Reproducción</span>' +
                '<span class="pl-count-badge">' + state.playlists.length + '</span>' +
            '</div>' +
            '<button type="button" class="btn-pl-nueva-cta" onclick="window.MonarcaPlayer.abrirModalCrearPlaylist()">+ Nueva Lista</button>' +
        '</div>';

        if (state.playlists.length === 0) {
            html += '<div class="pl-empty-card">' +
                '<div class="pl-empty-icon">🎶</div>' +
                '<h4>Aún no tienes listas creadas</h4>' +
                '<p>Agrupa tus MP3 favoritos en listas personalizadas (ej: "Gym", "Enfoque", "Rutina Matutina") y añádelas con un toque.</p>' +
                '<button type="button" class="btn-pl-nueva-cta" onclick="window.MonarcaPlayer.abrirModalCrearPlaylist()">Crear Mi Primera Lista</button>' +
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
                    '<button type="button" class="btn-pl-action-smart" onclick="window.MonarcaPlayer.reproducirPlaylistInteligente(\'' + pl.id + '\')" title="Reproducir en Modo Inteligente según tus canciones más escuchadas">' +
                        '✨ Inteligente' +
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
        var filtroSnapActivo = (state.soloSnapTube && tienePistasSnapTube() && !state.playlistSeleccionada && !state.carpetaSeleccionada);

        var listaFiltrada = lista.filter(function(c) {
            if (!q) return true;
            return (c.nombre || '').toLowerCase().indexOf(q) !== -1 ||
                   (c.artista || '').toLowerCase().indexOf(q) !== -1 ||
                   (c.carpeta || '').toLowerCase().indexOf(q) !== -1;
        });

        var encabezadoFiltro = '';
        if (state.carpetaSeleccionada) {
            encabezadoFiltro = '<div class="pl-detail-banner is-folder">' +
                '<span class="pl-detail-banner-title">Carpeta: <strong>' + escaparHTML(state.carpetaSeleccionada) + '</strong> (' + listaFiltrada.length + ')</span>' +
                '<button type="button" class="btn-pl-back-pill" onclick="window.MonarcaPlayer.seleccionarCarpeta(null)">← Todas</button>' +
            '</div>';
        } else if (state.playlistSeleccionada) {
            var plObj = state.playlists.find(function(p) { return p.id === state.playlistSeleccionada; });
            var esDefSel = (getPlaylistDefaultRutinaId() === state.playlistSeleccionada);
            var subPlaylistTxt = state.modoInteligente
                ? 'Modo Inteligente activo: ordenadas y sonando de la más escuchada (#1) a la menos escuchada.'
                : (state.shuffle
                    ? 'Modo Aleatorio activo dentro de esta playlist.'
                    : 'Elige Aleatorio, Repetir o Modo Inteligente para reproducir según tu Top.');

            encabezadoFiltro = '<div class="pl-detail-banner">' +
                '<div class="pl-detail-top-row">' +
                    '<div class="pl-detail-banner-left">' +
                        '<div class="pl-detail-banner-title">' + escaparHTML(plObj ? plObj.nombre : 'Lista') + ' <span class="pl-count-badge">' + listaFiltrada.length + '</span></div>' +
                        '<div class="pl-detail-banner-sub">' + subPlaylistTxt + '</div>' +
                    '</div>' +
                    '<div class="pl-detail-banner-actions">' +
                        '<button type="button" class="btn-pl-action-add" onclick="window.MonarcaPlayer.abrirModalAgregarCancionesAPlaylist(\'' + state.playlistSeleccionada + '\')">+ Canciones</button>' +
                        '<button type="button" class="btn-playlist-default-rutina' + (esDefSel ? ' active' : '') + '" onclick="window.MonarcaPlayer.togglePlaylistDefaultRutina(\'' + state.playlistSeleccionada + '\')" title="Elegir como playlist automática al iniciar rutinas">' +
                            (esDefSel ? 'Rutinas ✓' : 'Rutinas') +
                        '</button>' +
                        '<button type="button" class="btn-pl-back-pill" onclick="window.MonarcaPlayer.cambiarSubtab(\'playlists\')">← Listas</button>' +
                    '</div>' +
                '</div>' +
                '<div class="pl-detail-modes-bar" role="group" aria-label="Modos de reproducción de la lista">' +
                    '<button type="button" id="pl-mode-btn-shuffle" class="btn-pl-mode' + (state.shuffle ? ' active' : '') + '" onclick="window.MonarcaPlayer.toggleShuffle()">🔀 Aleatorio</button>' +
                    '<button type="button" id="pl-mode-btn-smart" class="btn-pl-mode is-smart' + (state.modoInteligente ? ' active' : '') + '" onclick="window.MonarcaPlayer.toggleModoInteligente()">✨ Inteligente</button>' +
                    '<button type="button" id="pl-mode-btn-repeat" class="btn-pl-mode' + (state.repeat !== 'off' ? ' active' : '') + '" onclick="window.MonarcaPlayer.toggleRepeat()">🔁 ' + _textoEstadoRepeat(state.repeat) + '</button>' +
                    (listaFiltrada.length > 0
                        ? '<button type="button" class="btn-pl-mode is-play-now" onclick="window.MonarcaPlayer.reproducirPlaylistInteligente(\'' + state.playlistSeleccionada + '\')">▶ Top Lista</button>'
                        : '') +
                '</div>' +
            '</div>';
        }

        if (state.canciones.length === 0) {
            cont.innerHTML = encabezadoFiltro + '<div style="text-align: center; padding: 32px 16px; color: #94a3b8;">' +
                '<h4 style="color: #f8fafc; margin: 0 0 6px 0; font-size: 15px;">Tu biblioteca de música está vacía</h4>' +
                '<p style="font-size: 12.5px; margin: 0 0 16px 0; color: #64748b;">Concede permiso de audio en Android para detectar SnapTube o carga tus MP3 manualmente.</p>' +
                '<div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">' +
                    '<button type="button" class="btn-lib-primary-noir" onclick="document.getElementById(\'input-file-mp3-monarca\').click()">' +
                        '+ Importar MP3' +
                    '</button>' +
                    '<button type="button" class="btn-lib-ghost" onclick="document.getElementById(\'input-folder-mp3-monarca\').click()">' +
                        '+ Importar Carpeta' +
                    '</button>' +
                '</div>' +
            '</div>';
            return;
        }

        if (listaFiltrada.length === 0) {
            if (state.playlistSeleccionada && !q) {
                cont.innerHTML = encabezadoFiltro + '<div class="pl-empty-card">' +
                    '<div class="pl-empty-icon">🎶</div>' +
                    '<h4>Esta lista todavía no tiene canciones</h4>' +
                    '<p>Selecciona pistas desde tu biblioteca offline para añadirlas a esta lista de reproducción.</p>' +
                    '<button type="button" class="btn-pl-nueva-cta" onclick="window.MonarcaPlayer.abrirModalAgregarCancionesAPlaylist(\'' + state.playlistSeleccionada + '\')">+ Agregar Canciones</button>' +
                '</div>';
            } else {
                cont.innerHTML = encabezadoFiltro + '<div style="text-align: center; padding: 24px 16px; color: #94a3b8; font-size: 13px;">' +
                    'No se encontraron pistas que coincidan con la búsqueda.' +
                '</div>';
            }
            return;
        }

        var enVistaPlaylist = !!state.playlistSeleccionada;
        var html = encabezadoFiltro;
        listaFiltrada.forEach(function(c, listIndex) {
            var esActual = (state.cancionActual && state.cancionActual.id === c.id);
            var sonando = esActual && state.reproduciendo;
            var metaTrack = obtenerTituloLimpoYArtista(c);
            var cachedArt = state.artworkCache[c.id];
            var tieneArtLista = !!(cachedArt && cachedArt !== 'none');
            var playsTrack = obtenerReproduccionesCancion(c);

            var accionDerecha = enVistaPlaylist
                ? '<button type="button" class="btn-pl-remove-track" title="Quitar de esta lista (mantiene el MP3 en tu biblioteca)" onclick="window.MonarcaPlayer.quitarCancionDePlaylist(\'' + state.playlistSeleccionada + '\', \'' + c.id + '\')">Quitar</button>'
                : ('<button type="button" class="btn-song-icon-ctrl" title="Añadir a lista de reproducción" onclick="window.MonarcaPlayer.abrirModalAgregarPlaylist(\'' + c.id + '\')">' + SVG_LIST_PLUS + '</button>' +
                   '<button type="button" id="btn-transfer-' + c.id + '" class="btn-song-icon-ctrl" title="Enviar únicamente esta canción a la PC" onclick="window.MonarcaPlayer.enviarCancionAPC(\'' + c.id + '\')">' + SVG_CLOUD_UP + '</button>' +
                   (c.origen !== 'mediastore' ? '<button type="button" class="btn-song-icon-ctrl" title="Descargar archivo local" onclick="window.MonarcaPlayer.descargarCancionArchivoLocal(\'' + c.id + '\')">' + SVG_DOWNLOAD + '</button>' : '') +
                   (c.origen !== 'mediastore' ? '<button type="button" class="btn-song-delete" title="Eliminar de caché local" onclick="window.MonarcaPlayer.eliminarCancion(\'' + c.id + '\')">✕</button>' : ''));

            var tieneArtistaConocido = (metaTrack.artista && metaTrack.artista !== 'Artista desconocido');
            var carpetaTxt = (c.carpeta || 'Principal');
            var metaSubHtml = '';
            if (tieneArtistaConocido) {
                metaSubHtml += '<span class="song-meta-artist">' + escaparHTML(metaTrack.artista) + '</span>';
                if (!filtroSnapActivo && !enVistaPlaylist) {
                    metaSubHtml += '<span class="song-meta-dot">·</span><span>' + escaparHTML(carpetaTxt) + '</span>';
                }
                metaSubHtml += '<span class="song-meta-dot">·</span><span>' + formatearTamano(c.tamano) + '</span>';
            } else {
                metaSubHtml += '<span>' + escaparHTML(carpetaTxt) + '</span><span class="song-meta-dot">·</span><span>' + formatearTamano(c.tamano) + '</span>';
            }
            var smartPillHtml = ((enVistaPlaylist && (state.modoInteligente || playsTrack > 0)) || (state.modoInteligente && playsTrack > 0))
                ? ('<span class="song-play-count-pill' + (state.modoInteligente ? ' is-smart' : '') + '">' +
                    (state.modoInteligente ? ('#' + (listIndex + 1) + ' · ') : '') + '🎧 ' + playsTrack +
                   '</span>')
                : '';

            html += '<div class="song-list-item ' + (esActual ? 'active-song' : '') + '" data-song-id="' + escaparHTML(c.id) + '" onclick="window.MonarcaPlayer.reproducirPorId(this.getAttribute(\'data-song-id\'))">' +
                '<div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; overflow: hidden;">' +
                    '<div class="song-thumb-box ' + (esActual ? 'is-playing-item' : '') + '">' +
                        '<img class="song-thumb-img" data-art-song="' + escaparHTML(c.id) + '" src="' + (tieneArtLista ? escaparHTML(cachedArt) : '') + '" alt="" style="display: ' + (tieneArtLista ? 'block' : 'none') + ';">' +
                        '<span class="song-thumb-placeholder" style="display: ' + (tieneArtLista ? 'none' : 'flex') + ';">' +
                            (sonando
                                ? '<span class="mini-equalizer-bars"><span></span><span></span><span></span></span>'
                                : (esActual ? '▶' : (listIndex + 1))) +
                        '</span>' +
                    '</div>' +
                    '<div style="min-width: 0; flex: 1; overflow: hidden;">' +
                        '<div class="song-item-title ' + (esActual ? 'is-active-title' : '') + '">' + escaparHTML(metaTrack.titulo) + '</div>' +
                        '<div class="song-item-meta">' + metaSubHtml + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="song-row-actions" onclick="event.stopPropagation();">' +
                    smartPillHtml +
                    accionDerecha +
                '</div>' +
            '</div>';
        });

        cont.innerHTML = html;
        observarMiniaturasLista();
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
        if (sub) sub.textContent = song ? song.nombre : 'Selecciona una o más listas';

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
        if (sub) sub.textContent = pl.nombre;

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
                    '<button type="button" class="btn-pl-nueva-cta" onclick="window.MonarcaPlayer.abrirModalCrearPlaylist(\'' + songId + '\')">Crear Lista y Agregar</button>' +
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
                '<button type="button" class="btn-pl-action-add" style="margin-right: auto;" onclick="window.MonarcaPlayer.abrirModalCrearPlaylist(\'' + songId + '\')">+ Nueva Lista</button>' +
                '<button type="button" class="btn-system pl-modal-btn-primary" style="margin-bottom: 0;" onclick="window.MonarcaPlayer.cerrarModalAgregarPlaylist()">✓ Listo</button>';
            return;
        }

        // Modo 'playlist': agregar múltiples canciones de la biblioteca activa a la playlist
        var visiblesModal = obtenerCancionesActivasScope();
        if (visiblesModal.length === 0) {
            cuerpo.innerHTML = '<div class="pl-empty-card">' +
                '<div class="pl-empty-icon">🎧</div>' +
                '<h4>No hay MP3 en tu biblioteca</h4>' +
                '<p>Carga canciones desde tu dispositivo para poder añadirlas a esta lista.</p>' +
                '<button type="button" class="btn-lib-primary-noir" onclick="window.MonarcaPlayer.cerrarModalAgregarPlaylist(); document.getElementById(\'input-file-mp3-monarca\').click();">Importar Archivos MP3</button>' +
            '</div>';
            footer.innerHTML = '<button type="button" class="btn-back-system" style="margin-bottom: 0;" onclick="window.MonarcaPlayer.cerrarModalAgregarPlaylist()">Cerrar</button>';
            return;
        }

        cuerpo.innerHTML =
            '<div class="pl-picker-toolbar">' +
                '<input type="text" id="input-buscar-song-modal-playlist" class="modal-input pl-picker-search" placeholder="Filtrar por título o artista..." value="' + escaparHTML(state._modalAgregarFiltro || '') + '" oninput="window.MonarcaPlayer.filtrarModalPlaylistCanciones(this.value)">' +
                '<button type="button" class="btn-pl-back-pill" onclick="window.MonarcaPlayer.toggleTodasVisibleModalPlaylist()">✓ Seleccionar visibles</button>' +
            '</div>' +
            '<div id="modal-pl-song-list-inner" class="pl-picker-song-list"></div>';

        renderizarListaCancionesModalInner();
    }

    function obtenerCancionesFiltradasModal() {
        var f = (state._modalAgregarFiltro || '').toLowerCase().trim();
        return obtenerCancionesActivasScope().filter(function(c) {
            if (!f) return true;
            return (c.nombre || '').toLowerCase().indexOf(f) !== -1 ||
                   (c.artista || '').toLowerCase().indexOf(f) !== -1 ||
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
                var metaM = obtenerTituloLimpoYArtista(c);
                var artistaSeg = (metaM.artista && metaM.artista !== 'Artista desconocido') ? (escaparHTML(metaM.artista) + ' · ') : '';
                html += '<button type="button" class="pl-picker-song-row' + (marcado ? ' is-selected' : '') + '" onclick="window.MonarcaPlayer.toggleSeleccionCancionEnModal(\'' + c.id + '\')">' +
                    '<div class="pl-picker-check">' + (marcado ? '✓' : '') + '</div>' +
                    '<div class="pl-picker-text">' +
                        '<div class="pl-picker-name">' + escaparHTML(metaM.titulo) + '</div>' +
                        '<div class="pl-picker-sub">' + artistaSeg + '📁 ' + escaparHTML(c.carpeta || 'Principal') + ' · ' + formatearTamano(c.tamano) + '</div>' +
                    '</div>' +
                    '<span class="pl-picker-status' + (marcado ? ' is-added' : '') + '">' + (marcado ? 'Seleccionada' : '+ Añadir') + '</span>' +
                '</button>';
            });
            contInner.innerHTML = html;
        }

        if (footer) {
            var totalSel = selSet.size;
            footer.innerHTML =
                '<span class="pl-modal-footer-meta">' + totalSel + (totalSel === 1 ? ' canción seleccionada' : ' canciones seleccionadas') + '</span>' +
                '<div class="pl-modal-footer-actions">' +
                    '<button type="button" class="btn-back-system" style="margin-bottom: 0;" onclick="window.MonarcaPlayer.cerrarModalAgregarPlaylist()">Cancelar</button>' +
                    '<button type="button" id="btn-pl-guardar-canciones" class="btn-system pl-modal-btn-primary" style="margin-bottom: 0;" onclick="window.MonarcaPlayer.confirmarCancionesEnPlaylistModal()">✓ Guardar en Lista (' + totalSel + ')</button>' +
                '</div>';
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
        pl.cancionSigs = construirFirmasParaIds(pl.cancionIds);
        pl.fechaActualizacion = Date.now();
        guardarPlaylistsStorage();
        notificarCambioPlaylistsYDefault();
        cerrarModalAgregarPlaylist();
        renderizarContenidoSegunSubtab();
        actualizarUIPlayerCompleto();
        notificarPlayerToast('Lista "' + pl.nombre + '" actualizada (' + pl.cancionIds.length + ')', '🎶');
    }

    // ----------------------------------------------------------------------
    // 7B. DETECCIÓN DE MÚSICA NUEVA AL ENTRAR & CLASIFICACIÓN POR PLAYLIST
    // ----------------------------------------------------------------------
    var REGLAS_GENERO_PLAYLIST = [
        {
            plKeys: ['entren', 'gym', 'rutin', 'work', 'cardio', 'fit', 'motiv', 'bestia', 'power', 'fuerza', 'pesa'],
            trackKeys: ['phonk', 'hardstyle', 'workout', 'gym', 'fitness', 'power', 'beast', 'motiv', 'remix', 'trap', 'rap', 'hip hop', 'hiphop', 'rock', 'metal', 'electronic', 'edm', 'eminem', 'linkin park', 'nf ', 'neffex', 'skillet']
        },
        {
            plKeys: ['salsa', 'guaguanc', 'sonero', 'timba', 'tropical'],
            trackKeys: ['salsa', 'ruben blades', 'hector lavoe', 'eddie santiago', 'oscar d', 'gilberto santa', 'marc anthony', 'frankie ruiz', 'maelo ruiz', 'willie colon', 'grupo niche', 'gran combo', 'guayacan', 'cheo feliciano', 'tito nieves', 'jerry rivera', 'victor manuelle', 'adolescentes']
        },
        {
            plKeys: ['llaner', 'joropo', 'crioll', 'folkl', 'sabana'],
            trackKeys: ['llaner', 'joropo', 'arpa', 'cuatro', 'reinaldo armas', 'luis silva', 'cholo valderrama', 'scarlett linares', 'jorge guerrero', 'armando martinez', 'reyna lucero', 'cristobal jimenez', 'vitico castillo', 'teodoro', 'francisco montoya', 'guillermo', 'enrique hidalgo', 'walter silva']
        },
        {
            plKeys: ['bachat', 'romant'],
            trackKeys: ['bachat', 'romeo santos', 'aventura', 'prince royce', 'juan luis guerra', 'frank reyes', 'zacar', 'kewin']
        },
        {
            plKeys: ['mereng'],
            trackKeys: ['mereng', 'eddy herrera', 'sergio vargas', 'elvis crespo', 'wilfrido', 'miriam cruz', 'los hermanos rosario', 'bony cepeda', 'fulanito']
        },
        {
            plKeys: ['reggaet', 'urban', 'perreo'],
            trackKeys: ['reggaet', 'bad bunny', 'feid', 'karol g', 'daddy yankee', 'j balvin', 'rauw alejandro', 'ozuna', 'anuel', 'myke towers', 'arcangel', 'plan b', 'wisin', 'yandel']
        },
        {
            plKeys: ['enfoq', 'estudi', 'relax', 'lofi', 'chill', 'concentr'],
            trackKeys: ['lofi', 'lo-fi', 'chill', 'ambient', 'focus', 'study', 'piano', 'medit', 'relax', 'binaural', 'instrumental']
        }
    ];

    function normalizarTextoMusica(txt) {
        var s = String(txt || '').toLowerCase();
        try {
            if (typeof s.normalize === 'function') {
                s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            }
        } catch (e) {}
        return s.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function _cargarConocidasStorage() {
        try {
            var raw = localStorage.getItem(PLAYER_KNOWN_SONGS_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || !parsed.keys) return null;
            return parsed;
        } catch (e) {
            return null;
        }
    }

    function _guardarConocidasStorage(data) {
        try {
            localStorage.setItem(PLAYER_KNOWN_SONGS_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    function _keysDeCancion(meta) {
        var keys = [];
        if (!meta) return keys;
        if (meta.id) keys.push('id:' + String(meta.id));
        if (meta.sig) keys.push('sig:' + String(meta.sig));
        if (meta.archivo && meta.tamano) {
            keys.push('file:' + String(meta.archivo).toLowerCase() + '__' + (Number(meta.tamano) || 0));
        }
        return keys;
    }

    function esCancionConocida(meta, knownMap) {
        if (!knownMap) return false;
        var keys = _keysDeCancion(meta);
        for (var i = 0; i < keys.length; i++) {
            if (knownMap[keys[i]]) return true;
        }
        return false;
    }

    function marcarCancionesComoConocidas(cancionesList) {
        var data = _cargarConocidasStorage() || { initialized: true, updatedAt: Date.now(), keys: {} };
        data.initialized = true;
        data.updatedAt = Date.now();
        var ahora = Date.now();
        (cancionesList || []).forEach(function(c) {
            _keysDeCancion(c).forEach(function(k) {
                if (!data.keys[k]) data.keys[k] = ahora;
            });
        });
        _guardarConocidasStorage(data);
        return data;
    }

    function estaCancionEnAlgunaPlaylist(song) {
        if (!song || !Array.isArray(state.playlists)) return false;
        return state.playlists.some(function(pl) {
            if (!pl) return false;
            if (Array.isArray(pl.cancionIds) && song.id && pl.cancionIds.indexOf(song.id) !== -1) return true;
            if (Array.isArray(pl.cancionSigs) && song.sig) {
                return pl.cancionSigs.some(function(s) { return s && (s.sig === song.sig || s.id === song.id); });
            }
            return false;
        });
    }

    function evaluarNuevasCancionesParaTriage() {
        var activas = obtenerCancionesActivasScope();
        var stored = _cargarConocidasStorage();

        if (!stored || !stored.initialized) {
            if (state.nativoActivo || activas.length > 0) {
                marcarCancionesComoConocidas(activas);
            }
            return state._triageCola;
        }

        var enColaMap = {};
        state._triageCola.forEach(function(c) {
            _keysDeCancion(c).forEach(function(k) { enColaMap[k] = true; });
        });

        var yaEnPlaylist = [];
        var nuevasDetectadas = [];
        activas.forEach(function(c) {
            if (!c) return;
            if (esCancionConocida(c, stored.keys)) return;
            if (estaCancionEnAlgunaPlaylist(c)) {
                yaEnPlaylist.push(c);
                return;
            }
            if (esCancionConocida(c, enColaMap)) return;
            nuevasDetectadas.push(c);
        });

        if (yaEnPlaylist.length > 0) {
            marcarCancionesComoConocidas(yaEnPlaylist);
        }

        if (nuevasDetectadas.length > 0) {
            // Priorizar más recientes primero
            nuevasDetectadas.sort(function(a, b) { return (b.fecha || 0) - (a.fecha || 0); });
            state._triageCola = state._triageCola.concat(nuevasDetectadas);
            if (!state._triageModalAbierto) {
                state._triageTotalInicial = state._triageCola.length;
            }
        }
        return state._triageCola;
    }

    function clasificarPlaylistsParaCancionNueva(song) {
        var playlists = Array.isArray(state.playlists) ? state.playlists.slice() : [];
        var sugerencias = {};
        if (!song || playlists.length === 0) {
            return { orderedPlaylists: playlists, sugerencias: sugerencias, bestPlId: null };
        }

        var metaInfo = obtenerTituloLimpoYArtista(song);
        var trackArtistNorm = normalizarTextoMusica(
            (metaInfo.artista && metaInfo.artista !== 'Artista desconocido') ? metaInfo.artista : ''
        );
        var trackFullNorm = normalizarTextoMusica(
            [song.nombre, song.artista, song.album, song.carpeta, metaInfo.titulo, metaInfo.artista].join(' ')
        );

        var songsById = {};
        var songsBySig = {};
        (state.canciones || []).forEach(function(c) {
            if (!c) return;
            if (c.id) songsById[c.id] = c;
            if (c.sig) songsBySig[c.sig] = c;
        });

        playlists.forEach(function(pl) {
            if (!pl || !pl.id) return;
            var score = 0;
            var motivo = '';
            var plNameNorm = normalizarTextoMusica(pl.nombre || '');

            // 1. Mismo artista que canciones ya guardadas en la playlist
            if (trackArtistNorm && trackArtistNorm.length >= 3) {
                var artistsInPl = {};
                (pl.cancionIds || []).forEach(function(cid) {
                    var found = songsById[cid];
                    if (found) {
                        var inf = obtenerTituloLimpoYArtista(found);
                        var an = normalizarTextoMusica(inf.artista !== 'Artista desconocido' ? inf.artista : '');
                        if (an.length >= 3) artistsInPl[an] = true;
                    }
                });
                (pl.cancionSigs || []).forEach(function(cs) {
                    var found = cs && (songsById[cs.id] || (cs.sig ? songsBySig[cs.sig] : null));
                    if (found) {
                        var inf = obtenerTituloLimpoYArtista(found);
                        var an = normalizarTextoMusica(inf.artista !== 'Artista desconocido' ? inf.artista : '');
                        if (an.length >= 3) artistsInPl[an] = true;
                    }
                });
                var artKeys = Object.keys(artistsInPl);
                for (var i = 0; i < artKeys.length; i++) {
                    var ak = artKeys[i];
                    if (ak === trackArtistNorm || trackArtistNorm.indexOf(ak) !== -1 || ak.indexOf(trackArtistNorm) !== -1) {
                        score += 100;
                        motivo = 'Artista frecuente aquí';
                        break;
                    }
                }
            }

            // 2. Coincidencia de categoría/género (entrenamiento, salsa, llaneras, etc.)
            for (var r = 0; r < REGLAS_GENERO_PLAYLIST.length; r++) {
                var regla = REGLAS_GENERO_PLAYLIST[r];
                var plMatches = regla.plKeys.some(function(pk) { return plNameNorm.indexOf(pk) !== -1; });
                if (!plMatches) continue;
                var trMatches = regla.trackKeys.some(function(tk) { return trackFullNorm.indexOf(tk) !== -1; });
                if (trMatches) {
                    score += 65;
                    if (!motivo) motivo = 'Coincide con categoría';
                    break;
                }
            }

            // 3. Coincidencia directa por palabra clave del nombre de la playlist
            var plWords = plNameNorm.split(' ').filter(function(w) { return w.length >= 3; });
            if (plWords.some(function(w) { return trackFullNorm.indexOf(w) !== -1; })) {
                score += 55;
                if (!motivo) motivo = 'Coincide con título';
            }

            if (score > 0) {
                sugerencias[pl.id] = { score: score, motivo: motivo };
            }
        });

        playlists.sort(function(a, b) {
            var sa = (a && a.id && sugerencias[a.id]) ? sugerencias[a.id].score : 0;
            var sb = (b && b.id && sugerencias[b.id]) ? sugerencias[b.id].score : 0;
            if (sb !== sa) return sb - sa;
            return (a.nombre || '').localeCompare(b.nombre || '');
        });

        var bestPl = playlists.length > 0 && sugerencias[playlists[0].id] ? playlists[0].id : null;
        return { orderedPlaylists: playlists, sugerencias: sugerencias, bestPlId: bestPl };
    }

    function prepararPasoActualTriage() {
        if (!Array.isArray(state._triageCola) || state._triageCola.length === 0) return null;
        var song = state._triageCola[0];
        var cls = clasificarPlaylistsParaCancionNueva(song);
        state._triageSugerencias = cls.sugerencias || {};
        state._triageSeleccionPlIds = cls.bestPlId ? [cls.bestPlId] : [];
        return { song: song, orderedPlaylists: cls.orderedPlaylists };
    }

    function intentarAbrirModalNuevaMusica() {
        if (window.VISTA_ACTUAL !== 'vista-reproductor') return false;
        if (!state._dbReady || state._triageModalAbierto) return false;
        if (!Array.isArray(state._triageCola) || state._triageCola.length === 0) return false;

        // Validar contra baseline actualizado por si cambió en paralelo
        var stored = _cargarConocidasStorage();
        var keys = (stored && stored.keys) ? stored.keys : {};
        var activasMap = {};
        obtenerCancionesActivasScope().forEach(function(c) {
            if (c && c.id) activasMap[c.id] = c;
        });
        state._triageCola = state._triageCola.filter(function(c) {
            return c && c.id && activasMap[c.id] && !esCancionConocida(c, keys) && !estaCancionEnAlgunaPlaylist(c);
        });
        if (state._triageCola.length === 0) return false;

        state._triageModalAbierto = true;
        state._triageTotalInicial = Math.max(state._triageTotalInicial || 0, state._triageCola.length);
        prepararPasoActualTriage();
        renderizarModalNuevaMusica();

        var modal = document.getElementById('modal-reproductor-nueva-musica');
        if (modal) modal.style.display = 'flex';
        return true;
    }

    function togglePlaylistNuevaMusica(plId) {
        var idx = state._triageSeleccionPlIds.indexOf(plId);
        if (idx === -1) {
            state._triageSeleccionPlIds.push(plId);
        } else {
            state._triageSeleccionPlIds.splice(idx, 1);
        }
        renderizarModalNuevaMusica();
    }

    function togglePreviewNuevaMusica() {
        var song = state._triageCola[0];
        if (!song) return;
        if (state.cancionActual && state.cancionActual.id === song.id && state.reproduciendo) {
            pausarActual();
        } else {
            state._triagePreviewStarted = true;
            state.rutinaPreviaSnapshot = null;
            state._rutinaTransicionandoSalida = false;
            salirModoRutinaSilencioso(false);
            reproducirMetaCancion(song, -1, { esPreview: true });
        }
        renderizarModalNuevaMusica();
    }

    function abrirModalCrearPlaylistDesdeTriage() {
        state._triageCrearPendiente = true;
        abrirModalCrearPlaylist(null);
    }

    function renderizarModalNuevaMusica() {
        var cuerpo = document.getElementById('modal-nueva-musica-cuerpo');
        var footer = document.getElementById('modal-nueva-musica-footer');
        var badge = document.getElementById('modal-nueva-musica-badge');
        var sub = document.getElementById('modal-nueva-musica-subtitulo');
        if (!cuerpo || !footer) return;

        var totalPendientes = state._triageCola.length;
        if (totalPendientes === 0) {
            cerrarModalNuevaMusica(false);
            return;
        }

        var song = state._triageCola[0];
        var cls = clasificarPlaylistsParaCancionNueva(song);
        var playlists = cls.orderedPlaylists;
        var sugerencias = state._triageSugerencias || cls.sugerencias || {};
        var totalInicial = Math.max(state._triageTotalInicial || totalPendientes, totalPendientes);
        var pasoActual = (totalInicial - totalPendientes) + 1;

        if (badge) {
            if (totalInicial > 1) {
                badge.textContent = pasoActual + ' de ' + totalInicial;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }
        }

        var hasSuggested = !!(cls.bestPlId && sugerencias[cls.bestPlId]);
        var bestPlObj = hasSuggested ? playlists.find(function(p) { return p.id === cls.bestPlId; }) : null;
        if (sub) {
            sub.textContent = bestPlObj
                ? ('Sugerencia: "' + bestPlObj.nombre + '" · Puedes elegir una o más listas')
                : 'Elige en qué categoría o playlist guardarla';
        }

        var metaInfo = obtenerTituloLimpoYArtista(song);
        var coverUrl = (state.artworkCache[song.id] && state.artworkCache[song.id] !== 'none') ? state.artworkCache[song.id] : '';
        var isPreviewPlaying = !!(state.cancionActual && state.cancionActual.id === song.id && state.reproduciendo);
        var subTrack = [];
        if (metaInfo.artista && metaInfo.artista !== 'Artista desconocido') subTrack.push(metaInfo.artista);
        if (song.carpeta) subTrack.push(song.carpeta);
        if (song.tamano) subTrack.push(formatearTamano(song.tamano));

        var bodyHtml =
            '<div class="triage-song-hero">' +
                '<div class="triage-song-cover">' +
                    '<img data-art-song="' + escaparHTML(song.id) + '" src="' + (coverUrl ? escaparHTML(coverUrl) : '') + '" alt="" style="display:' + (coverUrl ? 'block' : 'none') + ';">' +
                    '<span class="song-thumb-placeholder" style="display:' + (coverUrl ? 'none' : 'flex') + ';">🎵</span>' +
                '</div>' +
                '<div class="triage-song-info">' +
                    '<div class="triage-song-title">' + escaparHTML(metaInfo.titulo) + '</div>' +
                    '<div class="triage-song-sub">' + escaparHTML(subTrack.join(' · ') || 'Pista MP3 nueva') + '</div>' +
                '</div>' +
                '<button type="button" class="triage-btn-preview' + (isPreviewPlaying ? ' is-playing' : '') + '" onclick="window.MonarcaPlayer.togglePreviewNuevaMusica()">' +
                    (isPreviewPlaying ? '⏸ Pausar' : '▶ Escuchar') +
                '</button>' +
            '</div>';

        if (!coverUrl) {
            encolarCaratulaLazy(song);
        }

        if (playlists.length === 0) {
            bodyHtml +=
                '<div class="pl-empty-card" style="margin: 4px 0;">' +
                    '<div class="pl-empty-icon">📋</div>' +
                    '<h4>Aún no tienes playlists</h4>' +
                    '<p>Crea tus categorías (ej. Entrenamiento, Salsa, Llaneras) para organizar tu música nueva.</p>' +
                    '<button type="button" class="btn-pl-nueva-cta" onclick="window.MonarcaPlayer.abrirModalCrearPlaylistDesdeTriage()">+ Crear Primera Playlist</button>' +
                '</div>';
        } else {
            var selSet = new Set(state._triageSeleccionPlIds || []);
            bodyHtml +=
                '<div class="triage-section-label">' +
                    '<span>Selecciona playlist destino:</span>' +
                    '<span style="font-size:10.5px; font-weight:600; color:#94a3b8; text-transform:none;">' + selSet.size + ' elegida(s)</span>' +
                '</div>' +
                '<div class="pl-picker-list">';

            playlists.forEach(function(pl) {
                var sel = selSet.has(pl.id);
                var sug = sugerencias[pl.id];
                var count = (pl.cancionIds || []).length;
                bodyHtml +=
                    '<button type="button" class="pl-picker-playlist-row' + (sel ? ' is-selected' : '') + (sug ? ' is-suggested' : '') + '" onclick="window.MonarcaPlayer.togglePlaylistNuevaMusica(\'' + pl.id + '\')">' +
                        '<div class="pl-picker-row-left">' +
                            '<span class="pl-picker-icon">' + (sel ? '✓' : '🎶') + '</span>' +
                            '<div class="pl-picker-text">' +
                                '<div class="pl-picker-name">' + escaparHTML(pl.nombre) +
                                    (sug ? ('<span class="triage-suggest-pill">✦ Sugerida</span>') : '') +
                                '</div>' +
                                '<div class="pl-picker-sub">' + count + (count === 1 ? ' canción' : ' canciones') + (sug ? (' · ' + escaparHTML(sug.motivo)) : '') + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<span class="pl-picker-status' + (sel ? ' is-added' : '') + '">' + (sel ? 'Elegida ✓' : 'Elegir') + '</span>' +
                    '</button>';
            });
            bodyHtml += '</div>';
        }

        cuerpo.innerHTML = bodyHtml;

        var selCount = (state._triageSeleccionPlIds || []).length;
        var hasMore = totalPendientes > 1;
        footer.innerHTML =
            '<button type="button" class="btn-pl-action-add" style="margin-right: auto;" onclick="window.MonarcaPlayer.abrirModalCrearPlaylistDesdeTriage()">+ Nueva lista</button>' +
            (hasMore ? '<button type="button" class="btn-pl-back-pill" onclick="window.MonarcaPlayer.omitirTodasNuevasMusicas()">Omitir todas</button>' : '') +
            '<button type="button" class="btn-back-system" style="margin-bottom: 0;" onclick="window.MonarcaPlayer.omitirNuevaMusicaActual()">Omitir</button>' +
            (playlists.length > 0
                ? '<button type="button" id="btn-confirmar-nueva-musica-triage" class="btn-system pl-modal-btn-primary" style="margin-bottom: 0;"' + (selCount === 0 ? ' disabled' : '') + ' onclick="window.MonarcaPlayer.confirmarNuevaMusicaPlaylist()">' +
                    (hasMore ? ('✓ Guardar y siguiente (' + (totalPendientes - 1) + ')') : '✓ Guardar en Lista') +
                  '</button>'
                : '');
    }

    function _avanzarOCerrarTriage() {
        if (state._triagePreviewStarted && state.reproduciendo) {
            pausarActual();
        }
        state._triagePreviewStarted = false;
        if (state._triageCola.length > 0) {
            prepararPasoActualTriage();
            renderizarModalNuevaMusica();
        } else {
            cerrarModalNuevaMusica(false);
        }
    }

    function confirmarNuevaMusicaPlaylist() {
        if (!Array.isArray(state._triageCola) || state._triageCola.length === 0) {
            cerrarModalNuevaMusica(false);
            return;
        }
        var selIds = (state._triageSeleccionPlIds || []).slice();
        if (selIds.length === 0) {
            notificarPlayerToast('Elige al menos una playlist o toca Omitir', '🎶');
            return;
        }
        var song = state._triageCola[0];
        var nombresAgregados = [];
        selIds.forEach(function(plId) {
            var pl = state.playlists.find(function(p) { return p && p.id === plId; });
            if (pl) {
                agregarCancionAPlaylist(plId, song.id, true);
                nombresAgregados.push(pl.nombre);
            }
        });
        marcarCancionesComoConocidas([song]);
        state._triageCola.shift();
        notificarPlayerToast('Agregada a ' + nombresAgregados.join(', '), '✓');
        _avanzarOCerrarTriage();
    }

    function omitirNuevaMusicaActual() {
        if (state._triageCola.length > 0) {
            var song = state._triageCola.shift();
            marcarCancionesComoConocidas([song]);
        }
        _avanzarOCerrarTriage();
    }

    function omitirTodasNuevasMusicas() {
        if (state._triageCola.length > 0) {
            marcarCancionesComoConocidas(state._triageCola);
            state._triageCola = [];
        }
        cerrarModalNuevaMusica(false);
    }

    function cerrarModalNuevaMusica(omitirRestantes) {
        if (omitirRestantes !== false && Array.isArray(state._triageCola) && state._triageCola.length > 0) {
            marcarCancionesComoConocidas(state._triageCola);
            state._triageCola = [];
        }
        if (state._triagePreviewStarted && state.reproduciendo) {
            pausarActual();
        }
        state._triagePreviewStarted = false;
        state._triageModalAbierto = false;
        state._triageTotalInicial = 0;
        state._triageSeleccionPlIds = [];
        state._triageSugerencias = {};
        var modal = document.getElementById('modal-reproductor-nueva-musica');
        if (modal) modal.style.display = 'none';
    }

    // ----------------------------------------------------------------------
    // 8. RENDERIZADO DEL PLAYER HERO & MINI-REPRODUCTOR FLOTANTE
    // ----------------------------------------------------------------------
    var SVG_HEART_OUTLINE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    var SVG_HEART_SOLID = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';

    function actualizarHeroHeartButton(songId) {
        var btnHeart = document.getElementById('btn-hero-add-playlist');
        if (!btnHeart) return;
        if (!songId) {
            btnHeart.style.display = 'none';
            btnHeart.classList.remove('in-playlist');
            return;
        }
        btnHeart.style.display = 'inline-flex';
        var enLista = state.playlists.some(function(pl) {
            return pl && Array.isArray(pl.cancionIds) && pl.cancionIds.indexOf(songId) !== -1;
        });
        btnHeart.classList.toggle('in-playlist', enLista);
        btnHeart.innerHTML = enLista ? (SVG_HEART_SOLID + '<span>En lista</span>') : (SVG_HEART_OUTLINE + '<span>Lista</span>');
    }

    function actualizarUIPlayerCompleto() {
        var elTitulo = document.getElementById('player-current-title');
        var elArtista = document.getElementById('player-current-artist');
        var elSub = document.getElementById('player-current-subtitle');
        var elDisc = document.getElementById('player-vinyl-disc');
        var btnPlay = document.getElementById('player-btn-play-main');
        var waveContainer = document.getElementById('player-sound-waves');

        var tieneCancion = !!state.cancionActual;
        var metaInfo = tieneCancion ? obtenerTituloLimpoYArtista(state.cancionActual) : null;
        var visibles = obtenerCancionesActivasScope();

        if (elTitulo) {
            elTitulo.textContent = tieneCancion ? metaInfo.titulo : 'Ninguna canción seleccionada';
        }
        if (elArtista) {
            if (tieneCancion) {
                var albumPart = (state.cancionActual.album && state.cancionActual.album.trim())
                    ? (' · ' + state.cancionActual.album.trim())
                    : '';
                elArtista.textContent = metaInfo.artista + albumPart;
                elArtista.style.display = 'block';
            } else {
                elArtista.textContent = '';
                elArtista.style.display = 'none';
            }
        }
        if (elSub) {
            if (tieneCancion) {
                var carpetaNom = state.cancionActual.carpeta ? state.cancionActual.carpeta : '';
                elSub.textContent = (carpetaNom ? (carpetaNom + ' · ') : '') + formatearTamano(state.cancionActual.tamano);
            } else {
                elSub.textContent = visibles.length > 0
                    ? (visibles.length + ' pistas listas sin conexión')
                    : (state.nativoActivo ? 'Sin archivos de música detectados' : 'Concede permiso de audio o importa archivos MP3');
            }
        }

        actualizarHeroHeartButton(tieneCancion ? state.cancionActual.id : null);

        if (tieneCancion) {
            var cachedArt = state.artworkCache[state.cancionActual.id];
            actualizarHeroCaratula((cachedArt && cachedArt !== 'none') ? cachedArt : null);
        } else {
            actualizarHeroCaratula(null);
        }

        if (elDisc) {
            elDisc.classList.toggle('spinning', state.reproduciendo);
        }
        if (waveContainer) {
            waveContainer.classList.toggle('playing', state.reproduciendo);
        }

        if (btnPlay) {
            if (state.reproduciendo) {
                btnPlay.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
                btnPlay.title = 'Pausar';
            } else {
                btnPlay.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style="margin-left:2px;"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                btnPlay.title = 'Reproducir';
            }
        }
    }

    function actualizarBarraAudioRutina() {
        var bar = document.getElementById('rutina-musica-live-bar');
        if (!bar) return;

        var elPl = document.getElementById('rutina-musica-live-playlist');
        var elStatus = document.getElementById('rutina-musica-live-status');
        var elIcon = document.getElementById('rutina-musica-live-icon');
        var selAct = document.getElementById('select-playlist-rutina-activa');

        var plActivaId = state.rutinaModoActivo ? state.rutinaPlaylistActivaId : getPlaylistDefaultRutinaId();
        var plObj = plActivaId ? state.playlists.find(function(p) { return p && p.id === plActivaId; }) : null;
        var tracksPl = plObj ? obtenerCancionesDePlaylist(plObj.id) : [];

        var sonandoAhora = !!(state.reproduciendo && !state._rutinaTransicionandoSalida);
        bar.classList.toggle('is-playing', sonandoAhora);

        if (elIcon) {
            elIcon.classList.toggle('playing', sonandoAhora);
        }

        if (elStatus) {
            elStatus.classList.toggle('is-playing', !!(state.rutinaModoActivo && sonandoAhora && plObj));
            if (state._rutinaTransicionandoSalida) {
                elStatus.textContent = '↘ Bajando...';
            } else if (state.rutinaModoActivo && state.reproduciendo && plObj) {
                elStatus.textContent = '● Sonando';
            } else if (state.rutinaModoActivo && state.cancionActual && plObj) {
                elStatus.textContent = '❚❚ En pausa';
            } else if (plObj && tracksPl.length === 0) {
                elStatus.textContent = '⚠ Vacía';
            } else if (plObj) {
                elStatus.textContent = '○ Lista';
            } else {
                elStatus.textContent = '🔇 Silencio';
            }
        }

        if (elPl) {
            if (plObj) {
                elPl.textContent = tracksPl.length > 0 ? plObj.nombre : (plObj.nombre + ' (sin canciones)');
            } else {
                elPl.textContent = 'Sin playlist seleccionada';
            }
        }

        if (selAct) {
            var targetVal = plActivaId || '';
            var existeOpt = Array.prototype.some.call(selAct.options, function(o) { return o.value === targetVal; });
            if (existeOpt && selAct.value !== targetVal) {
                selAct.value = targetVal;
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
        var metaMini = obtenerTituloLimpoYArtista(state.cancionActual);

        var elTit = document.getElementById('mini-player-title');
        if (elTit) {
            elTit.textContent = metaMini.titulo || 'Reproduciendo...';
        }

        var elSubTxt = document.getElementById('mini-player-subtitle-text');
        if (elSubTxt) {
            if (state.rutinaModoActivo && state.rutinaPlaylistActivaId) {
                var plAct = state.playlists.find(function(p) { return p && p.id === state.rutinaPlaylistActivaId; });
                elSubTxt.textContent = (plAct ? plAct.nombre : 'Rutina') + ' · Aleatorio';
            } else {
                elSubTxt.textContent = metaMini.artista || 'Emily Audio Deck';
            }
        }

        var cachedMiniArt = state.artworkCache[state.cancionActual.id];
        actualizarMiniCaratula((cachedMiniArt && cachedMiniArt !== 'none') ? cachedMiniArt : null);

        var btnPlay = document.getElementById('mini-player-btn-play');
        if (btnPlay) {
            if (state.reproduciendo) {
                btnPlay.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
                btnPlay.title = 'Pausar';
            } else {
                btnPlay.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style="margin-left:1px;"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
                btnPlay.title = 'Reproducir';
            }
        }

        var iconDisc = document.getElementById('mini-player-disc-icon');
        if (iconDisc) {
            var hasArt = !!(cachedMiniArt && cachedMiniArt !== 'none');
            iconDisc.classList.toggle('spinning', state.reproduciendo && !hasArt);
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
    function buscarCancionPorIdOSig(songId, songSig) {
        var found = null;
        if (songId) {
            found = state.canciones.find(function(c) { return c.id === songId; }) || null;
        }
        if (!found && songSig) {
            found = state.canciones.find(function(c) { return c.sig === songSig; }) || null;
        }
        return found;
    }

    function obtenerAudioBlob(songId, songSig) {
        var target = buscarCancionPorIdOSig(songId, songSig);
        var lookupId = target ? target.id : songId;
        if (!lookupId) return Promise.resolve(null);
        return obtenerCancionCompleta(lookupId).then(function(item) {
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
    function verificarPermisoNativoAlVolver(desdeRetornoApp) {
        var enPlayer = (window.VISTA_ACTUAL === 'vista-reproductor');
        var plugin = obtenerPluginMonarcaMedia();
        if (!plugin || typeof plugin.estadoPermisoAudio !== 'function') {
            if (desdeRetornoApp && enPlayer) {
                reescanearBibliotecaNativa('nuevas');
            }
            return;
        }
        plugin.estadoPermisoAudio().then(function(perm) {
            var nuevoEstado = (perm && perm.granted) ? 'granted' : ((perm && perm.state) || 'prompt');
            var cambio = (nuevoEstado === 'granted' && state.mediaPermiso !== 'granted');
            state.mediaPermiso = nuevoEstado;
            state.mediaPermisoChecked = true;
            if (cambio || (desdeRetornoApp && enPlayer)) {
                reescanearBibliotecaNativa('nuevas');
            } else {
                actualizarControlesFuenteBiblioteca();
            }
        }).catch(function() {});
    }

    function init() {
        var elAudio = document.getElementById('monarca-player-audio');
        if (elAudio) {
            state.audio = elAudio;
        }

        cargarPlaylistsStorage();
        cargarPlayStatsStorage();
        cargarModosReproductorStorage();
        if (!state._listenersBound) {
            state._listenersBound = true;
            initAudioListeners();
            initScrubberAntiAccidente();
            initMediaSession();
            initMonitorDesconexionAudifonos();
        }
        actualizarControlesFuenteBiblioteca();
        actualizarControlesModo();
        if (obtenerPluginMediaSession()) {
            obtenerArtworkDataUrl();
        }

        cargarMetadatosCanciones().then(function() {
            state._initialScanDone = true;
            cargarPlayStatsStorage();
            renderizarContenidoSegunSubtab();
            actualizarUIPlayerCompleto();
            actualizarMiniPlayer();
            actualizarBarraAudioRutina();
            actualizarControlesModo();
            if (window.VISTA_ACTUAL === 'vista-reproductor' && state._triageCola.length > 0) {
                intentarAbrirModalNuevaMusica();
            }
        }).catch(function(e) {
            console.error('[Reproductor] Error cargando canciones iniciales:', e);
        });

        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                verificarPermisoNativoAlVolver(true);
            }
        });

        window.addEventListener('focus', function() {
            if (window.VISTA_ACTUAL === 'vista-reproductor' && (Date.now() - state._lastAutoScanTs) > 1200) {
                verificarPermisoNativoAlVolver(true);
            }
        });

        // Enganchar input de archivos individuales (Navegador / PC o respaldo manual)
        var fileIn = document.getElementById('input-file-mp3-monarca');
        if (fileIn) {
            fileIn.addEventListener('change', function(e) {
                var files = e.target.files;
                if (files && files.length > 0) {
                    var loader = document.getElementById('reproductor-cargando-aviso');
                    if (loader) loader.style.display = 'block';

                    guardarCancionesFiles(files).then(function() {
                        evaluarNuevasCancionesParaTriage();
                        renderizarContenidoSegunSubtab();
                        actualizarUIPlayerCompleto();
                        fileIn.value = '';
                        if (loader) loader.style.display = 'none';
                        notificarPlayerToast('Se importaron ' + files.length + (files.length === 1 ? ' canción' : ' canciones'), '🎵');
                        if (window.VISTA_ACTUAL === 'vista-reproductor' && state._triageCola.length > 0) {
                            intentarAbrirModalNuevaMusica();
                        } else if (!state.cancionActual && state.canciones.length > 0) {
                            reproducirIndice(0);
                        }
                    }).catch(function(err) {
                        notificarPlayerToast('Error guardando archivos: ' + (err.message || err), '⚠️');
                        if (loader) loader.style.display = 'none';
                    });
                }
            });
        }

        // Enganchar input de carpetas completas (Navegador / PC o respaldo manual)
        var folderIn = document.getElementById('input-folder-mp3-monarca');
        if (folderIn) {
            folderIn.addEventListener('change', function(e) {
                var files = e.target.files;
                if (files && files.length > 0) {
                    var loader = document.getElementById('reproductor-cargando-aviso');
                    if (loader) loader.style.display = 'block';

                    guardarCancionesFiles(files).then(function() {
                        evaluarNuevasCancionesParaTriage();
                        renderizarContenidoSegunSubtab();
                        actualizarUIPlayerCompleto();
                        folderIn.value = '';
                        if (loader) loader.style.display = 'none';
                        notificarPlayerToast('Se cargaron ' + files.length + ' pistas organizadas por carpetas', '📂');
                        if (window.VISTA_ACTUAL === 'vista-reproductor' && state._triageCola.length > 0) {
                            intentarAbrirModalNuevaMusica();
                        }
                    }).catch(function(err) {
                        notificarPlayerToast('Error cargando carpeta: ' + (err.message || err), '⚠️');
                        if (loader) loader.style.display = 'none';
                    });
                }
            });
        }

        // Conectar escucha de transferencias de nube si MonarcaCloud está listo
        if (window.MonarcaCloud && typeof window.MonarcaCloud.escucharTransferencias === 'function') {
            window.MonarcaCloud.escucharTransferencias(alRecibirTransferenciasNube);
        }

        // Hook en cambiarVista: sincronizar automáticamente canciones nuevas al entrar al reproductor MP3
        var origCambiarVista = window.cambiarVista;
        if (typeof origCambiarVista === 'function') {
            window.cambiarVista = function(vistaId) {
                origCambiarVista.apply(this, arguments);
                if (window.VISTA_ACTUAL === 'vista-reproductor' && vistaId === 'vista-reproductor') {
                    sincronizarBibliotecaAlEntrar();
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
        reproducirPorId: reproducirPorId,
        togglePlayPausa: togglePlayPausa,
        pausarPorDesconexionAudio: pausarPorDesconexionAudio,
        siguienteCancion: function() { siguienteCancion(true); },
        anteriorCancion: anteriorCancion,
        cambiarSeek: cambiarSeek,
        cambiarVolumen: cambiarVolumen,
        toggleShuffle: toggleShuffle,
        toggleModoInteligente: toggleModoInteligente,
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
        agregarActualAPlaylist: agregarActualAPlaylist,
        reproducirPlaylistDirecto: reproducirPlaylistDirecto,
        reproducirPlaylistInteligente: reproducirPlaylistInteligente,
        reproducirTopCanciones: reproducirTopCanciones,
        registrarReproduccionCancion: registrarReproduccionCancion,
        obtenerReproduccionesCancion: obtenerReproduccionesCancion,
        obtenerTopCancionesLista: obtenerTopCancionesLista,
        cargarPlayStatsStorage: cargarPlayStatsStorage,
        eliminarPlaylist: eliminarPlaylist,
        abrirModalAgregarPlaylist: abrirModalAgregarPlaylist,
        abrirModalAgregarCancionesAPlaylist: abrirModalAgregarCancionesAPlaylist,
        cerrarModalAgregarPlaylist: cerrarModalAgregarPlaylist,
        toggleCancionEnPlaylistDesdeModal: toggleCancionEnPlaylistDesdeModal,
        filtrarModalPlaylistCanciones: filtrarModalPlaylistCanciones,
        toggleSeleccionCancionEnModal: toggleSeleccionCancionEnModal,
        toggleTodasVisibleModalPlaylist: toggleTodasVisibleModalPlaylist,
        confirmarCancionesEnPlaylistModal: confirmarCancionesEnPlaylistModal,
        evaluarNuevasCancionesParaTriage: evaluarNuevasCancionesParaTriage,
        clasificarPlaylistsParaCancionNueva: clasificarPlaylistsParaCancionNueva,
        intentarAbrirModalNuevaMusica: intentarAbrirModalNuevaMusica,
        renderizarModalNuevaMusica: renderizarModalNuevaMusica,
        togglePlaylistNuevaMusica: togglePlaylistNuevaMusica,
        togglePreviewNuevaMusica: togglePreviewNuevaMusica,
        confirmarNuevaMusicaPlaylist: confirmarNuevaMusicaPlaylist,
        omitirNuevaMusicaActual: omitirNuevaMusicaActual,
        omitirTodasNuevasMusicas: omitirTodasNuevasMusicas,
        cerrarModalNuevaMusica: cerrarModalNuevaMusica,
        abrirModalCrearPlaylistDesdeTriage: abrirModalCrearPlaylistDesdeTriage,
        marcarCancionesComoConocidas: marcarCancionesComoConocidas,
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
        buscarCancionPorIdOSig: buscarCancionPorIdOSig,
        prepararUrlReproduccion: prepararUrlReproduccion,
        solicitarPermisoYScanNativo: solicitarPermisoYScanNativo,
        reescanearBibliotecaNativa: reescanearBibliotecaNativa,
        sincronizarBibliotecaAlEntrar: sincronizarBibliotecaAlEntrar,
        abrirAjustesAudioNativo: abrirAjustesAudioNativo,
        sincronizarPlaylistsDesdeAppState: sincronizarPlaylistsDesdeAppState,
        toggleSoloSnapTube: toggleSoloSnapTube,
        obtenerCancionesActivasScope: obtenerCancionesActivasScope,
        generarFirmaCancion: generarFirmaCancion,
        extraerTagsID3v2File: extraerTagsID3v2File,
        getCanciones: getCancionesMeta,
        getState: function() { return state; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

})(window);
