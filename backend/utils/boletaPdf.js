const PDFDocument = require('pdfkit');

function money(n){ return new Intl.NumberFormat('es-PE',{ minimumFractionDigits:2 }).format(n); }

module.exports = function boletaPDF(res, venta, negocio = {
  nombre: process.env.NEGOCIO_NOMBRE || 'Bodega',
  ruc: process.env.NEGOCIO_RUC || '00000000000',
  direccion: process.env.NEGOCIO_DIR || 'Dirección',
  telefono: process.env.NEGOCIO_TEL || ''
}) {
  const doc = new PDFDocument({ size: 'A6', margin: 18 }); // tamaño ticket
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=boleta_${venta.serie}-${venta.numero}.pdf`);
  doc.pipe(res);

  doc.fontSize(10).text(negocio.nombre, { align: 'center' });
  doc.text(`RUC: ${negocio.ruc}`, { align: 'center' });
  doc.text(negocio.direccion, { align: 'center' });
  if (negocio.telefono) doc.text(`Tel: ${negocio.telefono}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(11).text(`BOLETA ${venta.serie}-${venta.numero}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(9).text(`Fecha: ${new Date(venta.createdAt).toLocaleString('es-PE')}`);
  doc.text(`Cliente: ${venta.cliente?.nombre || 'CLIENTE VARIOS'}`);
  doc.moveDown(0.5);

  doc.text('Cant  Descripción                Importe');
  doc.moveTo(doc.x, doc.y).lineTo(300, doc.y).stroke();

  venta.items.forEach(it => {
    doc.text(`${it.cantidad}   ${String(it.nombre || '').slice(0, 18)}`);
    doc.text(`          x S/ ${money(it.precioUnitarioSinIGV)} = S/ ${money(it.totalSinIGV)}`, { align: 'right' });
  });

  doc.moveDown(0.3);
  doc.moveTo(doc.x, doc.y).lineTo(300, doc.y).stroke();
  doc.text(`Op. Gravada: S/ ${money(venta.opGravada)}`, { align: 'right' });
  doc.text(`IGV (18%):  S/ ${money(venta.igv)}`, { align: 'right' });
  doc.text(`TOTAL:      S/ ${money(venta.total)}`, { align: 'right' });

  if (venta.pago?.recibido) {
    doc.moveDown(0.3);
    doc.text(`Pago: ${venta.pago.medio} S/ ${money(venta.pago.recibido)}`, { align: 'right' });
    doc.text(`Vuelto: S/ ${money(venta.pago.vuelto)}`, { align: 'right' });
  }

  doc.moveDown(0.5).fontSize(8).text('¡Gracias por su compra!', { align: 'center' });
  doc.end();
};
