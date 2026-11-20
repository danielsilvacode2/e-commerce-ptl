'use client'

import ReadMe, { UserResponse } from "@/src/actions/me/readMe"
import LogoutService from "@/src/actions/auth/logout"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { User, LogOut, Package, ArrowRight } from "lucide-react"

function formatDate(value: string): string {
    const date = new Date(value)
    if (isNaN(date.getTime())) return "—"
    return date.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-1 border-b border-black/5 pb-3">
            <dt className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">{label}</dt>
            <dd className={`text-sm text-black font-medium break-all ${mono ? "font-mono text-neutral-600 text-xs" : ""}`}>
                {value || "—"}
            </dd>
        </div>
    )
}

export default function MainAccount() {
    const router = useRouter()
    const [user, setUser] = useState<UserResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>("")

    useEffect(() => {
        let active = true

        async function load() {
            try {
                const data = await ReadMe()
                if (!active) return
                if (!data) {
                    router.replace("/login")
                    return
                }
                setUser(data)
            } catch {
                if (active) setError("Não foi possível carregar os dados da conta. Tente novamente.")
                router.push("/login")
            } finally {
                if (active) setLoading(false)
            }
        }

        load()
        return () => {
            active = false
        }
    }, [router])

    async function handlerLogout() {
        try {
            await LogoutService()
        } catch (err) {
            console.log("erro ao sair da conta", err)
        } finally {
            router.push("/login")
        }
    }

    return (
        <main className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr] bg-white font-sans text-black">
            {/* Painel lateral */}
            <section className="hidden lg:flex flex-col justify-between p-16 bg-[#F2F0F1] border-r border-black/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-radial from-neutral-200/50 to-transparent pointer-events-none" />

                <Link href="/" className="font-display text-3xl font-extrabold uppercase tracking-tight text-black z-10">
                    SHOP.CO
                </Link>

                <div className="max-w-md z-10">
                    <span className="inline-block px-3.5 py-1 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-widest mb-4">
                        Perfil do Usuário
                    </span>
                    <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight leading-[0.95] text-black">
                        {user ? `OLÁ, ${user.name.split(" ")[0]}` : "MINHA CONTA"}
                    </h1>
                    <p className="mt-4 text-sm text-neutral-600 leading-relaxed font-sans">
                        Gerencie seus dados pessoais, visualize pedidos ativos e aproveite as vantagens de membro SHOP.CO.
                    </p>
                </div>

                <div className="text-xs uppercase tracking-widest text-neutral-500 z-10 font-mono">
                    SHOP.CO PROFILE 2026
                </div>
            </section>

            {/* Dados da conta */}
            <section className="flex items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-[420px]">
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="font-display text-2xl font-extrabold uppercase tracking-tight text-black">
                            SHOP.CO
                        </Link>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-full bg-black text-white flex items-center justify-center font-display font-bold text-2xl uppercase">
                            {user?.name ? user.name[0] : <User size={24} />}
                        </div>
                        <div>
                            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-black">
                                {user?.name || "Minha Conta"}
                            </h2>
                            <p className="text-xs text-neutral-500 font-sans">
                                Membro registrado
                            </p>
                        </div>
                    </div>

                    {loading && (
                        <p role="status" className="py-8 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            Carregando informações...
                        </p>
                    )}

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-medium border border-red-200 mb-6">
                            {error}
                        </div>
                    )}

                    {user && (
                        <div className="rounded-3xl bg-[#F2F0F1] p-6 sm:p-8 space-y-6">
                            <dl className="space-y-3">
                                <Field label="Nome Completo" value={user.name} />
                                <Field label="E-mail" value={user.email} />
                                <Field label="Tipo de Conta" value={user.role === 'admin' ? 'Administrador' : 'Cliente'} />
                                <Field label="Membro desde" value={formatDate(user.created_at)} />
                                <Field label="ID" value={user.Id} mono />
                            </dl>

                            <div className="flex flex-col gap-3 pt-2">
                                <Link
                                    href="/pedidos"
                                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                                >
                                    <Package size={16} /> Ver Meus Pedidos
                                </Link>
                                <button
                                    onClick={handlerLogout}
                                    className="flex h-12 items-center justify-center gap-2 rounded-full border border-black/15 bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-100 transition-colors cursor-pointer"
                                >
                                    <LogOut size={16} /> Sair da Conta
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}
