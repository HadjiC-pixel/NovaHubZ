import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Copy, Check, Loader2, Clock, Infinity, Hash } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateLicenseKey, formatDate, getExpiryLabel, copyToClipboard } from '../../lib/utils';
import type { LicenseKey, Script } from '../../lib/supabase';

function KeyRow({ licenseKey, onRevoke, onDelete }: {
  licenseKey: LicenseKey;
  onRevoke: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(licenseKey.key_string);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiryLabel = getExpiryLabel(licenseKey);
  const isExpired = licenseKey.expiry_type === 'timed' && licenseKey.expires_at && new Date(licenseKey.expires_at) < new Date();

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
      licenseKey.is_active && !isExpired
        ? 'surface border-dark-600/40 hover:border-dark-500/60'
        : 'bg-dark-900/30 border-dark-700/30 opacity-60'
    }`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${licenseKey.is_active && !isExpired ? 'bg-cyber-400 animate-pulse-slow' : 'bg-dark-500'}`} />
        <code className="text-sm font-mono text-cyber-400/90 truncate flex-1">{licenseKey.key_string}</code>
        <button onClick={handleCopy} className="btn-ghost p-1 rounded flex-shrink-0">
          {copied ? <Check className="w-3.5 h-3.5 text-cyber-400" /> : <Copy className="w-3.5 h-3.5 text-dark-400" />}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        {/* Expiry badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
          isExpired
            ? 'bg-red-500/10 text-red-400 border-red-500/20'
            : 'bg-dark-700/50 text-dark-300 border-dark-600/30'
        }`}>
          {licenseKey.expiry_type === 'permanent' && <Infinity className="w-3 h-3" />}
          {licenseKey.expiry_type === 'timed' && <Clock className="w-3 h-3" />}
          {licenseKey.expiry_type === 'execution_count' && <Hash className="w-3 h-3" />}
          {expiryLabel}
        </div>

        {/* Executions */}
        {licenseKey.expiry_type === 'execution_count' && (
          <div className="text-xs text-dark-400 font-mono">
            {licenseKey.executions_used}/{licenseKey.max_executions ?? '?'} used
          </div>
        )}

        {/* Status badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
          licenseKey.is_active && !isExpired
            ? 'bg-cyber-400/10 text-cyber-400 border-cyber-400/20'
            : 'bg-dark-600/20 text-dark-400 border-dark-600/30'
        }`}>
          {isExpired ? 'Expired' : licenseKey.is_active ? 'Active' : 'Revoked'}
        </div>

        {/* Created */}
        <span className="text-xs text-dark-500 hidden sm:block">{formatDate(licenseKey.created_at)}</span>

        {/* Actions */}
        <div className="flex gap-1">
          {licenseKey.is_active && !isExpired && (
            <button
              onClick={() => onRevoke(licenseKey.id)}
              className="btn-ghost p-1.5 rounded-lg text-xs hover:text-yellow-400"
              title="Revoke key"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(licenseKey.id)}
            className="btn-ghost p-1.5 rounded-lg hover:text-red-400"
            title="Delete key"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Keys() {
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [expiryType, setExpiryType] = useState<'permanent' | 'timed' | 'execution_count'>('permanent');
  const [expiryHours, setExpiryHours] = useState('24');
  const [maxExecutions, setMaxExecutions] = useState('100');
  const [scriptId, setScriptId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: k }, { data: s }] = await Promise.all([
      supabase.from('license_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('scripts').select('id, name').eq('user_id', user.id),
    ]);
    setKeys(k ?? []);
    setScripts((s ?? []) as Script[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    const qty = Math.min(Math.max(parseInt(quantity) || 1, 1), 20);
    const newKeys = [];

    for (let i = 0; i < qty; i++) {
      const keyString = generateLicenseKey();
      const expiresAt = expiryType === 'timed'
        ? new Date(Date.now() + parseInt(expiryHours) * 3600000).toISOString()
        : null;
      const maxExec = expiryType === 'execution_count' ? parseInt(maxExecutions) || 100 : null;

      newKeys.push({
        user_id: user.id,
        key_string: keyString,
        script_id: scriptId || null,
        expiry_type: expiryType,
        expires_at: expiresAt,
        max_executions: maxExec,
      });
    }

    const { data, error } = await supabase.from('license_keys').insert(newKeys).select();
    if (!error && data) {
      setKeys(prev => [...data, ...prev]);
      setShowForm(false);
    }
    setCreating(false);
  };

  const handleRevoke = async (id: string) => {
    await supabase.from('license_keys').update({ is_active: false }).eq('id', id);
    setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: false } : k));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('license_keys').delete().eq('id', id);
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  const activeCount = keys.filter(k => k.is_active).length;

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">License Keys</h1>
          <p className="text-dark-300 text-sm mt-1">
            {activeCount} active key{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Generate keys</span>
          <span className="sm:hidden">Generate</span>
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-8 surface rounded-xl border border-dark-600/40 p-5 sm:p-6 space-y-5 animate-fade-in">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Key className="w-4 h-4 text-cyber-400" />
            Generate license keys
          </h2>

          {/* Expiry type */}
          <div>
            <label className="block text-sm text-dark-200 mb-2">Expiry type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'permanent', label: 'Permanent', icon: Infinity },
                { value: 'timed', label: 'Time-based', icon: Clock },
                { value: 'execution_count', label: 'Exec limit', icon: Hash },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setExpiryType(value as typeof expiryType)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs transition-all ${
                    expiryType === value
                      ? 'border-cyber-400/40 bg-cyber-400/10 text-cyber-400'
                      : 'border-dark-600/40 text-dark-300 hover:border-dark-500/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {expiryType === 'timed' && (
              <div>
                <label className="block text-sm text-dark-200 mb-1.5">Expires after (hours)</label>
                <input
                  type="number"
                  value={expiryHours}
                  onChange={e => setExpiryHours(e.target.value)}
                  min="1"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white text-sm focus:outline-none focus:border-cyber-400/50 focus:ring-1 focus:ring-cyber-400/20 transition-all"
                />
              </div>
            )}
            {expiryType === 'execution_count' && (
              <div>
                <label className="block text-sm text-dark-200 mb-1.5">Max executions</label>
                <input
                  type="number"
                  value={maxExecutions}
                  onChange={e => setMaxExecutions(e.target.value)}
                  min="1"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white text-sm focus:outline-none focus:border-cyber-400/50 focus:ring-1 focus:ring-cyber-400/20 transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-dark-200 mb-1.5">Quantity (max 20)</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                min="1"
                max="20"
                className="w-full px-3.5 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white text-sm focus:outline-none focus:border-cyber-400/50 focus:ring-1 focus:ring-cyber-400/20 transition-all"
              />
            </div>
          </div>

          {/* Script binding */}
          {scripts.length > 0 && (
            <div>
              <label className="block text-sm text-dark-200 mb-1.5">Bind to script (optional)</label>
              <select
                value={scriptId}
                onChange={e => setScriptId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white text-sm focus:outline-none focus:border-cyber-400/50 focus:ring-1 focus:ring-cyber-400/20 transition-all"
              >
                <option value="">Any script</option>
                {scripts.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate {parseInt(quantity) > 1 ? `${quantity} keys` : 'key'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Keys list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)}
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-16">
          <Key className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No keys yet</h3>
          <p className="text-dark-400 text-sm mb-4">Generate your first license key to gate script access.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Generate key</button>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map(k => (
            <KeyRow key={k.id} licenseKey={k} onRevoke={handleRevoke} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
