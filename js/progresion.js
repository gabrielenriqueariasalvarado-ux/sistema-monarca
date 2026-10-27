/**
 * SISTEMA MONARCA · MÓDULO DE ACCIONES Y PROGRESIÓN
 * Misiones Diarias & Hábitos, Árbol de Habilidades con Rangos (E a SSS).
 */


// ==========================================================================
// CATÁLOGO COMPLETO DE ATRIBUTOS (CUERPO Y MENTE)
// ==========================================================================
var CATALOGO_ATRIBUTOS_SISTEMA = [
    // --- 🦾 CUERPO ---
    { tipo: "cuerpo", categoria: "Tren Superior", clave: "pect_mayor", nombre: "Pectoral Mayor", icono: "⚔️" },
    { tipo: "cuerpo", categoria: "Tren Superior", clave: "pect_menor", nombre: "Pectoral Menor", icono: "⚔️" },
    { tipo: "cuerpo", categoria: "Tren Superior", clave: "dorsales", nombre: "Dorsales (Espalda)", icono: "🦅" },
    { tipo: "cuerpo", categoria: "Brazos y Hombros", clave: "delt_ant", nombre: "Hombros (Deltoides)", icono: "🛡️" },
    { tipo: "cuerpo", categoria: "Brazos y Hombros", clave: "biceps", nombre: "Bíceps", icono: "💪" },
    { tipo: "cuerpo", categoria: "Brazos y Hombros", clave: "triceps", nombre: "Tríceps", icono: "💪" },
    { tipo: "cuerpo", categoria: "Brazos y Hombros", clave: "antebrazos", nombre: "Antebrazos y Agarre", icono: "✊" },
    { tipo: "cuerpo", categoria: "Zona Media", clave: "core", nombre: "Core / Abdominales", icono: "⚡" },
    { tipo: "cuerpo", categoria: "Zona Media", clave: "cadera", nombre: "Cadera y Movilidad", icono: "🥋" },
    { tipo: "cuerpo", categoria: "Zona Media", clave: "trapecios", nombre: "Trapecios", icono: "🦅" },
    { tipo: "cuerpo", categoria: "Zona Media", clave: "lumbares", nombre: "Lumbares", icono: "🏛️" },
    { tipo: "cuerpo", categoria: "Tren Inferior", clave: "cuadriceps", nombre: "Cuádriceps", icono: "🦵" },
    { tipo: "cuerpo", categoria: "Tren Inferior", clave: "isquios", nombre: "Isquiotibiales (Femorales)", icono: "🦵" },
    { tipo: "cuerpo", categoria: "Tren Inferior", clave: "gluteos", nombre: "Glúteos", icono: "🍑" },
    { tipo: "cuerpo", categoria: "Tren Inferior", clave: "pantorrillas", nombre: "Pantorrillas", icono: "🦶" },
    { tipo: "cuerpo", categoria: "Salud Articular", clave: "cuello", nombre: "Cuello y Cervical", icono: "🧘" },
    { tipo: "cuerpo", categoria: "Salud Articular", clave: "articulaciones", nombre: "Muñecas y Tobillos", icono: "🔄" },

    // --- 🧠 MENTE ---
    { tipo: "mente", categoria: "Inteligencia y Cognición", clave: "memoria", nombre: "Memoria y Retención", icono: "🧠" },
    { tipo: "mente", categoria: "Inteligencia y Cognición", clave: "procesamiento", nombre: "Velocidad de Procesamiento", icono: "🧠" },
    { tipo: "mente", categoria: "Inteligencia y Cognición", clave: "conocimiento", nombre: "Adquisición de Conocimiento", icono: "🧠" },
    { tipo: "mente", categoria: "Creatividad", clave: "pensamiento_lateral", nombre: "Pensamiento Lateral", icono: "💡" },
    { tipo: "mente", categoria: "Creatividad", clave: "diseno_expresion", nombre: "Diseño y Expresión", icono: "💡" },
    { tipo: "mente", categoria: "Voluntad y Disciplina", clave: "enfoque", nombre: "Enfoque y Atención Sostenida", icono: "🛡️" },
    { tipo: "mente", categoria: "Voluntad y Disciplina", clave: "gratificacion", nombre: "Resistencia a Gratificación", icono: "🛡️" },
    { tipo: "mente", categoria: "Voluntad y Disciplina", clave: "resiliencia", nombre: "Resiliencia Mental", icono: "🛡️" },
    { tipo: "mente", categoria: "Psicología e Influencia", clave: "microexpresiones", nombre: "Lectura No Verbal y Microexpresiones", icono: "♟️" },
    { tipo: "mente", categoria: "Psicología e Influencia", clave: "persuasion", nombre: "Persuasión y Negociación", icono: "♟️" },
    { tipo: "mente", categoria: "Psicología e Influencia", clave: "control_emocional", nombre: "Dominio y Control Emocional", icono: "♟️" },
    { tipo: "mente", categoria: "Psicología e Influencia", clave: "inteligencia_social", nombre: "Inteligencia Social y Poder", icono: "♟️" },
    { tipo: "mente", categoria: "Recuperación y Claridad", clave: "estres_desconexion", nombre: "Gestión de Estrés y Desconexión", icono: "🌙" },
    { tipo: "mente", categoria: "Recuperación y Claridad", clave: "claridad_decision", nombre: "Claridad en Decisiones", icono: "🌙" }
];

var ATRIBUTOS_MODAL_TEMP = { quest: [], mision: [], habilidad: [] };

function poblarSelectAtributos(contexto) {
    var sel = document.getElementById('select-nuevo-atributo-' + contexto);
    if (!sel) return;

    var grupos = {
        "🦾 CUERPO · TREN SUPERIOR": [],
        "🦾 CUERPO · BRAZOS Y HOMBROS": [],
        "🦾 CUERPO · ZONA MEDIA": [],
        "🦾 CUERPO · TREN INFERIOR": [],
        "🦾 CUERPO · SALUD ARTICULAR": [],
        "🧠 MENTE · INTELIGENCIA Y COGNICIÓN": [],
        "🧠 MENTE · CREATIVIDAD E INNOVACIÓN": [],
        "🧠 MENTE · VOLUNTAD Y DISCIPLINA": [],
        "🧠 MENTE · PSICOLOGÍA E INFLUENCIA": [],
        "🧠 MENTE · RECUPERACIÓN Y CLARIDAD": []
    };

    CATALOGO_ATRIBUTOS_SISTEMA.forEach(function(item) {
        var opt = `<option value="${item.clave}">${item.icono} ${item.nombre}</option>`;
        if (item.tipo === 'cuerpo') {
            if (item.categoria === 'Tren Superior') grupos["🦾 CUERPO · TREN SUPERIOR"].push(opt);
            else if (item.categoria === 'Brazos y Hombros') grupos["🦾 CUERPO · BRAZOS Y HOMBROS"].push(opt);
            else if (item.categoria === 'Zona Media') grupos["🦾 CUERPO · ZONA MEDIA"].push(opt);
            else if (item.categoria === 'Tren Inferior') grupos["🦾 CUERPO · TREN INFERIOR"].push(opt);
            else grupos["🦾 CUERPO · SALUD ARTICULAR"].push(opt);
        } else {
            if (item.categoria === 'Inteligencia y Cognición') grupos["🧠 MENTE · INTELIGENCIA Y COGNICIÓN"].push(opt);
            else if (item.categoria === 'Creatividad') grupos["🧠 MENTE · CREATIVIDAD E INNOVACIÓN"].push(opt);
            else if (item.categoria === 'Voluntad y Disciplina') grupos["🧠 MENTE · VOLUNTAD Y DISCIPLINA"].push(opt);
            else if (item.categoria === 'Psicología e Influencia') grupos["🧠 MENTE · PSICOLOGÍA E INFLUENCIA"].push(opt);
            else grupos["🧠 MENTE · RECUPERACIÓN Y CLARIDAD"].push(opt);
        }
    });

    var html = '<option value="">-- Seleccionar atributo para añadir --</option>';
    Object.keys(grupos).forEach(function(gNombre) {
        if (grupos[gNombre].length > 0) {
            html += `<optgroup label="${gNombre}">${grupos[gNombre].join('')}</optgroup>`;
        }
    });

    sel.innerHTML = html;
    sel.value = "";
}

function agregarAtributoDesdeSelect(contexto, clave) {
    if (!clave) return;
    var attr = CATALOGO_ATRIBUTOS_SISTEMA.find(function(a) { return a.clave === clave; });
    if (!attr) return;

    if (!ATRIBUTOS_MODAL_TEMP[contexto]) ATRIBUTOS_MODAL_TEMP[contexto] = [];

    var yaExiste = ATRIBUTOS_MODAL_TEMP[contexto].some(function(a) { return a.clave === clave; });
    if (yaExiste) {
        alert("El atributo '" + attr.nombre + "' ya está en la lista.");
        var sel = document.getElementById('select-nuevo-atributo-' + contexto);
        if (sel) sel.value = "";
        return;
    }

    ATRIBUTOS_MODAL_TEMP[contexto].push({
        clave: attr.clave,
        nombre: attr.nombre,
        tipo: attr.tipo,
        icono: attr.icono,
        categoria: attr.categoria,
        porcentaje: 20
    });

    renderizarFilasAtributos(contexto);

    var selElem = document.getElementById('select-nuevo-atributo-' + contexto);
    if (selElem) selElem.value = "";
}

function agregarAtributoDesdeBoton(contexto) {
    var sel = document.getElementById('select-nuevo-atributo-' + contexto);
    if (sel && sel.value) {
        agregarAtributoDesdeSelect(contexto, sel.value);
    } else {
        alert("Por favor selecciona un atributo de la lista desplegable antes de añadir.");
    }
}

