import React, { useState } from 'react';
import { frontendUrl } from '../api/config';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Shield, BookMarked, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Button } from '../components/common/Button';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@muslimguardian.com');
  const [password, setPassword] = useState('Admin@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Admin authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-signin min-h-screen bg-[#033116] flex items-center justify-center p-4">
      <div className="signin-panel max-w-md w-full bg-[#077432] p-8 sm:p-10 rounded-2xl border border-[#0A8D3E] shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-white p-2.5 flex items-center justify-center mx-auto shadow-lg">
            <img src="/logo.png" alt="Living in the light of Allah" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
            Living in the light of Allah
          </h2>
          <p className="text-xs text-[#DDE8E1] font-mono">
            Your publishing workspace
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="p-3 bg-stone-900/80 rounded-lg border border-stone-800 text-xs text-stone-300 flex items-center justify-between">
          <span className="font-mono text-stone-400">Admin Demo Credentials:</span>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@muslimguardian.com');
              setPassword('Admin@12345');
            }}
            className="text-brand-400 font-bold hover:underline"
          >
            Auto-Fill
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-300 mb-1 font-mono">Admin Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@muslimguardian.com"
                className="w-full pl-9 pr-3 py-2.5 bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-300 mb-1 font-mono">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-white transition-colors focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full py-3" isLoading={isLoading}>
            Authenticate to Console
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="pt-2 text-center">
          <a
            href={frontendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-stone-400 hover:text-white transition-colors"
          >
            ← Return to Bookstore
          </a>
        </div>
      </div>
    </div>
  );
};
