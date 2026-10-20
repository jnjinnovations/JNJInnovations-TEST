import { MapPin } from "lucide-react";

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#101c2e] text-white py-12 border-t border-[#75777d]/35 select-text">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Brand coordinates block on left */}
        <div className="md:col-span-7 space-y-4">
          <div 
            onClick={() => setActiveTab("home")}
            className="font-display text-2xl font-bold tracking-tight text-white cursor-pointer select-none"
            id="footer-logo"
          >
            JNJ Innovations <span className="text-[#bbc7df] text-xs font-mono font-normal tracking-normal uppercase ml-1 opacity-80">LLC</span>
          </div>
          
          <p className="font-sans text-xs text-[#a3b1cc] max-w-sm leading-relaxed">
            Michigan's go-to consulting partner for small businesses. We find the inefficiencies, automate the work, and publish practical field playbooks for executive operators.
          </p>

          <div className="pt-2 flex items-center gap-2 font-mono text-[11px] text-[#bbc7df] tracking-wide uppercase">
            <MapPin className="w-3.5 h-3.5" />
            Michigan, USA
          </div>
        </div>

        {/* Quick links & Publishing links */}
        <div className="md:col-span-5 grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <span className="font-mono text-[10px] font-bold text-[#a3b1cc] block uppercase tracking-widest">
              Navigation
            </span>
            <ul className="space-y-2 font-sans text-xs font-medium text-white/80">
              {["home", "about", "services", "contact"].map((item) => (
                <li key={item}>
                  <button
                    id={`footer-nav-to-${item}`}
                    onClick={() => {
                      setActiveTab(item);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-white capitalize cursor-pointer transition-colors"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <span className="font-mono text-[10px] font-bold text-[#a3b1cc] block uppercase tracking-widest">
              Publications & Store
            </span>
            <ul className="space-y-2 font-sans text-xs font-medium text-white/80">
              <li>
                <button
                  id="footer-nav-to-shop"
                  onClick={() => {
                    setActiveTab("shop");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-white cursor-pointer transition-colors"
                >
                  Ebook Bookstore
                </button>
              </li>
              <li>
                <button
                  id="footer-nav-to-admin"
                  onClick={() => {
                    setActiveTab("admin");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-sky-300 text-sky-400 font-semibold cursor-pointer transition-colors"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-8 pt-8 mt-8 border-t border-[#75777d]/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-mono text-[#79849b] uppercase">
        <span>© {currentYear} JNJ Innovations LLC. All Rights Reserved.</span>
        <span>MICHIGAN SMB ADVISORY & TECHNOLOGY PRACTICE</span>
      </div>
    </footer>
  );
}
