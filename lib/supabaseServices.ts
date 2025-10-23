import { supabase } from './supabase'
import { CarePlanFormData, GeneratedCarePlan, CarePlanRecord } from '@/types'

// Check if patient MRN already exists
export const checkDuplicatePatient = async (mrn: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('patients')
    .select('id')
    .eq('mrn', mrn)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Database error: ${error.message}`)
  }

  return !!data
}

// Check if provider NPI already exists
export const checkDuplicateProvider = async (npi: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('providers')
    .select('id')
    .eq('npi', npi)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Database error: ${error.message}`)
  }

  return !!data
}

// Check for duplicate order (same patient + medication + diagnosis)
export const checkDuplicateOrder = async (
  patientId: string,
  medicationName: string,
  primaryDiagnosis: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('patient_id', patientId)
    .eq('medication_name', medicationName)
    .eq('primary_diagnosis', primaryDiagnosis)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Database error: ${error.message}`)
  }

  return !!data
}

// Insert provider and return ID
export const insertProvider = async (name: string, npi: string): Promise<string> => {
  const { data, error } = await supabase
    .from('providers')
    .insert({ name, npi })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to insert provider: ${error.message}`)
  }

  return data.id
}

// Insert patient and return ID
export const insertPatient = async (
  firstName: string,
  lastName: string,
  mrn: string,
  providerId: string
): Promise<string> => {
  const { data, error } = await supabase
    .from('patients')
    .insert({
      first_name: firstName,
      last_name: lastName,
      mrn,
      provider_id: providerId
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to insert patient: ${error.message}`)
  }

  return data.id
}

// Insert order and return ID
export const insertOrder = async (
  patientId: string,
  medicationName: string,
  primaryDiagnosis: string,
  additionalDiagnoses: string[] = [],
  medicationHistory: string[] = []
): Promise<string> => {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      patient_id: patientId,
      medication_name: medicationName,
      primary_diagnosis: primaryDiagnosis,
      additional_diagnoses: additionalDiagnoses,
      medication_history: medicationHistory
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to insert order: ${error.message}`)
  }

  return data.id
}

// Insert care plan
export const insertCarePlan = async (
  orderId: string,
  planText: string
): Promise<string> => {
  const { data, error } = await supabase
    .from('care_plans')
    .insert({
      order_id: orderId,
      plan_text: planText,
      generated_by: 'LLM',
      is_final: true
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to insert care plan: ${error.message}`)
  }

  return data.id
}

// Log audit event
export const logAuditEvent = async (
  eventType: string,
  entityId: string,
  entityType: string,
  description?: string
): Promise<void> => {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      event_type: eventType,
      entity_id: entityId,
      entity_type: entityType,
      description
    })

  if (error) {
    console.error('Failed to log audit event:', error.message)
    // Don't throw error for audit logging failures
  }
}

// Get all care plans for reports
export const getAllCarePlans = async (): Promise<CarePlanRecord[]> => {
  const { data, error } = await supabase
    .from('care_plans')
    .select(`
      id,
      generated_at,
      plan_text,
      orders!inner(
        id,
        medication_name,
        patients!inner(
          id,
          first_name,
          last_name,
          mrn,
          providers!inner(
            id,
            name
          )
        )
      )
    `)
    .order('generated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch care plans: ${error.message}`)
  }

  return data.map((carePlan: any) => ({
    id: carePlan.id,
    patientName: `${carePlan.orders.patients.first_name} ${carePlan.orders.patients.last_name}`,
    mrn: carePlan.orders.patients.mrn,
    provider: carePlan.orders.patients.providers.name,
    medication: carePlan.orders.medication_name,
    date: carePlan.generated_at.split('T')[0]
  }))
}

// Generate care plan text (mock for now)
export const generateCarePlanText = async (formData: CarePlanFormData): Promise<string> => {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const carePlanText = `
CARE PLAN FOR ${formData.patient.firstName.toUpperCase()} ${formData.patient.lastName.toUpperCase()}
Medical Record Number: ${formData.patient.mrn}
Provider: ${formData.provider.providerName} (NPI: ${formData.provider.providerNPI})
Date Generated: ${new Date().toLocaleDateString()}

PRIMARY DIAGNOSIS: ${formData.diagnosis.primaryDiagnosis}
${formData.diagnosis.additionalDiagnoses.length > 0 ? 
  `ADDITIONAL DIAGNOSES: ${formData.diagnosis.additionalDiagnoses.join(', ')}` : ''}

MEDICATION: ${formData.diagnosis.medicationName}
${formData.diagnosis.medicationHistory.length > 0 ? 
  `MEDICATION HISTORY: ${formData.diagnosis.medicationHistory.join(', ')}` : ''}

CARE PLAN RECOMMENDATIONS:

1. MEDICATION MANAGEMENT
   - Monitor patient adherence to ${formData.diagnosis.medicationName}
   - Assess for drug interactions and side effects
   - Adjust dosage as needed based on patient response

2. PATIENT EDUCATION
   - Provide comprehensive medication counseling
   - Review proper administration techniques
   - Discuss potential side effects and when to contact provider

3. MONITORING PARAMETERS
   - Regular follow-up appointments every 3 months
   - Laboratory monitoring as indicated
   - Assessment of therapeutic response

4. LIFESTYLE MODIFICATIONS
   - Dietary counseling as appropriate
   - Exercise recommendations
   - Smoking cessation if applicable

5. CARE COORDINATION
   - Coordinate with primary care provider
   - Ensure appropriate referrals as needed
   - Maintain communication with patient's care team

FOLLOW-UP PLAN:
- Next appointment scheduled for 3 months
- Patient to contact pharmacy with any questions
- Provider to review care plan effectiveness

This care plan was generated using AI-assisted clinical decision support and should be reviewed by the healthcare provider before implementation.
  `.trim()

  return carePlanText
}
