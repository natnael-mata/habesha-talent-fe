import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import PerformerPrint from '../components/PerformerPrint'
import PressFoot from '../components/PressFoot'
import RegMarks from '../components/RegMarks'
import { Wordmark } from '../components/Mark'
import { VAS } from '../config'
import { t } from '../i18n'
import type { Category } from '../api/types'

/* This page replaced a signup form.
 *
 * Registration does not happen here and cannot: the subscriber subscribes by
 * SMS on their own line, Ethio Telecom's VAS provisions them and issues a
 * password, and the VAS posts that to our provisioning endpoint. An in-app
 * signup would create an account the operator has no record of — unsubscribed,
 * unbilled, unreconcilable. So the page's whole job is to make the SMS
 * unmistakable and then get out of the way.
 */

const STEPS: { k: string; b: string; n: string; cat: Category }[] = [
  { k: 'subscribe_step_1_k', b: 'subscribe_step_1_b', n: '01', cat: 'song' },
  { k: 'subscribe_step_2_k', b: 'subscribe_step_2_b', n: '02', cat: 'dance' },
  { k: 'subscribe_step_3_k', b: 'subscribe_step_3_b', n: '03', cat: 'instrument' },
]

export default function Subscribe() {
  const { subscriber } = useAuth()
  if (subscriber) return <Navigate to="/videos" replace />

  return (
    <main id="main" className="shell auth">
      <div className="auth__form">
        <div className="auth__head">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Wordmark scale={0.8} />
          </Link>
          <h1 className="display d-xl pull auth__title" data-text={t('subscribe_title')}>
            {t('subscribe_title')}
          </h1>
          <p className="lead">{t('subscribe_lead')}</p>
        </div>

        {/* The one thing to act on, at the scale of the one thing to act on. */}
        <div className="regframe">
          <RegMarks />
          <div className="smsplate">
            <p className="label smsplate__k">{t('subscribe_sms_k')}</p>

            <p className="smsplate__msg figure" dir="ltr">
              {VAS.keyword}
            </p>

            <p className="smsplate__to">
              <span className="label label--bare">{t('subscribe_sms_to')}</span>
              <span className="smsplate__code figure" dir="ltr">
                {VAS.shortcode}
              </span>
            </p>

            {!VAS.confirmed && (
              <p className="smsplate__todo" role="note">
                {t('subscribe_shortcode_todo')}
              </p>
            )}
          </div>
        </div>

        <p className="auth__back">
          {t('have_account')}{' '}
          <Link to="/" className="link">
            {t('login')}
          </Link>
        </p>
      </div>

      <aside className="auth__aside">
        {STEPS.map((s, i) => (
          <article className="stepcard" key={s.n}>
            <div className="stepcard__print screen">
              <PerformerPrint
                seed={`sub${s.n}`}
                category={s.cat}
                pull={i === 1 ? 'marigold' : i === 2 ? 'rest' : 'pink'}
                dotScale={0.8}
              />
              <span className="stepcard__n figure">{s.n}</span>
            </div>
            <div className="stepcard__text">
              <h2 className="stepcard__k">{t(s.k)}</h2>
              <p className="stepcard__b">{t(s.b)}</p>
            </div>
          </article>
        ))}
      </aside>

      <div className="auth__foot">
        <PressFoot />
      </div>
    </main>
  )
}
