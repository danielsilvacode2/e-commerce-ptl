import { describe, expect, it, vi } from 'vitest'
import { createCreateAddressUseCase } from '../create-address'
import { OrderValidationError } from '@/src/types/address'

describe('CreateAddressUseCase', () => {
  it('valida campos locais antes de chamar o repositório', async () => {
    const repo = { createAddress: vi.fn() }
    const useCase = createCreateAddressUseCase(repo)

    await expect(
      useCase.execute({
        cep: '123',
        street: '',
        number: '',
        city: '',
        state: 'XX',
      })
    ).rejects.toBeInstanceOf(OrderValidationError)

    expect(repo.createAddress).not.toHaveBeenCalled()
  })

  it('normaliza e envia novo endereço para persistência', async () => {
    const repo = {
      createAddress: vi.fn().mockResolvedValue({
        id: 'addr-new-1',
        cep: '01001000',
        street: 'Praça da Sé',
        number: '200',
        complement: 'Sala 3',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
      }),
    }
    const useCase = createCreateAddressUseCase(repo)

    const result = await useCase.execute({
      cep: '01001-000',
      street: '  Praça da Sé ',
      number: ' 200 ',
      complement: ' Sala 3 ',
      neighborhood: ' Sé ',
      city: ' São Paulo ',
      state: 'sp',
    })

    expect(repo.createAddress).toHaveBeenCalledWith({
      cep: '01001000',
      street: 'Praça da Sé',
      number: '200',
      complement: 'Sala 3',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    })
    expect(result.id).toBe('addr-new-1')
  })
})
