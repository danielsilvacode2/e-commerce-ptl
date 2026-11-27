import { isCompleteCep, stripCepDigits } from '../../lib/address-rules'
import { AddressLookupError, type AddressLookupResult } from '../../types/address'

export interface AddressLookupRepository {
  lookupByCep(cepDigits: string, signal?: AbortSignal): Promise<AddressLookupResult>
}

export interface LookupAddressByCepUseCase {
  execute(rawCep: string, signal?: AbortSignal): Promise<AddressLookupResult>
}

/**
 * Caso de uso de aplicacao para consultar endereco por CEP.
 * Recebe o repositorio por injecao de dependencia (porta), mantendo a camada isolada de HTTP.
 */
export function createLookupAddressByCepUseCase(
  repository: AddressLookupRepository
): LookupAddressByCepUseCase {
  return {
    async execute(rawCep: string, signal?: AbortSignal): Promise<AddressLookupResult> {
      if (!isCompleteCep(rawCep)) {
        throw new AddressLookupError(
          'invalid',
          'Informe um CEP válido com 8 dígitos (ex.: 00000-000).'
        )
      }

      const cepDigits = stripCepDigits(rawCep)
      const result = await repository.lookupByCep(cepDigits, signal)

      return {
        cep: stripCepDigits(result.cep || cepDigits),
        street: result.street?.trim() ?? '',
        neighborhood: result.neighborhood?.trim() ?? '',
        city: result.city?.trim() ?? '',
        state: result.state?.trim().toUpperCase() ?? '',
      }
    },
  }
}
