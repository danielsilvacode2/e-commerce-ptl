'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, MapPin, RefreshCw } from 'lucide-react'
import {
  BRAZILIAN_UFS,
  formatCepMask,
  isCompleteCep,
  stripCepDigits,
} from '@/src/lib/address-rules'
import {
  Address,
  AddressFieldErrors,
  AddressFieldName,
  AddressLookupError,
} from '@/src/types/address'
import {
  lookupAddressByCepUseCase,
  LookupAddressByCepUseCase,
} from '@/src/services/address'

export interface AddressFormProps {
  value: Address
  onChange: (next: Address) => void
  fieldErrors?: AddressFieldErrors
  onClearFieldError?: (field: AddressFieldName) => void
  disabled?: boolean
  lookupUseCase?: LookupAddressByCepUseCase
  debounceMs?: number
}

type LookupStatus = 'idle' | 'loading' | 'success' | 'not-found' | 'unavailable' | 'error'

export default function AddressForm({
  value,
  onChange,
  fieldErrors = {},
  onClearFieldError,
  disabled = false,
  lookupUseCase = lookupAddressByCepUseCase,
  debounceMs = 350,
}: AddressFormProps) {
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [lookupMessage, setLookupMessage] = useState('')

  const numberInputRef = useRef<HTMLInputElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFetchedCepRef = useRef<string>('')
  const latestValueRef = useRef<Address>(value)

  useEffect(() => {
    latestValueRef.current = value
  }, [value])

  const cancelPendingLookup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      cancelPendingLookup()
    }
  }, [cancelPendingLookup])

  const executeLookup = useCallback(
    async (cepDigits: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      lastFetchedCepRef.current = cepDigits
      setLookupStatus('loading')
      setLookupMessage('Buscando endereço pelo CEP...')

      try {
        const result = await lookupUseCase.execute(cepDigits, controller.signal)
        if (controller.signal.aborted) return

        const current = latestValueRef.current
        onChange({
          ...current,
          cep: formatCepMask(result.cep || cepDigits),
          street: result.street || '',
          neighborhood: result.neighborhood || '',
          city: result.city || '',
          state: result.state || '',
        })

        onClearFieldError?.('cep')
        if (result.street) onClearFieldError?.('street')
        if (result.city) onClearFieldError?.('city')
        if (result.state) onClearFieldError?.('state')

        setLookupStatus('success')
        setLookupMessage(
          result.street
            ? 'Endereço preenchido automaticamente. Confira os dados e informe o número.'
            : 'Cidade e estado preenchidos pelo CEP. Informe a rua e o número.'
        )

        // Move o foco para o campo número após o preenchimento automático
        numberInputRef.current?.focus()
      } catch (err: unknown) {
        if (controller.signal.aborted) return

        if (err instanceof AddressLookupError) {
          if (err.kind === 'not-found') {
            setLookupStatus('not-found')
            setLookupMessage(err.message)
            return
          }
          if (err.kind === 'unavailable') {
            setLookupStatus('unavailable')
            setLookupMessage(err.message)
            return
          }
          setLookupStatus('error')
          setLookupMessage(err.message)
          return
        }

        setLookupStatus('unavailable')
        setLookupMessage(
          'Não foi possível consultar o CEP no momento. Você pode preencher o endereço manualmente.'
        )
      }
    },
    [lookupUseCase, onChange, onClearFieldError]
  )

  function handleFieldChange(field: AddressFieldName, nextValue: string) {
    onClearFieldError?.(field)
    onChange({
      ...value,
      [field]: nextValue,
    })
  }

  function handleCepChange(rawValue: string) {
    const masked = formatCepMask(rawValue)
    const digits = stripCepDigits(masked)

    onClearFieldError?.('cep')
    onChange({
      ...value,
      cep: masked,
    })

    cancelPendingLookup()

    if (!isCompleteCep(digits)) {
      lastFetchedCepRef.current = ''
      setLookupStatus('idle')
      setLookupMessage('')
      return
    }

    if (digits === lastFetchedCepRef.current) {
      return
    }

    if (debounceMs <= 0) {
      void executeLookup(digits)
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      void executeLookup(digits)
    }, debounceMs)
  }

  function handleRetryLookup() {
    const digits = stripCepDigits(value.cep)
    if (!isCompleteCep(digits)) return
    lastFetchedCepRef.current = ''
    void executeLookup(digits)
  }

  const inputBaseClass =
    'h-11 w-full rounded-2xl border bg-white dark:bg-[#121212] px-4 text-sm outline-none placeholder:text-neutral-400 transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-black dark:focus-visible:outline-white'

  function getBorderClass(field: AddressFieldName) {
    return fieldErrors[field]
      ? 'border-red-500 dark:border-red-400 focus:border-red-600 dark:focus:border-red-400'
      : 'border-black/15 dark:border-white/20 focus:border-black dark:focus:border-white'
  }

  return (
    <fieldset className="space-y-3.5" disabled={disabled}>
      <legend className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1">
        <MapPin size={14} aria-hidden="true" />
        Endereço de Entrega
      </legend>

      {/* CEP */}
      <div>
        <label
          htmlFor="address-cep"
          className="block text-xs uppercase tracking-wider font-bold mb-1.5"
        >
          CEP *
        </label>
        <div className="relative">
          <input
            id="address-cep"
            name="cep"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            maxLength={9}
            value={value.cep}
            onChange={(e) => handleCepChange(e.target.value)}
            aria-invalid={Boolean(fieldErrors.cep)}
            aria-describedby={fieldErrors.cep ? 'address-cep-error' : 'address-cep-hint'}
            required
            className={`${inputBaseClass} ${getBorderClass('cep')} font-mono tracking-wider pr-10`}
          />
          {lookupStatus === 'loading' && (
            <span
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
              aria-hidden="true"
            >
              <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
            </span>
          )}
        </div>

        {fieldErrors.cep ? (
          <p
            id="address-cep-error"
            role="alert"
            className="mt-1 px-1 text-xs font-medium text-red-600 dark:text-red-400"
          >
            {fieldErrors.cep}
          </p>
        ) : (
          <p id="address-cep-hint" className="mt-1 px-1 text-[11px] text-neutral-500">
            Digite os 8 dígitos do CEP para preencher automaticamente.
          </p>
        )}

        {/* Feedback da consulta de CEP */}
        {lookupStatus === 'loading' && (
          <div
            role="status"
            aria-live="polite"
            className="mt-2 flex items-center gap-2 rounded-2xl bg-[#F2F0F1] dark:bg-[#222222] px-3.5 py-2.5 text-xs text-neutral-700 dark:text-neutral-300"
          >
            <Loader2 size={14} className="animate-spin shrink-0 motion-reduce:animate-none" aria-hidden="true" />
            <span>{lookupMessage}</span>
          </div>
        )}

        {lookupStatus === 'success' && lookupMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mt-2 flex items-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300"
          >
            <CheckCircle2 size={14} className="shrink-0" aria-hidden="true" />
            <span>{lookupMessage}</span>
          </div>
        )}

        {(lookupStatus === 'not-found' || lookupStatus === 'unavailable' || lookupStatus === 'error') &&
          lookupMessage && (
            <div
              role="alert"
              className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200"
            >
              <span className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
                <span>{lookupMessage}</span>
              </span>
              {lookupStatus === 'unavailable' && (
                <button
                  type="button"
                  onClick={handleRetryLookup}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-700/30 dark:border-amber-400/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                >
                  <RefreshCw size={11} aria-hidden="true" />
                  Tentar novamente
                </button>
              )}
            </div>
          )}
      </div>

      {/* Rua e Número */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8">
          <label
            htmlFor="address-street"
            className="block text-xs uppercase tracking-wider font-bold mb-1.5"
          >
            Rua / Logradouro *
          </label>
          <input
            id="address-street"
            name="street"
            type="text"
            autoComplete="street-address"
            placeholder="Ex.: Praça da Sé"
            maxLength={200}
            value={value.street}
            onChange={(e) => handleFieldChange('street', e.target.value)}
            aria-invalid={Boolean(fieldErrors.street)}
            aria-describedby={fieldErrors.street ? 'address-street-error' : undefined}
            required
            className={`${inputBaseClass} ${getBorderClass('street')}`}
          />
          {fieldErrors.street && (
            <p
              id="address-street-error"
              role="alert"
              className="mt-1 px-1 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {fieldErrors.street}
            </p>
          )}
        </div>

        <div className="sm:col-span-4">
          <label
            htmlFor="address-number"
            className="block text-xs uppercase tracking-wider font-bold mb-1.5"
          >
            Número *
          </label>
          <input
            ref={numberInputRef}
            id="address-number"
            name="number"
            type="text"
            placeholder="Ex.: 123A ou S/N"
            maxLength={30}
            value={value.number}
            onChange={(e) => handleFieldChange('number', e.target.value)}
            aria-invalid={Boolean(fieldErrors.number)}
            aria-describedby={fieldErrors.number ? 'address-number-error' : undefined}
            required
            className={`${inputBaseClass} ${getBorderClass('number')}`}
          />
          {fieldErrors.number && (
            <p
              id="address-number-error"
              role="alert"
              className="mt-1 px-1 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {fieldErrors.number}
            </p>
          )}
        </div>
      </div>

      {/* Bairro e Complemento (opcionais) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="address-neighborhood"
            className="block text-xs uppercase tracking-wider font-bold mb-1.5"
          >
            Bairro <span className="font-normal text-neutral-500 lowercase">(opcional)</span>
          </label>
          <input
            id="address-neighborhood"
            name="neighborhood"
            type="text"
            placeholder="Ex.: Centro"
            maxLength={120}
            value={value.neighborhood ?? ''}
            onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
            aria-invalid={Boolean(fieldErrors.neighborhood)}
            aria-describedby={fieldErrors.neighborhood ? 'address-neighborhood-error' : undefined}
            className={`${inputBaseClass} ${getBorderClass('neighborhood')}`}
          />
          {fieldErrors.neighborhood && (
            <p
              id="address-neighborhood-error"
              role="alert"
              className="mt-1 px-1 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {fieldErrors.neighborhood}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="address-complement"
            className="block text-xs uppercase tracking-wider font-bold mb-1.5"
          >
            Complemento <span className="font-normal text-neutral-500 lowercase">(opcional)</span>
          </label>
          <input
            id="address-complement"
            name="complement"
            type="text"
            placeholder="Ex.: Apto 42, Bloco B"
            maxLength={120}
            value={value.complement ?? ''}
            onChange={(e) => handleFieldChange('complement', e.target.value)}
            aria-invalid={Boolean(fieldErrors.complement)}
            aria-describedby={fieldErrors.complement ? 'address-complement-error' : undefined}
            className={`${inputBaseClass} ${getBorderClass('complement')}`}
          />
          {fieldErrors.complement && (
            <p
              id="address-complement-error"
              role="alert"
              className="mt-1 px-1 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {fieldErrors.complement}
            </p>
          )}
        </div>
      </div>

      {/* Cidade e Estado (UF) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8">
          <label
            htmlFor="address-city"
            className="block text-xs uppercase tracking-wider font-bold mb-1.5"
          >
            Cidade *
          </label>
          <input
            id="address-city"
            name="city"
            type="text"
            autoComplete="address-level2"
            placeholder="Ex.: São Paulo"
            maxLength={120}
            value={value.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            aria-invalid={Boolean(fieldErrors.city)}
            aria-describedby={fieldErrors.city ? 'address-city-error' : undefined}
            required
            className={`${inputBaseClass} ${getBorderClass('city')}`}
          />
          {fieldErrors.city && (
            <p
              id="address-city-error"
              role="alert"
              className="mt-1 px-1 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {fieldErrors.city}
            </p>
          )}
        </div>

        <div className="sm:col-span-4">
          <label
            htmlFor="address-state"
            className="block text-xs uppercase tracking-wider font-bold mb-1.5"
          >
            Estado (UF) *
          </label>
          <select
            id="address-state"
            name="state"
            autoComplete="address-level1"
            value={value.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            aria-invalid={Boolean(fieldErrors.state)}
            aria-describedby={fieldErrors.state ? 'address-state-error' : undefined}
            required
            className={`${inputBaseClass} ${getBorderClass('state')} font-semibold`}
          >
            <option value="">UF</option>
            {BRAZILIAN_UFS.map((uf) => (
              <option key={uf.code} value={uf.code}>
                {uf.code} — {uf.name}
              </option>
            ))}
          </select>
          {fieldErrors.state && (
            <p
              id="address-state-error"
              role="alert"
              className="mt-1 px-1 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {fieldErrors.state}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  )
}
