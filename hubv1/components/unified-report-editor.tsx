"use client"

import { useState, useRef, useEffect } from "react"
import { 
  SunIcon, 
  Bold, 
  Italic, 
  List, 
  Type, 
  ChevronDown, 
  FileDown, 
  Printer, 
  Plus,
  X,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Check,
  Sparkles,
  Underline,
  Save,
  Code,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Strikethrough
} from "lucide-react"
import Image from "next/image"
import PhotoGrid from "@/components/photo-grid"
import { useToast } from "@/components/ui/use-toast"
import type { ReportSection } from "@/types/document"
import { exportToPDF } from "@/lib/utils"
import InlineEditor from "@/components/inline-editor"
import DocumentEditor from "@/components/document-editor"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Input } from "@/components/ui/input"

// Empty sections to start with
const SECTIONS: ReportSection[] = []

// Standard US Letter size in inches
const LETTER_WIDTH_IN = 8.5
const LETTER_HEIGHT_IN = 11

// Convert to pixels (assuming 96 DPI for web)
const DPI = 96
const PAGE_WIDTH_PX = LETTER_WIDTH_IN * DPI
const PAGE_HEIGHT_PX = LETTER_HEIGHT_IN * DPI
const MARGIN_PX = 1 * DPI // 1 inch margins

// Sample photo URLs (in a real app these would come from an API)
const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop",
]

interface CustomPage {
  id: string;
  content: string;
  images: Array<{
    id: string;
    url: string;
    width: number;
    height: number;
  }>;
}

interface ReportPhoto {
  id: string;
  url: string;
  sectionId: string | null;
  subsectionId: string | null;
}

