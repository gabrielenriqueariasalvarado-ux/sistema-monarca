/**
 * SISTEMA MONARCA · MÓDULO CENTRAL (CORE)
 * Base de datos LocalStorage, Sistema de Niveles/EXP y Enrutador de Navegación.
 */

/**
 * SISTEMA MONARCA · MOTOR DE APLICACIÓN PWA (OFFLINE & LOCALSTORAGE)
 * Aplicación Web Progresiva Independiente de Google Apps Script.
 * Almacenamiento 100% Local, Rápido y Reactivo.
 */

// ==========================================================================
// 1. CAPA DE PERSISTENCIA LOCAL (LOCALSTORAGE)
// ==========================================================================

const MONARCA_STORAGE_KEY = 'sistema_monarca_db_v1';

const DEFAULT_STATE = {
    jugador: {
        titulo: "Gabriel Arias",
        nivel: 1,
        exp: 0,
        expMax: 100
    },
    perfil: {
        str: 10,
        int: 10,
        vit: 10,
        mp: 100
    },
    misiones: [],
    habilidades: [],
    fatiga: {
        promedioHoy: 0,
        ultimoCierre: "Inicio del sistema",
        mente: 0,
        delt_ant: 0, delt_lat: 0, delt_post: 0, manguito: 0,
        pect_mayor: 0, pect_menor: 0,
        biceps: 0, triceps: 0, antebrazos: 0,
        trapecios: 0, dorsales: 0, lumbares: 0,
        core: 0,
        gluteos: 0, cadera: 0,
        cuadriceps: 0, isquios: 0,
        pantorrillas: 0
    },
    gym: [
        { fecha: "Hoy", detalle: "Sistema Monarca PWA instalado y listo" }
    ],
    rutinas: [
        {
            codigo: "RUT-1",
            nombre: "Rutina Mañanera",
            rankLabel: "DIARIA · ACTIVACIÓN",
            ejercicios: [
                { nombre: "Flexiones", descripcion: "100 REPETICIONES", fatiga: { pect_mayor: 15, triceps: 15, delt_ant: 10 } },
                { nombre: "Abdominales", descripcion: "100 REPETICIONES", fatiga: { core: 25 } },
                { nombre: "Sentadillas", descripcion: "100 REPETICIONES", fatiga: { cuadriceps: 20, gluteos: 15 } },
                { nombre: "Plancha", descripcion: "5 MINUTOS", fatiga: { core: 20, hombros: 10 } }
            ]
        },
        {
            codigo: "RUT-2",
            nombre: "Rutina de Empuje",
            rankLabel: "LUNES · FUERZA",
            ejercicios: [
                { nombre: "Press de Banca Plano", descripcion: "4 SERIES × 8-10 REPS", fatiga: { pect_mayor: 30, triceps: 15 } },
                { nombre: "Press Militar Mancuernas", descripcion: "3 SERIES × 10 REPS", fatiga: { delt_ant: 25, delt_lat: 15 } },
                { nombre: "Extensiones Tríceps Polea", descripcion: "3 SERIES × 12 REPS", fatiga: { triceps: 25 } }
            ]
        },
        {
            codigo: "RUT-3",
            nombre: "Rutina de Pierna",
            rankLabel: "MIÉRCOLES · POTENCIA",
            ejercicios: [
                { nombre: "Bicicleta", descripcion: "CALENTAMIENTO / INTERVALOS", fatiga: { cuadriceps: 15 } },
                { nombre: "Agarre / Antebrazos", descripcion: "ANTEBRAZOS Y AGARRE", fatiga: { antebrazos: 25 } },
                { nombre: "Sentadilla con Barra", descripcion: "4 SERIES × 12 REPETICIONES", fatiga: { cuadriceps: 35, gluteos: 25 } }
            ]
        },
        {
            codigo: "RUT-4",
            nombre: "Rutina de Arrastre",
            rankLabel: "VIERNES · TRACCIÓN",
            ejercicios: [
                { nombre: "Jalón al Pecho en Polea", descripcion: "3 SERIES × 10 REPETICIONES", fatiga: { dorsales: 30, biceps: 15 } },
                { nombre: "Remo con Mancuerna", descripcion: "3 SERIES × 10 REPETICIONES", fatiga: { trapecios: 25, dorsales: 20 } },
                { nombre: "Curl de Bíceps", descripcion: "3 SERIES × 12 REPETICIONES", fatiga: { biceps: 30 } }
            ]
        }
    ],
    salud: [
        { fecha: "Hoy", valor: "8 horas de sueño - Descanso óptimo" }
    ],
    finanzas: {
        cabecera: {
            nombre: "Gabriel Arias",
            mes: "Septiembre 2026",
            objetivo: "Ahorrar para la moto, liquidar deudas y optimizar gastos"
        },
        ingresos: [
            { id: "ING-1", fuente: "Sueldo Principal", dia: 15, monto: 600 },
            { id: "ING-2", fuente: "Proyectos Extra / Freelance", dia: 30, monto: 250 }
        ],
        gastos: [
            { id: "GAS-1", concepto: "Alquiler de Vivienda", categoria: "Vivienda", dia: 5, monto: 180 },
            { id: "GAS-2", concepto: "Compras de Supermercado", categoria: "Alimentación", dia: 10, monto: 120 },
            { id: "GAS-3", concepto: "Gasolina y Mantenimiento", categoria: "Moto", dia: 12, monto: 35 },
            { id: "GAS-4", concepto: "Internet y Luz", categoria: "Servicios", dia: 18, monto: 45 }
        ],
        deudas: [
            { id: "DEU-1", nombre: "Tarjeta de Crédito", dia: 20, montoTotal: 60 }
        ],
        metas: [
            { id: "MET-1", nombre: "Moto / Ahorro", metaTotal: 1200, ahorrado: 300, faltante: 900, meses: 6, cuotaQuincenal: 75 }
        ]
    },
    ideas: [
        { id: 1, texto: "Crear plantilla de finanzas y automatización PWA (28/09)", categoria: "📊 Planes y Monitoreo de Ejecución", subcategoria: "💼 Trabajo, Programación y Proyectos Profesionales", contexto: "🏠 Casa", fecha: "28/09", timestamp: 1727546400000, hecha: false },
        { id: 2, texto: "Comprar soporte de teléfono para la moto (28/09)", categoria: "🛒 Compras", subcategoria: "👕 Ropa y Accesorios", contexto: "🛣️ Calle", fecha: "28/09", timestamp: 1727546500000, hecha: false },
        { id: 3, texto: "Estudiar patrones de PWA y Service Workers (28/09)", categoria: "🧠 Cosas por Aprender", subcategoria: "💻 Programación y Tecnología", contexto: "💼 Trabajo", fecha: "28/09", timestamp: 1727546600000, hecha: false },
        { id: 4, texto: "Mantener constancia en el entrenamiento y lectura (28/09)", categoria: "💭 Ideas y Pensamientos", subcategoria: "🧠 Mis Pensamientos (Filosofía, Mentalidad y Enfoque)", contexto: "🏠 Casa", fecha: "28/09", timestamp: 1727546700000, hecha: false },
        { id: 5, texto: "Limpiar y organizar el escritorio de trabajo (28/09)", categoria: "✅ Tareas Pendientes", subcategoria: "🏠 Casa", contexto: "🏠 Casa", fecha: "28/09", timestamp: 1727546800000, hecha: false },
        { id: 6, texto: "Optimización de arquitectura offline para el sistema (28/09)", categoria: "📊 Planes y Monitoreo de Ejecución", subcategoria: "💼 Trabajo, Programación y Proyectos Profesionales", contexto: "💼 Trabajo", fecha: "28/09", timestamp: 1727546900000, timestampHecha: Date.now(), fechaHecha: "28/09/2026", hecha: true }
    ],
    calendario: []
};

const MonarcaDB = {
    get: function() {
        try {
            var raw = localStorage.getItem(MONARCA_STORAGE_KEY);
            if (!raw) {
                this.save(DEFAULT_STATE);
                return JSON.parse(JSON.stringify(DEFAULT_STATE));
            }
            var data = JSON.parse(raw);
            // Asegurar que existan todas las estructuras esperadas
            if (!data.jugador) data.jugador = DEFAULT_STATE.jugador;
            if (!data.perfil) data.perfil = DEFAULT_STATE.perfil;
            // Purga automática de misiones y habilidades quemadas (estáticas) para modo dinámico
            if (!data.v2_clean_defaults) {
                data.misiones = [];
                data.habilidades = [];
                data.v2_clean_defaults = true;
                this.save(data);
            }
            if (!data.misiones) data.misiones = [];
            if (!data.habilidades) data.habilidades = [];
            // Limpieza y soporte de ejercicios y rutinas dinámicas
            if (!data.v3_clean_rutinas) {
                data.rutinas = [];
                data.ejercicios = [];
                data.v3_clean_rutinas = true;
                this.save(data);
            }
            if (!data.ejercicios) data.ejercicios = [];
            if (!data.rutinas) data.rutinas = [];
            if (!data.fatiga) data.fatiga = DEFAULT_STATE.fatiga;
            if (!data.gym) data.gym = DEFAULT_STATE.gym;
            if (!data.rutinas) data.rutinas = DEFAULT_STATE.rutinas;
            if (!data.salud) data.salud = DEFAULT_STATE.salud;
            if (!data.finanzas) data.finanzas = DEFAULT_STATE.finanzas;
            if (!data.calendario || !Array.isArray(data.calendario)) data.calendario = [];
            if (!data.ideas || !Array.isArray(data.ideas) || data.ideas.length === 0) {
                data.ideas = JSON.parse(JSON.stringify(DEFAULT_STATE.ideas));
            } else {
                // Reparar subcategorías huérfanas si existieran
                data.ideas.forEach(function(i) {
                    if (!i.categoria) i.categoria = "💭 Ideas y Pensamientos";
                    if (i.subcategoria === "Sistemas & Apps") i.subcategoria = "💼 Trabajo, Programación y Proyectos Profesionales";
                    if (i.subcategoria === "Accesorios Moto") i.subcategoria = "👕 Ropa y Accesorios";
                    if (i.subcategoria === "Desarrollo Web") i.subcategoria = "💻 Programación y Tecnología";
                    if (!i.timestamp) i.timestamp = Date.now();
                });
            }
            return data;
        } catch (e) {
            console.error("Error al leer de localStorage:", e);
            return JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    },
    save: function(state) {
        try {
            localStorage.setItem(MONARCA_STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Error al guardar en localStorage:", e);
        }
    },
    exportBackup: function() {
        var now = new Date();
        var fechaStr = now.getFullYear() + "-" + 
            String(now.getMonth() + 1).padStart(2, '0') + "-" + 
            String(now.getDate()).padStart(2, '0') + "_" + 
            String(now.getHours()).padStart(2, '0') + "h" + 
            String(now.getMinutes()).padStart(2, '0');
        var fileName = "sistema_monarca_backup_" + fechaStr + ".json";
        var jsonText = JSON.stringify(APP_STATE, null, 2);
        
        var blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", url);
        downloadAnchor.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    },

    shareBackup: async function() {
        var now = new Date();
        var fechaStr = now.getFullYear() + "-" + 
            String(now.getMonth() + 1).padStart(2, '0') + "-" + 
            String(now.getDate()).padStart(2, '0') + "_" + 
            String(now.getHours()).padStart(2, '0') + "h" + 
            String(now.getMinutes()).padStart(2, '0');
        var fileName = "sistema_monarca_backup_" + fechaStr + ".json";
        var jsonText = JSON.stringify(APP_STATE, null, 2);
        var blob = new Blob([jsonText], { type: "application/json" });
        var file = new File([blob], fileName, { type: "application/json" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: "Respaldo Sistema Monarca",
                    text: "Datos actualizados de Sistema Monarca (" + fechaStr + ")",
                    files: [file]
                });
                return true;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.warn("Share failed, falling back to download:", err);
                    MonarcaDB.exportBackup();
                }
                return false;
            }
        } else {
            // Fallback: descarga directa y sugerencia de envío
            MonarcaDB.exportBackup();
            alert("Descargando archivo JSON... Puedes enviártelo a tu teléfono por WhatsApp, Telegram o Google Drive.");
            return false;
        }
    },

    generateSyncCode: function() {
        try {
            var rawStr = JSON.stringify(APP_STATE);
            // Codificación UTF-8 segura en Base64
            var utf8Bytes = encodeURIComponent(rawStr).replace(/%([0-9A-F]{2})/g, function(match, p1) {
                return String.fromCharCode('0x' + p1);
            });
            var b64 = btoa(utf8Bytes);
            return "MONARCA_SYNC_" + b64;
        } catch (e) {
            console.error("Error generando código de sincronización:", e);
            return JSON.stringify(APP_STATE);
        }
    },

    decodeSyncCode: function(codigo) {
        if (!codigo || typeof codigo !== 'string') {
            throw new Error("El código de sincronización está vacío.");
        }
        var str = codigo.trim();
        if (str.startsWith("MONARCA_SYNC_")) {
            str = str.replace("MONARCA_SYNC_", "");
            var decodedBytes = atob(str);
            var jsonStr = decodeURIComponent(Array.prototype.map.call(decodedBytes, function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonStr);
        } else {
            return JSON.parse(str);
        }
    },

    applySyncData: function(data) {
        if (!data || typeof data !== 'object') {
            throw new Error("Estructura de datos inválida.");
        }
        // Validar que tenga al menos uno de los campos nucleares
        if (!data.jugador && !data.finanzas && !data.ideas && !data.misiones) {
            throw new Error("Los datos no corresponden a una copia válida de Sistema Monarca.");
        }

        APP_STATE = data;
        MonarcaDB.save(APP_STATE);
        alert("🎉 ¡Sincronización completada con éxito! Tus datos se han actualizado.");
        location.reload();
    },

    importBackup: function(file) {
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var imported = JSON.parse(e.target.result);
                if (imported && (imported.jugador || imported.finanzas || imported.ideas || imported.misiones)) {
                    var nJugador = imported.jugador ? (imported.jugador.titulo + " (Nivel " + imported.jugador.nivel + ")") : "Sin perfil";
                    var nFinanzas = (imported.finanzas && imported.finanzas.ingresos) ? imported.finanzas.ingresos.length : 0;
                    var nIdeas = imported.ideas ? imported.ideas.length : 0;
                    var nMis = imported.misiones ? imported.misiones.length : 0;

                    var msg = "¿Confirmas restaurar este respaldo?\n\n" +
                              "• Jugador: " + nJugador + "\n" +
                              "• Misiones: " + nMis + "\n" +
                              "• Finanzas: " + nFinanzas + " ingresos\n" +
                              "• Ideas: " + nIdeas + "\n\n" +
                              "Tus datos actuales en este dispositivo se reemplazarán con los de este archivo.";
                    
                    if (confirm(msg)) {
                        APP_STATE = imported;
                        MonarcaDB.save(APP_STATE);
                        alert("¡Copia de seguridad restaurada con éxito!");
                        location.reload();
                    }
                } else {
                    alert("El archivo seleccionado no tiene un formato válido de Sistema Monarca.");
                }
            } catch (err) {
                alert("Error al importar archivo: " + err.message);
            }
        };
        reader.readAsText(file);
    },

    resetDefault: function() {
        if (confirm("⚠️ ¿Estás seguro de que deseas restablecer todos los datos a sus valores iniciales? Esta acción eliminará permanentemente los datos locales de este dispositivo.")) {
            localStorage.removeItem(MONARCA_STORAGE_KEY);
            APP_STATE = JSON.parse(JSON.stringify(DEFAULT_STATE));
            MonarcaDB.save(APP_STATE);
            alert("Sistema restablecido a los valores por defecto.");
            location.reload();
        }
    }
};

