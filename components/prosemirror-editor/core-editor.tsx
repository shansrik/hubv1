import React, { useEffect } from 'react'
import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import { Plugin, PluginKey } from 'prosemirror-state'
import { DecorationSet } from 'prosemirror-view'
import { ProseMirrorEditorProps } from './types'
import { useEditorSave } from './hooks/use-editor-save'
import { useEditorKeyboard } from './hooks/use-editor-keyboard'
import { useEditorHeadingContext } from './hooks/use-editor-heading-context'
import { EditorBubbleMenu } from './menus/bubble-menu'
import { FormatMenu } from './menus/format-menu'

// Define a custom extension for temporary text highlighting
// Custom type for our extension
type HighlightPluginProps = {
  decorations: DecorationSet;
  timeout: NodeJS.Timeout | null;
}

// Create a custom extension for temporary text highlighting
// This implementation avoids the TypeScript errors with Tiptap types
const TemporaryHighlight = Extension.create({
  name: 'temporaryHighlight',
  
  addOptions() {
    return {
      highlightClass: 'ai-highlight-effect',
      duration: 2000, // Duration in milliseconds
    }
  },
  
  // Setup storage for our plugin
  addStorage() {
    return {
      decorations: DecorationSet.empty,
      timeout: null as NodeJS.Timeout | null,
    }
  },
  
  // Add the ProseMirror plugin to handle decorations
  addProseMirrorPlugins() {
    const pluginKey = new PluginKey<HighlightPluginProps>('temporaryHighlight')
    // Store a reference to our storage
    const storage = this.storage
    
    // Create the plugin
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return {
              decorations: DecorationSet.empty,
              timeout: null
            }
          },
          apply(tr, value) {
            return value
          }
        },
        props: {
          decorations() {
            return storage.decorations
          }
        }
      })
    ]
  }
})

/**
 * Core ProseMirror editor component
 * Manages the editor state and provides a clean interface
 */
export const CoreEditor: React.FC<ProseMirrorEditorProps> = ({ 
  initialContent = '<p>Start typing...</p>', 
  onSave,
  onCancel,
  alwaysEditable = false,
  selectedPhotoId,
  onGenerateText,
  onHeadingChange,
  onEditorReady
}) => {
  // State management
  
  // Initialize Tiptap editor with basic extensions and headings
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Highlight,
      TemporaryHighlight,
    ],
    content: initialContent,
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[50px] px-2 py-4 cursor-text mt-1',
        id: `editor-${Date.now()}`, // Add unique ID for menu targeting
      },
      handleClick() {
        // Important for click handling - helps prevent unwanted behaviors
        return false
      }
    },
    onFocus: () => {
      console.log("Editor focused")
    },
    onBlur: () => {
      console.log("Editor blurred")
      
      // Check the active element to see if it's in the format menu
      const activeElement = document.activeElement;
      if (activeElement && activeElement.closest('.format-menu-container')) {
        return
      }
      
      // For always editable mode, still retain focus capabilities
      // and ensure content is properly saved
      if (alwaysEditable) {
        // Only save content when needed, no UI changes
        requestAnimationFrame(() => {
          if (editor && editor.isEditable) {
            saveContent()
          }
        })
      }
    },
    editable: true, // Always start as editable
  })

  // Initialize editor save hook after editor is created
  const { lastSavedAt, saveContent } = useEditorSave(editor, onSave)
  
  // Set up keyboard handlers
  useEditorKeyboard(
    editor, 
    saveContent, 
    onCancel
  )
  
  // Add effect to ensure editor is fully initialized
  useEffect(() => {
    if (editor) {
      console.log("Editor initialized successfully")
      
      // Call onEditorReady callback if provided
      if (onEditorReady) {
        onEditorReady(editor);
      }
      
      // Make sure when we click inside any editor we properly focus it
      const editorElement = editor.options.element
      if (editorElement) {
        // Assign a unique ID if not already set
        if (!editorElement.getAttribute('data-editor-id')) {
          const editorId = Math.random().toString(36).substring(2, 9)
          editorElement.setAttribute('data-editor-id', editorId)
        }
        
        const handleClick = () => {
          if (!editor.isFocused) {
            editor.commands.focus()
          }
        }
        
        editorElement.addEventListener('click', handleClick)
        
        // Initialize with a higher z-index to ensure menu visibility
        if (editorElement instanceof HTMLElement) {
          editorElement.style.zIndex = '1'
        }
        
        return () => {
          editorElement.removeEventListener('click', handleClick)
        }
      }
    }
  }, [editor, onEditorReady])

  // Global document click handler for menu management
  useEffect(() => {
    // This single global handler manages all menus for all editors
    const handleDocumentClick = (e: MouseEvent) => {
      // Don't hide menus when clicking inside menu containers
      if ((e.target as Element)?.closest('.format-menu-container') || 
          (e.target as Element)?.closest('.format-menu-dropdown') ||
          (e.target as Element)?.closest('.ai-menu-container') ||
          (e.target as Element)?.closest('.ai-menu-dropdown')) {
        return
      }
      
      // Hide all menus
      document.querySelectorAll('.format-menu-dropdown, .ai-menu-dropdown').forEach(el => {
        el.classList.add('hidden')
      })
    }
    
    // Add global document click handler
    document.addEventListener('click', handleDocumentClick)
    
    return () => {
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [])
  
  // Keep editor editable and ensure it maintains focus state
  useEffect(() => {
    if (editor && alwaysEditable) {
      // Force editable state
      editor.setEditable(true)
      
      // Configure behavior for always-editable mode
      const handleClick = (e: Event) => {
        // Process only for this specific editor's element
        const editorElement = editor.options.element
        
        if (editorElement.contains(e.target as Node)) {
          // When clicking inside, make sure it's editable and focused
          if (!editor.isFocused) {
            editor.commands.focus('end')
          }
        }
      }
      
      // Add click handler to this specific editor's element
      if (editor.options.element) {
        editor.options.element.addEventListener('click', handleClick as EventListener)
        
        return () => {
          editor.options.element.removeEventListener('click', handleClick as EventListener)
        }
      }
    }
  }, [editor, alwaysEditable])
  
  // Track heading context and notify parent component when it changes
  const headingContext = useEditorHeadingContext(editor);
  
  // Pass heading context to parent component when it changes
  useEffect(() => {
    if (headingContext && onHeadingChange) {
      onHeadingChange(headingContext);
    }
  }, [headingContext, onHeadingChange]);

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
    <div className={`relative editor-container ${alwaysEditable ? 'always-editable' : ''}`}>
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
      
      {/* Editor content */}
      <div 
        className={`relative ${alwaysEditable ? 'always-editable-container' : ''}`} 
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.commands.focus('end')
          }
        }}
      >
        <div className="flex">
          {/* Left margin with menu */}
          <div className="w-10 flex-shrink-0 relative">
            <div className="absolute top-4 left-2">
              {/* Format menu */}
              <FormatMenu editor={editor} />
            </div>
          </div>
          
          {/* Editor content */}
          <div className="flex-grow">
            <EditorContent editor={editor} />
          </div>
        </div>
        
        {/* Bubble menu */}
        {editor && (
          <EditorBubbleMenu 
            editor={editor} 
            selectedPhotoId={selectedPhotoId}
            onGenerateText={onGenerateText}
          />
        )}
      </div>
    </div>
  )
}