'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Search, Menu, X } from 'lucide-react'
import ThemeToggle from '@/src/components/theme/theme-toggle'
import SearchBar from '@/src/components/home/search/search-bar'
import { useSession } from '@/src/components/providers/session-provider'

interface HeaderHomeProps {
  refreshKey?: number
}

export default function HeaderHome({ refreshKey = 0 }: HeaderHomeProps) {
  const { user, totalCartItems, badgePulseKey, refreshCart } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const prevRefreshKeyRef = useRef(refreshKey)

  const painelAdmin = user?.role === 'admin'

  // Mantém compatibilidade com páginas que passam refreshKey para forçar sync silencioso do carrinho
  useEffect(() => {
    if (refreshKey !== prevRefreshKeyRef.current) {
      prevRefreshKeyRef.current = refreshKey
      void refreshCart({ silent: true })
    }
  }, [refreshKey, refreshCart])

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-black/10 dark:border-white/10 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4 md:gap-8">
        {/* Mobile hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="p-2 text-black dark:text-white md:hidden hover:opacity-70 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white rounded-full cursor-pointer"
          >
            {menuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>

          <Link
            href="/"
            className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight uppercase text-black dark:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black dark:focus-visible:outline-white rounded"
          >
            NERO
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          <Link
            href="/"
            className="hover:text-black dark:hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black dark:focus-visible:outline-white rounded"
          >
            Início
          </Link>
          {user && (
            <Link
              href="/pedidos"
              className="hover:text-black dark:hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black dark:focus-visible:outline-white rounded"
            >
              Meus Pedidos
            </Link>
          )}
          <Link
            href="/ajuda"
            className="hover:text-black dark:hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black dark:focus-visible:outline-white rounded"
          >
            Ajuda
          </Link>
          {painelAdmin && (
            <Link
              href="/produtos"
              className="hover:text-black dark:hover:text-white transition-colors font-semibold text-black dark:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black dark:focus-visible:outline-white rounded"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Search bar em formato pílula */}
        <div className="relative hidden sm:flex flex-1 max-w-md mx-2">
          <SearchBar
            placeholder="Buscar peças, modelos ou referências..."
            iconClassName="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400"
            inputClassName="h-11 w-full rounded-full bg-[#F2F0F1] dark:bg-[#1f1f1f] pl-11 pr-5 text-sm text-black dark:text-white placeholder:text-neutral-500 outline-none border border-transparent focus:border-black/25 dark:focus:border-white/25 focus:bg-white dark:focus:bg-[#181818] transition-colors"
          />
        </div>

        {/* Actions: Theme Toggle, Carrinho & Perfil */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* Search icon on mobile */}
          <button
            type="button"
            aria-label="Ir para busca"
            onClick={() => {
              const el = document.getElementById('search-input-mobile')
              el?.focus()
            }}
            className="p-2 text-black dark:text-white sm:hidden hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white rounded-full cursor-pointer"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Cart Link com prefetch automático do Next.js */}
          <Link
            href="/carrinho"
            aria-label={`Carrinho com ${totalCartItems} ${totalCartItems === 1 ? 'item' : 'itens'}`}
            className="relative p-2.5 rounded-full hover:bg-[#F2F0F1] dark:hover:bg-[#222222] transition-colors text-black dark:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {totalCartItems > 0 && (
              <span
                key={badgePulseKey}
                className="nero-badge-pop absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-black dark:bg-white px-1 text-[10px] font-bold text-white dark:text-black"
              >
                {totalCartItems}
              </span>
            )}
          </Link>

          {/* User Account / Login */}
          {user ? (
            <Link
              href="/conta"
              aria-label="Minha conta"
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#F2F0F1] dark:hover:bg-[#222222] transition-colors text-black dark:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white"
            >
              <div className="h-8 w-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold uppercase">
                {user.name ? user.name[0] : 'U'}
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full px-3.5 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#222222] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white"
              >
                Entrar
              </Link>
              <Link
                href="/sign"
                className="hidden sm:inline-flex rounded-full bg-black dark:bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white dark:text-black hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white"
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
          <SearchBar
            inputId="search-input-mobile"
            placeholder="Buscar produtos..."
            iconClassName="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400"
            inputClassName="h-10 w-full rounded-full bg-[#F2F0F1] dark:bg-[#1f1f1f] pl-10 pr-4 text-xs text-black dark:text-white placeholder:text-neutral-500 outline-none border border-transparent focus:border-black/25 dark:focus:border-white/25 focus:bg-white dark:focus:bg-[#181818] transition-colors"
          />
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#121212] md:hidden">
          <nav aria-label="Menu móvel" className="flex flex-col px-4 py-4 space-y-3 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="py-2 text-black dark:text-white border-b border-black/5 dark:border-white/5"
            >
              Início
            </Link>
            <Link
              href="/ajuda"
              onClick={() => setMenuOpen(false)}
              className="py-2 text-neutral-700 dark:text-neutral-300 border-b border-black/5 dark:border-white/5"
            >
              Ajuda
            </Link>
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
                  className="w-full text-center py-2.5 rounded-full border border-black/15 dark:border-white/15 font-semibold text-xs uppercase tracking-wider"
                >
                  Entrar
                </Link>
                <Link
                  href="/sign"
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-xs uppercase tracking-wider"
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
  )
}
