/**
 * SISTEMA MONARCA · MÓDULO DE ESTADO PERSONAL
 * Mapa de Calor Anatómico SVG, Banco de Ejercicios, Rutinas Dinámicas y Mente.
 */

var METADATOS_MUSCULOS = {
    "mente": { nombre: "Mente & Concentración", icono: "🧠", region: "Sistema Neural · Cabeza", descanso: "Descanso mental, desconexión y sueño reparador." },
    "delt_ant": { nombre: "Deltoides Anterior (Frontal)", icono: "🛡️", region: "Hombros · Tren Superior", descanso: "Reducir empujes y movimientos verticales." },
    "delt_lat": { nombre: "Deltoides Lateral (Anchura)", icono: "🛡️", region: "Hombros · Tren Superior", descanso: "Limitar elevaciones laterales y presses." },
    "delt_post": { nombre: "Deltoides Posterior (Dorsal)", icono: "🛡️", region: "Hombros · Tren Superior", descanso: "Descansar jalones traseros y aperturas invertidas." },
    "manguito": { nombre: "Manguito Rotador", icono: "🔄", region: "Hombros · Estabilizadores", descanso: "Evitar sobrecargas articulares pesadas." },
    "pect_mayor": { nombre: "Pectoral Mayor", icono: "⚔️", region: "Pecho · Tren Superior", descanso: "Óptimo descansar 48 hrs tras press pesado." },
    "pect_menor": { nombre: "Pectoral Menor", icono: "⚔️", region: "Pecho · Tren Superior", descanso: "Realizar estiramientos suaves de apertura torácica." },
    "biceps": { nombre: "Bíceps Braquial", icono: "💪", region: "Brazos · Flexores", descanso: "Descansar curls y flexiones de codo intensas." },
    "triceps": { nombre: "Tríceps Braquial", icono: "💪", region: "Brazos · Extensores", descanso: "Reducir fondos y extensiones de tríceps." },
    "antebrazos": { nombre: "Antebrazos & Agarre", icono: "✊", region: "Brazos · Agarre y Muñecas", descanso: "Masajear flexores y estirar dedos y muñecas." },
    "trapecios": { nombre: "Trapecios y Romboides", icono: "🦅", region: "Espalda Superior · Cuello", descanso: "Liberar tensión cervical y postura de hombros." },
    "dorsales": { nombre: "Dorsales & Redondos", icono: "🦅", region: "Espalda Media · Anchura V", descanso: "Descansar dominadas y jalones pesados." },
    "lumbares": { nombre: "Erectores Espinales (Lumbar)", icono: "🏛️", region: "Espalda Baja · Núcleo", descanso: "Evitar cargas axiales de peso muerto y sentadilla." },
    "core": { nombre: "Core (Abdomen & Oblicuos)", icono: "⚡", region: "Centro de Estabilidad", descanso: "Descansar flexiones de tronco e isométricos." },
    "gluteos": { nombre: "Glúteos (Mayor & Medio)", icono: "🍑", region: "Cadera & Tren Inferior", descanso: "Estirar flexores de cadera y movilidad." },
    "cadera": { nombre: "Cadera / Aductores", icono: "🥋", region: "Pelvis · Estabilidad", descanso: "Movilidad articular profunda y estiramiento." },
    "cuadriceps": { nombre: "Cuádriceps", icono: "🦵", region: "Muslos · Tren Inferior", descanso: "Hidratar cuádriceps tras sesiones de sentadilla." },
    "isquios": { nombre: "Isquiotibiales", icono: "🦵", region: "Cadena Posterior · Piernas", descanso: "Estiramiento suave de cadena posterior y descanso." },
    "pantorrillas": { nombre: "Pantorrillas (Gemelos & Sóleo)", icono: "🦶", region: "Piernas Bajas & Tobillos", descanso: "Movilidad de tobillos y elevaciones suaves." }
};

var MUSCULO_ACTIVO_HEATMAP = "pect_mayor";

function cargarEstadoPersonal() {
    renderizarBarrasFatiga(APP_STATE.fatiga);
}

function obtenerEstiloFatigaGris(val) {
    var v = Math.min(100, Math.max(0, Number(val) || 0));
    if (v === 0) {
        return { fill: 'rgba(243, 244, 246, 0.65)', stroke: '#d1d5db', label: '0% · Sin fatiga', levelText: 'Completamente fresco' };
    }
    if (v <= 35) {
        return { fill: 'rgba(55, 65, 81, 0.22)', stroke: '#9ca3af', label: v + '% · Carga Ligera', levelText: 'Carga leve, óptimo para entrenar' };
    }
    if (v <= 69) {
        return { fill: 'rgba(31, 41, 55, 0.60)', stroke: '#4b5563', label: v + '% · Fatiga Moderada', levelText: 'Fatiga media acumulada, técnica cuidada' };
    }
    return { fill: '#111827', stroke: '#000000', label: v + '% · Carga Alta', levelText: 'Sobrecarga elevada, se sugiere descanso' };
}

