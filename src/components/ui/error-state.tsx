'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { ErrorStateVariant } from '@/src/lib/api-error'

interface ErrorCopy {
  code: string
  title: string
  description: string
}

const VARIANT_COPY: Record<ErrorStateVariant, ErrorCopy> = {
  'api-down': {
    code: 'INSTABILIDADE TEMPORÁRIA',
    title: 'Nosso sistema está descansando um instante',
    description:
      'Não conseguimos falar com a loja agora. Aguarde alguns segundos e tente novamente.',
  },
  offline: {
    code: 'SEM CONEXÃO',
    title: 'Você parece estar sem internet',
    description:
      'Verifique sua conexão Wi-Fi ou dados móveis e toque em tentar novamente assim que voltar.',
  },
  'not-found': {
    code: 'PÁGINA 404',
    title: 'Não encontramos o que você procurava',
    description:
      'Esse endereço pode ter mudado de lugar ou não está mais disponível no catálogo.',
  },
  generic: {
    code: 'ALGO SAIU DO PREVISTO',
    title: 'Não foi possível concluir esta ação',
    description:
      'Aconteceu um imprevisto por aqui. Você pode tentar novamente agora mesmo.',
  },
}

/**
 * Ilustrações editoriais leves e originais em traço fino alinhadas à identidade NERO.
 */
function ErrorIllustration({ variant }: { variant: ErrorStateVariant }) {
  if (variant === 'offline') {
    return (
      <svg
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden="true"
        className="h-16 w-16 sm:h-20 sm:w-20 text-black dark:text-white"
      >
        <circle cx="48" cy="48" r="44" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" />
        <path
          d="M24 44C30.8 37.6 39 34.4 48 34.4C57 34.4 65.2 37.6 72 44"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M33 54C37.2 50 42.3 48 48 48C53.7 48 58.8 50 63 54"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="48" cy="64" r="3" fill="currentColor" />
        <path
          d="M26 70L70 26"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (variant === 'api-down') {
    return (
      <svg
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden="true"
        className="h-16 w-16 sm:h-20 sm:w-20 text-black dark:text-white"
      >
        <circle cx="48" cy="48" r="44" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" />
        <rect
          x="24"
          y="27"
          width="48"
          height="16"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="24"
          y="53"
          width="48"
          height="16"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <circle cx="33" cy="35" r="2.2" fill="currentColor" />
        <path d="M42 35H62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M44 58L52 64M52 58L44 64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (variant === 'not-found') {
    return (
      <svg
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden="true"
        className="h-16 w-16 sm:h-20 sm:w-20 text-black dark:text-white"
      >
        <circle cx="48" cy="48" r="44" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" />
        <path
          d="M32 34L48 25L64 34V54L48 63L32 54V34Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M32 34L48 43L64 34" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M48 43V63" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="67" cy="65" r="9" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2" />
        <path d="M67 61V65.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="67" cy="69" r="1.2" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      className="h-16 w-16 sm:h-20 sm:w-20 text-black dark:text-white"
    >
      <circle cx="48" cy="48" r="44" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" />
      <path
        d="M48 26L70 65H26L48 26Z"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <path d="M48 42V53" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="48" cy="59" r="1.8" fill="currentColor" />
    </svg>
  )
}

export interface ErrorStateProps {
  variant?: ErrorStateVariant
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  retrying?: boolean
  autoFocusRetry?: boolean
  secondaryHref?: string
  secondaryLabel?: string
  compact?: boolean
  className?: string
}

export default function ErrorState({
  variant = 'generic',
  title,
  description,
  onRetry,
  retryLabel = 'Tentar novamente',
  retrying = false,
  autoFocusRetry = false,
  secondaryHref,
  secondaryLabel = 'Voltar ao início',
  compact = false,
  className = '',
}: ErrorStateProps) {
  const retryButtonRef = useRef<HTMLButtonElement>(null)
  const copy = VARIANT_COPY[variant]

  useEffect(() => {
    if (autoFocusRetry && onRetry && retryButtonRef.current) {
      retryButtonRef.current.focus()
    }
  }, [autoFocusRetry, onRetry])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`w-full rounded-3xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#181818] text-center transition-colors ${
        compact ? 'px-5 py-8 sm:px-8 sm:py-10' : 'px-6 py-12 sm:px-10 sm:py-16'
      } ${className}`}
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        <ErrorIllustration variant={variant} />

        <span className="mt-5 inline-flex items-center rounded-full border border-black/10 dark:border-white/15 bg-white dark:bg-[#121212] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-700 dark:text-neutral-300">
          {copy.code}
        </span>

        <h2
          className={`mt-4 font-display font-extrabold uppercase tracking-tight text-black dark:text-white ${
            compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
          }`}
        >
          {title ?? copy.title}
        </h2>

        <p className="mt-2.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {description ?? copy.description}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              ref={retryButtonRef}
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black dark:bg-white px-6 text-xs font-semibold uppercase tracking-wider text-white dark:text-black transition-[transform,opacity] duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white cursor-pointer motion-reduce:transition-none"
            >
              <RefreshCw
                className={`h-4 w-4 ${retrying ? 'animate-spin motion-reduce:animate-none' : ''}`}
                aria-hidden="true"
              />
              <span>{retrying ? 'Tentando...' : retryLabel}</span>
            </button>
          )}

          {secondaryHref && (
            <Link
              href={secondaryHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-6 text-xs font-semibold uppercase tracking-wider text-black dark:text-white transition-colors hover:bg-neutral-100 dark:hover:bg-[#222222] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{secondaryLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
