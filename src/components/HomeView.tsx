import { motion } from "motion/react";
import { ArrowRight, Bot, Zap, TrendingUp, CheckSquare, Sparkles } from "lucide-react";
import CommandTerminal from "./CommandTerminal";

interface HomeViewProps {
  onNavigate: (tab: string) => void;
}

export default function HomeView({ onNavigate }: HomeViewProps) {
  const features = [
    {
      id: "ai",
      title: "AI Implementation",
      node: "NODE_01_AI_STRATEGY",
      icon: Bot,
      color: "text-indigo-600",
      bgClass: "hover:border-indigo-500",
      desc: "Integrating custom AI models into your existing stacks to unlock predictive insights and generative capabilities."
    },
    {
      id: "automation",
      title: "Workflow Automation",
      node: "NODE_02_AUTOMATION",
      icon: Zap,
      color: "text-amber-600",
      bgClass: "hover:border-amber-500",
      desc: "Eliminating repetitive manual tasks through robust, cross-platform software integration and custom logic."
    },
    {
      id: "optimization",
      title: "Process Optimization",
      node: "NODE_03_OPTIMIZATION",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgClass: "hover:border-emerald-500",
      desc: "Analyzing operational data to identify bottlenecks and engineer leaner, more profitable business procedures."
    }
  ];

  return (
    <div className="blueprint-grid min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Content Left */}
          <motion.div 
            className="lg:col-span-7 z-10 flex flex-col justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[#0A1628] mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#535f74]" />
              PREMIER SMB CONSULTING
            </span>
            
            <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight text-[#0A1628] leading-[1.1] mb-6">
              Transforming Your Business Through <span className="text-[#101c2e]">Technology.</span>
            </h1>
            
            <p className="font-sans text-lg text-[#5d5e5f] leading-relaxed mb-8 max-w-2xl">
              Michigan's SMB technology and management consulting partner we diagnose, automate, and intelligize your operations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                id="hero-book-consultation"
                onClick={() => onNavigate("contact")}
                className="bg-[#0A1628] text-white hover:bg-black px-8 py-4 font-sans text-sm font-semibold tracking-wide border border-[#c5c6cd] transition-all flex items-center justify-center gap-2 cursor-pointer shadow hover:shadow-md"
              >
                Book a Free Consultation
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                id="hero-view-impact"
                onClick={() => onNavigate("services")}
                className="border border-[#c5c6cd] text-[#0A1628] bg-white hover:bg-[#f5f3f5] px-8 py-4 font-sans text-sm font-semibold tracking-wide transition-all cursor-pointer"
              >
                View Our Solutions
              </button>
            </div>
          </motion.div>
          
          {/* Interactive Diagnostic Right */}
          <motion.div 
            className="lg:col-span-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <CommandTerminal />
          </motion.div>

        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="py-20 px-8 bg-[#f5f3f5]/80 border-t border-b border-[#c5c6cd]/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="font-mono text-xs font-semibold text-[#5d5e5f] uppercase tracking-wider block mb-2">INTELLIGENT SUITE</span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#0A1628]">Expert Strategic Focus</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.id}
                id={`feature-card-${feature.id}`}
                onClick={() => onNavigate("services")}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`bg-white p-8 border border-[#c5c6cd]/60 flex flex-col h-full group ${feature.bgClass} transition-all duration-300 rounded-lg shadow-sm cursor-pointer hover:shadow`}
              >
                <div className="mb-6 p-3 bg-[#fbf8fa] inline-block rounded-md border border-[#c5c6cd]/25 group-hover:bg-slate-50 w-fit">
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                
                <h3 className="font-display text-xl font-bold text-[#1b1b1d] mb-3 group-hover:text-[#0A1628] transition-colors">
                  {feature.title}
                </h3>
                
                <p className="font-sans text-sm text-[#5d5e5f] leading-relaxed mb-8 flex-grow">
                  {feature.desc}
                </p>
                
                <div className="mt-auto pt-4 technical-divider font-mono text-[11px] font-medium tracking-wider text-[#45474c]">
                  {feature.node}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ebook & Publication Spotlight Section */}
      <section className="py-16 px-8 bg-white border-b border-[#c5c6cd]/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3">
            <span className="font-mono text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              PUBLISHED KNOWLEDGE BASE
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0A1628]">
              Executive Field Playbooks & Strategic Guides
            </h2>
            <p className="font-sans text-sm text-[#5d5e5f] max-w-2xl leading-relaxed">
              Explore battle-tested automation blueprints, cloud migration frameworks, and enterprise AI roadmaps tailored for Michigan SMBs. Includes downloadable calculation sheets, checklists, and code repositories.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end items-start lg:items-end">
            <button
              onClick={() => onNavigate("shop")}
              className="bg-[#0A1628] hover:bg-black text-white text-xs font-semibold uppercase tracking-wider px-6 py-3.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              Explore Bookstore
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate("admin")}
              className="text-xs text-slate-600 hover:text-[#0A1628] font-medium underline underline-offset-4 cursor-pointer"
            >
              Open Inventory & Design Admin →
            </button>
          </div>
        </div>
      </section>

      {/* Mission Statement Strip */}
      <section className="py-12 px-8 bg-[#101c2e] text-[#d7e3fc] border-t border-b border-[#75777d]/30">
        <div className="max-w-7xl mx-auto text-center px-4">
          <p className="font-display text-lg md:text-xl font-medium max-w-4xl mx-auto leading-relaxed text-[#ffffff]">
            "JNJ Innovations LLC was established to bridge the gap between technology and business, enabling organizations to harness innovative solutions."
          </p>
          <div className="mt-4 font-mono text-xs text-[#79849b] tracking-[0.3em] uppercase">
            MISSION_CONTROL // JNJ_INNOVATIONS_MICH
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto bg-white border border-[#c5c6cd] p-10 md:p-16 flex flex-col items-center text-center relative rounded-xl shadow-sm">
          {/* Technical drafting guidelines decoration */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#101c2e]/10 pointer-events-none rounded-tl-xl"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#101c2e]/10 pointer-events-none rounded-br-xl"></div>
          <div className="absolute top-4 right-4 font-mono text-[9px] text-[#75777d]">// FRAME_LOCK: ENGAGED</div>
          
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#0A1628] mb-4">
            Ready to Transform Your Business?
          </h2>
          
          <p className="font-sans text-[#5d5e5f] mb-8 max-w-xl text-base leading-relaxed">
            Let's dissect your specific operational inefficiencies, identify automation wins, and define an actionable engineering roadmap together.
          </p>
          
          <button
            id="home-cta-lets-talk"
            onClick={() => onNavigate("contact")}
            className="bg-[#0A1628] hover:bg-black text-white px-10 py-4 font-sans text-sm font-semibold tracking-widest uppercase border border-[#c5c6cd] transition-all flex items-center gap-3 cursor-pointer"
          >
            Let's Talk
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

    </div>
  );
}
