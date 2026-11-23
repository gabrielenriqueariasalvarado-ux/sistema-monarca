/**
 * SISTEMA MONARCA · MÓDULO DE INVENTARIO Y CONTROL DE VENTAS
 * Catálogo de productos con variantes (tallas/colores), separación de costo y precio de venta,
 * márgenes de rentabilidad, categorías personalizadas y registro de ventas con trazabilidad completa.
 */

var TAB_INVENTARIO_ACTIVA = 'productos';
var _PROD_EDITANDO_ID = null;
var _CAT_EDITANDO_ID = null;
var _VENTA_PROD_ACTUAL = null;

/**
 * Asegura la existencia y formato correcto de la estructura en APP_STATE
 */
function asegurarEstructuraInventario() {
    if (!window.APP_STATE) {
        window.APP_STATE = typeof MonarcaDB !== 'undefined' ? MonarcaDB.get() : {};
    }
    if (!APP_STATE.inventario) {
        APP_STATE.inventario = {
            productos: [],
            categorias: [],
            ventas: []
        };
    }
    if (!Array.isArray(APP_STATE.inventario.productos)) APP_STATE.inventario.productos = [];
    if (!Array.isArray(APP_STATE.inventario.categorias)) APP_STATE.inventario.categorias = [];
    if (!Array.isArray(APP_STATE.inventario.ventas)) APP_STATE.inventario.ventas = [];
}

/**
 * Carga principal del módulo al cambiar a la vista
 */
function cargarInventario() {
    asegurarEstructuraInventario();
    actualizarMetricasKpisInventario();
    actualizarSelectsCategorias();
    cambiarTabInventario(TAB_INVENTARIO_ACTIVA || 'productos');
}

/**
 * Refresco suave reactivo (útil para Firebase Cloud sync)
 */
function renderizarInventarioSiActivo() {
    var vista = document.getElementById('vista-inventario');
    if (vista && vista.classList.contains('active')) {
        cargarInventario();
    }
}

/**
 * Cambio entre pestañas (Productos, Categorías, Vendidos)
 */
