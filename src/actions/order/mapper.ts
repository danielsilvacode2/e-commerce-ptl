import type { Address, AddressFieldErrors, AddressFieldName } from '../../types/address'
import type { OrderResponse, PaginatedOrdersResponse } from '../../types/order'

export interface OrderAddressRequestDto {
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood?: string
  city: string
  state: string
}

export interface OrderAddressResponseDto {
  id?: string
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
}

export interface OrderResponseDto extends Omit<OrderResponse, 'address'> {
  address?: OrderAddressResponseDto | null
  zip_code?: string
}

interface BackendFieldErrorDto {
  campo?: string
  mensagem?: string
}

interface BackendErrorEnvelope {
  Response?: {
    status?: number
    mensagem?: string
  }
  'Body:'?: unknown
  Body?: unknown
}

const VALID_ADDRESS_FIELDS = new Set<AddressFieldName>([
  'address_id',
  'cep',
  'street',
  'number',
  'complement',
  'neighborhood',
  'city',
  'state',
])

export function mapAddressToRequestDto(address: Address): OrderAddressRequestDto {
  return {
    cep: address.cep,
    street: address.street,
    number: address.number,
    ...(address.complement ? { complement: address.complement } : {}),
    ...(address.neighborhood ? { neighborhood: address.neighborhood } : {}),
    city: address.city,
    state: address.state,
  }
}

export function mapOrderDtoToDomain(dto: OrderResponseDto): OrderResponse {
  let address: Address | null = null

  if (dto.address) {
    address = {
      id: dto.address.id,
      cep: dto.address.cep ?? '',
      street: dto.address.street ?? '',
      number: dto.address.number ?? '',
      complement: dto.address.complement || undefined,
      neighborhood: dto.address.neighborhood || undefined,
      city: dto.address.city ?? '',
      state: dto.address.state ?? '',
    }
  } else if (dto.zip_code) {
    // Fallback defensivo caso exista payload legado em cache local
    address = {
      cep: dto.zip_code,
      street: '',
      number: '',
      city: '',
      state: '',
    }
  }

  return {
    id: dto.id,
    user: dto.user,
    address,
    status: dto.status,
    address_validation_warning: dto.address_validation_warning,
    tracking_code: dto.tracking_code,
    refund_reason: dto.refund_reason,
    refund_rejection_reason: dto.refund_rejection_reason,
    total: dto.total,
    items: dto.items ?? [],
    update_at: dto.update_at,
    created_at: dto.created_at,
  }
}

export function mapPaginatedOrdersDtoToDomain(
  dto: Omit<PaginatedOrdersResponse, 'data'> & { data?: OrderResponseDto[] }
): PaginatedOrdersResponse {
  return {
    ...dto,
    data: (dto.data ?? []).map(mapOrderDtoToDomain),
  }
}

export function extractAddressFieldErrors(payload: unknown): AddressFieldErrors {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const envelope = payload as BackendErrorEnvelope
  const body = envelope['Body:'] ?? envelope.Body
  if (!Array.isArray(body)) {
    return {}
  }

  const result: AddressFieldErrors = {}
  for (const item of body) {
    if (!item || typeof item !== 'object') continue
    const fieldErr = item as BackendFieldErrorDto
    const field = typeof fieldErr.campo === 'string' ? fieldErr.campo.trim() : ''
    const message = typeof fieldErr.mensagem === 'string' ? fieldErr.mensagem.trim() : ''
    if (field && message && VALID_ADDRESS_FIELDS.has(field as AddressFieldName)) {
      result[field as AddressFieldName] = message
    }
  }

  return result
}

export function extractBackendErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }
  const envelope = payload as BackendErrorEnvelope
  const msg = envelope.Response?.mensagem
  if (typeof msg === 'string' && msg.trim()) {
    return msg.trim()
  }
  return fallback
}
