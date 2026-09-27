// ==========================================================================
// SISTEMA DEL MONARCA - SERVIDOR PRINCIPAL (SOLO LEVELING)
// ==========================================================================

/**
 * Punto de entrada único de la aplicación web Google Apps Script.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Sistema del Monarca - Solo Leveling')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper para incluir archivos HTML parciales (CSS, JS, Contenido).
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Helper seguro para obtener una hoja por múltiples nombres posibles.
 */
function getSheetSafe(ss, names) {
  if (typeof names === 'string') names = [names];
  for (var i = 0; i < names.length; i++) {
    var sheet = ss.getSheetByName(names[i]);
    if (sheet) return sheet;
  }
  return null;
}

// --------------------------------------------------------------------------
// CARGA INICIAL POR LOTES (OPTIMIZACIÓN DE LATENCIA)
// --------------------------------------------------------------------------

/**
 * Obtiene todo el estado del sistema en una sola llamada de red para carga ultrarrápida.
 */
function obtenerEstadoInicial() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return {
      success: true,
      jugador: getDatosJugador(ss),
      perfil: getPerfilJugador(ss),
      misiones: getMisiones(ss),
      habilidades: getHabilidades(ss),
      fatiga: obtenerUltimaFatiga(ss),
      gym: obtenerRegistrosGym(ss),
      salud: getSalud(ss),
      finanzas: getFinanzas(ss),
      ideas: getIdeas(ss),
      ejercicios: getEjercicios(ss),
      rutinas: getRutinas(ss)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// --------------------------------------------------------------------------
// GESTIÓN DE JUGADOR, EXP Y NIVEL
// --------------------------------------------------------------------------

/**
 * Retorna las estadísticas del jugador para el banner principal.
 */
function getDatosJugador(ssParam) {
  var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetSafe(ss, ["Jugador_Stats", "Perfil", "Stats"]);
  
  if (!sheet) {
    return { titulo: "Monarca de las Sombras", nivel: 1, exp: 0, expMax: 100 };
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { titulo: "Monarca de las Sombras", nivel: 1, exp: 0, expMax: 100 };
  }

  // Compatibilidad: detectar si la hoja es tipo "Jugador_Stats" o tipo "Perfil"
  var row = data[1];
  if (sheet.getName() === "Jugador_Stats") {
    return {
      titulo: row[0] || "Monarca de las Sombras",
      nivel: Number(row[1]) || 1,
      exp: Number(row[2]) || 0,
      expMax: Number(row[3]) || 100
    };
  } else {
    // Hoja Perfil: [Nivel, ExpActual, ExpSiguiente, STR, INT, MP, VIT]
    return {
      titulo: "Monarca de las Sombras",
      nivel: Number(row[0]) || 1,
      exp: Number(row[1]) || 0,
      expMax: Number(row[2]) || 100
    };
  }
}

/**
 * Retorna los atributos detallados del Jugador para la vista de Perfil.
 */
function getPerfilJugador(ssParam) {
  var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetSafe(ss, ["Perfil", "Stats", "Jugador_Stats"]);
  
  if (!sheet) {
    return { str: 10, int: 10, vit: 10, mp: 100 };
  }
  
  var vals = sheet.getDataRange().getValues();
  if (vals.length > 1) {
    if (sheet.getName() === "Jugador_Stats") {
      // Valores por defecto o columnas secundarias si existen
      return {
        str: Number(vals[1][4]) || 15,
        int: Number(vals[1][5]) || 18,
        vit: Number(vals[1][6]) || 14,
        mp: Number(vals[1][7]) || 120
      };
    } else {
      // Hoja Perfil estándar: [Nivel, Exp, ExpSiguiente, STR, INT, MP, VIT]
      return {
        str: Number(vals[1][3]) || 10,
        int: Number(vals[1][4]) || 10,
        mp: Number(vals[1][5]) || 100,
        vit: Number(vals[1][6]) || 10
      };
    }
  }
  
  return { str: 10, int: 10, vit: 10, mp: 100 };
}

/**
 * Resumen del sistema para compatibilidad con otros componentes.
 */
function obtenerResumenSistema() {
  var datos = getDatosJugador();
  return {
    nivel: datos.nivel,
    expActual: datos.exp,
    expMax: datos.expMax,
    rango: datos.titulo
  };
}

/**
 * Completa un hábito o misión, incrementa la racha y suma experiencia al jugador.
 */
function completarHabito(fila) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHabitos = getSheetSafe(ss, ["Misiones", "Habitos"]);
    if (!sheetHabitos) return { success: false, error: "No se encontró la hoja de misiones" };
    
    // Leemos la fila completa en una sola llamada para evitar latencia
    var filaData = sheetHabitos.getRange(fila, 1, 1, 8).getValues()[0];
    
    var expRecompensa = 50;
    var streakActual = 0;
    
    if (sheetHabitos.getName() === "Habitos") {
      // Columnas: [ID/Vacio, Nombre, Frecuencia, Atributo, EXP, DiasRestantes/Streak, Estado]
      expRecompensa = Number(filaData[4]) || 10;
      streakActual = Number(filaData[5]) || 0;
      sheetHabitos.getRange(fila, 7).setValue('Completado');
      sheetHabitos.getRange(fila, 6).setValue(streakActual + 1);
    } else {
      // Columnas Misiones: [ID, Nombre, Categoria, EXP, Atributo, Frecuencia, Estado, Streak]
      expRecompensa = Number(filaData[3]) || 50;
      streakActual = Number(filaData[7]) || 0;
      sheetHabitos.getRange(fila, 7).setValue('Completado');
      sheetHabitos.getRange(fila, 8).setValue(streakActual + 1);
    }
    
    // Actualizar EXP y nivel del jugador
    var sheetPerfil = getSheetSafe(ss, ["Jugador_Stats", "Perfil", "Stats"]);
    if (sheetPerfil) {
      var perfilVals = sheetPerfil.getRange(2, 1, 1, 4).getValues()[0];
      var esJugadorStats = sheetPerfil.getName() === "Jugador_Stats";
      
      var nivel = esJugadorStats ? (Number(perfilVals[1]) || 1) : (Number(perfilVals[0]) || 1);
      var expActual = esJugadorStats ? (Number(perfilVals[2]) || 0) : (Number(perfilVals[1]) || 0);
      var expMax = esJugadorStats ? (Number(perfilVals[3]) || 100) : (Number(perfilVals[2]) || 100);
      
      expActual += expRecompensa;
      var subioNivel = false;
      
      while (expActual >= expMax) {
        expActual -= expMax;
        nivel += 1;
        expMax = Math.round(expMax * 1.2);
        subioNivel = true;
      }
      
      if (esJugadorStats) {
        sheetPerfil.getRange(2, 2, 1, 3).setValues([[nivel, expActual, expMax]]);
      } else {
        sheetPerfil.getRange(2, 1, 1, 3).setValues([[nivel, expActual, expMax]]);
      }
      
      return {
        success: true,
        subioNivel: subioNivel,
        nuevoNivel: nivel,
        expActual: expActual,
        expMax: expMax
      };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Alias de compatibilidad para completar misiones.
 */
function completarMision(fila) {
  return completarHabito(fila);
}