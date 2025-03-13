/**
 * Utility functions for report editor
 */
import { PAGE_DIMENSIONS, ReportPage } from './types';

/**
 * Generates a unique ID with an optional prefix
 * @param prefix Optional prefix for the ID
 * @returns A unique ID string
 */
export const generateId = (prefix: string = '') => {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Creates a new empty report page
 * @param type Optional page type, defaults to standard
 * @returns A new ReportPage object
 */
export const createEmptyPage = (type: 'standard' | 'photo-appendix' = 'standard'): ReportPage => {
  let content = '<p>Click to edit this page content...</p>';
  
  if (type === 'photo-appendix') {
    // Add specific styles directly to the heading to prevent spacing issues
    content = `<h1 style="margin-top:0; margin-bottom:5px; padding:0; line-height:1.1;">Photographic Appendix</h1>`;
  }
  
  return {
    id: generateId('page-'),
    content,
    images: [],
    type
  };
};

/**
 * Calculates the current page number based on scroll position
 * @param scrollElement The scrollable element
 * @returns The current page number
 */
export const calculateCurrentPage = (scrollElement: HTMLElement): number => {
  if (!scrollElement) return 1;
  
  const { scrollTop, clientHeight } = scrollElement;
  
  // Get the middle point of the viewport
  const viewportMidpoint = scrollTop + (clientHeight / 2);
  
  // Calculate which page is most visible
  const pageHeight = PAGE_DIMENSIONS.HEIGHT_PX + 40; // Add some margin
  const visiblePageNumber = Math.ceil(viewportMidpoint / pageHeight);
  
  return Math.max(1, visiblePageNumber);
};

/**
 * Scrolls to a specific page
 * @param scrollElement The scrollable element
 * @param pageNumber The page number to scroll to
 */
export const scrollToPage = (scrollElement: HTMLElement, pageNumber: number): void => {
  if (!scrollElement) return;
  
  const pageHeight = PAGE_DIMENSIONS.HEIGHT_PX + 40; // Add some margin
  const targetScrollPosition = (pageNumber - 1) * pageHeight;
  
  scrollElement.scrollTo({
    top: targetScrollPosition,
    behavior: 'smooth'
  });
};