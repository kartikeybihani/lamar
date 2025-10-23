import { NextRequest, NextResponse } from 'next/server'
import { 
  checkDuplicatePatient, 
  checkDuplicateProvider, 
  checkDuplicateOrder,
  insertProvider,
  insertPatient,
  insertOrder,
  insertCarePlan,
  generateCarePlanText,
  logAuditEvent
} from '@/lib/supabaseServices'
import { CarePlanFormData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const formData: CarePlanFormData = await request.json()

    // Validate required fields
    if (!formData.patient?.mrn || !formData.provider?.providerNPI) {
      return NextResponse.json(
        { error: 'Patient MRN and Provider NPI are required' },
        { status: 400 }
      )
    }

    // Check for duplicate patient
    const existingPatient = await checkDuplicatePatient(formData.patient.mrn)
    if (existingPatient) {
      return NextResponse.json(
        { error: 'Patient with this MRN already exists' },
        { status: 400 }
      )
    }

    // Check for duplicate provider
    const existingProvider = await checkDuplicateProvider(formData.provider.providerNPI)
    if (existingProvider) {
      return NextResponse.json(
        { error: 'Provider with this NPI already exists' },
        { status: 400 }
      )
    }

    // Insert provider
    const providerId = await insertProvider(
      formData.provider.providerName,
      formData.provider.providerNPI
    )

    // Log provider creation
    await logAuditEvent('create_provider', providerId, 'provider', 'New provider created')

    // Insert patient
    const patientId = await insertPatient(
      formData.patient.firstName,
      formData.patient.lastName,
      formData.patient.mrn,
      providerId
    )

    // Log patient creation
    await logAuditEvent('create_patient', patientId, 'patient', 'New patient created')

    // Check for duplicate order
    const existingOrder = await checkDuplicateOrder(
      patientId,
      formData.diagnosis.medicationName,
      formData.diagnosis.primaryDiagnosis
    )
    if (existingOrder) {
      return NextResponse.json(
        { error: 'Duplicate order exists for this patient, medication, and diagnosis combination' },
        { status: 400 }
      )
    }

    // Insert order
    const orderId = await insertOrder(
      patientId,
      formData.diagnosis.medicationName,
      formData.diagnosis.primaryDiagnosis,
      formData.diagnosis.additionalDiagnoses,
      formData.diagnosis.medicationHistory
    )

    // Log order creation
    await logAuditEvent('create_order', orderId, 'order', 'New order created')

    // Generate care plan text
    const planText = await generateCarePlanText(formData)

    // Insert care plan
    const carePlanId = await insertCarePlan(orderId, planText)

    // Log care plan creation
    await logAuditEvent('generate_care_plan', carePlanId, 'care_plan', 'Care plan generated')

    // Return complete care plan
    const carePlan = {
      id: carePlanId,
      patientName: `${formData.patient.firstName} ${formData.patient.lastName}`,
      mrn: formData.patient.mrn,
      providerName: formData.provider.providerName,
      medication: formData.diagnosis.medicationName,
      carePlanText: planText,
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(carePlan)
  } catch (error) {
    console.error('Error creating care plan:', error)
    return NextResponse.json(
      { error: 'Failed to create care plan' },
      { status: 500 }
    )
  }
}
