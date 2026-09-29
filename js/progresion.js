/**
 * SISTEMA MONARCA · MÓDULO DE ACCIONES Y PROGRESIÓN
 * Misiones Diarias & Hábitos, Árbol de Habilidades con Rangos (E a SSS).
 */

function cargarMisiones() {
    renderizarMisiones(APP_STATE.misiones);
}

function abrirModalNuevaMision() {
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

    var nuevaMision = {
        id: "MIS-" + Date.now(),
        nombre: nom,
        frecuencia: freq,
        atributo: atr,
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
                        <span style="color: #10b981; font-weight: 700;">+${m.exp} EXP (${m.atributo || 'EXP'})</span>
                        <span style="color: #d1d5db;">|</span>
                        <span>Estado: <strong style="${esCompletado ? 'color:#10b981;' : 'color:#d97706;'}">${esCompletado ? 'Completada' : 'Pendiente'}</strong></span>
                    </div>
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
            } else {
                m.estado = "Completado";
                sumarExp(m.exp || 25);
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

    var nuevaHabilidad = {
        id: "SKILL-" + Date.now(),
        nombre: nom,
        beneficio: ben || "Incremento de destreza y capacidad técnica",
        horasTotales: hrsClamped
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

            // Recompensa de EXP
            sumarExp(10);

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

// 6. ESTADO PERSONAL Y MAPA DE CALOR CORPORAL ANATÓMICO
// ==========================================================================
