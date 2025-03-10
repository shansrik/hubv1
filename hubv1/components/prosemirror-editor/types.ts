import { Editor } from '@tiptap/react'

/**
 * Core editor component props
 */
export interface ProseMirrorEditorProps {
  initialContent?: string
  onSave?: (content: string) => void
  onCancel?: () => void
  alwaysEditable?: boolean
  selectedPhotoId?: string
  onGenerateText?: (selectedText: string, customPrompt?: string) => Promise<string | null>
  onHeadingChange?: (headingContext: string) => void
}

/**
 * Editor menu component props
 */
export interface EditorMenuProps {
  editor: Editor | null
}

/**
 * Bubble menu component props
 */
export interface BubbleMenuProps {
  editor: Editor
  selectedPhotoId?: string
  onGenerateText?: (selectedText: string, customPrompt?: string) => Promise<string | null>
}

/**
 * Floating menu component props
 */
export interface FloatingMenuProps {
  editor: Editor
  showFloatingMenu: boolean
}

/**
 * Format menu component props
 */
export interface FormatMenuProps {
  editor: Editor
}

/**
 * AI Enhancement types
 */
export type EnhancementPromptType = 
  | 'follow-up'
  | 'professional'
  | 'concise'
  | 'expand'
  | 'grammar'
  | 'custom'

export interface SelectedPhotoData {
  id: string
  path: string
  name: string
  description: string
}

/**
 * Hook return types
 */
export interface UseEditorSaveReturn {
  saveContent: () => void
  lastSavedAt: Date | null
}

export interface UseEditorKeyboardReturn {
  setupKeyboardHandlers: () => void
}