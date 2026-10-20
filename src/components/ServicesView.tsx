import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Network, BarChart3, CheckCircle2, ChevronRight, HelpCircle, ArrowRight, DollarSign } from "lucide-react";

interface ServicesViewProps {
  onNavigate: (tab: string) => void;
}

export default function ServicesView({ onNavigate }: ServicesViewProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>("01");
  const [showPricing, setShowPricing] = useState<boolean>(false);

  const services = [
    {
      id: "ai",
      title: "AI Implementation",
      desc: "We embed AI directly into your business workflows to eliminate inefficiencies, improve decision-making, and drive measurable results.",
      techText: "NEXT-GEN INTELLIGENCE",
      icon: Cpu,
      color: "text-[#101c2e]"
    },
    {
      id: "automation",
      title: "Workflow Automation",
      desc: "We eliminate manual work by connecting your existing business tools and automating repetitive processes freeing your team to focus on growth.",
      techText: "OPERATIONAL VELOCITY",
      icon: Network,
      color: "text-[#101c2e]"
    },
    {
      id: "optimization",
      title: "Process Optimization",
      desc: "We audit your operations, identify inefficiencies, and redesign your systems from the ground up saving hundreds of hours per month.",
      techText: "STRUCTURAL CLARITY",
      icon: BarChart3,
      color: "text-[#101c2e]"
    }
  ];

  const phases = [
    {
      id: "01",
      title: "Diagnose",
      tagline: "Process Discovery & Auditing",
      description: "We perform a thorough 360-degree audit of your daily procedures, hardware, and business tools. We identify redundancies and bottlenecks so your operation runs leaner and faster.",
      bullets: [
        "CRM & data flow connectivity mapping",
        "Legacy software dependency tracking",
        "Comprehensive Tech Stack recommendation report"
      ]
    },
    {
      id: "02",
      title: "Automate",
      tagline: "System Connection & Scripts",
      description: "We deploy secure serverless integrations using robust frameworks to bridge databases and remove manual input pipelines.",
      bullets: [
        "CRM data entry sync with 99.9% uptime",
        "Customer support pipeline auto-routing",
        "Real-time database triggers"
      ]
    },
    {
      id: "03",
      title: "Intelligize",
      tagline: "Intelligence Hubs",
      description: "We integrate custom multi-modal language models that securely parse company knowledge to automatically draft emails, score leads, and generate contracts.",
      bullets: [
        "Automatically sort and route incoming requests",
        "Custom agent workflow training",
        "90-day technical performance supervision"
      ]
    }
  ];

  const pricingTiers = [
    {
      id: "starter",
      tier: "TIER 01",
      title: "Starter",
      price: "$2,500",
      period: "/ audit",
      desc: "Perfect for single-loop diagnostics and mapping tech flow opportunities.",
      bullets: [
        "Full process bottleneck audit",
        "Gap analysis report",
        "Tech stack recommendation handbook",
        "1-hour executive synthesis briefing"
      ],
      btnText: "Select Starter Partner"
    },
    {
      id: "growth",
      tier: "TIER 02",
      title: "Growth",
      price: "$5,000",
      period: "/ project",
      desc: "Our workhorse automation package for high-volume operation pipelines.",
      bullets: [
        "Up to 5 custom workflow automations",
        "CRM integration mapping & connection",
        "API error catching & status monitoring",
        "30-day post-launch technical support"
      ],
      featured: true,
      btnText: "Select Growth Project"
    },
    {
      id: "fullstack",
      tier: "TIER 03",
      title: "Full Stack",
      price: "$12,000",
      period: "/ enterprise",
      desc: "Complete operational transformation with custom AI deployment.",
      bullets: [
        "Complete manual process overhaul",
        "Custom AI agent training & secure search",
        "Proprietary low-latency API bridges",
        "90-day compliance & maintenance retainer"
      ],
      btnText: "Talk Enterprise"
    }
  ];

  return (
    <div className="blueprint-dots min-h-screen">
      {/* Hero Header Section */}
      <section className="py-20 bg-white border-b border-[#c5c6cd]/30">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[#0A1628] mb-4 block">
            EXPERTISE & EXECUTION
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[#0A1628] mb-6 tracking-tight">
            Our Services
          </h1>
          <p className="max-w-3xl mx-auto font-sans text-lg text-[#5d5e5f] leading-relaxed">
            Bridging the gap between legacy reliability and AI-driven agility. We engineer custom automation pipelines that empower Michigan's most ambitious small businesses.
          </p>
        </div>
      </section>

      {/* Services Grid cards */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((svc) => (
              <div
                key={svc.id}
                id={`service-block-${svc.id}`}
                className="group bg-white border border-[#c5c6cd]/60 hover:border-[#0A1628] rounded-xl p-8 flex flex-col justify-between transition-all duration-300 shadow-sm"
              >
                <div>
                  <div className="mb-6 bg-[#fbf8fa] p-4 rounded-lg inline-block border border-[#c5c6cd]/25 group-hover:bg-slate-50 transition-colors">
                    <svc.icon className="w-10 h-10 text-[#0A1628]" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#0A1628] mb-4">
                    {svc.title}
                  </h3>
                  <p className="font-sans text-sm text-[#5d5e5f] leading-relaxed mb-6">
                    {svc.desc}
                  </p>
                </div>

                <div className="mt-6">
                  <div className="tech-divider-center mb-4"></div>
                  <span className="font-mono text-xs font-medium text-[#75777d] uppercase tracking-wider block text-center">
                    {svc.techText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SMB Efficiency Package Details */}
      <section className="py-20 px-8 bg-[#101c2e] text-white overflow-hidden relative border-t border-[#75777d]/30">
        {/* Dynamic Abstract Tech Lines in Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none text-right font-mono text-[140px] pr-8 pt-8">
          01011
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            {/* Left Content Column */}
            <div className="w-full lg:w-1/2">
              <span className="font-mono text-xs font-semibold text-[#bbc7df] tracking-[0.2em] uppercase block mb-3">
                INTEGRATED PROGRAM
              </span>
              <h2 className="font-display text-4xl font-bold text-white mb-6">
                SMB Efficiency Package
              </h2>
              <p className="font-sans text-base text-[#79849b] leading-relaxed mb-8">
                Three phases. Diagnose. Automate. Intelligize. One complete business transformation package designed specifically for growth-stage SMBs in the Midwest.
              </p>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="w-5 h-5 text-[#bbc7df]" />
                  <span className="font-sans text-sm font-medium tracking-wide">Comprehensive end-to-end tech-stack audit</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="w-5 h-5 text-[#bbc7df]" />
                  <span className="font-sans text-sm font-medium tracking-wide">Make software automation bridges</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="w-5 h-5 text-[#bbc7df]" />
                  <span className="font-sans text-sm font-medium tracking-wide">Proprietary private AI implementation & knowledge bases</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Selection Column */}
            <div className="w-full lg:w-1/2 flex flex-col md:flex-row lg:flex-col gap-6">
              
              {/* Phase Nav Box Grid */}
              <div className="grid grid-cols-3 gap-3 w-full">
                {phases.map((phase) => (
                  <button
                    key={phase.id}
                    onClick={() => setSelectedPhase(phase.id)}
                    className={`p-5 flex flex-col items-center justify-center text-center rounded-lg border transition-all cursor-pointer ${
                      selectedPhase === phase.id
                        ? "bg-white text-[#101c2e] border-white shadow-lg"
                        : "bg-[#101c2e]/40 text-slate-300 border-[#75777d]/35 hover:bg-[#101c2e]/70"
                    }`}
                  >
                    <div className="font-display text-2xl font-bold mb-1">{phase.id}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider font-semibold">{phase.title}</div>
                  </button>
                ))}
              </div>

              {/* Selected Phase Details Drawer panel */}
              <div className="bg-white text-[#1b1b1d] p-6 rounded-lg border border-[#c5c6cd] flex-grow">
                {phases.map((p) => p.id === selectedPhase && (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <span className="font-mono text-[11px] text-[#5d5e5f] font-semibold uppercase tracking-wider block">Phase {p.id}: {p.title}</span>
                      <h4 className="font-display text-lg font-bold text-[#0A1628]">{p.tagline}</h4>
                    </div>
                    <p className="font-sans text-sm text-[#5d5e5f] leading-relaxed">
                      {p.description}
                    </p>
                    <div className="pt-2">
                      <span className="font-mono text-[10px] text-[#45474c] font-bold uppercase tracking-wider block mb-2">Key Deliverables:</span>
                      <ul className="text-xs text-[#5d5e5f] space-y-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        {p.bullets.map((b, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#0A1628]" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>

          </div>
        </div>
      </section>



      {/* Microprocessor Image Section */}
      <section className="py-20 bg-white border-t border-[#c5c6cd]/30">
        <div className="max-w-7xl mx-auto px-8">
          <div className="relative group overflow-hidden rounded-xl border border-[#c5c6cd] shadow-md">
            <img
              className="w-full h-80 object-cover grayscale contrast-[1.1] hover:grayscale-0 transition-all duration-700 hover:scale-[1.01]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRFTwvlN9uKE9POWxnYLbX-TRagKd5uNpjqodZj2P3HVNodfZuurf0nXFCaZy0sIs0Oh1mbtfo2WLTQjkcqcTJStUIVLxBIJDvEa3bI83ZpYR0DIPPOeAw0TVwiBVr7PsywCWfvpHQzhY1mA-joVN5i0p-cw8q1xPTne0OUzoK0xZSQ2blB4g9VHUuZu6oA6hCiM1YyVNVPpNYdfiQ3_LyL2zAmeMQykNPkYCHpo9qxXPja_Z4piC238CenwJSpV2UZWBzsFJcUuE"
              alt="Intricate microprocessor architecture showing technical precision"
              referrerPolicy="no-referrer"
            />
            {/* Technical grid overlay info */}
            <div className="absolute bottom-4 left-4 bg-[#0A1628]/95 text-[#d7e3fc] px-4 py-2 text-[11px] font-mono rounded border border-white/10 backdrop-blur-sm shadow select-none">
              // ARCH_METRIC: SILICON NODE CORES
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
