// api/watermark.js
import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configure API to handle file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Adjust based on your expected file sizes
    },
  },
};

// Function to decrypt PDF using your existing decryption service
async function decryptPDF(pdfBuffer) {
  try {
    // Create form data for the file
    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: 'document.pdf',
      contentType: 'application/pdf',
    });

    // Call your existing decryption service
    const response = await fetch('https://aquamark-decrypt.onrender.com/decrypt', {
      method: 'POST',
      body: formData,
      // Remove the headers line that could cause issues
      // headers: formData.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Decryption failed with status: ${response.status}`);
    }

    // Return the decrypted buffer
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error('Error in PDF decryption:', error);
    throw error;
  }
}

// Helper function to authenticate API key
async function authenticateApiKey(apiKey) {
  try {
    // Check if API key exists and is active
    const { data, error } = await supabase
      .from('api_keys')
      .select('user_email, active')
      .eq('key', apiKey)
      .single();
    
    if (error || !data || !data.active) {
      return null;
    }
    
    // Update last_used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('key', apiKey);
    
    return data.user_email;
  } catch (err) {
    console.error('Authentication error:', err);
    return null;
  }
}

// Main handler function
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    const apiKey = authHeader.split(' ')[1];
    
    // Authenticate API key
    const userEmail = await authenticateApiKey(apiKey);
    if (!userEmail) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Check if request includes a PDF file
    if (!req.body || !req.body.pdf) {
      return res.status(400).json({ error: 'PDF file required in base64 format' });
    }
    
    // Get PDF data from request (base64 encoded)
    const pdfBase64 = req.body.pdf;
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // Try to load the PDF document - first try normal loading
    let pdfDoc;
    let pdfBytes = pdfBuffer;
    
    try {
      // Try loading normally first
      pdfDoc = await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: false
      });
    } catch (err) {
      console.log("PDF appears to be encrypted, attempting to decrypt");
      
      // Fallback to decryption service
      try {
        pdfBytes = await decryptPDF(pdfBuffer);
        pdfDoc = await PDFDocument.load(pdfBytes, {
          ignoreEncryption: true
        });
      } catch (decryptErr) {
        console.error("Decryption error:", decryptErr);
        return res.status(400).json({ error: "Could not process PDF. It may be corrupted or password-protected." });
      }
    }
    
    // Get page count
    const pages = pdfDoc.getPages();
    const pageCount = pages.length;
    
    // Check user's usage limits
    const { data: usageData, error: usageError } = await supabase
      .from('usage')
      .select('*')
      .eq('user_email', userEmail)
      .single();
      
    if (usageError || !usageData) {
      return res.status(400).json({ error: 'Usage data not found' });
    }
    
    // Verify user has enough credits
    if (usageData.pages_remaining < pageCount) {
      return res.status(403).json({ 
        error: 'Not enough page credits', 
        pages_needed: pageCount,
        pages_remaining: usageData.pages_remaining
      });
    }
    
    // Get user's logo from Supabase storage
    const { data: logosList, error: logosError } = await supabase.storage
      .from('logos')
      .list(userEmail);
      
    if (logosError || !logosList || logosList.length === 0) {
      return res.status(400).json({ error: 'No logo found for this account' });
    }
    
    // Find the latest logo
    const logoFiles = logosList.filter(file => file.name.startsWith('logo-'));
    if (logoFiles.length === 0) {
      return res.status(400).json({ error: 'No logo found for this account' });
    }
    
    // Sort by timestamp in filename
    logoFiles.sort((a, b) => {
      const timestampA = parseInt(a.name.split('-')[1]) || 0;
      const timestampB = parseInt(b.name.split('-')[1]) || 0;
      return timestampB - timestampA;
    });
    
    // Get the logo file
    const latestLogo = logoFiles[0];
    const logoPath = `${userEmail}/${latestLogo.name}`;
    const { data: logoData, error: logoError } = await supabase.storage
      .from('logos')
      .download(logoPath);
      
    if (logoError || !logoData) {
      return res.status(500).json({ error: 'Failed to download logo' });
    }
    
    // Embed logo in PDF
    let embeddedLogo;
    try {
      embeddedLogo = await pdfDoc.embedPng(logoData);
    } catch (pngError) {
      try {
        embeddedLogo = await pdfDoc.embedJpg(logoData);
      } catch (jpgError) {
        return res.status(400).json({ error: 'Logo format not supported' });
      }
    }
    
    const logoDims = embeddedLogo.scale(0.35);
    
    // Add watermark to each page
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Add repeating logo watermark - using your existing pattern
      for (let x = 0; x < width; x += (logoDims.width + 100)) {
        for (let y = 0; y < height; y += (logoDims.height + 100)) {
          page.drawImage(embeddedLogo, {
            x,
            y,
            width: logoDims.width,
            height: logoDims.height,
            opacity: 0.15,
            rotate: { degrees: 45 }
          });
        }
      }
    }
    
    // Apply targeted PDF optimization for smaller file size
    const pdfOpts = {
      useObjectStreams: true,
      compressContentStreams: true,
      preservePDFFormFields: true
    };
    
    // Save the watermarked PDF
    const watermarkedPdfBytes = await pdfDoc.save(pdfOpts);
    
    // Update usage statistics
    const updatedPagesUsed = usageData.pages_used + pageCount;
    const updatedPagesRemaining = usageData.pages_remaining - pageCount;
    
    const { error: updateError } = await supabase
      .from('usage')
      .update({
        pages_used: updatedPagesUsed,
        pages_remaining: updatedPagesRemaining
      })
      .eq('user_email', userEmail);
      
    if (updateError) {
      console.error('Failed to update usage:', updateError);
      // Continue anyway, as the PDF is already processed
    }
    
    // Return the watermarked PDF (base64 encoded)
    res.status(200).json({
      watermarked_pdf: Buffer.from(watermarkedPdfBytes).toString('base64'),
      pages_processed: pageCount,
      pages_remaining: updatedPagesRemaining
    });
    
  } catch (error) {
    console.error('Error processing watermark:', error);
    res.status(500).json({ error: 'Error processing watermark request' });
  }
}
