"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  SunIcon, 
  Bold, 
  Italic, 
  List, 
  Type, 
  ChevronDown, 
  FilePlus, 
  FileDown, 
  Printer, 
  X 
} from "lucide-react"
import Image from "next/image"
import PhotoGrid from "@/components/photo-grid"
import { useToast } from "@/components/ui/use-toast"
import type { ReportSection } from "@/types/document"
import { exportToPDF } from "@/lib/utils"
import InlineEditor from "@/components/inline-editor"
import PaginatedReport from "@/components/paginated-report"
import PDFDropZone from "@/components/pdf-drop-zone"
import { Button } from "@/components/ui/button"
import { useVirtualizer } from "@tanstack/react-virtual"

// Hardcoded sections starting from 4.0
const SECTIONS: ReportSection[] = [
  {
    id: "4.0",
    number: "4.0",
    title: "Electrical Systems",
    content: "Content for electrical systems...",
    subsections: [
      {
        id: "4.01",
        number: "4.01",
        title: "Power Distribution",
        content: "Details about power distribution...",
      },
      {
        id: "4.02",
        number: "4.02",
        title: "Lighting",
        content: "Information about lighting systems...",
      },
    ],
  },
  {
    id: "5.0",
    number: "5.0",
    title: "Plumbing Systems",
    content: "Content for plumbing systems...",
    subsections: [
      {
        id: "5.01",
        number: "5.01",
        title: "Water Supply",
        content: "Details about water supply...",
      },
    ],
  },
  {
    id: "6.0",
    number: "6.0",
    title: "Mechanical Systems",
    content: `It has been assumed that the following items will be repaired and/or replaced on an as-needed basis from the maintenance contract and/or the operating budget:

• Control system components, gauges, shut-off valves
• Small pumps, fans and motors (less than 1 HP)
• Ductwork (including cleaning, balancing and insulation)
• Miscellaneous exhaust fans (garbage room, electrical room, etc.)`,
    subsections: [
      {
        id: "6.01",
        number: "6.01",
        title: "Heating Boilers",
        content:
          "Heating water is provided by XX gas-fired boilers located in the XX room. Each boiler is rated at XXX MBTU/hr heating input.\n\nReplacement of the heating boilers every 25 years and overhauling them once between replacement periods has been included in the Reserve Fund Study.",
      },
      {
        id: "6.02",
        number: "6.02",
        title: "Central Cooling System",
        content:
          "Cooling and heat rejection are provided by a XX ton closed/open loop cooling tower located on the mechanical penthouse roof and a chiller located in the XXXX room.\n\nReplacement of the units every 25 years and overhauling them once between replacement periods has been included in the Reserve Fund Study.",
      },
      {
        id: "6.03",
        number: "6.03",
        title: "HVAC Distribution System",
        content:
          "The hydronic HVAC distribution system includes two XX HP circulation pumps for the XX loops, chemical treatment system, expansion tanks, heat exchangers for XX loops, valves, etc.\n\nThe Reserve Fund Study has included for the following:\n\n• Replacement of the main circulation pumps for the heating and cooling loops every 20 years.\n\n• As-needed repair and replacement of the HVAC distribution equipment and piping every 5 years.",
      },
    ],
  },
]

// Standard US Letter size in inches
const LETTER_WIDTH_IN = 8.5
const LETTER_HEIGHT_IN = 11

// Convert to pixels (assuming 96 DPI for web)
const DPI = 96
const PAGE_WIDTH_PX = LETTER_WIDTH_IN * DPI
const PAGE_HEIGHT_PX = LETTER_HEIGHT_IN * DPI
const MARGIN_PX = 1 * DPI // 1 inch margins