// Estado global de la aplicación en memoria
var APP_STATE = MonarcaDB.get();

// ==========================================================================
// 2. INICIALIZACIÓN Y NAVEGACIÓN
// ==========================================================================

window.addEventListener('DOMContentLoaded', function() {
    inicializarSistema();
});

function inicializarSistema() {
    APP_STATE = MonarcaDB.get();
    renderizarJugador(APP_STATE.jugador);
    renderizarBarrasFatiga(APP_STATE.fatiga);
    inicializarBancoDeIdeas();
}

function cambiarVista(vistaId) {
    var tabs = document.getElementsByClassName('tab-content');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    
    var vistaActiva = document.getElementById(vistaId);
    if (vistaActiva) {
        vistaActiva.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    switch(vistaId) {
        case 'vista-menu':
            renderizarJugador(APP_STATE.jugador);
            break;
        case 'vista-perfil':
            cargarPerfil();
            break;
        case 'vista-estado-personal':
            cargarEstadoPersonal();
            break;
        case 'vista-misiones':
            cargarMisiones();
            break;
        case 'vista-habilidades':
            cargarHabilidades();
            break;
        case 'vista-gym':
            cargarGym();
            break;
        case 'vista-ejercicios':
            cargarEjercicios();
            break;
        case 'vista-mente':
            cargarMente();
            break;
        case 'vista-finanzas':
            cargarFinanzas();
            break;
        case 'vista-ideas':
            cargarIdeas();
            break;
        case 'vista-calendario':
            renderizarCalendario();
            break;
    }
}

// ==========================================================================
// 3. JUGADOR, EXP Y NIVEL
// ==========================================================================

function renderizarJugador(datos) {
    if (!datos) datos = APP_STATE.jugador || DEFAULT_STATE.jugador;
    var tituloElem = document.getElementById('player-title');
    var nivelElem = document.getElementById('player-level');
    var titulo = datos.titulo || "Gabriel Arias";
    if (tituloElem) tituloElem.innerText = titulo;
    if (nivelElem) nivelElem.innerText = "Nivel: " + (datos.nivel || 1) + " · Progreso EXP: " + (datos.exp || 0) + " / " + (datos.expMax || 100);
}

function sumarExp(cantidad) {
    if (!APP_STATE.jugador) APP_STATE.jugador = { titulo: "Gabriel Arias", nivel: 1, exp: 0, expMax: 100 };
    APP_STATE.jugador.exp = (APP_STATE.jugador.exp || 0) + cantidad;
    var subioNivel = false;
    while (APP_STATE.jugador.exp >= APP_STATE.jugador.expMax) {
        APP_STATE.jugador.exp -= APP_STATE.jugador.expMax;
        APP_STATE.jugador.nivel = (APP_STATE.jugador.nivel || 1) + 1;
        APP_STATE.jugador.expMax = Math.round(APP_STATE.jugador.expMax * 1.25);
        if (!APP_STATE.perfil) APP_STATE.perfil = { str: 10, int: 10, vit: 10, mp: 100 };
        APP_STATE.perfil.str = (APP_STATE.perfil.str || 10) + 1;
        APP_STATE.perfil.int = (APP_STATE.perfil.int || 10) + 1;
        APP_STATE.perfil.vit = (APP_STATE.perfil.vit || 10) + 1;
        APP_STATE.perfil.mp = (APP_STATE.perfil.mp || 100) + 10;
        subioNivel = true;
    }
    MonarcaDB.save(APP_STATE);
    renderizarJugador(APP_STATE.jugador);
    if (subioNivel) {
        setTimeout(function() {
            alert("🎉 ¡SUBISTE DE NIVEL! Ahora eres Nivel " + APP_STATE.jugador.nivel + ". ¡Tus atributos han aumentado!");
        }, 150);
    }
}
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
            <span style="font-size: 11.5px; color: #9ca3af;">Almacenamiento Local PWA (Persistencia Segura Offline)</span>
            <button class="btn-delete-row" style="font-size: 11.5px; padding: 6px 12px; border-radius: 9999px; background: #fff; border: 1px solid #e5e7eb;" onclick="MonarcaDB.resetDefault()">
                Restablecer de Fábrica
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
/**
 * SISTEMA MONARCA · MÓDULO DE ESTADO PERSONAL
 * Mapa de Calor Anatómico SVG, Banco de Ejercicios, Rutinas Dinámicas y Mente.
 */

var METADATOS_MUSCULOS = {
    "mente": { nombre: "Mente & Concentración", icono: "🧠", region: "Sistema Neural · Cabeza", descanso: "Descanso mental, desconexión y sueño reparador." },
    "delt_ant": { nombre: "Deltoides Anterior (Frontal)", icono: "🛡️", region: "Hombros · Tren Superior", descanso: "Reducir empujes y movimientos verticales." },
    "delt_lat": { nombre: "Deltoides Lateral (Anchura)", icono: "🛡️", region: "Hombros · Tren Superior", descanso: "Limitar elevaciones laterales y presses." },
    "delt_post": { nombre: "Deltoides Posterior (Dorsal)", icono: "🛡️", region: "Hombros · Tren Superior", descanso: "Descansar jalones traseros y aperturas invertidas." },
    "manguito": { nombre: "Manguito Rotador", icono: "🔄", region: "Hombros · Estabilizadores", descanso: "Evitar sobrecargas articulares pesadas." },
    "pect_mayor": { nombre: "Pectoral Mayor", icono: "⚔️", region: "Pecho · Tren Superior", descanso: "Óptimo descansar 48 hrs tras press pesado." },
    "pect_menor": { nombre: "Pectoral Menor", icono: "⚔️", region: "Pecho · Tren Superior", descanso: "Realizar estiramientos suaves de apertura torácica." },
    "biceps": { nombre: "Bíceps Braquial", icono: "💪", region: "Brazos · Flexores", descanso: "Descansar curls y flexiones de codo intensas." },
    "triceps": { nombre: "Tríceps Braquial", icono: "💪", region: "Brazos · Extensores", descanso: "Reducir fondos y extensiones de tríceps." },
    "antebrazos": { nombre: "Antebrazos & Agarre", icono: "✊", region: "Brazos · Agarre y Muñecas", descanso: "Masajear flexores y estirar dedos y muñecas." },
    "trapecios": { nombre: "Trapecios y Romboides", icono: "🦅", region: "Espalda Superior · Cuello", descanso: "Liberar tensión cervical y postura de hombros." },
    "dorsales": { nombre: "Dorsales & Redondos", icono: "🦅", region: "Espalda Media · Anchura V", descanso: "Descansar dominadas y jalones pesados." },
    "lumbares": { nombre: "Erectores Espinales (Lumbar)", icono: "🏛️", region: "Espalda Baja · Núcleo", descanso: "Evitar cargas axiales de peso muerto y sentadilla." },
    "core": { nombre: "Core (Abdomen & Oblicuos)", icono: "⚡", region: "Centro de Estabilidad", descanso: "Descansar flexiones de tronco e isométricos." },
    "gluteos": { nombre: "Glúteos (Mayor & Medio)", icono: "🍑", region: "Cadera & Tren Inferior", descanso: "Estirar flexores de cadera y movilidad." },
    "cadera": { nombre: "Cadera / Aductores", icono: "🥋", region: "Pelvis · Estabilidad", descanso: "Movilidad articular profunda y estiramiento." },
    "cuadriceps": { nombre: "Cuádriceps", icono: "🦵", region: "Muslos · Tren Inferior", descanso: "Hidratar cuádriceps tras sesiones de sentadilla." },
    "isquios": { nombre: "Isquiotibiales", icono: "🦵", region: "Cadena Posterior · Piernas", descanso: "Estiramiento suave de cadena posterior y descanso." },
    "pantorrillas": { nombre: "Pantorrillas (Gemelos & Sóleo)", icono: "🦶", region: "Piernas Bajas & Tobillos", descanso: "Movilidad de tobillos y elevaciones suaves." }
};

var MUSCULO_ACTIVO_HEATMAP = "pect_mayor";

function cargarEstadoPersonal() {
    renderizarBarrasFatiga(APP_STATE.fatiga);
}

function obtenerEstiloFatigaGris(val) {
    var v = Math.min(100, Math.max(0, Number(val) || 0));
    if (v === 0) {
        return { fill: 'rgba(243, 244, 246, 0.65)', stroke: '#d1d5db', label: '0% · Sin fatiga', levelText: 'Completamente fresco' };
    }
    if (v <= 35) {
        return { fill: 'rgba(55, 65, 81, 0.22)', stroke: '#9ca3af', label: v + '% · Carga Ligera', levelText: 'Carga leve, óptimo para entrenar' };
    }
    if (v <= 69) {
        return { fill: 'rgba(31, 41, 55, 0.60)', stroke: '#4b5563', label: v + '% · Fatiga Moderada', levelText: 'Fatiga media acumulada, técnica cuidada' };
    }
    return { fill: '#111827', stroke: '#000000', label: v + '% · Carga Alta', levelText: 'Sobrecarga elevada, se sugiere descanso' };
}

function renderizarBarrasFatiga(f) {
    var fatiga = f || APP_STATE.fatiga || {};

    // Calcular estadísticas globales
    var sumaTotal = 0;
    var countTotal = 0;
    var maxVal = -1;
    var maxKey = "mente";

    Object.keys(METADATOS_MUSCULOS).forEach(function(k) {
        var val = Number(fatiga[k]) || 0;
        sumaTotal += val;
        countTotal++;
        if (val > maxVal) {
            maxVal = val;
            maxKey = k;
        }
    });

    var promedioGeneral = countTotal > 0 ? Math.round(sumaTotal / countTotal) : 0;
    var promedioElem = document.getElementById('promedio-hoy-display');
    var cierreElem = document.getElementById('ultimo-cierre-display');
    if (promedioElem) promedioElem.innerText = promedioGeneral + "%";
    if (cierreElem) cierreElem.innerText = fatiga.ultimoCierre || "Registro local activo";

    if (!MUSCULO_ACTIVO_HEATMAP || !METADATOS_MUSCULOS[MUSCULO_ACTIVO_HEATMAP]) {
        MUSCULO_ACTIVO_HEATMAP = maxKey;
    }

    // Helper para obtener estilo de color en SVG
    function estilo(key) {
        var s = obtenerEstiloFatigaGris(fatiga[key]);
        return `fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.3"`;
    }

    var html = `
    <div class="heatmap-dashboard-card">
        <div class="heatmap-layout">
            <!-- COLUMNA 1: SILUETA ANATÓMICA CORPORAL (FRONTAL & DORSAL) -->
            <div class="body-diagram-box">
                <div style="display: flex; justify-content: space-around; margin-bottom: 8px;">
                    <span style="font-size: 11px; font-weight: 800; color: #111827; letter-spacing: 0.5px;">ANTERIOR (FRENTE)</span>
                    <span style="font-size: 11px; font-weight: 800; color: #111827; letter-spacing: 0.5px;">POSTERIOR (ESPALDA)</span>
                </div>

                <div class="body-diagram-svg-container">
                    <svg viewBox="0 0 440 330" class="body-silhouette-svg">
                        <defs>
                            <filter id="hud-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#111827" flood-opacity="0.35"/>
                            </filter>
                        </defs>

                        <!-- SILUETA FRONTAL (X: 110 centro) -->
                        <g id="silueta-frontal">
                            <!-- Cabeza / Mente -->
                            <ellipse cx="110" cy="38" rx="18" ry="22" ${estilo('mente')} class="muscle-zone-path" data-muscle="mente" onclick="seleccionarMusculoHeatmap('mente')"></ellipse>
                            
                            <!-- Hombros Deltoides Anterior -->
                            <path d="M84 66 C76 72 70 82 72 94 C76 96 86 94 90 82 C90 74 88 68 84 66 Z" ${estilo('delt_ant')} class="muscle-zone-path" data-muscle="delt_ant" onclick="seleccionarMusculoHeatmap('delt_ant')"></path>
                            <path d="M136 66 C144 72 150 82 148 94 C144 96 134 94 130 82 C130 74 132 68 136 66 Z" ${estilo('delt_ant')} class="muscle-zone-path" data-muscle="delt_ant" onclick="seleccionarMusculoHeatmap('delt_ant')"></path>
                            
                            <!-- Pectoral Mayor -->
                            <path d="M90 75 C96 73 108 73 109 76 L109 102 C100 104 88 98 86 90 C86 82 88 77 90 75 Z" ${estilo('pect_mayor')} class="muscle-zone-path" data-muscle="pect_mayor" onclick="seleccionarMusculoHeatmap('pect_mayor')"></path>
                            <path d="M130 75 C124 73 112 73 111 76 L111 102 C120 104 132 98 134 90 C134 82 132 77 130 75 Z" ${estilo('pect_mayor')} class="muscle-zone-path" data-muscle="pect_mayor" onclick="seleccionarMusculoHeatmap('pect_mayor')"></path>

                            <!-- Pectoral Menor / Inferior -->
                            <path d="M91 103 L108 103 L106 111 C98 113 93 109 91 103 Z" ${estilo('pect_menor')} class="muscle-zone-path" data-muscle="pect_menor" onclick="seleccionarMusculoHeatmap('pect_menor')"></path>
                            <path d="M129 103 L112 103 L114 111 C122 113 127 109 129 103 Z" ${estilo('pect_menor')} class="muscle-zone-path" data-muscle="pect_menor" onclick="seleccionarMusculoHeatmap('pect_menor')"></path>

                            <!-- Bíceps -->
                            <path d="M72 96 C68 108 68 120 72 132 C78 132 84 124 84 114 C84 104 80 97 72 96 Z" ${estilo('biceps')} class="muscle-zone-path" data-muscle="biceps" onclick="seleccionarMusculoHeatmap('biceps')"></path>
                            <path d="M148 96 C152 108 152 120 148 132 C142 132 136 124 136 114 C136 104 140 97 148 96 Z" ${estilo('biceps')} class="muscle-zone-path" data-muscle="biceps" onclick="seleccionarMusculoHeatmap('biceps')"></path>

                            <!-- Antebrazos Frontales -->
                            <path d="M72 134 C64 146 58 162 58 178 C64 182 72 176 74 164 C76 152 76 142 72 134 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                            <path d="M148 134 C156 146 162 162 162 178 C156 182 148 176 146 164 C144 152 144 142 148 134 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>

                            <!-- Core / Abdomen -->
                            <path d="M96 114 C104 112 116 112 124 114 C126 128 124 146 120 158 C114 162 106 162 100 158 C96 146 94 128 96 114 Z" ${estilo('core')} class="muscle-zone-path" data-muscle="core" onclick="seleccionarMusculoHeatmap('core')"></path>

                            <!-- Cadera / Aductores -->
                            <path d="M96 160 C104 164 116 164 124 160 C128 168 126 178 122 184 C116 186 104 186 98 184 C94 178 92 168 96 160 Z" ${estilo('cadera')} class="muscle-zone-path" data-muscle="cadera" onclick="seleccionarMusculoHeatmap('cadera')"></path>

                            <!-- Cuádriceps -->
                            <path d="M93 186 C98 186 106 186 107 194 L105 244 C98 244 90 236 88 220 C86 206 88 194 93 186 Z" ${estilo('cuadriceps')} class="muscle-zone-path" data-muscle="cuadriceps" onclick="seleccionarMusculoHeatmap('cuadriceps')"></path>
                            <path d="M127 186 C122 186 114 186 113 194 L115 244 C122 244 130 236 132 220 C134 206 132 194 127 186 Z" ${estilo('cuadriceps')} class="muscle-zone-path" data-muscle="cuadriceps" onclick="seleccionarMusculoHeatmap('cuadriceps')"></path>

                            <!-- Pantorrillas Frontales -->
                            <path d="M90 250 C96 250 102 250 103 260 L101 306 C96 308 92 306 90 298 C88 286 86 270 90 250 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                            <path d="M130 250 C124 250 118 250 117 260 L119 306 C124 308 128 306 130 298 C132 286 134 270 130 250 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                        </g>

                        <!-- SILUETA DORSAL (X: 330 centro) -->
                        <g id="silueta-dorsal">
                            <!-- Cabeza / Mente (Dorsal) -->
                            <ellipse cx="330" cy="38" rx="18" ry="22" ${estilo('mente')} class="muscle-zone-path" data-muscle="mente" onclick="seleccionarMusculoHeatmap('mente')"></ellipse>

                            <!-- Trapecios -->
                            <path d="M322 58 L338 58 L354 75 C344 86 336 94 330 96 C324 94 316 86 306 75 Z" ${estilo('trapecios')} class="muscle-zone-path" data-muscle="trapecios" onclick="seleccionarMusculoHeatmap('trapecios')"></path>

                            <!-- Deltoides Posterior -->
                            <path d="M304 68 C296 74 290 84 292 94 C298 96 306 92 310 82 Z" ${estilo('delt_post')} class="muscle-zone-path" data-muscle="delt_post" onclick="seleccionarMusculoHeatmap('delt_post')"></path>
                            <path d="M356 68 C364 74 370 84 368 94 C362 96 354 92 350 82 Z" ${estilo('delt_post')} class="muscle-zone-path" data-muscle="delt_post" onclick="seleccionarMusculoHeatmap('delt_post')"></path>

                            <!-- Tríceps -->
                            <path d="M292 96 C288 108 288 122 292 134 C298 134 304 126 304 116 C304 106 300 98 292 96 Z" ${estilo('triceps')} class="muscle-zone-path" data-muscle="triceps" onclick="seleccionarMusculoHeatmap('triceps')"></path>
                            <path d="M368 96 C372 108 372 122 368 134 C362 134 356 126 356 116 C356 106 360 98 368 96 Z" ${estilo('triceps')} class="muscle-zone-path" data-muscle="triceps" onclick="seleccionarMusculoHeatmap('triceps')"></path>

                            <!-- Dorsales (Lats) -->
                            <path d="M312 96 C320 94 340 94 348 96 C352 110 348 128 342 138 C334 140 326 140 318 138 C312 128 308 110 312 96 Z" ${estilo('dorsales')} class="muscle-zone-path" data-muscle="dorsales" onclick="seleccionarMusculoHeatmap('dorsales')"></path>

                            <!-- Lumbares -->
                            <path d="M320 138 C326 138 334 138 340 138 C342 148 340 158 338 164 C334 166 326 166 322 164 C320 158 318 148 320 138 Z" ${estilo('lumbares')} class="muscle-zone-path" data-muscle="lumbares" onclick="seleccionarMusculoHeatmap('lumbares')"></path>

                            <!-- Glúteos -->
                            <path d="M312 164 C322 164 329 166 329 178 C328 190 322 198 314 196 C306 192 304 180 312 164 Z" ${estilo('gluteos')} class="muscle-zone-path" data-muscle="gluteos" onclick="seleccionarMusculoHeatmap('gluteos')"></path>
                            <path d="M348 164 C338 164 331 166 331 178 C332 190 338 198 346 196 C354 192 356 180 348 164 Z" ${estilo('gluteos')} class="muscle-zone-path" data-muscle="gluteos" onclick="seleccionarMusculoHeatmap('gluteos')"></path>

                            <!-- Isquiotibiales -->
                            <path d="M312 198 C318 198 326 198 327 206 L325 246 C318 246 310 238 308 222 C306 210 308 202 312 198 Z" ${estilo('isquios')} class="muscle-zone-path" data-muscle="isquios" onclick="seleccionarMusculoHeatmap('isquios')"></path>
                            <path d="M348 198 C342 198 334 198 333 206 L335 246 C342 246 350 238 352 222 C354 210 352 202 348 198 Z" ${estilo('isquios')} class="muscle-zone-path" data-muscle="isquios" onclick="seleccionarMusculoHeatmap('isquios')"></path>

                            <!-- Pantorrillas Dorsales -->
                            <path d="M310 252 C318 252 322 254 323 264 L321 306 C316 308 312 306 310 298 C306 286 304 270 310 252 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>
                            <path d="M350 252 C342 252 338 254 337 264 L339 306 C344 308 348 306 350 298 C354 286 356 270 350 252 Z" ${estilo('pantorrillas')} class="muscle-zone-path" data-muscle="pantorrillas" onclick="seleccionarMusculoHeatmap('pantorrillas')"></path>

                            <!-- Antebrazos Dorsales -->
                            <path d="M292 136 C284 148 278 164 278 180 C284 184 292 178 294 166 C296 154 296 144 292 136 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                            <path d="M368 136 C376 148 382 164 382 180 C376 184 368 178 366 166 C364 154 364 144 368 136 Z" ${estilo('antebrazos')} class="muscle-zone-path" data-muscle="antebrazos" onclick="seleccionarMusculoHeatmap('antebrazos')"></path>
                        </g>
                    </svg>
                </div>

                <!-- LEYENDA DEL MAPA DE CALOR -->
                <div class="heatmap-legend-box">
                    <div class="legend-item">
                        <span class="legend-swatch" style="background: rgba(243, 244, 246, 0.7); border-color:#d1d5db;"></span>
                        <span>0% Óptimo</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-swatch" style="background: rgba(55, 65, 81, 0.22); border-color:#9ca3af;"></span>
                        <span>1-35% Leve</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-swatch" style="background: rgba(31, 41, 55, 0.60); border-color:#4b5563;"></span>
                        <span>36-69% Media</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-swatch" style="background: #111827; border-color:#000000;"></span>
                        <span>70-100% Alta</span>
                    </div>
                </div>
            </div>

            <!-- COLUMNA 2: PANEL DE DETALLE HUD Y SELECTOR RÁPIDO -->
            <div class="heatmap-hud-panel" id="hud-panel-container">
                <!-- Se llena mediante actualizarHudMusculo -->
            </div>
        </div>
    </div>`;

    var contenedor = document.getElementById('contenedor-grafica-fatiga');
    if (contenedor) {
        contenedor.innerHTML = html;
        actualizarHudMusculo(MUSCULO_ACTIVO_HEATMAP);
    }
}

function seleccionarMusculoHeatmap(key) {
    if (!METADATOS_MUSCULOS[key]) return;
    MUSCULO_ACTIVO_HEATMAP = key;

    // Resaltar en SVG
    var allPaths = document.querySelectorAll('.muscle-zone-path');
    allPaths.forEach(function(p) {
        if (p.getAttribute('data-muscle') === key) {
            p.classList.add('selected-muscle');
        } else {
            p.classList.remove('selected-muscle');
        }
    });

    actualizarHudMusculo(key);
}

function actualizarHudMusculo(key) {
    var meta = METADATOS_MUSCULOS[key];
    if (!meta) return;

    var val = Math.min(100, Math.max(0, Number(APP_STATE.fatiga[key]) || 0));
    var estiloInfo = obtenerEstiloFatigaGris(val);

    var hudCont = document.getElementById('hud-panel-container');
    if (!hudCont) return;

    // Generar chips para selección rápida
    var chipsHtml = '';
    var gruposPrincipales = [
        { key: "mente", label: "🧠 Mente" },
        { key: "delt_ant", label: "🛡️ Hombros" },
        { key: "pect_mayor", label: "⚔️ Pecho" },
        { key: "biceps", label: "💪 Bíceps" },
        { key: "triceps", label: "💪 Tríceps" },
        { key: "antebrazos", label: "✊ Antebrazos" },
        { key: "trapecios", label: "🦅 Trapecios" },
        { key: "dorsales", label: "🦅 Dorsales" },
        { key: "lumbares", label: "🏛️ Lumbares" },
        { key: "core", label: "⚡ Core" },
        { key: "gluteos", label: "🍑 Glúteos" },
        { key: "cadera", label: "🥋 Cadera" },
        { key: "cuadriceps", label: "🦵 Cuádriceps" },
        { key: "isquios", label: "🦵 Isquios" },
        { key: "pantorrillas", label: "🦶 Pantorrillas" }
    ];

    gruposPrincipales.forEach(function(g) {
        var activeClass = (g.key === key) ? 'active' : '';
        chipsHtml += `<button class="hud-chip ${activeClass}" onclick="seleccionarMusculoHeatmap('${g.key}')">${g.label}</button>`;
    });

    hudCont.innerHTML = `
        <div class="hud-muscle-card">
            <div class="hud-muscle-header">
                <span class="hud-muscle-region">${meta.region}</span>
                <span style="font-size: 11px; font-weight: 700; background: #e5e7eb; color: #374151; padding: 2px 8px; border-radius: 9999px;">
                    ${estiloInfo.levelText}
                </span>
            </div>
            <h3 class="hud-muscle-title">
                <span>${meta.icono}</span>
                <span>${meta.nombre}</span>
            </h3>
            <div class="hud-fatigue-big">
                ${val}% <span style="font-size: 14px; font-weight: 600; color: #6b7280;">Nivel de Desgaste</span>
            </div>
            <div class="hud-progress-track">
                <div class="hud-progress-fill" style="width: ${val}%;"></div>
            </div>
            <div class="hud-recovery-tip">
                <strong>Consejo de Recuperación:</strong> ${meta.descanso}
            </div>
        </div>

        <div>
            <div class="hud-quick-chips-title">Selección Rápida de Grupo Muscular:</div>
            <div class="hud-quick-chips-grid">
                ${chipsHtml}
            </div>
        </div>
    `;
}


// ==========================================================================
// 7. GYM, RUTINAS Y EJERCICIOS
// ==========================================================================

var RUTINA_PALETA = [
    { icono: '🌅', rankLabel: 'DIARIA · ACTIVACIÓN' },
    { icono: '🔥', rankLabel: 'FUERZA · INTENSIDAD' },
    { icono: '🦵', rankLabel: 'POTENCIA · RESISTENCIA' },
    { icono: '🛡️', rankLabel: 'TRACCIÓN · TÉCNICA' }
];

var RUTINA_ACTIVA = null;

// ==========================================================================
// 7. EJERCICIOS, RUTINAS DINÁMICAS Y CONDICIÓN FÍSICA (GYM)
// ==========================================================================

var CHIPS_SELECCIONADOS_MUSCULOS = [];

var MAPA_CATEGORIAS_A_MUSCULOS = {
    "Mente": ["mente"],
    "Hombros": ["delt_ant", "delt_lat", "delt_post"],
    "Pecho": ["pect_mayor", "pect_menor"],
    "Bíceps": ["biceps"],
    "Tríceps": ["triceps"],
    "Antebrazos": ["antebrazos"],
    "Trapecios": ["trapecios"],
    "Dorsales": ["dorsales"],
    "Lumbares": ["lumbares"],
    "Core": ["core"],
    "Glúteos": ["gluteos"],
    "Cadera": ["cadera"],
    "Cuádriceps": ["cuadriceps"],
    "Isquios": ["isquios"],
    "Pantorrillas": ["pantorrillas"]
};

var RUTINA_ACTIVA = null;

// --- GESTIÓN DE EJERCICIOS ---

function cargarEjercicios() {
    renderizarEjercicios(APP_STATE.ejercicios);
}

function toggleChipMusculo(btn) {
    var cat = btn.getAttribute('data-cat');
    if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        CHIPS_SELECCIONADOS_MUSCULOS = CHIPS_SELECCIONADOS_MUSCULOS.filter(function(c) { return c !== cat; });
    } else {
        btn.classList.add('selected');
        if (!CHIPS_SELECCIONADOS_MUSCULOS.includes(cat)) {
            CHIPS_SELECCIONADOS_MUSCULOS.push(cat);
        }
    }
}

