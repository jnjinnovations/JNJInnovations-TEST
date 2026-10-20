import { useState } from 'react';
import { EbookItem } from '../types';
import BookCoverVisual from './BookCoverVisual';
import { X, ChevronLeft, ChevronRight, Check, ShoppingBag, BookOpen, Layers, Download } from 'lucide-react';

interface EbookSampleModalProps {
  book: EbookItem | null;
  onClose: () => void;
  onAddToCart: (book: EbookItem) => void;
}

export default function EbookSampleModal({ book, onClose, onAddToCart }: EbookSampleModalProps) {
  const [activePageIndex, setActivePageIndex] = useState(0);

  if (!book) return null;

  const samples = book.sampleContent && book.sampleContent.length > 0
    ? book.sampleContent
    : [
        {
          chapterTitle: 'Executive Preface & Context',
          pageNumber: 1,
          text: book.description || 'Welcome to this executive field guide. This manual provides direct operational frameworks for small and medium enterprises.'
        }
      ];

  const currentSample = samples[activePageIndex] || samples[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sample Reader
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-sm font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
              {book.title}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close sample reader"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with 2-column layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* Left Column: Book Details & Table of Contents */}
          <div className="md:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-40 mx-auto drop-shadow-md">
                <BookCoverVisual book={book} size="sm" interactive={false} />
              </div>

              <div className="text-center">
                <h4 className="font-display font-bold text-slate-900 text-lg leading-snug">
                  {book.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  By {book.author} · {book.pages} Pages · {book.publishedYear}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-xl font-bold font-mono text-[#0A1628]">
                    ${book.isOnSale && book.salePrice ? book.salePrice.toFixed(2) : book.price.toFixed(2)}
                  </span>
                  {book.isOnSale && book.salePrice && (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      ${book.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Table of Contents Snapshot */}
              <div className="pt-2">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Table of Contents
                </span>
                <div className="space-y-1.5 text-xs text-slate-600 max-h-48 overflow-y-auto pr-1">
                  {book.tableOfContents?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-baseline py-1 border-b border-slate-200/60 text-slate-700">
                      <span className="truncate pr-2 font-medium">
                        {item.chapter}. {item.title}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">
                        p.{item.pages}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Included Resources */}
              {book.includedAssets && book.includedAssets.length > 0 && (
                <div className="pt-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                    Included Digital Deliverables
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {book.includedAssets.map((asset, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{asset}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Buy CTA in left column */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  onAddToCart(book);
                  onClose();
                }}
                disabled={book.status === 'sold_out'}
                className="w-full flex items-center justify-center gap-2 bg-[#0A1628] hover:bg-black text-white px-4 py-3 rounded-lg font-sans text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                {book.status === 'sold_out' ? 'Sold Out' : 'Add to Cart — Immediate Download'}
              </button>
            </div>
          </div>

          {/* Right Column: Actual Sample Excerpt Reader */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div className="space-y-4">
              {/* Reading Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Preview Excerpt
                  </span>
                  <h3 className="font-display font-semibold text-slate-900 text-base">
                    {currentSample.chapterTitle}
                  </h3>
                </div>
                <div className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  Page {currentSample.pageNumber}
                </div>
              </div>

              {/* Reading Page Content */}
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base font-serif pt-2">
                <p className="first-letter:text-3xl first-letter:font-bold first-letter:font-display first-letter:mr-1 first-letter:float-left first-letter:text-[#0A1628]">
                  {currentSample.text}
                </p>
                <p className="mt-4 text-xs font-sans text-slate-500 italic bg-amber-50/80 p-3 rounded border border-amber-200">
                  Note: This preview contains curated excerpts. The full purchased volume includes full technical appendices, formulas, code repositories, and downloadable Notion/Excel workbooks.
                </p>
              </div>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
              <button
                onClick={() => setActivePageIndex(prev => Math.max(0, prev - 1))}
                disabled={activePageIndex === 0}
                className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer px-3 py-1.5 rounded hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Page
              </button>

              <div className="font-mono text-xs text-slate-400">
                {activePageIndex + 1} of {samples.length} excerpts
              </div>

              <button
                onClick={() => setActivePageIndex(prev => Math.min(samples.length - 1, prev + 1))}
                disabled={activePageIndex === samples.length - 1}
                className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer px-3 py-1.5 rounded hover:bg-slate-100"
              >
                Next Page
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
