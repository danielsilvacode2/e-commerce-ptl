'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Pencil, X } from 'lucide-react'
import {
  ProfileValidationError,
  updateProfileNameUseCase,
  UpdateProfileNameUseCase,
} from '@/src/services/user'

export interface ProfileNameEditorProps {
  userId: string
  currentName: string
  email: string
  onNameUpdated: () => Promise<void> | void
  updateNameUC?: UpdateProfileNameUseCase
}

export default function ProfileNameEditor({
  userId,
  currentName,
  email,
  onNameUpdated,
  updateNameUC = updateProfileNameUseCase,
}: ProfileNameEditorProps) {
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleStartEdit() {
    setNameInput(currentName)
    setError('')
    setSuccess('')
    setEditing(true)
  }

  function handleCancel() {
    setNameInput(currentName)
    setError('')
    setEditing(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

    if (nameInput.trim() === currentName.trim()) {
      setEditing(false)
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateNameUC.execute({
        userId,
        name: nameInput,
        email,
      })
      await onNameUpdated()
      setEditing(false)
      setSuccess('Nome atualizado com sucesso!')
    } catch (err: unknown) {
      if (err instanceof ProfileValidationError) {
        setError(err.message)
      } else {
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'Não foi possível atualizar seu nome agora.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-1 border-b border-black/5 dark:border-white/10 pb-4">
      <div className="flex items-center justify-between gap-2">
        <dt className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
          Nome Completo
        </dt>
        {!editing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-black dark:text-white underline underline-offset-4 hover:opacity-75 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white rounded"
          >
            <Pencil size={11} aria-hidden="true" />
            Editar
          </button>
        )}
      </div>

      {!editing ? (
        <dd className="text-sm text-black dark:text-white font-medium break-words">
          {currentName || '—'}
        </dd>
      ) : (
        <dd className="mt-1">
          <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
            <label htmlFor="account-profile-name" className="sr-only">
              Nome Completo
            </label>
            <input
              id="account-profile-name"
              type="text"
              value={nameInput}
              maxLength={100}
              disabled={saving}
              autoFocus
              onChange={(e) => {
                setNameInput(e.target.value)
                if (error) setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && !saving) handleCancel()
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'account-profile-name-error' : undefined}
              placeholder="Seu nome completo"
              className={`h-10 w-full rounded-full border bg-white dark:bg-[#121212] px-4 text-sm text-black dark:text-white outline-none transition focus-visible:outline-2 focus-visible:outline-black dark:focus-visible:outline-white disabled:opacity-50 ${
                error
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-black/20 dark:border-white/25 focus:border-black dark:focus:border-white'
              }`}
            />

            {error && (
              <p
                id="account-profile-name-error"
                role="alert"
                className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black px-4 text-xs font-semibold uppercase tracking-wider hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
              >
                {saving && (
                  <Loader2
                    size={13}
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-black/15 dark:border-white/20 px-3.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#F2F0F1] dark:hover:bg-[#242424] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <X size={13} aria-hidden="true" />
                Cancelar
              </button>
            </div>
          </form>
        </dd>
      )}

      {success && !editing && (
        <p
          role="status"
          aria-live="polite"
          className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 size={13} className="shrink-0" aria-hidden="true" />
          <span>{success}</span>
        </p>
      )}
    </div>
  )
}
