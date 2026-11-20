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
    AlertCircle,
    Loader2,
    RefreshCw,
    MapPin,
    Calendar,
    ImageOff,
} from 'lucide-react'
import { OrderResponse, OrderStatusHistoryResponse, OrderStatus } from '@/src/types/order'
import ReadOrderByIdService from '@/src/actions/order/read_order_by_id'
import ReadOrderHistoryService from '@/src/actions/order/read_order_history'
import CancelOrderService from '@/src/actions/order/cancel_order'
import { getStatusConfig, isFinalStatus, canCancelOrder } from '@/src/lib/order-status'

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
        case 'PREPARING':
            return <Package size={16} />
        case 'SHIPPED':
            return <Truck size={16} />
        case 'DELIVERED':
            return <CheckCircle2 size={16} />
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
    const [error, setError] = useState('')

    // Cancelamento
    const [cancelModalOpen, setCancelModalOpen] = useState(false)
    const [canceling, setCanceling] = useState(false)
    const [cancelError, setCancelError] = useState('')

    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    const fetchOrderData = useCallback(async (isPolling = false) => {
        if (!isPolling) {
            setLoading(true)
        } else {
            setRefreshing(true)
        }
        setError('')

        try {
            const [orderData, historyData] = await Promise.all([
                ReadOrderByIdService(orderId),
                ReadOrderHistoryService(orderId).catch(() => []),
            ])

            setOrder(orderData)
            setHistory(historyData)
        } catch (err: unknown) {
            if (err instanceof Error && err.message === '401') {
                router.push('/login')
                return
            }
            if (!isPolling) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar pedido.')
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [orderId, router])

    useEffect(() => {
        let active = true

        Promise.all([
            ReadOrderByIdService(orderId),
            ReadOrderHistoryService(orderId).catch(() => []),
        ])
            .then(([orderData, historyData]) => {
                if (!active) return
                setOrder(orderData)
                setHistory(historyData)
            })
            .catch((err: unknown) => {
                if (!active) return
                if (err instanceof Error && err.message === '401') {
                    router.push('/login')
                    return
                }
                setError(err instanceof Error ? err.message : 'Erro ao carregar pedido.')
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [orderId, router])

    useEffect(() => {
        if (!order || isFinalStatus(order.status)) {
            if (pollingRef.current) clearInterval(pollingRef.current)
            return
        }

        pollingRef.current = setInterval(() => {
            fetchOrderData(true)
        }, 7000)

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [order, fetchOrderData])

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

    if (loading) {
        return (
            <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center font-sans text-black">
                <Loader2 size={36} className="animate-spin text-black" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Carregando detalhes do pedido...
                </p>
            </main>
        )
    }

    if (error || !order) {
        return (
            <main className="mx-auto max-w-4xl px-4 py-16 font-sans text-black">
                <div className="rounded-3xl bg-[#F2F0F1] p-8 sm:p-12 text-center">
                    <AlertCircle size={36} className="mx-auto text-black mb-3" />
                    <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-black">
                        Não foi possível carregar o pedido
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600 font-sans">
                        {error || 'Não encontramos as informações deste pedido.'}
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                        <Link
                            href="/pedidos"
                            className="rounded-full border border-black/15 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-black hover:bg-white"
                        >
                            Ver Meus Pedidos
                        </Link>
                        <button
                            type="button"
                            onClick={() => fetchOrderData(false)}
                            className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    const statusConfig = getStatusConfig(order.status)
    const canCancel = canCancelOrder(order.status)

    return (
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-sans text-black">
            {/* Topo / Voltar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4 mb-8">
                <Link
                    href="/pedidos"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors"
                >
                    <ArrowLeft size={16} />
                    Voltar para Meus Pedidos
                </Link>

                <div className="flex items-center gap-3">
                    {refreshing && (
                        <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                            <RefreshCw size={12} className="animate-spin text-black" />
                            Atualizando...
                        </span>
                    )}
                </div>
            </div>

            {/* Status Hero Card */}
            <section className="rounded-3xl bg-[#F2F0F1] p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <span className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                            PEDIDO #{order.id}
                        </span>
                        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black">
                            STATUS DO PEDIDO
                        </h1>
                        <p className="mt-2 text-sm text-neutral-600 font-sans">
                            {statusConfig.description}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm">
                            <StatusIcon status={order.status} />
                            {statusConfig.label}
                        </span>

                        {canCancel && (
                            <button
                                type="button"
                                onClick={() => setCancelModalOpen(true)}
                                className="mt-2 text-xs font-semibold uppercase tracking-wider text-red-600 underline underline-offset-4 hover:text-red-800"
                            >
                                Cancelar Pedido
                            </button>
                        )}
                    </div>
                </div>

                {/* Metadados rápidos */}
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-black/10 pt-6 sm:grid-cols-4">
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-neutral-500 font-medium">
                            Realizado em
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs font-bold text-black font-sans">
                            <Calendar size={13} className="text-neutral-500" />
                            {formatDate(order.created_at)}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-neutral-500 font-medium">
                            CEP Entrega
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 font-mono text-xs font-bold text-black">
                            <MapPin size={13} className="text-neutral-500" />
                            {order.zip_code}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-neutral-500 font-medium">
                            Qtd. Total
                        </span>
                        <span className="mt-1 text-xs font-bold text-black font-sans">
                            {order.items.reduce((acc, i) => acc + i.quantity, 0)} unidades
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-wider text-neutral-500 font-medium">
                            Total Pago
                        </span>
                        <span className="mt-1 font-display font-extrabold text-base text-black">
                            {formatPrice(order.total)}
                        </span>
                    </div>
                </div>
            </section>

            {/* Timeline do Histórico de Status */}
            <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight text-black">
                    HISTÓRICO DE RASTREAMENTO
                </h2>

                {history.length === 0 ? (
                    <p className="mt-4 text-xs text-neutral-500">
                        Nenhuma movimentação registrada até o momento.
                    </p>
                ) : (
                    <ol className="relative mt-8 border-l border-black/10 pl-6 space-y-6">
                        {history.map((step, idx) => {
                            const stepConfig = getStatusConfig(step.status)
                            const isLatest = idx === history.length - 1

                            return (
                                <li key={step.id || idx} className="relative">
                                    <span
                                        className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border bg-white ${
                                            isLatest ? 'border-black text-black' : 'border-neutral-300 text-neutral-400'
                                        }`}
                                    >
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${
                                                isLatest ? 'bg-black' : 'bg-neutral-300'
                                            }`}
                                        />
                                    </span>

                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <span
                                            className={`text-xs font-bold uppercase tracking-wider ${
                                                isLatest ? 'text-black' : 'text-neutral-500'
                                            }`}
                                        >
                                            {stepConfig.label}
                                        </span>
                                        <time className="text-[11px] font-mono text-neutral-400">
                                            {formatDate(step.created_at)}
                                        </time>
                                    </div>
                                    <p className="mt-1 text-xs text-neutral-600 font-sans">
                                        {stepConfig.description}
                                    </p>
                                </li>
                            )
                        })}
                    </ol>
                )}
            </section>

            {/* Itens do Pedido */}
            <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight text-black">
                    ITENS DO PEDIDO ({order.items.length})
                </h2>

                <div className="mt-6 divide-y divide-black/10">
                    {order.items.map((item) => (
                        <div
                            key={item.id}
                            className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="h-16 w-16 rounded-2xl bg-[#F2F0F1] flex items-center justify-center p-2 shrink-0">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-contain mix-blend-multiply"
                                        />
                                    ) : (
                                        <ImageOff size={20} className="text-neutral-400" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-display font-bold text-sm text-black uppercase tracking-tight truncate">
                                        {item.name}
                                    </h4>
                                    <p className="text-xs text-neutral-500 font-sans mt-0.5">
                                        SKU: {item.sku}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                <span className="text-xs text-neutral-600">
                                    Qtd: <strong className="text-black">{item.quantity}</strong>
                                </span>
                                <span className="font-display font-bold text-base text-black">
                                    {formatPrice(item.price * item.quantity)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Resumo */}
                <div className="mt-6 border-t border-black/10 pt-6 space-y-2 text-sm font-sans">
                    <div className="flex justify-between text-neutral-600">
                        <span>Subtotal</span>
                        <span className="font-bold text-black">{formatPrice(order.total)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                        <span>Entrega</span>
                        <span className="text-emerald-600 font-bold uppercase text-xs">Grátis</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-black pt-2 border-t border-black/5">
                        <span>Total</span>
                        <span className="font-display font-extrabold text-xl">{formatPrice(order.total)}</span>
                    </div>
                </div>
            </section>

            {/* Modal de Cancelamento */}
            {cancelModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                >
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-black/10">
                        <h2 className="font-display text-xl font-bold uppercase tracking-tight text-red-600">
                            Confirmar Cancelamento
                        </h2>
                        <p className="mt-2 text-sm text-neutral-600 font-sans">
                            Tem certeza que deseja cancelar o pedido #{order.id}? Os itens retornarão ao estoque.
                        </p>

                        {cancelError && (
                            <div className="mt-3 p-3 rounded-2xl bg-red-50 text-xs text-red-600">
                                {cancelError}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-black/10">
                            <button
                                type="button"
                                onClick={() => setCancelModalOpen(false)}
                                disabled={canceling}
                                className="h-11 px-5 rounded-full border border-black/15 text-xs font-semibold uppercase tracking-wider text-black hover:bg-[#F2F0F1]"
                            >
                                Manter Pedido
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={canceling}
                                className="flex h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-red-700"
                            >
                                {canceling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
