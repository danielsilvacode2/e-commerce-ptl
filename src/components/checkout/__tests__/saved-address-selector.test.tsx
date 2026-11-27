import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SavedAddressSelector from '../saved-address-selector'
import { Address } from '@/src/types/address'

const sampleAddresses: Address[] = [
  {
    id: 'addr-1',
    cep: '01001000',
    street: 'Praça da Sé',
    number: '100',
    complement: 'Apto 12',
    neighborhood: 'Sé',
    city: 'São Paulo',
    state: 'SP',
  },
  {
    id: 'addr-2',
    cep: '20040020',
    street: 'Rua da Assembleia',
    number: '10',
    neighborhood: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
  },
]

describe('SavedAddressSelector (apresentação)', () => {
  it('renderiza múltiplos endereços salvos, permite trocar seleção e acionar novo endereço', () => {
    const onSelect = vi.fn()
    const onAddNew = vi.fn()

    render(
      <SavedAddressSelector
        addresses={sampleAddresses}
        selectedAddressId="addr-1"
        onSelect={onSelect}
        onAddNew={onAddNew}
      />
    )

    expect(screen.getByText('Praça da Sé, 100 — Apto 12')).toBeInTheDocument()
    expect(screen.getByText('Rua da Assembleia, 10')).toBeInTheDocument()

    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios[0].checked).toBe(true)
    expect(radios[1].checked).toBe(false)

    fireEvent.click(radios[1])
    expect(onSelect).toHaveBeenCalledWith('addr-2')

    fireEvent.click(screen.getByRole('button', { name: /Cadastrar novo endereço/i }))
    expect(onAddNew).toHaveBeenCalledTimes(1)
  })
})
