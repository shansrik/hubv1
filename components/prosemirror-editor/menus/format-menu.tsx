import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { FormatMenuProps } from '../types'

/**
 * Format menu component for the editor
 * This menu provides formatting options like paragraph, heading, lists
 */
export const FormatMenu: React.FC<FormatMenuProps> = ({ editor }) => {

  /**
   * Handle format menu button click
   * Creates a popup menu with various formatting options
   */
  const handleFormatMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Create unique ID for this editor's menu
    const editorId = editor.options.element.getAttribute('data-editor-id') || 
              Math.random().toString(36).substring(2, 9)
    
    // Ensure editor has ID attribute for future reference
    if (!editor.options.element.getAttribute('data-editor-id')) {
      editor.options.element.setAttribute('data-editor-id', editorId)
    }
    
    // Find or create menu for this editor
    let menu = document.getElementById(`format-menu-${editorId}`)
    
    if (!menu) {
      // Create menu if it doesn't exist yet
      menu = document.createElement('div')
      menu.id = `format-menu-${editorId}`
      menu.className = "absolute left-8 top-0 bg-white rounded-md shadow-lg border border-gray-200 p-2 z-50 format-menu-dropdown"
      menu.style.minWidth = "180px"
      menu.innerHTML = `
        <div class="flex flex-col space-y-1">
          <!-- Paragraph -->
          <button class="flex items-center justify-start rounded h-8 px-3 w-full text-left hover:bg-gray-100" data-action="paragraph">
            <span class="text-sm">Text</span>
          </button>
          
          <!-- Heading 1 -->
          <button class="flex items-center justify-start rounded h-8 px-3 w-full text-left hover:bg-gray-100" data-action="heading1">
            <span class="h-4 w-4 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/></svg>
            </span>
            <span class="text-lg font-bold">Heading 1</span>
          </button>
          
          <!-- Heading 2 -->
          <button class="flex items-center justify-start rounded h-8 px-3 w-full text-left hover:bg-gray-100" data-action="heading2">
            <span class="h-4 w-4 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/></svg>
            </span>
            <span class="text-md font-bold">Heading 2</span>
          </button>
          
          <!-- Heading 3 -->
          <button class="flex items-center justify-start rounded h-8 px-3 w-full text-left hover:bg-gray-100" data-action="heading3">
            <span class="h-4 w-4 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/></svg>
            </span>
            <span class="text-sm font-bold">Heading 3</span>
          </button>
          
          <div class="border-t border-gray-200 my-1"></div>
          
          <!-- Bullet List -->
          <button class="flex items-center justify-start rounded h-8 px-3 w-full text-left hover:bg-gray-100" data-action="bulletList">
            <span class="h-4 w-4 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </span>
            <span class="text-sm">Bullet List</span>
          </button>
          
          <!-- Ordered List -->
          <button class="flex items-center justify-start rounded h-8 px-3 w-full text-left hover:bg-gray-100" data-action="orderedList">
            <span class="h-4 w-4 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
            </span>
            <span class="text-sm">Ordered List</span>
          </button>
        </div>
      `
      
      // Apply the format when item is clicked
      menu.addEventListener('mousedown', (menuEvent) => {
        menuEvent.preventDefault()
        menuEvent.stopPropagation()
        
        // Get the action from data attribute
        const target = menuEvent.target as HTMLElement
        const button = target.closest('button')
        if (button) {
          const action = button.getAttribute('data-action')
          
          // Apply formatting based on action
          if (action === 'paragraph') {
            editor.chain().focus().setParagraph().run()
          } else if (action === 'heading1') {
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          } else if (action === 'heading2') {
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          } else if (action === 'heading3') {
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          } else if (action === 'bulletList') {
            editor.chain().focus().toggleBulletList().run()
          } else if (action === 'orderedList') {
            editor.chain().focus().toggleOrderedList().run()
          }
          
          // Hide menu
          menu!.classList.add('hidden')
        }
      })
      
      // Add menu to document body
      document.body.appendChild(menu)
    }
    
    // Position menu relative to button - must offset to align correctly
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    menu.style.position = 'fixed'
    menu.style.top = `${buttonRect.top}px`
    menu.style.left = `${buttonRect.left + 30}px`
    
    // Toggle menu visibility
    const isHidden = menu.classList.contains('hidden')
    
    // Hide all other menus first
    document.querySelectorAll('.format-menu-dropdown').forEach(el => {
      el.classList.add('hidden')
    })
    
    // Show this menu if it was hidden
    if (isHidden) {
      menu.classList.remove('hidden')
    }
  }

  return (
    <div className="format-menu-container">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
        onMouseDown={handleFormatMenuClick}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}