function renderizarBarrasFatiga(f) {
    var fatiga = f || APP_STATE.fatiga || {};

    // Calcular estadísticas globales
    var sumaTotal = 0;
    var countTotal = 0;
    var maxVal = -1;
    var maxKey = "mente";

    Object.keys(METADATOS_MUSCULOS).forEach(function(k) {
        var val = Number(fatiga[k]) || 0;
        sumaTotal += val;
        countTotal++;
        if (val > maxVal) {
            maxVal = val;
            maxKey = k;
        }
    });

    var promedioGeneral = countTotal > 0 ? Math.round(sumaTotal / countTotal) : 0;
    var promedioElem = document.getElementById('promedio-hoy-display');
    var cierreElem = document.getElementById('ultimo-cierre-display');
    if (promedioElem) promedioElem.innerText = promedioGeneral + "%";
    if (cierreElem) cierreElem.innerText = fatiga.ultimoCierre || "Registro local activo";

    if (!MUSCULO_ACTIVO_HEATMAP || !METADATOS_MUSCULOS[MUSCULO_ACTIVO_HEATMAP]) {
        MUSCULO_ACTIVO_HEATMAP = maxKey;
    }

    // Helper para obtener estilo de color en SVG
    function estilo(key) {
        var s = obtenerEstiloFatigaGris(fatiga[key]);
        return `fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.3"`;
    }

    var html = `
    <div class="heatmap-dashboard-card">
        <div class="heatmap-layout">
            <!-- COLUMNA 1: SILUETA ANATÓMICA CORPORAL (FRONTAL & DORSAL) -->
            <div class="body-diagram-box">
                <div style="display: flex; justify-content: space-around; margin-bottom: 8px;">
                    <span style="font-size: 11px; font-weight: 800; color: #111827; letter-spacing: 0.5px;">ANTERIOR (FRENTE)</span>
                    <span style="font-size: 11px; font-weight: 800; color: #111827; letter-spacing: 0.5px;">POSTERIOR (ESPALDA)</span>
                </div>

                <div class="body-diagram-svg-container">
                    <svg viewBox="0 0 440 330" class="body-silhouette-svg">
                        <defs>
                            <filter id="hud-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#111827" flood-opacity="0.35"/>
                            </filter>
                        </defs>

                        <!-- SILUETA FRONTAL (X: 110 centro) -->
                        <g id="silueta-frontal">
                            <!-- Cabeza / Mente -->
                            <ellipse cx="110" cy="38" rx="18" ry="22" ${estilo('mente')} class="muscle-zone-path" data-muscle="mente" onclick="seleccionarMusculoHeatmap('mente')"></ellipse>
                            
                            <!-- Hombros Deltoides Anterior -->
                            <path d="M84 66 C76 72 70 82 72 94 C76 96 86 94 90 82 C90 74 88 68 84 66 Z" ${estilo('delt_ant')} class="muscle-zone-path" data-muscle="delt_ant" onclick="seleccionarMusculoHeatmap('delt_ant')"></path>
                            <path d="M136 66 C144 72 150 82 148 94 C144 96 134 94 130 82 C130 74 132 68 136 66 Z" ${estilo('delt_ant')} class="muscle-zone-path" data-muscle="delt_ant" onclick="seleccionarMusculoHeatmap('delt_ant')"></path>
                            
                            <!-- Pectoral Mayor -->
                            <path d="M90 75 C96 73 108 73 109 76 L109 102 C100 104 88 98 86 90 C86 82 88 77 90 75 Z" ${estilo('pect_mayor')} class="muscle-zone-path" data-muscle="pect_mayor" onclick="seleccionarMusculoHeatmap('pect_mayor')"></path>
                            <path d="M130 75 C124 73 112 73 111 76 L111 102 C120 104 132 98 134 90 C134 82 132 77 130 75 Z" ${estilo('pect_mayor')} class="muscle-zone-path" data-muscle="pect_mayor" onclick="seleccionarMusculoHeatmap('pect_mayor')"></path>

                            <!-- Pectoral Menor / Inferior -->
                            <path d="M91 103 L108 103 L106 111 C98 113 93 109 91 103 Z" ${estilo('pect_menor')} class="muscle-zone-path" data-muscle="pect_menor" onclick="seleccionarMusculoHeatmap('pect_menor')"></path>
                            <path d="M129 103 L112 103 L114 111 C122 113 127 109 129 103 Z" ${estilo('pect_menor')} class="muscle-zone-path" data-muscle="pect_menor" onclick="seleccionarMusculoHeatmap('pect_menor')"></path>

                            <!-- Bíceps -->
                            <path d="M72 96 C68 108 68 120 72 132 C78 132 84 124 84 114 C84 104 80 97 72 96 Z" ${estilo('biceps')} class="muscle-zone-path" data-muscle="biceps" onclick="seleccionarMusculoHeatmap('biceps')"></path>
                            <path d="M148 96 C152 108 152 120 148 132 C142 132 136 124 136 114 C136 104 140 97 148 96 Z" ${estilo('biceps')} class="muscle-zone-path" data-muscle="biceps" onclick="seleccionarMusculoHeatmap('biceps')"></path>

                            <!-- Antebrazos Frontales -->
                            <path d="M72 134 C64 146 58 162 58 178 C64 182 72 176 74 164 C76 152 76 142 72 134 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                            <path d="M148 134 C156 146 162 162 162 178 C156 182 148 176 146 164 C144 152 144 142 148 134 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>

                            <!-- Core / Abdomen -->
                            <path d="M96 114 C104 112 116 112 124 114 C126 128 124 146 120 158 C114 162 106 162 100 158 C96 146 94 128 96 114 Z" ${estilo('core')} class="muscle-zone-path" data-muscle="core" onclick="seleccionarMusculoHeatmap('core')"></path>

                            <!-- Cadera / Aductores -->
                            <path d="M96 160 C104 164 116 164 124 160 C128 168 126 178 122 184 C116 186 104 186 98 184 C94 178 92 168 96 160 Z" ${estilo('cadera')} class="muscle-zone-path" data-muscle="cadera" onclick="seleccionarMusculoHeatmap('cadera')"></path>

                            <!-- Cuádriceps -->
                            <path d="M93 186 C98 186 106 186 107 194 L105 244 C98 244 90 236 88 220 C86 206 88 194 93 186 Z" ${estilo('cuadriceps')} class="muscle-zone-path" data-muscle="cuadriceps" onclick="seleccionarMusculoHeatmap('cuadriceps')"></path>
                            <path d="M127 186 C122 186 114 186 113 194 L115 244 C122 244 130 236 132 220 C134 206 132 194 127 186 Z" ${estilo('cuadriceps')} class="muscle-zone-path" data-muscle="cuadriceps" onclick="seleccionarMusculoHeatmap('cuadriceps')"></path>

                            <!-- Pantorrillas Frontales -->
                            <path d="M90 250 C96 250 102 250 103 260 L101 306 C96 308 92 306 90 298 C88 286 86 270 90 250 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                            <path d="M130 250 C124 250 118 250 117 260 L119 306 C124 308 128 306 130 298 C132 286 134 270 130 250 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                        </g>

                        <!-- SILUETA DORSAL (X: 330 centro) -->
                        <g id="silueta-dorsal">
                            <!-- Cabeza / Mente (Dorsal) -->
                            <ellipse cx="330" cy="38" rx="18" ry="22" ${estilo('mente')} class="muscle-zone-path" data-muscle="mente" onclick="seleccionarMusculoHeatmap('mente')"></ellipse>

                            <!-- Trapecios -->
                            <path d="M322 58 L338 58 L354 75 C344 86 336 94 330 96 C324 94 316 86 306 75 Z" ${estilo('trapecios')} class="muscle-zone-path" data-muscle="trapecios" onclick="seleccionarMusculoHeatmap('trapecios')"></path>

                            <!-- Deltoides Posterior -->
                            <path d="M304 68 C296 74 290 84 292 94 C298 96 306 92 310 82 Z" ${estilo('delt_post')} class="muscle-zone-path" data-muscle="delt_post" onclick="seleccionarMusculoHeatmap('delt_post')"></path>
                            <path d="M356 68 C364 74 370 84 368 94 C362 96 354 92 350 82 Z" ${estilo('delt_post')} class="muscle-zone-path" data-muscle="delt_post" onclick="seleccionarMusculoHeatmap('delt_post')"></path>

                            <!-- Tríceps -->
                            <path d="M292 96 C288 108 288 122 292 134 C298 134 304 126 304 116 C304 106 300 98 292 96 Z" ${estilo('triceps')} class="muscle-zone-path" data-muscle="triceps" onclick="seleccionarMusculoHeatmap('triceps')"></path>
                            <path d="M368 96 C372 108 372 122 368 134 C362 134 356 126 356 116 C356 106 360 98 368 96 Z" ${estilo('triceps')} class="muscle-zone-path" data-muscle="triceps" onclick="seleccionarMusculoHeatmap('triceps')"></path>

                            <!-- Dorsales (Lats) -->
                            <path d="M312 96 C320 94 340 94 348 96 C352 110 348 128 342 138 C334 140 326 140 318 138 C312 128 308 110 312 96 Z" ${estilo('dorsales')} class="muscle-zone-path" data-muscle="dorsales" onclick="seleccionarMusculoHeatmap('dorsales')"></path>

                            <!-- Lumbares -->
                            <path d="M320 138 C326 138 334 138 340 138 C342 148 340 158 338 164 C334 166 326 166 322 164 C320 158 318 148 320 138 Z" ${estilo('lumbares')} class="muscle-zone-path" data-muscle="lumbares" onclick="seleccionarMusculoHeatmap('lumbares')"></path>

                            <!-- Glúteos -->
                            <path d="M312 164 C322 164 329 166 329 178 C328 190 322 198 314 196 C306 192 304 180 312 164 Z" ${estilo('gluteos')} class="muscle-zone-path" data-muscle="gluteos" onclick="seleccionarMusculoHeatmap('gluteos')"></path>
                            <path d="M348 164 C338 164 331 166 331 178 C332 190 338 198 346 196 C354 192 356 180 348 164 Z" ${estilo('gluteos')} class="muscle-zone-path" data-muscle="gluteos" onclick="seleccionarMusculoHeatmap('gluteos')"></path>

                            <!-- Isquiotibiales -->
                            <path d="M312 198 C318 198 326 198 327 206 L325 246 C318 246 310 238 308 222 C306 210 308 202 312 198 Z" ${estilo('isquios')} class="muscle-zone-path" data-muscle="isquios" onclick="seleccionarMusculoHeatmap('isquios')"></path>
                            <path d="M348 198 C342 198 334 198 333 206 L335 246 C342 246 350 238 352 222 C354 210 352 202 348 198 Z" ${estilo('isquios')} class="muscle-zone-path" data-muscle="isquios" onclick="seleccionarMusculoHeatmap('isquios')"></path>

                            <!-- Pantorrillas Dorsales -->
                            <path d="M310 252 C318 252 322 254 323 264 L321 306 C316 308 312 306 310 298 C306 286 304 270 310 252 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                            <path d="M350 252 C342 252 338 254 337 264 L339 306 C344 308 348 306 350 298 C354 286 356 270 350 252 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>

                            <!-- Antebrazos Dorsales -->
                            <path d="M292 136 C284 148 278 164 278 180 C284 184 292 178 294 166 C296 154 296 144 292 136 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                            <path d="M368 136 C376 148 382 164 382 180 C376 184 368 178 366 166 C364 154 364 144 368 136 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                        </g>
                    </svg>
                </div>

                <!-- LEYENDA DEL MAPA DE CALOR -->
                <div class="heatmap-legend-box">
                    <div class="legend-item">
                        <span class="legend-swatch" style="background: rgba(243, 244, 246, 0.7); border-color:#d1d5db;"></span>
                        <span>0% Óptimo</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-swatch" style="background: rgba(55, 65, 81, 0.22); border-color:#9ca3af;"></span>
                        <span>1-35% Leve</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-swatch" style="background: rgba(31, 41, 55, 0.60); border-color:#4b5563;"></span>
                        <span>36-69% Media</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-swatch" style="background: #111827; border-color:#000000;"></span>
                        <span>70-100% Alta</span>
                    </div>
                </div>
            </div>

            <!-- COLUMNA 2: PANEL DE DETALLE HUD Y SELECTOR RÁPIDO -->
            <div class="heatmap-hud-panel" id="hud-panel-container">
                <!-- Se llena mediante actualizarHudMusculo -->
            </div>
        </div>
    </div>`;

    var contenedor = document.getElementById('contenedor-grafica-fatiga');
    if (contenedor) {
        contenedor.innerHTML = html;
        actualizarHudMusculo(MUSCULO_ACTIVO_HEATMAP);
    }
}

