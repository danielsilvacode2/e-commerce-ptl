import CreateAddressAction from '@/src/actions/address/create_address'
import LookupAddressByCepAction from '@/src/actions/address/lookup_cep'
import ReadMyAddressesAction from '@/src/actions/address/read_my_addresses'
import { createCreateAddressUseCase } from './create-address'
import { createListMyAddressesUseCase } from './list-my-addresses'
import { createLookupAddressByCepUseCase } from './lookup-address-by-cep'

export { createLookupAddressByCepUseCase } from './lookup-address-by-cep'
export type { AddressLookupRepository, LookupAddressByCepUseCase } from './lookup-address-by-cep'
export { createListMyAddressesUseCase } from './list-my-addresses'
export type { ListMyAddressesUseCase, SavedAddressesRepository } from './list-my-addresses'
export { createCreateAddressUseCase } from './create-address'
export type {
  AddressCreationRepository,
  CreateAddressResult,
  CreateAddressUseCase,
} from './create-address'

export const lookupAddressByCepUseCase = createLookupAddressByCepUseCase({
  lookupByCep: LookupAddressByCepAction,
})

export const listMyAddressesUseCase = createListMyAddressesUseCase({
  listMyAddresses: ReadMyAddressesAction,
})

export const createAddressUseCase = createCreateAddressUseCase({
  createAddress: CreateAddressAction,
})
