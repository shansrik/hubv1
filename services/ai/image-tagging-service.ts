/**
 * Image Tagging Service - Uses AI to generate relevant tags for photos
 */

import { callOpenAIVisionAPI } from './openai-service';

// Types
export interface ImageTaggingResult {
  tags: string[];
  error?: string;
}

/**
 * Generate AI tags for an image
 * @param imageData The image data (base64 string or data URL)
 * @param contextInfo Optional context information to help generate more relevant tags
 * @returns Array of relevant tags
 */
export const generateImageTags = async (
  imageData: string,
  contextInfo?: { 
    headingContext?: string;
    documentType?: string;
  }
): Promise<ImageTaggingResult> => {
  try {
    // Create system prompt
    const systemPrompt = `You are an expert image analyzer for real estate and property documentation.
Your task is to analyze the provided image and generate 3-7 relevant, specific tags that accurately describe 
the key elements in the image. Tags should be concise (1-3 words), descriptive, and relevant for 
organizing images in a real estate or property context.

Tags should ONLY include the most important visual elements and characteristics. 
Do not include generic tags like "photo" or "image".

${contextInfo?.headingContext ? `The image is being used in a section about: ${contextInfo.headingContext}` : ''}
${contextInfo?.documentType ? `This is for a ${contextInfo.documentType} document.` : ''}`;

    // Create user prompt
    const userPrompt = `Analyze this image and generate 3-7 relevant tags that describe what's in the image.
Return ONLY a JSON array of strings with no explanation or additional text.
Example response format: ["exterior view", "brick facade", "landscaping", "good condition"]`;

    // Call the Vision API
    const response = await callOpenAIVisionAPI(systemPrompt, userPrompt, imageData);
    
    // Parse the JSON response to extract the tags
    try {
      // Try to parse as JSON directly
      const tags = JSON.parse(response) as string[];
      
      // Validate that we got an array of strings
      if (Array.isArray(tags) && tags.every(tag => typeof tag === 'string')) {
        return { tags };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from text
      // Using a regex that works with older JS versions (without the 's' flag)
      const jsonMatch = response.match(/\[([\s\S]*?)\]/);
      if (jsonMatch) {
        try {
          const tags = JSON.parse(jsonMatch[0]) as string[];
          return { tags };
        } catch (nestedError) {
          throw new Error('Could not parse tags from response');
        }
      } else {
        // If there's no valid JSON, manually extract tags
        const tags = response
          .split(/[\n,]/)
          .map(line => {
            // Extract anything that looks like a tag (quotes or not)
            const match = line.match(/"([^"]+)"|'([^']+)'|([a-zA-Z\s-]+)/);
            return match ? (match[1] || match[2] || match[3]).trim() : null;
          })
          .filter((tag): tag is string => !!tag && tag.length > 0 && !tag.includes(':'));
        
        if (tags.length > 0) {
          return { tags };
        } else {
          throw new Error('Could not extract tags from response');
        }
      }
    }
  } catch (error) {
    console.error('Error generating image tags:', error);
    return { 
      tags: [], 
      error: error instanceof Error ? error.message : 'Unknown error generating tags' 
    };
  }
};