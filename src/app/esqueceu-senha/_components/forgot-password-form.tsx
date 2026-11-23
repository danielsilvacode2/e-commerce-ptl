'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react'
import ResetPasswordService from '@/src/actions/auth/reset_password'

export default function ForgotPasswordForm() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState('')
    const [formError, setFormError] = useState('')
    const [loading, setLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    function validateEmail(value: string): string {
        const trimmed = value.trim()
        if (!trimmed) return 'O e-mail é obrigatório.'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
        if (!emailRegex.test(trimmed)) return 'Insira um endereço de e-mail válido.'
        return ''
    }

    async function handleSubmit() {
        const emailMsg = validateEmail(email)
        setEmailError(emailMsg)
        setFormError('')

        if (emailMsg) return

        setLoading(true)

        try {
            await ResetPasswordService(email.trim())
            setSuccessMessage('Código de recuperação enviado com sucesso! Verifique seu e-mail.')
            setTimeout(() => {
                router.push(`/redefinir-senha?email=${encodeURIComponent(email.trim())}`)
            }, 1800)
        } catch (err) {
            if (err instanceof Error) {
                if (err.message === 'RATE_LIMIT') {
                    setFormError('Muitas solicitações recentes. Por favor, aguarde um minuto e tente novamente.')
                } else if (err.message === 'USER_NOT_FOUND') {
                    setFormError('Não foi encontrada nenhuma conta associada a este endereço de e-mail.')
                } else if (err.message === 'INVALID_INPUT') {
                    setFormError('Endereço de e-mail inválido. Verifique os dados informados.')
                } else {
                    setFormError('Ocorreu um erro ao solicitar a redefinição. Tente novamente mais tarde.')
                }
            } else {
                setFormError('Ocorreu um erro inesperado. Tente novamente.')
            }
        } finally {
            setLoading(false)
        }
    }

    const inputBase =
        'h-12 w-full rounded-full border bg-[#F2F0F1] px-5 text-sm text-black placeholder:text-neutral-500 outline-none transition font-sans'
    const inputOk = 'border-transparent focus:border-black/20 focus:bg-white'
    const inputInvalid = 'border-red-500 bg-red-50 focus:border-red-500'

    return (
        <main className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr] bg-white font-sans text-black">
            {/* Painel lateral da marca */}
            <section className="hidden lg:flex flex-col justify-between p-16 bg-[#F2F0F1] border-r border-black/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-radial from-neutral-200/50 to-transparent pointer-events-none" />

                <Link href="/" className="font-display text-3xl font-extrabold uppercase tracking-tight text-black z-10">
                    NERO
                </Link>

                <div className="max-w-md z-10">
                    <span className="inline-block px-3.5 py-1 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-widest mb-4">
                        Segurança & Acesso
                    </span>
                    <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight leading-[0.95] text-black">
                        RECUPERAR ACESSO
                    </h1>
                    <p className="mt-4 text-sm text-neutral-600 leading-relaxed font-sans">
                        Informe seu e-mail cadastrado. Enviaremos um código de segurança de uso único de 6 dígitos para redefinir sua senha com tranquilidade.
                    </p>
                </div>

                <div className="text-xs uppercase tracking-widest text-neutral-500 z-10 font-mono">
                    NERO RECOVERY 2026
                </div>
            </section>

            {/* Seção do Formulário */}
            <section className="flex items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-[380px]">
                    <div className="mb-6">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-600 hover:text-black transition"
                        >
                            <ArrowLeft size={16} />
                            Voltar para o login
                        </Link>
                    </div>

                    <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black">
                        ESQUECEU A SENHA?
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600 font-sans">
                        Digite seu e-mail para receber as instruções de recuperação.
                    </p>

                    {successMessage ? (
                        <div
                            role="status"
                            className="mt-6 rounded-2xl border border-black/10 bg-[#F2F0F1] p-5 text-xs text-black space-y-3"
                        >
                            <div className="flex items-start gap-2.5">
                                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                                <div className="space-y-1">
                                    <p className="font-bold text-black">
                                        Código enviado com sucesso!
                                    </p>
                                    <p className="text-neutral-600 leading-relaxed">
                                        Enviamos um código para <span className="text-black font-semibold">{email}</span>. Redirecionando...
                                    </p>
                                </div>
                            </div>

                            <Link
                                href={`/redefinir-senha?email=${encodeURIComponent(email.trim())}`}
                                className="mt-3 block w-full text-center py-3 rounded-full bg-black text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800 transition"
                            >
                                Avançar para redefinição
                            </Link>
                        </div>
                    ) : (
                        <form
                            className="mt-8 flex flex-col gap-5"
                            noValidate
                            onSubmit={(e) => {
                                e.preventDefault()
                                handleSubmit()
                            }}
                        >
                            {/* E-mail */}
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="email"
                                    className="text-xs uppercase tracking-wider text-black font-bold"
                                >
                                    E-mail cadastrado
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
                                    aria-describedby={emailError ? 'email-error' : undefined}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        if (emailError) setEmailError('')
                                        if (formError) setFormError('')
                                    }}
                                    onBlur={() => setEmailError(validateEmail(email))}
                                />
                                {emailError && (
                                    <span
                                        id="email-error"
                                        role="alert"
                                        className="text-[11px] font-medium text-red-600 px-3"
                                    >
                                        {emailError}
                                    </span>
                                )}
                            </div>

                            {formError && (
                                <div role="alert" className="p-3 rounded-2xl bg-red-50 text-xs text-red-600 font-medium">
                                    {formError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 h-12 w-full rounded-full bg-black text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? 'Enviando código...' : 'Enviar Código'} <ArrowRight size={16} />
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-black/10 text-center text-xs text-neutral-600">
                        Já possui um código?{' '}
                        <Link
                            href="/redefinir-senha"
                            className="font-bold text-black underline underline-offset-4 hover:opacity-80"
                        >
                            Redefinir senha agora
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
