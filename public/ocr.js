import { PDFDocument } from 'pdf-lib';
import Tesseract from 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/tesseract.min.js';

export async function extractBusinessDataFromPDF(pdfBytes, supabase) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // ⚠️ pdf-lib does not support renderToCanvas → fallback needed
    // For now, just insert a placeholder warning
    console.warn("🚧 renderToCanvas not supported in pdf-lib. You'll need pdfjs-dist for rendering to canvas.");
    return;

    // Uncomment below if switched to pdfjs-dist:
    // const dataUrl = canvas.toDataURL();

    // // OCR
    // const result = await Tesseract.recognize(dataUrl, 'eng', {
    //   logger: m => console.log(m)
    // });
    // const text = result.data.text;

    // // Parse name + address
    // const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
    // const business_name = lines[0] || '';
    // const addressLine = lines.find(line =>
    //   /\d{2,6}[\s\w,.-]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr)/i.test(line)
    // );
    // const business_address = addressLine || '';

    // // Insert to Supabase
    // await supabase.from('datalake').insert([{ business_name, business_address }]);
    // console.log("✅ Datalake insert complete:", business_name, business_address);
  } catch (err) {
    console.error("❌ OCR extraction failed:", err);
  }
}