function seleccionarMusculoHeatmap(key) {
    if (!METADATOS_MUSCULOS[key]) return;
    MUSCULO_ACTIVO_HEATMAP = key;

    // Resaltar en SVG
    var allPaths = document.querySelectorAll('.muscle-zone-path');
    allPaths.forEach(function(p) {
        if (p.getAttribute('data-muscle') === key) {
            p.classList.add('selected-muscle');
        } else {
            p.classList.remove('selected-muscle');
        }
    });

    actualizarHudMusculo(key);
}

function actualizarHudMusculo(key) {
    var meta = METADATOS_MUSCULOS[key];
    if (!meta) return;

    var val = Math.min(100, Math.max(0, Number(APP_STATE.fatiga[key]) || 0));
    var estiloInfo = obtenerEstiloFatigaGris(val);

    var hudCont = document.getElementById('hud-panel-container');
    if (!hudCont) return;

    // Generar chips para selección rápida
    var chipsHtml = '';
    var gruposPrincipales = [
        { key: "mente", label: "🧠 Mente" },
        { key: "delt_ant", label: "🛡️ Hombros" },
        { key: "pect_mayor", label: "⚔️ Pecho" },
        { key: "biceps", label: "💪 Bíceps" },
        { key: "triceps", label: "💪 Tríceps" },
        { key: "antebrazos", label: "✊ Antebrazos" },
        { key: "trapecios", label: "🦅 Trapecios" },
        { key: "dorsales", label: "🦅 Dorsales" },
        { key: "lumbares", label: "🏛️ Lumbares" },
        { key: "core", label: "⚡ Core" },
        { key: "gluteos", label: "🍑 Glúteos" },
        { key: "cadera", label: "🥋 Cadera" },
        { key: "cuadriceps", label: "🦵 Cuádriceps" },
        { key: "isquios", label: "🦵 Isquios" },
        { key: "pantorrillas", label: "🦶 Pantorrillas" }
    ];

    gruposPrincipales.forEach(function(g) {
        var activeClass = (g.key === key) ? 'active' : '';
        chipsHtml += `<button class="hud-chip ${activeClass}" onclick="seleccionarMusculoHeatmap('${g.key}')">${g.label}</button>`;
    });

    hudCont.innerHTML = `
        <div class="hud-muscle-card">
            <div class="hud-muscle-header">
                <span class="hud-muscle-region">${meta.region}</span>
                <span style="font-size: 11px; font-weight: 700; background: #e5e7eb; color: #374151; padding: 2px 8px; border-radius: 9999px;">
                    ${estiloInfo.levelText}
                </span>
            </div>
            <h3 class="hud-muscle-title">
                <span>${meta.icono}</span>
                <span>${meta.nombre}</span>
            </h3>
            <div class="hud-fatigue-big">
                ${val}% <span style="font-size: 14px; font-weight: 600; color: #6b7280;">Nivel de Desgaste</span>
            </div>
            <div class="hud-progress-track">
                <div class="hud-progress-fill" style="width: ${val}%;"></div>
            </div>
            <div class="hud-recovery-tip">
                <strong>Consejo de Recuperación:</strong> ${meta.descanso}
            </div>
        </div>

        <div>
            <div class="hud-quick-chips-title">Selección Rápida de Grupo Muscular:</div>
            <div class="hud-quick-chips-grid">
                ${chipsHtml}
            </div>
        </div>
    `;
}


