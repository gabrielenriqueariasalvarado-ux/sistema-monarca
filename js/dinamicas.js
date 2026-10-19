/**
 * SISTEMA MONARCA · MÓDULO DE DINÁMICAS SEMANALES, LABORES Y AGENDA DE PERSONAS
 * 1. Gestión y Categorización de Labores (Dev, Personal Trainer, Barbero, etc.)
 * 2. Directorio de Personas, Agenda de Conversaciones y Categorías de Ubicación
 * 3. Ruleta de Variabilidad Semanal (Comidas, Vestimenta y Selección de Música)
 */

// ==========================================================================
// 1. GESTIÓN Y CATEGORIZACIÓN DE LABORES
// ==========================================================================

var FILTRO_LABOR_ACTIVA = "TODAS";

function cargarLabores() {
    renderizarLabores();
}

function renderizarLabores() {
    var contEstadisticas = document.getElementById('contenedor-estadisticas-labores');
    var contCategorias = document.getElementById('contenedor-categorias-labores');
    var contRegistros = document.getElementById('contenedor-registros-labores');
    if (!contEstadisticas && !contCategorias && !contRegistros) return;

    if (!APP_STATE.categoriasLabores || !Array.isArray(APP_STATE.categoriasLabores)) {
        APP_STATE.categoriasLabores = JSON.parse(JSON.stringify(DEFAULT_STATE.categoriasLabores || []));
    }
    if (!APP_STATE.registrosLabores || !Array.isArray(APP_STATE.registrosLabores)) {
        APP_STATE.registrosLabores = [];
    }

    var categorias = APP_STATE.categoriasLabores;
    var registros = APP_STATE.registrosLabores;

    // Calcular totales de horas
    var totalHoras = 0;
    var totalHonorarios = 0;
    var horasPorLabor = {};
    categorias.forEach(function(c) { horasPorLabor[c.id] = 0; });

    registros.forEach(function(r) {
        var h = Number(r.horas) || 0;
        totalHoras += h;
        totalHonorarios += (Number(r.honorarios) || 0);
        if (horasPorLabor[r.laborId] !== undefined) {
            horasPorLabor[r.laborId] += h;
        } else {
            horasPorLabor[r.laborId] = h;
        }
    });

    // 1. Estadísticas Globales
    if (contEstadisticas) {
        contEstadisticas.innerHTML = `
        <div class="operatividad-metrics-grid" style="margin-bottom: 20px;">
            <div class="metric-card-ideas">
                <div class="metric-num" style="color: #111827;">${totalHoras.toFixed(1)}h</div>
                <div class="metric-title">Horas Totales Dedicadas</div>
            </div>
            <div class="metric-card-ideas">
                <div class="metric-num" style="color: #111827;">${registros.length}</div>
                <div class="metric-title">Sesiones de Labor Registradas</div>
            </div>
            <div class="metric-card-ideas">
                <div class="metric-num" style="color: #059669;">$${totalHonorarios}</div>
                <div class="metric-title">Honorarios / Rendimiento</div>
            </div>
        </div>`;
    }

    // 2. Desglose de Categorías de Labores
    if (contCategorias) {
        var htmlCat = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-bottom: 20px;">`;

        categorias.forEach(function(cat) {
            var hDed = horasPorLabor[cat.id] || 0;
            var pct = totalHoras > 0 ? Math.round((hDed / totalHoras) * 100) : 0;

            htmlCat += `
            <div class="card" style="margin: 0; padding: 14px 16px; border: 1px solid #e5e7eb; border-left: 4px solid ${cat.color || '#111827'};">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 22px;">${cat.icono || '💼'}</span>
                        <strong style="font-size: 14px; color: #111827;">${cat.nombre}</strong>
                    </div>
                    <span class="item-badge-pill" style="font-weight: 800; background: #f3f4f6; color: #111827;">${hDed.toFixed(1)} hrs</span>
                </div>
                <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #6b7280; line-height: 1.4;">${cat.descripcion}</p>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #4b5563; font-weight: 700; margin-bottom: 3px;">
                    <span>Dedicación</span>
                    <span>${pct}% del total</span>
                </div>
                <div class="attr-progress-track" style="height: 6px;">
                    <div class="attr-progress-fill" style="width: ${pct}%; background: ${cat.color || '#111827'};"></div>
                </div>
            </div>`;
        });

        htmlCat += `</div>`;
        contCategorias.innerHTML = htmlCat;
    }

    // 3. Historial de Jornadas / Sesiones de Labor
    if (contRegistros) {
        if (registros.length === 0) {
            contRegistros.innerHTML = '<p style="color:#6b7280; text-align:center; padding:16px; background:#f9fafb; border-radius:10px;">No has registrado jornadas de labor aún. Presiona "+ Registrar Sesión de Labor".</p>';
            return;
        }

        var htmlReg = '<div style="display: flex; flex-direction: column; gap: 8px;">';
        registros.forEach(function(r) {
            var catInfo = categorias.find(function(c) { return c.id === r.laborId; }) || { nombre: "Labor", icono: "💼", color: "#111827" };
            htmlReg += `
            <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <span style="font-size: 24px;">${catInfo.icono}</span>
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                            <strong style="color: #111827; font-size: 13.5px;">${catInfo.nombre}</strong>
                            <span class="item-badge-pill" style="font-size: 11px; background: #f3f4f6; color: #374151;">⏱️ ${r.horas}h</span>
                            ${r.honorarios ? `<span class="item-badge-pill" style="font-size: 11px; background: #ecfdf5; color: #059669; font-weight: 700;">+$${r.honorarios}</span>` : ''}
                        </div>
                        <p style="margin: 0; font-size: 12.5px; color: #4b5563;">${r.descripcion}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 11.5px; color: #9ca3af;">${r.fecha}</span>
                    <button onclick="eliminarRegistroLabor('${r.id}')" title="Eliminar sesión" style="background:none; border:none; color:#9ca3af; cursor:pointer; padding:4px 6px; font-size:13px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#9ca3af'">🗑️</button>
                </div>
            </div>`;
        });
        htmlReg += '</div>';
        contRegistros.innerHTML = htmlReg;
    }
}

