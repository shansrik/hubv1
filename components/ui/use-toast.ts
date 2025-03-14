"use client"

import type React from "react"

import { useState } from "react"

// Time before toast disappears (in ms)
const TOAST_REMOVE_DELAY = 5000

type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}


let count = 0

function generateId() {
  return `${count++}`
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  function toast({ title, description, action, variant }: Omit<ToastProps, "id">) {
    const id = generateId()

    const newToast = {
      id,
      title,
      description,
      action,
      variant,
    }

    setToasts((prevToasts) => [...prevToasts, newToast])

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, TOAST_REMOVE_DELAY)

    return {
      id,
      dismiss: () => setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id)),
      update: (props: Omit<ToastProps, "id">) => {
        setToasts((prevToasts) => prevToasts.map((toast) => (toast.id === id ? { ...toast, ...props } : toast)))
      },
    }
  }

  return {
    toast,
    toasts,
    dismiss: (toastId?: string) => {
      if (toastId) {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId))
      } else {
        setToasts([])
      }
    },
  }
}

