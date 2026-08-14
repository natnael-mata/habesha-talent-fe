import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import * as api from '../api'
import type { Subscriber } from '../api/types'

/* There is deliberately no `register` here. Accounts are created by Ethio
   Telecom's VAS system through an inbound provisioning callback, never by the
   app — see PRODUCT.md § Operating Context and `POST /api/vas/register`.
   Adding a signup path to this context would let the UI mint accounts the
   operator does not know about. */
interface AuthValue {
  /** `checking` until the session has been resolved. Routing must wait for it,
   *  or a signed-in subscriber gets bounced to the login page on every reload
   *  while /auth/me is still in flight. */
  status: 'checking' | 'authed' | 'anon'
  subscriber: Subscriber | null
  login: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [status, setStatus] = useState<AuthValue['status']>('checking')

  useEffect(() => {
    let live = true
    api
      .currentSession()
      .then((s) => {
        if (!live) return
        setSubscriber(s?.subscriber ?? null)
        setStatus(s ? 'authed' : 'anon')
      })
      .catch(() => live && setStatus('anon'))
    return () => {
      live = false
    }
  }, [])

  const login = useCallback(async (phone: string, password: string) => {
    const session = await api.login(phone, password)
    setSubscriber(session.subscriber)
    setStatus('authed')
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setSubscriber(null)
    setStatus('anon')
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ status, subscriber, login, logout }),
    [status, subscriber, login, logout],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}

/** Every page except login and subscribe requires a session. An unauthenticated
 *  visitor is sent to the login page, and the route they wanted is remembered
 *  so login lands them there instead of the feed. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  /* Render nothing rather than redirecting while the session is still being
     resolved — the alternative is a visible bounce to the login page on every
     hard refresh. */
  if (status === 'checking') return null
  if (status === 'anon') {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
