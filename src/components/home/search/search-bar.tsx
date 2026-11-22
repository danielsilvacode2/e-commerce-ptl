'use client'

import { FormEvent, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'
import { useProductSearch } from '@/src/hooks/useProductSearch'
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH, isSearchTermValid, normalizeSearchTerm } from '@/src/lib/search'

interface SearchBarProps {
  inputId?: string
  placeholder: string
  inputClassName: string
  iconClassName: string
}

// Barra de busca do header: sugestoes com debounce e redirecionamento para /busca
export default function SearchBar({ inputId, placeholder, inputClassName, iconClassName }: SearchBarProps) {
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const router = useRouter()

  const { status, products, retry } = useProductSearch(term, 5)
  const showPanel = open && isSearchTermValid(term)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function goToResults() {
    setOpen(false)
    router.push(`/busca?q=${encodeURIComponent(normalizeSearchTerm(term))}`)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (isSearchTermValid(term)) goToResults()
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form role="search" onSubmit={handleSubmit}>
        <span className={iconClassName}>
          <Search className="h-4 w-4" />
        </span>
        <input
          id={inputId}
          type="search"
          value={term}
          maxLength={SEARCH_MAX_LENGTH}
          onChange={(e) => {
            setTerm(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
          aria-label="Buscar produtos"
          aria-controls={listId}
          placeholder={placeholder}
          className={inputClassName}
        />
      </form>

      {showPanel && (
        <div
          id={listId}
          aria-live="polite"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] shadow-xl"
        >
          {status === 'loading' && (
            <p className="flex items-center gap-2 px-4 py-3 text-xs text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Buscando...
            </p>
          )}

          {status === 'error' && (
            <div className="flex items-center justify-between gap-2 px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">
              <span>Erro ao buscar produtos.</span>
              <button
                type="button"
                onClick={retry}
                className="rounded-full border border-black/15 dark:border-white/15 px-3 py-1 font-semibold uppercase hover:bg-[#F2F0F1] dark:hover:bg-[#252525] focus-visible:outline-2 active:opacity-70"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {status === 'success' && products.length === 0 && (
            <p className="px-4 py-3 text-xs text-neutral-500">Nenhum produto encontrado.</p>
          )}

          {status === 'success' && products.length > 0 && (
            <>
              <ul>
                {products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/busca?q=${encodeURIComponent(product.name)}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] focus-visible:bg-[#F2F0F1] dark:focus-visible:bg-[#252525] outline-none"
                    >
                      <span className="truncate">{product.name}</span>
                      <span className="shrink-0 text-xs text-neutral-500">R$ {product.price}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={goToResults}
                className="w-full border-t border-black/10 dark:border-white/10 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#252525] focus-visible:bg-[#F2F0F1] active:opacity-70"
              >
                Ver todos os resultados
              </button>
            </>
          )}
        </div>
      )}

      <span className="sr-only">Digite ao menos {SEARCH_MIN_LENGTH} caracteres para buscar.</span>
    </div>
  )
}
