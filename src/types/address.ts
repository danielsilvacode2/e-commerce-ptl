export interface Address {
  id?: string
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood?: string
  city: string
  state: string
}

export interface AddressLookupResult {
  cep: string
  street: string
  neighborhood?: string
  city: string
  state: string
}

export type AddressFieldName =
  | 'address_id'
  | 'cep'
  | 'street'
  | 'number'
  | 'complement'
  | 'neighborhood'
  | 'city'
  | 'state'

export type OrderAddressSelection =
  | { addressId: string }
  | { address: Address }

export type AddressFieldErrors = Partial<Record<AddressFieldName, string>>

export type AddressLookupErrorKind =
  | 'invalid'
  | 'not-found'
  | 'unavailable'
  | 'unauthorized'
  | 'generic'

export class AddressLookupError extends Error {
  readonly kind: AddressLookupErrorKind
  readonly status?: number

  constructor(kind: AddressLookupErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'AddressLookupError'
    this.kind = kind
    this.status = status
  }
}

export class OrderValidationError extends Error {
  readonly fieldErrors: AddressFieldErrors
  readonly status?: number

  constructor(message: string, fieldErrors: AddressFieldErrors = {}, status?: number) {
    super(message)
    this.name = 'OrderValidationError'
    this.fieldErrors = fieldErrors
    this.status = status
  }
}
