"use client"

import type React from "react"

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react"
import {
  Editor,
  EditorState,
  RichUtils,
  ContentState,
  Modifier,
  convertFromHTML,
  convertToRaw,
  CompositeDecorator,
  getDefaultKeyBinding,
} from "draft-js"
import "draft-js/dist/Draft.css"
import { Button } from "@/components/ui/button"
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
  Heading3,
  Indent,
  Outdent,
  LucideLink,
  Image,
  FileUp,
  FileDown,
  Type,
  PaintBucket,
  Highlighter,
  Table,
  Sparkles,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

// Font families
const FONT_FAMILIES = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Courier New", value: "Courier New, monospace" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
]

// Font sizes
const FONT_SIZES = [
  { label: "8", value: "8px" },
  { label: "9", value: "9px" },
  { label: "10", value: "10px" },
  { label: "11", value: "11px" },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "30", value: "30px" },
  { label: "36", value: "36px" },
  { label: "48", value: "48px" },
  { label: "60", value: "60px" },
  { label: "72", value: "72px" },
]

// Colors
const TEXT_COLORS = [
  { label: "Black", value: "#000000" },
  { label: "Dark Gray", value: "#666666" },
  { label: "Light Gray", value: "#999999" },
  { label: "White", value: "#ffffff" },
  { label: "Red", value: "#ff0000" },
  { label: "Orange", value: "#ff9900" },
  { label: "Yellow", value: "#ffff00" },
  { label: "Green", value: "#00ff00" },
  { label: "Blue", value: "#0000ff" },
  { label: "Purple", value: "#9900ff" },
]

// Highlight colors
const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#ffff00" },
  { label: "Bright Green", value: "#00ff00" },
  { label: "Turquoise", value: "#00ffff" },
  { label: "Pink", value: "#ff00ff" },
  { label: "Blue", value: "#0000ff" },
  { label: "Red", value: "#ff0000" },
  { label: "Dark Yellow", value: "#ffcc00" },
  { label: "Teal", value: "#008080" },
  { label: "Green", value: "#008000" },
  { label: "Purple", value: "#800080" },
  { label: "Dark Red", value: "#800000" },
  { label: "Light Gray", value: "#c0c0c0" },
]

// Link decorator
function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity()
    return entityKey !== null && contentState.getEntity(entityKey).getType() === "LINK"
  }, callback)
}

const LinkDecorator = (props) => {
  const { url } = props.contentState.getEntity(props.entityKey).getData()
  return (
    <a href={url} style={{ color: "#3b82f6", textDecoration: "underline" }}>
      {props.children}
    </a>
  )
}

const decorator = new CompositeDecorator([
  {
    strategy: findLinkEntities,
    component: LinkDecorator,
  },
])

// Define interface for document template
interface DocumentTemplate {
  id: string
  name: string
  description?: string
  pageSize: string
  orientation: "portrait" | "landscape"
  margins: {
    top: string
    right: string
    bottom: string
    left: string
  }
  header?: {
    height: string
    content: string
  }
  footer?: {
    height: string
    content: string
  }
  sections: DocumentSection[]
  css: string
}

interface DocumentSection {
  id: string
  type: "title" | "heading" | "text" | "image" | "table" | "list"
  content?: string
  properties?: Record<string, any>
  styles?: Record<string, string>
}

// This is where you'll place your hard-coded template
// MODIFY THIS WITH YOUR OWN TEMPLATE DATA
const DEFAULT_TEMPLATE: DocumentTemplate = {
  id: "default-template",
  name: "Default Report Template",
  description: "A standard report template with header and footer",
  pageSize: "A4",
  orientation: "portrait",
  margins: {
    top: "1in",
    right: "1in",
    bottom: "1in",
    left: "1in",
  },
  header: {
    height: "0.5in",
    content: "<div class='header'>University of Toronto</div>",
  },
  footer: {
    height: "0.5in",
    content: "<div class='footer'>Page <span class='page-number'></span> of <span class='page-count'></span></div>",
  },
  sections: [
    // YOUR SECTIONS WILL GO HERE
  ],
  css: `
    /* Template CSS for multi-page formatting */
    @page {
      size: A4;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
    }
    .page {
      width: 8.27in;
      height: 11.69in;
      padding: 1in;
      margin: 0 auto;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
      position: relative;
      box-sizing: border-box;
      page-break-after: always;
      background-color: white;
    }
    .page:last-child {
      page-break-after: avoid;
    }
    .header {
      position: absolute;
      top: 0.5in;
      left: 1in;
      right: 1in;
      height: 0.5in;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .footer {
      position: absolute;
      bottom: 0.5in;
      left: 1in;
      right: 1in;
      height: 0.5in;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .content {
      margin-top: 0.5in;
      margin-bottom: 0.5in;
    }
    @media print {
      body {
        background: none;
      }
      .page {
        box-shadow: none;
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  `,
}

