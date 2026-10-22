/**
 * SISTEMA MONARCA · MÓDULO DE INVENTARIO Y CONTROL DE VENTAS
 * Catálogo de productos, existencias en stock, categorías personalizadas y registro de ventas con observaciones.
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
    var unidadesVendidas = 0;
    var totalIngresos = 0;

    prods.forEach(function(p) {
        var stk = Math.max(0, Number(p.stock) || 0);
        var cst = Math.max(0, Number(p.costo) || 0);
        totalStock += stk;
        valorStock += (stk * cst);
    });

    ventas.forEach(function(v) {
        var cant = Math.max(0, Number(v.cantidad) || 0);
        var tot = Math.max(0, Number(v.totalVenta) || 0);
        unidadesVendidas += cant;
        totalIngresos += tot;
    });

    // Actualizar badges en botones de tabs
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
// 1. GESTIÓN DE PRODUCTOS (STOCK ACTIVO)
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
                    ? 'Agrega tus productos indicando nombre, costo y cantidad en stock para comenzar a registrar ventas.' 
                    : 'Te recomendamos crear primero tus categorías (ej: "Franela", "Pantalón", "Calzado") y luego añadir tus productos.'}
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

    var html = '<div class="inventario-productos-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 14px;">';

    lista.forEach(function(prod) {
        var stock = Math.max(0, Number(prod.stock) || 0);
        var costo = Math.max(0, Number(prod.costo) || 0);
        var enStock = stock > 0;
        var totalVend = Number(prod.totalVendidos) || 0;
        var catNombre = prod.categoriaNombre || "General";
        var catIcono = prod.categoriaIcono || "🏷️";

        var statusBadge = enStock
            ? `<span style="font-size: 10.5px; font-weight: 800; background: #f3f4f6; color: #111827; border: 1px solid #e5e7eb; padding: 3px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span> ${stock} en Stock
               </span>`
            : `<span style="font-size: 10.5px; font-weight: 800; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 3px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444; display: inline-block;"></span> Agotado (0)
               </span>`;

        html += `
        <div class="card inventario-producto-card ${enStock ? '' : 'is-agotado'}" style="margin-bottom: 0; padding: 16px; border-radius: 14px; background: #ffffff; border: 1px solid #e5e7eb; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease;">
            <div>
                <!-- Fila Superior: Categoría y Disponibilidad -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 11px; font-weight: 800; color: #4b5563; background: #f9fafb; border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 6px;">
                        ${catIcono} ${catNombre}
                    </span>
                    ${statusBadge}
                </div>

                <!-- Nombre del Producto -->
                <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 800; color: #111827; line-height: 1.35;">
                    ${prod.nombre}
                </h4>

                <!-- Descripción si existe -->
                ${prod.descripcion ? `<p style="margin: 0 0 10px 0; font-size: 11.5px; color: #6b7280; line-height: 1.4;">${prod.descripcion}</p>` : '<div style="margin-bottom: 8px;"></div>'}

                <!-- Métricas Clave del Producto -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px;">
                    <div>
                        <span style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Precio / Costo</span>
                        <div style="font-size: 16px; font-weight: 800; color: #111827; margin-top: 1px;">
                            $${costo.toFixed(2)}
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
            matchTxt = (n.indexOf(q) !== -1 || d.indexOf(q) !== -1 || c.indexOf(q) !== -1);
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

    var actual = Number(prod.stock) || 0;
    var nuevo = actual + delta;
    if (nuevo < 0) nuevo = 0;

    prod.stock = nuevo;
    MonarcaDB.save(APP_STATE);
    
    // Refrescar vistas
    filtrarProductosInventario();
    actualizarMetricasKpisInventario();
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
    var inCst = document.getElementById('modal-prod-costo');
    var inStk = document.getElementById('modal-prod-stock');
    var inDesc = document.getElementById('modal-prod-descripcion');

    if (productoId) {
        // Modo edición
        _PROD_EDITANDO_ID = productoId;
        var p = APP_STATE.inventario.productos.find(function(item) { return item.id === productoId; });
        if (!p) return;

        if (tituloH) tituloH.textContent = "EDITAR PRODUCTO";
        if (inId) inId.value = p.id;
        if (inCat && p.categoriaId) inCat.value = p.categoriaId;
        if (inNom) inNom.value = p.nombre || '';
        if (inCst) inCst.value = p.costo || '';
        if (inStk) inStk.value = p.stock || 0;
        if (inDesc) inDesc.value = p.descripcion || '';
    } else {
        // Modo creación
        _PROD_EDITANDO_ID = null;
        if (tituloH) tituloH.textContent = "NUEVO PRODUCTO";
        if (inId) inId.value = '';
        if (inNom) inNom.value = '';
        if (inCst) inCst.value = '';
        if (inStk) inStk.value = '1';
        if (inDesc) inDesc.value = '';
    }

    modal.style.display = 'flex';
    if (inNom) setTimeout(function() { inNom.focus(); }, 100);
}

function cerrarModalNuevoProducto() {
    var modal = document.getElementById('modal-nuevo-producto');
    if (modal) modal.style.display = 'none';
    _PROD_EDITANDO_ID = null;
}

/**
 * Guarda el producto (creación o edición)
 */