// ==========================================================================
// 7. GYM, RUTINAS Y EJERCICIOS
// ==========================================================================

var RUTINA_PALETA = [
    { icono: '🌅', rankLabel: 'DIARIA · ACTIVACIÓN' },
    { icono: '🔥', rankLabel: 'FUERZA · INTENSIDAD' },
    { icono: '🦵', rankLabel: 'POTENCIA · RESISTENCIA' },
    { icono: '🛡️', rankLabel: 'TRACCIÓN · TÉCNICA' }
];

var RUTINA_ACTIVA = null;

// ==========================================================================
// 7. EJERCICIOS, RUTINAS DINÁMICAS Y CONDICIÓN FÍSICA (GYM)
// ==========================================================================

var CHIPS_SELECCIONADOS_MUSCULOS = [];

var MAPA_CATEGORIAS_A_MUSCULOS = {
    "Mente": ["mente"],
    "Hombros": ["delt_ant", "delt_lat", "delt_post"],
    "Pecho": ["pect_mayor", "pect_menor"],
    "Bíceps": ["biceps"],
    "Tríceps": ["triceps"],
    "Antebrazos": ["antebrazos"],
    "Trapecios": ["trapecios"],
    "Dorsales": ["dorsales"],
    "Lumbares": ["lumbares"],
    "Core": ["core"],
    "Glúteos": ["gluteos"],
    "Cadera": ["cadera"],
    "Cuádriceps": ["cuadriceps"],
    "Isquios": ["isquios"],
    "Pantorrillas": ["pantorrillas"]
};

