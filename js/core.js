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
