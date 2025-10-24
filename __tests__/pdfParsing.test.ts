import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/parse-pdf/route'

describe('PDF Parsing API - Input Validation', () => {
  it('handles missing file gracefully', async () => {
    const formData = new FormData()
    // No file appended
    
    const request = new NextRequest('http://localhost:3000/api/parse-pdf', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('No PDF file uploaded')
  })

  it('validates required form field', async () => {
    // Test with form data that has no 'pdf' field
    const formData = new FormData()
    formData.append('other', 'value')
    
    const request = new NextRequest('http://localhost:3000/api/parse-pdf', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('No PDF file uploaded')
  })

  it('validates file type for non-PDF files', async () => {
    // Create a mock non-PDF file
    const textBuffer = Buffer.from('This is not a PDF')
    const file = new File([textBuffer], 'test.txt', { type: 'text/plain' })
    
    const formData = new FormData()
    formData.append('pdf', file)
    
    const request = new NextRequest('http://localhost:3000/api/parse-pdf', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('File must be a PDF')
  })

  it('validates multiple invalid file types', async () => {
    const invalidFiles = [
      { type: 'image/jpeg', name: 'test.jpg' },
      { type: 'application/zip', name: 'test.zip' }
    ]

    for (const fileInfo of invalidFiles) {
      const buffer = Buffer.from('fake content')
      const file = new File([buffer], fileInfo.name, { type: fileInfo.type })
      
      const formData = new FormData()
      formData.append('pdf', file)
      
      const request = new NextRequest('http://localhost:3000/api/parse-pdf', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('File must be a PDF')
    }
  })
})