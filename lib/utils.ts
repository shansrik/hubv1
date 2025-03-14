import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Client-side PDF Export utility function using DOM serialization
export async function exportToPDF(contentElement: HTMLElement, filename: string = 'document.pdf') {
  if (!contentElement) return
  
  try {
    // Clone the DOM element to avoid modifying the original
    const elementClone = contentElement.cloneNode(true) as HTMLElement
    
    // Convert the element to a serialized HTML string with styles
    const serializedHTML = serializeElementWithStyles(elementClone)
    
    // Create form data for the API request
    const formData = new FormData()
    formData.append('html', serializedHTML)
    formData.append('filename', filename)
    
    // Show loading indicator
    const loadingToast = showToast('Generating PDF...', 'Please wait while your document is prepared.')
    
    // Send to server endpoint for PDF generation
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      body: formData
    })
    
    // Hide loading indicator
    if (loadingToast && loadingToast.dismiss) {
      loadingToast.dismiss()
    }
    
    if (!response.ok) {
      throw new Error('PDF generation failed')
    }
    
    // Get the PDF blob
    const pdfBlob = await response.blob()
    
    // Create a download link and trigger download
    const downloadUrl = URL.createObjectURL(pdfBlob)
    const downloadLink = document.createElement('a')
    downloadLink.href = downloadUrl
    downloadLink.download = filename
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    
    // Clean up object URL
    URL.revokeObjectURL(downloadUrl)
    
    // Show success message
    showToast('PDF Generated', 'Your document has been downloaded.')
    
    return true
  } catch (err) {
    console.error('Error generating PDF:', err)
    showToast('PDF Generation Failed', 'There was an error creating your PDF.', 'destructive')
    throw err
  }
}

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

// Helper function to show toast notifications
function showToast(title: string, description: string, variant: 'default' | 'destructive' = 'default') {
  // Simple implementation that works without dependencies
  console.log(`${title}: ${description}`)
  
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
  }
}

// Helper function to extract and serialize styles
function serializeElementWithStyles(element: HTMLElement): string {
  // Create a container for the serialized content
  const container = document.createElement('div')
  
  // Apply basic styling that mimics a print layout
  container.style.width = '8.5in'
  container.style.minHeight = '11in'
  container.style.padding = '0.5in'
  container.style.boxSizing = 'border-box'
  container.style.backgroundColor = '#fff'
  container.style.color = '#000'
  
  // Clone the element again to work with
  const clone = element.cloneNode(true) as HTMLElement
  
  // Append to container
  container.appendChild(clone)
  
  // Extract all stylesheets to include
  let styles = ''
  
  // Get computed styles for all elements
  extractComputedStyles(clone)
  
  // Find and include all stylesheet links
  const styleSheets = document.querySelectorAll('link[rel="stylesheet"]')
  styleSheets.forEach(sheet => {
    const href = (sheet as HTMLLinkElement).href
    if (href) {
      styles += `<link rel="stylesheet" href="${href}">\n`
    }
  })
  
  // Find and include all style elements
  const styleElements = document.querySelectorAll('style')
  styleElements.forEach(style => {
    styles += style.outerHTML + '\n'
  })
  
  // Create the final HTML document
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${document.title || 'Document'}</title>
        ${styles}
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            @page { size: letter; margin: 0; }
          }
        </style>
      </head>
      <body>
        ${container.outerHTML}
      </body>
    </html>
  `
  
  return html
}

// Recursively apply computed styles to elements
function extractComputedStyles(element: HTMLElement) {
  // Get computed styles
  const computedStyle = window.getComputedStyle(element)
  
  // Create inline style string
  let inlineStyles = element.getAttribute('style') || ''
  
  // Add important computed styles
  const importantStyles = [
    'font-family', 'font-size', 'font-weight', 'color', 'background-color',
    'margin', 'padding', 'border', 'display', 'width', 'height',
    'text-align', 'line-height', 'position'
  ]
  
  importantStyles.forEach(style => {
    const value = computedStyle.getPropertyValue(style)
    if (value && !inlineStyles.includes(`${style}:`)) {
      inlineStyles += `${style}:${value};`
    }
  })
  
  // Set inline styles
  if (inlineStyles) {
    element.setAttribute('style', inlineStyles)
  }
  
  // Process children
  Array.from(element.children).forEach(child => {
    if (child instanceof HTMLElement) {
      extractComputedStyles(child)
    }
  })
}

