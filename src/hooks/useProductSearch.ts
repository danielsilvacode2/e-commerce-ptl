'use client'

import { useEffect, useState } from 'react'
import ProductSearchService from '@/src/actions/product/search_request'
import { ProductResponse } from '@/src/actions/product/read_all_request'
import { SEARCH_DEBOUNCE_MS, isSearchTermValid, normalizeSearchTerm } from '@/src/lib/search'

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseProductSearchResult {
  status: SearchStatus
  products: ProductResponse[]
  retry: () => void
}

interface SearchResult {
  key: string
  failed: boolean
  products: ProductResponse[]
}

// Busca com debounce; cancela a requisicao anterior para evitar race conditions.
// O status e derivado: resultado cuja chave nao bate com a busca atual e obsoleto (loading).
export function useProductSearch(rawTerm: string, limit: number = 5): UseProductSearchResult {
  const [result, setResult] = useState<SearchResult | null>(null)
  const [attempt, setAttempt] = useState(0)

  const term = normalizeSearchTerm(rawTerm)
  const valid = isSearchTermValid(rawTerm)
  const key = `${term}|${limit}|${attempt}`

  useEffect(() => {
    if (!valid) return

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const res = await ProductSearchService(term, 1, limit, controller.signal)
        setResult({ key, failed: false, products: res.data })
      } catch {
        if (controller.signal.aborted) return
        setResult({ key, failed: true, products: [] })
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term, valid, limit, key])

  let status: SearchStatus = 'loading'
  if (!valid) status = 'idle'
  else if (result && result.key === key) status = result.failed ? 'error' : 'success'

  return {
    status,
    products: status === 'success' && result ? result.products : [],
    retry: () => setAttempt((v) => v + 1),
  }
}
