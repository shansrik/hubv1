import React from 'react';
import { Button } from '../ui/button';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

interface BlockControlsProps {
  editorState: EditorState | null;
  editorView: EditorView | null;
  onAddImage?: () => void;
  onAddTable?: () => void;
  onAddHeading?: () => void;
  onAddList?: () => void;
}

export const BlockControls: React.FC<BlockControlsProps> = ({
  editorState,
  editorView,
  onAddImage,
  onAddTable,
  onAddHeading,
  onAddList,
}) => {
  if (!editorState || !editorView) {
    return null;
  }

  return (
    <div className="block-controls">
      <div className="block-controls-wrapper">
        {onAddHeading && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onAddHeading}
            title="Add Heading"
          >
            H
          </Button>
        )}
        
        {onAddList && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onAddList}
            title="Add List"
          >
            •
          </Button>
        )}
        
        {onAddImage && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onAddImage}
            title="Add Image"
          >
            🖼️
          </Button>
        )}
        
        {onAddTable && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onAddTable}
            title="Add Table"
          >
            📊
          </Button>
        )}
      </div>
    </div>
  );
};

export default BlockControls;