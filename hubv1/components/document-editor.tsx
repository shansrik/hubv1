"use client"

import { useState, useRef, useEffect, useCallback } from "react"
// Remove Draft.js dependencies - we'll use contenteditable instead
import { genKey } from 'draft-js' // Just keeping this for unique IDs
import { 
  Bold, 
  Italic, 
  Underline,
  Save,
  X,
  MoreHorizontal,
  Sparkles,
  ChevronDown,
  Plus,
  List,
  ImageIcon,
  Type,
  Code,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Strikethrough
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AnimatePresence, motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"

interface DocumentEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void; // Used for autosave
  onCancel?: () => void; // Kept for backward compatibility
  activeBlock?: string | null;
  onActiveBlockChange?: (blockId: string) => void;
  onAddBlock?: (blockId: string) => void;
  onDeleteBlock?: (blockId: string) => void;
  onFormatBlock?: (blockId: string, type: string) => void;
  onToggleStyle?: (blockId: string, style: string) => void;
  onShowAIMenu?: (blockId: string) => void;
  showToolbar?: boolean;
  onRef?: (ref: any) => void;
}

interface EditorBlock {
  id: string;
  content: string; // HTML content as string
  type: 'text' | 'heading-one' | 'heading-two' | 'heading-three' | 'unordered-list' | 'ordered-list' | 'code' | 'quote';
  aiAssisted?: boolean;
}

const emptyBlockContent = () => "<p>Start typing...</p>";

