import { normalizeAddressInput, validateAddressLocally } from '../../lib/address-rules'
import { OrderValidationError, type OrderAddressSelection } from '../../types/address'
import type { OrderResponse } from '../../types/order'

export interface OrderCreationRepository {
  createOrder(selection: OrderAddressSelection): Promise<OrderResponse>
}

export interface CreateOrderUseCase {
  execute(selection: OrderAddressSelection): Promise<OrderResponse>
}

/**
 * Caso de uso de criacao de pedido aceitando:
 * - reutilizacao de um endereco salvo (`{ addressId }`), ou
 * - cadastro de uma nova instancia de endereco (`{ address }`) com validacao local previa.
 */
export function createCreateOrderUseCase(
  repository: OrderCreationRepository
): CreateOrderUseCase {
  return {
    async execute(selection: OrderAddressSelection): Promise<OrderResponse> {
      if ('addressId' in selection) {
        const trimmedId = selection.addressId.trim()
        if (!trimmedId) {
          throw new OrderValidationError(
            'Selecione um endereço salvo ou cadastre um novo endereço.',
            { address_id: 'Selecione um endereço para entrega.' },
            400
          )
        }
        return repository.createOrder({ addressId: trimmedId })
      }

      const localErrors = validateAddressLocally(selection.address)
      if (Object.keys(localErrors).length > 0) {
        throw new OrderValidationError(
          'Verifique os campos de endereço destacados antes de continuar.',
          localErrors,
          400
        )
      }

      const normalized = normalizeAddressInput(selection.address)
      return repository.createOrder({ address: normalized })
    },
  }
}
