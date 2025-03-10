/**
 * Utility functions for document editor
 */

/**
 * Gets the selected photo from the UI
 * @returns Selected photo object or null if none is selected
 */
export const getSelectedPhotoFromUI = () => {
  // Check if there's a photo selected indicator in the UI
  const selectedPhotoIndicator = document.querySelector('.bg-blue-100.text-blue-800');
  const hasSelectedPhoto = !!selectedPhotoIndicator;
  
  if (!hasSelectedPhoto) return null;
  
  // Find the actual selected photo
  const selectedPhotoBadges = document.querySelectorAll('[data-photo-id].border-blue-500');
  
  if (selectedPhotoBadges.length === 0) return null;
  
  const photoElement = selectedPhotoBadges[0] as HTMLElement;
  const photoId = photoElement.getAttribute('data-photo-id') || '';
  const imgElement = photoElement.querySelector('img');
  const nameElement = photoElement.querySelector('h4');
  const descElement = photoElement.querySelector('p');
  
  if (!imgElement) return null;
  
  return {
    id: photoId,
    path: imgElement.getAttribute('src') || '',
    name: nameElement?.textContent || 'Selected Photo',
    description: descElement?.textContent || 'No description available'
  };
};

/**
 * Resizes an image for optimal use with AI APIs
 * @param dataUrl Image data URL
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @param quality JPEG quality (0-1)
 * @returns Resized image data URL
 */
export const resizeImage = (
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round(width * (maxHeight / height));
        height = maxHeight;
      }
      
      // Create canvas and resize image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      // Draw with white background to handle transparency
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      
      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get resized image as data URL
      const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(resizedDataUrl);
    };
    
    img.onerror = (e) => {
      reject(new Error("Failed to load image"));
    };
    
    img.src = dataUrl;
  });
};

/**
 * Creates a reference context for AI prompts
 * @returns Formatted reference context string
 */
export const createEditorReferenceContext = (): string => {
  return `
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
  `;
};