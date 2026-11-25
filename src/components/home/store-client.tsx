'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import ProductReadAllService, {
  PaginatedProductsResponse,
  ProductResponse,
} from '@/src/actions/product/read_all_request'
import { classifyErrorVariant, ErrorStateVariant, logClientError } from '@/src/lib/api-error'
import { clientCache } from '@/src/lib/client-cache'
import { useSession } from '@/src/components/providers/session-provider'
import ErrorBoundary from '@/src/components/ui/error-boundary'
import HeroHome from '@/src/components/home/hero/hero'
import HeaderHome from '@/src/components/home/header/header'
import ArticleHome from '@/src/components/home/article/article'
import BenefitsHome from '@/src/components/home/benefits/benefit'
import FooterHome from '@/src/components/home/footer/footer'

export const HOME_PAGE_LIMIT = 8
const PRODUCTS_SWR_TTL_MS = 2 * 60 * 1000

function PlaceholderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-14 w-14 text-black/20 sm:h-16 sm:w-16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </svg>
  )
}

interface ProductsState {
  key: string
  products: ProductResponse[]
  totalPages: number
  errorVariant: ErrorStateVariant | null
  isStale: boolean
  cachedAt: number | null
}

interface StoreClientProps {
  initialPageData: PaginatedProductsResponse | null
}

export default function StoreClient({ initialPageData }: StoreClientProps) {
  const { cart, isAuthenticated, refreshCart } = useSession()
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [productsState, setProductsState] = useState<ProductsState | null>(() =>
    initialPageData
      ? {
          key: '1|0',
          products: initialPageData.data,
          totalPages: initialPageData.total_pages,
          errorVariant: null,
          isStale: false,
          cachedAt: null,
        }
      : null
  )

  const usedInitialDataRef = useRef(Boolean(initialPageData))
  const queryKey = `${page}|${attempt}`

  useEffect(() => {
    const cacheKey = `products:page:${page}:limit:${HOME_PAGE_LIMIT}`

    // Se a página 1 veio hidratada do SSR, apenas persiste no clientCache sem duplicar o fetch inicial
    if (page === 1 && attempt === 0 && usedInitialDataRef.current && initialPageData) {
      usedInitialDataRef.current = false
      clientCache.set(cacheKey, initialPageData)
      return
    }

    const controller = new AbortController()

    // Stale-While-Revalidate: exibe cache recente antes do próximo paint enquanto atualiza em segundo plano
    const freshCached = clientCache.get<PaginatedProductsResponse>(cacheKey, PRODUCTS_SWR_TTL_MS)
    if (freshCached) {
      queueMicrotask(() => {
        if (controller.signal.aborted) return
        setProductsState({
          key: queryKey,
          products: freshCached.data.data,
          totalPages: freshCached.data.total_pages,
          errorVariant: null,
          isStale: false,
          cachedAt: freshCached.savedAt,
        })
      })
    }

    ProductReadAllService(page, HOME_PAGE_LIMIT, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return
        clientCache.set(cacheKey, res)
        setProductsState({
          key: queryKey,
          products: res.data,
          totalPages: res.total_pages,
          errorVariant: null,
          isStale: false,
          cachedAt: null,
        })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        logClientError('StorePage:loadProducts', err, { page })

        const cached = clientCache.get<PaginatedProductsResponse>(cacheKey)
        if (cached) {
          setProductsState({
            key: queryKey,
            products: cached.data.data,
            totalPages: cached.data.total_pages,
            errorVariant: null,
            isStale: true,
            cachedAt: cached.savedAt,
          })
        } else {
          setProductsState({
            key: queryKey,
            products: [],
            totalPages: 1,
            errorVariant: classifyErrorVariant(err),
            isStale: false,
            cachedAt: null,
          })
        }
      })

    return () => {
      controller.abort()
    }
  }, [page, attempt, queryKey, initialPageData])

  const loading = productsState?.key !== queryKey
  const products =
    productsState?.key === queryKey ? productsState.products : productsState?.products ?? []
  const totalPages = productsState?.totalPages ?? 1
  const errorVariant = productsState?.key === queryKey ? productsState.errorVariant : null
  const isStale = productsState?.key === queryKey ? productsState.isStale : false
  const cachedAt = productsState?.key === queryKey ? productsState.cachedAt : null

  function handlePageChange(newPage: number) {
    setPage(newPage)
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleRetryProducts = useCallback(() => {
    setAttempt((v) => v + 1)
  }, [])

  const handleCartSynced = useCallback(() => {
    void refreshCart({ silent: true })
  }, [refreshCart])

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors">
      <HeaderHome />
      <main>
        <ErrorBoundary scope="section" sectionName="o destaque principal" onReset={handleRetryProducts}>
          <HeroHome listProducts={products} loading={loading && products.length === 0} />
        </ErrorBoundary>

        <BenefitsHome />

        <ErrorBoundary scope="section" sectionName="a lista de produtos" onReset={handleRetryProducts}>
          <ArticleHome
            PlaceholderIcon={PlaceholderIcon}
            loading={loading}
            errorVariant={errorVariant}
            isStale={isStale}
            cachedAt={cachedAt}
            onRetry={handleRetryProducts}
            listProducts={products}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onCartSynced={handleCartSynced}
            cart={cart}
            isAuthenticated={isAuthenticated}
          />
        </ErrorBoundary>
      </main>
      <FooterHome />
    </div>
  )
}
