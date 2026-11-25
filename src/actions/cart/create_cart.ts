import ApiUrlBase from '../api'
import { createHttpApiError, fetchWithTimeout } from '@/src/lib/api-error'

interface CartRequest {
  product_id: string
  quantity: number
}

export default async function CreateCart({ product_id, quantity }: CartRequest) {
  const urlBase = ApiUrlBase()

  const res = await fetchWithTimeout(`${urlBase}/cart`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id,
      quantity,
    }),
  })

  if (!res.ok) {
    throw createHttpApiError(res.status, 'CreateCart')
  }
}
