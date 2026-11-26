import ApiUrlBase from '../api'
import { createHttpApiError, fetchWithTimeout } from '@/src/lib/api-error'

export default async function RemoveProductCart(id: string): Promise<void> {
  const baseUrl = ApiUrlBase()

  const res = await fetchWithTimeout(`${baseUrl}/cart/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!res.ok) {
    throw createHttpApiError(res.status, 'RemoveProductCart')
  }
}