function abrirModalNuevoEjercicio() {
    CHIPS_SELECCIONADOS_MUSCULOS = [];
    var chips = document.querySelectorAll('.muscle-chip-btn');
    chips.forEach(function(c) { c.classList.remove('selected'); });
    var inNom = document.getElementById('modal-ejercicio-nombre');
    var inDesc = document.getElementById('modal-ejercicio-desc');
    if (inNom) inNom.value = "";
    if (inDesc) inDesc.value = "";
    var m = document.getElementById('modal-nuevo-ejercicio');
    if (m) m.style.display = 'flex';
}

function cerrarModalNuevoEjercicio() {
    var m = document.getElementById('modal-nuevo-ejercicio');
    if (m) m.style.display = 'none';
}

function confirmarAgregarEjercicio() {
    var inNom = document.getElementById('modal-ejercicio-nombre');
    var inDesc = document.getElementById('modal-ejercicio-desc');
    var inSeries = document.getElementById('modal-ejercicio-series');
    var inReps = document.getElementById('modal-ejercicio-reps');
    var inFat = document.getElementById('modal-ejercicio-fatiga');

    var nom = inNom ? inNom.value.trim() : "";
    var desc = inDesc ? inDesc.value.trim() : "";
    var series = inSeries ? (Number(inSeries.value) || 4) : 4;
    var reps = inReps ? inReps.value.trim() : "10-12 reps";
    var fatigaPct = inFat ? (Number(inFat.value) || 20) : 20;

    if (!nom) {
        alert("Por favor ingresa el nombre del ejercicio.");
        return;
    }
    if (CHIPS_SELECCIONADOS_MUSCULOS.length === 0) {
        alert("Selecciona al menos una categoría o zona muscular que trabaja este ejercicio.");
        return;
    }

    if (!APP_STATE.ejercicios) APP_STATE.ejercicios = [];

    var nuevoEjercicio = {
        id: "EJ-" + Date.now(),
        nombre: nom,
        descripcion: desc || "Ejercicio de desarrollo físico",
        series: series,
        repeticiones: reps,
        categorias: [...CHIPS_SELECCIONADOS_MUSCULOS],
        fatigaPorcentaje: fatigaPct
    };

    APP_STATE.ejercicios.push(nuevoEjercicio);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevoEjercicio();
    renderizarEjercicios(APP_STATE.ejercicios);
}

