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
import { useSession } from '@/src/components/providers/session-provider'
import { guestCartService } from '@/src/services/guest-cart'
import { ApiError, ErrorStateVariant, logClientError } from '@/src/lib/api-error'
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
  sessionUnavailable?: boolean
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
  sessionUnavailable = false,
}: MainCartProps) {
  const router = useRouter()
  const { isAuthenticated } = useSession()
  const items = list
  const selectedItems = items.filter((i) => i.isSelect)
  const allSelected = items.length > 0 && selectedItems.length === items.length
  const subtotal = selectedItems.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0)
  const total = subtotal

  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [maxedIds, setMaxedIds] = useState<Set<string>>(new Set())
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [actionError, setActionError] = useState<string>('')

  const itemsRef = useRef<ProductCartResponse[]>(items)
  const isGuestRef = useRef<boolean>(isGuest)
  const onSyncCartRef = useRef<(() => void) | undefined>(onSyncCart)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pendingRemovalsRef = useRef<Map<string, { item: ProductCartResponse; index: number }>>(new Map())
  // Fila serializada por item para evitar perda de toques rápidos no mobile e race conditions entre +, - e remover
  const itemQueuesRef = useRef<Map<string, Promise<void>>>(new Map())
  const itemInFlightCountRef = useRef<Map<string, number>>(new Map())
  const activeMutationsRef = useRef<number>(0)
  const pendingSyncRef = useRef<boolean>(false)
  const autoCheckoutHandledRef = useRef(false)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    isGuestRef.current = isGuest
  }, [isGuest])

  useEffect(() => {
    onSyncCartRef.current = onSyncCart
  }, [onSyncCart])

  useEffect(() => {
    const timers = timersRef.current
    const pendingRemovals = pendingRemovalsRef.current
    return () => {
      // Se o usuário saiu da tela antes dos 2,5s do "Desfazer", confirma a remoção pendente em vez de descartá-la
      timers.forEach((timer, id) => {
        clearTimeout(timer)
        const pending = pendingRemovals.get(id)
        if (!pending) return
        if (isGuestRef.current) {
          guestCartService.removeItem(pending.item.product_id)
        } else {
          void RemoveProductCart(id, { keepalive: true }).catch(() => {})
        }
      })
      timers.clear()
      pendingRemovals.clear()
    }
  }, [])

  // Redireciona links legados /carrinho?checkout=true para a tela dedicada de checkout
  useEffect(() => {
    if (autoCheckoutHandledRef.current || loading || isGuest || !isAuthenticated || selectedItems.length === 0) {
      return
    }
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'true') {
      autoCheckoutHandledRef.current = true
      router.replace('/checkout')
    }
  }, [loading, isGuest, isAuthenticated, selectedItems.length, router])

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

  function flushSyncIfIdle() {
    if (activeMutationsRef.current === 0 && timersRef.current.size === 0 && pendingSyncRef.current) {
      pendingSyncRef.current = false
      onSyncCartRef.current?.()
    }
  }

  function scheduleSyncCart() {
    pendingSyncRef.current = true
    flushSyncIfIdle()
  }

  function beginItemMutation(id: string) {
    activeMutationsRef.current += 1
    const nextCount = (itemInFlightCountRef.current.get(id) ?? 0) + 1
    itemInFlightCountRef.current.set(id, nextCount)
    if (nextCount === 1) {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.add(id)
        return next
      })
    }
  }

  function endItemMutation(id: string) {
    const nextCount = Math.max(0, (itemInFlightCountRef.current.get(id) ?? 1) - 1)
    if (nextCount === 0) {
      itemInFlightCountRef.current.delete(id)
      setUpdatingIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } else {
      itemInFlightCountRef.current.set(id, nextCount)
    }

    activeMutationsRef.current = Math.max(0, activeMutationsRef.current - 1)
    flushSyncIfIdle()
  }

  function enqueueItemOp(id: string, task: () => Promise<void>) {
    beginItemMutation(id)
    const previous = itemQueuesRef.current.get(id) ?? Promise.resolve()
    const nextJob = previous
      .catch(() => {})
      .then(task)
      .finally(() => {
        if (itemQueuesRef.current.get(id) === nextJob) {
          itemQueuesRef.current.delete(id)
        }
        endItemMutation(id)
      })
    itemQueuesRef.current.set(id, nextJob)
  }

  function updateList(fn: (prev: ProductCartResponse[]) => ProductCartResponse[]) {
    setList((prev) => {
      if (!prev) return prev
      const nextList = fn(prev.list)
      itemsRef.current = nextList
      return { ...prev, list: nextList }
    })
  }

  function guardSessionAvailable(): boolean {
    if (!sessionUnavailable) return true
    setActionError('Sua conexão com a sessão está sendo restabelecida. Aguarde um instante e tente novamente.')
    onRetry?.()
    return false
  }

  function getMutationErrorMessage(err: unknown, fallback: string, syncMessage?: string): { message: string; shouldSync: boolean } {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        return { message: 'Sua sessão expirou. Faça login novamente.', shouldSync: false }
      }
      if (err.status === 403) {
        return {
          message: 'Não foi possível validar sua solicitação. Recarregue a página e tente novamente.',
          shouldSync: false,
        }
      }
      if (err.status === 404 || err.status === 422) {
        return {
          message: syncMessage ?? 'Seu carrinho foi atualizado com o servidor. Tente novamente.',
          shouldSync: true,
        }
      }
      if (err.kind === 'timeout' || err.kind === 'offline') {
        return {
          message: 'A conexão demorou para responder. Verifique sua internet e tente novamente.',
          shouldSync: true,
        }
      }
    }
    return { message: fallback, shouldSync: false }
  }

  async function handleToggleAll() {
    if (!guardSessionAvailable()) return
    const next = !allSelected
    const previous = itemsRef.current
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
      const { message, shouldSync } = getMutationErrorMessage(
        err,
        'Não foi possível atualizar a seleção dos itens. Tente novamente.'
      )
      if (shouldSync) scheduleSyncCart()
      setActionError(message)
    }
  }

  async function handleToggleOne(item: ProductCartResponse) {
    if (!guardSessionAvailable()) return
    const current = itemsRef.current.find((i) => i.id === item.id) ?? item
    const next = !current.isSelect
    setActionError('')
    updateList((prev) =>
      prev.map((i) => (i.id === current.id ? { ...i, isSelect: next } : i))
    )

    if (isGuest) {
      guestCartService.toggleSelect(current.product_id, next)
      return
    }

    try {
      await UpdateIsSelectCart({ id: current.id, select: next })
    } catch (err: unknown) {
      logClientError('MainCart:handleToggleOne', err, { itemId: current.id })
      updateList((prev) =>
        prev.map((i) => (i.id === current.id ? { ...i, isSelect: current.isSelect } : i))
      )
      const { message, shouldSync } = getMutationErrorMessage(
        err,
        'Não foi possível atualizar a seleção do item. Tente novamente.',
        'Seu carrinho foi atualizado. Tente selecionar o item novamente.'
      )
      if (shouldSync) scheduleSyncCart()
      setActionError(message)
    }
  }

  function handleIncrease(item: ProductCartResponse) {
    if (!guardSessionAvailable() || maxedIds.has(item.id) || pendingIds.has(item.id)) return
    setActionError('')

    const current = itemsRef.current.find((i) => i.id === item.id) ?? item
    const knownStock = typeof current.stock === 'number' ? current.stock : null

    if (knownStock !== null) {
      if (current.quantity >= knownStock) {
        markMaxed(current.id, true)
        return
      }

      const nextQty = current.quantity + 1
      updateList((prev) =>
        prev.map((i) =>
          i.id === current.id ? { ...i, quantity: nextQty, stock: knownStock } : i
        )
      )
      emitCartOptimistic({ delta: 1, animate: true })
      if (nextQty >= knownStock) markMaxed(current.id, true)

      if (isGuest) {
        guestCartService.updateQuantity(current.product_id, nextQty)
        return
      }

      enqueueItemOp(current.id, async () => {
        try {
          await CreateCart({ product_id: current.product_id, quantity: nextQty })
          pendingSyncRef.current = true
        } catch (err: unknown) {
          logClientError('MainCart:handleIncrease', err, { itemId: current.id })
          updateList((prev) =>
            prev.map((i) =>
              i.id === current.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
            )
          )
          emitCartOptimistic({ delta: -1, animate: false })
          markMaxed(current.id, false)
          const { message, shouldSync } = getMutationErrorMessage(
            err,
            'Não foi possível aumentar a quantidade agora. Tente novamente.'
          )
          if (shouldSync) pendingSyncRef.current = true
          setActionError(message)
        }
      })
      return
    }

    // Fallback quando o item ainda não tem estoque carregado
    enqueueItemOp(current.id, async () => {
      let stock: number | null = null
      try {
        const product = await ProductReadService(current.product_id)
        stock = Number(product?.quantity ?? 0)
      } catch (err: unknown) {
        logClientError('MainCart:checkStock', err, { productId: current.product_id })
        if (!isGuestRef.current) {
          setActionError('Não conseguimos confirmar o estoque deste item no momento.')
          return
        }
      }

      const latest = itemsRef.current.find((i) => i.id === current.id) ?? current
      if (stock !== null && latest.quantity >= stock) {
        markMaxed(current.id, true)
        return
      }

      const nextQty = latest.quantity + 1
      updateList((prev) =>
        prev.map((i) =>
          i.id === current.id
            ? { ...i, quantity: nextQty, ...(stock !== null ? { stock } : {}) }
            : i
        )
      )
      emitCartOptimistic({ delta: 1, animate: true })
      if (stock !== null && nextQty >= stock) markMaxed(current.id, true)

      if (isGuestRef.current) {
        guestCartService.updateQuantity(current.product_id, nextQty)
        return
      }

      try {
        await CreateCart({ product_id: current.product_id, quantity: nextQty })
        pendingSyncRef.current = true
      } catch (err: unknown) {
        logClientError('MainCart:handleIncrease', err, { itemId: current.id })
        updateList((prev) =>
          prev.map((i) =>
            i.id === current.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
          )
        )
        emitCartOptimistic({ delta: -1, animate: false })
        markMaxed(current.id, false)
        const { message, shouldSync } = getMutationErrorMessage(
          err,
          'Não foi possível aumentar a quantidade agora. Tente novamente.'
        )
        if (shouldSync) pendingSyncRef.current = true
        setActionError(message)
      }
    })
  }

  function handleDecrease(item: ProductCartResponse) {
    if (!guardSessionAvailable() || pendingIds.has(item.id)) return
    const current = itemsRef.current.find((i) => i.id === item.id) ?? item
    if (current.quantity <= 1) return

    setActionError('')
    const nextQty = current.quantity - 1

    updateList((prev) =>
      prev.map((i) => (i.id === current.id ? { ...i, quantity: nextQty } : i))
    )
    emitCartOptimistic({ delta: -1, animate: true })
    markMaxed(current.id, false)

    if (isGuest) {
      guestCartService.updateQuantity(current.product_id, nextQty)
      return
    }

    enqueueItemOp(current.id, async () => {
      try {
        await DecreaseProductCart({ id: current.id, quantity: 1 })
      } catch (err: unknown) {
        logClientError('MainCart:handleDecrease', err, { itemId: current.id })
        updateList((prev) =>
          prev.map((i) => (i.id === current.id ? { ...i, quantity: i.quantity + 1 } : i))
        )
        emitCartOptimistic({ delta: 1, animate: false })
        const { message, shouldSync } = getMutationErrorMessage(
          err,
          'Não foi possível diminuir a quantidade agora. Tente novamente.'
        )
        if (shouldSync) pendingSyncRef.current = true
        setActionError(message)
      }
    })
  }

  function handleRemove(item: ProductCartResponse) {
    if (!guardSessionAvailable() || timersRef.current.has(item.id)) return
    setActionError('')

    const current = itemsRef.current.find((i) => i.id === item.id) ?? item
    const index = itemsRef.current.findIndex((i) => i.id === current.id)
    pendingRemovalsRef.current.set(current.id, { item: current, index: Math.max(0, index) })
    setPending(current.id, true)

    const timer = setTimeout(() => {
      timersRef.current.delete(current.id)
      pendingRemovalsRef.current.delete(current.id)
      commitRemove(current.id, current, Math.max(0, index))
    }, REMOVE_DELAY)

    timersRef.current.set(current.id, timer)
  }

  function handleCancelRemove(item: ProductCartResponse) {
    const timer = timersRef.current.get(item.id)
    if (timer) clearTimeout(timer)
    timersRef.current.delete(item.id)
    pendingRemovalsRef.current.delete(item.id)
    setPending(item.id, false)
    flushSyncIfIdle()
  }

  function commitRemove(itemId: string, fallbackItem: ProductCartResponse, fallbackIndex: number) {
    const current = itemsRef.current.find((i) => i.id === itemId) ?? fallbackItem
    updateList((prev) => prev.filter((i) => i.id !== itemId))
    emitCartOptimistic({ delta: -current.quantity, animate: true })
    setPending(itemId, false)
    markMaxed(itemId, false)

    if (isGuestRef.current) {
      guestCartService.removeItem(current.product_id)
      return
    }

    enqueueItemOp(itemId, async () => {
      try {
        await RemoveProductCart(itemId)
        pendingSyncRef.current = true
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          // Item já não existe no servidor: mantém removido e ressincroniza ao drenar a fila
          pendingSyncRef.current = true
        } else {
          logClientError('MainCart:commitRemove', err, { itemId })
          emitCartOptimistic({ delta: current.quantity, animate: false })
          updateList((prev) => {
            if (prev.some((i) => i.id === itemId)) return prev
            const next = [...prev]
            next.splice(Math.min(fallbackIndex, next.length), 0, current)
            return next
          })
          const { message, shouldSync } = getMutationErrorMessage(
            err,
            'Não foi possível remover o item. Ele foi mantido na sua sacola.'
          )
          if (shouldSync) pendingSyncRef.current = true
          setActionError(message)
        }
      }
    })
  }

  function handleOpenCheckout() {
    if (selectedItems.length === 0) return
    if (!guardSessionAvailable()) return

    if (!isAuthenticated || isGuest) {
      router.push('/login?redirect=/checkout')
      return
    }

    router.push('/checkout')
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
                const isUpdating = updatingIds.has(item.id)

                return (
                  <div
                    key={item.id}
                    className={`relative py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-opacity duration-200 ${
                      isPending ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Checkbox com área de toque confortável no mobile */}
                      <button
                        type="button"
                        onClick={() => handleToggleOne(item)}
                        disabled={sessionUnavailable}
                        aria-label={
                          item.isSelect
                            ? `Desmarcar ${item.name}`
                            : `Selecionar ${item.name}`
                        }
                        aria-pressed={item.isSelect}
                        className="flex h-10 w-10 -ml-2 shrink-0 items-center justify-center rounded-lg touch-manipulation cursor-pointer disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white"
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                            item.isSelect
                              ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                              : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-[#121212] text-transparent'
                          }`}
                        >
                          <Check size={14} strokeWidth={3} />
                        </span>
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

                    {/* Ações: Quantidade e Deletar (alvos >= 40px e touch-manipulation para mobile) */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0">
                      <div className="flex items-center rounded-full bg-[#F2F0F1] dark:bg-[#242424] px-1.5 py-1">
                        <button
                          type="button"
                          onClick={() => handleDecrease(item)}
                          disabled={item.quantity <= 1 || isPending || sessionUnavailable}
                          aria-label={`Diminuir quantidade de ${item.name}`}
                          className="h-10 w-10 sm:h-8 sm:w-8 rounded-full flex items-center justify-center touch-manipulation select-none hover:bg-neutral-300 dark:hover:bg-neutral-700 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-[transform,background-color,opacity] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white motion-reduce:transition-none"
                        >
                          <Minus size={16} aria-hidden="true" />
                        </button>
                        <span className="w-9 text-center text-sm sm:text-xs font-bold font-sans flex items-center justify-center gap-1 select-none">
                          <span>{item.quantity}</span>
                          {isUpdating && (
                            <Loader2
                              size={11}
                              className="animate-spin text-neutral-500 motion-reduce:animate-none"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrease(item)}
                          disabled={maxedIds.has(item.id) || isPending || sessionUnavailable}
                          aria-label={`Aumentar quantidade de ${item.name}`}
                          className="h-10 w-10 sm:h-8 sm:w-8 rounded-full flex items-center justify-center touch-manipulation select-none hover:bg-neutral-300 dark:hover:bg-neutral-700 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-[transform,background-color,opacity] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white motion-reduce:transition-none"
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                      </div>

                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => handleCancelRemove(item)}
                          className="flex h-10 px-3.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold items-center gap-1 touch-manipulation active:scale-95 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                          <X size={14} aria-hidden="true" /> Desfazer
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          disabled={sessionUnavailable}
                          className="h-11 w-11 sm:h-9 sm:w-9 flex items-center justify-center text-red-600 dark:text-red-400 touch-manipulation active:scale-95 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                          aria-label={`Remover ${item.name}`}
                        >
                          <Trash2 size={19} aria-hidden="true" />
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
    </main>
  )
}
