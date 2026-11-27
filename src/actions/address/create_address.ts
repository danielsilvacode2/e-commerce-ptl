import ApiUrlBase from '../api'
import { Address, OrderValidationError } from '@/src/types/address'
import { OrderApiEnvelope } from '@/src/types/order'
import {
  extractAddressFieldErrors,
  extractBackendErrorMessage,
  mapAddressToRequestDto,
  OrderAddressResponseDto,
} from '../order/mapper'

export interface CreatedAddressResponse extends Address {
  id: string
  address_validation_warning?: string
}

interface CreatedAddressDto extends OrderAddressResponseDto {
  address_validation_warning?: string
}

/**
 * Cadastra uma nova instancia de endereco vinculada a conta do usuario autenticado.
 */
export default async function CreateAddressAction(
  address: Address
): Promise<CreatedAddressResponse> {
  const baseUrl = ApiUrlBase()

  const res = await fetch(`${baseUrl}/addresses`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mapAddressToRequestDto(address)),
  })

  if (res.status === 401) {
    throw new Error('Sua sessão expirou. Faça login novamente.')
  }

  if (res.status === 400 || res.status === 422) {
    const errorData = await res.json().catch(() => null)
    const fieldErrors = extractAddressFieldErrors(errorData)
    const msg = extractBackendErrorMessage(
      errorData,
      'Verifique os campos de endereço informados.'
    )
    throw new OrderValidationError(msg, fieldErrors, res.status)
  }

  if (!res.ok) {
    throw new Error('Erro ao cadastrar endereço. Tente novamente mais tarde.')
  }

  const json = (await res.json()) as OrderApiEnvelope<CreatedAddressDto>
  const body = json['Body:'] ?? json.Body

  if (!body || !body.id) {
    throw new Error(json.Response?.mensagem ?? 'Resposta inválida ao cadastrar endereço.')
  }

  return {
    id: body.id,
    cep: body.cep ?? '',
    street: body.street ?? '',
    number: body.number ?? '',
    complement: body.complement || undefined,
    neighborhood: body.neighborhood || undefined,
    city: body.city ?? '',
    state: body.state ?? '',
    address_validation_warning: body.address_validation_warning,
  }
}
