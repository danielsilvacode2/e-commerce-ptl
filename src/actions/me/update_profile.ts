import ApiUrlBase from '../api'
import { extractBackendErrorMessage } from '../order/mapper'

export interface UpdateProfileParams {
  userId: string
  name: string
  email: string
}

/**
 * Atualiza o nome do perfil do usuario autenticado via PUT /api/v1/users/:id.
 */
export default async function UpdateProfileAction({
  userId,
  name,
  email,
}: UpdateProfileParams): Promise<void> {
  const baseUrl = ApiUrlBase()

  const res = await fetch(`${baseUrl}/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      email,
    }),
  })

  if (res.status === 401) {
    throw new Error('Sua sessão expirou. Faça login novamente.')
  }

  if (res.status === 403) {
    throw new Error('Não é permitido alterar este dado da conta.')
  }

  if (res.status === 400) {
    const errorData = await res.json().catch(() => null)
    throw new Error(
      extractBackendErrorMessage(errorData, 'Informe um nome válido com pelo menos 2 caracteres.')
    )
  }

  if (!res.ok) {
    throw new Error('Não foi possível atualizar seu nome agora. Tente novamente mais tarde.')
  }
}
