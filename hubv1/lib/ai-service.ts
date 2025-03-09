/**
 * AI Service for interacting with Claude API
 */

interface ClaudeRequestBody {
  model: string;
  max_tokens: number;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
  temperature?: number;
  system?: string;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: {
    type: string;
    text: string;
  }[];
  model: string;
  stop_reason: string;
  stop_sequence: null | string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Replace with your actual API key and endpoint setup
const API_URL = 'https://api.anthropic.com/v1/messages';
let API_KEY = process.env.CLAUDE_API_KEY || '';

// Function to set API key programmatically if needed
export const setClaudeApiKey = (apiKey: string) => {
  API_KEY = apiKey;
};

/**
 * Calls the Claude API with the given prompts
 * @param systemPrompt The system prompt to guide Claude's behavior
 * @param userPrompt The user's specific request
 * @returns The AI-generated text response
 */
export const callClaudeAPI = async (systemPrompt: string, userPrompt: string): Promise<string> => {
  try {
    if (!API_KEY) {
      throw new Error('Claude API key not configured');
    }

    const requestBody: ClaudeRequestBody = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      system: systemPrompt,
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as ClaudeResponse;
    return data.content[0]?.text || '';
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
};

/**
 * Load reference materials from specified files or endpoints
 * @param sourcePaths Array of paths to reference material files
 * @returns Combined reference materials as a string
 */
export const loadReferenceContext = async (sourcePaths: string[]): Promise<string> => {
  try {
    const materials = await Promise.all(
      sourcePaths.map(async (path) => {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to load reference material from ${path}`);
        }
        return await response.text();
      })
    );

    return materials.join('\n\n');
  } catch (error) {
    console.error('Error loading reference materials:', error);
    return ''; // Return empty string if loading fails
  }
};

/**
 * Creates a formatted reference context from your materials
 * @param materials Object containing various reference materials
 * @returns Formatted reference context string
 */
export const createReferenceContext = (materials: {
  terminology?: Record<string, string>;
  styleGuide?: string;
  namingConventions?: string;
  toneGuidelines?: string;
  examples?: Record<string, string>;
  legalText?: string;
}): string => {
  let context = 'REFERENCE MATERIALS AND GUIDELINES\n\n';

  if (materials.terminology) {
    context += 'TERMINOLOGY:\n';
    for (const [term, definition] of Object.entries(materials.terminology)) {
      context += `- ${term}: ${definition}\n`;
    }
    context += '\n';
  }

  if (materials.styleGuide) {
    context += `STYLE GUIDELINES:\n${materials.styleGuide}\n\n`;
  }

  if (materials.namingConventions) {
    context += `NAMING CONVENTIONS:\n${materials.namingConventions}\n\n`;
  }

  if (materials.toneGuidelines) {
    context += `TONE GUIDELINES:\n${materials.toneGuidelines}\n\n`;
  }

  if (materials.examples) {
    context += 'EXAMPLES:\n';
    for (const [exampleType, example] of Object.entries(materials.examples)) {
      context += `### ${exampleType} Example:\n${example}\n\n`;
    }
  }

  if (materials.legalText) {
    context += `REQUIRED LEGAL TEXT:\n${materials.legalText}\n\n`;
  }

  return context;
};