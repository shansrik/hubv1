"use client"

import { useToast } from '@/components/ui/use-toast'
import { useEffect } from 'react'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  
  // Define type for window with toast
  interface WindowWithToast extends Window {
    __toast?: { toast: typeof toast }
  }
  
  // Make toast function globally accessible
  useEffect(() => {
    // Create global toast API
    ;(window as WindowWithToast).__toast = { toast }
    
    return () => {
      // Clean up on unmount
      delete (window as WindowWithToast).__toast
    }
  }, [toast])
  
  return <>{children}</>
}