import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ProfileNameEditor from '../profile-name-editor'
import { ProfileValidationError } from '@/src/services/user'

describe('ProfileNameEditor (apresentação)', () => {
  it('abre edição inline, salva novo nome e dispara atualização da sessão', async () => {
    const updateNameUC = {
      execute: vi.fn().mockResolvedValue('Maria Clara'),
    }
    const onNameUpdated = vi.fn()

    render(
      <dl>
        <ProfileNameEditor
          userId="u-1"
          currentName="Maria Silva"
          email="maria@example.com"
          onNameUpdated={onNameUpdated}
          updateNameUC={updateNameUC}
        />
      </dl>
    )

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Editar/i }))

    const input = screen.getByLabelText(/Nome Completo/i) as HTMLInputElement
    expect(input.value).toBe('Maria Silva')

    fireEvent.change(input, { target: { value: 'Maria Clara' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }))

    await waitFor(() => {
      expect(updateNameUC.execute).toHaveBeenCalledWith({
        userId: 'u-1',
        name: 'Maria Clara',
        email: 'maria@example.com',
      })
      expect(onNameUpdated).toHaveBeenCalledTimes(1)
    })

    expect(await screen.findByText('Nome atualizado com sucesso!')).toBeInTheDocument()
  })

  it('exibe erro de validação quando o nome informado é inválido', async () => {
    const updateNameUC = {
      execute: vi
        .fn()
        .mockRejectedValue(
          new ProfileValidationError('Informe um nome com pelo menos 2 caracteres.')
        ),
    }

    render(
      <dl>
        <ProfileNameEditor
          userId="u-1"
          currentName="Maria"
          email="maria@example.com"
          onNameUpdated={vi.fn()}
          updateNameUC={updateNameUC}
        />
      </dl>
    )

    fireEvent.click(screen.getByRole('button', { name: /Editar/i }))
    fireEvent.change(screen.getByLabelText(/Nome Completo/i), { target: { value: 'M' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }))

    expect(
      await screen.findByText('Informe um nome com pelo menos 2 caracteres.')
    ).toBeInTheDocument()
  })
})
