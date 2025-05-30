import Tesseract from 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/tesseract.min.js';
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.mjs';

export async function extractBusinessDataFromPDF(pdfBytes, supabase) {
  try {
    // Load the PDF
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    // Set up canvas to render page
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    // Get image data for OCR
    const dataUrl = canvas.toDataURL();

    // Run Tesseract OCR
    const result = await Tesseract.recognize(dataUrl, 'eng', {
      logger: m => console.log(m)
    });

    const text = result.data.text;
    console.log("📄 OCR Text:", text);

    // Extract business name and address from OCR text
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
    const business_name = lines[0] || '';
    const addressLine = lines.find(line =>
      /\d{2,6}[\s\w,.-]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr)/i.test(line)
    );
    const business_address = addressLine || '';

    // Insert into Supabase
    await supabase.from('datalake').insert([{ business_name, business_address }]);
    console.log("✅ Inserted to datalake:", business_name, business_address);
  } catch (err) {
    console.error("❌ OCR failed:", err);
  }
}
