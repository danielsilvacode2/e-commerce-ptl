import ApiUrlBase from '../api'
import { createHttpApiError, fetchWithTimeout } from '@/src/lib/api-error'

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

export default async function ProductReadService(
  id: string,
  signal?: AbortSignal
): Promise<ProductResponse> {
  const baseUrl = ApiUrlBase()

  const res = await fetchWithTimeout(`${baseUrl}/products/${id}`, {
    method: 'GET',
    signal,
  })

  if (!res.ok) {
    throw createHttpApiError(res.status, 'ProductReadService')
  }

  const json = await res.json()
  const body = json['Body:'] ?? json.Body ?? null

  return body
}
