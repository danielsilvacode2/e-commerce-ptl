


'use client'

import ReadMe, { UserResponse } from "@/src/actions/me/readMe" // ajuste o caminho do seu ReadMe
import LogoutService from "@/src/actions/auth/logout"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function formatDate(value: string): string {
    const date = new Date(value)
    if (isNaN(date.getTime())) return "—"
    return date.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-1.5 border-b border-[#333] pb-4">
            <dt className="text-xs uppercase tracking-widest text-neutral-300 font-medium">{label}</dt>
            <dd className={`text-sm text-[#eaeaea] break-all ${mono ? "font-mono text-neutral-400" : ""}`}>
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
                    router.replace("/login") // 401: sessão inexistente ou expirada
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


    async function handlerLogout(){
        try{
            await LogoutService()
        }catch(err){
            console.log("erro ao sair da conta")
        }finally{
            router.push("/login")
        }
       
    }

    return (
        <main className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr] bg-[#121212] font-inter text-[#eaeaea]">
            {/* Painel lateral */}
            <section className="hidden lg:flex flex-col justify-between p-12 bg-[#161616] border-r border-[#333] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

                <span className="font-['Barlow_Condensed',Impact,sans-serif] text-2xl font-bold uppercase tracking-wider text-[#ff6a00] z-10">
                    STORE // ACCESS
                </span>

                <div className="max-w-sm z-10">
                    <h1 className="font-['Barlow_Condensed',Impact,sans-serif] text-4xl font-bold uppercase tracking-wide leading-tight">
                        {user ? `Olá, ${user.name.split(" ")[0]}` : "Minha conta"}
                    </h1>
                    <p className="mt-3 text-xs text-neutral-400 leading-relaxed uppercase tracking-wider">
                        Sessão ativa. Seus dados são protegidos e criptografados.
                    </p>
                </div>

                <div className="text-[11px] uppercase tracking-widest text-neutral-600 z-10">
                    Secure Terminal v2.6
                </div>
            </section>

            {/* Dados da conta */}
            <section className="flex items-center justify-center px-6 py-12 bg-[#121212]">
                <div className="w-full max-w-[360px]">
                    <h2 className="font-['Barlow_Condensed',Impact,sans-serif] text-3xl font-bold uppercase tracking-wide">
                        Minha conta
                    </h2>
                    <p className="mt-1.5 text-xs text-neutral-400 uppercase tracking-wider">
                        Informações do seu cadastro.
                    </p>

                    {loading && (
                        <p role="status" className="mt-6 text-xs uppercase tracking-wider text-neutral-400">
                            Carregando dados...
                        </p>
                    )}

                    {error && (
                        <div className="mt-6 flex flex-col gap-3">
                            <span role="alert" className="text-[11px] uppercase tracking-wider text-red-500">
                                {error}
                            </span>
                            <button
                                type="button"
                                onClick={() => router.refresh()}
                                className="h-11 rounded-none border border-[#333] text-xs font-medium uppercase tracking-widest text-[#eaeaea] transition hover:border-[#ff6a00] hover:text-[#ff6a00] cursor-pointer"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {user && (
                        <>
                            <dl className="mt-6 flex flex-col gap-4">
                                <Field label="Nome" value={user.name} />
                                <Field label="E-mail" value={user.email} />
                                <Field label="Perfil" value={user.role} />
                                <Field label="Conta criada em" value={formatDate(user.created_at)} />
                                <Field label="Última atualização" value={formatDate(user.update_at)} />
                                <Field label="ID" value={user.Id} mono />
                            </dl>

                            <button
                                onClick={handlerLogout}
                                className="mt-6 cursor-pointer flex h-11 p-2 items-center justify-center rounded-none bg-[#ff6a00] text-xs font-medium uppercase tracking-widest text-[#161616] transition hover:brightness-110 active:brightness-95"
                            >
                                Sair da conta
                            </button>
                        </>
                    )}
                </div>
            </section>
        </main>
    )
}