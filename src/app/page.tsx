'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import ProductReadAllService, { ProductResponse } from '@/src/actions/product/read_all_request'
import ReadCart, { CartResponse } from '@/src/actions/cart/read_all'
import ReadMe from '@/src/actions/me/readMe'
import { guestCartService } from '@/src/services/guest-cart'
import HeroHome from '../components/home/hero/hero'
import HeaderHome from '../components/home/header/header'
import ArticleHome from '../components/home/article/article'
import BenefitsHome from '../components/home/benefits/benefit'
import FooterHome from '../components/home/footer/footer'

const PAGE_LIMIT = 8

function PlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-16 w-16 text-black/20 dark:text-white/20 sm:h-20 sm:w-20" fill="none"
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
  const [cart, setCart] = useState<CartResponse | null>(null)

  // Evita que uma resposta antiga sobrescreva uma mais nova
  const requestId = useRef(0)

  const loadCart = useCallback(async () => {
    try {
      const user = await ReadMe()
      if (user) {
        const res = await ReadCart()
        setCart(res)
      } else {
        const guest = guestCartService.toCartResponse()
        setCart(guest)
      }
    } catch {
      const guest = guestCartService.toCartResponse()
      setCart(guest)
    }
  }, [])

  useEffect(() => {
    loadCart()
  }, [loadCart, cartVersion])

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
      if (id === requestId.current) setError('Erro ao carregar produtos')
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
    loadProducts(true)
    loadCart()
    setCartVersion((v) => v + 1)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors">
      <HeaderHome refreshKey={cartVersion} />
      <main>
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
          cart={cart}
        />
      </main>
      <FooterHome />
    </div>
  )
}
