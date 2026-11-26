import ApiUrlBase from '../api'
import { createHttpApiError, fetchWithTimeout } from '@/src/lib/api-error'

interface UpdateAllIsSelectProps {
  select: boolean
}

export default async function UpdateAllIsSelectCart({
  select,
}: UpdateAllIsSelectProps): Promise<void> {
  const urlBase = ApiUrlBase()

  const res = await fetchWithTimeout(`${urlBase}/cart`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      select,
    }),
  })

  if (!res.ok) {
    throw createHttpApiError(res.status, 'UpdateAllIsSelectCart')
  }
}
