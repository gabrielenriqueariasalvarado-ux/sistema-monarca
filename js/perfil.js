/**
 * SISTEMA MONARCA · MÓDULO DE PERFIL DE USUARIO & CENTRO DE SINCRONIZACIÓN
 * Estadísticas de Jugador, Sincronización Multi-Dispositivo (Laptop ↔ Teléfono) y Respaldos.
 */

function cargarPerfil() {
    renderizarPerfil(APP_STATE.perfil);
}

function renderizarPerfil(perfil) {
    var p = perfil || APP_STATE.perfil || { str: 10, int: 10, vit: 10, mp: 100 };
    var j = APP_STATE.jugador || { titulo: "Gabriel Arias", nivel: 1, exp: 0, expMax: 100 };

    var html = `
    <!-- 1. ATRIBUTOS DEL JUGADOR -->
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px;">
            <h3 style="margin: 0; font-size: 15px; color: #111827;">⚔️ Atributos Principales</h3>
            <span style="font-size: 12px; font-weight: 700; color: #4b5563; background: #f3f4f6; padding: 3px 9px; border-radius: 9999px;">Nivel ${j.nivel || 1}</span>
        </div>
        <table class="table-finanzas" style="margin-bottom: 0;">
            <tbody>
                <tr><td><strong>Fuerza (STR)</strong></td><td style="text-align: right; font-weight: 700;">${p.str || 10}</td></tr>
                <tr><td><strong>Inteligencia (INT)</strong></td><td style="text-align: right; font-weight: 700;">${p.int || 10}</td></tr>
                <tr><td><strong>Vitalidad (VIT)</strong></td><td style="text-align: right; font-weight: 700;">${p.vit || 10}</td></tr>
                <tr><td><strong>Maná / Energía (MP)</strong></td><td style="text-align: right; font-weight: 700;">${p.mp || 100}</td></tr>
            </tbody>
        </table>
    </div>
    
    <!-- 2. CENTRO DE SINCRONIZACIÓN MULTI-DISPOSITIVO -->
    <div class="sync-hub-card">
        <div class="sync-hub-header">
            <div>
                <span class="sync-badge-pill">MULTI-DISPOSITIVO</span>
                <h3 class="sync-hub-title">🔄 Sincronización (Laptop ↔ Teléfono)</h3>
                <p class="sync-hub-subtitle">
                    Pasa tus datos de un dispositivo a otro al instante usando el método que te resulte más cómodo.
                </p>
            </div>
        </div>

        <div class="sync-grid-methods">
            <!-- MÉTODO 1: COPIAR Y PEGAR CÓDIGO (EL MÁS RÁPIDO PARA WHATSAPP) -->
            <div class="sync-method-card sync-method-highlight">
                <div class="sync-method-icon">📋</div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <h4 style="margin: 0; font-size: 14px; color: #111827;">Sincronización Rápida por Código</h4>
                        <span class="sync-tag-recommended">Recomendado</span>
                    </div>
                    <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">
                        Copia una clave con todos tus datos en 1 clic para enviártela a tu propio chat de WhatsApp o notas y pegarla en tu teléfono.
                    </p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn-sync-action btn-sync-dark" onclick="copiarCodigoSincronizacion()">
                            📋 Copiar Código
                        </button>
                        <button class="btn-sync-action btn-sync-light" onclick="abrirModalSincronizarCodigo()">
                            📥 Pegar y Sincronizar
                        </button>
                    </div>
                </div>
            </div>

            <!-- MÉTODO 2: COMPARTIR DIRECTO (WEB SHARE API) -->
            <div class="sync-method-card">
                <div class="sync-method-icon">📤</div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #111827;">Compartir Directo (WhatsApp / Drive)</h4>
                    <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">
                        Abre la hoja nativa de compartir de tu teléfono o laptop para mandar el respaldo directamente a WhatsApp, Telegram o Google Drive.
                    </p>
                    <button class="btn-sync-action btn-sync-light" onclick="MonarcaDB.shareBackup()">
                        📤 Compartir Respaldo
                    </button>
                </div>
            </div>

            <!-- MÉTODO 3: ARCHIVO JSON TRADICIONAL -->
            <div class="sync-method-card">
                <div class="sync-method-icon">💾</div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #111827;">Archivo de Respaldo (.JSON)</h4>
                    <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">
                        Descarga una copia completa en tu equipo o carga un archivo JSON que hayas transferido previamente.
                    </p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn-sync-action btn-sync-light" onclick="MonarcaDB.exportBackup()">
                            💾 Descargar JSON
                        </button>
                        <label class="btn-sync-action btn-sync-light" style="cursor: pointer; margin-bottom: 0;">
                            📂 Cargar Archivo
                            <input type="file" accept=".json" style="display: none;" onchange="if(this.files[0]) MonarcaDB.importBackup(this.files[0])">
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- ZONA DE RESTABLECIMIENTO -->
        <div style="margin-top: 20px; padding-top: 14px; border-top: 1px dashed #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
                <strong style="font-size: 12px; color: #111827; display: block;">Limpieza y Restablecimiento de Fábrica</strong>
                <span style="font-size: 11px; color: #6b7280;">Elimina todos los datos de prueba y deja la app 100% limpia para que agregues tus propias cosas.</span>
            </div>
            <button class="btn-delete-row" style="font-size: 11.5px; padding: 7px 14px; border-radius: 9999px; background: #fff; border: 1px solid #fee2e2; color: #dc2626; font-weight: 700; cursor: pointer;" onclick="MonarcaDB.resetDefault()">
                🗑️ Restablecer de Fábrica (Todo Limpio)
            </button>
        </div>
    </div>`;

    var cont = document.getElementById('contenedor-perfil');
    if (cont) cont.innerHTML = html;
}

