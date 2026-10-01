// Response bodies are arbitrary JSON from Payload; tests probe their shape directly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any

export type ApiResponse<T = Json> = {
  status: number
  body: T
  text: string
  headers: Headers
}

type RequestOptions = {
  token?: string | null
  json?: unknown
  form?: FormData
  headers?: Record<string, string>
}

/** Thin REST client for Payload's `/api` routes. Auth is the `Authorization: JWT <token>` header. */
export class Api {
  constructor(readonly baseUrl: string) {}

  async request<T = Json>(method: string, path: string, opts: RequestOptions = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { ...(opts.headers ?? {}) }
    // Payload falls back to admin.autoLogin when no token is sent; it isn't configured here, but the
    // header makes "anonymous" explicit regardless.
    if (opts.token) headers.Authorization = `JWT ${opts.token}`
    else headers.DisableAutologin = 'true'
    let body: BodyInit | undefined
    if (opts.form) body = opts.form
    else if (opts.json !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(opts.json)
    }
    const res = await fetch(this.baseUrl + path, { method, headers, body, signal: AbortSignal.timeout(180_000) })
    const text = await res.text()
    let parsed: Json = undefined
    try {
      parsed = text ? JSON.parse(text) : undefined
    } catch {
      parsed = undefined
    }
    return { status: res.status, body: parsed as T, text, headers: res.headers }
  }

  get<T = Json>(path: string, token?: string | null) {
    return this.request<T>('GET', path, { token })
  }
  post<T = Json>(path: string, json: unknown, token?: string | null) {
    return this.request<T>('POST', path, { token, json })
  }
  patch<T = Json>(path: string, json: unknown, token?: string | null) {
    return this.request<T>('PATCH', path, { token, json })
  }
  delete<T = Json>(path: string, token?: string | null) {
    return this.request<T>('DELETE', path, { token })
  }

  async login(email: string, password: string): Promise<string> {
    const res = await this.post('/api/users/login', { email, password })
    if (res.status !== 200 || !res.body?.token) throw new Error(`login ${email} failed: ${res.status} ${res.text.slice(0, 300)}`)
    return res.body.token
  }
}

/** Build a query string in Payload's bracket syntax, e.g. { where: { slug: { equals: 'x' } } }. */
export function qs(obj: Record<string, unknown>, prefix = ''): string {
  const parts: string[] = []
  const walk = (value: unknown, key: string) => {
    if (value !== null && typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) walk(v, key ? `${key}[${k}]` : k)
    } else if (value !== undefined) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    }
  }
  walk(obj, prefix)
  return parts.join('&')
}
