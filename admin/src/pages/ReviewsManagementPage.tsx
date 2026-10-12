import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';
import { Review } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  MessageSquare,
  Search,
  Star,
  Trash2,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';

export const ReviewsManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminReviews', searchTerm, page],
    queryFn: async () => {
      const res = await adminApi.getReviews({
        search: searchTerm,
        page,
        limit: 15,
      });
      return res.data;
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminApi.deleteReview(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverview'] });
      setReviewToDelete(null);
    },
  });

  const reviews = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#202522] dark:text-white">
          Reviews & Community Moderation
        </h1>
        <p className="text-xs sm:text-sm text-[#202522]/60 dark:text-gray-400 mt-1">
          Moderate community feedback, reader ratings, and verified customer testimonials
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#0E2622] rounded-2xl p-4 border border-[#DDE8E1] dark:border-white/10 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews or books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#123C35]"
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white dark:bg-[#0E2622] rounded-2xl border border-[#DDE8E1] dark:border-white/10 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#123C35] dark:border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50/80 dark:bg-white/5 text-[11px] uppercase tracking-wider text-[#202522]/60 dark:text-gray-400 border-b border-[#DDE8E1] dark:border-white/10">
                <tr>
                  <th className="py-3.5 px-6">Reader</th>
                  <th className="py-3.5 px-6">Book</th>
                  <th className="py-3.5 px-6">Rating</th>
                  <th className="py-3.5 px-6">Feedback / Comment</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE8E1] dark:divide-white/10 text-xs">
                {reviews.map((review) => (
                  <tr
                    key={review._id}
                    className="hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#202522] dark:text-white">
                        {review.user?.name || 'Reader'}
                      </div>
                      <div className="text-[11px] text-[#202522]/60 dark:text-gray-400">
                        {review.user?.email}
                      </div>
                    </td>

                    <td className="py-4 px-6 font-medium text-[#202522] dark:text-gray-200">
                      {review.book?.title || 'Book'}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-[#C6A15B]">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? 'fill-current' : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      {review.title && (
                        <div className="font-bold text-[#202522] dark:text-white mb-0.5">
                          {review.title}
                        </div>
                      )}
                      <p className="text-[#202522]/70 dark:text-gray-300 line-clamp-2">
                        {review.comment}
                      </p>
                    </td>

                    <td className="py-4 px-6">
                      {review.isVerifiedPurchase ? (
                        <Badge variant="success">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verified Purchase
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Reader Review</Badge>
                      )}
                    </td>

                    <td className="py-4 px-6 text-[#202522]/60 dark:text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setReviewToDelete(review)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-[#202522]/60 dark:text-gray-400 text-sm">
            No reviews found.
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#DDE8E1] dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!reviewToDelete}
        onClose={() => setReviewToDelete(null)}
        title="Delete Review"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#202522]/80 dark:text-gray-300 leading-relaxed">
            Are you sure you want to remove this review by{' '}
            <strong>{reviewToDelete?.user?.name || 'Reader'}</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE8E1] dark:border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReviewToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteReviewMutation.isPending}
              onClick={() =>
                reviewToDelete && deleteReviewMutation.mutate(reviewToDelete._id)
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
