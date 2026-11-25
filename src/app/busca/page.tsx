'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Package } from 'lucide-react'
import HeaderHome from '@/src/components/home/header/header'
import FooterHome from '@/src/components/home/footer/footer'
import ProductSearchService from '@/src/actions/product/search_request'
import { PaginatedProductsResponse, ProductResponse } from '@/src/actions/product/read_all_request'
import { isSearchTermValid, normalizeSearchTerm } from '@/src/lib/search'
import ProductDetailModal from '@/src/components/products/product-detail-modal'
import { formatCurrencyBRL } from '@/src/lib/product-rules'
import { classifyErrorVariant, ErrorStateVariant, logClientError } from '@/src/lib/api-error'
import { clientCache } from '@/src/lib/client-cache'
import ErrorState from '@/src/components/ui/error-state'
import StaleDataBanner from '@/src/components/ui/stale-data-banner'
import ErrorBoundary from '@/src/components/ui/error-boundary'
import { ProductGridSkeleton } from '@/src/components/ui/skeletons'

const PAGE_LIMIT = 8

type Status = 'idle' | 'loading' | 'success' | 'error'

interface SearchResult {
  key: string
  failed: boolean
  errorVariant: ErrorStateVariant | null
  isStale: boolean
  cachedAt: number | null
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

  const page = pageState.term === term ? pageState.page : 1
  const setPage = (next: number) => setPageState({ term, page: next })

  const valid = isSearchTermValid(term)
  const key = `${term}|${page}|${attempt}`

  useEffect(() => {
    if (!valid) return

    const controller = new AbortController()
    const cacheKey = `search-page:${term.toLowerCase()}:${page}:${PAGE_LIMIT}`

    // Stale-While-Revalidate: mostra resultados recentes em cache enquanto revalida
    const freshCached = clientCache.get<PaginatedProductsResponse>(cacheKey, 2 * 60 * 1000)
    if (freshCached) {
      queueMicrotask(() => {
        if (controller.signal.aborted) return
        setResult({
          key,
          failed: false,
          errorVariant: null,
          isStale: false,
          cachedAt: freshCached.savedAt,
          products: freshCached.data.data,
          totalPages: freshCached.data.total_pages,
        })
      })
    }

    ProductSearchService(term, page, PAGE_LIMIT, controller.signal)
      .then((res) => {
        clientCache.set(cacheKey, res)
        setResult({
          key,
          failed: false,
          errorVariant: null,
          isStale: false,
          cachedAt: null,
          products: res.data,
          totalPages: res.total_pages,
        })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        logClientError('SearchPage', err, { term, page })

        const cached = clientCache.get<PaginatedProductsResponse>(cacheKey)
        if (cached) {
          setResult({
            key,
            failed: false,
            errorVariant: null,
            isStale: true,
            cachedAt: cached.savedAt,
            products: cached.data.data,
            totalPages: cached.data.total_pages,
          })
          return
        }

        setResult({
          key,
          failed: true,
          errorVariant: classifyErrorVariant(err),
          isStale: false,
          cachedAt: null,
          products: [],
          totalPages: 1,
        })
      })

    return () => controller.abort()
  }, [term, page, valid, key])

  let status: Status = 'loading'
  if (!valid) status = 'idle'
  else if (result && result.key === key) status = result.failed ? 'error' : 'success'

  const products = status === 'success' && result ? result.products : []
  const totalPages = result?.totalPages ?? 1
  const isStale = status === 'success' && Boolean(result?.isStale)
  const cachedAt = result?.cachedAt ?? null
  const errorVariant = result?.errorVariant ?? 'generic'

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12" aria-live="polite">
      <div className="border-b border-black/10 dark:border-white/10 pb-6 mb-8">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          BUSCA NO CATÁLOGO
        </span>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
          {term ? `Resultados para "${term}"` : 'Pesquisar peças'}
        </h1>
      </div>

      {status === 'idle' && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Digite ao menos 2 caracteres na barra de busca para explorar o catálogo.
        </p>
      )}

      {status === 'loading' && <ProductGridSkeleton count={4} label="Buscando produtos..." />}

      {status === 'error' && (
        <ErrorState
          variant={errorVariant}
          onRetry={() => setAttempt((v) => v + 1)}
          autoFocusRetry
          secondaryHref="/"
          secondaryLabel="Voltar à loja"
        />
      )}

      {status === 'success' && isStale && (
        <StaleDataBanner
          savedAt={cachedAt}
          onRetry={() => setAttempt((v) => v + 1)}
          className="mb-6"
        />
      )}

      {status === 'success' && products.length === 0 && (
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#181818] p-10 text-center">
          <p className="font-display text-lg font-bold uppercase tracking-tight">
            Nenhuma peça encontrada
          </p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Tente buscar por outro termo ou explore o catálogo completo na página inicial.
          </p>
        </div>
      )}

      {status === 'success' && products.length > 0 && (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <li key={product.id} className="group flex flex-col text-left">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  aria-label={`Ver detalhes de ${product.name}`}
                  className="flex flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black dark:focus-visible:outline-white rounded-2xl cursor-pointer"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white flex items-center justify-center p-6 transition-shadow duration-200 group-hover:shadow-md border border-black/10 dark:border-white/10">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                      />
                    ) : (
                      <Package className="h-12 w-12 stroke-1 text-neutral-400" aria-hidden="true" />
                    )}
                  </div>
                  <h2 className="mt-4 font-display text-base font-bold uppercase tracking-tight truncate group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                    {product.name}
                  </h2>
                  <p className="mt-1 font-sans text-lg font-bold text-black dark:text-white">
                    {formatCurrencyBRL(product.price)}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-full border border-black/15 dark:border-white/15 text-xs font-semibold uppercase hover:bg-[#F2F0F1] dark:hover:bg-[#252525] focus-visible:outline-2 active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>
              <span className="text-xs font-mono">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-full border border-black/15 dark:border-white/15 text-xs font-semibold uppercase hover:bg-[#F2F0F1] dark:hover:bg-[#252525] focus-visible:outline-2 active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Próxima
              </button>
            </nav>
          )}
        </>
      )}

      <Link
        href="/"
        className="mt-10 inline-block text-xs font-semibold uppercase tracking-wider underline underline-offset-4 hover:opacity-75 focus-visible:outline-2"
      >
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#121212] text-black dark:text-white font-sans transition-colors">
      <HeaderHome />
      <main className="flex-1">
        <ErrorBoundary scope="section" sectionName="os resultados da busca">
          <Suspense
            fallback={
              <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <ProductGridSkeleton count={4} label="Carregando busca..." />
              </section>
            }
          >
            <SearchResults />
          </Suspense>
        </ErrorBoundary>
      </main>
      <FooterHome />
    </div>
  )
}
