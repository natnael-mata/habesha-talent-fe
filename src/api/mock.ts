/* The mock API.
 *
 * This is the seam. Every function here is shaped like the REST endpoint it
 * stands in for, listed above it, so swapping in the Express/MySQL backend
 * is a change to this file and nothing else — no page or component knows
 * where its data came from.
 *
 * Two rules are honoured even though this is a front end:
 *   1. No plaintext password is ever stored, not even in sessionStorage.
 *      Real bcrypt lives on the server; here it is salted SHA-256, which is
 *      not a substitute for bcrypt and is marked TODO accordingly.
 *   2. Login is rate-limited, because the shape of the failure (and its
 *      Amharic message) has to exist in the UI before the server enforces it.
 */

import { subscribers as seedSubs, videos as seedVideos } from './demoData'
import {
  ApiError,
  type Page,
  type Session,
  type Subscriber,
  type Video,
  type VideoWithCreator,
} from './types'

const LATENCY = [220, 520] as const
const STORE_KEY = 'habesha-talent/store/v1'
const SESSION_KEY = 'habesha-talent/session/v1'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60_000

interface Store {
  subscribers: (Subscriber & { password_hash: string })[]
  videos: Video[]
  nextSubscriberId: number
  nextVideoId: number
}

/* ── Persistence ────────────────────────────────────────────────────────
   sessionStorage, so a pitch demo survives navigation and a reload but
   resets cleanly between sessions. */

let store: Store | null = null

async function getStore(): Promise<Store> {
  if (store) return store
  const raw = sessionStorage.getItem(STORE_KEY)
  if (raw) {
    try {
      store = JSON.parse(raw) as Store
      return store
    } catch {
      /* corrupt store — reseed rather than fail the app */
    }
  }
  const hash = await hashPassword('talent123')
  store = {
    subscribers: seedSubs.map((s) => ({ ...s, password_hash: hash })),
    videos: [...seedVideos],
    nextSubscriberId: seedSubs.length + 1,
    nextVideoId: seedVideos.length + 1,
  }
  persist()
  return store
}

function persist() {
  if (store) sessionStorage.setItem(STORE_KEY, JSON.stringify(store))
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const latency = () => wait(LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0]))

/** TODO(v1-backend): replace with bcrypt (cost 12) on the server. Hashing
 *  here exists so no plaintext password is ever written to storage. */
