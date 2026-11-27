'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ImageOff,
  Loader2,
  MapPin,
  ShoppingBag,
} from 'lucide-react'
import { useSession } from '@/src/components/providers/session-provider'
import AddressForm from '@/src/components/checkout/address-form'
import SavedAddressSelector from '@/src/components/checkout/saved-address-selector'
import ErrorState from '@/src/components/ui/error-state'
import { CartPageSkeleton } from '@/src/components/ui/skeletons'
import { formatAddressFull } from '@/src/lib/address-rules'
import { logClientError } from '@/src/lib/api-error'
import { emitCartOptimistic } from '@/src/lib/cart-events'
import { listMyAddressesUseCase, ListMyAddressesUseCase } from '@/src/services/address'
import { createOrderUseCase, CreateOrderUseCase } from '@/src/services/order'
import {
  Address,
  AddressFieldErrors,
  AddressFieldName,
  OrderValidationError,
} from '@/src/types/address'

const formatPrice = (value: number | string) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const EMPTY_ADDRESS: Address = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
}

export interface CheckoutPageClientProps {
  listAddressesUC?: ListMyAddressesUseCase
  createOrderUC?: CreateOrderUseCase
}

export default function CheckoutPageClient({
  listAddressesUC = listMyAddressesUseCase,
  createOrderUC = createOrderUseCase,
}: CheckoutPageClientProps) {
  const router = useRouter()
  const {
    authLoaded,
    isAuthenticated,
    cart,
    setCart,
    cartLoaded,
    cartErrorVariant,
    refreshCart,
  } = useSession()

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [addressesLoaded, setAddressesLoaded] = useState(false)
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('new')
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS)
  const [addressFieldErrors, setAddressFieldErrors] = useState<AddressFieldErrors>({})
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  // Redireciona visitantes para login preservando retorno ao checkout
  useEffect(() => {
    if (authLoaded && !isAuthenticated) {
      router.replace('/login?redirect=/checkout')
    }
  }, [authLoaded, isAuthenticated, router])

  // Revalida o carrinho silenciosamente ao abrir o checkout
  useEffect(() => {
    if (authLoaded && isAuthenticated) {
      void refreshCart({ silent: true })
    }
  }, [authLoaded, isAuthenticated, refreshCart])

  // Carrega endereços salvos do usuário autenticado
  useEffect(() => {
    if (!authLoaded || !isAuthenticated) return
    const controller = new AbortController()
    let active = true

    listAddressesUC
      .execute(controller.signal)
      .then((list) => {
        if (!active) return
        setSavedAddresses(list)
        if (list.length > 0 && list[0].id) {
          setSelectedAddressId((prev) =>
            prev && list.some((a) => a.id === prev) ? prev : list[0].id!
          )
          setAddressMode('saved')
        } else {
          setSelectedAddressId('')
          setAddressMode('new')
        }
      })
      .catch(() => {
        if (!active) return
        setSavedAddresses([])
        setSelectedAddressId('')
        setAddressMode('new')
      })
      .finally(() => {
        if (active) setAddressesLoaded(true)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [authLoaded, isAuthenticated, listAddressesUC])

  const items = cart?.list ?? []
  const selectedItems = items.filter((item) => item.isSelect)
  const totalQuantity = selectedItems.reduce((acc, item) => acc + item.quantity, 0)
  const total = selectedItems.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0)

  const pageLoading = !authLoaded || (isAuthenticated && !cartLoaded && !cart)
  const loadingSavedAddresses = isAuthenticated && !addressesLoaded

  const selectedSavedAddress =
    addressMode === 'saved'
      ? savedAddresses.find((addr) => addr.id === selectedAddressId) ?? null
      : null

  const activeAddressPreview: Address | null =
    addressMode === 'saved'
      ? selectedSavedAddress
      : address.cep || address.street || address.city
      ? address
      : null

  function handleClearFieldError(field: AddressFieldName) {
    setAddressFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleConfirmOrder(e: React.FormEvent) {
    e.preventDefault()
    if (selectedItems.length === 0 || submittingOrder) return

    setSubmittingOrder(true)
    setCheckoutError('')
    setAddressFieldErrors({})

    try {
      const order =
        addressMode === 'saved' && savedAddresses.length > 0
          ? await createOrderUC.execute({ addressId: selectedAddressId })
          : await createOrderUC.execute({ address })

      const removedQty = totalQuantity
      setCart((prev) =>
        prev ? { ...prev, list: prev.list.filter((item) => !item.isSelect) } : prev
      )
      if (removedQty > 0) {
        emitCartOptimistic({ delta: -removedQty, animate: false })
      }
      void refreshCart({ silent: true })
      router.push(`/pedidos/${order.id}/pagamento`)
    } catch (err: unknown) {
      if (err instanceof OrderValidationError) {
        setAddressFieldErrors(err.fieldErrors)
        setCheckoutError(err.message)
      } else {
        logClientError('CheckoutPageClient:handleConfirmOrder', err)
        setCheckoutError(
          err instanceof Error && err.message
            ? err.message
            : 'Não foi possível finalizar o pedido agora. Verifique sua conexão e tente novamente.'
        )
      }
    } finally {
      setSubmittingOrder(false)
    }
  }

  if (pageLoading || !isAuthenticated) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-sans text-black dark:text-white">
        <CartPageSkeleton />
      </main>
    )
  }

  if (cartErrorVariant && selectedItems.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-14 font-sans text-black dark:text-white">
        <ErrorState
          variant={cartErrorVariant}
          onRetry={() => void refreshCart({ silent: false })}
          autoFocusRetry
          secondaryHref="/carrinho"
          secondaryLabel="Voltar ao Carrinho"
        />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-sans text-black dark:text-white">
      {/* Breadcrumb e Voltar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-medium">
          <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
            Início
          </Link>
          <span>/</span>
          <Link href="/carrinho" className="hover:text-black dark:hover:text-white transition-colors">
            Carrinho
          </Link>
          <span>/</span>
          <span className="text-black dark:text-white font-bold">Checkout</span>
        </div>

        <Link
          href="/carrinho"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Voltar ao Carrinho
        </Link>
      </div>

      <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight">
          REVISAR PEDIDO E ENTREGA
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Confira os itens selecionados e escolha o endereço de entrega antes de seguir para o pagamento.
        </p>
      </div>

      {selectedItems.length === 0 ? (
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#181818] p-10 sm:p-12 text-center max-w-2xl mx-auto my-8">
          <ShoppingBag size={36} className="mx-auto text-neutral-400 mb-4" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
            Nenhum item selecionado para checkout
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Volte ao seu carrinho e marque os produtos que deseja comprar.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/carrinho"
              className="inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-8 py-3.5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Ir para o Carrinho <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-black/15 dark:border-white/20 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider hover:bg-white dark:hover:bg-[#242424] transition-colors"
            >
              Explorar Catálogo
            </Link>
          </div>
        </div>
      ) : (
        <form
          id="checkout-form"
          onSubmit={handleConfirmOrder}
          noValidate
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
        >
          {/* Coluna Esquerda: Endereço + Itens do Pedido (Col 7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Seção 1: Endereço de Entrega */}
            <section className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-black/10 dark:border-white/10">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <MapPin size={18} aria-hidden="true" />
                  1. Endereço de Entrega
                </h2>
                <Link
                  href="/conta?tab=addresses"
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-black dark:hover:text-white underline underline-offset-4 transition-colors"
                >
                  Gerenciar endereços
                </Link>
              </div>

              {loadingSavedAddresses ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center justify-center gap-2.5 rounded-2xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#222222] py-8 text-xs font-medium text-neutral-600 dark:text-neutral-300"
                >
                  <Loader2
                    size={16}
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <span>Carregando seus endereços salvos...</span>
                </div>
              ) : addressMode === 'saved' && savedAddresses.length > 0 ? (
                <SavedAddressSelector
                  addresses={savedAddresses}
                  selectedAddressId={selectedAddressId}
                  onSelect={(id) => {
                    setSelectedAddressId(id)
                    handleClearFieldError('address_id')
                    setCheckoutError('')
                  }}
                  onAddNew={() => {
                    setAddressMode('new')
                    setCheckoutError('')
                    setAddressFieldErrors({})
                  }}
                  error={addressFieldErrors.address_id}
                  disabled={submittingOrder}
                />
              ) : (
                <div className="space-y-4">
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddressMode('saved')
                        setCheckoutError('')
                        setAddressFieldErrors({})
                      }}
                      disabled={submittingOrder}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={14} aria-hidden="true" />
                      Usar um endereço salvo ({savedAddresses.length})
                    </button>
                  )}

                  <AddressForm
                    value={address}
                    onChange={setAddress}
                    fieldErrors={addressFieldErrors}
                    onClearFieldError={handleClearFieldError}
                    disabled={submittingOrder}
                  />
                </div>
              )}
            </section>

            {/* Seção 2: Itens do Pedido */}
            <section className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-black/10 dark:border-white/10">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                  2. Itens do Pedido ({totalQuantity}{' '}
                  {totalQuantity === 1 ? 'unidade' : 'unidades'})
                </h2>
                <Link
                  href="/carrinho"
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-black dark:hover:text-white underline underline-offset-4 transition-colors"
                >
                  Alterar itens
                </Link>
              </div>

              <div className="divide-y divide-black/10 dark:divide-white/10">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-16 w-16 shrink-0 rounded-2xl bg-white border border-black/10 flex items-center justify-center p-2 overflow-hidden">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.name}
                            decoding="async"
                            className="h-full w-full object-contain mix-blend-multiply"
                          />
                        ) : (
                          <ImageOff size={20} className="text-neutral-400" aria-hidden="true" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-sm uppercase tracking-tight truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">SKU: {item.sku}</p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                          Qtd: <strong className="text-black dark:text-white">{item.quantity}</strong>{' '}
                          × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>

                    <span className="font-display font-bold text-base shrink-0">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Coluna Direita: Resumo + Confirmação para Pagamento (Col 5) */}
          <aside className="lg:col-span-5 lg:sticky lg:top-6 rounded-3xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#181818] p-6 sm:p-8 space-y-6">
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
              RESUMO DO PEDIDO
            </h2>

            {/* Preview do endereço escolhido */}
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#121212] p-4 space-y-1">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                <MapPin size={12} aria-hidden="true" />
                Entregar em
              </span>
              <p className="text-xs font-medium text-black dark:text-white leading-relaxed">
                {activeAddressPreview
                  ? formatAddressFull(activeAddressPreview)
                  : 'Selecione um endereço salvo ou preencha os dados ao lado.'}
              </p>
            </div>

            <div className="space-y-3 text-sm divide-y divide-black/10 dark:divide-white/10">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 pt-1">
                <span>
                  Subtotal ({totalQuantity} {totalQuantity === 1 ? 'item' : 'itens'})
                </span>
                <span className="font-bold text-black dark:text-white">{formatPrice(total)}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 pt-3">
                <span>Entrega</span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Grátis
                </span>
              </div>
              <div className="flex items-center justify-between text-base sm:text-lg font-bold pt-3">
                <span>Total</span>
                <span className="font-display font-extrabold text-xl sm:text-2xl">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {checkoutError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs font-medium text-red-700 dark:text-red-300"
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{checkoutError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingOrder || loadingSavedAddresses}
              className="w-full py-4 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-semibold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-[transform,opacity] duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white motion-reduce:transition-none"
            >
              {submittingOrder ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <span>Criando pedido...</span>
                </>
              ) : (
                <>
                  <span>Confirmar e Ir para Pagamento</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-neutral-500">
              Na próxima etapa você escolherá a forma de pagamento (Pix ou Cartão de Crédito).
            </p>
          </aside>
        </form>
      )}
    </main>
  )
}
