'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReadMe, { UserResponse } from '@/src/actions/me/readMe'
import ReadCart, { CartResponse } from '@/src/actions/cart/read_all'

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4-4" />
        </svg>
    )
}

interface HeaderHomeProps {   // Muda toda vez que o carrinho é alterado; faz o header buscar o carrinho de novo
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
        ReadMe()
            .then((dataUser) => {
                setUser(dataUser)
                if (dataUser?.role == "admin") {
                    setPainelAdmin(true)
                }
            })
    }, [])

    // Busca o carrinho no carregamento e sempre que refreshKey mudar
    useEffect(() => {
        let cancelled = false

        ReadCart()
            .then((res) => {
                if (!cancelled) {
                    setCart(res)
                }
            })
            .catch((err) => {
                if (!cancelled) setCart(null)
                console.log('erro ao carregar carrinho', err)
            })

        return () => {
            cancelled = true
        }
    }, [refreshKey])


    const handlerPainel = () => {
        router.push("/produtos")
    }
    const handlerCart = () => {
        router.push("/carrinho")
    }


    const handleAccountClick = () => {
        router.push("/conta")
    }

    const handlerAccountLogin = () => {
        router.push("/login")
    }

    const handlerAccountSign = () => {
        router.push("/sign")
    }



    return (
        <header className="sticky top-0 z-20 border-b border-[#333] bg-[#161616] font-inter text-[#eaeaea]">
            <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 md:flex-nowrap md:gap-8">


                <Link
                    href="/"
                    className="font-['Barlow_Condensed',Impact,sans-serif] text-2xl font-extrabold uppercase tracking-wide sm:text-[26px]"
                >
                    <span className="mr-1 bg-[#ff6a00] px-1.5 text-[#161616]">N</span>ero
                </Link>

                {/* Busca */}
                <div className="relative order-last w-full md:order-none md:w-auto md:flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                        <SearchIcon />
                    </span>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar produtos"
                        className="h-10 w-full rounded-none border border-[#333] bg-transparent pl-10 pr-4 text-[13px] uppercase tracking-wider text-[#eaeaea] outline-none placeholder:text-neutral-500 focus:border-[#ff6a00] md:h-11"
                    />
                </div>

                <nav className="ml-auto flex items-center gap-4 text-[13px] font-medium uppercase tracking-wider md:ml-0 md:gap-8">

                    {/* ===== LINKS DESKTOP (somem no mobile) ===== */}
                    <div className="hidden items-center gap-8 md:flex">
                        <Link href="/" className="hover:text-[#ff6a00]">
                            Inicio
                        </Link>

                        {user ? (
                            <a
                                href="/account"
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleAccountClick()
                                }}
                                className="hover:text-[#ff6a00]"
                            >
                                Minha conta
                            </a>
                        ) : (
                            <div className="flex items-center gap-3">
                                <a
                                    href="/login"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handlerAccountLogin()
                                    }}
                                    className="font-medium text-neutral-400 transition-colors hover:text-[#ff6a00]"
                                >
                                    Login
                                </a>
                                <span className="text-[#333]">/</span>
                                <a
                                    href="/sign"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handlerAccountSign()
                                    }}
                                    className="font-medium text-neutral-400 transition-colors hover:text-[#ff6a00]"
                                >
                                    Sign up
                                </a>
                            </div>
                        )}

                        {painelAdmin && (
                            <a
                                href="/produtos"
                                onClick={(e) => {
                                    e.preventDefault()
                                    handlerPainel()
                                }}
                                className="hover:text-[#ff6a00]"
                            >
                                Painel de admin
                            </a>
                        )}
                    </div>

                    {/* ===== CARRINHO (sempre visível) ===== */}
                    <button
                        type="button"
                        onClick={handlerCart}
                        aria-label={`Carrinho com ${cart?.list.length ?? 0} itens`}
                        className="flex h-10 cursor-pointer items-center gap-2 rounded-none border border-[#333] px-3 uppercase tracking-wider text-[#eaeaea] transition-colors hover:bg-[#ff6a00] hover:text-[#161616] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff6a00] sm:px-4 md:h-11"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                        >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
                        </svg>
                        <span className="hidden sm:inline">Carrinho</span>
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-none bg-[#ff6a00] px-1 text-xs font-semibold text-[#161616]">
                            {cart?.list.length ?? 0}
                        </span>
                    </button>

                    {/* ===== BOTÃO HAMBÚRGUER (só mobile) ===== */}
                    <button
                        type="button"
                        aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((o) => !o)}
                        className="flex h-10 w-10 items-center justify-center rounded-none border border-[#333] hover:bg-[#ff6a00] hover:text-[#161616] md:hidden"
                    >
                        {menuOpen ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                                <path d="M3 6h18M3 12h18M3 18h18" />
                            </svg>
                        )}
                    </button>
                </nav>
            </div>

            {/* ===== MENU MOBILE ===== */}
            {menuOpen && (
                <div className="border-t border-[#333] bg-[#161616] md:hidden">
                    <div className="mx-auto flex max-w-[1120px] flex-col px-4 py-2 text-[13px] font-medium uppercase tracking-wider sm:px-6">

                        <Link
                            href="/"
                            onClick={() => setMenuOpen(false)}
                            className="border-b border-[#333] py-3 hover:text-[#ff6a00]"
                        >
                            Inicio
                        </Link>

                        {user ? (
                            <a
                                href="/conta"
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleAccountClick()
                                    setMenuOpen(false)
                                }}
                                className="border-b border-[#333] py-3 hover:text-[#ff6a00]"
                            >
                                Minha conta
                            </a>
                        ) : (
                            <>
                                <a
                                    href="/login"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handlerAccountLogin()
                                        setMenuOpen(false)
                                    }}
                                    className="border-b border-[#333] py-3 hover:text-[#ff6a00]"
                                >
                                    Login
                                </a>
                                <a
                                    href="/sign"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handlerAccountSign()
                                        setMenuOpen(false)
                                    }}
                                    className="border-b border-[#333] py-3 hover:text-[#ff6a00]"
                                >
                                    Sign up
                                </a>
                            </>
                        )}

                        {painelAdmin && (
                            <a
                                href="/produtos"
                                onClick={(e) => {
                                    e.preventDefault()
                                    handlerPainel()
                                    setMenuOpen(false)
                                }}
                                className="py-3 hover:text-[#ff6a00]"
                            >
                                Painel de produtos
                            </a>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}