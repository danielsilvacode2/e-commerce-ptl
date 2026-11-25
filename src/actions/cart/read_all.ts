import ApiUrlBase from '../api'
import { ApiError, createHttpApiError, fetchWithTimeout } from '@/src/lib/api-error'

export interface ProductCartResponse {
  id: string
  isSelect: boolean
  quantity: number
  stock?: number
  product_id: string
  name: string
  sku: string
  description: string
  price: number
  image: string
}

export interface CartUserResponse {
  id: string
  name: string
  email: string
  role: string
}

export interface CartResponse {
  id: string
  user: CartUserResponse
  list: ProductCartResponse[]
}

interface CartApiEnvelope {
  'Body:'?: CartResponse
  Body?: CartResponse
  Response?: {
    status: number
    mensagem: string
  }
}

export default async function ReadCart(): Promise<CartResponse> {
  const urlBase = ApiUrlBase()

  const res = await fetchWithTimeout(`${urlBase}/cart`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!res.ok) {
    throw createHttpApiError(res.status, 'ReadCart')
  }

  const json = (await res.json()) as CartApiEnvelope
  const body = json['Body:'] ?? json.Body

  if (!body) {
    throw new ApiError('generic', json.Response?.mensagem ?? 'Resposta inválida do carrinho')
  }

  return {
    ...body,
    list: body.list ?? [],
  }
}
