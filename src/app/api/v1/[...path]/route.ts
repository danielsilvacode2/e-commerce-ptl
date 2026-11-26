import { NextRequest } from 'next/server'

export const maxDuration = 60

const DEFAULT_UPSTREAM_ORIGIN = 'https://e-commerce-api-d5lu.onrender.com'

const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'authorization',
  'content-type',
  'cookie',
  'idempotency-key',
  'origin',
  'referer',
  'user-agent',
  'x-csrf-token',
  'x-forwarded-for',
  'x-requested-with',
] as const

const STRIPPED_RESPONSE_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'set-cookie',
  'transfer-encoding',
])

function resolveUpstreamApiBase(): string {
  const candidates = [
    process.env.API_INTERNAL_URL?.trim(),
    process.env.NEXT_PUBLIC_API_URL?.trim(),
  ]

  for (const candidate of candidates) {
    if (!candidate || !/^https?:\/\//i.test(candidate)) continue
    try {
      const parsed = new URL(candidate)
      return `${parsed.origin}/api/v1`
    } catch {
      // Ignora URL inválida e tenta o próximo fallback
    }
  }

  return `${DEFAULT_UPSTREAM_ORIGIN}/api/v1`
}

function adaptSetCookieForFrontend(rawCookie: string, isHttpLocal: boolean): string {
  // Remove atributo Domain para que o cookie fique vinculado ao domínio do front-end (first-party)
  let cookie = rawCookie.replace(/;\s*Domain=[^;]*/gi, '')

  // Em desenvolvimento local HTTP (ex.: http://192.168.x.x:3000 no celular), cookies Secure/SameSite=None são rejeitados
  if (isHttpLocal) {
    cookie = cookie
      .replace(/;\s*Secure\b/gi, '')
      .replace(/;\s*SameSite=None\b/gi, '; SameSite=Lax')
  }

  return cookie
}

function isBodylessStatus(status: number): boolean {
  return status === 204 || status === 205 || status === 304 || (status >= 100 && status < 200)
}

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path } = await context.params
  const cleanSegments = path.filter(Boolean).map((segment) => encodeURIComponent(segment))
  const upstreamBase = resolveUpstreamApiBase()
  const targetPath = cleanSegments.length > 0 ? `/${cleanSegments.join('/')}` : ''
  const targetUrl = `${upstreamBase}${targetPath}${req.nextUrl.search}`

  const upstreamHeaders = new Headers()
  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const value = req.headers.get(headerName)
    if (value) {
      upstreamHeaders.set(headerName, value)
    }
  }

  const method = req.method.toUpperCase()
  const hasBody = method !== 'GET' && method !== 'HEAD'
  const body = hasBody ? await req.arrayBuffer() : undefined

  try {
    const upstreamRes = await fetch(targetUrl, {
      method,
      headers: upstreamHeaders,
      body: hasBody && body && body.byteLength > 0 ? body : undefined,
      redirect: 'manual',
      cache: 'no-store',
    })

    const responseHeaders = new Headers()
    upstreamRes.headers.forEach((value, key) => {
      if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    })

    const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase()
    const isHttpLocal = forwardedProto
      ? forwardedProto === 'http'
      : req.nextUrl.protocol === 'http:'

    const setCookies =
      typeof upstreamRes.headers.getSetCookie === 'function'
        ? upstreamRes.headers.getSetCookie()
        : []

    for (const cookie of setCookies) {
      responseHeaders.append('set-cookie', adaptSetCookieForFrontend(cookie, isHttpLocal))
    }

    if (isBodylessStatus(upstreamRes.status)) {
      return new Response(null, {
        status: upstreamRes.status,
        headers: responseHeaders,
      })
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    })
  } catch (err: unknown) {
    console.error('[NERO Proxy] Falha ao encaminhar requisição para a API:', {
      method,
      targetUrl,
      error: err instanceof Error ? err.message : err,
    })

    return Response.json(
      {
        Response: {
          status: 502,
          mensagem: 'Falha de comunicação com o servidor da API.',
        },
      },
      { status: 502 }
    )
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
export const OPTIONS = proxyRequest
export const HEAD = proxyRequest
