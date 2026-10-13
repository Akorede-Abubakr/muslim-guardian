import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import { Book, Category } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  Eye,
  Check,
  Star,
  Sparkles,
  ExternalLink,
  Upload,
} from 'lucide-react';

export const BooksManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    author: '',
    authorBio: '',
    description: '',
    category: '',
    price: 0,
    originalPrice: 0,
    language: 'English',
    previewPages: 5,
    previewPercentage: 15,
    isFeatured: false,
    isPopular: false,
    isNewRelease: false,
    tags: '',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await adminApi.getCategories();
      return res.data?.data || [];
    },
  });

  // Fetch Books
  const { data: booksData, isLoading, isError, refetch } = useQuery({
    queryKey: ['adminBooks', searchTerm, selectedCategory, selectedStatus, page],
    queryFn: async () => {
      const res = await adminApi.getBooks({
        q: searchTerm,
        category: selectedCategory,
        status: selectedStatus,
        sortBy: 'newest',
        page,
        limit: 12,
      });
      return res.data;
    },
  });

  // Create / Update Mutation
  const saveBookMutation = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('subtitle', formData.subtitle);
      data.append('author', formData.author);
      data.append('authorBio', formData.authorBio);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('price', String(formData.price));
      if (formData.originalPrice) {
        data.append('originalPrice', String(formData.originalPrice));
      }
      data.append('language', formData.language);
      data.append('previewPages', String(formData.previewPages));
      data.append('previewPercentage', String(formData.previewPercentage));
      data.append('isFeatured', String(formData.isFeatured));
      data.append('isPopular', String(formData.isPopular));
      data.append('isNewRelease', String(formData.isNewRelease));
      data.append('tags', formData.tags);

      if (coverFile) {
        data.append('coverImage', coverFile);
      }

      if (editingBook) {
        const saved = await adminApi.updateBook(editingBook._id, data);
        if (manuscriptFile) {
          try {
            await adminApi.indexBook(saved.data.data._id, manuscriptFile);
            return { saved, intelligenceMessage: 'Book saved and manuscript indexed for LightBridge AI.' };
          } catch (error: any) {
            return { saved, intelligenceMessage: `Book saved, but manuscript indexing failed: ${error.response?.data?.message || 'please retry the upload.'}` };
          }
        }
        return { saved, intelligenceMessage: '' };
      } else {
        const saved = await adminApi.createBook(data);
        if (manuscriptFile) {
          try {
            await adminApi.indexBook(saved.data.data._id, manuscriptFile);
            return { saved, intelligenceMessage: 'Book created and manuscript indexed for LightBridge AI.' };
          } catch (error: any) {
            return { saved, intelligenceMessage: `Book created, but manuscript indexing failed: ${error.response?.data?.message || 'please retry the upload.'}` };
          }
        }
        return { saved, intelligenceMessage: '' };
      }
    },
    onSuccess: (result) => {
      if (!editingBook) {
        setPage(1);
        setSearchTerm('');
        setSelectedCategory('');
        setSelectedStatus('');
      }
      queryClient.invalidateQueries({ queryKey: ['adminBooks'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
      if (result.intelligenceMessage) alert(result.intelligenceMessage);
      closeModal();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to save book');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.deleteBook(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBooks'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
      setIsDeleteModalOpen(false);
      setBookToDelete(null);
    },
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return adminApi.toggleBookStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBooks'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      subtitle: '',
      author: '',
      authorBio: '',
      description: '',
      category: categoriesData?.[0]?._id || '',
      price: 19.99,
      originalPrice: 29.99,
      language: 'English',
      previewPages: 5,
      previewPercentage: 15,
      isFeatured: false,
      isPopular: false,
      isNewRelease: true,
      tags: 'Islamic Studies, Spirituality, Faith',
    });
    setCoverFile(null);
    setCoverPreview('');
    setManuscriptFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      subtitle: book.subtitle || '',
      author: book.author,
      authorBio: book.authorBio || '',
      description: book.description,
      category: typeof book.category === 'object' ? book.category._id : book.category,
      price: book.price,
      originalPrice: book.originalPrice || 0,
      language: book.language || 'English',
      previewPages: book.previewPages || 5,
      previewPercentage: book.previewPercentage || 15,
      isFeatured: book.isFeatured || false,
      isPopular: book.isPopular || false,
      isNewRelease: book.isNewRelease || false,
      tags: book.tags?.join(', ') || '',
    });
    setCoverPreview(book.coverImage || '');
    setCoverFile(null);
    setManuscriptFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
    setCoverFile(null);
    setCoverPreview('');
    setManuscriptFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const books = booksData?.data || [];
  const pagination = booksData?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages || 1);
  useEffect(() => {
    if (pagination && page > totalPages) setPage(totalPages);
  }, [pagination, page, totalPages]);
  const firstPage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => firstPage + i);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#202522] dark:text-white">
            Books Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#202522]/60 dark:text-gray-400 mt-1">
            Manage your digital library, pricing, preview limits, and publications
          </p>
        </div>
        <Button onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
          Add New Book
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#0E2622] rounded-2xl p-4 border border-[#DDE8E1] dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, author..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#123C35]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:outline-none"
          >
            <option value="">All Categories</option>
            {categoriesData?.map((cat: Category) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white dark:bg-[#0E2622] rounded-2xl border border-[#DDE8E1] dark:border-white/10 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#123C35] dark:border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div role="alert" className="p-6 text-center">
            <p>Could not load your books.</p>
            <Button onClick={() => void refetch()} className="mt-3" size="sm">Retry</Button>
          </div>
        ) : books.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50/80 dark:bg-white/5 text-[11px] uppercase tracking-wider text-[#202522]/60 dark:text-gray-400 border-b border-[#DDE8E1] dark:border-white/10">
                <tr>
                  <th className="py-3 px-6">Book</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Price</th>
                  <th className="py-3 px-6">Preview Access</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE8E1] dark:divide-white/10 text-xs">
                {books.map((book) => {
                  const categoryName =
                    typeof book.category === 'object' && book.category
                      ? (book.category as Category).name
                      : 'Uncategorized';

                  return (
                    <tr
                      key={book._id}
                      className="hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* Book Details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={book.coverImage || '/placeholder-book.jpg'}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded-lg shadow-sm border border-[#DDE8E1] dark:border-white/10 flex-shrink-0"
                          />
                          <div>
                            <div className="font-serif font-bold text-sm text-[#202522] dark:text-white line-clamp-1">
                              {book.title}
                            </div>
                            <div className="text-[11px] text-[#202522]/60 dark:text-gray-400">
                              By {book.author}
                            </div>
                            <div className="mt-1 text-[11px] text-[#202522]/60 dark:text-gray-400">
                              {book.pageCount ? `${book.pageCount} reading pages` : 'Manuscript needed for reading'}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              {book.isFeatured && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#C6A15B]/20 text-[#8A6D37] dark:text-[#E9D6AF]">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  Featured
                                </span>
                              )}
                              {book.isPopular && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Popular
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6 text-[#202522] dark:text-gray-300 font-medium">
                        {categoryName}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#123C35] dark:text-[#C6A15B]">
                          ${book.price.toFixed(2)}
                        </div>
                        {book.originalPrice && book.originalPrice > book.price && (
                          <div className="text-[10px] text-gray-400 line-through">
                            ${book.originalPrice.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Preview Limit */}
                      <td className="py-4 px-6">
                        <div className="text-[#202522] dark:text-gray-300">
                          {book.previewPages || 5} pages
                        </div>
                        <div className="text-[10px] text-gray-400">
                          ({book.previewPercentage || 15}% preview)
                        </div>
                      </td>

                      {/* Status switch */}
                      <td className="py-4 px-6">
                        <select
                          value={book.status}
                          onChange={(e) =>
                            toggleStatusMutation.mutate({
                              id: book._id,
                              status: e.target.value,
                            })
                          }
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${
                            book.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : book.status === 'draft'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10'
                          }`}
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Manuscript Studio Link */}
                          <button
                            onClick={() => navigate(`/content-editor?bookId=${book._id}`)}
                            title="Edit Chapters & Pages"
                            className="p-1.5 rounded-lg text-[#123C35] dark:text-[#C6A15B] hover:bg-[#DDE8E1]/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Edit book metadata */}
                          <button
                            onClick={() => handleOpenEdit(book)}
                            title="Edit Book Details"
                            className="p-1.5 rounded-lg text-[#202522] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete book */}
                          <button
                            onClick={() => {
                              setBookToDelete(book);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete Book"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm text-[#202522]/60 dark:text-gray-400">
              No books found matching your criteria.
            </p>
            <Button onClick={handleOpenCreate} className="mt-4" size="sm">
              Add your first book
            </Button>
          </div>
        )}
      </div>

      {pagination && !isError && (
        <nav aria-label="Book catalog pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span aria-live="polite">{pagination.total} books · Page {page} of {totalPages}</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage(page - 1)}>Previous</Button>
            {pageNumbers.map(number => (
              <button key={number} type="button" aria-label={`Page ${number}`} aria-current={number === page ? 'page' : undefined}
                onClick={() => setPage(number)} disabled={isLoading}
                className={`rounded-lg border px-3 py-2 ${number === page ? 'bg-[#123C35] text-white' : 'bg-white text-[#123C35] dark:bg-[#0E2622] dark:text-white'}`}>
                {number}
              </button>
            ))}
            <Button size="sm" disabled={page >= totalPages || isLoading} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </nav>
      )}

      {/* Create / Edit Book Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBook ? 'Edit Book Manuscript' : 'Create New Book'}
        subtitle="Specify metadata, pricing, preview limits, and upload editorial covers"
        maxWidth="3xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveBookMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
                Book Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:ring-2 focus:ring-[#123C35]"
                placeholder="e.g. The Radiant Journey"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:ring-2 focus:ring-[#123C35]"
                placeholder="e.g. A Deep Contemplation of Divine Grace"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
                Author Name *
              </label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:ring-2 focus:ring-[#123C35]"
                placeholder="e.g. Sheikh Hamza Yusuf"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:ring-2 focus:ring-[#123C35]"
              >
                <option value="">Select Category</option>
                {categoriesData?.map((cat: Category) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
                Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:ring-2 focus:ring-[#123C35]"
              />
            </div>

            {/* Original Price */}
            <div>
              <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
                Original Strikethrough Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    originalPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:ring-2 focus:ring-[#123C35]"
              />
            </div>

            {/* Preview Pages */}
            <div>
              <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
                Max Preview Pages (Unpurchased)
              </label>
              <input
                type="number"
                value={formData.previewPages}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    previewPages: parseInt(e.target.value, 10) || 5,
                  })
                }
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white"
              />
            </div>

            {/* Preview Percentage */}
            <div>
              <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
                Preview Percentage (%)
              </label>
              <input
                type="number"
                value={formData.previewPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    previewPercentage: parseInt(e.target.value, 10) || 15,
                  })
                }
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
              Book Description *
            </label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:ring-2 focus:ring-[#123C35]"
              placeholder="Describe the content, context, and spiritual benefits..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
              Search Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white"
              placeholder="Spiritual, Quranic Studies, Tafsir"
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
              Book Cover Image
            </label>
            <div className="flex items-center gap-4">
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Cover Preview"
                  className="w-16 h-24 object-cover rounded-lg border border-[#DDE8E1] dark:border-white/10"
                />
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-xs font-medium text-[#202522] dark:text-white hover:bg-[#DDE8E1]/50">
                <Upload className="w-4 h-4 text-[#C6A15B]" />
                <span>Upload Cover Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
              Book manuscript for LightBridge AI (PDF, DOCX, or DOC)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (file && file.size > 50 * 1024 * 1024) {
                  setManuscriptFile(null);
                  alert('Manuscripts must be 50 MB or smaller.');
                  event.currentTarget.value = '';
                  return;
                }
                setManuscriptFile(file);
              }}
              className="block w-full text-xs text-[#202522] dark:text-white file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-xs dark:file:bg-white/10"
            />
            <p className="mt-1 text-[11px] text-stone-500 dark:text-gray-400">
              Upload a PDF to preserve the original page layout, fonts, and images. Word files require LibreOffice on the backend; exporting to PDF from Word preserves your layout most accurately. Uploading replaces this book’s pages and updates its AI index. Scanned PDFs need OCR first. Maximum 50 MB.
              {manuscriptFile ? ` Selected: ${manuscriptFile.name}` : ''}
            </p>
          </div>

          {/* Badges and Highlights checkboxes */}
          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs text-[#202522] dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) =>
                  setFormData({ ...formData, isFeatured: e.target.checked })
                }
                className="rounded text-[#123C35] focus:ring-[#123C35]"
              />
              Mark as Featured (Hero spotlight)
            </label>

            <label className="flex items-center gap-2 text-xs text-[#202522] dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) =>
                  setFormData({ ...formData, isPopular: e.target.checked })
                }
                className="rounded text-[#123C35] focus:ring-[#123C35]"
              />
              Mark as Popular
            </label>

            <label className="flex items-center gap-2 text-xs text-[#202522] dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNewRelease}
                onChange={(e) =>
                  setFormData({ ...formData, isNewRelease: e.target.checked })
                }
                className="rounded text-[#123C35] focus:ring-[#123C35]"
              />
              Mark as New Release
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE8E1] dark:border-white/10">
            <Button variant="ghost" type="button" onClick={closeModal} size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={saveBookMutation.isPending}
            >
              {editingBook ? 'Save Changes' : 'Create Book'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Book"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#202522]/80 dark:text-gray-300 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-rose-600 font-bold">
              {bookToDelete?.title}
            </strong>
            ? All chapters, pages, and manuscript data will be removed.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE8E1] dark:border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => bookToDelete && deleteMutation.mutate(bookToDelete._id)}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