// --- FUNCIONES DEL CENTRO DE SINCRONIZACIÓN ---

function copiarCodigoSincronizacion() {
    var codigo = MonarcaDB.generateSyncCode();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codigo).then(function() {
            alert("📋 ¡Código de sincronización copiado al portapapeles!\n\nAhora ve a tu WhatsApp o Telegram, envíatelo a ti mismo y en tu teléfono abre la app y selecciona '📥 Pegar y Sincronizar'.");
        }).catch(function() {
            mostrarPromptCodigo(codigo);
        });
    } else {
        mostrarPromptCodigo(codigo);
    }
}

function mostrarPromptCodigo(codigo) {
    prompt("Copia este código de sincronización para llevar tus datos a tu teléfono:", codigo);
}

function abrirModalSincronizarCodigo() {
    var inTexto = document.getElementById('modal-sync-input-codigo');
    if (inTexto) inTexto.value = "";
    var prev = document.getElementById('modal-sync-preview-box');
    if (prev) prev.innerHTML = '<span style="color:#9ca3af; font-size:12px;">Pega tu código arriba para ver los datos a restaurar.</span>';
    var btn = document.getElementById('btn-confirmar-sync-codigo');
    if (btn) btn.disabled = true;

    var m = document.getElementById('modal-sincronizar-codigo');
    if (m) m.style.display = 'flex';
}

function cerrarModalSincronizarCodigo() {
    var m = document.getElementById('modal-sincronizar-codigo');
    if (m) m.style.display = 'none';
}

async function pegarDesdePortapapelesSync() {
    var inTexto = document.getElementById('modal-sync-input-codigo');
    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            var clipText = await navigator.clipboard.readText();
            if (clipText && inTexto) {
                inTexto.value = clipText.trim();
                analizarCodigoSincronizacion(clipText.trim());
                return;
            }
        }
    } catch(err) {
        console.warn("Clipboard access denied:", err);
    }
    if (inTexto) inTexto.focus();
}

function analizarCodigoSincronizacion(codigo) {
    var prev = document.getElementById('modal-sync-preview-box');
    var btn = document.getElementById('btn-confirmar-sync-codigo');
    if (!prev) return;

    if (!codigo || codigo.trim() === '') {
        prev.innerHTML = '<span style="color:#9ca3af; font-size:12px;">Pega tu código arriba para ver los datos a restaurar.</span>';
        if (btn) btn.disabled = true;
        return;
    }

    try {
        var data = MonarcaDB.decodeSyncCode(codigo);
        if (data && typeof data === 'object') {
            var nNom = data.jugador ? data.jugador.titulo : "Gabriel Arias";
            var nNiv = data.jugador ? data.jugador.nivel : 1;
            var nMis = data.misiones ? data.misiones.length : 0;
            var nHab = data.habilidades ? data.habilidades.length : 0;
            var nIng = (data.finanzas && data.finanzas.ingresos) ? data.finanzas.ingresos.length : 0;
            var nGas = (data.finanzas && data.finanzas.gastos) ? data.finanzas.gastos.length : 0;
            var nIde = data.ideas ? data.ideas.length : 0;
            var nRut = data.rutinas ? data.rutinas.length : 0;
            var nEj = data.ejercicios ? data.ejercicios.length : 0;

            prev.innerHTML = `
            <div style="color: #065f46; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 10px 14px; font-size: 12.5px;">
                <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <span>✓</span> Respaldo verificado con éxito
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; color: #047857; margin-top: 6px;">
                    <div>• 👤 Jugador: <strong>${nNom} (Nivel ${nNiv})</strong></div>
                    <div>• ⚡ Misiones: <strong>${nMis} hábitos</strong></div>
                    <div>• 🔮 Habilidades: <strong>${nHab} activas</strong></div>
                    <div>• 💰 Finanzas: <strong>${nIng} ingresos / ${nGas} gastos</strong></div>
                    <div>• 💡 Ideas: <strong>${nIde} guardadas</strong></div>
                    <div>• 🏋️‍♂️ Condición: <strong>${nRut} rutinas, ${nEj} ejercicios</strong></div>
                </div>
            </div>`;

            if (btn) {
                btn.disabled = false;
                btn.onclick = function() {
                    MonarcaDB.applySyncData(data);
                };
            }
        }
    } catch(err) {
        prev.innerHTML = `
        <div style="color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 12px;">
            ⚠️ El código ingresado no tiene un formato válido o está incompleto.
        </div>`;
        if (btn) btn.disabled = true;
    }
}
