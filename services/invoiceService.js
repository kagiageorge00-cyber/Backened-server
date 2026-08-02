const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const generateInvoicePdf = async ({ bookingId, type = 'flight', customer = {}, items = [], total = 0, currency = 'USD' }) => {
  const outDir = path.join(__dirname, '..', 'tmp', 'invoices');
  ensureDir(outDir);
  const filename = `${type}_${bookingId}_${Date.now()}.pdf`;
  const outPath = path.join(outDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(outPath);
      doc.pipe(stream);

      doc.fontSize(20).text('Bliss Connect', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice for ${customer.name || customer.email || 'Customer'}`);
      doc.text(`Booking: ${bookingId}`);
      doc.text(`Type: ${type}`);
      doc.moveDown();

      doc.fontSize(14).text('Items');
      items.forEach((it, idx) => {
        doc.fontSize(11).text(`${idx + 1}. ${it.description || it.name || 'Item'} - ${it.amount ?? it.price ?? ''} ${currency}`);
      });

      doc.moveDown();
      doc.fontSize(14).text(`Total: ${total} ${currency}`);

      doc.moveDown(2);
      doc.fontSize(10).text('Thank you for booking with Bliss Connect.', { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve({ path: outPath, filename }));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePdf };
