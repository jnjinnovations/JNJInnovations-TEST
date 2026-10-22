import { useState, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { EbookItem, EbookCategory, EbookStatus, CoverDesignConfig } from '../types';
import BookCoverVisual from './BookCoverVisual';
import ImageUploader from './ImageUploader';
import {
  saveStoredEbooks,
  addEbookItem,
  deleteEbookItem,
  resetEbooksToDefault
} from '../utils/ebookStore';
import {
  Package,
  DollarSign,
  Palette,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Check,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  Sliders,
  Layers,
  ArrowLeft,
  Sparkles,
  Edit3,
  GitCommit
} from 'lucide-react';
import GitHubCommitModal from './GitHubCommitModal';
import { getGitHubConfig, commitCatalogToGitHub } from '../utils/githubSync';

interface EbookAdminViewProps {
  ebooks: EbookItem[];
  onUpdateEbooks: (updated: EbookItem[]) => void;
  onNavigateToShop: () => void;
}

type AdminTab = 'inventory' | 'pricing' | 'design' | 'content';

const THEME_PRESETS = [
  { id: 'navy', label: 'Navy Corporate', bg: '#0A1628', accent: '#38bdf8', text: '#ffffff' },
  { id: 'charcoal', label: 'Carbon Charcoal', bg: '#18181b', accent: '#fbbf24', text: '#f4f4f5' },
  { id: 'emerald', label: 'Emerald Executive', bg: '#064e3b', accent: '#34d399', text: '#ecfdf5' },
  { id: 'crimson', label: 'Crimson Authority', bg: '#4c0519', accent: '#f43f5e', text: '#fff1f2' },
  { id: 'steel', label: 'Titanium Steel', bg: '#1e293b', accent: '#94a3b8', text: '#f8fafc' },
  { id: 'amethyst', label: 'Amethyst Deep', bg: '#3b0764', accent: '#c084fc', text: '#faf5ff' },
];

const PATTERN_OPTIONS: CoverDesignConfig['pattern'][] = [
  'blueprint-grid',
  'neural-network',
  'geometric-cubes',
  'circuit-matrix',
  'minimalist-rule',
  'shield'
];

export default function EbookAdminView({
  ebooks,
  onUpdateEbooks,
  onNavigateToShop
}: EbookAdminViewProps) {
  // Admin authentication state (PIN: "admin" or "2026" or 1-click unlock)
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Active admin tab
  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  
  // Selected book for detailed editing (e.g. design studio)
  const [selectedBookId, setSelectedBookId] = useState<string>(ebooks[0]?.id || '');
  
  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New book modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookSubtitle, setNewBookSubtitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('JNJ Innovations Team');
  const [newBookPrice, setNewBookPrice] = useState(39);
  const [newBookCategory, setNewBookCategory] = useState<EbookCategory>('Automation');
  const [newBookStock, setNewBookStock] = useState(50);
  const [newBookUnlimited, setNewBookUnlimited] = useState(false);
  const [newBookCoverImage, setNewBookCoverImage] = useState('');
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedBook = useMemo(() => {
    return ebooks.find(b => b.id === selectedBookId) || ebooks[0];
  }, [ebooks, selectedBookId]);

  // Overall Catalog Statistics
  const totalBooks = ebooks.length;
  const activeBooks = ebooks.filter(b => b.status === 'active').length;
  const totalUnitsSold = ebooks.reduce((acc, b) => acc + (b.salesCount || 0), 0);
  const totalStockAvailable = ebooks.reduce((acc, b) => acc + (b.isUnlimited ? 0 : b.inventoryCount), 0);
  const lowStockCount = ebooks.filter(b => !b.isUnlimited && b.inventoryCount > 0 && b.inventoryCount <= 25).length;

  // Single book field updater
  const handleUpdateBook = (id: string, updates: Partial<EbookItem>) => {
    const updatedList = ebooks.map(book => {
      if (book.id === id) {
        return { ...book, ...updates };
      }
      return book;
    });
    onUpdateEbooks(updatedList);
    saveStoredEbooks(updatedList);
    showToast('Catalog updated successfully');

    // If auto-commit is enabled in GitHub settings, sync directly to GitHub
    const ghConfig = getGitHubConfig();
    if (ghConfig.autoCommit && ghConfig.owner && ghConfig.repo && ghConfig.token) {
      commitCatalogToGitHub(ghConfig, updatedList, `Auto-sync catalog updates via Admin Studio`).then(res => {
        if (res.success) {
          showToast(`Committed to GitHub (${res.commitSha})`);
        }
      });
    }
  };

  // Cover design updater
  const handleUpdateDesign = (id: string, designUpdates: Partial<CoverDesignConfig>) => {
    const target = ebooks.find(b => b.id === id);
    if (!target) return;
    const currentDesign = target.coverDesign || {
      theme: 'navy',
      bgColor: '#0A1628',
      accentColor: '#38bdf8',
      textColor: '#ffffff',
      pattern: 'blueprint-grid',
      showCoverImage: true
    };
    handleUpdateBook(id, {
      coverDesign: { ...currentDesign, ...designUpdates }
    });
  };

  // Add new book
  const handleCreateBook = (e: FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    const newId = newBookTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const newBook: EbookItem = {
      id: `${newId}-${Date.now().toString().slice(-4)}`,
      sku: `JNJ-BK-${String(ebooks.length + 1).padStart(3, '0')}`,
      title: newBookTitle,
      subtitle: newBookSubtitle || 'Executive Technology Field Manual',
      author: newBookAuthor || 'JNJ Innovations Advisory Practice',
      price: Number(newBookPrice) || 39,
      isOnSale: false,
      category: newBookCategory,
      inventoryCount: newBookUnlimited ? 9999 : Number(newBookStock) || 50,
      isUnlimited: newBookUnlimited,
      status: 'active',
      format: ['PDF', 'ePub', 'Implementation Workbook'],
      pages: 180,
      publishedYear: new Date().getFullYear().toString(),
      edition: '2026 Edition',
      badgeText: 'New Release',
      description: 'Strategic field manual with practical architectures, calculation spreadsheets, and implementation roadmaps.',
      longDescription: 'Comprehensive guide tailored for Michigan small business owners, operators, and IT leaders.',
      tableOfContents: [
        { chapter: '01', title: 'Foundational Assessment', pages: '1-30' },
        { chapter: '02', title: 'Core Implementation Architecture', pages: '31-80' },
        { chapter: '03', title: 'Measurement & Verification', pages: '81-140' }
      ],
      sampleContent: [
        {
          chapterTitle: 'Chapter 1: Foundational Assessment',
          pageNumber: 10,
          text: 'Begin by measuring baseline workflow cycle times before committing software licenses.'
        }
      ],
      includedAssets: ['Excel ROI Model', 'Implementation Checklist PDF'],
      coverImage: newBookCoverImage,
      coverDesign: {
        theme: 'navy',
        bgColor: '#0A1628',
        accentColor: '#38bdf8',
        textColor: '#ffffff',
        pattern: 'blueprint-grid',
        showCoverImage: Boolean(newBookCoverImage)
      },
      rating: 5.0,
      reviewCount: 1,
      salesCount: 0
    };

    const updated = addEbookItem(newBook);
    onUpdateEbooks(updated);
    setSelectedBookId(newBook.id);
    setNewBookCoverImage('');
    setIsAddModalOpen(false);
    showToast(`Created new playbook: ${newBook.title}`);

    // If auto-commit is enabled in GitHub settings, sync directly to GitHub
    const ghConfig = getGitHubConfig();
    if (ghConfig.autoCommit && ghConfig.owner && ghConfig.repo && ghConfig.token) {
      commitCatalogToGitHub(ghConfig, updated, `Add playbook "${newBook.title}" via Admin Studio`).then(res => {
        if (res.success) {
          showToast(`Committed "${newBook.title}" to GitHub!`);
        }
      });
    }
  };

  // Delete book
  const handleDeleteBook = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      const updated = deleteEbookItem(id);
      onUpdateEbooks(updated);
      if (selectedBookId === id && updated.length > 0) {
        setSelectedBookId(updated[0].id);
      }
      showToast('Book deleted');
    }
  };

  // Reset to default
  const handleResetCatalog = () => {
    if (confirm('Reset entire catalog to original factory presets? Any custom edits will be reverted.')) {
      const defaults = resetEbooksToDefault();
      onUpdateEbooks(defaults);
      setSelectedBookId(defaults[0]?.id || '');
      showToast('Reset catalog to defaults');
    }
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ebooks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jnj_ebook_catalog_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Catalog exported to JSON');
  };

  // Import JSON backup
  const handleImportJSON = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          saveStoredEbooks(parsed);
          onUpdateEbooks(parsed);
          setSelectedBookId(parsed[0].id);
          showToast('Imported catalog successfully');
        } else {
          alert('Invalid catalog JSON format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Auth unlock
  const handleUnlock = (e: FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === 'admin' || pinInput.trim() === '2026' || pinInput.trim() === 'jnj') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect PIN. (Hint: "admin" or click Instant Unlock)');
    }
  };

  // If locked, render clean unlock screen
  if (!isAuthenticated) {
    return (
      <div className="blueprint-grid min-h-screen py-20 px-8 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full shadow-lg text-center space-y-6">
          <div className="w-14 h-14 bg-slate-100 text-[#0A1628] rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">JNJ Publishing Admin</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter administrative credentials to manage catalog inventory, pricing, and cover designs.
            </p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              placeholder="Enter PIN (try 'admin')"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-sm tracking-widest px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
            />
            {authError && <p className="text-xs text-red-500">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-[#0A1628] hover:bg-black text-white text-xs font-semibold py-3 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
            >
              Verify PIN
            </button>
            <button
              type="button"
              onClick={() => setIsAuthenticated(true)}
              className="text-xs text-slate-500 hover:text-[#0A1628] underline cursor-pointer"
            >
              Demo 1-Click Instant Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="blueprint-grid min-h-screen pb-24">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A1628] text-white px-5 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-medium animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Admin Header Bar */}
      <section className="bg-[#101c2e] text-white px-8 py-6 border-b border-[#3b4758]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-semibold uppercase tracking-widest">
              <span>JNJ Executive Portal</span>
              <span>·</span>
              <span>Catalog Management</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white mt-1">
              Store & Publication Studio
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Control book inventory, configure dynamic pricing, and customize 3D cover designs in real time.
            </p>
          </div>

          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsGitHubModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <GitCommit className="w-3.5 h-3.5" />
              Commit to GitHub
            </button>

            <button
              onClick={onNavigateToShop}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              View Public Shop
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Playbook
            </button>
          </div>
        </div>
      </section>

      {/* KPI Overview Cards */}
      <section className="px-8 max-w-7xl mx-auto -mt-3 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Catalog SKUs
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-[#0A1628] tabular-nums">{totalBooks}</span>
              <span className="text-xs text-emerald-600 font-medium">{activeBooks} Active</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Units Distributed
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-[#0A1628] tabular-nums">{totalUnitsSold}</span>
              <span className="text-xs text-slate-500">Across All Volumes</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Physical/Limited Stock
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-[#0A1628] tabular-nums">{totalStockAvailable}</span>
              <span className="text-xs text-slate-500">Allocated Seats</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Stock Alerts
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-amber-600 tabular-nums">{lowStockCount}</span>
              <span className="text-xs text-amber-600 font-medium">Low Stock Volumes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Admin Tabbed Workspace */}
      <section className="px-8 max-w-7xl mx-auto mt-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 rounded-t-xl">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#0A1628] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              1. Inventory & Stock
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'pricing'
                  ? 'bg-[#0A1628] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              2. Pricing & Sales
            </button>

            <button
              onClick={() => setActiveTab('design')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'design'
                  ? 'bg-[#0A1628] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Palette className="w-4 h-4" />
              3. Book Design Studio
            </button>

            <button
              onClick={() => setActiveTab('content')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-[#0A1628] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              4. Chapters & Metadata
            </button>
          </div>

          {/* Catalog Utilities: Backup & Reset */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIsGitHubModalOpen(true)}
              title="Commit changes to GitHub repository"
              className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
            >
              <GitCommit className="w-3.5 h-3.5" />
              Commit to GitHub
            </button>

            <button
              onClick={handleExportJSON}
              title="Download backup JSON"
              className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-[#0A1628] px-2.5 py-1.5 rounded hover:bg-slate-100 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            <label
              title="Import JSON catalog"
              className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-[#0A1628] px-2.5 py-1.5 rounded hover:bg-slate-100 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              onClick={handleResetCatalog}
              title="Reset catalog to factory defaults"
              className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-red-600 px-2.5 py-1.5 rounded hover:bg-slate-100 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* TAB 1: INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Inventory & License Stock Control</h3>
                <p className="text-xs text-slate-500">
                  Update license availability, toggle unlimited digital copies, or adjust threshold statuses.
                </p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Publication</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Inventory Mode</th>
                    <th className="py-3 px-3">Stock Count</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Quick Stock Replenish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ebooks.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Publication */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-13 shrink-0">
                            <BookCoverVisual book={book} size="sm" interactive={false} />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block truncate max-w-xs sm:max-w-sm">
                              {book.title}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              By {book.author} · {book.salesCount || 0} sold
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {book.sku}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <select
                          value={book.category}
                          onChange={(e) => handleUpdateBook(book.id, { category: e.target.value as EbookCategory })}
                          className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-[#0A1628]"
                        >
                          <option value="Automation">Automation</option>
                          <option value="AI & Analytics">AI & Analytics</option>
                          <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                          <option value="Cybersecurity">Cybersecurity</option>
                          <option value="Operations">Operations</option>
                          <option value="Strategy">Strategy</option>
                        </select>
                      </td>

                      {/* Unlimited Toggle */}
                      <td className="py-3 px-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={book.isUnlimited}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              handleUpdateBook(book.id, {
                                isUnlimited: checked,
                                status: checked ? 'active' : (book.inventoryCount <= 10 ? 'low_stock' : 'active')
                              });
                            }}
                            className="rounded border-slate-300 text-[#0A1628] focus:ring-[#0A1628]"
                          />
                          <span className="text-xs text-slate-700">Unlimited Digital</span>
                        </label>
                      </td>

                      {/* Stock Count Field */}
                      <td className="py-3 px-3">
                        {book.isUnlimited ? (
                          <span className="font-mono text-slate-400 italic">∞ Unlimited</span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            value={book.inventoryCount}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              let newStatus = book.status;
                              if (val === 0) newStatus = 'sold_out';
                              else if (val <= 10) newStatus = 'low_stock';
                              else if (book.status === 'sold_out' || book.status === 'low_stock') newStatus = 'active';
                              handleUpdateBook(book.id, { inventoryCount: val, status: newStatus });
                            }}
                            className="w-20 font-mono text-xs px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
                          />
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <select
                          value={book.status}
                          onChange={(e) => handleUpdateBook(book.id, { status: e.target.value as EbookStatus })}
                          className={`text-xs font-semibold rounded px-2 py-1 border ${
                            book.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : book.status === 'low_stock'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : book.status === 'sold_out'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="low_stock">Low Stock</option>
                          <option value="sold_out">Sold Out</option>
                          <option value="preorder">Pre-Order</option>
                          <option value="draft">Draft (Hidden)</option>
                        </select>
                      </td>

                      {/* Quick Replenish Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const newCount = (book.isUnlimited ? 0 : book.inventoryCount) + 10;
                              handleUpdateBook(book.id, {
                                inventoryCount: newCount,
                                isUnlimited: false,
                                status: newCount <= 10 ? 'low_stock' : 'active'
                              });
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => {
                              const newCount = (book.isUnlimited ? 0 : book.inventoryCount) + 50;
                              handleUpdateBook(book.id, {
                                inventoryCount: newCount,
                                isUnlimited: false,
                                status: 'active'
                              });
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            +50
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id, book.title)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer ml-1"
                            title="Delete publication"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PRICING & PROMOTIONS */}
        {activeTab === 'pricing' && (
          <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-6 space-y-6">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">Price & Discount Manager</h3>
              <p className="text-xs text-slate-500">
                Configure regular prices, promotional sale prices, and toggle flash sales across the catalog.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ebooks.map((book) => {
                const currentPrice = book.isOnSale && book.salePrice ? book.salePrice : book.price;
                const savingsPct = book.salePrice && book.salePrice < book.price
                  ? Math.round(((book.price - book.salePrice) / book.price) * 100)
                  : 0;

                return (
                  <div key={book.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 shrink-0">
                        <BookCoverVisual book={book} size="sm" interactive={false} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-semibold text-xs text-slate-900 truncate">
                          {book.title}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-mono">{book.sku}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Regular Price */}
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                          Base Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={book.price}
                          onChange={(e) => handleUpdateBook(book.id, { price: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-[#0A1628]"
                        />
                      </div>

                      {/* Sale Price */}
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                          Promo Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={book.salePrice || ''}
                          placeholder="e.g. 29.00"
                          onChange={(e) => handleUpdateBook(book.id, { salePrice: parseFloat(e.target.value) || undefined })}
                          className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-[#0A1628]"
                        />
                      </div>
                    </div>

                    {/* Sale Active Switch */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={book.isOnSale}
                          onChange={(e) => handleUpdateBook(book.id, { isOnSale: e.target.checked })}
                          className="rounded border-slate-300 text-[#0A1628] focus:ring-[#0A1628]"
                        />
                        <span>Enable Sale Price</span>
                      </label>

                      {book.isOnSale && savingsPct > 0 && (
                        <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {savingsPct}% OFF
                        </span>
                      )}
                    </div>

                    {/* Multi-tier display */}
                    <div className="text-[11px] font-mono text-slate-500 pt-1 space-y-1 bg-white p-2.5 rounded border border-slate-200/60">
                      <div className="flex justify-between">
                        <span>Single Practitioner:</span>
                        <span className="font-semibold text-slate-800">${currentPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Team License (5-Seats):</span>
                        <span className="font-semibold text-slate-800">${(currentPrice * 2.5).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Enterprise Unlimited:</span>
                        <span className="font-semibold text-slate-800">${(currentPrice * 5.0).toFixed(2)}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BOOK DESIGN STUDIO (REAL-TIME COVER EDITOR) */}
        {activeTab === 'design' && selectedBook && (
          <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Live 3D Book Cover & Design Studio
                </h3>
                <p className="text-xs text-slate-500">
                  Customize colors, geometric motifs, badges, spine text, or artwork images with instant live preview.
                </p>
              </div>

              {/* Book Selector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Editing Volume:</span>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
                >
                  {ebooks.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Design Workspace Grid: Controls Left, Live 3D Preview Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Controls Column (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Cover Art Mode: High-Res Artwork vs Graphic Layout */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="font-mono text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    1. Cover Rendering Mode
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateDesign(selectedBook.id, { showCoverImage: true })}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        selectedBook.coverDesign?.showCoverImage
                          ? 'border-[#0A1628] bg-white shadow-xs'
                          : 'border-slate-200 bg-slate-100/60 text-slate-500'
                      }`}
                    >
                      <span className="font-semibold text-xs block text-slate-900">High-Res Artwork Cover</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">Use generated high-fidelity illustration</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateDesign(selectedBook.id, { showCoverImage: false })}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        !selectedBook.coverDesign?.showCoverImage
                          ? 'border-[#0A1628] bg-white shadow-xs'
                          : 'border-slate-200 bg-slate-100/60 text-slate-500'
                      }`}
                    >
                      <span className="font-semibold text-xs block text-slate-900">Custom Graphic Cover</span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">Use color palettes, patterns & typography</span>
                    </button>
                  </div>

                  {/* Artwork Image Upload & Presets */}
                  {selectedBook.coverDesign?.showCoverImage && (
                    <div className="pt-2">
                      <ImageUploader
                        currentImageUrl={selectedBook.coverImage || ''}
                        onImageSelected={(url) => {
                          handleUpdateBook(selectedBook.id, { coverImage: url });
                          handleUpdateDesign(selectedBook.id, { showCoverImage: true });
                        }}
                        onRemoveImage={() => handleUpdateBook(selectedBook.id, { coverImage: '' })}
                        label="Upload Cover Image / Select Artwork"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Color Theme Presets */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="font-mono text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    2. Color Scheme & Palette
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleUpdateDesign(selectedBook.id, {
                          theme: preset.id as any,
                          bgColor: preset.bg,
                          accentColor: preset.accent,
                          textColor: preset.text
                        })}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedBook.coverDesign?.theme === preset.id
                            ? 'border-[#0A1628] bg-white font-semibold shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                        }`}
                      >
                        <span 
                          className="w-4 h-4 rounded-full border border-black/10 shrink-0" 
                          style={{ backgroundColor: preset.bg }} 
                        />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Hex Codes */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Background</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedBook.coverDesign?.bgColor || '#0A1628'}
                          onChange={(e) => handleUpdateDesign(selectedBook.id, { theme: 'custom', bgColor: e.target.value })}
                          className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0"
                        />
                        <span className="text-[11px] font-mono text-slate-600">{selectedBook.coverDesign?.bgColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Accent</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedBook.coverDesign?.accentColor || '#38bdf8'}
                          onChange={(e) => handleUpdateDesign(selectedBook.id, { accentColor: e.target.value })}
                          className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0"
                        />
                        <span className="text-[11px] font-mono text-slate-600">{selectedBook.coverDesign?.accentColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Text</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedBook.coverDesign?.textColor || '#ffffff'}
                          onChange={(e) => handleUpdateDesign(selectedBook.id, { textColor: e.target.value })}
                          className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0"
                        />
                        <span className="text-[11px] font-mono text-slate-600">{selectedBook.coverDesign?.textColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Geometric Motifs & Patterns */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="font-mono text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    3. Geometric Cover Pattern
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PATTERN_OPTIONS.map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => handleUpdateDesign(selectedBook.id, { pattern: pat })}
                        className={`px-3 py-2 text-xs rounded-lg border text-left capitalize cursor-pointer transition-colors ${
                          selectedBook.coverDesign?.pattern === pat
                            ? 'border-[#0A1628] bg-white font-semibold text-slate-900 shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                        }`}
                      >
                        {pat.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Badges, Edition & Typography Labels */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="font-mono text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    4. Cover Copy & Badges
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={selectedBook.badgeText || ''}
                        placeholder="e.g. Bestseller, Field Edition"
                        onChange={(e) => handleUpdateBook(selectedBook.id, { badgeText: e.target.value })}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Edition Line</label>
                      <input
                        type="text"
                        value={selectedBook.edition || ''}
                        placeholder="e.g. 2026 Edition"
                        onChange={(e) => handleUpdateBook(selectedBook.id, { edition: e.target.value })}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Spine Text</label>
                      <input
                        type="text"
                        value={selectedBook.coverDesign?.spineText || ''}
                        placeholder="e.g. TITLE — AUTHOR"
                        onChange={(e) => handleUpdateDesign(selectedBook.id, { spineText: e.target.value })}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Live 3D Book Preview Column (5 cols) */}
              <div className="lg:col-span-5 sticky top-24 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center">
                <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 mb-6">
                  <span className="font-mono text-xs uppercase font-bold text-slate-500 tracking-wider">
                    Live Realistic 3D Mockup
                  </span>
                  <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                    Dynamic Sync
                  </span>
                </div>

                {/* 3D Book Mockup Display */}
                <div className="w-64 max-w-full drop-shadow-2xl">
                  <BookCoverVisual book={selectedBook} size="lg" interactive={true} />
                </div>

                <div className="w-full mt-6 text-center space-y-1">
                  <p className="font-display font-bold text-sm text-slate-900">{selectedBook.title}</p>
                  <p className="text-xs text-slate-500">By {selectedBook.author}</p>
                  <p className="font-mono text-xs font-semibold text-[#0A1628] mt-2">
                    Listed in Shop at ${selectedBook.isOnSale && selectedBook.salePrice ? selectedBook.salePrice.toFixed(2) : selectedBook.price.toFixed(2)}
                  </p>
                </div>

                <div className="w-full mt-6 pt-4 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => {
                      // Duplicate design to other books
                      alert(`Design copied for "${selectedBook.title}". Changes are permanently saved.`);
                    }}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold py-2 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    Confirm Design
                  </button>
                  <button
                    onClick={onNavigateToShop}
                    className="flex-1 bg-[#0A1628] hover:bg-black text-white text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    View in Store
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 4: CHAPTERS & METADATA EDITOR */}
        {activeTab === 'content' && selectedBook && (
          <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Chapters, Samples & Deliverable Resources
                </h3>
                <p className="text-xs text-slate-500">
                  Update table of contents, sample excerpts for the reader modal, and downloadable toolkit assets.
                </p>
              </div>

              {/* Book Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Publication:</span>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A1628]"
                >
                  {ebooks.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Basic Metadata & Descriptions */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Book Title</label>
                  <input
                    type="text"
                    value={selectedBook.title}
                    onChange={(e) => handleUpdateBook(selectedBook.id, { title: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={selectedBook.subtitle}
                    onChange={(e) => handleUpdateBook(selectedBook.id, { subtitle: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Author Byline</label>
                  <input
                    type="text"
                    value={selectedBook.author}
                    onChange={(e) => handleUpdateBook(selectedBook.id, { author: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Total Pages</label>
                    <input
                      type="number"
                      value={selectedBook.pages}
                      onChange={(e) => handleUpdateBook(selectedBook.id, { pages: parseInt(e.target.value) || 100 })}
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Publication Year</label>
                    <input
                      type="text"
                      value={selectedBook.publishedYear}
                      onChange={(e) => handleUpdateBook(selectedBook.id, { publishedYear: e.target.value })}
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Executive Summary Description</label>
                  <textarea
                    rows={4}
                    value={selectedBook.description}
                    onChange={(e) => handleUpdateBook(selectedBook.id, { description: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                  />
                </div>
              </div>

              {/* Right Column: Table of Contents & Deliverable Assets */}
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="font-mono text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Table of Contents Chapters
                  </span>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedBook.tableOfContents?.map((toc, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={toc.chapter}
                          onChange={(e) => {
                            const newToc = [...selectedBook.tableOfContents];
                            newToc[idx].chapter = e.target.value;
                            handleUpdateBook(selectedBook.id, { tableOfContents: newToc });
                          }}
                          className="w-14 text-xs font-mono px-2 py-1 bg-white border border-slate-300 rounded"
                        />
                        <input
                          type="text"
                          value={toc.title}
                          onChange={(e) => {
                            const newToc = [...selectedBook.tableOfContents];
                            newToc[idx].title = e.target.value;
                            handleUpdateBook(selectedBook.id, { tableOfContents: newToc });
                          }}
                          className="flex-1 text-xs px-2 py-1 bg-white border border-slate-300 rounded"
                        />
                        <input
                          type="text"
                          value={toc.pages}
                          onChange={(e) => {
                            const newToc = [...selectedBook.tableOfContents];
                            newToc[idx].pages = e.target.value;
                            handleUpdateBook(selectedBook.id, { tableOfContents: newToc });
                          }}
                          className="w-16 text-xs font-mono px-2 py-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newToc = [...(selectedBook.tableOfContents || [])];
                      const nextNum = String(newToc.length + 1).padStart(2, '0');
                      newToc.push({ chapter: nextNum, title: 'New Strategic Section', pages: '1-30' });
                      handleUpdateBook(selectedBook.id, { tableOfContents: newToc });
                    }}
                    className="text-xs text-[#0A1628] font-semibold hover:underline cursor-pointer flex items-center gap-1 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Chapter
                  </button>
                </div>

                {/* Included Digital Deliverables */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="font-mono text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Bonus Digital Resources Included
                  </span>
                  <div className="space-y-1.5">
                    {selectedBook.includedAssets?.map((asset, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={asset}
                          onChange={(e) => {
                            const newAssets = [...selectedBook.includedAssets];
                            newAssets[idx] = e.target.value;
                            handleUpdateBook(selectedBook.id, { includedAssets: newAssets });
                          }}
                          className="flex-1 text-xs px-2 py-1 bg-white border border-slate-300 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newAssets = selectedBook.includedAssets.filter((_, i) => i !== idx);
                            handleUpdateBook(selectedBook.id, { includedAssets: newAssets });
                          }}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newAssets = [...(selectedBook.includedAssets || [])];
                      newAssets.push('New Downloadable Asset Toolkit');
                      handleUpdateBook(selectedBook.id, { includedAssets: newAssets });
                    }}
                    className="text-xs text-[#0A1628] font-semibold hover:underline cursor-pointer flex items-center gap-1 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Deliverable
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </section>

      {/* CREATE NEW BOOK MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-display font-bold text-lg text-slate-900">Add New Ebook Publication</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="e.g. AI-Driven Logistics in the Midwest"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Subtitle</label>
                <input
                  type="text"
                  value={newBookSubtitle}
                  onChange={(e) => setNewBookSubtitle(e.target.value)}
                  placeholder="e.g. A Practical Framework for Small Freight Operators"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Author</label>
                  <input
                    type="text"
                    value={newBookAuthor}
                    onChange={(e) => setNewBookAuthor(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newBookCategory}
                    onChange={(e) => setNewBookCategory(e.target.value as EbookCategory)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628] bg-white"
                  >
                    <option value="Automation">Automation</option>
                    <option value="AI & Analytics">AI & Analytics</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Operations">Operations</option>
                    <option value="Strategy">Strategy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBookPrice}
                    onChange={(e) => setNewBookPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    disabled={newBookUnlimited}
                    value={newBookStock}
                    onChange={(e) => setNewBookStock(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A1628] disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newBookUnlimited}
                    onChange={(e) => setNewBookUnlimited(e.target.checked)}
                    className="rounded border-slate-300 text-[#0A1628] focus:ring-[#0A1628]"
                  />
                  <span>Unlimited Digital License Stock</span>
                </label>
              </div>

              {/* Cover Image Upload */}
              <div className="pt-2 border-t border-slate-200">
                <ImageUploader
                  currentImageUrl={newBookCoverImage}
                  onImageSelected={(url) => setNewBookCoverImage(url)}
                  onRemoveImage={() => setNewBookCoverImage('')}
                  label="Upload Book Cover Image (Optional)"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#0A1628] hover:bg-black text-white rounded-lg uppercase tracking-wider"
                >
                  Publish Publication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GITHUB COMMIT & DEPLOY MODAL */}
      <GitHubCommitModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        ebooks={ebooks}
        onCommitSuccess={() => showToast('Committed & deployed to GitHub!')}
      />

    </div>
  );
}
