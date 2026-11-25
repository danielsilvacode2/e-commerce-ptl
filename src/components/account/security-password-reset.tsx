'use client'

import { ClipboardEvent, KeyboardEvent, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import ResetPasswordService from '@/src/actions/auth/reset_password'
import ConfirmResetPasswordService from '@/src/actions/auth/confirm_reset_password'

const CODE_LENGTH = 6

type Step = 'request' | 'confirm' | 'done'

interface SecurityPasswordResetProps {
  email: string
}

const inputBase =
  'h-11 w-full rounded-full border bg-white dark:bg-[#121212] px-4 text-sm text-black dark:text-white placeholder:text-neutral-500 outline-none transition focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white disabled:opacity-60'
const inputOk = 'border-black/10 dark:border-white/15'
const inputInvalid = 'border-red-500 bg-red-50 dark:bg-red-950/30'
const primaryButton =
  'flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black dark:bg-white text-xs font-semibold uppercase tracking-wider text-white dark:text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
const secondaryButton =
  'flex h-11 w-full items-center justify-center gap-2 rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] text-xs font-semibold uppercase tracking-wider text-black dark:text-white transition-colors hover:bg-neutral-100 dark:hover:bg-[#242424] focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

function requestErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'RATE_LIMIT')
      return 'Muitas solicitações recentes. Aguarde um minuto e tente novamente.'
    if (err.message === 'USER_NOT_FOUND')
      return 'Não foi encontrada nenhuma conta associada a este e-mail.'
    if (err.message === 'INVALID_INPUT') return 'E-mail inválido. Verifique os dados da conta.'
  }
  return 'Ocorreu um erro ao enviar o código. Tente novamente mais tarde.'
}

