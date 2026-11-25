'use client'

import { JSX, useCallback, useEffect, useRef, useState } from 'react'
import { ProductResponse } from '@/src/actions/product/read_all_request'
import CreateCart from '@/src/actions/cart/create_cart'
import { CartResponse, ProductCartResponse } from '@/src/actions/cart/read_all'
import { guestCartService } from '@/src/services/guest-cart'
import { useRouter } from 'next/navigation'
import { AlertCircle, Plus, X, Check, ShoppingBag } from 'lucide-react'
import ProductDetailModal from '@/src/components/products/product-detail-modal'
import { formatCurrencyBRL } from '@/src/lib/product-rules'
import { ErrorStateVariant, logClientError } from '@/src/lib/api-error'
import { emitCartOptimistic } from '@/src/lib/cart-events'
import { ProductGridSkeleton } from '@/src/components/ui/skeletons'
import ErrorState from '@/src/components/ui/error-state'
import StaleDataBanner from '@/src/components/ui/stale-data-banner'

const FEEDBACK_RESET_MS = 1350
const TOAST_AUTO_HIDE_MS = 3400

function getPageNumbers(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages - 1) pages.push('...')
  pages.push(totalPages)

  return pages
}

interface ToastFeedback {
  id: number
  kind: 'success' | 'warning' | 'error'
  title: string
  subtitle: string
  product?: ProductResponse
}

interface ArticleHomeProps {
  listProducts: ProductResponse[]
  PlaceholderIcon: () => JSX.Element
  loading: boolean
  errorVariant: ErrorStateVariant | null
  isStale?: boolean
  cachedAt?: number | null
  onRetry?: () => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onCartSynced?: () => void
  cart?: CartResponse | null
  isAuthenticated?: boolean
}

function applyOptimisticDelta(
  current: CartResponse | null,
  product: ProductResponse,
  delta: number
): CartResponse {
  const base: CartResponse = current ?? {
    id: 'optimistic-cart',
    user: { id: '', name: '', email: '', role: '' },
    list: [],
  }

  const existing = base.list.find((item) => item.product_id === product.id)

  if (existing) {
    const nextQty = existing.quantity + delta
    const nextList =
      nextQty <= 0
        ? base.list.filter((item) => item.product_id !== product.id)
        : base.list.map((item) =>
            item.product_id === product.id ? { ...item, quantity: nextQty } : item
          )
    return { ...base, list: nextList }
  }

  if (delta <= 0) {
    return base
  }

  const newItem: ProductCartResponse = {
    id: `optimistic-${product.id}`,
    product_id: product.id,
    isSelect: true,
    quantity: delta,
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: Number(product.price),
    image: product.image,
  }

  return { ...base, list: [...base.list, newItem] }
}

