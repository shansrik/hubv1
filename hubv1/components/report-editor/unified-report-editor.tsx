"use client"

import { useState, useRef, useEffect } from "react"
import { 
  FileDown, 
  Printer, 
  Plus,
  Image as ImageIcon,
  Pencil,
  Camera,
  ChevronDown
} from "lucide-react"
import PhotoGrid from "@/components/photo-grid/photo-grid"
import { loadPhotosFromStorage } from "@/components/photo-grid/photo-utils"
import { useToast } from "@/components/ui/use-toast"
import { ReportPage, ReportHeader, CompanyLogo, PAGE_DIMENSIONS } from "./types"
import { exportToPDF } from "@/lib/pdf-utils"
import ProseMirrorEditor from "@/components/prosemirror-editor/index"
import { Button } from "@/components/ui/button"
import { useVirtualizer } from "@tanstack/react-virtual"
import { createEmptyPage, calculateCurrentPage, scrollToPage } from "./utils"
import PageRenderer from "./page-renderer"
import HeaderEditor from "./header-editor"
import { imageProcessingService } from "@/services/ai/image-processing-service"
import { editorEnhancementService } from "@/services/ai/editor-enhancement-service"

export default function UnifiedReportEditor() {
  // Photo selection state
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [filterQuery, setFilterQuery] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isInsertingPhoto, setIsInsertingPhoto] = useState(false)
  const [activeHeadingContext, setActiveHeadingContext] = useState<string>("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Log when heading context changes for debugging
  useEffect(() => {
    console.log("Active heading context in unified editor:", activeHeadingContext);
  }, [activeHeadingContext]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking inside dropdown or dropdown toggle button
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      
      // Close the dropdown when clicking outside
      setDropdownOpen(false);
    };
    
    // Add the event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);
  
  // Document state
  const [customPages, setCustomPages] = useState<ReportPage[]>(() => {
    return [{
      id: `custom-page-${Date.now()}`,
      content: "<p>Start typing...</p>",
      images: []
    }];
  })
  
  // Header state
  const [headerData, setHeaderData] = useState<ReportHeader>({
    companyName: "Halton Condominium Corporation No. XX",
    documentTitle: "Class 1/2/3 Comprehensive/Updated Reserve Fund Study",
    projectNumber: "RZ1324-0XXX-00",
    issueDate: "June 1, 2020",
  })
  const [editingHeader, setEditingHeader] = useState(false)
  
  // Page management state
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Refs
  const reportContainerRef = useRef<HTMLDivElement>(null)
  const reportPagesRef = useRef<HTMLDivElement>(null)
  
  // Toast
  const { toast } = useToast()

  // Logo configuration
  const logo: CompanyLogo = {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cion-2022_logo-ai-EX34VT0pWcJr3Q13MkaRjWcjee98lR.svg",
    width: 100,
    height: 40,
  }

  // Update total pages when pages change
  useEffect(() => {
    setTotalPages(Math.max(1, customPages.length))
    
    const handleResize = () => setTotalPages(Math.max(1, customPages.length))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [customPages])
  
  // Track current page based on scroll position
  useEffect(() => {
    const updatePageFromScroll = () => {
      if (!reportContainerRef.current) return;
      
      const scrollElement = reportContainerRef.current;
      const visiblePageNumber = calculateCurrentPage(scrollElement);
      
      if (visiblePageNumber !== currentPage && visiblePageNumber > 0) {
        setCurrentPage(visiblePageNumber);
      }
    };
    
    const container = reportContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updatePageFromScroll, { passive: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', updatePageFromScroll);
      }
    };
  }, [currentPage]);
  
  // Prevent unwanted navigation on container clicks
  useEffect(() => {
    const container = reportContainerRef.current;
    if (!container) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (e.target === container) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    container.addEventListener('click', handleClickOutside);
    return () => container.removeEventListener('click', handleClickOutside);
  }, []);

  // Virtual page renderer
  const rowVirtualizer = useVirtualizer({
    count: totalPages,
    getScrollElement: () => reportContainerRef.current,
    estimateSize: () => PAGE_DIMENSIONS.HEIGHT_PX + 40, // Page height + margin
    overscan: 3,
    measureElement: (element) => element.getBoundingClientRect().height
  })

  // Page operations
  const addNewPage = (pageType: 'standard' | 'photo-appendix' = 'standard') => {
    const newPage = createEmptyPage(pageType);
    setCustomPages([...customPages, newPage]);
    
    setTimeout(() => {
      if (reportContainerRef.current) {
        scrollToPage(reportContainerRef.current, customPages.length + 1);
      }
    }, 100);
    
    toast({
      title: pageType === 'photo-appendix' ? "Photo Appendix Added" : "Page Added",
      description: pageType === 'photo-appendix' 
        ? "A new photo appendix page has been added to your report."
        : "A new page has been added to your report."
    });
  }
  
  const deletePage = (pageId: string) => {
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
  
  // Image operations
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
      description: "Click on a page to insert the selected photo."
    })
  }
  
  const insertPhotoToPage = (pageId: string) => {
    if (selectedPhotos.length === 0) {
      toast({
        title: "No Photo Selected",
        description: "Please select a photo from the left panel first.",
        variant: "destructive"
      })
      return
    }
    
    // Helper function to get actual photo path/URL from ID
    const getPhotoUrl = (photoId: string): string => {
      // Load all photos
      const allPhotos = loadPhotosFromStorage();
      // Find the matching photo
      const photo = allPhotos.find(p => p.id === photoId);
      // Return the path or a placeholder if not found
      return photo ? (photo.dataUrl || photo.path) : '/placeholder.svg?height=200&width=200';
    };
    
    setCustomPages(prevPages => 
      prevPages.map(page => {
        if (page.id === pageId) {
          // For photo appendix pages, handle differently
          if (page.type === 'photo-appendix') {
            // Create image objects for each selected photo
            const newImages = selectedPhotos.map((photoId, index) => {
              const photoUrl = getPhotoUrl(photoId);
              return {
                id: `image-${Date.now()}-${index}`,
                url: photoUrl,
                width: 400,
                height: 300
              };
            });
            
            console.log('Adding photos to appendix:', newImages);
            
            return {
              ...page,
              images: [...page.images, ...newImages]
            };
          } else {
            // For standard pages, just add the first selected photo
            const photoUrl = getPhotoUrl(selectedPhotos[0]);
            const newImage = {
              id: `image-${Date.now()}`,
              url: photoUrl,
              width: 400,
              height: 300
            };
            
            console.log('Adding photo to standard page:', newImage);
            
            return {
              ...page,
              images: [...page.images, newImage]
            };
          }
        }
        return page;
      })
    );
    
    // Clear selected photos after adding them
    setSelectedPhotos([]);
    
    toast({
      title: "Photo Added",
      description: "The selected photo has been added to the page."
    })
  }
  
  const removePhotoFromPage = (pageId: string, photoId: string) => {
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
  
  // Header operations
  const handleSaveHeader = (newHeader: ReportHeader) => {
    setHeaderData(newHeader)
    setEditingHeader(false)
    
    toast({
      title: "Header Updated",
      description: "Report header information has been updated."
    })
  }

  // PDF export
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
  
  // AI text generation
  const handleGenerateText = async (selectedText = "", customPrompt = "") => {
    try {
      setIsGenerating(true)
      
      let generatedText;
      
      if (selectedPhotos.length > 0) {
        // If only one photo is selected, use the single photo API
        if (selectedPhotos.length === 1) {
          const photoData = await imageProcessingService.getProcessedImage(selectedPhotos[0]);
          generatedText = await editorEnhancementService.generateTextWithImage(
            selectedText,
            customPrompt || 'Write a technical description',
            photoData
          );
        } else {
          // For multiple photos, process all selected photos and combine them
          const photoDataPromises = selectedPhotos.map(photoId => 
            imageProcessingService.getProcessedImage(photoId)
          );
          
          // Process all photos in parallel
          const photoDataResults = await Promise.allSettled(photoDataPromises);
          
          // Extract successful photo data
          const successfulPhotoData = photoDataResults
            .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
            .map(result => result.value);
          
          // If we have at least one successful photo, generate text
          if (successfulPhotoData.length > 0) {
            // Use the first photo for API call, but mention all photos in the prompt
            const primaryPhotoData = successfulPhotoData[0];
            const photoCount = successfulPhotoData.length;
            
            // Modify the prompt to indicate multiple photos
            const multiPhotoPrompt = `${customPrompt || 'Write a technical description'} based on ${photoCount} photos. 
                                      I'm sharing the primary photo, but please write a description that could 
                                      encompass multiple similar items in this category.`;
            
            generatedText = await editorEnhancementService.generateTextWithImage(
              selectedText,
              multiPhotoPrompt,
              primaryPhotoData
            );
          } else {
            throw new Error("Failed to process any of the selected photos");
          }
        }
      } else {
        // No photos selected, generate text based only on prompt
        generatedText = await editorEnhancementService.generateText(
          selectedText,
          customPrompt || 'Write a detailed technical paragraph'
        );
      }
      
      toast({
        title: "AI text generated",
        description: selectedPhotos.length > 0
          ? `AI-generated text based on ${selectedPhotos.length === 1 ? 'the selected photo' : 'selected photos'} has been created.` 
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

  // Update page content
  const handleUpdatePageContent = (pageId: string, content: string) => {
    setCustomPages(prevPages => 
      prevPages.map(page => 
        page.id === pageId 
          ? { ...page, content } 
          : page
      )
    )
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
          headingContext={activeHeadingContext}
          selectedPhotos={selectedPhotos}
          onSelectPhoto={(id, isCtrlPressed = false) => {
            if (selectedPhotos.includes(id)) {
              // Deselect this photo only
              setSelectedPhotos(selectedPhotos.filter((photoId) => photoId !== id));
            } else if (isCtrlPressed) {
              // Multi-select: Add this photo to current selection
              setSelectedPhotos([...selectedPhotos, id]);
            } else {
              // Single-select: Clear previous selection and select only this photo
              setSelectedPhotos([id]);
            }
          }}
        />
      </div>

      {/* Right panel - Document Editor */}
      <div className="w-2/3 flex flex-col bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="p-2 flex items-center justify-between">
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              {/* Proper React-based dropdown with state management */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => addNewPage('standard')}
                    className="rounded-r-none border-r-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Page
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-l-none px-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(!dropdownOpen);
                    }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                
                {dropdownOpen && (
                  <div 
                    className="absolute top-full right-0 mt-1 bg-white shadow-lg rounded-md border border-gray-200 py-1 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        addNewPage('standard');
                        setDropdownOpen(false);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      Standard Page
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        addNewPage('photo-appendix');
                        setDropdownOpen(false);
                      }}
                    >
                      <Camera className="h-3.5 w-3.5 mr-2" />
                      Photo Appendix
                    </button>
                  </div>
                )}
              </div>
              
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
                onClick={() => setEditingHeader(true)}
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
        </div>
        
        {/* Header editor */}
        {editingHeader && (
          <HeaderEditor 
            header={headerData}
            onSave={handleSaveHeader}
          />
        )}
        
        {/* Document pages */}
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
              const pageIndex = virtualRow.index;
              const pageNumber = pageIndex + 1;
              const page = customPages[pageIndex];
              
              return (
                <div
                  key={virtualRow.key}
                  ref={(el) => rowVirtualizer.measureElement(el)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${PAGE_DIMENSIONS.HEIGHT_PX}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    cursor: isInsertingPhoto ? 'copy' : 'default'
                  }}
                  data-page-number={pageNumber}
                  className={`page-container ${isInsertingPhoto ? 'photo-insertion-mode' : ''}`}
                  id={`page-${pageNumber}`}
                  onClick={() => {
                    if (isInsertingPhoto) {
                      // Insert the photo to this page
                      insertPhotoToPage(page.id);
                      // Exit insert mode
                      setIsInsertingPhoto(false);
                    }
                  }}
                >
                  <PageRenderer
                    page={page}
                    pageNumber={pageNumber}
                    header={headerData}
                    logo={logo}
                    onRemoveImage={(imageId) => removePhotoFromPage(page.id, imageId)}
                  >
                    <div className="relative">
                      {selectedPhotos.length > 0 && (
                        <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full z-10 flex items-center">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {selectedPhotos.length === 1 
                            ? "Photo selected for AI" 
                            : `${selectedPhotos.length} photos selected for AI`}
                        </div>
                      )}
                      
                      <ProseMirrorEditor
                        initialContent={page.content}
                        onSave={(html) => handleUpdatePageContent(page.id, html)}
                        alwaysEditable={true}
                        selectedPhotoId={selectedPhotos.length > 0 ? selectedPhotos[0] : undefined}
                        onGenerateText={handleGenerateText}
                        onHeadingChange={(heading) => {
                          // Only update if we have an actual heading
                          if (heading && heading.trim() !== '') {
                            console.log(`Setting active heading context: "${heading}"`);
                            setActiveHeadingContext(heading);
                          }
                        }}
                      />
                    </div>
                  </PageRenderer>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}