import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isLanding = location.pathname === '/';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-dark-600/50 backdrop-blur-xl bg-dark-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <Shield className="w-6 h-6 text-cyber-400 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]" />
                <div className="absolute inset-0 bg-cyber-400/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                <span className="text-white">Nova</span>
                <span className="text-dark-200"> Hub Z</span>
                <span className="gradient-text"> Protect</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {isLanding && (
                <>
                  <a href="#features" className="btn-ghost text-sm">Features</a>
                  <a href="#pricing" className="btn-ghost text-sm">Pricing</a>
                  <a href="#faq" className="btn-ghost text-sm">FAQ</a>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <button className="btn-secondary text-sm flex items-center gap-1.5">
                      Dashboard
                      <ChevronRight className="w-3.5 h-3.5" />
