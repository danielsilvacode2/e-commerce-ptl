'use client'

import { ClipboardEvent, KeyboardEvent, Suspense, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, RotateCcw } from 'lucide-react'
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
                        'Código de verificação incorreto ou expirado. Verifique o código recebido ou solicite um novo.'
                    )
                    setDigits(Array(CODE_LENGTH).fill(''))
                    focusInput(0)
                } else if (err.message === 'RATE_LIMIT') {
                    setFormError('Muitas tentativas consecutivas. Aguarde alguns minutos antes de tentar novamente.')
                } else if (err.message === 'USER_NOT_FOUND') {
                    setFormError('Usuário não encontrado. Verifique o endereço de e-mail informado.')
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
        'h-11 w-full rounded-none border bg-[#1c1c1c] px-3.5 text-sm text-[#eaeaea] placeholder:text-neutral-500 outline-none transition font-inter'
    const inputOk = 'border-[#333] focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00]'
    const inputInvalid = 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'

    return (
        <main className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr] bg-[#121212] font-inter text-[#eaeaea]">
            {/* Painel lateral da marca */}
            <section className="hidden lg:flex flex-col justify-between p-12 text-[#eaeaea] bg-[#161616] border-r border-[#333] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

                <span className="font-['Barlow_Condensed',Impact,sans-serif] text-2xl font-bold uppercase tracking-wider text-[#ff6a00] z-10">
                    STORE // SECURITY
                </span>

                <div className="max-w-sm z-10">
                    <h1 className="font-['Barlow_Condensed',Impact,sans-serif] text-4xl font-bold uppercase tracking-wide leading-tight text-[#eaeaea]">
                        Nova Senha de Acesso
                    </h1>
                    <p className="mt-3 text-xs text-neutral-400 leading-relaxed uppercase tracking-wider">
                        Insira o código de segurança enviado para o seu e-mail e defina uma nova senha forte para proteger sua conta.
                    </p>
                </div>

                <div className="text-[11px] uppercase tracking-widest text-neutral-600 z-10">
                    Secure Terminal v2.6
                </div>
            </section>

            {/* Formulário */}
            <section className="flex items-center justify-center px-6 py-12 bg-[#121212]">
                <div className="w-full max-w-[380px]">
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
                        Redefinir senha
                    </h2>
                    <p className="mt-1.5 text-xs text-neutral-400 uppercase tracking-wider">
                        Informe o código de 6 dígitos e sua nova senha.
                    </p>

                    {isSuccess ? (
                        <div
                            role="status"
                            className="mt-6 border border-[#ff6a00]/60 bg-[#161616] p-5 text-xs text-[#eaeaea] space-y-4"
                        >
                            <div className="flex items-start gap-3">
                                <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-[#ff6a00]" />
                                <div className="space-y-1.5">
                                    <p className="font-medium text-sm tracking-wide text-[#ff6a00]">
                                        Senha redefinida com sucesso!
                                    </p>
                                    <p className="text-neutral-400 leading-relaxed">
                                        Sua senha foi atualizada no sistema. Você será redirecionado para o login em instantes...
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/login?reset=success"
                                className="block w-full text-center py-2.5 bg-[#ff6a00] text-xs font-medium uppercase tracking-widest text-[#161616] hover:brightness-110 transition"
                            >
                                Ir para o login agora
                            </Link>
                        </div>
                    ) : (
                        <form
                            className="mt-6 flex flex-col gap-4"
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
                                        className="text-[11px] uppercase tracking-wider text-red-500"
                                    >
                                        {emailError}
                                    </span>
                                )}
                            </div>

                            {/* Código de 6 dígitos em blocos/quadrados */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label
                                        id="code-boxes-label"
                                        className="text-xs uppercase tracking-widest text-neutral-300 font-medium"
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
                                            className={`h-11 w-full min-w-0 border bg-[#1c1c1c] text-center text-lg font-medium text-[#eaeaea] outline-none transition focus:border-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:text-xl ${
                                                codeError
                                                    ? 'border-red-500'
                                                    : digit
                                                    ? 'border-[#ff6a00]/60'
                                                    : 'border-[#333]'
                                            }`}
                                        />
                                    ))}
                                </div>

                                {codeError && (
                                    <span
                                        id="code-error"
                                        role="alert"
                                        className="text-[11px] uppercase tracking-wider text-red-500"
                                    >
                                        {codeError}
                                    </span>
                                )}
                            </div>

                            {/* Nova Senha */}
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="newPassword"
                                    className="text-xs uppercase tracking-widest text-neutral-300 font-medium"
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
                                        className={`${inputBase} pr-11 ${
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
                                        className="absolute inset-y-0 right-0 flex items-center px-3.5 text-neutral-400 hover:text-[#eaeaea] transition cursor-pointer"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {newPasswordError ? (
                                    <span
                                        id="new-password-error"
                                        role="alert"
                                        className="text-[11px] uppercase tracking-wider text-red-500"
                                    >
                                        {newPasswordError}
                                    </span>
                                ) : (
                                    <span className="text-[11px] uppercase tracking-wider text-neutral-500">
                                        Mínimo de 8 caracteres, sem espaços.
                                    </span>
                                )}
                            </div>

                            {/* Confirmação da Nova Senha */}
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="confirmPassword"
                                    className="text-xs uppercase tracking-widest text-neutral-300 font-medium"
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
                                        className={`${inputBase} pr-11 ${
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
                                        className="absolute inset-y-0 right-0 flex items-center px-3.5 text-neutral-400 hover:text-[#eaeaea] transition cursor-pointer"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {confirmPasswordError && (
                                    <span
                                        id="confirm-password-error"
                                        role="alert"
                                        className="text-[11px] uppercase tracking-wider text-red-500"
                                    >
                                        {confirmPasswordError}
                                    </span>
                                )}
                            </div>

                            {/* Alerta de erro geral */}
                            {formError && (
                                <div
                                    role="alert"
                                    className="mt-1 border border-red-500/50 bg-red-950/20 p-3 text-[11px] uppercase tracking-wider text-red-400"
                                >
                                    <p>{formError}</p>
                                    {isExpiredOrInvalidCode && (
                                        <div className="mt-2.5 pt-2 border-t border-red-500/30">
                                            <Link
                                                href={`/esqueceu-senha`}
                                                className="inline-flex items-center gap-1.5 font-medium text-[#ff6a00] hover:underline normal-case"
                                            >
                                                <RotateCcw size={14} />
                                                Solicitar um novo código de verificação
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 h-11 w-full rounded-none bg-[#ff6a00] text-xs font-medium uppercase tracking-widest text-[#161616] transition hover:brightness-110 active:brightness-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Redefinindo senha...' : 'Redefinir senha'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 pt-4 border-t border-[#333] flex items-center justify-between text-xs uppercase tracking-wider text-neutral-400">
                        <span>Não recebeu o código?</span>
                        <Link
                            href="/esqueceu-senha"
                            className="font-medium text-[#ff6a00] hover:underline underline-offset-4"
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
        <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
            <ResetPasswordFormContent />
        </Suspense>
    )
}
