// Load PDF.js dynamically to avoid build issues
let pdfjsLib;
async function loadPDFJS() {
  if (!pdfjsLib) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(script);
    
    await new Promise((resolve, reject) => {
      script.onload = () => {
        pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
      script.onerror = reject;
    });
  }
  return pdfjsLib;
}

// Load Tesseract dynamically
let Tesseract;
async function loadTesseract() {
  if (!Tesseract) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    document.head.appendChild(script);
    
    await new Promise((resolve, reject) => {
      script.onload = () => {
        Tesseract = window.Tesseract;
        resolve();
      };
      script.onerror = reject;
    });
  }
  return Tesseract;
}

export async function extractBusinessDataFromPDF(pdfBytes, supabase) {
  try {
    // Load both libraries
    await Promise.all([loadPDFJS(), loadTesseract()]);
    
    // Load the PDF
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    // Render first page to canvas
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    const dataUrl = canvas.toDataURL();

    // Run OCR
    const result = await Tesseract.recognize(dataUrl, 'eng', {
      logger: m => console.log(m)
    });

    const text = result.data.text;
    console.log("📄 OCR Text:", text);

    // Extract fields
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
    const business_name = lines[0] || '';
    const addressLine = lines.find(line =>
      /\d{2,6}[\s\w,.-]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr)/i.test(line)
    );
    const business_address = addressLine || '';

    await supabase.from('datalake').insert([{ business_name, business_address }]);
    console.log("✅ Datalake insert:", business_name, business_address);
  } catch (err) {
    console.error("❌ OCR error:", err);
  }
}
