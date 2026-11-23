'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Package,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar,
    MapPin,
    AlertCircle,
    ArrowUpRight,
    ArrowRight,
} from 'lucide-react'
import { OrderResponse } from '@/src/types/order'
import ReadMyOrdersService from '@/src/actions/order/read_my_orders'
import { getStatusConfig } from '@/src/lib/order-status'

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
    const [error, setError] = useState<string>('')

    useEffect(() => {
        let active = true

        ReadMyOrdersService({
            page,
            limit: PAGE_LIMIT,
            status: statusFilter,
        })
            .then((res) => {
                if (!active) return
                setOrders(res.data)
                setTotalPages(res.total_pages)
                setTotalRows(res.total_rows)
            })
            .catch((err: unknown) => {
                if (!active) return
                if (err instanceof Error && err.message === '401') {
                    router.push('/login')
                    return
                }
                setError('Erro ao carregar seus pedidos.')
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [page, statusFilter, router])

    function handleFilterChange(val: string) {
        setStatusFilter(val)
        setPage(1)
        setLoading(true)
        setError('')
    }

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-sans text-black">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6 uppercase tracking-wider font-medium">
                <Link href="/" className="hover:text-black">Início</Link>
                <span>/</span>
                <span className="text-black font-bold">Meus Pedidos</span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-6 mb-8">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-black">
                        MEUS PEDIDOS
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600 font-sans">
                        Acompanhe o status e histórico de todas as suas compras.
                    </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
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
                            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-black text-white shadow-sm'
                                    : 'bg-[#F2F0F1] text-neutral-700 hover:bg-neutral-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                </div>
            )}

            {error && (
                <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-medium border border-red-200 mb-6 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {!loading && !error && orders.length === 0 && (
                <div className="rounded-3xl bg-[#F2F0F1] p-12 text-center max-w-xl mx-auto my-8">
                    <Package size={40} className="mx-auto text-neutral-400 mb-4" />
                    <h3 className="font-display text-xl font-bold uppercase tracking-tight text-black">
                        Nenhum pedido encontrado
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600 font-sans">
                        Você ainda não realizou compras com este filtro.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors"
                    >
                        Começar a Comprar <ArrowRight size={14} />
                    </Link>
                </div>
            )}

            {!loading && !error && orders.length > 0 && (
                <>
                    <ul className="flex flex-col gap-4">
                        {orders.map((order) => {
                            const statusConfig = getStatusConfig(order.status)
                            const totalItems = order.items.reduce((acc, i) => acc + i.quantity, 0)

                            return (
                                <li
                                    key={order.id}
                                    className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6 transition-all hover:border-black/30 hover:shadow-sm"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-4">
                                        <div>
                                            <span className="font-mono text-xs font-bold text-black">
                                                PEDIDO #{order.id}
                                            </span>
                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500 font-sans">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={13} />
                                                    {formatDate(order.created_at)}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1.5 font-mono">
                                                    <MapPin size={13} />
                                                    CEP: {order.zip_code}
                                                </span>
                                            </div>
                                        </div>

                                        <span className="rounded-full bg-[#F2F0F1] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-black">
                                            {statusConfig.label}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                        <div className="text-xs text-neutral-600 font-sans">
                                            <span className="font-bold text-black">{totalItems} {totalItems === 1 ? 'item' : 'itens'}:</span>{' '}
                                            {order.items.map((i) => i.name).slice(0, 2).join(', ')}
                                            {order.items.length > 2 ? '...' : ''}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                                            <div>
                                                <span className="block text-[10px] uppercase tracking-wider text-neutral-500">
                                                    Total
                                                </span>
                                                <span className="font-display font-bold text-base sm:text-lg text-black">
                                                    {formatPrice(order.total)}
                                                </span>
                                            </div>

                                            {order.status === 'PENDING_PAYMENT' && (
                                                <Link
                                                    href={`/pedidos/${order.id}/pagamento`}
                                                    className="flex h-10 items-center gap-1.5 rounded-full bg-black px-5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors"
                                                >
                                                    Pagar Agora
                                                    <ArrowRight size={14} />
                                                </Link>
                                            )}

                                            <Link
                                                href={`/pedidos/${order.id}`}
                                                className="flex h-10 items-center gap-1.5 rounded-full border border-black/15 px-5 text-xs font-semibold uppercase tracking-wider text-black hover:bg-[#F2F0F1] transition-colors"
                                            >
                                                Detalhes
                                                <ArrowUpRight size={14} />
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
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="h-10 px-4 rounded-full border border-black/15 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft size={16} className="inline mr-1" /> Anterior
                            </button>

                            <span className="text-xs text-neutral-600 font-sans font-medium px-2">
                                Página <strong className="text-black">{page}</strong> de {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="h-10 px-4 rounded-full border border-black/15 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] disabled:opacity-40 transition-colors"
                            >
                                Próxima <ChevronRight size={16} className="inline ml-1" />
                            </button>
                        </nav>
                    )}
                </>
            )}
        </main>
    )
}
