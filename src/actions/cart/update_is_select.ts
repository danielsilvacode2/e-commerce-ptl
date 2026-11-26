import ApiUrlBase from '../api'
import { createHttpApiError, fetchWithTimeout } from '@/src/lib/api-error'

interface UpdateIsSelectProps {
  id: string
  select: boolean
}

export default async function UpdateIsSelectCart({
  id,
  select,
}: UpdateIsSelectProps): Promise<void> {
  const urlBase = ApiUrlBase()

  const res = await fetchWithTimeout(`${urlBase}/cart/${id}`, {
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
    throw createHttpApiError(res.status, 'UpdateIsSelectCart')
  }
}