function guardarProductoInventario() {
    asegurarEstructuraInventario();

    var inId = document.getElementById('modal-prod-id');
    var inCat = document.getElementById('modal-prod-categoria');
    var inNom = document.getElementById('modal-prod-nombre');
    var inCst = document.getElementById('modal-prod-costo');
    var inStk = document.getElementById('modal-prod-stock');
    var inDesc = document.getElementById('modal-prod-descripcion');

    var nombre = inNom ? inNom.value.trim() : '';
    if (!nombre) {
        alert("Por favor introduce el nombre del producto (ej: Franela Adidas negra talla SM).");
        if (inNom) inNom.focus();
        return;
    }

    var costo = inCst ? parseFloat(inCst.value) : 0;
    if (isNaN(costo) || costo < 0) costo = 0;

    var stock = inStk ? parseInt(inStk.value, 10) : 0;
    if (isNaN(stock) || stock < 0) stock = 0;

    var categoriaId = inCat ? inCat.value : '';
    var catEncontrada = APP_STATE.inventario.categorias.find(function(c) { return c.id === categoriaId; });
    var categoriaNombre = catEncontrada ? catEncontrada.nombre : "General";
    var categoriaIcono = catEncontrada ? catEncontrada.icono : "🏷️";

    var descripcion = inDesc ? inDesc.value.trim() : '';

    if (_PROD_EDITANDO_ID) {
        // Actualizar existente
        var p = APP_STATE.inventario.productos.find(function(item) { return item.id === _PROD_EDITANDO_ID; });
        if (p) {
            p.nombre = nombre;
            p.costo = costo;
            p.stock = stock;
            p.categoriaId = categoriaId;
            p.categoriaNombre = categoriaNombre;
            p.categoriaIcono = categoriaIcono;
            p.descripcion = descripcion;
            p.fechaActualizacion = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
        }
    } else {
        // Crear nuevo
        var nuevoProd = {
            id: "PROD-" + Date.now(),
            nombre: nombre,
            costo: costo,
            stock: stock,
            categoriaId: categoriaId,
            categoriaNombre: categoriaNombre,
            categoriaIcono: categoriaIcono,
            descripcion: descripcion,
            totalVendidos: 0,
            fechaCreacion: typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0]
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
        APP_STATE.inventario.productos = APP_STATE.inventario.productos.filter(function(item) {
            return item.id !== productoId;
        });
        MonarcaDB.save(APP_STATE);
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
    var prods = APP_STATE.inventario.productos;

    if (!cats || cats.length === 0) {
        cont.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px; border-radius: 16px; border: 1.5px dashed #d1d5db; background: #ffffff;">
            <div style="font-size: 42px; margin-bottom: 12px;">🏷️</div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #111827;">No tienes categorías creadas</h3>
            <p style="margin: 6px auto 18px auto; max-width: 440px; font-size: 13px; color: #6b7280; line-height: 1.45;">
                Crea categorías para organizar lo que vendes (por ejemplo: <strong>Franela</strong>, <strong>Pantalón</strong>, <strong>Calzado</strong>, <strong>Accesorios</strong>).
            </p>
            <button class="btn-system" onclick="abrirModalNuevaCategoria()" style="background: #111827; color: #ffffff; border: 1px solid #111827; padding: 9px 18px; font-size: 13px; font-weight: 700; border-radius: 10px;">
                🏷️ + Crear Primera Categoría
            </button>
        </div>`;
        return;
    }

    var html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">';

    cats.forEach(function(cat) {
        // Contar productos y stock de esta categoría
        var prodsDeCat = prods.filter(function(p) { return p.categoriaId === cat.id; });
        var cantProds = prodsDeCat.length;
        var cantStock = 0;
        var totalVend = 0;

        prodsDeCat.forEach(function(p) {
            cantStock += (Number(p.stock) || 0);
            totalVend += (Number(p.totalVendidos) || 0);
        });

        html += `
        <div class="card" style="margin-bottom: 0; padding: 16px; border-radius: 14px; background: #ffffff; border: 1px solid #e5e7eb; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="width: 42px; height: 42px; border-radius: 10px; background: #f3f4f6; border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                        ${cat.icono || '🏷️'}
                    </div>
                    <span style="font-size: 11px; font-weight: 700; background: #f9fafb; border: 1px solid #e5e7eb; padding: 3px 8px; border-radius: 9999px; color: #4b5563;">
                        ${cantProds} producto(s)
                    </span>
                </div>
                <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 800; color: #111827;">
                    ${cat.nombre}
                </h4>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">
                    Existencias: <strong style="color: #111827;">${cantStock} unidades</strong> en stock · Vendidos: <strong style="color: #111827;">${totalVend}</strong>
                </div>
            </div>
            <div style="display: flex; gap: 6px; border-top: 1px solid #f3f4f6; padding-top: 10px;">
                <button type="button" onclick="abrirModalNuevaCategoria('${cat.id}')" style="flex: 1; border: 1px solid #e5e7eb; background: #ffffff; color: #374151; padding: 6px 10px; font-size: 11.5px; font-weight: 700; border-radius: 7px; cursor: pointer;">
                    ✏️ Editar
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
            // Actualizar referencias en productos
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
// 3. MECÁNICA DE VENTA (REGISTRAR VENTA, OBSERVACIÓN Y RESTA DE STOCK)
// ==========================================================================

/**
 * Abre el modal para registrar la venta de un producto
 */
function abrirModalRegistrarVenta(productoId) {
    asegurarEstructuraInventario();
    var p = APP_STATE.inventario.productos.find(function(item) { return item.id === productoId; });
    if (!p) return;

    var stock = Math.max(0, Number(p.stock) || 0);
    if (stock <= 0) {
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

    if (inId) inId.value = p.id;
    if (badgeCat) badgeCat.textContent = (p.categoriaIcono || '🏷️') + " " + (p.categoriaNombre || "General");
    if (txtNom) txtNom.textContent = p.nombre;
    if (badgeStock) badgeStock.textContent = stock + " unidades disponibles";

    if (inCant) {
        inCant.value = "1";
        inCant.max = stock;
    }
    if (inPre) {
        inPre.value = (Number(p.costo) || 0).toFixed(2);
    }
    if (inObs) {
        inObs.value = "";
    }

    actualizarTotalVentaCalculado();
    modal.style.display = 'flex';
    if (inObs) setTimeout(function() { inObs.focus(); }, 120);
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
 * Confirma la venta, resta la cantidad del stock del producto y archiva la venta
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

    var cantidad = inCant ? parseInt(inCant.value, 10) : 1;
    if (isNaN(cantidad) || cantidad < 1) {
        alert("Por favor introduce una cantidad válida (mínimo 1).");
        if (inCant) inCant.focus();
        return;
    }

    var stockDisponible = Math.max(0, Number(prod.stock) || 0);
    if (cantidad > stockDisponible) {
        alert(`No puedes vender ${cantidad} unidades porque solo tienes ${stockDisponible} en stock.`);
        if (inCant) inCant.focus();
        return;
    }

    var precioUnitario = inPre ? parseFloat(inPre.value) : Number(prod.costo) || 0;
    if (isNaN(precioUnitario) || precioUnitario < 0) precioUnitario = 0;

    var totalVenta = cantidad * precioUnitario;
    var observacion = inObs ? inObs.value.trim() : '';

    var fechaHoy = typeof obtenerClaveFechaLocal === 'function' ? obtenerClaveFechaLocal() : new Date().toISOString().split('T')[0];
    var horaHoy = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // 1. Restar de la cantidad de stock del producto (Requerimiento explícito)
    prod.stock = Math.max(0, stockDisponible - cantidad);
    prod.totalVendidos = (Number(prod.totalVendidos) || 0) + cantidad;

    // 2. Crear registro de venta para el apartado de Vendidos
    var nuevaVenta = {
        id: "VENTA-" + Date.now(),
        productoId: prod.id,
        productoNombre: prod.nombre,
        categoriaId: prod.categoriaId || '',
        categoriaNombre: prod.categoriaNombre || 'General',
        categoriaIcono: prod.categoriaIcono || '🏷️',
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
        var descFinanza = `Venta: ${prod.nombre} (${cantidad} unid${cantidad > 1 ? 'es' : ''})${observacion ? ' - ' + observacion : ''}`;
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

    alert(`✓ ¡Venta registrada exitosamente!\n\n• Producto: ${prod.nombre}\n• Unidades vendidas: ${cantidad}\n• Stock restante: ${prod.stock} unids\n• Total: $${totalVenta.toFixed(2)}\n• Observación: "${observacion || 'Sin observación'}"`);
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
                Cuando registres ventas de tus productos aparecerán en este historial con su fecha, unidades, monto recaudado y tu observación.
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
                    <span style="font-size: 11.5px; color: #6b7280; font-weight: 600;">
                        📅 ${venta.fecha} ${venta.hora ? '· ' + venta.hora : ''}
                    </span>
                </div>

                <!-- Nombre del Producto Vendido -->
                <h4 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 800; color: #111827;">
                    ${venta.productoNombre}
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
        var f = (v.fecha || '').toLowerCase();
        return (n.indexOf(q) !== -1 || o.indexOf(q) !== -1 || c.indexOf(q) !== -1 || f.indexOf(q) !== -1);
    });

    renderizarVendidosInventario(filtradas);
}

/**
 * Anula una venta y devuelve las unidades al stock del producto
 */
function anularVentaInventario(ventaId) {
    asegurarEstructuraInventario();
    var venta = APP_STATE.inventario.ventas.find(function(v) { return v.id === ventaId; });
    if (!venta) return;

    var cant = Number(venta.cantidad) || 1;
    var confirmMsg = `¿Deseas revertir esta venta?\n\n• Producto: ${venta.productoNombre}\n• Se reincorporarán ${cant} unidad(es) al stock del producto.\n• Se eliminará del historial de vendidos.`;

    if (confirm(confirmMsg)) {
        // Devolver stock al producto si aún existe
        var prod = APP_STATE.inventario.productos.find(function(p) { return p.id === venta.productoId; });
        if (prod) {
            prod.stock = (Number(prod.stock) || 0) + cant;
            prod.totalVendidos = Math.max(0, (Number(prod.totalVendidos) || 0) - cant);
        }

        // Eliminar del historial de ventas
        APP_STATE.inventario.ventas = APP_STATE.inventario.ventas.filter(function(v) {
            return v.id !== ventaId;
        });

        MonarcaDB.save(APP_STATE);
        renderizarVendidosInventario();
        actualizarMetricasKpisInventario();
        alert(`✓ Venta anulada con éxito. Se reincorporaron ${cant} unidad(es) al inventario.`);
    }
}
