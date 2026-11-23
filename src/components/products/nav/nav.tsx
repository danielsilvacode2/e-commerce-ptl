"use client"
import Link from "next/link"
import { Plus, List, House, ShoppingBag, Users, Menu, X } from "lucide-react"
import { useState } from "react"
import ThemeToggle from "@/src/components/theme/theme-toggle"

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
        <aside className="shrink-0 bg-white dark:bg-[#121212] border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 flex flex-col md:w-64 font-sans transition-colors">
            {/* Topo: Logo + ThemeToggle + botão hambúrguer (mobile) */}
            <div className="flex items-center justify-between p-4 sm:p-6 md:pb-8">
                <Link href="/" className="font-display font-extrabold text-xl uppercase tracking-tight text-black dark:text-white">
                    NERO <span className="text-[10px] ml-1 bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-full font-sans tracking-normal">ADMIN</span>
                </Link>

                <div className="flex items-center gap-2 md:hidden">
                    <ThemeToggle />
                    <button
                        type="button"
                        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 text-black dark:text-white rounded-lg hover:bg-[#F2F0F1] dark:hover:bg-[#202020] transition-colors"
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
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
                                    ? "bg-black text-white dark:bg-white dark:text-black"
                                    : "text-neutral-600 dark:text-neutral-400 hover:bg-[#F2F0F1] dark:hover:bg-[#202020] hover:text-black dark:hover:text-white"
                            }`}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    )
                })}
            </nav>

            <div className="hidden md:flex mt-auto p-6 border-t border-black/5 dark:border-white/10 items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider text-neutral-400">
                    Painel 2026
                </div>
                <ThemeToggle />
            </div>
        </aside>
    )
}
