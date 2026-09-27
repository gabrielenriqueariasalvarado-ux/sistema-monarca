// ==========================================================================
// MÓDULO DE CONDICIÓN FÍSICA, GYM Y CONTROL ANATÓMICO DE FATIGA (SOLO LEVELING)
// ==========================================================================

/**
 * Catálogo canónico de músculos en orden anatómico (De la cabeza a los pies con Mente en la cima).
 */
var CANAL_MUSCULOS = [
  { key: "mente", nombre: "Mente & Concentración", grupo: "Mental", icono: "🧠" },
  
  // Tren Superior: Hombros
  { key: "delt_ant", nombre: "Deltoides Anterior (Frontal)", grupo: "Hombros", icono: "🛡️" },
  { key: "delt_lat", nombre: "Deltoides Lateral (Anchura)", grupo: "Hombros", icono: "🛡️" },
  { key: "delt_post", nombre: "Deltoides Posterior (Trasero)", grupo: "Hombros", icono: "🛡️" },
  { key: "manguito", nombre: "Manguito Rotador (Estabilizadores)", grupo: "Hombros", icono: "🔄" },

  // Tren Superior: Pecho
  { key: "pect_mayor", nombre: "Pectoral Mayor (Superior / Medio)", grupo: "Pecho", icono: "⚔️" },
  { key: "pect_menor", nombre: "Pectoral Menor (Inferior)", grupo: "Pecho", icono: "⚔️" },

  // Tren Superior: Brazos
  { key: "biceps", nombre: "Bíceps Braquial", grupo: "Brazos", icono: "💪" },
  { key: "triceps", nombre: "Tríceps Braquial", grupo: "Brazos", icono: "💪" },
  { key: "antebrazos", nombre: "Antebrazos (Flexores & Extensores)", grupo: "Brazos", icono: "✊" },

  // Tren Superior: Espalda
  { key: "trapecios", nombre: "Trapecios y Romboides", grupo: "Espalda", icono: "🦅" },
  { key: "dorsales", nombre: "Dorsales y Redondos (Forma en V)", grupo: "Espalda", icono: "🦅" },
  { key: "lumbares", nombre: "Erectores Espinales (Zona Lumbar)", grupo: "Espalda", icono: "🏛️" },

  // Core & Abdomen
  { key: "core", nombre: "Core / Recto Abdominal & Oblicuos", grupo: "Core", icono: "⚡" },

  // Cadera & Glúteos
  { key: "gluteos", nombre: "Glúteos (Mayor, Medio y Menor)", grupo: "Glúteos", icono: "🍑" },
  { key: "cadera", nombre: "Cadera / Aductores e Iliopsoas", grupo: "Cadera", icono: "🥋" },

  // Piernas: Muslos
  { key: "cuadriceps", nombre: "Cuádriceps (Recto & Vastos)", grupo: "Piernas", icono: "🦵" },
  { key: "isquios", nombre: "Isquiotibiales (Cadena Posterior)", grupo: "Piernas", icono: "🦵" },

  // Piernas: Pantorrillas & Tobillos
  { key: "pantorrillas", nombre: "Pantorrillas (Gemelos & Sóleo)", grupo: "Pantorrillas", icono: "🦶" }
];

/**
 * Formatea una fecha en formato DD/MM/AA (ej. 20/09/26).
 */
function _obtenerFechaCorta(fecha) {
  var d = (fecha instanceof Date) ? fecha : (fecha ? new Date(fecha) : new Date());
  if (isNaN(d.getTime())) d = new Date();
  var dia = ('0' + d.getDate()).slice(-2);
  var mes = ('0' + (d.getMonth() + 1)).slice(-2);
  var anio = String(d.getFullYear()).slice(-2);
  return dia + '/' + mes + '/' + anio;
}

/**
 * Asegura que la hoja Fatiga tenga los 19 encabezados anatómicos en orden exacto,
 * seguidos de la columna Historial Diario (Promedio) y Fecha_Registro.
 */
