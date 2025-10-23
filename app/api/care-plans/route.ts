import { NextRequest, NextResponse } from 'next/server'
import { 
  checkDuplicatePatient, 
  checkDuplicateProvider, 
  checkDuplicateOrder,
  insertProvider,
  insertPatient,
  insertOrder,
  insertCarePlan,
  logAuditEvent
} from '@/lib/supabaseServices'
import { CarePlanFormData } from '@/types'

// Clinical pharmacist system prompt for care plan generation
const SYSTEM_PROMPT = `You are a **clinical pharmacist AI** specializing in pharmacotherapy and evidence-based care planning.  
Your goal is to synthesize a **concise, structured pharmacist care plan** using the patient's clinical notes and medication history provided below.

### INSTRUCTIONS
1. Read and interpret the entire patient record carefully before outputting.
2. Identify **drug therapy problems (DTPs)** and **clinical issues** based on the provided diagnoses, medications, vitals, and lab results.
3. Use current clinical reasoning (no hallucination) — rely only on information inferable from the case.
4. Write in clear, professional, clinical language suitable for documentation in an EMR or pharmacist report.
5. Present the care plan using **the following sections and structure** exactly:

---

### CARE PLAN TEMPLATE
**1. Problem List / Drug Therapy Problems (DTPs)**  
List and briefly explain each relevant therapeutic or safety concern (indication, efficacy, safety, adherence, interaction, monitoring).

**2. SMART Goals**  
Define measurable therapeutic outcomes with realistic timelines, directly aligned to the patient's diagnoses and current therapies.

**3. Pharmacist Interventions and Plan**  
For each problem, outline the intervention strategy (dose verification, adjustments, premedications, administration notes, patient education, monitoring rationale, and communication steps).  
Be concise but clinically specific. Present interventions in structured bullet points or numbered lists - avoid table formats. Group related interventions under clear subheadings.

**4. Monitoring Plan & Lab Schedule**  
Summarize what parameters will be tracked, frequency, and follow-up requirements (vitals, labs, symptoms, infusion reactions, renal function, etc.). Present monitoring details in structured bullet points or numbered lists - avoid table formats. Organize by timing (pre-treatment, during, post-treatment) when applicable.

---

### OUTPUT STYLE
- Use **clinical bullet format** and **short paragraphs** (no long essays).  
- Avoid repetition of data already stated in the chart; instead, reference it contextually ("baseline FVC stable at 2.8 L").  
- Maintain neutral, evidence-based tone — no speculation.  
- If data are missing or ambiguous, explicitly note: "Information not provided; recommend verification."

---

### INPUT SECTION
**Patient Record:**
<Insert the patient's clinical notes and medication history here.>

---

### OUTPUT EXAMPLE FORMAT (abbreviated)
**1. Problem List / DTPs**
- Need for rapid immunomodulation (symptom progression in MG).  
- Risk of infusion-related reactions during IVIG therapy.  
- Renal monitoring required due to IVIG load.  

**2. SMART Goals**
- Achieve measurable improvement in muscle strength and speech within 2 weeks post-IVIG.  
- No acute kidney injury or infusion reaction.  

**3. Pharmacist Interventions and Plan**
- Verify IVIG total dose (2 g/kg over 5 days).  
- Ensure hydration pre-infusion.  
- Educate on early signs of thrombosis or renal issues.  

**4. Monitoring Plan & Lab Schedule**
- Vitals q15–30 min during infusion.  
- BMP pre-course and 3–7 days post.  
- Neurology/pharmacy follow-up at 2 and 6 weeks.  

---

**Your task:** Generate a **complete pharmacist care plan** following this structure for the provided patient data.  
Do not restate patient demographics verbatim — integrate them only when clinically relevant.`

// Build the user prompt for care plan generation
const buildCarePlanPrompt = (formData: CarePlanFormData): string => {
  const { patient, provider, diagnosis, records } = formData;
  
  let prompt = `### INPUT SECTION
**Patient Record (structured summary):**
- Name: ${patient.firstName} ${patient.lastName}
- MRN: ${patient.mrn}
- Provider: ${provider.providerName} (NPI: ${provider.providerNPI})
- Primary Diagnosis: ${diagnosis.primaryDiagnosis}
- Additional Diagnoses: ${diagnosis.additionalDiagnoses?.join(', ') || 'None'}
- Medication: ${diagnosis.medicationName}
- Medication History: ${diagnosis.medicationHistory?.join(', ') || 'None'}`;

  // Add clinical notes if provided
  if (records.patientRecords && records.patientRecords.trim()) {
    prompt += `\n- Clinical Notes:\n${records.patientRecords}`;
  }

  console.log('Care plan user data prompt:', prompt);
  return prompt;
};

// Generate care plan text using OpenAI API
const generateCarePlanText = async (formData: CarePlanFormData): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const userPrompt = buildCarePlanPrompt(formData);

  try {
    console.log('Calling OpenAI API for care plan generation...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI API response:', data);
      throw new Error('Invalid response from OpenAI API');
    }

    const carePlanText = data.choices[0].message.content;
    
    if (!carePlanText || carePlanText.trim().length === 0) {
      throw new Error('Empty care plan generated by AI');
    }

    console.log('Successfully generated care plan via OpenAI API');
    return carePlanText.trim();

  } catch (error) {
    console.error('Error calling OpenAI API:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      formData: {
        patientName: `${formData.patient.firstName} ${formData.patient.lastName}`,
        mrn: formData.patient.mrn,
        medication: formData.diagnosis.medicationName
      }
    });
    
    throw new Error(`Failed to generate care plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

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
    let planText: string;
    try {
      planText = await generateCarePlanText(formData);
    } catch (error) {
      console.error('Error generating care plan:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        formData: {
          patientName: `${formData.patient.firstName} ${formData.patient.lastName}`,
          mrn: formData.patient.mrn,
          medication: formData.diagnosis.medicationName
        }
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to generate care plan', 
          details: error instanceof Error ? error.message : 'Unknown error occurred'
        },
        { status: 500 }
      );
    }

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
