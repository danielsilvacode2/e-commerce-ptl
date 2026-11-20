'use client'

import { JSX, useEffect, useRef, useState } from 'react'
import { ProductResponse } from '@/src/actions/product/read_all_request'
import CreateCart from '@/src/actions/cart/create_cart'
import ReadCart, { CartResponse } from '@/src/actions/cart/read_all'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Plus, X, Check, ShoppingBag } from 'lucide-react'

const ADD_TO_CART_DELAY_MS = 3000
const WARNING_DELAY_MS = 3500

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

interface ArticleHomeProps {
  listProducts: ProductResponse[]
  PlaceholderIcon: () => JSX.Element
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onCartChange?: () => void
  cart?: CartResponse | null
}

export default function ArticleHome({
  listProducts,
  PlaceholderIcon,
  loading,
  error,
  page,
  totalPages,
  onPageChange,
  onCartChange,
  cart: initialCart,
}: ArticleHomeProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartResponse | null>(initialCart ?? null)

  useEffect(() => {
    setCart(initialCart ?? null)
  }, [initialCart])

  const [pendingProduct, setPendingProduct] = useState<ProductResponse | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [warningProduct, setWarningProduct] = useState<ProductResponse | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    }
  }, [])

  function triggerWarning(produto: ProductResponse) {
    setWarningProduct(produto)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    warningTimerRef.current = setTimeout(() => {
      setWarningProduct(null)
      warningTimerRef.current = null
    }, WARNING_DELAY_MS)
  }

  function handleDismissWarning() {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
    setWarningProduct(null)
  }

  useEffect(() => {
    if (!pendingProduct) return
    const product = pendingProduct

    const timer = setTimeout(async () => {
      setIsSaving(true)
      try {
        await CreateCart({ product_id: product.id, quantity: 1 })
        onCartChange?.()
        router.refresh()
      } catch (err) {
        console.error('Erro ao adicionar produto no carrinho:', err)
        setErrorMessage('Não foi possível adicionar o produto.')
        setTimeout(() => setErrorMessage(null), 3000)
      } finally {
        setIsSaving(false)
        setPendingProduct(null)
      }
    }, ADD_TO_CART_DELAY_MS)

    return () => clearTimeout(timer)
  }, [pendingProduct, onCartChange, router])

  async function handleQueueAdd(produto: ProductResponse) {
    if (produto.quantity <= 0 || pendingProduct !== null || isSaving) return
    setErrorMessage(null)
    handleDismissWarning()

    if (cart?.list?.some((item) => item.product_id === produto.id)) {
      triggerWarning(produto)
      return
    }

    try {
      const freshCart = await ReadCart()
      setCart(freshCart)
      if (freshCart?.list?.some((item) => item.product_id === produto.id)) {
        triggerWarning(produto)
        return
      }
    } catch {
      // continua para adicionar
    }

    setPendingProduct(produto)
  }

  function handleCancelAdd() {
    if (isSaving) return
    setPendingProduct(null)
  }

  const newArrivals = listProducts.slice(0, 4)
  const topSelling = listProducts.length > 4 ? listProducts.slice(4, 8) : listProducts

  const renderProductCard = (p: ProductResponse) => {
    const isPending = pendingProduct?.id === p.id
    const isBusy = pendingProduct !== null || isSaving
    const isUnavailable = p.quantity <= 0
    const inCart = cart?.list?.some((item) => item.product_id === p.id)

    return (
      <div key={p.id} className="group flex flex-col">
        {/* Container da imagem com fundo branco constante */}
        <div className="relative aspect-square w-full rounded-2xl bg-white flex items-center justify-center p-6 overflow-hidden transition-all duration-300 group-hover:shadow-md border border-black/10 dark:border-white/10 shadow-xs">
          {p.quantity <= 3 && p.quantity > 0 && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full z-10">
              Restam {p.quantity}
            </span>
          )}

          {p.image ? (
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              className={`h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105 ${
                isUnavailable ? 'opacity-40 grayscale' : ''
              }`}
            />
          ) : (
            <PlaceholderIcon />
          )}

          {/* Quick Add CTA pill on hover */}
          <div className="absolute inset-x-4 bottom-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <button
              type="button"
              disabled={isUnavailable || (isBusy && !isPending)}
              onClick={() => handleQueueAdd(p)}
              className={`w-full py-3 px-4 rounded-full font-semibold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all ${
                isUnavailable
                  ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed'
                  : isPending
                  ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black'
                  : inCart
                  ? 'bg-black text-white dark:bg-white dark:text-black hover:opacity-85'
                  : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-85 active:scale-95'
              }`}
            >
              {isUnavailable ? (
                'Indisponível'
              ) : isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adicionando...</span>
                </>
              ) : inCart ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>No Carrinho</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informações do Produto (Tipografia e Preço) */}
        <div className="mt-4 flex flex-col flex-1">
          <h3 className="font-display font-bold text-base text-black dark:text-white uppercase tracking-tight line-clamp-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            {p.name}
          </h3>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-sans font-bold text-lg sm:text-xl text-black dark:text-white">
              R$ {p.price}
            </span>
          </div>

          {/* Mobile direct button */}
          <button
            type="button"
            disabled={isUnavailable || (isBusy && !isPending)}
            onClick={() => handleQueueAdd(p)}
            className="mt-3 flex sm:hidden w-full items-center justify-center gap-1.5 py-2.5 rounded-full border border-black/15 dark:border-white/15 bg-white dark:bg-[#1a1a1a] text-black dark:text-white font-semibold text-xs uppercase"
          >
            {isUnavailable ? 'Esgotado' : isPending ? 'Adicionando...' : inCart ? 'No Carrinho' : '+ Adicionar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div id="produtos" className="bg-white dark:bg-[#121212] text-black dark:text-white py-16 sm:py-20 transition-colors">
      
      {/* SEÇÃO 1: NOVIDADES (NEW ARRIVALS) */}
      <section id="novidades" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-black dark:text-white">
            NOVIDADES
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            As últimas tendências diretamente das passarelas para o seu closet
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col">
                <div className="aspect-square w-full rounded-2xl bg-[#F2F0F1] dark:bg-[#1f1f1f]" />
                <div className="mt-4 h-4 w-3/4 rounded bg-[#F2F0F1] dark:bg-[#1f1f1f]" />
                <div className="mt-2 h-5 w-1/4 rounded bg-[#F2F0F1] dark:bg-[#1f1f1f]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 rounded-3xl bg-[#F2F0F1] dark:bg-[#1a1a1a] p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-black dark:text-white">
              Não foi possível carregar os produtos. Tente novamente mais tarde.
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
                className="inline-flex items-center justify-center rounded-full border border-black/15 dark:border-white/15 bg-white dark:bg-[#1a1a1a] px-10 py-3.5 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] transition-all"
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

      {/* SEÇÃO 2: MAIS VENDIDOS (TOP SELLING) */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col">
                <div className="aspect-square w-full rounded-2xl bg-[#F2F0F1] dark:bg-[#1f1f1f]" />
                <div className="mt-4 h-4 w-3/4 rounded bg-[#F2F0F1] dark:bg-[#1f1f1f]" />
                <div className="mt-2 h-5 w-1/4 rounded bg-[#F2F0F1] dark:bg-[#1f1f1f]" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topSelling.map(renderProductCard)}
            </div>

            {/* Paginação Estilizada */}
            {totalPages > 1 && (
              <nav aria-label="Paginação" className="mt-14 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(page - 1)}
                  disabled={loading || page <= 1}
                  className="px-4 py-2 rounded-full border border-black/15 dark:border-white/15 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Anterior
                </button>

                {getPageNumbers(page, totalPages).map((n, idx) =>
                  n === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 text-neutral-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onPageChange(n)}
                      className={`h-9 w-9 rounded-full text-xs font-semibold transition-all ${
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
                  className="px-4 py-2 rounded-full border border-black/15 dark:border-white/15 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      {/* Floating Pending Cart Toast */}
      {pendingProduct && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex w-[calc(100%-3rem)] max-w-sm flex-col rounded-2xl bg-black dark:bg-[#1a1a1a] text-white p-4 shadow-2xl border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden p-1 shrink-0">
              {pendingProduct.image ? (
                <img
                  src={pendingProduct.image}
                  alt={pendingProduct.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <ShoppingBag className="h-5 w-5 text-white/50" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {isSaving ? 'Gravando no carrinho...' : 'Adicionando...'}
              </span>
              <h4 className="truncate font-display text-sm font-bold uppercase text-white">
                {pendingProduct.name}
              </h4>
              <p className="text-xs text-neutral-300 font-sans">
                R$ {pendingProduct.price}
              </p>
            </div>

            {!isSaving && (
              <button
                type="button"
                onClick={handleCancelAdd}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                aria-label="Desfazer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 h-1 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{
                animation: `cart-progress ${ADD_TO_CART_DELAY_MS}ms linear forwards`,
              }}
            />
          </div>
        </div>
      )}

      {/* Warning Item Already In Cart Toast */}
      {warningProduct && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 right-6 z-50 flex w-[calc(100%-3rem)] max-w-sm items-center gap-3 rounded-2xl bg-black dark:bg-[#1a1a1a] text-white p-4 shadow-2xl border border-white/10"
        >
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wide">Já está no carrinho</h4>
            <p className="truncate text-xs text-neutral-400">{warningProduct.name}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/carrinho')}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black uppercase tracking-wider hover:bg-neutral-200"
          >
            Ver
          </button>
          <button
            type="button"
            onClick={handleDismissWarning}
            className="text-neutral-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
