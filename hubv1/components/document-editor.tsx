"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Editor, 
  EditorState, 
  RichUtils, 
  ContentState, 
  convertFromHTML,
  convertToRaw,
  CompositeDecorator,
  getDefaultKeyBinding,
  KeyBindingUtil,
  SelectionState,
  Modifier,
  ContentBlock,
  genKey
} from 'draft-js'
import 'draft-js/dist/Draft.css'
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
  onSave?: (content: string) => void;
  onCancel?: () => void;
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
  content: EditorState;
  type: 'text' | 'heading-one' | 'heading-two' | 'heading-three' | 'unordered-list' | 'ordered-list' | 'code' | 'quote';
  aiAssisted?: boolean;
}

const emptyBlockContent = () => EditorState.createEmpty();

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
  
  // Blocks state
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => {
    try {
      // For now, initialize with a single empty block
      // In a production app, we would parse initialContent into blocks
      return [
        {
          id: genKey(),
          content: (() => {
            const blocksFromHTML = convertFromHTML(initialContent);
            if (blocksFromHTML.contentBlocks.length === 0) {
              return emptyBlockContent();
            }
            const contentState = ContentState.createFromBlockArray(
              blocksFromHTML.contentBlocks,
              blocksFromHTML.entityMap
            );
            return EditorState.createWithContent(contentState);
          })(),
          type: 'text'
        }
      ];
    } catch (error) {
      console.error("Error parsing HTML:", error);
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
        setTimeout(() => {
          focusEditor(activeBlockId);
        }, 50);
      } catch (err) {
        console.error("Error focusing editor:", err);
      }
    }
  }, [activeBlockId]);
  
  // Create a ref object to expose methods
  const editorMethodsRef = useRef<any>({});
  
  // Toast hooks
  const { toast } = useToast();
  
  // Define the method object once to avoid recreating it on each render
  const methodsRef = useRef<any>(null);
  
  // Custom setter that also calls the callback
  const updateActiveBlockId = (blockId: string | null) => {
    setActiveBlockId(blockId);
    if (blockId && onActiveBlockChange) {
      onActiveBlockChange(blockId);
    }
  };
  
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
  const editorRefs = useRef<{[key: string]: Editor | null}>({});
  
  // Focus a specific block's editor
  const focusEditor = (blockId: string) => {
    console.log("Attempting to focus editor for block:", blockId);
    
    if (!blockId) {
      console.warn("No block ID provided for focus");
      return;
    }
    
    // Get the most up-to-date reference
    setTimeout(() => {
      if (editorRefs.current[blockId]) {
        console.log("Found editor ref, focusing:", blockId);
        editorRefs.current[blockId]?.focus();
      } else {
        console.warn("Editor ref not found for block:", blockId);
        console.log("Available editor refs:", Object.keys(editorRefs.current));
      }
    }, 10);
  };

  // Handle editor state change for a block
  const handleEditorChange = (blockId: string, editorState: EditorState) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId ? { ...block, content: editorState } : block
      )
    );
  };
  
  // Handle key commands within an editor
  const handleKeyCommand = (blockId: string, command: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return 'not-handled';
    
    if (command === 'bold') {
      const newState = RichUtils.toggleInlineStyle(block.content, 'BOLD');
      handleEditorChange(blockId, newState);
      return 'handled';
    } else if (command === 'italic') {
      const newState = RichUtils.toggleInlineStyle(block.content, 'ITALIC');
      handleEditorChange(blockId, newState);
      return 'handled';
    }
    
    const newState = RichUtils.handleKeyCommand(block.content, command);
    if (newState) {
      handleEditorChange(blockId, newState);
      return 'handled';
    }
    
    return 'not-handled';
  };
  
  // Handle special key bindings
  const keyBindingFn = (blockId: string, e: React.KeyboardEvent): string | null => {
    // Handle keyboard shortcuts
    if (e.key === 'b' && KeyBindingUtil.hasCommandModifier(e)) {
      return 'bold';
    } else if (e.key === 'i' && KeyBindingUtil.hasCommandModifier(e)) {
      return 'italic';
    } else if (e.key === 'Enter' && !e.shiftKey) {
      const block = blocks.find(b => b.id === blockId);
      if (!block) return null;
      
      // Get content from current block
      const contentState = block.content.getCurrentContent();
      const selection = block.content.getSelection();
      
      // Check if cursor is at the end of the block
      const currentBlock = contentState.getBlockForKey(selection.getAnchorKey());
      const isAtEnd = selection.getAnchorOffset() === currentBlock.getLength();
      
      if (isAtEnd) {
        // Create a new block below this one
        addBlockAfter(blockId);
        return 'handled';
      }
    }
    
    return getDefaultKeyBinding(e);
  };
  
  // Add a new block after the specified block
  const addBlockAfter = (blockId: string) => {
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
  };
  
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
    
    // Get current text content
    const contentState = block.content.getCurrentContent();
    const plainText = contentState.getPlainText();
    
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
    
    // Create a new content state with the enhanced text
    const selectionState = SelectionState.createEmpty(contentState.getFirstBlock().getKey());
    const entireDocumentSelection = selectionState.merge({
      anchorOffset: 0,
      focusOffset: plainText.length,
      focusKey: contentState.getLastBlock().getKey(),
    });
    
    const newContentState = Modifier.replaceText(
      contentState,
      entireDocumentSelection,
      enhancedText
    );
    
    const newEditorState = EditorState.push(
      block.content,
      newContentState,
      'insert-characters'
    );
    
    // Update the block with the new content and mark it as AI-assisted
    setBlocks(prevBlocks => 
      prevBlocks.map(b => 
        b.id === blockId 
          ? { ...b, content: newEditorState, aiAssisted: true } 
          : b
      )
    );
    
    setIsGeneratingAI(false);
    setShowAIMenu(null);
    
    toast({
      title: "AI Enhancement Applied",
      description: `Text ${promptType === 'grammar' ? 'corrected' : 'enhanced'} using AI.`,
      duration: 3000
    });
    
    console.log("AI enhancement completed for block", blockId);
  };
  
  // Convert a block to HTML
  const blockToHtml = (block: EditorBlock): string => {
    const contentState = block.content.getCurrentContent();
    const raw = convertToRaw(contentState);
    
    // Map block type to HTML tag
    const getBlockTag = (type: EditorBlock['type']): string => {
      switch (type) {
        case 'heading-one': return 'h1';
        case 'heading-two': return 'h2';
        case 'heading-three': return 'h3';
        case 'unordered-list': return 'ul';
        case 'ordered-list': return 'ol';
        case 'code': return 'pre';
        case 'quote': return 'blockquote';
        default: return 'p';
      }
    };
    
    // Get wrapper tag based on block type
    const wrapperTag = getBlockTag(block.type);
    
    // Process the blocks and inline styles
    let html = '';
    raw.blocks.forEach(rawBlock => {
      let text = rawBlock.text;
      if (text.length === 0) {
        // Handle empty blocks
        html += `<${wrapperTag}><br/></${wrapperTag}>`;
        return;
      }
      
      // Handle inline styles
      let styledText = text;
      const inlineStyleRanges = [...rawBlock.inlineStyleRanges].sort((a, b) => a.offset - b.offset);
      
      if (inlineStyleRanges.length > 0) {
        // This is a simplified approach - a real implementation would handle
        // overlapping styles better
        let offset = 0;
        let result = '';
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          let styled = char;
          
          // Apply styles to this character
          for (const range of inlineStyleRanges) {
            if (i >= range.offset && i < range.offset + range.length) {
              switch (range.style) {
                case 'BOLD':
                  styled = `<strong>${styled}</strong>`;
                  break;
                case 'ITALIC':
                  styled = `<em>${styled}</em>`;
                  break;
                case 'UNDERLINE':
                  styled = `<u>${styled}</u>`;
                  break;
                case 'STRIKETHROUGH':
                  styled = `<s>${styled}</s>`;
                  break;
                case 'ALIGN_LEFT':
                  // Apply using a span with style
                  styled = `<span style="text-align:left">${styled}</span>`;
                  break;
                case 'ALIGN_CENTER':
                  styled = `<span style="text-align:center">${styled}</span>`;
                  break;
                case 'ALIGN_RIGHT':
                  styled = `<span style="text-align:right">${styled}</span>`;
                  break;
                case 'ALIGN_JUSTIFY':
                  styled = `<span style="text-align:justify">${styled}</span>`;
                  break;
              }
            }
          }
          
          result += styled;
        }
        
        styledText = result;
      }
      
      // Create the block with proper wrapper tag
      if (block.type === 'unordered-list' || block.type === 'ordered-list') {
        // Special handling for lists
        html += `<${wrapperTag}><li>${styledText}</li></${wrapperTag}>`;
      } else if (block.type === 'code') {
        // Special handling for code blocks
        html += `<${wrapperTag}><code>${styledText}</code></${wrapperTag}>`;
      } else {
        // Standard block
        html += `<${wrapperTag}>${styledText}</${wrapperTag}>`;
      }
    });
    
    return html;
  };
  
  // Convert all blocks to HTML
  const getContentAsHtml = (): string => {
    // Class for AI-assisted blocks
    const aiClass = 'ai-assisted-block';
    
    return blocks.map(block => {
      const html = blockToHtml(block);
      
      // Add AI assistance indicator class if needed
      if (block.aiAssisted) {
        // Add class to the opening tag
        return html.replace(/^<([^>]+)>/, `<$1 class="${aiClass}">`);
      }
      
      return html;
    }).join('\n');
  };
  
  // Handle save action
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
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
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
            onClick={() => {
              updateActiveBlockId(block.id);
              focusEditor(block.id);
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
            
            {/* Block editor */}
            <div 
              className={`block-editor min-h-[40px] ${
                block.type === 'quote' ? 'pl-3 border-l-4 border-gray-300' :
                block.type === 'code' ? 'font-mono bg-gray-800 text-white rounded p-2' : ''
              } ${
                block.aiAssisted ? 'text-blue-900' : ''
              }`}
            >
              <Editor
                ref={(ref) => editorRefs.current[block.id] = ref}
                editorState={block.content}
                onChange={(editorState) => handleEditorChange(block.id, editorState)}
                handleKeyCommand={(command) => handleKeyCommand(block.id, command)}
                keyBindingFn={(e) => keyBindingFn(block.id, e)}
                placeholder={`Type here${block.aiAssisted ? ' (AI assisted)' : ''}...`}
                spellCheck={true}
              />
            </div>
            
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
        .document-editor .DraftEditor-root {
          font-family: Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
        }
        
        /* Block type specific styles */
        .document-editor .editor-block[data-type="heading-one"] .DraftEditor-root {
          font-size: 24px;
          font-weight: bold;
          line-height: 1.3;
        }
        
        .document-editor .editor-block[data-type="heading-two"] .DraftEditor-root {
          font-size: 20px;
          font-weight: bold;
          line-height: 1.3;
        }
        
        .document-editor .editor-block[data-type="heading-three"] .DraftEditor-root {
          font-size: 18px;
          font-weight: bold;
          line-height: 1.3;
        }
        
        /* AI assisted block styling */
        .ai-assisted-block {
          background-color: rgba(219, 234, 254, 0.3);
          border-left: 3px solid rgba(59, 130, 246, 0.5);
          padding-left: 16px;
        }
      `}</style>
    </div>
  )
}