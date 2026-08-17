/* The Amharic-only guarantee, machine-checked.
 *
 * PLAN.md § 9 has two acceptance criteria that are miserable to verify by
 * eye and trivial to verify mechanically:
 *   "Every visible UI string is Amharic; no English leaks"
 *   "no hard-coded UI strings in components"
 * A human reviewing 90 strings will miss one. This will not.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import am from '../locales/am.json'

const dict = am as Record<string, string>

/* Latin that is allowed inside a user-facing Amharic string, because none of
   it is an English word: file format names and the phone-number input mask.
   Interpolation placeholders are stripped too — {n} is markup, not copy. */
const ALLOWED_LATIN = [
  'MP4', // file format, written the same way in Amharic copy
  'WebM', // file format
  'XXXXXXXX', // the 09XXXXXXXX input mask
  /* The SMS keyword the customer types. It is a literal a subscriber must
     send verbatim to 6431 — transliterating it into Ethiopic would produce a
     message the operator's shortcode does not recognise. */
  'OK',
]

/* The SMS keyword and shortcode are configuration, not copy — they live in
   src/config.ts with their TODO markers, not in the locale file. */

/** Strings that legitimately carry no Ethiopic at all. */
const NON_ETHIOPIC_KEYS = new Set([
  'phone_placeholder', // an input mask: 09XXXXXXXX
])

function stripAllowed(s: string) {
  let out = s.replace(/\{\w+\}/g, '')
  for (const a of ALLOWED_LATIN) out = out.split(a).join('')
  return out
}

function walk(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(p)) out.push(p)
  }
  return out
}

/** Comments may be written in Amharic; only code is checked. */
function stripComments(src: string) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/\/\/.*$/gm, '')
}

const SRC = path.resolve(__dirname, '../src')

/* Two files hold Amharic that is data rather than interface chrome, and are
   exempt by design:
     api/demoData.ts — authored demo content standing in for user uploads,
                       which in production comes from the database.
     i18n.ts         — the Amharic month table, which IS the locale layer. */
const CONTENT_FILES = ['api/demoData.ts', 'i18n.ts']

const files = walk(SRC).filter(
  (f) => !CONTENT_FILES.some((c) => path.relative(SRC, f) === c),
)

describe('locales/am.json', () => {
  it('has no empty strings', () => {
    for (const [k, v] of Object.entries(dict)) {
      expect(v.trim(), `key "${k}" is empty`).not.toBe('')
    }
  })

  it('leaks no English', () => {
    const leaks: string[] = []
    for (const [k, v] of Object.entries(dict)) {
      if (/[A-Za-z]/.test(stripAllowed(v))) leaks.push(`${k}: ${v}`)
    }
    expect(leaks, `Latin text found in:\n${leaks.join('\n')}`).toEqual([])
  })

  it('contains Ethiopic in every string', () => {
    const nonEthiopic: string[] = []
    for (const [k, v] of Object.entries(dict)) {
      if (!NON_ETHIOPIC_KEYS.has(k) && !/[ሀ-፿]/.test(v)) nonEthiopic.push(`${k}: ${v}`)
    }
    expect(nonEthiopic).toEqual([])
  })

  it('covers every string PLAN.md § 5 specifies', () => {
    const required = {
      app_name: 'ሀበሻ ታለንት',
      login: 'ግባ',
      register: 'ተመዝገብ',
      phone_number: 'ስልክ ቁጥር',
      password: 'የይለፍ ቃል',
      confirm_password: 'የይለፍ ቃል ያረጋግጡ',
      logout: 'ውጣ',
      videos: 'ቪዲዮዎች',
      title: 'ርዕስ',
      posted_date: 'የተለጠፈበት ቀን',
      views: 'እይታዎች',
      creator: 'አቅራቢ',
      upload_video: 'ቪዲዮ ስቀል',
      welcome_promo: 'ተሰጥኦዎን ለዓለም ያሳዩ!',
      invalid_login: 'ስልክ ቁጥር ወይም የይለፍ ቃል ትክክል አይደለም',
      required_field: 'ይህ መስክ አስፈላጊ ነው',
    }
    for (const [k, v] of Object.entries(required)) expect(dict[k], k).toBe(v)
  })
})

describe('components', () => {
  it('hard-code no Amharic text — every visible string comes from t()', () => {
    const offenders: string[] = []
    for (const f of files) {
      /* Ethiopic outside a comment means a string was written inline instead
         of being added to the locale file. */
      stripComments(readFileSync(f, 'utf8'))
        .split('\n')
        .forEach((line, i) => {
          if (/[ሀ-፿]/.test(line)) {
            offenders.push(`${path.relative(SRC, f)}:${i + 1} — ${line.trim()}`)
          }
        })
    }
    expect(offenders, `hard-coded Amharic:\n${offenders.join('\n')}`).toEqual([])
  })

  it('references only keys that exist in am.json', () => {
    const missing: string[] = []
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      for (const m of src.matchAll(/\bt\(\s*'([a-z0-9_]+)'/g)) {
        if (!(m[1] in dict)) missing.push(`${path.relative(SRC, f)} → ${m[1]}`)
      }
    }
    expect(missing, `missing keys:\n${missing.join('\n')}`).toEqual([])
  })

  it('never letter-spaces or uppercases Ethiopic (DESIGN.md § Type)', () => {
    const css = readFileSync(path.resolve(__dirname, '../src/styles/press.css'), 'utf8')
    /* .label is the Amharic-safe small label; it must not track. */
    const labelBlock = /\.label \{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(labelBlock).toMatch(/letter-spacing:\s*0\s*;/)
    expect(labelBlock).not.toMatch(/text-transform:\s*uppercase/)
  })
})
