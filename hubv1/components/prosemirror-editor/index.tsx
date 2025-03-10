'use client'

import { CoreEditor } from './core-editor'
import { ProseMirrorEditorProps } from './types'

/**
 * Main export for the ProseMirror editor
 * This is the component that should be used by other parts of the application
 */
export default function ProseMirrorEditor(props: ProseMirrorEditorProps) {
  return <CoreEditor {...props} />
}

// Re-export types for consumers
export * from './types'