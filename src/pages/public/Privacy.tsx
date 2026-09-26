export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-[34px] font-bold tracking-tight">Privacy and Terms</h1>
        <p className="mt-2 text-sm text-[#5a5a5a]">Last updated 21 Sep 2026. This page covers privacy, terms and platform fees for sellers and customers.</p>

        <div className="mt-8 rounded-[22px] bg-white border border-[#F3E6D3] p-6 sm:p-8 space-y-6 text-sm leading-6 text-[#2b2b2b]">
          <section>
            <h2 className="font-bold text-base">1. Data we collect</h2>
            <p className="mt-1 text-[#5a5a5a]">Seller account, business profile, products, orders, customers and WhatsApp messages needed to provide the AI sales agent. We store product images on Cloudinary. We never share seller data across tenants. Every query is scoped by sellerId.</p>
          </section>
          <section>
            <h2 className="font-bold text-base">2. How AI uses data</h2>
            <p className="mt-1 text-[#5a5a5a]">AI calls controlled tools like searchProducts, checkStock and getBusinessInformation. It never invents prices or stock. The backend validates every action. Seller decides what AI can do.</p>
          </section>
          <section>
            <h2 className="font-bold text-base">3. Payments and fees</h2>
            <p className="mt-1 text-[#5a5a5a]">Paystack processes customer payments. Platform fee, if enabled, is deducted before settlement to the seller. See Pricing for plan fees. Taxes and delivery fees are shown separately.</p>
          </section>
          <section>
            <h2 className="font-bold text-base">4. Your rights</h2>
            <p className="mt-1 text-[#5a5a5a]">You can export or delete your business data. Contact hello@cognicart.ng for data requests. WhatsApp conversations follow WhatsApp Business policy.</p>
          </section>
          <section>
            <h2 className="font-bold text-base">5. Terms</h2>
            <p className="mt-1 text-[#5a5a5a]">Do not list prohibited items. You are responsible for accurate prices, stock and delivery promises shown on WhatsApp and storefront. Abusive use of AI or WhatsApp may result in suspension.</p>
          </section>
        </div>

        <div className="mt-6 rounded-2xl bg-[#1a1a1a] text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm"><span className="font-bold">Questions?</span> <span className="text-white/70">We reply fastest on WhatsApp.</span></div>
          <a href="/contact" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1a1a1a] hover:bg-[#FFF1DA]">Contact us</a>
        </div>
      </div>
    </div>
  )
}
