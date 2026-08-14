import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { DEMO_LOGIN } from '../api/demoData'
import { ApiError, ERROR_KEY, type Category } from '../api/types'
import Field, { validate } from '../components/Field'
import DemoNote from '../components/DemoNote'
import PerformerPrint from '../components/PerformerPrint'
import RegMarks from '../components/RegMarks'
import { Wordmark } from '../components/Mark'
import { t } from '../i18n'

/* The rack on the entry page. Twelve pulls, three screens — the same
   annotation a real drying rack carries in its margin. */
const RACK: { seed: string; category: Category }[] = [
  { seed: 'r1', category: 'song' },
  { seed: 'r2', category: 'dance' },
  { seed: 'r3', category: 'comedy' },
  { seed: 'r4', category: 'instrument' },
  { seed: 'r5', category: 'poetry' },
  { seed: 'r6', category: 'song' },
  { seed: 'r7', category: 'dance' },
  { seed: 'r8', category: 'instrument' },
  { seed: 'r9', category: 'comedy' },
  { seed: 'r10', category: 'poetry' },
  { seed: 'r11', category: 'song' },
  { seed: 'r12', category: 'dance' },
]

const STEPS = [
  { k: 'promo_step_1_k', b: 'promo_step_1_b', n: '01' },
  { k: 'promo_step_2_k', b: 'promo_step_2_b', n: '02' },
  { k: 'promo_step_3_k', b: 'promo_step_3_b', n: '03' },
] as const

