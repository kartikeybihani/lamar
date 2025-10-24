import { describe, it, expect } from 'vitest'
import { patientSchema, providerSchema, diagnosisSchema, carePlanFormSchema } from '@/lib/validations'

describe('Form Validation Logic', () => {
  describe('Patient Schema', () => {
    it('validates correct patient data', () => {
      const validPatient = {
        firstName: 'John',
        lastName: 'Doe',
        mrn: '123456'
      }
      
      const result = patientSchema.safeParse(validPatient)
      expect(result.success).toBe(true)
    })

    it('rejects MRN with less than 6 digits', () => {
      const invalidPatient = {
        firstName: 'John',
        lastName: 'Doe',
        mrn: '123'
      }
      
      const result = patientSchema.safeParse(invalidPatient)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('MRN must be exactly 6 digits')
      }
    })

    it('rejects MRN with more than 6 digits', () => {
      const invalidPatient = {
        firstName: 'John',
        lastName: 'Doe',
        mrn: '1234567'
      }
      
      const result = patientSchema.safeParse(invalidPatient)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('MRN must be exactly 6 digits')
      }
    })

    it('rejects non-numeric MRN', () => {
      const invalidPatient = {
        firstName: 'John',
        lastName: 'Doe',
        mrn: 'ABC123'
      }
      
      const result = patientSchema.safeParse(invalidPatient)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('MRN must contain only numbers')
      }
    })

    it('rejects empty first name', () => {
      const invalidPatient = {
        firstName: '',
        lastName: 'Doe',
        mrn: '123456'
      }
      
      const result = patientSchema.safeParse(invalidPatient)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('First name is required')
      }
    })

    it('rejects empty last name', () => {
      const invalidPatient = {
        firstName: 'John',
        lastName: '',
        mrn: '123456'
      }
      
      const result = patientSchema.safeParse(invalidPatient)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Last name is required')
      }
    })
  })

  describe('Provider Schema', () => {
    it('validates correct provider data', () => {
      const validProvider = {
        providerName: 'Dr. Smith',
        providerNPI: '1234567890'
      }
      
      const result = providerSchema.safeParse(validProvider)
      expect(result.success).toBe(true)
    })

    it('rejects NPI with less than 10 digits', () => {
      const invalidProvider = {
        providerName: 'Dr. Smith',
        providerNPI: '123456789'
      }
      
      const result = providerSchema.safeParse(invalidProvider)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('NPI must be exactly 10 digits')
      }
    })

    it('rejects NPI with more than 10 digits', () => {
      const invalidProvider = {
        providerName: 'Dr. Smith',
        providerNPI: '12345678901'
      }
      
      const result = providerSchema.safeParse(invalidProvider)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('NPI must be exactly 10 digits')
      }
    })

    it('rejects non-numeric NPI', () => {
      const invalidProvider = {
        providerName: 'Dr. Smith',
        providerNPI: 'ABC1234567'
      }
      
      const result = providerSchema.safeParse(invalidProvider)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('NPI must contain only numbers')
      }
    })

    it('rejects empty provider name', () => {
      const invalidProvider = {
        providerName: '',
        providerNPI: '1234567890'
      }
      
      const result = providerSchema.safeParse(invalidProvider)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Provider name is required')
      }
    })
  })

  describe('Diagnosis Schema', () => {
    it('validates correct diagnosis data', () => {
      const validDiagnosis = {
        primaryDiagnosis: 'Type 2 Diabetes',
        additionalDiagnoses: ['Hypertension'],
        medicationName: 'Metformin',
        medicationHistory: ['Insulin']
      }
      
      const result = diagnosisSchema.safeParse(validDiagnosis)
      expect(result.success).toBe(true)
    })

    it('rejects empty primary diagnosis', () => {
      const invalidDiagnosis = {
        primaryDiagnosis: '',
        additionalDiagnoses: [],
        medicationName: 'Metformin',
        medicationHistory: []
      }
      
      const result = diagnosisSchema.safeParse(invalidDiagnosis)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Primary diagnosis is required')
      }
    })

    it('rejects empty medication name', () => {
      const invalidDiagnosis = {
        primaryDiagnosis: 'Type 2 Diabetes',
        additionalDiagnoses: [],
        medicationName: '',
        medicationHistory: []
      }
      
      const result = diagnosisSchema.safeParse(invalidDiagnosis)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Medication name is required')
      }
    })
  })

  describe('Complete Care Plan Form', () => {
    it('validates complete valid form data', () => {
      const validFormData = {
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
      
      const result = carePlanFormSchema.safeParse(validFormData)
      expect(result.success).toBe(true)
    })

    it('rejects form with invalid patient MRN', () => {
      const invalidFormData = {
        patient: {
          firstName: 'John',
          lastName: 'Doe',
          mrn: '123' // Invalid MRN
        },
        provider: {
          providerName: 'Dr. Smith',
          providerNPI: '1234567890'
        },
        diagnosis: {
          primaryDiagnosis: 'Type 2 Diabetes',
          additionalDiagnoses: [],
          medicationName: 'Metformin',
          medicationHistory: []
        },
        records: {}
      }
      
      const result = carePlanFormSchema.safeParse(invalidFormData)
      expect(result.success).toBe(false)
    })
  })
})
