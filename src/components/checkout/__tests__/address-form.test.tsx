import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AddressForm from '../address-form'
import {
  Address,
  AddressFieldErrors,
  AddressFieldName,
  AddressLookupError,
} from '@/src/types/address'
import { LookupAddressByCepUseCase } from '@/src/services/address'

function ControlledAddressForm({
  initialAddress,
  initialErrors = {},
  lookupUseCase,
  debounceMs = 0,
}: {
  initialAddress?: Partial<Address>
  initialErrors?: AddressFieldErrors
  lookupUseCase: LookupAddressByCepUseCase
  debounceMs?: number
}) {
  const [address, setAddress] = useState<Address>({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    ...initialAddress,
  })
  const [fieldErrors, setFieldErrors] = useState<AddressFieldErrors>(initialErrors)

  function clearError(field: AddressFieldName) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  return (
    <AddressForm
      value={address}
      onChange={setAddress}
      fieldErrors={fieldErrors}
      onClearFieldError={clearError}
      lookupUseCase={lookupUseCase}
      debounceMs={debounceMs}
    />
  )
}

describe('AddressForm (apresentação)', () => {
  it('aplica máscara de CEP, dispara lookup ao completar 8 dígitos, preenche campos editáveis e foca no número', async () => {
    const lookupUseCase: LookupAddressByCepUseCase = {
      execute: vi.fn().mockResolvedValue({
        cep: '01001000',
        street: 'Praça da Sé',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
      }),
    }

    render(<ControlledAddressForm lookupUseCase={lookupUseCase} debounceMs={0} />)

    const cepInput = screen.getByLabelText(/CEP/i) as HTMLInputElement
    fireEvent.change(cepInput, { target: { value: '01001000' } })

    expect(cepInput.value).toBe('01001-000')

    await waitFor(() => {
      expect(lookupUseCase.execute).toHaveBeenCalledTimes(1)
      expect(lookupUseCase.execute).toHaveBeenCalledWith('01001000', expect.any(AbortSignal))
    })

    const streetInput = screen.getByLabelText(/Rua \/ Logradouro/i) as HTMLInputElement
    const neighborhoodInput = screen.getByLabelText(/Bairro/i) as HTMLInputElement
    const cityInput = screen.getByLabelText(/Cidade/i) as HTMLInputElement
    const stateSelect = screen.getByLabelText(/Estado \(UF\)/i) as HTMLSelectElement
    const numberInput = screen.getByLabelText(/Número/i) as HTMLInputElement

    expect(streetInput.value).toBe('Praça da Sé')
    expect(neighborhoodInput.value).toBe('Sé')
    expect(cityInput.value).toBe('São Paulo')
    expect(stateSelect.value).toBe('SP')

    // O campo número deve receber foco após o preenchimento automático
    expect(document.activeElement).toBe(numberInput)

    // Todos os campos preenchidos continuam editáveis pelo usuário
    fireEvent.change(streetInput, { target: { value: 'Praça da Sé - Lado Ímpar' } })
    fireEvent.change(cityInput, { target: { value: 'Guarulhos' } })
    fireEvent.change(stateSelect, { target: { value: 'RJ' } })
    fireEvent.change(numberInput, { target: { value: '123A' } })

    expect(streetInput.value).toBe('Praça da Sé - Lado Ímpar')
    expect(cityInput.value).toBe('Guarulhos')
    expect(stateSelect.value).toBe('RJ')
    expect(numberInput.value).toBe('123A')
  })

  it('exibe estado de erro para CEP não encontrado e permite preenchimento manual', async () => {
    const lookupUseCase: LookupAddressByCepUseCase = {
      execute: vi
        .fn()
        .mockRejectedValue(
          new AddressLookupError(
            'not-found',
            'CEP não encontrado. Verifique os dígitos ou preencha o endereço manualmente.',
            404
          )
        ),
    }

    render(<ControlledAddressForm lookupUseCase={lookupUseCase} debounceMs={0} />)

    fireEvent.change(screen.getByLabelText(/CEP/i), { target: { value: '99999999' } })

    expect(await screen.findByText(/CEP não encontrado/i)).toBeInTheDocument()

    // Usuário consegue preencher manualmente mesmo após falha
    const streetInput = screen.getByLabelText(/Rua \/ Logradouro/i) as HTMLInputElement
    const cityInput = screen.getByLabelText(/Cidade/i) as HTMLInputElement
    fireEvent.change(streetInput, { target: { value: 'Rua Manual' } })
    fireEvent.change(cityInput, { target: { value: 'Curitiba' } })

    expect(streetInput.value).toBe('Rua Manual')
    expect(cityInput.value).toBe('Curitiba')
  })

  it('exibe aviso e botão de tentar novamente quando a consulta de CEP está indisponível', async () => {
    const executeMock = vi
      .fn()
      .mockRejectedValueOnce(
        new AddressLookupError(
          'unavailable',
          'Serviço de consulta de CEP temporariamente indisponível. Você pode preencher o endereço manualmente.',
          503
        )
      )
      .mockResolvedValueOnce({
        cep: '20040020',
        street: 'Rua da Assembleia',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
      })

    render(<ControlledAddressForm lookupUseCase={{ execute: executeMock }} debounceMs={0} />)

    fireEvent.change(screen.getByLabelText(/CEP/i), { target: { value: '20040020' } })

    expect(await screen.findByText(/temporariamente indisponível/i)).toBeInTheDocument()
    const retryButton = screen.getByRole('button', { name: /Tentar novamente/i })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect((screen.getByLabelText(/Rua \/ Logradouro/i) as HTMLInputElement).value).toBe(
        'Rua da Assembleia'
      )
    })
  })

  it('exibe erros de validação vindos do backend por campo com aria-invalid e limpa ao editar', () => {
    const lookupUseCase: LookupAddressByCepUseCase = { execute: vi.fn() }

    render(
      <ControlledAddressForm
        lookupUseCase={lookupUseCase}
        initialErrors={{
          city: 'A cidade informada (Campinas) diverge do CEP (São Paulo).',
          number: 'O número é obrigatório.',
        }}
      />
    )

    const cityInput = screen.getByLabelText(/Cidade/i)
    const numberInput = screen.getByLabelText(/Número/i)

    expect(cityInput).toHaveAttribute('aria-invalid', 'true')
    expect(numberInput).toHaveAttribute('aria-invalid', 'true')
    expect(
      screen.getByText('A cidade informada (Campinas) diverge do CEP (São Paulo).')
    ).toBeInTheDocument()
    expect(screen.getByText('O número é obrigatório.')).toBeInTheDocument()

    // Editar o campo limpa o erro correspondente
    fireEvent.change(cityInput, { target: { value: 'São Paulo' } })
    expect(cityInput).toHaveAttribute('aria-invalid', 'false')
    expect(
      screen.queryByText('A cidade informada (Campinas) diverge do CEP (São Paulo).')
    ).not.toBeInTheDocument()
  })
})
