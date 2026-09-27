// ==========================================================================
// MÓDULOS DE SOPORTE DEL SERVIDOR (MISIONES, HABILIDADES, SALUD, FINANZAS, IDEAS)
// ==========================================================================

// --------------------------------------------------------------------------
// MISIONES Y HÁBITOS
// --------------------------------------------------------------------------

/**
 * Obtiene la lista de misiones / hábitos activos.
 */
function getMisiones(ssParam) {
  try {
    var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Habitos") || ss.getSheetByName("Misiones");
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var misiones = [];
    var esHabitos = sheet.getName() === "Habitos";
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Si la fila tiene nombre
      if (esHabitos && row[1]) {
        misiones.push({
          fila: i + 1,
          idCode: row[0] || "",
          nombre: String(row[1]),
          frecuencia: row[2] || "Diario",
          atributo: row[3] || "EXP",
          exp: Number(row[4]) || 10,
          diasRestantes: Number(row[5]) || 0,
          estado: String(row[6] || "Pendiente").trim()
        });
      } else if (!esHabitos && row[1]) {
        misiones.push({
          fila: i + 1,
          idCode: row[0] || "",
          nombre: String(row[1]),
          categoria: row[2] || "General",
          exp: Number(row[3]) || 50,
          atributo: row[4] || "Fuerza",
          frecuencia: row[5] || "Diaria",
          estado: String(row[6] || "Pendiente").trim(),
          diasRestantes: Number(row[7]) || 0
        });
      }
    }
    return misiones;
  } catch (e) {
    return [];
  }
}

// --------------------------------------------------------------------------
// SISTEMA DE HABILIDADES Y RANGOS DINÁMICOS
// --------------------------------------------------------------------------

/**
 * Calcula dinámicamente el rango y progreso del jugador según horas invertidas.
 */
function calcularRangoYRequisito(horas) {
  var h = Number(horas) || 0;
  if (h >= 285) {
    return { rango: "Rango SSS (Máximo)", horasEnNivel: h - 285, horasReqNivel: 0, porcentaje: 100, siguiente: "¡Rango Máximo Alcanzado!" };
  }
  if (h >= 215) {
    var n1 = h - 215;
    return { rango: "Rango SS", horasEnNivel: n1, horasReqNivel: 70, porcentaje: Math.min(100, Math.floor((n1 / 70) * 100)), siguiente: "Faltan " + (70 - n1) + " hrs para SSS" };
  }
  if (h >= 155) {
    var n2 = h - 155;
    return { rango: "Rango S", horasEnNivel: n2, horasReqNivel: 60, porcentaje: Math.min(100, Math.floor((n2 / 60) * 100)), siguiente: "Faltan " + (60 - n2) + " hrs para SS" };
  }
  if (h >= 105) {
    var n3 = h - 105;
    return { rango: "Rango A", horasEnNivel: n3, horasReqNivel: 50, porcentaje: Math.min(100, Math.floor((n3 / 50) * 100)), siguiente: "Faltan " + (50 - n3) + " hrs para S" };
  }
  if (h >= 65) {
    var n4 = h - 65;
    return { rango: "Rango B", horasEnNivel: n4, horasReqNivel: 40, porcentaje: Math.min(100, Math.floor((n4 / 40) * 100)), siguiente: "Faltan " + (40 - n4) + " hrs para A" };
  }
  if (h >= 35) {
    var n5 = h - 35;
    return { rango: "Rango C", horasEnNivel: n5, horasReqNivel: 30, porcentaje: Math.min(100, Math.floor((n5 / 30) * 100)), siguiente: "Faltan " + (30 - n5) + " hrs para B" };
  }
  if (h >= 15) {
    var n6 = h - 15;
    return { rango: "Rango D", horasEnNivel: n6, horasReqNivel: 20, porcentaje: Math.min(100, Math.floor((n6 / 20) * 100)), siguiente: "Faltan " + (20 - n6) + " hrs para C" };
  }
  if (h >= 5) {
    var n7 = h - 5;
    return { rango: "Rango E", horasEnNivel: n7, horasReqNivel: 10, porcentaje: Math.min(100, Math.floor((n7 / 10) * 100)), siguiente: "Faltan " + (10 - n7) + " hrs para D" };
  }
  return { rango: "Sin Rango", horasEnNivel: h, horasReqNivel: 5, porcentaje: Math.min(100, Math.floor((h / 5) * 100)), siguiente: "Faltan " + (5 - h) + " hrs para E" };
}

/**
 * Obtiene la lista de habilidades con su cálculo de rango actualizado.
 */
