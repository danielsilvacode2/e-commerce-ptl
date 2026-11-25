import ApiUrlBase from '../api'
import { ApiError, createHttpApiError, fetchWithTimeout } from '@/src/lib/api-error'
import { OrderResponse, OrderApiEnvelope } from '@/src/types/order'

export default async function ReadOrderByIdService(orderId: string): Promise<OrderResponse> {
  const baseUrl = ApiUrlBase()

  const res = await fetchWithTimeout(`${baseUrl}/orders/${orderId}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!res.ok) {
    throw createHttpApiError(res.status, 'ReadOrderByIdService')
  }

  const json = (await res.json()) as OrderApiEnvelope<OrderResponse>
  const body = json['Body:'] ?? json.Body

  if (!body) {
    throw new ApiError('not-found', json.Response?.mensagem ?? 'Pedido não encontrado.', {
      status: 404,
    })
  }

  return body
}