async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(`habesha-talent:${pw}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Ethiopian mobile format: 09XXXXXXXX or +2519XXXXXXXX. Normalises to the
 *  local 10-digit form so the two spellings can never create two accounts. */
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

function join(v: Video, subs: Store['subscribers']): VideoWithCreator {
  const s = subs.find((x) => x.id === v.subscriber_id)
  return {
    ...v,
    creator: {
      id: s?.id ?? 0,
      display_name: s?.display_name ?? null,
      phone_masked: s ? maskPhone(s.phone_number) : '09****0000',
    },
  }
}

/* ── Login throttling ───────────────────────────────────────────────────── */

const attempts = new Map<string, { n: number; until: number }>()

function checkThrottle(phone: string) {
  const a = attempts.get(phone)
  if (a && a.until > Date.now()) throw new ApiError('rate_limited')
}
function noteFailure(phone: string) {
  const a = attempts.get(phone) ?? { n: 0, until: 0 }
  a.n += 1
  if (a.n >= MAX_ATTEMPTS) {
    a.until = Date.now() + LOCKOUT_MS
    a.n = 0
  }
  attempts.set(phone, a)
}

/* ══ Endpoints ══════════════════════════════════════════════════════════ */

/** POST /api/vas/subscribers — **the only way an account is ever created.**
 *
 *  This is an INBOUND endpoint. Ethio Telecom's VAS/SDP calls it after a
 *  subscriber has subscribed by SMS on their own line; it posts the phone
 *  number and the password it issued, and we insert the row. The app itself
 *  never creates accounts — see PRODUCT.md § Operating Context. An account we
 *  minted ourselves would not exist on the operator's side, so the subscriber
 *  would not be subscribed and could not be billed or reconciled.
 *
 *  It is here, in the front-end mock, only so the contract is written down in
 *  one place and the pitch can demonstrate the flow. Nothing in the UI calls
 *  it except the clearly-labelled demo simulation.
 *
 *  TODO(v1-backend) — the real implementation MUST:
 *    1. Authenticate the caller (shared secret or request signature) AND
 *       restrict by IP allowlist. Anyone who can reach this endpoint can mint
 *       subscriber accounts.
 *    2. Be idempotent on phone_number: the SDP will retry on timeout, and a
 *       retry must return 200 with the existing row, not 409 and not a
 *       duplicate.
 *    3. bcrypt the password on receipt (cost 12) and never log the payload —
 *       the plaintext exists only in transit and in the subscriber's SMS.
 *    4. Set created_on server-side (MySQL DEFAULT CURRENT_TIMESTAMP).
 */
export async function provisionSubscriber(payload: {
  phone_number: string
  password: string
  /** Reserved: the SDP's own subscription record id, for reconciliation. */
  vas_subscription_id?: string
}): Promise<{ subscriber: Subscriber; created: boolean }> {
  await latency()
  const phone = normalisePhone(payload.phone_number)
  if (!phone) throw new ApiError('phone_format')
  if (payload.password.length < 6) throw new ApiError('password_short')

  const s = await getStore()

  /* Idempotent by contract: a retried delivery updates the credential and
     reports created:false rather than failing. */
  const existing = s.subscribers.find((x) => x.phone_number === phone)
  if (existing) {
    existing.password_hash = await hashPassword(payload.password)
    existing.status = 'active'
    persist()
    const { password_hash: _drop, ...safe } = existing
    return { subscriber: safe as Subscriber, created: false }
  }

  const sub: Subscriber & { password_hash: string } = {
    id: s.nextSubscriberId++,
    phone_number: phone,
    display_name: null,
    status: 'active',
    /* PLAN.md § 6: created_on is set at insert time, by the store, never by
       the caller. On MySQL this is DEFAULT CURRENT_TIMESTAMP. */
    created_on: new Date().toISOString(),
    password_hash: await hashPassword(payload.password),
  }
  s.subscribers.push(sub)
  persist()
  const { password_hash: _drop, ...safe } = sub
  return { subscriber: safe as Subscriber, created: true }
}

/** POST /api/auth/login */
export async function login(phoneInput: string, password: string): Promise<Session> {
  await latency()
  const phone = normalisePhone(phoneInput)
  if (!phone) throw new ApiError('phone_format')

  checkThrottle(phone)
  const s = await getStore()
  const sub = s.subscribers.find((x) => x.phone_number === phone)
  const hash = await hashPassword(password)

  if (!sub || sub.password_hash !== hash) {
    noteFailure(phone)
    /* Deliberately identical for "no such number" and "wrong password" —
       the error must not tell an attacker which numbers are registered. */
    throw new ApiError('invalid_login')
  }
  if (sub.status === 'blocked') throw new ApiError('blocked')

  attempts.delete(phone)
  return openSession(sub)
}

function openSession(sub: Subscriber & { password_hash?: string }): Session {
  const { password_hash: _drop, ...safe } = sub
  const session: Session = {
    /* TODO(v1-backend): a real signed JWT from the server. */
    token: `demo.${safe.id}.${Date.now().toString(36)}`,
    subscriber: safe as Subscriber,
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

/** GET /api/auth/me — async to match the real client, so AuthContext does not
 *  need to know which implementation it is talking to. */
export async function currentSession(): Promise<Session | null> {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

/** POST /api/auth/logout */
export async function logout(): Promise<void> {
  sessionStorage.removeItem(SESSION_KEY)
}

/** GET /api/videos?page=&page_size= — approved only, newest first. */
export async function listVideos(page = 1, pageSize = 9): Promise<Page<VideoWithCreator>> {
  await latency()
  const s = await getStore()
  const all = s.videos
    .filter((v) => v.status === 'approved')
    .sort((a, b) => +new Date(b.posted_on) - +new Date(a.posted_on))
  const start = (page - 1) * pageSize
  const items = all.slice(start, start + pageSize).map((v) => join(v, s.subscribers))
  return {
    items,
    page,
    page_size: pageSize,
    total: all.length,
    has_more: start + pageSize < all.length,
  }
}

/** GET /api/videos/:id */
export async function getVideo(id: number): Promise<VideoWithCreator> {
  await latency()
  const s = await getStore()
  const v = s.videos.find((x) => x.id === id && x.status === 'approved')
  if (!v) throw new ApiError('not_found')
  return join(v, s.subscribers)
}

/** POST /api/videos/:id/view — the increment is server-side by design, so
 *  the count cannot be inflated from the client. Returns the new total. */
export async function recordView(id: number): Promise<number> {
  const s = await getStore()
  const v = s.videos.find((x) => x.id === id)
  if (!v) throw new ApiError('not_found')
  v.view_count += 1
  persist()
  /* TODO(P1): insert into video_views (video_id, subscriber_id, viewed_at)
     for unique-view analytics; v1 keeps the counter only. */
  return v.view_count
}

/** GET /api/subscribers/:id/videos */
export async function listBySubscriber(subscriberId: number, limit = 4): Promise<VideoWithCreator[]> {
  await latency()
  const s = await getStore()
  return s.videos
    .filter((v) => v.subscriber_id === subscriberId && v.status === 'approved')
    .sort((a, b) => +new Date(b.posted_on) - +new Date(a.posted_on))
    .slice(0, limit)
    .map((v) => join(v, s.subscribers))
}

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024
export const ACCEPTED_TYPES = ['video/mp4', 'video/webm']

/** POST /api/videos (multipart) — progress is reported the way XHR upload
 *  progress reports it, so the real implementation keeps this signature. */
export async function uploadVideo(opts: {
  subscriberId: number
  title: string
  file: File
  onProgress?: (pct: number) => void
  signal?: AbortSignal
}): Promise<Video> {
  const title = opts.title.trim()
  if (!title) throw new ApiError('title_required')
  if (title.length > 80) throw new ApiError('title_long')
  if (!ACCEPTED_TYPES.includes(opts.file.type)) throw new ApiError('file_type')
  if (opts.file.size > MAX_UPLOAD_BYTES) throw new ApiError('file_size')

  /* A believable transfer: fast at first, slower as the buffer fills. */
  for (let pct = 0; pct < 100; ) {
    if (opts.signal?.aborted) throw new ApiError('network')
    await wait(90)
    pct = Math.min(100, pct + (pct < 70 ? 7 + Math.random() * 9 : 2 + Math.random() * 4))
    opts.onProgress?.(Math.round(pct))
  }
  await wait(360)

  const s = await getStore()
  const video: Video = {
    id: s.nextVideoId++,
    subscriber_id: opts.subscriberId,
    title,
    /* Object URL stands in for the stored file; the real backend returns a
       storage path served by the streaming endpoint. */
    video_path: URL.createObjectURL(opts.file),
    thumbnail_path: null,
    view_count: 0,
    /* PLAN.md § 6: v1 defaults to approved; moderation arrives in P1. */
    status: 'approved',
    posted_on: new Date().toISOString(),
    category: 'song',
    duration_s: 0,
  }
  s.videos.push(video)
  /* An object URL cannot survive a reload, so this upload is kept in memory
     only — persisting it would produce a dead player after refresh. */
  return video
}