function renderizarEjercicios(ejercicios) {
    var eList = ejercicios || APP_STATE.ejercicios || [];
    var cont = document.getElementById('contenedor-ejercicios');
    if (!cont) return;

    if (!eList || eList.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">⚡</span>
            <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 16px;">No tienes ejercicios registrados</h4>
            <p style="color: #6b7280; font-size: 13px; max-width: 420px; margin: 0 auto 16px auto;">
                Crea tus ejercicios especificando series, repeticiones, zonas musculares trabajadas y nivel de fatiga para armar tus rutinas.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevoEjercicio()">
                ➕ Crear Primer Ejercicio
            </button>
        </div>`;
        return;
    }

    var html = '';
    eList.forEach(function(ej) {
        var muscleBadges = (ej.categorias || []).map(function(cat) {
            return `<span class="badge-exercise-muscle">${cat}</span>`;
        }).join('');

        html += `
        <div class="exercise-card">
            <div class="exercise-card-header">
                <div>
                    <h3 class="exercise-card-name">${ej.nombre}</h3>
                    <p class="exercise-card-desc">${ej.descripcion}</p>
                </div>
                <button class="btn-delete-row" title="Eliminar ejercicio" onclick="eliminarEjercicio('${ej.id}')" style="background:none; border:none; color:#9ca3af; font-size:16px; cursor:pointer; padding:4px 8px; border-radius:6px;">✕</button>
            </div>

            <div class="exercise-badges-row">
                <span class="badge-exercise-reps">${ej.series} Series × ${ej.repeticiones}</span>
                <span class="badge-exercise-fatiga">+${ej.fatigaPorcentaje || 20}% Fatiga</span>
                ${muscleBadges}
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function eliminarEjercicio(id) {
    if (!confirm("¿Deseas eliminar este ejercicio?")) return;
    if (!APP_STATE.ejercicios) return;
    APP_STATE.ejercicios = APP_STATE.ejercicios.filter(function(e) {
        return String(e.id) !== String(id);
    });
    MonarcaDB.save(APP_STATE);
    renderizarEjercicios(APP_STATE.ejercicios);
}

// --- GESTIÓN DE RUTINAS DINÁMICAS ---

function cargarGym() {
    renderizarPortalesRutinas(APP_STATE.rutinas);
    renderizarGym(APP_STATE.gym);
}

function abrirModalNuevaRutina() {
    var contCheck = document.getElementById('modal-rutina-checklist-ejercicios');
    if (contCheck) {
        var eList = APP_STATE.ejercicios || [];
        if (eList.length === 0) {
            contCheck.innerHTML = `
            <div style="text-align: center; padding: 18px 10px; color: #6b7280; font-size: 13px;">
                No tienes ejercicios creados todavía.<br>
                <a href="javascript:void(0)" onclick="cerrarModalNuevaRutina(); cambiarVista('vista-ejercicios');" style="color: #111827; font-weight: 700; text-decoration: underline; margin-top: 6px; display: inline-block;">
                    👉 Ir a Banco de Ejercicios
                </a>
            </div>`;
        } else {
            var html = '';
            eList.forEach(function(ej) {
                var cats = (ej.categorias || []).join(', ');
                html += `
                <label class="modal-checklist-item">
                    <input type="checkbox" name="ejercicios_rutina_check" value="${ej.id}">
                    <div style="flex: 1;">
                        <strong style="color: #111827;">${ej.nombre}</strong>
                        <div style="font-size: 11.5px; color: #6b7280;">${ej.series} series × ${ej.repeticiones} · [${cats}] (+${ej.fatigaPorcentaje || 20}% fatiga)</div>
                    </div>
                </label>`;
            });
            contCheck.innerHTML = html;
        }
    }
    var inNom = document.getElementById('modal-rutina-nombre');
    var inDesc = document.getElementById('modal-rutina-desc');
    if (inNom) inNom.value = "";
    if (inDesc) inDesc.value = "";
    var m = document.getElementById('modal-nueva-rutina');
    if (m) m.style.display = 'flex';
}

function cerrarModalNuevaRutina() {
    var m = document.getElementById('modal-nueva-rutina');
    if (m) m.style.display = 'none';
}

function confirmarAgregarRutina() {
    var inNom = document.getElementById('modal-rutina-nombre');
    var inDesc = document.getElementById('modal-rutina-desc');
    var inTag = document.getElementById('modal-rutina-tag');

    var nom = inNom ? inNom.value.trim() : "";
    var desc = inDesc ? inDesc.value.trim() : "";
    var tag = inTag ? inTag.value.trim() : "DIARIA · FUERZA";

    if (!nom) {
        alert("Por favor ingresa un nombre para la rutina.");
        return;
    }

    var checkboxes = document.querySelectorAll('input[name="ejercicios_rutina_check"]:checked');
    if (checkboxes.length === 0) {
        alert("Selecciona al menos un ejercicio para esta rutina.");
        return;
    }

    var selectedIds = Array.from(checkboxes).map(function(c) { return c.value; });
    var selectedEjercicios = (APP_STATE.ejercicios || []).filter(function(e) {
        return selectedIds.includes(String(e.id));
    });

    if (!APP_STATE.rutinas) APP_STATE.rutinas = [];

    var nuevaRutina = {
        id: "RUT-" + Date.now(),
        codigo: "RUT-" + (APP_STATE.rutinas.length + 1),
        nombre: nom,
        descripcion: desc || "Entrenamiento programado",
        rankLabel: tag,
        ejercicios: selectedEjercicios
    };

    APP_STATE.rutinas.push(nuevaRutina);
    MonarcaDB.save(APP_STATE);

    cerrarModalNuevaRutina();
    renderizarPortalesRutinas(APP_STATE.rutinas);
}

function eliminarRutina(idx, event) {
    if (event) event.stopPropagation();
    if (!confirm("¿Deseas eliminar esta rutina programada?")) return;
    if (!APP_STATE.rutinas) return;
    APP_STATE.rutinas.splice(idx, 1);
    MonarcaDB.save(APP_STATE);
    renderizarPortalesRutinas(APP_STATE.rutinas);
}

function renderizarPortalesRutinas(rutinas) {
    var cont = document.getElementById('contenedor-portales-rutinas');
    if (!cont) return;

    var rList = rutinas || APP_STATE.rutinas || [];

    if (!rList || rList.length === 0) {
        cont.innerHTML = `
        <div style="text-align: center; padding: 35px 20px; background: #fafafa; border: 1px dashed #d1d5db; border-radius: 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🏋️‍♂️</span>
            <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 16px;">No tienes rutinas creadas</h4>
            <p style="color: #6b7280; font-size: 13px; max-width: 420px; margin: 0 auto 16px auto;">
                Arma tus sesiones de entrenamiento personalizadas seleccionando los ejercicios que has creado.
            </p>
            <button class="btn-add-finanza" onclick="abrirModalNuevaRutina()">
                ➕ Crear Primera Rutina
            </button>
        </div>`;
        return;
    }

    var html = '';
    rList.forEach(function(rut, idx) {
        var numEj = rut.ejercicios ? rut.ejercicios.length : 0;
        var badgeEj = numEj > 0 ? numEj + ' Ejercicios' : 'Sin Ejercicios';

        html += `
        <div class="quest-card" onclick="abrirDetalleRutina(${idx})" style="position: relative;">
            <div class="quest-icon-box">🏋️‍♂️</div>
            <div style="flex:1;">
              <span class="quest-badge-rank">${rut.rankLabel || 'PERSONALIZADA'}</span>
              <p class="quest-card-name" style="margin:4px 0 6px 0;color:#111827;font-size:15px;font-weight:700;">${rut.nombre}</p>
              <div class="muscle-tags-row">
                <span class="muscle-tag">${rut.codigo || ('RUT-' + (idx + 1))}</span>
                <span class="muscle-tag">${badgeEj}</span>
                ${rut.descripcion ? `<span class="muscle-tag" style="background:none; border:none; color:#6b7280;">${rut.descripcion}</span>` : ''}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn-delete-row" title="Eliminar rutina" onclick="eliminarRutina(${idx}, event)" style="background: none; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; padding: 6px; border-radius: 6px;">✕</button>
                <span class="quest-arrow">›</span>
            </div>
        </div>`;
    });

    cont.innerHTML = html;
}

function abrirDetalleRutina(idx) {
    var rutina = APP_STATE.rutinas[idx];
    if (!rutina) return;
    RUTINA_ACTIVA = { rutina: rutina, idx: idx };

    cambiarVista('vista-detalle-rutina-dinamica');

    var tituloEl = document.getElementById('detalle-rutina-titulo');
    var badgeEl = document.getElementById('detalle-rutina-badge');
    if (tituloEl) tituloEl.innerText = rutina.nombre;
    if (badgeEl) badgeEl.innerText = rutina.rankLabel || 'RUTINA ACTIVA';

    var cont = document.getElementById('contenedor-detalle-rutina-dinamica');
    if (!cont) return;

    var numEj = rutina.ejercicios ? rutina.ejercicios.length : 0;
    var progrCont = document.getElementById('progreso-rutina-dinamica-cont');
    var progrBarra = document.getElementById('progreso-barra-rutina-dinamica');
    var progrTexto = document.getElementById('progreso-texto-rutina-dinamica');
    var btnReg = document.getElementById('btn-registrar-rutina-dinamica');

    if (progrCont) progrCont.style.display = 'block';
    if (progrBarra) progrBarra.style.width = '0%';
    if (progrTexto) progrTexto.innerText = '0 / ' + (numEj + 1) + ' (0%)';
    if (btnReg) {
        btnReg.style.display = 'block';
        btnReg.disabled = true;
    }

    var html = `
    <!-- FASE 1: CALENTAMIENTO Y ACTIVACIÓN -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px 16px; margin-bottom: 14px;">
        <label class="exercise-item-rpg" style="margin: 0; background: transparent; border: none; padding: 0;">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 16px;">🔥</span>
                    <h4 style="margin: 0; font-size: 14.5px; color: #111827;">Fase 1: Calentamiento & Activación Articular</h4>
                    <span class="badge-status-item" id="badge-calentamiento">PENDIENTE</span>
                </div>
                <span class="badge-reps" style="margin-top: 4px; display: inline-block;">5 MINUTOS · MOVILIDAD ARTICULAR Y PULSO CARDIACO</span>
            </div>
            <input type="checkbox" class="check-rutina-din" style="display: none;" onchange="actualizarProgresoRutinaDinamica()">
            <div class="custom-check-box">✓</div>
        </label>
    </div>

    <!-- FASE 2: EJERCICIOS DE LA RUTINA -->
    <h4 style="font-size: 13.5px; text-transform: uppercase; color: #4b5563; margin: 16px 0 10px 0; letter-spacing: 0.5px;">Fase 2: Ejercicios Principales</h4>
    `;

    if (rutina.ejercicios && rutina.ejercicios.length > 0) {
        rutina.ejercicios.forEach(function(ej, ejIdx) {
            var muscleList = (ej.categorias || []).join(' · ');
            html += `
            <label class="exercise-item-rpg">
                <div style="flex: 1; padding-right: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <h4 style="margin: 0;">${ejIdx + 1}. ${ej.nombre}</h4>
                        <span class="badge-status-item">PENDIENTE</span>
                    </div>
                    <div style="color: #6b7280; font-size: 12px; margin-top: 3px;">${ej.descripcion}</div>
                    <div style="margin-top: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="badge-reps">${ej.series} SERIES × ${ej.repeticiones}</span>
                        <span class="badge-exercise-fatiga">+${ej.fatigaPorcentaje || 20}% Fatiga</span>
                        <span style="font-size: 11px; color: #6b7280;">Zonas: <strong>${muscleList}</strong></span>
                    </div>
                </div>
                <input type="checkbox" class="check-rutina-din" style="display: none;" onchange="actualizarProgresoRutinaDinamica()">
                <div class="custom-check-box">✓</div>
            </label>`;
        });
    } else {
        html += '<p style="color: #6b7280; text-align: center; padding: 20px;">Esta rutina no tiene ejercicios agregados.</p>';
    }

    cont.innerHTML = html;
}

function actualizarProgresoRutinaDinamica() {
    var checks = document.querySelectorAll('.check-rutina-din');
    var total = checks.length;
    var completados = 0;

    checks.forEach(function(c) {
        var parentLabel = c.closest('.exercise-item-rpg');
        var badgeStatus = parentLabel ? parentLabel.querySelector('.badge-status-item') : null;

        if (c.checked) {
            completados++;
            if (badgeStatus) {
                badgeStatus.innerText = 'LISTO';
                badgeStatus.style.background = '#111827';
                badgeStatus.style.color = '#ffffff';
            }
        } else {
            if (badgeStatus) {
                badgeStatus.innerText = 'PENDIENTE';
                badgeStatus.style.background = '#f3f4f6';
                badgeStatus.style.color = '#6b7280';
            }
        }
    });

    var pct = total > 0 ? Math.round((completados / total) * 100) : 0;
    var progrBarra = document.getElementById('progreso-barra-rutina-dinamica');
    var progrTexto = document.getElementById('progreso-texto-rutina-dinamica');
    var btnReg = document.getElementById('btn-registrar-rutina-dinamica');

    if (progrBarra) progrBarra.style.width = pct + '%';
    if (progrTexto) progrTexto.innerText = completados + ' / ' + total + ' (' + pct + '%)';

    if (btnReg) {
        btnReg.disabled = (completados < total);
    }
}

function ejecutarRutinaDinamica() {
    if (!RUTINA_ACTIVA) return;
    var rutina = RUTINA_ACTIVA.rutina;

    if (!APP_STATE.fatiga) APP_STATE.fatiga = DEFAULT_STATE.fatiga;

    // Sumar fatiga a los músculos involucrados según cada ejercicio
    if (rutina.ejercicios) {
        rutina.ejercicios.forEach(function(ej) {
            var fatigaVal = Number(ej.fatigaPorcentaje) || 20;
            (ej.categorias || []).forEach(function(cat) {
                var mKeys = MAPA_CATEGORIAS_A_MUSCULOS[cat] || [];
                mKeys.forEach(function(mKey) {
                    var actual = Number(APP_STATE.fatiga[mKey]) || 0;
                    APP_STATE.fatiga[mKey] = Math.min(100, actual + fatigaVal);
                });
            });
        });
    }

    // Recalcular promedio de fatiga del cuerpo
    var keysFatiga = Object.keys(METADATOS_MUSCULOS);
    var sumaTotal = 0;
    keysFatiga.forEach(function(k) {
        sumaTotal += (Number(APP_STATE.fatiga[k]) || 0);
    });
    APP_STATE.fatiga.promedioHoy = Math.round(sumaTotal / keysFatiga.length);
    APP_STATE.fatiga.ultimoCierre = "Entrenamiento: " + rutina.nombre;

    // Registrar en Historial de Gym
    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!APP_STATE.gym) APP_STATE.gym = [];
    APP_STATE.gym.unshift({
        fecha: fechaHoy,
        detalle: "Rutina completada: " + rutina.nombre + " (" + (rutina.ejercicios ? rutina.ejercicios.length : 0) + " ejercicios)"
    });

    // Otorgar EXP
    sumarExp(60);

    MonarcaDB.save(APP_STATE);

    alert("🏆 ¡Sesión completada con éxito!\nHas finalizado '" + rutina.nombre + "'.\n+60 EXP recibidos.\nLa fatiga muscular de tu cuerpo ha sido actualizada en el mapa anatómico.");

    cambiarVista('vista-estado-personal');
    renderizarBarrasFatiga(APP_STATE.fatiga);
}

function renderizarGym(registros) {
    var cont = document.getElementById('contenedor-gym');
    if (!cont) return;
    var html = '';
    if (registros && registros.length > 0) {
        registros.forEach(function(reg) {
            html += `<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;color:#111827;font-size:13.5px;">${reg.detalle}</span>
                <span style="color:#6b7280;font-size:12px;">${reg.fecha}</span>
            </div>`;
        });
    } else {
        html = '<p style="color:#6b7280;text-align:center;padding:15px;">No hay entrenamientos registrados aún.</p>';
    }
    cont.innerHTML = html;
}


// --- MÓDULO DE MENTE Y SUEÑO ---

function cargarMente() {
    renderizarMente(APP_STATE.salud);
}

function renderizarMente(registros) {
    var cont = document.getElementById('contenedor-mente');
    if (!cont) return;
    var html = '';
    var list = registros || APP_STATE.salud || [];
    if (list && list.length > 0) {
        list.forEach(function(r) {
            html += `<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;color:#111827;font-size:13.5px;">${r.valor}</span>
                <span style="color:#6b7280;font-size:12px;">${r.fecha}</span>
            </div>`;
        });
    } else {
        html = '<p style="color:#6b7280;text-align:center;padding:15px;">No hay registros de descanso mental.</p>';
    }
    cont.innerHTML = html;
}

function guardarMente() {
    var inM = document.getElementById('input-nueva-mente');
    var val = inM ? inM.value.trim() : "";
    if (!val) { alert("Ingresa tu registro de descanso mental o horas de sueño."); return; }
    if (!APP_STATE.salud) APP_STATE.salud = [];
    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    APP_STATE.salud.unshift({ fecha: fechaHoy, valor: val });
    if (APP_STATE.fatiga) {
        APP_STATE.fatiga.mente = Math.max(0, (APP_STATE.fatiga.mente || 0) - 30);
    }
    if (inM) inM.value = "";
    sumarExp(20);
    MonarcaDB.save(APP_STATE);
    renderizarMente(APP_STATE.salud);
    alert("🧠 Registro de descanso guardado (+20 EXP). Fatiga mental aliviada.");
}

/**
 * SISTEMA MONARCA · MÓDULO DE FINANZAS PERSONALES
 * Ingresos, Gastos, Deudas, Metas de Ahorro Quincenales, Regla 50/40/10 y Gráficas.
 */

function cargarFinanzas() {
    renderizarFinanzas(APP_STATE.finanzas);
}

function renderizarFinanzas(fin) {
    var f = fin || APP_STATE.finanzas || DEFAULT_STATE.finanzas;

    // 1. Cabecera
    if (f.cabecera) {
        var inNom = document.getElementById('finanzas-input-nombre');
        var inMes = document.getElementById('finanzas-input-mes');
        var inObj = document.getElementById('finanzas-input-objetivo');
        if (inNom) inNom.value = f.cabecera.nombre || "Gabriel Arias";
        if (inMes) inMes.value = f.cabecera.mes || "Septiembre 2026";
        if (inObj) inObj.value = f.cabecera.objetivo || "";
    }

    // 2. Ingresos
    var totIngresos = 0;
    var tbodyIng = document.getElementById('tbody-ingresos') || document.getElementById('tbody-finanzas-ingresos');
    if (tbodyIng) {
        var htmlIng = '';
        (f.ingresos || []).forEach(function(item) {
            var m = Number(item.monto) || 0;
            totIngresos += m;
            htmlIng += `<tr>
                <td><strong>${item.fuente}</strong></td>
                <td style="text-align: center;">Día ${item.dia || 15}</td>
                <td class="monto-positivo" style="text-align: right; font-weight: 700;">$${m.toFixed(2)}</td>
                <td style="text-align: center;">
                    <button class="btn-delete-row" title="Eliminar entrada" onclick="eliminarRegistroFinanzasUI('${item.id}', 'ingreso')">✕</button>
                </td>
            </tr>`;
        });
        if (!f.ingresos || f.ingresos.length === 0) {
            htmlIng = '<tr><td colspan="4" style="text-align:center; color:#9ca3af; padding: 18px;">Sin ingresos registrados. Agrega una nueva entrada con el botón superior.</td></tr>';
        }
        tbodyIng.innerHTML = htmlIng;
    }

    // Actualizar etiquetas de Total Ingresos
    var totalIngEl = document.getElementById('label-total-ingresos') || document.getElementById('total-ingresos-display');
    if (totalIngEl) totalIngEl.innerText = '$' + totIngresos.toFixed(2);
    var resIngEl = document.getElementById('resumen-total-ingresos');
    if (resIngEl) resIngEl.innerText = '$' + totIngresos.toFixed(2);

    // 3. Gastos
    var totGastos = 0;
    var gastosPorCategoria = {};
    var tbodyGas = document.getElementById('tbody-gastos') || document.getElementById('tbody-finanzas-gastos');
    if (tbodyGas) {
        var htmlGas = '';
        (f.gastos || []).forEach(function(item) {
            var m = Number(item.monto) || 0;
            totGastos += m;
            gastosPorCategoria[item.categoria] = (gastosPorCategoria[item.categoria] || 0) + m;

            var catClass = 'cat-otros';
            var catLower = (item.categoria || '').toLowerCase();
            if (catLower.includes('vivienda')) catClass = 'cat-vivienda';
            else if (catLower.includes('alimento') || catLower.includes('supermercado')) catClass = 'cat-alimentacion';
            else if (catLower.includes('moto') || catLower.includes('transporte')) catClass = 'cat-moto';
            else if (catLower.includes('servicio')) catClass = 'cat-servicios';
            else if (catLower.includes('salud')) catClass = 'cat-salud';
            else if (catLower.includes('entretenimiento')) catClass = 'cat-entretenimiento';

            htmlGas += `<tr>
                <td><strong>${item.concepto}</strong></td>
                <td><span class="badge-cat ${catClass}">${item.categoria}</span></td>
                <td style="text-align: center;">Día ${item.dia || 5}</td>
                <td class="monto-negativo" style="text-align: right; font-weight: 700;">-$${m.toFixed(2)}</td>
                <td style="text-align: center;">
                    <button class="btn-delete-row" title="Eliminar gasto" onclick="eliminarRegistroFinanzasUI('${item.id}', 'gasto')">✕</button>
                </td>
            </tr>`;
        });
        if (!f.gastos || f.gastos.length === 0) {
            htmlGas = '<tr><td colspan="5" style="text-align:center; color:#9ca3af; padding: 18px;">Sin gastos registrados. Agrega un nuevo gasto con el botón superior.</td></tr>';
        }
        tbodyGas.innerHTML = htmlGas;
    }

    // Actualizar etiquetas de Total Gastos
    var totalGasEl = document.getElementById('label-total-gastos') || document.getElementById('total-gastos-display');
    if (totalGasEl) totalGasEl.innerText = '$' + totGastos.toFixed(2);
    var resGasEl = document.getElementById('resumen-total-gastos');
    if (resGasEl) resGasEl.innerText = '$' + totGastos.toFixed(2);

    // 4. Regla 50 / 40 / 10
    var meta50 = totIngresos * 0.50;
    var meta40 = totIngresos * 0.40;
    var meta10 = totIngresos * 0.10;

    var el50Monto = document.getElementById('regla-monto-50') || document.getElementById('regla-50-monto');
    var el40Monto = document.getElementById('regla-monto-40') || document.getElementById('regla-40-monto');
    var el10Monto = document.getElementById('regla-monto-10') || document.getElementById('regla-10-monto');
    if (el50Monto) el50Monto.innerText = '$' + meta50.toFixed(2);
    if (el40Monto) el40Monto.innerText = '$' + meta40.toFixed(2);
    if (el10Monto) el10Monto.innerText = '$' + meta10.toFixed(2);

    // 5. Deudas
    var totDeudas = 0;
    var tbodyDeu = document.getElementById('tbody-deudas') || document.getElementById('tbody-finanzas-deudas');
    if (tbodyDeu) {
        var htmlDeu = '';
        (f.deudas || []).forEach(function(item) {
            var m = Number(item.montoTotal) || 0;
            totDeudas += m;
            htmlDeu += `<tr>
                <td><strong>${item.nombre}</strong></td>
                <td style="text-align: center;">Día ${item.dia || 20}</td>
                <td class="monto-deuda" style="text-align: right; font-weight: 700;">$${m.toFixed(2)}</td>
                <td style="text-align: center;">
                    <button class="btn-delete-row" title="Eliminar deuda" onclick="eliminarRegistroFinanzasUI('${item.id}', 'deuda')">✕</button>
                </td>
            </tr>`;
        });
        if (!f.deudas || f.deudas.length === 0) {
            htmlDeu = '<tr><td colspan="4" style="text-align:center; color:#9ca3af; padding: 18px;">No tienes deudas activas registradas.</td></tr>';
        }
        tbodyDeu.innerHTML = htmlDeu;
    }

    var totalDeuEl = document.getElementById('label-total-deudas') || document.getElementById('total-deudas-display');
    if (totalDeuEl) totalDeuEl.innerText = '$' + totDeudas.toFixed(2);
    var resDeuEl = document.getElementById('resumen-total-deudas');
    if (resDeuEl) resDeuEl.innerText = '$' + totDeudas.toFixed(2);

    // Resumen Flujo Neto y Ahorro / Inversión
    var flujoNeto = totIngresos - totGastos;
    var resFlujoEl = document.getElementById('resumen-flujo-neto');
    if (resFlujoEl) {
        resFlujoEl.innerText = (flujoNeto >= 0 ? '+$' : '-$') + Math.abs(flujoNeto).toFixed(2);
        resFlujoEl.style.color = flujoNeto >= 0 ? '#10b981' : '#ef4444';
    }
    var resAhorroEl = document.getElementById('resumen-total-ahorro-inversion');
    if (resAhorroEl) {
        resAhorroEl.innerText = '$' + (meta40 + meta10).toFixed(2);
    }

    // 6. Metas Quincenales
    var gridMetas = document.getElementById('contenedor-metas-cards') || document.getElementById('grid-finanzas-metas');
    if (gridMetas) {
        var htmlMetas = '';
        (f.metas || []).forEach(function(item) {
            var tot = Number(item.metaTotal) || 0;
            var ahorr = Number(item.ahorrado) || 0;
            var falt = Math.max(0, tot - ahorr);
            var pct = tot > 0 ? Math.min(100, Math.round((ahorr / tot) * 100)) : 0;
            var cuota = Number(item.cuotaQuincenal) || 0;

            htmlMetas += `
            <div class="meta-card">
                <div>
                    <div class="meta-card-header">
                        <h4 class="meta-card-title">🎯 ${item.nombre}</h4>
                        <button class="btn-delete-row" title="Eliminar meta" onclick="eliminarRegistroFinanzasUI('${item.id}', 'meta')">✕</button>
                    </div>
                    <div class="meta-numbers-row">
                        <span>Ahorrado: <strong>$${ahorr.toFixed(2)}</strong></span>
                        <span>Meta: <strong>$${tot.toFixed(2)}</strong></span>
                    </div>
                    <div class="meta-progress-track">
                        <div class="meta-progress-fill" style="width: ${pct}%;"></div>
                    </div>
                    <div class="meta-cuotas-info">
                        <div>📅 Faltante: <strong>$${falt.toFixed(2)}</strong> (${pct}%)</div>
                        <div>⚡ Cuota: <strong>$${cuota.toFixed(2)}</strong> (quince y último)</div>
                    </div>
                </div>
                <button class="btn-sumar-cuota" onclick="abonarCuotaMetaUI('${item.id}')">
                    +1 Cuota Quincenal ($${cuota.toFixed(2)})
                </button>
            </div>`;
        });
        if (!f.metas || f.metas.length === 0) {
            htmlMetas = '<p style="color:#6b7280; text-align:center; padding:20px; grid-column:1/-1;">No hay metas de ahorro registradas.</p>';
        }
        gridMetas.innerHTML = htmlMetas;
    }

    // 7. Gráfico de Distribución Financiera
    renderizarGraficoFinanzas(gastosPorCategoria, totIngresos, totGastos);
}
function renderizarGraficoFinanzas(gastosPorCat, totIng, totGas) {
    var ctx = document.getElementById('chart-finanzas-resumen');
    if (!ctx) return;

    if (ESTADO_FINANZAS.chartInstance) {
        ESTADO_FINANZAS.chartInstance.destroy();
    }

    var labels = Object.keys(gastosPorCat);
    var dataValues = Object.values(gastosPorCat);

    if (labels.length === 0) {
        labels = ["Sin gastos aún"];
        dataValues = [1];
    }

    try {
        ESTADO_FINANZAS.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: [
                        '#111827', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#10b981', '#3b82f6'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } } }
                },
                cutout: '68%'
            }
        });
    } catch (e) {
        console.warn("Chart.js no disponible para renderizar dona de finanzas:", e);
    }
}

