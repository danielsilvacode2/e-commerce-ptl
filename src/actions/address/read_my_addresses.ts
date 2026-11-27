import ApiUrlBase from '../api'
import { createHttpApiError, fetchWithTimeout } from '@/src/lib/api-error'
import { Address } from '@/src/types/address'
import { OrderApiEnvelope } from '@/src/types/order'
import { OrderAddressResponseDto } from '../order/mapper'

/**
 * Busca os enderecos completos ja cadastrados pelo usuario autenticado.
 */
export default async function ReadMyAddressesAction(signal?: AbortSignal): Promise<Address[]> {
  const baseUrl = ApiUrlBase()

  const res = await fetchWithTimeout(`${baseUrl}/addresses/me`, {
    method: 'GET',
    credentials: 'include',
    signal,
  })

  if (!res.ok) {
    throw createHttpApiError(res.status, 'ReadMyAddressesAction')
  }

  const json = (await res.json()) as OrderApiEnvelope<OrderAddressResponseDto[]>
  const body = json['Body:'] ?? json.Body

  if (!Array.isArray(body)) {
    return []
  }

  return body.map((item) => ({
    id: item.id,
    cep: item.cep ?? '',
    street: item.street ?? '',
    number: item.number ?? '',
    complement: item.complement || undefined,
    neighborhood: item.neighborhood || undefined,
    city: item.city ?? '',
    state: item.state ?? '',
  }))
}
