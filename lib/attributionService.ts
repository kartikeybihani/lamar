import { SourceAttribution, AttributionSection, AttributionSource } from '@/types';

// System prompt for source attribution analysis
const ATTRIBUTION_SYSTEM_PROMPT = `You are a clinical AI assistant specializing in **source attribution analysis** for pharmacist care plans.

Your task is to analyze the care plan and identify which statements are supported by patient data, clinical reasoning, or standard practice.

### INSTRUCTIONS
1. **Parse the care plan** into its main sections (Problem List, SMART Goals, Interventions, Monitoring)
2. **For each statement**, identify the supporting evidence:
   - **PATIENT DATA**: Direct references to patient information (medications, vitals, lab values, symptoms, demographics)
   - **CLINICAL REASONING**: Inferences based on patient data and medical knowledge
   - **STANDARD PRACTICE**: Evidence-based recommendations and guidelines
3. **Map ALL statements** - don't skip any, but categorize the type of support
4. **Extract supporting evidence** from the patient record or explain the clinical reasoning
5. **Be comprehensive** - include all care plan statements with their appropriate attribution

### OUTPUT FORMAT
Return ONLY a valid JSON object with this exact structure. Do not include any text before or after the JSON:
{
  "sections": [
    {
      "section": "Section Name (e.g., Problem List / DTPs)",
      "statements": [
        {
          "statement": "Exact care plan statement text",
          "sources": [
            "Patient Record: [specific patient data that supports this]",
            "Clinical Reasoning: [explanation of why this recommendation is made]",
            "Standard Practice: [evidence-based guideline or standard of care]"
          ],
          "attribution_type": "patient_data|clinical_reasoning|standard_practice|mixed"
        }
      ]
    }
  ]
}

### CRITICAL JSON REQUIREMENTS
- Return ONLY valid JSON - no markdown, no explanations, no extra text
- Ensure all strings are properly quoted and escaped
- Make sure all brackets and braces are properly closed
- Keep responses concise to avoid truncation
- **INCLUDE ALL care plan statements** - don't skip any
- **Categorize the type of support** for each statement
- **Provide specific evidence** from patient data when available
- **Explain clinical reasoning** for recommendations and interventions`;

// Build the user prompt for attribution analysis
const buildAttributionPrompt = (carePlanText: string, patientRecordText: string): string => {
  return `### CARE PLAN TO ANALYZE:
${carePlanText}

### ORIGINAL PATIENT RECORD:
${patientRecordText}

### TASK:
Analyze the care plan above and provide comprehensive source attribution for ALL statements. For each statement, identify:
1. **Patient Data Sources**: Specific information from the patient record (medications, vitals, lab values, symptoms, demographics)
2. **Clinical Reasoning**: Why this recommendation or intervention is appropriate based on the patient's condition
3. **Standard Practice**: Evidence-based guidelines or standard of care that supports this statement

Include ALL care plan statements - don't skip any. Categorize each statement's attribution type and provide supporting evidence. Return your analysis as structured JSON following the format specified in the system prompt.`;
};

// Generate source attribution using OpenRouter API
export const generateSourceAttribution = async (
  carePlanText: string, 
  patientRecordText: string
): Promise<SourceAttribution> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  const userPrompt = buildAttributionPrompt(carePlanText, patientRecordText);

  try {
    console.log('Calling OpenRouter API for source attribution...');
    console.log('Care plan text length:', carePlanText.length);
    console.log('Patient record text length:', patientRecordText.length);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free',
        messages: [
          { role: 'system', content: ATTRIBUTION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error for attribution:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenRouter API response for attribution:', data);
      throw new Error('Invalid response from OpenRouter API');
    }

    const attributionText = data.choices[0].message.content;
    
    if (!attributionText || attributionText.trim().length === 0) {
      throw new Error('Empty attribution response from AI');
    }

    // Parse the JSON response
    let attributionData: SourceAttribution;
    try {
      // Clean the response text
      let jsonText = attributionText.trim();
      
      // Remove any markdown code blocks
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      // Try to fix common JSON issues
      jsonText = jsonText.trim();
      
      // If the JSON is incomplete, try to fix it
      if (!jsonText.endsWith('}')) {
        // Find the last complete statement and close the JSON
        const lastCompleteStatement = jsonText.lastIndexOf('}');
        if (lastCompleteStatement > 0) {
          // Try to close the JSON structure
          const beforeLastStatement = jsonText.substring(0, lastCompleteStatement + 1);
          const afterLastStatement = jsonText.substring(lastCompleteStatement + 1);
          
          // If there's incomplete content after the last complete statement, try to close it
          if (afterLastStatement.trim()) {
            // Try to close the current statement and the JSON
            jsonText = beforeLastStatement + ']}]}';
          }
        }
      }
      
      const parsed = JSON.parse(jsonText);
      
      // Validate the structure
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error('Invalid attribution structure: missing sections array');
      }
      
      // Ensure attribution_type is set for each statement
      const processedSections = parsed.sections.map((section: any) => ({
        ...section,
        statements: section.statements.map((statement: any) => ({
          ...statement,
          attribution_type: statement.attribution_type || 'clinical_reasoning'
        }))
      }));
      
      attributionData = {
        sections: processedSections,
        generated_at: new Date().toISOString(),
        model_used: 'openai/gpt-oss-20b:free'
      };
      
    } catch (parseError) {
      console.error('Error parsing attribution JSON:', parseError);
      console.error('Raw attribution response:', attributionText);
      
      // If JSON parsing fails, create a fallback structure
      console.log('Creating fallback attribution structure...');
      attributionData = {
        sections: [
          {
            section: "Attribution Analysis Unavailable",
            statements: [
              {
                statement: "Source attribution could not be generated due to technical issues",
                sources: ["LLM response was incomplete or malformed - manual review recommended"],
                attribution_type: "standard_practice"
              }
            ]
          }
        ],
        generated_at: new Date().toISOString(),
        model_used: 'openai/gpt-oss-20b:free'
      };
      
      console.log('Using fallback attribution data:', JSON.stringify(attributionData, null, 2));
    }

    console.log('Successfully generated source attribution via OpenRouter API');
    return attributionData;

  } catch (error) {
    console.error('Error calling OpenRouter API for attribution:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      carePlanLength: carePlanText.length,
      patientRecordLength: patientRecordText.length
    });
    
    throw new Error(`Failed to generate source attribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
