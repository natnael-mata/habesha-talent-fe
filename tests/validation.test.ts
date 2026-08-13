/* Phone normalisation, masking, and the rules the server must mirror.
 *
 * The uniqueness guarantee in PLAN.md § 6 depends entirely on normalisation:
 * if 0911223344 and +251911223344 normalise differently, one person can hold
 * two accounts on one line and the UNIQUE constraint never fires.
 */

import { describe, expect, it } from 'vitest'
import { maskPhone, normalisePhone } from '../src/api/mock'

describe('normalisePhone', () => {
  it('accepts the local form', () => {
    expect(normalisePhone('0911223344')).toBe('0911223344')
  })

  it('folds the international forms onto the local one', () => {
    expect(normalisePhone('+251911223344')).toBe('0911223344')
    expect(normalisePhone('251911223344')).toBe('0911223344')
  })

  it('ignores spaces and dashes the way a keypad produces them', () => {
    expect(normalisePhone('091 122 3344')).toBe('0911223344')
    expect(normalisePhone('+251-911-223344')).toBe('0911223344')
  })

  it('rejects anything that is not an Ethiopian mobile number', () => {
    for (const bad of [
      '',
      '091122334', // too short
      '09112233445', // too long
      '0811223344', // not a 9-series mobile
      '1911223344',
      '+254911223344', // Kenya
      'not a number',
    ]) {
      expect(normalisePhone(bad), bad).toBeNull()
    }
  })

  it('treats every spelling of one number as the same account', () => {
    const forms = ['0911223344', '+251911223344', '251911223344', '091 122 3344']
    const normalised = new Set(forms.map(normalisePhone))
    expect(normalised.size).toBe(1)
  })
})

describe('maskPhone', () => {
  it('keeps the prefix and the last four, hides the middle', () => {
    expect(maskPhone('0911223344')).toBe('09****3344')
  })

  it('never exposes the middle digits', () => {
    expect(maskPhone('0911223344')).not.toContain('1122')
  })
})
