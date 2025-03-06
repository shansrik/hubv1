"use client"

import { useState, useCallback } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from "@/components/ui/button"

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFDropZoneProps {
  onImport: (pdfPages: string[], pageCount: number) => void
  isActive?: boolean
}

export default function PDFDropZone({ onImport, isActive = false }: PDFDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageImages, setPageImages] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { toast } = useToast()
  
  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isActive) setIsDragging(true)
  }, [isActive])
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isActive) setIsDragging(true)
  }, [isActive])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])
  
  // Process dropped file
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (!isActive) return
    
    const { files } = e.dataTransfer
    if (files.length === 0) return
    
    const file = files[0]
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please drop a PDF file",
        variant: "destructive"
      })
      return
    }
    
    setPdfFile(file)
  }, [isActive, toast])
  
  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target
    if (!files || files.length === 0) return
    
    const file = files[0]
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive"
      })
      return
    }
    
    setPdfFile(file)
  }, [toast])
  
  // Handle PDF document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }, [])
  
  // Convert PDF pages to images
  const convertPagesToImages = useCallback(async () => {
    if (!pdfFile || !numPages) return
    
    setIsProcessing(true)
    const images: string[] = []
    
    try {
      // This is where we would convert PDF pages to images
      // For now, we'll simulate it with placeholders
      for (let i = 0; i < numPages; i++) {
        // In a real implementation, we would render each page to canvas and convert to image
        // For simplicity, we're just adding placeholder images
        images.push(`data:image/svg+xml,${encodeURIComponent('<svg width="600" height="800" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle">PDF Page ${i+1}</text></svg>')}`);
      }
      
      setPageImages(images)
      onImport(images, numPages)
      
      toast({
        title: "PDF imported",
        description: `${numPages} page${numPages === 1 ? '' : 's'} imported successfully`
      })
    } catch (err) {
      console.error('Error converting PDF:', err)
      toast({
        title: "Import failed",
        description: "Failed to process PDF pages",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }, [pdfFile, numPages, onImport, toast])
  
  // Cancel PDF import
  const cancelImport = useCallback(() => {
    setPdfFile(null)
    setNumPages(null)
    setPageImages([])
  }, [])
  
  // If not active, render an empty div
  if (!isActive) {
    return null
  }
  
  return (
    <div 
      className={`pdf-drop-zone w-full h-full relative ${isDragging ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300'} ${isActive ? 'border-2 border-dashed' : 'hidden'} rounded-lg`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!pdfFile ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <svg 
            className="w-12 h-12 text-gray-400 mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <p className="text-lg font-medium">Drag & drop your PDF here</p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
            Browse Files
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileInputChange} 
            />
          </label>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{pdfFile.name}</h3>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={convertPagesToImages}
                disabled={isProcessing || !numPages}
              >
                {isProcessing ? 'Processing...' : 'Import Pages'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelImport}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded border p-4">
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              className="flex flex-col items-center"
            >
              {numPages && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from(new Array(Math.min(numPages, 6)), (_, index) => (
                    <div key={`preview-${index}`} className="border rounded p-2">
                      <Page
                        pageNumber={index + 1}
                        width={150}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                      <p className="text-center text-sm mt-2">Page {index + 1}</p>
                    </div>
                  ))}
                  {numPages > 6 && (
                    <div className="border rounded p-2 flex items-center justify-center bg-gray-50">
                      <p className="text-center text-sm">+{numPages - 6} more pages</p>
                    </div>
                  )}
                </div>
              )}
            </Document>
          </div>
        </div>
      )}
    </div>
  )
}