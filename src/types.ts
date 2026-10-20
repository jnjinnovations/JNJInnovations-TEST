export interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'system';
  message: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  nodeName: string;
  description: string;
  longDescription: string;
  iconName: string;
}

export interface ConsultingPhase {
  number: string;
  title: string;
  shortDesc: string;
  duration: string;
  deliverables: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ContactFormInput {
  name: string;
  email: string;
  businessName: string;
  serviceOfInterest: string;
  message: string;
}

// ============================================
// E-BOOK SHOP & ADMIN TYPES
// ============================================

export type EbookCategory = 
  | 'Automation' 
  | 'AI & Analytics' 
  | 'Cloud Infrastructure' 
  | 'Cybersecurity' 
  | 'Operations' 
  | 'Strategy';

export type EbookStatus = 'active' | 'low_stock' | 'sold_out' | 'preorder' | 'draft';

export interface ChapterOutline {
  chapter: string;
  title: string;
  pages: string;
}

export interface SamplePageExcerpt {
  chapterTitle: string;
  pageNumber: number;
  text: string;
}

export interface CoverDesignConfig {
  theme: 'navy' | 'charcoal' | 'emerald' | 'crimson' | 'amethyst' | 'steel' | 'custom';
  bgColor: string;
  accentColor: string;
  textColor: string;
  pattern: 'blueprint-grid' | 'neural-network' | 'geometric-cubes' | 'circuit-matrix' | 'minimalist-rule' | 'shield';
  showCoverImage: boolean;
  spineText?: string;
}

export interface EbookItem {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  price: number;
  salePrice?: number;
  isOnSale: boolean;
  category: EbookCategory;
  inventoryCount: number;
  isUnlimited: boolean;
  status: EbookStatus;
  format: string[];
  pages: number;
  publishedYear: string;
  edition: string;
  badgeText?: string;
  description: string;
  longDescription: string;
  tableOfContents: ChapterOutline[];
  sampleContent: SamplePageExcerpt[];
  includedAssets: string[];
  coverImage: string;
  coverDesign: CoverDesignConfig;
  rating: number;
  reviewCount: number;
  salesCount: number;
  sku: string;
}

export type LicenseTier = 'standard' | 'team_5' | 'enterprise_unlimited';

export interface CartItem {
  ebook: EbookItem;
  quantity: number;
  licenseTier: LicenseTier;
}

export interface OrderItem {
  bookId: string;
  title: string;
  price: number;
  licenseTier: LicenseTier;
  quantity: number;
}

export interface OrderConfirmation {
  id: string;
  date: string;
  customerName: string;
  customerEmail: string;
  companyName?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  downloadToken: string;
}
