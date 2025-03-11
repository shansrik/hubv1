/**
 * AI prompt templates for different enhancement types
 */

/**
 * Reference materials for AI context
 */
export const referenceContext = `
# REFERENCE MATERIALS AND GUIDELINES

## TERMINOLOGY
- Reserve Fund: A fund established by a condominium corporation to cover the cost of major repairs and replacement of common elements and assets of the corporation
- Reserve Fund Study: An analysis of a condominium corporation's reserve fund conducted by qualified professionals
- Class 1: A comprehensive reserve fund study based on a site inspection, destructive testing, and analysis of all components
- Common Elements: The portions of a condominium property that are not part of any unit and are shared by all owners

## STYLE GUIDELINES
- Use active voice for clarity
- Write in third person (avoid "I", "we", "you")
- Keep sentences concise (generally under 25 words)
- Use bullet points for lists of items
- Always use numerals for measurements, percentages, and dollar amounts

## TONE GUIDELINES
- Formal but accessible: Professional but not overly technical
- Factual: Evidence-based statements rather than opinions
- Solution-oriented: Focus on practical recommendations
`

/**
 * System prompt template
 */
export const getSystemPrompt = (hasPhotoContext: boolean = false): string => {
  const basePrompt = `
  You are an expert text editor who helps improve document text based on specific instructions.
  Your task is to enhance the given text according to the specific request.
  
  ${referenceContext}
  
  Guidelines:
  - Maintain the original meaning and key information
  - Follow the style guidelines provided above
  - Only make the requested changes
  - Use proper grammar and punctuation
  - Use terminology correctly as defined in the reference materials
  - Be concise yet clear
  - Return ONLY the enhanced text without any additional comments
  `

  // Enhance the prompt if there's a photo
  if (hasPhotoContext) {
    return `${basePrompt}\n\nIMPORTANT: There is a selected photo that should be analyzed and referenced in your response. Your task is to enhance the text while incorporating relevant details from this photo. Make sure to explicitly reference visual elements from the photo in your response.`
  }

  return basePrompt
}

/**
 * User prompt templates based on enhancement type
 */
export const getUserPrompt = (
  promptType: string, 
  text: string, 
  photoDescription: string | null = null,
  customPromptText: string | null = null
): string => {
  // Base context for photo if available
  const photoContext = photoDescription 
    ? `\n\nReference the following image description in your response: "${photoDescription}"\n` 
    : ''
  
  if (promptType === 'custom' && customPromptText) {
    return `${customPromptText}${photoContext}\n\nHere is the original text:\n"${text}"\n\nProvide your enhanced version that incorporates both the text and any image context provided:`
  }
  
  // Standard prompt types with photo context
  switch (promptType) {
    case 'follow-up':
      return `Add a compelling follow-up sentence to this text that expands on the main idea.${photoContext}\nOriginal text: "${text}"\nOnly output the new sentence:`
    case 'professional':
      return `Rewrite this text in a more professional, formal tone suitable for business communication.${photoContext}\nOriginal text: "${text}"\nProvide the rewritten text:`
    case 'concise':
      return `Make this text more concise while preserving the key information.${photoContext}\nOriginal text: "${text}"\nProvide the concise version:`
    case 'expand':
      return `Expand this text with more details and explanation.${photoContext}\nOriginal text: "${text}"\nProvide the expanded version:`
    case 'grammar':
      return `Fix any grammar, spelling, or punctuation errors in this text without changing its meaning.${photoContext}\nOriginal text: "${text}"\nProvide the corrected text:`
    default:
      return `Improve this text${photoDescription ? ' and incorporate details from the referenced image' : ''}.${photoContext}\nOriginal text: "${text}"\nProvide the improved version:`
  }
}