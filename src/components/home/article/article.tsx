'use client'

import { JSX, useEffect, useRef, useState } from 'react'
import { ProductResponse } from '@/src/actions/product/read_all_request'
import CreateCart from '@/src/actions/cart/create_cart'
import ReadCart, { CartResponse } from '@/src/actions/cart/read_all'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, ShoppingCart, X } from 'lucide-react'

// Tempo de espera (em ms) para dar tempo de cancelar antes de enviar à API
const ADD_TO_CART_DELAY_MS = 3500
// Tempo de exibição do aviso de produto já no carrinho (em ms)
const WARNING_DELAY_MS = 4000

// Grade colada: borda no topo/esquerda aqui, direita/baixo em cada célula
const GRID = 'grid grid-cols-2 border-l border-t border-[#333] md:grid-cols-3 lg:grid-cols-4'

const PAGE_BTN =
    'flex h-10 min-w-10 cursor-pointer items-center justify-center border border-[#333] px-3 text-[12px] font-medium uppercase tracking-widest text-neutral-300 transition-colors hover:border-[#ff6a00] hover:text-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#333] disabled:hover:text-neutral-300'

const isNew = (iso: string) => {
    const t = new Date(iso).getTime()
    return !Number.isNaN(t) && Date.now() - t < 1000 * 60 * 60 * 24 * 3
}

// Gera a lista de páginas com reticências: 1 … 4 5 6 … 10
function getPageNumbers(page: number, totalPages: number): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const pages: (number | '...')[] = [1]
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push('...')
    pages.push(totalPages)

    return pages
}

interface ArticleHomeProps {
    listProducts: ProductResponse[]
    PlaceholderIcon: () => JSX.Element
    loading: boolean
    error: string | null
    page: number
    totalPages: number
    onPageChange: (page: number) => void
    onCartChange?: () => void
    cart?: CartResponse | null
}

