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
        renderizarProductosInventario();
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
}

// ==========================================================================
// 1. GESTIÓN DE PRODUCTOS (STOCK ACTIVO, VARIANTES Y RENTABILIDAD)
// ==========================================================================

/**
 * Renderiza el listado de productos activos en stock
 */
function renderizarProductosInventario(listaManual) {
    asegurarEstructuraInventario();
    var cont = document.getElementById('contenedor-productos-inventario');
    if (!cont) return;

    var lista = listaManual || APP_STATE.inventario.productos;

    if (!lista || lista.length === 0) {
        var tieneCategorias = APP_STATE.inventario.categorias.length > 0;
        cont.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px; border-radius: 16px; border: 1.5px dashed #d1d5db; background: #ffffff;">
            <div style="font-size: 42px; margin-bottom: 12px;">📦</div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #111827;">No tienes productos en inventario</h3>
            <p style="margin: 6px auto 18px auto; max-width: 440px; font-size: 13px; color: #6b7280; line-height: 1.45;">
                ${tieneCategorias 
                    ? 'Agrega tus productos indicando costo, precio de venta, tallas/colores o stock simple para comenzar a registrar ventas.' 
                    : 'Te recomendamos crear primero tus categorías (ej: "Franelas", "Pantalones", "Calzado") y luego añadir tus productos.'}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                ${!tieneCategorias ? `
                <button class="btn-system" onclick="abrirModalNuevaCategoria()" style="background: #ffffff; color: #111827; border: 1px solid #d1d5db; padding: 9px 16px; font-size: 13px; font-weight: 700; border-radius: 10px;">
                    🏷️ Crear Primera Categoría
                </button>` : ''}
                <button class="btn-system" onclick="abrirModalNuevoProducto()" style="background: #111827; color: #ffffff; border: 1px solid #111827; padding: 9px 18px; font-size: 13px; font-weight: 700; border-radius: 10px;">
                    ➕ + Agregar Nuevo Producto
                </button>
            </div>
        </div>`;
        return;
    }

    var html = '<div class="inventario-productos-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 16px;">';

    lista.forEach(function(prod) {
        var stock = Math.max(0, Number(prod.stock) || 0);
        var precioCosto = Number(prod.precioCosto != null ? prod.precioCosto : prod.costo) || 0;
        var precioVenta = Number(prod.precioVenta != null ? prod.precioVenta : (prod.costo || 0));
        var ganancia = precioVenta - precioCosto;
        var margenPct = precioVenta > 0 ? ((ganancia / precioVenta) * 100) : 0;
        var enStock = stock > 0;
        var totalVend = Number(prod.totalVendidos) || 0;
        var catNombre = prod.categoriaNombre || "General";
        var catIcono = prod.categoriaIcono || "🏷️";

        var statusBadge = enStock
            ? `<span style="font-size: 10.5px; font-weight: 800; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span> ${stock} en Stock
               </span>`
            : `<span style="font-size: 10.5px; font-weight: 800; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 3px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444; display: inline-block;"></span> Agotado (0)
               </span>`;

        // Etiquetas opcionales (Marca, Género, Estado)
        var tagsHtml = '';
        if (prod.marca) {
            tagsHtml += `<span style="font-size: 10px; font-weight: 800; background: #f3f4f6; color: #111827; border: 1px solid #e5e7eb; padding: 2px 7px; border-radius: 5px;">🏷️ ${prod.marca}</span>`;
        }
        if (prod.genero && prod.genero !== 'No aplica') {
            tagsHtml += `<span style="font-size: 10px; font-weight: 700; background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; padding: 2px 7px; border-radius: 5px;">👤 ${prod.genero}</span>`;
        }
        if (prod.estado && prod.estado !== 'Normal') {
            var bgEst = (prod.estado === 'Nuevo') ? 'background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe;' :
                        (prod.estado === 'Oferta' || prod.estado === 'Liquidación') ? 'background: #fff1f2; color: #be123c; border-color: #fecdd3;' :
                        'background: #fef3c7; color: #92400e; border-color: #fde68a;';
            tagsHtml += `<span style="font-size: 10px; font-weight: 800; ${bgEst} border: 1px solid; padding: 2px 7px; border-radius: 5px;">${prod.estado}</span>`;
        }

        // Variantes (Tallas y Colores)
        var variantesHtml = '';
        if (prod.tieneVariantes && Array.isArray(prod.variantes) && prod.variantes.length > 0) {
            variantesHtml = '<div style="margin: 8px 0 10px 0; display: flex; flex-wrap: wrap; gap: 4px;">';
            prod.variantes.forEach(function(v) {
                var vStock = Math.max(0, Number(v.stock) || 0);
                var txtTalla = v.talla ? 'T: ' + v.talla : '';
                var txtColor = v.color ? v.color : '';
                var txtLabel = [txtTalla, txtColor].filter(Boolean).join(' · ') || 'Var';
                variantesHtml += `<span class="variant-pill ${vStock <= 0 ? 'is-zero' : ''}" title="${txtLabel}: ${vStock} unidades disponibles">
                    ${txtLabel}: <strong>${vStock}</strong>
                </span>`;
            });
            variantesHtml += '</div>';
        }

        html += `
        <div class="card inventario-producto-card ${enStock ? '' : 'is-agotado'}" style="margin-bottom: 0; padding: 16px; border-radius: 14px; background: #ffffff; border: 1px solid #e5e7eb; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease;">
            <div>
                <!-- Fila Superior: Categoría y Disponibilidad -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                    <span style="font-size: 11px; font-weight: 800; color: #4b5563; background: #f9fafb; border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 6px;">
                        ${catIcono} ${catNombre}
                    </span>
                    ${statusBadge}
                </div>

                <!-- Etiquetas de Atributos Rápidos (Marca, Género, Estado) -->
                ${tagsHtml ? `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">${tagsHtml}</div>` : ''}

                <!-- Nombre del Producto -->
                <h4 style="margin: 0 0 6px 0; font-size: 15.5px; font-weight: 800; color: #111827; line-height: 1.35;">
                    ${prod.nombre}
                </h4>

                <!-- Descripción si existe -->
                ${prod.descripcion ? `<p style="margin: 0 0 10px 0; font-size: 11.5px; color: #6b7280; line-height: 1.4;">${prod.descripcion}</p>` : '<div style="margin-bottom: 6px;"></div>'}

                <!-- Pastillas de Variantes (Tallas y Colores) -->
                ${variantesHtml}

                <!-- Métricas Clave: Precios y Rentabilidad -->
                <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 8px; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px;">
                    <div>
                        <span style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Precio de Venta</span>
                        <div style="font-size: 17px; font-weight: 800; color: #111827; margin-top: 1px;">
                            $${precioVenta.toFixed(2)}
                        </div>
                        <div style="font-size: 10.5px; color: #6b7280; margin-top: 2px;">
                            Costo: <strong>$${precioCosto.toFixed(2)}</strong> · <span style="color: ${ganancia >= 0 ? '#065f46' : '#991b1b'}; font-weight: 700;">${ganancia >= 0 ? '+' : ''}${margenPct.toFixed(0)}%</span>
                        </div>
                    </div>
                    <div>
                        <span style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Existencias</span>
                        <div style="font-size: 16px; font-weight: 800; color: ${enStock ? '#111827' : '#991b1b'}; margin-top: 1px; display: flex; align-items: center; justify-content: space-between;">
                            <span>${stock} unids</span>
                            <div style="display: flex; gap: 3px;">
                                <button onclick="ajustarStockRapido('${prod.id}', -1)" title="Restar 1 unidad" style="border: 1px solid #d1d5db; background: #ffffff; color: #111827; width: 22px; height: 22px; border-radius: 5px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">-</button>
                                <button onclick="ajustarStockRapido('${prod.id}', 1)" title="Sumar 1 unidad" style="border: 1px solid #d1d5db; background: #ffffff; color: #111827; width: 22px; height: 22px; border-radius: 5px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">+</button>
                            </div>
                        </div>
                        ${prod.tieneVariantes ? `<div style="font-size: 10px; color: #6b7280; margin-top: 2px;">Con variantes</div>` : ''}
                    </div>
                </div>

                ${totalVend > 0 ? `
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
                    <span>✓</span> Total vendidos históricamente: <strong style="color: #111827;">${totalVend} unidades</strong>
                </div>` : ''}
            </div>

            <!-- Botones de Acción -->
            <div>
                <!-- BOTÓN PRINCIPAL DE VENTA (REQUERIMIENTO DEL USUARIO) -->
                <button type="button" 
                        class="btn-system" 
                        onclick="abrirModalRegistrarVenta('${prod.id}')"
                        style="width: 100%; justify-content: center; font-size: 13px; font-weight: 800; padding: 10px 14px; border-radius: 9px; margin-bottom: 8px; ${enStock ? 'background: #111827; color: #ffffff;' : 'background: #f3f4f6; color: #9ca3af; border: 1px solid #e5e7eb; cursor: not-allowed;'}"
                        ${enStock ? '' : 'disabled title="Producto agotado. Añade existencias para vender."'}>
                    <span>💵</span> ${enStock ? 'Registrar Venta (Vendido)' : 'Agotado (Sin Stock)'}
                </button>

                <!-- Acciones secundarias: Editar y Eliminar -->
                <div style="display: flex; gap: 6px;">
                    <button type="button" onclick="abrirModalNuevoProducto('${prod.id}')" style="flex: 1; border: 1px solid #e5e7eb; background: #ffffff; color: #374151; padding: 6px 10px; font-size: 11.5px; font-weight: 700; border-radius: 7px; cursor: pointer;" title="Editar producto">
                        ✏️ Editar
                    </button>
                    <button type="button" onclick="eliminarProductoInventario('${prod.id}')" style="border: 1px solid #fee2e2; background: #fff5f5; color: #b91c1c; padding: 6px 10px; font-size: 11.5px; font-weight: 700; border-radius: 7px; cursor: pointer;" title="Eliminar producto">
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
 * Filtro reactivo por búsqueda de texto, categoría y estado de stock
 */
function filtrarProductosInventario() {
    asegurarEstructuraInventario();
    var txtEl = document.getElementById('inv-filtro-busqueda');
    var catEl = document.getElementById('inv-filtro-categoria');
    var stkEl = document.getElementById('inv-filtro-stock');

    var q = txtEl ? txtEl.value.trim().toLowerCase() : '';
    var cat = catEl ? catEl.value : 'todas';
    var stk = stkEl ? stkEl.value : 'todos';

    var filtrados = APP_STATE.inventario.productos.filter(function(p) {
        var matchTxt = true;
        if (q) {
            var n = (p.nombre || '').toLowerCase();
            var d = (p.descripcion || '').toLowerCase();
            var c = (p.categoriaNombre || '').toLowerCase();
            var m = (p.marca || '').toLowerCase();
            var g = (p.genero || '').toLowerCase();
            matchTxt = (n.indexOf(q) !== -1 || d.indexOf(q) !== -1 || c.indexOf(q) !== -1 || m.indexOf(q) !== -1 || g.indexOf(q) !== -1);
        }

        var matchCat = true;
        if (cat !== 'todas') {
            matchCat = (p.categoriaId === cat || p.categoriaNombre === cat);
        }

        var matchStk = true;
        var s = Number(p.stock) || 0;
        if (stk === 'disponible') {
            matchStk = s > 0;
        } else if (stk === 'agotado') {
            matchStk = s <= 0;
        }

        return matchTxt && matchCat && matchStk;
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

function calcularMargenGananciaModal() {
    var inCst = document.getElementById('modal-prod-costo');
    var inVta = document.getElementById('modal-prod-precio-venta');
    var banner = document.getElementById('modal-prod-margen-banner');
    var texto = document.getElementById('modal-prod-margen-texto');

    if (!banner || !texto) return;

    var costo = inCst ? parseFloat(inCst.value) : 0;
    var venta = inVta ? parseFloat(inVta.value) : 0;

    if (isNaN(costo)) costo = 0;
    if (isNaN(venta)) venta = 0;

    if (costo <= 0 && venta <= 0) {
        banner.style.display = 'none';
        return;
    }

    banner.style.display = 'flex';
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
 * Abre el modal para crear o editar un producto
 */
function abrirModalNuevoProducto(productoId) {
    asegurarEstructuraInventario();
    actualizarSelectsCategorias();

    var modal = document.getElementById('modal-nuevo-producto');
    if (!modal) return;

    var tituloH = document.getElementById('modal-prod-titulo-header');
    var inId = document.getElementById('modal-prod-id');
    var inCat = document.getElementById('modal-prod-categoria');
    var inNom = document.getElementById('modal-prod-nombre');
    var inMarca = document.getElementById('modal-prod-marca');
    var inGen = document.getElementById('modal-prod-genero');
    var inEst = document.getElementById('modal-prod-estado');
    var inCst = document.getElementById('modal-prod-costo');
    var inVta = document.getElementById('modal-prod-precio-venta');
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

        if (tituloH) tituloH.textContent = "EDITAR PRODUCTO";
        if (inId) inId.value = p.id;
        if (inCat && p.categoriaId) inCat.value = p.categoriaId;
        if (inNom) inNom.value = p.nombre || '';
        if (inMarca) inMarca.value = p.marca || '';
        if (inGen) inGen.value = p.genero || 'Unisex';
        if (inEst) inEst.value = p.estado || 'Nuevo';
        
        var cstVal = p.precioCosto != null ? p.precioCosto : (p.costo || '');
        var vtaVal = p.precioVenta != null ? p.precioVenta : (p.costo || '');
        if (inCst) inCst.value = cstVal;
        if (inVta) inVta.value = vtaVal;

        if (inDesc) inDesc.value = p.descripcion || '';

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
            if (inStk) inStk.value = p.stock || 0;
        }
    } else {
        // Modo creación
        _PROD_EDITANDO_ID = null;
        if (tituloH) tituloH.textContent = "NUEVO PRODUCTO";
        if (inId) inId.value = '';
        if (inNom) inNom.value = '';
        if (inMarca) inMarca.value = '';
        if (inGen) inGen.value = 'Unisex';
        if (inEst) inEst.value = 'Nuevo';
        if (inCst) inCst.value = '';
        if (inVta) inVta.value = '';
        if (inStk) inStk.value = '1';
        if (inDesc) inDesc.value = '';

        if (chkVar) chkVar.checked = false;
        if (bloqueVar) bloqueVar.style.display = 'none';
        if (bloqueStk) bloqueStk.style.display = 'block';
    }

    calcularMargenGananciaModal();
    modal.style.display = 'flex';
    if (inNom) setTimeout(function() { inNom.focus(); }, 100);
}

function cerrarModalNuevoProducto() {
    var modal = document.getElementById('modal-nuevo-producto');
    if (modal) modal.style.display = 'none';
    _PROD_EDITANDO_ID = null;
}

/**
 * Guarda el producto (creación o edición) con variantes y márgenes
 */
function guardarProductoInventario() {
    asegurarEstructuraInventario();

    var inNom = document.getElementById('modal-prod-nombre');
    var inCat = document.getElementById('modal-prod-categoria');
    var inMarca = document.getElementById('modal-prod-marca');
    var inGen = document.getElementById('modal-prod-genero');
    var inEst = document.getElementById('modal-prod-estado');
    var inCst = document.getElementById('modal-prod-costo');
    var inVta = document.getElementById('modal-prod-precio-venta');
    var inStk = document.getElementById('modal-prod-stock');
    var inDesc = document.getElementById('modal-prod-descripcion');
    var chkVar = document.getElementById('modal-prod-tiene-variantes');
    var listaVar = document.getElementById('modal-prod-lista-variantes');

    var nombre = inNom ? inNom.value.trim() : '';
    if (!nombre) {
        alert("Por favor introduce el nombre del producto (ej: Franela Dry-Fit Training).");
        if (inNom) inNom.focus();
        return;
    }

    var precioCosto = inCst ? parseFloat(inCst.value) : 0;
    if (isNaN(precioCosto) || precioCosto < 0) precioCosto = 0;

    var precioVenta = inVta ? parseFloat(inVta.value) : 0;
    if (isNaN(precioVenta) || precioVenta < 0) precioVenta = 0;

    // Respaldo de compatibilidad para código existente que use p.costo
    var costo = precioVenta > 0 ? precioVenta : precioCosto;

    var marca = inMarca ? inMarca.value.trim() : '';
    var genero = inGen ? inGen.value : 'Unisex';
    var estado = inEst ? inEst.value : 'Nuevo';
    var descripcion = inDesc ? inDesc.value.trim() : '';

    var categoriaId = inCat ? inCat.value : '';
    var catEncontrada = APP_STATE.inventario.categorias.find(function(c) { return c.id === categoriaId; });
    var categoriaNombre = catEncontrada ? catEncontrada.nombre : "General";
    var categoriaIcono = catEncontrada ? catEncontrada.icono : "🏷️";

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
            p.precioCosto = precioCosto;
            p.precioVenta = precioVenta;
            p.costo = costo;
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
            p.fechaActualizacion = fechaHoy;
        }
    } else {
        // Crear nuevo
        var nuevoProd = {
            id: "PROD-" + Date.now(),
            nombre: nombre,
            precioCosto: precioCosto,
            precioVenta: precioVenta,
            costo: costo,
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
            fechaCreacion: fechaHoy
        };
        APP_STATE.inventario.productos.unshift(nuevoProd);
    }

    MonarcaDB.save(APP_STATE);
    cerrarModalNuevoProducto();
    filtrarProductosInventario();
    actualizarMetricasKpisInventario();
}

/**
 * Elimina un producto tras confirmación
 */
function eliminarProductoInventario(productoId) {
    asegurarEstructuraInventario();
    var p = APP_STATE.inventario.productos.find(function(item) { return item.id === productoId; });
    if (!p) return;

    if (confirm(`¿Estás seguro de eliminar el producto "${p.nombre}" del inventario?`)) {
        if (!APP_STATE._eliminados) APP_STATE._eliminados = { productos: [], categorias: [], ventas: [] };
        if (!Array.isArray(APP_STATE._eliminados.productos)) APP_STATE._eliminados.productos = [];
        APP_STATE._eliminados.productos.push(productoId);

        APP_STATE.inventario.productos = APP_STATE.inventario.productos.filter(function(item) {
            return item.id !== productoId;
        });
        MonarcaDB.save(APP_STATE, true);
        filtrarProductosInventario();
        actualizarMetricasKpisInventario();
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
        var optHtml = '';
        if (cats.length === 0) {
            optHtml = '<option value="">(Sin categorías creadas - General)</option>';
        } else {
            cats.forEach(function(c) {
                optHtml += `<option value="${c.id}">${c.icono || '🏷️'} ${c.nombre}</option>`;
            });
        }
        selModal.innerHTML = optHtml;
    }

    // 2. Selector en filtro de la barra superior
    var selFiltro = document.getElementById('inv-filtro-categoria');
    if (selFiltro) {
        var valActual = selFiltro.value || 'todas';
        var fHtml = '<option value="todas">🏷️ Todas las categorías</option>';
        cats.forEach(function(c) {
            fHtml += `<option value="${c.id}">${c.icono || '🏷️'} ${c.nombre}</option>`;
        });
        selFiltro.innerHTML = fHtml;
        selFiltro.value = valActual;
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
        <div class="card" style="text-align: center; padding: 40px 20px; border-radius: 16px; border: 1.5px dashed #d1d5db; background: #ffffff;">
            <div style="font-size: 42px; margin-bottom: 12px;">🏷️</div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #111827;">No tienes categorías creadas</h3>
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
        <div class="card" style="margin-bottom: 0; padding: 16px; border-radius: 14px; background: #ffffff; border: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 28px; width: 44px; height: 44px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    ${cat.icono || '🏷️'}
                </div>
                <div>
                    <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #111827;">${cat.nombre}</h4>
                    <span style="font-size: 11.5px; color: #6b7280; font-weight: 600;">${cantAsoc} producto${cantAsoc === 1 ? '' : 's'}</span>
                </div>
            </div>
            <div style="display: flex; gap: 6px;">
                <button type="button" onclick="abrirModalNuevaCategoria('${cat.id}')" style="border: 1px solid #e5e7eb; background: #ffffff; color: #374151; padding: 6px 10px; font-size: 11.5px; font-weight: 700; border-radius: 7px; cursor: pointer;" title="Editar categoría">
                    ✏️
                </button>
                <button type="button" onclick="eliminarCategoriaInventario('${cat.id}')" style="border: 1px solid #fee2e2; background: #fff5f5; color: #b91c1c; padding: 6px 10px; font-size: 11.5px; font-weight: 700; border-radius: 7px; cursor: pointer;" title="Eliminar categoría">
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
    if (inNom) setTimeout(function() { inNom.focus(); }, 100);
}

function abrirModalNuevaCategoriaDesdeProducto() {
    cerrarModalNuevoProducto();
    abrirModalNuevaCategoria();
}

function cerrarModalNuevaCategoria() {
    var modal = document.getElementById('modal-nueva-categoria');
    if (modal) modal.style.display = 'none';
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

/**
 * Abre el modal para registrar la venta de un producto (con soporte de variantes)
 */
function abrirModalRegistrarVenta(productoId) {
    asegurarEstructuraInventario();
    var p = APP_STATE.inventario.productos.find(function(item) { return item.id === productoId; });
    if (!p) return;

    var stockTotal = Math.max(0, Number(p.stock) || 0);
    if (stockTotal <= 0) {
        alert(`El producto "${p.nombre}" se encuentra AGOTADO (0 unidades en stock). No es posible registrar una venta hasta agregar existencias.`);
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

    if (inId) inId.value = p.id;
    if (badgeCat) badgeCat.textContent = (p.categoriaIcono || '🏷️') + " " + (p.categoriaNombre || "General");
    if (txtNom) txtNom.textContent = p.nombre;

    var precioSugerido = Number(p.precioVenta != null ? p.precioVenta : (p.costo || 0));
    if (inPre) inPre.value = precioSugerido.toFixed(2);
    if (inObs) inObs.value = "";
    if (inCant) inCant.value = "1";

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
            optHtml += `<option value="${v.id}" ${optDisabled}>${labelVar}</option>`;
        });

        selVar.innerHTML = optHtml;
        if (primerIdDisponible) selVar.value = primerIdDisponible;
        alSeleccionarVarianteVenta();
    } else {
        if (bloqueVar) bloqueVar.style.display = 'none';
        if (badgeStock) badgeStock.textContent = stockTotal + " unidades disponibles";
        if (inCant) inCant.max = stockTotal;
    }

    actualizarTotalVentaCalculado();
    modal.style.display = 'flex';
    if (inObs) setTimeout(function() { inObs.focus(); }, 120);
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
    _VENTA_PROD_ACTUAL = null;
}

/**
 * Recalcula el total de la venta en vivo: cantidad × precio unitario
 */
function actualizarTotalVentaCalculado() {
    var inCant = document.getElementById('modal-venta-cantidad');
    var inPre = document.getElementById('modal-venta-precio');
    var lblTotal = document.getElementById('modal-venta-total-calculado');

    var cant = inCant ? parseInt(inCant.value, 10) : 1;
    if (isNaN(cant) || cant < 1) cant = 1;

    var pre = inPre ? parseFloat(inPre.value) : 0;
    if (isNaN(pre) || pre < 0) pre = 0;

    var total = cant * pre;
    if (lblTotal) lblTotal.textContent = "$" + total.toFixed(2);
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

    var totalVenta = cantidad * precioUnitario;
    var observacion = inObs ? inObs.value.trim() : '';

    var fechaHoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
    var horaHoy = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // 1. Descontar existencias
    if (tieneVar && varianteSeleccionada) {
        varianteSeleccionada.stock = Math.max(0, (Number(varianteSeleccionada.stock) || 0) - cantidad);
        // Recalcular stock total sumando variantes
        prod.stock = prod.variantes.reduce(function(acc, v) { return acc + (Math.max(0, Number(v.stock) || 0)); }, 0);
    } else {
        prod.stock = Math.max(0, (Number(prod.stock) || 0) - cantidad);
    }
    prod.totalVendidos = (Number(prod.totalVendidos) || 0) + cantidad;

    // 2. Crear registro de venta para el apartado de Vendidos
    var nuevaVenta = {
        id: "VENTA-" + Date.now(),
        productoId: prod.id,
        productoNombre: prod.nombre,
        varianteId: varianteSeleccionada ? varianteSeleccionada.id : null,
        varianteDetalle: varianteDetalle || null,
        categoriaId: prod.categoriaId || '',
        categoriaNombre: prod.categoriaNombre || 'General',
        categoriaIcono: prod.categoriaIcono || '🏷️',
        marca: prod.marca || '',
        genero: prod.genero || '',
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        totalVenta: totalVenta,
        observacion: observacion,
        fecha: fechaHoy,
        hora: horaHoy,
        timestamp: Date.now()
    };

    APP_STATE.inventario.ventas.unshift(nuevaVenta);

    // 3. Registrar opcionalmente como ingreso en Finanzas
    if (chkFin && chkFin.checked && APP_STATE.finanzas) {
        if (!Array.isArray(APP_STATE.finanzas.ingresos)) APP_STATE.finanzas.ingresos = [];
        var descFinanza = `Venta: ${prod.nombre}${varianteDetalle ? ' (' + varianteDetalle + ')' : ''} (${cantidad} unid${cantidad > 1 ? 'es' : ''})${observacion ? ' - ' + observacion : ''}`;
        var nuevoIngreso = {
            id: "ING-V-" + Date.now(),
            concepto: descFinanza,
            categoria: "Ventas / Negocio",
            monto: totalVenta,
            dia: new Date().getDate(),
            recurrente: false
        };
        APP_STATE.finanzas.ingresos.push(nuevoIngreso);
    }

    // Persistir
    MonarcaDB.save(APP_STATE);
    cerrarModalRegistrarVenta();

    // Actualizar interfaz
    filtrarProductosInventario();
    actualizarMetricasKpisInventario();

    var detalleFinal = varianteDetalle ? ` [${varianteDetalle}]` : '';
    alert(`✓ ¡Venta registrada exitosamente!

• Producto: ${prod.nombre}${detalleFinal}
• Unidades vendidas: ${cantidad}
• Stock total restante: ${prod.stock} unids
• Total: $${totalVenta.toFixed(2)}
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
        <div class="card" style="text-align: center; padding: 40px 20px; border-radius: 16px; border: 1.5px dashed #d1d5db; background: #ffffff;">
            <div style="font-size: 42px; margin-bottom: 12px;">💰</div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #111827;">No tienes ventas registradas</h3>
            <p style="margin: 6px auto 18px auto; max-width: 440px; font-size: 13px; color: #6b7280; line-height: 1.45;">
                Cuando registres ventas de tus productos aparecerán en este historial con su fecha, variante, unidades, monto recaudado y tu observación.
            </p>
            <button class="btn-system" onclick="cambiarTabInventario('productos')" style="background: #111827; color: #ffffff; border: 1px solid #111827; padding: 9px 18px; font-size: 13px; font-weight: 700; border-radius: 10px;">
                📦 Ir a Productos en Stock
            </button>
        </div>`;
        return;
    }

    var html = '<div class="inventario-ventas-list" style="display: flex; flex-direction: column; gap: 12px;">';

    ventas.forEach(function(venta) {
        var cant = Number(venta.cantidad) || 1;
        var unit = Number(venta.precioUnitario) || 0;
        var total = Number(venta.totalVenta) || (cant * unit);

        html += `
        <div class="card inventario-venta-card" style="margin-bottom: 0; padding: 16px 18px; border-radius: 14px; background: #ffffff; border: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px;">
            <div style="flex: 1; min-width: 240px;">
                <!-- Fila de Metadatos: Categoría y Fecha/Hora -->
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                    <span style="font-size: 11px; font-weight: 800; background: #f3f4f6; color: #111827; border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 6px;">
                        ${venta.categoriaIcono || '🏷️'} ${venta.categoriaNombre || 'General'}
                    </span>
                    ${venta.marca ? `<span style="font-size: 10.5px; font-weight: 700; background: #f3f4f6; color: #4b5563; padding: 2px 6px; border-radius: 5px;">🏷️ ${venta.marca}</span>` : ''}
                    <span style="font-size: 11.5px; color: #6b7280; font-weight: 600;">
                        📅 ${venta.fecha} ${venta.hora ? '· ' + venta.hora : ''}
                    </span>
                </div>

                <!-- Nombre del Producto Vendido y Variante -->
                <h4 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 800; color: #111827; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span>${venta.productoNombre}</span>
                    ${venta.varianteDetalle ? `<span class="variant-pill" style="font-size: 11.5px; background: #eff6ff; color: #1e40af; border-color: #bfdbfe;">👕 ${venta.varianteDetalle}</span>` : ''}
                </h4>

                <!-- Cantidad y Precio -->
                <div style="font-size: 13px; color: #374151; margin-bottom: 10px;">
                    Cantidad: <strong style="color: #111827;">${cant} unid${cant > 1 ? 'es' : ''}</strong> · Precio unitario: <strong>$${unit.toFixed(2)}</strong>
                </div>

                <!-- Observación (Requerimiento explícito) -->
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-left: 3.5px solid #111827; border-radius: 8px; padding: 8px 12px; font-size: 12.5px; color: #374151; line-height: 1.45;">
                    <strong style="color: #111827;">📝 Observación:</strong> 
                    <span>${venta.observacion ? venta.observacion : '<em style="color: #9ca3af;">Sin observación registrada</em>'}</span>
                </div>
            </div>

            <!-- Columna Derecha: Monto Total y Botón Revertir -->
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; min-height: 80px;">
                <div>
                    <span style="font-size: 10.5px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL COBRADO</span>
                    <div style="font-size: 22px; font-weight: 800; color: #111827; margin-top: 1px;">
                        $${total.toFixed(2)}
                    </div>
                </div>
                <button type="button" 
                        onclick="anularVentaInventario('${venta.id}')" 
                        style="border: 1px solid #e5e7eb; background: #ffffff; color: #6b7280; padding: 5px 10px; font-size: 11px; font-weight: 700; border-radius: 7px; cursor: pointer; transition: all 0.2s ease;" 
                        title="Anular venta y reincorporar las unidades al stock">
                    ↩ Revertir Venta (+${cant} stock)
                </button>
            </div>
        </div>`;
    });

    html += '</div>';
    cont.innerHTML = html;
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
        return (n.indexOf(q) !== -1 || o.indexOf(q) !== -1 || c.indexOf(q) !== -1 || varDet.indexOf(q) !== -1 || f.indexOf(q) !== -1);
    });

    renderizarVendidosInventario(filtradas);
}

