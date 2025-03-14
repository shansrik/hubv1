/**
 * PDF Utilities for document processing
 */

import { ReportHeader } from '../report-editor/types';
import { Photo } from '../photo-grid/photo-types';

// Define the ReportData interface based on how it's used in the functions
interface ReportData {
  header?: ReportHeader;
  document?: {
    blocks: Array<{
      type?: string;
      text?: string;
      items?: string[];
      [key: string]: unknown;
    }>;
  };
  photos?: Array<{
    src: string;
    thumbnail?: string;
    width?: number;
    height?: number;
    [key: string]: unknown;
  }>;
}

/**
 * Converts a report data structure to a format suitable for PDF generation
 */
export const prepareReportForPdf = (reportData: ReportData) => {
  if (!reportData) return null;
  
  // Process header data
  const header = reportData.header || {};
  
  // Process document content
  const document = reportData.document || { blocks: [] };
  
  // Process photos
  const photos = (reportData.photos || []).map(photo => {
    return {
      ...photo,
      // Ensure photos are in a format compatible with PDF generation
      src: photo.src,
      thumbnail: photo.thumbnail || photo.src,
      width: photo.width || 800,
      height: photo.height || 600
    };
  });
  
  return {
    header,
    document,
    photos,
    metadata: {
      createdAt: new Date().toISOString(),
      version: '1.0'
    }
  };
};

/**
 * Generates an image grid for PDF output
 */
export const generateImageGrid = (photos: Photo[], maxColumns = 2) => {
  if (!photos || photos.length === 0) return [];
  
  const rows: Photo[][] = [];
  let currentRow: Photo[] = [];
  
  photos.forEach((photo, index) => {
    currentRow.push(photo);
    
    // Start a new row when we reach max columns or last photo
    if (currentRow.length === maxColumns || index === photos.length - 1) {
      rows.push([...currentRow]);
      currentRow = [];
    }
  });
  
  return rows;
};

/**
 * Optimizes images for PDF inclusion
 * Reduces size to prevent large PDFs
 */
export const optimizeImagesForPdf = async (photos: Photo[]) => {
  if (!photos || photos.length === 0) return [];
  
  return Promise.all(photos.map(async (photo) => {
    // In a real implementation, this would resize/compress the image
    // For this example, we're just passing through the original
    return {
      ...photo,
      optimized: true
    };
  }));
};

/**
 * Extracts text content from document data for indexing
 */
export const extractTextContent = (document: { blocks?: Array<{ type: string; text?: string; items?: string[] }> }) => {
  if (!document || !document.blocks) return '';
  
  return document.blocks
    .map((block) => {
      if (block.type === 'paragraph') {
        return block.text || '';
      } else if (block.type === 'heading') {
        return block.text || '';
      } else if (block.type === 'list') {
        return (block.items || []).join('\n');
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');
};

const pdfUtils = {
  prepareReportForPdf,
  generateImageGrid,
  optimizeImagesForPdf,
  extractTextContent
};

export default pdfUtils;