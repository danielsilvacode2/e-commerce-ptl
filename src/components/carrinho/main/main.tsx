'use client'

import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { ImageOff, Minus, Plus, Trash2, Check, X } from 'lucide-react'
import { CartResponse, ProductCartResponse } from '@/src/actions/cart/read_all'
import UpdateIsSelectCart from '@/src/actions/cart/update_is_select'
import UpdateAllIsSelectCart from '@/src/actions/cart/update_all_is_select'
import ProductReadService from '@/src/actions/product/read'
import CreateCart from '@/src/actions/cart/create_cart'
import RemoveProductCart from '@/src/actions/cart/delete_product_cart' // ajuste o caminho

const REMOVE_DELAY = 4000

const formatPrice = (value: number | string) =>
    Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Barra que "enche" de 0% a 100% durante `duration` ms */
function CountdownBar({ duration }: { duration: number }) {
    const [full, setFull] = useState(false)

    useEffect(() => {
        // pequeno delay para o browser registrar width 0% antes de animar
        const t = setTimeout(() => setFull(true), 20)
        return () => clearTimeout(t)
    }, [])

    return (
        <span
            aria-hidden
            className="absolute bottom-0 left-0 h-0.5 bg-[#ff6a00] ease-linear transition-[width]"
            style={{ width: full ? '100%' : '0%', transitionDuration: `${duration}ms` }}
        />
    )
}

interface MainCartProps {
    list?: ProductCartResponse[]
    setList: Dispatch<SetStateAction<CartResponse | null>>
    loading?: boolean
    error?: string
}

