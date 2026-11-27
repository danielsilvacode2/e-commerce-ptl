import { normalizeAddressInput } from '../../lib/address-rules'
import type { Address } from '../../types/address'

export interface SavedAddressesRepository {
  listMyAddresses(signal?: AbortSignal): Promise<Address[]>
}

export interface ListMyAddressesUseCase {
  execute(signal?: AbortSignal): Promise<Address[]>
}

/**
 * Caso de uso de aplicacao para listar os enderecos ja cadastrados pelo usuario autenticado.
 */
export function createListMyAddressesUseCase(
  repository: SavedAddressesRepository
): ListMyAddressesUseCase {
  return {
    async execute(signal?: AbortSignal): Promise<Address[]> {
      const addresses = await repository.listMyAddresses(signal)
      return addresses
        .filter((addr) => Boolean(addr.id))
        .map((addr) => normalizeAddressInput(addr))
    },
  }
}
