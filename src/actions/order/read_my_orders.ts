import ApiUrlBase from '../api'
import { createHttpApiError, fetchWithTimeout } from '@/src/lib/api-error'
import { PaginatedOrdersResponse, OrderApiEnvelope } from '@/src/types/order'

export interface ReadMyOrdersParams {
  page?: number
  limit?: number
  status?: string
}

export default async function ReadMyOrdersService({
  page = 1,
  limit = 10,
  status = '',
}: ReadMyOrdersParams = {}): Promise<PaginatedOrdersResponse> {
  const baseUrl = ApiUrlBase()

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (status) {
    params.append('status', status.toUpperCase())
  }

  const res = await fetchWithTimeout(`${baseUrl}/orders/me?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!res.ok) {
    throw createHttpApiError(res.status, 'ReadMyOrdersService')
  }

  const json = (await res.json()) as OrderApiEnvelope<PaginatedOrdersResponse>
  const body = json['Body:'] ?? json.Body

  if (!body) {
    return {
      data: [],
      page,
      limit,
      total_rows: 0,
      total_pages: 0,
    }
  }

  return {
    ...body,
    data: body.data ?? [],
  }
}
