'use client'

import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { ImageOff, Minus, Plus, Trash2, Check, X, Loader2, ArrowRight, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CartResponse, ProductCartResponse } from '@/src/actions/cart/read_all'
import UpdateIsSelectCart from '@/src/actions/cart/update_is_select'
import UpdateAllIsSelectCart from '@/src/actions/cart/update_all_is_select'
import ProductReadService from '@/src/actions/product/read'
import CreateCart from '@/src/actions/cart/create_cart'
import RemoveProductCart from '@/src/actions/cart/delete_product_cart'
import DecreaseProductCart from '@/src/actions/cart/decrease_product_cart'
import CreateOrderService from '@/src/actions/order/create_order'

const REMOVE_DELAY = 2500

const formatPrice = (value: number | string) =>
    Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function CountdownBar({ duration }: { duration: number }) {
    const [full, setFull] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setFull(true), 20)
        return () => clearTimeout(t)
    }, [])

    return (
        <span
            aria-hidden
            className="absolute bottom-0 left-0 h-1 bg-black ease-linear transition-[width]"
            style={{ width: full ? '100%' : '0%', transitionDuration: `${duration}ms` }}
        />
    )
}

interface MainCartProps {
    list?: ProductCartResponse[]
    setList: Dispatch<SetStateAction<CartResponse | null>>
    loading?: boolean
    error?: string
    setCartRefresh: Dispatch<SetStateAction<number>>
}

