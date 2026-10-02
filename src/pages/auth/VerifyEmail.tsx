import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { AuthLayout } from "../../layouts/AuthLayout"
import { authService, OTP_LENGTH } from "../../services/authService"
import { getApiErrorMessage } from "../../services/apiError"

/** Matches the backend resend cooldown (VERIFY_RESEND_COOLDOWN_MS). */
const RESEND_COOLDOWN_SECONDS = 60

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyEmailOtp, isAuthenticated, user } = useAuth()

  // The signup screen forwards the address; a seller arriving cold can type it.
  const emailFromQuery = (searchParams.get("email") || "").trim().toLowerCase()
  const [email, setEmail] = useState(emailFromQuery || user?.email || "")
  const emailLocked = Boolean(emailFromQuery || user?.email)

  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""))
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const [status, setStatus] = useState<"idle" | "verifying" | "done">("idle")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const code = useMemo(() => digits.join(""), [digits])
  const complete = code.length === OTP_LENGTH && !digits.includes("")

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const submit = useCallback(
    async (candidate: string) => {
      if (status === "verifying" || status === "done") return
      setError(null)
      setNotice(null)
      setStatus("verifying")
      try {
        await verifyEmailOtp(email, candidate)
        setStatus("done")
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "That code is invalid or has expired."))
        setStatus("idle")
        setDigits(Array(OTP_LENGTH).fill(""))
        inputsRef.current[0]?.focus()
      }
    },
    [email, status, verifyEmailOtp]
  )

  // Auto-submit the moment the last box is filled - no extra tap needed.
  useEffect(() => {
    if (complete && status === "idle" && email.trim()) void submit(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, code])

  const setDigitAt = (index: number, value: string) => {
    setDigits((previous) => {
      const next = [...previous]
      next[index] = value
      return next
    })
  }

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "")
    if (!cleaned) {
      setDigitAt(index, "")
      return
    }
    // Typing or pasting several digits at once fills the following boxes.
    if (cleaned.length > 1) {
      setDigits((previous) => {
        const next = [...previous]
        cleaned.split("").forEach((digit, offset) => {
          if (index + offset < OTP_LENGTH) next[index + offset] = digit
        })
        return next
      })
      const landing = Math.min(index + cleaned.length, OTP_LENGTH - 1)
      inputsRef.current[landing]?.focus()
      return
    }
    setDigitAt(index, cleaned)
    if (index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault()
      setDigitAt(index - 1, "")
      inputsRef.current[index - 1]?.focus()
    }
    if (event.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus()
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH)
    if (!pasted) return
    event.preventDefault()
    const next = Array(OTP_LENGTH).fill("")
    pasted.split("").forEach((digit, i) => {
      next[i] = digit
    })
    setDigits(next)
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
  }

  const handleResend = async () => {
    if (!email.trim() || cooldown > 0) return
    setResending(true)
    setError(null)
    setNotice(null)
    try {
      const result = await authService.resendVerification(email)
      setNotice(result.message || "If that email needs verification, a new code is on its way.")
      setCooldown(result.resendAfterSeconds ?? RESEND_COOLDOWN_SECONDS)
      setDigits(Array(OTP_LENGTH).fill(""))
      inputsRef.current[0]?.focus()
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not send a new code. Try again shortly."))
    } finally {
      setResending(false)
    }
  }

  // Someone who is already verified has nothing to do here - and because the
  // route guards now push unverified sellers in, this is what lets them back
  // out again once the code is accepted.
  if (isAuthenticated && user?.isEmailVerified === true && status !== "done") {
    return <Navigate to="/dashboard" replace />
  }

  if (status === "done") {
    return (
      <AuthLayout>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6 sm:p-8 shadow-sm text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#0B9C74]" />
          <h1 className="mt-3 font-display text-xl font-bold">Email verified</h1>
          <p className="mt-1 text-sm text-[#6b6b6b]">Your Cognicart account is fully set up.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]"
          >
            Go to dashboard
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6 sm:p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F7F1]">
            <ShieldCheck className="h-6 w-6 text-[#0B9C74]" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold">Enter your verification code</h1>
          <p className="mt-2 text-sm leading-6 text-[#6b6b6b]">
            We emailed a {OTP_LENGTH} digit code
            {email ? (
              <>
                {" "}
                to <span className="font-bold text-[#1a1a1a]">{email}</span>
              </>
            ) : null}
            . It expires in 10 minutes.
          </p>
        </div>

        {!emailLocked && (
          <label className="mt-6 block">
            <span className="text-xs font-bold text-[#1a1a1a]">Email address</span>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a9a]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#F3E6D3] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15"
              />
            </div>
          </label>
        )}

        <div className="mt-6 flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputsRef.current[index] = element
              }}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={OTP_LENGTH}
              disabled={status === "verifying"}
              aria-label={`Digit ${index + 1}`}
              className="h-12 w-11 rounded-xl border border-[#F3E6D3] bg-white text-center font-display text-lg font-bold outline-none focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 disabled:opacity-60"
            />
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-center text-sm text-red-700">{error}</div>
        )}
        {notice && !error && (
          <div className="mt-4 rounded-xl border border-[#0B9C74]/25 bg-[#E6F7F1] px-3 py-2.5 text-center text-sm text-[#0a7a5b]">{notice}</div>
        )}

        <button
          onClick={() => void submit(code)}
          disabled={!complete || !email.trim() || status === "verifying"}
          className="mt-6 w-full rounded-full bg-[#0B9C74] py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60 transition"
        >
          {status === "verifying" ? "Verifying..." : "Verify email"}
        </button>

        <div className="mt-4 text-center text-sm text-[#6b6b6b]">
          Didn't get it?{" "}
          <button
            onClick={() => void handleResend()}
            disabled={resending || cooldown > 0 || !email.trim()}
            className="font-bold text-[#0B9C74] hover:underline disabled:opacity-60 disabled:no-underline"
          >
            {resending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link to={isAuthenticated ? "/dashboard" : "/login"} className="text-sm font-bold text-[#0B9C74] hover:underline">
            {isAuthenticated ? "Back to dashboard" : "Back to login"}
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
