import ApiUrlBase from '../api'
import {
  CART_MUTATION_TIMEOUT_MS,
  createHttpApiError,
  fetchWithTimeout,
} from '@/src/lib/api-error'

interface UpdateAllIsSelectProps {
  select: boolean
}

export default async function UpdateAllIsSelectCart({
  select,
}: UpdateAllIsSelectProps): Promise<void> {
  const urlBase = ApiUrlBase()

  const res = await fetchWithTimeout(
    `${urlBase}/cart`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        select,
      }),
    },
    CART_MUTATION_TIMEOUT_MS
  )

  if (!res.ok) {
    throw createHttpApiError(res.status, 'UpdateAllIsSelectCart')
  }
}
