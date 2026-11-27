import { describe, expect, it, vi } from 'vitest'
import {
  createUpdateProfileNameUseCase,
  ProfileValidationError,
} from '../update-profile-name'

describe('UpdateProfileNameUseCase', () => {
  it('rejeita nome vazio ou com menos de 2 caracteres', async () => {
    const repo = { updateProfile: vi.fn() }
    const useCase = createUpdateProfileNameUseCase(repo)

    await expect(
      useCase.execute({ userId: 'u1', name: ' A ', email: 'a@example.com' })
    ).rejects.toBeInstanceOf(ProfileValidationError)

    expect(repo.updateProfile).not.toHaveBeenCalled()
  })

  it('sanitiza e envia o nome atualizado preservando o e-mail', async () => {
    const repo = { updateProfile: vi.fn().mockResolvedValue(undefined) }
    const useCase = createUpdateProfileNameUseCase(repo)

    const savedName = await useCase.execute({
      userId: 'user-123',
      name: '  Daniel Alves  ',
      email: ' daniel@example.com ',
    })

    expect(savedName).toBe('Daniel Alves')
    expect(repo.updateProfile).toHaveBeenCalledWith({
      userId: 'user-123',
      name: 'Daniel Alves',
      email: 'daniel@example.com',
    })
  })
})
