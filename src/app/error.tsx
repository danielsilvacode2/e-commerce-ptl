'use client'

import { useEffect } from 'react'
import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'
import ErrorState from '@/src/components/ui/error-state'
import { classifyErrorVariant, logClientError } from '@/src/lib/api-error'

interface RouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    logClientError('NextRouteError', error, { digest: error.digest })
  }, [error])

  const variant = classifyErrorVariant(error)

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#121212] text-black dark:text-white font-sans transition-colors">
      <HeaderHome />
      <main className="flex-1 mx-auto flex w-full max-w-2xl items-center px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <ErrorState
          variant={variant}
          onRetry={reset}
          autoFocusRetry
          secondaryHref="/"
          secondaryLabel="Voltar ao início"
        />
      </main>
      <FooterHome />
    </div>
  )
}
