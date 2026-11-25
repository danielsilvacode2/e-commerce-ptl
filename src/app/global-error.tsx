'use client'

import { useEffect } from 'react'
import ErrorState from '@/src/components/ui/error-state'
import { classifyErrorVariant, logClientError } from '@/src/lib/api-error'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logClientError('NextGlobalError', error, { digest: error.digest })
  }, [error])

  const variant = classifyErrorVariant(error)

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white dark:bg-[#121212] text-black dark:text-white font-sans antialiased">
        <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-16">
          <ErrorState
            variant={variant}
            title="A loja precisou reiniciar"
            description="Encontramos um problema inesperado ao exibir a página. Tente novamente ou volte para o início."
            onRetry={reset}
            autoFocusRetry
            secondaryHref="/"
            secondaryLabel="Voltar ao início"
          />
        </main>
      </body>
    </html>
  )
}
