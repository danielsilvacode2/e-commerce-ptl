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
    AlertCircle,
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
    { label: 'Em Separação', value: 'PREPARING' },
    { label: 'Enviados', value: 'SHIPPED' },
    { label: 'Entregues', value: 'DELIVERED' },
    { label: 'Cancelados', value: 'CANCELED' },
]

export default function AdminOrdersClient() {
    const [orders, setOrders] = useState<OrderResponse[]>([])
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [userFilter, setUserFilter] = useState<string>('')
    const [page, setPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [totalRows, setTotalRows] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        let active = true

        AdminReadAllOrdersService({
            page,
            limit: PAGE_LIMIT,
            status: statusFilter,
            userId: userFilter.trim(),
        })
            .then((res) => {
                if (!active) return
                setOrders(res.data)
                setTotalPages(res.total_pages)
                setTotalRows(res.total_rows)
            })
            .catch((err: unknown) => {
                if (!active) return
                setError(err instanceof Error ? err.message : 'Erro ao listar pedidos do painel.')
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [page, statusFilter, userFilter])

    function handleFilterChange(val: string) {
        setStatusFilter(val)
        setPage(1)
        setLoading(true)
        setError('')
    }

    return (
        <main className="min-h-screen flex-1 bg-white px-6 py-8 font-sans text-black">
            <div className="mx-auto w-full max-w-5xl">
                {/* Cabeçalho */}
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-6">
                    <div>
                        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-black">
                            GERENCIAR PEDIDOS
                        </h1>
                        <p className="mt-1 text-sm text-neutral-600 font-sans">
                            Visualize pedidos dos clientes e gerencie suas etapas de envio.
                        </p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        {totalRows} {totalRows === 1 ? 'pedido' : 'pedidos'}
                    </span>
                </header>

                {/* Filtros em Abas Pílula + Busca por User ID */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
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
                                            ? 'bg-black text-white'
                                            : 'bg-[#F2F0F1] text-neutral-700 hover:bg-neutral-200'
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
                            className="h-10 w-full rounded-full border border-transparent bg-[#F2F0F1] pl-10 pr-4 text-xs font-mono text-black outline-none placeholder:font-sans placeholder:text-neutral-500 focus:border-black/20 focus:bg-white"
                        />
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-black" />
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-medium border border-red-200">
                        {error}
                    </div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="mt-8 rounded-3xl bg-[#F2F0F1] p-12 text-center">
                        <ShoppingBag size={36} className="mx-auto text-neutral-400 mb-3" />
                        <p className="text-sm font-semibold uppercase tracking-wider text-black">
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
                                        className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6 transition-all hover:border-black/30 hover:shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-4">
                                            <div>
                                                <span className="font-mono text-xs font-bold text-black">
                                                    PEDIDO #{order.id}
                                                </span>
                                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500 font-sans">
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

                                            <span className="rounded-full bg-[#F2F0F1] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-black">
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <p className="flex items-center gap-1.5 text-xs text-neutral-700 font-medium">
                                                    <User size={13} className="text-neutral-400" />
                                                    Cliente: <strong className="text-black">{order.user?.name || 'Não informado'}</strong> ({order.user?.email || '—'})
                                                </p>
                                                <p className="mt-1 text-xs text-neutral-500">
                                                    {totalItems} {totalItems === 1 ? 'item' : 'itens'} no total
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <span className="block text-[10px] uppercase tracking-wider text-neutral-500">
                                                        Valor
                                                    </span>
                                                    <span className="font-display font-bold text-base text-black">
                                                        {formatPrice(order.total)}
                                                    </span>
                                                </div>

                                                <Link
                                                    href={`/admin/pedidos/${order.id}`}
                                                    className="flex h-10 items-center gap-1.5 rounded-full border border-black/15 px-5 text-xs font-semibold uppercase tracking-wider text-black hover:bg-[#F2F0F1] transition-colors"
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
            </div>
        </main>
    )
}
