import ApiUrlBase from '../api'
import { ApiError, fetchWithTimeout } from '@/src/lib/api-error'
import { AddressLookupError, AddressLookupResult } from '@/src/types/address'
import { OrderApiEnvelope } from '@/src/types/order'
import { extractBackendErrorMessage } from '../order/mapper'

interface AddressLookupResponseDto {
  cep: string
  street: string
  neighborhood?: string
  city: string
  state: string
}

const CEP_LOOKUP_TIMEOUT_MS = 8_000

/**
 * Consulta o endpoint de lookup da nossa API (nunca chama BrasilAPI diretamente do navegador).
 */
export default async function LookupAddressByCepAction(
  cepDigits: string,
  signal?: AbortSignal
): Promise<AddressLookupResult> {
  const baseUrl = ApiUrlBase()
  const encodedCep = encodeURIComponent(cepDigits)

  let res: Response
  try {
    res = await fetchWithTimeout(
      `${baseUrl}/addresses/lookup/${encodedCep}`,
      {
        method: 'GET',
        credentials: 'include',
        signal,
      },
      CEP_LOOKUP_TIMEOUT_MS
    )
  } catch (err: unknown) {
    if (signal?.aborted) {
      throw err
    }
    if (err instanceof ApiError && (err.kind === 'offline' || err.kind === 'timeout' || err.kind === 'server')) {
      throw new AddressLookupError(
        'unavailable',
        'Serviço de consulta de CEP indisponível no momento. Você pode preencher o endereço manualmente.'
      )
    }
    throw new AddressLookupError(
      'unavailable',
      'Não foi possível consultar o CEP agora. Você pode preencher o endereço manualmente.'
    )
  }

  if (res.status === 401) {
    throw new AddressLookupError('unauthorized', 'Sua sessão expirou. Faça login novamente.', 401)
  }

  if (res.status === 404) {
    throw new AddressLookupError(
      'not-found',
      'CEP não encontrado. Verifique os dígitos ou preencha o endereço manualmente.',
      404
    )
  }

  if (res.status === 400) {
    const errorData = await res.json().catch(() => null)
    throw new AddressLookupError(
      'invalid',
      extractBackendErrorMessage(errorData, 'CEP inválido. Informe 8 dígitos.'),
      400
    )
  }

  if (res.status === 503 || res.status >= 500 || res.status === 429) {
    throw new AddressLookupError(
      'unavailable',
      'Serviço de consulta de CEP temporariamente indisponível. Você pode preencher o endereço manualmente.',
      res.status
    )
  }

  if (!res.ok) {
    throw new AddressLookupError(
      'generic',
      'Erro ao consultar o CEP. Preencha o endereço manualmente.',
      res.status
    )
  }

  const json = (await res.json()) as OrderApiEnvelope<AddressLookupResponseDto>
  const body = json['Body:'] ?? json.Body

  if (!body) {
    throw new AddressLookupError(
      'unavailable',
      'Resposta inválida ao consultar CEP. Preencha o endereço manualmente.'
    )
  }

  return {
    cep: body.cep ?? cepDigits,
    street: body.street ?? '',
    neighborhood: body.neighborhood ?? '',
    city: body.city ?? '',
    state: body.state ?? '',
  }
}
