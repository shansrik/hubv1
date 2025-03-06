"use client"

import { useRef, useEffect, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import Image from "next/image"

// Standard US Letter size in inches
const LETTER_WIDTH_IN = 8.5
const LETTER_HEIGHT_IN = 11

// Convert to pixels (assuming 96 DPI for web)
const DPI = 96
const PAGE_WIDTH_PX = LETTER_WIDTH_IN * DPI
const PAGE_HEIGHT_PX = LETTER_HEIGHT_IN * DPI
const MARGIN_PX = 1 * DPI // 1 inch margins

interface PaginatedReportProps {
  children: React.ReactNode
  logo: {
    url: string
    width: number
    height: number
  }
  metadata: {
    projectNumber: string
    issueDate: string
    companyName: string
    documentTitle: string
  }
}

export default function PaginatedReport({ 
  children, 
  logo, 
  metadata 
}: PaginatedReportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Calculate number of pages based on content height
  useEffect(() => {
    const calculatePages = () => {
      if (!contentRef.current) return
      
      const contentHeight = contentRef.current.scrollHeight
      const contentPerPage = PAGE_HEIGHT_PX - (2 * MARGIN_PX) - 120 // 120px for header/footer
      const pageCount = Math.ceil(contentHeight / contentPerPage)
      
      setTotalPages(Math.max(1, pageCount))
    }
    
    calculatePages()
    
    // Recalculate when window resizes
    window.addEventListener('resize', calculatePages)
    
    return () => {
      window.removeEventListener('resize', calculatePages)
    }
  }, [children])
  
  // Track current page based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const pageHeight = PAGE_HEIGHT_PX
      const currentPageCalc = Math.floor(scrollTop / pageHeight) + 1
      
      setCurrentPage(currentPageCalc)
    }
    
    const container = containerRef.current
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
    getScrollElement: () => containerRef.current,
    estimateSize: () => PAGE_HEIGHT_PX,
    overscan: 2,
  })
  
  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      style={{
        width: '100%',
        height: '100%',
        background: '#f0f0f0',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
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
                  {virtualRow.index === 0 && children}
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
  )
}