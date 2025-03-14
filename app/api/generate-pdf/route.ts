import { NextRequest, NextResponse } from 'next/server';

// Helper to stream PDF data to a buffer
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData();
    const html = formData.get('html') as string;
    const filename = formData.get('filename') as string || 'document.pdf';
    
    if (!html) {
      return new NextResponse(
        JSON.stringify({ error: 'HTML content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Forward the HTML to a PDF conversion service
    // Using a simple implementation here that relies on a server-side PDF service
    // This could be replaced with any PDF service API call
    
    // Here's an example of sending to a third-party PDF conversion API
    const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.PDFSHIFT_API_KEY || '').toString('base64')}`
      },
      body: JSON.stringify({
        source: html,
        landscape: false,
        format: 'Letter',
        margin: '0.5in',
        sandbox: false
      })
    });
    
    if (!response.ok) {
      // If the service is not available, fallback to a minimal PDF generation
      console.warn('PDF service unavailable, using fallback PDF generation');
      
      // Create a simple PDF with minimal formatting
      // This is a very basic fallback that would be replaced with a more robust solution
      const fallbackPdf = Buffer.from(`
        %PDF-1.4
        1 0 obj
        << /Type /Catalog
           /Pages 2 0 R
        >>
        endobj
        2 0 obj
        << /Type /Pages
           /Kids [3 0 R]
           /Count 1
        >>
        endobj
        3 0 obj
        << /Type /Page
           /Parent 2 0 R
           /Resources << /Font << /F1 4 0 R >> >>
           /MediaBox [0 0 612 792]
           /Contents 5 0 R
        >>
        endobj
        4 0 obj
        << /Type /Font
           /Subtype /Type1
           /BaseFont /Helvetica
        >>
        endobj
        5 0 obj
        << /Length 68 >>
        stream
        BT
        /F1 12 Tf
        50 700 Td
        (PDF service unavailable. Please try again later.) Tj
        ET
        endstream
        endobj
        xref
        0 6
        0000000000 65535 f
        0000000009 00000 n
        0000000058 00000 n
        0000000119 00000 n
        0000000247 00000 n
        0000000320 00000 n
        trailer
        << /Size 6
           /Root 1 0 R
        >>
        startxref
        439
        %%EOF
      `);
      
      return new NextResponse(fallbackPdf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }
    
    // Get PDF data from successful conversion
    const pdfStream = response.body;
    
    if (!pdfStream) {
      return new NextResponse(
        JSON.stringify({ error: 'Failed to generate PDF' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Convert stream to buffer
    const pdfBuffer = await streamToBuffer(pdfStream);
    
    // Return the PDF as a downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate PDF', details: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}