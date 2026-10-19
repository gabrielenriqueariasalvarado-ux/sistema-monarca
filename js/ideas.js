/**
 * SISTEMA MONARCA · MÓDULO DE BANCO DE IDEAS
 * 5 Categorías, Subcategorías, Contextos, Checklist Operativo y Métricas Mensuales.
 */

var ESTRUCTURA_BANCO_IDEAS = {
    "💡 Ideas & Proyectos": {
        icono: "💡",
        subcategorias: [
            "🧠 Filosofía, Mentalidad y Enfoque",
            "💬 Interacción Social y Dinámicas Personales",
            "🚀 Emprendimiento, Negocios y Nuevas Apps",
            "📜 Citas Célebres & Principios Rectores"
        ]
    },
    "🛒 Compras & Deseos": {
        icono: "🛒",
        subcategorias: [
            "👕 Ropa, Calzado y Accesorios",
            "🖥️ Tecnología, Hardware y Electrónica",
            "🏍️ Moto, Repuestos y Mantenimiento",
            "📚 Libros, Cursos y Material de Estudio",
            "🧴 Cuidado Personal y Barbería",
            "🏠 Hogar, Comida y Supermercado"
        ]
    },
    "📊 Planes & Metas": {
        icono: "📊",
        subcategorias: [
            "👤 Crecimiento Personal, Hábitos y Rutina",
            "💼 Trabajo, Programación y Carrera Profesional",
            "💰 Metas Financieras, Inversiones y Ahorro"
        ]
    },
    "📚 Base de Conocimientos": {
        icono: "📚",
        subcategorias: [
            "💈 Oficio, Barbería & Técnicas Manuales",
            "💻 Programación, Algoritmos y Arquitectura Web",
            "♟️ Psicología Oscura, Lenguaje No Verbal y Estrategia",
            "📖 Resúmenes de Lecturas y Aprendizajes Clave"
        ]
    },
    "✅ Tareas Operativas": {
        icono: "✅",
        subcategorias: [
            "🏠 En Casa (Organización y Espacio)",
            "🛣️ En la Calle (Trámites, Mandados y Compras)",
            "💼 En el Trabajo (Pendientes de Flujo Diario)"
        ]
    }
};

var ESTADO_IDEAS = {
    contextoSeleccionado: "🏠 Casa",
    subvistaActual: "categorias", // 'categorias', 'detalle', 'operatividad'
    categoriaSeleccionada: null,
    filtroContextoDetalle: "TODOS",
    mesOperatividadOffset: 0,
    graficoChartInstance: null,
    inicializado: false
};

function inicializarBancoDeIdeas() {
    if (ESTADO_IDEAS.inicializado) return;

    var catSelect = document.getElementById('select-categoria-idea');
    if (catSelect) {
        catSelect.value = "💡 Ideas & Proyectos";
        alCambiarCategoriaIdea();
    }

    var input = document.getElementById('input-nueva-idea');
    if (input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                guardarNuevaIdea();
            }
        });
    }

    ESTADO_IDEAS.inicializado = true;
    renderizarBancoIdeas(APP_STATE.ideas);
}

function alCambiarCategoriaIdea() {
    var catSelect = document.getElementById('select-categoria-idea');
    var subcatSelect = document.getElementById('select-subcategoria-idea');
    if (!catSelect || !subcatSelect) return;

    var cat = catSelect.value;
    var info = ESTRUCTURA_BANCO_IDEAS[cat];
    subcatSelect.innerHTML = '';
    if (info && info.subcategorias) {
        info.subcategorias.forEach(function(sub) {
            var opt = document.createElement('option');
            opt.value = sub;
            opt.innerText = sub;
            subcatSelect.appendChild(opt);
        });
    }
}

function seleccionarContextoIdea(contexto) {
    ESTADO_IDEAS.contextoSeleccionado = contexto;
    var pills = ['pill-context-casa', 'pill-context-calle', 'pill-context-trabajo'];
    pills.forEach(function(pid) {
        var el = document.getElementById(pid);
        if (el) el.classList.remove('active');
    });
    if (contexto.includes('Casa')) {
        var el = document.getElementById('pill-context-casa'); if (el) el.classList.add('active');
    } else if (contexto.includes('Calle')) {
        var el = document.getElementById('pill-context-calle'); if (el) el.classList.add('active');
    } else if (contexto.includes('Trabajo')) {
        var el = document.getElementById('pill-context-trabajo'); if (el) el.classList.add('active');
    }
}