function renderizarFilasAtributos(contexto) {
    var cont = document.getElementById('lista-atributos-' + contexto);
    if (!cont) return;

    var lista = ATRIBUTOS_MODAL_TEMP[contexto] || [];
    if (lista.length === 0) {
        cont.innerHTML = `
            <div style="font-size: 12px; color: #9ca3af; padding: 6px 4px; font-style: italic;">
                Ningún atributo seleccionado. Elige uno abajo y pulsa + Añadir para asociarlo.
            </div>`;
        return;
    }

    var html = '';
    lista.forEach(function(item) {
        var badgeClass = item.tipo === 'cuerpo' ? 'tipo-badge-cuerpo' : 'tipo-badge-mente';
        var badgeLabel = item.tipo === 'cuerpo' ? 'Cuerpo' : 'Mente';

        html += `
        <div class="fila-atributo-item">
            <div class="fila-atributo-info">
                <span>${item.icono || '⚡'}</span>
                <span>${item.nombre}</span>
                <span class="fila-atributo-tipo-badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="fila-atributo-pct-box">
                <input type="number" class="input-atributo-pct" min="1" max="100" value="${item.porcentaje || 20}" onchange="actualizarPorcentajeAtributo('${contexto}', '${item.clave}', this.value)" title="Porcentaje de desarrollo / impacto">
                <span style="font-size: 12px; font-weight: 800; color: #4b5563;">%</span>
                <button type="button" class="btn-quitar-atributo" onclick="quitarAtributoModal('${contexto}', '${item.clave}')" title="Quitar atributo">✕</button>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function actualizarPorcentajeAtributo(contexto, clave, valor) {
    var v = parseInt(valor, 10);
    if (isNaN(v) || v <= 0) v = 5;
    if (v > 100) v = 100;

    var lista = ATRIBUTOS_MODAL_TEMP[contexto] || [];
    var item = lista.find(function(a) { return a.clave === clave; });
    if (item) {
        item.porcentaje = v;
    }
}

function quitarAtributoModal(contexto, clave) {
    if (!ATRIBUTOS_MODAL_TEMP[contexto]) return;
    ATRIBUTOS_MODAL_TEMP[contexto] = ATRIBUTOS_MODAL_TEMP[contexto].filter(function(a) {
        return a.clave !== clave;
    });
    renderizarFilasAtributos(contexto);
}

function aplicarImpactoAtributos(atributos) {
    if (!atributos || !Array.isArray(atributos) || atributos.length === 0) return;

    if (!APP_STATE.fatiga) APP_STATE.fatiga = {};
    if (!APP_STATE.desgasteMente) APP_STATE.desgasteMente = {};
    if (!APP_STATE.menteAtributos) APP_STATE.menteAtributos = {};

    atributos.forEach(function(item) {
        var pct = Number(item.porcentaje) || 15;
        if (item.tipo === 'cuerpo') {
            var actual = Number(APP_STATE.fatiga[item.clave]) || 0;
            APP_STATE.fatiga[item.clave] = Math.min(100, actual + pct);
        } else if (item.tipo === 'mente') {
            var actualMente = Number(APP_STATE.desgasteMente[item.clave]) || 15;
            APP_STATE.desgasteMente[item.clave] = Math.min(100, actualMente + pct);

            var actualAtributo = Number(APP_STATE.menteAtributos[item.clave]) || 10;
            APP_STATE.menteAtributos[item.clave] = Math.min(100, actualAtributo + pct);

            if (APP_STATE.fatigaMentalDiaria) {
                var actualSNC = Number(APP_STATE.fatigaMentalDiaria.nivel) || 20;
                APP_STATE.fatigaMentalDiaria.nivel = Math.min(100, actualSNC + Math.round(pct * 0.3));
            }
        }
    });

    MonarcaDB.save(APP_STATE);

    if (typeof actualizarDesgasteDiarioAutomatico === 'function') {
        actualizarDesgasteDiarioAutomatico();
    }
    if (typeof renderizarGraficoGeneralAvatar === 'function') {
        renderizarGraficoGeneralAvatar();
    }
    if (typeof renderizarDesgloseCuerpoAnatomico === 'function') {
        renderizarDesgloseCuerpoAnatomico();
    }
    if (typeof renderizarDesgloseMenteCognitiva === 'function') {
        renderizarDesgloseMenteCognitiva();
    }
}

function revertirImpactoAtributos(atributos) {
    if (!atributos || !Array.isArray(atributos) || atributos.length === 0) return;

    atributos.forEach(function(item) {
        var pct = Number(item.porcentaje) || 15;
        if (item.tipo === 'cuerpo') {
            var actual = Number(APP_STATE.fatiga[item.clave]) || 0;
            APP_STATE.fatiga[item.clave] = Math.max(0, actual - pct);
        } else if (item.tipo === 'mente') {
            var actualMente = Number(APP_STATE.desgasteMente[item.clave]) || 15;
            APP_STATE.desgasteMente[item.clave] = Math.max(10, actualMente - pct);

            var actualAtributo = Number(APP_STATE.menteAtributos[item.clave]) || 10;
            APP_STATE.menteAtributos[item.clave] = Math.max(0, actualAtributo - pct);
        }
    });

    MonarcaDB.save(APP_STATE);

    if (typeof renderizarGraficoGeneralAvatar === 'function') {
        renderizarGraficoGeneralAvatar();
    }
    if (typeof renderizarDesgloseCuerpoAnatomico === 'function') {
        renderizarDesgloseCuerpoAnatomico();
    }
    if (typeof renderizarDesgloseMenteCognitiva === 'function') {
        renderizarDesgloseMenteCognitiva();
    }
}

function cargarMisiones() {
    renderizarMisiones(APP_STATE.misiones);
}

function abrirModalNuevaMision() {
    ATRIBUTOS_MODAL_TEMP.mision = [];
    poblarSelectAtributos('mision');
    renderizarFilasAtributos('mision');
    var inNombre = document.getElementById('modal-mision-nombre');
    if (inNombre) inNombre.value = "";
    var m = document.getElementById('modal-nueva-mision');
    if (m) m.style.display = 'flex';
}

function cerrarModalNuevaMision() {
    var m = document.getElementById('modal-nueva-mision');
    if (m) m.style.display = 'none';
}

function confirmarAgregarMision() {
    var inNombre = document.getElementById('modal-mision-nombre');
    var inFreq = document.getElementById('modal-mision-frecuencia');
    var inAtr = document.getElementById('modal-mision-atributo');
    var inExp = document.getElementById('modal-mision-exp');

    var nom = inNombre ? inNombre.value.trim() : "";
    var freq = inFreq ? inFreq.value : "Diaria";
    var atr = inAtr ? inAtr.value : "INT";
    var exp = inExp ? (Number(inExp.value) || 25) : 25;

    if (!nom) {
        alert("Por favor ingresa un nombre para la misión o hábito.");
        return;
    }
    if (exp <= 0) exp = 25;

    if (!APP_STATE.misiones) APP_STATE.misiones = [];

    var listaAtrs = (ATRIBUTOS_MODAL_TEMP.mision && ATRIBUTOS_MODAL_TEMP.mision.length > 0)
        ? JSON.parse(JSON.stringify(ATRIBUTOS_MODAL_TEMP.mision))
        : [];

    var nombreAtributos = listaAtrs.length > 0
        ? listaAtrs.map(function(a) { return a.nombre; }).join(', ')
        : "General";

    var nuevaMision = {
        id: "MIS-" + Date.now(),
        nombre: nom,
        frecuencia: freq,
        atributo: nombreAtributos,
        atributos: listaAtrs,
        exp: exp,
        estado: "Pendiente",
        fechaRegistro: new Date().toLocaleDateString('es-ES')
    };

    APP_STATE.misiones.unshift(nuevaMision);
    MonarcaDB.save(APP_STATE);

    if (inNombre) inNombre.value = "";
    if (inExp) inExp.value = "25";

    cerrarModalNuevaMision();
    renderizarMisiones(APP_STATE.misiones);
}

function renderizarMisiones(misiones) {
    var mList = misiones || APP_STATE.misiones || [];
    var html = "";

    if (mList && mList.length > 0) {
        mList.forEach(function(m) {
            var esCompletado = (m.estado === "Completado" || m.estado === "Completada");

            html += `
            <div class="mision-card ${esCompletado ? 'completada' : ''}">
                <div style="flex-grow: 1; padding-right: 14px;">
                    <div style="color: #111827; font-weight: 700; font-size: 15px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span class="mision-frecuencia-badge">[${m.frecuencia || 'Diaria'}]</span>
                        <span style="${esCompletado ? 'text-decoration: line-through; color: #6b7280;' : ''}">${m.nombre}</span>
                    </div>
                    <div style="color: #6b7280; font-size: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="color: #10b981; font-weight: 700;">+${m.exp} EXP</span>
                        <span style="color: #d1d5db;">|</span>
                        <span>Estado: <strong style="${esCompletado ? 'color:#10b981;' : 'color:#d97706;'}">${esCompletado ? 'Completada' : 'Pendiente'}</strong></span>
                    </div>
                    ${(m.atributos && m.atributos.length > 0) ? `
                        <div class="atributos-chips-container">
                            ${m.atributos.map(function(a) {
                                return `<span class="chip-atributo-impacto ${a.tipo}">${a.icono || '⚡'} ${a.nombre} (+${a.porcentaje}%)</span>`;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="atributos-chips-container">
                            <span class="chip-atributo-impacto mente">⚡ ${m.atributo || 'EXP General'}</span>
                        </div>
                    `}
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    ${!esCompletado ? `
                        <button class="btn-completar-mision" onclick="marcarCompletado('${m.id}')">
                            Completar
                        </button>
                    ` : `
                        <button class="btn-completar-mision completado" onclick="marcarCompletado('${m.id}')" title="Haga clic para desmarcar o reiniciar">
                            ✓ Hecho
                        </button>
                    `}
                    <button class="btn-delete-row" title="Eliminar misión" onclick="eliminarMision('${m.id}')" style="background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: 6px;">✕</button>
                </div>
            </div>`;
        });
    } else {
        html = `
        <div style="text-align: center; padding: 40px 20px; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">⚡</span>
            <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 16px;">No tienes misiones activas</h4>
            <p style="color: #6b7280; font-size: 13px; max-width: 400px; margin: 0 auto 16px auto;">
                Empieza a construir tu disciplina. Registra un nuevo hábito diario o semanal para comenzar a ganar EXP y subir de nivel.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevaMision()">
                ➕ Crear Primera Misión
            </button>
        </div>`;
    }

    var cont = document.getElementById('contenedor-misiones');
    if (cont) cont.innerHTML = html;
}

function marcarCompletado(id) {
    if (!APP_STATE.misiones) return;
    for (var i = 0; i < APP_STATE.misiones.length; i++) {
        if (String(APP_STATE.misiones[i].id) === String(id)) {
            var m = APP_STATE.misiones[i];
            if (m.estado === "Completado" || m.estado === "Completada") {
                // Alternar a pendiente
                m.estado = "Pendiente";
                if (m.atributos && m.atributos.length > 0) {
                    revertirImpactoAtributos(m.atributos);
                }
            } else {
                m.estado = "Completado";
                sumarExp(m.exp || 25);
                if (m.atributos && m.atributos.length > 0) {
                    aplicarImpactoAtributos(m.atributos);
                }
            }
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarMisiones(APP_STATE.misiones);
}

function eliminarMision(id) {
    if (!confirm("¿Deseas eliminar esta misión de tu lista?")) return;
    if (!APP_STATE.misiones) return;
    APP_STATE.misiones = APP_STATE.misiones.filter(function(m) {
        return String(m.id) !== String(id);
    });
    MonarcaDB.save(APP_STATE);
    renderizarMisiones(APP_STATE.misiones);
}

// ==========================================================================
// 5. ÁRBOL DE HABILIDADES (RANGOS POR HORAS DE PRÁCTICA)
// ==========================================================================

/**
 * Escala exacta requerida por el usuario:
 * Rango E (Mínimo): 0 - 5 horas (Entiendes la sintaxis básica y los "Hola mundo").
 * Rango D: 5 - 10 horas (Puedes hacer scripts sencillos tú solo).
 * Rango C: 10 - 20 horas (Empiezas a crear proyectos funcionales pequeños).
 * Rango B: 20 - 30 horas (Dominas lógica avanzada y depuración).
 * Rango A: 30 - 40 horas (Capaz de desarrollar software estructurado y eficiente).
 * Rango S: 40 - 50 horas (Nivel profesional junior / resolución de problemas complejos).
 * Rango SS: 50 - 60 horas (Dominio avanzado, arquitectura de sistemas) -> meta 70 hrs hacia SSS.
 * Rango SSS (Máximo): 70+ horas (Maestría absoluta / Nivel experto).
 */
function calcularRangoYProgreso(horas) {
    var h = Math.max(0, Number(horas) || 0);

    if (h >= 70) {
        return {
            rango: "Rango SSS (Máximo)",
            badgeClass: "badge-rank-sss",
            descripcion: "Maestría absoluta / Nivel experto.",
            horasEnNivel: h,
            horasReqNivel: 70,
            porcentaje: 100,
            siguiente: "¡Maestría Absoluta Alcanzada!"
        };
    } else if (h >= 50) {
        // Rango SS: 50 - 70 hrs (meta SSS en 70)
        var enNivel = h - 50;
        var req = 20;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 70 - h;
        return {
            rango: "Rango SS",
            badgeClass: "badge-rank-ss",
            descripcion: "Dominio avanzado, arquitectura de sistemas.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para SSS"
        };
    } else if (h >= 40) {
        // Rango S: 40 - 50 hrs
        var enNivel = h - 40;
        var req = 10;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 50 - h;
        return {
            rango: "Rango S",
            badgeClass: "badge-rank-s",
            descripcion: "Nivel profesional junior / resolución de problemas complejos.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para SS"
        };
    } else if (h >= 30) {
        // Rango A: 30 - 40 hrs
        var enNivel = h - 30;
        var req = 10;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 40 - h;
        return {
            rango: "Rango A",
            badgeClass: "badge-rank-a",
            descripcion: "Capaz de desarrollar software estructurado y eficiente.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para S"
        };
    } else if (h >= 20) {
        // Rango B: 20 - 30 hrs
        var enNivel = h - 20;
        var req = 10;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 30 - h;
        return {
            rango: "Rango B",
            badgeClass: "badge-rank-b",
            descripcion: "Dominas lógica avanzada y depuración.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para A"
        };
    } else if (h >= 10) {
        // Rango C: 10 - 20 hrs
        var enNivel = h - 10;
        var req = 10;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 20 - h;
        return {
            rango: "Rango C",
            badgeClass: "badge-rank-c",
            descripcion: "Empiezas a crear proyectos funcionales pequeños.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para B"
        };
    } else if (h >= 5) {
        // Rango D: 5 - 10 hrs
        var enNivel = h - 5;
        var req = 5;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 10 - h;
        return {
            rango: "Rango D",
            badgeClass: "badge-rank-d",
            descripcion: "Puedes hacer scripts sencillos tú solo.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para C"
        };
    } else {
        // Rango E: 0 - 5 hrs
        var enNivel = h;
        var req = 5;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 5 - h;
        return {
            rango: "Rango E",
            badgeClass: "badge-rank-e",
            descripcion: "Entiendes la sintaxis básica y los \"Hola mundo\".",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para D"
        };
    }
}

function cargarHabilidades() {
    renderizarHabilidades(APP_STATE.habilidades);
}

function abrirModalNuevaHabilidad() {
    ATRIBUTOS_MODAL_TEMP.habilidad = [];
    poblarSelectAtributos('habilidad');
    renderizarFilasAtributos('habilidad');
    var inNom = document.getElementById('modal-habilidad-nombre');
    var inBen = document.getElementById('modal-habilidad-beneficio');
    if (inNom) inNom.value = "";
    if (inBen) inBen.value = "";
    var m = document.getElementById('modal-nueva-habilidad');
    if (m) m.style.display = 'flex';
}

function cerrarModalNuevaHabilidad() {
    var m = document.getElementById('modal-nueva-habilidad');
    if (m) m.style.display = 'none';
}

function confirmarAgregarHabilidad() {
    var inNom = document.getElementById('modal-habilidad-nombre');
    var inBen = document.getElementById('modal-habilidad-beneficio');
    var inHrs = document.getElementById('modal-habilidad-horas');

    var nom = inNom ? inNom.value.trim() : "";
    var ben = inBen ? inBen.value.trim() : "";
    var hrs = inHrs ? (Number(inHrs.value) || 0) : 0;

    if (!nom) {
        alert("Por favor ingresa el nombre de la habilidad.");
        return;
    }

    // Comienza estrictamente en Rango E (0 a 4 horas)
    var hrsClamped = Math.min(4, Math.max(0, hrs));

    if (!APP_STATE.habilidades) APP_STATE.habilidades = [];

    var listaAtrsH = (ATRIBUTOS_MODAL_TEMP.habilidad && ATRIBUTOS_MODAL_TEMP.habilidad.length > 0)
        ? JSON.parse(JSON.stringify(ATRIBUTOS_MODAL_TEMP.habilidad))
        : [];

    var nuevaHabilidad = {
        id: "SKILL-" + Date.now(),
        nombre: nom,
        beneficio: ben || "Incremento de destreza y capacidad técnica",
        horasTotales: hrsClamped,
        atributos: listaAtrsH
    };

    APP_STATE.habilidades.push(nuevaHabilidad);
    MonarcaDB.save(APP_STATE);

    if (inNom) inNom.value = "";
    if (inBen) inBen.value = "";
    if (inHrs) inHrs.value = "0";

    cerrarModalNuevaHabilidad();
    renderizarHabilidades(APP_STATE.habilidades);
}

function renderizarHabilidades(skills) {
    var sList = skills || APP_STATE.habilidades || [];
    var html = "";

    if (sList && sList.length > 0) {
        sList.forEach(function(s) {
            var calc = calcularRangoYProgreso(s.horasTotales);
            var porcentaje = calc.porcentaje;

            html += `
            <div class="skill-card">
                <div class="skill-card-header">
                    <div>
                        <span class="skill-rank-badge ${calc.badgeClass}">${calc.rango}</span>
                        <h3 class="skill-name">${s.nombre}</h3>
                        <div class="skill-desc-tier">${calc.descripcion}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button onclick="sumarHora('${s.id}')" class="btn-add-hora" title="Sumar 1 hora de práctica y +10 EXP">
                            +1 Hora
                        </button>
                        <button class="btn-delete-row" title="Eliminar habilidad" onclick="eliminarHabilidad('${s.id}')" style="background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: 6px;">✕</button>
                    </div>
                </div>

                <div class="skill-progress-track">
                    <div class="skill-progress-fill" style="width: ${porcentaje}%;"></div>
                </div>

                <div class="skill-progress-info">
                    <span>Progreso: <strong>${calc.horasEnNivel} / ${calc.horasReqNivel} hrs</strong> &nbsp;·&nbsp; Total: ${s.horasTotales} hrs</span>
                    <span>${calc.siguiente} (${porcentaje}%)</span>
                </div>
                <div class="skill-benefit-row">
                    🎁 <em>Beneficio:</em> ${s.beneficio || "Incremento de destreza y productividad"}
                </div>
                ${(s.atributos && s.atributos.length > 0) ? `
                    <div class="atributos-chips-container" style="margin-top: 6px;">
                        <span style="font-size: 11px; color: #6b7280; font-weight: 700; display: inline-flex; align-items: center;">Desarrollo:</span>
                        ${s.atributos.map(function(a) {
                            return `<span class="chip-atributo-impacto ${a.tipo}">${a.icono || '🔮'} ${a.nombre} (+${a.porcentaje}% / h)</span>`;
                        }).join('')}
                    </div>
                ` : ''}
            </div>`;
        });
    } else {
        html = `
        <div style="text-align: center; padding: 40px 20px; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🔮</span>
            <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 16px;">No hay habilidades registradas</h4>
            <p style="color: #6b7280; font-size: 13px; max-width: 400px; margin: 0 auto 16px auto;">
                Registra una nueva disciplina o tecnología. Comenzará en Rango E e irá ascendiendo automáticamente de rango a medida que acumules horas.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevaHabilidad()">
                ➕ Registrar Nueva Habilidad
            </button>
        </div>`;
    }

    var cont = document.getElementById('contenedor-habilidades');
    if (cont) cont.innerHTML = html;
}

function sumarHora(id) {
    if (!APP_STATE.habilidades) return;
    for (var i = 0; i < APP_STATE.habilidades.length; i++) {
        if (String(APP_STATE.habilidades[i].id) === String(id)) {
            var s = APP_STATE.habilidades[i];
            var prevCalc = calcularRangoYProgreso(s.horasTotales);
            s.horasTotales = (s.horasTotales || 0) + 1;
            var newCalc = calcularRangoYProgreso(s.horasTotales);

            // Recompensa de EXP y desarrollo de atributos
            sumarExp(10);
            if (s.atributos && s.atributos.length > 0) {
                aplicarImpactoAtributos(s.atributos);
            }

            if (newCalc.rango !== prevCalc.rango) {
                setTimeout(function() {
                    alert("🎖️ ¡ASCENSO DE RANGO! Has alcanzado " + newCalc.rango + " en " + s.nombre + ".");
                }, 100);
            }
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarHabilidades(APP_STATE.habilidades);
}

function eliminarHabilidad(id) {
    if (!confirm("¿Deseas eliminar esta habilidad y su progreso?")) return;
    if (!APP_STATE.habilidades) return;
    APP_STATE.habilidades = APP_STATE.habilidades.filter(function(s) {
        return String(s.id) !== String(id);
    });
    MonarcaDB.save(APP_STATE);
    renderizarHabilidades(APP_STATE.habilidades);
}

// ==========================================================================
// 6. SISTEMA DE QUESTS DIARIOS (PROGRAMACIÓN HORARIA, NOTIFICACIONES Y PENITENCIAS)
// ==========================================================================

var LOOP_QUESTS_DIARIOS_INTERVAL = null;

/**
 * Solicita permisos de notificación en navegador / teléfono
 */
function solicitarPermisoNotificaciones(desdeBoton) {
    if (!('Notification' in window)) {
        if (desdeBoton) alert("Tu navegador no soporta notificaciones de sistema.");
        return;
    }

    if (Notification.permission === 'granted') {
        actualizarBotonNotificacionesUI();
        if (desdeBoton) {
            emitirNotificacionQuest(
                "⚔️ Notificaciones de Monarca Activas",
                "Recibirás alertas en tu dispositivo cuando tus quests diarias programadas se activen.",
                false,
                'monarca-test'
            );
        }
        return;
    }

    Notification.requestPermission().then(function(permission) {
        actualizarBotonNotificacionesUI();
        if (permission === 'granted') {
            emitirNotificacionQuest(
                "⚔️ ¡Notificaciones Activadas!",
                "Tus quests diarias te avisarán puntualmente a su hora con alarma y cronómetro.",
                false,
                'monarca-welcome'
            );
        } else if (desdeBoton) {
            alert("Has bloqueado o cancelado las notificaciones. Si deseas recibirlas en tu teléfono o PC, actívalas en la configuración de permisos del navegador.");
        }
    });
}

function actualizarBotonNotificacionesUI() {
    try {
        var btn = document.getElementById('btn-permiso-notif-quest');
        if (!btn) return;
        if ('Notification' in window && Notification.permission === 'granted') {
            btn.innerHTML = '<span>🔔</span> Notif. Activas';
            btn.style.background = '#ecfdf5';
            btn.style.color = '#065f46';
            btn.style.borderColor = '#a7f3d0';
        } else {
            btn.innerHTML = '<span>🔔</span> Notificaciones';
            btn.style.background = '#ffffff';
            btn.style.color = '#111827';
            btn.style.borderColor = '#d1d5db';
        }
    } catch(e) {
        console.warn("[Notificaciones UI]", e);
    }
}

/**
 * Sintetizador de alarma sonora usando Web Audio API
 */
function reproducirAlarmaQuest(esUrgente) {
    try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            var ctx = new AudioContext();
            var tiempos = esUrgente ? [0, 0.14, 0.28, 0.42, 0.56] : [0, 0.16, 0.32];
            var tonos = esUrgente ? [587.33, 880, 587.33, 880, 1174.66] : [523.25, 659.25, 783.99];

            tiempos.forEach(function(t, idx) {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = esUrgente ? 'sawtooth' : 'triangle';
                osc.frequency.setValueAtTime(tonos[idx] || 440, ctx.currentTime + t);

                gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.13);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + t);
                osc.stop(ctx.currentTime + t + 0.14);
            });
        }
    } catch(e) {
        console.warn("[Audio Alarma] Error:", e);
    }
}

/**
 * Emite notificación nativa de sistema al teléfono o PC
 */
function emitirNotificacionQuest(titulo, cuerpo, requireInteraction, tag) {
    // 1. Vibración en móviles
    if ('vibrate' in navigator) {
        try { navigator.vibrate([300, 150, 300, 150, 450]); } catch(e) {}
    }

    // 2. Notificación en pantalla
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(function(reg) {
                    reg.showNotification(titulo, {
                        body: cuerpo,
                        icon: 'icons/icon-192.png',
                        badge: 'icons/icon-192.png',
                        vibrate: [300, 150, 300, 150, 450],
                        tag: tag || 'quest-alert',
                        renotify: true,
                        requireInteraction: !!requireInteraction
                    });
                });
            } else {
                new Notification(titulo, {
                    body: cuerpo,
                    icon: 'icons/icon-192.png'
                });
            }
        } catch(e) {
            console.warn("[Notificación] Error:", e);
        }
    }
}

/**
 * Dispara la alerta de activación cuando llega la hora programada
 */
function emitirAlertaQuestActivada(q, esReactivacion) {
    var esOmitible = (q.esOmitible !== false);
    var mins = q.tiempoMinutos || 15;

    // 1. Alarma sonora y vibración
    reproducirAlarmaQuest(!esOmitible);

    // 2. Notificación de sistema para teléfono y PC
    var tituloNotif = esOmitible
        ? (esReactivacion ? `⏰ ¡Hora de gracia terminada!: ${q.titulo}` : `⚔️ ¡Quest Diaria Activada!: ${q.titulo}`)
        : `🚨 ¡QUEST OBLIGATORIA ACTIVADA!: ${q.titulo}`;

    var cuerpoNotif = esOmitible
        ? `Tienes ${mins} minutos para completarla. (Omitible: Puedes posponer 1 hora).`
        : `¡NO OMITIBLE! Tienes ${mins} minutos. Si no la completas, ¡hay penitencia!`;

    emitirNotificacionQuest(tituloNotif, cuerpoNotif, true, 'quest-' + q.id);

    // 3. Locución por voz si existe y está habilitado el sintetizador
    if ('speechSynthesis' in window && localStorage.getItem('monarca_jarvis_tts') !== 'false') {
        try {
            var msg = new SpeechSynthesisUtterance(
                esOmitible
                    ? `Atención Gabriel. Se ha activado la quest: ${q.titulo}. Tienes ${mins} minutos.`
                    : `Alerta máxima. Quest obligatoria activada: ${q.titulo}. Tienes ${mins} minutos. No se puede omitir.`
            );
            msg.lang = 'es-ES';
            msg.rate = 1.05;
            window.speechSynthesis.speak(msg);
        } catch(e) {}
    }

    // 4. Modal en primer plano si la PWA está abierta
    var modal = document.getElementById('modal-alerta-quest-activada');
    if (!modal) return;

    var header = document.getElementById('modal-alerta-quest-header');
    var icono = document.getElementById('modal-alerta-quest-icono');
    var tipoBadge = document.getElementById('modal-alerta-quest-tipo-badge');
    var tagEstado = document.getElementById('modal-alerta-quest-estado-tag');
    var txtTitulo = document.getElementById('modal-alerta-quest-titulo');
    var txtTimer = document.getElementById('modal-alerta-quest-timer');
    var txtPenitencia = document.getElementById('modal-alerta-quest-penitencia-aviso');
    var txtAviso = document.getElementById('modal-alerta-quest-aviso-omitible');
    var contAcciones = document.getElementById('modal-alerta-quest-acciones');

    if (header) {
        header.style.background = esOmitible ? '#111827' : '#991b1b';
    }
    if (icono) icono.textContent = esOmitible ? '⚔️' : '🚨';
    if (tipoBadge) {
        tipoBadge.textContent = esOmitible
            ? (esReactivacion ? '¡HORA DE GRACIA TERMINADA!' : '¡QUEST DIARIA ACTIVADA!')
            : '¡QUEST OBLIGATORIA (NO OMITIBLE)!';
    }

    if (tagEstado) {
        tagEstado.innerHTML = esOmitible
            ? `<span class="qd-badge" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 11px;">⏳ Quest Omitible</span>`
            : `<span class="qd-badge qd-badge-danger" style="font-size: 11.5px; font-weight: 800; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;">🚨 OBLIGATORIA · PENITENCIA EN JUEGO</span>`;
    }

    if (txtTitulo) txtTitulo.textContent = q.titulo;
    if (txtTimer) txtTimer.textContent = formatearSegundos(q.tiempoRestante || mins * 60);
    if (txtPenitencia) {
        txtPenitencia.textContent = `💀 Penitencia si no cumples a tiempo: ${q.penitencia || '30 Flexiones inmediatas'}`;
    }

    if (txtAviso) {
        txtAviso.innerHTML = esOmitible
            ? `Esta quest te permite <strong>posponer por 1 hora</strong> si no puedes realizarla ahora. Si la pospones, volverá a sonar exactamente en 1 hora.`
            : `<strong style="color: #991b1b;">⚠️ ESTA QUEST NO ES OMITIBLE:</strong> El tiempo ya comenzó a rodar. Si se agota el cronómetro, se te aplicará la penitencia y perderás 30 EXP.`;
    }

    if (contAcciones) {
        if (esOmitible) {
            contAcciones.innerHTML = `
                <button type="button" class="btn-qd-omit" style="flex: 1; padding: 10px 14px; font-size: 12.5px; justify-content: center;" onclick="posponerQuestUnaHora('${q.id}')">
                    ⏸️ Omitir (Sonar en 1 hora)
                </button>
                <button type="button" class="btn-system" style="flex: 1; padding: 10px 14px; font-size: 12.5px; justify-content: center; background: #111827; color: #ffffff;" onclick="cerrarAlertaQuestActivada()">
                    ⚔️ ¡Aceptar y Empezar!
                </button>
            `;
        } else {
            contAcciones.innerHTML = `
                <button type="button" class="btn-system" style="width: 100%; padding: 12px 18px; font-size: 13.5px; font-weight: 800; justify-content: center; background: #991b1b; color: #ffffff;" onclick="cerrarAlertaQuestActivada()">
                    ⚔️ ¡Comenzar Ahora Mismo! (Tiempo Rodando)
                </button>
            `;
        }
    }

    modal.style.display = 'flex';
}

function cerrarAlertaQuestActivada() {
    var modal = document.getElementById('modal-alerta-quest-activada');
    if (modal) modal.style.display = 'none';
}

/**
 * Pospone una quest omitible por 1 hora
 */
function posponerQuestUnaHora(id) {
    if (!APP_STATE.questsDiarios) return;
    var q = APP_STATE.questsDiarios.find(function(item) { return String(item.id) === String(id); });
    if (!q) return;

    if (q.esOmitible === false) {
        alert("⚠️ Esta quest fue configurada como NO OMITIBLE. No es posible posponerla. ¡El tiempo está corriendo!");
        return;
    }

    var ahoraMs = Date.now();
    q.estado = 'pospuesta';
    q.temporizadorActivo = false;
    q.pospuestaHasta = ahoraMs + (60 * 60 * 1000); // 1 hora exacta

    var proximaHora = new Date(q.pospuestaHasta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    MonarcaDB.save(APP_STATE);
    cerrarAlertaQuestActivada();
    renderizarQuestsDiarios();

    alert(`✓ Quest pospuesta por 1 hora.

• Tarea: "${q.titulo}"
• Volverá a sonar y activar el cronómetro a las ${proximaHora}.`);
}

/**
 * Carga e inicialización de Quests Diarios
 */
/**
 * Normaliza y sanea las quests diarias asegurando retrocompatibilidad total
 */
function sanitizarQuestsDiarios() {
    if (!APP_STATE.questsDiarios || !Array.isArray(APP_STATE.questsDiarios)) {
        APP_STATE.questsDiarios = [];
        return;
    }
    APP_STATE.questsDiarios = APP_STATE.questsDiarios.filter(function(q) {
        return q && typeof q === 'object' && q.id;
    });

    APP_STATE.questsDiarios.forEach(function(q) {
        if (!q.titulo) q.titulo = "Quest Diaria";
        if (!q.categoria) q.categoria = "🌅 Rutina";
        if (!q.tipoTiempo) {
            q.tipoTiempo = (q.horaActivacion) ? 'programada' : ((q.horaLimite) ? 'hora_limite' : 'duracion');
        }
        var mins = Number(q.tiempoMinutos || q.duracionMinutos) || 15;
        q.tiempoMinutos = mins;
        if (q.tiempoRestante === undefined || isNaN(q.tiempoRestante)) {
            q.tiempoRestante = mins * 60;
        }
        if (!q.estado) q.estado = 'pendiente';
        if (q.esOmitible === undefined) q.esOmitible = true;

        if (typeof q.penitencia === 'object' && q.penitencia !== null) {
            q.penitencia = q.penitencia.mensaje || "30 Flexiones";
        } else if (!q.penitencia || typeof q.penitencia !== 'string') {
            q.penitencia = "30 Flexiones";
        }

        if (Array.isArray(q.atributos)) {
            q.atributos = q.atributos.filter(function(a) { return a && (typeof a === 'object' || typeof a === 'string'); }).map(function(a) {
                if (typeof a === 'string') {
                    return { tipo: 'disciplina', icono: '⚡', nombre: a, porcentaje: 5 };
                }
                return {
                    tipo: a.tipo || 'disciplina',
                    icono: a.icono || '⚡',
                    nombre: a.nombre || 'Atributo',
                    porcentaje: Number(a.porcentaje) || 5
                };
            });
        } else {
            q.atributos = [];
        }
    });
}

function cargarQuestsDiarios() {
    try {
        sanitizarQuestsDiarios();
        actualizarBotonNotificacionesUI();
        verificarPenalizacionesPendientes();
        renderizarQuestsDiarios();
        iniciarLoopQuestsDiarios();
    } catch(err) {
        console.error("[Quests Diarios] Error al cargar:", err);
        var cont = document.getElementById('contenedor-quests-diarios');
        if (cont) {
            cont.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;">' +
                             '<p>Se han sincronizado tus quests. Pulsa para refrescar:</p>' +
                             '<button class="btn-subfiltro-ej" onclick="renderizarQuestsDiarios()">🔄 Recargar Quests</button>' +
                             '</div>';
        }
    }
}

/**
 * Loop en vivo de temporizadores, activaciones programadas y penitencias
 */
function iniciarLoopQuestsDiarios() {
    if (LOOP_QUESTS_DIARIOS_INTERVAL) return;

    LOOP_QUESTS_DIARIOS_INTERVAL = setInterval(function() {
        if (!APP_STATE.questsDiarios) return;
        var huboCambios = false;

        var ahora = new Date();
        var horaAct = ahora.getHours();
        var minAct = ahora.getMinutes();
        var horaActStr = (horaAct < 10 ? '0' : '') + horaAct + ':' + (minAct < 10 ? '0' : '') + minAct;
        var hoyStr = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : ahora.toISOString().split('T')[0];
        var ahoraMs = Date.now();

        APP_STATE.questsDiarios.forEach(function(q) {
            if (!q || typeof q !== 'object') return;
            // 1. ACTIVACIÓN PROGRAMADA (A una hora específica del día)
            if (q.tipoTiempo === 'programada' && q.estado === 'pendiente' && q.horaActivacion) {
                if (horaActStr >= q.horaActivacion && q.ultimaActivacionFecha !== hoyStr) {
                    q.ultimaActivacionFecha = hoyStr;
                    q.estado = 'en_progreso';
                    q.temporizadorActivo = true;
                    q.tiempoRestante = (q.tiempoMinutos || 15) * 60;
                    emitirAlertaQuestActivada(q, false);
                    huboCambios = true;
                }
            }

            // 2. REACTIVACIÓN DE QUEST POSPUESTA (Cumplida la hora de gracia)
            if (q.estado === 'pospuesta' && q.pospuestaHasta) {
                if (ahoraMs >= q.pospuestaHasta) {
                    q.pospuestaHasta = null;
                    q.estado = 'en_progreso';
                    q.temporizadorActivo = true;
                    q.tiempoRestante = (q.tiempoMinutos || 15) * 60;
                    emitirAlertaQuestActivada(q, true);
                    huboCambios = true;
                }
            }

            // 3. MANEJO DE TEMPORIZADOR ACTIVO
            if (q.temporizadorActivo && q.estado === 'en_progreso') {
                if (q.tiempoRestante > 0) {
                    q.tiempoRestante--;
                    // Actualizar el DOM en vivo si existe
                    var elTimer = document.getElementById('timer-val-' + q.id);
                    var elBarra = document.getElementById('timer-bar-' + q.id);
                    var elModalTimer = document.getElementById('modal-alerta-quest-timer');
                    var tiempoStr = formatearSegundos(q.tiempoRestante);

                    if (elTimer) elTimer.innerText = tiempoStr;
                    if (elModalTimer) elModalTimer.innerText = tiempoStr;

                    if (elBarra) {
                        var totalSegs = (q.tiempoMinutos || 15) * 60;
                        var pct = Math.max(0, Math.min(100, Math.round((q.tiempoRestante / totalSegs) * 100)));
                        elBarra.style.width = pct + '%';
                        if (pct < 20) {
                            elBarra.style.background = '#ef4444';
                        }
                    }
                } else {
                    // ¡TIEMPO EXPIRADO! Activar penitencia automática
                    q.temporizadorActivo = false;
                    cerrarAlertaQuestActivada();
                    aplicarPenalizacionAutomatica(q);
                    huboCambios = true;
                }
            }

            // 4. MANEJO DE HORA LÍMITE VENCIDA SI SIGUE PENDIENTE
            if (q.tipoTiempo === 'hora_limite' && q.estado === 'pendiente' && q.horaLimite) {
                if (esHoraLimiteSuperada(q.horaLimite)) {
                    aplicarPenalizacionAutomatica(q);
                    huboCambios = true;
                }
            }
        });

        if (huboCambios) {
            MonarcaDB.save(APP_STATE);
            renderizarQuestsDiarios();
        }
    }, 1000);
}

function verificarPenalizacionesPendientes() {
    if (!APP_STATE.questsDiarios) return;
    var cambio = false;

    APP_STATE.questsDiarios.forEach(function(q) {
        if (q.tipoTiempo === 'hora_limite' && q.estado === 'pendiente' && q.horaLimite) {
            if (esHoraLimiteSuperada(q.horaLimite)) {
                q.estado = 'penalizada';
                restarExp(30);
                cambio = true;
            }
        }
    });

    if (cambio) {
        MonarcaDB.save(APP_STATE);
    }
}

function esHoraLimiteSuperada(horaLimiteStr) {
    if (!horaLimiteStr) return false;
    var partes = horaLimiteStr.split(':');
    if (partes.length < 2) return false;

    var horaLim = parseInt(partes[0], 10);
    var minLim = parseInt(partes[1], 10);

    var ahora = new Date();
    var horaAct = ahora.getHours();
    var minAct = ahora.getMinutes();

    if (horaAct > horaLim) return true;
    if (horaAct === horaLim && minAct >= minLim) return true;
    return false;
}

function aplicarPenalizacionAutomatica(q) {
    q.estado = 'penalizada';
    q.temporizadorActivo = false;
    restarExp(30);
    MonarcaDB.save(APP_STATE);

    reproducirAlarmaQuest(true);
    emitirNotificacionQuest(
        "💀 ¡PENITENCIA ACTIVADA!",
        `Expiró el tiempo de: "${q.titulo}". Castigo: ${q.penitencia || '30 Flexiones'}. Se dedujeron -30 EXP.`,
        true,
        'penitencia-' + q.id
    );

    setTimeout(function() {
        var castigoDesc = (typeof q.penitencia === "string") ? q.penitencia : (q.penitencia && q.penitencia.mensaje ? q.penitencia.mensaje : "30 Flexiones");
        alert("⚠️ ¡ALERTA DEL SISTEMA: QUEST DIARIA NO COMPLETADA A TIEMPO!\n\n" +
              "La tarea '" + q.titulo + "' ha excedido su tiempo asignado.\n\n" +
              "💀 PENITENCIA AUTOMÁTICA ACTIVADA: " + castigoDesc + "\n\n" +
              "Se han deducido -30 EXP por quiebre de disciplina.");
        renderizarQuestsDiarios();
    }, 100);
}

function renderizarQuestsDiarios() {
    var cont = document.getElementById('contenedor-quests-diarios');
    var contAlertas = document.getElementById('contenedor-alertas-penitencias');
    if (!cont) return;

    try {
        sanitizarQuestsDiarios();
        var qList = APP_STATE.questsDiarios || [];

    // Actualizar métricas HUD
    var completadas = qList.filter(function(q) { return q.estado === 'completada'; }).length;
    var enCurso = qList.filter(function(q) { return q.temporizadorActivo || q.estado === 'en_progreso'; }).length;
    var penalizadas = qList.filter(function(q) { return q.estado === 'penalizada'; }).length;

    var mComp = document.getElementById('qd-metric-completadas');
    var mCurso = document.getElementById('qd-metric-en-curso');
    var mPen = document.getElementById('qd-metric-penalizadas');

    if (mComp) mComp.innerText = completadas + " / " + qList.length;
    if (mCurso) mCurso.innerText = String(enCurso);
    if (mPen) mPen.innerText = String(penalizadas);

    // Renderizar caja de alertas de penitencia activa
    if (contAlertas) {
        var questsPenalizadas = qList.filter(function(q) { return q.estado === 'penalizada'; });
        if (questsPenalizadas.length > 0) {
            var itemsPenitencia = questsPenalizadas.map(function(qp) {
                return `
                <div class="alerta-penitencia-item">
                    <div>
                        <div style="font-weight: 800; font-size: 13.5px; color: #991b1b;">⚠️ ${qp.titulo}</div>
                        <div style="font-size: 13px; color: #b91c1c; margin-top: 3px;">
                            <strong>CASTIGO OBLIGATORIO:</strong> ${qp.penitencia || '30 Flexiones'}
                        </div>
                    </div>
                    <button class="btn-cumplir-penitencia-sm" onclick="cumplirPenitenciaQuest('${qp.id}')">
                        ✓ Cumplir Castigo
                    </button>
                </div>`;
            }).join('');

            contAlertas.innerHTML = `
            <div class="alerta-penitencia-box">
                <div class="alerta-penitencia-header">
                    <span style="font-size: 20px;">💀</span>
                    <div>
                        <h4 style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 800; letter-spacing: 0.3px;">
                            PENITENCIAS ACTIVAS DEL SISTEMA (${questsPenalizadas.length})
                        </h4>
                        <span style="font-size: 12px; color: #b91c1c;">No completaste estas quests en su tiempo. Cumple tu penitencia para restaurar tu honor:</span>
                    </div>
                </div>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                    ${itemsPenitencia}
                </div>
            </div>`;
        } else {
            contAlertas.innerHTML = '';
        }
    }

    if (qList.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">⏳</span>
            <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 16px;">No tienes quests diarias configuradas</h4>
            <p style="color: #6b7280; font-size: 13px; max-width: 420px; margin: 0 auto 16px auto;">
                Agrega tus hábitos y rutinas matutinas con una hora programada de activación, cronómetro y penitencia si no las cumples.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevaQuestDiaria()">
                ➕ Crear Primera Quest Diaria
            </button>
        </div>`;
        return;
    }

    var html = '';
    qList.forEach(function(q) {
        var esPenalizada = (q.estado === 'penalizada');
        var esCompletada = (q.estado === 'completada');
        var esPenitenciaCumplida = (q.estado === 'penitencia_cumplida');
        var esEnProgreso = (q.estado === 'en_progreso' || q.temporizadorActivo);
        var esPospuesta = (q.estado === 'pospuesta');
        var esOmitible = (q.esOmitible !== false);

        var cardClass = 'quest-diario-card';
        if (esPenalizada) cardClass += ' penalizada';
        else if (esCompletada) cardClass += ' completada';
        else if (esPenitenciaCumplida) cardClass += ' penitencia-saldada';
        else if (esEnProgreso) cardClass += ' en-progreso';

        var badgeEstado = '';
        if (esPenalizada) badgeEstado = '<span class="qd-badge qd-badge-danger">💀 PENALIZADA</span>';
        else if (esCompletada) badgeEstado = '<span class="qd-badge qd-badge-success">✓ COMPLETADA A TIEMPO</span>';
        else if (esPenitenciaCumplida) badgeEstado = '<span class="qd-badge qd-badge-neutral">✓ PENITENCIA CUMPLIDA</span>';
        else if (esEnProgreso) badgeEstado = '<span class="qd-badge qd-badge-active">⏱️ TIEMPO CORRIENDO</span>';
        else if (esPospuesta) {
            var minPosp = q.pospuestaHasta ? Math.max(1, Math.round((q.pospuestaHasta - Date.now()) / 60000)) : 60;
            badgeEstado = `<span class="qd-badge" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-weight: 800;">⏸️ POSPUESTA (${minPosp}m)</span>`;
        }
        else badgeEstado = '<span class="qd-badge qd-badge-pending">⏳ PENDIENTE</span>';

        // Badge de Omitible vs No Omitible
        var badgeOmitible = esOmitible
            ? `<span class="qd-badge" style="background: #f3f4f6; color: #4b5563; font-size: 10.5px;">⏳ Omitible</span>`
            : `<span class="qd-badge qd-badge-danger" style="font-size: 10.5px; font-weight: 800; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;">🚨 NO OMITIBLE</span>`;

        // Sección de tiempo asignado
        var bloqueTiempo = '';
        if (q.tipoTiempo === 'programada' || q.tipoTiempo === 'duracion') {
            var segsRest = (q.tiempoRestante !== undefined) ? q.tiempoRestante : (q.tiempoMinutos || 15) * 60;
            var tiempoStr = formatearSegundos(segsRest);
            var totalSegs = (q.tiempoMinutos || 15) * 60;
            var pctRest = Math.max(0, Math.min(100, Math.round((segsRest / totalSegs) * 100)));

            var labelTiempo = (q.tipoTiempo === 'programada')
                ? `⏰ SE ACTIVA A LAS: <strong>${q.horaActivacion || '08:00'}</strong> (${q.tiempoMinutos || 15} MIN)`
                : `⏱️ TIEMPO ASIGNADO: <strong>${q.tiempoMinutos || 15} MIN</strong>`;

            bloqueTiempo = `
            <div style="margin-top: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                    <span style="color: #4b5563; font-weight: 600;">${labelTiempo}</span>
                    <span id="timer-val-${q.id}" style="font-weight: 800; font-family: monospace; font-size: 14px; color: ${esPenalizada ? '#ef4444' : (esEnProgreso ? '#2563eb' : '#111827')};">
                        ${tiempoStr}
                    </span>
                </div>
                <div style="background: #e5e7eb; height: 6px; border-radius: 9999px; overflow: hidden;">
                    <div id="timer-bar-${q.id}" style="height: 100%; width: ${pctRest}%; background: ${esPenalizada ? '#ef4444' : (pctRest < 25 ? '#f59e0b' : '#10b981')}; transition: width 0.3s ease;"></div>
                </div>
            </div>`;
        } else {
            bloqueTiempo = `
            <div style="margin-top: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; color: #4b5563; font-weight: 600;">⏰ HORA LÍMITE ASIGNADA:</span>
                <span style="font-weight: 800; font-size: 13.5px; color: #111827;">Antes de las ${q.horaLimite || '08:30'}</span>
            </div>`;
        }

        // Botones de acción
        var botonesAccion = '';
        if (esPenalizada) {
            botonesAccion = `
            <button class="btn-qd-action btn-qd-danger" onclick="cumplirPenitenciaQuest('${q.id}')">
                💀 Pagar Penitencia: ${q.penitencia || '30 Flexiones'}
            </button>`;
        } else if (esCompletada) {
            botonesAccion = `
            <button class="btn-qd-action btn-qd-done" disabled>
                ✓ Hecho a Tiempo (+${q.exp} EXP)
            </button>`;
        } else if (esPenitenciaCumplida) {
            botonesAccion = `
            <button class="btn-qd-action btn-qd-done" disabled>
                ✓ Penitencia Saldada
            </button>`;
        } else if (esPospuesta) {
            botonesAccion = `
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn-qd-timer btn-qd-start" onclick="iniciarTemporizadorQuest('${q.id}')">
                    ▶️ Empezar Ahora
                </button>
                <button class="btn-qd-action btn-qd-success" onclick="completarQuestDiaria('${q.id}')">
                    ✓ Completar Quest
                </button>
            </div>`;
        } else {
            // Pendiente o en progreso
            var btnOmit = (esEnProgreso && esOmitible)
                ? `<button type="button" class="btn-qd-omit" onclick="posponerQuestUnaHora('${q.id}')" title="Posponer 1 hora">⏸️ Omitir (1h)</button>`
                : '';

            var btnTimer = '';
            if (q.tipoTiempo === 'duracion' || q.tipoTiempo === 'programada') {
                if (q.temporizadorActivo) {
                    btnTimer = `<button class="btn-qd-timer btn-qd-pause" onclick="pausarTemporizadorQuest('${q.id}')">⏸ Pausar</button>`;
                } else {
                    btnTimer = `<button class="btn-qd-timer btn-qd-start" onclick="iniciarTemporizadorQuest('${q.id}')">▶ Iniciar Tiempo</button>`;
                }
            }

            botonesAccion = `
            <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                ${btnOmit}
                ${btnTimer}
                <button class="btn-qd-action btn-qd-success" onclick="completarQuestDiaria('${q.id}')">
                    ✓ Completar Quest
                </button>
            </div>`;
        }

        html += `
        <div class="${cardClass}">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 6px;">
                        <span class="qd-category-badge">${q.categoria || '🌅 Rutina'}</span>
                        ${badgeEstado}
                        ${badgeOmitible}
                    </div>
                    ${(q.atributos && q.atributos.length > 0) ? `
                        <div class="atributos-chips-container" style="margin-bottom: 6px;">
                            ${q.atributos.map(function(a) {
                                return `<span class="chip-atributo-impacto ${a.tipo}">${a.icono || '⚡'} ${a.nombre} (+${a.porcentaje}%)</span>`;
                            }).join('')}
                        </div>
                    ` : ''}
                    <h3 class="qd-title" style="${(esCompletada || esPenitenciaCumplida) ? 'text-decoration: line-through; color: #6b7280;' : ''}">${q.titulo}</h3>
                    
                    <div class="qd-details-row">
                        <span style="color: #10b981; font-weight: 700; font-size: 12px;">+${q.exp || 40} EXP</span>
                        <span style="color: #d1d5db;">•</span>
                        <span style="color: #ef4444; font-weight: 600; font-size: 12px;">💀 Castigo: ${q.penitencia || '30 Flexiones'}</span>
                    </div>
                </div>
                <button class="btn-delete-row" title="Eliminar quest" onclick="eliminarQuestDiaria('${q.id}')" style="background:none; border:none; color:#9ca3af; font-size:16px; cursor:pointer; padding:4px 8px; border-radius:6px;">✕</button>
            </div>

            ${bloqueTiempo}

            <div style="margin-top: 12px; display: flex; align-items: center; justify-content: flex-end;">
                ${botonesAccion}
            </div>
        </div>`;
    });

    cont.innerHTML = html;
    } catch(err) {
        console.error("[Renderizar Quests] Error:", err);
        cont.innerHTML = '<div style="text-align:center; padding:20px; color:#6b7280;">' +
                         '<p>Quests actualizadas correctamente.</p>' +
                         '<button class="btn-subfiltro-ej" onclick="renderizarQuestsDiarios()">🔄 Ver Quests</button>' +
                         '</div>';
    }
}

