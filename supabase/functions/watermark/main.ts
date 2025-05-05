// Supabase Edge Function: watermark PDF with stored logo + hologram
// Location: supabase/functions/watermark/main.ts
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';
const SUPABASE_URL = Deno.env.get('https://dvzmnikrvkvgragzhrof.supabase.co');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2em1uaWtydmt2Z3JhZ3pocm9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk2ODk3NSwiZXhwIjoyMDU5NTQ0OTc1fQ.bFC6pFK5i2O3YKI74AV0DnKf41qY1ZLZS-yBq9DKHkM');
const BUCKET = 'logos';
const HOLOGRAM_URL = 'https://aquamark.io/hologram.png';
const API_KEY = Deno.env.get('AQUAMARK_API_KEY');
serve(async (req)=>{
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const auth = req.headers.get('authorization');
    if (!auth || auth !== `Bearer ${API_KEY}`) {
      return new Response('Unauthorized', {
        status: 401
      });
    }
    if (!email) {
      return new Response('Missing email parameter', {
        status: 400
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    // Check usage table for Enterprise access
    const { data: usageData, error: usageError } = await supabase.from('usage').select('*').eq('user_email', email).single();
    if (usageError || !usageData || usageData.plan_name !== 'Enterprise') {
      return new Response('Access restricted to Enterprise users only', {
        status: 403
      });
    }
    // Parse multipart form
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || file.type !== 'application/pdf') {
      return new Response('Invalid or missing PDF file', {
        status: 400
      });
    }
    const pdfBytes = new Uint8Array(await file.arrayBuffer());
    // Try loading PDF, fallback to decryption
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(pdfBytes);
    } catch (err) {
      const decryptRes = await fetch('https://aquamark-decrypt.onrender.com/decrypt', {
        method: 'POST',
        body: file
      });
      if (!decryptRes.ok) return new Response('Decryption failed', {
        status: 400
      });
      const decryptedBytes = new Uint8Array(await decryptRes.arrayBuffer());
      pdfDoc = await PDFDocument.load(decryptedBytes);
    }
    // Fetch user's most recent logo from Supabase
    const { data: list, error: listErr } = await supabase.storage.from(BUCKET).list(email, {
      limit: 1,
      sortBy: {
        column: 'created_at',
        order: 'desc'
      }
    });
    if (listErr || !list.length) return new Response('No logo found for user', {
      status: 400
    });
    const logoPath = `${email}/${list[0].name}`;
    const { data: logoRes } = await supabase.storage.from(BUCKET).download(logoPath);
    if (!logoRes) return new Response('Error fetching logo file', {
      status: 500
    });
    const logoBytes = new Uint8Array(await logoRes.arrayBuffer());
    const logoImg = await pdfDoc.embedPng(logoBytes);
    const logoDims = logoImg.scale(0.2);
    const holoRes = await fetch(HOLOGRAM_URL);
    const holoBytes = new Uint8Array(await holoRes.arrayBuffer());
    const holoImg = await pdfDoc.embedPng(holoBytes);
    const holoDims = holoImg.scale(0.15);
    const pages = pdfDoc.getPages();
    for (const page of pages){
      const { width, height } = page.getSize();
      // Tile watermark across the page
      const xGap = logoDims.width + 50;
      const yGap = logoDims.height + 50;
      for(let x = -logoDims.width; x < width; x += xGap){
        for(let y = -logoDims.height; y < height; y += yGap){
          page.drawImage(logoImg, {
            x,
            y,
            width: logoDims.width,
            height: logoDims.height,
            rotate: {
              type: 'degrees',
              angle: 45
            },
            opacity: 0.2
          });
        }
      }
      // Add hologram (top-right)
      page.drawImage(holoImg, {
        x: width - holoDims.width - 10,
        y: height - holoDims.height - 10,
        width: holoDims.width,
        height: holoDims.height,
        opacity: 0.8
      });
    }
    const finalPdf = await pdfDoc.save();
    const pageCount = pages.length;
    // Track usage
    await supabase.from('usage').upsert({
      user_email: email,
      pages_used: usageData.pages_used + pageCount
    }, {
      onConflict: [
        'user_email'
      ]
    });
    // Return final PDF
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${file.name.replace('.pdf', ' - protected.pdf')}"`);
    return new Response(finalPdf, {
      status: 200,
      headers
    });
  } catch (err) {
    console.error('Function error:', err);
    return new Response('Internal error', {
      status: 500
    });
  }
});