export default function MainCart({ list = [], setList, loading = false, error = "" }: MainCartProps) {
    const items = list
    const selectedItems = items.filter((i) => i.isSelect)
    const allSelected = items.length > 0 && selectedItems.length === items.length
    const total = selectedItems.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0)

    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [maxedIds, setMaxedIds] = useState<Set<string>>(new Set())
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    // limpa timers se o componente desmontar
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
        const previous = items // snapshot para rollback

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
            // 1. Consulta o estoque atual do produto
            const product = await ProductReadService(item.product_id)
            const stock = Number(product?.quantity ?? 0)

            // 2. Já está no limite: só trava o botão
            if (item.quantity >= stock) {
                markMaxed(item.id, true)
                return
            }

            // 3. Atualização otimista
            updateList((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
            )

            // 4. Persiste no backend
            try {
                // Assume que o backend SOMA. Se ele substituir, use: quantity: item.quantity + 1
                await CreateCart({ product_id: item.product_id, quantity: (item.quantity + 1) })

                // Se com este incremento chegou no limite, já desabilita o botão
                if (item.quantity + 1 >= stock) markMaxed(item.id, true)
            } catch (err) {
                console.log('erro ao aumentar quantidade: ' + err)
                // rollback
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

    function handleDecrease(item: ProductCartResponse) {
        // TODO: diminuir quantidade
        // Depois de diminuir, chame: markMaxed(item.id, false)
    }

    /** Clique na lixeira: inicia contagem de 4s antes de remover de verdade */
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

    /** Clique no X: cancela a remoção */
    function handleCancelRemove(item: ProductCartResponse) {
        const timer = timersRef.current.get(item.id)
        if (timer) clearTimeout(timer)
        timersRef.current.delete(item.id)
        setPending(item.id, false)
    }

    /** Remoção real (otimista, com rollback se a API falhar) */
    async function commitRemove(item: ProductCartResponse, index: number) {
        updateList((prev) => prev.filter((i) => i.id !== item.id))
        setPending(item.id, false)
        markMaxed(item.id, false)

        try {
            await RemoveProductCart(item.id)
        } catch (err) {
            console.log('erro ao remover item: ' + err)
            // rollback: devolve o item na posição original
            updateList((prev) => {
                if (prev.some((i) => i.id === item.id)) return prev
                const next = [...prev]
                next.splice(Math.min(index, next.length), 0, item)
                return next
            })
        }
    }

    function handleCheckout() {
        // TODO: finalizar compra com os itens selecionados
    }

    return (
        <main className="min-h-screen w-full bg-[#121212] font-inter text-[#eaeaea] px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto w-full max-w-5xl">

                {/* Cabeçalho */}
                <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-[#333] pb-4">
                    <div className="min-w-0">
                        <h1 className="font-['Barlow_Condensed',Impact,sans-serif] text-2xl font-bold uppercase tracking-wide text-[#eaeaea] sm:text-3xl">
                            Carrinho
                        </h1>
                        <p className="mt-1 text-[11px] uppercase tracking-wider text-neutral-400 sm:text-xs">
                            Revise os produtos antes de finalizar.
                        </p>
                    </div>
                    <span className="shrink-0 text-[11px] uppercase tracking-widest text-[#ff6a00] sm:text-xs">
                        {items.length} {items.length === 1 ? "item" : "itens"}
                    </span>
                </header>

                {/* Estados */}
                {loading && (
                    <p className="mt-8 text-xs uppercase tracking-widest text-neutral-400">
                        Carregando...
                    </p>
                )}

                {error && (
                    <span role="alert" className="mt-8 block text-[11px] uppercase tracking-wider text-red-500">
                        {error}
                    </span>
                )}

                {!loading && !error && items.length === 0 && (
                    <p className="mt-8 text-xs uppercase tracking-widest text-neutral-500">
                        Seu carrinho está vazio.
                    </p>
                )}

                {/* Lista */}
                {!loading && !error && items.length > 0 && (
                    <>
                        {/* Marcar todos */}
                        <div className="mt-6 flex items-center justify-between gap-3 border border-[#333] bg-[#1c1c1c] px-3 py-2">
                            <button
                                type="button"
                                onClick={handleToggleAll}
                                aria-pressed={allSelected}
                                className="flex cursor-pointer items-center gap-3 text-[11px] uppercase tracking-widest text-neutral-400 transition hover:text-[#ff6a00] sm:text-xs"
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center border transition ${allSelected
                                        ? "border-[#ff6a00] bg-[#ff6a00] text-[#121212]"
                                        : "border-[#333] text-transparent"
                                        }`}
                                >
                                    <Check size={14} strokeWidth={3} />
                                </span>
                                Marcar todos
                            </button>
                            <span className="text-[11px] uppercase tracking-widest text-neutral-500 sm:text-xs">
                                {selectedItems.length} selecionado{selectedItems.length === 1 ? "" : "s"}
                            </span>
                        </div>

                        <ul className="mt-3 flex flex-col gap-3">
                            {items.map((item) => {
                                const isPending = pendingIds.has(item.id)

                                return (
                                    <li
                                        key={item.id}
                                        className={`relative overflow-hidden grid grid-cols-[auto_auto_1fr] items-center gap-x-3 gap-y-3 border bg-[#1c1c1c] p-3 transition hover:border-[#ff6a00] sm:flex sm:gap-4 ${item.isSelect ? "border-[#ff6a00]/60" : "border-[#333]"
                                            } ${isPending ? "opacity-60" : ""}`}
                                    >
                                        {/* Checkbox individual */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleOne(item)}
                                            aria-pressed={item.isSelect}
                                            aria-label={`Selecionar ${item.name}`}
                                            className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border transition ${item.isSelect
                                                ? "border-[#ff6a00] bg-[#ff6a00] text-[#121212]"
                                                : "border-[#333] text-transparent hover:border-[#ff6a00]"
                                                }`}
                                        >
                                            <Check size={14} strokeWidth={3} />
                                        </button>

                                        {/* Imagem */}
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-[#333] bg-[#161616] sm:h-16 sm:w-16">
                                            {item.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <ImageOff size={20} className="text-neutral-600" />
                                            )}
                                        </div>

                                        {/* Nome + SKU */}
                                        <div className="min-w-0 sm:flex-1">
                                            <p className="line-clamp-2 break-words text-sm font-medium uppercase tracking-wide text-[#eaeaea] sm:truncate">
                                                {item.name}
                                            </p>
                                            <p className="mt-1 truncate text-[11px] uppercase tracking-widest text-neutral-500">
                                                SKU: {item.sku}
                                            </p>
                                        </div>

                                        {/* Quantidade + Preço + Remover (linha própria no mobile) */}
                                        <div className="col-span-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#333] pt-3 sm:col-span-1 sm:contents sm:border-0 sm:pt-0">
                                            {/* Quantidade */}
                                            <div className="flex shrink-0 items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDecrease(item)}
                                                    aria-label={`Diminuir quantidade de ${item.name}`}
                                                    className="flex h-9 w-9 cursor-pointer items-center justify-center border border-[#333] text-neutral-400 transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="flex h-9 min-w-10 items-center justify-center border-y border-[#333] px-2 text-sm text-[#eaeaea]">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleIncrease(item)}
                                                    disabled={updatingId === item.id || maxedIds.has(item.id) || isPending}
                                                    aria-label={`Aumentar quantidade de ${item.name}`}
                                                    className="flex h-9 w-9 cursor-pointer items-center justify-center border border-[#333] text-neutral-400 transition hover:border-[#ff6a00] hover:text-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#333] disabled:hover:text-neutral-400"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            {/* Preço */}
                                            <span className="shrink-0 text-sm font-medium tracking-wide text-[#ff6a00] sm:min-w-24 sm:text-right">
                                                {formatPrice(Number(item.price) * item.quantity)}
                                            </span>

                                            {/* Remover / Cancelar */}
                                            {isPending ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCancelRemove(item)}
                                                    aria-label={`Cancelar remoção de ${item.name}`}
                                                    title="Cancelar remoção"
                                                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-[#ff6a00] bg-[#ff6a00] text-[#121212] transition hover:bg-transparent hover:text-[#ff6a00] sm:h-9 sm:w-9"
                                                >
                                                    <X size={16} strokeWidth={3} />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemove(item)}
                                                    aria-label={`Remover ${item.name}`}
                                                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-[#333] text-neutral-400 transition hover:border-red-500 hover:text-red-500 sm:h-9 sm:w-9"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Barra de contagem */}
                                        {isPending && <CountdownBar duration={REMOVE_DELAY} />}
                                    </li>
                                )
                            })}
                        </ul>

                        {/* Resumo */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#333] pt-4">
                            <div className="flex flex-col">
                                <span className="text-[11px] uppercase tracking-widest text-neutral-400 sm:text-xs">
                                    Total selecionado
                                </span>
                                <span className="mt-1 text-lg font-bold tracking-wide text-[#ff6a00] sm:text-xl">
                                    {formatPrice(total)}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleCheckout}
                                disabled={selectedItems.length === 0}
                                className="h-10 cursor-pointer border border-[#ff6a00] bg-[#ff6a00] px-6 text-xs font-medium uppercase tracking-widest text-[#121212] transition hover:bg-transparent hover:text-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#ff6a00] disabled:hover:text-[#121212]"
                            >
                                Finalizar compra
                            </button>
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}