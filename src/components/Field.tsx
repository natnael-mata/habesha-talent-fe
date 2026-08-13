import { useId, type InputHTMLAttributes } from 'react'
import { t } from '../i18n'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

/** One input, one label, one error slot.
 *  The error is wired through aria-describedby and aria-invalid so a screen
 *  reader hears the Amharic message rather than only seeing the pink plate —
 *  colour is never the sole encoding here either. */
export default function Field({ label, hint, error, ...rest }: Props) {
  const id = useId()
  const hintId = `${id}-hint`
  const errId = `${id}-err`
  const described = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(' ')

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        {...rest}
        id={id}
        className="field__input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={described || undefined}
      />
      {hint && !error && (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__err" id={errId} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

/** The shared client-side validators. They return string KEYS, never
 *  sentences, so the Amharic wording lives only in locales/am.json — and
 *  they mirror the server's rules exactly (PLAN.md § quality bar: validation
 *  in Amharic on both client and server). */
export const validate = {
  phone(v: string): string | null {
    if (!v.trim()) return t('required_field')
    const ok = /^09\d{8}$/.test(v.replace(/[\s-]/g, '')) || /^\+?2519\d{8}$/.test(v.replace(/[\s-]/g, ''))
    return ok ? null : t('err_phone_format')
  },
  password(v: string): string | null {
    if (!v) return t('required_field')
    if (v.length < 6) return t('err_password_short')
    return null
  },
  confirm(v: string, against: string): string | null {
    if (!v) return t('required_field')
    if (v !== against) return t('err_password_match')
    return null
  },
  title(v: string): string | null {
    if (!v.trim()) return t('err_title_required')
    if (v.trim().length > 80) return t('err_title_long')
    return null
  },
}
