const CACHE_PREFIX = 'nero_cache_v1:'

export interface CachedEntry<T> {
  data: T
  savedAt: number
}

// Fallback em memória para ambientes sem localStorage ou quota excedida
const memoryStore = new Map<string, CachedEntry<unknown>>()

function getStorageKey(key: string): string {
  return `${CACHE_PREFIX}${key}`
}

export const clientCache = {
  set<T>(key: string, data: T): CachedEntry<T> {
    const entry: CachedEntry<T> = {
      data,
      savedAt: Date.now(),
    }

    memoryStore.set(key, entry)

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(getStorageKey(key), JSON.stringify(entry))
      } catch {
        // Falha silenciosa em caso de navegação privada ou limite de armazenamento
      }
    }

    return entry
  },

  get<T>(key: string, maxAgeMs?: number): CachedEntry<T> | null {
    const now = Date.now()

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(getStorageKey(key))
        if (raw) {
          const parsed = JSON.parse(raw) as CachedEntry<T>
          if (parsed && typeof parsed.savedAt === 'number' && 'data' in parsed) {
            if (!maxAgeMs || now - parsed.savedAt <= maxAgeMs) {
              memoryStore.set(key, parsed)
              return parsed
            }
          }
        }
      } catch {
        // Ignora JSON inválido e tenta fallback em memória
      }
    }

    const mem = memoryStore.get(key) as CachedEntry<T> | undefined
    if (mem && (!maxAgeMs || now - mem.savedAt <= maxAgeMs)) {
      return mem
    }

    return null
  },

  remove(key: string): void {
    memoryStore.delete(key)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(getStorageKey(key))
      } catch {
        // Ignora erro
      }
    }
  },
}

/**
 * Formata o horário de salvamento do cache em texto curto para o usuário.
 */
export function formatCachedTime(savedAt: number | null): string | null {
  if (!savedAt) return null
  const date = new Date(savedAt)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
