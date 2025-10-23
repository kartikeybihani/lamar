import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSourceAttribution } from '@/lib/attributionService';
import { updateCarePlanAttribution } from '@/lib/supabaseServices';

export async function POST(request: NextRequest) {
  try {
    const { carePlanId } = await request.json();

    if (!carePlanId) {
      return NextResponse.json({ error: 'Care plan ID is required' }, { status: 400 });
    }

    console.log(`Testing attribution for care plan: ${carePlanId}`);

    // Fetch care plan and associated patient data
    const { data: carePlanData, error: carePlanError } = await supabase
      .from('care_plans')
      .select(`
        id,
        plan_text,
        orders!inner(
          id,
          medication_name,
          primary_diagnosis,
          additional_diagnoses,
          medication_history,
          patients!inner(
            id,
            first_name,
            last_name,
            mrn,
            date_of_birth,
            sex,
            weight_kg,
            allergies
          )
        )
      `)
      .eq('id', carePlanId)
      .single();

    if (carePlanError) {
      console.error('Error fetching care plan:', carePlanError);
      return NextResponse.json(
        { error: 'Care plan not found' },
        { status: 404 }
      );
    }

    if (!carePlanData) {
      return NextResponse.json(
        { error: 'Care plan not found' },
        { status: 404 }
      );
    }

    // Build patient record text from the data
    const patient = (carePlanData.orders as any).patients;
    const order = carePlanData.orders as any;
    
    let patientRecordText = `PATIENT INFORMATION:
Name: ${patient.first_name} ${patient.last_name}
MRN: ${patient.mrn}
Date of Birth: ${patient.date_of_birth || 'Not specified'}
Sex: ${patient.sex || 'Not specified'}
Weight: ${patient.weight_kg ? `${patient.weight_kg} kg` : 'Not specified'}
Allergies: ${patient.allergies || 'None reported'}

DIAGNOSIS INFORMATION:
Primary Diagnosis: ${order.primary_diagnosis}
Additional Diagnoses: ${order.additional_diagnoses?.join(', ') || 'None'}

MEDICATION INFORMATION:
Current Medication: ${order.medication_name}
Medication History: ${order.medication_history?.join(', ') || 'None'}`;

    console.log('Patient record text:', patientRecordText);
    console.log('Care plan text:', carePlanData.plan_text);

    // Generate source attribution
    console.log(`Generating source attribution for care plan ${carePlanId}...`);
    const attributionData = await generateSourceAttribution(
      carePlanData.plan_text,
      patientRecordText
    );

    console.log(`Generated attribution data:`, JSON.stringify(attributionData, null, 2));

    // Update the care plan with attribution data
    await updateCarePlanAttribution(carePlanId, attributionData);

    console.log(`Successfully generated and stored attribution for care plan ${carePlanId}`);

    return NextResponse.json({
      success: true,
      message: 'Source attribution generated successfully',
      carePlanId: carePlanId,
      attributionData: attributionData
    });

  } catch (error) {
    console.error('Error generating source attribution:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        error: 'Failed to generate source attribution',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
