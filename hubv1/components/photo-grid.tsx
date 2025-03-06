"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

// Sample photo data
const PHOTOS = [
  { id: "image_e9f1", path: "/placeholder.svg?height=200&width=200" },
  { id: "image_db91", path: "/placeholder.svg?height=200&width=200" },
  { id: "image_bb59", path: "/placeholder.svg?height=200&width=200" },
  { id: "image_ae40", path: "/placeholder.svg?height=200&width=200" },
  { id: "image_c34c", path: "/placeholder.svg?height=200&width=200" },
  { id: "image_6b0f", path: "/placeholder.svg?height=200&width=200" },
  { id: "image_4570", path: "/placeholder.svg?height=200&width=200" },
  { id: "image_1fd2", path: "/placeholder.svg?height=200&width=200" },
  { id: "image_1f29", path: "/placeholder.svg?height=200&width=200" },
  { id: "image_1d88", path: "/placeholder.svg?height=200&width=200" },
  { id: "image_ede5", path: "/placeholder.svg?height=200&width=200" },
  { id: "image_7bb3", path: "/placeholder.svg?height=200&width=200" },
]

interface PhotoGridProps {
  filterQuery: string
  selectedPhotos: string[]
  onSelectPhoto: (id: string) => void
}

export default function PhotoGrid({ filterQuery, selectedPhotos, onSelectPhoto }: PhotoGridProps) {
  const [filteredPhotos, setFilteredPhotos] = useState(PHOTOS)

  useEffect(() => {
    if (filterQuery) {
      setFilteredPhotos(PHOTOS.filter((photo) => photo.id.toLowerCase().includes(filterQuery.toLowerCase())))
    } else {
      setFilteredPhotos(PHOTOS)
    }
  }, [filterQuery])

  return (
    <div className="grid grid-cols-3 gap-2">
      {filteredPhotos.map((photo, index) => (
        <div
          key={photo.id}
          className={`relative rounded-md overflow-hidden cursor-pointer border-2 ${
            selectedPhotos.includes(photo.id) ? "border-blue-500" : "border-transparent"
          }`}
          onClick={() => onSelectPhoto(photo.id)}
        >
          <Image
            src={photo.path || "/placeholder.svg"}
            alt={`Photo ${index + 1}`}
            width={200}
            height={200}
            className="w-full h-auto"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-80 text-xs p-1 truncate text-gray-800">
            {index + 1 <= 6 ? `#${index + 1} ID: ${photo.id}` : `ID: ${photo.id}`}
          </div>
        </div>
      ))}
    </div>
  )
}

