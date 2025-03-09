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
import { callClaudeAPI, createReferenceContext } from "@/lib/ai-service"

interface ProseMirrorEditorProps {
  initialContent?: string
  onSave?: (content: string) => void
  onCancel?: () => void
  alwaysEditable?: boolean
}

export default function ProseMirrorEditor({ 
  initialContent = '<p>Start typing...</p>', 
  onSave,
  onCancel,
  alwaysEditable = false
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
        id: `editor-${Date.now()}`, // Add unique ID for menu targeting
      },
      handleClick(view, pos, event) {
        // Important for click handling - helps prevent unwanted behaviors
        return false;
      }
    },
    onFocus: () => {
      console.log("Editor focused");
      setShowFloatingMenu(true);
    },
    onBlur: (e) => {
      console.log("Editor blurred");
      
      // When clicking on format menu, don't trigger blur actions
      if (e?.relatedTarget?.closest('.format-menu-container')) {
        return;
      }
      
      // For always editable mode, still retain focus capabilities
      // and ensure content is properly saved
      if (alwaysEditable) {
        // Keep the floating menu available
        // Only save content when needed, no UI changes
        requestAnimationFrame(() => {
          if (editor && editor.isEditable) {
            saveContent();
          }
        });
      } else {
        // Standard behavior - hide floating menu with a slight delay
        setTimeout(() => setShowFloatingMenu(false), 200);
      }
    },
    editable: true, // Always start as editable
  })
  
  // Autosave content with debounce
  const saveContent = useCallback(() => {
    if (!editor || !onSave) return
    
    // Use a try-catch to handle potential DOM errors
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
    
    // Set up a timeout for autosave
    let saveTimeout: NodeJS.Timeout

    // Add transaction listener to editor
    const updateListener = () => {
      // Clear existing timeout
      if (saveTimeout) clearTimeout(saveTimeout)
      
      // Set new timeout
      saveTimeout = setTimeout(() => {
        // Check if editor is still valid before saving
        if (editor && editor.isEditable) {
          saveContent()
        }
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
  
  // AI text enhancement with Claude
  const enhanceWithAI = async (promptType: string, customPromptText?: string) => {
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
      
      // Load reference materials - in a real implementation, this would load from files
      const referenceContext = `
      # REFERENCE MATERIALS AND GUIDELINES
      
      ## TERMINOLOGY
      - Reserve Fund: A fund established by a condominium corporation to cover the cost of major repairs and replacement of common elements and assets of the corporation
      - Reserve Fund Study: An analysis of a condominium corporation's reserve fund conducted by qualified professionals
      - Class 1: A comprehensive reserve fund study based on a site inspection, destructive testing, and analysis of all components
      - Common Elements: The portions of a condominium property that are not part of any unit and are shared by all owners
      
      ## STYLE GUIDELINES
      - Use active voice for clarity
      - Write in third person (avoid "I", "we", "you")
      - Keep sentences concise (generally under 25 words)
      - Use bullet points for lists of items
      - Always use numerals for measurements, percentages, and dollar amounts
      
      ## TONE GUIDELINES
      - Formal but accessible: Professional but not overly technical
      - Factual: Evidence-based statements rather than opinions
      - Solution-oriented: Focus on practical recommendations
      `
      
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
      
      // Create user prompt based on enhancement type or custom prompt
      let userPrompt = ''
      let toastMessage = ''
      
      if (promptType === 'custom' && customPromptText) {
        userPrompt = `${customPromptText}\n\nHere is the original text:\n"${text}"\n\nProvide your enhanced version:`
        toastMessage = "Custom enhancement applied"
      } else {
        // Standard prompt types
        switch (promptType) {
          case 'follow-up':
            userPrompt = `Add a compelling follow-up sentence to this text that expands on the main idea. Only output the new sentence:\n\n"${text}"`
            toastMessage = "Follow-up sentence added"
            break
          case 'professional':
            userPrompt = `Rewrite this text in a more professional, formal tone suitable for business communication. Only output the new sentence:\n\n"${text}"`
            toastMessage = "Text rewritten in professional tone"
            break
          case 'concise':
            userPrompt = `Make this text more concise while preserving the key information:\n\n"${text}"`
            toastMessage = "Text made concise"
            break
          case 'expand':
            userPrompt = `Expand this text with more details and explanation:\n\n"${text}"`
            toastMessage = "Text expanded with details"
            break
          case 'grammar':
            userPrompt = `Fix any grammar, spelling, or punctuation errors in this text without changing its meaning:\n\n"${text}"`
            toastMessage = "Grammar corrected"
            break
          default:
            userPrompt = `Improve this text:\n\n"${text}"`
            toastMessage = "Text enhanced"
        }
      }
      
      // Call the Claude API with our formatted prompts
      const enhancedText = await enhanceTextWithClaude(systemPrompt, userPrompt, text)
      
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
        title: "Claude Enhancement Applied",
        description: toastMessage,
        duration: 3000
      })
    } catch (error) {
      console.error("Error enhancing text:", error)
      toast({
        title: "Enhancement failed",
        description: "There was an error enhancing your text with Claude.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }
  
  // Use the API route to call Claude
  const enhanceTextWithClaude = async (systemPrompt: string, userPrompt: string, originalText: string): Promise<string> => {
    try {
      console.log("Calling Claude API via API route with prompt:", userPrompt.substring(0, 50) + "...");
      
      // Call our API route that handles Claude API requests
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("API route error:", errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error || "Unknown error"}`);
      }
      
      const data = await response.json();
      
      if (!data.content) {
        console.error("Missing content in API response:", data);
        throw new Error("Invalid API response format");
      }
      
      console.log("API response received, length:", data.content.length);
      return data.content;
    } catch (error) {
      console.error("Error enhancing text with Claude:", error);
      
      // Provide a helpful fallback that tells the user what happened
      toast({
        title: "AI Enhancement Error",
        description: "There was an error connecting to the AI service. Please try again.",
        variant: "destructive",
        duration: 5000
      });
      
      return originalText; // Return original text if there's an error
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
      
      // Make sure when we click inside any editor we properly focus it
      const editorElement = editor.options.element;
      if (editorElement) {
        // Assign a unique ID if not already set
        if (!editorElement.getAttribute('data-editor-id')) {
          const editorId = Math.random().toString(36).substring(2, 9);
          editorElement.setAttribute('data-editor-id', editorId);
        }
        
        const handleClick = () => {
          if (!editor.isFocused) {
            editor.commands.focus();
          }
        };
        
        editorElement.addEventListener('click', handleClick);
        
        // Initialize with a higher z-index to ensure menu visibility
        editorElement.style.zIndex = '1';
        
        return () => {
          editorElement.removeEventListener('click', handleClick);
        };
      }
    }
  }, [editor]);

  // Global document click handler for menu management
  useEffect(() => {
    // This single global handler manages all menus for all editors
    const handleDocumentClick = (e: MouseEvent) => {
      // Don't hide menus when clicking inside menu containers
      if ((e.target as Element)?.closest('.format-menu-container') || 
          (e.target as Element)?.closest('.format-menu-dropdown') ||
          (e.target as Element)?.closest('.ai-menu-container') ||
          (e.target as Element)?.closest('.ai-menu-dropdown')) {
        return;
      }
      
      // Hide all menus
      document.querySelectorAll('.format-menu-dropdown, .ai-menu-dropdown').forEach(el => {
        el.classList.add('hidden');
      });
    };
    
    // Add global document click handler
    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);
  
  // Keep editor editable and ensure it maintains focus state
  useEffect(() => {
    if (editor && alwaysEditable) {
      // Force editable state
      editor.setEditable(true);
      
      // Configure behavior for always-editable mode
      const handleClick = (e: MouseEvent) => {
        // Process only for this specific editor's element
        const editorElement = editor.options.element;
        
        if (editorElement.contains(e.target as Node)) {
          // When clicking inside, make sure it's editable and focused
          if (!editor.isFocused) {
            editor.commands.focus('end');
          }
        }
      };
      
      // Add click handler to this specific editor's element
      editor.options.element.addEventListener('click', handleClick);
      
      return () => {
        editor.options.element.removeEventListener('click', handleClick);
      };
    }
  }, [editor, alwaysEditable]);

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
    <div className={`relative editor-container ${alwaysEditable ? 'always-editable' : ''}`}>
      {/* No container UI or Save/Cancel buttons - borderless design */}
      
      {/* Small autosave indicator */}
      {lastSavedAt && (
        <div className="absolute top-2 right-2 text-xs text-gray-400 z-10">
          {`Saved ${lastSavedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
        </div>
      )}
      
      {/* Optional placeholder text that shows up when editor is empty */}
      {editor?.isEmpty && !editor?.isFocused && (
        <div className="absolute top-4 left-2 text-gray-400 pointer-events-none cursor-text">
          Click to edit text...
        </div>
      )}
      
      {/* Editor content with menu trigger */}
      <div 
        className={`relative ${alwaysEditable ? 'always-editable-container' : ''}`} 
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.commands.focus('end');
          }
        }}
      >
        {/* Menu button removed - using the left margin menu instead */}
        <div className="flex">
          {/* Left margin with menu */}
          <div className="w-10 flex-shrink-0 relative">
            <div className="absolute top-4 left-2">
{/* Global format menu button */}
              <div className="format-menu-container">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
                  onMouseDown={(e) => {
                    // Must use mousedown to prevent blur
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Create unique ID for this editor's menu
                    const editorId = editor.options.element.getAttribute('data-editor-id') || 
                               Math.random().toString(36).substring(2, 9);
                    
                    // Ensure editor has ID attribute for future reference
                    if (!editor.options.element.getAttribute('data-editor-id')) {
                      editor.options.element.setAttribute('data-editor-id', editorId);
                    }
                    
                    // Find or create menu for this editor
                    let menu = document.getElementById(`format-menu-${editorId}`);
                    
                    if (!menu) {
                      // Create menu if it doesn't exist yet
                      menu = document.createElement('div');
                      menu.id = `format-menu-${editorId}`;
                      menu.className = "absolute left-8 top-0 bg-white rounded-md shadow-lg border border-gray-200 p-1 z-50 format-menu-dropdown";
                      menu.style.minWidth = "150px";
                      menu.innerHTML = `
                        <div class="flex flex-col py-1">
                          <button class="justify-start rounded-none h-8 px-3 w-full text-left hover:bg-gray-100" data-action="paragraph">
                            <span class="text-sm">Text</span>
                          </button>
                          <button class="justify-start rounded-none h-8 px-3 w-full text-left hover:bg-gray-100" data-action="heading">
                            <span class="text-sm font-bold">Heading 1</span>
                          </button>
                          <button class="justify-start rounded-none h-8 px-3 w-full text-left hover:bg-gray-100" data-action="bulletList">
                            <span class="text-sm">• Bullet List</span>
                          </button>
                        </div>
                      `;
                      
                      // Apply the format when item is clicked
                      menu.addEventListener('mousedown', (menuEvent) => {
                        menuEvent.preventDefault();
                        menuEvent.stopPropagation();
                        
                        // Get the action from data attribute
                        const target = menuEvent.target as HTMLElement;
                        const button = target.closest('button');
                        if (button) {
                          const action = button.getAttribute('data-action');
                          
                          // Apply formatting based on action
                          if (action === 'paragraph') {
                            editor.chain().focus().setParagraph().run();
                          } else if (action === 'heading') {
                            editor.chain().focus().toggleHeading({ level: 1 }).run();
                          } else if (action === 'bulletList') {
                            editor.chain().focus().toggleBulletList().run();
                          }
                          
                          // Hide menu
                          menu!.classList.add('hidden');
                        }
                      });
                      
                      // Add menu to document body
                      document.body.appendChild(menu);
                    }
                    
                    // Position menu relative to button - must offset to align correctly
                    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    menu.style.position = 'fixed';
                    menu.style.top = `${buttonRect.top}px`;
                    menu.style.left = `${buttonRect.left + 30}px`;
                    
                    // Toggle menu visibility
                    const isHidden = menu.classList.contains('hidden');
                    
                    // Hide all other menus first
                    document.querySelectorAll('.format-menu-dropdown').forEach(el => {
                      el.classList.add('hidden');
                    });
                    
                    // Show this menu if it was hidden
                    if (isHidden) {
                      menu.classList.remove('hidden');
                    }
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
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
{/* Custom AI menu that won't disappear */}
              <div className="ai-menu-container">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 px-1 text-yellow-500"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Create a unique ID for this editor's AI menu
                    const editorId = editor.options.element.getAttribute('data-editor-id') || 
                                    Math.random().toString(36).substring(2, 9);
                    
                    // Find or create menu
                    let menu = document.getElementById(`ai-menu-${editorId}`);
                    
                    if (!menu) {
                      // Create menu if it doesn't exist
                      menu = document.createElement('div');
                      menu.id = `ai-menu-${editorId}`;
                      menu.className = "absolute right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 p-2 z-50 ai-menu-dropdown";
                      menu.style.minWidth = "200px";
                      
                      // Create the menu items
                      const menuContent = document.createElement('div');
                      menuContent.className = "flex flex-col space-y-2";
                      
                      // Add standard AI options
                      const standardOptions = [
                        { label: "Expand text", action: "expand" },
                        { label: "Make text concise", action: "concise" },
                        { label: "Fix grammar", action: "grammar" },
                        { label: "Professional tone", action: "professional" },
                      ];
                      
                      standardOptions.forEach(option => {
                        const button = document.createElement('button');
                        button.className = "text-left px-2 py-1 hover:bg-gray-100 rounded text-sm";
                        button.innerText = option.label;
                        button.setAttribute('data-action', option.action);
                        menuContent.appendChild(button);
                      });
                      
                      // Add divider
                      const divider = document.createElement('div');
                      divider.className = "border-t border-gray-200 my-1";
                      menuContent.appendChild(divider);
                      
                      // Add custom prompt input
                      const customPromptContainer = document.createElement('div');
                      customPromptContainer.className = "mt-2";
                      
                      const customPromptLabel = document.createElement('label');
                      customPromptLabel.className = "block text-xs text-gray-500 mb-1";
                      customPromptLabel.innerText = "Custom instruction:";
                      
                      const customPromptInput = document.createElement('input');
                      customPromptInput.className = "w-full p-1 text-sm border border-gray-300 rounded";
                      customPromptInput.placeholder = "E.g., Rewrite for 5th grade level";
                      customPromptInput.id = `custom-prompt-${editorId}`;
                      
                      const customPromptButton = document.createElement('button');
                      customPromptButton.className = "mt-1 w-full bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-sm";
                      customPromptButton.innerText = "Apply Custom Prompt";
                      customPromptButton.setAttribute('data-action', 'custom');
                      
                      customPromptContainer.appendChild(customPromptLabel);
                      customPromptContainer.appendChild(customPromptInput);
                      customPromptContainer.appendChild(customPromptButton);
                      menuContent.appendChild(customPromptContainer);
                      
                      // Add button listeners - but NOT on the input field
                      menuContent.querySelectorAll('button').forEach(button => {
                        button.addEventListener('mousedown', (menuEvent) => {
                          menuEvent.preventDefault();
                          menuEvent.stopPropagation();
                          
                          const action = button.getAttribute('data-action');
                          
                          if (action === 'custom') {
                            const customInput = document.getElementById(`custom-prompt-${editorId}`) as HTMLInputElement;
                            const customPrompt = customInput?.value;
                            if (customPrompt && customPrompt.trim()) {
                              enhanceWithAI('custom', customPrompt);
                            }
                          } else if (action) {
                            enhanceWithAI(action);
                          }
                          
                          // Hide menu
                          menu!.classList.add('hidden');
                        });
                      });
                      
                      // Special handling for the input field
                      const inputField = document.getElementById(`custom-prompt-${editorId}`);
                      if (inputField) {
                        // Prevent blur when clicking in the input
                        inputField.addEventListener('mousedown', (e) => {
                          e.stopPropagation();
                        });
                        
                        // Allow typing in the input field
                        inputField.addEventListener('click', (e) => {
                          e.stopPropagation();
                        });
                        
                        // Handle enter key in the input field
                        inputField.addEventListener('keydown', (e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const customPrompt = (inputField as HTMLInputElement).value;
                            if (customPrompt && customPrompt.trim()) {
                              enhanceWithAI('custom', customPrompt);
                              menu!.classList.add('hidden');
                            }
                          }
                        });
                      }
                      
                      menu.appendChild(menuContent);
                      document.body.appendChild(menu);
                    }
                    
                    // Position the menu relative to the button
                    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    menu.style.position = 'fixed';
                    menu.style.top = `${buttonRect.bottom + 5}px`;
                    menu.style.left = `${buttonRect.left}px`;
                    
                    // Toggle visibility
                    const isHidden = menu.classList.contains('hidden');
                    
                    // Hide all other menus
                    document.querySelectorAll('.ai-menu-dropdown').forEach(el => {
                      el.classList.add('hidden');
                    });
                    
                    // Show this menu if it was hidden
                    if (isHidden) {
                      menu.classList.remove('hidden');
                    }
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">AI</span>
                </Button>
              </div>
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