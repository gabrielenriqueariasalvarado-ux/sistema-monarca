/**
 * SISTEMA MONARCA · CENTRO UNIFICADO DE PERMISOS DEL DISPOSITIVO (v11.34)
 * Presenta al primer ingreso todos los permisos del sistema (Notificaciones,
 * Música/Audio, Almacenamiento, Cámara, Ubicación y Micrófono) y permite
 * concederlos individualmente o en lote, además de administrarlos desde Perfil.
 */
(function(window) {
    'use strict';

    var ONBOARDING_STORAGE_KEY = 'monarca_permisos_onboarding_v1';

    var PERMISOS_CATALOGO = [
        {
            id: 'notifications',
            icono: '🔔',
            titulo: 'Notificaciones y Alertas',
            descripcion: 'Quests diarias, recordatorios de calendario y avisos de Auto-PC.',
            orden: 1
        },
        {
            id: 'music',
            icono: '🎵',
            titulo: 'Música y Audio',
            descripcion: 'Detecta tus canciones de SnapTube y tu biblioteca MP3 al instante.',
            orden: 2
        },
        {
            id: 'storage',
            icono: '📁',
            titulo: 'Almacenamiento y Galería',
            descripcion: 'Adjunta imágenes, capturas de pantalla y respaldos sin fricción.',
            orden: 3
        },
        {
            id: 'camera',
            icono: '📷',
            titulo: 'Cámara',
            descripcion: 'Toma fotos al momento para Banco de Ideas, Auto-PC y App IA.',
            orden: 4
        },
        {
            id: 'location',
            icono: '📍',
            titulo: 'Ubicación',
            descripcion: 'Disponible para registros o funciones que soliciten tu ubicación.',
            orden: 5
        },
        {
            id: 'microphone',
            icono: '🎙️',
            titulo: 'Micrófono',
            descripcion: 'Habla con Monarca Voz · Jarvis IA y dicta mensajes en tu App IA.',
            orden: 6
        }
    ];

    var _estadoActual = null;
    var _enCursoBatch = false;
    var _enCursoTipo = '';
    var _modoOnboardingActivo = false;
    var _ultimoFocoPrevio = null;
    var _escListenerActivo = false;

    function _esNativo() {
        try {
            return Boolean(
                window.Capacitor &&
                typeof window.Capacitor.isNativePlatform === 'function' &&
                window.Capacitor.isNativePlatform()
            );
        } catch (e) {
            return false;
        }
    }

    function _plugins() {
        var pl = (window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins : null;
        return {
            perms: pl && pl.MonarcaPermissions ? pl.MonarcaPermissions : null,
            media: pl && pl.MonarcaMedia ? pl.MonarcaMedia : null,
            ln: pl && pl.LocalNotifications ? pl.LocalNotifications : null,
            alarm: pl && pl.MonarcaAlarm ? pl.MonarcaAlarm : null
        };
    }

    function _escHtml(txt) {
        if (typeof window.monarcaEscHtml === 'function') {
            return window.monarcaEscHtml(txt);
        }
        return String(txt || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function _leerRegistroOnboarding() {
        try {
            var raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function _guardarOnboardingVisto(motivo, snapshot) {
        try {
            var summary = (snapshot && snapshot.summary) ? snapshot.summary : {};
            localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
                completed: Boolean(summary.allGranted),
                dismissed: true,
                reason: String(motivo || 'user'),
                grantedCount: Number(summary.grantedCount || 0),
                totalCount: Number(summary.totalCount || PERMISOS_CATALOGO.length),
                ts: Date.now()
            }));
        } catch (e) {}
    }

    function debeMostrarOnboardingInicial() {
        var reg = _leerRegistroOnboarding();
        return !reg;
    }

    function _queryBrowserPermission(name) {
        if (typeof navigator === 'undefined' || !navigator.permissions || typeof navigator.permissions.query !== 'function') {
            return Promise.resolve('prompt');
        }
        try {
            return navigator.permissions.query({ name: name }).then(function(res) {
                return res && res.state ? String(res.state) : 'prompt';
            }).catch(function() {
                return 'prompt';
            });
        } catch (e) {
            return Promise.resolve('prompt');
        }
    }

    function _consultarEstadosWeb() {
        var notifState = 'unsupported';
        if (typeof window !== 'undefined' && 'Notification' in window) {
            notifState = Notification.permission === 'granted'
                ? 'granted'
                : (Notification.permission === 'denied' ? 'denied' : 'prompt');
        }

        var hasGeo = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
        var hasMediaDevices = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        var hasPersistStorage = typeof navigator !== 'undefined' && Boolean(navigator.storage && typeof navigator.storage.persisted === 'function');

        return Promise.all([
            hasGeo ? _queryBrowserPermission('geolocation') : Promise.resolve('unsupported'),
            hasMediaDevices ? _queryBrowserPermission('camera') : Promise.resolve('unsupported'),
            hasMediaDevices ? _queryBrowserPermission('microphone') : Promise.resolve('unsupported'),
            hasPersistStorage ? navigator.storage.persisted().catch(function() { return false; }) : Promise.resolve(null)
        ]).then(function(vals) {
            var locState = vals[0];
            var camState = vals[1];
            var micState = vals[2];
            var persisted = vals[3];

            var permissions = {
                notifications: {
                    granted: notifState === 'granted',
                    state: notifState,
                    canPrompt: notifState === 'prompt' || notifState === 'prompt-with-rationale'
                },
                music: {
                    granted: false,
                    state: 'on-demand',
                    canPrompt: false,
                    badgeText: 'Solo APK / Archivo',
                    note: 'En navegador cargas MP3 con + Archivo o + Carpeta. En la APK Android detecta SnapTube automáticamente.'
                },
                storage: {
                    granted: persisted === true,
                    state: hasPersistStorage ? (persisted === true ? 'granted' : 'prompt') : 'on-demand',
                    canPrompt: Boolean(hasPersistStorage && persisted !== true),
                    badgeText: hasPersistStorage ? '' : 'Bajo demanda',
                    note: hasPersistStorage
                        ? 'Protege el almacenamiento local para no perder caché ni datos.'
                        : 'El navegador solicita acceso cuando seleccionas un archivo.'
                },
                camera: {
                    granted: camState === 'granted',
                    state: camState,
                    canPrompt: hasMediaDevices && camState !== 'denied' && camState !== 'unsupported'
                },
                location: {
                    granted: locState === 'granted',
                    state: locState,
                    canPrompt: hasGeo && locState !== 'denied' && locState !== 'unsupported'
                },
                microphone: {
                    granted: micState === 'granted',
                    state: micState,
                    canPrompt: hasMediaDevices && micState !== 'denied' && micState !== 'unsupported'
                }
            };

            var concedidos = 0;
            var accionables = 0;
            var pendientesAccionables = 0;
            PERMISOS_CATALOGO.forEach(function(item) {
                var p = permissions[item.id];
                if (!p) return;
                if (p.state !== 'on-demand' && p.state !== 'unsupported') {
                    accionables++;
                    if (p.granted) {
                        concedidos++;
                    } else if (p.canPrompt || p.state === 'denied') {
                        pendientesAccionables++;
                    }
                }
            });

            return {
                native: false,
                sdk: 0,
                permissions: permissions,
                special: null,
                summary: {
                    grantedCount: concedidos,
                    totalCount: accionables || PERMISOS_CATALOGO.length,
                    allGranted: accionables > 0 && pendientesAccionables === 0,
                    hasPending: pendientesAccionables > 0
                }
            };
        });
    }

    function consultarEstados() {
        var pl = _plugins();
        if (_esNativo() && pl.perms && typeof pl.perms.estadoPermisos === 'function') {
            return pl.perms.estadoPermisos().then(function(res) {
                var perms = (res && res.permissions) ? res.permissions : {};
                var sum = (res && res.summary) ? res.summary : {};
                var pend = 0;
                PERMISOS_CATALOGO.forEach(function(item) {
                    var p = perms[item.id];
                    if (p && !p.granted) pend++;
                });
                var normalized = {
                    native: true,
                    sdk: Number(res && res.sdk) || 0,
                    permissions: perms,
                    special: (res && res.special) ? res.special : null,
                    summary: {
                        grantedCount: Number(sum.grantedCount || 0),
                        totalCount: Number(sum.totalCount || PERMISOS_CATALOGO.length),
                        allGranted: Boolean(sum.allGranted || pend === 0),
                        hasPending: pend > 0
                    }
                };
                _estadoActual = normalized;
                return normalized;
            }).catch(function() {
                return _consultarEstadosWeb().then(function(st) {
                    _estadoActual = st;
                    return st;
                });
            });
        }

        return _consultarEstadosWeb().then(function(st) {
            _estadoActual = st;
            return st;
        });
    }

    function _ejecutarHooksPostPermiso(snapshot) {
        if (!snapshot || !snapshot.permissions) return;
        var perms = snapshot.permissions;

        if (perms.notifications && perms.notifications.granted) {
            try {
                if (typeof window.asegurarCanalYAccionesNotifMonarca === 'function') {
                    window.asegurarCanalYAccionesNotifMonarca();
                }
                if (typeof window.actualizarBotonNotificacionesUI === 'function') {
                    window.actualizarBotonNotificacionesUI();
                }
                if (typeof window.programarAlarmasNativasQuests === 'function') {
                    window.programarAlarmasNativasQuests();
                }
                if (typeof window.programarAlarmasCalendarioNativas === 'function') {
                    window.programarAlarmasCalendarioNativas();
                }
            } catch (e) {}
        }

        if (perms.music && perms.music.granted && window.MonarcaPlayer) {
            try {
                var pState = typeof window.MonarcaPlayer.getState === 'function' ? window.MonarcaPlayer.getState() : null;
                if (pState) {
                    pState.mediaPermiso = 'granted';
                    pState.mediaPermisoChecked = true;
                }
                if (!pState || !pState._scanInFlight) {
                    if (typeof window.MonarcaPlayer.reescanearBibliotecaNativa === 'function') {
                        window.MonarcaPlayer.reescanearBibliotecaNativa(false);
                    }
                }
            } catch (e2) {}
        }

        actualizarResumenPerfil();
    }

    function _renderizarContenidoModal(snapshot) {
        var boxEntorno = document.getElementById('permisos-entorno-banner');
        var boxLista = document.getElementById('permisos-lista-items');
        var boxEspecial = document.getElementById('permisos-alarma-extra-box');
        var btnTodos = document.getElementById('btn-permisos-aceptar-todos');
        var btnAjustes = document.getElementById('btn-permisos-abrir-ajustes');
        var btnCerrarFoot = document.getElementById('btn-permisos-footer-cerrar');
        var elSub = document.getElementById('modal-permisos-subtitulo');
        if (!boxLista || !snapshot) return;

        var perms = snapshot.permissions || {};
        var sum = snapshot.summary || {};
        var esNativo = Boolean(snapshot.native);
        var hayBloqueado = false;
        var haySolicitable = false;

        if (elSub) {
            elSub.textContent = _modoOnboardingActivo
                ? 'Activa los permisos una sola vez para usar todas las funciones desde el primer minuto'
                : 'Gestiona los accesos de Emily en tu dispositivo';
        }

        if (boxEntorno) {
            var progresoTxt = (sum.grantedCount || 0) + ' de ' + (sum.totalCount || PERMISOS_CATALOGO.length) + ' activos';
            boxEntorno.className = 'permisos-hero-banner ' + (sum.allGranted ? 'is-all-ok' : 'is-pending');
            boxEntorno.innerHTML =
                '<div class="permisos-hero-top">' +
                    '<span class="permisos-hero-pill">' + (esNativo ? ('📱 APK Android · SDK ' + (snapshot.sdk || '')) : '🌐 Web / PWA') + '</span>' +
                    '<span class="permisos-hero-count">' + _escHtml(progresoTxt) + '</span>' +
                '</div>' +
                '<div class="permisos-hero-desc">' +
                    (sum.allGranted
                        ? '✅ Todos los permisos esenciales están activos en este dispositivo.'
                        : (esNativo
                            ? 'Pulsa <strong>Aceptar Todos</strong> para ver los avisos del sistema uno por uno, o concede cada permiso por separado.'
                            : 'El navegador pedirá confirmación al pulsar cada botón o al pulsar <strong>Aceptar Todos</strong>.')) +
                '</div>';
        }

        var htmlRows = '';
        PERMISOS_CATALOGO.forEach(function(item) {
            var stObj = perms[item.id] || { granted: false, state: 'prompt', canPrompt: true };
            var st = String(stObj.state || 'prompt');
            var concedido = Boolean(stObj.granted);
            var bloqueado = st === 'denied';
            var enDemanda = st === 'on-demand' || st === 'unsupported';

            if (bloqueado) hayBloqueado = true;
            if (!concedido && !bloqueado && !enDemanda && stObj.canPrompt !== false) {
                haySolicitable = true;
            }

            var estadoBadge = '';
            var claseRow = 'permiso-item-row ';
            if (concedido) {
                claseRow += 'is-granted';
                estadoBadge = '<span class="permiso-badge is-ok">✓ Concedido</span>';
            } else if (bloqueado) {
                claseRow += 'is-denied';
                estadoBadge = '<span class="permiso-badge is-denied">Bloqueado</span>';
            } else if (enDemanda) {
                claseRow += 'is-ondemand';
                estadoBadge = '<span class="permiso-badge is-ondemand">' + _escHtml(stObj.badgeText || (st === 'unsupported' ? 'No disponible' : 'Bajo demanda')) + '</span>';
            } else {
                claseRow += 'is-pending';
                estadoBadge = '<span class="permiso-badge is-pending">Pendiente</span>';
            }

            var ocupandoEste = _enCursoBatch || _enCursoTipo === item.id;
            var accionHtml = '';
            if (concedido) {
                accionHtml = '<span class="permiso-done-check" aria-label="Permiso concedido">✅</span>';
            } else if (bloqueado) {
                accionHtml =
                    '<button type="button" class="btn-permiso-accion is-settings" onclick="abrirAjustesPermisosSistema(\'' + item.id + '\')">' +
                        'Ajustes' +
                    '</button>';
            } else if (enDemanda) {
                accionHtml = '<span class="permiso-ondemand-tag">' + _escHtml(item.id === 'music' && !esNativo ? 'Manual Web' : 'Auto') + '</span>';
            } else {
                accionHtml =
                    '<button type="button" class="btn-permiso-accion is-allow" ' +
                        (ocupandoEste ? 'disabled ' : '') +
                        'onclick="solicitarPermisoSistema(\'' + item.id + '\')">' +
                        (_enCursoTipo === item.id ? 'Pidiendo...' : 'Permitir') +
                    '</button>';
            }

            var descFinal = stObj.note && !concedido && !esNativo ? stObj.note : item.descripcion;

            htmlRows +=
                '<div class="' + claseRow + '" data-permiso-id="' + item.id + '">' +
                    '<div class="permiso-item-left">' +
                        '<div class="permiso-item-icon">' + item.icono + '</div>' +
                        '<div class="permiso-item-text">' +
                            '<div class="permiso-item-title-line">' +
                                '<span class="permiso-item-title">' + _escHtml(item.titulo) + '</span>' +
                                estadoBadge +
                            '</div>' +
                            '<div class="permiso-item-desc">' + _escHtml(descFinal) + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="permiso-item-right">' + accionHtml + '</div>' +
                '</div>';
        });

        boxLista.innerHTML = htmlRows;

        if (boxEspecial) {
            if (esNativo && snapshot.special) {
                var sp = snapshot.special;
                var faltanAlarma = !sp.exactAlarms || !sp.fullScreenIntent || !sp.batteryOptimization;
                boxEspecial.style.display = 'flex';
                boxEspecial.innerHTML =
                    '<div style="min-width: 0; flex: 1;">' +
                        '<div class="permisos-alarm-title">' +
                            (faltanAlarma ? '⏰ Permisos especiales de Alarma recomendados' : '⏰ Alarmas sobre bloqueo y batería configuradas') +
                        '</div>' +
                        '<div class="permisos-alarm-sub">' +
                            (faltanAlarma
                                ? 'Para alarmas de madrugada o pantalla apagada en Android/Xiaomi, revisa el diagnóstico de alarma.'
                                : 'Alarmas exactas, pantalla completa y batería sin restricciones activas.') +
                        '</div>' +
                    '</div>' +
                    '<button type="button" class="btn-permiso-diag-link" onclick="cerrarModalPermisosSistema(\'alarm_diag\'); if(typeof abrirModalDiagnosticoAlarma===\'function\') abrirModalDiagnosticoAlarma();">' +
                        '🩺 Revisar' +
                    '</button>';
            } else {
                boxEspecial.style.display = 'none';
                boxEspecial.innerHTML = '';
            }
        }

        if (btnTodos) {
            if (sum.allGranted || !haySolicitable) {
                btnTodos.style.display = 'none';
            } else {
                btnTodos.style.display = 'inline-flex';
                btnTodos.disabled = _enCursoBatch || Boolean(_enCursoTipo);
                btnTodos.innerHTML = _enCursoBatch
                    ? '<span>⏳</span><span>Esperando respuesta...</span>'
                    : '<span>⚡</span><span>Aceptar Todos los Permisos</span>';
            }
        }

        if (btnAjustes) {
            btnAjustes.style.display = (esNativo && hayBloqueado) ? 'inline-flex' : 'none';
        }

        if (btnCerrarFoot) {
            btnCerrarFoot.textContent = sum.allGranted ? '✅ Listo, continuar' : (_modoOnboardingActivo ? 'Más tarde' : 'Cerrar');
        }
    }

    function refrescar() {
        return consultarEstados().then(function(snapshot) {
            _renderizarContenidoModal(snapshot);
            _ejecutarHooksPostPermiso(snapshot);
            return snapshot;
        });
    }

    function _manejarTeclaEsc(ev) {
        if (ev && ev.key === 'Escape') {
            ev.preventDefault();
            cerrarModal('esc');
        }
    }

    function abrirModal(esOnboarding) {
        var modal = document.getElementById('modal-permisos-sistema');
        if (!modal) return;

        _modoOnboardingActivo = Boolean(esOnboarding);
        if (modal.style.display !== 'flex') {
            _ultimoFocoPrevio = document.activeElement || null;
        }
        modal.style.display = 'flex';

        if (!_escListenerActivo) {
            document.addEventListener('keydown', _manejarTeclaEsc);
            _escListenerActivo = true;
        }

        refrescar().then(function() {
            var focoTarget = document.getElementById('btn-permisos-aceptar-todos');
            if (!focoTarget || focoTarget.style.display === 'none') {
                focoTarget = document.getElementById('btn-permisos-footer-cerrar') || modal.querySelector('.modal-close-btn');
            }
            if (focoTarget && typeof focoTarget.focus === 'function') {
                try { focoTarget.focus({ preventScroll: true }); } catch (e) {}
            }
        });
    }

    function cerrarModal(motivo) {
        var modal = document.getElementById('modal-permisos-sistema');
        if (modal) modal.style.display = 'none';

        if (_escListenerActivo) {
            document.removeEventListener('keydown', _manejarTeclaEsc);
            _escListenerActivo = false;
        }

        _guardarOnboardingVisto(motivo || 'closed', _estadoActual);
        _modoOnboardingActivo = false;

        if (_ultimoFocoPrevio && typeof _ultimoFocoPrevio.focus === 'function' && document.contains(_ultimoFocoPrevio)) {
            try { _ultimoFocoPrevio.focus({ preventScroll: true }); } catch (e) {}
        }
        _ultimoFocoPrevio = null;
        actualizarResumenPerfil();
    }

    function _solicitarPermisoWeb(tipo) {
        if (tipo === 'notifications') {
            if (!('Notification' in window)) return Promise.resolve({ unsupported: true });
            return Notification.requestPermission().catch(function() { return 'denied'; });
        }
        if (tipo === 'location') {
            if (!navigator.geolocation) return Promise.resolve({ unsupported: true });
            return new Promise(function(resolve) {
                navigator.geolocation.getCurrentPosition(
                    function() { resolve('granted'); },
                    function(err) { resolve(err && err.code === 1 ? 'denied' : 'prompt'); },
                    { enableHighAccuracy: false, timeout: 6500, maximumAge: 60000 }
                );
            });
        }
        if (tipo === 'camera') {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.resolve('unsupported');
            return navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
                try { stream.getTracks().forEach(function(t) { t.stop(); }); } catch (e) {}
                return 'granted';
            }).catch(function(err) {
                if (err && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
                    if (typeof window.mostrarToastMonarca === 'function') {
                        window.mostrarToastMonarca('No se detectó cámara en este equipo.', '📷');
                    }
                    return 'unsupported';
                }
                return 'denied';
            });
        }
        if (tipo === 'microphone') {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.resolve('unsupported');
            return navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
                try { stream.getTracks().forEach(function(t) { t.stop(); }); } catch (e) {}
                return 'granted';
            }).catch(function(err) {
                if (err && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
                    if (typeof window.mostrarToastMonarca === 'function') {
                        window.mostrarToastMonarca('No se detectó micrófono en este equipo.', '🎙️');
                    }
                    return 'unsupported';
                }
                return 'denied';
            });
        }
        if (tipo === 'storage') {
            if (navigator.storage && typeof navigator.storage.persist === 'function') {
                return navigator.storage.persist().then(function(ok) {
                    return ok ? 'granted' : 'prompt';
                }).catch(function() { return 'prompt'; });
            }
            return Promise.resolve('on-demand');
        }
        return Promise.resolve('on-demand');
    }

    function solicitarUno(tipo) {
        if (!tipo || _enCursoBatch || _enCursoTipo) return Promise.resolve(null);
        _enCursoTipo = String(tipo);
        if (_estadoActual) _renderizarContenidoModal(_estadoActual);

        var pl = _plugins();
        if (_esNativo() && pl.perms && typeof pl.perms.solicitarPermiso === 'function') {
            return pl.perms.solicitarPermiso({ tipo: String(tipo) }).then(function(res) {
                _enCursoTipo = '';
                var needSettings = Boolean(res && res.needsSettings);
                return refrescar().then(function(snapshot) {
                    if (needSettings) {
                        if (typeof window.mostrarToastMonarca === 'function') {
                            window.mostrarToastMonarca('Permiso bloqueado en Android: abriendo Ajustes para activarlo.', '⚙️');
                        }
                        abrirAjustes(tipo);
                    }
                    return snapshot;
                });
            }).catch(function() {
                _enCursoTipo = '';
                return refrescar();
            });
        }

        return _solicitarPermisoWeb(String(tipo)).then(function() {
            _enCursoTipo = '';
            return refrescar();
        });
    }

    function solicitarTodos() {
        if (_enCursoBatch || _enCursoTipo) return Promise.resolve(null);
        _enCursoBatch = true;
        if (_estadoActual) _renderizarContenidoModal(_estadoActual);

        var pl = _plugins();
        if (_esNativo() && pl.perms && typeof pl.perms.solicitarTodosLosPermisos === 'function') {
            return pl.perms.solicitarTodosLosPermisos().then(function() {
                _enCursoBatch = false;
                return refrescar().then(function(snapshot) {
                    if (snapshot && snapshot.summary) {
                        if (snapshot.summary.allGranted) {
                            _guardarOnboardingVisto('all_granted', snapshot);
                            if (typeof window.mostrarToastMonarca === 'function') {
                                window.mostrarToastMonarca('Todos los permisos activados en Emily.', '✅');
                            }
                        } else if (typeof window.mostrarToastMonarca === 'function') {
                            window.mostrarToastMonarca(
                                snapshot.summary.grantedCount + ' de ' + snapshot.summary.totalCount + ' permisos concedidos.',
                                '🔐'
                            );
                        }
                    }
                    return snapshot;
                });
            }).catch(function() {
                _enCursoBatch = false;
                return refrescar();
            });
        }

        // En Web/PWA encadena de manera secuencial los permisos pendientes sobre un solo gesto
        return consultarEstados().then(function(st) {
            var perms = st.permissions || {};
            var cola = ['notifications', 'location', 'camera', 'microphone', 'storage'].filter(function(id) {
                var p = perms[id];
                return p && !p.granted && p.state !== 'denied' && p.state !== 'unsupported' && p.state !== 'on-demand';
            });
            var chain = Promise.resolve();
            cola.forEach(function(id) {
                chain = chain.then(function() {
                    return _solicitarPermisoWeb(id);
                });
            });
            return chain;
        }).then(function() {
            _enCursoBatch = false;
            return refrescar().then(function(snapshot) {
                if (snapshot && snapshot.summary && snapshot.summary.allGranted) {
                    _guardarOnboardingVisto('all_granted', snapshot);
                }
                return snapshot;
            });
        });
    }

    function abrirAjustes(tipo) {
        var pl = _plugins();
        if (_esNativo() && pl.perms && typeof pl.perms.abrirAjustesApp === 'function') {
            pl.perms.abrirAjustesApp({ tipo: String(tipo || 'app') }).catch(function() {});
            return;
        }
        if (_esNativo() && pl.alarm && typeof pl.alarm.abrirAjuste === 'function') {
            pl.alarm.abrirAjuste({ tipo: tipo === 'notifications' ? 'notifications' : 'appDetails' }).catch(function() {});
            return;
        }
        if (typeof window.mostrarToastMonarca === 'function') {
            window.mostrarToastMonarca('Puedes activar los permisos desde el icono de candado/ajustes de tu navegador.', '🔒');
        }
    }

    function actualizarResumenPerfil() {
        var badgeEl = document.getElementById('perfil-permisos-badge');
        var descEl = document.getElementById('perfil-permisos-desc');
        if (!badgeEl && !descEl) return Promise.resolve(null);

        return consultarEstados().then(function(st) {
            var sum = st.summary || {};
            var g = Number(sum.grantedCount || 0);
            var t = Number(sum.totalCount || PERMISOS_CATALOGO.length);
            var ok = Boolean(sum.allGranted);
            if (badgeEl) {
                badgeEl.textContent = ok ? ('✓ ' + g + '/' + t + ' Activos') : (g + '/' + t + ' Activos');
                badgeEl.classList.toggle('is-ok', ok);
                badgeEl.classList.toggle('is-pending', !ok);
            }
            if (descEl) {
                descEl.textContent = ok
                    ? 'Notificaciones, música, almacenamiento, cámara, ubicación y micrófono listos.'
                    : 'Notificaciones, música, cámara, ubicación y almacenamiento disponibles aquí.';
            }
            return st;
        });
    }

    function intentarAbrirOnboardingPrimerIngreso() {
        if (!debeMostrarOnboardingInicial()) return;

        // No interrumpir si hay una alerta crítica de alarma o modal prioritario abierto
        var modalQuest = document.getElementById('modal-alerta-quest-activada');
        if (modalQuest && modalQuest.style && modalQuest.style.display && modalQuest.style.display !== 'none') {
            return;
        }
        var modalYa = document.getElementById('modal-permisos-sistema');
        if (modalYa && modalYa.style && modalYa.style.display === 'flex') {
            return;
        }

        consultarEstados().then(function(st) {
            if (!debeMostrarOnboardingInicial()) return;
            var modalCheck = document.getElementById('modal-permisos-sistema');
            if (!modalCheck || modalCheck.style.display === 'flex') return;

            if (st && st.summary && !st.summary.hasPending) {
                _guardarOnboardingVisto('already_granted', st);
                actualizarResumenPerfil();
                return;
            }
            abrirModal(true);
        });
    }

    if (typeof window !== 'undefined') {
        window.MonarcaPermisos = {
            abrirModal: abrirModal,
            cerrarModal: cerrarModal,
            solicitarUno: solicitarUno,
            solicitarTodos: solicitarTodos,
            abrirAjustes: abrirAjustes,
            refrescar: refrescar,
            consultarEstados: consultarEstados,
            debeMostrarOnboardingInicial: debeMostrarOnboardingInicial,
            actualizarResumenPerfil: actualizarResumenPerfil,
            PERMISOS_CATALOGO: PERMISOS_CATALOGO
        };

        window.abrirModalPermisosSistema = abrirModal;
        window.cerrarModalPermisosSistema = cerrarModal;
        window.solicitarPermisoSistema = solicitarUno;
        window.solicitarTodosPermisosSistema = solicitarTodos;
        window.abrirAjustesPermisosSistema = abrirAjustes;

        window.addEventListener('DOMContentLoaded', function() {
            setTimeout(intentarAbrirOnboardingPrimerIngreso, 700);
        });

        var _alVolverApp = function() {
            var modal = document.getElementById('modal-permisos-sistema');
            if (modal && modal.style.display === 'flex') {
                refrescar();
            } else if (window.VISTA_ACTUAL === 'vista-perfil') {
                actualizarResumenPerfil();
            }
        };
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) _alVolverApp();
        });
        window.addEventListener('focus', _alVolverApp);
    }
})(window);
