import React, { useState } from 'react'
import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react'
import { 
  Bold, 
  Italic, 
  Underline, 
  Sparkles,
  ChevronDown,
  X
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
      menu.className = "absolute left-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 p-2 z-50 ai-menu-dropdown"
      menu.style.minWidth = "220px"
      
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
          
          // Add loading indicator to the document
          const editorElement = editor.options.element;
          const loadingIndicator = document.createElement('div');
          loadingIndicator.className = 'ai-loading-indicator';
          loadingIndicator.innerHTML = `
            <div class="flex items-center gap-2">
              <div class="ai-loading-spinner"></div>
              <span class="text-sm font-medium">AI is enhancing your text...</span>
            </div>
          `;
          editorElement.appendChild(loadingIndicator);
          
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
              // Remove loading indicator
              if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
              }
              setIsGeneratingAI(false)
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
            
            // Replace the text with enhanced version and highlight it
            if (enhancedText && enhancedText !== text) {
              if (isSelection) {
                // Store the current selection positions for highlighting
                const selectionFrom = from;
                const selectionTo = to;
                
                editor
                  .chain()
                  .focus()
                  .deleteRange({ from, to })
                  .insertContent(`<span class="ai-generated-text">${enhancedText}</span>`)
                  .run()
                  
                // Select the newly inserted text briefly for visual feedback
                const insertedLength = enhancedText.length;
                setTimeout(() => {
                  editor.commands.setTextSelection({ 
                    from: selectionFrom, 
                    to: selectionFrom + insertedLength 
                  });
                  
                  // Then return to normal cursor after a moment
                  setTimeout(() => {
                    editor.commands.setTextSelection(selectionFrom + insertedLength);
                  }, 600);
                }, 100);
              } else {
                // Replace the current paragraph with highlighted AI content
                editor
                  .chain()
                  .focus()
                  .selectParentNode()
                  .deleteSelection()
                  .insertContent(`<p><span class="ai-generated-text">${enhancedText}</span></p>`)
                  .run()
                  
                // Briefly select the paragraph to highlight the change
                setTimeout(() => {
                  editor.commands.selectParentNode();
                  
                  // Then deselect after a moment
                  setTimeout(() => {
                    const { to } = editor.state.selection;
                    editor.commands.setTextSelection(to);
                  }, 600);
                }, 100);
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
            // Remove the loading indicator
            if (loadingIndicator && loadingIndicator.parentNode) {
              loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
          }
          
          // Hide menu
          menu!.classList.add('hidden')
        })
      })
      
      // Special handling for the custom prompt input field in the dropdown menu
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
        
        // Handle enter key in the dropdown's input field
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
            
            // The rest of the functionality is now handled by the onGenerateText prop
            if (!onGenerateText) {
              toast({
                title: "Enhancement unavailable",
                description: "Text enhancement is not available.",
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
                setIsGeneratingAI(false)
                return
              }
              
              // Generate text with AI
              const enhancedText = await onGenerateText(text, customPrompt)
              
              // Replace the text with enhanced version and apply highlight effect
              if (enhancedText && enhancedText !== text) {
                if (isSelection) {
                  // Store positions for highlighting
                  const selectionFrom = from;
                  
                  editor
                    .chain()
                    .focus()
                    .deleteRange({ from, to })
                    .insertContent(enhancedText)
                    .run()
                    
                  // Apply highlight effect to the inserted text
                  const insertionEndPos = selectionFrom + enhancedText.length;
                  editor.commands.highlightText(selectionFrom, insertionEndPos)
                  
                  // Briefly select the text
                  setTimeout(() => {
                    editor.commands.setTextSelection({ 
                      from: selectionFrom, 
                      to: selectionFrom + enhancedText.length 
                    });
                  }, 50);
                } else {
                  // Get paragraph position info before replacing
                  const nodePos = editor.state.selection.$from.start();
                  
                  // Replace the current paragraph
                  editor
                    .chain()
                    .focus()
                    .selectParentNode()
                    .deleteSelection()
                    .insertContent(`<p>${enhancedText}</p>`)
                    .run()
                    
                  // Apply highlight effect
                  const paragraphEndPos = nodePos + enhancedText.length;
                  editor.commands.highlightText(nodePos, paragraphEndPos)
                  
                  // Select the paragraph briefly
                  setTimeout(() => {
                    editor.commands.selectParentNode();
                  }, 50);
                }
                
                // Show success message
                toast({
                  title: "AI Enhancement Applied",
                  description: hasSelectedPhoto ? "Enhancement with photo context applied" : "Custom enhancement applied",
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
    
    // Position the menu relative to the AI dropdown button
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const aiButtonContainer = document.querySelector('.ai-menu-container')
    const aiButtonRect = aiButtonContainer?.getBoundingClientRect() || buttonRect
    
    menu.style.position = 'fixed'
    menu.style.top = `${aiButtonRect.bottom + 5}px`
    menu.style.left = `${aiButtonRect.left}px`
    
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
      tippyOptions={{ 
        duration: 100,
        // Keep menu visible when clicking in inputs
        hideOnClick: false, 
        // Prevent menu from disappearing when input is focused
        trigger: 'manual', 
        // Make the menu stick around longer
        onHide: (instance) => {
          // Check if we're focused in the AI input field
          const activeElement = document.activeElement;
          const isInputActive = activeElement?.id?.includes('prompt-input');
          
          // If we're in an input field, prevent hiding
          if (isInputActive) {
            // Delay briefly then show again if selection still exists
            setTimeout(() => {
              const { from, to } = editor.state.selection;
              if (from !== to) {
                instance.show();
              }
            }, 10);
          }
        }
      }}
      // Force menu to show with any text selection
      shouldShow={({ editor }) => {
        const { from, to } = editor.state.selection;
        const activeElement = document.activeElement;
        const isInputActive = activeElement?.id?.includes('prompt-input');
        
        // Show bubble menu when text is selected or when we're in the AI input
        return from !== to || isInputActive;
      }}
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
          <div className="flex items-center bg-white border border-gray-200 rounded-md">
            <Button 
              size="sm" 
              variant="ghost" 
              data-ai-dropdown-id={editor.options.element.getAttribute('data-editor-id') || Math.random().toString(36).substring(2, 9)}
              className="h-7 w-7 p-0 rounded-l-md rounded-r-none"
              disabled={isGeneratingAI}
              onMouseDown={(e) => {
                // First store the current selection
                const { from, to } = editor.state.selection;
                const editorId = editor.options.element.getAttribute('data-editor-id') || 
                                Math.random().toString(36).substring(2, 9);
                const promptInput = document.getElementById(`prompt-input-${editorId}`) as HTMLInputElement;
                
                if (promptInput && from !== to) {
                  promptInput.setAttribute('data-selection-from', from.toString());
                  promptInput.setAttribute('data-selection-to', to.toString());
                }
                
                // Then handle the AI menu click
                handleAIMenuClick(e);
                
                // Prevent the default to maintain selection
                e.preventDefault();
              }}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            
            <input
              id={`prompt-input-${editor.options.element.getAttribute('data-editor-id') || Math.random().toString(36).substring(2, 9)}`}
              type="text"
              className="h-7 border-0 border-l border-r border-gray-200 px-2 text-xs w-32 focus:outline-none"
              placeholder="Type AI instruction..."
              // Prevent default mouse behavior to maintain editor selection
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // Focus the input but don't let it affect the editor selection
                e.currentTarget.focus();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              // Maintain selection during focus
              onFocus={(e) => {
                // Store current editor selection in a data attribute
                const { from, to } = editor.state.selection;
                e.currentTarget.setAttribute('data-selection-from', from.toString());
                e.currentTarget.setAttribute('data-selection-to', to.toString());
              }}
              // Handle input without losing editor selection
              onInput={(e) => {
                // Ensure the editor selection is maintained during typing
                const from = parseInt(e.currentTarget.getAttribute('data-selection-from') || '0');
                const to = parseInt(e.currentTarget.getAttribute('data-selection-to') || '0');
                
                if (from && to && from !== to) {
                  // Restore selection if it was lost
                  const currentSelection = editor.state.selection;
                  if (currentSelection.from !== from || currentSelection.to !== to) {
                    editor.commands.setTextSelection({ from, to });
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Trigger the generate action directly
                  const applyButton = e.currentTarget.parentElement?.querySelector('[data-generate-ai]') as HTMLButtonElement;
                  if (applyButton) {
                    applyButton.click();
                  }
                } else if (e.key === 'Escape') {
                  // Return focus to editor on escape
                  editor.commands.focus();
                }
              }}
            />
            
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 rounded-l-none rounded-r-none border-r border-gray-200"
              onMouseDown={(e) => {
                // Prevent losing selection
                e.preventDefault();
                e.stopPropagation();
                
                // Clear the input
                const editorId = editor.options.element.getAttribute('data-editor-id') || 
                                 Math.random().toString(36).substring(2, 9)
                const promptInput = document.getElementById(`prompt-input-${editorId}`) as HTMLInputElement
                if (promptInput) {
                  promptInput.value = ''
                  
                  // Refocus input to maintain bubble menu
                  promptInput.focus();
                  
                  // Re-apply stored selection if it exists
                  const from = parseInt(promptInput.getAttribute('data-selection-from') || '0');
                  const to = parseInt(promptInput.getAttribute('data-selection-to') || '0');
                  
                  if (from && to && from !== to) {
                    editor.commands.setTextSelection({ from, to });
                  }
                }
              }}
            >
              <X className="h-3 w-3" />
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              data-generate-ai="true"
              className="h-7 px-2 text-yellow-500 rounded-l-none rounded-r-md"
              disabled={isGeneratingAI}
              onMouseDown={(e) => {
                // Prevent default to maintain selection
                e.preventDefault();
                e.stopPropagation();
                
                // Get selected text
                const { from, to } = editor.state.selection
                const isSelection = from !== to
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
                
                // Save selection info for later restoration
                const selectionFrom = from;
                const selectionTo = to;
                
                // Find the prompt input in the DOM
                const editorId = editor.options.element.getAttribute('data-editor-id') || 
                                 Math.random().toString(36).substring(2, 9)
                const promptInput = document.getElementById(`prompt-input-${editorId}`) as HTMLInputElement
                
                if (promptInput && promptInput.value) {
                  // Apply the prompt
                  if (onGenerateText) {
                    setIsGeneratingAI(true)
                    
                    const customPrompt = promptInput.value;
                    
                    // Store the current selection
                    if (from !== to) {
                      promptInput.setAttribute('data-selection-from', from.toString());
                      promptInput.setAttribute('data-selection-to', to.toString());
                    }
                    
                    onGenerateText(text, customPrompt).then(enhancedText => {
                      if (enhancedText && enhancedText !== text) {
                        // Apply the enhanced text
                        if (isSelection) {
                          // Try to restore the original selection first
                          editor.commands.setTextSelection({ from: selectionFrom, to: selectionTo });
                          
                          // Insert the text without wrapping it in a span
                          editor.chain()
                            .focus()
                            .deleteRange({ from: selectionFrom, to: selectionTo })
                            .insertContent(enhancedText)
                            .run()
                            
                          // Record insertion position for later selection
                          const insertionPos = selectionFrom;
                          const insertionEndPos = insertionPos + enhancedText.length;
                          
                          // Apply the temporary highlight effect
                          editor.commands.highlightText(insertionPos, insertionEndPos);
                          
                          // Select the inserted text briefly for user feedback
                          setTimeout(() => {
                            editor.commands.setTextSelection({ 
                              from: insertionPos, 
                              to: insertionEndPos 
                            });
                            
                            // Then deselect after a moment to show normal cursor
                            setTimeout(() => {
                              editor.commands.setTextSelection(insertionEndPos);
                            }, 600);
                          }, 100);
                        } else {
                          // Get the node position info before replacing
                          const nodePos = editor.state.selection.$from.start();
                          
                          // Replace the entire paragraph without the span wrapper
                          editor.chain()
                            .focus()
                            .selectParentNode()
                            .deleteSelection()
                            .insertContent(`<p>${enhancedText}</p>`)
                            .run()
                            
                          // Apply the temporary highlight to the new paragraph content
                          const paragraphEndPos = nodePos + enhancedText.length;
                          editor.commands.highlightText(nodePos, paragraphEndPos)
                            
                          // Select the paragraph briefly to highlight it
                          setTimeout(() => {
                            editor.commands.selectParentNode();
                            
                            // Then deselect after a moment
                            setTimeout(() => {
                              const { to } = editor.state.selection;
                              editor.commands.setTextSelection(to);
                            }, 600);
                          }, 100);
                        }
                        
                        // Show success toast
                        toast({
                          title: "AI Enhancement Applied",
                          description: "Text enhanced using your custom prompt",
                          duration: 3000
                        })
                      }
                    }).catch(error => {
                      toast({
                        title: "Enhancement failed",
                        description: "Failed to enhance text. Please try again.",
                        variant: "destructive"
                      })
                    }).finally(() => {
                      setIsGeneratingAI(false)
                    })
                  }
                } else {
                  // If no prompt, show the menu with options
                  const menuEvent = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true
                  })
                  
                  // Find the dropdown button and simulate click
                  const dropdownBtn = document.querySelector(`[data-ai-dropdown-id="${editorId}"]`)
                  if (dropdownBtn) {
                    dropdownBtn.dispatchEvent(menuEvent)
                  }
                }
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Enhanced AI generation overlay with spinner */}
      {isGeneratingAI && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="flex items-center gap-2">
            <div className="ai-loading-spinner"></div>
            <span className="text-sm font-medium">AI is enhancing your text...</span>
          </div>
        </div>
      )}
    </TiptapBubbleMenu>
  )
}