var RUTINA_ACTIVA = null;

// --- GESTIÓN DE EJERCICIOS ---

function cargarEjercicios() {
    renderizarEjercicios(APP_STATE.ejercicios);
}

function toggleChipMusculo(btn) {
    var cat = btn.getAttribute('data-cat');
    if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        CHIPS_SELECCIONADOS_MUSCULOS = CHIPS_SELECCIONADOS_MUSCULOS.filter(function(c) { return c !== cat; });
    } else {
        btn.classList.add('selected');
        if (!CHIPS_SELECCIONADOS_MUSCULOS.includes(cat)) {
            CHIPS_SELECCIONADOS_MUSCULOS.push(cat);
        }
    }
}

function abrirModalNuevoEjercicio() {
    CHIPS_SELECCIONADOS_MUSCULOS = [];
    var chips = document.querySelectorAll('.muscle-chip-btn');
    chips.forEach(function(c) { c.classList.remove('selected'); });
    var inNom = document.getElementById('modal-ejercicio-nombre');
    var inDesc = document.getElementById('modal-ejercicio-desc');
    if (inNom) inNom.value = "";
    if (inDesc) inDesc.value = "";
    var m = document.getElementById('modal-nuevo-ejercicio');
    if (m) m.style.display = 'flex';
}

function cerrarModalNuevoEjercicio() {
    var m = document.getElementById('modal-nuevo-ejercicio');
    if (m) m.style.display = 'none';
}

function confirmarAgregarEjercicio() {
    var inNom = document.getElementById('modal-ejercicio-nombre');
    var inDesc = document.getElementById('modal-ejercicio-desc');
    var inSeries = document.getElementById('modal-ejercicio-series');
    var inReps = document.getElementById('modal-ejercicio-reps');
    var inFat = document.getElementById('modal-ejercicio-fatiga');

    var nom = inNom ? inNom.value.trim() : "";
    var desc = inDesc ? inDesc.value.trim() : "";
    var series = inSeries ? (Number(inSeries.value) || 4) : 4;
    var reps = inReps ? inReps.value.trim() : "10-12 reps";
    var fatigaPct = inFat ? (Number(inFat.value) || 20) : 20;

    if (!nom) {
        alert("Por favor ingresa el nombre del ejercicio.");
        return;
    }
    if (CHIPS_SELECCIONADOS_MUSCULOS.length === 0) {
        alert("Selecciona al menos una categoría o zona muscular que trabaja este ejercicio.");
        return;
    }

    if (!APP_STATE.ejercicios) APP_STATE.ejercicios = [];

    var nuevoEjercicio = {
        id: "EJ-" + Date.now(),
        nombre: nom,
        descripcion: desc || "Ejercicio de desarrollo físico",
        series: series,
        repeticiones: reps,
        categorias: [...CHIPS_SELECCIONADOS_MUSCULOS],
        fatigaPorcentaje: fatigaPct
    };

    APP_STATE.ejercicios.push(nuevoEjercicio);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevoEjercicio();
    renderizarEjercicios(APP_STATE.ejercicios);
}