function cambiarTabInventario(tab) {
    TAB_INVENTARIO_ACTIVA = tab;
    
    // Actualizar botones de pestañas
    var pills = [
        { id: 'tab-btn-inv-productos', panel: 'panel-inv-productos', key: 'productos' },
        { id: 'tab-btn-inv-categorias', panel: 'panel-inv-categorias', key: 'categorias' },
        { id: 'tab-btn-inv-vendidos', panel: 'panel-inv-vendidos', key: 'vendidos' }
    ];

    pills.forEach(function(item) {
        var btn = document.getElementById(item.id);
        var panel = document.getElementById(item.panel);
        if (btn) {
            if (item.key === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
        if (panel) {
            panel.style.display = (item.key === tab) ? 'block' : 'none';
        }
    });

    // Renderizar contenido correspondiente
    if (tab === 'productos') {
        filtrarProductosInventario();
    } else if (tab === 'categorias') {
        renderizarCategoriasInventario();
    } else if (tab === 'vendidos') {
        renderizarVendidosInventario();
    }

    actualizarMetricasKpisInventario();
}

/**
 * Calcula y actualiza las métricas KPI del inventario
 */
function actualizarMetricasKpisInventario() {
    asegurarEstructuraInventario();
    var prods = APP_STATE.inventario.productos;
    var ventas = APP_STATE.inventario.ventas;
    var cats = APP_STATE.inventario.categorias;

    var totalProductos = prods.length;
    var totalStock = 0;
    var valorStock = 0;

    prods.forEach(function(p) {
        var s = Math.max(0, Number(p.stock) || 0);
        var precioVenta = Number(p.precioVenta != null ? p.precioVenta : (p.costo || 0));
        totalStock += s;
        valorStock += (s * precioVenta);
    });

    var unidadesVendidas = 0;
    var totalIngresos = 0;

    ventas.forEach(function(v) {
        var cant = Number(v.cantidad) || 0;
        var tot = Number(v.totalVenta) || (cant * (Number(v.precioUnitario) || 0));
        unidadesVendidas += cant;
        totalIngresos += tot;
    });

    // Actualizar badges numéricos en cabecera de pestañas
    var bProds = document.getElementById('badge-count-productos');
    var bCats = document.getElementById('badge-count-categorias');
    var bVends = document.getElementById('badge-count-vendidos');
    if (bProds) bProds.textContent = totalProductos;
    if (bCats) bCats.textContent = cats.length;
    if (bVends) bVends.textContent = ventas.length;

    // Actualizar tarjetas de KPI
    var elTotalProd = document.getElementById('inv-kpi-total-productos');
    var elTotalStock = document.getElementById('inv-kpi-total-stock');
    var elValorStock = document.getElementById('inv-kpi-valor-stock');
    var elUnidsVend = document.getElementById('inv-kpi-unidades-vendidas');
    var elTotalIng = document.getElementById('inv-kpi-total-ingresos');

    if (elTotalProd) elTotalProd.textContent = totalProductos;
    if (elTotalStock) elTotalStock.textContent = totalStock + " unids";
    if (elValorStock) elValorStock.textContent = "$" + valorStock.toFixed(2);
    if (elUnidsVend) elUnidsVend.textContent = unidadesVendidas + " unids";
    if (elTotalIng) elTotalIng.textContent = "$" + totalIngresos.toFixed(2);

    if (typeof actualizarGraficaCobrosCreditoInventario === 'function') {
        actualizarGraficaCobrosCreditoInventario();
    }
}

// ==========================================================================
// 1. GESTIÓN DE PRODUCTOS (CATÁLOGO, VENTAS ÚNICAS, VARIANTES Y RENTABILIDAD)
// ==========================================================================

function escaparHTMLInv(str) {
    if (typeof escaparHTML === 'function') return escaparHTML(str);
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function esProductoVentaUnicaInv(prod) {
    if (!prod) return false;
    return !!(prod.esVentaUnica || prod.tipoProducto === 'venta_unica' || prod.categoriaId === '__VENTA_UNICA__');
}

function obtenerConversionPrecioInv(montoIn, moneda, tasaTipo) {
    if (typeof convertirMontoFinanzasAUsd === 'function') {
        return convertirMontoFinanzasAUsd(montoIn, moneda, tasaTipo);
    }
    var val = Math.max(0, Number(montoIn) || 0);
    if (moneda !== 'VES') {
        return { valido: true, usd: Math.round(val * 100) / 100, bs: 0, tasaUsada: 0, tasaLabel: 'USD', monedaOrigen: 'USD' };
    }
    try {
        var raw = localStorage.getItem('MONARCA_TASAS_BCV_V1');
        var cache = raw ? JSON.parse(raw) : {};
        var tasa = (tasaTipo === 'paralelo' && Number(cache.paralelo) > 0) ? Number(cache.paralelo) : (Number(cache.usd) || Number(cache.paralelo) || 0);
        var label = (tasaTipo === 'paralelo' && Number(cache.paralelo) > 0) ? 'Paralelo' : 'BCV USD';
        if (tasa > 0) {
            return { valido: true, usd: Math.round((val / tasa) * 100) / 100, bs: Math.round(val * 100) / 100, tasaUsada: tasa, tasaLabel: label, monedaOrigen: 'VES' };
        }
    } catch (e) {}
    return { valido: false, usd: 0, bs: val, tasaUsada: 0, tasaLabel: 'Sin tasa', monedaOrigen: 'VES' };
}

/**
 * Renderiza el listado de productos activos en stock (catálogo y ventas únicas)
 */
function renderizarProductosInventario(listaManual) {
    asegurarEstructuraInventario();
    var cont = document.getElementById('contenedor-productos-inventario');
    if (!cont) return;

    var todosProds = APP_STATE.inventario.productos || [];
    var listaRaw = listaManual || todosProds;

    if (!listaRaw || listaRaw.length === 0) {
        if (todosProds.length > 0 && listaManual) {
            cont.innerHTML = `
            <div class="card" style="text-align: center; padding: 34px 20px; border-radius: 16px; border: 1.5px dashed rgba(255,255,255,0.12); background: #121725;">
                <div style="font-size: 36px; margin-bottom: 10px;">🔍</div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #f8fafc;">Sin resultados con el filtro actual</h3>
                <p style="margin: 6px auto 0 auto; max-width: 420px; font-size: 12.5px; color: #94a3b8;">
                    Prueba cambiando el filtro de tipo, categoría o búsqueda para ver los ${todosProds.length} artículos guardados.
                </p>
            </div>`;
            return;
        }
        var tieneCategorias = APP_STATE.inventario.categorias.length > 0;
        cont.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px; border-radius: 16px; border: 1.5px dashed rgba(255,255,255,0.16); background: #121725;">
            <div style="font-size: 42px; margin-bottom: 12px;">📦</div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #f8fafc;">No tienes artículos en inventario</h3>
            <p style="margin: 6px auto 18px auto; max-width: 460px; font-size: 13px; color: #94a3b8; line-height: 1.45;">
                ${tieneCategorias 
                    ? 'Agrega mercancía de tu catálogo o publica cosas personales en Venta Única (ej: una tarjeta de vídeo, laptop o celular) sin crear categorías fijas.' 
                    : 'Puedes crear categorías de tienda para tu catálogo o agregar directamente un artículo personal en Venta Única.'}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                ${!tieneCategorias ? `
                <button class="btn-system" onclick="abrirModalNuevaCategoria()" style="background: #121725; color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.14); padding: 9px 16px; font-size: 13px; font-weight: 700; border-radius: 10px;">
                    🏷️ Crear Categoría
                </button>` : ''}
                <button class="btn-system" onclick="abrirModalNuevoProducto(null, 'venta_unica')" style="background: rgba(56, 189, 248, 0.16); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.35); padding: 9px 18px; font-size: 13px; font-weight: 700; border-radius: 10px;">
                    ✨ + Venta Única
                </button>
                <button class="btn-system" onclick="abrirModalNuevoProducto(null, 'catalogo')" style="background: #111827; color: #ffffff; border: 1px solid rgba(255,255,255,0.18); padding: 9px 18px; font-size: 13px; font-weight: 700; border-radius: 10px;">
                    ➕ + Nuevo Producto
                </button>
            </div>
        </div>`;
        return;
    }

    // Mostrar artículos con existencias primero y los agotados/vendidos después
    var lista = listaRaw.slice().sort(function(a, b) {
        var sa = (Number(a && a.stock) || 0) > 0 ? 1 : 0;
        var sb = (Number(b && b.stock) || 0) > 0 ? 1 : 0;
        return sb - sa;
    });

    var html = '<div class="inventario-productos-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 16px;">';

    lista.forEach(function(prod) {
        var stock = Math.max(0, Number(prod.stock) || 0);
        var esVU = esProductoVentaUnicaInv(prod);
        var precioCosto = Number(prod.precioCosto != null ? prod.precioCosto : prod.costo) || 0;
        var precioVenta = Number(prod.precioVenta != null ? prod.precioVenta : (prod.costo || 0));
        var ganancia = precioVenta - precioCosto;
        var margenPct = precioVenta > 0 ? ((ganancia / precioVenta) * 100) : 0;
        var enStock = stock > 0;
        var totalVend = Number(prod.totalVendidos) || 0;
        var catNombre = prod.categoriaNombre || (esVU ? "Venta Única" : "General");
        var catIcono = prod.categoriaIcono || (esVU ? "✨" : "🏷️");

        var statusBadge = enStock
            ? `<span style="font-size: 10.5px; font-weight: 800; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span> ${stock} en Stock
               </span>`
            : (esVU
                ? `<span class="badge-vendida-unica-inv">✅ Vendida</span>`
                : `<span style="font-size: 10.5px; font-weight: 800; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 3px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
                    <span style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444; display: inline-block;"></span> Agotado (0)
                   </span>`);

        var catBadgeHtml = (esVU && prod.categoriaId === '__VENTA_UNICA__')
            ? `<span class="badge-venta-unica-inv">✨ Venta Única</span>`
            : `<span style="font-size: 11px; font-weight: 800; color: #94a3b8; background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); padding: 2px 8px; border-radius: 6px;">
                    ${escaparHTMLInv(catIcono)} ${escaparHTMLInv(catNombre)}
               </span>`;

        // Etiquetas (Venta Única, Condición, Marca, Género y Ref Bs)
        var tagsHtml = '';
        if (esVU && prod.categoriaId !== '__VENTA_UNICA__') {
            tagsHtml += `<span class="badge-venta-unica-inv">✨ Venta Única</span>`;
        }
        if (prod.estado && (esVU || prod.estado !== 'Nuevo')) {
            var icoEst = prod.estado === 'Nuevo' ? '✨' : (String(prod.estado).indexOf('Como nuevo') !== -1 ? '💎' : (String(prod.estado).indexOf('detalle') !== -1 ? '🔧' : '✅'));
            tagsHtml += `<span class="badge-condicion-inv">${icoEst} ${escaparHTMLInv(prod.estado)}</span>`;
        }
        if (prod.marca) {
            tagsHtml += `<span style="font-size: 10px; font-weight: 800; background: rgba(255, 255, 255, 0.05); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.08); padding: 2px 7px; border-radius: 5px;">🏷️ ${escaparHTMLInv(prod.marca)}</span>`;
        }
        if (prod.genero && prod.genero !== 'No aplica' && !esVU) {
            tagsHtml += `<span style="font-size: 10px; font-weight: 700; background: rgba(255, 255, 255, 0.05); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.08); padding: 2px 7px; border-radius: 5px;">👤 ${escaparHTMLInv(prod.genero)}</span>`;
        }
        if (prod.monedaOrigenPrecio === 'VES' && Number(prod.precioOriginalBs) > 0) {
            tagsHtml += `<span style="font-size: 10px; font-weight: 700; background: rgba(56, 189, 248, 0.1); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.25); padding: 2px 7px; border-radius: 5px;">💱 Bs. ${Number(prod.precioOriginalBs).toFixed(2)}</span>`;
        }

        // Variantes (Tallas y Colores)
        var variantesHtml = '';
        if (prod.tieneVariantes && Array.isArray(prod.variantes) && prod.variantes.length > 0) {
            variantesHtml = '<div style="margin: 8px 0 10px 0; display: flex; flex-wrap: wrap; gap: 4px;">';
            prod.variantes.forEach(function(v) {
                var vStock = Math.max(0, Number(v.stock) || 0);
                var txtTalla = v.talla ? 'T: ' + escaparHTMLInv(v.talla) : '';
                var txtColor = v.color ? escaparHTMLInv(v.color) : '';
                var txtLabel = [txtTalla, txtColor].filter(Boolean).join(' · ') || 'Var';
                variantesHtml += `<span class="variant-pill ${vStock <= 0 ? 'is-zero' : ''}" title="${txtLabel}: ${vStock} unidades disponibles">
                    ${txtLabel}: <strong>${vStock}</strong>
                </span>`;
            });
            variantesHtml += '</div>';
        }

        var subPrecioHtml = (esVU && precioCosto <= 0)
            ? `<div style="font-size: 10.5px; color: #7dd3fc; margin-top: 2px;">Artículo propio · Sin costo de compra</div>`
            : `<div style="font-size: 10.5px; color: #6b7280; margin-top: 2px;">
                    Costo: <strong>$${precioCosto.toFixed(2)}</strong> · <span style="color: ${ganancia >= 0 ? '#34d399' : '#f87171'}; font-weight: 700;">${ganancia >= 0 ? '+' : ''}${margenPct.toFixed(0)}%</span>
               </div>`;

        html += `
        <div class="card inventario-producto-card ${enStock ? '' : 'is-agotado'}" style="margin-bottom: 0; padding: 16px; border-radius: 14px; background: #121725; border: 1px solid ${esVU && enStock ? 'rgba(56, 189, 248, 0.28)' : 'rgba(255, 255, 255, 0.08)'}; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease;">
            <div>
                <!-- Fila Superior: Categoría / Venta Única y Disponibilidad -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                    ${catBadgeHtml}
                    ${statusBadge}
                </div>

                <!-- Etiquetas de Atributos Rápidos (Condición, Marca y Género) -->
                ${tagsHtml ? `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">${tagsHtml}</div>` : ''}

                <!-- Nombre del Producto -->
                <h4 style="margin: 0 0 6px 0; font-size: 15.5px; font-weight: 800; color: #f8fafc; line-height: 1.35;">
                    ${escaparHTMLInv(prod.nombre)}
                </h4>

                <!-- Descripción / Especificaciones si existe -->
                ${prod.descripcion ? `<p style="margin: 0 0 10px 0; font-size: 11.5px; color: #94a3b8; line-height: 1.45;">${escaparHTMLInv(prod.descripcion)}</p>` : '<div style="margin-bottom: 6px;"></div>'}

                <!-- Pastillas de Variantes (Tallas y Colores) -->
                ${variantesHtml}

                <!-- Métricas Clave: Precios y Rentabilidad -->
                <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 8px; background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px; margin-bottom: 12px;">
                    <div>
                        <span style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Precio de Venta</span>
                        <div style="font-size: 17px; font-weight: 800; color: #f8fafc; margin-top: 1px;">
                            $${precioVenta.toFixed(2)}
                        </div>
                        ${subPrecioHtml}
                    </div>
                    <div>
                        <span style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Existencias</span>
                        <div style="font-size: 16px; font-weight: 800; color: ${enStock ? '#f8fafc' : (esVU ? '#34d399' : '#f87171')}; margin-top: 1px; display: flex; align-items: center; justify-content: space-between;">
                            <span>${stock} unid${stock === 1 ? '' : 's'}</span>
                            <div style="display: flex; gap: 3px;">
                                <button onclick="ajustarStockRapido('${prod.id}', -1)" title="Restar 1 unidad" style="border: 1px solid rgba(255, 255, 255, 0.1); background: #121725; color: #f8fafc; width: 22px; height: 22px; border-radius: 5px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">-</button>
                                <button onclick="ajustarStockRapido('${prod.id}', 1)" title="Sumar 1 unidad" style="border: 1px solid rgba(255, 255, 255, 0.1); background: #121725; color: #f8fafc; width: 22px; height: 22px; border-radius: 5px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">+</button>
                            </div>
                        </div>
                        ${prod.tieneVariantes ? `<div style="font-size: 10px; color: #6b7280; margin-top: 2px;">Con variantes</div>` : ''}
                    </div>
                </div>

                ${totalVend > 0 ? `
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
                    <span>✓</span> ${esVU ? 'Vendido:' : 'Total vendidos históricamente:'} <strong style="color: #f8fafc;">${totalVend} unidad${totalVend === 1 ? '' : 'es'}</strong>
                </div>` : ''}
            </div>

            <!-- Botones de Acción -->
            <div>
                <button type="button" 
                        class="btn-system" 
                        onclick="abrirModalRegistrarVenta('${prod.id}')"
                        style="width: 100%; justify-content: center; font-size: 13px; font-weight: 800; padding: 10px 14px; border-radius: 9px; margin-bottom: 8px; ${enStock ? 'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none;' : 'background: rgba(255, 255, 255, 0.05); color: #9ca3af; border: 1px solid rgba(255, 255, 255, 0.08); cursor: not-allowed;'}"
                        ${enStock ? '' : (esVU ? 'disabled title="Artículo único ya vendido. Si deseas revertir la venta, hazlo en la pestaña Vendidos."' : 'disabled title="Producto agotado. Añade existencias para vender."')}>
                    <span>${enStock ? '💵' : (esVU ? '✅' : '⚠️')}</span> ${enStock ? 'Registrar Venta (Vendido)' : (esVU ? 'Artículo Vendido' : 'Agotado (Sin Stock)')}
                </button>

                <!-- Acciones secundarias: Editar y Eliminar con Confirmación -->
                <div style="display: flex; gap: 6px;">
                    <button type="button" onclick="confirmarEditarProductoInventario('${prod.id}')" style="flex: 1; border: 1px solid rgba(255, 255, 255, 0.08); background: #121725; color: #cbd5e1; padding: 6px 10px; font-size: 11.5px; font-weight: 700; border-radius: 7px; cursor: pointer;" title="Editar artículo">
                        ✏️ Editar
                    </button>
                    <button type="button" onclick="eliminarProductoInventario('${prod.id}')" style="border: 1px solid rgba(239, 68, 68, 0.25); background: rgba(239, 68, 68, 0.1); color: #f87171; padding: 6px 10px; font-size: 11.5px; font-weight: 700; border-radius: 7px; cursor: pointer;" title="Eliminar artículo">
                        🗑️
                    </button>
                </div>
            </div>
        </div>`;
    });

    html += '</div>';
    cont.innerHTML = html;
}

/**
 * Filtro reactivo por búsqueda de texto, tipo, categoría y estado de stock
 */
function filtrarProductosInventario() {
    asegurarEstructuraInventario();
    var txtEl = document.getElementById('inv-filtro-busqueda');
    var tipEl = document.getElementById('inv-filtro-tipo');
    var catEl = document.getElementById('inv-filtro-categoria');
    var stkEl = document.getElementById('inv-filtro-stock');

    var q = txtEl ? txtEl.value.trim().toLowerCase() : '';
    var tipoF = tipEl ? tipEl.value : 'todos';
    var cat = catEl ? catEl.value : 'todas';
    var stk = stkEl ? stkEl.value : 'todos';

    var filtrados = APP_STATE.inventario.productos.filter(function(p) {
        var esVU = esProductoVentaUnicaInv(p);
        var matchTipo = true;
        if (tipoF === 'venta_unica') matchTipo = esVU;
        else if (tipoF === 'catalogo') matchTipo = !esVU;

        var matchTxt = true;
        if (q) {
            var n = (p.nombre || '').toLowerCase();
            var d = (p.descripcion || '').toLowerCase();
            var c = (p.categoriaNombre || '').toLowerCase();
            var m = (p.marca || '').toLowerCase();
            var g = (p.genero || '').toLowerCase();
            var e = (p.estado || '').toLowerCase();
            matchTxt = (n.indexOf(q) !== -1 || d.indexOf(q) !== -1 || c.indexOf(q) !== -1 || m.indexOf(q) !== -1 || g.indexOf(q) !== -1 || e.indexOf(q) !== -1);
        }

        var matchCat = true;
        if (cat !== 'todas') {
            if (cat === '__VENTA_UNICA__') {
                matchCat = esVU;
            } else {
                matchCat = (p.categoriaId === cat || p.categoriaNombre === cat);
            }
        }

        var matchStk = true;
        var s = Number(p.stock) || 0;
        if (stk === 'disponible') {
            matchStk = s > 0;
        } else if (stk === 'agotado') {
            matchStk = s <= 0;
        }

        return matchTipo && matchTxt && matchCat && matchStk;
    });

    renderizarProductosInventario(filtrados);
}

/**
 * Ajuste rápido de stock (+1 o -1) desde la tarjeta
 */
function ajustarStockRapido(productoId, delta) {
    asegurarEstructuraInventario();
    var prod = APP_STATE.inventario.productos.find(function(p) { return p.id === productoId; });
    if (!prod) return;

    if (prod.tieneVariantes && Array.isArray(prod.variantes) && prod.variantes.length > 0) {
        // Si tiene variantes, abrimos el modal de edición para ajustar con precisión la variante deseada
        abrirModalNuevoProducto(productoId);
        return;
    }

    var actual = Number(prod.stock) || 0;
    var nuevo = actual + delta;
    if (nuevo < 0) nuevo = 0;

    prod.stock = nuevo;
    prod.fechaActualizacion = Date.now();
    MonarcaDB.save(APP_STATE);
    
    filtrarProductosInventario();
    actualizarMetricasKpisInventario();
}

// ==========================================================================
// CONTROLADORES DEL MODAL DE PRODUCTO (VARIANTES, COSTO/VENTA Y MARGEN)
// ==========================================================================

function toggleCheckboxVariantes(e) {
    var chk = document.getElementById('modal-prod-tiene-variantes');
    if (!chk) return;
    if (e && e.target === chk) return; // evitamos duplicar clic si se hizo en el input directo
    chk.checked = !chk.checked;
    alCambiarSwitchVariantes();
}

function alCambiarSwitchVariantes() {
    var chk = document.getElementById('modal-prod-tiene-variantes');
    var bloqueVar = document.getElementById('modal-prod-bloque-variantes');
    var bloqueStk = document.getElementById('modal-prod-bloque-stock-simple');
    var listaCont = document.getElementById('modal-prod-lista-variantes');

    var tieneVar = chk && chk.checked;
    if (bloqueVar) bloqueVar.style.display = tieneVar ? 'block' : 'none';
    if (bloqueStk) bloqueStk.style.display = tieneVar ? 'none' : 'block';

    if (tieneVar) {
        if (listaCont && listaCont.children.length === 0) {
            // Añadir al menos dos filas de ejemplo/iniciales
            agregarFilaVariante('S', 'Negro', 1);
            agregarFilaVariante('M', 'Negro', 2);
            agregarFilaVariante('L', 'Negro', 1);
        }
        recalcularTotalStockVariantes();
    }
}

function agregarFilaVariante(talla, color, stock) {
    var listaCont = document.getElementById('modal-prod-lista-variantes');
    if (!listaCont) return;

    var rowId = 'var-row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    var div = document.createElement('div');
    div.className = 'variant-row';
    div.id = rowId;

    div.innerHTML = `
        <div>
            <input type="text" class="modal-input var-input-talla" style="padding: 7px 9px; font-size: 12px; margin-bottom: 0;" placeholder="Talla (S, M, L...)" value="${talla != null ? String(talla).replace(/"/g, '&quot;') : ''}">
        </div>
        <div>
            <input type="text" class="modal-input var-input-color" style="padding: 7px 9px; font-size: 12px; margin-bottom: 0;" placeholder="Color (Negro, Rojo...)" value="${color != null ? String(color).replace(/"/g, '&quot;') : ''}">
        </div>
        <div>
            <input type="number" class="modal-input var-input-stock" style="padding: 7px 9px; font-size: 12px; margin-bottom: 0;" min="0" step="1" placeholder="Cant." value="${stock != null ? stock : 1}" oninput="recalcularTotalStockVariantes()">
        </div>
        <div>
            <button type="button" onclick="eliminarFilaVariante('${rowId}')" style="border: none; background: #fee2e2; color: #b91c1c; border-radius: 6px; width: 30px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 13px;" title="Eliminar fila">🗑️</button>
        </div>
    `;

    listaCont.appendChild(div);
    recalcularTotalStockVariantes();
}

function eliminarFilaVariante(rowId) {
    var fila = document.getElementById(rowId);
    if (fila && fila.parentNode) {
        fila.parentNode.removeChild(fila);
    }
    var listaCont = document.getElementById('modal-prod-lista-variantes');
    if (listaCont && listaCont.children.length === 0) {
        agregarFilaVariante('', '', 1);
    }
    recalcularTotalStockVariantes();
}

function recalcularTotalStockVariantes() {
    var listaCont = document.getElementById('modal-prod-lista-variantes');
    var badgeTotal = document.getElementById('modal-prod-total-stock-variantes');
    var inStk = document.getElementById('modal-prod-stock');

    var total = 0;
    if (listaCont) {
        var inputs = listaCont.querySelectorAll('.var-input-stock');
        inputs.forEach(function(inp) {
            var val = parseInt(inp.value, 10);
            if (!isNaN(val) && val > 0) total += val;
        });
    }

    if (badgeTotal) badgeTotal.textContent = total + " unidades";
    if (inStk) inStk.value = total;
    return total;
}

function seleccionarTipoProductoModal(tipo) {
    var modo = (tipo === 'venta_unica') ? 'venta_unica' : 'catalogo';
    var inTipo = document.getElementById('modal-prod-tipo');
    if (inTipo) inTipo.value = modo;

    var btnCat = document.getElementById('btn-prod-tipo-catalogo');
    var btnVU = document.getElementById('btn-prod-tipo-venta-unica');
    var hintEl = document.getElementById('modal-prod-tipo-hint');
    var icoH = document.getElementById('modal-prod-icono-header');
    var titH = document.getElementById('modal-prod-titulo-header');
    var inCat = document.getElementById('modal-prod-categoria');
    var lblMarca = document.getElementById('label-modal-prod-marca');
    var inMarca = document.getElementById('modal-prod-marca');
    var lblNom = document.getElementById('label-modal-prod-nombre');
    var inNom = document.getElementById('modal-prod-nombre');
    var lblCst = document.getElementById('label-modal-prod-costo');
    var inCst = document.getElementById('modal-prod-costo');
    var hintCst = document.getElementById('hint-modal-prod-costo');
    var lblStk = document.getElementById('label-modal-prod-stock');
    var grpGen = document.getElementById('grupo-modal-prod-genero');
    var inGen = document.getElementById('modal-prod-genero');
    var grpVarToggle = document.getElementById('grupo-modal-prod-variantes-toggle');
    var chkVar = document.getElementById('modal-prod-tiene-variantes');
    var bloqueVar = document.getElementById('modal-prod-bloque-variantes');
    var bloqueStk = document.getElementById('modal-prod-bloque-stock-simple');
    var btnGuardar = document.getElementById('btn-guardar-prod-inv');

    if (modo === 'venta_unica') {
        if (btnVU) btnVU.classList.add('active');
        if (btnCat) btnCat.classList.remove('active');
        if (hintEl) hintEl.style.display = 'block';
        if (icoH) icoH.textContent = '✨';
        if (titH) titH.textContent = _PROD_EDITANDO_ID ? 'EDITAR VENTA ÚNICA' : 'NUEVA VENTA ÚNICA';
        if (lblMarca) lblMarca.textContent = 'Marca / Modelo (Opcional):';
        if (inMarca) inMarca.placeholder = 'Ej: NVIDIA, ASUS, Sony, Samsung...';
        if (lblNom) lblNom.textContent = '¿Qué artículo vas a vender?:';
        if (inNom) inNom.placeholder = 'Ej: Tarjeta de Vídeo RTX 3060 12GB';
        if (lblCst) lblCst.textContent = 'Costo / Inversión ($ Opcional):';
        if (inCst) inCst.placeholder = '0.00 (deja 0 si ya era tuyo)';
        if (hintCst) hintCst.textContent = 'Opcional: déjalo en 0 o vacío si vendes algo personal que ya tenías.';
        if (lblStk) lblStk.textContent = 'Cantidad disponible:';
        if (btnGuardar) btnGuardar.textContent = '✨ Guardar Venta Única';

        if (inCat) inCat.value = '__VENTA_UNICA__';
        if (grpGen) grpGen.style.display = 'none';
        if (inGen) inGen.value = 'No aplica';

        var tieneVarActivas = !!(chkVar && chkVar.checked);
        if (grpVarToggle) grpVarToggle.style.display = tieneVarActivas ? 'flex' : 'none';
        if (!tieneVarActivas) {
            if (bloqueVar) bloqueVar.style.display = 'none';
            if (bloqueStk) bloqueStk.style.display = 'block';
        }
    } else {
        if (btnCat) btnCat.classList.add('active');
        if (btnVU) btnVU.classList.remove('active');
        if (hintEl) hintEl.style.display = 'none';
        if (icoH) icoH.textContent = '📦';
        if (titH) titH.textContent = _PROD_EDITANDO_ID ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO';
        if (lblMarca) lblMarca.textContent = 'Marca / Fabricante (Opcional):';
        if (inMarca) inMarca.placeholder = 'Ej: Nike, Adidas, Puma...';
        if (lblNom) lblNom.textContent = 'Nombre del Producto / Artículo:';
        if (inNom) inNom.placeholder = 'Ej: Franela Dry-Fit Training Manga Corta';
        if (lblCst) lblCst.textContent = 'Precio de Costo ($):';
        if (inCst) inCst.placeholder = 'Ej: 10.00';
        if (hintCst) hintCst.textContent = 'Inversión interna para calcular tu margen de ganancia';
        if (lblStk) lblStk.textContent = 'Cantidad en Stock Inicial:';
        if (btnGuardar) btnGuardar.textContent = '💾 Guardar Producto';

        if (inCat && inCat.value === '__VENTA_UNICA__') {
            var cats = (APP_STATE && APP_STATE.inventario && Array.isArray(APP_STATE.inventario.categorias)) ? APP_STATE.inventario.categorias : [];
            inCat.value = cats.length > 0 ? cats[0].id : '';
        }
        if (grpGen) grpGen.style.display = 'block';
        if (inGen && inGen.value === 'No aplica' && !_PROD_EDITANDO_ID) inGen.value = 'Unisex';
        if (grpVarToggle) grpVarToggle.style.display = 'flex';
    }

    calcularMargenGananciaModal();
}

function actualizarPreviewMonedaProducto() {
    var inVta = document.getElementById('modal-prod-precio-venta');
    var selMon = document.getElementById('modal-prod-moneda');
    var selTasa = document.getElementById('modal-prod-tasa-tipo');
    var prev = document.getElementById('modal-prod-conv-preview');

    var moneda = selMon ? selMon.value : 'USD';
    var tasaTipo = selTasa ? selTasa.value : 'bcv';
    var monto = inVta ? parseFloat(inVta.value) : 0;
    if (isNaN(monto) || monto < 0) monto = 0;

    if (selTasa) {
        selTasa.style.display = (moneda === 'VES') ? '' : 'none';
    }
    if (inVta) {
        inVta.placeholder = (moneda === 'VES') ? 'Ej: 9000.00' : 'Ej: 180.00';
    }

    if (prev) {
        if (moneda === 'VES' && monto > 0) {
            var conv = obtenerConversionPrecioInv(monto, 'VES', tasaTipo);
            prev.style.display = 'block';
            if (conv.valido) {
                prev.className = 'fin-conv-preview';
                prev.textContent = `Equivale a $${conv.usd.toFixed(2)} USD (Tasa ${conv.tasaLabel}: ${Number(conv.tasaUsada).toFixed(2)} Bs/$)`;
            } else {
                prev.className = 'fin-conv-preview is-error';
                prev.textContent = '⚠️ Sin tasa en caché todavía. Actualiza BCV en Finanzas o ingresa el monto en $ USD.';
            }
        } else {
            prev.style.display = 'none';
            prev.textContent = '';
        }
    }

    calcularMargenGananciaModal();
}

function calcularMargenGananciaModal() {
    var inCst = document.getElementById('modal-prod-costo');
    var inVta = document.getElementById('modal-prod-precio-venta');
    var selMon = document.getElementById('modal-prod-moneda');
    var selTasa = document.getElementById('modal-prod-tasa-tipo');
    var inTipo = document.getElementById('modal-prod-tipo');
    var banner = document.getElementById('modal-prod-margen-banner');
    var titulo = document.getElementById('modal-prod-margen-titulo');
    var texto = document.getElementById('modal-prod-margen-texto');

    if (!banner || !texto) return;

    var costo = inCst ? parseFloat(inCst.value) : 0;
    var rawVenta = inVta ? parseFloat(inVta.value) : 0;
    var moneda = selMon ? selMon.value : 'USD';
    var tasaTipo = selTasa ? selTasa.value : 'bcv';
    var tipo = inTipo ? inTipo.value : 'catalogo';

    if (isNaN(costo) || costo < 0) costo = 0;
    if (isNaN(rawVenta) || rawVenta < 0) rawVenta = 0;

    var conv = obtenerConversionPrecioInv(rawVenta, moneda, tasaTipo);
    var venta = conv.valido ? conv.usd : 0;

    if (costo <= 0 && venta <= 0) {
        banner.style.display = 'none';
        return;
    }

    banner.style.display = 'flex';
    if (tipo === 'venta_unica' && costo <= 0 && venta > 0) {
        if (titulo) titulo.textContent = '✨ Ingreso Neto Estimado:';
        banner.className = 'profit-margin-banner is-positive';
        texto.textContent = `+$${venta.toFixed(2)} USD (Artículo propio)`;
        return;
    }

    if (titulo) titulo.textContent = 'Margen de Ganancia Estimado:';
    var ganancia = venta - costo;
    var margenPct = venta > 0 ? ((ganancia / venta) * 100) : (costo > 0 ? -100 : 0);

    if (ganancia >= 0) {
        banner.className = 'profit-margin-banner is-positive';
        texto.textContent = `+$${ganancia.toFixed(2)} (${margenPct.toFixed(1)}% margen)`;
    } else {
        banner.className = 'profit-margin-banner is-negative';
        texto.textContent = `-$${Math.abs(ganancia).toFixed(2)} (${margenPct.toFixed(1)}% pérdida)`;
    }
}

/**
 * Abre el modal para crear o editar un producto o venta única
 */
function abrirModalNuevoProducto(productoId, tipoInicialOpt) {
    asegurarEstructuraInventario();
    actualizarSelectsCategorias();

    var modal = document.getElementById('modal-nuevo-producto');
    if (!modal) return;

    var inId = document.getElementById('modal-prod-id');
    var inCat = document.getElementById('modal-prod-categoria');
    var inNom = document.getElementById('modal-prod-nombre');
    var inMarca = document.getElementById('modal-prod-marca');
    var inGen = document.getElementById('modal-prod-genero');
    var inEst = document.getElementById('modal-prod-estado');
    var inCst = document.getElementById('modal-prod-costo');
    var inVta = document.getElementById('modal-prod-precio-venta');
    var selMon = document.getElementById('modal-prod-moneda');
    var selTasa = document.getElementById('modal-prod-tasa-tipo');
    var inStk = document.getElementById('modal-prod-stock');
    var inDesc = document.getElementById('modal-prod-descripcion');
    var chkVar = document.getElementById('modal-prod-tiene-variantes');
    var listaVar = document.getElementById('modal-prod-lista-variantes');
    var bloqueVar = document.getElementById('modal-prod-bloque-variantes');
    var bloqueStk = document.getElementById('modal-prod-bloque-stock-simple');

    if (listaVar) listaVar.innerHTML = '';

    if (productoId) {
        // Modo edición
        _PROD_EDITANDO_ID = productoId;
        var p = APP_STATE.inventario.productos.find(function(item) { return item.id === productoId; });
        if (!p) return;

        var esVU = esProductoVentaUnicaInv(p);
        var tieneVar = !!(p.tieneVariantes && Array.isArray(p.variantes) && p.variantes.length > 0);
        if (chkVar) chkVar.checked = tieneVar;

        if (tieneVar) {
            if (bloqueVar) bloqueVar.style.display = 'block';
            if (bloqueStk) bloqueStk.style.display = 'none';
            p.variantes.forEach(function(v) {
                agregarFilaVariante(v.talla, v.color, v.stock);
            });
            recalcularTotalStockVariantes();
        } else {
            if (bloqueVar) bloqueVar.style.display = 'none';
            if (bloqueStk) bloqueStk.style.display = 'block';
            if (inStk) inStk.value = p.stock != null ? p.stock : 0;
        }

        seleccionarTipoProductoModal(esVU ? 'venta_unica' : 'catalogo');

        if (inId) inId.value = p.id;
        if (inCat) inCat.value = p.categoriaId || (esVU ? '__VENTA_UNICA__' : '');
        if (inNom) inNom.value = p.nombre || '';
        if (inMarca) inMarca.value = p.marca || '';
        if (inGen) inGen.value = p.genero || (esVU ? 'No aplica' : 'Unisex');
        if (inEst) inEst.value = p.estado || 'Nuevo';

        var cstVal = (p.precioCosto != null && p.precioCosto !== '') ? p.precioCosto : (p.costo || '');
        if (inCst) inCst.value = (esVU && Number(cstVal) === 0) ? '' : cstVal;

        if (p.monedaOrigenPrecio === 'VES' && Number(p.precioOriginalBs) > 0) {
            if (selMon) selMon.value = 'VES';
            if (selTasa) selTasa.value = (p.tasaTipo === 'paralelo') ? 'paralelo' : 'bcv';
            if (inVta) inVta.value = Number(p.precioOriginalBs).toFixed(2);
        } else {
            if (selMon) selMon.value = 'USD';
            if (selTasa) selTasa.value = 'bcv';
            var vtaVal = p.precioVenta != null ? p.precioVenta : (p.costo || '');
            if (inVta) inVta.value = vtaVal;
        }

        if (inDesc) inDesc.value = p.descripcion || '';
    } else {
        // Modo creación
        _PROD_EDITANDO_ID = null;
        if (chkVar) chkVar.checked = false;
        if (bloqueVar) bloqueVar.style.display = 'none';
        if (bloqueStk) bloqueStk.style.display = 'block';

        var modoInicial = (tipoInicialOpt === 'venta_unica') ? 'venta_unica' : 'catalogo';
        seleccionarTipoProductoModal(modoInicial);

        if (inId) inId.value = '';
        if (inNom) inNom.value = '';
        if (inMarca) inMarca.value = '';
        if (inEst) inEst.value = 'Nuevo';
        if (inCst) inCst.value = '';
        if (selMon) selMon.value = 'USD';
        if (selTasa) selTasa.value = 'bcv';
        if (inVta) inVta.value = '';
        if (inStk) inStk.value = '1';
        if (inDesc) inDesc.value = '';
    }

    actualizarPreviewMonedaProducto();
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    if (inNom) setTimeout(function() { inNom.focus(); }, 100);
}

function cerrarModalNuevoProducto() {
    var modal = document.getElementById('modal-nuevo-producto');
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    _PROD_EDITANDO_ID = null;
}

/**
 * Guarda el producto o venta única (creación o edición) con variantes, conversión y márgenes
 */
function guardarProductoInventario() {
    asegurarEstructuraInventario();

    var inTipo = document.getElementById('modal-prod-tipo');
    var inNom = document.getElementById('modal-prod-nombre');
    var inCat = document.getElementById('modal-prod-categoria');
    var inMarca = document.getElementById('modal-prod-marca');
    var inGen = document.getElementById('modal-prod-genero');
    var inEst = document.getElementById('modal-prod-estado');
    var inCst = document.getElementById('modal-prod-costo');
    var inVta = document.getElementById('modal-prod-precio-venta');
    var selMon = document.getElementById('modal-prod-moneda');
    var selTasa = document.getElementById('modal-prod-tasa-tipo');
    var inStk = document.getElementById('modal-prod-stock');
    var inDesc = document.getElementById('modal-prod-descripcion');
    var chkVar = document.getElementById('modal-prod-tiene-variantes');
    var listaVar = document.getElementById('modal-prod-lista-variantes');

    var tipoProd = (inTipo && inTipo.value === 'venta_unica') ? 'venta_unica' : 'catalogo';
    var nombre = inNom ? inNom.value.trim() : '';
    if (!nombre) {
        alert(tipoProd === 'venta_unica'
            ? "Por favor escribe qué artículo vas a vender (ej: Tarjeta de Vídeo RTX 3060 12GB)."
            : "Por favor introduce el nombre del producto (ej: Franela Dry-Fit Training).");
        if (inNom) inNom.focus();
        return;
    }

    var precioCosto = inCst ? parseFloat(inCst.value) : 0;
    if (isNaN(precioCosto) || precioCosto < 0) precioCosto = 0;
    precioCosto = Math.round(precioCosto * 100) / 100;

    var rawVenta = inVta ? parseFloat(inVta.value) : 0;
    if (isNaN(rawVenta) || rawVenta < 0) rawVenta = 0;
    var monedaOrigen = selMon ? selMon.value : 'USD';
    var tasaTipo = (monedaOrigen === 'VES' && selTasa) ? selTasa.value : 'bcv';
    var conv = obtenerConversionPrecioInv(rawVenta, monedaOrigen, tasaTipo);

    if (monedaOrigen === 'VES' && rawVenta > 0 && !conv.valido) {
        alert("No hay tasa BCV o Paralelo guardada para convertir el precio en Bolívares.\n\nActualiza las tasas en Finanzas o cambia el selector a $ USD.");
        return;
    }

    var precioVenta = (monedaOrigen === 'VES') ? conv.usd : (Math.round(rawVenta * 100) / 100);
    var precioOriginalBs = (monedaOrigen === 'VES' && rawVenta > 0) ? conv.bs : 0;

    // Respaldo de compatibilidad para código existente que use p.costo
    var costo = precioVenta > 0 ? precioVenta : precioCosto;

    var marca = inMarca ? inMarca.value.trim() : '';
    var estado = inEst ? inEst.value : 'Nuevo';
    var descripcion = inDesc ? inDesc.value.trim() : '';

    var categoriaId = inCat ? inCat.value : '';
    if (tipoProd === 'venta_unica' && !categoriaId) {
        categoriaId = '__VENTA_UNICA__';
    }

    var esVentaUnica = (tipoProd === 'venta_unica' || categoriaId === '__VENTA_UNICA__');
    var categoriaNombre = "General";
    var categoriaIcono = "🏷️";
    if (categoriaId === '__VENTA_UNICA__') {
        categoriaNombre = "Venta Única";
        categoriaIcono = "✨";
    } else {
        var catEncontrada = APP_STATE.inventario.categorias.find(function(c) { return c.id === categoriaId; });
        if (catEncontrada) {
            categoriaNombre = catEncontrada.nombre;
            categoriaIcono = catEncontrada.icono || "🏷️";
        } else if (esVentaUnica) {
            categoriaNombre = "Venta Única";
            categoriaIcono = "✨";
        }
    }

    var genero = esVentaUnica ? 'No aplica' : (inGen ? inGen.value : 'Unisex');
    var tieneVariantes = !!(chkVar && chkVar.checked);
    var variantesArray = [];
    var stockTotal = 0;

    if (tieneVariantes && listaVar) {
        var filas = listaVar.querySelectorAll('.variant-row');
        filas.forEach(function(fila, idx) {
            var inTalla = fila.querySelector('.var-input-talla');
            var inColor = fila.querySelector('.var-input-color');
            var inStkVar = fila.querySelector('.var-input-stock');

            var tallaVal = inTalla ? inTalla.value.trim() : '';
            var colorVal = inColor ? inColor.value.trim() : '';
            var cantVal = inStkVar ? parseInt(inStkVar.value, 10) : 0;
            if (isNaN(cantVal) || cantVal < 0) cantVal = 0;

            if (tallaVal || colorVal || cantVal > 0) {
                variantesArray.push({
                    id: "VAR-" + Date.now() + "-" + (idx + 1),
                    talla: tallaVal || 'Única',
                    color: colorVal || 'Estándar',
                    stock: cantVal
                });
                stockTotal += cantVal;
            }
        });

        if (variantesArray.length === 0) {
            alert("Has activado variantes pero no has definido ninguna combinación. Añade al menos una variante (Talla/Color) o desactiva la casilla.");
            return;
        }
    } else {
        stockTotal = inStk ? parseInt(inStk.value, 10) : 0;
        if (isNaN(stockTotal) || stockTotal < 0) stockTotal = 0;
    }

    var fechaHoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];

    if (_PROD_EDITANDO_ID) {
        // Actualizar existente
        var p = APP_STATE.inventario.productos.find(function(item) { return item.id === _PROD_EDITANDO_ID; });
        if (p) {
            p.nombre = nombre;
            p.tipoProducto = esVentaUnica ? 'venta_unica' : 'catalogo';
            p.esVentaUnica = esVentaUnica;
            p.precioCosto = precioCosto;
            p.precioVenta = precioVenta;
            p.costo = costo;
            p.monedaOrigenPrecio = monedaOrigen;
            p.precioOriginalBs = precioOriginalBs;
            p.tasaTipo = tasaTipo;
            p.marca = marca;
            p.genero = genero;
            p.estado = estado;
            p.tieneVariantes = tieneVariantes;
            p.variantes = variantesArray;
            p.stock = stockTotal;
            p.categoriaId = categoriaId;
            p.categoriaNombre = categoriaNombre;
            p.categoriaIcono = categoriaIcono;
            p.descripcion = descripcion;
            p.fechaActualizacion = Date.now();
        }
    } else {
        // Prevenir duplicados accidentales
        var yaExisteProd = APP_STATE.inventario.productos.some(function(item) {
            return item && item.nombre && item.nombre.trim().toLowerCase() === nombre.trim().toLowerCase();
        });
        var permitirDuplicadoProd = false;
        if (yaExisteProd) {
            if (!confirm("Ya existe un artículo registrado con el nombre \"" + nombre + "\".\n¿Deseas agregar otro con el mismo nombre?")) {
                return;
            }
            permitirDuplicadoProd = true;
        }

        // Crear nuevo
        var nowProd = Date.now();
        var nuevoProd = {
            id: "PROD-" + nowProd,
            nombre: nombre,
            tipoProducto: esVentaUnica ? 'venta_unica' : 'catalogo',
            esVentaUnica: esVentaUnica,
            precioCosto: precioCosto,
            precioVenta: precioVenta,
            costo: costo,
            monedaOrigenPrecio: monedaOrigen,
            precioOriginalBs: precioOriginalBs,
            tasaTipo: tasaTipo,
            marca: marca,
            genero: genero,
            estado: estado,
            tieneVariantes: tieneVariantes,
            variantes: variantesArray,
            stock: stockTotal,
            categoriaId: categoriaId,
            categoriaNombre: categoriaNombre,
            categoriaIcono: categoriaIcono,
            descripcion: descripcion,
            totalVendidos: 0,
            permitirDuplicadoNombre: permitirDuplicadoProd,
            fechaCreacion: fechaHoy,
            fechaActualizacion: nowProd,
            timestamp: nowProd
        };
        APP_STATE.inventario.productos.unshift(nuevoProd);
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalNuevoProducto();
    filtrarProductosInventario();
    actualizarMetricasKpisInventario();
}

/**
 * Solicita confirmación explícita antes de abrir el modal de edición de un producto
 */
function confirmarEditarProductoInventario(productoId) {
    asegurarEstructuraInventario();
    var p = APP_STATE.inventario.productos.find(function(item) { return item.id === productoId; });
    if (!p) return;

    var stockTxt = p.stock || 0;
    var precioTxt = (parseFloat(p.precioVenta) || 0).toFixed(2);
    var advertencia = `⚠️ CONFIRMACIÓN DE EDICIÓN\n\n¿Deseas modificar los datos de "${p.nombre}"?\n• Stock actual: ${stockTxt} unidades\n• Precio de venta: $${precioTxt}\n\nAsegúrate de guardar los cambios al terminar para mantener tu inventario exacto.`;

    if (confirm(advertencia)) {
        abrirModalNuevoProducto(productoId);
    }
}

/**
 * Elimina un producto tras advertencia explícita de seguridad
 */
function eliminarProductoInventario(productoId) {
    asegurarEstructuraInventario();
    var p = APP_STATE.inventario.productos.find(function(item) { return item.id === productoId; });
    if (!p) return;

    var advertencia = `🚨 ADVERTENCIA DE SEGURIDAD - ELIMINACIÓN PERMANENTE\n\n¿Estás completamente seguro de que deseas ELIMINAR "${p.nombre}" del inventario?\n\n⚠️ Esta acción borrará de forma irreversible su ficha, precios, variantes y existencias (${p.stock || 0} unidades en stock).\n\n¿Deseas continuar y eliminarlo?`;

    if (confirm(advertencia)) {
        if (typeof registrarTombstone === 'function') {
            registrarTombstone('productos', productoId);
        } else {
            if (!APP_STATE._eliminados) APP_STATE._eliminados = { productos: [], categorias: [], ventas: [] };
            if (!Array.isArray(APP_STATE._eliminados.productos)) APP_STATE._eliminados.productos = [];
            APP_STATE._eliminados.productos.push(productoId);
        }

        APP_STATE.inventario.productos = APP_STATE.inventario.productos.filter(function(item) {
            return item.id !== productoId;
        });
        MonarcaDB.save(APP_STATE, true);
        filtrarProductosInventario();
        actualizarMetricasKpisInventario();
        if (typeof actualizarGraficaCobrosCreditoInventario === 'function') {
            actualizarGraficaCobrosCreditoInventario();
        }
    }
}

// ==========================================================================
// 2. GESTIÓN DE CATEGORÍAS
// ==========================================================================

/**
 * Actualiza los selectores desplegables de categorías en filtros y modales
 */
function actualizarSelectsCategorias() {
    asegurarEstructuraInventario();
    var cats = APP_STATE.inventario.categorias;

    // 1. Selector en modal de nuevo producto
    var selModal = document.getElementById('modal-prod-categoria');
    if (selModal) {
        var prevModalVal = selModal.value;
        var optHtml = '';
        if (cats.length === 0) {
            optHtml += '<option value="">(Sin categorías creadas - General)</option>';
        } else {
            cats.forEach(function(c) {
                optHtml += `<option value="${escaparHTMLInv(c.id)}">${escaparHTMLInv(c.icono || '🏷️')} ${escaparHTMLInv(c.nombre)}</option>`;
            });
        }
        optHtml += '<option value="__VENTA_UNICA__">✨ Venta Única</option>';
        selModal.innerHTML = optHtml;
        if (prevModalVal && Array.from(selModal.options).some(function(o) { return o.value === prevModalVal; })) {
            selModal.value = prevModalVal;
        }
    }

    // 2. Selector en filtro de la barra superior
    var selFiltro = document.getElementById('inv-filtro-categoria');
    if (selFiltro) {
        var valActual = selFiltro.value || 'todas';
        var fHtml = '<option value="todas">🏷️ Todas las categorías</option>';
        fHtml += '<option value="__VENTA_UNICA__">✨ Venta Única</option>';
        cats.forEach(function(c) {
            fHtml += `<option value="${escaparHTMLInv(c.id)}">${escaparHTMLInv(c.icono || '🏷️')} ${escaparHTMLInv(c.nombre)}</option>`;
        });
        selFiltro.innerHTML = fHtml;
        selFiltro.value = Array.from(selFiltro.options).some(function(o) { return o.value === valActual; }) ? valActual : 'todas';
    }
}

/**
 * Renderiza el gestor de categorías en la pestaña correspondiente
 */
function renderizarCategoriasInventario() {
    asegurarEstructuraInventario();
    var cont = document.getElementById('contenedor-categorias-inventario');
    if (!cont) return;

    var cats = APP_STATE.inventario.categorias;

    if (!cats || cats.length === 0) {
        cont.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px; border-radius: 16px; border: 1.5px dashed #d1d5db; background: #121725;">
            <div style="font-size: 42px; margin-bottom: 12px;">🏷️</div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #f8fafc;">No tienes categorías creadas</h3>
            <p style="margin: 6px auto 18px auto; max-width: 440px; font-size: 13px; color: #6b7280; line-height: 1.45;">
                Crea categorías para organizar tu catálogo de ventas (ej: "Franelas", "Shorts", "Suplementos", "Zapatos").
            </p>
            <button class="btn-system" onclick="abrirModalNuevaCategoria()" style="background: #111827; color: #ffffff; border: 1px solid #111827; padding: 9px 18px; font-size: 13px; font-weight: 700; border-radius: 10px;">
                🏷️ + Crear Primera Categoría
            </button>
        </div>`;
        return;
    }

    var html = '<div class="inventario-categorias-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">';

    cats.forEach(function(cat) {
        var cantAsoc = APP_STATE.inventario.productos.filter(function(p) {
            return p.categoriaId === cat.id;
        }).length;

        html += `
        <div class="card" style="margin-bottom: 0; padding: 16px; border-radius: 14px; background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 28px; width: 44px; height: 44px; background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    ${cat.icono || '🏷️'}
                </div>
                <div>
                    <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #f8fafc;">${cat.nombre}</h4>
                    <span style="font-size: 11.5px; color: #6b7280; font-weight: 600;">${cantAsoc} producto${cantAsoc === 1 ? '' : 's'}</span>
                </div>
            </div>
            <div style="display: flex; gap: 6px;">
                <button type="button" onclick="abrirModalNuevaCategoria('${cat.id}')" style="border: 1px solid rgba(255, 255, 255, 0.08); background: #121725; color: #cbd5e1; padding: 6px 10px; font-size: 11.5px; font-weight: 700; border-radius: 7px; cursor: pointer;" title="Editar categoría">
                    ✏️
                </button>
                <button type="button" onclick="eliminarCategoriaInventario('${cat.id}')" style="border: 1px solid rgba(239, 68, 68, 0.25); background: rgba(239, 68, 68, 0.1); color: #f87171; padding: 6px 10px; font-size: 11.5px; font-weight: 700; border-radius: 7px; cursor: pointer;" title="Eliminar categoría">
                    🗑️
                </button>
            </div>
        </div>`;
    });

    html += '</div>';
    cont.innerHTML = html;
}

