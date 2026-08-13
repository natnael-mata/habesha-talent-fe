/* Every visible word in this product comes from here.
 *
 * PLAN.md § 5: no hard-coded UI strings in components. `t()` is the only way
 * text reaches the screen, so adding English later is a second JSON file and
 * a locale switch — not a sweep through the component tree.
 *
 * Amharic copy is authored here and flagged for Bereket's wording review.
 */

import am from '../locales/am.json'

type Dict = Record<string, string>
const dict: Dict = am as Dict

export type StringKey = keyof typeof am

export function t(key: StringKey | string, vars?: Record<string, string | number>): string {
  const raw = dict[key as string]
  if (raw === undefined) {
    /* Loud in development, harmless in production: a missing key must never
       render an English identifier into an Amharic-only interface. */
    if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`)
    return ''
  }
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

/* ── Numbers ────────────────────────────────────────────────────────────
   Ethiopian digital usage is Arabic numerals, not Ethiopic numerals, so
   view counts and dates use them — but grouping follows am-ET. */

export function num(n: number): string {
  return new Intl.NumberFormat('am-ET').format(n)
}

/* ── Dates ──────────────────────────────────────────────────────────────
   Recent posts read better relative ("ከ3 ቀን በፊት"); anything older gets an
   absolute Amharic date. Intl carries the Amharic month names, with a
   hand-written fallback for engines that lack the am-ET data. */

const AM_MONTHS = [
  'ጃንዋሪ',
  'ፌብሩዋሪ',
  'ማርች',
  'ኤፕሪል',
  'ሜይ',
  'ጁን',
  'ጁላይ',
  'ኦገስት',
  'ሴፕቴምበር',
  'ኦክቶበር',
  'ኖቬምበር',
  'ዲሴምበር',
]

export function absoluteDate(iso: string): string {
  const d = new Date(iso)
  try {
    const s = new Intl.DateTimeFormat('am-ET', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d)
    /* Guard against an engine that silently falls back to English. */
    if (!/[a-zA-Z]/.test(s)) return s
  } catch {
    /* fall through to the table */
  }
  return `${AM_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function relativeDate(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (days <= 0) return t('today')
  if (days === 1) return t('yesterday')
  if (days < 7) return t('days_ago', { n: days })
  if (days < 30) return t('weeks_ago', { n: Math.floor(days / 7) })
  if (days < 365) return t('months_ago', { n: Math.floor(days / 30) })
  return absoluteDate(iso)
}

export function duration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
