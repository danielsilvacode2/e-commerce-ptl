'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    CreditCard,
    ImageOff,
    Loader2,
    Lock,
    QrCode,
    RefreshCw,
    ShieldCheck,
    XCircle,
} from 'lucide-react'
import { OrderResponse } from '@/src/types/order'
import { PaymentMethod, PaymentResponse } from '@/src/types/payment'
import ReadOrderByIdService from '@/src/actions/order/read_order_by_id'
import ReadPaymentService from '@/src/actions/payment/read_payment'
import ProcessPaymentService from '@/src/actions/payment/process_payment'
import ConfirmPaymentService, { ConfirmPaymentAction } from '@/src/actions/payment/confirm_payment'
import { formatAddressFull } from '@/src/lib/address-rules'
import { isMercadoPagoEnabled, preloadMercadoPagoSDK, tokenizeCardWithMercadoPago } from '@/src/lib/mercado-pago'
import { classifyErrorVariant, ErrorStateVariant, logClientError } from '@/src/lib/api-error'
import ErrorState from '@/src/components/ui/error-state'
import { PaymentPageSkeleton } from '@/src/components/ui/skeletons'

const formatPrice = (value: number | string) =>
    Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function generateIdempotencyKey(orderId: string, method: PaymentMethod): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${orderId}:${method}:${crypto.randomUUID()}`
    }
    return `${orderId}:${method}:${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length > 2) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`
    }
    return digits
}

function formatRemaining(ms: number): string {
    if (ms <= 0) return '00:00'
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

interface OrderPaymentClientProps {
    orderId: string
}

export default function OrderPaymentClient({ orderId }: OrderPaymentClientProps) {
    const router = useRouter()

    const [order, setOrder] = useState<OrderResponse | null>(null)
    const [payment, setPayment] = useState<PaymentResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [errorVariant, setErrorVariant] = useState<ErrorStateVariant | null>(null)

    // Abas Pix / Cartao
    const [activeTab, setActiveTab] = useState<PaymentMethod>('PIX')
    const [processing, setProcessing] = useState(false)
    const [actionError, setActionError] = useState('')
    const [copied, setCopied] = useState(false)

    // Timer de expiracao (nowTs atualizado apenas no callback do intervalo para evitar setState sincrono no effect)
    const [nowTs, setNowTs] = useState<number | null>(null)

    // Formulario de Cartao de Credito
    const [cardNumber, setCardNumber] = useState('')
    const [cardHolderName, setCardHolderName] = useState('')
    const [payerCpf, setPayerCpf] = useState('')
    const [cardExpiry, setCardExpiry] = useState('')
    const [cardCvv, setCardCvv] = useState('')
    const [installments, setInstallments] = useState<number>(1)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const mpEnabled = isMercadoPagoEnabled()

    // Chaves de idempotencia estaveis por tentativa (evita cobranca duplicada em clique duplo ou retry)
    const pixIdempotencyKeyRef = useRef<string | null>(null)
    const cardIdempotencyKeyRef = useRef<string | null>(null)
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const inFlightRef = useRef<boolean>(false)
    const expiryRefreshTriggeredRef = useRef<boolean>(false)

    const loadData = useCallback(
        async (silent = false) => {
            if (silent && inFlightRef.current) return
            inFlightRef.current = true
            if (!silent) {
                setLoading(true)
                setErrorVariant(null)
            }
            try {
                const [orderData, paymentData] = await Promise.all([
                    ReadOrderByIdService(orderId),
                    ReadPaymentService(orderId).catch(() => null),
                ])
                setOrder(orderData)
                setPayment(paymentData)
            } catch (err: unknown) {
                if (err instanceof Error && err.message === '401') {
                    router.push(`/login?redirect=/pedidos/${orderId}/pagamento`)
                    return
                }
                logClientError('OrderPaymentClient', err, { orderId, silent })
                if (!silent) {
                    setErrorVariant(classifyErrorVariant(err))
                }
            } finally {
                inFlightRef.current = false
                if (!silent) setLoading(false)
            }
        },
        [orderId, router]
    )

    useEffect(() => {
        let active = true

        Promise.all([
            ReadOrderByIdService(orderId),
            ReadPaymentService(orderId).catch(() => null),
        ])
            .then(([orderData, paymentData]) => {
                if (!active) return
                setOrder(orderData)
                setPayment(paymentData)
                setNowTs(Date.now())
            })
            .catch((err: unknown) => {
                if (!active) return
                if (err instanceof Error && err.message === '401') {
                    router.push(`/login?redirect=/pedidos/${orderId}/pagamento`)
                    return
                }
                logClientError('OrderPaymentClient:init', err, { orderId })
                setErrorVariant(classifyErrorVariant(err))
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [orderId, router])

    // Pré-carrega o SDK do Mercado Pago ao abrir a aba de cartão de crédito
    useEffect(() => {
        if (mpEnabled && activeTab === 'CREDIT_CARD') {
            preloadMercadoPagoSDK()
        }
    }, [mpEnabled, activeTab])

    const orderStatus = order?.status

    // Polling controlado enquanto o pedido estiver aguardando pagamento (pausa com a aba oculta)
    useEffect(() => {
        if (orderStatus !== 'PENDING_PAYMENT') {
            if (pollingRef.current) clearInterval(pollingRef.current)
            return
        }

        const tick = () => {
            if (typeof document !== 'undefined' && document.hidden) return
            void loadData(true)
        }

        pollingRef.current = setInterval(tick, 6000)

        const handleVisibilityChange = () => {
            if (typeof document !== 'undefined' && !document.hidden) {
                void loadData(true)
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [orderStatus, loadData])

    // Cronometro de expiracao em tempo real (dispara refresh de expiração apenas uma vez)
    useEffect(() => {
        if (!payment?.expires_at || payment.status !== 'PENDING') {
            expiryRefreshTriggeredRef.current = false
            return
        }

        const target = new Date(payment.expires_at).getTime()
        if (isNaN(target)) return

        expiryRefreshTriggeredRef.current = false

        const timer = setInterval(() => {
            const current = Date.now()
            setNowTs(current)
            if (target - current <= 0 && !expiryRefreshTriggeredRef.current) {
                expiryRefreshTriggeredRef.current = true
                clearInterval(timer)
                void loadData(true)
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [payment?.expires_at, payment?.status, loadData])

    const remainingMs =
        payment?.expires_at && payment.status === 'PENDING' && nowTs !== null
            ? Math.max(0, new Date(payment.expires_at).getTime() - nowTs)
            : null

    async function handleGeneratePix() {
        if (processing) return
        setProcessing(true)
        setActionError('')

        if (!pixIdempotencyKeyRef.current) {
            pixIdempotencyKeyRef.current = generateIdempotencyKey(orderId, 'PIX')
        }

        try {
            const res = await ProcessPaymentService({
                orderId,
                idempotencyKey: pixIdempotencyKeyRef.current,
                payload: { method: 'PIX' },
            })
            setPayment(res)
            await loadData(true)
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Erro ao gerar cobrança Pix.')
        } finally {
            setProcessing(false)
        }
    }

    async function handleCopyPix() {
        if (!payment?.pix_copy_paste) return
        try {
            await navigator.clipboard.writeText(payment.pix_copy_paste)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch {
            setActionError('Não foi possível copiar automaticamente. Selecione e copie o código manualmente.')
        }
    }

    async function handleSimulatePix(action: ConfirmPaymentAction) {
        if (processing) return
        setProcessing(true)
        setActionError('')
        try {
            const updated = await ConfirmPaymentService(orderId, action)
            setPayment(updated)
            await loadData(true)
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Erro ao confirmar pagamento.')
        } finally {
            setProcessing(false)
        }
    }

    function validateCardForm(): boolean {
        const errs: Record<string, string> = {}
        const digits = cardNumber.replace(/\D/g, '')
        if (digits.length < 13 || digits.length > 19) {
            errs.cardNumber = 'Informe um número de cartão válido (13 a 19 dígitos).'
        }
        if (cardHolderName.trim().length < 3) {
            errs.cardHolderName = 'Informe o nome impresso no cartão.'
        }
        const cpfDigits = payerCpf.replace(/\D/g, '')
        if (mpEnabled && cpfDigits.length !== 11) {
            errs.payerCpf = 'Informe um CPF válido (11 dígitos).'
        }
        const [mmStr, yyStr] = cardExpiry.split('/')
        const mm = Number(mmStr)
        const yy = yyStr ? 2000 + Number(yyStr) : 0
        const now = new Date()
        if (!mm || mm < 1 || mm > 12 || !yyStr || yyStr.length !== 2) {
            errs.cardExpiry = 'Informe a validade no formato MM/AA.'
        } else if (yy < now.getFullYear() || (yy === now.getFullYear() && mm < now.getMonth() + 1)) {
            errs.cardExpiry = 'Cartão expirado.'
        }
        const cvvDigits = cardCvv.replace(/\D/g, '')
        if (cvvDigits.length < 3 || cvvDigits.length > 4) {
            errs.cardCvv = 'CVV deve ter 3 ou 4 dígitos.'
        }
        setFieldErrors(errs)
        return Object.keys(errs).length === 0
    }

    async function handleSubmitCard(e: React.FormEvent) {
        e.preventDefault()
        if (processing) return
        setActionError('')

        if (!validateCardForm()) return

        setProcessing(true)
        if (!cardIdempotencyKeyRef.current) {
            cardIdempotencyKeyRef.current = generateIdempotencyKey(orderId, 'CREDIT_CARD')
        }

        const [mmStr, yyStr] = cardExpiry.split('/')
        const cpfDigits = payerCpf.replace(/\D/g, '')

        try {
            let payload: Parameters<typeof ProcessPaymentService>[0]['payload']

            if (mpEnabled) {
                const { cardToken, paymentMethodId } = await tokenizeCardWithMercadoPago({
                    cardNumber,
                    cardHolderName,
                    expMonth: mmStr,
                    expYear: yyStr,
                    cvv: cardCvv,
                    cpf: cpfDigits,
                })

                payload = {
                    method: 'CREDIT_CARD',
                    installments,
                    card_token: cardToken,
                    payment_method_id: paymentMethodId,
                    payer_doc_type: 'CPF',
                    payer_doc_number: cpfDigits,
                }
            } else {
                payload = {
                    method: 'CREDIT_CARD',
                    installments,
                    card_number: cardNumber.replace(/\D/g, ''),
                    card_holder_name: cardHolderName.trim().toUpperCase(),
                    card_exp_month: Number(mmStr),
                    card_exp_year: 2000 + Number(yyStr),
                    card_cvv: cardCvv.replace(/\D/g, ''),
                }
            }

            const res = await ProcessPaymentService({
                orderId,
                idempotencyKey: cardIdempotencyKeyRef.current,
                payload,
            })
            setPayment(res)
            await loadData(true)
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Erro ao processar cartão de crédito.')
        } finally {
            setProcessing(false)
        }
    }

    if (loading) {
        return <PaymentPageSkeleton />
    }

    if (errorVariant || !order) {
        return (
            <main className="mx-auto max-w-2xl px-4 py-16">
                <ErrorState
                    variant={errorVariant ?? 'not-found'}
                    title={
                        errorVariant === 'not-found' || !order
                            ? 'Pedido não encontrado'
                            : undefined
                    }
                    onRetry={() => loadData(false)}
                    autoFocusRetry
                    secondaryHref="/pedidos"
                    secondaryLabel="Meus Pedidos"
                />
            </main>
        )
    }

    const isApproved = order.status === 'PREPARING' || payment?.status === 'APPROVED'
    const isCanceledOrFailed =
        order.status === 'CANCELED' || payment?.status === 'FAILED' || payment?.status === 'EXPIRED'
    const hasPixReady = Boolean(payment?.pix_qr_code && payment?.pix_copy_paste && payment?.status === 'PENDING')

    return (
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-sans">
            {/* Breadcrumb / Voltar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-4 mb-8">
                <Link
                    href={`/pedidos/${order.id}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} />
                    Ver Detalhes do Pedido
                </Link>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <Lock size={14} />
                    Ambiente Seguro &amp; Idempotente
                </span>
            </div>

            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
                        PEDIDO #{order.id}
                    </span>
                    <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">
                        PAGAMENTO DO PEDIDO
                    </h1>
                </div>

                {order.status === 'PENDING_PAYMENT' && remainingMs !== null && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#F2F0F1] dark:bg-[#1f1f1f] px-5 py-2.5 text-xs font-bold uppercase tracking-wider">
                        <Clock size={15} className="text-amber-600 dark:text-amber-400" />
                        <span>Expira em:</span>
                        <span className="font-mono text-sm">{formatRemaining(remainingMs)}</span>
                    </div>
                )}
            </div>

            {/* Estado: Pagamento Aprovado */}
            {isApproved && (
                <section className="rounded-3xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 p-8 sm:p-10 text-center max-w-2xl mx-auto">
                    <CheckCircle2 size={48} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-4" />
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-emerald-900 dark:text-emerald-200">
                        Pagamento Aprovado!
                    </h2>
                    <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
                        Seu pagamento de <strong>{formatPrice(order.total)}</strong> foi confirmado e o pedido já entrou{' '}
                        <strong>Em Preparação</strong>. Enviamos a confirmação para o seu e-mail.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link
                            href={`/pedidos/${order.id}`}
                            className="inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-8 py-3.5 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                        >
                            Acompanhar Pedido <ArrowRight size={15} />
                        </Link>
                    </div>
                </section>
            )}

            {/* Estado: Pagamento Recusado / Expirado */}
            {!isApproved && isCanceledOrFailed && (
                <section className="rounded-3xl border border-red-500/30 bg-red-50 dark:bg-red-950/30 p-8 sm:p-10 text-center max-w-2xl mx-auto">
                    <XCircle size={48} className="mx-auto text-red-600 dark:text-red-400 mb-4" />
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-red-900 dark:text-red-200">
                        {payment?.status === 'EXPIRED' ? 'Pagamento Expirado' : 'Pagamento Recusado'}
                    </h2>
                    <p className="mt-2 text-sm text-red-800 dark:text-red-300">
                        Não foi possível concluir o pagamento deste pedido. O pedido foi cancelado e os itens retornaram ao estoque.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-8 py-3.5 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                        >
                            Voltar à Loja <ArrowRight size={15} />
                        </Link>
                        <Link
                            href={`/pedidos/${order.id}`}
                            className="inline-flex items-center gap-2 rounded-full border border-black/15 dark:border-white/20 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider hover:bg-white dark:hover:bg-[#252525] transition-colors"
                        >
                            Ver Pedido
                        </Link>
                    </div>
                </section>
            )}

            {/* Fluxo de Pagamento Pendente */}
            {!isApproved && !isCanceledOrFailed && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Coluna Esquerda: Seleção e Formulário de Pagamento (Col 7) */}
                    <section className="lg:col-span-7 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8">
                        <h2 className="font-display text-xl font-bold uppercase tracking-tight mb-5">
                            ESCOLHA COMO PAGAR
                        </h2>

                        {/* Abas Pix / Cartão */}
                        <div className="grid grid-cols-2 gap-3 mb-6" role="tablist" aria-label="Métodos de pagamento">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'PIX'}
                                onClick={() => {
                                    setActiveTab('PIX')
                                    setActionError('')
                                }}
                                className={`flex items-center justify-center gap-2.5 rounded-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white ${
                                    activeTab === 'PIX'
                                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                                        : 'bg-[#F2F0F1] dark:bg-[#252525] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#303030]'
                                }`}
                            >
                                <QrCode size={16} />
                                Pix Instantâneo
                            </button>

                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'CREDIT_CARD'}
                                onClick={() => {
                                    setActiveTab('CREDIT_CARD')
                                    setActionError('')
                                }}
                                className={`flex items-center justify-center gap-2.5 rounded-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white ${
                                    activeTab === 'CREDIT_CARD'
                                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                                        : 'bg-[#F2F0F1] dark:bg-[#252525] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#303030]'
                                }`}
                            >
                                <CreditCard size={16} />
                                Cartão de Crédito
                            </button>
                        </div>

                        {actionError && (
                            <div
                                role="alert"
                                className="mb-6 flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-4 text-xs font-medium text-red-600 dark:text-red-400"
                            >
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{actionError}</span>
                            </div>
                        )}

                        {/* Aba PIX */}
                        {activeTab === 'PIX' && (
                            <div className="space-y-6">
                                {!hasPixReady ? (
                                    <div className="rounded-2xl bg-[#F2F0F1] dark:bg-[#202020] p-6 text-center space-y-4">
                                        <QrCode size={40} className="mx-auto text-black dark:text-white" />
                                        <div>
                                            <h3 className="font-display text-lg font-bold uppercase">
                                                Pague em segundos com Pix
                                            </h3>
                                            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                                                Aprovação imediata 24h por dia. O código gerado tem validade de 15 minutos.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleGeneratePix}
                                            disabled={processing}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-8 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors cursor-pointer"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 size={15} className="animate-spin" />
                                                    Gerando QR Code...
                                                </>
                                            ) : (
                                                'Gerar QR Code Pix'
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex flex-col items-center rounded-2xl bg-[#F2F0F1] dark:bg-[#202020] p-6 text-center">
                                            <div className="rounded-2xl bg-white p-3 shadow-sm border border-black/10">
                                                <img
                                                    src={payment?.pix_qr_code}
                                                    alt="QR Code para pagamento via Pix"
                                                    className="h-52 w-52 object-contain"
                                                />
                                            </div>
                                            <p className="mt-4 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                <RefreshCw size={13} className="animate-spin" />
                                                Aguardando confirmação automática do pagamento...
                                            </p>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="pix-copy-paste"
                                                className="block text-xs font-bold uppercase tracking-wider mb-2"
                                            >
                                                Pix Copia e Cola
                                            </label>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input
                                                    id="pix-copy-paste"
                                                    type="text"
                                                    readOnly
                                                    value={payment?.pix_copy_paste ?? ''}
                                                    className="h-12 flex-1 rounded-full border border-black/15 dark:border-white/20 bg-[#F2F0F1] dark:bg-[#202020] px-4 font-mono text-xs outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCopyPix}
                                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-6 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer shrink-0"
                                                >
                                                    {copied ? (
                                                        <>
                                                            <Check size={15} />
                                                            Copiado!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={15} />
                                                            Copiar Código
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Controles de simulação apenas quando em modo Mock local */}
                                        {payment?.external_payment_id?.startsWith('pix_') && (
                                            <div className="rounded-2xl border border-dashed border-black/20 dark:border-white/20 p-4">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-3">
                                                    Simulação de Gateway (Modo Local)
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSimulatePix('APPROVE')}
                                                        disabled={processing}
                                                        className="rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer"
                                                    >
                                                        Simular Pix Pago
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSimulatePix('EXPIRE')}
                                                        disabled={processing}
                                                        className="rounded-full border border-red-500/40 text-red-600 dark:text-red-400 px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40 transition-colors cursor-pointer"
                                                    >
                                                        Simular Expiração
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Aba CARTÃO DE CRÉDITO */}
                        {activeTab === 'CREDIT_CARD' && (
                            <form onSubmit={handleSubmitCard} noValidate className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="card-number"
                                        className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                    >
                                        Número do Cartão
                                    </label>
                                    <input
                                        id="card-number"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="cc-number"
                                        placeholder="0000 0000 0000 0000"
                                        value={cardNumber}
                                        onChange={(e) => {
                                            setCardNumber(formatCardNumber(e.target.value))
                                            cardIdempotencyKeyRef.current = null
                                        }}
                                        aria-invalid={Boolean(fieldErrors.cardNumber)}
                                        aria-describedby={fieldErrors.cardNumber ? 'card-number-error' : undefined}
                                        disabled={processing}
                                        className="h-12 w-full rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-5 font-mono text-sm outline-none focus:border-black dark:focus:border-white"
                                    />
                                    {fieldErrors.cardNumber && (
                                        <p id="card-number-error" className="mt-1 px-3 text-xs text-red-600 dark:text-red-400">
                                            {fieldErrors.cardNumber}
                                        </p>
                                    )}
                                    {!mpEnabled && (
                                        <p className="mt-1 px-3 text-[11px] text-neutral-500">
                                            Dica de teste: cartões terminados em <code className="font-mono">0000</code> simulam recusa.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="card-holder"
                                            className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        >
                                            Nome Impresso no Cartão
                                        </label>
                                        <input
                                            id="card-holder"
                                            type="text"
                                            autoComplete="cc-name"
                                            placeholder="NOME COMO ESTÁ NO CARTÃO"
                                            value={cardHolderName}
                                            onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                                            aria-invalid={Boolean(fieldErrors.cardHolderName)}
                                            aria-describedby={fieldErrors.cardHolderName ? 'card-holder-error' : undefined}
                                            disabled={processing}
                                            className="h-12 w-full rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-5 text-sm uppercase outline-none focus:border-black dark:focus:border-white"
                                        />
                                        {fieldErrors.cardHolderName && (
                                            <p id="card-holder-error" className="mt-1 px-3 text-xs text-red-600 dark:text-red-400">
                                                {fieldErrors.cardHolderName}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="payer-cpf"
                                            className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        >
                                            CPF do Titular {mpEnabled ? '*' : '(opcional)'}
                                        </label>
                                        <input
                                            id="payer-cpf"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="000.000.000-00"
                                            maxLength={14}
                                            value={payerCpf}
                                            onChange={(e) => setPayerCpf(formatCPF(e.target.value))}
                                            aria-invalid={Boolean(fieldErrors.payerCpf)}
                                            aria-describedby={fieldErrors.payerCpf ? 'payer-cpf-error' : undefined}
                                            disabled={processing}
                                            className="h-12 w-full rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-5 font-mono text-sm outline-none focus:border-black dark:focus:border-white"
                                        />
                                        {fieldErrors.payerCpf && (
                                            <p id="payer-cpf-error" className="mt-1 px-3 text-xs text-red-600 dark:text-red-400">
                                                {fieldErrors.payerCpf}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label
                                            htmlFor="card-expiry"
                                            className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        >
                                            Validade (MM/AA)
                                        </label>
                                        <input
                                            id="card-expiry"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="cc-exp"
                                            placeholder="12/30"
                                            maxLength={5}
                                            value={cardExpiry}
                                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                            aria-invalid={Boolean(fieldErrors.cardExpiry)}
                                            aria-describedby={fieldErrors.cardExpiry ? 'card-expiry-error' : undefined}
                                            disabled={processing}
                                            className="h-12 w-full rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-5 font-mono text-sm outline-none focus:border-black dark:focus:border-white"
                                        />
                                        {fieldErrors.cardExpiry && (
                                            <p id="card-expiry-error" className="mt-1 px-3 text-xs text-red-600 dark:text-red-400">
                                                {fieldErrors.cardExpiry}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="card-cvv"
                                            className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        >
                                            CVV
                                        </label>
                                        <input
                                            id="card-cvv"
                                            type="password"
                                            inputMode="numeric"
                                            autoComplete="cc-csc"
                                            placeholder="123"
                                            maxLength={4}
                                            value={cardCvv}
                                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            aria-invalid={Boolean(fieldErrors.cardCvv)}
                                            aria-describedby={fieldErrors.cardCvv ? 'card-cvv-error' : undefined}
                                            disabled={processing}
                                            className="h-12 w-full rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-5 font-mono text-sm outline-none focus:border-black dark:focus:border-white"
                                        />
                                        {fieldErrors.cardCvv && (
                                            <p id="card-cvv-error" className="mt-1 px-3 text-xs text-red-600 dark:text-red-400">
                                                {fieldErrors.cardCvv}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="card-installments"
                                            className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                                        >
                                            Parcelas
                                        </label>
                                        <select
                                            id="card-installments"
                                            value={installments}
                                            onChange={(e) => setInstallments(Number(e.target.value))}
                                            disabled={processing}
                                            className="h-12 w-full rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] px-4 text-xs font-semibold outline-none focus:border-black dark:focus:border-white"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
                                                <option key={n} value={n}>
                                                    {n}x de {formatPrice(order.total / n)} sem juros
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="mt-4 w-full h-13 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Processando Pagamento...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={16} />
                                            Pagar {formatPrice(order.total)}
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </section>

                    {/* Coluna Direita: Resumo do Pedido (Col 5) */}
                    <aside className="lg:col-span-5 rounded-3xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#181818] p-6 sm:p-8 space-y-6">
                        <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">
                            RESUMO DO PEDIDO
                        </h2>

                        <div className="divide-y divide-black/10 dark:divide-white/10">
                            {order.items.map((item) => {
                                const unitPrice = Number(item.unit_price ?? item.price ?? 0)
                                return (
                                    <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-12 w-12 rounded-xl bg-white dark:bg-[#252525] p-1.5 flex items-center justify-center shrink-0">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="h-full w-full object-contain"
                                                    />
                                                ) : (
                                                    <ImageOff size={16} className="text-neutral-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold uppercase truncate">{item.name}</p>
                                                <p className="text-[11px] text-neutral-500">Qtd: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <span className="font-display text-sm font-bold shrink-0">
                                            {formatPrice(unitPrice * item.quantity)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="border-t border-black/10 dark:border-white/10 pt-4 space-y-2 text-xs">
                            <div className="flex flex-col gap-1 text-neutral-600 dark:text-neutral-400">
                                <span>Endereço de Entrega</span>
                                <span className="font-semibold text-black dark:text-white leading-relaxed">
                                    {formatAddressFull(order.address)}
                                </span>
                            </div>
                            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                <span>Entrega</span>
                                <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">Grátis</span>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-black/10 dark:border-white/10">
                                <span className="text-sm font-bold uppercase">Total</span>
                                <span className="font-display text-2xl font-extrabold">
                                    {formatPrice(order.total)}
                                </span>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </main>
    )
}
