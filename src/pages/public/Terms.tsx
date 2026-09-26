export default function Terms() {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-[34px] font-bold tracking-tight">Terms of service</h1>
        <p className="mt-2 text-sm text-[#5a5a5a]">Simple terms for sellers and customers using Cognicart WhatsApp AI.</p>
        <div className="mt-8 rounded-[22px] bg-white border border-[#F3E6D3] p-6 sm:p-8 space-y-6 text-sm leading-6 text-[#2b2b2b]">
          <section><h2 className="font-bold">1. Accepting terms</h2><p className="mt-1 text-[#5a5a5a]">By creating a seller account you agree to these terms and to WhatsApp Business terms.</p></section>
          <section><h2 className="font-bold">2. Seller responsibilities</h2><p className="mt-1 text-[#5a5a5a]">Keep product name, description, price and stock accurate. AI answers from your database. You handle packing, delivery and refunds per your policy shown at checkout.</p></section>
          <section><h2 className="font-bold">3. Platform</h2><p className="mt-1 text-[#5a5a5a]">We provide the dashboard, AI tools, storefront and order management. Uptime and AI reply times are best-effort. Subscriptions and fees are shown on Pricing.</p></section>
          <section><h2 className="font-bold">4. Payments</h2><p className="mt-1 text-[#5a5a5a]">Paystack and bank transfer supported. Settlement after platform fee if enabled. Orders keep price at creation time.</p></section>
          <section><h2 className="font-bold">5. Termination</h2><p className="mt-1 text-[#5a5a5a]">You may cancel anytime. We may suspend accounts violating policy or abusing WhatsApp.</p></section>
        </div>
      </div>
    </div>
  )
}