// Add more templates as needed
const TEMPLATES: DocumentTemplate[] = [
  DEFAULT_TEMPLATE,
  // ADD YOUR ADDITIONAL TEMPLATES HERE
]

interface RichTextEditorProps {
  initialContent?: string
  onGenerateText: (selectedText: string) => Promise<void>
  isGenerating: boolean
}

const RichTextEditor = forwardRef(({ initialContent, onGenerateText, isGenerating }: RichTextEditorProps, ref) => {
  // Initialize with empty content or convert HTML if provided
  const [editorState, setEditorState] = useState(() => {
    if (initialContent) {
      const blocksFromHTML = convertFromHTML(initialContent)
      const contentState = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)
      return EditorState.createWithContent(contentState, decorator)
    }
    return EditorState.createEmpty(decorator)
  })

  const [currentFontFamily, setCurrentFontFamily] = useState("Arial, sans-serif")
  const [currentFontSize, setCurrentFontSize] = useState("12px")
  const [currentTextColor, setCurrentTextColor] = useState("#000000")
  const [currentHighlightColor, setCurrentHighlightColor] = useState("#ffff00")
  const [linkUrl, setLinkUrl] = useState("")
  const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 })
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [currentTemplate, setCurrentTemplate] = useState<DocumentTemplate>(DEFAULT_TEMPLATE)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)

  const editorRef = useRef<Editor>(null)
  const editorWrapperRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      const selection = editorState.getSelection()
      const contentState = editorState.getCurrentContent()
      const newContentState = Modifier.insertText(contentState, selection, text)
      const newEditorState = EditorState.push(editorState, newContentState, "insert-characters")
      setEditorState(newEditorState)
    },
    getEditorState: () => editorState,
    setEditorState,
    importDocx: (htmlContent: string) => {
      const blocksFromHTML = convertFromHTML(htmlContent)
      const contentState = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)
      const newEditorState = EditorState.createWithContent(contentState, decorator)
      setEditorState(newEditorState)
    },
    exportDocx: () => {
      const contentState = editorState.getCurrentContent()
      const rawContent = convertToRaw(contentState)
      return rawContent
    },
    getCurrentTemplate: () => currentTemplate,
    setCurrentTemplate,
  }))

  // Handle selection changes to show the AI menu
  useEffect(() => {
    const checkSelection = () => {
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed && editorWrapperRef.current) {
        const text = selection.toString()
        if (text && text.length > 0) {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          const editorRect = editorWrapperRef.current.getBoundingClientRect()

          setSelectionPosition({
            top: rect.top - editorRect.top + 30, // Position below the selection
            left: rect.left - editorRect.left + rect.width / 2 - 50, // Center the menu
          })
          setSelectedText(text)
          setShowAIMenu(true)
        } else {
          setShowAIMenu(false)
        }
      } else {
        setShowAIMenu(false)
      }
    }

    document.addEventListener("selectionchange", checkSelection)
    return () => {
      document.removeEventListener("selectionchange", checkSelection)
    }
  }, [])

  // Close AI menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editorWrapperRef.current && !editorWrapperRef.current.contains(event.target as Node)) {
        setShowAIMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleKeyCommand = (command: string) => {
    const newState = RichUtils.handleKeyCommand(editorState, command)
    if (newState) {
      setEditorState(newState)
      return "handled"
    }
    return "not-handled"
  }

  const keyBindingFn = (e: React.KeyboardEvent) => {
    // Handle Cmd+Enter or Ctrl+Enter to generate text
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      const selection = editorState.getSelection()
      const currentContent = editorState.getCurrentContent()
      const selectedText = getSelectedText(currentContent, selection)

      if (selectedText) {
        onGenerateText(selectedText)
        return "generate-text"
      }
    }

    return getDefaultKeyBinding(e)
  }

  const getSelectedText = (contentState: ContentState, selection: any) => {
    const startKey = selection.getStartKey()
    const endKey = selection.getEndKey()
    const startOffset = selection.getStartOffset()
    const endOffset = selection.getEndOffset()

    if (startKey === endKey) {
      return contentState.getBlockForKey(startKey).getText().slice(startOffset, endOffset)
    }

    let selectedText = ""
    let blockKey = startKey

    while (blockKey) {
      const blockText = contentState.getBlockForKey(blockKey).getText()

      if (blockKey === startKey) {
        selectedText += blockText.slice(startOffset)
      } else if (blockKey === endKey) {
        selectedText += blockText.slice(0, endOffset)
        break
      } else {
        selectedText += blockText
      }

      selectedText += "\n"
      const nextBlock = contentState.getBlockAfter(blockKey)
      blockKey = nextBlock ? nextBlock.getKey() : null
    }

    return selectedText
  }

  const toggleBlockType = (blockType: string) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType))
  }

  const toggleInlineStyle = (inlineStyle: string) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle))
  }

  const applyFontFamily = (fontFamily: string) => {
    setCurrentFontFamily(fontFamily)
    const selection = editorState.getSelection()
    const contentState = editorState.getCurrentContent()

    // Create a new entity for the font family
    const contentStateWithEntity = contentState.createEntity("FONT_FAMILY", "MUTABLE", { fontFamily })

    const entityKey = contentStateWithEntity.getLastCreatedEntityKey()

    // Apply the entity to the selected text
    const newContentState = Modifier.applyEntity(contentStateWithEntity, selection, entityKey)

    const newEditorState = EditorState.push(editorState, newContentState, "apply-entity")

    setEditorState(newEditorState)
  }

  const applyFontSize = (fontSize: string) => {
    setCurrentFontSize(fontSize)
    toggleInlineStyle(`FONTSIZE_${fontSize}`)
  }

  const applyTextColor = (color: string) => {
    setCurrentTextColor(color)
    toggleInlineStyle(`COLOR_${color.replace("#", "")}`)
  }

  const applyHighlightColor = (color: string) => {
    setCurrentHighlightColor(color)
    toggleInlineStyle(`HIGHLIGHT_${color.replace("#", "")}`)
  }

  const addLink = () => {
    const selection = editorState.getSelection()
    if (selection.isCollapsed()) {
      return
    }

    const contentState = editorState.getCurrentContent()
    const contentStateWithEntity = contentState.createEntity("LINK", "MUTABLE", { url: linkUrl })
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey()

    const newEditorState = EditorState.push(editorState, contentStateWithEntity, "create-entity")

    setEditorState(RichUtils.toggleLink(newEditorState, newEditorState.getSelection(), entityKey))

    setLinkUrl("")
  }

  const handlePasteFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For demonstration, we'll simulate parsing a .doc file
    // In a real app, you'd use a library like mammoth.js to convert .docx to HTML

    // Simulate loading a document
    const reader = new FileReader()
    reader.onload = (event) => {
      // In a real implementation, you would convert the .doc file to HTML here
      // For now, we'll just create some placeholder content
      const placeholderHtml = `
        <h1>Imported Document</h1>
        <p>This is a simulated import of the file: ${file.name}</p>
        <p>In a real implementation, the content of your .doc file would appear here.</p>
        <p>The document would maintain its formatting, including:</p>
        <ul>
          <li>Font styles and sizes</li>
          <li>Text colors and highlighting</li>
          <li>Tables and images</li>
          <li>Headers and footers</li>
        </ul>
      `

      const blocksFromHTML = convertFromHTML(placeholderHtml)
      const contentState = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)
      const newEditorState = EditorState.createWithContent(contentState, decorator)
      setEditorState(newEditorState)
    }

    reader.readAsText(file)
  }

  const exportDocument = () => {
    // In a real implementation, you would convert the editor content to a .doc file
    // For now, we'll just show what data would be exported
    const contentState = editorState.getCurrentContent()
    const rawContent = convertToRaw(contentState)

    // Create a download link for a text file containing the JSON representation
    const jsonString = JSON.stringify(rawContent, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "document-export.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportAsPdf = () => {
    const contentState = editorState.getCurrentContent();
    const html = convertToHTML(contentState);
    
    // Create a new window with the styled content using the template
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Export failed",
        description: "Unable to open a new window. Please check your popup blocker settings.",
        variant: "destructive",
      });
      return;
    }

    // Add styled HTML content with template structure
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${currentTemplate.name}</title>
        <style>
          ${currentTemplate.css}
          /* Additional styles for content */
          body {
            font-family: ${currentFontFamily};
            font-size: ${currentFontSize};
            color: #333;
            line-height: 1.5;
            background-color: #f5f5f5;
          }
          .content-area {
            padding: 20px;
          }
          h1 {
            margin-top: 0.5in;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          th {
            background-color: #f2f2f2;
          }
          img {
            max-width: 100%;
          }
          @media print {
            body {
              background: none;
            }
            .page {
              box-shadow: none;
              margin: 0;
              padding: ${currentTemplate.margins.top} ${currentTemplate.margins.right} ${currentTemplate.margins.bottom} ${currentTemplate.margins.left};
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          ${currentTemplate.header ? currentTemplate.header.content : ''}
          <div class="content-area">
            ${html}
          </div>
          ${currentTemplate.footer ? currentTemplate.footer.content : ''}
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print as PDF
          </button>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();

    toast({
      title: "PDF Export",
      description: "Document prepared for PDF export. Use the Print button or browser's print function to save as PDF.",
    });
  };

  const convertToHTML = (contentState: ContentState) => {
    let html = '';
    contentState.getBlockMap().forEach((block) => {
      if (!block) return;

      const text = block.getText();
      const type = block.getType();
      const inlineStyles = getInlineStyles(block);

      // Handle different block types
      if (type.startsWith('header-')) {
        const level = type.charAt(7);
        html += `<h${level}>${applyInlineStyles(text, inlineStyles)}</h${level}>`;
      } else if (type === 'unordered-list-item') {
        html += `<ul><li>${applyInlineStyles(text, inlineStyles)}</li></ul>`;
      } else if (type === 'ordered-list-item') {
        html += `<ol><li>${applyInlineStyles(text, inlineStyles)}</li></ol>`;
      } else {
        html += `<p>${applyInlineStyles(text, inlineStyles)}</p>`;
      }
    });

    return html;
  };

  const getInlineStyles = (block) => {
    const styles = [];
    block.findStyleRanges(
      (character) => {
        const charStyles = character.getStyle();
        if (charStyles.size > 0) {
          styles.push({
            offset: character.getOffset(),
            length: 1,
            styles: charStyles.toArray()
          });
        }
        return true;
      }
    );
    return styles;
  };

  const applyInlineStyles = (text, styles) => {
    if (styles.length === 0) return text;

    // This is a simplified version - a real implementation would be more complex
    // to handle overlapping styles correctly
    let html = text;

    // Apply basic styles
    styles.forEach(style => {
      const start = style.offset;
      const end = start + style.length;
      const textPart = text.substring(start, end);

      let styledText = textPart;
      style.styles.forEach(s => {
        if (s === 'BOLD') {
          styledText = `<strong>${styledText}</strong>`;
        } else if (s === 'ITALIC') {
          styledText = `<em>${styledText}</em>`;
        } else if (s === 'UNDERLINE') {
          styledText = `<u>${styledText}</u>`;
        } else if (s.startsWith('COLOR_')) {
          const color = `#${s.substring(6)}`;
          styledText = `<span style="color:${color}">${styledText}</span>`;
        } else if (s.startsWith('HIGHLIGHT_')) {
          const color = `#${s.substring(10)}`;
          styledText = `<span style="background-color:${color}">${styledText}</span>`;
        } else if (s.startsWith('FONTSIZE_')) {
          const size = s.substring(9);
          styledText = `<span style="font-size:${size}">${styledText}</span>`;
        }
      });

      // Replace the original text part with the styled version
      // This is a simplified approach and might not work correctly for overlapping styles
      html = html.replace(textPart, styledText);
    });

    return html;
  };

  const toggleTemplatePreview = () => {
    setShowTemplatePreview(!showTemplatePreview);
  };

  const customStyleMap = {
    ...TEXT_COLORS.reduce((styles, color) => {
      styles[`COLOR_${color.value.replace("#", "")}`] = { color: color.value }
      return styles
    }, {}),
    ...HIGHLIGHT_COLORS.reduce((styles, color) => {
      styles[`HIGHLIGHT_${color.value.replace("#", "")}`] = { backgroundColor: color.value }
      return styles
    }, {}),
    ...FONT_SIZES.reduce((styles, size) => {
      styles[`FONTSIZE_${size.value}`] = { fontSize: size.value }
      return styles
    }, {}),
  }

  const handleGenerateText = async () => {
    if (selectedText) {
      setShowAIMenu(false)
      await onGenerateText(selectedText)
    }
  }

  return (
    <div className="bg-white border border-gray-300 rounded-md flex flex-col">
      <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 items-center bg-gray-50">
        {/* File operations */}
        <div className="flex items-center mr-2 border-r border-gray-300 pr-2">
          <label className="cursor-pointer">
            <FileUp className="h-5 w-5 text-gray-600 hover:text-gray-900" />
            <input
              type="file"
              accept=".doc,.docx"
              className="hidden"
              onChange={handlePasteFile}
            />
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Export document"
              >
                <FileDown className="h-5 w-5 text-gray-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0">
              <div className="py-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 py-1.5 text-left"
                  onClick={exportDocument}
                >
                  Export as DOCX
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 py-1.5 text-left"
                  onClick={exportAsPdf}
                >
                  Export as PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Font family */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1 border-gray-300 bg-white">
              <Type className="h-4 w-4" />
              <span className="max-w-[100px] truncate">{currentFontFamily.split(",")[0]}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0">
            <div className="max-h-60 overflow-y-auto">
              {FONT_FAMILIES.map((font) => (
                <Button
                  key={font.value}
                  variant="ghost"
                  className="w-full justify-start px-2 py-1.5 text-left"
                  onClick={() => applyFontFamily(font.value)}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Font size */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-16 border-gray-300 bg-white">
              {currentFontSize.replace("px", "")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-0">
            <div className="max-h-60 overflow-y-auto">
              {FONT_SIZES.map((size) => (
                <Button
                  key={size.value}
                  variant="ghost"
                  className="w-full justify-start px-2 py-1.5 text-left"
                  onClick={() => applyFontSize(size.value)}
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="mx-2 border-r border-gray-300 h-6"></div>

        {/* Text formatting */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editorState.getCurrentInlineStyle().has("BOLD") ? "bg-gray-200" : ""}`}
          onClick={() => toggleInlineStyle("BOLD")}
        >
          <Bold className="h-4 w-4 text-gray-700" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editorState.getCurrentInlineStyle().has("ITALIC") ? "bg-gray-200" : ""}`}
          onClick={() => toggleInlineStyle("ITALIC")}
        >
          <Italic className="h-4 w-4 text-gray-700" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${editorState.getCurrentInlineStyle().has("UNDERLINE") ? "bg-gray-200" : ""}`}
          onClick={() => toggleInlineStyle("UNDERLINE")}
        >
          <Underline className="h-4 w-4 text-gray-700" />
        </Button>

        <div className="mx-2 border-r border-gray-300 h-6"></div>

        {/* Text color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <PaintBucket className="h-4 w-4 text-gray-700" />
              <div
                className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: currentTextColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="grid grid-cols-5 gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value}
                  className="w-8 h-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: color.value }}
                  onClick={() => applyTextColor(color.value)}
                  title={color.label}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Highlighter className="h-4 w-4 text-gray-700" />
              <div
                className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: currentHighlightColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="grid grid-cols-5 gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  className="w-8 h-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: color.value }}
                  onClick={() => applyHighlightColor(color.value)}
                  title={color.label}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="mx-2 border-r border-gray-300 h-6"></div>

        {/* Alignment */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleBlockType("left-align")}>\
          <AlignLeftsize="icon"

className="h-8 w-8"

onClick={() => toggleBlockType("left-align")}>

          <AlignLeft className="h-4 w-4 text-gray-700" />

        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleBlockType("center-align")}>

          <AlignCenter className="h-4 w-4 text-gray-700" />

        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleBlockType("right-align")}>

          <AlignRight className="h-4 w-4 text-gray-700" />

        </Button>

        <div className="mx-2 border-r border-gray-300 h-6"></div>

        {/* Lists */}

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleBlockType("unordered-list-item")}>

          <List className="h-4 w-4 text-gray-700" />

        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleBlockType("ordered-list-item")}>

          <ListOrdered className="h-4 w-4 text-gray-700" />

        </Button>

        <div className="mx-2 border-r border-gray-300 h-6"></div>

        {/* Headings */}

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleBlockType("header-one")}>

          <Heading1 className="h-4 w-4 text-gray-700" />

        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleBlockType("header-two")}>

          <Heading2 className="h-4 w-4 text-gray-700" />

        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleBlockType("header-three")}>

          <Heading3 className="h-4 w-4 text-gray-700" />

        </Button>

        <div className="mx-2 border-r border-gray-300 h-6"></div>

        {/* Indentation */}

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleBlockType("indent")}>

          <Indent className="h-4 w-4 text-gray-700" />

        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleBlockType("outdent")}>

          <Outdent className="h-4 w-4 text-gray-700" />

        </Button>

        <div className="mx-2 border-r border-gray-300 h-6"></div>

        {/* Link */}

        <Popover>

          <PopoverTrigger asChild>

            <Button variant="ghost" size="icon" className="h-8 w-8">

              <LucideLink className="h-4 w-4 text-gray-700" />

            </Button>

          </PopoverTrigger>

          <PopoverContent className="w-80 p-4">

            <div className="space-y-2">

              <h4 className="font-medium">Insert Link</h4>

              <div className="space-y-2">

                <Label htmlFor="url">URL</Label>

                <Input

                  id="url"

                  value={linkUrl}

                  onChange={(e) => setLinkUrl(e.target.value)}

                  placeholder="https://example.com"

                />

              </div>

              <div className="flex justify-end">

                <Button onClick={addLink} disabled={!linkUrl}>

                  Insert

                </Button>

              </div>

            </div>

          </PopoverContent>

        </Popover>

        {/* Table */}

        <Button

          variant="ghost"

          size="icon"

          className="h-8 w-8"

          onClick={() => {

            // Insert a simple table placeholder

            const tableHtml = `

              <table border="1" style="width:100%">

                <tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr>

                <tr><td>Row 1, Cell 1</td><td>Row 1, Cell 2</td><td>Row 1, Cell 3</td></tr>

                <tr><td>Row 2, Cell 1</td><td>Row 2, Cell 2</td><td>Row 2, Cell 3</td></tr>

              </table>

            `

            const blocksFromHTML = convertFromHTML(tableHtml)

            const contentState = ContentState.createFromBlockArray(

              blocksFromHTML.contentBlocks,

              blocksFromHTML.entityMap,

            )

            const newEditorState = EditorState.push(editorState, contentState, "insert-fragment")

            setEditorState(newEditorState)

          }}

        >

          <Table className="h-4 w-4 text-gray-700" />

        </Button>

        {/* Image */}

        <Button

          variant="ghost"

          size="icon"

          className="h-8 w-8"

          onClick={() => {

            // Insert a placeholder image

            const imageHtml = '<img src="/placeholder.svg?height=200&width=300" alt="Placeholder" />'

            const blocksFromHTML = convertFromHTML(imageHtml)

            const contentState = ContentState.createFromBlockArray(

              blocksFromHTML.contentBlocks,

              blocksFromHTML.entityMap,

            )

            const newEditorState = EditorState.push(editorState, contentState, "insert-fragment")

            setEditorState(newEditorState)

          }}

        >

          <Image className="h-4 w-4 text-gray-700" />

        </Button>

        {/* Template Preview Toggle */}

        <div className="mx-2 border-r border-gray-300 h-6"></div>

        <Button

          variant="outline"

          size="sm"

          className="h-8 gap-1 border-gray-300 bg-white"

          onClick={toggleTemplatePreview}

        >

          {showTemplatePreview ? "Hide Template" : "Show Template"}

        </Button>

      </div>

      <div className="flex flex-1">

        {/* Template Preview */}

        {showTemplatePreview && (

          <div className="w-1/4 border-r border-gray-200 p-4 bg-gray-50 overflow-y-auto">

            <h3 className="font-bold mb-3">Document Template</h3>

            <div className="text-sm">

              <p><strong>Name:</strong> {currentTemplate.name}</p>

              <p><strong>Page Size:</strong> {currentTemplate.pageSize}</p>

              <p><strong>Orientation:</strong> {currentTemplate.orientation}</p>

              <h4 className="font-semibold mt-3 mb-1">Margins</h4>

              <ul className="list-disc pl-5">

                <li>Top: {currentTemplate.margins.top}</li>

                <li>Right: {currentTemplate.margins.right}</li>

                <li>Bottom: {currentTemplate.margins.bottom}</li>

                <li>Left: {currentTemplate.margins.left}</li>

              </ul>

              <div className="mt-4">

                <p className="font-semibold">Template JSON:</p>

                <pre className="bg-gray-100 p-2 mt-2 text-xs overflow-x-auto rounded">

                  {JSON.stringify(currentTemplate, null, 2)}

                </pre>

              </div>

            </div>

          </div>

        )}

        {/* Editor Area */}

        <div

          className={`${showTemplatePreview ? 'w-3/4' : 'w-full'} min-h-[400px] flex-1 overflow-y-auto bg-white text-black relative`}

          onClick={() => editorRef.current?.focus()}

          ref={editorWrapperRef}

        >

          {/* Document Page Preview */}

          <div className="p-4">

            {/* Simulate page layout based on template */}

            <div

              className="bg-white shadow-md mx-auto my-4 relative overflow-hidden"

              style={{

                width: currentTemplate.orientation === 'portrait' ? '8.27in' : '11.69in',

                height: currentTemplate.orientation === 'portrait' ? '11.69in' : '8.27in',

                padding: `${currentTemplate.margins.top} ${currentTemplate.margins.right} ${currentTemplate.margins.bottom} ${currentTemplate.margins.left}`,

              }}

            >

              {/* Header */}

              {currentTemplate.header && (

                <div

                  className="absolute top-0 left-0 right-0 px-4 py-2 text-center text-gray-500 text-sm border-b border-gray-200"

                  style={{ height: currentTemplate.header.height }}

                  dangerouslySetInnerHTML={{ __html: currentTemplate.header.content }}

                />

              )}

              {/* Content Area */}

              <div

                className="editor-content-area"

                style={{

                  marginTop: currentTemplate.header ? currentTemplate.header.height : '0',

                  marginBottom: currentTemplate.footer ? currentTemplate.footer.height : '0',

                }}

              >

                <Editor

                  ref={editorRef}

                  editorState={editorState}

                  onChange={setEditorState}

                  handleKeyCommand={handleKeyCommand}

                  keyBindingFn={keyBindingFn}

                  placeholder="Paste or type your report here..."

                  spellCheck={true}

                  customStyleMap={customStyleMap}

                />

              </div>

              {/* Footer */}

              {currentTemplate.footer && (

                <div

                  className="absolute bottom-0 left-0 right-0 px-4 py-2 text-center text-gray-500 text-sm border-t border-gray-200"

                  style={{ height: currentTemplate.footer.height }}

                  dangerouslySetInnerHTML={{ __html: currentTemplate.footer.content.replace('<span class="page-number"></span>', '1').replace('<span class="page-count"></span>', '1') }}

                />

              )}

            </div>

          </div>

          {/* Floating AI menu */}

          {showAIMenu && (

            <div

              className="absolute z-10 bg-white shadow-lg rounded-md border border-gray-300 p-2"

              style={{

                top: `${selectionPosition.top}px`,

                left: `${selectionPosition.left}px`,

                transform: "translateX(-50%)",

              }}

            >

              <Button

                size="sm"

                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"

                onClick={handleGenerateText}

                disabled={isGenerating}

              >

                <Sparkles className="h-3 w-3" />

                {isGenerating ? "Generating..." : "Regenerate with AI"}

              </Button>

            </div>

          )}

        </div>

      </div>

    </div>

  )

})

RichTextEditor.displayName = "RichTextEditor"

export default RichTextEditor

