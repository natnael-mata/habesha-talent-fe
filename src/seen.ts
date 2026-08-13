/* Which videos this browser has already played.
 *
 * DESIGN.md § Ink states: a card that has been watched drops its colour
 * entirely. That is a per-viewer fact, so it lives on the client — unlike
 * the view count, which is incremented server-side and can never be
 * inflated from here. */

const KEY = 'habesha-talent/seen/v1'

export function seenIds(): Set<number> {
  try {
    const raw = sessionStorage.getItem(KEY)
    return new Set<number>(raw ? (JSON.parse(raw) as number[]) : [])
  } catch {
    return new Set()
  }
}

export function markSeen(id: number) {
  const s = seenIds()
  s.add(id)
  sessionStorage.setItem(KEY, JSON.stringify([...s]))
}