/**
 * Anula una venta y devuelve las unidades al stock del producto y de su variante
 */
function anularVentaInventario(ventaId) {
    asegurarEstructuraInventario();
    var venta = APP_STATE.inventario.ventas.find(function(v) { return v.id === ventaId; });
    if (!venta) return;

    var cant = Number(venta.cantidad) || 1;
    var confirmMsg = `¿Deseas revertir esta venta?

• Producto: ${venta.productoNombre}${venta.varianteDetalle ? ' (' + venta.varianteDetalle + ')' : ''}
• Se reincorporarán ${cant} unidad(es) al stock.
• Se eliminará del historial de vendidos.`;

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
        }

        // Eliminar del historial de ventas y registrar tombstone
        if (!APP_STATE._eliminados) APP_STATE._eliminados = { productos: [], categorias: [], ventas: [] };
        if (!Array.isArray(APP_STATE._eliminados.ventas)) APP_STATE._eliminados.ventas = [];
        APP_STATE._eliminados.ventas.push(ventaId);

        APP_STATE.inventario.ventas = APP_STATE.inventario.ventas.filter(function(v) {
            return v.id !== ventaId;
        });

        MonarcaDB.save(APP_STATE, true);
        renderizarVendidosInventario();
        actualizarMetricasKpisInventario();
        alert(`✓ Venta anulada con éxito. Se reincorporaron ${cant} unidad(es) al inventario.`);
    }
}
