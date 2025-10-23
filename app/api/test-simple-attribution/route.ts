import { NextRequest, NextResponse } from 'next/server';
import { generateSourceAttribution } from '@/lib/attributionService';

export async function POST(request: NextRequest) {
  try {
    // Simple test data
    const carePlanText = `**1. Problem List / Drug Therapy Problems (DTPs)**
- Risk of hyperkalemia due to concurrent ACE inhibitor and potassium-sparing diuretic
- Need for renal function monitoring

**2. SMART Goals**
- Maintain serum potassium < 5.0 mEq/L
- Monitor renal function closely`;

    const patientRecordText = `PATIENT INFORMATION:
Name: John Doe
MRN: 123456
Medication: Lisinopril 40mg daily, Spironolactone 50mg daily
Diagnosis: Heart failure, Hypertension`;

    console.log('Testing simple attribution...');
    console.log('Care plan:', carePlanText);
    console.log('Patient record:', patientRecordText);

    const attributionData = await generateSourceAttribution(carePlanText, patientRecordText);

    console.log('Generated attribution:', JSON.stringify(attributionData, null, 2));

    return NextResponse.json({
      success: true,
      attributionData: attributionData
    });

  } catch (error) {
    console.error('Error in simple attribution test:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate simple attribution',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
