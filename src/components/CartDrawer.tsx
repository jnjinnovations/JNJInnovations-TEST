import { useState, type FormEvent } from 'react';
import { CartItem, LicenseTier, OrderConfirmation } from '../types';
import BookCoverVisual from './BookCoverVisual';
import { recordCompletedOrder } from '../utils/ebookStore';
import { X, Trash2, Plus, Minus, ArrowRight, CheckCircle2, Download, ShieldCheck, Tag } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (bookId: string, quantity: number) => void;
  onUpdateLicense: (bookId: string, tier: LicenseTier) => void;
  onRemoveItem: (bookId: string) => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onUpdateLicense,
  onRemoveItem,
  onClearCart
}: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percentOff?: number; amountOff?: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  
  // Checkout form state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderConfirmation | null>(null);

  if (!isOpen) return null;

  // Calculate pricing based on license tier
  const getItemPrice = (item: CartItem) => {
    const base = item.ebook.isOnSale && item.ebook.salePrice ? item.ebook.salePrice : item.ebook.price;
    if (item.licenseTier === 'team_5') return base * 2.5;
    if (item.licenseTier === 'enterprise_unlimited') return base * 5.0;
    return base;
  };

  const subtotal = cart.reduce((acc, item) => acc + getItemPrice(item) * item.quantity, 0);

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.percentOff) {
      discount = (subtotal * appliedPromo.percentOff) / 100;
    } else if (appliedPromo.amountOff) {
      discount = Math.min(subtotal, appliedPromo.amountOff);
    }
  }

  const total = Math.max(0, subtotal - discount);

  const handleApplyPromo = (e: FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'JNJ2026') {
      setAppliedPromo({ code, percentOff: 20 });
    } else if (code === 'MICHIGAN') {
      setAppliedPromo({ code, amountOff: 10 });
    } else if (code === 'FOUNDER') {
      setAppliedPromo({ code, percentOff: 30 });
    } else {
      setPromoError('Invalid coupon code. Try JNJ2026 for 20% off.');
    }
  };

  const handleProcessOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!customerEmail || !customerName) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const orderId = `JNJ-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const newOrder: OrderConfirmation = {
        id: orderId,
        date: new Date().toISOString(),
        customerName,
        customerEmail,
        companyName,
        items: cart.map(item => ({
          bookId: item.ebook.id,
          title: item.ebook.title,
          price: getItemPrice(item),
          licenseTier: item.licenseTier,
          quantity: item.quantity
        })),
        subtotal,
        discount,
        total,
        downloadToken: Math.random().toString(36).substring(2, 15)
      };

      recordCompletedOrder(newOrder);
      setCompletedOrder(newOrder);
      setIsSubmitting(false);
      onClearCart();
    }, 700);
  };

  const triggerDownloadBook = (bookTitle: string) => {
    const book = cart.find(c => c.ebook.title === bookTitle)?.ebook 
      || completedOrder?.items.find(i => i.title === bookTitle);
    
    const textContent = `=====================================================
JNJ INNOVATIONS LLC — DIGITAL EXECUTIVE FIELD PLAYBOOK
=====================================================
Title: ${bookTitle}
Licensee: ${completedOrder?.customerName || 'Authorized User'}
Company: ${completedOrder?.companyName || 'Private Organization'}
License Token: ${completedOrder?.downloadToken || 'ACTIVE-TOKEN'}
Order ID: ${completedOrder?.id || 'JNJ-CONFIRMED'}
=====================================================

THANK YOU FOR YOUR PURCHASE.
Your licensed package includes the comprehensive field playbook,
diagrams, calculation models, and automation scripts.

1. EXECUTIVE SUMMARY & OVERVIEW
This document constitutes your authorized enterprise license.
You are entitled to lifetime revisions and security errata.

2. ACCESS YOUR ONLINE ASSET REPOSITORY:
- Python Bridge Scripts: https://github.com/jnj-innovations/playbook-assets
- Notion Workspace Template: https://notion.so/jnj-innovations/templates
- Dynamic ROI Modeling Sheets: Ready in your account

3. NEED CONSULTING IMPLEMENTATION SUPPORT?
Our Michigan advisory team works directly with SMB executive teams
to integrate these blueprints directly into your ERP and operational stacks.
Contact: jnjinnovations1@gmail.com | Michigan, USA

