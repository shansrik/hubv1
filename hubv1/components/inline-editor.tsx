"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Editor, 
  EditorState, 
  RichUtils, 
  ContentState, 
  convertFromHTML, 
  convertToRaw 
} from 'draft-js'
import 'draft-js/dist/Draft.css'
import { Bold, Italic, List, Type, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface InlineEditorProps {
  initialContent: string
  onSave: (content: string) => void
  onCancel: () => void
}

export default function InlineEditor({ initialContent, onSave, onCancel }: InlineEditorProps) {
  const [editorState, setEditorState] = useState(() => {
    try {
      // Try to convert HTML to editor content
      const blocksFromHTML = convertFromHTML(initialContent)
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      )
      return EditorState.createWithContent(contentState)
    } catch (error) {
      // Fallback to empty editor or plain text
      console.error("Error parsing HTML content:", error)
      return EditorState.createWithContent(
        ContentState.createFromText(initialContent.replace(/<[^>]*>/g, ""))
      )
    }
  })
  
  const editorRef = useRef<Editor>(null)
  
  // Focus editor on mount
  useEffect(() => {
    if (editorRef.current) {
      // Small delay to ensure rendering is complete
      setTimeout(() => {
        editorRef.current?.focus()
      }, 100)
    }
  }, [])
  
  // Handle key commands in the editor
  const handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command)
    if (newState) {
      setEditorState(newState)
      return 'handled'
    }
    return 'not-handled'
  }

  // Toggle inline styles (bold, italic, etc.)
  const toggleInlineStyle = (style: string) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style))
  }

  // Toggle block types (headers, lists, etc.)
  const toggleBlockType = (blockType: string) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType))
  }
  
  // Save the edited content
  const handleSave = () => {
    // Convert editor state to HTML
    const contentState = editorState.getCurrentContent()
    const rawContentState = convertToRaw(contentState)
    
    // Simple conversion to HTML
    let html = ""
    rawContentState.blocks.forEach(block => {
      const text = block.text
      if (text.length === 0) {
        html += "<br/>"
      } else {
        let blockTag = "p"
        let styles = ""
        
        // Handle block types
        switch (block.type) {
          case "header-one":
            blockTag = "h1"
            break
          case "header-two":
            blockTag = "h2"
            break
          case "unordered-list-item":
            blockTag = "li"
            html = html.endsWith("</ul>") ? html : html + "<ul>"
            break
          case "ordered-list-item":
            blockTag = "li"
            html = html.endsWith("</ol>") ? html : html + "<ol>"
            break
          default:
            blockTag = "p"
        }
        
        // Start the block tag
        html += `<${blockTag}${styles ? ` style="${styles}"` : ''}>`
        
        // Handle inline styles
        let inlineStyleRanges = block.inlineStyleRanges || []
        let lastOffset = 0
        let result = ""
        
        // Sort ranges by offset
        inlineStyleRanges.sort((a, b) => a.offset - b.offset)
        
        inlineStyleRanges.forEach(range => {
          const { offset, length, style } = range
          
          // Add text before this style range
          result += text.slice(lastOffset, offset)
          
          // Add the styled text
          let styledText = text.slice(offset, offset + length)
          
          if (style === "BOLD") {
            styledText = `<strong>${styledText}</strong>`
          } else if (style === "ITALIC") {
            styledText = `<em>${styledText}</em>`
          } else if (style === "UNDERLINE") {
            styledText = `<u>${styledText}</u>`
          }
          
          result += styledText
          lastOffset = offset + length
        })
        
        // Add any remaining text
        result += text.slice(lastOffset)
        
        // Add the content to the HTML
        html += result
        
        // Close the block tag
        html += `</${blockTag}>`
        
        // Close list tags if needed
        if (block.type !== "unordered-list-item" && html.includes("<ul>")) {
          html += "</ul>"
        }
        if (block.type !== "ordered-list-item" && html.includes("<ol>")) {
          html += "</ol>"
        }
      }
    })
    
    onSave(html)
  }

  return (
    <div className="inline-editor w-full">
      <div className="editor-toolbar border-b border-gray-200 p-2 flex items-center space-x-2 bg-gray-50 sticky top-0 z-10">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleInlineStyle('BOLD')}
          className="p-1 h-8 w-8"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleInlineStyle('ITALIC')}
          className="p-1 h-8 w-8"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleBlockType('unordered-list-item')}
          className="p-1 h-8 w-8"
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-8">
              <Type className="h-4 w-4 mr-1" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0">
            <div className="flex flex-col">
              <Button 
                variant="ghost" 
                onClick={() => toggleBlockType('header-one')}
                className="justify-start"
              >
                Heading 1
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => toggleBlockType('header-two')}
                className="justify-start"
              >
                Heading 2
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => toggleBlockType('paragraph')}
                className="justify-start"
              >
                Normal Text
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="flex-1"></div>
        
        <Button size="sm" onClick={handleSave}>Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      
      <div className="editor-content p-2">
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
          placeholder="Edit content..."
          spellCheck={true}
        />
      </div>
    </div>
  )
}