/**
 * Service for processing and resizing images before sending to AI services
 */

/**
 * Service for processing images before AI analysis
 */
export const imageProcessingService = {
  /**
   * Processes an image from a DOM element or URL for use with AI services
   * @param imageId The ID of the image to process
   * @returns A promise that resolves to the processed image data URL
   */
  getProcessedImage: async (imageId: string): Promise<string> => {
    try {
      // Find the image in the DOM
      const photoElement = document.querySelector(`[data-photo-id="${imageId}"]`) as HTMLElement;
      if (!photoElement) throw new Error('Image element not found');
      
      const imgElement = photoElement.querySelector('img') as HTMLImageElement;
      if (!imgElement) throw new Error('Image not found within container');
      
      // Get the image source
      const imageSrc = imgElement.src;
      
      // Process the image (resize and compress)
      const processedImageData = await resizeAndCompressImage(imageSrc);
      return processedImageData;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }
};

/**
 * Resizes and compresses an image to optimize for AI API transmission
 * @param src The source URL or data URL of the image
 * @param maxWidth Maximum width for the resized image
 * @param maxHeight Maximum height for the resized image
 * @param quality JPEG quality (0-1)
 * @returns A promise that resolves to the processed image data URL
 */
const resizeAndCompressImage = async (
  src: string, 
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
      
      console.log(`Original image dimensions: ${width}x${height}`);
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round(width * (maxHeight / height));
        height = maxHeight;
      }
      
      console.log(`Resized dimensions: ${width}x${height}`);
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      // Draw with white background to handle transparency
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      
      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get resized image as data URL with specified quality
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Verify the data URL format
      if (!dataUrl.startsWith('data:image/jpeg;base64,')) {
        console.error("Invalid data URL format generated");
        reject(new Error("Invalid data URL format"));
        return;
      }
      
      // Log the size of the processed image
      console.log(`Processed image size: ${dataUrl.length} bytes`);
      
      // Check if the image is still too large
      if (dataUrl.length > 500000) { // Over 500KB
        console.log("Image is still large, applying more aggressive compression");
        // Try with lower quality
        resolve(resizeAndCompressImage(src, 640, 480, 0.5));
      } else {
        resolve(dataUrl);
      }
    };
    
    img.onerror = (e) => {
      console.error("Image load error:", e);
      reject(new Error("Failed to load image"));
    };
    
    img.src = src;
  });
};