import { SourceAttribution, AttributionSection, AttributionSource } from '@/types';

// More accurate token estimation (1 token ≈ 3.5 characters for medical text)
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 3.5);
};

// Optimized system prompt for source attribution analysis
const ATTRIBUTION_SYSTEM_PROMPT = `Analyze the care plan and map each statement to its supporting evidence. Return ONLY valid JSON:

{
  "sections": [
    {
      "section": "Section Name",
      "statements": [
        {
          "statement": "Exact text",
          "sources": ["Patient Record: [data]", "Clinical Reasoning: [explanation]", "Standard Practice: [guideline]"],
          "attribution_type": "patient_data|clinical_reasoning|standard_practice|mixed"
        }
      ]
    }
  ]
}

Map ALL statements. Categorize support type. Be concise.`;

// Helper function to chunk large text
const chunkText = (text: string, maxChunkSize: number = 2000): string[] => {
  if (text.length <= maxChunkSize) return [text];
  
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};

// Generate attribution with chunking for large care plans
const generateAttributionWithChunking = async (
  carePlanText: string, 
  patientRecordText: string, 
  apiKey: string
): Promise<SourceAttribution> => {
  const carePlanChunks = chunkText(carePlanText, 2000); // Larger chunks
  const allSections: AttributionSection[] = [];
  
  console.log(`Processing ${carePlanChunks.length} chunks for large care plan...`);
  
  for (let i = 0; i < carePlanChunks.length; i++) {
    const chunk = carePlanChunks[i];
    const chunkTokens = estimateTokens(chunk);
    const patientTokens = estimateTokens(patientRecordText);
    const systemTokens = estimateTokens(ATTRIBUTION_SYSTEM_PROMPT);
    const totalChunkTokens = systemTokens + chunkTokens + patientTokens;
    
    console.log(`Processing chunk ${i + 1}/${carePlanChunks.length} (${chunk.length} chars, ~${totalChunkTokens} tokens)`);
    
    const userPrompt = buildAttributionPrompt(chunk, patientRecordText);
    
    try {
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
          max_tokens: 3000 // Reasonable for chunks
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Chunk ${i + 1} API error:`, response.status, errorText);
        continue; // Skip this chunk and continue with others
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error(`Invalid API response for chunk ${i + 1}:`, data);
        continue; // Skip this chunk and continue with others
      }
      
      const attributionText = data.choices[0].message.content;
      
      if (attributionText && attributionText.trim().length > 0) {
        try {
          const chunkData = JSON.parse(attributionText.trim());
          if (chunkData.sections && Array.isArray(chunkData.sections)) {
            allSections.push(...chunkData.sections);
          }
        } catch (parseError) {
          console.error(`Error parsing chunk ${i + 1}:`, parseError);
        }
      }
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
    }
  }
  
  return {
    sections: allSections,
    generated_at: new Date().toISOString(),
    model_used: 'openai/gpt-oss-20b:free'
  };
};

// Optimized user prompt for attribution analysis
const buildAttributionPrompt = (carePlanText: string, patientRecordText: string): string => {
  return `CARE PLAN:
${carePlanText}

PATIENT DATA:
${patientRecordText}

Analyze each statement. Map to patient data, clinical reasoning, or standard practice. Return JSON.`;
};

// Generate source attribution using OpenRouter API with chunking
export const generateSourceAttribution = async (
  carePlanText: string, 
  patientRecordText: string
): Promise<SourceAttribution> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  // Token estimation and monitoring
  const systemTokens = estimateTokens(ATTRIBUTION_SYSTEM_PROMPT);
  const carePlanTokens = estimateTokens(carePlanText);
  const patientRecordTokens = estimateTokens(patientRecordText);
  const totalInputTokens = systemTokens + carePlanTokens + patientRecordTokens;
  
  console.log(`Token estimation - System: ${systemTokens}, Care Plan: ${carePlanTokens}, Patient: ${patientRecordTokens}, Total: ${totalInputTokens}`);
  
  // Check if we need to chunk the care plan - only chunk when absolutely necessary
  const maxInputTokens = 5000; // Only chunk for very large inputs
  
  if (totalInputTokens > maxInputTokens) {
    console.log(`Large input detected (${totalInputTokens} tokens), using chunking approach...`);
    return await generateAttributionWithChunking(carePlanText, patientRecordText, apiKey);
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
        max_tokens: 6000 // Back to 4000 to avoid hitting limits
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
