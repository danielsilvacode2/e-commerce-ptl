'use client'

import { useEffect, useRef, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus'

/**
 * Aviso discreto de conectividade baseado em navigator.onLine no padrão preto e branco.
 */
export default function NetworkStatusBanner() {
  const isOnline = useNetworkStatus()
  const wasOfflineRef = useRef(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true
      return
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false
      const showTimer = setTimeout(() => setShowReconnected(true), 0)
      const hideTimer = setTimeout(() => setShowReconnected(false), 3200)
      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [isOnline])

  if (isOnline && !showReconnected) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    >
      {!isOnline ? (
        <div className="nero-toast-enter pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-white/15 dark:border-black/15 bg-black dark:bg-white px-4 py-2.5 text-xs font-medium text-white dark:text-black shadow-xl">
          <WifiOff className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
          <span>Você está sem conexão. Algumas ações podem ficar indisponíveis.</span>
        </div>
      ) : (
        <div className="nero-toast-enter pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/15 dark:border-black/15 bg-black dark:bg-white px-4 py-2.5 text-xs font-medium text-white dark:text-black shadow-xl">
          <Wifi className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
          <span>Conexão restabelecida.</span>
        </div>
      )}
    </div>
  )
}
