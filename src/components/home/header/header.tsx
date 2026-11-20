'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReadMe, { UserResponse } from '@/src/actions/me/readMe'
import ReadCart, { CartResponse } from '@/src/actions/cart/read_all'
import { ShoppingBag, Search, Menu, X, ArrowRight } from 'lucide-react'
import ThemeToggle from '@/src/components/theme/theme-toggle'

interface HeaderHomeProps {
  refreshKey?: number
}

export default function HeaderHome({ refreshKey = 0 }: HeaderHomeProps) {
  const [search, setSearch] = useState('')
  const [user, setUser] = useState<UserResponse | null>(null)
  const [painelAdmin, setPainelAdmin] = useState<boolean>(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cart, setCart] = useState<CartResponse | null>(null)

  const router = useRouter()

  useEffect(() => {
    ReadMe().then((dataUser) => {
      setUser(dataUser)
      if (dataUser?.role === 'admin') {
        setPainelAdmin(true)
      }
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    ReadCart()
      .then((res) => {
        if (!cancelled) setCart(res)
      })
      .catch((err) => {
        if (!cancelled) setCart(null)
        console.log('erro ao carregar carrinho', err)
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const totalCartItems = cart?.list?.reduce((acc, item) => acc + (item.quantity || 1), 0) ?? 0

  return (
    <>
      {/* 1. Top Announcement Bar */}
      <div className="bg-black dark:bg-[#000000] text-white text-xs py-2 px-4 text-center font-sans tracking-wide border-b border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-7xl flex items-center justify-center gap-2">
          <span>Cadastre-se e ganhe 20% de desconto no seu primeiro pedido.</span>
          <Link href="/sign" className="underline font-semibold hover:text-neutral-300 transition-colors inline-flex items-center gap-0.5">
            Cadastre-se Agora <ArrowRight className="h-3 w-3 inline" />
          </Link>
        </div>
      </div>

      {/* 2. Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-black/10 dark:border-white/10 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4 md:gap-8">
          
          {/* Mobile hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-black dark:text-white md:hidden hover:opacity-70 transition-opacity"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link
              href="/"
              className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight uppercase text-black dark:text-white"
            >
              Nero
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
              Início
            </Link>
            <a href="#novidades" className="hover:text-black dark:hover:text-white transition-colors">
              Novidades
            </a>
            <a href="#destaques" className="hover:text-black dark:hover:text-white transition-colors">
              Mais Vendidos
            </a>
            {user && (
              <Link href="/pedidos" className="hover:text-black dark:hover:text-white transition-colors">
                Meus Pedidos
              </Link>
            )}
            {painelAdmin && (
              <Link href="/produtos" className="hover:text-black dark:hover:text-white transition-colors font-semibold text-black dark:text-white">
                Admin
              </Link>
            )}
          </nav>

          {/* Search bar em formato pílula */}
          <div className="relative hidden sm:flex flex-1 max-w-md mx-2">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos, marcas e estilos..."
              className="h-11 w-full rounded-full bg-[#F2F0F1] dark:bg-[#1f1f1f] pl-11 pr-5 text-sm text-black dark:text-white placeholder:text-neutral-500 outline-none border border-transparent focus:border-black/20 dark:focus:border-white/20 focus:bg-white dark:focus:bg-[#181818] transition-all"
            />
          </div>

          {/* Actions: Theme Toggle, Carrinho & Perfil */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Search icon on mobile */}
            <button
              type="button"
              aria-label="Buscar"
              onClick={() => {
                const el = document.getElementById('search-input-mobile')
                el?.focus()
              }}
              className="p-2 text-black dark:text-white sm:hidden hover:opacity-70"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => router.push('/carrinho')}
              aria-label={`Carrinho com ${totalCartItems} itens`}
              className="relative p-2.5 rounded-full hover:bg-[#F2F0F1] dark:hover:bg-[#222222] transition-colors text-black dark:text-white"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-black dark:bg-white px-1 text-[10px] font-bold text-white dark:text-black">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* User Account / Login */}
            {user ? (
              <button
                type="button"
                onClick={() => router.push('/conta')}
                aria-label="Minha conta"
                className="flex items-center gap-2 p-2 rounded-full hover:bg-[#F2F0F1] dark:hover:bg-[#222222] transition-colors text-black dark:text-white"
              >
                <div className="h-8 w-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold uppercase">
                  {user.name ? user.name[0] : 'U'}
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#222222] transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/sign"
                  className="hidden sm:inline-flex rounded-full bg-black dark:bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative w-full">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="search-input-mobile"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos..."
              className="h-10 w-full rounded-full bg-[#F2F0F1] dark:bg-[#1f1f1f] pl-10 pr-4 text-xs text-black dark:text-white placeholder:text-neutral-500 outline-none border border-transparent focus:border-black/20 dark:focus:border-white/20 focus:bg-white dark:focus:bg-[#181818] transition-all"
            />
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#121212] md:hidden">
            <nav className="flex flex-col px-4 py-4 space-y-3 text-sm font-medium">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-black dark:text-white border-b border-black/5 dark:border-white/5"
              >
                Início
              </Link>
              <a
                href="#novidades"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-neutral-700 dark:text-neutral-300 border-b border-black/5 dark:border-white/5"
              >
                Novidades
              </a>
              <a
                href="#destaques"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-neutral-700 dark:text-neutral-300 border-b border-black/5 dark:border-white/5"
              >
                Mais Vendidos
              </a>
              {user ? (
                <>
                  <Link
                    href="/pedidos"
                    onClick={() => setMenuOpen(false)}
                    className="py-2 text-neutral-700 dark:text-neutral-300 border-b border-black/5 dark:border-white/5"
                  >
                    Meus Pedidos
                  </Link>
                  <Link
                    href="/conta"
                    onClick={() => setMenuOpen(false)}
                    className="py-2 text-neutral-700 dark:text-neutral-300 border-b border-black/5 dark:border-white/5"
                  >
                    Minha Conta
                  </Link>
                </>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-full border border-black/10 dark:border-white/15 font-semibold text-xs uppercase"
                  >
                    Login
                  </Link>
                  <Link
                    href="/sign"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-xs uppercase"
                  >
                    Criar Conta
                  </Link>
                </div>
              )}
              {painelAdmin && (
                <Link
                  href="/produtos"
                  onClick={() => setMenuOpen(false)}
                  className="py-2 font-bold text-black dark:text-white"
                >
                  Painel de Admin
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