export default function Login() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errs, setErrs] = useState<{ phone?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (status === 'authed') return <Navigate to="/videos" replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next = {
      phone: validate.phone(phone) ?? undefined,
      password: password ? undefined : t('required_field'),
    }
    setErrs(next)
    if (next.phone || next.password) return

    setBusy(true)
    try {
      await login(phone, password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/videos', { replace: true })
    } catch (err) {
      setFormError(
        err instanceof ApiError ? t(ERROR_KEY[err.code]) : t('err_network'),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main id="main" className="login">
      {/* ── First viewport: the sheet on the left, the rack on the right ── */}
      <section className="login__hero shell">
        <div className="login__intro">
          <Wordmark scale={1} />

          <h1 className="display d-xxl pull login__promo" data-text={t('welcome_promo')}>
            {t('welcome_promo')}
          </h1>

          <p className="lead login__lead">
            <strong style={{ fontWeight: 800, color: 'var(--ink)' }}>
              {t('promo_lead')}
            </strong>{' '}
            {t('promo_body')}
          </p>
        </div>

        <div className="login__action">
          <div className="login__formwrap regframe">
            <RegMarks />
            <form className="panel login__form" onSubmit={onSubmit} noValidate>
              {formError && (
                <div className="notice" role="alert">
                  <span aria-hidden="true">✕</span>
                  <span>{formError}</span>
                </div>
              )}

              <Field
                label={t('phone_number')}
                type="tel"
                inputMode="tel"
                autoComplete="username"
                dir="ltr"
                placeholder={t('phone_placeholder')}
                hint={t('phone_hint')}
                value={phone}
                error={errs.phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Field
                label={t('password')}
                type="password"
                autoComplete="current-password"
                value={password}
                error={errs.password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button className="btn btn--block" type="submit" disabled={busy}>
                {busy ? t('signing_in') : t('login')}
              </button>

              <p className="login__switch">
                {t('no_account')}{' '}
                <Link to="/subscribe" className="link">
                  {t('subscribe')}
                </Link>
              </p>
            </form>
          </div>

          <div className="login__demo">
            <DemoNote />
            <p className="note login__demo-creds">
              <span dir="ltr">{DEMO_LOGIN.phone}</span>
              {' · '}
              <span dir="ltr">{DEMO_LOGIN.password}</span>
            </p>
          </div>
        </div>

        <div className="login__rack">
          <Rack />
        </div>
      </section>

      {/* ── Three pulls: what actually happens ── */}
      <section className="login__how shell">
        <hr className="hr" />
        <div className="login__steps">
          {STEPS.map((s, i) => (
            <article key={s.n} className="step">
              <span className="step__n figure">{s.n}</span>
              <h2 className="display d-m">{t(s.k)}</h2>
              <p className="step__b">{t(s.b)}</p>
              {i < STEPS.length - 1 && <span className="step__rule" aria-hidden="true" />}
            </article>
          ))}
        </div>
      </section>

      <footer className="login__foot shell">
        <hr className="hr" />
        <div className="login__foot-in">
          <p className="note">
            <strong style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 14 }}>
              {t('partner_note')}
            </strong>
            <br />
            {t('app_owner')}
          </p>
          <p className="label login__edition">{t('edition_note')}</p>
        </div>
      </footer>
    </main>
  )
}

/* ── The rack, and the squeegee that pulls it ──────────────────────────────
   The world's own gesture, made operable: drag the blade across the rack and
   the prints behind it are pulled again in the next ink. It is decoration
   that explains the product — a view is a pull, and every pull is a new
   print. The rack renders complete without it, so nothing here is load-
   bearing for comprehension, and reduced-motion skips the animation. */

function Rack() {
  const wrap = useRef<HTMLDivElement>(null)
  const [blade, setBlade] = useState(0) // 0..1 across the rack
  const [pass, setPass] = useState(0) // how many times ink has been pulled
  const dragging = useRef(false)

  const move = useCallback((clientX: number) => {
    const el = wrap.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setBlade(Math.min(1, Math.max(0, (clientX - r.left) / r.width)))
  }, [])

  useEffect(() => {
    function up() {
      if (!dragging.current) return
      dragging.current = false
      setPass((p) => p + 1)
      setBlade(0)
    }
    function pointer(e: PointerEvent) {
      if (dragging.current) move(e.clientX)
    }
    window.addEventListener('pointermove', pointer)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', pointer)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [move])

  const inks = ['pink', 'marigold', 'rest'] as const

  return (
    <div className="rackwrap regframe" ref={wrap}>
      <RegMarks />

      <div
        className="rackgrid"
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
          move(e.clientX)
        }}
      >
        {RACK.map((r, i) => {
          /* Each pass shifts the ink assignment, so the same twelve seeds
             come back as a genuinely different edition. */
          const ink = inks[(i + pass * 2 + (i % 3)) % inks.length]
          return (
            <div
              className="rackcell screen wipe"
              key={r.seed}
              style={{ '--wipe-delay': `${i * 55}ms` } as React.CSSProperties}
            >
              <PerformerPrint
                seed={`${r.seed}-${pass}`}
                category={r.category}
                pull={ink}
                dotScale={0.8}
              />
            </div>
          )
        })}

        {/* The squeegee itself. Visible at rest, hit-testable, and operable
            from the keyboard — the contract calls it "one visible pressure
            control", and a control nobody can find is not one. */}
        <div
          className="rackblade"
          style={{ left: `${blade * 100}%` }}
          role="slider"
          tabIndex={0}
          aria-label={t('rack_pull_hint')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(blade * 100)}
          onPointerDown={(e) => {
            e.stopPropagation()
            dragging.current = true
            e.currentTarget.setPointerCapture?.(e.pointerId)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              e.preventDefault()
              setBlade((b) => Math.min(1, Math.max(0, b + (e.key === 'ArrowRight' ? 0.1 : -0.1))))
            } else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setPass((p) => p + 1)
              setBlade(0)
            }
          }}
          onBlur={() => setBlade(0)}
        />
      </div>

      <div className="rackmargin">
        <p className="note">
          <span className="label">{t('rack_editions', { n: RACK.length })}</span>
          <br />
          <span className="label">{t('rack_screens', { n: 3 })}</span>
        </p>
        <p className="note rackmargin__hint">{t('rack_pull_hint')}</p>
      </div>
    </div>
  )
}
