'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)

  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

function getServerSnapshot(): boolean {
  return true
}

/**
 * Retorna true quando o navegador está conectado à rede, sem risco de hydration mismatch.
 */
export function useNetworkStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
