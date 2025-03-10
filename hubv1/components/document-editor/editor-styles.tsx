import React from 'react';

export interface EditorStylesProps {
  children: React.ReactNode;
  className?: string;
}

export const EditorStyles: React.FC<EditorStylesProps> = ({ 
  children,
  className = '',
}) => {
  return (
    <div className={`prosemirror-editor-wrapper ${className}`}>
      <style jsx>{`
        .prosemirror-editor-wrapper {
          position: relative;
          width: 100%;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror) {
          position: relative;
          word-wrap: break-word;
          white-space: pre-wrap;
          white-space: break-spaces;
          -webkit-font-variant-ligatures: none;
          font-variant-ligatures: none;
          font-feature-settings: "liga" 0;
          padding: 0.75rem;
          line-height: 1.5;
          outline: none;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror p) {
          margin: 0.75em 0;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror h1),
        .prosemirror-editor-wrapper :global(.ProseMirror h2),
        .prosemirror-editor-wrapper :global(.ProseMirror h3),
        .prosemirror-editor-wrapper :global(.ProseMirror h4),
        .prosemirror-editor-wrapper :global(.ProseMirror h5),
        .prosemirror-editor-wrapper :global(.ProseMirror h6) {
          margin: 1em 0 0.5em 0;
          font-weight: 600;
          line-height: 1.25;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror h1) {
          font-size: 1.75em;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror h2) {
          font-size: 1.5em;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror h3) {
          font-size: 1.25em;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror a) {
          color: #0366d6;
          text-decoration: none;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror a:hover) {
          text-decoration: underline;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror ul),
        .prosemirror-editor-wrapper :global(.ProseMirror ol) {
          padding-left: 2em;
          margin: 0.75em 0;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror blockquote) {
          border-left: 3px solid #eee;
          margin-left: 0;
          margin-right: 0;
          padding-left: 1em;
          color: #777;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror img) {
          max-width: 100%;
          height: auto;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror table) {
          border-collapse: collapse;
          margin: 1em 0;
          overflow: hidden;
        }
        
        .prosemirror-editor-wrapper :global(.ProseMirror td),
        .prosemirror-editor-wrapper :global(.ProseMirror th) {
          border: 1px solid #ddd;
          padding: 0.5em;
          vertical-align: top;
        }
      `}</style>
      {children}
    </div>
  );
};

export default EditorStyles;