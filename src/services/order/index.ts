import CreateOrderService from '@/src/actions/order/create_order'
import { createCreateOrderUseCase } from './create-order'

export { createCreateOrderUseCase } from './create-order'
export type { CreateOrderUseCase, OrderCreationRepository } from './create-order'

export const createOrderUseCase = createCreateOrderUseCase({
  createOrder: (selection) =>
    'addressId' in selection
      ? CreateOrderService({ address_id: selection.addressId })
      : CreateOrderService({ address: selection.address }),
})