export default function DocumentEditor({ 
  initialContent = "<p>Start typing...</p>", 
  onSave,
  onCancel,
  activeBlock: externalActiveBlockId = null,
  onActiveBlockChange,
  onAddBlock,
  onDeleteBlock,
  onFormatBlock,
  onToggleStyle,
  onShowAIMenu,
  showToolbar = false,
  onRef
}: DocumentEditorProps) {
  // Always-editable document - no explicit save/edit cycle
  
  // Blocks state
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => {
    try {
      // Initialize with a single block containing the initialContent
      return [
        {
          id: genKey(),
          content: initialContent || emptyBlockContent(),
          type: 'text'
        }
      ];
    } catch (error) {
      console.error("Error initializing content:", error);
      return [
        {
          id: genKey(),
          content: emptyBlockContent(),
          type: 'text'
        }
      ];
    }
  });
  
  // Initialize with the first block as active
  const firstBlockId = blocks[0]?.id || null;
  console.log("First block ID: ", firstBlockId);
  
  // Active block state
  const [activeBlockId, setActiveBlockId] = useState<string | null>(externalActiveBlockId || firstBlockId);
  
  // Log the active block ID whenever it changes
  useEffect(() => {
    console.log("Active block ID is now:", activeBlockId);
    
    // Make sure the active block is focused
    if (activeBlockId) {
      try {
        // We need to track if this was triggered programmatically or by user interaction
        // When switching blocks via UI, we want to preserve selection
        const wasTriggeredByUserInteraction = document.activeElement?.tagName === 'DIV';
        
        setTimeout(() => {
          // If this is from clicking on an element directly, don't change selection
          focusEditor(activeBlockId, wasTriggeredByUserInteraction);
        }, 50);
      } catch (err) {
        console.error("Error focusing editor:", err);
      }
    }
  }, [activeBlockId, focusEditor]);
  
  // Create a ref object to expose methods
  const editorMethodsRef = useRef<any>({});
  
  // Toast hooks
  const { toast } = useToast();
  
  // Define the method object once to avoid recreating it on each render
  const methodsRef = useRef<any>(null);
  
  // Custom setter that also calls the callback
  const updateActiveBlockId = useCallback((blockId: string | null) => {
    setActiveBlockId(blockId);
    if (blockId && onActiveBlockChange) {
      onActiveBlockChange(blockId);
    }
  }, [onActiveBlockChange]);
  
  // Sync with external active block ID if provided
  useEffect(() => {
    if (externalActiveBlockId && externalActiveBlockId !== activeBlockId) {
      setActiveBlockId(externalActiveBlockId);
    }
  }, [externalActiveBlockId, activeBlockId]);
  
  // Method references that need to be stable across renders
  const stableMethods = useRef({
    getActiveBlockId: () => activeBlockId,
    changeBlockType: (blockId: string, newType: string | EditorBlock['type']) => {
      console.log("Stable changeBlockType called:", blockId, newType);
      changeBlockType(blockId, newType);
    },
    toggleInlineStyle: (blockId: string, style: string) => {
      console.log("Stable toggleInlineStyle called:", blockId, style);
      toggleInlineStyle(blockId, style);
    },
    enhanceWithAI: (blockId: string, promptType: string) => enhanceWithAI(blockId, promptType),
    addBlockAfter: (blockId: string) => addBlockAfter(blockId),
    deleteBlock: (blockId: string) => deleteBlock(blockId),
    focusEditor: (blockId: string) => focusEditor(blockId),
    getCurrentBlock: () => blocks.find(b => b.id === activeBlockId),
    getBlocks: () => blocks
  });
  
  // Update the stable method references when needed
  useEffect(() => {
    stableMethods.current.getActiveBlockId = () => activeBlockId;
    stableMethods.current.getCurrentBlock = () => blocks.find(b => b.id === activeBlockId);
    stableMethods.current.getBlocks = () => blocks;
    
    // Update the methods ref with the stable references
    methodsRef.current = stableMethods.current;
    
    // Notify the parent component of the updated methods if needed
    if (onRef) {
      console.log("Providing editor methods to parent");
      onRef(stableMethods.current);
    }
  }, [activeBlockId, blocks, onRef]);
  
  // UI states
  const [showAIMenu, setShowAIMenu] = useState<string | null>(null);
  const [showFormat, setShowFormat] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // References
  const blockRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const contentEditableRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  
  // Focus a specific block's contentEditable div
  const focusEditor = useCallback((blockId: string, preserveSelection = false) => {
    console.log("Attempting to focus contentEditable for block:", blockId);
    
    if (!blockId) {
      console.warn("No block ID provided for focus");
      return;
    }
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const contentEditableEl = contentEditableRefs.current[blockId];
      if (contentEditableEl) {
        console.log("Found contentEditable ref, focusing:", blockId);
        
        // Remember current selection if needed (when clicking between elements)
        let savedRange = null;
        if (preserveSelection) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            savedRange = selection.getRangeAt(0).cloneRange();
          }
        }
        
        // Focus the element
        contentEditableEl.focus();
        
        if (preserveSelection && savedRange) {
          // Restore saved selection
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(savedRange);
          }
        } else {
          // Place cursor at the end of the content (default behavior)
          const selection = window.getSelection();
          const range = document.createRange();
          
          // Try to select at the end of the content
          try {
            if (contentEditableEl.childNodes.length > 0) {
              const lastChild = contentEditableEl.lastChild;
              if (lastChild) {
                range.selectNodeContents(lastChild);
                range.collapse(false); // collapse to end
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            } else {
              // If empty, just focus the element
              range.selectNodeContents(contentEditableEl);
              range.collapse(false);
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          } catch (err) {
            console.error("Error setting selection:", err);
            // Fallback - just focus
            contentEditableEl.focus();
          }
        }
      } else {
        console.warn("ContentEditable ref not found for block:", blockId);
        // Try again in case the element is still being rendered
        setTimeout(() => {
          const retryEl = contentEditableRefs.current[blockId];
          if (retryEl) {
            console.log("Found contentEditable ref on retry, focusing:", blockId);
            retryEl.focus();
          }
        }, 100);
      }
    }, 50);
  }, []);

  // Add a reference for the autosave timeout
  const autosaveTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Handle content change from contentEditable div
  const handleContentChange = useCallback((blockId: string, newContent: string) => {
    console.log("Content changed for block:", blockId);
    
    // Update blocks state with new content
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId ? { ...block, content: newContent } : block
      )
    );
    
    // Debounced autosave
    if (onSave) {
      if (autosaveTimeout.current) {
        clearTimeout(autosaveTimeout.current);
      }
      
      autosaveTimeout.current = setTimeout(() => {
        console.log("Autosaving content...");
        const html = getContentAsHtml();
        onSave(html);
      }, 1500); // 1.5 second debounce
    }
  }, [onSave]);
  
  // Event handler for input events on contentEditable
  const handleInput = useCallback((blockId: string, e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    handleContentChange(blockId, target.innerHTML);
  }, [handleContentChange]);
  
  // Track when the user clicks into an editor
  const handleFocus = useCallback((blockId: string, e: React.FocusEvent<HTMLDivElement>) => {
    console.log("Block focused:", blockId);
    updateActiveBlockId(blockId);
  }, [updateActiveBlockId]);
  
  // Track when the user clicks out of an editor
  const handleBlur = useCallback((blockId: string, e: React.FocusEvent<HTMLDivElement>) => {
    console.log("Block blurred:", blockId);
    // Don't clear the active block immediately - this allows clicking back in
    // We'll use a small timeout to see if another block gets focus
    setTimeout(() => {
      // Only clear if no block has been focused in the meantime
      if (activeBlockId === blockId) {
        // We're not clearing the active block anymore, to allow clicking back in
        // updateActiveBlockId(null);
      }
    }, 100);
  }, [activeBlockId]);
  
  // Handle keyboard events with direct DOM commands
  const handleKeyDown = useCallback((blockId: string, e: React.KeyboardEvent) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    // Handle keyboard shortcuts
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      document.execCommand('bold');
      
      // Make sure to capture changes after the execCommand
      const target = e.target as HTMLDivElement;
      handleContentChange(blockId, target.innerHTML);
      return;
    }
    
    if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      document.execCommand('italic');
      
      // Make sure to capture changes after the execCommand
      const target = e.target as HTMLDivElement;
      handleContentChange(blockId, target.innerHTML);
      return;
    }
    
    // Handle Enter key to create new blocks
    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = window.getSelection();
      if (!selection) return;
      
      const range = selection.getRangeAt(0);
      const startContainer = range.startContainer;
      
      // Get the contenteditable element
      const contentEditableEl = contentEditableRefs.current[blockId];
      if (!contentEditableEl) return;
      
      // Check if cursor is at the end
      const isAtEnd = range.startOffset === (startContainer.textContent?.length || 0) &&
                     !range.startContainer.nextSibling && 
                     !range.startContainer.parentElement?.nextSibling;
      
      if (isAtEnd) {
        e.preventDefault();
        // Create a new block below this one
        doAddBlockAfter(blockId);
      }
    }
  }, [blocks, handleContentChange]);
  
  // Helper function to avoid circular dependency
  function doAddBlockAfter(blockId: string) {
    addBlockAfter(blockId);
  }
  
  // Add a new block after the specified block
  const addBlockAfter = useCallback((blockId: string) => {
    if (onAddBlock) {
      onAddBlock(blockId);
      return;
    }
    
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const newBlockId = genKey();
    
    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, {
      id: newBlockId,
      content: emptyBlockContent(),
      type: 'text'
    });
    
    setBlocks(newBlocks);
    
    // Focus the new block after a slight delay to allow rendering
    setTimeout(() => {
      updateActiveBlockId(newBlockId);
      focusEditor(newBlockId);
    }, 50);
  }, [blocks, focusEditor, onAddBlock, updateActiveBlockId]);
  
  // Delete the specified block
  const deleteBlock = (blockId: string) => {
    if (onDeleteBlock) {
      onDeleteBlock(blockId);
      return;
    }
    
    // Don't delete if it's the only block
    if (blocks.length <= 1) return;
    
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    
    // Focus the previous block or the next one if this was the first block
    const focusIndex = Math.max(0, blockIndex - 1);
    updateActiveBlockId(newBlocks[focusIndex].id);
    
    setTimeout(() => {
      focusEditor(newBlocks[focusIndex].id);
    }, 50);
  };
  
  // Change the block type
  const changeBlockType = (blockId: string, newType: string | EditorBlock['type']) => {
    console.log("DocumentEditor.changeBlockType called with:", blockId, newType);
    
    if (onFormatBlock) {
      onFormatBlock(blockId, newType);
      return;
    }
    
    // Make sure newType is a valid type
    const validType = ['text', 'heading-one', 'heading-two', 'heading-three', 
      'unordered-list', 'ordered-list', 'code', 'quote'].includes(newType) 
      ? newType as EditorBlock['type'] 
      : 'text';
    
    if (!blockId) {
      console.warn("No blockId provided to changeBlockType!");
      if (activeBlockId) {
        blockId = activeBlockId;
        console.log("Using active block instead:", blockId);
      } else {
        console.error("No active block available!");
        return;
      }
    }
    
    console.log("Changing block type for", blockId, "to", validType);
    
    // First make sure this block is active
    if (blockId !== activeBlockId) {
      console.log("Setting active block to:", blockId);
      setActiveBlockId(blockId);
    }
    
    // Focus the editor for the block first
    focusEditor(blockId);
    
    // Then update the block type
    setBlocks(prevBlocks => {
      const newBlocks = prevBlocks.map(block => {
        if (block.id === blockId) {
          return { ...block, type: validType };
        }
        return block;
      });
      
      console.log("Updated blocks:", newBlocks);
      return newBlocks;
    });
    
    setShowFormat(null);
  };
  
  // Toggle inline style for a block
  const toggleInlineStyle = (blockId: string, style: string) => {
    console.log("DocumentEditor.toggleInlineStyle called with:", blockId, style);
    
    if (onToggleStyle) {
      onToggleStyle(blockId, style);
      return;
    }
    
    if (!blockId) {
      console.warn("No blockId provided to toggleInlineStyle!");
      if (activeBlockId) {
        blockId = activeBlockId;
        console.log("Using active block instead:", blockId);
      } else {
        console.error("No active block available!");
        return;
      }
    }
    
    // First make sure this block is active
    if (blockId !== activeBlockId) {
      console.log("Setting active block to:", blockId);
      setActiveBlockId(blockId);
    }
    
    // Focus the editor for the block first
    focusEditor(blockId);
    
    const block = blocks.find(b => b.id === blockId);
    if (!block) {
      console.error("Block not found:", blockId);
      return;
    }
    
    console.log("Toggling style", style, "for block", blockId);
    
    const newState = RichUtils.toggleInlineStyle(block.content, style);
    handleEditorChange(blockId, newState);
  };
  
  // Simulate AI text enhancement
  const enhanceWithAI = async (blockId: string, promptType: string) => {
    console.log("DocumentEditor.enhanceWithAI called with:", blockId, promptType);
    
    if (!blockId) {
      console.warn("No blockId provided to enhanceWithAI!");
      if (activeBlockId) {
        blockId = activeBlockId;
        console.log("Using active block instead:", blockId);
      } else {
        console.error("No active block available!");
        return;
      }
    }
    
    // First make sure this block is active
    if (blockId !== activeBlockId) {
      console.log("Setting active block to:", blockId);
      setActiveBlockId(blockId);
    }
    
    // Focus the editor for the block first
    focusEditor(blockId);
    
    setIsGeneratingAI(true);
    
    // Find the block
    const block = blocks.find(b => b.id === blockId);
    if (!block) {
      console.error("Block not found:", blockId);
      setIsGeneratingAI(false);
      return;
    }
    
    // Get current text content - use the contentEditable's text content
    const contentEditableEl = contentEditableRefs.current[blockId];
    if (!contentEditableEl) {
      console.error("ContentEditable ref not found:", blockId);
      setIsGeneratingAI(false);
      return;
    }
    
    // Extract plain text from HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = block.content;
    const plainText = tempDiv.textContent || '';
    
    let enhancedText = '';
    
    // Simulate different AI enhancements based on prompt type
    // In a real implementation, this would call an AI API
    switch (promptType) {
      case 'follow-up':
        enhancedText = `${plainText} Additionally, this approach offers several advantages including improved efficiency and scalability when dealing with complex systems.`;
        break;
      case 'professional':
        enhancedText = `This document outlines the strategic approach to implementing the solution, highlighting key considerations and technical requirements. The methodology employed ensures optimal outcomes while mitigating potential risks.`;
        break;
      case 'casual':
        enhancedText = `Hey there! Here's the deal: we're going to set this up in a super simple way. You'll find it's pretty straightforward and actually kind of fun to work with.`;
        break;
      case 'concise':
        enhancedText = `Implementation requires three steps: analysis, development, and deployment. Each phase has distinct milestones and deliverables.`;
        break;
      case 'expand':
        enhancedText = `${plainText} To elaborate further, this concept encompasses multiple dimensions including technical feasibility, resource allocation, timeline constraints, and stakeholder alignment. When properly implemented, the solution can dramatically improve operational efficiency while simultaneously reducing costs and enhancing user satisfaction.`;
        break;
      case 'grammar':
        // Simple grammar fix simulation
        enhancedText = plainText.replace(/\s+([,.!?])/g, '$1')
                               .replace(/\bi\b/g, 'I')
                               .replace(/dont/g, "don't");
        break;
      default:
        enhancedText = plainText;
    }
    
    console.log("Enhancing text for block", blockId);
    
    // Simulate a 1-second delay for AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create enhanced HTML content
    const newContent = `<div>${enhancedText}</div>`;
    
    // Update the block with the new content and mark it as AI-assisted
    setBlocks(prevBlocks => 
      prevBlocks.map(b => 
        b.id === blockId 
          ? { ...b, content: newContent, aiAssisted: true } 
          : b
      )
    );
    
    // Update the contentEditable element directly as well
    if (contentEditableEl) {
      contentEditableEl.innerHTML = newContent;
    }
    
    setIsGeneratingAI(false);
    setShowAIMenu(null);
    
    // Trigger autosave
    handleContentChange(blockId, newContent);
    
    toast({
      title: "AI Enhancement Applied",
      description: `Text ${promptType === 'grammar' ? 'corrected' : 'enhanced'} using AI.`,
      duration: 3000
    });
    
    console.log("AI enhancement completed for block", blockId);
  };
  
  // Get proper HTML tag for a block type
  const getBlockTag = (type: EditorBlock['type']): string => {
    switch (type) {
      case 'heading-one': return 'h1';
      case 'heading-two': return 'h2';
      case 'heading-three': return 'h3';
      case 'unordered-list': return 'ul';
      case 'ordered-list': return 'ol';
      case 'code': return 'pre';
      case 'quote': return 'blockquote';
      default: return 'div';
    }
  };
  
  // Get all content as HTML (much simpler now - we just combine the HTML strings)
  const getContentAsHtml = useCallback((): string => {
    // Class for AI-assisted blocks
    const aiClass = 'ai-assisted-block';
    
    return blocks.map(block => {
      // The content is already HTML, no need to convert
      let html = block.content;
      
      // Add AI assistance indicator class if needed
      if (block.aiAssisted) {
        // Add class to the first element in the HTML
        html = html.replace(/^<([^>]+)>/, `<$1 class="${aiClass}">`);
      }
      
      return html;
    }).join('\n');
  }, [blocks]);
  
  // Autosave effect
  useEffect(() => {
    return () => {
      if (autosaveTimeout.current) {
        clearTimeout(autosaveTimeout.current);
      }
    };
  }, []);
  
  // Handle manual save action (if needed)
  const handleSave = () => {
    if (onSave) {
      const html = getContentAsHtml();
      onSave(html);
    }
  };
  
  // Render the editor UI
  return (
    <div className="document-editor overflow-hidden bg-white">
      {/* Top toolbar - only shown if showToolbar is true */}
      {showToolbar && (
        <div className="toolbar border-b border-gray-200 p-2 flex items-center justify-between bg-gray-50">
          <div className="text-sm font-medium text-gray-500">
            Document Editor
          </div>
          <div className="flex space-x-2">
            {/* No explicit save button needed with autosave */}
            <div className="text-xs text-gray-400">
              Autosaving...
            </div>
          </div>
        </div>
      )}
      
      {/* Editor blocks container */}
      <div className="editor-blocks p-4 space-y-1">
        {blocks.map((block, index) => (
          <div 
            key={block.id}
            ref={el => blockRefs.current[block.id] = el}
            className={`editor-block relative p-3 rounded-md transition-colors ${
              activeBlockId === block.id ? 'bg-gray-50 shadow-sm' : 'hover:bg-gray-50'
            } ${
              block.aiAssisted ? 'bg-blue-50/30 hover:bg-blue-50/50' : ''
            }`}
            onClick={(e) => {
              // No preventDefault - allow natural editing interactions to work
              
              // Track if we're already focusing a contentEditable in this block
              const alreadyFocused = contentEditableRefs.current[block.id]?.contains(document.activeElement);
              
              // If we clicked directly in the contentEditable, let the browser handle it
              const clickedContentEditable = contentEditableRefs.current[block.id]?.contains(e.target as Node);
              
              console.log(`Block click: alreadyFocused=${alreadyFocused}, clickedContentEditable=${clickedContentEditable}`);
              
              updateActiveBlockId(block.id);
              
              // Only manually focus if we didn't click directly in the contentEditable
              // and the block isn't already focused
              if (!clickedContentEditable && !alreadyFocused) {
                focusEditor(block.id, false); // Start fresh, move to end
              }
            }}
          >
            {/* Minimal controls for adding blocks */}
            {activeBlockId === block.id && !showToolbar && (
              <div className="absolute -left-10 top-3 flex flex-col items-center space-y-1">
                {/* Add block button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    addBlockAfter(block.id);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                {/* Delete block button - only if there's more than one block */}
                {blocks.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBlock(block.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Block editor - contentEditable div */}
            <div 
              ref={el => contentEditableRefs.current[block.id] = el}
              className={`block-editor min-h-[40px] cursor-text ${
                block.type === 'quote' ? 'pl-3 border-l-4 border-gray-300' :
                block.type === 'code' ? 'font-mono bg-gray-800 text-white rounded p-2' : ''
              } ${
                block.aiAssisted ? 'text-blue-900' : ''
              }`}
              contentEditable={true}
              dangerouslySetInnerHTML={{ __html: block.content }}
              onInput={(e) => handleInput(block.id, e)}
              onKeyDown={(e) => handleKeyDown(block.id, e)}
              onFocus={(e) => handleFocus(block.id, e)}
              onBlur={(e) => handleBlur(block.id, e)}
              suppressContentEditableWarning={true}
              spellCheck={true}
              data-placeholder={`Type here${block.aiAssisted ? ' (AI assisted)' : ''}...`}
            ></div>
            
            {/* AI processing indicator */}
            {isGeneratingAI && showAIMenu === block.id && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md">
                <div className="flex items-center">
                  <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse mr-2" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Add block button at the end */}
        <Button
          variant="ghost"
          className="w-full mt-4 border border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => {
            // If there are blocks, add after the last one, otherwise add the first one
            if (blocks.length > 0) {
              addBlockAfter(blocks[blocks.length - 1].id);
            } else {
              const newBlockId = genKey();
              setBlocks([
                {
                  id: newBlockId,
                  content: emptyBlockContent(),
                  type: 'text'
                }
              ]);
              setActiveBlockId(newBlockId);
            }
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Block
        </Button>
      </div>
      
      {/* Custom styles for editor */}
      <style jsx global>{`
        /* Basic styles for the contenteditable blocks */
        .document-editor .block-editor {
          font-family: Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          cursor: text;
          outline: none;
          min-height: 1.6em;
          transition: background-color 0.2s;
        }
        
        /* Empty block placeholder styling */
        .document-editor .block-editor:empty:before {
          content: attr(data-placeholder);
          color: #aaa;
          pointer-events: none;
          display: block;
        }
        
        /* This helps ensure the cursor appears in the right spot when clicking in */
        .document-editor .block-editor:focus {
          caret-color: black;
        }
        
        /* Improve selection visibility */
        .document-editor .block-editor::selection,
        .document-editor .block-editor *::selection {
          background: rgba(59, 130, 246, 0.2);
        }
        
        /* Block type specific styles */
        .document-editor .editor-block[data-type="heading-one"] .block-editor {
          font-size: 24px;
          font-weight: bold;
          line-height: 1.3;
        }
        
        .document-editor .editor-block[data-type="heading-two"] .block-editor {
          font-size: 20px;
          font-weight: bold;
          line-height: 1.3;
        }
        
        .document-editor .editor-block[data-type="heading-three"] .block-editor {
          font-size: 18px;
          font-weight: bold;
          line-height: 1.3;
        }
        
        /* Add hover state to indicate editability */
        .document-editor .editor-block:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }
        
        /* Focus state for the current editing block */
        .document-editor .block-editor:focus {
          background-color: rgba(0, 0, 0, 0.03);
        }
        
        /* AI assisted block styling */
        .ai-assisted-block {
          background-color: rgba(219, 234, 254, 0.3);
          border-left: 3px solid rgba(59, 130, 246, 0.5);
          padding-left: 16px;
        }
        
        /* Ensure cursor is always text over editable content */
        .document-editor .block-editor {
          cursor: text !important;
        }
      `}</style>
    </div>
  )
}