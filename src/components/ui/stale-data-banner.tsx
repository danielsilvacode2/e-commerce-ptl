'use client'

import { RefreshCw } from 'lucide-react'

interface StaleDataBannerProps {
  savedAt?: number | null
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

/**
 * Aviso suave no padrão preto e branco exibido quando há dados em cache
 * enquanto a conexão com a API está indisponível.
 */
export default function StaleDataBanner({
  onRetry,
  retrying = false,
  className = '',
}: StaleDataBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#1a1a1a] px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300 transition-colors ${className}`}
    >
      <p className="leading-snug">
        Algumas informações podem estar desatualizadas no momento.
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-black dark:text-white transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white cursor-pointer"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${retrying ? 'animate-spin motion-reduce:animate-none' : ''}`}
            aria-hidden="true"
          />
          <span>{retrying ? 'Atualizando...' : 'Atualizar'}</span>
        </button>
      )}
    </div>
  )
}
