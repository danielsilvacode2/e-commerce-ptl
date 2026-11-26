import ApiUrlBase from '../api'
import {
  CART_MUTATION_TIMEOUT_MS,
  createHttpApiError,
  fetchWithTimeout,
} from '@/src/lib/api-error'

interface RemoveProductCartOptions {
  keepalive?: boolean
}

export default async function RemoveProductCart(
  id: string,
  options?: RemoveProductCartOptions
): Promise<void> {
  const baseUrl = ApiUrlBase()

  const res = await fetchWithTimeout(
    `${baseUrl}/cart/${id}`,
    {
      method: 'DELETE',
      credentials: 'include',
      keepalive: options?.keepalive,
    },
    CART_MUTATION_TIMEOUT_MS
  )

  if (!res.ok) {
    throw createHttpApiError(res.status, 'RemoveProductCart')
  }
}
