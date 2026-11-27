import ApiUrlBase from '../api'
import { Address, OrderValidationError } from '@/src/types/address'
import { OrderApiEnvelope, OrderResponse } from '@/src/types/order'
import {
  extractAddressFieldErrors,
  extractBackendErrorMessage,
  mapAddressToRequestDto,
  mapOrderDtoToDomain,
  OrderResponseDto,
} from './mapper'

export type CreateOrderParams =
  | { address_id: string }
  | { address: Address }

export default async function CreateOrderService(
  params: CreateOrderParams
): Promise<OrderResponse> {
  const baseUrl = ApiUrlBase()

  const payload =
    'address_id' in params
      ? { address_id: params.address_id }
      : { address: mapAddressToRequestDto(params.address) }

  const res = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (res.status === 401) {
    throw new Error('Sua sessão expirou. Faça login novamente.')
  }

  if (res.status === 403) {
    throw new Error('Você não tem permissão para usar o endereço selecionado.')
  }

  if (res.status === 404) {
    throw new OrderValidationError(
      'O endereço selecionado não foi encontrado. Escolha outro ou cadastre um novo.',
      { address_id: 'Endereço selecionado não encontrado.' },
      404
    )
  }

  if (res.status === 400 || res.status === 422) {
    const errorData = await res.json().catch(() => null)
    const fieldErrors = extractAddressFieldErrors(errorData)
    const msg = extractBackendErrorMessage(
      errorData,
      'Verifique os dados de endereço ou os itens selecionados no carrinho.'
    )
    throw new OrderValidationError(msg, fieldErrors, res.status)
  }

  if (res.status === 409) {
    throw new Error('Conflito de estoque ao finalizar pedido. Verifique seu carrinho.')
  }

  if (!res.ok) {
    throw new Error('Erro ao criar pedido. Tente novamente mais tarde.')
  }

  const json = (await res.json()) as OrderApiEnvelope<OrderResponseDto>
  const body = json['Body:'] ?? json.Body

  if (!body) {
    throw new Error(json.Response?.mensagem ?? 'Resposta inválida do servidor ao criar pedido.')
  }

  return mapOrderDtoToDomain(body)
}
