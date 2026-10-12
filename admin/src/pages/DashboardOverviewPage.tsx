import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import {
  BookOpen,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  BookMarked,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardOverviewPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: async () => {
      const res = await adminApi.getOverview();
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#123C35] dark:border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const overview = data?.data;
  const stats = overview?.stats;
  const salesChart = overview?.salesChart || [];
  const topBooks = overview?.topBooks || [];
  const recentOrders = overview?.recentOrders || [];

  return (
    <div className="space-y-8">
      {/* Publisher Overview Container (White on light theme) */}
      <div className="overview-banner relative overflow-hidden rounded-3xl bg-white dark:bg-[#123C35] text-[#202522] dark:text-white p-6 sm:p-8 border border-[#DDE8E1] dark:border-white/10 shadow-sm transition-colors">
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#202522] dark:text-[#FAF6ED]">
            Your publishing overview
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-[#DDE8E1]/80 leading-relaxed">
            A clear view of your books, readers, and sales. Everything you need to keep your next chapter moving.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/books"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#077432] hover:bg-[#065F29] text-white font-medium text-xs shadow-sm transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Manage Books Catalog
            </Link>
            <Link
              to="/content-editor"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/20 text-stone-800 dark:text-white font-medium text-xs transition-all border border-stone-200 dark:border-white/10"
            >
              <BookMarked className="w-4 h-4 text-[#077432] dark:text-[#C6A15B]" />
              Manuscript Editor
            </Link>
          </div>
        </div>

        {/* Subtle decorative background pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <BookOpen className="w-72 h-72 text-[#077432]/10 dark:text-white" />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${(stats?.totalRevenue || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="All-time verified sales"
          icon={DollarSign}
          variant="gold"
        />
        <StatCard
          title="Completed Orders"
          value={stats?.completedOrders || 0}
          subtitle={`${stats?.totalOrders || 0} total checkout intents`}
          icon={ShoppingBag}
          variant="emerald"
        />
        <StatCard
          title="Published Books"
          value={stats?.publishedBooks || 0}
          subtitle={`${stats?.draftBooks || 0} drafts in progress`}
          icon={BookOpen}
          variant="sage"
        />
        <StatCard
          title="Registered Readers"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.reviewsCount || 0} customer reviews`}
          icon={Users}
          variant="charcoal"
          change={{ value: '18.1%', isPositive: true }}
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Chart (Visual representation) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0E2622] rounded-2xl p-6 border border-[#DDE8E1] dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#DDE8E1] dark:border-white/10">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#202522] dark:text-white">
                Revenue & Monthly Trends
              </h2>
              <p className="text-xs text-[#202522]/60 dark:text-gray-400">
                Monthly trajectory for verified book purchases
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#123C35]/10 text-[#123C35] dark:bg-white/10 dark:text-[#C6A15B]">
              Last 6 Months
            </span>
          </div>

          {/* Simple Visual Bar Chart */}
          <div className="mt-6 pt-4 space-y-4">
            {salesChart.length > 0 ? (
              <div className="space-y-3">
                {salesChart.map((point, idx) => {
                  const maxRev = Math.max(...salesChart.map((p) => p.revenue), 100);
                  const percentage = Math.round((point.revenue / maxRev) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#202522] dark:text-gray-300">
                          {point.month} {point.year}
                        </span>
                        <span className="text-[#123C35] dark:text-[#C6A15B] font-bold">
                          ${point.revenue.toFixed(2)} ({point.orders} orders)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#123C35] to-[#C6A15B] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-[#202522]/50 dark:text-gray-400 text-xs">
                No monthly sales history recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Books */}
        <div className="bg-white dark:bg-[#0E2622] rounded-2xl p-6 border border-[#DDE8E1] dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#DDE8E1] dark:border-white/10">
              <h2 className="font-serif text-lg font-bold text-[#202522] dark:text-white">
                Best Sellers
              </h2>
              <Link
                to="/books"
                className="text-xs text-[#123C35] dark:text-[#C6A15B] hover:underline font-medium"
              >
                View all
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {topBooks.length > 0 ? (
                topBooks.slice(0, 4).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <img
                      src={item.book?.coverImage || '/placeholder-book.jpg'}
                      alt={item.book?.title}
                      className="w-10 h-14 object-cover rounded-lg shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#202522] dark:text-white truncate">
                        {item.book?.title}
                      </h4>
                      <p className="text-[11px] text-[#202522]/60 dark:text-gray-400 truncate">
                        {item.book?.author}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-bold text-[#123C35] dark:text-[#C6A15B]">
                          ${item.totalRevenue?.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          ({item.salesCount} sold)
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#202522]/50 dark:text-gray-400 text-xs">
                  No sales recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#DDE8E1] dark:border-white/10 text-center">
            <Link
              to="/books"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#123C35] dark:text-[#C6A15B]"
            >
              Browse complete bookstore catalog
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-[#0E2622] rounded-2xl border border-[#DDE8E1] dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#DDE8E1] dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#202522] dark:text-white">
              Recent Transactions
            </h2>
            <p className="text-xs text-[#202522]/60 dark:text-gray-400">
              Latest reader book acquisitions & instant digital access logs
            </p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-[#123C35] dark:text-[#C6A15B] hover:underline"
          >
            View all orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50/80 dark:bg-white/5 text-[11px] uppercase tracking-wider text-[#202522]/60 dark:text-gray-400 border-b border-[#DDE8E1] dark:border-white/10">
              <tr>
                <th className="py-3 px-6">Order / Reader</th>
                <th className="py-3 px-6">Books Purchased</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Payment Status</th>
                <th className="py-3 px-6">Access</th>
                <th className="py-3 px-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE8E1] dark:divide-white/10 text-xs">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-[#202522] dark:text-white">
                        {order.user?.name || 'Reader'}
                      </div>
                      <div className="text-[11px] text-[#202522]/50 dark:text-gray-400">
                        {order.user?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="text-[#202522] dark:text-gray-300 font-medium">
                        {order.items?.map((item) => item.title).join(', ') || 'Book'}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-[#123C35] dark:text-[#C6A15B]">
                      ${order.totalAmount?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6">
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
                    <td className="py-3.5 px-6">
                      {order.accessGranted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-[#202522]/60 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-[#202522]/50 dark:text-gray-400"
                  >
                    No customer orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
