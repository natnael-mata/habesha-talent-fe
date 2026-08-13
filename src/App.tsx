/* ─────────────────────────────────────────────────────────────────────────
 * ሀበሻ ታለንት — DIRECTION CONTRACT
 *
 * THESIS: A talent feed is a drying rack. Every performer is one hand-pulled
 * print in the same frame with the same registration marks and a different
 * ink, so thirty unknown Ethiopians read as an edition worth collecting.
 * It refuses the category's charcoal-and-red video grid with its floating +.
 *
 * OWN-WORLD: Silver foil ground, dense black halftone ink, fluro pink and
 * marigold pulled per edition. Zero radius, zero blur; the only offset is a
 * solid misregistered plate. Corner crosshairs bound every frame, edge ticks
 * mark every pressable. Amharic sets in Noto Sans Ethiopic at 900 under a
 * three-ink offset; figures set in Anton.
 *
 * STORY: A subscriber sees a wall of Ethiopians printed like collectibles,
 * understands in one viewport that this is a stage ordinary people get
 * pulled onto, and enters with nothing but a phone number.
 *
 * FIRST VIEWPORT: Left — wordmark, ተሰጥኦዎን ለዓለም ያሳዩ! at 104px under the pull,
 * one lead line, then the login sheet with its primary ግባ. Right — a 4×3
 * drying rack of halftoned performers in alternating pink and marigold,
 * bounded by a pink registration rule with its edition annotated in the
 * margin. Drag the squeegee across it and the rack is pulled again.
 *
 * FORM: The Silkscreen Loft — dealt as a challenger against the assigned
 * roll (my grounded #3, the azmari bet) and pinned by the user, which beats
 * the roll. Staging: the bellows, rendered as the squeegee — one visible
 * pressure control the visitor drags, re-ranking the rack behind it.
 * Seed key 53a00d89.
 * ───────────────────────────────────────────────────────────────────────── */

import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, RequireAuth, useAuth } from './auth/AuthContext'
import Masthead from './components/Masthead'
import Login from './pages/Login'
import Subscribe from './pages/Subscribe'
import Feed from './pages/Feed'
import Watch from './pages/Watch'
import Upload from './pages/Upload'
import { t } from './i18n'

import './styles/tokens.css'
import './styles/press.css'
import './styles/pages.css'

function Shell() {
  const { subscriber } = useAuth()
  const { pathname } = useLocation()
  /* The entry pages carry their own lockup; the masthead belongs to the
     signed-in product. */
  const chrome = subscriber && pathname !== '/' && pathname !== '/subscribe' && pathname !== '/register'

  return (
    <>
      <a className="skip" href="#main">
        {t('skip_to_content')}
      </a>
      {chrome && <Masthead />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/subscribe" element={<Subscribe />} />
        {/* the old signup URL, kept so any printed or shared link still lands */}
        <Route path="/register" element={<Navigate to="/subscribe" replace />} />
        <Route
          path="/videos"
          element={
            <RequireAuth>
              <Feed />
            </RequireAuth>
          }
        />
        <Route
          path="/watch/:id"
          element={
            <RequireAuth>
              <Watch />
            </RequireAuth>
          }
        />
        <Route
          path="/upload"
          element={
            <RequireAuth>
              <Upload />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  )
}
