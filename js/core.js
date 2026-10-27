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

/**
 * Obtiene la clave de fecha en formato YYYY-MM-DD según la zona horaria local del usuario.
 * Evita desfasajes causados por UTC en toISOString().
 */
function obtenerClaveFechaLocal(fecha) {
    var d = fecha ? (fecha instanceof Date ? fecha : new Date(fecha)) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dia = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dia;
}

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
    questsDiarios: [],
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
    registroDiarioCalendario: {},
    gym: [],
    rutinas: [],
    rutinaCalentamiento: [],
    ejercicios: [],
    salud: [],
    menteAtributos: {
        memoria: 0,
        procesamiento: 0,
        conocimiento: 0,
        pensamiento_lateral: 0,
        diseno_expresion: 0,
        enfoque: 0,
        gratificacion: 0,
        resiliencia: 0,
        microexpresiones: 0,
        persuasion: 0,
        control_emocional: 0,
        inteligencia_social: 0
    },
    ejerciciosMentales: [],
    fatigaMentalDiaria: {
        nivel: 0,
        ultimoDia: obtenerClaveFechaLocal(),
        estado: "Mente Despejada",
        historial: []
    },
    musculosMentales: {
        creatividad: { nivel: 1, exp: 0, nombre: "Creatividad", icono: "🎨", descripcion: "Pensamiento lateral, originalidad e invención de soluciones disruptivas." },
        descanso: { nivel: 1, exp: 0, nombre: "Descanso", icono: "🌙", descripcion: "Recuperación neural profunda, desconexión y descompresión del sistema nervioso." },
        anulacion: { nivel: 1, exp: 0, nombre: "Anulación", icono: "🛡️", descripcion: "Supresión de impulsos, control de gratificación inmediata y estoicismo radical." },
        percepcion: { nivel: 1, exp: 0, nombre: "Percepción Psicológica", icono: "♟️", descripcion: "Lectura no verbal, microexpresiones, calibración social y detección de intenciones." },
        inteligencia: { nivel: 1, exp: 0, nombre: "Inteligencia", icono: "⚡", descripcion: "Velocidad de procesamiento, razonamiento lógico, modelado y asimilación técnica." }
    },
    ejerciciosCerebrales: [],
    conocimientos: [],
    categoriasLabores: [
        { id: "LAB-DEV", nombre: "Desarrollo de Software", icono: "💻", descripcion: "Programación web, backend, bases de datos y arquitectura.", color: "#111827" },
        { id: "LAB-TRAINER", nombre: "Personal Trainer", icono: "🏋️‍♂️", descripcion: "Entrenamientos personalizados, asesoría física y técnica deportiva.", color: "#374151" },
        { id: "LAB-BARBER", nombre: "Barbero / Oficio", icono: "💈", descripcion: "Corte de cabello masculino, degradados, afeitado y estética capilar.", color: "#1f2937" }
    ],
    registrosLabores: [],
    agendaPersonas: [],
    ubicacionesAgenda: [
        "💈 Barbería",
        "🏋️ Gimnasio",
        "💼 Oficina / Coworking",
        "☕ Café / Restaurante",
        "🏠 Casa",
        "🛣️ En la Calle",
        "🌐 Virtual / Discord / Llamada"
    ],
    ruletaSemanal: {
        comidas: [],
        vestimenta: [],
        musica: [],
        seleccionActiva: {
            comida: "Sin opciones registradas",
            vestimenta: "Sin opciones registradas",
            musica: "Sin opciones registradas",
            fechaGiro: "Pendiente"
        },
        historialGiros: []
    },
    finanzas: {
        cabecera: {
            nombre: "Gabriel Arias",
            mes: "",
            objetivo: ""
        },
        ingresos: [],
        gastos: [],
        deudas: [],
        metas: []
    },
    ideas: [],
    calendario: [],
    inventario: {
        productos: [],
        categorias: [],
        ventas: []
    }
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
            if (!data.ejercicios || !Array.isArray(data.ejercicios)) data.ejercicios = [];
            if (!data.rutinas || !Array.isArray(data.rutinas)) data.rutinas = [];
            if (!data.rutinaCalentamiento || !Array.isArray(data.rutinaCalentamiento)) data.rutinaCalentamiento = [];
            if (!data.questsDiarios || !Array.isArray(data.questsDiarios)) data.questsDiarios = [];
            if (!data.fatiga) data.fatiga = JSON.parse(JSON.stringify(DEFAULT_STATE.fatiga));
            if (!data.gym || !Array.isArray(data.gym)) data.gym = [];
            if (!data.salud) data.salud = [];
            if (!data.menteAtributos) {
                data.menteAtributos = JSON.parse(JSON.stringify(DEFAULT_STATE.menteAtributos));
            }
            if (!data.ejerciciosMentales || !Array.isArray(data.ejerciciosMentales)) {
                data.ejerciciosMentales = [];
            }
            if (!data.fatigaMentalDiaria) {
                data.fatigaMentalDiaria = JSON.parse(JSON.stringify(DEFAULT_STATE.fatigaMentalDiaria));
            }
            if (!data.musculosMentales) {
                data.musculosMentales = JSON.parse(JSON.stringify(DEFAULT_STATE.musculosMentales));
            }
            if (!data.ejerciciosCerebrales || !Array.isArray(data.ejerciciosCerebrales)) {
                data.ejerciciosCerebrales = [];
            }
            if (!data.conocimientos || !Array.isArray(data.conocimientos)) {
                data.conocimientos = [];
            }
            if (!data.categoriasLabores || !Array.isArray(data.categoriasLabores)) {
                data.categoriasLabores = JSON.parse(JSON.stringify(DEFAULT_STATE.categoriasLabores));
            }
            if (!data.registrosLabores || !Array.isArray(data.registrosLabores)) {
                data.registrosLabores = [];
            }
            if (!data.agendaPersonas || !Array.isArray(data.agendaPersonas)) {
                data.agendaPersonas = [];
            }
            if (!data.ubicacionesAgenda || !Array.isArray(data.ubicacionesAgenda)) {
                data.ubicacionesAgenda = JSON.parse(JSON.stringify(DEFAULT_STATE.ubicacionesAgenda));
            }
            if (!data.ruletaSemanal) {
                data.ruletaSemanal = JSON.parse(JSON.stringify(DEFAULT_STATE.ruletaSemanal));
            } else {
                if (!data.ruletaSemanal.comidas || !Array.isArray(data.ruletaSemanal.comidas)) data.ruletaSemanal.comidas = [];
                if (!data.ruletaSemanal.vestimenta || !Array.isArray(data.ruletaSemanal.vestimenta)) data.ruletaSemanal.vestimenta = [];
                if (!data.ruletaSemanal.musica || !Array.isArray(data.ruletaSemanal.musica)) data.ruletaSemanal.musica = [];
                if (!data.ruletaSemanal.seleccionActiva) data.ruletaSemanal.seleccionActiva = { comida: "Sin opciones registradas", vestimenta: "Sin opciones registradas", musica: "Sin opciones registradas", fechaGiro: "Pendiente" };
                if (!data.ruletaSemanal.historialGiros || !Array.isArray(data.ruletaSemanal.historialGiros)) data.ruletaSemanal.historialGiros = [];
            }
            if (!data.finanzas) {
                data.finanzas = JSON.parse(JSON.stringify(DEFAULT_STATE.finanzas));
            } else {
                if (!data.finanzas.cabecera) data.finanzas.cabecera = { nombre: data.jugador ? data.jugador.titulo : "Gabriel Arias", mes: "", objetivo: "" };
                if (!data.finanzas.ingresos || !Array.isArray(data.finanzas.ingresos)) data.finanzas.ingresos = [];
                if (!data.finanzas.gastos || !Array.isArray(data.finanzas.gastos)) data.finanzas.gastos = [];
                if (!data.finanzas.deudas || !Array.isArray(data.finanzas.deudas)) data.finanzas.deudas = [];
                if (!data.finanzas.metas || !Array.isArray(data.finanzas.metas)) data.finanzas.metas = [];
            }
            if (!data.calendario || !Array.isArray(data.calendario)) data.calendario = [];
            if (!data.registroDiarioCalendario) data.registroDiarioCalendario = {};
            if (!data.ideas || !Array.isArray(data.ideas)) {
                data.ideas = [];
            } else {
                // Reparar subcategorías huérfanas si existieran
                data.ideas.forEach(function(i) {
                    if (!i.categoria) i.categoria = "💡 Ideas & Proyectos";
                    if (i.categoria === "💭 Ideas y Pensamientos") i.categoria = "💡 Ideas & Proyectos";
                    if (i.categoria === "🛒 Compras") i.categoria = "🛒 Compras & Deseos";
                    if (i.categoria === "📊 Planes y Monitoreo de Ejecución") i.categoria = "📊 Planes & Metas";
                    if (i.categoria === "🧠 Cosas por Aprender") i.categoria = "📚 Base de Conocimientos";
                    if (i.categoria === "✅ Tareas Pendientes") i.categoria = "✅ Tareas Operativas";
                    if (i.subcategoria === "Sistemas & Apps") i.subcategoria = "💼 Trabajo, Programación y Proyectos Profesionales";
                    if (i.subcategoria === "Accesorios Moto") i.subcategoria = "👕 Ropa y Accesorios";
                    if (i.subcategoria === "Desarrollo Web") i.subcategoria = "💻 Programación y Tecnología";
                    if (!i.timestamp) i.timestamp = Date.now();
                });
            }
            if (!data.inventario) {
                data.inventario = {
                    productos: [],
                    categorias: [],
                    ventas: []
                };
            } else {
                if (!data.inventario.productos || !Array.isArray(data.inventario.productos)) data.inventario.productos = [];
                if (!data.inventario.categorias || !Array.isArray(data.inventario.categorias)) data.inventario.categorias = [];
                if (!data.inventario.ventas || !Array.isArray(data.inventario.ventas)) data.inventario.ventas = [];
            }
            return data;
        } catch (e) {
            console.error("Error al leer de localStorage:", e);
            return JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    },
    save: function(state, esAccionUsuario) {
        try {
            if (state) {
                if (esAccionUsuario !== false) {
                    state._ultimaActualizacion = Date.now();
                }
            }
            localStorage.setItem(MONARCA_STORAGE_KEY, JSON.stringify(state));

            // Sincronización en tiempo real hacia Firebase Firestore
            if (window.MonarcaCloud && typeof window.MonarcaCloud.guardarEnNube === 'function') {
                window.MonarcaCloud.guardarEnNube(state);
            }
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
        if (confirm("⚠️ ¿Estás seguro de que deseas restablecer de fábrica el sistema?\n\nEsta acción eliminará todos los datos de prueba y ejemplos por defecto (contactos, ruleta, ideas, finanzas, tareas y entrenamientos), dejando el sistema 100% limpio para que configures únicamente tus propias opciones.")) {
            localStorage.removeItem(MONARCA_STORAGE_KEY);
            APP_STATE = JSON.parse(JSON.stringify(DEFAULT_STATE));
            MonarcaDB.save(APP_STATE);
            alert("✓ Sistema restablecido de fábrica con éxito. Todas las áreas han quedado 100% limpias.");
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
    if (typeof actualizarDesgasteDiarioAutomatico === 'function') {
        actualizarDesgasteDiarioAutomatico();
    } else {
        verificarRecuperacionMentalDiaria();
    }
    renderizarJugador(APP_STATE.jugador);
    if (typeof cargarEstadoPersonal === 'function') {
        cargarEstadoPersonal();
    } else if (typeof renderizarBarrasFatiga === 'function') {
        renderizarBarrasFatiga(APP_STATE.fatiga);
    }
    if (typeof renderizarDesgloseCuerpoAnatomico === 'function') renderizarDesgloseCuerpoAnatomico();
    if (typeof renderizarDesgloseMenteCognitiva === 'function') renderizarDesgloseMenteCognitiva();
    inicializarBancoDeIdeas();

    // Historial inicial para soporte del botón atrás en móvil / PWA
    try {
        if (!history.state || !history.state.vista) {
            history.replaceState({ vista: 'vista-menu' }, '', '#vista-menu');
        }
    } catch(e) {}
    window.VISTA_ACTUAL = 'vista-menu';
}

window.VISTA_ACTUAL = 'vista-menu';

function cambiarVista(vistaId, noPushState) {
    if (!vistaId) return;

    // Redirecciones de conveniencia hacia pestañas internas
    if (vistaId === 'vista-misiones') {
        cambiarVista('vista-acciones-progresion', noPushState);
        if (typeof cambiarTabAccionesDesarrollo === 'function') cambiarTabAccionesDesarrollo('habitos');
        return;
    }
    if (vistaId === 'vista-quests-diarios') {
        cambiarVista('vista-acciones-progresion', noPushState);
        if (typeof cambiarTabAccionesDesarrollo === 'function') cambiarTabAccionesDesarrollo('quests');
        return;
    }
    if (vistaId === 'vista-habilidades') {
        cambiarVista('vista-acciones-progresion', noPushState);
        if (typeof cambiarTabAccionesDesarrollo === 'function') cambiarTabAccionesDesarrollo('skills');
        return;
    }
    if (vistaId === 'vista-mente' || vistaId === 'vista-gimnasio-mental') {
        cambiarVista('vista-ejercicios', noPushState);
        if (typeof cambiarCategoriaEjercicios === 'function') cambiarCategoriaEjercicios('gimnasio-mental');
        return;
    }
    if (vistaId === 'vista-banco-mental') {
        cambiarVista('vista-ejercicios', noPushState);
        if (typeof cambiarCategoriaEjercicios === 'function') {
            cambiarCategoriaEjercicios('banco');
            if (typeof filtrarSubcategoriaEjercicios === 'function') filtrarSubcategoriaEjercicios('mental');
        }
        return;
    }
    if (vistaId === 'vista-gym') {
        cambiarVista('vista-ejercicios', noPushState);
        if (typeof cambiarCategoriaEjercicios === 'function') cambiarCategoriaEjercicios('rutinas');
        return;
    }

    var vistaAnterior = window.VISTA_ACTUAL || 'vista-menu';
    window.VISTA_ACTUAL = vistaId;

    // Manejo de historial para soporte nativo del botón de retroceso (Android / Gesture navigation)
    if (!noPushState && vistaId !== vistaAnterior) {
        try {
            history.pushState({ vista: vistaId }, '', '#' + vistaId);
        } catch(e) {}
    }

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
        case 'vista-acciones-progresion':
            if (typeof cambiarTabAccionesDesarrollo === 'function') {
                var tabAD = (window.TAB_ACCIONES_DESARROLLO_ACTIVA && window.TAB_ACCIONES_DESARROLLO_ACTIVA !== 'conocimiento') ? window.TAB_ACCIONES_DESARROLLO_ACTIVA : 'quests';
                cambiarTabAccionesDesarrollo(tabAD);
            }
            break;
        case 'vista-ejercicios':
            cargarEjercicios();
            break;
        case 'vista-estado-personal':
            cargarEstadoPersonal();
            break;
        case 'vista-finanzas':
            cargarFinanzas();
            break;
        case 'vista-ideas':
            cargarIdeas();
            break;
        case 'vista-conocimiento':
            if (typeof cargarConocimientos === 'function') cargarConocimientos();
            break;
        case 'vista-labores':
            if (typeof cargarLabores === 'function') cargarLabores();
            break;
        case 'vista-personas':
            if (typeof cargarAgendaPersonas === 'function') cargarAgendaPersonas();
            break;
        case 'vista-ruleta':
            if (typeof cargarRuletaSemanal === 'function') cargarRuletaSemanal();
            break;
        case 'vista-calendario':
            renderizarCalendario();
            break;
        case 'vista-inventario':
            if (typeof cargarInventario === 'function') cargarInventario();
            break;
    }
}

// Manejador del botón retroceder de Android / gesto atrás en PWA
window.addEventListener('popstate', function(event) {
    // 1. Si hay algún modal abierto, cerrarlo prioritariamente antes de salir
    var modales = document.querySelectorAll('.modal-overlay, #modal-jarvis-voz, #modal-asistente-rapido');
    var modalAbierto = null;
    for (var i = 0; i < modales.length; i++) {
        var m = modales[i];
        if (m && m.style && m.style.display && m.style.display !== 'none') {
            modalAbierto = m;
            break;
        }
    }

    if (modalAbierto) {
        modalAbierto.style.display = 'none';
        if (typeof detenerEscuchaJarvis === 'function') {
            try { detenerEscuchaJarvis(); } catch(e) {}
        }
        // Restaurar estado en historial para mantener alineada la vista actual
        try {
            history.pushState({ vista: window.VISTA_ACTUAL || 'vista-menu' }, '', '#' + (window.VISTA_ACTUAL || 'vista-menu'));
        } catch(e) {}
        return;
    }

    // 2. Si no hay modal abierto, navegar hacia la vista destino del historial
    var destino = (event.state && event.state.vista) ? event.state.vista : 'vista-menu';
    cambiarVista(destino, true);
});

function verificarRecuperacionMentalDiaria() {
    if (typeof actualizarDesgasteDiarioAutomatico === 'function') {
        actualizarDesgasteDiarioAutomatico();
        return;
    }

    if (!APP_STATE.fatigaMentalDiaria) {
        APP_STATE.fatigaMentalDiaria = JSON.parse(JSON.stringify(DEFAULT_STATE.fatigaMentalDiaria));
    }
    var fMental = APP_STATE.fatigaMentalDiaria;
    var hoyStr = obtenerClaveFechaLocal();
    if (fMental.ultimoDia !== hoyStr) {
        if (!fMental.historial) fMental.historial = [];
        fMental.historial.unshift({
            fecha: fMental.ultimoDia || "Ayer",
            nivelCierre: fMental.nivel || 0,
            estadoCierre: fMental.estado || "Mente Despejada"
        });
        if (fMental.historial.length > 14) fMental.historial.pop();

        // Amanece en 0% como requiere la mecánica de nuevo día
        fMental.nivel = 0;
        fMental.ultimoDia = hoyStr;
        fMental.estado = "Mente Despejada (0% Desgaste)";
        MonarcaDB.save(APP_STATE);
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

function restarExp(cantidad) {
    if (!APP_STATE.jugador) APP_STATE.jugador = { titulo: "Gabriel Arias", nivel: 1, exp: 0, expMax: 100 };
    var expActual = APP_STATE.jugador.exp || 0;
    APP_STATE.jugador.exp = Math.max(0, expActual - (cantidad || 0));
    MonarcaDB.save(APP_STATE);
    renderizarJugador(APP_STATE.jugador);
}

// ==========================================================================
// 4. ASISTENTE FLOTANTE DE CAPTURA RÁPIDA (ACCESO GLOBAL)
// ==========================================================================

var TAB_ASISTENTE_ACTIVO = 'idea';

function abrirAsistenteRapido() {
    var m = document.getElementById('modal-asistente-rapido');
    if (m) {
        m.style.display = 'flex';
        cambiarTabAsistenteRapido(TAB_ASISTENTE_ACTIVO);
    }
}

function cerrarAsistenteRapido() {
    var m = document.getElementById('modal-asistente-rapido');
    if (m) m.style.display = 'none';
}

function cambiarTabAsistenteRapido(tab) {
    TAB_ASISTENTE_ACTIVO = tab;
    var btns = document.querySelectorAll('.btn-tab-asistente');
    btns.forEach(function(b) {
        if (b.getAttribute('data-tab') === tab) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    ['idea', 'quest', 'mente', 'finanza'].forEach(function(t) {
        var sec = document.getElementById('asistente-sec-' + t);
        if (sec) sec.style.display = (t === tab) ? 'block' : 'none';
    });
}

function guardarCapturaRapida() {
    var tab = TAB_ASISTENTE_ACTIVO;
    var fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (tab === 'idea') {
        var inNom = document.getElementById('asistente-idea-nombre');
        var inCat = document.getElementById('asistente-idea-cat');
        var inDesc = document.getElementById('asistente-idea-desc');
        var nom = inNom ? inNom.value.trim() : "";
        var cat = inCat ? inCat.value : "💭 Ideas y Pensamientos";
        var desc = inDesc ? inDesc.value.trim() : "";

        if (!nom) { alert("Ingresa el título de la idea."); if (inNom) inNom.focus(); return; }

        if (!APP_STATE.ideas) APP_STATE.ideas = [];
        APP_STATE.ideas.unshift({
            id: "IDEA-" + Date.now(),
            nombre: nom,
            categoria: cat,
            subcategoria: "Captura Rápida",
            descripcion: desc || "Registrado desde Asistente Rápido",
            estado: "Pendiente",
            prioridad: "Media",
            fecha: fechaHoy,
            timestamp: Date.now()
        });
        sumarExp(15);
        MonarcaDB.save(APP_STATE);
        if (inNom) inNom.value = "";
        if (inDesc) inDesc.value = "";
        cerrarAsistenteRapido();
        if (typeof renderizarIdeas === 'function') renderizarIdeas();
        alert("💡 Idea capturada con éxito (+15 EXP).");

    } else if (tab === 'quest') {
        var inTit = document.getElementById('asistente-quest-titulo');
        var inMin = document.getElementById('asistente-quest-minutos');
        var tit = inTit ? inTit.value.trim() : "";
        var min = inMin ? (Number(inMin.value) || 20) : 20;

        if (!tit) { alert("Ingresa el título del quest o tarea."); if (inTit) inTit.focus(); return; }

        if (!APP_STATE.questsDiarios) APP_STATE.questsDiarios = [];
        var durMs = min * 60 * 1000;
        var nuevaQuest = {
            id: "QD-" + Date.now(),
            titulo: tit,
            categoria: "Acción Rápida",
            descripcion: "Tarea añadida desde Asistente Rápido",
            duracionMinutos: min,
            duracionSegundos: min * 60,
            tiempoInicio: Date.now(),
            tiempoFinEstimado: Date.now() + durMs,
            estado: "en_progreso",
            expRecompensa: 25,
            penitencia: { expDeduccion: 10, mensaje: "Exceso de tiempo en tarea" }
        };
        APP_STATE.questsDiarios.push(nuevaQuest);
        MonarcaDB.save(APP_STATE);
        if (inTit) inTit.value = "";
        cerrarAsistenteRapido();
        if (typeof renderizarQuestsDiarios === 'function') renderizarQuestsDiarios();
        alert("⏳ Quest rápido activado (" + min + " min). ¡En marcha!");

    } else if (tab === 'mente') {
        var inMente = document.getElementById('asistente-mente-desc');
        var txt = inMente ? inMente.value.trim() : "";
        if (!txt) { alert("Ingresa el registro o reflexión mental."); if (inMente) inMente.focus(); return; }

        if (!APP_STATE.salud) APP_STATE.salud = [];
        APP_STATE.salud.unshift({ fecha: fechaHoy, valor: txt });
        if (APP_STATE.fatiga) {
            APP_STATE.fatiga.mente = Math.max(0, (APP_STATE.fatiga.mente || 0) - 20);
        }
        sumarExp(15);
        MonarcaDB.save(APP_STATE);
        if (inMente) inMente.value = "";
        cerrarAsistenteRapido();
        if (typeof renderizarMente === 'function') renderizarMente();
        alert("🧠 Registro mental guardado (+15 EXP).");

    } else if (tab === 'finanza') {
        var inCon = document.getElementById('asistente-fin-concepto');
        var inMon = document.getElementById('asistente-fin-monto');
        var inTipo = document.getElementById('asistente-fin-tipo');
        var con = inCon ? inCon.value.trim() : "";
        var mon = inMon ? (Number(inMon.value) || 0) : 0;
        var esGasto = inTipo ? inTipo.value === 'gasto' : true;

        if (!con || mon <= 0) { alert("Ingresa un concepto y un monto válido."); return; }

        if (!APP_STATE.finanzas) APP_STATE.finanzas = DEFAULT_STATE.finanzas;
        var diaHoy = new Date().getDate();

        if (esGasto) {
            if (!APP_STATE.finanzas.gastos) APP_STATE.finanzas.gastos = [];
            APP_STATE.finanzas.gastos.unshift({
                id: "GAS-" + Date.now(),
                concepto: con,
                categoria: "Otros",
                dia: diaHoy,
                monto: mon,
                pagado: true,
                presupuestoEstimado: mon
            });
        } else {
            if (!APP_STATE.finanzas.ingresos) APP_STATE.finanzas.ingresos = [];
            APP_STATE.finanzas.ingresos.unshift({
                id: "ING-" + Date.now(),
                fuente: con,
                dia: diaHoy,
                monto: mon
            });
        }

        sumarExp(10);
        MonarcaDB.save(APP_STATE);
        if (inCon) inCon.value = "";
        if (inMon) inMon.value = "";
        cerrarAsistenteRapido();
        if (typeof cargarFinanzas === 'function') cargarFinanzas();
        alert("💰 Registro financiero guardado exitosamente (+10 EXP).");
    }
}


