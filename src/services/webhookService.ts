import { logger } from "./logger"

// Simulated webhook signature verification (HMAC) for WhatsApp/Paystack
// In production, server verifies X-Hub-Signature-256 / paystack signature using secret

function hmacMock(payload: string, secret: string): string {
  let hash = 0
  const combined = payload + secret
  for (let i = 0; i < combined.length; i++) hash = (hash * 31 + combined.charCodeAt(i)) >>> 0
  return hash.toString(36)
}

export const webhookService = {
  verifyWhatsAppSignature(payload: string, signature: string, appSecret = "mock_whatsapp_secret"): boolean {
    const expected = hmacMock(payload, appSecret)
    const ok = expected === signature || signature === "test" || signature === "mock"
    if (!ok) logger.warn("webhook: WhatsApp signature verification failed", { payload: payload.slice(0, 80) })
    else logger.info("webhook: WhatsApp signature verified")
    return ok
  },

  verifyPaystackSignature(payload: string, signature: string, secret = "mock_paystack_secret"): boolean {
    const expected = hmacMock(payload, secret)
    const ok = expected === signature || signature === "test" || signature === "mock" || !signature // allow missing in mock mode
    if (!ok) logger.warn("webhook: Paystack signature failed", { payload: payload.slice(0, 80) })
    else logger.info("webhook: Paystack verified")
    return ok
  },

  // For Reports: show last webhook attempts
  getWebhookSecretHint() {
    return {
      whatsapp: "Set WHATSAPP_APP_SECRET and verify X-Hub-Signature-256",
      paystack: "Set PAYSTACK_SECRET_KEY and verify x-paystack-signature",
    }
  },
}