function formatearSegundos(totalSegundos) {
    if (isNaN(totalSegundos) || totalSegundos <= 0) return "00:00";
    var mins = Math.floor(totalSegundos / 60);
    var segs = totalSegundos % 60;
    return (mins < 10 ? "0" : "") + mins + ":" + (segs < 10 ? "0" : "") + segs;
}

function iniciarTemporizadorQuest(id) {
    if (!APP_STATE.questsDiarios) return;
    var q = APP_STATE.questsDiarios.find(function(item) { return String(item.id) === String(id); });
    if (!q) return;

    if (q.tiempoRestante === undefined || q.tiempoRestante <= 0) {
        q.tiempoRestante = (q.tiempoMinutos || 15) * 60;
    }

    q.temporizadorActivo = true;
    q.estado = 'en_progreso';
    q.pospuestaHasta = null;
    MonarcaDB.save(APP_STATE);
    renderizarQuestsDiarios();
}

function pausarTemporizadorQuest(id) {
    if (!APP_STATE.questsDiarios) return;
    var q = APP_STATE.questsDiarios.find(function(item) { return String(item.id) === String(id); });
    if (!q) return;

    q.temporizadorActivo = false;
    MonarcaDB.save(APP_STATE);
    renderizarQuestsDiarios();
}

function completarQuestDiaria(id) {
    if (!APP_STATE.questsDiarios) return;
    var q = APP_STATE.questsDiarios.find(function(item) { return String(item.id) === String(id); });
    if (!q) return;

    if (q.estado === 'penalizada') {
        alert("Esta quest fue penalizada porque expiró su tiempo. Debes pagar la penitencia para limpiarla.");
        return;
    }

    q.estado = 'completada';
    q.temporizadorActivo = false;
    q.pospuestaHasta = null;
    sumarExp(q.exp || 40);

    if (q.atributos && q.atributos.length > 0) {
        aplicarImpactoAtributos(q.atributos);
    }

    MonarcaDB.save(APP_STATE);
    cerrarAlertaQuestActivada();

    var detalleAtrs = (q.atributos && q.atributos.length > 0)
        ? ("\nDesarrollo aplicado: " + q.atributos.map(function(a) { return a.nombre + " (+" + a.porcentaje + "%)"; }).join(", "))
        : "";
    alert("¡Excelente disciplina! Has completado '" + q.titulo + "' en su tiempo asignado.\n+" + (q.exp || 40) + " EXP añadida a tu avatar." + detalleAtrs);
    renderizarQuestsDiarios();
}

