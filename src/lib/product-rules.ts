export const STOCK_DISPLAY_THRESHOLD = 50

/**
 * Retorna se o estoque deve ser exibido.
 * Regra: só exibir quando for MENOR que 50. Se for 50 ou mais, não exibir.
 */
export function shouldDisplayStock(quantity: number | undefined | null): boolean {
  if (typeof quantity !== 'number' || Number.isNaN(quantity)) {
    return false
  }
  return quantity < STOCK_DISPLAY_THRESHOLD
}

/**
 * Formata um valor numérico em moeda BRL (ex: R$ 120,00).
 */
export function formatCurrencyBRL(value: number | string | undefined | null): string {
  const numericValue = Number(value ?? 0)
  if (Number.isNaN(numericValue)) {
    return 'R$ 0,00'
  }
  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
