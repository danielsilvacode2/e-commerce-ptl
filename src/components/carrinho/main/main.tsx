'use client'

import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { ImageOff, Minus, Plus, Trash2, Check, X, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CartResponse, ProductCartResponse } from '@/src/actions/cart/read_all'
import UpdateIsSelectCart from '@/src/actions/cart/update_is_select'
import UpdateAllIsSelectCart from '@/src/actions/cart/update_all_is_select'
import ProductReadService from '@/src/actions/product/read'
import CreateCart from '@/src/actions/cart/create_cart'
import RemoveProductCart from '@/src/actions/cart/delete_product_cart'
import DecreaseProductCart from '@/src/actions/cart/decrease_product_cart'
import CreateOrderService from '@/src/actions/order/create_order'
import { useSession } from '@/src/components/providers/session-provider'
import { guestCartService } from '@/src/services/guest-cart'
import { ErrorStateVariant, logClientError } from '@/src/lib/api-error'
import { emitCartOptimistic } from '@/src/lib/cart-events'
import { CartPageSkeleton } from '@/src/components/ui/skeletons'
import ErrorState from '@/src/components/ui/error-state'
import StaleDataBanner from '@/src/components/ui/stale-data-banner'

const REMOVE_DELAY = 2500

const formatPrice = (value: number | string) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/**
 * Barra regressiva animada exclusivamente via transform: scaleX (GPU-only).
 */
function CountdownBar({ duration }: { duration: number }) {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setStarted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <span
      aria-hidden="true"
      className="absolute bottom-0 left-0 h-1 w-full origin-left bg-black dark:bg-white ease-linear transition-transform motion-reduce:transition-none"
      style={{
        transform: started ? 'scaleX(1)' : 'scaleX(0)',
        transitionDuration: `${duration}ms`,
      }}
    />
  )
}

interface MainCartProps {
  list?: ProductCartResponse[]
  setList: Dispatch<SetStateAction<CartResponse | null>>
  loading?: boolean
  errorVariant?: ErrorStateVariant | null
  isStale?: boolean
  cachedAt?: number | null
  onRetry?: () => void
  onSyncCart?: () => void
  isGuest?: boolean
}

