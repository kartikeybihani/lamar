import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse PDF using pdf2json (serverless-friendly)
    const PDFParser = require('pdf2json');
    
    const pdfData = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(new Error(`PDF parsing error: ${errData.parserError}`));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        resolve(pdfData);
      });
      
      pdfParser.parseBuffer(buffer);
    });
    
    // Extract text from all pages
    let fullText = '';
    if (pdfData && (pdfData as any).Pages) {
      (pdfData as any).Pages.forEach((page: any) => {
        if (page.Texts) {
          page.Texts.forEach((text: any) => {
            if (text.R) {
              text.R.forEach((r: any) => {
                if (r.T) {
                  try {
                    fullText += decodeURIComponent(r.T) + ' ';
                  } catch (e) {
                    // If URI decoding fails, use the raw text
                    fullText += r.T + ' ';
                  }
                }
              });
            }
          });
        }
      });
    }
    
    // Clean up messy formatting
    const cleanText = fullText
      .replace(/\r?\n|\r/g, ' ')  // flatten newlines to spaces
      .replace(/\s+/g, ' ')       // collapse multiple spaces
      .trim();

    if (!cleanText || cleanText.length === 0) {
      return NextResponse.json({ error: 'No text content found in PDF' }, { status: 400 });
    }

    return NextResponse.json({ 
      text: cleanText,
      pageCount: (pdfData as any).Pages ? (pdfData as any).Pages.length : 0,
      success: true 
    });

  } catch (error) {
    console.error('Error parsing PDF:', error);
    
    // Handle specific PDF parsing errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        return NextResponse.json({ error: 'Invalid PDF file format' }, { status: 400 });
      }
      if (error.message.includes('Password protected')) {
        return NextResponse.json({ error: 'Password-protected PDFs are not supported' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to parse PDF file' 
    }, { status: 500 });
  }
}
