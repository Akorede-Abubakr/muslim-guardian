import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { BooksManagementPage } from './pages/BooksManagementPage';
import { ContentEditorPage } from './pages/ContentEditorPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { OrdersManagementPage } from './pages/OrdersManagementPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { ReviewsManagementPage } from './pages/ReviewsManagementPage';
import { BlogsManagementPage } from './pages/BlogsManagementPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
    },
  },
});

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0B1E1B] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#123C35] dark:border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<AdminLoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout />
                  </ProtectedAdminRoute>
                }
              >
                <Route index element={<DashboardOverviewPage />} />
                <Route path="books" element={<BooksManagementPage />} />
                <Route path="blogs" element={<BlogsManagementPage />} />
                <Route path="content-editor" element={<ContentEditorPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="orders" element={<OrdersManagementPage />} />
                <Route path="users" element={<UsersManagementPage />} />
                <Route path="reviews" element={<ReviewsManagementPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AdminAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
