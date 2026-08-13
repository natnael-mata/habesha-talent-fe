import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import * as api from '../api/mock'
import type { Session, Subscriber } from '../api/types'

/* There is deliberately no `register` here. Accounts are created by Ethio
   Telecom's VAS system through an inbound provisioning callback, never by the
   app — see PRODUCT.md § Operating Context and `provisionSubscriber` in
   api/mock.ts. Adding a signup path to this context would let the UI mint
   accounts the operator does not know about. */
interface AuthValue {
  subscriber: Subscriber | null
  login: (phone: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => api.currentSession())

  const login = useCallback(async (phone: string, password: string) => {
    setSession(await api.login(phone, password))
  }, [])

  const logout = useCallback(() => {
    api.logout()
    setSession(null)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ subscriber: session?.subscriber ?? null, login, logout }),
    [session, login, logout],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}

/** PLAN.md § build prompt 6: every page except login and register requires
 *  auth. An unauthenticated visitor is sent to the login page, and the route
 *  they wanted is remembered so login lands them there instead of the feed. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { subscriber } = useAuth()
  const location = useLocation()
  if (!subscriber) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
