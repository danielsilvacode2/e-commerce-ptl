'use client'

import { useEffect, useState } from 'react'
import ProductSearchService from '@/src/actions/product/search_request'
import { ProductResponse } from '@/src/actions/product/read_all_request'
import { SEARCH_DEBOUNCE_MS, isSearchTermValid, normalizeSearchTerm } from '@/src/lib/search'
import { classifyErrorVariant, ErrorStateVariant, logClientError } from '@/src/lib/api-error'
import { clientCache } from '@/src/lib/client-cache'

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseProductSearchResult {
  status: SearchStatus
  products: ProductResponse[]
  errorVariant: ErrorStateVariant | null
  isStale: boolean
  retry: () => void
}

interface SearchResult {
  key: string
  failed: boolean
  errorVariant: ErrorStateVariant | null
  isStale: boolean
  products: ProductResponse[]
}

// Busca com debounce; cancela a requisição anterior para evitar race conditions.
// Se a API falhar mas houver resultados em cache para o mesmo termo, exibe com aviso.
export function useProductSearch(rawTerm: string, limit: number = 5): UseProductSearchResult {
  const [result, setResult] = useState<SearchResult | null>(null)
  const [attempt, setAttempt] = useState(0)

  const term = normalizeSearchTerm(rawTerm)
  const valid = isSearchTermValid(rawTerm)
  const key = `${term}|${limit}|${attempt}`

  useEffect(() => {
    if (!valid) return

    const controller = new AbortController()
    const cacheKey = `search:${term.toLowerCase()}:1:${limit}`

    // Exibe sugestões em cache recente sem atraso enquanto revalida com debounce
    const freshCached = clientCache.get<ProductResponse[]>(cacheKey, 2 * 60 * 1000)
    if (freshCached) {
      queueMicrotask(() => {
        if (controller.signal.aborted) return
        setResult({
          key,
          failed: false,
          errorVariant: null,
          isStale: false,
          products: freshCached.data,
        })
      })
    }

    const timer = setTimeout(async () => {
      try {
        const res = await ProductSearchService(term, 1, limit, controller.signal)
        clientCache.set(cacheKey, res.data)
        setResult({
          key,
          failed: false,
          errorVariant: null,
          isStale: false,
          products: res.data,
        })
      } catch (err: unknown) {
        if (controller.signal.aborted) return
        logClientError('useProductSearch', err, { term })

        const cached = clientCache.get<ProductResponse[]>(cacheKey)
        if (cached) {
          setResult({
            key,
            failed: false,
            errorVariant: null,
            isStale: true,
            products: cached.data,
          })
          return
        }

        setResult({
          key,
          failed: true,
          errorVariant: classifyErrorVariant(err),
          isStale: false,
          products: [],
        })
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
    errorVariant: status === 'error' && result ? result.errorVariant : null,
    isStale: status === 'success' && result ? result.isStale : false,
    retry: () => setAttempt((v) => v + 1),
  }
}
