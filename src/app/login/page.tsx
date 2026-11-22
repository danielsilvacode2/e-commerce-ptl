'use client'

import LoginService from "@/src/actions/auth/login_request"
import { cartSyncService } from "@/src/services/cart-sync"
import { guestCartService } from "@/src/services/guest-cart"
import Link from "next/link"
import { CheckCircle2, Eye, EyeOff, ArrowRight } from "lucide-react"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isResetSuccess = searchParams.get("reset") === "success"
    const redirectUrl = searchParams.get("redirect")

    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)

    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [emailError, setEmailError] = useState<string>("")
    const [passwordError, setPasswordError] = useState<string>("")
    const [errLogin, setErrLogin] = useState<string>("")
    const [syncWarning, setSyncWarning] = useState<string>("")

    function validateEmail(value: string): string {
        const trimmed = value.trim()
        if (!trimmed) return "O e-mail é obrigatório."
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
        if (!emailRegex.test(trimmed)) return "Insira um endereço de e-mail válido."
        return ""
    }

    function validatePassword(value: string): string {
        if (!value) return "A senha é obrigatória."
        if (value.length < 6) return "A senha deve ter pelo menos 6 caracteres."
        return ""
    }

    async function LoginUser() {
        const emailMsg = validateEmail(email)
        const passwordMsg = validatePassword(password)

        setEmailError(emailMsg)
        setPasswordError(passwordMsg)
        setErrLogin("")
        setSyncWarning("")

        if (emailMsg || passwordMsg) return

        setLoading(true)
        try {
            await LoginService(email.trim(), password)

            const hadGuestItems = guestCartService.getRawCart().items.length > 0
            if (hadGuestItems) {
                const syncResult = await cartSyncService.syncGuestCartToUser()
                if (syncResult.errors.length > 0) {
                    setSyncWarning(
                        `Alguns itens não puderam ser sincronizados: ${syncResult.errors.join("; ")}`
                    )
                }
            }

            if (redirectUrl) {
                router.push(redirectUrl)
            } else if (hadGuestItems) {
                router.push("/carrinho")
            } else {
                router.push("/")
            }
        } catch {
            setErrLogin("Senha ou e-mail inválido")
        } finally {
            setLoading(false)
        }
    }

    const inputBase =
        "h-12 w-full rounded-full border bg-[#F2F0F1] px-5 text-sm text-black placeholder:text-neutral-500 outline-none transition font-sans"
    const inputOk = "border-transparent focus:border-black/20 focus:bg-white"
    const inputInvalid = "border-red-500 bg-red-50 focus:border-red-500"

    return (
        <main className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr] bg-white font-sans text-black">
            {/* Painel lateral da marca */}
            <section className="hidden lg:flex flex-col justify-between p-16 bg-[#F2F0F1] border-r border-black/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-radial from-neutral-200/50 to-transparent pointer-events-none" />

                <Link href="/" className="font-display text-3xl font-extrabold uppercase tracking-tight text-black z-10">
                    SHOP.CO
                </Link>

                <div className="max-w-md z-10">
                    <span className="inline-block px-3.5 py-1 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-widest mb-4">
                        Acesso do Cliente
                    </span>
                    <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight leading-[0.95] text-black">
                        BEM-VINDO DE VOLTA
                    </h1>
                    <p className="mt-4 text-sm text-neutral-600 leading-relaxed font-sans">
                        Acesse seus pedidos, acompanhe o envio de suas compras e confira seleções personalizadas do nosso streetwear de alto contraste.
                    </p>
                </div>

                <div className="text-xs uppercase tracking-widest text-neutral-500 z-10 font-mono">
                    SHOP.CO AUTH 2026
                </div>
            </section>

            {/* Formulário */}
            <section className="flex items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-[380px]">
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="font-display text-2xl font-extrabold uppercase tracking-tight text-black">
                            SHOP.CO
                        </Link>
                    </div>

                    <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black">
                        ENTRE NA SUA CONTA
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600 font-sans">
                        Insira suas credenciais para continuar suas compras.
                    </p>

                    {isResetSuccess && (
                        <div
                            role="status"
                            className="mt-6 flex items-center gap-3 rounded-2xl border border-black/10 bg-[#F2F0F1] p-4 text-xs text-black"
                        >
                            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                            <span className="font-medium">
                                Senha redefinida com sucesso! Entre com sua nova senha.
                            </span>
                        </div>
                    )}

                    <form
                        className="mt-8 flex flex-col gap-5"
                        noValidate
                        onSubmit={(e) => {
                            e.preventDefault()
                            LoginUser()
                        }}
                    >
                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-xs uppercase tracking-wider text-black font-bold">
                                E-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="seu-email@dominio.com"
                                autoComplete="email"
                                disabled={loading}
                                className={`${inputBase} ${emailError ? inputInvalid : inputOk}`}
                                value={email}
                                aria-invalid={!!emailError}
                                aria-describedby={emailError ? "email-error" : undefined}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    if (emailError) setEmailError("")
                                }}
                                onBlur={() => setEmailError(validateEmail(email))}
                            />
                            {emailError && (
                                <span id="email-error" role="alert" className="text-[11px] font-medium text-red-600 px-3">
                                    {emailError}
                                </span>
                            )}
                        </div>

                        {/* Senha */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between px-1">
                                <label
                                    htmlFor="password"
                                    className="text-xs uppercase tracking-wider text-black font-bold"
                                >
                                    Senha
                                </label>
                                <Link
                                    href="/esqueceu-senha"
                                    className="text-xs text-neutral-600 hover:text-black transition underline underline-offset-2"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </div>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    disabled={loading}
                                    className={`${inputBase} pr-12 ${passwordError ? inputInvalid : inputOk}`}
                                    value={password}
                                    aria-invalid={!!passwordError}
                                    aria-describedby={passwordError ? "password-error" : undefined}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        if (passwordError) setPasswordError("")
                                    }}
                                    onBlur={() => setPasswordError(validatePassword(password))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-black transition cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {passwordError && (
                                <span id="password-error" role="alert" className="text-[11px] font-medium text-red-600 px-3">
                                    {passwordError}
                                </span>
                            )}
                        </div>

                        {errLogin && (
                            <div role="alert" className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                                {errLogin}
                            </div>
                        )}

                        {syncWarning && (
                            <div role="alert" className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">
                                {syncWarning}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-3 h-12 rounded-full bg-black text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? "Entrando..." : "Entrar na Conta"} <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-neutral-600">
                        Não tem uma conta?{" "}
                        <Link
                            href={redirectUrl ? `/sign?redirect=${encodeURIComponent(redirectUrl)}` : "/sign"}
                            className="font-bold text-black underline underline-offset-4 hover:opacity-80"
                        >
                            Cadastre-se agora
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <LoginFormContent />
        </Suspense>
    )
}
