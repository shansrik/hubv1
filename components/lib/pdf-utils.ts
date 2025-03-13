/**
 * PDF Utilities for document processing
 */

import { ReportData } from '../report-editor/types';

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
export const generateImageGrid = (photos: any[], maxColumns = 2) => {
  if (!photos || photos.length === 0) return [];
  
  const rows = [];
  let currentRow = [];
  
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
export const optimizeImagesForPdf = async (photos: any[]) => {
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
export const extractTextContent = (document: any) => {
  if (!document || !document.blocks) return '';
  
  return document.blocks
    .map((block: any) => {
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