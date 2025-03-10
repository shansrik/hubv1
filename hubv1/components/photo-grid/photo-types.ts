export interface Photo {
  id: string;
  path: string;
  name: string;
  description: string;
  dataUrl?: string; // For uploaded photos stored as data URLs
}

export interface PhotoGridProps {
  filterQuery: string;
  selectedPhotos: string[];
  onSelectPhoto: (id: string) => void;
}