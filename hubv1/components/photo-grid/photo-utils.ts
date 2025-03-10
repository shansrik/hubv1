import { Photo } from './photo-types';

// Default sample photo data with tags for context-based filtering
export const DEFAULT_PHOTOS: Photo[] = [
  { 
    id: "image_e9f1", 
    path: "/placeholder.svg?height=200&width=200", 
    name: "Sample Photo 1", 
    description: "Sample description",
    tags: ["sample", "placeholder"]
  },
  { 
    id: "image_db91", 
    path: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop", 
    name: "Office Interior", 
    description: "Modern office space with natural lighting", 
    tags: ["office", "interior", "lighting", "windows", "workplace"]
  },
  { 
    id: "image_bb59", 
    path: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop", 
    name: "Conference Room", 
    description: "Large conference room with glass walls",
    tags: ["conference", "meeting", "office", "glass", "table"] 
  },
  { 
    id: "image_ae40", 
    path: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop", 
    name: "Workspace", 
    description: "Minimalist workspace with desk",
    tags: ["desk", "workspace", "minimal", "work", "office"] 
  },
  { 
    id: "image_cf72", 
    path: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&h=600&fit=crop", 
    name: "Roof Structure", 
    description: "Wood roof structure with beams and supports",
    tags: ["roof", "structure", "wood", "beams", "construction"] 
  },
  { 
    id: "image_df23", 
    path: "https://images.unsplash.com/photo-1558442074-3c19857bc1dc?w=800&h=600&fit=crop", 
    name: "Foundation Wall", 
    description: "Concrete foundation wall with waterproofing",
    tags: ["foundation", "wall", "concrete", "waterproofing", "basement"] 
  },
  { 
    id: "image_ef88", 
    path: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&h=600&fit=crop", 
    name: "HVAC System", 
    description: "Modern HVAC system in mechanical room",
    tags: ["hvac", "mechanical", "systems", "air", "ventilation", "heating"] 
  },
  { 
    id: "image_ff99", 
    path: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop", 
    name: "Electrical Panel", 
    description: "Main electrical distribution panel with breakers",
    tags: ["electrical", "panel", "breakers", "power", "wiring"] 
  }
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

// Calculate photo relevance to a heading context
export const calculatePhotoRelevance = (photo: Photo, headingContext?: string): number => {
  if (!headingContext) return 1; // Default relevance
  
  const headingWords = headingContext.toLowerCase().split(/\s+/);
  let relevanceScore = 0;
  
  // Check photo name
  headingWords.forEach(word => {
    if (word.length > 2 && photo.name.toLowerCase().includes(word)) {
      relevanceScore += 2;
    }
  });
  
  // Check photo description
  headingWords.forEach(word => {
    if (word.length > 2 && photo.description.toLowerCase().includes(word)) {
      relevanceScore += 1;
    }
  });
  
  // Check photo tags
  if (photo.tags) {
    photo.tags.forEach(tag => {
      if (headingContext.toLowerCase().includes(tag.toLowerCase())) {
        relevanceScore += 3;
      }
    });
  }
  
  return relevanceScore;
};

// Filter and sort photos based on query and heading context
export const filterPhotos = (
  photos: Photo[], 
  query: string, 
  headingContext?: string
): Photo[] => {
  let filteredPhotos = [...photos];
  
  // First filter by query if present
  if (query) {
    const lowercaseQuery = query.toLowerCase();
    filteredPhotos = filteredPhotos.filter(
      (photo) => 
        photo.id.toLowerCase().includes(lowercaseQuery) ||
        photo.name.toLowerCase().includes(lowercaseQuery) ||
        photo.description.toLowerCase().includes(lowercaseQuery) ||
        (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    );
  }
  
  // Then sort by relevance to heading context if present
  if (headingContext) {
    // Add relevance score to each photo
    filteredPhotos = filteredPhotos.map(photo => ({
      ...photo,
      relevance: calculatePhotoRelevance(photo, headingContext)
    }));
    
    // Sort by relevance (highest first)
    filteredPhotos.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }
  
  return filteredPhotos;
};