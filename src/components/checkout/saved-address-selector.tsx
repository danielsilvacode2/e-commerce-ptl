'use client'

import { Check, MapPin, Plus } from 'lucide-react'
import { formatCepMask } from '@/src/lib/address-rules'
import { Address } from '@/src/types/address'

export interface SavedAddressSelectorProps {
  addresses: Address[]
  selectedAddressId: string
  onSelect: (addressId: string) => void
  onAddNew: () => void
  error?: string
  disabled?: boolean
}

export default function SavedAddressSelector({
  addresses,
  selectedAddressId,
  onSelect,
  onAddNew,
  error,
  disabled = false,
}: SavedAddressSelectorProps) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1">
        <MapPin size={14} aria-hidden="true" />
        Seus Endereços Salvos
      </legend>

      <div
        role="radiogroup"
        aria-label="Escolha um endereço de entrega salvo"
        className="space-y-2.5"
      >
        {addresses.map((addr) => {
          const id = addr.id ?? ''
          const isSelected = id !== '' && id === selectedAddressId
          const streetLine = [
            `${addr.street}, ${addr.number}`,
            addr.complement ? addr.complement : null,
          ]
            .filter(Boolean)
            .join(' — ')
          const cityLine = [
            addr.neighborhood || null,
            `${addr.city}/${addr.state}`,
            `CEP ${formatCepMask(addr.cep)}`,
          ]
            .filter(Boolean)
            .join(' · ')

          return (
            <label
              key={id}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors cursor-pointer ${
                isSelected
                  ? 'border-black dark:border-white bg-[#F2F0F1] dark:bg-[#222222]'
                  : 'border-black/15 dark:border-white/15 bg-white dark:bg-[#121212] hover:border-black/40 dark:hover:border-white/40'
              } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input
                type="radio"
                name="saved-address"
                value={id}
                checked={isSelected}
                onChange={() => onSelect(id)}
                disabled={disabled}
                className="sr-only"
              />

              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isSelected
                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                    : 'border-neutral-400 dark:border-neutral-600 bg-transparent text-transparent'
                }`}
              >
                <Check size={12} strokeWidth={3} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-black dark:text-white leading-snug">
                  {streetLine}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-600 dark:text-neutral-400">
                  {cityLine}
                </span>
              </span>
            </label>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="px-1 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onAddNew}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-black/25 dark:border-white/25 py-3 px-4 text-xs font-semibold uppercase tracking-wider text-black dark:text-white hover:bg-[#F2F0F1] dark:hover:bg-[#222222] transition-colors disabled:opacity-40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white"
      >
        <Plus size={14} aria-hidden="true" />
        Cadastrar novo endereço
      </button>
    </fieldset>
  )
}
