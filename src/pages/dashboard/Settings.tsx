import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useBusiness } from "../../context/BusinessContext"
import { Upload, Store, Truck, CreditCard, Send, Info, MailWarning, CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"
import { authService } from "../../services/authService"
import { uploadImage } from "../../services/uploadService"
import { getApiErrorMessage } from "../../services/apiError"

function EmailVerificationNotice() {
  const { user } = useAuth()
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user || user.isEmailVerified) return null

  const handleResend = async () => {
    setSending(true)
    setError(null)
    try {
      await authService.resendVerification(user.email)
      setSent(true)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not resend the verification code."))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E85D26]/25 bg-[#FFF1DA] px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-[#1a1a1a]">
        <MailWarning className="h-4 w-4 shrink-0 text-[#E85D26]" />
        <span>
          <span className="font-bold">Verify your email</span> ({user.email}) to secure your account.
        </span>
      </div>
      {sent ? (
        <span className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-[#0B9C74]">
          <CheckCircle2 className="h-4 w-4" /> Code sent — check your inbox.
          <Link to={`/verify-email?email=${encodeURIComponent(user.email)}`} className="underline">
            Enter code
          </Link>
        </span>
      ) : (
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button onClick={() => void handleResend()} disabled={sending} className="rounded-full bg-[#1a1a1a] px-4 py-1.5 text-xs font-bold text-white hover:bg-black disabled:opacity-60">
            {sending ? "Sending..." : "Send code"}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const { business, isLoading, updateBusiness } = useBusiness()
  const [form, setForm] = useState({
    name: "",
    description: "",
    phone: "",
    location: "",
    deliveryInfo: "",
    deliveryFee: "1500",
    deliveryTime: "1-3 days",
    freeDeliveryThreshold: "25000",
    paymentMethod: "both" as "paystack" | "transfer" | "both",
    paystackEnabled: true,
    bankName: "",
    accountNumber: "",
    accountName: "",
    logo: "",
    logoPublicId: "",
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || user?.businessName || "",
        description: business.description || "",
        phone: business.phone || user?.phone || "",
        location: business.location || "",
        deliveryInfo: business.deliveryInfo || "",
        deliveryFee: String(business.deliveryFee ?? 1500),
        deliveryTime: business.deliveryTime || "1-3 days",
        freeDeliveryThreshold: String(business.freeDeliveryThreshold ?? 25000),
        paymentMethod: business.paymentMethod || "both",
        paystackEnabled: business.paystackEnabled ?? true,
        bankName: business.bankName || "",
        accountNumber: business.accountNumber || "",
        accountName: business.accountName || "",
        logo: business.logo || "",
        logoPublicId: business.logoPublicId || "",
      })
    } else if (user) {
      setForm((prev) => ({ ...prev, name: user.businessName || prev.name, phone: user.phone || prev.phone }))
    }
  }, [business, user])

  // The file goes straight to Cloudinary; only the resulting URL is ever sent
  // to our API or stored on the business profile.
  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setLogoError(null)
    setUploadingLogo(true)
    try {
      const asset = await uploadImage(file, "logo")
      setForm((prev) => ({ ...prev, logo: asset.url, logoPublicId: asset.publicId }))
    } catch (err: unknown) {
      setLogoError(getApiErrorMessage(err, "Could not upload that image. Please try again."))
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => setForm((prev) => ({ ...prev, logo: "", logoPublicId: "" }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateBusiness({
        name: form.name,
        description: form.description,
        phone: form.phone,
        location: form.location,
        deliveryInfo: form.deliveryInfo,
        deliveryFee: Number(form.deliveryFee) || 0,
        deliveryTime: form.deliveryTime,
        freeDeliveryThreshold: Number(form.freeDeliveryThreshold) || 0,
        paymentMethod: form.paymentMethod,
        paystackEnabled: form.paystackEnabled,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
        logo: form.logo,
        logoPublicId: form.logoPublicId,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div className="grid place-items-center py-16"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Business profile</h1>
        <p className="text-sm text-[#6b6b6b]">Sellers create their business profile, delivery and payment settings. This is the source AI uses to answer "where do you deliver?" and "how do I pay?"</p>
      </div>

      <EmailVerificationNotice />

      {saved && <div className="rounded-xl bg-[#E6F7F1] border border-[#0B9C74]/20 px-3 py-2.5 text-sm font-medium text-[#0B9C74]">Business profile saved to the backend.</div>}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6">
          <div className="flex items-center gap-2 text-sm font-bold"><Store className="h-4 w-4 text-[#0B9C74]" /> Business information</div>
          <p className="text-xs text-[#6b6b6b] mt-1">Creates their business profile — name, description and contact.</p>

          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <label className="sm:col-span-2 flex gap-4 items-start">
              <div className="h-20 w-20 rounded-2xl bg-[#FFFBF5] border border-[#F3E6D3] overflow-hidden grid place-items-center shrink-0">
                {form.logo ? <img src={form.logo} alt="logo" className="h-full w-full object-cover" /> : <Store className="h-6 w-6 text-[#9a9a9a]" />}
              </div>
              <div>
                <span className="text-xs font-bold">Logo</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <label className={`inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-xs font-bold hover:bg-[#FFF1DA] ${uploadingLogo ? "opacity-60 cursor-wait" : "cursor-pointer"}`}>
                    <Upload className="h-3.5 w-3.5" /> {uploadingLogo ? "Uploading..." : form.logo ? "Replace" : "Upload"}
                    <input type="file" accept="image/*" onChange={(e) => void handleLogo(e)} disabled={uploadingLogo} className="hidden" />
                  </label>
                  {form.logo && !uploadingLogo && (
                    <button type="button" onClick={handleRemoveLogo} className="rounded-full border border-[#F3E6D3] px-3 py-2 text-xs font-bold text-[#6b6b6b] hover:bg-[#FFF1DA]">
                      Remove
                    </button>
                  )}
                </div>
                {logoError ? (
                  <div className="text-xs text-red-600 mt-1">{logoError}</div>
                ) : (
                  <div className="text-xs text-[#9a9a9a] mt-1">PNG, JPG or WEBP up to 5MB. Uploaded straight to secure cloud storage.</div>
                )}
              </div>
            </label>

            <label className="sm:col-span-2">
              <span className="text-xs font-bold">Business name *</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cognicart Fashion" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" required />
            </label>

            <label className="sm:col-span-2">
              <span className="text-xs font-bold">Description</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="We sell handmade tote bags and glow serums from Lagos." className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none resize-none" />
            </label>

            <label>
              <span className="text-xs font-bold">Business phone *</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+2348010000001" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
            </label>

            <label>
              <span className="text-xs font-bold">Email</span>
              <input value={user?.email || ""} readOnly className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-[#FFFBF5] px-3 py-2.5 text-sm text-[#6b6b6b]" />
            </label>

            <label className="sm:col-span-2">
              <span className="text-xs font-bold">Location</span>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lagos, Nigeria" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
            </label>

            <label className="sm:col-span-2">
              <span className="text-xs font-bold">Delivery info (shown to customers on your storefront and Telegram)</span>
              <input value={form.deliveryInfo} onChange={(e) => setForm({ ...form, deliveryInfo: e.target.value })} placeholder="Lagos 1-2 days, outside Lagos 2-4 days" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
            </label>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6">
          <div className="flex items-center gap-2 text-sm font-bold"><Truck className="h-4 w-4 text-[#0B9C74]" /> Delivery settings</div>
          <p className="text-xs text-[#6b6b6b] mt-1">Sets delivery fee and time AI will confirm.</p>
          <div className="mt-4 grid sm:grid-cols-3 gap-4">
            <label>
              <span className="text-xs font-bold">Delivery fee (NGN)</span>
              <input type="number" value={form.deliveryFee} onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
            </label>
            <label>
              <span className="text-xs font-bold">Delivery time</span>
              <input value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
            </label>
            <label>
              <span className="text-xs font-bold">Free delivery over (NGN)</span>
              <input type="number" value={form.freeDeliveryThreshold} onChange={(e) => setForm({ ...form, freeDeliveryThreshold: e.target.value })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
            </label>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6">
          <div className="flex items-center gap-2 text-sm font-bold"><CreditCard className="h-4 w-4 text-[#0B9C74]" /> Payment settings — Phase 7 Paystack</div>
          <p className="text-xs text-[#6b6b6b] mt-1">Payments are initialized and verified by the backend's Paystack integration. Revenue and payment status update after the backend receives confirmation.</p>
          <div className="mt-3 rounded-xl bg-[#E6F7F1] border border-[#0B9C74]/20 p-3 text-xs leading-5 flex gap-2">
            <Info className="h-4 w-4 text-[#0B9C74] mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-[#0B9C74]">Paystack is backend-managed</div>
              <div className="text-[#6b6b6b]">Configure payment credentials and webhook settings on the backend. This toggle controls whether customers see Paystack at checkout.</div>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.paystackEnabled} onChange={(e) => setForm({ ...form, paystackEnabled: e.target.checked })} className="h-4 w-4 rounded border-[#F3E6D3] text-[#0B9C74]" />
              <span className="text-sm font-medium">Enable Paystack (card / bank)</span>
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <label>
                <span className="text-xs font-bold">Preferred method</span>
                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as never })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none">
                  <option value="both">Paystack and Transfer</option>
                  <option value="paystack">Paystack only</option>
                  <option value="transfer">Transfer only</option>
                </select>
              </label>
              <div className="hidden sm:block" />
              <label>
                <span className="text-xs font-bold">Bank name</span>
                <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Access Bank" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
              </label>
              <label>
                <span className="text-xs font-bold">Account number</span>
                <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="0123456789" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs font-bold">Account name</span>
                <input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} placeholder="Cognicart Fashion" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#1a1a1a] text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold flex items-center gap-2"><Send className="h-4 w-4 text-[#229ED9]" /> Telegram bot</div>
            <div className="text-xs text-white/70">Connect your Telegram bot to let AI sell in chat. Manage on the Telegram page.</div>
          </div>
          <Link to="/dashboard/telegram" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1a1a1a] hover:bg-[#FFF1DA]">Open Telegram settings</Link>
        </div>

        <button type="submit" disabled={saving} className="rounded-full bg-[#0B9C74] px-8 py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60">
          {saving ? "Saving..." : "Save business profile"}
        </button>
      </form>
    </div>
  )
}
