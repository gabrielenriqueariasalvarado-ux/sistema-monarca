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
// CONTROL FINANCIERO PERSONAL MONARCA (INGRESOS, GASTOS, 50/40/10, DEUDAS Y METAS)
// --------------------------------------------------------------------------

/**
 * Crea o formatea la hoja "Finanzas" con estructura profesional y datos generales.
 */
function crearHojaFinanzas(ssParam) {
  try {
    var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Finanzas";
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    } else {
      // Si la hoja existía pero tenía formato antiguo simple, podemos limpiarla o estructurarla
      if (sheet.getLastRow() <= 2 && sheet.getLastColumn() <= 2) {
        sheet.clear();
      }
    }

    // Si la hoja está vacía, construir estructura completa
    if (sheet.getLastRow() === 0) {
      // Fila 1: Título Principal
      sheet.getRange("A1:L1").merge();
      sheet.getRange("A1").setValue("SISTEMA MONARCA · CONTROL FINANCIERO PERSONAL");
      sheet.getRange("A1").setBackground("#0f172a").setFontColor("#fbbf24").setFontWeight("bold").setFontSize(14).setHorizontalAlignment("center");
      sheet.setRowHeight(1, 38);

      // Fila 2 a 4: Metadatos Generales
      sheet.getRange("A2").setValue("Titular:").setFontWeight("bold").setFontColor("#94a3b8");
      sheet.getRange("B2").setValue("Gabriel Arias").setFontWeight("bold").setFontColor("#f8fafc");

      sheet.getRange("C2").setValue("Mes / Periodo:").setFontWeight("bold").setFontColor("#94a3b8");
      sheet.getRange("D2").setValue("Septiembre 2026").setFontWeight("bold").setFontColor("#60a5fa");

      sheet.getRange("E2").setValue("Objetivo Financiero:").setFontWeight("bold").setFontColor("#94a3b8");
      sheet.getRange("F2:L2").merge();
      sheet.getRange("F2").setValue("Ahorrar para la moto, liquidar deudas y optimizar gastos").setFontColor("#cbd5e1");

      // Fila 5: Espaciador
      sheet.setRowHeight(5, 15);

      // Fila 6: Encabezados de Datos
      var headers = [
        "ID", "Tipo", "Concepto / Fuente", "Categoría", "Día", 
        "Monto ($)", "Meta Total ($)", "Ahorrado Actual ($)", 
        "Meses Estimados", "Cuota Quincenal ($)", "Periodo", "Fecha Registro"
      ];
      sheet.getRange(6, 1, 1, headers.length).setValues([headers]);
      var headerRange = sheet.getRange(6, 1, 1, headers.length);
      headerRange.setBackground("#1e293b").setFontColor("#fbbf24").setFontWeight("bold").setHorizontalAlignment("center");
      sheet.setRowHeight(6, 30);
      sheet.setFrozenRows(6);

      // Anchos de columna
      sheet.setColumnWidth(1, 110); // ID
      sheet.setColumnWidth(2, 100); // Tipo (INGRESO, GASTO, DEUDA, META)
      sheet.setColumnWidth(3, 220); // Concepto
      sheet.setColumnWidth(4, 150); // Categoría
      sheet.setColumnWidth(5, 70);  // Día
      sheet.setColumnWidth(6, 110); // Monto
      sheet.setColumnWidth(7, 120); // Meta Total
      sheet.setColumnWidth(8, 140); // Ahorrado Actual
      sheet.setColumnWidth(9, 120); // Meses
      sheet.setColumnWidth(10, 140); // Cuota Quincenal
      sheet.setColumnWidth(11, 130); // Periodo
      sheet.setColumnWidth(12, 140); // Fecha Registro

      // Datos de ejemplo iniciales bien estructurados
      var fechaHoy = new Date().toLocaleDateString();
      var datosIniciales = [
        ["ING-1", "INGRESO", "Sueldo Principal", "-", 15, 600, 0, 0, 0, 0, "Septiembre 2026", fechaHoy],
        ["ING-2", "INGRESO", "Proyectos Extra / Freelance", "-", 30, 250, 0, 0, 0, 0, "Septiembre 2026", fechaHoy],
        ["GAS-1", "GASTO", "Alquiler de Vivienda", "Vivienda", 5, 180, 0, 0, 0, 0, "Septiembre 2026", fechaHoy],
        ["GAS-2", "GASTO", "Compras de Supermercado", "Alimentación", 10, 120, 0, 0, 0, 0, "Septiembre 2026", fechaHoy],
        ["GAS-3", "GASTO", "Gasolina y Mantenimiento", "Moto", 12, 35, 0, 0, 0, 0, "Septiembre 2026", fechaHoy],
        ["GAS-4", "GASTO", "Internet y Luz", "Servicios", 18, 45, 0, 0, 0, 0, "Septiembre 2026", fechaHoy],
        ["DEU-1", "DEUDA", "Tarjeta de Crédito", "-", 20, 60, 0, 0, 0, 0, "Septiembre 2026", fechaHoy],
        ["MET-1", "META", "Teléfono", "-", 0, 0, 160, 10, 3, 25, "Septiembre 2026", fechaHoy]
      ];

      sheet.getRange(7, 1, datosIniciales.length, headers.length).setValues(datosIniciales);
    }

    return { success: true, sheetName: sheetName };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Función pública invocable desde la interfaz para asegurar y crear la hoja de finanzas.
 */
function crearHojaFinanzasManual() {
  return crearHojaFinanzas();
}

/**
 * Obtiene todos los datos financieros organizados: Generales, Ingresos, Gastos, Deudas y Metas.
 */
function getFinanzas(ssParam) {
  try {
    var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Finanzas");

    if (!sheet || sheet.getLastRow() < 6) {
      crearHojaFinanzas(ss);
      sheet = ss.getSheetByName("Finanzas");
    }

    if (!sheet) {
      return obtenerEstructuraFinanzasVacia();
    }

    // 1. Leer Datos Generales (Filas 2 a 4)
    var nombre = "Gabriel Arias";
    var mes = "Septiembre 2026";
    var objetivo = "Control financiero mensual y metas";

    try {
      var valNombre = String(sheet.getRange("B2").getValue() || "").trim();
      if (valNombre) nombre = valNombre;

      var valMes = String(sheet.getRange("D2").getValue() || "").trim();
      if (valMes) mes = valMes;

      var valObj = String(sheet.getRange("F2").getValue() || "").trim();
      if (valObj) objetivo = valObj;
    } catch (errGen) {}

    // 2. Leer Registros (Fila 7 en adelante)
    var lastRow = sheet.getLastRow();
    var ingresos = [];
    var gastos = [];
    var deudas = [];
    var metas = [];

    if (lastRow >= 7) {
      var data = sheet.getRange(7, 1, lastRow - 6, 12).getValues();

      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var id = String(row[0] || ("FIN-" + (i + 1))).trim();
        var tipo = String(row[1] || "").trim().toUpperCase();
        var concepto = String(row[2] || "").trim();
        var categoria = String(row[3] || "Otros").trim();
        var dia = Number(row[4]) || 1;
        var monto = Number(row[5]) || 0;
        var metaTotal = Number(row[6]) || 0;
        var ahorrado = Number(row[7]) || 0;
        var meses = Number(row[8]) || 1;
        var cuotaQuincenal = Number(row[9]) || 0;
        var periodo = String(row[10] || "").trim();
        var fechaReg = row[11] ? String(row[11]) : "";

        if (!concepto && !tipo) continue;

        if (tipo === "INGRESO") {
          ingresos.push({
            id: id,
            fuente: concepto,
            dia: dia,
            monto: monto,
            periodo: periodo,
            fecha: fechaReg
          });
        } else if (tipo === "GASTO") {
          ingosCategoriasValidas(categoria);
          gastos.push({
            id: id,
            fuente: concepto,
            categoria: categoria,
            dia: dia,
            monto: monto,
            periodo: periodo,
            fecha: fechaReg
          });
        } else if (tipo === "DEUDA") {
          deudas.push({
            id: id,
            deuda: concepto,
            dia: dia,
            monto: monto,
            periodo: periodo,
            fecha: fechaReg
          });
        } else if (tipo === "META") {
          var faltante = Math.max(0, metaTotal - ahorrado);
          var totalCuotas = Math.max(1, meses * 2);
          if (cuotaQuincenal <= 0 && faltante > 0) {
            cuotaQuincenal = Math.round((faltante / totalCuotas) * 100) / 100;
          }

          metas.push({
            id: id,
            nombre: concepto,
            metaTotal: metaTotal,
            ahorrado: ahorrado,
            faltante: faltante,
            meses: meses,
            cuotas: totalCuotas,
            cuotaQuincenal: cuotaQuincenal,
            periodo: periodo,
            fecha: fechaReg
          });
        }
      }
    }

    return {
      success: true,
      generales: {
        nombre: nombre,
        mes: mes,
        objetivo: objetivo
      },
      ingresos: ingresos,
      gastos: gastos,
      deudas: deudas,
      metas: metas
    };
  } catch (e) {
    return obtenerEstructuraFinanzasVacia(e.message);
  }
}

