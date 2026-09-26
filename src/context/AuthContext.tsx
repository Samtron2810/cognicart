import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { authService } from "../services/authService"
import type { AuthUser, LoginPayload, RegisterPayload } from "../types/auth"

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = authService.getToken()
      if (!token) {
        setIsLoading(false)
        return
      }
      const stored = authService.getStoredSeller()
      if (stored) setUser(stored)
      // Try to validate with backend, fallback to stored
      try {
        const me = await authService.me(token)
        if (me) setUser(me)
      } catch {
        // keep stored
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const login = async (payload: LoginPayload) => {
    const { token, seller } = await authService.login(payload)
    authService.persist(token, seller)
    setUser(seller)
  }

  const register = async (payload: RegisterPayload) => {
    const { token, seller } = await authService.register(payload)
    authService.persist(token, seller)
    setUser(seller)
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
