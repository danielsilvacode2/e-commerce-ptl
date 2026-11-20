'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2, ImageOff, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'
import ProductReadAllService, { ProductResponse } from '@/src/actions/product/read_all_request'
import DeleteProductById from '@/src/actions/product/detete_product'
import EditProductModal from './modal/modal'

const DELETE_DELAY_MS = 4000
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
    }, [pendingDelete, page, products.length])

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
        <main className="min-h-screen flex-1 bg-white px-6 py-8 font-sans text-black">
            <style>{`
                @keyframes delete-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>

            <div className="mx-auto w-full max-w-5xl">
                {/* Cabeçalho */}
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-6">
                    <div>
                        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-black">
                            PRODUTOS CADASTRADOS
                        </h1>
                        <p className="mt-1 text-sm text-neutral-600 font-sans">
                            Gerencie os produtos ativos na sua loja.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            {totalRows} {totalRows === 1 ? "produto" : "produtos"}
                        </span>
                        <Link
                            href="/produtos/novo"
                            className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors"
                        >
                            <Plus size={14} /> Novo Produto
                        </Link>
                    </div>
                </header>

                {/* Estados */}
                {loading && (
                    <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Carregando produtos...
                    </p>
                )}

                {error && (
                    <div role="alert" className="mt-6 p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-medium border border-red-200">
                        {error}
                    </div>
                )}

                {errorDelete && (
                    <div role="alert" className="mt-6 p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-medium border border-red-200">
                        {errorDelete}
                    </div>
                )}

                {!loading && !error && products.length === 0 && (
                    <div className="mt-8 rounded-3xl bg-[#F2F0F1] p-12 text-center">
                        <p className="text-sm font-semibold uppercase tracking-wider text-black">
                            Nenhum produto cadastrado no momento.
                        </p>
                    </div>
                )}

                {/* Lista */}
                {!loading && !error && products.length > 0 && (
                    <>
                        <ul className="mt-6 flex flex-col gap-3">
                            {products.map((product) => (
                                <li
                                    key={product.id}
                                    className="rounded-3xl border border-black/10 bg-white p-4 transition-all hover:border-black/30 hover:shadow-sm sm:flex sm:items-center sm:gap-4"
                                >
                                    {/* Imagem com fundo #F2F0F1 */}
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F2F0F1] p-2">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="h-full w-full object-contain mix-blend-multiply"
                                            />
                                        ) : (
                                            <ImageOff size={20} className="text-neutral-400" />
                                        )}
                                    </div>

                                    {/* Nome + SKU */}
                                    <div className="min-w-0 sm:flex-1 mt-3 sm:mt-0">
                                        <p className="font-display font-bold text-base text-black uppercase tracking-tight truncate">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-neutral-500 font-sans mt-0.5">
                                            SKU: {product.sku}
                                        </p>
                                    </div>

                                    {/* Preço + Ações */}
                                    <div className="flex items-center justify-between sm:justify-end gap-6 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-black/5">
                                        <span className="font-display font-bold text-base sm:text-lg text-black">
                                            {formatPrice(product.price)}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(product)}
                                                aria-label={`Editar ${product.name}`}
                                                className="h-9 w-9 rounded-full border border-black/15 flex items-center justify-center text-black hover:bg-[#F2F0F1] transition-colors cursor-pointer"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(product)}
                                                disabled={!!pendingDelete}
                                                aria-label={`Excluir ${product.name}`}
                                                className="h-9 w-9 rounded-full border border-red-200 flex items-center justify-center text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors cursor-pointer"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {totalPages > 1 && (
                            <nav
                                aria-label="Paginação"
                                className="mt-10 flex items-center justify-center gap-3"
                            >
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="h-10 px-4 rounded-full border border-black/15 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] disabled:opacity-40 transition-colors cursor-pointer"
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
                                    className="h-10 px-4 rounded-full border border-black/15 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                    Próxima <ChevronRight size={16} className="inline ml-1" />
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
                    className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl bg-black text-white p-4 shadow-2xl border border-white/10"
                >
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-xs font-semibold">
                            Excluindo: {pendingDelete.name}
                        </span>
                        <button
                            type="button"
                            onClick={handleCancelDelete}
                            className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <div
                            key={pendingDelete.id}
                            className="h-full bg-white"
                            style={{ animation: `delete-progress ${DELETE_DELAY_MS}ms linear forwards` }}
                        />
                    </div>
                </div>
            )}
        </main>
    )
}
