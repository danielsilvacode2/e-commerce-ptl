import ApiUrlBase from '../api'
import {
  CART_MUTATION_TIMEOUT_MS,
  createHttpApiError,
  fetchWithTimeout,
} from '@/src/lib/api-error'

interface DecreaseProductCartProps {
  id: string
  quantity: number
}

export default async function DecreaseProductCart({
  id,
  quantity,
}: DecreaseProductCartProps): Promise<void> {
  const urlBase = ApiUrlBase()

  const res = await fetchWithTimeout(
    `${urlBase}/cart/decrease/${id}`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity,
      }),
    },
    CART_MUTATION_TIMEOUT_MS
  )

  if (!res.ok) {
    throw createHttpApiError(res.status, 'DecreaseProductCart')
  }
}