/**
 * Validador interno de categorías de gasto.
 */
function ingosCategoriasValidas(cat) {
  var validas = ["Vivienda", "Alimentación", "Moto", "Servicios", "Salud", "Entretenimiento", "Otros"];
  return validas.indexOf(cat) !== -1 ? cat : "Otros";
}

/**
 * Estructura de respaldo si ocurre algún fallo o la hoja está vacía.
 */
function obtenerEstructuraFinanzasVacia(errorMsg) {
  return {
    success: !errorMsg,
    error: errorMsg || null,
    generales: {
      nombre: "Gabriel Arias",
      mes: "Septiembre 2026",
      objetivo: "Ahorrar para la moto y liquidar deudas"
    },
    ingresos: [
      { id: "ING-1", fuente: "Sueldo Principal", dia: 15, monto: 600 }
    ],
    gastos: [
      { id: "GAS-1", fuente: "Alquiler", categoria: "Vivienda", dia: 5, monto: 180 },
      { id: "GAS-2", fuente: "Supermercado", categoria: "Alimentación", dia: 10, monto: 120 }
    ],
    deudas: [
      { id: "DEU-1", deuda: "Tarjeta de Crédito", dia: 20, monto: 60 }
    ],
    metas: [
      { id: "MET-1", nombre: "Teléfono", metaTotal: 160, ahorrado: 10, faltante: 150, meses: 3, cuotas: 6, cuotaQuincenal: 25 }
    ]
  };
}

