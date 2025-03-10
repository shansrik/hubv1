"use client"

import { useRef, ReactNode } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { PAGE_DIMENSIONS, ReportHeader, ReportPage, CompanyLogo } from "./types";

interface PageRendererProps {
  page: ReportPage;
  pageNumber: number;
  header: ReportHeader;
  logo: CompanyLogo;
  onRemoveImage: (imageId: string) => void;
  children?: ReactNode;
}

export default function PageRenderer({
  page,
  pageNumber,
  header,
  logo,
  onRemoveImage,
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
      {/* Compact Header */}
      <div className="absolute pdf-header" style={{ 
        top: `${PAGE_DIMENSIONS.MARGIN_PX * 0.3}px`, 
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

      {/* Page content - adjusted for compact header and more content space */}
      <div 
        className="absolute overflow-hidden content-container"
        style={{ 
          top: `${PAGE_DIMENSIONS.MARGIN_PX * 0.8}px`, // Reduced top margin for more content space 
          left: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
          right: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
          bottom: `${PAGE_DIMENSIONS.MARGIN_PX + 20}px`,  // Adjusted for footer
          maxHeight: `${PAGE_DIMENSIONS.HEIGHT_PX - (PAGE_DIMENSIONS.MARGIN_PX + 68)}px` // More content space
        }}
      >
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
        
        {/* Page images */}
        {page.images.length > 0 && (
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