export default function MainCart({
  list = [],
  setList,
  loading = false,
  errorVariant = null,
  isStale = false,
  cachedAt = null,
  onRetry,
  onSyncCart,
  isGuest = false,
}: MainCartProps) {
  const router = useRouter()
  const { isAuthenticated } = useSession()
  const items = list
  const selectedItems = items.filter((i) => i.isSelect)
  const allSelected = items.length > 0 && selectedItems.length === items.length
  const subtotal = selectedItems.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0)
  const total = subtotal

  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [maxedIds, setMaxedIds] = useState<Set<string>>(new Set())
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [actionError, setActionError] = useState<string>('')
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Estado do checkout / CEP
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [zipCode, setZipCode] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  function markMaxed(id: string, maxed: boolean) {
    setMaxedIds((prev) => {
      const next = new Set(prev)
      if (maxed) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function setPending(id: string, pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev)
      if (pending) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function updateList(fn: (prev: ProductCartResponse[]) => ProductCartResponse[]) {
    setList((prev) => (prev ? { ...prev, list: fn(prev.list) } : prev))
  }

  async function handleToggleAll() {
    const next = !allSelected
    const previous = items
    setActionError('')

    updateList((prev) => prev.map((i) => ({ ...i, isSelect: next })))

    if (isGuest) {
      guestCartService.toggleSelectAll(next)
      return
    }

    try {
      await UpdateAllIsSelectCart({ select: next })
    } catch (err: unknown) {
      logClientError('MainCart:handleToggleAll', err)
      updateList(() => previous)
      setActionError('Não foi possível atualizar a seleção dos itens. Tente novamente.')
    }
  }

  async function handleToggleOne(item: ProductCartResponse) {
    const next = !item.isSelect
    setActionError('')
    updateList((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isSelect: next } : i))
    )

    if (isGuest) {
      guestCartService.toggleSelect(item.product_id, next)
      return
    }

    try {
      await UpdateIsSelectCart({ id: item.id, select: next })
    } catch (err: unknown) {
      logClientError('MainCart:handleToggleOne', err, { itemId: item.id })
      updateList((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isSelect: item.isSelect } : i))
      )
      setActionError('Não foi possível atualizar a seleção do item. Tente novamente.')
    }
  }

  async function handleIncrease(item: ProductCartResponse) {
    if (updatingId || maxedIds.has(item.id)) return
    setActionError('')
    setUpdatingId(item.id)

    try {
      // Usa o estoque já retornado em GET /cart para resposta instantânea sem chamar GET /products/:id
      let stock: number | null = typeof item.stock === 'number' ? item.stock : null

      if (stock === null) {
        try {
          const product = await ProductReadService(item.product_id)
          stock = Number(product?.quantity ?? 0)
        } catch (err: unknown) {
          logClientError('MainCart:checkStock', err, { productId: item.product_id })
          if (!isGuest) {
            setActionError('Não conseguimos confirmar o estoque deste item no momento.')
            return
          }
        }
      }

      if (stock !== null && item.quantity >= stock) {
        markMaxed(item.id, true)
        return
      }

      const nextQty = item.quantity + 1

      updateList((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: nextQty, ...(stock !== null ? { stock } : {}) }
            : i
        )
      )
      emitCartOptimistic({ delta: 1, animate: true })

      if (isGuest) {
        guestCartService.updateQuantity(item.product_id, nextQty)
        if (stock !== null && nextQty >= stock) markMaxed(item.id, true)
        return
      }

      try {
        await CreateCart({ product_id: item.product_id, quantity: nextQty })
        if (stock !== null && nextQty >= stock) markMaxed(item.id, true)
      } catch (err: unknown) {
        logClientError('MainCart:handleIncrease', err, { itemId: item.id })
        updateList((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, quantity: item.quantity } : i))
        )
        emitCartOptimistic({ delta: -1, animate: false })
        setActionError('Não foi possível aumentar a quantidade agora. Tente novamente.')
      }
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDecrease(item: ProductCartResponse) {
    if (item.quantity <= 1 || updatingId || pendingIds.has(item.id)) return
    setActionError('')
    setUpdatingId(item.id)

    updateList((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
    )
    emitCartOptimistic({ delta: -1, animate: true })

    if (isGuest) {
      guestCartService.updateQuantity(item.product_id, item.quantity - 1)
      markMaxed(item.id, false)
      setUpdatingId(null)
      return
    }

    try {
      await DecreaseProductCart({ id: item.id, quantity: 1 })
      markMaxed(item.id, false)
    } catch (err: unknown) {
      logClientError('MainCart:handleDecrease', err, { itemId: item.id })
      updateList((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: item.quantity } : i))
      )
      emitCartOptimistic({ delta: 1, animate: false })
      setActionError('Não foi possível diminuir a quantidade agora. Tente novamente.')
    } finally {
      setUpdatingId(null)
    }
  }

  function handleRemove(item: ProductCartResponse) {
    if (timersRef.current.has(item.id)) return
    setActionError('')

    const index = items.findIndex((i) => i.id === item.id)
    setPending(item.id, true)

    const timer = setTimeout(() => {
      timersRef.current.delete(item.id)
      void commitRemove(item, index)
    }, REMOVE_DELAY)

    timersRef.current.set(item.id, timer)
  }

  function handleCancelRemove(item: ProductCartResponse) {
    const timer = timersRef.current.get(item.id)
    if (timer) clearTimeout(timer)
    timersRef.current.delete(item.id)
    setPending(item.id, false)
  }

  async function commitRemove(item: ProductCartResponse, index: number) {
    updateList((prev) => prev.filter((i) => i.id !== item.id))
    emitCartOptimistic({ delta: -item.quantity, animate: true })
    setPending(item.id, false)
    markMaxed(item.id, false)

    if (isGuest) {
      guestCartService.removeItem(item.product_id)
      return
    }

    try {
      await RemoveProductCart(item.id)
      onSyncCart?.()
    } catch (err: unknown) {
      if (err instanceof Error && err.message === '204') {
        onSyncCart?.()
      } else {
        logClientError('MainCart:commitRemove', err, { itemId: item.id })
        emitCartOptimistic({ delta: item.quantity, animate: false })
        updateList((prev) => {
          if (prev.some((i) => i.id === item.id)) return prev
          const next = [...prev]
          next.splice(Math.min(index, next.length), 0, item)
          return next
        })
        setActionError('Não foi possível remover o item. Ele foi mantido na sua sacola.')
      }
    }
  }

  function handleOpenCheckout() {
    if (selectedItems.length === 0) return
    setCheckoutError('')

    if (!isAuthenticated || isGuest) {
      router.push('/login?redirect=/carrinho?checkout=true')
      return
    }

    setCheckoutModalOpen(true)
  }

  function formatZipCode(val: string) {
    const raw = val.replace(/\D/g, '').slice(0, 8)
    if (raw.length > 5) {
      return `${raw.slice(0, 5)}-${raw.slice(5)}`
    }
    return raw
  }

  async function handleConfirmOrder(e: React.FormEvent) {
    e.preventDefault()
    const cleanZip = zipCode.trim()

    if (!/^[0-9]{5}-?[0-9]{3}$/.test(cleanZip)) {
      setCheckoutError('Informe um CEP válido (ex.: 00000-000).')
      return
    }

    setSubmittingOrder(true)
    setCheckoutError('')

    try {
      const order = await CreateOrderService({ zip_code: cleanZip })
      onSyncCart?.()
      router.push(`/pedidos/${order.id}/pagamento`)
    } catch (err: unknown) {
      logClientError('MainCart:handleConfirmOrder', err)
      setCheckoutError('Não foi possível finalizar o pedido agora. Verifique sua conexão e tente novamente.')
    } finally {
      setSubmittingOrder(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-sans text-black dark:text-white">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6 uppercase tracking-wider font-medium">
        <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
          Início
        </Link>
        <span>/</span>
        <span className="text-black dark:text-white font-bold">Carrinho</span>
      </div>

      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight mb-8">
        SEU CARRINHO
      </h1>

      {isStale && !loading && (
        <StaleDataBanner savedAt={cachedAt} onRetry={onRetry} className="mb-6" />
      )}

      {actionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {actionError}
          </span>
          <button
            type="button"
            onClick={() => setActionError('')}
            aria-label="Fechar aviso"
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {loading && <CartPageSkeleton />}

      {!loading && errorVariant && items.length === 0 && (
        <ErrorState
          variant={errorVariant}
          onRetry={onRetry}
          autoFocusRetry
          secondaryHref="/"
          secondaryLabel="Voltar à loja"
        />
      )}

      {!loading && !errorVariant && items.length === 0 && (
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#181818] p-10 sm:p-12 text-center max-w-2xl mx-auto my-8">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
            Sua sacola está vazia
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            Adicione suas peças favoritas no catálogo para montar o pedido.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-8 py-3.5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Explorar Catálogo <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Lista de Produtos (Col 7) */}
          <div className="lg:col-span-7 rounded-3xl border border-black/10 dark:border-white/10 p-4 sm:p-6 bg-white dark:bg-[#181818] space-y-4">
            {/* Header da lista de itens */}
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={handleToggleAll}
                className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white rounded"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                    allSelected
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-[#121212] text-transparent'
                  }`}
                >
                  <Check size={14} strokeWidth={3} />
                </span>
                Marcar todos
              </button>
              <span className="text-xs text-neutral-500 font-sans">
                {selectedItems.length} de {items.length}{' '}
                {items.length === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            </div>

            {/* Itens */}
            <div className="divide-y divide-black/10 dark:divide-white/10">
              {items.map((item) => {
                const isPending = pendingIds.has(item.id)

                return (
                  <div
                    key={item.id}
                    className={`relative py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-opacity duration-200 ${
                      isPending ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleOne(item)}
                        aria-label={
                          item.isSelect
                            ? `Desmarcar ${item.name}`
                            : `Selecionar ${item.name}`
                        }
                        aria-pressed={item.isSelect}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white ${
                          item.isSelect
                            ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                            : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-[#121212] text-transparent'
                        }`}
                      >
                        <Check size={14} strokeWidth={3} aria-hidden="true" />
                      </button>

                      {/* Container Imagem com fundo branco constante */}
                      <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl bg-white border border-black/10 flex items-center justify-center p-2 overflow-hidden">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.name}
                            decoding="async"
                            className="h-full w-full object-contain mix-blend-multiply"
                          />
                        ) : (
                          <ImageOff size={24} className="text-neutral-400" aria-hidden="true" />
                        )}
                      </div>

                      {/* Título e Dados */}
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display font-bold text-sm sm:text-base uppercase tracking-tight truncate">
                          {item.name}
                        </h2>
                        <p className="text-xs text-neutral-500 font-sans mt-0.5">
                          SKU: {item.sku}
                        </p>
                        <span className="font-sans font-bold text-base sm:text-lg mt-2 block">
                          {formatPrice(Number(item.price) * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Ações: Quantidade e Deletar */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0">
                      <div className="flex items-center rounded-full bg-[#F2F0F1] dark:bg-[#242424] px-2 py-1">
                        <button
                          type="button"
                          onClick={() => handleDecrease(item)}
                          disabled={item.quantity <= 1 || updatingId === item.id || isPending}
                          aria-label={`Diminuir quantidade de ${item.name}`}
                          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <Minus size={14} aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-sans">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrease(item)}
                          disabled={updatingId === item.id || maxedIds.has(item.id) || isPending}
                          aria-label={`Aumentar quantidade de ${item.name}`}
                          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <Plus size={14} aria-hidden="true" />
                        </button>
                      </div>

                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => handleCancelRemove(item)}
                          className="flex h-9 px-3 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold items-center gap-1 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors cursor-pointer"
                        >
                          <X size={14} aria-hidden="true" /> Desfazer
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors cursor-pointer"
                          aria-label={`Remover ${item.name}`}
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    {isPending && <CountdownBar duration={REMOVE_DELAY} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Resumo do Pedido (Col 5) */}
          <aside className="lg:col-span-5 rounded-3xl border border-black/10 dark:border-white/10 p-6 sm:p-8 bg-white dark:bg-[#181818] space-y-6">
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
              RESUMO DO PEDIDO
            </h2>

            <div className="space-y-4 text-sm font-sans divide-y divide-black/5 dark:divide-white/10">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 pt-2">
                <span>Subtotal</span>
                <span className="font-bold text-black dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 pt-4">
                <span>Entrega</span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Grátis
                </span>
              </div>
              <div className="flex items-center justify-between text-base sm:text-lg font-bold pt-4">
                <span>Total</span>
                <span className="font-display font-extrabold text-xl sm:text-2xl">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Finalizar Compra CTA */}
            <button
              type="button"
              onClick={handleOpenCheckout}
              disabled={selectedItems.length === 0}
              className="w-full py-4 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-semibold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white motion-reduce:transition-none"
            >
              <span>Ir para o Checkout</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </aside>
        </div>
      )}

      {/* Modal de confirmação de pedido e CEP */}
      {checkoutModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-checkout-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        >
          <div className="nero-toast-enter w-full max-w-md rounded-3xl bg-white dark:bg-[#181818] p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <h2
                id="modal-checkout-title"
                className="font-display text-xl font-bold uppercase tracking-tight"
              >
                Finalizar Pedido
              </h2>
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                disabled={submittingOrder}
                aria-label="Fechar modal"
                className="p-1.5 rounded-full hover:bg-[#F2F0F1] dark:hover:bg-[#252525] transition-colors cursor-pointer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleConfirmOrder} className="mt-6 flex flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                  Resumo da compra:
                </p>
                <div className="mt-2 flex items-center justify-between rounded-2xl bg-[#F2F0F1] dark:bg-[#222222] p-4 text-xs">
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    {selectedItems.length}{' '}
                    {selectedItems.length === 1 ? 'item selecionado' : 'itens selecionados'}
                  </span>
                  <span className="font-display font-extrabold text-sm">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="zip-code-input"
                  className="block text-xs uppercase tracking-wider font-bold mb-1.5"
                >
                  CEP de Entrega
                </label>
                <input
                  id="zip-code-input"
                  type="text"
                  placeholder="00000-000"
                  maxLength={9}
                  value={zipCode}
                  onChange={(e) => setZipCode(formatZipCode(e.target.value))}
                  disabled={submittingOrder}
                  required
                  className="h-12 w-full rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-5 font-mono text-sm tracking-wider outline-none placeholder:text-neutral-400 focus:border-black dark:focus:border-white"
                />
                <span className="mt-1 block text-[11px] text-neutral-500 px-3">
                  Digite seu CEP no formato 00000-000
                </span>
              </div>

              {checkoutError && (
                <div
                  role="alert"
                  className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300 font-medium"
                >
                  {checkoutError}
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  disabled={submittingOrder}
                  className="h-11 px-5 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] dark:hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder || !zipCode.trim()}
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-6 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
                >
                  {submittingOrder ? (
                    <>
                      <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      Processando...
                    </>
                  ) : (
                    'Confirmar Pedido'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
