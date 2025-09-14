'use client'

import { useEffect, useState } from 'react'

type ViewType = 'list' | 'grid'

/**
 * Custom hook for managing view state in localStorage with synchronization across components
 * Uses storage events to keep all components in sync when view changes
 */
export const useViewStorage = (defaultView: ViewType = 'grid') => {
  const [view, setViewState] = useState<ViewType>(defaultView)

  // Load view from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('view') as ViewType | null
    if (savedView && (savedView === 'list' || savedView === 'grid')) {
      setViewState(savedView)
    }
  }, [])

  // Listen for storage events to sync across components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'view' && e.newValue) {
        const newView = e.newValue as ViewType
        if (newView === 'list' || newView === 'grid') {
          setViewState(newView)
        }
      }
    }

    // Listen for storage events from other windows/tabs
    window.addEventListener('storage', handleStorageChange)

    // Custom event for same-window synchronization
    const handleCustomStorageChange = (e: CustomEvent<{ key: string; value: string }>) => {
      if (e.detail.key === 'view') {
        const newView = e.detail.value as ViewType
        if (newView === 'list' || newView === 'grid') {
          setViewState(newView)
        }
      }
    }

    window.addEventListener('localStorage-change', handleCustomStorageChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorage-change', handleCustomStorageChange as EventListener)
    }
  }, [])

  // Function to update view with synchronization
  const setView = (newView: ViewType) => {
    setViewState(newView)
    localStorage.setItem('view', newView)

    // Dispatch custom event for same-window synchronization
    window.dispatchEvent(
      new CustomEvent('localStorage-change', {
        detail: { key: 'view', value: newView },
      }),
    )
  }

  return { view, setView }
}
