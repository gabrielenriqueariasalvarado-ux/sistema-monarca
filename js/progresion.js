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

var ATRIBUTOS_MODAL_TEMP = { quest: [], mision: [], habilidad: [], penitencia: [] };

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
                <span style="font-size: 12px; font-weight: 800; color: #94a3b8;">%</span>
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
            var actualMente = Number(APP_STATE.desgasteMente[item.clave]) || 0;
            APP_STATE.desgasteMente[item.clave] = Math.min(100, actualMente + pct);

            var actualAtributo = Number(APP_STATE.menteAtributos[item.clave]) || 10;
            APP_STATE.menteAtributos[item.clave] = Math.min(100, actualAtributo + pct);

            if (APP_STATE.fatigaMentalDiaria) {
                var actualSNC = Number(APP_STATE.fatigaMentalDiaria.nivel) || 0;
                APP_STATE.fatigaMentalDiaria.nivel = Math.min(100, actualSNC + Math.round(pct * 0.5));
            }
        }
    });

    if (typeof calcularMetricasGeneralesDesgaste === 'function') {
        calcularMetricasGeneralesDesgaste();
    }
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

/**
 * Aplica impacto inteligente en Estado Personal para quests que no tienen atributos explícitos configurados
 */
function aplicarImpactoInteligenteQuest(q) {
    if (!q) return;
    if (!APP_STATE.fatiga) APP_STATE.fatiga = {};
    if (!APP_STATE.desgasteMente) APP_STATE.desgasteMente = {};

    var texto = ((q.titulo || '') + ' ' + (q.categoria || '')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var impactoAplicado = [];

    // Detección física / deportiva
    var esFisico = /gym|entren|ejercicio|flexion|sentadilla|cardio|correr|caminar|rutina|muscul|pierna|brazo|pecho|espalda|abdomen|estiram/.test(texto);
    // Detección mental / cognitiva / laboral
    var esMental = /estudio|leer|lectura|trabajo|boom|barber|trainer|program|codigo|reunion|cliente|planific|analisis|foco|concentr|meditacion/.test(texto);

    if (esFisico) {
        var mKeys = [];
        if (typeof mapearTextoAMusculos === 'function') {
            mKeys = mapearTextoAMusculos(texto);
        }
        if (mKeys.length === 0) {
            if (/flexion|pecho|push/.test(texto)) mKeys = ['pect_mayor', 'triceps'];
            else if (/sentadilla|pierna|correr|caminar|squat/.test(texto)) mKeys = ['cuadriceps', 'pantorrillas'];
            else if (/dominada|espalda|pull/.test(texto)) mKeys = ['dorsales', 'biceps'];
            else mKeys = ['core', 'cuadriceps'];
        }

        mKeys.forEach(function(k) {
            var actual = Number(APP_STATE.fatiga[k]) || 0;
            APP_STATE.fatiga[k] = Math.min(100, actual + 20);
        });
        impactoAplicado.push("Cuerpo (+" + mKeys.join(", ") + " +20%)");
    }

    if (esMental || !esFisico) {
        var clavesMente = ['enfoque', 'procesamiento'];
        if (/estudio|lectura|leer/.test(texto)) clavesMente = ['memoria', 'procesamiento'];
        else if (/cliente|reunion|barber|trainer/.test(texto)) clavesMente = ['inteligencia_social', 'control_emocional'];
        else if (/boom|trabajo|planific|codigo/.test(texto)) clavesMente = ['enfoque', 'claridad_decision'];

        clavesMente.forEach(function(k) {
            var actM = Number(APP_STATE.desgasteMente[k]) || 0;
            APP_STATE.desgasteMente[k] = Math.min(100, actM + 20);
        });

        if (APP_STATE.fatigaMentalDiaria) {
            var actSNC = Number(APP_STATE.fatigaMentalDiaria.nivel) || 0;
            APP_STATE.fatigaMentalDiaria.nivel = Math.min(100, actSNC + 12);
        }
        impactoAplicado.push("Mente (" + clavesMente.join(", ") + " +20%)");
    }

    if (typeof calcularMetricasGeneralesDesgaste === 'function') {
        calcularMetricasGeneralesDesgaste();
    }
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

    return impactoAplicado;
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
    cargarQuestsDiarios();
}

function abrirModalNuevaMision() {
    abrirModalNuevaQuestDiaria();
}

function cerrarModalNuevaMision() {
    cerrarModalNuevaQuestDiaria();
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
        <div style="text-align: center; padding: 40px 20px; background: #121725; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">⚡</span>
            <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 16px;">No tienes misiones activas</h4>
            <p style="color: #94a3b8; font-size: 13px; max-width: 400px; margin: 0 auto 16px auto;">
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
    if (!APP_STATE._eliminados) APP_STATE._eliminados = {};
    if (!Array.isArray(APP_STATE._eliminados.misiones)) APP_STATE._eliminados.misiones = [];
    if (!APP_STATE._eliminados.misiones.includes(id)) {
        APP_STATE._eliminados.misiones.push(id);
    }
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
 * Escala Progresiva de Maestría (Plazos alargados progresivamente):
 * Rango E: 0 - 5 horas (Meta: 5 hrs | Duración: 5 hrs)
 * Rango D: 5 - 15 horas (Meta: 15 hrs | Duración: 10 hrs)
 * Rango C: 15 - 35 horas (Meta: 35 hrs | Duración: 20 hrs)
 * Rango B: 35 - 70 horas (Meta: 70 hrs | Duración: 35 hrs)
 * Rango A: 70 - 125 horas (Meta: 125 hrs | Duración: 55 hrs)
 * Rango S: 125 - 210 horas (Meta: 210 hrs | Duración: 85 hrs)
 * Rango SS: 210 - 340 horas (Meta: 340 hrs | Duración: 130 hrs)
 * Rango SSS (Máximo): 340+ horas (Maestría Legendaria Absoluta)
 */
function calcularRangoYProgreso(horas) {
    var h = Math.max(0, Number(horas) || 0);

    if (h >= 340) {
        return {
            rango: "Rango SSS (Máximo)",
            badgeClass: "badge-rank-sss",
            descripcion: "Maestría absoluta / Nivel legendario supremo alcanzado.",
            horasEnNivel: h,
            horasReqNivel: 340,
            porcentaje: 100,
            siguiente: "¡Maestría Legendaria Alcanzada!"
        };
    } else if (h >= 210) {
        // Rango SS: 210 - 340 hrs (meta 340 hrs, req 130 hrs)
        var enNivel = h - 210;
        var req = 130;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 340 - h;
        return {
            rango: "Rango SS",
            badgeClass: "badge-rank-ss",
            descripcion: "Dominio supremo, arquitectura y maestría avanzada.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para SSS"
        };
    } else if (h >= 125) {
        // Rango S: 125 - 210 hrs (meta 210 hrs, req 85 hrs)
        var enNivel = h - 125;
        var req = 85;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 210 - h;
        return {
            rango: "Rango S",
            badgeClass: "badge-rank-s",
            descripcion: "Nivel élite profesional / resolución de problemas de máxima complejidad.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para SS"
        };
    } else if (h >= 70) {
        // Rango A: 70 - 125 hrs (meta 125 hrs, req 55 hrs)
        var enNivel = h - 70;
        var req = 55;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 125 - h;
        return {
            rango: "Rango A",
            badgeClass: "badge-rank-a",
            descripcion: "Capacidad de estructuración eficiente y autonomía técnica total.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para S"
        };
    } else if (h >= 35) {
        // Rango B: 35 - 70 hrs (meta 70 hrs, req 35 hrs)
        var enNivel = h - 35;
        var req = 35;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 70 - h;
        return {
            rango: "Rango B",
            badgeClass: "badge-rank-b",
            descripcion: "Dominas lógica avanzada, patrones y depuración de alto nivel.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para A"
        };
    } else if (h >= 15) {
        // Rango C: 15 - 35 hrs (meta 35 hrs, req 20 hrs)
        var enNivel = h - 15;
        var req = 20;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 35 - h;
        return {
            rango: "Rango C",
            badgeClass: "badge-rank-c",
            descripcion: "Desarrollas soluciones funcionales y proyectos pequeños con soltura.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para B"
        };
    } else if (h >= 5) {
        // Rango D: 5 - 15 hrs (meta 15 hrs, req 10 hrs)
        var enNivel = h - 5;
        var req = 10;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 15 - h;
        return {
            rango: "Rango D",
            badgeClass: "badge-rank-d",
            descripcion: "Ejecución práctica de conceptos y resolución de problemas guiados.",
            horasEnNivel: enNivel,
            horasReqNivel: req,
            porcentaje: pct,
            siguiente: "Faltan " + faltan + " hrs para C"
        };
    } else {
        // Rango E: 0 - 5 hrs (meta 5 hrs, req 5 hrs)
        var enNivel = h;
        var req = 5;
        var pct = Math.min(100, Math.floor((enNivel / req) * 100));
        var faltan = 5 - h;
        return {
            rango: "Rango E",
            badgeClass: "badge-rank-e",
            descripcion: "Iniciación y fundamentos básicos de la disciplina.",
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

var SKILLS_EXPANDIDAS = (typeof SKILLS_EXPANDIDAS !== 'undefined') ? SKILLS_EXPANDIDAS : new Set();

function toggleDetalleSkill(id) {
    var sid = String(id);
    if (SKILLS_EXPANDIDAS.has(sid)) {
        SKILLS_EXPANDIDAS.delete(sid);
    } else {
        SKILLS_EXPANDIDAS.add(sid);
    }
    renderizarHabilidades();
}

function renderizarHabilidades(skills) {
    var sList = skills || APP_STATE.habilidades || [];
    var html = "";

    if (sList && sList.length > 0) {
        sList.forEach(function(s) {
            var calc = calcularRangoYProgreso(s.horasTotales);
            var porcentaje = calc.porcentaje;
            var isExpanded = SKILLS_EXPANDIDAS.has(String(s.id));

            html += `
            <div class="skill-card">
                <div class="skill-card-header" style="align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                        <span class="skill-rank-badge ${calc.badgeClass}">${calc.rango}</span>
                        <h3 class="skill-name" style="margin: 0; font-size: 15px; color: #f8fafc; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.nombre}</h3>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <button onclick="sumarHorasHabilidad('${s.id}', 1)" class="btn-add-hora" title="Sumar 1 hora de práctica y +10 EXP">+1h</button>
                        <button onclick="sumarHorasHabilidad('${s.id}', 2)" class="btn-add-hora" title="Sumar 2 horas de práctica y +20 EXP">+2h</button>
                        <button onclick="sumarHorasHabilidad('${s.id}', 3)" class="btn-add-hora" title="Sumar 3 horas de práctica y +30 EXP">+3h</button>
                        <button class="btn-toggle-detalle ${isExpanded ? 'active' : ''}" onclick="toggleDetalleSkill('${s.id}')" title="${isExpanded ? 'Ocultar información' : 'Desplegar información completa'}">
                            <span>${isExpanded ? '▲' : '▼'}</span>
                        </button>
                    </div>
                </div>

                <div class="skill-progress-track" style="margin: 10px 0 6px 0;">
                    <div class="skill-progress-fill" style="width: ${porcentaje}%;"></div>
                </div>

                <div class="skill-progress-info">
                    <span>Progreso: <strong>${calc.horasEnNivel} / ${calc.horasReqNivel} hrs</strong> &nbsp;·&nbsp; Total: ${s.horasTotales} hrs</span>
                    <span style="font-weight: 700; color: #a5b4fc;">${calc.siguiente} (${porcentaje}%)</span>
                </div>

                <!-- PANEL DESPLEGABLE: BENEFICIO Y DESARROLLO -->
                <div class="card-detalle-desplegable" id="skill-detalle-${s.id}" style="display: ${isExpanded ? 'flex' : 'none'};">
                    ${s.beneficio ? `
                        <div style="font-size: 12.5px; color: #cbd5e1; line-height: 1.4;">
                            🎁 <strong>Beneficio / Recompensa:</strong> ${s.beneficio}
                        </div>
                    ` : ''}
                    ${(s.atributos && s.atributos.length > 0) ? `
                        <div style="margin-top: 2px;">
                            <span style="font-size: 11px; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 4px;">Atributos que Desarrolla (+% por hora):</span>
                            <div class="atributos-chips-container">
                                ${s.atributos.map(function(a) {
                                    return `<span class="chip-atributo-impacto ${a.tipo}">${a.icono || '🔮'} ${a.nombre} (+${a.porcentaje}% / h)</span>`;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: flex-end; margin-top: 4px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 6px;">
                        <button onclick="eliminarHabilidad('${s.id}')" style="background: none; border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 11px; border-radius: 6px; padding: 4px 8px; cursor: pointer;">
                            ✕ Eliminar Habilidad
                        </button>
                    </div>
                </div>
            </div>`;
        });
    } else {
        html = `
        <div style="text-align: center; padding: 40px 20px; background: #121725; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🔮</span>
            <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 16px;">No hay habilidades registradas</h4>
            <p style="color: #94a3b8; font-size: 13px; max-width: 400px; margin: 0 auto 16px auto;">
                Registra una nueva disciplina o tecnología. Comenzará en Rango E e irá ascendiendo automáticamente de rango hasta Rango SSS a medida que acumules horas.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevaHabilidad()">
                ➕ Registrar Nueva Habilidad
            </button>
        </div>`;
    }

    var cont = document.getElementById('contenedor-habilidades');
    if (cont) cont.innerHTML = html;

    setTimeout(function() {
        if (typeof renderizarChartProductividadSkills === 'function') {
            renderizarChartProductividadSkills(FILTRO_CHART_SKILLS);
        }
    }, 50);
}

function sumarHorasHabilidad(id, cantidad) {
    var cant = Math.max(1, parseInt(cantidad, 10) || 1);
    if (!APP_STATE.habilidades) return;
    for (var i = 0; i < APP_STATE.habilidades.length; i++) {
        if (String(APP_STATE.habilidades[i].id) === String(id)) {
            var s = APP_STATE.habilidades[i];
            var prevCalc = calcularRangoYProgreso(s.horasTotales);
            s.horasTotales = (s.horasTotales || 0) + cant;
            var newCalc = calcularRangoYProgreso(s.horasTotales);

            // Recompensa de EXP (+10 EXP por cada hora)
            sumarExp(10 * cant);

            // Desarrollo de atributos por cada hora sumada
            if (s.atributos && s.atributos.length > 0) {
                for (var k = 0; k < cant; k++) {
                    aplicarImpactoAtributos(s.atributos);
                }
            }

            // Registrar en historial para métricas y gráficas de productividad
            if (!APP_STATE.historialSkills) APP_STATE.historialSkills = [];
            APP_STATE.historialSkills.push({
                id: "HS-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                skillId: s.id,
                nombre: s.nombre,
                horas: cant,
                timestamp: Date.now()
            });

            if (newCalc.rango !== prevCalc.rango) {
                setTimeout(function() {
                    alert("🎖️ ¡ASCENSO DE RANGO! Has alcanzado " + newCalc.rango + " en " + s.nombre + " (Total: " + s.horasTotales + " hrs).");
                }, 100);
            }
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarHabilidades(APP_STATE.habilidades);
}

function sumarHora(id) {
    sumarHorasHabilidad(id, 1);
}

function eliminarHabilidad(id) {
    if (!confirm("¿Deseas eliminar esta habilidad y su progreso?")) return;
    if (!APP_STATE.habilidades) return;
    if (typeof registrarTombstone === 'function') {
        registrarTombstone('habilidades', id);
    }
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
/**
 * Asegura la existencia del canal de notificaciones de máxima prioridad en Android (Capacitor)
 */
function asegurarCanalAlarmaCapacitor() {
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.LocalNotifications) return;
    try {
        var ln = window.Capacitor.Plugins.LocalNotifications;
        ln.createChannel({
            id: 'quest_alarms_channel',
            name: 'Alarmas Quests Monarca',
            description: 'Canal de máxima prioridad y pantalla completa para misiones del Sistema Monarca',
            importance: 5,
            visibility: 1,
            vibration: true,
            lights: true,
            lightColor: '#e11d48'
        }).then(function() {
            console.log("[Capacitor] Canal quest_alarms_channel asegurado.");
        }).catch(function(err) {
            console.warn("[Capacitor Canal Error]", err);
        });
    } catch(e) {
        console.warn("[asegurarCanalAlarmaCapacitor]", e);
    }
}

/**
 * Programa alarmas nativas exactas de Android a Pantalla Completa vía MonarcaAlarm nativo
 */
function programarAlarmasNativasQuests() {
    var plugins = (window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins : null;
    if (!plugins) return;

    var monarcaAlarm = plugins.MonarcaAlarm || null;
    var ln = plugins.LocalNotifications || null;
    var qList = APP_STATE.questsDiarios || [];
    var ahora = new Date();

    try {
        qList.forEach(function(q, idx) {
            var target = null;
            var h = 8, m = 0;
            if (q.tipoTiempo === 'programada' && q.estado === 'pendiente' && q.horaActivacion) {
                var partes = q.horaActivacion.split(':');
                if (partes.length >= 2) {
                    h = parseInt(partes[0], 10);
                    m = parseInt(partes[1], 10);
                    target = new Date();
                    target.setHours(h, m, 0, 0);
                    if (target.getTime() <= ahora.getTime()) {
                        target.setDate(target.getDate() + 1);
                    }
                }
            } else if (q.estado === 'pospuesta' && q.pospuestaHasta && q.pospuestaHasta > ahora.getTime()) {
                target = new Date(q.pospuestaHasta);
                h = target.getHours();
                m = target.getMinutes();
            }

            if (target) {
                var notifId = (idx + 1) * 1000 + (h * 60 + m);
                var esOmitible = (q.esOmitible !== false);

                // 1. DISPARAR EN ALARMMANAGER NATIVO CON PANTALLA COMPLETA
                if (monarcaAlarm && typeof monarcaAlarm.programarAlarma === 'function') {
                    monarcaAlarm.programarAlarma({
                        id: String(notifId),
                        titulo: q.titulo,
                        penitencia: q.penitencia || '30 Flexiones inmediatas',
                        esOmitible: esOmitible,
                        questId: q.id,
                        hora: h,
                        minutos: m,
                        timestamp: target.getTime()
                    }).then(function() {
                        console.log("[MonarcaAlarm Nativo] Alarma programada a pantalla completa para " + target.toLocaleTimeString());
                    }).catch(function(e) {
                        console.warn("[MonarcaAlarm Error]", e);
                    });
                }

                // 2. RESPALDO LOCALNOTIFICATIONS SI ESTÁ DISPONIBLE
                if (ln && typeof ln.schedule === 'function') {
                    asegurarCanalAlarmaCapacitor();
                    ln.schedule({
                        notifications: [{
                            id: notifId,
                            title: esOmitible ? '⚔️ ¡Quest Diaria!: ' + q.titulo : '🚨 ¡QUEST OBLIGATORIA!: ' + q.titulo,
                            body: esOmitible
                                ? 'Tienes ' + (q.tiempoMinutos || 15) + ' min. Toca para ver e iniciar tu misión.'
                                : '¡NO OMITIBLE! Tienes ' + (q.tiempoMinutos || 15) + ' min. ¡Hay penitencia!',
                            schedule: { at: target, allowWhileIdle: true },
                            channelId: 'quest_alarms_channel',
                            ongoing: false,
                            autoCancel: true,
                            extra: { questId: q.id, fullScreen: true }
                        }]
                    }).catch(function(e){});
                }
            }
        });
    } catch(err) {
        console.warn("[programarAlarmasNativasQuests]", err);
    }
}

/**
 * Permite al usuario sincronizar una quest programada directamente con la app Reloj de Android
 */
function sincronizarQuestConRelojAndroid(id) {
    if (!APP_STATE.questsDiarios) return;
    var q = APP_STATE.questsDiarios.find(function(item) { return String(item.id) === String(id); });
    if (!q || !q.horaActivacion) {
        alert("Esta quest no tiene una hora fija asignada.");
        return;
    }
    var partes = q.horaActivacion.split(':');
    if (partes.length < 2) return;
    var h = parseInt(partes[0], 10);
    var m = parseInt(partes[1], 10);
    var titulo = encodeURIComponent("Monarca: " + (q.titulo || "Quest Diaria"));

    var intentUrl = "intent:#Intent;action=android.intent.action.SET_ALARM;" +
        "i.android.intent.extra.HOUR=" + h + ";" +
        "i.android.intent.extra.MINUTES=" + m + ";" +
        "S.android.intent.extra.MESSAGE=" + titulo + ";" +
        "B.android.intent.extra.SKIP_UI=false;end";

    try {
        window.location.href = intentUrl;
    } catch(e) {
        console.warn("[sincronizarQuestConRelojAndroid]", e);
        alert("Abre la app Reloj de tu teléfono y programa una alarma a las " + q.horaActivacion);
    }
}

// Listener para cuando el usuario toca la notificación nativa en Android
if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
    try {
        window.Capacitor.Plugins.LocalNotifications.addListener('localNotificationActionPerformed', function(notification) {
            if (notification && notification.notification && notification.notification.extra) {
                var qId = notification.notification.extra.questId;
                var q = (APP_STATE.questsDiarios || []).find(function(item) { return item.id === qId; });
                if (q) emitirAlertaQuestActivada(q, false);
            }
        });
    } catch(e) {}
}

function solicitarPermisoNotificaciones(desdeBoton) {
    // 1. Si está ejecutándose como APK nativa Android (Capacitor)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
        try {
            window.Capacitor.Plugins.LocalNotifications.requestPermissions().then(function(res) {
                actualizarBotonNotificacionesUI();
                if (res.display === 'granted') {
                    programarAlarmasNativasQuests();
                    if (desdeBoton) {
                        alert("🔔 ¡Alarmas Nativas Android Activadas!\nTus quests sonarán con exactitud al segundo incluso con el teléfono bloqueado y pantalla apagada.");
                    }
                } else if (desdeBoton) {
                    alert("Por favor permite las notificaciones y alarmas para que Monarca pueda avisarte puntualmente.");
                }
            });
            return;
        } catch(e) {
            console.warn("[Capacitor Request Error]", e);
        }
    }

    // 2. Navegador web estándar (Laptop o móvil)
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

        // Comprobación en Capacitor (Nativo)
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
            window.Capacitor.Plugins.LocalNotifications.checkPermissions().then(function(res) {
                if (res.display === 'granted') {
                    btn.innerHTML = '<span>🔔</span> Alarma Nativa OK';
                    btn.style.background = '#ecfdf5';
                    btn.style.color = '#065f46';
                    btn.style.borderColor = '#a7f3d0';
                }
            });
            return;
        }

        // Comprobación web estándar
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
    if (typeof programarAlarmasNativasQuests === 'function') programarAlarmasNativasQuests();

    alert(`✓ Quest pospuesta por 1 hora.

• Tarea: "${q.titulo}"
• Volverá a sonar y activar el cronómetro a las ${proximaHora}.`);
}

/**
 * Carga e inicialización de Quests Diarios
 */
/**
 * Normaliza y sanea las quests diarias asegurando retrocompatibilidad total,
 * filtrando elementos eliminados (tombstones) y deduplicando copias redundantes.
 */
function sanitizarQuestsDiarios() {
    if (!APP_STATE.questsDiarios || !Array.isArray(APP_STATE.questsDiarios)) {
        APP_STATE.questsDiarios = [];
        return;
    }

    if (!APP_STATE._eliminados) APP_STATE._eliminados = {};
    if (!Array.isArray(APP_STATE._eliminados.questsDiarios)) APP_STATE._eliminados.questsDiarios = [];
    var tombSet = new Set(APP_STATE._eliminados.questsDiarios);

    // 1. Filtrar quests nulas o que ya hayan sido eliminadas
    APP_STATE.questsDiarios = APP_STATE.questsDiarios.filter(function(q) {
        return q && typeof q === 'object' && q.id && !tombSet.has(q.id);
    });

    // 2. Deduplicar por identidad de título
    var vistos = new Map();
    var listaLimpia = [];
    var huboDuplicados = false;

    APP_STATE.questsDiarios.forEach(function(q) {
        var clave = (q.titulo || '').trim().toLowerCase();
        if (!clave) {
            listaLimpia.push(q);
            return;
        }

        if (!vistos.has(clave)) {
            vistos.set(clave, q);
            listaLimpia.push(q);
        } else {
            // Ya existe una quest con este título: conservar la más avanzada y purgar la otra
            huboDuplicados = true;
            var existente = vistos.get(clave);
            if (q.estado === 'completada' && existente.estado !== 'completada') {
                var idx = listaLimpia.indexOf(existente);
                if (idx !== -1) listaLimpia[idx] = q;
                vistos.set(clave, q);
                if (!APP_STATE._eliminados.questsDiarios.includes(existente.id)) {
                    APP_STATE._eliminados.questsDiarios.push(existente.id);
                }
            } else {
                if (!APP_STATE._eliminados.questsDiarios.includes(q.id)) {
                    APP_STATE._eliminados.questsDiarios.push(q.id);
                }
            }
        }
    });

    APP_STATE.questsDiarios = listaLimpia;

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

    if (huboDuplicados) {
        MonarcaDB.save(APP_STATE, false);
    }
}

function migrarMisionesAQuestsDiarios() {
    if (!APP_STATE.questsDiarios) APP_STATE.questsDiarios = [];
    if (Array.isArray(APP_STATE.misiones) && APP_STATE.misiones.length > 0) {
        var nombresExistentes = new Set(APP_STATE.questsDiarios.map(function(q) {
            return (q.titulo || q.nombre || '').trim().toLowerCase();
        }));
        var migrados = 0;
        APP_STATE.misiones.forEach(function(m) {
            if (!m || !m.nombre) return;
            var nom = m.nombre.trim().toLowerCase();
            if (!nombresExistentes.has(nom)) {
                APP_STATE.questsDiarios.push({
                    id: m.id || ('QD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)),
                    titulo: m.nombre,
                    categoria: '⚡ Misión / Hábito',
                    tipoTiempo: 'libre',
                    horaActivacion: null,
                    tiempoMinutos: 0,
                    horaLimite: null,
                    esOmitible: true,
                    penitencia: 'Sin penitencia obligatoria',
                    exp: m.exp || 25,
                    atributos: Array.isArray(m.atributos) ? m.atributos : [],
                    estado: m.completada ? 'completada' : 'pendiente',
                    tiempoRestante: 0,
                    temporizadorActivo: false,
                    ultimaActivacionFecha: null,
                    pospuestaHasta: null,
                    timestamp: m.creadoEn ? new Date(m.creadoEn).getTime() : Date.now(),
                    fechaActualizacion: Date.now()
                });
                nombresExistentes.add(nom);
                migrados++;
            }
        });
        if (migrados > 0) {
            MonarcaDB.save(APP_STATE, false);
        }
    }
}

function cargarQuestsDiarios() {
    try {
        migrarMisionesAQuestsDiarios();
        sanitizarQuestsDiarios();
        actualizarBotonNotificacionesUI();
        verificarPenalizacionesPendientes();
        renderizarQuestsDiarios();
        iniciarLoopQuestsDiarios();
        if (typeof programarAlarmasNativasQuests === 'function') programarAlarmasNativasQuests();
    } catch(err) {
        console.error("[Hábitos & Misiones] Error al cargar:", err);
        var cont = document.getElementById('contenedor-quests-diarios');
        if (cont) {
            cont.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;">' +
                             '<p>Se han sincronizado tus hábitos y misiones. Pulsa para refrescar:</p>' +
                             '<button class="btn-subfiltro-ej" onclick="renderizarQuestsDiarios()">🔄 Recargar</button>' +
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
            MonarcaDB.save(APP_STATE, false);
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
        MonarcaDB.save(APP_STATE, false);
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

var QUESTS_EXPANDIDAS = (typeof QUESTS_EXPANDIDAS !== 'undefined') ? QUESTS_EXPANDIDAS : new Set();

function toggleDetalleQuest(id) {
    var qid = String(id);
    if (QUESTS_EXPANDIDAS.has(qid)) {
        QUESTS_EXPANDIDAS.delete(qid);
    } else {
        QUESTS_EXPANDIDAS.add(qid);
    }
    renderizarQuestsDiarios();
}

function aplicarPenalizacionAutomatica(q) {
    q.estado = 'penalizada';
    q.temporizadorActivo = false;
    var penalizacionExp = (q.penitenciaExp !== undefined) ? Number(q.penitenciaExp) : 30;
    if (penalizacionExp > 0) restarExp(penalizacionExp);
    MonarcaDB.save(APP_STATE);

    reproducirAlarmaQuest(true);
    var pNom = q.penitenciaNombre || q.penitencia || "30 Flexiones";
    var pDesc = q.penitenciaDesc ? `\nInstrucciones: ${q.penitenciaDesc}` : "";
    emitirNotificacionQuest(
        "💀 ¡PENITENCIA ACTIVADA!",
        `Expiró el tiempo de: "${q.titulo}". Castigo: ${pNom}. ${penalizacionExp > 0 ? 'Se dedujeron -' + penalizacionExp + ' EXP.' : ''}`,
        true,
        'penitencia-' + q.id
    );

    setTimeout(function() {
        alert("⚠️ ¡ALERTA DEL SISTEMA: MISIÓN NO COMPLETADA A TIEMPO!\n\n" +
              "La tarea '" + q.titulo + "' ha excedido su tiempo asignado.\n\n" +
              "💀 CASTIGO DISCIPLINARIO OBLIGATORIO: " + pNom + pDesc + "\n\n" +
              (penalizacionExp > 0 ? "Se han deducido -" + penalizacionExp + " EXP por quiebre de disciplina." : "Salda tu penitencia física para restaurar tu honor."));
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
                    var pNom = qp.penitenciaNombre || qp.penitencia || '30 Flexiones';
                    var pDesc = qp.penitenciaDesc ? `<div style="font-size: 11.5px; color: #fca5a5; margin-top: 3px; line-height: 1.35;">${qp.penitenciaDesc}</div>` : '';
                    var pExp = (qp.penitenciaExp !== undefined) ? qp.penitenciaExp : 30;
                    return `
                    <div class="alerta-penitencia-item">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                <span style="font-weight: 800; font-size: 13.5px; color: #991b1b;">⚠️ ${qp.titulo}</span>
                                <span class="badge-penitencia-exp">-${pExp} EXP</span>
                            </div>
                            <div style="font-size: 12.5px; color: #b91c1c; margin-top: 3px;">
                                <strong>CASTIGO OBLIGATORIO:</strong> ${pNom}
                            </div>
                            ${pDesc}
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
                            <span style="font-size: 12px; color: #b91c1c;">No completaste estas acciones a tiempo. Cumple tu penitencia para restaurar tu honor:</span>
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
            <div style="text-align: center; padding: 40px 20px; background: #121725; border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 16px;">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">⚔️</span>
                <h4 style="margin: 0 0 6px 0; color: #f8fafc; font-size: 16px;">No tienes hábitos o misiones configuradas</h4>
                <p style="color: #94a3b8; font-size: 13px; max-width: 420px; margin: 0 auto 16px auto;">
                    Agrega tus hábitos, misiones y rutinas diarias. Puedes configurarlos con temporizador, hora fija con alarma o cumplimiento libre en el día.
                </p>
                <button class="btn-add-finanza" onclick="abrirModalNuevaQuestDiaria()">
                    ➕ Crear Primer Hábito o Misión
                </button>
            </div>`;
            return;
        }

        var html = '';
        qList.forEach(function(q) {
            var esLibre = (q.tipoTiempo === 'libre');
            var esPenalizada = (q.estado === 'penalizada');
            var esCompletada = (q.estado === 'completada');
            var esPenitenciaCumplida = (q.estado === 'penitencia_cumplida');
            var esEnProgreso = (q.estado === 'en_progreso' || q.temporizadorActivo);
            var esPospuesta = (q.estado === 'pospuesta');
            var esOmitible = (q.esOmitible !== false);
            var isExpanded = QUESTS_EXPANDIDAS.has(String(q.id));

            var cardClass = 'quest-diario-card';
            if (esPenalizada) cardClass += ' penalizada';
            else if (esCompletada) cardClass += ' completada';
            else if (esPenitenciaCumplida) cardClass += ' penitencia-saldada';
            else if (esEnProgreso) cardClass += ' en-progreso';

            var badgeEstado = '';
            if (esLibre) {
                badgeEstado = esCompletada
                    ? '<span class="qd-badge qd-badge-success">✓ CUMPLIDO</span>'
                    : '<span class="qd-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700;">🎯 HÁBITO LIBRE</span>';
            } else if (esPenalizada) {
                badgeEstado = '<span class="qd-badge qd-badge-danger">💀 PENALIZADA</span>';
            } else if (esCompletada) {
                badgeEstado = '<span class="qd-badge qd-badge-success">✓ COMPLETADA A TIEMPO</span>';
            } else if (esPenitenciaCumplida) {
                badgeEstado = '<span class="qd-badge qd-badge-neutral">✓ PENITENCIA CUMPLIDA</span>';
            } else if (esEnProgreso) {
                badgeEstado = '<span class="qd-badge qd-badge-active">⏱️ TIEMPO CORRIENDO</span>';
            } else if (esPospuesta) {
                var minPosp = q.pospuestaHasta ? Math.max(1, Math.round((q.pospuestaHasta - Date.now()) / 60000)) : 60;
                badgeEstado = `<span class="qd-badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 800;">⏸️ POSPUESTA (${minPosp}m)</span>`;
            } else {
                badgeEstado = '<span class="qd-badge qd-badge-pending">⏳ PENDIENTE</span>';
            }

            // Barra de temporizador visible cuando hay un tiempo asignado
            var bloqueTiempo = '';
            if (!esLibre && (q.tipoTiempo === 'programada' || q.tipoTiempo === 'duracion')) {
                var segsRest = (q.tiempoRestante !== undefined) ? q.tiempoRestante : (q.tiempoMinutos || 15) * 60;
                var tiempoStr = formatearSegundos(segsRest);
                var totalSegs = (q.tiempoMinutos || 15) * 60;
                var pctRest = Math.max(0, Math.min(100, Math.round((segsRest / totalSegs) * 100)));

                var labelTiempo = (q.tipoTiempo === 'programada')
                    ? `⏰ SE ACTIVA: <strong>${q.horaActivacion || '08:00'}</strong> (${q.tiempoMinutos || 15} MIN)`
                    : `⏱️ TIEMPO: <strong>${q.tiempoMinutos || 15} MIN</strong>`;

                bloqueTiempo = `
                <div style="margin-top: 8px; background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 6px 10px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
                        <span style="color: #94a3b8; font-weight: 600;">${labelTiempo}</span>
                        <span id="timer-val-${q.id}" style="font-weight: 800; font-family: monospace; font-size: 13px; color: ${esPenalizada ? '#ef4444' : (esEnProgreso ? '#38bdf8' : '#f8fafc')};">
                            ${tiempoStr}
                        </span>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.1); height: 5px; border-radius: 9999px; overflow: hidden;">
                        <div id="timer-bar-${q.id}" style="height: 100%; width: ${pctRest}%; background: ${esPenalizada ? '#ef4444' : (pctRest < 25 ? '#f59e0b' : '#10b981')}; transition: width 0.3s ease;"></div>
                    </div>
                </div>`;
            }

            var badgeRutina = q.rutinaId
                ? `<span class="badge-rutina-vinculada" onclick="event.stopPropagation(); iniciarRutinaDesdeHabito('${q.rutinaId}', '${q.id}')" title="Rutina Vinculada: Haz clic para abrir el entrenamiento">🏋️ ${q.rutinaNombre || 'Rutina'}</span>`
                : '';

            // Botones de acción compactos
            var botonesAccion = '';
            if (esLibre) {
                if (esCompletada) {
                    var btnRutinaHecha = q.rutinaId ? `<button type="button" class="btn-qd-timer" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3);" onclick="iniciarRutinaDesdeHabito('${q.rutinaId}', '${q.id}')">👁️ Rutina</button>` : '';
                    botonesAccion = btnRutinaHecha + `<button class="btn-qd-action btn-qd-done" disabled>✓ Cumplido</button>`;
                } else {
                    var btnRutinaDirecto = q.rutinaId
                        ? `<button type="button" class="btn-qd-timer" style="background: rgba(56, 189, 248, 0.18); color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); font-weight: 700;" onclick="iniciarRutinaDesdeHabito('${q.rutinaId}', '${q.id}')" title="Ir a la rutina de entrenamiento">🏋️ Entrenar ▶</button>`
                        : '';
                    botonesAccion = `
                    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                        ${btnRutinaDirecto}
                        <button class="btn-qd-action btn-qd-success" onclick="completarQuestDiaria('${q.id}')">✓ Completar</button>
                    </div>`;
                }
            } else if (esPenalizada) {
                botonesAccion = `
                <button class="btn-qd-action btn-qd-danger" onclick="cumplirPenitenciaQuest('${q.id}')">
                    💀 Penitencia
                </button>`;
            } else if (esCompletada) {
                var btnRutinaComp = q.rutinaId ? `<button type="button" class="btn-qd-timer" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3);" onclick="iniciarRutinaDesdeHabito('${q.rutinaId}', '${q.id}')">👁️ Rutina</button>` : '';
                botonesAccion = btnRutinaComp + `<button class="btn-qd-action btn-qd-done" disabled>✓ Hecho</button>`;
            } else if (esPenitenciaCumplida) {
                botonesAccion = `<button class="btn-qd-action btn-qd-done" disabled>✓ Saldada</button>`;
            } else if (esPospuesta) {
                var btnRutinaPosp = q.rutinaId
                    ? `<button type="button" class="btn-qd-timer" style="background: rgba(56, 189, 248, 0.18); color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); font-weight: 700;" onclick="iniciarRutinaDesdeHabito('${q.rutinaId}', '${q.id}')" title="Ir a la rutina de entrenamiento">🏋️ Entrenar ▶</button>`
                    : '';
                botonesAccion = `
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    ${btnRutinaPosp}
                    <button class="btn-qd-timer btn-qd-start" onclick="iniciarTemporizadorQuest('${q.id}')">▶️ Iniciar</button>
                    <button class="btn-qd-action btn-qd-success" onclick="completarQuestDiaria('${q.id}')">✓ Completar</button>
                </div>`;
            } else {
                // Pendiente o en progreso
                var btnTimer = '';
                if (q.tipoTiempo === 'duracion' || q.tipoTiempo === 'programada') {
                    if (q.temporizadorActivo) {
                        btnTimer = `<button class="btn-qd-timer btn-qd-pause" onclick="pausarTemporizadorQuest('${q.id}')">⏸ Pausar</button>`;
                    } else {
                        btnTimer = `<button class="btn-qd-timer btn-qd-start" onclick="iniciarTemporizadorQuest('${q.id}')">▶ Iniciar</button>`;
                    }
                }

                var btnRutinaPend = q.rutinaId
                    ? `<button type="button" class="btn-qd-timer" style="background: rgba(56, 189, 248, 0.18); color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); font-weight: 700;" onclick="iniciarRutinaDesdeHabito('${q.rutinaId}', '${q.id}')" title="Ir a la rutina de entrenamiento">🏋️ Entrenar ▶</button>`
                    : '';

                botonesAccion = `
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    ${btnRutinaPend}
                    ${btnTimer}
                    <button class="btn-qd-action btn-qd-success" onclick="completarQuestDiaria('${q.id}')">✓ Completar</button>
                </div>`;
            }

            var btnOmit = (esEnProgreso && esOmitible)
                ? `<button type="button" class="btn-qd-omit" onclick="posponerQuestUnaHora('${q.id}')" title="Posponer 1 hora">⏸️ Omitir (1h)</button>`
                : '';

            var detallePenitencia = '';
            if (esLibre || !q.penitencia || q.penitencia === 'Sin penitencia obligatoria' || q.penitenciaId === 'sin_penitencia') {
                detallePenitencia = '<span style="color: #94a3b8; font-weight: 500;">🎯 Cumplimiento Flexible</span>';
            } else {
                var pNom = q.penitenciaNombre || q.penitencia || 'Penitencia';
                var pExp = (q.penitenciaExp !== undefined) ? q.penitenciaExp : 30;
                detallePenitencia = `<span style="color: #ef4444; font-weight: 700;">💀 Castigo: ${pNom} (-${pExp} EXP)</span>`;
            }

            var badgeOmitible = esLibre
                ? `<span style="color: #cbd5e1;">🗓️ Flexible</span>`
                : (esOmitible
                    ? `<span style="color: #cbd5e1;">⏳ Omitible</span>`
                    : `<span style="color: #f87171; font-weight: 800;">🚨 NO OMITIBLE</span>`);

            html += `
            <div class="${cardClass}">
                <!-- FILA PRINCIPAL COMPACTA (Solo Nombre, Estado, Botón Principal y Flecha) -->
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 180px; flex-wrap: wrap;">
                        ${badgeEstado}
                        ${badgeRutina}
                        <h3 class="qd-title" style="margin: 0; font-size: 15px; font-weight: 700; ${(esCompletada || esPenitenciaCumplida) ? 'text-decoration: line-through; color: #64748b;' : 'color: #f8fafc;'}">${q.titulo}</h3>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${botonesAccion}
                        <button class="btn-toggle-detalle ${isExpanded ? 'active' : ''}" onclick="toggleDetalleQuest('${q.id}')" title="${isExpanded ? 'Ocultar información' : 'Desplegar información completa'}">
                            <span>${isExpanded ? '▲' : '▼'}</span>
                        </button>
                    </div>
                </div>

                ${bloqueTiempo}

                <!-- PANEL DESPLEGABLE CON INFORMACIÓN COMPLETA -->
                <div class="card-detalle-desplegable" id="quest-detalle-${q.id}" style="display: ${isExpanded ? 'flex' : 'none'};">
                    ${q.rutinaId ? `
                        <div style="font-size: 12px; color: #38bdf8; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <div>
                                <strong>🏋️ Rutina Vinculada:</strong> ${q.rutinaNombre || 'Sesión de Entrenamiento'}
                                <span style="font-size: 11px; color: #94a3b8; display: block; margin-top: 2px;">Al finalizar esta sesión en el Arsenal Físico o Gimnasio Mental, este hábito se completará automáticamente.</span>
                            </div>
                            <button type="button" class="btn-qd-timer" style="background: rgba(56, 189, 248, 0.22); color: #38bdf8; border-color: #38bdf8; font-weight: 700; white-space: nowrap;" onclick="iniciarRutinaDesdeHabito('${q.rutinaId}', '${q.id}')">
                                🏋️ Abrir Rutina ▶
                            </button>
                        </div>
                    ` : ''}

                    ${q.beneficio ? `
                        <div style="font-size: 12.5px; color: #cbd5e1; line-height: 1.4;">
                            🎁 <strong>Beneficio / Recompensa:</strong> ${q.beneficio}
                        </div>
                    ` : ''}

                    <div style="display: flex; gap: 12px; font-size: 12px; flex-wrap: wrap; align-items: center;">
                        <span style="color: #10b981; font-weight: 700;">+${q.exp || 40}% EXP de Nivel</span>
                        <span style="color: #4b5563;">•</span>
                        ${detallePenitencia}
                        <span style="color: #4b5563;">•</span>
                        ${badgeOmitible}
                    </div>

                    ${(q.penitenciaDesc && q.penitenciaId !== 'sin_penitencia') ? `
                        <div style="font-size: 12px; color: #fca5a5; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 8px 10px; line-height: 1.35;">
                            💀 <strong>Instrucciones de la Penitencia:</strong> ${q.penitenciaDesc}
                        </div>
                    ` : ''}

                    ${(q.penitenciaAtributos && q.penitenciaAtributos.length > 0 && q.penitenciaId !== 'sin_penitencia') ? `
                        <div style="margin-top: 2px;">
                            <span style="font-size: 11px; color: #f87171; font-weight: 700; display: block; margin-bottom: 4px;">Atributos que Forja al Saldar la Penitencia:</span>
                            <div class="atributos-chips-container">
                                ${q.penitenciaAtributos.map(function(a) {
                                    return `<span class="chip-atributo-impacto ${a.tipo}" style="border-color: rgba(239, 68, 68, 0.4);">${a.icono || '⚡'} ${a.nombre} (+${a.porcentaje}%)</span>`;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${(q.atributos && q.atributos.length > 0) ? `
                        <div style="margin-top: 2px;">
                            <span style="font-size: 11px; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 4px;">Atributos que Desarrolla al Completar:</span>
                            <div class="atributos-chips-container">
                                ${q.atributos.map(function(a) {
                                    return `<span class="chip-atributo-impacto ${a.tipo}">${a.icono || '⚡'} ${a.nombre} (+${a.porcentaje}%)</span>`;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 8px; flex-wrap: wrap; gap: 8px;">
                        <div style="display: flex; gap: 6px; align-items: center;">
                            ${btnOmit}
                            ${q.tipoTiempo === 'programada' ? `
                                <button type="button" onclick="sincronizarQuestConRelojAndroid('${q.id}')" title="Configurar alarma en el Reloj del móvil" style="padding: 4px 8px; font-size: 11px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.12); background: #131826; color: #cbd5e1; cursor: pointer;">
                                    ⏰ Alarma Móvil
                                </button>
                            ` : ''}
                        </div>
                        <button onclick="eliminarQuestDiaria('${q.id}')" style="background: none; border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 11px; border-radius: 6px; padding: 4px 8px; cursor: pointer;">
                            ✕ Eliminar Hábito/Misión
                        </button>
                    </div>
                </div>
            </div>`;
        });

        cont.innerHTML = html;

        setTimeout(function() {
            if (typeof renderizarChartProductividadHabitos === 'function') {
                renderizarChartProductividadHabitos(FILTRO_CHART_HABITOS);
            }
        }, 50);
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

    var pct = Math.max(1, Number(q.exp) || 40);
    var expMaxActual = (APP_STATE.jugador && APP_STATE.jugador.expMax) ? APP_STATE.jugador.expMax : 100;
    var expGanada = Math.max(5, Math.round((pct / 100) * expMaxActual));
    sumarExp(expGanada);

    var detalleAtrs = "";
    if (q.atributos && q.atributos.length > 0) {
        aplicarImpactoAtributos(q.atributos);
        detalleAtrs = "\nDesarrollo aplicado: " + q.atributos.map(function(a) { return a.nombre + " (+" + a.porcentaje + "%)"; }).join(", ");
    } else {
        var autoImpact = aplicarImpactoInteligenteQuest(q);
        if (autoImpact && autoImpact.length > 0) {
            detalleAtrs = "\nCarga cargada a Estado Personal: " + autoImpact.join(" · ");
        }
    }

    // Registrar en historial para métricas y gráficas de productividad
    if (!APP_STATE.historialQuests) APP_STATE.historialQuests = [];
    APP_STATE.historialQuests.push({
        id: "HQ-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        questId: q.id,
        titulo: q.titulo,
        tipoTiempo: q.tipoTiempo,
        timestamp: Date.now()
    });

    MonarcaDB.save(APP_STATE);
    cerrarAlertaQuestActivada();

    alert("¡Excelente disciplina! Has completado '" + q.titulo + "' en su tiempo asignado.\n+" + pct + "% de EXP (" + expGanada + " EXP) añadida a tu avatar." + detalleAtrs);
    renderizarQuestsDiarios();
}

function cumplirPenitenciaQuest(id) {
    if (!APP_STATE.questsDiarios) return;
    var q = APP_STATE.questsDiarios.find(function(item) { return String(item.id) === String(id); });
    if (!q) return;

    var castigo = q.penitenciaNombre || q.penitencia || "30 Flexiones";
    var instruc = q.penitenciaDesc ? "\n\nInstrucciones:\n" + q.penitenciaDesc : "";
    var confirma = confirm("¿Confirmas que has realizado tu penitencia obligatoria en la vida real?\n\n\"" + castigo + "\"" + instruc);
    if (!confirma) return;

    q.estado = 'penitencia_cumplida';
    q.temporizadorActivo = false;
    q.pospuestaHasta = null;

    // Aplicar atributos desarrollados por saldar la penitencia
    var detalleAtrs = "";
    if (q.penitenciaAtributos && q.penitenciaAtributos.length > 0) {
        aplicarImpactoAtributos(q.penitenciaAtributos);
        detalleAtrs = "\nAtributos forjados en tu Avatar: " + q.penitenciaAtributos.map(function(a) { return a.nombre + " (+" + a.porcentaje + "%)"; }).join(", ");
    }

    // Registrar en historial para gráficas
    if (!APP_STATE.historialQuests) APP_STATE.historialQuests = [];
    APP_STATE.historialQuests.push({
        id: "HQ-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        questId: q.id,
        titulo: q.titulo + ' (Penitencia)',
        tipoTiempo: q.tipoTiempo,
        timestamp: Date.now(),
        esPenitencia: true
    });

    MonarcaDB.save(APP_STATE);

    alert("⚔️ ¡PENITENCIA CUMPLIDA! Has saldado tu falta con honor y templanza." + detalleAtrs);
    renderizarQuestsDiarios();
}

function eliminarQuestDiaria(id) {
    if (!confirm("¿Deseas eliminar esta quest de tu rutina diaria?")) return;
    if (!APP_STATE.questsDiarios) return;

    if (!APP_STATE._eliminados) APP_STATE._eliminados = {};
    if (!Array.isArray(APP_STATE._eliminados.questsDiarios)) APP_STATE._eliminados.questsDiarios = [];
    if (!APP_STATE._eliminados.questsDiarios.includes(id)) {
        APP_STATE._eliminados.questsDiarios.push(id);
    }

    APP_STATE.questsDiarios = APP_STATE.questsDiarios.filter(function(q) {
        return String(q.id) !== String(id);
    });
    MonarcaDB.save(APP_STATE);
    renderizarQuestsDiarios();
    if (typeof programarAlarmasNativasQuests === 'function') programarAlarmasNativasQuests();
}

/**
 * Purgado manual y seguro de quests duplicadas o huérfanas
 */
function purgarQuestsDuplicadas(mostrarAlerta) {
    if (!APP_STATE.questsDiarios || !Array.isArray(APP_STATE.questsDiarios)) return;
    if (!APP_STATE._eliminados) APP_STATE._eliminados = {};
    if (!Array.isArray(APP_STATE._eliminados.questsDiarios)) APP_STATE._eliminados.questsDiarios = [];

    var vistos = new Map();
    var nuevosQuests = [];
    var eliminadosCount = 0;

    APP_STATE.questsDiarios.forEach(function(q) {
        if (!q || !q.id) return;
        if (APP_STATE._eliminados.questsDiarios.includes(q.id)) {
            eliminadosCount++;
            return;
        }

        var clave = (q.titulo || '').trim().toLowerCase();
        if (!clave) {
            nuevosQuests.push(q);
            return;
        }

        if (!vistos.has(clave)) {
            vistos.set(clave, q);
            nuevosQuests.push(q);
        } else {
            var existente = vistos.get(clave);
            if (q.estado === 'completada' && existente.estado !== 'completada') {
                var idx = nuevosQuests.indexOf(existente);
                if (idx !== -1) nuevosQuests[idx] = q;
                vistos.set(clave, q);
                if (!APP_STATE._eliminados.questsDiarios.includes(existente.id)) {
                    APP_STATE._eliminados.questsDiarios.push(existente.id);
                }
            } else {
                if (!APP_STATE._eliminados.questsDiarios.includes(q.id)) {
                    APP_STATE._eliminados.questsDiarios.push(q.id);
                }
            }
            eliminadosCount++;
        }
    });

    APP_STATE.questsDiarios = nuevosQuests;
    if (eliminadosCount > 0) {
        MonarcaDB.save(APP_STATE);
        renderizarQuestsDiarios();
        if (mostrarAlerta) {
            alert("🧹 Se han limpiado " + eliminadosCount + " quests duplicadas. Tu lista ha quedado sincronizada.");
        }
    } else if (mostrarAlerta) {
        alert("✨ No se encontraron quests duplicadas. Todo está al día.");
    }
}

function reiniciarCicloQuestsDiarios() {
    if (!confirm("¿Deseas reiniciar todos tus hábitos y misiones para un nuevo ciclo diario?")) return;
    if (!APP_STATE.questsDiarios) return;

    APP_STATE.questsDiarios.forEach(function(q) {
        q.estado = 'pendiente';
        q.temporizadorActivo = false;
        q.tiempoRestante = (q.tipoTiempo === 'libre') ? 0 : (q.tiempoMinutos || 15) * 60;
        q.pospuestaHasta = null;
        q.ultimaActivacionFecha = null;
    });

    MonarcaDB.save(APP_STATE);
    renderizarQuestsDiarios();
    if (typeof programarAlarmasNativasQuests === 'function') programarAlarmasNativasQuests();
    alert("¡Ciclo de hábitos y misiones reiniciado! Listo para una nueva jornada.");
}

function iniciarRutinaDesdeHabito(rutinaId, questId) {
    if (!rutinaId) return;

    if (questId && typeof iniciarTemporizadorQuest === 'function') {
        var q = APP_STATE.questsDiarios && APP_STATE.questsDiarios.find(function(item) { return String(item.id) === String(questId); });
        if (q && !q.temporizadorActivo && q.estado !== 'completada' && q.estado !== 'penalizada') {
            iniciarTemporizadorQuest(questId);
        }
    }

    if (typeof abrirDetalleRutina === 'function') {
        abrirDetalleRutina(rutinaId);
    } else {
        cambiarVista('vista-ejercicios');
    }
}

function poblarSelectRutinasVinculadasModalQuest() {
    var sel = document.getElementById('modal-qd-rutina-vinculada');
    if (!sel) return;

    var rList = (APP_STATE && APP_STATE.rutinas) ? APP_STATE.rutinas : [];
    var html = '<option value="">-- Ninguna (Hábito Manual / Personalizado) --</option>';

    if (rList.length > 0) {
        html += '<optgroup label="⚡ TUS RUTINAS DE ENTRENAMIENTO">';
        rList.forEach(function(r, idx) {
            if (!r) return;
            var icono = r.tipo === 'mental' ? '🧠' : (r.tipo === 'hibrida' ? '⚡' : '🏋️');
            var tipoLabel = r.tipo === 'mental' ? 'Cognitiva' : (r.tipo === 'hibrida' ? 'Híbrida' : 'Física');
            var numEj = (r.ejercicios && r.ejercicios.length) || 0;
            var val = r.id || r.codigo || String(idx);
            html += `<option value="${val}">${icono} ${r.nombre} [${tipoLabel} · ${numEj} ej.]</option>`;
        });
        html += '</optgroup>';
    }

    sel.innerHTML = html;
    sel.value = '';
}

function alSeleccionarRutinaParaHabito(rutinaId) {
    var inNom = document.getElementById('modal-qd-nombre');
    var inBen = document.getElementById('modal-qd-beneficio');
    var selCat = document.getElementById('modal-qd-categoria');
    var selTipoT = document.getElementById('modal-qd-tipo-tiempo');
    var inMin = document.getElementById('modal-qd-minutos');
    var chkOmit = document.getElementById('modal-qd-es-omitible');

    if (!rutinaId) {
        return;
    }

    var rList = (APP_STATE && APP_STATE.rutinas) ? APP_STATE.rutinas : [];
    var rutina = rList.find(function(r, idx) {
        return r && (r.id === rutinaId || r.codigo === rutinaId || String(idx) === String(rutinaId));
    });

    if (!rutina) return;

    // 1. Título auto-generado
    if (inNom) {
        inNom.value = "Entrenar: " + rutina.nombre;
    }

    // 2. Beneficio
    if (inBen) {
        var tipoTxt = rutina.tipo === 'mental' ? 'cognitivo y agudeza mental' : (rutina.tipo === 'hibrida' ? 'físico-mental integral' : 'fuerza, hipertrofia y sobrecarga biomecánica');
        inBen.value = "Completar sesión '" + rutina.nombre + "' impulsando desarrollo " + tipoTxt + ".";
    }

    // 3. Categoría adecuada
    if (selCat) {
        if (rutina.tipo === 'mental') selCat.value = '🧠 Misión Mental';
        else if (rutina.tipo === 'hibrida') selCat.value = '⚡ Misión / Hábito';
        else selCat.value = '🦾 Entrenamiento Físico';
    }

    // 4. Modo de activación: PROGRAMADA para obligar al usuario a trabajarla a una hora fija con notificación
    if (selTipoT) {
        selTipoT.value = 'programada';
        toggleTipoTiempoQuestModal();
    }

    // 5. Duración calculada en base al volumen de ejercicios
    var numEj = (rutina.ejercicios && rutina.ejercicios.length) || 3;
    var duracionEstimada = Math.max(20, numEj * 10);
    if (inMin) {
        inMin.value = duracionEstimada;
    }

    // 6. Configurar como omitible para poder posponer 1h si está ocupado
    if (chkOmit) {
        chkOmit.checked = true;
        alCambiarOmitibleQuestModal();
    }

    // 7. Auto-vincular atributos desarrollados
    ATRIBUTOS_MODAL_TEMP.quest = [];
    if (rutina.ejercicios && Array.isArray(rutina.ejercicios)) {
        var clavesEncontradas = [];
        rutina.ejercicios.forEach(function(ej) {
            if (ej.esMental) {
                var mId = ej.musculoPrincipal || 'enfoque';
                if (!clavesEncontradas.includes(mId)) clavesEncontradas.push(mId);
            } else {
                var mKeys = typeof mapearTextoAMusculos === 'function' ? mapearTextoAMusculos(ej.categorias || ej.nombre || '') : [];
                mKeys.forEach(function(k) {
                    if (!clavesEncontradas.includes(k)) clavesEncontradas.push(k);
                });
            }
        });

        var agregados = 0;
        clavesEncontradas.forEach(function(clave) {
            if (agregados >= 4) return;
            var attr = CATALOGO_ATRIBUTOS_SISTEMA.find(function(a) { return a.clave === clave; });
            if (attr) {
                ATRIBUTOS_MODAL_TEMP.quest.push({
                    clave: attr.clave,
                    nombre: attr.nombre,
                    tipo: attr.tipo,
                    icono: attr.icono,
                    categoria: attr.categoria,
                    porcentaje: 20
                });
                agregados++;
            }
        });
        renderizarFilasAtributos('quest');
    }
}

function abrirModalNuevaQuestDiaria() {
    solicitarPermisoNotificaciones(false);

    ATRIBUTOS_MODAL_TEMP.quest = [];
    poblarSelectAtributos('quest');
    renderizarFilasAtributos('quest');

    var inNom = document.getElementById('modal-qd-nombre');
    var inBen = document.getElementById('modal-qd-beneficio');
    var inMin = document.getElementById('modal-qd-minutos');
    var inHoraAct = document.getElementById('modal-qd-hora-activacion');
    var inHoraLim = document.getElementById('modal-qd-hora');
    var inExp = document.getElementById('modal-qd-exp');
    var selTipoT = document.getElementById('modal-qd-tipo-tiempo');
    var chkOmit = document.getElementById('modal-qd-es-omitible');

    if (inNom) inNom.value = '';
    if (inBen) inBen.value = '';
    if (selTipoT) selTipoT.value = 'libre';
    if (inHoraAct) inHoraAct.value = '08:00';
    if (inMin) inMin.value = '15';
    if (inHoraLim) inHoraLim.value = '23:59';
    if (inExp) inExp.value = '40';
    if (chkOmit) chkOmit.checked = true;

    poblarSelectRutinasVinculadasModalQuest();
    poblarSelectPenitenciasModalNuevaQuest();
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
    var grpOmit = document.getElementById('grupo-qd-omitible');
    var grpPen = document.getElementById('grupo-qd-penitencia');

    if (!sel) return;
    var val = sel.value;

    if (val === 'libre') {
        if (grpHoraAct) grpHoraAct.style.display = 'none';
        if (grpDur) grpDur.style.display = 'none';
        if (grpHora) grpHora.style.display = 'none';
        if (grpOmit) grpOmit.style.display = 'none';
        if (grpPen) grpPen.style.display = 'none';
    } else if (val === 'programada') {
        if (grpHoraAct) grpHoraAct.style.display = 'block';
        if (grpDur) grpDur.style.display = 'block';
        if (grpHora) grpHora.style.display = 'none';
        if (grpOmit) grpOmit.style.display = 'flex';
        if (grpPen) grpPen.style.display = 'block';
    } else if (val === 'duracion') {
        if (grpHoraAct) grpHoraAct.style.display = 'none';
        if (grpDur) grpDur.style.display = 'block';
        if (grpHora) grpHora.style.display = 'none';
        if (grpOmit) grpOmit.style.display = 'flex';
        if (grpPen) grpPen.style.display = 'block';
    } else if (val === 'hora_limite') {
        if (grpHoraAct) grpHoraAct.style.display = 'none';
        if (grpDur) grpDur.style.display = 'none';
        if (grpHora) grpHora.style.display = 'block';
        if (grpOmit) grpOmit.style.display = 'flex';
        if (grpPen) grpPen.style.display = 'block';
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

function confirmarAgregarQuestDiaria() {
    var inNom = document.getElementById('modal-qd-nombre');
    var inBen = document.getElementById('modal-qd-beneficio');
    var selCat = document.getElementById('modal-qd-categoria');
    var selTipoT = document.getElementById('modal-qd-tipo-tiempo');
    var inHoraAct = document.getElementById('modal-qd-hora-activacion');
    var inMin = document.getElementById('modal-qd-minutos');
    var inHora = document.getElementById('modal-qd-hora');
    var chkOmit = document.getElementById('modal-qd-es-omitible');
    var selPen = document.getElementById('modal-qd-penitencia-select');
    var inExp = document.getElementById('modal-qd-exp');

    var nombre = inNom ? inNom.value.trim() : '';
    if (!nombre) {
        alert("Por favor ingresa un título para el hábito o misión.");
        return;
    }

    var beneficio = inBen ? inBen.value.trim() : '';
    var categoria = selCat ? selCat.value : '⚡ Misión / Hábito';
    var tipoTiempo = selTipoT ? selTipoT.value : 'libre';
    var horaActivacion = inHoraAct ? inHoraAct.value : '08:00';
    var minutos = inMin ? (parseInt(inMin.value, 10) || 15) : 15;
    var horaLimite = inHora ? inHora.value : '23:59';
    var esOmitible = chkOmit ? chkOmit.checked : true;

    // Obtener objeto de penitencia seleccionado
    var penitenciaId = 'sin_penitencia';
    var penitenciaNombre = 'Sin penitencia obligatoria';
    var penitenciaDesc = '';
    var penitenciaExp = 0;
    var penitenciaAtributos = [];

    if (tipoTiempo !== 'libre' && selPen && selPen.value && selPen.value !== 'sin_penitencia') {
        var cat = obtenerCatalogoPenitencias();
        var pObj = cat.find(function(p) { return String(p.id) === String(selPen.value); });
        if (pObj) {
            penitenciaId = pObj.id;
            penitenciaNombre = pObj.nombre;
            penitenciaDesc = pObj.descripcion || '';
            penitenciaExp = Number(pObj.expPenalizacion) || 30;
            penitenciaAtributos = (pObj.atributos && pObj.atributos.length > 0)
                ? JSON.parse(JSON.stringify(pObj.atributos))
                : [];
        }
    }

    var exp = inExp ? (parseInt(inExp.value, 10) || 40) : 40;

    if (!APP_STATE.questsDiarios) APP_STATE.questsDiarios = [];

    // Prevenir duplicados accidentales
    var yaExiste = APP_STATE.questsDiarios.some(function(q) {
        return q && q.titulo && q.titulo.trim().toLowerCase() === nombre.toLowerCase();
    });
    if (yaExiste) {
        if (!confirm("Ya tienes un hábito o misión con el título \"" + nombre + "\".\n¿Deseas agregar otro con el mismo nombre de todas formas?")) {
            return;
        }
    }

    if (APP_STATE._eliminados && Array.isArray(APP_STATE._eliminados.questsDiarios)) {
        APP_STATE._eliminados.questsDiarios = APP_STATE._eliminados.questsDiarios.filter(function(tid) {
            return tid !== "QD-" + nombre.toLowerCase();
        });
    }

    var selRut = document.getElementById('modal-qd-rutina-vinculada');
    var rutinaId = selRut ? selRut.value : '';
    var rutinaNombre = null;
    var rutinaTipo = null;

    if (rutinaId && APP_STATE.rutinas) {
        var rutObj = APP_STATE.rutinas.find(function(r, idx) {
            return r && (r.id === rutinaId || r.codigo === rutinaId || String(idx) === String(rutinaId));
        });
        if (rutObj) {
            rutinaNombre = rutObj.nombre;
            rutinaTipo = rutObj.tipo;
        }
    }

    var listaAtrsQ = (ATRIBUTOS_MODAL_TEMP.quest && ATRIBUTOS_MODAL_TEMP.quest.length > 0)
        ? JSON.parse(JSON.stringify(ATRIBUTOS_MODAL_TEMP.quest))
        : [];

    var nuevaQ = {
        id: "QD-" + Date.now(),
        titulo: nombre,
        beneficio: beneficio,
        categoria: (tipoTiempo === 'libre') ? '⚡ Hábito Libre' : categoria,
        rutinaId: rutinaId || null,
        rutinaNombre: rutinaNombre,
        rutinaTipo: rutinaTipo,
        tipoTiempo: tipoTiempo,
        horaActivacion: horaActivacion,
        tiempoMinutos: minutos,
        horaLimite: horaLimite,
        esOmitible: esOmitible,
        penitenciaId: penitenciaId,
        penitenciaNombre: penitenciaNombre,
        penitenciaDesc: penitenciaDesc,
        penitenciaExp: penitenciaExp,
        penitenciaAtributos: penitenciaAtributos,
        penitencia: penitenciaNombre, // Compatibilidad retroactiva
        exp: exp,
        atributos: listaAtrsQ,
        estado: 'pendiente',
        tiempoRestante: (tipoTiempo === 'libre') ? 0 : minutos * 60,
        temporizadorActivo: false,
        ultimaActivacionFecha: null,
        pospuestaHasta: null,
        timestamp: Date.now(),
        fechaActualizacion: Date.now()
    };

    APP_STATE.questsDiarios.push(nuevaQ);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevaQuestDiaria();
    renderizarQuestsDiarios();
    if (typeof programarAlarmasNativasQuests === 'function') programarAlarmasNativasQuests();

    if (tipoTiempo === 'programada' && 'Notification' in window && Notification.permission !== 'granted') {
        setTimeout(function() {
            solicitarPermisoNotificaciones(false);
        }, 300);
    }
}

// ==========================================================================
// CATÁLOGO & GESTOR DE PENITENCIAS (UNIFICADO Y COMPLETO)
// ==========================================================================

const PENITENCIAS_CATALOGO_DEFAULT = [
    {
        id: "PEN-1",
        nombre: "30 Flexiones Inmediatas",
        descripcion: "Realizar 30 flexiones estrictas sin pausas prolongadas tocando el pecho al piso.",
        expPenalizacion: 30,
        atributos: [
            { id: "c-pecho", nombre: "Pecho y Pectorales", tipo: "cuerpo", porcentaje: 20, icono: "🛡️" },
            { id: "c-triceps", nombre: "Tríceps", tipo: "cuerpo", porcentaje: 15, icono: "🦾" }
        ]
    },
    {
        id: "PEN-2",
        nombre: "50 Flexiones Disciplinarias",
        descripcion: "Realizar 50 flexiones estrictas para forjar tolerancia física y templanza mental.",
        expPenalizacion: 50,
        atributos: [
            { id: "c-pecho", nombre: "Pecho y Pectorales", tipo: "cuerpo", porcentaje: 30, icono: "🛡️" },
            { id: "m-disciplina", nombre: "Disciplina", tipo: "mente", porcentaje: 25, icono: "⚔️" }
        ]
    },
    {
        id: "PEN-3",
        nombre: "1 Minuto de Plancha Estricta",
        descripcion: "Sostener plancha abdominal estricta con abdomen firme y postura recta por 60 segundos.",
        expPenalizacion: 25,
        atributos: [
            { id: "c-core", nombre: "Core / Abdominales", tipo: "cuerpo", porcentaje: 30, icono: "⚡" },
            { id: "m-enfoque", nombre: "Enfoque y Voluntad", tipo: "mente", porcentaje: 20, icono: "🎯" }
        ]
    },
    {
        id: "PEN-4",
        nombre: "Ducha de Agua Fría Obligatoria",
        descripcion: "Tomar una ducha de agua fría completa de mínimo 3 minutos para reiniciar el sistema nervioso.",
        expPenalizacion: 40,
        atributos: [
            { id: "m-disciplina", nombre: "Disciplina y Templanza", tipo: "mente", porcentaje: 35, icono: "🧊" },
            { id: "m-resiliencia", nombre: "Resiliencia Mental", tipo: "mente", porcentaje: 20, icono: "🧠" }
        ]
    },
    {
        id: "PEN-5",
        nombre: "15 Minutos de Limpieza sin Móvil",
        descripcion: "Limpiar y ordenar tu habitación o espacio de trabajo durante 15 minutos sin mirar pantallas.",
        expPenalizacion: 20,
        atributos: [
            { id: "m-orden", nombre: "Claridad y Orden Mental", tipo: "mente", porcentaje: 25, icono: "🧹" }
        ]
    },
    {
        id: "PEN-6",
        nombre: "20 Sentadillas Profundas",
        descripcion: "Realizar 20 sentadillas completas con técnica estricta rompiendo el paralelo.",
        expPenalizacion: 25,
        atributos: [
            { id: "c-cuadriceps", nombre: "Cuádriceps", tipo: "cuerpo", porcentaje: 25, icono: "🦵" },
            { id: "c-gluteos", nombre: "Glúteos y Cadera", tipo: "cuerpo", porcentaje: 15, icono: "🥋" }
        ]
    }
];

function obtenerCatalogoPenitencias() {
    if (!APP_STATE.penitenciasCatalogo || !Array.isArray(APP_STATE.penitenciasCatalogo) || APP_STATE.penitenciasCatalogo.length === 0) {
        APP_STATE.penitenciasCatalogo = JSON.parse(JSON.stringify(PENITENCIAS_CATALOGO_DEFAULT));
        MonarcaDB.save(APP_STATE);
    }
    return APP_STATE.penitenciasCatalogo;
}

function poblarSelectPenitenciasModalNuevaQuest() {
    var sel = document.getElementById('modal-qd-penitencia-select');
    if (!sel) return;

    var cat = obtenerCatalogoPenitencias();
    var html = '<option value="sin_penitencia">🛡️ Sin penitencia obligatoria</option>';

    cat.forEach(function(pen) {
        html += `<option value="${pen.id}">💀 ${pen.nombre} (-${pen.expPenalizacion || 30} EXP)</option>`;
    });

    sel.innerHTML = html;
    if (cat.length > 0) {
        sel.value = cat[0].id;
    } else {
        sel.value = "sin_penitencia";
    }
    alCambiarSelectPenitenciaQuestModal();
}

function alCambiarSelectPenitenciaQuestModal() {
    var sel = document.getElementById('modal-qd-penitencia-select');
    var box = document.getElementById('modal-qd-preview-penitencia');
    var descEl = document.getElementById('modal-qd-preview-pen-desc');
    var metaEl = document.getElementById('modal-qd-preview-pen-meta');

    if (!sel || !box || !descEl || !metaEl) return;

    if (!sel.value || sel.value === 'sin_penitencia') {
        box.style.display = 'none';
        return;
    }

    var cat = obtenerCatalogoPenitencias();
    var pen = cat.find(function(p) { return String(p.id) === String(sel.value); });
    if (!pen) {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'block';
    descEl.innerText = pen.descripcion || 'Sin descripción de instrucciones.';

    var atrsStr = (pen.atributos && pen.atributos.length > 0)
        ? ' · Forja: ' + pen.atributos.map(function(a) { return a.nombre + ' (+' + a.porcentaje + '%)'; }).join(', ')
        : '';
    metaEl.innerText = `Penalización: -${pen.expPenalizacion || 30} EXP de Avatar${atrsStr}`;
}

function abrirModalSettingsPenitencias() {
    var m = document.getElementById('modal-settings-penitencias');
    if (!m) return;

    // Resetear formulario de nueva penitencia
    var inNom = document.getElementById('modal-pen-nombre');
    var inDesc = document.getElementById('modal-pen-descripcion');
    var inExp = document.getElementById('modal-pen-exp');

    if (inNom) inNom.value = '';
    if (inDesc) inDesc.value = '';
    if (inExp) inExp.value = '30';

    ATRIBUTOS_MODAL_TEMP.penitencia = [];
    poblarSelectAtributos('penitencia');
    renderizarFilasAtributos('penitencia');

    renderizarCatalogoPenitenciasSettings();
    m.style.display = 'flex';
}

function cerrarModalSettingsPenitencias() {
    var m = document.getElementById('modal-settings-penitencias');
    if (m) m.style.display = 'none';
    poblarSelectPenitenciasModalNuevaQuest();
}

function confirmarCrearNuevaPenitencia() {
    var inNom = document.getElementById('modal-pen-nombre');
    var inDesc = document.getElementById('modal-pen-descripcion');
    var inExp = document.getElementById('modal-pen-exp');

    var nombre = inNom ? inNom.value.trim() : '';
    if (!nombre) {
        alert("Por favor ingresa un nombre para la penitencia.");
        return;
    }

    var descripcion = inDesc ? inDesc.value.trim() : '';
    var expPenalizacion = inExp ? (parseInt(inExp.value, 10) || 30) : 30;

    var listaAtrs = (ATRIBUTOS_MODAL_TEMP.penitencia && ATRIBUTOS_MODAL_TEMP.penitencia.length > 0)
        ? JSON.parse(JSON.stringify(ATRIBUTOS_MODAL_TEMP.penitencia))
        : [];

    var nuevaPen = {
        id: "PEN-" + Date.now(),
        nombre: nombre,
        descripcion: descripcion || "Completar la acción física disciplinaria con determinación.",
        expPenalizacion: expPenalizacion,
        atributos: listaAtrs
    };

    var cat = obtenerCatalogoPenitencias();
    cat.push(nuevaPen);
    APP_STATE.penitenciasCatalogo = cat;
    MonarcaDB.save(APP_STATE);

    // Limpiar formulario
    if (inNom) inNom.value = '';
    if (inDesc) inDesc.value = '';
    if (inExp) inExp.value = '30';
    ATRIBUTOS_MODAL_TEMP.penitencia = [];
    renderizarFilasAtributos('penitencia');

    renderizarCatalogoPenitenciasSettings();
    poblarSelectPenitenciasModalNuevaQuest();

    alert("✓ ¡Penitencia añadida a tu biblioteca con éxito!");
}

function eliminarPenitenciaCatalogo(id) {
    if (!confirm("¿Deseas eliminar esta penitencia de tu biblioteca?")) return;
    var cat = obtenerCatalogoPenitencias();
    cat = cat.filter(function(p) { return String(p.id) !== String(id); });
    APP_STATE.penitenciasCatalogo = cat;
    MonarcaDB.save(APP_STATE);
    renderizarCatalogoPenitenciasSettings();
    poblarSelectPenitenciasModalNuevaQuest();
}

function renderizarCatalogoPenitenciasSettings() {
    var cont = document.getElementById('settings-lista-penitencias');
    var badgeTotal = document.getElementById('badge-total-penitencias-catalogo');
    if (!cont) return;

    var cat = obtenerCatalogoPenitencias();
    if (badgeTotal) badgeTotal.innerText = cat.length + " registradas";

    if (cat.length === 0) {
        cont.innerHTML = '<div style="color: #64748b; font-size: 12px; text-align: center; padding: 14px;">No tienes penitencias registradas. Crea una arriba.</div>';
        return;
    }

    var html = cat.map(function(pen) {
        var chipsAtrs = (pen.atributos && pen.atributos.length > 0)
            ? `<div class="atributos-chips-container" style="margin-top: 4px;">
                ${pen.atributos.map(function(a) {
                    return `<span class="chip-atributo-impacto ${a.tipo}" style="font-size: 10.5px; padding: 2px 7px;">${a.icono || '⚡'} ${a.nombre} (+${a.porcentaje}%)</span>`;
                }).join('')}
               </div>`
            : '';

        return `
        <div class="card-penitencia-catalogo">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span style="font-size: 14px;">💀</span>
                        <strong style="color: #f8fafc; font-size: 13.5px;">${pen.nombre}</strong>
                        <span class="badge-penitencia-exp">-${pen.expPenalizacion || 30} EXP</span>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; line-height: 1.35;">
                        ${pen.descripcion || 'Sin descripción'}
                    </div>
                    ${chipsAtrs}
                </div>
                <button type="button" onclick="eliminarPenitenciaCatalogo('${pen.id}')" title="Eliminar penitencia" style="background: none; border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 11px; cursor: pointer; padding: 3px 7px; border-radius: 6px;">
                    ✕
                </button>
            </div>
        </div>`;
    }).join('');

    cont.innerHTML = html;
}

// ==========================================================================
// GRÁFICAS DE PRODUCTIVIDAD (HÁBITOS & MISIONES + SKILLS)
// ==========================================================================

var FILTRO_CHART_HABITOS = 'dia';
var FILTRO_CHART_SKILLS = 'dia';
var _CHART_HABITOS_INSTANCE = null;
var _CHART_SKILLS_INSTANCE = null;

function cambiarFiltroChartHabitos(filtro) {
    FILTRO_CHART_HABITOS = filtro;
    ['dia', 'semana', 'mes'].forEach(function(f) {
        var btn = document.getElementById('btn-chart-habitos-' + f);
        if (btn) {
            if (f === filtro) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
    renderizarChartProductividadHabitos(filtro);
}

function cambiarFiltroChartSkills(filtro) {
    FILTRO_CHART_SKILLS = filtro;
    ['dia', 'semana', 'mes'].forEach(function(f) {
        var btn = document.getElementById('btn-chart-skills-' + f);
        if (btn) {
            if (f === filtro) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
    renderizarChartProductividadSkills(filtro);
}

function renderizarChartProductividadHabitos(filtro) {
    var canvas = document.getElementById('chart-habitos-productividad');
    if (!canvas || typeof Chart === 'undefined') return;

    var modo = filtro || FILTRO_CHART_HABITOS || 'dia';
    var now = Date.now();
    var cutoff = 0;

    if (modo === 'dia') {
        var d = new Date();
        d.setHours(0, 0, 0, 0);
        cutoff = d.getTime();
    } else if (modo === 'semana') {
        cutoff = now - (7 * 24 * 60 * 60 * 1000);
    } else if (modo === 'mes') {
        cutoff = now - (30 * 24 * 60 * 60 * 1000);
    }

    var conteo = {};

    // Inicializar con todos los hábitos/misiones configurados en 0
    if (APP_STATE.questsDiarios && Array.isArray(APP_STATE.questsDiarios)) {
        APP_STATE.questsDiarios.forEach(function(q) {
            if (q && q.titulo) conteo[q.titulo] = 0;
        });
    }

    // Sumar eventos del historial registrados en el período
    var eventos = (APP_STATE.historialQuests && Array.isArray(APP_STATE.historialQuests))
        ? APP_STATE.historialQuests.filter(function(e) { return (e.timestamp || 0) >= cutoff; })
        : [];

    if (eventos.length > 0) {
        eventos.forEach(function(e) {
            var t = e.titulo || 'Misión';
            conteo[t] = (conteo[t] || 0) + 1;
        });
    } else {
        // Semillero visual: si no hay historial previo pero hay tareas completadas hoy
        if (APP_STATE.questsDiarios && Array.isArray(APP_STATE.questsDiarios)) {
            APP_STATE.questsDiarios.forEach(function(q) {
                if (q.estado === 'completada' || q.estado === 'penitencia_cumplida') {
                    conteo[q.titulo] = (conteo[q.titulo] || 0) + 1;
                }
            });
        }
    }

    var labels = Object.keys(conteo);
    var data = Object.values(conteo);

    if (labels.length === 0) {
        labels = ['Sin datos registrados'];
        data = [0];
    }

    if (_CHART_HABITOS_INSTANCE) {
        _CHART_HABITOS_INSTANCE.destroy();
        _CHART_HABITOS_INSTANCE = null;
    }

    var ctx = canvas.getContext('2d');
    _CHART_HABITOS_INSTANCE = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Acciones Cumplidas',
                data: data,
                backgroundColor: 'rgba(16, 185, 129, 0.45)',
                borderColor: '#10b981',
                borderWidth: 2,
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(c) {
                            return ' ' + c.raw + ' completada' + (c.raw === 1 ? '' : 's');
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        stepSize: 1,
                        font: { size: 11 }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.06)' }
                },
                y: {
                    ticks: {
                        color: '#f8fafc',
                        font: { size: 11, weight: '600' }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderizarChartProductividadSkills(filtro) {
    var canvas = document.getElementById('chart-skills-productividad');
    if (!canvas || typeof Chart === 'undefined') return;

    var modo = filtro || FILTRO_CHART_SKILLS || 'dia';
    var now = Date.now();
    var cutoff = 0;

    if (modo === 'dia') {
        var d = new Date();
        d.setHours(0, 0, 0, 0);
        cutoff = d.getTime();
    } else if (modo === 'semana') {
        cutoff = now - (7 * 24 * 60 * 60 * 1000);
    } else if (modo === 'mes') {
        cutoff = now - (30 * 24 * 60 * 60 * 1000);
    }

    var conteoHoras = {};

    // Inicializar con todas las habilidades en 0
    if (APP_STATE.habilidades && Array.isArray(APP_STATE.habilidades)) {
        APP_STATE.habilidades.forEach(function(s) {
            if (s && s.nombre) conteoHoras[s.nombre] = 0;
        });
    }

    var eventos = (APP_STATE.historialSkills && Array.isArray(APP_STATE.historialSkills))
        ? APP_STATE.historialSkills.filter(function(e) { return (e.timestamp || 0) >= cutoff; })
        : [];

    if (eventos.length > 0) {
        eventos.forEach(function(e) {
            var n = e.nombre || 'Skill';
            conteoHoras[n] = (conteoHoras[n] || 0) + (Number(e.horas) || 1);
        });
    } else {
        // Si no hay eventos históricos específicos en este rango, reflejar las horas de las habilidades
        if (APP_STATE.habilidades && Array.isArray(APP_STATE.habilidades)) {
            APP_STATE.habilidades.forEach(function(s) {
                conteoHoras[s.nombre] = Number(s.horasTotales) || 0;
            });
        }
    }

    var labels = Object.keys(conteoHoras);
    var data = Object.values(conteoHoras);

    if (labels.length === 0) {
        labels = ['Sin habilidades registradas'];
        data = [0];
    }

    if (_CHART_SKILLS_INSTANCE) {
        _CHART_SKILLS_INSTANCE.destroy();
        _CHART_SKILLS_INSTANCE = null;
    }

    var ctx = canvas.getContext('2d');
    _CHART_SKILLS_INSTANCE = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas Trabajadas',
                data: data,
                backgroundColor: 'rgba(139, 92, 246, 0.45)',
                borderColor: '#a78bfa',
                borderWidth: 2,
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(c) {
                            return ' ' + c.raw + ' hr' + (c.raw === 1 ? '' : 's') + ' practicadas';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11 }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.06)' }
                },
                y: {
                    ticks: {
                        color: '#f8fafc',
                        font: { size: 11, weight: '600' }
                    },
                    grid: { display: false }
                }
            }
        }
    });
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

    if (!tabId || tabId === 'conocimiento' || tabId === 'quests') tabId = 'habitos';
    window.TAB_ACCIONES_DESARROLLO_ACTIVA = tabId;

    var tabs = ['habitos', 'skills'];
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
        case 'habitos':
            cargarQuestsDiarios();
            setTimeout(function() {
                if (typeof renderizarChartProductividadHabitos === 'function') {
                    renderizarChartProductividadHabitos(FILTRO_CHART_HABITOS);
                }
            }, 80);
            break;
        case 'skills':
            cargarHabilidades();
            setTimeout(function() {
                if (typeof renderizarChartProductividadSkills === 'function') {
                    renderizarChartProductividadSkills(FILTRO_CHART_SKILLS);
                }
            }, 80);
            break;
    }
}

function renderizarProtocolosDeepWork() {
    var cont = document.getElementById('contenedor-protocolos-deepwork');
    if (!cont) return;

    var html = '';
    PROTOCOLOS_DEEP_WORK.forEach(function(p) {
        var fatigaTag = p.fatigaImpacto > 0 ? `+${p.fatigaImpacto}% Fatiga` : `${p.fatigaImpacto}% Alivio`;
        var fatigaBg = p.fatigaImpacto > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
        var fatigaColor = p.fatigaImpacto > 0 ? '#f87171' : '#34d399';

        html += `
        <div style="background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px;">${p.icono}</span>
                        <strong style="font-size: 14px; color: #f8fafc;">${p.nombre}</strong>
                    </div>
                    <span style="font-size: 11px; font-weight: 700; color: #cbd5e1; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); padding: 2px 8px; border-radius: 6px;">${p.duracion}</span>
                </div>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8; line-height: 1.4;">${p.descripcion}</p>
            </div>
            <div>
                <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 10px; margin-top: 6px;">
                    <div style="display: flex; gap: 6px;">
                        <span style="font-size: 10.5px; font-weight: 700; background: ${fatigaBg}; color: ${fatigaColor}; border: 1px solid rgba(255, 255, 255, 0.08); padding: 2px 6px; border-radius: 9999px;">${fatigaTag}</span>
                        <span style="font-size: 10.5px; font-weight: 700; background: rgba(255, 255, 255, 0.08); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 9999px;">+${p.exp} EXP</span>
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


// Solicitud automática de permisos nativos al abrir en Android APK
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
                var ln = window.Capacitor.Plugins.LocalNotifications;
                ln.checkPermissions().then(function(perm) {
                    if (perm.display !== 'granted') {
                        return ln.requestPermissions();
                    }
                    return perm;
                }).then(function(res) {
                    actualizarBotonNotificacionesUI();
                    if (res && res.display === 'granted') {
                        programarAlarmasNativasQuests();
                    }
                }).catch(function(err) {
                    console.warn("[AutoPermisos Android]", err);
                });
            }
        }, 1000);
    });
}
