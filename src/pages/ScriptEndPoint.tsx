import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, AlertTriangle } from 'lucide-react';

// This page handles browser visits to /obf/e/:scriptId
// Real executor requests go directly to the Supabase edge function
// Browser visits are detected and redirected to the landing page
export default function ScriptEndpoint() {
  const { scriptId } = useParams<{ scriptId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Mimic server-side behavior: detect browser visits and redirect
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-6">
          <Shield className="w-16 h-16 text-cyber-400/20 mx-auto" />
          <AlertTriangle className="w-7 h-7 text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Executor-only endpoint</h1>
        <p className="text-dark-300 text-sm leading-relaxed mb-6">
          This endpoint <span className="text-white font-mono">/obf/e/{scriptId}</span> is designed
          for Lua executor access only. Browser visits are not permitted.
        </p>

        <div className="surface rounded-xl border border-dark-600/40 p-4 mb-6 text-left">
          <p className="text-dark-400 text-xs font-mono mb-2">// Required execution pattern:</p>
          <div className="code-block text-xs leading-relaxed">
            <span className="text-dark-400">-- Set your key first</span>
            <br />
            <span className="text-cyber-400">_G.SudoKey</span>
            <span className="text-white"> = </span>
            <span className="text-yellow-400">"your-license-key"</span>
            <br />
            <br />
            <span className="text-dark-400">-- Then load the script</span>
            <br />
            <span className="text-white">loadstring</span>
            <span className="text-dark-300">(</span>
            <span className="text-white">game</span>
            <span className="text-dark-300">:</span>
            <span className="text-electric-400">HttpGet</span>
            <span className="text-dark-300">(</span>
            <span className="text-cyber-400">"{window.location.href}"</span>
            <span className="text-dark-300">))()</span>
          </div>
        </div>

        <p className="text-dark-500 text-xs mb-4">Redirecting to home in 3 seconds...</p>

        <button
          onClick={() => navigate('/')}
          className="btn-primary text-sm px-6"
        >
          Go to Nova Hub Z Protect
