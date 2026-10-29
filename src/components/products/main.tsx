'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2, ImageOff, X, ChevronLeft, ChevronRight } from 'lucide-react'
import ProductReadAllService, { ProductResponse } from '@/src/actions/product/read_all_request'
import DeleteProductById from '@/src/actions/product/detete_product'
import EditProductModal from './modal/modal'

const DELETE_DELAY_MS = 5000
const PAGE_LIMIT = 8

const formatPrice = (value: number | string) =>
    Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function MainProducts() {
    const [products, setProducts] = useState<ProductResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>("")
    const [errorDelete, setErrorDelete] = useState<string>("")
    const [pendingDelete, setPendingDelete] = useState<ProductResponse | null>(null)
    const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null)

    // Paginação
    const [page, setPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [totalRows, setTotalRows] = useState<number>(0)
    const [reloadKey, setReloadKey] = useState<number>(0)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError("")

        ProductReadAllService(page, PAGE_LIMIT)
            .then((res) => {
                if (cancelled) return
                setProducts(res.data)
                setTotalPages(res.total_pages)
                setTotalRows(res.total_rows)
            })
            .catch(() => {
                if (!cancelled) setError("Erro ao carregar produtos.")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [page, reloadKey])

    useEffect(() => {
        if (!pendingDelete) return

        const product = pendingDelete

        const timer = setTimeout(async () => {
            try {
                await DeleteProductById({ Id: product.id })
                // Se era o último item de uma página que não é a primeira, volta uma página
                if (products.length === 1 && page > 1) {
                    setPage((p) => p - 1)
                } else {
                    setReloadKey((k) => k + 1)
                }
            } catch (err) {
                setErrorDelete("Erro ao deletar produto: " + product.name)
            } finally {
                setPendingDelete(null)
            }
        }, DELETE_DELAY_MS)

        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingDelete])

    function handleEdit(product: ProductResponse) {
        setEditingProduct(product)
    }

    function handleDelete(product: ProductResponse) {
        if (pendingDelete) return
        setErrorDelete("")
        setPendingDelete(product)
    }

    function handleCancelDelete() {
        setPendingDelete(null)
    }

    return (
        <main className="min-h-screen w-full bg-[#121212] font-inter text-[#eaeaea] px-4 py-6 sm:px-6 sm:py-10">
            <style>{`
                @keyframes delete-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>

            <div className="mx-auto w-full max-w-5xl">

                {/* Cabeçalho */}
                <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-[#333] pb-4">
                    <div className="min-w-0">
                        <h1 className="font-['Barlow_Condensed',Impact,sans-serif] text-2xl font-bold uppercase tracking-wide text-[#eaeaea] sm:text-3xl">
                            Produtos
                        </h1>
                        <p className="mt-1 text-[11px] uppercase tracking-wider text-neutral-400 sm:text-xs">
                            Gerencie os produtos cadastrados.
                        </p>
                    </div>
                    <span className="shrink-0 text-[11px] uppercase tracking-widest text-[#ff6a00] sm:text-xs">
                        {totalRows} {totalRows === 1 ? "item" : "itens"}
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

                {errorDelete && (
                    <span role="alert" className="mt-8 block text-[11px] uppercase tracking-wider text-red-500">
                        {errorDelete}
                    </span>
                )}

                {!loading && !error && products.length === 0 && (
                    <p className="mt-8 text-xs uppercase tracking-widest text-neutral-500">
                        Nenhum produto encontrado.
                    </p>
                )}

                {/* Lista + paginação */}
                {!loading && !error && products.length > 0 && (
                    <>
                        <ul className="mt-6 flex flex-col gap-3">
                            {products.map((product) => (
                                <li
                                    key={product.id}
                                    className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3 border border-[#333] bg-[#1c1c1c] p-3 transition hover:border-[#ff6a00] sm:flex sm:gap-4"
                                >
                                    {/* Imagem */}
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-[#333] bg-[#161616] sm:h-16 sm:w-16">
                                        {product.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <ImageOff size={20} className="text-neutral-600" />
                                        )}
                                    </div>

                                    {/* Nome + SKU */}
                                    <div className="min-w-0 sm:flex-1">
                                        <p className="line-clamp-2 break-words text-sm font-medium uppercase tracking-wide text-[#eaeaea] sm:truncate">
                                            {product.name}
                                        </p>
                                        <p className="mt-1 truncate text-[11px] uppercase tracking-widest text-neutral-500">
                                            SKU: {product.sku}
                                        </p>
                                    </div>

                                    {/* Preço + Ações (linha própria no mobile) */}
                                    <div className="col-span-2 flex items-center justify-between gap-3 border-t border-[#333] pt-3 sm:col-span-1 sm:contents sm:border-0 sm:pt-0">
                                        <span className="shrink-0 text-sm font-medium tracking-wide text-[#ff6a00]">
                                            {formatPrice(product.price)}
                                        </span>

                                        <div className="flex shrink-0 items-center gap-2 sm:gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(product)}
                                                aria-label={`Editar ${product.name}`}
                                                className="flex h-10 w-10 cursor-pointer items-center justify-center border border-[#333] text-neutral-400 transition hover:border-[#ff6a00] hover:text-[#ff6a00] sm:h-9 sm:w-9"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(product)}
                                                disabled={!!pendingDelete}
                                                aria-label={`Excluir ${product.name}`}
                                                className="flex h-10 w-10 cursor-pointer items-center justify-center border border-[#333] text-neutral-400 transition hover:border-red-500 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {totalPages > 1 && (
                            <nav
                                aria-label="Paginação"
                                className="mt-6 flex items-center justify-between gap-3 border-t border-[#333] pt-4"
                            >
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    aria-label="Página anterior"
                                    className="flex h-9 w-9 cursor-pointer items-center justify-center border border-[#333] text-neutral-400 transition hover:border-[#ff6a00] hover:text-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#333] disabled:hover:text-neutral-400"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <span className="text-[11px] uppercase tracking-widest text-neutral-400 sm:text-xs">
                                    Página <span className="text-[#ff6a00]">{page}</span> de {totalPages}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    aria-label="Próxima página"
                                    className="flex h-9 w-9 cursor-pointer items-center justify-center border border-[#333] text-neutral-400 transition hover:border-[#ff6a00] hover:text-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#333] disabled:hover:text-neutral-400"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </nav>
                        )}
                    </>
                )}
            </div>

            {/* Modal de edição */}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSaved={(updated) =>
                        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                    }
                />
            )}

            {/* Toast de exclusão pendente */}
            {pendingDelete && (
                <div
                    role="status"
                    className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-hidden border border-[#ff6a00] bg-[#1c1c1c] shadow-lg"
                >
                    <div className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="min-w-0 break-words text-[11px] uppercase tracking-wider text-[#ff6a00]">
                            Excluindo: {pendingDelete.name}
                        </span>
                        <button
                            type="button"
                            onClick={handleCancelDelete}
                            aria-label="Cancelar exclusão"
                            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center border border-[#333] text-neutral-400 transition hover:border-red-500 hover:text-red-500"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="h-1 w-full bg-[#333]">
                        <div
                            key={pendingDelete.id}
                            className="h-full bg-[#ff6a00]"
                            style={{ animation: `delete-progress ${DELETE_DELAY_MS}ms linear forwards` }}
                        />
                    </div>
                </div>
            )}
        </main>
    )
}