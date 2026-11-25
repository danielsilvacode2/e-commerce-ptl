'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Clock,
    Package,
    Truck,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    MapPin,
    Calendar,
    ImageOff,
    CreditCard,
    RotateCcw,
    ShieldAlert,
} from 'lucide-react'
import { OrderResponse, OrderStatusHistoryResponse, OrderStatus } from '@/src/types/order'
import ReadOrderByIdService from '@/src/actions/order/read_order_by_id'
import ReadOrderHistoryService from '@/src/actions/order/read_order_history'
import CancelOrderService from '@/src/actions/order/cancel_order'
import RequestRefundService from '@/src/actions/order/request_refund'
import { classifyErrorVariant, ErrorStateVariant, logClientError } from '@/src/lib/api-error'
import { clientCache } from '@/src/lib/client-cache'
import ErrorState from '@/src/components/ui/error-state'
import StaleDataBanner from '@/src/components/ui/stale-data-banner'
import { OrderDetailSkeleton } from '@/src/components/ui/skeletons'
import {
    getStatusConfig,
    isFinalStatus,
    canPayOrder,
    canCancelOrder,
    canAutoRefundOrder,
    canRequestAdminRefundOrder,
    isRefundBlockedInTransit,
} from '@/src/lib/order-status'

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

function StatusIcon({ status }: { status: OrderStatus }) {
    switch (status) {
        case 'PENDING_PAYMENT':
            return <CreditCard size={16} />
        case 'PREPARING':
            return <Package size={16} />
        case 'SHIPPED':
            return <Truck size={16} />
        case 'DELIVERED':
            return <CheckCircle2 size={16} />
        case 'REFUND_REQUESTED':
        case 'REFUNDED':
            return <RotateCcw size={16} />
        case 'CANCELED':
            return <XCircle size={16} />
        default:
            return <Clock size={16} />
    }
}

