import { useState } from "react";
import { Menu, X, ArrowRight, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onGetStarted: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onGetStarted,
  cartCount = 0,
  onOpenCart
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "services", label: "Services" },
    { id: "shop", label: "Ebooks" },
    { id: "admin", label: "Admin" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40 h-20 bg-[#fbf8fa]/95 backdrop-blur-md border-b border-[#c5c6cd]/40">
      <nav className="flex justify-between items-center w-full px-8 max-w-7xl mx-auto h-full gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div 
          className="font-display text-2xl font-bold tracking-tight text-[#0A1628] cursor-pointer selection:bg-transparent whitespace-nowrap shrink-0"
          onClick={() => setActiveTab("home")}
          id="nav-logo"
        >
          JNJ Innovations <span className="text-[#535f74] text-xs font-mono font-normal tracking-normal uppercase ml-1 opacity-75">LLC</span>
        </div>

        {/* Zone 2: Navigation Links */}
        <div className="hidden md:flex items-center gap-7">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`relative py-1 font-sans text-sm font-medium transition-colors tracking-wide cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === item.id 
                  ? "text-[#0A1628] font-semibold" 
                  : "text-[#5d5e5f] hover:text-[#0A1628]"
              }`}
            >
              {item.label}
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A1628]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Zone 3: Cart Trigger & Primary CTA Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Cart Icon Button */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className="relative p-2 text-[#0A1628] hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#0A1628] text-white text-[10px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          <button 
            id="nav-get-started"
            onClick={onGetStarted}
            className="hidden sm:flex items-center gap-1.5 bg-[#101c2e] text-[#d7e3fc] hover:bg-[#0A1628] hover:text-white px-5 py-2 rounded-lg font-sans text-xs font-semibold uppercase tracking-widest transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            id="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#0A1628] hover:bg-[#eae7e9]/50 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="nav-mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-[#fbf8fa] border-b border-[#c5c6cd]/50 shadow-md"
          >
            <div className="flex flex-col gap-4 px-8 py-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  id={`nav-mobile-item-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`py-2 text-left font-sans text-base font-medium transition-colors cursor-pointer ${
                    activeTab === item.id 
                      ? "text-[#0A1628] ml-2 border-l-2 border-[#0A1628] pl-2 font-semibold" 
                      : "text-[#5d5e5f]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                id="nav-mobile-get-started"
                onClick={() => {
                  onGetStarted();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center bg-[#101c2e] text-[#d7e3fc] hover:bg-[#0A1628] py-3 rounded-lg font-sans text-xs font-semibold uppercase tracking-widest transition-all mt-2 cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