export default function ArticleHome({
    listProducts,
    PlaceholderIcon,
    loading,
    error,
    page,
    totalPages,
    onPageChange,
    onCartChange,
    cart: initialCart,
}: ArticleHomeProps) {
    const pageSize = listProducts.length
    const router = useRouter()

    const [cart, setCart] = useState<CartResponse | null>(initialCart ?? null)

    // Sincroniza o estado interno caso a prop cart seja atualizada
    useEffect(() => {
        setCart(initialCart ?? null)
    }, [initialCart])

    // Produto com adição pendente (aguardando o tempo do toast para confirmar ou cancelar)
    const [pendingProduct, setPendingProduct] = useState<ProductResponse | null>(null)
    // Indica se a chamada CreateCart está em andamento no servidor
    const [isSaving, setIsSaving] = useState(false)
    // Erro ao salvar produto no carrinho
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Produto com aviso de que já está no carrinho
    const [warningProduct, setWarningProduct] = useState<ProductResponse | null>(null)
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (warningTimerRef.current) {
                clearTimeout(warningTimerRef.current)
            }
        }
    }, [])

    function triggerWarning(produto: ProductResponse) {
        setWarningProduct(produto)
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current)
        }
        warningTimerRef.current = setTimeout(() => {
            setWarningProduct(null)
            warningTimerRef.current = null
        }, WARNING_DELAY_MS)
    }

    function handleDismissWarning() {
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current)
            warningTimerRef.current = null
        }
        setWarningProduct(null)
    }

    // Efeito: aguarda o tempo expirar para salvar de fato no carrinho
    useEffect(() => {
        if (!pendingProduct) return

        const product = pendingProduct

        const timer = setTimeout(async () => {
            setIsSaving(true)
            try {
                await CreateCart({ product_id: product.id, quantity: 1 })
                onCartChange?.()
                router.refresh()
            } catch (err) {
                console.error('Erro ao adicionar produto no carrinho:', err)
                setErrorMessage('Não foi possível adicionar o produto.')
                setTimeout(() => setErrorMessage(null), 3000)
            } finally {
                setIsSaving(false)
                setPendingProduct(null)
            }
        }, ADD_TO_CART_DELAY_MS)

        return () => clearTimeout(timer)
    }, [pendingProduct, onCartChange, router])

    // Dispara a intenção de adicionar o produto
    async function handleQueueAdd(produto: ProductResponse) {
        if (produto.quantity <= 0 || pendingProduct !== null || isSaving) return
        setErrorMessage(null)
        handleDismissWarning()

        // 1. Verifica no carrinho atual em memória
        if (cart?.list?.some((item) => item.product_id === produto.id)) {
            triggerWarning(produto)
            return
        }

        // 2. Busca o carrinho mais atual no servidor para garantir integridade
        try {
            const freshCart = await ReadCart()
            setCart(freshCart)
            if (freshCart?.list?.some((item) => item.product_id === produto.id)) {
                triggerWarning(produto)
                return
            }
        } catch {
            // Em caso de falha na requisição (deslogado etc.), segue para fluxo normal
        }

        // Fluxo normal
        setPendingProduct(produto)
    }

    // Cancela a adição antes que ela vá para o servidor
    function handleCancelAdd() {
        if (isSaving) return
        setPendingProduct(null)
    }

    return (
        <section id="produtos" className="mx-auto max-w-[1120px] scroll-mt-32 px-4 py-10 font-inter text-[#eaeaea] sm:px-6 md:scroll-mt-20 md:py-14">
            <style>{`
                @keyframes cart-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .motion-cart-progress {
                        animation: none !important;
                    }
                }
            `}</style>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
                <h2 className="font-['Barlow_Condensed',Impact,sans-serif] text-3xl font-bold uppercase tracking-wide sm:text-4xl">
                    Produtos em destaque
                </h2>
            </div>

            {loading && (
                <div className={GRID}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="animate-pulse border-b border-r border-[#333]">
                            <div className="h-44 bg-[#242424] sm:h-56" />
                            <div className="p-4">
                                <div className="h-4 w-2/3 bg-[#242424]" />
                                <div className="mt-2 h-3 w-1/2 bg-[#242424]" />
                            </div>
                            <div className="h-11 border-t border-[#333] bg-[#1d1d1d]" />
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <p className="border border-[#ff6a00] bg-[#ff6a00]/10 px-4 py-3 text-[13px] uppercase tracking-wider text-[#ff6a00]">
                    Não foi possível carregar os produtos.
                </p>
            )}

            {errorMessage && (
                <p className="mb-4 border border-red-500 bg-red-950/30 px-4 py-3 text-[13px] uppercase tracking-wider text-red-400">
                    {errorMessage}
                </p>
            )}

            {!loading && !error && pageSize === 0 && (
                <p className="text-sm uppercase tracking-wider text-neutral-400">Nenhum produto encontrado.</p>
            )}

            {!loading && !error && pageSize > 0 && (
                <>
                    <div className={GRID}>
                        {listProducts.map((p, i) => {
                            const isPending = pendingProduct?.id === p.id
                            const isBusy = pendingProduct !== null || isSaving
                            const isUnavailable = p.quantity <= 0

                            return (
                                <article
                                    key={p.id}
                                    className="group relative flex min-w-0 flex-col border-b border-r border-[#333] bg-[#161616]"
                                >
                                    {/* Imagem */}
                                    <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-[#333] bg-[#e6e4dd] p-4 text-[#161616] sm:h-56">
                                        {isNew(p.created_at) && p.quantity >= 5 && (
                                            <span className="absolute right-0 top-0 z-10 bg-[#ff6a00] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-[#161616]">
                                                Novo
                                            </span>
                                        )}

                                        {p.quantity <= 4 && (
                                            <span className="absolute left-0 top-0 z-10 border-b border-l border-[#ff6a00] bg-[#161616] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#ff6a00]">
                                                Últimas unidades ({p.quantity})
                                            </span>
                                        )}

                                        {p.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={p.image}
                                                alt={p.name}
                                                loading="lazy"
                                                className={`h-full w-full object-contain mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-105 ${
                                                    p.quantity <= 0 ? 'opacity-50 grayscale' : ''
                                                }`}
                                            />
                                        ) : (
                                            <PlaceholderIcon />
                                        )}
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                                        <span className="text-[11px] uppercase tracking-widest text-neutral-500">
                                            Ref. {String((page - 1) * pageSize + i + 1).padStart(2, '0')}
                                        </span>

                                        <div className="flex flex-col">
                                            <h3 className="mt-1 min-h-[2.5rem] font-['Barlow_Condensed',Impact,sans-serif] text-[10px] uppercase leading-5 tracking-wide text-[#eaeaea] sm:min-h-[3rem] sm:text-[17px] sm:leading-6">
                                                {p.name}
                                            </h3>

                                            <p className="line-clamp-2 min-h-[1rem] text-xs text-neutral-400 sm:min-h-[1.25rem]">
                                                {p.description}
                                            </p>
                                        </div>

                                        <p className="mt-3 font-['Barlow_Condensed',Impact,sans-serif] text-2xl tracking-wide text-[#ff6a00] sm:text-3xl">
                                            R$ {p.price}
                                        </p>
                                    </div>

                                    {/* Botão de Adicionar ao Carrinho */}
                                    <button
                                        type="button"
                                        disabled={isUnavailable || (isBusy && !isPending)}
                                        onClick={() => handleQueueAdd(p)}
                                        aria-label={
                                            isUnavailable
                                                ? `${p.name} indisponível`
                                                : isPending
                                                ? `Adicionando ${p.name}, use o aviso abaixo para cancelar`
                                                : `Adicionar ${p.name} ao carrinho`
                                        }
                                        className={`flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-none border-t px-3 text-[12px] font-medium uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff6a00] active:brightness-95 disabled:cursor-not-allowed sm:px-4 ${
                                            isUnavailable
                                                ? 'border-[#333] text-neutral-600 disabled:hover:bg-transparent disabled:hover:text-neutral-600'
                                                : isPending
                                                ? 'border-[#ff6a00] bg-[#222] text-[#ff6a00]'
                                                : isBusy
                                                ? 'border-[#333] text-neutral-600 disabled:hover:bg-transparent disabled:hover:text-neutral-600'
                                                : 'border-[#333] text-[#eaeaea] hover:bg-[#ff6a00] hover:text-[#161616]'
                                        }`}
                                    >
                                        {isUnavailable ? (
                                            'Indisponível'
                                        ) : isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin text-[#ff6a00] motion-reduce:animate-none" />
                                                <span>{isSaving ? 'Salvando...' : 'Adicionando...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="h-4 w-4" />
                                                <span>+ Adicionar ao carrinho</span>
                                            </>
                                        )}
                                    </button>
                                </article>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Paginação */}
            {!error && totalPages > 1 && (
                <nav
                    aria-label="Paginação"
                    className="mt-8 flex flex-wrap items-center justify-center gap-2"
                >
                    <button
                        type="button"
                        onClick={() => onPageChange(page - 1)}
                        disabled={loading || page <= 1}
                        aria-label="Página anterior"
                        className={PAGE_BTN}
                    >
                        Anterior
                    </button>

                    {getPageNumbers(page, totalPages).map((n, idx) =>
                        n === '...' ? (
                            <span key={`dots-${idx}`} className="px-1 text-neutral-500">…</span>
                        ) : (
                            <button
                                key={n}
                                type="button"
                                onClick={() => onPageChange(n)}
                                disabled={loading}
                                aria-label={`Página ${n}`}
                                aria-current={n === page ? 'page' : undefined}
                                className={`${PAGE_BTN} ${n === page ? '!border-[#ff6a00] bg-[#ff6a00] !text-[#161616]' : ''}`}
                            >
                                {n}
                            </button>
                        )
                    )}

                    <button
                        type="button"
                        onClick={() => onPageChange(page + 1)}
                        disabled={loading || page >= totalPages}
                        aria-label="Próxima página"
                        className={PAGE_BTN}
                    >
                        Próxima
                    </button>
                </nav>
            )}

            {/* Caixa com X para cancelar antes de adicionar de fato ao carrinho */}
            {pendingProduct && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-md flex-col border border-[#ff6a00] bg-[#1c1c1c] text-[#eaeaea] shadow-lg sm:bottom-6 sm:right-6"
                >
                    <div className="flex items-center gap-3 p-3">
                        {/* Imagem miniatura */}
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-[#333] bg-[#e6e4dd] p-1 text-[#161616]">
                            {pendingProduct.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={pendingProduct.image}
                                    alt={pendingProduct.name}
                                    className="h-full w-full object-contain mix-blend-multiply"
                                />
                            ) : (
                                <PlaceholderIcon />
                            )}
                        </div>

                        {/* Detalhes do item */}
                        <div className="min-w-0 flex-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#ff6a00]">
                                {isSaving ? 'Salvando no carrinho...' : 'Adicionando ao carrinho...'}
                            </span>
                            <h4 className="truncate font-['Barlow_Condensed',Impact,sans-serif] text-base font-bold uppercase tracking-wide text-[#eaeaea]">
                                {pendingProduct.name}
                            </h4>
                            <p className="font-['Barlow_Condensed',Impact,sans-serif] text-xs tracking-wider text-neutral-400">
                                R$ {pendingProduct.price}
                            </p>
                        </div>

                        {/* Botão de Cancelar com X */}
                        {!isSaving && (
                            <button
                                type="button"
                                onClick={handleCancelAdd}
                                aria-label="Cancelar adição ao carrinho"
                                className="flex h-8 items-center gap-1.5 border border-[#333] px-2.5 text-[11px] font-medium uppercase tracking-wider text-neutral-300 transition-colors hover:border-red-500 hover:text-red-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                            >
                                <X className="h-3.5 w-3.5" />
                                <span>Cancelar</span>
                            </button>
                        )}
                    </div>

                    {/* Barra de progresso animada */}
                    <div className="h-1 w-full bg-[#333]">
                        <div
                            key={pendingProduct.id}
                            className="h-full bg-[#ff6a00] motion-cart-progress"
                            style={{ animation: `cart-progress ${ADD_TO_CART_DELAY_MS}ms linear forwards` }}
                        />
                    </div>
                </div>
            )}

            {/* Aviso no padrão do site quando produto já está no carrinho */}
            {warningProduct && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-md flex-col border border-[#ff6a00] bg-[#1c1c1c] text-[#eaeaea] shadow-lg sm:bottom-6 sm:right-6"
                >
                    <div className="flex items-center gap-3 p-3">
                        {/* Imagem miniatura */}
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-[#333] bg-[#e6e4dd] p-1 text-[#161616]">
                            {warningProduct.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={warningProduct.image}
                                    alt={warningProduct.name}
                                    className="h-full w-full object-contain mix-blend-multiply"
                                />
                            ) : (
                                <PlaceholderIcon />
                            )}
                        </div>

                        {/* Detalhes do item */}
                        <div className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#ff6a00]">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>Já está no carrinho</span>
                            </span>
                            <h4 className="truncate font-['Barlow_Condensed',Impact,sans-serif] text-base font-bold uppercase tracking-wide text-[#eaeaea]">
                                {warningProduct.name}
                            </h4>
                            <p className="font-['Barlow_Condensed',Impact,sans-serif] text-xs tracking-wider text-neutral-400">
                                Item já adicionado anteriormente
                            </p>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex shrink-0 items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => router.push('/carrinho')}
                                aria-label="Ir para o carrinho"
                                className="flex h-8 items-center gap-1 border border-[#ff6a00] bg-[#ff6a00] px-2.5 text-[11px] font-medium uppercase tracking-wider text-[#161616] transition-colors hover:bg-transparent hover:text-[#ff6a00] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff6a00]"
                            >
                                <ShoppingCart className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Carrinho</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDismissWarning}
                                aria-label="Fechar aviso"
                                className="flex h-8 w-8 items-center justify-center border border-[#333] text-neutral-300 transition-colors hover:border-[#ff6a00] hover:text-[#ff6a00] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff6a00]"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Barra de progresso animada */}
                    <div className="h-1 w-full bg-[#333]">
                        <div
                            key={warningProduct.id}
                            className="h-full bg-[#ff6a00] motion-cart-progress"
                            style={{ animation: `cart-progress ${WARNING_DELAY_MS}ms linear forwards` }}
                        />
                    </div>
                </div>
            )}
        </section>
    )
}
