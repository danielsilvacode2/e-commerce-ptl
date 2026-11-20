'use client'

import { ClipboardEvent, KeyboardEvent, Suspense, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, RotateCcw, ArrowRight } from 'lucide-react'
import ConfirmResetPasswordService from '@/src/actions/auth/confirm_reset_password'

const CODE_LENGTH = 6

function ResetPasswordFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailParam = searchParams.get('email') ?? ''

    const [email, setEmail] = useState(emailParam)
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [emailError, setEmailError] = useState('')
    const [codeError, setCodeError] = useState('')
    const [newPasswordError, setNewPasswordError] = useState('')
    const [confirmPasswordError, setConfirmPasswordError] = useState('')
    const [formError, setFormError] = useState('')

    const [loading, setLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isExpiredOrInvalidCode, setIsExpiredOrInvalidCode] = useState(false)

    const inputsRef = useRef<(HTMLInputElement | null)[]>([])

    function focusInput(index: number) {
        inputsRef.current[Math.max(0, Math.min(index, CODE_LENGTH - 1))]?.focus()
    }

    function handleDigitChange(index: number, value: string) {
        const onlyDigits = value.replace(/\D/g, '')
        if (!onlyDigits) {
            const next = [...digits]
            next[index] = ''
            setDigits(next)
            return
        }

        const next = [...digits]
        onlyDigits.slice(0, CODE_LENGTH - index).split('').forEach((d, i) => {
            next[index + i] = d
        })
        setDigits(next)
        if (codeError) setCodeError('')
        if (formError) setFormError('')
        focusInput(index + onlyDigits.length)
    }

    function handleDigitKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Backspace') {
            e.preventDefault()
            const next = [...digits]
            if (digits[index]) {
                next[index] = ''
                setDigits(next)
            } else if (index > 0) {
                next[index - 1] = ''
                setDigits(next)
                focusInput(index - 1)
            }
        } else if (e.key === 'ArrowLeft') {
            focusInput(index - 1)
        } else if (e.key === 'ArrowRight') {
            focusInput(index + 1)
        }
    }

    function handleDigitPaste(e: ClipboardEvent<HTMLInputElement>) {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
        if (!pasted) return
        const next = Array(CODE_LENGTH).fill('')
        pasted.split('').forEach((d, i) => (next[i] = d))
        setDigits(next)
        if (codeError) setCodeError('')
        if (formError) setFormError('')
        focusInput(pasted.length)
    }

    function validateEmail(value: string): string {
        const trimmed = value.trim()
        if (!trimmed) return 'O e-mail é obrigatório.'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
        if (!emailRegex.test(trimmed)) return 'Insira um endereço de e-mail válido.'
        return ''
    }

    function validateCode(codeValue: string): string {
        const trimmed = codeValue.trim()
        if (!trimmed || trimmed.length < CODE_LENGTH) {
            return 'Informe todos os 6 dígitos do código de verificação.'
        }
        if (!/^\d{6}$/.test(trimmed)) {
            return 'O código deve conter apenas números.'
        }
        return ''
    }

    function validateNewPassword(value: string): string {
        if (!value) return 'A nova senha é obrigatória.'
        if (value.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
        if (value.includes(' ')) return 'A senha não pode conter espaços.'
        return ''
    }

    function validateConfirmPassword(value: string, passwordToCompare: string): string {
        if (!value) return 'Confirme sua nova senha.'
        if (value !== passwordToCompare) return 'As senhas não coincidem.'
        return ''
    }

    async function handleSubmit() {
        const codeValue = digits.join('')
        const emailMsg = validateEmail(email)
        const codeMsg = validateCode(codeValue)
        const newPassMsg = validateNewPassword(newPassword)
        const confirmPassMsg = validateConfirmPassword(confirmPassword, newPassword)

        setEmailError(emailMsg)
        setCodeError(codeMsg)
        setNewPasswordError(newPassMsg)
        setConfirmPasswordError(confirmPassMsg)
        setFormError('')
        setIsExpiredOrInvalidCode(false)

        if (emailMsg || codeMsg || newPassMsg || confirmPassMsg) return

        setLoading(true)

        try {
            await ConfirmResetPasswordService(email.trim(), codeValue, newPassword)
            setIsSuccess(true)
            setTimeout(() => {
                router.push('/login?reset=success')
            }, 2000)
        } catch (err) {
            if (err instanceof Error) {
                if (err.message === 'INVALID_OR_EXPIRED_CODE') {
                    setIsExpiredOrInvalidCode(true)
                    setFormError(
                        'Código de verificação incorreto ou expirado.'
                    )
                    setDigits(Array(CODE_LENGTH).fill(''))
                    focusInput(0)
                } else if (err.message === 'RATE_LIMIT') {
                    setFormError('Muitas tentativas consecutivas. Aguarde alguns minutos antes de tentar novamente.')
                } else if (err.message === 'USER_NOT_FOUND') {
                    setFormError('Usuário não encontrado. Verifique o e-mail.')
                } else if (err.message === 'INVALID_INPUT') {
                    setFormError('Dados inválidos. A senha precisa ter pelo menos 8 caracteres sem espaços.')
                } else {
                    setFormError('Não foi possível redefinir a senha. Tente novamente mais tarde.')
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
                    SHOP.CO
                </Link>

                <div className="max-w-md z-10">
                    <span className="inline-block px-3.5 py-1 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-widest mb-4">
                        Segurança & Acesso
                    </span>
                    <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight leading-[0.95] text-black">
                        NOVA SENHA
                    </h1>
                    <p className="mt-4 text-sm text-neutral-600 leading-relaxed font-sans">
                        Insira o código de segurança enviado para o seu e-mail e defina uma nova senha forte para proteger sua conta.
                    </p>
                </div>

                <div className="text-xs uppercase tracking-widest text-neutral-500 z-10 font-mono">
                    SHOP.CO SECURITY 2026
                </div>
            </section>

            {/* Formulário */}
            <section className="flex items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-[400px]">
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
                        REDEFINIR SENHA
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600 font-sans">
                        Informe o código de 6 dígitos e sua nova senha.
                    </p>

                    {isSuccess ? (
                        <div
                            role="status"
                            className="mt-6 rounded-2xl border border-black/10 bg-[#F2F0F1] p-5 text-xs text-black space-y-3"
                        >
                            <div className="flex items-start gap-3">
                                <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" />
                                <div className="space-y-1">
                                    <p className="font-bold text-black text-sm">
                                        Senha redefinida com sucesso!
                                    </p>
                                    <p className="text-neutral-600 leading-relaxed">
                                        Sua senha foi atualizada. Você será redirecionado para o login em instantes...
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/login?reset=success"
                                className="block w-full text-center py-3 rounded-full bg-black text-xs font-semibold uppercase tracking-wider text-white hover:bg-neutral-800 transition"
                            >
                                Ir para o login agora
                            </Link>
                        </div>
                    ) : (
                        <form
                            className="mt-8 flex flex-col gap-4"
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

                            {/* Código de 6 dígitos em blocos */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label
                                        id="code-boxes-label"
                                        className="text-xs uppercase tracking-wider text-black font-bold"
                                    >
                                        Código de verificação
                                    </label>
                                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                                        6 dígitos
                                    </span>
                                </div>

                                <div
                                    role="group"
                                    aria-labelledby="code-boxes-label"
                                    className="flex items-center justify-between gap-2"
                                >
                                    {digits.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => {
                                                inputsRef.current[i] = el
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                            maxLength={CODE_LENGTH}
                                            value={digit}
                                            disabled={loading}
                                            aria-label={`Dígito ${i + 1} do código`}
                                            onChange={(e) => handleDigitChange(i, e.target.value)}
                                            onKeyDown={(e) => handleDigitKeyDown(i, e)}
                                            onPaste={handleDigitPaste}
                                            onFocus={(e) => e.target.select()}
                                            className={`h-12 w-full rounded-2xl border bg-[#F2F0F1] text-center text-lg font-bold text-black outline-none transition focus:border-black/30 focus:bg-white disabled:opacity-40 ${
                                                codeError ? 'border-red-500 bg-red-50' : 'border-transparent'
                                            }`}
                                        />
                                    ))}
                                </div>

                                {codeError && (
                                    <span
                                        id="code-error"
                                        role="alert"
                                        className="text-[11px] font-medium text-red-600 px-3"
                                    >
                                        {codeError}
                                    </span>
                                )}
                            </div>

                            {/* Nova Senha */}
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="newPassword"
                                    className="text-xs uppercase tracking-wider text-black font-bold"
                                >
                                    Nova senha
                                </label>
                                <div className="relative">
                                    <input
                                        id="newPassword"
                                        type={showNewPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        disabled={loading}
                                        className={`${inputBase} pr-12 ${
                                            newPasswordError ? inputInvalid : inputOk
                                        }`}
                                        value={newPassword}
                                        aria-invalid={!!newPasswordError}
                                        aria-describedby={newPasswordError ? 'new-password-error' : undefined}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value)
                                            if (newPasswordError) setNewPasswordError('')
                                            if (formError) setFormError('')
                                        }}
                                        onBlur={() => setNewPasswordError(validateNewPassword(newPassword))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((prev) => !prev)}
                                        aria-label={showNewPassword ? 'Ocultar nova senha' : 'Exibir nova senha'}
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-black transition cursor-pointer"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {newPasswordError && (
                                    <span
                                        id="new-password-error"
                                        role="alert"
                                        className="text-[11px] font-medium text-red-600 px-3"
                                    >
                                        {newPasswordError}
                                    </span>
                                )}
                            </div>

                            {/* Confirmação da Nova Senha */}
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="confirmPassword"
                                    className="text-xs uppercase tracking-wider text-black font-bold"
                                >
                                    Confirmar nova senha
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        disabled={loading}
                                        className={`${inputBase} pr-12 ${
                                            confirmPasswordError ? inputInvalid : inputOk
                                        }`}
                                        value={confirmPassword}
                                        aria-invalid={!!confirmPasswordError}
                                        aria-describedby={
                                            confirmPasswordError ? 'confirm-password-error' : undefined
                                        }
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value)
                                            if (confirmPasswordError) setConfirmPasswordError('')
                                            if (formError) setFormError('')
                                        }}
                                        onBlur={() =>
                                            setConfirmPasswordError(
                                                validateConfirmPassword(confirmPassword, newPassword)
                                            )
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        aria-label={showConfirmPassword ? 'Ocultar confirmação' : 'Exibir confirmação'}
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-black transition cursor-pointer"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {confirmPasswordError && (
                                    <span
                                        id="confirm-password-error"
                                        role="alert"
                                        className="text-[11px] font-medium text-red-600 px-3"
                                    >
                                        {confirmPasswordError}
                                    </span>
                                )}
                            </div>

                            {formError && (
                                <div
                                    role="alert"
                                    className="p-3 rounded-2xl bg-red-50 text-xs text-red-600 font-medium"
                                >
                                    <p>{formError}</p>
                                    {isExpiredOrInvalidCode && (
                                        <div className="mt-2 pt-2 border-t border-red-200">
                                            <Link
                                                href={`/esqueceu-senha`}
                                                className="inline-flex items-center gap-1.5 font-bold text-black hover:underline"
                                            >
                                                <RotateCcw size={14} />
                                                Solicitar um novo código
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-3 h-12 w-full rounded-full bg-black text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? 'Redefinindo...' : 'Redefinir Senha'} <ArrowRight size={16} />
                            </button>
                        </form>
                    )}

                    <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between text-xs text-neutral-600">
                        <span>Não recebeu o código?</span>
                        <Link
                            href="/esqueceu-senha"
                            className="font-bold text-black underline underline-offset-4 hover:opacity-80"
                        >
                            Solicitar novo
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default function ResetPasswordForm() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <ResetPasswordFormContent />
        </Suspense>
    )
}