function cumplirPenitenciaQuest(id) {
    if (!APP_STATE.questsDiarios) return;
    var q = APP_STATE.questsDiarios.find(function(item) { return String(item.id) === String(id); });
    if (!q) return;

    var castigo = (typeof q.penitencia === "string") ? q.penitencia : (q.penitencia && q.penitencia.mensaje ? q.penitencia.mensaje : "30 Flexiones");
    var confirma = confirm("¿Confirmas que has realizado tu penitencia obligatoria en la vida real?\n\n\"" + castigo + "\"");
    if (!confirma) return;

    q.estado = 'penitencia_cumplida';
    q.temporizadorActivo = false;
    q.pospuestaHasta = null;
    MonarcaDB.save(APP_STATE);

    alert("⚔️ ¡PENITENCIA CUMPLIDA! Has saldado tu falta con honor y templanza.");
    renderizarQuestsDiarios();
}

function eliminarQuestDiaria(id) {
    if (!confirm("¿Deseas eliminar esta quest de tu rutina diaria?")) return;
    if (!APP_STATE.questsDiarios) return;

    APP_STATE.questsDiarios = APP_STATE.questsDiarios.filter(function(q) {
        return String(q.id) !== String(id);
    });
    MonarcaDB.save(APP_STATE);
    renderizarQuestsDiarios();
}

