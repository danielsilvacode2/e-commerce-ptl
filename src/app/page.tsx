import { Suspense } from 'react'
import ApiUrlBase from '@/src/actions/api'
import { PaginatedProductsResponse } from '@/src/actions/product/read_all_request'
import StoreClient, { HOME_PAGE_LIMIT } from '@/src/components/home/store-client'

const SSR_FETCH_TIMEOUT_MS = 2500

async function fetchInitialProductsServer(): Promise<PaginatedProductsResponse | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SSR_FETCH_TIMEOUT_MS)

  try {
    const baseUrl = ApiUrlBase()
    const res = await fetch(`${baseUrl}/products?page=1&limit=${HOME_PAGE_LIMIT}`, {
      method: 'GET',
      signal: controller.signal,
      next: { revalidate: 30 },
    })

    if (!res.ok) return null

    const json = await res.json()
    const body = json['Body:'] || json.Body || {}

    return {
      data: Array.isArray(body.products)
        ? body.products
        : Array.isArray(body.data)
        ? body.data
        : [],
      page: body.page || 1,
      limit: body.limit || HOME_PAGE_LIMIT,
      total_rows: body.total_rows || 0,
      total_pages: body.total_pages || 1,
    }
  } catch {
    // Fallback silencioso: caso a API esteja indisponível durante SSR/build, o client assume com cache/retry
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function StorePageLoader() {
  const initialPageData = await fetchInitialProductsServer()
  return <StoreClient initialPageData={initialPageData} />
}

export default function StorePage() {
  return (
    <Suspense fallback={<StoreClient initialPageData={null} />}>
      <StorePageLoader />
    </Suspense>
  )
}
