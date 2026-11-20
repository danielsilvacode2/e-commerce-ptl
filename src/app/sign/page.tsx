'use client'

import SignService from "@/src/actions/sign/sign_request"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
    const router = useRouter()
    const [name, setName] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")

    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [nameError, setNameError] = useState<string>("")
    const [emailError, setEmailError] = useState<string>("")
    const [passwordError, setPasswordError] = useState<string>("")
    const [formError, setFormError] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)

    function validateName(value: string): string {
        const trimmed = value.trim()
        if (!trimmed) return "O nome é obrigatório."
        if (trimmed.length < 2) return "O nome deve ter pelo menos 2 caracteres."
        return ""
    }

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

    async function SignUpUser() {
        const nameMsg = validateName(name)
        const emailMsg = validateEmail(email)
        const passwordMsg = validatePassword(password)

        setNameError(nameMsg)
        setEmailError(emailMsg)
        setPasswordError(passwordMsg)
        setFormError("")

        if (nameMsg || emailMsg || passwordMsg) return

        setLoading(true)
        try {
            await SignService(email.trim(), password, name.trim())
            router.push(`/verificar-email?email=${encodeURIComponent(email.trim())}`)
        } catch (err) {
            if (err instanceof Error && err.message === "RATE_LIMIT") {
                setFormError("Muitas tentativas. Aguarde alguns minutos.")
            } else if (err instanceof Error && err.message === "INVALID_DATA") {
                setFormError("Verifique os dados informados e tente novamente.")
            } else {
                setFormError("Ocorreu um erro ao criar a conta. Tente novamente.")
            }
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
                        Novo Registro
                    </span>
                    <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight leading-[0.95] text-black">
                        CRIE SUA CONTA
                    </h1>
                    <p className="mt-4 text-sm text-neutral-600 leading-relaxed font-sans">
                        Junte-se à nossa comunidade e ganhe 20% de desconto no seu primeiro pedido. Tenha acesso a lançamentos exclusivos e frete rápido.
                    </p>
                </div>

                <div className="text-xs uppercase tracking-widest text-neutral-500 z-10 font-mono">
                    SHOP.CO REGISTRY 2026
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
                        CRIE SUA CONTA
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600 font-sans">
                        Preencha seus dados para começar a comprar.
                    </p>

                    <form
                        className="mt-8 flex flex-col gap-5"
                        noValidate
                        onSubmit={(e) => {
                            e.preventDefault()
                            SignUpUser()
                        }}
                    >
                        {/* Nome */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="name" className="text-xs uppercase tracking-wider text-black font-bold">
                                Nome Completo
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Seu nome completo"
                                autoComplete="name"
                                className={`${inputBase} ${nameError ? inputInvalid : inputOk}`}
                                value={name}
                                aria-invalid={!!nameError}
                                aria-describedby={nameError ? "name-error" : undefined}
                                onChange={(e) => {
                                    setName(e.target.value)
                                    if (nameError) setNameError("")
                                }}
                                onBlur={() => setNameError(validateName(name))}
                            />
                            {nameError && (
                                <span id="name-error" role="alert" className="text-[11px] font-medium text-red-600 px-3">
                                    {nameError}
                                </span>
                            )}
                        </div>

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
                            <label
                                htmlFor="password"
                                className="text-xs uppercase tracking-wider text-black font-bold"
                            >
                                Senha
                            </label>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
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

                            {passwordError ? (
                                <span id="password-error" role="alert" className="text-[11px] font-medium text-red-600 px-3">
                                    {passwordError}
                                </span>
                            ) : (
                                <span className="text-[11px] text-neutral-500 px-3">
                                    Mínimo de 6 caracteres.
                                </span>
                            )}
                        </div>

                        {/* Erro geral do formulário */}
                        {formError && (
                            <div role="alert" className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                                {formError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-3 h-12 rounded-full bg-black text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? "Cadastrando..." : "Criar Minha Conta"} <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-neutral-600">
                        Já tem uma conta?{" "}
                        <Link
                            href="/login"
                            className="font-bold text-black underline underline-offset-4 hover:opacity-80"
                        >
                            Fazer login
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    )
}
