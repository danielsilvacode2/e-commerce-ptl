import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AccountAddresses from '../account-addresses'

describe('AccountAddresses (apresentação)', () => {
  it('lista endereços cadastrados e permite cadastrar um novo endereço', async () => {
    const listAddressesUC = {
      execute: vi.fn().mockResolvedValue([
        {
          id: 'addr-1',
          cep: '01001000',
          street: 'Praça da Sé',
          number: '100',
          neighborhood: 'Sé',
          city: 'São Paulo',
          state: 'SP',
        },
      ]),
    }

    const createAddressUC = {
      execute: vi.fn().mockResolvedValue({
        id: 'addr-2',
        cep: '20040020',
        street: 'Rua da Assembleia',
        number: '10',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
      }),
    }

    const lookupUseCase = {
      execute: vi.fn().mockResolvedValue({
        cep: '20040020',
        street: 'Rua da Assembleia',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
      }),
    }

    render(
      <AccountAddresses
        listAddressesUC={listAddressesUC}
        createAddressUC={createAddressUC}
        lookupUseCase={lookupUseCase}
      />
    )

    expect(await screen.findByText('Praça da Sé, 100')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Novo Endereço/i }))

    fireEvent.change(screen.getByLabelText(/CEP/i), { target: { value: '20040020' } })
    fireEvent.change(screen.getByLabelText(/Rua \/ Logradouro/i), {
      target: { value: 'Rua da Assembleia' },
    })
    fireEvent.change(screen.getByLabelText(/Número/i), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/Cidade/i), { target: { value: 'Rio de Janeiro' } })
    fireEvent.change(screen.getByLabelText(/Estado \(UF\)/i), { target: { value: 'RJ' } })

    fireEvent.click(screen.getByRole('button', { name: /Salvar Endereço/i }))

    await waitFor(() => {
      expect(createAddressUC.execute).toHaveBeenCalledTimes(1)
    })

    expect(await screen.findByText('Endereço cadastrado com sucesso!')).toBeInTheDocument()
    expect(screen.getByText('Rua da Assembleia, 10')).toBeInTheDocument()
    expect(screen.getByText('Praça da Sé, 100')).toBeInTheDocument()
  })
})
