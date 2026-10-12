import React, { useState } from 'react';
import { frontendUrl } from '../api/config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';
import { BlogPost } from '../types';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  Newspaper,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Eye,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  FileText,
  Tag,
  User,
  Image as ImageIcon,
  BookOpen,
} from 'lucide-react';

const CATEGORIES = [
  'Faith & Spirituality',
  'Quranic Reflections',
  'Daily Living & Adab',
  'History & Civilization',
  'Family & Society',
  'Islamic Ethics',
];

const PRESET_COVERS = [
  { label: 'Mosque Architecture', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Noble Quran & Light', url: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Islamic Geometry', url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Dawn Desert Serenity', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Reflective Reading', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80' },
];

export const BlogsManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<BlogPost | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: PRESET_COVERS[0].url,
    category: CATEGORIES[0],
    tags: 'Islam, Spirituality, Guidance',
    author: 'Living in the Light Editorial',
    isPublished: true,
    readTimeMinutes: 5,
  });

  const { data: blogResponse, isLoading, error } = useQuery({
    queryKey: ['adminBlogs'],
    queryFn: async () => {
      const res = await adminApi.getBlogs();
      return res.data;
    },
  });

  const blogs: BlogPost[] = blogResponse?.data || [];
  const stats = blogResponse?.stats || {
    total: blogs.length,
    published: blogs.filter((b) => b.isPublished).length,
    drafts: blogs.filter((b) => !b.isPublished).length,
    totalViews: blogs.reduce((acc, b) => acc + (b.views || 0), 0),
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        readTimeMinutes: Number(formData.readTimeMinutes) || 5,
      };

      if (editingBlog) {
        return adminApi.updateBlog(editingBlog._id, payload);
      } else {
        return adminApi.createBlog(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogs'] });
      closeModal();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to save blog post');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.deleteBlog(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogs'] });
      setIsDeleteModalOpen(false);
      setBlogToDelete(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete blog post');
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      return adminApi.updateBlog(id, { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogs'] });
    },
  });

  const openCreateModal = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: PRESET_COVERS[0].url,
      category: CATEGORIES[0],
      tags: 'Faith, Guidance, Daily Living',
      author: 'Living in the Light Editorial',
      isPublished: true,
      readTimeMinutes: 5,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      coverImage: blog.coverImage || PRESET_COVERS[0].url,
      category: blog.category || CATEGORIES[0],
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
      author: blog.author || 'Living in the Light Editorial',
      isPublished: blog.isPublished,
      readTimeMinutes: blog.readTimeMinutes || 5,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBlog(null);
  };

  // Filter blogs
  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.author && b.author.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'All' || b.category === selectedCategoryFilter;

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Published' && b.isPublished) ||
      (statusFilter === 'Draft' && !b.isPublished);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#077432]/10 via-[#077432]/5 to-transparent p-6 rounded-2xl border border-[#077432]/20 dark:border-[#C6A15B]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#077432] text-white">
              <Newspaper className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#077432] dark:text-[#C6A15B] font-bold">
              Editorial Studio
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
            My Blog & Article Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
            Compose and publish authentic Islamic reflections, scholarly insights, and beneficial guides for readers across the globe.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.open(`${frontendUrl}/blog`, '_blank', 'noopener,noreferrer')}
            variant="outline"
            className="border-[#077432]/30 text-[#077432] dark:text-[#C6A15B] hover:bg-[#077432]/10"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Live Blog
          </Button>
          <Button
            onClick={openCreateModal}
            className="bg-[#077432] hover:bg-[#065F29] text-white shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Write New Article
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#122A25] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Posts</span>
            <BookOpen className="w-4 h-4 text-[#077432] dark:text-[#C6A15B]" />
          </div>
          <p className="text-2xl font-bold font-serif text-gray-900 dark:text-white mt-2">
            {stats.total}
          </p>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">Authored manuscripts</span>
        </div>

        <div className="bg-white dark:bg-[#122A25] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.published}
          </p>
          <span className="text-[11px] text-emerald-600/80">Visible to public</span>
        </div>

        <div className="bg-white dark:bg-[#122A25] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Drafts</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-serif text-amber-600 dark:text-amber-400 mt-2">
            {stats.drafts}
          </p>
          <span className="text-[11px] text-amber-600/80">Unpublished drafts</span>
        </div>

        <div className="bg-white dark:bg-[#122A25] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Views</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-serif text-blue-600 dark:text-blue-400 mt-2">
            {stats.totalViews}
          </p>
          <span className="text-[11px] text-blue-500/80">Reader impressions</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#122A25] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, keyword..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0B1E1B] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#077432] dark:focus:border-[#C6A15B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0B1E1B] text-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex bg-gray-100 dark:bg-[#0B1E1B] p-1 rounded-lg">
            {(['All', 'Published', 'Draft'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`text-xs px-3 py-1 rounded-md transition-all ${
                  statusFilter === status
                    ? 'bg-white dark:bg-[#1F5C50] text-[#077432] dark:text-[#C6A15B] font-semibold shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blogs List */}
      <div className="bg-white dark:bg-[#122A25] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-8 h-8 border-3 border-[#077432] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading editorial articles...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-12 text-center">
            <Newspaper className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-gray-800 dark:text-gray-200">
              No Articles Found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategoryFilter !== 'All' || statusFilter !== 'All'
                ? 'Try tweaking your search or filter terms.'
                : 'Get started by creating your very first inspirational blog post!'}
            </p>
            <Button onClick={openCreateModal} className="mt-4 bg-[#077432] text-white text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Write First Article
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {filteredBlogs.map((blog) => (
              <div
                key={blog._id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/60 dark:hover:bg-[#16342E]/40 transition-colors"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <img
                      src={blog.coverImage || PRESET_COVERS[0].url}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = PRESET_COVERS[0].url;
                      }}
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#077432] dark:text-[#C6A15B] uppercase tracking-wider">
                        {blog.category}
                      </span>
                      <button
                        onClick={() =>
                          togglePublishMutation.mutate({
                            id: blog._id,
                            isPublished: !blog.isPublished,
                          })
                        }
                        title="Click to toggle status"
                        className="cursor-pointer"
                      >
                        <Badge variant={blog.isPublished ? 'success' : 'neutral'}>
                          {blog.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </button>
                    </div>

                    <h2 className="font-serif font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                      {blog.title}
                    </h2>

                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                      {blog.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        {blog.author || 'Editorial'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {blog.readTimeMinutes || 5} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-gray-400" />
                        {blog.views || 0} views
                      </span>
                      {blog.createdAt && (
                        <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {blog.isPublished && (
                    <a
                      href={`${frontendUrl}/blog/${blog.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-[#077432] dark:hover:text-[#C6A15B] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="View Live Article"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(blog)}
                    className="text-xs border-gray-200 dark:border-gray-700"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBlogToDelete(blog);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-xs border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBlog ? 'Edit Blog Article' : 'Compose New Article'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!formData.title.trim() || !formData.content.trim()) {
              alert('Title and Content are required!');
              return;
            }
            saveMutation.mutate();
          }}
          className="space-y-4 max-h-[75vh] overflow-y-auto px-1 pr-2"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Article Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => {
                const title = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  title,
                  slug: !editingBlog
                    ? title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)+/g, '')
                    : prev.slug,
                }));
              }}
              placeholder="e.g. The Quiet Dawn: Transforming Your Fajr Experience"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0B1E1B] text-gray-900 dark:text-white focus:outline-none focus:border-[#077432] dark:focus:border-[#C6A15B]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0B1E1B] text-gray-900 dark:text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Author Name"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0B1E1B] text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Excerpt / Brief Summary *
            </label>
            <textarea
              required
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="A concise, compelling 1-2 sentence overview shown in feeds and previews..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0B1E1B] text-gray-900 dark:text-white focus:outline-none focus:border-[#077432]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Cover Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0B1E1B] text-gray-900 dark:text-white"
              />
            </div>
            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-gray-500 py-0.5">Presets:</span>
              {PRESET_COVERS.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setFormData({ ...formData, coverImage: preset.url })}
                  className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-[#077432]/10 hover:text-[#077432] dark:hover:text-[#C6A15B] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Article Body (Markdown / Text) *
              </label>
              <span className="text-[10px] text-gray-400">
                Use paragraphs, headers (##), bullet points, and quotes (&gt;)
              </span>
            </div>
            <textarea
              required
              rows={12}
              value={formData.content}
              onChange={(e) => {
                const content = e.target.value;
                const words = content.trim().split(/\s+/).length;
                const estimatedMinutes = Math.max(1, Math.round(words / 180));
                setFormData((prev) => ({
                  ...prev,
                  content,
                  readTimeMinutes: estimatedMinutes,
                }));
              }}
              placeholder="Write the full article content here. Share authentic reflections, verses from the Holy Quran, prophetic hadith, and practical life advice..."
              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0B1E1B] text-gray-900 dark:text-white focus:outline-none focus:border-[#077432] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Fajr, Salah, Habit, Productivity"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0B1E1B] text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Estimated Read Time (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.readTimeMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, readTimeMinutes: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0B1E1B] text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4 rounded text-[#077432] focus:ring-[#077432]"
              />
              Publish immediately (visible to all readers on frontend)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-[#077432] hover:bg-[#065F29] text-white"
            >
              {saveMutation.isPending ? 'Saving...' : editingBlog ? 'Update Post' : 'Publish Article'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Article"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to permanently remove{' '}
            <strong className="text-gray-900 dark:text-white">
              &quot;{blogToDelete?.title}&quot;
            </strong>
            ? This action cannot be reversed.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => blogToDelete && deleteMutation.mutate(blogToDelete._id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Article'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default BlogsManagementPage;
