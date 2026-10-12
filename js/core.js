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
    questsDiarios: [
        {
            id: "QD-1",
            titulo: "Rutina Matutina: Despertar & Tender Cama",
            categoria: "🌅 Rutina Matutina",
            tipoTiempo: "duracion",
            tiempoMinutos: 15,
            horaLimite: "08:00",
            penitencia: "30 Flexiones inmediatas",
            exp: 40,
            estado: "pendiente",
            tiempoRestante: 15 * 60,
            temporizadorActivo: false
        },
        {
            id: "QD-2",
            titulo: "Hidratación (1L Agua) & Activación Física",
            categoria: "⚡ Activación Física",
            tipoTiempo: "duracion",
            tiempoMinutos: 20,
            horaLimite: "08:30",
            penitencia: "1 Minuto de Plancha estricta",
            exp: 50,
            estado: "pendiente",
            tiempoRestante: 20 * 60,
            temporizadorActivo: false
        },
        {
            id: "QD-3",
            titulo: "Planificación de Prioridades & Revisión Monarca",
            categoria: "🎯 Enfoque & Trabajo",
            tipoTiempo: "duracion",
            tiempoMinutos: 10,
            horaLimite: "09:00",
            penitencia: "Pérdida de 35 EXP del Avatar",
            exp: 35,
            estado: "pendiente",
            tiempoRestante: 10 * 60,
            temporizadorActivo: false
        }
    ],
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
    rutinaCalentamiento: [
        {
            id: "CAL-1",
            nombre: "Movilidad Articular de Hombros y Brazos",
            duracionSegundos: 30,
            descripcion: "Rotaciones amplias de brazos hacia adelante y hacia atrás para lubricar la articulación escapulohumeral."
        },
        {
            id: "CAL-2",
            nombre: "Apertura Torácica y Pectoral",
            duracionSegundos: 30,
            descripcion: "Extensión horizontal abriendo el tórax y respirando profundo para activar la caja torácica."
        },
        {
            id: "CAL-3",
            nombre: "Rotación de Tronco y Cadera",
            duracionSegundos: 30,
            descripcion: "Giro suave de cadera y cintura para acondicionar lumbares, oblicuos y articulación coxofemoral."
        },
        {
            id: "CAL-4",
            nombre: "Sentadillas al Aire y Activación Cardíaca",
            duracionSegundos: 45,
            descripcion: "Flexiones de rodilla controladas con peso corporal para elevar pulso y preparar el tren inferior."
        }
    ],
    salud: [
        { fecha: "Hoy", valor: "8 horas de sueño - Descanso óptimo" }
    ],
    menteAtributos: {
        // Inteligencia y Cognición
        memoria: 25,
        procesamiento: 30,
        conocimiento: 35,
        // Creatividad e Innovación
        pensamiento_lateral: 25,
        diseno_expresion: 20,
        // Voluntad y Disciplina (Fuerza Mental)
        enfoque: 30,
        gratificacion: 25,
        resiliencia: 35,
        // Psicología y Influencia (Manipulación)
        microexpresiones: 20,
        persuasion: 25,
        control_emocional: 30,
        inteligencia_social: 25
    },
    ejerciciosMentales: [
        {
            id: "EM-1",
            fecha: "Hoy",
            titulo: "Lectura Estratégica & Análisis Crítico",
            descripcion: "Comprensión de modelos mentales y psicología del comportamiento",
            atributosAfectados: ["Conocimiento", "Microexpresiones", "Persuasión"],
            incremento: 10
        }
    ],
    fatigaMentalDiaria: {
        nivel: 20, // 0% a 100% de saturación cognitiva
        ultimoDia: new Date().toISOString().split('T')[0],
        estado: "Mente Despejada",
        historial: []
    },
    musculosMentales: {
        creatividad: { nivel: 35, exp: 120, nombre: "Creatividad", icono: "🎨", descripcion: "Pensamiento lateral, originalidad e invención de soluciones disruptivas." },
        descanso: { nivel: 40, exp: 150, nombre: "Descanso", icono: "🌙", descripcion: "Recuperación neural profunda, desconexión y descompresión del sistema nervioso." },
        anulacion: { nivel: 30, exp: 90, nombre: "Anulación", icono: "🛡️", descripcion: "Supresión de impulsos, control de gratificación inmediata y estoicismo radical." },
        percepcion: { nivel: 25, exp: 80, nombre: "Percepción Psicológica", icono: "♟️", descripcion: "Lectura no verbal, microexpresiones, calibración social y detección de intenciones." },
        inteligencia: { nivel: 35, exp: 130, nombre: "Inteligencia", icono: "⚡", descripcion: "Velocidad de procesamiento, razonamiento lógico, modelado y asimilación técnica." }
    },
    ejerciciosCerebrales: [
        {
            id: "EC-1",
            nombre: "Bloque de Deep Work / Trabajo Profundo",
            musculoPrincipal: "inteligencia",
            musculoSecundario: "anulacion",
            duracionMinutos: 50,
            descripcion: "Sesión sin distracciones ni pantallas secundarias enfocada en un único problema complejo.",
            protocolo: "1. Activar modo no molestar absoluto. 2. Plantear el problema analítico o bloque de código. 3. 50 min de flujo continuo. 4. Documentar conclusiones.",
            fatigaEstimada: 25,
            expRecompensa: 45
        },
        {
            id: "EC-2",
            nombre: "Calibración No Verbal & Microexpresiones",
            musculoPrincipal: "percepcion",
            musculoSecundario: "inteligencia",
            duracionMinutos: 30,
            descripcion: "Observación de lenguaje corporal, incongruencias tonales y detección de emociones ocultas.",
            protocolo: "1. Analizar interacciones grabadas o del entorno real. 2. Identificar microexpresiones faciales y tensión corporal. 3. Comparar intención real vs discurso verbal.",
            fatigaEstimada: 20,
            expRecompensa: 35
        },
        {
            id: "EC-3",
            nombre: "Lluvia de Pensamiento Lateral Contraintuitivo",
            musculoPrincipal: "creatividad",
            musculoSecundario: "inteligencia",
            duracionMinutos: 25,
            descripcion: "Desafío de generación de soluciones disruptivas abordando problemas desde el ángulo opuesto.",
            protocolo: "1. Escoger un desafío del Banco de Ideas. 2. Redactar 10 soluciones absurdas o disruptivas en 15 minutos. 3. Refinar los principios viables.",
            fatigaEstimada: 15,
            expRecompensa: 30
        },
        {
            id: "EC-4",
            nombre: "Anulación de Ruido Mental & Silencio Estoico",
            musculoPrincipal: "anulacion",
            musculoSecundario: "descanso",
            duracionMinutos: 20,
            descripcion: "Práctica de control de impulsos dopamínicos, contención emocional y respiración consciente.",
            protocolo: "1. Silencio absoluto y cero pantallas. 2. Postura erguida y respiración diafragmática 4-7-8. 3. Observar impulsos y pensamientos sin reaccionar.",
            fatigaEstimada: -20,
            expRecompensa: 30
        },
        {
            id: "EC-5",
            nombre: "Descompresión Neural & Recuperación del SNC",
            musculoPrincipal: "descanso",
            musculoSecundario: "anulacion",
            duracionMinutos: 30,
            descripcion: "Protocolo de descanso profundo reparador para evitar saturación cognitiva y fatiga neural.",
            protocolo: "1. Entorno oscuro o luz tenue. 2. Desconexión de tareas pendientes. 3. Relajación progresiva de tensión física y mental.",
            fatigaEstimada: -35,
            expRecompensa: 40
        }
    ],
    conocimientos: [
        {
            id: "CON-1",
            titulo: "Corte Tijera sobre Peine (Técnica de Barbería)",
            area: "Oficio & Barbería",
            actividadOrigen: "Práctica de corte masculino en barbería",
            resumenPuntosClave: "Mantener el peine guía paralelo a la curvatura del cráneo. Abrir y cerrar la tijera únicamente con el pulgar mientras los otros dedos estabilizan la hoja fija para lograr precisión milimétrica sin escalones.",
            nivelDominio: "En Práctica",
            fecha: "Hoy",
            timestamp: Date.now(),
            semanasRepasadas: 1,
            revisadoEstaSemana: true
        },
        {
            id: "CON-2",
            titulo: "Arquitectura Reactiva Offline en JavaScript Moderno",
            area: "Programación & Software",
            actividadOrigen: "Desarrollo de PWA y Cache API",
            resumenPuntosClave: "Separar la capa de datos (LocalStorage/IndexedDB) de la UI. Emplear eventos de sincronización y cache-busting con versionado estricto para garantizar funcionamiento offline instantáneo.",
            nivelDominio: "Dominado",
            fecha: "Hoy",
            timestamp: Date.now(),
            semanasRepasadas: 2,
            revisadoEstaSemana: true
        }
    ],
    categoriasLabores: [
        { id: "LAB-DEV", nombre: "Desarrollo de Software", icono: "💻", descripcion: "Programación web, backend, bases de datos y arquitectura.", color: "#111827" },
        { id: "LAB-TRAINER", nombre: "Personal Trainer", icono: "🏋️‍♂️", descripcion: "Entrenamientos personalizados, asesoría física y técnica deportiva.", color: "#374151" },
        { id: "LAB-BARBER", nombre: "Barbero / Oficio", icono: "💈", descripcion: "Corte de cabello masculino, degradados, afeitado y estética capilar.", color: "#1f2937" }
    ],
    registrosLabores: [
        {
            id: "REG-LAB-1",
            laborId: "LAB-DEV",
            fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            horas: 3.5,
            descripcion: "Implementación de arquitectura offline y sincronización PWA.",
            honorarios: 0,
            timestamp: Date.now()
        },
        {
            id: "REG-LAB-2",
            laborId: "LAB-BARBER",
            fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            horas: 2.0,
            descripcion: "Sesión de corte tijera sobre peine y perfilado de barba.",
            honorarios: 25,
            timestamp: Date.now() - 3600000
        }
    ],
    agendaPersonas: [
        {
            id: "PER-1",
            nombre: "Carlos Mendoza",
            rol: "Cliente Barbería / Alumno Gym",
            ubicacionCategoria: "💈 Barbería",
            lugarProyectado: "Sillón principal - Barbería Central",
            temasPendientes: [
                { id: "T-1", texto: "Planificar cambio de corte para evento", hecho: false },
                { id: "T-2", texto: "Revisar rutina de tren superior y dolor lumbar", hecho: false }
            ],
            fechaObjetivo: "Esta semana",
            estado: "Pendiente",
            prioridad: "Media",
            timestamp: Date.now()
        },
        {
            id: "PER-2",
            nombre: "Andrés Silva",
            rol: "Colega Desarrollador",
            ubicacionCategoria: "☕ Café / Coworking",
            lugarProyectado: "Cafetería o llamada Discord",
            temasPendientes: [
                { id: "T-3", texto: "Definir API de autenticación y base de datos", hecho: false }
            ],
            fechaObjetivo: "Jueves",
            estado: "Pendiente",
            prioridad: "Alta",
            timestamp: Date.now()
        }
    ],
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
        comidas: [
            { id: "C-1", nombre: "Pechuga a la plancha con puré y ensalada verde", tipo: "Almuerzo" },
            { id: "C-2", nombre: "Pasta bolognesa magra con queso parmesano", tipo: "Almuerzo / Cena" },
            { id: "C-3", nombre: "Bowl de atún, arroz integral, maíz y aguacate", tipo: "Almuerzo rápido" },
            { id: "C-4", nombre: "Huevos revueltos con arepa o tostadas y aguacate", tipo: "Desayuno / Cena" },
            { id: "C-5", nombre: "Carne magra a la parrilla con batata y vegetales", tipo: "Almuerzo" },
            { id: "C-6", nombre: "Omelette de claras con avena y frutos secos", tipo: "Desayuno" }
        ],
        vestimenta: [
            { id: "V-1", nombre: "All-Black Urbano (Remera oversize negra y joggers)", estilo: "Minimalista Urbano" },
            { id: "V-2", nombre: "Sport Tech (Ropa deportiva técnica oscura)", estilo: "Entrenamiento / Operativo" },
            { id: "V-3", nombre: "Casual Elegante (Camisa cuello mao negra y pantalón chino)", estilo: "Reuniones / Social" },
            { id: "V-4", nombre: "Monocromático Grafito (Sudadera gris plomo y zapatillas oscuras)", estilo: "Confort / Diario" },
            { id: "V-5", nombre: "Minimalista Blanco & Negro (Polera blanca limpia y pantalón oscuro)", estilo: "Contraste Limpio" }
        ],
        musica: [
            { id: "M-1", nombre: "Synthwave / Retrowave Cyberpunk (Foco Profundo)", genero: "Deep Focus" },
            { id: "M-2", nombre: "Hip Hop Instrumental 90s / Lo-Fi Beats", genero: "Relajación & Creatividad" },
            { id: "M-3", nombre: "Heavy Metal / Hard Rock Gym Energy", genero: "Intensidad & Entrenamiento" },
            { id: "M-4", nombre: "Deep House & Techno Melódico Minimalista", genero: "Flujo Continuo" },
            { id: "M-5", nombre: "Música Clásica Estoica & Orquestal Épica", genero: "Estrategia & Concentración" }
        ],
        seleccionActiva: {
            comida: "Pechuga a la plancha con puré y ensalada verde",
            vestimenta: "All-Black Urbano (Remera oversize negra y joggers)",
            musica: "Synthwave / Retrowave Cyberpunk (Foco Profundo)",
            fechaGiro: "Hoy"
        },
        historialGiros: []
    },
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
            if (!data.rutinas || !Array.isArray(data.rutinas) || data.rutinas.length === 0) {
                data.rutinas = JSON.parse(JSON.stringify(DEFAULT_STATE.rutinas));
            }
            if (!data.rutinaCalentamiento || !Array.isArray(data.rutinaCalentamiento) || data.rutinaCalentamiento.length === 0) {
                data.rutinaCalentamiento = JSON.parse(JSON.stringify(DEFAULT_STATE.rutinaCalentamiento));
            }
            if (!data.questsDiarios || !Array.isArray(data.questsDiarios) || data.questsDiarios.length === 0) {
                data.questsDiarios = JSON.parse(JSON.stringify(DEFAULT_STATE.questsDiarios));
            }
            if (!data.fatiga) data.fatiga = DEFAULT_STATE.fatiga;
            if (!data.gym) data.gym = DEFAULT_STATE.gym;
            if (!data.salud) data.salud = DEFAULT_STATE.salud;
            if (!data.menteAtributos) {
                data.menteAtributos = JSON.parse(JSON.stringify(DEFAULT_STATE.menteAtributos));
            }
            if (!data.ejerciciosMentales || !Array.isArray(data.ejerciciosMentales)) {
                data.ejerciciosMentales = JSON.parse(JSON.stringify(DEFAULT_STATE.ejerciciosMentales || []));
            }
            if (!data.fatigaMentalDiaria) {
                data.fatigaMentalDiaria = JSON.parse(JSON.stringify(DEFAULT_STATE.fatigaMentalDiaria));
            }
            if (!data.musculosMentales) {
                data.musculosMentales = JSON.parse(JSON.stringify(DEFAULT_STATE.musculosMentales));
            }
            if (!data.ejerciciosCerebrales || !Array.isArray(data.ejerciciosCerebrales) || data.ejerciciosCerebrales.length === 0) {
                data.ejerciciosCerebrales = JSON.parse(JSON.stringify(DEFAULT_STATE.ejerciciosCerebrales));
            }
            if (!data.conocimientos || !Array.isArray(data.conocimientos) || data.conocimientos.length === 0) {
                data.conocimientos = JSON.parse(JSON.stringify(DEFAULT_STATE.conocimientos));
            }
            if (!data.categoriasLabores || !Array.isArray(data.categoriasLabores) || data.categoriasLabores.length === 0) {
                data.categoriasLabores = JSON.parse(JSON.stringify(DEFAULT_STATE.categoriasLabores));
            }
            if (!data.registrosLabores || !Array.isArray(data.registrosLabores)) {
                data.registrosLabores = JSON.parse(JSON.stringify(DEFAULT_STATE.registrosLabores || []));
            }
            if (!data.agendaPersonas || !Array.isArray(data.agendaPersonas) || data.agendaPersonas.length === 0) {
                data.agendaPersonas = JSON.parse(JSON.stringify(DEFAULT_STATE.agendaPersonas));
            }
            if (!data.ubicacionesAgenda || !Array.isArray(data.ubicacionesAgenda)) {
                data.ubicacionesAgenda = JSON.parse(JSON.stringify(DEFAULT_STATE.ubicacionesAgenda || []));
            }
            if (!data.ruletaSemanal) {
                data.ruletaSemanal = JSON.parse(JSON.stringify(DEFAULT_STATE.ruletaSemanal));
            }
            if (!data.finanzas) data.finanzas = DEFAULT_STATE.finanzas;
            if (!data.calendario || !Array.isArray(data.calendario)) data.calendario = [];
            if (!data.registroDiarioCalendario) data.registroDiarioCalendario = {};
            if (!data.ideas || !Array.isArray(data.ideas) || data.ideas.length === 0) {
                data.ideas = JSON.parse(JSON.stringify(DEFAULT_STATE.ideas));
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
        case 'vista-acciones-progresion':
            if (typeof cambiarTabAccionesDesarrollo === 'function') {
                var tabAD = (window.TAB_ACCIONES_DESARROLLO_ACTIVA && window.TAB_ACCIONES_DESARROLLO_ACTIVA !== 'conocimiento') ? window.TAB_ACCIONES_DESARROLLO_ACTIVA : 'quests';
                cambiarTabAccionesDesarrollo(tabAD);
            }
            break;
        case 'vista-misiones':
            cambiarVista('vista-acciones-progresion');
            if (typeof cambiarTabAccionesDesarrollo === 'function') cambiarTabAccionesDesarrollo('habitos');
            return;
        case 'vista-quests-diarios':
            cambiarVista('vista-acciones-progresion');
            if (typeof cambiarTabAccionesDesarrollo === 'function') cambiarTabAccionesDesarrollo('quests');
            return;
        case 'vista-habilidades':
            cambiarVista('vista-acciones-progresion');
            if (typeof cambiarTabAccionesDesarrollo === 'function') cambiarTabAccionesDesarrollo('skills');
            return;
        case 'vista-mente':
            cambiarVista('vista-acciones-progresion');
            if (typeof cambiarTabAccionesDesarrollo === 'function') cambiarTabAccionesDesarrollo('gimnasio');
            return;
        case 'vista-gym':
            cambiarVista('vista-ejercicios');
            if (typeof cambiarCategoriaEjercicios === 'function') cambiarCategoriaEjercicios('rutinas');
            return;
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
    }
}

function verificarRecuperacionMentalDiaria() {
    if (!APP_STATE.fatigaMentalDiaria) {
        APP_STATE.fatigaMentalDiaria = JSON.parse(JSON.stringify(DEFAULT_STATE.fatigaMentalDiaria));
    }
    var fMental = APP_STATE.fatigaMentalDiaria;
    var hoyStr = new Date().toISOString().split('T')[0];
    if (fMental.ultimoDia !== hoyStr) {
        if (!fMental.historial) fMental.historial = [];
        fMental.historial.unshift({
            fecha: fMental.ultimoDia || "Ayer",
            nivelCierre: fMental.nivel || 20,
            estadoCierre: fMental.estado || "Mente Despejada"
        });
        if (fMental.historial.length > 14) fMental.historial.pop();

        // Recuperación neural nocturna: se alivia el 50% de la carga cognitiva residual
        var nivelRecuperado = Math.max(10, Math.round((fMental.nivel || 20) * 0.45));
        fMental.nivel = nivelRecuperado;
        fMental.ultimoDia = hoyStr;
        fMental.estado = nivelRecuperado <= 25 ? "Mente Despejada" : (nivelRecuperado <= 60 ? "Carga Moderada" : "Fatiga Residual");
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


