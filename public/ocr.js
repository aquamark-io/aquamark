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

    // Render first page to canvas with lower scale for faster processing
    const viewport = page.getViewport({ scale: 1.0 }); // Reduced from 1.5 to 1.0
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    const dataUrl = canvas.toDataURL();

    // Run OCR with optimized settings for business documents
    const result = await Tesseract.recognize(dataUrl, 'eng', {
      logger: m => console.log(m),
      tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT, // Better for business documents
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,&-#' // Common business chars
    });

    const text = result.data.text;
    console.log("📄 OCR Text:", text);

    // Extract fields with improved logic for Chase business documents
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    
    console.log("📄 All extracted lines:", lines); // Debug: see all lines
    
    // Find business name - look for "LLC", "INC", "CORP" or substantial company names
    let business_name = '';
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      // Look for company suffixes or substantial business names
      if (line.match(/(LLC|INC|CORP|COMPANY|CONSULTING|SERVICES|GROUP|PARTNERS)/i) ||
          (line.length > 10 && line.match(/^[A-Z\s&.-]+$/) && !line.match(/CHASE|BANK|CUSTOMER|SERVICE|INFORMATION|ACCOUNT/i))) {
        business_name = line;
        break;
      }
    }
    
    // Find address - look for lines with street patterns, especially after the business name
    let business_address = '';
    const businessNameIndex = lines.findIndex(line => line.includes(business_name));
    const searchStart = businessNameIndex > -1 ? businessNameIndex + 1 : 0;
    
    for (let i = searchStart; i < Math.min(searchStart + 5, lines.length); i++) {
      const line = lines[i];
      // Look for address patterns: number + street name, or CT/COURT/ST/STREET etc.
      if (line.match(/\d+[\s\w]+(CT|COURT|ST|STREET|AVE|AVENUE|RD|ROAD|BLVD|BOULEVARD|DR|DRIVE|LN|LANE|WAY|CIRCLE|CIR|PLACE|PL)/i) ||
          line.match(/\d+\s+[A-Z][a-zA-Z\s,.-]+[A-Z]{2}\s+\d{5}/i) || // Address with state and zip
          line.match(/^[A-Z\s,.-]+CA\s+\d{5}/i)) { // California address pattern
        business_address = line;
        break;
      }
    }

    console.log("🏢 Extracted Business Name:", business_name);
    console.log("📍 Extracted Address:", business_address);

    await supabase.from('datalake').insert([{ business_name, business_address }]);
    console.log("✅ Datalake insert:", business_name, business_address);
  } catch (err) {
    console.error("❌ OCR error:", err);
  }
}
