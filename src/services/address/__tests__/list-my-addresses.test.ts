import { describe, expect, it, vi } from 'vitest'
import { createListMyAddressesUseCase } from '../list-my-addresses'

describe('ListMyAddressesUseCase', () => {
  it('retorna endereços normalizados filtrando registros sem id', async () => {
    const repo = {
      listMyAddresses: vi.fn().mockResolvedValue([
        {
          id: 'addr-1',
          cep: '01001-000',
          street: ' Praça da Sé ',
          number: ' 100 ',
          complement: ' Apto 1 ',
          neighborhood: ' Sé ',
          city: ' São Paulo ',
          state: 'sp',
        },
        {
          cep: '20040-020',
          street: 'Sem ID',
          number: '1',
          city: 'Rio',
          state: 'RJ',
        },
      ]),
    }

    const useCase = createListMyAddressesUseCase(repo)
    const list = await useCase.execute()

    expect(list).toHaveLength(1)
    expect(list[0]).toEqual({
      id: 'addr-1',
      cep: '01001000',
      street: 'Praça da Sé',
      number: '100',
      complement: 'Apto 1',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    })
  })
})