function _asegurarCabecerasAnatomicas(hojaFatiga) {
  var headersDeseados = CANAL_MUSCULOS.map(function(m) { return m.nombre; });
  headersDeseados.push("Historial Diario (Promedio)");
  headersDeseados.push("Fecha_Registro");

  var dataActual = hojaFatiga.getDataRange().getValues();
  var necesitaActualizar = false;

  if (dataActual.length === 0 || dataActual[0].length < headersDeseados.length || dataActual[0][1] !== headersDeseados[1]) {
    necesitaActualizar = true;
  }

  if (necesitaActualizar) {
    // Si la hoja ya tiene registros de 6 columnas, conservamos los promedios previos
    var registrosPreviosG = [];
    if (dataActual.length > 1) {
      for (var r = 1; r < dataActual.length; r++) {
        if (dataActual[r][6]) registrosPreviosG.push(String(dataActual[r][6]));
      }
    }

    // Sobrescribir cabeceras con el catálogo anatómico completo
    hojaFatiga.getRange(1, 1, 1, headersDeseados.length).setValues([headersDeseados]);

    // Si no había datos o eran los 6 antiguos, colocamos una fila inicial en 0
    if (dataActual.length < 2 || dataActual[0].length < 10) {
      var filaInicial = new Array(CANAL_MUSCULOS.length).fill(0);
      filaInicial.push(""); // Historial vacio
      filaInicial.push(_obtenerFechaCorta(new Date()));
      
      // Limpiar datos viejos inconsistentes y fijar fila 2
      if (hojaFatiga.getLastRow() > 1) {
        hojaFatiga.getRange(2, 1, Math.max(hojaFatiga.getLastRow() - 1, 1), hojaFatiga.getLastColumn()).clearContent();
      }
      hojaFatiga.getRange(2, 1, 1, filaInicial.length).setValues([filaInicial]);

      // Reinsertar cierres históricos en la nueva columna si existían
      var colHistorial = CANAL_MUSCULOS.length + 1; // Columna T (20)
      for (var h = 0; h < registrosPreviosG.length; h++) {
        hojaFatiga.getRange(h + 2, colHistorial).setValue(registrosPreviosG[h]);
      }
    }
  }
}

/**
 * Comprueba el cambio de día en la hoja Fatiga.
 * Si la última fecha no coincide con hoy:
 * 1. Calcula el promedio de todos los 19 grupos musculares del día anterior.
 * 2. Lo anota en la columna Historial Diario hacia abajo: "DD/MM/AA (XX%)".
 * 3. Reinicia todos los grupos musculares a 0% para el nuevo día.
 */
function _comprobarYResetearDiaFatiga(hojaFatiga) {
  _asegurarCabecerasAnatomicas(hojaFatiga);

  var datos = hojaFatiga.getDataRange().getValues();
  var ultimaFila = datos.length;
  var hoyStr = _obtenerFechaCorta(new Date());
  var numMusculos = CANAL_MUSCULOS.length; // 19
  var colHistorialIdx = numMusculos;       // Índice 19 (Columna 20 / T)
  var colFechaIdx = numMusculos + 1;       // Índice 20 (Columna 21 / U)

  if (ultimaFila < 2) {
    var filaCero = new Array(numMusculos).fill(0);
    filaCero.push("");
    filaCero.push(hoyStr);
    hojaFatiga.appendRow(filaCero);
    return {
      reiniciado: false,
      fatigaActual: new Array(numMusculos).fill(0),
      ultimoCierre: "Sin registros previos"
    };
  }

  var ultimoRegistro = datos[ultimaFila - 1];
  var fechaUltimoRegistro = ultimoRegistro[colFechaIdx];
  var fechaUltimoStr = fechaUltimoRegistro ? _obtenerFechaCorta(fechaUltimoRegistro) : "";

  if (!fechaUltimoStr) {
    hojaFatiga.getRange(ultimaFila, colFechaIdx + 1).setValue(hoyStr);
    fechaUltimoStr = hoyStr;
  }

  // Comprobar si cambió el día
  if (fechaUltimoStr !== hoyStr) {
    // 1. Calcular promedio de los 19 músculos del día anterior
    var suma = 0;
    for (var m = 0; m < numMusculos; m++) {
      suma += (Number(ultimoRegistro[m]) || 0);
    }
    var promedio = Math.round(suma / numMusculos);
    var textoCierre = fechaUltimoStr + " (" + promedio + "%)";

    // 2. Buscar primera celda libre en la columna de historial
    var colHistorialVals = hojaFatiga.getRange(1, colHistorialIdx + 1, hojaFatiga.getLastRow(), 1).getValues();
    var filaDestinoH = 2;
    for (var i = 1; i < colHistorialVals.length; i++) {
      if (colHistorialVals[i][0] === "" || colHistorialVals[i][0] === null) {
        filaDestinoH = i + 1;
        break;
      }
      if (i === colHistorialVals.length - 1) {
        filaDestinoH = colHistorialVals.length + 1;
      }
    }
    hojaFatiga.getRange(filaDestinoH, colHistorialIdx + 1).setValue(textoCierre);

    // 3. Reiniciar fatiga a 0% para hoy
    var nuevaLineaHoy = new Array(numMusculos).fill(0);
    nuevaLineaHoy.push("");
    nuevaLineaHoy.push(hoyStr);
    hojaFatiga.appendRow(nuevaLineaHoy);

    return {
      reiniciado: true,
      fatigaActual: new Array(numMusculos).fill(0),
      ultimoCierre: textoCierre
    };
  }

  // Mismo día: obtener último cierre histórico
  var colHVals = hojaFatiga.getRange(1, colHistorialIdx + 1, hojaFatiga.getLastRow(), 1).getValues();
  var ultimoCierreTexto = "Sin registros previos";
  for (var k = colHVals.length - 1; k >= 1; k--) {
    if (colHVals[k][0] !== "" && colHVals[k][0] !== null) {
      ultimoCierreTexto = String(colHVals[k][0]);
      break;
    }
  }

  var valoresHoy = [];
  for (var j = 0; j < numMusculos; j++) {
    valoresHoy.push(Number(ultimoRegistro[j]) || 0);
  }

  return {
    reiniciado: false,
    fatigaActual: valoresHoy,
    ultimoCierre: ultimoCierreTexto
  };
}

