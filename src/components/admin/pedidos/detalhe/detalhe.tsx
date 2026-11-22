'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Calendar,
    MapPin,
    User,
    ImageOff,
    CheckCircle,
} from 'lucide-react'
import { OrderResponse, OrderStatusHistoryResponse, OrderStatus } from '@/src/types/order'
import ReadOrderByIdService from '@/src/actions/order/read_order_by_id'
import ReadOrderHistoryService from '@/src/actions/order/read_order_history'
import AdminUpdateOrderStatusService from '@/src/actions/order/admin_update_order_status'
import {
    getStatusConfig,
    VALID_STATUS_TRANSITIONS,
    isFinalStatus,
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

interface AdminOrderDetailClientProps {
    orderId: string
}

export default function AdminOrderDetailClient({ orderId }: AdminOrderDetailClientProps) {
    const router = useRouter()
    const [order, setOrder] = useState<OrderResponse | null>(null)
    const [history, setHistory] = useState<OrderStatusHistoryResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Controle de status
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [updateError, setUpdateError] = useState('')
    const [updateSuccess, setUpdateSuccess] = useState('')

    // Modal de confirmação
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)

    const loadData = useCallback(async () => {
        setLoading(true)
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
            setError(err instanceof Error ? err.message : 'Erro ao buscar dados do pedido.')
        } finally {
            setLoading(false)
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
                setError(err instanceof Error ? err.message : 'Erro ao buscar dados do pedido.')
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [orderId, router])

    function handleInitiateUpdate() {
        if (!selectedStatus) return
        setUpdateError('')
        setUpdateSuccess('')
        setConfirmModalOpen(true)
    }

    async function handleConfirmStatusUpdate() {
        if (!selectedStatus) return
        setUpdatingStatus(true)
        setUpdateError('')
        setUpdateSuccess('')

        try {
            await AdminUpdateOrderStatusService({
                orderId,
                status: selectedStatus,
            })
            setUpdateSuccess(`Status atualizado com sucesso para ${getStatusConfig(selectedStatus).label}.`)
            setConfirmModalOpen(false)
            setSelectedStatus('')
            await loadData()
        } catch (err: unknown) {
            setUpdateError(err instanceof Error ? err.message : 'Falha ao atualizar status.')
        } finally {
            setUpdatingStatus(false)
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen flex-1 bg-white dark:bg-[#121212] px-6 py-12 flex flex-col items-center justify-center font-sans text-black dark:text-white transition-colors">
                <Loader2 size={32} className="animate-spin text-black dark:text-white" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Carregando detalhes do pedido para o admin...
                </p>
            </main>
        )
    }

    if (error || !order) {
        return (
            <main className="min-h-screen flex-1 bg-white dark:bg-[#121212] px-6 py-12 font-sans text-black dark:text-white transition-colors">
                <div className="mx-auto max-w-4xl rounded-3xl bg-[#F2F0F1] dark:bg-[#181818] p-8 text-center">
                    <AlertCircle size={32} className="mx-auto text-black dark:text-white mb-3" />
                    <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-black dark:text-white">
                        Não foi possível carregar o pedido
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 font-sans">
                        {error || 'Pedido inexistente ou dados indisponíveis.'}
                    </p>
                    <div className="mt-6 flex justify-center gap-4">
                        <Link
                            href="/admin/pedidos"
                            className="rounded-full bg-black text-white dark:bg-white dark:text-black px-6 py-3 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                        >
                            Voltar para Listagem
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    const currentConfig = getStatusConfig(order.status)
    const validTransitions = VALID_STATUS_TRANSITIONS[order.status] ?? []
    const isFinal = isFinalStatus(order.status)

    return (
        <main className="min-h-screen flex-1 bg-white dark:bg-[#121212] px-6 py-8 font-sans text-black dark:text-white transition-colors">
            <div className="mx-auto max-w-4xl">
                {/* Voltar */}
                <div className="border-b border-black/10 dark:border-white/10 pb-4 mb-8">
                    <Link
                        href="/admin/pedidos"
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Voltar para Pedidos (Admin)
                    </Link>
                </div>

                {/* Header do Pedido */}
                <div className="rounded-3xl bg-[#F2F0F1] dark:bg-[#181818] p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <span className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                                PEDIDO #{order.id}
                            </span>
                            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black dark:text-white">
                                GERENCIAMENTO DO PEDIDO
                            </h1>
                            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                                <span className="flex items-center gap-1.5">
                                    <User size={14} className="text-black dark:text-white" />
                                    Cliente: <strong className="text-black dark:text-white">{order.user?.name}</strong> ({order.user?.email})
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-neutral-500" />
                                    {formatDate(order.created_at)}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5 font-mono">
                                    <MapPin size={14} className="text-neutral-500" />
                                    CEP: {order.zip_code}
                                </span>
                            </div>
                        </div>

                        <span className="rounded-full bg-black text-white dark:bg-white dark:text-black px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                            {currentConfig.label}
                        </span>
                    </div>
                </div>

                {/* Seção de Atualização de Status */}
                <section className="mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8">
                    <h2 className="font-display text-xl font-bold uppercase tracking-tight text-black dark:text-white">
                        ATUALIZAR STATUS DO PEDIDO
                    </h2>

                    {isFinal ? (
                        <p className="mt-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                            Este pedido está em estágio final ({currentConfig.label}) e não permite mais alterações de status.
                        </p>
                    ) : (
                        <div className="mt-6 flex flex-col gap-4">
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                                Status atual: <strong className="text-black dark:text-white uppercase">{currentConfig.label}</strong>. Selecione a próxima transição permitida:
                            </p>

                            <div className="flex flex-wrap items-center gap-3">
                                {validTransitions.map((nextStatus) => {
                                    const nextConfig = getStatusConfig(nextStatus)
                                    const isSelected = selectedStatus === nextStatus

                                    return (
                                        <button
                                            key={nextStatus}
                                            type="button"
                                            onClick={() => setSelectedStatus(nextStatus)}
                                            className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                                                isSelected
                                                    ? 'bg-black text-white dark:bg-white dark:text-black'
                                                    : 'bg-[#F2F0F1] dark:bg-[#252525] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#303030]'
                                            }`}
                                        >
                                            Avançar para: {nextConfig.label}
                                        </button>
                                    )
                                })}

                                <button
                                    type="button"
                                    onClick={handleInitiateUpdate}
                                    disabled={!selectedStatus || updatingStatus}
                                    className="ml-auto flex h-11 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black px-6 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                    Confirmar Transição
                                </button>
                            </div>
                        </div>
                    )}

                    {updateSuccess && (
                        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            <CheckCircle size={16} />
                            {updateSuccess}
                        </div>
                    )}

                    {updateError && (
                        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-4 text-xs font-medium text-red-600 dark:text-red-400">
                            <AlertCircle size={16} />
                            {updateError}
                        </div>
                    )}
                </section>

                {/* Timeline de Histórico */}
                <section className="mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8">
                    <h2 className="font-display text-xl font-bold uppercase tracking-tight text-black dark:text-white">
                        HISTÓRICO DE AUDITORIA
                    </h2>

                    {history.length === 0 ? (
                        <p className="mt-4 text-xs text-neutral-500">
                            Nenhum registro no histórico.
                        </p>
                    ) : (
                        <ol className="relative mt-6 border-l border-black/10 dark:border-white/10 pl-6 space-y-4">
                            {history.map((step, idx) => {
                                const stepConfig = getStatusConfig(step.status)
                                return (
                                    <li key={step.id || idx} className="relative">
                                        <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border border-black dark:border-white bg-white dark:bg-[#121212]">
                                            <span className="h-2 w-2 rounded-full bg-black dark:bg-white" />
                                        </span>
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                                                {stepConfig.label}
                                            </span>
                                            <time className="font-mono text-[11px] text-neutral-400">
                                                {formatDate(step.created_at)}
                                            </time>
                                        </div>
                                    </li>
                                )
                            })}
                        </ol>
                    )}
                </section>

                {/* Produtos do Pedido */}
                <section className="mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8">
                    <h2 className="font-display text-xl font-bold uppercase tracking-tight text-black dark:text-white">
                        PRODUTOS DO PEDIDO ({order.items.length})
                    </h2>

                    <div className="mt-6 divide-y divide-black/10 dark:divide-white/10">
                        {order.items.map((item) => (
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
                                                className="h-full w-full object-contain dark:brightness-95"
                                            />
                                        ) : (
                                            <ImageOff size={20} className="text-neutral-400" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-display font-bold text-sm text-black dark:text-white uppercase tracking-tight truncate">
                                            {item.name}
                                        </h4>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                                            SKU: {item.sku}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Qtd: <strong className="text-black dark:text-white">{item.quantity}</strong>
                                    </span>
                                    <span className="font-display font-bold text-base text-black dark:text-white">
                                        {formatPrice(item.price * item.quantity)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-4 text-base font-bold uppercase tracking-tight text-black dark:text-white">
                        <span>Valor Total</span>
                        <span className="font-display font-extrabold text-xl">{formatPrice(order.total)}</span>
                    </div>
                </section>
            </div>

            {/* Modal de Confirmação */}
            {confirmModalOpen && selectedStatus && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                >
                    <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181818] p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10 text-black dark:text-white">
                        <h2 className="font-display text-xl font-bold uppercase tracking-tight text-black dark:text-white">
                            Confirmar Atualização de Status
                        </h2>
                        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 font-sans">
                            Deseja alterar o status do pedido #{order.id} de{' '}
                            <strong className="text-black dark:text-white uppercase">{currentConfig.label}</strong> para{' '}
                            <strong className="text-black dark:text-white uppercase">{getStatusConfig(selectedStatus).label}</strong>?
                        </p>

                        {selectedStatus === 'CANCELED' && (
                            <div className="mt-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400">
                                Atenção: O cancelamento restaurará os itens no estoque e não poderá ser revertido.
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setConfirmModalOpen(false)}
                                disabled={updatingStatus}
                                className="h-11 px-5 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmStatusUpdate}
                                disabled={updatingStatus}
                                className="flex h-11 items-center justify-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-6 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors"
                            >
                                {updatingStatus ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Atualizando...
                                    </>
                                ) : (
                                    'Confirmar Alteração'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
