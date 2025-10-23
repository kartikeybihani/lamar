import { NextRequest, NextResponse } from 'next/server'
import { checkDuplicateOrder } from '@/lib/supabaseServices'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mrn = searchParams.get('mrn')
    const medicationName = searchParams.get('medicationName')
    const primaryDiagnosis = searchParams.get('primaryDiagnosis')

    if (!mrn || !medicationName || !primaryDiagnosis) {
      return NextResponse.json(
        { error: 'MRN, medication name, and primary diagnosis parameters are required' },
        { status: 400 }
      )
    }

    if (mrn.length !== 6) {
      return NextResponse.json(
        { error: 'MRN must be exactly 6 characters' },
        { status: 400 }
      )
    }

    // First, get the patient ID from MRN
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('mrn', mrn)
      .single()

    if (patientError || !patient) {
      // If patient doesn't exist, no duplicate order possible
      return NextResponse.json({ isDuplicate: false })
    }

    const isDuplicate = await checkDuplicateOrder(
      patient.id,
      medicationName,
      primaryDiagnosis
    )
    
    return NextResponse.json({ isDuplicate })
  } catch (error) {
    console.error('Error checking order duplicate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
