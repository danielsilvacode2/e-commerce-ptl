'use client'

import LoginService from "@/src/actions/auth/login_request"
import Link from "next/link"
import { CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isResetSuccess = searchParams.get("reset") === "success"

    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)

    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [emailError, setEmailError] = useState<string>("")
    const [passwordError, setPasswordError] = useState<string>("")
    const [errLogin, setErrLogin] = useState<string>("")

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

        if (emailMsg || passwordMsg) return

        setLoading(true)
        try {
            await LoginService(email.trim(), password)
            router.push("/")
        } catch {
            setErrLogin("Senha ou e-mail inválido")
        } finally {
            setLoading(false)
        }
    }

    const inputBase =
        "h-11 w-full rounded-none border bg-[#1c1c1c] px-3.5 text-sm text-[#eaeaea] placeholder:text-neutral-500 outline-none transition font-inter"
    const inputOk = "border-[#333] focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00]"
    const inputInvalid = "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"

    return (
        <main className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr] bg-[#121212] font-inter text-[#eaeaea]">
            {/* Painel lateral da marca */}
            <section className="hidden lg:flex flex-col justify-between p-12 text-[#eaeaea] bg-[#161616] border-r border-[#333] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

                <span className="font-['Barlow_Condensed',Impact,sans-serif] text-2xl font-bold uppercase tracking-wider text-[#ff6a00] z-10">
                    STORE // ACCESS
                </span>

                <div className="max-w-sm z-10">
                    <h1 className="font-['Barlow_Condensed',Impact,sans-serif] text-4xl font-bold uppercase tracking-wide leading-tight text-[#eaeaea]">
                        Acesso Restrito ao Sistema
                    </h1>
                    <p className="mt-3 text-xs text-neutral-400 leading-relaxed uppercase tracking-wider">
                        Todos os dados de acesso são protegidos e criptografados.
                    </p>
                </div>

                <div className="text-[11px] uppercase tracking-widest text-neutral-600 z-10">
                    Secure Terminal v2.6
                </div>
            </section>

            {/* Formulário */}
            <section className="flex items-center justify-center px-6 py-12 bg-[#121212]">
                <div className="w-full max-w-[360px]">
                    <h2 className="font-['Barlow_Condensed',Impact,sans-serif] text-3xl font-bold uppercase tracking-wide text-[#eaeaea]">
                        Entre na sua conta
                    </h2>
                    <p className="mt-1.5 text-xs text-neutral-400 uppercase tracking-wider">
                        Insira suas credenciais para continuar.
                    </p>

                    {isResetSuccess && (
                        <div
                            role="status"
                            className="mt-4 flex items-center gap-2 border border-[#ff6a00]/60 bg-[#161616] p-3 text-xs text-[#eaeaea]"
                        >
                            <CheckCircle2 size={16} className="shrink-0 text-[#ff6a00]" />
                            <span className="text-[11px] uppercase tracking-wider text-[#ff6a00]">
                                Senha redefinida com sucesso! Entre com sua nova senha.
                            </span>
                        </div>
                    )}

                    <form
                        className="mt-6 flex flex-col gap-5"
                        noValidate
                        onSubmit={(e) => {
                            e.preventDefault()
                            LoginUser()
                        }}
                    >
                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-xs uppercase tracking-widest text-neutral-300 font-medium">
                                E-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@company.com"
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
                                <span id="email-error" role="alert" className="text-[11px] uppercase tracking-wider text-red-500">
                                    {emailError}
                                </span>
                            )}
                        </div>

                        {/* Senha */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="text-xs uppercase tracking-widest text-neutral-300 font-medium"
                                >
                                    Senha
                                </label>
                                <Link
                                    href="/esqueceu-senha"
                                    className="text-xs uppercase tracking-wider text-neutral-400 hover:text-[#ff6a00] transition"
                                >
                                    Esqueceu sua senha?
                                </Link>
                            </div>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    disabled={loading}
                                    className={`${inputBase} pr-11 ${passwordError ? inputInvalid : inputOk}`}
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
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-neutral-400 hover:text-[#eaeaea] transition cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <span id="password-error" role="alert" className="text-[11px] uppercase tracking-wider text-red-500">
                                {passwordError}
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 h-11 rounded-none bg-[#ff6a00] text-xs font-medium uppercase tracking-widest text-[#161616] transition hover:brightness-110 active:brightness-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>

                    {errLogin && (
                        <span role="alert" className="mt-3 block text-[11px] uppercase tracking-wider text-red-500">
                            {errLogin}
                        </span>
                    )}

                    <p className="mt-8 text-xs uppercase tracking-wider text-neutral-400">
                        Não tem uma conta?{" "}
                        <Link
                            href="/sign"
                            className="font-medium text-[#ff6a00] hover:underline underline-offset-4"
                        >
                            Cadastre-se
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
            <LoginFormContent />
        </Suspense>
    )
}