// Modales Financieros
function abrirModalIngreso() {
    var m = document.getElementById('modal-finanzas-ingreso') || document.getElementById('modal-finanza-ingreso');
    if (m) m.style.display = 'flex';
}
function cerrarModalIngreso() {
    var m = document.getElementById('modal-finanzas-ingreso') || document.getElementById('modal-finanza-ingreso');
    if (m) m.style.display = 'none';
}
function confirmarAgregarIngreso() {
    var inF = document.getElementById('modal-ingreso-fuente');
    var inD = document.getElementById('modal-ingreso-dia');
    var inM = document.getElementById('modal-ingreso-monto');
    var f = inF ? inF.value.trim() : "";
    var d = inD ? (Number(inD.value) || 15) : 15;
    var m = inM ? (Number(inM.value) || 0) : 0;
    if (!f || m <= 0) { alert("Completa la fuente y un monto válido."); return; }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.ingresos) APP_STATE.finanzas.ingresos = [];

    APP_STATE.finanzas.ingresos.push({
        id: "ING-" + Date.now(),
        fuente: f,
        dia: d,
        monto: m
    });

    if (inF) inF.value = "";
    if (inM) inM.value = "";

    MonarcaDB.save(APP_STATE);
    cerrarModalIngreso();
    renderizarFinanzas(APP_STATE.finanzas);
}

