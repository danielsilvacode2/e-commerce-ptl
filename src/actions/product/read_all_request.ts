import ApiUrlBase from '../api'
import { createHttpApiError, fetchWithTimeout } from '@/src/lib/api-error'

// 1. Tipagem do produto individual
export type ProductResponse = {
  id: string
  name: string
  sku: string
  description: string
  price: number
  quantity: number
  image: string
  update_at: string
  created_at: string
}

// 2. Tipagem que espelha o dto.PaginatedProducts do backend
export type PaginatedProductsResponse = {
  data: ProductResponse[]
  page: number
  limit: number
  total_rows: number
  total_pages: number
}

// 3. Lista paginada de produtos com timeout e classificação de erros
export default async function ProductReadAllService(
  page: number = 1,
  limit: number = 5,
  signal?: AbortSignal
): Promise<PaginatedProductsResponse> {
  const baseUrl = ApiUrlBase()

  const res = await fetchWithTimeout(`${baseUrl}/products?page=${page}&limit=${limit}`, {
    method: 'GET',
    signal,
  })

  if (!res.ok) {
    throw createHttpApiError(res.status, 'ProductReadAllService')
  }

  const json = await res.json()
  const body = json['Body:'] || json.Body || {}

  return {
    data: Array.isArray(body.products) ? body.products : Array.isArray(body.data) ? body.data : [],
    page: body.page || page,
    limit: body.limit || limit,
    total_rows: body.total_rows || 0,
    total_pages: body.total_pages || 1,
  }
}
