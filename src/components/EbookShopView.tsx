import { useState, useMemo } from 'react';
import { EbookItem, EbookCategory } from '../types';
import BookCoverVisual from './BookCoverVisual';
import { Search, ShoppingBag, BookOpen, Check, ArrowRight, ShieldCheck, Download, Star, Sparkles, Filter } from 'lucide-react';

interface EbookShopViewProps {
  ebooks: EbookItem[];
  onOpenSample: (book: EbookItem) => void;
  onAddToCart: (book: EbookItem) => void;
  onNavigateToAdmin: () => void;
  onOpenCart: () => void;
}

const CATEGORIES: ('All' | EbookCategory)[] = [
  'All',
  'Automation',
  'AI & Analytics',
  'Cloud Infrastructure',
  'Cybersecurity',
  'Operations',
  'Strategy'
];

export default function EbookShopView({
  ebooks,
  onOpenSample,
  onAddToCart,
  onNavigateToAdmin,
  onOpenCart
}: EbookShopViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | EbookCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating'>('featured');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Filter & sort books
  const filteredBooks = useMemo(() => {
    return ebooks
      .filter((b) => b.status !== 'draft')
      .filter((b) => {
        if (selectedCategory !== 'All' && b.category !== selectedCategory) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.subtitle.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          const priceA = a.isOnSale && a.salePrice ? a.salePrice : a.price;
          const priceB = b.isOnSale && b.salePrice ? b.salePrice : b.price;
          return priceA - priceB;
        }
        if (sortBy === 'price_desc') {
          const priceA = a.isOnSale && a.salePrice ? a.salePrice : a.price;
          const priceB = b.isOnSale && b.salePrice ? b.salePrice : b.price;
          return priceB - priceA;
        }
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        return (b.salesCount || 0) - (a.salesCount || 0);
      });
  }, [ebooks, selectedCategory, searchQuery, sortBy]);

  const handleAddToCartWithNotice = (book: EbookItem) => {
    onAddToCart(book);
    setAddedNotice(book.title);
    setTimeout(() => {
      setAddedNotice(null);
    }, 3500);
  };

  return (
    <div className="blueprint-grid min-h-screen pb-24">
      
      {/* Quick Admin Navigation Banner for Business Owners */}
      <div className="bg-[#101c2e] text-white px-8 py-2.5 border-b border-[#3b4758]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-mono text-[10px] uppercase tracking-wider text-sky-400 font-semibold">Store Manager</span>
            <span>Update inventory counts, pricing, and book designs in the admin dashboard.</span>
          </div>
          <button
            onClick={onNavigateToAdmin}
            className="flex items-center gap-1.5 font-semibold text-white hover:text-sky-300 transition-colors cursor-pointer text-xs uppercase tracking-wider underline underline-offset-4"
          >
            Open Admin Portal
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Added to Cart Notification */}
      {addedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A1628] text-white px-5 py-3.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold">{addedNotice}</span> added to cart.
          </div>
          <button
            onClick={onOpenCart}
            className="ml-2 text-xs font-semibold text-sky-300 hover:text-white underline cursor-pointer"
          >
            View Cart
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-14 pb-16 px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#0A1628] mb-3">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span>EXECUTIVE KNOWLEDGE REPOSITORY</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0A1628] leading-tight">
            Field Manuals & Practical Playbooks for Michigan Businesses
          </h1>

          <p className="font-sans text-base sm:text-lg text-[#5d5e5f] mt-4 leading-relaxed">
            Eliminate operational guesswork. Every manual is engineered by JNJ Innovations consultants from direct client engagements, containing verified architectures, calculation spreadsheets, and automation scripts.
          </p>

          {/* Value Props Row */}
          <div className="mt-6 flex flex-wrap gap-y-2 gap-x-6 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Instant PDF & ePub Downloads
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Production Code & ROI Workbooks Included
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Lifetime Revisions & Security Errata
            </span>
          </div>
        </div>
      </section>

      {/* Storefront Controls: Search, Category Filters, Sorting */}
      <section className="px-8 max-w-7xl mx-auto mb-10">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
          
          {/* Top row: Search input & Sort selector */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, keyword, or author..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1628] text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Selector & Active Count */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs text-slate-500 font-mono">
                {filteredBooks.length} {filteredBooks.length === 1 ? 'playbook' : 'playbooks'}
              </span>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 hidden md:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
                >
                  <option value="featured">Best Selling</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Tabs: Interactive Segmented Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-[#0A1628] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Catalog Grid */}
      <section className="px-8 max-w-7xl mx-auto">
        {filteredBooks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center space-y-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-800">
              No matching publications found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any playbooks matching "{searchQuery}". Try selecting another category or resetting filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="bg-[#0A1628] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-black transition-colors cursor-pointer uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {filteredBooks.map((book) => {
              const displayPrice = book.isOnSale && book.salePrice ? book.salePrice : book.price;
              const hasDiscount = book.isOnSale && book.salePrice && book.salePrice < book.price;
              const isSoldOut = book.status === 'sold_out';

              return (
                <div
                  key={book.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg group"
                >
                  {/* Top Area: Book Cover Spotlight */}
                  <div className="p-6 pb-4 bg-gradient-to-b from-slate-100/60 to-white flex flex-col items-center border-b border-slate-100">
                    <div className="w-48 max-w-full drop-shadow-md">
                      <BookCoverVisual book={book} size="md" />
                    </div>

                    {/* Stock Alert or Digital Availability */}
                    <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      {!book.isUnlimited && book.inventoryCount > 0 && book.inventoryCount <= 40 ? (
                        <span className="text-amber-700 font-semibold">
                          Only {book.inventoryCount} licenses left
                        </span>
                      ) : isSoldOut ? (
                        <span className="text-red-600 font-semibold">Edition Sold Out</span>
                      ) : (
                        <span className="text-slate-500">Instant Digital Delivery</span>
                      )}
                      <span>·</span>
                      <span>{book.edition}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      {/* Unboxed Metadata with separators */}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{book.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{book.pages} Pages</span>
                        <span aria-hidden="true">·</span>
                        <span>{book.publishedYear}</span>
                      </div>

                      {/* Title & Subtitle */}
                      <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-[#0A1628] leading-snug">
                        {book.title}
                      </h3>
                      
                      <p className="font-sans text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {book.subtitle}
                      </p>
                    </div>

                    {/* Formats Included */}
                    <div className="text-[11px] text-slate-500 pt-1">
                      <span className="font-medium text-slate-700">Formats:</span> {book.format.join(' · ')}
                    </div>

                    {/* Price & Rating Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#0A1628] tabular-nums">
                          ${displayPrice.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs font-mono text-slate-400 line-through tabular-nums">
                            ${book.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-mono text-slate-700 font-semibold">{book.rating.toFixed(2)}</span>
                        <span className="text-slate-400 text-[11px]">({book.reviewCount})</span>
                      </div>
                    </div>

                    {/* Action Buttons: Read Sample & Add to Cart */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => onOpenSample(book)}
                        className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Read Sample
                      </button>

                      <button
                        onClick={() => handleAddToCartWithNotice(book)}
                        disabled={isSoldOut}
                        className="flex items-center justify-center gap-1.5 bg-[#0A1628] hover:bg-black text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Enterprise / Corporate Licensing Section */}
      <section className="mt-20 px-8 max-w-7xl mx-auto">
        <div className="bg-[#101c2e] text-white rounded-2xl p-8 sm:p-12 border border-[#3b4758] relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest text-sky-400 font-semibold">
              Corporate & Team Distribution
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Equip your entire engineering & operations department
            </h2>
            <p className="font-sans text-sm text-slate-300 leading-relaxed">
              Need team-wide access or customized white-label training sessions based on these playbooks? JNJ Innovations provides enterprise licenses and bespoke workshop delivery.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => onOpenSample(ebooks[0])}
                className="bg-white text-[#0A1628] hover:bg-slate-100 font-sans text-xs font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-colors cursor-pointer"
              >
                Inspect Sample Reader
              </button>
              <button
                onClick={onNavigateToAdmin}
                className="border border-slate-600 hover:border-slate-400 text-white font-sans text-xs font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-colors cursor-pointer"
              >
                Open Admin Inventory Studio
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