function reiniciarCicloQuestsDiarios() {
    if (!confirm("¿Deseas reiniciar todas tus quests del día para un nuevo ciclo matutino?")) return;
    if (!APP_STATE.questsDiarios) return;

    APP_STATE.questsDiarios.forEach(function(q) {
        q.estado = 'pendiente';
        q.temporizadorActivo = false;
        q.tiempoRestante = (q.tiempoMinutos || 15) * 60;
        q.pospuestaHasta = null;
        q.ultimaActivacionFecha = null;
    });

    MonarcaDB.save(APP_STATE);
    renderizarQuestsDiarios();
    alert("¡Ciclo de quests reiniciado! Listo para una nueva jornada.");
}

function abrirModalNuevaQuestDiaria() {
    solicitarPermisoNotificaciones(false);

    ATRIBUTOS_MODAL_TEMP.quest = [];
    poblarSelectAtributos('quest');
    renderizarFilasAtributos('quest');

    var inNom = document.getElementById('modal-qd-nombre');
    var inMin = document.getElementById('modal-qd-minutos');
    var inHoraAct = document.getElementById('modal-qd-hora-activacion');
    var inHoraLim = document.getElementById('modal-qd-hora');
    var inExp = document.getElementById('modal-qd-exp');
    var inPenCustom = document.getElementById('modal-qd-penitencia-custom');
    var selPen = document.getElementById('modal-qd-penitencia-select');
    var selTipoT = document.getElementById('modal-qd-tipo-tiempo');
    var chkOmit = document.getElementById('modal-qd-es-omitible');

    if (inNom) inNom.value = '';
    if (selTipoT) selTipoT.value = 'programada';
    if (inHoraAct) inHoraAct.value = '08:00';
    if (inMin) inMin.value = '15';
    if (inHoraLim) inHoraLim.value = '23:59';
    if (inExp) inExp.value = '40';
    if (chkOmit) chkOmit.checked = true;

    if (inPenCustom) {
        inPenCustom.value = '';
        inPenCustom.style.display = 'none';
    }
    if (selPen) selPen.value = '30 Flexiones inmediatas';

    toggleTipoTiempoQuestModal();
    alCambiarOmitibleQuestModal();

    var m = document.getElementById('modal-nueva-quest-diaria');
    if (m) m.style.display = 'flex';
}