/**
 * Abre el modal para crear o editar una categoría
 */
function abrirModalNuevaCategoria(categoriaId) {
    asegurarEstructuraInventario();
    var modal = document.getElementById('modal-nueva-categoria');
    if (!modal) return;

    var tituloH = document.getElementById('modal-cat-titulo-header');
    var inId = document.getElementById('modal-cat-id');
    var inNom = document.getElementById('modal-cat-nombre');
    var inIcon = document.getElementById('modal-cat-icono');

    if (categoriaId) {
        _CAT_EDITANDO_ID = categoriaId;
        var c = APP_STATE.inventario.categorias.find(function(item) { return item.id === categoriaId; });
        if (!c) return;

        if (tituloH) tituloH.textContent = "EDITAR CATEGORÍA";
        if (inId) inId.value = c.id;
        if (inNom) inNom.value = c.nombre || '';
        if (inIcon) inIcon.value = c.icono || '🏷️';
    } else {
        _CAT_EDITANDO_ID = null;
        if (tituloH) tituloH.textContent = "NUEVA CATEGORÍA";
        if (inId) inId.value = '';
        if (inNom) inNom.value = '';
        if (inIcon) inIcon.value = '👕';
    }

    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    if (inNom) setTimeout(function() { inNom.focus(); }, 100);
}

