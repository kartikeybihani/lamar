import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Care plan ID is required' },
        { status: 400 }
      );
    }

    // Fetch the care plan with all related data
    const { data: carePlan, error } = await supabase
      .from('care_plans')
      .select(`
        id,
        plan_text,
        generated_at,
        generated_by,
        version,
        is_final,
        orders!inner(
          id,
          medication_name,
          primary_diagnosis,
          additional_diagnoses,
          medication_history,
          created_at,
          patients!inner(
            id,
            first_name,
            last_name,
            mrn,
            date_of_birth,
            sex,
            weight_kg,
            allergies,
            providers!inner(
              id,
              name,
              npi
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching care plan:', error);
      return NextResponse.json(
        { error: 'Failed to fetch care plan' },
        { status: 500 }
      );
    }

    if (!carePlan) {
      return NextResponse.json(
        { error: 'Care plan not found' },
        { status: 404 }
      );
    }

    // Transform the data to a more usable format
    const order = carePlan.orders as any;
    const patient = order.patients as any;
    const provider = patient.providers as any;

    const reportData = {
      id: carePlan.id,
      patientName: `${patient.first_name} ${patient.last_name}`,
      mrn: patient.mrn,
      providerName: provider.name,
      providerNPI: provider.npi,
      medication: order.medication_name,
      primaryDiagnosis: order.primary_diagnosis,
      additionalDiagnoses: order.additional_diagnoses,
      medicationHistory: order.medication_history,
      carePlanText: carePlan.plan_text,
      generatedAt: carePlan.generated_at,
      generatedBy: carePlan.generated_by,
      version: carePlan.version,
      isFinal: carePlan.is_final,
      patientInfo: {
        firstName: patient.first_name,
        lastName: patient.last_name,
        dateOfBirth: patient.date_of_birth,
        sex: patient.sex,
        weight: patient.weight_kg,
        allergies: patient.allergies,
      },
      orderCreatedAt: order.created_at,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
