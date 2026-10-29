'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import ProductReadAllService, { ProductResponse } from '@/src/actions/product/read_all_request'
import HeroHome from '../components/home/hero/hero'
import HeaderHome from '../components/home/header/header'
import ArticleHome from '../components/home/article/article'
import BenefitsHome from '../components/home/benefits/benefit'

const PAGE_LIMIT = 8

function PlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-16 w-16 text-blue-900/40 sm:h-24 sm:w-24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </svg>
  )
}

export default function StorePage() {
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Sobe +1 a cada mudança no carrinho; o header observa esse valor
  const [cartVersion, setCartVersion] = useState(0)

  // Evita que uma resposta antiga sobrescreva uma mais nova
  const requestId = useRef(0)

  const loadProducts = useCallback(async (silent = false) => {
    const id = ++requestId.current

    if (!silent) setLoading(true)
    setError(null)

    try {
      const res = await ProductReadAllService(page, PAGE_LIMIT)
      if (id !== requestId.current) return
      setProducts(res.data)
      setTotalPages(res.total_pages)
    } catch {
      if (id === requestId.current) setError('Error loading products')
    } finally {
      if (id === requestId.current && !silent) setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  function handlePageChange(newPage: number) {
    setPage(newPage)
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleCartChange() {
    loadProducts(true)             // atualiza o estoque dos produtos
    setCartVersion((v) => v + 1)   // faz o header buscar o carrinho de novo
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#161616] text-slate-900">
      <HeaderHome refreshKey={cartVersion} />
      <HeroHome listProducts={products} />
      <BenefitsHome />
      <ArticleHome
        PlaceholderIcon={PlaceholderIcon}
        loading={loading}
        error={error}
        listProducts={products}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onCartChange={handleCartChange}
      />
    </div>
  )
}