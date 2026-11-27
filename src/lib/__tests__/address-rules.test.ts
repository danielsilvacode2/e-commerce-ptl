import { describe, expect, it } from 'vitest'
import {
  formatAddressCompact,
  formatAddressFull,
  formatCepMask,
  isCompleteCep,
  isValidBrazilianUF,
  normalizeAddressInput,
  stripCepDigits,
  validateAddressLocally,
} from '../address-rules'

describe('address-rules (domínio)', () => {
  it('aplica máscara 00000-000 e limita a 8 dígitos', () => {
    expect(formatCepMask('01001000')).toBe('01001-000')
    expect(formatCepMask('01001-000999')).toBe('01001-000')
    expect(formatCepMask('01a01b')).toBe('0101')
    expect(stripCepDigits('01001-000')).toBe('01001000')
    expect(isCompleteCep('01001-000')).toBe(true)
    expect(isCompleteCep('01001-00')).toBe(false)
  })

  it('valida siglas de UF brasileiras corretamente', () => {
    expect(isValidBrazilianUF('sp')).toBe(true)
    expect(isValidBrazilianUF('RJ')).toBe(true)
    expect(isValidBrazilianUF('DF')).toBe(true)
    expect(isValidBrazilianUF('XX')).toBe(false)
    expect(isValidBrazilianUF('')).toBe(false)
  })

  it('valida campos obrigatórios localmente e aceita números como 123A e S/N', () => {
    const errors = validateAddressLocally({
      cep: '123',
      street: '  ',
      number: '',
      city: '',
      state: 'ZZ',
    })
    expect(errors.cep).toBeDefined()
    expect(errors.street).toBeDefined()
    expect(errors.number).toBeDefined()
    expect(errors.city).toBeDefined()
    expect(errors.state).toBeDefined()

    const validErrors = validateAddressLocally({
      cep: '01001-000',
      street: 'Praça da Sé',
      number: 'S/N',
      city: 'São Paulo',
      state: 'sp',
    })
    expect(Object.keys(validErrors)).toHaveLength(0)

    const normalized = normalizeAddressInput({
      cep: '01001-000',
      street: '  Praça da Sé ',
      number: ' 123A ',
      complement: '  Apto 10 ',
      neighborhood: ' Sé ',
      city: ' São Paulo ',
      state: 'sp',
    })
    expect(normalized).toEqual({
      cep: '01001000',
      street: 'Praça da Sé',
      number: '123A',
      complement: 'Apto 10',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    })
  })

  it('formata endereço completo e trata pedidos legados que só possuem CEP', () => {
    expect(
      formatAddressFull({
        cep: '01001000',
        street: 'Praça da Sé',
        number: '100',
        complement: 'Apto 12',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
      })
    ).toBe('Praça da Sé, 100 - Apto 12 • Sé • São Paulo/SP • CEP 01001-000')

    expect(
      formatAddressFull({
        cep: '01001000',
        street: '',
        number: '',
        city: '',
        state: '',
      })
    ).toBe('CEP 01001-000')

    expect(
      formatAddressCompact({
        cep: '20040020',
        street: 'Rua da Assembleia',
        number: '10',
        city: 'Rio de Janeiro',
        state: 'RJ',
      })
    ).toBe('Rua da Assembleia, 10 · Rio de Janeiro/RJ · CEP 20040-020')
  })
})
