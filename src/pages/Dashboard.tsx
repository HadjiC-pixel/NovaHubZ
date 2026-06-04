import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Menu, X, Bell } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Overview from './dashboard/Overview';
import Scripts from './dashboard/Scripts';
import Keys from './dashboard/Keys';
import Analytics from './dashboard/Analytics';
import DashSettings from './dashboard/DashSettings';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  const loadUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      navigate('/');
      return;
    }
    setUserEmail(data.user.email ?? '');
  }, [navigate]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-56">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-dark-600/50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden btn-ghost p-1.5 rounded-lg"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost p-1.5 rounded-lg relative">
              <Bell className="w-4 h-4 text-dark-300" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyber-400" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyber-400 to-electric-400 flex items-center justify-center text-dark-950 text-xs font-bold">
                {userEmail.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-sm text-dark-200 max-w-[160px] truncate">{userEmail}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="scripts" element={<Scripts />} />
            <Route path="keys" element={<Keys />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<DashSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