interface OrderDetailClientProps {
    orderId: string
}

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
    const router = useRouter()
    const [order, setOrder] = useState<OrderResponse | null>(null)
    const [history, setHistory] = useState<OrderStatusHistoryResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [errorVariant, setErrorVariant] = useState<ErrorStateVariant | null>(null)
    const [isStale, setIsStale] = useState(false)
    const [cachedAt, setCachedAt] = useState<number | null>(null)

    // Cancelamento (PENDING_PAYMENT)
    const [cancelModalOpen, setCancelModalOpen] = useState(false)
    const [canceling, setCanceling] = useState(false)
    const [cancelError, setCancelError] = useState('')

    // Estorno (PREPARING = automático; DELIVERED = solicitação p/ admin)
    const [refundModalOpen, setRefundModalOpen] = useState(false)
    const [refundReason, setRefundReason] = useState('')
    const [refundSubmitting, setRefundSubmitting] = useState(false)
    const [refundError, setRefundError] = useState('')
    const [refundSuccess, setRefundSuccess] = useState('')

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const inFlightRef = useRef<boolean>(false)

    const fetchOrderData = useCallback(
        async (isPolling = false) => {
            if (isPolling && inFlightRef.current) return
            inFlightRef.current = true
            const cacheKey = `order:${orderId}`
            if (!isPolling) {
                setLoading(true)
            } else {
                setRefreshing(true)
            }
            setErrorVariant(null)

            try {
                const [orderData, historyData] = await Promise.all([
                    ReadOrderByIdService(orderId),
                    ReadOrderHistoryService(orderId).catch(() => []),
                ])

                clientCache.set(cacheKey, { order: orderData, history: historyData })
                setOrder(orderData)
                setHistory(historyData)
                setIsStale(false)
                setCachedAt(null)
            } catch (err: unknown) {
                if (err instanceof Error && err.message === '401') {
                    router.push('/login')
                    return
                }
                logClientError('OrderDetailClient', err, { orderId, isPolling })
                if (!isPolling) {
                    const cached = clientCache.get<{
                        order: OrderResponse
                        history: OrderStatusHistoryResponse[]
                    }>(cacheKey)
                    if (cached) {
                        setOrder(cached.data.order)
                        setHistory(cached.data.history)
                        setIsStale(true)
                        setCachedAt(cached.savedAt)
                    } else {
                        setErrorVariant(classifyErrorVariant(err))
                    }
                }
            } finally {
                inFlightRef.current = false
                setLoading(false)
                setRefreshing(false)
            }
        },
        [orderId, router]
    )

    useEffect(() => {
        let active = true
        const cacheKey = `order:${orderId}`

        // Stale-While-Revalidate: exibe cache recente de imediato ao revisitar o pedido
        const freshCached = clientCache.get<{
            order: OrderResponse
            history: OrderStatusHistoryResponse[]
        }>(cacheKey, 60 * 1000)
        if (freshCached) {
            queueMicrotask(() => {
                if (!active) return
                setOrder(freshCached.data.order)
                setHistory(freshCached.data.history)
                setIsStale(false)
                setCachedAt(freshCached.savedAt)
                setLoading(false)
            })
        }

        Promise.all([
            ReadOrderByIdService(orderId),
            ReadOrderHistoryService(orderId).catch(() => []),
        ])
            .then(([orderData, historyData]) => {
                if (!active) return
                clientCache.set(cacheKey, { order: orderData, history: historyData })
                setOrder(orderData)
                setHistory(historyData)
                setIsStale(false)
                setCachedAt(null)
            })
            .catch((err: unknown) => {
                if (!active) return
                if (err instanceof Error && err.message === '401') {
                    router.push('/login')
                    return
                }
                logClientError('OrderDetailClient:init', err, { orderId })
                const cached = clientCache.get<{
                    order: OrderResponse
                    history: OrderStatusHistoryResponse[]
                }>(cacheKey)
                if (cached) {
                    setOrder(cached.data.order)
                    setHistory(cached.data.history)
                    setIsStale(true)
                    setCachedAt(cached.savedAt)
                } else {
                    setErrorVariant(classifyErrorVariant(err))
                }
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [orderId, router])

    const orderStatus = order?.status

    useEffect(() => {
        if (!orderStatus || isFinalStatus(orderStatus)) {
            if (pollingRef.current) clearInterval(pollingRef.current)
            return
        }

        const tick = () => {
            if (typeof document !== 'undefined' && document.hidden) return
            void fetchOrderData(true)
        }

        pollingRef.current = setInterval(tick, 10000)

        const handleVisibilityChange = () => {
            if (typeof document !== 'undefined' && !document.hidden) {
                void fetchOrderData(true)
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [orderStatus, fetchOrderData])

    async function handleConfirmCancel() {
        setCanceling(true)
        setCancelError('')
        try {
            await CancelOrderService(orderId)
            setCancelModalOpen(false)
            await fetchOrderData(false)
        } catch (err: unknown) {
            setCancelError(err instanceof Error ? err.message : 'Erro ao cancelar o pedido.')
        } finally {
            setCanceling(false)
        }
    }

    async function handleConfirmRefund(e: React.FormEvent) {
        e.preventDefault()
        if (!order) return

        const requiresReason = canRequestAdminRefundOrder(order.status)
        if (requiresReason && !refundReason.trim()) {
            setRefundError('Informe o motivo da solicitação de estorno.')
            return
        }

        setRefundSubmitting(true)
        setRefundError('')
        setRefundSuccess('')

        try {
            const updated = await RequestRefundService(orderId, refundReason.trim())
            setRefundModalOpen(false)
            setRefundReason('')
            if (updated.status === 'REFUNDED') {
                setRefundSuccess('Estorno aprovado automaticamente! O valor será devolvido e os itens retornaram ao estoque.')
            } else {
                setRefundSuccess('Solicitação de estorno enviada! Nossa equipe administrativa analisará seu pedido.')
            }
            await fetchOrderData(false)
        } catch (err: unknown) {
            setRefundError(err instanceof Error ? err.message : 'Erro ao solicitar estorno.')
        } finally {
            setRefundSubmitting(false)
        }
    }

    if (loading) {
        return <OrderDetailSkeleton />
    }

    if (errorVariant || !order) {
        return (
            <main className="mx-auto max-w-2xl px-4 py-16 font-sans text-black dark:text-white">
                <ErrorState
                    variant={errorVariant ?? 'not-found'}
                    title={
                        errorVariant === 'not-found' || !order
                            ? 'Pedido não encontrado'
                            : undefined
                    }
                    description={
                        errorVariant === 'not-found' || !order
                            ? 'Não encontramos as informações deste pedido. Verifique sua lista de compras.'
                            : undefined
                    }
                    onRetry={() => fetchOrderData(false)}
                    autoFocusRetry
                    secondaryHref="/pedidos"
                    secondaryLabel="Ver Meus Pedidos"
                />
            </main>
        )
    }

    const statusConfig = getStatusConfig(order.status)
    const canPay = canPayOrder(order.status)
    const canCancel = canCancelOrder(order.status)
    const isAutoRefund = canAutoRefundOrder(order.status)
    const isDeliveredRefund = canRequestAdminRefundOrder(order.status)
    const refundBlocked = isRefundBlockedInTransit(order.status)

    return (
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-sans text-black dark:text-white">
            {/* Topo / Voltar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-4 mb-8">
                <Link
                    href="/pedidos"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} />
                    Voltar para Meus Pedidos
                </Link>

                <div className="flex items-center gap-3">
                    {refreshing && (
                        <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                            <RefreshCw size={12} className="animate-spin" />
                            Atualizando...
                        </span>
                    )}
                </div>
            </div>

            {isStale && (
                <StaleDataBanner
                    savedAt={cachedAt}
                    onRetry={() => fetchOrderData(false)}
                    retrying={refreshing}
                    className="mb-6"
                />
            )}

            {refundSuccess && (
                <div className="mb-6 flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{refundSuccess}</span>
                </div>
            )}

            {/* Status Hero Card */}
            <section className="rounded-3xl bg-[#F2F0F1] dark:bg-[#181818] p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <span className="text-xs uppercase tracking-wider text-neutral-500 font-bold font-mono">
                            PEDIDO #{order.id}
                        </span>
                        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">
                            STATUS DO PEDIDO
                        </h1>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            {statusConfig.description}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2.5">
                        <span className="inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm">
                            <StatusIcon status={order.status} />
                            {statusConfig.label}
                        </span>

                        {canPay && (
                            <Link
                                href={`/pedidos/${order.id}/pagamento`}
                                className="inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                            >
                                <CreditCard size={14} />
                                Finalizar Pagamento
                            </Link>
                        )}

                        {canCancel && (
                            <button
                                type="button"
                                onClick={() => setCancelModalOpen(true)}
                                className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 underline underline-offset-4 hover:text-red-800 cursor-pointer"
                            >
                                Cancelar Pedido
                            </button>
                        )}

                        {isAutoRefund && (
                            <button
                                type="button"
                                onClick={() => {
                                    setRefundError('')
                                    setRefundModalOpen(true)
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-white dark:bg-[#222] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            >
                                <RotateCcw size={14} />
                                Cancelar e Estornar Agora
                            </button>
                        )}

                        {isDeliveredRefund && (
                            <button
                                type="button"
                                onClick={() => {
                                    setRefundError('')
                                    setRefundModalOpen(true)
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full border border-black/20 dark:border-white/20 bg-white dark:bg-[#222] px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                            >
                                <RotateCcw size={14} />
                                Solicitar Estorno
                            </button>
                        )}
                    </div>
                </div>

                {/* Aviso de bloqueio de estorno em transito */}
                {refundBlocked && (
                    <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-blue-500/20 bg-blue-50 dark:bg-blue-950/30 p-4 text-xs text-blue-800 dark:text-blue-300">
                        <Truck size={16} className="shrink-0 mt-0.5" />
                        <span>
                            Este pedido está em trânsito. A solicitação de estorno fica temporariamente indisponível durante o transporte e voltará a ficar disponível após a entrega.
                        </span>
                    </div>
                )}

                {/* Código de Rastreio */}
                {order.tracking_code && (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black text-white dark:bg-white dark:text-black px-5 py-3.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                            Código de Rastreio
                        </span>
                        <span className="font-mono text-sm font-bold tracking-wider">
                            {order.tracking_code}
                        </span>
                    </div>
                )}

                {/* Motivo de estorno solicitado ou recusado */}
                {order.status === 'REFUND_REQUESTED' && order.refund_reason && (
                    <div className="mt-5 rounded-2xl border border-purple-500/30 bg-purple-50 dark:bg-purple-950/30 p-4 text-xs text-purple-900 dark:text-purple-200">
                        <strong className="uppercase tracking-wider block mb-1">
                            Solicitação de estorno em análise
                        </strong>
                        Motivo informado: {order.refund_reason}
                    </div>
                )}

                {order.status === 'DELIVERED' && order.refund_rejection_reason && (
                    <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-900 dark:text-amber-200">
                        <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                        <div>
                            <strong className="uppercase tracking-wider block mb-0.5">
                                Última solicitação de estorno recusada
                            </strong>
                            Justificativa: {order.refund_rejection_reason}
                        </div>
                    </div>
                )}

                {/* Metadados rápidos */}
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-black/10 dark:border-white/10 pt-6 sm:grid-cols-4">
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-neutral-500 font-medium">
                            Realizado em
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs font-bold">
                            <Calendar size={13} className="text-neutral-500" />
                            {formatDate(order.created_at)}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-neutral-500 font-medium">
                            CEP Entrega
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 font-mono text-xs font-bold">
                            <MapPin size={13} className="text-neutral-500" />
                            {order.zip_code}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-neutral-500 font-medium">
                            Qtd. Total
                        </span>
                        <span className="mt-1 text-xs font-bold">
                            {order.items.reduce((acc, i) => acc + i.quantity, 0)} unidades
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-neutral-500 font-medium">
                            Valor Total
                        </span>
                        <span className="mt-1 font-display font-extrabold text-base">
                            {formatPrice(order.total)}
                        </span>
                    </div>
                </div>
            </section>

            {/* Timeline do Histórico de Status */}
            <section className="mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                    HISTÓRICO DE RASTREAMENTO
                </h2>

                {history.length === 0 ? (
                    <p className="mt-4 text-xs text-neutral-500">
                        Nenhuma movimentação registrada até o momento.
                    </p>
                ) : (
                    <ol className="relative mt-8 border-l border-black/10 dark:border-white/10 pl-6 space-y-6">
                        {history.map((step, idx) => {
                            const stepConfig = getStatusConfig(step.status)
                            const isLatest = idx === history.length - 1

                            return (
                                <li key={step.id || idx} className="relative">
                                    <span
                                        className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border bg-white dark:bg-[#181818] ${
                                            isLatest
                                                ? 'border-black dark:border-white'
                                                : 'border-neutral-300 dark:border-neutral-700'
                                        }`}
                                    >
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${
                                                isLatest
                                                    ? 'bg-black dark:bg-white'
                                                    : 'bg-neutral-300 dark:bg-neutral-700'
                                            }`}
                                        />
                                    </span>

                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <span
                                            className={`text-xs font-bold uppercase tracking-wider ${
                                                isLatest ? 'text-black dark:text-white' : 'text-neutral-500'
                                            }`}
                                        >
                                            {stepConfig.label}
                                        </span>
                                        <time className="text-[11px] font-mono text-neutral-400">
                                            {formatDate(step.created_at)}
                                        </time>
                                    </div>
                                    <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                                        {stepConfig.description}
                                    </p>
                                </li>
                            )
                        })}
                    </ol>
                )}
            </section>

            {/* Itens do Pedido */}
            <section className="mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                    ITENS DO PEDIDO ({order.items.length})
                </h2>

                <div className="mt-6 divide-y divide-black/10 dark:divide-white/10">
                    {order.items.map((item) => {
                        const unitPrice = Number(item.unit_price ?? item.price ?? 0)
                        return (
                            <div
                                key={item.id}
                                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="h-16 w-16 rounded-2xl bg-[#F2F0F1] dark:bg-[#252525] flex items-center justify-center p-2 shrink-0">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <ImageOff size={20} className="text-neutral-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-display font-bold text-sm uppercase tracking-tight truncate">
                                            {item.name}
                                        </h4>
                                        <p className="text-xs text-neutral-500 mt-0.5">SKU: {item.sku}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Qtd: <strong className="text-black dark:text-white">{item.quantity}</strong>
                                    </span>
                                    <span className="font-display font-bold text-base">
                                        {formatPrice(unitPrice * item.quantity)}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Resumo */}
                <div className="mt-6 border-t border-black/10 dark:border-white/10 pt-6 space-y-2 text-sm">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Subtotal</span>
                        <span className="font-bold text-black dark:text-white">{formatPrice(order.total)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Entrega</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-xs">Grátis</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-black/5 dark:border-white/10">
                        <span>Total</span>
                        <span className="font-display font-extrabold text-xl">{formatPrice(order.total)}</span>
                    </div>
                </div>
            </section>

            {/* Modal de Cancelamento (PENDING_PAYMENT) */}
            {cancelModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                >
                    <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181818] p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10">
                        <h2 className="font-display text-xl font-bold uppercase tracking-tight text-red-600 dark:text-red-400">
                            Confirmar Cancelamento
                        </h2>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            Tem certeza que deseja cancelar o pedido #{order.id}? Os itens retornarão ao estoque.
                        </p>

                        {cancelError && (
                            <div className="mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-xs text-red-600 dark:text-red-400">
                                {cancelError}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setCancelModalOpen(false)}
                                disabled={canceling}
                                className="h-11 px-5 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] dark:hover:bg-[#252525] cursor-pointer"
                            >
                                Manter Pedido
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={canceling}
                                className="flex h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-red-700 cursor-pointer"
                            >
                                {canceling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Estorno (PREPARING = automático; DELIVERED = análise do admin) */}
            {refundModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-refund-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                >
                    <form
                        onSubmit={handleConfirmRefund}
                        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181818] p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10"
                    >
                        <h2
                            id="modal-refund-title"
                            className="font-display text-xl font-bold uppercase tracking-tight"
                        >
                            {isAutoRefund ? 'Cancelar e Estornar Pedido' : 'Solicitar Estorno'}
                        </h2>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            {isAutoRefund
                                ? 'Como seu pedido ainda está em preparação, o estorno será aprovado imediatamente sem precisar de análise manual.'
                                : 'Como o pedido já foi entregue, informe o motivo do estorno. Nossa equipe administrativa analisará sua solicitação.'}
                        </p>

                        <div className="mt-4">
                            <label
                                htmlFor="refund-reason-input"
                                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                            >
                                {isAutoRefund ? 'Motivo (opcional)' : 'Motivo do Estorno *'}
                            </label>
                            <textarea
                                id="refund-reason-input"
                                rows={3}
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                required={isDeliveredRefund}
                                disabled={refundSubmitting}
                                placeholder="Descreva o motivo da solicitação..."
                                className="w-full rounded-2xl border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] p-3.5 text-sm outline-none focus:border-black dark:focus:border-white"
                            />
                        </div>

                        {refundError && (
                            <div
                                role="alert"
                                className="mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-xs text-red-600 dark:text-red-400"
                            >
                                {refundError}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setRefundModalOpen(false)}
                                disabled={refundSubmitting}
                                className="h-11 px-5 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] dark:hover:bg-[#252525] cursor-pointer"
                            >
                                Voltar
                            </button>
                            <button
                                type="submit"
                                disabled={refundSubmitting}
                                className="flex h-11 items-center justify-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-6 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
                            >
                                {refundSubmitting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Processando...
                                    </>
                                ) : isAutoRefund ? (
                                    'Confirmar Estorno Imediato'
                                ) : (
                                    'Enviar Solicitação'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    )
}
