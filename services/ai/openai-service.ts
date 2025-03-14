/**
 * OpenAI Service for interacting with the OpenAI API
 */

// OpenAI API Types
export interface OpenAIRequestBody {
  model: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{
      type: string;
      [key: string]: unknown;
    }>;
  }[];
  max_tokens?: number;
  temperature?: number;
}

export interface OpenAIResponse {
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

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
 * Processes an image for OpenAI's Vision API
 * @param photoData The image data as a base64 string or data URL
 * @returns Formatted image content object for the API request
 */
export const processImageForOpenAI = (photoData: string): { 
  type: string; 
  image_url: { 
    url: string; 
    detail: string; 
  }; 
} | null => {
  if (!photoData) return null;

  try {
    let base64Data: string;
    
    // Handle data URL vs raw base64
    if (photoData.startsWith('data:image')) {
      const matches = photoData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      
      if (matches && matches.length >= 3) {
        base64Data = matches[2].trim();
      } else {
        throw new Error("Invalid data URL format");
      }
    } else {
      // It's raw base64, use it directly
      base64Data = photoData.trim().replace(/\s/g, '');
    }
    
    // Validate base64 data
    if (!base64Data || base64Data.length === 0) {
      throw new Error("Empty base64 data");
    }
    
    // Return the formatted image content
    return {
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${base64Data}`,
        detail: "low" // Using 'low' detail for better performance
      }
    };
  } catch (error) {
    console.error("Error processing image for OpenAI:", error);
    return null;
  }
};

/**
 * Sends a multimodal request to OpenAI with text and image
 * @param systemPrompt The system prompt to guide OpenAI's behavior
 * @param userPrompt The user's specific request
 * @param photoData The image data as a base64 string or data URL
 * @returns The AI-generated text response
 */
export const callOpenAIVisionAPI = async (
  systemPrompt: string, 
  userPrompt: string, 
  photoData: string
): Promise<string> => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Process the image
    const imageContent = processImageForOpenAI(photoData);
    
    if (!imageContent) {
      throw new Error('Failed to process image data');
    }

    // Create the request body with image
    const requestBody: OpenAIRequestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            { type: "text", text: userPrompt },
            imageContent
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    };

    // Make the API request
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
      throw new Error(`OpenAI Vision API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as OpenAIResponse;
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling OpenAI Vision API:', error);
    throw error;
  }
};

// Reference materials utilities
/**
 * Creates a formatted reference context from materials
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