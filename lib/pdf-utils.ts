/**
 * PDF utility functions for exporting content
 */

// Types for PDF utilities

// Define interfaces for toast system
interface ToastParams {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

interface ToastAPI {
  toast: (params: ToastParams) => { dismiss: () => void };
}

interface WindowWithToast extends Window {
  __toast?: ToastAPI;
}

/**
 * Exports a DOM element to PDF using server-side PDF generation
 * This preserves the original functionality but removes canvas dependency
 * @param element The DOM element to export
 * @param filename The filename for the PDF
 * @returns Promise that resolves when the PDF is exported
 */
export const exportToPDF = async (element: HTMLElement, filename: string): Promise<boolean> => {
  try {
    if (typeof window !== 'undefined' && element) {
      // Show loading indicator
      const loadingToast = showToast('Generating PDF...', 'Please wait while your document is prepared.');
      
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
      
      // Apply typography styles to content exactly as in the original implementation
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
      
      // Get the page containers - maintain the original page handling logic
      const pageContainers = clonedElement.querySelectorAll('.page-container');
      
      // Create a formatted document with each page properly laid out
      const formattedDocument = document.createElement('div');
      formattedDocument.className = 'pdf-document';
      formattedDocument.style.width = '8.5in';
      formattedDocument.style.margin = '0 auto';
      formattedDocument.style.backgroundColor = '#fff';
      
      // Process each page one at a time - maintaining the original page-by-page approach
      for (let i = 0; i < pageContainers.length; i++) {
        const pageContainer = pageContainers[i] as HTMLElement;
        const pageClone = pageContainer.cloneNode(true) as HTMLElement;
        
        // Style the page exactly as in the original implementation
        pageClone.style.transform = 'none';
        pageClone.style.position = 'relative';
        pageClone.style.top = '0';
        pageClone.style.left = '0';
        pageClone.style.width = '8.5in';
        pageClone.style.height = '11in';
        pageClone.style.pageBreakAfter = 'always';
        pageClone.style.margin = '0';
        pageClone.style.padding = '0';
        pageClone.style.boxSizing = 'border-box';
        pageClone.style.overflow = 'hidden';
        
        // Apply the same adjustments to headers and content areas as the original
        const header = pageClone.querySelector('.pdf-header');
        if (header) {
          (header as HTMLElement).style.top = '0.3in';
        }
        
        const contentArea = pageClone.querySelector('.content-container');
        if (contentArea) {
          (contentArea as HTMLElement).style.top = '0.8in';
          (contentArea as HTMLElement).style.bottom = '0.6in';
          (contentArea as HTMLElement).style.maxHeight = 'calc(11in - 1.4in)';
        }
        
        // Add the page to our formatted document
        formattedDocument.appendChild(pageClone);
      }
      
      // Serialize the HTML content with all the page-specific formatting preserved
      const serializedHTML = createPrintableHTML(formattedDocument);
      
      // Create form data for the API request
      const formData = new FormData();
      formData.append('html', serializedHTML);
      formData.append('filename', filename);
      formData.append('isMultiPage', 'true'); // Signal that this is multi-page content
      
      // Send to server endpoint for PDF generation
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        body: formData
      });
      
      // Hide loading indicator
      if (loadingToast && loadingToast.dismiss) {
        loadingToast.dismiss();
      }
      
      if (!response.ok) {
        throw new Error('PDF generation failed');
      }
      
      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create a download link and trigger download
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up object URL
      URL.revokeObjectURL(downloadUrl);
      
      // Show success message
      showToast('PDF Generated', 'Your document has been downloaded.');
      
      return true;
    }
    
    console.error('Failed to export PDF: element not found or not in browser');
    return false;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    showToast('PDF Generation Failed', 'There was an error creating your PDF.', 'destructive');
    return false;
  }
};

// Helper function to show toast notifications
function showToast(title: string, description: string, variant: 'default' | 'destructive' = 'default') {
  // Simple implementation that works without dependencies
  console.log(`${title}: ${description}`);
  
  // Try to use the application's toast system if available in global scope
  try {
    // Check for global toast API
    const globalToast = (window as WindowWithToast).__toast;
    if (typeof globalToast?.toast === 'function') {
      return globalToast.toast({
        title,
        description,
        variant
      });
    }
  } catch (e) {
    console.warn('Toast system not available', e);
  }
  
  // Fallback implementation
  return {
    dismiss: () => console.log('Toast dismissed')
  };
}

// Helper function to create printable HTML with all styles preserved
function createPrintableHTML(element: HTMLElement): string {
  // Create a container for the printable content
  const container = document.createElement('div');
  container.appendChild(element.cloneNode(true));
  
  // Extract all stylesheets to include
  let styles = '';
  
  // Find and include all stylesheet links
  const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');
  styleSheets.forEach(sheet => {
    const href = (sheet as HTMLLinkElement).href;
    if (href) {
      styles += `<link rel="stylesheet" href="${href}">\n`;
    }
  });
  
  // Find and include all style elements
  const styleElements = document.querySelectorAll('style');
  styleElements.forEach(style => {
    styles += style.outerHTML + '\n';
  });
  
  // Create the final HTML document with print-specific CSS
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${document.title || 'Document'}</title>
        ${styles}
        <style>
          @page {
            size: letter portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: white;
          }
          .page-container {
            width: 8.5in;
            height: 11in;
            page-break-after: always;
            position: relative;
            margin: 0;
            padding: 0;
            overflow: hidden;
            box-sizing: border-box;
            border: none;
          }
          /* Ensure headers are positioned correctly */
          .pdf-header {
            position: absolute;
            top: 0.3in;
            left: 0.5in;
            right: 0.5in;
          }
          /* Ensure content areas are properly sized */
          .content-container {
            position: absolute;
            top: 0.8in;
            left: 0.5in;
            right: 0.5in;
            bottom: 0.6in;
            overflow: hidden;
          }
          /* Reset any potentially problematic styles */
          * {
            text-shadow: none !important;
            box-shadow: none !important;
          }
          /* Hide any unwanted elements */
          .no-print, button, [role="button"] {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${container.innerHTML}
      </body>
    </html>
  `;
  
  return html;
}