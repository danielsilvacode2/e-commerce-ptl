import ApiUrlBase from '../api'
import {
  SESSION_FETCH_TIMEOUT_MS,
  createHttpApiError,
  fetchWithTimeout,
} from '@/src/lib/api-error'

export type UserResponse = {
  Id: string
  name: string
  email: string
  role: string
  update_at: string
  created_at: string
}

export default async function ReadMe(): Promise<UserResponse | null> {
  const baseUrl = ApiUrlBase()
  const res = await fetchWithTimeout(
    `${baseUrl}/users/me`,
    {
      method: 'GET',
      credentials: 'include',
    },
    SESSION_FETCH_TIMEOUT_MS
  )

  if (res.status === 401) return null
  if (!res.ok) throw createHttpApiError(res.status, 'ReadMe')

  const data = await res.json()
  return (data['Body:'] ?? data.Body) as UserResponse
}
