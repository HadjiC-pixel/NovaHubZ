import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, FileCode2, Key, BarChart3, Settings, LogOut, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/scripts', label: 'Scripts', icon: FileCode2 },
  { to: '/dashboard/keys', label: 'License Keys', icon: Key },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <aside className={`h-full flex flex-col bg-dark-900 border-r border-dark-600/50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-dark-600/50 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-cyber-400 flex-shrink-0" />
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight">
              <span className="text-white">Nova</span>
              <span className="text-dark-300"> Hub Z</span>
              <span className="gradient-text"> Protect</span>
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 group ${
                isActive
                  ? 'bg-cyber-400/10 text-cyber-400 border border-cyber-400/20'
                  : 'text-dark-200 hover:bg-dark-700 hover:text-white border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-cyber-400' : 'text-dark-300 group-hover:text-white'}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium">{label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 text-cyber-400/60" />}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-4 border-t border-dark-600/50 space-y-0.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-dark-200 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-dark-300 group-hover:text-red-400 transition-colors" />
          {!collapsed && <span className="font-medium">Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
