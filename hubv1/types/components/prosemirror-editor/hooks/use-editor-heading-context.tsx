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

        // Find the most recent heading before the cursor
        let headingText = '';
        let mostRecentHeadingPos = -1;
        
        // Scan the document from start to cursor position to find all headings
        doc.nodesBetween(0, from, (node, pos) => {
          if (node.type.name === 'heading') {
            // Check if this heading is closer to the cursor than previously found ones
            if (pos > mostRecentHeadingPos && pos <= from) {
              headingText = node.textContent;
              mostRecentHeadingPos = pos;
            }
          }
          return true; // Continue traversal
        });

        // Update heading context if changed and not empty
        if (headingText && headingText !== headingContext) {
          setHeadingContext(headingText);
          console.log('Active heading context updated:', headingText);
        }
      } catch (error) {
        console.error('Error extracting heading context:', error);
      }
    };

    // Set up transaction handler to detect any document or selection changes
    const handleTransaction = () => {
      extractHeadingContext();
    };

    // Initial extraction
    extractHeadingContext();

    // Add transaction and focus handlers
    editor.on('transaction', handleTransaction);
    editor.on('focus', extractHeadingContext);
    editor.on('update', extractHeadingContext); // Also check on any editor update
    
    // Clean up
    return () => {
      editor.off('transaction', handleTransaction);
      editor.off('focus', extractHeadingContext);
      editor.off('update', extractHeadingContext);
    };
  }, [editor, headingContext]);

  return headingContext;
};