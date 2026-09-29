import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { shopperService } from "../services/shopperService"
import type { RequestOtpResult, ShopperProfile, UpdateShopperPayload } from "../types/shopper"

/**
 * Buyer (shopper) session context — deliberately separate from the seller
 * AuthContext. Buyers are passwordless: they verify with an email one-time
 * code or a magic link, and the backend keeps the session in an httpOnly
 * cookie. When no session exists everything stays null and guest checkout
 * continues to work unchanged.
 */
type ShopperContextValue = {
  shopper: ShopperProfile | null
  isVerified: boolean
  isLoading: boolean
  refresh: () => Promise<void>
  requestOtp: (payload: { phone: string; email?: string; sellerId?: string }) => Promise<RequestOtpResult>
  verifyOtp: (payload: { phone: string; email: string; code: string }) => Promise<void>
  redeemMagicLink: (token: string) => Promise<void>
  updateProfile: (payload: UpdateShopperPayload) => Promise<void>
  logout: () => Promise<void>
}

const ShopperContext = createContext<ShopperContextValue | null>(null)

export function ShopperProvider({ children }: { children: ReactNode }) {
  const [shopper, setShopper] = useState<ShopperProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = async () => {
    const profile = await shopperService.me()
    setShopper(profile)
  }

  useEffect(() => {
    const init = async () => {
      // Quietly resolve the cookie session; guests simply stay signed out.
      await refresh().catch(() => setShopper(null))
      setIsLoading(false)
    }
    void init()
  }, [])

  const requestOtp = (payload: { phone: string; email?: string; sellerId?: string }) =>
    shopperService.requestOtp(payload)

  const verifyOtp = async (payload: { phone: string; email: string; code: string }) => {
    await shopperService.verifyOtp(payload)
    await refresh()
  }

  const redeemMagicLink = async (token: string) => {
    await shopperService.consumeMagicLink(token)
    await refresh()
  }

  const updateProfile = async (payload: UpdateShopperPayload) => {
    await shopperService.updateMe(payload)
    await refresh()
  }

  const logout = async () => {
    await shopperService.logout()
    setShopper(null)
  }

  return (
    <ShopperContext.Provider
      value={{
        shopper,
        isVerified: !!shopper,
        isLoading,
        refresh,
        requestOtp,
        verifyOtp,
        redeemMagicLink,
        updateProfile,
        logout,
      }}
    >
      {children}
    </ShopperContext.Provider>
  )
}

export function useShopper() {
  const context = useContext(ShopperContext)
  if (!context) throw new Error("useShopper must be used within ShopperProvider")
  return context
}
