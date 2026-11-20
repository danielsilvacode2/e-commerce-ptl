"use client"
import Link from "next/link"
import { Plus, List, House, ShoppingBag, Users, Menu, X } from "lucide-react"
import { useState } from "react"

type NavItem = {
    key: string
    label: string
    href: string
    icon: React.ElementType
}

const NAV: NavItem[] = [
    { key: "home", label: "Loja Principal", href: "/", icon: House },
    { key: "list", label: "Produtos", href: "/produtos", icon: List },
    { key: "new", label: "Novo Produto", href: "/produtos/novo", icon: Plus },
    { key: "orders", label: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
    { key: "listusers", label: "Usuários", href: "/usuarios", icon: Users },
]

type NavProductsProps = {
    active: string
}

export default function NavProducts({ active }: NavProductsProps) {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <aside className="shrink-0 bg-white border-b md:border-b-0 md:border-r border-black/10 flex flex-col md:w-64 font-sans">
            {/* Topo: Logo + botão hambúrguer (mobile) */}
            <div className="flex items-center justify-between p-4 sm:p-6 md:pb-8">
                <Link href="/" className="font-display font-extrabold text-xl uppercase tracking-tight text-black">
                    SHOP.CO <span className="text-[10px] ml-1 bg-black text-white px-2 py-0.5 rounded-full font-sans tracking-normal">ADMIN</span>
                </Link>

                <button
                    type="button"
                    aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 text-black md:hidden rounded-lg hover:bg-[#F2F0F1]"
                >
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Links de navegação */}
            <nav
                id="admin-nav"
                aria-label="Painel de navegação administrativa"
                className={`${menuOpen ? "flex" : "hidden"} flex-col px-3 space-y-1 md:flex`}
            >
                {NAV.map(({ key, label, href, icon: Icon }) => {
                    const isActive = key === active

                    return (
                        <Link
                            key={key}
                            href={href}
                            onClick={() => setMenuOpen(false)}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex items-center gap-3 px-4 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                                isActive
                                    ? "bg-black text-white"
                                    : "text-neutral-600 hover:bg-[#F2F0F1] hover:text-black"
                            }`}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    )
                })}
            </nav>

            <div className="hidden md:block mt-auto p-6 border-t border-black/5 text-[11px] uppercase tracking-wider text-neutral-400">
                Painel Gerencial 2026
            </div>
        </aside>
    )
}