function cerrarModalNuevaQuestDiaria() {
    var m = document.getElementById('modal-nueva-quest-diaria');
    if (m) m.style.display = 'none';
}

function toggleTipoTiempoQuestModal() {
    var sel = document.getElementById('modal-qd-tipo-tiempo');
    var grpHoraAct = document.getElementById('grupo-qd-hora-activacion');
    var grpDur = document.getElementById('grupo-qd-duracion');
    var grpHora = document.getElementById('grupo-qd-hora');

    if (!sel) return;
    var val = sel.value;

    if (val === 'programada') {
        if (grpHoraAct) grpHoraAct.style.display = 'block';
        if (grpDur) grpDur.style.display = 'block';
        if (grpHora) grpHora.style.display = 'none';
    } else if (val === 'duracion') {
        if (grpHoraAct) grpHoraAct.style.display = 'none';
        if (grpDur) grpDur.style.display = 'block';
        if (grpHora) grpHora.style.display = 'none';
    } else if (val === 'hora_limite') {
        if (grpHoraAct) grpHoraAct.style.display = 'none';
        if (grpDur) grpDur.style.display = 'none';
        if (grpHora) grpHora.style.display = 'block';
    }
}

function toggleCheckboxOmitibleQuest(e) {
    var chk = document.getElementById('modal-qd-es-omitible');
    if (!chk) return;
    if (e && e.target === chk) return;
    chk.checked = !chk.checked;
    alCambiarOmitibleQuestModal();
}

