import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';
import { Book, Chapter, Page } from '../types';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Save,
  FileText,
  Layers,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ContentEditorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedBookId, setSelectedBookId] = useState<string>(
    searchParams.get('bookId') || ''
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedPageId, setSelectedPageId] = useState<string>('');

  // Chapter modal state
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDescription, setChapterDescription] = useState('');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // Active page editing state
  const [pageTitle, setPageTitle] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  // Sync query param
  useEffect(() => {
    const bId = searchParams.get('bookId');
    if (bId && bId !== selectedBookId) {
      setSelectedBookId(bId);
    }
  }, [searchParams]);

  // Fetch all books for dropdown
  const { data: booksData } = useQuery({
    queryKey: ['adminBooksList'],
    queryFn: async () => {
      const res = await adminApi.getBooks({ limit: 100 });
      return res.data?.data || [];
    },
  });

  // Automatically select first book if none selected
  useEffect(() => {
    if (!selectedBookId && booksData && booksData.length > 0) {
      setSelectedBookId(booksData[0]._id);
      setSearchParams({ bookId: booksData[0]._id });
    }
  }, [booksData, selectedBookId, setSearchParams]);

  // Fetch chapters of selected book
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ['bookChapters', selectedBookId],
    queryFn: async () => {
      if (!selectedBookId) return [];
      const res = await adminApi.getChapters(selectedBookId);
      return res.data?.data || [];
    },
    enabled: !!selectedBookId,
  });

  // Automatically select first chapter if none selected or changed book
  useEffect(() => {
    if (chapters.length > 0) {
      if (!selectedChapterId || !chapters.some((c: Chapter) => c._id === selectedChapterId)) {
        setSelectedChapterId(chapters[0]._id);
      }
    } else {
      setSelectedChapterId('');
      setSelectedPageId('');
    }
  }, [chapters, selectedChapterId]);

  // Fetch pages of selected chapter
  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ['chapterPages', selectedChapterId],
    queryFn: async () => {
      if (!selectedChapterId) return [];
      const res = await adminApi.getPages(selectedChapterId);
      return res.data?.data || [];
    },
    enabled: !!selectedChapterId,
  });

  // Automatically select first page
  useEffect(() => {
    if (pages.length > 0) {
      const currentPage = pages.find((p: Page) => p._id === selectedPageId) || pages[0];
      setSelectedPageId(currentPage._id);
      setPageTitle(currentPage.title || '');
      setPageContent(currentPage.content || '');
      setPageNumber(currentPage.pageNumber || 1);
    } else {
      setSelectedPageId('');
      setPageTitle('');
      setPageContent('');
      setPageNumber(1);
    }
  }, [pages, selectedChapterId]);

  // Save Chapter Mutation
  const saveChapterMutation = useMutation({
    mutationFn: async () => {
      if (editingChapterId) {
        return adminApi.updateChapter(editingChapterId, {
          title: chapterTitle,
          description: chapterDescription,
        });
      } else {
        return adminApi.createChapter(selectedBookId, {
          title: chapterTitle,
          description: chapterDescription,
          order: chapters.length + 1,
        });
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['bookChapters', selectedBookId] });
      setIsChapterModalOpen(false);
      setChapterTitle('');
      setChapterDescription('');
      setEditingChapterId(null);
      if (res?.data?.data?._id) {
        setSelectedChapterId(res.data.data._id);
      }
    },
  });

  // Delete Chapter Mutation
  const deleteChapterMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.deleteChapter(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookChapters', selectedBookId] });
    },
  });

  // Save / Update Page Mutation
  const savePageMutation = useMutation({
    mutationFn: async () => {
      if (selectedPageId) {
        return adminApi.updatePage(selectedPageId, {
          title: pageTitle,
          content: pageContent,
          pageNumber,
        });
      } else {
        return adminApi.createPage(selectedChapterId, {
          book: selectedBookId,
          title: pageTitle,
          content: pageContent,
          pageNumber: pages.length + 1,
        });
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['chapterPages', selectedChapterId] });
      if (!selectedPageId && res?.data?.data?._id) {
        setSelectedPageId(res.data.data._id);
      }
      setSaveSuccessMessage(true);
      setTimeout(() => setSaveSuccessMessage(false), 3000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to save page');
    },
  });

  // Delete Page Mutation
  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.deletePage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapterPages', selectedChapterId] });
      setSelectedPageId('');
    },
  });

  const handleCreateNewPage = () => {
    setSelectedPageId('');
    setPageTitle(`Page ${pages.length + 1}`);
    setPageContent('');
    setPageNumber(pages.length + 1);
  };

  const handleSelectPage = (page: Page) => {
    setSelectedPageId(page._id);
    setPageTitle(page.title || '');
    setPageContent(page.content || '');
    setPageNumber(page.pageNumber);
  };

  const selectedBook = booksData?.find((b: Book) => b._id === selectedBookId);
  const wordCount = pageContent.trim() ? pageContent.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Book Selector */}
      <div className="bg-white dark:bg-[#0E2622] rounded-2xl p-4 sm:p-6 border border-[#DDE8E1] dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C6A15B]">
            Manuscript Studio
          </span>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#202522] dark:text-white mt-0.5">
            Chapter & Page Editor
          </h1>
        </div>

        {/* Book Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-[#202522] dark:text-gray-300">
            Active Book:
          </label>
          <select
            value={selectedBookId}
            onChange={(e) => {
              setSelectedBookId(e.target.value);
              setSearchParams({ bookId: e.target.value });
            }}
            className="px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white font-medium focus:ring-2 focus:ring-[#123C35]"
          >
            {booksData?.map((b: Book) => (
              <option key={b._id} value={b._id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Grid: 3-column Layout (Chapters, Pages list, Manuscript Editor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chapters (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0E2622] rounded-2xl border border-[#DDE8E1] dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-[#DDE8E1] dark:border-white/10 flex items-center justify-between bg-stone-50/80 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#123C35] dark:text-[#C6A15B]" />
              <h3 className="font-serif font-bold text-sm text-[#202522] dark:text-white">
                Chapters
              </h3>
            </div>
            <button
              onClick={() => {
                setEditingChapterId(null);
                setChapterTitle('');
                setChapterDescription('');
                setIsChapterModalOpen(true);
              }}
              className="p-1.5 rounded-lg bg-[#123C35] text-white hover:bg-[#1F5C50] text-xs transition-colors cursor-pointer"
              title="Add Chapter"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {chaptersLoading ? (
              <div className="p-4 text-center text-xs text-gray-400">Loading chapters...</div>
            ) : chapters.length > 0 ? (
              chapters.map((chapter: Chapter, idx: number) => {
                const isActive = chapter._id === selectedChapterId;
                return (
                  <div
                    key={chapter._id}
                    onClick={() => setSelectedChapterId(chapter._id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-[#123C35] text-white shadow-sm dark:bg-[#1F5C50]'
                        : 'hover:bg-stone-50 dark:hover:bg-white/5 text-[#202522] dark:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? 'bg-[#C6A15B] text-[#123C35]'
                            : 'bg-[#DDE8E1] dark:bg-white/10 text-[#123C35] dark:text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">
                          {chapter.title}
                        </div>
                        {chapter.description && (
                          <div
                            className={`text-[10px] truncate ${
                              isActive
                                ? 'text-white/70'
                                : 'text-[#202522]/50 dark:text-gray-400'
                            }`}
                          >
                            {chapter.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChapterId(chapter._id);
                          setChapterTitle(chapter.title);
                          setChapterDescription(chapter.description || '');
                          setIsChapterModalOpen(true);
                        }}
                        className={`p-1 rounded hover:bg-black/10 transition-colors ${
                          isActive ? 'text-white' : 'text-gray-500'
                        }`}
                        title="Edit Chapter"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this chapter and its pages?')) {
                            deleteChapterMutation.mutate(chapter._id);
                          }
                        }}
                        className={`p-1 rounded hover:bg-rose-500/20 text-rose-400 transition-colors`}
                        title="Delete Chapter"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-gray-400">
                No chapters created yet for this book.
              </div>
            )}
          </div>
        </div>

        {/* Middle Column: Pages Navigation (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0E2622] rounded-2xl border border-[#DDE8E1] dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-[#DDE8E1] dark:border-white/10 flex items-center justify-between bg-stone-50/80 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#123C35] dark:text-[#C6A15B]" />
              <h3 className="font-serif font-bold text-sm text-[#202522] dark:text-white">
                Pages ({pages.length})
              </h3>
            </div>
            <button
              onClick={handleCreateNewPage}
              disabled={!selectedChapterId}
              className="p-1.5 rounded-lg bg-[#C6A15B] text-white hover:bg-[#B38F48] text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Add Page"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {pagesLoading ? (
              <div className="p-4 text-center text-xs text-gray-400">Loading pages...</div>
            ) : pages.length > 0 ? (
              pages.map((page: Page) => {
                const isActive = page._id === selectedPageId;
                return (
                  <div
                    key={page._id}
                    onClick={() => handleSelectPage(page)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-[#123C35] text-white shadow-sm dark:bg-[#1F5C50]'
                        : 'hover:bg-stone-50 dark:hover:bg-white/5 text-[#202522] dark:text-gray-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {page.title || `Page ${page.pageNumber}`}
                      </div>
                      <div
                        className={`text-[10px] ${
                          isActive
                            ? 'text-white/70'
                            : 'text-[#202522]/50 dark:text-gray-400'
                        }`}
                      >
                        Global #{page.pageNumber} • {page.wordCount || 0} words
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this page?')) {
                          deletePageMutation.mutate(page._id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-rose-400 transition-opacity"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-gray-400">
                No pages in this chapter. Click + to add your first page.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Page Content Editor (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0E2622] rounded-2xl border border-[#DDE8E1] dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-[700px]">
          {/* Editor Header */}
          <div className="p-4 border-b border-[#DDE8E1] dark:border-white/10 flex items-center justify-between bg-stone-50/80 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewTab('edit')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  previewTab === 'edit'
                    ? 'bg-[#123C35] text-white dark:bg-[#C6A15B] dark:text-[#123C35]'
                    : 'text-[#202522] dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setPreviewTab('preview')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                  previewTab === 'preview'
                    ? 'bg-[#123C35] text-white dark:bg-[#C6A15B] dark:text-[#123C35]'
                    : 'text-[#202522] dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Reader Preview
              </button>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccessMessage && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
              <span className="text-[11px] text-gray-400">
                {wordCount} words
              </span>
              <Button
                size="sm"
                onClick={() => savePageMutation.mutate()}
                isLoading={savePageMutation.isPending}
                disabled={!selectedChapterId}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save Page
              </Button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col space-y-4">
            {selectedChapterId ? (
              <>
                {/* Page Title & Number row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#202522]/60 dark:text-gray-400 mb-1">
                      Page Title / Heading
                    </label>
                    <input
                      type="text"
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.target.value)}
                      placeholder="e.g. In The Presence of The Divine"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white font-medium focus:ring-2 focus:ring-[#123C35]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#202522]/60 dark:text-gray-400 mb-1">
                      Page #
                    </label>
                    <input
                      type="number"
                      value={pageNumber}
                      onChange={(e) => setPageNumber(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white"
                    />
                  </div>
                </div>

                {/* Content Area or Preview */}
                {previewTab === 'edit' ? (
                  <div className="flex-1 flex flex-col">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#202522]/60 dark:text-gray-400 mb-1">
                      Manuscript Content (Markdown supported)
                    </label>
                    <textarea
                      value={pageContent}
                      onChange={(e) => setPageContent(e.target.value)}
                      placeholder="Type or paste the chapter page text here..."
                      className="flex-1 w-full p-4 text-xs sm:text-sm font-serif leading-relaxed rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#123C35] resize-none"
                    />
                  </div>
                ) : (
                  <div className="flex-1 p-6 rounded-xl bg-[#FDFCF9] dark:bg-[#071A17] border border-[#DDE8E1] dark:border-white/10 overflow-y-auto">
                    <h2 className="font-serif text-xl font-bold text-[#123C35] dark:text-[#FAF6ED] mb-4 pb-2 border-b border-[#DDE8E1] dark:border-white/10">
                      {pageTitle || `Page ${pageNumber}`}
                    </h2>
                    <div className="font-serif text-sm sm:text-base leading-relaxed text-[#202522] dark:text-gray-200 whitespace-pre-wrap">
                      {pageContent || (
                        <span className="text-gray-400 italic">No content written yet.</span>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <AlertCircle className="w-8 h-8 text-[#C6A15B] mb-2" />
                <p className="text-xs">
                  Please select or create a chapter on the left to start editing manuscript pages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Chapter Modal */}
      <Modal
        isOpen={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        title={editingChapterId ? 'Edit Chapter' : 'Add New Chapter'}
        subtitle="Organize your manuscript into structured book sections"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveChapterMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
              Chapter Title *
            </label>
            <input
              type="text"
              required
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              placeholder="e.g. Chapter 1: The Call of Tawheed"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:ring-2 focus:ring-[#123C35]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={chapterDescription}
              onChange={(e) => setChapterDescription(e.target.value)}
              placeholder="Short context of this chapter..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8F5ED]/60 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE8E1] dark:border-white/10">
            <Button
              variant="ghost"
              type="button"
              size="sm"
              onClick={() => setIsChapterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={saveChapterMutation.isPending}
            >
              {editingChapterId ? 'Save Chapter' : 'Add Chapter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
