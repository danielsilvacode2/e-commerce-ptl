'use client'

import LogoutService from '@/src/actions/auth/logout'
import { guestCartService } from '@/src/services/guest-cart'
import { useSession } from '@/src/components/providers/session-provider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User, LogOut, Package, MessageCircle, ShieldCheck, ArrowUpRight } from 'lucide-react'
import SupportChat from '@/src/components/account/support-chat'
import SecurityPasswordReset from '@/src/components/account/security-password-reset'
import { Skeleton } from '@/src/components/ui/skeletons'

type AccountTab = 'profile' | 'security' | 'support'

interface TabItem {
  id: AccountTab
  label: string
  icon: typeof User
}

const TABS: TabItem[] = [
  { id: 'profile', label: 'Meus Dados', icon: User },
  { id: 'security', label: 'Segurança', icon: ShieldCheck },
  { id: 'support', label: 'Atendimento', icon: MessageCircle },
]

function formatDate(value: string): string {
  const date = new Date(value)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
}

function Field({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string
  value: string
  mono?: boolean
  wide?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-1 border-b border-black/5 dark:border-white/10 pb-4 ${
        wide ? 'sm:col-span-2' : ''
      }`}
    >
      <dt className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
        {label}
      </dt>
      <dd
        className={`text-sm text-black dark:text-white font-medium break-all ${
          mono ? 'font-mono text-neutral-600 dark:text-neutral-300 text-xs' : ''
        }`}
      >
        {value || '—'}
      </dd>
    </div>
  )
}

export default function MainAccount() {
  const router = useRouter()
  const { user, authLoaded, clearSession } = useSession()
  const [activeTab, setActiveTab] = useState<AccountTab>('profile')
  const [visitedTabs, setVisitedTabs] = useState<Set<AccountTab>>(() => new Set(['profile']))

  const loading = !authLoaded

  useEffect(() => {
    if (authLoaded && !user) {
      router.replace('/login')
    }
  }, [authLoaded, user, router])

  function handleSelectTab(tab: AccountTab) {
    setActiveTab(tab)
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev
      const next = new Set(prev)
      next.add(tab)
      return next
    })
  }

  async function handlerLogout() {
    try {
      await LogoutService()
      guestCartService.clearCart()
      clearSession()
    } catch (err) {
      console.error('Erro ao sair da conta:', err)
    } finally {
      router.push('/login')
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 font-sans text-black dark:text-white transition-colors">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-6 uppercase tracking-wider font-medium">
        <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
          Início
        </Link>
        <span>/</span>
        <span className="text-black dark:text-white font-bold">Minha Conta</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black dark:text-white">
            MINHA CONTA
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Gerencie seus dados pessoais, segurança e atendimento.
          </p>
        </div>
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-black dark:text-white underline underline-offset-4 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white rounded"
        >
          Ver Meus Pedidos <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start"
        >
          <span className="sr-only">Carregando informações da conta...</span>
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      )}

      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          <aside className="space-y-4">
            <div className="rounded-3xl bg-[#F2F0F1] dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 p-6 flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-display font-bold text-xl uppercase">
                {user.name ? user.name[0] : <User size={20} aria-hidden="true" />}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold uppercase tracking-tight truncate">
                  {user.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {user.email}
                </p>
                <span className="mt-1.5 inline-block rounded-full bg-black dark:bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white dark:text-black">
                  {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                </span>
              </div>
            </div>

            <nav aria-label="Seções da conta">
              <div role="tablist" aria-orientation="vertical" className="space-y-1.5">
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  const selected = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      id={`tab-${tab.id}`}
                      aria-selected={selected}
                      aria-controls={`panel-${tab.id}`}
                      onClick={() => handleSelectTab(tab.id)}
                      className={`flex h-11 w-full items-center gap-3 rounded-full px-5 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white cursor-pointer ${
                        selected
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'bg-[#F2F0F1]/70 dark:bg-[#1a1a1a] text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#242424]'
                      }`}
                    >
                      <Icon size={16} aria-hidden="true" /> {tab.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 space-y-1.5 border-t border-black/10 dark:border-white/10 pt-4">
                <Link
                  href="/pedidos"
                  className="flex h-11 w-full items-center gap-3 rounded-full px-5 text-xs font-semibold uppercase tracking-wider text-black dark:text-white transition-colors hover:bg-[#F2F0F1] dark:hover:bg-[#242424] focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white"
                >
                  <Package size={16} aria-hidden="true" /> Meus Pedidos
                </Link>
                <button
                  type="button"
                  onClick={handlerLogout}
                  className="flex h-11 w-full items-center gap-3 rounded-full px-5 text-xs font-semibold uppercase tracking-wider text-black dark:text-white transition-colors hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white cursor-pointer"
                >
                  <LogOut size={16} aria-hidden="true" /> Sair da Conta
                </button>
              </div>
            </nav>
          </aside>

          <div className="min-w-0">
            <div
              id="panel-profile"
              role="tabpanel"
              aria-labelledby="tab-profile"
              className={activeTab === 'profile' ? 'block space-y-6' : 'hidden'}
            >
              <section className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8">
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
                  Dados Pessoais
                </h2>
                <p className="mt-1 mb-6 text-sm text-neutral-600 dark:text-neutral-400">
                  Informações cadastradas na sua conta.
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="Nome Completo" value={user.name} />
                  <Field label="E-mail" value={user.email} />
                  <Field
                    label="Tipo de Conta"
                    value={user.role === 'admin' ? 'Administrador' : 'Cliente'}
                  />
                  <Field label="Membro desde" value={formatDate(user.created_at)} />
                  <Field label="ID da Conta" value={user.Id} mono wide />
                </dl>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/pedidos"
                  className="flex flex-col gap-2 rounded-3xl bg-[#F2F0F1] dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 p-5 transition-colors hover:bg-neutral-200 dark:hover:bg-[#242424] focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white"
                >
                  <Package size={20} aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider">Meus Pedidos</span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    Acompanhe suas compras.
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleSelectTab('security')}
                  className="flex flex-col items-start gap-2 rounded-3xl bg-[#F2F0F1] dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 p-5 text-left transition-colors hover:bg-neutral-200 dark:hover:bg-[#242424] focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white cursor-pointer"
                >
                  <ShieldCheck size={20} aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider">Redefinir Senha</span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    Altere sua senha com código.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('support')}
                  className="flex flex-col items-start gap-2 rounded-3xl bg-[#F2F0F1] dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 p-5 text-left transition-colors hover:bg-neutral-200 dark:hover:bg-[#242424] focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white cursor-pointer"
                >
                  <MessageCircle size={20} aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider">Atendimento</span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    Tire dúvidas sobre pedidos.
                  </span>
                </button>
              </div>
            </div>

            {visitedTabs.has('security') && (
              <div
                id="panel-security"
                role="tabpanel"
                aria-labelledby="tab-security"
                className={activeTab === 'security' ? 'block max-w-xl' : 'hidden'}
              >
                <SecurityPasswordReset email={user.email} />
              </div>
            )}

            {visitedTabs.has('support') && (
              <div
                id="panel-support"
                role="tabpanel"
                aria-labelledby="tab-support"
                className={activeTab === 'support' ? 'block' : 'hidden'}
              >
                <SupportChat />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
