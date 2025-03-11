"use client"

import { useRef, ReactNode } from "react";
import Image from "next/image";
import { X, Camera } from "lucide-react";
import { PAGE_DIMENSIONS, ReportHeader, ReportPage, CompanyLogo, ReportImage } from "./types";

interface PageRendererProps {
  page: ReportPage;
  pageNumber: number;
  header: ReportHeader;
  logo: CompanyLogo;
  onRemoveImage: (imageId: string) => void;
  onGenerateImageDescription?: (imageId: string) => void;
  onUpdateImageDescription?: (imageId: string, description: string) => void;
  isGenerating?: boolean;
  children?: ReactNode;
}

export default function PageRenderer({
  page,
  pageNumber,
  header,
  logo,
  onRemoveImage,
  onGenerateImageDescription,
  onUpdateImageDescription,
  isGenerating = false,
  children
}: PageRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      className="mx-auto bg-white shadow-md pdf-page"
      style={{
        width: `${PAGE_DIMENSIONS.WIDTH_PX}px`,
        height: `${PAGE_DIMENSIONS.HEIGHT_PX}px`,
        position: 'relative',
        overflow: 'hidden',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        display: 'block'
      }}
      data-page-id={page.id}
    >
      {/* Compact Header - position varies based on page type */}
      <div className="absolute pdf-header" style={{ 
        top: page.type === 'photo-appendix' ? `${PAGE_DIMENSIONS.MARGIN_PX * 0.15}px` : `${PAGE_DIMENSIONS.MARGIN_PX * 0.3}px`, 
        left: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
        right: `${PAGE_DIMENSIONS.MARGIN_PX}px` 
      }}>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-red-600 font-bold text-sm">{header.companyName}</div>
            <div className="text-xs">{header.documentTitle}</div>
          </div>
          <div>
            {logo && (
              <Image
                src={logo.url}
                alt="Company Logo"
                width={logo.width * 0.8}
                height={logo.height * 0.8}
                priority
              />
            )}
          </div>
        </div>
      </div>

      {/* Page content - adjusted based on page type */}
      <div 
        className={`absolute overflow-hidden content-container ${page.type === 'photo-appendix' ? 'photo-appendix-content' : ''}`}
        style={{ 
          // Further increased for photo appendix to avoid header clash
          top: page.type === 'photo-appendix' ? `${PAGE_DIMENSIONS.MARGIN_PX * 0.9}px` : `${PAGE_DIMENSIONS.MARGIN_PX * 0.8}px`,
          left: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
          right: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
          bottom: `${PAGE_DIMENSIONS.MARGIN_PX + 20}px`,  // Adjusted for footer
          maxHeight: `${PAGE_DIMENSIONS.HEIGHT_PX - (PAGE_DIMENSIONS.MARGIN_PX + 68)}px` // More content space
        }}
      >
        {page.type === 'photo-appendix' ? (
          // For photo appendix pages, extremely minimal content area
          <div 
            ref={contentRef} 
            className="cursor-text always-editable-wrapper appendix-header-container"
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
              minHeight: '35px', // Absolute minimum height
              height: 'auto',
              marginBottom: '0',
              paddingBottom: '0',
              paddingTop: '0',
              marginTop: '0'
            }}
          >
            {children}
          </div>
        ) : (
          // For standard pages, use the normal content area
          <div 
            ref={contentRef} 
            className="cursor-text min-h-[300px] always-editable-wrapper"
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            {children}
          </div>
        )}
        
        {/* Page images - Different layout based on page type */}
        {page.images.length > 0 && (
          page.type === 'photo-appendix' ? (
            // Photo Appendix Layout - Two photos per row with numbered sections - absolute minimal margin
            <div style={{ marginTop: '4px' }} className="photo-grid-container">
              <div className="grid grid-cols-2 gap-6">
                {page.images.map((image, idx) => (
                  <div key={image.id} className="photo-appendix-item">
                    {/* Photograph section with numbering */}
                    <div className="mb-1 font-medium text-sm">Photograph {String(idx + 1).padStart(2, '0')}</div>
                    
                    {/* Photo container with 4:3 aspect ratio */}
                    <div className="relative mb-2" style={{ width: '100%', paddingBottom: '75%' }}>
                      <div className="absolute inset-0">
                        <img 
                          src={image.url} 
                          alt={`Photograph ${idx + 1}`} 
                          className="w-full h-full object-cover rounded-md"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          onClick={() => onRemoveImage(image.id)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Description area - make it editable */}
                    <div className="relative">
                      <div 
                        className="text-xs mb-1 border border-transparent hover:border-gray-200 p-1 rounded" 
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => {
                          // Save the edited description
                          if (onUpdateImageDescription && e.currentTarget.textContent !== null) {
                            onUpdateImageDescription(image.id, e.currentTarget.textContent);
                          }
                        }}
                      >
                        {image.description || "Description: View of property showing general condition."}
                      </div>
                      
                      {/* AI Description button */}
                      {onGenerateImageDescription && (
                        <button
                          className={`text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md 
                                     hover:bg-blue-100 flex items-center mb-3
                                     ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => onGenerateImageDescription(image.id)}
                          disabled={isGenerating}
                        >
                          <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9.5 14.5L12 12m0 0l2.5-2.5M12 12l-2.5-2.5M12 12l2.5 2.5" />
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                          {isGenerating ? 'Generating...' : 'AI Description'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Standard Page Image Layout
            <div className="mt-4 grid grid-cols-2 gap-4">
              {page.images.map(image => (
                <div key={image.id} className="relative">
                  <img 
                    src={image.url} 
                    alt="Report image" 
                    className="w-full h-auto rounded-md"
                  />
                  <button
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    onClick={() => onRemoveImage(image.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      
      {/* Compact Footer */}
      <div className="absolute flex justify-between pdf-footer" style={{ 
        bottom: `${PAGE_DIMENSIONS.MARGIN_PX * 0.3}px`, 
        left: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
        right: `${PAGE_DIMENSIONS.MARGIN_PX}px` 
      }}>
        <div className="text-xs">
          <div>Project: {header.projectNumber} | Issued: {header.issueDate}</div>
        </div>
        <div className="text-xs">Page {pageNumber}</div>
      </div>
    </div>
  );
}