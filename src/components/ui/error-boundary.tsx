'use client'

import React from 'react'
import ErrorState from './error-state'
import { classifyErrorVariant, logClientError } from '@/src/lib/api-error'

interface ErrorBoundaryProps {
  children: React.ReactNode
  scope?: 'global' | 'section'
  sectionName?: string
  onReset?: () => void
  compact?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: unknown
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const context =
      this.props.scope === 'global'
        ? 'GlobalErrorBoundary'
        : `SectionErrorBoundary:${this.props.sectionName ?? 'unnamed'}`

    logClientError(context, error, {
      componentStack: info.componentStack,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const variant = classifyErrorVariant(this.state.error)
    const isGlobal = this.props.scope === 'global'

    if (isGlobal) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-[#121212] px-4 py-16 text-black dark:text-white">
          <div className="w-full max-w-xl">
            <ErrorState
              variant={variant}
              title="Algo interrompeu esta página"
              description="Não se preocupe — seus dados estão seguros. Tente recarregar a seção ou volte para o início."
              onRetry={this.handleReset}
              autoFocusRetry
              secondaryHref="/"
              secondaryLabel="Voltar ao início"
            />
          </div>
        </div>
      )
    }

    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <ErrorState
          variant={variant}
          compact={this.props.compact ?? true}
          title={
            this.props.sectionName
              ? `Não foi possível exibir ${this.props.sectionName}`
              : 'Não foi possível carregar esta seção'
          }
          description="O restante da loja continua funcionando normalmente. Você pode tentar carregar este bloco de novo."
          onRetry={this.handleReset}
          autoFocusRetry
        />
      </div>
    )
  }
}