function cargarIdeas() {
    renderizarBancoIdeas(APP_STATE.ideas);
}

function renderizarBancoIdeas(ideas) {
    actualizarBadgesIdeas();

    if (ESTADO_IDEAS.subvistaActual === 'categorias') {
        mostrarVistaCategoriasGrid();
    } else if (ESTADO_IDEAS.subvistaActual === 'detalle') {
        abrirDetalleCategoriaIdeas(ESTADO_IDEAS.categoriaSeleccionada);
    } else if (ESTADO_IDEAS.subvistaActual === 'operatividad') {
        mostrarVistaOperatividad();
    }
}

function obtenerFechaObjetivoMes() {
    var fecha = new Date();
    fecha.setMonth(fecha.getMonth() + (ESTADO_IDEAS.mesOperatividadOffset || 0));
    return fecha;
}

function esIdeaDelMes(idea, fechaObjetivo) {
    if (!idea || !idea.hecha) return false;
    var d = null;
    if (idea.timestampHecha) {
        d = new Date(idea.timestampHecha);
    } else if (idea.fechaHecha) {
        var cleanStr = String(idea.fechaHecha).trim();
        var parts = cleanStr.split(" ")[0].split("/");
        if (parts.length === 3) {
            d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
    }
    if (!d && idea.fecha && idea.fecha.includes('/')) {
        var p = idea.fecha.split('/');
        if (p.length >= 2) {
            var mNum = parseInt(p[1].trim(), 10) - 1;
            var dNum = parseInt(p[0].trim(), 10);
            d = new Date(fechaObjetivo.getFullYear(), mNum, dNum);
        }
    }
    if (!d || isNaN(d.getTime())) {
        d = new Date();
    }
    return (d.getMonth() === fechaObjetivo.getMonth() && d.getFullYear() === fechaObjetivo.getFullYear());
}

function actualizarBadgesIdeas() {
    var ideas = APP_STATE.ideas || [];
    var pendientes = ideas.filter(function(i) { return !i.hecha; }).length;

    var fechaActual = obtenerFechaObjetivoMes();
    var hechasMes = ideas.filter(function(i) {
        return i.hecha && esIdeaDelMes(i, fechaActual);
    }).length;

    var badgePen = document.getElementById('badge-total-pendientes');
    var badgeOpe = document.getElementById('badge-total-hechas-mes');
    if (badgePen) badgePen.innerText = pendientes;
    if (badgeOpe) badgeOpe.innerText = hechasMes;
}

function alternarSubvistaIdeas(vista) {
    ESTADO_IDEAS.subvistaActual = vista;
    var btnCat = document.getElementById('btn-tab-categorias');
    var btnOpe = document.getElementById('btn-tab-operatividad');

    if (vista === 'categorias') {
        if (btnCat) btnCat.classList.add('active');
        if (btnOpe) btnOpe.classList.remove('active');
        mostrarVistaCategoriasGrid();
    } else if (vista === 'operatividad') {
        if (btnOpe) btnOpe.classList.add('active');
        if (btnCat) btnCat.classList.remove('active');
        mostrarVistaOperatividad();
    }
}

function mostrarVistaCategoriasGrid() {
    ESTADO_IDEAS.subvistaActual = 'categorias';

    var gridCont = document.getElementById('vista-ideas-categorias-grid');
    var detalleCont = document.getElementById('vista-ideas-categoria-detalle');
    var opCont = document.getElementById('vista-ideas-operatividad');

    if (gridCont) gridCont.style.display = 'block';
    if (detalleCont) detalleCont.style.display = 'none';
    if (opCont) opCont.style.display = 'none';

    var btnCat = document.getElementById('btn-tab-categorias');
    var btnOpe = document.getElementById('btn-tab-operatividad');
    if (btnCat) btnCat.classList.add('active');
    if (btnOpe) btnOpe.classList.remove('active');

    var contenedor = document.getElementById('contenedor-grid-categorias');
    if (!contenedor) return;

    var ideas = APP_STATE.ideas || [];
    var html = '';

    Object.keys(ESTRUCTURA_BANCO_IDEAS).forEach(function(catNombre) {
        var info = ESTRUCTURA_BANCO_IDEAS[catNombre];
        var pendientesCat = ideas.filter(function(i) {
            return !i.hecha && i.categoria === catNombre;
        }).length;

        html += `
        <div class="category-card" onclick="abrirDetalleCategoriaIdeas('${catNombre}')">
            <div class="category-card-header">
                <span class="category-card-icon">${info.icono}</span>
                <div class="category-card-title">${catNombre}</div>
            </div>
            <div class="category-card-footer">
                <span><strong>${pendientesCat}</strong> ${pendientesCat === 1 ? 'pendiente' : 'pendientes'}</span>
                <span style="color: #111827; font-weight: 700;">Explorar ›</span>
            </div>
        </div>`;
    });

    contenedor.innerHTML = html;
    actualizarBadgesIdeas();
}

function abrirDetalleCategoriaIdeas(catNombre) {
    if (!catNombre) catNombre = Object.keys(ESTRUCTURA_BANCO_IDEAS)[0];
    ESTADO_IDEAS.categoriaSeleccionada = catNombre;
    ESTADO_IDEAS.subvistaActual = 'detalle';

    var gridCont = document.getElementById('vista-ideas-categorias-grid');
    var detalleCont = document.getElementById('vista-ideas-categoria-detalle');
    var opCont = document.getElementById('vista-ideas-operatividad');

    if (gridCont) gridCont.style.display = 'none';
    if (detalleCont) detalleCont.style.display = 'block';
    if (opCont) opCont.style.display = 'none';

    var btnCat = document.getElementById('btn-tab-categorias');
    var btnOpe = document.getElementById('btn-tab-operatividad');
    if (btnCat) btnCat.classList.add('active');
    if (btnOpe) btnOpe.classList.remove('active');

    var headerElem = document.getElementById('detalle-categoria-header');
    var info = ESTRUCTURA_BANCO_IDEAS[catNombre];
    if (headerElem) {
        headerElem.innerHTML = `
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <h3 style="margin: 0; color: #111827; font-size: 17px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                        <span>${info ? info.icono : '💡'}</span>
                        <span>${catNombre}</span>
                    </h3>
                    <p style="margin: 4px 0 0 0; font-size: 12.5px; color: #6b7280;">
                        Marca la casilla para completar la idea y enviarla a Operatividad.
                    </p>
                </div>
            </div>`;
    }

    var filtroSelect = document.getElementById('select-filtro-contexto-detalle');
    if (filtroSelect) filtroSelect.value = ESTADO_IDEAS.filtroContextoDetalle;

    var listCont = document.getElementById('contenedor-subcategorias-lista');
    if (!listCont) return;

    var ideas = APP_STATE.ideas || [];
    var subcategorias = (info && info.subcategorias) ? info.subcategorias : ["General"];
    var filtroContexto = ESTADO_IDEAS.filtroContextoDetalle;

    var html = '';

    subcategorias.forEach(function(subNombre) {
        // Filtrar SOLO ideas NO hechas (pendientes)
        var subIdeas = ideas.filter(function(i) {
            var coincideCat = (i.categoria === catNombre);
            var coincideSub = (i.subcategoria === subNombre || (!i.subcategoria && subNombre.includes("General")));
            var noHecha = !i.hecha;
            var coincideContexto = (filtroContexto === 'TODOS' || (i.contexto && i.contexto.includes(filtroContexto.replace(/^[^\w\s]+\s*/, ''))));
            return coincideCat && coincideSub && noHecha && coincideContexto;
        });

        html += `
        <div class="subcategory-section">
            <div class="subcategory-title">
                <span>${subNombre}</span>
                <span style="font-size: 11.5px; font-weight: 700; color: #374151; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 9999px;">
                    ${subIdeas.length} ${subIdeas.length === 1 ? 'pendiente' : 'pendientes'}
                </span>
            </div>
            <div class="idea-clean-list">`;

        if (subIdeas.length === 0) {
            html += `<p style="font-size: 12.5px; color: #9ca3af; padding: 6px 12px; font-style: italic; margin: 0;">- No hay ideas pendientes en esta subcategoría.</p>`;
        } else {
            subIdeas.forEach(function(idea) {
                html += `
                <div class="idea-clean-item" id="idea-card-${idea.id}">
                    <div class="idea-item-left">
                        <span class="idea-dash">-</span>
                        <div class="idea-item-content">
                            <span class="idea-text-line">${idea.texto}</span>
                            <div class="idea-meta-badges">
                                <span class="idea-context-badge">${idea.contexto || '🏠 Casa'}</span>
                                ${idea.fecha ? `<span style="font-size: 11px; color: #9ca3af; font-weight: 600;">${idea.fecha}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="idea-btn-check" onclick="marcarIdeaHechaUI(${idea.id})" title="Marcar como realizada y mover a Operatividad">
                            <span>✓</span> Marcar Hecha
                        </button>
                        <button class="btn-delete-row" onclick="eliminarIdea(${idea.id})" title="Eliminar idea">✕</button>
                    </div>
                </div>`;
            });
        }

        html += `</div></div>`;
    });

    listCont.innerHTML = html;
    actualizarBadgesIdeas();
}

function volverACategoriasIdeas() {
    mostrarVistaCategoriasGrid();
}

function alFiltrarContextoDetalle() {
    var filtroSelect = document.getElementById('select-filtro-contexto-detalle');
    if (filtroSelect) {
        ESTADO_IDEAS.filtroContextoDetalle = filtroSelect.value;
        if (ESTADO_IDEAS.categoriaSeleccionada) {
            abrirDetalleCategoriaIdeas(ESTADO_IDEAS.categoriaSeleccionada);
        }
    }
}

function guardarNuevaIdea() {
    var input = document.getElementById('input-nueva-idea');
    var catSelect = document.getElementById('select-categoria-idea');
    var subcatSelect = document.getElementById('select-subcategoria-idea');

    if (!input || !input.value.trim()) {
        alert("Escribe el contenido de tu idea.");
        if (input) input.focus();
        return;
    }

    var texto = input.value.trim();
    var cat = catSelect ? catSelect.value : "💭 Ideas y Pensamientos";
    var subcat = subcatSelect ? subcatSelect.value : "Mis Pensamientos";
    var contexto = ESTADO_IDEAS.contextoSeleccionado || "🏠 Casa";

    // Formatear fecha actual (ejemplo: 28/09)
    var ahora = new Date();
    var dd = String(ahora.getDate()).padStart(2, '0');
    var mm = String(ahora.getMonth() + 1).padStart(2, '0');
    var fechaCorta = dd + "/" + mm;

    if (!texto.endsWith(fechaCorta) && !texto.includes('(' + fechaCorta + ')')) {
        texto += " (" + fechaCorta + ")";
    }

    if (!APP_STATE.ideas) APP_STATE.ideas = [];

    APP_STATE.ideas.unshift({
        id: Date.now(),
        texto: texto,
        categoria: cat,
        subcategoria: subcat,
        contexto: contexto,
        fecha: fechaCorta,
        timestamp: Date.now(),
        hecha: false
    });

    input.value = "";
    MonarcaDB.save(APP_STATE);
    sumarExp(10);

    // Si estábamos en detalle de esa misma categoría, actualizarlo directamente; si no, mostrar cuadrícula
    if (ESTADO_IDEAS.subvistaActual === 'detalle' && ESTADO_IDEAS.categoriaSeleccionada === cat) {
        abrirDetalleCategoriaIdeas(cat);
    } else {
        mostrarVistaCategoriasGrid();
    }
}

function marcarIdeaHechaUI(id) {
    if (!APP_STATE.ideas) return;
    var encontrada = null;
    for (var i = 0; i < APP_STATE.ideas.length; i++) {
        if (String(APP_STATE.ideas[i].id) === String(id)) {
            encontrada = APP_STATE.ideas[i];
            encontrada.hecha = !encontrada.hecha;
            if (encontrada.hecha) {
                encontrada.timestampHecha = Date.now();
                encontrada.fechaHecha = new Date().toLocaleDateString('es-ES');
                sumarExp(15);
            }
            break;
        }
    }

    MonarcaDB.save(APP_STATE);

    // Re-renderizar la vista activa para que la idea completada se mueva de inmediato a Operatividad
    if (ESTADO_IDEAS.subvistaActual === 'detalle') {
        abrirDetalleCategoriaIdeas(ESTADO_IDEAS.categoriaSeleccionada);
    } else if (ESTADO_IDEAS.subvistaActual === 'operatividad') {
        mostrarVistaOperatividad();
    } else {
        mostrarVistaCategoriasGrid();
    }
}

function eliminarIdea(id) {
    if (!confirm("¿Eliminar esta idea?")) return;
    if (!APP_STATE.ideas) return;
    APP_STATE.ideas = APP_STATE.ideas.filter(function(i) { return String(i.id) !== String(id); });
    MonarcaDB.save(APP_STATE);

    if (ESTADO_IDEAS.subvistaActual === 'detalle') {
        abrirDetalleCategoriaIdeas(ESTADO_IDEAS.categoriaSeleccionada);
    } else if (ESTADO_IDEAS.subvistaActual === 'operatividad') {
        mostrarVistaOperatividad();
    } else {
        mostrarVistaCategoriasGrid();
    }
}

// --------------------------------------------------------------------------
// OPERATIVIDAD
// --------------------------------------------------------------------------

function mostrarVistaOperatividad() {
    ESTADO_IDEAS.subvistaActual = 'operatividad';

    var gridCont = document.getElementById('vista-ideas-categorias-grid');
    var detalleCont = document.getElementById('vista-ideas-categoria-detalle');
    var opCont = document.getElementById('vista-ideas-operatividad');

    if (gridCont) gridCont.style.display = 'none';
    if (detalleCont) detalleCont.style.display = 'none';
    if (opCont) opCont.style.display = 'block';

    var btnCat = document.getElementById('btn-tab-categorias');
    var btnOpe = document.getElementById('btn-tab-operatividad');
    if (btnCat) btnCat.classList.remove('active');
    if (btnOpe) btnOpe.classList.add('active');

    var fechaObjetivo = obtenerFechaObjetivoMes();
    var opciones = { month: 'long', year: 'numeric' };
    var nombreMes = fechaObjetivo.toLocaleDateString('es-ES', opciones);
    nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

    var labelMes = document.getElementById('label-mes-operatividad');
    if (labelMes) labelMes.innerText = nombreMes;

    var ideas = APP_STATE.ideas || [];

    // Ideas ejecutadas en este mes
    var ideasHechasMes = ideas.filter(function(i) {
        return i.hecha && esIdeaDelMes(i, fechaObjetivo);
    });

    // Conteo por categoría
    var conteoPorCat = {};
    Object.keys(ESTRUCTURA_BANCO_IDEAS).forEach(function(cat) {
        conteoPorCat[cat] = 0;
    });

    ideasHechasMes.forEach(function(i) {
        var cat = i.categoria || "💭 Ideas y Pensamientos";
        if (conteoPorCat[cat] === undefined) conteoPorCat[cat] = 0;
        conteoPorCat[cat]++;
    });

    var maxCat = "-";
    var maxVal = 0;
    Object.keys(conteoPorCat).forEach(function(k) {
        if (conteoPorCat[k] > maxVal) {
            maxVal = conteoPorCat[k];
            maxCat = k.replace(/^[^\w\s]+\s*/, '');
        }
    });

    var metricHechas = document.getElementById('metric-ideas-hechas-mes');
    var metricTop = document.getElementById('metric-ideas-categoria-top');
    var metricTasa = document.getElementById('metric-tasa-operatividad');

    if (metricHechas) metricHechas.innerText = ideasHechasMes.length;
    if (metricTop) metricTop.innerText = maxCat !== "-" ? maxCat + (maxVal > 0 ? ` (${maxVal})` : '') : "Sin registros";

    var totalIdeasMes = ideas.filter(function(i) {
        return esIdeaDelMes(i, fechaObjetivo);
    }).length;
    var tasa = totalIdeasMes > 0 ? Math.round((ideasHechasMes.length / totalIdeasMes) * 100) : (ideasHechasMes.length > 0 ? 100 : 0);
    if (metricTasa) metricTasa.innerText = tasa + "%";

    renderizarGraficoOperatividad(conteoPorCat);
    renderizarListaOperatividad(ideasHechasMes);
    actualizarBadgesIdeas();
}

function cambiarMesOperatividad(delta) {
    ESTADO_IDEAS.mesOperatividadOffset += delta;
    mostrarVistaOperatividad();
}

function renderizarGraficoOperatividad(conteoPorCat) {
    var canvas = document.getElementById('graficoOperatividad');
    if (!canvas) return;

    if (ESTADO_IDEAS.graficoChartInstance) {
        ESTADO_IDEAS.graficoChartInstance.destroy();
    }

    var labels = Object.keys(conteoPorCat).map(function(c) {
        return c.replace(/^[^\w\s]+\s*/, '');
    });
    var dataValues = Object.values(conteoPorCat);

    try {
        var ctx = canvas.getContext('2d');
        ESTADO_IDEAS.graficoChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ideas Ejecutadas',
                    data: dataValues,
                    backgroundColor: '#111827',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0, font: { family: 'Plus Jakarta Sans' } } },
                    x: { ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } catch (e) {
        console.warn("Chart.js para operatividad no disponible:", e);
    }
}

function renderizarListaOperatividad(ejecutadas) {
    var cont = document.getElementById('contenedor-lista-operatividad');
    var badgeContador = document.getElementById('badge-contador-hechas-lista');

    if (badgeContador) {
        badgeContador.innerText = ejecutadas.length + (ejecutadas.length === 1 ? ' idea' : ' ideas');
    }

    if (!cont) return;

    if (!ejecutadas || ejecutadas.length === 0) {
        cont.innerHTML = '<p style="color:#6b7280; font-size:13px; text-align:center; padding:16px;">Sin ideas completadas en este mes.</p>';
        return;
    }

    var html = '';
    ejecutadas.forEach(function(i) {
        html += `
        <div class="idea-clean-item is-done">
            <div class="idea-item-left">
                <span class="idea-dash">✓</span>
                <div class="idea-item-content">
                    <span class="idea-text-line" style="text-decoration: line-through; color: #6b7280;">${i.texto}</span>
                    <div class="idea-meta-badges">
                        <span class="idea-context-badge">${i.categoria.replace(/^[^\w\s]+\s*/, '')}</span>
                        <span class="idea-context-badge">${i.contexto || '🏠 Casa'}</span>
                        <span style="font-size: 10.5px; color: #10b981; font-weight: 700;">✓ Ejecutada</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <button class="idea-btn-check checked" onclick="marcarIdeaHechaUI(${i.id})" title="Desmarcar y devolver a pendientes">
                    Desmarcar ↩
                </button>
                <button class="btn-delete-row" onclick="eliminarIdea(${i.id})">✕</button>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function inicializarHojaIdeasDesdeUI() {
    MonarcaDB.exportBackup();
}

// ==========================================================================
// 📚 BASE DE CONOCIMIENTOS & REVISIÓN SEMANAL DE APRENDIZAJES
// ==========================================================================

var FILTRO_AREA_CONOCIMIENTO = "TODAS";

function cargarConocimientos(filtro) {
    if (filtro) FILTRO_AREA_CONOCIMIENTO = filtro;
    renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
}

function renderizarConocimientos(filtro) {
    var cont = document.getElementById('contenedor-conocimientos-grid');
    var bannerRevision = document.getElementById('contenedor-revision-semanal-conocimiento');
    if (!cont && !bannerRevision) return;

    if (!APP_STATE.conocimientos || !Array.isArray(APP_STATE.conocimientos)) {
        APP_STATE.conocimientos = [];
    }
    var conocimientos = APP_STATE.conocimientos;

    // Métricas de repaso semanal
    var totalConocimientos = conocimientos.length;
    var repasadosEstaSemana = conocimientos.filter(function(c) { return c.revisadoEstaSemana; }).length;
    var porcentajeSemana = totalConocimientos > 0 ? Math.round((repasadosEstaSemana / totalConocimientos) * 100) : 0;

    if (bannerRevision) {
        bannerRevision.innerHTML = `
        <div class="weekly-review-banner">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
                <div>
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Ciclo de Repaso Activo</div>
                    <h3 style="margin: 2px 0 0 0; font-size: 17px; font-weight: 800; color: #111827;">Revisión Semanal de Conocimientos</h3>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="item-badge-pill" style="font-size: 12.5px; font-weight: 800; background: #f3f4f6; color: #111827;">${repasadosEstaSemana} / ${totalConocimientos} Repasados</span>
                    <button class="btn-sheet-action" onclick="reiniciarCicloSemanalConocimientos()" title="Reiniciar ciclo semanal para volver a estudiar">
                        🔄 Nuevo Ciclo Semanal
                    </button>
                </div>
            </div>
            <p style="margin: 0 0 10px 0; font-size: 12.5px; color: #4b5563;">
                Estudio espaciado de técnicas operativas y teóricas aprendidas durante tus actividades. Repasa cada punto para afianzar retención neural y sumar +15 EXP.
            </p>
            <div class="attr-progress-track" style="height: 8px;">
                <div class="attr-progress-fill" style="width: ${porcentajeSemana}%;"></div>
            </div>
        </div>`;
    }

    if (!cont) return;

    var filtrados = conocimientos;
    if (filtro && filtro !== "TODAS") {
        filtrados = conocimientos.filter(function(c) { return c.area === filtro; });
    }

    if (filtrados.length === 0) {
        cont.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 32px 16px; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px;">
            <p style="margin: 0; color: #6b7280; font-size: 13.5px;">No hay conocimientos registrados en esta área.</p>
            <button class="btn-system" style="margin-top: 12px; font-size: 12.5px;" onclick="abrirModalNuevoConocimiento()">+ Registrar Nuevo Conocimiento</button>
        </div>`;
        return;
    }

    var html = '';
    filtrados.forEach(function(c) {
        var estadoBadge = c.revisadoEstaSemana ? 
            `<span style="font-size: 11px; font-weight: 700; background: #ecfdf5; color: #059669; padding: 3px 8px; border-radius: 9999px; border: 1px solid #a7f3d0;">✓ Repasado esta semana</span>` :
            `<span style="font-size: 11px; font-weight: 700; background: #f3f4f6; color: #4b5563; padding: 3px 8px; border-radius: 9999px; border: 1px solid #e5e7eb;">Pendiente de repaso</span>`;

        var btnRepaso = c.revisadoEstaSemana ?
            `<button class="btn-card-repaso repasado" onclick="marcarConocimientoRepasadoSemana('${c.id}')" title="Hacer clic para desmarcar">✓ Estudiado</button>` :
            `<button class="btn-card-repaso" onclick="marcarConocimientoRepasadoSemana('${c.id}')">📖 Estudiar y Marcar (+15 EXP)</button>`;

        html += `
        <div class="knowledge-card ${c.revisadoEstaSemana ? 'repasado' : ''}">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
                <div>
                    <span class="knowledge-area-tag">${c.area || 'Conocimiento'}</span>
                    <h4 class="knowledge-title">${c.titulo}</h4>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button onclick="eliminarConocimiento('${c.id}')" title="Eliminar técnica" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 2px 6px; font-size: 13px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#9ca3af'">🗑️</button>
                </div>
            </div>

            <div style="font-size: 11.5px; color: #6b7280; margin-bottom: 10px;">
                <strong>Origen:</strong> ${c.actividadOrigen || 'Actividad práctica'} · <span style="font-weight: 600; color: #374151;">${c.nivelDominio || 'En Práctica'}</span>
            </div>

            <div class="knowledge-keypoints-box">
                <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #6b7280; margin-bottom: 4px;">Puntos Clave & Técnica:</div>
                <p style="margin: 0; font-size: 12.5px; color: #1f2937; line-height: 1.45; white-space: pre-wrap;">${c.resumenPuntosClave}</p>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid #f3f4f6; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    ${estadoBadge}
                    <span style="font-size: 11px; color: #6b7280;">${c.semanasRepasadas || 0} sem. activas</span>
                </div>
                <div>
                    ${btnRepaso}
                </div>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function abrirModalNuevoConocimiento() {
    var modal = document.getElementById('modal-nuevo-conocimiento');
    if (!modal) return;
    var inTit = document.getElementById('input-con-titulo');
    var inOrigen = document.getElementById('input-con-origen');
    var inPuntos = document.getElementById('input-con-puntos');

    if (inTit) inTit.value = '';
    if (inOrigen) inOrigen.value = '';
    if (inPuntos) inPuntos.value = '';

    modal.style.display = 'flex';
}

function cerrarModalNuevoConocimiento() {
    var modal = document.getElementById('modal-nuevo-conocimiento');
    if (modal) modal.style.display = 'none';
}

function guardarNuevoConocimiento() {
    var inTit = document.getElementById('input-con-titulo');
    var inArea = document.getElementById('input-con-area');
    var inOrigen = document.getElementById('input-con-origen');
    var inPuntos = document.getElementById('input-con-puntos');
    var inDominio = document.getElementById('input-con-dominio');

    var titulo = inTit ? inTit.value.trim() : '';
    var area = inArea ? inArea.value : 'Oficio & Barbería';
    var origen = inOrigen ? inOrigen.value.trim() : '';
    var puntos = inPuntos ? inPuntos.value.trim() : '';
    var dominio = inDominio ? inDominio.value : 'En Práctica';

    if (!titulo) {
        alert("Por favor ingresa el título de la técnica o conocimiento.");
        if (inTit) inTit.focus();
        return;
    }
    if (!puntos) {
        alert("Por favor ingresa los puntos clave o explicación de la técnica.");
        if (inPuntos) inPuntos.focus();
        return;
    }

    if (!APP_STATE.conocimientos) APP_STATE.conocimientos = [];
    var nuevo = {
        id: "CON-" + Date.now(),
        titulo: titulo,
        area: area,
        actividadOrigen: origen || "Actividad del día a día",
        resumenPuntosClave: puntos,
        nivelDominio: dominio,
        fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        timestamp: Date.now(),
        semanasRepasadas: 0,
        revisadoEstaSemana: true
    };

    APP_STATE.conocimientos.unshift(nuevo);
    sumarExp(25);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevoConocimiento();
    renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
    alert("📚 Conocimiento registrado exitosamente con repaso activo (+25 EXP).");
}

function marcarConocimientoRepasadoSemana(id) {
    if (!APP_STATE.conocimientos) return;
    var c = APP_STATE.conocimientos.find(function(item) { return item.id === id; });
    if (!c) return;

    if (c.revisadoEstaSemana) {
        c.revisadoEstaSemana = false;
        c.semanasRepasadas = Math.max(0, (c.semanasRepasadas || 1) - 1);
    } else {
        c.revisadoEstaSemana = true;
        c.semanasRepasadas = (c.semanasRepasadas || 0) + 1;
        sumarExp(15);
        if (APP_STATE.menteAtributos && APP_STATE.menteAtributos.conocimiento !== undefined) {
            APP_STATE.menteAtributos.conocimiento = Math.min(100, (APP_STATE.menteAtributos.conocimiento || 0) + 5);
        }
        alert("🧠 ¡Técnica estudiada y afianzada!\n+15 EXP recibidos.");
    }
    MonarcaDB.save(APP_STATE);
    renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
}

function reiniciarCicloSemanalConocimientos() {
    if (!APP_STATE.conocimientos || APP_STATE.conocimientos.length === 0) return;
    if (!confirm("¿Iniciar un nuevo ciclo semanal de estudio? Todas las técnicas volverán a estar pendientes para su repaso semanal.")) return;

    APP_STATE.conocimientos.forEach(function(c) {
        c.revisadoEstaSemana = false;
    });
    MonarcaDB.save(APP_STATE);
    renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
    alert("🔄 Ciclo semanal reiniciado. ¡Listo para repasar tus conocimientos!");
}

function eliminarConocimiento(id) {
    if (!confirm("¿Estás seguro de eliminar este registro de conocimiento?")) return;
    if (!APP_STATE.conocimientos) return;
    APP_STATE.conocimientos = APP_STATE.conocimientos.filter(function(c) { return c.id !== id; });
    MonarcaDB.save(APP_STATE);
    renderizarConocimientos(FILTRO_AREA_CONOCIMIENTO);
}

function filtrarConocimientosPorArea(area, btn) {
    FILTRO_AREA_CONOCIMIENTO = area;
    var btns = document.querySelectorAll('.btn-tab-con-area');
    btns.forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderizarConocimientos(area);
}


// ==========================================================================
// 12. CALENDARIO
// ==========================================================================