export default function UnifiedReportEditor() {
  // Photo grid state
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [filterQuery, setFilterQuery] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Technical report state
  const [sections, setSections] = useState<ReportSection[]>(SECTIONS)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingSubsection, setEditingSubsection] = useState<string | null>(null)
  const [editingSectionTitle, setEditingSectionTitle] = useState<string | null>(null)
  const [editingSubsectionTitle, setEditingSubsectionTitle] = useState<string | null>(null)
  const [titleEditValue, setTitleEditValue] = useState("")
  
  // Custom pages state
  const [customPages, setCustomPages] = useState<CustomPage[]>([])
  const [editingCustomPage, setEditingCustomPage] = useState<string | null>(null)
  
  // Photo insertion state
  const [reportPhotos, setReportPhotos] = useState<ReportPhoto[]>([])
  const [isInsertingPhoto, setIsInsertingPhoto] = useState(false)
  
  // Header editing state
  const [editingHeader, setEditingHeader] = useState(false)
  const [headerData, setHeaderData] = useState({
    companyName: "Halton Condominium Corporation No. XX",
    documentTitle: "Class 1/2/3 Comprehensive/Updated Reserve Fund Study",
    projectNumber: "RZ1324-0XXX-00",
    issueDate: "June 1, 2020",
  })
  
  // Page management state
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

  // Add new state for editing main content
  const [editingMainContent, setEditingMainContent] = useState(false)
  
  // Formatting toolbar state
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [showFormat, setShowFormat] = useState<string | null>(null)
  const [showAIMenu, setShowAIMenu] = useState<string | null>(null)
  
  // Store a reference to the document editor component
  const documentEditorRef = useRef<any>(null)
  
  // Function to store the editor reference for direct control
  const storeEditorMethodsRef = (methods: any) => {
    console.log("Editor methods received:", methods)
    
    // Print all the methods for debugging
    if (methods) {
      console.log("Available methods:", Object.keys(methods))
      
      // Test one of the methods to make sure it's working
      if (methods.getActiveBlockId) {
        console.log("Current active block ID:", methods.getActiveBlockId())
      }
    }
    
    documentEditorRef.current = methods
    
    // Test method calls
    setTimeout(() => {
      try {
        if (documentEditorRef.current && documentEditorRef.current.getActiveBlockId) {
          const activeId = documentEditorRef.current.getActiveBlockId()
          console.log("Active block after timeout:", activeId)
          
          if (activeId && documentEditorRef.current.changeBlockType) {
            console.log("Testing changeBlockType on:", activeId)
            documentEditorRef.current.changeBlockType(activeId, 'heading-one')
          }
        }
      } catch (error) {
        console.error("Error in test method call:", error)
      }
    }, 1000)
  }

  // Calculate number of pages based on content height
  useEffect(() => {
    const calculatePages = () => {
      if (!contentRef.current) return
      
      const contentHeight = contentRef.current.scrollHeight
      const contentPerPage = PAGE_HEIGHT_PX - (2 * MARGIN_PX) - 120 // 120px for header/footer
      
      // Only consider content page (page 1) and explicit custom pages
      // Do not automatically add a third page based on content height
      let pageCount = 1 + customPages.length
      
      setTotalPages(Math.max(1, pageCount))
    }
    
    calculatePages()
    
    // Recalculate when window resizes or when content changes
    window.addEventListener('resize', calculatePages)
    
    return () => {
      window.removeEventListener('resize', calculatePages)
    }
  }, [sections, customPages])
  
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
    overscan: 3, // Increased overscan to ensure last page is always rendered
    measureElement: (element) => {
      // This ensures pages are measured accurately
      return element.getBoundingClientRect().height;
    }
  })

  // Start editing a section or subsection
  const startEditing = (sectionId: string, subsectionId?: string) => {
    setEditingSection(sectionId)
    setEditingSubsection(subsectionId || null)
  }

  // Save edited content
  const saveEditedContent = (html: string) => {
    if (editingCustomPage) {
      // Update custom page content
      setCustomPages(prevPages => 
        prevPages.map(page => 
          page.id === editingCustomPage 
            ? { ...page, content: html } 
            : page
        )
      )
      setEditingCustomPage(null)
    } else {
      // Save main content page
      if (contentRef.current) {
        contentRef.current.innerHTML = html
      }
      setEditingMainContent(false)
    }
    
    toast({
      title: "Content saved",
      description: "Your changes have been saved successfully."
    })
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingSection(null)
    setEditingSubsection(null)
    setEditingCustomPage(null)
    setEditingHeader(false)
    setIsInsertingPhoto(false)
    setEditingSectionTitle(null)
    setEditingSubsectionTitle(null)
    setTitleEditValue("")
    setEditingMainContent(false)
    setActiveBlockId(null)
    setShowFormat(null)
    setShowAIMenu(null)
  }
  
  // Handle active block change
  const handleActiveBlockChange = (blockId: string) => {
    console.log("Active block changed to:", blockId)
    setActiveBlockId(blockId)
    
    // Also try to focus the editor if possible
    if (blockId && documentEditorRef.current?.focusEditor) {
      documentEditorRef.current.focusEditor(blockId)
    }
  }
  
  // Handle format change
  const handleFormatChange = (blockId: string, formatType: string) => {
    const targetBlockId = blockId || getCurrentBlockId();
    console.log("Format change requested:", targetBlockId, formatType)
    console.log("Editor methods available:", !!documentEditorRef.current)
    
    if (!targetBlockId) {
      console.error("No target block ID available for format change")
      setShowFormat(null)
      return
    }
    
    if (documentEditorRef.current) {
      console.log("Available methods:", Object.keys(documentEditorRef.current))
    }
    
    if (documentEditorRef.current && typeof documentEditorRef.current.changeBlockType === 'function') {
      console.log("Calling changeBlockType...")
      try {
        documentEditorRef.current.changeBlockType(targetBlockId, formatType)
        console.log("Call successful")
      } catch (error) {
        console.error("Error calling changeBlockType:", error)
      }
    } else {
      console.warn("changeBlockType method not available or not a function")
    }
    setShowFormat(null)
  }
  
  // Helper function to get the current active block ID
  const getCurrentBlockId = () => {
    return activeBlockId || 
      (documentEditorRef.current?.getActiveBlockId ? 
        documentEditorRef.current.getActiveBlockId() : "");
  }

  // Handle style toggle
  const handleStyleToggle = (blockId: string, style: string) => {
    const targetBlockId = blockId || getCurrentBlockId();
    console.log("Style toggle requested:", targetBlockId, style)
    
    if (!targetBlockId) {
      console.error("No target block ID available for style toggle")
      return
    }
    
    if (documentEditorRef.current && typeof documentEditorRef.current.toggleInlineStyle === 'function') {
      console.log("Calling toggleInlineStyle on block:", targetBlockId)
      try {
        documentEditorRef.current.toggleInlineStyle(targetBlockId, style)
        console.log("Style toggle call successful")
      } catch (error) {
        console.error("Error calling toggleInlineStyle:", error)
      }
    } else {
      console.warn("toggleInlineStyle method not available or not a function")
    }
  }
  
  // Handle AI enhancement
  const handleAIEnhance = (promptType: string) => {
    const targetBlockId = getCurrentBlockId();
    console.log("AI enhance requested:", promptType, targetBlockId)
    
    if (!targetBlockId) {
      console.error("No target block ID available for AI enhancement")
      setShowAIMenu(null)
      return
    }
    
    if (documentEditorRef.current && typeof documentEditorRef.current.enhanceWithAI === 'function') {
      console.log("Calling enhanceWithAI on block:", targetBlockId)
      try {
        documentEditorRef.current.enhanceWithAI(targetBlockId, promptType)
        console.log("AI enhance call successful")
      } catch (error) {
        console.error("Error calling enhanceWithAI:", error)
      }
    } else {
      console.warn("enhanceWithAI method not available or not a function")
    }
    setShowAIMenu(null)
  }
  
  // Handle AI menu
  const handleShowAIMenu = (blockId: string) => {
    setShowAIMenu(blockId)
  }
  
  // Start editing section title
  const startEditingSectionTitle = (sectionId: string, currentTitle: string) => {
    setEditingSectionTitle(sectionId)
    setTitleEditValue(currentTitle)
  }
  
  // Start editing subsection title
  const startEditingSubsectionTitle = (sectionId: string, subsectionId: string, currentTitle: string) => {
    setEditingSectionTitle(sectionId)
    setEditingSubsectionTitle(subsectionId)
    setTitleEditValue(currentTitle)
  }
  
  // Save section title
  const saveSectionTitle = () => {
    if (!editingSectionTitle) return
    
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === editingSectionTitle) {
          if (editingSubsectionTitle) {
            // Update subsection title
            return {
              ...section,
              subsections: section.subsections?.map(subsection => 
                subsection.id === editingSubsectionTitle 
                  ? { ...subsection, title: titleEditValue }
                  : subsection
              )
            }
          } else {
            // Update section title
            return { ...section, title: titleEditValue }
          }
        }
        return section
      })
    })
    
    // Reset editing state
    setEditingSectionTitle(null)
    setEditingSubsectionTitle(null)
    setTitleEditValue("")
    
    toast({
      title: "Title Updated",
      description: "Section title has been updated successfully."
    })
  }

  // Export report to PDF
  const handleExportPDF = async () => {
    if (!reportPagesRef.current) return
    
    try {
      toast({
        title: "Exporting PDF",
        description: "Please wait while we generate your PDF..."
      })
      
      const result = await exportToPDF(reportPagesRef.current, `Report-${headerData.projectNumber}.pdf`)
      
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
  
  // Add a new custom page
  const addNewPage = () => {
    const newPageId = `custom-page-${Date.now()}`
    
    setCustomPages([
      ...customPages,
      {
        id: newPageId,
        content: "<p>Click to edit this page content...</p>",
        images: []
      }
    ])
    
    toast({
      title: "Page Added",
      description: "A new page has been added to your report."
    })
  }
  
  // Delete a custom page
  const deletePage = (pageId: string) => {
    setCustomPages(customPages.filter(page => page.id !== pageId))
    
    toast({
      title: "Page Deleted",
      description: "The page has been removed from your report."
    })
  }
  
  // Start photo insertion mode
  const startPhotoInsertion = () => {
    if (selectedPhotos.length === 0) {
      toast({
        title: "No Photo Selected",
        description: "Please select a photo from the left panel first.",
        variant: "destructive"
      })
      return
    }
    
    setIsInsertingPhoto(true)
    
    toast({
      title: "Insert Photo",
      description: "Click on a section or subsection to insert the selected photo."
    })
  }
  
  // Insert photo into section or subsection
  const insertPhoto = (sectionId: string, subsectionId?: string) => {
    if (!isInsertingPhoto || selectedPhotos.length === 0) return
    
    // Add photo to report photos
    const newPhoto = {
      id: `photo-${Date.now()}`,
      url: selectedPhotos[0], // Use first selected photo
      sectionId,
      subsectionId: subsectionId || null
    }
    
    setReportPhotos([...reportPhotos, newPhoto])
    
    // Clear selected photos and exit insertion mode
    setSelectedPhotos([])
    setIsInsertingPhoto(false)
    
    toast({
      title: "Photo Inserted",
      description: "The selected photo has been added to the report."
    })
  }
  
  // Insert photo into custom page
  const insertPhotoToCustomPage = (pageId: string) => {
    if (selectedPhotos.length === 0) {
      toast({
        title: "No Photo Selected",
        description: "Please select a photo from the left panel first.",
        variant: "destructive"
      })
      return
    }
    
    setCustomPages(prevPages => 
      prevPages.map(page => {
        if (page.id === pageId) {
          return {
            ...page,
            images: [
              ...page.images,
              {
                id: `image-${Date.now()}`,
                url: selectedPhotos[0], // Use the first selected photo
                width: 400,
                height: 300
              }
            ]
          }
        }
        return page
      })
    )
    
    // Clear selected photos after inserting
    setSelectedPhotos([])
    
    toast({
      title: "Photo Added",
      description: "The selected photo has been added to the page."
    })
  }
  
  // Remove a photo from a report
  const removePhoto = (photoId: string) => {
    setReportPhotos(reportPhotos.filter(photo => photo.id !== photoId))
  }
  
  // Remove a photo from a custom page
  const removePhotoFromCustomPage = (pageId: string, photoId: string) => {
    setCustomPages(prevPages => 
      prevPages.map(page => {
        if (page.id === pageId) {
          return {
            ...page,
            images: page.images.filter(img => img.id !== photoId)
          }
        }
        return page
      })
    )
  }
  
  // Start editing a custom page
  const startEditingCustomPage = (pageId: string) => {
    // Clear any other editing state first
    setEditingSection(null)
    setEditingSubsection(null)
    setEditingSectionTitle(null)
    setEditingSubsectionTitle(null)
    
    // Set the custom page editing state
    setEditingCustomPage(pageId)
    
    // Focus on the editor after a short delay
    setTimeout(() => {
      const editorElement = document.querySelector('.DraftEditor-root')
      if (editorElement) {
        editorElement.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }
  
  // Toggle header editing mode
  const toggleHeaderEditing = () => {
    setEditingHeader(!editingHeader)
  }
  
  // Save header changes
  const saveHeaderChanges = () => {
    setEditingHeader(false)
    
    toast({
      title: "Header Updated",
      description: "Report header information has been updated."
    })
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
              title="Insert Photo"
              onClick={startPhotoInsertion}
              disabled={selectedPhotos.length === 0}
            >
              <ImageIcon className={`h-5 w-5 ${selectedPhotos.length === 0 ? 'text-gray-400' : 'text-blue-600'}`} />
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
      </div>

      {/* Right panel - Technical Report with Pagination */}
      <div className="w-2/3 flex flex-col bg-white overflow-hidden">
        {/* Report toolbar with document formatting controls */}
        <div className="bg-gray-50 border-b border-gray-200">
          {/* Main toolbar with page controls */}
          <div className="p-2 flex items-center justify-between">
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0">
                  <div className="flex flex-col">
                    <Button 
                      variant="ghost"
                      onClick={addNewPage} 
                      className="justify-start"
                    >
                      <span>Add Blank Page</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => {
                        const newPageId = `custom-page-${Date.now()}`
                        setCustomPages([
                          ...customPages,
                          {
                            id: newPageId,
                            content: "", // Empty content - let the editor handle it
                            images: []
                          }
                        ])
                        setTimeout(() => startEditingCustomPage(newPageId), 100)
                      }}
                      className="justify-start"
                    >
                      <span>Add New Page</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button 
                size="sm"
                variant={isInsertingPhoto ? "default" : "outline"}
                onClick={startPhotoInsertion}
                disabled={selectedPhotos.length === 0}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Insert Photo
              </Button>
              <Button 
                size="sm"
                onClick={toggleHeaderEditing}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit Header
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
          
          {/* Formatting toolbar - only shown when editing */}
          {(editingMainContent || editingCustomPage) && (
            <div className="formatting-toolbar p-2 border-t border-gray-200 bg-gray-50 flex items-center">
              {/* Format menu */}
              <Popover 
                open={showFormat !== null} 
                onOpenChange={(open) => {
                  // Get current active block from editor methods if needed
                  const currentActiveBlock = 
                    activeBlockId || 
                    (documentEditorRef.current?.getActiveBlockId ? 
                      documentEditorRef.current.getActiveBlockId() : null);
                      
                  setShowFormat(open ? currentActiveBlock : null);
                  
                  // Debug
                  console.log("Format menu", open ? "opened" : "closed", "active block:", currentActiveBlock);
                }}
              >
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2"
                    disabled={!activeBlockId && !(documentEditorRef.current?.getActiveBlockId?.())}
                  >
                    <Type className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Format</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1">
                  <div className="flex flex-col space-y-1">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        const currentBlockId = activeBlockId || 
                          (documentEditorRef.current?.getActiveBlockId ? 
                            documentEditorRef.current.getActiveBlockId() : "");
                        handleFormatChange(currentBlockId, 'text');
                      }}
                    >
                      <span className="text-sm">Text</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        const currentBlockId = activeBlockId || 
                          (documentEditorRef.current?.getActiveBlockId ? 
                            documentEditorRef.current.getActiveBlockId() : "");
                        handleFormatChange(currentBlockId, 'heading-one');
                      }}
                    >
                      <span className="text-lg font-bold">Heading 1</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleFormatChange(activeBlockId || "", 'heading-two')}
                    >
                      <span className="text-md font-bold">Heading 2</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleFormatChange(activeBlockId || "", 'heading-three')}
                    >
                      <span className="text-sm font-bold">Heading 3</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleFormatChange(activeBlockId || "", 'unordered-list')}
                    >
                      <List className="h-4 w-4 mr-2" />
                      <span>Bullet List</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleFormatChange(activeBlockId || "", 'ordered-list')}
                    >
                      <span className="w-4 mr-2 text-center">1.</span>
                      <span>Numbered List</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleFormatChange(activeBlockId || "", 'code')}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      <span>Code Block</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleFormatChange(activeBlockId || "", 'quote')}
                    >
                      <Quote className="h-4 w-4 mr-2" />
                      <span>Quote Block</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Inline formatting buttons */}
              <div className="border-l border-gray-200 mx-1 h-5"></div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={() => handleStyleToggle("", 'BOLD')}
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={() => handleStyleToggle("", 'ITALIC')}
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={() => handleStyleToggle("", 'UNDERLINE')}
              >
                <Underline className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={() => handleStyleToggle("", 'STRIKETHROUGH')}
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </Button>
              
              {/* Text alignment */}
              <div className="border-l border-gray-200 mx-1 h-5"></div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={() => handleStyleToggle("", 'ALIGN_LEFT')}
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={() => handleStyleToggle("", 'ALIGN_CENTER')}
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={() => handleStyleToggle("", 'ALIGN_RIGHT')}
              >
                <AlignRight className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={() => handleStyleToggle("", 'ALIGN_JUSTIFY')}
              >
                <AlignJustify className="h-3.5 w-3.5" />
              </Button>
              
              {/* AI assistance button */}
              <div className="border-l border-gray-200 mx-1 h-5"></div>
              <Popover 
                open={showAIMenu !== null} 
                onOpenChange={(open) => {
                  // Get current active block from editor methods if needed
                  const currentActiveBlock = 
                    activeBlockId || 
                    (documentEditorRef.current?.getActiveBlockId ? 
                      documentEditorRef.current.getActiveBlockId() : null);
                      
                  setShowAIMenu(open ? currentActiveBlock : null);
                  
                  // Debug
                  console.log("AI menu", open ? "opened" : "closed", "active block:", currentActiveBlock);
                }}
              >
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                    disabled={!activeBlockId && !(documentEditorRef.current?.getActiveBlockId?.())}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">AI</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1">
                  <div className="flex flex-col space-y-1">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleAIEnhance('follow-up')}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                      <span>Add follow-up sentence</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleAIEnhance('professional')}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                      <span>Rewrite professionally</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleAIEnhance('casual')}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                      <span>Rewrite casually</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleAIEnhance('concise')}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                      <span>Make concise</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleAIEnhance('expand')}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                      <span>Expand with details</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleAIEnhance('grammar')}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                      <span>Fix grammar & spelling</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Save and cancel buttons on the right */}
              <div className="ml-auto flex space-x-2">
                <Button size="sm" variant="outline" onClick={cancelEditing}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    if (contentRef.current?.querySelector('.DraftEditor-root')) {
                      // Trigger save from the editor
                      const saveEvent = new CustomEvent('save-content')
                      contentRef.current.dispatchEvent(saveEvent)
                    }
                  }}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Header editing panel (when active) */}
        {editingHeader && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-md font-medium mb-3">Edit Report Header</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Company Name</label>
                <Input
                  value={headerData.companyName}
                  onChange={e => setHeaderData({...headerData, companyName: e.target.value})}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Document Title</label>
                <Input
                  value={headerData.documentTitle}
                  onChange={e => setHeaderData({...headerData, documentTitle: e.target.value})}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Project Number</label>
                <Input
                  value={headerData.projectNumber}
                  onChange={e => setHeaderData({...headerData, projectNumber: e.target.value})}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Issue Date</label>
                <Input
                  value={headerData.issueDate}
                  onChange={e => setHeaderData({...headerData, issueDate: e.target.value})}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
              <Button size="sm" onClick={saveHeaderChanges}>Save Changes</Button>
            </div>
          </div>
        )}
        
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
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              // Determine if this is a report content page or a custom page
              const isMainContentPage = virtualRow.index === 0
              const isCustomPage = virtualRow.index > 0 && (virtualRow.index - 1) < customPages.length
              
              return (
                <div
                  key={virtualRow.key}
                  ref={(el) => rowVirtualizer.measureElement(el)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${PAGE_HEIGHT_PX}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {/* Page container with white background and shadow */}
                  <div 
                    className="mx-auto bg-white shadow-md"
                    style={{
                      width: `${PAGE_WIDTH_PX}px`,
                      height: `${PAGE_HEIGHT_PX}px`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header - now rendered on every page */}
                    <div className="absolute top-[1in] left-[1in] right-[1in]">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-red-600 font-bold">{headerData.companyName}</div>
                          <div>{headerData.documentTitle}</div>
                        </div>
                        <div>
                          {logo && (
                            <Image
                              src={logo.url}
                              alt="Company Logo"
                              width={logo.width}
                              height={logo.height}
                              priority
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Page content - adjusted to account for header space */}
                    <div 
                      className="absolute top-[2in] left-[1in] right-[1in] bottom-[1in] overflow-hidden"
                    >
                      {/* Main content page */}
                      {isMainContentPage && (
                        <div ref={contentRef}>
                          {editingMainContent ? (
                            <DocumentEditor
                              initialContent={contentRef.current?.innerHTML || ""}
                              onSave={saveEditedContent}
                              onCancel={cancelEditing}
                              activeBlock={activeBlockId}
                              onActiveBlockChange={handleActiveBlockChange}
                              onFormatBlock={handleFormatChange}
                              onToggleStyle={handleStyleToggle}
                              onShowAIMenu={handleShowAIMenu}
                              showToolbar={false}
                              onRef={storeEditorMethodsRef}
                            />
                          ) : (
                            <>
                              <div 
                                className="main-page-content prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: contentRef.current?.innerHTML || contentRef.current?.innerHTML === "" ? "<p>Click to edit this page content...</p>" : "" }}
                                onClick={() => setEditingMainContent(true)}
                                style={{ cursor: 'pointer' }}
                              />
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Custom page content */}
                      {isCustomPage && (
                        <div>
                          {editingCustomPage === customPages[virtualRow.index - 1].id ? (
                            <DocumentEditor
                              initialContent={customPages[virtualRow.index - 1].content}
                              onSave={saveEditedContent}
                              onCancel={cancelEditing}
                              activeBlock={activeBlockId}
                              onActiveBlockChange={handleActiveBlockChange}
                              onFormatBlock={handleFormatChange}
                              onToggleStyle={handleStyleToggle}
                              onShowAIMenu={handleShowAIMenu}
                              showToolbar={false}
                              onRef={storeEditorMethodsRef}
                            />
                          ) : (
                            <div 
                              className="custom-page-content"
                              dangerouslySetInnerHTML={{ __html: customPages[virtualRow.index - 1].content }}
                              onClick={() => startEditingCustomPage(customPages[virtualRow.index - 1].id)}
                              style={{ cursor: 'pointer' }}
                            />
                          )}
                          
                          {/* Custom page images */}
                          {customPages[virtualRow.index - 1].images.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              {customPages[virtualRow.index - 1].images.map(image => (
                                <div key={image.id} className="relative">
                                  <img 
                                    src={image.url} 
                                    alt="Report image" 
                                    className="w-full h-auto rounded-md"
                                  />
                                  <button
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                                    onClick={() => removePhotoFromCustomPage(customPages[virtualRow.index - 1].id, image.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="absolute bottom-[1in] left-[1in] right-[1in] flex justify-between text-sm">
                      <div>
                        <div>Project Number: {headerData.projectNumber}</div>
                        <div>Issued: {headerData.issueDate}</div>
                      </div>
                      <div>Page | {virtualRow.index + 1}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
} 