import { describe, expect, it, vi } from 'vitest'
import { createCreateOrderUseCase } from '../create-order'
import { OrderValidationError } from '@/src/types/address'
import { extractAddressFieldErrors, mapOrderDtoToDomain } from '@/src/actions/order/mapper'

describe('CreateOrderUseCase e mapper de DTO', () => {
  it('valida campos locais antes de chamar o repositório ao cadastrar novo endereço', async () => {
    const repo = { createOrder: vi.fn() }
    const useCase = createCreateOrderUseCase(repo)

    let caught: unknown
    try {
      await useCase.execute({
        address: {
          cep: '1234',
          street: '',
          number: '',
          city: '',
          state: 'XX',
        },
      })
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(OrderValidationError)
    const valErr = caught as OrderValidationError
    expect(valErr.fieldErrors.cep).toBeDefined()
    expect(valErr.fieldErrors.street).toBeDefined()
    expect(valErr.fieldErrors.number).toBeDefined()
    expect(valErr.fieldErrors.city).toBeDefined()
    expect(valErr.fieldErrors.state).toBeDefined()
    expect(repo.createOrder).not.toHaveBeenCalled()
  })

  it('envia addressId diretamente ao reutilizar endereço salvo', async () => {
    const mockOrder = {
      id: 'order-saved-1',
      user: { id: 'u1', name: 'Ana', email: 'ana@example.com' },
      address: {
        id: 'addr-saved-1',
        cep: '01001000',
        street: 'Praça da Sé',
        number: '100',
        city: 'São Paulo',
        state: 'SP',
      },
      status: 'PENDING_PAYMENT' as const,
      total: 100,
      items: [],
      update_at: '',
      created_at: '',
    }
    const repo = { createOrder: vi.fn().mockResolvedValue(mockOrder) }
    const useCase = createCreateOrderUseCase(repo)

    const result = await useCase.execute({ addressId: '  addr-saved-1  ' })

    expect(repo.createOrder).toHaveBeenCalledWith({ addressId: 'addr-saved-1' })
    expect(result.id).toBe('order-saved-1')
  })

  it('rejeita addressId vazio antes de chamar o repositório', async () => {
    const repo = { createOrder: vi.fn() }
    const useCase = createCreateOrderUseCase(repo)

    await expect(useCase.execute({ addressId: '   ' })).rejects.toBeInstanceOf(OrderValidationError)
    expect(repo.createOrder).not.toHaveBeenCalled()
  })

  it('normaliza o novo endereço e envia para o repositório quando válido', async () => {
    const mockOrder = {
      id: 'order-1',
      user: { id: 'u1', name: 'Ana', email: 'ana@example.com' },
      address: {
        id: 'addr-1',
        cep: '01001000',
        street: 'Praça da Sé',
        number: '100A',
        complement: 'Apto 2',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
      },
      status: 'PENDING_PAYMENT' as const,
      total: 199.9,
      items: [],
      update_at: '2026-01-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
    }
    const repo = { createOrder: vi.fn().mockResolvedValue(mockOrder) }
    const useCase = createCreateOrderUseCase(repo)

    const result = await useCase.execute({
      address: {
        cep: '01001-000',
        street: '  Praça da Sé ',
        number: ' 100A ',
        complement: ' Apto 2 ',
        neighborhood: ' Sé ',
        city: ' São Paulo ',
        state: 'sp',
      },
    })

    expect(repo.createOrder).toHaveBeenCalledWith({
      address: {
        cep: '01001000',
        street: 'Praça da Sé',
        number: '100A',
        complement: 'Apto 2',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
      },
    })
    expect(result.id).toBe('order-1')
  })

  it('extrai erros por campo vindos no envelope padrão do backend', () => {
    const fieldErrors = extractAddressFieldErrors({
      Response: { status: 422, mensagem: 'Os dados de endereço informados não são válidos.' },
      'Body:': [
        { campo: 'city', mensagem: 'A cidade informada (Campinas) diverge do CEP (São Paulo).' },
        { campo: 'state', mensagem: 'O estado informado (RJ) diverge do CEP (SP).' },
      ],
    })

    expect(fieldErrors).toEqual({
      city: 'A cidade informada (Campinas) diverge do CEP (São Paulo).',
      state: 'O estado informado (RJ) diverge do CEP (SP).',
    })
  })

  it('mapeia DTO de pedido preservando endereço completo e fallback legado', () => {
    const mappedLegacy = mapOrderDtoToDomain({
      id: 'legacy-1',
      user: { id: 'u1', name: 'João', email: 'joao@example.com' },
      zip_code: '01001-000',
      status: 'DELIVERED',
      total: 50,
      items: [],
      update_at: '',
      created_at: '',
    })

    expect(mappedLegacy.address).toEqual({
      cep: '01001-000',
      street: '',
      number: '',
      city: '',
      state: '',
    })
  })
})
