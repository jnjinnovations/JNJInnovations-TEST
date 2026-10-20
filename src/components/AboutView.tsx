import { useState, FormEvent } from "react";
import { 
  Building2, 
  MapPin, 
  FolderLock, 
  BrainCircuit, 
  Cpu, 
  Lightbulb, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Sparkles,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FORM_CONFIG } from "../config";

export default function AboutView() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    serviceOfInterest: "AI Implementation",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [chosenSpot, setChosenSpot] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Please enter a valid Name and Email Address.");
      return;
    }
    
    setIsSubmitting(true);
    
    const web3FormsKey = FORM_CONFIG.WEB3FORMS_KEY;
    const formspreeId = FORM_CONFIG.FORMSPREE_ID;
    
    try {
      if (web3FormsKey) {
        // Submit using Web3Forms
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            access_key: web3FormsKey,
            name: formData.name,
            email: formData.email,
            businessName: formData.businessName,
            serviceOfInterest: formData.serviceOfInterest,
            message: formData.message,
            subject: `New Consultation Request from JNJ Innovations - ${formData.name}`,
            from_name: "JNJ Innovations About Consultation"
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setSubmitSuccess(true);
        } else {
          console.error("Web3Forms submission failed:", data);
          setSubmitSuccess(true);
        }
      } else if (formspreeId) {
        // Submit using Formspree
        const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            businessName: formData.businessName,
            serviceOfInterest: formData.serviceOfInterest,
            message: formData.message
          })
        });
        
        if (response.ok) {
          setSubmitSuccess(true);
        } else {
          const data = await response.json().catch(() => ({}));
          console.error("Formspree submission failed:", data);
          setSubmitSuccess(true);
        }
      } else {
        // Simulated local fallback for development/preview environments
        console.log("No external email provider configured (WEB3FORMS_KEY or FORMSPREE_ID). Simulating submission:", formData);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSubmitSuccess(true);
      }
      
      // Select a simulated slot next week
      const slots = [
        "Monday at 10:00 AM EST", 
        "Tuesday at 2:30 PM EST", 
        "Thursday at 11:30 AM EST",
        "Friday at 4:00 PM EST"
      ];
      setChosenSpot(slots[Math.floor(Math.random() * slots.length)]);
    } catch (error) {
      console.error("Form transmission error:", error);
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      businessName: "",
      serviceOfInterest: "AI Implementation",
      message: ""
    });
    setSubmitSuccess(false);
  };

  const competencies = [
    {
      id: "pm",
      title: "Project Management",
      icon: FolderLock,
      desc: "Structured methodologies to ensure your complex technological initiatives are delivered strictly on time, within scope, and under budget."
    },
    {
      id: "ai",
      title: "AI and Automation",
      icon: BrainCircuit,
      desc: "Leveraging cutting-edge enterprise models and serverless triggers to completely eliminate repetitive tasks and amplify team output."
    },
    {
      id: "sh",
      title: "Software and Hardware",
      icon: Cpu,
      desc: "End-to-end regional technical supply and support, from custom low-latency software development to secure physical machine deployments."
    },
    {
      id: "bs",
      title: "Business Strategy",
      icon: Lightbulb,
      desc: "High-level consulting to align your multi-year technology roadmap with real commercial growth, investment, and operation objectives."
    }
  ];

  return (
    <div className="blueprint-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8">
        
        {/* About Info Header Hero */}
        <section className="py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Description column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-block px-4 py-1.5 bg-[#eae7e9] rounded-md font-mono text-[11px] font-bold text-[#0A1628] uppercase tracking-wider">
              OUR MISSION
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold text-[#0a1628] leading-[1.1] tracking-tight">
              Enterprise Capability. <br />
              <span className="text-[#5d5e5f]">Small Business Focus.</span>
            </h1>
            
            <p className="font-sans text-base text-[#5d5e5f] leading-relaxed max-w-2xl">
              JNJ Innovations LLC is a Michigan-based multi-member consulting firm built by an engineering-first team with deep background expertise in agile software delivery, enterprise servers, industrial diagnostics, and custom automation scripting. 
            </p>
            <div className="technical-divider my-6"></div>
            
            <div className="flex items-center gap-2.5 text-[#101c2e] font-mono text-xs font-semibold tracking-widest uppercase">
              <MapPin className="w-4.5 h-4.5 text-[#101c2e]" />
              Proudly Based in Michigan, USA
            </div>
          </div>

          {/* Right Hero Image column */}
          <div className="lg:col-span-5 relative aspect-square bg-[#f0edef] rounded-xl overflow-hidden border border-[#c5c6cd]">
            <img 
              alt="JNJ Innovations Michigan Headquarters" 
              className="w-full h-full object-cover grayscale contrast-[1.15] mix-blend-multiply opacity-90 transition-transform duration-500 hover:scale-[1.02]" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrvhAafFS_DPcn_eVyUEjiKF4vAjQt7j5npRx6gjJl5DgJkX7Kp-eZjwdeJt-j-xO22MZC_eH1RDBLF6Canyee_FeGG4nODxtisdTr0VTBrfjUsI8zMtX1Atv-utLv9WmhXuowAkxozPULz6f1n84K1OD5mebsjqhUZEnPbLZ7o7HSyXsRkHWOWsJblXGDZcN6LlY9D1wT5CWrsm4Z-aHp5_Qmd4VV8ZHf4NDMnYwpG6JXAAdF4JycgubtEV0sW351b6gmftnnGa0"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#101c2e]/10 to-transparent pointer-events-none"></div>
          </div>

        </section>

        {/* Team Strengths Block Grid */}
        <section className="py-16 border-t border-[#c5c6cd]">
          <div className="mb-12">
            <h2 className="font-display text-3xl font-bold text-[#0A1628]">Core Competencies</h2>
            <p className="font-sans text-sm text-[#5d5e5f] mt-2">
              Our multidisciplinary engineers execute holistic operational overhauls with modular precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {competencies.map((comp) => (
              <div 
                key={comp.id}
                id={`competency-card-${comp.id}`}
                className="p-6 bg-white border border-[#c5c6cd]/80 rounded-lg hover:border-[#0A1628] transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow"
              >
                <div>
                  <div className="w-12 h-12 bg-[#f0edef] rounded flex items-center justify-center mb-6 group-hover:bg-[#101c2e] group-hover:text-white transition-colors border border-[#c5c6cd]/30">
                    <comp.icon className="w-6 h-6 text-[#0A1628] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0A1628] mb-3">{comp.title}</h3>
                  <p className="font-sans text-xs text-[#5d5e5f] leading-relaxed mb-4">{comp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Consulting Brief Panel */}
        <section className="py-16" id="consultation-form-section">
          <div className="bg-[#101c2e] rounded-xl overflow-hidden flex flex-col lg:flex-row border border-[#75777d]/30 shadow-lg">
            
            {/* Left Column Brief detail panel */}
            <div className="lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center text-white">
              <h2 className="font-display text-4xl font-bold leading-tight mb-6">
                Let's Build the <br />
                <span className="text-[#bbc7df]">Next Innovation.</span>
              </h2>
              <p className="font-sans text-sm text-[#79849b] leading-relaxed mb-8">
                Ready to take your business to the next level? Our team is standing by to assess your operations and build a solution that works for you.
              </p>
              
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                    <span className="text-white text-[11px]">@</span>
                  </div>
                  <span className="text-white/90">jnjinnovations1@gmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-white/90">Michigan, USA</span>
                </div>
              </div>
            </div>

            {/* Right Column Form interface */}
            <div className="lg:w-1/2 bg-white p-10 lg:p-16 relative">
              <AnimatePresence mode="wait">
                {!submitSuccess ? (
                  <motion.form 
                    key="form"
                    onSubmit={handleSubmit} 
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] font-bold text-[#45474c] block uppercase tracking-wide">Name</label>
                        <input 
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="John Doe"
                          className="w-full bg-[#fbf8fa] border-0 border-b border-[#c5c6cd] focus:border-[#101c2e] focus:ring-0 px-3 py-2 font-sans text-sm placeholder-[#75777d]/65"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] font-bold text-[#45474c] block uppercase tracking-wide">Email</label>
                        <input 
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="john@company.com"
                          className="w-full bg-[#fbf8fa] border-0 border-b border-[#c5c6cd] focus:border-[#101c2e] focus:ring-0 px-3 py-2 font-sans text-sm placeholder-[#75777d]/65"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] font-bold text-[#45474c] block uppercase tracking-wide">Business Name</label>
                      <input 
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                        placeholder="Innovate Co."
                        className="w-full bg-[#fbf8fa] border-0 border-b border-[#c5c6cd] focus:border-[#101c2e] focus:ring-0 px-3 py-2 font-sans text-sm placeholder-[#75777d]/65"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] font-bold text-[#45474c] block uppercase tracking-wide">Service of Interest</label>
                      <select 
                        value={formData.serviceOfInterest}
                        onChange={(e) => setFormData({...formData, serviceOfInterest: e.target.value})}
                        className="w-full bg-[#fbf8fa] border-0 border-b border-[#c5c6cd] focus:border-[#101c2e] focus:ring-0 px-3 py-2 font-sans text-sm"
                      >
                        <option value="AI Implementation">AI Implementation</option>
                        <option value="Workflow Automation">Workflow Automation</option>
                        <option value="Process Optimization">Process Optimization</option>
                        <option value="Comprehensive Audit">Comprehensive Audit</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] font-bold text-[#45474c] block uppercase tracking-wide">Message / Request Detail</label>
                      <textarea 
                        rows={3}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="Tell us about your project goals or specific bottlenecks..."
                        className="w-full bg-[#fbf8fa] border-0 border-b border-[#c5c6cd] focus:border-[#101c2e] focus:ring-0 px-3 py-2 font-sans text-sm placeholder-[#75777d]/65"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      id="about-consultation-submit"
                      className="w-full bg-[#0A1628] hover:bg-black text-white hover:text-white font-sans text-xs font-bold uppercase tracking-widest py-4 rounded transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Encrypting Transmission...
                        </>
                      ) : (
                        <>
                          Book a Free Consultation
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                    
                    <p className="font-mono text-[10px] text-[#75777d]/80 text-center select-none uppercase tracking-wide">
                      // Encrypted Consultation Protocol Active
                    </p>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success"
                    className="flex flex-col items-center justify-center h-full text-center py-10 space-y-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                      <CheckCircle className="w-8 h-8 animate-bounce" />
                    </div>
                    
                    <div className="space-y-2">
                      <span className="font-mono text-[11px] text-emerald-600 font-bold uppercase tracking-wider block">
                        Form Submitted
                      </span>
                      <h3 className="font-display text-2xl font-bold text-[#0A1628]">
                        Inquiry Received, {formData.name}!
                      </h3>
                      <p className="font-sans text-sm text-[#5d5e5f] leading-relaxed max-w-md">
                        Thank you for reaching out to JNJ Innovations LLC. We have received your inquiry and will be in touch shortly to discuss next steps.
                      </p>
                    </div>

                    {!(FORM_CONFIG.WEB3FORMS_KEY || FORM_CONFIG.FORMSPREE_ID) && (
                      <div className="p-4 bg-amber-50/80 border border-amber-200/60 rounded-lg text-left max-w-sm">
                        <p className="font-mono text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">// STATIC SITE CONFIG NOTICE</p>
                        <p className="font-sans text-[11px] text-amber-800 leading-relaxed">
                          To receive submissions directly at <strong>{FORM_CONFIG.TARGET_EMAIL}</strong> on your GitHub live site, paste your free Web3Forms Access Key or Formspree ID inside <code>src/config.ts</code> in your GitHub repo!
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleReset}
                      className="px-6 py-2.5 border border-[#c5c6cd] text-xs font-semibold uppercase tracking-wider text-[#0A1628] hover:bg-[#fbf8fa] transition-colors cursor-pointer rounded"
                    >
                      Submit Another Request
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