export default function UnifiedReportEditor() {
  // Photo grid state
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [filterQuery, setFilterQuery] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Technical report state
  const [sections, setSections] = useState<ReportSection[]>(SECTIONS)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingSubsection, setEditingSubsection] = useState<string | null>(null)
  
  // PDF state
  const [isPdfDropActive, setIsPdfDropActive] = useState(false)
  const [pdfPages, setPdfPages] = useState<string[]>([])
  
  // Virtualization state
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null)
  const reportContainerRef = useRef<HTMLDivElement>(null)
  const reportPagesRef = useRef<HTMLDivElement>(null)
  
  // Toast
  const { toast } = useToast()

  // Logo configuration
  const logo = {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cion-2022_logo-ai-EX34VT0pWcJr3Q13MkaRjWcjee98lR.svg",
    width: 100,
    height: 40,
  }

  // Report metadata
  const metadata = {
    projectNumber: "RZ1324-0XXX-00",
    issueDate: "June 1, 2020",
    companyName: "Halton Condominium Corporation No. XX",
    documentTitle: "Class 1/2/3 Comprehensive/Updated Reserve Fund Study"
  }

  // Calculate number of pages based on content height
  useEffect(() => {
    const calculatePages = () => {
      if (!contentRef.current) return
      
      const contentHeight = contentRef.current.scrollHeight
      const contentPerPage = PAGE_HEIGHT_PX - (2 * MARGIN_PX) - 120 // 120px for header/footer
      const pageCount = Math.ceil(contentHeight / contentPerPage) + (pdfPages.length > 0 ? Math.ceil(pdfPages.length / 2) : 0)
      
      setTotalPages(Math.max(1, pageCount))
    }
    
    calculatePages()
    
    // Recalculate when window resizes or when sections change
    window.addEventListener('resize', calculatePages)
    
    return () => {
      window.removeEventListener('resize', calculatePages)
    }
  }, [sections, pdfPages])
  
  // Track current page based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!reportContainerRef.current) return
      
      const { scrollTop } = reportContainerRef.current
      const pageHeight = PAGE_HEIGHT_PX + 40 // Adding some margin between pages
      const currentPageCalc = Math.floor(scrollTop / pageHeight) + 1
      
      setCurrentPage(currentPageCalc)
    }
    
    const container = reportContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  // Generate virtual pages for performance
  const rowVirtualizer = useVirtualizer({
    count: totalPages,
    getScrollElement: () => reportContainerRef.current,
    estimateSize: () => PAGE_HEIGHT_PX + 40, // Page height + margin
    overscan: 2,
  })

  // Start editing a section or subsection
  const startEditing = (sectionId: string, subsectionId?: string) => {
    setEditingSection(sectionId)
    setEditingSubsection(subsectionId || null)
  }

  // Save edited content
  const saveEditedContent = (html: string) => {
    if (!editingSection) return
    
    // Update the sections state
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === editingSection) {
          if (editingSubsection) {
            // Update subsection content
            return {
              ...section,
              subsections: section.subsections?.map(subsection => 
                subsection.id === editingSubsection 
                  ? { ...subsection, content: html }
                  : subsection
              )
            }
          } else {
            // Update section content
            return { ...section, content: html }
          }
        }
        return section
      })
    })
    
    // Reset editing state
    setEditingSection(null)
    setEditingSubsection(null)
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingSection(null)
    setEditingSubsection(null)
  }

  // Get content for current editing
  const getEditingContent = useCallback(() => {
    if (!editingSection) return ""
    
    if (editingSubsection) {
      const section = sections.find(s => s.id === editingSection)
      const subsection = section?.subsections?.find(ss => ss.id === editingSubsection)
      return subsection?.content || ""
    } else {
      const section = sections.find(s => s.id === editingSection)
      return section?.content || ""
    }
  }, [editingSection, editingSubsection, sections])

  // Export report to PDF
  const handleExportPDF = async () => {
    if (!reportPagesRef.current) return
    
    try {
      toast({
        title: "Exporting PDF",
        description: "Please wait while we generate your PDF..."
      })
      
      const result = await exportToPDF(reportPagesRef.current, `Report-${metadata.projectNumber}.pdf`)
      
      if (result) {
        toast({
          title: "PDF Exported",
          description: "Your report has been exported as a PDF successfully."
        })
      }
    } catch (error) {
      console.error("PDF export error:", error)
      toast({
        title: "Export Failed",
        description: "There was an error exporting your report to PDF.",
        variant: "destructive"
      })
    }
  }
  
  // Handle PDF import
  const handlePdfImport = (pdfImages: string[], pageCount: number) => {
    setPdfPages([...pdfPages, ...pdfImages])
    setIsPdfDropActive(false)
    
    toast({
      title: "PDF Imported",
      description: `${pageCount} pages imported successfully.`
    })
  }
  
  // Toggle PDF drop zone
  const togglePdfDropZone = () => {
    setIsPdfDropActive(!isPdfDropActive)
  }
  
  // Remove a PDF page
  const removePdfPage = (index: number) => {
    setPdfPages(pdfPages.filter((_, i) => i !== index))
  }

  // Handle AI text generation
  const handleGenerateText = async (selectedText = "") => {
    try {
      setIsGenerating(true)
      // AI text generation logic here
      toast({
        title: "Text generated",
        description: "AI-generated text has been inserted into your report.",
      })
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Left panel - Photo grid */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Photos</h1>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-full hover:bg-gray-200" 
              title="Import PDF"
              onClick={togglePdfDropZone}
            >
              <FilePlus className="h-5 w-5 text-gray-600" />
            </button>
            <button 
              className="p-2 rounded-full hover:bg-gray-200"
              title="Export to PDF"
              onClick={handleExportPDF}
            >
              <FileDown className="h-5 w-5 text-gray-600" />
            </button>
            <button 
              className="p-2 rounded-full hover:bg-gray-200"
              title="Print"
              onClick={() => window.print()}
            >
              <Printer className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter photos..."
            className="w-full p-2 bg-white border border-gray-300 rounded-md"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>

        {isPdfDropActive ? (
          <PDFDropZone 
            onImport={handlePdfImport}
            isActive={true}
          />
        ) : (
          <PhotoGrid
            filterQuery={filterQuery}
            selectedPhotos={selectedPhotos}
            onSelectPhoto={(id) => {
              if (selectedPhotos.includes(id)) {
                setSelectedPhotos(selectedPhotos.filter((photoId) => photoId !== id))
              } else {
                setSelectedPhotos([...selectedPhotos, id])
              }
            }}
          />
        )}
      </div>

      {/* Right panel - Technical Report with Pagination */}
      <div className="w-2/3 flex flex-col bg-white overflow-hidden">
        {/* Report toolbar */}
        <div className="border-b border-gray-200 p-2 flex items-center justify-between bg-gray-50">
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={togglePdfDropZone}
            >
              <FilePlus className="h-4 w-4 mr-1" />
              Import PDF
            </Button>
            <Button 
              size="sm"
              onClick={handleExportPDF}
            >
              <FileDown className="h-4 w-4 mr-1" />
              Export PDF
            </Button>
          </div>
        </div>
        
        {/* Technical Report with virtualized pages */}
        <div 
          ref={reportContainerRef}
          className="flex-1 overflow-y-auto"
          style={{
            width: '100%',
            height: '100%',
            background: '#f0f0f0',
          }}
        >
          <div
            ref={reportPagesRef}
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.index}
                className="report-page"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  padding: '20px 0',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div 
                  className="bg-white shadow-lg"
                  style={{
                    width: `${PAGE_WIDTH_PX}px`,
                    height: `${PAGE_HEIGHT_PX}px`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Page content with header and footer */}
                  <div className="relative h-full">
                    {/* Header */}
                    <div 
                      className="absolute top-0 left-0 right-0 px-[1in] pt-[1in] pb-4 flex justify-between items-start"
                      style={{ borderBottom: virtualRow.index === 0 ? 'none' : '1px solid #e5e7eb' }}
                    >
                      <div>
                        <div className="text-red-600 font-bold mb-1">{metadata.companyName}</div>
                        <div className="text-black">{metadata.documentTitle}</div>
                      </div>
                      <Image
                        src={logo?.url || "/placeholder.svg"}
                        alt="Logo"
                        width={logo?.width || 100}
                        height={logo?.height || 40}
                        className="object-contain"
                        priority
                      />
                    </div>
                    
                    {/* Page content area */}
                    <div 
                      ref={virtualRow.index === 0 ? contentRef : undefined}
                      className="px-[1in] pt-[2in] pb-[1.5in]"
                      style={{
                        height: '100%',
                        overflowY: 'hidden',
                        fontFamily: "Arial, sans-serif",
                        fontSize: "11pt",
                        lineHeight: "1.5",
                      }}
                    >
                      {/* Display report content on first virtual page */}
                      {virtualRow.index === 0 && (
                        <div className="space-y-6">
                          {sections.map((section) => (
                            <div key={section.id} className="space-y-4">
                              {/* Main section header */}
                              <div className="flex items-baseline space-x-2">
                                <span className="text-xl font-bold">{section.number}</span>
                                <span className="text-xl font-bold">|</span>
                                <span className="text-xl font-bold text-red-600">{section.title}</span>
                              </div>

                              {/* Main section content - inline editing */}
                              {editingSection === section.id && !editingSubsection ? (
                                <InlineEditor
                                  initialContent={section.content}
                                  onSave={saveEditedContent}
                                  onCancel={cancelEditing}
                                />
                              ) : (
                                <div 
                                  className="pl-4 hover:bg-gray-50 cursor-pointer"
                                  onClick={() => startEditing(section.id)}
                                  dangerouslySetInnerHTML={{ __html: section.content }}
                                />
                              )}

                              {/* Subsections */}
                              {section.subsections?.map((subsection) => (
                                <div key={subsection.id} className="space-y-2 mt-8">
                                  <div className="flex items-baseline space-x-4">
                                    <span className="font-bold text-center w-16">{subsection.number}</span>
                                    <span className="font-bold">{subsection.title}</span>
                                  </div>
                                  
                                  {editingSection === section.id && editingSubsection === subsection.id ? (
                                    <div className="pl-20">
                                      <InlineEditor
                                        initialContent={subsection.content}
                                        onSave={saveEditedContent}
                                        onCancel={cancelEditing}
                                      />
                                    </div>
                                  ) : (
                                    <div 
                                      className="pl-20 hover:bg-gray-50 cursor-pointer"
                                      onClick={() => startEditing(section.id, subsection.id)}
                                      dangerouslySetInnerHTML={{ __html: subsection.content }}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* PDF pages start after report content */}
                      {virtualRow.index > 0 && pdfPages.length > 0 && (
                        <div className="pdf-page-container h-full flex flex-col justify-center items-center">
                          {/* Show 2 PDF pages per virtual page */}
                          {pdfPages[(virtualRow.index - 1) * 2] && (
                            <div className="relative w-full mb-4">
                              <button 
                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                                onClick={() => removePdfPage((virtualRow.index - 1) * 2)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <img 
                                src={pdfPages[(virtualRow.index - 1) * 2]} 
                                alt={`PDF Page ${(virtualRow.index - 1) * 2 + 1}`}
                                className="w-full border-2 border-gray-200 shadow-sm"
                              />
                            </div>
                          )}
                          
                          {pdfPages[(virtualRow.index - 1) * 2 + 1] && (
                            <div className="relative w-full">
                              <button 
                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                                onClick={() => removePdfPage((virtualRow.index - 1) * 2 + 1)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <img 
                                src={pdfPages[(virtualRow.index - 1) * 2 + 1]} 
                                alt={`PDF Page ${(virtualRow.index - 1) * 2 + 2}`}
                                className="w-full border-2 border-gray-200 shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 px-[1in] py-4 flex justify-between text-sm bg-white border-t">
                      <div>
                        <div>Project Number: {metadata.projectNumber}</div>
                        <div>Issued: {metadata.issueDate}</div>
                      </div>
                      <div>Page {virtualRow.index + 1} of {totalPages}</div>
                    </div>
                    
                    {/* Page break indicator */}
                    {virtualRow.index < totalPages - 1 && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 border-b border-dashed border-gray-300"
                        style={{ borderBottomWidth: '2px' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 