'use client'

import { JSX, useState } from 'react'
import { ProductResponse } from '@/src/actions/product/read_all_request'
import CreateCart from '@/src/actions/cart/create_cart'
import { useRouter } from 'next/navigation'

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
}: ArticleHomeProps) {

    const pageSize = listProducts.length
    const router = useRouter()

    // id do produto que está sendo adicionado (evita clique duplo)
    const [addingId, setAddingId] = useState<ProductResponse['id'] | null>(null)

    async function handleAddCart(produto: ProductResponse) {
        if (produto.quantity <= 0 || addingId !== null) return

        setAddingId(produto.id)
        try {
            await CreateCart({ product_id: produto.id, quantity: 1 })
            onCartChange?.()   // o pai refaz o fetch dos produtos
            router.refresh()   // atualiza Server Components (ex.: contador do carrinho)
        } catch (err) {
            console.log('deu erro man', err)
        } finally {
            setAddingId(null)
        }
    }

    return (
        <section id="produtos" className="mx-auto max-w-[1120px] scroll-mt-32 px-4 py-10 font-inter text-[#eaeaea] sm:px-6 md:scroll-mt-20 md:py-14">
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

            {!loading && !error && pageSize === 0 && (
                <p className="text-sm uppercase tracking-wider text-neutral-400">Nenhum produto encontrado.</p>
            )}

            {!loading && !error && pageSize > 0 && (
                <>
                    <div className={GRID}>
                        {listProducts.map((p, i) => (
                            <article
                                key={p.id}
                                className="group relative flex min-w-0 flex-col border-b border-r border-[#333] bg-[#161616]"
                            >
                                {/* Imagem */}
                                <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-[#333] bg-[#e6e4dd] p-4 text-[#161616] sm:h-56">
                                    {(isNew(p.created_at) && p.quantity >= 5) && (
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
                                            className={`h-full w-full object-contain mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-105 ${p.quantity <= 0 ? 'opacity-50 grayscale' : ''
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

                                <button
                                    type="button"
                                    disabled={p.quantity <= 0 || addingId !== null}
                                    onClick={() => handleAddCart(p)}
                                    className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-none border-t border-[#333] px-3 text-left text-[12px] font-medium uppercase tracking-widest text-[#eaeaea] transition-colors duration-200 hover:bg-[#ff6a00] hover:text-[#161616] active:brightness-90 disabled:cursor-not-allowed disabled:text-neutral-600 disabled:hover:bg-transparent disabled:hover:text-neutral-600 sm:px-4"
                                >
                                    {p.quantity <= 0 ? (
                                        'Indisponível'
                                    ) : addingId === p.id ? (
                                        'Adicionando...'
                                    ) : (
                                        <>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-4 w-4"
                                            >
                                                <circle cx="9" cy="21" r="1" />
                                                <circle cx="20" cy="21" r="1" />
                                                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
                                            </svg>
                                            + Adicionar ao carrinho
                                        </>
                                    )}
                                </button>
                            </article>
                        ))}
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
        </section>
    )
}