import { ArrowRight, Check } from "lucide-react"
import { Link } from "react-router-dom"

export function FinalCTA() {
  return (
    <section id="start" className="bg-[#E85D26]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="rounded-[24px] bg-white p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="font-display text-[28px] lg:text-[36px] font-bold leading-none tracking-tight">Open your WhatsApp store today.</h3>
            <p className="mt-3 max-w-[560px] text-sm leading-6 text-[#5a5a5a]">Import from Instagram or catalog in minutes. Your AI starts selling while you sleep and you keep the profit.</p>
            <div className="mt-2 flex items-center gap-4 text-xs font-bold text-[#6b6b6b]">
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4 text-[#0B9C74]" /> No card required
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4 text-[#0B9C74]" /> 2-min setup
              </span>
            </div>
          </div>
          <div className="flex w-full lg:w-auto flex-col sm:flex-row gap-3">
            <Link to="/register" className="inline-flex justify-center items-center gap-2 rounded-full bg-[#0B9C74] px-8 py-4 text-sm font-bold text-white shadow-lg hover:bg-[#0a8a66] transition">
              Start selling free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/contact" className="inline-flex justify-center items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-8 py-4 text-sm font-bold hover:bg-[#FFF1DA] transition">
              Talk to founder
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
