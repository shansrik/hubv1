/**
 * AI Service for interacting with Claude and OpenAI APIs
 */

// Claude interfaces
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

// OpenAI interfaces
interface OpenAIRequestBody {
  model: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{
      type: string;
      [key: string]: any;
    }>;
  }[];
  max_tokens?: number;
  temperature?: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
let CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
let OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Function to set API keys programmatically if needed
export const setClaudeApiKey = (apiKey: string) => {
  CLAUDE_API_KEY = apiKey;
};

export const setOpenAIApiKey = (apiKey: string) => {
  OPENAI_API_KEY = apiKey;
};

/**
 * Calls the Claude API with the given prompts
 * @param systemPrompt The system prompt to guide Claude's behavior
 * @param userPrompt The user's specific request
 * @returns The AI-generated text response
 */
export const callClaudeAPI = async (systemPrompt: string, userPrompt: string): Promise<string> => {
  try {
    if (!CLAUDE_API_KEY) {
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

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
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
 * Calls the OpenAI API with the given prompts
 * @param systemPrompt The system prompt to guide OpenAI's behavior
 * @param userPrompt The user's specific request
 * @returns The AI-generated text response
 */
export const callOpenAIAPI = async (systemPrompt: string, userPrompt: string): Promise<string> => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody: OpenAIRequestBody = {
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as OpenAIResponse;
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
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