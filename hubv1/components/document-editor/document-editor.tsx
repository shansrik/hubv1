"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Bold, Italic, Underline as UnderlineIcon, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Toolbar from './toolbar'
import { EditorProps, AIEnhancementOptions } from './types'
import { getSelectedPhotoFromUI, resizeImage, createEditorReferenceContext } from './utils'

export default function DocumentEditor({ 
  initialContent = '<p>Start typing...</p>', 
  onSave,
  onCancel,
  alwaysEditable = false
}: EditorProps) {
  const { toast } = useToast()
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  
  // Initialize Tiptap editor with extensions
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[300px] px-4 py-4 cursor-text',
      },
    },
    editable: true,
  })
  
  // Autosave with debounce
  const saveContent = useCallback(() => {
    if (!editor || !onSave) return
    
    try {
      const html = editor.getHTML()
      onSave(html)
      
      // Update last saved timestamp
      setLastSavedAt(new Date())
    } catch (error) {
      console.error("Error saving content:", error)
    }
  }, [editor, onSave])
  
  // Debounced autosave - waits 1.5 seconds after typing stops
  useEffect(() => {
    if (!editor) return
    
    let saveTimeout: NodeJS.Timeout
    
    const updateListener = () => {
      if (saveTimeout) clearTimeout(saveTimeout)
      
      saveTimeout = setTimeout(() => {
        if (editor && editor.isEditable) {
          saveContent()
        }
      }, 1500) // 1.5 seconds debounce
    }
    
    editor.on('update', updateListener)
    
    return () => {
      editor.off('update', updateListener)
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  }, [editor, saveContent])
  
  // Cancel editing
  const cancelEditing = useCallback(() => {
    if (onCancel) onCancel()
  }, [onCancel])
  
  // AI text enhancement handler
  const enhanceWithAI = async (options: AIEnhancementOptions) => {
    if (!editor) return
    
    setIsGeneratingAI(true)
    
    try {
      // Get the selected text or use the whole paragraph if nothing is selected
      const { from, to } = editor.state.selection
      const isSelection = from !== to
      
      // Get the text to enhance
      let text = ''
      if (isSelection) {
        text = editor.state.doc.textBetween(from, to)
      } else {
        // Get current paragraph text
        const node = editor.state.selection.$from.node()
        text = node.textContent
      }
      
      if (!text) {
        toast({
          title: "No text selected",
          description: "Please select some text to enhance.",
          variant: "destructive"
        })
        setIsGeneratingAI(false)
        return
      }
      
      // Load reference materials
      const referenceContext = createEditorReferenceContext()
      
      // Build system prompt with reference materials
      const systemPrompt = `
        You are an expert text editor who helps improve document text based on specific instructions.
        Your task is to enhance the given text according to the specific request.
        
        ${referenceContext}
        
        Guidelines:
        - Maintain the original meaning and key information
        - Follow the style guidelines provided above
        - Only make the requested changes
        - Use proper grammar and punctuation
        - Use terminology correctly as defined in the reference materials
        - Be concise yet clear
        - Return ONLY the enhanced text without any additional comments
      `
      
      // Check for selected photo
      const selectedPhoto = getSelectedPhotoFromUI()
      const photoDescription = selectedPhoto?.description
      
      // Create user prompt based on enhancement type and photo context
      let userPrompt = ''
      let toastMessage = ''
      
      // Base context for photo if available
      const photoContext = selectedPhoto 
        ? `\n\nReference the following image description in your response: "${photoDescription}"\n` 
        : ''
      
      // Handle different prompt types
      if (options.type === 'custom' && options.customPrompt) {
        userPrompt = `${options.customPrompt}${photoContext}\n\nHere is the original text:\n"${text}"\n\nProvide your enhanced version that incorporates both the text and any image context provided:`
        toastMessage = selectedPhoto ? "Custom enhancement with photo context applied" : "Custom enhancement applied"
      } else {
        // Standard prompt types with photo context
        switch (options.type) {
          case 'follow-up':
            userPrompt = `Add a compelling follow-up sentence to this text that expands on the main idea.${photoContext}\nOriginal text: "${text}"\nOnly output the new sentence:`
            toastMessage = selectedPhoto ? "Follow-up with photo context added" : "Follow-up sentence added"
            break
          case 'professional':
            userPrompt = `Rewrite this text in a more professional, formal tone suitable for business communication.${photoContext}\nOriginal text: "${text}"\nProvide the rewritten text:`
            toastMessage = selectedPhoto ? "Text rewritten with photo context" : "Text rewritten in professional tone"
            break
          case 'concise':
            userPrompt = `Make this text more concise while preserving the key information.${photoContext}\nOriginal text: "${text}"\nProvide the concise version:`
            toastMessage = selectedPhoto ? "Text made concise with photo reference" : "Text made concise"
            break
          case 'expand':
            userPrompt = `Expand this text with more details and explanation.${photoContext}\nOriginal text: "${text}"\nProvide the expanded version:`
            toastMessage = selectedPhoto ? "Text expanded with photo details" : "Text expanded with details"
            break
          case 'grammar':
            userPrompt = `Fix any grammar, spelling, or punctuation errors in this text without changing its meaning.${photoContext}\nOriginal text: "${text}"\nProvide the corrected text:`
            toastMessage = "Grammar corrected"
            break
          default:
            userPrompt = `Improve this text${selectedPhoto ? ' and incorporate details from the referenced image' : ''}.${photoContext}\nOriginal text: "${text}"\nProvide the improved version:`
            toastMessage = selectedPhoto ? "Text enhanced with photo context" : "Text enhanced"
        }
      }
      
      // Get photo data if available
      let photoData = null
      if (selectedPhoto) {
        try {
          // If the image is a remote URL, fetch and convert it to base64
          if (selectedPhoto.path.startsWith('http') && !selectedPhoto.path.startsWith('data:')) {
            const response = await fetch(selectedPhoto.path)
            const blob = await response.blob()
            
            const reader = new FileReader()
            photoData = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })
          } else {
            // Use the path directly if it's already a data URL
            photoData = selectedPhoto.path
          }
          
          // Resize the image to optimize for API calls
          if (photoData) {
            try {
              // First try with moderate quality
              photoData = await resizeImage(photoData, 800, 600, 0.7)
              
              // If still large, try more aggressive compression
              if (photoData.length > 1000000) { // If over ~1MB
                photoData = await resizeImage(photoData, 640, 480, 0.5)
              }
              
              // If STILL too large, apply maximum compression
              if (photoData.length > 500000) { // If over ~500KB
                photoData = await resizeImage(photoData, 400, 300, 0.3)
              }
            } catch (resizeError) {
              console.error('Error resizing image:', resizeError)
            }
          }
        } catch (error) {
          console.error('Error processing photo:', error)
          photoData = null
        }
      }
      
      // Enhanced system prompt with photo context
      if (selectedPhoto) {
        systemPrompt = `${systemPrompt}\n\nIMPORTANT: There is a selected photo that should be analyzed and referenced in your response. Your task is to enhance the text while incorporating relevant details from this photo. Make sure to explicitly reference visual elements from the photo in your response.`
      }
      
      // Call our consolidated AI API route
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          includePhoto: !!photoData,
          photoData
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("AI API route error:", errorData)
        throw new Error(`API error: ${response.status} - ${errorData.error || "Unknown error"}`)
      }
      
      const data = await response.json()
      
      if (!data.content) {
        console.error("Missing content in API response:", data)
        throw new Error("Invalid API response format")
      }
      
      // Replace the selected text with the enhanced text
      if (isSelection) {
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(data.content)
          .run()
      } else {
        // Replace the current paragraph
        editor
          .chain()
          .focus()
          .selectParentNode()
          .deleteSelection()
          .insertContent(`<p>${data.content}</p>`)
          .run()
      }
      
      toast({
        title: "AI Enhancement Applied",
        description: toastMessage,
        duration: 3000
      })
    } catch (error) {
      console.error("Error enhancing text:", error)
      toast({
        title: "Enhancement failed",
        description: "There was an error enhancing your text with AI.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save on Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveContent()
      }
      
      // Cancel on Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelEditing()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [saveContent, cancelEditing])
  
  // Keep editor editable in always-editable mode
  useEffect(() => {
    if (editor && alwaysEditable) {
      editor.setEditable(true)
    }
  }, [editor, alwaysEditable])
  
  if (!editor) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden relative p-8">
        <div className="flex items-center justify-center h-40">
          <div className="text-gray-500">Loading editor...</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="editor-container">
      {/* Toolbar */}
      <div className="mb-2">
        <Toolbar 
          editor={editor} 
          isGeneratingAI={isGeneratingAI} 
          onEnhanceWithAI={enhanceWithAI} 
        />
      </div>
      
      {/* Small autosave indicator */}
      {lastSavedAt && (
        <div className="absolute top-2 right-2 text-xs text-gray-400 z-10">
          {`Saved ${lastSavedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
        </div>
      )}
      
      {/* Editor content */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden relative">
        {/* Editor wrapper */}
        <div className="relative min-h-[300px]">
          <EditorContent editor={editor} />
          
          {/* Placeholder text when editor is empty */}
          {editor?.isEmpty && !editor?.isFocused && (
            <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
              Click to edit text...
            </div>
          )}
        </div>
        
        {/* Bubble menu for selections */}
        {editor && (
          <BubbleMenu 
            editor={editor} 
            tippyOptions={{ duration: 100 }}
          >
            <div className="bg-white rounded-md shadow-lg border border-gray-200 p-1 flex items-center gap-1">
              <Button 
                size="sm" 
                variant={editor.isActive('bold') ? 'default' : 'ghost'} 
                onClick={() => editor.chain().focus().toggleBold().run()}
                className="h-7 w-7 p-0"
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              
              <Button 
                size="sm" 
                variant={editor.isActive('italic') ? 'default' : 'ghost'} 
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className="h-7 w-7 p-0"
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              
              <Button 
                size="sm" 
                variant={editor.isActive('underline') ? 'default' : 'ghost'} 
                onClick={() => editor.chain().focus().toggleUnderline().run()} 
                className="h-7 w-7 p-0"
              >
                <UnderlineIcon className="h-3.5 w-3.5" />
              </Button>
              
              <div className="mx-0.5 h-4 border-l border-gray-300"></div>
              
              <Button 
                size="sm" 
                variant={editor.isActive('highlight') ? 'default' : 'ghost'} 
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className="h-7 p-0 px-1"
              >
                <span className="text-xs">Highlight</span>
              </Button>
              
              <div className="mx-0.5 h-4 border-l border-gray-300"></div>
              
              {/* Quick AI action */}
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 px-1 text-yellow-500"
                disabled={isGeneratingAI}
                onClick={() => enhanceWithAI({ type: 'expand' })}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Expand</span>
              </Button>
            </div>
          </BubbleMenu>
        )}
        
        {/* AI generation overlay */}
        {isGeneratingAI && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
              <span className="text-sm font-medium">AI is enhancing your text...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}