'use client'

import { ClipboardEvent, KeyboardEvent, Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, MailCheck } from 'lucide-react'
import VerifyEmailCodeService from '@/src/actions/auth/verify_email_code'
// TODO: implemente esse service quando o endpoint de reenvio estiver pronto
// import ResendEmailCodeService from '@/src/actions/users/resend_email_code'

const CODE_LENGTH = 6
const RESEND_COOLDOWN = 60 // segundos
const MAX_ATTEMPTS = 5 // tentativas erradas antes do bloqueio
const BASE_LOCK = 30 // segundos; dobra a cada novo bloqueio
const MAX_LOCK = 300

const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const REDIRECT_AFTER_SUCCESS = '/login'

function VerifyEmailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') ?? ''

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
    const attemptsLeft = MAX_ATTEMPTS - attempts

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

    // quando o bloqueio termina, devolve o foco ao primeiro campo
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

        // se vier mais de um dígito (autofill), distribui nos campos seguintes
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
            setTimeout(() => router.push(REDIRECT_AFTER_SUCCESS), 1500)
        } catch (err) {
            console.log('erro ao verificar código: ' + err)
            const message = err instanceof Error ? err.message : ''

            if (message.startsWith('429')) {
                // servidor bloqueou: usa o Retry-After se vier ("429:45")
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
                            ? `Código inválido. Restam ${left} ${left === 1 ? 'tentativa' : 'tentativas'}.`
                            : 'Código inválido ou expirado. Confira e tente novamente.'
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
            // await ResendEmailCodeService(email)
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
        <main className="flex min-h-screen w-full items-center justify-center bg-[#121212] px-4 py-6 font-inter text-[#eaeaea] sm:px-6 sm:py-10">
            <div className="w-full max-w-md">
                <header className="border-b border-[#333] pb-4">
                    <h1 className="font-['Barlow_Condensed',Impact,sans-serif] text-2xl font-bold uppercase tracking-wide text-[#eaeaea] sm:text-3xl">
                        Verificar e-mail
                    </h1>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-neutral-400 sm:text-xs">
                        Digite o código de {CODE_LENGTH} dígitos enviado para
                    </p>
                    <p className="mt-1 break-all text-sm font-medium tracking-wide text-[#ff6a00]">
                        {email || 'seu e-mail'}
                    </p>
                </header>

                <div className="mt-6 border border-[#333] bg-[#1c1c1c] p-4 sm:p-6">
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
                                className={`h-12 w-full min-w-0 border bg-[#161616] text-center text-lg font-medium text-[#eaeaea] outline-none transition focus:border-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-40 sm:h-14 sm:text-xl ${error
                                    ? 'border-red-500'
                                    : digit
                                        ? 'border-[#ff6a00]/60'
                                        : 'border-[#333]'
                                    }`}
                            />
                        ))}
                    </div>

                    {isLocked && (
                        <div
                            role="alert"
                            className="relative mt-4 overflow-hidden border border-[#ff6a00]/60 bg-[#161616] p-3"
                        >
                            <div className="flex items-start gap-3">
                                <Lock size={18} className="mt-0.5 shrink-0 text-[#ff6a00]" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium tracking-wide text-[#eaeaea]">
                                        Muitas tentativas. Aguarde um instante.
                                    </p>
                                    <p className="mt-1 text-xs tracking-wide text-neutral-400">
                                        Por segurança, bloqueamos novas tentativas por um tempo. Você poderá tentar de novo em{' '}
                                        <span className="font-medium tabular-nums text-[#ff6a00]">
                                            {formatTime(lockSeconds)}
                                        </span>
                                        .
                                    </p>
                                </div>
                            </div>
                            <span
                                aria-hidden
                                className="absolute bottom-0 left-0 h-0.5 bg-[#ff6a00] ease-linear transition-[width] duration-1000"
                                style={{ width: `${lockTotal ? (lockSeconds / lockTotal) * 100 : 0}%` }}
                            />
                        </div>
                    )}

                    <div className="mt-3 min-h-5" aria-live="polite">
                        {!isLocked && error && <p className="text-xs tracking-wide text-red-500">{error}</p>}
                        {!isLocked && !error && info && <p className="text-xs tracking-wide text-neutral-400">{info}</p>}
                        {success && (
                            <p className="flex items-center gap-2 text-xs tracking-wide text-[#ff6a00]">
                                <MailCheck size={14} />
                                E-mail verificado! Redirecionando...
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isComplete || loading || success || isLocked}
                        className="mt-4 h-10 w-full cursor-pointer border border-[#ff6a00] bg-[#ff6a00] px-6 text-xs font-medium uppercase tracking-widest text-[#121212] transition hover:bg-transparent hover:text-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#ff6a00] disabled:hover:text-[#121212]"
                    >
                        {loading ? 'Verificando...' : isLocked ? `Aguarde ${formatTime(lockSeconds)}` : 'Verificar conta'}
                    </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-[11px] uppercase tracking-widest sm:text-xs">
                    <span className="text-neutral-500">Não recebeu o código?</span>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={cooldown > 0 || resending || success}
                        className="cursor-pointer text-neutral-400 transition hover:text-[#ff6a00] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-neutral-400"
                    >
                        {resending ? 'Enviando...' : cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
                    </button>
                </div>
            </div>
        </main>
    )
}

// useSearchParams exige Suspense no build do Next
export default function VerifyEmailMain() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
            <VerifyEmailContent />
        </Suspense>
    )
}