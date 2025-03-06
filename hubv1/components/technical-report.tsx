"use client"

import { useState, useRef, useEffect, forwardRef } from "react"
import Image from "next/image"
import type { ReportSection } from "@/types/document"

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

interface TechnicalReportProps {
  projectNumber?: string
  issueDate?: string
  companyName?: string
  documentTitle?: string
  onGenerateText: (selectedText: string) => Promise<void>
  isGenerating: boolean
  logo: {
    url: string
    width: number
    height: number
  }
}

const TechnicalReport = forwardRef<any, TechnicalReportProps>(
  (
    {
      projectNumber = "RZ1324-0XXX-00",
      issueDate = "June 1, 2020",
      companyName = "Halton Condominium Corporation No. XX",
      documentTitle = "Class 1/2/3 Comprehensive/Updated Reserve Fund Study",
      onGenerateText,
      isGenerating,
      logo,
    },
    ref,
  ) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const contentRef = useRef<HTMLDivElement>(null)

    // Calculate total pages based on content height
    useEffect(() => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight
        const pageHeight = 1056 // A4 height in pixels at 96 DPI
        setTotalPages(Math.ceil(contentHeight / pageHeight))
      }
    }, [])

    return (
      <div className="min-h-full bg-white">
        <div className="max-w-[8.5in] mx-auto">
          {/* Page content */}
          <div
            ref={contentRef}
            className="p-[1in] min-h-[11in] relative"
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "11pt",
              lineHeight: "1.5",
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="text-red-600 font-bold mb-1">{companyName}</div>
                <div className="text-black">{documentTitle}</div>
              </div>
              <Image
                src={logo?.url || "/placeholder.svg"}
                alt="Cion Logo"
                width={logo?.width || 100}
                height={logo?.height || 100}
                className="object-contain"
                priority
              />
            </div>

            {/* Main content */}
            <div className="space-y-6">
              {SECTIONS.map((section) => (
                <div key={section.id} className="space-y-4">
                  {/* Main section header */}
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-bold">{section.number}</span>
                    <span className="text-xl font-bold">|</span>
                    <span className="text-xl font-bold text-red-600">{section.title}</span>
                  </div>

                  {/* Main section content */}
                  <div className="whitespace-pre-line pl-4">{section.content}</div>

                  {/* Subsections */}
                  {section.subsections?.map((subsection) => (
                    <div key={subsection.id} className="space-y-2 mt-8">
                      <div className="flex items-baseline space-x-4">
                        <span className="font-bold text-center w-16">{subsection.number}</span>
                        <span className="font-bold">{subsection.title}</span>
                      </div>
                      <div className="whitespace-pre-line pl-20">{subsection.content}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="absolute bottom-[1in] left-[1in] right-[1in] flex justify-between text-sm">
              <div>
                <div>Project Number: {projectNumber}</div>
                <div>Issued: {issueDate}</div>
              </div>
              <div>Page | {currentPage}</div>
            </div>
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex justify-center py-4 space-x-2 sticky bottom-0 bg-white border-t">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    )
  },
)

TechnicalReport.displayName = "TechnicalReport"

export default TechnicalReport

