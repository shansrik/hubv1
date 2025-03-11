/**
 * Type definitions for report editor components
 */

export interface ReportHeader {
  companyName: string;
  documentTitle: string;
  projectNumber: string;
  issueDate: string;
}

export interface ReportPhoto {
  id: string;
  url: string;
  sectionId: string | null;
  subsectionId: string | null;
}

export type PageType = 'standard' | 'photo-appendix';

export interface ReportPage {
  id: string;
  content: string;
  images: ReportImage[];
  type?: PageType;
}

export interface ReportImage {
  id: string;
  url: string;
  width: number;
  height: number;
  description?: string;
  originalPhotoId?: string; // To keep track of the source photo ID for AI generation
}

export interface ReportSection {
  id: string;
  title: string;
  content?: string;
  subsections?: ReportSubsection[];
}

export interface ReportSubsection {
  id: string;
  title: string;
  content: string;
}

export interface CompanyLogo {
  url: string;
  width: number;
  height: number;
}

// Page dimensions
export const PAGE_DIMENSIONS = {
  WIDTH_INCHES: 8.5,
  HEIGHT_INCHES: 11,
  DPI: 96,
  MARGIN_INCHES: 1,
  
  // Computed properties
  get WIDTH_PX() { return this.WIDTH_INCHES * this.DPI; },
  get HEIGHT_PX() { return this.HEIGHT_INCHES * this.DPI; },
  get MARGIN_PX() { return this.MARGIN_INCHES * this.DPI; },
};