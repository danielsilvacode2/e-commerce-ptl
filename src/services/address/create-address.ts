import { normalizeAddressInput, validateAddressLocally } from '../../lib/address-rules'
import { OrderValidationError, type Address } from '../../types/address'

export interface CreateAddressResult extends Address {
  id: string
  address_validation_warning?: string
}

export interface AddressCreationRepository {
  createAddress(address: Address): Promise<CreateAddressResult>
}

export interface CreateAddressUseCase {
  execute(address: Address): Promise<CreateAddressResult>
}

/**
 * Caso de uso de aplicacao para cadastrar um novo endereco salvo na conta do usuario.
 */
export function createCreateAddressUseCase(
  repository: AddressCreationRepository
): CreateAddressUseCase {
  return {
    async execute(address: Address): Promise<CreateAddressResult> {
      const localErrors = validateAddressLocally(address)
      if (Object.keys(localErrors).length > 0) {
        throw new OrderValidationError(
          'Verifique os campos de endereço destacados antes de salvar.',
          localErrors,
          400
        )
      }

      const normalized = normalizeAddressInput(address)
      return repository.createAddress(normalized)
    },
  }
}
