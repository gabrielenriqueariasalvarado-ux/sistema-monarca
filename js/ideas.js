/**
 * SISTEMA MONARCA · MÓDULO DE BANCO DE IDEAS
 * 5 Categorías, Subcategorías, Contextos, Checklist Operativo y Métricas Mensuales.
 */

var ESTRUCTURA_BANCO_IDEAS = {
    "💭 Ideas y Pensamientos": {
        icono: "💭",
        subcategorias: [
            "🧠 Mis Pensamientos (Filosofía, Mentalidad y Enfoque)",
            "💬 Interacción Social y Dinámicas Personales",
            "📜 Frases Populares / Citas Célebres"
        ]
    },
    "🛒 Compras": {
        icono: "🛒",
        subcategorias: [
            "👕 Ropa y Accesorios",
            "🖥️ Tecnología y Electrónica",
            "📚 Estudios y Papelería",
            "🧴 Cuidado Personal y Salud",
            "🏠 Hogar, Comida y Varios",
            "💳 Gastos, Pagos y Deudas"
        ]
    },
    "📊 Planes y Monitoreo de Ejecución": {
        icono: "📊",
        subcategorias: [
            "👤 Vida Personal, Hábitos y Bienestar",
            "💼 Trabajo, Programación y Proyectos Profesionales"
        ]
    },
    "🧠 Cosas por Aprender": {
        icono: "🧠",
        subcategorias: [
            "🧠 General y Mentalidad",
            "💻 Programación y Tecnología",
            "📚 Libros, Cursos y Habilidades"
        ]
    },
    "✅ Tareas Pendientes": {
        icono: "✅",
        subcategorias: [
            "🏠 Casa",
            "🛣️ Calle (Trámites y Mandados)",
            "💼 Trabajo (Estudios y Proyectos)"
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
        catSelect.value = "💭 Ideas y Pensamientos";
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
// 12. CALENDARIO
// ==========================================================================
