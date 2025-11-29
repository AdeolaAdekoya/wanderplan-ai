import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { GlobeIcon, ArrowLeftIcon } from '../ui/Icons';
import { storageService } from '../../services/storageService';
import { UserProfile } from '../../types';

interface AuthScreenProps {
  onSuccess: (user: UserProfile) => void;
  onCancel?: () => void;
  customTitle?: string;
  initialName?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, onCancel, customTitle, initialName }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: initialName || '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isLogin) {
        const user = storageService.login(formData.email, formData.password);
        onSuccess(user);
      } else {
        if (!formData.name) throw new Error("Name is required");
        const user = storageService.register(formData.name, formData.email, formData.password);
        onSuccess(user);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] p-6 font-sans">
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Cancel/Back Button */}
        {onCancel && (
          <button 
            onClick={onCancel}
            className="absolute top-4 left-4 p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors z-20"
            title="Go back"
          >
             <ArrowLeftIcon className="w-5 h-5" />
          </button>
        )}

        <div className="p-10 text-center">
          <div className="mx-auto w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-6">
            <GlobeIcon className="w-6 h-6 text-stone-900" />
          </div>
          <h1 className="text-3xl font-bold font-playfair text-stone-900 tracking-tight">WanderPlan AI</h1>
          <p className="text-stone-500 text-sm mt-3 leading-relaxed">{customTitle || "Sign in to access your intelligent travel companion"}</p>
        </div>

        <div className="px-10 pb-10">
          <div className="flex gap-1 mb-8 p-1 bg-stone-100 rounded-lg">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isLogin ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isLogin ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-stone-500 focus:ring-1 focus:ring-stone-500 outline-none transition-all text-stone-900 placeholder:text-stone-300"
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-stone-500 focus:ring-1 focus:ring-stone-500 outline-none transition-all text-stone-900 placeholder:text-stone-300"
                placeholder="you@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-stone-500 focus:ring-1 focus:ring-stone-500 outline-none transition-all text-stone-900 placeholder:text-stone-300"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                {error}
              </div>
            )}

            <Button className="w-full py-3.5 mt-2">
              {isLogin ? 'Continue' : 'Create Free Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};