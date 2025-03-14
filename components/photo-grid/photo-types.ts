export interface Photo {
  id: string;
  path: string;
  name: string;
  description?: string; // Make description optional
  dataUrl?: string; // For uploaded photos stored as data URLs
  tags?: string[]; // Associated tags for categorizing photos
  relevance?: number; // For sorting by relevance to current context
}

export interface PhotoGridProps {
  filterQuery: string;
  headingContext?: string; // Current document heading context
  selectedPhotos: string[];
  onSelectPhoto: (id: string, isCtrlPressed?: boolean) => void;
}