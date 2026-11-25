'use client'

import { useCallback, useEffect } from 'react'
import MainCart from '@/src/components/carrinho/main/main'
import { useSession } from '@/src/components/providers/session-provider'
import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'
import ErrorBoundary from '@/src/components/ui/error-boundary'

export default function CartPage() {
  const {
    authLoaded,
    isAuthenticated,
    cart,
    setCart,
    cartLoaded,
    cartErrorVariant,
    cartIsStale,
    cartCachedAt,
    refreshCart,
  } = useSession()

  // Revalida silenciosamente ao abrir o carrinho para obter estoque atualizado sem piscar skeleton
  useEffect(() => {
    if (authLoaded && isAuthenticated) {
      void refreshCart({ silent: true })
    }
  }, [authLoaded, isAuthenticated, refreshCart])

  const handleRetry = useCallback(() => {
    void refreshCart({ silent: false })
  }, [refreshCart])

  const loading = !authLoaded || (!cartLoaded && !cart)

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-black dark:text-white font-sans flex flex-col justify-between transition-colors">
      <div>
        <HeaderHome />
        <ErrorBoundary scope="section" sectionName="seu carrinho" onReset={handleRetry}>
          <MainCart
            list={cart?.list}
            setList={setCart}
            loading={loading}
            errorVariant={cartErrorVariant}
            isStale={cartIsStale}
            cachedAt={cartCachedAt}
            onRetry={handleRetry}
            onSyncCart={() => void refreshCart({ silent: true })}
            isGuest={authLoaded && !isAuthenticated}
          />
        </ErrorBoundary>
      </div>
      <FooterHome />
    </div>
  )
}
