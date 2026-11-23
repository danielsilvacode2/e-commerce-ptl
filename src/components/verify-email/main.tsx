'use client'

import { ClipboardEvent, KeyboardEvent, Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, MailCheck, ArrowRight } from 'lucide-react'
import VerifyEmailCodeService from '@/src/actions/auth/verify_email_code'

const CODE_LENGTH = 6
const RESEND_COOLDOWN = 60
const MAX_ATTEMPTS = 5
const BASE_LOCK = 30
const MAX_LOCK = 300

const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const REDIRECT_AFTER_SUCCESS = '/login'

function VerifyEmailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') ?? ''
    const redirectUrl = searchParams.get('redirect')

    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [info, setInfo] = useState('')
    const [cooldown, setCooldown] = useState(0)
    const [resending, setResending] = useState(false)
    const [attempts, setAttempts] = useState(0)
    const [lockSeconds, setLockSeconds] = useState(0)
    const [lockTotal, setLockTotal] = useState(0)
    const lockoutCount = useRef(0)

    const inputsRef = useRef<(HTMLInputElement | null)[]>([])

    const code = digits.join('')
    const isComplete = code.length === CODE_LENGTH && digits.every(Boolean)
    const isLocked = lockSeconds > 0

    useEffect(() => {
        inputsRef.current[0]?.focus()
    }, [])

    useEffect(() => {
        if (cooldown <= 0) return
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
        return () => clearTimeout(t)
    }, [cooldown])

    useEffect(() => {
        if (lockSeconds <= 0) return
        const t = setTimeout(() => setLockSeconds((s) => s - 1), 1000)
        return () => clearTimeout(t)
    }, [lockSeconds])

    useEffect(() => {
        if (!isLocked && lockTotal > 0) {
            setLockTotal(0)
            inputsRef.current[0]?.focus()
        }
    }, [isLocked, lockTotal])

    function startLock(seconds: number) {
        setAttempts(0)
        setError('')
        setInfo('')
        setDigits(Array(CODE_LENGTH).fill(''))
        setLockTotal(seconds)
        setLockSeconds(seconds)
    }

    function focusInput(index: number) {
        inputsRef.current[Math.max(0, Math.min(index, CODE_LENGTH - 1))]?.focus()
    }

    function handleChange(index: number, value: string) {
        const onlyDigits = value.replace(/\D/g, '')
        if (!onlyDigits) return

        const next = [...digits]
        onlyDigits.slice(0, CODE_LENGTH - index).split('').forEach((d, i) => {
            next[index + i] = d
        })
        setDigits(next)
        setError('')
        focusInput(index + onlyDigits.length)
    }

    function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
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
        } else if (e.key === 'Enter' && isComplete) {
            handleSubmit()
        }
    }

    function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
        if (!pasted) return
        const next = Array(CODE_LENGTH).fill('')
        pasted.split('').forEach((d, i) => (next[i] = d))
        setDigits(next)
        setError('')
        focusInput(pasted.length)
    }

    async function handleSubmit() {
        if (!isComplete || loading || success || isLocked) return

        if (!email) {
            setError('E-mail não encontrado. Volte e refaça o cadastro.')
            return
        }

        setLoading(true)
        setError('')
        setInfo('')

        try {
            await VerifyEmailCodeService(email, code)
            setSuccess(true)
            const targetLogin = redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : REDIRECT_AFTER_SUCCESS
            setTimeout(() => router.push(targetLogin), 1500)
        } catch (err) {
            console.log('erro ao verificar código: ' + err)
            const message = err instanceof Error ? err.message : ''

            if (message.startsWith('429')) {
                const retry = Number(message.split(':')[1]) || BASE_LOCK
                startLock(retry)
            } else {
                const next = attempts + 1
                if (next >= MAX_ATTEMPTS) {
                    const seconds = Math.min(BASE_LOCK * 2 ** lockoutCount.current, MAX_LOCK)
                    lockoutCount.current += 1
                    startLock(seconds)
                } else {
                    setAttempts(next)
                    const left = MAX_ATTEMPTS - next
                    setError(
                        left <= 2
                            ? `Código inválido. Restam ${left} tentativas.`
                            : 'Código inválido ou expirado. Tente novamente.'
                    )
                    setDigits(Array(CODE_LENGTH).fill(''))
                    focusInput(0)
                }
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleResend() {
        if (cooldown > 0 || resending || !email) return

        setResending(true)
        setError('')
        setInfo('')

        try {
            setInfo('Enviamos um novo código para o seu e-mail.')
            setCooldown(RESEND_COOLDOWN)
        } catch (err) {
            console.log('erro ao reenviar código: ' + err)
            setError('Não foi possível reenviar o código. Tente novamente.')
        } finally {
            setResending(false)
        }
    }

    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-12 font-sans text-black">
            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <Link href="/" className="font-display text-3xl font-extrabold uppercase tracking-tight text-black inline-block mb-4">
                        NERO
                    </Link>
                    <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-black">
                        VERIFICAR E-MAIL
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600 font-sans">
                        Digite o código de {CODE_LENGTH} dígitos enviado para
                    </p>
                    <p className="mt-1 font-bold text-black font-sans break-all">
                        {email || 'seu e-mail'}
                    </p>
                </div>

                <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
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
                                disabled={loading || success || isLocked}
                                aria-label={`Dígito ${i + 1} do código`}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                onPaste={handlePaste}
                                onFocus={(e) => e.target.select()}
                                className={`h-12 w-full rounded-2xl border bg-[#F2F0F1] text-center text-lg font-bold text-black outline-none transition focus:border-black/30 focus:bg-white disabled:opacity-40 ${
                                    error ? 'border-red-500 bg-red-50' : 'border-transparent'
                                }`}
                            />
                        ))}
                    </div>

                    {isLocked && (
                        <div
                            role="alert"
                            className="relative mt-4 overflow-hidden rounded-2xl bg-amber-50 border border-amber-200 p-4"
                        >
                            <div className="flex items-start gap-3">
                                <Lock size={18} className="mt-0.5 shrink-0 text-amber-600" />
                                <div className="min-w-0 text-xs text-amber-800">
                                    <p className="font-bold">
                                        Muitas tentativas incorretas.
                                    </p>
                                    <p className="mt-1">
                                        Aguarde <span className="font-bold">{formatTime(lockSeconds)}</span> para tentar novamente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 min-h-5 text-center text-xs font-medium" aria-live="polite">
                        {!isLocked && error && <p className="text-red-600">{error}</p>}
                        {!isLocked && !error && info && <p className="text-neutral-600">{info}</p>}
                        {success && (
                            <p className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold">
                                <MailCheck size={16} />
                                E-mail verificado! Redirecionando...
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isComplete || loading || success || isLocked}
                        className="mt-6 h-12 w-full rounded-full bg-black text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Verificando...' : isLocked ? `Aguarde ${formatTime(lockSeconds)}` : 'Confirmar e Ativar Conta'} <ArrowRight size={16} />
                    </button>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs text-neutral-600 px-2 font-medium">
                    <span>Não recebeu o código?</span>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={cooldown > 0 || resending || success}
                        className="font-bold text-black hover:underline disabled:opacity-40 cursor-pointer"
                    >
                        {resending ? 'Enviando...' : cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
                    </button>
                </div>
            </div>
        </main>
    )
}

export default function VerifyEmailMain() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <VerifyEmailContent />
        </Suspense>
    )
}
