import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { authService } from "../services/authService"
import type { AuthUser, LoginPayload, RegisterPayload } from "../types/auth"

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // The backend's httpOnly session cookie is the source of truth after a refresh.
      const authenticatedUser = await authService.me()
      setUser(authenticatedUser)
      setIsLoading(false)
    }
    void init()
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

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
