import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb } from 'https://esm.sh/pdf-lib@1.17.1'

const SUPABASE_URL = 'https://dvzmnikrvkvgragzhrof.supabase.co'
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const API_KEY = Deno.env.get('AQUAMARK_API_KEY')!
const RENDER_DECRYPT_URL = 'https://aquamark-decrypt.onrender.com/decrypt'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const authHeader = req.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== API_KEY) {
    return new Response('Unauthorized', { status: 401 })
  }

  const formData = await req.formData()
  const email = formData.get('email')?.toString()
  const file = formData.get('file') as File

  if (!email || !file) {
    return new Response('Missing email or file', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Fetch user plan
  const { data: usageRow, error: usageError } = await supabase
    .from('usage')
    .select('plan_name, pages_used, page_credits, id')
    .eq('user_email', email)
    .single()

  if (usageError || !usageRow || usageRow.plan_name !== 'Enterprise') {
    return new Response('Access denied. Enterprise plan required.', { status: 403 })
  }

  // Fetch most recent logo from Supabase Storage
  const { data: files, error: fileError } = await supabase
    .storage
    .from('logos')
    .list(email, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } })

  if (fileError || !files || files.length === 0) {
    return new Response('No logo found for this user.', { status: 404 })
  }

  const logoPath = `${email}/${files[0].name}`
  const { data: logoUrlData } = supabase.storage.from('logos').getPublicUrl(logoPath)
  const logoRes = await fetch(logoUrlData.publicUrl)
  const logoBytes = new Uint8Array(await logoRes.arrayBuffer())

  // Get PDF bytes
  const originalBytes = new Uint8Array(await file.arrayBuffer())

  // Decrypt if needed
  let pdfBytes = originalBytes
  try {
    const decryptRes = await fetch(RENDER_DECRYPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: originalBytes
    })
    if (decryptRes.ok) {
      pdfBytes = new Uint8Array(await decryptRes.arrayBuffer())
    }
  } catch (_) {
    // Fail silently if decrypt fails
  }

  // Watermark the PDF
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const logoImage = await pdfDoc.embedPng(logoBytes)
  const pages = pdfDoc.getPages()
  const logoDims = logoImage.scale(0.15)

  for (const page of pages) {
    const { width, height } = page.getSize()
    for (let x = 0; x < width; x += logoDims.width + 50) {
      for (let y = 0; y < height; y += logoDims.height + 50) {
        page.drawImage(logoImage, {
          x,
          y,
          width: logoDims.width,
          height: logoDims.height,
          rotate: { type: 'degrees', angle: -30 },
          opacity: 0.25
        })
      }
    }
  }

  const watermarkedBytes = await pdfDoc.save()

  // Update usage
  await supabase
    .from('usage')
    .update({ pages_used: usageRow.pages_used + pages.length })
    .eq('id', usageRow.id)

  return new Response(watermarkedBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="watermarked.pdf"'
    }
  })
})
