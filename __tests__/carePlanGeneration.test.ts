import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/care-plans/route'
import { CarePlanFormData } from '@/types'

// Mock Supabase services
vi.mock('@/lib/supabaseServices', () => ({
  checkDuplicatePatient: vi.fn(),
  checkDuplicateProvider: vi.fn(),
  checkDuplicateOrder: vi.fn(),
  insertProvider: vi.fn(),
  insertPatient: vi.fn(),
  insertOrder: vi.fn(),
  insertCarePlan: vi.fn(),
  logAuditEvent: vi.fn()
}))

// Mock fetch for OpenRouter API
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Care Plan Generation API', () => {
  const validFormData: CarePlanFormData = {
    patient: {
      firstName: 'John',
      lastName: 'Doe',
      mrn: '123456'
    },
    provider: {
      providerName: 'Dr. Smith',
      providerNPI: '1234567890'
    },
    diagnosis: {
      primaryDiagnosis: 'Type 2 Diabetes',
      additionalDiagnoses: ['Hypertension'],
      medicationName: 'Metformin',
      medicationHistory: ['Insulin']
    },
    records: {
      patientRecords: 'Patient has been compliant with medication'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset environment variable
    process.env.OPENROUTER_API_KEY = 'test-api-key'
  })

  it('successfully generates care plan from valid form data', async () => {
    // Mock successful API responses
    const { 
      checkDuplicatePatient, 
      checkDuplicateProvider, 
      checkDuplicateOrder,
      insertProvider,
      insertPatient,
      insertOrder,
      insertCarePlan,
      logAuditEvent
    } = await import('@/lib/supabaseServices')

    vi.mocked(checkDuplicatePatient).mockResolvedValue(false)
    vi.mocked(checkDuplicateProvider).mockResolvedValue(false)
    vi.mocked(checkDuplicateOrder).mockResolvedValue(false)
    vi.mocked(insertProvider).mockResolvedValue('provider-123')
    vi.mocked(insertPatient).mockResolvedValue('patient-123')
    vi.mocked(insertOrder).mockResolvedValue('order-123')
    vi.mocked(insertCarePlan).mockResolvedValue('careplan-123')
    vi.mocked(logAuditEvent).mockResolvedValue(undefined)

    // Mock successful OpenRouter API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: '**1. Problem List / DTPs**\n- Need for glycemic control\n\n**2. SMART Goals**\n- Achieve HbA1c < 7%\n\n**3. Pharmacist Interventions**\n- Monitor blood glucose\n\n**4. Monitoring Plan**\n- Weekly glucose checks'
          }
        }]
      })
    })

    const request = new NextRequest('http://localhost:3000/api/care-plans', {
      method: 'POST',
      body: JSON.stringify(validFormData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.id).toBe('careplan-123')
    expect(result.patientName).toBe('John Doe')
    expect(result.mrn).toBe('123456')
    expect(result.carePlanText).toContain('Problem List / DTPs')
    expect(result.carePlanText).toContain('SMART Goals')
  })

  it('returns error when API key is missing', async () => {
    delete process.env.OPENROUTER_API_KEY

    const request = new NextRequest('http://localhost:3000/api/care-plans', {
      method: 'POST',
      body: JSON.stringify(validFormData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.error).toBe('Failed to generate care plan')
  })

  it('handles empty LLM response gracefully', async () => {
    const { 
      checkDuplicatePatient, 
      checkDuplicateProvider, 
      checkDuplicateOrder,
      insertProvider,
      insertPatient,
      insertOrder,
      logAuditEvent
    } = await import('@/lib/supabaseServices')

    vi.mocked(checkDuplicatePatient).mockResolvedValue(false)
    vi.mocked(checkDuplicateProvider).mockResolvedValue(false)
    vi.mocked(checkDuplicateOrder).mockResolvedValue(false)
    vi.mocked(insertProvider).mockResolvedValue('provider-123')
    vi.mocked(insertPatient).mockResolvedValue('patient-123')
    vi.mocked(insertOrder).mockResolvedValue('order-123')
    vi.mocked(logAuditEvent).mockResolvedValue(undefined)

    // Mock OpenRouter API response with empty content
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: '' // Empty response
          }
        }]
      })
    })

    const request = new NextRequest('http://localhost:3000/api/care-plans', {
      method: 'POST',
      body: JSON.stringify(validFormData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.error).toBe('Failed to generate care plan')
  })

  it('blocks duplicate patient submissions', async () => {
    const { checkDuplicatePatient } = await import('@/lib/supabaseServices')
    
    vi.mocked(checkDuplicatePatient).mockResolvedValue(true) // Patient exists

    const request = new NextRequest('http://localhost:3000/api/care-plans', {
      method: 'POST',
      body: JSON.stringify(validFormData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Patient with this MRN already exists')
  })

  it('blocks duplicate provider submissions', async () => {
    const { 
      checkDuplicatePatient, 
      checkDuplicateProvider 
    } = await import('@/lib/supabaseServices')
    
    vi.mocked(checkDuplicatePatient).mockResolvedValue(false)
    vi.mocked(checkDuplicateProvider).mockResolvedValue(true) // Provider exists

    const request = new NextRequest('http://localhost:3000/api/care-plans', {
      method: 'POST',
      body: JSON.stringify(validFormData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Provider with this NPI already exists')
  })

  it('blocks duplicate order submissions', async () => {
    const { 
      checkDuplicatePatient, 
      checkDuplicateProvider,
      checkDuplicateOrder,
      insertProvider,
      insertPatient,
      logAuditEvent
    } = await import('@/lib/supabaseServices')
    
    vi.mocked(checkDuplicatePatient).mockResolvedValue(false)
    vi.mocked(checkDuplicateProvider).mockResolvedValue(false)
    vi.mocked(checkDuplicateOrder).mockResolvedValue(true) // Order exists
    vi.mocked(insertProvider).mockResolvedValue('provider-123')
    vi.mocked(insertPatient).mockResolvedValue('patient-123')
    vi.mocked(logAuditEvent).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/care-plans', {
      method: 'POST',
      body: JSON.stringify(validFormData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Duplicate order exists for this patient, medication, and diagnosis combination')
  })

  it('handles OpenRouter API errors', async () => {
    const { 
      checkDuplicatePatient, 
      checkDuplicateProvider, 
      checkDuplicateOrder,
      insertProvider,
      insertPatient,
      insertOrder,
      logAuditEvent
    } = await import('@/lib/supabaseServices')

    vi.mocked(checkDuplicatePatient).mockResolvedValue(false)
    vi.mocked(checkDuplicateProvider).mockResolvedValue(false)
    vi.mocked(checkDuplicateOrder).mockResolvedValue(false)
    vi.mocked(insertProvider).mockResolvedValue('provider-123')
    vi.mocked(insertPatient).mockResolvedValue('patient-123')
    vi.mocked(insertOrder).mockResolvedValue('order-123')
    vi.mocked(logAuditEvent).mockResolvedValue(undefined)

    // Mock OpenRouter API error response
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: () => Promise.resolve('Rate limit exceeded')
    })

    const request = new NextRequest('http://localhost:3000/api/care-plans', {
      method: 'POST',
      body: JSON.stringify(validFormData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.error).toBe('Failed to generate care plan')
  })

  it('validates required fields', async () => {
    const invalidFormData = {
      patient: {
        firstName: 'John',
        lastName: 'Doe',
        mrn: '123456'
      },
      provider: {
        providerName: 'Dr. Smith',
        providerNPI: '' // Missing NPI
      },
      diagnosis: {
        primaryDiagnosis: 'Type 2 Diabetes',
        additionalDiagnoses: [],
        medicationName: 'Metformin',
        medicationHistory: []
      },
      records: {}
    }

    const request = new NextRequest('http://localhost:3000/api/care-plans', {
      method: 'POST',
      body: JSON.stringify(invalidFormData),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Patient MRN and Provider NPI are required')
  })
})
