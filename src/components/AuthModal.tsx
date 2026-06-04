import { useState } from 'react';
import { X, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onModeSwitch: () => void;
}

export default function AuthModal({ isOpen, onClose, mode, onModeSwitch }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
      } else {
        setSuccess('Account created! You are now signed in.');
        setTimeout(() => { onClose(); setSuccess(''); }, 1500);
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
      } else {
        onClose();
      }
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="surface rounded-2xl p-8 border border-dark-600/50 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyber-400/10 flex items-center justify-center border border-cyber-400/20">
                <Shield className="w-4.5 h-4.5 text-cyber-400 w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-lg">
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-dark-200 text-sm">
                  {mode === 'login' ? 'Sign in to your shield' : 'Start protecting your scripts'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white placeholder-dark-300 text-sm focus:outline-none focus:border-cyber-400/50 focus:ring-1 focus:ring-cyber-400/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-dark-800 border border-dark-600 text-white placeholder-dark-300 text-sm focus:outline-none focus:border-cyber-400/50 focus:ring-1 focus:ring-cyber-400/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-dark-100 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="px-3.5 py-2.5 rounded-lg bg-cyber-400/10 border border-cyber-400/20 text-cyber-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-dark-300 text-sm mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={onModeSwitch}
              className="text-cyber-400 hover:text-cyber-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
