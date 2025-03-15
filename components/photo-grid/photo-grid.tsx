"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Trash2, Upload, RefreshCw, ZoomIn, ZoomOut, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Photo, PhotoGridProps } from './photo-types'
import { 
  loadPhotosFromStorage, 
  savePhotosToStorage, 
  filterPhotos, 
  generatePhotoId 
} from './photo-utils'

export default function PhotoGrid({ filterQuery, headingContext, selectedPhotos, onSelectPhoto }: PhotoGridProps) {
  const { toast } = useToast()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([])
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isLoadingSection, setIsLoadingSection] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load photos from localStorage on mount
  useEffect(() => {
    const loadedPhotos = loadPhotosFromStorage();
    setPhotos(loadedPhotos);
  }, [])

  // Save photos to localStorage when they change
  useEffect(() => {
    if (photos.length > 0) {
      const success = savePhotosToStorage(photos);
      if (!success) {
        toast({
          title: "Storage Error",
          description: "Failed to save photos to local storage. Try clearing some space.",
          variant: "destructive"
        });
      }
    }
  }, [photos, toast])

  // Track heading context changes for loading animation
  useEffect(() => {
    if (headingContext) {
      setIsLoadingSection(true);
      // Short timeout to show loading animation even if filtering is fast
      setTimeout(() => {
        setIsLoadingSection(false);
      }, 600);
    }
  }, [headingContext]);

  // Filter photos based on search query and heading context
  useEffect(() => {
    setFilteredPhotos(filterPhotos(photos, filterQuery, headingContext))
  }, [filterQuery, headingContext, photos])

  // Handle photo upload
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Process each uploaded file
    Array.from(files).forEach(file => {
      // Only process image files
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image file`,
          variant: "destructive" 
        })
        return
      }

      const reader = new FileReader()
      
      reader.onload = (e) => {
        if (e.target?.result) {
          // Create a new photo object
          const newPhoto: Photo = {
            id: generatePhotoId(),
            path: e.target.result as string,
            name: file.name,
            tags: [], // Empty tags array initially
            dataUrl: e.target.result as string,
          }
          
          // Add to photos collection
          setPhotos(prevPhotos => [...prevPhotos, newPhoto])
          
          toast({
            title: "Photo Uploaded",
            description: `${file.name} has been added to your collection`
          })
        }
      }
      
      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        })
      }
      
      // Read the file as a data URL
      reader.readAsDataURL(file)
    })
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Delete a photo
  const deletePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the photo when deleting
    
    setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== id))
    
    // If the photo was selected, deselect it
    if (selectedPhotos.includes(id)) {
      onSelectPhoto(id)
    }
    
    toast({
      title: "Photo Deleted",
      description: "The photo has been removed from your collection"
    })
  }

  // Generate AI tags for photos using API
  const generateTags = async () => {
    // Find photos without tags or with empty tags
    const photosWithoutTags = photos.filter(photo => !photo.tags || photo.tags.length === 0);
    
    if (photosWithoutTags.length === 0) {
      toast({
        title: "No Action Needed",
        description: "All photos already have tags"
      })
      return
    }
    
    setIsGeneratingDescriptions(true)
    
    try {
      // Create a copy of photos to update
      const updatedPhotos = [...photos]
      
      // Process each photo without tags
      for (const photo of photosWithoutTags) {
        // Get the photo data - either dataUrl or path
        const imageData = photo.dataUrl || photo.path
        
        try {
          // Call our image tagging API
          const response = await fetch('/api/image-description', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageData,
              headingContext: headingContext || '',
              documentType: 'property report'
            }),
          })
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }
          
          const data = await response.json()
          
          // Find photo index
          const index = updatedPhotos.findIndex(p => p.id === photo.id)
          if (index !== -1) {
            // Update the photo with the AI-generated tags
            updatedPhotos[index] = {
              ...updatedPhotos[index],
              tags: data.tags || []
            }
          }
        } catch (photoError) {
          console.error(`Error generating tags for photo ${photo.id}:`, photoError)
          // Continue with next photo even if this one fails
        }
      }
      
      // Update the state with all the new tags
      setPhotos(updatedPhotos)
      
      toast({
        title: "Tags Generated",
        description: `Added tags to ${photosWithoutTags.length} photos`
      })
    } catch (error) {
      console.error("Error generating tags:", error)
      toast({
        title: "Generation Failed",
        description: "Could not generate tags for some photos",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingDescriptions(false)
    }
  }

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2))
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  
  // Loading animation component
  const LoadingAnimation = () => (
    <div className="flex flex-col items-center justify-center py-12 w-full h-40">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-sm text-blue-500 animate-pulse">Loading photos...</p>
    </div>
  )

  return (
    <div className="photo-grid-container flex flex-col h-full">
      {/* Upload and AI controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="text-xs"
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Upload
          </Button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            multiple 
            className="hidden" 
            onChange={handleUpload}
          />
          
          <Button
            size="sm"
            variant="outline"
            onClick={generateTags}
            disabled={isGeneratingDescriptions}
            className="text-xs"
          >
            {isGeneratingDescriptions ? (
              <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1" />
            )}
            Generate Tags
          </Button>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button size="sm" variant="ghost" onClick={zoomOut} disabled={zoom <= 0.5}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="ghost" onClick={zoomIn} disabled={zoom >= 2}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Heading context indicator */}
      {headingContext && (
        <div className="mb-3 px-2 py-1.5 bg-blue-50 rounded-md border border-blue-100 text-sm">
          <div className="font-medium text-blue-800 text-xs mb-0.5">Active section:</div>
          <div className="text-blue-700 text-xs">{headingContext}</div>
        </div>
      )}
      
      {/* Photo grid */}
      <div className="flex-grow overflow-y-auto">
        {isLoadingSection ? (
          <LoadingAnimation />
        ) : (
          <div 
            className="grid gap-3"
            style={{ 
              gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(120 * zoom, 80)}px, 1fr))`
            }}
          >
            {filteredPhotos.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-400">
                {filterQuery ? 'No photos match your search' : 'No photos available'}
              </div>
            ) : (
              filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className={`relative rounded-md overflow-hidden cursor-pointer border ${
                  selectedPhotos.includes(photo.id) ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-200"
                } group transition-all hover:shadow-md`}
                data-photo-id={photo.id}
                onClick={(e) => onSelectPhoto(photo.id, e.ctrlKey || e.metaKey)}
              >
                <div className="aspect-w-4 aspect-h-3">
                  <Image
                    src={photo.dataUrl || photo.path}
                    alt={photo.name || `Photo ${photo.id}`}
                    width={240}
                    height={180}
                    className="w-full h-full object-cover"
                    unoptimized={!!photo.dataUrl}
                  />
                </div>
                
                <div className="p-1.5 bg-white">
                  {/* Tags display - more prominent */}
                  <div className="flex flex-wrap gap-1 mb-1 max-h-8 overflow-hidden">
                    {photo.tags && photo.tags.length > 0 ? (
                      photo.tags.map((tag, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-gray-100 rounded-sm text-[9px] text-gray-700 whitespace-nowrap">
                          {tag || ''}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400">No tags</span>
                    )}
                  </div>
                  
                  {/* File name - smaller and less prominent */}
                  <p className="text-[9px] text-gray-400 truncate mt-1" title={photo.name}>
                    {photo.name}
                  </p>
                  
                  {/* Selection number indicator */}
                  {selectedPhotos.includes(photo.id) && selectedPhotos.length > 1 && (
                    <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {selectedPhotos.indexOf(photo.id) + 1}
                    </div>
                  )}
                  
                  {/* Relevance indicator - only show if relevance is meaningful */}
                  {headingContext && photo.relevance && photo.relevance > 1 && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] px-1.5 rounded-sm">
                      {photo.relevance > 3 ? 'High' : 'Med'}
                    </div>
                  )}
                </div>
                
                {/* Delete button */}
                <button
                  className="absolute top-1 right-1 p-1 rounded-full bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => deletePhoto(photo.id, e)}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </button>
              </div>
            ))
          )}
          </div>
        )}
      </div>
    </div>
  )
}