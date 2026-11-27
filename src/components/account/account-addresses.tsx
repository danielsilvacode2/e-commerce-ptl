'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, MapPin, Plus, RefreshCw, X } from 'lucide-react'
import AddressForm from '@/src/components/checkout/address-form'
import { formatCepMask } from '@/src/lib/address-rules'
import {
  createAddressUseCase,
  CreateAddressUseCase,
  listMyAddressesUseCase,
  ListMyAddressesUseCase,
  LookupAddressByCepUseCase,
} from '@/src/services/address'
import {
  Address,
  AddressFieldErrors,
  AddressFieldName,
  OrderValidationError,
} from '@/src/types/address'

const EMPTY_ADDRESS: Address = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
}

export interface AccountAddressesProps {
  listAddressesUC?: ListMyAddressesUseCase
  createAddressUC?: CreateAddressUseCase
  lookupUseCase?: LookupAddressByCepUseCase
}

export default function AccountAddresses({
  listAddressesUC = listMyAddressesUseCase,
  createAddressUC = createAddressUseCase,
  lookupUseCase,
}: AccountAddressesProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [formAddress, setFormAddress] = useState<Address>(EMPTY_ADDRESS)
  const [fieldErrors, setFieldErrors] = useState<AddressFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    listAddressesUC
      .execute(controller.signal)
      .then((list) => {
        if (!active) return
        setAddresses(list)
        setLoadError('')
      })
      .catch(() => {
        if (!active) return
        setLoadError('Não foi possível carregar seus endereços salvos agora.')
      })
      .finally(() => {
        if (active) setLoaded(true)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [listAddressesUC, reloadKey])

  const handleRetry = useCallback(() => {
    setLoaded(false)
    setLoadError('')
    setReloadKey((k) => k + 1)
  }, [])

  function handleOpenForm() {
    setFormAddress(EMPTY_ADDRESS)
    setFieldErrors({})
    setSubmitError('')
    setSuccessMessage('')
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setFieldErrors({})
    setSubmitError('')
  }

  function handleClearFieldError(field: AddressFieldName) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleCreateAddress(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setSubmitError('')
    setFieldErrors({})
    setSuccessMessage('')

    try {
      const created = await createAddressUC.execute(formAddress)
      setAddresses((prev) => {
        const filtered = prev.filter((item) => item.id !== created.id)
        return [created, ...filtered]
      })
      setFormAddress(EMPTY_ADDRESS)
      setShowForm(false)
      setSuccessMessage(
        created.address_validation_warning
          ? `Endereço cadastrado com sucesso! (${created.address_validation_warning})`
          : 'Endereço cadastrado com sucesso!'
      )
    } catch (err: unknown) {
      if (err instanceof OrderValidationError) {
        setFieldErrors(err.fieldErrors)
        setSubmitError(err.message)
      } else {
        setSubmitError(
          err instanceof Error && err.message
            ? err.message
            : 'Não foi possível salvar o endereço. Tente novamente.'
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      aria-label="Endereços salvos da conta"
      className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
            Meus Endereços
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Cadastre e consulte seus endereços de entrega para finalizar pedidos mais rápido.
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={handleOpenForm}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black px-5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white"
          >
            <Plus size={14} aria-hidden="true" />
            Novo Endereço
          </button>
        )}
      </div>

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-300"
        >
          <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Formulário inline para cadastrar novo endereço */}
      {showForm && (
        <form
          onSubmit={handleCreateAddress}
          noValidate
          className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F2F0F1]/70 dark:bg-[#1f1f1f] p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold uppercase tracking-tight">
              Cadastrar Novo Endereço
            </h3>
            <button
              type="button"
              onClick={handleCloseForm}
              disabled={submitting}
              aria-label="Fechar formulário de novo endereço"
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <AddressForm
            value={formAddress}
            onChange={setFormAddress}
            fieldErrors={fieldErrors}
            onClearFieldError={handleClearFieldError}
            disabled={submitting}
            lookupUseCase={lookupUseCase}
          />

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-medium text-red-700 dark:text-red-300"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={handleCloseForm}
              disabled={submitting}
              className="h-10 px-5 rounded-full border border-black/15 dark:border-white/20 bg-white dark:bg-[#121212] text-xs font-semibold uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-[#252525] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-6 text-xs font-semibold uppercase tracking-wider hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
            >
              {submitting && (
                <Loader2
                  size={14}
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              {submitting ? 'Salvando...' : 'Salvar Endereço'}
            </button>
          </div>
        </form>
      )}

      {/* Listagem dos endereços cadastrados */}
      {!loaded && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2.5 py-10 text-xs font-medium text-neutral-500"
        >
          <Loader2
            size={18}
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span>Carregando seus endereços...</span>
        </div>
      )}

      {loaded && loadError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-xs font-medium text-red-700 dark:text-red-300"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
            {loadError}
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-300 dark:border-red-800 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      )}

      {loaded && !loadError && addresses.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-[#F2F0F1]/60 dark:bg-[#1f1f1f] p-8 text-center">
          <MapPin size={28} className="mx-auto text-neutral-400 mb-3" aria-hidden="true" />
          <h3 className="font-display text-base font-bold uppercase tracking-tight">
            Nenhum endereço cadastrado ainda
          </h3>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Cadastre um ou mais endereços para selecioná-los rapidamente no checkout.
          </p>
          <button
            type="button"
            onClick={handleOpenForm}
            className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black px-6 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus size={14} aria-hidden="true" />
            Cadastrar primeiro endereço
          </button>
        </div>
      )}

      {loaded && !loadError && addresses.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr, idx) => (
            <li
              key={addr.id}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F2F0F1]/60 dark:bg-[#1f1f1f] p-5 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    <MapPin size={12} aria-hidden="true" />
                    Endereço {idx + 1}
                  </span>
                  {idx === 0 && (
                    <span className="rounded-full bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Mais recente
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-black dark:text-white leading-snug">
                  {addr.street}, {addr.number}
                  {addr.complement ? ` — ${addr.complement}` : ''}
                </p>

                {addr.neighborhood && (
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    Bairro: {addr.neighborhood}
                  </p>
                )}

                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {addr.city}/{addr.state}
                </p>
              </div>

              <div className="pt-2.5 border-t border-black/10 dark:border-white/10 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                CEP: {formatCepMask(addr.cep)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