function abrirModalNuevaCategoriaDesdeProducto() {
    cerrarModalNuevoProducto();
    abrirModalNuevaCategoria();
}

function cerrarModalNuevaCategoria() {
    var modal = document.getElementById('modal-nueva-categoria');
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    _CAT_EDITANDO_ID = null;
}

function seleccionarEmojiCategoria(emoji) {
    var inIcon = document.getElementById('modal-cat-icono');
    if (inIcon) inIcon.value = emoji;
}

/**
 * Guarda o actualiza una categoría
 */
function guardarCategoriaInventario() {
    asegurarEstructuraInventario();

    var inNom = document.getElementById('modal-cat-nombre');
    var inIcon = document.getElementById('modal-cat-icono');

    var nombre = inNom ? inNom.value.trim() : '';
    if (!nombre) {
        alert("Por favor introduce el nombre de la categoría (ej: Franela, Pantalón, Zapatos).");
        if (inNom) inNom.focus();
        return;
    }

    var icono = inIcon ? inIcon.value.trim() : '🏷️';
    if (!icono) icono = '🏷️';

    if (_CAT_EDITANDO_ID) {
        // Actualizar categoría y propagar a los productos
        var c = APP_STATE.inventario.categorias.find(function(item) { return item.id === _CAT_EDITANDO_ID; });
        if (c) {
            c.nombre = nombre;
            c.icono = icono;
            APP_STATE.inventario.productos.forEach(function(p) {
                if (p.categoriaId === _CAT_EDITANDO_ID) {
                    p.categoriaNombre = nombre;
                    p.categoriaIcono = icono;
                }
            });
        }
    } else {
        // Crear nueva
        var nuevaCat = {
            id: "CAT-" + Date.now(),
            nombre: nombre,
            icono: icono,
            fechaCreacion: typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0]
        };
        APP_STATE.inventario.categorias.push(nuevaCat);
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalNuevaCategoria();
    actualizarSelectsCategorias();
    renderizarCategoriasInventario();
    actualizarMetricasKpisInventario();
}