function abrirModalGasto() {
    var m = document.getElementById('modal-finanzas-gasto') || document.getElementById('modal-finanza-gasto');
    if (m) m.style.display = 'flex';
}
function cerrarModalGasto() {
    var m = document.getElementById('modal-finanzas-gasto') || document.getElementById('modal-finanza-gasto');
    if (m) m.style.display = 'none';
}
function confirmarAgregarGasto() {
    var inC = document.getElementById('modal-gasto-categoria') || document.getElementById('modal-gasto-cat');
    var inCp = document.getElementById('modal-gasto-fuente') || document.getElementById('modal-gasto-concepto');
    var inD = document.getElementById('modal-gasto-dia');
    var inM = document.getElementById('modal-gasto-monto');

    var c = inC ? inC.value : "Otros";
    var cp = inCp ? inCp.value.trim() : "";
    var d = inD ? (Number(inD.value) || 5) : 5;
    var m = inM ? (Number(inM.value) || 0) : 0;

    if (!cp || m <= 0) { alert("Completa el concepto del gasto y un monto válido."); return; }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.gastos) APP_STATE.finanzas.gastos = [];

    APP_STATE.finanzas.gastos.push({
        id: "GAS-" + Date.now(),
        categoria: c,
        concepto: cp,
        dia: d,
        monto: m
    });

    if (inCp) inCp.value = "";
    if (inM) inM.value = "";

    MonarcaDB.save(APP_STATE);
    cerrarModalGasto();
    renderizarFinanzas(APP_STATE.finanzas);
}