function renderizarEjercicios(ejercicios) {
    var eList = ejercicios || APP_STATE.ejercicios || [];
    var cont = document.getElementById('contenedor-ejercicios');
    if (!cont) return;

    if (!eList || eList.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">⚡</span>
            <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 16px;">No tienes ejercicios registrados</h4>
            <p style="color: #6b7280; font-size: 13px; max-width: 420px; margin: 0 auto 16px auto;">
                Crea tus ejercicios especificando series, repeticiones, zonas musculares trabajadas y nivel de fatiga para armar tus rutinas.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevoEjercicio()">
                ➕ Crear Primer Ejercicio
            </button>
        </div>`;
        return;
    }

    var html = '';
    eList.forEach(function(ej) {
        var muscleBadges = (ej.categorias || []).map(function(cat) {
            return `<span class="badge-exercise-muscle">${cat}</span>`;
        }).join('');

        html += `
        <div class="exercise-card">
            <div class="exercise-card-header">
                <div>
                    <h3 class="exercise-card-name">${ej.nombre}</h3>
                    <p class="exercise-card-desc">${ej.descripcion}</p>
                </div>
                <button class="btn-delete-row" title="Eliminar ejercicio" onclick="eliminarEjercicio('${ej.id}')" style="background:none; border:none; color:#9ca3af; font-size:16px; cursor:pointer; padding:4px 8px; border-radius:6px;">✕</button>
            </div>

            <div class="exercise-badges-row">
                <span class="badge-exercise-reps">${ej.series} Series × ${ej.repeticiones}</span>
                <span class="badge-exercise-fatiga">+${ej.fatigaPorcentaje || 20}% Fatiga</span>
                ${muscleBadges}
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function eliminarEjercicio(id) {
    if (!confirm("¿Deseas eliminar este ejercicio?")) return;
    if (!APP_STATE.ejercicios) return;
    APP_STATE.ejercicios = APP_STATE.ejercicios.filter(function(e) {
        return String(e.id) !== String(id);
    });
    MonarcaDB.save(APP_STATE);
    renderizarEjercicios(APP_STATE.ejercicios);
}

// --- GESTIÓN DE RUTINAS DINÁMICAS ---

function cargarGym() {
    renderizarPortalesRutinas(APP_STATE.rutinas);
    renderizarGym(APP_STATE.gym);
}

function abrirModalNuevaRutina() {
    var contCheck = document.getElementById('modal-rutina-checklist-ejercicios');
    if (contCheck) {
        var eList = APP_STATE.ejercicios || [];
        if (eList.length === 0) {
            contCheck.innerHTML = `
            <div style="text-align: center; padding: 18px 10px; color: #6b7280; font-size: 13px;">
                No tienes ejercicios creados todavía.<br>
                <a href="javascript:void(0)" onclick="cerrarModalNuevaRutina(); cambiarVista('vista-ejercicios');" style="color: #111827; font-weight: 700; text-decoration: underline; margin-top: 6px; display: inline-block;">
                    👉 Ir a Banco de Ejercicios
                </a>
            </div>`;
        } else {
            var html = '';
            eList.forEach(function(ej) {
                var cats = (ej.categorias || []).join(', ');
                html += `
                <label class="modal-checklist-item">
                    <input type="checkbox" name="ejercicios_rutina_check" value="${ej.id}">
                    <div style="flex: 1;">
                        <strong style="color: #111827;">${ej.nombre}</strong>
                        <div style="font-size: 11.5px; color: #6b7280;">${ej.series} series × ${ej.repeticiones} · [${cats}] (+${ej.fatigaPorcentaje || 20}% fatiga)</div>
                    </div>
                </label>`;
            });
            contCheck.innerHTML = html;
        }
    }
    var inNom = document.getElementById('modal-rutina-nombre');
    var inDesc = document.getElementById('modal-rutina-desc');
    if (inNom) inNom.value = "";
    if (inDesc) inDesc.value = "";
    var m = document.getElementById('modal-nueva-rutina');
    if (m) m.style.display = 'flex';
}

function cerrarModalNuevaRutina() {
    var m = document.getElementById('modal-nueva-rutina');
    if (m) m.style.display = 'none';
}

function confirmarAgregarRutina() {
    var inNom = document.getElementById('modal-rutina-nombre');
    var inDesc = document.getElementById('modal-rutina-desc');
    var inTag = document.getElementById('modal-rutina-tag');

    var nom = inNom ? inNom.value.trim() : "";
    var desc = inDesc ? inDesc.value.trim() : "";
    var tag = inTag ? inTag.value.trim() : "DIARIA · FUERZA";

    if (!nom) {
        alert("Por favor ingresa un nombre para la rutina.");
        return;
    }

    var checkboxes = document.querySelectorAll('input[name="ejercicios_rutina_check"]:checked');
    if (checkboxes.length === 0) {
        alert("Selecciona al menos un ejercicio para esta rutina.");
        return;
    }

    var selectedIds = Array.from(checkboxes).map(function(c) { return c.value; });
    var selectedEjercicios = (APP_STATE.ejercicios || []).filter(function(e) {
        return selectedIds.includes(String(e.id));
    });

    if (!APP_STATE.rutinas) APP_STATE.rutinas = [];

    var nuevaRutina = {
        id: "RUT-" + Date.now(),
        codigo: "RUT-" + (APP_STATE.rutinas.length + 1),
        nombre: nom,
        descripcion: desc || "Entrenamiento programado",
        rankLabel: tag,
        ejercicios: selectedEjercicios
    };

    APP_STATE.rutinas.push(nuevaRutina);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevaRutina();
    renderizarPortalesRutinas(APP_STATE.rutinas);
}

function eliminarRutina(idx, event) {
    if (event) event.stopPropagation();
    if (!confirm("¿Deseas eliminar esta rutina programada?")) return;
    if (!APP_STATE.rutinas) return;
    APP_STATE.rutinas.splice(idx, 1);
    MonarcaDB.save(APP_STATE);
    renderizarPortalesRutinas(APP_STATE.rutinas);
}

function renderizarPortalesRutinas(rutinas) {
    var cont = document.getElementById('contenedor-portales-rutinas');
    if (!cont) return;

    var rList = rutinas || APP_STATE.rutinas || [];

    if (!rList || rList.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 35px 20px; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🏋️‍♂️</span>
            <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 16px;">No tienes rutinas creadas</h4>
            <p style="color: #6b7280; font-size: 13px; max-width: 420px; margin: 0 auto 16px auto;">
                Arma tus sesiones de entrenamiento personalizadas seleccionando los ejercicios que has creado.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevaRutina()">
                ➕ Crear Primera Rutina
            </button>
        </div>`;
        return;
    }

    var html = '';
    rList.forEach(function(rut, idx) {
        var numEj = rut.ejercicios ? rut.ejercicios.length : 0;
        var badgeEj = numEj > 0 ? numEj + ' Ejercicios' : 'Sin Ejercicios';

        html += `
        <div class="quest-card" onclick="abrirDetalleRutina(${idx})" style="position: relative;">
            <div class="quest-icon-box">🏋️‍♂️</div>
            <div style="flex:1;">
              <span class="quest-badge-rank">${rut.rankLabel || 'PERSONALIZADA'}</span>
              <p class="quest-card-name" style="margin:4px 0 6px 0;color:#111827;font-size:15px;font-weight:700;">${rut.nombre}</p>
              <div class="muscle-tags-row">
                <span class="muscle-tag">${rut.codigo || ('RUT-' + (idx + 1))}</span>
                <span class="muscle-tag">${badgeEj}</span>
                ${rut.descripcion ? `<span class="muscle-tag" style="background:none; border:none; color:#6b7280;">${rut.descripcion}</span>` : ''}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn-delete-row" title="Eliminar rutina" onclick="eliminarRutina(${idx}, event)" style="background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; padding: 6px; border-radius: 6px;">✕</button>
                <span class="quest-arrow">›</span>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function abrirDetalleRutina(idx) {
    var rutina = APP_STATE.rutinas[idx];
    if (!rutina) return;
    RUTINA_ACTIVA = { rutina: rutina, idx: idx };

    cambiarVista('vista-detalle-rutina-dinamica');

    var tituloEl = document.getElementById('detalle-rutina-titulo');
    var badgeEl = document.getElementById('detalle-rutina-badge');
    if (tituloEl) tituloEl.innerText = rutina.nombre;
    if (badgeEl) badgeEl.innerText = rutina.rankLabel || 'RUTINA ACTIVA';

    var cont = document.getElementById('contenedor-detalle-rutina-dinamica');
    if (!cont) return;

    var numEj = rutina.ejercicios ? rutina.ejercicios.length : 0;
    var progrCont = document.getElementById('progreso-rutina-dinamica-cont');
    var progrBarra = document.getElementById('progreso-barra-rutina-dinamica');
    var progrTexto = document.getElementById('progreso-texto-rutina-dinamica');
    var btnReg = document.getElementById('btn-registrar-rutina-dinamica');

    if (progrCont) progrCont.style.display = 'block';
    if (progrBarra) progrBarra.style.width = '0%';
    if (progrTexto) progrTexto.innerText = '0 / ' + (numEj + 1) + ' (0%)';
    if (btnReg) {
        btnReg.style.display = 'block';
        btnReg.disabled = true;
    }

    var html = `
    <!-- FASE 1: CALENTAMIENTO Y ACTIVACIÓN -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px 16px; margin-bottom: 14px;">
        <label class="exercise-item-rpg" style="margin: 0; background: transparent; border: none; padding: 0;">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 16px;">🔥</span>
                    <h4 style="margin: 0; font-size: 14.5px; color: #111827;">Fase 1: Calentamiento & Activación Articular</h4>
                    <span class="badge-status-item" id="badge-calentamiento">PENDIENTE</span>
                </div>
                <span class="badge-reps" style="margin-top: 4px; display: inline-block;">5 MINUTOS · MOVILIDAD ARTICULAR Y PULSO CARDIACO</span>
            </div>
            <input type="checkbox" class="check-rutina-din" style="display: none;" onchange="actualizarProgresoRutinaDinamica()">
            <div class="custom-check-box">✓</div>
        </label>
    </div>

    <!-- FASE 2: EJERCICIOS DE LA RUTINA -->
    <h4 style="font-size: 13.5px; text-transform: uppercase; color: #4b5563; margin: 16px 0 10px 0; letter-spacing: 0.5px;">Fase 2: Ejercicios Principales</h4>
    `;

    if (rutina.ejercicios && rutina.ejercicios.length > 0) {
        rutina.ejercicios.forEach(function(ej, ejIdx) {
            var muscleList = (ej.categorias || []).join(' · ');
            html += `
            <label class="exercise-item-rpg">
                <div style="flex: 1; padding-right: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <h4 style="margin: 0;">${ejIdx + 1}. ${ej.nombre}</h4>
                        <span class="badge-status-item">PENDIENTE</span>
                    </div>
                    <div style="color: #6b7280; font-size: 12px; margin-top: 3px;">${ej.descripcion}</div>
                    <div style="margin-top: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="badge-reps">${ej.series} SERIES × ${ej.repeticiones}</span>
                        <span class="badge-exercise-fatiga">+${ej.fatigaPorcentaje || 20}% Fatiga</span>
                        <span style="font-size: 11px; color: #6b7280;">Zonas: <strong>${muscleList}</strong></span>
                    </div>
                </div>
                <input type="checkbox" class="check-rutina-din" style="display: none;" onchange="actualizarProgresoRutinaDinamica()">
                <div class="custom-check-box">✓</div>
            </label>`;
        });
    } else {
        html += '<p style="color: #6b7280; text-align: center; padding: 20px;">Esta rutina no tiene ejercicios agregados.</p>';
    }

    cont.innerHTML = html;
}

function actualizarProgresoRutinaDinamica() {
    var checks = document.querySelectorAll('.check-rutina-din');
    var total = checks.length;
    var completados = 0;

    checks.forEach(function(c) {
        var parentLabel = c.closest('.exercise-item-rpg');
        var badgeStatus = parentLabel ? parentLabel.querySelector('.badge-status-item') : null;

        if (c.checked) {
            completados++;
            if (badgeStatus) {
                badgeStatus.innerText = 'LISTO';
                badgeStatus.style.background = '#111827';
                badgeStatus.style.color = '#ffffff';
            }
        } else {
            if (badgeStatus) {
                badgeStatus.innerText = 'PENDIENTE';
                badgeStatus.style.background = '#f3f4f6';
                badgeStatus.style.color = '#6b7280';
            }
        }
    });

    var pct = total > 0 ? Math.round((completados / total) * 100) : 0;
    var progrBarra = document.getElementById('progreso-barra-rutina-dinamica');
    var progrTexto = document.getElementById('progreso-texto-rutina-dinamica');
    var btnReg = document.getElementById('btn-registrar-rutina-dinamica');

    if (progrBarra) progrBarra.style.width = pct + '%';
    if (progrTexto) progrTexto.innerText = completados + ' / ' + total + ' (' + pct + '%)';

    if (btnReg) {
        btnReg.disabled = (completados < total);
    }
}

function ejecutarRutinaDinamica() {
    if (!RUTINA_ACTIVA) return;
    var rutina = RUTINA_ACTIVA.rutina;

    if (!APP_STATE.fatiga) APP_STATE.fatiga = DEFAULT_STATE.fatiga;

    // Sumar fatiga a los músculos involucrados según cada ejercicio
    if (rutina.ejercicios) {
        rutina.ejercicios.forEach(function(ej) {
            var fatigaVal = Number(ej.fatigaPorcentaje) || 20;
            (ej.categorias || []).forEach(function(cat) {
                var mKeys = MAPA_CATEGORIAS_A_MUSCULOS[cat] || [];
                mKeys.forEach(function(mKey) {
                    var actual = Number(APP_STATE.fatiga[mKey]) || 0;
                    APP_STATE.fatiga[mKey] = Math.min(100, actual + fatigaVal);
                });
            });
        });
    }

    // Recalcular promedio de fatiga del cuerpo
    var keysFatiga = Object.keys(METADATOS_MUSCULOS);
    var sumaTotal = 0;
    keysFatiga.forEach(function(k) {
        sumaTotal += (Number(APP_STATE.fatiga[k]) || 0);
    });
    APP_STATE.fatiga.promedioHoy = Math.round(sumaTotal / keysFatiga.length);
    APP_STATE.fatiga.ultimoCierre = "Entrenamiento: " + rutina.nombre;

    // Registrar en Historial de Gym
    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!APP_STATE.gym) APP_STATE.gym = [];
    APP_STATE.gym.unshift({
        fecha: fechaHoy,
        detalle: "Rutina completada: " + rutina.nombre + " (" + (rutina.ejercicios ? rutina.ejercicios.length : 0) + " ejercicios)"
    });

    // Otorgar EXP
    sumarExp(60);

    MonarcaDB.save(APP_STATE);

    alert("🏆 ¡Sesión completada con éxito!\nHas finalizado '" + rutina.nombre + "'.\n+60 EXP recibidos.\nLa fatiga muscular de tu cuerpo ha sido actualizada en el mapa anatómico.");

    cambiarVista('vista-estado-personal');
    renderizarBarrasFatiga(APP_STATE.fatiga);
}

function renderizarGym(registros) {
    var cont = document.getElementById('contenedor-gym');
    if (!cont) return;
    var html = '';
    if (registros && registros.length > 0) {
        registros.forEach(function(reg) {
            html += `<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;color:#111827;font-size:13.5px;">${reg.detalle}</span>
                <span style="color:#6b7280;font-size:12px;">${reg.fecha}</span>
            </div>`;
        });
    } else {
        html = '<p style="color:#6b7280;text-align:center;padding:15px;">No hay entrenamientos registrados aún.</p>';
    }
    cont.innerHTML = html;
}


// --- MÓDULO DE MENTE Y SUEÑO ---

function cargarMente() {
    renderizarMente(APP_STATE.salud);
}

function renderizarMente(registros) {
    var cont = document.getElementById('contenedor-mente');
    if (!cont) return;
    var html = '';
    var list = registros || APP_STATE.salud || [];
    if (list && list.length > 0) {
        list.forEach(function(r) {
            html += `<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;color:#111827;font-size:13.5px;">${r.valor}</span>
                <span style="color:#6b7280;font-size:12px;">${r.fecha}</span>
            </div>`;
        });
    } else {
        html = '<p style="color:#6b7280;text-align:center;padding:15px;">No hay registros de descanso mental.</p>';
    }
    cont.innerHTML = html;
}

function guardarMente() {
    var inM = document.getElementById('input-nueva-mente');
    var val = inM ? inM.value.trim() : "";
    if (!val) { alert("Ingresa tu registro de descanso mental o horas de sueño."); return; }
    if (!APP_STATE.salud) APP_STATE.salud = [];
    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    APP_STATE.salud.unshift({ fecha: fechaHoy, valor: val });
    if (APP_STATE.fatiga) {
        APP_STATE.fatiga.mente = Math.max(0, (APP_STATE.fatiga.mente || 0) - 30);
    }
    if (inM) inM.value = "";
    sumarExp(20);
    MonarcaDB.save(APP_STATE);
    renderizarMente(APP_STATE.salud);
    alert("🧠 Registro de descanso guardado (+20 EXP). Fatiga mental aliviada.");
}