© 2026 JNJ Innovations LLC. All Rights Reserved.
`;

    const blob = new Blob([textContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_package.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-lg bg-[#fbf8fa] text-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 animate-slide-left"
        role="dialog"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg text-[#0A1628]">
              {completedOrder ? 'Order Confirmation' : isCheckingOut ? 'Checkout Details' : 'Shopping Cart'}
            </h2>
            {!completedOrder && !isCheckingOut && (
              <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {cart.reduce((a, b) => a + b.quantity, 0)} items
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* COMPLETED ORDER RECEIPT STATE */}
          {completedOrder ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-emerald-700 font-semibold">
                  Payment Verified
                </span>
                <h3 className="font-display font-bold text-2xl text-slate-900 mt-1">
                  Thank You, {completedOrder.customerName}!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Receipt and permanent digital download links sent to <span className="font-semibold text-slate-700">{completedOrder.customerEmail}</span>
                </p>
                <div className="font-mono text-xs text-slate-400 mt-2 bg-slate-100 py-1 px-3 rounded inline-block">
                  Order ID: {completedOrder.id}
                </div>
              </div>

              {/* Order Items & Instant Downloads */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-left space-y-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-100">
                  Purchased Deliverables
                </span>
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="pr-2">
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1">{item.title}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Qty {item.quantity} · {item.licenseTier.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => triggerDownloadBook(item.title)}
                      className="flex items-center gap-1.5 bg-[#0A1628] hover:bg-black text-white text-[11px] font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                ))}
              </div>

              {/* Total Paid */}
              <div className="flex justify-between items-center text-sm font-semibold px-2">
                <span className="text-slate-600">Total Billed:</span>
                <span className="font-mono text-lg text-slate-900">${completedOrder.total.toFixed(2)}</span>
              </div>

              <button
                onClick={() => {
                  setCompletedOrder(null);
                  setIsCheckingOut(false);
                  onClose();
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-sans text-xs font-semibold py-3 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
              >
                Return to Storefront
              </button>
            </div>
          ) : isCheckingOut ? (
            /* CHECKOUT FORM VIEW */
            <form onSubmit={handleProcessOrder} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Instant digital fulfillment. Downloads and license keys delivered immediately upon verification.</span>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0A1628] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Corporate Email (for download link) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="s.jenkins@company.com"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0A1628] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company / Organization (Optional)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Great Lakes Logistics"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0A1628] bg-white"
                  />
                </div>
              </div>

              {/* Order Summary in Checkout */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 mt-4">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>Discount ({appliedPromo?.code}):</span>
                    <span className="font-mono">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Due:</span>
                  <span className="font-mono text-base text-[#0A1628]">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-medium py-3 rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 flex items-center justify-center gap-2 bg-[#0A1628] hover:bg-black text-white font-sans text-xs font-semibold uppercase tracking-wider py-3 rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Finalizing...' : `Complete Order ($${total.toFixed(2)})`}
                </button>
              </div>
            </form>
          ) : cart.length === 0 ? (
            /* EMPTY CART */
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-slate-800 text-base">Your cart is empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explore our Michigan business technology playbooks and add a field manual to get started.
              </p>
              <button
                onClick={onClose}
                className="mt-4 inline-block bg-[#0A1628] text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-black transition-colors cursor-pointer uppercase tracking-wider"
              >
                Browse Playbooks
              </button>
            </div>
          ) : (
            /* CART ITEMS LIST */
            <div className="space-y-4">
              {cart.map((item) => {
                const unitPrice = getItemPrice(item);
                return (
                  <div
                    key={item.ebook.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-start shadow-xs"
                  >
                    {/* Tiny Cover Thumbnail */}
                    <div className="w-16 shrink-0 drop-shadow-sm">
                      <BookCoverVisual book={item.ebook} size="sm" interactive={false} />
                    </div>

                    {/* Book Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display font-semibold text-xs text-slate-900 leading-snug truncate">
                          {item.ebook.title}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.ebook.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* License Tier Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase">License Scope:</label>
                        <select
                          value={item.licenseTier}
                          onChange={(e) => onUpdateLicense(item.ebook.id, e.target.value as LicenseTier)}
                          className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
                        >
                          <option value="standard">Single Practitioner License (1x)</option>
                          <option value="team_5">Team License (Up to 5 Seats · 2.5x)</option>
                          <option value="enterprise_unlimited">Company Enterprise (Unlimited Seats · 5x)</option>
                        </select>
                      </div>

                      {/* Quantity & Item Total */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center border border-slate-200 rounded bg-slate-50">
                          <button
                            onClick={() => onUpdateQuantity(item.ebook.id, item.quantity - 1)}
                            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs px-2.5 text-slate-700">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.ebook.id, item.quantity + 1)}
                            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono text-xs font-bold text-[#0A1628]">
                          ${(unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer Area: Promo Code & Checkout Trigger */}
        {!completedOrder && cart.length > 0 && !isCheckingOut && (
          <div className="border-t border-slate-200 bg-white p-6 space-y-4">
            {/* Promo Code Form */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <input
                type="text"
                placeholder="Discount code (try JNJ2026)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
              />
              <button
                type="submit"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Apply
              </button>
            </form>

            {promoError && (
              <p className="text-[11px] text-red-500">{promoError}</p>
            )}
            {appliedPromo && (
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Coupon code {appliedPromo.code} applied!
              </p>
            )}

            {/* Price Calculations */}
            <div className="space-y-1.5 pt-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span className="font-mono text-lg text-[#0A1628]">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Proceed to checkout CTA */}
            <button
              onClick={() => setIsCheckingOut(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#0A1628] hover:bg-black text-white py-3.5 rounded-lg font-sans text-xs font-semibold uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:shadow"
            >
              Proceed to Instant Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
