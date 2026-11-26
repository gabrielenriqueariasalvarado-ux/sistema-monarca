/**
 * SISTEMA MONARCA · MOTOR MQTT EN TIEMPO REAL PARA AUTO-PC (v11.31)
 * Cliente MQTT 3.1.1 sobre WebSocket (WSS) sin dependencias externas,
 * cifrado extremo a extremo AES-256-GCM (WebCrypto) 100% compatible con Auto-PC Python,
 * presencia instantánea (LWT), eventos de progreso/finalización y control remoto.
 */
(function(global) {
    'use strict';

    var STORAGE_KEY = 'monarca_autopc_mqtt_cfg_v1';
    var TOPIC_ROOT = 'monarca/v1';
    var ENC_ALG = 'aes-256-gcm';
    var DEFAULT_WS_URL = 'wss://broker.emqx.io:8084/mqtt';
    var DEFAULT_FALLBACK_WS_URL = 'wss://broker.hivemq.com:8884/mqtt';

    var textEncoder = new TextEncoder();
    var textDecoder = new TextDecoder();

    // ------------------------------------------------------------------------
    // UTILIDADES BASE64 + WEBCRYPTO AES-256-GCM
    // ------------------------------------------------------------------------

    function bytesToBase64(bytes) {
        var bin = '';
        for (var i = 0; i < bytes.length; i++) {
            bin += String.fromCharCode(bytes[i]);
        }
        return btoa(bin);
    }

    function base64ToBytes(b64) {
        var bin = atob(String(b64 || '').trim());
        var out = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) {
            out[i] = bin.charCodeAt(i);
        }
        return out;
    }

    function hasWebCrypto() {
        return Boolean(
            typeof crypto !== 'undefined' &&
            crypto &&
            crypto.subtle &&
            typeof crypto.subtle.importKey === 'function'
        );
    }

    var _cachedCryptoKeyB64 = '';
    var _cachedCryptoKeyObj = null;

    async function getAesKey(secretKeyB64) {
        var clean = String(secretKeyB64 || '').trim();
        if (!clean || !hasWebCrypto()) return null;
        if (_cachedCryptoKeyObj && _cachedCryptoKeyB64 === clean) {
            return _cachedCryptoKeyObj;
        }
        var raw = base64ToBytes(clean);
        if (raw.length !== 16 && raw.length !== 24 && raw.length !== 32) {
            throw new Error('Longitud de clave AES inválida');
        }
        var keyObj = await crypto.subtle.importKey(
            'raw',
            raw,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
        _cachedCryptoKeyB64 = clean;
        _cachedCryptoKeyObj = keyObj;
        return keyObj;
    }

    async function encryptPayload(obj, cfg) {
        var plainBytes = textEncoder.encode(JSON.stringify(obj));
        if (!cfg || !cfg.encrypt || !cfg.secretKey) {
            return plainBytes;
        }
        if (!hasWebCrypto()) {
            throw new Error('WebCrypto no disponible en contexto no seguro (usa HTTPS o APK)');
        }
        var key = await getAesKey(cfg.secretKey);
        var iv = new Uint8Array(12);
        crypto.getRandomValues(iv);
        var ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, plainBytes);
        var ctBytes = new Uint8Array(ctBuf);
        var envelope = {
            v: 1,
            enc: ENC_ALG,
            iv: bytesToBase64(iv),
            ct: bytesToBase64(ctBytes)
        };
        return textEncoder.encode(JSON.stringify(envelope));
    }

    async function decryptPayload(rawBytes, cfg) {
        if (!rawBytes || !rawBytes.length) return null;
        var parsed = null;
        try {
            parsed = JSON.parse(textDecoder.decode(rawBytes));
        } catch (e) {
            return null;
        }
        if (!parsed || typeof parsed !== 'object') return null;

        if (parsed.enc === ENC_ALG && parsed.iv && parsed.ct) {
            if (!cfg || !cfg.secretKey || !hasWebCrypto()) return null;
            try {
                var key = await getAesKey(cfg.secretKey);
                var iv = base64ToBytes(parsed.iv);
                var ct = base64ToBytes(parsed.ct);
                var plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
                var dec = JSON.parse(textDecoder.decode(new Uint8Array(plainBuf)));
                return (dec && typeof dec === 'object') ? dec : null;
            } catch (err) {
                return null;
            }
        }

        if (cfg && cfg.encrypt && cfg.secretKey) {
            return null;
        }
        return parsed;
    }

    // ------------------------------------------------------------------------
    // CODIFICADOR / DECODIFICADOR BINARIO MQTT 3.1.1 (PURO JS)
    // ------------------------------------------------------------------------

    function encodeRemainingLength(len) {
        var out = [];
        var x = len;
        do {
            var digit = x % 128;
            x = Math.floor(x / 128);
            if (x > 0) digit |= 0x80;
            out.push(digit);
        } while (x > 0);
        return out;
    }

    function encodeUtf8Field(str) {
        var bytes = textEncoder.encode(String(str || ''));
        var out = new Uint8Array(2 + bytes.length);
        out[0] = (bytes.length >> 8) & 0xff;
        out[1] = bytes.length & 0xff;
        out.set(bytes, 2);
        return out;
    }

    function concatUint8(arrays) {
        var total = 0;
        for (var i = 0; i < arrays.length; i++) total += arrays[i].length;
        var out = new Uint8Array(total);
        var off = 0;
        for (var j = 0; j < arrays.length; j++) {
            out.set(arrays[j], off);
            off += arrays[j].length;
        }
        return out;
    }

    function buildConnectPacket(opts) {
        var clientId = encodeUtf8Field(opts.clientId);
        var hasUser = Boolean(opts.username);
        var hasPass = Boolean(hasUser && opts.password);
        var flags = 0x02; // Clean session
        if (hasUser) flags |= 0x80;
        if (hasPass) flags |= 0x40;
        var keepAlive = Number(opts.keepAliveSec) || 30;

        var varHeader = new Uint8Array([
            0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, // "MQTT"
            0x04, // Level 4 (3.1.1)
            flags,
            (keepAlive >> 8) & 0xff,
            keepAlive & 0xff
        ]);

        var parts = [varHeader, clientId];
        if (hasUser) parts.push(encodeUtf8Field(opts.username));
        if (hasPass) parts.push(encodeUtf8Field(opts.password));
        var body = concatUint8(parts);
        var remLen = encodeRemainingLength(body.length);
        var fixed = new Uint8Array([0x10].concat(remLen));
        return concatUint8([fixed, body]);
    }

    function buildSubscribePacket(packetId, topicsList) {
        var parts = [new Uint8Array([(packetId >> 8) & 0xff, packetId & 0xff])];
        for (var i = 0; i < topicsList.length; i++) {
            parts.push(encodeUtf8Field(topicsList[i].topic));
            parts.push(new Uint8Array([topicsList[i].qos || 0]));
        }
        var body = concatUint8(parts);
        var remLen = encodeRemainingLength(body.length);
        var fixed = new Uint8Array([0x82].concat(remLen));
        return concatUint8([fixed, body]);
    }

    function buildPublishPacket(topic, payloadBytes, qos, retain, packetId) {
        var headerByte = 0x30 | ((qos & 0x03) << 1) | (retain ? 0x01 : 0x00);
        var topicField = encodeUtf8Field(topic);
        var parts = [topicField];
        if (qos > 0) {
            parts.push(new Uint8Array([(packetId >> 8) & 0xff, packetId & 0xff]));
        }
        parts.push(payloadBytes);
        var body = concatUint8(parts);
        var remLen = encodeRemainingLength(body.length);
        var fixed = new Uint8Array([headerByte].concat(remLen));
        return concatUint8([fixed, body]);
    }

    function buildPubackPacket(packetId) {
        return new Uint8Array([0x40, 0x02, (packetId >> 8) & 0xff, packetId & 0xff]);
    }

    function buildPingreqPacket() {
        return new Uint8Array([0xc0, 0x00]);
    }

    function buildDisconnectPacket() {
        return new Uint8Array([0xe0, 0x00]);
    }

    function parseNextPacket(buf) {
        if (!buf || buf.length < 2) return null;
        var multiplier = 1;
        var value = 0;
        var idx = 1;
        var digit = 0;
        do {
            if (idx >= buf.length) return null;
            digit = buf[idx++];
            value += (digit & 0x7f) * multiplier;
            multiplier *= 128;
            if (multiplier > 128 * 128 * 128 * 128) {
                throw new Error('MQTT remaining length malformed');
            }
        } while ((digit & 0x80) !== 0);

        var totalLen = idx + value;
        if (buf.length < totalLen) return null;

        return {
            header: buf[0],
            type: (buf[0] >> 4) & 0x0f,
            flags: buf[0] & 0x0f,
            body: buf.subarray(idx, totalLen),
            remaining: buf.subarray(totalLen)
        };
    }

    // ------------------------------------------------------------------------
    // GESTOR DE CONFIGURACIÓN Y CLIENTE EN VIVO
    // ------------------------------------------------------------------------

    function defaultConfig() {
        return {
            enabled: true,
            wsUrl: DEFAULT_WS_URL,
            fallbackWsUrl: DEFAULT_FALLBACK_WS_URL,
            host: 'broker.emqx.io',
            port: 8883,
            username: '',
            password: '',
            channelId: '',
            secretKey: '',
            encrypt: true,
            customOverride: false,
            updatedAt: 0
        };
    }

    function loadStoredConfig() {
        var base = defaultConfig();
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    Object.assign(base, parsed);
                }
            }
        } catch (e) {}
        return base;
    }

    function persistConfig(cfg) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
        } catch (e) {}
    }

    function buildTopics(channelId) {
        var clean = String(channelId || '').trim().replace(/^\/+|\/+$/g, '');
        var prefix = TOPIC_ROOT + '/' + clean;
        return {
            prefix: prefix,
            presence: prefix + '/autopc/presence',
            telemetry: prefix + '/autopc/telemetry',
            queue: prefix + '/autopc/queue',
            events: prefix + '/autopc/events',
            enqueue: prefix + '/emily/enqueue',
            cancel: prefix + '/emily/cancel',
            planDecision: prefix + '/emily/plan_decision',
            command: prefix + '/emily/command'
        };
    }

    function randomHex(len) {
        var chars = '0123456789abcdef';
        var out = '';
        for (var i = 0; i < len; i++) {
            out += chars[Math.floor(Math.random() * 16)];
        }
        return out;
    }

    var state = {
        cfg: loadStoredConfig(),
        ws: null,
        rxBuf: new Uint8Array(0),
        packetId: 1,
        connected: false,
        connecting: false,
        manualDisconnect: false,
        brokerIdx: 0,
        activeWsUrl: '',
        reconnectTimer: null,
        reconnectDelayMs: 1500,
        pingTimer: null,
        pingTimeoutTimer: null,
        lastMessageAt: 0,
        lastLatencyMs: null,
        pendingPings: {},
        pcPresence: null, // { online: boolean, reason, ts, broker }
        lastError: '',
        statusLabel: 'Esperando emparejamiento MQTT...',
        clientId: 'monarca-web-' + randomHex(8),
        topics: null
    };

    function nextPacketId() {
        state.packetId = (state.packetId % 65534) + 1;
        return state.packetId;
    }

    function notifyUiStatusChanged() {
        try {
            if (typeof global.actualizarTarjetaMonitorAutoPCPerfil === 'function') {
                global.actualizarTarjetaMonitorAutoPCPerfil();
            }
        } catch (e) {}
        try {
            actualizarModalEstadoMQTT();
        } catch (e2) {}
    }

    function clearTimers() {
        if (state.reconnectTimer) {
            clearTimeout(state.reconnectTimer);
            state.reconnectTimer = null;
        }
        if (state.pingTimer) {
            clearInterval(state.pingTimer);
            state.pingTimer = null;
        }
        if (state.pingTimeoutTimer) {
            clearTimeout(state.pingTimeoutTimer);
            state.pingTimeoutTimer = null;
        }
    }

    function closeSocket(sendDisconnect) {
        clearTimers();
        var sock = state.ws;
        state.ws = null;
        state.connected = false;
        state.connecting = false;
        state.rxBuf = new Uint8Array(0);
        if (sock) {
            try {
                if (sendDisconnect && sock.readyState === WebSocket.OPEN) {
                    sock.send(buildDisconnectPacket());
                }
            } catch (e) {}
            try {
                sock.onopen = null;
                sock.onmessage = null;
                sock.onerror = null;
                sock.onclose = null;
                sock.close();
            } catch (e2) {}
        }
    }

    function candidateUrls() {
        var list = [];
        var primary = String(state.cfg.wsUrl || '').trim();
        var fallback = String(state.cfg.fallbackWsUrl || '').trim();
        if (primary) list.push(primary);
        if (fallback && fallback !== primary && !state.cfg.username) {
            list.push(fallback);
        }
        if (list.length === 0) {
            list.push(DEFAULT_WS_URL, DEFAULT_FALLBACK_WS_URL);
        }
        return list;
    }

    function scheduleReconnect() {
        if (state.manualDisconnect || !state.cfg.enabled || !state.cfg.channelId) return;
        if (state.reconnectTimer) return;
        var delay = state.reconnectDelayMs;
        state.reconnectDelayMs = Math.min(20000, Math.round(state.reconnectDelayMs * 1.6));
        state.statusLabel = 'Reconectando MQTT (' + Math.ceil(delay / 1000) + 's)...';
        notifyUiStatusChanged();
        state.reconnectTimer = setTimeout(function() {
            state.reconnectTimer = null;
            connect();
        }, delay);
    }

    function startKeepalive() {
        if (state.pingTimer) clearInterval(state.pingTimer);
        state.pingTimer = setInterval(function() {
            if (!state.ws || state.ws.readyState !== WebSocket.OPEN || !state.connected) return;
            try {
                state.ws.send(buildPingreqPacket());
                if (state.pingTimeoutTimer) clearTimeout(state.pingTimeoutTimer);
                state.pingTimeoutTimer = setTimeout(function() {
                    closeSocket(false);
                    scheduleReconnect();
                }, 10000);
            } catch (e) {
                closeSocket(false);
                scheduleReconnect();
            }
        }, 20000);
    }

    async function handleDecodedMessage(topic, payloadBytes) {
        var data = await decryptPayload(payloadBytes, state.cfg);
        if (!data || typeof data !== 'object') return;
        state.lastMessageAt = Date.now();
        var t = state.topics;
        if (!t) return;

        if (topic === t.presence) {
            state.pcPresence = Object.assign({ receivedAt: Date.now() }, data);
            if (typeof global.procesarPresenciaMqttAutoPC === 'function') {
                global.procesarPresenciaMqttAutoPC(data);
            }
            notifyUiStatusChanged();
            return;
        }

        if (topic === t.telemetry) {
            if (typeof global.procesarTelemetriaMqttAutoPC === 'function') {
                global.procesarTelemetriaMqttAutoPC(data);
            }
            return;
        }

        if (topic === t.queue) {
            if (typeof global.procesarColaMqttAutoPC === 'function') {
                global.procesarColaMqttAutoPC(data);
            }
            return;
        }

        if (topic === t.events) {
            if (data.type === 'pong' && data.pingId && state.pendingPings[data.pingId]) {
                var pEntry = state.pendingPings[data.pingId];
                delete state.pendingPings[data.pingId];
                var rtt = Math.max(1, Date.now() - pEntry.sentAt);
                state.lastLatencyMs = rtt;
                if (pEntry.timer) clearTimeout(pEntry.timer);
                pEntry.resolve({ ok: true, latencyMs: rtt, broker: data.broker || state.activeWsUrl });
                notifyUiStatusChanged();
                return;
            }
            if (typeof global.procesarEventoMqttAutoPC === 'function') {
                global.procesarEventoMqttAutoPC(data);
            }
        }
    }

    function processIncomingBuffer() {
        while (state.rxBuf.length >= 2) {
            var pkt = null;
            try {
                pkt = parseNextPacket(state.rxBuf);
            } catch (err) {
                state.lastError = 'Paquete MQTT inválido';
                closeSocket(false);
                scheduleReconnect();
                return;
            }
            if (!pkt) break;
            state.rxBuf = new Uint8Array(pkt.remaining);

            // CONNACK (2)
            if (pkt.type === 2) {
                var returnCode = pkt.body.length >= 2 ? pkt.body[1] : 255;
                if (returnCode === 0) {
                    state.connected = true;
                    state.connecting = false;
                    state.reconnectDelayMs = 1500;
                    state.lastError = '';
                    state.statusLabel = 'MQTT en vivo';
                    var topics = buildTopics(state.cfg.channelId);
                    state.topics = topics;
                    var subPkt = buildSubscribePacket(nextPacketId(), [
                        { topic: topics.presence, qos: 1 },
                        { topic: topics.telemetry, qos: 0 },
                        { topic: topics.queue, qos: 1 },
                        { topic: topics.events, qos: 1 }
                    ]);
                    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
                        state.ws.send(subPkt);
                    }
                    startKeepalive();
                    notifyUiStatusChanged();
                } else {
                    state.lastError = 'Broker rechazó conexión (código ' + returnCode + ')';
                    closeSocket(false);
                    scheduleReconnect();
                }
            }
            // PUBLISH (3)
            else if (pkt.type === 3) {
                if (pkt.body.length < 2) continue;
                var topicLen = (pkt.body[0] << 8) | pkt.body[1];
                if (pkt.body.length < 2 + topicLen) continue;
                var topicStr = textDecoder.decode(pkt.body.subarray(2, 2 + topicLen));
                var qos = (pkt.flags >> 1) & 0x03;
                var pos = 2 + topicLen;
                if (qos > 0) {
                    if (pkt.body.length < pos + 2) continue;
                    var pid = (pkt.body[pos] << 8) | pkt.body[pos + 1];
                    pos += 2;
                    if (qos === 1 && state.ws && state.ws.readyState === WebSocket.OPEN) {
                        try { state.ws.send(buildPubackPacket(pid)); } catch (e) {}
                    }
                }
                var payloadSlice = new Uint8Array(pkt.body.subarray(pos));
                handleDecodedMessage(topicStr, payloadSlice);
            }
            // PINGRESP (13)
            else if (pkt.type === 13) {
                if (state.pingTimeoutTimer) {
                    clearTimeout(state.pingTimeoutTimer);
                    state.pingTimeoutTimer = null;
                }
            }
        }
    }

    function connect() {
        if (!state.cfg.enabled) {
            state.statusLabel = 'MQTT desactivado';
            notifyUiStatusChanged();
            return false;
        }
        if (!state.cfg.channelId) {
            state.statusLabel = 'Esperando canal desde Auto-PC...';
            notifyUiStatusChanged();
            return false;
        }
        if (state.connected || state.connecting) return true;
        if (typeof WebSocket === 'undefined') {
            state.lastError = 'WebSocket no disponible';
            return false;
        }

        state.manualDisconnect = false;
        state.connecting = true;
        clearTimers();

        var urls = candidateUrls();
        var url = urls[state.brokerIdx % urls.length];
        state.activeWsUrl = url;
        state.statusLabel = 'Conectando MQTT...';
        notifyUiStatusChanged();

        var sock = null;
        try {
            sock = new WebSocket(url, ['mqtt']);
            sock.binaryType = 'arraybuffer';
        } catch (err) {
            state.connecting = false;
            state.lastError = String(err && err.message ? err.message : err);
            state.brokerIdx = (state.brokerIdx + 1) % urls.length;
            scheduleReconnect();
            return false;
        }

        state.ws = sock;
        var openTimeout = setTimeout(function() {
            if (!state.connected && state.ws === sock) {
                state.brokerIdx = (state.brokerIdx + 1) % urls.length;
                closeSocket(false);
                scheduleReconnect();
            }
        }, 8000);

        sock.onopen = function() {
            clearTimeout(openTimeout);
            if (state.ws !== sock) return;
            try {
                var connPkt = buildConnectPacket({
                    clientId: state.clientId,
                    username: state.cfg.username,
                    password: state.cfg.password,
                    keepAliveSec: 30
                });
                sock.send(connPkt);
            } catch (e) {
                closeSocket(false);
                scheduleReconnect();
            }
        };

        sock.onmessage = function(ev) {
            if (state.ws !== sock) return;
            if (ev.data instanceof ArrayBuffer) {
                var chunk = new Uint8Array(ev.data);
                state.rxBuf = state.rxBuf.length ? concatUint8([state.rxBuf, chunk]) : chunk;
                processIncomingBuffer();
            }
        };

        sock.onerror = function() {
            state.lastError = 'Error de conexión WSS con ' + url;
        };

        sock.onclose = function() {
            clearTimeout(openTimeout);
            if (state.ws !== sock) return;
            var wasConn = state.connected;
            closeSocket(false);
            if (!wasConn) {
                state.brokerIdx = (state.brokerIdx + 1) % urls.length;
            }
            if (!state.manualDisconnect) {
                scheduleReconnect();
            }
            notifyUiStatusChanged();
        };

        return true;
    }

    function disconnect() {
        state.manualDisconnect = true;
        closeSocket(true);
        state.statusLabel = 'MQTT desconectado';
        notifyUiStatusChanged();
    }

    function reconnect() {
        state.manualDisconnect = false;
        state.brokerIdx = 0;
        state.reconnectDelayMs = 1500;
        closeSocket(false);
        return connect();
    }

    async function publishTopic(topicKey, obj, qos) {
        if (!state.connected || !state.ws || state.ws.readyState !== WebSocket.OPEN || !state.topics) {
            return false;
        }
        var topic = state.topics[topicKey];
        if (!topic) return false;
        try {
            var payloadObj = Object.assign(
                { msgId: 'm-' + Date.now() + '-' + randomHex(4) },
                obj || {}
            );
            var bytes = await encryptPayload(payloadObj, state.cfg);
            var q = typeof qos === 'number' ? qos : 1;
            var pkt = buildPublishPacket(topic, bytes, q, false, q > 0 ? nextPacketId() : 0);
            state.ws.send(pkt);
            return true;
        } catch (err) {
            console.warn('[MonarcaMQTT Publish]', err);
            return false;
        }
    }

    function aplicarConfigPairingDesdeNube(docData) {
        if (!docData || typeof docData !== 'object') return false;
        var ch = String(docData.channelId || '').trim();
        if (!ch) return false;
        // Respetar override manual de broker privado si el usuario lo configuró explícitamente
        if (state.cfg.customOverride) return false;

        var incomingWs = String(docData.wsUrl || DEFAULT_WS_URL).trim() || DEFAULT_WS_URL;
        var incomingFb = String(docData.fallbackWsUrl || DEFAULT_FALLBACK_WS_URL).trim();
        var incomingKey = String(docData.secretKey || '').trim();
        var incomingEnc = docData.encrypt !== false;
        var incomingEnabled = docData.enabled !== false;
        var incomingUser = String(docData.username || '').trim();
        var incomingPass = String(docData.password || '');

        var changed = (
            state.cfg.channelId !== ch ||
            state.cfg.secretKey !== incomingKey ||
            state.cfg.wsUrl !== incomingWs ||
            state.cfg.encrypt !== incomingEnc ||
            state.cfg.enabled !== incomingEnabled ||
            state.cfg.username !== incomingUser ||
            state.cfg.password !== incomingPass
        );

        state.cfg.channelId = ch;
        state.cfg.secretKey = incomingKey;
        state.cfg.wsUrl = incomingWs;
        state.cfg.fallbackWsUrl = incomingFb;
        state.cfg.host = String(docData.host || state.cfg.host || 'broker.emqx.io');
        state.cfg.port = Number(docData.port) || 8883;
        state.cfg.encrypt = incomingEnc;
        state.cfg.enabled = incomingEnabled;
        state.cfg.username = incomingUser;
        state.cfg.password = incomingPass;
        state.cfg.updatedAt = Number(docData.updatedAt) || Date.now();
        persistConfig(state.cfg);

        if (changed || (!state.connected && !state.connecting && state.cfg.enabled)) {
            reconnect();
        }
        return true;
    }

    function saveConfig(newCfg, opts) {
        var merged = Object.assign({}, state.cfg, newCfg || {});
        merged.wsUrl = String(merged.wsUrl || DEFAULT_WS_URL).trim() || DEFAULT_WS_URL;
        merged.channelId = String(merged.channelId || '').trim();
        merged.secretKey = String(merged.secretKey || '').trim();
        merged.username = String(merged.username || '').trim();
        merged.password = String(merged.password || '');
        merged.encrypt = Boolean(merged.encrypt);
        merged.enabled = merged.enabled !== false;
        if (opts && typeof opts.customOverride === 'boolean') {
            merged.customOverride = opts.customOverride;
        }
        merged.updatedAt = Date.now();
        state.cfg = merged;
        persistConfig(state.cfg);
        if (merged.enabled && merged.channelId) {
            reconnect();
        } else {
            disconnect();
        }
        return merged;
    }

    function getStatus() {
        return {
            connected: Boolean(state.connected),
            connecting: Boolean(state.connecting),
            enabled: Boolean(state.cfg.enabled),
            configured: Boolean(state.cfg.channelId),
            encrypted: Boolean(state.cfg.encrypt && state.cfg.secretKey),
            channelId: state.cfg.channelId || '',
            activeWsUrl: state.activeWsUrl || state.cfg.wsUrl || '',
            statusLabel: state.statusLabel,
            lastError: state.lastError,
            lastMessageAt: state.lastMessageAt,
            lastLatencyMs: state.lastLatencyMs,
            pcOnline: state.pcPresence ? Boolean(state.pcPresence.online) : null,
            pcPresenceReason: state.pcPresence ? String(state.pcPresence.reason || '') : '',
            pcPresenceAt: state.pcPresence ? Number(state.pcPresence.ts || state.pcPresence.receivedAt || 0) : 0
        };
    }

    function getConfig() {
        return Object.assign({}, state.cfg);
    }

    async function enviarSolicitud(payload) {
        return publishTopic('enqueue', payload, 1);
    }

    async function cancelarSolicitud(ideaId) {
        return publishTopic('cancel', { ideaId: String(ideaId || '') }, 1);
    }

    async function enviarDecisionPlan(decision) {
        return publishTopic('planDecision', decision || {}, 1);
    }

    async function enviarComandoPC(action, extra) {
        var body = Object.assign({ action: String(action || '').trim().toLowerCase() }, extra || {});
        return publishTopic('command', body, 1);
    }

    function probarPing() {
        return new Promise(function(resolve) {
            if (!state.connected) {
                resolve({ ok: false, error: 'MQTT no está conectado en este momento.' });
                return;
            }
            var pingId = 'ping-' + Date.now() + '-' + randomHex(3);
            var sentAt = Date.now();
            var timer = setTimeout(function() {
                delete state.pendingPings[pingId];
                resolve({ ok: false, error: 'Sin respuesta de Auto-PC (verifica que Auto-PC esté abierto).' });
            }, 6000);
            state.pendingPings[pingId] = { sentAt: sentAt, timer: timer, resolve: resolve };
            enviarComandoPC('ping', { pingId: pingId, clientTs: sentAt }).then(function(sent) {
                if (!sent) {
                    clearTimeout(timer);
                    delete state.pendingPings[pingId];
                    resolve({ ok: false, error: 'No se pudo publicar el ping MQTT.' });
                }
            });
        });
    }

    // ------------------------------------------------------------------------
    // MODAL DARK GLASS DE CONFIGURACIÓN Y DIAGNÓSTICO MQTT
    // ------------------------------------------------------------------------

    function actualizarModalEstadoMQTT() {
        var badge = document.getElementById('mqtt-modal-status-badge');
        var meta = document.getElementById('mqtt-modal-status-meta');
        if (!badge) return;
        var st = getStatus();
        if (st.connected) {
            badge.textContent = st.pcOnline === true
                ? '🟢 Conectado · Auto-PC en línea'
                : (st.pcOnline === false ? '🟡 Broker conectado · Auto-PC cerrado' : '🟢 Broker MQTT conectado');
            badge.className = 'mqtt-status-pill is-online';
        } else if (st.connecting) {
            badge.textContent = '🟡 Conectando a broker MQTT...';
            badge.className = 'mqtt-status-pill is-connecting';
        } else if (!st.configured) {
            badge.textContent = '⏳ Esperando emparejamiento automático desde Auto-PC';
            badge.className = 'mqtt-status-pill is-idle';
        } else {
            badge.textContent = '🔴 ' + (st.lastError || st.statusLabel || 'Desconectado');
            badge.className = 'mqtt-status-pill is-offline';
        }
        if (meta) {
            var parts = [];
            if (st.activeWsUrl) parts.push(st.activeWsUrl);
            if (st.encrypted) parts.push('Cifrado AES-256-GCM');
            if (st.lastLatencyMs !== null) parts.push('Latencia PC: ' + st.lastLatencyMs + ' ms');
            meta.textContent = parts.join(' · ') || 'Configura un broker o abre Auto-PC para emparejar automáticamente.';
        }
    }

    function abrirModalConfigMQTT() {
        var modal = document.getElementById('modal-mqtt-autopc');
        if (!modal) return;
        var c = getConfig();
        var setVal = function(id, val) {
            var el = document.getElementById(id);
            if (el) el.value = val !== undefined && val !== null ? String(val) : '';
        };
        var setChk = function(id, val) {
            var el = document.getElementById(id);
            if (el) el.checked = Boolean(val);
        };
        setChk('mqtt-cfg-enabled', c.enabled !== false);
        setChk('mqtt-cfg-encrypt', c.encrypt !== false);
        setChk('mqtt-cfg-custom', Boolean(c.customOverride));
        setVal('mqtt-cfg-ws-url', c.wsUrl || DEFAULT_WS_URL);
        setVal('mqtt-cfg-channel', c.channelId || '');
        setVal('mqtt-cfg-secret', c.secretKey || '');
        setVal('mqtt-cfg-user', c.username || '');
        setVal('mqtt-cfg-pass', c.password || '');
        var pingRes = document.getElementById('mqtt-modal-ping-result');
        if (pingRes) pingRes.textContent = '';

        actualizarModalEstadoMQTT();
        modal.style.display = 'flex';
    }

    function cerrarModalConfigMQTT() {
        var modal = document.getElementById('modal-mqtt-autopc');
        if (modal) modal.style.display = 'none';
    }

    function aplicarPresetBrokerMQTT(preset) {
        var wsEl = document.getElementById('mqtt-cfg-ws-url');
        var customEl = document.getElementById('mqtt-cfg-custom');
        var encEl = document.getElementById('mqtt-cfg-encrypt');
        if (preset === 'emqx') {
            if (wsEl) wsEl.value = DEFAULT_WS_URL;
            if (customEl) customEl.checked = false;
            if (encEl) encEl.checked = true;
        } else if (preset === 'hivemq_public') {
            if (wsEl) wsEl.value = DEFAULT_FALLBACK_WS_URL;
            if (customEl) customEl.checked = false;
            if (encEl) encEl.checked = true;
        } else if (preset === 'hivemq_cloud') {
            if (wsEl) wsEl.value = 'wss://TU-CLUSTER.s1.eu.hivemq.cloud:8884/mqtt';
            if (customEl) customEl.checked = true;
            if (encEl) encEl.checked = true;
        }
    }

    function guardarModalConfigMQTT() {
        var val = function(id) {
            var el = document.getElementById(id);
            return el ? String(el.value || '').trim() : '';
        };
        var chk = function(id) {
            var el = document.getElementById(id);
            return Boolean(el && el.checked);
        };
        saveConfig(
            {
                enabled: chk('mqtt-cfg-enabled'),
                encrypt: chk('mqtt-cfg-encrypt'),
                wsUrl: val('mqtt-cfg-ws-url') || DEFAULT_WS_URL,
                channelId: val('mqtt-cfg-channel'),
                secretKey: val('mqtt-cfg-secret'),
                username: val('mqtt-cfg-user'),
                password: (document.getElementById('mqtt-cfg-pass') || {}).value || ''
            },
            { customOverride: chk('mqtt-cfg-custom') }
        );
        actualizarModalEstadoMQTT();
        if (typeof global.mostrarToastMonarca === 'function') {
            global.mostrarToastMonarca('Configuración MQTT guardada · reconectando...', '⚡');
        }
    }

    async function probarPingDesdeModalMQTT() {
        var out = document.getElementById('mqtt-modal-ping-result');
        if (out) {
            out.style.color = '#38bdf8';
            out.textContent = '📡 Enviando ping en tiempo real a Auto-PC...';
        }
        var res = await probarPing();
        if (out) {
            if (res.ok) {
                out.style.color = '#34d399';
                out.textContent = '✅ ¡Auto-PC respondió en ' + res.latencyMs + ' ms! Conexión en tiempo real operativa.';
            } else {
                out.style.color = '#fbbf24';
                out.textContent = '⚠️ ' + (res.error || 'Sin respuesta de Auto-PC.');
            }
        }
    }

    // Auto-conexión al cargar y recuperación tras red / segundo plano
    if (typeof window !== 'undefined') {
        window.addEventListener('online', function() {
            if (state.cfg.enabled && state.cfg.channelId && !state.connected) {
                reconnect();
            }
        });
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible' && state.cfg.enabled && state.cfg.channelId) {
                if (!state.connected && !state.connecting) {
                    reconnect();
                } else if (state.connected) {
                    enviarComandoPC('ping', { silent: true }).catch(function() {});
                }
            }
        });
        var _bootMqtt = function() {
            if (state.cfg.enabled && state.cfg.channelId) {
                connect();
            }
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _bootMqtt);
        } else {
            setTimeout(_bootMqtt, 150);
        }
    }

    global.MonarcaMQTT = {
        connect: connect,
        disconnect: disconnect,
        reconnect: reconnect,
        getStatus: getStatus,
        getConfig: getConfig,
        saveConfig: saveConfig,
        aplicarConfigPairingDesdeNube: aplicarConfigPairingDesdeNube,
        enviarSolicitud: enviarSolicitud,
        cancelarSolicitud: cancelarSolicitud,
        enviarDecisionPlan: enviarDecisionPlan,
        enviarComandoPC: enviarComandoPC,
        probarPing: probarPing,
        abrirModalConfigMQTT: abrirModalConfigMQTT,
        cerrarModalConfigMQTT: cerrarModalConfigMQTT,
        aplicarPresetBrokerMQTT: aplicarPresetBrokerMQTT,
        guardarModalConfigMQTT: guardarModalConfigMQTT,
        probarPingDesdeModalMQTT: probarPingDesdeModalMQTT,
        _internals: {
            encryptPayload: encryptPayload,
            decryptPayload: decryptPayload,
            buildTopics: buildTopics
        }
    };
    global.abrirModalConfigMQTT = abrirModalConfigMQTT;
    global.cerrarModalConfigMQTT = cerrarModalConfigMQTT;
    global.aplicarPresetBrokerMQTT = aplicarPresetBrokerMQTT;
    global.guardarModalConfigMQTT = guardarModalConfigMQTT;
    global.probarPingDesdeModalMQTT = probarPingDesdeModalMQTT;
})(typeof window !== 'undefined' ? window : globalThis);