function abrirModalNuevaLabor() {
    var m = document.getElementById('modal-nueva-categoria-labor');
    if (m) m.style.display = 'flex';
}
function cerrarModalNuevaLabor() {
    var m = document.getElementById('modal-nueva-categoria-labor');
    if (m) m.style.display = 'none';
}
function guardarNuevaLabor() {
    var inNom = document.getElementById('input-lab-nombre');
    var inIco = document.getElementById('input-lab-icono');
    var inDesc = document.getElementById('input-lab-desc');
    var inCol = document.getElementById('input-lab-color');

    var nom = inNom ? inNom.value.trim() : '';
    var ico = inIco ? inIco.value.trim() : '💼';
    var desc = inDesc ? inDesc.value.trim() : '';
    var col = inCol ? inCol.value : '#111827';

    if (!nom) { alert("Ingresa el nombre de la labor u oficio."); if (inNom) inNom.focus(); return; }

    if (!APP_STATE.categoriasLabores) APP_STATE.categoriasLabores = [];
    var nuevo = {
        id: "LAB-" + Date.now(),
        nombre: nom,
        icono: ico || '💼',
        descripcion: desc || "Actividad laboral del avatar.",
        color: col
    };
    APP_STATE.categoriasLabores.push(nuevo);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevaLabor();
    renderizarLabores();
    actualizarSelectsLabores();
    alert("💼 Nueva categoría de labor agregada exitosamente.");
}

function abrirModalRegistroJornada() {
    var m = document.getElementById('modal-registro-jornada-labor');
    if (!m) return;
    actualizarSelectsLabores();
    m.style.display = 'flex';
}
function cerrarModalRegistroJornada() {
    var m = document.getElementById('modal-registro-jornada-labor');
    if (m) m.style.display = 'none';
}
function actualizarSelectsLabores() {
    var sel = document.getElementById('select-reg-labor-id');
    if (!sel) return;
    var cats = APP_STATE.categoriasLabores || [];
    sel.innerHTML = '';
    cats.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.innerText = (c.icono || '💼') + ' ' + c.nombre;
        sel.appendChild(opt);
    });
}

