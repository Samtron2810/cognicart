import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Business } from "../types/business"
import { businessService } from "../services/businessService"
import { useAuth } from "./AuthContext"

type BusinessContextValue = {
  business: Business | null
  isLoading: boolean
  refresh: () => Promise<void>
  updateBusiness: (payload: Partial<Business>) => Promise<Business>
  connectWhatsApp: (phone: string) => Promise<void>
  disconnectWhatsApp: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  const refresh = async () => {
    if (!isAuthenticated) {
      setBusiness(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const b = await businessService.get()
      setBusiness(b)
    } catch {
      setBusiness(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const updateBusiness = async (payload: Partial<Business>) => {
    const updated = await businessService.update(payload)
    setBusiness(updated)
    return updated
  }

  const connectWhatsApp = async (phone: string) => {
    const updated = await businessService.connectWhatsApp(phone)
    setBusiness(updated)
  }

  const disconnectWhatsApp = async () => {
    const updated = await businessService.disconnectWhatsApp()
    setBusiness(updated)
  }

  return (
    <BusinessContext.Provider value={{ business, isLoading, refresh, updateBusiness, connectWhatsApp, disconnectWhatsApp }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider")
  return ctx
}
