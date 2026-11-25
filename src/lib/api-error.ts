export type ApiErrorKind =
  | 'offline'
  | 'timeout'
  | 'server'
  | 'not-found'
  | 'unauthorized'
  | 'client'
  | 'generic'

export type ErrorStateVariant = 'api-down' | 'offline' | 'not-found' | 'generic'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly causeError?: unknown

  constructor(
    kind: ApiErrorKind,
    message: string,
    options?: { status?: number; causeError?: unknown }
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = options?.status
    this.causeError = options?.causeError
  }
}

export const DEFAULT_FETCH_TIMEOUT_MS = 10_000

/**
 * Executa fetch com timeout controlado e classificação de erros de rede/HTTP.
 */
export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS
): Promise<Response> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError('offline', 'Sem conexão com a internet.')
  }

  const controller = new AbortController()
  const externalSignal = init.signal
  let timedOut = false

  const onExternalAbort = () => {
    controller.abort(externalSignal?.reason)
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason)
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true })
    }
  }

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } catch (err: unknown) {
    if (timedOut) {
      throw new ApiError('timeout', 'Tempo limite excedido ao comunicar com o servidor.', {
        causeError: err,
      })
    }

    // Aborto disparado pelo chamador (ex.: troca de busca / unmount) é repassado como está
    if (externalSignal?.aborted) {
      throw err
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new ApiError('offline', 'Sem conexão com a internet.', { causeError: err })
    }

    throw new ApiError('server', 'Falha de conexão com a API.', { causeError: err })
  } finally {
    clearTimeout(timer)
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort)
    }
  }
}

/**
 * Converte um Response não-OK em ApiError tipado sem vazar mensagens internas para a UI.
 */
export function createHttpApiError(status: number, context: string): ApiError {
  if (status === 401) {
    // Mantém a mensagem '401' para compatibilidade com os redirecionamentos existentes
    return new ApiError('unauthorized', '401', { status })
  }

  if (status === 404) {
    return new ApiError('not-found', `${context}: recurso não encontrado (${status})`, {
      status,
    })
  }

  if (status >= 500 || status === 408 || status === 429) {
    return new ApiError('server', `${context}: servidor indisponível (${status})`, {
      status,
    })
  }

  return new ApiError('client', `${context}: requisição inválida (${status})`, {
    status,
  })
}

/**
 * Classifica qualquer erro desconhecido para a variante visual apropriada.
 */
export function classifyErrorVariant(error: unknown): ErrorStateVariant {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'offline'
  }

  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'offline':
        return 'offline'
      case 'timeout':
      case 'server':
        return 'api-down'
      case 'not-found':
        return 'not-found'
      default:
        return 'generic'
    }
  }

  if (error instanceof TypeError) {
    return 'api-down'
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return 'api-down'
    }
    const lower = error.message.toLowerCase()
    if (
      lower.includes('failed to fetch') ||
      lower.includes('network') ||
      lower.includes('load failed') ||
      lower.includes('timeout') ||
      /\b5\d{2}\b/.test(lower)
    ) {
      return 'api-down'
    }
    if (lower.includes('404') || lower.includes('não encontrado')) {
      return 'not-found'
    }
  }

  return 'generic'
}

/**
 * Registra o erro técnico apenas no console/monitoramento, preservando a UI limpa.
 */
export function logClientError(context: string, error: unknown, extra?: Record<string, unknown>): void {
  const payload = {
    context,
    timestamp: new Date().toISOString(),
    ...(extra ?? {}),
    error:
      error instanceof ApiError
        ? { name: error.name, kind: error.kind, status: error.status, message: error.message, cause: error.causeError }
        : error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error,
  }

  console.error(`[NERO Error][${context}]`, payload)
}
