import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// PDF Export utility function
export async function exportToPDF(contentElement: HTMLElement, filename: string = 'document.pdf') {
  if (!contentElement) return
  
  // Configure PDF based on US Letter size
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter' // 8.5x11 inches
  })
  
  try {
    // Convert the entire document to an image
    const canvas = await html2canvas(contentElement, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Allow images from different domains
      logging: false
    })
    
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 8.5 // Letter width in inches
    const pageHeight = 11 // Letter height in inches
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // If content is longer than one page, split it into multiple pages
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight;
    }
    
  } catch (err) {
    console.error('Error generating PDF:', err)
    throw err
  }
  
  // Save the PDF
  pdf.save(filename)
  return pdf
}