/**
 * Motor centralizado para registrar rutinas en la hoja Gym y actualizar
 * el acumulado de fatiga en los 19 músculos anatómicos.
 *
 * @param {string} nombreRutina Detalle de la rutina realizada
 * @param {string} tipo Categoría ("Gym", "Mente/Cuerpo")
 * @param {Object} incrementosMapa Mapa { keyMusculo: incremento }
 */
function _gestionarRutinaAnatomica(nombreRutina, tipo, incrementosMapa) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Registro en la hoja Gym
    let hojaGym = ss.getSheetByName("Gym");
    if (!hojaGym) {
      hojaGym = ss.insertSheet("Gym");
      hojaGym.appendRow(["Fecha", "Rutina / Detalle", "Tipo"]);
    }
    hojaGym.appendRow([new Date(), nombreRutina, tipo]);

    // 2. Gestión de la hoja Fatiga
    let hojaFatiga = ss.getSheetByName("Fatiga");
    if (!hojaFatiga) {
      hojaFatiga = ss.insertSheet("Fatiga");
      _asegurarCabecerasAnatomicas(hojaFatiga);
    }

    const estadoDia = _comprobarYResetearDiaFatiga(hojaFatiga);
    const fatigaBase = estadoDia.fatigaActual;
    const hoyStr = _obtenerFechaCorta(new Date());

    // Calcular nuevos valores aplicando topes (0 - 100%) a cada uno de los 19 músculos
    var nuevaFila = [];
    var objetoFatigaRetorno = {};
    var sumaTotal = 0;

    for (var i = 0; i < CANAL_MUSCULOS.length; i++) {
      var canal = CANAL_MUSCULOS[i];
      var base = fatigaBase[i] || 0;
      var inc = (incrementosMapa && incrementosMapa[canal.key]) ? incrementosMapa[canal.key] : 0;
      var nuevoVal = Math.min(100, Math.max(0, base + inc));
      
      nuevaFila.push(nuevoVal);
      objetoFatigaRetorno[canal.key] = nuevoVal;
      sumaTotal += nuevoVal;
    }

    // Columna Historial vacía en la fila de hoy, y Fecha_Registro
    nuevaFila.push("");
    nuevaFila.push(hoyStr);

    hojaFatiga.appendRow(nuevaFila);

    var promedioHoy = Math.round(sumaTotal / CANAL_MUSCULOS.length);
    objetoFatigaRetorno.promedioHoy = promedioHoy;
    objetoFatigaRetorno.ultimoCierre = estadoDia.ultimoCierre;

    return {
      success: true,
      mensaje: "¡Rutina registrada con éxito!",
      fatiga: objetoFatigaRetorno
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// --------------------------------------------------------------------------
// RUTINAS ESPECÍFICAS CON IMPACTO ANATÓMICO PRECISO
// --------------------------------------------------------------------------

/**
 * Rutina Mañanera:
 * Flexiones -> Pectorales (+15%), Deltoides Anterior (+10%), Tríceps (+15%)
 * Abdominales & Plancha -> Core (+25%), Lumbares (+10%)
 * Sentadillas -> Cuádriceps (+20%), Glúteos (+15%), Pantorrillas (+10%)
 * Mente -> (+5%)
 */
function enviarRutinaMananera() {
  return _gestionarRutinaAnatomica(
    "Rutina Mañanera - Flexiones, Abdominales, Sentadillas, Plancha",
    "Mente/Cuerpo",
    {
      mente: 5,
      delt_ant: 10,
      pect_mayor: 15,
      pect_menor: 10,
      triceps: 15,
      core: 25,
      lumbares: 10,
      cuadriceps: 20,
      gluteos: 15,
      pantorrillas: 10
    }
  );
}

function registrarRutinaMananera() {
  return enviarRutinaMananera();
}

/**
 * Lunes: Rutina de Empuje (Pecho, Hombro, Tríceps)
 * Press Banca Plano -> Pectoral Mayor (+25%), Pectoral Menor (+15%), Tríceps (+20%), Delt. Anterior (+15%)
 * Press Militar -> Deltoides Anterior (+25%), Deltoides Lateral (+20%), Manguito Rotador (+15%), Tríceps (+15%)
 * Extensión Polea -> Tríceps (+25%), Antebrazos (+10%)
 */
function registrarRutinaEmpuje() {
  return _gestionarRutinaAnatomica(
    "Lunes: Empuje (Pecho, Hombro, Tríceps)",
    "Gym",
    {
      delt_ant: 25,
      delt_lat: 20,
      manguito: 15,
      pect_mayor: 25,
      pect_menor: 15,
      triceps: 25,
      antebrazos: 10
    }
  );
}

/**
 * Miércoles: Rutina de Pierna (Bicicleta, Agarre, Sentadilla)
 * Sentadilla con Barra -> Cuádriceps (+30%), Glúteos (+25%), Isquiotibiales (+15%), Lumbares (+15%), Core (+10%)
 * Agarre -> Antebrazos (+30%)
 * Bicicleta -> Cuádriceps (+15%), Pantorrillas (+20%), Isquiotibiales (+10%), Cadera (+15%)
 */
function registrarRutinaPierna() {
  return _gestionarRutinaAnatomica(
    "Miércoles: Pierna (Bicicleta, Agarre, Sentadilla)",
    "Gym",
    {
      cuadriceps: 30,
      gluteos: 25,
      isquios: 20,
      pantorrillas: 20,
      cadera: 15,
      antebrazos: 30,
      lumbares: 15,
      core: 10
    }
  );
}

/**
 * Viernes: Rutina de Arrastre (Espalda y Bíceps)
 * Jalón al Pecho -> Dorsales y Redondos (+30%), Trapecios y Romboides (+15%), Bíceps (+20%)
 * Remo Mancuerna -> Trapecios (+25%), Dorsales (+20%), Deltoides Posterior (+20%), Bíceps (+15%), Antebrazos (+15%), Lumbares (+15%)
 * Curl Bíceps -> Bíceps (+30%), Antebrazos (+20%)
 */
function registrarRutinaArrastre() {
  return _gestionarRutinaAnatomica(
    "Viernes: Arrastre (Espalda, Remo, Curl de Bíceps)",
    "Gym",
    {
      dorsales: 30,
      trapecios: 25,
      delt_post: 20,
      lumbares: 15,
      biceps: 30,
      antebrazos: 20
    }
  );
}

// --------------------------------------------------------------------------
// CONSULTAS DE ESTADO Y REGISTROS
// --------------------------------------------------------------------------

/**
 * Retorna todos los 19 músculos anatómicos ordenados de la cabeza a los pies,
 * calculando el promedio de hoy y reportando el último cierre diario.
 */
function obtenerUltimaFatiga(ssParam) {
  try {
    const ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    const hojaFatiga = ss.getSheetByName("Fatiga");
    var retorno = {};

    if (!hojaFatiga) {
      CANAL_MUSCULOS.forEach(function(m) { retorno[m.key] = 0; });
      retorno.promedioHoy = 0;
      retorno.ultimoCierre = "Sin registros previos";
      return retorno;
    }

    const estadoDia = _comprobarYResetearDiaFatiga(hojaFatiga);
    const f = estadoDia.fatigaActual;
    var sumaTotal = 0;

    for (var i = 0; i < CANAL_MUSCULOS.length; i++) {
      var canal = CANAL_MUSCULOS[i];
      var val = Number(f[i]) || 0;
      retorno[canal.key] = val;
      sumaTotal += val;
    }

    retorno.promedioHoy = Math.round(sumaTotal / CANAL_MUSCULOS.length);
    retorno.ultimoCierre = estadoDia.ultimoCierre || "Sin registros previos";

    return retorno;
  } catch (e) {
    var errObj = {};
    CANAL_MUSCULOS.forEach(function(m) { errObj[m.key] = 0; });
    errObj.promedioHoy = 0;
    errObj.ultimoCierre = "Sin registros previos";
    return errObj;
  }
}

/**
 * Retorna los últimos 10 entrenamientos registrados en Gym.
 */
function obtenerRegistrosGym(ssParam) {
  try {
    const ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("Gym");
    if (!hoja) return [];
    
    const datos = hoja.getDataRange().getValues();
    if (datos.length <= 1) return [];
    
    datos.shift(); // Quitar cabecera
    
    return datos.slice(-10).reverse().map(row => {
      const fechaStr = row[0] instanceof Date ? row[0].toLocaleDateString() : String(row[0]);
      return {
        fecha: fechaStr,
        detalle: String(row[1] || "Entrenamiento")
      };
    });
  } catch (e) {
    return [];
  }
}

function getGymRecords(ssParam) {
  return obtenerRegistrosGym(ssParam);
}

// --------------------------------------------------------------------------
// CATÁLOGO DE EJERCICIOS (Hoja: Ejercicios)
// Columnas: A=Codigo, B=Nombre, C=Descripcion, D..V = letras guía a-s (% fatiga)
// --------------------------------------------------------------------------

/**
 * Lee la hoja "Ejercicios" y retorna un array de objetos con código, nombre,
 * repeticiones, descripción y el mapa de porcentajes de fatiga por letra guía (a-s).
 *
 * Estructura de columnas:
 *   A=Codigo, B=Nombre, C=Repeticiones, D=Descripcion, E..W = letras a-s (% fatiga)
 */
function getEjercicios(ssParam) {
  try {
    var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Ejercicios");
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    var letrasGuia = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s'];
    var ejercicios = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Necesitamos al menos código o nombre para incluir el ejercicio
      if (!row[0] && !row[1]) continue;

      var fatiguePct = {};
      for (var l = 0; l < letrasGuia.length; l++) {
        // Columna E = índice 4 es donde empiezan las letras guía
        fatiguePct[letrasGuia[l]] = Number(row[4 + l]) || 0;
      }

      ejercicios.push({
        fila: i + 1,
        codigo: String(row[0] || ''),
        nombre: String(row[1] || ''),
        repeticiones: String(row[2] || ''),   // Columna C: cantidad de repeticiones
        descripcion: String(row[3] || ''),     // Columna D: descripción del ejercicio
        fatiga: fatiguePct
      });
    }
    return ejercicios;
  } catch (e) {
    return [];
  }
}