/**
 * Elimina una categoría tras confirmación
 */
function eliminarCategoriaInventario(categoriaId) {
    asegurarEstructuraInventario();
    var c = APP_STATE.inventario.categorias.find(function(item) { return item.id === categoriaId; });
    if (!c) return;

    if (confirm(`¿Estás seguro de eliminar la categoría "${c.nombre}"? Los productos asociados quedarán como "General".`)) {
        if (!APP_STATE._eliminados) APP_STATE._eliminados = { productos: [], categorias: [], ventas: [] };
        if (!Array.isArray(APP_STATE._eliminados.categorias)) APP_STATE._eliminados.categorias = [];
        APP_STATE._eliminados.categorias.push(categoriaId);

        APP_STATE.inventario.categorias = APP_STATE.inventario.categorias.filter(function(item) {
            return item.id !== categoriaId;
        });

        // Actualizar productos asociados
        APP_STATE.inventario.productos.forEach(function(p) {
            if (p.categoriaId === categoriaId) {
                p.categoriaId = "";
                p.categoriaNombre = "General";
                p.categoriaIcono = "🏷️";
            }
        });

        MonarcaDB.save(APP_STATE);
        actualizarSelectsCategorias();
        renderizarCategoriasInventario();
        actualizarMetricasKpisInventario();
    }
}

// ==========================================================================
// 3. MECÁNICA DE VENTA (SELECCIÓN DE VARIANTE, OBSERVACIÓN Y RESTA DE STOCK)
// ==========================================================================

function poblarSelectTarjetaVentaInv() {
    var sel = document.getElementById('modal-venta-tarjeta');
    if (!sel) return;
    var prev = sel.value;
    var html = '<option value="">💵 Caja / Solo registro (sin sumar a tarjeta)</option>';

    if (typeof asegurarArrayTarjetasFinanzas === 'function') {
        var tarjetas = asegurarArrayTarjetasFinanzas();
        var cache = typeof leerCacheTasasBCV === 'function' ? leerCacheTasasBCV() : {};
        tarjetas.forEach(function(t) {
            var est = typeof calcularEstadoTarjetaEnVivo === 'function' ? calcularEstadoTarjetaEnVivo(t, cache) : null;
            var titulo = typeof construirTituloTarjeta === 'function' ? construirTituloTarjeta(t) : (t.alias || t.banco || 'Tarjeta');
            var saldoTxt = '';
            if (est) {
                if (est.monedaBase === 'USD') {
                    var usdFmt = typeof formatearUsdTarjeta === 'function' ? formatearUsdTarjeta(est.saldoUsd) : ('$' + Number(est.saldoUsd || 0).toFixed(2));
                    saldoTxt = ' (' + usdFmt + ' USDT)';
                } else {
                    var bsFmt = typeof formatearTasaBsDisplay === 'function' ? formatearTasaBsDisplay(est.saldoBs, 2) : (Number(est.saldoBs || 0).toFixed(2) + ' Bs.');
                    var eqFmt = typeof formatearUsdTarjeta === 'function' ? formatearUsdTarjeta(est.valorActualUsd) : ('$' + Number(est.valorActualUsd || 0).toFixed(2));
                    saldoTxt = ' (' + bsFmt + ' ≈ ' + eqFmt + ')';
                }
            }
            html += `<option value="${escaparHTMLInv(t.id)}">${escaparHTMLInv(titulo + saldoTxt)}</option>`;
        });
    }

    sel.innerHTML = html;
    if (prev && Array.from(sel.options).some(function(o) { return o.value === prev; })) {
        sel.value = prev;
    } else {
        sel.value = '';
    }
    actualizarPreviewTarjetaVenta();
}

function actualizarVisibilidadTarjetaVenta() {
    var chkFin = document.getElementById('modal-venta-registrar-finanzas');
    var inMod = document.getElementById('modal-venta-modalidad');
    var wrap = document.getElementById('modal-venta-tarjeta-wrap');
    if (!wrap) return;

    var mostrar = (!chkFin || chkFin.checked) && (!inMod || inMod.value !== 'credito');
    wrap.style.display = mostrar ? 'block' : 'none';
    actualizarPreviewTarjetaVenta();
}

function actualizarPreviewTarjetaVenta() {
    var sel = document.getElementById('modal-venta-tarjeta');
    var prev = document.getElementById('modal-venta-tarjeta-preview');
    var wrap = document.getElementById('modal-venta-tarjeta-wrap');
    if (!prev) return;

    var tarjId = sel ? sel.value : '';
    if (!tarjId || (wrap && wrap.style.display === 'none')) {
        prev.style.display = 'none';
        prev.textContent = '';
        return;
    }

    var inCant = document.getElementById('modal-venta-cantidad');
    var inPre = document.getElementById('modal-venta-precio');
    var cant = inCant ? parseInt(inCant.value, 10) : 1;
    if (isNaN(cant) || cant < 1) cant = 1;
    var pre = inPre ? parseFloat(inPre.value) : 0;
    if (isNaN(pre) || pre < 0) pre = 0;
    var total = cant * pre;

    if (total <= 0 || typeof asegurarArrayTarjetasFinanzas !== 'function') {
        prev.style.display = 'none';
        prev.textContent = '';
        return;
    }

    var t = asegurarArrayTarjetasFinanzas().find(function(x) { return x.id === tarjId; });
    if (!t || typeof calcularEstadoTarjetaEnVivo !== 'function') {
        prev.style.display = 'none';
        return;
    }

    var est = calcularEstadoTarjetaEnVivo(t);
    var titulo = typeof construirTituloTarjeta === 'function' ? construirTituloTarjeta(t) : (t.alias || t.banco || 'Tarjeta');
    prev.style.display = 'block';

    if (est.monedaBase === 'USD') {
        prev.className = 'fin-conv-preview';
        prev.textContent = `Acreditará +$${total.toFixed(2)} USDT en ${titulo}`;
    } else if (est.tasaActual > 0) {
        var equivBs = total * est.tasaActual;
        var bsFmt = typeof formatearTasaBsDisplay === 'function' ? formatearTasaBsDisplay(equivBs, 2) : (equivBs.toFixed(2) + ' Bs.');
        prev.className = 'fin-conv-preview';
        prev.textContent = `Acreditará +${bsFmt} en ${titulo} (Tasa ${est.tasaLabel}: ${Number(est.tasaActual).toFixed(2)} Bs/$)`;
    } else {
        prev.className = 'fin-conv-preview is-error';
        prev.textContent = '⚠️ Sin tasa BCV/Paralelo en caché para convertir $ a Bs. en esta tarjeta.';
    }
}

/**
 * Abre el modal para registrar la venta de un producto (con soporte de variantes y tarjetas)
 */
function abrirModalRegistrarVenta(productoId) {
    asegurarEstructuraInventario();
    var p = APP_STATE.inventario.productos.find(function(item) { return item.id === productoId; });
    if (!p) return;

    var stockTotal = Math.max(0, Number(p.stock) || 0);
    if (stockTotal <= 0) {
        alert(`El artículo "${p.nombre}" se encuentra AGOTADO / VENDIDO (0 unidades en stock).`);
        return;
    }

    _VENTA_PROD_ACTUAL = p;

    var modal = document.getElementById('modal-registrar-venta');
    if (!modal) return;

    var inId = document.getElementById('modal-venta-prod-id');
    var badgeCat = document.getElementById('modal-venta-prod-cat');
    var txtNom = document.getElementById('modal-venta-prod-nombre');
    var badgeStock = document.getElementById('modal-venta-prod-stock-badge');
    var inCant = document.getElementById('modal-venta-cantidad');
    var inPre = document.getElementById('modal-venta-precio');
    var inObs = document.getElementById('modal-venta-observacion');
    var bloqueVar = document.getElementById('modal-venta-bloque-variante');
    var selVar = document.getElementById('modal-venta-selector-variante');
    var chkFin = document.getElementById('modal-venta-registrar-finanzas');
    var selTarj = document.getElementById('modal-venta-tarjeta');

    var esVU = esProductoVentaUnicaInv(p);
    if (inId) inId.value = p.id;
    if (badgeCat) {
        badgeCat.textContent = esVU
            ? ('✨ ' + (p.categoriaNombre || 'Venta Única') + (p.estado ? ' · ' + p.estado : ''))
            : ((p.categoriaIcono || '🏷️') + " " + (p.categoriaNombre || "General"));
    }
    if (txtNom) txtNom.textContent = p.nombre;

    var precioSugerido = Number(p.precioVenta != null ? p.precioVenta : (p.costo || 0));
    if (inPre) inPre.value = precioSugerido.toFixed(2);
    if (inObs) inObs.value = "";
    if (inCant) inCant.value = "1";
    if (chkFin) chkFin.checked = true;

    var tieneVar = !!(p.tieneVariantes && Array.isArray(p.variantes) && p.variantes.length > 0);

    if (tieneVar && bloqueVar && selVar) {
        bloqueVar.style.display = 'block';
        var optHtml = '';
        var primerIdDisponible = null;

        p.variantes.forEach(function(v) {
            var vStk = Math.max(0, Number(v.stock) || 0);
            var optDisabled = vStk <= 0 ? 'disabled' : '';
            var labelVar = `${v.talla ? 'Talla: ' + v.talla : ''} ${v.color ? '· Color: ' + v.color : ''} (${vStk} en stock)`.trim();
            if (vStk > 0 && !primerIdDisponible) primerIdDisponible = v.id;
            optHtml += `<option value="${escaparHTMLInv(v.id)}" ${optDisabled}>${escaparHTMLInv(labelVar)}</option>`;
        });

        selVar.innerHTML = optHtml;
        if (primerIdDisponible) selVar.value = primerIdDisponible;
        alSeleccionarVarianteVenta();
    } else {
        if (bloqueVar) bloqueVar.style.display = 'none';
        if (badgeStock) badgeStock.textContent = stockTotal + (stockTotal === 1 ? " unidad disponible" : " unidades disponibles");
        if (inCant) inCant.max = stockTotal;
    }

    poblarSelectTarjetaVentaInv();
    if (selTarj) selTarj.value = '';

    // Inicializar modalidad de pago (Contado por defecto)
    seleccionarModalidadVentaModal('contado');
    var inCli = document.getElementById('modal-venta-cliente');
    if (inCli) inCli.value = '';
    var selNum = document.getElementById('modal-venta-num-cuotas');
    if (selNum) selNum.value = '2';

    actualizarTotalVentaCalculado();
    actualizarVisibilidadTarjetaVenta();
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    if (inObs) setTimeout(function() { inObs.focus(); }, 120);
}

