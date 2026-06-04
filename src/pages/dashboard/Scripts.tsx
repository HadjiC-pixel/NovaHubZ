import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, Code2, Loader2, Copy, Check, Trash2, ToggleLeft,
  ToggleRight, RefreshCw, FileCode2, Plus, X, ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { obfuscateLua, generateScriptKey, buildLoadstring } from '../../lib/obfuscation';
import { formatDate, copyToClipboard, truncate } from '../../lib/utils';
import type { Script } from '../../lib/supabase';

function ScriptCard({
  script,
  onToggle,
  onDelete,
  onUpdate,
}: {
  script: Script;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newCode, setNewCode] = useState(script.original_code);
  const [updating, setUpdating] = useState(false);
  const loadstring = buildLoadstring(script.script_key);

  const handleCopy = async () => {
    await copyToClipboard(loadstring);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    await onUpdate(script.id, newCode);
    setUpdating(false);
    setEditing(false);
  };

  return (
    <div className="surface rounded-xl border border-dark-600/40 hover:border-dark-500/60 transition-all duration-200 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${script.is_active ? 'bg-cyber-400 animate-pulse-slow' : 'bg-dark-400'}`} />
              <h3 className="font-semibold text-white text-sm truncate">{script.name}</h3>
            </div>
            <p className="text-xs text-dark-400 ml-4">Created {formatDate(script.created_at)}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onToggle(script.id, !script.is_active)}
              className="btn-ghost p-1.5 rounded-lg"
              title={script.is_active ? 'Deactivate' : 'Activate'}
            >
              {script.is_active
                ? <ToggleRight className="w-4 h-4 text-cyber-400" />
                : <ToggleLeft className="w-4 h-4 text-dark-400" />
              }
            </button>
            <button
              onClick={() => setEditing(!editing)}
              className="btn-ghost p-1.5 rounded-lg"
              title="Update source code"
            >
              <RefreshCw className="w-4 h-4 text-dark-300" />
            </button>
            <button
              onClick={() => onDelete(script.id)}
              className="btn-ghost p-1.5 rounded-lg hover:text-red-400"
              title="Delete script"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 mb-3">
          <div className="text-xs text-dark-400">
            <span className="text-white font-medium font-mono">{script.executions}</span>
            {' '}executions
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${script.is_active ? 'bg-cyber-400/10 text-cyber-400 border border-cyber-400/20' : 'bg-dark-600/30 text-dark-400 border border-dark-600/30'}`}>
            {script.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>

        {/* Loadstring */}
        <div className="bg-dark-900 rounded-lg p-3 flex items-center gap-2 border border-dark-600/30">
          <code className="text-xs font-mono text-cyber-400/90 flex-1 truncate">
            {truncate(loadstring, 60)}
          </code>
          <button onClick={handleCopy} className="btn-ghost p-1 rounded flex-shrink-0">
            {copied ? <Check className="w-3.5 h-3.5 text-cyber-400" /> : <Copy className="w-3.5 h-3.5 text-dark-400" />}
          </button>
        </div>
      </div>

      {/* Inline code editor */}
      {editing && (
        <div className="border-t border-dark-600/30 p-4 space-y-3 bg-dark-900/50">
          <p className="text-xs text-dark-300 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" />
            Update source — loadstring URL stays the same
          </p>
          <textarea
            value={newCode}
            onChange={e => setNewCode(e.target.value)}
            className="w-full h-48 bg-dark-950 border border-dark-600 rounded-lg p-3 font-mono text-xs text-white resize-y focus:outline-none focus:border-cyber-400/40 focus:ring-1 focus:ring-cyber-400/10 transition-all"
            placeholder="-- Paste updated Lua code here..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              disabled={updating || !newCode.trim()}
              className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Update script
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-4 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Scripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [scriptName, setScriptName] = useState('');
  const [code, setCode] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [newScript, setNewScript] = useState<Script | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadScripts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('scripts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setScripts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadScripts(); }, [loadScripts]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.lua') || file.type === 'text/plain')) {
      const reader = new FileReader();
      reader.onload = (ev) => setCode(ev.target?.result as string ?? '');
      reader.readAsText(file);
      if (!scriptName) setScriptName(file.name.replace('.lua', ''));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCode(ev.target?.result as string ?? '');
    reader.readAsText(file);
    if (!scriptName) setScriptName(file.name.replace('.lua', ''));
  };

  const handleGenerate = async () => {
    if (!code.trim()) { setError('Please enter Lua code.'); return; }
    setError('');
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    const scriptKey = generateScriptKey();
    const obfuscated = obfuscateLua(code);
    const name = scriptName.trim() || 'Untitled Script';

    const { data, error: err } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        name,
        original_code: code,
        obfuscated_code: obfuscated,
        script_key: scriptKey,
      })
      .select()
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setNewScript(data);
      setScripts(prev => [data, ...prev]);
      setCode('');
      setScriptName('');
      setShowUpload(false);
    }
    setUploading(false);
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from('scripts').update({ is_active: active }).eq('id', id);
    setScripts(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('scripts').delete().eq('id', id);
    setScripts(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdate = async (id: string, newCode: string) => {
    const obfuscated = obfuscateLua(newCode);
    await supabase
      .from('scripts')
      .update({ original_code: newCode, obfuscated_code: obfuscated, updated_at: new Date().toISOString() })
      .eq('id', id);
    setScripts(prev => prev.map(s => s.id === id ? { ...s, original_code: newCode, obfuscated_code: obfuscated } : s));
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Scripts</h1>
          <p className="text-dark-300 text-sm mt-1">Manage your protected Lua scripts.</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New script</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* New script result */}
      {newScript && (
        <div className="mb-6 p-4 rounded-xl border border-cyber-400/30 bg-cyber-400/5 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-cyber-400 font-medium text-sm flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Script protected successfully!
              </p>
              <p className="text-dark-300 text-xs mt-1 mb-2">Your loadstring URL:</p>
              <code className="text-xs font-mono text-white bg-dark-900 px-3 py-1.5 rounded-lg border border-dark-600/40 block break-all">
                {buildLoadstring(newScript.script_key)}
              </code>
            </div>
            <button onClick={() => setNewScript(null)} className="btn-ghost p-1 rounded flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload panel */}
      {showUpload && (
        <div className="mb-8 surface rounded-xl border border-dark-600/40 p-5 sm:p-6 animate-fade-in">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyber-400" />
            Upload & protect
          </h2>

          <div className="mb-4">
            <label className="block text-sm text-dark-200 mb-1.5">Script name</label>
            <input
              value={scriptName}
              onChange={e => setScriptName(e.target.value)}
              placeholder="My awesome script"
              className="w-full px-3.5 py-2.5 rounded-lg bg-dark-800 border border-dark-600 text-white placeholder-dark-400 text-sm focus:outline-none focus:border-cyber-400/50 focus:ring-1 focus:ring-cyber-400/20 transition-all"
            />
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-4 ${
              dragOver
                ? 'border-cyber-400/60 bg-cyber-400/5'
                : 'border-dark-600/60 hover:border-dark-500/80 hover:bg-dark-800/30'
            }`}
          >
            <Upload className={`w-7 h-7 mx-auto mb-2 transition-colors ${dragOver ? 'text-cyber-400' : 'text-dark-400'}`} />
            <p className="text-dark-300 text-sm">Drop a .lua file or <span className="text-cyber-400">click to browse</span></p>
            <p className="text-dark-500 text-xs mt-1">Or paste your code below</p>
            <input ref={fileRef} type="file" accept=".lua,.txt" onChange={handleFileInput} className="hidden" />
          </div>

          {/* Code textarea */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-dark-200">Lua source code</label>
              <div className="flex items-center gap-1 text-dark-500 text-xs">
                <Code2 className="w-3 h-3" />
                .lua
              </div>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={`-- Paste your Lua code here\nprint("Hello from my protected script!")\n\n-- This will be obfuscated and key-gated`}
              className="w-full h-56 bg-dark-900 border border-dark-600 rounded-lg p-4 font-mono text-xs text-white resize-y focus:outline-none focus:border-cyber-400/40 focus:ring-1 focus:ring-cyber-400/10 transition-all placeholder-dark-500"
            />
          </div>

          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={uploading || !code.trim()}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Generate Protected Loadstring
            </button>
            <button onClick={() => { setShowUpload(false); setCode(''); setScriptName(''); setError(''); }} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Scripts grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl shimmer" />
          ))}
        </div>
      ) : scripts.length === 0 ? (
        <div className="text-center py-16">
          <FileCode2 className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No scripts yet</h3>
          <p className="text-dark-400 text-sm mb-4">Upload your first Lua script to get started.</p>
          <button onClick={() => setShowUpload(true)} className="btn-primary text-sm">
            Upload first script
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scripts.map(script => (
            <ScriptCard
              key={script.id}
              script={script}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