// --------------------------------------------------------------------------
// CATÁLOGO DE RUTINAS (Hoja: Rutinas)
// Columnas: A=Codigo rutina, B=Nombre rutina, C=Descripcion, D..en adelante = códigos de ejercicios
// --------------------------------------------------------------------------

/**
 * Lee la hoja "Rutinas" y retorna un array de rutinas, cada una con su
 * descripción y lista de ejercicios. Cruza con la hoja Ejercicios para
 * obtener nombre, repeticiones, descripción y mapa de fatiga de cada ejercicio.
 */
function getRutinas(ssParam) {
  try {
    var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    var sheetRut = ss.getSheetByName("Rutinas");
    if (!sheetRut) return [];

    var dataRut = sheetRut.getDataRange().getValues();
    if (dataRut.length < 2) return [];

    // Construir mapa de ejercicios por código para hacer cruce rápido
    var ejerciciosMapa = {};
    var todosEjercicios = getEjercicios(ss);
    todosEjercicios.forEach(function(ej) {
      if (ej.codigo) ejerciciosMapa[ej.codigo] = ej;
    });

    var rutinas = [];

    for (var i = 1; i < dataRut.length; i++) {
      var row = dataRut[i];
      if (!row[0] && !row[1]) continue;

      var codigoRutina = String(row[0] || '');
      var nombreRutina = String(row[1] || '');
      var descripcionRutina = String(row[2] || ''); // Columna C: descripción de la rutina

      // Las columnas D en adelante (índice 3+) contienen los códigos de ejercicio
      var ejerciciosRutina = [];
      for (var c = 3; c < row.length; c++) {
        var codEj = String(row[c] || '').trim();
        if (!codEj) continue;
        if (ejerciciosMapa[codEj]) {
          ejerciciosRutina.push(ejerciciosMapa[codEj]);
        } else {
          // Ejercicio referenciado pero no encontrado en Ejercicios
          ejerciciosRutina.push({ codigo: codEj, nombre: codEj, repeticiones: '', descripcion: '', fatiga: {} });
        }
      }

      rutinas.push({
        fila: i + 1,
        codigo: codigoRutina,
        nombre: nombreRutina,
        descripcion: descripcionRutina,
        ejercicios: ejerciciosRutina,
        vacia: ejerciciosRutina.length === 0
      });
    }
    return rutinas;
  } catch (e) {
    return [];
  }
}

