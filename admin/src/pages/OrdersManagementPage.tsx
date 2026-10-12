import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';
import { Order } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import {
  ShoppingBag,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  DollarSign,
  User,
  Calendar,
  CreditCard,
} from 'lucide-react';

export const OrdersManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminOrders', searchTerm, statusFilter, page],
    queryFn: async () => {
      const res = await adminApi.getOrders({
        search: searchTerm,
        status: statusFilter,
        page,
        limit: 15,
      });
      return res.data;
    },
  });

  const orders = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#202522] dark:text-white">
          Orders & Transactions
        </h1>
        <p className="text-xs sm:text-sm text-[#202522]/60 dark:text-gray-400 mt-1">
          Monitor reader checkout activities, payment verification logs, and digital unlock statuses
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#0E2622] rounded-2xl p-4 border border-[#DDE8E1] dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#123C35]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#0E2622] rounded-2xl border border-[#DDE8E1] dark:border-white/10 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#123C35] dark:border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50/80 dark:bg-white/5 text-[11px] uppercase tracking-wider text-[#202522]/60 dark:text-gray-400 border-b border-[#DDE8E1] dark:border-white/10">
                <tr>
                  <th className="py-3.5 px-6">Reference / Customer</th>
                  <th className="py-3.5 px-6">Books Purchased</th>
                  <th className="py-3.5 px-6">Total Paid</th>
                  <th className="py-3.5 px-6">Payment Status</th>
                  <th className="py-3.5 px-6">Digital Access</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE8E1] dark:divide-white/10 text-xs">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#202522] dark:text-white">
                        {order.user?.name || 'Reader'}
                      </div>
                      <div className="text-[11px] text-[#202522]/60 dark:text-gray-400">
                        {order.user?.email}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {order.transactionReference || order._id}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-medium text-[#202522] dark:text-gray-200">
                        {order.items?.map((i) => i.title).join(', ')}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {order.items?.length || 1} book(s)
                      </div>
                    </td>

                    <td className="py-4 px-6 font-bold text-[#123C35] dark:text-[#C6A15B]">
                      ${order.totalAmount?.toFixed(2)}
                    </td>

                    <td className="py-4 px-6">
                      <Badge
                        variant={
                          order.paymentStatus === 'completed'
                            ? 'success'
                            : order.paymentStatus === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {order.paymentStatus}
                      </Badge>
                    </td>

                    <td className="py-4 px-6">
                      {order.accessGranted ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          Locked
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-[#202522]/60 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg text-[#123C35] dark:text-[#C6A15B] hover:bg-[#DDE8E1]/60 dark:hover:bg-white/10 transition-colors"
                        title="View Receipt Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-[#202522]/60 dark:text-gray-400 text-sm">
            No orders found.
          </div>
        )}

        {/* Pagination controls */}
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

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Transaction & Receipt Details"
        subtitle={`Reference: ${selectedOrder?.transactionReference || selectedOrder?._id}`}
        maxWidth="lg"
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Customer & Payment Info Cards */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">
                  Reader Customer
                </span>
                <div className="font-bold text-[#202522] dark:text-white mt-0.5">
                  {selectedOrder.user?.name}
                </div>
                <div className="text-gray-500">{selectedOrder.user?.email}</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">
                  Payment Method
                </span>
                <div className="font-bold text-[#202522] dark:text-white mt-0.5 uppercase">
                  {selectedOrder.paymentMethod || 'Paystack Direct Checkout'}
                </div>
                <div className="text-gray-500">
                  {selectedOrder.paidAt
                    ? new Date(selectedOrder.paidAt).toLocaleString()
                    : 'Pending verification'}
                </div>
              </div>
            </div>

            {/* Items Purchased */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#202522]/70 dark:text-gray-300 mb-2">
                Purchased Books
              </h4>
              <div className="divide-y divide-[#DDE8E1] dark:divide-white/10 border border-[#DDE8E1] dark:border-white/10 rounded-xl overflow-hidden">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between bg-white dark:bg-transparent text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.coverImage || '/placeholder-book.jpg'}
                        alt={item.title}
                        className="w-8 h-11 object-cover rounded shadow-sm"
                      />
                      <span className="font-medium text-[#202522] dark:text-white">
                        {item.title}
                      </span>
                    </div>
                    <span className="font-bold text-[#123C35] dark:text-[#C6A15B]">
                      ${item.price?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Access status */}
            <div className="p-4 rounded-xl bg-[#123C35] text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-[#DDE8E1]">Total Billed</div>
                <div className="font-serif text-2xl font-bold text-[#FAF6ED]">
                  ${selectedOrder.totalAmount?.toFixed(2)} {selectedOrder.currency || 'USD'}
                </div>
              </div>
              <Badge variant="gold">
                {selectedOrder.accessGranted ? 'Full Reader Access Active' : 'Access Pending'}
              </Badge>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