function abrirModalDeuda() {
    var m = document.getElementById('modal-finanzas-deuda') || document.getElementById('modal-finanza-deuda');
    if (m) m.style.display = 'flex';
}
function cerrarModalDeuda() {
    var m = document.getElementById('modal-finanzas-deuda') || document.getElementById('modal-finanza-deuda');
    if (m) m.style.display = 'none';
}
function confirmarAgregarDeuda() {
    var inN = document.getElementById('modal-deuda-nombre');
    var inD = document.getElementById('modal-deuda-dia');
    var inM = document.getElementById('modal-deuda-monto');

    var n = inN ? inN.value.trim() : "";
    var d = inD ? (Number(inD.value) || 20) : 20;
    var m = inM ? (Number(inM.value) || 0) : 0;

    if (!n || m <= 0) { alert("Completa el nombre y un monto válido."); return; }

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.deudas) APP_STATE.finanzas.deudas = [];

    APP_STATE.finanzas.deudas.push({
        id: "DEU-" + Date.now(),
        nombre: n,
        dia: d,
        montoTotal: m
    });

    if (inN) inN.value = "";
    if (inM) inM.value = "";

    MonarcaDB.save(APP_STATE);
    cerrarModalDeuda();
    renderizarFinanzas(APP_STATE.finanzas);
}

function abrirModalMeta() {
    var m = document.getElementById('modal-finanzas-meta') || document.getElementById('modal-finanza-meta');
    if (m) {
        m.style.display = 'flex';
        actualizarCalculoCuotaMeta();
    }
}
function cerrarModalMeta() {
    var m = document.getElementById('modal-finanzas-meta') || document.getElementById('modal-finanza-meta');
    if (m) m.style.display = 'none';
}
function actualizarCalculoCuotaMeta() {
    var inT = document.getElementById('modal-meta-total');
    var inA = document.getElementById('modal-meta-ahorrado');
    var inM = document.getElementById('modal-meta-meses');

    var t = inT ? (Number(inT.value) || 0) : 0;
    var a = inA ? (Number(inA.value) || 0) : 0;
    var m = inM ? (Number(inM.value) || 1) : 1;

    var falt = Math.max(0, t - a);
    var cuotas = m * 2;
    var cuotaVal = cuotas > 0 ? (falt / cuotas) : 0;

    var elF = document.getElementById('preview-meta-faltante');
    var elC = document.getElementById('preview-meta-cuotas');
    var elV = document.getElementById('preview-meta-cuotavalor');
    if (elF) elF.innerText = '$' + falt.toFixed(2);
    if (elC) elC.innerText = cuotas + ' cuotas (quince y último)';
    if (elV) elV.innerText = '$' + cuotaVal.toFixed(2);
}
function confirmarAgregarMeta() {
    var inN = document.getElementById('modal-meta-nombre');
    var inT = document.getElementById('modal-meta-total');
    var inA = document.getElementById('modal-meta-ahorrado');
    var inM = document.getElementById('modal-meta-meses');

    var n = inN ? inN.value.trim() : "";
    var t = inT ? (Number(inT.value) || 0) : 0;
    var a = inA ? (Number(inA.value) || 0) : 0;
    var m = inM ? (Number(inM.value) || 1) : 1;

    if (!n || t <= 0) { alert("Completa el nombre y una meta total válida."); return; }

    var falt = Math.max(0, t - a);
    var cuotas = m * 2;
    var cuotaVal = cuotas > 0 ? (falt / cuotas) : 0;

    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    if (!APP_STATE.finanzas.metas) APP_STATE.finanzas.metas = [];

    APP_STATE.finanzas.metas.push({
        id: "MET-" + Date.now(),
        nombre: n,
        metaTotal: t,
        ahorrado: a,
        faltante: falt,
        meses: m,
        cuotaQuincenal: Math.round(cuotaVal * 100) / 100
    });

    if (inN) inN.value = "";
    if (inT) inT.value = "";
    if (inA) inA.value = "0";

    MonarcaDB.save(APP_STATE);
    cerrarModalMeta();
    renderizarFinanzas(APP_STATE.finanzas);
}

