import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import ServicesView from "./components/ServicesView";
import AboutView from "./components/AboutView";
import ContactView from "./components/ContactView";
import EbookShopView from "./components/EbookShopView";
import EbookAdminView from "./components/EbookAdminView";
import CartDrawer from "./components/CartDrawer";
import EbookSampleModal from "./components/EbookSampleModal";
import Footer from "./components/Footer";
import { EbookItem, CartItem, LicenseTier } from "./types";
import { getStoredEbooks, syncWithMongoDB } from "./utils/ebookStore";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [ebooks, setEbooks] = useState<EbookItem[]>(() => getStoredEbooks());
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem("jnj_cart_items");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sampleModalBook, setSampleModalBook] = useState<EbookItem | null>(null);

  // Sync catalog updates and pull from MongoDB on mount
  useEffect(() => {
    // Automatically load latest playbooks from MongoDB Atlas
    syncWithMongoDB().then((books) => {
      if (books && books.length > 0) {
        setEbooks(books);
      }
    });

    const handleStorageUpdate = () => {
      setEbooks(getStoredEbooks());
    };
    window.addEventListener("jnj-ebooks-updated", handleStorageUpdate);
    return () => window.removeEventListener("jnj-ebooks-updated", handleStorageUpdate);
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem("jnj_cart_items", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);

  const handleGetStarted = () => {
    setActiveTab("contact");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = (book: EbookItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.ebook.id === book.id);
      if (existing) {
        return prev.map((item) =>
          item.ebook.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ebook: book, quantity: 1, licenseTier: "standard" }];
    });
  };

  const handleUpdateQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(bookId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.ebook.id === bookId ? { ...item, quantity } : item
      )
    );
  };

  const handleUpdateLicense = (bookId: string, tier: LicenseTier) => {
    setCart((prev) =>
      prev.map((item) =>
        item.ebook.id === bookId ? { ...item, licenseTier: tier } : item
      )
    );
  };

  const handleRemoveItem = (bookId: string) => {
    setCart((prev) => prev.filter((item) => item.ebook.id !== bookId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const renderActiveView = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeView
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        );
      case "services":
        return (
          <ServicesView
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        );
      case "shop":
        return (
          <EbookShopView
            ebooks={ebooks}
            onOpenSample={(book) => setSampleModalBook(book)}
            onAddToCart={handleAddToCart}
            onNavigateToAdmin={() => {
              setActiveTab("admin");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onOpenCart={() => setIsCartOpen(true)}
          />
        );
      case "admin":
        return (
          <EbookAdminView
            ebooks={ebooks}
            onUpdateEbooks={(updated) => setEbooks(updated)}
            onNavigateToShop={() => {
              setActiveTab("shop");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        );
      case "about":
        return <AboutView />;
      case "contact":
        return <ContactView />;
      default:
        return (
          <HomeView
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fbf8fa] text-[#1b1b1d] antialiased selection:bg-[#0A1628] selection:text-white">
      {/* Dynamic Navigation Bar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onGetStarted={handleGetStarted}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Container Layer with animated transitions */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Slide-over Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateLicense={handleUpdateLicense}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Interactive Sample Reading Modal */}
      <EbookSampleModal
        book={sampleModalBook}
        onClose={() => setSampleModalBook(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Corporate Coordinates Footer */}
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}
