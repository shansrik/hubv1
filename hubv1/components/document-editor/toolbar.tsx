"use client"

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Quote, 
  Code, 
  Sparkles 
} from "lucide-react";
import { ToolbarProps } from "./types";
import AIEnhancementMenu from "./ai-enhancement-menu";

export default function Toolbar({ editor, isGeneratingAI, onEnhanceWithAI }: ToolbarProps) {
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  if (!editor) return null;

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-1 flex flex-wrap items-center gap-1">
      {/* Text formatting */}
      <Button 
        size="sm" 
        variant={editor.isActive('bold') ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="h-8 w-8 p-0"
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button 
        size="sm" 
        variant={editor.isActive('italic') ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className="h-8 w-8 p-0"
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button 
        size="sm" 
        variant={editor.isActive('underline') ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className="h-8 w-8 p-0"
      >
        <Underline className="h-4 w-4" />
      </Button>
      
      <div className="mx-1 h-6 border-l border-gray-200"></div>
      
      {/* Text alignment */}
      <Button 
        size="sm" 
        variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className="h-8 w-8 p-0"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      
      <Button 
        size="sm" 
        variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className="h-8 w-8 p-0"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      
      <Button 
        size="sm" 
        variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className="h-8 w-8 p-0"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      
      <div className="mx-1 h-6 border-l border-gray-200"></div>
      
      {/* Text styles */}
      <Button 
        size="sm" 
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className="h-8 w-8 p-0"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      
      <Button 
        size="sm" 
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="h-8 w-8 p-0"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      
      <div className="mx-1 h-6 border-l border-gray-200"></div>
      
      {/* Lists */}
      <Button 
        size="sm" 
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
      
      <Button 
        size="sm" 
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-8 w-8 p-0"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <div className="mx-1 h-6 border-l border-gray-200"></div>
      
      {/* Quotes and code */}
      <Button 
        size="sm" 
        variant={editor.isActive('blockquote') ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className="h-8 w-8 p-0"
      >
        <Quote className="h-4 w-4" />
      </Button>
      
      <Button 
        size="sm" 
        variant={editor.isActive('codeBlock') ? 'default' : 'ghost'} 
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className="h-8 w-8 p-0"
      >
        <Code className="h-4 w-4" />
      </Button>
      
      <div className="mx-1 h-6 border-l border-gray-200"></div>
      
      {/* AI Popover */}
      <div ref={popoverRef}>
        <Popover open={aiMenuOpen} onOpenChange={setAiMenuOpen}>
          <PopoverTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 px-2 text-yellow-500 flex items-center"
              disabled={isGeneratingAI}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              <span className="text-xs">AI</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <AIEnhancementMenu 
              isGeneratingAI={isGeneratingAI} 
              onEnhanceWithAI={(options) => {
                setAiMenuOpen(false);
                onEnhanceWithAI(options);
              }} 
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}