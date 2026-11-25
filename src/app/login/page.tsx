'use client'

import LoginService from '@/src/actions/auth/login_request'
import { cartSyncService } from '@/src/services/cart-sync'
import { guestCartService } from '@/src/services/guest-cart'
import { useSession } from '@/src/components/providers/session-provider'
import ThemeToggle from '@/src/components/theme/theme-toggle'
import Link from 'next/link'
import { CheckCircle2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginFormContent() {
  const router = useRouter()
  const { refreshSession } = useSession()
  const searchParams = useSearchParams()
  const isResetSuccess = searchParams.get('reset') === 'success'
  const redirectUrl = searchParams.get('redirect')

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [emailError, setEmailError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')
  const [errLogin, setErrLogin] = useState<string>('')
  const [syncWarning, setSyncWarning] = useState<string>('')

  function validateEmail(value: string): string {
    const trimmed = value.trim()
    if (!trimmed) return 'O e-mail é obrigatório.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRegex.test(trimmed)) return 'Insira um endereço de e-mail válido.'
    return ''
  }

  function validatePassword(value: string): string {
    if (!value) return 'A senha é obrigatória.'
    if (value.length < 6) return 'A senha deve ter pelo menos 6 caracteres.'
    return ''
  }

  async function LoginUser() {
    const emailMsg = validateEmail(email)
    const passwordMsg = validatePassword(password)

    setEmailError(emailMsg)
    setPasswordError(passwordMsg)
    setErrLogin('')
    setSyncWarning('')

    if (emailMsg || passwordMsg) return

    setLoading(true)
    try {
      await LoginService(email.trim(), password)

      const hadGuestItems = guestCartService.getRawCart().items.length > 0
      if (hadGuestItems) {
        const syncResult = await cartSyncService.syncGuestCartToUser()
        if (syncResult.errors.length > 0) {
          setSyncWarning(
            `Alguns itens não puderam ser sincronizados: ${syncResult.errors.join('; ')}`
          )
        }
      }

      // Atualiza sessão global e carrinho antes de navegar para evitar chamadas redundantes na página destino
      await refreshSession()

      if (redirectUrl) {
        router.push(redirectUrl)
      } else if (hadGuestItems) {
        router.push('/carrinho')
      } else {
        router.push('/')
      }
    } catch {
      setErrLogin('Senha ou e-mail inválido')
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'h-12 w-full rounded-full border bg-[#F2F0F1] dark:bg-[#1f1f1f] px-5 text-sm text-black dark:text-white placeholder:text-neutral-500 outline-none transition font-sans'
  const inputOk =
    'border-transparent focus:border-black/25 dark:focus:border-white/25 focus:bg-white dark:focus:bg-[#181818]'
  const inputInvalid =
    'border-red-500 bg-red-50 dark:bg-red-950/30 focus:border-red-500'

  return (
    <main className="relative min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr] bg-white dark:bg-[#121212] font-sans text-black dark:text-white transition-colors">
      <div className="fixed top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Painel lateral da marca */}
      <section className="hidden lg:flex flex-col justify-between p-16 bg-[#F2F0F1] dark:bg-[#181818] border-r border-black/10 dark:border-white/10 relative overflow-hidden transition-colors">
        <Link
          href="/"
          className="font-display text-3xl font-extrabold uppercase tracking-tight text-black dark:text-white z-10"
        >
          NERO
        </Link>

        <div className="max-w-md z-10">
          <span className="inline-block px-3.5 py-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest mb-4">
            Acesso do Cliente
          </span>
          <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight leading-[0.95] text-black dark:text-white">
            BEM-VINDO DE VOLTA
          </h1>
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
            Acesse seus pedidos, acompanhe o envio de suas compras e confira seleções do nosso catálogo.
          </p>
        </div>

        <div className="text-xs uppercase tracking-widest text-neutral-500 z-10 font-mono">
          NERO AUTH 2026
        </div>
      </section>

      {/* Formulário */}
      <section className="flex items-center justify-center px-6 py-12 bg-white dark:bg-[#121212] transition-colors">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden mb-8">
            <Link
              href="/"
              className="font-display text-2xl font-extrabold uppercase tracking-tight text-black dark:text-white"
            >
              NERO
            </Link>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black dark:text-white">
            ENTRE NA SUA CONTA
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 font-sans">
            Insira suas credenciais para continuar suas compras.
          </p>

          {isResetSuccess && (
            <div
              role="status"
              className="mt-6 flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/15 bg-[#F2F0F1] dark:bg-[#1a1a1a] p-4 text-xs text-black dark:text-white"
            >
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium">
                Senha redefinida com sucesso! Entre com sua nova senha.
              </span>
            </div>
          )}

          <form
            className="mt-8 flex flex-col gap-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              void LoginUser()
            }}
          >
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs uppercase tracking-wider text-black dark:text-white font-bold"
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
                }}
                onBlur={() => setEmailError(validateEmail(email))}
              />
              {emailError && (
                <span
                  id="email-error"
                  role="alert"
                  className="text-[11px] font-medium text-red-600 dark:text-red-400 px-3"
                >
                  {emailError}
                </span>
              )}
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <label
                  htmlFor="password"
                  className="text-xs uppercase tracking-wider text-black dark:text-white font-bold"
                >
                  Senha
                </label>
                <Link
                  href="/esqueceu-senha"
                  className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition underline underline-offset-2"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className={`${inputBase} pr-12 ${passwordError ? inputInvalid : inputOk}`}
                  value={password}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError('')
                  }}
                  onBlur={() => setPasswordError(validatePassword(password))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {passwordError && (
                <span
                  id="password-error"
                  role="alert"
                  className="text-[11px] font-medium text-red-600 dark:text-red-400 px-3"
                >
                  {passwordError}
                </span>
              )}
            </div>

            {errLogin && (
              <div
                role="alert"
                className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-medium"
              >
                {errLogin}
              </div>
            )}

            {syncWarning && (
              <div
                role="alert"
                className="p-3 rounded-2xl bg-[#F2F0F1] dark:bg-[#1f1f1f] border border-black/15 dark:border-white/15 text-xs text-neutral-700 dark:text-neutral-300 font-medium"
              >
                {syncWarning}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 h-12 rounded-full bg-black dark:bg-white text-xs font-semibold uppercase tracking-wider text-white dark:text-black transition hover:opacity-90 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Entrando...' : 'Entrar na Conta'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Não tem uma conta?{' '}
            <Link
              href={redirectUrl ? `/sign?redirect=${encodeURIComponent(redirectUrl)}` : '/sign'}
              className="font-bold text-black dark:text-white underline underline-offset-4 hover:opacity-80"
            >
              Cadastre-se agora
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#121212]" />}>
      <LoginFormContent />
    </Suspense>
  )
}