/**
 * Actualiza los datos generales de cabecera (Nombre, Mes, Objetivo).
 */
function guardarDatosGeneralesFinanzas(nombre, mes, objetivo) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Finanzas");
    if (!sheet) {
      crearHojaFinanzas(ss);
      sheet = ss.getSheetByName("Finanzas");
    }

    if (nombre) sheet.getRange("B2").setValue(String(nombre).trim());
    if (mes) sheet.getRange("D2").setValue(String(mes).trim());
    if (objetivo) sheet.getRange("F2").setValue(String(objetivo).trim());

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Registra un nuevo Ingreso en la hoja de Finanzas.
 */
function agregarIngreso(fuente, dia, monto, mesPeriodo) {
  try {
    fuente = String(fuente || "").trim();
    dia = Number(dia) || 1;
    monto = Number(monto) || 0;
    if (!fuente) return { success: false, error: "El nombre de la entrada es requerido." };
    if (monto <= 0) return { success: false, error: "El monto debe ser mayor a cero." };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Finanzas");
    if (!sheet) {
      crearHojaFinanzas(ss);
      sheet = ss.getSheetByName("Finanzas");
    }

    var id = "ING-" + Date.now();
    var fechaStr = new Date().toLocaleDateString();
    var periodo = mesPeriodo || String(sheet.getRange("D2").getValue() || "Septiembre 2026");

    sheet.appendRow([
      id, "INGRESO", fuente, "-", dia, monto, 0, 0, 0, 0, periodo, fechaStr
    ]);

    return {
      success: true,
      registro: {
        id: id,
        fuente: fuente,
        dia: dia,
        monto: monto,
        periodo: periodo,
        fecha: fechaStr
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Registra un nuevo Gasto en la hoja de Finanzas.
 */
function agregarGasto(fuente, categoria, dia, monto, mesPeriodo) {
  try {
    fuente = String(fuente || "").trim();
    categoria = ingosCategoriasValidas(categoria);
    dia = Number(dia) || 1;
    monto = Number(monto) || 0;
    if (!fuente) return { success: false, error: "El nombre del gasto es requerido." };
    if (monto <= 0) return { success: false, error: "El monto debe ser mayor a cero." };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Finanzas");
    if (!sheet) {
      crearHojaFinanzas(ss);
      sheet = ss.getSheetByName("Finanzas");
    }

    var id = "GAS-" + Date.now();
    var fechaStr = new Date().toLocaleDateString();
    var periodo = mesPeriodo || String(sheet.getRange("D2").getValue() || "Septiembre 2026");

    sheet.appendRow([
      id, "GASTO", fuente, categoria, dia, monto, 0, 0, 0, 0, periodo, fechaStr
    ]);

    return {
      success: true,
      registro: {
        id: id,
        fuente: fuente,
        categoria: categoria,
        dia: dia,
        monto: monto,
        periodo: periodo,
        fecha: fechaStr
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Registra una nueva Deuda en la hoja de Finanzas.
 */
function agregarDeuda(deuda, dia, monto, mesPeriodo) {
  try {
    deuda = String(deuda || "").trim();
    dia = Number(dia) || 1;
    monto = Number(monto) || 0;
    if (!deuda) return { success: false, error: "El nombre de la deuda es requerido." };
    if (monto <= 0) return { success: false, error: "El monto debe ser mayor a cero." };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Finanzas");
    if (!sheet) {
      crearHojaFinanzas(ss);
      sheet = ss.getSheetByName("Finanzas");
    }

    var id = "DEU-" + Date.now();
    var fechaStr = new Date().toLocaleDateString();
    var periodo = mesPeriodo || String(sheet.getRange("D2").getValue() || "Septiembre 2026");

    sheet.appendRow([
      id, "DEUDA", deuda, "-", dia, monto, 0, 0, 0, 0, periodo, fechaStr
    ]);

    return {
      success: true,
      registro: {
        id: id,
        deuda: deuda,
        dia: dia,
        monto: monto,
        periodo: periodo,
        fecha: fechaStr
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Registra una nueva Meta Financiera con cuotas quincenales (quince y último).
 */
function agregarMeta(nombre, metaTotal, ahorradoActual, mesesEstimados, mesPeriodo) {
  try {
    nombre = String(nombre || "").trim();
    metaTotal = Number(metaTotal) || 0;
    ahorradoActual = Number(ahorradoActual) || 0;
    mesesEstimados = Number(mesesEstimados) || 1;

    if (!nombre) return { success: false, error: "El nombre de la meta es requerido." };
    if (metaTotal <= 0) return { success: false, error: "La meta debe tener un monto mayor a cero." };

    var faltante = Math.max(0, metaTotal - ahorradoActual);
    var cuotasQuincenales = Math.max(1, mesesEstimados * 2);
    var cuotaValor = Math.round((faltante / cuotasQuincenales) * 100) / 100;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Finanzas");
    if (!sheet) {
      crearHojaFinanzas(ss);
      sheet = ss.getSheetByName("Finanzas");
    }

    var id = "MET-" + Date.now();
    var fechaStr = new Date().toLocaleDateString();
    var periodo = mesPeriodo || String(sheet.getRange("D2").getValue() || "Septiembre 2026");

    sheet.appendRow([
      id, "META", nombre, "-", 0, 0, metaTotal, ahorradoActual, mesesEstimados, cuotaValor, periodo, fechaStr
    ]);

    return {
      success: true,
      registro: {
        id: id,
        nombre: nombre,
        metaTotal: metaTotal,
        ahorrado: ahorradoActual,
        faltante: faltante,
        meses: mesesEstimados,
        cuotas: cuotasQuincenales,
        cuotaQuincenal: cuotaValor,
        periodo: periodo,
        fecha: fechaStr
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Abona una cuota quincenal a una meta financiera (suma el valor de la cuota al monto ahorrado).
 */
function abonarCuotaMeta(id) {
  try {
    if (!id) return { success: false, error: "ID no proporcionado" };
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Finanzas");
    if (!sheet) return { success: false, error: "Hoja Finanzas no encontrada" };

    var data = sheet.getDataRange().getValues();
    for (var i = 6; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(id).trim()) {
        var rowNum = i + 1;
        var metaTotal = Number(data[i][6]) || 0;
        var ahorradoActual = Number(data[i][7]) || 0;
        var cuotaQuincenal = Number(data[i][9]) || 0;

        var nuevoAhorro = Math.min(metaTotal, Math.round((ahorradoActual + cuotaQuincenal) * 100) / 100);
        var nuevoFaltante = Math.max(0, Math.round((metaTotal - nuevoAhorro) * 100) / 100);

        // Actualizar columna 8 (Ahorrado Actual)
        sheet.getRange(rowNum, 8).setValue(nuevoAhorro);

        return {
          success: true,
          id: id,
          nuevoAhorro: nuevoAhorro,
          nuevoFaltante: nuevoFaltante,
          metaTotal: metaTotal
        };
      }
    }

    return { success: false, error: "Meta no encontrada con ID: " + id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Elimina cualquier registro financiero (ingreso, gasto, deuda, meta) por ID.
 */
function eliminarRegistroFinanzas(id) {
  try {
    if (!id) return { success: false, error: "ID no especificado" };
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Finanzas");
    if (!sheet) return { success: false, error: "Hoja Finanzas no encontrada" };

    var data = sheet.getDataRange().getValues();
    for (var i = 6; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(id).trim()) {
        sheet.deleteRow(i + 1);
        return { success: true, id: id };
      }
    }

    return { success: false, error: "Registro no encontrado para eliminar." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Retrocompatibilidad con código anterior que llamaba a registrarFinanza
function registrarFinanza(concepto, monto) {
  return agregarGasto(concepto, "Otros", 1, monto);
}

// --------------------------------------------------------------------------
// BANCO DE IDEAS MONARCA (CATEGORÍAS, SUBCATEGORÍAS, CASILLAS Y OPERATIVIDAD)
// --------------------------------------------------------------------------

/**
 * Crea o formatea la hoja "Banco de Ideas" con encabezados, estilos y validación de casillas de verificación.
 */
function crearHojaBancoDeIdeas(ssParam) {
  try {
    var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Banco de Ideas";
    var sheet = ss.getSheetByName(sheetName);
    var tz = ss.getSpreadsheetTimeZone() || "GMT-4";
    var ahora = new Date();

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      
      // Encabezados oficiales
      var headers = ["ID", "Fecha Registro", "Categoría", "Subcategoría", "Contexto", "Idea", "Hecha", "Fecha Hecha"];
      sheet.appendRow(headers);
      
      // Estilo de encabezados Solo Leveling / Sistema Monarca
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0f172a");
      headerRange.setFontColor("#fbbf24");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      headerRange.setVerticalAlignment("middle");
      sheet.setRowHeight(1, 35);
      sheet.setFrozenRows(1);

      // Anchos de columna optimizados
      sheet.setColumnWidth(1, 120); // ID
      sheet.setColumnWidth(2, 130); // Fecha Registro
      sheet.setColumnWidth(3, 190); // Categoría
      sheet.setColumnWidth(4, 250); // Subcategoría
      sheet.setColumnWidth(5, 110); // Contexto
      sheet.setColumnWidth(6, 380); // Idea
      sheet.setColumnWidth(7, 90);  // Hecha
      sheet.setColumnWidth(8, 140); // Fecha Hecha

      // Si existía la hoja antigua "Ideas", migrar los datos existentes
      var oldSheet = ss.getSheetByName("Ideas");
      if (oldSheet) {
        var oldData = oldSheet.getDataRange().getValues();
        for (var i = 1; i < oldData.length; i++) {
          var textoViejo = String(oldData[i][0] || "").trim();
          if (textoViejo) {
            var fechaVieja = oldData[i][1] ? String(oldData[i][1]) : Utilities.formatDate(ahora, tz, "dd/MM/yyyy");
            var fechaCorta = Utilities.formatDate(ahora, tz, "dd/MM");
            if (!/\d{1,2}\/\d{1,2}$/.test(textoViejo)) {
              textoViejo += " " + fechaCorta;
            }
            sheet.appendRow([
              "IDEA-MIG-" + i,
              fechaVieja,
              "💭 Ideas y Pensamientos",
              "🧠 Mis Pensamientos (Filosofía, Mentalidad y Enfoque)",
              "🏠 Casa",
              textoViejo,
              false,
              ""
            ]);
          }
        }
      }
    }

    // Configurar regla de Casilla de Verificación (Checkbox) en la Columna G ("Hecha")
    var maxRows = Math.max(sheet.getMaxRows(), 500);
    var checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    sheet.getRange(2, 7, maxRows - 1, 1).setDataValidation(checkboxRule);

    return { success: true, sheetName: sheetName };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Función pública invocable desde la interfaz o menú para inicializar la hoja "Banco de Ideas".
 */
function crearHojaBancoDeIdeasManual() {
  return crearHojaBancoDeIdeas();
}

/**
 * Obtiene todas las ideas del "Banco de Ideas".
 */
function getIdeas(ssParam) {
  try {
    var ss = ssParam || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Banco de Ideas");
    
    // Si no existe, crearla automáticamente
    if (!sheet) {
      crearHojaBancoDeIdeas(ss);
      sheet = ss.getSheetByName("Banco de Ideas");
    }
    
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var tz = ss.getSpreadsheetTimeZone() || "GMT-4";
    var ideas = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var id = String(row[0] || ("IDEA-" + i)).trim();
      var rawFecha = row[1];
      var fechaStr = "";
      var fechaCorta = "";
      var timestamp = 0;

      if (rawFecha instanceof Date) {
        fechaStr = Utilities.formatDate(rawFecha, tz, "dd/MM/yyyy HH:mm");
        fechaCorta = Utilities.formatDate(rawFecha, tz, "dd/MM");
        timestamp = rawFecha.getTime();
      } else if (rawFecha) {
        fechaStr = String(rawFecha);
        var matchFC = fechaStr.match(/\d{1,2}\/\d{1,2}/);
        fechaCorta = matchFC ? matchFC[0] : "";
        var parsed = Date.parse(fechaStr);
        timestamp = isNaN(parsed) ? (Date.now() - (data.length - i) * 60000) : parsed;
      } else {
        fechaStr = "";
        timestamp = Date.now() - (data.length - i) * 60000;
      }

      var categoria = String(row[2] || "💭 Ideas y Pensamientos").trim();
      var subcategoria = String(row[3] || "General").trim();
      var contexto = String(row[4] || "🏠 Casa").trim();
      var texto = String(row[5] || "").trim();
      var hecha = row[6] === true || String(row[6]).toLowerCase() === "true" || row[6] === 1;

      var rawFechaHecha = row[7];
      var fechaHechaStr = "";
      var timestampHecha = 0;
      if (rawFechaHecha instanceof Date) {
        fechaHechaStr = Utilities.formatDate(rawFechaHecha, tz, "dd/MM/yyyy HH:mm");
        timestampHecha = rawFechaHecha.getTime();
      } else if (rawFechaHecha) {
        fechaHechaStr = String(rawFechaHecha);
        var parsedH = Date.parse(fechaHechaStr);
        timestampHecha = isNaN(parsedH) ? 0 : parsedH;
      }

      if (texto) {
        ideas.push({
          id: id,
          rowIndex: i + 1,
          fecha: fechaStr,
          fechaCorta: fechaCorta,
          timestamp: timestamp,
          categoria: categoria,
          subcategoria: subcategoria,
          contexto: contexto,
          texto: texto,
          hecha: hecha,
          fechaHecha: fechaHechaStr,
          timestampHecha: timestampHecha
        });
      }
    }

    return ideas;
  } catch (e) {
    return [];
  }
}

/**
 * Registra una nueva idea en la hoja "Banco de Ideas".
 * Cumple con la regla operativa crucial: anexa la fecha (ej: 06/06) al final del texto.
 */
function registrarIdea(categoria, subcategoria, contexto, texto) {
  try {
    // Manejo flexible de parámetros (objeto o argumentos individuales)
    if (typeof categoria === 'object' && categoria !== null) {
      var obj = categoria;
      texto = obj.texto;
      subcategoria = obj.subcategoria;
      contexto = obj.contexto;
      categoria = obj.categoria;
    }

    // Retrocompatibilidad con llamadas antiguas que sólo pasaban texto
    if (!categoria && texto) {
      categoria = "💭 Ideas y Pensamientos";
      subcategoria = "🧠 Mis Pensamientos (Filosofía, Mentalidad y Enfoque)";
      contexto = "🏠 Casa";
    }

    texto = String(texto || "").trim();
    if (!texto) return { success: false, error: "El texto de la idea no puede estar vacío." };

    categoria = String(categoria || "💭 Ideas y Pensamientos").trim();
    subcategoria = String(subcategoria || "General").trim();
    contexto = String(contexto || "🏠 Casa").trim();

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Banco de Ideas");
    if (!sheet) {
      crearHojaBancoDeIdeas(ss);
      sheet = ss.getSheetByName("Banco de Ideas");
    }

    var ahora = new Date();
    var tz = ss.getSpreadsheetTimeZone() || "GMT-4";
    var fechaCorta = Utilities.formatDate(ahora, tz, "dd/MM");
    var fechaCompleta = Utilities.formatDate(ahora, tz, "dd/MM/yyyy HH:mm:ss");

    // REGLA CRUCIAL: Agregar la fecha (ej: 06/06) al final de la idea si aún no la tiene
    var textoFinal = texto;
    if (!/\d{1,2}\/\d{1,2}$/.test(textoFinal)) {
      textoFinal += " " + fechaCorta;
    }

    var id = "IDEA-" + ahora.getTime();

    // Nueva fila con casilla desmarcada (false)
    sheet.appendRow([
      id,
      fechaCompleta,
      categoria,
      subcategoria,
      contexto,
      textoFinal,
      false,
      ""
    ]);

    // Aplicar regla de casilla a la celda recién insertada
    var lastRow = sheet.getLastRow();
    var checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    sheet.getRange(lastRow, 7).setDataValidation(checkboxRule);

    return {
      success: true,
      idea: {
        id: id,
        rowIndex: lastRow,
        fecha: fechaCompleta,
        fechaCorta: fechaCorta,
        timestamp: ahora.getTime(),
        categoria: categoria,
        subcategoria: subcategoria,
        contexto: contexto,
        texto: textoFinal,
        hecha: false,
        fechaHecha: "",
        timestampHecha: 0
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Marca una idea como hecha o pendiente, actualizando la casilla en la hoja y la fecha de finalización.
 */
function marcarIdeaHecha(id, hecha) {
  try {
    if (!id) return { success: false, error: "ID no proporcionado" };
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Banco de Ideas");
    if (!sheet) return { success: false, error: "Hoja 'Banco de Ideas' no encontrada" };

    var data = sheet.getDataRange().getValues();
    var tz = ss.getSpreadsheetTimeZone() || "GMT-4";
    var ahora = new Date();
    var fechaHechaStr = hecha ? Utilities.formatDate(ahora, tz, "dd/MM/yyyy HH:mm:ss") : "";

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(id).trim()) {
        var rowNum = i + 1;
        // Columna 7: Hecha (booleano)
        sheet.getRange(rowNum, 7).setValue(!!hecha);
        // Columna 8: Fecha Hecha
        sheet.getRange(rowNum, 8).setValue(fechaHechaStr);

        return {
          success: true,
          id: id,
          hecha: !!hecha,
          fechaHecha: fechaHechaStr,
          timestampHecha: hecha ? ahora.getTime() : 0
        };
      }
    }

    return { success: false, error: "Idea con ID " + id + " no encontrada en la hoja." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}