// --------------------------------------------------------------------------
// FUNCIÓN BATCH: carga rutinas + ejercicios + historial gym en una sola llamada
// --------------------------------------------------------------------------

/**
 * Retorna en un solo objeto rutinas, ejercicios y registros de gym.
 * Llamada desde el cliente cuando se navega a la vista Gym.
 */
function obtenerDatosGym() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return {
      rutinas: getRutinas(ss),
      ejercicios: getEjercicios(ss),
      gym: obtenerRegistrosGym(ss)
    };
  } catch (e) {
    return { rutinas: [], ejercicios: [], gym: [] };
  }
}

// --------------------------------------------------------------------------
// REGISTRO DE RUTINA GENÉRICA CON MAPA DE FATIGA (letras guía a-s → keys musculo)
// --------------------------------------------------------------------------

/**
 * Mapa que convierte letras guía (a-s) de la hoja Ejercicios a los keys
 * del CANAL_MUSCULOS para poder calcular el incremento de fatiga correcto.
 *
 * Orden de CANAL_MUSCULOS (19 entradas):
 *   a=mente, b=delt_ant, c=delt_lat, d=delt_post, e=manguito,
 *   f=pect_mayor, g=pect_menor, h=biceps, i=triceps, j=antebrazos,
 *   k=trapecios, l=dorsales, m=lumbares, n=core, o=gluteos, p=cadera,
 *   q=cuadriceps, r=isquios, s=pantorrillas
 */
