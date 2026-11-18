'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
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
        'h-11 w-full rounded-none border bg-[#1c1c1c] px-3.5 text-sm text-[#eaeaea] placeholder:text-neutral-500 outline-none transition font-inter'
    const inputOk = 'border-[#333] focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00]'
    const inputInvalid = 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'

    return (
        <main className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr] bg-[#121212] font-inter text-[#eaeaea]">
            {/* Painel lateral da marca */}
            <section className="hidden lg:flex flex-col justify-between p-12 text-[#eaeaea] bg-[#161616] border-r border-[#333] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

                <span className="font-['Barlow_Condensed',Impact,sans-serif] text-2xl font-bold uppercase tracking-wider text-[#ff6a00] z-10">
                    STORE // RECOVERY
                </span>

                <div className="max-w-sm z-10">
                    <h1 className="font-['Barlow_Condensed',Impact,sans-serif] text-4xl font-bold uppercase tracking-wide leading-tight text-[#eaeaea]">
                        Recuperação de Acesso
                    </h1>
                    <p className="mt-3 text-xs text-neutral-400 leading-relaxed uppercase tracking-wider">
                        Informe seu e-mail cadastrado. Enviaremos um código de segurança de uso único para redefinir sua senha.
                    </p>
                </div>

                <div className="text-[11px] uppercase tracking-widest text-neutral-600 z-10">
                    Secure Terminal v2.6
                </div>
            </section>

            {/* Seção do Formulário */}
            <section className="flex items-center justify-center px-6 py-12 bg-[#121212]">
                <div className="w-full max-w-[360px]">
                    <div className="mb-6">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-400 hover:text-[#ff6a00] transition"
                        >
                            <ArrowLeft size={16} />
                            Voltar para o login
                        </Link>
                    </div>

                    <h2 className="font-['Barlow_Condensed',Impact,sans-serif] text-3xl font-bold uppercase tracking-wide text-[#eaeaea]">
                        Esqueceu sua senha?
                    </h2>
                    <p className="mt-1.5 text-xs text-neutral-400 uppercase tracking-wider">
                        Digite seu e-mail para receber as instruções de recuperação.
                    </p>

                    {successMessage ? (
                        <div
                            role="status"
                            className="mt-6 border border-[#ff6a00]/60 bg-[#161616] p-4 text-xs text-[#eaeaea]"
                        >
                            <div className="flex items-start gap-2.5">
                                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#ff6a00]" />
                                <div className="space-y-2">
                                    <p className="font-medium tracking-wide text-[#ff6a00]">
                                        Código enviado com sucesso!
                                    </p>
                                    <p className="text-neutral-400 leading-relaxed">
                                        Enviamos um código de verificação para{' '}
                                        <span className="text-[#eaeaea] font-medium">{email}</span>. Você será redirecionado para a tela de redefinição...
                                    </p>
                                </div>
                            </div>

                            <Link
                                href={`/redefinir-senha?email=${encodeURIComponent(email.trim())}`}
                                className="mt-4 block w-full text-center py-2.5 bg-[#ff6a00] text-xs font-medium uppercase tracking-widest text-[#161616] hover:brightness-110 transition"
                            >
                                Avançar para redefinição
                            </Link>
                        </div>
                    ) : (
                        <form
                            className="mt-6 flex flex-col gap-5"
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
                                    className="text-xs uppercase tracking-widest text-neutral-300 font-medium"
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
                                        className="text-[11px] uppercase tracking-wider text-red-500"
                                    >
                                        {emailError}
                                    </span>
                                )}
                            </div>

                            {/* Mensagem geral de erro */}
                            {formError && (
                                <span role="alert" className="text-[11px] uppercase tracking-wider text-red-500">
                                    {formError}
                                </span>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 h-11 w-full rounded-none bg-[#ff6a00] text-xs font-medium uppercase tracking-widest text-[#161616] transition hover:brightness-110 active:brightness-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Enviando código...' : 'Enviar código'}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-[#333] flex flex-col gap-3 text-xs uppercase tracking-wider text-neutral-400">
                        <p>
                            Já possui um código?{' '}
                            <Link
                                href="/redefinir-senha"
                                className="font-medium text-[#ff6a00] hover:underline underline-offset-4"
                            >
                                Digitar código e redefinir
                            </Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}
