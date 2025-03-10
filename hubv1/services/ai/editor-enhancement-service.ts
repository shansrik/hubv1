/**
 * Service for AI text enhancements in the editor
 */
import { getSystemPrompt, getUserPrompt } from './prompt-templates'

/**
 * Service for interacting with AI endpoints to enhance editor content
 */
export const editorEnhancementService = {
  /**
   * Generates text with AI based on a prompt
   * @param currentText Optional current text for context
   * @param customPrompt Custom prompt instructions
   * @returns Promise resolving to generated text
   */
  generateText: async (currentText = "", customPrompt = ""): Promise<string> => {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt: `You are a professional report writer for property inspection reports. 
                        Use professional, technical language that is concise and factual.`,
          userPrompt: `${customPrompt || 'Write a detailed technical paragraph'}.
                      ${currentText ? `The current text is: "${currentText}"` : ''}
                      The text should be factual, professional, and provide relevant observations.`,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error("Text generation error:", error);
      throw error;
    }
  },
  
  /**
   * Generates text with AI based on both a prompt and an image
   * @param currentText Optional current text for context
   * @param customPrompt Custom prompt instructions
   * @param photoData The processed image data as a data URL
   * @returns Promise resolving to generated text
   */
  generateTextWithImage: async (currentText = "", customPrompt = "", photoData: string): Promise<string> => {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt: `You are a professional report writer for property inspection reports. 
                        Use professional, technical language that is concise and factual.
                        Analyze the image in detail and incorporate your observations in your response.`,
          userPrompt: `${customPrompt || 'Write a technical description'} 
                      of the image I'm sharing with you.
                      ${currentText ? `The current text is: "${currentText}"` : ''}
                      The text should be factual, professional, and provide relevant observations about what's shown.`,
          includePhoto: true,
          photoData: photoData,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error("Image-based text generation error:", error);
      throw error;
    }
  }
};