var LETRA_A_KEY = {
  'a': 'mente',
  'b': 'delt_ant',
  'c': 'delt_lat',
  'd': 'delt_post',
  'e': 'manguito',
  'f': 'pect_mayor',
  'g': 'pect_menor',
  'h': 'biceps',
  'i': 'triceps',
  'j': 'antebrazos',
  'k': 'trapecios',
  'l': 'dorsales',
  'm': 'lumbares',
  'n': 'core',
  'o': 'gluteos',
  'p': 'cadera',
  'q': 'cuadriceps',
  'r': 'isquios',
  's': 'pantorrillas'
};

/**
 * Registra cualquier rutina dinámica tomando su nombre y el mapa de porcentajes
 * por letra guía { a: %, b: %, … }. Convierte las letras a keys anatómicos
 * y llama al motor centralizado _gestionarRutinaAnatomica.
 *
 * @param {string} nombreRutina Nombre de la rutina a registrar
 * @param {Object} mapaLetras   { 'a': 10, 'c': 15, … } porcentajes por letra guía
 */
function registrarRutinaGenerica(nombreRutina, mapaLetras) {
  try {
    // Convertir mapa de letras a mapa de keys musculares
    var incrementosMapa = {};
    var letras = Object.keys(mapaLetras || {});
    for (var i = 0; i < letras.length; i++) {
      var letra = letras[i].toLowerCase();
      var keyMusculo = LETRA_A_KEY[letra];
      if (keyMusculo) {
        incrementosMapa[keyMusculo] = (incrementosMapa[keyMusculo] || 0) + (Number(mapaLetras[letras[i]]) || 0);
      }
    }

    return _gestionarRutinaAnatomica(nombreRutina, 'Gym', incrementosMapa);
  } catch (e) {
    return { success: false, error: e.message };
  }
}