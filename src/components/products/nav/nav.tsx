"use client"
import Link from "next/link"
import { Package, Plus, List, House } from "lucide-react"
import { useState } from "react"
import { Menu, X } from "lucide-react"



const HEADING_FONT = "font-['Barlow_Condensed',Impact,sans-serif]";

type NavItem = {
    key: string
    label: string
    href: string
    icon: React.ElementType
}

const NAV: NavItem[] = [
    { key: "home", label: "Pagina principal", href: "/", icon: House },
    { key: "list", label: "Produtos", href: "/produtos", icon: List },
    { key: "new", label: "Novo produto", href: "/produtos/novo", icon: Plus },
     { key: "listusers", label: "Usuarios", href: "/usuarios", icon: Plus },

    // adicione os outros aqui
]

type NavProductsProps = {
    active: string // key do item da página atual, ex: "list"
}

export default function NavProducts({ active }: NavProductsProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    return (
        <aside className="shrink-0 bg-[#161616] border-b md:border-b-0 md:border-r border-[#333] flex flex-col md:w-64">

            {/* Topo: título + botão hambúrguer (mobile) */}
            <div className="flex items-center justify-between pr-4 md:pr-0">
                <span className={`${HEADING_FONT} px-4 py-4 text-xl font-bold uppercase tracking-wider text-[#ff6a00] sm:px-6 sm:text-2xl md:py-5`}>
                    STORE // ADMIN
                </span>

                <button
                    type="button"
                    aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                    aria-expanded={menuOpen}
                    aria-controls="admin-nav"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex h-10 w-10 items-center justify-center border border-[#333] text-[#eaeaea] transition hover:bg-[#ff6a00] hover:text-[#161616] md:hidden"
                >
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Navegação: colapsável no mobile, sempre visível no desktop */}
            <nav
                id="admin-nav"
                aria-label="Principal"
                className={`${menuOpen ? "flex" : "hidden"} flex-col border-t border-[#333] md:flex md:mt-2 md:border-t-0`}
            >
                {NAV.map(({ key, label, href, icon: Icon }) => {
                    const isActive = key === active

                    return (
                        <Link
                            key={key}
                            href={href}
                            onClick={() => setMenuOpen(false)}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest border-l-2 transition text-left sm:px-6 ${isActive
                                ? "border-[#ff6a00] bg-[#1c1c1c] text-[#ff6a00]"
                                : "border-transparent text-white hover:bg-[#1c1c1c] hover:text-[#ff6a00]"
                                }`}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    )
                })}
            </nav>

            <span className="hidden md:block mt-auto px-6 py-5 text-[11px] uppercase tracking-widest text-neutral-600">
                Secure Terminal v2.6
            </span>
        </aside>
    )
}