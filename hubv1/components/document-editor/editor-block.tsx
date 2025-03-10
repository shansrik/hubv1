import React from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Node } from 'prosemirror-model';
import { DocumentTypes } from './types';

interface EditorBlockProps {
  editorState: EditorState | null;
  editorView: EditorView | null;
  node?: Node;
  contentClassName?: string;
  readOnly?: boolean;
}

export const EditorBlock: React.FC<EditorBlockProps> = ({
  editorState,
  editorView,
  node,
  contentClassName,
  readOnly = false,
}) => {
  const editorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (editorRef.current && editorView && !readOnly) {
      // Mount editor to this block
      editorRef.current.appendChild(editorView.dom);
    }

    return () => {
      // Clean up on unmount
      if (editorView && editorView.dom.parentNode) {
        editorView.dom.parentNode.removeChild(editorView.dom);
      }
    };
  }, [editorView, readOnly]);

  return (
    <div className="editor-block">
      <div 
        ref={editorRef} 
        className={`editor-content ${contentClassName || ''}`}
      />
    </div>
  );
};

export default EditorBlock;