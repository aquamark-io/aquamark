// Supabase Edge Function: watermark PDF with stored logo + hologram
// supabase/functions/watermark/main.ts

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, degrees } from 'https://esm.sh/pdf-lib@1.17.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const API_KEY = Deno.env.get('AQUAMARK_API_KEY');
const BUCKET = 'logos';
const HOLOGRAM_URL = 'https://aquamark.io/hologram.png';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const auth = req.headers.get('authorization');
    if (!auth || auth !== `Bearer ${API_KEY}`) {
      return new Response('Unauthorized', { status: 401 });
    }
    if (!email) {
      return new Response('Missing email parameter', { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check usage and plan
    const { data: usageData, error: usageError } = await supabase
      .from('usage')
      .select('*')
      .eq('user_email', email)
      .maybeSingle();

    if (usageError || !usageData || usageData.plan_name !== 'Enterprise') {
      return new Response('Access restricted to Enterprise users only', { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || file.type !== 'application/pdf') {
      return new Response('Invalid or missing PDF file', { status: 400 });
    }

    let pdfBytes = new Uint8Array(await file.arrayBuffer());
    let pdfDoc;

    try {
      pdfDoc = await PDFDocument.load(pdfBytes);
    } catch (err) {
      const decryptRes = await fetch('https://aquamark-decrypt.onrender.com/decrypt', {
        method: 'POST',
        body: file,
      });
      if (!decryptRes.ok) return new Response('Decryption failed', { status: 400 });
      const decryptedBytes = new Uint8Array(await decryptRes.arrayBuffer());
      pdfDoc = await PDFDocument.load(decryptedBytes);
    }

    const pageCount = pdfDoc.getPages().length;
    const remaining = usageData.page_credits - usageData.pages_used;
    if (remaining < pageCount) {
      return new Response('Not enough page credits', { status: 402 });
    }

    // Fetch latest logo
    const { data: list, error: listErr } = await supabase.storage.from(BUCKET).list(email, {
      limit: 1,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (listErr || !list.length) return new Response('No logo found for user', { status: 400 });

    const logoPath = `${email}/${list[0].name}`;
    const { data: logoRes } = await supabase.storage.from(BUCKET).download(logoPath);
    if (!logoRes) return new Response('Error fetching logo file', { status: 500 });

    const logoBytes = new Uint8Array(await logoRes.arrayBuffer());
    const logoImg = await pdfDoc.embedPng(logoBytes);
    const logoDims = logoImg.scale(0.2);

    // Hologram
    const holoRes = await fetch(HOLOGRAM_URL);
    const holoBytes = new Uint8Array(await holoRes.arrayBuffer());
    const holoImg = await pdfDoc.embedPng(holoBytes);
    const holoDims = holoImg.scale(0.15);

    // Watermark all pages
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      for (let x = -logoDims.width; x < width; x += logoDims.width + 60) {
        for (let y = -logoDims.height; y < height; y += logoDims.height + 60) {
          page.drawImage(logoImg, {
            x,
            y,
            width: logoDims.width,
            height: logoDims.height,
            opacity: 0.2,
            rotate: degrees(45),
          });
        }
      }

      page.drawImage(holoImg, {
        x: width - holoDims.width - 10,
        y: height - holoDims.height - 10,
        width: holoDims.width,
        height: holoDims.height,
        opacity: 0.8,
      });
    }

    const finalPdf = await pdfDoc.save();

    await supabase.from('usage').upsert({
      user_email: email,
      plan_name: usageData.plan_name,
      page_credits: usageData.page_credits,
      pages_used: usageData.pages_used + pageCount,
      billing_cycle_start: usageData.billing_cycle_start,
    }, { onConflict: ['user_email'] });

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${file.name.replace('.pdf', ' - protected.pdf')}"`);

    return new Response(finalPdf, {
      status: 200,
      headers,
    });

  } catch (err) {
    console.error('Function error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
