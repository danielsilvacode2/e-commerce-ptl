export const CART_OPTIMISTIC_EVENT = 'nero_cart_optimistic_event'

export interface CartOptimisticDetail {
  delta?: number
  totalItems?: number
  animate?: boolean
}

/**
 * Notifica o Header e demais ouvintes sobre alterações imediatas (otimistas)
 * na quantidade total do carrinho sem esperar a resposta da rede.
 */
export function emitCartOptimistic(detail: CartOptimisticDetail): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent<CartOptimisticDetail>(CART_OPTIMISTIC_EVENT, { detail }))
  } catch {
    // Fallback silencioso em ambientes sem CustomEvent
  }
}