/**
 * Controla la modalidad de pago en el modal de venta (Contado vs Crédito)
 */
function seleccionarModalidadVentaModal(modo) {
    var inMod = document.getElementById('modal-venta-modalidad');
    if (inMod) inMod.value = modo;

    var btnCont = document.getElementById('btn-venta-modo-contado');
    var btnCred = document.getElementById('btn-venta-modo-credito');
    var bloqCred = document.getElementById('modal-venta-bloque-credito');

    if (modo === 'credito') {
        if (btnCred) btnCred.classList.add('active');
        if (btnCont) btnCont.classList.remove('active');
        if (bloqCred) bloqCred.style.display = 'block';
        generarFilasCuotasVenta();
    } else {
        if (btnCont) btnCont.classList.add('active');
        if (btnCred) btnCred.classList.remove('active');
        if (bloqCred) bloqCred.style.display = 'none';
    }

    actualizarVisibilidadTarjetaVenta();
}

/**
 * Evento al cambiar el número de cuotas acordadas
 */
function alCambiarNumeroCuotasVenta() {
    generarFilasCuotasVenta();
}

/**
 * Genera dinámicamente las filas de cuotas para el acuerdo de pago a crédito
 */
function generarFilasCuotasVenta() {
    var contCuotas = document.getElementById('modal-venta-cuotas-lista');
    var selNum = document.getElementById('modal-venta-num-cuotas');
    var inCant = document.getElementById('modal-venta-cantidad');
    var inPre = document.getElementById('modal-venta-precio');

    if (!contCuotas) return;

    var numPartes = selNum ? parseInt(selNum.value, 10) : 1;
    if (isNaN(numPartes) || numPartes < 1) numPartes = 1;

    var cant = inCant ? parseInt(inCant.value, 10) : 1;
    var pre = inPre ? parseFloat(inPre.value) : 0;
    var total = (isNaN(cant) ? 1 : cant) * (isNaN(pre) ? 0 : pre);

    var montoPorParte = numPartes > 0 ? (total / numPartes) : 0;
    var hoy = new Date();

    var html = '';
    for (var i = 1; i <= numPartes; i++) {
        // Fechas sugeridas: si es 1 sola parte diferida, sugerir a 15 días adelante por defecto
        var fechaSugerida = new Date(hoy);
        if (numPartes === 1) {
            fechaSugerida.setDate(hoy.getDate() + 15);
        } else {
            fechaSugerida.setDate(hoy.getDate() + ((i - 1) * 15));
        }
        var strFecha = fechaSugerida.toISOString().split('T')[0];
        var badgeText = (numPartes === 1) ? 'Parte Única (100% a Crédito)' : `Parte ${i} de ${numPartes}`;

        html += `
        <div class="cuota-row-item">
            <div class="cuota-row-badge">
                ${badgeText}
            </div>
            <div>
                <label style="font-size: 10px; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px;">Monto Acordado ($):</label>
                <input type="number" class="modal-input input-cuota-monto" data-cuota-num="${i}" step="0.01" min="0.01" value="${montoPorParte.toFixed(2)}" style="margin-bottom: 0; padding: 6px 10px; font-weight: 800; color: #34d399;">
            </div>
            <div>
                <label style="font-size: 10px; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px;">Fecha de Cobro Acordada:</label>
                <input type="date" class="modal-input input-cuota-fecha" data-cuota-num="${i}" value="${strFecha}" style="margin-bottom: 0; padding: 6px 8px; font-size: 12px;">
            </div>
        </div>`;
    }

    contCuotas.innerHTML = html;
}

/**
 * Se ejecuta al cambiar la variante seleccionada en el modal de venta
 */
function alSeleccionarVarianteVenta() {
    if (!_VENTA_PROD_ACTUAL) return;
    var selVar = document.getElementById('modal-venta-selector-variante');
    var badgeStock = document.getElementById('modal-venta-prod-stock-badge');
    var inCant = document.getElementById('modal-venta-cantidad');

    if (!selVar || !_VENTA_PROD_ACTUAL.variantes) return;

    var varId = selVar.value;
    var vObj = _VENTA_PROD_ACTUAL.variantes.find(function(v) { return v.id === varId; });
    if (!vObj) return;

    var vStk = Math.max(0, Number(vObj.stock) || 0);
    if (badgeStock) {
        var txtTalla = vObj.talla ? 'Talla ' + vObj.talla : '';
        var txtColor = vObj.color ? vObj.color : '';
        var subtitulo = [txtTalla, txtColor].filter(Boolean).join(' · ');
        badgeStock.textContent = `${vStk} unids (${subtitulo})`;
    }
    if (inCant) {
        inCant.max = vStk;
        if (parseInt(inCant.value, 10) > vStk) {
            inCant.value = Math.max(1, vStk);
        }
    }
    actualizarTotalVentaCalculado();
}

function cerrarModalRegistrarVenta() {
    var modal = document.getElementById('modal-registrar-venta');
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    _VENTA_PROD_ACTUAL = null;
}

/**
 * Recalcula el total de la venta en vivo: cantidad × precio unitario
 */
function actualizarTotalVentaCalculado() {
    var inCant = document.getElementById('modal-venta-cantidad');
    var inPre = document.getElementById('modal-venta-precio');
    var lblTotal = document.getElementById('modal-venta-total-calculado');
    var inMod = document.getElementById('modal-venta-modalidad');

    var cant = inCant ? parseInt(inCant.value, 10) : 1;
    if (isNaN(cant) || cant < 1) cant = 1;

    var pre = inPre ? parseFloat(inPre.value) : 0;
    if (isNaN(pre) || pre < 0) pre = 0;

    var total = cant * pre;
    if (lblTotal) lblTotal.textContent = "$" + total.toFixed(2);

    if (inMod && inMod.value === 'credito') {
        generarFilasCuotasVenta();
    }

    actualizarPreviewTarjetaVenta();
}

/**
 * Confirma la venta, resta la cantidad del stock (de la variante o general) y archiva la venta
 */
function confirmarVentaProducto() {
    asegurarEstructuraInventario();

    if (!_VENTA_PROD_ACTUAL) {
        alert("Error: No se encontró el producto a vender.");
        return;
    }

    var prod = APP_STATE.inventario.productos.find(function(p) { return p.id === _VENTA_PROD_ACTUAL.id; });
    if (!prod) {
        alert("Error: El producto ya no existe en el inventario.");
        return;
    }

    var inCant = document.getElementById('modal-venta-cantidad');
    var inPre = document.getElementById('modal-venta-precio');
    var inObs = document.getElementById('modal-venta-observacion');
    var chkFin = document.getElementById('modal-venta-registrar-finanzas');
    var selVar = document.getElementById('modal-venta-selector-variante');
    var selTarj = document.getElementById('modal-venta-tarjeta');

    var cantidad = inCant ? parseInt(inCant.value, 10) : 1;
    if (isNaN(cantidad) || cantidad < 1) {
        alert("Por favor introduce una cantidad válida (mínimo 1).");
        if (inCant) inCant.focus();
        return;
    }

    var tieneVar = !!(prod.tieneVariantes && Array.isArray(prod.variantes) && prod.variantes.length > 0);
    var varianteSeleccionada = null;
    var varianteDetalle = '';

    if (tieneVar) {
        var varId = selVar ? selVar.value : '';
        varianteSeleccionada = prod.variantes.find(function(v) { return v.id === varId; });
        if (!varianteSeleccionada) {
            alert("Por favor selecciona una variante disponible para registrar la venta.");
            return;
        }

        var varStock = Math.max(0, Number(varianteSeleccionada.stock) || 0);
        if (cantidad > varStock) {
            alert(`No puedes vender ${cantidad} unidades de esta variante porque solo quedan ${varStock} en stock.`);
            if (inCant) inCant.focus();
            return;
        }

        varianteDetalle = `${varianteSeleccionada.talla ? 'Talla ' + varianteSeleccionada.talla : ''} ${varianteSeleccionada.color ? '· ' + varianteSeleccionada.color : ''}`.trim();
    } else {
        var stockDisponible = Math.max(0, Number(prod.stock) || 0);
        if (cantidad > stockDisponible) {
            alert(`No puedes vender ${cantidad} unidades porque solo tienes ${stockDisponible} en stock.`);
            if (inCant) inCant.focus();
            return;
        }
    }

    var precioUnitario = inPre ? parseFloat(inPre.value) : Number(prod.precioVenta != null ? prod.precioVenta : (prod.costo || 0));
    if (isNaN(precioUnitario) || precioUnitario < 0) precioUnitario = 0;

    var totalVenta = Math.round((cantidad * precioUnitario) * 100) / 100;
    var observacion = inObs ? inObs.value.trim() : '';

    var inMod = document.getElementById('modal-venta-modalidad');
    var modalidad = inMod ? inMod.value : 'contado';
    var inCli = document.getElementById('modal-venta-cliente');
    var cliente = inCli ? inCli.value.trim() : '';
    var tarjetaContadoId = (modalidad === 'contado' && chkFin && chkFin.checked && selTarj) ? selTarj.value : '';
    var tarjetaContadoTitulo = '';

    if (tarjetaContadoId && totalVenta > 0 && typeof asegurarArrayTarjetasFinanzas === 'function' && typeof calcularEstadoTarjetaEnVivo === 'function') {
        var tarjObj = asegurarArrayTarjetasFinanzas().find(function(x) { return x.id === tarjetaContadoId; });
        if (!tarjObj) {
            alert("La tarjeta seleccionada ya no existe.");
            return;
        }
        var estTarj = calcularEstadoTarjetaEnVivo(tarjObj);
        if (estTarj.monedaBase === 'VES' && !estTarj.tasaActual) {
            alert("No se puede acreditar la venta a esa tarjeta en Bolívares porque aún no hay tasa BCV/Paralelo en caché.\n\nActualiza las tasas en Finanzas o elige 'Caja / Solo registro'.");
            return;
        }
        tarjetaContadoTitulo = typeof construirTituloTarjeta === 'function' ? construirTituloTarjeta(tarjObj) : (tarjObj.alias || tarjObj.banco || 'Tarjeta');
    }

    var fechaHoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
    var horaHoy = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // Cuotas si la venta es a crédito
    var cuotasArr = [];
    if (modalidad === 'credito') {
        var rowsMonto = document.querySelectorAll('#modal-venta-cuotas-lista .input-cuota-monto');
        var rowsFecha = document.querySelectorAll('#modal-venta-cuotas-lista .input-cuota-fecha');

        for (var k = 0; k < rowsMonto.length; k++) {
            var mCuota = parseFloat(rowsMonto[k].value) || 0;
            var fCuota = rowsFecha[k].value || fechaHoy;
            var dCuota = 15;
            if (fCuota && fCuota.indexOf('-') !== -1) {
                var pts = fCuota.split('-');
                if (pts.length >= 3) dCuota = parseInt(pts[2], 10) || 15;
            }
            cuotasArr.push({
                id: "CUOTA-" + Date.now() + "-" + (k + 1),
                numero: (k + 1),
                monto: mCuota,
                fecha: fCuota,
                dia: dCuota,
                cobrado: false
            });
        }

        if (cuotasArr.length === 0) {
            alert("Por favor establece el número de cuotas y fechas del acuerdo de crédito.");
            return;
        }
    }

    var esVU = esProductoVentaUnicaInv(prod);

    // 1. Descontar existencias
    if (tieneVar && varianteSeleccionada) {
        varianteSeleccionada.stock = Math.max(0, (Number(varianteSeleccionada.stock) || 0) - cantidad);
        // Recalcular stock total sumando variantes
        prod.stock = prod.variantes.reduce(function(acc, v) { return acc + (Math.max(0, Number(v.stock) || 0)); }, 0);
    } else {
        prod.stock = Math.max(0, (Number(prod.stock) || 0) - cantidad);
    }
    prod.totalVendidos = (Number(prod.totalVendidos) || 0) + cantidad;
    prod.fechaActualizacion = Date.now();

    // 2. Crear registro de venta para el apartado de Vendidos
    var nowVenta = Date.now();
    var nuevaVenta = {
        id: "VENTA-" + nowVenta,
        productoId: prod.id,
        productoNombre: prod.nombre,
        esVentaUnica: esVU,
        tipoProducto: esVU ? 'venta_unica' : 'catalogo',
        estado: prod.estado || 'Nuevo',
        varianteId: varianteSeleccionada ? varianteSeleccionada.id : null,
        varianteDetalle: varianteDetalle || null,
        categoriaId: prod.categoriaId || '',
        categoriaNombre: prod.categoriaNombre || (esVU ? 'Venta Única' : 'General'),
        categoriaIcono: prod.categoriaIcono || (esVU ? '✨' : '🏷️'),
        marca: prod.marca || '',
        genero: prod.genero || '',
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        totalVenta: totalVenta,
        modalidad: modalidad,
        cliente: cliente,
        tarjetaId: tarjetaContadoId || '',
        tarjetaTitulo: tarjetaContadoTitulo || '',
        cuotas: cuotasArr,
        observacion: observacion,
        fecha: fechaHoy,
        hora: horaHoy,
        timestamp: nowVenta
    };

    APP_STATE.inventario.ventas.unshift(nuevaVenta);

    // 3. Registrar automáticamente en Finanzas (Apartado Almacén & Labores)
    var movTarjetaMsg = '';
    if (chkFin && chkFin.checked && APP_STATE.finanzas) {
        if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];

        if (modalidad === 'credito') {
            // Cada cuota pactada se registra como una entrada independiente vinculada
            cuotasArr.forEach(function(cItem) {
                var sufijoCuota = (cuotasArr.length === 1) ? '(Pago Diferido)' : `(Cuota ${cItem.numero}/${cuotasArr.length})`;
                var conceptoCuota = `Crédito: ${prod.nombre}${varianteDetalle ? ' (' + varianteDetalle + ')' : ''} ${sufijoCuota}${cliente ? ' - ' + cliente : ''}`;
                APP_STATE.finanzas.ingresos.push({
                    id: "ING-CR-" + cItem.id,
                    fuente: conceptoCuota,
                    tipo: 'credito',
                    categoria: esVU ? "Ventas Únicas / Crédito" : "Ventas / Crédito",
                    monto: cItem.monto,
                    fecha: cItem.fecha,
                    dia: cItem.dia,
                    cobrado: false,
                    esVentaUnica: esVU,
                    ventaId: nuevaVenta.id,
                    cuotaId: cItem.id
                });
            });
        } else {
            // Venta al contado: 1 sola entrada cobrada de inmediato
            var descFinanza = `${esVU ? 'Venta Única' : 'Venta'}: ${prod.nombre}${varianteDetalle ? ' (' + varianteDetalle + ')' : ''} (${cantidad} unid${cantidad > 1 ? 'es' : ''})${cliente ? ' - ' + cliente : ''}${observacion ? ' - ' + observacion : ''}`;
            var ingAlmacen = {
                id: "ING-V-" + nowVenta,
                fuente: descFinanza,
                tipo: 'almacen',
                categoria: esVU ? "Venta Única / Artículo Propio" : "Ventas / Almacén",
                monto: totalVenta,
                fecha: fechaHoy,
                dia: new Date().getDate(),
                cobrado: true,
                esVentaUnica: esVU,
                ventaId: nuevaVenta.id
            };

            if (tarjetaContadoId && totalVenta > 0 && typeof aplicarTarjetasMovimientoFinanzas === 'function') {
                var movsAplicados = aplicarTarjetasMovimientoFinanzas(
                    ingAlmacen,
                    true,
                    [{ tarjetaId: tarjetaContadoId, montoUsd: totalVenta }],
                    descFinanza
                );
                if (movsAplicados && movsAplicados.length > 0) {
                    movTarjetaMsg = `\n• Acreditado a tarjeta: ${tarjetaContadoTitulo}`;
                }
            }

            APP_STATE.finanzas.ingresos.push(ingAlmacen);
        }
    }

    // Persistir
    MonarcaDB.save(APP_STATE);
    cerrarModalRegistrarVenta();

    // Actualizar interfaz
    filtrarProductosInventario();
    actualizarMetricasKpisInventario();
    if (typeof poblarSelectsTarjetasFinanzas === 'function') poblarSelectsTarjetasFinanzas();
    if (typeof renderizarFinanzasSiActivo === 'function') renderizarFinanzasSiActivo();

    var detalleFinal = varianteDetalle ? ` [${varianteDetalle}]` : '';
    var modalMsg = modalidad === 'credito' 
        ? (cuotasArr.length === 1 ? '\n• Modalidad: A Crédito en 1 parte (Pago Diferido)' : `\n• Modalidad: A Crédito en ${cuotasArr.length} cuotas pactadas`)
        : '\n• Modalidad: Al Contado (Cobrado)';
    alert(`✓ ¡Venta registrada exitosamente!

• ${esVU ? 'Artículo' : 'Producto'}: ${prod.nombre}${detalleFinal}
• Unidades vendidas: ${cantidad}
• Stock restante: ${prod.stock} unids
• Total: $${totalVenta.toFixed(2)}${modalMsg}${movTarjetaMsg}
• Observación: "${observacion || 'Sin observación'}"`);
}

