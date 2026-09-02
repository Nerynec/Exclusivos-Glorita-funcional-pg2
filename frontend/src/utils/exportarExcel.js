const COLOR_ENCABEZADO = 'FFC97C46'; // cobre — color principal de marca
const COLOR_FRANJA = 'FFF7F2EA';     // franja alterna, crema muy suave
const COLOR_BORDE = 'FFE7E0D3';
const COLOR_TEXTO_SUAVE = 'FF6B5C4D';

function bordeCompleto() {
  return {
    top: { style: 'thin', color: { argb: COLOR_BORDE } },
    left: { style: 'thin', color: { argb: COLOR_BORDE } },
    bottom: { style: 'thin', color: { argb: COLOR_BORDE } },
    right: { style: 'thin', color: { argb: COLOR_BORDE } },
  };
}

async function obtenerLogoBuffer() {
  try {
    const res = await fetch('/logo-glorita.png');
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch (e) {
    return null;
  }
}

/**
 * Exporta datos a un archivo .xlsx con estilo de marca.
 * columnas: [{ titulo, valor(fila), formato: 'moneda' | 'entero' | 'texto' }]
 * opciones: { nombreHoja, titulo }
 */
export async function exportarExcel(nombreArchivo, columnas, filas, opciones = {}) {
  // ExcelJS pesa bastante — se importa recién acá, solo cuando de verdad
  // se va a generar un archivo, en vez de cargarse siempre con toda la app.
  const ExcelJS = (await import('exceljs')).default;

  const { nombreHoja = 'Datos', titulo } = opciones;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Exclusivos Glorita';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet(nombreHoja, {
    views: [{ state: 'frozen', ySplit: titulo ? 4 : 1 }],
  });

  let filaActual = 1;

  if (titulo) {
    hoja.mergeCells(1, 1, 1, columnas.length);
    const celdaTitulo = hoja.getCell(1, 1);
    celdaTitulo.value = `Exclusivos Glorita — ${titulo}`;
    celdaTitulo.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    celdaTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } };
    celdaTitulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    hoja.getRow(1).height = 28;

    hoja.mergeCells(2, 1, 2, columnas.length);
    const celdaSub = hoja.getCell(2, 1);
    celdaSub.value = `Generado el ${new Date().toLocaleDateString('es-GT', { dateStyle: 'long' })}`;
    celdaSub.font = { italic: true, size: 9.5, color: { argb: COLOR_TEXTO_SUAVE } };
    celdaSub.alignment = { indent: 1 };
    hoja.getRow(2).height = 18;

    filaActual = 4;
  }

  // Fila de encabezados de columna
  const filaEncabezado = hoja.getRow(filaActual);
  columnas.forEach((c, idx) => {
    const celda = filaEncabezado.getCell(idx + 1);
    celda.value = c.titulo;
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } };
    celda.alignment = { vertical: 'middle', horizontal: c.formato === 'texto' || !c.formato ? 'left' : 'right' };
    celda.border = bordeCompleto();
  });
  filaEncabezado.height = 20;
  filaActual += 1;

  // Filas de datos
  filas.forEach((fila, filaIdx) => {
    const filaExcel = hoja.getRow(filaActual);
    columnas.forEach((c, colIdx) => {
      const celda = filaExcel.getCell(colIdx + 1);
      celda.value = c.valor(fila);
      celda.border = bordeCompleto();
      celda.alignment = { vertical: 'middle', horizontal: c.formato === 'texto' || !c.formato ? 'left' : 'right' };
      if (c.formato === 'moneda') celda.numFmt = '"Q"#,##0.00';
      if (c.formato === 'entero') celda.numFmt = '#,##0';
      if (filaIdx % 2 === 1) {
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_FRANJA } };
      }
    });
    filaActual += 1;
  });

  // Fila de totales para las columnas numéricas (si aplica)
  const tieneNumericas = columnas.some((c) => c.formato === 'moneda' || c.formato === 'entero');
  if (tieneNumericas && filas.length > 0) {
    const filaTotal = hoja.getRow(filaActual);
    columnas.forEach((c, idx) => {
      const celda = filaTotal.getCell(idx + 1);
      celda.border = bordeCompleto();
      celda.font = { bold: true };
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFE6DA' } };
      if (idx === 0) {
        celda.value = 'Total';
        celda.alignment = { horizontal: 'left' };
      } else if (c.formato === 'moneda' || c.formato === 'entero') {
        const suma = filas.reduce((acc, fila) => acc + (Number(c.valor(fila)) || 0), 0);
        celda.value = suma;
        celda.numFmt = c.formato === 'moneda' ? '"Q"#,##0.00' : '#,##0';
        celda.alignment = { horizontal: 'right' };
      }
    });
  }

  // Anchos de columna automáticos según el contenido
  columnas.forEach((c, idx) => {
    const maxContenido = filas.reduce((max, fila) => {
      const valor = String(c.valor(fila) ?? '');
      return Math.max(max, valor.length);
    }, c.titulo.length);
    hoja.getColumn(idx + 1).width = Math.min(Math.max(maxContenido + 3, 12), 42);
  });

  // Logo de la empresa en la esquina superior derecha (si está disponible)
  const logoBuffer = await obtenerLogoBuffer();
  if (logoBuffer && titulo) {
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
    hoja.addImage(imageId, {
      tl: { col: columnas.length + 0.3, row: 0.05 },
      ext: { width: 46, height: 46 },
    });
    hoja.getColumn(columnas.length + 1).width = 8;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo.endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
