'use client';
import SignService from "@/src/actions/sign/sign_request";
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react";
import { useRouter } from "next/navigation";

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

        // Se algum campo estiver inválido, não faz o cadastro
        if (nameMsg || emailMsg || passwordMsg) return

        setLoading(true)
        try {
            await SignService(email, password, name)
            router.push("/login")
        } catch (err) {
            if (err instanceof Error && err.message === "CONFLICT") {
                setEmailError("This email is already registered.")
            } else {
                setFormError("Something went wrong. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    const inputBase =
        "h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-4"
    const inputOk = "border-slate-300 focus:border-blue-700 focus:ring-blue-700/15"
    const inputInvalid = "border-red-500 focus:border-red-500 focus:ring-red-500/15"

    return (
        <main className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr] bg-white font-inter">
            {/* Painel da marca */}
            <section
                className="hidden lg:flex flex-col justify-between p-12 text-white bg-blue-900 bg-cover bg-center"
                style={{ backgroundImage: "url('/assests/bg-ocean-blue900.png')" }}
            >
                <img className="w-[270px]" src="/assests/logo_ocean.png" alt="Ocean" />

                <div className="max-w-sm">
                    <h1 className="text-4xl font-semibold leading-tight tracking-tight">
                        Create your account!
                    </h1>
                    <p className="mt-3 text-sm text-blue-100/80 leading-relaxed">
                        Join us and start managing your store. All data is protected and encrypted by the system.
                    </p>
                </div>
            </section>

            {/* Formulário */}
            <section className="flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-[360px]">
                    <img
                        className="lg:hidden w-[170px] mb-10"
                        src="/assests/logo-ocean-azul-escuro.png"
                        alt="Ocean"
                    />

                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                        Create your account
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500">
                        Fill in your details to get started.
                    </p>

                    <form
                        className="mt-5 flex flex-col gap-5"
                        noValidate
                        onSubmit={(e) => {
                            e.preventDefault()
                            SignUpUser()
                        }}
                    >
                        {/* Nome */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="name" className="text-sm font-medium text-slate-700">
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
                                    if (nameError) setNameError("") // limpa o erro ao digitar
                                }}
                                onBlur={() => setNameError(validateName(name))}
                            />
                            {nameError && (
                                <span id="name-error" role="alert" className="text-xs text-red-600">
                                    {nameError}
                                </span>
                            )}
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-slate-700">
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
                                <span id="email-error" role="alert" className="text-xs text-red-600">
                                    {emailError}
                                </span>
                            )}
                        </div>

                        {/* Senha */}
                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-slate-700"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a password"
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
                                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {passwordError ? (
                                <span id="password-error" role="alert" className="text-xs text-red-600">
                                    {passwordError}
                                </span>
                            ) : (
                                <span className="text-xs text-slate-500">
                                    Must be at least 8 characters.
                                </span>
                            )}
                        </div>

                        {/* Erro geral do formulário */}
                        {formError && (
                            <span role="alert" className="text-xs text-red-600">
                                {formError}
                            </span>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 h-11 rounded-lg bg-blue-900 text-sm font-medium text-white transition hover:bg-blue-800 active:bg-blue-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-700/30 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Signing up..." : "Sign up"}
                        </button>
                    </form>

                    <p className="mt-8 text-sm text-slate-500">
                        Already have an account?{" "}
                        <a
                            href="/login"
                            className="font-medium text-blue-900 hover:underline underline-offset-4"
                        >
                            Log in
                        </a>
                    </p>
                </div>
            </section>
        </main>
    )
}