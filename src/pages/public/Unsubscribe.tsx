import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CheckCircle2, Mail } from "lucide-react"
import { broadcastService } from "../../services/broadcastService"

/**
 * One-click unsubscribe landing page. Public by design: requiring a login
 * before honouring an opt-out link is not a working opt-out. The token is a
 * signed id from the email, and the backend's reply is deliberately generic
 * so this page cannot be used to probe which addresses have accounts.
 */
export default function Unsubscribe() {
  const [params] = useSearchParams()
  const token = params.get("t") || ""
  const [message, setMessage] = useState("Updating your preferences…")
  const [done, setDone] = useState(false)
  const [resubscribed, setResubscribed] = useState(false)
  const ranFor = useRef("")

  useEffect(() => {
    if (!token) { setMessage("This unsubscribe link is missing its code."); setDone(true); return }
    // StrictMode double-invokes effects; opting out twice is harmless but noisy.
    if (ranFor.current === token) return
    ranFor.current = token

    broadcastService
      .unsubscribe(token)
      .then((result) => setMessage(result.message))
      .catch(() => setMessage("We could not update your preferences. Please try the link again."))
      .finally(() => setDone(true))
  }, [token])

  const undo = async () => {
    const result = await broadcastService.resubscribe(token)
    setMessage(result.message)
    setResubscribed(true)
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="w-full rounded-2xl border border-[#F3E6D3] bg-white p-8">
        {done ? <CheckCircle2 className="mx-auto h-10 w-10 text-[#0B9C74]" /> : <Mail className="mx-auto h-10 w-10 text-[#9a9a9a]" />}
        <h1 className="font-display mt-3 text-2xl font-bold tracking-tight">Email preferences</h1>
        <p className="mt-2 text-sm text-[#6b6b6b]">{message}</p>
        <p className="mt-2 text-xs text-[#9a9a9a]">
          You will still receive essential account, order and payment emails — those are not marketing.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {done && token && !resubscribed && (
            <button onClick={undo} className="rounded-full border border-[#F3E6D3] px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA]">
              Undo — keep sending announcements
            </button>
          )}
          <Link to="/" className="rounded-full bg-[#0B9C74] px-5 py-2 text-sm font-bold text-white hover:bg-[#0a8a66]">Back to Cognicart</Link>
        </div>
      </div>
    </div>
  )
}