export default function ArticleHome({
  listProducts,
  PlaceholderIcon,
  loading,
  errorVariant,
  isStale = false,
  onRetry,
  page,
  totalPages,
  onPageChange,
  onCartSynced,
  cart: initialCart,
  isAuthenticated = false,
}: ArticleHomeProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartResponse | null>(initialCart ?? null)
  const cartRef = useRef<CartResponse | null>(initialCart ?? null)

  // Fila por produto para permitir cliques seguidos sem travar e sem race conditions
  const pendingQueueRef = useRef<Map<string, Promise<void>>>(new Map())
  const inFlightCountRef = useRef<number>(0)

  // Estado visual de confirmação suave no botão clicado (sem bloquear novos cliques)
  const [confirmedMap, setConfirmedMap] = useState<Record<string, number>>({})
  const confirmTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const [toast, setToast] = useState<ToastFeedback | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastSeqRef = useRef<number>(0)

  const [selectedProductForDetail, setSelectedProductForDetail] = useState<ProductResponse | null>(null)

  useEffect(() => {
    if (inFlightCountRef.current === 0) {
      cartRef.current = initialCart ?? null
      setCart(initialCart ?? null)
    }
  }, [initialCart])

  useEffect(() => {
    const confirmTimers = confirmTimersRef.current
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      confirmTimers.forEach((timer) => clearTimeout(timer))
      confirmTimers.clear()
    }
  }, [])

  const showToast = useCallback((next: Omit<ToastFeedback, 'id'>) => {
    const id = ++toastSeqRef.current
    setToast({ ...next, id })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr))
    }, TOAST_AUTO_HIDE_MS)
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setToast(null)
  }, [])

  const triggerButtonConfirmation = useCallback((productId: string) => {
    setConfirmedMap((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }))

    const existingTimer = confirmTimersRef.current.get(productId)
    if (existingTimer) clearTimeout(existingTimer)

    const timer = setTimeout(() => {
      setConfirmedMap((prev) => {
        if (!(productId in prev)) return prev
        const next = { ...prev }
        delete next[productId]
        return next
      })
      confirmTimersRef.current.delete(productId)
    }, FEEDBACK_RESET_MS)

    confirmTimersRef.current.set(productId, timer)
  }, [])

  const handleAddToCart = useCallback(
    (product: ProductResponse) => {
      if (product.quantity <= 0) return

      const currentQty =
        cartRef.current?.list?.find((item) => item.product_id === product.id)?.quantity ?? 0

      if (currentQty >= product.quantity) {
        showToast({
          kind: 'warning',
          title: 'Limite de estoque atingido',
          subtitle: `Você já adicionou todas as unidades disponíveis de ${product.name}.`,
          product,
        })
        return
      }

      const nextQty = currentQty + 1

      // 1. Atualização otimista imediata na interface e contador do header
      const optimisticCart = applyOptimisticDelta(cartRef.current, product, 1)
      cartRef.current = optimisticCart
      setCart(optimisticCart)
      emitCartOptimistic({ delta: 1, animate: true })
      triggerButtonConfirmation(product.id)

      showToast({
        kind: 'success',
        title: nextQty > 1 ? `Agora são ${nextQty} no carrinho` : 'Adicionado ao carrinho',
        subtitle: product.name,
        product,
      })

      // 2. Visitante: grava de forma síncrona no guestCartService
      if (!isAuthenticated) {
        try {
          guestCartService.addItem({
            productId: product.id,
            quantity: 1,
            name: product.name,
            sku: product.sku,
            description: product.description,
            price: Number(product.price),
            image: product.image,
          })
        } catch (err: unknown) {
          logClientError('AddToCart:guest', err, { productId: product.id })
          const reverted = applyOptimisticDelta(cartRef.current, product, -1)
          cartRef.current = reverted
          setCart(reverted)
          emitCartOptimistic({ delta: -1, animate: false })
          showToast({
            kind: 'error',
            title: 'Não foi possível adicionar',
            subtitle: `Desfizemos a adição de ${product.name}. Tente novamente.`,
            product,
          })
        }
        return
      }

      // 3. Usuário logado: sincroniza com a API em segundo plano sem travar cliques seguidos
      inFlightCountRef.current += 1
      const previousJob = pendingQueueRef.current.get(product.id) ?? Promise.resolve()

      const nextJob = previousJob
        .catch(() => {})
        .then(async () => {
          try {
            await CreateCart({ product_id: product.id, quantity: nextQty })
          } catch (err: unknown) {
            logClientError('AddToCart:api', err, { productId: product.id, quantity: nextQty })
            const reverted = applyOptimisticDelta(cartRef.current, product, -1)
            cartRef.current = reverted
            setCart(reverted)
            emitCartOptimistic({ delta: -1, animate: false })
            showToast({
              kind: 'error',
              title: 'Não foi possível salvar no carrinho',
              subtitle: `Desfizemos a adição de ${product.name}. Tente novamente.`,
              product,
            })
          } finally {
            inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1)
            if (inFlightCountRef.current === 0) {
              onCartSynced?.()
            }
          }
        })

      pendingQueueRef.current.set(product.id, nextJob)
    },
    [isAuthenticated, onCartSynced, showToast, triggerButtonConfirmation]
  )

  const newArrivals = listProducts.slice(0, 4)
  const topSelling = listProducts.length > 4 ? listProducts.slice(4, 8) : listProducts

  const renderProductCard = (p: ProductResponse) => {
    const isUnavailable = p.quantity <= 0
    const qtyInCart = cart?.list?.find((item) => item.product_id === p.id)?.quantity ?? 0
    const confirmKey = confirmedMap[p.id] ?? 0
    const justAdded = confirmKey > 0

    return (
      <article key={p.id} className="group flex flex-col text-left">
        {/* Container da imagem com fundo branco constante */}
        <div className="relative aspect-square w-full rounded-2xl bg-white flex items-center justify-center p-6 overflow-hidden transition-shadow duration-300 group-hover:shadow-md border border-black/10 dark:border-white/10 shadow-xs">
          {p.quantity <= 3 && p.quantity > 0 && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full z-10 pointer-events-none">
              Restam {p.quantity}
            </span>
          )}

          <button
            type="button"
            onClick={() => setSelectedProductForDetail(p)}
            aria-label={`Ver detalhes de ${p.name}`}
            className="flex h-full w-full items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black rounded-xl"
          >
            {p.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image}
                alt={p.name}
                loading="lazy"
                decoding="async"
                className={`h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none ${
                  isUnavailable ? 'opacity-40 grayscale' : ''
                }`}
              />
            ) : (
              <PlaceholderIcon />
            )}
          </button>

          {/* Quick Add CTA pill on hover / focus (GPU-only transform + opacity) */}
          <div className="hidden sm:block absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 transition-[transform,opacity] duration-300 ease-out z-10 motion-reduce:transition-none">
            <button
              key={justAdded ? `desk-added-${confirmKey}` : 'desk-idle'}
              type="button"
              disabled={isUnavailable}
              onClick={() => handleAddToCart(p)}
              aria-label={
                isUnavailable
                  ? `${p.name} indisponível`
                  : `Adicionar ${p.name} ao carrinho`
              }
              className={`w-full py-3 px-4 rounded-full font-semibold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-[transform,opacity] duration-300 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black cursor-pointer motion-reduce:transition-none ${
                justAdded ? 'nero-btn-confirm' : ''
              } ${
                isUnavailable
                  ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
                  : 'bg-black text-white hover:opacity-90'
              }`}
            >
              {isUnavailable ? (
                'Indisponível'
              ) : justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Adicionado</span>
                </>
              ) : qtyInCart > 0 ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>No Carrinho ({qtyInCart})</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Adicionar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informações do Produto */}
        <div className="mt-4 flex flex-col flex-1">
          <button
            type="button"
            onClick={() => setSelectedProductForDetail(p)}
            className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white rounded cursor-pointer"
          >
            <h3 className="font-display font-bold text-lg leading-6 text-black dark:text-white uppercase tracking-tight line-clamp-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
              {p.name}
            </h3>

            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-sans font-bold text-lg sm:text-xl leading-7 text-black dark:text-white">
                {formatCurrencyBRL(p.price)}
              </span>
            </div>
          </button>

          {/* Mobile direct button */}
          <button
            key={justAdded ? `mob-added-${confirmKey}` : 'mob-idle'}
            type="button"
            disabled={isUnavailable}
            onClick={() => handleAddToCart(p)}
            className={`mt-3 flex sm:hidden h-10 w-full items-center justify-center gap-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider transition-[transform,opacity] duration-300 active:scale-95 cursor-pointer motion-reduce:transition-none ${
              justAdded ? 'nero-btn-confirm' : ''
            } ${
              isUnavailable
                ? 'border-black/10 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : justAdded
                ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                : 'border-black/15 dark:border-white/15 bg-white dark:bg-[#1a1a1a] text-black dark:text-white'
            }`}
          >
            {isUnavailable
              ? 'Esgotado'
              : justAdded
              ? 'Adicionado ✓'
              : qtyInCart > 0
              ? `No Carrinho (${qtyInCart})`
              : '+ Adicionar'}
          </button>
        </div>
      </article>
    )
  }

  return (
    <div id="produtos" className="bg-white dark:bg-[#121212] text-black dark:text-white py-16 sm:py-20 transition-colors">
      {/* Aviso discreto em preto e branco quando exibindo cache */}
      {isStale && !loading && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-10">
          <StaleDataBanner onRetry={onRetry} />
        </div>
      )}

      {/* SEÇÃO 1: NOVIDADES */}
      <section id="novidades" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-black dark:text-white">
            NOVIDADES
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            As últimas tendências diretamente para o seu guarda-roupa
          </p>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} label="Carregando novidades..." />
        ) : errorVariant ? (
          <ErrorState variant={errorVariant} onRetry={onRetry} autoFocusRetry />
        ) : listProducts.length === 0 ? (
          <div className="rounded-3xl bg-[#F2F0F1] dark:bg-[#1a1a1a] p-10 text-center">
            <p className="font-display text-xl font-bold uppercase tracking-tight">
              Nenhum produto disponível no momento
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map(renderProductCard)}
            </div>

            <div className="mt-10 sm:mt-12 text-center">
              <a
                href="#destaques"
                className="inline-flex items-center justify-center rounded-full border border-black/15 dark:border-white/15 bg-white dark:bg-[#1a1a1a] px-10 py-3.5 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white"
              >
                Ver Mais Produtos
              </a>
            </div>
          </>
        )}
      </section>

      {/* Linha Divisória Sutil */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 my-16 sm:my-20">
        <div className="border-b border-black/10 dark:border-white/10" />
      </div>

      {/* SEÇÃO 2: MAIS VENDIDOS */}
      <section id="destaques" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-black dark:text-white">
            MAIS VENDIDOS
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            Os itens preferidos da nossa comunidade streetwear
          </p>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} label="Carregando mais vendidos..." />
        ) : errorVariant ? (
          <ErrorState variant={errorVariant} compact onRetry={onRetry} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topSelling.map(renderProductCard)}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Paginação" className="mt-14 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(page - 1)}
                  disabled={loading || page <= 1}
                  className="px-4 py-2 rounded-full border border-black/15 dark:border-white/15 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Anterior
                </button>

                {getPageNumbers(page, totalPages).map((n, idx) =>
                  n === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 text-neutral-400" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      aria-current={n === page ? 'page' : undefined}
                      onClick={() => onPageChange(n)}
                      className={`h-9 w-9 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        n === page
                          ? 'bg-black dark:bg-white text-white dark:text-black font-bold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-[#F2F0F1] dark:hover:bg-[#252525]'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => onPageChange(page + 1)}
                  disabled={loading || page >= totalPages}
                  className="px-4 py-2 rounded-full border border-black/15 dark:border-white/15 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      {/* Mini Toast suave de feedback no padrão preto e branco (transform + opacity) */}
      {toast && (
        <div
          key={toast.id}
          role={toast.kind === 'error' ? 'alert' : 'status'}
          aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}
          className="nero-toast-enter fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl bg-black dark:bg-[#1c1c1c] text-white shadow-2xl border border-white/15"
        >
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
              {toast.kind === 'success' ? (
                <ShoppingBag className="h-4 w-4 text-white" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-4 w-4 text-white" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide">{toast.title}</p>
              <p className="truncate text-xs text-neutral-300">{toast.subtitle}</p>
            </div>

            {toast.kind === 'error' && toast.product ? (
              <button
                type="button"
                onClick={() => handleAddToCart(toast.product!)}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-black hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Tentar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/carrinho')}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-black hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Ver
              </button>
            )}

            <button
              type="button"
              onClick={dismissToast}
              aria-label="Fechar aviso"
              className="text-neutral-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="h-0.5 w-full bg-white/15">
            <div className="nero-toast-progress h-full w-full bg-white" />
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Produto */}
      <ProductDetailModal
        productId={selectedProductForDetail?.id ?? null}
        initialProduct={selectedProductForDetail}
        isOpen={Boolean(selectedProductForDetail)}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={(p) => {
          setSelectedProductForDetail(null)
          handleAddToCart(p)
        }}
      />
    </div>
  )
}