export default function MainCart({ list = [], setList, loading = false, error = "", setCartRefresh }: MainCartProps) {
    const router = useRouter()
    const items = list
    const selectedItems = items.filter((i) => i.isSelect)
    const allSelected = items.length > 0 && selectedItems.length === items.length
    const subtotal = selectedItems.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0)
    const discount = subtotal > 0 ? subtotal * 0.1 : 0 // 10% de desconto de estilo SHOP.CO
    const deliveryFee = subtotal > 199 || subtotal === 0 ? 0 : 25
    const total = subtotal - discount + deliveryFee

    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [maxedIds, setMaxedIds] = useState<Set<string>>(new Set())
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    // Estado do checkout / CEP
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
    const [zipCode, setZipCode] = useState('')
    const [submittingOrder, setSubmittingOrder] = useState(false)
    const [checkoutError, setCheckoutError] = useState('')

    useEffect(() => {
        const timers = timersRef.current
        return () => {
            timers.forEach((t) => clearTimeout(t))
            timers.clear()
        }
    }, [])

    function markMaxed(id: string, maxed: boolean) {
        setMaxedIds((prev) => {
            const next = new Set(prev)
            if (maxed) next.add(id)
            else next.delete(id)
            return next
        })
    }

    function setPending(id: string, pending: boolean) {
        setPendingIds((prev) => {
            const next = new Set(prev)
            if (pending) next.add(id)
            else next.delete(id)
            return next
        })
    }

    function updateList(fn: (prev: ProductCartResponse[]) => ProductCartResponse[]) {
        setList((prev) => (prev ? { ...prev, list: fn(prev.list) } : prev))
    }

    async function handleToggleAll() {
        const next = !allSelected
        const previous = items

        updateList((prev) => prev.map((i) => ({ ...i, isSelect: next })))

        try {
            await UpdateAllIsSelectCart({ select: next })
        } catch (err) {
            console.log("erro ao atualizar todos: " + err)
            updateList(() => previous)
        }
    }

    async function handleToggleOne(item: ProductCartResponse) {
        const next = !item.isSelect
        updateList((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, isSelect: next } : i))
        )

        try {
            await UpdateIsSelectCart({ id: item.id, select: next })
        } catch (err) {
            console.log("erro ao atualizar is select: " + err)
            updateList((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, isSelect: item.isSelect } : i))
            )
        }
    }

    async function handleIncrease(item: ProductCartResponse) {
        if (updatingId || maxedIds.has(item.id)) return

        setUpdatingId(item.id)

        try {
            const product = await ProductReadService(item.product_id)
            const stock = Number(product?.quantity ?? 0)

            if (item.quantity >= stock) {
                markMaxed(item.id, true)
                return
            }

            updateList((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
            )

            try {
                await CreateCart({ product_id: item.product_id, quantity: (item.quantity + 1) })

                if (item.quantity + 1 >= stock) markMaxed(item.id, true)
            } catch (err) {
                console.log('erro ao aumentar quantidade: ' + err)
                updateList((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, quantity: item.quantity } : i))
                )
            }
        } catch (err) {
            console.log('erro ao consultar estoque: ' + err)
        } finally {
            setUpdatingId(null)
        }
    }

    async function handleDecrease(item: ProductCartResponse) {
        if (item.quantity <= 1 || updatingId || pendingIds.has(item.id)) return

        setUpdatingId(item.id)

        updateList((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
        )

        try {
            await DecreaseProductCart({ id: item.id, quantity: 1 })
            markMaxed(item.id, false)
        } catch (err) {
            console.log('erro ao diminuir quantidade: ' + err)
            updateList((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, quantity: item.quantity } : i))
            )
        } finally {
            setUpdatingId(null)
        }
    }

    function handleRemove(item: ProductCartResponse) {
        if (timersRef.current.has(item.id)) return

        const index = items.findIndex((i) => i.id === item.id)
        setPending(item.id, true)

        const timer = setTimeout(() => {
            timersRef.current.delete(item.id)
            commitRemove(item, index)
        }, REMOVE_DELAY)

        timersRef.current.set(item.id, timer)
    }

    function handleCancelRemove(item: ProductCartResponse) {
        const timer = timersRef.current.get(item.id)
        if (timer) clearTimeout(timer)
        timersRef.current.delete(item.id)
        setPending(item.id, false)
    }

    async function commitRemove(item: ProductCartResponse, index: number) {
        updateList((prev) => prev.filter((i) => i.id !== item.id))
        setPending(item.id, false)
        markMaxed(item.id, false)

        try {
            await RemoveProductCart(item.id)
            setCartRefresh((v) => v - 1)
        } catch (err) {
            if (err instanceof Error && err.message === "204") {
                setCartRefresh((v) => v + 1)
            } else {
                console.log('erro ao remover item: ' + err)
                updateList((prev) => {
                    if (prev.some((i) => i.id === item.id)) return prev
                    const next = [...prev]
                    next.splice(Math.min(index, next.length), 0, item)
                    return next
                })
            }
        }
    }

    function handleOpenCheckout() {
        if (selectedItems.length === 0) return
        setCheckoutError('')
        setCheckoutModalOpen(true)
    }

    function formatZipCode(val: string) {
        const raw = val.replace(/\D/g, '').slice(0, 8)
        if (raw.length > 5) {
            return `${raw.slice(0, 5)}-${raw.slice(5)}`
        }
        return raw
    }

    async function handleConfirmOrder(e: React.FormEvent) {
        e.preventDefault()
        const cleanZip = zipCode.trim()

        if (!/^[0-9]{5}-?[0-9]{3}$/.test(cleanZip)) {
            setCheckoutError('Informe um CEP válido (ex: 00000-000 ou 00000000).')
            return
        }

        setSubmittingOrder(true)
        setCheckoutError('')

        try {
            const order = await CreateOrderService({ zip_code: cleanZip })
            setCartRefresh((v) => v + 1)
            router.push(`/pedidos/${order.id}`)
        } catch (err: unknown) {
            if (err instanceof Error) {
                setCheckoutError(err.message)
            } else {
                setCheckoutError('Erro ao finalizar pedido.')
            }
        } finally {
            setSubmittingOrder(false)
        }
    }

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-sans text-black">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6 uppercase tracking-wider font-medium">
                <Link href="/" className="hover:text-black">Início</Link>
                <span>/</span>
                <span className="text-black font-bold">Carrinho</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-black mb-8">
                SEU CARRINHO
            </h1>

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                </div>
            )}

            {!loading && (error || items.length === 0) && (
                <div className="rounded-3xl bg-[#F2F0F1] p-12 text-center max-w-2xl mx-auto my-8">
                    <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-black">
                        Seu carrinho está vazio
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600 font-sans">
                        Parece que você ainda não adicionou nenhum produto ao carrinho. Explore nossas novidades agora mesmo!
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors"
                    >
                        Explorar Produtos <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}

            {!loading && items.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                    
                    {/* Lista de Produtos (Col 7) */}
                    <div className="lg:col-span-7 rounded-3xl border border-black/10 p-4 sm:p-6 bg-white space-y-4">
                        {/* Header da lista de itens */}
                        <div className="flex items-center justify-between pb-4 border-b border-black/10">
                            <button
                                type="button"
                                onClick={handleToggleAll}
                                className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-black cursor-pointer"
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                                        allSelected ? 'border-black bg-black text-white' : 'border-neutral-300 bg-white'
                                    }`}
                                >
                                    <Check size={14} strokeWidth={3} />
                                </span>
                                Marcar todos
                            </button>
                            <span className="text-xs text-neutral-500 font-sans">
                                {selectedItems.length} de {items.length} itens selecionados
                            </span>
                        </div>

                        {/* Itens */}
                        <div className="divide-y divide-black/10">
                            {items.map((item) => {
                                const isPending = pendingIds.has(item.id)

                                return (
                                    <div
                                        key={item.id}
                                        className={`relative py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-opacity ${
                                            isPending ? 'opacity-40' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                            {/* Checkbox */}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleOne(item)}
                                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition cursor-pointer ${
                                                    item.isSelect ? 'border-black bg-black text-white' : 'border-neutral-300 bg-white'
                                                }`}
                                            >
                                                <Check size={14} strokeWidth={3} />
                                            </button>

                                            {/* Container Imagem com fundo branco constante */}
                                            <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl bg-white border border-black/10 flex items-center justify-center p-2 overflow-hidden shadow-xs">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="h-full w-full object-contain mix-blend-multiply"
                                                    />
                                                ) : (
                                                    <ImageOff size={24} className="text-neutral-400" />
                                                )}
                                            </div>

                                            {/* Título e Dados */}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-display font-bold text-sm sm:text-base text-black uppercase tracking-tight truncate">
                                                    {item.name}
                                                </h3>
                                                <p className="text-xs text-neutral-500 font-sans mt-0.5">
                                                    SKU: {item.sku}
                                                </p>
                                                <span className="font-sans font-bold text-base sm:text-lg text-black mt-2 block">
                                                    {formatPrice(Number(item.price) * item.quantity)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Ações: Quantidade e Deletar */}
                                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0">
                                            {/* Contador em pílula cinza arredondada */}
                                            <div className="flex items-center rounded-full bg-[#F2F0F1] px-2 py-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDecrease(item)}
                                                    disabled={item.quantity <= 1 || updatingId === item.id || isPending}
                                                    className="h-7 w-7 rounded-full flex items-center justify-center text-black hover:bg-neutral-300 disabled:opacity-30 transition-colors cursor-pointer"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-8 text-center text-xs font-bold font-sans">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleIncrease(item)}
                                                    disabled={updatingId === item.id || maxedIds.has(item.id) || isPending}
                                                    className="h-7 w-7 rounded-full flex items-center justify-center text-black hover:bg-neutral-300 disabled:opacity-30 transition-colors cursor-pointer"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            {/* Botão de Excluir */}
                                            {isPending ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCancelRemove(item)}
                                                    className="flex h-9 px-3 rounded-full bg-red-100 text-red-600 text-xs font-bold items-center gap-1 hover:bg-red-200 transition-colors cursor-pointer"
                                                >
                                                    <X size={14} /> Desfazer
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemove(item)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                                    aria-label={`Remover ${item.name}`}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>

                                        {isPending && <CountdownBar duration={REMOVE_DELAY} />}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Resumo do Pedido (Col 5) */}
                    <div className="lg:col-span-5 rounded-3xl border border-black/10 p-6 sm:p-8 bg-white space-y-6">
                        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-black">
                            RESUMO DO PEDIDO
                        </h2>

                        <div className="space-y-4 text-sm font-sans divide-y divide-black/5">
                            <div className="flex items-center justify-between text-neutral-600 pt-2">
                                <span>Subtotal</span>
                                <span className="font-bold text-black">{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-neutral-600 pt-3">
                                <span className="flex items-center gap-1.5">
                                    Desconto (-10%)
                                </span>
                                <span className="font-bold text-red-600">-{formatPrice(discount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-neutral-600 pt-3">
                                <span>Taxa de Entrega</span>
                                <span className="font-bold text-black">
                                    {deliveryFee === 0 ? (
                                        <span className="text-emerald-600 font-bold uppercase text-xs">Grátis</span>
                                    ) : (
                                        formatPrice(deliveryFee)
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-base sm:text-lg font-bold text-black pt-4">
                                <span>Total</span>
                                <span className="font-display font-extrabold text-xl sm:text-2xl">{formatPrice(total)}</span>
                            </div>
                        </div>

                        {/* Cupom Promocional Fake */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                                    <Tag className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Adicionar cupom"
                                    className="h-11 w-full rounded-full bg-[#F2F0F1] pl-11 pr-4 text-xs font-sans text-black placeholder:text-neutral-500 outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                className="h-11 px-6 rounded-full bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                            >
                                Aplicar
                            </button>
                        </div>

                        {/* Finalizar Compra CTA */}
                        <button
                            type="button"
                            onClick={handleOpenCheckout}
                            disabled={selectedItems.length === 0}
                            className="w-full py-4 rounded-full bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                        >
                            Ir para o Checkout <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                </div>
            )}

            {/* Modal de confirmação de pedido e CEP */}
            {checkoutModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-checkout-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                >
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-black/10">
                        <div className="flex items-center justify-between pb-4 border-b border-black/10">
                            <h2
                                id="modal-checkout-title"
                                className="font-display text-xl font-bold uppercase tracking-tight text-black"
                            >
                                Finalizar Pedido
                            </h2>
                            <button
                                type="button"
                                onClick={() => setCheckoutModalOpen(false)}
                                disabled={submittingOrder}
                                className="p-1 rounded-full hover:bg-[#F2F0F1] text-black transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmOrder} className="mt-6 flex flex-col gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                                    Resumo da compra:
                                </p>
                                <div className="mt-2 flex items-center justify-between rounded-2xl bg-[#F2F0F1] p-4 text-xs">
                                    <span className="text-neutral-700 font-medium">
                                        {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'} selecionados
                                    </span>
                                    <span className="font-display font-extrabold text-sm text-black">
                                        {formatPrice(total)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="zip-code-input"
                                    className="block text-xs uppercase tracking-wider text-black font-bold mb-1.5"
                                >
                                    CEP de Entrega
                                </label>
                                <input
                                    id="zip-code-input"
                                    type="text"
                                    placeholder="00000-000"
                                    maxLength={9}
                                    value={zipCode}
                                    onChange={(e) => setZipCode(formatZipCode(e.target.value))}
                                    disabled={submittingOrder}
                                    required
                                    className="h-12 w-full rounded-full border border-black/15 bg-white px-5 font-mono text-sm tracking-wider text-black outline-none placeholder:text-neutral-400 focus:border-black"
                                />
                                <span className="mt-1 block text-[10px] text-neutral-500 px-3">
                                    Digite seu CEP no formato 00000-000
                                </span>
                            </div>

                            {checkoutError && (
                                <div role="alert" className="p-3 rounded-2xl bg-red-50 text-xs text-red-600 font-medium">
                                    {checkoutError}
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-black/10">
                                <button
                                    type="button"
                                    onClick={() => setCheckoutModalOpen(false)}
                                    disabled={submittingOrder}
                                    className="h-11 px-5 rounded-full border border-black/15 text-xs font-semibold uppercase tracking-wider text-black hover:bg-[#F2F0F1] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingOrder || !zipCode.trim()}
                                    className="flex h-11 items-center justify-center gap-2 rounded-full bg-black px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors disabled:opacity-40"
                                >
                                    {submittingOrder ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Processando...
                                        </>
                                    ) : (
                                        'Confirmar Pedido'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}
