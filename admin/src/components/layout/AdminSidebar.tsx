import React from 'react';
import { frontendUrl } from '../../api/config';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileEdit,
  FolderTree,
  ShoppingBag,
  Users,
  MessageSquare,
  Settings,
  ExternalLink,
  BookMarked,
  Shield,
  Newspaper,
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'My Blog / Posts', to: '/blogs', icon: Newspaper },
    { label: 'Books Catalog', to: '/books', icon: BookOpen },
    { label: 'Content Editor', to: '/content-editor', icon: FileEdit },
    { label: 'Categories', to: '/categories', icon: FolderTree },
    { label: 'Orders & Sales', to: '/orders', icon: ShoppingBag },
    { label: 'Users & Customers', to: '/users', icon: Users },
    { label: 'Reviews Moderation', to: '/reviews', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 bg-[#077432] text-[#F8F5ED] border-r border-[#0A8D3E] flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#0A8D3E] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-sm shrink-0">
          <img src="/logo.png" alt="Living in the light of Allah" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <h1 className="font-serif font-bold text-sm text-white tracking-tight leading-tight truncate">
            Living in the light of Allah
          </h1>
          <p className="text-[10px] font-mono text-[#C6A15B] uppercase tracking-widest">
            Publisher Console
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1F5C50] text-[#C6A15B] font-semibold border border-[#C6A15B]/30 shadow-sm'
                    : 'text-[#DDE8E1] hover:text-white hover:bg-[#1F5C50]/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer: Live Store Link */}
      <div className="p-4 border-t border-[#1F5C50] space-y-2">
        <a
          href={frontendUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 rounded-lg bg-[#0E2E28] hover:bg-[#1F5C50] text-[#F8F5ED] text-xs font-medium border border-[#1F5C50] transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>Open Bookstore</span>
          </span>
          <span className="text-[10px] font-mono text-[#DDE8E1]/80">:5173</span>
        </a>
      </div>
    </aside>
  );
};
