'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Package,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react'
import { OrderResponse, PaginatedOrdersResponse } from '@/src/types/order'
import ReadMyOrdersService from '@/src/actions/order/read_my_orders'
import { getStatusConfig } from '@/src/lib/order-status'
import { classifyErrorVariant, ErrorStateVariant, logClientError } from '@/src/lib/api-error'
import { clientCache } from '@/src/lib/client-cache'
import ErrorState from '@/src/components/ui/error-state'
import StaleDataBanner from '@/src/components/ui/stale-data-banner'
import { OrdersListSkeleton } from '@/src/components/ui/skeletons'

const PAGE_LIMIT = 8

const formatPrice = (value: number | string) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (value: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const FILTER_TABS = [
  { label: 'Todos', value: '' },
  { label: 'Aguardando Pagamento', value: 'PENDING_PAYMENT' },
  { label: 'Em Preparação', value: 'PREPARING' },
  { label: 'Enviados', value: 'SHIPPED' },
  { label: 'Entregues', value: 'DELIVERED' },
  { label: 'Estorno Solicitado', value: 'REFUND_REQUESTED' },
  { label: 'Estornados', value: 'REFUNDED' },
  { label: 'Cancelados', value: 'CANCELED' },
]

export default function MyOrdersClient() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalRows, setTotalRows] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [errorVariant, setErrorVariant] = useState<ErrorStateVariant | null>(null)
  const [isStale, setIsStale] = useState<boolean>(false)
  const [cachedAt, setCachedAt] = useState<number | null>(null)
  const [attempt, setAttempt] = useState<number>(0)

  const handleRetry = useCallback(() => {
    setLoading(true)
    setErrorVariant(null)
    setAttempt((v) => v + 1)
  }, [])

  useEffect(() => {
    let active = true
    const cacheKey = `orders:me:${statusFilter || 'all'}:${page}`

    // Stale-While-Revalidate: evita skeleton ao voltar para Meus Pedidos ou alternar filtros visitados
    const freshCached = clientCache.get<PaginatedOrdersResponse>(cacheKey, 60 * 1000)
    if (freshCached) {
      queueMicrotask(() => {
        if (!active) return
        setOrders(freshCached.data.data)
        setTotalPages(freshCached.data.total_pages)
        setTotalRows(freshCached.data.total_rows)
        setErrorVariant(null)
        setIsStale(false)
        setCachedAt(freshCached.savedAt)
        setLoading(false)
      })
    }

    ReadMyOrdersService({
      page,
      limit: PAGE_LIMIT,
      status: statusFilter,
    })
      .then((res) => {
        if (!active) return
        clientCache.set(cacheKey, res)
        setOrders(res.data)
        setTotalPages(res.total_pages)
        setTotalRows(res.total_rows)
        setErrorVariant(null)
        setIsStale(false)
        setCachedAt(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        if (err instanceof Error && err.message === '401') {
          router.push('/login')
          return
        }
        logClientError('MyOrdersClient', err, { page, statusFilter })

        const cached = clientCache.get<PaginatedOrdersResponse>(cacheKey)
        if (cached) {
          setOrders(cached.data.data)
          setTotalPages(cached.data.total_pages)
          setTotalRows(cached.data.total_rows)
          setIsStale(true)
          setCachedAt(cached.savedAt)
          setErrorVariant(null)
          return
        }

        setIsStale(false)
        setCachedAt(null)
        setErrorVariant(classifyErrorVariant(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [page, statusFilter, attempt, router])

  function handleFilterChange(val: string) {
    setStatusFilter(val)
    setPage(1)
    setLoading(true)
    setErrorVariant(null)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-sans text-black dark:text-white">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6 uppercase tracking-wider font-medium">
        <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
          Início
        </Link>
        <span>/</span>
        <span className="text-black dark:text-white font-bold">Meus Pedidos</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight">
            MEUS PEDIDOS
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            Acompanhe o status e histórico de todas as suas compras.
          </p>
        </div>
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {totalRows} {totalRows === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>

      {/* Filtros em Abas Pílula */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTER_TABS.map((tab) => {
          const isActive = statusFilter === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleFilterChange(tab.value)}
              className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white ${
                isActive
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'bg-[#F2F0F1] dark:bg-[#1f1f1f] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#2a2a2a]'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {isStale && !loading && (
        <StaleDataBanner savedAt={cachedAt} onRetry={handleRetry} className="mb-6" />
      )}

      {loading && <OrdersListSkeleton count={3} />}

      {!loading && errorVariant && (
        <ErrorState
          variant={errorVariant}
          onRetry={handleRetry}
          autoFocusRetry
          secondaryHref="/"
          secondaryLabel="Voltar à loja"
        />
      )}

      {!loading && !errorVariant && orders.length === 0 && (
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#181818] p-12 text-center max-w-xl mx-auto my-8">
          <Package size={40} className="mx-auto text-neutral-400 mb-4" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">
            Nenhum pedido encontrado
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            Você ainda não realizou compras com este filtro.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-8 py-3.5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Começar a Comprar <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}

      {!loading && !errorVariant && orders.length > 0 && (
        <>
          <ul className="flex flex-col gap-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status)
              const totalItems = order.items.reduce((acc, i) => acc + i.quantity, 0)

              return (
                <li
                  key={order.id}
                  className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 transition-colors hover:border-black/30 dark:hover:border-white/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
                    <div>
                      <span className="font-mono text-xs font-bold">
                        PEDIDO #{order.id}
                      </span>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500 font-sans">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} aria-hidden="true" />
                          {formatDate(order.created_at)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 font-mono">
                          <MapPin size={13} aria-hidden="true" />
                          CEP: {order.zip_code}
                        </span>
                      </div>
                    </div>

                    <span className="rounded-full bg-[#F2F0F1] dark:bg-[#242424] px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                      <span className="font-bold text-black dark:text-white">
                        {totalItems} {totalItems === 1 ? 'item' : 'itens'}:
                      </span>{' '}
                      {order.items
                        .map((i) => i.name)
                        .slice(0, 2)
                        .join(', ')}
                      {order.items.length > 2 ? '...' : ''}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-neutral-500">
                          Total
                        </span>
                        <span className="font-display font-bold text-base sm:text-lg">
                          {formatPrice(order.total)}
                        </span>
                      </div>

                      {order.status === 'PENDING_PAYMENT' && (
                        <Link
                          href={`/pedidos/${order.id}/pagamento`}
                          className="flex h-10 items-center gap-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black px-5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
                        >
                          Pagar Agora
                          <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      )}

                      <Link
                        href={`/pedidos/${order.id}`}
                        className="flex h-10 items-center gap-1.5 rounded-full border border-black/15 dark:border-white/20 px-5 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] dark:hover:bg-[#252525] transition-colors"
                      >
                        Detalhes
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Paginação */}
          {totalPages > 1 && (
            <nav
              aria-label="Paginação de pedidos"
              className="mt-10 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => {
                  setLoading(true)
                  setPage((p) => Math.max(1, p - 1))
                }}
                disabled={page <= 1}
                className="h-10 px-4 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] dark:hover:bg-[#252525] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} className="inline mr-1" aria-hidden="true" /> Anterior
              </button>

              <span className="text-xs text-neutral-600 dark:text-neutral-400 font-sans font-medium px-2">
                Página <strong className="text-black dark:text-white">{page}</strong> de {totalPages}
              </span>

              <button
                type="button"
                onClick={() => {
                  setLoading(true)
                  setPage((p) => Math.min(totalPages, p + 1))
                }}
                disabled={page >= totalPages}
                className="h-10 px-4 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] dark:hover:bg-[#252525] disabled:opacity-40 transition-colors cursor-pointer"
              >
                Próxima <ChevronRight size={16} className="inline ml-1" aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  )
}
