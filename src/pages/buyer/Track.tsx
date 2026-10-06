import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { KeyRound, LogOut, Mail, Package, ShieldCheck, Store, UserCircle } from "lucide-react"
import { useShopper } from "../../context/ShopperContext"
import { shopperService } from "../../services/shopperService"
import { useSEO } from "../../hooks/useSEO"
import type { ShopperOrder } from "../../types/shopper"
import { getApiErrorMessage } from "../../services/apiError"

/**
 * Passwordless buyer area.
 *
 * Buyers arrive here from the magic link in their order email (/track?t=…)
 * or verify with an email one-time code. There is deliberately no signup,
 * registration, or password form — identity is proven by email access only,
 * and guests can keep buying without ever visiting this page.
 */
export default function Track() {
  const [searchParams, setSearchParams] = useSearchParams()
  const magicToken = searchParams.get("t") || ""
  const { shopper, isVerified, isLoading, requestOtp, verifyOtp, redeemMagicLink, updateProfile, logout } = useShopper()

  const [redeeming, setRedeeming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // OTP flow state
  const [step, setStep] = useState<"request" | "verify">("request")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)

  // Verified state
  const [orders, setOrders] = useState<ShopperOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [editingName, setEditingName] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  useSEO({
    title: "Track your orders — Chatstand",
    description: "View your order history across Chatstand stores. Passwordless: verify with the code or link sent to your email — no account or password needed.",
  })

  useEffect(() => {
    if (!magicToken) return
    let active = true
    setRedeeming(true)
    setError(null)
    redeemMagicLink(magicToken)
      .then(() => { if (active) setNotice("You're verified — here is your order history.") })
      .catch(() => { if (active) setError("That link has expired or was already used. Request a code below instead.") })
      .finally(() => {
        if (active) {
          setRedeeming(false)
          // Single-use token: remove it from the URL either way.
          setSearchParams({}, { replace: true })
        }
      })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magicToken])

  useEffect(() => {
    if (!isVerified) return
    let active = true
    setOrdersLoading(true)
    shopperService.listOrders()
      .then((next) => { if (active) setOrders(next) })
      .catch(() => { if (active) setOrders([]) })
      .finally(() => { if (active) setOrdersLoading(false) })
    return () => { active = false }
  }, [isVerified])

  useEffect(() => {
    if (shopper) setEditingName(shopper.name || "")
  }, [shopper])

  const stores = useMemo(() => shopper?.stores || [], [shopper])

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await requestOtp({ phone: phone.trim(), email: email.trim() || undefined })
      setNotice(result.message)
      setStep("verify")
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Unable to send the code."))
    } finally {
      setBusy(false)
    }
  }

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await verifyOtp({ phone: phone.trim(), email: email.trim(), code: code.trim() })
      setNotice("Verified — welcome back!")
    } catch (reason) {
      setError(getApiErrorMessage(reason, "That code didn't work. Try again."))
    } finally {
      setBusy(false)
    }
  }

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSavingProfile(true)
    setError(null)
    try {
      await updateProfile({ name: editingName.trim() })
      setNotice("Profile updated.")
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Unable to update your profile."))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleLogout = async () => {
    setError(null)
    try {
      await logout()
      setOrders([])
      setNotice("Signed out. Your orders stay safe — verify again anytime.")
      setStep("request")
    } catch {
      setError("Unable to sign out right now.")
    }
  }

  if (isLoading || redeeming) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-[#FFFBF5]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" />
          {redeeming && <p className="mt-3 text-sm text-[#6b6b6b]">Verifying your link…</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] py-10">
      <div className="mx-auto max-w-[880px] px-4 sm:px-6">
        <h1 className="font-display text-[34px] font-bold tracking-tight">Your orders</h1>
        <p className="text-sm text-[#6b6b6b]">Order history across every Chatstand store you've bought from. No password — verify with your email whenever you need access.</p>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</div>}
        {notice && <div className="mt-4 rounded-xl border border-[#0B9C74]/20 bg-[#E6F7F1] px-3 py-2.5 text-sm text-[#0B9C74]">{notice}</div>}

        {!isVerified ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-[#F3E6D3] bg-white p-6">
              {step === "request" ? (
                <form onSubmit={handleRequestOtp} className="space-y-3">
                  <h2 className="flex items-center gap-2 font-bold"><Mail className="h-4 w-4 text-[#0B9C74]" />Get a verification code</h2>
                  <p className="text-xs leading-5 text-[#6b6b6b]">Enter the phone number and email you used at checkout. We'll email you a 6-digit code — no account or password involved.</p>
                  <input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone used at checkout" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
                  <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email used at checkout" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
                  <button disabled={busy} className="w-full rounded-full bg-[#0B9C74] px-5 py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60">{busy ? "Sending…" : "Email me a code"}</button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <h2 className="flex items-center gap-2 font-bold"><KeyRound className="h-4 w-4 text-[#0B9C74]" />Enter your code</h2>
                  <p className="text-xs leading-5 text-[#6b6b6b]">We emailed a 6-digit code to <span className="font-bold">{email}</span>. It expires in 10 minutes.</p>
                  <input required inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} placeholder="6-digit code" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-center text-lg font-bold tracking-[0.3em] outline-none focus:border-[#0B9C74]" />
                  <button disabled={busy || code.trim().length < 6} className="w-full rounded-full bg-[#0B9C74] px-5 py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60">{busy ? "Verifying…" : "Verify"}</button>
                  <button type="button" onClick={() => { setStep("request"); setCode("") }} className="w-full text-xs font-bold text-[#6b6b6b] hover:underline">Use a different phone or email</button>
                </form>
              )}
            </div>
            <div className="rounded-2xl bg-[#1a1a1a] p-6 text-white">
              <h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4 text-[#0B9C74]" />Passwordless by design</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-white/70">
                <li>• No signup form, no password to remember or leak.</li>
                <li>• Order emails include a one-tap tracking link.</li>
                <li>• Guest checkout always works — verification is optional.</li>
                <li>• Verifying links your past orders made with the same phone + email.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-[#F3E6D3] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0B9C74] text-white"><UserCircle className="h-5 w-5" /></span>
                  <div>
                    <div className="font-bold">{shopper?.name || "Verified buyer"}</div>
                    <div className="text-xs text-[#6b6b6b]">{shopper?.email} • {shopper?.phone}</div>
                    <div className="mt-1 text-xs text-[#9a9a9a]">{shopper?.totalOrders ?? 0} orders • ₦{(shopper?.totalSpent ?? 0).toLocaleString()} across {stores.length} store{stores.length === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <button onClick={() => void handleLogout()} className="inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA]"><LogOut className="h-4 w-4" /> Sign out</button>
              </div>
              <form onSubmit={handleSaveProfile} className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#F3E6D3] pt-4">
                <input value={editingName} onChange={(event) => setEditingName(event.target.value)} placeholder="Display name" className="min-w-0 flex-1 rounded-xl border border-[#F3E6D3] px-3 py-2 text-sm outline-none focus:border-[#0B9C74]" />
                <button disabled={savingProfile} className="rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-60">{savingProfile ? "Saving…" : "Save name"}</button>
                <p className="w-full text-xs text-[#9a9a9a]">Changing your email requires re-verifying the new address.</p>
              </form>
            </div>

            {stores.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {stores.map((store) => (
                  <Link key={store.sellerId} to={`/store/seller/${store.slug || store.sellerId}`} className="inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-xs font-bold hover:bg-[#FFF1DA]"><Store className="h-3.5 w-3.5 text-[#0B9C74]" />{store.name}</Link>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-[#F3E6D3] bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold"><Package className="h-4 w-4 text-[#0B9C74]" />Order history</h2>
              {ordersLoading ? (
                <div className="grid place-items-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" /></div>
              ) : orders.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-[#6b6b6b]">No orders linked to this profile yet.</p>
                  <Link to="/store" className="mt-3 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white">Browse stores</Link>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {orders.map((order) => (
                    <Link key={order.id} to={`/track/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F3E6D3] p-3 transition hover:bg-[#FFFBF5]">
                      <div className="min-w-0">
                        <div className="text-sm font-bold">{order.reference || `#${order.id.slice(-6).toUpperCase()}`} {order.store ? <span className="font-normal text-[#6b6b6b]">• {order.store.name}</span> : null}</div>
                        <div className="truncate text-xs text-[#6b6b6b]">{order.items.map((item) => item.name).join(", ")}</div>
                        <div className="text-xs text-[#9a9a9a]">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">₦{order.total.toLocaleString()}</span>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${order.paymentStatus === "Paid" ? "border-[#0B9C74]/20 bg-[#E6F7F1] text-[#0B9C74]" : "border-[#F3E6D3] bg-[#FFF1DA] text-[#E85D26]"}`}>{order.paymentStatus}</span>
                        <span className="inline-flex rounded-full border border-[#F3E6D3] bg-white px-2.5 py-1 text-xs font-bold">{order.orderStatus}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
