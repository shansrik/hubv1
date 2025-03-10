import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';

/**
 * Custom hook to track the current heading context in the editor
 * @param editor The TipTap editor instance
 * @returns The current heading context as a string
 */
export const useEditorHeadingContext = (editor: Editor | null) => {
  const [headingContext, setHeadingContext] = useState<string>('');

  useEffect(() => {
    if (!editor) return;

    // Function to extract heading context from the current selection
    const extractHeadingContext = () => {
      if (!editor.isActive) return;

      try {
        // Get current position
        const { from } = editor.state.selection;
        const doc = editor.state.doc;

        // Find the heading node that contains this position
        let headingText = '';
        let resolvedPos = doc.resolve(from);
        let depth = resolvedPos.depth;

        // Walk up the document tree to find nearest heading
        for (let i = depth; i >= 0; i--) {
          const node = resolvedPos.node(i);
          if (node && node.type.name === 'heading') {
            headingText = node.textContent;
            break;
          }
        }

        // If no direct heading found, look for the previous heading in the document
        if (!headingText) {
          let currentPos = from;
          doc.nodesBetween(0, currentPos, (node, pos) => {
            if (node.type.name === 'heading') {
              headingText = node.textContent;
            }
            return true; // Continue traversal
          });
        }

        // Update heading context if changed
        if (headingText !== headingContext) {
          setHeadingContext(headingText);
        }
      } catch (error) {
        console.error('Error extracting heading context:', error);
      }
    };

    // Set up transaction handler to detect cursor movement
    const handleTransaction = () => {
      extractHeadingContext();
    };

    // Initial extraction
    extractHeadingContext();

    // Add transaction handler
    editor.on('transaction', handleTransaction);
    editor.on('focus', extractHeadingContext);
    
    // Clean up
    return () => {
      editor.off('transaction', handleTransaction);
      editor.off('focus', extractHeadingContext);
    };
  }, [editor, headingContext]);

  return headingContext;
};