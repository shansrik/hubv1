import type React from "react"
export interface ReportSection {
  id: string
  number: string
  title: string
  content: string
  subsections?: ReportSubsection[]
}

export interface ReportSubsection {
  id: string
  number: string
  title: string
  content: string
}

export interface ReportPage {
  pageNumber: number
  content: React.ReactNode
}

export interface DocumentTemplate {
  id: string
  name: string
  description?: string
  pageSize: string
  orientation: "portrait" | "landscape"
  margins: {
    top: string
    right: string
    bottom: string
    left: string
  }
  header?: {
    height: string
    content: string
  }
  footer?: {
    height: string
    content: string
  }
  sections: DocumentSection[]
  css: string
}

interface DocumentSection {
  id: string
  type: "title" | "heading" | "text" | "image" | "table" | "list"
  content?: string
  properties?: Record<string, any>
  styles?: Record<string, string>
}

