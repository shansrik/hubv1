import { Photo } from './photo-types';

// Default sample photo data
export const DEFAULT_PHOTOS: Photo[] = [
  { id: "image_e9f1", path: "/placeholder.svg?height=200&width=200", name: "Sample Photo 1", description: "Sample description" },
  { id: "image_db91", path: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop", name: "Office Interior", description: "Modern office space with natural lighting" },
  { id: "image_bb59", path: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop", name: "Conference Room", description: "Large conference room with glass walls" },
  { id: "image_ae40", path: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop", name: "Workspace", description: "Minimalist workspace with desk" },
];

// Local storage key for saved photos
export const STORAGE_KEY = 'report-editor-photos';

// Generate a unique ID for a new photo
export const generatePhotoId = (): string => {
  return `upload_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
};

// Load photos from localStorage
export const loadPhotosFromStorage = (): Photo[] => {
  try {
    const savedPhotos = localStorage.getItem(STORAGE_KEY);
    if (savedPhotos) {
      return JSON.parse(savedPhotos);
    }
    return DEFAULT_PHOTOS;
  } catch (error) {
    console.error("Error loading photos from localStorage:", error);
    return DEFAULT_PHOTOS;
  }
};

// Save photos to localStorage
export const savePhotosToStorage = (photos: Photo[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    return true;
  } catch (error) {
    console.error("Error saving photos to localStorage:", error);
    return false;
  }
};

// Filter photos based on query
export const filterPhotos = (photos: Photo[], query: string): Photo[] => {
  if (!query) {
    return photos;
  }
  
  const lowercaseQuery = query.toLowerCase();
  return photos.filter(
    (photo) => 
      photo.id.toLowerCase().includes(lowercaseQuery) ||
      photo.name.toLowerCase().includes(lowercaseQuery) ||
      photo.description.toLowerCase().includes(lowercaseQuery)
  );
};