function guardarRegistroJornada() {
    var inLab = document.getElementById('select-reg-labor-id');
    var inHor = document.getElementById('input-reg-labor-horas');
    var inDesc = document.getElementById('input-reg-labor-desc');
    var inHon = document.getElementById('input-reg-labor-honorarios');

    var laborId = inLab ? inLab.value : '';
    var horas = inHor ? (Number(inHor.value) || 0) : 0;
    var desc = inDesc ? inDesc.value.trim() : '';
    var hon = inHon ? (Number(inHon.value) || 0) : 0;

    if (!laborId) { alert("Selecciona una labor."); return; }
    if (horas <= 0) { alert("Ingresa las horas dedicadas (mínimo 0.5)."); if (inHor) inHor.focus(); return; }
    if (!desc) { alert("Ingresa una breve descripción de lo realizado."); if (inDesc) inDesc.focus(); return; }

    if (!APP_STATE.registrosLabores) APP_STATE.registrosLabores = [];
    var nuevo = {
        id: "REG-LAB-" + Date.now(),
        laborId: laborId,
        fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        horas: horas,
        descripcion: desc,
        honorarios: hon,
        timestamp: Date.now()
    };

    APP_STATE.registrosLabores.unshift(nuevo);
    sumarExp(Math.round(horas * 10));
    MonarcaDB.save(APP_STATE);

    cerrarModalRegistroJornada();
    renderizarLabores();
    alert("💼 Jornada de labor registrada con éxito (+ " + Math.round(horas * 10) + " EXP).");
}

function eliminarRegistroLabor(id) {
    if (!confirm("¿Deseas eliminar este registro de labor?")) return;
    if (!APP_STATE.registrosLabores) return;
    APP_STATE.registrosLabores = APP_STATE.registrosLabores.filter(function(r) { return r.id !== id; });
    MonarcaDB.save(APP_STATE);
    renderizarLabores();
}


// ==========================================================================
// 2. DIRECTORIO DE PERSONAS & AGENDA DE CONVERSACIONES CON UBICACIONES
// ==========================================================================

var FILTRO_UBICACION_PERSONAS = "TODAS";

function cargarAgendaPersonas() {
    renderizarAgendaPersonas();
}

function filtrarPersonasPorUbicacion(ubicacion, btn) {
    FILTRO_UBICACION_PERSONAS = ubicacion;
    var btns = document.querySelectorAll('.btn-tab-ubi');
    btns.forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderizarAgendaPersonas();
}

