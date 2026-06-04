import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileCode2, Key, Activity, Shield, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRelativeTime } from '../../lib/utils';
import type { Script, LicenseKey } from '../../lib/supabase';

export default function Overview() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: s }, { data: k }] = await Promise.all([
        supabase.from('scripts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('license_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);

      setScripts(s ?? []);
      setKeys(k ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const totalExecutions = scripts.reduce((sum, s) => sum + s.executions, 0);
  const activeScripts = scripts.filter(s => s.is_active).length;
  const activeKeys = keys.filter(k => k.is_active).length;

  const stats = [
    { label: 'Protected Scripts', value: scripts.length, icon: FileCode2, color: 'text-cyber-400', bg: 'bg-cyber-400/10 border-cyber-400/15' },
    { label: 'License Keys', value: keys.length, icon: Key, color: 'text-electric-400', bg: 'bg-electric-400/10 border-electric-400/15' },
    { label: 'Total Executions', value: totalExecutions, icon: Activity, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/15' },
    { label: 'Active Shields', value: activeScripts, icon: Shield, color: 'text-cyber-400', bg: 'bg-cyber-400/10 border-cyber-400/15' },
  ];

  if (loading) {
    return (
      <div className="p-6 sm:p-8 space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-dark-300 text-sm mt-1">Your shield at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface rounded-xl p-5 border border-dark-600/40 hover:border-dark-500/60 transition-all duration-200">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 border ${stat.bg}`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.color} w-5 h-5`} />
            </div>
            <div className="text-2xl font-bold text-white mb-0.5 font-mono">{stat.value}</div>
            <div className="text-dark-300 text-xs">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scripts */}
        <div className="surface rounded-xl border border-dark-600/40">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-600/30">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyber-400" />
              <h2 className="font-semibold text-white text-sm">Recent Scripts</h2>
            </div>
            <Link to="/dashboard/scripts" className="text-xs text-dark-300 hover:text-cyber-400 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-dark-600/20">
            {scripts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <FileCode2 className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                <p className="text-dark-400 text-sm">No scripts yet</p>
                <Link to="/dashboard/scripts">
                  <button className="mt-3 btn-primary text-xs px-4 py-1.5">Upload first script</button>
                </Link>
              </div>
            ) : (
              scripts.map((script) => (
                <div key={script.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-dark-800/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{script.name}</p>
                    <p className="text-xs text-dark-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(script.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <div className="flex items-center gap-1 text-xs text-dark-300">
                      <TrendingUp className="w-3 h-3 text-cyber-500" />
                      {script.executions}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${script.is_active ? 'bg-cyber-400' : 'bg-dark-400'}`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Keys */}
        <div className="surface rounded-xl border border-dark-600/40">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-600/30">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-electric-400" />
              <h2 className="font-semibold text-white text-sm">License Keys</h2>
            </div>
            <Link to="/dashboard/keys" className="text-xs text-dark-300 hover:text-cyber-400 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-dark-600/20">
            {keys.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Key className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                <p className="text-dark-400 text-sm">No keys generated</p>
                <Link to="/dashboard/keys">
                  <button className="mt-3 btn-primary text-xs px-4 py-1.5">Generate key</button>
                </Link>
              </div>
            ) : (
              keys.map((key) => (
                <div key={key.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-dark-800/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-cyber-400/90 truncate">{key.key_string}</p>
                    <p className="text-xs text-dark-400 mt-0.5 capitalize">{key.expiry_type}</p>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${key.is_active ? 'bg-cyber-400/10 text-cyber-400 border border-cyber-400/20' : 'bg-dark-600/30 text-dark-400 border border-dark-600/30'}`}>
                    {key.is_active ? 'Active' : 'Revoked'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/dashboard/scripts', label: 'Upload Script', desc: 'Protect new Lua code', icon: FileCode2, color: 'text-cyber-400' },
          { to: '/dashboard/keys', label: 'Generate Key', desc: 'Create a license key', icon: Key, color: 'text-electric-400' },
          { to: '/dashboard/analytics', label: 'View Analytics', desc: 'See execution stats', icon: Activity, color: 'text-green-400' },
        ].map((action) => (
          <Link key={action.to} to={action.to}>
            <div className="surface rounded-xl p-4 border border-dark-600/40 hover:border-cyber-400/20 hover:bg-dark-800/60 transition-all duration-200 flex items-center gap-3 group cursor-pointer">
              <action.icon className={`w-5 h-5 ${action.color} flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{action.label}</p>
                <p className="text-xs text-dark-400">{action.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-dark-300 ml-auto transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
