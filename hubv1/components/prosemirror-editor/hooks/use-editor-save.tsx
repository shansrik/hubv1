import { useState, useCallback, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { UseEditorSaveReturn } from '../types'

/**
 * Hook for handling editor content saving with debounce
 */
export function useEditorSave(
  editor: Editor | null,
  onSave?: (content: string) => void,
  debounceTime: number = 1500
): UseEditorSaveReturn {
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // Save content function
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
  
  // Set up autosave with debounce
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
      }, debounceTime)
    }
    
    // Add event listener
    editor.on('update', updateListener)
    
    // Clean up
    return () => {
      editor.off('update', updateListener)
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  }, [editor, saveContent, debounceTime])

  return {
    saveContent,
    lastSavedAt
  }
}