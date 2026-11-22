// Regras de busca alinhadas com a validacao da API (q: 2 a 100 caracteres)
export const SEARCH_MIN_LENGTH = 2
export const SEARCH_MAX_LENGTH = 100
export const SEARCH_DEBOUNCE_MS = 300

// Remove espacos nas pontas e limita ao tamanho maximo aceito pela API
export function normalizeSearchTerm(raw: string): string {
  return raw.trim().slice(0, SEARCH_MAX_LENGTH)
}

export function isSearchTermValid(raw: string): boolean {
  return normalizeSearchTerm(raw).length >= SEARCH_MIN_LENGTH
}
