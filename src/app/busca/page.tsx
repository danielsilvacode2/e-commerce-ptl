'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'
import ProductSearchService from '@/src/actions/product/search_request'
import { ProductResponse } from '@/src/actions/product/read_all_request'
import { isSearchTermValid, normalizeSearchTerm } from '@/src/lib/search'
import ProductDetailModal from '@/src/components/products/product-detail-modal'
import { formatCurrencyBRL } from '@/src/lib/product-rules'

const PAGE_LIMIT = 8

type Status = 'idle' | 'loading' | 'success' | 'error'

interface SearchResult {
  key: string
  failed: boolean
  products: ProductResponse[]
  totalPages: number
}

function SearchResults() {
  const params = useSearchParams()
  const term = normalizeSearchTerm(params.get('q') ?? '')

  const [pageState, setPageState] = useState({ term, page: 1 })
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null)

  // Nova busca volta para a primeira pagina
  const page = pageState.term === term ? pageState.page : 1
  const setPage = (next: number) => setPageState({ term, page: next })

  const valid = isSearchTermValid(term)
  const key = `${term}|${page}|${attempt}`

  useEffect(() => {
    if (!valid) return

    const controller = new AbortController()

    ProductSearchService(term, page, PAGE_LIMIT, controller.signal)
      .then((res) => setResult({ key, failed: false, products: res.data, totalPages: res.total_pages }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, failed: true, products: [], totalPages: 1 })
      })

    return () => controller.abort()
  }, [term, page, valid, key])

  // Resultado com chave diferente da busca atual e obsoleto
  let status: Status = 'loading'
  if (!valid) status = 'idle'
  else if (result && result.key === key) status = result.failed ? 'error' : 'success'

  const products = status === 'success' && result ? result.products : []
  const totalPages = result?.totalPages ?? 1

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12" aria-live="polite">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
        Resultados para &quot;{term}&quot;
      </h1>

      {status === 'idle' && (
        <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">Digite ao menos 2 caracteres para buscar.</p>
      )}

      {status === 'loading' && <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">Buscando...</p>}

      {status === 'error' && (
        <div className="mt-6 flex items-center gap-3 text-sm">
          <span>Não foi possível buscar os produtos.</span>
          <button
            type="button"
            onClick={() => setAttempt((v) => v + 1)}
            className="rounded-full border border-black/15 dark:border-white/15 px-4 py-2 text-xs font-semibold uppercase hover:bg-[#F2F0F1] dark:hover:bg-[#252525] focus-visible:outline-2 active:opacity-70"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {status === 'success' && products.length === 0 && (
        <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">Nenhum produto encontrado.</p>
      )}

      {status === 'success' && products.length > 0 && (
        <>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <li
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedProduct(product)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Ver detalhes de ${product.name}`}
                className="group flex flex-col text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black dark:focus-visible:outline-white rounded-2xl"
              >
                <div className="aspect-square w-full overflow-hidden rounded-2xl bg-[#F2F0F1] dark:bg-[#1f1f1f] flex items-center justify-center p-4 transition-all duration-300 group-hover:shadow-md">
                  {product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.name} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" />
                  )}
                </div>
                <h2 className="mt-4 text-sm font-bold uppercase truncate group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">{product.name}</h2>
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">{formatCurrencyBRL(product.price)}</p>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-full border border-black/15 dark:border-white/15 text-xs font-semibold uppercase hover:bg-[#F2F0F1] dark:hover:bg-[#252525] focus-visible:outline-2 active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-xs">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-full border border-black/15 dark:border-white/15 text-xs font-semibold uppercase hover:bg-[#F2F0F1] dark:hover:bg-[#252525] focus-visible:outline-2 active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </nav>
          )}
        </>
      )}

      <Link href="/" className="mt-10 inline-block text-xs font-semibold uppercase underline">
        Voltar à loja
      </Link>

      <ProductDetailModal
        productId={selectedProduct?.id ?? null}
        initialProduct={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  )
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-black dark:text-white font-sans transition-colors">
      <HeaderHome />
      <main>
        <Suspense fallback={<p className="px-4 py-12 text-sm">Carregando...</p>}>
          <SearchResults />
        </Suspense>
      </main>
      <FooterHome />
    </div>
  )
}
