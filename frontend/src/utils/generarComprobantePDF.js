const COBRE = [201, 124, 70];
const TINTA = [42, 27, 16];
const GRIS = [107, 92, 77];
const BORDE = [231, 224, 211];

function cargarImagenComoBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Genera el comprobante de una venta como PDF tamaño carta (215.9 x 279.4 mm)
// y dispara la descarga directa en el navegador.
export async function generarComprobantePDF(venta) {
  // jsPDF pesa bastante — se importa recién acá, solo cuando de verdad se
  // va a generar un comprobante, en vez de cargarse siempre con toda la app.
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const items = venta.detalle || [];
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const margen = 18;
  const anchoUtil = 215.9 - margen * 2;
  const finDerecha = 215.9 - margen;

  // ---------- Encabezado: logo + datos de la empresa ----------
  let y = margen;
  try {
    const logoBase64 = await cargarImagenComoBase64('/logo-glorita.png');
    doc.addImage(logoBase64, 'PNG', margen, y, 26, 26);
  } catch (e) {
    // si el logo no carga, seguimos sin bloquear la descarga
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...TINTA);
  doc.text('Exclusivos Glorita', margen + 32, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text('San Lucas Tolimán, Sololá, Guatemala', margen + 32, y + 16);
  doc.text('Marroquinería artesanal en cuero', margen + 32, y + 22);

  // Título "COMPROBANTE" alineado a la derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...COBRE);
  doc.text('COMPROBANTE DE VENTA', finDerecha, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text(`No. ${venta.NumeroVenta}`, finDerecha, y + 16, { align: 'right' });

  y += 34;
  doc.setDrawColor(...COBRE);
  doc.setLineWidth(0.8);
  doc.line(margen, y, finDerecha, y);
  y += 10;

  // ---------- Datos de la venta (dos columnas) ----------
  doc.setFontSize(10.5);
  doc.setTextColor(...TINTA);

  const col2X = margen + anchoUtil / 2;
  doc.setFont('helvetica', 'bold'); doc.text('Cliente:', margen, y);
  doc.setFont('helvetica', 'normal'); doc.text(venta.ClienteNombre || '', margen + 22, y);

  doc.setFont('helvetica', 'bold'); doc.text('Fecha:', col2X, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(venta.FechaVenta).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }), col2X + 18, y);
  y += 7;

  doc.setFont('helvetica', 'bold'); doc.text('Atendido por:', margen, y);
  doc.setFont('helvetica', 'normal'); doc.text(venta.VendedorNombre || '', margen + 28, y);

  doc.setFont('helvetica', 'bold'); doc.text('Estado:', col2X, y);
  doc.setFont('helvetica', 'normal');
  doc.text(venta.Estado === 'ANULADA' ? 'Anulada' : 'Completada', col2X + 18, y);
  y += 12;

  // ---------- Tabla de productos ----------
  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    styles: { fontSize: 10, cellPadding: 3.2, lineColor: BORDE, lineWidth: 0.2 },
    headStyles: { fillColor: COBRE, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 242, 234] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 32, halign: 'right' },
    },
    head: [['Producto', 'Cantidad', 'Precio unitario', 'Subtotal']],
    body: items.map((d) => [
      d.ProductoTalla ? `${d.ProductoNombre} (Talla ${d.ProductoTalla})` : d.ProductoNombre,
      String(d.Cantidad),
      `Q ${Number(d.PrecioUnitario).toFixed(2)}`,
      `Q ${Number(d.Subtotal).toFixed(2)}`,
    ]),
  });

  let finalY = doc.lastAutoTable.finalY + 10;

  // ---------- Total ----------
  doc.setDrawColor(...BORDE);
  doc.line(finDerecha - 70, finalY - 5, finDerecha, finalY - 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...TINTA);
  doc.text('Total', finDerecha - 70, finalY + 3);
  doc.setTextColor(...COBRE);
  doc.setFontSize(15);
  doc.text(`Q ${Number(venta.Total).toFixed(2)}`, finDerecha, finalY + 3, { align: 'right' });
  finalY += 16;

  if (venta.Estado === 'ANULADA') {
    doc.setDrawColor(...TINTA);
    doc.setLineWidth(0.6);
    doc.rect(margen, finalY - 6, anchoUtil, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TINTA);
    doc.text('*** ESTE COMPROBANTE CORRESPONDE A UNA VENTA ANULADA ***', 215.9 / 2, finalY, { align: 'center' });
    finalY += 16;
  }

  // ---------- Pie de página ----------
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text('¡Gracias por su compra! Hecho a mano con cuero genuino.', 215.9 / 2, finalY, { align: 'center' });

  doc.setDrawColor(...BORDE);
  doc.setLineWidth(0.3);
  doc.line(margen, 279.4 - 18, finDerecha, 279.4 - 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Exclusivos Glorita — San Lucas Tolimán, Sololá', 215.9 / 2, 279.4 - 13, { align: 'center' });

  doc.save(`comprobante_${venta.NumeroVenta}.pdf`);
}
