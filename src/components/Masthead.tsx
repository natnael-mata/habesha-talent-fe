import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { t } from '../i18n'
import { Wordmark } from './Mark'

export default function Masthead() {
  const { subscriber, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="masthead">
      <div className="shell masthead__in">
        <NavLink to="/videos" style={{ textDecoration: 'none' }} aria-label={t('app_name')}>
          <Wordmark scale={0.74} />
        </NavLink>

        <div className="row gap-14 wrap" style={{ justifyContent: 'flex-end' }}>
          <nav className="nav" aria-label={t('videos')}>
            <NavLink to="/videos" className="nav__cell">
              {t('nav_feed')}
            </NavLink>
            <NavLink to="/upload" className="nav__cell">
              {t('nav_upload')}
            </NavLink>
          </nav>

          {subscriber && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                void logout().then(() => navigate('/'))
              }}
            >
              {t('logout')}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
