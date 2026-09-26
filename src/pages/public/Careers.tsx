import { Link } from "react-router-dom"
import { Briefcase, MapPin, Clock } from "lucide-react"

const roles = [
  { title: "Product Engineer (React + Node)", location: "Port Harcourt / Remote", type: "Full-time", desc: "Ship seller dashboard, storefront, and WhatsApp tools. TypeScript and Tailwind." },
  { title: "AI Engineer (OpenAI tools)", location: "Remote", type: "Full-time", desc: "Build constrained tools searchProducts, checkStock, createOrder for the AI seller." },
  { title: "Seller Success", location: "Lagos / Port Harcourt", type: "Part-time", desc: "Help fashion and beauty sellers onboard, list products and connect WhatsApp." },
]

export default function Careers() {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-[36px] font-bold tracking-tight leading-none">Careers</h1>
        <p className="mt-2 text-sm text-[#5a5a5a]">Join the team building calm commerce on WhatsApp.</p>

        <div className="mt-8 grid lg:grid-cols-[1.3fr_0.7fr] gap-6">
          <div className="space-y-4">
            {roles.map((r) => (
              <div key={r.title} className="rounded-[22px] bg-white border border-[#F3E6D3] p-6">
                <div className="font-bold leading-tight">{r.title}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-[#6b6b6b]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1DA] border border-[#F3E6D3] px-2.5 py-1"><MapPin className="h-3 w-3" /> {r.location}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F7F1] border border-[#0B9C74]/20 px-2.5 py-1 text-[#0B9C74]"><Clock className="h-3 w-3" /> {r.type}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#5a5a5a]">{r.desc}</p>
                <Link to="/contact" className="mt-4 inline-flex rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-black">Apply via contact</Link>
              </div>
            ))}
          </div>
          <div className="rounded-[22px] bg-[#1a1a1a] text-white p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold"><Briefcase className="h-3.5 w-3.5" /> Why Cognicart</div>
            <h3 className="mt-3 font-display text-xl font-bold leading-tight">Small team, large impact</h3>
            <p className="mt-2 text-sm text-white/70 leading-6">We are sellers serving sellers. You will talk to real traders, ride with delivery partners, and see your code handle orders on WhatsApp the same day.</p>
            <Link to="/about" className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1a1a1a] hover:bg-[#FFF1DA]">Learn about us</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
