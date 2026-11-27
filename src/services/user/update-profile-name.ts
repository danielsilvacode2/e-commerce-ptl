export interface UpdateProfileNameInput {
  userId: string
  name: string
  email: string
}

export interface UserProfileRepository {
  updateProfile(input: UpdateProfileNameInput): Promise<void>
}

export interface UpdateProfileNameUseCase {
  execute(input: UpdateProfileNameInput): Promise<string>
}

export class ProfileValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfileValidationError'
  }
}

/**
 * Caso de uso para validar e atualizar o nome da conta do usuario autenticado.
 */
export function createUpdateProfileNameUseCase(
  repository: UserProfileRepository
): UpdateProfileNameUseCase {
  return {
    async execute(input: UpdateProfileNameInput): Promise<string> {
      const normalizedName = input.name.trim()
      if (normalizedName.length < 2) {
        throw new ProfileValidationError('Informe um nome com pelo menos 2 caracteres.')
      }
      if (normalizedName.length > 100) {
        throw new ProfileValidationError('O nome deve ter no máximo 100 caracteres.')
      }

      await repository.updateProfile({
        userId: input.userId,
        name: normalizedName,
        email: input.email.trim(),
      })

      return normalizedName
    },
  }
}
