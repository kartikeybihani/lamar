import { SourceAttribution, AttributionSection, AttributionSource } from '@/types';

// System prompt for source attribution analysis
const ATTRIBUTION_SYSTEM_PROMPT = `You are a clinical AI assistant specializing in **source attribution analysis** for pharmacist care plans.

Your task is to identify which care plan statements are directly supported by the patient record, and which are clinical inferences or standard recommendations.

### INSTRUCTIONS
1. **Parse the care plan** into its main sections (Problem List, SMART Goals, Interventions, Monitoring)
2. **For each statement**, determine if it has a direct source in the patient record:
   - **HAS SOURCE**: Statement is directly supported by specific patient data (medications, vitals, lab values, symptoms, etc.)
   - **NO SOURCE**: Statement is a clinical inference, standard recommendation, or general medical knowledge
3. **Only map statements that have clear sources** - skip generic recommendations and clinical inferences
4. **Extract exact quotes** or paraphrases from the patient record that directly support the statement
5. **Be selective** - focus on statements that are clearly derived from patient-specific data

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
            "Patient Record: Exact quote or paraphrase that supports this statement",
            "Another supporting source from patient record"
          ]
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
- **ONLY include statements that have clear sources in the patient record**
- **Skip statements that are generic recommendations or clinical inferences**
- Focus on patient-specific data that directly supports the statement
- If a statement has no clear source, DO NOT include it in the attribution`;

// Build the user prompt for attribution analysis
const buildAttributionPrompt = (carePlanText: string, patientRecordText: string): string => {
  return `### CARE PLAN TO ANALYZE:
${carePlanText}

### ORIGINAL PATIENT RECORD:
${patientRecordText}

### TASK:
Analyze the care plan above and identify ONLY the statements that are directly supported by specific data in the patient record. Skip generic recommendations, clinical inferences, and standard medical advice. Focus on statements that clearly derive from patient-specific information like medications, vitals, lab values, or documented symptoms. Return your analysis as structured JSON following the format specified in the system prompt.`;
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
      
      attributionData = {
        sections: parsed.sections,
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
                sources: ["LLM response was incomplete or malformed - manual review recommended"]
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
