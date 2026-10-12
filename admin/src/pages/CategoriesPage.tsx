import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';
import { Category } from '../types';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'BookOpen',
    order: 1,
    isFeatured: false,
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: async () => {
      const res = await adminApi.getCategories();
      return res.data?.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingCategory) {
        return adminApi.updateCategory(editingCategory._id, formData);
      } else {
        return adminApi.createCategory(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      closeModal();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to save category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: 'BookOpen',
      order: categories.length + 1,
      isFeatured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'BookOpen',
      order: category.order || 1,
      isFeatured: category.isFeatured || false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#202522] dark:text-white">
            Categories & Genres
          </h1>
          <p className="text-xs sm:text-sm text-[#202522]/60 dark:text-gray-400 mt-1">
            Organize the Islamic library into thematic collections and scholarly disciplines
          </p>
        </div>
        <Button onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#123C35] dark:border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((category: Category) => (
            <div
              key={category._id}
              className="bg-white dark:bg-[#0E2622] rounded-2xl p-5 border border-[#DDE8E1] dark:border-white/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[#123C35]/10 dark:bg-white/10 text-[#123C35] dark:text-[#C6A15B]">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  {category.isFeatured && (
                    <Badge variant="gold">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                <h3 className="font-serif text-lg font-bold text-[#202522] dark:text-white">
                  {category.name}
                </h3>
                <p className="text-xs text-[#202522]/60 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                  {category.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#DDE8E1] dark:border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{category.bookCount || 0} books</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(category)}
                    className="p-1.5 rounded-lg text-[#202522] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setCategoryToDelete(category);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        subtitle="Configure title, taxonomy order, and featured shelf placement"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Quranic Studies"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:ring-2 focus:ring-[#123C35]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Overview of literature in this category..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#202522] dark:text-gray-200 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: parseInt(e.target.value, 10) || 1 })
              }
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[#202522] dark:text-gray-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) =>
                setFormData({ ...formData, isFeatured: e.target.checked })
              }
              className="rounded text-[#123C35] focus:ring-[#123C35]"
            />
            Feature on Homepage explore categories
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE8E1] dark:border-white/10">
            <Button variant="ghost" type="button" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={saveMutation.isPending}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Category"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#202522]/80 dark:text-gray-300 leading-relaxed">
            Are you sure you want to delete the category{' '}
            <strong className="text-rose-600 font-bold">
              {categoryToDelete?.name}
            </strong>
            ?
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
              onClick={() =>
                categoryToDelete && deleteMutation.mutate(categoryToDelete._id)
              }
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
