import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// PDF Export utility function
export async function exportToPDF(contentElement: HTMLElement, filename: string = 'report.pdf') {
  if (!contentElement) return
  
  // Configure PDF based on US Letter size
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter' // 8.5x11 inches
  })
  
  // Get all pages
  const pageElements = contentElement.querySelectorAll('.report-page')
  
  if (pageElements.length === 0) {
    // If no page elements found, export the entire container
    try {
      const canvas = await html2canvas(contentElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Allow images from different domains
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 8.5 // Letter width in inches
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    } catch (err) {
      console.error('Error generating PDF:', err)
      throw err
    }
  } else {
    // Process each page individually
    for (let i = 0; i < pageElements.length; i++) {
      try {
        if (i > 0) pdf.addPage()
        
        const pageElement = pageElements[i] as HTMLElement
        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          logging: false
        })
        
        const imgData = canvas.toDataURL('image/png')
        
        // Add image to PDF (full page)
        pdf.addImage(imgData, 'PNG', 0, 0, 8.5, 11)
      } catch (err) {
        console.error(`Error generating page ${i+1}:`, err)
      }
    }
  }
  
  // Save the PDF
  pdf.save(filename)
  return pdf
}