export default function SecurityPasswordReset({ email }: SecurityPasswordResetProps) {
  const [step, setStep] = useState<Step>('request')
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showNew, setShowNew] = useState<boolean>(false)
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [codeError, setCodeError] = useState<string>('')
  const [newPasswordError, setNewPasswordError] = useState<string>('')
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('')
  const [formError, setFormError] = useState<string>('')
  const [info, setInfo] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  function focusInput(index: number) {
    inputsRef.current[Math.max(0, Math.min(index, CODE_LENGTH - 1))]?.focus()
  }

  function resetFlow() {
    setStep('request')
    setDigits(Array(CODE_LENGTH).fill(''))
    setNewPassword('')
    setConfirmPassword('')
    setCodeError('')
    setNewPasswordError('')
    setConfirmPasswordError('')
    setFormError('')
    setInfo('')
  }

  function handleDigitChange(index: number, value: string) {
    const onlyDigits = value.replace(/\D/g, '')
    const next = [...digits]
    if (!onlyDigits) {
      next[index] = ''
      setDigits(next)
      return
    }
    onlyDigits
      .slice(0, CODE_LENGTH - index)
      .split('')
      .forEach((d, i) => {
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
    const next: string[] = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((d, i) => {
      next[i] = d
    })
    setDigits(next)
    if (codeError) setCodeError('')
    if (formError) setFormError('')
    focusInput(pasted.length)
  }

  function validateNewPassword(value: string): string {
    if (!value) return 'A nova senha é obrigatória.'
    if (value.length < 8) return 'A senha deve ter no mínimo 8 caracteres.'
    if (value.includes(' ')) return 'A senha não pode conter espaços.'
    return ''
  }

  function validateConfirmPassword(value: string, compare: string): string {
    if (!value) return 'Confirme sua nova senha.'
    if (value !== compare) return 'As senhas não coincidem.'
    return ''
  }

  async function handleSendCode() {
    setFormError('')
    setInfo('')
    setLoading(true)
    try {
      await ResetPasswordService(email)
      setInfo(`Código enviado para ${email}.`)
      setStep('confirm')
    } catch (err) {
      setFormError(requestErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    const code = digits.join('')
    const codeMsg = code.length < CODE_LENGTH ? 'Informe todos os 6 dígitos do código.' : ''
    const newMsg = validateNewPassword(newPassword)
    const confirmMsg = validateConfirmPassword(confirmPassword, newPassword)

    setCodeError(codeMsg)
    setNewPasswordError(newMsg)
    setConfirmPasswordError(confirmMsg)
    setFormError('')

    if (codeMsg || newMsg || confirmMsg) return

    setLoading(true)
    try {
      await ConfirmResetPasswordService(email, code, newPassword)
      setStep('done')
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message === 'INVALID_OR_EXPIRED_CODE') {
        setFormError('Código de verificação incorreto ou expirado.')
        setDigits(Array(CODE_LENGTH).fill(''))
        focusInput(0)
      } else if (message === 'RATE_LIMIT') {
        setFormError(
          'Muitas tentativas consecutivas. Aguarde alguns minutos antes de tentar novamente.'
        )
      } else if (message === 'INVALID_INPUT') {
        setFormError('Dados inválidos. A senha precisa ter pelo menos 8 caracteres, sem espaços.')
      } else {
        setFormError('Não foi possível redefinir a senha. Tente novamente mais tarde.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      aria-label="Segurança da conta"
      className="rounded-3xl border border-black/10 dark:border-white/10 bg-[#F2F0F1] dark:bg-[#1a1a1a] p-6 sm:p-8 space-y-4 text-black dark:text-white transition-colors"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} aria-hidden="true" />
        <h3 className="font-display text-lg font-bold uppercase tracking-tight">Redefinir senha</h3>
      </div>

      {step === 'request' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Enviaremos um código de 6 dígitos para o e-mail da sua conta para você definir uma nova senha.
          </p>
          <p className="flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#121212] px-4 py-3 text-sm font-medium break-all">
            <Mail size={16} className="shrink-0" aria-hidden="true" /> {email}
          </p>

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl bg-red-50 dark:bg-red-950/40 p-3 text-xs font-medium text-red-600 dark:text-red-400"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {formError}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button type="button" onClick={handleSendCode} disabled={loading} className={primaryButton}>
              {loading ? (
                <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Mail size={16} aria-hidden="true" />
              )}
              {loading ? 'Enviando código...' : 'Enviar código por e-mail'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormError('')
                setInfo('')
                setStep('confirm')
              }}
              disabled={loading}
              className={secondaryButton}
            >
              <KeyRound size={16} aria-hidden="true" /> Já tenho um código
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void handleConfirm()
          }}
        >
          {info && (
            <p
              role="status"
              className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#121212] px-4 py-3 text-xs text-neutral-600 dark:text-neutral-300 break-all"
            >
              {info}
            </p>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span id="account-code-label" className="text-xs font-bold uppercase tracking-wider">
                Código de verificação
              </span>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="inline-flex items-center gap-1 text-[11px] font-bold underline underline-offset-4 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw size={12} aria-hidden="true" /> Reenviar código
              </button>
            </div>
            <div role="group" aria-labelledby="account-code-label" className="flex items-center justify-between gap-2">
              {digits.map((digit, i) => (
                <input
                  key={`code-${i}`}
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
                  aria-invalid={!!codeError}
                  aria-describedby={codeError ? 'account-code-error' : undefined}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  onPaste={handleDigitPaste}
                  onFocus={(e) => e.target.select()}
                  className={`h-11 w-full rounded-2xl border bg-white dark:bg-[#121212] text-center text-lg font-bold text-black dark:text-white outline-none transition focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white disabled:opacity-40 ${
                    codeError ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-black/10 dark:border-white/15'
                  }`}
                />
              ))}
            </div>
            {codeError && (
              <span id="account-code-error" role="alert" className="block px-3 text-[11px] font-medium text-red-600 dark:text-red-400">
                {codeError}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="account-new-password" className="text-xs font-bold uppercase tracking-wider">
              Nova senha
            </label>
            <div className="relative">
              <input
                id="account-new-password"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={loading}
                value={newPassword}
                aria-invalid={!!newPasswordError}
                aria-describedby={newPasswordError ? 'account-new-password-error' : undefined}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (newPasswordError) setNewPasswordError('')
                  if (formError) setFormError('')
                }}
                onBlur={() => setNewPasswordError(validateNewPassword(newPassword))}
                className={`${inputBase} pr-12 ${newPasswordError ? inputInvalid : inputOk}`}
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                aria-label={showNew ? 'Ocultar nova senha' : 'Exibir nova senha'}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-black dark:hover:text-white focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white cursor-pointer"
              >
                {showNew ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            {newPasswordError && (
              <span id="account-new-password-error" role="alert" className="block px-3 text-[11px] font-medium text-red-600 dark:text-red-400">
                {newPasswordError}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="account-confirm-password" className="text-xs font-bold uppercase tracking-wider">
              Confirmar nova senha
            </label>
            <div className="relative">
              <input
                id="account-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={loading}
                value={confirmPassword}
                aria-invalid={!!confirmPasswordError}
                aria-describedby={confirmPasswordError ? 'account-confirm-password-error' : undefined}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmPasswordError) setConfirmPasswordError('')
                  if (formError) setFormError('')
                }}
                onBlur={() => setConfirmPasswordError(validateConfirmPassword(confirmPassword, newPassword))}
                className={`${inputBase} pr-12 ${confirmPasswordError ? inputInvalid : inputOk}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? 'Ocultar confirmação' : 'Exibir confirmação'}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-black dark:hover:text-white focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white cursor-pointer"
              >
                {showConfirm ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            {confirmPasswordError && (
              <span id="account-confirm-password-error" role="alert" className="block px-3 text-[11px] font-medium text-red-600 dark:text-red-400">
                {confirmPasswordError}
              </span>
            )}
          </div>

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl bg-red-50 dark:bg-red-950/40 p-3 text-xs font-medium text-red-600 dark:text-red-400"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {formError}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button type="submit" disabled={loading} className={primaryButton}>
              {loading && (
                <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              )}
              {loading ? 'Redefinindo...' : 'Confirmar nova senha'}
            </button>
            <button type="button" onClick={resetFlow} disabled={loading} className={secondaryButton}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div role="status" className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-bold">Senha redefinida com sucesso!</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Sua senha foi atualizada. Use a nova senha no próximo login.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/login" className={primaryButton}>
              Ir para o login
            </Link>
            <button type="button" onClick={resetFlow} className={secondaryButton}>
              Alterar novamente
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
