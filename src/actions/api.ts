const DEFAULT_REMOTE_API_URL = 'https://e-commerce-api-d5lu.onrender.com/api/v1'

function normalizeBaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, '')
}

function normalizeInternalUrl(rawUrl: string): string {
  const cleaned = normalizeBaseUrl(rawUrl)
  return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`
}

function isAbsoluteHttpUrl(rawUrl: string): boolean {
  return /^https?:\/\//i.test(rawUrl.trim())
}

export default function ApiUrlBase(): string {
  if (typeof window === 'undefined') {
    if (process.env.API_INTERNAL_URL?.trim()) {
      return normalizeInternalUrl(process.env.API_INTERNAL_URL)
    }
    if (process.env.NEXT_PUBLIC_API_URL?.trim() && isAbsoluteHttpUrl(process.env.NEXT_PUBLIC_API_URL)) {
      return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    }
    return DEFAULT_REMOTE_API_URL
  }

  if (process.env.NEXT_PUBLIC_API_URL?.trim()) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)
  }
  // Proxy same-origin via next.config.ts: evita bloqueio de cookies third-party no iOS/mobile e preflights CORS
  return '/api/v1'
}