function getHabilidades(ssParam) {
  try {
    var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Habilidades");
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var skills = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Si la fila tiene identificador o nombre
      if (row[0] || row[1]) {
        var nombre = row[1] || row[0];
        var horasTotales = Number(row[3]) || Number(row[4]) || 0;
        var calculo = calcularRangoYRequisito(horasTotales);
        var beneficio = row[5] || row[7] || "Sin beneficio especificado";
        
        skills.push({
          fila: i + 1,
          id: row[0] || ("skill_" + i),
          nombre: nombre,
          rango: calculo.rango,
          horasTotales: horasTotales,
          horasEnNivel: calculo.horasEnNivel,
          horasReqNivel: calculo.horasReqNivel,
          porcentaje: calculo.porcentaje,
          infoSiguiente: calculo.siguiente,
          beneficio: beneficio
        });
      }
    }
    return skills;
  } catch (e) {
    return [];
  }
}

/**
 * Suma 1 hora a una habilidad y actualiza su progreso en Sheets.
 */
function sumarHoraHabilidad(fila) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Habilidades");
    if (!sheet) return { success: false, error: "No se encontró la hoja Habilidades" };
    
    var rowVals = sheet.getRange(fila, 1, 1, 8).getValues()[0];
    
    // Detectamos si la columna de horas totales es la 4 (D) o la 5 (E)
    var colHoras = (typeof rowVals[3] === 'number') ? 4 : 5;
    var horasActuales = Number(sheet.getRange(fila, colHoras).getValue()) || 0;
    var nuevasHoras = horasActuales + 1;
    
    var calculo = calcularRangoYRequisito(nuevasHoras);
    
    // Actualizamos horas y rango
    sheet.getRange(fila, colHoras).setValue(nuevasHoras);
    sheet.getRange(fila, 3).setValue(calculo.rango);
    
    return {
      success: true,
      nuevasHoras: nuevasHoras,
      rango: calculo.rango,
      porcentaje: calculo.porcentaje
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// --------------------------------------------------------------------------
// SALUD / SUEÑO Y MENTE
// --------------------------------------------------------------------------

function getSalud(ssParam) {
  try {
    var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Salud") || ss.getSheetByName("Mente");
    if (!sheet) return [{ fecha: "Hoy", valor: "8 horas de sueño - Descanso óptimo" }];
    
    var data = sheet.getDataRange().getValues();
    var res = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] || data[i][1]) {
        var fechaStr = data[i][0] instanceof Date ? data[i][0].toLocaleDateString() : String(data[i][0]);
        res.push({
          fecha: fechaStr,
          valor: data[i][1] || "Sin registro"
        });
      }
    }
    return res.length > 0 ? res.slice(-10).reverse() : [{ fecha: "Hoy", valor: "8 horas de sueño - Descanso óptimo" }];
  } catch (e) {
    return [{ fecha: "Hoy", valor: "8 horas de sueño - Descanso óptimo" }];
  }
}

function registrarSalud(tipo, texto) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Salud") || ss.getSheetByName("Mente");
    if (!sheet) {
      sheet = ss.insertSheet("Salud");
      sheet.appendRow(["Fecha", "Registro / Detalle"]);
    }
    var fechaHoy = new Date().toLocaleDateString();
    sheet.appendRow([fechaHoy, texto]);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// --------------------------------------------------------------------------
// FINANZAS
// --------------------------------------------------------------------------

function getFinanzas(ssParam) {
  try {
    var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Finanzas");
    if (!sheet) return [{ concepto: "Presupuesto Mensual", monto: 500 }];
    
    var data = sheet.getDataRange().getValues();
    var res = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        res.push({
          concepto: String(data[i][0]),
          monto: Number(data[i][1]) || 0
        });
      }
    }
    return res.length > 0 ? res : [{ concepto: "Presupuesto Mensual", monto: 500 }];
  } catch (e) {
    return [{ concepto: "Presupuesto Mensual", monto: 500 }];
  }
}

function registrarFinanza(concepto, monto) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Finanzas") || ss.insertSheet("Finanzas");
    sheet.appendRow([concepto, Number(monto) || 0]);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// --------------------------------------------------------------------------
// BANCO DE IDEAS
// --------------------------------------------------------------------------

function getIdeas(ssParam) {
  try {
    var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Ideas");
    if (!sheet) return [{ texto: "Crear aplicación de hábitos tipo Solo Leveling" }];
    
    var data = sheet.getDataRange().getValues();
    var ideas = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        ideas.push({ texto: String(data[i][0]) });
      }
    }
    return ideas.length > 0 ? ideas.slice(-15).reverse() : [{ texto: "Crear aplicación de hábitos tipo Solo Leveling" }];
  } catch (e) {
    return [{ texto: "Crear aplicación de hábitos tipo Solo Leveling" }];
  }
}

function registrarIdea(texto) {
  try {
    if (!texto) return { success: false, error: "Texto vacío" };
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Ideas");
    if (!sheet) {
      sheet = ss.insertSheet("Ideas");
      sheet.appendRow(["Idea Fugaz", "Fecha"]);
    }
    sheet.appendRow([texto, new Date().toLocaleDateString()]);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}