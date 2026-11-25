'use client'

import { useEffect, useState } from 'react'
import { Package, X } from 'lucide-react'
import ProductReadService, { ProductResponse } from '@/src/actions/product/read'
import { formatCurrencyBRL, shouldDisplayStock } from '@/src/lib/product-rules'
import { classifyErrorVariant, ErrorStateVariant, logClientError } from '@/src/lib/api-error'
import { clientCache } from '@/src/lib/client-cache'
import { ProductDetailSkeleton } from '@/src/components/ui/skeletons'
import ErrorState from '@/src/components/ui/error-state'
import StaleDataBanner from '@/src/components/ui/stale-data-banner'

interface ProductDetailModalProps {
  productId: string | null
  initialProduct?: ProductResponse | null
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (product: ProductResponse) => void
}

interface FetchState {
  key: string
  product: ProductResponse | null
  errorVariant: ErrorStateVariant | null
  isStale: boolean
  cachedAt: number | null
}

export default function ProductDetailModal({
  productId,
  initialProduct,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [attempt, setAttempt] = useState(0)
  const [fetchState, setFetchState] = useState<FetchState | null>(null)

  const hasCompleteInitial = Boolean(
    initialProduct && initialProduct.id === productId && initialProduct.description
  )
  const requestKey = productId ? `${productId}|${attempt}` : ''

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', onKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || !productId) {
      return
    }

    // Se o produto inicial já tem descrição completa, grava em cache sem nova requisição
    if (hasCompleteInitial && initialProduct && attempt === 0) {
      clientCache.set(`product:${productId}`, initialProduct)
      return
    }

    const controller = new AbortController()
    const cacheKey = `product:${productId}`

    ProductReadService(productId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        if (!data) {
          setFetchState({
            key: requestKey,
            product: null,
            errorVariant: 'not-found',
            isStale: false,
            cachedAt: null,
          })
          return
        }
        clientCache.set(cacheKey, data)
        setFetchState({
          key: requestKey,
          product: data,
          errorVariant: null,
          isStale: false,
          cachedAt: null,
        })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        logClientError('ProductDetailModal', err, { productId })

        const cached = clientCache.get<ProductResponse>(cacheKey)
        if (cached) {
          setFetchState({
            key: requestKey,
            product: cached.data,
            errorVariant: null,
            isStale: true,
            cachedAt: cached.savedAt,
          })
          return
        }

        if (initialProduct && initialProduct.id === productId) {
          setFetchState({
            key: requestKey,
            product: initialProduct,
            errorVariant: null,
            isStale: true,
            cachedAt: null,
          })
          return
        }

        setFetchState({
          key: requestKey,
          product: null,
          errorVariant: classifyErrorVariant(err),
          isStale: false,
          cachedAt: null,
        })
      })

    return () => {
      controller.abort()
    }
  }, [isOpen, productId, hasCompleteInitial, initialProduct, attempt, requestKey])

  if (!isOpen) {
    return null
  }

  const needsFetch = Boolean(productId) && (!hasCompleteInitial || attempt > 0)
  const resolved = fetchState?.key === requestKey ? fetchState : null
  const loading = needsFetch && !resolved

  const activeProduct =
    resolved?.product ??
    (initialProduct && initialProduct.id === productId ? initialProduct : null)
  const errorVariant = resolved?.errorVariant ?? null
  const isStale = Boolean(resolved?.isStale)
  const cachedAt = resolved?.cachedAt ?? null

  const handleRetry = () => {
    setAttempt((v) => v + 1)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      <div
        className="nero-toast-enter relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8 shadow-2xl text-black dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white cursor-pointer"
          aria-label="Fechar modal de detalhes"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {loading ? (
          <ProductDetailSkeleton />
        ) : errorVariant && !activeProduct ? (
          <ErrorState
            variant={errorVariant}
            compact
            title={errorVariant === 'not-found' ? 'Peça não encontrada' : undefined}
            description={
              errorVariant === 'not-found'
                ? 'Esta peça pode ter saído do catálogo ou estar indisponível no momento.'
                : undefined
            }
            onRetry={productId ? handleRetry : undefined}
            autoFocusRetry
          />
        ) : !activeProduct ? (
          <ErrorState
            variant="not-found"
            compact
            title="Peça não encontrada"
            description="Os detalhes deste item não puderam ser localizados agora."
            onRetry={productId ? handleRetry : undefined}
            autoFocusRetry
          />
        ) : (
          <div className="space-y-5">
            {isStale && productId && (
              <StaleDataBanner
                savedAt={cachedAt}
                onRetry={handleRetry}
                retrying={loading}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Imagem do Produto */}
              <div className="aspect-square w-full rounded-2xl bg-white flex items-center justify-center p-6 border border-black/10 dark:border-white/10 shadow-xs overflow-hidden">
                {activeProduct.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeProduct.image}
                    alt={activeProduct.name}
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-400">
                    <Package className="h-16 w-16 stroke-1 mb-2" aria-hidden="true" />
                    <span className="text-xs uppercase tracking-wider font-medium">Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Informações detalhadas */}
              <div className="flex flex-col h-full justify-between">
                <div>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                    {activeProduct.sku ? `REF · ${activeProduct.sku}` : 'Ficha da Peça'}
                  </span>

                  <h2
                    id="product-detail-title"
                    className="font-display text-2xl font-extrabold uppercase tracking-tight text-black dark:text-white mt-1"
                  >
                    {activeProduct.name}
                  </h2>

                  {/* Preço formatado em BRL */}
                  <div className="mt-4">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                      Preço
                    </span>
                    <span className="font-sans font-extrabold text-2xl sm:text-3xl text-black dark:text-white">
                      {formatCurrencyBRL(activeProduct.price)}
                    </span>
                  </div>

                  {/* Quantidade em estoque - REGRA: Só exibe se quantidade < 50 */}
                  {shouldDisplayStock(activeProduct.quantity) && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 px-3.5 py-2 border border-black/5 dark:border-white/10">
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                        Estoque disponível:
                      </span>
                      <span className="font-bold text-xs text-black dark:text-white font-mono">
                        {activeProduct.quantity}{' '}
                        {activeProduct.quantity === 1 ? 'unidade' : 'unidades'}
                      </span>
                    </div>
                  )}

                  {/* Descrição */}
                  <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                      Descrição
                    </span>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed whitespace-pre-line">
                      {activeProduct.description?.trim()
                        ? activeProduct.description
                        : 'Sem descrição informada.'}
                    </p>
                  </div>
                </div>

                {/* Ação rápida de adicionar caso fornecida */}
                {onAddToCart && (
                  <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10">
                    <button
                      type="button"
                      disabled={activeProduct.quantity <= 0}
                      onClick={() => onAddToCart(activeProduct)}
                      className="w-full py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white cursor-pointer motion-reduce:transition-none"
                    >
                      {activeProduct.quantity <= 0 ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
