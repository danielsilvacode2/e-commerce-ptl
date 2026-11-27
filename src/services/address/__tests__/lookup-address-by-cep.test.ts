import { describe, expect, it, vi } from 'vitest'
import { createLookupAddressByCepUseCase } from '../lookup-address-by-cep'
import { AddressLookupError } from '@/src/types/address'

describe('LookupAddressByCepUseCase', () => {
  it('normaliza CEP com máscara e retorna endereço normalizado', async () => {
    const repo = {
      lookupByCep: vi.fn().mockResolvedValue({
        cep: '01001-000',
        street: ' Praça da Sé ',
        neighborhood: ' Sé ',
        city: ' São Paulo ',
        state: 'sp',
      }),
    }

    const useCase = createLookupAddressByCepUseCase(repo)
    const result = await useCase.execute('01001-000')

    expect(repo.lookupByCep).toHaveBeenCalledWith('01001000', undefined)
    expect(result).toEqual({
      cep: '01001000',
      street: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    })
  })

  it('rejeita CEP incompleto antes de acionar a camada de infraestrutura', async () => {
    const repo = { lookupByCep: vi.fn() }
    const useCase = createLookupAddressByCepUseCase(repo)

    await expect(useCase.execute('01001-00')).rejects.toBeInstanceOf(AddressLookupError)
    expect(repo.lookupByCep).not.toHaveBeenCalled()
  })

  it('propaga erro de CEP não encontrado vindo do repositório', async () => {
    const repo = {
      lookupByCep: vi
        .fn()
        .mockRejectedValue(new AddressLookupError('not-found', 'CEP não encontrado.', 404)),
    }
    const useCase = createLookupAddressByCepUseCase(repo)

    await expect(useCase.execute('99999-999')).rejects.toMatchObject({
      kind: 'not-found',
      status: 404,
    })
  })
})
