/* The real API client.
 *
 * Same shape as api/mock.ts, so pages import from `../api` and never know which
 * one they got. Everything is same-origin under /api — in development Vite
 * proxies it to the back end, in production the two are served from one host —
 * so there is no base URL to configure and no CORS.
 */

import {
  ApiError,
  type ApiErrorCode,
  type Page,
  type Session,
  type Subscriber,
  type Video,
  type VideoWithCreator,
} from './types'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024
export const ACCEPTED_TYPES = ['video/mp4', 'video/webm']

/** Server error strings → the ApiErrorCode the Amharic strings are keyed on. */
const CODES: Record<string, ApiErrorCode> = {
  invalid_login: 'invalid_login',
  blocked: 'blocked',
  rate_limited: 'rate_limited',
  not_found: 'not_found',
  file_size: 'file_size',
  file_type: 'file_type',
  title_required: 'title_required',
  title_long: 'title_long',
  phone_taken: 'phone_taken',
  phone_format: 'phone_format',
  password_short: 'password_short',
}

function toApiError(status: number, body: unknown): ApiError {
  const code = (body as { error?: string } | null)?.error
  if (code && CODES[code]) return new ApiError(CODES[code])
  if (status === 401) return new ApiError('invalid_login')
  if (status === 404) return new ApiError('not_found')
  if (status === 429) return new ApiError('rate_limited')
  return new ApiError('network')
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: 'same-origin', // the session is an httpOnly cookie
      headers: init?.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    /* The network never reached the server — offline, DNS, connection refused. */
    throw new ApiError('network')
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) throw toApiError(res.status, body)
  return body as T
}

/** Ethiopian mobile format: 09XXXXXXXX or +2519XXXXXXXX. Normalises to the
 *  local 10-digit form. Mirrors the server's src/phone.js exactly — both sides
 *  must agree or the UNIQUE constraint stops meaning one line, one account. */
export function normalisePhone(input: string): string | null {
  const s = input.replace(/[\s-]/g, '')
  if (/^09\d{8}$/.test(s)) return s
  if (/^\+2519\d{8}$/.test(s)) return '0' + s.slice(4)
  if (/^2519\d{8}$/.test(s)) return '0' + s.slice(3)
  return null
}

export function maskPhone(phone: string): string {
  return `${phone.slice(0, 2)}****${phone.slice(-4)}`
}

/* ══ Auth ═══════════════════════════════════════════════════════════════ */

/** POST /api/auth/login */
export async function login(phone: string, password: string): Promise<Session> {
  const { subscriber } = await call<{ subscriber: Subscriber }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phone, password }),
  })
  /* The token itself lives in an httpOnly cookie the client cannot read; this
     field exists only to satisfy the Session shape. */
  return { token: 'cookie', subscriber }
}

/** GET /api/auth/me — null when there is no valid session. */
export async function currentSession(): Promise<Session | null> {
  try {
    const { subscriber } = await call<{ subscriber: Subscriber }>('/auth/me')
    return { token: 'cookie', subscriber }
  } catch {
    return null
  }
}

/** POST /api/auth/logout */
export async function logout(): Promise<void> {
  await call('/auth/logout', { method: 'POST' }).catch(() => {})
}

/* ══ Videos ═════════════════════════════════════════════════════════════ */

/** GET /api/videos?page=&page_size= */
export function listVideos(page = 1, pageSize = 9): Promise<Page<VideoWithCreator>> {
  return call<Page<VideoWithCreator>>(`/videos?page=${page}&page_size=${pageSize}`)
}

/** GET /api/videos/:id */
export function getVideo(id: number): Promise<VideoWithCreator> {
  return call<VideoWithCreator>(`/videos/${id}`)
}

/** POST /api/videos/:id/view — server-side increment; returns the new total. */
export async function recordView(id: number): Promise<number> {
  const { view_count } = await call<{ view_count: number }>(`/videos/${id}/view`, {
    method: 'POST',
  })
  return view_count
}

/** GET /api/subscribers/:id/videos */
export function listBySubscriber(subscriberId: number, limit = 4): Promise<VideoWithCreator[]> {
  return call<VideoWithCreator[]>(`/subscribers/${subscriberId}/videos?limit=${limit}`)
}

/** POST /api/videos (multipart).
 *
 *  XHR rather than fetch: fetch still cannot report upload progress, and the
 *  progress bar is not decoration here — uploads happen on a metered mobile
 *  connection and the subscriber needs to see it moving. */
export function uploadVideo(opts: {
  subscriberId: number
  title: string
  file: File
  onProgress?: (pct: number) => void
  signal?: AbortSignal
}): Promise<Video> {
  const title = opts.title.trim()
  if (!title) return Promise.reject(new ApiError('title_required'))
  if (title.length > 80) return Promise.reject(new ApiError('title_long'))
  if (!ACCEPTED_TYPES.includes(opts.file.type)) return Promise.reject(new ApiError('file_type'))
  if (opts.file.size > MAX_UPLOAD_BYTES) return Promise.reject(new ApiError('file_size'))

  return new Promise<Video>((resolve, reject) => {
    const form = new FormData()
    form.append('title', title)
    form.append('file', opts.file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}/videos`)
    xhr.withCredentials = true

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let body: unknown = null
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        /* a proxy error page, not JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        opts.onProgress?.(100)
        resolve(body as Video)
      } else {
        reject(toApiError(xhr.status, body))
      }
    }
    xhr.onerror = () => reject(new ApiError('network'))
    xhr.onabort = () => reject(new ApiError('network'))
    opts.signal?.addEventListener('abort', () => xhr.abort())

    xhr.send(form)
  })
}
