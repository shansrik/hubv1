"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent, BubbleMenu, FloatingMenu, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import { 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Sparkles,
  Plus,
  Save,
  X,
  MenuIcon
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"

interface ProseMirrorEditorProps {
  initialContent?: string
  onSave?: (content: string) => void
  onCancel?: () => void
}

export default function ProseMirrorEditor({ 
  initialContent = '<p>Start typing...</p>', 
  onSave,
  onCancel 
}: ProseMirrorEditorProps) {
  const { toast } = useToast()
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  
  // Add a state to track if the floating menu should be shown
  const [showFloatingMenu, setShowFloatingMenu] = useState(false)
  
  // Track cursor position for menu button
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 })
  
  // Reference to the menu button
  const menuButtonRef = useRef<HTMLDivElement>(null)
  
  // Create a custom extension to handle menu positioning
  const MenuButtonExtension = Extension.create({
    name: 'menuButton',
    
    addProseMirrorPlugins() {
      return [
        {
          view: () => ({
            update: (view) => {
              try {
                if (menuButtonRef.current && view && view.state) {
                  const { state } = view
                  const { selection } = state
                  
                  if (selection) {
                    const { empty, $anchor } = selection
                    
                    // Only show at the start of a paragraph
                    const isAtStart = $anchor && $anchor.parentOffset === 0
                    
                    if (empty && isAtStart) {
                      try {
                        const coords = view.coordsAtPos($anchor.pos)
                        menuButtonRef.current.style.display = 'block'
                        menuButtonRef.current.style.top = `${coords.top - 8}px`
                      } catch (posError) {
                        // If we can't get position, hide the menu
                        menuButtonRef.current.style.display = 'none'
                        console.error("Position error:", posError)
                      }
                    } else {
                      menuButtonRef.current.style.display = 'none'
                    }
                  } else {
                    menuButtonRef.current.style.display = 'none'
                  }
                }
              } catch (error) {
                console.error("Menu button update error:", error)
              }
              return true
            }
          })
        }
      ]
    }
  })
  
  // Initialize Tiptap editor with basic extensions
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
    ],
    content: initialContent,
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[300px] px-2 py-4 cursor-text',
      },
    },
    onFocus: () => {
      console.log("Editor focused");
      setShowFloatingMenu(true);
    },
    onBlur: () => {
      console.log("Editor blurred");
      setTimeout(() => setShowFloatingMenu(false), 200);
    },
  })
  
  // Autosave content with debounce
  const saveContent = useCallback(() => {
    if (!editor || !onSave) return
    
    const html = editor.getHTML()
    onSave(html)
    
    // Update last saved timestamp
    setLastSavedAt(new Date())
    
    // Silent save - no toast notification for autosave
    // We'll only show toasts for explicit user actions
  }, [editor, onSave])
  
  // Debounced autosave - waits 1.5 seconds after typing stops
  useEffect(() => {
    if (!editor) return
    
    // Set up a timeout for autosave
    let saveTimeout: NodeJS.Timeout

    // Add transaction listener to editor
    const updateListener = () => {
      // Clear existing timeout
      if (saveTimeout) clearTimeout(saveTimeout)
      
      // Set new timeout
      saveTimeout = setTimeout(() => {
        saveContent()
      }, 1500) // 1.5 seconds debounce
    }

    // Add event listener
    editor.on('update', updateListener)
    
    // Clean up
    return () => {
      editor.off('update', updateListener)
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  }, [editor, saveContent])
  
  // Cancel editing
  const cancelEditing = useCallback(() => {
    if (onCancel) onCancel()
  }, [onCancel])
  
  // AI text enhancement
  const enhanceWithAI = async (promptType: string) => {
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
        const { paragraph } = editor.getAttributes('paragraph')
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
      
      let enhancedText = ''
      
      // Simulate different AI enhancements based on prompt type
      // In a real implementation, this would call an AI API
      switch (promptType) {
        case 'follow-up':
          enhancedText = `${text} Additionally, this approach offers several advantages including improved efficiency and scalability when dealing with complex systems.`
          break
        case 'professional':
          enhancedText = `This document outlines the strategic approach to implementing the solution, highlighting key considerations and technical requirements. The methodology employed ensures optimal outcomes while mitigating potential risks.`
          break
        case 'casual':
          enhancedText = `Hey there! Here's the deal: we're going to set this up in a super simple way. You'll find it's pretty straightforward and actually kind of fun to work with.`
          break
        case 'concise':
          enhancedText = `Implementation requires three steps: analysis, development, and deployment. Each phase has distinct milestones and deliverables.`
          break
        case 'expand':
          enhancedText = `${text} To elaborate further, this concept encompasses multiple dimensions including technical feasibility, resource allocation, timeline constraints, and stakeholder alignment. When properly implemented, the solution can dramatically improve operational efficiency while simultaneously reducing costs and enhancing user satisfaction.`
          break
        case 'grammar':
          // Simple grammar fix simulation
          enhancedText = text.replace(/\s+([,.!?])/g, '$1')
                            .replace(/\bi\b/g, 'I')
                            .replace(/dont/g, "don't")
          break
        default:
          enhancedText = text
      }
      
      // Simulate a 1-second delay for AI processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Replace the selected text with the enhanced text
      if (isSelection) {
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(enhancedText)
          .run()
      } else {
        // Replace the current paragraph
        editor
          .chain()
          .focus()
          .selectParentNode()
          .deleteSelection()
          .insertContent(`<p>${enhancedText}</p>`)
          .run()
      }
      
      toast({
        title: "AI Enhancement Applied",
        description: `Text ${promptType === 'grammar' ? 'corrected' : 'enhanced'} using AI.`,
        duration: 3000
      })
    } catch (error) {
      console.error("Error enhancing text:", error)
      toast({
        title: "Enhancement failed",
        description: "There was an error enhancing your text.",
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
  
  // Add effect to ensure editor is fully initialized
  useEffect(() => {
    if (editor) {
      console.log("Editor initialized successfully");
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden relative p-8">
        <div className="flex items-center justify-center h-40">
          <div className="text-gray-500">Loading editor...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative editor-container">
      {/* No container UI or Save/Cancel buttons - borderless design */}
      
      {/* Small autosave indicator */}
      {lastSavedAt && (
        <div className="absolute top-2 right-2 text-xs text-gray-400 z-10">
          {`Saved ${lastSavedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
        </div>
      )}
      
      {/* Optional placeholder text that shows up when editor is empty */}
      {editor?.isEmpty && !editor?.isFocused && (
        <div className="absolute top-4 left-2 text-gray-400 pointer-events-none">
          Click to edit text...
        </div>
      )}
      
      {/* Editor content with menu trigger */}
      <div className="relative" onClick={() => editor?.commands.focus()}>
        {/* Menu button removed - using the left margin menu instead */}
        <div className="flex">
          {/* Left margin with menu */}
          <div className="w-10 flex-shrink-0 relative">
            <div className="absolute top-4 left-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="right" className="p-0 w-44">
                  <div className="flex flex-col py-1">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start rounded-none h-8 px-3"
                      onClick={() => editor?.chain().focus().setParagraph().run()}
                    >
                      <span className="text-sm">Text</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start rounded-none h-8 px-3"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    >
                      <Heading1 className="h-4 w-4 mr-2" />
                      <span className="text-sm">Heading 1</span>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start rounded-none h-8 px-3"
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    >
                      <List className="h-4 w-4 mr-2" />
                      <span className="text-sm">Bullet List</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Editor content */}
          <div className="flex-grow">
            <EditorContent editor={editor} />
          </div>
        </div>
        
        {/* Bubble menu that appears on text selection */}
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
                onClick={() => editor.chain().focus().toggleStrike().run()} 
                className="h-7 w-7 p-0"
              >
                <Underline className="h-3.5 w-3.5" />
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
              
              {/* AI Quick Actions */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 px-1 text-yellow-500"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">AI</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1">
                  <div className="flex flex-col space-y-1">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => enhanceWithAI('expand')}
                    >
                      Expand with AI
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => enhanceWithAI('concise')}
                    >
                      Make concise
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => enhanceWithAI('grammar')}
                    >
                      Fix grammar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </BubbleMenu>
        )}
        
        {/* Floating menu disabled - using custom menu button instead */}
        {false && editor && showFloatingMenu && (
          <FloatingMenu 
            editor={editor} 
            tippyOptions={{ 
              duration: 100,
              placement: 'left-start',
              offset: [10, 10],
              trigger: 'click',
              hideOnClick: false,
              interactive: true,
              appendTo: () => document.body
            }}
            className="floating-menu"
          >
            <div className="bg-white rounded-md shadow-lg border border-gray-200 py-2">
              <div className="flex flex-col gap-1">
                {/* Paragraph */}
                <Button 
                  size="sm" 
                  variant={editor.isActive('paragraph') && !editor.isActive('heading') ? 'default' : 'ghost'}
                  onClick={() => editor.chain().focus().setParagraph().run()}
                  className="justify-start rounded-none px-3 h-8"
                >
                  <span className="text-sm">Text</span>
                </Button>
                
                {/* Heading 1 */}
                <Button 
                  size="sm" 
                  variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'} 
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className="justify-start rounded-none px-3 h-8"
                >
                  <Heading1 className="h-4 w-4 mr-2" />
                  <span className="text-lg font-bold">Heading 1</span>
                </Button>
                
                {/* Heading 2 */}
                <Button 
                  size="sm" 
                  variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'} 
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className="justify-start rounded-none px-3 h-8"
                >
                  <Heading2 className="h-4 w-4 mr-2" />
                  <span className="text-md font-bold">Heading 2</span>
                </Button>
                
                {/* Heading 3 */}
                <Button 
                  size="sm" 
                  variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'} 
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className="justify-start rounded-none px-3 h-8"
                >
                  <Heading3 className="h-4 w-4 mr-2" />
                  <span className="text-sm font-bold">Heading 3</span>
                </Button>
                
                <div className="mx-3 my-1 border-t border-gray-200"></div>
                
                {/* Bullet List */}
                <Button 
                  size="sm" 
                  variant={editor.isActive('bulletList') ? 'default' : 'ghost'} 
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className="justify-start rounded-none px-3 h-8"
                >
                  <List className="h-4 w-4 mr-2" />
                  <span className="text-sm">Bullet List</span>
                </Button>
                
                {/* Ordered List */}
                <Button 
                  size="sm" 
                  variant={editor.isActive('orderedList') ? 'default' : 'ghost'} 
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className="justify-start rounded-none px-3 h-8"
                >
                  <ListOrdered className="h-4 w-4 mr-2" />
                  <span className="text-sm">Ordered List</span>
                </Button>
                
                <div className="mx-3 my-1 border-t border-gray-200"></div>
                
                {/* Blockquote */}
                <Button 
                  size="sm" 
                  variant={editor.isActive('blockquote') ? 'default' : 'ghost'} 
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className="justify-start rounded-none px-3 h-8"
                >
                  <Quote className="h-4 w-4 mr-2" />
                  <span className="text-sm">Quote</span>
                </Button>
                
                {/* Code Block */}
                <Button 
                  size="sm" 
                  variant={editor.isActive('codeBlock') ? 'default' : 'ghost'} 
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className="justify-start rounded-none px-3 h-8"
                >
                  <Code className="h-4 w-4 mr-2" />
                  <span className="text-sm">Code Block</span>
                </Button>
                
                <div className="mx-3 my-1 border-t border-gray-200"></div>
                
                {/* AI Enhancement */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="justify-start rounded-none px-3 h-8 text-yellow-500"
                      disabled={isGeneratingAI}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      <span className="text-sm">AI Enhance</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-1">
                    <div className="flex flex-col space-y-1">
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => enhanceWithAI('follow-up')}
                        disabled={isGeneratingAI}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                        <span>Add follow-up sentence</span>
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => enhanceWithAI('professional')}
                        disabled={isGeneratingAI}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                        <span>Rewrite professionally</span>
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => enhanceWithAI('casual')}
                        disabled={isGeneratingAI}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                        <span>Rewrite casually</span>
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => enhanceWithAI('concise')}
                        disabled={isGeneratingAI}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                        <span>Make concise</span>
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => enhanceWithAI('expand')}
                        disabled={isGeneratingAI}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                        <span>Expand with details</span>
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => enhanceWithAI('grammar')}
                        disabled={isGeneratingAI}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                        <span>Fix grammar & spelling</span>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </FloatingMenu>
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