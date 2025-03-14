import React from 'react'
import { 
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { FormatMenuProps } from '../types'

/**
 * Format toolbar component for the editor
 * This toolbar provides formatting options like paragraph, heading, lists
 */
export const FormatToolbar: React.FC<FormatMenuProps> = ({ editor }) => {
  if (!editor) {
    return null
  }

  const formatters = [
    {
      name: 'Text',
      icon: <Type className="h-4 w-4" />,
      isActive: () => false, // Don't show active state for paragraph
      onClick: () => editor.chain().focus().setParagraph().run(),
    },
    {
      name: 'Heading 1',
      icon: <Heading1 className="h-4 w-4" />,
      isActive: () => editor.isActive('heading', { level: 1 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      name: 'Heading 2',
      icon: <Heading2 className="h-4 w-4" />,
      isActive: () => editor.isActive('heading', { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      name: 'Heading 3',
      icon: <Heading3 className="h-4 w-4" />,
      isActive: () => editor.isActive('heading', { level: 3 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      name: 'Bullet List',
      icon: <List className="h-4 w-4" />,
      isActive: () => false, // Don't show active state for bullet list
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      name: 'Ordered List',
      icon: <ListOrdered className="h-4 w-4" />,
      isActive: () => false, // Don't show active state for ordered list
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ]

  return (
    <div className="format-toolbar border-t border-b border-gray-200 bg-white py-1 px-2 flex items-center space-x-1">
      {formatters.map((formatter) => (
        <Button
          key={formatter.name}
          variant={formatter.isActive() ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 text-xs"
          onMouseDown={(e) => {
            // Prevent the default behavior which would cause blur
            e.preventDefault();
            formatter.onClick();
          }}
          title={formatter.name}
        >
          <span className="flex items-center">
            {formatter.icon}
            <span className="ml-1">{formatter.name}</span>
          </span>
        </Button>
      ))}
    </div>
  )
}