function alCambiarOmitibleQuestModal() {
    var chk = document.getElementById('modal-qd-es-omitible');
    var desc = document.getElementById('modal-qd-desc-omitible');
    if (!chk || !desc) return;

    if (chk.checked) {
        desc.innerHTML = '<strong>Omitible (Activado):</strong> Si no puedes realizarla al sonar, podrás posponerla por 1 hora. Volverá a sonar exactamente en 1 hora.';
        desc.style.color = '#6b7280';
    } else {
        desc.innerHTML = '<strong style="color: #991b1b;">🚨 OBLIGATORIA (No Omitible):</strong> Aparecerá en el momento junto con la notificación y NO se puede posponer. Si no se completa a tiempo, ¡hay penitencia obligatoria!';
        desc.style.color = '#991b1b';
    }
}

function togglePenitenciaCustomModal() {
    var sel = document.getElementById('modal-qd-penitencia-select');
    var inCustom = document.getElementById('modal-qd-penitencia-custom');
    if (!sel || !inCustom) return;

    if (sel.value === 'custom') {
        inCustom.style.display = 'block';
        inCustom.focus();
    } else {
        inCustom.style.display = 'none';
    }
}

function confirmarAgregarQuestDiaria() {
    var inNom = document.getElementById('modal-qd-nombre');
    var selCat = document.getElementById('modal-qd-categoria');
    var selTipoT = document.getElementById('modal-qd-tipo-tiempo');
    var inHoraAct = document.getElementById('modal-qd-hora-activacion');
    var inMin = document.getElementById('modal-qd-minutos');
    var inHora = document.getElementById('modal-qd-hora');
    var chkOmit = document.getElementById('modal-qd-es-omitible');
    var selPen = document.getElementById('modal-qd-penitencia-select');
    var inPenCustom = document.getElementById('modal-qd-penitencia-custom');
    var inExp = document.getElementById('modal-qd-exp');

    var nombre = inNom ? inNom.value.trim() : '';
    if (!nombre) {
        alert("Por favor ingresa un título para la quest o hábito.");
        return;
    }

    var categoria = selCat ? selCat.value : '🌅 Rutina Matutina';
    var tipoTiempo = selTipoT ? selTipoT.value : 'programada';
    var horaActivacion = inHoraAct ? inHoraAct.value : '08:00';
    var minutos = inMin ? (parseInt(inMin.value, 10) || 15) : 15;
    var horaLimite = inHora ? inHora.value : '23:59';
    var esOmitible = chkOmit ? chkOmit.checked : true;

    var penitencia = '30 Flexiones inmediatas';
    if (selPen) {
        if (selPen.value === 'custom') {
            penitencia = (inPenCustom && inPenCustom.value.trim()) ? inPenCustom.value.trim() : '30 Flexiones inmediatas';
        } else {
            penitencia = selPen.value;
        }
    }

    var exp = inExp ? (parseInt(inExp.value, 10) || 40) : 40;

    if (!APP_STATE.questsDiarios) APP_STATE.questsDiarios = [];

    var listaAtrsQ = (ATRIBUTOS_MODAL_TEMP.quest && ATRIBUTOS_MODAL_TEMP.quest.length > 0)
        ? JSON.parse(JSON.stringify(ATRIBUTOS_MODAL_TEMP.quest))
        : [];

    var nuevaQ = {
        id: "QD-" + Date.now(),
        titulo: nombre,
        categoria: categoria,
        tipoTiempo: tipoTiempo,
        horaActivacion: horaActivacion,
        tiempoMinutos: minutos,
        horaLimite: horaLimite,
        esOmitible: esOmitible,
        penitencia: penitencia,
        exp: exp,
        atributos: listaAtrsQ,
        estado: 'pendiente',
        tiempoRestante: minutos * 60,
        temporizadorActivo: false,
        ultimaActivacionFecha: null,
        pospuestaHasta: null
    };

    APP_STATE.questsDiarios.push(nuevaQ);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevaQuestDiaria();
    renderizarQuestsDiarios();

    // Solicitar permiso de notificaciones de forma amistosa si es programada
    if (tipoTiempo === 'programada' && 'Notification' in window && Notification.permission !== 'granted') {
        setTimeout(function() {
            solicitarPermisoNotificaciones(false);
        }, 300);
    }
}


