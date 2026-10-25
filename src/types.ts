export type EbookCategory = 
  | 'Automation' 
  | 'Cloud & Infrastructure' 
  | 'Cloud Infrastructure'
  | 'Cybersecurity' 
  | 'AI & Analytics' 
  | 'Leadership & Operations'
  | 'Operations'
  | 'Strategy';

export type EbookStatus = 'active' | 'low_stock' | 'sold_out' | 'preorder' | 'draft';

export type LicenseTier = 'standard' | 'team_5' | 'enterprise_unlimited';

export interface CoverDesignConfig {
  theme: string;
  bgColor: string;
  accentColor: string;
  textColor: string;
  pattern: 'blueprint-grid' | 'neural-network' | 'geometric-cubes' | 'circuit-matrix' | 'minimalist-rule' | 'shield';
  showCoverImage: boolean;
  spineText?: string;
}

export interface EbookItem {
  id: string;
  sku: string;
  title: string;
  subtitle: string;
  author: string;
  price: number;
  salePrice?: number;
  originalPrice?: number;
  isOnSale?: boolean;
  category: EbookCategory;
  inventoryCount: number;
  isUnlimited?: boolean;
  status: EbookStatus;
  format: string[];
  pages: number;
  publishedYear: string;
  edition: string;
  badgeText?: string;
  description: string;
  longDescription: string;
  tableOfContents: { chapter: string; title: string; pages: string }[];
  sampleContent: { chapterTitle: string; pageNumber: number; text: string }[];
  includedAssets: string[];
  coverImage?: string;
  coverDesign?: CoverDesignConfig;
  rating: number;
  reviewCount: number;
  salesCount: number;
}

export interface CartItem {
  ebook: EbookItem;
  quantity: number;
  licenseTier: LicenseTier;
}

export interface OrderConfirmation {
  id: string;
  orderId?: string;
  date: string;
  timestamp?: string;
  customerName: string;
  customerEmail: string;
  companyName?: string;
  items: { bookId: string; title: string; quantity: number; price: number; licenseTier?: LicenseTier }[];
  subtotal?: number;
  discount?: number;
  total?: number;
  totalAmount?: number;
  downloadToken: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: 'system' | 'success' | 'info' | 'warn' | 'error' | string;
  message: string;
}

