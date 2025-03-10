/**
 * Type definitions for document editor components
 */

export interface EditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  onCancel?: () => void;
  alwaysEditable?: boolean;
}

export interface AIEnhancementOptions {
  /** AI enhancement type */
  type: 'follow-up' | 'professional' | 'concise' | 'expand' | 'grammar' | 'custom';
  /** Custom prompt text (for custom enhancement type) */
  customPrompt?: string;
}

export interface SelectedPhoto {
  id: string;
  path: string;
  name: string;
  description: string;
}

export interface ToolbarProps {
  editor: any; // TipTap editor instance
  isGeneratingAI: boolean;
  onEnhanceWithAI: (options: AIEnhancementOptions) => void;
}

export interface AIEnhancementMenuProps {
  isGeneratingAI: boolean;
  onEnhanceWithAI: (options: AIEnhancementOptions) => void;
}

export interface EditorBlockProps {
  content: string;
  onContentChange: (content: string) => void;
  isEditable?: boolean;
}