// ==========================================================================
// 4. APARTADO DE VENDIDOS (HISTORIAL DE VENTAS)
// ==========================================================================

/**
 * Renderiza el listado completo de productos vendidos
 */
function renderizarVendidosInventario(listaManual) {
    asegurarEstructuraInventario();
    var cont = document.getElementById('contenedor-ventas-inventario');
    if (!cont) return;

    var ventas = listaManual || APP_STATE.inventario.ventas;

    if (!ventas || ventas.length === 0) {
        cont.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px; border-radius: 16px; border: 1.5px dashed #d1d5db; background: #121725;">
            <div style="font-size: 42px; margin-bottom: 12px;">💰</div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #f8fafc;">No tienes ventas registradas</h3>
            <p style="margin: 6px auto 18px auto; max-width: 440px; font-size: 13px; color: #6b7280; line-height: 1.45;">
                Cuando registres ventas de tus productos o artículos personales aparecerán en este historial con su fecha, unidades, monto recaudado y tu observación.
            </p>
            <button class="btn-system" onclick="cambiarTabInventario('productos')" style="background: #111827; color: #ffffff; border: 1px solid #111827; padding: 9px 18px; font-size: 13px; font-weight: 700; border-radius: 10px;">
                📦 Ir a Productos en Stock
            </button>
        </div>`;
        if (!listaManual && typeof actualizarGraficaCobrosCreditoInventario === 'function') {
            actualizarGraficaCobrosCreditoInventario();
        }
        return;
    }

    var html = '<div class="inventario-ventas-list" style="display: flex; flex-direction: column; gap: 12px;">';

    ventas.forEach(function(venta) {
        var cant = Number(venta.cantidad) || 1;
        var unit = Number(venta.precioUnitario) || 0;
        var total = Number(venta.totalVenta) || (cant * unit);
        var esVU = esProductoVentaUnicaInv(venta);

        var esCredito = venta.modalidad === 'credito';
        var cuotas = Array.isArray(venta.cuotas) ? venta.cuotas : [];

        var totalCobrado = 0;
        if (esCredito) {
            cuotas.forEach(function(cq) {
                if (cq.cobrado) totalCobrado += (Number(cq.monto) || 0);
            });
        } else {
            totalCobrado = total;
        }

        var badgeModalidadHtml = esCredito
            ? `<span class="badge-pago-credito">💳 Crédito (${cuotas.length === 1 ? '1 parte diferida' : cuotas.length + ' cuotas'})</span>`
            : `<span class="badge-pago-contado">💵 Al Contado</span>`;

        var htmlCuotasBloque = '';
        if (esCredito && cuotas.length > 0) {
            htmlCuotasBloque = `
            <div style="margin-top: 10px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 10px 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Acuerdo de Cuotas:</span>
                    <span style="font-size: 11.5px; font-weight: 700; color: #cbd5e1;">Cobrado: $${totalCobrado.toFixed(2)} / $${total.toFixed(2)}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">`;

            cuotas.forEach(function(cq) {
                var yaCobrada = !!cq.cobrado;
                var mMonto = (Number(cq.monto) || 0).toFixed(2);
                var labelParteVendidos = (cuotas.length === 1) ? 'Parte Única' : `Parte ${cq.numero}`;
                htmlCuotasBloque += `
                <div class="cuota-card-vendidos ${yaCobrada ? 'cobrada' : 'pendiente'}">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 12px; font-weight: 800; color: #f8fafc;">${labelParteVendidos}: $${mMonto}</span>
                        <span style="font-size: 11px; color: #94a3b8;">📅 Acordado: ${escaparHTMLInv(cq.fecha)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        ${yaCobrada
                            ? `<span style="font-size: 10.5px; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 2px 7px; border-radius: 5px;">✅ Cobrada</span>
                               <button type="button" class="btn-cobrar-ingreso btn-deshacer-cobro" onclick="deshacerCobroCuotaVentaUI('${escaparHTMLInv(venta.id)}', '${escaparHTMLInv(cq.id)}')" title="Desmarcar cobro de esta cuota">↩</button>`
                            : `<span style="font-size: 10.5px; font-weight: 700; color: #fbbf24; background: rgba(245, 158, 11, 0.12); padding: 2px 7px; border-radius: 5px;">⏳ Pendiente</span>
                               <button type="button" class="btn-cobrar-ingreso" onclick="cobrarCuotaVentaUI('${escaparHTMLInv(venta.id)}', '${escaparHTMLInv(cq.id)}')" title="Cobrar cuota (elige tarjeta en Finanzas)">💰 Cobrar</button>`
                        }
                    </div>
                </div>`;
            });

            htmlCuotasBloque += `</div></div>`;
        }

        html += `
        <div class="card inventario-venta-card" style="margin-bottom: 0; padding: 16px 18px; border-radius: 14px; background: #121725; border: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px;">
            <div style="flex: 1; min-width: 240px;">
                <!-- Fila de Metadatos: Categoría, Venta Única, Modalidad y Fecha/Hora -->
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                    ${(esVU && venta.categoriaId === '__VENTA_UNICA__')
                        ? '<span class="badge-venta-unica-inv">✨ Venta Única</span>'
                        : `<span style="font-size: 11px; font-weight: 800; background: rgba(255, 255, 255, 0.05); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.08); padding: 2px 8px; border-radius: 6px;">
                                ${escaparHTMLInv(venta.categoriaIcono || '🏷️')} ${escaparHTMLInv(venta.categoriaNombre || 'General')}
                           </span>${esVU ? '<span class="badge-venta-unica-inv">✨ Venta Única</span>' : ''}`
                    }
                    ${badgeModalidadHtml}
                    ${venta.tarjetaTitulo ? `<span style="font-size: 10.5px; font-weight: 700; background: rgba(16, 185, 129, 0.14); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); padding: 2px 7px; border-radius: 6px;">💳 ${escaparHTMLInv(venta.tarjetaTitulo)}</span>` : ''}
                    ${venta.cliente ? `<span style="font-size: 11px; font-weight: 700; background: rgba(56, 189, 248, 0.12); color: #38bdf8; padding: 2px 8px; border-radius: 6px;">👤 ${escaparHTMLInv(venta.cliente)}</span>` : ''}
                    ${venta.marca ? `<span style="font-size: 10.5px; font-weight: 700; background: rgba(255, 255, 255, 0.05); color: #94a3b8; padding: 2px 6px; border-radius: 5px;">🏷️ ${escaparHTMLInv(venta.marca)}</span>` : ''}
                    <span style="font-size: 11.5px; color: #6b7280; font-weight: 600;">
                        📅 ${escaparHTMLInv(venta.fecha)} ${venta.hora ? '· ' + escaparHTMLInv(venta.hora) : ''}
                    </span>
                </div>

                <!-- Nombre del Producto Vendido y Variante -->
                <h4 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span>${escaparHTMLInv(venta.productoNombre)}</span>
                    ${venta.varianteDetalle ? `<span class="variant-pill" style="font-size: 11.5px; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">👕 ${escaparHTMLInv(venta.varianteDetalle)}</span>` : ''}
                </h4>

                <!-- Cantidad y Precio -->
                <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 10px;">
                    Cantidad: <strong style="color: #f8fafc;">${cant} unid${cant > 1 ? 'es' : ''}</strong> · Precio unitario: <strong>$${unit.toFixed(2)}</strong>
                </div>

                <!-- Observación (Requerimiento explícito) -->
                <div style="background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.08); border-left: 3.5px solid #111827; border-radius: 8px; padding: 8px 12px; font-size: 12.5px; color: #cbd5e1; line-height: 1.45;">
                    <strong style="color: #f8fafc;">📝 Observación:</strong> 
                    <span>${venta.observacion ? escaparHTMLInv(venta.observacion) : '<em style="color: #9ca3af;">Sin observación registrada</em>'}</span>
                </div>

                <!-- Desglose de cuotas si es a crédito -->
                ${htmlCuotasBloque}
            </div>

            <!-- Columna Derecha: Monto Total y Botón Revertir -->
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; min-height: 80px;">
                <div>
                    <span style="font-size: 10.5px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">${esCredito ? 'TOTAL VENTA' : 'TOTAL COBRADO'}</span>
                    <div style="font-size: 22px; font-weight: 800; color: #f8fafc; margin-top: 1px;">
                        $${total.toFixed(2)}
                    </div>
                    ${esCredito ? `<div style="font-size: 11px; font-weight: 700; color: ${totalCobrado >= total ? '#10b981' : '#fbbf24'};">En Cuenta: $${totalCobrado.toFixed(2)}</div>` : ''}
                </div>
                <button type="button" 
                        onclick="anularVentaInventario('${escaparHTMLInv(venta.id)}')" 
                        style="border: 1px solid rgba(255, 255, 255, 0.08); background: #121725; color: #6b7280; padding: 5px 10px; font-size: 11px; font-weight: 700; border-radius: 7px; cursor: pointer; transition: all 0.2s ease; margin-top: 12px;" 
                        title="Anular venta y reincorporar las unidades al stock">
                    ↩ Revertir Venta (+${cant} stock)
                </button>
            </div>
        </div>`;
    });

    html += '</div>';
    cont.innerHTML = html;

    if (!listaManual && typeof actualizarGraficaCobrosCreditoInventario === 'function') {
        actualizarGraficaCobrosCreditoInventario();
    }
}

