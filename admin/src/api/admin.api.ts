import api from './client';
import {
  AdminUser,
  Book,
  Category,
  Chapter,
  Page,
  Order,
  Review,
  DashboardStats,
  MonthlySalesPoint,
  BlogPost,
} from '../types';

export const adminApi = {
  // Auth
  login: (data: any) =>
    api.post<{ success: boolean; token: string; user: AdminUser; message: string }>('/auth/login', data),
  getMe: () => api.get<{ success: boolean; user: AdminUser }>('/auth/me'),
  logout: () => api.post<{ success: boolean; message: string }>('/auth/logout'),

  // Overview Analytics
  getOverview: () =>
    api.get<{
      success: boolean;
      data: {
        stats: DashboardStats;
        salesChart: MonthlySalesPoint[];
        topBooks: Array<{ book: Book; salesCount: number; totalRevenue: number }>;
        recentOrders: Order[];
        recentUsers: AdminUser[];
      };
    }>('/admin/overview'),

  // Books
  getBooks: (params?: any) =>
    api.get<{
      success: boolean;
      data: Book[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/books', { params: { ...params, status: params?.status || '' } }),
  createBook: (formData: FormData) =>
    api.post<{ success: boolean; message: string; data: Book }>('/books', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateBook: (id: string, formData: FormData) =>
    api.patch<{ success: boolean; message: string; data: Book }>(`/books/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  indexBook: (id: string, document: File) => {
    const formData = new FormData();
    formData.append('document', document);
    return api.post<{ success: boolean; data: { status: string; passageCount: number; filename: string } }>(
      `/ai/books/${id}/index`, formData, { headers: { 'Content-Type': undefined } },
    );
  },
  getBookIndexStatus: (id: string) =>
    api.get<{ success: boolean; data: { status: string; lastError?: string; filename?: string; passageCount?: number; completedAt?: string } }>(`/ai/books/${id}/index-status`),
  deleteBook: (id: string) => api.delete<{ success: boolean; message: string }>(`/books/${id}`),
  toggleBookStatus: (id: string, status: string) =>
    api.patch<{ success: boolean; message: string; data: Book }>(`/books/${id}/status`, { status }),

  // Chapters
  getChapters: (bookId: string) =>
    api.get<{ success: boolean; data: Chapter[] }>(`/chapters/book/${bookId}`),
  createChapter: (bookId: string, data: any) =>
    api.post<{ success: boolean; message: string; data: Chapter }>(`/chapters/book/${bookId}`, data),
  updateChapter: (id: string, data: any) =>
    api.patch<{ success: boolean; message: string; data: Chapter }>(`/chapters/${id}`, data),
  deleteChapter: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/chapters/${id}`),
  reorderChapters: (bookId: string, chapterOrders: Array<{ id: string; order: number }>) =>
    api.patch<{ success: boolean; message: string; data: Chapter[] }>(`/chapters/reorder/${bookId}`, {
      chapterOrders,
    }),

  // Pages
  getPages: (chapterId: string) =>
    api.get<{ success: boolean; data: Page[] }>(`/pages/chapter/${chapterId}`),
  createPage: (chapterId: string, data: any) =>
    api.post<{ success: boolean; message: string; data: Page }>(`/pages/chapter/${chapterId}`, data),
  updatePage: (id: string, data: any) =>
    api.patch<{ success: boolean; message: string; data: Page }>(`/pages/${id}`, data),
  deletePage: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/pages/${id}`),

  // Categories
  getCategories: () => api.get<{ success: boolean; data: Category[] }>('/categories'),
  createCategory: (data: any) =>
    api.post<{ success: boolean; message: string; data: Category }>('/categories', data),
  updateCategory: (id: string, data: any) =>
    api.patch<{ success: boolean; message: string; data: Category }>(`/categories/${id}`, data),
  deleteCategory: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/categories/${id}`),

  // Orders
  getOrders: (params?: any) =>
    api.get<{
      success: boolean;
      data: Order[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/orders/admin', { params }),

  // Users
  getUsers: (params?: any) =>
    api.get<{
      success: boolean;
      data: AdminUser[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/admin/users', { params }),
  toggleUserStatus: (id: string, status: string) =>
    api.patch<{ success: boolean; message: string; data: AdminUser }>(`/admin/users/${id}/status`, {
      status,
    }),

  // Reviews
  getReviews: (params?: any) =>
    api.get<{
      success: boolean;
      data: Review[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/reviews/admin', { params }),
  deleteReview: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/reviews/${id}`),

  // Blogs
  getBlogs: () =>
    api.get<{
      success: boolean;
      data: BlogPost[];
      stats: { total: number; published: number; drafts: number; totalViews: number };
    }>('/blogs/admin/all'),
  createBlog: (data: any) =>
    api.post<{ success: boolean; message: string; data: BlogPost }>('/blogs', data),
  updateBlog: (id: string, data: any) =>
    api.put<{ success: boolean; message: string; data: BlogPost }>(`/blogs/${id}`, data),
  deleteBlog: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/blogs/${id}`),
};
