import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, Menu, Bell } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/ThemeContext';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const { admin, logout } = useAdminAuth();
  const { pathname } = useLocation();
  const section = ({ '/': 'Overview', '/books': 'Books catalog', '/blogs': 'Journal & blogs', '/content-editor': 'Content editor', '/categories': 'Categories', '/orders': 'Orders & sales', '/users': 'Readers & users', '/reviews': 'Reviews' } as Record<string, string>)[pathname] || 'Workspace';
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="workspace-header sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#0E2622]/90 backdrop-blur-md border-b border-[#DDE8E1] dark:border-white/10 px-4 sm:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-[#202522] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">Publisher workspace</p>
          <h1 className="text-lg font-bold text-[#202522] dark:text-white">
            {section}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-xl text-[#202522] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#C6A15B]" />
          ) : (
            <Moon className="w-4 h-4 text-[#123C35]" />
          )}
        </button>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-[#DDE8E1] dark:border-white/10">
          <div className="w-8 h-8 rounded-full bg-[#123C35] dark:bg-[#C6A15B] text-white dark:text-[#123C35] flex items-center justify-center font-bold text-xs">
            {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-[#202522] dark:text-white leading-tight">
              {admin?.name || 'Administrator'}
            </div>
            <div className="text-[10px] text-[#202522]/50 dark:text-gray-400">
              {admin?.email}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
