import { useState, useEffect, useCallback } from 'react';
import { User, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function DashSettings() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email ?? '');

    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setUsername(data.username ?? '');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase
      .from('profiles')
      .upsert({ id: user.id, username })
      .eq('id', user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 space-y-4 max-w-2xl">
        {[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)}
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-dark-300 text-sm mt-1">Manage your account preferences.</p>
      </div>

      <div className="surface rounded-xl border border-dark-600/40 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-cyber-400" />
          <h2 className="font-semibold text-white text-sm">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-dark-200 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3.5 py-2.5 rounded-lg bg-dark-800/50 border border-dark-600/50 text-dark-300 text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-200 mb-1.5">Display name</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your name or handle"
              className="w-full px-3.5 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-cyber-400/50 focus:ring-1 focus:ring-cyber-400/20 transition-all"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3 items-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
          {saved && <span className="text-cyber-400 text-sm">Changes saved!</span>}
        </div>
      </div>
    </div>
  );
}
