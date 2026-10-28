'use client'

import { useEffect,  useState } from 'react'

import ProductReadAllService, { ProductResponse } from '@/src/actions/product/read_all_request'
import HeroHome from '../components/home/hero/hero'
import HeaderHome from '../components/home/header/header'
import ArticleHome from '../components/home/article/article'
import BenefitsHome from '../components/home/benefits/benefit'


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
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    ProductReadAllService()
      .then((productsData) => {
        setProducts(productsData)
      })
      .catch((e: Error) => {
        setError("Error loading products")
      })
      .finally(() => setLoading(false) )
  }, [])

  return (
    <div className="min-h-screen overflow-x-clip bg-[#161616] text-slate-900">

      <HeaderHome cartCount={cartCount} />
      <HeroHome listProducts={products} />
      <BenefitsHome />
      <ArticleHome PlaceholderIcon={PlaceholderIcon} loading={loading} error={error} setCartCount={setCartCount} listProducts={products} />
    </div>
  )
}