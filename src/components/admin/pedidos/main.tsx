'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ShoppingBag,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar,
    MapPin,
    ArrowUpRight,
    Search,
    User,
} from 'lucide-react'
import { OrderResponse } from '@/src/types/order'
import AdminReadAllOrdersService from '@/src/actions/order/admin_read_all_orders'
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
    { label: 'Estornos Solicitados', value: 'REFUND_REQUESTED' },
    { label: 'Aguardando Pagamento', value: 'PENDING_PAYMENT' },
    { label: 'Em Preparação', value: 'PREPARING' },
    { label: 'Enviados', value: 'SHIPPED' },
    { label: 'Entregues', value: 'DELIVERED' },
    { label: 'Estornados', value: 'REFUNDED' },
    { label: 'Cancelados', value: 'CANCELED' },
]

export default function AdminOrdersClient() {
    const [orders, setOrders] = useState<OrderResponse[]>([])
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [userFilter, setUserFilter] = useState<string>('')
    const [debouncedUserFilter, setDebouncedUserFilter] = useState<string>('')
    const [page, setPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [totalRows, setTotalRows] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedUserFilter(userFilter.trim())
        }, 350)
        return () => clearTimeout(timer)
    }, [userFilter])

    useEffect(() => {
        const controller = new AbortController()

        AdminReadAllOrdersService({
            page,
            limit: PAGE_LIMIT,
            status: statusFilter,
            userId: debouncedUserFilter,
            signal: controller.signal,
        })
            .then((res) => {
                if (controller.signal.aborted) return
                setOrders(res.data)
                setTotalPages(res.total_pages)
                setTotalRows(res.total_rows)
                setError('')
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted) return
                setError(err instanceof Error ? err.message : 'Erro ao listar pedidos do painel.')
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })

        return () => {
            controller.abort()
        }
    }, [page, statusFilter, debouncedUserFilter])

    function handleFilterChange(val: string) {
        setStatusFilter(val)
        setPage(1)
        setLoading(true)
        setError('')
    }

    return (
        <main className="min-h-screen flex-1 bg-white dark:bg-[#121212] px-6 py-8 font-sans text-black dark:text-white transition-colors">
            <div className="mx-auto w-full max-w-5xl">
                {/* Cabeçalho */}
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
                    <div>
                        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-black dark:text-white">
                            GERENCIAR PEDIDOS
                        </h1>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 font-sans">
                            Visualize pedidos dos clientes e gerencie suas etapas de envio.
                        </p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        {totalRows} {totalRows === 1 ? 'pedido' : 'pedidos'}
                    </span>
                </header>

                {/* Filtros em Abas Pílula + Busca por User ID */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
                    <div className="flex flex-wrap gap-2">
                        {FILTER_TABS.map((tab) => {
                            const isActive = statusFilter === tab.value
                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => handleFilterChange(tab.value)}
                                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                                        isActive
                                            ? 'bg-black text-white dark:bg-white dark:text-black'
                                            : 'bg-[#F2F0F1] dark:bg-[#1f1f1f] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#282828]'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                            <Search size={14} />
                        </span>
                        <input
                            type="search"
                            value={userFilter}
                            onChange={(e) => {
                                setUserFilter(e.target.value)
                                setPage(1)
                            }}
                            placeholder="Filtrar por User ID..."
                            className="h-10 w-full rounded-full border border-transparent bg-[#F2F0F1] dark:bg-[#1f1f1f] pl-10 pr-4 text-xs font-mono text-black dark:text-white outline-none placeholder:font-sans placeholder:text-neutral-500 focus:border-black/20 dark:focus:border-white/20 focus:bg-white dark:focus:bg-[#181818]"
                        />
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-black dark:text-white" />
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-900/50">
                        {error}
                    </div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="mt-8 rounded-3xl bg-[#F2F0F1] dark:bg-[#181818] p-12 text-center">
                        <ShoppingBag size={36} className="mx-auto text-neutral-400 mb-3" />
                        <p className="text-sm font-semibold uppercase tracking-wider text-black dark:text-white">
                            Nenhum pedido encontrado.
                        </p>
                    </div>
                )}

                {/* Lista de Pedidos */}
                {!loading && !error && orders.length > 0 && (
                    <>
                        <ul className="mt-6 flex flex-col gap-4">
                            {orders.map((order) => {
                                const statusConfig = getStatusConfig(order.status)
                                const totalItems = order.items.reduce((acc, i) => acc + i.quantity, 0)

                                return (
                                    <li
                                        key={order.id}
                                        className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-5 sm:p-6 transition-all hover:border-black/30 dark:hover:border-white/30 hover:shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
                                            <div>
                                                <span className="font-mono text-xs font-bold text-black dark:text-white">
                                                    PEDIDO #{order.id}
                                                </span>
                                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar size={12} />
                                                        {formatDate(order.created_at)}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1.5 font-mono">
                                                        <MapPin size={12} />
                                                        CEP: {order.zip_code}
                                                    </span>
                                                </div>
                                            </div>

                                            <span
                                                className={`rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
                                                    order.status === 'REFUND_REQUESTED'
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-[#F2F0F1] dark:bg-[#252525] text-black dark:text-white'
                                                }`}
                                            >
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        {order.status === 'REFUND_REQUESTED' && order.refund_reason && (
                                            <div className="mt-3 rounded-2xl border border-purple-500/30 bg-purple-50 dark:bg-purple-950/30 px-4 py-2.5 text-xs text-purple-900 dark:text-purple-200">
                                                <strong>Motivo do estorno:</strong> {order.refund_reason}
                                            </div>
                                        )}

                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <p className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                                                    <User size={13} className="text-neutral-400" />
                                                    Cliente: <strong className="text-black dark:text-white">{order.user?.name || 'Não informado'}</strong> ({order.user?.email || '—'})
                                                </p>
                                                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                                    {totalItems} {totalItems === 1 ? 'item' : 'itens'} no total
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <span className="block text-[10px] uppercase tracking-wider text-neutral-500">
                                                        Valor
                                                    </span>
                                                    <span className="font-display font-bold text-base text-black dark:text-white">
                                                        {formatPrice(order.total)}
                                                    </span>
                                                </div>

                                                <Link
                                                    href={`/admin/pedidos/${order.id}`}
                                                    className="flex h-10 items-center gap-1.5 rounded-full border border-black/15 dark:border-white/20 px-5 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] transition-colors"
                                                >
                                                    Gerenciar
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
                                aria-label="Paginação de pedidos do admin"
                                className="mt-10 flex items-center justify-center gap-3"
                            >
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="h-10 px-4 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] disabled:opacity-40 transition-colors"
                                >
                                    <ChevronLeft size={16} className="inline mr-1" /> Anterior
                                </button>

                                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-sans font-medium px-2">
                                    Página <strong className="text-black dark:text-white">{page}</strong> de {totalPages}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="h-10 px-4 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] disabled:opacity-40 transition-colors"
                                >
                                    Próxima <ChevronRight size={16} className="inline ml-1" />
                                </button>
                            </nav>
                        )}
                    </>
                )}
            </div>
        </main>
    )
}
