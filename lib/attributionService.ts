import { SourceAttribution, AttributionSection, AttributionSource } from '@/types';

// System prompt for source attribution analysis
const ATTRIBUTION_SYSTEM_PROMPT = `You are a clinical AI assistant specializing in **source attribution analysis** for pharmacist care plans.

Your task is to analyze a generated care plan and map each statement back to specific snippets from the original patient record.

### INSTRUCTIONS
1. **Parse the care plan** into its main sections (Problem List, SMART Goals, Interventions, Monitoring)
2. **For each statement** in the care plan, identify which parts of the patient record support or justify that statement
3. **Extract exact quotes** or paraphrases from the patient record that relate to each care plan statement
4. **Be precise** - only include sources that directly support the statement
5. **Format your response** as structured JSON matching the required schema

### OUTPUT FORMAT
Return a JSON object with this exact structure:
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

### IMPORTANT
- Use exact text from the patient record when possible
- If a statement has no clear source, include "No specific source found in patient record"
- Be thorough but concise
- Focus on clinical relevance and accuracy`;

// Build the user prompt for attribution analysis
const buildAttributionPrompt = (carePlanText: string, patientRecordText: string): string => {
  return `### CARE PLAN TO ANALYZE:
${carePlanText}

### ORIGINAL PATIENT RECORD:
${patientRecordText}

### TASK:
Analyze the care plan above and map each statement back to supporting evidence from the patient record. Return your analysis as structured JSON following the format specified in the system prompt.`;
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
        max_tokens: 3000
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
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = attributionText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : attributionText;
      
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
      throw new Error('Failed to parse attribution response as JSON');
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
