import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';
import { AdminUser } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  ShoppingBag,
  DollarSign,
  Calendar,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', searchTerm, roleFilter, page],
    queryFn: async () => {
      const res = await adminApi.getUsers({
        search: searchTerm,
        role: roleFilter,
        page,
        limit: 15,
      });
      return res.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return adminApi.toggleUserStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#202522] dark:text-white">
          Readers & Users
        </h1>
        <p className="text-xs sm:text-sm text-[#202522]/60 dark:text-gray-400 mt-1">
          View registered community members, access privileges, purchase history, and account statuses
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#0E2622] rounded-2xl p-4 border border-[#DDE8E1] dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#123C35]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10 text-[#202522] dark:text-white focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Readers</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#0E2622] rounded-2xl border border-[#DDE8E1] dark:border-white/10 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#123C35] dark:border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50/80 dark:bg-white/5 text-[11px] uppercase tracking-wider text-[#202522]/60 dark:text-gray-400 border-b border-[#DDE8E1] dark:border-white/10">
                <tr>
                  <th className="py-3.5 px-6">User / Reader</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Books Bought</th>
                  <th className="py-3.5 px-6">Total Spent</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE8E1] dark:divide-white/10 text-xs">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#123C35] dark:bg-[#C6A15B] text-white dark:text-[#123C35] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-[#202522] dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-[#202522]/60 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <Badge variant={user.role === 'admin' ? 'gold' : 'sage'}>
                        {user.role === 'admin' ? (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          'Reader'
                        )}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 font-medium text-[#202522] dark:text-gray-200">
                      {user.ordersCount || 0} order(s)
                    </td>

                    <td className="py-4 px-6 font-bold text-[#123C35] dark:text-[#C6A15B]">
                      ${(user.totalSpent || 0).toFixed(2)}
                    </td>

                    <td className="py-4 px-6 text-[#202522]/60 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6">
                      <Badge
                        variant={user.status === 'active' ? 'success' : 'danger'}
                      >
                        {user.status || 'active'}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: user.id,
                              status: user.status === 'active' ? 'disabled' : 'active',
                            })
                          }
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                            user.status === 'active'
                              ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          }`}
                        >
                          {user.status === 'active' ? 'Disable' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-[#202522]/60 dark:text-gray-400 text-sm">
            No registered users found.
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
    </div>
  );
};