function renderizarAgendaPersonas() {
    var cont = document.getElementById('contenedor-agenda-personas-grid');
    var bannerResumen = document.getElementById('contenedor-resumen-personas');
    if (!cont && !bannerResumen) return;

    if (!APP_STATE.agendaPersonas || !Array.isArray(APP_STATE.agendaPersonas)) {
        APP_STATE.agendaPersonas = [];
    }
    var personas = APP_STATE.agendaPersonas;

    // Métricas
    var totalTemas = 0;
    var temasResueltos = 0;
    personas.forEach(function(p) {
        (p.temasPendientes || []).forEach(function(t) {
            totalTemas++;
            if (t.hecho) temasResueltos++;
        });
    });

    if (bannerResumen) {
        bannerResumen.innerHTML = `
        <div class="weekly-review-banner">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
                <div>
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Gestión de Relaciones & Contactos</div>
                    <h3 style="margin: 2px 0 0 0; font-size: 16px; font-weight: 800; color: #111827;">Directorio de Conversaciones Pendientes</h3>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="item-badge-pill" style="font-weight: 800; background: #111827; color: #ffffff;">${personas.length} Contactos</span>
                    <span class="item-badge-pill" style="font-weight: 800; background: #f3f4f6; color: #111827;">${temasResueltos}/${totalTemas} Temas Tratados</span>
                </div>
            </div>
            <p style="margin: 0; font-size: 12.5px; color: #4b5563;">
                Ten claridad de los temas a tratar con cada persona y planifica el lugar proyectado donde las encontrarás (barbería, gimnasio, café o llamada).
            </p>
        </div>`;
    }

    if (!cont) return;

    var filtradas = personas;
    if (FILTRO_UBICACION_PERSONAS !== "TODAS") {
        filtradas = personas.filter(function(p) {
            return p.ubicacionCategoria === FILTRO_UBICACION_PERSONAS;
        });
    }

    if (filtradas.length === 0) {
        cont.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 28px 16px; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px;">
            <p style="margin: 0; color: #6b7280; font-size: 13.5px;">No hay personas registradas con esta ubicación proyectada.</p>
            <button class="btn-system" style="margin-top: 12px; font-size: 12.5px;" onclick="abrirModalNuevaPersona()">+ Agregar Contacto y Temas</button>
        </div>`;
        return;
    }

    var html = '';
    filtradas.forEach(function(p) {
        var temasHtml = (p.temasPendientes || []).map(function(t) {
            var checkState = t.hecho ? 'checked' : '';
            var textStyle = t.hecho ? 'text-decoration: line-through; color: #9ca3af;' : 'color: #1f2937;';
            return `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 0; border-bottom: 1px dashed #f3f4f6;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12.5px; ${textStyle}">
                    <input type="checkbox" ${checkState} onchange="toggleTemaPersona('${p.id}', '${t.id}')" style="cursor: pointer; width: 15px; height: 15px; accent-color: #111827;">
                    <span>${t.texto}</span>
                </label>
                <button onclick="eliminarTemaPersona('${p.id}', '${t.id}')" title="Quitar tema" style="background:none; border:none; color:#d1d5db; cursor:pointer; font-size:12px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#d1d5db'">✕</button>
            </div>`;
        }).join('');

        var estadoColor = p.estado === 'Conversado' ? '#059669' : (p.estado === 'Agendado' ? '#2563eb' : '#4b5563');
        var estadoBg = p.estado === 'Conversado' ? '#ecfdf5' : (p.estado === 'Agendado' ? '#eff6ff' : '#f3f4f6');

        html += `
        <div class="knowledge-card">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
                <div>
                    <span class="knowledge-area-tag" style="background: #111827; color: #ffffff;">${p.ubicacionCategoria || '📍 Ubicación'}</span>
                    <h4 class="knowledge-title">${p.nombre}</h4>
                    <span style="font-size: 11.5px; color: #6b7280; font-weight: 600;">${p.rol || 'Contacto'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button onclick="eliminarPersonaAgenda('${p.id}')" title="Eliminar persona" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 2px 6px; font-size: 13px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#9ca3af'">🗑️</button>
                </div>
            </div>

            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; margin-bottom: 10px; font-size: 12px; color: #374151;">
                <strong>📍 Lugar Proyectado:</strong> ${p.lugarProyectado || 'Por definir'}
                ${p.fechaObjetivo ? ` · <span style="color: #6b7280;">📅 ${p.fechaObjetivo}</span>` : ''}
            </div>

            <div style="margin-bottom: 12px; flex-grow: 1;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6b7280; margin-bottom: 6px;">
                    Temas a Tratar (${(p.temasPendientes || []).filter(function(t){ return !t.hecho; }).length} pendientes):
                </div>
                <div style="display: flex; flex-direction: column; gap: 3px; max-height: 140px; overflow-y: auto;">
                    ${temasHtml || '<span style="font-size: 12px; color: #9ca3af;">Sin temas anotados.</span>'}
                </div>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <input type="text" id="input-nuevo-tema-${p.id}" placeholder="+ Agregar tema..." class="finanzas-input-clean" style="padding: 5px 10px; font-size: 12px; width: 100%; border-radius: 8px;" onkeydown="if(event.key==='Enter'){agregarTemaDirecto('${p.id}');}">
                    <button class="btn-sheet-action" style="padding: 4px 10px; font-size: 12px;" onclick="agregarTemaDirecto('${p.id}')">OK</button>
                </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f3f4f6; padding-top: 10px; flex-wrap: wrap; gap: 8px;">
                <span class="item-badge-pill" style="background: ${estadoBg}; color: ${estadoColor}; font-weight: 700; font-size: 11px;">
                    ${p.estado || 'Pendiente'}
                </span>
                <div style="display: flex; gap: 4px;">
                    <button class="btn-sheet-action" style="font-size: 11px; padding: 4px 8px;" onclick="cambiarEstadoPersona('${p.id}', 'Agendado')">📅 Agendar</button>
                    <button class="btn-sheet-action" style="font-size: 11px; padding: 4px 8px; background: #ecfdf5; color: #059669; border-color: #a7f3d0;" onclick="cambiarEstadoPersona('${p.id}', 'Conversado')">✓ Conversado</button>
                </div>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function toggleTemaPersona(personaId, temaId) {
    var p = (APP_STATE.agendaPersonas || []).find(function(item) { return item.id === personaId; });
    if (!p) return;
    var t = (p.temasPendientes || []).find(function(item) { return item.id === temaId; });
    if (!t) return;
    t.hecho = !t.hecho;
    if (t.hecho) sumarExp(5);
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
}

function agregarTemaDirecto(personaId) {
    var inTema = document.getElementById('input-nuevo-tema-' + personaId);
    if (!inTema) return;
    var texto = inTema.value.trim();
    if (!texto) return;

    var p = (APP_STATE.agendaPersonas || []).find(function(item) { return item.id === personaId; });
    if (!p) return;
    if (!p.temasPendientes) p.temasPendientes = [];
    p.temasPendientes.push({
        id: "T-" + Date.now(),
        texto: texto,
        hecho: false
    });
    MonarcaDB.save(APP_STATE);
    inTema.value = '';
    renderizarAgendaPersonas();
}

function eliminarTemaPersona(personaId, temaId) {
    var p = (APP_STATE.agendaPersonas || []).find(function(item) { return item.id === personaId; });
    if (!p || !p.temasPendientes) return;
    p.temasPendientes = p.temasPendientes.filter(function(t) { return t.id !== temaId; });
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
}

function cambiarEstadoPersona(personaId, nuevoEstado) {
    var p = (APP_STATE.agendaPersonas || []).find(function(item) { return item.id === personaId; });
    if (!p) return;
    p.estado = nuevoEstado;
    if (nuevoEstado === 'Conversado') sumarExp(20);
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
}

function eliminarPersonaAgenda(id) {
    if (!confirm("¿Deseas eliminar este contacto de la agenda?")) return;
    if (!APP_STATE.agendaPersonas) return;
    APP_STATE.agendaPersonas = APP_STATE.agendaPersonas.filter(function(p) { return p.id !== id; });
    MonarcaDB.save(APP_STATE);
    renderizarAgendaPersonas();
}

function abrirModalNuevaPersona() {
    var m = document.getElementById('modal-nueva-persona');
    if (m) m.style.display = 'flex';
}
function cerrarModalNuevaPersona() {
    var m = document.getElementById('modal-nueva-persona');
    if (m) m.style.display = 'none';
}
function guardarNuevaPersona() {
    var inNom = document.getElementById('input-per-nombre');
    var inRol = document.getElementById('input-per-rol');
    var inUbi = document.getElementById('input-per-ubicacion');
    var inLug = document.getElementById('input-per-lugar');
    var inTem = document.getElementById('input-per-temas');
    var inFec = document.getElementById('input-per-fecha');

    var nom = inNom ? inNom.value.trim() : '';
    var rol = inRol ? inRol.value.trim() : 'Contacto';
    var ubi = inUbi ? inUbi.value : '💈 Barbería';
    var lug = inLug ? inLug.value.trim() : '';
    var rawTemas = inTem ? inTem.value.trim() : '';
    var fec = inFec ? inFec.value.trim() : 'Esta semana';

    if (!nom) { alert("Ingresa el nombre de la persona."); if (inNom) inNom.focus(); return; }

    var temasList = [];
    if (rawTemas) {
        rawTemas.split('\n').forEach(function(line) {
            var t = line.trim();
            if (t) temasList.push({ id: "T-" + Math.random().toString(36).substr(2, 9), texto: t, hecho: false });
        });
    }

    if (!APP_STATE.agendaPersonas) APP_STATE.agendaPersonas = [];
    var nuevo = {
        id: "PER-" + Date.now(),
        nombre: nom,
        rol: rol,
        ubicacionCategoria: ubi,
        lugarProyectado: lug || ubi,
        temasPendientes: temasList,
        fechaObjetivo: fec,
        estado: "Pendiente",
        timestamp: Date.now()
    };

    APP_STATE.agendaPersonas.unshift(nuevo);
    sumarExp(15);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevaPersona();
    renderizarAgendaPersonas();
    alert("👥 Contacto '" + nom + "' agregado a la agenda con sus temas pendientes.");
}


// ==========================================================================
// 3. RULETA DE VARIABILIDAD SEMANAL (COMIDAS, VESTIMENTA Y MÚSICA)
// ==========================================================================

var RULETA_EN_GIRO = false;
var CATEGORIA_RULETA_ACTIVA = "comidas";

function cargarRuletaSemanal() {
    renderizarRuletaSemanal();
}

function renderizarRuletaSemanal() {
    var contResultado = document.getElementById('contenedor-resultado-ruleta');
    var contOpciones = document.getElementById('contenedor-opciones-ruleta');
    if (!contResultado && !contOpciones) return;

    if (!APP_STATE.ruletaSemanal) {
        APP_STATE.ruletaSemanal = JSON.parse(JSON.stringify(DEFAULT_STATE.ruletaSemanal));
    }
    var rs = APP_STATE.ruletaSemanal;

    // 1. Banner de Selección Activa de Variabilidad
    if (contResultado) {
        var act = rs.seleccionActiva || {};
        var com = act.comida || "Sin girar aún";
        var ves = act.vestimenta || "Sin girar aún";
        var mus = act.musica || "Sin girar aún";
        var fec = act.fechaGiro || "Hoy";

        contResultado.innerHTML = `
        <div class="weekly-review-banner" style="border-left-color: #111827;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                <div>
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Protocolo Anti-Monotonía</div>
                    <h3 style="margin: 2px 0 0 0; font-size: 17px; font-weight: 800; color: #111827;">Selección Activa de Variabilidad</h3>
                </div>
                <button class="btn-system" onclick="girarRuletaCompleta()" style="font-size: 12.5px; padding: 7px 14px;">
                    🎲 Giro Completo Diario
                </button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 10px;">
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px;">
                    <div style="font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase;">🍲 Comida Elegida</div>
                    <div style="font-size: 13.5px; font-weight: 700; color: #111827; margin: 4px 0;">${com}</div>
                    <button class="btn-sheet-action" style="font-size: 11px; padding: 3px 8px; margin-top: 4px;" onclick="girarRuletaIndividual('comidas')">🔄 Girar Comida</button>
                </div>
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px;">
                    <div style="font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase;">👔 Outfit del Día</div>
                    <div style="font-size: 13.5px; font-weight: 700; color: #111827; margin: 4px 0;">${ves}</div>
                    <button class="btn-sheet-action" style="font-size: 11px; padding: 3px 8px; margin-top: 4px;" onclick="girarRuletaIndividual('vestimenta')">🔄 Girar Outfit</button>
                </div>
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px;">
                    <div style="font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase;">🎵 Música / Foco</div>
                    <div style="font-size: 13.5px; font-weight: 700; color: #111827; margin: 4px 0;">${mus}</div>
                    <button class="btn-sheet-action" style="font-size: 11px; padding: 3px 8px; margin-top: 4px;" onclick="girarRuletaIndividual('musica')">🔄 Girar Música</button>
                </div>
            </div>
            <div style="font-size: 11px; color: #9ca3af; margin-top: 10px; text-align: right;">Último giro: ${fec}</div>
        </div>`;
    }

    // 2. Visualizador de la Ruleta (Canvas o Ruleta Animada)
    dibujarRuletaEnCanvas();

    // 3. Banco de Opciones por Categoría
    if (contOpciones) {
        var items = rs[CATEGORIA_RULETA_ACTIVA] || [];
        var htmlOps = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; gap: 6px;">
                <button class="btn-tab-con-area ${CATEGORIA_RULETA_ACTIVA === 'comidas' ? 'active' : ''}" onclick="cambiarTabBancoRuleta('comidas')">🍲 Comidas (${(rs.comidas||[]).length})</button>
                <button class="btn-tab-con-area ${CATEGORIA_RULETA_ACTIVA === 'vestimenta' ? 'active' : ''}" onclick="cambiarTabBancoRuleta('vestimenta')">👔 Vestimenta (${(rs.vestimenta||[]).length})</button>
                <button class="btn-tab-con-area ${CATEGORIA_RULETA_ACTIVA === 'musica' ? 'active' : ''}" onclick="cambiarTabBancoRuleta('musica')">🎵 Música (${(rs.musica||[]).length})</button>
            </div>
            <button class="btn-sheet-action" onclick="abrirModalNuevaOpcionRuleta()">+ Agregar Opción</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px;">`;

        if (items.length === 0) {
            htmlOps += `
            <div style="grid-column: 1 / -1; text-align: center; padding: 26px 16px; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 10px;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">No hay opciones registradas en esta categoría aún.</p>
                <button class="btn-sheet-action" onclick="abrirModalNuevaOpcionRuleta()">+ Agregar tu primera opción</button>
            </div>`;
        } else {
            items.forEach(function(item) {
                var subtag = item.tipo || item.estilo || item.genero || 'Variabilidad';
                htmlOps += `
                <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                    <div>
                        <strong style="font-size: 13px; color: #111827; display: block;">${item.nombre}</strong>
                        <span style="font-size: 11px; color: #6b7280;">${subtag}</span>
                    </div>
                    <button onclick="eliminarOpcionRuleta('${CATEGORIA_RULETA_ACTIVA}', '${item.id}')" title="Eliminar opción" style="background:none; border:none; color:#9ca3af; cursor:pointer; font-size:13px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#9ca3af'">✕</button>
                </div>`;
            });
        }

        htmlOps += `</div>`;
        contOpciones.innerHTML = htmlOps;
    }
}

function cambiarTabBancoRuleta(cat) {
    CATEGORIA_RULETA_ACTIVA = cat;
    renderizarRuletaSemanal();
}

var ANGULO_ACTUAL_RULETA = 0;

function dibujarRuletaEnCanvas() {
    var canvas = document.getElementById('canvas-ruleta');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var rs = APP_STATE.ruletaSemanal || DEFAULT_STATE.ruletaSemanal;
    var items = rs[CATEGORIA_RULETA_ACTIVA] || [];

    var width = canvas.width;
    var height = canvas.height;
    var cx = width / 2;
    var cy = height / 2;
    var radio = Math.min(cx, cy) - 10;

    ctx.clearRect(0, 0, width, height);

    if (items.length === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radio, 0, 2 * Math.PI);
        ctx.fillStyle = '#f9fafb';
        ctx.fill();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Sin opciones aún', cx, cy);
        return;
    }
    var numSectores = items.length;
    var arc = (2 * Math.PI) / numSectores;

    ctx.clearRect(0, 0, width, height);

    var colores = ['#111827', '#1f2937', '#374151', '#4b5563', '#6b7280', '#0f172a', '#1e293b', '#334155'];

    for (var i = 0; i < numSectores; i++) {
        var anguloInicio = ANGULO_ACTUAL_RULETA + i * arc;
        var anguloFin = anguloInicio + arc;

        ctx.beginPath();
        ctx.fillStyle = colores[i % colores.length];
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radio, anguloInicio, anguloFin);
        ctx.lineTo(cx, cy);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(anguloInicio + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
        var textoCorto = items[i].nombre.length > 20 ? items[i].nombre.substr(0, 18) + '...' : items[i].nombre;
        ctx.fillText(textoCorto, radio - 16, 4);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#111827';
    ctx.fill();
}

function animarGiroRuleta(items, callback) {
    if (RULETA_EN_GIRO) return;
    RULETA_EN_GIRO = true;

    var numSectores = items.length;
    var indexGanador = Math.floor(Math.random() * numSectores);
    var arc = (2 * Math.PI) / numSectores;

    var vueltasExtra = 5 + Math.floor(Math.random() * 3);
    var anguloObjetivo = vueltasExtra * 2 * Math.PI + (2 * Math.PI - (indexGanador * arc + arc / 2));

    var duracion = 3200;
    var tiempoInicio = performance.now();
    var anguloInicial = ANGULO_ACTUAL_RULETA;

    function step(ahora) {
        var elapsed = ahora - tiempoInicio;
        var t = Math.min(1, elapsed / duracion);
        var easeOut = 1 - Math.pow(1 - t, 3);
        ANGULO_ACTUAL_RULETA = anguloInicial + (anguloObjetivo - anguloInicial) * easeOut;

        dibujarRuletaEnCanvas();

        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            RULETA_EN_GIRO = false;
            ANGULO_ACTUAL_RULETA = ANGULO_ACTUAL_RULETA % (2 * Math.PI);
            dibujarRuletaEnCanvas();
            callback(items[indexGanador]);
        }
    }

    requestAnimationFrame(step);
}

function girarRuletaIndividual(categoria) {
    if (RULETA_EN_GIRO) return;
    CATEGORIA_RULETA_ACTIVA = categoria;
    var rs = APP_STATE.ruletaSemanal || DEFAULT_STATE.ruletaSemanal;
    var items = rs[categoria] || [];
    if (items.length === 0) {
        alert("No hay opciones registradas en " + categoria + " para girar.");
        return;
    }

    animarGiroRuleta(items, function(ganador) {
        if (!APP_STATE.ruletaSemanal.seleccionActiva) APP_STATE.ruletaSemanal.seleccionActiva = {};
        if (categoria === 'comidas') APP_STATE.ruletaSemanal.seleccionActiva.comida = ganador.nombre;
        if (categoria === 'vestimenta') APP_STATE.ruletaSemanal.seleccionActiva.vestimenta = ganador.nombre;
        if (categoria === 'musica') APP_STATE.ruletaSemanal.seleccionActiva.musica = ganador.nombre;

        APP_STATE.ruletaSemanal.seleccionActiva.fechaGiro = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        sumarExp(10);
        MonarcaDB.save(APP_STATE);
        renderizarRuletaSemanal();
        alert("🎲 ¡Giro completado!\nHas seleccionado: " + ganador.nombre + " (+10 EXP por variabilidad).");
    });
}

function girarRuletaCompleta() {
    if (RULETA_EN_GIRO) return;
    var rs = APP_STATE.ruletaSemanal || DEFAULT_STATE.ruletaSemanal;
    var coms = rs.comidas || [];
    var vess = rs.vestimenta || [];
    var muss = rs.musica || [];

    if (coms.length === 0 || vess.length === 0 || muss.length === 0) {
        alert("Asegúrate de tener al menos una opción en Comidas, Vestimenta y Música.");
        return;
    }

    var winCom = coms[Math.floor(Math.random() * coms.length)];
    var winVes = vess[Math.floor(Math.random() * vess.length)];
    var winMus = muss[Math.floor(Math.random() * muss.length)];

    animarGiroRuleta(coms, function() {
        if (!APP_STATE.ruletaSemanal.seleccionActiva) APP_STATE.ruletaSemanal.seleccionActiva = {};
        APP_STATE.ruletaSemanal.seleccionActiva.comida = winCom.nombre;
        APP_STATE.ruletaSemanal.seleccionActiva.vestimenta = winVes.nombre;
        APP_STATE.ruletaSemanal.seleccionActiva.musica = winMus.nombre;
        APP_STATE.ruletaSemanal.seleccionActiva.fechaGiro = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        if (!APP_STATE.ruletaSemanal.historialGiros) APP_STATE.ruletaSemanal.historialGiros = [];
        APP_STATE.ruletaSemanal.historialGiros.unshift({
            fecha: APP_STATE.ruletaSemanal.seleccionActiva.fechaGiro,
            comida: winCom.nombre,
            vestimenta: winVes.nombre,
            musica: winMus.nombre
        });
        if (APP_STATE.ruletaSemanal.historialGiros.length > 10) APP_STATE.ruletaSemanal.historialGiros.pop();

        sumarExp(25);
        MonarcaDB.save(APP_STATE);
        renderizarRuletaSemanal();

        alert("🎲 ¡GIRO COMPLETO DE VARIABILIDAD SEMANAL!\n\n🍲 Comida: " + winCom.nombre + "\n👔 Outfit: " + winVes.nombre + "\n🎵 Música: " + winMus.nombre + "\n\n+25 EXP por romper la monotonía.");
    });
}

function abrirModalNuevaOpcionRuleta() {
    var m = document.getElementById('modal-nueva-opcion-ruleta');
    if (!m) return;
    var lbl = document.getElementById('label-opcion-ruleta-tipo');
    if (lbl) {
        var nomCat = CATEGORIA_RULETA_ACTIVA === 'comidas' ? 'Comida' : (CATEGORIA_RULETA_ACTIVA === 'vestimenta' ? 'Outfit' : 'Música');
        lbl.innerText = "Nueva Opción para " + nomCat + ":";
    }
    m.style.display = 'flex';
}
function cerrarModalNuevaOpcionRuleta() {
    var m = document.getElementById('modal-nueva-opcion-ruleta');
    if (m) m.style.display = 'none';
}
function guardarNuevaOpcionRuleta() {
    var inNom = document.getElementById('input-opcion-ruleta-nombre');
    var inSub = document.getElementById('input-opcion-ruleta-sub');
    var nom = inNom ? inNom.value.trim() : '';
    var sub = inSub ? inSub.value.trim() : '';

    if (!nom) { alert("Ingresa el nombre de la opción."); if (inNom) inNom.focus(); return; }

    var rs = APP_STATE.ruletaSemanal || DEFAULT_STATE.ruletaSemanal;
    if (!rs[CATEGORIA_RULETA_ACTIVA]) rs[CATEGORIA_RULETA_ACTIVA] = [];

    var nuevo = {
        id: "RUL-" + Date.now(),
        nombre: nom,
        tipo: sub,
        estilo: sub,
        genero: sub
    };
    rs[CATEGORIA_RULETA_ACTIVA].push(nuevo);
    MonarcaDB.save(APP_STATE);

    if (inNom) inNom.value = '';
    if (inSub) inSub.value = '';

    cerrarModalNuevaOpcionRuleta();
    renderizarRuletaSemanal();
    alert("🎲 Opción agregada a la ruleta exitosamente.");
}

function eliminarOpcionRuleta(categoria, id) {
    if (!confirm("¿Deseas eliminar esta opción de la ruleta?")) return;
    var rs = APP_STATE.ruletaSemanal;
    if (!rs || !rs[categoria]) return;
    rs[categoria] = rs[categoria].filter(function(item) { return item.id !== id; });
    MonarcaDB.save(APP_STATE);
    renderizarRuletaSemanal();
}
