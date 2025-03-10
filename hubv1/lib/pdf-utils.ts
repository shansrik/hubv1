/**
 * PDF utility functions for exporting content
 */
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Exports a DOM element to PDF using html2canvas and jsPDF
 * @param element The DOM element to export
 * @param filename The filename for the PDF
 * @returns Promise that resolves when the PDF is exported
 */
export const exportToPDF = async (element: HTMLElement, filename: string): Promise<boolean> => {
  try {
    if (typeof window !== 'undefined' && element) {
      // First, make a clone of the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Add a special class for print-only styling
      clonedElement.classList.add('pdf-export-container');
      
      // Remove UI elements that shouldn't appear in the PDF
      const uiElementsToRemove = clonedElement.querySelectorAll(
        '.floating-menu, .bubble-menu, button, [role="button"], .tippy-box, .group-hover\\:opacity-100'
      );
      uiElementsToRemove.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      
      // Apply typography styles to content
      const paragraphs = clonedElement.querySelectorAll('p');
      paragraphs.forEach(p => {
        (p as HTMLElement).style.fontSize = '11pt';
        (p as HTMLElement).style.lineHeight = '1.5';
        (p as HTMLElement).style.margin = '0.5em 0';
      });
      
      const h1Elements = clonedElement.querySelectorAll('h1');
      h1Elements.forEach(h1 => {
        (h1 as HTMLElement).style.fontSize = '13pt';
        (h1 as HTMLElement).style.fontWeight = 'bold';
        (h1 as HTMLElement).style.margin = '0.7em 0 0.3em';
      });
      
      const h2Elements = clonedElement.querySelectorAll('h2');
      h2Elements.forEach(h2 => {
        (h2 as HTMLElement).style.fontSize = '12pt';
        (h2 as HTMLElement).style.fontWeight = 'bold';
        (h2 as HTMLElement).style.margin = '0.6em 0 0.3em';
      });
      
      // Create a new document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter'
      });
      
      // Get the page containers
      const pageContainers = clonedElement.querySelectorAll('.page-container');
      
      // Create a temporary div to hold our styled content for rendering
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '8.5in';
      tempDiv.style.height = '11in';
      tempDiv.style.overflow = 'hidden';
      
      document.body.appendChild(tempDiv);
      
      // Process each page one at a time
      for (let i = 0; i < pageContainers.length; i++) {
        const pageContainer = pageContainers[i] as HTMLElement;
        
        // Move all transform styles to absolute positioning for rendering
        pageContainer.style.transform = 'none';
        pageContainer.style.position = 'relative';
        pageContainer.style.top = '0';
        pageContainer.style.left = '0';
        pageContainer.style.width = '8.5in';
        pageContainer.style.height = '11in';
        
        // Adjust header to be more compact
        const header = pageContainer.querySelector('.pdf-header');
        if (header) {
          (header as HTMLElement).style.top = '0.3in';
        }
        
        // Adjust content area to be larger
        const contentArea = pageContainer.querySelector('.content-container');
        if (contentArea) {
          (contentArea as HTMLElement).style.top = '0.8in';
          (contentArea as HTMLElement).style.bottom = '0.6in';
          (contentArea as HTMLElement).style.maxHeight = 'calc(11in - 1.4in)';
        }
        
        // Add current page to temp div for rendering
        tempDiv.innerHTML = '';
        tempDiv.appendChild(pageContainer.cloneNode(true));
        
        // Convert to canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true
        });
        
        // Add to PDF (add new page if not the first page)
        if (i > 0) {
          pdf.addPage();
        }
        
        // Convert canvas to image and add to PDF
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', 0, 0, 8.5, 11, '', 'FAST');
      }
      
      // Remove the temporary div
      document.body.removeChild(tempDiv);
      
      // Save the PDF
      pdf.save(filename);
      
      return true;
    }
    
    console.error('Failed to export PDF: element not found or not in browser');
    return false;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return false;
  }
};