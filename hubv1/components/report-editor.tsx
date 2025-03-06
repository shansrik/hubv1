"use client"

import { useState, useRef } from "react"
import { SunIcon } from "lucide-react"
import PhotoGrid from "@/components/photo-grid"
import TechnicalReport from "@/components/technical-report"
import { useToast } from "@/components/ui/use-toast"

export default function ReportEditor() {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [filterQuery, setFilterQuery] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const reportRef = useRef<any>(null)
  const { toast } = useToast()

  const handleGenerateText = async (selectedText = "") => {
    try {
      setIsGenerating(true)
      // AI text generation logic here
      toast({
        title: "Text generated",
        description: "AI-generated text has been inserted into your report.",
      })
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Left panel - Photo grid */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Photos</h1>
          <button className="p-2 rounded-full hover:bg-gray-200">
            <SunIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter photos..."
            className="w-full p-2 bg-white border border-gray-300 rounded-md"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>

        <PhotoGrid
          filterQuery={filterQuery}
          selectedPhotos={selectedPhotos}
          onSelectPhoto={(id) => {
            if (selectedPhotos.includes(id)) {
              setSelectedPhotos(selectedPhotos.filter((photoId) => photoId !== id))
            } else {
              setSelectedPhotos([...selectedPhotos, id])
            }
          }}
        />
      </div>

      {/* Right panel - Technical Report */}
      <div className="w-2/3 flex flex-col bg-white overflow-y-auto">
        <TechnicalReport
          ref={reportRef}
          onGenerateText={handleGenerateText}
          isGenerating={isGenerating}
          logo={{
            url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cion-2022_logo-ai-EX34VT0pWcJr3Q13MkaRjWcjee98lR.svg",
            width: 100,
            height: 40,
          }}
        />
      </div>
    </div>
  )
}

