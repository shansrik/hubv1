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
      className="mx-auto bg-white shadow-md"
      style={{
        width: `${PAGE_DIMENSIONS.WIDTH_PX}px`,
        height: `${PAGE_DIMENSIONS.HEIGHT_PX}px`,
        position: 'relative',
        overflow: 'hidden'
      }}
      data-page-id={page.id}
    >
      {/* Header */}
      <div className="absolute" style={{ 
        top: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
        left: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
        right: `${PAGE_DIMENSIONS.MARGIN_PX}px` 
      }}>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-red-600 font-bold">{header.companyName}</div>
            <div>{header.documentTitle}</div>
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
        className="absolute overflow-hidden"
        style={{ 
          top: `${PAGE_DIMENSIONS.MARGIN_PX * 2}px`, 
          left: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
          right: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
          bottom: `${PAGE_DIMENSIONS.MARGIN_PX}px` 
        }}
      >
        <div ref={contentRef} className="cursor-text min-h-[300px] always-editable-wrapper">
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
      
      {/* Footer */}
      <div className="absolute flex justify-between text-sm" style={{ 
        bottom: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
        left: `${PAGE_DIMENSIONS.MARGIN_PX}px`, 
        right: `${PAGE_DIMENSIONS.MARGIN_PX}px` 
      }}>
        <div>
          <div>Project Number: {header.projectNumber}</div>
          <div>Issued: {header.issueDate}</div>
        </div>
        <div>Page | {pageNumber}</div>
      </div>
    </div>
  );
}