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
        canciones: [],        // Metadatos { id, sig, origen, nombre, artista, album, carpeta, tamano, tipo, fecha, ruta, contentUri, albumId }
        playlists: [],        // { id, nombre, fecha, fechaActualizacion, cancionIds: [], cancionSigs: [] }
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
        _modalAgregarSeleccionIds: [],
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
        var btnReescan = document.getElementById('btn-player-reescanear');
        var descEl = document.getElementById('player-library-origin-desc');
        var plugin = obtenerPluginMonarcaMedia();

        if (plugin) {
            if (state.mediaPermiso === 'granted') {
                if (bannerPerm) bannerPerm.style.display = 'none';
                if (btnReescan) btnReescan.style.display = 'inline-flex';
                if (descEl) {
                    descEl.textContent = 'Sincronizado automáticamente con las carpetas de música reales de tu teléfono.';
                }
            } else {
                if (bannerPerm) bannerPerm.style.display = 'flex';
                if (btnReescan) btnReescan.style.display = 'none';
                if (btnAjustes) {
                    btnAjustes.style.display = (state.mediaPermiso === 'denied' || state.mediaPermiso === 'prompt-with-rationale') ? 'inline-flex' : 'none';
                }
                if (descEl) {
                    descEl.textContent = 'Concede permiso de audio para detectar tus canciones reales o carga MP3 manualmente.';
                }
            }
        } else {
            if (bannerPerm) bannerPerm.style.display = 'none';
            if (btnReescan) btnReescan.style.display = 'none';
        }
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
            cargarPlaylistsStorage();
            reconciliarPlaylistsConCanciones();
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
                renderizarContenidoSegunSubtab();
                actualizarUIPlayerCompleto();
                if (res && res.granted) {
                    notificarPlayerToast('Se detectaron ' + state.canciones.length + ' canciones de tu dispositivo', '🎶');
                }
                return !!(res && res.granted);
            });
        }).catch(function(e) {
            console.warn('[Reproductor Permiso]', e);
            return false;
        });
    }

    function reescanearBibliotecaNativa(mostrarToast) {
        return cargarMetadatosCanciones().then(function(list) {
            renderizarContenidoSegunSubtab();
            actualizarUIPlayerCompleto();
            if (mostrarToast) {
                notificarPlayerToast('Biblioteca actualizada: ' + list.length + ' canciones', '🔄');
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

        detenerMusicaDeRutina(true);
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

    function aplicarAmbientDesdeImagen(imgEl) {
        var hero = document.getElementById('player-hero-card');
        if (!hero) return;
        try {
            if (!imgEl || !imgEl.naturalWidth || !imgEl.naturalHeight) return;
            var canvas = document.createElement('canvas');
            canvas.width = 12;
            canvas.height = 12;
            var ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(imgEl, 0, 0, 12, 12);
            var data = ctx.getImageData(0, 0, 12, 12).data;
            var rSum = 0, gSum = 0, bSum = 0, count = 0;
            for (var i = 0; i < data.length; i += 4) {
                var r = data[i], g = data[i + 1], b = data[i + 2];
                var luma = 0.299 * r + 0.587 * g + 0.114 * b;
                if (luma < 25 || luma > 235) continue;
                rSum += r; gSum += g; bSum += b; count++;
            }
            if (count > 0) {
                var rf = Math.round(rSum / count);
                var gf = Math.round(gSum / count);
                var bf = Math.round(bSum / count);
                hero.style.setProperty('--player-accent-rgb', rf + ', ' + gf + ', ' + bf);
            }
        } catch (e) {
            hero.style.removeProperty('--player-accent-rgb');
        }
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
        reconciliarPlaylistsConCanciones();
        notificarCambioPlaylistsYDefault();
        renderizarContenidoSegunSubtab();
        actualizarBarraAudioRutina();
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
        seleccionarPlaylist(plId);
        var lista = obtenerListaReproducibleActual();
        if (lista.length > 0) {
            reproducirIndice(0);
        } else {
            notificarPlayerToast('No se encontraron pistas disponibles para esta lista', '🎵');
        }
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

    function reproducirMetaCancion(meta, idxEnLista, opciones) {
        if (!meta) return Promise.resolve(false);
        solicitarPermisoNotifReproductorSiFalta();
        var playSeq = ++state._playSeqId;
        state.indiceActual = (typeof idxEnLista === 'number') ? idxEnLista : -1;

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
            state.audio.volume = state.volumen;
            state.cancionActual = meta;

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
        }).catch(function(err) {
            if (playSeq !== state._playSeqId) return false;
            console.warn('[Reproducor] Error abriendo audio:', err);
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

    function reproducirPorId(songId) {
        if (!songId) return;
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
            html += '<div class="player-folder-card" data-folder-name="' + escaparHTML(nom) + '" onclick="window.MonarcaPlayer.seleccionarCarpeta(this.getAttribute(\'data-folder-name\'))">' +
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
            return (c.nombre || '').toLowerCase().indexOf(q) !== -1 ||
                   (c.artista || '').toLowerCase().indexOf(q) !== -1 ||
                   (c.carpeta || '').toLowerCase().indexOf(q) !== -1;
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
                '<p style="font-size: 12.5px; margin: 0 0 16px 0; color: #64748b;">Puedes conceder permiso de audio en Android o cargar MP3 manualmente.</p>' +
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
            var metaTrack = obtenerTituloLimpoYArtista(c);
            var cachedArt = state.artworkCache[c.id];
            var tieneArtLista = !!(cachedArt && cachedArt !== 'none');

            var accionDerecha = enVistaPlaylist
                ? '<button type="button" class="btn-pl-remove-track" title="Quitar de esta lista (mantiene el MP3 en tu biblioteca)" onclick="window.MonarcaPlayer.quitarCancionDePlaylist(\'' + state.playlistSeleccionada + '\', \'' + c.id + '\')">Quitar</button>'
                : ('<button type="button" id="btn-transfer-' + c.id + '" class="btn-song-option-pill" title="Enviar únicamente esta canción a la PC" onclick="window.MonarcaPlayer.enviarCancionAPC(\'' + c.id + '\')">☁️ PC</button>' +
                   '<button type="button" class="btn-song-option-pill" title="Añadir a lista de reproducción" onclick="window.MonarcaPlayer.abrirModalAgregarPlaylist(\'' + c.id + '\')">➕ Lista</button>' +
                   (c.origen !== 'mediastore' ? '<button type="button" class="btn-song-option-pill" title="Descargar archivo local" onclick="window.MonarcaPlayer.descargarCancionArchivoLocal(\'' + c.id + '\')">⬇️</button>' : '') +
                   (c.origen !== 'mediastore' ? '<button type="button" class="btn-song-delete" title="Eliminar de caché local" onclick="window.MonarcaPlayer.eliminarCancion(\'' + c.id + '\')">✕</button>' : ''));

            html += '<div class="song-list-item ' + (esActual ? 'active-song' : '') + '" data-song-id="' + escaparHTML(c.id) + '" onclick="window.MonarcaPlayer.reproducirPorId(this.getAttribute(\'data-song-id\'))">' +
                '<div style="display: flex; align-items: center; gap: 11px; min-width: 0; flex: 1; overflow: hidden;">' +
                    '<div class="song-thumb-box ' + (esActual ? 'is-playing-item' : '') + '">' +
                        '<img class="song-thumb-img" data-art-song="' + escaparHTML(c.id) + '" src="' + (tieneArtLista ? escaparHTML(cachedArt) : '') + '" alt="" style="display: ' + (tieneArtLista ? 'block' : 'none') + ';">' +
                        '<span class="song-thumb-placeholder" style="display: ' + (tieneArtLista ? 'none' : 'flex') + ';">' +
                            (sonando
                                ? '<span class="mini-equalizer-bars"><span></span><span></span><span></span></span>'
                                : (esActual ? '▶' : (listIndex + 1))) +
                        '</span>' +
                    '</div>' +
                    '<div style="min-width: 0; flex: 1; overflow: hidden;">' +
                        '<div class="song-item-title ' + (esActual ? 'text-glow-cyan' : '') + '">' + escaparHTML(metaTrack.titulo) + '</div>' +
                        '<div class="song-item-meta" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' +
                            (metaTrack.artista && metaTrack.artista !== 'Artista desconocido'
                                ? '<span style="color: #e2e8f0; font-weight: 600;">' + escaparHTML(metaTrack.artista) + '</span><span>•</span>'
                                : '') +
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
                '<input type="text" id="input-buscar-song-modal-playlist" class="modal-input pl-picker-search" placeholder="🔍 Filtrar por título, artista o carpeta..." value="' + escaparHTML(state._modalAgregarFiltro || '') + '" oninput="window.MonarcaPlayer.filtrarModalPlaylistCanciones(this.value)">' +
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
    // 8. RENDERIZADO DEL PLAYER HERO & MINI-REPRODUCTOR FLOTANTE
    // ----------------------------------------------------------------------
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
        btnHeart.innerHTML = enLista ? '❤️ En lista' : '🤍 + Lista';
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
                elSub.textContent = (state.cancionActual.carpeta ? ('📁 ' + state.cancionActual.carpeta + ' · ') : '') + formatearTamano(state.cancionActual.tamano);
            } else {
                elSub.textContent = state.canciones.length > 0
                    ? (state.canciones.length + ' canciones listas en la biblioteca')
                    : (state.nativoActivo ? 'Sin archivos de audio detectados' : 'Sube tus archivos MP3 o concede permiso para detectar tu biblioteca');
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
        var metaMini = obtenerTituloLimpoYArtista(state.cancionActual);

        var elTit = document.getElementById('mini-player-title');
        if (elTit) {
            elTit.textContent = metaMini.titulo || 'Reproduciendo...';
        }

        var elSubTxt = document.getElementById('mini-player-subtitle-text');
        if (elSubTxt) {
            if (state.rutinaModoActivo && state.rutinaPlaylistActivaId) {
                var plAct = state.playlists.find(function(p) { return p && p.id === state.rutinaPlaylistActivaId; });
                elSubTxt.textContent = '🏋️ ' + (plAct ? plAct.nombre : 'Rutina') + ' · Aleatorio';
            } else {
                elSubTxt.textContent = metaMini.artista || 'Monarca Audio Deck';
            }
        }

        var cachedMiniArt = state.artworkCache[state.cancionActual.id];
        actualizarMiniCaratula((cachedMiniArt && cachedMiniArt !== 'none') ? cachedMiniArt : null);

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
    function verificarPermisoNativoAlVolver() {
        var plugin = obtenerPluginMonarcaMedia();
        if (!plugin || typeof plugin.estadoPermisoAudio !== 'function') return;
        plugin.estadoPermisoAudio().then(function(perm) {
            var nuevoEstado = (perm && perm.granted) ? 'granted' : ((perm && perm.state) || 'prompt');
            var cambio = (nuevoEstado === 'granted' && state.mediaPermiso !== 'granted');
            state.mediaPermiso = nuevoEstado;
            state.mediaPermisoChecked = true;
            if (cambio) {
                reescanearBibliotecaNativa(false);
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
        initAudioListeners();
        initMediaSession();
        actualizarControlesFuenteBiblioteca();
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

        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                verificarPermisoNativoAlVolver();
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
                        renderizarContenidoSegunSubtab();
                        actualizarUIPlayerCompleto();
                        fileIn.value = '';
                        if (loader) loader.style.display = 'none';
                        notificarPlayerToast('Se importaron ' + files.length + (files.length === 1 ? ' canción' : ' canciones'), '🎵');
                        if (!state.cancionActual && state.canciones.length > 0) {
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
                        renderizarContenidoSegunSubtab();
                        actualizarUIPlayerCompleto();
                        folderIn.value = '';
                        if (loader) loader.style.display = 'none';
                        notificarPlayerToast('Se cargaron ' + files.length + ' pistas organizadas por carpetas', '📂');
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

        // Hook en cambiarVista para sincronizar visibilidad del mini-reproductor y permisos nativos
        var origCambiarVista = window.cambiarVista;
        if (typeof origCambiarVista === 'function') {
            window.cambiarVista = function(vistaId, noPushState) {
                origCambiarVista(vistaId, noPushState);
                if (vistaId === 'vista-reproductor') {
                    verificarPermisoNativoAlVolver();
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
        reproducirPorId: reproducirPorId,
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
        agregarActualAPlaylist: agregarActualAPlaylist,
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
        buscarCancionPorIdOSig: buscarCancionPorIdOSig,
        prepararUrlReproduccion: prepararUrlReproduccion,
        solicitarPermisoYScanNativo: solicitarPermisoYScanNativo,
        reescanearBibliotecaNativa: reescanearBibliotecaNativa,
        abrirAjustesAudioNativo: abrirAjustesAudioNativo,
        sincronizarPlaylistsDesdeAppState: sincronizarPlaylistsDesdeAppState,
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
