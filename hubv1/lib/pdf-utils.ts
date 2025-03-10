/**
 * PDF utility functions for exporting content
 */

/**
 * Exports a DOM element to PDF
 * @param element The DOM element to export
 * @param filename The filename for the PDF
 * @returns Promise that resolves when the PDF is exported
 */
export const exportToPDF = async (element: HTMLElement, filename: string): Promise<boolean> => {
  try {
    // Check if html2pdf is available in the browser
    if (typeof window === 'undefined' || !('html2pdf' in window)) {
      // Dynamically import html2pdf
      await import('html2pdf.js');
    }

    if (typeof window !== 'undefined' && element) {
      // @ts-ignore - html2pdf is loaded at runtime
      const html2pdf = window.html2pdf;

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5], // [top, right, bottom, left] margins in inches
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          letterRendering: true 
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().from(element).set(opt).save();
      return true;
    }
    
    console.error('Failed to export PDF: element or html2pdf not found');
    return false;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return false;
  }
};