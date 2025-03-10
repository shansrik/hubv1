import React, { useState } from 'react'
import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react'
import { 
  Bold, 
  Italic, 
  Underline, 
  Sparkles 
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { BubbleMenuProps } from '../types'
import { useToast } from '@/components/ui/use-toast'

/**
 * Text selection bubble menu component
 */
export const EditorBubbleMenu: React.FC<BubbleMenuProps> = ({ 
  editor, 
  selectedPhotoId,
  onGenerateText 
}) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const { toast } = useToast()
  const hasSelectedPhoto = !!selectedPhotoId

  /**
   * Handle AI enhancement button click
   * Creates an AI menu with various enhancement options
   */
  const handleAIMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Create a unique ID for this editor's AI menu
    const editorId = editor.options.element.getAttribute('data-editor-id') || 
                    Math.random().toString(36).substring(2, 9)
    
    // Find or create menu
    let menu = document.getElementById(`ai-menu-${editorId}`)
    
    if (!menu) {
      // Create menu if it doesn't exist
      menu = document.createElement('div')
      menu.id = `ai-menu-${editorId}`
      menu.className = "absolute right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 p-2 z-50 ai-menu-dropdown"
      menu.style.minWidth = "200px"
      
      // Create the menu items
      const menuContent = document.createElement('div')
      menuContent.className = "flex flex-col space-y-2"
      
      // Add standard AI options
      const standardOptions = [
        { label: "Expand text", action: "expand" },
        { label: "Make text concise", action: "concise" },
        { label: "Fix grammar", action: "grammar" },
        { label: "Professional tone", action: "professional" },
      ]
      
      standardOptions.forEach(option => {
        const button = document.createElement('button')
        button.className = "text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
        button.innerText = option.label
        button.setAttribute('data-action', option.action)
        menuContent.appendChild(button)
      })
      
      // Add divider
      const divider = document.createElement('div')
      divider.className = "border-t border-gray-200 my-1"
      menuContent.appendChild(divider)
      
      // Add custom prompt input
      const customPromptContainer = document.createElement('div')
      customPromptContainer.className = "mt-2"
      
      const customPromptLabel = document.createElement('label')
      customPromptLabel.className = "block text-xs text-gray-500 mb-1"
      customPromptLabel.innerText = "Custom instruction:"
      
      const customPromptInput = document.createElement('input')
      customPromptInput.className = "w-full p-1 text-sm border border-gray-300 rounded"
      customPromptInput.placeholder = "E.g., Rewrite for 5th grade level"
      customPromptInput.id = `custom-prompt-${editorId}`
      
      const customPromptButton = document.createElement('button')
      customPromptButton.className = "mt-1 w-full bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-sm"
      customPromptButton.innerText = "Apply Custom Prompt"
      customPromptButton.setAttribute('data-action', 'custom')
      
      customPromptContainer.appendChild(customPromptLabel)
      customPromptContainer.appendChild(customPromptInput)
      customPromptContainer.appendChild(customPromptButton)
      menuContent.appendChild(customPromptContainer)
      
      // Add button listeners
      menuContent.querySelectorAll('button').forEach(button => {
        button.addEventListener('mousedown', async (menuEvent) => {
          menuEvent.preventDefault()
          menuEvent.stopPropagation()
          
          const action = button.getAttribute('data-action')
          if (!action) return
          
          setIsGeneratingAI(true)
          
          try {
            // Get the selected text
            const { from, to } = editor.state.selection
            const isSelection = from !== to
            
            // Get the text to enhance
            let text = ''
            if (isSelection) {
              text = editor.state.doc.textBetween(from, to)
            } else {
              // Get current paragraph text if nothing selected
              const node = editor.state.selection.$from.node()
              text = node.textContent
            }
            
            if (!text) {
              toast({
                title: "No text selected",
                description: "Please select some text to enhance.",
                variant: "destructive"
              })
              return
            }
            
            // Handle custom prompt
            let customPrompt
            if (action === 'custom') {
              const customInput = document.getElementById(`custom-prompt-${editorId}`) as HTMLInputElement
              customPrompt = customInput?.value.trim() || undefined
              
              if (!customPrompt) {
                toast({
                  title: "No prompt provided",
                  description: "Please enter a custom instruction.",
                  variant: "destructive"
                })
                return
              }
            }
            
            // Ensure we have the onGenerateText function
            if (!onGenerateText) {
              toast({
                title: "Enhancement unavailable",
                description: "Text enhancement is not available.",
                variant: "destructive"
              });
              return;
            }
            
            let enhancedText = "";
            try {
              setIsGeneratingAI(true);
              
              // Use the parent component's text generation function
              const result = await onGenerateText(text, customPrompt);
              
              if (!result) {
                throw new Error("No text was generated");
              }
              
              enhancedText = result;
              
              // Set the result when finished
              setIsGeneratingAI(false);
            } catch (error) {
              console.error('Error enhancing text:', error);
              toast({
                title: "Enhancement failed",
                description: "Failed to enhance text. Please try again.",
                variant: "destructive"
              });
              setIsGeneratingAI(false);
              return;
            }
            
            // Replace the text with enhanced version
            if (enhancedText && enhancedText !== text) {
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
              
              // Show success message
              toast({
                title: "AI Enhancement Applied",
                description: hasSelectedPhoto ? "Enhancement with photo context applied" : "Text enhancement applied",
                duration: 3000
              })
            }
          } catch (error) {
            console.error("Error applying AI enhancement:", error)
            toast({
              title: "Enhancement failed",
              description: "There was an error enhancing your text with AI.",
              variant: "destructive"
            })
          } finally {
            setIsGeneratingAI(false)
          }
          
          // Hide menu
          menu!.classList.add('hidden')
        })
      })
      
      // Special handling for the input field
      const inputField = document.getElementById(`custom-prompt-${editorId}`)
      if (inputField) {
        // Prevent blur when clicking in the input
        inputField.addEventListener('mousedown', (e) => {
          e.stopPropagation()
        })
        
        // Allow typing in the input field
        inputField.addEventListener('click', (e) => {
          e.stopPropagation()
        })
        
        // Handle enter key in the input field
        inputField.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const customPrompt = (inputField as HTMLInputElement).value.trim()
            
            if (!customPrompt) {
              toast({
                title: "No prompt provided",
                description: "Please enter a custom instruction.",
                variant: "destructive"
              })
              return
            }
            
            setIsGeneratingAI(true)
            
            try {
              // Get the selected text
              const { from, to } = editor.state.selection
              const isSelection = from !== to
              
              // Get the text to enhance
              let text = ''
              if (isSelection) {
                text = editor.state.doc.textBetween(from, to)
              } else {
                // Get current paragraph text if nothing selected
                const node = editor.state.selection.$from.node()
                text = node.textContent
              }
              
              if (!text) {
                toast({
                  title: "No text selected",
                  description: "Please select some text to enhance.",
                  variant: "destructive"
                })
                return
              }
              
              // Enhance text with AI
              const enhancedText = await enhanceTextWithAI('custom', text, customPrompt)
              
              // Replace the text with enhanced version
              if (enhancedText && enhancedText !== text) {
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
                
                // Show success message
                const selectedPhoto = findSelectedPhoto()
                const hasPhoto = !!selectedPhoto
                
                toast({
                  title: "AI Enhancement Applied",
                  description: getEnhancementToastMessage('custom', hasPhoto),
                  duration: 3000
                })
              }
            } catch (error) {
              console.error("Error applying AI enhancement:", error)
              toast({
                title: "Enhancement failed",
                description: "There was an error enhancing your text with AI.",
                variant: "destructive"
              })
            } finally {
              setIsGeneratingAI(false)
            }
            
            menu!.classList.add('hidden')
          }
        })
      }
      
      menu.appendChild(menuContent)
      document.body.appendChild(menu)
    }
    
    // Position the menu relative to the button
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    menu.style.position = 'fixed'
    menu.style.top = `${buttonRect.bottom + 5}px`
    menu.style.left = `${buttonRect.left}px`
    
    // Toggle visibility
    const isHidden = menu.classList.contains('hidden')
    
    // Hide all other menus
    document.querySelectorAll('.ai-menu-dropdown').forEach(el => {
      el.classList.add('hidden')
    })
    
    // Show this menu if it was hidden
    if (isHidden) {
      menu.classList.remove('hidden')
    }
  }

  return (
    <TiptapBubbleMenu 
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
        
        {/* AI enhancement menu */}
        <div className="ai-menu-container flex items-center">
          {/* AI Model indicator */}
          <span className="text-xs mr-1 px-1 py-0.5 bg-gray-100 rounded text-gray-600">
            AI
          </span>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 px-1 text-yellow-500"
            disabled={isGeneratingAI}
            onMouseDown={handleAIMenuClick}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">AI</span>
          </Button>
        </div>
      </div>
      
      {/* AI generation overlay */}
      {isGeneratingAI && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
            <span className="text-sm font-medium">AI is enhancing your text...</span>
          </div>
        </div>
      )}
    </TiptapBubbleMenu>
  )
}