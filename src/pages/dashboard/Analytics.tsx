import { useEffect, useState, useCallback } from 'react';
import { Activity, TrendingUp, FileCode2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRelativeTime } from '../../lib/utils';
import type { Script } from '../../lib/supabase';

type Execution = {
  id: string;
  script_id: string;
  key_used: string | null;
  user_agent: string;
  success: boolean;
  executed_at: string;
};

export default function Analytics() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: s } = await supabase
      .from('scripts')
      .select('*')
      .eq('user_id', user.id)
      .order('executions', { ascending: false });

    const scriptIds = (s ?? []).map((sc: Script) => sc.id);

    let execs: Execution[] = [];
    if (scriptIds.length > 0) {
      const { data: e } = await supabase
        .from('script_executions')
        .select('id, script_id, key_used, user_agent, success, executed_at')
        .in('script_id', scriptIds)
        .order('executed_at', { ascending: false })
        .limit(50);
      execs = (e ?? []) as Execution[];
    }

    setScripts(s ?? []);
    setExecutions(execs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalExec = scripts.reduce((sum, s) => sum + s.executions, 0);
  const successRate = executions.length > 0
    ? Math.round((executions.filter(e => e.success).length / executions.length) * 100)
    : 100;
  const topScript = scripts[0];

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-dark-300 text-sm mt-1">Execution metrics and script performance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Executions', value: totalExec, icon: Activity, color: 'text-cyber-400' },
          { label: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Active Scripts', value: scripts.filter(s => s.is_active).length, icon: FileCode2, color: 'text-electric-400' },
          { label: 'Logged Events', value: executions.length, icon: Clock, color: 'text-dark-200' },
        ].map(stat => (
          <div key={stat.label} className="surface rounded-xl p-4 border border-dark-600/40">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