/**
 * Marca una cuota de venta a crédito como cobrada (usando el modal Finanzas cuando existe enlace)
 */
function cobrarCuotaVentaUI(ventaId, cuotaId) {
    asegurarEstructuraInventario();
    var venta = APP_STATE.inventario.ventas.find(function(v) { return v.id === ventaId; });
    if (!venta || !Array.isArray(venta.cuotas)) return;

    var cuota = venta.cuotas.find(function(c) { return c.id === cuotaId; });
    if (!cuota) return;

    if (APP_STATE.finanzas && Array.isArray(APP_STATE.finanzas.ingresos)) {
        var ing = APP_STATE.finanzas.ingresos.find(function(ig) {
            return (ig.ventaId === ventaId && ig.cuotaId === cuotaId) || ig.id === ('ING-CR-' + cuotaId);
        });
        if (ing) {
            if (typeof cobrarIngresoUI === 'function' && document.getElementById('modal-confirmar-cobro-ingreso')) {
                cobrarIngresoUI(ing.id);
                return;
            }
            ing.cobrado = true;
            ing.fechaCobro = new Date().toISOString();
        }
    }

    cuota.cobrado = true;
    cuota.fechaCobrado = new Date().toISOString();

    MonarcaDB.save(APP_STATE);
    renderizarVendidosInventario();
    if (typeof renderizarFinanzasSiActivo === 'function') renderizarFinanzasSiActivo();
}

/**
 * Deshace el cobro de una cuota de venta a crédito y revierte tarjetas/Finanzas
 */
function deshacerCobroCuotaVentaUI(ventaId, cuotaId) {
    asegurarEstructuraInventario();
    var venta = APP_STATE.inventario.ventas.find(function(v) { return v.id === ventaId; });
    if (!venta || !Array.isArray(venta.cuotas)) return;

    var cuota = venta.cuotas.find(function(c) { return c.id === cuotaId; });
    if (!cuota) return;

    if (APP_STATE.finanzas && Array.isArray(APP_STATE.finanzas.ingresos)) {
        var ing = APP_STATE.finanzas.ingresos.find(function(ig) {
            return (ig.ventaId === ventaId && ig.cuotaId === cuotaId) || ig.id === ('ING-CR-' + cuotaId);
        });
        if (ing) {
            if (typeof deshacerCobroIngresoUI === 'function') {
                deshacerCobroIngresoUI(ing.id);
                return;
            }
            if (typeof revertirTarjetasMovimientoFinanzas === 'function') {
                revertirTarjetasMovimientoFinanzas(ing, true);
            }
            ing.cobrado = false;
            delete ing.montoCobrado;
            delete ing.fechaCobro;
        }
    }

    cuota.cobrado = false;
    delete cuota.fechaCobrado;

    MonarcaDB.save(APP_STATE);
    renderizarVendidosInventario();
    if (typeof renderizarFinanzasSiActivo === 'function') renderizarFinanzasSiActivo();
}

/**
 * Filtro de búsqueda en la pestaña de ventas
 */
function filtrarVentasInventario() {
    asegurarEstructuraInventario();
    var txtEl = document.getElementById('inv-filtro-busqueda-ventas');
    var q = txtEl ? txtEl.value.trim().toLowerCase() : '';

    if (!q) {
        renderizarVendidosInventario();
        return;
    }

    var filtradas = APP_STATE.inventario.ventas.filter(function(v) {
        var n = (v.productoNombre || '').toLowerCase();
        var o = (v.observacion || '').toLowerCase();
        var c = (v.categoriaNombre || '').toLowerCase();
        var varDet = (v.varianteDetalle || '').toLowerCase();
        var f = (v.fecha || '').toLowerCase();
        var cli = (v.cliente || '').toLowerCase();
        return (n.indexOf(q) !== -1 || o.indexOf(q) !== -1 || c.indexOf(q) !== -1 || varDet.indexOf(q) !== -1 || f.indexOf(q) !== -1 || cli.indexOf(q) !== -1);
    });

    renderizarVendidosInventario(filtradas);
}

/**
 * Anula una venta, devuelve las unidades al stock y revierte tarjetas/Finanzas asociadas
 */
function anularVentaInventario(ventaId) {
    asegurarEstructuraInventario();
    var venta = APP_STATE.inventario.ventas.find(function(v) { return v.id === ventaId; });
    if (!venta) return;

    var cant = Number(venta.cantidad) || 1;
    var confirmMsg = `¿Deseas revertir esta venta?

• Artículo: ${venta.productoNombre}${venta.varianteDetalle ? ' (' + venta.varianteDetalle + ')' : ''}
• Se reincorporarán ${cant} unidad(es) al stock.
• Se eliminará del historial de vendidos${venta.tarjetaTitulo ? ' y se revertirá el ingreso en ' + venta.tarjetaTitulo : ''}.`;

    if (confirm(confirmMsg)) {
        // Devolver stock al producto si aún existe
        var prod = APP_STATE.inventario.productos.find(function(p) { return p.id === venta.productoId; });
        if (prod) {
            prod.stock = (Number(prod.stock) || 0) + cant;
            prod.totalVendidos = Math.max(0, (Number(prod.totalVendidos) || 0) - cant);

            // Devolver stock a la variante específica si corresponde
            if (venta.varianteId && Array.isArray(prod.variantes)) {
                var vr = prod.variantes.find(function(v) { return v.id === venta.varianteId; });
                if (vr) {
                    vr.stock = (Number(vr.stock) || 0) + cant;
                }
            }
            prod.fechaActualizacion = Date.now();
        }

        // Eliminar del historial de ventas y registrar tombstone
        if (typeof registrarTombstone === 'function') {
            registrarTombstone('ventas', ventaId);
        } else {
            if (!APP_STATE._eliminados) APP_STATE._eliminados = { productos: [], categorias: [], ventas: [] };
            if (!Array.isArray(APP_STATE._eliminados.ventas)) APP_STATE._eliminados.ventas = [];
            APP_STATE._eliminados.ventas.push(ventaId);
        }

        APP_STATE.inventario.ventas = APP_STATE.inventario.ventas.filter(function(v) {
            return v.id !== ventaId;
        });

        // Limpiar los ingresos registrados en Finanzas asociados a esta venta y revertir tarjetas cobradas
        if (APP_STATE.finanzas && Array.isArray(APP_STATE.finanzas.ingresos)) {
            APP_STATE.finanzas.ingresos.forEach(function(ig) {
                if (ig && ig.ventaId === ventaId) {
                    if (ig.cobrado && typeof revertirTarjetasMovimientoFinanzas === 'function') {
                        revertirTarjetasMovimientoFinanzas(ig, true);
                    }
                    if (ig.id && typeof registrarTombstone === 'function') {
                        registrarTombstone('finanzas_ingresos', ig.id);
                    }
                }
            });
            APP_STATE.finanzas.ingresos = APP_STATE.finanzas.ingresos.filter(function(ig) {
                return ig.ventaId !== ventaId;
            });
        }

        MonarcaDB.save(APP_STATE, true);
        renderizarVendidosInventario();
        filtrarProductosInventario();
        actualizarMetricasKpisInventario();
        if (typeof poblarSelectsTarjetasFinanzas === 'function') poblarSelectsTarjetasFinanzas();
        if (typeof actualizarGraficaCobrosCreditoInventario === 'function') {
            actualizarGraficaCobrosCreditoInventario();
        }
        if (typeof renderizarFinanzasSiActivo === 'function') renderizarFinanzasSiActivo();
        alert(`✓ Venta anulada con éxito. Se reincorporaron ${cant} unidad(es) al inventario y se limpiaron sus registros financieros.`);
    }
}

// ==========================================================================
// 5. MOTOR DE PROYECCIÓN DE COBROS A CRÉDITO & REINVERSIÓN (v10.29)
// ==========================================================================

var CHART_COBROS_CREDITO = null;

function toggleGraficaCobrosCredito() {
    var cont = document.getElementById('contenedor-canvas-cobros-credito');
    var btn = document.getElementById('btn-toggle-grafico-cobros');
    if (!cont) return;
    if (cont.style.display === 'none') {
        cont.style.display = 'block';
        if (btn) btn.innerText = '▲ Ocultar';
        actualizarGraficaCobrosCreditoInventario();
    } else {
        cont.style.display = 'none';
        if (btn) btn.innerText = '▼ Ver Proyección';
    }
}

/**
 * Agrupa todas las cuotas de crédito pendientes por fecha de cobro y renderiza
 * la gráfica de volumen de dinero y personas para reinvertir capital
 */
function actualizarGraficaCobrosCreditoInventario() {
    asegurarEstructuraInventario();
    var canvas = document.getElementById('graficoCobrosCredito');
    if (!canvas) return;

    var ventas = APP_STATE.inventario.ventas || [];
    var cuotasPorFecha = {};
    var totalPendiente = 0;
    var cuotasPendientesCount = 0;

    ventas.forEach(function(v) {
        if (v.modalidad === 'credito' && Array.isArray(v.cuotas)) {
            var clienteNombre = v.cliente ? v.cliente.trim() : 'Cliente sin nombre';
            v.cuotas.forEach(function(c) {
                if (!c.cobrado) {
                    var m = parseFloat(c.monto) || 0;
                    totalPendiente += m;
                    cuotasPendientesCount++;

                    // Normalizar fecha de cobro (YYYY-MM-DD o 'Día X')
                    var fKey = c.fecha || (c.dia ? ('Día ' + c.dia) : (v.fecha || 'Sin fecha'));
                    if (!cuotasPorFecha[fKey]) {
                        cuotasPorFecha[fKey] = {
                            fecha: fKey,
                            montoTotal: 0,
                            personasCount: 0,
                            clientes: []
                        };
                    }
                    cuotasPorFecha[fKey].montoTotal += m;
                    cuotasPorFecha[fKey].personasCount++;
                    if (!cuotasPorFecha[fKey].clientes.includes(clienteNombre)) {
                        cuotasPorFecha[fKey].clientes.push(clienteNombre);
                    }
                }
            });
        }
    });

    // Actualizar tarjetas de Mini KPIs
    var elTotal = document.getElementById('inv-kpi-total-credito-pendiente');
    var elCount = document.getElementById('inv-kpi-cuotas-pendientes-count');
    var elMayor = document.getElementById('inv-kpi-mayor-monto-dia');
    var elBadgePico = document.getElementById('badge-pico-reinversion');

    if (elTotal) elTotal.innerText = '$' + totalPendiente.toFixed(2);
    if (elCount) elCount.innerText = cuotasPendientesCount + ' ' + (cuotasPendientesCount === 1 ? 'cuota' : 'cuotas');

    var fechasOrdenadas = Object.keys(cuotasPorFecha).sort(function(a, b) {
        return a.localeCompare(b);
    });

    var maxMonto = 0;
    var fechaPico = 'Sin cobros';
    var maxPersonas = 0;

    fechasOrdenadas.forEach(function(f) {
        var obj = cuotasPorFecha[f];
        if (obj.montoTotal > maxMonto) {
            maxMonto = obj.montoTotal;
            fechaPico = f;
            maxPersonas = obj.personasCount;
        }
    });

    if (elMayor) elMayor.innerText = '$' + maxMonto.toFixed(2);
    if (elBadgePico) {
        if (maxMonto > 0) {
            elBadgePico.innerText = '🔥 Día Pico: ' + fechaPico + ' ($' + maxMonto.toFixed(2) + ' · ' + maxPersonas + ' pers.)';
            elBadgePico.title = 'Mayor volumen de cobro para reinversión';
        } else {
            elBadgePico.innerText = '✅ Sin cobros pendientes';
        }
    }

    if (typeof Chart === 'undefined') return;

    if (CHART_COBROS_CREDITO) {
        CHART_COBROS_CREDITO.destroy();
        CHART_COBROS_CREDITO = null;
    }

    if (fechasOrdenadas.length === 0) {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    var labels = [];
    var montosData = [];
    var backgroundColors = [];
    var borderColors = [];

    fechasOrdenadas.forEach(function(f) {
        var obj = cuotasPorFecha[f];
        var lbl = f;
        if (f.match(/^\d{4}-\d{2}-\d{2}$/)) {
            var parts = f.split('-');
            var meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            var mIndex = parseInt(parts[1], 10) - 1;
            lbl = parseInt(parts[2], 10) + ' ' + (meses[mIndex] || parts[1]);
        }
        labels.push(lbl + ' (' + obj.personasCount + ' ' + (obj.personasCount === 1 ? 'pers' : 'pers') + ')');
        montosData.push(Math.round(obj.montoTotal * 100) / 100);

        if (f === fechaPico && maxMonto > 0) {
            backgroundColors.push('rgba(16, 185, 129, 0.45)');
            borderColors.push('#10b981');
        } else {
            backgroundColors.push('rgba(56, 189, 248, 0.35)');
            borderColors.push('#38bdf8');
        }
    });

    var ctx = canvas.getContext('2d');
    CHART_COBROS_CREDITO = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monto a Cobrar ($)',
                data: montosData,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            var idx = context.dataIndex;
                            var f = fechasOrdenadas[idx];
                            var obj = cuotasPorFecha[f];
                            var clientesStr = obj.clientes.length > 0 ? (' · ' + obj.clientes.join(', ')) : '';
                            return 'Monto: $' + context.raw.toFixed(2) + ' (' + obj.personasCount + ' pers.' + clientesStr + ')';
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 10 },
                        callback: function(v) { return '$' + v; }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            }
        }
    });
}