function abonarCuotaMetaUI(id) {
    if (!APP_STATE.finanzas || !APP_STATE.finanzas.metas) return;
    for (var i = 0; i < APP_STATE.finanzas.metas.length; i++) {
        if (APP_STATE.finanzas.metas[i].id === id) {
            var item = APP_STATE.finanzas.metas[i];
            item.ahorrado = Math.min(item.metaTotal, (item.ahorrado || 0) + (item.cuotaQuincenal || 0));
            item.faltante = Math.max(0, item.metaTotal - item.ahorrado);
            break;
        }
    }
    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function eliminarRegistroFinanzasUI(id, tipo) {
    if (!confirm("¿Eliminar este registro financiero?")) return;
    if (!APP_STATE.finanzas) return;

    if (tipo === 'ingreso' && APP_STATE.finanzas.ingresos) {
        APP_STATE.finanzas.ingresos = APP_STATE.finanzas.ingresos.filter(function(x) { return x.id !== id; });
    } else if (tipo === 'gasto' && APP_STATE.finanzas.gastos) {
        APP_STATE.finanzas.gastos = APP_STATE.finanzas.gastos.filter(function(x) { return x.id !== id; });
    } else if (tipo === 'deuda' && APP_STATE.finanzas.deudas) {
        APP_STATE.finanzas.deudas = APP_STATE.finanzas.deudas.filter(function(x) { return x.id !== id; });
    } else if (tipo === 'meta' && APP_STATE.finanzas.metas) {
        APP_STATE.finanzas.metas = APP_STATE.finanzas.metas.filter(function(x) { return x.id !== id; });
    }

    MonarcaDB.save(APP_STATE);
    renderizarFinanzas(APP_STATE.finanzas);
}

function alCambiarDatoGeneralFinanzas() {
    var n = document.getElementById('finanzas-input-nombre').value;
    var m = document.getElementById('finanzas-input-mes').value;
    var o = document.getElementById('finanzas-input-objetivo').value;
    if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
    APP_STATE.finanzas.cabecera = { nombre: n, mes: m, objetivo: o };
    MonarcaDB.save(APP_STATE);
}

function cambiarMesFinanzas(delta) {
    ESTADO_FINANZAS.mesOffset += delta;
    var fecha = new Date();
    fecha.setMonth(fecha.getMonth() + ESTADO_FINANZAS.mesOffset);
    var nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
    var inMes = document.getElementById('finanzas-input-mes');
    if (inMes) inMes.value = nombreMes;
    alCambiarDatoGeneralFinanzas();
}

function inicializarHojaFinanzasDesdeUI() {
    MonarcaDB.exportBackup();
}

// ==========================================================================
// 11. BANCO DE IDEAS MONARCA
// ==========================================================================
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
/**
 * SISTEMA MONARCA · MÓDULO DE CALENDARIO
 * Planificación mensual, navegación de fechas, integración de finanzas/rutinas y gestión de eventos locales.
 */

var CALENDARIO_ESTADO = {
    anio: new Date().getFullYear(),
    mes: new Date().getMonth(), // 0 - 11
    diaSeleccionado: new Date().getDate()
};

var MESES_NOMBRES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

var DIAS_SEMANA_NOMBRES = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

/**
 * Genera clave de fecha en formato YYYY-MM-DD
 */
function formatearClaveFecha(anio, mes, dia) {
    var m = (mes + 1).toString().padStart(2, '0');
    var d = dia.toString().padStart(2, '0');
    return anio + '-' + m + '-' + d;
}

/**
 * Renderizado Principal del Calendario del Sistema
 */
function renderizarCalendario() {
    var cont = document.getElementById('contenedor-calendario');
    if (!cont) return;

    if (!APP_STATE.calendario || !Array.isArray(APP_STATE.calendario)) {
        APP_STATE.calendario = [];
    }

    var hoy = new Date();
    var anio = CALENDARIO_ESTADO.anio;
    var mes = CALENDARIO_ESTADO.mes;
    var diaSel = CALENDARIO_ESTADO.diaSeleccionado;

    // Calcular días del mes y desplazamiento
    var primerDiaMes = new Date(anio, mes, 1);
    var diaSemanaInicio = (primerDiaMes.getDay() + 6) % 7; // Lunes = 0, Domingo = 6
    var totalDiasMes = new Date(anio, mes + 1, 0).getDate();
    var totalDiasMesAnterior = new Date(anio, mes, 0).getDate();

    // Asegurar que el día seleccionado exista en el mes actual
    if (diaSel > totalDiasMes) {
        diaSel = totalDiasMes;
        CALENDARIO_ESTADO.diaSeleccionado = diaSel;
    }

    // Encabezado superior con navegación
    var html = `
    <div class="card" style="margin-bottom: 20px;">
        <div class="calendar-top-bar">
            <div class="calendar-nav-controls">
                <button class="calendar-nav-btn" onclick="mesAnteriorCalendario()" title="Mes anterior">◀</button>
                <div class="calendar-title-display">
                    ${MESES_NOMBRES[mes]} ${anio}
                </div>
                <button class="calendar-nav-btn" onclick="mesSiguienteCalendario()" title="Mes siguiente">▶</button>
                <button class="calendar-btn-today" onclick="irAHoyCalendario()">Hoy</button>
            </div>
            <div>
                <button class="btn-system" style="padding: 9px 18px; margin: 0; font-size: 13px;" onclick="abrirModalNuevoEvento()">
                    + Agendar Evento
                </button>
            </div>
        </div>

        <!-- DÍAS DE LA SEMANA -->
        <div class="calendar-weekdays-row">
            <div class="calendar-weekday-cell">LUN</div>
            <div class="calendar-weekday-cell">MAR</div>
            <div class="calendar-weekday-cell">MIÉ</div>
            <div class="calendar-weekday-cell">JUE</div>
            <div class="calendar-weekday-cell">VIE</div>
            <div class="calendar-weekday-cell">SÁB</div>
            <div class="calendar-weekday-cell">DOM</div>
        </div>

        <!-- CUADRÍCULA DE CELDAS DE DÍAS -->
        <div class="calendar-grid-cells">
    `;

    // 1. Días del mes anterior (relleno visual)
    for (var p = diaSemanaInicio - 1; p >= 0; p--) {
        var numDiaPrev = totalDiasMesAnterior - p;
        var prevMesIdx = mes === 0 ? 11 : mes - 1;
        var prevAnioVal = mes === 0 ? anio - 1 : anio;
        html += `
            <div class="calendar-day-cell other-month" onclick="seleccionarOtroMesDia(${prevAnioVal}, ${prevMesIdx}, ${numDiaPrev})">
                <span class="calendar-day-num">${numDiaPrev}</span>
            </div>
        `;
    }

    // 2. Días del mes activo
    for (var d = 1; d <= totalDiasMes; d++) {
        var claveFecha = formatearClaveFecha(anio, mes, d);
        var esHoy = (hoy.getFullYear() === anio && hoy.getMonth() === mes && hoy.getDate() === d);
        var esSeleccionado = (d === diaSel);

        // Buscar eventos en este día
        var eventosDia = APP_STATE.calendario.filter(function(e) {
            return e.fecha === claveFecha;
        });

        // Buscar finanzas recurrentes programadas en este día
        var tieneFinanzas = false;
        if (APP_STATE.finanzas) {
            if (APP_STATE.finanzas.ingresos && APP_STATE.finanzas.ingresos.some(function(i) { return Number(i.dia) === d; })) tieneFinanzas = true;
            if (APP_STATE.finanzas.gastos && APP_STATE.finanzas.gastos.some(function(g) { return Number(g.dia) === d; })) tieneFinanzas = true;
            if (APP_STATE.finanzas.deudas && APP_STATE.finanzas.deudas.some(function(deu) { return Number(deu.dia) === d; })) tieneFinanzas = true;
        }

        // Clases dinámicas
        var clasesCelda = "calendar-day-cell";
        if (esHoy) clasesCelda += " is-today";
        if (esSeleccionado) clasesCelda += " is-selected";

        html += `
            <div class="${clasesCelda}" onclick="seleccionarDiaCalendario(${d})">
                <span class="calendar-day-num">${d}</span>
                <div class="calendar-dots-container">
        `;

        if (eventosDia.length > 0) {
            html += `<span class="calendar-dot dot-event" title="${eventosDia.length} evento(s)"></span>`;
        }
        if (tieneFinanzas) {
            html += `<span class="calendar-dot dot-finance" title="Movimientos financieros programados"></span>`;
        }

        html += `
                </div>
            </div>
        `;
    }

    // 3. Días del mes siguiente para completar la cuadrícula (múltiplo de 7)
    var celdasUsadas = diaSemanaInicio + totalDiasMes;
    var celdasRestantes = (7 - (celdasUsadas % 7)) % 7;
    for (var n = 1; n <= celdasRestantes; n++) {
        var nextMesIdx = mes === 11 ? 0 : mes + 1;
        var nextAnioVal = mes === 11 ? anio + 1 : anio;
        html += `
            <div class="calendar-day-cell other-month" onclick="seleccionarOtroMesDia(${nextAnioVal}, ${nextMesIdx}, ${n})">
                <span class="calendar-day-num">${n}</span>
            </div>
        `;
    }

    html += `
        </div>

        <!-- BARRA DE LEYENDA -->
        <div class="calendar-legend-bar">
            <div class="calendar-legend-item">
                <span class="calendar-dot dot-event"></span>
                <span>Eventos Agendados</span>
            </div>
            <div class="calendar-legend-item">
                <span class="calendar-dot dot-finance"></span>
                <span>Obligación / Pago Financiero</span>
            </div>
            <div class="calendar-legend-item" style="color: #111827; font-weight: 600;">
                <span>● Día Actual (Hoy)</span>
            </div>
        </div>
    </div>
    `;

    // 4. Panel Inspector de Detalles del Día Seleccionado
    var fechaObj = new Date(anio, mes, diaSel);
    var diaSemanaNombre = DIAS_SEMANA_NOMBRES[(fechaObj.getDay() + 6) % 7];
    var fechaTextoCompleto = diaSemanaNombre + ", " + diaSel + " de " + MESES_NOMBRES[mes] + " de " + anio;
    var claveFechaSel = formatearClaveFecha(anio, mes, diaSel);

    var eventosDelDia = APP_STATE.calendario.filter(function(e) {
        return e.fecha === claveFechaSel;
    });

    html += `
    <div class="card">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
            <div>
                <span style="font-size: 11.5px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">DETALLE DE JORNADA</span>
                <h3 style="margin: 2px 0 0 0; font-size: 17px; color: #111827;">${fechaTextoCompleto}</h3>
            </div>
            <button class="btn-sync-action btn-sync-dark" onclick="abrirModalNuevoEvento('${claveFechaSel}')">
                + Añadir a este día
            </button>
        </div>
    `;

    // Renderizar eventos del usuario
    if (eventosDelDia.length > 0) {
        html += `<div class="calendar-events-container">`;
        eventosDelDia.forEach(function(ev) {
            var iconCat = "📌";
            if (ev.categoria === "Trabajo") iconCat = "💼";
            if (ev.categoria === "Finanzas") iconCat = "💰";
            if (ev.categoria === "Salud") iconCat = "⚡";
            if (ev.categoria === "Misión") iconCat = "⚔️";
            if (ev.categoria === "Personal") iconCat = "🏠";

            var horaStr = ev.hora ? `🕒 ${ev.hora}` : "🕒 Todo el día";
            var completadoClass = ev.completado ? "is-completed" : "";

            html += `
                <div class="calendar-event-card ${completadoClass}">
                    <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1;">
                        <input type="checkbox" ${ev.completado ? "checked" : ""} 
                            style="margin-top: 4px; cursor: pointer; width: 16px; height: 16px;" 
                            onchange="toggleCompletarEventoCalendario('${ev.id}')">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                                <span class="calendar-event-cat-badge">${iconCat} ${ev.categoria || 'General'}</span>
                                <span style="font-size: 12px; color: #6b7280; font-weight: 500;">${horaStr}</span>
                                ${ev.prioridad === 'Alta' ? '<span style="font-size: 10px; font-weight: 700; background: #fee2e2; color: #991b1b; padding: 2px 7px; border-radius: 9999px;">ALTA</span>' : ''}
                            </div>
                            <div class="calendar-event-title-text" style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 2px;">
                                ${ev.titulo}
                            </div>
                            ${ev.notas ? `<p style="margin: 0; font-size: 12.5px; color: #4b5563;">${ev.notas}</p>` : ''}
                        </div>
                    </div>
                    <button onclick="eliminarEventoCalendario('${ev.id}')" title="Eliminar evento" 
                        style="background: transparent; border: none; color: #9ca3af; font-size: 16px; padding: 4px 8px; border-radius: 8px; cursor: pointer;">
                        &times;
                    </button>
                </div>
            `;
        });
        html += `</div>`;
    } else {
        html += `
            <div style="text-align: center; padding: 24px 16px; background: #f9fafb; border-radius: 14px; border: 1px dashed #e5e7eb; margin-top: 10px;">
                <div style="font-size: 28px; margin-bottom: 6px;">📅</div>
                <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px;">Sin eventos agendados</div>
                <p style="margin: 0 0 12px 0; font-size: 12.5px; color: #6b7280;">No tienes compromisos manuales para esta fecha.</p>
                <button class="btn-sync-action btn-sync-light" onclick="abrirModalNuevoEvento('${claveFechaSel}')">
                    + Agendar Compromiso
                </button>
            </div>
        `;
    }

    // Actividades y Automatizaciones del Sistema vinculadas a este día del mes
    var finanzasDia = [];
    if (APP_STATE.finanzas) {
        if (APP_STATE.finanzas.ingresos) {
            APP_STATE.finanzas.ingresos.forEach(function(i) {
                if (Number(i.dia) === diaSel) {
                    finanzasDia.push({ tipo: 'Ingreso', texto: `${i.fuente} (+$${i.monto})`, icon: '💰' });
                }
            });
        }
        if (APP_STATE.finanzas.gastos) {
            APP_STATE.finanzas.gastos.forEach(function(g) {
                if (Number(g.dia) === diaSel) {
                    finanzasDia.push({ tipo: 'Gasto', texto: `${g.concepto} ($${g.monto}) · ${g.categoria}`, icon: '💸' });
                }
            });
        }
        if (APP_STATE.finanzas.deudas) {
            APP_STATE.finanzas.deudas.forEach(function(deu) {
                if (Number(deu.dia) === diaSel) {
                    finanzasDia.push({ tipo: 'Deuda', texto: `Vencimiento cuota: ${deu.nombre} ($${deu.montoTotal})`, icon: '💳' });
                }
            });
        }
    }

    if (finanzasDia.length > 0) {
        html += `
            <div style="margin-top: 20px;">
                <span style="font-size: 11.5px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                    SISTEMA FINANCIERO · COMPROMISOS DEL DÍA ${diaSel}
                </span>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
        `;
        finanzasDia.forEach(function(item) {
            html += `
                <div class="calendar-system-activity-item">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>${item.icon}</span>
                        <span style="font-weight: 600;">${item.texto}</span>
                    </div>
                    <span style="font-size: 11px; font-weight: 700; color: #6b7280; background: #f3f4f6; padding: 2px 8px; border-radius: 9999px;">
                        ${item.tipo}
                    </span>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    html += `</div>`; // Fin Card Inspector

    cont.innerHTML = html;
}

/**
 * Navegación: Mes Anterior
 */
function mesAnteriorCalendario() {
    CALENDARIO_ESTADO.mes--;
    if (CALENDARIO_ESTADO.mes < 0) {
        CALENDARIO_ESTADO.mes = 11;
        CALENDARIO_ESTADO.anio--;
    }
    renderizarCalendario();
}

/**
 * Navegación: Mes Siguiente
 */
function mesSiguienteCalendario() {
    CALENDARIO_ESTADO.mes++;
    if (CALENDARIO_ESTADO.mes > 11) {
        CALENDARIO_ESTADO.mes = 0;
        CALENDARIO_ESTADO.anio++;
    }
    renderizarCalendario();
}

/**
 * Navegación: Volver al Día Actual
 */
function irAHoyCalendario() {
    var hoy = new Date();
    CALENDARIO_ESTADO.anio = hoy.getFullYear();
    CALENDARIO_ESTADO.mes = hoy.getMonth();
    CALENDARIO_ESTADO.diaSeleccionado = hoy.getDate();
    renderizarCalendario();
}

/**
 * Selección de día en la cuadrícula activa
 */
function seleccionarDiaCalendario(dia) {
    CALENDARIO_ESTADO.diaSeleccionado = dia;
    renderizarCalendario();
}

/**
 * Selección de día que pertenece al mes anterior o siguiente
 */
function seleccionarOtroMesDia(anio, mes, dia) {
    CALENDARIO_ESTADO.anio = anio;
    CALENDARIO_ESTADO.mes = mes;
    CALENDARIO_ESTADO.diaSeleccionado = dia;
    renderizarCalendario();
}

/**
 * Gestión de Modal de Nuevo Evento
 */
function abrirModalNuevoEvento(fechaPredefinida) {
    var modal = document.getElementById('modal-nuevo-evento');
    if (!modal) return;

    var inputTitulo = document.getElementById('modal-evento-titulo');
    var inputFecha = document.getElementById('modal-evento-fecha');
    var inputHora = document.getElementById('modal-evento-hora');
    var inputCat = document.getElementById('modal-evento-categoria');
    var inputPrio = document.getElementById('modal-evento-prioridad');
    var inputNotas = document.getElementById('modal-evento-notas');

    if (inputTitulo) inputTitulo.value = '';
    if (inputHora) inputHora.value = '';
    if (inputCat) inputCat.value = 'General';
    if (inputPrio) inputPrio.value = 'Normal';
    if (inputNotas) inputNotas.value = '';

    if (inputFecha) {
        if (fechaPredefinida) {
            inputFecha.value = fechaPredefinida;
        } else {
            inputFecha.value = formatearClaveFecha(
                CALENDARIO_ESTADO.anio,
                CALENDARIO_ESTADO.mes,
                CALENDARIO_ESTADO.diaSeleccionado
            );
        }
    }

    modal.style.display = 'flex';
    if (inputTitulo) setTimeout(function() { inputTitulo.focus(); }, 100);
}

function cerrarModalNuevoEvento() {
    var modal = document.getElementById('modal-nuevo-evento');
    if (modal) modal.style.display = 'none';
}

/**
 * Guardar Evento Nuevo en LocalStorage
 */
function guardarNuevoEvento() {
    var inputTitulo = document.getElementById('modal-evento-titulo');
    var inputFecha = document.getElementById('modal-evento-fecha');
    var inputHora = document.getElementById('modal-evento-hora');
    var inputCat = document.getElementById('modal-evento-categoria');
    var inputPrio = document.getElementById('modal-evento-prioridad');
    var inputNotas = document.getElementById('modal-evento-notas');

    var titulo = inputTitulo ? inputTitulo.value.trim() : '';
    var fecha = inputFecha ? inputFecha.value : '';
    var hora = inputHora ? inputHora.value : '';
    var categoria = inputCat ? inputCat.value : 'General';
    var prioridad = inputPrio ? inputPrio.value : 'Normal';
    var notas = inputNotas ? inputNotas.value.trim() : '';

    if (!titulo) {
        alert("Por favor ingresa un título para el evento.");
        if (inputTitulo) inputTitulo.focus();
        return;
    }

    if (!fecha) {
        alert("Por favor selecciona una fecha válida.");
        return;
    }

    if (!APP_STATE.calendario) {
        APP_STATE.calendario = [];
    }

    var nuevoEvento = {
        id: 'EVT-' + Date.now(),
        titulo: titulo,
        fecha: fecha,
        hora: hora || null,
        categoria: categoria,
        prioridad: prioridad,
        notas: notas,
        completado: false,
        timestamp: Date.now()
    };

    APP_STATE.calendario.push(nuevoEvento);
    MonarcaDB.save(APP_STATE);

    // Sincronizar vista del calendario con la fecha del nuevo evento
    var partes = fecha.split('-');
    if (partes.length === 3) {
        CALENDARIO_ESTADO.anio = parseInt(partes[0], 10);
        CALENDARIO_ESTADO.mes = parseInt(partes[1], 10) - 1;
        CALENDARIO_ESTADO.diaSeleccionado = parseInt(partes[2], 10);
    }

    cerrarModalNuevoEvento();
    renderizarCalendario();
}

/**
 * Alternar estado completado / pendiente de un evento
 */
function toggleCompletarEventoCalendario(id) {
    if (!APP_STATE.calendario) return;
    var ev = APP_STATE.calendario.find(function(item) {
        return item.id === id;
    });
    if (ev) {
        ev.completado = !ev.completado;
        MonarcaDB.save(APP_STATE);
        renderizarCalendario();
    }
}

/**
 * Eliminar un evento del calendario
 */
function eliminarEventoCalendario(id) {
    if (!confirm("¿Deseas eliminar este evento del calendario?")) return;
    if (!APP_STATE.calendario) return;

    APP_STATE.calendario = APP_STATE.calendario.filter(function(item) {
        return item.id !== id;
    });

    MonarcaDB.save(APP_STATE);
    renderizarCalendario();
}
