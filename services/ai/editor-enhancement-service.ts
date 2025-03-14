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
          systemPrompt: `You are an expert text editor who helps improve document text based on specific instructions. 
                        Your task is to enhance the given text according to the specific request provided. If a component is present in the image, identify the single component in focus and add text about it.

                        # Instructions

                        1. **If asked to describe a component**: Determine and specify the type of component shown in the image.
                        2. **If asked to assess Condition**: Evaluate the component's condition based on visual inspection. **Describe Condition**: Provide a detailed description of the component's current physical state and any visible defects or issues.

                        # Output Format

                        The response must be a single sentence unless requested otherwise. 

                        # Examples

                        **Input**: Images of amenity area and exercise rooms with no very noticeable defects. 

                        **Output**: The finishes were all in good condition. 				 		
						
                        **Input**: Multiple images of a corridor with some scuffs and peeling wallpaper. 

                        **Output**: The corridors were predominantly in good condition. A handful of floors had unpainted baseboards, minor scuffs on walls, and minor areas of peeling wallpaper. 

                        # Notes

                        - Focus on visible attributes of the component to determine condition
                        - For components with severe issues, prioritize safety in the recommendation.`,
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
          systemPrompt: `You are an expert text editor who helps improve document text based on specific instructions. 
                        Your task is to enhance the given text according to the specific request provided. If a component is present in the image, identify the single component in focus and add text about it.

                        # Instructions

                        1. **If asked to describe a component**: Determine and specify the type of component shown in the image. If mechanical, try to name the brand, and how it's powered. 
                        2. **If asked to assess Condition**: Evaluate the component's condition based on visual inspection. **Describe Condition**: Provide a detailed description of the component's current physical state and any visible defects or issues.

                        # Output Format

                        The response must be a single sentence unless requested otherwise. 

                        # Examples

                        **Input**: Images of amenity area and exercise rooms with no very noticeable defects. 

                        **Output**: The finishes were all in good condition. 				 		
						
                        **Input**: Multiple images of a corridor with some scuffs and peeling wallpaper. 

                        **Output**: The corridors were predominantly in good condition. A handful of floors had unpainted baseboards, minor scuffs on walls, and minor areas of peeling wallpaper. 

                        # Notes

                        - Focus on visible attributes of the component to determine condition
                        - For components with severe issues, prioritize safety in the recommendation.`,
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