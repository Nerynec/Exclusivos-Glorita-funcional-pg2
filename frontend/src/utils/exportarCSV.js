// Convierte un arreglo de objetos a CSV y dispara la descarga en el navegador.
// CSV se eligió porque Excel lo abre nativamente sin necesitar librerías extra.
export function exportarCSV(nombreArchivo, columnas, filas) {
  const escapar = (valor) => {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    if (texto.includes(',') || texto.includes('"') || texto.includes('\n')) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  };

  const encabezado = columnas.map((c) => escapar(c.titulo)).join(',');
  const lineas = filas.map((fila) => columnas.map((c) => escapar(c.valor(fila))).join(','));
  const contenido = '\uFEFF' + [encabezado, ...lineas].join('\r\n'); // BOM para acentos en Excel

  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
