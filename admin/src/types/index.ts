export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  status: 'active' | 'disabled';
  ordersCount?: number;
  totalSpent?: number;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isFeatured: boolean;
  bookCount?: number;
}

export interface Book {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  author: string;
  authorBio?: string;
  description: string;
  coverImage: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: Category | string;
  language: string;
  isbn?: string;
  publicationDate?: string;
  pageCount: number;
  previewPages: number;
  previewPercentage: number;
  status: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
  isPopular: boolean;
  isNewRelease: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  _id: string;
  book: string;
  title: string;
  order: number;
  description?: string;
  pageCount?: number;
  pages?: Page[];
}

export interface Page {
  _id: string;
  book: string;
  chapter: string | Chapter;
  pageNumber: number;
  chapterPageNumber: number;
  title?: string;
  content: string;
  wordCount?: number;
}

export interface OrderItem {
  book: Book | { title: string; coverImage: string; price: number };
  title: string;
  price: number;
  coverImage: string;
}

export interface Order {
  _id: string;
  user: AdminUser;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionReference: string;
  accessGranted: boolean;
  paidAt?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  user: AdminUser;
  book: Book;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  isModerated: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  totalUsers: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  currency: string;
  reviewsCount: number;
}

export interface MonthlySalesPoint {
  month: string;
  year: number;
  revenue: number;
  orders: number;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  readTimeMinutes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}
