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
    CreditCard,
    RotateCcw,
    XCircle,
    Truck,
} from 'lucide-react'
import { OrderResponse, OrderStatusHistoryResponse, OrderStatus } from '@/src/types/order'
import { PaymentResponse } from '@/src/types/payment'
import ReadOrderByIdService from '@/src/actions/order/read_order_by_id'
import ReadOrderHistoryService from '@/src/actions/order/read_order_history'
import ReadPaymentService from '@/src/actions/payment/read_payment'
import AdminUpdateOrderStatusService from '@/src/actions/order/admin_update_order_status'
import AdminApproveRefundService from '@/src/actions/order/admin_approve_refund'
import AdminRejectRefundService from '@/src/actions/order/admin_reject_refund'
import { formatAddressFull } from '@/src/lib/address-rules'
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
    const [payment, setPayment] = useState<PaymentResponse | null>(null)
    const [history, setHistory] = useState<OrderStatusHistoryResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Controle de status logístico
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
    const [trackingCode, setTrackingCode] = useState('')
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [updateError, setUpdateError] = useState('')
    const [updateSuccess, setUpdateSuccess] = useState('')
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)

    // Controle de aprovação/recusa de estorno
    const [approveModalOpen, setApproveModalOpen] = useState(false)
    const [rejectModalOpen, setRejectModalOpen] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [refundActionLoading, setRefundActionLoading] = useState(false)
    const [refundActionError, setRefundActionError] = useState('')

    const loadData = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const [orderData, historyData, paymentData] = await Promise.all([
                ReadOrderByIdService(orderId),
                ReadOrderHistoryService(orderId).catch(() => []),
                ReadPaymentService(orderId).catch(() => null),
            ])
            setOrder(orderData)
            setHistory(historyData)
            setPayment(paymentData)
            setTrackingCode(orderData.tracking_code ?? '')
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
            ReadPaymentService(orderId).catch(() => null),
        ])
            .then(([orderData, historyData, paymentData]) => {
                if (!active) return
                setOrder(orderData)
                setHistory(historyData)
                setPayment(paymentData)
                setTrackingCode(orderData.tracking_code ?? '')
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
                trackingCode: selectedStatus === 'SHIPPED' ? trackingCode : undefined,
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

    async function handleApproveRefund() {
        setRefundActionLoading(true)
        setRefundActionError('')
        setUpdateSuccess('')

        try {
            await AdminApproveRefundService(orderId)
            setApproveModalOpen(false)
            setUpdateSuccess('Estorno aprovado e concluído! O cliente foi notificado por e-mail.')
            await loadData()
        } catch (err: unknown) {
            setRefundActionError(err instanceof Error ? err.message : 'Erro ao aprovar estorno.')
        } finally {
            setRefundActionLoading(false)
        }
    }

    async function handleRejectRefund(e: React.FormEvent) {
        e.preventDefault()
        if (!rejectionReason.trim()) {
            setRefundActionError('Informe a justificativa da recusa.')
            return
        }

        setRefundActionLoading(true)
        setRefundActionError('')
        setUpdateSuccess('')

        try {
            await AdminRejectRefundService(orderId, rejectionReason.trim())
            setRejectModalOpen(false)
            setRejectionReason('')
            setUpdateSuccess('Estorno recusado. O pedido retornou para Entregue e o cliente foi notificado.')
            await loadData()
        } catch (err: unknown) {
            setRefundActionError(err instanceof Error ? err.message : 'Erro ao recusar estorno.')
        } finally {
            setRefundActionLoading(false)
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
                    <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
                        Não foi possível carregar o pedido
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
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
                            <span className="font-mono text-xs uppercase tracking-wider text-neutral-500 font-bold">
                                PEDIDO #{order.id}
                            </span>
                            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">
                                GERENCIAMENTO DO PEDIDO
                            </h1>
                            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
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
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-neutral-500 shrink-0" aria-hidden="true" />
                                    {formatAddressFull(order.address)}
                                </span>
                            </div>
                        </div>

                        <span className="rounded-full bg-black text-white dark:bg-white dark:text-black px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                            {currentConfig.label}
                        </span>
                    </div>

                    {order.tracking_code && (
                        <div className="mt-5 flex items-center gap-2 text-xs font-mono">
                            <Truck size={14} />
                            <span>Rastreio: <strong>{order.tracking_code}</strong></span>
                        </div>
                    )}
                </div>

                {updateSuccess && (
                    <div className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        <CheckCircle size={16} />
                        {updateSuccess}
                    </div>
                )}

                {/* Seção Especial: Aprovação/Recusa de Estorno Solicitado */}
                {order.status === 'REFUND_REQUESTED' && (
                    <section className="mt-8 rounded-3xl border-2 border-purple-500/40 bg-purple-50/70 dark:bg-purple-950/20 p-6 sm:p-8">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <RotateCcw size={20} />
                            <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">
                                SOLICITAÇÃO DE ESTORNO PENDENTE
                            </h2>
                        </div>

                        <div className="mt-4 rounded-2xl bg-white dark:bg-[#181818] border border-black/10 dark:border-white/10 p-4 text-sm">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                Motivo informado pelo cliente
                            </span>
                            <p className="text-black dark:text-white">
                                {order.refund_reason || 'Motivo não informado.'}
                            </p>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setRefundActionError('')
                                    setApproveModalOpen(true)
                                }}
                                className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-600 px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                                <CheckCircle size={15} />
                                Aprovar Estorno
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setRefundActionError('')
                                    setRejectModalOpen(true)
                                }}
                                className="inline-flex h-11 items-center gap-2 rounded-full border border-red-500/50 bg-white dark:bg-[#181818] px-6 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            >
                                <XCircle size={15} />
                                Recusar Estorno
                            </button>
                        </div>
                    </section>
                )}

                {/* Dados do Pagamento */}
                {payment && (
                    <section className="mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard size={18} />
                            <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                                DADOS DO PAGAMENTO
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="block text-neutral-500 uppercase tracking-wider">Método</span>
                                <strong className="mt-1 block">
                                    {payment.method === 'CREDIT_CARD'
                                        ? `Cartão ${payment.card_brand || ''} •••• ${payment.card_last4 || ''}`
                                        : 'Pix'}
                                </strong>
                            </div>
                            <div>
                                <span className="block text-neutral-500 uppercase tracking-wider">Status</span>
                                <strong className="mt-1 block">{payment.status}</strong>
                            </div>
                            <div>
                                <span className="block text-neutral-500 uppercase tracking-wider">Valor</span>
                                <strong className="mt-1 block">{formatPrice(payment.amount)}</strong>
                            </div>
                            <div>
                                <span className="block text-neutral-500 uppercase tracking-wider">Parcelas</span>
                                <strong className="mt-1 block">{payment.installments}x</strong>
                            </div>
                        </div>
                    </section>
                )}

                {/* Seção de Atualização Logística de Status */}
                <section className="mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8">
                    <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                        ATUALIZAR ESTÁGIO LOGÍSTICO
                    </h2>

                    {isFinal || validTransitions.length === 0 ? (
                        <p className="mt-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                            {order.status === 'REFUND_REQUESTED'
                                ? 'Utilize a seção de Solicitação de Estorno acima para aprovar ou recusar.'
                                : `Este pedido está em estágio "${currentConfig.label}" e não possui transições logísticas manuais disponíveis.`}
                        </p>
                    ) : (
                        <div className="mt-6 flex flex-col gap-4">
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
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
                            </div>

                            {selectedStatus === 'SHIPPED' && (
                                <div className="max-w-md">
                                    <label
                                        htmlFor="tracking-code-input"
                                        className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                    >
                                        Código de Rastreio (opcional, enviado no e-mail do cliente)
                                    </label>
                                    <input
                                        id="tracking-code-input"
                                        type="text"
                                        value={trackingCode}
                                        onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                                        placeholder="EX: BR123456789BR"
                                        className="h-11 w-full rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-4 font-mono text-xs uppercase outline-none focus:border-black dark:focus:border-white"
                                    />
                                </div>
                            )}

                            <div>
                                <button
                                    type="button"
                                    onClick={handleInitiateUpdate}
                                    disabled={!selectedStatus || updatingStatus}
                                    className="flex h-11 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black px-6 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                    Confirmar Transição
                                </button>
                            </div>
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
                    <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                        HISTÓRICO DE AUDITORIA
                    </h2>

                    {history.length === 0 ? (
                        <p className="mt-4 text-xs text-neutral-500">Nenhum registro no histórico.</p>
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
                                            <span className="text-xs font-bold uppercase tracking-wider">
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
                    <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                        PRODUTOS DO PEDIDO ({order.items.length})
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
                                                    className="h-full w-full object-contain dark:brightness-95"
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

                    <div className="mt-6 flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-4 text-base font-bold uppercase tracking-tight">
                        <span>Valor Total</span>
                        <span className="font-display font-extrabold text-xl">{formatPrice(order.total)}</span>
                    </div>
                </section>
            </div>

            {/* Modal de Confirmação de Status Logístico */}
            {confirmModalOpen && selectedStatus && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                >
                    <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181818] p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10">
                        <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                            Confirmar Atualização de Status
                        </h2>
                        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                            Deseja alterar o status do pedido #{order.id} de{' '}
                            <strong className="text-black dark:text-white uppercase">{currentConfig.label}</strong> para{' '}
                            <strong className="text-black dark:text-white uppercase">{getStatusConfig(selectedStatus).label}</strong>?
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setConfirmModalOpen(false)}
                                disabled={updatingStatus}
                                className="h-11 px-5 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] dark:hover:bg-[#252525] cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmStatusUpdate}
                                disabled={updatingStatus}
                                className="flex h-11 items-center justify-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-6 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
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

            {/* Modal de Aprovação de Estorno */}
            {approveModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                >
                    <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181818] p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10">
                        <h2 className="font-display text-xl font-bold uppercase tracking-tight text-emerald-600 dark:text-emerald-400">
                            Aprovar Estorno
                        </h2>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            Confirma a aprovação do estorno de <strong>{formatPrice(order.total)}</strong> para o pedido #{order.id}? O pagamento e o pedido serão marcados como <strong>Estornado</strong> e o cliente será notificado por e-mail.
                        </p>

                        {refundActionError && (
                            <div className="mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-xs text-red-600 dark:text-red-400">
                                {refundActionError}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setApproveModalOpen(false)}
                                disabled={refundActionLoading}
                                className="h-11 px-5 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleApproveRefund}
                                disabled={refundActionLoading}
                                className="flex h-11 items-center gap-2 rounded-full bg-emerald-600 px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
                            >
                                {refundActionLoading ? 'Aprovando...' : 'Confirmar Aprovação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Recusa de Estorno */}
            {rejectModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                >
                    <form
                        onSubmit={handleRejectRefund}
                        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181818] p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10"
                    >
                        <h2 className="font-display text-xl font-bold uppercase tracking-tight text-red-600 dark:text-red-400">
                            Recusar Estorno
                        </h2>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            O pedido voltará para o status <strong>Entregue</strong> e a justificativa abaixo será enviada ao cliente por e-mail.
                        </p>

                        <div className="mt-4">
                            <label
                                htmlFor="reject-reason-input"
                                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                            >
                                Justificativa da Recusa *
                            </label>
                            <textarea
                                id="reject-reason-input"
                                rows={3}
                                required
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                disabled={refundActionLoading}
                                placeholder="Explique o motivo da recusa..."
                                className="w-full rounded-2xl border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] p-3.5 text-sm outline-none focus:border-black dark:focus:border-white"
                            />
                        </div>

                        {refundActionError && (
                            <div className="mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-xs text-red-600 dark:text-red-400">
                                {refundActionError}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setRejectModalOpen(false)}
                                disabled={refundActionLoading}
                                className="h-11 px-5 rounded-full border border-black/15 dark:border-white/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={refundActionLoading}
                                className="flex h-11 items-center gap-2 rounded-full bg-red-600 px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer"
                            >
                                {refundActionLoading ? 'Enviando...' : 'Confirmar Recusa'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    )
}
