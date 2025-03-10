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
import ProseMirrorEditor from "@/components/prosemirror-editor"
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
  "/images/IMG_2642.JPG",
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
  
  // Custom pages state - initialize with a default first page
  const [customPages, setCustomPages] = useState<CustomPage[]>(() => {
    // Start with one default page
    return [{
      id: `custom-page-${Date.now()}`,
      content: "<p>Start typing...</p>",
      images: []
    }];
  })
  
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

  // Calculate number of pages based on content height
  useEffect(() => {
    const calculatePages = () => {
      // Only consider custom pages - no main content page
      // Using custom pages exclusively for better editability
      let pageCount = customPages.length
      
      setTotalPages(Math.max(1, pageCount))
    }
    
    calculatePages()
    
    // Recalculate when window resizes or when content changes
    window.addEventListener('resize', calculatePages)
    
    return () => {
      window.removeEventListener('resize', calculatePages)
    }
  }, [customPages])
  
  // Track page changes based on visible elements
  useEffect(() => {
    // This is needed for the scroll position to stabilize
    const updatePageFromScroll = () => {
      if (!reportContainerRef.current) return;
      
      const scrollElement = reportContainerRef.current;
      const { scrollTop, clientHeight } = scrollElement;
      
      // Get the middle point of the viewport
      const viewportMidpoint = scrollTop + (clientHeight / 2);
      
      // Calculate which page is most visible
      const pageHeight = PAGE_HEIGHT_PX + 40;
      const visiblePageNumber = Math.ceil(viewportMidpoint / pageHeight);
      
      // Only update if different from current page
      if (visiblePageNumber !== currentPage && visiblePageNumber > 0) {
        setCurrentPage(visiblePageNumber);
      }
    };
    
    const container = reportContainerRef.current;
    if (container) {
      // Use passive true for better scroll performance
      container.addEventListener('scroll', updatePageFromScroll, { passive: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', updatePageFromScroll);
      }
    };
  }, [currentPage]);
  
  // Handle clicks on the container to prevent unwanted navigation
  useEffect(() => {
    // This is critical to fix the page 1-2 auto-scroll issue
    const container = reportContainerRef.current;
    if (!container) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      // Only handle clicks directly on the container background
      if (e.target === container) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    container.addEventListener('click', handleClickOutside);
    
    return () => {
      container.removeEventListener('click', handleClickOutside);
    };
  }, []);

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

  // Autosave function - kept for compatibility but not used for main content anymore
  // since we've moved to using custom pages exclusively
  const autosaveContent = (html: string) => {
    // This function is no longer relevant since we don't use the main content page
    console.log("Legacy autosave called - not needed anymore");
    
    // Show toast for compatibility
    toast({
      title: "Autosaved",
      description: "Your changes have been saved automatically."
    });
  };
  
  // We don't need the content change effect anymore since we're using custom pages
  // with their own save handlers

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
    
    // Simple state update with the new page
    setCustomPages([
      ...customPages,
      {
        id: newPageId,
        content: "<p>Click to edit this page content...</p>",
        images: []
      }
    ]);
    
    // Get the index of the new page
    const newPageIndex = customPages.length;
    
    // Scroll to the new page after a short delay to allow for rendering
    setTimeout(() => {
      if (reportContainerRef.current) {
        const pageHeight = PAGE_HEIGHT_PX + 40;
        reportContainerRef.current.scrollTo({
          top: newPageIndex * pageHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
    
    toast({
      title: "Page Added",
      description: "A new page has been added to your report."
    });
  }
  
  // Delete a custom page
  const deletePage = (pageId: string) => {
    // Don't allow deleting if there's only one page
    if (customPages.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one page in your report.",
        variant: "destructive"
      });
      return;
    }
    
    setCustomPages(customPages.filter(page => page.id !== pageId));
    
    toast({
      title: "Page Deleted",
      description: "The page has been removed from your report."
    });
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

  // Handle AI text generation with selected photo
  const handleGenerateText = async (selectedText = "", customPrompt = "") => {
    try {
      setIsGenerating(true)
      
      // Check if there are any selected photos to include
      // First get the photos from the PhotoGrid component
      const photos = document.querySelectorAll('.photo-grid-container .relative');
      
      // Find the selected photo
      let selectedPhoto = null;
      if (selectedPhotos.length > 0) {
        // Look through all photos for the selected one
        photos.forEach(photoElement => {
          if (photoElement.getAttribute('data-photo-id') === selectedPhotos[0]) {
            const imgElement = photoElement.querySelector('img');
            const nameElement = photoElement.querySelector('h4');
            const descElement = photoElement.querySelector('p');
            
            if (imgElement) {
              // First create the photo object with original path
              selectedPhoto = {
                id: selectedPhotos[0],
                path: imgElement.src,
                name: nameElement?.textContent || 'Selected Photo',
                description: descElement?.textContent || 'No description available'
              };
              
              // Now resize the image before sending to API
              const resizeImage = (src: string, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<string> => {
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
                    
                    if (ctx) {
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
                      
                      console.log(`Processed image size: ${dataUrl.length} bytes`);
                      
                      // Additional validation for debugging
                      try {
                        const base64Part = dataUrl.split('base64,')[1];
                        if (!base64Part || base64Part.length === 0) {
                          throw new Error("Empty base64 data");
                        }
                        
                        // Minimal validation - base64 should be divisible by 4
                        if (base64Part.length % 4 !== 0) {
                          console.warn("Warning: Base64 length not divisible by 4, might be invalid");
                        }
                      } catch (error) {
                        console.error("Error validating base64 data:", error);
                      }
                      
                      resolve(dataUrl);
                    } else {
                      reject(new Error("Could not get canvas context"));
                    }
                  };
                  
                  img.onerror = (e) => {
                    console.error("Image load error:", e);
                    reject(new Error("Failed to load image"));
                  };
                  img.src = src;
                });
              };
              
              // Store the description for use in the API call
              const photoDescription = selectedPhoto.description;
              
              // We'll immediately use the original image path for now
              // But also start a separate process to resize the image
              (async () => {
                try {
                  console.log("Starting image optimization process...");
                  
                  // First check if we need to resize at all
                  const needsResize = !selectedPhoto.path.startsWith('data:') || 
                                     selectedPhoto.path.length > 100000;
                  
                  if (needsResize) {
                    console.log("Resizing image before sending to OpenAI...");
                    
                    // Start with standard quality
                    let resizedDataUrl = await resizeImage(selectedPhoto.path, 800, 600, 0.7);
                    console.log("First pass resize complete:", 
                      `Size: ${resizedDataUrl.length} bytes`);
                    
                    // If still too large, try more aggressive compression
                    if (resizedDataUrl.length > 1000000) { // Over ~1MB
                      console.log("Image still large, applying more aggressive compression...");
                      resizedDataUrl = await resizeImage(selectedPhoto.path, 640, 480, 0.5);
                      console.log("Second pass resize complete:", 
                        `Size: ${resizedDataUrl.length} bytes`);
                    }
                    
                    // If STILL too large, try maximum compression
                    if (resizedDataUrl.length > 500000) { // Over ~500KB
                      console.log("Image still too large, applying maximum compression...");
                      resizedDataUrl = await resizeImage(selectedPhoto.path, 400, 300, 0.3);
                      console.log("Third pass resize complete:", 
                        `Size: ${resizedDataUrl.length} bytes`);
                    }
                    
                    // Update the path - this will be used when the API call is made
                    if (selectedPhoto) {
                      const originalSize = selectedPhoto.path.length;
                      selectedPhoto.path = resizedDataUrl;
                      
                      const reduction = ((originalSize - resizedDataUrl.length) / originalSize * 100).toFixed(2);
                      console.log(`Successfully optimized image: ${originalSize} bytes → ${resizedDataUrl.length} bytes (${reduction}% reduction)`);
                    }
                  } else {
                    console.log("Image already optimized, skipping resize");
                  }
                } catch (resizeError) {
                  console.error("Error resizing image:", resizeError);
                  // Keep the original path if resize fails
                }
              })();
            }
          }
        });
      }
      
      let generatedText = "";
      
      if (selectedPhoto) {
        // Give a longer delay to allow image resizing to complete
        console.log("Waiting for image processing to complete...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if the image is too large
        const imageSize = selectedPhoto.path.length;
        console.log(`Final image size: ${imageSize} bytes`);
        
        // Warn if image is very large
        if (imageSize > 1000000) {
          console.warn("WARNING: Image is still large (> 1MB), which may cause issues with API limits");
        }
        
        console.log("Sending request to AI API with image:", 
          selectedPhoto.path.substring(0, 30) + "...");
        
        // If we have a selected photo, call the AI API with the photo data
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemPrompt: `You are a professional report writer for property inspection reports. 
                          Use professional, technical language that is concise and factual.
                          Analyze the image in detail and incorporate your observations in your response.`,
            userPrompt: `${customPrompt || 'Write a technical description'} 
                        of the image I'm sharing with you.
                        ${selectedText ? `The current text is: "${selectedText}"` : ''}
                        The text should be factual, professional, and provide relevant observations about what's shown.`,
            includePhoto: true,
            photoData: selectedPhoto.path,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        generatedText = data.content;
      } else {
        // No photo selected, just use text prompt
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemPrompt: `You are a professional report writer for property inspection reports. 
                          Use professional, technical language that is concise and factual.`,
            userPrompt: `${customPrompt || 'Write a detailed technical paragraph'}.
                        ${selectedText ? `The current text is: "${selectedText}"` : ''}
                        The text should be factual, professional, and provide relevant observations.`,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        generatedText = data.content;
      }
      
      // Insert the generated text into the editor
      // In a real implementation, you would insert this into the active editor
      console.log("Generated text:", generatedText);
      
      toast({
        title: "AI text generated",
        description: selectedPhoto 
          ? "AI-generated text based on the selected photo has been created." 
          : "AI-generated text has been created.",
        duration: 3000,
      })
      
      return generatedText;
    } catch (error) {
      console.error("Text generation error:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate text. Please try again.",
        variant: "destructive",
      })
      return null;
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
              <Button 
                size="sm" 
                variant="outline"
                onClick={addNewPage}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Page
              </Button>
              
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
          
          {/* No formatting toolbar needed anymore - ProseMirrorEditor has its own */}
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
              <Button size="sm" variant="outline" onClick={() => setEditingHeader(false)}>Cancel</Button>
              <Button size="sm" onClick={saveHeaderChanges}>Save Changes</Button>
            </div>
          </div>
        )}
        
        {/* Technical Report with virtualized pages */}
        <div 
          ref={reportContainerRef}
          className="flex-1 overflow-y-auto page-scroller"
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
              // All pages are custom pages now - no main content page
              const isCustomPage = virtualRow.index < customPages.length
              const isMainContentPage = false // No main content page
              const pageNumber = virtualRow.index + 1
              
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
                  data-page-number={pageNumber}
                  className="page-container"
                  id={`page-${pageNumber}`}
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
                      {/* Main content page - Always show editor with autosave */}
                      {isMainContentPage && (
                        <div ref={contentRef} className="cursor-text min-h-[300px] always-editable-wrapper">
                          <ProseMirrorEditor
                            initialContent={contentRef.current?.innerHTML || "<p>Start typing...</p>"}
                            onSave={autosaveContent}
                            alwaysEditable={true}
                          />
                        </div>
                      )}
                      
                      {/* Custom page content - Always show editor with autosave */}
                      {isCustomPage && (
                        <div className="cursor-text min-h-[300px] always-editable-wrapper">
                          <div className="relative">
                            {/* Indicator when photo is selected */}
                            {selectedPhotos.length > 0 && (
                              <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full z-10 flex items-center">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Photo selected for AI
                              </div>
                            )}
                            
                            <ProseMirrorEditor
                              initialContent={customPages[virtualRow.index].content}
                              onSave={(html) => {
                                // Update custom page content safely
                                try {
                                  setCustomPages(prevPages => 
                                    prevPages.map(page => 
                                      page.id === customPages[virtualRow.index].id 
                                        ? { ...page, content: html } 
                                        : page
                                    )
                                  )
                                } catch (error) {
                                  console.error("Error updating custom page:", error);
                                }
                              }}
                              alwaysEditable={true}
                            />
                          </div>
                          
                          {/* Custom page images */}
                          {customPages[virtualRow.index].images.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-4">
                              {customPages[virtualRow.index].images.map(image => (
                                <div key={image.id} className="relative">
                                  <img 
                                    src={image.url} 
                                    alt="Report image" 
                                    className="w-full h-auto rounded-md"
                                  />
                                  <button
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                                    onClick={() => removePhotoFromCustomPage(customPages[virtualRow.index].id, image.id)}
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