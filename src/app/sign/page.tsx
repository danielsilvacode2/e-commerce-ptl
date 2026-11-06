'use client'

import SignService from "@/src/actions/sign/sign_request"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
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
        if (!trimmed) return "Name is required."
        if (trimmed.length < 2) return "Name must be at least 2 characters."
        return ""
    }

    function validateEmail(value: string): string {
        const trimmed = value.trim()
        if (!trimmed) return "Email is required."
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
        if (!emailRegex.test(trimmed)) return "Enter a valid email address."
        return ""
    }

    function validatePassword(value: string): string {
        if (!value) return "Password is required."
        if (value.length < 6) return "Password must be at least 6 characters."
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
                setFormError("Too many attempts. Please wait a few minutes and try again.")
            } else if (err instanceof Error && err.message === "INVALID_DATA") {
                setFormError("Please check your details and try again.")
            } else {
                setFormError("Something went wrong. Please try again.")
            }
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
                    STORE // REGISTER
                </span>

                <div className="max-w-sm z-10">
                    <h1 className="font-['Barlow_Condensed',Impact,sans-serif] text-4xl font-bold uppercase tracking-wide leading-tight text-[#eaeaea]">
                        Create your account!
                    </h1>
                    <p className="mt-3 text-xs text-neutral-400 leading-relaxed uppercase tracking-wider">
                        Join us and start managing your store. All data is protected and encrypted by the system.
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
                        Create your account
                    </h2>
                    <p className="mt-1.5 text-xs text-neutral-400 uppercase tracking-wider">
                        Fill in your details to get started.
                    </p>

                    <form
                        className="mt-6 flex flex-col gap-5"
                        noValidate
                        onSubmit={(e) => {
                            e.preventDefault()
                            SignUpUser()
                        }}
                    >
                        {/* Nome */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="name" className="text-xs uppercase tracking-widest text-neutral-300 font-medium">
                                Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Your full name"
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
                                <span id="name-error" role="alert" className="text-[11px] uppercase tracking-wider text-red-500">
                                    {nameError}
                                </span>
                            )}
                        </div>

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
                            <label
                                htmlFor="password"
                                className="text-xs uppercase tracking-widest text-neutral-300 font-medium"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
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

                            {passwordError ? (
                                <span id="password-error" role="alert" className="text-[11px] uppercase tracking-wider text-red-500">
                                    {passwordError}
                                </span>
                            ) : (
                                <span className="text-[11px] uppercase tracking-wider text-neutral-500">
                                    Must be at least 6 characters.
                                </span>
                            )}
                        </div>

                        {/* Erro geral do formulário */}
                        {formError && (
                            <span role="alert" className="text-[11px] uppercase tracking-wider text-red-500">
                                {formError}
                            </span>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 h-11 rounded-none bg-[#ff6a00] text-xs font-medium uppercase tracking-widest text-[#161616] transition hover:brightness-110 active:brightness-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Signing up..." : "Sign up"}
                        </button>
                    </form>

                    <p className="mt-8 text-xs uppercase tracking-wider text-neutral-400">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-[#ff6a00] hover:underline underline-offset-4"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    )
}