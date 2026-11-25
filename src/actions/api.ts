function normalizeBaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, '')
}

function normalizeInternalUrl(rawUrl: string): string {
  const cleaned = normalizeBaseUrl(rawUrl)
  return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`
}

export default function ApiUrlBase(): string {
  if (typeof window === 'undefined') {
    if (process.env.API_INTERNAL_URL?.trim()) {
      return normalizeInternalUrl(process.env.API_INTERNAL_URL)
    }
    if (process.env.NEXT_PUBLIC_API_URL?.trim()) {
      return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    }
    return 'https://url-da-sua-api-no-render.onrender.com/api/v1'
  }

  if (process.env.NEXT_PUBLIC_API_URL?.trim()) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)
  }
  return 'https://url-da-sua-api-no-render.onrender.com/api/v1'
}
