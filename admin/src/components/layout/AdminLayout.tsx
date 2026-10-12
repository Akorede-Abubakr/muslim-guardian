import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  FolderTree,
  ShoppingBag,
  Users,
  MessageSquare,
  Sparkles,
  Newspaper,
  X,
} from 'lucide-react';
import { AdminHeader } from './AdminHeader';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [sidebarOpen]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Books Catalog', href: '/books', icon: BookOpen },
    { name: 'Content Editor', href: '/content-editor', icon: FileText },
    { name: 'Categories', href: '/categories', icon: FolderTree },
    { name: 'Journal & Blogs', href: '/blogs', icon: Newspaper },
    { name: 'Orders & Sales', href: '/orders', icon: ShoppingBag },
    { name: 'Readers & Users', href: '/users', icon: Users },
    { name: 'Reviews', href: '/reviews', icon: MessageSquare },
  ];

  return (
    <div className="admin-workspace h-screen min-h-0 bg-stone-50 dark:bg-[#071A17] text-[#202522] dark:text-[#E1ECE7] flex flex-col transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Container */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside
          aria-label="Administration navigation"
          className={`workspace-sidebar fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0B1E1B] border-r border-[#DDE8E1] dark:border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full invisible lg:visible'
          }`}
        >
          {/* Logo & Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#DDE8E1] dark:border-white/10 bg-white dark:bg-[#0B1E1B] text-[#202522] dark:text-[#FAF6ED] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl p-1 bg-white dark:bg-white/10 border border-[#DDE8E1] dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src="/logo.png"
                  alt="Living in the light of Allah"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-serif font-bold text-sm tracking-tight text-[#202522] dark:text-[#FAF6ED] truncate">
                  Living in the light
                </span>
                <span className="text-[10px] text-[#077432] dark:text-[#C6A15B] tracking-wider uppercase font-semibold">
                  Admin Workspace
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
              className="lg:hidden text-stone-500 hover:text-stone-800 dark:text-white/80 dark:hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Main navigation" className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#202522]/40 dark:text-gray-400">
              Management
            </div>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#123C35] text-white shadow-sm dark:bg-[#1F5C50] dark:text-[#FAF6ED]'
                      : 'text-[#202522]/70 dark:text-gray-300 hover:bg-[#DDE8E1]/50 dark:hover:bg-white/5 hover:text-[#123C35] dark:hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-[#C6A15B]'
                        : 'text-[#202522]/50 dark:text-gray-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer Card */}
          <div className="p-4 border-t border-[#DDE8E1] dark:border-white/10">
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-[#DDE8E1] dark:border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-[#C6A15B]" />
                <span className="text-xs font-bold text-[#123C35] dark:text-[#C6A15B]">
                  Editorial Edition
                </span>
              </div>
              <p className="text-[11px] text-[#202522]/60 dark:text-gray-400 leading-relaxed">
                Publish authentic Islamic literature with structured manuscript controls.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <AdminHeader onToggleSidebar={() => setSidebarOpen(true)} />
          <main className="workspace-content flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
