import { useEffect, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { UseEditorKeyboardReturn } from '../types'

/**
 * Hook for handling editor keyboard shortcuts
 */
export function useEditorKeyboard(
  editor: Editor | null,
  onSave?: () => void,
  onCancel?: () => void
): UseEditorKeyboardReturn {
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Save on Ctrl+S or Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      if (onSave) onSave()
    }
    
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault()
      if (onCancel) onCancel()
    }
  }, [onSave, onCancel])
  
  // Set up keyboard handlers on mount
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    setupKeyboardHandlers: () => {
      // This is just a stub now since we set up the handlers in the useEffect above
      // but we keep the function for API compatibility
    }
  }
}