// 4. CONTROLADOR DE PESTAÑAS: ACCIONES Y DESARROLLO (6 MÓDULOS UNIFICADOS)
// ==========================================================================

window.TAB_ACCIONES_DESARROLLO_ACTIVA = 'quests';

const PROTOCOLOS_DEEP_WORK = [
    {
        id: "DW-1",
        nombre: "Deep Work (Enfoque Absoluto)",
        icono: "🧠",
        duracion: "60 min",
        musculo: "inteligencia",
        musculoNombre: "Inteligencia & Análisis",
        fatigaImpacto: 25,
        exp: 50,
        descripcion: "Bloque de máxima concentración sin distracciones ni multitarea para programación, estudio o diseño de sistemas."
    },
    {
        id: "DW-2",
        nombre: "Descompresión Neural",
        icono: "🧘",
        duracion: "20 min",
        musculo: "descanso",
        musculoNombre: "Descanso & Regeneración",
        fatigaImpacto: -20,
        exp: 25,
        descripcion: "Respiración diafragmática, ojos cerrados y silencio absoluto para reiniciar la saturación de memoria de trabajo."
    },
    {
        id: "DW-3",
        nombre: "Anulación de Ruido (Blindaje)",
        icono: "🛡️",
        duracion: "30 min",
        musculo: "anulacion",
        musculoNombre: "Anulación de Ruido",
        fatigaImpacto: 15,
        exp: 35,
        descripcion: "Filtro activo contra estímulos dopaminérgicos, redes sociales y distracciones externas para afianzar autocontrol."
    },
    {
        id: "DW-4",
        nombre: "Sprint Creativo Disruptivo",
        icono: "🎨",
        duracion: "45 min",
        musculo: "creatividad",
        musculoNombre: "Creatividad & Visión",
        fatigaImpacto: 20,
        exp: 40,
        descripcion: "Lluvia de ideas estructurada, mapas conceptuales y generación de soluciones no convencionales."
    }
];

function cambiarTabAccionesDesarrollo(tabId) {
    if (tabId === 'gimnasio' || tabId === 'gimnasio-mental') {
        cambiarVista('vista-ejercicios');
        if (typeof cambiarCategoriaEjercicios === 'function') cambiarCategoriaEjercicios('gimnasio-mental');
        return;
    }
    if (tabId === 'banco-mental') {
        cambiarVista('vista-ejercicios');
        if (typeof cambiarCategoriaEjercicios === 'function') {
            cambiarCategoriaEjercicios('banco');
            if (typeof filtrarSubcategoriaEjercicios === 'function') filtrarSubcategoriaEjercicios('mental');
        }
        return;
    }

    if (!tabId || tabId === 'conocimiento') tabId = 'quests';
    window.TAB_ACCIONES_DESARROLLO_ACTIVA = tabId;

    var tabs = ['quests', 'habitos', 'skills'];
    tabs.forEach(function(t) {
        var btn = document.getElementById('tab-btn-ad-' + t);
        var panel = document.getElementById('panel-ad-' + t);
        if (btn) {
            if (t === window.TAB_ACCIONES_DESARROLLO_ACTIVA) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
        if (panel) {
            panel.style.display = (t === window.TAB_ACCIONES_DESARROLLO_ACTIVA) ? 'block' : 'none';
        }
    });

    switch(window.TAB_ACCIONES_DESARROLLO_ACTIVA) {
        case 'quests':
            cargarQuestsDiarios();
            break;
        case 'habitos':
            cargarMisiones();
            break;
        case 'skills':
            cargarHabilidades();
            break;
    }
}

function renderizarProtocolosDeepWork() {
    var cont = document.getElementById('contenedor-protocolos-deepwork');
    if (!cont) return;

    var html = '';
    PROTOCOLOS_DEEP_WORK.forEach(function(p) {
        var fatigaTag = p.fatigaImpacto > 0 ? `+${p.fatigaImpacto}% Fatiga` : `${p.fatigaImpacto}% Alivio`;
        var fatigaBg = p.fatigaImpacto > 0 ? '#fef2f2' : '#ecfdf5';
        var fatigaColor = p.fatigaImpacto > 0 ? '#991b1b' : '#065f46';

        html += `
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px;">${p.icono}</span>
                        <strong style="font-size: 14px; color: #111827;">${p.nombre}</strong>
                    </div>
                    <span style="font-size: 11px; font-weight: 700; color: #6b7280; background: #f3f4f6; padding: 2px 8px; border-radius: 6px;">${p.duracion}</span>
                </div>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #4b5563; line-height: 1.4;">${p.descripcion}</p>
            </div>
            <div>
                <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f3f4f6; padding-top: 10px; margin-top: 6px;">
                    <div style="display: flex; gap: 6px;">
                        <span style="font-size: 10.5px; font-weight: 700; background: ${fatigaBg}; color: ${fatigaColor}; padding: 2px 6px; border-radius: 9999px;">${fatigaTag}</span>
                        <span style="font-size: 10.5px; font-weight: 700; background: #f3f4f6; color: #111827; padding: 2px 6px; border-radius: 9999px;">+${p.exp} EXP</span>
                    </div>
                    <button class="btn-system" style="padding: 5px 10px; font-size: 11.5px; border-radius: 6px;" onclick="ejecutarProtocoloDeepWork('${p.id}')">
                        ⚡ Iniciar
                    </button>
                </div>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function ejecutarProtocoloDeepWork(id) {
    var p = PROTOCOLOS_DEEP_WORK.find(function(item) { return item.id === id; });
    if (!p) return;

    if (!confirm("¿Deseas registrar la ejecución del protocolo '" + p.nombre + "' (" + p.duracion + ")?")) return;

    if (!APP_STATE.fatigaMentalDiaria) {
        APP_STATE.fatigaMentalDiaria = { nivel: 0, estado: "Mente Despejada", ultimoDia: typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toLocaleDateString('en-CA') };
    }

    var nivelAnt = APP_STATE.fatigaMentalDiaria.nivel || 0;
    var nuevoNivel = Math.min(100, Math.max(0, nivelAnt + p.fatigaImpacto));
    APP_STATE.fatigaMentalDiaria.nivel = nuevoNivel;
    APP_STATE.fatigaMentalDiaria.estado = nuevoNivel <= 25 ? "Mente Despejada" : (nuevoNivel <= 60 ? "Carga Moderada" : (nuevoNivel <= 85 ? "Fatiga Elevada" : "Saturación Neural"));

    if (typeof sumarExpMusculoMental === 'function') {
        sumarExpMusculoMental(p.musculo, p.exp);
    }
    if (typeof sumarExp === 'function') {
        sumarExp(p.exp);
    }

    MonarcaDB.save(APP_STATE);
    if (typeof renderizarBarraFatigaMentalDiaria === 'function') renderizarBarraFatigaMentalDiaria();
    if (typeof renderizarMusculosMentales === 'function') renderizarMusculosMentales();

    alert("🧠 ¡Protocolo ejecutado con éxito!\n• Protocolo: " + p.nombre + "\n• +" + p.exp + " EXP para ti y para " + p.musculoNombre + "\n• Fatiga Mental actual: " + nuevoNivel + "%.");
}
